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
      <div class="profile-selector" :class="{ disabled: isIncrementalOnly }">
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('lin') }"
          @click="selectProfile('lin')"
          title="Linear"
          :disabled="isIncrementalOnly"
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          @click="selectProfile('exp')"
          title="Exponential"
          :disabled="isIncrementalOnly"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          @click="selectProfile('log')"
          title="Logarithmic"
          :disabled="isIncrementalOnly"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('pd') }"
          @click="selectProfile('pd')"
          title="Peak & Decay"
          :disabled="isIncrementalOnly"
        >
          P&D
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('inc') }"
          @click="selectProfile('inc')"
          :title="isIncrementalOnly ? 'This parameter uses incremental mode for immediate response' : 'Incremental'"
        >
          Inc
        </button>
      </div>
    </div>

    <!-- Profile Visualization -->
    <div class="profile-visualization">
      <IncrementalProfile 
        v-if="isIncrementalMode"
        :key="`inc-${model.ccNumber}-${visualStepsCount}`"
        :steps="visualStepsCount"
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
        <label>
          CATEGORY
          <span class="info-icon" @click.stop="showHelp('category')" title="Show help">i</span>
        </label>
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
        <label>
          PARAMETER
          <span class="info-icon" @click.stop="showHelp('parameter')" title="Show help">i</span>
        </label>
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
          :max="constrainedMaxForMin"
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
          :min="constrainedMinForMax"
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
                :class="{ disabled: isStepsAtMin || isDiscreteParameter }"
                @click="decreaseSteps"
                title="Previous step value"
              >
                <span class="tap-indicator">−</span>
              </div>
              <div 
                class="draggable-value-inline"
                :class="{ disabled: isDiscreteParameter }"
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
                :class="{ disabled: isStepsAtMax || isDiscreteParameter }"
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

    <!-- Help Modal -->
    <div v-if="showHelpModal" class="help-modal-overlay" @click.stop="dismissHelp">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <h3>{{ helpContent.title }}</h3>
          <button class="close-btn" @click="dismissHelp">×</button>
        </div>
        <div class="help-modal-body">
          <p v-for="(paragraph, index) in helpContent.description" :key="index">{{ paragraph }}</p>
        </div>
        <div class="help-modal-footer">
          <button class="btn-primary" @click="dismissHelp">Got it</button>
        </div>
      </div>
    </div>
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
import { useUIPreferences } from '../composables/useUIPreferences'

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
  strumSpeed?: number
  playMode?: number  // 0 = Scale mode, 1 = Chord mode
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

// UI Preferences
const { unipolarStepSize } = useUIPreferences()

// Constants
const BASE_PATH = '/KB1-config'

// Help modal system
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
}

function dismissHelp() {
  showHelpModal.value = false
}

// Check if current parameter is KB1 Expression (unipolar only)
const isKB1Expression = computed(() => {
  const cc = model.value.ccNumber
  return cc === 200 || cc === 201 || cc === 202 || cc === 203 || cc === 204 || cc === 205
})

