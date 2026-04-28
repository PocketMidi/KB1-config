<template>
  <div class="mobile-scales-tab">
    <!-- Settings content - dims when disconnected (except System) -->
    <div v-if="isCCMapLoaded()" class="scales-content">
      <div :class="{ 'disconnected-state': !isConnected }">
        <!-- Collapse All Bar (top - shy, only shows when 2+ open) -->
        <Transition name="collapse-fade">
          <button v-if="openAccordionCount >= 2" class="collapse-all-bar" @click="closeAllAccordions">
            COLLAPSE ALL
          </button>
        </Transition>
      
      <!-- Keyboard first -->
      <AccordionSection
        ref="keyboardAccordion"
        title="KEYBOARD"
        :title-suffix="keyboardSuffix"
        :title-suffix-fading="keyboardSuffixFading"
        :subtitle="keyboardSubtitle"
        :id="'keyboard'"
        :default-open="false"
        :show-keyboard-icon="true"
      >
        <template #header-right>
          <div class="root-note-display">
            Root Note <span class="root-note-value">{{ currentRootNoteLabel }}</span>
          </div>
        </template>
        <KeyboardSettings
          v-model="keyboardModel"
          :scales="scales"
          :chordTypes="chordTypes"
          :rootNotes="rootNotes"
          @update:modelValue="handleKeyboardChange"
          @mappingChanged="handleMappingChange"
          @chordStyleChanged="handleChordStyleChange"
          @chromaticWarning="handleChromaticWarning"
        />
      </AccordionSection>
      
      <!-- Lever 1 -->
      <AccordionSection
        ref="lever1Accordion"
        :title="`Lever 1`"
        :subtitle="getLeverSubtitle(localSettings.lever1)"
        :midi-cc="localSettings.lever1.ccNumber"
        :id="'lever-1'"
        :default-open="false"
        :show-lever1-icon="true"
        :title-suffix="lever1Suffix"
        :title-suffix-fading="lever1SuffixFading"
      >
        <LeverSettings
          title="Lever"
          :lever="1"
          v-model="localSettings.lever1"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverFunctionModes"
          :valueModes="valueModes"
          :strum-speed="localSettings.chord.strumSpeed"
          :play-mode="localSettings.chord.playMode"
          @update:modelValue="markChanged"
          @valueModeChanged="handleLever1ValueModeChanged"
        />
      </AccordionSection>
      
      <!-- Press 1 -->
      <AccordionSection
        ref="leverPush1Accordion"
        :title="`Press 1`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush1)"
        :midi-cc="localSettings.leverPush1.ccNumber"
        :id="'lever-push-1'"
        :default-open="false"
        :show-press1-icon="true"
        :title-suffix="leverPush1Suffix"
        :title-suffix-fading="leverPush1SuffixFading"
      >
        <LeverPushSettings
          title="Press"
          :lever="1"
          v-model="localSettings.leverPush1"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          :play-mode="localSettings.chord.playMode"
          @update:modelValue="markChanged"
          @behaviourChanged="handleLeverPush1BehaviourChanged"
        />
      </AccordionSection>
      
      <!-- Lever 2 -->
      <AccordionSection
        ref="lever2Accordion"
        :title="`Lever 2`"
        :subtitle="getLeverSubtitle(localSettings.lever2)"
        :midi-cc="localSettings.lever2.ccNumber"
        :id="'lever-2'"
        :default-open="false"
        :show-lever2-icon="true"
        :title-suffix="lever2Suffix"
        :title-suffix-fading="lever2SuffixFading"
      >
        <LeverSettings
          title="Lever"
          :lever="2"
          v-model="localSettings.lever2"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverFunctionModes"
          :valueModes="valueModes"
          :strum-speed="localSettings.chord.strumSpeed"
          :play-mode="localSettings.chord.playMode"
          @update:modelValue="markChanged"
          @valueModeChanged="handleLever2ValueModeChanged"
        />
      </AccordionSection>
      
      <!-- Press 2 -->
      <AccordionSection
        ref="leverPush2Accordion"
        :title="`Press 2`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush2)"
        :midi-cc="localSettings.leverPush2.ccNumber"
        :id="'lever-push-2'"
        :default-open="false"
        :show-press2-icon="true"
        :title-suffix="leverPush2Suffix"
        :title-suffix-fading="leverPush2SuffixFading"
      >
        <LeverPushSettings
          title="Press"
          :lever="2"
          v-model="localSettings.leverPush2"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          :play-mode="localSettings.chord.playMode"
          @update:modelValue="markChanged"
          @behaviourChanged="handleLeverPush2BehaviourChanged"
        />
      </AccordionSection>
      
      <!-- Touch -->
      <AccordionSection
        ref="touchAccordion"
        title="TOUCH"
        :subtitle="getTouchSubtitle(localSettings.touch)"
        :midi-cc="localSettings.touch.ccNumber"
        :id="'touch-sensor'"
        :default-open="false"
        :show-touch-icon="true"
      >
        <TouchSettings
          title="TOUCH"
          v-model="localSettings.touch"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="touchFunctionModes"
          :play-mode="localSettings.chord.playMode"
          @update:modelValue="markChanged"
        />
      </AccordionSection>
      </div>
      
      <!-- Presets - OUTSIDE disconnected-state (always accessible for local preset management) -->
      <AccordionSection
        ref="presetsAccordion"
        title="PRESETS"
        :title-suffix="presetsSuffix"
        :title-suffix-fading="presetsSuffixFading"
        :subtitle="presetsSubtitle"
        :id="'presets'"
        :default-open="false"
        :show-preset-icon="true"
      >
        <PresetManager
          :current-settings="localSettings"
          :has-unsaved-changes="hasChanges"
          @load="handlePresetLoad"
          @loadFactoryDefaults="handleResetDefaults"
          @preset-activated="handlePresetActivated"
          @slot-name-display="handleSlotNameDisplay"
          @slot-count="handleSlotCount"
        />
      </AccordionSection>
      
      <!-- System Settings - OUTSIDE disconnected-state (always accessible) -->
      <div class="system-settings-wrapper">
        <AccordionSection
          ref="systemAccordion"
          title="SYSTEM"
          subtitle="Configurator Settings"
          :titleSuffix="`v${APP_VERSION}`"
          :id="'system-settings'"
          :default-open="false"
          :show-system-icon="true"
        >
          <SystemSettings
            v-model="localSettings.system"
            :is-connected="isConnected"
            @update:modelValue="markChanged"
            @restore-from-device="handleLoadClick"
          />
        </AccordionSection>
      </div>
      
      <!-- Collapse All Bar (bottom - always visible) -->
      <button class="collapse-all-bar" @click="closeAllAccordions">
        COLLAPSE ALL
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, watchEffect, nextTick } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import { APP_VERSION } from '../constants';
import type { 
  DeviceSettings,
  ScaleSettings,
  LeverSettings as LeverSettingsType, 
  LeverPushSettings as LeverPushSettingsType, 
  TouchSettings as TouchSettingsType 
} from '../ble/kb1Protocol';

