<template>
  <div class="settings-keyboard">
    <!-- Mode Selector -->
    <div class="mode-selector">
      <button 
        class="mode-btn"
        :class="{ active: playMode === 'scale' }"
        @click="selectMode('scale')"
        title="Scale Mode"
      >
        Scale
      </button>
      <button 
        class="mode-btn"
        :class="{ active: playMode === 'chord' }"
        @click="selectMode('chord')"
        title="Chord Mode"
      >
        Chord
      </button>
    </div>

    <!-- Keyboard Visualization -->
    <div ref="keyboardRef" class="keyboard-visual" :class="{ 'chromatic-mode': isChromatic }">
      <!-- Octave meter bars (only in CHORD mode) - positioned from left -->
      <div v-if="playMode === 'chord'" ref="octaveMeterRef" class="octave-meter" :style="{ left: meterLeftPosition, right: 'auto' }">
        <button
          v-for="n in 3"
          :key="n"
          class="meter-bar"
          :class="{ active: voicingValue >= n }"
          @click="voicingValue = n"
          @mousedown="handleVoicingMouseDown"
          @mouseenter="handleVoicingMouseMove($event, n)"
          @touchstart="handleVoicingTouchStart"
          @touchmove="handleVoicingTouchMove($event, n)"
          :title="`${n}x octave range`"
        ></button>
      </div>
      
      <!-- Top row: Sharps/Flats -->
      <div class="keyboard-row top-row">
        <div 
          v-for="note in topRowNotes" 
          :key="note.midi"
          class="key sharp-key clickable"
          :class="{ 
            active: isNoteActive(note.midi),
            'gap-after': note.gapAfter,
            'root-note': isRootNote(note.midi),
            'chromatic-disabled': isChromatic
          }"
          @click="handleKeyClick(note.midi)"
          :title="`Set root note to ${note.sharp}`"
        >
          <div class="note-label">{{ note.sharp }}</div>
          <div class="note-label-alt">{{ note.flat }}</div>
        </div>
      </div>
      
      <!-- Bottom row: Naturals -->
      <div class="keyboard-row bottom-row">
        <div 
          v-for="note in bottomRowNotes" 
          :key="note.midi"
          class="key natural-key clickable"
          :class="{ 
            active: isNoteActive(note.midi),
            'gap-after': note.gapAfter,
            'root-note': isRootNote(note.midi),
            'chromatic-disabled': isChromatic,
            'last-f-key': note.midi === 77
          }"
          @click="handleKeyClick(note.midi)"
          :title="`Set root note to ${note.name}`"
        >
          <div class="note-label">{{ note.name }}</div>
        </div>
      </div>
    </div>

    <!-- Inactive Keys Hint Banner (Chromatic Mode Only) -->
    <div v-if="showInactiveKeyHint" class="inactive-keys-hint">
      <button class="hint-close-btn" @click="dismissHint(false)" title="Dismiss">×</button>
      <h3 class="hint-title">CHROMATIC MODE</h3>
      <div class="hint-description">
        Root note selection is inactive while SCALE TYPE is set to <strong>Chromatic</strong>.<br><br>
        Because all 12 notes are active, root note selection is disabled.
      </div>
      <div class="hint-footer">
        <button class="hint-btn-primary" @click="dismissHint(false)">Got it</button>
        <button class="hint-btn-secondary" @click="dismissHint(true)">Don't show again</button>
      </div>
    </div>

    <!-- Scale Mode: Mapping Toggle and Visualization -->
    <div v-if="playMode === 'scale'" class="mapping-toggle-row">
      <button 
        class="toggle-btn" 
        :class="{ disabled: isChromatic }"
        @click="handleScaleToggleClick"
        :title="scaleToggleTooltip"
        :disabled="isChromatic"
      >
        <span :class="{ active: isNatural }">NATURAL</span>
        <span class="toggle-divider">|</span>
        <span :class="{ active: !isNatural }">COMPACT</span>
      </button>
      
      <div class="dots-visualization" :class="{ 'wide-spacing': isNatural }">
        <div 
          v-for="i in 12" 
          :key="i" 
          class="dot"
          :class="{ 'active-dot': getDotOpacity(i - 1) === 1 }"
          :style="{ opacity: getDotOpacity(i - 1) }">
        </div>
      </div>
    </div>

    <!-- Chord Mode: Chord/Strum Toggle and Smart Slider -->
    <div v-else-if="playMode === 'chord'" class="chord-controls">
      <!-- Chord/Strum Toggle -->
      <div class="mapping-toggle-row">
        <button 
          class="toggle-btn" 
          @click="handleChordToggleClick"
          :title="chordToggleTooltip"
        >
          <span :class="{ active: isChordStyle }">CHORD</span>
          <span class="toggle-divider">|</span>
          <span :class="{ active: !isChordStyle }">STRUM</span>
        </button>
        
        <!-- Interactive Visual: gradient bar for chord, dynamic dots for strum -->
        <div 
          class="chord-visualization-interactive"
          @mousedown="handleVisualizationMouseDown"
          @touchstart="handleVisualizationTouchStart"
        >
          <!-- Chord: Velocity Gradient Bar (center-out) -->
          <div v-if="isChordStyle" class="chord-gradient-bar">
            <div class="velocity-gradient" :style="{ 
              background: createVelocityBands(visualSpread)
            }"></div>
            <div class="velocity-indicator-left" :style="{ left: `${50 - visualSpread / 2}%` }"></div>
            <div class="velocity-indicator-right" :style="{ left: `${50 + visualSpread / 2}%` }"></div>
          </div>
          
          <!-- Strum: Bidirectional Dots with Draggable Bar -->
          <div v-else class="strum-bidirectional-dots">
            <!-- Left side: Purple dots (reverse) -->
            <div class="dots-side dots-left">
              <div 
                v-for="i in 7" 
                :key="`left-${i}`" 
                class="dot purple"
                :class="{ active: isStrumReversed }"
                :style="{ left: `${leftDotPositions[i-1]}%` }"
              ></div>
            </div>
            
            <!-- Draggable bar -->
            <div 
              class="strum-bar"
              :style="{ left: `${barPosition}%` }"
              @mousedown="handleBarMouseDown"
              @touchstart.prevent="handleBarTouchStart"
              @dblclick="handleBarDoubleClick"
              title="Drag to adjust speed | Double-click to reset to 80ms"
            ></div>
            
            <!-- Right side: Yellow dots (forward) -->
            <div class="dots-side dots-right">
              <div 
                v-for="i in 7" 
                :key="`right-${i}`" 
                class="dot yellow"
                :class="{ active: !isStrumReversed }"
                :style="{ left: `${rightDotPositions[i-1]}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart Slider Controls -->
      <div class="smart-slider-section">
        <div class="group">
          <label>
            {{ smartSliderLabel }}
            <span v-if="isChordStyle" 
                  class="info-icon" 
                  @click.stop="showHelp('velocitySpread')">
              ?
            </span>
          </label>
          <div class="duration-control-wrapper">
            <ValueControl
              v-model="smartSliderValue"
              :min="smartSliderMin"
              :max="smartSliderMax"
              :step="5"
              :small-step="5"
              :large-step="10"
              :reset-value="smartSliderReset"
              :left-label="strumLeftLabel"
              :right-label="strumRightLabel"
              :read-only="!isChordStyle"
              :on-left-click="isChordStyle ? undefined : handleStrumLeftClick"
              :on-right-click="isChordStyle ? undefined : handleStrumRightClick"
              :drag-mapper="isChordStyle ? undefined : strumSpeedDragMapper"
              :display-formatter="isChordStyle ? undefined : strumDisplayFormatter"
              :left-disabled="strumLeftDisabled"
              :right-disabled="strumRightDisabled"
            />
            <span class="unit-label">{{ smartSliderUnit }}</span>
          </div>
        </div>
      </div>

      <!-- Strum Builder (only for STRUM mode) -->
      <div v-if="!isChordStyle" class="strum-builder-section">
        <!-- Strum builder content removed - SHAPE section moved below -->
      </div>
    </div>

    <!-- Type/Root Note Selectors (for SCALE mode or CHORD/STRUM styles) -->
    <div v-if="playMode === 'scale' || playMode === 'chord'" class="inputs">
      <div class="group" :class="{ 'root-range-group': playMode === 'chord' }">
        <label>
          {{ playMode === 'chord' ? 'ROOT NOTE/RANGE' : 'ROOT NOTE' }}
          <span v-if="playMode === 'chord'" 
                class="info-icon" 
                @click.stop="showHelp('voicing')">
            ?
          </span>
          <span v-if="playMode === 'scale'" 
                class="info-icon" 
                @click.stop="showHelp('rootNote')">
            ?
          </span>
        </label>
        <div class="root-range-row">
          <NotePickerControl
            v-model.number="rootNoteValue"
            :notes="rootNotes"
            :disabled="isChromatic"
          />
          
          <!-- Voicing dots control (for both CHORD and STRUM modes) -->
          <div v-if="playMode === 'chord'" class="voicing-dots">
            <button
              v-for="n in 3"
              :key="n"
              class="dot-btn"
              :class="{ active: voicingValue >= n }"
              @click="voicingValue = n"
              @mousedown="handleVoicingMouseDown"
              @mouseenter="hoveredDot = n; handleVoicingMouseMove($event, n)"
              @mouseleave="hoveredDot = 0"
              @touchstart="handleVoicingTouchStart"
              @touchmove="handleVoicingTouchMove($event, n)"
            >
              <span class="dot" :class="{ hovered: hoveredDot === n }"></span>
            </button>
          </div>
        </div>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>{{ leftLabel }}</label>
        <button 
          ref="typeTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': typePickerOpen }"
          @click="typePickerOpen = true"
        >
          {{ selectedTypeLabel }}
        </button>
      </div>

      <!-- Static Mood Description Bar (for CHORD mode only) -->
      <div class="static-mood-bar" v-if="isChordStyle && currentMood">
        <span class="mood-text" v-html="currentMood"></span>
      </div>
    </div>

    <!-- Advanced Strum Collapsible Section (SHAPE - for STRUM mode) -->
    <div v-if="playMode === 'chord' && !isChordStyle" class="advanced-strum-section" :class="{ 'active': advancedStrumOpen }">
      <button 
        class="advanced-strum-header"
        @click="advancedStrumOpen = !advancedStrumOpen"
      >
        <span class="mood-text" v-html="currentMood"></span>
        <div class="right-controls">
          <span class="adv-label">SHAPE</span>
          <span class="icon">{{ advancedStrumOpen ? '−' : '+' }}</span>
        </div>
      </button>

      <div v-if="advancedStrumOpen" class="advanced-strum-content">
        <PatternBuilder 
          v-model="strumIntervals"
          v-model:mode="buildMode"
          :chord-type="typeValue"
          :swing-value="swingValue"
          :reverse="model.chord.strumSpeed < 0"
        />

        <!-- Swing Control -->
        <div class="swing-control">
          <label>SWING</label>
          <div class="duration-control-wrapper">
            <ValueControl
              v-model="swingValue"
              :min="50"
              :max="100"
              :step="5"
              :small-step="5"
              :large-step="10"
            />
            <span class="unit-label">%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scale/Chord Type Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="typeValue"
      v-model:isOpen="typePickerOpen"
      :options="typeOptions"
      :trigger-el="typeTriggerRef"
    />

    <!-- Help Modal -->
    <div v-if="showHelpModal" class="help-modal-overlay" @click="dismissHelp">
      <div class="help-modal" @click.stop>
        <div class="help-modal-header">
          <h3>{{ helpContent.title }}</h3>
          <button class="close-btn" @click="dismissHelp">×</button>
        </div>
        <div class="help-modal-body">
          <p v-html="helpContent.description"></p>
        </div>
        <div class="help-modal-footer">
          <button class="btn-primary" @click="dismissHelp">Got it</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useHaptics } from '../composables/useHaptics'
