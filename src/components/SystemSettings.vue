<template>
  <div class="settings-system">
    <div class="inputs">
      <div class="group">
        <label for="light-sleep">
          SLEEP TIMEOUT
          <span class="info-icon" @click.stop="showHelp('sleepTimeout')" title="Show help">i</span>
        </label>
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
        <label for="ble-timeout">
          BLE TIMEOUT
          <span class="info-icon" @click.stop="showHelp('bleTimeout')" title="Show help">i</span>
        </label>
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
      <div class="input-divider"></div>

      <div class="group">
        <label>
          BATTERY MONITORING
          <span class="info-icon" @click.stop="showHelp('batteryMonitoring')" title="Show help">i</span>
        </label>
        <div class="toggle-switch" @click="toggleBatteryMonitoring">
          <span class="toggle-label-left" :class="{ active: !batteryMonitoringEnabled }">OFF</span>
          <div class="toggle-track" :class="{ active: batteryMonitoringEnabled }">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label-right" :class="{ active: batteryMonitoringEnabled }">ON</span>
        </div>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>
          PARAMETER RESOLUTION
          <span class="info-icon" @click.stop="showHelp('resolution')" title="Show help">i</span>
        </label>
        <div class="toggle-switch resolution-toggle" @click="toggleResolution">
          <span class="toggle-label-left" :class="{ active: unipolarStepSize === 1 }">1</span>
          <div class="toggle-track" :class="{ active: unipolarStepSize === 5 }">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label-right" :class="{ active: unipolarStepSize === 5 }">5</span>
        </div>
      </div>
      <div v-if="!isIOSDevice" class="input-divider"></div>

      <div v-if="!isIOSDevice" class="group">
        <label for="haptics">HAPTIC FEEDBACK</label>
        <div class="toggle-switch" @click="toggleHaptics">
          <span class="toggle-label-left" :class="{ active: !hapticsEnabled }">OFF</span>
          <div class="toggle-track" :class="{ active: hapticsEnabled }">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label-right" :class="{ active: hapticsEnabled }">ON</span>
        </div>
      </div>
      <div v-if="!isIOSDevice" class="input-divider"></div>

      <div class="group">
        <label>
          HINTS & MESSAGES
          <span class="info-icon" @click.stop="showHelp('hints')" title="Show help">i</span>
        </label>
        <div class="toggle-switch momentary-btn" :class="{ active: restoringHints }" @click="resetHints">
          <span class="toggle-label-left">RESTORE</span>
          <div class="toggle-track">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label-right">↺</span>
        </div>
      </div>
      <!-- Firmware update removed - use desktop firmware updater tool instead -->

      <div class="input-divider"></div>
      <div class="group">
        <label>APPEARANCE</label>
        <div class="theme-mode-toggle">
          <button
            class="theme-mode-btn"
            :class="{ active: themeMode === 'auto' }"
            @click="setThemeMode('auto')"
          >AUTO</button>
          <button
            class="theme-mode-btn"
            :class="{ active: themeMode === 'dark' }"
            @click="setThemeMode('dark')"
          >DARK</button>
          <button
            class="theme-mode-btn"
            :class="{ active: themeMode === 'light' }"
            @click="setThemeMode('light')"
          >LIGHT</button>
        </div>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>KB1 DEVICE</label>
        <div class="theme-mode-toggle">
          <button
            class="theme-mode-btn"
            :class="{ active: restoringFromDevice }"
            @click="handleRestoreFromDevice"
          >RELOAD</button>
          <button
            class="theme-mode-btn danger"
            :class="{ active: resettingToFactory }"
            @click="handleResetToFactory"
          >FACTORY</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Help Guide Modal -->
  <div v-if="showHelpModal" class="help-modal-overlay" @click="dismissHelp">
    <div class="help-modal" @click.stop>
      <div class="help-modal-header">
        <h3>{{ helpContent.title }}</h3>
        <button class="close-btn" @click="dismissHelp">×</button>
      </div>
      <div class="help-modal-body">
        <p v-html="helpContent.description"></p>
      </div>
      <div class="help-modal-footer">
        <button class="btn-primary" @click="dismissHelp">Got it</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useHaptics } from '../composables/useHaptics'
