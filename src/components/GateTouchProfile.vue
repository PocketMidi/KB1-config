<template>
  <svg width="100%" viewBox="0 0 586 80" fill="none" xmlns="http://www.w3.org/2000/svg">

    <!-- Background -->
    <rect width="586" height="80" fill="var(--touch-profile-bg)"/>

    <!-- GATE CLUSTER - Centered, pulses inward with filled rings -->
    <g id="gate-filled">
      <!-- Outermost -->
      <circle class="gate-fill-outer" cx="293" cy="40" r="176" fill="var(--touch-profile-ring-4)" opacity="0"/>
      <!-- Med-large -->
      <circle class="gate-fill-med-lg" cx="293" cy="40" r="135" fill="var(--touch-profile-ring-3)" opacity="0"/>
      <!-- Medium -->
      <circle class="gate-fill-med" cx="293" cy="40" r="101" fill="var(--touch-profile-ring-2)" opacity="0"/>
      <!-- Small -->
      <circle class="gate-fill-small" cx="293" cy="40" r="65" fill="var(--touch-profile-ring-1)" opacity="0"/>
      <!-- Center filled -->
      <circle class="gate-fill-center" cx="293" cy="40" r="30" fill="var(--touch-profile-highlight)" opacity="0"/>
    </g>

    <!-- GATE OUTLINE - Always visible center circle -->
    <circle cx="293" cy="40" r="30" fill="none" stroke="var(--touch-profile-highlight)" stroke-width="2" opacity="1"/>
  </svg>
</template>

<script setup lang="ts">
// No props needed - gate mode is always the same
</script>


<style scoped>
/* Gate mode - pulse inward (outer to inner), rings fade out, center holds, then release */
@keyframes gate-outer {
  0% { opacity: 0; }
  3% { opacity: 0.3; }
  10% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes gate-med-lg {
  0%, 3% { opacity: 0; }
  6% { opacity: 0.3; }
  13% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes gate-med {
  0%, 6% { opacity: 0; }
  9% { opacity: 0.3; }
  16% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes gate-small {
  0%, 9% { opacity: 0; }
  12% { opacity: 0.3; }
  19% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes gate-center {
  0%, 12% { opacity: 0; }
  15% { opacity: 1; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* Apply animations to circles */
.gate-fill-outer { animation: gate-outer 4s ease-in-out infinite; }
.gate-fill-med-lg { animation: gate-med-lg 4s ease-in-out infinite; }
.gate-fill-med { animation: gate-med 4s ease-in-out infinite; }
.gate-fill-small { animation: gate-small 4s ease-in-out infinite; }
.gate-fill-center { animation: gate-center 4s ease-in-out infinite; }
</style>