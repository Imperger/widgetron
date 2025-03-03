import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFollowingStore = defineStore('followingStore', () => {
  const followingCache = ref(new Map<string, number>());

  const add = (channel: string, date: Date) =>
    void followingCache.value.set(channel, date.getTime());

  const get = (channel: string) => followingCache.value.get(channel) ?? null;

  const purge = (channel: string) => followingCache.value.delete(channel);

  return { add, get, purge };
});
