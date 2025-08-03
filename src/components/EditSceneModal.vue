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
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Edit Scene</h2>
      <div class="media-container">
        <div class="form-group">
          <label for="edit-image">Image</label>
          <MediaSlot
            media-type="image"
            :data-url="imageDataUrl"
            :is-generating="isImageLoading"
            :scene-id="scene.id"
            @generate="generateImage"
            @upload="uploadImage"
            @delete="deleteMedia('image')"
          />
        </div>
        <div class="form-group">
          <label for="edit-video">Video</label>
          <MediaSlot
            media-type="video"
            :data-url="videoDataUrl"
            :is-generating="isVideoLoading"
            :scene-id="scene.id"
            @generate="generateVideo"
            @upload="uploadVideo"
            @delete="deleteMedia('video')"
            @image-to-video-change="onImageToVideoChange"
          />
        </div>
      </div>
      <div class="form-group">
        <label for="edit-background">Background</label>
        <textarea
          type="text"
          id="edit-background"
          v-model="editableScene.background"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-description">Description</label>
        <textarea
          id="edit-description"
          v-model="editableScene.description"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-script">Script</label>
        <textarea id="edit-script" v-model="editableScene.script"></textarea>
      </div>

      <h3>Image Directives</h3>
      <div class="form-group">
        <label for="edit-image-description">Description</label>
        <textarea
          id="edit-image-description"
          v-model="editableScene.imageDirectives.description"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-image-style">Style</label>
        <input
          type="text"
          id="edit-image-style"
          v-model="editableScene.imageDirectives.style"
        />
      </div>
      <div class="form-group">
        <label for="edit-image-framing">Framing</label>
        <input
          type="text"
          id="edit-image-framing"
          v-model="editableScene.imageDirectives.framing"
        />
      </div>
      <div class="form-group">
        <label for="edit-image-lighting">Lighting</label>
        <input
          type="text"
          id="edit-image-lighting"
          v-model="editableScene.imageDirectives.lighting"
        />
      </div>
      <div class="form-group">
        <label for="edit-image-color">Color</label>
        <input
          type="text"
          id="edit-image-color"
          v-model="editableScene.imageDirectives.color"
        />
      </div>
      <div class="form-group">
        <label for="edit-image-mood">Mood</label>
        <input
          type="text"
          id="edit-image-mood"
          v-model="editableScene.imageDirectives.mood"
        />
      </div>

      <h3>Video Directives</h3>
      <div class="form-group">
        <label for="edit-video-style">Style</label>
        <input
          type="text"
          id="edit-video-style"
          v-model="editableScene.videoDirectives.style"
        />
      </div>
      <div class="form-group">
        <label for="edit-video-camera">Camera</label>
        <input
          type="text"
          id="edit-video-camera"
          v-model="editableScene.videoDirectives.camera"
        />
      </div>
      <div class="form-group">
        <label for="edit-video-movement">Movement</label>
        <input
          type="text"
          id="edit-video-movement"
          v-model="editableScene.videoDirectives.movement"
        />
      </div>
      <div class="form-group">
        <label for="edit-video-lighting">Lighting</label>
        <input
          type="text"
          id="edit-video-lighting"
          v-model="editableScene.videoDirectives.lighting"
        />
      </div>
      <div class="form-group">
        <label for="edit-video-transition">Transition</label>
        <input
          type="text"
          id="edit-video-transition"
          v-model="editableScene.videoDirectives.transition"
        />
      </div>

      <h3>Characters</h3>
      <div
        v-if="editableScene.characters && editableScene.characters.length > 0"
      >
        <div
          v-for="character in editableScene.characters"
          :key="character.name"
          class="character-info"
        >
          <strong>{{ character.name }}</strong>
          <p>{{ character.description }}</p>
        </div>
      </div>
      <div v-else>
        <p>No characters in this scene.</p>
      </div>

      <div class="modal-actions">
        <button @click="$emit('close')" class="cancel-button">Cancel</button>
        <button @click="save" class="save-button">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { downloadFileAsBase64 } from '@/services/gcp/gcs';
