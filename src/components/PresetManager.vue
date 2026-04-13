<template>
  <div class="preset-manager">
    <!-- Selection Mode Header -->
    <div class="selection-header" v-if="selectionMode">
      <button class="btn-select-action" @click="toggleSelectAll">
        {{ allSelected ? 'Deselect All' : 'Select All' }}
      </button>
      <div class="selection-actions">
        <button 
          class="btn-delete-selected" 
          @click="deleteSelected"
          :disabled="selectedSlots.size === 0"
        >
          Delete {{ selectedSlots.size > 0 ? `(${selectedSlots.size})` : '' }}
        </button>
        <button class="btn-select-action" @click="exitSelectionMode">Cancel</button>
      </div>
    </div>

    <!-- Normal Mode Header -->
    <div class="normal-header" v-if="!selectionMode">
      <button class="btn-select-action" @click="enterSelectionMode">Select</button>
    </div>

    <!-- 8-Slot Preset System -->
    <div class="preset-slots">
      <div
        v-for="slot in 8"
        :key="`slot-${slot - 1}`"
        class="preset-slot"
        :class="{ 
          empty: !getSlotPreset(slot - 1),
          active: activeSlot === (slot - 1),
          'selection-mode': selectionMode
        }"
      >
        <!-- Selection Checkbox (when in selection mode) -->
        <div v-if="selectionMode" class="selection-checkbox" @click.stop="toggleSelection(slot - 1)">
          <input 
            type="checkbox" 
            :checked="selectedSlots.has(slot - 1)"
            @click.stop
          />
        </div>

        <!-- Slot Info (click to edit) -->
        <div class="slot-info" @click.stop="selectionMode ? toggleSelection(slot - 1) : openSlotDialog(slot - 1)">
          <div class="slot-label-wrapper">
            <div class="slot-label">SLOT {{ slot }}</div>
            <div class="slot-name">{{ getSlotPreset(slot - 1)?.name || '(Empty)' }}</div>
          </div>
          <button 
            v-if="getSlotPreset(slot - 1) && !selectionMode"
            class="btn-clear"
            @click.stop="clearSlot(slot - 1)"
            title="Delete preset"
          >×</button>
        </div>

        <!-- Slot Actions (hidden in selection mode) -->
        <div class="slot-actions" v-if="!selectionMode">
          <button 
            class="btn-action" 
            @click.stop="activateSlot(slot - 1)"
            :class="{ active: activeSlot === (slot - 1) }"
            :disabled="!getSlotPreset(slot - 1)"
            title="Load into web app">
            Activate
          </button>
          <button 
            class="btn-action btn-with-indicator" 
            @click.stop="syncNVSSlot(slot - 1)"
            :disabled="!isConnected"
            title="Sync with device NVS slot">
            NVS
            <span v-if="isSlotSavedToNVS(slot - 1)" class="button-indicator" title="Synced with device">●</span>
          </button>
          <button 
            class="btn-action btn-with-indicator" 
            @click.stop="openCloudDialog(slot - 1)"
            :disabled="!getSlotPreset(slot - 1)"
            title="Load from or save to cloud">
            Cloud
            <span v-if="isSlotExportedToCloud(slot - 1)" class="button-indicator button-indicator-cloud" title="Exported to cloud">●</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Slot Edit Dialog -->
    <div v-if="showSlotDialog" class="modal-overlay" @click.self.stop="showSlotDialog = false">
      <div class="modal-dialog">
        <h3>{{ getSlotPreset(editingSlot) ? 'Edit Preset' : 'Save Preset' }}</h3>
        
        <div class="form-group">
          <label>Preset Name</label>
          <input
            v-model="slotName"
            type="text"
            class="input-text"
            placeholder="Enter preset name"
            @keyup.enter="confirmSlotSave"
            ref="nameInput"
          />
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click.stop="generateSlotName">
            Random Name
          </button>
        </div>
        <div class="form-group">
          <label>Description (Optional)</label>
          <textarea
            v-model="slotDescription"
            class="input-text"
            rows="2"
            placeholder="Brief description for community sharing"
          ></textarea>
        </div>
        <div class="modal-buttons">
          <button class="btn-secondary" @click.stop="showSlotDialog = false">Cancel</button>
          <button class="btn-primary" @click.stop="confirmSlotSave" :disabled="!slotName.trim()">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Cloud Dialog (Export + Import) -->
    <div v-if="showCloudDialog" class="modal-overlay" @click.self.stop="showCloudDialog = false">
      <div class="modal-dialog cloud-dialog" @click.stop>
        <div class="modal-header">
          <h3>Cloud Presets</h3>
          <div class="header-actions">
            <button class="btn-refresh" @click.stop="refreshCommunityPresets" title="Refresh presets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
            <button class="close-btn" @click.stop="showCloudDialog = false">×</button>
          </div>
        </div>
        <div class="modal-body">
          
          <!-- Export Form (Compact) -->
          <div class="export-section">
            <div class="section-label">Share Your Preset</div>
            <div class="export-form-compact">
              <input
                v-model="exportMetadata.name"
                type="text"
                class="input-text"
                placeholder="Preset name (required)"
              />
              <textarea
                v-model="exportMetadata.description"
                class="input-text"
                rows="2"
                placeholder="Brief description (optional)"
              ></textarea>
              <button 
                class="btn-primary btn-export" 
                @click.stop="confirmExport"
                :disabled="!exportMetadata.name.trim()">
                Upload to Community
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="section-divider"></div>
          
          <!-- Browse/Import Section -->
          <div class="import-section">
            <div class="section-label">Browse Community Presets</div>
            <CommunityPresets ref="communityPresetsRef" @load="handleCloudPresetLoad" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { PresetStore, generateRandomName } from '../state/presets';