import NotePickerControl from './NotePickerControl.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import ValueControl from './ValueControl.vue'
import PatternBuilder from './PatternBuilder.vue'

type ScaleModel = {
  scaleType: number
  rootNote: number
  keyMapping: number
}

type ChordModel = {
  chordType: number
  velocitySpread: number
  strumEnabled: boolean
  strumSpeed: number
  strumPattern: number  // Kept for backward compatibility
  strumSwing: number
  voicing: number       // 1-3 (octave range: 1x, 2x, 3x)
  strumIntervals?: number[]  // Array of semitone intervals
  buildMode?: string    // 'up', 'down', 'updown', 'custom', etc.
}

type KeyboardModel = {
  mode: 'scale' | 'chord'
  scale: ScaleModel
  chord: ChordModel
}

const props = defineProps<{
  modelValue: KeyboardModel
  scales: { value: number, label: string }[]
  chordTypes: { value: number, label: string }[]
  rootNotes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: KeyboardModel): void
  (e: 'mappingChanged', mappingName: string): void
  (e: 'chordStyleChanged', styleName: string): void
  (e: 'chromaticWarning', message: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Play mode
const playMode = computed({
  get: () => model.value.mode,
  set: (v: 'scale' | 'chord') => {
    const updated = { ...model.value, mode: v }
    emit('update:modelValue', updated)
  }
})

function selectMode(mode: 'scale' | 'chord') {
  playMode.value = mode
}

// Wheel picker state
const typePickerOpen = ref(false)
const typeTriggerRef = ref<HTMLElement | null>(null)

// Voicing dots hover state
const hoveredDot = ref(0)

// Octave meter positioning
const keyboardRef = ref<HTMLElement | null>(null)
const meterLeftPosition = ref('auto')

// Help modal system
const showHelpModal = ref(false)
const helpContent = ref({ title: '', description: '' })

const helpTexts = {
  rootNote: {
    title: 'Root Note',
    description: 'The starting note of the scale. All other scale degrees are built from this fundamental pitch.'
  },
  voicing: {
    title: 'Root Note and Range',
    description: '<strong>Root Note:</strong> The starting note of the chord. All other chord notes are built from this fundamental pitch.<br><br><strong>Octave Range:</strong> Stack chord voicing across 1-3 octaves for fuller sound.'
  },
  velocitySpread: {
    title: 'Velocity Spread',
    description: 'Velocity envelope across chord notes. <strong>Lower values</strong> = tight envelope (punchy attack/decay). <strong>Higher values</strong> = gentle envelope (smooth blend).'
  }
}

function showHelp(type: keyof typeof helpTexts) {
  helpContent.value = helpTexts[type]
  showHelpModal.value = true
}

function dismissHelp() {
  showHelpModal.value = false
}

// Advanced strum section state
const advancedStrumOpen = ref(false)
const userClosedPanel = ref(false) // Track if user manually closed the panel

const { doubleTap } = useHaptics()

// Track clicks in chromatic mode to show helpful hint banner
const inactiveKeyClicks = ref(0)
const inactiveClickTimer = ref<number | null>(null)
const showInactiveKeyHint = ref(false)
const HINT_STORAGE_KEY = 'kb1-inactive-keys-hint-dismissed'

// Check localStorage on mount
const hintDismissedPermanently = ref(localStorage.getItem(HINT_STORAGE_KEY) === 'true')

// Update octave meter position to align with last F key
function updateMeterPosition() {
  if (!keyboardRef.value || playMode.value !== 'chord') {
    return
  }
  
  // Use setTimeout to ensure layout is fully settled
  setTimeout(() => {
    const keyboard = keyboardRef.value
    if (!keyboard) return
    
    // Find last F key by CSS class
    const fKey = keyboard.querySelector('.last-f-key') as HTMLElement
    if (!fKey) return
    
    const keyboardRect = keyboard.getBoundingClientRect()
    const fKeyRect = fKey.getBoundingClientRect()
    
    // Calculate left position: distance from left edge of keyboard to center of F key
    const distanceFromLeft = fKeyRect.left - keyboardRect.left + (fKeyRect.width / 2)
    // Offset by half the meter width (24px / 2 = 12px) to center meter on key
    const finalPosition = distanceFromLeft - 12
    
    meterLeftPosition.value = `${Math.max(0, finalPosition)}px`
  }, 100)
}

// Listen for storage events to react when hints are restored via RESTORE button
const handleStorageChange = () => {
  const dismissed = localStorage.getItem(HINT_STORAGE_KEY) === 'true'
  hintDismissedPermanently.value = dismissed
}

onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
  // Also check periodically for same-window storage changes (RESTORE button is same window)
  const interval = setInterval(() => {
    handleStorageChange()
  }, 500)
  
  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange)
    clearInterval(interval)
  })
})

