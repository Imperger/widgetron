<script setup lang="ts">
import { inject } from 'vue';

import { menuRootToken } from './injection-tokens';

export interface TwitchMenuItemProps {
  closeOnClick?: boolean;
  disabled?: boolean;
}

export interface TwitchMenuItemEvents {
  (e: 'click'): void;
}

const { closeOnClick = true, disabled = false } = defineProps<TwitchMenuItemProps>();

const emit = defineEmits<TwitchMenuItemEvents>();

const menuRoot = inject(menuRootToken)!;

const onClickCaptured = () => {
  if (closeOnClick) {
    setTimeout(() => (menuRoot.isShown.value = false), 0);
  }
};
</script>
<template>
  <div
    @click.capture="onClickCaptured"
    @click="emit('click')"
    :class="{ 'menu-item-disabled': disabled }"
    class="menu-item"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
.menu-item {
  color: var(--color-text-base);
  padding: 0.5rem;
  text-wrap: nowrap;
  cursor: pointer;
}

.menu-item-disabled {
  color: var(--color-text-button-disabled);
  pointer-events: none;
}
</style>