import type { DeviceSettings } from '../ble/kb1Protocol';
import { useDeviceState } from '../composables/useDeviceState';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import { PRESET_UPLOAD_ENDPOINT } from '../constants';
import CommunityPresets from './CommunityPresets.vue';

const {
  isConnected,
  devicePresets,
  saveDevicePreset,
  loadDevicePreset,
  deleteDevicePreset,
  refreshDevicePresets,
} = useDeviceState();

const toast = useToast();
const { confirm } = useConfirm();

const props = defineProps<{
  currentSettings: DeviceSettings;
  hasUnsavedChanges: boolean;
}>();

const emit = defineEmits<{
  (e: 'load', settings: DeviceSettings): void;
  (e: 'presetActivated', presetId: string | null): void;
  (e: 'slotNameDisplay', name: string): void;
  (e: 'slotCount', count: number, total: number): void;
}>();

// 8-Slot Preset System (localStorage)
interface SlotPreset {
  name: string;
  description?: string; // Optional description for community sharing
  settings: DeviceSettings;
  modifiedAt: number;
  exportedToCloud?: boolean; // Track if preset has been exported
}

const SLOTS_KEY = 'kb1_preset_slots';

// Load slots from localStorage
function loadSlotsFromStorage(): (SlotPreset | null)[] {
  try {
    const stored = localStorage.getItem(SLOTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load slots from localStorage:', error);
  }
  return Array(8).fill(null);
}

// Save slots to localStorage
function saveSlotsToStorage(slots: (SlotPreset | null)[]) {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  } catch (error) {
    console.error('Failed to save slots to localStorage:', error);
  }
}

const slots = ref<(SlotPreset | null)[]>(loadSlotsFromStorage());
const activeSlot = ref<number | null>(null);
const hasAutoSynced = ref(false); // Track if we've done initial auto-sync

// Dialog states
const showSlotDialog = ref(false);
const showCloudDialog = ref(false);

// Selection mode
const selectionMode = ref(false);
const selectedSlots = ref(new Set<number>());

// Editing state
const editingSlot = ref<number>(0);
const slotName = ref('');
const slotDescription = ref('');
const exportingSlot = ref<number | null>(null);

// Export metadata (simplified)
const exportMetadata = ref({
  name: '',
  description: ''
});

// Community presets reference
const communityPresetsRef = ref<InstanceType<typeof CommunityPresets> | null>(null);

