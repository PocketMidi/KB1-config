/**
 * Application-wide constants and configuration
 */

/**
 * Application version (synced with firmware version)
 */
export const APP_VERSION = '1.7.0';

/**
 * localStorage key for tracking if the user has seen the first-time BLE intro overlay
 */
export const FIRST_TIME_BLE_INTRO_KEY = 'kb1-ble-intro-seen';

/**
 * Preset upload endpoint
 * Production: https://pocketmidi.com/upload-preset.php
 * Development: Use local server or comment out for file download
 */
export const PRESET_UPLOAD_ENDPOINT = 'https://pocketmidi.com/upload-preset.php';
// export const PRESET_UPLOAD_ENDPOINT = null; // Uncomment for local file download during dev

/**
 * Preset storage base URL
 * Where community presets are loaded from
 */
export const PRESET_BASE_URL = 'https://pocketmidi.com/presets/';
// export const PRESET_BASE_URL = `${import.meta.env.BASE_URL}community-presets/`; // For local testing
