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
<template>
  <div
    class="project-list-panel"
    :class="{ collapsed: projectStore.isCollapsed }"
  >
    <div class="header">
      <h2 v-if="!projectStore.isCollapsed">Projects</h2>
      <button @click="projectStore.toggleCollapse()" class="collapse-btn">
        <span
          v-if="!projectStore.isCollapsed"
          class="mdi mdi-chevron-left"
        ></span>
        <span v-else class="mdi mdi-chevron-right"></span>
      </button>
    </div>
    <div v-if="!projectStore.isCollapsed" class="project-list-content">
      <div v-if="!isGcsConfigured" class="config-warning">
        <p>
          GCS bucket is not configured. Please configure it to use projects.
        </p>
        <button @click="goToConfig">Go to Config</button>
      </div>
      <div v-else>
        <div v-if="projectStore.loading" class="loader">Loading...</div>
        <div v-if="projectStore.error" class="error-message">
          {{ projectStore.error }}
        </div>

        <ul class="project-list">
          <li
            v-for="project in projectStore.projects"
            :key="project"
            :class="{ active: project === projectStore.currentProjectId }"
            class="project-item"
          >
            <span @click="selectProject(project)" class="project-name">{{
              project
            }}</span>
            <button @click.stop="deleteProject(project)" class="delete-btn">
              <span class="mdi mdi-trash-can-outline"></span>
            </button>
          </li>
        </ul>

        <div class="new-project-form">
          <input
            v-model="newProjectName"
            placeholder="New project name"
            @keyup.enter="createProject"
            :disabled="!isGcsConfigured"
          />
          <button
            @click="createProject"
            :disabled="!newProjectName.trim() || !isGcsConfigured"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProjectStore } from '@/stores/project';
import { useConfigStore } from '@/stores/config';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const configStore = useConfigStore();
const router = useRouter();
const newProjectName = ref('');

const isGcsConfigured = computed(() => !!configStore.gcsBucketName);

const goToConfig = () => {
  router.push({ name: 'config' });
};

onMounted(() => {
  if (isGcsConfigured.value) {
    projectStore.fetchProjects();
  }
});

const selectProject = (projectId: string) => {
  projectStore.setCurrentProject(projectId);
};

const createProject = () => {
  if (newProjectName.value.trim()) {
    projectStore.createProject(newProjectName.value.trim());
    newProjectName.value = '';
  }
};

const deleteProject = (projectId: string) => {
  if (
    window.confirm(
      `Are you sure you want to delete project "${projectId}"? This action cannot be undone.`
    )
  ) {
    projectStore.deleteProject(projectId);
  }
};
</script>

<style scoped>
.config-warning {
  padding: 1rem;
  background-color: var(--color-surface-variant);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  margin-bottom: 1rem;
  text-align: center;
}

.config-warning p {
  margin: 0 0 1rem;
  color: var(--color-text-secondary);
}

.config-warning button {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.config-warning button:hover {
  background-color: #ff4785;
}
.project-list-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.project-list-panel {
  width: 250px;
  background-color: var(--color-surface);
  padding: var(--layout-padding);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  transition: width 0.3s ease;
}

.project-list-panel.collapsed {
  width: 60px;
  padding: var(--layout-padding) 0.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.collapse-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0;
}

h2 {
  margin-top: 0;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: var(--border-radius-md);
  margin-bottom: 0.5rem;
  transition: background-color 0.2s;
  color: var(--color-text-secondary);
}

.project-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: none; /* Hidden by default */
  font-size: 16px;
}

.project-item:hover .delete-btn {
  display: block; /* Show on hover */
}

.delete-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #d8000c;
}

.project-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.project-item.active {
  background-color: var(--color-accent);
  color: var(--color-text-primary);
  font-weight: 600;
}

.new-project-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}

.new-project-form input {
  padding: 0.75rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  margin-bottom: 0.5rem;
}

.new-project-form button {
  padding: 0.75rem;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.new-project-form button:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}

.new-project-form button:hover:not(:disabled) {
  background-color: #ff4785;
}

.loader {
  text-align: center;
  padding: 1rem;
  color: var(--color-text-secondary);
}

.error-message {
  color: #d8000c;
  background-color: #ffd2d2;
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1rem;
}
</style>
