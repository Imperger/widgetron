<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref, type Ref } from 'vue';

import { menuRootToken } from './injection-tokens';

import { onClickOutside, type OnListOutsideDeactivator } from '@/lib/on-click-outside';
import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface MenuRoot {
  isShown: Ref<boolean>;
}

export interface TwitchMenuProps {
  offsetX?: number | string;
}

const { offsetX = 0 } = defineProps<TwitchMenuProps>();

const componentRef = ref<HTMLElement | null>(null);
const isShown = ref(false);
let onClickOutsideDeactivator: OnListOutsideDeactivator | null = null;

provide(menuRootToken, { isShown });

onMounted(() => {
  componentRef.value?.parentElement?.addEventListener('click', onTriggerClick);
});

const setupOutsideClickListener = () => {
  return componentRef.value?.parentElement
    ? onClickOutside(componentRef.value.parentElement!, onClickOutsideListener)
    : null;
};

const onTriggerClick = (e: Event) => {
  if (componentRef.value?.contains(reinterpret_cast<HTMLElement>(e.target))) {
    return;
  }

  isShown.value = !isShown.value;

  if (isShown.value) {
    onClickOutsideDeactivator = setupOutsideClickListener();
  }
};

const onClickOutsideListener = (_e: Event) => {
  isShown.value = false;
};

onUnmounted(() => {
  componentRef.value?.parentElement?.removeEventListener('click', onTriggerClick);
  onClickOutsideDeactivator?.();
});
</script>

<template>
  <div ref="componentRef">
    <div v-if="isShown" :style="{ transform: `translateX(${offsetX})` }" class="menu">
      <slot></slot>
    </div>
  </div>
</template>

<style scope>
.menu {
  position: absolute;
  padding: 1rem;
  background-color: var(--color-background-base);
  box-shadow: var(--shadow-elevation-2);
}
</style>