// Legacy refs (keep for device preset functions)
const nameInput = ref<HTMLInputElement | null>(null);

// Device preset state
const activeDeviceSlot = ref<number | null>(null);

// Load presets on mount
onMounted(() => {
  console.log('🎬 PresetManager mounted');
  console.log('📊 Initial device presets:', JSON.parse(JSON.stringify(devicePresets.value)));
  refreshDevicePresets();
});

// ========================================
// 8-Slot System Functions
// ========================================

function getSlotPreset(slot: number): SlotPreset | null {
  return slots.value[slot] || null;
}

function isSlotSavedToNVS(slot: number): boolean {
  const slotPreset = getSlotPreset(slot);
  if (!slotPreset) return false;
  
  // Check if device has a preset with matching name
  const devicePreset = getDevicePreset(slot);
  return devicePreset.isValid && devicePreset.name === slotPreset.name;
}

function isSlotExportedToCloud(slot: number): boolean {
  const slotPreset = getSlotPreset(slot);
  return slotPreset?.exportedToCloud === true;
}

function clearSlot(slot: number) {
  const preset = getSlotPreset(slot);
  if (!preset) return;
  
  // Simple confirmation
  if (!window.confirm(`Delete "${preset.name}"?`)) return;
  
  const newSlots = [...slots.value];
  newSlots[slot] = null;
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  // Clear active state if this was active
  if (activeSlot.value === slot) {
    activeSlot.value = null;
  }
  
  toast.success(`Deleted "${preset.name}"`);
}

// ========================================
// Selection Mode Functions
// ========================================

const allSelected = computed(() => {
  const filledSlots = slots.value.filter(s => s !== null).length;
  return filledSlots > 0 && selectedSlots.value.size === filledSlots;
});

function toggleSelection(slot: number) {
  if (selectedSlots.value.has(slot)) {
    selectedSlots.value.delete(slot);
  } else {
    selectedSlots.value.add(slot);
  }
  // Trigger reactivity
  selectedSlots.value = new Set(selectedSlots.value);
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedSlots.value.clear();
    selectedSlots.value = new Set();
  } else {
    const filledSlotIndices: number[] = [];
    slots.value.forEach((preset, index) => {
      if (preset !== null) filledSlotIndices.push(index);
    });
    selectedSlots.value = new Set(filledSlotIndices);
  }
}

async function deleteSelected() {
  if (selectedSlots.value.size === 0) return;
  
  const count = selectedSlots.value.size;
  const confirmed = await confirm(
    `Delete ${count} selected preset${count > 1 ? 's' : ''}?`
  );
  
  if (!confirmed) return;
  
  const newSlots = [...slots.value];
  selectedSlots.value.forEach(slot => {
    newSlots[slot] = null;
    if (activeSlot.value === slot) {
      activeSlot.value = null;
    }
  });
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  toast.success(`Deleted ${count} preset${count > 1 ? 's' : ''}`);
  
  // Exit selection mode
  exitSelectionMode();
}

function enterSelectionMode() {
  selectionMode.value = true;
  selectedSlots.value.clear();
  selectedSlots.value = new Set();
}

function exitSelectionMode() {
  selectionMode.value = false;
  selectedSlots.value.clear();
  selectedSlots.value = new Set();
}

// Expose for parent to toggle
defineExpose({
  enterSelectionMode,
  exitSelectionMode,
  selectionMode
});

function openSlotDialog(slot: number) {
  editingSlot.value = slot;
  const existing = getSlotPreset(slot);
  slotName.value = existing?.name || '';
  slotDescription.value = existing?.description || '';
  showSlotDialog.value = true;
  
  nextTick(() => {
    nameInput.value?.focus();
    nameInput.value?.select();
  });
}

function generateSlotName() {
  slotName.value = generateRandomName();
}

