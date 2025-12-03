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
    <textarea
      :value="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
      placeholder="e.g., A lone gunslinger in a futuristic city..."
    ></textarea>
    <button @click="handleCreate" :disabled="loading">
      <span v-if="loading" class="spinner"></span>
      <span v-else>Create Ad</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'create'): void;
}>();

const handleCreate = () => {
  emit('create');
};
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
  text-align: center;
}

textarea {
  width: 100%;
  height: 300px;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-primary);
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-xl);
  resize: vertical;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

textarea::placeholder {
  color: var(--color-text-secondary);
}

textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-background);
  box-shadow: 0 0 0 2px rgba(228, 0, 124, 0.2);
}

button {
  padding: var(--spacing-md) 4rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--color-accent);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-md);
  text-transform: uppercase;
  letter-spacing: 1px;
}

button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:active {
  transform: translateY(1px);
}

button:disabled {
  background: var(--color-surface-variant);
  color: var(--color-text-disabled);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid #fff;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
