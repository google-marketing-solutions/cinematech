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
    <img
      v-if="character.image"
      :src="character.image"
      alt="Character Image"
      class="character-image"
    />
    <div class="character-info">
      <h3>{{ character.name }}</h3>
      <p>{{ character.description }}</p>
    </div>
    <button @click="$emit('edit')" class="edit-button">Edit</button>
  </div>
</template>

<script setup lang="ts">
import type { Character } from '@/types';

defineProps<{
  character: Character;
}>();

defineEmits<{
  (e: 'edit'): void;
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

.character-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto var(--spacing-md);
  border: 2px solid var(--color-border);
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