// Initialize meter position and listen for resize
onMounted(() => {
  updateMeterPosition()
  window.addEventListener('resize', updateMeterPosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMeterPosition)
})

// Watch for mode changes and update position
watch(playMode, () => {
  updateMeterPosition()
})

// Watch for voicing changes (might affect layout)
watch(() => model.value.chord.voicing, () => {
  updateMeterPosition()
})

// Watch advanced strum panel state to control pattern mode
watch(advancedStrumOpen, (isOpen) => {
  if (isOpen) {
    // When opening: clear the manual close flag
    userClosedPanel.value = false
    // Only set to pattern 7 (custom) if currently at 0 (chord type)
    // This allows preset-loaded patterns (1-6) to remain unchanged
    if (latestChord.value.strumPattern === 0) {
      latestChord.value.strumPattern = 7
      const updated = { ...model.value }
      updated.chord = { ...latestChord.value }
      emit('update:modelValue', updated)
    }
  } else {
    // When closing: mark that user manually closed the panel
    userClosedPanel.value = true
    // Always reset to 0 (chord type intervals)
    if (latestChord.value.strumPattern !== 0) {
      latestChord.value.strumPattern = 0
      const updated = { ...model.value }
      updated.chord = { ...latestChord.value }
      emit('update:modelValue', updated)
    }
  }
})

// Local state to track latest chord values (prevents stale prop spreading)
const latestChord = ref({ ...props.modelValue.chord })

// Sync latestChord when prop changes from parent
watch(() => props.modelValue.chord, (newChord) => {
  latestChord.value = { ...newChord }
}, { deep: true })

// Auto-open shape panel when loading preset with strumPattern > 0
watch(() => props.modelValue.chord.strumPattern, (newPattern, oldPattern) => {
  // Detect preset load: transition from 0 to >0 means preset with shape mode loaded
  // Reset the manual close flag to allow auto-opening
  if (oldPattern === 0 && newPattern > 0) {
    userClosedPanel.value = false
    console.log('Preset with shape mode loaded - clearing manual close flag')
  }
  
  // Don't auto-open if user manually closed the panel during this session
  if (userClosedPanel.value) {
    return
  }
  
  // If preset has pattern 1-6 (built-in shapes), open the shape panel
  if (newPattern > 0 && newPattern < 7 && !advancedStrumOpen.value) {
    advancedStrumOpen.value = true
    console.log('Auto-opened SHAPE panel for preset with strumPattern:', newPattern)
  }
  // If preset has pattern 7 (custom), also open
  else if (newPattern === 7 && !advancedStrumOpen.value) {
    advancedStrumOpen.value = true
    console.log('Auto-opened SHAPE panel for custom pattern')
  }
  // If preset has pattern 0 (normal chord), close the panel only if it wasn't manually closed
  else if (newPattern === 0 && advancedStrumOpen.value && !userClosedPanel.value) {
    advancedStrumOpen.value = false
    console.log('Auto-closed SHAPE panel for chord mode')
  }
})

// Strum builder state
const strumIntervals = computed({
  get: () => {
    const intervals = model.value.chord.strumIntervals || [0, 4, 7, 12]
    return intervals
  },
  set: (v: number[]) => {
    latestChord.value.strumIntervals = v
    const updated = { ...model.value }
    updated.chord = { ...latestChord.value }
    emit('update:modelValue', updated)
  }
})

const buildMode = computed({
  get: () => {
    const mode = model.value.chord.buildMode || 'up'
    return mode
  },
  set: (v: string) => {
    latestChord.value.buildMode = v
    const updated = { ...model.value }
    updated.chord = { ...latestChord.value }
    emit('update:modelValue', updated)
  }
})

// Swing control - UI displays 50-100%, firmware uses 0-100%
function swingUiToFirmware(uiValue: number): number {
  // Map 50-100% (UI) to 0-100 (firmware)
  return Math.max(0, Math.min(100, uiValue - 50))
}

function swingFirmwareToUi(firmwareValue: number): number {
  // Map 0-100 (firmware) to 50-100% (UI)
  return Math.max(50, Math.min(100, firmwareValue + 50))
}

const swingValue = computed({
  get: () => swingFirmwareToUi(model.value.chord.strumSwing || 0),
  set: (v: number) => {
    latestChord.value.strumSwing = swingUiToFirmware(v)
    const updated = { ...model.value }
    updated.chord = { ...latestChord.value }
    emit('update:modelValue', updated)
  }
})

// Dynamic labels and values based on mode
const leftLabel = computed(() => {
  return playMode.value === 'scale' ? 'SCALE TYPE' : 'CHORD TYPE'
})

const typeOptions = computed(() => {
  return playMode.value === 'scale' ? props.scales : props.chordTypes
})

const typeValue = computed({
  get: () => playMode.value === 'scale' ? model.value.scale.scaleType : model.value.chord.chordType,
  set: (v: number) => {
    const updated = { ...model.value }
    if (playMode.value === 'scale') {
      updated.scale = { ...updated.scale, scaleType: v }
      // Reset to Natural mode and C root note when switching to Chromatic
      if (v === 0) {
        updated.scale.keyMapping = 0
        updated.scale.rootNote = 60
      }
    } else {
      updated.chord = { ...updated.chord, chordType: v }
    }
    emit('update:modelValue', updated)
  }
})

const rootNoteValue = computed({
  get: () => model.value.scale.rootNote, // Always use scale.rootNote (shared for both modes)
  set: (v: number) => {
    const updated = { ...model.value }
    updated.scale = { ...updated.scale, rootNote: v }
    emit('update:modelValue', updated)
  }
})

const voicingValue = computed({
  get: () => model.value.chord.voicing,
  set: (v: number) => {
    const updated = { ...model.value }
    updated.chord = { ...updated.chord, voicing: v }
    emit('update:modelValue', updated)
  }
})

// Voicing drag state
const isDraggingVoicing = ref(false)

function handleVoicingMouseDown() {
  isDraggingVoicing.value = true
}

function handleVoicingMouseMove(_event: MouseEvent, dotValue: number) {
  if (isDraggingVoicing.value) {
    voicingValue.value = dotValue
  }
}

function handleVoicingTouchStart() {
  isDraggingVoicing.value = true
}

function handleVoicingTouchMove(event: TouchEvent, dotValue: number) {
  if (isDraggingVoicing.value) {
    event.preventDefault()
    voicingValue.value = dotValue
  }
}

// Add global listeners for mouse/touch up
onMounted(() => {
  const handleGlobalMouseUp = () => {
    isDraggingVoicing.value = false
  }
  const handleGlobalTouchEnd = () => {
    isDraggingVoicing.value = false
  }
  
  window.addEventListener('mouseup', handleGlobalMouseUp)
  window.addEventListener('touchend', handleGlobalTouchEnd)
  
  onUnmounted(() => {
    window.removeEventListener('mouseup', handleGlobalMouseUp)
    window.removeEventListener('touchend', handleGlobalTouchEnd)
  })
})

// Watch for Chromatic scale on mount/change - enforce C root and Natural mapping
// Only apply these restrictions in SCALE mode, not in CHORD mode
watch(() => [model.value.scale.scaleType, model.value.mode] as const, ([newScaleType, mode]) => {
  if (newScaleType === 0 && mode === 'scale') {
    const updated = { ...model.value }
    let needsUpdate = false
    
    // Reset to Natural key mapping if not already
    if (model.value.scale.keyMapping !== 0) {
      updated.scale = { ...updated.scale, keyMapping: 0 }
      needsUpdate = true
    }
    
    // Reset root note to C (60) if not already
    if (model.value.scale.rootNote !== 60) {
      if (!updated.scale || updated.scale === model.value.scale) {
        updated.scale = { ...model.value.scale }
      }
      updated.scale = { ...updated.scale, rootNote: 60 }
      needsUpdate = true
    }
    
    if (needsUpdate) {
      emit('update:modelValue', updated)
    }
  }
  
  // Reset inactive key hint when scale/mode changes
  showInactiveKeyHint.value = false
  inactiveKeyClicks.value = 0
}, { immediate: true })

