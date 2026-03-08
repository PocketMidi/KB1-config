<template>
  <div class="settings-touch">
    <!-- Mode Selection -->
    <div class="controls-row">
      <div class="mode-selector">
        <button 
          class="mode-btn"
          :class="{ active: model.functionMode === 2 }"
          :disabled="isPatternSelector"
          @click="selectMode(2)"
          title="Continuous"
        >
          Cont
        </button>
        <button 
          class="mode-btn"
          :class="{ active: model.functionMode === 1 }"
          :disabled="isPatternSelector"
          @click="selectMode(1)"
          title="Toggle"
        >
          Togg
        </button>
        <button 
          class="mode-btn"
          :class="{ active: model.functionMode === 0 }"
          :disabled="isPatternSelector"
          @click="selectMode(0)"
          title="Gate"
        >
          Gate
        </button>
      </div>
    </div>

    <!-- Mode Visualization -->
    <div class="mode-visualization">
      <PatternSelector 
        v-if="isPatternSelector"
        :min="userMin"
        :max="userMax"
      />
      <img 
        v-else
        :src="modeImage" 
        alt="Touch Mode" 
        class="mode-graph" 
      />
    </div>

    <!-- Level Meter -->
    <LevelMeter 
      :min="userMin" 
      :max="userMax" 
      :is-bipolar="false"
      mode="range"
      :min-allowed="minRange"
      :max-allowed="maxRange"
      :step-size="isPatternSelector ? 1 : 5"
      @update:min="userMin = $event"
      @update:max="userMax = $event"
    />

    <div class="inputs">
      <div class="group">
        <label>CATEGORY</label>
        <button 
          ref="categoryTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': categoryPickerOpen }"
          @click="categoryPickerOpen = true"
        >
          {{ selectedCategory }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>PARAMETER</label>
        <button 
          ref="parameterTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': parameterPickerOpen }"
          @click="parameterPickerOpen = true"
        >
          {{ selectedParameterLabel }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-min">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="constrainedMaxForMin"
          :step="1"
          :small-step="isPatternSelector ? 1 : unipolarStepSize"
          :large-step="isPatternSelector ? 1 : unipolarStepSize * 2"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-max">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="constrainedMinForMax"
          :max="maxRange"
          :step="1"
          :small-step="isPatternSelector ? 1 : unipolarStepSize"
          :large-step="isPatternSelector ? 1 : unipolarStepSize * 2"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-threshold">THRESHOLD</label>
        <ValueControl
          v-model="userThreshold"
          :min="0"
          :max="100"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>
      <div class="hint-text">Sensitivity: 0 = most sensitive, 100 = least sensitive</div>
    </div>

    <!-- Category Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="selectedCategory"
      v-model:isOpen="categoryPickerOpen"
      :options="categoryOptions"
      :trigger-el="categoryTriggerRef"
    />

    <!-- Parameter Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="model.ccNumber"
      v-model:isOpen="parameterPickerOpen"
      :options="filteredOptions"
      :trigger-el="parameterTriggerRef"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import PatternSelector from './PatternSelector.vue'
import { useUIPreferences } from '../composables/useUIPreferences'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
  threshold?: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
  (e: 'modeChanged', modeName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// UI Preferences
const { unipolarStepSize } = useUIPreferences()

const BASE_PATH = import.meta.env.BASE_URL || '/'

// Mode names for events
const MODE_NAMES = {
  0: 'Open Gate',
  1: 'Toggle',
  2: 'Continuous'
} as const

// Function to select mode and emit change
function selectMode(mode: number) {
  model.value.functionMode = mode
  emit('modeChanged', MODE_NAMES[mode as keyof typeof MODE_NAMES])
}

// Mode visualization
const modeImage = computed(() => {
  // Function mode 0 = Gate, 1 = Toggle, 2 = Continuous
  if (model.value.functionMode === 1) {
    return `${BASE_PATH}touch/togg_animated.svg`
  } else if (model.value.functionMode === 2) {
    return `${BASE_PATH}touch/cont_animated.svg`
  }
  // Default to Gate (mode 0)
  return `${BASE_PATH}touch/gate_animated.svg`
})

// Check if Pattern Selector is active
const isPatternSelector = computed(() => model.value.ccNumber === 201)

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)

const categoryOptions = computed(() => {
  const cats: Array<{ label: string; value: string; isDivider?: boolean }> = props.categories.map(cat => ({ label: cat, value: cat }))
  // Add divider after KB1 Expression (index 0)
  if (cats.length > 1 && cats[0]?.label === 'KB1 Expression') {
    cats.splice(1, 0, { label: '───', value: '___divider___', isDivider: true })
  }
  return cats
})

// Wheel picker state
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)
const parameterPickerOpen = ref(false)
const parameterTriggerRef = ref<HTMLElement | null>(null)

// Get selected labels
const selectedParameterLabel = computed(() => {
  const option = filteredOptions.value.find(opt => opt.value === model.value.ccNumber)
  return option?.label || '—'
})

// Flag to prevent infinite watch loops
const isUpdatingInternally = ref(false)

// Watch for ccMapByNumber changes to initialize category when map loads
watch(() => props.ccMapByNumber.size, () => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  if (cat && cat !== selectedCategory.value) {
    selectedCategory.value = cat
  }
  isUpdatingInternally.value = false
}, { immediate: true })

