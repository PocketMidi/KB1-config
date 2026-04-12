<template>
  <div class="level-meter">
    <!-- Dots/Triangles container -->
    <div 
      class="markers-container"
      @mousedown="handleMarkerMouseDown"
      @touchstart="handleMarkerTouchStart"
    >
      <!-- Reset mode: triangles -->
      <template v-if="mode === 'reset'">
        <div 
          v-for="(marker, index) in markers" 
          :key="index"
          class="triangle"
          :class="{ highlighted: marker.highlighted }"
          :style="{ left: `${marker.position}%` }"
        ></div>
      </template>
      <!-- Range mode: dots -->
      <template v-else>
        <div 
          v-for="(marker, index) in markers" 
          :key="index"
          class="dot"
          :style="{ 
            left: `${marker.position}%`,
            opacity: marker.highlighted ? 1 : 0.4
          }"
        ></div>
      </template>
    </div>
    
    <!-- Labels container -->
    <div class="labels-container">
      <span 
        v-for="label in labels" 
        :key="label.value"
        class="label"
        :style="{ left: `${label.position}%` }"
      >
        {{ label.text }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHaptics } from '../composables/useHaptics'

const props = withDefaults(defineProps<{
  min: number
  max: number
  isBipolar: boolean
  mode?: 'range' | 'reset'
  value?: number
  minAllowed?: number  // Dynamic minimum for KB1 Expression parameters
  maxAllowed?: number  // Dynamic maximum for KB1 Expression parameters (e.g., Pattern 1-7)
  stepSize?: number    // Step increment for snapping values (e.g., 5, 10, 15, 25)
}>(), {
  mode: 'range',
  value: 70,
  stepSize: 1
})

const emit = defineEmits<{
  'update:min': [value: number]
  'update:max': [value: number]
  'update:value': [value: number]
}>()

// Haptics
const { light, isSupported } = useHaptics()
const lastHapticValue = ref<number | null>(null)

// Buffer between min and max to prevent visual overlap (at least 5 units)
const MIN_MAX_BUFFER = 5

// Direct marker interaction handlers
const updateValueFromPosition = (clientX: number, rect: DOMRect) => {
  const rangeMin = props.minAllowed ?? (props.isBipolar ? -100 : 0)
  const rangeMax = props.maxAllowed ?? 100
  const rangeSpan = rangeMax - rangeMin
  
  const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  const clickedValue = rangeMin + (percentage / 100) * rangeSpan
  
  // Snap to step size
  const snappedValue = Math.round(clickedValue / props.stepSize) * props.stepSize
  
  // Haptic feedback on dots: trigger every 5 units (or step size if larger)
  const dotInterval = Math.max(5, props.stepSize)
  const currentDot = Math.round(snappedValue / dotInterval)
  const lastDot = lastHapticValue.value !== null ? Math.round(lastHapticValue.value / dotInterval) : null
  const crossedDot = currentDot !== lastDot
  
  if (props.mode === 'reset') {
    // In reset mode, update the single value
    const newValue = Math.round(snappedValue)
    emit('update:value', newValue)
    if (isSupported.value && crossedDot) {
      light()
      lastHapticValue.value = snappedValue
    }
  } else {
    // In range mode, update whichever is closer (min or max)
    const distToMin = Math.abs(snappedValue - props.min)
    const distToMax = Math.abs(snappedValue - props.max)
    
    if (distToMin < distToMax) {
      // Update min, but maintain buffer from max
      const newMin = Math.min(Math.round(snappedValue), props.max - MIN_MAX_BUFFER)
      emit('update:min', newMin)
      if (isSupported.value && crossedDot) {
        light()
        lastHapticValue.value = snappedValue
      }
    } else {
      // Update max, but maintain buffer from min
      const newMax = Math.max(Math.round(snappedValue), props.min + MIN_MAX_BUFFER)
      emit('update:max', newMax)
      if (isSupported.value && crossedDot) {
        light()
        lastHapticValue.value = snappedValue
      }
    }
  }
}

