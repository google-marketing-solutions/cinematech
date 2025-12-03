<!--
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
-->

<template>
  <div class="player-panel">
    <div class="canvas-container" ref="containerRef">
      <div
        class="composition-area"
        :style="{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }"
      >
        <!-- Background Layer -->
        <div class="clip-layer" style="background-color: #000"></div>

        <!-- Media Layers -->
        <div
          v-for="clip in visibleClips"
          :key="clip.id"
          class="clip-layer"
          :style="getClipStyle(clip)"
        >
          <img
            v-if="clip.mediaType === 'image'"
            :src="getClipSource(clip)"
            class="clip-content"
          />
          <video
            v-else-if="clip.mediaType === 'video'"
            :src="getClipSource(clip)"
            class="clip-content"
            ref="videoRefs"
            :data-clip-id="clip.id"
            :muted="isClipMuted(clip)"
            playsinline
          ></video>
          <div
            v-else-if="clip.mediaType === 'text'"
            class="text-content"
            :style="{
              fontSize: `${clip.fontSize || 48}px`,
              color: clip.color || '#ffffff',
              fontFamily: clip.fontFamily || 'Arial',
            }"
          >
            {{ clip.text }}
          </div>
        </div>

        <!-- Selection Overlay -->
        <div
          v-if="selectedClip"
          class="transform-overlay"
          :style="getClipStyle(selectedClip)"
        >
          <div class="handle top-left"></div>
          <div class="handle top-right"></div>
          <div class="handle bottom-left"></div>
          <div class="handle bottom-right"></div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading Assets...</div>
    </div>

    <div class="controls-bar">
      <div class="time-display">{{ formatTime(currentTime) }}</div>
      <div class="transport-controls">
        <button class="control-btn" @click="seekToStart">
          <i class="mdi mdi-skip-previous"></i>
        </button>
        <button class="control-btn" @click="togglePlay" :disabled="isLoading">
          <i
            :class="
              isLoading
                ? 'mdi mdi-loading mdi-spin'
                : isPlaying
                  ? 'mdi mdi-pause'
                  : 'mdi mdi-play'
            "
          ></i>
        </button>
        <button class="control-btn" @click="seekToEnd">
          <i class="mdi mdi-skip-next"></i>
        </button>
      </div>
      <div class="time-display">{{ formatTime(duration) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useEditorStore } from '@/stores/editor';
import { useStoryStore } from '@/stores/story';
import { downloadFileFromGCS } from '@/services/gcp/gcs';
import type { Clip } from '@/types';

const editorStore = useEditorStore();
const storyStore = useStoryStore();

const containerRef = ref<HTMLElement | null>(null);
const width = 1280; // Internal resolution
const height = 720;
const scale = ref(0.5);

const currentTime = computed(() => editorStore.currentTime);
const duration = computed(() => editorStore.totalDuration);
const isPlaying = computed(() => editorStore.isPlaying);
const selectedClip = computed(() => editorStore.selectedClip);

// Cache for blob URLs
const clipSources = ref<Record<string, string>>({});
const loadingClips = ref<Set<string>>(new Set());
const videoRefs = ref<HTMLVideoElement[]>([]);

const isLoading = computed(() => loadingClips.value.size > 0);

const visibleClips = computed(() => {
  return editorStore.clips
    .filter(
      (clip) =>
        currentTime.value >= clip.startTime &&
        currentTime.value < clip.startTime + clip.duration
    )
    .sort((a, b) => {
      // Sort by track index (visual stacking order)
      const trackA = editorStore.tracks.findIndex((t) => t.id === a.trackId);
      const trackB = editorStore.tracks.findIndex((t) => t.id === b.trackId);
      return trackA - trackB;
    });
});

const getClipStyle = (clip: Clip) => {
  return {
    transform: `translate(${clip.position?.x || 0}px, ${clip.position?.y || 0}px) rotate(${clip.rotation || 0}deg) scale(${clip.scale || 1})`,
    opacity: clip.opacity !== undefined ? clip.opacity : 1,
    zIndex: editorStore.tracks.findIndex((t) => t.id === clip.trackId),
  };
};

const isClipMuted = (clip: Clip) => {
  const track = editorStore.tracks.find((t) => t.id === clip.trackId);
  return track ? track.isMuted : false;
};

const getClipSource = (clip: Clip) => {
  if (clip.mediaType === 'text') return '';

  // If we have a blob URL, use it
  if (clipSources.value[clip.id]) {
    return clipSources.value[clip.id];
  }

  // Otherwise, load it
  loadClipSource(clip);
  return '';
};

// import { getVideoDuration } from '@/services/video';

// ...

const loadClipSource = async (clip: Clip) => {
  if (clipSources.value[clip.id] || loadingClips.value.has(clip.id)) return;

  loadingClips.value.add(clip.id);
  try {
    let gcsUri = '';
    // let sceneId: number | undefined;

    if (typeof clip.assetId === 'string' && clip.assetId.startsWith('gs://')) {
      gcsUri = clip.assetId;
    } else if (typeof clip.assetId === 'number') {
      // Look up scene
      // sceneId = clip.assetId;
      const scene = storyStore.scenes.find((s) => s.id === clip.assetId);
      if (scene) {
        if (clip.mediaType === 'video' && scene.video) gcsUri = scene.video;
        else if (clip.mediaType === 'image' && scene.image)
          gcsUri = scene.image;
      }
    }

    if (gcsUri) {
      const blob = await downloadFileFromGCS(gcsUri, 'blob');
      const url = URL.createObjectURL(blob);
      // Logger.debug('PlayerPanel', `Loaded source for clip ${clip.id}: ${url}`);
      clipSources.value = { ...clipSources.value, [clip.id]: url };
    }
  } catch (e) {
    console.error('Failed to load clip source', e);
  } finally {
    loadingClips.value.delete(clip.id);
  }
};

// Preload all clips on mount or when clips change
watch(
  () => editorStore.clips,
  (clips) => {
    clips.forEach((clip) => {
      if (clip.mediaType === 'video' || clip.mediaType === 'image') {
        loadClipSource(clip);
      }
    });
  },
  { immediate: true, deep: true }
);

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const togglePlay = () => {
  editorStore.togglePlayPause();
};

const seekToStart = () => {
  editorStore.seekTo(0);
};

const seekToEnd = () => {
  editorStore.seekTo(duration.value);
};

// const onSeek = (event: Event) => {
//   const target = event.target as HTMLInputElement;
//   editorStore.seekTo(parseFloat(target.value));
// };

const getVideoElement = (clipId: string): HTMLVideoElement | undefined => {
  if (!videoRefs.value) return undefined;
  const videos = videoRefs.value as unknown as HTMLVideoElement[];
  return videos.find((v) => v.getAttribute('data-clip-id') === clipId);
};

// Sync video elements
watch(
  currentTime,
  (time) => {
    if (videoRefs.value) {
      const videos = videoRefs.value as unknown as HTMLVideoElement[];

      // Identify Master (must match logic in loop)
      // We use the first visible video as the master
      const masterClip = visibleClips.value.find(
        (c) => c.mediaType === 'video'
      );

      videos.forEach((video) => {
        const clipId = video.getAttribute('data-clip-id');
        const clip = visibleClips.value.find((c) => c.id === clipId);

        if (clip) {
          const clipTime = time - clip.startTime + clip.offset;
          const isMaster =
            isPlaying.value && masterClip && clipId === masterClip.id;

          // Only sync if src is set and ready
          if (video.src && video.readyState >= 1) {
            // 2. Drift Sync
            // Skip for Master to avoid fighting, UNLESS drift is large (indicating a seek)
            const drift = Math.abs(video.currentTime - clipTime);
            const isLargeDrift = drift > 0.5;

            if (!isMaster || isLargeDrift) {
              // If playing, only correct if drift is significant to avoid stutter
              // If paused, correct if drift is noticeable
              const threshold = isPlaying.value ? 0.3 : 0.05;

              if (drift > threshold) {
                video.currentTime = clipTime;
              }
            }

            // 1. Play/Pause Sync
            if (isPlaying.value && video.paused) {
              // Prevent restarting if video ended (hold last frame)
              if (!video.ended) {
                video.play().catch((e) => {
                  // Ignore abort errors which happen frequently during seeking
                  if (e.name !== 'AbortError') console.warn('Play failed', e);
                });
              }
            } else if (!isPlaying.value && !video.paused) {
              video.pause();
            }
          }
        }
      });
    }
  },
  { flush: 'post' }
);

// Update scale on resize
const updateScale = () => {
  if (containerRef.value) {
    const { clientWidth, clientHeight } = containerRef.value;
    const scaleX = (clientWidth - 40) / width;
    const scaleY = (clientHeight - 40) / height;
    scale.value = Math.min(scaleX, scaleY, 1);
  }
};

onMounted(() => {
  window.addEventListener('resize', updateScale);
  updateScale();
});

// Animation loop for smooth playback
let animationFrame: number;
let lastFrameTime = 0;

watch(isPlaying, (playing) => {
  if (playing) {
    lastFrameTime = performance.now();
  }
});

const loop = () => {
  if (isPlaying.value) {
    // Master Clock Strategy
    // 1. Identify Master Clip (First visible video)
    const masterClip = visibleClips.value.find((c) => c.mediaType === 'video');
    const masterVideo = masterClip ? getVideoElement(masterClip.id) : undefined;

    let newTime = currentTime.value;
    let usedMaster = false;

    // 2. Try to use Master Clock
    if (
      masterClip &&
      masterVideo &&
      !masterVideo.paused &&
      !masterVideo.ended &&
      masterVideo.readyState >= 2
    ) {
      // Calculate global time from Master's local time
      // masterVideo.currentTime = (globalTime - clip.startTime) + clip.offset
      // globalTime = masterVideo.currentTime - clip.offset + clip.startTime
      newTime =
        masterVideo.currentTime - masterClip.offset + masterClip.startTime;

      // Update lastFrameTime to keep delta sync ready for fallback
      lastFrameTime = performance.now();
      usedMaster = true;
    }

    // 3. Fallback to Synthetic Clock
    if (!usedMaster) {
      const now = performance.now();
      const deltaTime = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      newTime = currentTime.value + deltaTime;
    }

    if (duration.value > 0 && newTime >= duration.value) {
      editorStore.seekTo(duration.value);
      editorStore.pause();
    } else {
      editorStore.seekTo(newTime);
    }
  } else {
    // Ensure videos are paused
    const pauseMedia = (mediaElements: HTMLMediaElement[]) => {
      mediaElements.forEach((media) => {
        if (!media.paused) media.pause();
      });
    };
    if (videoRefs.value)
      pauseMedia(videoRefs.value as unknown as HTMLMediaElement[]);
  }
  animationFrame = requestAnimationFrame(loop);
};

onUnmounted(() => {
  cancelAnimationFrame(animationFrame);
  Object.values(clipSources.value).forEach((url) => URL.revokeObjectURL(url));
  window.removeEventListener('resize', updateScale);
});

requestAnimationFrame(loop);
</script>

<style scoped>
.player-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1a1a1a;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.composition-area {
  background-color: #000;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.clip-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.clip-content {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.text-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.transform-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-accent);
  pointer-events: none;
}

.handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: white;
  border: 1px solid var(--color-accent);
  pointer-events: auto;
}

.top-left {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}
.top-right {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}
.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}
.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.controls-bar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: var(--color-background-panel);
  border-top: 1px solid var(--color-border);
}

.control-btn {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.control-btn:hover {
  background-color: var(--color-background-soft);
}

.time-display {
  font-family: monospace;
  color: var(--color-accent);
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 48px; /* Above controls */
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  font-weight: 500;
}

.transport-controls {
  display: flex;
  flex-direction: row;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
