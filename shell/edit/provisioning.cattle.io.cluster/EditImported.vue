<script>

import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import ClusterManagement from '@shell/mixins/cluster-management';
import MemberRoles from '@shell/edit/provisioning.cattle.io.cluster/MemberRoles';
import { Banner } from '@components/Banner';
import { clone, set, get } from '@shell/utils/object';
import Labels from './Labels';
import * as VERSION from '@shell/utils/version';

import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/Basics';
import AgentConfiguration from './AgentConfiguration';

import isArray from 'lodash/isArray';
import { allHash } from '@shell/utils/promise';
import { _CREATE } from '@shell/config/query-params';
import semver from 'semver';
import { compare, sortable } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import { ELEMENTAL_SCHEMA_IDS, KIND, ELEMENTAL_CLUSTER_PROVIDER } from '../../config/elemental-types';
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
import AgentEnv from './AgentEnv';
import Networking from '@shell/edit/provisioning.cattle.io.cluster/Networking';
import Upgrade from '@shell/edit/provisioning.cattle.io.cluster/Upgrade';
import { findBy, removeObject, clear } from '@shell/utils/array';

const CLUSTER_AGENT_CUSTOMIZATION = 'clusterAgentDeploymentCustomization';
const FLEET_AGENT_CUSTOMIZATION = 'fleetAgentDeploymentCustomization';

