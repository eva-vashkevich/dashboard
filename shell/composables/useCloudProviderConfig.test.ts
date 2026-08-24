import { ref, computed } from 'vue';

import {
  useCloudProviderConfig, createKubeconfigSecret, setHarvesterChartValues, setHarvesterDefaultCloudProvider, fetchHarvesterVersionRange, SetHarvesterChartValuesOptions
} from '@shell/composables/useCloudProviderConfig';

// `shared.ts` builds INGRESS_OPTIONS at module scope using requireAsset(), which needs webpack's
// require.context - only available when this module is loaded transitively through a .vue SFC
// (via the vue-jest transform), not from a plain .ts test file. Mocked here rather than touching
// shared test infra, matching this session's convention for pre-existing cross-package gaps.
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ HARVESTER: 'harvester' }));

describe('composable: useCloudProviderConfig', () => {
  describe('isHarvesterIncompatible', () => {
    it('returns false when no Harvester version range info is present', () => {
      const chartVersions = computed(() => ({}));
      const { isHarvesterIncompatible } = useCloudProviderConfig({ chartVersions });

      expect(isHarvesterIncompatible.value).toBe(false);
    });

    it('returns false when installed chart versions satisfy the Harvester version range', () => {
      const chartVersions = computed(() => ({
        'harvester-cloud-provider': { version: '1.2.3' },
        'harvester-csi-driver':     { version: '1.2.3' },
      }));
      const { isHarvesterIncompatible, harvesterVersionRange } = useCloudProviderConfig({ chartVersions });

      harvesterVersionRange.value = {
        'harvester-cloud-provider': '>=1.0.0',
        'harvester-csi-provider':   '>=1.0.0',
      };

      expect(isHarvesterIncompatible.value).toBe(false);
    });

    it('returns true when installed chart versions do not satisfy the Harvester version range', () => {
      const chartVersions = computed(() => ({
        'harvester-cloud-provider': { version: '0.5.0' },
        'harvester-csi-driver':     { version: '0.5.0' },
      }));
      const { isHarvesterIncompatible, harvesterVersionRange } = useCloudProviderConfig({ chartVersions });

      harvesterVersionRange.value = {
        'harvester-cloud-provider': '>=1.0.0',
        'harvester-csi-provider':   '>=1.0.0',
      };

      expect(isHarvesterIncompatible.value).toBe(true);
    });

    it('strips a trailing "00" patch suffix from the chart version before comparing', () => {
      const chartVersions = computed(() => ({
        'harvester-cloud-provider': { version: '1.2.300' },
        'harvester-csi-driver':     { version: '1.2.300' },
      }));
      const { isHarvesterIncompatible, harvesterVersionRange } = useCloudProviderConfig({ chartVersions });

      harvesterVersionRange.value = {
        'harvester-cloud-provider': '1.2.3',
        'harvester-csi-provider':   '1.2.3',
      };

      expect(isHarvesterIncompatible.value).toBe(false);
    });

    it('recomputes reactively when chartVersions changes', () => {
      const versionsRef = ref<Record<string, any>>({});
      const chartVersions = computed(() => versionsRef.value);
      const { isHarvesterIncompatible, harvesterVersionRange } = useCloudProviderConfig({ chartVersions });

      harvesterVersionRange.value = {
        'harvester-cloud-provider': '>=1.0.0',
        'harvester-csi-provider':   '>=1.0.0',
      };

      // No installed chart versions yet to satisfy the range against - counts as incompatible.
      expect(isHarvesterIncompatible.value).toBe(true);

      versionsRef.value = {
        'harvester-cloud-provider': { version: '1.5.0' },
        'harvester-csi-driver':     { version: '1.5.0' },
      };

      expect(isHarvesterIncompatible.value).toBe(false);
    });
  });

  describe('createKubeconfigSecret', () => {
    it('creates then saves a fleet-default secret with the base64-encoded kubeconfig', async() => {
      const save = jest.fn().mockResolvedValue({ metadata: { name: 'harvesterconfig-abc123' } });
      const store: any = { dispatch: jest.fn().mockResolvedValue({ save }) };

      const result = await createKubeconfigSecret(store, 'my-cluster', 'kubeconfig-contents');

      expect(store.dispatch).toHaveBeenCalledWith('management/create', expect.objectContaining({
        metadata: expect.objectContaining({ namespace: 'fleet-default', generateName: 'harvesterconfig' }),
        data:     { credential: Buffer.from('kubeconfig-contents').toString('base64') },
      }));
      expect(save).toHaveBeenCalledWith({ url: '/v1/secrets', method: 'POST' });
      expect(result).toStrictEqual({ metadata: { name: 'harvesterconfig-abc123' } });
    });
  });

  describe('setHarvesterChartValues', () => {
    const baseOptions = (): SetHarvesterChartValuesOptions => ({
      store:           { dispatch: jest.fn() } as any,
      t:               (key: string) => key,
      agentConfig:     { 'cloud-provider-name': 'harvester' },
      credential:      { decodedData: { clusterId: 'cluster-1' } },
      isCreate:        true,
      isEdit:          false,
      liveValue:       {},
      value:           { metadata: { name: 'my-cluster' }, spec: { kubernetesVersion: 'v1.28.0+rke2r1' } },
      machinePools:    [{ config: { vmNamespace: 'default' } }],
      userChartValues: {} as Record<string, any>,
      chartVersionKey: (name: string) => name,
      errors:          [] as string[],
    });

    it('does nothing when the cloud provider is not harvester', async() => {
      const options = baseOptions();

      options.agentConfig = { 'cloud-provider-name': 'aws' };

      await setHarvesterChartValues(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('throws and does not dispatch when the cluster name is missing', async() => {
      const options = baseOptions();

      options.value = { metadata: {} };

      // The nameRequired error is thrown from inside the same try block that wraps and rethrows
      // as the generic kubeconfigSecret.error - so it surfaces via that wrapped message, and gets
      // recorded in `errors` like any other failure in this method.
      await expect(setHarvesterChartValues(options)).rejects.toThrow('cluster.harvester.kubeconfigSecret.error');
      expect(options.store.dispatch).not.toHaveBeenCalled();
      expect(options.errors).toStrictEqual(['cluster.harvester.kubeconfigSecret.error']);
    });

    it('does nothing when there is no Harvester cluster credential id', async() => {
      const options = baseOptions();

      options.credential = {};

      await setHarvesterChartValues(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('does nothing on edit when the kubernetes version has not changed (not an upgrade)', async() => {
      const options = baseOptions();

      options.isCreate = false;
      options.isEdit = true;
      options.liveValue = { spec: { kubernetesVersion: 'v1.28.0+rke2r1' } };

      await setHarvesterChartValues(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('fetches the kubeconfig, creates the secret, and stages chart values on create', async() => {
      const options = baseOptions();

      options.store.dispatch = jest.fn((action: string) => {
        if (action === 'management/request') {
          return Promise.resolve({ data: 'kubeconfig-contents' });
        }
        if (action === 'management/create') {
          return Promise.resolve({ save: jest.fn().mockResolvedValue({ metadata: { name: 'harvesterconfig-abc123' } }) });
        }
        throw new Error(`unexpected dispatch: ${ action }`);
      });

      await setHarvesterChartValues(options);

      expect(options.store.dispatch).toHaveBeenCalledWith('management/request', {
        url:    '/k8s/clusters/cluster-1/v1/harvester/kubeconfig',
        method: 'POST',
        data:   {
          csiClusterRoleName: 'harvesterhci.io:csi-driver',
          clusterRoleName:    'harvesterhci.io:cloudprovider',
          namespace:          'default',
          serviceAccountName: 'my-cluster',
        },
      });
      expect(options.agentConfig['cloud-provider-config']).toBe('secret://fleet-default:harvesterconfig-abc123');
      expect(options.userChartValues['harvester-cloud-provider'].global.cattle.clusterName).toBe('my-cluster');
      expect(options.userChartValues['harvester-cloud-provider'].cloudConfigPath).toBe('/var/lib/rancher/rke2/etc/config-files/cloud-provider-config');
    });

    it('does not stage the clusterName chart value on edit (only on create)', async() => {
      const options = baseOptions();

      options.isCreate = false;
      options.isEdit = true;
      options.liveValue = { spec: { kubernetesVersion: 'v1.27.0+rke2r1' } };
      options.store.dispatch = jest.fn((action: string) => {
        if (action === 'management/request') {
          return Promise.resolve({ data: 'kubeconfig-contents' });
        }

        return Promise.resolve({ save: jest.fn().mockResolvedValue({ metadata: { name: 'harvesterconfig-abc123' } }) });
      });

      await setHarvesterChartValues(options);

      expect(options.userChartValues['harvester-cloud-provider']?.global).toBeUndefined();
      expect(options.userChartValues['harvester-cloud-provider'].cloudConfigPath).toBeDefined();
    });

    it('records a formatted error and rethrows when the kubeconfig request fails', async() => {
      const options = baseOptions();

      options.store.dispatch = jest.fn().mockRejectedValue(new Error('network down'));

      await expect(setHarvesterChartValues(options)).rejects.toThrow('cluster.harvester.kubeconfigSecret.error');
      expect(options.errors).toStrictEqual(['cluster.harvester.kubeconfigSecret.error']);
    });
  });

  describe('setHarvesterDefaultCloudProvider', () => {
    const baseOptions = () => ({
      isHarvesterDriver:             true,
      mode:                          'create',
      agentConfig:                   {} as Record<string, any>,
      isHarvesterExternalCredential: false,
      isHarvesterIncompatible:       false,
    });

    it('sets the cloud provider to harvester when on the Harvester driver, creating, with no existing provider and no incompatibility', () => {
      const options = baseOptions();

      setHarvesterDefaultCloudProvider(options);

      expect(options.agentConfig['cloud-provider-name']).toBe('harvester');
    });

    it('clears the cloud provider when not on the Harvester driver', () => {
      const options = baseOptions();

      options.isHarvesterDriver = false;

      setHarvesterDefaultCloudProvider(options);

      expect(options.agentConfig['cloud-provider-name']).toBe('');
    });

    it('clears the cloud provider when the installed charts are Harvester-incompatible', () => {
      const options = baseOptions();

      options.isHarvesterIncompatible = true;

      setHarvesterDefaultCloudProvider(options);

      expect(options.agentConfig['cloud-provider-name']).toBe('');
    });
  });

  describe('fetchHarvesterVersionRange', () => {
    it('returns undefined without dispatching when there is no credential cluster id', async() => {
      const store: any = { dispatch: jest.fn() };

      const result = await fetchHarvesterVersionRange(store, {});

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns undefined without dispatching when the credential is not an imported cluster', async() => {
      const store: any = { dispatch: jest.fn() };

      const result = await fetchHarvesterVersionRange(store, { decodedData: { clusterId: 'cluster-1', clusterType: 'external' } });

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('parses and returns the range from the matching setting', async() => {
      const store: any = {
        dispatch: jest.fn().mockResolvedValue({
          data: [
            { id: 'unrelated-setting', value: '{}' },
            { id: 'harvester-csi-ccm-versions', value: '{"harvester-cloud-provider":">=1.0.0"}' },
          ]
        })
      };

      const result = await fetchHarvesterVersionRange(store, { decodedData: { clusterId: 'cluster-1', clusterType: 'imported' } });

      expect(store.dispatch).toHaveBeenCalledWith('cluster/request', { url: '/k8s/clusters/cluster-1/v1/harvesterhci.io.settings' });
      expect(result).toStrictEqual({ 'harvester-cloud-provider': '>=1.0.0' });
    });

    it('falls back to the setting default when value is empty', async() => {
      const store: any = {
        dispatch: jest.fn().mockResolvedValue({
          data: [{
            id: 'harvester-csi-ccm-versions', value: '', default: '{"harvester-cloud-provider":">=2.0.0"}'
          }]
        })
      };

      const result = await fetchHarvesterVersionRange(store, { decodedData: { clusterId: 'cluster-1', clusterType: 'imported' } });

      expect(result).toStrictEqual({ 'harvester-cloud-provider': '>=2.0.0' });
    });

    it('returns an empty range when no matching setting is found', async() => {
      const store: any = { dispatch: jest.fn().mockResolvedValue({ data: [] }) };

      const result = await fetchHarvesterVersionRange(store, { decodedData: { clusterId: 'cluster-1', clusterType: 'imported' } });

      expect(result).toStrictEqual({});
    });
  });
});
