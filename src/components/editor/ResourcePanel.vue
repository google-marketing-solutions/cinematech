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
  <div class="resource-panel">
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="panel-content">
      <FileSystem
        v-if="activeTab === 'media'"
        :allowed-types="['image/', 'video/']"
        upload-type="video"
        :recursive="true"
      />
      <div v-else-if="activeTab === 'audio'" class="audio-tab-content">
        <AudioGenerator @generated="onAudioGenerated" />
        <FileSystem
          ref="audioFileSystem"
          :allowed-types="['audio/']"
          upload-type="audio"
          :recursive="true"
          class="flex-1"
        />
      </div>
      <FileSystem
        v-else-if="activeTab === 'text'"
        :allowed-types="['text']"
        upload-type="text"
      />
      <div v-else-if="activeTab === 'effects'" class="effects-list">
        <div
          v-for="effect in effects"
          :key="effect.id"
          class="effect-item"
          draggable="true"
          @dragstart="onEffectDragStart($event, effect)"
        >
          <div class="effect-icon">{{ effect.icon }}</div>
          <div class="effect-name">{{ effect.label }}</div>
        </div>
      </div>
      <div v-else-if="activeTab === 'transitions'" class="effects-list">
        <div
          v-for="transition in transitions"
          :key="transition.id"
          class="effect-item"
          draggable="true"
          @dragstart="onTransitionDragStart($event, transition)"
        >
          <div class="effect-icon">{{ transition.icon }}</div>
          <div class="effect-name">{{ transition.label }}</div>
        </div>
      </div>
      <div v-else class="placeholder-content">
        {{ activeTab }} content coming soon
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileSystem from './FileSystem.vue';
import AudioGenerator from './AudioGenerator.vue';

const tabs = [
  { id: 'media', label: 'Media' },
  { id: 'audio', label: 'Audio' },
  // { id: 'text', label: 'Text' },
  // { id: 'effects', label: 'Effects' },
  // { id: 'transitions', label: 'Transitions' },
  // { id: 'filters', label: 'Filters' },
];

const activeTab = ref('media');
const audioFileSystem = ref();

const onAudioGenerated = () => {
  audioFileSystem.value?.refresh();
};

const effects = [
  { id: 'grayscale', label: 'Grayscale', icon: '⚫️' },
  { id: 'sepia', label: 'Sepia', icon: '🟤' },
  { id: 'blur', label: 'Blur', icon: '🌫️' },
  { id: 'brightness', label: 'Brightness', icon: '☀️' },
  { id: 'contrast', label: 'Contrast', icon: '🌓' },
  { id: 'invert', label: 'Invert', icon: '🔄' },
];

const onEffectDragStart = (event: DragEvent, effect: { id: string }) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'add-effect',
        effectId: effect.id,
      })
    );
  }
};

const transitions = [
  { id: 'fade', label: 'Cross Fade', icon: '🌫️' },
  { id: 'wipeleft', label: 'Wipe Left', icon: '⬅️' },
  { id: 'wiperight', label: 'Wipe Right', icon: '➡️' },
  { id: 'slideleft', label: 'Slide Left', icon: '👈' },
  { id: 'slideright', label: 'Slide Right', icon: '👉' },
  { id: 'circlecrop', label: 'Circle Crop', icon: '⭕' },
];

const onTransitionDragStart = (
  event: DragEvent,
  transition: { id: string }
) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'add-transition',
        transitionId: transition.id,
      })
    );
  }
};
</script>

<style scoped>
.resource-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-panel);
}

.tabs {
  display: flex;
  overflow-x: auto;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  padding: 12px 16px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.placeholder-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.effects-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.effect-item {
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.effect-item:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.effect-icon {
  font-size: 24px;
}

.effect-name {
  font-size: 12px;
  color: var(--color-text-primary);
}

.audio-tab-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.flex-1 {
  flex: 1;
  min-height: 0;
}
</style>
