import { ref } from 'vue';
import { useStore, Store } from 'vuex';
import isArray from 'lodash/isArray';
import { diff, mergeWithReplace } from '@shell/utils/object';

/**
 * Owns the addon/chart value cache (fetched chart info, user-supplied values, and per-addon
 * config validation state) used by the RKE2/K3s addons tab, plus the orchestration around it
 * (initAddons/getChartValue/chartVersionKey/applyChartValues and friends, below).
 *
 * That orchestration is exported as standalone functions rather than folded into the composable's
 * returned object: it all threads through `addonNames`/`rke2Charts`/`addonVersions` (derived from
 * CNI, cloud-provider config, and the selected kube version - cross-cutting concerns that live on
 * the consuming component) and, for a couple of them, `$refs` - none of which exist yet at
 * setup()-call time. Same "thin wrapper calls a pure exported function" pattern as
 * getDefaultVersion/syncMachineConfigWithLatest/setHarvesterChartValues.
 */
export function useChartAddons() {
  const store = useStore();

  /**
   * All info related to a specific version of the chart
   *
   * This includes chart itself, README and values
   *
   * { [chartName:string]: { chart: json, readme: string, values: json } }
   */
  const versionInfo = ref<Record<string, any>>({});
  const userChartValues = ref<Record<string, any>>({});
  const userChartValuesTemp = ref<Record<string, any>>({});
  const addonsRev = ref(0);
  const addonConfigValidation = ref<Record<string, boolean>>({}); // validation state of each addon config (boolean of whether codemirror's yaml lint passed)

  function refreshYamls(refs: Record<string, any>) {
    const keys = Object.keys(refs).filter((x) => x.startsWith('yaml'));

    for (const k of keys) {
      const entry = refs[k];
      const list = isArray(entry) ? entry : [entry];

      for (const component of list) {
        component?.refresh(); // `yaml` ref can be undefined on switching from Basic to Addon tab (Azure --> Amazon --> addon)
      }
    }
  }

  function showAddonConfirmation(addonNames: string[], previousKubeVersion: string, newKubeVersion: string): Promise<boolean> {
    return new Promise((resolve) => {
      store.dispatch('cluster/promptModal', {
        component:      'AddonConfigConfirmationDialog',
        componentProps: {
          addonNames,
          previousKubeVersion,
          newKubeVersion
        },
        resources: [(value: boolean) => resolve(value)]
      });
    });
  }

  return {
    versionInfo,
    userChartValues,
    userChartValuesTemp,
    addonsRev,
    addonConfigValidation,
    refreshYamls,
    showAddonConfirmation,
  };
}

export interface AddonVersion {
  name: string;
  version: string;
}

/**
 * A chart's cache/storage key is its name, qualified by its addon version when one is selected
 * (multiple versions of the same addon can be offered side by side).
 */
export function chartVersionKey(name: string, addonVersions: AddonVersion[]): string {
  const addonVersion = addonVersions.find((av) => av.name === name);

  return addonVersion ? `${ name }-${ addonVersion.version }` : name;
}

export interface GetChartValueOptions {
  chartVersions: Record<string, any>;
  store: Store<any>;
  versionInfo: Record<string, any>;
  userChartValues: Record<string, any>;
  addonVersions: AddonVersion[];
}

export async function getChartValue(chartName: string, options: GetChartValueOptions): Promise<void> {
  const {
    chartVersions, store, versionInfo, userChartValues, addonVersions,
  } = options;
  const entry = chartVersions[chartName];

  if (entry) {
    try {
      const res = await store.dispatch('catalog/getVersionInfo', {
        repoType:    'cluster',
        repoName:    entry.repo,
        chartName,
        versionName: entry.version,
      });

      versionInfo[chartName] = res;
      const key = chartVersionKey(chartName, addonVersions);

      if (!userChartValues[key]) {
        userChartValues[key] = {};
      }
    } catch (e) {
      console.error(`Failed to fetch or process chart info for ${ chartName }`); // eslint-disable-line no-console
    }
  }
}

export interface InitAddonsOptions extends GetChartValueOptions {
  addonNames: string[];
  isK3s: boolean;
}

