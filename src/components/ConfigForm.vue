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
  <form @submit.prevent="saveConfig" class="config-form">
    <div class="form-group">
      <label for="geminiTextModel">Gemini Text Model</label>
      <input
        type="text"
        id="geminiTextModel"
        v-model="config.geminiTextModel"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="vertexVideoModel">Vertex Video Model</label>
      <input
        type="text"
        id="vertexVideoModel"
        v-model="config.vertexVideoModel"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="vertexImageModel">Vertex Image Model</label>
      <input
        type="text"
        id="vertexImageModel"
        v-model="config.vertexImageModel"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="googleCloudProjectId">Google Cloud Project ID</label>
      <input
        type="text"
        id="googleCloudProjectId"
        v-model="config.googleCloudProjectId"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="gcsBucketName">GCS Bucket Name</label>
      <input
        type="text"
        id="gcsBucketName"
        v-model="config.gcsBucketName"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <label for="gcpLocationId">GCP Location ID</label>
      <input
        type="text"
        id="gcpLocationId"
        v-model="config.gcpLocationId"
        class="form-control"
      />
    </div>

    <div class="save-container">
      <button type="submit" class="btn-save">Save</button>
      <span v-if="showFeedback" class="feedback-message">Saved!</span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConfigStore } from '@/stores/config.ts';

/**
 * A form for updating the application's configuration.
 */
const configStore = useConfigStore();
const config = ref({ ...configStore.$state });
const showFeedback = ref(false);

const saveConfig = () => {
  configStore.updateConfig(config.value);
  showFeedback.value = true;
  setTimeout(() => {
    showFeedback.value = false;
  }, 2000);
};
</script>

<style scoped>
.config-form {
  width: 100%;
  max-width: 600px;
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  transition: var(--transition-smooth);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
}

.btn-save {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-save:hover {
  background-color: var(--color-accent-hover);
}

.save-container {
  display: flex;
  align-items: center;
}

.feedback-message {
  margin-left: 1rem;
  color: var(--color-accent);
  font-weight: 500;
}
</style>
