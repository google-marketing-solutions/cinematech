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

import { getAccessToken } from '../auth.ts';
import { downloadFileAsBase64 } from './gcs.ts';
import { useConfigStore } from '@/stores/config.ts';
import type { Scene, Content } from '@/types';

const DefaultSecuritySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_IMAGE_HATE',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_IMAGE_HARASSMENT',
        threshold: 'OFF',
      },
      {
        category: 'HARM_CATEGORY_IMAGE_SEXUALLY_EXPLICIT',
        threshold: 'OFF',
      },
    ]

/**
 * Calls a Vertex AI API endpoint.
 * @param {string} endpoint - The API endpoint to call.
 * @param {any} body - The request body.
 * @param {'POST' | 'GET'} [method='POST'] - The HTTP method to use.
 * @return {Promise<any>} A promise that resolves with the API response.
 * @throws {Error} If the API call fails.
 */
async function callVertexApi(
  endpoint: string,
  body: any,
  locationId = '',
  method: 'POST' | 'GET' = 'POST'
): Promise<any> {
  const configStore = useConfigStore();
  const accessToken = await getAccessToken();
  const projectId = configStore.googleCloudProjectId;
  locationId = locationId || configStore.gcpLocationId;
  const baseUrl = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/${locationId}/publishers/google/models`;
  try {
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        errorBody.error?.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Vertex AI API:', error);
    throw error;
  }
}

/**
 * Creates a video from a series of scenes using the Vertex AI API.
 * This function initiates a long-running video generation operation and polls for its completion.
 * @param {Scene[]} scenes - An array of scenes to be included in the video.
 * @param {(status: string, operation?: any) => void} onStatusUpdate - A callback function to report the status of the video generation.
 * @return {Promise<string>} A promise that resolves with the generated video as a base64 encoded string.
 * @throws {Error} If the video URI is not found in the operation response.
 */
export async function createVideo(
  scenes: Scene[],
  onStatusUpdate: (status: string, operation?: any) => void
): Promise<string> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexVideoModel;
  const endpoint = `${modelId}:predictLongRunning`;
  const scene = scenes[0];
  console.log(scene);

  const instances: any[] = [{ prompt: JSON.stringify(scene) }];
  if (scene.imageToVideo && scene.image) {
    instances[0]['image'] = {
      bytesBase64Encoded: await downloadFileAsBase64(scene.image),
      mimeType: 'image/jpeg',
    };
  }

  const body = {
    instances: instances,
    parameters: {
      aspectRatio: '16:9',
      sampleCount: 1,
      durationSeconds: '8',
      personGeneration: 'allow_all',
      addWatermark: true,
      includeRaiReason: true,
      generateAudio: true,
      resolution: '720p',
    },
  };

  const operation = await callVertexApi(endpoint, body);
  onStatusUpdate('Video generation started...', operation);

  const operationName = operation.name;
  const result = await pollOperation(operationName, onStatusUpdate);

  if (result && result.videos) {
    return result.videos[0].bytesBase64Encoded;
  } else {
    throw new Error('Video URI not found in the operation response.');
  }
}

/**
 * Polls a long-running operation on the Vertex AI API until it completes.
 * @param {string} operationName - The name of the operation to poll.
 * @param {(status: string) => void} onStatusUpdate - A callback function to report the status of the operation.
 * @return {Promise<any>} A promise that resolves with the result of the completed operation.
 * @throws {Error} If the operation fails.
 */
async function pollOperation(
  operationName: string,
  onStatusUpdate: (status: string) => void
): Promise<any> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexVideoModel;
  const endpoint = `${modelId}:fetchPredictOperation`;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const result = await callVertexApi(endpoint, { operationName });

        if (result.done) {
          clearInterval(interval);
          if (result.error) {
            reject(new Error(result.error.message));
          } else {
            resolve(result.response);
          }
        } else {
          onStatusUpdate('Video is processing...');
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 5000);
  });
}

/**
 * @interface GenerateContentOptions
 * @property {string} [modelId='gemini-1.5-flash'] - The ID of the model to use for content generation.
 * @property {string} [generateContentApi='generateContent'] - The API endpoint for content generation.
 * @property {any} [generationConfig] - The configuration for content generation.
 * @property {any[]} [safetySettings] - The safety settings for content generation.
 */
interface GenerateContentOptions {
  modelId?: string;
  generateContentApi?: string;
  generationConfig?: any;
  safetySettings?: any[];
}

/**
 * Generates content using a specified model and prompt.
 * @param {string} userPrompt - The user's prompt for content generation.
 * @param {any} responseJsonSchema - The JSON schema for the expected response.
 * @param {GenerateContentOptions} [options={}] - The options for content generation.
 * @return {Promise<any>} A promise that resolves with the generated content.
 */
export async function generateContent(
  userPrompt: string,
  responseJsonSchema: any,
  options: GenerateContentOptions = {}
): Promise<any> {
  const {
    modelId = 'gemini-2.5-flash',
    generateContentApi = 'generateContent',
    generationConfig = {
      temperature: 0,
      maxOutputTokens: 65536,
      topP: 0.95,
      responseJsonSchema,
      responseMimeType: 'application/json',
    },
    safetySettings = [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  } = options;

  const endpoint = `${modelId}:${generateContentApi}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],
    generationConfig: generationConfig,
    safetySettings: safetySettings,
  };

  return await callVertexApi(endpoint, payload);
}

