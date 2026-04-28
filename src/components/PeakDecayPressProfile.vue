<template>
  <svg width="100%" viewBox="0 0 583 62" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path opacity="0.68" d="M567 50H16C23.1171 50 30.7417 34.072 30.7417 2C111.742 45.5 318.5 50 567 50Z" :fill="gradientUrl"/>
    
    <!-- Grid lines -->
    <PressProfileGrid />
    
    <!-- Animated dot(s) -->
    <template v-if="isLatched">
      <!-- Two dots traveling opposite directions for latched mode -->
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#pd-curve-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#pd-curve-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    <template v-else>
      <!-- Single dot for momentary mode -->
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#pd-curve-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation path -->
      <path :id="`pd-curve-${uid}`" d="M30.7417 2 C111.742 45.5 318.5 50 567 50"/>
      
      <!-- Gradient -->
      <linearGradient :id="`pd-gradient-press-${uid}`" x1="-65.5" y1="22.6379" x2="588.5" y2="22.6379" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
    </defs>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PressProfileGrid from './PressProfileGrid.vue'

const props = defineProps<{
  isLatched: boolean
}>()

// Generate unique ID for this instance to avoid ID conflicts
const uid = Math.random().toString(36).substr(2, 9)

const gradientUrl = computed(() => `url(#pd-gradient-press-${uid})`)
</script>
