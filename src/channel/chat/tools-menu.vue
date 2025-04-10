<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { computed, inject, markRaw, onMounted, onUnmounted, ref } from 'vue';

import TypescriptEditorWindow from '@/components/code-editor/typescript/typescript-editor-window.vue';
import type { ExtraLib } from '@/components/code-editor/typescript/typescript-editor.vue';
import { requireFunctionValidator } from '@/components/code-editor/typescript/validators/require-function-validator';
import DeleteIcon from '@/components/icons/delete-icon.vue';
import EditIcon from '@/components/icons/edit-icon.vue';
import ToolsIcon from '@/components/icons/tools-icon.vue';
import TwitchMenuItemDivider from '@/components/twitch/twitch-menu/twitch-menu-item-divider.vue';
import TwitchMenuItem from '@/components/twitch/twitch-menu/twitch-menu-item.vue';
import TwitchMenu from '@/components/twitch/twitch-menu/twitch-menu.vue';
import type { WidgetInfo } from '@/extension-db';
import { bodyMountPointMaintainerToken, dbToken, widgetsToken } from '@/injection-tokens';
import { cssVar } from '@/lib/css-var';
import type { MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { ExternalLibCache } from '@/lib/typescript/external-lib-cache';
import FloatingWidget from '@/widget/floating-widget.vue';

interface EditorInstance {
  id?: number;
  label?: string;
  instance: monaco.editor.IStandaloneCodeEditor | null;
  placeholder: string;
  extraLibs?: ExtraLib[];
}

interface WidgetPreview {
  updatePeriod: number;
  sourceCode: string;
}

const db = inject(dbToken)!;
const mountPointMaintainer = inject(bodyMountPointMaintainerToken)!;
const widgets = inject(widgetsToken)!;

const chatEnhancerWidget = ref<HTMLElement | null>(null);

const widgetEditor = ref<EditorInstance | null>(null);
const widgetPreview = ref<WidgetPreview | null>(null);

const widgetList = ref<WidgetInfo[]>([]);

let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

const placeholder = `
interface UIInput extends OnlyUIInputProperties {

}

async function onUISetup(env: Environment): Promise<UIInput> {
    return { };
}

async function onUpdate(db: AppDB, input: UIInput): Promise<WidgetModel> {
}`;

onMounted(async () => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );

  widgetList.value = await db.allWidgets();
});

const spawnWidgetEditor = async (id?: number) => {
  const editedWidget = id !== undefined ? await db.findWidget(id) : null;

  if (id !== undefined && editedWidget === null) {
    console.error(`Failed to find widget with id='${id}'`);

    return;
  }

  widgetEditor.value = {
    ...(id !== undefined && { id }),
    instance: null,
    ...(editedWidget?.label && { label: editedWidget.label }),
    placeholder: editedWidget?.content ?? placeholder,
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
  };
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  widgetEditor.value!.instance = markRaw(instance);
};

const closeWidgetEditor = () => {
  widgetEditor.value = null;
  widgetPreview.value = null;
};

const closeWidgetPreview = () => {
  widgetPreview.value = null;
};

const onExecute = async () => {
  widgetPreview.value = {
    updatePeriod: 1000,
    sourceCode: widgetEditor.value!.instance!.getValue(),
  };
};

const onSave = async (label: string) => {
  const id = await db.saveWidget(
    label,
    widgetEditor.value!.instance!.getValue(),
    widgetEditor.value?.id,
  );

  if (widgetEditor.value?.id === undefined) {
    widgetList.value.push({ id, label });
  } else {
    const editedWidget = widgetList.value.find((x) => x.id === id);

    if (editedWidget) {
      editedWidget.label = label;
    }
  }
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

const isWidgetEditorOpened = computed(() => widgetEditor.value !== null);

onUnmounted(() => {
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn">
      <ToolsIcon /><TwitchMenu offset-x="-100px"
        ><TwitchMenuItem @click="spawnWidgetEditor" :disabled="isWidgetEditorOpened"
          >New Widget</TwitchMenuItem
        >
        <TwitchMenuItemDivider />
        <TwitchMenuItem
          v-for="widget in widgetList"
          :key="widget.id"
          @click="spawnWidget(widget.id)"
          class="widget-menu-item"
          ><span class="widget-menu-label">{{ widget.label }}</span>
          <div class="widget-menu-item-action">
            <button @click.stop="spawnWidgetEditor(widget.id)" class="widget-menu-btn">
              <EditIcon :color="cssVar('color-border-toggle-checked') ?? undefined" /></button
            ><button @click.stop="deleteWidget(widget.id)" class="widget-menu-btn">
              <DeleteIcon :color="cssVar('color-border-toggle-checked') ?? undefined" />
            </button></div></TwitchMenuItem
      ></TwitchMenu>
    </button>
  </Teleport>
  <TypescriptEditorWindow
    v-if="widgetEditor"
    :label="widgetEditor.label"
    :extraLibs="widgetEditor.extraLibs"
    :placeholder="widgetEditor.placeholder"
    :validators="[
      requireFunctionValidator('onUISetup', ['Environment'], 'Promise<UIInput>'),
      requireFunctionValidator('onUpdate', ['AppDB', 'UIInput'], 'Promise<WidgetModel>'),
    ]"
    @initialized="(x) => onInitialized(x)"
    @save="onSave"
    @preview="onExecute()"
    @close="() => closeWidgetEditor()"
  />
  <FloatingWidget
    v-if="widgetPreview"
    :update-period="widgetPreview.updatePeriod"
    :source-code="widgetPreview.sourceCode"
    @close="closeWidgetPreview()"
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
  margin-right: 10px;
}

.widget-menu-item-action {
  display: flex;
  flex-direction: row;
}

.widget-menu-btn {
  display: flex;
}
</style>