function confirmSlotSave() {
  const name = slotName.value.trim();
  if (!name) return;
  
  // Save current settings to slot (preserve exportedToCloud flag if editing)
  const existingPreset = getSlotPreset(editingSlot.value);
  const newSlots = [...slots.value];
  newSlots[editingSlot.value] = {
    name,
    description: slotDescription.value.trim() || undefined,
    settings: props.currentSettings,
    modifiedAt: Date.now(),
    exportedToCloud: existingPreset?.exportedToCloud // Preserve cloud export status
  };
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  toast.success(`Saved to slot ${editingSlot.value + 1}: "${name}"`);
  showSlotDialog.value = false;
  slotName.value = '';
  slotDescription.value = '';
}

function activateSlot(slot: number) {
  const preset = getSlotPreset(slot);
  if (!preset) return;
  
  emit('load', preset.settings);
  activeSlot.value = slot;
  activeDeviceSlot.value = null;
  
  toast.success(`Activated: "${preset.name}"`);
}

async function syncNVSSlot(slot: number) {
  if (!isConnected.value) return;
  
  // Refresh device presets to ensure we have latest data
  await refreshDevicePresets();
  
  const localPreset = getSlotPreset(slot);
  const devicePreset = getDevicePreset(slot);
  
  // Case 1: Both empty
  if (!localPreset && !devicePreset.isValid) {
    toast.info(`Slot ${slot + 1} is empty on both device and browser`);
    return;
  }
  
  // Case 2: Already in sync (same name)
  if (localPreset && devicePreset.isValid && localPreset.name === devicePreset.name) {
    toast.success(`Slot ${slot + 1} already synced: "${localPreset.name}"`);
    return;
  }
  
  // Case 3: Local has data → Save to device (overwrite)
  if (localPreset) {
    try {
      await saveDevicePreset(slot, localPreset.name);
      toast.success(`Saved to device: "${localPreset.name}"`);
      
      // Refresh to update NVS indicator
      await refreshDevicePresets();
    } catch (error) {
      console.error('Failed to save to device:', error);
      toast.error('Failed to save to device');
    }
    return;
  }
  
  // Case 4: Local empty, device has data → Load from device
  if (devicePreset.isValid) {
    try {
      await loadDevicePreset(slot);
      
      const newSlots = [...slots.value];
      newSlots[slot] = {
        name: devicePreset.name,
        settings: props.currentSettings,
        modifiedAt: Date.now()
      };
      
      slots.value = newSlots;
      saveSlotsToStorage(newSlots);
      
      toast.success(`Loaded from device: "${devicePreset.name}"`);
    } catch (error) {
      console.error('Failed to load from device:', error);
      toast.error('Failed to load from device');
    }
  }
}

function openCloudDialog(slot: number) {
  exportingSlot.value = slot;
  
  // Pre-fill export form with current preset name and description
  const preset = getSlotPreset(slot);
  if (preset) {
    exportMetadata.value.name = preset.name;
    exportMetadata.value.description = preset.description || '';
  }
  
  showCloudDialog.value = true;
}

async function handleCloudPresetLoad(preset: { id: string; metadata?: { name?: string; author?: string; description?: string; tags?: string[] }; settings: DeviceSettings }) {
  if (exportingSlot.value === null) {
    showCloudDialog.value = false;
    return;
  }
  
  const slotIndex = exportingSlot.value;
  const presetName = preset.metadata?.name || 'Imported Preset';
  const existingPreset = slots.value[slotIndex];
  
  // If slot is occupied, ask for confirmation
  if (existingPreset) {
    const confirmed = await confirm(
      `Replace "${existingPreset.name}" with "${presetName}"?`
    );
    if (!confirmed) {
      return;
    }
  }
  
  const newSlots = [...slots.value];
  newSlots[slotIndex] = {
    name: presetName,
    description: preset.metadata?.description,
    settings: preset.settings,
    modifiedAt: Date.now()
  };
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  toast.success(`Imported to slot ${slotIndex + 1}: "${presetName}"`);
  showCloudDialog.value = false;
  exportingSlot.value = null;
}

// ========================================
// Device Preset Functions
// ========================================

// Helper to get device preset by slot
function getDevicePreset(slot: number) {
  const preset = devicePresets.value[slot] || { 
    slot, 
    name: '[Empty]', 
    timestamp: 0, 
    isValid: false 
  };
  return preset;
}

