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

/**
 * Extracts the last frame of a video and returns it as a base64 encoded string.
 *
 * @param {string} videoBase64 - The video content as a base64 encoded string.
 * @return {Promise<string>} A promise that resolves with the last frame as a base64 encoded string.
 * @throws {Error} If the canvas context cannot be retrieved or if there is an error loading the video.
 */
export function getLastFrame(videoBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoBase64;
    video.muted = true;

    video.onloadedmetadata = () => {
      video.currentTime = video.duration;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };

    video.onerror = (err) => {
      reject(err);
    };
  });
}
