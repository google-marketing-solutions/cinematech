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
import { buildVeoPrompt } from '../prompts/builders';
import { Logger } from '../logger.ts';
import type { IdealScenePrompt } from '../prompts/types';

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
];

/**
 * Interface for a Google Cloud Long Running Operation.
 */
interface LongRunningOperation {
  name: string;
  done?: boolean;
  error?: {
    code?: number;
    message?: string;
    details?: unknown[];
  };
  response?: unknown;
  metadata?: unknown;
}

/**
 * Calls a Vertex AI API endpoint.
 * @param {string} endpoint - The API endpoint to call.
 * @param {Record<string, unknown>} body - The request body.
 * @param {string} [locationId=''] - The location ID.
 * @param {'POST' | 'GET'} [method='POST'] - The HTTP method to use.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<any>} A promise that resolves with the API response.
 * @throws {Error} If the API call fails.
 */
async function callVertexApi(
  endpoint: string,
  body: Record<string, unknown>,
  locationId = '',
  method: 'POST' | 'GET' = 'POST',
  signal?: AbortSignal
): Promise<unknown> {
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
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        errorBody.error?.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    Logger.error('VertexApi', 'Error calling Vertex AI API', error);
    throw error;
  }
}

/**
 * Creates a video from a series of scenes using the Vertex AI API.
 * This function initiates a long-running video generation operation and polls for its completion.
 * @param {Scene[]} scenes - An array of scenes to be included in the video.
 * @param {string} resolution - The resolution of the video.
 * @param {string} aspectRatio - The aspect ratio of the video.
 * @param {string} [durationSeconds='8'] - The duration of the video in seconds.
 * @param {(status: string, operation?: LongRunningOperation) => void} onStatusUpdate - A callback function to report the status of the video generation.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<string>} A promise that resolves with the generated video as a base64 encoded string.
 * @throws {Error} If the video URI is not found in the operation response.
 */
export async function createVideo(
  scenes: Scene[],
  resolution: '720p' | '1080p',
  aspectRatio: '16:9' | '9:16',
  durationSeconds = '8',
  onStatusUpdate: (status: string, operation?: LongRunningOperation) => void,
  signal?: AbortSignal
): Promise<string> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexVideoModel;
  const endpoint = `${modelId}:predictLongRunning`;
  const scene = scenes[0] as unknown as IdealScenePrompt; // Temporary cast until types are fully propagated

  const prompt = buildVeoPrompt(scene);
  const instances: Array<Record<string, unknown>> = [{ prompt }];

  const inputScene = scenes[0];

  if (inputScene.imageToVideo && inputScene.image) {
    const mimeType =
      inputScene.image.toLowerCase().endsWith('.jpg') ||
      inputScene.image.toLowerCase().endsWith('.jpeg')
        ? 'image/jpeg'
        : 'image/png';

    if (inputScene.image.startsWith('gs://')) {
      instances[0]['image'] = {
        gcsUri: inputScene.image,
        mimeType,
      };
    } else {
      instances[0]['image'] = {
        bytesBase64Encoded: await downloadFileAsBase64(inputScene.image),
        mimeType,
      };
    }
  }

  if (inputScene.lastFrame) {
    const mimeType =
      inputScene.lastFrame.toLowerCase().endsWith('.jpg') ||
      inputScene.lastFrame.toLowerCase().endsWith('.jpeg')
        ? 'image/jpeg'
        : 'image/png';

    if (inputScene.lastFrame.startsWith('gs://')) {
      instances[0]['lastFrame'] = {
        gcsUri: inputScene.lastFrame,
        mimeType,
      };
    } else {
      // Fallback if lastFrame is not a GCS URI (though it should be)
      instances[0]['lastFrame'] = {
        bytesBase64Encoded: await downloadFileAsBase64(inputScene.lastFrame),
        mimeType,
      };
    }
  }

  const body = {
    instances,
    parameters: {
      aspectRatio,
      sampleCount: 1,
      durationSeconds: Number(durationSeconds),
      personGeneration: 'allow_all',
      addWatermark: true,
      includeRaiReason: true,
      generateAudio: true,
      resolution,
    },
  };

  const operation = await callVertexApi(endpoint, body, '', 'POST', signal) as LongRunningOperation;
  onStatusUpdate('Video generation started...', operation);

  const operationName = operation.name;
  const result = await pollOperation(operationName, onStatusUpdate, signal) as { videos?: Array<{ bytesBase64Encoded: string }> };

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
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<unknown>} A promise that resolves with the result of the completed operation.
 * @throws {Error} If the operation fails.
 */
async function pollOperation(
  operationName: string,
  onStatusUpdate: (status: string) => void,
  signal?: AbortSignal
): Promise<unknown> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexVideoModel;
  const endpoint = `${modelId}:fetchPredictOperation`;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (signal?.aborted) {
        clearInterval(interval);
        reject(new Error('Operation aborted'));
        return;
      }
      try {
        const result = await callVertexApi(
          endpoint,
          { operationName },
          '',
          'POST',
          signal
        ) as LongRunningOperation;

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

    if (signal) {
      signal.addEventListener('abort', () => {
        clearInterval(interval);
        reject(new Error('Operation aborted'));
      });
    }
  });
}

/**
 * @interface GenerateContentOptions
 * @property {string} [modelId='gemini-1.5-flash'] - The ID of the model to use for content generation.
 * @property {string} [generateContentApi='generateContent'] - The API endpoint for content generation.
 * @property {unknown} [generationConfig] - The configuration for content generation.
 * @property {unknown[]} [safetySettings] - The safety settings for content generation.
 */
