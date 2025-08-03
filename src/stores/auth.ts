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

/**
 * @interface AuthState
 * @property {string | null} accessToken - The user's access token.
 * @property {string | null} clientId - The Google Client ID.
 */
interface AuthState {
  accessToken: string | null;
  clientId: string | null;
  env: string;
}

/**
 * Pinia store for managing authentication state.
 */
export const useAuthStore = defineStore('auth', {
  /**
   * The initial state of the store.
   * @return {AuthState} The initial state.
   */
  state: (): AuthState => ({
    accessToken: null,
    clientId: localStorage.getItem('googleClientId') || null,
    env: import.meta.env.ENV_NAME || 'dev',
  }),
  actions: {
    /**
     * Sets the access token.
     * @param {string} token - The access token.
     */
    setAccessToken(token: string) {
      this.accessToken = token;
    },
    /**
     * Sets the client ID and saves it to local storage.
     * @param {string} clientId - The client ID.
     */
    setClientId(clientId: string) {
      this.clientId = clientId;
      localStorage.setItem('googleClientId', clientId);
    },
    /**
     * Logs the user out by revoking the access token and clearing it from the state.
     */
    logout() {
      if (this.accessToken) {
        google.accounts.oauth2.revoke(this.accessToken, () => {});
      }
      this.accessToken = null;
    },
  },
  getters: {
    /**
     * A getter to check if the user is authenticated.
     * @param {AuthState} state - The store's state.
     * @return {boolean} True if the user is authenticated, false otherwise.
     */
    isAuthenticated: (state: AuthState): boolean => !!state.accessToken,
    getEnv: (state: AuthState) => state.env,
  },
});
