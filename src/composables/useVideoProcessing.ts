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

import { ref } from 'vue';
import { cropTo916 } from '@/services/ffmpeg.ts';
import { uploadTypedFileToGCS } from '@/services/gcp/gcs.ts';

/**
 * A composable for processing and uploading videos.
 * @return An object with reactive state and a function for video processing.
 */
export function useVideoProcessing() {
  /**
   * A flag indicating whether a video is currently being processed.
   * @type {import('vue').Ref<boolean>}
   */
  const isProcessing = ref(false);

  /**
   * Processes a video by cropping it to a 9:16 aspect ratio and then uploads it to GCS.
   * @param {Uint8Array} videoData - The video data to process.
   * @param {string} fileName - The name to use for the uploaded file.
   * @return {Promise<string | undefined>} A promise that resolves with the GCS URI of the uploaded video, or undefined if the process fails.
   */
  const processAndUpload = async (
    videoData: Uint8Array,
    fileName: string
  ): Promise<string | undefined> => {
    isProcessing.value = true;
    try {
      const croppedVideoData = await cropTo916(videoData);
      const blob = new Blob([croppedVideoData.slice()], { type: 'video/mp4' });
      const file = new File([blob], fileName, { type: 'video/mp4' });
      const gcsUri = await uploadTypedFileToGCS(file, 'video');
      return gcsUri;
    } catch (error) {
      console.error('Failed to process and upload video:', error);
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    processAndUpload,
  };
}
