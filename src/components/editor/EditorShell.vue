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
  <div class="editor-shell">
    <div class="area-header">
      <slot name="header"></slot>
    </div>
    <div class="area-left">
      <slot name="left-panel"></slot>
    </div>
    <div class="area-viewport">
      <slot name="viewport"></slot>
    </div>
    <div class="area-right">
      <slot name="right-panel"></slot>
    </div>
    <div class="area-timeline">
      <slot name="timeline"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// EditorShell layout component
</script>

<style scoped>
.editor-shell {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-areas:
    'header header header'
    'left viewport right'
    'timeline timeline timeline';
  grid-template-rows: 48px 1fr 320px; /* Fixed header, flexible viewport, fixed timeline */
  grid-template-columns: 280px 1fr 320px; /* Fixed sidebars, flexible viewport */
  background-color: var(--color-background);
  color: var(--color-text-primary);
  overflow: hidden;
}

.editor-shell * {
  box-sizing: border-box;
}

.area-header {
  grid-area: header;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-panel);
}

.area-left {
  grid-area: left;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-background-panel);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.area-viewport {
  grid-area: viewport;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.area-right {
  grid-area: right;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-background-panel);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.area-timeline {
  grid-area: timeline;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-background-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}
</style>
