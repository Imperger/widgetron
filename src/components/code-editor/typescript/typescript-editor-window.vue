<script setup lang="ts">
import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';
import { computed, ref } from 'vue';

import CssEditor, { type ValidationResultResolver } from './typescript-editor.vue';
import { mergeValidators, type Validator } from './validators/merge-validators';

import ErrorLog from '@/components/code-editor/error-log.vue';
import FloatingWindow from '@/components/floating-window.vue';

export interface CssEditorWindowProps {
  title?: string;
  placeholder?: string;
  validators?: Validator[];
}

export interface CssEditorWindowEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
  (e: 'close'): void;
  (e: 'save'): void;
}

const left = defineModel('left', { required: false, default: 100 });
const top = defineModel('top', { required: false, default: 100 });

const { placeholder = '', validators = [] } = defineProps<CssEditorWindowProps>();

const emit = defineEmits<CssEditorWindowEvents>();

const errors = ref<string[]>([]);

const saveEnabled = computed(() => errors.value.length === 0);

const validator = (tree: typescript.SourceFile, resolve: ValidationResultResolver) =>
  mergeValidators(errors, ...validators)(tree, resolve);
</script>

<template>
  <FloatingWindow
    :title="title"
    :resizable="true"
    :save-enabled="saveEnabled"
    v-model:left="left"
    v-model:top="top"
    @save="() => emit('save')"
    @close="() => emit('close')"
    style="background-color: white"
  >
    <CssEditor
      :placeholder="placeholder"
      @initialized="(x) => emit('initialized', x)"
      @validation="validator"
    />
    <ErrorLog :logs="errors" />
  </FloatingWindow>
</template>

<style scoped></style>
