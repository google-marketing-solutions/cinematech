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
      <h2>Edit Character</h2>
      <div class="form-group">
        <label for="edit-name">Name</label>
        <input type="text" id="edit-name" v-model="editableCharacter.name" />
      </div>
      <div class="form-group">
        <label for="edit-id">Character ID</label>
        <input
          type="text"
          id="edit-id"
          v-model="editableCharacter.characterId"
          disabled
        />
      </div>
      <div class="form-group">
        <label for="edit-age">Age</label>
        <input type="text" id="edit-age" v-model="editableCharacter.age" />
      </div>
      <div class="form-group">
        <label for="edit-gender">Gender</label>
        <input
          type="text"
          id="edit-gender"
          v-model="editableCharacter.gender"
        />
      </div>
      <div class="form-group">
        <label for="edit-skin">Skin</label>
        <textarea id="edit-skin" v-model="editableCharacter.skin"></textarea>
      </div>
      <div class="form-group">
        <label for="edit-eye-description">Eye Description</label>
        <textarea
          id="edit-eye-description"
          v-model="editableCharacter.eyeDescription"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-hair-description">Hair Description</label>
        <textarea
          id="edit-hair-description"
          v-model="editableCharacter.hairDescription"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-body-description">Body Description</label>
        <textarea
          id="edit-body-description"
          v-model="editableCharacter.bodyDescription"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-clothes">Clothes</label>
        <textarea
          id="edit-clothes"
          v-model="editableCharacter.clothes"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-description">Description</label>
        <textarea
          id="edit-description"
          v-model="editableCharacter.description"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="edit-voice">Voice</label>
        <input type="text" id="edit-voice" v-model="editableCharacter.voice" />
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
import type { Character } from '@/types';

const props = defineProps<{
  character: Character;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', character: Character): void;
}>();

const editableCharacter = ref<Character>({ ...props.character });

watch(
  () => props.character,
  (newVal) => {
    editableCharacter.value = { ...newVal };
  }
);

const save = () => {
  emit('save', editableCharacter.value);
};
</script>

<style scoped>
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
  width: 90%;
  max-width: 600px;
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
  min-height: 80px;
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
</style>