import KeyboardSettings from '../components/KeyboardSettings.vue';
import AccordionSection from '../components/AccordionSection.vue';
import SystemSettings from '../components/SystemSettings.vue';
import PresetManager from '../components/PresetManager.vue';
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
import { PresetStore } from '../state/presets';
import { useToast } from '../composables/useToast';
import {
  loadPolyendCCMap,
  getCCMap,
  isCCMapLoaded,
  getSortedCCOptions,
  getCCGroups,
} from '../data/ccMap';

const {
  isConnected,
  deviceSettings,
  sendSettings,
  saveToFlash,
  handleLoad,
  resetToDefaults,
  maxScaleType,
  lastDeviceLoadTime,
} = useDeviceState();

const toast = useToast();

const localSettings = ref<DeviceSettings>(JSON.parse(JSON.stringify(deviceSettings.value)));
const hasChanges = ref(false);
const isMounted = ref(false);

// Active preset tracking
const activePresetId = ref<string | null>(PresetStore.getActivePresetId());
const activePresetName = ref<string>('');

// State for temporary accordion title suffix (fade-in/out effect)
const keyboardSuffix = ref<string>('');
const keyboardSuffixFading = ref<boolean>(false);
let keyboardFadeTimeoutId: number | null = null;
let keyboardClearTimeoutId: number | null = null;

const presetsSuffix = ref<string>('');
const presetsSuffixFading = ref<boolean>(false);
const presetSlotCount = ref<number>(0);
let presetsFadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let presetsClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

const lever1Suffix = ref<string>('');
const lever1SuffixFading = ref<boolean>(false);
let lever1FadeTimeoutId: number | null = null;
let lever1ClearTimeoutId: number | null = null;

