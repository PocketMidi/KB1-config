<template>
  <div class="mobile-controls-tab">
    <!-- Always show content, but apply disconnected styling -->
    <div v-if="isCCMapLoaded()" class="controls-accordion" :class="{ 'disconnected-state': !isConnected }">
      <AccordionSection
        ref="lever1Accordion"
        :title="`Lever 1`"
        :title-suffix="lever1Suffix"
        :title-suffix-fading="lever1SuffixFading"
        :subtitle="getLeverSubtitle(localSettings.lever1)"
        :midi-cc="localSettings.lever1.ccNumber"
        :id="'lever-1'"
        :default-open="false"
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
          @update:modelValue="markChanged"
          @profileChanged="handleLever1ProfileChange"
          @valueModeChanged="handleLever1ValueModeChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="leverPush1Accordion"
        :title="`Press 1`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush1)"
        :midi-cc="localSettings.leverPush1.ccNumber"
        :id="'lever-push-1'"
        :default-open="false"
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
          @update:modelValue="markChanged"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="lever2Accordion"
        :title="`Lever 2`"
        :subtitle="getLeverSubtitle(localSettings.lever2)"
        :midi-cc="localSettings.lever2.ccNumber"
        :id="'lever-2'"
        :default-open="false"
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
          @update:modelValue="markChanged"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="leverPush2Accordion"
        :title="`Press 2`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush2)"
        :midi-cc="localSettings.leverPush2.ccNumber"
        :id="'lever-push-2'"
        :default-open="false"
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
          @update:modelValue="markChanged"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="touchAccordion"
        title="TOUCH"
        :title-suffix="touchSuffix"
        :title-suffix-fading="touchSuffixFading"
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
          @update:modelValue="markChanged"
        />
      </AccordionSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { 
  DeviceSettings, 
  LeverSettings as LeverSettingsType, 
  LeverPushSettings as LeverPushSettingsType, 
  TouchSettings as TouchSettingsType 
} from '../ble/kb1Protocol';
import AccordionSection from '../components/AccordionSection.vue';
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
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
} = useDeviceState();

const localSettings = ref<DeviceSettings>({ ...deviceSettings.value });
const hasChanges = ref(false);

// Load CC map on mount
onMounted(async () => {
  try {
    await loadPolyendCCMap();
  } catch (error) {
    console.error('Failed to load CC map:', error);
  }
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



// Helper functions to generate subtitles for accordion headers
// These show user-friendly parameter names and user-facing value ranges
function getLeverSubtitle(lever: LeverSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(lever.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${lever.ccNumber}`;
  
  // Show full interpolation profile name
  let profile = 'Linear'; // default
  if (lever.functionMode === 2) {
    // Incremental mode
    profile = 'Incremental';
  } else {
    // Interpolated or Peak & Decay - check onsetType
    if (lever.onsetType === 1) profile = 'Exponential';
    else if (lever.onsetType === 2) profile = 'Logarithmic';
    else profile = 'Linear';
  }
  
  return `${paramName} · ${profile}`;
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
  } else if (leverPush.functionMode === 1) {
    // Peak & Decay mode
    profile = 'Peak & Decay';
  } else {
    // Interpolated mode - check onsetType
    if (leverPush.onsetType === 1) profile = 'Exponential';
    else if (leverPush.onsetType === 2) profile = 'Logarithmic';
    else profile = 'Linear';
  }
  
  return `${paramName} · ${profile}`;
}

function getTouchSubtitle(touch: TouchSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(touch.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${touch.ccNumber}`;
  
  // Show function mode
  let mode = 'Gate'; // default
  if (touch.functionMode === 1) {
    mode = 'Toggle';
  } else if (touch.functionMode === 2) {
    mode = 'Continuous';
  }
  
  return `${paramName} · ${mode}`;
}

// Watch for device settings changes
watch(deviceSettings, (newSettings) => {
  if (!hasChanges.value) {
    localSettings.value = { ...newSettings };
  }
}, { deep: true });

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
  console.log('✏️ Settings changed - hasChanges set to true');
  hasChanges.value = true;
}

// Accordion refs
const lever1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const touchAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);

function closeAllAccordions() {
  lever1Accordion.value?.close();
  leverPush1Accordion.value?.close();
  lever2Accordion.value?.close();
  leverPush2Accordion.value?.close();
  touchAccordion.value?.close();
}

defineExpose({
  closeAllAccordions
});
</script>

<style scoped>
.mobile-controls-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.controls-accordion {
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  /* Ensure content doesn't hide behind sticky bars */
  padding-top: 1rem;
  /* Clear fixed footer height (~72px) + safe area */
  padding-bottom: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .controls-accordion {
    padding: 0.75rem;
  }
}

@media (min-width: 769px) {
  .mobile-controls-tab {
    padding-bottom: 0;
  }
}
</style>
