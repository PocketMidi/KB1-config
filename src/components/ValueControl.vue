<template>
  <div class="value-control" :class="{ disabled }">
    <div class="input-wrapper">
      <div 
        class="tap-zone tap-zone-left"
        :class="{ disabled: leftDisabled || (!onLeftClick && isAtMin) || disabled }"
        @click="decreaseSmall"
        :title="`Decrease by ${smallStep}`"
      >
        <span class="tap-indicator">{{ leftLabel }}</span>
      </div>
      <input
        type="text"
        class="value-input"
        :value="displayValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :readonly="readOnly"
        @input="handleInput"
        @blur="validateAndUpdate"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @dblclick="handleDoubleClick"
        :title="resetValue !== undefined ? `Double-click to reset to ${resetValue}` : ''"
      />
      <div 
        class="tap-zone tap-zone-right"
        :class="{ disabled: rightDisabled || (!onRightClick && isAtMax) || disabled }"
        @click="increaseSmall"
        :title="`Increase by ${smallStep}`"
      >
        <span class="tap-indicator">{{ rightLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useHaptics } from '../composables/useHaptics'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  smallStep?: number
  largeStep?: number
  disabled?: boolean
  resetValue?: number  // Optional reset value for double-click
  leftLabel?: string   // Custom label for left button (default: "−")
  rightLabel?: string  // Custom label for right button (default: "+")
  readOnly?: boolean   // Make input field read-only (buttons/drag still work)
  onLeftClick?: () => void   // Custom handler for left button
  onRightClick?: () => void  // Custom handler for right button
  dragMapper?: (percentage: number) => number  // Map position (0-100%) to value (replaces delta drag)
  displayFormatter?: (value: number) => string  // Optional formatter for display value
  leftDisabled?: boolean   // Explicitly disable left button
  rightDisabled?: boolean  // Explicitly disable right button
}>(), {
  min: 0,
  max: 100,
  step: 1,
  smallStep: 5,
  largeStep: 10,
  disabled: false,
  resetValue: undefined,
  leftLabel: '−',
  rightLabel: '+',
  readOnly: false,
  onLeftClick: undefined,
  onRightClick: undefined,
  dragMapper: undefined,
  displayFormatter: undefined,
  leftDisabled: false,
  rightDisabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Drag tracking
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartValue = ref(0)
const lastHapticValue = ref(0)
const dragTarget = ref<HTMLElement | null>(null)

const { light, tap, isSupported } = useHaptics()

const isAtMin = computed(() => props.modelValue <= props.min)
const isAtMax = computed(() => props.modelValue >= props.max)

const displayValue = computed(() => {
  return props.displayFormatter ? props.displayFormatter(props.modelValue) : String(props.modelValue)
})

function clamp(value: number): number {
  return Math.max(props.min, Math.min(props.max, value))
}

function snapToStep(value: number): number {
  return Math.round(value / props.step) * props.step
}

function decreaseSmall() {
  if (isSupported.value) tap()
  if (props.onLeftClick) {
    props.onLeftClick()
  } else {
    const newValue = snapToStep(props.modelValue - props.smallStep)
    emit('update:modelValue', clamp(newValue))
  }
}

function increaseSmall() {
  if (isSupported.value) tap()
  if (props.onRightClick) {
    props.onRightClick()
  } else {
    const newValue = snapToStep(props.modelValue + props.smallStep)
    emit('update:modelValue', clamp(newValue))
  }
}

function handleInput(event: Event) {
  if (props.readOnly) return // Block typing when read-only
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  if (!isNaN(value)) {
    emit('update:modelValue', clamp(snapToStep(value)))
  }
}

function validateAndUpdate(event: Event) {
  if (props.readOnly) return // Block validation when read-only
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  if (isNaN(value)) {
    target.value = String(props.modelValue)
  } else {
    const clamped = clamp(snapToStep(value))
    target.value = String(clamped)
    emit('update:modelValue', clamped)
  }
}

// Mouse wheel scroll support
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  const change = delta * props.smallStep
  const newValue = snapToStep(props.modelValue + change)
  
  // Haptic only when value actually changes (skip on iOS)
  if (isSupported.value && newValue !== props.modelValue) {
    light()
  }
  
  emit('update:modelValue', clamp(newValue))
}