import MediaSlot from './MediaSlot.vue';
import type { Scene } from '@/types';

const props = defineProps<{
  scene: Scene;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', scene: Scene): void;
  (
    e: 'delete-media',
    payload: { sceneId: number; mediaType: 'image' | 'video' }
  ): void;
  (e: 'generate-video', scene: Scene & { imageToVideo: boolean }): void;
  (e: 'generate-image', scene: Scene): void;
  (e: 'upload-image', payload: { scene: Scene; file: File }): void;
  (e: 'upload-video', payload: { scene: Scene; file: File }): void;
}>();

const editableScene = ref<Scene>(JSON.parse(JSON.stringify(props.scene)));
const imageDataUrl = ref<string | null>(null);
const videoDataUrl = ref<string | null>(null);
const isImageLoading = ref(true);
const isVideoLoading = ref(true);
const imageToVideo = ref(false);

const onImageToVideoChange = (value: boolean) => {
  imageToVideo.value = value;
};

const save = () => {
  emit('save', editableScene.value);
};

const deleteMedia = (mediaType: 'image' | 'video') => {
  if (confirm(`Are you sure you want to delete this ${mediaType}?`)) {
    emit('delete-media', { sceneId: props.scene.id, mediaType });
  }
};

const generateVideo = () => {
  emit('generate-video', {
    ...props.scene,
    imageToVideo: imageToVideo.value,
  });
};

const generateImage = () => {
  emit('generate-image', props.scene);
};

const openFileDialog = (accept: string, callback: (file: File) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      const file = target.files[0];
      if (file) {
        callback(file);
      }
    }
  };
  input.click();
};

const uploadImage = () => {
  openFileDialog('image/*', (file) => {
    emit('upload-image', { scene: props.scene, file });
  });
};

const uploadVideo = () => {
  openFileDialog('video/*', (file) => {
    emit('upload-video', { scene: props.scene, file });
  });
};

const loadVideo = async () => {
  isVideoLoading.value = true;
  if (props.scene && props.scene.video) {
    try {
      const base64Data = await downloadFileAsBase64(props.scene.video);
      videoDataUrl.value = `data:video/mp4;base64,${base64Data}`;
    } catch (error) {
      console.error('Failed to load video:', error);
      videoDataUrl.value = null;
    } finally {
      isVideoLoading.value = false;
    }
  } else {
    videoDataUrl.value = null;
    isVideoLoading.value = false;
  }
};

const loadImage = async () => {
  isImageLoading.value = true;
  if (props.scene && props.scene.image) {
    try {
      if (typeof props.scene.image === 'string') {
        const base64Data = await downloadFileAsBase64(props.scene.image);
        imageDataUrl.value = `data:image/png;base64,${base64Data}`;
      } else if (
        typeof (props.scene.image as any).bytesBase64Encoded === 'string'
      ) {
        imageDataUrl.value = `data:image/png;base64,${(props.scene.image as any).bytesBase64Encoded}`;
      }
    } catch (error) {
      console.error('Failed to load image:', error);
      imageDataUrl.value = null;
    } finally {
      isImageLoading.value = false;
    }
  } else {
    imageDataUrl.value = null;
    isImageLoading.value = false;
  }
};

watch(
  () => props.scene,
  (newVal) => {
    editableScene.value = JSON.parse(JSON.stringify(newVal));
    loadImage();
    loadVideo();
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.character-info {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
}
.character-info strong {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}
.character-info p {
  margin: 0;
  color: var(--color-text-secondary);
}
h3 {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}
.media-container {
  display: flex;
  gap: var(--spacing-lg);
}

.media-container .form-group {
  flex: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  width: 80%;
  max-width: 1300px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.3s ease-out;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: var(--transition-smooth);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: #1a1a1a;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.modal-actions button {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.save-button {
  background-color: var(--color-accent);
  color: #ffffff;
  border: none;
}

.save-button:hover {
  background-color: var(--color-accent-hover);
}

.cancel-button {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.cancel-button:hover {
  background-color: var(--color-surface);
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 90%;
  }
}
</style>
