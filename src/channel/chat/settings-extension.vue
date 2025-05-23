<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { inject, onMounted, onUnmounted, ref } from 'vue';

import {
  bodyMountPointMaintainerToken,
  chatInterceptorToken,
  windowManagerToken,
} from '@/injection-tokens';
import { CssInjector } from '@/lib/css-injector';
import type { MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { useSettingsStore } from '@/stores/settings-store';
import type { ClearChatCommand, ClearMsgCommand } from '@/twitch/chat-interceptor';
import { parsingErorValidator as parsingEror } from '@/ui/code-editor/css/validators/parsing-error-validator';
import { requireClassValidator as requireClass } from '@/ui/code-editor/css/validators/require-class-validator';
import GearIcon from '@/ui/icons/gear-icon.vue';
import TwitchToggle from '@/ui/twitch/twitch-toggle.vue';

const chatInterceptor = inject(chatInterceptorToken)!;
const mountPointMaintainer = inject(bodyMountPointMaintainerToken)!;
const windowManager = inject(windowManagerToken)!;

const settingsStore = useSettingsStore();
const dontHideDeletedMessagedMountPoint = ref<HTMLElement | null>(null);
let mountPointWatchReleaser: MountPointWatchReleaser | null = null;
const css = new CssInjector('deleted-messages-stylesheet');
let cssPatcherEditor: monaco.editor.IStandaloneCodeEditor | null = null;

let cssPatherKey = -1;

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

const openCssPatcher = () => {
  cssPatherKey = windowManager.value.spawn({
    type: 'css_editor_window',
    title: 'Deleted message style',
    validators: [
      parsingEror(),
      requireClass('deleted-message-text', 'deleted-message-displayname'),
    ],
    onInitialized,
    onSave,
    onClose: closeCssPatcher,
  });
};

const closeCssPatcher = () => {
  if (cssPatherKey !== -1) {
    windowManager.value.close(cssPatherKey);

    cssPatherKey = -1;
  }
};

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
</template>

<style scoped>
.deleted-message-visibility-option {
  display: flex;
  justify-content: space-between;
  padding: 5px;
}
</style>
