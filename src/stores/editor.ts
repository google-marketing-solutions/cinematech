import { renderTimeline } from '@/services/ffmpeg';
import { uploadTypedFileToGCS } from '@/services/gcp/gcs';
import { Logger } from '@/services/logger';
import type { Clip, Track } from '@/types';
import { defineStore } from 'pinia';
import { useProjectStore } from './project';
import { useStoryStore } from './story';

export type { Clip, Track };

/**
 * Represents the state of the video editor.
 * This includes the current time, zoom level, play/export status,
 * selected objects, and the timeline content (tracks and clips).
 */
export interface EditorState {
  currentTime: number;
  zoomLevel: number;
  isPlaying: boolean;
  isExporting: boolean;
  selectedObjectId: string | null;
  tracks: Track[];
  clips: Clip[];
}

/**
 * Pinia store for the video editor.
 * Manages the state of the editor, including tracks, clips, and playback.
 */
export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    currentTime: 0,
    zoomLevel: 10, // Default pixels per second
    isPlaying: false,
    isExporting: false,
    selectedObjectId: null,
    tracks: [],
    clips: [],
  }),

  actions: {
    /**
     * Initializes the editor state from the current story scenes.
     * Creates a default video track and places scenes as clips.
     */
    initializeFromStory() {
      const storyStore = useStoryStore();

      // Clear existing state
      this.tracks = [];
      this.clips = [];
      this.currentTime = 0;
      this.selectedObjectId = null;

      // Create default video track
      const videoTrackId = `track-video-1`;
      this.tracks.push({
        id: videoTrackId,
        type: 'video',
        name: 'Main Video',
        isMuted: false,
        isLocked: false,
      });

      // Create default audio track
      this.tracks.push({
        id: `track-audio-1`,
        type: 'audio',
        name: 'Audio Track',
        isMuted: false,
        isLocked: false,
      });

      // Create default text track
      this.tracks.push({
        id: `track-text-1`,
        type: 'text',
        name: 'Subtitles',
        isMuted: false,
        isLocked: false,
      });

      let currentHead = 0;

      // Populate clips from scenes
      storyStore.scenes.forEach((scene) => {
        // Only add scenes that have some media (video or image)
        if (scene.video || scene.image) {
          const isVideo = !!scene.video;
          const assetId = scene.video || scene.image || '';

          const duration = Number(scene.durationSeconds);
          const clipDuration =
            isVideo && !isNaN(duration) ? duration : 4;

          this.clips.push({
            id: `clip-${scene.id}`,
            trackId: videoTrackId,
            assetId,
            startTime: currentHead,
            duration: clipDuration,
            offset: 0,
            mediaType: isVideo ? 'video' : 'image',
          });

          currentHead += clipDuration;
        }
      });
    },

    addClip(clip: Clip) {
      this.clips.push(clip);
    },

    moveClip(clipId: string, newStartTime: number, newTrackId?: string) {
      const index = this.clips.findIndex((c) => c.id === clipId);
      if (index !== -1) {
        const clip = this.clips[index];
        // Basic collision detection could go here
        this.clips[index] = {
          ...clip,
          startTime: Math.max(0, newStartTime),
          trackId: newTrackId || clip.trackId,
        };
      }
    },

    resizeClip(clipId: string, newDuration: number, newOffset?: number) {
      const index = this.clips.findIndex((c) => c.id === clipId);
      if (index !== -1) {
        const clip = this.clips[index];
        this.clips[index] = {
          ...clip,
          duration: Math.max(0.1, newDuration), // Minimum 0.1s duration
          offset:
            newOffset !== undefined ? Math.max(0, newOffset) : clip.offset,
        };
      }
    },

    removeClip(clipId: string) {
      Logger.info('EditorStore', `Removing clip ${clipId}`);
      this.clips = this.clips.filter((c) => c.id !== clipId);
      if (this.selectedObjectId === clipId) {
        this.selectedObjectId = null;
      }
    },

    play() {
      this.isPlaying = true;
    },

    pause() {
      this.isPlaying = false;
    },

    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
    },

    seekTo(time: number) {
      this.currentTime = Math.max(0, time);
    },

    selectObject(id: string | null) {
      this.selectedObjectId = id;
    },

    updateClip(clipId: string, updates: Partial<Clip>) {
      const index = this.clips.findIndex((c) => c.id === clipId);
      if (index !== -1) {
        this.clips[index] = { ...this.clips[index], ...updates };
      }
    },

    addTrack(type: 'video' | 'audio' | 'text') {
      const id = `track-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.tracks.push({
        id,
        type,
        name:
          type === 'video'
            ? 'New Video Track'
            : type === 'audio'
              ? 'New Audio Track'
              : 'New Text Track',
        isMuted: false,
        isLocked: false,
      });
      return id;
    },

    removeTrack(trackId: string) {
      this.tracks = this.tracks.filter((t) => t.id !== trackId);
      // Also remove clips associated with this track
      this.clips = this.clips.filter((c) => c.trackId !== trackId);
    },

    async splitClip(clipId: string, time: number) {
      const clipIndex = this.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return;

      const clip = this.clips[clipIndex];

      // Check if split time is within clip bounds (with small epsilon)
      const epsilon = 0.05;
      if (
        time <= clip.startTime + epsilon ||
        time >= clip.startTime + clip.duration - epsilon
      ) {
        Logger.warn(
          'EditorStore',
          `Split time ${time} is outside clip bounds [${clip.startTime}, ${clip.startTime + clip.duration}]`
        );
        return;
      }

      const splitPointRelative = time - clip.startTime;
      const originalDuration = clip.duration;

      // Update first clip (left side)
      this.clips[clipIndex] = {
        ...clip,
        duration: splitPointRelative,
      };

      // Create second clip (right side)
      const newClip: Clip = {
        ...clip,
        id: `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // New ID
        startTime: time,
        duration: originalDuration - splitPointRelative,
        offset: clip.offset + splitPointRelative,
      };

      this.clips.push(newClip);

      // Select the new clip (optional UX choice)
      this.selectedObjectId = newClip.id;

      Logger.info(
        'EditorStore',
        `Split clip ${clipId} at ${time}. New clip created: ${newClip.id}`
      );
    },

    async applyEffect(clipId: string, effectName: string) {
      const clip = this.clips.find((c) => c.id === clipId);
      if (!clip) return;

      // Placeholder
      Logger.debug(
        'EditorStore',
        `Applying effect ${effectName} to clip ${clipId}`
      );
    },

    addTransition(
      clipId: string,
      transitionType:
        | 'fade'
        | 'wipeleft'
        | 'wiperight'
        | 'slideleft'
        | 'slideright'
        | 'circlecrop',
      duration = 1.0
    ) {
      const index = this.clips.findIndex((c) => c.id === clipId);
      if (index !== -1) {
        this.clips[index] = {
          ...this.clips[index],
          transition: {
            type: transitionType,
            duration,
          },
        };
      }
    },

    async exportVideo() {
      const projectStore = useProjectStore();
      const projectId = projectStore.currentProjectId;
      if (!projectId) return;

      this.isExporting = true;
      try {
        // Render timeline
        const videoData = await renderTimeline(this.clips, '16:9'); // Default to 16:9 for now

        // Create file from Uint8Array
        const blob = new Blob([videoData as any], { type: 'video/mp4' });
        const file = new File([blob], 'export.mp4', { type: 'video/mp4' });

        // Upload to GCS
        const gcsUri = await uploadTypedFileToGCS(
          file,
          'video',
          undefined,
          projectId
        );

        Logger.info('EditorStore', 'Export successful', { gcsUri });

        // Update project with final video
        const storyStore = useStoryStore();
        storyStore.finalVideo = gcsUri;
        await storyStore.saveProject(projectId);

        Logger.info('EditorStore', 'Project updated with final video URL');

        return gcsUri;
      } catch (error) {
        Logger.error('EditorStore', 'Export failed', error);
        throw error;
      } finally {
        this.isExporting = false;
      }
    },
  },

  getters: {
    selectedClip: (state) => {
      return state.clips.find((c) => c.id === state.selectedObjectId);
    },

    totalDuration: (state) => {
      if (state.clips.length === 0) return 0;
      // Find the end time of the last clip (simple version, ideally check all clips)
      return state.clips.reduce((max, clip) => {
        return Math.max(max, clip.startTime + clip.duration);
      }, 0);
    },

    clipsByTrack: (state) => {
      return (trackId: string) =>
        state.clips.filter((c) => c.trackId === trackId);
    },
  },
});
