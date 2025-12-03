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
  <div class="scenes-page">
    <div class="scenes-container">
      <div class="title-container">
        <h1>Scenes</h1>
        <button
          @click="handleCreateVideo"
          class="btn-create-video"
          :disabled="storyStore.loading"
        >
          {{ storyStore.loading ? 'Creating...' : 'Connect Scenes' }}
        </button>
      </div>
      <div v-if="storyStore.loading" class="loading-container">
        <p>Loading scenes...</p>
      </div>
      <div v-else class="scenes-grid">
        <SceneCard
          v-for="(scene, index) in storyStore.scenes"
          :key="scene.id"
          :scene="scene"
          :index="index"
          :type="scene.type || 'default'"
          draggable="true"
          :class="{ 'is-dragging': index === draggedIndex }"
          @dragstart="onDragStart(index, $event)"
          @dragover="onDragOver($event)"
          @drop="onDrop(index, $event)"
          @dragend="onDragEnd"
          @edit="storyStore.showEditModal"
          @delete="storyStore.deleteScene"
          @generate-video="storyStore.generateVideoForScene"
          @generate-image="storyStore.generateImageForScene"
          @use-last-frame="storyStore.useLastFrameAsImage"
          @upload-image="
            ({ scene, file }: { scene: Scene; file: File }) =>
              storyStore.uploadMediaForScene(scene, file, 'image')
          "
          @upload-video="
            ({ scene, file }: { scene: Scene; file: File }) =>
              storyStore.uploadMediaForScene(scene, file, 'video')
          "
          @delete-media="
            ({
              sceneId,
              mediaType,
            }: {
              sceneId: number;
              mediaType: 'image' | 'video' | 'lastFrame';
            }) => storyStore.deleteSceneMedia(sceneId, mediaType)
          "
          @cancel-video-generation="storyStore.cancelVideoGeneration"
          @cancel-image-generation="storyStore.cancelImageGeneration"
          @upscale-image="storyStore.upscaleImageForScene"
          @update-scene-image="handleUpdateSceneImage"
          @update-scene-last-frame="handleUpdateSceneLastFrame"
          @update-scene-duration="
            ({ scene, duration }: { scene: Scene; duration: string }) =>
              storyStore.updateSceneDuration(scene, duration)
          "
          @update-scene-type="
            ({
              scene,
              type,
            }: {
              scene: Scene;
              type: 'default' | 'first-to-last';
            }) => storyStore.updateSceneType(scene, type)
          "
          @upload-last-frame="
            ({ scene, file }: { scene: Scene; file: File }) =>
              storyStore.uploadMediaForScene(scene, file, 'lastFrame')
          "
        />
        <button @click="storyStore.addScene" class="add-scene-btn">+</button>
      </div>
    </div>
    <EditSceneModal
      v-if="storyStore.isEditModalVisible"
      :scene="storyStore.currentScene!"
      @close="storyStore.hideEditModal"
      @save="handleSaveScene"
      @generate-video="storyStore.generateVideoForScene"
      @generate-image="storyStore.generateImageForScene"
      @upload-image="
        ({ scene, file }: { scene: Scene; file: File }) =>
          storyStore.uploadMediaForScene(scene, file, 'image')
      "
      @upload-video="
        ({ scene, file }: { scene: Scene; file: File }) =>
          storyStore.uploadMediaForScene(scene, file, 'video')
      "
      @delete-media="
        ({
          sceneId,
          mediaType,
        }: {
          sceneId: number;
          mediaType: 'image' | 'video' | 'lastFrame';
        }) => storyStore.deleteSceneMedia(sceneId, mediaType)
      "
      @cancel-video-generation="storyStore.cancelVideoGeneration"
      @cancel-image-generation="storyStore.cancelImageGeneration"
    />
  </div>
</template>

<script setup lang="ts">
import { useStoryStore } from '@/stores/story.ts';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import SceneCard from '@/components/SceneCard.vue';
import EditSceneModal from '@/components/EditSceneModal.vue';
import type { Scene } from '@/types';

const storyStore = useStoryStore();
const router = useRouter();

const handleSaveScene = (updatedScene: Scene) => {
  storyStore.updateScene(updatedScene);
  storyStore.hideEditModal();
};

const handleUpdateSceneImage = ({
  scene,
  imageUrl,
}: {
  scene: Scene;
  imageUrl: string;
}) => {
  storyStore.updateSceneImage(scene, imageUrl);
};

const handleUpdateSceneLastFrame = ({
  scene,
  imageUrl,
}: {
  scene: Scene;
  imageUrl: string;
}) => {
  storyStore.updateSceneLastFrame(scene, imageUrl);
};

const handleCreateVideo = async () => {
  const gcsUri = await storyStore.createFinalVideo();
  if (gcsUri) {
    router.push('/video');
  }
};

const draggedIndex = ref<number | null>(null);

const onDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    // Optional: Set drag image or style
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault(); // Necessary to allow dropping
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDrop = (index: number, event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex) && fromIndex !== index) {
      storyStore.reorderScenes(fromIndex, index);
    }
  }
  draggedIndex.value = null;
};

const onDragEnd = () => {
  draggedIndex.value = null;
};
</script>

<style scoped>
.is-dragging {
  opacity: 0.5;
  border: 2px dashed var(--color-accent);
}

.scenes-page {
  min-height: 100vh;
  background: var(--color-background);
  font-family: 'Montserrat', sans-serif;
  color: var(--vt-c-white);
  padding-top: 80px; /* Space for the header */
}

.scenes-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.title-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-create-video {
  background-color: var(--color-accent); /* Brighter orange */
  color: var(--vt-c-white);
  padding: 15px 30px; /* Larger padding */
  border-radius: 8px; /* Slightly more rounded corners */
  text-decoration: none;
  font-weight: 700;
  font-size: 1.2rem; /* Larger font size */
  margin-top: 1.5rem; /* More space from the title */
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-create-video:hover {
  background-color: var(--color-accent-hover); /* Lighter orange on hover */
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.5rem;
}

h1 {
  font-size: 4rem;
  font-weight: 700;
  animation: fadeIn 1s ease-in-out;
  text-align: center;
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
  width: 100%;
  animation: fadeIn 0.8s ease-out;
}

.add-scene-btn {
  background-color: transparent;
  border: 2px dashed var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  height: 100%;
  font-size: 3rem;
  font-weight: 300;
  cursor: pointer;
  transition: var(--transition-smooth);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
}

.add-scene-btn:hover {
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--color-accent);
  border-color: var(--color-accent);
}
</style>
