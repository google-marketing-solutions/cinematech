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
  <div class="projects-view">
    <div class="content-container">
      <header class="view-header">
        <h1 class="title">Select a Project</h1>
        <p class="subtitle">
          Choose a project to continue or create a new one.
        </p>
      </header>

      <div v-if="projectStore.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading projects...</p>
      </div>

      <div v-else-if="projectStore.error" class="error-state">
        <span class="mdi mdi-alert-circle-outline error-icon"></span>
        <p class="error-message">
          {{ projectStore.error.message || 'Failed to load projects' }}
        </p>
        <button @click="projectStore.fetchProjects()" class="retry-btn">
          Retry
        </button>
        <button @click="goToConfig" class="config-btn">
          Check Configuration
        </button>
      </div>

      <div v-else class="projects-grid">
        <!-- New Project Card -->
        <div
          class="project-card new-project-card"
          @click="showCreateModal = true"
        >
          <div class="card-content">
            <div class="icon-wrapper">
              <span class="mdi mdi-plus"></span>
            </div>
            <h3>Create New Project</h3>
            <p>Start a fresh storyboard</p>
          </div>
        </div>

        <!-- Existing Projects -->
        <div
          v-for="project in projectStore.projects"
          :key="project"
          class="project-card"
          @click="selectProject(project)"
        >
          <div class="card-content">
            <div class="project-icon">
              <span class="mdi mdi-movie-open-outline"></span>
            </div>
            <h3 class="project-name">{{ project }}</h3>
            <div class="card-actions">
              <button
                @click.stop="copyProject(project)"
                class="action-btn"
                title="Duplicate"
              >
                <span class="mdi mdi-content-copy"></span>
              </button>
              <button
                @click.stop="deleteProject(project)"
                class="action-btn delete"
                title="Delete"
              >
                <span class="mdi mdi-trash-can-outline"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-actions">
        <button @click="goToConfig" class="text-btn">
          <span class="mdi mdi-cog-outline"></span> Configure Settings
        </button>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="showCreateModal = false"
    >
      <div class="modal-content">
        <h2>Create New Project</h2>
        <input
          v-model="newProjectName"
          placeholder="Enter project name"
          @keyup.enter="createProject"
          class="project-input"
          ref="newProjectInput"
          autofocus
        />
        <div class="modal-actions">
          <button @click="showCreateModal = false" class="cancel-btn">
            Cancel
          </button>
          <button
            @click="createProject"
            class="create-btn"
            :disabled="!newProjectName.trim() || projectStore.loading"
          >
            {{ projectStore.loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/project';
import { useConfigStore } from '@/stores/config';

const router = useRouter();
const projectStore = useProjectStore();
const configStore = useConfigStore();

const showCreateModal = ref(false);
const newProjectName = ref('');
const newProjectInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  if (!configStore.gcsBucketName) {
    router.push({ name: 'config' });
    return;
  }
  projectStore.fetchProjects();
});

watch(showCreateModal, (newValue) => {
  if (newValue) {
    nextTick(() => {
      newProjectInput.value?.focus();
    });
  } else {
    newProjectName.value = '';
  }
});

const selectProject = async (projectId: string) => {
  await projectStore.setCurrentProject(projectId);
  router.push({ name: 'prompt' }); // Or 'scenes', depending on default flow. 'prompt' is usually first.
};

const createProject = async () => {
  if (!newProjectName.value.trim()) return;

  await projectStore.createProject(newProjectName.value.trim());
  showCreateModal.value = false;
  // After creation, it automatically sets current project, but we might want to navigate
  if (projectStore.currentProjectId === newProjectName.value.trim()) {
    router.push({ name: 'prompt' });
  }
};

const deleteProject = async (projectId: string) => {
  if (
    confirm(
      `Are you sure you want to delete "${projectId}"? This cannot be undone.`
    )
  ) {
    await projectStore.deleteProject(projectId);
  }
};

const copyProject = async (sourceProjectName: string) => {
  const destinationProjectName = prompt(
    'Enter name for the new copy:',
    `Copy of ${sourceProjectName}`
  );
  if (destinationProjectName) {
    await projectStore.copyProject(sourceProjectName, destinationProjectName);
    router.push({ name: 'prompt' });
  }
};

const goToConfig = () => {
  router.push({ name: 'config' });
};
</script>

<style scoped>
.projects-view {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  display: flex;
  justify-content: center;
  padding: 4rem 2rem;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.view-header {
  text-align: center;
}

.title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.project-card {
  background-color: var(--color-surface);
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  aspect-ratio: 1; /* Square cards */
  justify-content: center;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  border-color: var(--color-accent);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  z-index: 1;
}

.project-icon {
  font-size: 3rem;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.project-card:hover .project-icon {
  color: var(--color-accent);
}

.project-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.project-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--color-text-primary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-btn.delete:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #ef4444;
}

/* New Project Card Styles */
.new-project-card {
  border: 2px dashed var(--color-border);
  background: transparent;
}

.new-project-card:hover {
  border-color: var(--color-accent);
  background: rgba(var(--color-accent-rgb), 0.05);
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.new-project-card:hover .icon-wrapper {
  background: var(--color-accent);
  color: white;
}

.new-project-card .mdi-plus {
  font-size: 2rem;
}

/* Loading & Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem;
  background: var(--color-surface);
  border-radius: 16px;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--color-accent);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
  display: block;
}

.retry-btn,
.config-btn {
  margin: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.retry-btn {
  background: var(--color-accent);
  color: white;
}

.config-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

/* Footer */
.footer-actions {
  text-align: center;
  margin-top: 2rem;
}

.text-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: color 0.2s;
}

.text-btn:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.project-input {
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.project-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
}

.create-btn {
  background: var(--color-accent);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
