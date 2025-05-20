<script setup lang="ts">
import * as monaco from 'monaco-editor';
import 'monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.ttf';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker&inline';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker&inline';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline';
import { inject, onMounted, onUnmounted, ref } from 'vue';

import { localStorageInterceptorToken } from '@/injection-tokens';
import type { LocalStorageInterceptorListenerUnsubscriber } from '@/twitch/local-storage-interceptor';

self.MonacoEnvironment = {
  getWorker: function (_moduleId: unknown, label: string) {
    switch (label) {
      case 'css':
      case 'scss':
      case 'less':
        return new CssWorker();
      case 'typescript':
      case 'javascript':
        return new TsWorker();
      default:
        return new EditorWorker();
    }
  },
};

export interface CodeEditorProps {
  language: 'typescript' | 'css';
  placeholder?: string;
}

export interface CodeEditorEvents {
  (e: 'initialized', instance: monaco.editor.IStandaloneCodeEditor): void;
}

const localStorageInterceptor = inject(localStorageInterceptorToken);

const { placeholder = '', language } = defineProps<CodeEditorProps>();
const emit = defineEmits<CodeEditorEvents>();

const mountEl = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let resizeObserver: ResizeObserver | null = null;

let localStorageWriteUnsub: LocalStorageInterceptorListenerUnsubscriber | null = null;

const twitchThemeKey = 'twilight.theme';

const onResize = (_entries: ResizeObserverEntry[], _observer: ResizeObserver) => {
  editor?.layout({ width: 0, height: 0 });

  window.requestAnimationFrame(() => {
    const rect = mountEl.value!.getBoundingClientRect();

    editor?.layout({ width: rect.width, height: rect.height });
  });
};

const onLocalStorageWrite = (key: string, value: string) => {
  if (key === twitchThemeKey) {
    monaco.editor.setTheme(value === '0' ? 'vs' : 'vs-dark');
  }

  return false;
};

onMounted(() => {
  if (mountEl.value !== null) {
    editor = monaco.editor.create(mountEl.value, {
      value: placeholder,
      language,
    });

    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mountEl.value);

    localStorageWriteUnsub = localStorageInterceptor!.subscribe('set', onLocalStorageWrite);

    monaco.editor.setTheme(localStorage.getItem(twitchThemeKey) === '0' ? 'vs' : 'vs-dark');

    emit('initialized', editor);
  }
});

onUnmounted(() => {
  localStorageWriteUnsub?.();

  resizeObserver?.disconnect();

  editor?.dispose();
});
</script>

<template>
  <div ref="mountEl" class="editor"></div>
</template>

<style scoped>
.editor {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
}
</style>
