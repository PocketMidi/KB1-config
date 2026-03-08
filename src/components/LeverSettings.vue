<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <!-- Toggle and Profile Selection -->
    <div class="controls-row">
      <!-- Unipolar/Bipolar Toggle -->
      <button 
        class="toggle-btn" 
        @click="handleToggleClick"
        :title="toggleTooltip"
        :disabled="isKB1Expression"
      >
        <span :class="{ active: model.valueMode === 0 }">UNI</span>
        <span class="toggle-divider">|</span>
        <span :class="{ active: model.valueMode === 1 }">BI</span>
      </button>

      <!-- Profile Text Selection -->
      <div class="profile-selector">
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('lin') }"
          @click="selectProfile('lin')"
          title="Linear"
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          @click="selectProfile('exp')"
          title="Exponential"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          @click="selectProfile('log')"
          title="Logarithmic"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('pd') }"
          @click="selectProfile('pd')"
          title="Peak & Decay"
        >
          P&D
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('inc') }"
          @click="selectProfile('inc')"
          title="Incremental"
        >
          Inc
        </button>
      </div>
    </div>

    <!-- Profile Visualization -->
    <div class="profile-visualization">
      <IncrementalProfile 
        v-if="isIncrementalMode"
        :steps="stepsValue"
        :is-bipolar="model.valueMode === 1"
        class="profile-graph"
      />
      <img 
        v-else
        :src="profileImage" 
        alt="Profile visualization" 
        class="profile-graph" 
      />
    </div>

    <!-- Level Meter -->
    <LevelMeter 
      :min="userMin" 
      :max="userMax" 
      :is-bipolar="model.valueMode === 1"
      :min-allowed="minRange"
      :max-allowed="maxRange"
      :step-size="minMaxStepSize"
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
        <label :for="`lever-min-${lever}`">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="maxRange"
          :step="minMaxStepSize"
          :small-step="minMaxStepSize"
          :large-step="minMaxStepSize * 2"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`lever-max-${lever}`">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="minRange"
          :max="maxRange"
          :step="minMaxStepSize"
          :small-step="minMaxStepSize"
          :large-step="minMaxStepSize * 2"
        />
      </div>

      <!-- Duration for non-incremental modes, Steps for incremental mode -->
      <template v-if="!isIncrementalMode">
        <div class="duration-container">
          <!-- Duration Meter Visual -->
          <div class="duration-meter">
            <div 
              class="meter-bar-container"
              @mousedown="handleDurationBarMouseDown"
              @touchstart="handleDurationBarTouchStart"
            >
              <!-- Bipolar mode: blue and pink bars -->
              <template v-if="model.valueMode === 1">
                <div class="meter-bar-wrapper">
                  <div class="meter-bar blue-bar-base"></div>
                  <div 
                    class="meter-bar blue-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
                <div class="meter-divider"></div>
                <div class="meter-bar-wrapper">
                  <div class="meter-bar pink-bar-base"></div>
                  <div 
                    class="meter-bar pink-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
              </template>
              <!-- Unipolar mode: only pink bar -->
              <template v-else>
                <div class="meter-divider"></div>
                <div class="meter-bar-wrapper">
                  <div class="meter-bar pink-bar-base"></div>
                  <div 
                    class="meter-bar pink-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
              </template>
            </div>
          </div>

          <div class="group">
            <label :for="`lever-duration-${lever}`">DURATION</label>
            <div class="duration-control-wrapper">
              <ValueControl
                v-model="duration"
                :min="100"
                :max="2000"
                :step="10"
                :small-step="10"
                :large-step="100"
              />
              <span class="unit-label">ms</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Steps for Incremental mode -->
      <template v-else>
        <div class="group">
          <label :for="`lever-steps-${lever}`">STEPS</label>
          <div class="steps-control">
            <div class="steps-input-wrapper">
              <div 
                class="tap-zone tap-zone-left"
                :class="{ disabled: isStepsAtMin }"
                @click="decreaseSteps"
                title="Previous step value"
              >
                <span class="tap-indicator">−</span>
              </div>
              <div 
                class="draggable-value-inline"
                @mousedown="handleStepsMouseDown"
                @touchstart="handleStepsTouchStart"
                @touchmove="handleStepsTouchMove"
                @touchend="handleStepsTouchEnd"
                @wheel="handleStepsWheel"
              >
                {{ stepsValue }}
              </div>
              <div 
                class="tap-zone tap-zone-right"
                :class="{ disabled: isStepsAtMax }"
                @click="increaseSteps"
                title="Next step value"
              >
                <span class="tap-indicator">+</span>
              </div>
            </div>
          </div>
        </div>
      </template>
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
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import IncrementalProfile from './IncrementalProfile.vue'
import { useHaptics } from '../composables/useHaptics'

type LeverModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  stepSize: number
  functionMode: number
  valueMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
  valueModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverModel): void
  (e: 'profileChanged', profileName: string): void
  (e: 'valueModeChanged', modeName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Haptics
const { tap, snap, isSupported } = useHaptics()

// Constants
const BASE_PATH = '/KB1-config'

// Check if current parameter is KB1 Expression (unipolar only)
const isKB1Expression = computed(() => {
  const cc = model.value.ccNumber
  return cc === 200 || cc === 201 || cc === 202 || cc === 203
})

// Toggle tooltip
const toggleTooltip = computed(() => {
  if (isKB1Expression.value) {
    return 'KB1 Expression parameters are unipolar only'
  }
  return model.value.valueMode === 0 ? 'Switch to Bipolar' : 'Switch to Unipolar'
})

const handleToggleClick = () => {
  if (isKB1Expression.value) return // Prevent toggle for KB1 Expression
  
  if (isSupported.value) snap()
  
  model.value.valueMode = model.value.valueMode === 0 ? 1 : 0
  
  // Emit the new mode name for parent to display
  const newModeName = model.value.valueMode === 0 ? 'Unipolar' : 'Bipolar'
  emit('valueModeChanged', newModeName)
}

// Cleanup event listeners on unmount
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleStepsMouseMove)
  document.removeEventListener('mouseup', handleStepsMouseUp)
})

// Profile selection logic
type ProfileType = 'lin' | 'exp' | 'log' | 'pd' | 'inc'

const isProfileActive = (profile: ProfileType): boolean => {
  if (model.value.functionMode === 2) {
    return profile === 'inc'
  } else if (model.value.functionMode === 1) {
    return profile === 'pd'
  } else if (model.value.functionMode === 0) {
    if (model.value.onsetType === 1) return profile === 'exp'
    if (model.value.onsetType === 2) return profile === 'log'
    return profile === 'lin'
  }
  return false
}

// Active profile name (full description)
const activeProfileName = computed(() => {
  if (model.value.functionMode === 2) {
    return 'Incremental'
  } else if (model.value.functionMode === 1) {
    return 'Peak & Decay'
  } else if (model.value.functionMode === 0) {
    if (model.value.onsetType === 1) return 'Exponential'
    if (model.value.onsetType === 2) return 'Logarithmic'
    return 'Linear'
  }
  return 'Linear'
})

const selectProfile = (profile: ProfileType) => {
  if (isSupported.value) snap()
  
  if (profile === 'inc') {
    model.value.functionMode = 2
  } else if (profile === 'pd') {
    model.value.functionMode = 1
  } else {
    model.value.functionMode = 0
    
    // Set onsetType and offsetType based on profile
    if (profile === 'exp') {
      model.value.onsetType = 1
      model.value.offsetType = 1
    } else if (profile === 'log') {
      model.value.onsetType = 2
      model.value.offsetType = 2
    } else {
      // lin
      model.value.onsetType = 0
      model.value.offsetType = 0
    }
  }
  
  // Emit profile change event
  emit('profileChanged', activeProfileName.value)
}

// Profile visualization
const profileImage = computed(() => {
  const polarity = model.value.valueMode === 1 ? 'bi' : 'uni'
  let profile = 'lin' // default
  
  if (model.value.functionMode === 2) {
    profile = 'inc'
  } else if (model.value.functionMode === 1) {
    profile = 'pd'
  } else if (model.value.functionMode === 0) {
    // Interpolated mode - check type
    if (model.value.onsetType === 1) profile = 'exp'
    else if (model.value.onsetType === 2) profile = 'log'
    else profile = 'lin'
  }
  
  // Use animated versions for lin, exp, log, and pd profiles
  const animated = (profile === 'lin' || profile === 'exp' || profile === 'log' || profile === 'pd') ? '_animated' : ''
  
  // All lever profile SVG files use underscore separator
  return `${BASE_PATH}/lever_profiles/${profile}_${polarity}${animated}.svg`
})

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)

