<template>
  <div class="settings-leverpush" :class="`lever-${lever}`">
    <!-- Toggle and Profile Selection -->
    <div class="controls-row">
      <!-- Momentary/Latch Toggle (or REV/FWD for Pattern Selector) -->
      <button 
        class="toggle-btn" 
        @click="handleToggleClick"
        :title="toggleTooltip"
        :disabled="isResetMode"
      >
        <span :class="{ active: isResetMode || (isPatternSelector ? !isMomentary : isMomentary) }">{{ isPatternSelector ? 'REV' : 'MOM' }}</span>
        <span class="toggle-divider">|</span>
        <span :class="{ active: !isResetMode && (isPatternSelector ? isMomentary : !isMomentary) }">{{ isPatternSelector ? 'FWD' : 'LAT' }}</span>
      </button>

      <!-- Profile Text Selection (hidden for Pattern Selector) -->
      <div class="profile-selector" v-if="!isPatternSelector">
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('lin') }"
          :disabled="isResetMode"
          @click="selectProfile('lin')"
          title="Linear"
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          :disabled="isResetMode"
          @click="selectProfile('exp')"
          title="Exponential"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          :disabled="isResetMode"
          @click="selectProfile('log')"
          title="Logarithmic"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('pd') }"
          :disabled="isResetMode"
          @click="selectProfile('pd')"
          title="Peak & Decay"
        >
          P&D
        </button>
      </div>
    </div>

    <!-- Profile Visualization -->
    <div class="profile-visualization">
      <PatternSelector 
        v-if="isPatternSelector"
        :min="userMin"
        :max="userMax"
        :current="currentPattern"
      />
      <img 
        v-else
        :src="profileImage" 
        alt="Profile Graph" 
        class="profile-graph" 
      />
    </div>

    <!-- Level Meter -->
    <LevelMeter 
      :min="userMin" 
      :max="userMax" 
      :is-bipolar="false"
      :mode="isResetMode ? 'reset' : 'range'"
      :value="resetValue"
      :min-allowed="minRange"
      :max-allowed="maxRange"
      :step-size="isPatternSelector ? 1 : 5"
      @update:min="userMin = $event"
      @update:max="userMax = $event"
      @update:value="resetValue = $event"
    />

    <div class="inputs">
      <div class="group">
        <label>CATEGORY<span class="info-icon" @click.stop="showHelp('category')">i</span></label>
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
        <label>PARAMETER<span class="info-icon" @click.stop="showHelp('parameter')">i</span></label>
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
        <label :for="`push-min-${lever}`">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="constrainedMaxForMin"
          :step="isPatternSelector ? 1 : unipolarStepSize"
          :small-step="isPatternSelector ? 1 : unipolarStepSize"
          :large-step="isPatternSelector ? 1 : unipolarStepSize * 2"
          :disabled="isResetMode"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`push-max-${lever}`">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="constrainedMinForMax"
          :max="maxRange"
          :step="isPatternSelector ? 1 : unipolarStepSize"
          :small-step="isPatternSelector ? 1 : unipolarStepSize"
          :large-step="isPatternSelector ? 1 : unipolarStepSize * 2"
          :disabled="isResetMode"
        />
      </div>

      <!-- Duration control - visible only for Interpolated and Peak & Decay modes -->
      <template v-if="showTimingControls">
        <div class="duration-container">
          <!-- Duration Meter Visual (unipolar only - pink bar) -->
          <div class="duration-meter">
            <div 
              class="meter-bar-container"
              @mousedown="handleDurationBarMouseDown"
              @touchstart="handleDurationBarTouchStart"
            >
              <div class="meter-divider" :class="{ thick: !isMomentary }"></div>
              <div class="meter-bar-wrapper">
                <div class="meter-bar pink-bar-base"></div>
                <div 
                  class="meter-bar pink-bar-active"
                  :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                ></div>
                <div 
                  v-if="!isMomentary" 
                  class="latch-indicator-end"
                  :style="{ left: `${10 + ((duration - 100) / 1900) * 90}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="group">
            <label :for="`push-duration-${lever}`">DURATION</label>
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

      <!-- Reset Value control - visible only for Reset mode -->
      <template v-if="isResetMode">
        <div class="input-divider"></div>
        <div class="group">
          <label :for="`push-reset-value-${lever}`">RESET VALUE</label>
          <ValueControl
            v-model="resetValue"
            :min="5"
            :max="100"
            :step="5"
            :small-step="5"
            :large-step="10"
          />
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

    <!-- Help Modal -->
    <div v-if="showHelpModal" class="help-modal-overlay" @click="dismissHelp">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <h3>{{ helpContent.title }}</h3>
          <button class="close-btn" @click="dismissHelp">×</button>
        </div>
        <div class="help-modal-body">
          <p v-for="(para, idx) in helpContent.description" :key="idx">{{ para }}</p>
        </div>
        <div class="help-modal-footer">
          <button class="got-it-btn" @click="dismissHelp">Got it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import PatternSelector from './PatternSelector.vue'
