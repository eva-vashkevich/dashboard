import {
  CAPI,
  MANAGEMENT,
  NAMESPACE,
  NORMAN,
  SCHEMA,
  DEFAULT_WORKSPACE,
  SECRET,
  HCI,
  PSPS,
} from '@shell/config/types';
import { ELEMENTAL_SCHEMA_IDS, KIND, ELEMENTAL_CLUSTER_PROVIDER } from '@shell/config/elemental-types';
import { findBy, removeObject, clear } from '@shell/utils/array';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import {
  clone, diff, set, get, isEmpty
} from '@shell/utils/object';
import { compare, sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { SETTING } from '@shell/config/settings';
import semver from 'semver';
import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import { createYaml } from '@shell/utils/create-yaml';

const CLUSTER_AGENT_CUSTOMIZATION = 'clusterAgentDeploymentCustomization';
const FLEET_AGENT_CUSTOMIZATION = 'fleetAgentDeploymentCustomization';

export default {
  data() {
    return {
      rke2Versions:    null,
      k3sVersions:     null,
      defaultRke2:     '',
      defaultK3s:      '',
      allPSPs:         null,
      allPSAs:         [],
      credentialId:    '',
      s3Backup:        false,
      allNamespaces:   [],
      machinePools:    null,
      /**
       * All info related to a specific version of the chart
       *
       * This includes chart itself, README and values
       *
       * { [chartName:string]: { chart: json, readme: string, values: json } }
       */
      versionInfo:     {},
      userChartValues: {},
      systemRegistry:  null,
      registryHost:    null,
      registrySecret:  null,

      showCustomRegistryAdvancedInput: false,
    };
  },
  computed: {
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },
    isK3s() {
      return (this.value?.spec?.kubernetesVersion || '').includes('k3s');
    },

    versionOptions() {
      const cur = this.liveValue?.spec?.kubernetesVersion || this.liveValue?.kubernetesVersion || '';
      const existingRke2 = this.mode === _EDIT && cur.includes('rke2');
      const existingK3s = this.mode === _EDIT && cur.includes('k3s');

      let allValidRke2Versions = this.getAllOptionsAfterCurrentVersion(this.rke2Versions, (existingRke2 ? cur : null), this.defaultRke2);
      let allValidK3sVersions = this.getAllOptionsAfterCurrentVersion(this.k3sVersions, (existingK3s ? cur : null), this.defaultK3s);

      if (!this.showDeprecatedPatchVersions) {
        // Normally, we only want to show the most recent patch version
        // for each Kubernetes minor version. However, if the user
        // opts in to showing deprecated versions, we don't filter them.
        allValidRke2Versions = this.filterOutDeprecatedPatchVersions(allValidRke2Versions, cur);
        allValidK3sVersions = this.filterOutDeprecatedPatchVersions(allValidK3sVersions, cur);
      }

      const showRke2 = allValidRke2Versions.length && !existingK3s;
      const showK3s = allValidK3sVersions.length && !existingRke2;
      const out = [];

      if ( showRke2 ) {
        if ( showK3s ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.rke2') });
        }

        out.push(...allValidRke2Versions);
      }

      if ( showK3s ) {
        if ( showRke2 ) {
          out.push({ kind: 'group', label: this.t('cluster.provider.k3s') });
        }

        out.push(...allValidK3sVersions);
      }

      if ( cur ) {
        const existing = out.find((x) => x.value === cur);

        if ( existing ) {
          existing.disabled = false;
        }
      }

      return out;
    },

    serverConfig() {
      return this.value.spec.rkeConfig.machineGlobalConfig;
    },

    /**
     * The addons (kube charts) applicable for the selected kube version
     *
     * { [chartName:string]: { repo: string, version: string } }
     */
    chartVersions() {
      return this.selectedVersion?.charts || {};
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
    agentConfig() {
      return this.value.agentConfig;
    },
    isElementalCluster() {
      return this.provider === ELEMENTAL_CLUSTER_PROVIDER || this.value?.machineProvider?.toLowerCase() === KIND.MACHINE_INV_SELECTOR_TEMPLATES.toLowerCase();
    },
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    chartValues() {
      return this.value.spec.rkeConfig.chartValues;
    },
    haveArgInfo() {
      return Boolean(this.selectedVersion?.serverArgs && this.selectedVersion?.agentArgs);
    },
    /**
     * Define PSP deprecation and restrict use of PSP based on min k8s version
     */
    needsPSP() {
      return this.getNeedsPSP();
    },
    hasPsaTemplates() {
      return !this.needsPSP;
    },
    showCni() {
      return !!this.serverArgs.cni;
    },

  },
  methods: {
    /**
     * Fetch RKE versions and their configurations to be mapped to the form
     */
    async fetchRke2Versions() {
      if ( !this.rke2Versions ) {
        const hash = {
          rke2Versions: this.$store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
          k3sVersions:  this.$store.dispatch('management/request', { url: '/v1-k3s-release/releases' }),
        };

        if ( this.$store.getters['management/canList'](MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE) ) {
          hash.allPSPs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE });
        }

        if (this.$store.getters['management/canList'](MANAGEMENT.PSA)) {
          hash.allPSAs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
        }

        // Get the latest versions from the global settings if possible
        const globalSettings = await this.$store.getters['management/all'](MANAGEMENT.SETTING) || [];
        const defaultRke2Setting = globalSettings.find((setting) => setting.id === 'rke2-default-version') || {};
        const defaultK3sSetting = globalSettings.find((setting) => setting.id === 'k3s-default-version') || {};

        let defaultRke2 = defaultRke2Setting?.value || defaultRke2Setting?.default;
        let defaultK3s = defaultK3sSetting?.value || defaultK3sSetting?.default;

        // RKE2: Use the channel if we can not get the version from the settings
        if (!defaultRke2) {
          hash.rke2Channels = this.$store.dispatch('management/request', { url: '/v1-rke2-release/channels' });
        }

        // K3S: Use the channel if we can not get the version from the settings
        if (!defaultK3s) {
          hash.k3sChannels = this.$store.dispatch('management/request', { url: '/v1-k3s-release/channels' });
        }

        const res = await allHash(hash);

        this.allPSPs = res.allPSPs || [];
        this.allPSAs = res.allPSAs || [];
        this.rke2Versions = res.rke2Versions.data || [];
        this.k3sVersions = res.k3sVersions.data || [];

        if (!defaultRke2) {
          const rke2Channels = res.rke2Channels.data || [];

          defaultRke2 = rke2Channels.find((x) => x.id === 'default')?.latest;
        }

        if (!defaultK3s) {
          const k3sChannels = res.k3sChannels.data || [];

          defaultK3s = k3sChannels.find((x) => x.id === 'default')?.latest;
        }

        if ( !this.rke2Versions.length && !this.k3sVersions.length ) {
          throw new Error('No version info found in KDM');
        }

        // Store default versions
        this.defaultRke2 = defaultRke2;
        this.defaultK3s = defaultK3s;
      }
    },

    /**
     * Ensure all chart information required to show addons is available
     *
     * This basically means
     * 1) That the full chart relating to the addon is fetched (which includes core chart, readme and values)
     * 2) We're ready to cache any values the user provides for each addon
     */
    async initAddons() {
      for ( const chartName of this.addonNames ) {
        const entry = this.chartVersions[chartName];

        if ( this.versionInfo[chartName] ) {
          continue;
        }

        try {
          const res = await this.$store.dispatch('catalog/getVersionInfo', {
            repoType:    'cluster',
            repoName:    entry.repo,
            chartName,
            versionName: entry.version,
          });

          set(this.versionInfo, chartName, res);
          const key = this.chartVersionKey(chartName);

          if (!this.userChartValues[key]) {
            this.userChartValues[key] = {};
          }
        } catch (e) {
          console.error(`Failed to fetch or process chart info for ${ chartName }`); // eslint-disable-line no-console
        }
      }
    },

    async initRegistry() {
      // Check for an existing cluster scoped registry
      const clusterRegistry = this.agentConfig?.['system-default-registry'] || '';

      // Check for the global registry
      this.systemRegistry = (await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.SYSTEM_DEFAULT_REGISTRY })).value || '';

      // The order of precedence is to use the cluster scoped registry
      // if it exists, then use the global scoped registry as a fallback
      if (clusterRegistry) {
        this.registryHost = clusterRegistry;
      } else {
        this.registryHost = this.systemRegistry;
      }

      let registrySecret = null;
      let regs = this.rkeConfig.registries;

      if ( !regs ) {
        regs = {};
        set(this.rkeConfig, 'registries', regs);
      }

      if ( !regs.configs ) {
        set(regs, 'configs', {});
      }

      if ( !regs.mirrors ) {
        set(regs, 'mirrors', {});
      }

      const hostname = Object.keys(regs.configs)[0];
      const config = regs.configs[hostname];

      if ( config ) {
        registrySecret = config.authConfigSecretName;
      }

      this.registrySecret = registrySecret;

      const hasMirrorsOrAuthConfig = Object.keys(regs.configs).length > 0 || Object.keys(regs.mirrors).length > 0;

      if (this.registryHost || registrySecret || hasMirrorsOrAuthConfig) {
        this.showCustomRegistryInput = true;

        if (hasMirrorsOrAuthConfig) {
          this.showCustomRegistryAdvancedInput = true;
        }
      }
    },
    /**
     * Ensure we have empty models for the two agent configurations
     */
    setAgentConfiguration() {
      // Cluster Agent Configuration
      if ( !this.value.spec[CLUSTER_AGENT_CUSTOMIZATION]) {
        set(this.value.spec, CLUSTER_AGENT_CUSTOMIZATION, {});
      }

      // Fleet Agent Configuration
      if ( !this.value.spec[FLEET_AGENT_CUSTOMIZATION] ) {
        set(this.value.spec, FLEET_AGENT_CUSTOMIZATION, {});
      }
    },

    /**
     * Get provisioned RKE2 cluster PSPs in edit mode
     */
    async getPsps() {
      // As server returns 500 we exclude all the possible cases
      if (
        this.mode !== _CREATE &&
              !this.isK3s &&
              this.value.state !== 'reconciling' &&
              this.getNeedsPSP(this.liveValue) // We consider editing only possible PSP cases
      ) {
        const clusterId = this.value.mgmtClusterId;
        const url = `/k8s/clusters/${ clusterId }/v1/${ PSPS }`;

        try {
          return await this.$store.dispatch('cluster/request', { url });
        } catch (error) {
          // PSP may not exists for this cluster and an error is returned without need to handle
        }
      }
    },

    getMostRecentPatchVersions(sortedVersions) {
      // Get the most recent patch version for each Kubernetes minor version.
      const versionMap = {};

      sortedVersions.forEach((version) => {
        const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

        if (!versionMap[majorMinor]) {
          // Because we start with a sorted list of versions, we know the
          // highest patch version is first in the list, so we only keep the
          // first of each minor version in the list.
          versionMap[majorMinor] = version.value;
        }
      });

      return versionMap;
    },

    getAllOptionsAfterCurrentVersion(versions, currentVersion, defaultVersion) {
      const out = (versions || []).filter((obj) => !!obj.serverArgs).map((obj) => {
        let disabled = false;
        let experimental = false;
        let isCurrentVersion = false;
        let label = obj.id;

        if ( currentVersion ) {
          disabled = compare(obj.id, currentVersion) < 0;
          isCurrentVersion = compare(obj.id, currentVersion) === 0;
        }

        if ( defaultVersion ) {
          experimental = compare(defaultVersion, obj.id) < 0;
        }

        if (isCurrentVersion) {
          label = `${ label } ${ this.t('cluster.kubernetesVersion.current') }`;
        }

        if (experimental) {
          label = `${ label } ${ this.t('cluster.kubernetesVersion.experimental') }`;
        }

        return {
          label,
          value:      obj.id,
          sort:       sortable(obj.id),
          serverArgs: obj.serverArgs,
          agentArgs:  obj.agentArgs,
          charts:     obj.charts,
          disabled,
        };
      });

      if (currentVersion && !out.find((obj) => obj.value === currentVersion)) {
        out.push({
          label: `${ currentVersion } ${ this.t('cluster.kubernetesVersion.current') }`,
          value: currentVersion,
          sort:  sortable(currentVersion),
        });
      }

      const sorted = sortBy(out, 'sort:desc');

      const mostRecentPatchVersions = this.getMostRecentPatchVersions(sorted);

      const sortedWithDeprecatedLabel = sorted.map((optionData) => {
        const majorMinor = `${ semver.major(optionData.value) }.${ semver.minor(optionData.value) }`;

        if (mostRecentPatchVersions[majorMinor] === optionData.value) {
          return optionData;
        }

        return {
          ...optionData,
          label: `${ optionData.label } ${ this.t('cluster.kubernetesVersion.deprecated') }`
        };
      });

      return sortedWithDeprecatedLabel;
    },

    filterOutDeprecatedPatchVersions(allVersions, currentVersion) {
      // Get the most recent patch version for each Kubernetes minor version.
      const mostRecentPatchVersions = this.getMostRecentPatchVersions(allVersions);

      const filteredVersions = allVersions.filter((version) => {
        // Always show pre-releases
        if (semver.prerelease(version.value)) {
          return true;
        }

        const majorMinor = `${ semver.major(version.value) }.${ semver.minor(version.value) }`;

        // Always show current version, else show if we haven't shown anything for this major.minor version yet
        if (version.value === currentVersion || mostRecentPatchVersions[majorMinor] === version.value) {
          return true;
        }

        return false;
      });

      return filteredVersions;
    },

    /**
     * Define PSP deprecation and restrict use of PSP based on min k8s version and current/edited mode
     */
    getNeedsPSP(value = this.value) {
      const release = value?.spec?.kubernetesVersion || '';
      const version = release.match(/\d+/g);
      const isRequiredVersion = version?.length ? +version[0] === 1 && +version[1] < 25 : false;

      return isRequiredVersion;
    },
    chartVersionKey(name) {
      const addonVersion = this.addonVersions.find((av) => av.name === name);

      return addonVersion ? `${ name }-${ addonVersion.version }` : name;
    },
    /**
     * Reset PSA on several input changes for given conditions
     */
    togglePsaDefault() {
      // This option is created from the server and is guaranteed to exist #8032
      const hardcodedTemplate = 'rancher-restricted';
      const cisValue = this.agentConfig?.profile || this.serverConfig?.profile;

      if (!this.cisOverride) {
        if (this.hasPsaTemplates && cisValue) {
          set(this.value.spec, 'defaultPodSecurityAdmissionConfigurationTemplateName', hardcodedTemplate);
        }

        this.cisPsaChangeBanner = this.hasPsaTemplates;
      }
    },

    /**
     * Clean agent configuration objects, so we only send values when the user has configured something
     */
    agentConfigurationCleanup() {
      this.cleanAgentConfiguration(this.value.spec, CLUSTER_AGENT_CUSTOMIZATION);
      this.cleanAgentConfiguration(this.value.spec, FLEET_AGENT_CUSTOMIZATION);
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
    showAddonConfirmation() {
      return new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component: 'AddonConfigConfirmationDialog',
          resources: [(value) => resolve(value)]
        });
      });
    },

    /**
       * Inform user to remove PSP for current cluster due deprecation
       */
    showPspConfirmation() {
      return new Promise((resolve, reject) => {
        this.$store.dispatch('cluster/promptModal', {
          component:      'GenericPrompt',
          componentProps: {
            title:     this.t('cluster.rke2.modal.pspChange.title'),
            body:      this.t('cluster.rke2.modal.pspChange.body'),
            applyMode: 'continue',
            confirm:   resolve
          },
        });
      });
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
    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
    },

  }
};
