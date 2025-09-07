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
  <div class="media-slot">
    <div
      v-if="isGenerating || isUploading || isDeleting"
      class="loading-container"
    >
      <div class="loading-spinner"></div>
      <p v-if="generationStatus" class="status-text">{{ generationStatus }}</p>
      <button v-if="isGenerating" @click="cancel" class="cancel-btn">
        Cancel
      </button>
    </div>
    <img
      v-if="mediaType === 'image' && dataUrl"
      :src="dataUrl"
      alt="Scene image"
    />
    <video v-if="mediaType === 'video' && dataUrl" controls>
      <source :src="dataUrl" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div
      v-else-if="!isGenerating && !isUploading && !displayOnly"
      class="placeholder"
    >
      <div v-if="mediaType === 'video'" class="image-to-video-container">
        <input
          type="checkbox"
          :id="'imageToVideo-' + sceneId"
          v-model="imageToVideo"
          class="image-to-video-checkbox"
          @change="onImageToVideoChange"
        />
        <label :for="'imageToVideo-' + sceneId">Image To Video</label>
      </div>
      <button @click="generate" class="generate-btn">
        Generate {{ mediaType }}
      </button>
      <button
        v-if="mediaType === 'image' && !hideLastFrame"
        @click="useLastFrame"
        class="generate-btn"
        :disabled="index === 0"
      >
        Last Frame
      </button>
    </div>
    <div class="icon-container">
      <span
        v-if="!displayOnly"
        @click="upload"
        class="icon mdi mdi-upload"
      ></span>
      <span
        v-if="dataUrl && !displayOnly"
        @click="download"
        class="icon mdi mdi-download"
      ></span>
      <span
        v-if="mediaType === 'image' && dataUrl && !displayOnly"
        @click="upscale"
        class="icon mdi mdi-arrow-up-circle-outline"
      ></span>
      <span
        v-if="dataUrl && !displayOnly"
        @click="deleteMedia"
        class="icon mdi mdi-delete"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  mediaType: 'image' | 'video';
  dataUrl?: string | null;
  isGenerating?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
  generationStatus?: string | null;
  sceneId: string | number;
  index?: number;
  displayOnly?: boolean;
  hideLastFrame?: boolean;
}>();

const emit = defineEmits<{
  (e: 'generate'): void;
  (e: 'upload'): void;
  (e: 'delete'): void;
  (e: 'download'): void;
  (e: 'upscale'): void;
  (e: 'use-last-frame'): void;
  (e: 'image-to-video-change', value: boolean): void;
  (e: 'cancel'): void;
}>();

const imageToVideo = ref(false);

const generate = () => emit('generate');
const upload = () => emit('upload');
const deleteMedia = () => emit('delete');
const download = () => emit('download');
const upscale = () => emit('upscale');
const useLastFrame = () => emit('use-last-frame');
const onImageToVideoChange = () =>
  emit('image-to-video-change', imageToVideo.value);
const cancel = () => emit('cancel');
</script>

<style scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.cancel-btn {
  margin-top: 15px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-btn:hover {
  background-color: var(--color-accent-hover);
}

.status-text {
  color: white;
  margin-top: 10px;
}

.media-slot {
  position: relative;
  background-color: #111;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon-container {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon {
  font-size: 20px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 4px;
  transition: all 0.2s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon:hover {
  transform: scale(1.1);
  color: var(--color-accent);
}

.icon.mdi-delete:hover {
  color: var(--color-error);
}

img,
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
}

.placeholder {
  width: 100%;
  height: 100%;
  background-color: #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
}

.image-to-video-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: white;
}

.image-to-video-checkbox {
  margin-right: 8px;
}

.generate-btn {
  background-color: var(--color-accent);
  color: #ffffff;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: var(--transition-fast);
  width: 150px;
  text-align: center;
}

.generate-btn:hover {
  background-color: var(--color-accent-hover);
}
</style>
