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
  <div class="searchable-select">
    <div v-if="multiple && modelValue" class="selected-options">
      <span v-for="value in modelValue" :key="value" class="selected-option">
        {{ getOptionLabel(value) }}
        <button @click="removeOption(value)">&times;</button>
      </span>
    </div>
    <input
      type="text"
      v-model="searchTerm"
      @input="filterOptions"
      @focus="showOptions = true"
      @blur="hideOptions"
      :placeholder="placeholder"
      class="form-control"
    />
    <ul v-if="showOptions && filteredOptions.length" class="options-list">
      <li
        v-for="option in filteredOptions"
        :key="option.value"
        @mousedown="selectOption(option)"
        :class="{ selected: isSelected(option) }"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface SelectOption {
  value: string;
  label: string;
}

const props = defineProps<{
  options?: SelectOption[];
  modelValue?: string | string[];
  placeholder?: string;
  multiple?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const searchTerm = ref('');
const showOptions = ref(false);

const getOptionLabel = (value: string) => {
  const option = props.options?.find((o) => o.value === value);
  return option ? option.label : '';
};

const removeOption = (value: string) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const newValue = props.modelValue.filter((v) => v !== value);
    emit('update:modelValue', newValue);
  }
};

watch(
  [() => props.modelValue, () => props.options],
  ([newModelValue, newOptions]) => {
    if (!props.multiple) {
      if (newOptions && typeof newModelValue === 'string') {
        const selectedOption = newOptions.find(
          (option) => option.value === newModelValue
        );
        if (selectedOption) {
          searchTerm.value = selectedOption.label;
        } else {
          searchTerm.value = '';
        }
      } else if (!newModelValue) {
        searchTerm.value = '';
      }
    }
  },
  { immediate: true }
);

const filteredOptions = computed(() => {
  if (!props.options) {
    return [];
  }
  if (!searchTerm.value) {
    return props.options;
  }
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const isSelected = (option: SelectOption) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(option.value);
  }
  return false;
};

const filterOptions = () => {
  // This is handled by the computed property
};

const selectOption = (option: SelectOption) => {
  if (props.multiple) {
    const newValue = Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : [];
    const index = newValue.indexOf(option.value);
    if (index > -1) {
      newValue.splice(index, 1);
    } else {
      newValue.push(option.value);
    }
    emit('update:modelValue', newValue);
    searchTerm.value = '';
  } else {
    searchTerm.value = option.label;
    emit('update:modelValue', option.value);
    showOptions.value = false;
  }
};

const hideOptions = () => {
  // Delay hiding to allow click event to register
  setTimeout(() => {
    showOptions.value = false;
  }, 200);
};
</script>

<style scoped>
.searchable-select {
  position: relative;
}

.selected-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.selected-option {
  background-color: var(--color-accent);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
}

.selected-option button {
  background: none;
  border: none;
  color: white;
  margin-left: 0.5rem;
  cursor: pointer;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  transition: var(--transition-smooth);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.1);
}

.options-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
}

.options-list li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: var(--color-text-primary);
}

.options-list li:hover {
  background-color: var(--color-accent-hover);
}

.options-list li.selected {
  background-color: var(--color-accent);
  color: white;
}
</style>
