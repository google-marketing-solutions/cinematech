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
import { defineStore } from 'pinia';
import { useToast } from '@/composables/useToast';
import { formatGuidelines } from '../services/prompts/guidelines.ts';
import { formatScenes } from '../services/prompts/scenes.ts';
import {
  createVideo,
  generateContent,
  upscaleImage,
  generateImageFromContent,
  generateImage,
} from '../services/gcp/vertex.ts';
import {
  saveBase64ToGCS,
  uploadTypedFileToGCS,
  deleteFileFromGCS,
  downloadFileAsBase64,
  uploadFileToGCS,
  downloadFileFromGCS,
} from '@/services/gcp/gcs.ts';
import { getLastFrame } from '../services/video.ts';
import {
  GuidelinesJsonSchema,
  ScriptJsonSchema,
} from '@/services/prompts/schemas.ts';
import { createFinalVideo } from '../services/ffmpeg.ts';
import { useVideoStore } from './video.ts';
import { useProjectStore } from './project.ts';
import { useConfigStore } from './config.ts';
import type { StoryState, Scene, Character, Content } from '@/types';

// Add resolution and aspectRatio to the StoryState interface
declare module '@/types' {
  interface StoryState {
    resolution: '720p' | '1080p';
    aspectRatio: '16:9' | '9:16';
  }
}

const generateImageScenePrompt = `
You will be provided with two inputs:
1.  A JSON object detailing the 'scene_description' (setting, action, mood, composition).
2.  An optional list of 'character_references' (images) and their corresponding 'descriptions' within the JSON.

Your task is to generate a high-fidelity image matching the 'scene_description'.

**Critical Instruction: Character Consistency**

If 'character_references' are provided, your **highest priority** is to preserve the identity and likeness of those characters.
* **Identity (Must Match Reference):** Facial features, facial structure, skin tone, eye color, hairstyle, and permanent features (e.g., scars, tattoos).
* **Scene-Specifics (From JSON):** The characters' actions, expressions, and clothing should be dictated by the 'scene_description' and their specific 'description' in the JSON.

**Conflict Resolution:**
* **DO:** Apply the JSON's described clothing, expression, and action *to* the character from the reference image.
* **DO NOT:** Change the character's core identity (face, hair, body type) to match the JSON if it conflicts with the reference image. The reference image *always* wins for identity.
2. Advanced Prompt (Structured for Robustness)
This version uses a more formal structure, which many models follow more reliably, especially for complex, multi-part instructions.

[System Prompt]

### ROLE
You are an expert image generation engine specializing in high-fidelity scene rendering with perfect character consistency.

### INPUTS
1.  'scene_request' (JSON): A JSON object containing:
    * 'scene_description' (string): A detailed description of the overall image, including setting, action, lighting, mood, and composition.
    * 'characters' (array, optional): A list of character objects, each with:
        * 'id' (string): A unique identifier for the character.
        * 'description' (string): A description of this character's specific action, expression, and clothing *for this scene*.
2.  'character_references' (Dictionary/Map, optional): A key-value map where each key is a 'id' from the 'characters' array and the value is the URL or data of a high-resolution reference image for that character.

### TASK
Generate a single, photorealistic (or specified style) image that synthesizes the 'scene_request' (JSON) and the 'character_references'.

### HIERARCHY OF IMPORTANCE
Your processing must follow this strict order of priority:

1.  **Level 1 (Highest Priority): Character Identity**
    * The face, hairstyle, skin tone, body type, and all identifying features of any character in the 'characters' array **MUST** be an exact match to their corresponding 'character_references' image.
    * This is non-negotiable. Likeness is the most critical goal.

2.  **Level 2: Character Context (from JSON)**
    * The 'description' field for each character in the JSON dictates their *in-scene* appearance and behavior.
    * You MUST apply the specified **clothing**, **expression**, and **action** from this JSON description *to the reference character's body*.

3.  **Level 3: Scene Composition (from JSON)**
    * The overall 'scene_description' (setting, lighting, camera angle, mood) from the JSON dictates the final composition.
    * You must place the fully-realized, consistent characters (from Level 1 + Level 2) into this environment.

### SUMMARY
Create the scene from the JSON, but populate it with characters who look *exactly* like the reference images, while wearing the clothes and performing the actions described in the JSON.
`

