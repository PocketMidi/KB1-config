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
    <div class="keyboard-visual" :class="{ 'chromatic-mode': isChromatic }">
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
            'chromatic-disabled': isChromatic
          }"
          @click="handleKeyClick(note.midi)"
          :title="`Set root note to ${note.name}`"
        >
          <div class="note-label">{{ note.name }}</div>
        </div>
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
          
          <!-- Strum: Dynamic Spacing Dots -->
          <div v-else class="strum-dynamic-dots">
            <div 
              v-for="i in 13" 
              :key="i" 
              class="dot"
              :style="{ left: `${(i - 1) * dotSpacing}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Smart Slider Controls -->
      <div class="smart-slider-section">
        <div class="group">
          <label>{{ smartSliderLabel }}</label>
          <div class="duration-control-wrapper">
            <ValueControl
              v-model="smartSliderValue"
              :min="smartSliderMin"
              :max="smartSliderMax"
              :step="1"
              :small-step="5"
              :large-step="10"
            />
            <span class="unit-label">{{ smartSliderUnit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Type/Root Note Selectors -->
    <div class="inputs">
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
      <div class="input-divider"></div>

      <div class="group">
        <label>ROOT NOTE</label>
        <NotePickerControl
          v-model.number="rootNoteValue"
          :notes="rootNotes"
          :disabled="isChromatic"
        />
      </div>
    </div>

    <!-- Scale/Chord Type Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="typeValue"
      v-model:isOpen="typePickerOpen"
      :options="typeOptions"
      :trigger-el="typeTriggerRef"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NotePickerControl from './NotePickerControl.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import ValueControl from './ValueControl.vue'

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
}, { immediate: true })

