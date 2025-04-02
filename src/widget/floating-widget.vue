<script setup lang="ts">
import * as ts from 'typescript';
import { onMounted, onUnmounted, ref, toRaw } from 'vue';

import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import type { WidgetModel } from './model/widget-model';
import TableView from './table-view.vue';

import FloatingWindow from '@/components/floating-window.vue';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { safeEval } from '@/lib/safe-eval/safe-eval';
import { SafeTaskRunner } from '@/lib/safe-task-runner';
import { TypescriptExtractor } from '@/lib/typescript/typescript-extractor';
import QueryWorker from '@/widget/query-worker?worker&inline';

export interface WidgetProps {
  updatePeriod: number;
  sourceCode: string;
}

export interface FloatingWidgetEvents {
  (e: 'close'): void;
}

const { updatePeriod, sourceCode } = defineProps<WidgetProps>();

const emit = defineEmits<FloatingWidgetEvents>();

const uiInput = ref<OnlyUIInputProperties | null>(null);

const model = ref<WidgetModel | null>(null);

const worker = new SafeTaskRunner(QueryWorker);

let unmounted = false;

const setupUIInput = async (sourceFile: ts.SourceFile) => {
  const onUISetupBody = TypescriptExtractor.functionBody(sourceFile, 'onUISetup');

  if (onUISetupBody === null) {
    emit('close');
    return null;
  }

  const onQueryBodyJs = ts.transpileModule(onUISetupBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  return safeEval<OnlyUIInputProperties>(onQueryBodyJs, onUISetupBody.async);
};

const uploadCode = async (sourceFile: ts.SourceFile) => {
  const onQueryBody = TypescriptExtractor.functionBody(sourceFile, 'onQuery');

  if (onQueryBody === null) {
    emit('close');
    return;
  }

  const onQueryBodyJs = ts.transpileModule(onQueryBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const uploaded = await worker.upload(onQueryBodyJs, onQueryBody.async);

  if (!uploaded) {
    emit('close');
    return;
  }
};

onMounted(async () => {
  const sourceFile = ts.createSourceFile('main.ts', sourceCode, ts.ScriptTarget.Latest, true);

  uiInput.value = await setupUIInput(sourceFile);

  await uploadCode(sourceFile);

  onExecute();
});

const onExecute = async () => {
  try {
    model.value = reinterpret_cast<WidgetModel>(await worker.execute(toRaw(uiInput.value)));

    setTimeout(() => onExecute(), updatePeriod);
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
