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
  <header class="editor-header">
    <div class="info-right">
      <button class="export-btn" @click="handleExport" :disabled="isExporting">
        {{ isExporting ? 'Exporting...' : 'Export Video' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
// import { useProjectStore } from '@/stores/project';
import { useEditorStore } from '@/stores/editor';

// const projectStore = useProjectStore();
const editorStore = useEditorStore();
// const projectName = computed(() => projectStore.currentProjectId || 'Untitled Project');
const isExporting = computed(() => editorStore.isExporting);

const router = useRouter();

const handleExport = async () => {
  try {
    await editorStore.exportVideo();
    router.push('/export');
  } catch (e) {
    alert('Export failed. See console for details.');
  }
};
</script>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  height: 36px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-primary);
}

.menu-left {
  display: flex;
  gap: var(--spacing-md);
}

.menu-item {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.info-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.project-name {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.user-badge {
  display: flex;
  align-items: center;
}

.avatar {
  width: 24px;
  height: 24px;
  background-color: var(--color-accent);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.export-btn {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background-color: var(--color-accent-hover);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
