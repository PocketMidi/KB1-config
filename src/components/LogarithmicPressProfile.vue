<template>
  <svg width="100%" viewBox="0 0 583 61" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path opacity="0.7" d="M567 50V6.19262C511.504 6.19258 250.538 0.576271 15.9999 50H567Z" :fill="gradientUrl"/>
    
    <!-- Grid lines -->
    <PressProfileGrid />
    
    <!-- Animated dot(s) -->
    <template v-if="isLatched">
      <!-- Two dots traveling opposite directions for latched mode -->
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#log-curve-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#log-curve-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    <template v-else>
      <!-- Single dot for momentary mode -->
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0 0 0.6 1">
          <mpath :href="`#log-curve-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation path -->
      <path :id="`log-curve-${uid}`" d="M16 50 C250.538 0.576271 511.504 6.19258 567 6.19262"/>
      
      <!-- Gradient -->
      <linearGradient :id="`log-gradient-press-${uid}`" x1="16" y1="28" x2="567" y2="28" gradientUnits="userSpaceOnUse">
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

const gradientUrl = computed(() => `url(#log-gradient-press-${uid})`)
</script>
