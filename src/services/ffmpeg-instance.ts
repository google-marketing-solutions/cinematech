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

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

/**
 * Lazily loads and returns a singleton instance of the FFmpeg library.
 * This function ensures that FFmpeg is loaded only once and that subsequent
 * calls return the same instance. It handles the loading state to prevent
 * multiple loading attempts from occurring simultaneously.
 *
 * @return {Promise<FFmpeg>} A promise that resolves with the loaded FFmpeg instance.
 * @throws {Error} If FFmpeg fails to load, the promise will be rejected with the corresponding error.
 */
export function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return Promise.resolve(ffmpegInstance);
  }

  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = new Promise((resolve, reject) => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            'text/javascript'
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            'application/wasm'
          ),
        });
        ffmpegInstance = ffmpeg;
        resolve(ffmpegInstance);
      } catch (error) {
        console.error('Failed to load FFmpeg', error);
        reject(error);
      } finally {
        ffmpegLoadingPromise = null;
      }
    };
    loadFFmpeg();
  });

  return ffmpegLoadingPromise;
}
