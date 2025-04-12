import type { InjectionKey, Ref } from 'vue';

import type { ExtensionDB } from './extension-db';
import type { LocalStorageInterceptor } from './lib/interceptors/local-storage-interceptor';
import type { ChatInterceptor } from './lib/interceptors/network-interceptor/chat-interceptor';
import type { GQLInterceptor } from './lib/interceptors/network-interceptor/gql-interceptor';
import type { MountPointMaintainer } from './lib/mount-point-maintainer';
import type { TwitchInteractor } from './twitch/twitch-interactor';
import type { WidgetInstance } from './widget/widget-instance';

export const gqlInterceptorToken = Symbol() as InjectionKey<GQLInterceptor>;
export const chatInterceptorToken = Symbol() as InjectionKey<ChatInterceptor>;
export const bodyMountPointMaintainerToken = Symbol() as InjectionKey<MountPointMaintainer>;
export const dbToken = Symbol() as InjectionKey<ExtensionDB>;
export const widgetsToken = Symbol() as InjectionKey<Ref<WidgetInstance[]>>;
export const localStorageInterceptorToken = Symbol() as InjectionKey<LocalStorageInterceptor>;
export const twitchInteractorToken = Symbol() as InjectionKey<TwitchInteractor>;