// Convert categories to dropdown options with divider after KB1 Expression
const categoryOptions = computed(() => {
  const options: Array<{ label: string; value: string; isDivider?: boolean }> = props.categories.map(cat => ({ label: cat, value: cat }))
  // Add divider after KB1 Expression (index 0)
  if (options.length > 1 && options[0]?.label === 'KB1 Expression') {
    options.splice(1, 0, { label: '───', value: '___divider___', isDivider: true })
  }
  return options
})

// Parameter wheel picker state
const parameterPickerOpen = ref(false)
const parameterTriggerRef = ref<HTMLElement | null>(null)

// Get selected parameter label
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
// Note: Pattern Selector (201) excluded from levers - discrete values better suited for press controls
const filteredOptions = computed(() => {
  return props.ccOptions.filter(opt => 
    opt.group === selectedCategory.value && opt.value !== 201
  )
})

// Watch ccNumber to keep Category in sync and clamp KB1 Expression parameters
watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat) selectedCategory.value = cat
  
  // KB1 Expression parameters: Force unipolar mode and clamp to valid ranges
  if (cc === 200) {
    // Strum Speed: 10-100% displayed (maps to 120ms-4ms)
    // Store MIDI values in ascending order even though UI presents them inverted
    model.value.valueMode = VALUE_MODE_UNIPOLAR
    model.value.minCCValue = 0    // Maps to 100% (fastest) via speedPercentToMidi
    model.value.maxCCValue = 127  // Maps to 10% (slowest) via speedPercentToMidi
  } else if (cc === 202) {
    // Swing: 0-100%
    model.value.valueMode = VALUE_MODE_UNIPOLAR
    model.value.minCCValue = 0   // 0%
    model.value.maxCCValue = 127 // 100%
  } else if (cc === 203) {
    // Velocity Spread: 8-100%
    model.value.valueMode = VALUE_MODE_UNIPOLAR
    const min = Math.round((8 / 100) * 127)   // 8 -> ~10 MIDI
    const max = Math.round((100 / 100) * 127) // 100 -> 127 MIDI
    model.value.minCCValue = min
    model.value.maxCCValue = max
  }
  // Note: Pattern Selector (201) filtered out for levers - handled by press controls only
  
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

// Computed properties for mode detection
const isIncrementalMode = computed(() => model.value.functionMode === 2)

// Step size mapping: Display % → Firmware stepSize
const stepsDisplayToFirmware: Record<number, number> = {
  25: 32,
  15: 20,
  10: 12,
  5: 6
}
const stepsFirmwareToDisplay: Record<number, number> = {
  32: 25,
  20: 15,
  12: 10,
  6: 5
}

// Direct access to firmware stepSize with % display conversion
const stepsValue = computed({
  get: () => {
    return stepsFirmwareToDisplay[model.value.stepSize] ?? 5
  },
  set: (displayPercent: number) => {
    model.value.stepSize = stepsDisplayToFirmware[displayPercent] ?? 6
  }
})

// Value mode constants
const VALUE_MODE_UNIPOLAR = 0
const VALUE_MODE_BIPOLAR = 1

// Determine min/max range based on polarity and KB1 Expression parameters
const minRange = computed(() => {
  const cc = model.value.ccNumber
  
  // Special limits for specific parameters
  if (cc === 128) {
    // Velocity: lock minimum at -80% (MIDI 13)
    return model.value.valueMode === VALUE_MODE_BIPOLAR ? -80 : 13
  }
  
  if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
    return -100
  }
  
  // KB1 Expression parameters have hardware-enforced minimum values
  if (cc === 200) return 10  // Strum Speed: 10-100% (perceived range, maps to 4-120ms)
  if (cc === 201) return 1   // Pattern Selector: 1-6
  if (cc === 203) return 8   // Velocity Spread: 8-100%
  
  return 0  // Default unipolar minimum
})

const maxRange = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 201) return 6   // Pattern Selector: 1-6 (discrete)
  return 100  // Default maximum
})

