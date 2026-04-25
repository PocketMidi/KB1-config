<template>
  <div v-if="isOpen" class="battery-modal-overlay" @click.stop="handleOverlayClick">
    <div class="battery-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="battery-visual" @click="handleBatteryClick" style="cursor: pointer;" title="Click 5 times for dev mode">
            <svg 
              viewBox="0 0 120 60" 
              class="battery-header-icon"
            >
              <!-- Battery Body -->
              <rect 
                x="5" 
                y="10" 
                width="100" 
                height="40" 
                rx="5" 
                :stroke="batteryColor" 
                stroke-width="3"
                fill="rgba(0, 0, 0, 0.3)"
              />
              
              <!-- Battery Terminal -->
              <path 
                d="M105 22L115 22L115 38L105 38" 
                :stroke="batteryColor" 
                stroke-width="3" 
                stroke-linecap="round"
              />
              
              <!-- Battery Fill Level (hide if uncalibrated OR if showing percentage) -->
              <rect 
                v-if="estimatedPercentage !== 254 && !showPercentage"
                x="10" 
                y="15" 
                :width="fillWidthLarge" 
                height="30" 
                rx="3" 
                :fill="batteryColor"
              />
              
              <!-- Question mark for uncalibrated -->
              <text 
                v-if="estimatedPercentage === 254"
                x="55" 
                y="40" 
                font-family="Arial, sans-serif" 
                font-size="32" 
                font-weight="bold"
                text-anchor="middle" 
                :fill="batteryColor"
              >?</text>
              
              <!-- Percentage text inside battery (when calibrated and enabled) -->
              <text 
                v-if="showPercentage && estimatedPercentage !== 254"
                x="55" 
                y="35" 
                font-family="'Roboto Mono', monospace" 
                font-size="24" 
                font-weight="700"
                text-anchor="middle" 
                dominant-baseline="middle"
                :fill="batteryColor"
              >{{ estimatedPercentage }}</text>
            </svg>
          </div>
          <h2>Battery Status</h2>
        </div>
        <button 
          class="close-button" 
          @click="close"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">

        <!-- Details -->
        <div class="battery-details">
          <!-- Estimated Runtime -->
          <div class="detail-row">
            <span class="detail-label">Estimated Runtime:</span>
            <span class="detail-value">{{ formattedRemainingTime }}</span>
          </div>

          <!-- Last Updated -->
          <div class="detail-row">
            <span class="detail-label">Last Synced:</span>
            <span class="detail-value">{{ timeSinceSync }}</span>
          </div>
        </div>
          
        <!-- Speaker Compensation -->
        <div class="speaker-compensation-section">
          <div class="speaker-meter">
            <div 
              class="speaker-bar-container"
              @mousedown="handleBarMouseDown"
              @touchstart="handleBarTouchStart"
            >
              <!-- 4-segment background: green | yellow | orange | red -->
              <div class="speaker-segments">
                <div class="segment segment-green"></div>
                <div class="segment segment-yellow"></div>
                <div class="segment segment-orange"></div>
                <div class="segment segment-red"></div>
              </div>
              <!-- Active overlay (darkens unused portion) -->
              <div 
                class="speaker-bar-inactive"
                :style="{ left: `${Math.max(2, (speakerMinutes / 420) * 100)}%`, width: `${100 - Math.max(2, (speakerMinutes / 420) * 100)}%` }"
              ></div>
            </div>
          </div>
          
          <div class="speaker-controls">
            <div class="speaker-label-with-help">
              <label>SPEAKER COMPENSATION</label>
              <button 
                class="help-icon"
                @click="showSpeakerHelp = true"
                title="What is this?"
              >?</button>
            </div>
            <div class="duration-control-wrapper">
              <ValueControl
                v-model="speakerMinutesModel"
                :min="0"
                :max="420"
                :step="5"
                :small-step="5"
                :large-step="15"
              />
              <span class="unit-label">min</span>
            </div>
          </div>
        </div>

        <!-- Dev Mode (Hidden) -->
        <div v-if="devModeUnlocked" class="dev-mode-section">
          <div class="dev-mode-header">
            <span>BATTERY LEVEL</span>
            <button class="dev-close" @click="devModeUnlocked = false">×</button>
          </div>
          <div class="action-row">
            <button 
              class="action-button dev-button"
              @click="handleSetBatteryPercent"
              :disabled="!props.isConnected || isSettingBattery"
            >
              {{ isSettingBattery ? 'Setting...' : 'Set' }}
            </button>
            <div class="dev-value-wrapper">
              <ValueControl
                v-model="devBatteryPercent"
                :min="0"
                :max="100"
                :step="1"
                :small-step="1"
                :large-step="10"
              />
              <span class="unit-label">%</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <div class="action-row">
            <button 
              class="action-button" 
              :class="estimatedPercentage === 254 ? 'sync-button-secondary' : 'sync-button-primary'"
              @click="handleSync"
              :disabled="isSyncing"
            >
              {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
            </button>
            <div class="action-description">Battery status update</div>
          </div>

          <div class="action-row">
            <button 
              class="action-button recalibrate-button"
              @click="handleRecalibrate"
              :disabled="isRecalibrating || estimatedPercentage === 254"
            >
              {{ isRecalibrating ? 'Resetting...' : 'Recalibrate' }}
            </button>
            <div class="action-description">Prior tracking cleared</div>
          </div>
        </div>
        
        <!-- Show Percentage Toggle Switch -->
        <div class="percentage-toggle-section">
          <label class="toggle-switch-label">
            <span class="toggle-text">Show %</span>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                :checked="showPercentage"
                @change="handleTogglePercentage"
              >
              <span class="toggle-slider"></span>
            </div>
          </label>
          <div class="toggle-description">Numeric display</div>
        </div>

        <!-- Charging Instructions (always visible, dimmed when calibrated) -->
        <div class="charging-section" :class="{ dimmed: estimatedPercentage !== 254 }">
          <ol class="charging-steps">
            <li><strong>Switch ON battery power</strong></li>
            <li>Connect to computer USB — charging auto-detected</li>
            <li>Initial calibration requires 5 hour charge</li>
          </ol>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <div v-if="showConfirmation" class="confirmation-overlay" @click.stop="isRecalibrating ? null : cancelRecalibrate">
        <div class="confirmation-dialog" @click.stop>
          <template v-if="!isRecalibrating">
            <h3>Reset Battery Calibration?</h3>
            <p>
              Clears all tracking data. Requires new 5 hour calibration charge.
            </p>
            <div class="confirmation-actions">
              <button class="confirm-button cancel-btn" @click="cancelRecalibrate">Cancel</button>
              <button class="confirm-button reset-btn" @click="confirmRecalibrate">Reset</button>
            </div>
          </template>
          <template v-else>
            <div class="resetting-state">
              <span class="sync-icon spinning">↻</span>
              <h3>Resetting...</h3>
              <p>Clearing battery calibration data</p>
            </div>
          </template>
        </div>
      </div>
      
      <!-- Speaker Help Modal -->
      <div v-if="showSpeakerHelp" class="help-modal-overlay" @click.stop="dismissSpeakerHelp">
        <div class="help-modal" @click.stop>
          <div class="help-modal-header">
            <h3>SPEAKER COMPENSATION</h3>
            <button class="close-btn" @click="dismissSpeakerHelp">×</button>
          </div>
          <div class="help-modal-body">
            <p>
              Since speaker usage is analog and can't be automatically tracked, use this slider to manually report how long you've used the speakers. This helps provide a more accurate battery estimate.
            </p>
            <p>
              The color bar reflects real battery behavior: <strong style="color: #22c55e">green</strong> and <strong style="color: #eab308">yellow</strong> zones are full volume. <strong style="color: #f97316">Orange</strong> is where volume starts tapering. <strong style="color: #ef4444">Red</strong> means low volume but MIDI still works. A full battery lasts about 3.5 hours with speakers.
            </p>
          </div>
          <div class="help-modal-footer">
            <button class="btn-primary" @click="dismissSpeakerHelp">Got it</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBatteryStatus } from '../composables/useBatteryStatus';
