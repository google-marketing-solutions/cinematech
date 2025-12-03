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
  <div class="timeline-panel">
    <!-- Toolbar -->
    <div class="timeline-toolbar">
      <div class="tools">
        <button class="tool-btn" title="Split" @click="splitClip">✂️</button>
        <button class="tool-btn" title="Delete" @click="deleteClip">🗑️</button>
      </div>
      <div class="zoom-slider">
        <span>-</span>
        <input
          type="range"
          min="1"
          max="50"
          placeholder="100"
          v-model.number="editorStore.zoomLevel"
        />
        <span>+</span>
      </div>
    </div>

    <!-- Timeline Content -->
    <div class="timeline-content">
      <!-- Track Headers -->
      <div class="track-headers">
        <div class="ruler-header-spacer"></div>
        <div
          v-for="track in editorStore.tracks"
          :key="track.id"
          class="track-header"
          :class="`track-type-${track.type}`"
        >
          <div class="track-info">
            <span class="track-icon">
              {{
                track.type === 'video'
                  ? '🎬'
                  : track.type === 'audio'
                    ? '🎵'
                    : '📝'
              }}
            </span>
            <span class="track-name">{{ track.name }}</span>
          </div>
          <div class="track-controls">
            <button class="icon-btn" @click="toggleMute(track)">
              {{ track.isMuted ? '🔇' : '🔊' }}
            </button>
            <button class="icon-btn" @click="toggleLock(track)">
              {{ track.isLocked ? '🔒' : '🔓' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Track Lanes -->
      <div
        class="track-lanes-container"
        ref="lanesContainer"
        @scroll="onScroll"
      >
        <!-- Ruler -->
        <div class="ruler" @click="seekTo">
          <div
            class="playhead"
            :style="{
              left: `${editorStore.currentTime * editorStore.zoomLevel}px`,
            }"
          ></div>
          <!-- Ticks would go here -->
        </div>

        <!-- Lanes -->
        <div
          v-for="track in editorStore.tracks"
          :key="track.id"
          class="track-lane"
          :class="`track-type-${track.type}`"
          @dragover.prevent
          @drop="onDrop($event, track.id)"
        >
          <div
            v-for="clip in getClipsForTrack(track.id)"
            :key="clip.id"
            class="timeline-clip"
            :class="[
              { selected: editorStore.selectedObjectId === clip.id },
              `clip-type-${clip.mediaType || 'video'}`,
            ]"
            :style="{
              left: `${clip.startTime * editorStore.zoomLevel}px`,
              width: `${clip.duration * editorStore.zoomLevel}px`,
            }"
            @click.stop="selectClip(clip.id)"
            draggable="true"
            @dragstart="onClipDragStart($event, clip)"
          >
            <div class="clip-label">
              {{
                clip.mediaType === 'audio'
                  ? '🎵'
                  : clip.mediaType === 'text'
                    ? '📝'
                    : '🎬'
              }}
              {{ clip.assetId }}
            </div>

            <!-- Transition Indicator -->
            <div
              v-if="clip.transition"
              class="transition-indicator"
              :title="clip.transition.type"
            >
              <span class="transition-icon">🔄</span>
            </div>

            <!-- Resize Handles -->
            <div
              class="resize-handle left"
              @mousedown.stop="onResizeStart($event, clip, 'left')"
            ></div>
            <div
              class="resize-handle right"
              @mousedown.stop="onResizeStart($event, clip, 'right')"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEditorStore, type Track, type Clip } from '@/stores/editor';
import { downloadFileFromGCS } from '@/services/gcp/gcs';

const editorStore = useEditorStore();
const lanesContainer = ref<HTMLElement | null>(null);

const getClipsForTrack = (trackId: string) => {
  return editorStore.clips.filter((c) => c.trackId === trackId);
};

const selectClip = (clipId: string) => {
  editorStore.selectObject(clipId);
};

const splitClip = () => {
  if (editorStore.selectedObjectId) {
    editorStore.splitClip(
      editorStore.selectedObjectId,
      editorStore.currentTime
    );
  }
};

const deleteClip = () => {
  if (editorStore.selectedObjectId) {
    editorStore.removeClip(editorStore.selectedObjectId);
  }
};

const toggleMute = (track: Track) => {
  track.isMuted = !track.isMuted;
};

const toggleLock = (track: Track) => {
  track.isLocked = !track.isLocked;
};

const seekTo = (event: MouseEvent) => {
  if (!lanesContainer.value) return;
  const rect = lanesContainer.value.getBoundingClientRect();
  const scrollLeft = lanesContainer.value.scrollLeft;
  const offsetX = event.clientX - rect.left + scrollLeft;

  // Ensure we don't seek to negative time
  const time = Math.max(0, offsetX / editorStore.zoomLevel);
  editorStore.seekTo(time);
};