import { useUIPreferences } from '../composables/useUIPreferences'
import { useBatteryModal } from '../composables/useBatteryModal'
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
  (e: 'restore-from-device'): void
  (e: 'reset-to-factory'): void
}>()    

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Detect iOS
const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Haptics
const { enabled: hapticsEnabled, init: initHaptics, snap } = useHaptics()

// Initialize haptics from localStorage on mount
onMounted(() => {
  initHaptics()
})

function toggleHaptics() {
  hapticsEnabled.value = !hapticsEnabled.value
  // Give immediate feedback if enabling
  if (hapticsEnabled.value) {
    snap()
  }
}

// UI Preferences
const { unipolarStepSize, setUnipolarStepSize, batteryMonitoringEnabled, setBatteryMonitoringEnabled, themeMode, setThemeMode } = useUIPreferences()

// Battery Modal
const { openBatteryModal } = useBatteryModal()

function toggleResolution() {
  setUnipolarStepSize(unipolarStepSize.value === 1 ? 5 : 1)
  snap()
}

function toggleBatteryMonitoring() {
  setBatteryMonitoringEnabled(!batteryMonitoringEnabled.value)
  snap()
}

// Auto-open battery modal when monitoring is enabled
watch(batteryMonitoringEnabled, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    // Toggled from OFF to ON - open the modal after brief delay
    setTimeout(() => {
      openBatteryModal()
    }, 100)
  }
})

// Help modal system
const showHelpModal = ref(false)
const helpContent = ref({ title: '', description: '' })

// Restore hints momentary button state
const restoringHints = ref(false)

const helpTexts = {
  batteryMonitoring: {
    title: 'Battery Monitoring',
    description: 'Shows or hides the battery icon in the navigation bar. Battery tracking runs in the background regardless of this setting. Toggle ON to view battery status and access calibration features.'
  },
  sleepTimeout: {
    title: 'Sleep Timeout',
    description: 'Controls how long <em>KB1</em> stays awake when not in use. At timeout, LEDs pulse briefly as a warning, then the device enters deep sleep to save battery. Touchpad will wake system at any time.'
  },
  bleTimeout: {
    title: 'BLE Timeout', 
    description: 'Controls how long Bluetooth stays active when the <em>Configurator</em> web app is not connected. Shorter times will conserve battery life.'
  },
  resolution: {
    title: 'Parameter Resolution',
    description: 'Choose how precisely to adjust values: Resolution 1 for fine control (1% increments), or Resolution 5 for faster adjustments (5% jumps).<br><br><strong>Note:</strong> Some controls (like chord/strum settings) use fixed step sizes optimized for their specific range.'
  },
  hints: {
    title: 'Hints & Messages',
    description: 'This will restore all dismissed hints and messages so they appear again next time.'
  }
}

function showHelp(type: keyof typeof helpTexts) {
  helpContent.value = helpTexts[type]
  showHelpModal.value = true
}

function dismissHelp() {
  showHelpModal.value = false
}

// Reset all hint/warning preferences
function resetHints() {
  // Momentary visual feedback
  restoringHints.value = true
  
  // List of all localStorage keys for dismissed hints/warnings
  const hintKeys = [
    'kb1-reset-hint-disabled',
    'kb1-reset-hint-seen',
    'kb1-inactive-keys-hint-dismissed',
    // Add any future hint keys here
  ]
  
  // Clear all hint preferences
  hintKeys.forEach(key => {
    localStorage.removeItem(key)
  })
  
  // Haptic feedback
  snap()
  
  // Reset momentary state after brief delay
  setTimeout(() => {
    restoringHints.value = false
  }, 600)
}

// Restore from device momentary button
const restoringFromDevice = ref(false)

function handleRestoreFromDevice() {
  restoringFromDevice.value = true
  emit('restore-from-device')
  snap()
  setTimeout(() => { restoringFromDevice.value = false }, 600)
}

// Reset to factory momentary button
const resettingToFactory = ref(false)

function handleResetToFactory() {
  if (!confirm('Reset all settings to factory defaults? This cannot be undone.')) return
  resettingToFactory.value = true
  emit('reset-to-factory')
  snap()
  setTimeout(() => { resettingToFactory.value = false }, 600)
}

// Auto-calculate deep sleep as light sleep + 90s (fixed pulsing LED warning period)
const autoDeepSleep = computed(() => model.value.lightSleepTimeout + 90)