// Mouse drag support
function handleMouseDown(event: MouseEvent) {
  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartValue.value = props.modelValue
  lastHapticValue.value = props.modelValue
  dragTarget.value = event.target as HTMLElement
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  
  let newValue: number
  
  if (props.dragMapper && dragTarget.value) {
    // Position-based drag: map cursor position to value
    const rect = dragTarget.value.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    newValue = props.dragMapper(percentage)
  } else {
    // Delta-based drag: movement distance determines change
    const deltaX = event.clientX - dragStartX.value
    const steps = Math.round(deltaX / 5)
    const change = steps * props.step
    newValue = snapToStep(dragStartValue.value + change)
  }
  
  // Haptic on every step change during drag (skip on iOS)
  if (isSupported.value && newValue !== lastHapticValue.value) {
    light()
    lastHapticValue.value = newValue
  }
  
  emit('update:modelValue', clamp(newValue))
}

function handleMouseUp() {
  isDragging.value = false
  dragTarget.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Touch gesture support (horizontal drag)
function handleTouchStart(event: TouchEvent) {
  if (!event.touches[0]) return
  isDragging.value = true
  dragStartX.value = event.touches[0].clientX
  dragStartValue.value = props.modelValue
  lastHapticValue.value = props.modelValue
  dragTarget.value = event.target as HTMLElement
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || !event.touches[0]) return
  event.preventDefault()
  
  let newValue: number
  
  if (props.dragMapper && dragTarget.value) {
    // Position-based drag: map touch position to value
    const rect = dragTarget.value.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((event.touches[0].clientX - rect.left) / rect.width) * 100))
    newValue = props.dragMapper(percentage)
  } else {
    // Delta-based drag: movement distance determines change
    const deltaX = event.touches[0].clientX - dragStartX.value
    const steps = Math.round(deltaX / 5)
    const change = steps * props.step
    newValue = snapToStep(dragStartValue.value + change)
  }
  
  // Haptic on every step change during touch drag (skip on iOS)
  if (isSupported.value && newValue !== lastHapticValue.value) {
    light()
    lastHapticValue.value = newValue
  }
  
  emit('update:modelValue', clamp(newValue))
}

function handleTouchEnd() {
  isDragging.value = false
  dragTarget.value = null
}

// Double-click to reset to default value
function handleDoubleClick() {
  if (props.resetValue !== undefined && !props.disabled) {
    if (isSupported.value) tap()
    emit('update:modelValue', clamp(snapToStep(props.resetValue)))
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.value-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.value-control.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.value-control.disabled .value-input {
  color: #666;
  cursor: not-allowed;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 90px;
  height: 24px; /* Fixed height */
}

.tap-zone {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 100%;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
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
  font-size: 0.75rem; /* 12px - smaller arrows */
  font-family: 'Roboto Mono';
  color: #EAEAEA;
  opacity: 1.0;
  transition: opacity 0.2s;
  user-select: none;
  pointer-events: none; /* Let clicks pass through to parent tap-zone */
}

.value-input {
  width: 100%;
  height: 100%;
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
  position: relative;
  z-index: 1;
  /* Aggressive iOS Safari number input suppression */
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  appearance: none !important;
}

.value-input::-webkit-textfield-decoration-container {
  display: none !important;
}

.value-input::-webkit-contacts-auto-fill-button,
.value-input::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.value-input:focus {
  outline: none;
}

/* Hide number input spinners */
.value-input::-webkit-inner-spin-button,
.value-input::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  margin: 0 !important;
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.value-input[type=number] {
  -moz-appearance: textfield !important;
  appearance: none !important;
  -webkit-appearance: none !important;
}
</style>
