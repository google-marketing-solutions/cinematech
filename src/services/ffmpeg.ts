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
import type { Scene, Clip } from '@/types';
import { Logger } from './logger.ts';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * Creates a final video by concatenating and processing a list of scenes.
 * Each scene's video is downloaded, scaled, and padded to a 1920x1080 resolution.
 * The scenes are then concatenated into a single video file.
 *
 * @param {Scene[]} scenes - An array of scene objects, each potentially containing a video URL.
 * @param {('16:9' | '9:16')} aspectRatio - The desired aspect ratio for the output video.
 * @return {Promise<UintArray>} A promise that resolves with the final video as a Uint8Array.
 * @throws {Error} If no valid videos are found in the scenes to process.
 */
export async function createFinalVideo(
  scenes: Scene[],
  aspectRatio: '16:9' | '9:16'
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputFiles: string[] = [];
  const is169 = aspectRatio === '16:9';
  const width = is169 ? 1920 : 1080;
  const height = is169 ? 1080 : 1920;

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
    filterComplex = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[vout];[0:a]acopy[aout]`;
  } else {
    const scalingFilters = inputFiles
      .map(
        (_, i) =>
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
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

/**
 * Trims a video to a specified start and end time.
 *
 * @param {Uint8Array} videoData - The video data to be trimmed, as a Uint8Array.
 * @param {number} startTime - The start time in seconds.
 * @param {number} endTime - The end time in seconds.
 * @return {Promise<Uint8Array>} A promise that resolves with the trimmed video as a Uint8Array.
 */
export async function trimVideo(
  videoData: Uint8Array,
  startTime: number,
  endTime: number
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputFileName = 'input-trim.mp4';
  const outputFileName = 'output-trim.mp4';

  await ffmpeg.writeFile(inputFileName, videoData);

  await ffmpeg.exec([
    '-i',
    inputFileName,
    '-ss',
    String(startTime),
    '-to',
    String(endTime),
    '-preset',
    'ultrafast',
    '-crf',
    '28',
    '-tune',
    'zerolatency',
    '-c:a',
    'copy',
    '-sn',
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data as Uint8Array;
}

/**
 * Splits a video at a specified time.
 *
 * @param {Uint8Array} videoData - The video data to be split, as a Uint8Array.
 * @param {number} splitTime - The time to split the video in seconds.
 * @return {Promise<[Uint8Array, Uint8Array]>} A promise that resolves with an array containing the two split videos as Uint8Arrays.
 */
export async function splitVideo(
  videoData: Uint8Array,
  splitTime: number
): Promise<[Uint8Array, Uint8Array]> {
  const ffmpeg = await getFFmpeg();
  const inputFileName = 'input-split.mp4';
  const outputFileName1 = 'output-split1.mp4';
  const outputFileName2 = 'output-split2.mp4';

  await ffmpeg.writeFile(inputFileName, videoData);

  // First part
  await ffmpeg.exec([
    '-i',
    inputFileName,
    '-to',
    String(splitTime),
    '-c',
    'copy',
    outputFileName1,
  ]);

  // Second part
  await ffmpeg.exec([
    '-i',
    inputFileName,
    '-ss',
    String(splitTime),
    '-preset',
    'ultrafast',
    '-crf',
    '28',
    '-tune',
    'zerolatency',
    '-c:a',
    'copy',
    '-sn',
    outputFileName2,
  ]);

  const data1 = await ffmpeg.readFile(outputFileName1);
  const data2 = await ffmpeg.readFile(outputFileName2);

  return [data1 as Uint8Array, data2 as Uint8Array];
}

/**
 * Applies a visual filter to a video.
 *
 * @param {Uint8Array} videoData - The video data.
 * @param {string} filterName - The name of the filter (e.g., 'grayscale', 'sepia', 'blur').
 * @return {Promise<Uint8Array>} The filtered video.
 */
export async function applyFilter(
  videoData: Uint8Array,
  filterName: string
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const inputFileName = 'input-filter.mp4';
  const outputFileName = 'output-filter.mp4';

  await ffmpeg.writeFile(inputFileName, videoData);

  let filterString = '';
  switch (filterName) {
    case 'grayscale':
      filterString = 'hue=s=0';
      break;
    case 'sepia':
      filterString =
        'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
      break;
    case 'blur':
      filterString = 'gblur=sigma=10';
      break;
    default:
      return videoData; // No filter
  }

  await ffmpeg.exec([
    '-i',
    inputFileName,
    '-vf',
    filterString,
    '-c:a',
    'copy',
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data as Uint8Array;
}

/**
 * Mixes audio into a video.
 *
 * @param {Uint8Array} videoData - The video data.
 * @param {Uint8Array} audioData - The audio data.
 * @param {number} volume - The volume of the added audio (0.0 to 1.0+).
 * @return {Promise<Uint8Array>} The video with mixed audio.
 */
export async function mixAudio(
  videoData: Uint8Array,
  audioData: Uint8Array,
  volume = 1.0
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const videoFileName = 'input-video.mp4';
  const audioFileName = 'input-audio.mp3';
  const outputFileName = 'output-mixed.mp4';

  await ffmpeg.writeFile(videoFileName, videoData);
  await ffmpeg.writeFile(audioFileName, audioData);

  // Mix audio streams: [1:a]volume=...[a1];[0:a][a1]amix=inputs=2:duration=first[aout]
  // Assuming input video has audio. If not, we might need to just use the new audio.
  // For robustness, let's assume we want to add background music.

  await ffmpeg.exec([
    '-i',
    videoFileName,
    '-i',
    audioFileName,
    '-filter_complex',
    `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first[aout]`,
    '-map',
    '0:v',
    '-map',
    '[aout]',
    '-c:v',
    'copy', // Copy video stream to avoid re-encoding if possible
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data as Uint8Array;
}

/**
 * Burns subtitles into a video.
 *
 * @param {Uint8Array} videoData - The video data.
 * @param {string} srtContent - The subtitle content in SRT format.
 * @return {Promise<Uint8Array>} The video with burned subtitles.
 */
export async function burnSubtitles(
  videoData: Uint8Array,
  srtContent: string
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();
  const videoFileName = 'input-subs.mp4';
  const srtFileName = 'subtitles.srt';
  const outputFileName = 'output-subs.mp4';

  await ffmpeg.writeFile(videoFileName, videoData);
  await ffmpeg.writeFile(srtFileName, srtContent);

  // Note: libass is required for subtitles filter, usually available in standard ffmpeg builds
  // but might depend on the @ffmpeg/core build.
  // If subtitles filter fails, we might need a different approach or check build capabilities.

  await ffmpeg.exec([
    '-i',
    videoFileName,
    '-vf',
    `subtitles=${srtFileName}`,
    '-c:a',
    'copy',
    outputFileName,
  ]);

  const data = await ffmpeg.readFile(outputFileName);
  return data as Uint8Array;
}
/**
 * Renders the timeline into a single video file.
 *
 * @param {Clip[]} clips - The clips to render.
 * @param {('16:9' | '9:16')} aspectRatio - The desired aspect ratio.
 * @return {Promise<Uint8Array>} The rendered video.
 */
/**
 * Helper to safely delete a file, ignoring errors if it doesn't exist.
 */
async function safeDeleteFile(ffmpeg: FFmpeg, fileName: string) {
  try {
    await ffmpeg.deleteFile(fileName);
  } catch (e) {
    // Ignore FS errors during cleanup
    Logger.warn(
      'FFmpeg',
      `Failed to delete file ${fileName} (might not exist)`,
      e
    );
  }
}

/**
 * Renders the timeline into a single video file.
 *
 * @param {Clip[]} clips - The clips to render.
 * @param {('16:9' | '9:16')} aspectRatio - The desired aspect ratio.
 * @return {Promise<Uint8Array>} The rendered video.
 */
export async function renderTimeline(
  clips: Clip[],
  aspectRatio: '16:9' | '9:16'
): Promise<Uint8Array> {
  const ffmpeg = await getFFmpeg();

  // Enable logging
  ffmpeg.on('log', ({ message }: { message: string }) => {
    Logger.debug('FFmpeg', message);
  });

  // Filter out text/audio clips for the main video track (for now, handling video/images only)
  // We should ideally mix audio tracks separately, but for this task we focus on video transitions.
  // Let's assume we are rendering the main video track + its transitions.
  // If there are separate audio clips, we might need to mix them in later.
  // For simplicity in this step, we'll process video/image clips and their audio.
  const videoClips = clips.filter(
    (c) => c.mediaType === 'video' || c.mediaType === 'image'
  );
  const sortedClips = [...videoClips].sort((a, b) => a.startTime - b.startTime);

  if (sortedClips.length === 0) {
    throw new Error('No video clips to render.');
  }

  const inputFiles: string[] = [];
  const is169 = aspectRatio === '16:9';
  const width = is169 ? 1920 : 1080;
  const height = is169 ? 1080 : 1920;

  Logger.info(
    'FFmpeg',
    `Starting renderTimeline with ${sortedClips.length} clips`
  );

  // 1. Prepare all inputs (scale, pad, trim)
  for (let i = 0; i < sortedClips.length; i++) {
    const clip = sortedClips[i];
    const clipInputName = `clip_input_${i}`;
    const clipOutputName = `clip_prepared_${i}.mp4`;

    Logger.debug('FFmpeg', `Preparing clip ${i}: ${clip.id}`);

    let assetData: Uint8Array | undefined;
    if (typeof clip.assetId === 'string' && clip.assetId.startsWith('gs://')) {
      try {
        assetData = await downloadVideoAsUint8Array(clip.assetId);
      } catch (e) {
        Logger.error('FFmpeg', `Failed to download asset ${clip.assetId}`, e);
        continue;
      }
    } else {
      Logger.warn('FFmpeg', `Skipping clip ${clip.id} with invalid assetId`);
      continue;
    }

    if (!assetData) continue;

    await safeDeleteFile(ffmpeg, clipInputName);
    await safeDeleteFile(ffmpeg, clipOutputName);
    await ffmpeg.writeFile(clipInputName, assetData);

    // Build filter for this clip
    const filters: string[] = [];
    filters.push(
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`
    );

    // Apply effects
    if (clip.effects) {
      if (clip.effects.includes('grayscale')) {
        filters.push('hue=s=0');
      }
      if (clip.effects.includes('sepia')) {
        filters.push(
          'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'
        );
      }
      if (clip.effects.includes('blur')) {
        filters.push('gblur=sigma=10');
      }
      if (clip.effects.includes('brightness')) {
        filters.push('eq=brightness=0.3');
      }
      if (clip.effects.includes('contrast')) {
        filters.push('eq=contrast=1.5');
      }
      if (clip.effects.includes('invert')) {
        filters.push('negate');
      }
    }

    const filterString = filters.join(',');
    let exitCode = 0;

    // Calculate duration including transition overlap if needed?
    // Actually, we should render the full duration of the clip as specified in timeline.
    // The transition will overlap these durations.

    if (clip.mediaType === 'image') {
      const imageArgs = [
        '-loop',
        '1',
        '-t',
        String(clip.duration),
        '-i',
        clipInputName,
        '-f',
        'lavfi',
        '-i',
        'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-vf',
        filterString,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-shortest',
        clipOutputName,
      ];
      exitCode = await ffmpeg.exec(imageArgs);
    } else {
      const args = [
        '-ss',
        String(clip.offset),
        '-t',
        String(clip.duration),
        '-i',
        clipInputName,
        '-vf',
        filterString,
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-c:a',
        'aac',
        clipOutputName,
      ];
      exitCode = await ffmpeg.exec(args);
    }

    if (exitCode !== 0) {
      Logger.error('FFmpeg', `Failed to prepare clip ${i}`);
      await safeDeleteFile(ffmpeg, clipInputName);
      continue;
    }

    inputFiles.push(clipOutputName);
    await safeDeleteFile(ffmpeg, clipInputName);
  }

  if (inputFiles.length === 0) {
    throw new Error('No clips prepared successfully.');
  }

  // 2. Build complex filter graph for transitions
  // If only 1 clip, just copy it
  if (inputFiles.length === 1) {
    const data = await ffmpeg.readFile(inputFiles[0]);
    for (const f of inputFiles) await safeDeleteFile(ffmpeg, f);
    return data as Uint8Array;
  }

  // Construct xfade chain
  // Inputs: [0:v][0:a][1:v][1:a]...
  // We need to map them.
  // Let's assume we have N inputs.
  // We start with [0:v] and [0:a] as current stream.
  // We iterate from 1 to N-1.

  let filterComplex = '';
  let currentVideoLabel = '0:v';
  let currentAudioLabel = '0:a';
  // const currentOffset = 0;

  // We need to track the accumulated duration to know when the next transition starts.
  // But xfade offset is absolute time from start of the first video.
  // So we need to know the duration of the *current accumulated stream*.
  // Let's track the duration of the first clip, then add subsequent clips minus overlap.

  // We need the durations of the prepared clips.
  // We can assume they match sortedClips[i].duration (since we forced it with -t).

  let accumulatedDuration = sortedClips[0].duration;

  for (let i = 1; i < inputFiles.length; i++) {
    const nextClip = sortedClips[i];
    // const prevClip = sortedClips[i - 1]; // Not strictly used for duration, but for logic

    // Determine transition
    // We look at the *next* clip's transition property (transition *into* next clip)
    // OR we could look at the previous clip's "out" transition.
    // The data model has `transition` on the clip. Let's assume it means "transition into this clip from previous".
    const transition = nextClip.transition;
    // const transitionDuration = transition ? transition.duration : 0;
    // const transitionType = transition ? transition.type : 'fade';

    // If no transition defined, we can just concat (or 0s fade/mix).
    // xfade doesn't support 0 duration well. If duration is 0, we might need a different approach (concat).
    // But mixing xfade and concat is hard.
    // Let's enforce a minimum transition of 0.1s if "transition" is present, otherwise use concat logic?
    // Actually, if we rewrite everything to xfade, we MUST use xfade for everything or use a mix.
    // If no transition, we can use a 0s offset? No, xfade needs overlap.
    // If no transition, we effectively want: [v0][v1]concat...
    // But we can't easily mix concat and xfade in one linear chain without care.
    // Strategy: If no transition, treat as 0s overlap? xfade fails.
    // Strategy: Use `concat` filter for non-transitions?
    // Complex!
    // Simplification: If we are using this new engine, maybe we ALWAYS use xfade?
    // Or we can use `settb=AVTB,setpts=PTS-STARTPTS` and overlay?

    // Let's try to stick to xfade. If no transition, maybe we can simulate a cut by using a very fast fade (0.01s)?
    // Or just use `fade` with 0 duration? (might fail).

    // const effectiveTransDur = transition ? Math.max(0.1, transition.duration) : 0;

    if (!transition) {
      // No transition. We want a hard cut.
      // We can use xfade with a dummy transition of 0 duration? No.
      // We can use the `concat` filter logic for this segment?
      // Mixing is hard.
      // Let's try to use a very short fade (0.1s) if the user didn't specify, OR
      // if we want to support hard cuts, we might need to use `concat` for those segments.
      // BUT, `concat` requires same format. We ensured that.
      // Let's assume for this task that we use xfade for EVERYTHING.
      // If the user didn't specify a transition, we'll use a 0.1s 'fade' for smoothness,
      // OR we can try to implement hard cut by just appending.
      // Let's use a 0.1s fade as default for "no transition" to keep it simple and robust for now,
      // unless we want to get fancy with `concat` segments.
      // Wait, the user asked for "option to add transitions". Implicitly, if not added, it should be a cut.
      // A cut is just offset = accumulatedDuration.
      // Using xfade with offset=accumulatedDuration and duration=0?
      // xfade documentation says duration must be positive.
      // Alternative: Use `overlay` for cuts?
      // [v0]pad=...[bg]; [bg][v1]overlay=x=0:y=0:enable='between(t,start,end)'...
      // Let's stick to xfade. If no transition, we can assume a "cut" is just a 0-duration transition?
      // If xfade fails with 0, we use 0.01.
      // Let's use 0.01s fade for "cut".
    }

    const transDur = transition ? transition.duration : 0.05; // Default to tiny fade for cuts to avoid glitches
    const transType = transition ? transition.type : 'fade';

    // Offset is when the transition STARTS.
    // It should start at `accumulatedDuration - transDur`.
    const offset = accumulatedDuration - transDur;

    // Video xfade
    // const nextVideoLabel = `v${i}`;
    // const nextAudioLabel = `a${i}`;

    // We need to map inputs. `inputFiles` are 0..N.
    // currentVideoLabel is the output of previous step.
    // The next input is `[${i}:v]`.

    filterComplex += `[${currentVideoLabel}][${i}:v]xfade=transition=${transType}:duration=${transDur}:offset=${offset}[v${i}_out];`;
    filterComplex += `[${currentAudioLabel}][${i}:a]acrossfade=d=${transDur}:c1=tri:c2=tri[a${i}_out];`;

    currentVideoLabel = `v${i}_out`;
    currentAudioLabel = `a${i}_out`;

    // Update accumulated duration
    // New duration = (accumulatedDuration - transDur) + nextClip.duration
    // Because we overlap by transDur.
    // Actually: Start of transition is `offset`.
    // End of transition is `offset + transDur`.
    // Next clip starts playing at `offset`.
    // Next clip ends at `offset + nextClip.duration`.
    accumulatedDuration = offset + nextClip.duration;
  }

  // Final map
  const inputs = inputFiles.flatMap((f) => ['-i', f]);

  await safeDeleteFile(ffmpeg, 'output_final.mp4');

  const args = [
    ...inputs,
    '-filter_complex',
    filterComplex,
    '-map',
    `[${currentVideoLabel}]`,
    '-map',
    `[${currentAudioLabel}]`,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-c:a',
    'aac',
    'output_final.mp4',
  ];

  Logger.debug('FFmpeg', `Running FFmpeg xfade: ${args.join(' ')}`);
  const finalExitCode = await ffmpeg.exec(args);

  if (finalExitCode !== 0) {
    throw new Error(`FFmpeg xfade failed with exit code ${finalExitCode}`);
  }

  const data = await ffmpeg.readFile('output_final.mp4');

  // Cleanup
  for (const f of inputFiles) await safeDeleteFile(ffmpeg, f);
  await safeDeleteFile(ffmpeg, 'output_final.mp4');

  return data as Uint8Array;
}
