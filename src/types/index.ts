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

/**
 * Represents a character in the story.
 */
export interface Character {
  name: string;
  characterId: string;
  age: string;
  gender: string;
  skin: string;
  faceShape: string;
  eyeDescription: string;
  hairDescription: string;
  bodyDescription: string;
  clothes: string;
  description: string;
  voice: string;
  image?: string;
  isGeneratingImage?: boolean;
  isUploadingImage?: boolean;
  isDeletingImage?: boolean;
}

/**
 * Directives for generating an image.
 */
export interface ImageDirectives {
  description: string;
  style: string;
  framing: string;
  lighting: string;
  color: string;
  mood: string;
}

/**
 * Directives for generating a video.
 */
export interface VideoDirectives {
  style: string;
  camera: string;
  movement: string;
  lighting: string;
  transition: string;
}

/**
 * Represents the controls and parameters for a camera within a scene.
 * This is used to describe how the scene is framed and captured.
 */
export interface CameraControl {
  angle: string;
  movement: string;
  type: string;
  lens?: string;
}

/**
 * Represents the audio elements and parameters for a scene.
 * This is used to describe the sound elements of the scene.
 */
export interface AudioPrompt {
  dialogue?: string;
  ambient?: string;
  music?: string;
  soundEffects?: string;
}

/**
 * Represents the visual style and parameters for a scene.
 * This is used to describe the visual elements of the scene.
 */
export interface VisualStyle {
  artStyle: string;
  lighting: string;
  colorPalette: string;
  mood: string;
}

/**
 * Represents a single scene in the story.
 */
export interface Scene {
  id: number;
  title: string;
  description: string;
  background: string; // Maps to environment in schema? Schema has environment.
  script: string;

  // New Structured Fields
  subject: string;
  action: string;
  environment: string;
  camera: CameraControl;
  audio: AudioPrompt;
  style: VisualStyle;
  negativePrompt?: string;

  image?: string;
  video?: string;
  lastFrame?: string;
  durationSeconds?: string;
  type?: 'default' | 'first-to-last';

  // Legacy fields
  imageDirectives?: ImageDirectives;
  videoDirectives?: VideoDirectives;

  characters: Character[];
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  isRegenerating?: boolean;
  generationStatus?: string;
  isUploadingImage?: boolean;
  isUploadingVideo?: boolean;
  isUpscaling?: boolean;
  imageToVideo?: boolean;
  isUploadingLastFrame?: boolean;
}

/**
 * Represents the overall state of the story generation.
 */
export interface StoryState {
  prompt: string;
  summary: string;
  writingStyle: string;
  visualStyle: string;
  characters: Character[];
  scenes: Scene[];
  loading: boolean;
  error: string | null;
  isEditModalVisible: boolean;
  currentScene: Scene | null;
  finalVideo?: string;
}

/**
 * Represents inlined data, typically for multimedia.
 */
export interface InlineData {
  mimeType: string;
  data: string;
}

/**
 * Represents a part of a multi-part content, can be text or inline data.
 */
export interface Part {
  inlineData?: InlineData;
  text?: string;
}

/**
 * Represents a piece of content in a conversation, with a role and parts.
 */
export interface Content {
  role: 'user' | 'model';
  parts: Part[];
}

/**
 * Represents the resolution of a video.
 */
export enum VideoResolution {
  HD = '720p',
  FullHD = '1080p',
}

/**
 * Represents the aspect ratio of a video.
 */
export enum VideoAspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

/**
 * Represents a node in the file system (GCS).
 */
export interface FileSystemNode {
  id: string; // gcsUri or prefix
  name: string;
  type: 'file' | 'folder';
  gcsUri: string;
  mimeType?: string;
  size?: number;
  updated?: string;
  duration?: number;
}

/**
 * Represents a track in a video editing timeline, which can hold video, audio, or text clips.
 */
export interface Track {
  id: string;
  type: 'video' | 'audio' | 'text';
  name: string;
  isMuted: boolean;
  isLocked: boolean;
}

/**
 * Represents a single clip within a Track in a video editing timeline.
 */
export interface Clip {
  id: string;
  trackId: string;
  assetId: string | number; // Maps to Scene.id (number) or GCS URI (string)
  startTime: number; // In seconds
  duration: number; // In seconds
  offset: number; // In seconds (start time within the source asset)
  mediaType?: 'video' | 'image' | 'text' | 'audio';
  // Visual properties
  scale?: number;
  position?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
  // Audio properties
  volume?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  // Effects
  effects?: string[];
  // Transition
  transition?: {
    type:
      | 'fade'
      | 'wipeleft'
      | 'wiperight'
      | 'slideleft'
      | 'slideright'
      | 'circlecrop';
    duration: number; // in seconds
  };
}

/**
 * Represents a transition between scenes.
 */
export interface Transition {
  id: string;
  name: string;
  type:
    | 'fade'
    | 'wipeleft'
    | 'wiperight'
    | 'slideleft'
    | 'slideright'
    | 'circlecrop';
  icon: string;
}

/**
 * Represents a part of the content in a Gemini response.
 */
export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Represents a candidate in a Gemini response.
 */
export interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: string;
  };
  finishReason?: string;
  citationMetadata?: unknown;
}

/**
 * Represents the response from the Gemini API.
 */
export interface GeminiResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: unknown;
}

/**
 * Represents a prediction in an Imagen response.
 */
export interface ImagenPrediction {
  bytesBase64Encoded: string;
  mimeType: string;
}

/**
 * Represents the response from the Imagen API.
 */
export interface ImagenResponse {
  predictions: ImagenPrediction[];
}
