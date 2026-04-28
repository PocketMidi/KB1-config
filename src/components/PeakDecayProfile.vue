<template>
  <svg width="583" height="129" viewBox="0 0 583 129" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path :opacity="isBipolar ? 0.9 : 0.7" :d="shapePath" :fill="gradientUrl"/>
    
    <!-- Grid lines (adjusted for height 129) -->
    <g>
      <line x1="15.65" y1="129" x2="15.65" y2="1" stroke="#848484" stroke-width="0.7"/>
      <line x1="84.625" y1="129" x2="84.625" y2="1" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
      <line x1="153.4" y1="129" x2="153.4" y2="1" stroke="#848484" stroke-width="0.7"/>
      <line x1="222.375" y1="129" x2="222.375" y2="1" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
      <line x1="291.15" y1="129" x2="291.15" y2="1" stroke="#848484" stroke-width="0.7"/>
      <line x1="360.125" y1="129" x2="360.125" y2="1" stroke="#848484" stroke-width="0.5" stroke-dasharray="6 6"/>
      <line x1="428.9" y1="129" x2="428.9" y2="1" stroke="#848484" stroke-width="0.7"/>
      <line x1="497.875" y1="129" x2="497.875" y2="1" stroke="#848484" stroke-width="0.5" stroke-dasharray="12 12"/>
      <path d="M567 129L567 0.999999" stroke="#848484" stroke-width="0.7"/>
    </g>
    
    <!-- Animated dots -->
    <circle v-if="!isBipolar" cx="0" cy="0" r="3.0" fill="#F9AC20">
      <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
        <mpath :href="`#pd-curve-uni-${uid}`"/>
      </animateMotion>
    </circle>
    
    <!-- Bipolar: two dots -->
    <template v-else>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#pd-curve-left-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#pd-curve-right-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation paths -->
      <path v-if="!isBipolar" :id="`pd-curve-uni-${uid}`" d="M291.5 0 C319 138 409 106.5 567 119"/>
      <template v-else>
        <path :id="`pd-curve-left-${uid}`" d="M277.5 0 C261.5 134 102 110 16 119"/>
        <path :id="`pd-curve-right-${uid}`" d="M305 0 C319 138 409 106.5 567 119"/>
      </template>
      
      <!-- Gradients -->
      <linearGradient v-if="!isBipolar" :id="`pd-gradient-uni-${uid}`" x1="16" y1="62" x2="567" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
      <radialGradient v-else :id="`pd-gradient-bi-${uid}`" cx="0" cy="0" r="1" gradientTransform="matrix(-321.506 -46.75 -51.6213 203.671 291.5 46.75)" gradientUnits="userSpaceOnUse">
        <stop offset="0.00164139" stop-color="#615F4C"/>
        <stop offset="0.966346" stop-color="#171713"/>
      </radialGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isBipolar: boolean
}>()

// Generate unique ID for this instance to avoid ID conflicts
const uid = Math.random().toString(36).substr(2, 9)

const shapePath = computed(() => {
  if (props.isBipolar) {
    // Bipolar: peak & decay from both sides
    return 'M291.5 119H16C102 110 261.5 134 277.5 0C277.5 0 280 100.5 291.5 119C303.5 99.5 305 0 305 0C319 138 409 106.5 567 119H291.5Z'
  } else {
    // Unipolar: peak & decay from center to right
    return 'M291.5 119V0C319 138 409 106.5 567 119H291.5Z'
  }
})

const gradientUrl = computed(() => 
  props.isBipolar ? `url(#pd-gradient-bi-${uid})` : `url(#pd-gradient-uni-${uid})`
)
</script>
