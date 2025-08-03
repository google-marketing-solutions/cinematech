/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type NavigationGuardNext,
} from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import PromptView from '../views/PromptView.vue';
import GuidelinesView from '../views/GuidelinesView.vue';
import ScenesView from '../views/ScenesView.vue';
import VideoView from '../views/VideoView.vue';
import LoginView from '../views/LoginView.vue';
import ConfigView from '../views/ConfigView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/prompt',
      name: 'prompt',
      component: PromptView,
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/prompt',
    },
    {
      path: '/guidelines',
      name: 'guidelines',
      component: GuidelinesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/scenes',
      name: 'scenes',
      component: ScenesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/video',
      name: 'video',
      component: VideoView,
      meta: { requiresAuth: true },
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();
    const configStore = useConfigStore();
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (requiresAuth && !authStore.isAuthenticated) {
      next({ name: 'login' });
    } else if (to.name === 'login' && authStore.isAuthenticated) {
      next({ name: 'prompt' });
    } else if (
      requiresAuth &&
      authStore.isAuthenticated &&
      !configStore.gcsBucketName &&
      to.name !== 'config'
    ) {
      next({ name: 'config' });
    } else {
      next();
    }
  }
);

export default router;
