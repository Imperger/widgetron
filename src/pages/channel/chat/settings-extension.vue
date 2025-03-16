<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { inject, onMounted, onUnmounted, ref } from 'vue';

import CssEditorWindow from '@/components/code-editor/css-editor-window.vue';
import { parsingErorValidator as parsingEror } from '@/components/code-editor/validators/parsing-error-validator';
import { requireClassValidator as requireClass } from '@/components/code-editor/validators/require-class-validator';
import GearIcon from '@/components/icons/gear-icon.vue';
import TwitchToggle from '@/components/twitch/twitch-toggle.vue';
import { CssInjector } from '@/lib/css-injector';
import type {
  ChatInterceptor,
  ClearChatCommand,
  ClearMsgCommand,
} from '@/lib/interceptors/network-interceptor/chat-interceptor';
import type { MountPointMaintainer, MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { useSettingsStore } from '@/stores/settings-store';

const chatInterceptor: ChatInterceptor = inject('chatInterceptor')!;
const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const settingsStore = useSettingsStore();
const dontHideDeletedMessagedMountPoint = ref<HTMLElement | null>(null);
let mountPointWatchReleaser: MountPointWatchReleaser | null = null;
const css = new CssInjector('deleted-messages-stylesheet');
let cssPatcherEditor: monaco.editor.IStandaloneCodeEditor | null = null;
const isCssPatcherShown = ref(false);

onMounted(() => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) => {
      const el: HTMLElement | null = x.querySelector('.chat-settings__content > div');
      const backBtn = document.querySelector('.chat-settings__back-icon-container');
      return backBtn?.childElementCount === 0 ? el : null;
    },
    (x) => (dontHideDeletedMessagedMountPoint.value = x),
    () => (dontHideDeletedMessagedMountPoint.value = null),
  );

  if (settingsStore.get.dontHideDeletedMessages) {
    highlightDeletedMessages();
  }

  css.update(settingsStore.get.deletedMessageStyle);
});

let clearChatUnsub!: () => void;
let clearMsgUnsub!: () => void;

const highlightDeletedMessages = () => {
  clearChatUnsub = chatInterceptor.subscribe<ClearChatCommand>('CLEARCHAT', (x) => {
    const messagesContainer = document.querySelector('.chat-scrollable-area__message-container');

    if (messagesContainer === null) {
      return true;
    }

    for (const messageContainer of messagesContainer.children) {
      const displayNameEl = messageContainer.querySelector('.chat-author__display-name');
      const displayName = displayNameEl?.textContent ?? '';
      const textEl = messageContainer.querySelector('span[data-a-target="chat-message-text"]');

      if (textEl === null || displayNameEl === null) {
        continue;
      }

      if (x.targetUserDisplayName === '' || x.targetUserDisplayName === displayName) {
        displayNameEl.classList.add('deleted-message-displayname');
        textEl.classList.add('deleted-message-text');
      }
    }

    return true;
  });

  clearMsgUnsub = chatInterceptor.subscribe<ClearMsgCommand>('CLEARMSG', (x) => {
    const messagesContainer = document.querySelector('.chat-scrollable-area__message-container');

    if (messagesContainer === null) {
      return true;
    }

    for (const messageContainer of messagesContainer.children) {
      const displayNameEl = messageContainer.querySelector('.chat-author__display-name');
      const displayName = displayNameEl?.textContent ?? '';
      const textEl = messageContainer.querySelector('span[data-a-target="chat-message-text"]');

      if (textEl === null || displayNameEl === null) {
        continue;
      }

      if (displayName === x.targetUserDisplayName && textEl.textContent === x.messageText) {
        displayNameEl.classList.add('deleted-message-displayname');
        textEl.classList.add('deleted-message-text');
      }
    }

    return true;
  });
};

const onDontHideDeletedMessages = (enabled: boolean) => {
  if (enabled) {
    highlightDeletedMessages();
  } else {
    clearChatUnsub?.();
  }

  settingsStore.get.dontHideDeletedMessages = enabled;
};

const onInitialized = (instance: monaco.editor.IStandaloneCodeEditor) => {
  cssPatcherEditor = instance;
  cssPatcherEditor.setValue(settingsStore.get.deletedMessageStyle);
};

const onSave = () => {
  const stylesheetContent = cssPatcherEditor!.getValue();

  css.update(stylesheetContent);
  settingsStore.get.deletedMessageStyle = stylesheetContent;
};

const openCssPatcher = () => (isCssPatcherShown.value = true);
const closeCssPatcher = () => (isCssPatcherShown.value = false);

onUnmounted(() => {
  clearChatUnsub?.();
  clearMsgUnsub?.();
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="dontHideDeletedMessagedMountPoint" :to="dontHideDeletedMessagedMountPoint">
    <div class="deleted-message-visibility-option">
      <label>Don't Hide Deleted Messages</label>
      <button @click="openCssPatcher"><GearIcon /></button>
      <TwitchToggle
        :modelValue="settingsStore.get.dontHideDeletedMessages"
        @update:modelValue="onDontHideDeletedMessages"
      />
    </div>
  </Teleport>
  <CssEditorWindow
    v-if="isCssPatcherShown"
    title="Deleted message style"
    :validators="[
      parsingEror(),
      requireClass('deleted-message-text', 'deleted-message-displayname'),
    ]"
    @initialized="onInitialized"
    @save="onSave"
    @close="closeCssPatcher"
  />
</template>

<style scope>
.deleted-message-visibility-option {
  display: flex;
  justify-content: space-between;
  padding: 5px;
}
</style>
