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
  <div class="export-view">
    <PageTitle title="Exported Video" />
    <div class="video-container">
      <div v-if="isLoading" class="loading-message">Loading video...</div>
      <video v-else-if="videoUrl" :src="videoUrl" controls autoplay />
      <div v-else class="no-video-message">
        <p>No exported video found.</p>
        <button @click="router.push('/editor')" class="secondary-btn">
          Back to Editor
        </button>
      </div>
    </div>
    <div class="actions" v-if="videoUrl">
      <button @click="downloadVideo" class="primary-btn">
        <i class="mdi mdi-download"></i> Download Video
      </button>
      <button @click="router.push('/editor')" class="secondary-btn">
        <i class="mdi mdi-pencil"></i> Back to Editor
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStoryStore } from '@/stores/story.ts';
import PageTitle from '@/components/PageTitle.vue';
import { useMedia } from '@/composables/useMedia.ts';
import { downloadFileFromGCS } from '@/services/gcp/gcs.ts';

const router = useRouter();
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
.export-view {
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  aspect-ratio: 16/9;
  background-color: #000;
  box-shadow: var(--shadow-lg);
}

video {
  height: 100%;
  width: 100%;
  display: block;
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn {
  background-color: var(--color-primary);
  color: white;
}

.primary-btn:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.secondary-btn {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.secondary-btn:hover {
  background-color: var(--color-surface-hover);
  transform: translateY(-2px);
}

.loading-message,
.no-video-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 16px;
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}
</style>
