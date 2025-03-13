<script setup lang="ts">
import { inject, onUnmounted } from 'vue';

import SettingsExtension from './settings-extension.vue';
import ToolsMenu from './tools-menu.vue';

import { type ChatInterceptor } from '@/lib/interceptors/network-interceptor/chat-interceptor';

const chatInterceptor: ChatInterceptor = inject('chatInterceptor')!;

const chatMessagesUnsub = chatInterceptor.subscribe('PRIVMSG', (x) => {
  console.log(x);

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
