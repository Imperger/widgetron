import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/directory',
      name: 'directory_page',
      component: () => import('../pages/directory-page.vue'),
    },
    {
      path: '/:channel',
      name: 'channel_page',
      component: () => import('../pages/channel/channel-page.vue'),
    },
  ],
});

export default router;
