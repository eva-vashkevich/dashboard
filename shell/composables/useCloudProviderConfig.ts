import { ref, computed, ComputedRef } from 'vue';
import semver from 'semver';

export interface UseCloudProviderConfigProps {
  chartVersions: ComputedRef<Record<string, any>>;
}

/**
 * Owns the Harvester CSI/CCM chart version compatibility range and derives whether the currently
 * installed Harvester cloud-provider charts satisfy it.
 *
 * Deliberately does NOT own handleVsphereCpiSecret/handleVsphereCsiSecret (thin delegations that
 * hand the whole component instance to VsphereUtils - there's nothing to extract), nor
 * setHarvesterChartValues/setHarvesterDefaultCloudProvider/setHarvesterVersionRange (orchestration
 * heavily woven into the create/edit lifecycle: credential, machinePools, chartVersionKey,
 * createKubeconfigSecret, errors, etc.). Those stay on the consuming component.
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
