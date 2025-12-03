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
  <div
    class="asset-card"
    :draggable="node.type === 'file'"
    @dragstart="onDragStart"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div class="preview-area">
      <div v-if="isLoading" class="icon-container">
        <div class="loading-spinner"></div>
      </div>

      <div v-else-if="isImage && imageUrl" class="image-container">
        <img :src="imageUrl" :alt="node.name" class="asset-image" />
      </div>

      <div v-else-if="isVideo && videoUrl" class="image-container">
        <video
          ref="videoRef"
          :src="videoUrl"
          class="asset-image"
          muted
          loop
          playsinline
        ></video>
      </div>

      <div v-else-if="isAudio && audioUrl" class="icon-container audio-preview">
        <i v-if="!isPlaying" class="mdi mdi-music-note file-icon"></i>
        <div v-else class="playing-visualizer">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>

        <button class="play-btn" @click.stop="togglePlay">
          <i class="mdi" :class="isPlaying ? 'mdi-pause' : 'mdi-play'"></i>
        </button>
        <audio
          ref="audioRef"
          :src="audioUrl"
          @ended="isPlaying = false"
          @pause="isPlaying = false"
          @play="isPlaying = true"
          style="display: none"
        ></audio>
      </div>

      <div v-else class="icon-container">
        <i v-if="isFolder" class="mdi mdi-folder" style="color: #fbbf24"></i>
        <i v-else-if="isImage" class="mdi mdi-image"></i>
        <i v-else-if="isVideo" class="mdi mdi-video"></i>
        <i v-else-if="isAudio" class="mdi mdi-music-note"></i>
        <i v-else-if="isText" class="mdi mdi-text-box"></i>
        <i v-else class="mdi mdi-file"></i>
      </div>
    </div>

    <div class="asset-name" :title="node.name">
      {{ node.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
// import { useEditorStore } from '@/stores/editor';
import type { FileSystemNode } from '@/types';
import { downloadFileFromGCS } from '@/services/gcp/gcs';

const props = defineProps<{
  node: FileSystemNode;
}>();

defineEmits<{
  (e: 'click', node: FileSystemNode): void;
}>();

const imageUrl = ref<string | null>(null);
const videoUrl = ref<string | null>(null);
const audioUrl = ref<string | null>(null);
const isLoading = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);

const isFolder = computed(() => props.node.type === 'folder');

const getMimeType = () => {
  if (props.node.mimeType && props.node.mimeType !== 'application/octet-stream')
    return props.node.mimeType;
  const ext = props.node.name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
    return 'image/' + ext;
  if (['mp4', 'webm', 'mov'].includes(ext || '')) return 'video/' + ext;
  if (['mp3', 'wav', 'aac', 'mpeg', 'm4a', 'flac'].includes(ext || ''))
    return 'audio/' + ext;
  if (['txt', 'srt', 'vtt'].includes(ext || '')) return 'text/plain';
  return props.node.mimeType || '';
};

const isImage = computed(() => {
  return getMimeType().startsWith('image/');
});

const isVideo = computed(() => {
  return getMimeType().startsWith('video/');
});

const isAudio = computed(() => {
  return getMimeType().startsWith('audio/');
});

const isText = computed(() => {
  const mime = getMimeType();
  const name = props.node.name.toLowerCase();
  return (
    mime.startsWith('text/') ||
    name.endsWith('.srt') ||
    name.endsWith('.vtt') ||
    name.endsWith('.txt')
  );
});

const loadThumbnail = async () => {
  if (
    (!isImage.value && !isVideo.value && !isAudio.value) ||
    !props.node.gcsUri
  )
    return;

  isLoading.value = true;
  try {
    const blob = await downloadFileFromGCS(props.node.gcsUri, 'blob');
    const url = URL.createObjectURL(blob);
    if (isImage.value) {
      imageUrl.value = url;
    } else if (isVideo.value) {
      videoUrl.value = url;
    } else if (isAudio.value) {
      audioUrl.value = url;
    }
  } catch (e) {
    console.error('Failed to load thumbnail', e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadThumbnail();
});

onUnmounted(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
});

const onDragStart = (event: DragEvent) => {
  if (event.dataTransfer && props.node.type === 'file') {
    event.dataTransfer.effectAllowed = 'copy';

    let duration = props.node.duration || 0;
    if (!duration) {
      if (videoRef.value && !isNaN(videoRef.value.duration)) {
        duration = videoRef.value.duration;
      } else if (audioRef.value && !isNaN(audioRef.value.duration)) {
        duration = audioRef.value.duration;
      }
    }

    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        assetId: props.node.gcsUri,
        type: getMimeType() || 'application/octet-stream',
        name: props.node.name,
        duration: duration,
      })
    );
  }
};

const togglePlay = () => {
  if (!audioRef.value) return;

  if (isPlaying.value) {
    audioRef.value.pause();
  } else {
    audioRef.value.play().catch(console.error);
  }
};

const onMouseEnter = () => {
  if (videoRef.value) {
    videoRef.value.play().catch(() => {});
  }
};

const onMouseLeave = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
};
</script>

<style scoped>
.asset-card {
  min-height: 200px !important;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-fast);
  width: 100%;
  position: relative;
}

.asset-card:hover {
  background-color: var(--color-background-mute);
  border-color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 16:9 Aspect Ratio Container */
.preview-area {
  width: 100%;
  padding-top: 56.25%; /* 16:9 aspect ratio */
  position: relative;
  background-color: #000;
}

/* Absolute positioning for children to fill the 1:1 box */
.icon-container,
.image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.icon-container {
  background-color: var(--color-surface);
  font-size: 32px;
  position: relative;
}

.audio-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.play-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-accent);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s;
  z-index: 10;
}

.asset-card:hover .play-btn {
  opacity: 1;
  transform: scale(1);
}

.play-btn:hover {
  transform: scale(1.1);
  background-color: var(--color-accent-hover);
}

.playing-visualizer {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 20px;
}

.bar {
  width: 4px;
  background-color: var(--color-accent);
  animation: bounce 0.5s infinite ease-in-out;
}

.bar:nth-child(2) {
  animation-delay: 0.1s;
}
.bar:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes bounce {
  0%,
  100% {
    height: 4px;
  }
  50% {
    height: 20px;
  }
}

.asset-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-name {
  padding: 8px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  text-align: center;
  color: var(--color-text-primary);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
