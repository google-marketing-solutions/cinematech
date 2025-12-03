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

import { z } from 'zod';

/**
 * Zod schema for camera control.
 * This schema is used to validate and generate camera control data for the prompt.
 */
export const CameraControlSchema = z.object({
  angle: z
    .string()
    .describe("Camera angle (e.g., 'Low angle', 'Eye-level', 'Top-down')"),
  movement: z
    .string()
    .describe("Camera movement (e.g., 'Pan right', 'Tracking shot', 'Static')"),
  type: z
    .string()
    .describe("Camera type (e.g., 'Drone', 'Handheld', 'Cinema Camera')"),
  lens: z
    .string()
    .optional()
    .describe("Lens type (e.g., 'Wide angle', 'Telephoto', 'Macro')"),
});

/**
 * Zod schema for audio prompt.
 * This schema is used to validate and generate audio prompt data for the prompt.
 */
export const AudioPromptSchema = z.object({
  dialogue: z
    .string()
    .optional()
    .describe('Specific dialogue spoken by characters'),
  ambient: z
    .string()
    .optional()
    .describe("Background sounds (e.g., 'City traffic', 'Birds chirping')"),
  music: z
    .string()
    .optional()
    .describe(
      "Musical style or mood (e.g., 'Upbeat electronic', 'Somber piano')"
    ),
  soundEffects: z
    .string()
    .optional()
    .describe("Specific sound effects (e.g., 'Footsteps', 'Glass breaking')"),
});

/**
 * Zod schema for visual style.
 * This schema is used to validate and generate visual style data for the prompt.
 */
export const VisualStyleSchema = z.object({
  artStyle: z
    .string()
    .describe(
      "Overall art style (e.g., 'Photorealistic', 'Cinematic', '3D Animation')"
    ),
  lighting: z
    .string()
    .describe(
      "Lighting conditions (e.g., 'Golden hour', 'Neon', 'Studio lighting')"
    ),
  colorPalette: z
    .string()
    .describe("Color grading (e.g., 'Vibrant', 'Monochrome', 'Pastel')"),
  mood: z
    .string()
    .describe("Emotional atmosphere (e.g., 'Joyful', 'Tense', 'Serene')"),
});

/**
 * Zod schema for ideal scene prompt.
 * This schema is used to validate and generate ideal scene prompt data for the prompt.
 */
export const IdealScenePromptSchema = z.object({
  subject: z.string().describe('Detailed description of the main subject(s)'),
  action: z.string().describe('Specific action occurring in the scene'),
  environment: z.string().describe('Detailed setting/background description'),
  camera: CameraControlSchema,
  audio: AudioPromptSchema,
  style: VisualStyleSchema,
  negativePrompt: z
    .string()
    .optional()
    .describe("Elements to exclude (e.g., 'text', 'blur', 'distortion')"),

  // Legacy/Operational fields
  imageToVideo: z
    .boolean()
    .optional()
    .describe('Whether to use image-to-video generation'),
  image: z
    .string()
    .optional()
    .describe('Base64 or URL of the input image for image-to-video'),
});

/**
 * Type for ideal scene prompt.
 * This type is used to validate and generate ideal scene prompt data for the prompt.
 */
export type IdealScenePrompt = z.infer<typeof IdealScenePromptSchema>;