// Step size for MIN/MAX controls in incremental mode
const minMaxStepSize = computed(() => {
  // In incremental mode, match the STEPS percentage (5%, 10%, 15%, 25%)
  return isIncrementalMode.value ? stepsValue.value : 1
})

// Snap value to step increments in incremental mode
function snapToStepIncrement(value: number): number {
  if (!isIncrementalMode.value) return value
  const step = stepsValue.value
  return Math.round(value / step) * step
}

// Watch for changes to incremental mode or step size and snap existing values
watch([isIncrementalMode, stepsValue], () => {
  if (isIncrementalMode.value) {
    nextTick(() => {
      // Snap current values to the step increments
      const snappedMin = snapToStepIncrement(userMin.value)
      const snappedMax = snapToStepIncrement(userMax.value)
      
      if (snappedMin !== userMin.value) {
        userMin.value = snappedMin
      }
      if (snappedMax !== userMax.value) {
        userMax.value = snappedMax
      }
    })
  }
})

// Conversion functions
function unipolarToMidi(userValue: number): number {
  return Math.round((userValue / 100) * 127)
}

function bipolarToMidi(userValue: number): number {
  return Math.round(((userValue + 100) / 200) * 127)
}

function midiToUnipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 100)
}

function midiToBipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 200) - 100
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

// Special conversion for Strum Speed (CC 200): higher % = faster (lower ms)
// User sees 10-100% range (better UX), maps to 4-120ms: 100%→4ms, 10%→120ms
// Store MIDI in normal ascending order: low MIDI = slow, high MIDI = fast
function speedPercentToMidi(percent: number): number {
  // Map 10-100% to MIDI 0-127 (normal order: higher MIDI = faster)
  return Math.round(127 * (percent - 10) / 90)
}

function midiToSpeedPercent(midiValue: number): number {
  // Map MIDI 0-127 to 10-100%
  return Math.round(10 + (midiValue / 127) * 90)
}

// User-facing Min value (0-100 or -100 to +100, or 1-7 for pattern selector)
const userMin = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.minCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.minCCValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      value = midiToBipolar(model.value.minCCValue)
    } else {
      value = midiToUnipolar(model.value.minCCValue)
    }
    // Snap to step increment in incremental mode
    return snapToStepIncrement(value)
  },
  set: (userValue: number) => {
    const snappedValue = snapToStepIncrement(userValue)
    if (model.value.ccNumber === 200) {
      model.value.minCCValue = speedPercentToMidi(snappedValue)
    } else if (model.value.ccNumber === 201) {
      model.value.minCCValue = patternToMidi(snappedValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value.minCCValue = bipolarToMidi(snappedValue)
    } else {
      model.value.minCCValue = unipolarToMidi(snappedValue)
    }
  }
})

// User-facing Max value (0-100 or -100 to +100, or 1-7 for pattern selector)
const userMax = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.maxCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.maxCCValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      value = midiToBipolar(model.value.maxCCValue)
    } else {
      value = midiToUnipolar(model.value.maxCCValue)
    }
    // Snap to step increment in incremental mode
    return snapToStepIncrement(value)
  },
  set: (userValue: number) => {
    const snappedValue = snapToStepIncrement(userValue)
    if (model.value.ccNumber === 200) {
      model.value.maxCCValue = speedPercentToMidi(snappedValue)
    } else if (model.value.ccNumber === 201) {
      model.value.maxCCValue = patternToMidi(snappedValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value.maxCCValue = bipolarToMidi(snappedValue)
    } else {
      model.value.maxCCValue = unipolarToMidi(snappedValue)
    }
  }
})

// Watch polarity changes and adjust min/max values accordingly
watch(() => model.value.valueMode, (newMode, oldMode) => {
  if (oldMode === undefined) return // Skip initial watch trigger
  
  if (newMode === VALUE_MODE_BIPOLAR && oldMode === VALUE_MODE_UNIPOLAR) {
    // Switching from Unipolar to Bipolar
    // Map 50 → 0 (center), maintaining MIDI equivalents
    const currentMinMidi = model.value.minCCValue
    const currentMaxMidi = model.value.maxCCValue
    
    // Keep MIDI values the same, they'll just display differently
    model.value.minCCValue = currentMinMidi
    model.value.maxCCValue = currentMaxMidi
  } else if (newMode === VALUE_MODE_UNIPOLAR && oldMode === VALUE_MODE_BIPOLAR) {
    // Switching from Bipolar to Unipolar
    // Map 0 → 50 (center), clamp negatives to 0
    const currentMinMidi = model.value.minCCValue
    const currentMaxMidi = model.value.maxCCValue
    
    // Keep MIDI values the same, they'll just display differently
    model.value.minCCValue = currentMinMidi
    model.value.maxCCValue = currentMaxMidi
  }
})

