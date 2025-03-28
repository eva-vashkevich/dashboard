<script>
import Loading from '@shell/components/Loading';
import ChartMixin from '@shell/mixins/chart';
import { Banner } from '@components/Banner';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import DateFormatter from '@shell/components/formatter/Date';
import isEqual from 'lodash/isEqual';
import { CHART, REPO, REPO_TYPE, VERSION } from '@shell/config/query-params';
import { ZERO_TIME } from '@shell/config/types';
import { mapGetters } from 'vuex';
import { compatibleVersionsFor } from '@shell/store/catalog';
import TypeDescription from '@shell/components/TypeDescription';

export default {
  components: {
    Banner,
    ChartReadme,
    DateFormatter,
    LazyImage,
    Loading,
    TypeDescription
  },

  mixins: [
    ChartMixin
  ],

  async fetch() {
    await this.fetchChart();
  },

  data() {
    return {
      ZERO_TIME,
      showLastVersions: 10,
      showMoreVersions: false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    versions() {
      return this.showMoreVersions ? this.mappedVersions : this.mappedVersions.slice(0, this.showLastVersions);
    },

    targetedAppWarning() {
      if (!this.existing) {
        return;
      }
      const url = this.$router.resolve(this.appLocation()).href;

      return this.isChartTargeted ? this.t('catalog.chart.errors.clusterToolExists', { url }, true) : '';
    },

    appVersion() {
      return this.version.appVersion || this.versionInfo?.chart?.appVersion;
    },

    home() {
      return this.version.home || this.versionInfo?.chart?.home;
    },

    maintainers() {
      const maintainers = this.version.maintainers || this.versionInfo?.chart?.maintainers || [];

      return maintainers.map((m) => {
        return {
          id:   m.name,
          text: m.name,
          url:  m.email ? `mailto:${ m.email }` : m.url
        };
      });
    },

    osWarning() {
      if (this.chart) {
        const compatible = compatibleVersionsFor(this.chart, this.currentCluster.workerOSs, this.showPreRelease );

        const currentlyCompatible = !!compatible.find((version) => {
          return version.version === this.targetVersion;
        });

        if (currentlyCompatible) {
          return false;
        } else if (compatible.length > 0) {
          return this.t('catalog.os.versionIncompatible');
        } else {
          return this.t('catalog.os.chartIncompatible');
        }
      }

      return false;
    },

    warningMessage() {
      const {
        deprecated, experimental, chartName: name, chartNameDisplay
      } = this.chart;
      const chartName = chartNameDisplay || name;

      if (deprecated && experimental) {
        return this.t('catalog.chart.deprecatedAndExperimentalWarning', { chartName });
      } else if (deprecated) {
        return this.t('catalog.chart.deprecatedWarning', { chartName });
      } else if (experimental) {
        return this.t('catalog.chart.experimentalWarning', { chartName });
      }

      return '';
    }

  },

  watch: {
    '$route.query'(neu, old) {
      // If the query changes, refetch the chart
      // When going back to app list, the query is empty and we don't want to refetch
      if ( !isEqual(neu, old) && Object.keys(neu).length > 0 ) {
        this.$fetch();
      }
    },
  },

  methods: {
    install() {
      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]: this.query.repoType,
          [REPO]:      this.query.repoName,
          [CHART]:     this.query.chartName,
          [VERSION]:   this.query.versionName,
        }
      });
    },

  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <TypeDescription resource="chart" />
    <Banner
      v-if="versionInfoError"
      color="error"
      :label="versionInfoError"
    />
    <div
      v-if="chart"
      class="chart-header"
    >
      <Banner
        v-if="warningMessage"
        color="warning"
        :label="warningMessage"
        data-testid="deprecation-and-experimental-banner"
      />
      <div class="name-logo-install">
        <div class="name-logo">
          <div class="logo-bg">
            <LazyImage
              :src="chart.icon"
              class="logo"
              :alt="t('catalog.charts.iconAlt', { app: chart.chartNameDisplay })"
            />
          </div>
          <h1>
            <router-link :to="{ name: 'c-cluster-apps-charts' }">
              {{ t('catalog.chart.header.charts') }}:
            </router-link>
            {{ chart.chartNameDisplay }} ({{ targetVersion }})
          </h1>
        </div>
        <button
          v-if="!requires.length"
          type="button"
          data-testid="btn-chart-install"
          class="btn role-primary"
          @click.prevent="install"
        >
          {{ t(`asyncButton.${action}.action` ) }}
        </button>
      </div>
      <div
        v-if="chart.windowsIncompatible"
        class="mt-5"
      >
        <label class="os-label">{{ t('catalog.charts.windowsIncompatible') }}</label>
      </div>
      <div
        v-if="requires.length || warnings.length || targetedAppWarning || osWarning"
        class="mt-20"
      >
        <Banner
          v-if="osWarning"
          color="error"
        >
          <span v-clean-html="osWarning" />
        </Banner>
        <Banner
          v-for="(msg, i) in requires"
          :key="i"
          color="error"
        >
          <span v-clean-html="msg" />
        </Banner>

        <Banner
          v-for="(msg, i) in warnings"
          :key="i"
          color="warning"
        >
          <span v-clean-html="msg" />
        </Banner>

        <Banner
          v-if="targetedAppWarning"
          color="warning"
        >
          <span v-clean-html="targetedAppWarning" />
        </Banner>
      </div>
      <div
        v-else-if="version && version.description"
        class="description mt-10"
      >
        <p>
          {{ version.description }}
        </p>
      </div>
    </div>

    <div class="spacer" />

    <div class="chart-content">
      <ChartReadme
        v-if="hasReadme"
        :version-info="versionInfo"
        class="chart-content__tabs"
      />
      <div
        v-else
        class="chart-content__tabs"
      >
        {{ t('catalog.install.appReadmeMissing', {}, true) }}
      </div>
      <div
        v-if="version"
        class="chart-content__right-bar ml-20"
      >
        <div class="chart-content__right-bar__section">
          <h3>
            {{ t('catalog.chart.info.chartVersions.label') }}
          </h3>
          <div
            v-for="vers of versions"
            :key="vers.id"
            class="chart-content__right-bar__section--cVersion"
          >
            <b v-if="vers.originalVersion === version.version">{{ vers.originalVersion === currentVersion ? t('catalog.install.versions.current', { ver: currentVersion }): vers.shortLabel }}</b>
            <a
              v-else
              v-clean-tooltip="vers.label.length > 16 ? vers.label : null"
              @click.prevent="selectVersion(vers)"
            >
              {{ vers.originalVersion === currentVersion ? t('catalog.install.versions.current', { ver: currentVersion }): vers.shortLabel }}
            </a>
            <DateFormatter
              v-if="vers.created !== ZERO_TIME"
              :value="vers.created"
              :show-time="false"
            />
          </div>
          <div class="mt-10 chart-content__right-bar__section--showMore">
            <button
              v-if="mappedVersions.length > showLastVersions"
              type="button"
              class="btn btn-sm role-link"
              @click="showMoreVersions = !showMoreVersions"
            >
              {{ t(`catalog.chart.info.chartVersions.${showMoreVersions ? 'showLess' : 'showMore'}`) }}
            </button>
          </div>
        </div>
        <div
          v-if="appVersion"
          class="chart-content__right-bar__section"
        >
          <h3 t>
            {{ t('catalog.chart.info.appVersion') }}
          </h3>
          {{ appVersion }}
        </div>
        <div
          v-if="home"
          class="chart-content__right-bar__section"
        >
          <h3>{{ t('catalog.chart.info.home') }}</h3>
          <a
            :href="home"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ home }}</a>
        </div>
        <div
          v-if="maintainers.length"
          class="chart-content__right-bar__section"
        >
          <h3>{{ t('catalog.chart.info.maintainers') }}</h3>
          <a
            v-for="m of maintainers"
            :key="m.id"
            :href="m.url"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ m.text }}</a>
        </div>
        <div
          v-if="version.sources"
          class="chart-content__right-bar__section"
        >
          <h3>{{ t('catalog.chart.info.related') }}</h3>
          <a
            v-for="s of version.sources"
            :key="s"
            :href="s"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ s }}</a>
        </div>
        <div
          v-if="version.urls"
          class="chart-content__right-bar__section"
        >
          <h3>{{ t('catalog.chart.info.chartUrls') }}</h3>
          <a
            v-for="url of version.urls"
            :key="url"
            :href="url"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >{{ version.urls.length === 1 ? 'Download': url }}</a>
        </div>
        <div
          v-if="version.keywords"
          class="chart-content__right-bar__section chart-content__right-bar__section--keywords"
        >
          <h3>{{ t('catalog.chart.info.keywords') }}</h3>
          {{ version.keywords.join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $name-height: 50px;
  $padding: 5px;

  .chart-header {

    .name-logo-install {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: $name-height;
    }

    .name-logo {
      display: flex;
      align-items: center;

      .logo-bg {
        height: $name-height;
        width: $name-height;
        background-color: white;
        border: $padding solid white;
        border-radius: calc( 3 * var(--border-radius));
        position: relative;
      }

      .logo {
        max-height: $name-height - 2 * $padding;
        max-width: $name-height - 2 * $padding;
        position: absolute;
        width: auto;
        height: auto;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
      }

      h1 {
        margin: 0 20px;
      }
    }

    .os-label{
      background-color: var(--warning-banner-bg);
      color: var(--warning);
    }

    .btn {
      height: 30px;
    }

    .description {
      margin-right: 80px;
    }
  }

  .chart-content {
    display: flex;
    &__tabs {
      flex: 1;
      min-width: 400px;
    }
    &__right-bar {
      min-width: 260px;
      max-width: 260px;

      &__section {
        display: flex;
        flex-direction: column;
        padding-bottom: 20px;
        word-break: break-all;
        a {
          cursor: pointer;
        }
        &--cVersion{
          display: flex;
          justify-content: space-between;
        }

        &--keywords{
         word-break: break-word;
        }

      }
    }
  }
</style>
