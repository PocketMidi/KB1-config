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
      <span class="info-icon" @click="showHelpDialog = true" title="How to use presets">i</span>
      <button class="btn-select-action" @click="enterSelectionMode">Select</button>
    </div>

    <!-- Factory Defaults Button (top with divider) -->
    <button 
      v-if="!selectionMode"
      class="btn-factory-defaults"
      @click.stop="loadFactoryDefaults"
      title="Load default starter presets">
      Load Defaults
    </button>
    <div v-if="!selectionMode" class="factory-divider"></div>

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
            <div class="slot-label">
              {{ slot }}
              <span v-if="getSlotPreset(slot - 1)?.author" class="author-badge" :title="'Created by ' + getSlotPreset(slot - 1)?.author">{{ getSlotPreset(slot - 1)?.author }}</span>
            </div>
            <div class="slot-name">{{ getSlotPreset(slot - 1)?.name || '(Empty)' }}</div>
          </div>
        </div>

        <!-- Slot Actions (hidden in selection mode) -->
        <div class="slot-actions" v-if="!selectionMode">
          <button 
            class="btn-action" 
            @click.stop="activateSlot(slot - 1)"
            :class="{ active: activeSlot === (slot - 1) }"
            :disabled="!getSlotPreset(slot - 1)"
            title="Load into web app">
            Apply
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
            :class="{ 'btn-cloud-empty': !getSlotPreset(slot - 1), 'btn-disabled': getSlotPreset(slot - 1)?.isFactoryDefault }"
            @click.stop="getSlotPreset(slot - 1)?.isFactoryDefault ? null : openCloudDialog(slot - 1)"
            :disabled="getSlotPreset(slot - 1)?.isFactoryDefault"
            :title="getSlotPreset(slot - 1)?.isFactoryDefault ? 'Starter presets cannot be uploaded' : (getSlotPreset(slot - 1) ? 'Load from or save to cloud' : 'Load preset from cloud')">
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
          <label>Author (Optional)</label>
          <input
            v-model="slotAuthor"
            type="text"
            class="input-text"
            placeholder="Your name"
            maxlength="14"
          />
        </div>
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
          <label>Settings Snapshot</label>
          <div class="settings-snapshot">{{ generateSettingsSnapshot(props.currentSettings) }}</div>
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
          <button 
            v-if="getSlotPreset(editingSlot)"
            class="btn-delete" 
            @click.stop="deleteCurrentSlot"
            title="Delete this preset"
          >Delete</button>
          <div class="modal-buttons-right">
            <button class="btn-secondary" @click.stop="showSlotDialog = false">Cancel</button>
            <button class="btn-primary" @click.stop="confirmSlotSave" :disabled="!slotName.trim()">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cloud Dialog (Export + Import) -->
    <div v-if="showCloudDialog" class="modal-overlay" @click.self.stop="showCloudDialog = false">
      <div class="modal-dialog cloud-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ exportingSlot !== null && getSlotPreset(exportingSlot) ? 'Share Your Preset' : 'Browse Community Presets' }}</h3>
          <div class="header-actions">
            <button 
              v-if="exportingSlot === null || !getSlotPreset(exportingSlot)"
              class="btn-refresh" 
              @click.stop="refreshCommunityPresets" 
              title="Refresh presets">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
            <button class="close-btn" @click.stop="showCloudDialog = false">×</button>
          </div>
        </div>
        <div class="modal-body">
          
          <!-- Export Form (Compact) - Only show if slot has content -->
          <div class="export-section" v-if="exportingSlot !== null && getSlotPreset(exportingSlot)">
            <div class="section-label">Share Your Preset</div>
            <div class="export-form-compact">
              <div class="form-group">
                <label>Author (Optional)</label>
                <input
                  v-model="exportMetadata.author"
                  type="text"
                  class="input-text"
                  placeholder="Your name (max 12 chars)"
                  maxlength="12"
                />
              </div>
              <div class="form-group">
                <label>Preset Name</label>
                <input
                  v-model="exportMetadata.name"
                  type="text"
                  class="input-text"
                  placeholder="Enter preset name"
                />
              </div>
              <div class="settings-snapshot" v-if="exportingSlot !== null && getSlotPreset(exportingSlot)">{{ getSlotPreset(exportingSlot)?.snapshot || generateSettingsSnapshot(getSlotPreset(exportingSlot)?.settings || props.currentSettings) }}</div>
              <div class="form-group">
                <label>Description (Optional)</label>
                <textarea
                  v-model="exportMetadata.description"
                  class="input-text"
                  rows="2"
                  placeholder="Brief description"
                ></textarea>
              </div>
              <button 
                class="btn-primary btn-export" 
                @click.stop="confirmExport"
                :disabled="!exportMetadata.name.trim()">
                Upload to Community
              </button>
            </div>
          </div>

          <!-- Browse/Import Section - Only show if slot is empty -->
          <div class="import-section" v-if="exportingSlot === null || !getSlotPreset(exportingSlot)">
            <CommunityPresets 
              ref="communityPresetsRef" 
              :fullHeight="exportingSlot !== null && !getSlotPreset(exportingSlot)"
              @load="handleCloudPresetLoad" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Help/Info Dialog -->
    <div v-if="showHelpDialog" class="help-modal-overlay" @click.stop="showHelpDialog = false">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <h3>Preset Manager Guide</h3>
          <button class="close-btn" @click.stop="showHelpDialog = false">×</button>
        </div>
        <div class="help-modal-body">
          <div class="help-section">
            <h4>Save a Preset</h4>
            <p>Click any slot to save current settings with a name for easy reference.</p>
          </div>
          <div class="help-section">
            <h4>Apply</h4>
            <p>Loads the preset into config app ready to send to <em>KB1</em>.</p>
          </div>
          <div class="help-section">
            <h4>NVS (Device Storage)</h4>
            <p>Syncs a preset to the same slot number on the <em>KB1</em> device. Settings persist even when disconnected.</p>
          </div>
          <div class="help-section">
            <h4>Cloud Presets</h4>
            <p>Share presets with the community or browse and load presets created by other <em>KB1</em> users.</p>
          </div>
        </div>
        <div class="help-modal-footer">
          <button class="btn-primary" @click="showHelpDialog = false">Got it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { generateRandomName } from '../state/presets';
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
  (e: 'slotCount', count: number, total: number): void;
  (e: 'loadFactoryDefaults'): void;
}>();

