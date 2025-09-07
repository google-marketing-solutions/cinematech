<!-- eslint-disable vue/multi-word-component-names -->
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
  <div v-if="isVisible" :class="['toast', type]">
    <p>{{ message }}</p>
    <button @click="hideToast" class="close-btn">&times;</button>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { isVisible, message, type, hideToast } = useToast();
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 20px 30px;
  z-index: 9999;
  border-radius: 12px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  font-size: 1.1rem;
  font-weight: 500;
}

.toast.success {
  background-color: #4caf50;
}

.toast.error {
  background-color: #f44336;
}

.toast.info {
  background-color: #2196f3;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 15px;
  padding: 0;
  line-height: 1;
}
</style>
