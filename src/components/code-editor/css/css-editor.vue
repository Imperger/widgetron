<script setup lang="ts">
import cssTool, { type CssStylesheetAST } from '@adobe/css-tools';
import * as monaco from 'monaco-editor';

import CodeEditor, { type CodeEditorProps } from '../code-editor.vue';

export type CssEditorProps = Pick<CodeEditorProps, 'placeholder'>;

export interface CssEditorEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
  (
    e: 'validation',
    tree: CssStylesheetAST,
    resolver: (response: monaco.editor.IMarkerData[]) => void,
  ): void;
}

export type ValidationResultResolver = (result: monaco.editor.IMarkerData[]) => void;

const { placeholder } = defineProps<CssEditorProps>();

const emit = defineEmits<CssEditorEvents>();

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const validate = async () => {
  const validationTag = 'user_validation_response';
  const parsed = cssTool.parse(editor!.getValue(), { silent: true });

  const validationResult = await new Promise<monaco.editor.IMarkerData[]>((resolve) =>
    emit('validation', parsed, resolve),
  );

  monaco.editor.removeAllMarkers(validationTag);
  monaco.editor.setModelMarkers(editor!.getModel()!, validationTag, validationResult);
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  editor = instance;

  editor.onDidChangeModelContent(validate);
  validate();

  emit('initialized', editor);
};
</script>

<template>
  <CodeEditor language="css" :placeholder="placeholder" @initialized="onInitialized" />
</template>

<style scoped></style>