export default {
  components: {
    Banner,
    AgentConfiguration,
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    Tab,
    Tabbed,
    AgentEnv,
    MemberRoles,
    Basics,
    Networking,
    Upgrade
  },

  mixins: [CreateEditView, FormValidation, ClusterManagement],

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
    }
  },

  async fetch() {
    this.psps = await this.getPsps();
    await this.fetchRke2Versions();
    await this.initSpecs();
    await this.initAddons();
    await this.initRegistry();

    Object.entries(this.chartValues).forEach(([name, value]) => {
      const key = this.chartVersionKey(name);

      this.userChartValues[key] = value;
    });

    this.setAgentConfiguration();
  },
  data() {
    if ( !this.value.spec.rkeConfig ) {
      set(this.value.spec, 'rkeConfig', {});
    }

    if ( !this.value.spec.rkeConfig.chartValues ) {
      set(this.value.spec.rkeConfig, 'chartValues', {});
    }

    if ( !this.value.spec.rkeConfig.upgradeStrategy ) {
      set(this.value.spec.rkeConfig, 'upgradeStrategy', {
        controlPlaneConcurrency:  '1',
        controlPlaneDrainOptions: {},
        workerConcurrency:        '1',
        workerDrainOptions:       {},
      });
    }

    if ( !this.value.spec.rkeConfig.machineGlobalConfig ) {
      set(this.value.spec, 'rkeConfig.machineGlobalConfig', {});
    }

    if ( !this.value.spec.rkeConfig.machineSelectorConfig?.length ) {
      set(this.value.spec, 'rkeConfig.machineSelectorConfig', [{ config: {} }]);
    }

    if ( !this.value.spec.kubernetesVersion) {
      set(this.value.spec, 'kubernetesVersion', this.liveValue.kubernetesVersion);
    }
    const previousKubernetesVersion = this.value.spec.kubernetesVersion;

    return {
      loadedOnce:     false,
      fvFormRuleSets: [{
        path: 'metadata.name', rules: ['subDomain'], translationKey: 'nameNsDescription.name.label'
      }],
      credential:                  null,
      credentialId:                '',
      allNamespaces:               [],
      membershipUpdate:            {},
      psps:                        null,
      versionInfo:                 {},
      userChartValues:             {},
      previousKubernetesVersion,
      harvesterVersionRange:       {},
      cisOverride:                 false,
      cisPsaChangeBanner:          false,
      showDeprecatedPatchVersions: false,
      clusterIsAlreadyCreated:     !!this.value.id,
      initialCloudProvider:        this.value?.agentConfig?.['cloud-provider-name'] || '',
    };
  },

  computed: {

    selectedVersion() {
      console.log(`OG this.value`);
      console.log(JSON.stringify(this.value.spec))
      const str = this.value.spec.kubernetesVersion || this.liveValue.kubernetesVersion;

      if ( !str ) {
        return;
      }

      const out = findBy(this.versionOptions, 'value', str);

      return out;
    },

    showCni() {
      return !!this.serverArgs?.cni;
    },
    showCloudProvider() {
      return !!(this.agentArgs && this.agentArgs['cloud-provider-name']);
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

      return names;
    },

  },
  watch:   {},
  methods: {
    handleCiliumIpv6Changed(neu) {
      const name = this.chartVersionKey('rke2-cilium');
      const values = this.userChartValues[name];

      set(this, 'userChartValues', {
        ...this.userChartValues,
        [name]: {
          ...values,
          cilium: {
            ...values?.cilium,
            ipv6: {
              ...values?.cilium?.ipv6,
              enabled: neu
            }
          }
        }
      });
    },
    handlePspChanged(neu) {
      this.handlePspChange(neu);
    },
    handleCisChanged() {
      this.handleCisChange();
    },
    handlePsaDefaultChanged() {
      this.togglePsaDefault();
    },
    /**
     * Handle k8s changes side effects, like PSP and PSA resets
     */
    handleKubernetesChange(value) {
      if (value) {
        this.togglePsaDefault();
        const version = VERSION.parse(value);
        const major = parseInt(version?.[0] || 0);
        const minor = parseInt(version?.[1] || 0);

        // Reset PSA if not RKE2
        if (!value.includes('rke2')) {
          set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', '');
        } else {
          // Reset PSP if it's legacy due k8s version 1.25+
          if (major === 1 && minor >= 25) {
            set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', '');
          } else {
            set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', this.lastDefaultPodSecurityPolicyTemplateName);
          }

          this.previousKubernetesVersion = value;
        }
      }
    },
    handleShowDeprecatedPatchVersionsChanged(value) {
      this.showDeprecatedPatchVersions = value;
    },
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
     * Initialize all the cluster specs
     */
    async initSpecs() {
      if ( !this.value.spec ) {
        set(this.value, 'spec', {});
      }

      // if ( !this.value.spec.machineSelectorConfig ) {
      //   set(this.value.spec, 'machineSelectorConfig', []);
      // }

      // if ( !this.value.spec.machineSelectorConfig.find((x) => !x.machineLabelSelector) ) {
      //   this.value.spec.machineSelectorConfig.unshift({ config: {} });
      // }

      if ( this.value.spec.cloudCredentialSecretName ) {
        await this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });
        this.credentialId = `${ this.value.spec.cloudCredentialSecretName }`;
      }

      if ( !this.value.spec.kubernetesVersion ) {
        set(this.value.spec, 'kubernetesVersion', this.defaultVersion);
      }

      if ( this.rkeConfig.etcd?.s3?.bucket ) {
        this.s3Backup = true;
      }

      if ( !this.rkeConfig.etcd ) {
        set(this.rkeConfig, 'etcd', {
          disableSnapshots:     false,
          s3:                   null,
          snapshotRetention:    5,
          snapshotScheduleCron: '0 */5 * * *',
        });
      } else if (typeof this.rkeConfig.etcd.disableSnapshots === 'undefined') {
        const disableSnapshots = !this.rkeConfig.etcd.snapshotRetention && !this.rkeConfig.etcd.snapshotScheduleCron;

        set(this.rkeConfig.etcd, 'disableSnapshots', disableSnapshots);
      }

      // Namespaces if required - this is mainly for custom provisioners via extensions that want
      // to allow creating their resources in a different namespace
      if (this.needsNamespace) {
        this.allNamespaces = await this.$store.dispatch('management/findAll', { type: NAMESPACE });
      }

      if ( this.value.spec.defaultPodSecurityPolicyTemplateName === undefined ) {
        set(this.value.spec, 'defaultPodSecurityPolicyTemplateName', '');
      }

      if ( this.value.spec.defaultPodSecurityAdmissionConfigurationTemplateName === undefined ) {
        set(this.value.spec, 'defaultPodSecurityAdmissionConfigurationTemplateName', '');
      }
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

    applyChartValues(rkeConfig) {
      rkeConfig.chartValues = {};
      this.addonNames.forEach((name) => {
        const key = this.chartVersionKey(name);
        const userValues = this.userChartValues[key];

        if (userValues) {
          set(rkeConfig.chartValues, name, userValues);
        }
      });
    },
    chartVersionFor(chartName) {
      const entry = this.chartVersions[chartName];

      if ( !entry ) {
        return null;
      }

      const out = this.$store.getters['catalog/version']({
        repoType:    'cluster',
        repoName:    entry.repo,
        chartName,
        versionName: entry.version,
      });

      return out;
    },
    refreshYamls() {
      const keys = Object.keys(this.$refs).filter((x) => x.startsWith('yaml'));

      for ( const k of keys ) {
        const entry = this.$refs[k];
        const list = isArray(entry) ? entry : [entry];

        for ( const component of list ) {
          component?.refresh(); // `yaml` ref can be undefined on switching from Basic to Addon tab (Azure --> Amazon --> addon)
        }
      }
    },

    done() {
      // TODO check if this applies
      const routeName = 'c-cluster-product-resource';

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
    handleEnabledSystemServicesChanged(val) {
      set(this.serverConfig, 'disable', val);
    },

    async _doSaveOverride(btnCb) {
      // We cannot use the hook, because it is triggered on YAML toggle without restore initialized data
      this.agentConfigurationCleanup();

      if ( this.errors ) {
        clear(this.errors);
      }

      const isEditVersion = this.liveValue?.spec?.kubernetesVersion !== this.value?.spec?.kubernetesVersion;
      const hasPspManuallyAdded = !!this.value.spec.rkeConfig?.machineGlobalConfig?.['kube-apiserver-arg'];

      if (isEditVersion && !this.needsPSP && hasPspManuallyAdded) {
        if (!await this.showPspConfirmation()) {
          return btnCb('cancelled');
        }
      }

      if (isEditVersion) {
        const shouldContinue = await this.showAddonConfirmation();

        if (!shouldContinue) {
          return btnCb('cancelled');
        }
      }

      if (this.value.cloudProvider === 'aws') {
        const missingProfileName = this.machinePools.some((mp) => !mp.config.iamInstanceProfile);

        if (missingProfileName) {
          this.errors.push(this.t('cluster.validation.iamInstanceProfileName', {}, true));
        }
      }

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

      // Store the current data for fleet and cluster agent so that we can re-apply it later if the save fails
      // The cleanup occurs before save with agentConfigurationCleanup()
      const clusterAgentDeploymentCustomization = this.value.spec[CLUSTER_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[CLUSTER_AGENT_CUSTOMIZATION])) : null;
      const fleetAgentDeploymentCustomization = this.value.spec[FLEET_AGENT_CUSTOMIZATION] ? JSON.parse(JSON.stringify(this.value.spec[FLEET_AGENT_CUSTOMIZATION])) : null;

      await this.save(btnCb);

      // comes from createEditView mixin
      // if there are any errors saving, restore the agent config data
      if (this.errors?.length) {
        // Ensure the agent configuration is set back to the values before we changed (cleaned) it
        set(this.value.spec, CLUSTER_AGENT_CUSTOMIZATION, clusterAgentDeploymentCustomization);
        set(this.value.spec, FLEET_AGENT_CUSTOMIZATION, fleetAgentDeploymentCustomization);
      }
    },
    // Set busy before save and clear after save
    async saveOverride(btnCb) {
      this.$set(this, 'busy', true);

      return this._doSaveOverride((done) => {
        this.$set(this, 'busy', false);

        return btnCb(done);
      });
    },

    async actuallySave() {
      console.log('SAVED:')
      console.log(JSON.stringify(this.value.spec));
      await this.value.save();
    },
    get,
  },
  mounted() {},
  created() {}
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
    :validation-passed="fvFormIsValid"
    :resource="value"
    :errors="errors"
    :cancel-event="true"
    :done-route="doneRoute"
    :apply-hooks="applyHooks"
    :generate-yaml="generateYaml"
    class="rke2"
    component-testid="custom-edit"
    @done="done"
    @finish="saveOverride"
    @cancel="cancel"
    @error="fvUnreportedValidationErrors"
  >
    <div class="header-warnings">
      <Banner
        color="warning"
      >
        <span v-clean-html="t('cluster.banner.rke2-k3-reprovisioning', {}, true)" />
      </Banner>
    </div>
    <div
      class="mt-20"
    >
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        :namespace-options="allNamespaces"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
        :rules="{name:fvGetAndReportPathRules('metadata.name')}"
      />

      <!-- Cluster Tabs -->
      <h2 v-t="'cluster.tabs.cluster'" />
      <Tabbed
        :side-tabs="true"
        class="min-height"
      >
        <Tab
          name="basic"
          label-key="cluster.tabs.basic"
          :weight="11"
          @active="refreshYamls"
        >
          <!-- Basic -->
          <Basics
            v-model="value"
            :live-value="liveValue"
            :mode="mode"
            :provider="provider"
            :psps="psps"
            :user-chart-values="userChartValues"
            :credential="credential"
            :cis-override="cisOverride"
            :cis-psa-change-banner="cisPsaChangeBanner"
            :all-psps="allPSPs"
            :all-psas="allPSAs"
            :addon-versions="addonVersions"
            :show-deprecated-patch-versions="showDeprecatedPatchVersions"
            :needs-psp="needsPSP"
            :selected-version="selectedVersion"
            :is-harvester-driver="false"
            :is-harvester-incompatible="false"
            :version-options="versionOptions"
            :cluster-is-already-created="clusterIsAlreadyCreated"
            :initial-cloud-provider="initialCloudProvider"
            :is-elemental-cluster="isElementalCluster"
            :has-psa-templates="hasPsaTemplates"
            :is-k3s="isK3s"
            :have-arg-info="haveArgInfo"
            :show-cni="showCni"
            :show-cloud-provider="showCloudProvider"
            :is-harvester-external-credential="false"
            :unsupported-cloud-provider="false"
            @cilium-ipv6-changed="handleCiliumIpv6Changed"
            @enabled-system-services-changed="handleEnabledSystemServicesChanged"
            @kubernetes-changed="handleKubernetesChange"
            @psp-changed="handlePspChanged"
            @cis-changed="handleCisChanged"
            @psa-default-changed="handlePsaDefaultChanged"
            @show-deprecated-patch-versions-changed="handleShowDeprecatedPatchVersionsChanged"
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
            v-model="value"
            :mode="mode"
            :onMembershipUpdate="onMembershipUpdate"
          />
        </Tab>
        <AgentEnv
          v-model="value"
          :mode="mode"
        />
        <Labels
          v-model="value"
          :mode="mode"
        />
        <!-- Networking -->
        <Tab
          v-if="haveArgInfo"
          name="networking"
          label-key="cluster.tabs.networking"
        >
          <Networking
            v-model="value"
            :mode="mode"
            :is-edit="isEdit"
            :selected-version="selectedVersion"
            :cluster-is-already-created="clusterIsAlreadyCreated"
            :is-view="isView"
          />
        </Tab>
        <!-- Upgrade -->
        <Tab
          name="upgrade"
          label-key="cluster.tabs.upgrade"
        >
          <Upgrade
            v-model="value"
            :get="get"
            :mode="mode"
          />
        </Tab>
        <!-- Cluster Agent Configuration -->
        <Tab
          name="clusteragentconfig"
          label-key="cluster.agentConfig.tabs.cluster"
        >
          <AgentConfiguration
            v-if="value.spec.clusterAgentDeploymentCustomization"
            v-model="value.spec.clusterAgentDeploymentCustomization"
            data-testid="rke2-cluster-agent-config"
            type="cluster"
            :mode="mode"
          />
        </Tab>

        <!-- Fleet Agent Configuration -->
        <Tab
          name="fleetagentconfig"
          label-key="cluster.agentConfig.tabs.fleet"
        >
          <AgentConfiguration
            v-if="value.spec.fleetAgentDeploymentCustomization"
            v-model="value.spec.fleetAgentDeploymentCustomization"
            data-testid="rke2-fleet-agent-config"
            type="fleet"
            :mode="mode"
          />
        </Tab>
      </Tabbed>
    </div>
  </CruResource>
</template>

<style lang="scss" scoped>
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