const onDrop = (event: DragEvent, trackId: string) => {
  const data = event.dataTransfer?.getData('application/json');
  if (data) {
    const asset = JSON.parse(data);
    // const rect = (event.target as HTMLElement).getBoundingClientRect();
    const scrollLeft = lanesContainer.value?.scrollLeft || 0;
    const containerRect = lanesContainer.value!.getBoundingClientRect();
    const offsetX = event.clientX - containerRect.left + scrollLeft;
    const startTime = Math.max(0, offsetX / editorStore.zoomLevel);

    const targetTrack = editorStore.tracks.find((t) => t.id === trackId);
    if (!targetTrack) return;

    if (asset.type === 'move-clip') {
      // Moving existing clip
      const clip = editorStore.clips.find((c) => c.id === asset.clipId);
      if (clip) {
        // Check compatibility
        const isCompatible =
          (targetTrack.type === 'video' &&
            (clip.mediaType === 'video' || clip.mediaType === 'image')) ||
          (targetTrack.type === 'audio' && clip.mediaType === 'audio') ||
          (targetTrack.type === 'text' && clip.mediaType === 'text');

        if (isCompatible) {
          editorStore.moveClip(asset.clipId, startTime, trackId);
        }
      }
    } else if (asset.type === 'add-effect') {
      // Dropping effect on a clip
      const clips = editorStore.clips.filter((c) => c.trackId === trackId);
      const targetClip = clips.find(
        (c) => startTime >= c.startTime && startTime < c.startTime + c.duration
      );

      if (targetClip) {
        const currentEffects = targetClip.effects || [];
        if (!currentEffects.includes(asset.effectId)) {
          editorStore.updateClip(targetClip.id, {
            effects: [...currentEffects, asset.effectId],
          });
        }
      }
    } else if (asset.type === 'add-transition') {
      // Dropping transition on a clip
      const clips = editorStore.clips.filter((c) => c.trackId === trackId);
      const targetClip = clips.find(
        (c) => startTime >= c.startTime && startTime < c.startTime + c.duration
      );

      if (targetClip) {
        editorStore.addTransition(targetClip.id, asset.transitionId);
      }
    } else {
      // New asset from resources
      let mediaType: 'video' | 'image' | 'audio' | 'text' = 'video';
      if (asset.type.startsWith('image/')) mediaType = 'image';
      else if (asset.type.startsWith('audio/')) mediaType = 'audio';
      else if (
        asset.type.startsWith('text/') ||
        asset.name.endsWith('.srt') ||
        asset.name.endsWith('.vtt') ||
        asset.name.endsWith('.txt')
      )
        mediaType = 'text';

      // Check compatibility
      const isCompatible =
        (targetTrack.type === 'video' &&
          (mediaType === 'video' || mediaType === 'image')) ||
        (targetTrack.type === 'audio' && mediaType === 'audio') ||
        (targetTrack.type === 'text' && mediaType === 'text');

      if (isCompatible) {
        const newClip: Clip = {
          id: `clip-${Date.now()}`,
          trackId,
          assetId: asset.assetId,
          startTime: startTime,
          duration: asset.duration || 5,
          offset: 0,
          mediaType,
          scale: 1,
          position: { x: 0, y: 0 },
          rotation: 0,
          opacity: 1,
          volume: 1,
          effects: [],
        };
        editorStore.addClip(newClip);

        // Fallback: If duration was not provided and it's a video/audio, fetch it
        if (
          (!asset.duration || asset.duration === 0) &&
          (mediaType === 'video' || mediaType === 'audio')
        ) {
          fetchDuration(asset.assetId, mediaType).then((duration) => {
            if (duration > 0) {
              // We use resizeClip to update duration, keeping offset same
              editorStore.resizeClip(newClip.id, duration);
            } else {
              console.warn('Failed to fetch duration for asset', asset.assetId);
            }
          });
        }
      }
    }
  }
};

const fetchDuration = async (
  gcsUri: string,
  type: 'video' | 'audio'
): Promise<number> => {
  try {
    const blob = await downloadFileFromGCS(gcsUri, 'blob');
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const element = document.createElement(type);
      element.preload = 'metadata';
      element.onloadedmetadata = () => {
        resolve(element.duration);
        URL.revokeObjectURL(url);
      };
      element.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(url);
      };
      element.src = url;
    });
  } catch (e) {
    console.error('Failed to fetch duration', e);
    return 0;
  }
};

