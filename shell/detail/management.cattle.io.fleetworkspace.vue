<script>
import CountBox from '@shell/components/CountBox';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import { SCOPE_NAMESPACE, SCOPE_CLUSTER } from '@shell/components/RoleBindings.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { FLEET } from '@shell/config/types';

export default {
  name: 'DetailWorkspace',

  components: {
    CountBox,
    ResourceTabs
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    clustersLabel() {
      return this.t(`typeLabel."${ FLEET.CLUSTER }"`, { count: this.value.counts.cluster });
    },
    clusterGroupsLabel() {
      return this.t(`typeLabel."${ FLEET.CLUSTER_GROUP }"`, { count: this.value.counts.clusterGroup });
    },
    gitRepoLabel() {
      return this.t(`typeLabel."${ FLEET.GIT_REPO }"`, { count: this.value.counts.gitRepos });
    },
    helmOpsLabel() {
      return this.t(`typeLabel."${ FLEET.HELM_OP }"`, { count: this.value.counts.helmOps });
    },

    SCOPE_NAMESPACE() {
      return SCOPE_NAMESPACE;
    },

    SCOPE_CLUSTER() {
      return SCOPE_CLUSTER;
    },

    FLEET_NAME() {
      return FLEET_NAME;
    }
  },
};
</script>

<template>
  <div>
    <div class="mb-20">
      <div class="row">
        <div class="col span-3">
          <CountBox
            :count="value.counts.gitRepos"
            :name="gitRepoLabel"
            :primary-color-var="'--sizzle-3'"
          />
        </div>
        <div class="col span-3">
          <CountBox
            :count="value.counts.helmOps"
            :name="helmOpsLabel"
            :primary-color-var="'--sizzle-3'"
          />
        </div>
        <div class="col span-3">
          <CountBox
            :count="value.counts.clusters"
            :name="clustersLabel"
            :primary-color-var="'--sizzle-1'"
          />
        </div>
        <div class="col span-3">
          <CountBox
            :count="value.counts.clusterGroups"
            :name="clusterGroupsLabel"
            :primary-color-var="'--sizzle-2'"
          />
        </div>
      </div>
    </div>
    <ResourceTabs
      :value="value"
      mode="view"
    />
  </div>
</template>
