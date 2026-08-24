import { ref } from 'vue';
import { useStore } from 'vuex';
import isArray from 'lodash/isArray';

/**
 * Owns the addon/chart value cache (fetched chart info, user-supplied values, and per-addon
 * config validation state) used by the RKE2/K3s addons tab.
 *
 * Deliberately does NOT own initAddons/getChartValue/chartVersionKey/applyChartValues and friends:
 * they all thread through `addonNames`, which is derived from CNI and cloud-provider config
 * (serverConfig/showCloudProvider/agentConfig) - cross-cutting concerns that live elsewhere in the
 * consuming component. Those methods stay put, reading/writing the state owned here via the
 * standard Options/Composition API interop (`this.versionInfo`, etc. still work transparently).
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
