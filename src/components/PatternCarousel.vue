<template>
  <div class="pattern-carousel">
    <!-- Swipeable container -->
    <div 
      class="carousel-track"
      ref="trackRef"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
      :style="{ transform: `translateX(${translateX}px)` }"
    >
      <div
        v-for="pattern in patterns"
        :key="pattern.id"
        class="pattern-card"
        :class="{ active: pattern.id === selectedPattern }"
        @click="selectPattern(pattern.id)"
      >
        <!-- Pattern visualization -->
        <div class="pattern-visual">
          <svg viewBox="0 0 120 60" class="pattern-svg">
            <!-- Grid reference lines -->
            <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" opacity="0.1" stroke-width="1" />
            
            <!-- Connect notes with line -->
            <polyline
              v-if="pattern.intervals"
              :points="getPathPoints(pattern.intervals)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.3"
              class="pattern-line"
            />
            
            <!-- Note dots (animated on hover) -->
            <circle
              v-for="(interval, idx) in (pattern.intervals || [])"
              :key="idx"
              :cx="10 + (idx / (pattern.intervals.length - 1)) * 100"
              :cy="50 - (interval * 2)"
              :r="interval === 0 ? 4 : 3"
              :class="{ 
                'note-dot': true, 
                'root-dot': interval === 0,
                'animated-dot': true
              }"
              :style="{ animationDelay: `${idx * 0.05}s` }"
            />
          </svg>
        </div>
        
        <!-- Pattern name -->
        <div class="pattern-name">{{ pattern.name }}</div>
        
        <!-- Pattern info -->
        <div class="pattern-info">{{ pattern.intervals?.length || 0 }} notes</div>
      </div>
    </div>

    <!-- Swipe indicators (dots) -->
    <div class="swipe-indicators">
      <button
        v-for="(pattern, idx) in patterns"
        :key="idx"
        class="indicator-dot"
        :class="{ active: pattern.id === selectedPattern }"
        @click="jumpToPattern(idx)"
        :aria-label="`Select ${pattern.name}`"
      />
    </div>

    <!-- Selected pattern name (large display) -->
    <div class="selected-pattern-name">
      {{ selectedPatternName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Pattern {
  id: number
  name: string
  description?: string
  intervals: number[] | null
  useChordType?: boolean
}

const props = defineProps<{
  modelValue: number
  patterns: Pattern[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const selectedPattern = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const selectedPatternName = computed(() => {
  const pattern = props.patterns.find(p => p.id === selectedPattern.value)
  return pattern?.name || ''
})

// Touch/drag handling
const trackRef = ref<HTMLElement | null>(null)
const translateX = ref(0)
const startX = ref(0)
const currentX = ref(0)
const isDragging = ref(false)
const currentIndex = ref(0)

// Calculate card width (120px card + 16px gap)
const cardWidth = 136

watch(selectedPattern, (newVal) => {
  const index = props.patterns.findIndex(p => p.id === newVal)
  if (index !== -1) {
    currentIndex.value = index
    updatePosition()
  }
})

function updatePosition() {
  // Center the selected card
  const containerWidth = trackRef.value?.parentElement?.clientWidth || 0
  const offset = (containerWidth / 2) - (cardWidth / 2)
  translateX.value = offset - (currentIndex.value * cardWidth)
}

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  startX.value = e.touches[0].clientX
  currentX.value = translateX.value
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const delta = e.touches[0].clientX - startX.value
  translateX.value = currentX.value + delta
}

function handleTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  
  // Snap to nearest card
  const delta = translateX.value - currentX.value
  if (Math.abs(delta) > 50) {
    if (delta > 0 && currentIndex.value > 0) {
      currentIndex.value--
    } else if (delta < 0 && currentIndex.value < props.patterns.length - 1) {
      currentIndex.value++
    }
  }
  
  updatePosition()
  selectedPattern.value = props.patterns[currentIndex.value].id
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  startX.value = e.clientX
  currentX.value = translateX.value
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    const delta = e.clientX - startX.value
    translateX.value = currentX.value + delta
  }
  
  const handleMouseUp = () => {
    handleTouchEnd()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function selectPattern(id: number) {
  selectedPattern.value = id
}

function jumpToPattern(index: number) {
  currentIndex.value = index
  updatePosition()
  selectedPattern.value = props.patterns[index].id
}

function getPathPoints(intervals: number[]): string {
  return intervals
    .map((interval, idx) => {
      const x = 10 + (idx / (intervals.length - 1)) * 100
      const y = 50 - (interval * 2)
      return `${x},${y}`
    })
    .join(' ')
}
</script>

<style scoped>
.pattern-carousel {
  width: 100%;
  overflow: hidden;
  padding: 1rem 0;
}

.carousel-track {
  display: flex;
  gap: 1rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  touch-action: pan-y;
  cursor: grab;
}

.carousel-track:active {
  cursor: grabbing;
}

.pattern-card {
  flex-shrink: 0;
  width: 120px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.pattern-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(249, 172, 32, 0.3);
  transform: translateY(-2px);
}

.pattern-card.active {
  background: rgba(249, 172, 32, 0.15);
  border-color: var(--accent-highlight);
  box-shadow: 0 0 20px rgba(249, 172, 32, 0.2);
}

.pattern-visual {
  height: 60px;
  margin-bottom: 0.75rem;
}

.pattern-svg {
  width: 100%;
  height: 100%;
  color: var(--accent-highlight);
}

.note-dot {
  fill: var(--accent-highlight);
  stroke: var(--accent-highlight);
  stroke-width: 0.5;
  transition: all 0.3s ease;
}

.root-dot {
  fill: var(--accent-bright);
  filter: drop-shadow(0 0 3px var(--accent-highlight));
}

.pattern-card:hover .animated-dot {
  animation: pulse-dot 0.6s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.8; }
}

.pattern-line {
  transition: all 0.3s ease;
}

.pattern-card:hover .pattern-line {
  opacity: 0.6;
  stroke-width: 2;
}

.pattern-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 0.25rem;
}

.pattern-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
  opacity: 0.6;
}

.swipe-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.2);
}

.indicator-dot.active {
  background: var(--accent-highlight);
  width: 24px;
  border-radius: 4px;
}

.selected-pattern-name {
  text-align: center;
  margin-top: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-highlight);
  min-height: 1.5rem;
}
</style>
