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
  <div class="scene-card">
    <div class="media-container">
      <MediaSlot
        media-type="image"
        :data-url="imageDataUrl"
        :is-generating="scene.isGeneratingImage || scene.isUpscaling"
        :is-uploading="scene.isUploadingImage"
        :scene-id="scene.id"
        :index="index"
        @generate="generateImage"
        @upload="uploadImage"
        @delete="deleteMedia('image')"
        @use-last-frame="useLastFrame"
        @download="downloadMedia('image')"
        @upscale="upscaleImage"
      />
      <MediaSlot
        media-type="video"
        :data-url="videoDataUrl"
        :is-generating="scene.isGeneratingVideo"
        :is-uploading="scene.isUploadingVideo"
        :generation-status="scene.generationStatus"
        :scene-id="scene.id"
        @generate="generateVideo"
        @upload="uploadVideo"
        @delete="deleteMedia('video')"
        @image-to-video-change="onImageToVideoChange"
        @download="downloadMedia('video')"
        @cancel="cancelVideoGeneration"
      />
    </div>
    <p>{{ scene.description }}</p>
    <div class="actions">
      <button @click="editScene" class="edit-btn">Edit</button>
      <button @click="deleteScene" class="delete-btn">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMedia } from '@/composables/useMedia';
import MediaSlot from './MediaSlot.vue';
import type { Scene } from '@/types';

const props = defineProps<{
  scene: Scene;
  index: number;
}>();

const emit = defineEmits([
  'edit',
  'delete',
  'generate-video',
  'generate-image',
  'use-last-frame',
  'upload-image',
  'upload-video',
  'delete-media',
  'cancel-video-generation',
  'upscale-image',
]);

const {
  mediaDataUrl: imageDataUrl,
  loadMedia: loadImage,
  openFileDialog,
  downloadMedia: downloadImage,
} = useMedia();

const {
  mediaDataUrl: videoDataUrl,
  loadMedia: loadVideo,
  downloadMedia: downloadVideo,
} = useMedia();

const imageToVideo = ref(false);

const onImageToVideoChange = (value: boolean) => {
  imageToVideo.value = value;
};

const editScene = () => {
  emit('edit', props.scene);
};

const deleteScene = () => {
  if (confirm('Are you sure you want to delete this scene?')) {
    emit('delete', props.scene.id);
  }
};

const deleteMedia = (mediaType: 'image' | 'video') => {
  if (confirm(`Are you sure you want to delete this ${mediaType}?`)) {
    emit('delete-media', { sceneId: props.scene.id, mediaType });
  }
};

const downloadMedia = (mediaType: 'image' | 'video') => {
  if (mediaType === 'image') {
    downloadImage(imageDataUrl.value!, `${props.scene.id}_image.png`);
  } else {
    downloadVideo(videoDataUrl.value!, `${props.scene.id}_video.mp4`);
  }
};

const generateVideo = () => {
  emit('generate-video', { ...props.scene, imageToVideo: imageToVideo.value });
};

const cancelVideoGeneration = () => {
  emit('cancel-video-generation', props.scene.id);
};

const generateImage = () => {
  emit('generate-image', props.scene);
};

const upscaleImage = () => {
  emit('upscale-image', props.scene);
};

const useLastFrame = () => {
  emit('use-last-frame', props.index);
};

const uploadImage = () => {
  openFileDialog('image/*', (file: File) => {
    emit('upload-image', { scene: props.scene, file });
  });
};

const uploadVideo = () => {
  openFileDialog('video/*', (file: File) => {
    emit('upload-video', { scene: props.scene, file });
  });
};

watch(
  () => props.scene.video,
  (newVideo) => {
    loadVideo(newVideo!);
  },
  { immediate: true }
);

watch(
  () => props.scene.image,
  (newImage) => {
    if (typeof newImage === 'string') {
      loadImage(newImage);
    } else if (
      typeof newImage === 'object' &&
      newImage &&
      (newImage as any).bytesBase64Encoded
    ) {
      imageDataUrl.value = `data:image/png;base64,${(newImage as any).bytesBase64Encoded}`;
    } else {
      imageDataUrl.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.scene-card {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
  text-align: left;
  display: flex;
  flex-direction: column;
  transition: var(--transition-smooth);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.scene-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-hover);
}

.media-container {
  width: 100%;
  margin-bottom: var(--spacing-md);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  position: relative;
  background-color: #000;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.scene-card p {
  margin: 0 var(--spacing-sm) var(--spacing-sm);
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  flex-grow: 1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 var(--spacing-sm) var(--spacing-sm);
  gap: var(--spacing-sm);
}

.scene-card:hover .actions {
  opacity: 1;
  transform: translateY(0);
}

.edit-btn,
.delete-btn {
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(5px);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.8rem;
  transition: var(--transition-fast);
}

.edit-btn:hover {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
}

.delete-btn:hover {
  background-color: var(--color-error);
  border-color: var(--color-error);
  color: #ffffff;
}
</style>
