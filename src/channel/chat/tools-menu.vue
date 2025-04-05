<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { inject, markRaw, onMounted, onUnmounted, ref, type Ref } from 'vue';

import TypescriptEditorWindow from '@/components/code-editor/typescript/typescript-editor-window.vue';
import type { ExtraLib } from '@/components/code-editor/typescript/typescript-editor.vue';
import { requireFunctionValidator } from '@/components/code-editor/typescript/validators/require-function-validator';
import DeleteIcon from '@/components/icons/delete-icon.vue';
import ToolsIcon from '@/components/icons/tools-icon.vue';
import TwitchMenuItem from '@/components/twitch/twitch-menu/twitch-menu-item.vue';
import TwitchMenu from '@/components/twitch/twitch-menu/twitch-menu.vue';
import type { WidgetInfo, ExtensionDB } from '@/extension-db';
import { cssVar } from '@/lib/css-var';
import type { MountPointMaintainer, MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { ExternalLibCache } from '@/lib/typescript/external-lib-cache';
import FloatingWidget from '@/widget/floating-widget.vue';
import MyWidgetLabelDialog from '@/widget/my-widget-label-dialog.vue';
import type { WidgetInstance } from '@/widget/widget-instance';

interface EditorInstance {
  id: number;
  instance: monaco.editor.IStandaloneCodeEditor | null;
  extraLibs?: ExtraLib[];
}

interface WidgetPreview {
  id: number;
  updatePeriod: number;
  sourceCode: string;
}

const db: ExtensionDB = inject('db')!;
const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const chatEnhancerWidget = ref<HTMLElement | null>(null);

let nextEditorId = 0;
const queryEditors = ref<EditorInstance[]>([]);

const widgetPreviews = ref<WidgetPreview[]>([]);

const setWidgetLabelDialogShown = ref(false);

const widgetList = ref<WidgetInfo[]>([]);

const widgets: Ref<WidgetInstance[]> = inject('widgets')!;

const closeWidget = (id: number) => {
  const closeIdx = widgetPreviews.value.findIndex((x) => x.id === id);

  if (closeIdx !== -1) {
    widgetPreviews.value.splice(closeIdx, 1);
  }
};

let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

const placeholder = `
interface UIInput extends OnlyUIInputProperties {

}

async function onUISetup(): Promise<UIInput> {
    return { };
}

async function onQuery(db: AppDB, input: UIInput): Promise<WidgetModel> {
}`;

onMounted(async () => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );

  widgetList.value = await db.allWidgets();
});

const spawnWidgetEditor = async () => {
  queryEditors.value.push({
    id: nextEditorId++,
    instance: null,
    extraLibs: [
      {
        content: await ExternalLibCache.dexie(),
        filePath: `dexie.d.ts`,
      },
      {
        content: await ExternalLibCache.appDB(),
        filePath: `appDB.d.ts`,
      },
      {
        content: await ExternalLibCache.widgetModel(),
        filePath: `widget-model.d.ts`,
      },
      {
        content: await ExternalLibCache.widgetInput(),
        filePath: `widget-input.d.ts`,
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

const onExecute = async (editor: EditorInstance) => {
  const previewWidgetIdx = widgetPreviews.value.findIndex((x) => x.id === editor.id);

  if (previewWidgetIdx !== -1) {
    widgetPreviews.value.splice(previewWidgetIdx, 1);
  }

  widgetPreviews.value.push({
    id: editor.id,
    updatePeriod: 1000,
    sourceCode: editor.instance!.getValue(),
  });
};

let savingEditor: EditorInstance | null = null;

const onSave = (editor: EditorInstance) => {
  setWidgetLabelDialogShown.value = true;
  savingEditor = editor;
};

const onSetWidgetLabelCancel = () => {
  setWidgetLabelDialogShown.value = false;
  savingEditor = null;
};

const onSetWidgetLabelOk = async (label: string) => {
  setWidgetLabelDialogShown.value = false;

  if (savingEditor === null) {
    return;
  }

  const id = await db.saveWidget(label, savingEditor.instance!.getValue());

  widgetList.value.push({ id, label });

  savingEditor = null;
};

let nextWidgetId = 0;

const spawnWidget = async (id: number) => {
  const widget = await db.findWidget(id);

  if (widget !== null) {
    widgets.value.push({
      key: nextWidgetId++,
      id: widget.id,
      label: widget.label,
      sourceCode: widget.content,
      updatePeriod: 1000,
    });
  }
};

const deleteWidget = async (id: number) => {
  await db.deleteWidget(id);

  const deleteIdx = widgetList.value.findIndex((x) => x.id === id);

  if (deleteIdx !== -1) {
    widgetList.value.splice(deleteIdx, 1);
  }
};

onUnmounted(() => {
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn">
      <ToolsIcon /><TwitchMenu offset-x="-100px"
        ><TwitchMenuItem @click="spawnWidgetEditor">New Widget</TwitchMenuItem
        ><TwitchMenuItem
          v-for="widget in widgetList"
          :key="widget.id"
          @click="spawnWidget(widget.id)"
          class="widget-menu-item"
          ><span class="widget-menu-label">{{ widget.label }}</span
          ><button @click.stop="deleteWidget(widget.id)">
            <DeleteIcon
              :color="cssVar('color-border-toggle-checked') ?? undefined"
            /></button></TwitchMenuItem
      ></TwitchMenu>
    </button>
  </Teleport>
  <TypescriptEditorWindow
    v-for="editor of queryEditors"
    :key="editor.id"
    :extraLibs="editor.extraLibs"
    :placeholder="placeholder"
    :validators="[
      requireFunctionValidator('onUISetup', [], 'Promise<UIInput>'),
      requireFunctionValidator('onQuery', ['AppDB', 'UIInput'], 'Promise<WidgetModel>'),
    ]"
    @initialized="(x) => onInitialized(x, editor.id)"
    @save="onSave(editor)"
    @preview="onExecute(editor)"
    @close="() => closeQueryEditor(editor.id)"
  />
  <FloatingWidget
    v-for="widget in widgetPreviews"
    :key="widget.id"
    :update-period="widget.updatePeriod"
    :source-code="widget.sourceCode"
    @close="closeWidget(widget.id)"
  />
  <MyWidgetLabelDialog
    v-model:show="setWidgetLabelDialogShown"
    @ok="onSetWidgetLabelOk"
    @cancel="onSetWidgetLabelCancel"
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

.widget-menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.widget-menu-label {
  margin-right: 5px;
}
</style>
