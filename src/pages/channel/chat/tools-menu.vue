<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';

import ToolsIcon from '@/components/icons/tools-icon.vue';
import type { MountPointMaintainer } from '@/lib/mount-point-maintainer';

const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const chatEnhancerWidget = ref<HTMLElement | null>(null);

onMounted(() => {
  mountPointMaintainer.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn"><ToolsIcon /></button>
  </Teleport>
</template>

<style scope>
.open-menu-btn {
  position: absolute;
  right: calc(25px + var(--button-size-default));
  padding: 5px;
}

.open-menu-btn:hover {
  background-color: var(--color-background-button-text-hover);
}
</style>
