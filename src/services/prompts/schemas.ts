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

const IMAGE_STYLE_OPTIONS = [
  'Authentic Smartphone Photo',
  'Webcam Capture',
  'Screen Recording',
  'Lo-fi / Grainy',
  'Vintage Polaroid',
  'Filtered Social Media Post',
  'Unedited & Raw',
];
const FRAMING_OPTIONS = [
  'Selfie Angle',
  'Point-of-View (POV)',
  'Medium Shot',
  'Wide Shot',
  'Candid Close-Up',
  'Over-the-Shoulder',
  'Unstable / Messy Frame',
];
const IMAGE_LIGHTING_OPTIONS = [
  'Natural Daylight',
  'Indoor Room Light',
  'Direct Flash',
  'Overcast / Flat Light',
  'Backlit Silhouette',
  'Golden Hour',
  'Low Light / Grainy',
];
const COLOR_PALETTE_OPTIONS = [
  'Natural & Unfiltered',
  'Vibrant & Saturated',
  'Faded / Vintage Filter',
  'Monochromatic (B&W)',
  'Slightly Desaturated',
  'High Contrast',
];
const MOOD_OPTIONS = [
  'Authentic & Relatable',
  'Candid & Spontaneous',
  'Joyful & Energetic',
  'DIY / How-To',
  'Humorous',
  'Nostalgic',
  'Raw & Unfiltered',
];
const VIDEO_STYLE_OPTIONS = [
  'Vlog Style',
  'Testimonial',
  'Unboxing',
  'Tutorial',
  'Behind-the-Scenes',
  'Raw Footage',
  'Reaction Video',
  'Day-in-the-Life',
];
const CAMERA_TYPE_OPTIONS = [
  'Smartphone',
  'Webcam',
  'GoPro / Action Cam',
  'DSLR (Handheld)',
  'Consumer Camcorder',
  'Drone (Consumer)',
];
const CAMERA_MOVEMENT_OPTIONS = [
  'Handheld',
  'Shaky',
  'Static / Tripod',
  'Walk and Talk',
  'Quick Pan / Whip Pan',
  'In-camera Zoom',
  'Selfie Stick Movement',
];
const VIDEO_LIGHTING_OPTIONS = [
  'Natural Light (Indoors/Outdoors)',
  'Ring Light',
  'Harsh Midday Sun',
  'Available Room Lighting',
  'Low Light',
  'Backlit',
  'Car Interior Lighting',
];

export const CharacterSchema = z.object({
  name: z.string().describe("The character's name."),
  characterId: z
    .string()
    .optional()
    .describe(
      'A unique ID (like a name or UUID) to reference this character. Use as a simple string.'
    ),
  age: z
    .string()
    .describe(
      "Describe the character's age in text, e.g., '28 years old', 'late 40s', 'teenager'."
    ),
  gender: z.string().describe('Is it a male or a female'),
  skin: z
    .string()
    .describe(
      "Describe the skin tone and complexion in one field. e.g., 'Olive skin with light freckles across the nose', 'Pale porcelain, weathered and rugged'."
    ),
  // faceShape: z.string().describe("The shape of the face. e.g., 'Oval', 'Round', 'Square', 'Heart-shaped'."),
  eyeDescription: z
    .string()
    .describe(
      "Describe eye color and shape together. e.g., 'Almond-shaped, deep emerald green', 'Round, icy blue with heavy eyelids'."
    ),
  hairDescription: z
    .string()
    .describe(
      "Combine all hair attributes: color, length, style, and texture. e.g., 'Shoulder-length, wavy, fiery copper red hair', 'A sharp, jet black bob cut'."
    ),
  bodyDescription: z
    .string()
    .describe(
      "Describe the body build, height, and posture together. e.g., 'Tall and slender with an upright, confident posture', 'Petite, athletic, and always in motion'."
    ),

  clothes: z
    .string()
    .describe(
      "Hyper-detailed description of the character's specific outfit for the current scene."
    ),
  description: z
    .string()
    .describe(
      "A high-level summary of the character's overall vibe and personality."
    ),
  voice: z
    .string()
    .describe(
      "A description of the character's voice (not used for image generation)."
    ),
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
    .describe('The script for this scene, including dialogue and actions.'),
  characters: z
    .array(CharacterSchema)
    .describe('a list of characters in the scene'),
  background: z
    .string()
    .describe(
      'a hyper detailed description of the background of the scene. where is it taking place'
    ),
  audio: z
    .string()
    .describe('THe audio sounds that should play in the background'),
  imageDirectives: z.object({
    description: z
      .string()
      .describe(
        'A detailed description of the first frame of the scene. make it clear no subtitles should show in the video'
      ),
    style: z
      .string()
      .describe(`Artistic style. Suggested: ${IMAGE_STYLE_OPTIONS.join(', ')}`),
    framing: z
      .string()
      .describe(`Camera shot type. Suggested: ${FRAMING_OPTIONS.join(', ')}`),
    lighting: z
      .string()
      .describe(
        `Lighting style. Suggested: ${IMAGE_LIGHTING_OPTIONS.join(', ')}`
      ),
    color: z
      .string()
      .describe(
        `Color palette. Suggested: ${COLOR_PALETTE_OPTIONS.join(', ')}`
      ),
    mood: z
      .string()
      .describe(`Emotional tone. Suggested: ${MOOD_OPTIONS.join(', ')}`),
  }),

  videoDirectives: z.object({
    style: z
      .string()
      .describe(`Video style. Suggested: ${VIDEO_STYLE_OPTIONS.join(', ')}`),
    camera: z
      .string()
      .describe(`Camera type. Suggested: ${CAMERA_TYPE_OPTIONS.join(', ')}`),
    movement: z
      .string()
      .describe(
        `Camera movement. Suggested: ${CAMERA_MOVEMENT_OPTIONS.join(', ')}`
      ),
    lighting: z
      .string()
      .describe(
        `Lighting style. Suggested: ${VIDEO_LIGHTING_OPTIONS.join(', ')}`
      ),
    transition: z
      .string()
      .optional()
      .describe(
        'How the scene is moving from the previous one to the current one'
      ),
  }),
  generatedImage: z
    .string()
    .optional()
    .describe('URL/Base64 of the generated still image.'),
  generatedVideo: z
    .string()
    .optional()
    .describe('URL of the generated video clip.'),
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
  adSummary: z.string().describe("A short summary of the ad's plot."),
  writingStyle: z
    .string()
    .describe(
      "Description of the script's writing style, e.g., 'Witty and fast-paced like a Taika Waititi film.'"
    ),
  visualStyle: z
    .string()
    .describe(
      "Description of the visual style, e.g., 'Cinematic and moody like a Denis Villeneuve film.'"
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
