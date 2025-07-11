<script>
import { mapGetters } from 'vuex';

import { CATALOG, UI_PLUGIN, SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { UI_PLUGIN_LABELS, UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { allHash } from '@shell/utils/promise';

import AsyncButton from '@shell/components/AsyncButton';

export default {
  emits: ['close'],

  components: { AsyncButton },

  props: {
    /**
     * Catalog object
     */
    catalog: {
      type:     Object,
      default:  () => {},
      required: true
    },
    /**
     * Callback to trigger refresh banner on extensions screen
     */
    refresh: {
      type:     Function,
      default:  () => {},
      required: true
    },
    /**
     * Callback when modal is closed
     */
    closed: {
      type:     Function,
      default:  () => {},
      required: true
    },
    resources: {
      type:    Array,
      default: () => []
    },
    registerBackgroundClosing: {
      type:    Function,
      default: () => {}
    }
  },

  async fetch() {
    if ( this.$store.getters['management/schemaFor'](UI_PLUGIN) ) {
      const plugins = this.$store.dispatch('management/findAll', { type: UI_PLUGIN });

      this.plugins = plugins || [];
    }
  },

  data() {
    return {
      busy:    false,
      plugins: null,
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),

    pluginsFromCatalogImage() {
      return this.plugins.filter((p) => p.metadata?.labels?.[UI_PLUGIN_LABELS.CATALOG_IMAGE]);
    }
  },

  methods: {
    closeDialog(result) {
      this.closed(result);

      if ( result ) {
        this.refresh();
      }

      this.$emit('close');
    },

    async uninstall() {
      this.busy = true;

      const catalog = this.catalog;
      const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });
      const pluginApps = apps.filter((app) => {
        if ( app.namespace === UI_PLUGIN_NAMESPACE ) {
          // Find the related apps from the deployed helm repository
          const charts = this.allCharts.filter((chart) => chart.repoName === catalog.repo?.metadata?.name);

          return charts.some((chart) => chart.chartName === app.metadata.name);
        }

        return false;
      });

      await this.removeCatalogResources(catalog);

      if ( pluginApps.length ) {
        try {
          pluginApps.forEach((app) => {
            app.remove();
          });
        } catch (e) {
          this.$store.dispatch('growl/error', {
            title:   this.t('plugins.error.generic'),
            message: e.message ? e.message : e,
            timeout: 10000
          }, { root: true });
        }

        await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
      }

      this.closeDialog(catalog);
    },

    async removeCatalogResources(catalog) {
      if ( catalog.name ) {
        const namespace = UI_PLUGIN_NAMESPACE;
        // of type KubeLabelSelector
        const labelSelector = { matchLabels: { [UI_PLUGIN_LABELS.CATALOG_IMAGE]: catalog.name } };

        const hash = await allHash({
          deployment: this.$store.dispatch('management/findLabelSelector', {
            type:     WORKLOAD_TYPES.DEPLOYMENT,
            matching: { namespace, labelSelector },
            opt:      { transient: true }
          }),
          service: this.$store.dispatch('management/findLabelSelector', {
            type:     SERVICE,
            matching: { namespace, labelSelector },
            opt:      { transient: true }
          }),
          repo: this.$store.dispatch('management/findLabelSelector', {
            type:     CATALOG.CLUSTER_REPO,
            matching: { labelSelector },
            opt:      { transient: true }
          })
        });

        for ( const resource of Object.keys(hash) ) {
          if ( hash[resource] ) {
            hash[resource].data.forEach((r) => r.remove());
          }
        }
      }
    }
  }
};
</script>

<template>
  <div class="plugin-install-dialog">
    <h4 class="mt-10">
      {{ t('plugins.uninstall.title', { name: catalog.name }) }}
    </h4>
    <div class="mt-10 dialog-panel">
      <div class="dialog-info">
        <p>
          {{ t('plugins.uninstall.catalog') }}
        </p>
      </div>
      <div class="dialog-buttons">
        <button
          :disabled="busy"
          class="btn role-secondary"
          data-testid="uninstall-ext-modal-cancel-btn"
          @click="closeDialog(false)"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="uninstall"
          data-testid="uninstall-ext-modal-uninstall-btn"
          @click="uninstall()"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .plugin-install-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      .dialog-info {
        flex: 1;
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
