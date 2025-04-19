import type { InjectionKey, Ref } from 'vue';

import type { ExtensionDB } from './extension-db';
import type { SharedState } from './widget/shared-state';

import type { MountPointMaintainer } from '@/lib/mount-point-maintainer';
import type { ChatInterceptor } from '@/twitch/chat-interceptor';
import type { GQLInterceptor } from '@/twitch/gql/gql-interceptor';
import type { LocalStorageInterceptor } from '@/twitch/local-storage-interceptor';
import type { TwitchInteractor } from '@/twitch/twitch-interactor';
import type { WidgetInstance } from '@/widget/widget-instance';

export const gqlInterceptorToken = Symbol() as InjectionKey<GQLInterceptor>;
export const chatInterceptorToken = Symbol() as InjectionKey<ChatInterceptor>;
export const bodyMountPointMaintainerToken = Symbol() as InjectionKey<MountPointMaintainer>;
export const dbToken = Symbol() as InjectionKey<ExtensionDB>;
export const widgetsToken = Symbol() as InjectionKey<Ref<WidgetInstance[]>>;
export const localStorageInterceptorToken = Symbol() as InjectionKey<LocalStorageInterceptor>;
export const twitchInteractorToken = Symbol() as InjectionKey<TwitchInteractor>;
export const widgetSharedStateToken = Symbol() as InjectionKey<SharedState>;
