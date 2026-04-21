/**
 * KB1 Protocol - Device-specific encoding and decoding
 * 
 * This module handles the KB1-specific protocol for encoding and decoding
 * messages sent to/from the device. It provides a clean abstraction over
 * the raw BLE data transfer.
 * 
 * BLE PROTOCOL VERSION: 3
 * Breaking changes from v2:
 * - Scale validation allows rootNote=0 for Chromatic mode
 * - Strum speed uses bipolar CC 200 mapping (-360 to +360)
 */

export const BLE_PROTOCOL_VERSION = 3;

/**
 * Detailed validation result with error messages
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * MIDI CC (Continuous Controller) mapping configuration
 */
export interface CCMapping {
  faderIndex: number;
  ccNumber: number;
  channel: number;
  minValue: number;
  maxValue: number;
}

/**
 * Lever settings configuration
 */
export interface LeverSettings {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  stepSize: number;
  functionMode: number;
  valueMode: number;
  onsetTime: number;
  offsetTime: number;
  onsetType: number;
  offsetType: number;
}

/**
 * Lever Push settings configuration
 */
export interface LeverPushSettings {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  functionMode: number;
  onsetTime: number;
  offsetTime: number;
  onsetType: number;
  offsetType: number;
}

/**
 * Touch Sensor settings configuration
 */
export interface TouchSettings {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  functionMode: number;
  /** Touch threshold value (0-65535). Default: 36800 (20%). Lower = more sensitive */
  threshold?: number;
  /** For pattern selector direction: 0=FWD (forward), >0=REV (reverse) */
  offsetTime?: number;
}

/**
 * Scale settings configuration
 */
export interface ScaleSettings {
  scaleType: number;
  rootNote: number;
  keyMapping: number; // 0 = Natural, 1 = Compact
}

/**
 * Chord settings configuration
 */
export interface ChordSettings {
  playMode: number;        // 0 = SCALE, 1 = CHORD
  chordType: number;       // MAJOR=0, MINOR=1, DIMINISHED=2, AUGMENTED=3, SUS2=4, SUS4=5, POWER=6, MAJOR7=7, MINOR7=8, DOM7=9, MAJOR_ADD9=10, MINOR_ADD9=11, MAJOR6=12, MINOR6=13, MAJOR9=14
  strumEnabled: boolean;   // false = chord (all notes together), true = strum (cascaded)
  velocitySpread: number;  // 0-100 (percentage) - velocity variation for chord notes
  strumSpeed: number;      // -360 to -4 (reverse) or 4 to 360 (forward) - milliseconds delay, sign = direction
  strumPattern: number;    // 0-7 - pattern index (0 = use chord type, 1-7 = interval patterns)
  strumSwing: number;      // 0-100 (percentage) - swing amount for strum timing
  voicing: number;         // 1-3 (octave range: 1x, 2x, 3x)
  strumIntervals?: number[]; // Custom interval pattern (semitones from root) - UI only
  buildMode?: string;      // Build mode: 'up', 'down', 'updown', 'inclusive', 'exclusive', 'random' - UI only
}

/**
 * System/Power settings configuration
 * 
 * Constraints:
 * - Deep sleep is automatically set to light sleep + 90s (fixed warning period)
 * - BLE timeout determines how long web app connection prevents sleep
 * - BLE radio is disabled when entering sleep modes
 */
export interface SystemSettings {
  /** Light sleep timeout in seconds (range: 180-600s, default: 300s) */
  lightSleepTimeout: number;
  /** Deep sleep timeout in seconds (auto-calculated: lightSleep + 90s) */
  deepSleepTimeout: number;
  /** BLE keepalive timeout in seconds - web app pings prevent sleep (range: 300-1200s, default: 600s) */
  bleTimeout: number;
}

/**
 * Type aliases for component models
 */
export type LeverModel = LeverSettings;
export type LeverPushModel = LeverPushSettings;
export type TouchModel = TouchSettings;
export type ScaleModel = ScaleSettings;
export type ChordModel = ChordSettings;
export type SystemModel = SystemSettings;

/**
 * Device settings configuration
 */
export interface DeviceSettings {
  lever1: LeverSettings;
  leverPush1: LeverPushSettings;
  lever2: LeverSettings;
  leverPush2: LeverPushSettings;
  touch: TouchSettings;
  scale: ScaleSettings;
  chord: ChordSettings;
  system: SystemSettings;
}