/**
 * Generates an image based on a prompt using the Vertex AI API.
 * @param {string} prompt - The prompt to use for image generation.
 * @param {object} [parameters={}] - Additional parameters for the image generation request.
 * @return {Promise<any>} A promise that resolves with the generated image data.
 */
export async function generateImage(
  prompt: string,
  parameters = {}
): Promise<any> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexImageModel;
  const apiUrl = `${modelId}:predict`;

  const defaultParameters = {
    aspectRatio: '16:9',
    sampleCount: 1,
    negativePrompt: '',
    enhancePrompt: false,
    personGeneration: 'allow_all',
    safetySetting: 'block_few',
    includeRaiReason: true,
    language: 'auto',
  };

  const requestBody = {
    instances: [{ prompt }],
    parameters: { ...defaultParameters, ...parameters },
  };

  return await callVertexApi(apiUrl, requestBody);
}

/**
 * Generates images and text based on a series of content parts using a Gemini model.
 * This function is useful for multi-modal generation where the input can include both text and images,
 * and the output can also contain generated images alongside text.
 * @param {Content[]} contents - An array of content parts, each with a role ('user') and parts containing text or inlineData.
 * @return {Promise<any>} A promise that resolves with the generated content, potentially including images.
 * @throws {Error} If the provided contents are invalid.
 */
export async function generateImageFromContent(
  contents: Content[]
): Promise<any> {
  const modelId = 'gemini-2.5-flash-image-preview';
  const generateContentApi = 'streamGenerateContent';
  const endpoint = `${modelId}:${generateContentApi}`;
  console.log('contents', contents);
  if (
    !contents.every(
      (content) =>
        content.role === 'user' &&
        content.parts.every((part) => part.text || part.inlineData)
    )
  ) {
    throw new Error(
      'Invalid contents: all parts must be from the user and contain either text or inlineData'
    );
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 32768,
      responseModalities: ['TEXT', 'IMAGE'],
      topP: 0.95,
    },
    safetySettings: DefaultSecuritySettings,
  };

  return await callVertexApi(endpoint, payload, 'global');
}

/**
 * Upscales an image using the Vertex AI API.
 * @param {string} image - The image to upscale, as a GCS URI or a base64 encoded string.
 * @param {string} [upscaleFactor='x2'] - The factor by which to upscale the image.
 * @return {Promise<any>} A promise that resolves with the upscaled image data.
 */
export async function upscaleImage(
  image: string,
  upscaleFactor = 'x2'
): Promise<any> {
  const modelId = 'imagegeneration@002';
  const apiUrl = `${modelId}:predict`;

  const instance: {
    prompt: string;
    image: { gcsUri?: string; bytesBase64Encoded?: string };
  } = {
    prompt: 'a high quality, detailed, sharp, 4k image',
    image: {},
  };

  if (image.startsWith('gs://')) {
    instance.image.gcsUri = image;
  } else {
    instance.image.bytesBase64Encoded = image;
  }

  const requestBody = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      mode: 'upscale',
      upscaleConfig: {
        upscaleFactor,
      },
    },
  };

  return await callVertexApi(apiUrl, requestBody);
}