import { useHaptics } from '../composables/useHaptics'
import { useUIPreferences } from '../composables/useUIPreferences'

const BASE_PATH = import.meta.env.BASE_URL || '/'

type ProfileType = 'lin' | 'exp' | 'log' | 'pd' | 'inc'

type LeverPushModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverPushModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
  interpolations: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverPushModel): void
  (e: 'profileChanged', profileName: string): void
  (e: 'behaviourChanged', behaviourName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Haptics
const { snap, isSupported } = useHaptics()

// UI Preferences
const { unipolarStepSize } = useUIPreferences()

// Function mode constants
const FUNCTION_MODE_INTERPOLATED = 0
const FUNCTION_MODE_PEAK_DECAY = 1
const FUNCTION_MODE_STATIC = 2
const FUNCTION_MODE_RESET = 3

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
// Special case: If functionMode is RESET, start with 'Reset' category
const initialCategory = computed(() => {
  if (model.value.functionMode === FUNCTION_MODE_RESET) {
    return 'Reset'
  }
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)

// Convert categories to dropdown options, adding divider and Reset at the end
const categoryOptions = computed(() => {
  const cats: Array<{ label: string; value: string; isDivider?: boolean }> = props.categories.map(cat => ({ label: cat, value: cat }))
  // Add divider after KB1 Expression (index 0)
  if (cats.length > 1 && cats[0]?.label === 'KB1 Expression') {
    cats.splice(1, 0, { label: '───', value: '___divider___', isDivider: true })
  }
  cats.push({ label: 'Reset', value: 'Reset' })
  return cats
})

// Parameter wheel picker state
const parameterPickerOpen = ref(false)
const parameterTriggerRef = ref<HTMLElement | null>(null)

// Cycle direction text state (for Pattern Selector fade animation)
const cycleDirectionText = ref('')
const cycleDirectionFading = ref(false)
let cycleFadeTimeoutId: ReturnType<typeof setTimeout> | null = null
let cycleClearTimeoutId: ReturnType<typeof setTimeout> | null = null

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
  
  // If in Reset mode, ensure category is 'Reset'
  if (model.value.functionMode === FUNCTION_MODE_RESET) {
    selectedCategory.value = 'Reset'
  } else {
    const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
    if (cat && cat !== selectedCategory.value) {
      selectedCategory.value = cat
    }
  }
  
  isUpdatingInternally.value = false
}, { immediate: true })

// Filter options by selected category
const filteredOptions = computed(() => {
  // Special case: Reset category shows all CC options
  if (selectedCategory.value === 'Reset') {
    return props.ccOptions
  }
  
  return props.ccOptions.filter(opt => opt.group === selectedCategory.value)
})