interface GenerateContentOptions {
  modelId?: string;
  generateContentApi?: string;
  generationConfig?: unknown;
  safetySettings?: unknown[];
}

/**
 * Generates content using a specified model and prompt.
 * @param {string} modelId - The ID of the model to use.
 * @param {string} userPrompt - The user's prompt for content generation.
 * @param {unknown} responseJsonSchema - The JSON schema for the expected response.
 * @param {GenerateContentOptions} [options={}] - The options for content generation.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<unknown>} A promise that resolves with the generated content.
 */
export async function generateContent(
  modelId: string,
  userPrompt: string,
  responseJsonSchema: unknown,
  options: GenerateContentOptions = {},
  signal?: AbortSignal
): Promise<unknown> {
  const {
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
    generationConfig,
    safetySettings,
  };

  return await callVertexApi(endpoint, payload, '', 'POST', signal);
}

/**
 * Generates an image based on a prompt using the Vertex AI API.
 * @param {string} prompt - The prompt to use for image generation.
 * @param {string} [aspectRatio='16:9'] - The aspect ratio of the image.
 * @param {object} [parameters={}] - Additional parameters for the image generation request.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<unknown>} A promise that resolves with the generated image data.
 */
export async function generateImage(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  parameters = {},
  signal?: AbortSignal
): Promise<unknown> {
  const configStore = useConfigStore();
  const modelId = configStore.vertexImageModel;
  const apiUrl = `${modelId}:predict`;

  const defaultParameters = {
    aspectRatio,
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

  return await callVertexApi(apiUrl, requestBody, '', 'POST', signal);
}

/**
 * Generates images and text based on a series of content parts using a Gemini model.
 * This function is useful for multi-modal generation where the input can include both text and images,
 * and the output can also contain generated images alongside text.
 * @param {Content[]} contents - An array of content parts, each with a role ('user') and parts containing text or inlineData.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<unknown>} A promise that resolves with the generated content, potentially including images.
 * @throws {Error} If the provided contents are invalid.
 */
export async function generateImageFromContent(
  contents: Content[],
  signal?: AbortSignal
): Promise<unknown> {
  const modelId = 'gemini-3-pro-image-preview';
  const generateContentApi = 'generateContent';
  const endpoint = `${modelId}:${generateContentApi}`;
  // Logger.debug('VertexApi', 'generateImageFromContent contents', contents);
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

  return await callVertexApi(endpoint, payload, 'global', 'POST', signal);
}

/**
 * Upscales an image using the Vertex AI API.
 * @param {string} image - The image to upscale, as a GCS URI or a base64 encoded string.
 * @param {string} [upscaleFactor='x2'] - The factor by which to upscale the image.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<unknown>} A promise that resolves with the upscaled image data.
 */
export async function upscaleImage(
  image: string,
  upscaleFactor = 'x2',
  signal?: AbortSignal
): Promise<unknown> {
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

  return await callVertexApi(apiUrl, requestBody, '', 'POST', signal);
}


/**
 * Generates music based on a prompt using the Vertex AI API.
 * @param {string} text - The text to generate speech from.
 * @param {string} [voiceName='Kore'] - The name of the voice to use.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<string>} A promise that resolves with the generated music as a base64 encoded string.
 */
export async function generateSpeech(
  text: string,
  voiceName = 'Kore',
  signal?: AbortSignal
): Promise<string> {
  const configStore = useConfigStore();
  const projectId = configStore.googleCloudProjectId;
  const accessToken = await getAccessToken();

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize`;

  const body = {
    input: {
      text,
    },
    voice: {
      languageCode: 'en-US',
      name: voiceName,
      model_name: 'gemini-2.5-flash-tts',
    },
    audioConfig: {
      audioEncoding: 'MP3',
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        errorBody.error?.message || `TTS request failed: ${response.status}`
      );
    }

    const result = await response.json();
    if (!result.audioContent) {
      throw new Error('TTS response missing audioContent');
    }
    return result.audioContent;
    return result.audioContent;
  } catch (error) {
    Logger.error('VertexApi', 'Error generating speech', error);
    throw error;
  }
}

/**
 * Generates music based on a prompt using the Vertex AI API (Lyria).
 * @param {string} prompt - The prompt to use for music generation.
 * @param {AbortSignal} [signal] - The abort signal.
 * @return {Promise<string>} A promise that resolves with the generated music as a base64 encoded string.
 */
export async function generateMusic(
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const configStore = useConfigStore();
  const projectId = configStore.googleCloudProjectId;
  const locationId = configStore.gcpLocationId;

  // Lyria endpoint
  const endpoint = `https://${locationId}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${locationId}/publishers/google/models/lyria-002:predict`;

  const body = {
    instances: [
      {
        prompt,
      },
    ],
    parameters: {
      sampleCount: 1,
    },
  };

  try {
    const accessToken = await getAccessToken();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        errorBody.error?.message ||
          `Music generation failed: ${response.status}`
      );
    }

    const result = await response.json();
    if (result.predictions && result.predictions.length > 0) {
      return (
        result.predictions[0].bytesBase64Encoded ||
        result.predictions[0].audioContent
      );
    } else {
      throw new Error('No music generated in response');
    }
  } catch (error) {
    Logger.error('VertexApi', 'Error generating music', error);
    throw error;
  }
}
