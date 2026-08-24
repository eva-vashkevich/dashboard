<script>
import difference from 'lodash/difference';
import throttle from 'lodash/throttle';
import merge from 'lodash/merge';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import { useKubernetesVersions, getDefaultVersion } from '@shell/composables/useKubernetesVersions';
import { useMachinePools, syncMachineConfigWithLatest } from '@shell/composables/useMachinePools';
import { useRegistryConfig } from '@shell/composables/useRegistryConfig';
import {
  useChartAddons, chartVersionKey, getChartValue, initAddons, showAddons, refreshComponentWithYamls, updateValues, syncChartValues, initYamlEditor, applyChartValues
} from '@shell/composables/useChartAddons';
import { useCloudProviderConfig, setHarvesterChartValues, setHarvesterDefaultCloudProvider, fetchHarvesterVersionRange } from '@shell/composables/useCloudProviderConfig';
import { useClusterMembership, saveRoleBindings } from '@shell/composables/useClusterMembership';
import { normalizeName } from '@shell/utils/kube';
import AccountAccess from '@shell/components/google/AccountAccess.vue';

import {
  CAPI,
  NAMESPACE,
  NORMAN,
  SCHEMA,
  DEFAULT_WORKSPACE,
} from '@shell/config/types';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

import { clear } from '@shell/utils/array';
import { createYaml } from '@shell/utils/create-yaml';
import { clone, set, isEmpty, mergeWithReplace } from '@shell/utils/object';
import { labelForAddon, initSchedulingCustomization, addonConfigPreserve } from '@shell/utils/cluster';
import { AGENT_CONFIGURATION_TYPES } from '@shell/config/settings';

import { BadgeState } from '@components/BadgeState';
import { Banner } from '@components/Banner';
import CruResource, { CONTEXT_HOOK_EDIT_YAML } from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

import { CLOUD_CREDENTIAL_OVERRIDE } from '@shell/models/nodedriver';
import { CLUSTER_BADGE } from '@shell/config/labels-annotations';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv';
import Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool';
import SelectCredential from './SelectCredential';
import { ELEMENTAL_SCHEMA_IDS, KIND, ELEMENTAL_CLUSTER_PROVIDER } from '../../config/elemental-types';
import AgentConfiguration from '@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { ExtensionPoint, TabLocation } from '@shell/core/types';
import MemberRoles from '@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics';
import Etcd from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd';
import Networking, { STACK_PREFS } from '@shell/edit/provisioning.cattle.io.cluster/tabs/networking';
import Upgrade from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade';
import Registries from '@shell/edit/provisioning.cattle.io.cluster/tabs/registries';
import AddOnConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig';
import Advanced from '@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced';
import ClusterAppearance from '@shell/components/form/ClusterAppearance';
import AddOnAdditionalManifest from '@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest';
import VsphereUtils, { VMWARE_VSPHERE } from '@shell/utils/v-sphere';
import {
  HARVESTER, RETENTION_DEFAULT, RKE2_INGRESS_NGINX, INGRESS_CONTROLLER, INGRESS_NGINX, TRAEFIK, INGRESS_NONE
} from '@shell/edit/provisioning.cattle.io.cluster/shared';
import { mapGetters } from 'vuex';

const GOOGLE = 'google';
const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';
const NETBIOS_TRUNCATION_LENGTH = 15;

const CLUSTER_AGENT_CUSTOMIZATION = 'clusterAgentDeploymentCustomization';
const FLEET_AGENT_CUSTOMIZATION = 'fleetAgentDeploymentCustomization';
const REGISTRIES_TAB_NAME = 'registry';
const INIT_HOOKS = '_initHooks';

function setDefault(obj, key, value) {
  if (!obj[key]) {
    obj[key] = value;
  }
}