import { useToast } from '../composables/useToast';
import { bleClient } from '../ble/bleClient';
import ValueControl from './ValueControl.vue';

interface Props {
  isOpen: boolean;
  isConnected: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'needs-connect'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const {
  batteryColor,
  estimatedPercentage,
  showPercentage,
  timeSinceSync,
  formattedRemainingTime,
  speakerMinutes,
  syncBatteryStatus,
  resetBattery,
  toggleShowPercentage,
  setSpeakerMinutes,
} = useBatteryStatus();

const toast = useToast();

const isSyncing = ref(false);
const isRecalibrating = ref(false);
const showConfirmation = ref(false);
const showSpeakerHelp = ref(false);

// Dev Mode: Secret menu for manual battery % setting
const devModeUnlocked = ref(false);
const devBatteryPercent = ref(80);
const isSettingBattery = ref(false);
const clickCount = ref(0);
const clickTimer = ref<number | null>(null);

// Calculate large battery fill width (max 90 for visual)
const fillWidthLarge = computed(() => {
  const percentage = estimatedPercentage.value;
  if (percentage === 254) return 0; // Uncalibrated - no fill
  if (percentage === 255) return 0; // Charging - no fill (show lightning instead)
  return Math.max(0, Math.min(90, (percentage / 100) * 90));
});

function close() {
  emit('close');
}

function handleOverlayClick() {
  close();
}

async function handleSync() {
  if (!props.isConnected) { emit('needs-connect'); return; }
  if (isSyncing.value) return;
  
  isSyncing.value = true;
  try {
    await syncBatteryStatus();
  } catch (error) {
    console.error('Battery sync failed:', error);
  } finally {
    isSyncing.value = false;
  }
}

function handleRecalibrate() {
  // Recalibrate requires device connection (destructive write)
  if (!props.isConnected) { emit('needs-connect'); return; }
  // Show confirmation dialog for recalibration (destructive)
  showConfirmation.value = true;
}

async function confirmRecalibrate() {
  isRecalibrating.value = true;
  
  try {
    await resetBattery();
    // Success - battery is now uncalibrated (254)
    // Modal stays open and reactively updates to show new state
  } catch (error) {
    console.error('Battery recalibration failed:', error);
    // No toast - UI shows result (icon stays at current % if BLE write fails)
  } finally {
    isRecalibrating.value = false;
    showConfirmation.value = false; // Close dialog after reset completes
  }
}

function cancelRecalibrate() {
  showConfirmation.value = false;
}

function handleTogglePercentage() {
  toggleShowPercentage();
}

// Handle battery icon clicks for dev mode unlock
function handleBatteryClick() {
  clickCount.value++;
  
  // Reset timer
  if (clickTimer.value) {
    clearTimeout(clickTimer.value);
  }
  
  // 5 clicks within 2 seconds = unlock
  if (clickCount.value >= 5) {
    devModeUnlocked.value = true;
    devBatteryPercent.value = estimatedPercentage.value ?? 80;
    clickCount.value = 0;
    return;
  }
  
  // Reset counter after 2 seconds
  clickTimer.value = window.setTimeout(() => {
    clickCount.value = 0;
  }, 2000);
}

// Set battery percentage via BLE (dev mode)
async function handleSetBatteryPercent() {
  if (!props.isConnected) {
    emit('needs-connect');
    return;
  }
  
  if (devBatteryPercent.value < 0 || devBatteryPercent.value > 100) {
    toast.warning('Battery % must be between 0-100');
    return;
  }
  
  isSettingBattery.value = true;
  try {
    await bleClient.setBatteryPercentage(devBatteryPercent.value);
    toast.success(`Battery set to ${devBatteryPercent.value}%`);
    // Sync to refresh display
    await new Promise(resolve => setTimeout(resolve, 500));
    await syncBatteryStatus();
  } catch (error) {
    console.error('Failed to set battery %:', error);
    toast.error('Failed to set battery %');
  } finally {
    isSettingBattery.value = false;
  }
}

const speakerMinutesModel = computed({
  get: () => speakerMinutes.value,
  set: (val: number) => setSpeakerMinutes(val),
});

function updateSpeakerFromPosition(clientX: number, rect: DOMRect) {
  const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  const minutes = Math.round((percentage / 100) * 420 / 5) * 5; // snap to step 5
  setSpeakerMinutes(minutes);
}

function handleBarMouseDown(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  updateSpeakerFromPosition(event.clientX, rect);

  const onMouseMove = (e: MouseEvent) => updateSpeakerFromPosition(e.clientX, rect);
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function handleBarTouchStart(event: TouchEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (event.touches[0]) updateSpeakerFromPosition(event.touches[0].clientX, rect);

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) updateSpeakerFromPosition(e.touches[0].clientX, rect);
  };
  const onTouchEnd = () => {
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
  };
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
}

