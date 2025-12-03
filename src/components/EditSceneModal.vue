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

      <div v-if="props.scene.isRegenerating" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner-large"></div>
          <p>Regenerating Scene...</p>
        </div>
      </div>

      <div
        class="media-container"
        :class="{ 'blur-content': props.scene.isRegenerating }"
      >
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
            @cancel="cancelImageGeneration"
          />
        </div>
        <div class="form-group">
          <label for="edit-video">Video</label>
          <MediaSlot
            media-type="video"
            :data-url="videoDataUrl"
            :is-generating="isVideoLoading"
            :scene-id="scene.id"
            :duration-seconds="editableScene.durationSeconds"
            :image-to-video="imageToVideo"
            @generate="generateVideo"
            @upload="uploadVideo"
            @delete="deleteMedia('video')"
            @image-to-video-change="onImageToVideoChange"
            @cancel="cancelVideoGeneration"
            @update:durationSeconds="(d) => (editableScene.durationSeconds = d)"
          />
        </div>
      </div>
      <div class="form-group">
        <label for="edit-background">Background</label>
        <textarea
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

      <h3>Scene Details</h3>
      <div class="form-group">
        <label for="edit-subject">Subject</label>
        <textarea
          id="edit-subject"
          v-model="editableScene.subject"
          placeholder="Detailed description of the main subject(s)"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-action">Action</label>
        <textarea
          id="edit-action"
          v-model="editableScene.action"
          placeholder="Specific action occurring in the scene"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-environment">Environment</label>
        <textarea
          id="edit-environment"
          v-model="editableScene.environment"
          placeholder="Detailed setting/background description"
        ></textarea>
      </div>

      <h3>Camera Control</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-camera-angle">Angle</label>
          <input
            type="text"
            id="edit-camera-angle"
            v-model="editableScene.camera.angle"
            placeholder="e.g., Low angle, Eye-level"
          />
        </div>
        <div class="form-group">
          <label for="edit-camera-movement">Movement</label>
          <input
            type="text"
            id="edit-camera-movement"
            v-model="editableScene.camera.movement"
            placeholder="e.g., Pan right, Tracking shot"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-camera-type">Type</label>
          <input
            type="text"
            id="edit-camera-type"
            v-model="editableScene.camera.type"
            placeholder="e.g., Drone, Handheld"
          />
        </div>
        <div class="form-group">
          <label for="edit-camera-lens">Lens</label>
          <input
            type="text"
            id="edit-camera-lens"
            v-model="editableScene.camera.lens"
            placeholder="e.g., Wide angle, Telephoto"
          />
        </div>
      </div>

      <h3>Audio</h3>
      <div class="form-group">
        <label for="edit-audio-dialogue">Dialogue</label>
        <textarea
          id="edit-audio-dialogue"
          v-model="editableScene.audio.dialogue"
          placeholder="Specific dialogue spoken by characters"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-audio-ambient">Ambient</label>
        <input
          type="text"
          id="edit-audio-ambient"
          v-model="editableScene.audio.ambient"
          placeholder="e.g., City traffic, Birds chirping"
        />
      </div>
      <div class="form-group">
        <label for="edit-audio-music">Music</label>
        <input
          type="text"
          id="edit-audio-music"
          v-model="editableScene.audio.music"
          placeholder="e.g., Upbeat electronic, Somber piano"
        />
      </div>
      <div class="form-group">
        <label for="edit-audio-sfx">Sound Effects</label>
        <input
          type="text"
          id="edit-audio-sfx"
          v-model="editableScene.audio.soundEffects"
          placeholder="e.g., Footsteps, Glass breaking"
        />
      </div>

      <h3>Visual Style</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-style-art">Art Style</label>
          <input
            type="text"
            id="edit-style-art"
            v-model="editableScene.style.artStyle"
            placeholder="e.g., Photorealistic, Cinematic"
          />
        </div>
        <div class="form-group">
          <label for="edit-style-lighting">Lighting</label>
          <input
            type="text"
            id="edit-style-lighting"
            v-model="editableScene.style.lighting"
            placeholder="e.g., Golden hour, Neon"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-style-color">Color Palette</label>
          <input
            type="text"
            id="edit-style-color"
            v-model="editableScene.style.colorPalette"
            placeholder="e.g., Vibrant, Monochrome"
          />
        </div>
        <div class="form-group">
          <label for="edit-style-mood">Mood</label>
          <input
            type="text"
            id="edit-style-mood"
            v-model="editableScene.style.mood"
            placeholder="e.g., Joyful, Tense"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="edit-negative-prompt">Negative Prompt</label>
        <input
          type="text"
          id="edit-negative-prompt"
          v-model="editableScene.negativePrompt"
          placeholder="Elements to exclude"
        />
      </div>

      <h3>Characters</h3>
      <div class="character-selection">
        <div
          v-for="char in allCharacters"
          :key="char.characterId"
          class="character-checkbox"
          :class="{ selected: selectedCharacterIds.includes(char.characterId) }"
          @click="toggleCharacterSelection(char.characterId)"
        >
          <div class="character-details">
            <span class="character-name">{{ char.name }}</span>
            <span class="character-role"
              >{{ char.description.substring(0, 50) }}...</span
            >
          </div>
          <div class="checkbox-indicator">
            <span v-if="selectedCharacterIds.includes(char.characterId)"
              >✓</span
            >
          </div>
        </div>
      </div>

      <div class="regenerate-section">
        <div v-if="!isRegenerationInputVisible" class="regenerate-controls">
          <button
            @click="showRegenerationInput"
            class="regenerate-button"
            :disabled="props.scene.isRegenerating"
          >
            <span v-if="props.scene.isRegenerating" class="spinner"></span>
            {{
              props.scene.isRegenerating
                ? 'Regenerating Scene...'
                : '✨ Regenerate Scene'
            }}
          </button>
          <p v-if="props.scene.isRegenerating" class="regenerate-status">
            AI is rewriting the scene with selected characters...
          </p>
        </div>

        <div v-else class="regenerate-input-container">
          <label for="regeneration-prompt"
            >Instructions for regeneration (optional):</label
          >
          <textarea
            id="regeneration-prompt"
            v-model="regenerationPrompt"
            placeholder="e.g., Change the setting to a futuristic city, make the mood more intense..."
            rows="3"
          ></textarea>
          <div class="regenerate-actions">
            <button
              @click="cancelRegenerationInput"
              class="cancel-button-small"
            >
              Cancel
            </button>
            <button @click="confirmRegeneration" class="confirm-button">
              ✨ Confirm & Regenerate
            </button>
          </div>
        </div>
      </div>

      <div
        class="modal-actions"
        :class="{ 'blur-content': props.scene.isRegenerating }"
      >
        <button @click="$emit('close')" class="cancel-button">Cancel</button>
        <button @click="save" class="save-button">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { downloadFileAsBase64 } from '@/services/gcp/gcs';