const leverPush1Suffix = ref<string>('');
const leverPush1SuffixFading = ref<boolean>(false);
let leverPush1FadeTimeoutId: number | null = null;
let leverPush1ClearTimeoutId: number | null = null;

const lever2Suffix = ref<string>('');
const lever2SuffixFading = ref<boolean>(false);
let lever2FadeTimeoutId: number | null = null;
let lever2ClearTimeoutId: number | null = null;

const leverPush2Suffix = ref<string>('');
const leverPush2SuffixFading = ref<boolean>(false);
let leverPush2FadeTimeoutId: number | null = null;
let leverPush2ClearTimeoutId: number | null = null;

// Load CC map on mount
onMounted(async () => {
  try {
    await loadPolyendCCMap();
  } catch (error) {
    console.error('Failed to load CC map:', error);
  }
  await nextTick();
  isMounted.value = true;
});

// Cleanup timeouts on unmount
onBeforeUnmount(() => {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  if (presetsFadeTimeoutId) clearTimeout(presetsFadeTimeoutId);
  if (presetsClearTimeoutId) clearTimeout(presetsClearTimeoutId);
  if (lever1FadeTimeoutId) clearTimeout(lever1FadeTimeoutId);
  if (lever1ClearTimeoutId) clearTimeout(lever1ClearTimeoutId);
  if (leverPush1FadeTimeoutId) clearTimeout(leverPush1FadeTimeoutId);
  if (leverPush1ClearTimeoutId) clearTimeout(leverPush1ClearTimeoutId);
  if (lever2FadeTimeoutId) clearTimeout(lever2FadeTimeoutId);
  if (lever2ClearTimeoutId) clearTimeout(lever2ClearTimeoutId);
  if (leverPush2FadeTimeoutId) clearTimeout(leverPush2FadeTimeoutId);
  if (leverPush2ClearTimeoutId) clearTimeout(leverPush2ClearTimeoutId);
});

// CC Options
const ccOptions = computed(() => {
  if (isCCMapLoaded()) {
    return getSortedCCOptions();
  } else {
    return [
      { value: -1, label: 'None' },
      { value: 128, label: 'Velocity (CC 128)' },
      ...Array.from({ length: 128 }, (_, i) => ({ value: i, label: `CC ${i}` }))
    ];
  }
});

const ccMapByNumber = computed(() => getCCMap());
const categories = computed(() => getCCGroups().map(g => g.category));

// Function Modes
const leverFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 2, label: 'Incremental' },
];

const leverPushFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 3, label: 'Reset' },
];

const touchFunctionModes = [
  { value: 0, label: 'Gate' },
  { value: 1, label: 'Toggle' },
  { value: 2, label: 'Continuous' },
];

const valueModes = [
  { value: 0, label: 'Unipolar' },
  { value: 1, label: 'Bipolar' },
];

const interpolations = [
  { value: 0, label: 'Linear' },
  { value: 1, label: 'Exponential' },
  { value: 2, label: 'Logarithmic' },
];

