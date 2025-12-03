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
  <div class="file-system">
    <div class="toolbar">
      <div class="breadcrumbs">
        <span
          class="breadcrumb-item"
          :class="{ active: currentPath.length === 0 }"
          @click="navigateToRoot"
        >
          Home
        </span>
        <template v-for="(part, index) in currentPath" :key="index">
          <span class="separator">/</span>
          <span
            class="breadcrumb-item"
            :class="{ active: index === currentPath.length - 1 }"
            @click="navigateToIndex(index)"
          >
            {{ part }}
          </span>
        </template>
      </div>
      <div class="actions">
        <button class="action-btn" title="Refresh" @click="refresh">
          <i class="mdi mdi-refresh"></i>
        </button>
        <button class="action-btn" title="Upload File" @click="triggerUpload">
          <i class="mdi mdi-upload"></i>
        </button>
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          multiple
          @change="handleFileUpload"
        />
      </div>
    </div>

    <div class="content-area" v-if="!isLoading && nodes.length > 0">
      <!-- Folders Section (if any) -->
      <div v-if="folders.length > 0" class="section">
        <div class="section-header" @click="showFolders = !showFolders">
          <i
            class="mdi"
            :class="showFolders ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
          <span>Folders ({{ folders.length }})</span>
        </div>
        <div v-if="showFolders" class="assets-grid">
          <AssetCard
            v-for="node in folders"
            :key="node.id"
            :node="node"
            @click="handleNodeClick"
          />
        </div>
      </div>

      <!-- Images Section -->
      <div v-if="images.length > 0" class="section">
        <div class="section-header" @click="showImages = !showImages">
          <i
            class="mdi"
            :class="showImages ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
          <span>Images ({{ images.length }})</span>
        </div>
        <div v-if="showImages" class="assets-grid">
          <AssetCard
            v-for="node in images"
            :key="node.id"
            :node="node"
            @click="handleNodeClick"
          />
        </div>
      </div>

      <!-- Videos Section -->
      <div v-if="videos.length > 0" class="section">
        <div class="section-header" @click="showVideos = !showVideos">
          <i
            class="mdi"
            :class="showVideos ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
          <span>Videos ({{ videos.length }})</span>
        </div>
        <div v-if="showVideos" class="assets-grid">
          <AssetCard
            v-for="node in videos"
            :key="node.id"
            :node="node"
            @click="handleNodeClick"
          />
        </div>
      </div>

      <!-- Audio Section -->
      <div v-if="audios.length > 0" class="section">
        <div class="section-header" @click="showAudios = !showAudios">
          <i
            class="mdi"
            :class="showAudios ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
          <span>Audio ({{ audios.length }})</span>
        </div>
        <div v-if="showAudios" class="assets-grid">
          <AssetCard
            v-for="node in audios"
            :key="node.id"
            :node="node"
            @click="handleNodeClick"
          />
        </div>
      </div>

      <!-- Other Files Section (if any, excluding project.json) -->
      <div v-if="others.length > 0" class="section">
        <div class="section-header" @click="showOthers = !showOthers">
          <i
            class="mdi"
            :class="showOthers ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          ></i>
          <span>Others ({{ others.length }})</span>
        </div>
        <div v-if="showOthers" class="assets-grid">
          <AssetCard
            v-for="node in others"
            :key="node.id"
            :node="node"
            @click="handleNodeClick"
          />
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading files...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="mdi mdi-alert-circle error-icon"></i>
      <p>{{ error }}</p>
      <button @click="refresh">Retry</button>
    </div>

    <div v-else class="empty-state">
      <i class="mdi mdi-folder-open-outline icon"></i>
      <p>This folder is empty</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { listFiles, uploadFileToGCS } from '@/services/gcp/gcs';
import type { FileSystemNode } from '@/types';
import { useConfigStore } from '@/stores/config';
import { useProjectStore } from '@/stores/project';
import AssetCard from './AssetCard.vue';

const props = defineProps<{
  allowedTypes?: string[];
  uploadType?: string;
  recursive?: boolean;
}>();

const configStore = useConfigStore();
const projectStore = useProjectStore();
const nodes = ref<FileSystemNode[]>([]);
const currentPath = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Section visibility states
const showFolders = ref(true);
const showImages = ref(true);
const showVideos = ref(true);
const showAudios = ref(true);
const showOthers = ref(true);

const currentPrefix = computed(() => {
  // Always include project ID in prefix if available
  const projectPrefix = projectStore.currentProjectId
    ? `${projectStore.currentProjectId}/`
    : '';
  const pathPrefix =
    currentPath.value.length > 0 ? currentPath.value.join('/') + '/' : '';
  return projectPrefix + pathPrefix;
});

// Computed properties for grouping
const folders = computed(() => nodes.value.filter((n) => n.type === 'folder'));

