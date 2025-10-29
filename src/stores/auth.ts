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
 * @property {number | null} tokenExpiration - The timestamp when the access token expires.
 * @property {string | null} clientId - The Google Client ID.
 */
interface AuthState {
  accessToken: string | null;
  tokenExpiration: number | null;
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
    accessToken: localStorage.getItem('accessToken') || null,
    tokenExpiration: Number(localStorage.getItem('tokenExpiration')) || null,
    clientId: localStorage.getItem('googleClientId') || null,
    env: import.meta.env.ENV_NAME || 'dev',
  }),
  actions: {
    /**
     * Sets the access token and its expiration time.
     * @param {string} token - The access token.
     * @param {number} expiresIn - The token's validity duration in seconds.
     */
    setAccessToken(token: string, expiresIn: number) {
      this.accessToken = token;
      // Time to refresh the token is 5 minutes before it expires
      const expiresInMs = (expiresIn - 300) * 1000;
      this.tokenExpiration = Date.now() + expiresInMs;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('tokenExpiration', String(this.tokenExpiration));
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
      this.tokenExpiration = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenExpiration');
    },
  },
  getters: {
    /**
     * A getter to check if the user is authenticated.
     * @param {AuthState} state - The store's state.
     * @return {boolean} True if the user is authenticated, false otherwise.
     */
    isAuthenticated: (state: AuthState): boolean => {
      return (
        !!state.accessToken &&
        !!state.tokenExpiration &&
        Date.now() < state.tokenExpiration
      );
    },
    getEnv: (state: AuthState) => state.env,
  },
});