// Filter options by selected category
const filteredOptions = computed(() => {
  return props.ccOptions.filter(opt => opt.group === selectedCategory.value)
})

// Watch ccNumber to keep Category in sync and auto-clamp KB1 Expression ranges
watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat) selectedCategory.value = cat
  
  // KB1 Expression parameters: Clamp to valid ranges
  if (cc === 200) {
    // Strum Speed: 10-100% displayed (maps to 120ms-4ms)
    model.value.minCCValue = 127  // Maps to 10% (slowest)
    model.value.maxCCValue = 0    // Maps to 100% (fastest)
  } else if (cc === 201) {
    // Pattern Selector: 1-6 (firmware maps full MIDI range to discrete patterns)
    model.value.minCCValue = 0     // 0%
    model.value.maxCCValue = 127   // 100%
  } else if (cc === 202) {
    // Swing: 0-100%
    model.value.minCCValue = 0   // 0%
    model.value.maxCCValue = 127 // 100%
  } else if (cc === 203) {
    // Velocity Spread: 8-100%
    const min = Math.round((8 / 100) * 127)   // 8 -> ~10 MIDI
    const max = Math.round((100 / 100) * 127) // 100 -> 127 MIDI
    model.value.minCCValue = min
    model.value.maxCCValue = max
  }
  
  isUpdatingInternally.value = false
})

// Watch selectedCategory to ensure a valid parameter is selected
watch(selectedCategory, (cat) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  
  const ok = props.ccMapByNumber.get(model.value.ccNumber)?.category === cat
  if (!ok) {
    const first = filteredOptions.value.find(o => o.value >= 0)
    if (first) model.value.ccNumber = first.value
  }
  isUpdatingInternally.value = false
})

// Conversion functions
function unipolarToMidi(userValue: number): number {
  return Math.round((userValue / 100) * 127)
}

function midiToUnipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 100)
}

// Special conversion for Pattern Selector (1-6)
function patternToMidi(pattern: number): number {
  // Map pattern 1-6 to MIDI 0-127
  return Math.round(((pattern - 1) / 5) * 127)
}

function midiToPattern(midiValue: number): number {
  // Map MIDI 0-127 to pattern 1-6
  return Math.round((midiValue / 127) * 5) + 1
}

// Special conversion for Strum Speed (CC 200): inverted so higher % = faster
// User sees 10-100% range (better UX), maps to 4-120ms: 100%→4ms, 10%→120ms
function speedPercentToMidi(percent: number): number {
  // Map 10-100% to MIDI 127-0 (inverted)
  return Math.round(127 * (100 - percent) / 90)
}

function midiToSpeedPercent(midiValue: number): number {
  // Map MIDI 127-0 to 10-100%
  return Math.round(10 + ((127 - midiValue) / 127) * 90)
}

// Min/max range (always unipolar for Touch)
// KB1 Expression parameters have hardware-enforced minimum values
const minRange = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 200) return 10  // Strum Speed: 10-100% (perceived range, maps to 4-120ms)
  if (cc === 201) return 1   // Pattern Selector: 1-6
  if (cc === 203) return 8   // Velocity Spread: 8-100%
  return 0  // Default minimum
})

const maxRange = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 201) return 6   // Pattern Selector: 1-6 (discrete)
  return 100  // Default maximum
})

// Buffer between min and max to prevent overlap (at least 5 units)
const MIN_MAX_BUFFER = 5

// Constrained ranges to prevent min/max overlap
const constrainedMaxForMin = computed(() => {
  // userMin can't exceed userMax - buffer
  return Math.min(maxRange.value, userMax.value - MIN_MAX_BUFFER)
})