// Watch ccNumber to keep Category in sync and clamp KB1 Expression parameters
watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  // Don't override if we're in Reset mode
  if (model.value.functionMode === FUNCTION_MODE_RESET) return
  
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat && cat !== 'Reset') selectedCategory.value = cat
  
  // KB1 Expression parameters: Clamp to valid ranges
  if (cc === 200) {
    // Strum Speed: 5-100% displayed (maps to 360ms-4ms)
    // Store MIDI values in ascending order even though UI presents them inverted
    model.value = { ...model.value, minCCValue: 0, maxCCValue: 127 }
  } else if (cc === 201) {
    // Pattern Selector: 1-6 (discrete values)
    // Force STATIC mode to prevent ramping through all patterns
    // Default to FWD (forward) cycling: offsetTime = 0
    model.value = { ...model.value, functionMode: FUNCTION_MODE_STATIC, minCCValue: 0, maxCCValue: 127, offsetTime: 0 }
  } else if (cc === 202) {
    // Swing: 0-100%
    model.value = { ...model.value, minCCValue: 0, maxCCValue: 127 }
  } else if (cc === 203) {
    // Velocity Spread: 8-100%
    const min = Math.round((8 / 100) * 127)   // 8 -> ~10 MIDI
    const max = Math.round((100 / 100) * 127) // 100 -> 127 MIDI
    model.value = { ...model.value, minCCValue: min, maxCCValue: max }
  }
  
  isUpdatingInternally.value = false
})

// Watch selectedCategory to handle Reset mode and parameter selection
watch(selectedCategory, (cat) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  
  // Special case: Reset category sets functionMode to Reset
  if (cat === 'Reset') {
    model.value = { ...model.value, functionMode: FUNCTION_MODE_RESET }
    // Keep current parameter selection
    isUpdatingInternally.value = false
    return
  }
  
  // If we were in Reset mode, exit it when selecting another category
  if (model.value.functionMode === FUNCTION_MODE_RESET) {
    model.value = { ...model.value, functionMode: FUNCTION_MODE_INTERPOLATED }
  }
  
  const ok = props.ccMapByNumber.get(model.value.ccNumber)?.category === cat
  if (!ok) {
    const first = filteredOptions.value.find(o => o.value >= 0)
    if (first) model.value = { ...model.value, ccNumber: first.value }
  }
  isUpdatingInternally.value = false
})

// Watch functionMode to sync category when Reset mode is set externally
watch(() => model.value.functionMode, (mode) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  
  if (mode === FUNCTION_MODE_RESET && selectedCategory.value !== 'Reset') {
    selectedCategory.value = 'Reset'
  } else if (mode !== FUNCTION_MODE_RESET && selectedCategory.value === 'Reset') {
    // Exit Reset category if mode changed
    const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
    if (cat) selectedCategory.value = cat
    else selectedCategory.value = props.categories[0] || 'Global'
  }
  isUpdatingInternally.value = false
})

// Momentary/Latch Toggle (using offset time: 0 = momentary, >0 = latched)
const isMomentary = computed(() => model.value.offsetTime === 0)

function handleToggleClick() {
  if (isSupported.value) snap()
  
  if (isMomentary.value) {
    // Switch to latched/reverse - set offsetTime to match onsetTime
    // If onsetTime is 0, use a sensible default (100ms)
    const timeValue = model.value.onsetTime || 100
    model.value = { ...model.value, onsetTime: timeValue, offsetTime: timeValue }
    if (isPatternSelector.value) {
      emit('behaviourChanged', 'Cycle Reverse')
    } else {
      emit('behaviourChanged', 'Latched')
    }
  } else {
    // Switch to momentary/forward - set offsetTime to 0
    model.value = { ...model.value, offsetTime: 0 }
    if (isPatternSelector.value) {
      emit('behaviourChanged', 'Cycle Forward')
    } else {
      emit('behaviourChanged', 'Momentary')
    }
  }
}

// Profile selection 
const isProfileActive = (profile: ProfileType) => {
  if (profile === 'inc') {
    return model.value.functionMode === 2 // STATIC
  } else if (profile === 'pd') {
    return model.value.functionMode === 1 // PEAK_DECAY
  } else if (model.value.functionMode === 0) { // INTERPOLATED
    if (model.value.onsetType === 1) return profile === 'exp'
    if (model.value.onsetType === 2) return profile === 'log'
    return profile === 'lin'
  }
  return false
}

