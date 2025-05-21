<script setup lang="ts">
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import * as ts from 'typescript';
import { computed, inject, onMounted, onUnmounted, ref, toRaw, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Environment, EnvironmentChannel } from './api/environment';
import DateTimePicker from './input/date-time-picker.vue';
import { NamingConvention } from './input/naming-convention';
import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import SliderInput from './input/slider-input.vue';
import type { UIButton } from './input/ui-button';
import UiButton from './input/ui-button.vue';
import type { UIDateTimePicker } from './input/ui-date-time-picker';
import type { UIInputComponent } from './input/ui-input-component';
import type { UISliderInput } from './input/ui-slider-input';
import type { UITextInput } from './input/ui-text-input';
import UiTextInput from './input/ui-text-input.vue';
import type { WidgetModel } from './model/widget-model';
import LineGraph from './views/line-graph.vue';
import PieChart from './views/pie-chart.vue';
import TableView from './views/table-view.vue';
import { isTextView } from './views/text-view-guard';
import TextView from './views/text-view.vue';

import {
  gqlInterceptorToken,
  twitchInteractorToken,
  widgetSharedStateToken,
} from '@/injection-tokens';
import { JsonObjectComparator, type JSONObject } from '@/lib/json-object-equal';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { SafeTaskRunner, type ExternalMessageListenerUnsubscriber } from '@/lib/safe-task-runner';
import { TypescriptExtractor } from '@/lib/typescript/typescript-extractor';
import type { GQLInterceptorListenerUnsubscriber } from '@/twitch/gql/gql-interceptor';
import type { SendChatMessageRequest } from '@/twitch/gql/types/send-chat-message-request';
import FloatingWindow from '@/ui/floating-window.vue';
import WidgetWorker from '@/widget/widget-worker?worker&inline';

dayjs.extend(duration);

interface UpdateResult {
  model?: WidgetModel;
  input: JSONObject;
}

export interface WidgetProps {
  label?: string;
  updatePeriod: number;
  sourceCode: string;
}

export interface FloatingWidgetEvents {
  (e: 'close'): void;
  (e: 'setFocus'): void;
}

export type UIInputComponentWithType = UIInputComponent & { type: string };

type IdentifiedUIComponent<T extends UIInputComponent> = T & { id: string; type: string };

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
const gqlInterceptor = inject(gqlInterceptorToken)!;

const sharedState = inject(widgetSharedStateToken)!;

const route = useRoute();

const uiInput = ref<OnlyUIInputPropertiesWithType | null>(null);

const model = ref<WidgetModel | null>(null);

const worker = new SafeTaskRunner(WidgetWorker);

let unmounted = false;
let isRunning = false;

let actionListenerUnsub: ExternalMessageListenerUnsubscriber | null = null;
let sendChatMessageTransformerUnsub: GQLInterceptorListenerUnsubscriber | null = null;

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

  return sharedState.channel?.stream
    ? {
        online: true,
        id: sharedState.channel?.roomId ?? '',
        name: sharedState.channel.roomDisplayName,
        game: sharedState.channel.game,
        startTime: sharedState.channel!.stream!.startTime,
        viewers: sharedState.channel.stream.viewers,
        chat: sharedState.channel?.chat ?? null,
      }
    : {
        online: false,
        id: sharedState.channel?.roomId ?? '',
        name: sharedState.channel?.roomDisplayName ?? '',
        game: sharedState.channel?.game ?? '',
        chat: sharedState.channel?.chat ?? null,
      };
};

const collectEnvironment = (): Environment => {
  const channel = channelEnvironment();

  return { ...(channel && { channel }) };
};

