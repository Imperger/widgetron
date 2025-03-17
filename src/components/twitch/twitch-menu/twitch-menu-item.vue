<script setup lang="ts">
import { inject } from 'vue';

import type { MenuRoot } from './twitch-menu.vue';

export interface TwitchMenuItemProps {
  closeOnClick?: boolean;
}

export interface TwitchMenuItemEvents {
  (e: 'click'): void;
}

const { closeOnClick = true } = defineProps<TwitchMenuItemProps>();

const emit = defineEmits<TwitchMenuItemEvents>();

const menuRoot: MenuRoot = inject('menuRoot')!;

const onClick = () => {
  if (closeOnClick) {
    menuRoot.isShown.value = false;
  }

  emit('click');
};
</script>
<template>
  <div @click="onClick" class="menu-item"><slot></slot></div>
</template>

<style scope>
.menu-item {
  color: var(--color-text-base);
  padding: 0.5rem;
  text-wrap: nowrap;
  cursor: pointer;
}
</style>