// Active profile name (full description)
const activeProfileName = computed(() => {
  if (model.value.functionMode === 3) {
    return 'Reset'
  } else if (model.value.functionMode === 2) {
    return 'Static'
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
    model.value = { ...model.value, functionMode: 2 } // STATIC
  } else if (profile === 'pd') {
    model.value = { ...model.value, functionMode: 1 } // PEAK_DECAY
  } else {
    // Set onsetType and offsetType based on profile
    if (profile === 'exp') {
      model.value = {
        ...model.value,
        functionMode: 0,  // INTERPOLATED
        onsetType: 1,
        offsetType: 1
      }
    } else if (profile === 'log') {
      model.value = {
        ...model.value,
        functionMode: 0,  // INTERPOLATED
        onsetType: 2,
        offsetType: 2
      }
    } else {
      // lin
      model.value = {
        ...model.value,
        functionMode: 0,  // INTERPOLATED
        onsetType: 0,
        offsetType: 0
      }
    }
  }
  
  // Emit profile change event
  emit('profileChanged', activeProfileName.value)
}

// Profile visualization
const profileImage = computed(() => {
  let profile = 'lin' // default
  
  if (model.value.functionMode === 3) {
    // Reset mode - show animated breathing diamond
    return `${BASE_PATH}lever_profiles/reset_animated.svg`
  } else if (model.value.functionMode === 2) {
    profile = 'inc'
  } else if (model.value.functionMode === 1) {
    profile = 'pd'
  } else if (model.value.functionMode === 0) {
    // Interpolated mode - check type
    if (model.value.onsetType === 1) profile = 'exp'
    else if (model.value.onsetType === 2) profile = 'log'
    else profile = 'lin'
  }
  
  // Use animated versions for lin, exp, log, and pd
  // In momentary mode (offsetTime === 0), use back-and-forth animation (press/release)
  // In latched mode (offsetTime > 0), use one-way animation (toggle on/off states)
  const isMomentary = model.value.offsetTime === 0
  let animated = ''
  if (profile === 'lin' || profile === 'exp' || profile === 'log' || profile === 'pd') {
    animated = isMomentary ? '_latched_animated' : '_animated'
  }
  
  // Push profile SVG files use _p suffix
  return `${BASE_PATH}lever_profiles/${profile}_p${animated}.svg`
})

// Computed properties to determine which controls to show
const isResetMode = computed(() => model.value.functionMode === FUNCTION_MODE_RESET)
const isPatternSelector = computed(() => model.value.ccNumber === 201)

// Watch for Pattern Selector activation to emit initial direction state
watch(isPatternSelector, (isActive) => {
  if (isActive) {
    // Emit current direction when Pattern Selector becomes active
    nextTick(() => {
      emit('behaviourChanged', isMomentary.value ? 'Cycle Forward' : 'Cycle Reverse')
    })
  }
}, { immediate: true })

// Toggle tooltip (depends on isPatternSelector)
const toggleTooltip = computed(() => {
  if (isPatternSelector.value) {
    return isMomentary.value ? 'Switch to Reverse Cycling' : 'Switch to Forward Cycling'
  }
  return isMomentary.value ? 'Switch to Latched' : 'Switch to Momentary'
})

// Watch for cycle direction changes in Pattern Selector mode and trigger fade animation
watch([isMomentary, isPatternSelector], ([momentary, patternSelector]) => {
  if (!patternSelector) {
    // Clear any pending timeouts if not in Pattern Selector mode
    if (cycleFadeTimeoutId) clearTimeout(cycleFadeTimeoutId)
    if (cycleClearTimeoutId) clearTimeout(cycleClearTimeoutId)
    cycleDirectionText.value = ''
    cycleDirectionFading.value = false
    return
  }
  
  // Clear any pending timeouts
  if (cycleFadeTimeoutId) clearTimeout(cycleFadeTimeoutId)
  if (cycleClearTimeoutId) clearTimeout(cycleClearTimeoutId)
  
  // Set the text and reset fading
  cycleDirectionText.value = momentary ? 'Cycle Forward' : 'Cycle Reverse'
  cycleDirectionFading.value = false
  
  // Start fade after 500ms
  cycleFadeTimeoutId = setTimeout(() => {
    cycleDirectionFading.value = true
    cycleFadeTimeoutId = null
  }, 500)
  
  // Clear text after 2500ms
  cycleClearTimeoutId = setTimeout(() => {
    cycleDirectionText.value = ''
    cycleDirectionFading.value = false
    cycleClearTimeoutId = null
  }, 2500)
}, { immediate: true })

const showTimingControls = computed(() => {
  // Hide timing controls for Pattern Selector
  if (isPatternSelector.value) return false
  return model.value.functionMode === FUNCTION_MODE_INTERPOLATED || model.value.functionMode === FUNCTION_MODE_PEAK_DECAY
})

// Min/max range (always unipolar for Press)
// KB1 Expression parameters have hardware-enforced minimum values
const minRange = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 200) return 5  // Strum Speed: 5-100% (perceived range, maps to 4-360ms)
  if (cc === 201) return 1   // Pattern Selector: 1-6
  if (cc === 202) return 50  // Swing: 50-100%
  if (cc === 203) return 8   // Velocity Spread: 8-100%
  return 0  // Default minimum
})

