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
  max-width: 700px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
  text-align: center;
}

textarea {
  width: 100%;
  height: 120px;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-primary);
  font-size: 1.1rem;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
  resize: none;
  transition: var(--transition-smooth);
  box-shadow: 0 0 0 3px transparent;
}

textarea::placeholder {
  color: var(--color-text-secondary);
}

textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 15px 5px rgba(var(--color-accent), 0.2);
  background-color: #2a2a2a;
}

button {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-md);
}

button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

button:disabled {
  background-color: var(--color-accent-disabled);
  cursor: not-allowed;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  display: inline-block;
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
