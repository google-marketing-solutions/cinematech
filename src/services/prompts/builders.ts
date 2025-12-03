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

import type { IdealScenePrompt } from './types';

/**
 * Builds a natural language prompt optimized for Google Veo (Video).
 * Veo prefers descriptive sentences covering Subject, Action, Environment, Camera, and Audio.
 */
export function buildVeoPrompt(scene: IdealScenePrompt): string {
  const parts: string[] = [];

  // 1. Core Visuals (Subject + Action + Environment)
  // "A [Style] video of [Subject] [Action] in [Environment]."
  parts.push(
    `${scene.style.artStyle} video of ${scene.subject} ${scene.action} in ${scene.environment}.`
  );

  // 2. Cinematography
  // "Shot with a [Camera Type], [Angle], [Movement]."
  const cameraDetails = [
    scene.camera.type ? `Shot with a ${scene.camera.type}` : '',
    scene.camera.angle,
    scene.camera.movement,
    scene.camera.lens ? `using a ${scene.camera.lens} lens` : '',
  ]
    .filter(Boolean)
    .join(', ');

  if (cameraDetails) {
    parts.push(`${cameraDetails}.`);
  }

  // 3. Lighting & Mood
  parts.push(
    `Lighting is ${scene.style.lighting} with a ${scene.style.colorPalette} color palette. Mood is ${scene.style.mood}.`
  );

  // 4. Audio (Crucial for Veo)
  const audioParts: string[] = [];
  if (scene.audio.dialogue) {
    audioParts.push(`Character says: "${scene.audio.dialogue}"`);
  }
  if (scene.audio.ambient) {
    audioParts.push(`Sound of ${scene.audio.ambient}`);
  }
  if (scene.audio.music) {
    audioParts.push(`Music: ${scene.audio.music}`);
  }
  if (scene.audio.soundEffects) {
    audioParts.push(`SFX: ${scene.audio.soundEffects}`);
  }

  if (audioParts.length > 0) {
    parts.push(audioParts.join('. ') + '.');
  }

  // 5. Negative Prompt / Constraints
  // Veo often handles negative prompts separately, but adding "No subtitles" in text is a good safety measure.
  parts.push('(No subtitles, no text overlay)');

  return parts.join(' ');
}

/**
 * Builds a natural language prompt optimized for Gemini 3 Pro (Image).
 * Focuses on visual details, composition, and style. Ignores audio.
 */
export function buildGeminiImagePrompt(scene: IdealScenePrompt): string {
  const parts: string[] = [];

  // 1. Subject & Action & Environment (Detailed)
  parts.push(
    `${scene.style.artStyle} image of ${scene.subject} ${scene.action} in ${scene.environment}.`
  );

  // 2. Composition & Camera
  const cameraDetails = [
    scene.camera.angle,
    scene.camera.type,
    scene.camera.lens,
  ]
    .filter(Boolean)
    .join(', ');

  if (cameraDetails) {
    parts.push(`Framing: ${cameraDetails}.`);
  }

  // 3. Lighting & Color
  parts.push(
    `Lighting: ${scene.style.lighting}. Color Palette: ${scene.style.colorPalette}. Mood: ${scene.style.mood}.`
  );

  // 4. Quality Boosters
  parts.push('High quality, detailed, 4k resolution.');

  return parts.join(' ');
}