const maxRange = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 201) return 6   // Pattern Selector: 1-6 (discrete)
  return 100  // Default maximum
})

// Buffer between min and max to prevent overlap
// Smaller buffer for Pattern Selector (1-6 range) vs regular params (0-100 range)
const MIN_MAX_BUFFER = computed(() => {
  return model.value.ccNumber === 201 ? 1 : 5
})

// Constrained ranges to prevent min/max overlap
const constrainedMaxForMin = computed(() => {
  // userMin can't exceed userMax - buffer
  return Math.min(maxRange.value, userMax.value - MIN_MAX_BUFFER.value)
})

const constrainedMinForMax = computed(() => {
  // userMax can't go below userMin + buffer
  return Math.max(minRange.value, userMin.value + MIN_MAX_BUFFER.value)
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

// Special conversion for Strum Speed (CC 200): higher % = faster (lower ms)
// User sees 5-100% range (better UX), maps to 4-360ms: 100%→4ms, 5%→360ms
// Store MIDI in normal ascending order: low MIDI = slow, high MIDI = fast
function speedPercentToMidi(percent: number): number {
  // Map 5-100% to MIDI 0-127 (normal order: higher MIDI = faster)
  return Math.round(127 * (percent - 5) / 95)
}

function midiToSpeedPercent(midiValue: number): number {
  // Map MIDI 0-127 to 5-100%
  return Math.round(5 + (midiValue / 127) * 95)
}

// Special conversion for Swing (CC 202): UI 50-100% maps to firmware 0-100
function swingPercentToMidi(percent: number): number {
  // Map 50-100% to MIDI 0-127
  return Math.round(127 * (percent - 50) / 50)
}

function midiToSwingPercent(midiValue: number): number {
  // Map MIDI 0-127 to 50-100%
  return Math.round(50 + (midiValue / 127) * 50)
}

// User-facing Min value (0-100 for normal params, 1-7 for pattern selector)
const userMin = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.minCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.minCCValue)
    } else if (model.value.ccNumber === 202) {
      value = midiToSwingPercent(model.value.minCCValue)
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
    // Snap to step increments before converting to MIDI
    let snappedValue = userValue
    if (model.value.ccNumber !== 201) {
      snappedValue = Math.round(userValue / unipolarStepSize.value) * unipolarStepSize.value
    }
    
    if (model.value.ccNumber === 200) {
      model.value = { ...model.value, minCCValue: speedPercentToMidi(snappedValue) }
    } else if (model.value.ccNumber === 201) {
      model.value = { ...model.value, minCCValue: patternToMidi(snappedValue) }
    } else if (model.value.ccNumber === 202) {
      model.value = { ...model.value, minCCValue: swingPercentToMidi(snappedValue) }
    } else {
      model.value = { ...model.value, minCCValue: unipolarToMidi(snappedValue) }
    }
  }
})

