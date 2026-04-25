<template>
  <div 
    class="battery-meter" 
    :class="[`battery-${batteryLevel}`, { 'battery-disconnected': !isAvailable }]"
    @click="$emit('click')"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
  >
    <!-- Battery Icon -->
    <svg 
      class="battery-icon" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Battery Body -->
      <rect 
        x="2" 
        y="7" 
        width="18" 
        height="10" 
        rx="2" 
        :stroke="batteryColor" 
        stroke-width="1.5"
        fill="none"
      />
      
      <!-- Battery Terminal -->
      <path 
        d="M20 10L22 10L22 14L20 14" 
        :stroke="batteryColor" 
        stroke-width="1.5" 
        stroke-linecap="round"
      />
      
      <!-- Battery Fill Level (hide if uncalibrated OR if showing percentage OR if disconnected) -->
      <rect 
        v-if="isAvailable && estimatedPercentage !== 254 && !showPercentage"
        x="4" 
        y="9" 
        :width="fillWidth" 
        height="6" 
        rx="1" 
        :fill="batteryColor"
      />
      
      <!-- Question mark for uncalibrated (only when connected) -->
      <text 
        v-if="isAvailable && estimatedPercentage === 254"
        x="11" 
        y="16" 
        font-family="Arial, sans-serif" 
        font-size="10" 
        font-weight="bold"
        text-anchor="middle" 
        :fill="batteryColor"
      >?</text>
      
      <!-- Percentage text inside battery (when calibrated, enabled, AND connected) -->
      <text 
        v-if="isAvailable && showPercentage && estimatedPercentage !== 254"
        x="11" 
        y="13" 
        font-family="'Roboto Mono', monospace" 
        font-size="8" 
        font-weight="700"
        text-anchor="middle" 
        dominant-baseline="middle"
        :fill="batteryColor"
      >{{ estimatedPercentage }}</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBatteryStatus } from '../composables/useBatteryStatus';

defineEmits(['click']);

const {
  isAvailable,
  batteryLevel,
  batteryColor,
  estimatedPercentage,
  showPercentage,
} = useBatteryStatus();

// Calculate fill width based on percentage (max 14 units for full battery)
const fillWidth = computed(() => {
  const percentage = estimatedPercentage.value;
  if (percentage === 254) return 0; // Uncalibrated - no fill
  return Math.max(0, Math.min(14, (percentage / 100) * 14));
});

const ariaLabel = computed(() => {
  if (estimatedPercentage.value === 254) return 'Battery uncalibrated';
  return `Battery ${estimatedPercentage.value}%`;
});
</script>

<style scoped>
.battery-meter {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: var(--kb1-radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  user-select: none;
}

.battery-disconnected {
  opacity: 0.4;
  cursor: pointer; /* Still clickable to view battery setup instructions */
}

.battery-disconnected .battery-icon {
  --battery-color: var(--battery-disconnected);
}

.battery-meter:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.battery-meter:active {
  background-color: rgba(255, 255, 255, 0.1);
}

.battery-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

/* Battery level colors */
.battery-good {
  --battery-color: var(--battery-good);
}

.battery-warning {
  --battery-color: var(--battery-warning);
}

.battery-critical {
  --battery-color: var(--battery-critical);
}

.battery-uncalibrated {
  --battery-color: var(--battery-uncalibrated);
  opacity: 0.7;
}

/* Pulsing animation for critical battery */
.battery-critical .battery-icon {
  animation: battery-pulse 2s ease-in-out infinite;
}

@keyframes battery-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Focus styles for accessibility */
.battery-meter:focus {
  outline: 2px solid var(--battery-color);
  outline-offset: 2px;
}

.battery-meter:focus:not(:focus-visible) {
  outline: none;
}
</style>
