<script setup lang="ts">
import * as monaco from 'monaco-editor';
import ts from 'typescript';
import { inject, markRaw, onMounted, onUnmounted, ref } from 'vue';

import QueryBuilderWorker from '@/background-workers/query-builder-worker?worker&inline';
import { SafeTaskRunner } from '@/background-workers/safe-task-runner';
import TypescriptEditorWindow from '@/components/code-editor/typescript/typescript-editor-window.vue';
import type { ExtraLib } from '@/components/code-editor/typescript/typescript-editor.vue';
import { requireFunctionValidator } from '@/components/code-editor/typescript/validators/require-function-validator';
import ToolsIcon from '@/components/icons/tools-icon.vue';
import TwitchMenuItem from '@/components/twitch/twitch-menu/twitch-menu-item.vue';
import TwitchMenu from '@/components/twitch/twitch-menu/twitch-menu.vue';
import type { MountPointMaintainer, MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { ExternalLibCache } from '@/lib/typescript/external-lib-cache';

interface EditorInstance {
  id: number;
  instance: monaco.editor.IStandaloneCodeEditor | null;
  extraLibs?: ExtraLib[];
}

const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const chatEnhancerWidget = ref<HTMLElement | null>(null);

let nextEditorId = 0;
const queryEditors = ref<EditorInstance[]>([]);

let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

onMounted(() => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );
});
const spawnQueryEditor = async () => {
  queryEditors.value.push({
    id: nextEditorId++,
    instance: null,
    extraLibs: [
      {
        content: await ExternalLibCache.dexie(),
        filePath: `dexie.d.ts`,
      },
    ],
  });
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor, id: number) => {
  queryEditors.value.find((x) => x.id === id)!.instance = markRaw(instance);
};

const closeQueryEditor = (id: number) => {
  const idx = queryEditors.value.findIndex((x) => x.id === id);

  if (idx !== -1) {
    queryEditors.value.splice(idx, 1);
  }
};

const onExecute = async (editor: monaco.editor.IStandaloneCodeEditor) => {
  const worker = new SafeTaskRunner(QueryBuilderWorker);

  const sourceCode = ts.transpileModule(editor.getValue(), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const uploaded = await worker.upload(sourceCode);

  console.log(`Uploaded ${uploaded}`);

  const result = await worker.execute();

  console.log(`Executed result = ${result}`);
};

onUnmounted(() => {
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn">
      <ToolsIcon /><TwitchMenu offset-x="-100px"
        ><TwitchMenuItem @click="spawnQueryEditor">Query Builder</TwitchMenuItem
        ><TwitchMenuItem>Message Interceptor</TwitchMenuItem></TwitchMenu
      >
    </button>
  </Teleport>
  <TypescriptEditorWindow
    v-for="editor of queryEditors"
    :key="editor.id"
    :extraLibs="editor.extraLibs"
    :validators="[requireFunctionValidator('onUpdate', ['AppDB'], 'void')]"
    @initialized="(x) => onInitialized(x, editor.id)"
    @save="() => onExecute(editor.instance!)"
    @close="() => closeQueryEditor(editor.id)"
  />
</template>

<style scope>
.open-menu-btn {
  position: absolute;
  right: calc(25px + var(--button-size-default));
  padding: 5px;
}

.open-menu-btn:hover {
  background-color: var(--color-background-button-text-hover);
}
</style>
