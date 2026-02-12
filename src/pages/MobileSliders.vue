<template>
  <div class="mobile-sliders-tab">
    <div v-if="!isConnected" class="not-connected-message">
      <p>Please connect to your KB1 device to use live sliders.</p>
    </div>
    
    <div v-else class="sliders-wrapper">
      <LandingPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDeviceState } from '../composables/useDeviceState';
import LandingPage from './LandingPage.vue';

const { isConnected } = useDeviceState();
</script>

<style scoped>
.mobile-sliders-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 80px; /* Space for bottom nav on mobile */
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.sliders-wrapper {
  flex: 1;
  overflow: hidden;
}

@media (min-width: 769px) {
  .mobile-sliders-tab {
    padding-bottom: 0;
  }
}
</style>
