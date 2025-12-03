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

import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { Character } from '@/types';

/**
 * @interface SceneGuidelines
 * @property {string} adSummary - A summary of the ad.
 * @property {string} writingStyle - The writing style for the scenes.
 * @property {string} visualStyle - The visual style for the scenes.
 * @property {Character[]} characters - An array of characters to be included in the scenes.
 */
interface SceneGuidelines {
  adSummary: string;
  writingStyle: string;
  visualStyle: string;
  characters: Character[];
}

/**
 * A LangChain prompt template for generating scenes based on a set of guidelines.
 * This prompt instructs the language model to act as an expert creative director
 * and create detailed scenes for an ad script.
 */
const genScenesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert creative director. Write a an ad script based on the given prompt.
The script should be as engaging as possible and should aim to keep consistency across scenes in storyline and characters.`,
  ],
  [
    'system',
    `
Instructions for writing guidelines:
- keep every scene storyline short but be very detailed when describing it. describe the camera motion. the colors the background and more
- scene length should be max 8 seconds
- include the characters description in the scene
- make the characters look realistic. describe the small inperfection in skin, hair etc.

**Dialogue Instructions:**
- Write dialogue that sounds natural, conversational, and human.
- Avoid robotic, exposition-heavy, or overly formal language unless the character demands it.
- Use subtext; characters shouldn't always say exactly what they mean.
- Ensure dialogue drives the action or reveals character.
- Keep dialogue concise and punchy.

Here is the prompt for creating the guideline:
{adSummary}

These are the characters for the ad:
{characters}

Use the following writing style:
{writingStyle}

Use the following style for images and videos:
{visualStyle}
`,
  ],
  ['user', 'Please create an ad script'],
]);

/**
 * Formats the scenes prompt with the given guidelines.
 * @param {SceneGuidelines} guidelines - The guidelines for generating the scenes.
 * @return {Promise<string>} A promise that resolves with the formatted prompt.
 */
export async function formatScenes(
  guidelines: SceneGuidelines
): Promise<string> {
  return genScenesPrompt.format(guidelines);
}

/**
 * @interface RegenerateSceneGuidelines
 * @property {string} adSummary - A summary of the ad.
 * @property {string} writingStyle - The writing style for the scenes.
 * @property {string} visualStyle - The visual style for the scenes.
 * @property {string} currentScene - The current scene content (JSON string).
 * @property {string} previousScene - The previous scene content (JSON string).
 * @property {string} nextScene - The next scene content (JSON string).
 * @property {Character[]} selectedCharacters - An array of characters to be included in the scene.
 */
interface RegenerateSceneGuidelines {
  adSummary: string;
  writingStyle: string;
  visualStyle: string;
  currentScene: string;
  previousScene: string;
  nextScene: string;
  selectedCharacters: Character[];
  userPrompt?: string;
}

const regenerateScenePrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert creative director. Regenerate the scene based on the given context and selected characters.
The scene should be consistent with the previous and next scenes (if provided) and must include the selected characters.
Maintain the original style and tone but update the content to reflect the changes.`,
  ],
  [
    'system',
    `
Instructions for regenerating the scene:
- Keep the scene length max 8 seconds.
- Be very detailed in the description (camera motion, colors, background).
- Ensure the selected characters are present and their descriptions are integrated.
- If no previous/next scene is provided, treat it as the first/last scene respectively.

**Dialogue Instructions:**
- Write dialogue that sounds natural, conversational, and human.
- Avoid robotic, exposition-heavy, or overly formal language unless the character demands it.
- Use subtext; characters shouldn't always say exactly what they mean.
- Ensure dialogue drives the action or reveals character.
- Keep dialogue concise and punchy.

Context:
Ad Summary: {adSummary}
Writing Style: {writingStyle}
Visual Style: {visualStyle}

Previous Scene:
{previousScene}

Current Scene (to be modified):
{currentScene}

Next Scene:
{nextScene}

Selected Characters (MUST be included):
{selectedCharacters}

User Instructions (Optional):
{userPrompt}
`,
  ],
  ['user', 'Please regenerate the scene'],
]);

/**
 * Formats the regenerate scene prompt with the given guidelines.
 * @param {RegenerateSceneGuidelines} guidelines - The guidelines for regenerating the scene.
 * @return {Promise<string>} A promise that resolves with the formatted prompt.
 */
export async function formatRegenerateScene(
  guidelines: RegenerateSceneGuidelines
): Promise<string> {
  return regenerateScenePrompt.format(guidelines);
}
