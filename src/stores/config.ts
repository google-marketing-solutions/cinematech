/*
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
*/

import { defineStore } from 'pinia';
import { useProjectStore } from './project';

/**
 * @interface ConfigState
 * @property {string} geminiTextModel - The Gemini text model to use.
 * @property {string} googleClientId - The Google Client ID for authentication.
 * @property {string} googleCloudProjectId - The Google Cloud Project ID.
 * @property {string} gcsBucketName - The name of the GCS bucket for storage.
 * @property {string} gcpLocationId - The GCP location ID.
 * @property {string} vertexImageModel - The Vertex AI image model to use.
 * @property {string} vertexVideoModel - The Vertex AI video model to use.
 */
interface ConfigState {
  geminiTextModel: string;
  googleClientId: string;
  googleCloudProjectId: string;
  gcsBucketName: string;
  gcpLocationId: string;
  vertexImageModel: string;
  vertexVideoModel: string;
}

const initialConfig: ConfigState = {
  geminiTextModel: 'gemini-2.5-pro',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  googleCloudProjectId: '',
  gcsBucketName: '',
  gcpLocationId: '',
  vertexImageModel: 'imagen-4.0-ultra-generate-preview-06-06',
  vertexVideoModel: 'veo-3.1-generate-001',
};

/**
 * Pinia store for managing application configuration.
 */
export const useConfigStore = defineStore('config', {
  /**
   * The initial state of the store, loaded from local storage or initialConfig.
   * @return {ConfigState} The initial state.
   */
  state: (): ConfigState => {
    const storedConfig = localStorage.getItem('config');
    return storedConfig ? JSON.parse(storedConfig) : initialConfig;
  },
  actions: {
    /**
     * Updates the configuration and saves it to local storage.
     * @param {Partial<ConfigState>} newConfig - The new configuration values.
     */
    updateConfig(newConfig: Partial<ConfigState>) {
      const oldGcsBucketName = this.gcsBucketName;
      this.$patch(newConfig);
      localStorage.setItem('config', JSON.stringify(this.$state));

      if (
        newConfig.gcsBucketName &&
        newConfig.gcsBucketName !== oldGcsBucketName
      ) {
        const projectStore = useProjectStore();
        projectStore.clearCurrentProject();
        projectStore.fetchProjects();
      }
    },
  },
});
