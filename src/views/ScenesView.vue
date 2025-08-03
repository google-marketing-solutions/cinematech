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
          {{ storyStore.loading ? 'Creating...' : 'Create Video' }}
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
              mediaType: 'image' | 'video';
            }) => storyStore.deleteSceneMedia(sceneId, mediaType)
          "
          @cancel-video-generation="storyStore.cancelVideoGeneration"
          @upscale-image="storyStore.upscaleImageForScene"
        />
        <button @click="storyStore.addScene" class="add-scene-btn">+</button>
      </div>
    </div>
    <EditSceneModal
      v-if="storyStore.isEditModalVisible"
      :scene="storyStore.currentScene!"
      @close="storyStore.hideEditModal"
      @save="handleSaveScene"
    />
  </div>
</template>

<script setup lang="ts">
import { useStoryStore } from '@/stores/story.ts';
import { useRouter } from 'vue-router';
import SceneCard from '@/components/SceneCard.vue';
import EditSceneModal from '@/components/EditSceneModal.vue';
import type { Scene } from '@/types';

const storyStore = useStoryStore();
const router = useRouter();

const handleSaveScene = (updatedScene: Scene) => {
  storyStore.updateScene(updatedScene);
  storyStore.hideEditModal();
};

const handleCreateVideo = async () => {
  const gcsUri = await storyStore.createFinalVideo();
  if (gcsUri) {
    router.push('/video');
  }
};
</script>

<style scoped>
.scenes-page {
  min-height: 100vh;
  background: linear-gradient(
    to right,
    var(--color-primary),
    var(--color-secondary)
  );
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
