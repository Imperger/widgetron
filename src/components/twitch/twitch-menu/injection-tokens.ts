import type { InjectionKey } from 'vue';

import type { MenuRoot } from './twitch-menu.vue';

export const menuRootToken = Symbol() as InjectionKey<MenuRoot>;
