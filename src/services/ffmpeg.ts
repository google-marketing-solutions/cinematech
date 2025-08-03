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

import { downloadVideoAsUint8Array } from './gcp/gcs';
import { getFFmpeg } from './ffmpeg-instance.ts';
import type { Scene } from '@/types';

/**
 * Creates a final video by concatenating and processing a list of scenes.
 * Each scene's video is downloaded, scaled, and padded to a 1920x1080 resolution.
 * The scenes are then concatenated into a single video file.
 *
 * @param {Scene[]} scenes - An array of scene objects, each potentially containing a video URL.
 * @return {Promise<Uint8Array>} A promise that resolves with the final video as a Uint8Array.
 * @throws {Error} If no valid videos are found in the scenes to process.
 */
export async function createFinalVideo(scenes: Scene[]): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputFiles: string[] = [];

  const scenesWithVideo = scenes.filter((scene) => scene.video);

  for (let i = 0; i < scenesWithVideo.length; i++) {
    const scene = scenesWithVideo[i];
    if (scene.video) {
      const fileName = `input${i}.mp4`;
      const uint8Array = await downloadVideoAsUint8Array(scene.video);
      await ffmpeg.writeFile(fileName, uint8Array);
      inputFiles.push(fileName);
    }
  }
  if (inputFiles.length === 0) {
    throw new Error('No valid videos found to process.');
  }
  const inputs = inputFiles.flatMap((file) => ['-i', file]);

  let filterComplex;

  if (inputFiles.length === 1) {
    filterComplex = `[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[vout];[0:a]acopy[aout]`;
  } else {
    const scalingFilters = inputFiles
      .map(
        (_, i) =>
          `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
      )
      .join(';');
    const concatInputs = inputFiles.map((_, i) => `[v${i}][${i}:a]`).join('');

    const concatFilter = `${concatInputs}concat=n=${inputFiles.length}:v=1:a=1[vout][aout]`;

    filterComplex = `${scalingFilters};${concatFilter}`;
  }
  await ffmpeg.exec([
    ...inputs,
    '-filter_complex',
    filterComplex,
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    '-sn',
    '-preset',
    'ultrafast',
    '-crf',
    '28',
    '-tune',
    'zerolatency',
    'output.mp4',
  ]);
  const data = await ffmpeg.readFile('output.mp4');
  return data as Uint8Array;
}

/**
 * Crops a video to a 9:16 aspect ratio.
 * The cropping is done by maintaining the height and adjusting the width.
 *
 * @param {Uint8Array} videoData - The video data to be cropped, as a Uint8Array.
 * @return {Promise<Uint8Array>} A promise that resolves with the cropped video as a Uint8Array.
 */
export async function cropTo916(videoData: Uint8Array): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputFileName = 'input-crop.mp4';
  const outputFileName = 'output-crop.mp4';

  await ffmpeg.writeFile(inputFileName, videoData);

  await ffmpeg.exec([
    '-i',
    inputFileName,
    '-vf',
    'crop=ih*9/16:ih',
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data as Uint8Array;
}