// Device preset functions removed - functionality handled by syncNVSSlot

// Load presets on mount

// Debug: Watch devicePresets for changes & auto-sync on connect
watch(devicePresets, async (newPresets) => {
  console.log('🔄 Device presets changed:', JSON.parse(JSON.stringify(newPresets)));
  
  // Auto-sync device presets to empty browser slots on initial connect
  if (!hasAutoSynced.value && isConnected.value && newPresets.length > 0) {
    hasAutoSynced.value = true;
    
    let syncedCount = 0;
    
    // Load each device preset into empty browser slots (sequentially to avoid BLE conflicts)
    for (let i = 0; i < 8; i++) {
      const devicePreset = newPresets[i];
      const browserSlot = slots.value[i];
      
      // Only auto-load if browser slot is empty and device has data
      if (!browserSlot && devicePreset?.isValid) {
        try {
          // Load preset from device (updates active settings)
          await loadDevicePreset(i);
          
          // Save to browser slot
          const newSlots = [...slots.value];
          newSlots[i] = {
            name: devicePreset.name,
            settings: props.currentSettings,
            modifiedAt: Date.now()
          };
          slots.value = newSlots;
          saveSlotsToStorage(newSlots);
          
          syncedCount++;
          console.log(`Auto-synced slot ${i + 1}: "${devicePreset.name}"`);
        } catch (error) {
          console.error(`Failed to auto-sync slot ${i + 1}:`, error);
        }
      }
    }
    
    if (syncedCount > 0) {
      toast.success(`Auto-synced ${syncedCount} preset${syncedCount > 1 ? 's' : ''} from device`);
    }
  }
}, { deep: true });

// Watch slots and emit count changes
watch(slots, (newSlots) => {
  const usedCount = newSlots.filter(s => s !== null).length;
  emit('slotCount', usedCount, 8);
}, { immediate: true, deep: true });

// Reset auto-sync flag on disconnect
watch(isConnected, (connected) => {
  if (!connected) {
    hasAutoSynced.value = false;
  }
});



function refreshCommunityPresets() {
  // Force refresh with cache-busting
  communityPresetsRef.value?.loadPresets(true);
}

