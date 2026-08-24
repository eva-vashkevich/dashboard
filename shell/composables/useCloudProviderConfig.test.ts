import { ref, computed } from 'vue';
import { useCloudProviderConfig } from '@shell/composables/useCloudProviderConfig';

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
});
