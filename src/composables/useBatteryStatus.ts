/**
 * Battery Status Composable
 * 
 * Manages battery status for the KB1 device with client-side estimation
 * between BLE syncs to minimize BLE traffic.
 */

import { ref, computed } from 'vue';
import type { BatteryStatus } from '../ble/kb1Protocol';
import { bleClient } from '../ble/bleClient';
import { useUIPreferences } from './useUIPreferences';

// Battery state
const batteryStatus = ref<BatteryStatus | null>(null);
const lastSyncTime = ref<number>(0);
const isAvailable = ref(false);

// UI preference: show percentage in icon
const PREF_KEY = 'kb1-battery-show-percentage';
const showPercentage = ref<boolean>(localStorage.getItem(PREF_KEY) === 'true');

// Low battery alert tracking
const lastAlertPercentage = ref<number>(100);

// Constants
const ACTIVE_DRAIN_MA = 95; // Active mode current draw
const BATTERY_CAPACITY_MAH = 420;
const SPEAKER_DRAIN_MA = 135; // Speaker amp additional drain (typical volume average)

// Speaker compensation tracking (app-only, localStorage)
const SPEAKER_TIME_KEY = 'kb1-battery-speaker-minutes';
const speakerMinutes = ref<number>(parseInt(localStorage.getItem(SPEAKER_TIME_KEY) || '0', 10));

/**
 * Initialize battery monitoring (call on BLE connection)
 */
async function initBatteryStatus() {
  const { batteryMonitoringEnabled } = useUIPreferences();
  
  // Skip if battery monitoring is disabled
  if (!batteryMonitoringEnabled.value) {
    isAvailable.value = false;
    return;
  }
  
  isAvailable.value = bleClient.hasBatteryStatus();
  
  if (isAvailable.value) {
    await syncBatteryStatus();
  }
}

/**
 * Sync battery status from device (piggyback on BLE operations)
 */
async function syncBatteryStatus() {
  try {
    const status = await bleClient.readBatteryStatus();
    
    if (!status) {
      console.warn('Battery status not available from device');
      return;
    }
    
    batteryStatus.value = status;
    lastSyncTime.value = Date.now();
    
    // Check for low battery alerts
    checkLowBatteryAlert(status.percentage);
  } catch (error) {
    console.error('Failed to sync battery status:', error);
  }
}

/**
 * Get current battery percentage with client-side estimation
 * Estimates drain based on time elapsed since last sync
 */
function getEstimatedPercentage(): number {
  if (!batteryStatus.value) return 100;
  
  const syncedPercentage = batteryStatus.value.percentage;
  
  // Uncalibrated state
  if (syncedPercentage === 254) return 254;
  
  // Already at 100% or no time elapsed
  if (syncedPercentage === 100 || !lastSyncTime.value) {
    return syncedPercentage;
  }
  
  // Calculate estimated drain since last sync
  const elapsedMs = Date.now() - lastSyncTime.value;
  const elapsedHours = elapsedMs / 3600000;
  const drainedMah = elapsedHours * ACTIVE_DRAIN_MA;
  const drainedPercentage = (drainedMah / BATTERY_CAPACITY_MAH) * 100;
  
  // Add speaker compensation drain (user-reported usage time)
  const speakerHours = speakerMinutes.value / 60;
  const speakerDrainMah = speakerHours * SPEAKER_DRAIN_MA;
  const speakerDrainPercentage = (speakerDrainMah / BATTERY_CAPACITY_MAH) * 100;
  
  // Subtract estimated drain + speaker drain (but never go below 0)
  const estimated = Math.max(0, syncedPercentage - drainedPercentage - speakerDrainPercentage);
  
  return Math.round(estimated);
}

/**
 * Get estimated remaining time in seconds
 * Note: Speaker compensation is already applied to percentage,
 * so we don't apply it again here
 */
function getEstimatedRemainingSeconds(): number {
  if (!batteryStatus.value) return 0;
  
  const percentage = getEstimatedPercentage();
  
  // If on USB or at special values
  if (batteryStatus.value.usbConnected || percentage === 100 || percentage === 254 || percentage === 0) return 0;
  
  const remainingMah = (percentage / 100) * BATTERY_CAPACITY_MAH;
  const remainingHours = remainingMah / ACTIVE_DRAIN_MA;
  
  return Math.round(remainingHours * 3600);
}

/**
 * Format remaining time as human-readable string
 */