const selectedTypeLabel = computed(() => {
  const option = typeOptions.value.find(o => o.value === typeValue.value)
  return option?.label || 'Unknown'
})

// Current mood description (scale or chord)
const currentMood = computed(() => {
  if (playMode.value === 'scale') {
    return scaleMoods[model.value.scale.scaleType] || ''
  } else {
    return chordMoods[model.value.chord.chordType] || ''
  }
})

// ===== SCALE MODE TOGGLE =====
const isNatural = computed(() => model.value.scale.keyMapping === 0)
// Only lock chromatic when in scale mode, not chord mode
const isChromatic = computed(() => model.value.scale.scaleType === 0 && model.value.mode === 'scale')

const scaleToggleTooltip = computed(() => {
  if (model.value.scale.scaleType === 0) {
    return 'Mapping mode disabled in Chromatic scale'
  }
  return isNatural.value ? 'Switch to Compact' : 'Switch to Natural'
})

const handleScaleToggleClick = () => {
  if (isChromatic.value) return
  
  const isCurrentlyNatural = isNatural.value
  const newMappingName = isCurrentlyNatural ? 'Efficient Mode' : 'Mapped Mode'
  emit('mappingChanged', newMappingName)
  
  const updated = { ...model.value }
  updated.scale = { ...updated.scale, keyMapping: isCurrentlyNatural ? 1 : 0 }
  emit('update:modelValue', updated)
}

// ===== CHORD MODE TOGGLE =====
const isChordStyle = computed(() => !model.value.chord.strumEnabled)

const chordToggleTooltip = computed(() => {
  return isChordStyle.value ? 'Switch to Strum' : 'Switch to Chord'
})

const handleChordToggleClick = () => {
  const isCurrentlyChord = isChordStyle.value
  const newStyleName = isCurrentlyChord ? 'Strum Mode' : 'Chord Mode'
  emit('chordStyleChanged', newStyleName)
  
  const updated = { ...model.value }
  updated.chord = { ...updated.chord, strumEnabled: isCurrentlyChord }
  emit('update:modelValue', updated)
}

// ===== SMART SLIDER =====
// Strum Speed: UI shows -360ms to -5ms (reverse), 5ms to 360ms (forward)
// Negative = reverse order, positive = forward order
// Skip -4 to 4 range (too fast, not useful)
const smartSliderValue = computed({
  get: () => {
    if (isChordStyle.value) {
      return model.value.chord.velocitySpread
    } else {
      return model.value.chord.strumSpeed
    }
  },
  set: (v: number) => {
    const updated = { ...model.value }
    if (isChordStyle.value) {
      updated.chord = { ...updated.chord, velocitySpread: v }
    } else {
      // Ensure value skips the -4 to 4 range
      let strumSpeed = v
      if (v > -5 && v < 5) {
        // Snap to nearest valid value (-5 or 5)
        strumSpeed = v < 0 ? -5 : 5
      }
      updated.chord = { ...updated.chord, strumSpeed }
    }
    emit('update:modelValue', updated)
  }
})

const smartSliderMin = computed(() => isChordStyle.value ? 10 : -360)
const smartSliderMax = computed(() => isChordStyle.value ? 100 : 360)

const smartSliderLabel = computed(() => {
  return isChordStyle.value ? 'VELOCITY SPREAD' : 'STRUM SPEED'
})

const smartSliderUnit = computed(() => {
  return isChordStyle.value ? '' : 'ms'
})

// Display formatter for strum speed - show "CTR" at center (±360)
const strumDisplayFormatter = (value: number): string => {
  if (Math.abs(value) === 360) return 'CTR'
  return String(value)
}

// Disable arrows at actual extremes (±5)
const strumLeftDisabled = computed(() => {
  if (isChordStyle.value) return false
  return smartSliderValue.value === -5
})

const strumRightDisabled = computed(() => {
  if (isChordStyle.value) return false
  return smartSliderValue.value === 5
})

// Drag mapper for strum speed - inverted mapping (edges fast, center slow)
const strumSpeedDragMapper = (percentage: number): number => {
  // Snap to center (±360) if within 5% of midpoint
  if (percentage >= 45 && percentage <= 55) {
    // Determine which side based on exact percentage
    return percentage < 50 ? -360 : 360
  }
  
  // Map edges (fast) to center (slow): 0% = -5ms, 50% = ±360ms, 100% = 5ms
  let newValue: number
  if (percentage < 50) {
    // Left side: 0% = -5ms, approaching 50% = -360ms
    const t = percentage / 50 // 0 to 1
    newValue = Math.round(-5 - t * 355) // -5 to -360
  } else {
    // Right side: 50% = 360ms, 100% = 5ms
    const t = (percentage - 50) / 50 // 0 to 1
    newValue = Math.round(360 - t * 355) // 360 to 5
  }
  // Snap to step of 5
  const snapped = Math.round(newValue / 5) * 5
  // Clamp to valid range (skip -4 to 4)
  let clamped = snapped
  if (clamped > -5 && clamped < 5) {
    clamped = clamped < 0 ? -5 : 5
  }
  return Math.max(-360, Math.min(360, clamped))
}

const smartSliderReset = computed(() => {
  return isChordStyle.value ? 80 : 80
})

// Dynamic arrow labels for strum speed - always single arrows
const strumLeftLabel = computed(() => {
  return isChordStyle.value ? '−' : '<'
})

const strumRightLabel = computed(() => {
  return isChordStyle.value ? '+' : '>'
})

// Custom button handlers for strum mode (inverted mapping: edges fast, center slow)
function handleStrumLeftClick() {
  // Left (<) moves bar LEFT on screen
  const current = smartSliderValue.value
  
  if (current >= 5) {
    // Positive side: LEFT = toward center (slower), increase value
    if (current >= 360) {
      // At center, cross to negative side
      smartSliderValue.value = -360
      return
    }
    smartSliderValue.value = Math.min(360, current + 5)
  } else {
    // Negative side: LEFT = toward edge (faster), increase toward -5
    if (current >= -5) return // Already at edge
    smartSliderValue.value = Math.min(-5, current + 5) // -165 + 5 = -160 ✓
  }
}

function handleStrumRightClick() {
  // Right (>) moves bar RIGHT on screen
  const current = smartSliderValue.value
  
  if (current >= 5) {
    // Positive side: RIGHT = toward edge (faster), decrease to 5
    if (current <= 5) return // Already at edge
    smartSliderValue.value = Math.max(5, current - 5) // Stop at 5, don't cross
  } else {
    // Negative side: RIGHT = toward center (slower), decrease value
    if (current <= -360) {
      // At center, cross to positive side
      smartSliderValue.value = 360
      return
    }
    smartSliderValue.value = Math.max(-360, current - 5) // -165 - 5 = -170 ✓
  }
}

const sliderPercentage = computed(() => {
  const range = smartSliderMax.value - smartSliderMin.value
  const value = smartSliderValue.value - smartSliderMin.value
  return (value / range) * 100
})

// Check if strum is in reverse (speed < 0)
const isStrumReversed = computed(() => {
  return !isChordStyle.value && model.value.chord.strumSpeed < 0
})

// Bar position for bidirectional strum (15% = -4ms fast, 50% = ±360ms slow, 85% = 4ms fast)
// Constrained to 15-85% to leave 15% space for dots on both sides
const barPosition = computed(() => {
  if (isChordStyle.value) return 50
  const value = smartSliderValue.value
  // Map inverted: edges=fast(5ms), center=slow(360ms)
  let normalized: number
  if (value < 0) {
    // Left side: -5 (0%) to -360 (50%)
    const absValue = Math.abs(value)
    normalized = (absValue - 5) / 355 * 0.5 // 0.0 to 0.5
  } else {
    // Right side: 360 (50%) to 5 (100%)
    normalized = 0.5 + (360 - value) / 355 * 0.5 // 0.5 to 1.0
  }
  return 15 + normalized * 70 // 15% to 85%
})

