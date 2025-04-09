<script setup lang="ts">
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as ts from 'typescript';
import { computed, onUnmounted, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Environment, EnvironmentChannel } from './input/environment';
import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import type { UIInputComponent } from './input/ui-input-component';
import type { UITextInput } from './input/ui-text-input';
import UiTextInput from './input/ui-text-input.vue';
import type { WidgetModel } from './model/widget-model';
import TableView from './table-view.vue';

import FloatingWindow from '@/components/floating-window.vue';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { safeEval } from '@/lib/safe-eval/safe-eval';
import { SafeTaskRunner } from '@/lib/safe-task-runner';
import { TypescriptExtractor } from '@/lib/typescript/typescript-extractor';
import QueryWorker from '@/widget/query-worker?worker&inline';

dayjs.extend(duration);

export interface WidgetProps {
  updatePeriod: number;
  sourceCode: string;
}

export interface FloatingWidgetEvents {
  (e: 'close'): void;
}

export type UIInputComponentWithType = UIInputComponent & { type: string };

export type OnlyUIInputPropertiesWithType = {
  [K in keyof OnlyUIInputProperties]: UIInputComponentWithType;
};

const { updatePeriod, sourceCode } = defineProps<WidgetProps>();

const emit = defineEmits<FloatingWidgetEvents>();

const route = useRoute();

const uiInput = ref<OnlyUIInputPropertiesWithType | null>(null);

const model = ref<WidgetModel | null>(null);

const worker = new SafeTaskRunner(QueryWorker);

let unmounted = false;
let isRunning = false;

const channelEnvironment = (): EnvironmentChannel | null => {
  if (route.params.channel === undefined) {
    return null;
  }

  const name = reinterpret_cast<string>(route.params.channel);

  const viewers = Number.parseInt(
    reinterpret_cast<HTMLElement | null>(
      document.querySelector('[data-a-target="animated-channel-viewers-count"] span'),
    )?.innerText ?? '-1',
  );

  if (viewers === -1) {
    return { online: false, name };
  }

  const game =
    reinterpret_cast<HTMLElement | null>(
      document.querySelector('[data-a-target="stream-game-link"] span'),
    )?.innerText ?? '';

  const durationStr =
    reinterpret_cast<HTMLElement | null>(document.querySelector('.live-time span'))?.innerText ??
    '0:0:0';

  const [hours, minutes, seconds] = durationStr.split(':').map(Number);

  const duration = dayjs
    .duration({
      hours,
      minutes,
      seconds,
    })
    .asMilliseconds();

  return {
    online: true,
    name,
    game,
    startTime: new Date(Date.now() - duration),
    viewers,
  };
};

const collectEnvironment = (): Environment => {
  const channel = channelEnvironment();

  return { ...(channel && { channel }) };
};

const setupUIInput = async (sourceFile: ts.SourceFile) => {
  const properties = TypescriptExtractor.interfaceProperties(sourceFile, 'UIInput');

  const onUISetupBody = TypescriptExtractor.functionBody(sourceFile, 'onUISetup');

  if (onUISetupBody === null) {
    emit('close');
    return null;
  }

  const onQueryBodyJs = ts.transpileModule(onUISetupBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const uiInputTemplate = await safeEval<OnlyUIInputProperties>(
    onUISetupBody.async,
    [{ parameter: 'env', value: collectEnvironment() }],
    onQueryBodyJs,
  );

  return [...Object.entries(uiInputTemplate)].reduce(
    (acc, [prop, config]) => ({ ...acc, [prop]: { ...config, type: properties.get(prop) } }),
    {},
  );
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

  const uploaded = await worker.upload(onQueryBody.async, ['db', 'input'], onQueryBodyJs);

  if (!uploaded) {
    emit('close');
    return;
  }
};

const setup = async () => {
  const sourceFile = ts.createSourceFile('main.ts', sourceCode, ts.ScriptTarget.Latest, true);

  uiInput.value = await setupUIInput(sourceFile);

  await uploadCode(sourceFile);
};

watch(
  () => sourceCode,
  async () => {
    await setup();

    if (!isRunning) {
      isRunning = true;

      onExecute();
    }
  },
  { immediate: true },
);

const onExecute = async () => {
  try {
    model.value = reinterpret_cast<WidgetModel>(await worker.execute(toRaw(uiInput.value)));

    setTimeout(() => onExecute(), updatePeriod);
  } catch (e) {
    isRunning = false;

    if (unmounted) {
      return;
    }

    console.error(e);

    emit('close');
  }
};

const uiInputComponents = computed(() =>
  [...Object.entries(uiInput.value ?? {})].map(([id, state]) => ({ id, ...state })),
);

const is = <T extends UIInputComponent>(x: object, type: string): x is T =>
  'type' in x && x.type === type;

onUnmounted(() => {
  unmounted = true;

  worker.terminate();
});
</script>

<template>
  <FloatingWindow @close="emit('close')" style="background-color: white">
    <div class="ui-input">
      <template v-for="component in uiInputComponents" :key="component.id">
        <UiTextInput
          v-if="is<UITextInput>(component, 'UITextInput')"
          :label="component.label"
          :value="component.text"
          @update:value="(e) => ((uiInput![component.id] as UITextInput).text = e)"
        />
      </template>
    </div>
    <div class="data-view">
      <TableView v-if="model?.type === 'table'" :rows="model.rows" />
    </div>
  </FloatingWindow>
</template>

<style scoped>
.ui-input {
  padding: 5px;
  background-color: var(--color-background-base);
}

.data-view {
  height: 100%;
  overflow: auto;
  background-color: var(--color-background-base);
}
</style>
