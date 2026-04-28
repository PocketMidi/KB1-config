<template>
  <svg width="583" height="62" viewBox="0 0 583 62" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Staircase path -->
    <path opacity="0.7" :d="staircasePath" :fill="gradientUrl"/>
    
    <!-- Grid lines (height 62) -->
    <g>
      <line x1="15.65" y1="62" x2="15.65" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
      <line x1="84.625" y1="62" x2="84.625" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
      <line x1="153.4" y1="62" x2="153.4" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
      <line x1="222.375" y1="62" x2="222.375" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
      <line x1="291.15" y1="62" x2="291.15" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
      <line x1="360.125" y1="62" x2="360.125" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
      <line x1="428.9" y1="62" x2="428.9" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
      <line x1="497.875" y1="62" x2="497.875" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
      <path d="M567 62L567 0" stroke="#848484" stroke-width="0.7"/>
    </g>
    
    <defs>
      <linearGradient :id="`inc-gradient-press-${uid}`" x1="16" y1="29" x2="567" y2="29" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  steps: number      // Firmware step size or direct visual count
}>()

// Generate unique ID for this instance to avoid ID conflicts
const uid = Math.random().toString(36).substr(2, 9)

// Map firmware step sizes to visual step counts (same as lever version)
const visualSteps = computed(() => {
  const stepSizeToVisualSteps: Record<number, number> = {
    2: 20,
    4: 16,
    6: 20,
    8: 12,
    12: 10,
    16: 9,
    20: 7,
    32: 4
  }
  return stepSizeToVisualSteps[props.steps] ?? props.steps
})

const staircasePath = computed(() => {
  const steps = visualSteps.value
  
  // SVG dimensions (press version is shorter)
  const startX = 16
  const endX = 567
  const width = endX - startX
  const bottomY = 52  // Bottom of profile
  const topY = 6      // Top of profile
  const height = bottomY - topY
  
  // Unipolar only: ascending staircase from left to right
  const stepWidth = width / steps
  const stepHeight = height / steps
  
  // Start at bottom right, go to bottom left
  let path = `M${endX} ${bottomY}H${startX}V${bottomY - stepHeight}`
  
  // Draw steps from left to right, bottom to top
  for (let i = 0; i < steps; i++) {
    const y = bottomY - ((i + 1) * stepHeight)
    const x = startX + ((i + 1) * stepWidth)
    path += `H${x.toFixed(3)}`
    if (i < steps - 1) {
      path += `V${y.toFixed(3)}`
    }
  }
  
  // Close the path back to start
  path += `V${bottomY}H${endX}Z`
  
  return path
})

const gradientUrl = computed(() => `url(#inc-gradient-press-${uid})`)
</script>