import MediaSlot from './MediaSlot.vue';
import type { Scene } from '@/types';
import { useStoryStore } from '@/stores/story';

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
  (e: 'cancel-video-generation', sceneId: number): void;
  (e: 'cancel-image-generation', sceneId: number): void;
}>();

const storyStore = useStoryStore();
const editableScene = ref<Scene>(JSON.parse(JSON.stringify(props.scene)));
const imageDataUrl = ref<string | null>(null);
const videoDataUrl = ref<string | null>(null);
const isImageLoading = ref(true);
const isVideoLoading = ref(true);
const imageToVideo = ref(false);
const selectedCharacterIds = ref<string[]>([]);

const allCharacters = computed(() => storyStore.characters);

const toggleCharacterSelection = (characterId: string) => {
  const index = selectedCharacterIds.value.indexOf(characterId);
  if (index === -1) {
    selectedCharacterIds.value.push(characterId);
  } else {
    selectedCharacterIds.value.splice(index, 1);
  }
};

const regenerationPrompt = ref('');
const isRegenerationInputVisible = ref(false);

const showRegenerationInput = () => {
  isRegenerationInputVisible.value = true;
};

const cancelRegenerationInput = () => {
  isRegenerationInputVisible.value = false;
  regenerationPrompt.value = '';
};