// User-facing Max value (0-100 for normal params, 1-7 for pattern selector)
const userMax = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.maxCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.maxCCValue)
    } else if (model.value.ccNumber === 202) {
      value = midiToSwingPercent(model.value.maxCCValue)
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
    // Snap to step increments before converting to MIDI
    let snappedValue = userValue
    if (model.value.ccNumber !== 201) {
      snappedValue = Math.round(userValue / unipolarStepSize.value) * unipolarStepSize.value
    }
    
    if (model.value.ccNumber === 200) {
      model.value = { ...model.value, maxCCValue: speedPercentToMidi(snappedValue) }
    } else if (model.value.ccNumber === 201) {
      model.value = { ...model.value, maxCCValue: patternToMidi(snappedValue) }
    } else if (model.value.ccNumber === 202) {
      model.value = { ...model.value, maxCCValue: swingPercentToMidi(snappedValue) }
    } else {
      model.value = { ...model.value, maxCCValue: unipolarToMidi(snappedValue) }
    }
  }
})

// Reset Value (5-100 in increments of 5, default 70, or 1-7 for pattern selector)
// In Reset mode, minCCValue stores the reset value, maxCCValue is set to the same
const resetValue = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToSpeedPercent(model.value.minCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.minCCValue)
    } else if (model.value.ccNumber === 202) {
      value = midiToSwingPercent(model.value.minCCValue)
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
    // Snap to step increments before converting to MIDI
    let snappedValue = userValue
    if (model.value.ccNumber !== 201) {
      snappedValue = Math.round(userValue / unipolarStepSize.value) * unipolarStepSize.value
    }
    
    if (model.value.ccNumber === 200) {
      const midiValue = speedPercentToMidi(snappedValue)
      model.value = {
        ...model.value,
        minCCValue: midiValue,
        maxCCValue: midiValue
      }
    } else if (model.value.ccNumber === 201) {
      const midiValue = patternToMidi(snappedValue)
      model.value = {
        ...model.value,
        minCCValue: midiValue,
        maxCCValue: midiValue
      }
    } else if (model.value.ccNumber === 202) {
      const midiValue = swingPercentToMidi(snappedValue)
      model.value = {
        ...model.value,
        minCCValue: midiValue,
        maxCCValue: midiValue
      }
    } else {
      const midiValue = unipolarToMidi(snappedValue)
      model.value = {
        ...model.value,
        minCCValue: midiValue,
        maxCCValue: midiValue
      }
    }
  }
})

// Current pattern for cycling display (pattern selector in STATIC mode)
// Shows which pattern is currently set (defaults to min on first load)
const currentPattern = computed(() => {
  if (model.value.ccNumber !== 201) return undefined
  // For pattern selector, show min as the starting pattern
  return userMin.value
})

// Computed property to gang both onset and offset times as "Duration"
const duration = computed({
  get: () => model.value.onsetTime,
  set: (value: number) => {
    // Only update offsetTime if we're in latched mode (offsetTime > 0)
    if (model.value.offsetTime > 0) {
      model.value = {
        ...model.value,
        onsetTime: value,
        offsetTime: value
      }
    } else {
      model.value = { ...model.value, onsetTime: value }
    }
  }
})

