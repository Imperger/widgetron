<script setup lang="ts">
import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';

import CodeEditor from '../code-editor.vue';

export interface ExtraLib {
  content: string;
  filePath: string;
}

export interface TypescriptEditorProps {
  placeholder?: string;
}

export interface TypescriptEditorEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
  (
    e: 'validation',
    tree: typescript.SourceFile,
    resolver: (response: monaco.editor.IMarkerData[]) => void,
  ): void;
}

export type ValidationResultResolver = (result: monaco.editor.IMarkerData[]) => void;

const { placeholder } = defineProps<TypescriptEditorProps>();

const emit = defineEmits<TypescriptEditorEvents>();

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const validate = async () => {
  const validationTag = 'user_validation_response';

  const parsed = typescript.createSourceFile(
    'main.ts',
    editor!.getValue(),
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TS,
  );

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
  <CodeEditor language="typescript" :placeholder="placeholder" @initialized="onInitialized" />
</template>

<style scoped></style>
