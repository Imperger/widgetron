import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface Settings {
  dontHideDeletedMessages: boolean;
  deletedMessageStyle: string;
}
const settingsLocalStorageKey = 'my-twitch-extension-settings';

const deletedMessageStyleDefaults = `
.deleted-message-text {
  color: #ff7800;
}

.deleted-message-displayname {
  color: #ff7800;
}
`;

function LoadSettings(): Settings {
  const storedData = localStorage.getItem(settingsLocalStorageKey);

  return storedData
    ? JSON.parse(storedData)
    : {
        dontHideDeletedMessages: false,
        deletedMessageStyle: deletedMessageStyleDefaults,
      };
}

export const useSettingsStore = defineStore('settingsStore', () => {
  const settings = ref<Settings>(LoadSettings());

  watch(settings, (x) => localStorage.setItem(settingsLocalStorageKey, JSON.stringify(x)), {
    deep: true,
  });

  return { get: settings };
});