// Duration bar direct interaction handlers
const updateDurationFromPosition = (clientX: number, rect: DOMRect) => {
  // Subtract the divider width (4px) from the calculation
  const dividerWidth = 4
  const wrapperWidth = rect.width - dividerWidth
  const relativeX = clientX - rect.left - dividerWidth
  
  // Get percentage of wrapper (0-100)
  let percentage = Math.max(0, Math.min(100, (relativeX / wrapperWidth) * 100))
  
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

// Help system
const showHelpModal = ref(false)
const helpContent = ref({ title: '', description: [''] })

const helpTexts = {
  category: {
    title: 'Category',
    description: [
      'Select a category to filter the available parameters that this lever will control.'
    ]
  },
  parameter: {
    title: 'Parameter',
    description: [
      'Parameters are specific MIDI CCs that this lever will control.'
    ]
  }
}

function showHelp(type: keyof typeof helpTexts) {
  helpContent.value = helpTexts[type]
  showHelpModal.value = true
  if (isSupported.value) snap()
}

function dismissHelp() {
  showHelpModal.value = false
  if (isSupported.value) snap()
}

</script>

<style scoped>
.settings-leverpush {
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible; /* Allow dropdowns to extend beyond bounds */
  position: relative; /* For popup positioning */
}

@media (max-width: 768px) {
  .settings-leverpush {
    padding: 0.75rem;
  }
}

.controls-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap;
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

.toggle-btn:hover:not(:disabled) {
  background: rgba(106, 104, 83, 0.6);
  border-color: rgba(106, 104, 83, 0.7);
}

.toggle-btn:active:not(:disabled) {
  background: rgba(106, 104, 83, 0.8);
  border-color: rgba(106, 104, 83, 0.9);
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(106, 104, 83, 0.2);
  border-color: rgba(106, 104, 83, 0.25);
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
  gap: 1.5rem;
  align-items: center;
  flex-shrink: 1;
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

.profile-btn:hover:not(:disabled) {
  color: #CDCDCD;
}

.profile-btn:disabled {
  color: #4A4A4A;
  cursor: not-allowed;
  opacity: 0.5;
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

.cycle-direction {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 0.5rem 0;
}

.cycle-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #F9AC20;
  font-family: 'Roboto Mono';
  text-align: center;
  opacity: 1;
  transition: opacity 2s ease-out;
}

.cycle-text.fading {
  opacity: 0;
}

.profile-visualization {
  margin: 0.5rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
}

.profile-visualization img {
  width: 100%;
  height: auto;
  display: block;
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
  overflow: visible;
}

.meter-bar {
  height: 9px;
  position: absolute;
  top: 0;
  left: 0;
}

/* Base bar at 40% opacity */
.pink-bar-base {
  width: 100%;
  background: #1F498E;
  opacity: 0.4;
  /* Left edge flat (meets divider), right edge rounded */
  border-top-right-radius: 4.5px;
  border-bottom-right-radius: 4.5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Active bar at 100% opacity */
.pink-bar-active {
  background: #1F498E;
  opacity: 1;
  z-index: 1;
  /* Left edge flat (meets divider), right edge rounded */
  border-top-right-radius: 4.5px;
  border-bottom-right-radius: 4.5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.meter-divider {
  width: 4px;
  height: 17px;
  background: var(--accent-highlight);
  flex-shrink: 0;
  border-radius: 2px;
}

.meter-divider.thick {
  /* No longer needed - all dividers are now 5px */
}

.latch-indicator {
  width: 4px;
  height: 17px;
  background: var(--accent-highlight);
  flex-shrink: 0;
  margin-left: 4px;
  border-radius: 2px;
}

.latch-indicator-end {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 17px;
  background: var(--accent-highlight);
  z-index: 2;
  border-radius: 2px;
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

.value-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.stepper-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  cursor: pointer;
  font-size: 0.625rem; /* 10px - match dropdown triangle */
  font-family: 'Roboto Mono';
  transition: opacity 0.2s;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
  text-align: right;
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

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}

/* CustomDropdown right-justification */
.group :deep(.custom-dropdown) {
  flex: 1;
}

.group :deep(.dropdown-label) {
  text-align: right;
}

/* Help System */
.info-icon {
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid #999;
  border-radius: 50%;
  font-size: 11px;
  margin-left: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.info-icon:hover {
  border-color: #0DC988;
  color: #0DC988;
}

.help-modal-overlay {
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
}

.help-modal {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.help-modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.help-modal-header .close-btn {
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
}

.help-modal-header .close-btn:hover {
  color: #0DC988;
}

.help-modal-body {
  padding: 1rem;
  line-height: 1.6;
}

.help-modal-body p {
  margin: 0 0 1rem 0;
}

.help-modal-body p:last-child {
  margin-bottom: 0;
}

.help-modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .got-it-btn {
  background: #0DC988;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
  transition: opacity 0.2s;
}

.help-modal-footer .got-it-btn:hover {
  opacity: 0.9;
}
</style>