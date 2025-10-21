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
  <div class="login-container">
    <div class="login-card">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <h1>CinemaTech</h1>
      <p class="subtitle">Your Creative Partner in Filmmaking</p>

      <div v-if="!isClientIdAvailable" class="input-group">
        <input
          type="text"
          v-model="clientId"
          placeholder="Enter Google Client ID"
          :disabled="isClientIdSaved"
        />
        <button @click="handleSaveEdit" class="save-button">
          {{ isClientIdSaved ? 'Edit' : 'Save' }}
        </button>
      </div>

      <button
        id="google-signin-button"
        @click="handleSignIn"
        :disabled="isSignInDisabled"
      >
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { initializeGoogleSignIn } from '@/services/auth';
import { useConfigStore } from '@/stores/config';

const router = useRouter();
const configStore = useConfigStore();
const clientId = ref(configStore.googleClientId);
const isClientIdSaved = ref(!!configStore.googleClientId);

const isClientIdAvailable = computed(
  () => !!import.meta.env.VITE_GOOGLE_CLIENT_ID
);
const isSignInDisabled = computed(() => {
  if (isClientIdAvailable.value) {
    return false;
  }
  return !isClientIdSaved.value;
});

const handleSaveEdit = () => {
  if (isClientIdSaved.value) {
    isClientIdSaved.value = false;
  } else {
    if (clientId.value) {
      configStore.updateConfig({ googleClientId: clientId.value });
      isClientIdSaved.value = true;
    } else {
      alert('Please enter a Client ID.');
    }
  }
};

const waitForGoogleSignIn = (callback: () => void) => {
  if (typeof window.google !== 'undefined') {
    callback();
  } else {
    setTimeout(() => {
      waitForGoogleSignIn(callback);
    }, 100);
  }
};

const initGoogleSignIn = () => {
  waitForGoogleSignIn(() => {
    initializeGoogleSignIn('google-signin-button', router);
  });
};

const handleSignIn = () => {
  initGoogleSignIn();
};

onMounted(() => {
  if (isClientIdAvailable.value || isClientIdSaved.value) {
    initGoogleSignIn();
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: radial-gradient(
    ellipse at bottom,
    var(--color-surface),
    var(--color-background)
  );
}

.login-card {
  background-color: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--color-border);
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-md);
}

h1 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.subtitle {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.input-group {
  display: flex;
  margin-bottom: var(--spacing-md);
}

.save-button {
  margin-left: var(--spacing-sm);
  padding: var(--spacing-md);
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text-primary);
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.save-button:hover {
  background-color: var(--color-accent-hover);
}

input[type='text'] {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

input[type='text']:disabled {
  background-color: var(--color-surface-muted);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

#google-signin-button {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 16px;
  font-weight: bold;
  color: var(--color-text-primary);
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: var(--transition-smooth);
}

#google-signin-button:disabled {
  background-color: var(--color-surface-muted);
  cursor: not-allowed;
}

#google-signin-button:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
</style>