// 8-Slot Preset System (localStorage)
interface SlotPreset {
  name: string;
  author?: string; // Author name (max 12 chars)
  description?: string; // Optional description for community sharing
  snapshot?: string; // Auto-generated settings snapshot for quick reference
  settings: DeviceSettings;
  modifiedAt: number;
  exportedToCloud?: boolean; // Track if preset has been exported
  isFactoryDefault?: boolean; // Protected starter presets (no cloud upload)
}

const SLOTS_KEY = 'kb1_preset_slots';

// Factory defaults - 4 presets showcasing KB1 Expression cycling parameters
function getDefaultPresets(): (SlotPreset | null)[] {
  const now = Date.now();
  
  return [
    // Slot 1: Scale/RootNote Control
    {
      name: "Scale Cntrl",
      author: "STARTER",
      description: "cycle thru scales with L1 - cycle thru root notes fwd/rev with P1/Touch",
      snapshot: "KB: Maj/C • Compact\nL1: Step/Uni • P1: RootNote/FWD\nL2: Step/Bi • P2: Reset • Touch: RootNote/REV",
      modifiedAt: now,
      isFactoryDefault: true,
      settings: {
        lever1: { ccNumber: 204, minCCValue: 0, maxCCValue: 127, stepSize: 1, functionMode: 2, valueMode: 0, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush1: { ccNumber: 206, minCCValue: 0, maxCCValue: 127, functionMode: 2, onsetTime: 100, offsetTime: 0, onsetType: 0, offsetType: 0 },
        lever2: { ccNumber: 128, minCCValue: 13, maxCCValue: 127, stepSize: 6, functionMode: 2, valueMode: 1, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush2: { ccNumber: 128, minCCValue: 85, maxCCValue: 85, functionMode: 3, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        touch: { ccNumber: 206, minCCValue: 0, maxCCValue: 127, functionMode: 1, threshold: 36800, offsetTime: 100 },
        scale: { scaleType: 1, rootNote: 60, keyMapping: 1 },
        chord: { playMode: 0, chordType: 0, strumEnabled: false, velocitySpread: 10, strumSpeed: 80, strumPattern: 0, strumSwing: 0, voicing: 1, strumIntervals: [0, 4, 7, 12], buildMode: "up" },
        system: { lightSleepTimeout: 300, deepSleepTimeout: 390, bleTimeout: 600 }
      }
    },
    // Slot 2: Chord RootNote Control
    {
      name: "Chord Cntrl",
      author: "STARTER",
      description: "cycle thru chords with L1 - cycle thru root notes fwd/rev with P1/Touch - 2 octave range",
      snapshot: "KB: Maj/? • Chord\nL1: Step/Uni • P1: RootNote/FWD\nL2: Step/Bi • P2: Reset • Touch: RootNote/REV",
      modifiedAt: now,
      isFactoryDefault: true,
      settings: {
        lever1: { ccNumber: 205, minCCValue: 0, maxCCValue: 127, stepSize: 12, functionMode: 2, valueMode: 0, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush1: { ccNumber: 206, minCCValue: 0, maxCCValue: 127, functionMode: 2, onsetTime: 100, offsetTime: 0, onsetType: 0, offsetType: 0 },
        lever2: { ccNumber: 128, minCCValue: 13, maxCCValue: 127, stepSize: 6, functionMode: 2, valueMode: 1, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush2: { ccNumber: 128, minCCValue: 85, maxCCValue: 85, functionMode: 3, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        touch: { ccNumber: 206, minCCValue: 0, maxCCValue: 127, functionMode: 1, threshold: 36800, offsetTime: 100 },
        scale: { scaleType: 0, rootNote: 0, keyMapping: 0 },
        chord: { playMode: 1, chordType: 0, strumEnabled: false, velocitySpread: 59, strumSpeed: 80, strumPattern: 0, strumSwing: 20, voicing: 2, strumIntervals: [0, 12, 4, 7], buildMode: "exclusive" },
        system: { lightSleepTimeout: 300, deepSleepTimeout: 390, bleTimeout: 600 }
      }
    },
    // Slot 3: Strum Control
    {
      name: "Strum Cntrl",
      author: "STARTER",
      description: "cycle thru strum speeds with L1 - cycle thru patterns fwd/rev with P1/Touch - 2 octave range",
      snapshot: "KB: Maj/? • Strum/Fwd/Cust\nL1: Step/Uni • P1: Pattern/FWD\nL2: Step/Bi • P2: Reset • Touch: Pattern/REV",
      modifiedAt: now,
      isFactoryDefault: true,
      settings: {
        lever1: { ccNumber: 200, minCCValue: 0, maxCCValue: 127, stepSize: 12, functionMode: 2, valueMode: 0, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush1: { ccNumber: 201, minCCValue: 0, maxCCValue: 127, functionMode: 2, onsetTime: 100, offsetTime: 0, onsetType: 0, offsetType: 0 },
        lever2: { ccNumber: 128, minCCValue: 13, maxCCValue: 127, stepSize: 6, functionMode: 2, valueMode: 1, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush2: { ccNumber: 128, minCCValue: 85, maxCCValue: 85, functionMode: 3, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        touch: { ccNumber: 201, minCCValue: 0, maxCCValue: 127, functionMode: 1, threshold: 36800, offsetTime: 100 },
        scale: { scaleType: 0, rootNote: 0, keyMapping: 0 },
        chord: { playMode: 1, chordType: 0, strumEnabled: true, velocitySpread: 59, strumSpeed: 80, strumPattern: 7, strumSwing: 20, voicing: 2, strumIntervals: [0, 4, 7, 12], buildMode: "up" },
        system: { lightSleepTimeout: 300, deepSleepTimeout: 390, bleTimeout: 600 }
      }
    },
    // Slot 4: Strum Shape(arp) Control
    {
      name: "Shape Cntrl",
      author: "STARTER",
      description: "cycle thru strum speeds with L1 - cycle thru shapes fwd/rev with P1/Touch - 2 octave range",
      snapshot: "KB: Maj/? • Strum/Fwd/Cust\nL1: Step/Uni • P1: Pattern/FWD\nL2: Step/Bi • P2: Reset • Touch: Pattern/REV",
      modifiedAt: now,
      isFactoryDefault: true,
      settings: {
        lever1: { ccNumber: 200, minCCValue: 0, maxCCValue: 127, stepSize: 12, functionMode: 2, valueMode: 0, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush1: { ccNumber: 201, minCCValue: 0, maxCCValue: 127, functionMode: 2, onsetTime: 100, offsetTime: 0, onsetType: 0, offsetType: 0 },
        lever2: { ccNumber: 128, minCCValue: 13, maxCCValue: 127, stepSize: 6, functionMode: 2, valueMode: 1, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        leverPush2: { ccNumber: 128, minCCValue: 85, maxCCValue: 85, functionMode: 3, onsetTime: 100, offsetTime: 100, onsetType: 0, offsetType: 0 },
        touch: { ccNumber: 201, minCCValue: 0, maxCCValue: 127, functionMode: 1, threshold: 36800, offsetTime: 100 },
        scale: { scaleType: 0, rootNote: 0, keyMapping: 0 },
        chord: { playMode: 1, chordType: 0, strumEnabled: true, velocitySpread: 59, strumSpeed: 80, strumPattern: 7, strumSwing: 20, voicing: 2, strumIntervals: [0, 4, 7, 12], buildMode: "up" },
        system: { lightSleepTimeout: 300, deepSleepTimeout: 390, bleTimeout: 600 }
      }
    },
    // Slots 5-8: Empty
    null,
    null,
    null,
    null
  ];
}

// Load slots from localStorage (or defaults on first run)
function loadSlotsFromStorage(): (SlotPreset | null)[] {
  try {
    const stored = localStorage.getItem(SLOTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // First time - return factory defaults
    console.log('Loading factory default presets (Slots 1-4)');
    return getDefaultPresets();
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
const showHelpDialog = ref(false);

// Selection mode
const selectionMode = ref(false);
const selectedSlots = ref(new Set<number>());

// Editing state
const editingSlot = ref<number>(0);
const slotName = ref('');
const slotAuthor = ref('');
const slotDescription = ref('');
const exportingSlot = ref<number | null>(null);

// Export metadata (simplified)
const exportMetadata = ref({
  name: '',
  author: '',
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
  refreshDevicePresets();
});

// ========================================
// Settings Snapshot Generator
// ========================================

const scaleNames: Record<number, string> = {
  0: 'Chr', 1: 'Maj', 2: 'Min', 3: 'HMin', 4: 'MMin', 5: 'PMaj', 6: 'PMin',
  7: 'Blu', 8: 'Dor', 9: 'Phr', 10: 'Lyd', 11: 'Mix', 12: 'Loc', 13: 'PhD',
  14: 'WTn', 15: 'Dim', 16: 'BMaj', 17: 'Hir', 18: 'InS', 19: 'DHm', 20: 'SLc'
};

const chordNames: Record<number, string> = {
  0: 'Maj', 1: 'Min', 2: 'Dim', 3: 'Aug', 4: 'Sus2', 5: 'Sus4', 6: 'Pow',
  7: 'Maj7', 8: 'Min7', 9: 'Dom7', 10: 'M+9', 11: 'm+9', 12: 'Maj6', 13: 'Min6', 14: 'Maj9'
};

const rootNotes: Record<number, string> = {
  60: 'C', 61: 'C#', 62: 'D', 63: 'D#', 64: 'E', 65: 'F',
  66: 'F#', 67: 'G', 68: 'G#', 69: 'A', 70: 'A#', 71: 'B'
};

const leverModes: Record<number, string> = {
  0: 'Smooth', 1: 'Peak', 2: 'Step'
};

const pushModes: Record<number, string> = {
  0: 'Smooth', 1: 'Peak', 2: 'Static', 3: 'Reset'
};

const touchModes: Record<number, string> = {
  0: 'Gate', 1: 'Toggle', 2: 'Smooth'
};

// KB1 Expression parameter names for cycling parameters
const kb1ExpressionParamNames: Record<number, string> = {
  201: 'Pattern',
  204: 'ScaleType',
  205: 'ChordType',
  206: 'RootNote'
};

const valueModeNames: Record<number, string> = {
  0: 'Uni', 1: 'Bi'
};

const keyMappingNames: Record<number, string> = {
  0: 'Natural', 1: 'Compact'
};

const patternNames: Record<number, string> = {
  0: '', // No pattern (use chord)
  1: 'Up', 2: 'Down', 3: 'Bounce', 4: 'Incl', 5: 'Excl', 6: 'Rand', 7: 'Cust'
};

function generateSettingsSnapshot(settings: DeviceSettings): string {
  const lines: string[] = [];
  
  // Line 1: Keyboard mode with detailed info
  const isChordMode = settings.chord.playMode === 1;
  const scaleType = scaleNames[settings.scale.scaleType] || '?';
  const rootNote = rootNotes[settings.scale.rootNote] || '?';
  const chordType = chordNames[settings.chord.chordType] || '?';
  const keyMapping = keyMappingNames[settings.scale.keyMapping] || 'Nat';
  
  let strumState = 'Chord';
  if (settings.chord.strumEnabled) {
    const direction = settings.chord.strumSpeed < 0 ? 'Rev' : 'Fwd';
    // Only show pattern if strumPattern > 0 (pattern 0 = use chord type)
    const pattern = settings.chord.strumPattern > 0 ? (patternNames[settings.chord.strumPattern] || '') : '';
    strumState = pattern ? `Strum/${direction}/${pattern}` : `Strum/${direction}`;
  }
  
  if (isChordMode) {
    lines.push(`KB: ${chordType}/${rootNote} • ${strumState}`);
  } else {
    lines.push(`KB: ${scaleType}/${rootNote} • ${keyMapping}`);
  }
  
  // Line 2: Lever 1 + Push 1 (same physical control)
  if (settings.lever1.ccNumber >= 0) {
    const l1mode = leverModes[settings.lever1.functionMode] || '?';
    const l1value = valueModeNames[settings.lever1.valueMode] || 'Uni';
    let p1mode = 'Off';
    if (settings.leverPush1.ccNumber >= 0) {
      // Check if it's a cycling parameter (Pattern, ScaleType, ChordType, RootNote)
      const isCyclingParam = [201, 204, 205, 206].includes(settings.leverPush1.ccNumber);
      if (isCyclingParam) {
        const direction = (settings.leverPush1.offsetTime ?? 0) === 0 ? 'FWD' : 'REV';
        const paramName = kb1ExpressionParamNames[settings.leverPush1.ccNumber] || 'Cycle';
        p1mode = `${paramName}/${direction}`;
      } else {
        p1mode = pushModes[settings.leverPush1.functionMode] || '?';
      }
    }
    lines.push(`L1: ${l1mode}/${l1value} • P1: ${p1mode}`);
  } else {
    let p1mode = 'Off';
    if (settings.leverPush1.ccNumber >= 0) {
      const isCyclingParam = [201, 204, 205, 206].includes(settings.leverPush1.ccNumber);
      if (isCyclingParam) {
        const direction = (settings.leverPush1.offsetTime ?? 0) === 0 ? 'FWD' : 'REV';
        const paramName = kb1ExpressionParamNames[settings.leverPush1.ccNumber] || 'Cycle';
        p1mode = `${paramName}/${direction}`;
      } else {
        p1mode = pushModes[settings.leverPush1.functionMode] || '?';
      }
    }
    lines.push(`L1: Off • P1: ${p1mode}`);
  }
  
  // Line 3: Lever 2 + Push 2 + Touch
  const l2parts: string[] = [];
  const p2parts: string[] = [];
  const tparts: string[] = [];
  
  if (settings.lever2.ccNumber >= 0) {
    const l2mode = leverModes[settings.lever2.functionMode] || '?';
    const l2value = valueModeNames[settings.lever2.valueMode] || 'Uni';
    l2parts.push(`L2: ${l2mode}/${l2value}`);
  } else {
    l2parts.push('L2: Off');
  }
  
  if (settings.leverPush2.ccNumber >= 0) {
    // Check if it's a cycling parameter
    const isCyclingParam = [201, 204, 205, 206].includes(settings.leverPush2.ccNumber);
    if (isCyclingParam) {
      const direction = (settings.leverPush2.offsetTime ?? 0) === 0 ? 'FWD' : 'REV';
      const paramName = kb1ExpressionParamNames[settings.leverPush2.ccNumber] || 'Cycle';
      p2parts.push(`P2: ${paramName}/${direction}`);
    } else {
      const p2mode = pushModes[settings.leverPush2.functionMode] || '?';
      p2parts.push(`P2: ${p2mode}`);
    }
  } else {
    p2parts.push('P2: Off');
  }
  
  if (settings.touch.ccNumber >= 0) {
    // Check if it's a cycling parameter
    const isCyclingParam = [201, 204, 205, 206].includes(settings.touch.ccNumber);
    if (isCyclingParam) {
      const direction = (settings.touch.offsetTime ?? 0) === 0 ? 'FWD' : 'REV';
      const paramName = kb1ExpressionParamNames[settings.touch.ccNumber] || 'Cycle';
      tparts.push(`Touch: ${paramName}/${direction}`);
    } else {
      const tmode = touchModes[settings.touch.functionMode] || '?';
      tparts.push(`Touch: ${tmode}`);
    }
  } else {
    tparts.push('Touch: Off');
  }
  
  lines.push([...l2parts, ...p2parts, ...tparts].join(' • '));
  
  return lines.join('\n');
}

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
  slotAuthor.value = existing?.author || '';
  slotDescription.value = existing?.description || '';
  showSlotDialog.value = true;
  
  nextTick(() => {
    nameInput.value?.focus();
    // Only auto-select text for new presets (empty slots)
    if (!existing) {
      nameInput.value?.select();
    }
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
    author: slotAuthor.value.trim() || undefined,
    description: slotDescription.value.trim() || undefined,
    snapshot: generateSettingsSnapshot(props.currentSettings),
    settings: props.currentSettings,
    modifiedAt: Date.now(),
    exportedToCloud: existingPreset?.exportedToCloud // Preserve cloud export status
  };
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  toast.success(`Saved to slot ${editingSlot.value + 1}: "${name}"`);
  showSlotDialog.value = false;
  slotName.value = '';
  slotAuthor.value = '';
  slotDescription.value = '';
}

function deleteCurrentSlot() {
  const preset = getSlotPreset(editingSlot.value);
  if (!preset) return;
  
  const newSlots = [...slots.value];
  newSlots[editingSlot.value] = null;
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  // Clear active state if this was active
  if (activeSlot.value === editingSlot.value) {
    activeSlot.value = null;
  }
  
  toast.success(`Deleted "${preset.name}"`);
  
  // Close modal and reset
  showSlotDialog.value = false;
  slotName.value = '';
  slotAuthor.value = '';
  slotDescription.value = '';
}

function activateSlot(slot: number) {
  const preset = getSlotPreset(slot);
  if (!preset) return;
  
  emit('load', preset.settings);
  activeSlot.value = slot;
  activeDeviceSlot.value = null;
  
  toast.success(`Applied: "${preset.name}"`);
}

function loadFactoryDefaults() {
  emit('loadFactoryDefaults');
  activeSlot.value = null;
  activeDeviceSlot.value = null;
  
  // Clear preset slots from localStorage and reload factory defaults
  localStorage.removeItem(SLOTS_KEY);
  slots.value = loadSlotsFromStorage(); // This will reload the 4 factory presets
  
  toast.success('Defaults loaded');
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
    exportMetadata.value.author = preset.author || '';
    exportMetadata.value.description = preset.description || '';
  }
  
  showCloudDialog.value = true;
  
  // Auto-load community presets when dialog opens (always force refresh to avoid cache)
  nextTick(() => {
    if (communityPresetsRef.value) {
      communityPresetsRef.value.loadPresets(true);
    }
  });
}

async function handleCloudPresetLoad(preset: { id: string; metadata?: { name?: string; author?: string; description?: string; snapshot?: string; tags?: string[] }; settings: DeviceSettings }) {
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
      `Slot ${slotIndex + 1} contains "${existingPreset.name}".\n\nReplace with "${presetName}" from the cloud?`
    );
    if (!confirmed) {
      return;
    }
  }
  
  const newSlots = [...slots.value];
  newSlots[slotIndex] = {
    name: presetName,
    author: preset.metadata?.author,
    description: preset.metadata?.description,
    snapshot: preset.metadata?.snapshot || generateSettingsSnapshot(preset.settings),
    settings: preset.settings,
    modifiedAt: Date.now(),
    exportedToCloud: false // Reset cloud sync flag for imported presets
  };
  
  slots.value = newSlots;
  saveSlotsToStorage(newSlots);
  
  toast.success(`Loaded "${presetName}" into slot ${slotIndex + 1}`);
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

// Auto-sync device presets to empty browser slots on initial connect
watch(devicePresets, async (newPresets) => {
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
  
  // Check if preset with same name already exists in cloud
  const existingCloudPreset = communityPresetsRef.value?.communityPresets?.find(
    p => p.metadata?.name === exportMetadata.value.name
  );
  
  if (existingCloudPreset) {
    const confirmed = await confirm(
      `A preset named "${exportMetadata.value.name}" already exists in the cloud.\n\nOverwrite it with your version?`
    );
    if (!confirmed) {
      return;
    }
  }
  
  // Sanitize preset name for filename (remove special chars, limit length)
  const sanitizedName = exportMetadata.value.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 40); // Max 40 chars
  
  // Generate unique preset ID with readable name: preset_timestamp_name_random
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const presetId = `preset_${timestamp}_${sanitizedName}_${randomId}`;
  
  // Build metadata
  const metadata: any = {
    name: exportMetadata.value.name,
    date: new Date().toISOString().split('T')[0],
    snapshot: preset.snapshot || generateSettingsSnapshot(preset.settings)
  };
  
  if (exportMetadata.value.author) {
    metadata.author = exportMetadata.value.author;
  }
  
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
      
      // Mark slot as exported to cloud
      const uploadedSlot = exportingSlot.value;
      if (uploadedSlot !== null) {
        const newSlots = [...slots.value];
        const slotPreset = newSlots[uploadedSlot];
        if (slotPreset) {
          slotPreset.exportedToCloud = true;
          slots.value = newSlots;
          saveSlotsToStorage(newSlots);
        }
      }
      
      // Refresh community presets list to show newly uploaded preset
      refreshCommunityPresets();
      
      toast.success(`Preset uploaded to community library!`, 5000);
      
      // Close dialog and reset form
      showCloudDialog.value = false;
      exportMetadata.value = { name: '', author: '', description: '' };
      exportingSlot.value = null;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      exportMetadata.value = { name: '', author: '', description: '' };
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
    exportMetadata.value = { name: '', author: '', description: '' };
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
  padding: var(--kb1-spacing-md);
  font-family: var(--kb1-font-family);
}

.preset-title {
  margin: 0 0 1rem 0;
  font-size: var(--kb1-font-large);
  font-weight: var(--kb1-font-weight-semibold);
  color: #EAEAEA;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

/* Slot System */
.preset-slots {
  display: flex;
  flex-direction: column;
  gap: var(--kb1-spacing-sm);
}

.btn-factory-defaults {
  width: 100%;
  margin-bottom: 0;
  padding: var(--kb1-spacing-sm) var(--kb1-spacing-md);
  background: rgba(29, 29, 29, 0.5);
  border: 1px solid rgba(205, 205, 205, 0.15);
  border-radius: var(--kb1-radius-sm);
  color: rgba(205, 205, 205, 0.7);
  font-size: var(--kb1-font-medium);
  font-weight: var(--kb1-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-factory-defaults:hover {
  background: rgba(29, 29, 29, 0.7);
  border-color: rgba(205, 205, 205, 0.3);
  color: rgba(205, 205, 205, 0.9);
}

.btn-factory-defaults:active {
  transform: scale(0.98);
}

.factory-divider {
  height: 1px;
  background: rgba(205, 205, 205, 0.1);
  margin: 0.75rem 0;
}

.preset-slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(29, 29, 29, 0.5);
  border: 1px solid rgba(205, 205, 205, 0.1);
  border-radius: var(--kb1-radius-sm);
  padding: var(--kb1-spacing-sm) 0.75rem;
  gap: var(--kb1-spacing-md);
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
  gap: var(--kb1-spacing-xs);
  flex: 1;
  min-width: 0;
}

.slot-label {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-normal);
  color: #EAEAEA;
  letter-spacing: var(--kb1-letter-spacing-wide);
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.author-badge {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  color: #b9aa5f;
  letter-spacing: var(--kb1-letter-spacing-wide);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 8rem;
}

.slot-name {
  font-size: var(--kb1-font-input);
  color: #CDCDCD;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-slot.empty .slot-name {
  color: #848484;
  font-style: italic;
}

.slot-actions {
  display: flex;
  gap: var(--kb1-spacing-sm);
  flex-shrink: 0;
}

.btn-action {
  position: relative;
  background: rgba(132, 132, 132, 0.1);
  border: 1px solid rgba(205, 205, 205, 0.2);
  padding: 0.35rem 0.5rem;
  font-size: var(--kb1-font-label);
  font-weight: var(--kb1-font-weight-medium);
  color: #CDCDCD;
  cursor: pointer;
  border-radius: var(--kb1-radius-sm);
  transition: all 0.2s;
  font-family: var(--kb1-font-family);
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

.btn-action.btn-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-action.active {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4A90E2;
}

.btn-cloud-empty {
  background: rgba(93, 173, 107, 0.15);
  border-color: rgba(93, 173, 107, 0.3);
  color: #5dad6b;
}

.btn-cloud-empty:hover {
  background: rgba(93, 173, 107, 0.25);
  border-color: rgba(93, 173, 107, 0.5);
  color: #6fc280;
}

/* Help Section (inside help-modal-body) */
.help-section {
  margin-bottom: var(--kb1-spacing-lg);
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: var(--kb1-font-medium);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-medium);
  font-family: var(--kb1-font-family);
}

.help-section p {
  margin: 0;
  font-size: var(--kb1-font-input);
  line-height: var(--kb1-line-height-normal);
  color: #CDCDCD;
  font-family: var(--kb1-font-family);
}

.help-section strong {
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-medium);
}

.btn-with-indicator {
  padding-right: var(--kb1-spacing-sm);
}

.button-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #4CAF50;
  border-radius: var(--kb1-radius-full);
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
  padding: var(--kb1-spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: var(--kb1-font-medium);
  font-weight: var(--kb1-font-weight-semibold);
  color: #EAEAEA;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-body {
  padding: var(--kb1-spacing-md);
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.dialog-intro {
  margin-bottom: var(--kb1-spacing-md);
}

.dialog-intro p {
  margin: 0;
  font-size: var(--kb1-font-input);
  color: #848484;
  line-height: var(--kb1-line-height-normal);
}

/* Cloud Dialog - Export + Import Unified */
.export-section {
  margin-bottom: var(--kb1-spacing-sm);
}

.section-label {
  font-size: var(--kb1-font-label);
  font-weight: var(--kb1-font-weight-semibold);
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
  color: #848484;
  margin-bottom: var(--kb1-spacing-sm);
}

.export-form-compact {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.export-form-compact input,
.export-form-compact textarea {
  font-size: var(--kb1-font-input);
}

.export-form-compact textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-export {
  padding: 0.625rem;
  font-size: var(--kb1-font-input);
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

/* Community presets list below */

.btn-refresh {
  background: none;
  border: none;
  color: #EAEAEA;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 4px;
  opacity: 0.6;
}

.btn-refresh svg {
  width: 100%;
  height: 100%;
  display: block;
}

.btn-refresh:hover {
  opacity: 1;
  transform: rotate(180deg);
}

.btn-refresh:active {
  opacity: 0.8;
  transform: rotate(180deg) scale(0.95);
}

/* Tab Navigation (Legacy - can be removed if unused) */
.preset-tabs {
  display: flex;
  gap: var(--kb1-spacing-lg);
  margin-bottom: var(--kb1-spacing-lg);
}

.preset-tab {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  color: #848484;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  font-family: var(--kb1-font-family);
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
  margin-bottom: var(--kb1-spacing-md);
  padding: 0.75rem;
  background: rgba(29, 29, 29, 0.3);
  border-radius: var(--kb1-radius-sm);
}

.slot-fade-label {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: var(--ui-highlight);
  font-size: var(--kb1-font-label);
  font-weight: var(--kb1-font-weight-medium);
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
  border-radius: var(--kb1-radius-sm);
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
  background: rgba(var(--ui-highlight-rgb), 0.3);
  border: 1px solid var(--ui-highlight);
}

.slot-box.active:hover {
  background: rgba(var(--ui-highlight-rgb), 0.4);
}

.slot-box.empty {
  opacity: 0.3;
}

.slot-box:hover .slot-number {
  color: var(--ui-highlight);
}

.slot-number {
  font-size: var(--kb1-font-caption);
  font-weight: var(--kb1-font-weight-medium);
  color: rgba(249, 172, 32, 0.5);
  font-family: var(--kb1-font-family);
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
  gap: var(--kb1-spacing-sm);
  margin-bottom: var(--kb1-spacing-md);
  overflow: visible;
}

.preset-item {
  background: rgba(29, 29, 29, 0.4);
  border: none;
  border-radius: var(--kb1-radius-sm);
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
  accent-color: var(--ui-highlight);
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: var(--kb1-font-input);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-medium);
  margin-bottom: var(--kb1-spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--kb1-spacing-sm);
}

.active-indicator {
  color: #6A6853;
  font-size: var(--kb1-font-tiny); /* 10px - slightly larger for readability */
}

.preset-meta {
  font-size: var(--kb1-font-label);
  color: var(--label-gray);
}

.preset-actions {
  display: flex;
  gap: var(--kb1-spacing-sm);
  align-items: center;
  position: relative;
}

.btn-small {
  padding: 0.25rem 0.75rem;
  background: rgba(234, 234, 234, 0.1);
  border: none;
  color: #EAEAEA;
  font-size: var(--kb1-font-label);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--kb1-font-family);
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
  font-size: var(--kb1-font-subhead);
  line-height: var(--kb1-line-height-tight);
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
  margin-top: var(--kb1-spacing-xs);
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: var(--kb1-radius-sm);
  padding: var(--kb1-spacing-xs);
  z-index: 9999;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
}

.preset-menu button {
  width: 100%;
  padding: var(--kb1-spacing-sm) 0.75rem;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: var(--kb1-font-label);
  text-align: left;
  cursor: pointer;
  border-radius: 3px;
  font-family: var(--kb1-font-family);
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
  font-size: var(--kb1-font-input);
}

.empty-state .hint {
  font-size: var(--kb1-font-label);
  opacity: 0.7;
}

.import-export-section {
  display: flex;
  gap: var(--kb1-spacing-sm);
  padding-top: var(--kb1-spacing-md);
  border-top: none;
}

.btn-secondary {
  flex: 1;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  color: #EAEAEA;
  font-size: var(--kb1-font-label);
  border-radius: var(--kb1-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--kb1-font-family);
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
  padding: var(--kb1-spacing-md);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.modal-dialog {
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: var(--kb1-radius-lg);
  padding: var(--kb1-spacing-lg);
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.modal-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: var(--kb1-font-medium);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-bold);
}

.form-group {
  margin-bottom: var(--kb1-spacing-md);
}

.form-group label {
  display: block;
  margin-bottom: var(--kb1-spacing-sm);
  font-size: var(--kb1-font-label);
  color: #848484;
  text-transform: var(--kb1-text-transform-uppercase);
}

.settings-snapshot {
  background: rgba(234, 234, 234, 0.05);
  border: 1px solid rgba(234, 234, 234, 0.1);
  border-radius: var(--kb1-radius-sm);
  padding: 0.75rem;
  font-size: var(--kb1-font-label);
  font-family: var(--kb1-font-family);
  color: #EAEAEA;
  line-height: var(--kb1-line-height-relaxed);
  white-space: pre-line;
  word-break: break-word;
}

.input-text {
  width: 100%;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  border-radius: var(--kb1-radius-sm);
  color: #EAEAEA;
  font-size: var(--kb1-font-input);
  font-family: var(--kb1-font-family);
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
  border-radius: var(--kb1-radius-sm);
  color: #EAEAEA;
  font-size: var(--kb1-font-input);
  font-family: var(--kb1-font-family);
  box-sizing: border-box;
  cursor: pointer;
}

.input-select:focus {
  outline: none;
  background: rgba(234, 234, 234, 0.08);
}

.form-actions {
  margin-bottom: var(--kb1-spacing-md);
}

.modal-buttons {
  display: flex;
  gap: var(--kb1-spacing-sm);
  justify-content: space-between;
  align-items: center;
}

.modal-buttons-right {
  display: flex;
  gap: var(--kb1-spacing-sm);
}

.btn-delete {
  padding: 0.25rem 1rem;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgba(239, 68, 68, 0.8);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-normal);
  border-radius: var(--kb1-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--kb1-font-family);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.6);
  color: #ef4444;
}

.btn-primary {
  padding: 0.25rem 1rem;
  background: #6A6853;
  border: none;
  color: #EAEAEA;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  border-radius: var(--kb1-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--kb1-font-family);
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
  padding: var(--kb1-spacing-lg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.import-dialog .modal-header h3 {
  margin: 0;
  font-size: var(--kb1-font-medium);
  font-weight: var(--kb1-font-weight-semibold);
  color: #EAEAEA;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.import-dialog .modal-body {
  padding: var(--kb1-spacing-lg);
  overflow-y: auto;
  flex: 1;
}

.export-intro {
  font-size: var(--kb1-font-input);
  color: #848484;
  line-height: var(--kb1-line-height-normal);
  margin-bottom: var(--kb1-spacing-lg);
  margin-top: var(--kb1-spacing-sm);
}

.metadata-form {
  margin-bottom: var(--kb1-spacing-lg);
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
    font-size: var(--kb1-font-small);
    padding: 0.25rem 0.5rem;
  }
}

/* Device Presets Section */
.preset-section {
  margin-bottom: var(--kb1-spacing-xl);
}

.preset-section-header {
  font-size: var(--kb1-font-label);
  font-weight: var(--kb1-font-weight-semibold);
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
  color: #848484;
  margin-bottom: var(--kb1-spacing-md);
  font-family: var(--kb1-font-family);
}

.section-title {
  font-size: var(--kb1-font-medium);
  font-weight: var(--kb1-font-weight-bold);
  text-transform: var(--kb1-text-transform-uppercase);
  color: var(--color-text);
  margin-bottom: var(--kb1-spacing-xs);
}

.section-subtitle {
  font-size: var(--kb1-font-label);
  color: var(--color-text-muted);
  margin-bottom: var(--kb1-spacing-md);
}

.device-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.device-preset-slot {
  border: 1px solid var(--color-border);
  border-radius: var(--kb1-radius-sm);
  padding: 0.75rem;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: var(--kb1-spacing-sm);
  transition: border-color 0.2s, background-color 0.2s;
  background: rgba(234, 234, 234, 0.02);
}

.device-preset-slot.active {
  border-color: var(--ui-highlight);
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
  gap: var(--kb1-spacing-sm);
}

.slot-name {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  word-break: break-word;
  color: var(--color-text);
  flex: 1;
}

.slot-actions {
  display: flex;
  gap: var(--kb1-spacing-xs);
  flex-wrap: wrap;
}

.slot-actions .btn-small {
  flex: 1;
  min-width: 45px;
  padding: 0.25rem 0.5rem;
  font-size: var(--kb1-font-small);
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
  background: rgba(var(--ui-highlight-rgb), 0.3) !important;
  border-color: rgba(var(--ui-highlight-rgb), 0.6) !important;
  box-shadow: 0 0 10px rgba(var(--ui-highlight-rgb), 0.35) !important;
  color: var(--ui-highlight) !important;
}

.btn-create:active {
  background: rgba(var(--ui-highlight-rgb), 0.4) !important;
  border-color: var(--ui-highlight) !important;
  box-shadow: 0 0 14px rgba(var(--ui-highlight-rgb), 0.45) !important;
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
  font-size: var(--kb1-font-label);
  color: var(--color-text-muted);
  text-transform: var(--kb1-text-transform-uppercase);
  font-weight: var(--kb1-font-weight-medium);
}

@media (max-width: 768px) {
  .device-presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Info Icon */
.info-icon {
  text-transform: var(--kb1-text-transform-none);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: var(--kb1-font-tiny);
  font-family: var(--kb1-font-family);
  color: #848484;
  border: 1px solid #848484;
  border-radius: var(--kb1-radius-full);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  margin-left: var(--kb1-spacing-sm);
}

.info-icon:hover {
  color: #5dad6b;
  border-color: #5dad6b;
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
  padding: var(--kb1-spacing-md);
}

.help-modal {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--kb1-radius-lg);
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: var(--kb1-font-family);
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--kb1-spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.help-modal-header h3 {
  margin: 0;
  font-size: var(--kb1-font-medium);
  font-weight: var(--kb1-font-weight-bold);
  color: #EAEAEA;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--kb1-font-title);
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--kb1-radius-sm);
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-background-mute);
  color: #EAEAEA;
}

.help-modal-body {
  padding: var(--kb1-spacing-lg);
}

.help-modal-body p {
  margin: 0;
  font-size: var(--kb1-font-input);
  line-height: var(--kb1-line-height-relaxed);
  color: var(--color-text);
}

.help-modal-footer {
  padding: var(--kb1-spacing-md) var(--kb1-spacing-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .btn-primary {
  padding: 0.5rem 1.5rem; /* 8px top/bottom, 24px left/right */
  background: #5dad6b; /* Standardized green for all modals */
  color: #1A1A1A; /* Dark text on green button */
  border: none;
  border-radius: var(--kb1-radius-sm);
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  opacity: 0.9; /* Slight dim on hover */
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
  justify-content: space-between;
}

.selection-actions {
  display: flex;
  gap: var(--kb1-spacing-sm);
  align-items: center;
}

.btn-select-action {
  padding: var(--kb1-spacing-sm) var(--kb1-spacing-md);
  font-size: var(--kb1-font-input);
  font-family: var(--kb1-font-family);
  font-weight: var(--kb1-font-weight-normal);
  border-radius: var(--kb1-radius-sm);
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
  padding: var(--kb1-spacing-sm) var(--kb1-spacing-md);
  font-size: var(--kb1-font-input);
  font-family: var(--kb1-font-family);
  font-weight: var(--kb1-font-weight-normal);
  border-radius: var(--kb1-radius-sm);
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
  accent-color: #5dad6b;
}

.preset-slot {
  position: relative; /* For absolute positioning of checkbox */
}
</style>

