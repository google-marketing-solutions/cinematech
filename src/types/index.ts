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

export interface Character {
  id: number;
  name: string;
  characterId?: string;
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
}

export interface ImageDirectives {
  description: string;
  style: string;
  framing: string;
  lighting: string;
  color: string;
  mood: string;
}

export interface VideoDirectives {
  style: string;
  camera: string;
  movement: string;
  lighting: string;
  transition: string;
}

export interface Scene {
  id: number;
  title: string;
  description: string;
  background: string;
  script: string;
  image: string | null;
  video: string | null;
  imageDirectives: ImageDirectives;
  videoDirectives: VideoDirectives;
  characters: Character[];
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
  generationStatus?: string;
  isUploadingImage?: boolean;
  isUploadingVideo?: boolean;
  isUpscaling?: boolean;
  imageToVideo?: boolean;
}

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
}
