<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import type { WidgetModel } from './model/widget-model';
import TableView from './table-view.vue';

import FloatingWindow from '@/components/floating-window.vue';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { SafeTaskRunner } from '@/lib/safe-task-runner';
import QueryWorker from '@/widget/query-worker?worker&inline';

export interface WidgetProps {
  updatePeriod: number;
  sourceCode: string;
  async: boolean;
}

export interface FloatingWidgetEvents {
  (e: 'close'): void;
}

const props = defineProps<WidgetProps>();

const emit = defineEmits<FloatingWidgetEvents>();

const model = ref<WidgetModel | null>(null);

const worker = new SafeTaskRunner(QueryWorker);

let unmounted = false;

onMounted(async () => {
  const uploaded = await worker.upload(props.sourceCode, props.async);

  if (!uploaded) {
    emit('close');
    return;
  }

  onExecute();
});

const onExecute = async () => {
  try {
    model.value = reinterpret_cast<WidgetModel>(await worker.execute());

    setTimeout(() => onExecute(), props.updatePeriod);
  } catch (e) {
    if (unmounted) {
      return;
    }

    console.error(e);

    emit('close');
  }
};

onUnmounted(() => {
  unmounted = true;

  worker.terminate();
});
</script>

<template>
  <FloatingWindow @close="emit('close')" style="background-color: white">
    <div class="data-view">
      <TableView v-if="model?.type === 'table'" :rows="model.rows" />
    </div>
  </FloatingWindow>
</template>

<style scoped>
.data-view {
  overflow: auto;
  background-color: var(--color-background-base);
}
</style>
