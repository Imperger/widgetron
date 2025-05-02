<script setup lang="ts">
import { computed } from 'vue';

import type { WidgetModelFormattedText, WidgetModelText } from '../model/widget-model-text';

import { isPlainText } from './text-view-guard';

export interface TextViewProps {
  value: WidgetModelText;
}

const { value } = defineProps<TextViewProps>();

const styleProps = ({ type: _, text: _1, ...props }: WidgetModelFormattedText) => props;

const text = computed(() => (isPlainText(value) ? value : value.text));

const style = computed(() =>
  isPlainText(value) ? { color: 'var(--color-text-base)', fontSize: '1.5em' } : styleProps(value),
);
</script>

<template>
  <div class="text-view" :style="style">
    {{ text }}
  </div>
</template>

<style scoped>
.text-view {
  display: flex;
  flex-direction: row;
  justify-content: center;
  white-space: pre-wrap;
}
</style>
