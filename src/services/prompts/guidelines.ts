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

/**
 * A LangChain prompt template for generating advertising script guidelines.
 * This prompt instructs the language model to act as an expert creative director
 * and create an engaging and consistent ad script based on a user-provided prompt.
 */
const genGuidelinesPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert Creative Director and Producer. Your task is to create a comprehensive **Creative Brief** for a video production based on the user's request.

    The brief must be concise, professional, and actionable. It will serve as the foundation for the script and visual production.

    **Structure of the Brief:**
    1.  **Project Overview (adSummary):** A clear, high-level synopsis of the video's concept, core message, and goal.
    2.  **Tone of Voice (writingStyle):** The personality, rhythm, and emotional resonance of the script (e.g., "Witty and fast-paced," "Somber and reflective," "High-energy commercial").
    3.  **Art Direction (visualStyle):** The visual language, cinematography, lighting, and color palette (e.g., "Cinematic and moody," "Bright and commercial," "Handheld documentary style").
    4.  **Characters:** A list of key characters (if any), with detailed descriptions of their appearance and personality.

    **Instructions:**
    -   Ensure the **Tone of Voice** and **Art Direction** are cohesive and support the **Project Overview**.
    -   Keep descriptions evocative but concise.
    -   Focus on creating a unified vision for the production.`,
  ],
  [
    'user',
    'Please create a Creative Brief for the following request: {prompt}',
  ],
]);

/**
 * Formats the guidelines prompt with the given prompt.
 * @param {string} prompt - The user's prompt for the ad script.
 * @return {Promise<string>} A promise that resolves with the formatted prompt.
 */
export const formatGuidelines = async (prompt: string): Promise<string> =>
  genGuidelinesPrompt.format({ prompt });
