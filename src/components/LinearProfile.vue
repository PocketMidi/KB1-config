<template>
  <svg width="100%" viewBox="0 0 583 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Profile shape -->
    <path :opacity="isBipolar ? undefined : 0.7" :d="shapePath" :fill="gradientUrl"/>
    
    <!-- Grid lines -->
    <ProfileGrid />
    
    <!-- Animated dot(s) -->
    <circle v-if="!isBipolar" cx="0" cy="0" r="3.0" fill="#F9AC20">
      <animateMotion dur="1.75s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
        <mpath :href="`#lin-curve-uni-${uid}`"/>
      </animateMotion>
    </circle>
    
    <!-- Bipolar: two dots -->
    <template v-else>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath :href="`#lin-curve-left-${uid}`"/>
        </animateMotion>
      </circle>
      <circle cx="0" cy="0" r="3.0" fill="#F9AC20">
        <animateMotion dur="1s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
          <mpath :href="`#lin-curve-right-${uid}`"/>
        </animateMotion>
      </circle>
    </template>
    
    <defs>
      <!-- Animation paths -->
      <path v-if="!isBipolar" :id="`lin-curve-uni-${uid}`" d="M16 117 L567 7"/>
      <template v-else>
        <path :id="`lin-curve-left-${uid}`" d="M291.5 117 L16 7"/>
        <path :id="`lin-curve-right-${uid}`" d="M291.5 117 L567 7"/>
      </template>
      
      <!-- Gradients -->
      <linearGradient v-if="!isBipolar" :id="`lin-gradient-uni-${uid}`" x1="16" y1="62" x2="567" y2="62" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9F9C80"/>
        <stop offset="1" stop-color="#24231F"/>
      </linearGradient>
      <radialGradient v-else :id="`lin-gradient-bi-${uid}`" cx="0" cy="0" r="1" gradientTransform="matrix(-321.506 -44 -51.6213 191.69 291.5 50)" gradientUnits="userSpaceOnUse">
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
    // Bipolar: triangle from both sides meeting at center
    return 'M16 117V7L291.5 117L567 7V117H291.5H16Z'
  } else {
    // Unipolar: triangle from left to right
    return 'M567 117V7L16 117H567Z'
  }
})

const gradientUrl = computed(() => 
  props.isBipolar ? `url(#lin-gradient-bi-${uid})` : `url(#lin-gradient-uni-${uid})`
)
</script>
