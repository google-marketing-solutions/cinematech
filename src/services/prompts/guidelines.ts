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
    `You are an expert creative director. Write a an ad script based on the given prompt.
The script should be as engaging as possible and should aim to keep consistency across scenes in storyline and characters.

Instructions for writing guidelines:
- keep the story short and consice
- writing style nad image style should match from an artistic standpoint
- the guideline should reflect clearly the overview of the story

Here is the prompt for creating the guideline:`,
  ],
  ['user', 'Please create an ad script for the following prompt: {prompt}'],
]);

/**
 * Formats the guidelines prompt with the given prompt.
 * @param {string} prompt - The user's prompt for the ad script.
 * @return {Promise<string>} A promise that resolves with the formatted prompt.
 */
export const formatGuidelines = async (prompt: string): Promise<string> =>
  genGuidelinesPrompt.format({ prompt });