/**
 * Ensure all chart information required to show addons is available
 *
 * This basically means
 * 1) That the full chart relating to the addon is fetched (which includes core chart, readme and values)
 * 2) We're ready to cache any values the user provides for each addon
 */
export async function initAddons(options: InitAddonsOptions): Promise<void> {
  const { addonNames, isK3s, versionInfo } = options;
  const ingressCharts = !isK3s ? ['rke2-ingress-nginx', 'rke2-traefik'] : [];

  for (const chartName of [...addonNames, ...ingressCharts]) {
    // prevent fetching of addon config for 'none' CNI option
    // https://github.com/rancher/dashboard/issues/10338
    if (versionInfo[chartName] || chartName.includes('none')) {
      continue;
    }

    await getChartValue(chartName, options);
  }
}

export interface InitYamlEditorOptions {
  versionInfo: Record<string, any>;
  userChartValues: Record<string, any>;
  addonVersions: AddonVersion[];
}

export function initYamlEditor(name: string, options: InitYamlEditorOptions): any {
  const { versionInfo, userChartValues, addonVersions } = options;
  const defaultChartValue = versionInfo[name];
  const key = chartVersionKey(name, addonVersions);

  return mergeWithReplace(defaultChartValue?.values, userChartValues[key]);
}

export interface RefreshComponentWithYamlsOptions {
  refs: Record<string, any>;
  refreshYamls: (refs: Record<string, any>) => void;
}

export function refreshComponentWithYamls(key: string, options: RefreshComponentWithYamlsOptions): void {
  const { refs, refreshYamls } = options;
  const component = refs[key];

  if (Array.isArray(component) && component.length > 0) {
    refreshYamls(component[0].$refs);
  } else if (component) {
    refreshYamls(component.$refs);
  }
}

export interface ShowAddonsOptions extends RefreshComponentWithYamlsOptions {
  addonNames: string[];
  versionInfo: Record<string, any>;
  userChartValues: Record<string, any>;
  userChartValuesTemp: Record<string, any>;
  addonVersions: AddonVersion[];
}

export function showAddons(key: string, options: ShowAddonsOptions): void {
  const {
    addonNames, versionInfo, userChartValues, userChartValuesTemp, addonVersions,
  } = options;

  addonNames.forEach((name) => {
    const chartValues = versionInfo[name]?.questions ? initYamlEditor(name, {
      versionInfo, userChartValues, addonVersions
    }) : {};

    userChartValuesTemp[name] = chartValues;
  });

  refreshComponentWithYamls(key, options);
}

export interface UpdateValuesOptions {
  userChartValuesTemp: Record<string, any>;
  syncChartValues: (name: string) => void;
}

export function updateValues(name: string, values: any, options: UpdateValuesOptions): void {
  options.userChartValuesTemp[name] = values;
  options.syncChartValues(name);
}

export interface SyncChartValuesOptions {
  versionInfo: Record<string, any>;
  userChartValuesTemp: Record<string, any>;
  userChartValues: Record<string, any>;
  addonVersions: AddonVersion[];
}

/**
 * Deliberately not throttled here - the consuming component wraps its thin wrapper method in
 * `lodash.throttle` (same 250ms/leading config as before the extraction) so this stays a plain,
 * directly-testable function.
 */
export function syncChartValues(name: string, options: SyncChartValuesOptions): void {
  const {
    versionInfo, userChartValuesTemp, userChartValues, addonVersions,
  } = options;
  const fromChart = versionInfo[name]?.values;
  const fromUser = userChartValuesTemp[name];
  const different = diff(fromChart, fromUser);

  userChartValues[chartVersionKey(name, addonVersions)] = different;
}

export interface ApplyChartValuesOptions {
  addonNames: string[];
  rke2Charts: string[];
  userChartValues: Record<string, any>;
  addonVersions: AddonVersion[];
}

export function applyChartValues(rkeConfig: any, options: ApplyChartValuesOptions): void {
  const {
    addonNames, rke2Charts, userChartValues, addonVersions,
  } = options;

  rkeConfig.chartValues = {};
  const charts = [...addonNames, ...rke2Charts];

  charts.forEach((name) => {
    const key = chartVersionKey(name, addonVersions);
    const userValues = userChartValues[key];

    if (userValues) {
      rkeConfig.chartValues[name] = userValues;
    }
  });
}
