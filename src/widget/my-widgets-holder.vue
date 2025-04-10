<script setup lang="ts">
import { inject } from 'vue';

import FloatingWidget from './floating-widget.vue';

import { widgetsToken } from '@/injection-tokens';

const widgets = inject(widgetsToken)!;

const closeWidget = (key: number) => {
  const closeIdx = widgets.value.findIndex((x) => x.key === key);

  if (closeIdx !== -1) {
    widgets.value.splice(closeIdx, 1);
  }
};
</script>

<template>
  <FloatingWidget
    v-for="widget in widgets"
    :key="widget.key"
    :label="widget.label"
    :update-period="widget.updatePeriod"
    :source-code="widget.sourceCode"
    @close="closeWidget(widget.key)"
  />
</template>

<style scoped></style>
