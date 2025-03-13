<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue';

import TwitchToggle from '@/components/twitch/twitch-toggle.vue';
import type {
  ChatInterceptor,
  ClearChatCommand,
} from '@/lib/interceptors/network-interceptor/chat-interceptor';
import type { MountPointMaintainer } from '@/lib/mount-point-maintainer';
import { useSettingsStore } from '@/stores/settings-store';

const chatInterceptor: ChatInterceptor = inject('chatInterceptor')!;
const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const settingsStore = useSettingsStore();
const dontHideDeletedMessagedMountPoint = ref<HTMLElement | null>(null);

onMounted(() => {
  mountPointMaintainer.watch(
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
  clearChatUnsub?.();
});
</script>

<template>
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

<style scope>
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
