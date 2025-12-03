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

import { z, ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Converts a Zod schema to a JSON schema.
 * @param {ZodSchema<any>} schema - The Zod schema to convert.
 * @param {string} schemaName - The name of the schema.
 * @return {Promise<any>} A promise that resolves with the JSON schema.
 */
async function getJsonSchema(
  schema: ZodSchema<any>,
  schemaName: string
): Promise<any> {
  const jsonSchema = await zodToJsonSchema(schema, schemaName);
  return jsonSchema.definitions ? jsonSchema.definitions[schemaName] : {};
}

/**
 * Options for describing the visual style of an image.
 * These options help guide the generation of images with specific aesthetic qualities.
 */
export const IMAGE_STYLE_OPTIONS = [
  'Authentic Smartphone Photo',
  'Webcam Capture',
  'Screen Recording',
  'Lo-fi / Grainy',
  'Vintage Polaroid',
  'Filtered Social Media Post',
  'Unedited & Raw',
];

/**
 * Options for describing the framing of an image.
 * These options help guide the generation of images with specific compositional qualities.
 */
export const FRAMING_OPTIONS = [
  'Selfie Angle',
  'Point-of-View (POV)',
  'Medium Shot',
  'Wide Shot',
  'Candid Close-Up',
  'Over-the-Shoulder',
  'Unstable / Messy Frame',
];

/**
 * Options for describing the lighting conditions of an image.
 * These options help guide the generation of images with specific lighting qualities.
 */
export const IMAGE_LIGHTING_OPTIONS = [
  'Natural Daylight',
  'Indoor Room Light',
  'Direct Flash',
  'Overcast / Flat Light',
  'Backlit Silhouette',
  'Golden Hour',
  'Low Light / Grainy',
];

/**
 * Options for describing the color palette of an image.
 * These options help guide the generation of images with specific color qualities.
 */
export const COLOR_PALETTE_OPTIONS = [
  'Natural & Unfiltered',
  'Vibrant & Saturated',
  'Faded / Vintage Filter',
  'Monochromatic (B&W)',
  'Slightly Desaturated',
  'High Contrast',
];

/**
 * Options for describing the mood of an image.
 * These options help guide the generation of images with specific emotional qualities.
 */
export const MOOD_OPTIONS = [
  'Authentic & Relatable',
  'Candid & Spontaneous',
  'Joyful & Energetic',
  'DIY / How-To',
  'Humorous',
  'Nostalgic',
  'Raw & Unfiltered',
];

/**
 * Options for describing the style of a video.
 * These options help guide the generation of videos with specific aesthetic qualities.
 */
export const VIDEO_STYLE_OPTIONS = [
  'Vlog Style',
  'Testimonial',
  'Unboxing',
  'Tutorial',
  'Behind-the-Scenes',
  'Raw Footage',
  'Reaction Video',
  'Day-in-the-Life',
];

/**
 * Options for describing the type of camera used to capture a video.
 * These options help guide the generation of videos with specific camera qualities.
 */
export const CAMERA_TYPE_OPTIONS = [
  'Smartphone',
  'Webcam',
  'GoPro / Action Cam',
  'DSLR (Handheld)',
  'Consumer Camcorder',
  'Drone (Consumer)',
];

/**
 * Options for describing the movement of a camera used to capture a video.
 * These options help guide the generation of videos with specific camera movement qualities.
 */
export const CAMERA_MOVEMENT_OPTIONS = [
  'Handheld',
  'Shaky',
  'Static / Tripod',
  'Walk and Talk',
  'Quick Pan / Whip Pan',
  'In-camera Zoom',
  'Selfie Stick Movement',
];

/**
 * Options for describing the lighting conditions of a video.
 * These options help guide the generation of videos with specific lighting qualities.
 */
export const VIDEO_LIGHTING_OPTIONS = [
  'Natural Light (Indoors/Outdoors)',
  'Ring Light',
  'Harsh Midday Sun',
  'Available Room Lighting',
  'Low Light',
  'Backlit',
  'Car Interior Lighting',
];

/**
 * Zod schema for a character.
 * This schema is used to validate and generate character data for the prompt.
 */
export const CharacterSchema = z.object({
  name: z.string().describe('Character name'),
  characterId: z.string().optional().describe('Unique character ID'),
  age: z.string().describe('Character age'),
  gender: z.string().describe('Gender'),
  skin: z.string().describe('Skin tone and complexion'),
  // faceShape: z.string().describe("Face shape"),
  eyeDescription: z.string().describe('Eye color and shape'),
  hairDescription: z
    .string()
    .describe('Hair color, length, style, and texture'),
  bodyDescription: z.string().describe('Body build, height, and posture'),

  clothes: z.string().describe('Detailed outfit description'),
  description: z.string().describe('Overall personality summary'),
  voice: z.string().describe('Voice description'),
});

/**
 * JSON schema for a character.
 */
export const CharacterJsonSchema: Promise<any> = getJsonSchema(
  CharacterSchema,
  'CharacterSchema'
);

/**
 * Zod schema for a scene.
 */
export const SceneSchema = z.object({
  id: z
    .number()
    .describe(
      'The number of the scene in appearence. the first scene will be 1 and so on.'
    ),
  description: z
    .string()
    .describe(
      'Detailed description of the setting, characters, and action in the scene.'
    ),
  script: z
    .string()
    .describe(
      'The exact spoken dialogue for this scene, formatted as "Character: Dialogue". If there is no dialogue, leave empty.'
    ),
  characterIds: z
    .array(z.string())
    .describe('List of character IDs present in this scene'),
  background: z
    .string()
    .describe(
      'a hyper detailed description of the background of the scene. where is it taking place'
    ),

  // New Structured Fields for Ideal Prompting
  subject: z.string().describe('Main subject description'),
  action: z.string().describe('Action in the scene'),
  environment: z.string().describe('Setting/background description'),

  camera: z.object({
    angle: z.string().describe('Camera angle'),
    movement: z.string().describe('Camera movement'),
    type: z.string().describe('Camera type'),
    lens: z.string().optional().describe('Lens type'),
  }),

  audio: z.object({
    dialogue: z
      .string()
      .optional()
      .describe(
        'The exact spoken dialogue for this scene, formatted as "Character Name: Dialogue". Do not include actions or descriptions.'
      ),
    ambient: z.string().optional().describe('Background sounds'),
    music: z.string().optional().describe('Musical mood'),
    soundEffects: z.string().optional().describe('Sound effects'),
  }),

  style: z.object({
    artStyle: z.string().describe('Art style'),
    lighting: z.string().describe('Lighting conditions'),
    colorPalette: z.string().describe('Color palette'),
    mood: z.string().describe('Emotional atmosphere'),
  }),

  negativePrompt: z.string().optional().describe('Negative prompt'),

  generatedImage: z.string().optional().describe('Generated image URL'),
  generatedVideo: z.string().optional().describe('Generated video URL'),
});

/**
 * JSON schema for a scene.
 */
export const SceneJsonSchema: Promise<any> = getJsonSchema(
  SceneSchema,
  'SceneSchema'
);

/**
 * Zod schema for a script.
 */
export const ScriptSchema = z.object({
  scenes: z
    .array(SceneSchema)
    .max(6, 'An ad script cannot have more than 6 scenes.')
    .describe(
      'The list of scenes that make up the video script. your goal is to reach consistent story across the scenes and achieve a closer to the story'
    ),
});

/**
 * JSON schema for a script.
 */
export const ScriptJsonSchema: Promise<any> = getJsonSchema(
  ScriptSchema,
  'ScriptSchema'
);

/**
 * Zod schema for guidelines.
 */
export const GuidelinesSchema = z.object({
  prompt: z
    .string()
    .describe('The initial, high-level prompt provided by the user.'),
  adSummary: z
    .string()
    .describe(
      "Project Overview: A concise synopsis of the video's concept and goal."
    ),
  writingStyle: z
    .string()
    .describe(
      "Tone of Voice: The personality and rhythm of the script (e.g., 'Witty and fast-paced', 'Somber and reflective')."
    ),
  visualStyle: z
    .string()
    .describe(
      "Art Direction: The visual language and cinematic approach (e.g., 'Cinematic and moody', 'Handheld documentary style')."
    ),
  characters: z
    .array(CharacterSchema)
    .max(10, 'The character list cannot exceed 10.')
    .describe('A list of all characters available for the ad script (max 10).'),
});

/**
 * JSON schema for guidelines.
 */
export const GuidelinesJsonSchema: Promise<any> = getJsonSchema(
  GuidelinesSchema,
  'GuidelinesSchema'
);
