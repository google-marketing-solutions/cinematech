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
  <div class="prompt-container">
    <PageTitle title="Tarantino AI" subtitle="Unleash Your Inner Storyteller" />
    <PromptForm v-model="prompt" @create="createStory" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStoryStore } from '@/stores/story.ts';
import PageTitle from '@/components/PageTitle.vue';
import PromptForm from '@/components/PromptForm.vue';
import { useRouter } from 'vue-router';

const storyStore = useStoryStore();
const router = useRouter();

const loading = computed(() => storyStore.loading);

const prompt = computed({
  get: () => storyStore.prompt,
  set: (value: string) => {
    storyStore.setPrompt(value);
  },
});

const createStory = async () => {
  await storyStore.createStory();
  router.push({ name: 'guidelines' });
};
</script>

<style scoped>
.prompt-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(
    to right,
    var(--color-primary),
    var(--color-secondary)
  );
  font-family: 'Montserrat', sans-serif;
  color: var(--vt-c-white);
  text-align: center;
  padding: 20px;
}
</style>