const uploadCode = async (
  fnName: string,
  parameters: string[],
  sourceFile: ts.SourceFile,
): Promise<boolean> => {
  const functionBody = TypescriptExtractor.functionBody(sourceFile, fnName);

  if (functionBody === null) {
    return false;
  }

  const functionBodyJs = ts.transpileModule(functionBody.body, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const uploaded = await worker.upload(functionBody.async, fnName, parameters, functionBodyJs);

  if (!uploaded) {
    return false;
  }

  return true;
};

const setupUIInput = async (sourceFile: ts.SourceFile) => {
  const properties = TypescriptExtractor.interfaceProperties(sourceFile, 'UIInput');

  if (!(await uploadCode('onUISetup', ['api'], sourceFile))) {
    return null;
  }

  const uiInputTemplate = reinterpret_cast<OnlyUIInputProperties>(
    await worker.execute({
      name: 'onUISetup',
      args: [{ env: collectEnvironment(), caller: 'system' }],
    }),
  );

  await worker.unload('onUISetup');

  return [...Object.entries(uiInputTemplate)].reduce(
    (acc, [prop, config]) => ({ ...acc, [prop]: { ...config, type: properties.get(prop) } }),
    {},
  );
};

const setupButtonHandlers = async (sourceFile: ts.SourceFile) => {
  for (const btn of TypescriptExtractor.findButtonsInUIInput(sourceFile)) {
    await uploadCode(NamingConvention.onClick(btn.id), ['input', 'api'], sourceFile);
  }
};

const setup = async () => {
  const sourceFile = ts.createSourceFile('main.ts', sourceCode, ts.ScriptTarget.Latest, true);

  uiInput.value = await setupUIInput(sourceFile);

  if (!(await uploadCode('onUpdate', ['input', 'api'], sourceFile))) {
    emit('close');
    return;
  }

  sendChatMessageTransformerUnsub?.();

  if (await uploadCode('onBeforeMessageSend', ['input', 'api', 'message'], sourceFile)) {
    sendChatMessageTransformerUnsub = gqlInterceptor.transformRequest<SendChatMessageRequest>(
      { operationName: 'sendChatMessage' },
      async (x) => {
        const patched: SendChatMessageRequest = JSON.parse(JSON.stringify(x));

        try {
          const transformed = (await worker.execute(
            {
              name: 'onBeforeMessageSend',
              args: [
                toRaw(uiInput.value),
                { env: collectEnvironment(), caller: 'system' },
                patched.variables.input.message,
              ],
            },
            10000,
          )) as string;

          patched.variables.input.message = transformed;

          return patched;
        } catch (e) {
          isRunning = false;

          if (unmounted) {
            return x;
          }

          console.error(e);

          emit('close');

          return x;
        }
      },
    );
  }

  await setupButtonHandlers(sourceFile);
};

watch(
  () => sourceCode,
  async () => {
    await setup();

    if (!isRunning) {
      isRunning = true;

      onExecute(false);
    }
  },
  { immediate: true },
);

let onExecuteTimer = -1;

const onExecute = async (outOfOrder: boolean) => {
  if (outOfOrder) {
    clearTimeout(onExecuteTimer);
  }

  onExecuteTimer = -1;

  try {
    const inputBeforeExecution = JSON.parse(JSON.stringify(toRaw(uiInput.value)));
    const result = reinterpret_cast<UpdateResult>(
      await worker.execute({
        name: 'onUpdate',
        args: [
          toRaw(uiInput.value),
          { env: collectEnvironment(), caller: outOfOrder ? 'event' : 'system' },
        ],
      }),
    );

    if (
      JsonObjectComparator.equalShape(
        reinterpret_cast<JSONObject>(toRaw(uiInput.value)),
        result.input,
      )
    ) {
      if (
        !JsonObjectComparator.equal(inputBeforeExecution, JSON.parse(JSON.stringify(result.input)))
      ) {
        uiInput.value = reinterpret_cast<OnlyUIInputPropertiesWithType>(result.input);
      }
    } else {
      throw new Error('UIInput object is malformed');
    }

    if (result.model !== undefined) {
      model.value = result.model;
    }

    if (onExecuteTimer === -1) {
      onExecuteTimer = setTimeout(() => onExecute(false), updatePeriod);
    }
  } catch (e) {
    isRunning = false;

    if (unmounted) {
      return;
    }

    console.error(e);

    emit('close');
  }
};

const uiInputComponents = computed<IdentifiedUIComponent<UIInputComponentWithType>[]>(() =>
  [...Object.entries(uiInput.value ?? {})].map(([id, state]) => ({
    id,
    ...state,
  })),
);

const is = <T extends UIInputComponent>(x: object, type: string): x is T =>
  'type' in x && x.type === type;

const updateTextInput = async (textInput: UITextInput, value: string) => {
  textInput.text = value;

  await onExecute(true);
};

const updateDateTimePicker = async (picker: UIDateTimePicker, value: Date | null) => {
  picker.date = value;

  await onExecute(true);
};

const updateSlider = async (slider: UISliderInput, value: number) => {
  slider.value = value;

  await onExecute(true);
};

const executeButtonClick = async (id: string) => {
  await worker.execute({
    name: NamingConvention.onClick(id),
    args: [toRaw(uiInput.value), { env: collectEnvironment(), caller: 'event' }],
  });

  await onExecute(true);
};

const buttonStyle = ({ type: _, id: _0, caption: _1, ...style }: IdentifiedUIComponent<UIButton>) =>
  style;

onMounted(() => {
  actionListenerUnsub = worker.subscribeToUnrecognizedMessages<Action>(actionListener);
});

onUnmounted(() => {
  unmounted = true;

  actionListenerUnsub?.();
  sendChatMessageTransformerUnsub?.();

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
    @setFocus="emit('setFocus')"
    class="floating-widget"
  >
    <div class="ui-input">
      <template v-for="component in uiInputComponents" :key="component.id">
        <UiTextInput
          v-if="is<UITextInput>(component, 'UITextInput')"
          :label="component.label"
          :value="component.text"
          @update:value="(e) => updateTextInput(uiInput![component.id] as UITextInput, e)"
        />
        <DateTimePicker
          v-else-if="is<UIDateTimePicker>(component, 'UIDateTimePicker')"
          :value="component.date"
          @update:value="(e) => updateDateTimePicker(uiInput![component.id] as UIDateTimePicker, e)"
        />
        <SliderInput
          v-else-if="is<UISliderInput>(component, 'UISliderInput')"
          :label="component.label"
          :min="component.min"
          :max="component.max"
          :step="component.step"
          :value="component.value"
          @update:value="(e) => updateSlider(uiInput![component.id] as UISliderInput, e)"
        />
        <UiButton
          v-else-if="is<UIButton>(component, 'UIButton')"
          :caption="component.caption"
          @click="executeButtonClick(component.id)"
          :style="buttonStyle(component)"
        />
      </template>
    </div>
    <div class="data-view">
      <div v-if="model === null">No view</div>
      <TextView v-else-if="isTextView(model)" :value="model" />
      <TableView v-else-if="model.type === 'table'" :rows="model.rows" />
      <PieChart v-else-if="model.type === 'piechart'" :segments="model.segments" />
      <LineGraph
        v-else-if="model.type === 'linegraph'"
        :x-axis="model.xAxis"
        :series="model.series"
        :curve="model.curve"
      />
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
