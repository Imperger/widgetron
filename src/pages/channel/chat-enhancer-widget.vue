<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue';

import ToolsIcon from '@/components/icons/tools-icon.vue';
import TwitchToggle from '@/components/twitch/twitch-toggle.vue';
import {
  type ClearChatCommand,
  type ChatInterceptor,
} from '@/lib/interceptors/network-interceptor/chat-interceptor';
import { MountPointMaintainer } from '@/lib/mount-point-maintainer';
import { useSettingsStore } from '@/stores/settings-store';

const settingsStore = useSettingsStore();
const chatEnhancerWidget = ref<HTMLElement | null>(null);
const dontHideDeletedMessagedMountPoint = ref<HTMLElement | null>(null);
let mountPointSelector: MountPointMaintainer;
const chatInterceptor: ChatInterceptor = inject('chatInterceptor')!;

const chatMessagesUnsub = chatInterceptor.subscribe('PRIVMSG', (x) => {
  console.log(x);

  return false;
});

onMounted(() => {
  mountPointSelector = new MountPointMaintainer(document.body);

  mountPointSelector.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );

  mountPointSelector.watch(
    (x) => {
      const el: HTMLElement | null = x.querySelector('.chat-settings__content > div');

      return el?.children.item(0)?.textContent === 'My Preferences' ? el : null;
    },
    (x) => (dontHideDeletedMessagedMountPoint.value = x),
    () => (dontHideDeletedMessagedMountPoint.value = null),
  );

  if (settingsStore.get.dontHideDeletedMessages) {
    highlightDeletedMessages();
  }
});

let clearChatUnsub!: () => void;

const highlightDeletedMessages = () => {
  clearChatUnsub = chatInterceptor.subscribe<ClearChatCommand>('CLEARCHAT', (x) => {
    const messagesContainer = document.querySelector('.chat-scrollable-area__message-container');

    if (messagesContainer === null) {
      return true;
    }

    for (const messageContainer of messagesContainer.children) {
      const displayName =
        messageContainer.querySelector('.chat-author__display-name')?.textContent ?? '';
      const textContainer = messageContainer.querySelector(
        'span[data-a-target="chat-message-text"]',
      );

      if (textContainer === null) {
        continue;
      }

      if (x.targetUserDisplayName === '' || x.targetUserDisplayName === displayName) {
        textContainer.classList.add('deleted-message');
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

onUnmounted(() => {
  mountPointSelector.disconnect();
  chatMessagesUnsub();
  clearChatUnsub?.();
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn"><ToolsIcon /></button>
  </Teleport>
  <Teleport v-if="dontHideDeletedMessagedMountPoint" :to="dontHideDeletedMessagedMountPoint">
    <div class="deleted-message-visibility-option">
      <label>Don't Hide Deleted Messages</label>
      <TwitchToggle
        :modelValue="settingsStore.get.dontHideDeletedMessages"
        @update:modelValue="onDontHideDeletedMessages"
      />
    </div>
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

.deleted-message-visibility-option {
  display: flex;
  justify-content: space-between;
  padding: 5px;
}
</style>

<style>
.deleted-message {
  color: #ff7800;
}
</style>
