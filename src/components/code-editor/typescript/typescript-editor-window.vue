<script setup lang="ts">
import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';
import { computed, onUnmounted, ref } from 'vue';

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
}

const left = defineModel('left', { required: false, default: 100 });
const top = defineModel('top', { required: false, default: 100 });

const {
  placeholder = '',
  extraLibs = [],
  validators = [],
} = defineProps<TypescriptEditorWindowProps>();

const emit = defineEmits<TypescriptEditorWindowEvents>();

let isMouseOver = false;
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let disposerList: monaco.IDisposable[] = [];
let uri = '';

const errors = ref<string[]>([]);
const windowHasFocus = ref(false);
const editorHasFocus = ref(false);

const saveEnabled = computed(() => errors.value.length === 0);

const validator = (tree: typescript.SourceFile, resolve: ValidationResultResolver) =>
  mergeValidators(errors, ...validators)(tree, resolve);

const switchModel = (language: string) => {
  const oldModel = editor!.getModel()!;

  editor!.setModel(
    monaco.editor.createModel(
      oldModel.getValue(),
      language,
      monaco.Uri.parse(`${uri}.${Date.now()}`),
    ),
  );

  oldModel!.dispose();
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  editor = instance;

  uri = editor!.getModel()!.uri.toString();

  const onFocusDisposer = editor.onDidFocusEditorWidget(() => (editorHasFocus.value = true));
  const onBlurDisposer = editor.onDidBlurEditorWidget(() => (editorHasFocus.value = false));

  disposerList = [onFocusDisposer, onBlurDisposer];

  emit('initialized', instance);
};

const onMouseOver = () => {
  if (isMouseOver) {
    return;
  }

  monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

  queueMicrotask(() => switchModel('typescript'));

  isMouseOver = true;
};

const onMouseLeave = () => {
  switchModel('ts2');

  isMouseOver = false;
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
    v-model:left="left"
    v-model:top="top"
    @save="() => emit('save')"
    @close="onClose"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave"
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
    <ErrorLog :logs="errors" />
  </FloatingWindow>
</template>

<style scoped>
.foreground-window {
  z-index: 1001;
}
</style>