// Computed property to gang attack and decay times together as "Duration"
const duration = computed({
  get: () => model.value.onsetTime,
  set: (value: number) => {
    model.value.onsetTime = value
    model.value.offsetTime = value
  }
})

// Duration bar direct interaction handlers
const updateDurationFromPosition = (clientX: number, rect: DOMRect) => {
  const dividerWidth = 4
  let percentage: number
  
  if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
    // Bipolar: [wrapper][divider][wrapper] 
    // Each wrapper is flex:1, so (width - 4px) / 2
    const halfWidth = (rect.width - dividerWidth) / 2
    const relativeX = clientX - rect.left
    
    // Determine which half we're in and calculate percentage within that wrapper
    if (relativeX < halfWidth) {
      // Left wrapper (blue bar) - reverse direction
      percentage = (relativeX / halfWidth) * 100
    } else if (relativeX < halfWidth + dividerWidth) {
      // On the divider - treat as 100% (max duration)
      percentage = 100
    } else {
      // Right wrapper (pink bar)
      percentage = ((relativeX - halfWidth - dividerWidth) / halfWidth) * 100
    }
  } else {
    // Unipolar: [divider][wrapper]
    const wrapperWidth = rect.width - dividerWidth
    const relativeX = clientX - rect.left - dividerWidth
    percentage = Math.max(0, (relativeX / wrapperWidth) * 100)
  }
  
  // Clamp percentage to 0-100
  percentage = Math.max(0, Math.min(100, percentage))
  
  // Reverse the visual formula: width = 10 + ((duration - 100) / 1900) * 90
  // So: percentage = 10 + ((duration - 100) / 1900) * 90
  // Solve for duration:
  const newValue = Math.round(100 + ((percentage - 10) / 90) * 1900)
  duration.value = Math.max(100, Math.min(2000, newValue))
}

const handleDurationBarMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  updateDurationFromPosition(e.clientX, rect)
  
  const handleMouseMove = (e: MouseEvent) => {
    updateDurationFromPosition(e.clientX, rect)
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleDurationBarTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  updateDurationFromPosition(touch.clientX, rect)
  
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    updateDurationFromPosition(touch.clientX, rect)
  }
  
  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

// Steps drag support
const stepsDragging = ref(false)
const stepsDragStartX = ref(0)
const stepsDragStartIndex = ref(0)
const stepsOptions = [25, 15, 10, 5] // Display percentages: 25%, 15%, 10%, 5%

// Mouse wheel for steps
function handleStepsWheel(event: WheelEvent) {
  event.preventDefault()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  const delta = event.deltaY > 0 ? -1 : 1
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, currentIndex + delta))
  stepsValue.value = stepsOptions[newIndex]!
}

// Mouse drag for steps
function handleStepsMouseDown(event: MouseEvent) {
  event.preventDefault()
  stepsDragging.value = true
  stepsDragStartX.value = event.clientX
  stepsDragStartIndex.value = stepsOptions.indexOf(stepsValue.value)
  
  document.addEventListener('mousemove', handleStepsMouseMove)
  document.addEventListener('mouseup', handleStepsMouseUp)
}

function handleStepsMouseMove(event: MouseEvent) {
  if (!stepsDragging.value) return
  
  const deltaX = event.clientX - stepsDragStartX.value
  // Scale: 30 pixels of movement = 1 step in the array
  const indexChange = Math.round(deltaX / 30)
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, stepsDragStartIndex.value + indexChange))
  stepsValue.value = stepsOptions[newIndex]!
}

function handleStepsMouseUp() {
  stepsDragging.value = false
  document.removeEventListener('mousemove', handleStepsMouseMove)
  document.removeEventListener('mouseup', handleStepsMouseUp)
}

// Touch drag for steps
function handleStepsTouchStart(event: TouchEvent) {
  if (!event.touches[0]) return
  stepsDragging.value = true
  stepsDragStartX.value = event.touches[0].clientX
  stepsDragStartIndex.value = stepsOptions.indexOf(stepsValue.value)
}

