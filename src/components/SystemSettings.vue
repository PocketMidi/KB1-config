<template>
  <div class="settings-system">
    <div class="inputs">
      <div class="group">
        <label>
          BATTERY MONITORING
          <span class="info-icon" @click.stop="showHelp('batteryMonitoring')" title="Show help">?</span>
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
        <label for="light-sleep">
          SLEEP TIMEOUT
          <span class="info-icon" @click.stop="showHelp('sleepTimeout')" title="Show help">?</span>
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
          <span class="info-icon" @click.stop="showHelp('bleTimeout')" title="Show help">?</span>
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
          PARAMETER RESOLUTION
          <span class="info-icon" @click.stop="showHelp('resolution')" title="Show help">?</span>
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

      <div class="group">
        <label>
          HINTS & MESSAGES
          <span class="info-icon" @click.stop="showHelp('hints')" title="Show help">?</span>
        </label>
        <div class="toggle-switch momentary-btn" :class="{ active: restoringHints }" @click="resetHints">
          <span class="toggle-label-left">RESTORE</span>
          <div class="toggle-track">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label-right">↺</span>
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
      <div class="input-divider"></div>

      <div class="group firmware-update-group">
        <label>
          FIRMWARE UPDATE
          <span class="info-icon" @click.stop="showHelp('firmwareUpdate')" title="Show help">?</span>
        </label>
        <div v-if="!hasUsbSupport" class="firmware-status">
          ⚠️ USB flashing not available
          <div class="firmware-status-hint">
            Requires HTTPS + Chrome/Edge 89+
          </div>
        </div>
        <div v-else-if="firmwareVersion" class="firmware-version">
          Current: v{{ firmwareVersion }}
        </div>
        <div v-else class="firmware-version">
          Version: Unknown (connect BLE)
        </div>
        <button 
          class="btn-firmware-update"
          :class="{ disabled: !hasUsbSupport }"
          :disabled="!hasUsbSupport"
          @click="openFirmwareUpdateModal"
        >
          Update Firmware
        </button>
      </div>
    </div>
  </div>

  <!-- Firmware Update Modal -->
  <div v-if="showFirmwareModal" class="help-modal-overlay" @click="dismissFirmwareModal">
    <div class="firmware-modal" @click.stop>
      <div class="help-modal-header">
        <h3>Firmware Update</h3>
        <button class="close-btn" @click="dismissFirmwareModal">×</button>
      </div>
      
      <div class="firmware-modal-body">
        <!-- Step indicator -->
        <div v-if="!isUpdating && updateStatus.step !== 'complete'" class="firmware-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-text">
              <strong>BLE will disconnect</strong>
              <p>Current connection will be closed</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-text">
              <strong>Connect USB cable</strong>
              <p>Plug KB1 into computer via USB</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-text">
              <strong>Flash firmware</strong>
              <p>Update takes ~30 seconds</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-text">
              <strong>Reconnect BLE</strong>
              <p>Return to normal operation</p>
            </div>
          </div>
          <div class="firmware-note">
            ✓ Your battery calibration will be preserved
          </div>
        </div>

        <!-- Progress view -->
        <div v-if="isUpdating || updateStatus.step === 'complete' || updateStatus.step === 'error'" class="firmware-progress">
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: `${updateStatus.progress}%` }"></div>
          </div>
          <div class="progress-message">
            {{ updateStatus.message }}
          </div>
          <div v-if="updateStatus.error" class="progress-error">
            {{ updateStatus.error }}
          </div>
        </div>
      </div>

      <div class="help-modal-footer">
        <button 
          v-if="!isUpdating && updateStatus.step !== 'complete'" 
          class="btn-secondary" 
          @click="dismissFirmwareModal"
        >
          Cancel
        </button>
        <button 
          v-if="!isUpdating && updateStatus.step !== 'complete' && updateStatus.step !== 'error'" 
          class="btn-primary" 
          @click="startFirmwareUpdate"
        >
          Start Update
        </button>
        <button 
          v-if="updateStatus.step === 'complete'" 
          class="btn-primary" 
          @click="finishFirmwareUpdate"
        >
          Close & Reconnect BLE
        </button>
        <button 
          v-if="updateStatus.step === 'error'" 
          class="btn-secondary" 
          @click="dismissFirmwareModal"
        >
          Close
        </button>
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
import { useFirmwareUpdate } from '../composables/useFirmwareUpdate'
import { useDeviceState } from '../composables/useDeviceState'
import { bleClient } from '../ble/bleClient'
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
const { unipolarStepSize, setUnipolarStepSize, batteryMonitoringEnabled, setBatteryMonitoringEnabled } = useUIPreferences()

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
  },
  firmwareUpdate: {
    title: 'Firmware Update',
    description: 'Update KB1 firmware via USB while preserving your battery calibration and settings. Requires Chrome, Edge, or another Chromium-based browser with Web Serial support. BLE will disconnect during the update process.'
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

// ============================================
// FIRMWARE UPDATE
// ============================================

const { firmwareVersion } = useDeviceState()
const { hasUsbSupport, isUpdating, updateStatus, updateFirmware, downloadFirmware, resetStatus } = useFirmwareUpdate()

const showFirmwareModal = ref(false)
const wasConnectedBeforeUpdate = ref(false)

function openFirmwareUpdateModal() {
  showFirmwareModal.value = true
  resetStatus()
}

function dismissFirmwareModal() {
  if (isUpdating.value) {
    // Don't allow closing during update
    return
  }
  showFirmwareModal.value = false
  resetStatus()
}

async function startFirmwareUpdate() {
  try {
    // Step 1: Remember if we were connected via BLE
    wasConnectedBeforeUpdate.value = bleClient.isConnected()

    // Step 2: Disconnect BLE if connected
    if (wasConnectedBeforeUpdate.value) {
      await bleClient.disconnect()
      console.log('✅ BLE disconnected for firmware update')
    }

    // Step 3: Download firmware from GitHub releases
    // TODO: Replace with actual GitHub release URL
    const firmwareUrl = `https://github.com/PocketMidi/KB1-firmware/releases/latest/download/KB1-firmware-v${firmwareVersion.value || '1.5.0'}.bin`
    
    const firmwareBinary = await downloadFirmware(firmwareUrl)

    // Step 4: Flash firmware with NVS preservation
    await updateFirmware(firmwareBinary)

    console.log('✅ Firmware update complete!')
  } catch (error) {
    console.error('❌ Firmware update failed:', error)
  }
}

async function finishFirmwareUpdate() {
  // Close modal
  showFirmwareModal.value = false
  resetStatus()

  // If we were connected before, prompt user to reconnect
  if (wasConnectedBeforeUpdate.value) {
    // Wait a bit for device to reset
    setTimeout(async () => {
      try {
        await bleClient.connect()
        console.log('✅ BLE reconnected after firmware update')
      } catch (error) {
        console.error('❌ Failed to reconnect BLE:', error)
      }
    }, 2000)
  }
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

/* ============================================
   FIRMWARE UPDATE
   ============================================ */

.firmware-update-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.firmware-version {
  font-size: 0.75rem;
  color: #848484;
  font-family: 'Roboto Mono';
}

.firmware-status {
  font-size: 0.75rem;
  color: #f59e0b;
  font-family: 'Roboto Mono';
}

.firmware-status-hint {
  font-size: 0.6875rem;
  color: #848484;
  margin-top: 0.25rem;
}

.btn-firmware-update {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-firmware-update:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
}

.btn-firmware-update.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.firmware-modal {
  background: var(--color-background);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.firmware-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.firmware-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(74, 158, 255, 0.2);
  color: #4a9eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-family: 'Roboto Mono';
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

.step-text strong {
  display: block;
  color: #EAEAEA;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  font-family: 'Roboto Mono';
}

.step-text p {
  color: #848484;
  font-size: 0.75rem;
  margin: 0;
  font-family: 'Roboto Mono';
}

.firmware-note {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(13, 201, 136, 0.1);
  border: 1px solid rgba(13, 201, 136, 0.3);
  border-radius: 6px;
  color: #0DC988;
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  text-align: center;
}

.firmware-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff 0%, #0DC988 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-message {
  color: #EAEAEA;
  font-size: 0.875rem;
  font-family: 'Roboto Mono';
  text-align: center;
}

.progress-error {
  color: #ef4444;
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  text-align: center;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
}

.btn-secondary {
  padding: 0.5rem 1.5rem;
  background: rgba(106, 104, 83, 0.35);
  color: #EAEAEA;
  border: 1px solid rgba(106, 104, 83, 0.4);
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(106, 104, 83, 0.6);
}
</style>