const confirmRegeneration = async () => {
  if (props.scene.isRegenerating) return;
  isRegenerationInputVisible.value = false;
  await storyStore.regenerateScene(
    props.scene.id,
    selectedCharacterIds.value,
    regenerationPrompt.value
  );
  regenerationPrompt.value = '';
};

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
    ...editableScene.value,
    imageToVideo: imageToVideo.value,
  });
};

const generateImage = () => {
  emit('generate-image', props.scene);
};

const cancelVideoGeneration = () => {
  emit('cancel-video-generation', props.scene.id);
};

const cancelImageGeneration = () => {
  emit('cancel-image-generation', props.scene.id);
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
    const sceneCopy = JSON.parse(JSON.stringify(newVal));

    // Ensure new structured fields exist
    if (!sceneCopy.camera)
      sceneCopy.camera = { angle: '', movement: '', type: '' };
    if (!sceneCopy.audio)
      sceneCopy.audio = {
        dialogue: '',
        ambient: '',
        music: '',
        soundEffects: '',
      };
    // Fallback to script if dialogue is empty
    if (!sceneCopy.audio.dialogue && sceneCopy.script) {
      sceneCopy.audio.dialogue = sceneCopy.script;
    }
    if (!sceneCopy.style)
      sceneCopy.style = {
        artStyle: '',
        lighting: '',
        colorPalette: '',
        mood: '',
      };
    if (!sceneCopy.subject) sceneCopy.subject = '';
    if (!sceneCopy.action) sceneCopy.action = '';
    if (!sceneCopy.environment) sceneCopy.environment = '';
    if (!sceneCopy.negativePrompt) sceneCopy.negativePrompt = '';
    if (!sceneCopy.durationSeconds) sceneCopy.durationSeconds = '8';

    editableScene.value = sceneCopy;

    // Update selected characters based on scene characters
    selectedCharacterIds.value = sceneCopy.characters
      .map((c: any) => c.characterId)
      .filter(Boolean);

    loadImage();
    loadVideo();
  },
  { deep: true, immediate: true }
);

watch(
  () => props.scene.image,
  (newImage, oldImage) => {
    // If image was added (or present on mount), check imageToVideo
    if (newImage && !oldImage) {
      imageToVideo.value = true;
    }
    // If image was removed, uncheck imageToVideo
    else if (!newImage && oldImage) {
      imageToVideo.value = false;
    }
    // If image exists and hasn't changed, preserve current imageToVideo state
    // If this is immediate run (oldImage undefined) and newImage exists, it sets to true.
  },
  { immediate: true }
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

.form-row {
  display: flex;
  gap: var(--spacing-md);
}

.form-row .form-group {
  flex: 1;
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

.character-selection {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.character-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.character-checkbox:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.character-checkbox.selected {
  border-color: var(--color-accent);
  background: rgba(228, 0, 124, 0.1); /* Accent color with opacity */
}

.character-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.character-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.character-role {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkbox-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  font-weight: bold;
  font-size: 12px;
  transition: var(--transition-fast);
}

.character-checkbox.selected .checkbox-indicator {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
}

.regenerate-section {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.regenerate-button {
  background-color: var(--color-accent);
  color: white;
  padding: var(--spacing-sm) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: var(--transition-smooth);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
}

.regenerate-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.regenerate-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: var(--color-border);
}

.regenerate-status {
  font-size: 0.9rem;
  color: var(--color-accent);
  font-weight: 500;
  animation: pulse 2s infinite;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--border-radius-lg);
}

.regenerate-input-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  animation: fadeIn 0.3s ease-out;
}

.regenerate-input-container label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.regenerate-input-container textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-size: 1rem;
  resize: vertical;
}

.regenerate-input-container textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.regenerate-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.confirm-button {
  background-color: var(--color-accent);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--transition-smooth);
}

.confirm-button:hover {
  background-color: var(--color-accent-hover);
}

.cancel-button-small {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition-smooth);
}

.cancel-button-small:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}

.loading-content {
  background: var(--color-surface);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(228, 0, 124, 0.3);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
