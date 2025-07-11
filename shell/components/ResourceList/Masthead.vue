<script>
import { mapGetters } from 'vuex';
import Favorite from '@shell/components/nav/Favorite';
import TypeDescription from '@shell/components/TypeDescription';
import { get } from '@shell/utils/object';
import { AS, _YAML } from '@shell/config/query-params';
import ResourceLoadingIndicator from './ResourceLoadingIndicator';
import TabTitle from '@shell/components/TabTitle';

/**
 * Resource List Masthead component.
 */
export default {

  name: 'MastheadResourceList',

  components: {
    Favorite,
    TypeDescription,
    ResourceLoadingIndicator,
    TabTitle
  },
  props: {
    resource: {
      type:     String,
      required: true,
    },
    favoriteResource: {
      type:    String,
      default: null
    },
    schema: {
      type:    Object,
      default: null,
    },
    typeDisplay: {
      type:    String,
      default: null,
    },
    isCreatable: {
      type:    Boolean,
      default: null,
    },
    isYamlCreatable: {
      type:    Boolean,
      default: null,
    },
    createLocation: {
      type:    Object,
      default: null,
    },
    yamlCreateLocation: {
      type:    Object,
      default: null,
    },
    createButtonLabel: {
      type:    String,
      default: null
    },
    loadResources: {
      type:    Array,
      default: () => []
    },

    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    showIncrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'masthead'
    }
  },

  data() {
    const params = { ...this.$route.params };

    const formRoute = { name: `${ this.$route.name }-create`, params };

    const hasEditComponent = this.$store.getters['type-map/hasCustomEdit'](this.resource);

    const yamlRoute = {
      name:  `${ this.$route.name }-create`,
      params,
      query: { [AS]: _YAML },
    };

    return {
      formRoute,
      yamlRoute,
      hasEditComponent,
    };
  },

  computed: {
    get,
    ...mapGetters(['isExplorer', 'currentCluster']),

    resourceName() {
      if (this.schema) {
        return this.$store.getters['type-map/labelFor'](this.schema);
      }

      return this.resource;
    },

    _typeDisplay() {
      if ( this.typeDisplay !== null) {
        return this.typeDisplay;
      }

      if ( !this.schema ) {
        return '?';
      }

      return this.$store.getters['type-map/labelFor'](this.schema, 99);
    },

    _isYamlCreatable() {
      if ( this.isYamlCreatable !== null) {
        return this.isYamlCreatable;
      }

      return this.schema && this._isCreatable && this.$store.getters['type-map/optionsFor'](this.resource).canYaml;
    },

    _isCreatable() {
      // Does not take into account hasEditComponent, such that _isYamlCreatable works
      if ( this.isCreatable !== null) {
        return this.isCreatable;
      }

      // blocked-post means you can post through norman, but not through steve.
      if ( this.schema && !this.schema?.collectionMethods.find((x) => ['blocked-post', 'post'].includes(x.toLowerCase())) ) {
        return false;
      }

      return this.$store.getters['type-map/optionsFor'](this.resource).isCreatable;
    },

    _createLocation() {
      return this.createLocation || this.formRoute;
    },

    _yamlCreateLocation() {
      return this.yamlCreateLocation || this.yamlRoute;
    },

    _createButtonlabel() {
      const overrideLabel = this.$store.getters['type-map/optionsFor'](this.resource).listCreateButtonLabelKey;

      if (overrideLabel) {
        return this.t(overrideLabel);
      }

      return this.createButtonLabel || this.t('resourceList.head.create');
    },
  }
};
</script>

<template>
  <header class="with-subheader">
    <slot name="typeDescription">
      <TypeDescription :resource="resource" />
    </slot>
    <div class="title">
      <h1 class="m-0">
        <TabTitle>{{ _typeDisplay }}</TabTitle> <Favorite
          v-if="isExplorer"
          :resource="favoriteResource || resource"
        />
      </h1>
      <ResourceLoadingIndicator
        v-if="showIncrementalLoadingIndicator"
        :resources="loadResources"
        :indeterminate="loadIndeterminate"
      />
    </div>
    <div class="sub-header">
      <slot name="subHeader">
        <!--Slot content-->
      </slot>
    </div>
    <div class="actions-container">
      <slot name="actions">
        <div class="actions">
          <slot name="extraActions" />

          <slot name="createButton">
            <router-link
              v-if="hasEditComponent && _isCreatable"
              :to="_createLocation"
              class="btn role-primary"
              :data-testid="componentTestid+'-create'"
            >
              {{ _createButtonlabel }}
            </router-link>
            <router-link
              v-else-if="_isYamlCreatable"
              :to="_yamlCreateLocation"
              class="btn role-primary"
              :data-testid="componentTestid+'-create-yaml'"
            >
              {{ t("resourceList.head.createFromYaml") }}
            </router-link>
          </slot>
        </div>
      </slot>
    </div>
  </header>
</template>

<style lang="scss" scoped>
  .title {
    align-items: center;
    display: flex;
    h1 {
      margin: 0;
    }
  }

  header {
    margin-bottom: 20px;
  }

  header.with-subheader {
    grid-template-areas:
      'type-banner type-banner'
      'title actions'
      'sub-header sub-header'
      'state-banner state-banner';
  }

  .sub-header {
    grid-area: sub-header;

    a {
      display: inline-block;
    }
  }
</style>
