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
import { formatGuidelines } from '../services/prompts/guidelines.ts';
import { formatScenes } from '../services/prompts/scenes.ts';
import {
  generateImage,
  createVideo,
  generateContent,
  upscaleImage,
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
import _ from 'lodash';
import type { StoryState, Scene, Character } from '@/types';

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
    async saveProject() {
      const projectStore = useProjectStore();
      if (!projectStore.currentProjectId) return;

      try {
        const configStore = useConfigStore();
        const projectData = {
          prompt: this.prompt,
          summary: this.summary,
          writingStyle: this.writingStyle,
          visualStyle: this.visualStyle,
          characters: this.characters,
          scenes: this.scenes,
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
          projectStore.currentProjectId
        );
      } catch (error: any) {
        this.error = `Failed to save project: ${error.message}`;
        console.error(this.error);
      }
    },
    /**
     * A debounced version of the saveProject action.
     */
    _saveProjectDebounced: _.debounce(function (this: any) {
      this.saveProject();
    }, 2000),
    /**
     * Subscribes to changes in the store and automatically saves the project.
     */
    subscribeToChanges() {
      this.$subscribe(() => {
        this._saveProjectDebounced();
      });
    },
    /**
     * Adds a new character to the story.
     */
    addCharacter() {
      this.characters.push({
        id: Date.now(),
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
        (c) => c.id === updatedCharacter.id
      );
      if (index !== -1) {
        this.characters[index] = updatedCharacter;
      }
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
          ...characters.map((c: any) => ({ ...c, id: Date.now() }))
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
        image: 'https://via.placeholder.com/300x200',
        video: null,
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
          const updatedScene = { ...scene, [mediaType]: null };
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
      this.loading = true;
      try {
        const finalVideoData = await createFinalVideo(this.scenes);
        const blob = new Blob([finalVideoData.slice()], { type: 'video/mp4' });
        const file = new File([blob], `final-video-${Date.now()}.mp4`, {
          type: 'video/mp4',
        });

        const gcsUri = await uploadTypedFileToGCS(file, 'video');
        localStorage.setItem('finalVideoGcsUri', gcsUri);

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
    /**
     * Generates an image for a scene.
     * @param {Scene} scene - The scene to generate an image for.
     */
    async generateImageForScene(scene: Scene) {
      const projectStore = useProjectStore();
      if (!projectStore.currentProjectId) return;
      this.updateScene({ ...scene, isGeneratingImage: true });
      try {
        const image = await generateImage(
          JSON.stringify(scene.imageDirectives)
        );
        const updatedScene = {
          ...scene,
          image: await saveBase64ToGCS(
            image.predictions[0].bytesBase64Encoded,
            'image',
            'image/png',
            undefined,
            projectStore.currentProjectId
          ),
          isGeneratingImage: false,
        };
        this.updateScene(updatedScene);
      } catch (error: any) {
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
      if (!projectStore.currentProjectId) return;
      this.updateScene({
        ...scene,
        isGeneratingVideo: true,
        generationStatus: 'Starting...',
      });
      try {
        const video = await createVideo([scene], (status: string) => {
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
          projectStore.currentProjectId
        );
        const updatedScene = {
          ...scene,
          video: videoUri,
          isGeneratingVideo: false,
          generationStatus: 'Completed',
        };
        this.updateScene(updatedScene);
      } catch (error: any) {
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
      if (!projectStore.currentProjectId) return;
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
              projectStore.currentProjectId
            );
            this.updateScene({
              ...currentScene,
              image: imageUrl,
              isGeneratingImage: false,
            });
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
      if (!projectStore.currentProjectId) return;
      if (!scene.image) return;
      this.updateScene({ ...scene, isUpscaling: true });
      try {
        const upscaledImage = await upscaleImage(scene.image);
        const imageUrl = await saveBase64ToGCS(
          upscaledImage.predictions[0].bytesBase64Encoded,
          'image',
          'image/png',
          undefined,
          projectStore.currentProjectId
        );
        const updatedScene = { ...scene, image: imageUrl, isUpscaling: false };
        this.updateScene(updatedScene);
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
        this.scenes = scenes;
      } catch (error: any) {
        this.error = error;
        console.error('Error creating scenes:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