async function confirmExport() {
  if (exportingSlot.value === null) return;
  
  const preset = getSlotPreset(exportingSlot.value);
  if (!preset) return;
  
  // Generate unique preset ID for community sharing
  const presetId = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Build metadata
  const metadata: any = {
    name: exportMetadata.value.name,
    date: new Date().toISOString().split('T')[0]
  };
  
  if (exportMetadata.value.description) {
    metadata.description = exportMetadata.value.description;
  }
  
  const presetData = {
    id: presetId,
    metadata,
    settings: preset.settings
  };
  
  // Upload to server or download locally
  if (PRESET_UPLOAD_ENDPOINT) {
    try {
      const response = await fetch(PRESET_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Uncomment if using API key authentication:
          // 'X-API-Key': 'your-api-key-here'
        },
        body: JSON.stringify(presetData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Preset uploaded:', result);
      
      // Mark slot as exported to cloud
      if (exportingSlot.value !== null) {
        const newSlots = [...slots.value];
        const slotPreset = newSlots[exportingSlot.value];
        if (slotPreset) {
          slotPreset.exportedToCloud = true;
          slots.value = newSlots;
          saveSlotsToStorage(newSlots);
        }
      }
      
      toast.success(`Preset uploaded to community library!`, 5000);
      
      // Reset form but keep dialog open
      exportMetadata.value = { name: '', description: '' };
      exportingSlot.value = null;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Development mode: Download locally
    const json = JSON.stringify(presetData, null, 2);
    const filename = `${presetId}.json`;
    
    downloadJSON(json, filename);
    
    // Show dev testing instructions
    const indexEntry = {
      id: presetId,
      filename: filename,
      metadata: presetData.metadata
    };
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('COMMUNITY PRESET EXPORT - DEV TESTING');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. File downloaded:', filename);
    console.log('2. Upload to: https://pocketmidi.com/upload-preset.php');
    console.log('3. Or add to public/community-presets/presets/ and index.json:');
    console.log(JSON.stringify(indexEntry, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    toast.success(`Downloaded ${filename}`);
    
    // Reset form but keep dialog open
    exportMetadata.value = { name: '', description: '' };
    exportingSlot.value = null;
  }
}

function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import/export functions removed - functionality handled by cloud dialog
</script>

<style scoped>
.preset-manager {
  padding: 1rem;
  font-family: 'Roboto Mono', monospace;
}

.preset-title {
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Slot System */
.preset-slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(29, 29, 29, 0.5);
  border: 1px solid rgba(205, 205, 205, 0.1);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  gap: 1rem;
  transition: all 0.2s;
}

.preset-slot:hover {
  background: rgba(29, 29, 29, 0.7);
  border-color: rgba(205, 205, 205, 0.2);
}

.preset-slot.active {
  border-color: #4A90E2;
  background: rgba(74, 144, 226, 0.05);
}

.preset-slot.empty {
  opacity: 0.6;
}

.slot-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.slot-label-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.slot-label {
  font-size: 0.8125rem;
  font-weight: 400;
  color: #EAEAEA;
  letter-spacing: 0.05em;
}

.slot-name {
  font-size: 0.8125rem;
  color: #CDCDCD;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-slot.empty .slot-name {
  color: #848484;
  font-style: italic;
}

.btn-clear {
  background: transparent;
  border: none;
  color: #848484;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  border-radius: 4px;
}

.btn-clear:hover {
  background: rgba(205, 205, 205, 0.1);
  color: #E57373;
}

.slot-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-action {
  position: relative;
  background: rgba(132, 132, 132, 0.1);
  border: 1px solid rgba(205, 205, 205, 0.2);
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #CDCDCD;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  background: rgba(132, 132, 132, 0.2);
  border-color: rgba(205, 205, 205, 0.3);
  color: #EAEAEA;
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-action.active {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4A90E2;
  color: #4A90E2;
}

.btn-with-indicator {
  padding-right: 0.5rem;
}

.button-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #4CAF50;
  border-radius: 50%;
  font-size: 0;
  animation: pulse 2s ease-in-out infinite;
}

.button-indicator-cloud {
  background: #4A90E2;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Cloud Dialog */
.cloud-dialog {
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.dialog-intro {
  margin-bottom: 1rem;
}

.dialog-intro p {
  margin: 0;
  font-size: 0.8125rem;
  color: #848484;
  line-height: 1.5;
}

/* Cloud Dialog - Export + Import Unified */
.export-section {
  margin-bottom: 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #848484;
  margin-bottom: 0.5rem;
}

.export-form-compact {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.export-form-compact input,
.export-form-compact textarea {
  font-size: 0.8125rem;
}

.export-form-compact textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-export {
  padding: 0.625rem;
  font-size: 0.8125rem;
}

.btn-export:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.section-divider {
  height: 1px;
  background: var(--color-border);
  margin: 1rem 0;
}

.import-section {
  /* Community presets list below */
}

.btn-refresh {
  background: none;
  border: none;
  color: #74C4FF;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 4px;
}

.btn-refresh svg {
  width: 100%;
  height: 100%;
  display: block;
}

.btn-refresh:hover {
  transform: rotate(180deg);
}

.btn-refresh:active {
  transform: rotate(180deg) scale(0.95);
}

/* Tab Navigation (Legacy - can be removed if unused) */
.preset-tabs {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.preset-tab {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #848484;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  font-family: 'Roboto Mono', monospace;
}

.preset-tab:hover {
  color: #CDCDCD;
}

.preset-tab.active {
  color: #CDCDCD;
}

.preset-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #CDCDCD;
}

.tab-content {
  display: block;
}

/* Slot Indicator (Legacy from device presets) */
.slot-indicator {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(29, 29, 29, 0.3);
  border-radius: 4px;
}

.slot-fade-label {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: #F9AC20;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 2s ease-out;
  pointer-events: none;
}

.slot-fade-label.fading {
  opacity: 0;
}

.slot-boxes {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
}

.slot-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 21px;
  height: 22px;
  background: rgba(234, 234, 234, 0.05);
  border-radius: 4px;
  cursor: default;
  transition: all 0.2s;
}

.slot-box.filled {
  background: rgba(234, 234, 234, 0.15);
  cursor: pointer;
}

.slot-box.filled:hover {
  background: rgba(234, 234, 234, 0.25);
}

.slot-box.active {
  background: rgba(249, 172, 32, 0.3);
  border: 1px solid #F9AC20;
}

.slot-box.active:hover {
  background: rgba(249, 172, 32, 0.4);
}

.slot-box.empty {
  opacity: 0.3;
}

.slot-box:hover .slot-number {
  color: #F9AC20;
}

.slot-number {
  font-size: 0.6875rem;
  font-weight: 500;
  color: rgba(249, 172, 32, 0.5);
  font-family: 'Roboto Mono', monospace;
  transition: color 0.2s ease;
}

.slot-divider {
  width: 1px;
  height: 16px;
  background: rgba(234, 234, 234, 0.2);
  margin: 0 0.5rem;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow: visible;
}

.preset-item {
  background: rgba(29, 29, 29, 0.4);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  position: relative;
}

.preset-item.active {
  background: rgba(106, 104, 83, 0.25);
}

.preset-item:hover {
  background: rgba(234, 234, 234, 0.1);
}

.preset-item.selected {
  background: rgba(249, 172, 32, 0.2);
}

.preset-item.device-slot.empty {
  opacity: 0.5;
}

.preset-checkbox {
  display: flex;
  align-items: center;
  margin-right: 0.75rem;
  cursor: pointer;
}

.preset-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent-highlight);
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.active-indicator {
  color: #6A6853;
  font-size: 0.6rem;
}

.preset-meta {
  font-size: 0.75rem;
  color: var(--label-gray);
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  position: relative;
}

.btn-small {
  padding: 0.25rem 0.75rem;
  background: rgba(234, 234, 234, 0.1);
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
}

.btn-small:hover:not(:disabled) {
  background: rgba(234, 234, 234, 0.2);
}

.btn-small:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-menu {
  padding: 0.375rem 0.5rem;
  font-size: 1rem;
  line-height: 1;
}

.btn-delete {
  color: rgba(255, 68, 68, 0.8) !important;
}

.btn-delete:hover:not(:disabled) {
  background: rgba(255, 68, 68, 0.15) !important;
  color: #ff4444 !important;
}

.preset-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 4px;
  padding: 0.25rem;
  z-index: 9999;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
}

.preset-menu button {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  border-radius: 3px;
  font-family: 'Roboto Mono', monospace;
  transition: background 0.2s;
}

.preset-menu button:hover {
  background: rgba(234, 234, 234, 0.1);
}

.preset-menu button.btn-danger {
  color: #ff4444;
}

.preset-menu button.btn-danger:hover {
  background: rgba(255, 68, 68, 0.1);
}

.menu-divider {
  height: 1px;
  background: rgba(234, 234, 234, 0.1);
  margin: 0.25rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #848484;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.8125rem;
}

.empty-state .hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.import-export-section {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: none;
}

.btn-secondary {
  flex: 1;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(234, 234, 234, 0.1);
}

.btn-secondary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.modal-dialog {
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.modal-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #EAEAEA;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #848484;
  text-transform: uppercase;
}

.input-text {
  width: 100%;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  border-radius: 4px;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono', monospace;
  box-sizing: border-box;
}

textarea.input-text {
  resize: vertical;
  min-height: 60px;
}

.input-text:focus {
  outline: none;
  background: rgba(234, 234, 234, 0.08);
}

.input-select {
  width: 100%;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  border-radius: 4px;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono', monospace;
  box-sizing: border-box;
  cursor: pointer;
}

.input-select:focus {
  outline: none;
  background: rgba(234, 234, 234, 0.08);
}

.form-actions {
  margin-bottom: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-primary {
  padding: 0.25rem 1rem;
  background: #6A6853;
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-primary:hover:not(:disabled) {
  background: #7A7863;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Import Dialog (standalone if needed) */
.import-dialog {
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.import-dialog .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.import-dialog .modal-header h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.import-dialog .modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.export-intro {
  font-size: 0.8125rem;
  color: #848484;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
}

.metadata-form {
  margin-bottom: 1.5rem;
}

.metadata-form textarea {
  resize: vertical;
  min-height: 60px;
}

@media (max-width: 768px) {
  .preset-actions {
    flex-wrap: wrap;
  }
  
  .btn-small {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Device Presets Section */
.preset-section {
  margin-bottom: 2rem;
}

.preset-section-header {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #848484;
  margin-bottom: 1rem;
  font-family: 'Roboto Mono', monospace;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.section-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.device-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.device-preset-slot {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, background-color 0.2s;
  background: rgba(234, 234, 234, 0.02);
}

.device-preset-slot.active {
  border-color: var(--accent-highlight);
  background: rgba(106, 104, 83, 0.1);
}

.device-preset-slot.empty {
  opacity: 0.5;
  border-style: dashed;
}

.device-preset-slot:hover:not(.empty) {
  border-color: rgba(234, 234, 234, 0.3);
}

.slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-name {
  font-size: 0.8125rem;
  font-weight: 600;
  word-break: break-word;
  color: var(--color-text);
  flex: 1;
}

.slot-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.slot-actions .btn-small {
  flex: 1;
  min-width: 45px;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}

.slot-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-create {
  background: rgba(249, 172, 32, 0.2) !important;
  border: 1px solid rgba(249, 172, 32, 0.3) !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 0 0 rgba(249, 172, 32, 0) !important;
}

.btn-create:hover {
  background: rgba(249, 172, 32, 0.3) !important;
  border-color: rgba(249, 172, 32, 0.6) !important;
  box-shadow: 0 0 10px rgba(249, 172, 32, 0.35) !important;
  color: #F9AC20 !important;
}

.btn-create:active {
  background: rgba(249, 172, 32, 0.4) !important;
  border-color: #F9AC20 !important;
  box-shadow: 0 0 14px rgba(249, 172, 32, 0.45) !important;
  transform: scale(0.98) !important;
}

.section-divider {
  margin: 2rem 0;
  text-align: center;
  position: relative;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-divider);
}

.section-divider span {
  position: relative;
  background: var(--color-background);
  padding: 0 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 500;
}

@media (max-width: 768px) {
  .device-presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Info Icon */
.info-icon {
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.625rem;
  color: #848484;
  border: 1px solid #848484;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  margin-left: 0.5rem;
}

.info-icon:hover {
  color: #0DC988;
  border-color: #0DC988;
}

/* Help Modal */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.help-modal {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Roboto Mono';
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.help-modal-header h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-background-mute);
  color: #EAEAEA;
}

.help-modal-body {
  padding: 1.5rem;
}

.help-modal-body p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text);
}

.help-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .btn-primary {
  padding: 0.5rem 1.5rem;
  background: #0DC988;
  color: #1A1A1A;
  border: none;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  background: #0BA872;
}

/* ========================================
   Selection Mode Styles
   ======================================== */

.selection-header,
.normal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(205, 205, 205, 0.1);
}

.normal-header {
  justify-content: flex-end;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-select-action {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono', monospace;
  font-weight: 400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(29, 29, 29, 0.5);
  color: #CDCDCD;
  border: 1px solid rgba(205, 205, 205, 0.2);
}

.btn-select-action:hover {
  background: rgba(29, 29, 29, 0.7);
  border-color: rgba(205, 205, 205, 0.3);
}

.btn-delete-selected {
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono', monospace;
  font-weight: 400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(244, 67, 54, 0.15);
  color: #F44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.btn-delete-selected:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.25);
  border-color: rgba(244, 67, 54, 0.5);
}

.btn-delete-selected:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preset-slot.selection-mode {
  cursor: pointer;
}

.preset-slot.selection-mode .slot-info {
  padding-left: 2.5rem; /* Make room for checkbox */
}

.selection-checkbox {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #0DC988;
}

.preset-slot {
  position: relative; /* For absolute positioning of checkbox */
}
</style>