/**
 * Complete device state
 */
export interface KB1DeviceState {
  ccMappings: CCMapping[];
  settings: DeviceSettings;
}

/**
 * Device preset metadata (from firmware)
 */
export interface DevicePresetMetadata {
  slot: number;           // 0-7
  name: string;           // Max 32 chars
  timestamp: number;      // Unix timestamp
  isValid: boolean;       // true if slot has data
}

/**
 * Device preset system constants
 */
export const DEVICE_PRESET = {
  MAX_SLOTS: 8,
  NAME_MAX_LENGTH: 32,
  EMPTY_SLOT_NAME: '[Empty]',
} as const;

/**
 * Battery status from device
 */
export interface BatteryStatus {
  /** Battery percentage: 0-100 (battery %), 254 = uncalibrated (needs full charge), 255 = charging/USB powered */
  percentage: number;
  /** Estimated remaining seconds on battery */
  remainingSeconds: number;
  /** USB connection status: true = plugged in */
  usbConnected: boolean;
  /** Calibration timestamp: seconds since boot when calibration completed (0 = never calibrated) */
  calibrationTimestamp: number;
  /** Last update timestamp (client-side) */
  lastUpdate?: number;
}

/**
 * Message types for KB1 protocol
 */
export enum KB1MessageType {
  // TODO: Define actual KB1 message types
  GET_CC_MAPPING = 0x01,
  SET_CC_MAPPING = 0x02,
  GET_SETTINGS = 0x03,
  SET_SETTINGS = 0x04,
  SAVE_TO_FLASH = 0x05,
  // Add more as protocol is defined
}

/**
 * Function mode constants (from firmware)
 * Note: Different sections use different numeric values for their modes
 */
export enum FunctionMode {
  // Generic/shared modes
  CONTINUOUS = 0,
  TOGGLE = 1,
  MOMENTARY = 2,
  INTERPOLATED = 3,
  RESET = 4,
}

/**
 * Lever Function Mode constants (firmware values)
 */
export enum LeverFunctionMode {
  INTERPOLATED = 0,
  PEAK_DECAY = 1,
  INCREMENTAL = 2,
}

/**
 * Lever Push Function Mode constants (firmware values)
 */
export enum LeverPushFunctionMode {
  INTERPOLATED = 0,
  PEAK_DECAY = 1,
  STATIC = 2,
  RESET = 3,
}

/**
 * Touch Function Mode constants (firmware values)
 */
export enum TouchFunctionMode {
  HOLD = 0,
  TOGGLE = 1,
  CONTINUOUS = 2,
}

/**
 * Value mode constants (from firmware)
 * UNIPOLAR: Incremental from minimum to maximum (0 to 127)
 * BIPOLAR: Center position = 0 (MIDI 64), Range: -100 (MIDI 0) to +100 (MIDI 127)
 */
export enum ValueMode {
  UNIPOLAR = 0,
  BIPOLAR = 1,
}

/**
 * Interpolation type constants (from firmware)
 */
export enum InterpolationType {
  LINEAR = 0,
  EXPONENTIAL = 1,
  LOGARITHMIC = 2,
}

/**
 * Scale type constants (from firmware)
 */
export enum ScaleType {
  CHROMATIC = 0,
  MAJOR = 1,
  MINOR = 2,
  HARMONIC_MINOR = 3,
  MELODIC_MINOR_ASC = 4,
  PENTATONIC_MAJOR = 5,
  PENTATONIC_MINOR = 6,
  BLUES = 7,
  DORIAN = 8,
  PHRYGIAN = 9,
  LYDIAN = 10,
  MIXOLYDIAN = 11,
  LOCRIAN = 12,
  PHRYGIAN_DOMINANT = 13,
  WHOLE_TONE = 14,
  DIMINISHED = 15,
  BLUES_MAJOR = 16,
  HIRAJOSHI = 17,
  IN_SEN = 18,
  DOUBLE_HARMONIC = 19,
  SUPER_LOCRIAN = 20,
}

