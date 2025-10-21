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
  <div class="video-view">
    <PageTitle title="Final Video" />
    <div class="video-container">
      <div v-if="isLoading" class="loading-message">Loading video...</div>
      <video v-else-if="videoUrl" :src="videoUrl" controls />
      <div v-else class="no-video-message">Video is missing</div>
    </div>
    <div class="actions">
      <button @click="downloadVideo" :disabled="!videoUrl">
        Download Video
      </button>
      <!-- <button @click="cropVideo" :disabled="!videoUrl">Crop to 9:16</button> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useStoryStore } from '@/stores/story.ts';
import PageTitle from '@/components/PageTitle.vue';
import { useMedia } from '@/composables/useMedia.ts';
import { downloadFileFromGCS } from '@/services/gcp/gcs.ts';

const storyStore = useStoryStore();
const videoUrl = ref<string | null>(null);
const isLoading = ref(false);
const { downloadMedia } = useMedia();

const loadVideo = async () => {
  videoUrl.value = null;
  if (storyStore.finalVideo) {
    isLoading.value = true;
    try {
      const blob = await downloadFileFromGCS(storyStore.finalVideo, 'blob');
      videoUrl.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      isLoading.value = false;
    }
  }
};

watch(() => storyStore.finalVideo, loadVideo);

onMounted(loadVideo);

const downloadVideo = () => {
  if (videoUrl.value) {
    downloadMedia(videoUrl.value, 'final-video.mp4');
  }
};
</script>

<style scoped>
.video-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--layout-padding);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  min-height: 100vh;
  font-family: var(--font-primary);
}

.video-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 1200px;
  background-color: #000;
  box-shadow: var(--shadow-lg);
}

video {
  width: 100%;
  display: block;
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.actions button {
  background-color: var(--color-accent);
  color: var(--color-text-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-md);
}

.actions button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.actions button:disabled {
  background-color: var(--color-border);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.loading-message,
.no-video-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  min-height: 480px;
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}
</style>
