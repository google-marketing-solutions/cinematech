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
      <h2>{{ title }}</h2>

      <div v-if="showModeSelector" class="mode-selector">
        <button
          :class="{ active: selectedMode === 'speech' }"
          @click="selectedMode = 'speech'"
        >
          🗣️ Speech (Gemini 2.5 TTS)
        </button>
        <button
          :class="{ active: selectedMode === 'music' }"
          @click="selectedMode = 'music'"
        >
          🎵 Music (Music Gen)
        </button>
      </div>

      <div
        v-if="selectedMode === 'speech' && showModeSelector"
        class="form-group"
      >
        <label for="voice-select">Voice</label>
        <select id="voice-select" v-model="selectedVoice">
          <option value="Puck">Puck</option>
          <option value="Charon">Charon</option>
          <option value="Kore">Kore</option>
          <option value="Fenrir">Fenrir</option>
          <option value="Aoede">Aoede</option>
        </select>
      </div>

      <div class="form-group">
        <label for="generation-prompt">{{ label }}</label>
        <textarea
          id="generation-prompt"
          v-model="prompt"
          :placeholder="placeholder"
          ref="promptInput"
          @keydown.enter.ctrl="submit"
        ></textarea>
        <div class="hint">Press Ctrl+Enter to generate</div>
      </div>

      <div class="modal-actions">
        <button
          @click="$emit('close')"
          class="cancel-button"
          :disabled="isGenerating"
        >
          Cancel
        </button>
        <button
          @click="submit"
          class="generate-button"
          :disabled="!prompt.trim() || isGenerating"
        >
          <span v-if="isGenerating" class="spinner">⏳</span>
          {{ isGenerating ? 'Generating...' : 'Generate' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  title: string;
  label: string;
  placeholder?: string;
  isGenerating?: boolean;
  showModeSelector?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (
    e: 'generate',
    payload: { prompt: string; mode?: 'speech' | 'music'; voice?: string }
  ): void;
}>();

const prompt = ref('');
const promptInput = ref<HTMLTextAreaElement | null>(null);
const selectedMode = ref<'speech' | 'music'>('speech');
const selectedVoice = ref('Puck');

const submit = () => {
  if (prompt.value.trim() && !props.isGenerating) {
    emit('generate', {
      prompt: prompt.value,
      mode: props.showModeSelector ? selectedMode.value : undefined,
      voice:
        props.showModeSelector && selectedMode.value === 'speech'
          ? selectedVoice.value
          : undefined,
    });
  }
};

onMounted(() => {
  promptInput.value?.focus();
});
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.2s ease-out;
}

h2 {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.mode-selector {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-background);
  padding: 4px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.mode-selector button {
  flex: 1;
  padding: var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.mode-selector button.active {
  background: var(--color-surface);
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

textarea,
select {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

select {
  min-height: auto;
  cursor: pointer;
}

textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
}

textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.hint {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: right;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

button {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-button {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.cancel-button:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.generate-button {
  background: var(--color-accent);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.generate-button:not(:disabled):hover {
  filter: brightness(1.1);
}

.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
