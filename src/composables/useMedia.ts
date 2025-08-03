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
import { ref, type Ref } from 'vue';
import {
  downloadFileAsBase64,
  uploadTypedFileToGCS,
} from '@/services/gcp/gcs.ts';

/**
 * A composable for handling media files, including loading, uploading, and downloading.
 * @return An object with reactive state and functions for media handling.
 */
export function useMedia() {
  /**
   * The data URL of the currently loaded media file.
   * @type {Ref<string | null>}
   */
  const mediaDataUrl: Ref<string | null> = ref(null);
  /**
   * A flag indicating whether a media file is currently being generated.
   * @type {Ref<boolean>}
   */
  const isGenerating: Ref<boolean> = ref(false);
  /**
   * A flag indicating whether a media file is currently being uploaded.
   * @type {Ref<boolean>}
   */
  const isUploading: Ref<boolean> = ref(false);

  /**
   * Loads a media file from a GCS path and sets its data URL.
   * @param {string} mediaPath - The GCS path of the media file to load.
   */
  const loadMedia = async (mediaPath: string) => {
    if (!mediaPath) {
      mediaDataUrl.value = null;
      return;
    }
    try {
      const base64Data = await downloadFileAsBase64(mediaPath);
      const mimeType = mediaPath.endsWith('.mp4') ? 'video/mp4' : 'image/png';
      mediaDataUrl.value = `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Failed to load media:', error);
      mediaDataUrl.value = null;
    }
  };

  /**
   * Uploads a media file to GCS.
   * @param {File} file - The media file to upload.
   * @param {'image' | 'video' | string} type - The type of the media file.
   * @return {Promise<string | void>} A promise that resolves with the GCS URI of the uploaded file, or void if the upload fails.
   */
  const uploadMedia = async (
    file: File,
    type: 'image' | 'video' | string
  ): Promise<string | void> => {
    isUploading.value = true;
    try {
      const gcsUri = await uploadTypedFileToGCS(file, type);
      return gcsUri;
    } catch (error) {
      console.error('Failed to upload media:', error);
    } finally {
      isUploading.value = false;
    }
  };

  /**
   * Downloads a media file from a URL.
   * @param {string} url - The URL of the media file to download.
   * @param {string} fileName - The name to use for the downloaded file.
   */
  const downloadMedia = (url: string, fileName: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Opens a file dialog to allow the user to select a file.
   * @param {string} accept - The `accept` attribute for the file input, specifying the allowed file types.
   * @param {(file: File) => void} callback - A callback function that will be called with the selected file.
   */
  const openFileDialog = (accept: string, callback: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const file = target.files[0];
        if (file) {
          callback(file);
        }
      }
    };
    input.click();
  };

  return {
    mediaDataUrl,
    isGenerating,
    isUploading,
    loadMedia,
    uploadMedia,
    downloadMedia,
    openFileDialog,
  };
}
