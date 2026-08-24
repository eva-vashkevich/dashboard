import {
  useChartAddons, chartVersionKey, getChartValue, initAddons, showAddons, refreshComponentWithYamls, updateValues, syncChartValues, initYamlEditor, applyChartValues
} from '@shell/composables/useChartAddons';

const mockDispatch = jest.fn();

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: mockDispatch }) }));

describe('composable: useChartAddons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshYamls', () => {
    it('calls refresh on yaml-prefixed refs, ignoring others', () => {
      const yamlRef = { refresh: jest.fn() };
      const otherRef = { refresh: jest.fn() };
      const { refreshYamls } = useChartAddons();

      refreshYamls({ yamlEditor: yamlRef, somethingElse: otherRef });

      expect(yamlRef.refresh).toHaveBeenCalled();
      expect(otherRef.refresh).not.toHaveBeenCalled();
    });

    it('refreshes every entry when the ref is an array', () => {
      const first = { refresh: jest.fn() };
      const second = { refresh: jest.fn() };
      const { refreshYamls } = useChartAddons();

      refreshYamls({ yamlEditor: [first, second] });

      expect(first.refresh).toHaveBeenCalled();
      expect(second.refresh).toHaveBeenCalled();
    });

    it('tolerates an undefined ref entry without throwing', () => {
      const { refreshYamls } = useChartAddons();

      expect(() => refreshYamls({ yamlEditor: undefined })).not.toThrow();
    });
  });

  describe('showAddonConfirmation', () => {
    it('resolves with the value passed to the confirmation dialog callback', async() => {
      mockDispatch.mockImplementation((_action: string, opts: any) => {
        opts.resources[0](true);
      });
      const { showAddonConfirmation } = useChartAddons();

      const result = await showAddonConfirmation(['rke2-cilium'], 'v1.27.0', 'v1.28.0');

      expect(result).toBe(true);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/promptModal', expect.objectContaining({
        component:      'AddonConfigConfirmationDialog',
        componentProps: {
          addonNames: ['rke2-cilium'], previousKubeVersion: 'v1.27.0', newKubeVersion: 'v1.28.0'
        },
      }));
    });
  });

  describe('initial state', () => {
    it('defaults to empty addon state', () => {
      const {
        versionInfo, userChartValues, userChartValuesTemp, addonsRev, addonConfigValidation
      } = useChartAddons();

      expect(versionInfo.value).toStrictEqual({});
      expect(userChartValues.value).toStrictEqual({});
      expect(userChartValuesTemp.value).toStrictEqual({});
      expect(addonsRev.value).toBe(0);
      expect(addonConfigValidation.value).toStrictEqual({});
    });
  });

  describe('chartVersionKey', () => {
    it('returns a version-qualified key when a matching addon version exists', () => {
      expect(chartVersionKey('rke2-cilium', [{ name: 'rke2-cilium', version: '1.2.3' }])).toBe('rke2-cilium-1.2.3');
    });

    it('returns the plain chart name when there is no matching addon version', () => {
      expect(chartVersionKey('rke2-cilium', [])).toBe('rke2-cilium');
    });
  });

  describe('getChartValue', () => {
    const baseOptions = () => ({
      chartVersions:   {} as Record<string, any>,
      store:           { dispatch: jest.fn() } as any,
      versionInfo:     {} as Record<string, any>,
      userChartValues: {} as Record<string, any>,
      addonVersions:   [] as { name: string; version: string }[],
    });

    it('does nothing when there is no chart version entry for the chart', async() => {
      const options = baseOptions();

      await getChartValue('rke2-ingress-nginx', options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('fetches and stores version info, initializing empty user chart values', async() => {
      const versionInfo = { questions: [] };
      const options = baseOptions();

      options.chartVersions = { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } };
      options.store.dispatch = jest.fn().mockResolvedValue(versionInfo);

      await getChartValue('rke2-ingress-nginx', options);

      expect(options.store.dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', {
        repoType: 'cluster', repoName: 'rke2-charts', chartName: 'rke2-ingress-nginx', versionName: '1.0.0',
      });
      expect(options.versionInfo['rke2-ingress-nginx']).toBe(versionInfo);
      expect(options.userChartValues['rke2-ingress-nginx']).toStrictEqual({});
    });

    it('does not overwrite existing user chart values', async() => {
      const existing = { foo: 'bar' };
      const options = baseOptions();

      options.chartVersions = { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } };
      options.store.dispatch = jest.fn().mockResolvedValue({});
      options.userChartValues = { 'rke2-ingress-nginx': existing };

      await getChartValue('rke2-ingress-nginx', options);

      expect(options.userChartValues['rke2-ingress-nginx']).toBe(existing);
    });

    it('swallows dispatch errors without throwing', async() => {
      const options = baseOptions();

      options.chartVersions = { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } };
      options.store.dispatch = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(getChartValue('rke2-ingress-nginx', options)).resolves.toBeUndefined();
    });
  });

  describe('initAddons', () => {
    const baseOptions = () => ({
      addonNames:      ['rke2-cilium'],
      isK3s:           true,
      chartVersions:   {} as Record<string, any>,
      store:           { dispatch: jest.fn() } as any,
      versionInfo:     {} as Record<string, any>,
      userChartValues: {} as Record<string, any>,
      addonVersions:   [] as { name: string; version: string }[],
    });

    it('skips charts that already have version info cached', async() => {
      const options = baseOptions();

      options.versionInfo = { 'rke2-cilium': {} };

      await initAddons(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('skips the "none" CNI placeholder chart', async() => {
      const options = baseOptions();

      options.addonNames = ['none'];

      await initAddons(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });

    it('fetches remaining addon charts', async() => {
      const options = baseOptions();

      options.chartVersions = { 'rke2-cilium': { repo: 'rke2-charts', version: '1.0.0' } };

      await initAddons(options);

      expect(options.store.dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', expect.objectContaining({ chartName: 'rke2-cilium' }));
    });

    it('also fetches the ingress charts for RKE2 (not K3s) clusters', async() => {
      const options = baseOptions();

      options.addonNames = [];
      options.isK3s = false;
      options.chartVersions = {
        'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' },
        'rke2-traefik':       { repo: 'rke2-charts', version: '1.0.0' },
      };

      await initAddons(options);

      expect(options.store.dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', expect.objectContaining({ chartName: 'rke2-ingress-nginx' }));
      expect(options.store.dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', expect.objectContaining({ chartName: 'rke2-traefik' }));
    });

    it('does not fetch ingress charts for K3s clusters', async() => {
      const options = baseOptions();

      options.addonNames = [];

      await initAddons(options);

      expect(options.store.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('initYamlEditor', () => {
    it('merges the chart default values with the user-supplied override', () => {
      const options = {
        versionInfo:     { 'rke2-cilium': { values: { foo: 'default', bar: 'default' } } },
        userChartValues: { 'rke2-cilium': { foo: 'override' } },
        addonVersions:   [],
      };

      expect(initYamlEditor('rke2-cilium', options)).toStrictEqual({ foo: 'override', bar: 'default' });
    });

    it('keys the user override lookup by the version-qualified chart name', () => {
      const options = {
        versionInfo:     { 'rke2-cilium': { values: { foo: 'default' } } },
        userChartValues: { 'rke2-cilium-1.2.3': { foo: 'override' } },
        addonVersions:   [{ name: 'rke2-cilium', version: '1.2.3' }],
      };

      expect(initYamlEditor('rke2-cilium', options)).toStrictEqual({ foo: 'override' });
    });
  });

  describe('refreshComponentWithYamls', () => {
    it('refreshes the yaml refs of a single matched component', () => {
      const refreshYamls = jest.fn();
      const componentRefs = { yamlEditor: {} };

      refreshComponentWithYamls('tab-Basics', { refs: { 'tab-Basics': { $refs: componentRefs } }, refreshYamls });

      expect(refreshYamls).toHaveBeenCalledWith(componentRefs);
    });

    it('refreshes the yaml refs of the first matched component when the ref is an array', () => {
      const refreshYamls = jest.fn();
      const componentRefs = { yamlEditor: {} };

      refreshComponentWithYamls('addon-tab', { refs: { 'addon-tab': [{ $refs: componentRefs }] }, refreshYamls });

      expect(refreshYamls).toHaveBeenCalledWith(componentRefs);
    });

    it('does nothing when there is no matching ref', () => {
      const refreshYamls = jest.fn();

      refreshComponentWithYamls('missing', { refs: {}, refreshYamls });

      expect(refreshYamls).not.toHaveBeenCalled();
    });

    it('falls through to the empty array itself (an empty array is truthy) when the matched ref is an empty array', () => {
      const refreshYamls = jest.fn();

      refreshComponentWithYamls('addon-tab', { refs: { 'addon-tab': [] }, refreshYamls });

      expect(refreshYamls).toHaveBeenCalledWith(undefined);
    });
  });

  describe('showAddons', () => {
    it('stages temp chart values for each addon and refreshes the matching yaml component', () => {
      const refreshYamls = jest.fn();
      const options = {
        addonNames:          ['rke2-cilium', 'rke2-ingress-nginx'],
        versionInfo:         { 'rke2-cilium': { questions: [{}], values: { foo: 'default' } }, 'rke2-ingress-nginx': {} },
        userChartValues:     {},
        userChartValuesTemp: {} as Record<string, any>,
        addonVersions:       [],
        refs:                { 'tab-cni': { $refs: { yamlEditor: {} } } },
        refreshYamls,
      };

      showAddons('tab-cni', options);

      expect(options.userChartValuesTemp['rke2-cilium']).toStrictEqual({ foo: 'default' });
      expect(options.userChartValuesTemp['rke2-ingress-nginx']).toStrictEqual({});
      expect(refreshYamls).toHaveBeenCalled();
    });
  });

  describe('updateValues', () => {
    it('stages the values and syncs chart values for the addon', () => {
      const syncChartValues = jest.fn();
      const userChartValuesTemp: Record<string, any> = {};

      updateValues('rke2-cilium', { foo: 'bar' }, { userChartValuesTemp, syncChartValues });

      expect(userChartValuesTemp['rke2-cilium']).toStrictEqual({ foo: 'bar' });
      expect(syncChartValues).toHaveBeenCalledWith('rke2-cilium');
    });
  });

  describe('syncChartValues', () => {
    it('stores only the values that differ from the chart defaults, keyed by the version-qualified name', () => {
      const userChartValues: Record<string, any> = {};
      const options = {
        versionInfo:         { 'rke2-cilium': { values: { foo: 'default', bar: 'default' } } },
        userChartValuesTemp: { 'rke2-cilium': { foo: 'default', bar: 'changed' } },
        userChartValues,
        addonVersions:       [{ name: 'rke2-cilium', version: '1.2.3' }],
      };

      syncChartValues('rke2-cilium', options);

      expect(userChartValues['rke2-cilium-1.2.3']).toStrictEqual({ bar: 'changed' });
    });
  });

  describe('applyChartValues', () => {
    it('copies staged user values for every addon and rke2 chart into rkeConfig, skipping charts with no staged values', () => {
      const rkeConfig: Record<string, any> = {};
      const options = {
        addonNames:      ['rke2-cilium'],
        rke2Charts:      ['rke2-coredns'],
        userChartValues: { 'rke2-cilium': { foo: 'bar' } },
        addonVersions:   [],
      };

      applyChartValues(rkeConfig, options);

      expect(rkeConfig.chartValues).toStrictEqual({ 'rke2-cilium': { foo: 'bar' } });
    });

    it('resets chartValues on every call', () => {
      const rkeConfig: Record<string, any> = { chartValues: { stale: {} } };

      applyChartValues(rkeConfig, {
        addonNames: [], rke2Charts: [], userChartValues: {}, addonVersions: [],
      });

      expect(rkeConfig.chartValues).toStrictEqual({});
    });
  });
});