// Left dot positions (purple, reverse) - EXPAND as bar moves right (inactive side)
const leftDotPositions = computed(() => {
  const barPos = barPosition.value // 10% to 90%
  const positions: number[] = []
  
  // Available space: 0% to barPos (always at least 15%)
  const availableSpace = barPos
  
  // Compression factor: 0.0 (compressed) when bar at 15%, 1.0 (expanded) when bar at 85%
  const expansion = (barPos - 15) / 70 // 0.0 to 1.0
  
  // Use 90% of space when compressed (tight but all visible), 70% when expanded
  const minUsage = 0.90
  const maxUsage = 0.70
  const usage = minUsage + expansion * (maxUsage - minUsage)
  const visualRange = availableSpace * usage
  
  // Spread 7 dots with quadratic easing (easeOutQuad) for better visual distribution
  const startPos = barPos - visualRange
  for (let i = 0; i < 7; i++) {
    const t = i / 6 // 0.0 to 1.0 linear
    const eased = 1 - Math.pow(1 - t, 2) // easeOutQuad: spreads more at edges
    positions.push(startPos + eased * visualRange)
  }
  return positions
})

// Right dot positions (yellow, forward) - COMPRESS as bar moves right (active side)
const rightDotPositions = computed(() => {
  const barPos = barPosition.value // 10% to 90%
  const positions: number[] = []
  
  // Available space: barPos to 100% (always at least 15%)
  const availableSpace = 100 - barPos
  
  // Compression factor: 1.0 (expanded) when bar at 15%, 0.0 (compressed) when bar at 85%
  const expansion = (85 - barPos) / 70 // 1.0 to 0.0
  
  // Use 90% of space when compressed (tight but all visible), 70% when expanded
  const minUsage = 0.90
  const maxUsage = 0.70
  const usage = minUsage + expansion * (maxUsage - minUsage)
  const visualRange = availableSpace * usage
  
  // Spread 7 dots with quadratic easing (easeInQuad) - compressed near bar, spread at edge
  const startPos = barPos
  for (let i = 0; i < 7; i++) {
    const t = i / 6 // 0.0 to 1.0 linear
    const eased = Math.pow(t, 2) // easeInQuad: compressed at start, spreads toward end
    positions.push(startPos + eased * visualRange)
  }
  return positions
})

// Visual spread percentage with minimum gap for chord mode
const visualSpread = computed(() => {
  if (!isChordStyle.value) return sliderPercentage.value
  
  // REVERSED: Remap slider percentage (0-100) to visual spread (82-8)
  // Lower velocitySpread values (like 10) = wider visual gap (~82%)
  // Higher velocitySpread values (like 100) = narrower visual gap (~8%)
  const minVisual = 8   // Minimum 8% visual spread at 100% velocity
  const maxVisual = 82  // Maximum 82% visual spread at 10% velocity
  return maxVisual - (sliderPercentage.value / 100) * (maxVisual - minVisual)
})

// Create banded velocity visualization (center-out)
function createVelocityBands(spreadPercent: number): string {
  // Check if light theme is active
  const isLightTheme = document.documentElement.classList.contains('theme-kb1-light')
  const baseColor = isLightTheme ? '138, 104, 218' : '249, 172, 32' // Purple for light, Yellow for dark
  
  // Calculate indicator positions
  const leftIndicator = 50 - spreadPercent / 2
  const rightIndicator = 50 + spreadPercent / 2
  
  const stops: string[] = []
  const numDarkBands = 5 // Fixed number of bands on each side
  
  // Left side dark bands (compressed into 0 to leftIndicator)
  for (let i = 0; i < numDarkBands; i++) {
    const bandStart = (i / numDarkBands) * leftIndicator
    const bandEnd = ((i + 1) / numDarkBands) * leftIndicator
    
    // Opacity increases as we approach center (band closest to indicator is brightest)
    // Mirror the right side: i=0 is darkest (far left), i=4 is brightest (near indicator)
    const opacity = 0.03 + (i / numDarkBands) * 0.87
    
    stops.push(`rgba(${baseColor}, ${opacity}) ${bandStart}%`)
    stops.push(`rgba(${baseColor}, ${opacity}) ${bandEnd}%`)
  }
  
  // Center bright zone (leftIndicator to rightIndicator)
  stops.push(`rgba(${baseColor}, 1.0) ${leftIndicator}%`)
  stops.push(`rgba(${baseColor}, 1.0) ${rightIndicator}%`)
  
  // Right side dark bands (compressed into rightIndicator to 100)
  const rightSpace = 100 - rightIndicator
  for (let i = 0; i < numDarkBands; i++) {
    const bandStart = rightIndicator + (i / numDarkBands) * rightSpace
    const bandEnd = rightIndicator + ((i + 1) / numDarkBands) * rightSpace
    
    // Opacity decreases as we move away from center (band closest to indicator is brightest)
    const opacity = 0.9 - (i / numDarkBands) * 0.87
    
    stops.push(`rgba(${baseColor}, ${opacity}) ${bandStart}%`)
    stops.push(`rgba(${baseColor}, ${opacity}) ${bandEnd}%`)
  }
  
  return `linear-gradient(to right, ${stops.join(', ')})`
}

// Dot opacity for scale mode visualization
function getDotOpacity(dotIndex: number): number {
  // In Compact mode, all dots are full brightness
  if (!isNatural.value) return 1
  
  // In Natural mode, show which physical keyboard keys are active
  // Dots represent MIDI notes 59-70 (B through A#/Bb)
  const midiNote = 59 + dotIndex
  const rootNote = model.value.scale.rootNote
  const scaleType = model.value.scale.scaleType
  const intervals = scaleIntervals[scaleType] || []
  
  // Check if this MIDI note is in the active scale
  const noteOffset = (midiNote - rootNote + 120) % 12
  const isInScale = intervals.includes(noteOffset)
  
  // Active notes: full brightness, inactive: dimmed to 40%
  return isInScale ? 1 : 0.4
}

// Direct visualization interaction handlers
const updateValueFromPosition = (clientX: number, rect: DOMRect) => {
  const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  
  if (isChordStyle.value) {
    // Chord mode: calculate based on distance from center
    // Lines are positioned at: 50 - visualSpread/2 and 50 + visualSpread/2
    const distanceFromCenter = Math.abs(percentage - 50)
    const visualSpreadValue = distanceFromCenter * 2
    
    // REVERSED mapping: visual spread (82-8) to slider percentage (0-100)
    // Wider visual = lower slider value, narrower visual = higher slider value
    const minVisual = 8
    const maxVisual = 82
    const sliderPerc = Math.max(0, Math.min(100, 100 - ((visualSpreadValue - minVisual) / (maxVisual - minVisual)) * 100))
    
    // Convert slider percentage to actual slider value
    const range = smartSliderMax.value - smartSliderMin.value
    const newValue = Math.round(smartSliderMin.value + (sliderPerc / 100) * range)
    smartSliderValue.value = Math.max(smartSliderMin.value, Math.min(smartSliderMax.value, newValue))
  } else {
    // Strum mode: inverted mapping (left = fast/tight, right = slow/wide)
    // This matches the visual where dots bunch on the left when tight
    const range = smartSliderMax.value - smartSliderMin.value
    const newValue = Math.round(smartSliderMax.value - (percentage / 100) * range)
    smartSliderValue.value = Math.max(smartSliderMin.value, Math.min(smartSliderMax.value, newValue))
  }
}