export class KB1Protocol {
  /**
   * Encode a request to get CC mappings from the device
   */
  encodeGetCCMappings(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.GET_CC_MAPPING);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Encode a CC mapping to send to the device
   */
  encodeSetCCMapping(mapping: CCMapping): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SET_CC_MAPPING);
    view.setUint8(1, mapping.faderIndex);
    view.setUint8(2, mapping.ccNumber);
    view.setUint8(3, mapping.channel);
    view.setUint8(4, mapping.minValue);
    view.setUint8(5, mapping.maxValue);
    return buffer;
  }

  /**
   * Encode a request to get device settings
   */
  encodeGetSettings(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding for getting settings
    // This method should encode a request to retrieve all device settings from the KB1
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.GET_SETTINGS);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Encode device settings to send to the device
   */
  encodeSetSettings(_settings: DeviceSettings): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding when binary format is finalized
    const buffer = new ArrayBuffer(128);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SET_SETTINGS);
    // TODO: Encode all lever, push, touch, and scale settings
    // Placeholder to maintain compilation
    return buffer;
  }

  /**
   * Encode a save command to persist settings to flash
   */
  encodeSaveToFlash(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding for save to flash command
    // This method should encode a command to save current RAM settings to flash memory
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SAVE_TO_FLASH);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Decode a message received from the device
   */
  decodeMessage(data: DataView): any {
    // TODO: Implement actual KB1 protocol decoding
    if (data.byteLength === 0) {
      return null;
    }

    const messageType = data.getUint8(0);

    switch (messageType) {
      case KB1MessageType.GET_CC_MAPPING:
        return this.decodeCCMapping(data);
      case KB1MessageType.GET_SETTINGS:
        return this.decodeSettings(data);
      default:
        console.warn('Unknown message type:', messageType);
        return null;
    }
  }

  /**
   * Decode CC mapping from device response
   */
  private decodeCCMapping(data: DataView): CCMapping | null {
    // TODO: Implement actual KB1 protocol decoding
    if (data.byteLength < 6) {
      return null;
    }

    return {
      faderIndex: data.getUint8(1),
      ccNumber: data.getUint8(2),
      channel: data.getUint8(3),
      minValue: data.getUint8(4),
      maxValue: data.getUint8(5),
    };
  }

  /**
   * Decode device settings from device response
   */
  private decodeSettings(_data: DataView): DeviceSettings | null {
    // TODO: Implement actual KB1 protocol decoding when binary format is finalized
    // For now, return default settings structure
    return this.createDefaultSettings();
  }

  /**
   * Create default CC mapping
   */
  createDefaultCCMapping(faderIndex: number): CCMapping {
    return {
      faderIndex,
      ccNumber: faderIndex, // Default: fader index = CC number
      channel: 1, // Always channel 1
      minValue: 0,
      maxValue: 127,
    };
  }

  /**
   * Create default device settings aligned with firmware defaults
   * Based on firmware/src/main.cpp
   * Uses section-specific function mode enums to match firmware numeric values
   */
  createDefaultDeviceSettings(): DeviceSettings {
    return {
      lever1: {
        ccNumber: 3,
        minCCValue: 0,
        maxCCValue: 127,
        stepSize: 1,
        functionMode: 0, // Interpolated
        valueMode: ValueMode.BIPOLAR,
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      leverPush1: {
        ccNumber: 24,
        minCCValue: 32,
        maxCCValue: 127,
        functionMode: 0, // Interpolated
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      lever2: {
        ccNumber: 128,
        minCCValue: 13,
        maxCCValue: 127,
        stepSize: 6,
        functionMode: 2, // Incremental
        valueMode: ValueMode.BIPOLAR,
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      leverPush2: {
        ccNumber: 128,
        minCCValue: 85,
        maxCCValue: 85,
        functionMode: 3, // Reset
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      touch: {
        ccNumber: 1,
        minCCValue: 64,
        maxCCValue: 127,
        functionMode: 2, // Continuous
        threshold: 36800,  // 20% on slider (range 30000-64000)
        offsetTime: 0, // FWD mode (forward cycling) by default
      },
      scale: {
        scaleType: ScaleType.CHROMATIC,
        rootNote: 60, // Middle C (MIDI note, not pitch class)
        keyMapping: 0, // Natural
      },
      chord: {
        playMode: 0, // SCALE mode by default
        chordType: 0, // MAJOR chord
        strumEnabled: false, // Chord mode (not strum)
        velocitySpread: 10, // 10% velocity spread (minimum)
        strumSpeed: 80, // 80ms forward (moderate-fast, range: -360 to -5 = reverse, 5 to 360 = forward, step: 5ms)
        strumPattern: 0, // Use chord type (not pattern)
        strumSwing: 0, // No swing by default
        voicing: 1, // 1x octave range by default
      },
      system: {
        lightSleepTimeout: 300, // 300 seconds (5 minutes)
        deepSleepTimeout: 390, // 6.5 minutes (auto: lightSleep + 90s)
        bleTimeout: 600, // 10 minutes (firmware: KEEPALIVE_GRACE_PERIOD_MS)
      },
    };
  }

  /**
   * Create default device settings
   * @deprecated Use createDefaultDeviceSettings() instead
   */
  createDefaultSettings(): DeviceSettings {
    return this.createDefaultDeviceSettings();
  }

  /**
   * Validate CC mapping values
   */
  validateCCMapping(mapping: CCMapping): boolean {
    return (
      mapping.faderIndex >= 0 &&
      mapping.ccNumber >= 0 && mapping.ccNumber <= 128 && // Support CC 128 for Velocity
      mapping.channel === 1 &&
      mapping.minValue >= 0 && mapping.minValue <= 127 &&
      mapping.maxValue >= 0 && mapping.maxValue <= 127 &&
      mapping.minValue <= mapping.maxValue
    );
  }

  /**
   * Validate device settings with detailed error messages
   * NOTE: Only called before BLE send - NOT in hot paths like drag handlers
   */
  validateSettingsDetailed(settings: DeviceSettings): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate chord settings (most common source of issues)
    if (settings.chord) {
      const c = settings.chord;
      
      // Strum speed validation
      const absSpeed = Math.abs(c.strumSpeed);
      if (absSpeed > 0 && absSpeed < 4) {
        errors.push(`strumSpeed ${c.strumSpeed}ms is in forbidden range (-4 to +4). Use ±5 to ±360.`);
      } else if (absSpeed > 360) {
        errors.push(`strumSpeed ${c.strumSpeed}ms exceeds maximum (±360ms)`);
      }
      
      // Chromatic mode check
      if (settings.scale?.scaleType === 0 && settings.scale.rootNote !== 60) {
        warnings.push(`Chromatic mode ignores rootNote (currently ${settings.scale.rootNote}). Consider setting to 60 (C) for clarity.`);
      }
      
      // Voicing check
      if (c.voicing < 1 || c.voicing > 3) {
        errors.push(`voicing ${c.voicing} invalid. Must be 1, 2, or 3.`);
      }
      
      // Velocity spread
      if (c.velocitySpread < 0 || c.velocitySpread > 100) {
        errors.push(`velocitySpread ${c.velocitySpread} out of range [0-100]`);
      }
    }

    // Validate scale settings
    if (settings.scale) {
      const s = settings.scale;
      
      // Root note validation (except Chromatic mode)
      if (s.scaleType !== 0) {
        if (s.rootNote < 60 || s.rootNote > 71) {
          errors.push(`rootNote ${s.rootNote} out of range [60-71] (C to B). Chromatic mode allows any value.`);
        }
      }
    }

    // Use existing boolean validation as fallback
    const basicValid = this.validateSettings(settings);
    if (!basicValid && errors.length === 0) {
      errors.push('Settings failed basic validation. Check console for details.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate device settings (legacy boolean method)
   * @deprecated Use validateSettingsDetailed() for error messages
   */
  validateSettings(settings: DeviceSettings): boolean {
    // Helper to validate lever settings
    const validateLever = (lever: LeverSettings): boolean => {
      // ccNumber ranges: -1 (disabled), 0-128 (MIDI CC + Velocity), 200-206 (KB1 Expression)
      const ccValid = lever.ccNumber === -1 || 
                      (lever.ccNumber >= 0 && lever.ccNumber <= 128) ||
                      (lever.ccNumber >= 200 && lever.ccNumber <= 206);
      return (
        ccValid &&
        lever.minCCValue >= 0 && lever.minCCValue <= 127 &&
        lever.maxCCValue >= 0 && lever.maxCCValue <= 127 &&
        lever.minCCValue <= lever.maxCCValue &&
        lever.stepSize >= 1 &&
        lever.onsetTime >= 0 &&
        lever.offsetTime >= 0
      );
    };

    // Helper to validate lever push settings
    const validateLeverPush = (leverPush: LeverPushSettings): boolean => {
      // ccNumber ranges: -1 (disabled), 0-128 (MIDI CC + Velocity), 200-206 (KB1 Expression)
      const ccValid = leverPush.ccNumber === -1 || 
                      (leverPush.ccNumber >= 0 && leverPush.ccNumber <= 128) ||
                      (leverPush.ccNumber >= 200 && leverPush.ccNumber <= 206);
      return (
        ccValid &&
        leverPush.minCCValue >= 0 && leverPush.minCCValue <= 127 &&
        leverPush.maxCCValue >= 0 && leverPush.maxCCValue <= 127 &&
        leverPush.minCCValue <= leverPush.maxCCValue &&
        leverPush.onsetTime >= 0 &&
        leverPush.offsetTime >= 0
      );
    };

    // Helper to validate touch settings
    const validateTouch = (touch: TouchSettings): boolean => {
      return (
        ((touch.ccNumber >= -1 && touch.ccNumber <= 128) || // Support CC 128 for Velocity
         (touch.ccNumber >= 200 && touch.ccNumber <= 206)) && // Support KB1 Expression CCs (200-206)
        touch.minCCValue >= 0 && touch.minCCValue <= 127 &&
        touch.maxCCValue >= 0 && touch.maxCCValue <= 127 &&
        touch.minCCValue <= touch.maxCCValue
      );
    };

    // Helper to validate scale settings
    const validateScale = (scale: ScaleSettings): boolean => {
      // In Chromatic mode (scaleType 0), rootNote is not used by firmware
      // so don't validate it - allow any value including 0
      const rootNoteValid = scale.scaleType === 0 || 
                           (scale.rootNote >= 48 && scale.rootNote <= 84);
      
      return (
        scale.scaleType >= 0 &&
        rootNoteValid &&
        (scale.keyMapping === 0 || scale.keyMapping === 1)
      );
    };

    // Helper to validate chord settings
    const validateChord = (chord: ChordSettings): boolean => {
      return (
        (chord.playMode === 0 || chord.playMode === 1) &&
        chord.chordType >= 0 && chord.chordType <= 14 &&
        typeof chord.strumEnabled === 'boolean' &&
        chord.velocitySpread >= 0 && chord.velocitySpread <= 100 &&
        (Math.abs(chord.strumSpeed) >= 4 && Math.abs(chord.strumSpeed) <= 360) &&
        chord.strumPattern >= 0 && chord.strumPattern <= 7 &&
        chord.strumSwing >= 0 && chord.strumSwing <= 100 &&
        chord.voicing >= 1 && chord.voicing <= 3
      );
    };

    // Helper to validate system settings
    const validateSystem = (system: SystemSettings): boolean => {
      // Individual range checks
      const rangeValid = (
        system.lightSleepTimeout >= 180 && system.lightSleepTimeout <= 600 &&
        system.bleTimeout >= 300 && system.bleTimeout <= 1200
      );
      
      // Deep sleep is auto-calculated, verify it matches expected value
      const deepSleepValid = system.deepSleepTimeout === system.lightSleepTimeout + 90;
      
      return rangeValid && deepSleepValid;
    };

    // Validate each setting and log failures for debugging
    const validations = [
      { name: 'lever1', valid: settings.lever1 !== undefined && validateLever(settings.lever1) },
      { name: 'leverPush1', valid: settings.leverPush1 !== undefined && validateLeverPush(settings.leverPush1) },
      { name: 'lever2', valid: settings.lever2 !== undefined && validateLever(settings.lever2) },
      { name: 'leverPush2', valid: settings.leverPush2 !== undefined && validateLeverPush(settings.leverPush2) },
      { name: 'touch', valid: settings.touch !== undefined && validateTouch(settings.touch) },
      { name: 'scale', valid: settings.scale !== undefined && validateScale(settings.scale) },
      { name: 'chord', valid: settings.chord !== undefined && validateChord(settings.chord) },
      { name: 'system', valid: settings.system !== undefined && validateSystem(settings.system) }
    ];

    const failures = validations.filter(v => !v.valid);
    if (failures.length > 0) {
      console.error('Settings validation failed for:', failures.map(f => f.name).join(', '));
      failures.forEach(f => {
        console.error(`  - ${f.name}:`, (settings as any)[f.name]);
      });
    }

    return validations.every(v => v.valid);
  }


}

// Export singleton instance
export const kb1Protocol = new KB1Protocol();

/**
 * BLE Characteristic UUIDs for presets
 */
export const PRESET_CHARACTERISTIC_UUIDS = {
  SAVE: 'd3a7b321-0001-4000-8000-000000000009',
  LOAD: 'd3a7b321-0001-4000-8000-00000000000a',
  LIST: 'd3a7b321-0001-4000-8000-00000000000b',
  DELETE: 'd3a7b321-0001-4000-8000-00000000000c',
} as const;

/**
 * Encode preset save command
 * Format: [slot#(1 byte)][name(32 bytes)]
 */
export function encodePresetSave(slot: number, name: string): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  const buffer = new Uint8Array(33);
  buffer[0] = slot;
  
  // Encode name (truncate/pad to 32 bytes)
  const nameBytes = new TextEncoder().encode(name.slice(0, DEVICE_PRESET.NAME_MAX_LENGTH));
  buffer.set(nameBytes, 1);
  
  return buffer;
}

/**
 * Encode preset load command
 * Format: [slot#(1 byte)]
 */
export function encodePresetLoad(slot: number): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  return new Uint8Array([slot]);
}

/**
 * Encode preset delete command
 * Format: [slot#(1 byte)]
 */
export function encodePresetDelete(slot: number): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  return new Uint8Array([slot]);
}

/**
 * Decode preset list response
 * Format: [meta0][meta1]...[meta7] (40 bytes each)
 * Each metadata: [name(32)][timestamp(4)][isValid(1)][padding(3)]
 */
export function decodePresetList(data: DataView): DevicePresetMetadata[] {
  const METADATA_SIZE = 40; // 32 (name) + 4 (timestamp) + 1 (isValid) + 3 (padding)
  const presets: DevicePresetMetadata[] = [];
  
  console.log(`📥 Decoding preset list - Total bytes: ${data.byteLength}, Expected: ${DEVICE_PRESET.MAX_SLOTS * METADATA_SIZE}`);
  
  for (let slot = 0; slot < DEVICE_PRESET.MAX_SLOTS; slot++) {
    const offset = slot * METADATA_SIZE;
    
    // Extract name (32 bytes, null-terminated)
    const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset, 32);
    const nullIndex = nameBytes.indexOf(0);
    const name = new TextDecoder().decode(
      nullIndex >= 0 ? nameBytes.slice(0, nullIndex) : nameBytes
    );
    
    // Extract timestamp (4 bytes, little-endian)
    const timestamp = data.getUint32(offset + 32, true);
    
    // Extract isValid (1 byte)
    const isValid = data.getUint8(offset + 36) === 1;
    
    console.log(`  Slot ${slot}: name="${name}", timestamp=${timestamp}, isValid=${isValid}`);
    
    presets.push({
      slot,
      name: name || DEVICE_PRESET.EMPTY_SLOT_NAME,
      timestamp,
      isValid,
    });
  }
  
  return presets;
}

/**
 * Decode battery status response
 * Format: [percentage(1 byte)][remainingSeconds(4 bytes LE)][usbConnected(1 byte)][calibrationTimestamp(4 bytes LE)]
 */
export function decodeBatteryStatus(data: DataView): BatteryStatus {
  // Support both old (6 bytes) and new (10 bytes) protocol for backwards compatibility
  if (data.byteLength < 6) {
    throw new Error(`Invalid battery status data length: ${data.byteLength}, expected 6 or 10 bytes`);
  }
  
  const percentage = data.getUint8(0);
  const remainingSeconds = data.getUint32(1, true); // Little-endian
  const usbConnected = data.getUint8(5) === 1;
  
  // Read calibration timestamp if available (new protocol)
  const calibrationTimestamp = data.byteLength >= 10 ? data.getUint32(6, true) : 0;
  
  return {
    percentage,
    remainingSeconds,
    usbConnected,
    calibrationTimestamp,
    lastUpdate: Date.now(),
  };
}