const handleMarkerMouseDown = (e: MouseEvent) => {
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

const handleMarkerTouchStart = (e: TouchEvent) => {
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

interface Marker {
  position: number
  value: number
  highlighted: boolean
}

interface Label {
  value: number
  position: number
  text: string
}

// Generate markers (dots or triangles) based on mode and polarity
const markers = computed<Marker[]>(() => {
  const rangeMin = props.minAllowed ?? (props.isBipolar ? -100 : 0)
  const rangeMax = props.maxAllowed ?? 100
  const rangeSpan = rangeMax - rangeMin
  
  // Special case: Pattern Selector (1-6) shows exactly 6 dots
  const isPatternSelector = rangeMin === 1 && rangeMax === 6
  
  const result: Marker[] = []
  
  if (isPatternSelector) {
    // Pattern selector: align with icon grid centers
    const gridCenters = [8.33, 25, 41.67, 58.33, 75, 91.67]
    for (let i = 0; i < 6; i++) {
      const position = gridCenters[i] || 0
      const value = rangeMin + ((position / 100) * rangeSpan)
      
      let highlighted = false
      if (props.mode === 'reset') {
        const distanceToValue = Math.abs(value - props.value)
        highlighted = distanceToValue <= 0.5
      } else {
        const distanceToMin = Math.abs(value - props.min)
        const distanceToMax = Math.abs(value - props.max)
        highlighted = distanceToMin <= 0.5 || distanceToMax <= 0.5
      }
      
      result.push({ position, value, highlighted })
    }
  } else {
    // Standard mode: Show dots at regular intervals
    // For bipolar: -100, -95, -90... 0... 95, 100 (41 dots, interval=5)
    // For unipolar: 0, 2.5, 5, 7.5... 97.5, 100 (41 dots, interval=2.5)
    // For strum speed (5-360 or -360 to -5): interval=10 (≈36 dots)
    let dotInterval: number
    if (rangeSpan >= 300) {
      // Strum speed range (355): use interval of 10 for ~35-40 dots
      dotInterval = 10
    } else if (props.isBipolar) {
      dotInterval = 5
    } else {
      dotInterval = 2.5
    }
    const startValue = Math.ceil(rangeMin / dotInterval) * dotInterval
    
    for (let value = startValue; value <= rangeMax; value += dotInterval) {
      // Calculate position as percentage within the range
      const position = ((value - rangeMin) / rangeSpan) * 100
      
      let highlighted = false
      
      if (props.mode === 'reset') {
        // Reset mode: highlight only the marker closest to the reset value
        const distanceToValue = Math.abs(value - props.value)
        highlighted = distanceToValue <= 3
      } else {
        // Range mode: highlight markers near min or max
        const distanceToMin = Math.abs(value - props.min)
        const distanceToMax = Math.abs(value - props.max)
        highlighted = distanceToMin <= 6 || distanceToMax <= 6
      }
      
      result.push({ position, value, highlighted })
    }
  }
  
  return result
})

// Generate labels based on polarity
const labels = computed<Label[]>(() => {
  if (props.isBipolar) {
    return [
      { value: -100, position: 0, text: '-100' },
      { value: -50, position: 25, text: '-50' },
      { value: 0, position: 50, text: '0' },
      { value: 50, position: 75, text: '50' },
      { value: 100, position: 100, text: '100' }
    ]
  } else {
    const rangeMin = props.minAllowed ?? 0
    const rangeMax = props.maxAllowed ?? 100
    const rangeSpan = rangeMax - rangeMin
    
    // For small discrete ranges (like Pattern 1-7), show all values
    if (rangeSpan <= 10) {
      const labels: Label[] = []
      for (let i = rangeMin; i <= rangeMax; i++) {
        let position: number
        const index = i - rangeMin
        
        if (rangeMin === 1 && rangeMax === 6) {
          // Pattern selector: align with icon grid centers
          const gridCenters = [8.33, 25, 41.67, 58.33, 75, 91.67]
          position = gridCenters[index] || 0
        } else {
          position = ((i - rangeMin) / rangeSpan) * 100
        }
        
        labels.push({ value: i, position, text: String(i) })
      }
      return labels
    }
    
    // For normal ranges, show 0/25/50/75/100 (or custom min/max)
    // For large ranges (strum speed), round to nearest 5
    const roundValue = rangeSpan >= 300 ? (v: number) => Math.round(v / 5) * 5 : Math.round
    
    return [
      { value: rangeMin, position: 0, text: String(rangeMin) },
      { value: roundValue(rangeMin + rangeSpan * 0.25), position: 25, text: String(roundValue(rangeMin + rangeSpan * 0.25)) },
      { value: roundValue(rangeMin + rangeSpan * 0.5), position: 50, text: String(roundValue(rangeMin + rangeSpan * 0.5)) },
      { value: roundValue(rangeMin + rangeSpan * 0.75), position: 75, text: String(roundValue(rangeMin + rangeSpan * 0.75)) },
      { value: rangeMax, position: 100, text: String(rangeMax) }
    ]
  }
})
</script>

<style scoped>
.level-meter {
  width: 100%;
  padding: 0.5rem 0 0.5rem;
  position: relative;
}

.markers-container {
  position: relative;
  height: 13px;
  width: 100%;
  margin-bottom: 1rem;
  cursor: pointer;
  user-select: none;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--accent-highlight);
  border-radius: 50%;
  transform: translateX(-50%) translateY(4px);
  transition: opacity 0.2s ease;
}

.triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-bottom: 9px solid #4A4A4A;
  transform: translateX(-50%);
  opacity: 0.3;
}

.triangle.highlighted {
  border-bottom-color: var(--accent-highlight);
  opacity: 1;
}

.labels-container {
  position: relative;
  width: 100%;
  height: 20px;
}

.label {
  position: absolute;
  transform: translateX(-50%);
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Adjust first and last labels to prevent overflow */
.label:first-child {
  transform: translateX(0);
}

.label:last-child {
  transform: translateX(-100%);
}

@media (max-width: 768px) {
  .level-meter {
    padding: 0.75rem 0 0.5rem;
  }
  
  .dots-container {
    margin-bottom: 0.75rem;
  }
}
</style>
