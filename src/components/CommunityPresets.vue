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
    
    <div v-else class="presets-list" :class="{ 'presets-list-full': props.fullHeight }">
      <div
        v-for="preset in communityPresets"
        :key="preset.id"
        class="preset-item"
      >
        <div class="preset-info">
          <div class="preset-name">{{ preset.metadata?.name || 'Unnamed Preset' }}</div>
          <div class="preset-snapshot" v-if="preset.metadata?.snapshot">{{ preset.metadata.snapshot }}</div>
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
import { ref } from 'vue';
import type { DeviceSettings } from '../ble/kb1Protocol';
import { PRESET_BASE_URL } from '../constants';

interface Props {
  fullHeight?: boolean; // Show taller list when export section is hidden
}

const props = withDefaults(defineProps<Props>(), {
  fullHeight: false
});

interface PresetMetadata {
  name?: string;
  author?: string;
  description?: string;
  snapshot?: string;
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

const loading = ref(false);
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
          // Silently skip missing presets (they're filtered out below)
          return null;
        }
        const presetData = await presetResponse.json();
        return {
          id: presetInfo.id,
          metadata: presetData.metadata || presetInfo.metadata,
          settings: presetData.settings
        } as CommunityPreset;
      } catch (err) {
        // Silently skip failed presets (CORS, network errors, etc.)
        return null;
      }
    });
    
    const loadedPresets = await Promise.all(presetPromises);
    communityPresets.value = loadedPresets.filter((p) => p !== null) as CommunityPreset[];
    
  } catch (err) {
    // Only show error for index.json failures (not individual preset failures)
    error.value = 'Failed to load community presets. Please check your internet connection.';
  } finally {
    loading.value = false;
  }
}

function loadCommunityPreset(preset: CommunityPreset) {
  emit('load', preset);
}

// Don't auto-load on mount - wait for parent to trigger via refresh or dialog open
// onMounted(() => {
//   loadPresets();
// });

// Expose loadPresets and communityPresets for parent component
defineExpose({
  loadPresets,
  communityPresets
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
  border-top-color: var(--bluetooth-status-active);
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
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.presets-list-full {
  max-height: 450px;
}

.presets-list::-webkit-scrollbar {
  width: 8px;
}

.presets-list::-webkit-scrollbar-track {
  background: rgba(234, 234, 234, 0.08);
  border-radius: 4px;
}

.presets-list::-webkit-scrollbar-thumb {
  background: rgba(234, 234, 234, 0.3);
  border-radius: 4px;
}

.presets-list::-webkit-scrollbar-thumb:hover {
  background: rgba(234, 234, 234, 0.3);
}

.preset-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  transition: opacity 0.2s;
  padding: 0.5rem 0;
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

.preset-snapshot {
  font-size: 0.6875rem;
  color: #6B6B6B;
  font-family: 'Roboto Mono', monospace;
  line-height: 1.4;
  white-space: pre-line;
  margin: 0.25rem 0;
  opacity: 0.8;
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
  background: rgba(132, 132, 132, 0.1);
  color: #EAEAEA;
  border: 1px solid rgba(205, 205, 205, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
}

.btn-load:hover {
  background: rgba(132, 132, 132, 0.2);
  border-color: rgba(205, 205, 205, 0.3);
  color: #FFFFFF;
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
