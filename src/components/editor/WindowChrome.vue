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
  <div class="window-chrome">
    <div class="window-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// WindowChrome component
</script>

<style scoped>
.window-chrome {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.window-bar {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  gap: var(--spacing-md);
  height: 44px;
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.light.red {
  background-color: #ff5f56;
  border: 1px solid #e0443e;
}

.light.yellow {
  background-color: #ffbd2e;
  border: 1px solid #dea123;
}

.light.green {
  background-color: #27c93f;
  border: 1px solid #1aab29;
}

.address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  height: 28px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.spacer {
  width: 52px; /* Balance the traffic lights width */
}

.window-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