// Check if current parameter requires incremental mode (Strum Speed, Scale Type, Chord Type)
const isIncrementalOnly = computed(() => {
  const cc = model.value.ccNumber
  return cc === 200 || cc === 204 || cc === 205
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
  
  const newMode = model.value.valueMode === 0 ? 1 : 0
  model.value = { ...model.value, valueMode: newMode }
  
  // Emit the new mode name for parent to display
  const newModeName = newMode === 0 ? 'Unipolar' : 'Bipolar'
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
const selectProfile = (profile: ProfileType) => {
  if (isSupported.value) snap()
  
  // Calculate profile name for emission BEFORE updating model
  let profileName = 'Linear'
  if (profile === 'inc') {
    model.value = { ...model.value, functionMode: 2 }
    profileName = 'Incremental'
  } else if (profile === 'pd') {
    model.value = { ...model.value, functionMode: 1 }
    profileName = 'Peak & Decay'
  } else {
    // Set onsetType and offsetType based on profile
    if (profile === 'exp') {
      model.value = { ...model.value, functionMode: 0, onsetType: 1, offsetType: 1 }
      profileName = 'Exponential'
    } else if (profile === 'log') {
      model.value = { ...model.value, functionMode: 0, onsetType: 2, offsetType: 2 }
      profileName = 'Logarithmic'
    } else {
      // lin
      model.value = { ...model.value, functionMode: 0, onsetType: 0, offsetType: 0 }
      profileName = 'Linear'
    }
  }
  
  // Emit profile change event with calculated name
  emit('profileChanged', profileName)
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

// Filter options based on category and context
const filteredOptions = computed(() => {
  return props.ccOptions.filter(opt => {
    // Filter by selected category
    if (opt.group !== selectedCategory.value) return false
    
    // Pattern Selector (201) excluded from levers - discrete values better suited for press controls
    if (opt.value === 201) return false
    
    // Context-aware KB1 Expression filtering based on play mode
    if (props.playMode !== undefined && opt.group === 'KB1 Expression') {
      const isScaleMode = props.playMode === 0
      const isChordMode = props.playMode === 1
      
      if (isScaleMode) {
        // Scale mode: ONLY Scale Type (204) available
        return opt.value === 204
      }
      
      if (isChordMode) {
        // Chord mode: All EXCEPT Scale Type (204) available
        return opt.value !== 204
      }
    }
    
    return true
  })
})

// Watch ccNumber to keep Category in sync and clamp KB1 Expression parameters
watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat) selectedCategory.value = cat
  
  // KB1 Expression parameters: Force specific modes and clamp to valid ranges
  if (cc === 200) {
    // Strum Speed: Unipolar 0-127, INCREMENTAL only for immediate tempo response
    model.value = {
      ...model.value,
      valueMode: VALUE_MODE_UNIPOLAR,
      functionMode: 2, // Force INCREMENTAL
      minCCValue: 0,
      maxCCValue: 127
    }
  } else if (cc === 202) {
    // Swing: 50-100% (UI) maps to 0-100 (firmware)
    model.value = {
      ...model.value,
      valueMode: VALUE_MODE_UNIPOLAR,
      minCCValue: 0,    // 50% UI
      maxCCValue: 127   // 100% UI
    }
  } else if (cc === 203) {
    // Velocity Spread: 10-100%
    const min = Math.round((10 / 100) * 127)   // 10 -> ~13 MIDI
    const max = Math.round((100 / 100) * 127) // 100 -> 127 MIDI
    model.value = {
      ...model.value,
      valueMode: VALUE_MODE_UNIPOLAR,
      minCCValue: min,
      maxCCValue: max
    }
  } else if (cc === 204) {
    // Scale Type: 0-20, INCREMENTAL only for discrete selection
    const min = 0
    const max = 20
    model.value = {
      ...model.value,
      valueMode: VALUE_MODE_UNIPOLAR,
      functionMode: 2, // Force INCREMENTAL
      minCCValue: Math.round((min / max) * 127),
      maxCCValue: 127
    }
  } else if (cc === 205) {
    // Chord Type: 0-14, INCREMENTAL only for discrete selection
    const min = 0
    const max = 14
    model.value = {
      ...model.value,
      valueMode: VALUE_MODE_UNIPOLAR,
      functionMode: 2, // Force INCREMENTAL
      minCCValue: Math.round((min / max) * 127),
      maxCCValue: 127
    }
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
    if (first) model.value = { ...model.value, ccNumber: first.value }
  }
  isUpdatingInternally.value = false
})

// Computed properties for mode detection
const isIncrementalMode = computed(() => model.value.functionMode === 2)

// Check if current parameter is a discrete type (Pattern, Scale Type, Chord Type)
const isDiscreteParameter = computed(() => {
  const cc = model.value.ccNumber
  return cc === 201 || cc === 204 || cc === 205
})

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
  6: 5,
  // Invalid values (like 1 from Interpolated mode) map to 5% (firmware 6)
  1: 5,
  2: 5,
  3: 5,
  4: 5,
  5: 5
}

// Direct access to firmware stepSize with % display conversion
// For discrete parameters, always show and enforce step size of 1
const stepsValue = computed<number>({
  get: (): number => {
    const cc = model.value?.ccNumber
    // Discrete parameters: always show "1"
    if (cc === 201 || cc === 204 || cc === 205) {
      return 1
    }
    // Get stepSize, ensure it's at least 6 (5% display) for Incremental mode
    const stepSize = model.value?.stepSize
    const validStepSize = (stepSize && stepSize > 0) ? stepSize : 6
    // Map to display %, defaulting to 5% for invalid values
    return stepsFirmwareToDisplay[validStepSize] ?? 5
  },
  set: (displayPercent: number) => {
    const cc = model.value?.ccNumber
    // Discrete parameters: ignore attempts to change step size
    if (cc === 201 || cc === 204 || cc === 205) {
      return
    }
    model.value = { ...model.value, stepSize: stepsDisplayToFirmware[displayPercent] ?? 6 }
  }
})