const selectedTypeLabel = computed(() => {
  const option = typeOptions.value.find(o => o.value === typeValue.value)
  return option?.label || 'Unknown'
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
const smartSliderValue = computed({
  get: () => isChordStyle.value ? model.value.chord.velocitySpread : model.value.chord.strumSpeed,
  set: (v: number) => {
    const updated = { ...model.value }
    if (isChordStyle.value) {
      updated.chord = { ...updated.chord, velocitySpread: v }
    } else {
      updated.chord = { ...updated.chord, strumSpeed: v }
    }
    emit('update:modelValue', updated)
  }
})

const smartSliderMin = computed(() => isChordStyle.value ? 8 : 5)
const smartSliderMax = computed(() => 100)

const smartSliderLabel = computed(() => {
  return isChordStyle.value ? 'VELOCITY SPREAD' : 'STRUM SPEED'
})

const smartSliderUnit = computed(() => {
  return isChordStyle.value ? '%' : 'ms'
})

const sliderPercentage = computed(() => {
  const range = smartSliderMax.value - smartSliderMin.value
  const value = smartSliderValue.value - smartSliderMin.value
  return (value / range) * 100
})

// Visual spread percentage with minimum gap for chord mode
const visualSpread = computed(() => {
  if (!isChordStyle.value) return sliderPercentage.value
  
  // Remap slider percentage (0-100) to visual spread (15-100)
  // This ensures a minimum 15% visual gap even at 8% slider value
  const minVisual = 15
  const maxVisual = 100
  return minVisual + (sliderPercentage.value / 100) * (maxVisual - minVisual)
})

// Dynamic dot spacing for strum mode (faster = tighter, slower = wider)
const dotSpacing = computed(() => {
  // Speed range: 5ms (fast/tight) to 100ms (slow/wide)
  // sliderPercentage: 0% at 5ms, 100% at 100ms
  // Map to spacing: minimum 1.5% (always visible) to 7% (spread out)
  const minSpacing = 1.5
  const maxSpacing = 7
  return minSpacing + (sliderPercentage.value / 100) * (maxSpacing - minSpacing)
})

// Create banded velocity visualization (center-out)
function createVelocityBands(spreadPercent: number): string {
  const baseColor = '249, 172, 32' // --accent-highlight (#F9AC20) RGB
  
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
    const opacity = 0.3 + (i / numDarkBands) * 0.6
    
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
    const opacity = 0.9 - (i / numDarkBands) * 0.6
    
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
    
    // Reverse map visual spread (15-100) to slider percentage (0-100)
    const minVisual = 15
    const maxVisual = 100
    const sliderPerc = Math.max(0, Math.min(100, ((visualSpreadValue - minVisual) / (maxVisual - minVisual)) * 100))
    
    // Convert slider percentage to actual slider value
    const range = smartSliderMax.value - smartSliderMin.value
    const newValue = Math.round(smartSliderMin.value + (sliderPerc / 100) * range)
    smartSliderValue.value = Math.max(smartSliderMin.value, Math.min(smartSliderMax.value, newValue))
  } else {
    // Strum mode: linear mapping
    const range = smartSliderMax.value - smartSliderMin.value
    const newValue = Math.round(smartSliderMin.value + (percentage / 100) * range)
    smartSliderValue.value = Math.max(smartSliderMin.value, Math.min(smartSliderMax.value, newValue))
  }
}

const handleVisualizationMouseDown = (e: MouseEvent) => {
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

// Handle keyboard key clicks to set root note
function handleKeyClick(midiNote: number) {
  // Emit warning when trying to change root in Chromatic mode
  if (isChromatic.value) {
    emit('chromaticWarning', 'Default mapping')
    return
  }
  
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

.key.active {
  background-color: #0BA873;
  color: #0F0F0F;
}

.key.root-note {
  box-shadow:
    inset 0 0 0 2px #0F0F0F,
    0 0 0 1px var(--accent-highlight);
  animation: root-note-pulse 2s ease-in-out infinite;
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
  animation: chord-shimmer 4s ease-in-out infinite;
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
  width: 2px;
  height: calc(100% + 8px);
  background: var(--accent-highlight);
  opacity: 1;
  transform: translateX(-1px);
  pointer-events: none;
  z-index: 10;
  filter: brightness(1.5);
}

/* Strum: Dynamic Spacing Dots */
.strum-dynamic-dots {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.strum-dynamic-dots .dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent-highlight);
  transition: left 0.2s ease;
  transform: translateX(-50%);
  animation: strum-cascade 1.8s ease-in-out infinite;
}

.strum-dynamic-dots .dot:nth-child(1) { animation-delay: 0s; }
.strum-dynamic-dots .dot:nth-child(2) { animation-delay: 0.12s; }
.strum-dynamic-dots .dot:nth-child(3) { animation-delay: 0.24s; }
.strum-dynamic-dots .dot:nth-child(4) { animation-delay: 0.36s; }
.strum-dynamic-dots .dot:nth-child(5) { animation-delay: 0.48s; }
.strum-dynamic-dots .dot:nth-child(6) { animation-delay: 0.6s; }
.strum-dynamic-dots .dot:nth-child(7) { animation-delay: 0.72s; }
.strum-dynamic-dots .dot:nth-child(8) { animation-delay: 0.84s; }
.strum-dynamic-dots .dot:nth-child(9) { animation-delay: 0.96s; }
.strum-dynamic-dots .dot:nth-child(10) { animation-delay: 1.08s; }
.strum-dynamic-dots .dot:nth-child(11) { animation-delay: 1.2s; }
.strum-dynamic-dots .dot:nth-child(12) { animation-delay: 1.32s; }
.strum-dynamic-dots .dot:nth-child(13) { animation-delay: 1.44s; }

@keyframes strum-cascade {
  0%, 100% { 
    opacity: 0.5;
    transform: translateX(-50%) scale(1);
  }
  10% { 
    opacity: 1;
    transform: translateX(-50%) scale(1.5);
  }
  20% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.1);
  }
  30%, 100% {
    opacity: 0.5;
    transform: translateX(-50%) scale(1);
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
</style>
