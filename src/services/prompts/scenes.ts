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
export const formatScenes = async (
  guidelines: SceneGuidelines
): Promise<string> => genScenesPrompt.format(guidelines);