// Sync deep sleep whenever light sleep changes
watch(() => model.value.lightSleepTimeout, () => {
  model.value = { ...model.value, deepSleepTimeout: autoDeepSleep.value }
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-icon {
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.625rem;
  color: #848484;
  border: 1px solid #848484;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.info-icon:hover {
  color: #0DC988;
  border-color: #0DC988;
}

.time-display {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  color: #EAEAEA;
  font-weight: 400;
  margin-right: auto;
  padding-left: 1rem;
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

/* Toggle Switch */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toggle-track {
  width: 44px;
  height: 24px;
  background: #2A2A2A;
  border-radius: 12px;
  position: relative;
  transition: background-color 0.25s ease;
  border: 1px solid #3A3A3A;
}

.toggle-track.active {
  background: #0DC988;
  border-color: #0DC988;
}

.toggle-thumb {
  width: 18px;
  height: 18px;
  background: #EAEAEA;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.25s ease;
}

.toggle-track.active .toggle-thumb {
  transform: translateX(20px);
}

.toggle-label-left,
.toggle-label-right {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  color: #848484;
  font-weight: 400;
  min-width: 32px;
  text-align: center;
  transition: color 0.25s ease;
}

.toggle-label-left.active,
.toggle-label-right.active {
  color: #EAEAEA;
}

/* Resolution toggle - keep track gray, highlight active number in yellow */
.resolution-toggle .toggle-track.active {
  background: #2A2A2A;
  border-color: #3A3A3A;
}

.resolution-toggle .toggle-label-left.active,
.resolution-toggle .toggle-label-right.active {
  color: #FFD700;
  font-weight: 500;
}

/* Help Modal */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.help-modal {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Roboto Mono';
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.help-modal-header h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #EAEAEA;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-background-mute);
  color: #EAEAEA;
}

.help-modal-body {
  padding: 1.5rem;
}

.help-modal-body p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--color-text);
}

.help-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .btn-primary {
  padding: 0.5rem 1.5rem;
  background: #0DC988;
  color: #1A1A1A;
  border: none;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  background: #0BA872;
}

/* Momentary button (looks like toggle, acts momentarily) */
.toggle-switch.momentary-btn {
  cursor: pointer;
}

.toggle-switch.momentary-btn.active .toggle-track {
  background: rgba(13, 201, 136, 0.35);
  border-color: rgba(13, 201, 136, 0.5);
}

.toggle-switch.momentary-btn.active .toggle-thumb {
  transform: translateX(22px);
  background: #0DC988;
}

.toggle-switch.momentary-btn.active .toggle-label-right {
  color: #0DC988;
  font-weight: 500;
}

.toggle-switch.momentary-btn .toggle-label-left {
  color: #848484;
  font-weight: 400;
  font-size: 0.6875rem;
}

.toggle-switch.momentary-btn .toggle-label-right {
  font-size: 1rem;
  color: #848484;
  transition: all 0.2s ease;
}

.toggle-switch.momentary-btn:hover .toggle-label-left,
.toggle-switch.momentary-btn:hover .toggle-label-right {
  color: #EAEAEA;
}

/* Danger variant - muted red tint on active */
.toggle-switch.danger-btn.active .toggle-track {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}
.toggle-switch.danger-btn.active .toggle-thumb {
  background: #ef4444;
}
.toggle-switch.danger-btn.active .toggle-label-right {
  color: #ef4444;
}

/* APPEARANCE 3-way theme toggle */
.theme-mode-toggle {
  display: flex;
  gap: 0.25rem;
}

.theme-mode-btn {
  padding: 0.25rem 0.6rem;
  background: transparent;
  border: 1px solid #3A3A3A;
  border-radius: 4px;
  color: #848484;
  font-family: 'Roboto Mono';
  font-size: 0.6875rem;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.05em;
}

.theme-mode-btn.active {
  background: rgba(234, 234, 234, 0.1);
  border-color: rgba(234, 234, 234, 0.4);
  color: #EAEAEA;
  font-weight: 500;
}

.theme-mode-btn:hover:not(.active) {
  color: #EAEAEA;
  border-color: #5A5A5A;
}

.theme-mode-btn.danger {
  color: #848484;
}

.theme-mode-btn.danger:hover:not(.active) {
  color: #ef4444;
  border-color: #ef4444;
}

.theme-mode-btn.danger.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}
</style>