export default {
  emits: ['update:value', 'input'],

  components: {
    AgentEnv,
    BadgeState,
    Banner,
    AgentConfiguration,
    CruResource,
    Labels,
    Loading,
    MachinePool,
    NameNsDescription,
    SelectCredential,
    Tab,
    Tabbed,
    MemberRoles,
    Basics,
    Etcd,
    Networking,
    Upgrade,
    Registries,
    AddOnConfig,
    Advanced,
    ClusterAppearance,
    AddOnAdditionalManifest,
    AccountAccess
  },

  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },

    providerConfig: {
      type:    Object,
      default: () => null
    }
  },

  setup(props) {
    const kubernetesVersions = useKubernetesVersions(props);

    return {
      ...kubernetesVersions,
      ...useMachinePools(),
      ...useRegistryConfig(props),
      ...useChartAddons(),
      ...useCloudProviderConfig({ chartVersions: kubernetesVersions.chartVersions }),
      ...useClusterMembership(),
    };
  },

  async fetch() {
    await this.fetchRke2Versions();
    await this.initSpecs();
    await this.initAddons();
    await this.initRegistry();
    const sc = await initSchedulingCustomization(this.value.spec, this.features, this.$store, this.mode);

    this.clusterAgentDefaultPC = sc.clusterAgentDefaultPC;
    this.clusterAgentDefaultPDB = sc.clusterAgentDefaultPDB;
    this.fleetAgentDefaultPC = sc.fleetAgentDefaultPC;
    this.fleetAgentDefaultPDB = sc.fleetAgentDefaultPDB;
    this.schedulingCustomizationFeatureEnabled = sc.schedulingCustomizationFeatureEnabled;
    this.schedulingCustomizationOriginallyEnabled = sc.schedulingCustomizationOriginallyEnabled;
    this.errors = this.errors.concat(sc.errors);

    if (this.isEdit) {
      this.originalKubeVersion = this.versionOptions.find((v) => v.value === this.liveValue.spec.kubernetesVersion);
    }

    Object.entries(this.chartValues).forEach(([name, value]) => {
      const key = this.chartVersionKey(name);

      this.userChartValues[key] = value;
    });
    this.setAgentConfiguration();
  },

  beforeCreate() {
    setDefault(this.value.spec, 'rkeConfig', {});

    const { rkeConfig } = this.value.spec;

    setDefault(rkeConfig, 'chartValues', {});
    setDefault(rkeConfig, 'upgradeStrategy', {
      controlPlaneConcurrency:  '1',
      controlPlaneDrainOptions: {},
      workerConcurrency:        '1',
      workerDrainOptions:       {},
    });
    setDefault(rkeConfig, 'dataDirectories', {
      systemAgent: '', provisioning: '', k8sDistro: '',
    });
    setDefault(rkeConfig.dataDirectories, 'systemAgent', '');
    setDefault(rkeConfig.dataDirectories, 'provisioning', '');
    setDefault(rkeConfig.dataDirectories, 'k8sDistro', '');
    setDefault(rkeConfig, 'machineGlobalConfig', {});
    setDefault(rkeConfig, 'networking', {});

    if (!rkeConfig.machineSelectorConfig?.length) {
      rkeConfig.machineSelectorConfig = [{ config: {} }];
    }
  },

  data() {
    const isGoogle = this.provider === GOOGLE;

    return {
      loadedOnce:                false,
      lastIdx:                   0,
      credentialId:              '',
      credential:                null,
      initialMachinePoolsValues: {},
      s3Backup:                  false,
      fvFormRuleSets:            [{
        path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
      }],
      complianceOverride:                       false,
      truncateLimit:                            this.value.defaultHostnameLengthLimit || 0,
      busy:                                     false,
      infrastructureClusterValid:               true,
      provisioningClusterValid:                 true,
      machinePoolErrors:                        {},
      stackPreferenceError:                     false, //  spec.networking.stackPreference is validated in conjunction with hasOnlyIpv6Pools
      allNamespaces:                            [],
      extensionTabs:                            getApplicableExtensionEnhancements(this, ExtensionPoint.TAB, TabLocation.CLUSTER_CREATE_RKE2, this.$route, this),
      clusterAgentDeploymentCustomization:      null,
      schedulingCustomizationFeatureEnabled:    false,
      schedulingCustomizationOriginallyEnabled: false,
      clusterAgentDefaultPC:                    null,
      clusterAgentDefaultPDB:                   null,
      fleetAgentDefaultPC:                      null,
      fleetAgentDefaultPDB:                     null,
      activeTab:                                null,
      isGoogle,
      isAuthenticated:                          !isGoogle || this.mode === _EDIT,
      projectId:                                null,
      REGISTRIES_TAB_NAME,
      labelForAddon,
      etcdConfigValid:                          true,
      addonConfigDiffs:                         {},
      originalKubeVersion:                      null,
      isEmpty,
      AGENT_CONFIGURATION_TYPES,
      basicsValid:                              true,
      registryConfigValid:                      true,
      originalIngressController:                this.value.spec.rkeConfig.machineGlobalConfig?.[INGRESS_CONTROLLER] || INGRESS_NONE,
      infrastructureCluster:                    null,
    };
  },

  computed: {
    ...mapGetters({ features: 'features/get' }),
    isK3s() {
      return this.value?.isK3s;
    },

    isActiveTabRegistries() {
      return this.activeTab?.selectedName === REGISTRIES_TAB_NAME;
    },
    clusterName() {
      return this.value.metadata?.name || '';
    },
    showClusterAppearance() {
      return this.mode === _CREATE;
    },
    previewCluster() {
      return this.$store.getters['customisation/getPreviewCluster'];
    },
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },

    isElementalCluster() {
      return this.provider === ELEMENTAL_CLUSTER_PROVIDER || this.value?.machineProvider?.toLowerCase() === KIND.MACHINE_INV_SELECTOR_TEMPLATES.toLowerCase();
    },

    isUpstreamCAPIProvider() {
      if (this.extensionProvider?.isUpstreamCAPIProvider !== undefined) {
        return !!this.extensionProvider.isUpstreamCAPIProvider;
      }

      return false;
    },

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },

    kubernetesVersion() {
      return this.value.spec.kubernetesVersion;
    },

    rke2Charts() {
      const rke2Versions = this.rke2Versions || [];
      const kubernetesVersion = this.kubernetesVersion;

      const charts = rke2Versions
        .find((version) => version.id === kubernetesVersion)
        ?.charts ?? {};

      return Object.keys(charts);
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    agentConfig() {
      return this.value.agentConfig;
    },

    unsupportedSelectorConfig() {
      let global = 0;
      let other = 0;

      // The form supports one config that has no selector for all the main parts
      // And one or more configs that have a selector and exactly only kubelet-args.
      // If there are any other properties set, or multiple configs with no selector
      // show a warning that you're editing only part of the config in the UI.

      for (const conf of this.value.spec?.rkeConfig?.machineSelectorConfig) {
        if (!conf.machineLabelSelector) {
          global++;
          continue;
        }

        const keys = Object.keys(conf.config || {});
        const isKubeletOnly = keys.length === 0 || (keys.length === 1 && keys[0] === 'kubelet-arg');

        if (!isKubeletOnly) {
          other++;
        }
      }

      return (global > 1 || other > 0);
    },

    needCredential() {
      // Check non-provider specific config
      if (
        this.provider === 'custom' ||
        this.provider === 'import' ||
        this.isElementalCluster || // Elemental cluster can make use of `cloud-credential`: false
        this.mode === _VIEW
      ) {
        return false;
      }

      // Check provider specific config
      if (this.cloudCredentialsOverride === true || this.cloudCredentialsOverride === false) {
        return this.cloudCredentialsOverride;
      }

      if (this.providerConfig?.spec?.builtin === false && this.providerConfig?.spec?.addCloudCredential === false) {
        return false;
      }

      return true;
    },

    /**
     * Override the native way of determining if cloud credentials are required (builtin ++ node driver spec.addCloudCredentials)
     *
     * 1) Override via extensions
     *    - `true` or actual component - return true
     *    - `false` - return false
     * 2) Override via hardcoded setting
     */
    cloudCredentialsOverride() {
      const cloudCredential = this.$extension.getDynamic('cloud-credential', this.provider);

      if (cloudCredential === undefined) {
        return CLOUD_CREDENTIAL_OVERRIDE[this.provider];
      }

      return !!cloudCredential;
    },

    hasMachinePools() {
      if (this.provider === 'custom' || this.provider === 'import') {
        return false;
      }

      return true;
    },

    /**
     * Extension provider where being provisioned by an extension
     */
    extensionProvider() {
      const extClass = this.$extension.getDynamic('provisioner', this.provider);

      if (extClass) {
        return new extClass({
          dispatch:   this.$store.dispatch,
          getters:    this.$store.getters,
          axios:      this.$store.$axios,
          $extension: this.$store.app.$extension,
          t:          (...args) => this.t.apply(this, args),
          isCreate:   this.isCreate
        });
      }

      return undefined;
    },

    /**
     * Is a namespace needed? Only supported for providers from extensions, otherwise default is no
     */
    needsNamespace() {
      return this.extensionProvider ? !!this.extensionProvider.namespaced : false;
    },

    machineConfigSchema() {
      let schema;

      if (!this.hasMachinePools) {
        return null;
      } else if (this.isElementalCluster) {
        schema = ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES;
      } else {
        schema = `${ CAPI.MACHINE_CONFIG_GROUP }.${ this.provider }config`;
      }

      // If this is an extension provider then the extension can provide the schema
      const extensionSchema = this.extensionProvider?.machineConfigSchema;

      if (extensionSchema) {
        // machineConfigSchema can either be the schema name (string) or the schema itself (object)
        if (typeof extensionSchema === 'object') {
          return extensionSchema;
        }

        // Name of schema to use
        schema = extensionSchema;
      }

      return this.$store.getters['management/schemaFor'](schema);
    },

    showCni() {
      return !!this.serverArgs.cni;
    },

    showCloudProvider() {
      return !!this.agentArgs['cloud-provider-name'];
    },

    /**
     * The chart names of the addons applicable to the current kube version and selected cloud provider
     */
    addonNames() {
      const names = [];
      const cni = this.serverConfig.cni;

      if (typeof cni === 'string') {
        names.push(...cni.split(',').map((x) => `rke2-${ x }`));
      } else if (Array.isArray(cni)) {
        names.push(...cni.map((x) => `rke2-${ x }`));
      }

      if (this.showCloudProvider) { // Shouldn't be removed such that changes to it will re-trigger this watch
        if (this.agentConfig?.['cloud-provider-name'] === 'rancher-vsphere') {
          names.push('rancher-vsphere-cpi', 'rancher-vsphere-csi');
        }

        if (this.agentConfig?.['cloud-provider-name'] === HARVESTER) {
          names.push(HARVESTER_CLOUD_PROVIDER);
        }
      }

      return names;
    },

    /**
     * The charts of the addons applicable to the current kube version and selected cloud provider
     *
     * These are the charts themselves and do not include chart readme or values
     */
    addonVersions() {
      const versions = this.addonNames.map((name) => this.versionInfo[name]?.chart);

      return versions.filter((x) => !!x);
    },

    cloudProviderOptions() {
      const out = [{
        label: this.$store.getters['i18n/t']('cluster.rke2.cloudProvider.defaultValue.label'),
        value: '',
      }];

      if (!!this.agentArgs['cloud-provider-name']?.options) {
        const preferred = this.$store.getters['plugins/cloudProviderForDriver'](this.provider);

        for (const opt of this.agentArgs['cloud-provider-name']?.options) {
          // Azure in-tree cloud provider has been deprecated and is no longer supported in RKE2. It is being removed from the list of cloud provider options.
          if (opt === 'azure') {
            continue;
          }

          // If we don't have a preferred provider... show all options
          const showAllOptions = preferred === undefined;
          // If we have a preferred provider... only show default, preferred and external
          const isPreferred = opt === preferred;
          const isExternal = opt === 'external';

          let disabled = false;

          if ((this.isHarvesterExternalCredential || this.isHarvesterIncompatible) && isPreferred) {
            disabled = true;
          }

          if (showAllOptions || isPreferred || isExternal) {
            out.push({
              label: this.$store.getters['i18n/withFallback'](`cluster.cloudProvider."${ opt }".label`, null, opt),
              value: opt,
              disabled,
            });
          }
        }
      }

      const cur = this.agentConfig?.['cloud-provider-name'];

      if (cur && !out.find((x) => x.value === cur)) {
        out.unshift({ label: `${ cur } (Current)`, value: cur });
      }

      return out;
    },

    isHarvesterDriver() {
      return this.$route.query.type === HARVESTER;
    },

    defaultVersion() {
      return getDefaultVersion({
        store:             this.$store,
        versionOptions:    this.versionOptions,
        defaultRke2:       this.defaultRke2,
        rke2Versions:      this.rke2Versions,
        isHarvesterDriver: this.isHarvesterDriver,
      });
    },

    appsOSWarning() {
      if (this.mode !== _EDIT) {
        return null;
      }
      const { linuxWorkerCount, windowsWorkerCount } = this.value?.mgmt?.status || {};

      if (!windowsWorkerCount) {
        if (!!this.machinePools?.find((pool) => {
          return pool?.config?.os === 'windows';
        })) {
          return this.t('cluster.banner.os', { newOS: 'Windows', existingOS: 'Linux' });
        }
      } else if (!linuxWorkerCount) {
        if (this.machinePools.find((pool) => {
          return pool?.config?.os === 'linux';
        })) {
          return this.t('cluster.banner.os', { newOS: 'Linux', existingOS: 'Windows' });
        }
      }

      return null;
    },

    showForm() {
      return !!this.credentialId || !this.needCredential;
    },

    extensionInfrastructureSection() {
      return this.extensionProvider?.extensionInfrastructureSection || null;
    },
    extensionProvisioningSection() {
      return this.extensionProvider?.extensionProvisioningSection || null;
    },

    extensionInfrastructureSectionProps() {
      const defaultProps = {
        value:               this.infrastructureCluster,
        mode:                this.mode,
        credentialId:        this.credentialId,
        provisioningCluster: this.value,
      };

      const extensionProps = this.extensionProvider?.extensionInfrastructureSectionProps;

      if (typeof extensionProps === 'function') {
        const extensionContext = { ...defaultProps };

        extensionContext.infrastructureCluster = this.infrastructureCluster;

        let out;

        try {
          out = extensionProps(extensionContext);
        } catch {
          return defaultProps;
        }

        if (out && typeof out === 'object') {
          return { ...defaultProps, ...out };
        }
      } else if (extensionProps && typeof extensionProps === 'object') {
        return { ...defaultProps, ...extensionProps };
      }

      return defaultProps;
    },

    extensionProvisioningSectionProps() {
      const defaultProps = {
        value: this.value,
        mode:  this.mode,
      };

      const extensionProps = this.extensionProvider?.extensionProvisioningSectionProps;

      if (typeof extensionProps === 'function') {
        const extensionContext = { ...defaultProps };

        extensionContext.provisioningCluster = this.value;

        let out;

        try {
          out = extensionProps(extensionContext);
        } catch {
          return defaultProps;
        }

        if (out && typeof out === 'object') {
          return { ...defaultProps, ...out };
        }
      } else if (extensionProps && typeof extensionProps === 'object') {
        return { ...defaultProps, ...extensionProps };
      }

      return defaultProps;
    },

    isHarvesterExternalCredential() {
      return this.credential?.harvestercredentialConfig?.clusterType === 'external';
    },

    validationPassed() {
      const validRequiredPools = this.hasMachinePools ? this.hasRequiredNodes() : true;

      let base = (this.provider === 'custom' || this.isElementalCluster || !!this.credentialId || !this.needCredential);

      // and in all of the validation statuses for each machine pool
      Object.values(this.machinePoolValidation).forEach((v) => (base = base && v));

      const hasAddonConfigErrors = Object.values(this.addonConfigValidation).filter((v) => v === false).length > 0;

      const hasInfrastructureClusterError = this.isUpstreamCAPIProvider ? !this.infrastructureClusterValid : false;
      const hasProvisioningClusterError = this.isUpstreamCAPIProvider ? !this.provisioningClusterValid : false;

      return validRequiredPools && base && !hasAddonConfigErrors && !hasInfrastructureClusterError && !hasProvisioningClusterError && !this.stackPreferenceError;
    },

    currentCluster() {
      if (this.mode === _EDIT) {
        return { ...this.value };
      } else {
        return this.$store.getters['customisation/getPreviewCluster'];
      }
    },

    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },

    hideFooter() {
      return this.needCredential && !this.credentialId;
    },

    canEditAsYaml() {
      return !(this.isUpstreamCAPIProvider);
    },

    overallFormValidationPassed() {
      return this.validationPassed &&
            this.fvFormIsValid &&
            this.etcdConfigValid &&
            this.basicsValid &&
            this.registryConfigValid;
    },
    nginxSupported() {
      if (this.serverArgs?.disable?.options.includes(RKE2_INGRESS_NGINX)) {
        return true;
      }

      return false;
    },
  },

  watch: {
    previewCluster: {
      immediate: true,
      handler(neu) {
        if (!neu) {
          return;
        }

        if (Object.keys(neu.badge).length <= 0) {
          return;
        }

        const obj = {
          [CLUSTER_BADGE.ICON_TEXT]: neu.badge.iconText, [CLUSTER_BADGE.COLOR]: neu.badge.color, [CLUSTER_BADGE.TEXT]: neu.badge.text
        };

        this.value.metadata.annotations = {
          ...this.value.metadata.annotations,
          ...obj
        };
      }
    },

    credentialId(val) {
      if (val) {
        this.credential = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.credentialId);

        if (this.isHarvesterDriver) {
          this.setHarvesterVersionRange();
        }
      } else {
        this.credential = null;
      }

      this.value.spec.cloudCredentialSecretName = val;
    },

    addonNames(neu, old) {
      // To catch the 'some addons' --> 'no addons' case also check array length (`difference([], [1,2,3]) === []`)
      const diff = old.length !== neu.length || difference(neu, old).length;

      if (diff) {
        // Allow time for addonNames to update... then fetch any missing addons
        this.$nextTick(() => this.initAddons());
      }
    },

    async selectedVersion(neu) {
      if (this.isEdit) {
        const {
          addonConfigDiffs, addonNames, userChartValues, $store
        } = this;

        await addonConfigPreserve(
          {
            addonConfigDiffs, addonNames, userChartValues, $store
          },
          this.originalKubeVersion?.charts,
          neu?.charts
        );
      }

      this.versionInfo = {}; // Invalidate cache such that version info relevant to selected kube version is updated
      // Allow time for addonNames to update... then fetch any missing addons
      this.$nextTick(() => this.initAddons());
      if (this.mode === _CREATE) {
        this.initServerAgentArgs();
      }
    },

    showCni(neu) {
      // Update `serverConfig.cni to recalculate addonNames...
      // ... which will eventually update `value.spec.rkeConfig.chartValues`
      if (neu) {
        // Type supports CNI, assign default if we can
        if (!this.serverConfig.cni) {
          const def = this.serverArgs.cni.default;

          this.serverConfig.cni = def;
        }
      } else {
        // Type doesn't support cni, clear `cni`
        this.serverConfig.cni = undefined;
      }
    },

    showCloudProvider(neu) {
      if (!neu) {
        // No cloud provider available? Then clear cloud provider setting. This will recalculate addonNames...
        // ... which will eventually update `value.spec.rkeConfig.chartValues`
        this.agentConfig['cloud-provider-name'] = undefined;
      }
    },
  },

  created() {
    // Hooks to be run when cluster is getting initialized
    if (this.extensionProvider?.registerInitHooks) {
      this.extensionProvider.registerInitHooks(this.registerHook.bind(this, INIT_HOOKS), this.value);
    }
    // Other hooks to be run before/after saving the cluster
    this.registerBeforeHook(this.showIpv6Warning, 'show-ipv6-warning', 1);
    this.registerBeforeHook(this.saveMachinePools, 'save-machine-pools', 2);
    this.registerBeforeHook(this.setRegistryConfig, 'set-registry-config');
    this.registerBeforeHook(this.handleVsphereCpiSecret, 'sync-vsphere-cpi');
    this.registerBeforeHook(this.handleVsphereCsiSecret, 'sync-vsphere-csi');
    this.registerBeforeHook(this.setHarvesterChartValues, 'set-harvester-chart-values');
    this.registerAfterHook(this.cleanupMachinePools, 'cleanup-machine-pools');
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');

    // Register any hooks for this extension provider
    if (this.extensionProvider?.registerSaveHooks) {
      this.extensionProvider.registerSaveHooks(this.registerBeforeHook, this.registerAfterHook, this.value);
    }
  },

  methods: {
    set,

    updateExtensionInfrastructureSection(neu) {
      if (!neu || typeof neu !== 'object') {
        return;
      }

      if (!this.infrastructureCluster || typeof this.infrastructureCluster !== 'object') {
        this.infrastructureCluster = neu;

        return;
      }

      // Preserve the original resource model instance while applying extension updates.
      mergeWithReplace(this.infrastructureCluster, neu, { mutateOriginal: true });
    },

    updateExtensionProvisioningSection(neu) {
      if (!neu || typeof neu !== 'object') {
        return;
      }

      if (!this.value || typeof this.value !== 'object') {
        this.value = neu;

        return;
      }

      // Preserve the original resource model instance while applying extension updates.
      mergeWithReplace(this.value, neu, { mutateOriginal: true });
    },

    async handleVsphereCpiSecret() {
      return VsphereUtils.handleVsphereCpiSecret(this);
    },

    async handleVsphereCsiSecret() {
      return VsphereUtils.handleVsphereCsiSecret(this);
    },

    /**
     * Initialize all the cluster specs
     */
    async initSpecs() {
      if (!this.value.spec) {
        this.value.spec = {};
      }

      if (!this.value.spec.machineSelectorConfig) {
        this.value.spec.machineSelectorConfig = [];
      }

      if (!this.value.spec.machineSelectorConfig.find((x) => !x.machineLabelSelector)) {
        this.value.spec.machineSelectorConfig.unshift({ config: {} });
      }
      // TODO handle upstream capi once credentials part is clear
      if (this.value.spec.cloudCredentialSecretName ) {
        await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
        this.credentialId = `${ this.value.spec.cloudCredentialSecretName }`;
      }

      if (!this.value.spec.kubernetesVersion) {
        this.value.spec.kubernetesVersion = this.defaultVersion;
      }

      if (this.rkeConfig.etcd?.s3?.bucket) {
        this.s3Backup = true;
      }

      if (!this.rkeConfig.etcd) {
        this.rkeConfig.etcd = {
          disableSnapshots:     false,
          s3:                   null,
          snapshotRetention:    RETENTION_DEFAULT,
          snapshotScheduleCron: '0 */5 * * *',
        };
      } else if (typeof this.rkeConfig.etcd.disableSnapshots === 'undefined') {
        const disableSnapshots = !this.rkeConfig.etcd.snapshotRetention && !this.rkeConfig.etcd.snapshotScheduleCron;

        this.rkeConfig.etcd.disableSnapshots = disableSnapshots;
      }
      // Namespaces if required - this is mainly for custom provisioners via extensions that want
      // to allow creating their resources in a different namespace
      if (this.needsNamespace) {
        this.allNamespaces = await this.$store.dispatch('management/findAll', { type: NAMESPACE });
      }

      if (!this.machinePools) {
        await this.initMachinePools(this.value.spec.rkeConfig.machinePools);
        if (this.isEdit && this.isGoogle && this.machinePools?.length > 0 && this.machinePools[0]?.config?.project) {
          this.projectId = this.machinePools[0]?.config?.project;
        }
        if (this.mode === _CREATE && !this.machinePools.length) {
          await this.addMachinePool();
        }
      }

      if (this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName === undefined) {
        this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName = '';
      }

      if ( isEmpty(this.value?.spec?.localClusterAuthEndpoint) ) {
        set(this.value, 'spec.localClusterAuthEndpoint', { enabled: false });
      }

      await this.applyHooks(INIT_HOOKS, this.value);
      this.localValue = this.value;
    },

    /**
     * Fetch RKE versions and their configurations to be mapped to the form
     */
    setSchedulingCustomization({ event, agentType }) {
      if (event) {
        switch (agentType) {
        case AGENT_CONFIGURATION_TYPES.CLUSTER:
          set(this.value, 'spec.clusterAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.clusterAgentDefaultPC, podDisruptionBudget: this.clusterAgentDefaultPDB });
          break;
        case AGENT_CONFIGURATION_TYPES.FLEET:
          set(this.value, 'spec.fleetAgentDeploymentCustomization.schedulingCustomization', { priorityClass: this.fleetAgentDefaultPC, podDisruptionBudget: this.fleetAgentDefaultPDB });
          break;
        default:
        }
      } else {
        switch (agentType) {
        case AGENT_CONFIGURATION_TYPES.CLUSTER:
          delete this.value.spec.clusterAgentDeploymentCustomization.schedulingCustomization;
          break;
        case AGENT_CONFIGURATION_TYPES.FLEET:
          delete this.value.spec.fleetAgentDeploymentCustomization.schedulingCustomization;
          break;
        default:
        }
      }
    },

    cleanAgentConfiguration(model, key) {
      if (!model || !model[key]) {
        return;
      }

      const v = model[key];

      if (Array.isArray(v) && v.length === 0) {
        delete model[key];
      } else if (v && typeof v === 'object') {
        Object.keys(v).forEach((k) => {
          // delete these auxiliary props used in podAffinity and nodeAffinity that shouldn't be sent to the server
          if (k === '_namespaceOption' || k === '_namespaces' || k === '_anti' || k === '_id') {
            delete v[k];
          }

          // prevent cleanup of "namespaceSelector" when an empty object because it represents all namespaces in pod/node affinity
          // https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.25/#podaffinityterm-v1-core
          if (k !== 'namespaceSelector') {
            this.cleanAgentConfiguration(v, k);
          }
        });

        if (Object.keys(v).length === 0) {
          delete model[key];
        }
      }
    },

    /**
     * Clean agent configuration objects, so we only send values when the user has configured something
     */
    agentConfigurationCleanup() {
      this.cleanAgentConfiguration(this.value.spec, CLUSTER_AGENT_CUSTOMIZATION);
      this.cleanAgentConfiguration(this.value.spec, FLEET_AGENT_CUSTOMIZATION);
    },

    /**
     * Ensure we have empty models for the two agent configurations
     */
    setAgentConfiguration() {
      // Cluster Agent Configuration
      if (!this.value.spec[CLUSTER_AGENT_CUSTOMIZATION]) {
        this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] = {};
      }

      // Fleet Agent Configuration
      if (!this.value.spec[FLEET_AGENT_CUSTOMIZATION]) {
        this.value.spec[FLEET_AGENT_CUSTOMIZATION] = {};
      }
    },

    /**
     * set instanceNameLimit to 15 to all pool machine if truncateHostnames checkbox is clicked
     */
    truncateHostname(neu) {
      if (neu) {
        this.value.defaultHostnameLengthLimit = NETBIOS_TRUNCATION_LENGTH;
        this.truncateLimit = NETBIOS_TRUNCATION_LENGTH;
      } else {
        this.truncateLimit = 0;
        this.value.removeDefaultHostnameLengthLimit();
      }
    },

    enableLocalClusterAuthEndpoint(neu) {
      this.localValue.spec.localClusterAuthEndpoint.enabled = neu;
      if (!neu) {
        delete this.localValue.spec.localClusterAuthEndpoint.caCerts;
        delete this.localValue.spec.localClusterAuthEndpoint.fqdn;
      } else {
        this.localValue.spec.localClusterAuthEndpoint.caCerts = '';
        this.localValue.spec.localClusterAuthEndpoint.fqdn = '';
      }
    },

    /**
     * Get machine pools from the cluster configuration
     * this.value.spec.rkeConfig.machinePools
     */
    async initMachinePools(existing) {
      const out = [];

      if (existing?.length) {
        for (const pool of existing) {
          let type;

          if (this.isElementalCluster) {
            type = ELEMENTAL_SCHEMA_IDS.MACHINE_INV_SELECTOR_TEMPLATES;
          } else if (this.isUpstreamCAPIProvider && pool.machineConfigRef?.apiVersion) {
            const [group] = (pool.machineConfigRef.apiVersion || '').split('/');

            type = `${ group }.${ pool.machineConfigRef.kind.toLowerCase() }`;
          } else {
            type = `${ CAPI.MACHINE_CONFIG_GROUP }.${ pool.machineConfigRef.kind.toLowerCase() }`;
          }

          let config;
          let configMissing = false;

          if (this.$store.getters['management/canList'](type)) {
            try {
              config = await this.$store.dispatch('management/find', {
                type,
                id: `${ this.value.metadata.namespace }/${ pool.machineConfigRef.name }`,
              });
            } catch (e) {
              // Some users can't see the config, that's ok.
              // we will display a banner for a 404 only for elemental
              if (e?.status === 404) {
                if (this.isElementalCluster) {
                  configMissing = true;
                }
              }
            }
          }

          // @TODO what if the pool is missing?
          const id = `pool${ ++this.lastIdx }`;

          const poolData = {
            id,
            remove: false,
            create: false,
            update: true,
            pool:   clone(pool),
            config: config ? await this.$store.dispatch('management/clone', { resource: config }) : null,
            configMissing
          };

          // add data to machine pools array
          out.push(poolData);

          // but we also store the initial data so that we can handle conflicts
          if (poolData?.config?.id) {
            this.initialMachinePoolsValues[poolData.config.id] = structuredClone(poolData.config);
          }
        }
      }

      this.machinePools = out;
    },

    async addMachinePool(idx) {
      // this.machineConfigSchema is the schema for the Machine Pool's machine configuration for the given provider
      if (!this.machineConfigSchema) {
        return;
      }

      const numCurrentPools = this.machinePools.length || 0;

      let config;

      if (this.extensionProvider?.createMachinePoolMachineConfig) {
        config = await this.extensionProvider.createMachinePoolMachineConfig(idx, this.machinePools, this.value);
      } else {
        // Default - use the schema
        config = await this.$store.dispatch('management/createPopulated', {
          type:     this.machineConfigSchema.id,
          metadata: { namespace: DEFAULT_WORKSPACE }
        });

        // If there is no specific model, the applyDefaults does nothing by default
        config.applyDefaults(idx, this.machinePools);
      }

      const name = `pool${ ++this.lastIdx }`;

      const pool = {
        id:          name,
        config,
        remove:      false,
        create:      true,
        update:      false,
        uid:         name,
        isIpv6:      false,
        isDualStack: false,
        pool:        {
          name,
          etcdRole:             numCurrentPools === 0,
          controlPlaneRole:     numCurrentPools === 0,
          workerRole:           true,
          hostnamePrefix:       '',
          labels:               {},
          quantity:             1,
          unhealthyNodeTimeout: '0m',
          machineConfigRef:     {
            kind: this.machineConfigSchema.attributes?.kind,
            name: null,
          },
          drainBeforeDelete: true
        },
      };

      if (this.provider === VMWARE_VSPHERE) {
        pool.pool.machineOS = 'linux';
      }

      if (this.isElementalCluster && this.machineConfigSchema?.attributes) {
        pool.pool.machineConfigRef.apiVersion = `${ this.machineConfigSchema.attributes.group }/${ this.machineConfigSchema.attributes.version }`;
      }

      // Upstream CAPI MachineTemplate resources are referenced by full apiVersion so that
      // initMachinePools can resolve the correct management store type on subsequent loads.
      if (this.isUpstreamCAPIProvider && this.machineConfigSchema?.attributes) {
        const { group, version } = this.machineConfigSchema.attributes;

        if (group && version) {
          pool.pool.machineConfigRef.apiVersion = `${ group }/${ version }`;
        }
      }

      this.machinePools.push(pool);

      this.$nextTick(() => {
        if (this.$refs.pools?.select) {
          this.$refs.pools.select(name);
        }
      });
    },

    async syncMachineConfigWithLatest(machinePool) {
      return syncMachineConfigWithLatest(this.$store, this.initialMachinePoolsValues, machinePool);
    },

    confirmMachinePoolYamlEdit() {
      return new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component:      'GenericPrompt',
          componentProps: {
            title:     this.t('cluster.rke2.modal.editYamlMachinePool.title'),
            body:      this.t('cluster.rke2.modal.editYamlMachinePool.body'),
            applyMode: 'editAndContinue',
            confirm:   async(confirmed) => {
              if (confirmed) {
                await this.validateMachinePool();

                if (this.errors.length) {
                  reject(new Error('Machine Pool validation errors'));
                }

                resolve();
              } else {
                reject(new Error('User Cancelled'));
              }
            }
          },
        });
      });
    },

    // For Google, we need to set internal and external firewall prefixes if enabled, but it is
    // better to track it here since cluster and pool names are guaranteed to be set by now.
    applyGoogleFirewallPrefixes(entry, prefix) {
      if (this.provider !== GOOGLE) {
        return;
      }

      if (!!entry.config.setInternalFirewallRulePrefix) {
        entry.config.internalFirewallRulePrefix = `${ this.value.metadata.name }`;
      } else if (!!entry.config.internalFirewallRulePrefix) {
        delete entry.config.internalFirewallRulePrefix;
      }
      if (!!entry.config.setExternalFirewallRulePrefix) {
        entry.config.externalFirewallRulePrefix = prefix;
      } else if (!!entry.config.externalFirewallRulePrefix) {
        delete entry.config.externalFirewallRulePrefix;
      }
      // These have to be removed regardless of their value because they are not part of the object we are sending
      delete entry.config.setInternalFirewallRulePrefix;
      delete entry.config.setExternalFirewallRulePrefix;
    },

    async saveMachinePools(hookContext) {
      if (hookContext === CONTEXT_HOOK_EDIT_YAML) {
        await this.confirmMachinePoolYamlEdit();
      }

      const finalPools = [];

      // If the extension provider wants to do this, let them
      if (this.extensionProvider?.saveMachinePoolConfigs) {
        return await this.extensionProvider.saveMachinePoolConfigs(this.machinePools, this.value);
      }

      for (const entry of this.machinePools) {
        if (entry.remove) {
          continue;
        }

        await this.syncMachineConfigWithLatest(entry);

        // Capitals and such aren't allowed;
        entry.pool.name = normalizeName(entry.pool.name) || 'pool';
        const prefix = `${ this.value.metadata.name }-${ entry.pool.name }`;

        const prefixFormatted = prefix.substr(0, 50).toLowerCase();

        this.applyGoogleFirewallPrefixes(entry, prefix);

        if (entry.create) {
          if (!entry.config.metadata?.name) {
            entry.config.metadata.generateName = `nc-${ prefixFormatted }-`;
          }

          const neu = await entry.config.save();

          entry.config = neu;
          entry.pool.machineConfigRef.name = neu.metadata.name;
          entry.create = false;
          entry.update = true;

          this.initialMachinePoolsValues[entry.config.id] = clone(neu);
        } else if (entry.update) {
          entry.config = await entry.config.save();
        }

        // Ensure Elemental clusters have a hostname prefix
        if (this.isElementalCluster && !entry.pool.hostnamePrefix) {
          entry.pool.hostnamePrefix = `${ prefixFormatted }-`;
        }

        finalPools.push(entry.pool);
      }

      this.value.spec.rkeConfig.machinePools = finalPools;
    },

    async cleanupMachinePools() {
      // Allow the extension provider to handle its own resource cleanup
      if (this.extensionProvider?.cleanupMachinePools) {
        return await this.extensionProvider.cleanupMachinePools(this.machinePools);
      }
      for (const entry of this.machinePools) {
        if (entry.remove && entry.config) {
          try {
            await entry.config.remove();
          } catch (e) { }
        }
      }
    },

    async saveRoleBindings() {
      await this.value.waitForMgmt();

      return saveRoleBindings(this.membershipUpdate, this.value.mgmt.id);
    },

    async showIpv6Warning(hookContext) {
      if (this.mode !== _CREATE || !this.machinePools?.length) {
        return;
      }
      const stackPreference = this.value.spec.rkeConfig.networking.stackPreference;
      const isK3s = (this.selectedVersion?.label || '').toLowerCase().includes('k3s');
      const flannelMasqEnabled = this.serverConfig['flannel-ipv6-masq'];
      const clusterCIDR = (this.serverConfig['cluster-cidr'] || '');
      const serviceCIDR = (this.serverConfig['service-cidr'] || '');

      const isDualStack = this.hasDualStackPools;
      const isIpv6 = this.hasOnlyIpv6Pools;

      const flannelMasqInvalid = isIpv6 && isK3s && !flannelMasqEnabled;
      const stackPrefInvalid = (isIpv6 && stackPreference !== STACK_PREFS.IPV6) || (isDualStack && (stackPreference && stackPreference !== STACK_PREFS.DUAL));

      const clusterCIDRInvalid = (isIpv6 || isDualStack) && !clusterCIDR.includes(':');
      const serviceCIDRInvalid = (isIpv6 || isDualStack) && !serviceCIDR.includes(':');

      if (!stackPrefInvalid && !flannelMasqInvalid && !clusterCIDRInvalid && !serviceCIDRInvalid) {
        return;
      }

      const warnings = [];

      if (stackPrefInvalid) {
        warnings.push('cluster.rke2.modal.ipv6Warning.stackPrefInvalid');
      }
      if (flannelMasqInvalid) {
        warnings.push('cluster.rke2.modal.ipv6Warning.flannelMasqInvalid');
      }
      if (clusterCIDRInvalid || serviceCIDRInvalid) {
        warnings.push(isK3s ? 'cluster.rke2.modal.ipv6Warning.cidrInvalidK3s' : 'cluster.rke2.modal.ipv6Warning.cidrInvalidRke2');
      }

      await new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component:      'Ipv6NetworkingDialog',
          componentProps: {
            warnings,
            isK3s,
            confirm: (confirmed) => {
              if (confirmed) {
                resolve();
              } else {
                reject(new Error('User Cancelled'));
              }
            }
          },
        });
      });
    },

    cancelCredential() {
      if (this.$refs.cruresource) {
        this.$refs.cruresource.emitOrRoute();
      }
    },

    done() {
      let routeName = 'c-cluster-product-resource';

      if (this.mode === _CREATE && (this.provider === 'import' || this.provider === 'custom')) {
        // Go show the registration command
        routeName = 'c-cluster-product-resource-namespace-id';
      }

      this.$router.push({
        name:   routeName,
        params: {
          cluster:   this.$route.params.cluster,
          product:   this.$store.getters['productId'],
          resource:  CAPI.RANCHER_CLUSTER,
          namespace: this.value.metadata.namespace,
          id:        this.value.metadata.name,
        },
      });
    },

    // Set busy before save and clear after save
    async saveOverride(btnCb) {
      this['busy'] = true;

      // If the provider is from an extension, let it do the provision step
      if (this.extensionProvider?.provision) {
        const errors = await this.extensionProvider?.provision(this.value, this.machinePools);
        const okay = (errors || []).length === 0;

        this.errors = errors;
        this['busy'] = false;

        btnCb(okay);

        if (okay) {
          // If saved okay, go to the done route
          return this.done();
        }
      }

      // Default save
      return this._doSaveOverride((done) => {
        this['busy'] = false;

        return btnCb(done);
      });
    },

    // When editing to a different kubernetes version, addons with pending config diffs may get
    // downgraded/reset by the version change - ask the user to confirm before continuing. Returns
    // false if the user cancelled (or `showAddonConfirmation` rejected).
    async confirmAddonDowngrade() {
      const isEditVersion = this.isEdit && this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;

      if (!isEditVersion) {
        return true;
      }

      const hasDiffs = Object.values(this.addonConfigDiffs).some((d) => !isEmpty(d));

      if (!hasDiffs) {
        return true;
      }

      const addonNamesWithDiffs = [];

      for (const name in this.addonConfigDiffs) {
        const diff = this.addonConfigDiffs[name];

        if (!isEmpty(diff)) {
          addonNamesWithDiffs.push(name);
        }
      }

      return this.showAddonConfirmation(
        addonNamesWithDiffs,
        this.liveValue.spec.kubernetesVersion,
        this.value.spec.kubernetesVersion
      );
    },

    // Snapshot fleet/cluster agent customization before save, so it can be re-applied if the save
    // fails - the cleanup that runs before save (agentConfigurationCleanup) strips it first.
    snapshotAgentCustomization() {
      return {
        clusterAgentDeploymentCustomization: this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[CLUSTER_AGENT_CUSTOMIZATION])) : null,
        fleetAgentDeploymentCustomization:   this.value.spec[FLEET_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[FLEET_AGENT_CUSTOMIZATION])) : null,
      };
    },

    restoreAgentCustomization(snapshot) {
      this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] = snapshot.clusterAgentDeploymentCustomization;
      this.value.spec[FLEET_AGENT_CUSTOMIZATION] = snapshot.fleetAgentDeploymentCustomization;
    },

    async _doSaveOverride(btnCb) {
      // We cannot use the hook, because it is triggered on YAML toggle without restore initialized data
      this.agentConfigurationCleanup();

      if (!await this.confirmAddonDowngrade()) {
        return btnCb('cancelled');
      }

      this.validateClusterName();

      await this.validateMachinePool();

      if (this.errors.length) {
        btnCb(false);

        return;
      }

      try {
        this.applyChartValues(this.value.spec.rkeConfig);
      } catch (err) {
        this.errors.push(err);

        btnCb(false);

        return;
      }

      // Remove null profile on machineGlobalConfig - https://github.com/rancher/dashboard/issues/8480
      if (this.value.spec?.rkeConfig?.machineGlobalConfig?.profile === null) {
        delete this.value.spec.rkeConfig.machineGlobalConfig.profile;
      }

      const agentCustomizationSnapshot = this.snapshotAgentCustomization();

      await this.save(btnCb);

      // comes from createEditView mixin
      // if there are any errors saving, restore the agent config data
      if (this.errors?.length) {
        this.restoreAgentCustomization(agentCustomizationSnapshot);
      }
    },

    async actuallySave(url) {
      if (this.extensionProvider?.saveCluster) {
        return await this.extensionProvider?.saveCluster(this.value, this.schema);
      }

      if (this.isCreate) {
        url = url || this.schema.linkFor('collection');
        const res = await this.value.save({ url });

        if (res) {
          Object.assign(this.value, res);
        }
      } else {
        await this.value.save();
      }
    },

    async setHarvesterChartValues() {
      return setHarvesterChartValues({
        store:           this.$store,
        t:               this.t,
        agentConfig:     this.agentConfig,
        credential:      this.credential,
        isCreate:        this.isCreate,
        isEdit:          this.isEdit,
        liveValue:       this.liveValue,
        value:           this.value,
        machinePools:    this.machinePools,
        userChartValues: this.userChartValues,
        chartVersionKey: this.chartVersionKey,
        errors:          this.errors,
      });
    },

    cancel() {
      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          resource: CAPI.RANCHER_CLUSTER,
        },
      });
    },

    async getChartValue(chartName) {
      return getChartValue(chartName, {
        chartVersions:   this.chartVersions,
        store:           this.$store,
        versionInfo:     this.versionInfo,
        userChartValues: this.userChartValues,
        addonVersions:   this.addonVersions,
      });
    },

    async initAddons() {
      this.addonConfigValidation = {};

      return initAddons({
        addonNames:      this.addonNames,
        isK3s:           this.isK3s,
        chartVersions:   this.chartVersions,
        store:           this.$store,
        versionInfo:     this.versionInfo,
        userChartValues: this.userChartValues,
        addonVersions:   this.addonVersions,
      });
    },

    showAddons(key) {
      this.addonsRev++;

      return showAddons(key, {
        addonNames:          this.addonNames,
        versionInfo:         this.versionInfo,
        userChartValues:     this.userChartValues,
        userChartValuesTemp: this.userChartValuesTemp,
        addonVersions:       this.addonVersions,
        refs:                this.$refs,
        refreshYamls:        this.refreshYamls,
      });
    },
    refreshComponentWithYamls(key) {
      return refreshComponentWithYamls(key, { refs: this.$refs, refreshYamls: this.refreshYamls });
    },

    updateValues(name, values) {
      return updateValues(name, values, { userChartValuesTemp: this.userChartValuesTemp, syncChartValues: this.syncChartValues });
    },

    syncChartValues: throttle(function(name) {
      return syncChartValues(name, {
        versionInfo:         this.versionInfo,
        userChartValuesTemp: this.userChartValuesTemp,
        userChartValues:     this.userChartValues,
        addonVersions:       this.addonVersions,
      });
    }, 250, { leading: true }),

    initYamlEditor(name) {
      return initYamlEditor(name, {
        versionInfo:     this.versionInfo,
        userChartValues: this.userChartValues,
        addonVersions:   this.addonVersions,
      });
    },

    initServerAgentArgs() {
      for (const k in this.serverArgs) {
        if (this.serverConfig[k] === undefined) {
          const def = this.serverArgs[k].default;

          this.serverConfig[k] = (def !== undefined ? def : undefined);
        }
      }

      for (const k in this.agentArgs) {
        if (this.agentConfig?.[k] === undefined) {
          const def = this.agentArgs[k].default;

          this.agentConfig[k] = (def !== undefined ? def : undefined);
        }
      }

      if (!this.serverConfig?.profile) {
        this.serverConfig.profile = null;
      }
      this.updateNginxConfiguration(this.serverConfig?.disable || []);
    },

    chartVersionKey(name) {
      return chartVersionKey(name, this.addonVersions);
    },

    generateYaml() {
      const resource = this.value;
      const inStore = this.$store.getters['currentStore'](resource);
      const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
      const clonedResource = clone(resource);

      this.applyChartValues(clonedResource.spec.rkeConfig);

      const out = createYaml(schemas, resource.type, clonedResource);

      return out;
    },

    applyChartValues(rkeConfig) {
      return applyChartValues(rkeConfig, {
        addonNames:      this.addonNames,
        rke2Charts:      this.rke2Charts,
        userChartValues: this.userChartValues,
        addonVersions:   this.addonVersions,
      });
    },

    setHarvesterDefaultCloudProvider() {
      setHarvesterDefaultCloudProvider({
        isHarvesterDriver:             this.isHarvesterDriver,
        mode:                          this.mode,
        agentConfig:                   this.agentConfig,
        isHarvesterExternalCredential: this.isHarvesterExternalCredential,
        isHarvesterIncompatible:       this.isHarvesterIncompatible,
      });
    },

    async setHarvesterVersionRange() {
      const range = await fetchHarvesterVersionRange(this.$store, this.credential);

      if (range) {
        this.harvesterVersionRange = range;
      }
      this.setHarvesterDefaultCloudProvider();
    },

    /**
     * Reset PSA on several input changes for given conditions
     */
    togglePsaDefault() {
      // This option is created from the server and is guaranteed to exist #8032
      const hardcodedTemplate = 'rancher-restricted';
      const complianceValue = this.agentConfig?.profile || this.serverConfig?.profile;

      if (!this.complianceOverride) {
        if (complianceValue) {
          this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName = hardcodedTemplate;
        }
      }
    },

    handleComplianceChange() {
      this.togglePsaDefault();
      this.updateComplianceProfile();
    },

    updateComplianceProfile() {
      // If the user selects any Worker Compliance Profile,
      // protect-kernel-defaults should be set to false
      // in the RKE2 worker/agent config.
      const selectedComplianceProfile = this.agentConfig?.profile;

      if (selectedComplianceProfile) {
        this.agentConfig['protect-kernel-defaults'] = true;
      } else {
        this.agentConfig['protect-kernel-defaults'] = false;
      }
    },
    updateAdditionalManifest(neu) {
      this.value.spec.rkeConfig.additionalManifest = neu;
    },

    /**
     * Handle k8s changes side effects, like PSA resets
     */
    handleKubernetesChange(value, old) {
      if (value) {
        this.togglePsaDefault();
        // Need to make sure we explicitly set ingress due to a default change
        this.updateNginxConfiguration(this.serverConfig?.disable || []);

        // If Harvester driver, reset cloud provider if not compatible
        if (this.isHarvesterDriver && this.mode === _CREATE && this.isHarvesterIncompatible) {
          this.setHarvesterDefaultCloudProvider();
        }
      }
    },

    handleShowDeprecatedPatchVersionsChanged(value) {
      this.showDeprecatedPatchVersions = value;
    },

    updateNginxConfiguration(disabledServerConfig) {
      // We only need to explicitly set INGRESS_CONTROLLER for RKE2, we continue to rely on disable list for K3s
      if (!this.isK3s) {
        // For new instances, we want Traefik to be default
        if (this.isCreate) {
          this.serverConfig[INGRESS_CONTROLLER] = TRAEFIK;
        // Older existing instances might be relying on default setting, which is changing from nginx to traefik
        // so we need to make sure to set it to nginx explicitly to avoid breaking existing clusters
        } else if (!this.serverConfig[INGRESS_CONTROLLER]) {
          if (!disabledServerConfig.includes(RKE2_INGRESS_NGINX) && this.nginxSupported) {
            this.serverConfig[INGRESS_CONTROLLER] = INGRESS_NGINX;
          } else {
            this.serverConfig[INGRESS_CONTROLLER] = INGRESS_NONE;
          }
        }
      }
    },

    handleEnabledSystemServicesChanged(val) {
      this.serverConfig.disable = val;
      this.updateNginxConfiguration(val);
    },

    handleCiliumValuesChanged(neu) {
      if (neu === undefined) {
        return;
      }

      const name = this.chartVersionKey('rke2-cilium');

      this.userChartValues = {
        ...this.userChartValues,
        [name]: { ...neu }
      };
    },

    handleComplianceChanged() {
      this.handleComplianceChange();
    },

    handlePsaDefaultChanged() {
      this.complianceOverride = !this.complianceOverride;
      this.togglePsaDefault();
    },

    handleMachinePoolError(error) {
      this.machinePoolErrors = merge(this.machinePoolErrors, error);

      const errors = Object.entries(this.machinePoolErrors)
        .map((x) => {
          if (!x[1].length) {
            return;
          }

          const formattedFields = (() => {
            switch (x[1].length) {
            case 1:
              return x[1][0];
            case 2:
              return `${ x[1][0] } and ${ x[1][1] }`;
            default: {
              const [head, ...rest] = x[1];

              return `${ rest.join(', ') }, and ${ head }`;
            }
            }
          })();

          return this.t('cluster.banner.machinePoolError', {
            count: x[1].length, pool_name: x[0], fields: formattedFields
          }, true);
        })
        .filter((x) => x);

      if (!errors) {
        return;
      }

      this.errors = errors;
    },
    handleS3BackupChanged(neu) {
      this.s3Backup = neu;
      if (neu) {
        // We need to make sure that s3 doesn't already have an existing value otherwise when editing a cluster with s3 defined this will clear s3.
        if (isEmpty(this.rkeConfig.etcd?.s3)) {
          this.rkeConfig.etcd.s3 = {};
        }
      } else {
        this.rkeConfig.etcd.s3 = null;
      }
    },
    handleConfigEtcdExposeMetricsChanged(neu) {
      this.serverConfig['etcd-expose-metrics'] = neu;
    },
    handleFlannelMasqChanged(neu) {
      if (neu || neu === false) {
        this.serverConfig['flannel-ipv6-masq'] = neu;
      } else {
        delete this.serverConfig['flannel-ipv6-masq'];
      }
    },

    validateClusterName() {
      if (!this.value.metadata.name && this.agentConfig?.['cloud-provider-name'] === HARVESTER) {
        this.errors.push(this.t('validation.required', { key: this.t('cluster.name.label') }, true));
      }
    },
    async validateMachinePool() {
      if (this.errors) {
        clear(this.errors);
      }

      if ( this.value.cloudProvider === 'aws') {
        const missingProfileName = this.machinePools.some((mp) => !mp.config.iamInstanceProfile);

        if (missingProfileName) {
          this.errors.push(this.t('cluster.validation.iamInstanceProfileName', {}, true));
        }
      }

      for (const [index] of this.machinePools.entries()) { // validator machine config
        if (typeof this.$refs.pool?.[index]?.test === 'function') {
          try {
            const res = await this.$refs.pool[index].test();

            if (Array.isArray(res) && res.length > 0) {
              this.errors.push(...res);
            }
          } catch (e) {
            this.errors.push(e);
          }
        }
      }
    },

    addonConfigValidationChanged(configName, isValid) {
      this.addonConfigValidation[configName] = isValid;
    },

    handleTabChange(data) {
      this.activeTab = data;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending && !loadedOnce" />
  <Banner
    v-else-if="$fetchState.error"
    color="error"
    :label="$fetchState.error"
  />
  <CruResource
    v-else
    ref="cruresource"
    :mode="mode"
    :validation-passed="overallFormValidationPassed"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :generate-yaml="generateYaml"
    :can-yaml="canEditAsYaml"
    class="rke2"
    component-testid="rke2-custom-create"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="e => errors = e"
  >
    <div class="header-warnings">
      <Banner
        v-if="isEdit"
        color="warning"
        data-testid="edit-cluster-reprovisioning-documentation"
      >
        <span v-clean-html="t('cluster.banner.rke2-k3-reprovisioning', {}, true)" />
      </Banner>
    </div>
    <AccountAccess
      v-if="!isAuthenticated"
      v-model:credential="credentialId"
      v-model:project="projectId"
      v-model:is-authenticated="isAuthenticated"
      :mode="mode"
      @error="e=>errors.push(e)"
      @cancel-credential="cancelCredential"
    />
    <div
      v-else
      class="authenticated"
    >
      <SelectCredential
        v-if="needCredential"
        v-model:value="credentialId"
        :mode="mode"
        :provider="provider"
        :cancel="cancelCredential"
        :showing-form="showForm"
        :default-on-cancel="true"
        data-testid="select-credential"
        class="mt-20"
      />
      <div
        v-if="showForm"
        data-testid="form"
        class="mt-20"
      >
        <NameNsDescription
          v-if="!isView"
          v-model:value="localValue"
          :mode="mode"
          :namespaced="needsNamespace"
          :namespace-options="allNamespaces"
          name-label="cluster.name.label"
          name-placeholder="cluster.name.placeholder"
          description-label="cluster.description.label"
          description-placeholder="cluster.description.placeholder"
          :rules="{ name: fvGetAndReportPathRules('metadata.name') }"
          @update:value="$emit('input', $event)"
        >
          <template #customize>
            <ClusterAppearance
              :name="clusterName"
              :currentCluster="currentCluster"
              :mode="mode"
            />
          </template>
        </NameNsDescription>

        <Banner
          v-if="appsOSWarning"
          color="error"
        >
          {{ appsOSWarning }}
        </Banner>
        <div class="span-12">
          <component
            :is="extensionInfrastructureSection"
            v-if="extensionInfrastructureSection"
            v-bind="extensionInfrastructureSectionProps"
            class="span-12"
            @update:value="updateExtensionInfrastructureSection"
            @error="e => errors.push(e)"
            @validationChanged="(val) => infrastructureClusterValid = val"
          />
        </div>
        <!-- Pools Extras -->
        <template v-if="hasMachinePools">
          <div class="clearfix">
            <h2
              v-t="'cluster.tabs.machinePools'"
              class="pull-left"
            />
            <div
              v-if="!isView"
              class="pull-right"
            >
              <BadgeState
                v-clean-tooltip="nodeTotals.tooltip.etcd"
                :color="nodeTotals.color.etcd"
                :icon="nodeTotals.icon.etcd"
                :label="nodeTotals.label.etcd"
                class="mr-10"
              />
              <BadgeState
                v-clean-tooltip="nodeTotals.tooltip.controlPlane"
                :color="nodeTotals.color.controlPlane"
                :icon="nodeTotals.icon.controlPlane"
                :label="nodeTotals.label.controlPlane"
                class="mr-10"
              />
              <BadgeState
                v-clean-tooltip="nodeTotals.tooltip.worker"
                :color="nodeTotals.color.worker"
                :icon="nodeTotals.icon.worker"
                :label="nodeTotals.label.worker"
              />
            </div>
          </div>
          <!-- Extra Tabs for Machine Pool -->
          <Tabbed
            ref="pools"
            :side-tabs="true"
            :show-tabs-add-remove="!isView"
            @addTab="addMachinePool($event)"
            @removeTab="removeMachinePool($event)"
          >
            <template
              v-for="(obj, idx) in machinePools"
              :key="obj.id"
            >
              <Tab
                v-if="!obj.remove"
                :key="obj.id"
                :weight="-1 * idx"
                :name="obj.id"
                :label="obj.pool.name || t('cluster.machinePool.name.notNamed')"
                :show-header="false"
                :error="!machinePoolValidation[obj.id]"
              >
                <MachinePool
                  ref="pool"
                  :value="obj"
                  :cluster="value"
                  :mode="mode"
                  :provider="provider"
                  :credential-id="credentialId"
                  :project-id="projectId"
                  :idx="idx"
                  :machine-pools="machinePools"
                  :busy="busy"
                  :pool-id="obj.id"
                  :pool-create-mode="obj.create"
                  :infrastructure-cluster="infrastructureCluster"
                  :hide-advanced="isUpstreamCAPIProvider"
                  @error="handleMachinePoolError"
                  @validationChanged="v => machinePoolValidationChanged(obj.id, v)"
                />
              </Tab>
            </template>
            <div v-if="!unremovedMachinePools.length">
              {{ t('cluster.machinePool.noPoolsDisclaimer') }}
            </div>
          </Tabbed>
          <div class="spacer" />
        </template>

        <!-- Cluster Tabs -->
        <h2 v-t="'cluster.tabs.cluster'" />
        <component
          :is="extensionProvisioningSection"
          v-if="extensionProvisioningSection"
          v-bind="extensionProvisioningSectionProps"
          class="span-12"
          @update:value="updateExtensionProvisioningSection"
          @error="e => errors.push(e)"
          @validationChanged="(val) => provisioningClusterValid = val"
        />
        <Tabbed
          :side-tabs="true"
          class="min-height"
          :use-hash="useTabbedHash"
          :default-tab="defaultTab"
          @changed="handleTabChange"
        >
          <Tab
            name="basic"
            label-key="cluster.tabs.basic"
            :weight="11"
            @active="refreshComponentWithYamls('tab-Basics')"
          >
            <!-- Basic -->
            <Basics
              ref="tab-Basics"
              v-model:value="localValue"
              :mode="mode"
              :provider="provider"
              :user-chart-values="userChartValues"
              :version-info="versionInfo"
              :credential="credential"
              :compliance-override="complianceOverride"
              :all-psas="allPSAs"
              :addon-versions="addonVersions"
              :show-deprecated-patch-versions="showDeprecatedPatchVersions"
              :selected-version="selectedVersion"
              :is-harvester-driver="isHarvesterDriver"
              :is-harvester-incompatible="isHarvesterIncompatible"
              :version-options="versionOptions"
              :is-elemental-cluster="isElementalCluster"
              :have-arg-info="haveArgInfo"
              :show-cni="showCni"
              :show-cloud-provider="showCloudProvider"
              :cloud-provider-options="cloudProviderOptions"
              :has-some-ipv6-pools="hasOnlyIpv6Pools"
              :original-ingress-controller="originalIngressController"
              @update:value="$emit('input', $event)"
              @cilium-values-changed="handleCiliumValuesChanged"
              @enabled-system-services-changed="handleEnabledSystemServicesChanged"
              @kubernetes-changed="handleKubernetesChange"
              @compliance-changed="handleComplianceChanged"
              @psa-default-changed="handlePsaDefaultChanged"
              @show-deprecated-patch-versions-changed="handleShowDeprecatedPatchVersionsChanged"
              @update-values="updateValues"
              @yaml-validation-changed="e => addonConfigValidationChanged(e.name, e.val)"
              @config-validation-changed="(val)=>basicsValid = val"
              @error="e=>errors.push(e)"
            />
          </Tab>

          <!-- Member Roles -->
          <Tab
            v-if="canManageMembers"
            name="memberRoles"
            label-key="cluster.tabs.memberRoles"
            :weight="10"
          >
            <MemberRoles
              v-model:value="localValue"
              :mode="mode"
              :on-membership-update="onMembershipUpdate"
              @update:value="$emit('input', $event)"
            />
          </Tab>
          <!-- etcd -->
          <Tab
            name="etcd"
            label-key="cluster.tabs.etcd"
          >
            <Etcd
              v-model:value="localValue"
              :mode="mode"
              :s3-backup="s3Backup"
              :register-before-hook="registerBeforeHook"
              :selected-version="selectedVersion"
              @update:value="$emit('input', $event)"
              @s3-backup-changed="handleS3BackupChanged"
              @config-etcd-expose-metrics-changed="handleConfigEtcdExposeMetricsChanged"
              @etcd-validation-changed="(val)=>etcdConfigValid = val"
            />
          </Tab>

          <!-- Networking -->
          <Tab
            v-if="haveArgInfo"
            name="networking"
            label-key="cluster.tabs.networking"
            :error="stackPreferenceError"
          >
            <Networking
              v-model:value="localValue"
              :mode="mode"
              :selected-version="selectedVersion"
              :truncate-limit="truncateLimit"
              :machine-pools="machinePools"
              :has-some-ipv6-pools="hasOnlyIpv6Pools"
              :flannel-ipv6-masq="serverConfig['flannel-ipv6-masq']"
              @truncate-hostname-changed="truncateHostname"
              @cluster-cidr-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-cidr'] = val"
              @service-cidr-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['service-cidr'] = val"
              @cluster-domain-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-domain'] = val"
              @cluster-dns-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['cluster-dns'] = val"
              @service-node-port-range-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['service-node-port-range'] = val"
              @tls-san-changed="(val)=>localValue.spec.rkeConfig.machineGlobalConfig['tls-san'] = val"
              @local-cluster-auth-endpoint-changed="enableLocalClusterAuthEndpoint"
              @ca-certs-changed="(val)=>localValue.spec.localClusterAuthEndpoint.caCerts = val"
              @fqdn-changed="(val)=>localValue.spec.localClusterAuthEndpoint.fqdn = val"
              @stack-preference-changed="(val)=>localValue.spec.rkeConfig.networking.stackPreference = val"
              @validationChanged="(val)=>stackPreferenceError = !val"
              @flannel-ipv6-masq-changed="handleFlannelMasqChanged"
            />
          </Tab>

          <!-- Upgrade -->
          <Tab
            name="upgrade"
            label-key="cluster.tabs.upgrade"
          >
            <Upgrade
              v-model:value="localValue"
              :mode="mode"
              @update:value="$emit('input', $event)"
            />
          </Tab>

          <!-- Registries -->
          <Tab
            :name="REGISTRIES_TAB_NAME"
            label-key="cluster.tabs.registry"
            :error="!registryConfigValid"
          >
            <Registries
              v-if="isActiveTabRegistries"
              v-model:value="localValue"
              :mode="mode"
              :register-before-hook="registerBeforeHook"
              :show-custom-registry-input="showCustomRegistryInput"
              :registry-host="registryHost"
              :registry-secret="registrySecret"
              :show-custom-registry-advanced-input="showCustomRegistryAdvancedInput"
              @update:value="$emit('input', $event)"
              @update-configs-changed="updateConfigs"
              @custom-registry-changed="toggleCustomRegistry"
              @registry-host-changed="handleRegistryHostChanged"
              @registry-secret-changed="handleRegistrySecretChanged"
              @registry-validation-changed="(val) => registryConfigValid = val"
            />
          </Tab>

          <!-- Add-on Configs -->
          <Tab
            v-for="v in addonVersions"
            :key="v.name"
            :name="v.name"
            :label="labelForAddon($store, v.name, false)"
            :weight="9"
            :showHeader="false"
            :error="addonConfigValidation[v.name]===false"
            @active="showAddons(v.name)"
          >
            <AddOnConfig
              :ref="v.name"
              v-model:value="localValue"
              :mode="mode"
              :version-info="versionInfo"
              :addon-version="v"
              :addons-rev="addonsRev"
              :user-chart-values-temp="userChartValuesTemp"
              :init-yaml-editor="initYamlEditor"
              :has-diff="!isEmpty(addonConfigDiffs[v.name])"
              :previous-kube-version="liveValue?.spec?.kubernetesVersion"
              :new-kube-version="value.spec.kubernetesVersion"
              @update:value="$emit('input', $event)"
              @update-questions="syncChartValues"
              @update-values="updateValues"
              @validationChanged="e => addonConfigValidationChanged(v.name, e)"
            />
          </Tab>

          <!-- Add-on Additional Manifest -->
          <Tab
            name="additionalmanifest"
            label-key="cluster.tabs.addOnAdditionalManifest"
            :showHeader="false"
            @active="refreshComponentWithYamls('additionalmanifest')"
          >
            <AddOnAdditionalManifest
              ref="additionalmanifest"
              :value="value"
              :mode="mode"
              @additional-manifest-changed="updateAdditionalManifest"
            />
          </Tab>

          <!-- Cluster Agent Configuration -->
          <Tab
            v-if="value.spec.clusterAgentDeploymentCustomization"
            name="clusteragentconfig"
            label-key="cluster.agentConfig.tabs.cluster"
          >
            <AgentConfiguration
              v-model:value="value.spec.clusterAgentDeploymentCustomization"
              data-testid="rke2-cluster-agent-config"
              :type="AGENT_CONFIGURATION_TYPES.CLUSTER"
              :mode="mode"
              :scheduling-customization-feature-enabled="schedulingCustomizationFeatureEnabled"
              :default-p-c="clusterAgentDefaultPC"
              :default-p-d-b="clusterAgentDefaultPDB"
              :scheduling-customization-originally-enabled="schedulingCustomizationOriginallyEnabled"
              @scheduling-customization-changed="setSchedulingCustomization"
            />
          </Tab>

          <!-- Fleet Agent Configuration -->
          <Tab
            name="fleetagentconfig"
            label-key="cluster.agentConfig.tabs.fleet"
          >
            <AgentConfiguration
              v-if="value.spec.fleetAgentDeploymentCustomization"
              v-model:value="value.spec.fleetAgentDeploymentCustomization"
              data-testid="rke2-fleet-agent-config"
              :type="AGENT_CONFIGURATION_TYPES.FLEET"
              :mode="mode"
              :scheduling-customization-feature-enabled="schedulingCustomizationFeatureEnabled"
              :default-p-c="fleetAgentDefaultPC"
              :default-p-d-b="fleetAgentDefaultPDB"
              :scheduling-customization-originally-enabled="schedulingCustomizationOriginallyEnabled"
              @scheduling-customization-changed="setSchedulingCustomization"
            />
          </Tab>

          <!-- Advanced -->
          <Tab
            v-if="haveArgInfo || agentArgs['protect-kernel-defaults']"
            name="advanced"
            label-key="cluster.tabs.advanced"
            :weight="-1"
          >
            <Advanced
              v-model:value="localValue"
              :mode="mode"
              :have-arg-info="haveArgInfo"
              :selected-version="selectedVersion"
              @update:value="$emit('input', $event)"
            />
          </Tab>

          <AgentEnv
            v-model:value="localValue"
            :mode="mode"
            @update:value="$emit('input', $event)"
          />
          <Labels
            v-model:value="localValue"
            :mode="mode"
            @update:value="$emit('input', $event)"
          />

          <!-- Extension tabs -->
          <Tab
            v-for="tab, i in extensionTabs"
            :key="`${tab.name}${i}`"
            :name="tab.name"
            :label="tab.label"
            :label-key="tab.labelKey"
            :weight="tab.weight"
            :tooltip="tab.tooltip"
            :show-header="tab.showHeader"
            :display-alert-icon="tab.displayAlertIcon"
            :error="tab.error"
            :badge="tab.badge"
          >
            <component
              :is="tab.component"
              :resource="value"
            />
          </Tab>
        </Tabbed>
      </div>

      <Banner
        v-if="unsupportedSelectorConfig"
        color="warning"
        :label="t('cluster.banner.warning')"
      />
    </div>
    <template
      v-if="hideFooter"
      #form-footer
    >
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>

<style lang="scss" scoped>
.authenticated {
    display:flex;
    flex-direction: column;
    flex-grow: 1;
}

.min-height {
  min-height: 40em;
}

.patch-version {
  margin-top: 5px;
}

.header-warnings .banner {
  margin-bottom: 0;
}
</style>
