<template>
  <svg width="583" height="128" viewBox="0 0 583 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path :opacity="isBipolar ? 0.9 : 0.7" :d="shapePath" :fill="gradientUrl"/>
    
    <!-- Grid lines -->
    <ProfileGrid />
    
    <!-- Animated dot(s) -->
    <circle v-if="!isBipolar" cx="0" cy="0" r="3.0" fill="#F9AC20">
      <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 1 1">
        <mpath :href="`#exp-curve-uni-${uid}`"/>
      </animateMotion>
    </circle>
    
    <!-- Bipolar: two dots -->
    <template v-else>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 1 1">
          <mpath :href="`#exp-curve-left-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.2s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 1 1">
          <mpath :href="`#exp-curve-right-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation paths -->
      <path v-if="!isBipolar" :id="`exp-curve-uni-${uid}`" d="M16 117 C135.5 117 233.5 51.649 291.5 0 C348.658 50.034 447 117 567 117"/>
      <template v-else>
        <path :id="`exp-curve-left-${uid}`" d="M291.5 118 C165.343 118 43.4085 52.9942 16 0"/>
        <path :id="`exp-curve-right-${uid}`" d="M291.5 118 C444.934 118 541.053 50.1679 567 0"/>
      </template>
      
      <!-- Gradients -->
      <linearGradient v-if="!isBipolar" :id="`exp-gradient-uni-${uid}`" x1="16" y1="62" x2="567" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
      <radialGradient v-else :id="`exp-gradient-bi-${uid}`" cx="0" cy="0" r="1" gradientTransform="matrix(-321.506 -46.3571 -51.6213 201.959 291.5 46.3571)" gradientUnits="userSpaceOnUse">
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
    // Bipolar: exponential curves from both sides
    return 'M16 118V0C43.4085 52.9942 165.343 118 291.5 118C444.934 118 541.053 50.1679 567 0V118H291.5H16Z'
  } else {
    // Unipolar: exponential curve from left to right
    return 'M16 117V0C135.5 0 233.5 51.649 291.5 117C348.658 50.034 447 0 567 0V117H291.5H16Z'
  }
})

const gradientUrl = computed(() => 
  props.isBipolar ? `url(#exp-gradient-bi-${uid})` : `url(#exp-gradient-uni-${uid})`
)
</script>
