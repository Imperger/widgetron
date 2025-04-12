import { createPinia } from 'pinia';
import { createApp, ref } from 'vue';

import App from './App.vue';
import { db } from './db/db';
import { ExtensionDB } from './extension-db';
import {
  bodyMountPointMaintainerToken,
  chatInterceptorToken,
  dbToken,
  gqlInterceptorToken,
  localStorageInterceptorToken,
  twitchInteractorToken,
  widgetsToken,
} from './injection-tokens';
import router from './router';

import { MountPointMaintainer } from '@/lib/mount-point-maintainer';
import { waitUntil } from '@/lib/wait-until';
import { ChatInterceptor } from '@/twitch/chat-interceptor';
import { FetchInterceptor } from '@/twitch/fetch-interceptor';
import { GQLInterceptor } from '@/twitch/gql/gql-interceptor';
import { LocalStorageInterceptor } from '@/twitch/local-storage-interceptor';
import { NavigationInterceptor } from '@/twitch/navigation-interceptor';
import { TwitchInteractor } from '@/twitch/twitch-interactor';
import { WebsocketInterceptor } from '@/twitch/websocket-interceptor';
import type { WidgetInstance } from '@/widget/widget-instance';

function createMountingPoint() {
  const mountingPoint = document.createElement('div');
  document.body.appendChild(mountingPoint);

  return mountingPoint;
}

(async function main() {
  new NavigationInterceptor(router).install();

  const fetchInterceptor = new FetchInterceptor();
  fetchInterceptor.install();

  const gqlInterceptor = new GQLInterceptor();

  const twitchInteractor = new TwitchInteractor(fetchInterceptor, gqlInterceptor);

  fetchInterceptor.subscribe(gqlInterceptor);

  const websocketIntrceptor = new WebsocketInterceptor(['wss://irc-ws.chat.twitch.tv:443']);
  websocketIntrceptor.install();

  const chatInterceptor = new ChatInterceptor();
  websocketIntrceptor.subscribe(chatInterceptor);

  const localStorageInterceptor = new LocalStorageInterceptor();
  localStorageInterceptor.install();

  await waitUntil(document, 'DOMContentLoaded');

  const app = createApp(App);

  app.provide(gqlInterceptorToken, gqlInterceptor);
  app.provide(chatInterceptorToken, chatInterceptor);
  app.provide(bodyMountPointMaintainerToken, new MountPointMaintainer(document.body));
  app.provide(dbToken, new ExtensionDB(db));
  app.provide(widgetsToken, ref<WidgetInstance[]>([]));
  app.provide(localStorageInterceptorToken, localStorageInterceptor);
  app.provide(twitchInteractorToken, twitchInteractor);

  app.use(createPinia());
  app.use(router);

  app.mount(createMountingPoint());
})();