const onClipDragStart = (event: DragEvent, clip: Clip) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'move-clip',
        clipId: clip.id,
      })
    );
  }
};

// Resize Logic
const resizingState = ref<{
  clipId: string;
  direction: 'left' | 'right';
  startX: number;
  originalStartTime: number;
  originalDuration: number;
  originalOffset: number;
} | null>(null);

const onResizeStart = (
  event: MouseEvent,
  clip: Clip,
  direction: 'left' | 'right'
) => {
  resizingState.value = {
    clipId: clip.id,
    direction,
    startX: event.clientX,
    originalStartTime: clip.startTime,
    originalDuration: clip.duration,
    originalOffset: clip.offset,
  };

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
};

const onResizeMove = (event: MouseEvent) => {
  if (!resizingState.value) return;

  const {
    clipId,
    direction,
    startX,
    originalStartTime,
    originalDuration,
    originalOffset,
  } = resizingState.value;
  const deltaX = event.clientX - startX;
  const deltaTime = deltaX / editorStore.zoomLevel;

  if (direction === 'right') {
    const newDuration = Math.max(0.1, originalDuration + deltaTime);
    editorStore.resizeClip(clipId, newDuration);
  } else {
    // Left resize affects startTime, duration, and offset
    // If we drag left (negative delta), startTime decreases, duration increases, offset decreases
    // If we drag right (positive delta), startTime increases, duration decreases, offset increases

    // Limit: cannot drag start past end (duration > 0.1)
    // Limit: cannot drag start before 0 (startTime >= 0)
    // Limit: offset cannot be negative (offset >= 0)

    let newStartTime = originalStartTime + deltaTime;
    let newDuration = originalDuration - deltaTime;
    let newOffset = originalOffset + deltaTime;

    if (newDuration < 0.1) {
      newStartTime = originalStartTime + originalDuration - 0.1;
      newDuration = 0.1;
      newOffset = originalOffset + originalDuration - 0.1;
    }

    if (newStartTime < 0) {
      newStartTime = 0;
      newDuration = originalDuration + originalStartTime;
      newOffset = originalOffset - originalStartTime;
    }

    if (newOffset < 0) {
      // Reached start of media
      newOffset = 0;
      newStartTime = originalStartTime - originalOffset;
      newDuration = originalDuration + originalOffset;
    }

    editorStore.moveClip(clipId, newStartTime);
    editorStore.resizeClip(clipId, newDuration, newOffset);
  }
};

const onResizeEnd = () => {
  resizingState.value = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
};

const onScroll = () => {
  if (!lanesContainer.value) return;

  // Sync header scroll
  const headers = document.querySelector('.track-headers');
  if (headers) {
    headers.scrollTop = lanesContainer.value.scrollTop;
  }
};
</script>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-panel);
  color: var(--color-text-primary);
}

.timeline-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.tool-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.tool-btn:hover {
  background-color: var(--color-background-soft);
}

.zoom-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.track-headers {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background-color: var(--color-background);
  z-index: 10;
}

.ruler-header-spacer {
  height: 30px;
  border-bottom: 1px solid var(--color-border);
}

.track-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-border);
}

.track-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-controls {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  opacity: 0.7;
}

.icon-btn:hover {
  opacity: 1;
}

.track-lanes-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
  background-color: #1e1e1e;
}

.ruler {
  height: 30px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background-color: var(--color-background-soft);
  cursor: pointer;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: -1000px; /* Extend down */
  width: 2px;
  background-color: var(--color-accent);
  pointer-events: none;
  z-index: 100;
}

.track-lane {
  height: 60px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.timeline-clip {
  position: absolute;
  top: 4px;
  bottom: 4px;
  background-color: var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.timeline-clip.selected {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.clip-label {
  padding: 4px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  pointer-events: none; /* Let clicks pass to clip */
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.timeline-clip:hover .resize-handle {
  opacity: 1;
}

.resize-handle.left {
  left: 0;
}

.resize-handle.right {
  right: 0;
}

.resize-handle:hover {
  background-color: var(--color-accent);
}

/* Clip Types */
.timeline-clip.clip-type-video {
  background-color: var(--color-primary);
}

.timeline-clip.clip-type-image {
  background-color: #8e44ad; /* Purple */
}

.timeline-clip.clip-type-audio {
  background-color: #27ae60; /* Green */
}

.timeline-clip.clip-type-text {
  background-color: #e67e22; /* Orange */
}

.track-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.track-icon {
  font-size: 16px;
}

.transition-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 5;
}

.transition-icon {
  font-size: 10px;
}
</style>
