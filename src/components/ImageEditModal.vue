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
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button @click="close" class="close-btn">×</button>
      <h2>Edit Image</h2>
      <div class="chat-interface">
        <div class="messages-container">
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <button @click="cancelGeneration" class="cancel-gen-btn">
              Cancel
            </button>
          </div>
          <div v-else-if="displayImageUrl" class="image-wrapper">
            <img
              :src="displayImageUrl"
              alt="Editing image"
              class="editing-image"
            />
            <div v-if="displayImageUrl !== imageUrl" class="actions-container">
              <button @click="saveImage" class="action-btn save-btn">
                Save
              </button>
              <button @click="revertImage" class="action-btn cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div
          class="drop-zone"
          :class="{ 'drag-over': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="thumbnails-container">
            <div
              v-for="(image, index) in uploadedImages"
              :key="index"
              class="thumbnail"
            >
              <img :src="image" />
            </div>
          </div>
          <div class="input-container">
            <button
              @click="triggerFileInput"
              class="upload-btn"
              v-tooltip="'Upload Image'"
            >
              <span class="mdi mdi-upload"></span>
            </button>
            <input
              ref="fileInput"
              type="file"
              @change="handleFileUpload"
              multiple
              accept="image/*"
              style="display: none"
            />
            <input
              v-model="prompt"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Type your message..."
            />
            <button @click="sendMessage">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { generateImageFromContent } from '@/services/gcp/vertex';
import type { Content } from '@/types';

const props = defineProps<{
  show: boolean;
  imageUrl?: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', imageUrl: string | null): void;
}>();

const close = () => emit('close');

const saveImage = () => {
  emit('save', displayImageUrl.value);
  close();
};

const revertImage = () => {
  displayImageUrl.value = props.imageUrl ?? null;
};

const displayImageUrl = ref<string | null>(null);
const isLoading = ref(false);
const uploadedImages = ref<string[]>([]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const prompt = ref('');
const abortController = ref<AbortController | null>(null);

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.imageUrl) {
      displayImageUrl.value = props.imageUrl;
    } else {
      displayImageUrl.value = null;
    }
    uploadedImages.value = [];
    prompt.value = '';
  }
);

const handleFileUpload = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files) {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          uploadedImages.value.push(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          uploadedImages.value.push(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const sendMessage = async () => {
  if (!prompt.value.trim() && uploadedImages.value.length === 0) return;

  isLoading.value = true;
  abortController.value = new AbortController();

  const userParts: any[] = [];
  if (displayImageUrl.value) {
    userParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: displayImageUrl.value.split(',')[1],
      },
    });
  }
  if (prompt.value.trim()) {
    userParts.push({ text: prompt.value });
  }
  for (const image of uploadedImages.value) {
    userParts.push({
      inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] },
    });
  }

  const contents: Content[] = [{ role: 'user', parts: userParts }];

  prompt.value = '';
  uploadedImages.value = [];

  try {
    const response = await generateImageFromContent(
      contents,
      abortController.value.signal
    );
    const newImage = response.candidates[0].content.parts.findLast(
      (part: any) => part.inlineData
    ).inlineData.data;
    displayImageUrl.value = `data:image/jpeg;base64,${newImage}`;
  } catch (error) {
    console.error('Error generating image:', error);
    // Handle error state in UI
  } finally {
    isLoading.value = false;
    abortController.value = null;
  }
};

const cancelGeneration = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
    isLoading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #222;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  height: 80%;
  display: flex;
  flex-direction: column;
}

.chat-interface {
  flex-grow: 1;
  background-color: #333;
  border-radius: 4px;
  padding: 10px;
  color: white;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.editing-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  min-height: 0;
}

.input-container {
  display: flex;
}

.input-container input {
  flex-grow: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #444;
  color: white;
}

.input-container button {
  margin-left: 10px;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: var(--color-accent);
  color: white;
  cursor: pointer;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
}

.drop-zone {
  border: 2px dashed #555;
  border-radius: 4px;
  padding: 10px;
  transition: border-color 0.3s;
}

.drop-zone.drag-over {
  border-color: var(--color-accent);
}

.thumbnails-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 60px;
  height: 60px;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.upload-btn {
  margin-right: 10px;
  padding: 8px;
  border-radius: 4px;
  border: none;
  background-color: #555;
  color: white;
  cursor: pointer;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  align-self: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.cancel-gen-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-gen-btn:hover {
  background-color: #5a6268;
}

.image-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.actions-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 8px;
  border-radius: 8px;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.save-btn {
  background-color: var(--color-accent);
}

.save-btn:hover {
  background-color: var(--color-accent-hover);
}

.cancel-btn {
  background-color: #6c757d;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style>