function formatRemainingTime(seconds: number): string {
  if (seconds === 0) return '---';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get battery status level (for color coding)
 */
const batteryLevel = computed(() => {
  const percentage = getEstimatedPercentage();
  
  if (percentage === 254) return 'uncalibrated'; // Needs calibration
  if (percentage > 50) return 'good'; // Green
  if (percentage > 20) return 'warning'; // Yellow
  return 'critical'; // Red
});

/**
 * Get battery color based on level
 */
const batteryColor = computed(() => {
  switch (batteryLevel.value) {
    case 'uncalibrated': return '#6b7280'; // Gray for uncalibrated
    case 'good': return '#4ade80'; // Green
    case 'warning': return '#fbbf24'; // Yellow
    case 'critical': return '#ef4444'; // Red
    default: return '#9ca3af'; // Gray
  }
});

/**
 * Check if battery alert should be shown
 */
function checkLowBatteryAlert(percentage: number) {
  // Skip if on USB, uncalibrated, or already showed alert for this level
  if (percentage === 254 || batteryStatus.value?.usbConnected || percentage >= lastAlertPercentage.value) {
    lastAlertPercentage.value = percentage;
    return;
  }
  
  // Show alert at 20% and 10%
  if (percentage <= 10 && lastAlertPercentage.value > 10) {
    showBatteryAlert('critical', percentage);
    lastAlertPercentage.value = 10;
  } else if (percentage <= 20 && lastAlertPercentage.value > 20) {
    showBatteryAlert('warning', percentage);
    lastAlertPercentage.value = 20;
  }
}

/**
 * Show battery alert (emit event for toast)
 */
function showBatteryAlert(level: 'warning' | 'critical', percentage: number) {
  const remainingSeconds = getEstimatedRemainingSeconds();
  const remainingTime = formatRemainingTime(remainingSeconds);
  
  const message = level === 'critical'
    ? `Battery critical (${percentage}%) - about ${remainingTime} remaining`
    : `Battery low (${percentage}%) - about ${remainingTime} remaining`;
  
  // Emit custom event for toast notifications
  window.dispatchEvent(new CustomEvent('battery-alert', {
    detail: { level, percentage, message }
  }));
}

/**
 * Reset battery calibration (recalibrate)
 * Sends reset command to device and forces battery to uncalibrated state
 */
async function resetBattery() {
  try {
    await bleClient.resetBattery();
    
    // Immediately sync to get updated uncalibrated state (254)
    await syncBatteryStatus();
    
    // Reset speaker time on fresh calibration
    setSpeakerMinutes(0);
    
    console.log('✅ Battery reset to uncalibrated - ready for recalibration');
  } catch (error) {
    console.error('Failed to reset battery:', error);
    throw error;
  }
}

/**
 * Toggle show percentage preference
 */
function toggleShowPercentage() {
  showPercentage.value = !showPercentage.value;
  localStorage.setItem(PREF_KEY, showPercentage.value.toString());
}

/**
 * Get time since last sync in human-readable format
 */
function getTimeSinceSync(): string {
  if (!lastSyncTime.value) return 'Never';
  
  const elapsed = Date.now() - lastSyncTime.value;
  const seconds = Math.floor(elapsed / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

/**
 * Set speaker usage time (minutes) - persists to localStorage
 */
function setSpeakerMinutes(minutes: number) {
  // Clamp to 0-120 (2 hours max)
  const clamped = Math.max(0, Math.min(120, minutes));
  speakerMinutes.value = clamped;
  localStorage.setItem(SPEAKER_TIME_KEY, clamped.toString());
}

/**
 * Format speaker minutes as H:MM
 */
function formatSpeakerTime(): string {
  const hours = Math.floor(speakerMinutes.value / 60);
  const mins = speakerMinutes.value % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function useBatteryStatus() {
  return {
    // State
    batteryStatus,
    isAvailable,
    showPercentage,
    lastSyncTime,
    speakerMinutes,
    
    // Computed
    batteryLevel,
    batteryColor,
    estimatedPercentage: computed(() => getEstimatedPercentage()),
    estimatedRemainingSeconds: computed(() => getEstimatedRemainingSeconds()),
    formattedRemainingTime: computed(() => formatRemainingTime(getEstimatedRemainingSeconds())),
    timeSinceSync: computed(() => getTimeSinceSync()),
    formattedSpeakerTime: computed(() => formatSpeakerTime()),
    
    // Methods
    initBatteryStatus,
    syncBatteryStatus,
    resetBattery,
    toggleShowPercentage,
    setSpeakerMinutes,
  };
}
