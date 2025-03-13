import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface Settings {
  dontHideDeletedMessages: boolean;
}
const settingsLocalStorageKey = 'my-twitch-extension-settings';

function LoadSettings(): Settings {
  const storedData = localStorage.getItem(settingsLocalStorageKey);

  return storedData ? JSON.parse(storedData) : { dontHideDeletedMessages: false };
}

export const useSettingsStore = defineStore('settingsStore', () => {
  const settings = ref<Settings>(LoadSettings());

  watch(settings, (x) => localStorage.setItem(settingsLocalStorageKey, JSON.stringify(x)), {
    deep: true,
  });

  return { get: settings };
});
