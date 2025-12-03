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
  <div
    class="file-node"
    :class="{ 'is-folder': node.type === 'folder', 'is-active': isActive }"
    @click="$emit('click', node)"
  >
    <div class="icon">
      <i v-if="node.type === 'folder'" class="mdi mdi-folder"></i>
      <i v-else-if="isImage" class="mdi mdi-image"></i>
      <i v-else-if="isVideo" class="mdi mdi-video"></i>
      <i v-else class="mdi mdi-file"></i>
    </div>
    <div class="name">{{ node.name }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FileSystemNode } from '@/types';

const props = defineProps<{
  node: FileSystemNode;
  isActive?: boolean;
}>();

defineEmits<{
  (e: 'click', node: FileSystemNode): void;
}>();

const isImage = computed(() => {
  return props.node.mimeType?.startsWith('image/');
});

const isVideo = computed(() => {
  return props.node.mimeType?.startsWith('video/');
});
</script>

<style scoped>
.file-node {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.file-node:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.file-node.is-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  font-weight: 500;
}

.icon {
  margin-right: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.is-folder .icon {
  color: #fbbf24; /* Amber-400 */
}

.name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
