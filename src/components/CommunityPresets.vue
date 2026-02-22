<template>
  <div class="community-presets">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading community presets...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-secondary" @click="loadPresets">Retry</button>
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
          <div class="preset-meta">
            <span v-if="preset.metadata?.author" class="author">by {{ preset.metadata.author }}</span>
            <span v-if="preset.metadata?.description" class="description">{{ preset.metadata.description }}</span>
            <div v-if="preset.metadata?.tags && preset.metadata.tags.length > 0" class="tags">
              <span v-for="tag in preset.metadata.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
        
        <div class="preset-actions">
          <button 
            class="btn-small" 
            @click="loadCommunityPreset(preset)"
            title="Load this preset">
            Load
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { DeviceSettings } from '../ble/kb1Protocol';

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
  (e: 'load', settings: DeviceSettings): void;
}>();

const loading = ref(true);
const error = ref<string | null>(null);
const communityPresets = ref<CommunityPreset[]>([]);

async function loadPresets() {
  loading.value = true;
  error.value = null;
  
  try {
    // Load index file from GitHub
    const baseUrl = import.meta.env.BASE_URL || '/';
    const indexResponse = await fetch(`${baseUrl}community-presets/index.json`);
    
    if (!indexResponse.ok) {
      throw new Error('Failed to load community presets index');
    }
    
    const index: PresetIndex = await indexResponse.json();
    
    // Load each preset file
    const presetPromises = index.presets.map(async (presetInfo) => {
      try {
        const presetResponse = await fetch(`${baseUrl}community-presets/presets/${presetInfo.filename}`);
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
  emit('load', preset.settings);
}

onMounted(() => {
  loadPresets();
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
  gap: 0.5rem;
}

.preset-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  transition: all 0.2s;
}

.preset-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.preset-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.preset-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
}

.preset-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
}

.author {
  color: #74C4FF;
  font-weight: 400;
}

.description {
  color: #B0B0B0;
  line-height: 1.4;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.tag {
  padding: 0.125rem 0.5rem;
  background: rgba(106, 104, 83, 0.3);
  border: 1px solid rgba(106, 104, 83, 0.5);
  border-radius: 12px;
  font-size: 0.75rem;
  color: #C0C0C0;
  font-family: 'Roboto Mono', monospace;
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  background: rgba(116, 196, 255, 0.15);
  border: 1px solid rgba(116, 196, 255, 0.3);
  color: #74C4FF;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
}

.btn-small:hover {
  background: rgba(116, 196, 255, 0.25);
  border-color: rgba(116, 196, 255, 0.5);
}

.btn-small:active {
  background: rgba(116, 196, 255, 0.35);
  transform: scale(0.98);
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