function dismissSpeakerHelp() {
  showSpeakerHelp.value = false;
}

</script>

<style scoped>
.battery-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.battery-modal {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: #EAEAEA;
}

.battery-visual {
  width: 90px;
  height: 45px;
  flex-shrink: 0;
}

.battery-header-icon {
  width: 100%;
  height: 100%;
}

.close-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--kb1-radius-md);
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #EAEAEA;
}

.modal-content {
  padding: 18px 24px;
}

/* Battery display moved to header */

.battery-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: var(--kb1-radius-lg);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--kb1-font-input);
}

.detail-label {
  color: #9ca3af;
  font-weight: var(--kb1-font-weight-medium);
}

.detail-value {
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-semibold);
  font-family: var(--kb1-font-family);
}

/* Speaker Compensation Section */
.speaker-compensation-section {
  margin-top: 12px;
  margin-bottom: 15px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: var(--kb1-radius-lg);
}

.speaker-meter {
  width: 100%;
  margin-bottom: 8px;
}

.speaker-bar-container {
  position: relative;
  height: 9px;
  width: 100%;
  overflow: hidden;
  border-radius: 4.5px;
  cursor: pointer;
  user-select: none;
}

.speaker-segments {
  display: flex;
  width: 100%;
  height: 9px;
  border-radius: 4.5px;
  overflow: hidden;
}

