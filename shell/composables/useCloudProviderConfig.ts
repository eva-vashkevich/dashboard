import { ref, computed, ComputedRef } from 'vue';
import { Store } from 'vuex';
import semver from 'semver';
import { set, get } from '@shell/utils/object';
import { base64Encode } from '@shell/utils/crypto';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SECRET, HCI } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';
import { DEFAULT_COMMON_BASE_PATH, DEFAULT_SUBDIRS } from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig.vue';
import { HARVESTER } from '@shell/edit/provisioning.cattle.io.cluster/shared';

const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';

export interface UseCloudProviderConfigProps {
  chartVersions: ComputedRef<Record<string, any>>;
}

/**
 * Owns the Harvester CSI/CCM chart version compatibility range and derives whether the currently
 * installed Harvester cloud-provider charts satisfy it.
 *
 * Deliberately does NOT own handleVsphereCpiSecret/handleVsphereCsiSecret (thin delegations that
 * hand the whole component instance to VsphereUtils - there's nothing to extract).
 */
export function useCloudProviderConfig(props: UseCloudProviderConfigProps) {
  const harvesterVersionRange = ref<Record<string, string>>({});

  const isHarvesterIncompatible = computed(() => {
    let ccmRke2Version = (props.chartVersions.value['harvester-cloud-provider'] || {})['version'];
    let csiRke2Version = (props.chartVersions.value['harvester-csi-driver'] || {})['version'];

    const ccmVersion = harvesterVersionRange.value?.['harvester-cloud-provider'];
    const csiVersion = harvesterVersionRange.value?.['harvester-csi-provider'];

    if ((ccmRke2Version || '').endsWith('00')) {
      ccmRke2Version = ccmRke2Version.slice(0, -2);
    }

    if ((csiRke2Version || '').endsWith('00')) {
      csiRke2Version = csiRke2Version.slice(0, -2);
    }

    if (ccmVersion && csiVersion) {
      if (semver.satisfies(ccmRke2Version, ccmVersion) &&
        semver.satisfies(csiRke2Version, csiVersion)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  });

  return {
    harvesterVersionRange,
    isHarvesterIncompatible,
  };
}

/**
 * Create a secret referencing the Harvester cluster kubeconfig, for use in rkeConfig.
 *
 * Standalone (not part of the composable's returned object) because it's only ever called from
 * `setHarvesterChartValues` below, which itself has to be a standalone function - see that
 * function's own comment for why.
 */
export async function createKubeconfigSecret(store: Store<any>, clusterName: string, kubeconfig = ''): Promise<any> {
  const secret = await store.dispatch('management/create', {
    type:     SECRET,
    metadata: {
      namespace: 'fleet-default', generateName: 'harvesterconfig', annotations: { [CAPI_ANNOTATIONS.SECRET_AUTH]: clusterName, [CAPI_ANNOTATIONS.SECRET_WILL_DELETE]: 'true' }
    },
    data: { credential: base64Encode(kubeconfig) }
  });

  return secret.save({ url: '/v1/secrets', method: 'POST' });
}

export interface SetHarvesterChartValuesOptions {
  store: Store<any>;
  t: (key: string, args?: unknown) => string;
  agentConfig: Record<string, any>;
  credential: any;
  isCreate: boolean;
  isEdit: boolean;
  liveValue: any;
  value: any;
  machinePools: any[] | undefined;
  userChartValues: Record<string, any>;
  chartVersionKey: (name: string) => string;
  errors: string[];
}

/**
 * Deliberately NOT part of the composable's returned object: it needs `chartVersionKey` (which
 * stays on the consuming component - see useChartAddons.ts) and several other values that only
 * exist as Options API state on the consumer (credential, machinePools, errors, etc.), so it takes
 * them as parameters rather than trying to resolve them itself - same "thin wrapper calls a pure
 * exported function" pattern as getDefaultVersion/syncMachineConfigWithLatest/saveRoleBindings.
 */
export async function setHarvesterChartValues(options: SetHarvesterChartValuesOptions): Promise<void> {
  const {
    store, t, agentConfig, credential, isCreate, isEdit, liveValue, value, machinePools, userChartValues, chartVersionKey, errors,
  } = options;

  const isHarvester = agentConfig?.['cloud-provider-name'] === HARVESTER;

  if (!isHarvester) {
    return;
  }
  try {
    const clusterId = get(credential, 'decodedData.clusterId') || '';
    const isUpgrade = isEdit && liveValue?.spec?.kubernetesVersion !== value?.spec?.kubernetesVersion;

    if (!value?.metadata?.name) {
      const err = t('cluster.harvester.kubeconfigSecret.nameRequired');

      throw new Error(err);
    }

    if (clusterId && (isCreate || isUpgrade)) {
      const namespace = machinePools?.[0]?.config?.vmNamespace;

      const res = await store.dispatch('management/request', {
        url:    `/k8s/clusters/${ clusterId }/v1/harvester/kubeconfig`,
        method: 'POST',
        data:   {
          csiClusterRoleName: 'harvesterhci.io:csi-driver',
          clusterRoleName:    'harvesterhci.io:cloudprovider',
          namespace,
          serviceAccountName: value.metadata.name,
        },
      });

      const kubeconfig = res.data;

      const harvesterKubeconfigSecret = await createKubeconfigSecret(store, value.metadata.name, kubeconfig);

      agentConfig['cloud-provider-config'] = `secret://fleet-default:${ harvesterKubeconfigSecret?.metadata?.name }`;

      const harvesterCloudProviderKey = chartVersionKey(HARVESTER_CLOUD_PROVIDER);

      if (isCreate) {
        set(userChartValues, `'${ harvesterCloudProviderKey }'.global.cattle.clusterName`, value.metadata.name);
      }

      const distroSubdir = value?.spec?.kubernetesVersion?.includes('k3s') ? DEFAULT_SUBDIRS.K8S_DISTRO_K3S : DEFAULT_SUBDIRS.K8S_DISTRO_RKE2;
      const distroRoot = value?.spec?.rkeConfig?.dataDirectories?.k8sDistro?.length ? value?.spec?.rkeConfig?.dataDirectories?.k8sDistro : `${ DEFAULT_COMMON_BASE_PATH }/${ distroSubdir }`;

      set(userChartValues, `'${ harvesterCloudProviderKey }'.cloudConfigPath`, `${ distroRoot }/etc/config-files/cloud-provider-config`);
    }
  } catch (e: any) {
    const cause = e.errors ? e.errors.join('; ') : e?.message;
    const msg = t('cluster.harvester.kubeconfigSecret.error', { err: cause });

    errors.push(msg);
    throw new Error(msg);
  }
}

export interface SetHarvesterDefaultCloudProviderOptions {
  isHarvesterDriver: boolean;
  mode: string;
  agentConfig: Record<string, any>;
  isHarvesterExternalCredential: boolean;
  isHarvesterIncompatible: boolean;
}

/**
 * Standalone (not part of the composable's returned object): a same-named property returned from
 * setup() would collide with the consuming component's own `setHarvesterDefaultCloudProvider`
 * Options API method (its bound reference is what `setHarvesterVersionRange` below calls).
 */
export function setHarvesterDefaultCloudProvider(options: SetHarvesterDefaultCloudProviderOptions): void {
  const {
    isHarvesterDriver, mode, agentConfig, isHarvesterExternalCredential, isHarvesterIncompatible,
  } = options;

  if (isHarvesterDriver &&
    mode === _CREATE &&
    agentConfig &&
    !agentConfig['cloud-provider-name'] &&
    !isHarvesterExternalCredential &&
    !isHarvesterIncompatible
  ) {
    agentConfig['cloud-provider-name'] = HARVESTER;
  } else {
    agentConfig['cloud-provider-name'] = '';
  }
}

/**
 * Fetches the Harvester CSI/CCM version-compatibility range for an imported Harvester cluster
 * credential. Returns `undefined` (rather than an empty range) when there's nothing to fetch -
 * an imported-cluster credential wasn't selected - so the caller knows to leave whatever range is
 * already staged untouched, matching the original inline behavior.
 */
export async function fetchHarvesterVersionRange(store: Store<any>, credential: any): Promise<Record<string, string> | undefined> {
  const clusterId = credential?.decodedData?.clusterId;
  const clusterType = credential?.decodedData?.clusterType;

  if (!clusterId || clusterType !== 'imported') {
    return undefined;
  }

  const url = `/k8s/clusters/${ clusterId }/v1`;
  const res = await store.dispatch('cluster/request', { url: `${ url }/${ HCI.SETTING }s` });

  const version = (res?.data || []).find((s: any) => s.id === 'harvester-csi-ccm-versions');

  return version ? JSON.parse(version.value || version.default || '{}') : {};
}
