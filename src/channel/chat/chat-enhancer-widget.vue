<script setup lang="ts">
import { inject, onUnmounted } from 'vue';

import SettingsExtension from './settings-extension.vue';
import ToolsMenu from './tools-menu.vue';

import { chatInterceptorToken, dbToken } from '@/injection-tokens';
import { type ChatMessage } from '@/lib/interceptors/network-interceptor/chat-interceptor';

const db = inject(dbToken)!;
const chatInterceptor = inject(chatInterceptorToken)!;

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