function handleStepsTouchMove(event: TouchEvent) {
  if (!stepsDragging.value || !event.touches[0]) return
  event.preventDefault()
  
  const deltaX = event.touches[0].clientX - stepsDragStartX.value
  // Scale: 30 pixels of movement = 1 step in the array
  const indexChange = Math.round(deltaX / 30)
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, stepsDragStartIndex.value + indexChange))
  stepsValue.value = stepsOptions[newIndex]!
}

function handleStepsTouchEnd() {
  stepsDragging.value = false
}

// Computed properties for steps min/max
const isStepsAtMin = computed(() => {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  return currentIndex <= 0
})

const isStepsAtMax = computed(() => {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  return currentIndex >= stepsOptions.length - 1
})

// Arrow button functions for steps
function decreaseSteps() {
  if (isSupported.value) tap()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  if (currentIndex > 0) {
    stepsValue.value = stepsOptions[currentIndex - 1]!
  }
}

function increaseSteps() {
  if (isSupported.value) tap()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  if (currentIndex < stepsOptions.length - 1) {
    stepsValue.value = stepsOptions[currentIndex + 1]!
  }
}
</script>

<style scoped>

.settings-lever {
  padding: 1rem 1rem 1rem 0; /* Bottom padding back to 16px */
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%; /* Ensure it takes available width */
  max-width: 100%; /* Don't exceed container */
  box-sizing: border-box; /* Include padding in width calculation */
  overflow: visible; /* Allow dropdowns to extend beyond bounds */
  position: relative; /* For popup positioning */
}

@media (max-width: 768px) {
  .settings-lever {
    padding: 0.75rem 0.75rem 0.75rem 0; /* Keep left padding at 0 */
  }
}

.controls-row {
  display: flex;
  justify-content: flex-start; /* Align to left for flush alignment */
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap; /* Keep in one row but allow shrinking */
}

