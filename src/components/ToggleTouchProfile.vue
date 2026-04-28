<template>
  <svg width="100%" viewBox="0 0 586 80" fill="none" xmlns="http://www.w3.org/2000/svg">

    <!-- Background -->
    <rect width="586" height="80" fill="var(--touch-profile-bg)"/>

    <!-- LEFT CLUSTER - Pulses out from left side -->
    <g id="left-filled">
      <!-- Outermost -->
      <circle class="left-fill-outer" cx="143" cy="40" r="176" fill="var(--touch-profile-ring-4)" opacity="0"/>
      <!-- Med-large -->
      <circle class="left-fill-med-lg" cx="143" cy="40" r="135" fill="var(--touch-profile-ring-3)" opacity="0"/>
      <!-- Medium -->
      <circle class="left-fill-med" cx="143" cy="40" r="101" fill="var(--touch-profile-ring-2)" opacity="0"/>
      <!-- Small -->
      <circle class="left-fill-small" cx="143" cy="40" r="65" fill="var(--touch-profile-ring-1)" opacity="0"/>
      <!-- Center filled -->
      <circle class="left-fill-center" cx="143" cy="40" r="30" fill="var(--touch-profile-highlight)" opacity="0"/>
    </g>

    <!-- LEFT OUTLINE - Always visible center circle -->
    <circle cx="143" cy="40" r="30" fill="none" stroke="var(--touch-profile-highlight)" stroke-width="2" opacity="1"/>

    <!-- RIGHT CLUSTER - Pulses out from right side -->
    <g id="right-filled">
      <!-- Outermost -->
      <circle class="right-fill-outer" cx="443" cy="40" r="176" fill="var(--touch-profile-ring-4)" opacity="0"/>
      <!-- Med-large -->
      <circle class="right-fill-med-lg" cx="443" cy="40" r="135" fill="var(--touch-profile-ring-3)" opacity="0"/>
      <!-- Medium -->
      <circle class="right-fill-med" cx="443" cy="40" r="101" fill="var(--touch-profile-ring-2)" opacity="0"/>
      <!-- Small -->
      <circle class="right-fill-small" cx="443" cy="40" r="65" fill="var(--touch-profile-ring-1)" opacity="0"/>
      <!-- Center filled -->
      <circle class="right-fill-center" cx="443" cy="40" r="30" fill="var(--touch-profile-highlight)" opacity="0"/>
    </g>

    <!-- RIGHT OUTLINE - Always visible center circle -->
    <circle cx="443" cy="40" r="30" fill="none" stroke="var(--touch-profile-highlight)" stroke-width="2" opacity="1"/>
  </svg>
</template>

<script setup lang="ts">
// No props needed - toggle mode is always the same
</script>

<style scoped>
/* Left side pulse animations - rings pulse out then back in */
@keyframes pulse-left-center {
  0% { opacity: 0; }
  5% { opacity: 1; }
  25% { opacity: 1; }
  50% { opacity: 1; }
  55% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes pulse-left-small {
  0%, 3% { opacity: 0; }
  8% { opacity: 0.3; }
  28% { opacity: 0.3; }
  48% { opacity: 0.3; }
  53% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes pulse-left-med {
  0%, 6% { opacity: 0; }
  11% { opacity: 0.3; }
  31% { opacity: 0.3; }
  46% { opacity: 0.3; }
  51% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes pulse-left-med-lg {
  0%, 9% { opacity: 0; }
  14% { opacity: 0.3; }
  34% { opacity: 0.3; }
  44% { opacity: 0.3; }
  49% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes pulse-left-outer {
  0%, 12% { opacity: 0; }
  17% { opacity: 0.3; }
  37% { opacity: 0.3; }
  42% { opacity: 0; }
  100% { opacity: 0; }
}

/* Right side pulse animations - rings pulse out then back in */
@keyframes pulse-right-center {
  0%, 50% { opacity: 0; }
  55% { opacity: 1; }
  75% { opacity: 1; }
  100% { opacity: 1; }
}

@keyframes pulse-right-small {
  0%, 53% { opacity: 0; }
  58% { opacity: 0.3; }
  78% { opacity: 0.3; }
  98% { opacity: 0.3; }
  100% { opacity: 0.24; }
}

@keyframes pulse-right-med {
  0%, 56% { opacity: 0; }
  61% { opacity: 0.3; }
  81% { opacity: 0.3; }
  96% { opacity: 0.3; }
  100% { opacity: 0.18; }
}

@keyframes pulse-right-med-lg {
  0%, 59% { opacity: 0; }
  64% { opacity: 0.3; }
  84% { opacity: 0.3; }
  94% { opacity: 0.3; }
  99% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes pulse-right-outer {
  0%, 62% { opacity: 0; }
  67% { opacity: 0.3; }
  87% { opacity: 0.3; }
  92% { opacity: 0; }
  100% { opacity: 0; }
}

/* Left filled circles - pulse wave from center to outer */
.left-fill-center { animation: pulse-left-center 2s ease-in-out infinite; }
.left-fill-small { animation: pulse-left-small 2s ease-in-out infinite; }
.left-fill-med { animation: pulse-left-med 2s ease-in-out infinite; }
.left-fill-med-lg { animation: pulse-left-med-lg 2s ease-in-out infinite; }
.left-fill-outer { animation: pulse-left-outer 2s ease-in-out infinite; }

/* Right filled circles - pulse wave from center to outer */
.right-fill-center { animation: pulse-right-center 2s ease-in-out infinite; }
.right-fill-small { animation: pulse-right-small 2s ease-in-out infinite; }
.right-fill-med { animation: pulse-right-med 2s ease-in-out infinite; }
.right-fill-med-lg { animation: pulse-right-med-lg 2s ease-in-out infinite; }
.right-fill-outer { animation: pulse-right-outer 2s ease-in-out infinite; }
</style>