const handleVisualizationMouseDown = (e: MouseEvent) => {
  // Only handle clicks in chord mode (not in bidirectional strum mode)
  if (!isChordStyle.value) return
  
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  updateValueFromPosition(e.clientX, rect)
  
  const handleMouseMove = (e: MouseEvent) => {
    updateValueFromPosition(e.clientX, rect)
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleVisualizationTouchStart = (e: TouchEvent) => {
  // Only handle touches in chord mode (not in bidirectional strum mode)
  if (!isChordStyle.value) return
  
  if (e.touches.length !== 1) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const touch = e.touches[0]
  if (!touch) return
  updateValueFromPosition(touch.clientX, rect)
  
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    updateValueFromPosition(touch.clientX, rect)
  }
  
  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

// ===== BAR DRAG HANDLERS (for bidirectional strum) =====

const handleBarMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  const visualContainer = (e.currentTarget as HTMLElement).parentElement
  if (!visualContainer) return
  const rect = visualContainer.getBoundingClientRect()
  
  const updateFromBarDrag = (clientX: number) => {
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    smartSliderValue.value = strumSpeedDragMapper(percentage)
  }
  
  // Don't update on initial click - only on drag (mousemove)
  
  const handleMouseMove = (e: MouseEvent) => {
    updateFromBarDrag(e.clientX)
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleBarTouchStart = (e: TouchEvent) => {
  e.stopPropagation()
  
  const visualContainer = (e.currentTarget as HTMLElement).parentElement
  if (!visualContainer || e.touches.length !== 1) return
  const touch = e.touches[0]
  if (!touch) return
  
  const updateFromBarDrag = (clientX: number) => {
    const rect = visualContainer.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    smartSliderValue.value = strumSpeedDragMapper(percentage)
  }
  
  // Don't update on initial touch - only on drag (touchmove)
  
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    if (!touch) return
    e.preventDefault()
    updateFromBarDrag(touch.clientX)
  }
  
  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

const handleBarDoubleClick = () => {
  smartSliderValue.value = 80
}

// ===== KEYBOARD VISUALIZATION =====

// Scale theory - intervals in semitones from root note
// Must match ScaleType enum order from firmware
const scaleIntervals: Record<number, number[]> = {
  0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Chromatic - all notes
  1: [0, 2, 4, 5, 7, 9, 11], // Major
  2: [0, 2, 3, 5, 7, 8, 10], // Minor
  3: [0, 2, 3, 5, 7, 8, 11], // Harmonic Minor
  4: [0, 2, 3, 5, 7, 9, 11], // Melodic Minor Ascending
  5: [0, 2, 4, 7, 9], // Pentatonic Major
  6: [0, 3, 5, 7, 10], // Pentatonic Minor
  7: [0, 3, 5, 6, 7, 10], // Blues Minor
  8: [0, 2, 3, 5, 7, 9, 10], // Dorian
  9: [0, 1, 3, 5, 7, 8, 10], // Phrygian
  10: [0, 2, 4, 6, 7, 9, 11], // Lydian
  11: [0, 2, 4, 5, 7, 9, 10], // Mixolydian
  12: [0, 1, 3, 5, 6, 8, 10], // Locrian
  13: [0, 1, 4, 5, 7, 8, 10], // Phrygian Dominant
  14: [0, 2, 4, 6, 8, 10], // Whole Tone
  15: [0, 2, 3, 5, 6, 8, 9, 11], // Diminished
  16: [0, 2, 3, 4, 7, 9], // Blues Major
  17: [0, 2, 3, 7, 8], // Hirajoshi
  18: [0, 1, 5, 7, 10], // In Sen
  19: [0, 1, 4, 5, 7, 8, 11], // Double Harmonic
  20: [0, 1, 3, 4, 6, 8, 10], // Super Locrian
}

// Chord theory - intervals in semitones from root note (must match firmware!)
const chordIntervals: Record<number, number[]> = {
  0: [0, 4, 7],    // Major
  1: [0, 3, 7],    // Minor
  2: [0, 3, 6],    // Diminished
  3: [0, 4, 8],    // Augmented
  4: [0, 2, 7],    // Sus2
  5: [0, 5, 7],    // Sus4
  6: [0, 7, 12],   // Power (root, 5th, octave)
  7: [0, 4, 7, 11], // Major7
  8: [0, 3, 7, 10], // Minor7
  9: [0, 4, 7, 10], // Dom7
  10: [0, 4, 7, 14], // Major add9
  11: [0, 3, 7, 14], // Minor add9
  12: [0, 4, 7, 9],  // Major 6th
  13: [0, 3, 7, 9],  // Minor 6th
  14: [0, 4, 7, 11, 14], // Major 9th
}

// Scale mood descriptions - production-focused
const scaleMoods: Record<number, string> = {
  0: 'all notes // full range<br>no filtering',
  1: 'bright // uplifting<br>pop hooks',
  2: 'sad // emotional<br>introspective',
  3: 'dark drama<br>cinematic // tension',
  4: 'jazz smooth // lush<br>sophisticated',
  5: 'catchy // simple<br>universal melodies',
  6: 'blues riffs // soulful<br>minor grooves',
  7: 'gritty // expressive<br>classic blues',
  8: 'modal jazz // funky<br>sophisticated',
  9: 'Spanish // exotic<br>flamenco vibes',
  10: 'dreamy // floating<br>major bright',
  11: 'funk grooves // bold<br>classic rock',
  12: 'dark jazz<br>unstable // dissonant',
  13: 'exotic // powerful<br>middle eastern',
  14: 'spacey // ambient<br>floating pads',
  15: 'angular // symmetrical<br>jazz tension',
  16: 'bluesy // vintage<br>major swing',
  17: 'Japanese // meditative<br>traditional',
  18: 'Japanese // minimal<br>contemplative',
  19: 'intense // dramatic<br>Indian classical',
  20: 'super dark // dissonant<br>altered jazz'
}

// Chord mood descriptions - production-focused
const chordMoods: Record<number, string> = {
  0: 'bright // clean pop<br>uplifting vibes',
  1: 'dark // emotional<br>trap feels',
  2: 'tension // glitchy<br>horror vibes',
  3: 'weird // wonky<br>experimental',
  4: 'airy // shimmer<br>bright modern pop',
  5: 'build-up // tension<br>anticipation',
  6: '808 bass // heavy<br>EDM drop',
  7: 'neo-soul // lush<br>smooth jazz pads',
  8: 'R&B grooves // moody<br>chill beats',
  9: 'bluesy // tension<br>resolving',
  10: 'shimmer // color<br>bright modern pop',
  11: 'trap soul // moody<br>emotional depth',
  12: 'lo-fi // retro<br>gold nostalgia',
  13: 'vintage // boom-bap<br>melancholic',
  14: 'lush pads // neo-soul<br>rich texture'
}

// Keyboard layout - starting from B (MIDI 59) for ~2 octaves
const topRowNotes = [
  { midi: 61, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 63, sharp: 'D#', flat: 'Eb', gapAfter: true },
  { midi: 66, sharp: 'F#', flat: 'Gb', gapAfter: false },
  { midi: 68, sharp: 'G#', flat: 'Ab', gapAfter: false },
  { midi: 70, sharp: 'A#', flat: 'Bb', gapAfter: true },
  { midi: 73, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 75, sharp: 'D#', flat: 'Eb', gapAfter: false },
]

const bottomRowNotes = [
  { midi: 59, name: 'B', gapAfter: false },
  { midi: 60, name: 'C', gapAfter: false },
  { midi: 62, name: 'D', gapAfter: false },
  { midi: 64, name: 'E', gapAfter: false },
  { midi: 65, name: 'F', gapAfter: false },
  { midi: 67, name: 'G', gapAfter: false },
  { midi: 69, name: 'A', gapAfter: false },
  { midi: 71, name: 'B', gapAfter: false },
  { midi: 72, name: 'C', gapAfter: false },
  { midi: 74, name: 'D', gapAfter: false },
  { midi: 76, name: 'E', gapAfter: false },
  { midi: 77, name: 'F', gapAfter: false },
]

function isNoteActive(midiNote: number): boolean {
  const rootNote = model.value.scale.rootNote // Always use scale.rootNote (shared for both modes)
  
  if (playMode.value === 'scale') {
    // Scale mode: show active scale notes
    const scaleType = model.value.scale.scaleType
    const intervals = scaleIntervals[scaleType] || []
    const noteOffset = (midiNote - rootNote + 120) % 12
    return intervals.includes(noteOffset)
  } else {
    // Chord mode: show chord tones
    const chordType = model.value.chord.chordType
    const intervals = chordIntervals[chordType] || []
    const noteOffset = (midiNote - rootNote + 120) % 12
    return intervals.includes(noteOffset)
  }
}

function isRootNote(midiNote: number): boolean {
  // Force C (60) as root when Chromatic scale is selected in SCALE mode only
  const rootNote = (model.value.scale.scaleType === 0 && model.value.mode === 'scale') ? 60 : model.value.scale.rootNote
  return (midiNote % 12) === (rootNote % 12)
}

// Dismiss hint banner
function dismissHint(permanent: boolean) {
  showInactiveKeyHint.value = false
  inactiveKeyClicks.value = 0
  
  if (permanent) {
    localStorage.setItem(HINT_STORAGE_KEY, 'true')
    hintDismissedPermanently.value = true
  }
}

// Handle keyboard key clicks to set root note
function handleKeyClick(midiNote: number) {
  // Track clicks for hint banner ONLY in chromatic mode (before early return)
  if (isChromatic.value && !hintDismissedPermanently.value && !showInactiveKeyHint.value) {
    // In chromatic mode, all keys are inactive for root change
    inactiveKeyClicks.value++
    
    // Reset counter after 10 seconds of inactivity
    if (inactiveClickTimer.value) {
      clearTimeout(inactiveClickTimer.value)
    }
    inactiveClickTimer.value = window.setTimeout(() => {
      inactiveKeyClicks.value = 0
      inactiveClickTimer.value = null
    }, 10000)
    
    // Show hint banner after 4 clicks in chromatic mode
    if (inactiveKeyClicks.value >= 4) {
      showInactiveKeyHint.value = true
      inactiveKeyClicks.value = 0
      if (inactiveClickTimer.value) {
        clearTimeout(inactiveClickTimer.value)
        inactiveClickTimer.value = null
      }
    }
  }
  
  // Handle chromatic mode early return
  if (isChromatic.value) {
    emit('chromaticWarning', 'Default mapping')
    return
  }
  
  // Double tap haptic for root note selection
  doubleTap()
  
  // Convert the clicked key's MIDI note to the root note range (60-71)
  // We need to map the note class (0-11) to the middle C octave range
  const noteClass = midiNote % 12
  const newRootNote = 60 + noteClass // Map to C (60) through B (71)
  rootNoteValue.value = newRootNote
}
</script>

<style scoped>
.settings-keyboard {
  padding: 1.25rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: visible;
}

/* Mode Selector (like Touch) */
.mode-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-divider);
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

/* Keyboard Visualization */
.keyboard-visual {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 5px;
  overflow: visible;
  position: relative;
}

.keyboard-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: nowrap;
  overflow: visible;
}

.key {
  width: 24px;
  height: 60px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto Mono';
  font-size: 0.6875rem;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.key {
  background-color: #1A1A1A;
  color: rgba(255, 255, 255, 0.3);
}

:global(html.theme-kb1-light) .key {
  background-color: #c8c8ce !important;
  color: rgba(0, 0, 0, 0.45) !important;
}

.key.active {
  background-color: #0BA873;
  color: #0F0F0F;
}

:global(html.theme-kb1-light) .key.active {
  background-color: #389265;
  color: #ffffff;
}

.key.root-note {
  box-shadow:
    inset 0 0 0 2px #0F0F0F,
    0 0 0 1px var(--accent-highlight);
  animation: root-note-pulse 2s ease-in-out infinite;
}

:global(html.theme-kb1-light) .key.root-note {
  box-shadow:
    inset 0 0 0 2px #e0e0e5,
    0 0 0 1px var(--accent-highlight);
  animation: root-note-pulse-light 2s ease-in-out infinite;
}

@keyframes root-note-pulse {
  0%, 100% {
    box-shadow:
      inset 0 0 0 2px #0F0F0F,
      0 0 0 1px var(--accent-highlight);
  }
  50% {
    box-shadow:
      inset 0 0 0 2px #0F0F0F,
      0 0 0 1px var(--accent-highlight),
      0 0 8px 2px rgba(106, 104, 83, 0.4);
  }
}

.key.root-note.chromatic-disabled {
  box-shadow: none;
  animation: none;
}

.key.clickable {
  cursor: pointer;
}

.key.clickable.chromatic-disabled {
  cursor: default;
}

.key.clickable:hover {
  background-color: #2A2A2A;
  color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
  transition: all 0.15s ease;
}

.key.clickable.chromatic-disabled:hover {
  background-color: inherit;
  color: inherit;
  transform: none;
}

.key.clickable.active:hover {
  background-color: #0DC988;
  color: #0F0F0F;
}

.key.clickable.active.chromatic-disabled {
  background-color: rgba(13, 201, 136, 0.4);
  color: rgba(15, 15, 15, 0.6);
}

.key.clickable.active.chromatic-disabled:hover {
  background-color: rgba(13, 201, 136, 0.4);
  color: rgba(15, 15, 15, 0.6);
  transform: none;
}

.key.gap-after {
  margin-right: 1.5rem;
}

.note-label {
  line-height: 1;
}

.note-label-alt {
  line-height: 1;
  font-size: 0.625rem;
}

/* Inactive Keys Hint Banner */
.inactive-keys-hint {
  position: relative;
  background: var(--color-background-soft, #1A1A1A);
  border: 1px solid var(--color-border, #333333);
  border-radius: 8px;
  margin-top: 1rem;
  padding: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  font-family: 'Roboto Mono';
}

.hint-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  z-index: 1;
}

.hint-close-btn:hover {
  background: var(--color-background-mute, #222222);
  color: #EAEAEA;
}

.hint-title {
  margin: 0;
  padding: 1rem 2.5rem 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border, #333333);
}

.hint-description {
  margin: 0;
  padding: 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text, #EAEAEA);
  font-weight: 400;
}

.hint-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border, #333333);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hint-btn-primary {
  width: 100%;
  padding: 0.625rem 1.25rem;
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

.hint-btn-primary:hover {
  background: #0BA872;
}

.hint-btn-secondary {
  width: 100%;
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: #848484;
  border: 1px solid #333333;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #484848;
  color: #EAEAEA;
}

/* Mapping Toggle Row */
.mapping-toggle-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  margin-bottom: 0;
  padding-bottom: 0.75rem;
  border-top: 1px solid var(--color-divider);
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
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(106, 104, 83, 0.1);
  border-color: rgba(106, 104, 83, 0.2);
}

.toggle-btn span {
  opacity: 0.5;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.toggle-btn:not(:disabled) span:not(.active):hover {
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

/* Dots Visualization (Scale mode) */
.dots-visualization {
  display: flex;
  align-items: center;
  gap: 2px;
  transition: gap 0.3s ease;
  flex-shrink: 0;
}

.dots-visualization.wide-spacing {
  gap: 8px;
}

.dots-visualization .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--accent-highlight);
  flex-shrink: 0;
}

.dots-visualization .dot.active-dot {
  animation: scale-dot-breathe 2.5s ease-in-out infinite;
}

.dots-visualization .dot.active-dot:nth-child(1) { animation-delay: 0s; }
.dots-visualization .dot.active-dot:nth-child(2) { animation-delay: 0.2s; }
.dots-visualization .dot.active-dot:nth-child(3) { animation-delay: 0.4s; }
.dots-visualization .dot.active-dot:nth-child(4) { animation-delay: 0.6s; }
.dots-visualization .dot.active-dot:nth-child(5) { animation-delay: 0.8s; }
.dots-visualization .dot.active-dot:nth-child(6) { animation-delay: 1s; }
.dots-visualization .dot.active-dot:nth-child(7) { animation-delay: 1.2s; }
.dots-visualization .dot.active-dot:nth-child(8) { animation-delay: 1.4s; }
.dots-visualization .dot.active-dot:nth-child(9) { animation-delay: 1.6s; }
.dots-visualization .dot.active-dot:nth-child(10) { animation-delay: 1.8s; }
.dots-visualization .dot.active-dot:nth-child(11) { animation-delay: 2s; }
.dots-visualization .dot.active-dot:nth-child(12) { animation-delay: 2.2s; }

@keyframes scale-dot-breathe {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.3);
    filter: brightness(1.4);
  }
}

/* Chord/Strum Interactive Visualization */
.chord-visualization-interactive {
  display: flex;
  align-items: center;
  flex: 1;
  height: 20px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

/* Chord: Velocity Gradient Bar */
.chord-gradient-bar {
  display: flex;
  width: 100%;
  height: 12px;
  border-radius: 4px;
  overflow: visible;
  position: relative;
  animation: chord-shimmer 3s ease-in-out infinite;
}

@keyframes chord-shimmer {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 0 transparent);
  }
  50% {
    filter: brightness(1.3) drop-shadow(0 0 4px rgba(249, 172, 32, 0.6));
  }
}

