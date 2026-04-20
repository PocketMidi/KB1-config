<template>
  <svg width="583" height="128" viewBox="0 0 583 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Grid lines -->
    <line x1="15.65" y1="128" x2="15.65" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
    <line x1="84.625" y1="128" x2="84.625" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
    <line x1="153.4" y1="128" x2="153.4" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
    <line x1="222.375" y1="128" x2="222.375" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
    <line x1="291.15" y1="128" x2="291.15" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
    <line x1="360.125" y1="128" x2="360.125" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
    <line x1="428.9" y1="128" x2="428.9" y2="-1.5299e-08" stroke="#848484" stroke-width="0.7"/>
    <line x1="497.875" y1="128" x2="497.875" y2="-1.09278e-08" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
    <path d="M567 128L567 -1.3113e-06" stroke="#848484" stroke-width="0.7"/>
    
    <!-- Staircase path -->
    <path :opacity="isBipolar ? 0.9 : 0.7" :d="staircasePath" :fill="gradientUrl"/>
    
    <!-- Gradients -->
    <defs>
      <linearGradient v-if="!isBipolar" id="inc-gradient-uni" x1="16" y1="62" x2="567" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
      <radialGradient v-else id="inc-gradient-bi" cx="0" cy="0" r="1" gradientTransform="matrix(321.506 -44.3929 51.6213 193.402 291.5 49.3929)" gradientUnits="userSpaceOnUse">
        <stop offset="0.00164139" stop-color="#615F4C"/>
        <stop offset="0.966346" stop-color="#171713"/>
      </radialGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  steps: number      // Firmware step size: 2, 4, 8, 16, 32 OR direct visual count (6, 15, 21)
  isBipolar: boolean // true for bi mode, false for uni mode
}>()

const gradientUrl = computed(() => 
  props.isBipolar ? 'url(#inc-gradient-bi)' : 'url(#inc-gradient-uni)'
)

// Map firmware step sizes to visual step counts for better appearance
// Display % → Firmware → Visual Steps:
// 5%  → firmware 6  → 20 visual steps (finest/most steps)
// 10% → firmware 12 → 10 visual steps
// 15% → firmware 20 → 7 visual steps
// 25% → firmware 32 → 4 visual steps (coarsest/fewest steps)
// If steps value is not in the mapping, use it directly (for discrete parameters)
const visualSteps = computed(() => {
  const stepSizeToVisualSteps: Record<number, number> = {
    2: 20,   // firmware stepSize 2 → 20 visual steps
    4: 16,   // firmware stepSize 4 → 16 visual steps
    6: 20,   // firmware stepSize 6 (5% display) → 20 visual steps
    8: 12,   // firmware stepSize 8 → 12 visual steps
    12: 10,  // firmware stepSize 12 (10% display) → 10 visual steps
    16: 9,   // firmware stepSize 16 → 9 visual steps
    20: 7,   // firmware stepSize 20 (15% display) → 7 visual steps
    32: 4    // firmware stepSize 32 (25% display) → 4 visual steps
  }
  // If value is in mapping, use mapped value; otherwise use direct value (for discrete params)
  return stepSizeToVisualSteps[props.steps] ?? props.steps
})

const staircasePath = computed(() => {
  const steps = visualSteps.value
  const isBi = props.isBipolar
  
  // SVG dimensions
  const startX = 16
  const endX = 567
  const width = endX - startX
  const bottomY = 118
  const topY = 6
  const height = bottomY - topY
  
  if (isBi) {
    // Bipolar: split in half, mirror staircases from center
    const centerX = 291.15
    const halfSteps = steps
    const leftWidth = centerX - startX
    const rightWidth = endX - centerX
    const stepWidthLeft = leftWidth / halfSteps
    const stepWidthRight = rightWidth / halfSteps
    const stepHeight = height / halfSteps
    
    // Start at bottom left, go to center, then right edge
    let path = `M${startX} ${bottomY}L${centerX} ${bottomY}H${endX}V${topY}`
    
    // Right side: descending staircase from top
    for (let i = 0; i < halfSteps; i++) {
      const x = endX - ((i + 1) * stepWidthRight)
      const y = topY + (i * stepHeight)
      path += `H${x.toFixed(3)}V${(y + stepHeight).toFixed(3)}`
    }
    
    // Connect to center bottom
    path += `V${bottomY}H${centerX}`
    
    // Left side: descending staircase from bottom to top
    for (let i = 0; i < halfSteps; i++) {
      const y = bottomY - ((i + 1) * stepHeight)
      const x = centerX - ((i + 1) * stepWidthLeft)
      path += `V${y.toFixed(3)}H${x.toFixed(3)}`
    }
    
    // Close path
    path += `V${bottomY}H${startX}Z`
    
    return path
  } else {
    // Unipolar: ascending staircase from left to right
    const stepWidth = width / steps
    const stepHeight = height / steps
    
    // Start at bottom right, go to bottom left
    let path = `M${endX} ${bottomY}H${startX}`
    
    // Draw steps from left to right, bottom to top
    for (let i = 0; i < steps; i++) {
      const y = bottomY - ((i + 1) * stepHeight)
      const x = startX + ((i + 1) * stepWidth)
      path += `V${y.toFixed(3)}H${x.toFixed(3)}`
    }
    
    // Close the path back to start
    path += `V${bottomY}H${endX}Z`
    
    return path
  }
})
</script>
