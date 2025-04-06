<script setup lang="ts">
import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import TypescriptEditor, {
  type ExtraLib,
  type ValidationResultResolver,
} from './typescript-editor.vue';
import { mergeValidators, type Validator } from './validators/merge-validators';

import ErrorLog from '@/components/code-editor/error-log.vue';
import FloatingWindow from '@/components/floating-window.vue';

export interface TypescriptEditorWindowProps {
  title?: string;
  placeholder?: string;
  extraLibs?: ExtraLib[];
  validators?: Validator[];
}

export interface TypescriptEditorWindowEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'preview'): void;
}

const left = defineModel('left', { required: false, default: 100 });
const top = defineModel('top', { required: false, default: 100 });

const {
  placeholder = '',
  extraLibs = [],
  validators = [],
} = defineProps<TypescriptEditorWindowProps>();

const emit = defineEmits<TypescriptEditorWindowEvents>();

let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let disposerList: monaco.IDisposable[] = [];

const validationErrors = ref<string[]>([]);
const errorMarkers = ref<string[]>([]);
const windowHasFocus = ref(false);
const editorHasFocus = ref(false);

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

const validator = (tree: typescript.SourceFile, resolve: ValidationResultResolver) =>
  mergeValidators(validationErrors, ...validators)(tree, resolve);

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  editor = instance;

  const onFocusDisposer = editor.onDidFocusEditorWidget(() => (editorHasFocus.value = true));
  const onBlurDisposer = editor.onDidBlurEditorWidget(() => (editorHasFocus.value = false));

  disposerList = [onFocusDisposer, onBlurDisposer];

  emit('initialized', instance);
};

const onClose = () => {
  editor?.getModel()?.dispose();

  emit('close');
};

const onFocus = () => (windowHasFocus.value = true);
const onBlur = () => (windowHasFocus.value = false);

const hasFocus = computed(() => windowHasFocus.value || editorHasFocus.value);

onUnmounted(() => disposerList.forEach((x) => x.dispose()));
</script>

<template>
  <FloatingWindow
    tabindex="0"
    :title="title"
    :resizable="true"
    :save-enabled="saveEnabled"
    :preview-enabled="saveEnabled"
    v-model:left="left"
    v-model:top="top"
    @save="() => emit('save')"
    @preview="() => emit('preview')"
    @close="onClose"
    @focus="onFocus"
    @blur="onBlur"
    :class="{ 'foreground-window': hasFocus }"
    style="background-color: white"
  >
    <TypescriptEditor
      :placeholder="placeholder"
      @initialized="onInitialized"
      @validation="validator"
    />
    <ErrorLog :logs="errorMarkers" class="error-log" />
  </FloatingWindow>
</template>

<style scoped>
.error-log {
  height: 84px;
  overflow: auto;
}

.foreground-window {
  z-index: 1001;
}
</style>
