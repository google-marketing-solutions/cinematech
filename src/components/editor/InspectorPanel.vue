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
  <div class="inspector-panel">
    <div class="panel-header">
      <h3>Inspector</h3>
    </div>

    <div v-if="selectedClip" class="panel-content">
      <div class="section">
        <h4>Transform</h4>
        <div class="property-row">
          <label>Scale</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            :value="selectedClip.scale || 1"
            @input="
              updateClip(
                'scale',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
          <span class="value">{{ selectedClip.scale || 1 }}x</span>
        </div>
        <div class="property-row">
          <label>Rotation</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="selectedClip.rotation || 0"
            @input="
              updateClip(
                'rotation',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
          <span class="value">{{ selectedClip.rotation || 0 }}°</span>
        </div>
        <div class="property-row">
          <label>Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="
              selectedClip.opacity !== undefined ? selectedClip.opacity : 1
            "
            @input="
              updateClip(
                'opacity',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
          <span class="value"
            >{{
              Math.round(
                (selectedClip.opacity !== undefined
                  ? selectedClip.opacity
                  : 1) * 100
              )
            }}%</span
          >
        </div>
      </div>

      <div
        class="section"
        v-if="
          selectedClip.mediaType === 'audio' ||
          selectedClip.mediaType === 'video'
        "
      >
        <h4>Audio</h4>
        <div class="property-row">
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="selectedClip.volume !== undefined ? selectedClip.volume : 1"
            @input="
              updateClip(
                'volume',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
          <span class="value"
            >{{
              Math.round(
                (selectedClip.volume !== undefined ? selectedClip.volume : 1) *
                  100
              )
            }}%</span
          >
        </div>
      </div>

      <div class="section" v-if="selectedClip.mediaType === 'text'">
        <h4>Text</h4>
        <div class="property-col">
          <label>Content</label>
          <textarea
            :value="selectedClip.text"
            @input="
              updateClip('text', ($event.target as HTMLTextAreaElement).value)
            "
          ></textarea>
        </div>
        <div class="property-row">
          <label>Font Size</label>
          <input
            type="number"
            :value="selectedClip.fontSize || 48"
            @input="
              updateClip(
                'fontSize',
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
        <div class="property-row">
          <label>Color</label>
          <input
            type="color"
            :value="selectedClip.color || '#ffffff'"
            @input="
              updateClip('color', ($event.target as HTMLInputElement).value)
            "
          />
        </div>
      </div>

      <div class="section">
        <h4>Timing</h4>
        <div class="property-row">
          <label>Start</label>
          <input
            type="number"
            step="0.1"
            :value="selectedClip.startTime"
            @change="
              moveClip(Number(($event.target as HTMLInputElement).value))
            "
          />
        </div>
        <div class="property-row">
          <label>Duration</label>
          <input
            type="number"
            step="0.1"
            :value="selectedClip.duration"
            @change="
              resizeClip(Number(($event.target as HTMLInputElement).value))
            "
          />
        </div>
      </div>

      <div class="section actions">
        <button class="delete-btn" @click="deleteClip">
          <i class="mdi mdi-delete"></i> Delete Clip
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Select a clip to edit properties</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const selectedClip = computed(() => editorStore.selectedClip);

const updateClip = (key: string, value: any) => {
  if (selectedClip.value) {
    editorStore.updateClip(selectedClip.value.id, { [key]: value });
  }
};

const moveClip = (startTime: number) => {
  if (selectedClip.value) {
    editorStore.moveClip(selectedClip.value.id, startTime);
  }
};

const resizeClip = (duration: number) => {
  if (selectedClip.value) {
    editorStore.resizeClip(selectedClip.value.id, duration);
  }
};

const deleteClip = () => {
  if (selectedClip.value) {
    editorStore.removeClip(selectedClip.value.id);
  }
};
</script>

<style scoped>
.inspector-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-panel);
  color: var(--color-text-primary);
  border-left: 1px solid var(--color-border);
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
}

h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}

.section:last-child {
  border-bottom: none;
}

h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.5px;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.property-col {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  gap: 4px;
}

label {
  font-size: 12px;
  color: var(--color-text-secondary);
  width: 70px;
}

input[type='range'] {
  flex: 1;
}

input[type='number'] {
  width: 60px;
  background-color: var(--color-background-input);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 4px;
  border-radius: 4px;
}

input[type='color'] {
  width: 100%;
  height: 30px;
  border: none;
  padding: 0;
  background: none;
}

textarea {
  width: 100%;
  height: 60px;
  background-color: var(--color-background-input);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 8px;
  border-radius: 4px;
  resize: vertical;
}

.value {
  font-size: 12px;
  width: 40px;
  text-align: right;
  font-family: monospace;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 13px;
  padding: 20px;
  text-align: center;
}

.delete-btn {
  width: 100%;
  padding: 8px;
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff4d4d;
  border: 1px solid rgba(255, 0, 0, 0.2);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background-color: rgba(255, 0, 0, 0.2);
}
</style>
