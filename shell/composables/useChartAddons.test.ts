import { useChartAddons } from '@shell/composables/useChartAddons';

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
});
