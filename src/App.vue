<!--
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
-->

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.ts';
import { useProjectStore } from '@/stores/project.ts';
import ProjectList from '@/components/ProjectList.vue';
import Toast from '@/components/Toast.vue';

/**
 * The main component of the application.
 */
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const showHeader = computed(() => {
  return route.name !== 'login';
});

const logout = () => {
  authStore.logout();
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  router.push({ name: 'login' });
};

onMounted(() => {
  // Initialize stores
  projectStore.fetchProjects();
});
</script>

<template>
  <div
    class="app-container"
    :class="{ 'sidebar-collapsed': projectStore.isCollapsed }"
  >
    <header v-if="showHeader" class="app-header">
      <div class="logo">
        <!-- You can place your logo here -->
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
        <RouterLink to="/">Tarantino AI</RouterLink>
      </div>
      <nav class="app-nav">
        <RouterLink to="/config">Config</RouterLink>
        <RouterLink to="/">Create</RouterLink>
        <RouterLink to="/guidelines">Guidelines</RouterLink>
        <RouterLink to="/scenes">Storyboard</RouterLink>
        <RouterLink to="/video">Export</RouterLink>
      </nav>
      <div class="user-actions">
        <button v-if="isAuthenticated" @click="logout" class="logout-button">
          Logout
        </button>
      </div>
    </header>
    <div class="main-app-area">
      <ProjectList v-if="showHeader" />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
    <Toast />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
}

.main-app-area {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--layout-padding);
  height: 64px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 40px;
  margin-right: 12px;
}

.logo a {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-decoration: none;
}

.app-nav {
  display: flex;
  gap: var(--spacing-md);
}

.app-nav a {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: var(--transition-smooth);
  position: relative;
}

.app-nav a:hover {
  color: var(--color-text-primary);
  background-color: rgba(255, 255, 255, 0.05);
}

.app-nav a.router-link-exact-active {
  color: var(--color-accent);
  font-weight: 600;
}

.app-nav a.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--spacing-md);
  right: var(--spacing-md);
  height: 2px;
  background-color: var(--color-accent);
}

.user-actions .logout-button {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
  font-weight: 500;
}

.user-actions .logout-button:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: var(--layout-padding);
  display: flex;
  flex-direction: column;
}
</style>