// Visual steps for IncrementalProfile display
// For discrete parameters, show actual count; for others, use firmware step mapping
const visualStepsCount = computed(() => {
  const cc = model.value?.ccNumber
  
  // Discrete parameters: show exact number of values
  if (cc === 201) return 6   // Pattern Selector: 1-6 (6 values)
  if (cc === 204) return 21  // Scale Type: 0-20 (21 values)
  if (cc === 205) return 15  // Chord Type: 0-14 (15 values)
  
  // For other parameters, use firmware step size directly
  // (IncrementalProfile.vue will map minimum 6 (5% display)
  const stepSize = model.value?.stepSize
  return (stepSize && stepSize >= 6) ? stepSize : 6
  return (stepSize && stepSize > 0) ? stepSize : 12
})

// Value mode constants
const VALUE_MODE_UNIPOLAR = 0
const VALUE_MODE_BIPOLAR = 1

// Determine min/max range based on polarity and KB1 Expression parameters
const minRange = computed(() => {
  const cc = model.value.ccNumber
  
  // CC 200 (Strum Speed): Display with direction sign
  if (cc === 200) {
    const isReverse = (props.strumSpeed ?? 5) < 0
    return isReverse ? -360 : 5
  }
  
  // Special limits for specific parameters
  if (cc === 128) {
    // Velocity: lock minimum at -80% (MIDI 13)
    return model.value.valueMode === VALUE_MODE_BIPOLAR ? -80 : 13
  }
  
  if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
    return -100
  }
  
  // KB1 Expression parameters have hardware-enforced minimum values
  if (cc === 201) return 1   // Pattern Selector: 1-6
  if (cc === 202) return 50  // Swing: 50-100%
  if (cc === 203) return 10   // Velocity Spread: 10-100%
  if (cc === 204) return 0    // Scale Type: 0-20
  if (cc === 205) return 0    // Chord Type: 0-14
  
  return 0  // Default unipolar minimum
})

const maxRange = computed(() => {
  const cc = model.value.ccNumber
  
  // CC 200 (Strum Speed): Display with direction sign
  if (cc === 200) {
    const isReverse = (props.strumSpeed ?? 5) < 0
    return isReverse ? -5 : 360
  }
  
  if (cc === 201) return 6   // Pattern Selector: 1-6 (discrete)
  if (cc === 204) return 20  // Scale Type: 0-20 (21 discrete types)
  if (cc === 205) return 14  // Chord Type: 0-14 (15 discrete types)
  return 100  // Default maximum
})