.velocity-gradient {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  opacity: 0.85;
}

.velocity-indicator-left,
.velocity-indicator-right {
  position: absolute;
  top: -4px;
  width: 4px;
  height: calc(100% + 8px);
  background: var(--accent-highlight);
  opacity: 1;
  transform: translateX(-2px);
  pointer-events: none;
  z-index: 10;
  filter: brightness(1.5);
  border-radius: 2px;
}

:global(html.theme-kb1-light) .velocity-indicator-left,
:global(html.theme-kb1-light) .velocity-indicator-right {
  background: rgb(138, 104, 218);
}

/* Strum: Bidirectional Dots with Draggable Bar */
.strum-bidirectional-dots {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.dots-side {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  height: 5px;
  pointer-events: none;
}

.strum-bidirectional-dots .dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.15s ease;
  opacity: 0.5;
  pointer-events: none;
}

.strum-bidirectional-dots .dot.purple {
  background-color: #C084FC;
}

.strum-bidirectional-dots .dot.yellow {
  background-color: var(--accent-highlight);
}

/* Pulse animation only on active side */
.strum-bidirectional-dots .dot.active {
  animation: strum-cascade 1.8s ease-in-out infinite;
}

/* Staggered delays for left side (purple, reverse order when active) */
.dots-left .dot.active:nth-child(1) { animation-delay: 1.2s; }
.dots-left .dot.active:nth-child(2) { animation-delay: 1.0s; }
.dots-left .dot.active:nth-child(3) { animation-delay: 0.8s; }
.dots-left .dot.active:nth-child(4) { animation-delay: 0.6s; }
.dots-left .dot.active:nth-child(5) { animation-delay: 0.4s; }
.dots-left .dot.active:nth-child(6) { animation-delay: 0.2s; }
.dots-left .dot.active:nth-child(7) { animation-delay: 0s; }