.segment {
  height: 100%;
}

/* 4 segments: Green 0-2hr / Yellow 2-4hr / Orange 4-6hr / Red 6-7hr */
.segment-green  { width: 28.6%; background: #22c55e; }
.segment-yellow { width: 28.6%; background: #eab308; }
.segment-orange { width: 28.5%; background: #f97316; }
.segment-red    { width: 14.3%; background: #ef4444; }

.speaker-bar-inactive {
  position: absolute;
  top: 0;
  height: 9px;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1;
  transition: left 0.15s ease-out, width 0.15s ease-out;
}

.speaker-bar-inactive::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 0;
  width: 5px;
  height: 9px;
  background: radial-gradient(circle at 0% 50%, transparent 4px, rgba(0, 0, 0, 0.7) 4.5px);
}

.speaker-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speaker-label-with-help {
  display: flex;
  align-items: center;
  gap: 6px;
}

.speaker-label-with-help label {
  color: #9ca3af;
  font-weight: var(--kb1-font-weight-medium);
  font-size: var(--kb1-font-input);
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.help-icon {
  background: rgba(156, 163, 175, 0.2);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: var(--kb1-radius-full);
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 10px;
  font-weight: var(--kb1-font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.help-icon:hover {
  background: rgba(156, 163, 175, 0.3);
  border-color: rgba(156, 163, 175, 0.5);
  color: #EAEAEA;
}

.duration-control-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.unit-label {
  font-size: var(--kb1-font-input);
  color: #EAEAEA;
  font-family: var(--kb1-font-family);
  font-weight: var(--kb1-font-weight-normal);
  cursor: default;
  user-select: none;
}

/* Help Modal Styles (matching app-wide pattern) */
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
  border-radius: var(--kb1-radius-lg);
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: var(--kb1-font-family);
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
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: #EAEAEA;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--kb1-font-title);
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--kb1-radius-sm);
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
  margin: 0 0 1rem 0;
  font-size: var(--kb1-font-input);
  line-height: 1.6;
  color: var(--color-text);
}

.help-modal-body p:last-child {
  margin-bottom: 0;
}

.help-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.help-modal-footer .btn-primary {
  padding: 0.5rem 1.5rem; /* 8px top/bottom, 24px left/right */
  background: #5dad6b; /* Standardized green for all modals */
  color: #1A1A1A; /* Dark text on green button */
  border: none;
  border-radius: var(--kb1-radius-sm);
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  opacity: 0.9; /* Slight dim on hover */
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.action-button {
  min-width: 160px;
  padding: 8px 16px;
  border-radius: var(--kb1-radius-lg);
  border: none;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-description {
  font-size: var(--kb1-font-input);
  color: #9ca3af;
  line-height: 1.4;
}

.sync-button-primary {
  background: linear-gradient(135deg, var(--kb1-color-primary) 0%, var(--kb1-color-primary) 100%);
  border: none;
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-bold);
}

.sync-button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.sync-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.6);
  font-weight: var(--kb1-font-weight-normal);
}

.sync-button-secondary {
  background: rgba(106, 104, 83, 0.35);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-normal);
}

.sync-button-secondary:hover:not(:disabled) {
  background: rgba(106, 104, 83, 0.6);
  border-color: rgba(106, 104, 83, 0.7);
  transform: translateY(-2px);
}

.sync-button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #848484;
  font-weight: var(--kb1-font-weight-normal);
}

.sync-icon {
  font-size: var(--kb1-font-input);
  line-height: 1;
}

.sync-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.calibrate-button {
  background: linear-gradient(135deg, var(--kb1-color-primary) 0%, var(--kb1-color-primary) 100%);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-bold);
}

