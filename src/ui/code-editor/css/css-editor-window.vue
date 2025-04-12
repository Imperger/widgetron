<script setup lang="ts">
import type { CssStylesheetAST } from '@adobe/css-tools';
import * as monaco from 'monaco-editor';
import { computed, ref } from 'vue';

import CssEditor, { type ValidationResultResolver } from './css-editor.vue';
import { mergeValidators, type Validator } from './validators/merge-validators';

import ErrorLog from '@/ui/code-editor/error-log.vue';
import FloatingWindow from '@/ui/floating-window.vue';
import TickIcon from '@/ui/icons/tick-icon.vue';

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

const isApplied = ref(false);

const isAppliedDuration = 800;
let isAppliedFadeTimer = -1;

const saveEnabled = computed(() => errors.value.length === 0);

const onSave = () => {
  isApplied.value = true;

  clearTimeout(isAppliedFadeTimer);
  isAppliedFadeTimer = setTimeout(() => (isApplied.value = false), isAppliedDuration);

  emit('save');
};

const saveIconColor = computed(() => (saveEnabled.value ? '#ffffff' : '#e877e8'));

const validator = (tree: CssStylesheetAST, resolve: ValidationResultResolver) =>
  mergeValidators(errors, ...validators)(tree, resolve);
</script>

<template>
  <FloatingWindow
    :title="title"
    :resizable="true"
    :save-enabled="saveEnabled"
    v-model:left="left"
    v-model:top="top"
    @close="() => emit('close')"
    style="background-color: white"
  >
    <template v-slot:title-bar>
      <button :disabled="!saveEnabled" @click="onSave" class="title-bar-btn">
        <TickIcon :color="saveIconColor" />
      </button>
    </template>
    <CssEditor
      :placeholder="placeholder"
      @initialized="(x) => emit('initialized', x)"
      @validation="validator"
    />
    <ErrorLog :logs="errors" />
    <div v-if="isApplied" class="floating-window-applied-popup"><p>Applied</p></div>
  </FloatingWindow>
</template>

<style scoped>
.title-bar-btn {
  display: flex;
  justify-content: center;
  align-items: center;
}
.floating-window-applied-popup {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 35px;
  background-color: #43a047;
  border-radius: 40px;
  opacity: 1;
  animation: fadeOut 800ms ease-in forwards;
}

.floating-window-applied-popup p {
  font-weight: bold;
  font-size: 3em;
}
</style>
