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
  <div>
    <label>Characters</label>
    <div class="characters-container">
      <CharacterCard
        v-for="character in characters"
        :key="character.characterId"
        :character="character"
        @edit="$emit('edit', character.characterId)"
        @generate="$emit('generate', character)"
        @delete-image="$emit('delete-image', character)"
        @upload="$emit('upload', character)"
      />
    </div>
    <button @click="$emit('add')" class="plus-button">+</button>
  </div>
</template>

<script setup lang="ts">
import CharacterCard from './CharacterCard.vue';
import type { Character } from '@/types';

defineProps<{
  characters: Character[];
}>();

defineEmits<{
  (e: 'edit', characterId: string): void;
  (e: 'add'): void;
  (e: 'generate', character: Character): void;
  (e: 'delete-image', character: Character): void;
  (e: 'upload', character: Character): void;
}>();
</script>

<style scoped>
.characters-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.plus-button {
  width: 50px;
  height: 50px;
  font-size: 2rem;
  line-height: 46px;
  padding: 0;
  margin-top: var(--spacing-md);
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 2px dashed var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.plus-button:hover {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
  transform: scale(1.1) rotate(90deg);
}
</style>
