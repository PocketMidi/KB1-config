<template>
  <div class="settings-system">
    <div class="inputs">
      <div class="group">
        <label for="light-sleep">LIGHT SLEEP</label>
        <span class="time-display">{{ formatTime(model.lightSleepTimeout) }}</span>
        <div class="time-control-wrapper">
          <ValueControl
            v-model="model.lightSleepTimeout"
            :min="180"
            :max="600"
            :step="5"
            :small-step="15"
            :large-step="30"
          />
          <span class="unit-label">s</span>
        </div>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="ble-timeout">BLE TIMEOUT</label>
        <span class="time-display">{{ formatTime(model.bleTimeout) }}</span>
        <div class="time-control-wrapper">
          <ValueControl
            v-model="model.bleTimeout"
            :min="btConnectionMin"
            :max="1200"
            :step="10"
            :small-step="30"
            :large-step="60"
          />
          <span class="unit-label">s</span>
        </div>
      </div>
      
      <div class="hint-text">
        After idle time → pulsing LEDs (Light Sleep) → 90s later → deep sleep (lowest power). BLE Timeout: while web app is connected and pinging, sleep is prevented.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import ValueControl from './ValueControl.vue'

type SystemModel = {
  lightSleepTimeout: number
  deepSleepTimeout: number
  bleTimeout: number
}

const props = defineProps<{
  modelValue: SystemModel
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: SystemModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Auto-calculate deep sleep as light sleep + 90s (fixed pulsing LED warning period)
const autoDeepSleep = computed(() => model.value.lightSleepTimeout + 90)

// Sync deep sleep whenever light sleep changes
watch(() => model.value.lightSleepTimeout, () => {
  model.value.deepSleepTimeout = autoDeepSleep.value
}, { immediate: true })

// BLE Timeout: independent, just needs minimum
const btConnectionMin = computed(() => {
  return 300
})

// Format seconds into human-readable time (e.g., "1m 30s" or "45s")
const formatTime = (seconds: number): string => {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
}
</script>

<style scoped>
.settings-system {
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .settings-system {
    padding: 0.75rem;
  }
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.input-divider {
  height: 1px;
  background: var(--color-divider);
  width: 100%;
}

.group {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  gap: 1rem;
}

.group label {
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  color: #848484;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  min-width: 120px;
}

.time-display {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  color: #EAEAEA;
  font-weight: 400;
  margin-right: auto;
  padding-left: 1rem;
}

.hint-text {
  font-size: 0.8125rem; /* 13px */
  font-style: italic;
  color: var(--color-text-muted);
  padding: 0.5rem 0 1rem 0;
  font-family: 'Roboto Mono';
}

.time-control-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.unit-label {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  cursor: default;
  user-select: none;
}
</style>
