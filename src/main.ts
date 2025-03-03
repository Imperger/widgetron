import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from './App.vue';
import { NavigationInterceptor } from './lib/interceptors/navigation-interceptor';
import { GQLInterceptor } from './lib/interceptors/network-interceptor/gql-interceptor';
import { NetworkInterceptor } from './lib/interceptors/network-interceptor/network-interceptor';
import router from './router';

function CreateMountingPoint() {
  const mountingPoint = document.createElement('div');
  document.body.appendChild(mountingPoint);

  return mountingPoint;
}

new NavigationInterceptor(router).install();

const networkInterceptor = new NetworkInterceptor();
networkInterceptor.install();

const gqlInterceptor = new GQLInterceptor();
networkInterceptor.subscribe(gqlInterceptor);

const app = createApp(App);

app.provide('gqlInterceptor', gqlInterceptor);

app.use(createPinia());
app.use(router);
app.mount(CreateMountingPoint());
