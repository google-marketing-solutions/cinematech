<template>
  <div class="audio-generator">
    <div class="header" @click="isExpanded = !isExpanded">
      <div class="title">
        <i class="mdi mdi-creation"></i>
        <span>Generate Audio</span>
      </div>
      <i
        class="mdi"
        :class="isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      ></i>
    </div>

    <div v-if="isExpanded" class="content">
      <div class="mode-toggle">
        <button
          class="toggle-btn"
          :class="{ active: mode === 'music' }"
          @click="mode = 'music'"
        >
          Music
        </button>
        <button
          class="toggle-btn"
          :class="{ active: mode === 'voice' }"
          @click="mode = 'voice'"
        >
          Voiceover
        </button>
      </div>

      <div v-if="mode === 'music'" class="form-group">
        <label>Prompt</label>
        <textarea
          v-model="musicPrompt"
          placeholder="Describe the music (e.g., 'Upbeat electronic track with a driving beat')"
          rows="3"
        ></textarea>
      </div>

      <div v-if="mode === 'voice'" class="form-group">
        <label>Text</label>
        <textarea
          v-model="voiceText"
          placeholder="Enter text to speak..."
          rows="3"
        ></textarea>

        <label>Voice</label>
        <select v-model="selectedVoice">
          <option value="Kore">Kore (Female)</option>
          <option value="Charon">Charon (Male)</option>
          <option value="Fenrir">Fenrir (Male)</option>
          <option value="Puck">Puck (Male)</option>
          <option value="Aoede">Aoede (Female)</option>
        </select>
      </div>

      <div class="actions">
        <button
          class="generate-btn"
          :disabled="isGenerating || !isValid"
          @click="generate"
        >
          <span v-if="isGenerating" class="spinner-small"></span>
          {{ isGenerating ? 'Generating...' : 'Generate' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { generateMusic, generateSpeech } from '@/services/gcp/vertex';
import { saveBase64ToGCS } from '@/services/gcp/gcs';
import { useProjectStore } from '@/stores/project';

const emit = defineEmits(['generated']);

const isExpanded = ref(false);
const mode = ref<'music' | 'voice'>('music');
const isGenerating = ref(false);
const error = ref<string | null>(null);

// Music inputs
const musicPrompt = ref('');

// Voice inputs
const voiceText = ref('');
const selectedVoice = ref('Kore');

const projectStore = useProjectStore();

const isValid = computed(() => {
  if (mode.value === 'music') return musicPrompt.value.trim().length > 0;
  if (mode.value === 'voice') return voiceText.value.trim().length > 0;
  return false;
});

const generate = async () => {
  if (!isValid.value) return;

  isGenerating.value = true;
  error.value = null;

  try {
    let base64Audio = '';
    let prefix = '';

    if (projectStore.currentProjectId) {
      prefix = `${projectStore.currentProjectId}`;
    }

    if (mode.value === 'music') {
      base64Audio = await generateMusic(musicPrompt.value);
    } else {
      base64Audio = await generateSpeech(voiceText.value, selectedVoice.value);
    }

    if (!base64Audio) {
      throw new Error('No audio data received');
    }

    // Save to GCS
    const fileType = mode.value === 'music' ? 'music' : 'voiceover';
    const mimeType = mode.value === 'music' ? 'audio/wav' : 'audio/mpeg';

    // Generate descriptive name
    let name = fileType;
    if (mode.value === 'music' && musicPrompt.value) {
      name = musicPrompt.value
        .slice(0, 30)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
    } else if (mode.value === 'voice' && voiceText.value) {
      name = voiceText.value
        .slice(0, 30)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
    }

    // Pass custom filename to saveBase64ToGCS via metadata or just construct it there?
    // saveBase64ToGCS constructs filename. We need to modify it or pass it.
    // Actually saveBase64ToGCS takes fileType. We can pass the name as fileType?
    // No, saveBase64ToGCS uses fileType in `${fileType}-${Date.now()}.${extension}`
    // We can pass the descriptive name as fileType!

    const gcsUri = await saveBase64ToGCS(
      base64Audio,
      name,
      mimeType,
      undefined,
      prefix
    );

    emit('generated', gcsUri);

    // Reset inputs
    if (mode.value === 'music') musicPrompt.value = '';
    else voiceText.value = '';

    isExpanded.value = false; // Collapse on success
  } catch (e: any) {
    error.value = e.message || 'Generation failed';
    console.error(e);
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.audio-generator {
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
}

.header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.header:hover {
  background-color: var(--color-background-mute);
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.content {
  padding: 16px;
  border-top: 1px solid var(--color-border);
}

.mode-toggle {
  display: flex;
  background-color: var(--color-background);
  padding: 2px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid var(--color-border);
}

.toggle-btn {
  flex: 1;
  padding: 6px;
  font-size: 12px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.toggle-btn.active {
  background-color: var(--color-background-mute);
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

textarea,
select {
  width: 100%;
  padding: 8px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 13px;
  resize: vertical;
}

textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.generate-btn {
  background-color: var(--color-accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: 12px;
  color: #ff4d4d;
  font-size: 12px;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
