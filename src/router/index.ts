import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/directory',
      name: 'directory_page',
      component: () => import('@/directory/directory-page.vue'),
    },
    {
      path: '/:channel',
      name: 'channel_page',
      component: () => import('@/channel/channel-page.vue'),
    },
  ],
});

export default router;