/**
 * Returns the initial state for the story store.
 * @return {Omit<StoryState, 'loading' | 'error' | 'isEditModalVisible' | 'currentScene'>} The initial state.
 */
const getInitialState = (): Omit<
  StoryState,
  'loading' | 'error' | 'isEditModalVisible' | 'currentScene'
> => ({
  prompt: '',
  summary: '',
  writingStyle: '',
  visualStyle: '',
  characters: [],
  scenes: [],
  resolution: '1080p',
  aspectRatio: '16:9',
});

/**
 * Pinia store for managing the story creation process.
 */
export const useStoryStore = defineStore('story', {
  /**
   * The initial state of the store.
   * @return {StoryState} The initial state.
   */
  state: (): StoryState => ({
    ...getInitialState(),
    loading: false,
    error: null,
    isEditModalVisible: false,
    currentScene: null,
  }),
  actions: {
    /**
     * Loads a project from GCS.
     * @param {string} projectId - The ID of the project to load.
     */
    async loadProject(projectId: string) {
      this.loading = true;
      this.error = null;
      try {
        const configStore = useConfigStore();
        const gcsUri = `gs://${configStore.gcsBucketName}/${projectId}/project.json`;
        const projectData = await downloadFileFromGCS(gcsUri, 'json');

        Object.assign(this, getInitialState());

        if (projectData) {
          this.prompt = projectData.prompt || '';
          this.summary = projectData.summary || '';
          this.writingStyle = projectData.writingStyle || '';
          this.visualStyle = projectData.visualStyle || '';
          this.characters = projectData.characters || [];
          this.scenes = projectData.scenes || [];
          this.finalVideo = projectData.finalVideo || undefined;
        }
      } catch (error: any) {
        if (error.message.includes('404')) {
          Object.assign(this, getInitialState());
        } else {
          this.error = `Failed to load project data: ${error.message}`;
          console.error(this.error);
        }
      } finally {
        this.loading = false;
      }
    },
    /**
     * Saves the current project to GCS.
     */
    async saveProject(projectId?: string) {
      const projectStore = useProjectStore();
      const targetProjectId = projectId || projectStore.currentProjectId;
      if (!targetProjectId) return;

      try {
        const configStore = useConfigStore();
        const projectData = {
          prompt: this.prompt,
          summary: this.summary,
          writingStyle: this.writingStyle,
          visualStyle: this.visualStyle,
          characters: this.characters,
          scenes: this.scenes,
          finalVideo: this.finalVideo,
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], {
          type: 'application/json',
        });
        const file = new File([blob], 'project.json', {
          type: 'application/json',
        });

        await uploadFileToGCS(
          file,
          'project.json',
          configStore.gcsBucketName,
          targetProjectId
        );
      } catch (error: any) {
        this.error = `Failed to save project: ${error.message}`;
        console.error(this.error);
      }
    },
    /**
     * Adds a new character to the story.
     */
    addCharacter() {
      this.characters.push({
        name: 'New Character',
        characterId: `char-${Date.now()}`,
        age: '',
        gender: '',
        skin: '',
        faceShape: '',
        eyeDescription: '',
        hairDescription: '',
        bodyDescription: '',
        clothes: '',
        description: 'New Description',
        voice: '',
        image: 'https://via.placeholder.com/150',
      });
    },
    /**
     * Updates a character in the story.
     * @param {Character} updatedCharacter - The updated character object.
     */
    updateCharacter(updatedCharacter: Character) {
      const index = this.characters.findIndex(
        (c) => c.characterId === updatedCharacter.characterId
      );
      if (index !== -1) {
        this.characters[index] = updatedCharacter;
      }

      // Update the character in all scenes
      this.scenes.forEach((scene) => {
        const characterInScene = scene.characters.find(
          (c) => c.characterId === updatedCharacter.characterId
        );
        if (characterInScene) {
          const updatedCharacters = scene.characters.map((c) =>
            c.characterId === updatedCharacter.characterId
              ? updatedCharacter
              : c
          );
          this.updateScene({ ...scene, characters: updatedCharacters });
        }
      });
    },
    /**
     * Sets the prompt for the story.
     * @param {string} prompt - The prompt.
     */
    setPrompt(prompt: string) {
      this.prompt = prompt;
    },
    /**
     * Creates a new story from the prompt.
     */
    async createStory() {
      this.loading = true;
      this.error = null;
      this.summary = '';
      this.writingStyle = '';
      this.visualStyle = '';
      this.characters = [];
      this.scenes = [];
      try {
        const res = await generateContent(
          await formatGuidelines(this.prompt),
          await GuidelinesJsonSchema
        );
        const {
          adSummary,
          writingStyle,
          visualStyle,
          characters = [],
        } = JSON.parse(res.candidates[0].content.parts[0].text);
        this.summary = adSummary;
        this.writingStyle = writingStyle;
        this.visualStyle = visualStyle || '';
        this.characters.push(
          ...characters.map((c: any, index: number) => ({
            ...c,
            characterId: c.characterId || `char-${Date.now() + index}`,
          }))
        );
      } catch (error: any) {
        this.error = error;
        console.error('Error creating story:', error);
      } finally {
        this.loading = false;
      }
    },
    /**
     * Adds a new scene to the story.
     */
    addScene() {
      this.scenes.push({
        id: Date.now(),
        title: 'New Scene',
        description: 'New Description',
        background: '',
        script: '',
        image: undefined,
        video: undefined,
        imageDirectives: {
          description: '',
          style: '',
          framing: '',
          lighting: '',
          color: '',
          mood: '',
        },
        videoDirectives: {
          style: '',
          camera: '',
          movement: '',
          lighting: '',
          transition: '',
        },
        characters: [],
      });
    },
    /**
     * Updates a scene in the story.
     * @param {Scene} updatedScene - The updated scene object.
     */
    updateScene(updatedScene: Scene) {
      const index = this.scenes.findIndex(
        (scene) => scene.id === updatedScene.id
      );
      if (index !== -1) {
        this.scenes[index] = updatedScene;
      }
    },
    /**
     * Shows the edit modal for a scene.
     * @param {Scene} scene - The scene to edit.
     */
    showEditModal(scene: Scene) {
      this.currentScene = scene;
      this.isEditModalVisible = true;
    },
    /**
     * Hides the edit modal.
     */
    hideEditModal() {
      this.isEditModalVisible = false;
      this.currentScene = null;
    },
    /**
     * Deletes a scene from the story.
     * @param {number} sceneId - The ID of the scene to delete.
     */
    async deleteScene(sceneId: number) {
      const scene = this.scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      if (scene.image) {
        try {
          await deleteFileFromGCS(scene.image);
        } catch (error: any) {
          console.error(`Failed to delete image from GCS:`, error);
        }
      }

      if (scene.video) {
        try {
          await deleteFileFromGCS(scene.video);
        } catch (error: any) {
          console.error(`Failed to delete video from GCS:`, error);
        }
      }

      this.scenes = this.scenes.filter((s) => s.id !== sceneId);
    },
    /**
     * Deletes the media for a scene.
     * @param {number} sceneId - The ID of the scene.
     * @param {'image' | 'video'} mediaType - The type of media to delete.
     */
    async deleteSceneMedia(sceneId: number, mediaType: 'image' | 'video') {
      const scene = this.scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      const mediaUri = scene[mediaType];
      if (mediaUri) {
        try {
          await deleteFileFromGCS(mediaUri);
          const updatedScene = { ...scene, [mediaType]: undefined };
          this.updateScene(updatedScene);
        } catch (error: any) {
          console.error(`Failed to delete ${mediaType} from GCS:`, error);
        }
      }
    },
    /**
     * Uploads media for a scene.
     * @param {Scene} scene - The scene to upload media for.
     * @param {File} file - The media file to upload.
     * @param {'image' | 'video'} mediaType - The type of media to upload.
     */
    async uploadMediaForScene(
      scene: Scene,
      file: File,
      mediaType: 'image' | 'video'
    ) {
      const projectStore = useProjectStore();
      if (!projectStore.currentProjectId) return;
      const isUploadingKey =
        mediaType === 'image' ? 'isUploadingImage' : 'isUploadingVideo';
      this.updateScene({ ...scene, [isUploadingKey]: true });
      try {
        const mediaUri = await uploadTypedFileToGCS(
          file,
          mediaType,
          undefined,
          projectStore.currentProjectId
        );
        const updatedScene = {
          ...scene,
          [mediaType]: mediaUri,
          [isUploadingKey]: false,
        };
        this.updateScene(updatedScene);
      } catch (error: any) {
        console.error(`Failed to upload ${mediaType}:`, error);
        this.updateScene({ ...scene, [isUploadingKey]: false });
      }
    },
    /**
     * Creates the final video from all the scenes.
     * @return {Promise<string | undefined>} A promise that resolves with the GCS URI of the final video, or undefined if the creation fails.
     */
    async createFinalVideo() {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) {
        return;
      }
      this.loading = true;
      try {
        const finalVideoData = await createFinalVideo(this.scenes);
        const blob = new Blob([finalVideoData.slice()], { type: 'video/mp4' });
        const file = new File([blob], `merged.mp4`, {
          type: 'video/mp4',
        });

        const gcsUri = await uploadTypedFileToGCS(
          file,
          'video',
          undefined,
          projectId
        );
        this.finalVideo = gcsUri;
        await this.saveProject(projectId);

        const videoStore = useVideoStore();
        videoStore.setVideoUrl(gcsUri);
        return gcsUri;
      } catch (error: any) {
        console.error('Failed to create video:', error);
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    async updateSceneImage(scene: Scene, imageUrl: string) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;

      this.updateScene({ ...scene, isUploadingImage: true });
      try {
        const newImageUrl = await saveBase64ToGCS(
          imageUrl.split(',')[1],
          'image',
          'image/png',
          undefined,
          projectId
        );
        const updatedScene = { ...scene, image: newImageUrl, isUploadingImage: false };
        this.updateScene(updatedScene);
        this.saveProject(projectId);
      } catch (error: any) {
        console.error('Failed to update scene image:', error);
        this.updateScene({ ...scene, isUploadingImage: false });
      }
    },
    /**
     * Generates an image for a scene.
     * @param {Scene} scene - The scene to generate an image for.
     */
    async generateImageForScene(scene: Scene) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;
      this.updateScene({ ...scene, isGeneratingImage: true });
      try {
        const contents: Content[] = [
          {
            role: 'user',
            parts: [
              {
                text: `${generateImageScenePrompt} \nGenerate the image with a ${this.aspectRatio} aspect ratio.`,
              },
            ],
          },
          {
            role: 'user',
            parts: [{ text: JSON.stringify(scene.imageDirectives) }],
          },
        ];

        console.log('scene.characters', scene.characters);
        for (const character of scene.characters) {
          if (character.image) {
            const imageBase64 = await downloadFileAsBase64(character.image);
            contents[0].parts.push({
              text: JSON.stringify(character),
            });
            contents[0].parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64,
              },
            });
          }
        }

        const response = await generateImageFromContent(contents);

        const updatedScene = {
          ...scene,
          image: await saveBase64ToGCS(
            response[0].candidates[0].content.parts[0].inlineData.data,
            'image',
            'image/png',
            undefined,
            projectId
          ),
          isGeneratingImage: false,
        };
        this.updateScene(updatedScene);
        this.saveProject(projectId);
      } catch (error: any) {
        const { showToast } = useToast();
        showToast(`Failed to generate image: ${error.message}`, 'error');
        console.error('Failed to generate image:', error);
        this.updateScene({ ...scene, isGeneratingImage: false });
      }
    },
    /**
     * Generates a video for a scene.
     * @param {Scene} scene - The scene to generate a video for.
     */
    async generateVideoForScene(scene: Scene) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;
      this.updateScene({
        ...scene,
        isGeneratingVideo: true,
        generationStatus: 'Starting...',
      });
      try {
        const video = await createVideo(
          [scene],
          this.resolution,
          this.aspectRatio,
          (status: string) => {
          this.updateScene({
            ...scene,
            isGeneratingVideo: true,
            generationStatus: status,
          });
        });
        const videoUri = await saveBase64ToGCS(
          video,
          'video',
          'video/mp4',
          undefined,
          projectId
        );
        const updatedScene = {
          ...scene,
          video: videoUri,
          isGeneratingVideo: false,
          generationStatus: 'Completed',
        };
        this.updateScene(updatedScene);
        this.saveProject(projectId);
      } catch (error: any) {
        const { showToast } = useToast();
        showToast(`Failed to generate video: ${error.message}`, 'error');
        console.error('Failed to generate video:', error);
        this.updateScene({
          ...scene,
          isGeneratingVideo: false,
          generationStatus: `Error: ${error.message}`,
        });
      }
    },
    /**
     * Cancels the video generation for a scene.
     * @param {number} sceneId - The ID of the scene.
     */
    cancelVideoGeneration(sceneId: number) {
      const scene = this.scenes.find((s) => s.id === sceneId);
      if (scene) {
        this.updateScene({ ...scene, isGeneratingVideo: false });
      }
    },
    /**
     * Uses the last frame of the previous scene as the image for the current scene.
     * @param {number} sceneIndex - The index of the current scene.
     */
    async useLastFrameAsImage(sceneIndex: number) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;
      if (sceneIndex > 0) {
        const currentScene = this.scenes[sceneIndex];
        const previousScene = this.scenes[sceneIndex - 1];
        if (previousScene.video) {
          this.updateScene({ ...currentScene, isGeneratingImage: true });
          try {
            const videoBase64 = await downloadFileAsBase64(previousScene.video);
            const frameDataUrl = await getLastFrame(
              `data:video/mp4;base64,${videoBase64}`
            );
            const blob = await (await fetch(frameDataUrl)).blob();
            const fileName = `frame_${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            const imageUrl = await uploadTypedFileToGCS(
              file,
              'image',
              undefined,
              projectId
            );
            this.updateScene({
              ...currentScene,
              image: imageUrl,
              isGeneratingImage: false,
            });
            this.saveProject(projectId);
          } catch (error: any) {
            console.error('Failed to use last frame as image:', error);
            this.updateScene({ ...currentScene, isGeneratingImage: false });
          }
        }
      }
    },
    /**
     * Upscales the image for a scene.
     * @param {Scene} scene - The scene to upscale the image for.
     */
    async upscaleImageForScene(scene: Scene) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;
      if (!scene.image) return;
      this.updateScene({ ...scene, isUpscaling: true });
      try {
        const upscaledImage = await upscaleImage(scene.image);
        const imageUrl = await saveBase64ToGCS(
          upscaledImage.predictions[0].bytesBase64Encoded,
          'image',
          'image/png',
          undefined,
          projectId
        );
        const updatedScene = { ...scene, image: imageUrl, isUpscaling: false };
        this.updateScene(updatedScene);
        this.saveProject(projectId);
      } catch (error: any) {
        console.error('Failed to upscale image:', error);
        this.updateScene({ ...scene, isUpscaling: false });
      }
    },
    /**
     * Sets the summary for the story.
     * @param {string} summary - The summary.
     */
    setSummary(summary: string) {
      this.summary = summary;
    },
    /**
     * Sets the writing style for the story.
     * @param {string} writingStyle - The writing style.
     */
    setWritingStyle(writingStyle: string) {
      this.writingStyle = writingStyle;
    },
    /**
     * Sets the visual style for the story.
     * @param {string} visualStyle - The visual style.
     */
    setVisualStyle(visualStyle: string) {
      this.visualStyle = visualStyle;
    },
      /**
       * Sets the resolution for the story.
       * @param {string} resolution - The resolution.
       */
    setResolution(resolution: '720p' | '1080p') {
      this.resolution = resolution;
    },
    /**
     * Sets the aspect ratio for the story.
     * @param {string} aspectRatio - The aspect ratio.
     */
    setAspectRatio(aspectRatio: '16:9' | '9:16') {
      this.aspectRatio = aspectRatio;
    },
    /**
     * Creates the scenes for the story based on the summary, writing style, visual style, and characters.
     */
    async createScenes() {
      this.loading = true;
      this.error = null;
      this.scenes = [];
      try {
        const res = await generateContent(
          await formatScenes({
            adSummary: this.summary,
            writingStyle: this.writingStyle,
            visualStyle: this.visualStyle,
            characters: this.characters,
          }),
          await ScriptJsonSchema
        );
        const { scenes } = JSON.parse(res.candidates[0].content.parts[0].text);

        // Map character images to the scenes
        this.scenes = scenes.map((scene: Scene) => ({
          ...scene,
          characters: scene.characters.map((character: Character) => {
            const fullCharacter = this.characters.find(
              (c) => c.characterId === character.characterId
            );
            return {
              ...character,
              image: fullCharacter?.image || character.image,
            };
          }),
        }));
      } catch (error: any) {
        this.error = error;
        console.error('Error creating scenes:', error);
      } finally {
        this.loading = false;
      }
    },

    async generateCharacterImage(character: Character) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;

      this.updateCharacter({ ...character, isGeneratingImage: true });
      try {
        const prompt = `a portrait of:\n ${JSON.stringify(character)}. \nthe character should look directly into the camera and have a white backround. like in a proffesional headshot for actors`;
        const image = await generateImage(prompt, this.aspectRatio);
        const imageUrl = await saveBase64ToGCS(
          image.predictions[0].bytesBase64Encoded,
          'image',
          'image/png',
          undefined,
          projectId
        );
        const updatedCharacter = {
          ...character,
          image: imageUrl,
          isGeneratingImage: false,
        };
        this.updateCharacter(updatedCharacter);
        this.saveProject(projectId);
      } catch (error: any) {
        const { showToast } = useToast();
        showToast(
          `Failed to generate character image: ${error.message}`,
          'error'
        );
        console.error('Failed to generate character image:', error);
        this.updateCharacter({ ...character, isGeneratingImage: false });
      }
    },

    async deleteCharacterImage(character: Character) {
      if (!character.image) return;
      this.updateCharacter({ ...character, isDeletingImage: true });
      try {
        await deleteFileFromGCS(character.image);
        this.updateCharacter({
          ...character,
          image: undefined,
          isDeletingImage: false,
        });
      } catch (error: any) {
        console.error('Failed to delete character image:', error);
        this.updateCharacter({ ...character, isDeletingImage: false });
      }
    },

    uploadCharacterImage(character: Character) {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          const file = target.files[0];
          if (file) {
            this.updateCharacter({ ...character, isUploadingImage: true });
            try {
              const imageUrl = await uploadTypedFileToGCS(
                file,
                'image',
                undefined,
                projectId
              );
              this.updateCharacter({
                ...character,
                image: imageUrl || undefined,
                isUploadingImage: false,
              });
              this.saveProject(projectId);
            } catch (error) {
              console.error('Failed to upload character image:', error);
              this.updateCharacter({ ...character, isUploadingImage: false });
            }
          }
        }
      };
      input.click();
    },
  },
});