// All scales (synced with firmware ScaleType enum)
// Filtered based on firmware version - only show scales supported by connected firmware
const allScales = [
  { value: 0, label: 'Chromatic' },
  { value: 1, label: 'Major' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Harmonic Minor' },
  { value: 4, label: 'Melodic Minor' },
  { value: 5, label: 'Pentatonic Major' },
  { value: 6, label: 'Pentatonic Minor' },
  { value: 7, label: 'Blues Minor' },
  { value: 8, label: 'Dorian' },
  { value: 9, label: 'Phrygian' },
  { value: 10, label: 'Lydian' },
  { value: 11, label: 'Mixolydian' },
  { value: 12, label: 'Locrian' },
  { value: 13, label: 'Phrygian Dominant' }, // v1.1.2+
  { value: 14, label: 'Whole Tone' },         // v1.1.2+
  { value: 15, label: 'Diminished' },          // v1.1.2+
  { value: 16, label: 'Blues Major' },         // v1.1.2+
  { value: 17, label: 'Hirajoshi' },           // v1.1.2+
  { value: 18, label: 'In Sen' },              // v1.1.2+
  { value: 19, label: 'Double Harmonic' },     // v1.1.2+
  { value: 20, label: 'Super Locrian' },       // v1.1.2+
];

// Filter scales based on firmware version
const scales = computed(() => {
  const max = maxScaleType.value;
  return allScales.filter(scale => scale.value <= max);
});

// Chord Types (must match firmware ChordType enum exactly!)
const chordTypes = [
  { value: 0, label: 'Major' },
  { value: 1, label: 'Minor' },
  { value: 2, label: 'Diminished' },
  { value: 3, label: 'Augmented' },
  { value: 4, label: 'Suspended 2nd' },
  { value: 5, label: 'Suspended 4th' },
  { value: 6, label: 'Power Chord' },
  { value: 7, label: 'Major 7th' },
  { value: 8, label: 'Minor 7th' },
  { value: 9, label: 'Dominant 7th' },
  { value: 10, label: 'Major add9' },
  { value: 11, label: 'Minor add9' },
  { value: 12, label: 'Major 6th' },
  { value: 13, label: 'Minor 6th' },
  { value: 14, label: 'Major 9th' },
];

// Root Notes (MIDI note numbers - firmware uses these as absolute pitches)
const rootNotes = [
  { value: 60, label: 'C' },
  { value: 61, label: 'C#' },
  { value: 62, label: 'D' },
  { value: 63, label: 'D#' },
  { value: 64, label: 'E' },
  { value: 65, label: 'F' },
  { value: 66, label: 'F#' },
  { value: 67, label: 'G' },
  { value: 68, label: 'G#' },
  { value: 69, label: 'A' },
  { value: 70, label: 'A#' },
  { value: 71, label: 'B' },
];

// Keyboard play mode (reactive state computed from chord settings)
const playMode = computed<'scale' | 'chord'>({
  get: () => localSettings.value.chord.playMode === 1 ? 'chord' : 'scale',
  set: (mode: 'scale' | 'chord') => {
    localSettings.value.chord.playMode = mode === 'chord' ? 1 : 0;
  }
});

// Keyboard model that wraps scale and chord data for the component
const keyboardModel = computed<{ 
  mode: 'scale' | 'chord', 
  scale: ScaleSettings, 
  chord: { 
    chordType: number, 
    velocitySpread: number, 
    strumEnabled: boolean, 
    strumSpeed: number,
    strumIntervals: number[],
    buildMode: string,
    strumSwing: number,
    strumPattern: number,
    voicing: number
  } 
}>({
  get: () => ({
    mode: playMode.value,
    scale: localSettings.value.scale,
    chord: {
      chordType: localSettings.value.chord.chordType,
      velocitySpread: localSettings.value.chord.velocitySpread,
      strumEnabled: localSettings.value.chord.strumEnabled,
      strumSpeed: localSettings.value.chord.strumSpeed,
      strumIntervals: localSettings.value.chord.strumIntervals || [0, 4, 7, 12],
      buildMode: localSettings.value.chord.buildMode || 'up',
      strumSwing: localSettings.value.chord.strumSwing || 0,
      strumPattern: localSettings.value.chord.strumPattern || 0,
      voicing: localSettings.value.chord.voicing || 1,
    }
  }),
  set: (v) => {
    // Update play mode
    playMode.value = v.mode;
    // Update scale data in localSettings
    localSettings.value.scale = v.scale;
    // Update chord settings
    localSettings.value.chord.chordType = v.chord.chordType;
    localSettings.value.chord.velocitySpread = v.chord.velocitySpread;
    localSettings.value.chord.strumEnabled = v.chord.strumEnabled;
    localSettings.value.chord.strumSpeed = v.chord.strumSpeed;
    localSettings.value.chord.voicing = v.chord.voicing;
    localSettings.value.chord.strumIntervals = v.chord.strumIntervals;
    localSettings.value.chord.buildMode = v.chord.buildMode;
    localSettings.value.chord.strumSwing = v.chord.strumSwing;
    localSettings.value.chord.strumPattern = v.chord.strumPattern;
    markChanged();
  }
});

// Computed properties for accordion header display
const currentScaleLabel = computed(() => {
  const scale = scales.value.find((s: { value: number; label: string }) => s.value === localSettings.value.scale.scaleType);
  return scale ? scale.label : 'Unknown';
});

const currentChordLabel = computed(() => {
  const chord = chordTypes.find(c => c.value === localSettings.value.chord.chordType);
  return chord ? chord.label : 'Major';
});

const currentRootNoteLabel = computed(() => {
  // Always use scale root note (shared for both scales and chords)
  let noteValue = localSettings.value.scale.rootNote
  // If invalid (e.g., 0 from Chromatic mode), default to C (60)
  if (noteValue < 60 || noteValue > 71) {
    noteValue = 60
  }
  const rootNote = rootNotes.find(n => n.value === noteValue);
  return rootNote ? rootNote.label : 'C';
});

const keyboardSubtitle = computed(() => {
  // Show current mode and type
  if (playMode.value === 'chord') {
    return `Chord | ${currentChordLabel.value}`;
  }
  return `Scale | ${currentScaleLabel.value}`;
});

const presetsSubtitle = computed(() => {
  // Show slot usage: "3 of 8 slots"
  const slotText = presetSlotCount.value === 1 ? 'slot' : 'slots';
  return `${presetSlotCount.value} of 8 ${slotText}`;
});

// Helper functions to generate subtitles for lever accordion headers
function getLeverSubtitle(lever: LeverSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(lever.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${lever.ccNumber}`;
  
  // Show full interpolation profile name
  let profile = 'Linear'; // default
  if (lever.functionMode === 2) {
    // Incremental mode
    profile = 'Incremental';
  } else if (lever.functionMode === 1) {
    // Peak & Decay mode
    profile = 'Peak & Decay';
  } else {
    // Interpolated mode - check onsetType
    if (lever.onsetType === 1) profile = 'Exponential';
    else if (lever.onsetType === 2) profile = 'Logarithmic';
    else profile = 'Linear';
  }
  
  return `${paramName} | ${profile}`;
}

function getLeverPushSubtitle(leverPush: LeverPushSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(leverPush.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${leverPush.ccNumber}`;
  
  // Show full interpolation profile name
  let profile = 'Linear'; // default
  if (leverPush.functionMode === 3) {
    // Reset mode
    profile = 'Reset';
  } else if (leverPush.functionMode === 2) {
    // Incremental mode (always show "Incremental", even for cycling parameters)
    profile = 'Incremental';
  } else if (leverPush.functionMode === 1) {
    // Peak & Decay mode
    profile = 'Peak & Decay';
  } else {
    // Interpolated mode - check onsetType
    if (leverPush.onsetType === 1) profile = 'Exponential';
    else if (leverPush.onsetType === 2) profile = 'Logarithmic';
    else profile = 'Linear';
  }
  
  return `${paramName} | ${profile}`;
}

function getTouchSubtitle(touch: TouchSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(touch.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${touch.ccNumber}`;
  
  // Cycling parameters (Pattern Selector, Scale Type, Chord Type, Root Note) - show direction
  const isCyclingParameter = touch.ccNumber === 201 || touch.ccNumber === 204 || 
                             touch.ccNumber === 205 || touch.ccNumber === 206;
  
  if (isCyclingParameter) {
    const direction = touch.offsetTime === 0 ? 'FWD' : 'REV';
    return `${paramName} | ${direction}`;
  }
  
  // Show function mode for other parameters
  let mode = 'Gate'; // default
  if (touch.functionMode === 1) {
    mode = 'Toggle';
  } else if (touch.functionMode === 2) {
    mode = 'Continuous';
  }
  
  return `${paramName} | ${mode}`;
}

// Handle profile and mode change events from lever components
function handleSlotNameDisplay(name: string) {
  if (presetsFadeTimeoutId) clearTimeout(presetsFadeTimeoutId);
  if (presetsClearTimeoutId) clearTimeout(presetsClearTimeoutId);
  presetsSuffix.value = ` ${name}`;
  presetsSuffixFading.value = false;
  presetsFadeTimeoutId = setTimeout(() => {
    presetsSuffixFading.value = true;
    presetsFadeTimeoutId = null;
  }, 500);
  presetsClearTimeoutId = setTimeout(() => {
    presetsSuffix.value = '';
    presetsSuffixFading.value = false;
    presetsClearTimeoutId = null;
  }, 2500);
}

function handleSlotCount(count: number) {
  presetSlotCount.value = count;
}

// Watch for device settings changes
watch(deviceSettings, (newSettings) => {
  if (!hasChanges.value) {
    localSettings.value = JSON.parse(JSON.stringify(newSettings));
  }
}, { deep: true });

// When a device load completes (connect auto-load or manual sync), treat it as clean
watch(lastDeviceLoadTime, () => {
  localSettings.value = JSON.parse(JSON.stringify(deviceSettings.value));
  hasChanges.value = false;
});

// Watch for SHAPE panel close - reset pattern controls when strumPattern goes to 0
watch(() => localSettings.value.chord.strumPattern, (newPattern, oldPattern) => {
  // Detect transition from shape mode (>0) to normal chord mode (0)
  if (oldPattern > 0 && newPattern === 0) {
    console.log('SHAPE panel closed - resetting pattern controls to defaults');
    
    // Default CC assignments from firmware defaults
    const defaults = {
      lever1: 3,
      leverPush1: 24,
      lever2: 128,
      leverPush2: 128,
      touch: 1
    };
    
    // Reset any control still assigned to CC 201/202
    if (localSettings.value.lever1.ccNumber === 201 || localSettings.value.lever1.ccNumber === 202) {
      console.log(`Resetting Lever 1 from CC ${localSettings.value.lever1.ccNumber} to CC ${defaults.lever1}`);
      localSettings.value.lever1.ccNumber = defaults.lever1;
    }
    
    if (localSettings.value.leverPush1.ccNumber === 201 || localSettings.value.leverPush1.ccNumber === 202) {
      console.log(`Resetting Press 1 from CC ${localSettings.value.leverPush1.ccNumber} to CC ${defaults.leverPush1}`);
      localSettings.value.leverPush1.ccNumber = defaults.leverPush1;
    }
    
    if (localSettings.value.lever2.ccNumber === 201 || localSettings.value.lever2.ccNumber === 202) {
      console.log(`Resetting Lever 2 from CC ${localSettings.value.lever2.ccNumber} to CC ${defaults.lever2}`);
      localSettings.value.lever2.ccNumber = defaults.lever2;
    }
    
    if (localSettings.value.leverPush2.ccNumber === 201 || localSettings.value.leverPush2.ccNumber === 202) {
      console.log(`Resetting Press 2 from CC ${localSettings.value.leverPush2.ccNumber} to CC ${defaults.leverPush2}`);
      localSettings.value.leverPush2.ccNumber = defaults.leverPush2;
    }
    
    if (localSettings.value.touch.ccNumber === 201 || localSettings.value.touch.ccNumber === 202) {
      console.log(`Resetting Touch from CC ${localSettings.value.touch.ccNumber} to defaults`);
      localSettings.value.touch = {
        ...localSettings.value.touch,
        ccNumber: 1,
        minCCValue: 64,
        maxCCValue: 127,
        functionMode: 2, // Continuous
        offsetTime: 0, // FWD mode
      };
    }
    
    // Mark as changed so user can upload the reset settings
    markChanged();
  }
});

// Watch strum speed - auto-expand lever ranges to prevent jumps
watch(() => localSettings.value.chord.strumSpeed, (newSpeed) => {
  const magnitude = Math.abs(newSpeed);
  
  // Helper to convert MIDI 0-127 to strum speed magnitude 5-360ms
  const midiToStrumSpeed = (midi: number) => Math.round(5 + (midi / 127) * 355);
  
  // Check and expand lever1 if configured for CC 200
  if (localSettings.value.lever1.ccNumber === 200) {
    const leverMin = midiToStrumSpeed(localSettings.value.lever1.minCCValue);
    const leverMax = midiToStrumSpeed(localSettings.value.lever1.maxCCValue);
    
    if (magnitude < leverMin || magnitude > leverMax) {
      console.log(`Lever 1: Expanding range to accommodate strum speed ${newSpeed}ms`);
      localSettings.value.lever1 = {
        ...localSettings.value.lever1,
        minCCValue: 0,   // 5ms
        maxCCValue: 127  // 360ms
      };
    }
  }
  
  // Check and expand lever2 if configured for CC 200
  if (localSettings.value.lever2.ccNumber === 200) {
    const leverMin = midiToStrumSpeed(localSettings.value.lever2.minCCValue);
    const leverMax = midiToStrumSpeed(localSettings.value.lever2.maxCCValue);
    
    if (magnitude < leverMin || magnitude > leverMax) {
      console.log(`Lever 2: Expanding range to accommodate strum speed ${newSpeed}ms`);
      localSettings.value.lever2 = {
        ...localSettings.value.lever2,
        minCCValue: 0,   // 5ms
        maxCCValue: 127  // 360ms
      };
    }
  }
});

function markChanged() {
  if (!isMounted.value) return;
  hasChanges.value = true;
}

function handleKeyboardChange() {
  markChanged();
}

function handleMappingChange(mappingName: string) {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  keyboardSuffix.value = ` ${mappingName}`;
  keyboardSuffixFading.value = false;
  keyboardFadeTimeoutId = window.setTimeout(() => {
    keyboardSuffixFading.value = true;
    keyboardFadeTimeoutId = null;
  }, 500);
  keyboardClearTimeoutId = window.setTimeout(() => {
    keyboardSuffix.value = '';
    keyboardSuffixFading.value = false;
    keyboardClearTimeoutId = null;
  }, 2500);
}

function handleChordStyleChange(styleName: string) {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  keyboardSuffix.value = ` ${styleName}`;
  keyboardSuffixFading.value = false;
  keyboardFadeTimeoutId = window.setTimeout(() => {
    keyboardSuffixFading.value = true;
    keyboardFadeTimeoutId = null;
  }, 500);
  keyboardClearTimeoutId = window.setTimeout(() => {
    keyboardSuffix.value = '';
    keyboardSuffixFading.value = false;
    keyboardClearTimeoutId = null;
  }, 2500);
}

function handleChromaticWarning(message: string) {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  keyboardSuffix.value = ` ${message}`;
  keyboardSuffixFading.value = false;
  keyboardFadeTimeoutId = window.setTimeout(() => {
    keyboardSuffixFading.value = true;
    keyboardFadeTimeoutId = null;
  }, 500);
  keyboardClearTimeoutId = window.setTimeout(() => {
    keyboardSuffix.value = '';
    keyboardSuffixFading.value = false;
    keyboardClearTimeoutId = null;
  }, 2500);
}

function handleLever1ValueModeChanged(modeName: string) {
  if (lever1FadeTimeoutId) clearTimeout(lever1FadeTimeoutId);
  if (lever1ClearTimeoutId) clearTimeout(lever1ClearTimeoutId);
  lever1Suffix.value = ` ${modeName}`;
  lever1SuffixFading.value = false;
  lever1FadeTimeoutId = window.setTimeout(() => {
    lever1SuffixFading.value = true;
  }, 2000);
  lever1ClearTimeoutId = window.setTimeout(() => {
    lever1Suffix.value = '';
    lever1SuffixFading.value = false;
  }, 4000);
}

function handleLeverPush1BehaviourChanged(behaviourName: string) {
  if (leverPush1FadeTimeoutId) clearTimeout(leverPush1FadeTimeoutId);
  if (leverPush1ClearTimeoutId) clearTimeout(leverPush1ClearTimeoutId);
  leverPush1Suffix.value = ` ${behaviourName}`;
  leverPush1SuffixFading.value = false;
  leverPush1FadeTimeoutId = window.setTimeout(() => {
    leverPush1SuffixFading.value = true;
  }, 2000);
  leverPush1ClearTimeoutId = window.setTimeout(() => {
    leverPush1Suffix.value = '';
    leverPush1SuffixFading.value = false;
  }, 4000);
}

function handleLever2ValueModeChanged(modeName: string) {
  if (lever2FadeTimeoutId) clearTimeout(lever2FadeTimeoutId);
  if (lever2ClearTimeoutId) clearTimeout(lever2ClearTimeoutId);
  lever2Suffix.value = ` ${modeName}`;
  lever2SuffixFading.value = false;
  lever2FadeTimeoutId = window.setTimeout(() => {
    lever2SuffixFading.value = true;
  }, 2000);
  lever2ClearTimeoutId = window.setTimeout(() => {
    lever2Suffix.value = '';
    lever2SuffixFading.value = false;
  }, 4000);
}

function handleLeverPush2BehaviourChanged(behaviourName: string) {
  if (leverPush2FadeTimeoutId) clearTimeout(leverPush2FadeTimeoutId);
  if (leverPush2ClearTimeoutId) clearTimeout(leverPush2ClearTimeoutId);
  leverPush2Suffix.value = ` ${behaviourName}`;
  leverPush2SuffixFading.value = false;
  leverPush2FadeTimeoutId = window.setTimeout(() => {
    leverPush2SuffixFading.value = true;
  }, 2000);
  leverPush2ClearTimeoutId = window.setTimeout(() => {
    leverPush2Suffix.value = '';
    leverPush2SuffixFading.value = false;
  }, 4000);
}

function handlePresetLoad(settings: DeviceSettings) {
  console.log('📂 Preset loaded - settings loaded, Send button armed');
  localSettings.value = JSON.parse(JSON.stringify(settings));
  
  // Ensure offsetTime has a default value for older presets that don't have it
  if (localSettings.value.touch.offsetTime === undefined) {
    localSettings.value.touch.offsetTime = 0; // Default to FWD mode
  }
  
  hasChanges.value = true; // Arm the Send button - user controls when to send
}

function handlePresetActivated(presetId: string | null) {
  activePresetId.value = presetId;
  if (presetId) {
    const preset = PresetStore.getPreset(presetId);
    activePresetName.value = preset?.name || '';
  } else {
    activePresetName.value = '';
  }
}

async function handleLoadClick() {
  try {
    await handleLoad(); // lastDeviceLoadTime watcher handles localSettings + hasChanges reset
    toast.success('Settings downloaded from device');
  } catch (error) {
    console.error('Failed to load settings:', error);
    toast.error('Failed to load settings from device');
  }
}

async function handleResetDefaults() {
  try {
    resetToDefaults();
    localSettings.value = JSON.parse(JSON.stringify(deviceSettings.value));
    hasChanges.value = true;
  } catch (error) {
    console.error('Failed to reset to defaults:', error);
    toast.error('Failed to reset to defaults');
  }
}

async function handleSaveToDevice() {
  try {
    await sendSettings(localSettings.value);
    
    try {
      await saveToFlash();
      hasChanges.value = false;
      toast.success('Settings uploaded to device');
    } catch (flashError) {
      console.error('Failed to save to flash:', flashError);
      toast.warning('Settings applied but may not persist on reboot');
    }
  } catch (error) {
    console.error('Failed to apply settings to device:', error);
    toast.error('Failed to apply settings to device');
  }
}

// Accordion refs
const presetsAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const keyboardAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const touchAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const systemAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);

// Track how many accordions are open
const openAccordionCount = ref(0);

watchEffect(() => {
  let count = 0;
  if (presetsAccordion.value?.isOpen) count++;
  if (keyboardAccordion.value?.isOpen) count++;
  if (lever1Accordion.value?.isOpen) count++;
  if (leverPush1Accordion.value?.isOpen) count++;
  if (lever2Accordion.value?.isOpen) count++;
  if (leverPush2Accordion.value?.isOpen) count++;
  if (touchAccordion.value?.isOpen) count++;
  if (systemAccordion.value?.isOpen) count++;
  openAccordionCount.value = count;
});

function closeAllAccordions() {
  presetsAccordion.value?.close();
  keyboardAccordion.value?.close();
  lever1Accordion.value?.close();
  leverPush1Accordion.value?.close();
  lever2Accordion.value?.close();
  leverPush2Accordion.value?.close();
  touchAccordion.value?.close();
  systemAccordion.value?.close();
}

defineExpose({
  closeAllAccordions,
  hasChanges,
  triggerSave: handleSaveToDevice
});
</script>

<style scoped>
/* Collapse All Bar */
.collapse-all-bar {
  width: 100%;
  padding: var(--kb1-spacing-sm) var(--kb1-spacing-md);
  background: rgba(106, 104, 83, 0.2);
  border: none;
  border-radius: var(--kb1-radius-lg);
  color: #848484;
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-medium);
  text-align: left;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.2s, color 0.2s;
}

.collapse-all-bar:hover {
  background: rgba(106, 104, 83, 0.6);
  color: rgba(234, 234, 234, 0.8);
}

.collapse-all-bar:active {
  background: rgba(106, 104, 83, 0.8);
}

/* Collapse fade transition */
.collapse-fade-enter-active,
.collapse-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.collapse-fade-enter-from,
.collapse-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-scales-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.scales-content {
  padding: var(--kb1-spacing-md);
  overflow-y: auto;
  /* Ensure content doesn't hide behind sticky bars */
  padding-top: var(--kb1-spacing-md);
  /* Clear fixed footer height (~72px) + safe area */
  padding-bottom: var(--kb1-spacing-lg);
}

.root-note-display {
  font-size: var(--kb1-font-input); /* 13px */
  font-weight: 400;
  color: #848484;
  font-family: var(--kb1-font-family);
  flex-shrink: 0;
  white-space: nowrap;
}

.root-note-value {
  color: var(--ui-highlight);
  font-weight: 600;
}

@media (max-width: 768px) {
  .scales-content {
    padding: 0.75rem;
  }
}

/* System Settings always accessible - never dimmed */
.system-settings-wrapper {
  opacity: 1 !important;
  filter: none !important;
  pointer-events: auto !important;
}

/* Blue accent border to show System is always available */
.system-settings-wrapper :deep(.accordion-header) {
  border-color: rgba(74, 158, 255, 0.3) !important;
  box-shadow: 0 0 0 1px rgba(74, 158, 255, 0.15) !important;
}

@media (min-width: 769px) {
  .mobile-scales-tab {
    padding-bottom: 0;
  }
}
</style>
