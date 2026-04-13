<template>
  <div class="community-presets">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading community presets...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="() => loadPresets()">Retry</button>
    </div>
    
    <div v-else-if="communityPresets.length === 0" class="empty-state">
      <p>No community presets available yet.</p>
      <p class="help-text">Be the first to share your KB1 configuration!</p>
    </div>
    
    <div v-else class="presets-list">
      <div
        v-for="preset in communityPresets"
        :key="preset.id"
        class="preset-item"
      >
        <div class="preset-info">
          <div class="preset-name">{{ preset.metadata?.name || 'Unnamed Preset' }}</div>
          <div class="preset-description" v-if="preset.metadata?.description">{{ preset.metadata.description }}</div>
        </div>
        <button 
          class="btn-load" 
          @click="loadCommunityPreset(preset)"
          title="Load this preset">
          Load
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { DeviceSettings } from '../ble/kb1Protocol';
import { PRESET_BASE_URL } from '../constants';

interface PresetMetadata {
  name?: string;
  author?: string;
  description?: string;
  tags?: string[];
  date?: string;
}

interface CommunityPreset {
  id: string;
  metadata?: PresetMetadata;
  settings: DeviceSettings;
}

interface PresetIndex {
  version: string;
  lastUpdated: string;
  presets: Array<{
    id: string;
    filename: string;
    metadata?: PresetMetadata;
  }>;
}

const emit = defineEmits<{
  (e: 'load', preset: CommunityPreset): void;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const communityPresets = ref<CommunityPreset[]>([]);

async function loadPresets(forceRefresh = false) {
  loading.value = true;
  error.value = null;
  
  try {
    // Load index file from pocketmidi.com
    // Only use cache-busting when explicitly refreshing
    const cacheBuster = forceRefresh ? `?_=${Date.now()}` : '';
    const cacheMode = forceRefresh ? 'no-cache' : 'default';
    const indexResponse = await fetch(`${PRESET_BASE_URL}index.json${cacheBuster}`, {
      cache: cacheMode
    });
    
    if (!indexResponse.ok) {
      throw new Error('Failed to load community presets index');
    }
    
    const index: PresetIndex = await indexResponse.json();
    
    // Load each preset file
    const presetPromises = index.presets.map(async (presetInfo) => {
      try {
        const presetResponse = await fetch(`${PRESET_BASE_URL}${presetInfo.filename}${cacheBuster}`, {
          cache: cacheMode
        });
        if (!presetResponse.ok) {
          console.error(`Failed to load preset ${presetInfo.filename}`);
          return null;
        }
        const presetData = await presetResponse.json();
        return {
          id: presetInfo.id,
          metadata: presetData.metadata || presetInfo.metadata,
          settings: presetData.settings
        } as CommunityPreset;
      } catch (err) {
        console.error(`Error loading preset ${presetInfo.filename}:`, err);
        return null;
      }
    });
    
    const loadedPresets = await Promise.all(presetPromises);
    communityPresets.value = loadedPresets.filter((p) => p !== null) as CommunityPreset[];
    
  } catch (err) {
    console.error('Error loading community presets:', err);
    error.value = 'Failed to load community presets. Please check your internet connection.';
  } finally {
    loading.value = false;
  }
}

function loadCommunityPreset(preset: CommunityPreset) {
  emit('load', preset);
}

onMounted(() => {
  loadPresets();
});

// Expose loadPresets for parent component to call
defineExpose({
  loadPresets
});
</script>

<style scoped>
.community-presets {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 200px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1rem;
  color: #848484;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(116, 196, 255, 0.2);
  border-top-color: #74C4FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #FF6B6B;
}

.help-text {
  font-size: 0.875rem;
  opacity: 0.7;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  transition: opacity 0.2s;
}

.preset-item:hover {
  opacity: 0.8;
}

.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.preset-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
}

.preset-description {
  font-size: 0.75rem;
  color: #848484;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-load {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  background: rgba(116, 196, 255, 0.15);
  color: #74C4FF;
  border: 1px solid rgba(116, 196, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
}

.btn-load:hover {
  background: rgba(116, 196, 255, 0.25);
  border-color: rgba(116, 196, 255, 0.5);
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #EAEAEA;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.25);
}
</style>