const constrainedMinForMax = computed(() => {
  // userMax can't go below userMin + buffer
  return Math.max(minRange.value, userMin.value + MIN_MAX_BUFFER)
})

// User-facing Min value (0-100 for normal params, 1-7 for pattern selector, always unipolar for Touch)
const userMin = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.minCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.minCCValue)
    } else {
      value = midiToUnipolar(model.value.minCCValue)
    }
    // Snap displayed value to user preference step size (except pattern selector)
    if (model.value.ccNumber !== 201) {
      return Math.round(value / unipolarStepSize.value) * unipolarStepSize.value
    }
    return value
  },
  set: (userValue: number) => {
    if (model.value.ccNumber === 200) {
      model.value.minCCValue = speedPercentToMidi(userValue)
    } else if (model.value.ccNumber === 201) {
      model.value.minCCValue = patternToMidi(userValue)
    } else {
      model.value.minCCValue = unipolarToMidi(userValue)
    }
  }
})

// User-facing Max value (0-100 for normal params, 1-7 for pattern selector, always unipolar for Touch)
const userMax = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.maxCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.maxCCValue)
    } else {
      value = midiToUnipolar(model.value.maxCCValue)
    }
    // Snap displayed value to user preference step size (except pattern selector)
    if (model.value.ccNumber !== 201) {
      return Math.round(value / unipolarStepSize.value) * unipolarStepSize.value
    }
    return value
  },
  set: (userValue: number) => {
    if (model.value.ccNumber === 200) {
      model.value.maxCCValue = speedPercentToMidi(userValue)
    } else if (model.value.ccNumber === 201) {
      model.value.maxCCValue = patternToMidi(userValue)
    } else {
      model.value.maxCCValue = unipolarToMidi(userValue)
    }
  }
})

// Threshold range in firmware (based on typical capacitive touch sensor values)
const THRESHOLD_MIN = 24000
const THRESHOLD_MAX = 64000

// User-facing Threshold (0-100 percentage)
const userThreshold = computed({
  get: () => {
    const threshold = model.value.threshold ?? THRESHOLD_MIN
    // Convert from firmware range to 0-100 percentage
    // Note: Higher firmware value = less sensitive, so we map accordingly
    return Math.round(((threshold - THRESHOLD_MIN) / (THRESHOLD_MAX - THRESHOLD_MIN)) * 100)
  },
  set: (userValue: number) => {
    // Convert from 0-100 percentage to firmware range
    model.value.threshold = Math.round((userValue / 100) * (THRESHOLD_MAX - THRESHOLD_MIN) + THRESHOLD_MIN)
  }
})
</script>

<style scoped>
.settings-touch {
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .settings-touch {
    padding: 0.75rem;
  }
  
  .title {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.title h2 {
  margin: 0;
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  font-family: 'Roboto Mono';
}

.parameter-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
}

.parameter-name {
  font-weight: 600;
  color: var(--color-text);
}

.parameter-range {
  color: var(--color-text-muted);
  font-style: italic;
}

.cc-reference {
  color: var(--color-text-muted);
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.input-divider {
  height: 1px;
  background: var(--color-divider);
  width: 100%;
}

.group {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  gap: 1rem;
}

.group label {
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  color: #848484;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  min-width: 120px;
}

.picker-trigger {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  flex: 1;
  text-align: right;
  cursor: pointer;
  transition: background 0.2s ease;
}

.picker-trigger:hover {
  background: rgba(234, 234, 234, 0.05);
}

.picker-trigger.picker-open {
  color: transparent;
}

.group select {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  flex: 1;
  text-align: right;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23EAEAEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  padding-right: 2rem;
}

.group option {
  background: var(--color-background);
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  font-size: 0.8125rem;
}

.group select:focus {
  outline: none;
}

.hint-text {
  font-size: 0.8125rem; /* 13px */
  font-style: italic;
  color: var(--color-text-muted);
  padding: 0.5rem 0 1rem 0;
  font-family: 'Roboto Mono';
}

/* Controls Row */
.controls-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  width: 100%;
}

/* Mode Selector */
.mode-selector {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
}

.mode-btn {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #848484;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  font-family: 'Roboto Mono';
}

.mode-btn:hover {
  color: #CDCDCD;
}

.mode-btn.active {
  color: #CDCDCD;
}

.mode-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #CDCDCD;
}

/* Mode Visualization */
.mode-visualization {
  margin: 0.5rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
}

.mode-visualization img {
  width: 100%;
  height: auto;
  display: block;
}
</style>