.calibrate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.calibrate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recalibrate-button {
  background: linear-gradient(135deg, var(--ui-highlight-hover) 0%, var(--ui-highlight) 100%);
  color: #000;
  font-weight: var(--kb1-font-weight-bold);
}

.recalibrate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.recalibrate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Percentage Toggle Section */
.percentage-toggle-section {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px;
  margin-bottom: 8px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: var(--kb1-radius-lg);
}

.toggle-switch-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.toggle-description {
  font-size: var(--kb1-font-input);
  color: #9ca3af;
  line-height: 1.4;
}

.toggle-text {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: #d1d5db;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(234, 234, 234, 0.2);
  border: 1px solid rgba(234, 234, 234, 0.3);
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: #EAEAEA;
  transition: 0.3s;
  border-radius: var(--kb1-radius-full);
}

input:checked + .toggle-slider {
  background-color: var(--battery-good);
  border-color: var(--battery-good);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.charging-section {
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(106, 104, 83, 0.3);
  border-radius: var(--kb1-radius-lg);
  background-color: rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
}

.charging-section.dimmed {
  opacity: 0.35;
}

.charging-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(106, 104, 83, 0.08);
  cursor: pointer;
  user-select: none;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: #848484;
  transition: background-color 0.2s ease;
}

.charging-header:hover {
  background-color: rgba(106, 104, 83, 0.15);
}

.chevron {
  font-size: var(--kb1-font-tiny);
  transition: transform 0.2s ease;
  color: #848484;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.charging-content {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.2);
}

.charging-steps {
  margin: 0;
  padding-left: 24px;
  list-style-type: decimal;
}

.charging-steps li {
  font-size: var(--kb1-font-input);
  color: #d1d5db;
  line-height: 1.6;
  margin-bottom: 8px;
}

.charging-steps li:last-child {
  margin-bottom: 0;
}

.charging-steps li strong {
  color: #5dad6b;
  font-weight: var(--kb1-font-weight-semibold);
}

.calibration-instructions {
  margin-top: 12px;
  padding: 16px;
  background-color: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: var(--kb1-radius-lg);
}

.instruction-header {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: var(--battery-good);
  margin-bottom: 12px;
}

.instruction-list {
  margin: 0 0 12px 0;
  padding-left: 20px;
  color: #d1d5db;
  font-size: var(--kb1-font-input);
  line-height: 1.6;
}

.instruction-list li {
  margin-bottom: 6px;
}

.instruction-list strong {
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-semibold);
}

