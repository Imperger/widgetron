import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/directory',
      name: 'directory_page',
      component: () => import('../pages/DirectoryPage.vue'),
    },
    {
      path: '/:channel',
      name: 'channel_page',
      component: () => import('../pages/ChannelPage.vue'),
    },
  ],
});

export default router;
