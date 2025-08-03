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
import { useVideoProcessing } from '@/composables/useVideoProcessing.ts';
import { downloadFileAsBase64 } from '@/services/gcp/gcs.ts';

/**
 * @interface VideoState
 * @property {string | null} videoUrl - The URL of the final video.
 * @property {boolean} isProcessing - A flag indicating whether the video is currently being processed.
 */
interface VideoState {
  videoUrl: string | null;
  isProcessing: boolean;
}

/**
 * Pinia store for managing the final video.
 */
export const useVideoStore = defineStore('video', {
  /**
   * The initial state of the store.
   * @return {VideoState} The initial state.
   */
  state: (): VideoState => ({
    videoUrl: null,
    isProcessing: false,
  }),
  actions: {
    /**
     * Sets the URL of the final video.
     * @param {string} url - The URL of the video.
     */
    setVideoUrl(url: string) {
      this.videoUrl = url;
    },
    /**
     * Clears the URL of the final video.
     */
    clearVideoUrl() {
      this.videoUrl = null;
    },
    /**
     * Crops the final video to a 9:16 aspect ratio.
     */
    async cropVideo() {
      if (!this.videoUrl) return;

      this.isProcessing = true;
      const { processAndUpload } = useVideoProcessing();

      try {
        const response = await fetch(this.videoUrl);
        const videoData = new Uint8Array(await response.arrayBuffer());
        const gcsUri = await processAndUpload(videoData, 'cropped-video.mp4');

        if (gcsUri) {
          const base64Data = await downloadFileAsBase64(gcsUri);
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const newBlob = new Blob([byteArray], { type: 'video/mp4' });
          const url = URL.createObjectURL(newBlob);
          this.setVideoUrl(url);
        }
      } catch (error) {
        console.error('Failed to crop video:', error);
      } finally {
        this.isProcessing = false;
      }
    },
  },
});
