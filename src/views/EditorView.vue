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
  <div class="editor-view">
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading project assets...</p>
    </div>
    <EditorShell :key="projectStore.currentProjectId ?? undefined">
      <template #header>
        <EditorHeader />
      </template>

      <template #left-panel>
        <ResourcePanel />
      </template>

      <template #viewport>
        <PlayerPanel />
      </template>

      <template #right-panel>
        <InspectorPanel />
      </template>

      <template #timeline>
        <TimelinePanel />
      </template>
    </EditorShell>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue';
import EditorShell from '@/components/editor/EditorShell.vue';
import EditorHeader from '@/components/editor/EditorHeader.vue';
import ResourcePanel from '@/components/editor/ResourcePanel.vue';
import PlayerPanel from '@/components/editor/PlayerPanel.vue';
import TimelinePanel from '@/components/editor/TimelinePanel.vue';
import InspectorPanel from '@/components/editor/InspectorPanel.vue';
import { useEditorStore } from '@/stores/editor';
import { useStoryStore } from '@/stores/story';
import { useProjectStore } from '@/stores/project';

const editorStore = useEditorStore();
const storyStore = useStoryStore();
const projectStore = useProjectStore();

const isLoading = computed(() => projectStore.loading || storyStore.loading);
const isReady = computed(
  () => !isLoading.value && storyStore.scenes.length > 0
);

// Auto-initialize timeline when data is ready
watch(isReady, (ready) => {
  if (ready && editorStore.clips.length === 0) {
    // Logger.info('EditorView', 'Auto-initializing timeline from storyboard...');
    editorStore.initializeFromStory();
  }
});

// Reset editor when project changes
watch(
  () => projectStore.currentProjectId,
  (newId, oldId) => {
    if (newId !== oldId) {
      editorStore.$reset();
    }
  }
);

const handleKeydown = (e: KeyboardEvent) => {
  // Ignore if user is typing in an input or textarea
  const target = e.target as HTMLElement;
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault(); // Prevent scrolling
    editorStore.togglePlayPause();
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    if (editorStore.selectedObjectId) {
      e.preventDefault(); // Prevent navigation back
      editorStore.removeClip(editorStore.selectedObjectId);
    }
  } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    if (editorStore.selectedObjectId) {
      e.preventDefault();
      const clip = editorStore.selectedClip;
      if (clip) {
        const direction = e.code === 'ArrowRight' ? 1 : -1;
        const step = e.shiftKey ? 1.0 : 0.1; // 1s with Shift, 0.1s without
        const newStartTime = Math.max(0, clip.startTime + direction * step);
        editorStore.moveClip(clip.id, newStartTime);
      }
    }
  }
};

onMounted(() => {
  // If data is already ready (e.g. navigating from another view), initialize immediately if empty
  if (isReady.value && editorStore.clips.length === 0) {
    editorStore.initializeFromStory();
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  editorStore.$reset(); // Clean up on leave
});
</script>

<style scoped>
.editor-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color-background);
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 14px;
  border: 1px dashed var(--color-border);
  margin: 10px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: var(--color-text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
