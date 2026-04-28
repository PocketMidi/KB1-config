<template>
  <svg width="583" height="128" viewBox="0 0 583 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path :opacity="isBipolar ? 0.9 : 0.7" :d="shapePath" :fill="gradientUrl"/>
    
    <!-- Grid lines -->
    <ProfileGrid />
    
    <!-- Animated dot(s) -->
    <circle v-if="!isBipolar" cx="0" cy="0" r="3.0" fill="#F9AC20">
      <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
        <mpath :href="`#log-curve-uni-${uid}`"/>
      </animateMotion>
    </circle>
    
    <!-- Bipolar: two dots -->
    <template v-else>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#log-curve-left-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#log-curve-right-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation paths -->
      <path v-if="!isBipolar" :id="`log-curve-uni-${uid}`" d="M16 117 C250.538 -7.68259 511.504 6.48582 567 6.48593"/>
      <template v-else>
        <path :id="`log-curve-left-${uid}`" d="M291.5 118 C233.5 22.6491 135.5 6 16 6"/>
        <path :id="`log-curve-right-${uid}`" d="M291.5 118 C348.658 24.0339 447 6 567 6"/>
      </template>
      
      <!-- Gradients -->
      <linearGradient v-if="!isBipolar" :id="`log-gradient-uni-${uid}`" x1="16" y1="61.5" x2="567" y2="61.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
      <radialGradient v-else :id="`log-gradient-bi-${uid}`" cx="0" cy="0" r="1" gradientTransform="matrix(-321.506 -44 -51.6213 191.69 291.5 50)" gradientUnits="userSpaceOnUse">
        <stop offset="0.00164139" stop-color="#615F4C"/>
        <stop offset="0.966346" stop-color="#171713"/>
      </radialGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProfileGrid from './ProfileGrid.vue'

const props = defineProps<{
  isBipolar: boolean
}>()

// Generate unique ID for this instance to avoid ID conflicts
const uid = Math.random().toString(36).substr(2, 9)

const shapePath = computed(() => {
  if (props.isBipolar) {
    // Bipolar: logarithmic curves from both sides
    return 'M16 118V6C135.5 6 233.5 22.6491 291.5 118C348.658 24.0339 447 6 567 6V118H291.5H16Z'
  } else {
    // Unipolar: logarithmic curve from bottom-left to top-right (fast start, slow end)
    return 'M567 117V6.48593C511.504 6.48582 250.538 -7.68259 15.9999 117H567Z'
  }
})

const gradientUrl = computed(() => 
  props.isBipolar ? `url(#log-gradient-bi-${uid})` : `url(#log-gradient-uni-${uid})`
)
</script>