/* Staggered delays for right side (yellow, forward order when active) */
.dots-right .dot.active:nth-child(1) { animation-delay: 0s; }
.dots-right .dot.active:nth-child(2) { animation-delay: 0.2s; }
.dots-right .dot.active:nth-child(3) { animation-delay: 0.4s; }
.dots-right .dot.active:nth-child(4) { animation-delay: 0.6s; }
.dots-right .dot.active:nth-child(5) { animation-delay: 0.8s; }
.dots-right .dot.active:nth-child(6) { animation-delay: 1.0s; }
.dots-right .dot.active:nth-child(7) { animation-delay: 1.2s; }

/* Draggable bar */
.strum-bar {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 20px;
  background: var(--accent-highlight);
  border-radius: 10px;
  cursor: grab;
  transition: left 0.1s ease;
  z-index: 10;
  pointer-events: auto;
}

/* Larger touch target for mobile */
.strum-bar::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 60px;
  /* Uncomment to visualize touch area during development */
  /* background: rgba(255, 0, 0, 0.2); */
}

.strum-bar:active {
  cursor: grabbing;
}

@keyframes strum-cascade {
  0%, 100% { 
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  10% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
  }
  20% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.1);
  }
  30%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Chord Controls Section */
.chord-controls {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Smart Slider (Controls only) */
.smart-slider-section {
  padding-top: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-divider);
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
  cursor: default;
  user-select: none;
}

/* Strum Builder Section */
.strum-builder-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Advanced Strum Section */
.advanced-strum-section {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(234, 234, 234, 0.03);
  border-radius: 4px;
}

.advanced-strum-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.25rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: 'Roboto Mono';
  color: var(--label-gray);
  transition: color 0.2s ease;
}

.advanced-strum-header:hover {
  color: #EAEAEA;
}

.advanced-strum-header .mood-text {
  font-family: 'Roboto Mono';
  font-size: 0.75rem;
  color: #EAEAEA;
  opacity: 0.4;
  text-align: left;
  letter-spacing: 0.02em;
  line-height: 1.4;
  flex: 1;
}

.advanced-strum-header .right-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.advanced-strum-header .adv-label {
  font-size: 0.8125rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--label-gray);
}

.advanced-strum-header:hover .adv-label {
  color: #EAEAEA;
}

.advanced-strum-header .icon {
  font-size: 1.25rem;
  font-weight: 300;
  line-height: 1;
  color: var(--accent-highlight);
}

.advanced-strum-content {
  animation: fadeIn 0.3s ease;
}

/* Height compensation spacer for non-strum modes */
.height-spacer {
  flex: 1;
  min-height: 1rem;
}

.swing-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 0.25rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-divider);
}

.swing-control label {
  font-weight: 400;
  font-size: 0.8125rem;
  color: var(--label-gray);
  font-family: 'Roboto Mono';
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.swing-control .duration-control-wrapper {
  flex-shrink: 0;
}

/* Inputs Section */
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
  padding: 0.5rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  gap: 1rem;
}

.group label {
  font-weight: 400;
  font-size: 0.8125rem;
  color: var(--label-gray);
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
  font-size: 0.8125rem;
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

/* Static Mood Bar (for scale/chord modes) */
.static-mood-bar {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(234, 234, 234, 0.03);
  border-radius: 4px;
}

.static-mood-bar .mood-text {
  font-family: 'Roboto Mono';
  font-size: 0.75rem;
  color: #EAEAEA;
  opacity: 0.4;
  text-align: left;
  letter-spacing: 0.02em;
  line-height: 1.4;
  display: block;
}

/* ===== LIGHT MODE OVERRIDES ===== */
:global(html.theme-kb1-light .static-mood-bar) {
  background: rgba(149, 151, 172, 0.2) !important;
}

:global(html.theme-kb1-light .static-mood-bar .mood-text) {
  color: #2f2f2f;
  opacity: 1;
}

/* ===== VOICING CONTROLS ===== */

/* Info icon (?) - matches existing app style */
.info-icon {
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
  margin-left: 0.375rem;
}

.info-icon:hover {
  color: #0DC988;
  border-color: #0DC988;
}

/* Root & Range row wrapper */
.root-range-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Voicing dots container */
.voicing-dots {
  display: flex;
  gap: 0.2rem;
  align-items: center;
  user-select: none;
}

/* Individual dot button */
.dot-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 9px;
  height: 9px;
  flex-shrink: 0;
}

/* The actual dot */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6a6853;
  transition: all 0.2s ease;
}

/* Active dot (yellow) */
.dot-btn.active .dot {
  background: #f9ac20;
  box-shadow: 0 0 6px rgba(249, 172, 32, 0.4);
}

/* Hovered dot (grows) */
.dot.hovered {
  width: 9px;
  height: 9px;
}

/* Octave meter bars */
.octave-meter {
  position: absolute;
  top: 5px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0;
  width: 24px;
  height: 60px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background-color: transparent;
  user-select: none;
}

.meter-bar {
  width: 100%;
  height: 7px;
  background: rgba(106, 104, 83, 0.4);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.meter-bar:hover {
  background: rgba(106, 104, 83, 0.6);
}

.meter-bar.active {
  background: #f9ac20;
  box-shadow: 0 0 4px rgba(249, 172, 32, 0.3);
}

.meter-bar.active:hover {
  background: #fbbf24;
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
</style>
