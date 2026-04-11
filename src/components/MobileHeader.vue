<template>
  <header class="mobile-header">
    <div class="header-top">
      <!-- Disconnected state: Show BLUETOOTH CONNECT button -->
      <button 
        v-if="!isConnected" 
        class="bluetooth-connect-btn"
        @click="$emit('connect')"
      >
        BLUETOOTH CONNECT
      </button>
      
      <!-- Always show KB1 logo -->
      <img src="/kb1_title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
      
      <!-- Battery meter: Show if monitoring enabled AND data available (persists when disconnected) -->
      <BatteryMeter 
        v-if="batteryMonitoringEnabled && batteryStatus"
        @click="openBatteryModal"
      />
    </div>
    
    <!-- Battery Modal -->
    <BatteryModal 
      :is-open="showBatteryModal"
      :is-connected="isConnected"
      @close="closeBatteryModal"
      @needs-connect="closeBatteryModal(); $emit('connect');"
    />
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import BatteryMeter from './BatteryMeter.vue';
import BatteryModal from './BatteryModal.vue';
import { useBatteryStatus } from '../composables/useBatteryStatus';
import { useBatteryModal } from '../composables/useBatteryModal';
import { useUIPreferences } from '../composables/useUIPreferences';

const props = defineProps<{
  isConnected: boolean;
  deviceName?: string;
}>();

defineEmits<{
  connect: [];
}>();

const { showBatteryModal, openBatteryModal, closeBatteryModal } = useBatteryModal();
const { batteryStatus } = useBatteryStatus();
const { batteryMonitoringEnabled } = useUIPreferences();

// Battery init is handled by useDeviceState.connect() after settings load completes
// No need for a timer here

// Listen for battery alerts
onMounted(() => {
  window.addEventListener('battery-alert', handleBatteryAlert);
});

function handleBatteryAlert(event: Event) {
  const customEvent = event as CustomEvent<{ percentage: number; level: string }>;
  console.log('Battery alert:', customEvent.detail);
  // Note: toast notifications handled by parent App.vue if needed
}
</script>

<style scoped>
.mobile-header {
  background: #0F0F0F;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  gap: 2rem;
}

/* When connected (no BT button), center logo and push battery to right */
.header-top:not(:has(.bluetooth-connect-btn)) {
  justify-content: center;
  position: relative;
}

.header-top:not(:has(.bluetooth-connect-btn)) .battery-meter {
  position: absolute;
  right: 2rem;
}

/* Bluetooth Connect Button - Disconnected State */
.bluetooth-connect-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #47708E;
  border-radius: 6px;
  color: #47708E;
  font-family: 'Roboto Mono';
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.bluetooth-connect-btn:hover {
  background: rgba(71, 112, 142, 0.1);
}

.bluetooth-connect-btn:active {
  transform: scale(0.98);
}

.header-logo {
  height: 40px;
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-top {
    padding: 1rem 1.5rem;
  }
  
  .header-top:not(:has(.bluetooth-connect-btn)) .battery-meter {
    right: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-top {
    padding: 1rem;
    gap: 1rem;
  }
  
  .header-logo {
    height: 32px;
  }
  
  .bluetooth-connect-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.875rem;
  }
  
  .header-top:not(:has(.bluetooth-connect-btn)) .battery-meter {
    right: 1rem;
  }
}
</style>
