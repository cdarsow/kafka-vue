import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kafka',
    },
    {
      path: '/kafka',
      name: 'kafka',
      component: () => import('../views/KafkaView.vue'),
    },
    {
      path: '/websocket',
      name: 'websocket',
      component: () => import('../views/WebSocketView.vue'),
    },
  ],
})

export default router