const files = computed(() =>
  nodes.value.filter((n) => {
    if (n.type !== 'file' || n.name === 'project.json') return false;

    if (!props.allowedTypes || props.allowedTypes.length === 0) return true;

    return props.allowedTypes.some((type) => {
      // Handle 'audio/', 'image/', 'video/' prefixes
      if (type.endsWith('/')) {
        // Check mimeType
        if (n.mimeType?.startsWith(type)) return true;

        // Check extension if mimeType is missing
        const ext = n.name.split('.').pop()?.toLowerCase();
        if (!ext) return false;

        if (type === 'image/')
          return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
        if (type === 'video/')
          return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
        if (type === 'audio/')
          return ['mp3', 'wav', 'aac', 'mpeg', 'm4a', 'flac'].includes(ext);
        return false;
      }

      if (type === 'text') {
        return (
          n.mimeType?.startsWith('text/') ||
          n.name.match(/\.(txt|srt|vtt|json|md)$/i)
        );
      }

      return n.mimeType === type;
    });
  })
);

const images = computed(() =>
  files.value.filter(
    (n) =>
      n.mimeType?.startsWith('image/') ||
      n.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  )
);

const videos = computed(() =>
  files.value.filter(
    (n) =>
      n.mimeType?.startsWith('video/') ||
      n.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)
  )
);

const audios = computed(() =>
  files.value.filter(
    (n) =>
      n.mimeType?.startsWith('audio/') ||
      n.name.match(/\.(mp3|wav|aac|mpeg|m4a|flac)$/i)
  )
);

const others = computed(() =>
  files.value.filter(
    (n) =>
      !images.value.includes(n) &&
      !videos.value.includes(n) &&
      !audios.value.includes(n)
  )
);

const refresh = async () => {
  if (!configStore.gcsBucketName) return;

  isLoading.value = true;
  error.value = null;

  try {
    // If recursive is true, pass empty delimiter to list all files
    const delimiter = props.recursive ? '' : '/';
    nodes.value = await listFiles(undefined, currentPrefix.value, delimiter);
  } catch (e: any) {
    error.value = e.message || 'Failed to list files';
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const handleNodeClick = (node: FileSystemNode) => {
  if (node.type === 'folder') {
    currentPath.value.push(node.name);
  } else {
    // File click handled by drag/drop usually, or preview
  }
};

const navigateToRoot = () => {
  currentPath.value = [];
};

const navigateToIndex = (index: number) => {
  currentPath.value = currentPath.value.slice(0, index + 1);
};

const triggerUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  isLoading.value = true;
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Upload to current path
      const prefix = currentPrefix.value.endsWith('/')
        ? currentPrefix.value.slice(0, -1)
        : currentPrefix.value;

      // Calculate duration if video or audio
      let metadata: Record<string, string> | undefined;
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        try {
          const duration = await new Promise<number>((resolve) => {
            const element = document.createElement(
              file.type.startsWith('video/') ? 'video' : 'audio'
            );
            element.preload = 'metadata';
            element.onloadedmetadata = () => {
              resolve(element.duration);
              URL.revokeObjectURL(element.src);
            };
            element.onerror = () => {
              resolve(0);
              URL.revokeObjectURL(element.src);
            };
            element.src = URL.createObjectURL(file);
          });

          if (duration > 0) {
            metadata = { duration: duration.toString() };
          }
        } catch (e) {
          console.warn('Failed to calculate duration for file', file.name, e);
        }
      }

      await uploadFileToGCS(file, file.name, undefined, prefix, metadata);
    }
    await refresh();
  } catch (e) {
    console.error('Upload failed', e);
    alert('Failed to upload files');
  } finally {
    isLoading.value = false;
    // Reset input
    if (fileInput.value) fileInput.value.value = '';
  }
};

watch(
  currentPath,
  () => {
    refresh();
  },
  { deep: true }
);

// Watch for project change to refresh root
watch(
  () => projectStore.currentProjectId,
  () => {
    currentPath.value = []; // Reset to root of new project
    refresh();
  }
);

onMounted(() => {
  refresh();
});

defineExpose({
  refresh,
});
</script>

<style scoped>
.file-system {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background-panel);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background);
  height: 40px;
  flex-shrink: 0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Hide scrollbar */
  flex: 1;
  margin-right: 8px;
}

.breadcrumbs::-webkit-scrollbar {
  display: none;
}

.breadcrumb-item {
  cursor: pointer;
  color: var(--color-text-secondary);
}

.breadcrumb-item:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: var(--color-text-primary);
  font-weight: 500;
  cursor: default;
  text-decoration: none;
}

.separator {
  margin: 0 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: var(--color-text-primary);
  background-color: rgba(255, 255, 255, 0.1);
}

.icon {
  font-size: 14px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  user-select: none;
}

.section-header:hover {
  color: var(--color-text-primary);
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-md);
  align-content: start;
  margin-top: 8px;
}

.loading-state,
.error-state,
.empty-state {
  padding: var(--spacing-md);
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 20px;
}

.error-state {
  color: #ff4d4d;
}
</style>
