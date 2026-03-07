<template>
  <div class="pattern-selector">
    <div class="patterns-grid">
      <div 
        v-for="pattern in patterns" 
        :key="pattern.number"
        class="pattern-item"
        :class="{ 
          current: current !== undefined && pattern.number === current,
          active: pattern.number >= min && pattern.number <= max,
          dimmed: pattern.number < min || pattern.number > max
        }"
      >
        <img :src="pattern.icon" :alt="pattern.name" />
        <div v-if="current !== undefined && pattern.number === current" class="current-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const BASE_PATH = import.meta.env.BASE_URL || '/'

const props = defineProps<{
  min: number     // 1-6: minimum pattern in cycle range
  max: number     // 1-6: maximum pattern in cycle range
  current?: number // 1-6: currently selected pattern (optional)
}>()

interface Pattern {
  number: number
  name: string
  icon: string  // SVG file path
}

// Pattern definitions using SVG icons from public folder
const patterns = computed<Pattern[]>(() => [
  {
    number: 1,
    name: 'Up',
    icon: `${BASE_PATH}up.svg`
  },
  {
    number: 2,
    name: 'Down',
    icon: `${BASE_PATH}down.svg`
  },
  {
    number: 3,
    name: 'Bounce',
    icon: `${BASE_PATH}bounce.svg`
  },
  {
    number: 4,
    name: 'Inclusive',
    icon: `${BASE_PATH}inclusive.svg`
  },
  {
    number: 5,
    name: 'Exclusive',
    icon: `${BASE_PATH}exclusive.svg`
  },
  {
    number: 6,
    name: 'Random',
    icon: `${BASE_PATH}random.svg`
  }
])
</script>

<style scoped>
.pattern-selector {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(26, 26, 26, 0.4);
  border-radius: 4px;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  width: 100%;
  align-items: center;
  justify-items: center;
}

.pattern-item {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.pattern-item img {
  width: 90%;
  height: auto;
  object-fit: contain;
  display: block;
  filter: brightness(0.5) sepia(1) saturate(0.5) hue-rotate(20deg);
}

.pattern-item.active {
  opacity: 1;
}

.pattern-item.dimmed {
  opacity: 0.3;
}

.pattern-item.current img {
  filter: brightness(1) sepia(0) saturate(1);
  opacity: 1;
}

.current-indicator {
  position: absolute;
  bottom: -8px;
  width: 8px;
  height: 8px;
  background: #ff6b35;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 107, 53, 0.6);
}

.pattern-item {
  position: relative;
}

@media (max-width: 768px) {
  .patterns-grid {
    gap: 0.35rem;
  }
}
</style>
