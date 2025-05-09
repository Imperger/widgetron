import { createPinia } from 'pinia';
import { createApp, ref } from 'vue';

import App from './App.vue';
import { storage } from './config';
import { db } from './db/db';
import { ExtensionDB } from './extension-db';
import {
  bodyMountPointMaintainerToken,
  chatInterceptorToken,
  dbToken,
  gqlInterceptorToken,
  localStorageInterceptorToken,
  twitchInteractorToken,
  widgetSharedStateToken,
  widgetsToken,
} from './injection-tokens';
import router from './router';
import { SharedStateObserver } from './shared-state-observer';
import { HermesInterceptor } from './twitch/hermes-interceptor';
import { PubSubInterceptor } from './twitch/pub-sub-interceptor';
import type { SharedState } from './widget/shared-state';

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

async function shrinkMessages(db: ExtensionDB): Promise<void> {
  const totalMessages = await db.messageCount();

  if (totalMessages > storage.message.hardMax) {
    const deleted = await db.shrinkMessages(totalMessages - storage.message.softMax);

    if (deleted > 0) {
      console.info(
        `Message storage exceeds the limit ${storage.message.hardMax}!  Deleting ${deleted} messages...`,
      );
    }
  }
}

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

  const websocketInterceptor = new WebsocketInterceptor([
    'wss://irc-ws.chat.twitch.tv:443',
    'wss://pubsub-edge.twitch.tv:443/v1',
    'wss://hermes.twitch.tv',
  ]);
  websocketInterceptor.install();

  const chatInterceptor = new ChatInterceptor();
  websocketInterceptor.subscribe(chatInterceptor);

  const pubSubInterceptor = new PubSubInterceptor();
  websocketInterceptor.subscribe(pubSubInterceptor);

  const hermesInterceptor = new HermesInterceptor();
  websocketInterceptor.subscribe(hermesInterceptor);

  const localStorageInterceptor = new LocalStorageInterceptor();
  localStorageInterceptor.install();

  const extensionDB = new ExtensionDB(db);

  const widgetSharedState: SharedState = { channel: null };

  new SharedStateObserver(
    chatInterceptor,
    pubSubInterceptor,
    hermesInterceptor,
    gqlInterceptor,
    widgetSharedState,
  );

  await waitUntil(document, 'DOMContentLoaded');

  await shrinkMessages(extensionDB);

  const app = createApp(App);

  app.provide(gqlInterceptorToken, gqlInterceptor);
  app.provide(chatInterceptorToken, chatInterceptor);
  app.provide(bodyMountPointMaintainerToken, new MountPointMaintainer(document.body));
  app.provide(dbToken, extensionDB);
  app.provide(widgetsToken, ref<WidgetInstance[]>([]));
  app.provide(localStorageInterceptorToken, localStorageInterceptor);
  app.provide(twitchInteractorToken, twitchInteractor);
  app.provide(widgetSharedStateToken, widgetSharedState);

  app.use(createPinia());
  app.use(router);

  app.mount(createMountingPoint());
})();
