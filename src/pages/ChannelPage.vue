<script setup lang="ts">
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { computed, inject, onMounted, onUnmounted, ref, watchEffect, type ComputedRef } from 'vue';
import { useRoute } from 'vue-router';

import type { GQLInterceptor } from '@/lib/interceptors/network-interceptor/gql-interceptor';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import type { ChatRestrictions } from '@/lib/types/gql/response/chat-restrictions';
import { useFollowingStore } from '@/stores/following-store';

dayjs.extend(relativeTime);

const route = useRoute();
const followedAtTimestamp = ref(0);
const followingStore = useFollowingStore();
const followedWidget = ref<HTMLElement | null>(null);
let channelLinkWaiter: MutationObserver;
const gqlInterceptor: GQLInterceptor = inject('gqlInterceptor')!;

const chatRestrictionsUnsub = gqlInterceptor.subscribe(
  { operationName: 'ChatRestrictions' },
  (x) => {
    const followingInfo = reinterpret_cast<ChatRestrictions>(x).data?.channel?.self?.follower;

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
  const streamInfo = document.querySelector('.channel-info-content')!;

  channelLinkWaiter = new MutationObserver((mutations) => {
    const isNonWidgetRemoved = (x: MutationRecord) =>
      x.removedNodes.length > 0 && !x.target.contains(followedWidget.value);

    if (mutations.every(isNonWidgetRemoved) || mutations.every((x) => x.addedNodes.length === 0)) {
      return;
    }

    const channelLink =
      streamInfo.querySelector(`a[href="/${channel.value}"]:has(h1)`) ??
      streamInfo.querySelector(`a[href="/${channel.value}"]:has(div > h1)`);

    if (channelLink !== null) {
      followedWidget.value = channelLink.parentElement;
    }
  });

  channelLinkWaiter.observe(streamInfo, { subtree: true, childList: true });
  return;
});

onUnmounted(() => {
  channelLinkWaiter?.disconnect();
  chatRestrictionsUnsub();
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
