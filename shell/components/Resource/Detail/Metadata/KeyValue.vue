<script lang="ts">
import { computed, toRefs } from 'vue';
import Rectangle from '@shell/components/Resource/Detail/Metadata/Rectangle.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

export type KeyValueType = {[key: string]: string};

export interface Row {
    key: string;
    value: string;
}

export interface KeyValueProps {
    propertyName: string;
    rows: Row[];
    maxRows?: number;
    outline?: boolean;

    onShowConfiguration?: (returnFocusSelector: string) => void;
}
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<KeyValueProps>(),
  {
    outline: false, maxRows: 4, onShowConfiguration: undefined
  }
);
const {
  propertyName, rows, maxRows, outline
} = toRefs(props);

const store = useStore();
const i18n = useI18n(store);
const emit = defineEmits(['show-configuration']);

// Account for the show all button
const visibleRowsLength = computed(() => (rows.value.length > maxRows.value ? maxRows.value - 1 : rows.value.length));
const visibleRows = computed(() => rows.value.slice(0, visibleRowsLength.value));
const lowercasePropertyName = computed(() => propertyName.value.toLowerCase());

const showShowAllButton = computed(() => rows.value.length > maxRows.value);
const showAllLabel = computed(() => `Show all ${ lowercasePropertyName.value }`);

const displayValue = (row: Row) => `${ row.key }: ${ row.value }`;
const showConfigurationEmptyDataTestId = computed(() => `empty-show-configuration_${ propertyName.value.replaceAll(' ', '').toLowerCase() }`);
const showConfigurationEmptyFocusSelector = computed(() => `[data-testid="${ showConfigurationEmptyDataTestId.value }"]`);
const showConfigurationMoreDataTestId = computed(() => `more-show-configuration_${ propertyName.value.replaceAll(' ', '').toLowerCase() }`);
const showConfigurationMoreFocusSelector = computed(() => `[data-testid="${ showConfigurationMoreDataTestId.value }"]`);
</script>

<template>
  <div class="key-value">
    <div class="heading">
      <span class="title text-deemphasized">{{ propertyName }}</span>
      <span class="count">{{ rows.length }}</span>
    </div>
    <div
      v-if="visibleRows.length === 0"
      class="empty mmt-2 text-deemphasized"
    >
      <div class="no-rows">
        {{ i18n.t('component.resource.detail.metadata.keyValue.noRows', {propertyName: lowercasePropertyName}) }}
      </div>
      <div class="show-configuration mmt-1">
        <a
          :data-testid="showConfigurationEmptyDataTestId"
          class="secondary text-deemphasized"
          href="#"
          @click="(ev: MouseEvent) => {ev.preventDefault(); emit('show-configuration', showConfigurationEmptyFocusSelector);}"
        >
          {{ i18n.t('component.resource.detail.metadata.keyValue.showConfiguration') }}
        </a>
      </div>
    </div>
    <div
      v-for="row in visibleRows"
      :key="displayValue(row)"
      class="row"
    >
      <Rectangle
        v-clean-tooltip="displayValue(row)"
        :outline="outline"
      >
        {{ displayValue(row) }}
      </Rectangle>
    </div>
    <a
      v-if="showShowAllButton"
      :data-testid="showConfigurationMoreDataTestId"
      href="#"
      class="show-all"
      @click="(ev: MouseEvent) => {ev.preventDefault(); emit('show-configuration', showConfigurationMoreFocusSelector);}"
    >
      {{ showAllLabel }}
    </a>
  </div>
</template>

<style lang="scss" scoped>
.key-value {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .count {
        margin-left: 24px;
    }

    .heading {
        margin-bottom: 8px;
    }

    .row {
        display: block;
        width: 100%;

        &:not(:nth-child(2)) {
            margin-top: 4px;
        }
    }
    .show-all {
        margin-top: 8px;
    }

    .rectangle {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-rows {
      line-height: 21px;
    }
}
</style>
