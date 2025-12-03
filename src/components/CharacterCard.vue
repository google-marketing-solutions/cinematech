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
  <div class="character-card">
    <div class="character-image-container">
      <MediaSlot
        :media-type="'image'"
        :data-url="mediaDataUrl"
        :scene-id="character.characterId || character.name"
        :is-generating="character.isGeneratingImage"
        :is-uploading="character.isUploadingImage"
        :is-deleting="character.isDeletingImage"
        @generate="$emit('generate')"
        @delete="$emit('delete-image')"
        @upload="$emit('upload')"
        @download="handleDownload"
        @update:image-url="handleImageUpdate"
        @cancel="$emit('cancel-generation')"
        hide-last-frame
      />
    </div>
    <div class="character-info">
      <h3>{{ character.name }}</h3>
      <p>{{ character.description }}</p>
    </div>
    <button @click="$emit('edit')" class="edit-button">Edit</button>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import type { Character } from '@/types';
import { useMedia } from '@/composables/useMedia';
import MediaSlot from './MediaSlot.vue';

const props = defineProps({
  character: {
    type: Object as () => Character,
    required: true,
  },
});

const { mediaDataUrl, loadMedia, downloadMedia } = useMedia();

const handleDownload = () => {
  if (mediaDataUrl.value) {
    downloadMedia(mediaDataUrl.value, `${props.character.name}.png`);
  }
};

const handleImageUpdate = (newImageUrl: string | null) => {
  if (newImageUrl) {
    mediaDataUrl.value = newImageUrl;
    emit('update-image', newImageUrl);
  }
};

watch(
  () => props.character.image,
  (newImage) => {
    loadMedia(newImage || '');
  },
  { immediate: true }
);

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'generate'): void;
  (e: 'delete-image'): void;
  (e: 'upload'): void;
  (e: 'update-image', imageUrl: string): void;
  (e: 'cancel-generation'): void;
}>();
</script>

<style scoped>
.character-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  text-align: center;
  transition: var(--transition-smooth);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.character-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}

.character-image-container {
  position: relative;
  width: 100%;
  height: auto;
  margin: 0 auto var(--spacing-md);
  aspect-ratio: 16 / 9;
}

.character-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--color-border);
}

.delete-button {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.character-image-container:hover .delete-button {
  opacity: 1;
}

.character-image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #ccc;
  border-radius: var(--border-radius-md);
  margin: 0 auto var(--spacing-md);
  border: 2px solid var(--color-border);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.generate-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.3s;
}

.character-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.character-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.edit-button {
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: var(--spacing-md);
}

.edit-button:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
}
</style>
