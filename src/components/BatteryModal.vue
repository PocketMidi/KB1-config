<template>
  <div v-if="isOpen" class="battery-modal-overlay" @click="handleOverlayClick">
    <div class="battery-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="battery-visual">
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
            <div class="speaker-bar-container">
              <div class="speaker-bar-base"></div>
              <div 
                class="speaker-bar-active"
                :style="{ width: `${10 + (speakerMinutes / 120) * 90}%` }"
              ></div>
              <input 
                type="range" 
                min="0" 
                max="120" 
                step="5"
                :value="speakerMinutes"
                @input="handleSpeakerChange"
                class="speaker-slider-hidden"
              />
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
            <span class="speaker-time-value">{{ formattedSpeakerTime }}</span>
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
            <div class="action-description">Updates battery status from device</div>
          </div>

          <div class="action-row">
            <button 
              class="action-button" 
              :class="estimatedPercentage === 254 ? 'calibrate-button' : 'recalibrate-button'"
              @click="handleRecalibrate"
              :disabled="isRecalibrating"
            >
              {{ isRecalibrating ? 'Resetting...' : (estimatedPercentage === 254 ? 'Calibrate' : 'Recalibrate') }}
            </button>
            <div class="action-description">
              {{ estimatedPercentage === 254 ? 'Connect to computer USB for 5.5hr charge' : 'Clears tracking. Requires 5.5hr charge' }}
            </div>
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
          <div class="toggle-description">Numeric percentage display</div>
        </div>

        <!-- Charging Instructions (Collapsible) -->
        <div class="charging-section">
          <div class="charging-header" @click="showChargingInstructions = !showChargingInstructions">
            <span>Charging Instructions</span>
            <span class="chevron" :class="{ expanded: showChargingInstructions }">▼</span>
          </div>
          <div v-if="showChargingInstructions" class="charging-content">
            <ol class="charging-steps">
              <li><strong>Power on <em>KB1</em> from battery first</strong></li>
              <li>Connect to computer USB port - <em>KB1</em> auto-detects charging</li>
              <li>Partial charges tracked automatically after initial calibration</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Calibration Info Dialog -->
      <div v-if="showCalibrationInfo" class="confirmation-overlay" @click="closeCalibrationInfo">
        <div class="confirmation-dialog" @click.stop>
          <h3>Begin Calibration</h3>
          <ol class="calibration-steps">
            <li><strong>Power on <em>KB1</em> from battery first</strong></li>
            <li>Connect to computer USB port - <em>KB1</em> auto-detects charging</li>
            <li>Leave connected for 5.5 hours to complete calibration</li>
          </ol>
          <div class="confirmation-actions">
            <button class="confirm-button cancel-btn" @click="closeCalibrationInfo">Got It</button>
          </div>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <div v-if="showConfirmation" class="confirmation-overlay" @click="isRecalibrating ? null : cancelRecalibrate">
        <div class="confirmation-dialog" @click.stop>
          <template v-if="!isRecalibrating">
            <h3>Reset Battery Calibration?</h3>
            <p>
              Clears all tracking data. Requires new 5.5 hour calibration charge.
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
      <div v-if="showSpeakerHelp" class="help-modal-overlay" @click="dismissSpeakerHelp">
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
              The KB1's built-in speakers draw approximately 135mA additional current (on top of the normal 95mA active drain).
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

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: 'close'): void;
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
  formattedSpeakerTime,
  syncBatteryStatus,
  resetBattery,
  toggleShowPercentage,
  setSpeakerMinutes,
} = useBatteryStatus();

const isSyncing = ref(false);
const isRecalibrating = ref(false);
const showConfirmation = ref(false);
const showCalibrationInfo = ref(false);
const showChargingInstructions = ref(false);
const showSpeakerHelp = ref(false);

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
  // Show info dialog for initial calibration (no reset needed)
  if (estimatedPercentage.value === 254) {
    showCalibrationInfo.value = true;
  } else {
    // Show confirmation dialog for recalibration (destructive)
    showConfirmation.value = true;
  }
}

async function confirmRecalibrate() {
  isRecalibrating.value = true;
  
  try {
    await resetBattery();
    // Success - battery is now uncalibrated (254)
    // Modal stays open and reactively updates to show new state
  } catch (error) {
    console.error('Battery recalibration failed:', error);
    // TODO: Show error toast
  } finally {
    isRecalibrating.value = false;
    showConfirmation.value = false; // Close dialog after reset completes
  }
}

function cancelRecalibrate() {
  showConfirmation.value = false;
}

function closeCalibrationInfo() {
  showCalibrationInfo.value = false;
  close(); // Close entire modal - user should now go plug in USB
}

function handleTogglePercentage() {
  toggleShowPercentage();
}

