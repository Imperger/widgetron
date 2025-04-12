<script setup lang="ts">
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { computed, inject, onMounted, onUnmounted, ref, watchEffect, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';

import { bodyMountPointMaintainerToken, gqlInterceptorToken } from '@/injection-tokens';
import { type MountPointWatchReleaser } from '@/lib/mount-point-maintainer';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { useFollowingStore } from '@/stores/following-store';
import type { ChatRestrictionsResponse } from '@/twitch/gql/types/chat-restrictions-response';
import type { GQLResponse } from '@/twitch/gql/types/gql-response';

dayjs.extend(relativeTime);

const route = useRoute();
const followedAtTimestamp = ref(0);
const followingStore = useFollowingStore();
const followedWidget = ref<HTMLElement | null>(null);
const gqlInterceptor = inject(gqlInterceptorToken)!;
const mountPointMaintainer = inject(bodyMountPointMaintainerToken)!;
let mountPointWatchReleaser: MountPointWatchReleaser | null = null;

const chatRestrictionsUnsub = gqlInterceptor.subscribe(
  { operationName: 'ChatRestrictions' },
  (x) => {
    const followingInfo =
      reinterpret_cast<GQLResponse<ChatRestrictionsResponse>>(x).data?.channel?.self?.follower;

    if (followingInfo) {
      const date = new Date(followingInfo.followedAt);
      followedAtTimestamp.value = date.getTime();

      followingStore.add(channel.value, date);
    } else {
      followingStore.purge(channel.value);
    }
  },
);

const channel = computed(() => route.params.channel) as ComputedRef<string>;

const followedAt = computed(() =>
  followedAtTimestamp.value !== -1
    ? dayjs(followedAtTimestamp.value).format('DD-MM-YYYY HH:mm')
    : '',
);

const followingFor = computed(() => dayjs(followedAtTimestamp.value).fromNow());

watchEffect(() => (followedAtTimestamp.value = followingStore.get(channel.value) ?? -1));

onMounted(() => {
  mountPointWatchReleaser = mountPointMaintainer.watch(
    (x) =>
      x.querySelector(`a[href="/${channel.value}"]:has(h1)`) ??
      x.querySelector(`a[href="/${channel.value}"]:has(div > h1)`),
    (x) => (followedWidget.value = x.parentElement),
  );
});

onUnmounted(() => {
  chatRestrictionsUnsub();
  mountPointWatchReleaser?.();
});
</script>

<template>
  <Teleport v-if="followedWidget" :to="followedWidget">
    <span class="following-widget">
      {{ followedAt }}
      <span class="tooltip">{{ followingFor }}</span></span
    >
  </Teleport>
</template>

<style scoped>
.following-widget {
  position: relative;
}

.following-widget .tooltip {
  position: absolute;
  visibility: hidden;
}

.following-widget:hover .tooltip {
  visibility: visible;
  top: -100%;
  left: 0;
  width: 100%;
}
</style>
