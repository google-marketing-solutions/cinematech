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
  <div class="guidelines-container">
    <h1 class="title">Story Guidelines</h1>
    <p class="subtitle">Define the heart and soul of your story</p>
    <div v-if="loading" class="loading-container">
      <p>Loading guidelines...</p>
    </div>
    <GuidelinesForm
      v-else
      :summary="summary"
      :writing-style="writingStyle"
      :visual-style="visualStyle"
      :resolution="resolution"
      :aspect-ratio="aspectRatio"
      @update:summary="updateSummary"
      @update:writing-style="updateWritingStyle"
      @update:visual-style="updateVisualStyle"
      @update:resolution="updateResolution"
      @update:aspect-ratio="updateAspectRatio"
      :characters="characters"
      @save="saveGuidelines"
      @add-character="addCharacter"
      @edit-character="openEditModal"
      @generate-character="generateCharacterImage"
      @delete-character-image="deleteCharacterImage"
      @upload-character-image="uploadCharacterImage"
    />

    <EditCharacterModal
      v-if="isModalOpen"
      :character="editableCharacter!"
      @close="closeModal"
      @save="saveCharacter"
      @generate="generateCharacterImage(editableCharacter!)"
      @delete-image="deleteCharacterImage(editableCharacter!)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStoryStore } from '@/stores/story.ts';
import GuidelinesForm from '@/components/GuidelinesForm.vue';
import EditCharacterModal from '@/components/EditCharacterModal.vue';
import { useRouter } from 'vue-router';
import type { Character } from '@/types';

const storyStore = useStoryStore();
const router = useRouter();

const summary = computed(() => storyStore.summary);
const writingStyle = computed(() => storyStore.writingStyle);
const visualStyle = computed(() => storyStore.visualStyle);
const characters = computed(() => storyStore.characters);
const resolution = computed(() => storyStore.resolution);
const aspectRatio = computed(() => storyStore.aspectRatio);
const loading = computed(() => storyStore.loading);

const isModalOpen = ref(false);
const editableCharacter = ref<Character | null>(null);

const updateSummary = (value: string) => {
  storyStore.setSummary(value);
};

const updateWritingStyle = (value: string) => {
  storyStore.setWritingStyle(value);
};

const updateVisualStyle = (value: string) => {
  storyStore.setVisualStyle(value);
};

const updateResolution = (value: '720p' | '1080p') => {
  storyStore.setResolution(value);
};

const updateAspectRatio = (value: '16:9' | '9:16') => {
  storyStore.setAspectRatio(value);
};

const saveGuidelines = async () => {
  router.push({ name: 'scenes' });
  await storyStore.createScenes();
};

const addCharacter = () => {
  storyStore.addCharacter();
};

const openEditModal = (characterId: string) => {
  editableCharacter.value = {
    ...storyStore.characters.find(
      (c: Character) => c.characterId === characterId
    )!,
  };
  isModalOpen.value = true;
};

const saveCharacter = (character: Character) => {
  storyStore.updateCharacter(character);
  closeModal();
};

const generateCharacterImage = (character: Character) => {
  storyStore.generateCharacterImage(character);
};

const deleteCharacterImage = (character: Character) => {
  storyStore.deleteCharacterImage(character);
};

const uploadCharacterImage = (character: Character) => {
  storyStore.uploadCharacterImage(character);
};

const closeModal = () => {
  isModalOpen.value = false;
  editableCharacter.value = null;
};
</script>

<style scoped>
.guidelines-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background: linear-gradient(
    to right,
    var(--color-primary),
    var(--color-secondary)
  );
  font-family: 'Montserrat', sans-serif;
  color: var(--vt-c-white);
  text-align: center;
  padding: 80px 20px 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.5rem;
}

.title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1rem;
  animation: fadeIn 1s ease-in-out;
}

.subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  animation: fadeIn 1s ease-in-out 0.5s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
