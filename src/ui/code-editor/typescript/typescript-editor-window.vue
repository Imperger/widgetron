<script setup lang="ts">
import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import TypescriptEditor, {
  type ExtraLib,
  type ValidationResultResolver,
} from './typescript-editor.vue';
import { mergeValidators, type Validator } from './validators/merge-validators';

import ErrorLog from '@/ui/code-editor/error-log.vue';
import FloatingWindow from '@/ui/floating-window.vue';
import PlayIcon from '@/ui/icons/play-icon.vue';
import TickIcon from '@/ui/icons/tick-icon.vue';
import MyWidgetLabelDialog from '@/widget/my-widget-label-dialog.vue';

export interface TypescriptEditorWindowProps {
  label?: string;
  placeholder?: string;
  extraLibs?: ExtraLib[];
  validators?: Validator[];
}

export interface TypescriptEditorWindowEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
  (e: 'close'): void;
  (e: 'save', label: string): void;
  (e: 'preview'): void;
  (e: 'setFocus'): void;
}

const left = defineModel('left', { required: false, default: 100 });
const top = defineModel('top', { required: false, default: 100 });

const {
  placeholder = '',
  label = '',
  extraLibs = [],
  validators = [],
} = defineProps<TypescriptEditorWindowProps>();

const emit = defineEmits<TypescriptEditorWindowEvents>();

let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let disposerList: monaco.IDisposable[] = [];

const validationErrors = ref<string[]>([]);
const errorMarkers = ref<string[]>([]);

const setWidgetLabelDialogShown = ref(false);

onMounted(() => {
  monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

  const onChangeMarkersDisposer = monaco.editor.onDidChangeMarkers((uris) => {
    if (uris.every((x) => x.toString() !== editor?.getModel()?.uri.toString())) {
      return;
    }

    const model = editor!.getModel();

    errorMarkers.value = monaco.editor
      .getModelMarkers({ resource: model?.uri })
      .filter((x) => x.severity === monaco.MarkerSeverity.Error)
      .map((x) => x.message);
  });

  disposerList.push(onChangeMarkersDisposer);
});

const saveEnabled = computed(
  () => validationErrors.value.length === 0 && errorMarkers.value.length === 0,
);

const saveIconColor = computed(() => (saveEnabled.value ? '#ffffff' : '#e877e8'));
const previewIconColor = computed(() => (saveEnabled.value ? '#ffffff' : '#e877e8'));

const validator = (tree: typescript.SourceFile, resolve: ValidationResultResolver) =>
  mergeValidators(validationErrors, ...validators)(tree, resolve);

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  editor = instance;

  const onFocusDisposer = editor.onDidFocusEditorWidget(() => emit('setFocus'));

  disposerList = [onFocusDisposer];

  emit('initialized', instance);
};

const onClose = () => {
  editor?.getModel()?.dispose();

  emit('close');
};

const onSave = () => {
  setWidgetLabelDialogShown.value = true;
};

const onSetWidgetLabelCancel = () => {
  setWidgetLabelDialogShown.value = false;
};

const onSetWidgetLabelOk = async (label: string) => {
  setWidgetLabelDialogShown.value = false;

  emit('save', label);
};

onUnmounted(() => disposerList.forEach((x) => x.dispose()));
</script>

<template>
  <FloatingWindow
    :title="label"
    :resizable="true"
    :save-enabled="saveEnabled"
    :preview-enabled="saveEnabled"
    v-model:left="left"
    v-model:top="top"
    @close="onClose"
    @setFocus="emit('setFocus')"
    style="background-color: white"
  >
    <template v-slot:title-bar>
      <button :disabled="!saveEnabled" @click="onSave" class="title-bar-btn">
        <TickIcon :color="saveIconColor" />
      </button>
      <button :disabled="!saveEnabled" @click="emit('preview')" class="title-bar-btn">
        <PlayIcon :color="previewIconColor" />
      </button>
    </template>
    <TypescriptEditor
      :placeholder="placeholder"
      @initialized="onInitialized"
      @validation="validator"
    />
    <ErrorLog :logs="errorMarkers" class="error-log" />
  </FloatingWindow>
  <MyWidgetLabelDialog
    v-model:show="setWidgetLabelDialogShown"
    :placeholder="label"
    @ok="onSetWidgetLabelOk"
    @cancel="onSetWidgetLabelCancel"
  />
</template>

<style scoped>
.title-bar-btn {
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-log {
  height: 84px;
  overflow: auto;
}
</style>
