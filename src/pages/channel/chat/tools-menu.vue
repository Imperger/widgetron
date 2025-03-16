<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue';

import ToolsIcon from '@/components/icons/tools-icon.vue';
import TwitchMenuItem from '@/components/twitch/twitch-menu/twitch-menu-item.vue';
import TwitchMenu from '@/components/twitch/twitch-menu/twitch-menu.vue';
import type { MountPointMaintainer, MountPointWatchReleaser } from '@/lib/mount-point-maintainer';

const mountPointMaintainer = inject<MountPointMaintainer>('bodyMountPointMaintainer')!;
const chatEnhancerWidget = ref<HTMLElement | null>(null);
let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

onMounted(() => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) => x.querySelector('.stream-chat-header'),
    (x) => (chatEnhancerWidget.value = x),
  );
});

onUnmounted(() => {
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="chatEnhancerWidget" :to="chatEnhancerWidget">
    <button class="open-menu-btn">
      <ToolsIcon /><TwitchMenu offset-x="-100px"
        ><TwitchMenuItem>Query Builder</TwitchMenuItem
        ><TwitchMenuItem>Message Interceptor</TwitchMenuItem></TwitchMenu
      >
    </button>
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