.toggle-btn {
  flex: 0 0 auto;
  padding: 0.15rem 0.375rem;
  background: rgba(106, 104, 83, 0.35);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: var(--kb1-text-primary, #EAEAEA);
  font-size: 0.65rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
  display: flex;
  gap: 0.2rem;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.toggle-btn:hover {
  background: rgba(106, 104, 83, 0.6);
  border-color: rgba(106, 104, 83, 0.7);
}

.toggle-btn:active {
  background: rgba(106, 104, 83, 0.8);
  border-color: rgba(106, 104, 83, 0.9);
}

.toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.toggle-btn:disabled span {
  opacity: 0.3;
}

.toggle-btn span {
  opacity: 0.5;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.toggle-btn span:not(.active):hover {
  opacity: 0.8;
}

.toggle-btn span.active {
  opacity: 1;
  color: #EAEAEA;
  font-weight: 600;
}

.toggle-btn .toggle-divider {
  opacity: 0.3;
  font-weight: 300;
}

.profile-selector {
  display: flex;
  gap: 1.5rem; /* Internal spacing between Lin, Exp, Log, Inc buttons */
  align-items: center;
  flex-shrink: 1; /* Allow buttons to shrink if needed */
}

.profile-btn {
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

.profile-btn:hover {
  color: #CDCDCD;
}

.profile-btn.active {
  color: #CDCDCD;
}

.profile-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #CDCDCD;
}

.profile-visualization {
  margin: 0.5rem 0; /* Reduced from 1.5rem to 0.5rem */
  padding: 0; /* Remove padding that creates space */
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Contain the image */
  /* NO min-width - allow it to scale down */
}

.profile-visualization img,
.profile-visualization object {
  width: 100%;
  height: auto;
  display: block;
  max-width: 100%;
  pointer-events: none; /* Prevent interaction with SVG */
  /* NO min-width - allow scaling */
}

/* Tablet and mobile-specific sizing */
@media (max-width: 768px) {
  .controls-row {
    gap: 0.75rem; /* 12px gap on tablets */
  }
  
  .profile-visualization {
    margin: 1rem 0;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .controls-row {
    gap: 0.5rem; /* 8px gap on very small screens */
  }
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: 1.5rem;
}

.input-divider {
  height: 1px;
  background: var(--color-divider);
  width: 100%;
}

/* Duration Container with border */
.duration-container {
  border: 1px solid var(--color-divider);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  margin-left: -1rem;
  margin-right: -1rem;
}

.duration-container .group {
  padding: 0.35rem 0 0.5rem 0;
}

/* Duration Meter Styles */
.duration-meter {
  width: 100%;
  padding: 0.5rem 0 0.35rem 0;
}

.meter-bar-container {
  display: flex;
  align-items: center;
  gap: 0;
  height: 9px;
  width: 100%;
  cursor: pointer;
  user-select: none;
}

.meter-bar-wrapper {
  position: relative;
  height: 9px;
  flex: 1;
  overflow: hidden;
}

.meter-bar {
  height: 9px;
  position: absolute;
  top: 0;
  left: 0;
}

/* Base bars at 40% opacity */
.blue-bar-base {
  width: 100%;
  background: #1F498E;
  opacity: 0.4;
  /* Left edge rounded (outer), right edge flat (meets divider) */
  border-top-left-radius: 4.5px;
  border-bottom-left-radius: 4.5px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.pink-bar-base {
  width: 100%;
  background: #B638B4;
  opacity: 0.4;
  /* Left edge flat (meets divider), right edge rounded (outer) */
  border-top-right-radius: 4.5px;
  border-bottom-right-radius: 4.5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Active bars at 100% opacity */
.blue-bar-active {
  background: #1F498E;
  opacity: 1;
  z-index: 1;
  left: auto;
  right: 0;
  /* Left edge rounded (outer), right edge flat (meets divider) */
  border-top-left-radius: 4.5px;
  border-bottom-left-radius: 4.5px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.pink-bar-active {
  background: #B638B4;
  opacity: 1;
  z-index: 1;
  /* Left edge flat (meets divider), right edge rounded (outer) */
  border-top-right-radius: 4.5px;
  border-bottom-right-radius: 4.5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.meter-divider {
  width: 5px;
  height: 17px;
  background: var(--accent-highlight);
  flex-shrink: 0;
  border-radius: 2.5px;
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

.group input,
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
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23EAEAEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  padding-right: 2rem;
}

/* CustomDropdown right-justification */
.group :deep(.custom-dropdown) {
  flex: 1;
}

.group :deep(.dropdown-label) {
  text-align: right;
}

.group option {
  background: var(--color-background);
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  font-size: 0.8125rem;
}

.group input:focus,
.group select:focus {
  outline: none;
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  flex: 1;
}

.number-with-unit input {
  width: 60px;
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: center;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
  /* Aggressive iOS Safari number input suppression */
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  appearance: none !important;
}

.number-with-unit input::-webkit-textfield-decoration-container {
  display: none !important;
}

.number-with-unit input::-webkit-contacts-auto-fill-button,
.number-with-unit input::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.number-with-unit input:focus {
  outline: none;
}

/* Hide number input spinners */
.number-with-unit input::-webkit-inner-spin-button,
.number-with-unit input::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  margin: 0 !important;
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.number-with-unit input[type=number] {
  -moz-appearance: textfield !important;
  appearance: none !important;
  -webkit-appearance: none !important;
}

.number-with-unit span {
  font-size: 0.8125rem; /* 13px */
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
}

.draggable-value {
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: right;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
  min-width: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.draggable-value:hover {
  opacity: 0.8;
}

.draggable-value-inline {
  padding: 0 22px; /* Space for tap zones */
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: center;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.draggable-value-inline:hover {
  opacity: 0.8;
}

.steps-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.steps-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 80px;
}

.tap-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: opacity 0.2s;
}

.tap-zone-left {
  left: 0;
}

.tap-zone-right {
  right: 0;
}

.tap-zone:hover:not(.disabled) .tap-indicator {
  opacity: 0.6;
}

.tap-zone.disabled {
  opacity: 0.2;
  cursor: not-allowed;
  pointer-events: none;
}

.tap-indicator {
  font-size: 0.75rem; /* 12px */
  font-family: 'Roboto Mono';
  color: #EAEAEA;
  opacity: 0.4;
  transition: opacity 0.2s;
  user-select: none;
}

.value-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.duration-control-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.unit-label {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  cursor: default; /* Normal cursor on unit label */
  user-select: none; /* Prevent text selection */
}

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>
