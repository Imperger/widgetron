<script setup lang="ts">
import { inject, onUnmounted } from 'vue';

import SettingsExtension from './settings-extension.vue';
import ToolsMenu from './tools-menu.vue';

import type { ExtensionDB } from '@/extension-db';
import {
  type ChatInterceptor,
  type ChatMessage,
} from '@/lib/interceptors/network-interceptor/chat-interceptor';

const db: ExtensionDB = inject('db')!;
const chatInterceptor: ChatInterceptor = inject('chatInterceptor')!;

const chatMessagesUnsub = chatInterceptor.subscribe<ChatMessage>('PRIVMSG', (x) => {
  console.log(x);

  db.addMessage(x);

  return false;
});

onUnmounted(() => {
  chatMessagesUnsub();
});
</script>

<template>
  <ToolsMenu />
  <SettingsExtension />
</template>

<style scoped></style>
