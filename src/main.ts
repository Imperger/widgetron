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
  widgetsToken,
} from './injection-tokens';
import { LocalStorageInterceptor } from './lib/interceptors/local-storage-interceptor';
import { NavigationInterceptor } from './lib/interceptors/navigation-interceptor';
import { ChatInterceptor } from './lib/interceptors/network-interceptor/chat-interceptor';
import { FetchInterceptor } from './lib/interceptors/network-interceptor/fetch-interceptor';
import { GQLInterceptor } from './lib/interceptors/network-interceptor/gql-interceptor';
import { WebsocketInterceptor } from './lib/interceptors/network-interceptor/websocket-interceptor';
import { MountPointMaintainer } from './lib/mount-point-maintainer';
import { waitUntil } from './lib/wait-until';
import router from './router';

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

  app.use(createPinia());
  app.use(router);

  app.mount(createMountingPoint());
})();