function handleSpeakerChange(event: Event) {
  const target = event.target as HTMLInputElement;
  setSpeakerMinutes(parseInt(target.value, 10));
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
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fff;
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
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-content {
  padding: 24px;
}

/* Battery display moved to header */

.battery-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}

.detail-label {
  color: #9ca3af;
  font-weight: 500;
}

.detail-value {
  color: #fff;
  font-weight: 600;
  font-family: 'Roboto Mono', monospace;
}

/* Speaker Compensation Section */
.speaker-compensation-section {
  margin-top: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.speaker-meter {
  width: 100%;
  margin-bottom: 12px;
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

.speaker-bar-base {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 9px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  opacity: 0.4;
  border-radius: 4.5px;
}

.speaker-bar-active {
  position: absolute;
  top: 0;
  left: 0;
  height: 9px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  opacity: 1;
  z-index: 1;
  border-radius: 4.5px;
  transition: width 0.15s ease-out;
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
  font-weight: 500;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.help-icon {
  background: rgba(156, 163, 175, 0.2);
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.help-icon:hover {
  background: rgba(156, 163, 175, 0.3);
  border-color: rgba(156, 163, 175, 0.5);
  color: #fff;
}

.speaker-slider-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.speaker-time-value {
  color: #fff;
  font-weight: 600;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8125rem;
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
  margin: 0 0 1rem 0;
  font-size: 0.8125rem;
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

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-button {
  min-width: 160px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-description {
  font-size: 0.8125rem;
  color: #9ca3af;
  line-height: 1.4;
}

.sync-button-primary {
  background: linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%);
  border: none;
  color: #fff;
  font-weight: 700;
}

.sync-button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.sync-button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.sync-button-secondary {
  background: rgba(106, 104, 83, 0.35);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: #EAEAEA;
  font-weight: 400;
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
  font-weight: 400;
}

.sync-icon {
  font-size: 0.8125rem;
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
  background: linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%);
  color: #fff;
  font-weight: 700;
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
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #000;
  font-weight: 700;
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
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
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
  font-size: 0.8125rem;
  color: #9ca3af;
  line-height: 1.4;
}

.toggle-text {
  font-size: 0.8125rem;
  font-weight: 600;
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
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #0DC988;
  border-color: #0DC988;
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.charging-section {
  margin-top: 12px;
  border: 1px solid rgba(106, 104, 83, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.charging-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(106, 104, 83, 0.08);
  cursor: pointer;
  user-select: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #848484;
  transition: background-color 0.2s ease;
}

.charging-header:hover {
  background-color: rgba(106, 104, 83, 0.15);
}

.chevron {
  font-size: 0.625rem;
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
  font-size: 0.8125rem;
  color: #d1d5db;
  line-height: 1.6;
  margin-bottom: 8px;
}

.charging-steps li:last-child {
  margin-bottom: 0;
}

.charging-steps li strong {
  color: #0DC988;
  font-weight: 600;
}

.calibration-instructions {
  margin-top: 12px;
  padding: 16px;
  background-color: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 8px;
}

.instruction-header {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4ade80;
  margin-bottom: 12px;
}

.instruction-list {
  margin: 0 0 12px 0;
  padding-left: 20px;
  color: #d1d5db;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.instruction-list li {
  margin-bottom: 6px;
}

.instruction-list strong {
  color: #fff;
  font-weight: 600;
}

.instruction-note {
  font-size: 0.8125rem;
  color: #9ca3af;
  font-style: italic;
}

.charging-progress-banner {
  margin-top: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
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
  font-size: 0.9375rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 4px;
}

.charging-subtitle {
  font-size: 0.8125rem;
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
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.charging-cancel-button:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.charging-cancel-description {
  font-size: 0.75rem;
  color: #6b7280;
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
  border-radius: 8px;
}

.warning-header {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #fbbf24;
  margin-bottom: 8px;
}

.warning-text {
  font-size: 0.8125rem;
  color: #d1d5db;
  line-height: 1.6;
}

.warning-text strong {
  color: #fff;
  font-weight: 600;
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
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.confirmation-dialog h3 {
  margin: 0 0 12px 0;
  font-size: 0.8125rem;
  color: #fff;
}

.confirmation-dialog p {
  margin: 0 0 20px 0;
  font-size: 0.8125rem;
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
  font-size: 2rem;
  color: #4a9eff;
}

.resetting-state h3 {
  margin: 0;
  font-size: 0.8125rem;
  color: #fff;
}

.resetting-state p {
  margin: 0;
  font-size: 0.8125rem;
  color: #9ca3af;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
}

.confirm-button {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.reset-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Responsive */
@media (max-width: 480px) {
  .battery-modal {
    margin: 0;
    max-width: 100%;
    border-radius: 12px;
  }

  .modal-content {
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
