<script setup lang="ts">
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as ts from 'typescript';
import { computed, inject, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Environment, EnvironmentChannel } from './api/environment';
import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import type { UIInputComponent } from './input/ui-input-component';
import type { UITextInput } from './input/ui-text-input';
import UiTextInput from './input/ui-text-input.vue';
import type { WidgetModel } from './model/widget-model';
import TableView from './table-view.vue';
import PieChart from './views/pie-chart.vue';
import { isTextView } from './views/text-view-guard';
import StringView from './views/text-view.vue';

import { twitchInteractorToken, widgetSharedStateToken } from '@/injection-tokens';
import { JsonObjectComparator, type JSONObject } from '@/lib/json-object-equal';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { SafeTaskRunner, type ExternalMessageListenerUnsubscriber } from '@/lib/safe-task-runner';
import { TypescriptExtractor } from '@/lib/typescript/typescript-extractor';
import FloatingWindow from '@/ui/floating-window.vue';
import QueryWorker from '@/widget/widget-worker?worker&inline';

dayjs.extend(duration);

interface UpdateResult {
  model: WidgetModel;
  input: JSONObject;
}

export interface WidgetProps {
  label?: string;
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

interface SendMessageAction {
  action: 'sendMessage';
  args: [string];
}

interface DeleteMessageAction {
  action: 'deleteMessage';
  args: [string];
}

interface BanUserAction {
  action: 'banUser';
  args: [string, string, string];
}

type Action = SendMessageAction | DeleteMessageAction | BanUserAction;

const { label = '', updatePeriod, sourceCode } = defineProps<WidgetProps>();

const emit = defineEmits<FloatingWidgetEvents>();

const twitchInteractor = inject(twitchInteractorToken);

const sharedState = inject(widgetSharedStateToken)!;

const route = useRoute();

const uiInput = ref<OnlyUIInputPropertiesWithType | null>(null);

const model = ref<WidgetModel | null>(null);

const worker = new SafeTaskRunner(QueryWorker);

let unmounted = false;
let isRunning = false;

let actionListenerUnsub: ExternalMessageListenerUnsubscriber | null = null;

const actionListener = async (action: Action) => {
  switch (action.action) {
    case 'sendMessage':
      await twitchInteractor?.sendMessage(...action.args);
      break;
    case 'deleteMessage':
      await twitchInteractor?.deleteMessage(...action.args);
      break;
    case 'banUser':
      await twitchInteractor?.banUser(...action.args);
      break;
  }
};

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
    return { online: false, name, chat: sharedState.channel?.chat ?? null };
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
    chat: sharedState.channel?.chat ?? null,
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

  const onUpdateBodyJs = ts.transpileModule(onUISetupBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  if (!(await worker.upload(onUISetupBody.async, ['api'], onUpdateBodyJs))) {
    emit('close');
    return null;
  }

  const uiInputTemplate = reinterpret_cast<OnlyUIInputProperties>(
    await worker.execute('onUISetup', { env: collectEnvironment() }),
  );

  return [...Object.entries(uiInputTemplate)].reduce(
    (acc, [prop, config]) => ({ ...acc, [prop]: { ...config, type: properties.get(prop) } }),
    {},
  );
};

const uploadCode = async (sourceFile: ts.SourceFile) => {
  const onUpdateBody = TypescriptExtractor.functionBody(sourceFile, 'onUpdate');

  if (onUpdateBody === null) {
    emit('close');
    return;
  }

  const onUpdateBodyJs = ts.transpileModule(onUpdateBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const uploaded = await worker.upload(onUpdateBody.async, ['input', 'api'], onUpdateBodyJs);

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
    const inputBeforeExecution = JSON.parse(JSON.stringify(toRaw(uiInput.value)));
    const result = reinterpret_cast<UpdateResult>(
      await worker.execute('onUpdate', toRaw(uiInput.value), { env: collectEnvironment() }),
    );

    if (
      JsonObjectComparator.equalShape(
        reinterpret_cast<JSONObject>(toRaw(uiInput.value)),
        result.input,
      )
    ) {
      if (!JsonObjectComparator.equal(inputBeforeExecution, result.input)) {
        uiInput.value = reinterpret_cast<OnlyUIInputPropertiesWithType>(result.input);
      }
    } else {
      throw new Error('UIInput object is malformed');
    }

    model.value = result.model;

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

onMounted(() => {
  actionListenerUnsub = worker.subscribeToUnrecognizedMessages<Action>(actionListener);
});

onUnmounted(() => {
  unmounted = true;

  actionListenerUnsub?.();

  worker.terminate();
});
</script>

<template>
  <FloatingWindow
    :title="label"
    :resizable="true"
    :min-width="100"
    :min-height="100"
    @close="emit('close')"
    class="floating-widget"
  >
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
      <div v-if="model === null">No view</div>
      <StringView v-else-if="isTextView(model)" :value="model" />
      <TableView v-else-if="model.type === 'table'" :rows="model.rows" />
      <PieChart v-else-if="model.type === 'piechart'" :segments="model.segments" />
    </div>
  </FloatingWindow>
</template>

<style scoped>
.floating-widget {
  overflow: hidden;
}

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