.instruction-note {
  font-size: var(--kb1-font-input);
  color: #9ca3af;
  font-style: italic;
}

.charging-progress-banner {
  margin-top: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--kb1-radius-xl);
}

.charging-progress-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.charging-icon-pulse {
  font-size: 2.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.charging-text {
  flex: 1;
}

.charging-title {
  font-size: var(--kb1-font-large);
  font-weight: var(--kb1-font-weight-semibold);
  color: var(--kb1-color-primary);
  margin-bottom: 4px;
}

.charging-subtitle {
  font-size: var(--kb1-font-input);
  color: #9ca3af;
  line-height: 1.5;
}

.charging-progress-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.charging-cancel-button {
  width: 100%;
  padding: 10px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--kb1-radius-lg);
  color: var(--battery-critical);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;
}

.charging-cancel-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.charging-cancel-description {
  font-size: var(--kb1-font-label);
  color: var(--battery-disconnected);
  text-align: center;
  font-style: italic;
}

.charging-cancel-description em {
  font-style: italic;
  color: #9ca3af;
}

.bypass-warning {
  margin-top: 12px;
  padding: 16px;
  background-color: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: var(--kb1-radius-lg);
}

.warning-header {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  color: var(--ui-highlight-hover);
  margin-bottom: 8px;
}

.warning-text {
  font-size: var(--kb1-font-input);
  color: #d1d5db;
  line-height: 1.6;
}

.warning-text strong {
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-semibold);
}

.confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.confirmation-dialog {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border-radius: var(--kb1-radius-xl);
  padding: 24px;
  max-width: 400px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.confirmation-dialog h3 {
  margin: 0 0 12px 0;
  font-size: var(--kb1-font-input);
  color: #EAEAEA;
}

.confirmation-dialog p {
  margin: 0 0 20px 0;
  font-size: var(--kb1-font-input);
  color: #d1d5db;
  line-height: 1.6;
}

.resetting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.resetting-state .sync-icon {
  font-size: var(--kb1-font-display-sm);
  color: var(--kb1-color-primary);
}

.resetting-state h3 {
  margin: 0;
  font-size: var(--kb1-font-input);
  color: #EAEAEA;
}

.resetting-state p {
  margin: 0;
  font-size: var(--kb1-font-input);
  color: #9ca3af;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
}

.confirm-button {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--kb1-radius-lg);
  border: none;
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: #EAEAEA;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.reset-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #EAEAEA;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Dev Mode */
.dev-mode-section {
  margin-bottom: 8px;
  padding: 12px;
  background-color: rgba(106, 104, 83, 0.15);
  border: 1px solid rgba(106, 104, 83, 0.3);
  border-radius: var(--kb1-radius-lg);
}

.dev-mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: var(--kb1-font-label);
  font-weight: var(--kb1-font-weight-semibold);
  color: #d1d5db;
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}

.dev-close {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-size: var(--kb1-font-heading);
  line-height: 1;
  border-radius: var(--kb1-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dev-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #EAEAEA;
}

.dev-button {
  background: rgba(106, 104, 83, 0.35);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-normal);
}

.dev-button:hover:not(:disabled) {
  background: rgba(106, 104, 83, 0.6);
  border-color: rgba(106, 104, 83, 0.7);
  transform: translateY(-2px);
}

.dev-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #848484;
}

.dev-input {
  width: 70px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(106, 104, 83, 0.4);
  border-radius: var(--kb1-radius-md);
  color: #EAEAEA;
  font-size: var(--kb1-font-input);
  font-family: monospace;
  text-align: center;
  transition: all 0.2s ease;
}

.dev-input:focus {
  outline: none;
  border-color: rgba(106, 104, 83, 0.7);
  background: rgba(0, 0, 0, 0.4);
}

.dev-input::-webkit-inner-spin-button,
.dev-input::-webkit-outer-spin-button {
  opacity: 1;
}

.dev-value-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Responsive */
@media (max-width: 480px) {
  .battery-modal {
    margin: 0;
    max-width: 100%;
    border-radius: var(--kb1-radius-xl);
  }

  .modal-content {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
