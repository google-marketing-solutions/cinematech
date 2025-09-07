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

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config.ts';
import type { Router } from 'vue-router';

/**
 * Initializes the Google Sign-In process.
 * @param buttonParentId - The ID of the parent element for the Google Sign-In button.
 * @param router - The Vue router instance.
 */
export function initializeGoogleSignIn(
  buttonParentId: string,
  router: Router,
  clientId?: string
) {
  const configStore = useConfigStore();
  const finalClientId = clientId || configStore.googleClientId;
  if (!finalClientId) {
    console.error('Google Client ID not configured.');
    return;
  }
  if (typeof google === 'undefined') {
    console.error('Google Identity Services library not loaded.');
    return;
  }

  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: finalClientId,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        const authStore = useAuthStore();
        authStore.setAccessToken(tokenResponse.access_token);
        router.push({ name: 'prompt' });
      }
    },
  });

  const button = document.getElementById(buttonParentId);
  if (button) {
    button.addEventListener('click', () => {
      tokenClient.requestAccessToken();
    });
  }
}

/**
 * Retrieves the access token from the auth store.
 * If the token is not available, it waits for it to be set.
 * @return A promise that resolves with the access token.
 */
export function getAccessToken(): Promise<string> {
  const authStore = useAuthStore();
  return new Promise((resolve) => {
    if (authStore.accessToken) {
      resolve(authStore.accessToken);
    } else {
      const interval = setInterval(() => {
        if (authStore.accessToken) {
          clearInterval(interval);
          resolve(authStore.accessToken);
        }
      }, 500);
    }
  });
}

/**
 * Verifies the user's access token and checks if their domain is in the allowed list.
 * @param accessToken - The user's access token.
 * @param allowedDomains - An array of allowed domains.
 * @return A promise that resolves to true if the user is from an allowed domain, false otherwise.
 */
export async function verifyUser(
  accessToken: string,
  allowedDomains: string[] = ['google.com']
): Promise<boolean> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch user info:', response.statusText);
      return false;
    }

    const userInfo = await response.json();
    console.log(userInfo);
    const userDomain = userInfo.hd;

    if (userDomain && allowedDomains && allowedDomains.includes(userDomain)) {
      return true;
    } else {
      console.warn(`User domain '${userDomain}' is not in the allowed list.`);
      return false;
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}
