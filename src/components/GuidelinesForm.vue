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
  <div class="form-container">
    <div class="form-group">
      <label for="summary">Ad Summary</label>
      <textarea
        id="summary"
        :value="summary"
        @input="
          $emit('update:summary', ($event.target as HTMLTextAreaElement).value)
        "
        placeholder="A brief summary of the ad..."
      ></textarea>
    </div>
    <div class="form-group">
      <label for="writing-style">Writing Style</label>
      <textarea
        id="writing-style"
        :value="writingStyle"
        @input="
          $emit(
            'update:writingStyle',
            ($event.target as HTMLTextAreaElement).value
          )
        "
        placeholder="Describe the writing style (e.g., gritty, poetic, humorous)..."
      ></textarea>
    </div>
    <div class="form-group">
      <label for="visual-style">Visual Style</label>
      <textarea
        id="visual-style"
        :value="visualStyle"
        @input="
          $emit(
            'update:visualStyle',
            ($event.target as HTMLTextAreaElement).value
          )
        "
        placeholder="Describe the visual style (e.g., cinematic, documentary, found footage)..."
      ></textarea>
    </div>
    <CharacterList
      :characters="characters || []"
      @edit="$emit('edit-character', $event)"
      @add="$emit('add-character')"
    />
    <button @click="$emit('save')">Save Guidelines</button>
  </div>
</template>

<script setup lang="ts">
import CharacterList from './CharacterList.vue';
import type { Character } from '@/types';

defineProps<{
  summary?: string;
  writingStyle?: string;
  visualStyle?: string;
  characters?: Character[];
}>();

defineEmits<{
  (e: 'update:summary', value: string): void;
  (e: 'update:writingStyle', value: string): void;
  (e: 'update:visualStyle', value: string): void;
  (e: 'edit-character', characterId: number): void;
  (e: 'add-character'): void;
  (e: 'save'): void;
}>();
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
}

.form-group {
  margin-bottom: var(--spacing-lg);
  text-align: left;
}

label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

textarea,
input[type='text'] {
  width: 100%;
  padding: var(--spacing-md);
  font-family: var(--font-primary);
  font-size: 1rem;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: var(--transition-smooth);
}

textarea::placeholder,
input[type='text']::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

textarea:focus,
input[type='text']:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: #2a2a2a;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

button {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-md);
  margin-top: var(--spacing-md);
}

button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
