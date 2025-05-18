<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { computed, inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';

import type { WidgetInfo } from '@/extension-db';
import {
  bodyMountPointMaintainerToken,
  dbToken,
  widgetSharedStateToken,
  windowManagerToken,
} from '@/injection-tokens';
import { cssVar } from '@/lib/css-var';
import type { MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { ExternalLibCache } from '@/lib/typescript/external-lib-cache';
import type { TypescriptEditorWindowInstance } from '@/ui/code-editor/typescript/typescript-editor-window-instance';
import { optionalFunctionValidator } from '@/ui/code-editor/typescript/validators/optional-function-validator';
import { requireFunctionValidator } from '@/ui/code-editor/typescript/validators/require-function-validator';
import { requireInterfaceValidator } from '@/ui/code-editor/typescript/validators/require-interface-validator';
import DeleteIcon from '@/ui/icons/delete-icon.vue';
import EditIcon from '@/ui/icons/edit-icon.vue';
import ToolsIcon from '@/ui/icons/tools-icon.vue';
import TwitchMenuItemDivider from '@/ui/twitch/twitch-menu/twitch-menu-item-divider.vue';
import TwitchMenuItem from '@/ui/twitch/twitch-menu/twitch-menu-item.vue';
import TwitchMenu from '@/ui/twitch/twitch-menu/twitch-menu.vue';
import type { WidgetInstance } from '@/widget/widget-instance';

interface EditorInstance {
  key: number;
  id?: number;
  label?: string;
  instance: monaco.editor.IStandaloneCodeEditor | null;
}

const db = inject(dbToken)!;
const mountPointMaintainer = inject(bodyMountPointMaintainerToken)!;
const windowManager = inject(windowManagerToken)!;

const chatEnhancerWidget = ref<HTMLElement | null>(null);

const widgetEditorInstance = shallowRef<EditorInstance | null>(null);
let widgetPreviewKey = -1;

const widgetList = ref<WidgetInfo[]>([]);

const sharedState = inject(widgetSharedStateToken)!;

let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

const placeholder = `
interface UIInput extends OnlyUIInputProperties {

}

interface SessionState {

}

async function onUISetup(api: API): Promise<UIInput> {
    return { };
}

async function onUpdate(input: UIInput, api: API): Promise<WidgetModel> {
    return null;
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

  widgetEditorInstance.value = {
    key: -1,
    ...(id !== undefined && { id }),
    instance: null,
    ...(editedWidget?.label && { label: editedWidget.label }),
  };

  widgetEditorInstance.value.key = windowManager.value.spawn({
    type: 'typescript_editor_window',
    ...(editedWidget?.label && { label: editedWidget.label }),
    extraLibs: [
      {
        content: await ExternalLibCache.dexie(),
        filePath: `dexie.d.ts`,
      },
      {
        content: await ExternalLibCache.widgetTypes(),
        filePath: `widget-types.d.ts`,
      },
    ],
    placeholder: editedWidget?.content ?? placeholder,
    validators: [
      requireInterfaceValidator('SessionState'),
      requireFunctionValidator('onUISetup', ['API'], 'Promise<UIInput>'),
      requireFunctionValidator('onUpdate', ['UIInput', 'API'], 'Promise<WidgetModel>'),
      optionalFunctionValidator(
        'onBeforeMessageSend',
        ['UIInput', 'API', 'string'],
        'Promise<string>',
      ),
    ],
    onInitialized,
    onSave,
    onExecute,
    onClose: closeWidgetEditor,
  });
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  widgetEditorInstance.value!.instance = instance;
};

const closeWidgetEditor = () => {
  windowManager.value.close(widgetEditorInstance.value!.key);
  widgetEditorInstance.value = null;

  windowManager.value.close(widgetPreviewKey);
  widgetPreviewKey = -1;
};

const closeWidgetPreview = () => {
  widgetPreviewKey = -1;
};

const onExecute = async () => {
  if (widgetPreviewKey === -1) {
    widgetPreviewKey = windowManager.value.spawn({
      type: 'widget_instance',
      updatePeriod: 1000,
      sourceCode: widgetEditorInstance.value!.instance!.getValue(),
      onClose: closeWidgetPreview,
    });
  } else {
    const preview = windowManager.value.find<WidgetInstance>(widgetPreviewKey);

    if (preview === null) {
      return;
    }

    preview.sourceCode = widgetEditorInstance.value!.instance!.getValue();
  }
};

const onSave = async (label: string) => {
  widgetEditorInstance.value!.label = label;

  if (widgetEditorInstance.value) {
    const window = windowManager.value.find<TypescriptEditorWindowInstance>(
      widgetEditorInstance.value.key,
    );
    if (window !== null) {
      window.label = label;
    }
  }

  const id = await db.saveWidget(
    label,
    widgetEditorInstance.value!.instance!.getValue(),
    widgetEditorInstance.value!.id,
  );

  if (widgetEditorInstance.value?.id === undefined) {
    widgetList.value.push({ id, label });

    widgetEditorInstance.value!.id = id;
  } else {
    const editedWidget = widgetList.value.find((x) => x.id === id);

    if (editedWidget) {
      editedWidget.label = label;
    }
  }
};

const spawnWidget = async (id: number) => {
  const widget = await db.findWidget(id);

  if (widget !== null) {
    windowManager.value.spawn({
      type: 'widget_instance',
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

const isWidgetEditorOpened = computed(() => widgetEditorInstance.value !== null);

onUnmounted(() => {
  mountPointWatchReleaser?.();

  sharedState.channel = null;
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
            <button
              @click.stop="spawnWidgetEditor(widget.id)"
              :disabled="isWidgetEditorOpened"
              class="widget-menu-btn"
            >
              <EditIcon :color="cssVar('color-border-toggle-checked') ?? undefined" /></button
            ><button
              @click.stop="deleteWidget(widget.id)"
              :disabled="widgetEditorInstance?.id === widget.id"
              class="widget-menu-btn"
            >
              <DeleteIcon :color="cssVar('color-border-toggle-checked') ?? undefined" />
            </button></div></TwitchMenuItem
      ></TwitchMenu>
    </button>
  </Teleport>
</template>

<style scoped>
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
  max-width: 110px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-right: 10px;
}

.widget-menu-item-action {
  display: flex;
  flex-direction: row;
}

.widget-menu-btn {
  display: flex;
}

.widget-menu-btn:disabled {
  filter: grayscale(100%);
}
</style>
