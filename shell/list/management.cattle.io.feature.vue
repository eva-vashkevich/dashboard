<script>
import { mapState, mapGetters } from 'vuex';
import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal';
import { Card } from '@components/Card';
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { getVendor } from '@shell/config/private-label';

export default {
  components: {
    AsyncButton,
    Banner,
    Card,
    ResourceTable,
    LabeledInput,
    AppModal,
  },
  mixins: [ResourceFetch],
  props:  {
    resource: {
      type:     String,
      required: true,
    },

    schema: {
      type:     Object,
      required: true,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    await this.$fetchType(this.resource);

    this.serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    if (this.serverUrlSetting?.value) {
      this.serverUrl = this.serverUrlSetting.value;
    } else {
      this.noUrlSet = true;
      this.serverUrl = window.location.origin;
    }
  },

  data() {
    return {
      update:           [],
      updateMode:       'activate',
      error:            null,
      enabling:         false,
      restart:          false,
      waiting:          false,
      timer:            null,
      serverUrlSetting: {},
      serverUrl:        '',
      noUrlSet:         false,
      showModal:        false,
      vendor:           getVendor(),
    };
  },

  computed: {
    ...mapState('action-menu', ['showPromptUpdate', 'toUpdate']),
    ...mapGetters({ t: 'i18n/t' }),

    filteredRows() {
      return this.rows.filter((x) => x.name !== 'fleet');
    },

    promptForUrl() {
      return this.update?.id === 'multi-cluster-management' && this.noUrlSet;
    },

    enableRowActions() {
      const schema = this.$store.getters[`management/schemaFor`](MANAGEMENT.FEATURE);

      return schema?.resourceMethods?.includes('PUT');
    },
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  },

  watch: {
    showPromptUpdate(show) {
      if (show) {
        // Clear last error
        this.error = null;

        this.showModal = true;
      } else {
        this.showModal = false;
      }
    },

    toUpdate(neu) {
      // Only support updating one at a time - bulk does not make sense, as they may
      // be in different states and with different restart values
      this.update = Array.isArray(neu) ? neu[0] : neu;
      if (this.update) {
        this.restart = this.update.restartRequired;
        // If the value is currently false, then we will be enabling it
        this.enabling = !this.update.enabled;
        this.updateMode = this.enabling ? 'activate' : 'deactivate';
      }
    }
  },

  methods: {
    close() {
      this.$store.commit('action-menu/togglePromptUpdate');

      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },

    toggleFlag(btnCB) {
      if (this.restart) {
        this.doToggleWithRestart(btnCB);
      } else {
        this.doToggle(btnCB);
      }
    },

    async doToggle(btnCB) {
      this.error = null;
      try {
        this.update.spec.value = !this.update.enabled;
        await this.update.save();
        btnCB(true);
        this.close();
      } catch (err) {
        // An error occurred, so toggle back the value - the call failed, so the change was not made
        this.update.spec.value = !this.update.enabled;
        this.error = err.message || err;
        btnCB(false);
      }
    },

    doToggleWithRestart(btnCB) {
      this.error = null;
      try {
        this.update.spec.value = !this.update.enabled;
        // await can go back in when backend returns from the save before restarting
        this.update.save();
      } catch (err) {}

      this.waitForBackend(btnCB, this.update.id);
      this.waiting = true;
    },

    waitForBackend(btnCB, id) {
      const url = `/v3/features/${ id }`;

      this.timer = setTimeout(async() => {
        try {
          const response = await this.$axios.get(url, { timeout: 5000 });

          if (response?.status === 200) {
            await this.$store.dispatch('management/findAll', { type: this.resource, opt: { force: true } });
            btnCB(true);
            this.close();
            this.waiting = false;
          }
        } catch (e) {}

        if (this.waiting) {
          this.waitForBackend(btnCB, id);
        }
      }, 5000);
    },

    async saveUrl(btnCB) {
      try {
        this.serverUrlSetting.value = this.serverUrl;
        await this.serverUrlSetting.save();
        btnCB(true);
      } catch (err) {
        this.error = err;
        btnCB(false);
      }
    },
  }
};
</script>

<template>
  <div>
    <ResourceTable
      :schema="schema"
      :rows="filteredRows"
      :row-actions="enableRowActions"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
    >
      <template #cell:name="scope">
        <div class="feature-name">
          <div>{{ scope.row.nameDisplay }}</div>
          <i
            v-if="scope.row.status.lockedValue !== null"
            class="icon icon-lock"
          />
        </div>
      </template>
    </ResourceTable>
    <app-modal
      v-if="showModal"
      class="update-modal"
      name="toggleFlag"
      :width="450"
      height="auto"
      styles="max-height: 100vh;"
      :click-to-close="!restart || !waiting"
      :trigger-focus-trap="true"
      @close="close"
    >
      <Card
        v-if="!waiting"
        class="prompt-update"
        :show-highlight-border="false"
      >
        <template #title>
          <h4 class="text-default-text">
            {{ t('featureFlags.title') }}
          </h4>
        </template>
        <template #body>
          <div
            v-if="update"
            class="mb-10"
          >
            <div v-if="enabling">
              <span>
                {{ t('featureFlags.promptActivate', {flag: update.id}) }}
              </span>
              <div
                v-if="promptForUrl"
                class="mt-10"
              >
                <span> {{ t('featureFlags.requiresSetting') }}</span>
                <div
                  :style="{'align-items':'center'}"
                  class="row mt-10"
                >
                  <LabeledInput
                    v-model:value="serverUrl"
                    :label="t('setup.serverUrl.label')"
                  />
                  <div class="col pl-5">
                    <AsyncButton @click="saveUrl" />
                  </div>
                </div>
              </div>
            </div>
            <span v-else>
              {{ t('featureFlags.promptDeactivate', {flag: update.id}) }}
            </span>
            <Banner
              v-if="restart"
              color="error"
              :label="t('featureFlags.restartRequired', vendor)"
            />
          </div>
          <div class="text-error mb-10">
            {{ error }}
          </div>
        </template>
        <template #actions>
          <button
            class="btn role-secondary"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            :disabled="promptForUrl && !serverUrlSetting.value"
            :mode="updateMode"
            class="btn bg-error ml-10"
            @click="toggleFlag"
          />
        </template>
      </Card>
      <Card
        v-else
        class="prompt-update"
        :show-highlight-border="false"
      >
        <template #title>
          <h4 class="text-default-text">
            {{ t('featureFlags.restart.title') }}
          </h4>
        </template>
        <template #body>
          <div class="waiting">
            <p>{{ t('featureFlags.restart.wait') }}</p>
            <span class="restarting-icon">
              <i class=" icon icon-spinner icon-spin" />
            </span>
          </div>
        </template>
        <template #actions>
          <button
            class="btn role-secondary"
            @click="close"
          >
            {{ t('generic.cancel') }}
          </button>
        </template>
      </Card>
    </app-modal>
  </div>
</template>

<style lang='scss' scoped>
  .prompt-update {
    &.card-container {
      box-shadow: none;
    }

    :deep() .card-actions {
      display: flex;
      justify-content: center;
    }
  }

  .waiting {
    text-align: center;
    font-size: 14px;
    margin: 10px 0;

    p {
      line-height: 20px;;
    }
  }

  .restarting-icon {
    display: flex;
    justify-content: center;
    margin-top: 10px;

    > I {
    font-size: 24px;
    }
  }

  .feature-name {
    align-items: center;
    display: flex;

    > i {
      margin-left: 10px;
    }
  }
</style>
