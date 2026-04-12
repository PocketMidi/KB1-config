/**
 * FIRMWARE CONTRACT v1.7
 * 
 * This file defines the exact contract between the web app and firmware.
 * DO NOT CHANGE without updating firmware version and testing on hardware.
 * 
 * Purpose: Make breaking changes obvious at compile time
 */

/**
 * Strum Speed Contract
 * 
 * CRITICAL INVARIANTS:
 * - Range: -360 to +360 (SIGNED 16-bit)
 * - Step: Must be multiple of 5
 * - Forbidden: -4 to +4 (too fast, physically unusable)
 * - Negative = reverse strum, Positive = forward strum
 * 
 * BLE Encoding (CC 200):
 * - MIDI 0-63   = -360 to -4ms (slow reverse to fast reverse)
 * - MIDI 64     = RESERVED (never sent)
 * - MIDI 65-127 = +4 to +360ms (fast forward to slow forward)
 * 
 * WHY BIPOLAR: Allows single physical lever to control full range smoothly
 */
export type StrumSpeed = number; // -360 to +360, step 5, skip -4 to +4
export const STRUM_SPEED_MIN = -360;
export const STRUM_SPEED_MAX = 360;
export const STRUM_SPEED_STEP = 5;
export const STRUM_SPEED_FORBIDDEN_MIN = -4;
export const STRUM_SPEED_FORBIDDEN_MAX = 4;

/**
 * Root Note Contract
 * 
 * INVARIANTS:
 * - Chromatic mode (scaleType=0): rootNote ignored by firmware, ANY value allowed
 * - Other scales: rootNote MUST be 60-71 (C to B in MIDI octave 4)
 * 
 * WHY: Firmware uses rootNote as base for intervalcalculation, except Chromatic
 *      where all 12 notes are active regardless of root
 * 
 * UI BEHAVIOR: Display defaults to 60 (C) if value is outside 60-71
 */
export type RootNote = number; // 60-71 for non-Chromatic, any for Chromatic
export const ROOT_NOTE_MIN = 60; // C
export const ROOT_NOTE_MAX = 71; // B
export const ROOT_NOTE_DEFAULT = 60; // C

/**
 * Voicing Range Contract
 * 
 * INVARIANTS:
 * - Range: 1 to 3 (inclusive)
 * - 1 = single octave, 2 = two octaves, 3 = three octaves
 * 
 * WHY: Firmware stacks chord intervals across N octaves for fuller sound
 */
export type VoicingRange = 1 | 2 | 3;
export const VOICING_MIN = 1;
export const VOICING_MAX = 3;

/**
 * Velocity Spread Contract
 * 
 * INVARIANTS:
 * - Range: 0 to 100 (percentage)
 * - 0 = all notes same velocity, 100 = maximum humanization
 * 
 * WHY: Creates velocity variation across chord notes for natural feel
 */
export type VelocitySpread = number; // 0-100
export const VELOCITY_SPREAD_MIN = 0;
export const VELOCITY_SPREAD_MAX = 100;

/**
 * Scale Type Contract
 * 
 * SPECIAL CASE: scaleType = 0 (Chromatic)
 * - Firmware ignores rootNote
 * - UI should enforce keyMapping = 0 (Natural mode only)
 * - UI displays rootNote as C (60) even if stored value differs
 * 
 * WHY: Chromatic includes all 12 notes, so root is meaningless
 */
export const SCALE_TYPE_CHROMATIC = 0;

/**
 * CC Number Ranges Contract
 * 
 * INVARIANTS:
 * - Standard MIDI CC: 0-127
 * - CC 128: Velocity (special case)
 * - CC 200-203: KB1 Expression Parameters (extended range)
 *   - CC 200: Strum Speed (bipolar)
 *   - CC 201: Strum Pattern
 *   - CC 202: Strum Swing
 *   - CC 203: Velocity Spread
 * -1: Disabled
 * 
 * CRITICAL: CC 200 uses bipolar mapping, ALL others use unipolar
 */
export const CC_DISABLED = -1;
export const CC_VELOCITY = 128;
export const CC_STRUM_SPEED = 200;
export const CC_STRUM_PATTERN = 201;
export const CC_STRUM_SWING = 202;
export const CC_VELOCITY_SPREAD = 203;

export function isExtendedCC(ccNumber: number): boolean {
  return ccNumber >= 200 && ccNumber <= 203;
}

export function isBipolarCC(ccNumber: number): boolean {
  return ccNumber === CC_STRUM_SPEED; // Only CC 200 is bipolar
}

/**
 * Validation helpers that match firmware expectations
 * 
 * USE THESE instead of ad-hoc validation to ensure consistency
 */
export function isValidStrumSpeed(speed: number): boolean {
  const abs = Math.abs(speed);
  
  // Check forbidden range
  if (abs > STRUM_SPEED_FORBIDDEN_MAX && abs < Math.abs(STRUM_SPEED_FORBIDDEN_MIN)) {
    return false;
  }
  
  // Check min/max
  if (abs < Math.abs(STRUM_SPEED_MIN) || abs > STRUM_SPEED_MAX) {
    return false;
  }
  
  // Check step
  return speed % STRUM_SPEED_STEP === 0;
}

export function isValidRootNote(rootNote: number, isChromatic: boolean): boolean {
  // Chromatic mode allows any value (firmware ignores it)
  if (isChromatic) {
    return true;
  }
  
  // Other scales require 60-71 range
  return rootNote >= ROOT_NOTE_MIN && rootNote <= ROOT_NOTE_MAX;
}

export function isValidVoicing(voicing: number): boolean {
  return voicing >= VOICING_MIN && voicing <= VOICING_MAX;
}

export function isValidVelocitySpread(spread: number): boolean {
  return spread >= VELOCITY_SPREAD_MIN && spread <= VELOCITY_SPREAD_MAX;
}

/**
 * Type guards for compile-time safety
 */
export function assertStrumSpeed(speed: number): asserts speed is StrumSpeed {
  if (!isValidStrumSpeed(speed)) {
    throw new Error(
      `Invalid strum speed: ${speed}. ` +
      `Must be ${STRUM_SPEED_MIN} to ${STRUM_SPEED_MAX}, ` +
      `step ${STRUM_SPEED_STEP}, skip ${STRUM_SPEED_FORBIDDEN_MIN} to ${STRUM_SPEED_FORBIDDEN_MAX}`
    );
  }
}

export function assertVoicing(voicing: number): asserts voicing is VoicingRange {
  if (!isValidVoicing(voicing)) {
    throw new Error(`Invalid voicing: ${voicing}. Must be 1, 2, or 3.`);
  }
}