// Buffer between min and max to prevent overlap
// Discrete parameters (201, 204, 205) use smaller buffer
const MIN_MAX_BUFFER = computed(() => {
  const cc = model.value.ccNumber
  if (cc === 201 || cc === 204 || cc === 205) {
    return 1  // Discrete parameters: minimum 1-step buffer
  }
  return 5  // Default: 5 units buffer
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

// Step size for MIN/MAX controls in incremental mode
const minMaxStepSize = computed(() => {
  const cc = model.value.ccNumber
  
  // Discrete parameters: allow single-step precision for exact selection
  if (cc === 201 || cc === 204 || cc === 205) {
    return 1
  }
  
  // In incremental mode, match the STEPS percentage (5%, 10%, 15%, 25%)
  if (isIncrementalMode.value) {
    return stepsValue.value
  }
  
  // In non-incremental mode, use step size that avoids MIDI precision issues
  // Bipolar: -100 to +100 (200 range) → 0-127 MIDI
  // Each MIDI value ≈ 1.57 user units, so use step=5 to avoid rounding collisions
  // Unipolar: 0 to 100 (100 range) → 0-127 MIDI (finer resolution)
  // Use user preference (1 or 5) for unipolar mode
  return model.value.valueMode === VALUE_MODE_BIPOLAR ? 5 : unipolarStepSize.value
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

// Special conversion for Swing (CC 202): UI 50-100% maps to firmware 0-100
function swingPercentToMidi(percent: number): number {
  // Map 50-100% to MIDI 0-127
  return Math.round(127 * (percent - 50) / 50)
}

function midiToSwingPercent(midiValue: number): number {
  // Map MIDI 0-127 to 50-100%
  return Math.round(50 + (midiValue / 127) * 50)
}

// Special conversion for Strum Speed (CC 200): Display ±5-360ms, store MIDI 0-127
function strumSpeedToMidi(speedMs: number): number {
  // Map magnitude 5-360ms to MIDI 0-127 (sign is visual only, not stored)
  return Math.round((Math.abs(speedMs) - 5) / 355 * 127)
}

function midiToStrumSpeed(midiValue: number): number {
  // Map MIDI 0-127 to magnitude 5-360ms
  const magnitude = Math.round(5 + (midiValue / 127) * 355)
  // Apply sign based on current strum speed direction
  const isReverse = (props.strumSpeed ?? 5) < 0
  return isReverse ? -magnitude : magnitude
}

// Special conversion for Scale Type (CC 204): 0-20 discrete values
function scaleTypeToMidi(scaleType: number): number {
  // Map 0-20 to MIDI 0-127
  return Math.round((scaleType / 20) * 127)
}

function midiToScaleType(midiValue: number): number {
  // Map MIDI 0-127 to 0-20
  return Math.round((midiValue / 127) * 20)
}

// Special conversion for Chord Type (CC 205): 0-14 discrete values
function chordTypeToMidi(chordType: number): number {
  // Map 0-14 to MIDI 0-127
  return Math.round((chordType / 14) * 127)
}

function midiToChordType(midiValue: number): number {
  // Map MIDI 0-127 to 0-14
  return Math.round((midiValue / 127) * 14)
}

// User-facing Min value (0-100 or -100 to +100, or special ranges)
const userMin = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToStrumSpeed(model.value.minCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.minCCValue)
    } else if (model.value.ccNumber === 202) {
      value = midiToSwingPercent(model.value.minCCValue)
    } else if (model.value.ccNumber === 204) {
      value = midiToScaleType(model.value.minCCValue)
    } else if (model.value.ccNumber === 205) {
      value = midiToChordType(model.value.minCCValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      value = midiToBipolar(model.value.minCCValue)
    } else {
      value = midiToUnipolar(model.value.minCCValue)
    }
    // Snap displayed value to current step size for consistency
    const step = minMaxStepSize.value
    return Math.round(value / step) * step
  },
  set: (userValue: number) => {
    const snappedValue = snapToStepIncrement(userValue)
    if (model.value.ccNumber === 200) {
      model.value = { ...model.value, minCCValue: strumSpeedToMidi(snappedValue) }
    } else if (model.value.ccNumber === 201) {
      model.value = { ...model.value, minCCValue: patternToMidi(snappedValue) }
    } else if (model.value.ccNumber === 202) {
      model.value = { ...model.value, minCCValue: swingPercentToMidi(snappedValue) }
    } else if (model.value.ccNumber === 204) {
      model.value = { ...model.value, minCCValue: scaleTypeToMidi(snappedValue) }
    } else if (model.value.ccNumber === 205) {
      model.value = { ...model.value, minCCValue: chordTypeToMidi(snappedValue) }
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value = { ...model.value, minCCValue: bipolarToMidi(snappedValue) }
    } else {
      model.value = { ...model.value, minCCValue: unipolarToMidi(snappedValue) }
    }
  }
})

// User-facing Max value (0-100 or -100 to +100, or special ranges)
const userMax = computed({
  get: () => {
    let value: number
    if (model.value.ccNumber === 200) {
      value = midiToStrumSpeed(model.value.maxCCValue)
    } else if (model.value.ccNumber === 201) {
      value = midiToPattern(model.value.maxCCValue)
    } else if (model.value.ccNumber === 202) {
      value = midiToSwingPercent(model.value.maxCCValue)
    } else if (model.value.ccNumber === 204) {
      value = midiToScaleType(model.value.maxCCValue)
    } else if (model.value.ccNumber === 205) {
      value = midiToChordType(model.value.maxCCValue)
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      value = midiToBipolar(model.value.maxCCValue)
    } else {
      value = midiToUnipolar(model.value.maxCCValue)
    }
    // Snap displayed value to current step size for consistency
    const step = minMaxStepSize.value
    return Math.round(value / step) * step
  },
  set: (userValue: number) => {
    const snappedValue = snapToStepIncrement(userValue)
    if (model.value.ccNumber === 200) {
      model.value = { ...model.value, maxCCValue: strumSpeedToMidi(snappedValue) }
    } else if (model.value.ccNumber === 201) {
      model.value = { ...model.value, maxCCValue: patternToMidi(snappedValue) }
    } else if (model.value.ccNumber === 202) {
      model.value = { ...model.value, maxCCValue: swingPercentToMidi(snappedValue) }
    } else if (model.value.ccNumber === 204) {
      model.value = { ...model.value, maxCCValue: scaleTypeToMidi(snappedValue) }
    } else if (model.value.ccNumber === 205) {
      model.value = { ...model.value, maxCCValue: chordTypeToMidi(snappedValue) }
    } else if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value = { ...model.value, maxCCValue: bipolarToMidi(snappedValue) }
    } else {
      model.value = { ...model.value, maxCCValue: unipolarToMidi(snappedValue) }
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
    model.value = {
      ...model.value,
      minCCValue: currentMinMidi,
      maxCCValue: currentMaxMidi
    }
  } else if (newMode === VALUE_MODE_UNIPOLAR && oldMode === VALUE_MODE_BIPOLAR) {
    // Switching from Bipolar to Unipolar
    // Map 0 → 50 (center), clamp negatives to 0
    const currentMinMidi = model.value.minCCValue
    const currentMaxMidi = model.value.maxCCValue
    
    // Keep MIDI values the same, they'll just display differently
    model.value = {
      ...model.value,
      minCCValue: currentMinMidi,
      maxCCValue: currentMaxMidi
    }
  }
})

// Computed property to gang attack and decay times together as "Duration"
const duration = computed({
  get: () => model.value.onsetTime,
  set: (value: number) => {
    model.value = {
      ...model.value,
      onsetTime: value,
      offsetTime: value
    }
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
  if (isDiscreteParameter.value) return  // Discrete parameters can't change step size
  event.preventDefault()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  const delta = event.deltaY > 0 ? -1 : 1
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, currentIndex + delta))
  stepsValue.value = stepsOptions[newIndex]!
}

// Mouse drag for steps
function handleStepsMouseDown(event: MouseEvent) {
  if (isDiscreteParameter.value) return  // Discrete parameters can't change step size
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
  if (isDiscreteParameter.value) return  // Discrete parameters can't change step size
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
  if (isDiscreteParameter.value) return  // Discrete parameters can't change step size
  if (isSupported.value) tap()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  if (currentIndex > 0) {
    stepsValue.value = stepsOptions[currentIndex - 1]!
  }
}

function increaseSteps() {
  if (isDiscreteParameter.value) return  // Discrete parameters can't change step size
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

.profile-selector.disabled {
  opacity: 0.5;
  pointer-events: none;
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

.profile-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.profile-btn:hover:not(:disabled) {
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
  background: var(--kb1-color-primary);
  opacity: 0.4;
  /* Left edge rounded (outer), right edge flat (meets divider) */
  border-top-left-radius: 4.5px;
  border-bottom-left-radius: 4.5px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.pink-bar-base {
  width: 100%;
  background: var(--kb1-color-accent);
  opacity: 0.4;
  /* Left edge flat (meets divider), right edge rounded (outer) */
  border-top-right-radius: 4.5px;
  border-bottom-right-radius: 4.5px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Active bars at 100% opacity */
.blue-bar-active {
  background: var(--kb1-color-primary);
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
  background: var(--kb1-color-accent);
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
  background: var(--ui-highlight);
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

/* Info Icon */
.info-icon {
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.625rem;
  font-family: 'Roboto Mono', monospace;
  color: #999;
  border: 1px solid #999;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
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
  margin: 0 0 1rem 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text);
}

.help-modal-body p:last-child {
  margin-bottom: 0;
}

.help-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .btn-primary {
  padding: 0.5rem 1.5rem; /* 8px top/bottom, 24px left/right */
  background: #5dad6b; /* Standardized green for all modals */
  color: #1A1A1A; /* Dark text on green button */
  border: none;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  opacity: 0.9; /* Slight dim on hover */
}
</style>
