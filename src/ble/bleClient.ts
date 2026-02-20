/**
 * BLE Client - Web Bluetooth transport layer for KB1 device
 * 
 * This module handles the low-level BLE connection and communication
 * using the Web Bluetooth API. It provides a clean interface for
 * connecting, disconnecting, and sending/receiving data.
 */

import type { LeverSettings, LeverPushSettings, TouchSettings, ScaleSettings, SystemSettings, DevicePresetMetadata } from './kb1Protocol';
import { PRESET_CHARACTERISTIC_UUIDS, encodePresetSave, encodePresetLoad, encodePresetDelete, decodePresetList } from './kb1Protocol';

// KB1-specific BLE UUIDs (custom, not standard MIDI BLE)
// These UUIDs are defined in the KB1 firmware (firmware/src/objects/Constants.h)
// Service UUID: KB1 custom service
const KB1_SERVICE_UUID = 'f22b99e8-81ab-4e46-abff-79a74a1f2ff3';
// Characteristic UUIDs for KB1 device settings
const LEVER1_SETTINGS_UUID = '6bae0d4d-a0a4-4bc6-9802-a5d27fb15680';
const LEVERPUSH1_SETTINGS_UUID = '1de84ff3-36c0-4cf6-912b-208600cf94f4';
const LEVER2_SETTINGS_UUID = '13ffbea4-793f-40f5-82da-ac9eca5f0e09';
const LEVERPUSH2_SETTINGS_UUID = '52629808-3d14-4ae8-a826-40bcec6467d5';
const TOUCH_SETTINGS_UUID = '5612b54d-8bfe-4217-a079-c9c95ab32c41';
const SCALE_SETTINGS_UUID = '297bd635-c3e8-4fb4-b5e0-93586da8f14c';
const SYSTEM_SETTINGS_UUID = '8f7e6d5c-4b3a-2c1d-0e9f-8a7b6c5d4e3f';
const MIDI_UUID = 'eb58b31b-d963-4c7d-9a11-e8aabec2fe32';
const KEEPALIVE_UUID = 'a8f3d5e2-9c4b-11ef-8e7a-325096b39f47';

export interface BLEConnectionStatus {
  connected: boolean;
  device: BluetoothDevice | null;
  error: string | null;
}

export class BLEClient {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onStatusChange: ((status: BLEConnectionStatus) => void) | null = null;
  private onDataReceived: ((data: DataView) => void) | null = null;
  
  // Store characteristics for settings read/write
  private lever1Characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private leverPush1Characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private lever2Characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private leverPush2Characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private touchCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private scaleCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private systemCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private keepAliveCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  
  // Preset management characteristics
  private presetSaveCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private presetLoadCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private presetListCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private presetDeleteCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Keep-alive mechanism (firmware expects writes within 10 minute grace period)
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private keepAliveIntervalMs: number = 60000; // 60 seconds (well within 10 min grace period)
  private keepAliveEnabled: boolean = true;

  // MIDI CC throttling
  private lastMidiSendMs: number = 0;
  private midiThrottleMs: number = 8;

  /**
   * Register a callback for connection status changes
   */
  setStatusChangeCallback(callback: (status: BLEConnectionStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Register a callback for incoming data
   */
  setDataReceivedCallback(callback: (data: DataView) => void): void {
    this.onDataReceived = callback;
  }

  /**
   * Check if Web Bluetooth is available in this browser
   */
  isBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Request connection to a KB1 device
   * This must be called from a user gesture (e.g., button click)
   */
  async connect(): Promise<void> {
    if (!this.isBluetoothAvailable()) {
      const error = 'Web Bluetooth is not supported in this browser';
      this.notifyStatusChange(false, error);
      throw new Error(error);
    }

    try {
      // Request device with KB1 service filter
      // Using KB1-specific custom service UUID
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'KB1' }
        ],
        optionalServices: [KB1_SERVICE_UUID]
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Get KB1 custom service using KB1-specific service UUID
      const service = await this.server.getPrimaryService(KB1_SERVICE_UUID);

      // Get MIDI I/O characteristic for read/write
      this.characteristic = await service.getCharacteristic(MIDI_UUID);

      // Get all settings characteristics for direct read/write access
      try {
        this.lever1Characteristic = await service.getCharacteristic(LEVER1_SETTINGS_UUID);
        this.leverPush1Characteristic = await service.getCharacteristic(LEVERPUSH1_SETTINGS_UUID);
        this.lever2Characteristic = await service.getCharacteristic(LEVER2_SETTINGS_UUID);
        this.leverPush2Characteristic = await service.getCharacteristic(LEVERPUSH2_SETTINGS_UUID);
        this.touchCharacteristic = await service.getCharacteristic(TOUCH_SETTINGS_UUID);
        this.scaleCharacteristic = await service.getCharacteristic(SCALE_SETTINGS_UUID);
        this.systemCharacteristic = await service.getCharacteristic(SYSTEM_SETTINGS_UUID);
      } catch (e) {
        console.warn('⚠️ Some settings characteristics not available:', e);
      }

      // Try to get keepalive characteristic (optional, may not be in older firmware)
      try {
        this.keepAliveCharacteristic = await service.getCharacteristic(KEEPALIVE_UUID);
        console.log('✅ Keep-alive characteristic found');
      } catch (e) {
        console.log('ℹ️ Keep-alive characteristic not available (connection may timeout after 10 minutes)');
      }

      // Try to get preset characteristics (optional, may not be in older firmware)
      try {
        console.log('🔍 Looking for preset characteristics...');
        this.presetSaveCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.SAVE);
        console.log('  ✅ SAVE found:', PRESET_CHARACTERISTIC_UUIDS.SAVE);
        this.presetLoadCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.LOAD);
        console.log('  ✅ LOAD found:', PRESET_CHARACTERISTIC_UUIDS.LOAD);
        this.presetListCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.LIST);
        console.log('  ✅ LIST found:', PRESET_CHARACTERISTIC_UUIDS.LIST);
        this.presetDeleteCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.DELETE);
        console.log('  ✅ DELETE found:', PRESET_CHARACTERISTIC_UUIDS.DELETE);
        console.log('✅ All preset characteristics found');
      } catch (e) {
        console.log('ℹ️ Preset characteristics not available (requires updated firmware)');
        console.log('   Expected UUIDs:');
        console.log('   - SAVE:', PRESET_CHARACTERISTIC_UUIDS.SAVE);
        console.log('   - LOAD:', PRESET_CHARACTERISTIC_UUIDS.LOAD);
        console.log('   - LIST:', PRESET_CHARACTERISTIC_UUIDS.LIST);
        console.log('   - DELETE:', PRESET_CHARACTERISTIC_UUIDS.DELETE);
        console.log('   Error:', e);
      }

      // Start notifications if supported
      try {
        await this.characteristic.startNotifications();
        this.characteristic.addEventListener('characteristicvaluechanged', 
          this.onCharacteristicValueChanged.bind(this));
      } catch (e) {
        console.warn('Notifications not supported:', e);
      }

      // Start keep-alive timer to maintain connection
      this.startKeepAlive();

      this.notifyStatusChange(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notifyStatusChange(false, errorMessage);
      throw error;
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
    this.notifyStatusChange(false);
  }

  /**
   * Send data to the connected device
   */
  async sendData(data: ArrayBuffer): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to device');
    }

    try {
      await this.characteristic.writeValue(data);
    } catch (error) {
      console.error('Failed to send data:', error);
      throw error;
    }
  }

  /**
   * Send MIDI Control Change message
   * Sends ASCII "CC_NUMBER,VALUE" to the MIDI characteristic
   * @param cc Control change number (0-127)
   * @param value Control change value (0-127)
   */
  async sendControlChange(cc: number, value: number): Promise<void> {
    console.log(`🎹 Sending MIDI CC #${cc} = ${value}`);
    
    // Throttle MIDI sends to avoid overwhelming the BLE connection
    const now = performance.now();
    if (now - this.lastMidiSendMs < this.midiThrottleMs) {
      console.log(`⏸️ Throttled (too soon)`);
      return;
    }
    this.lastMidiSendMs = now;

    if (!this.characteristic) {
      console.error('❌ Not connected to device');
      throw new Error('Not connected to device');
    }

    try {
      const encoder = new TextEncoder();
      const message = `${cc},${value}`;
      console.log(`📤 Writing to MIDI characteristic: "${message}"`);
      await this.characteristic.writeValueWithoutResponse(encoder.encode(message));
      console.log(`✅ MIDI CC sent successfully`);
    } catch (error) {
      console.error('Failed to send MIDI CC:', error);
      throw error;
    }
  }

  /**
   * Read data from the connected device
   */
  async readData(): Promise<DataView> {
    if (!this.characteristic) {
      throw new Error('Not connected to device');
    }

    try {
      const value = await this.characteristic.readValue();
      return value;
    } catch (error) {
      console.error('Failed to read data:', error);
      throw error;
    }
  }

  /**
   * Read all settings from the device characteristics
   */
  async readAllSettings(): Promise<{
    lever1?: LeverSettings;
    leverPush1?: LeverPushSettings;
    lever2?: LeverSettings;
    leverPush2?: LeverPushSettings;
    touch?: TouchSettings;
    scale?: ScaleSettings;
    system?: SystemSettings;
  }> {
    if (!this.server?.connected) {
      throw new Error('Not connected to device');
    }

    try {
      const settings: {
        lever1?: LeverSettings;
        leverPush1?: LeverPushSettings;
        lever2?: LeverSettings;
        leverPush2?: LeverPushSettings;
        touch?: TouchSettings;
        scale?: ScaleSettings;
        system?: SystemSettings;
      } = {};

      // Read Lever 1 settings
      if (this.lever1Characteristic) {
        const data = await this.lever1Characteristic.readValue();
        settings.lever1 = this.parseLeverData(data);
      }

      // Read Lever Push 1 settings
      if (this.leverPush1Characteristic) {
        const data = await this.leverPush1Characteristic.readValue();
        settings.leverPush1 = this.parseLeverPushData(data);
      }

      // Read Lever 2 settings
      if (this.lever2Characteristic) {
        const data = await this.lever2Characteristic.readValue();
        settings.lever2 = this.parseLeverData(data);
      }

      // Read Lever Push 2 settings
      if (this.leverPush2Characteristic) {
        const data = await this.leverPush2Characteristic.readValue();
        settings.leverPush2 = this.parseLeverPushData(data);
      }

      // Read Touch settings
      if (this.touchCharacteristic) {
        const data = await this.touchCharacteristic.readValue();
        settings.touch = this.parseTouchData(data);
      }

      // Read Scale settings
      if (this.scaleCharacteristic) {
        const data = await this.scaleCharacteristic.readValue();
        settings.scale = this.parseScaleData(data);
      }

      // Read System settings
      if (this.systemCharacteristic) {
        const data = await this.systemCharacteristic.readValue();
        settings.system = this.parseSystemData(data);
      }

      return settings;
    } catch (error) {
      console.error('Failed to read settings:', error);
      throw error;
    }
  }

  /**
   * Parse lever data from DataView (little-endian int32)
   */
  private parseLeverData(data: DataView): LeverSettings {
    return {
      ccNumber: data.getInt32(0, true),
      minCCValue: data.getInt32(4, true),
      maxCCValue: data.getInt32(8, true),
      stepSize: data.getInt32(12, true),
      functionMode: data.getInt32(16, true),
      valueMode: data.getInt32(20, true),
      onsetTime: data.getInt32(24, true),
      offsetTime: data.getInt32(28, true),
      onsetType: data.getInt32(32, true),
      offsetType: data.getInt32(36, true),
    };
  }

  /**
   * Parse lever push data from DataView (little-endian int32)
   */
  private parseLeverPushData(data: DataView): LeverPushSettings {
    return {
      ccNumber: data.getInt32(0, true),
      minCCValue: data.getInt32(4, true),
      maxCCValue: data.getInt32(8, true),
      functionMode: data.getInt32(12, true),
      onsetTime: data.getInt32(16, true),
      offsetTime: data.getInt32(20, true),
      onsetType: data.getInt32(24, true),
      offsetType: data.getInt32(28, true),
    };
  }

  /**
   * Parse touch data from DataView (little-endian int32)
   */
  private parseTouchData(data: DataView): TouchSettings {
    return {
      ccNumber: data.getInt32(0, true),
      minCCValue: data.getInt32(4, true),
      maxCCValue: data.getInt32(8, true),
      functionMode: data.getInt32(12, true),
    };
  }

  /**
   * Parse scale data from DataView (little-endian int32)
   */
  private parseScaleData(data: DataView): ScaleSettings {
    return {
      scaleType: data.getInt32(0, true),
      rootNote: data.getInt32(4, true),
      keyMapping: data.getInt32(8, true),
    };
  }

  /**
   * Parse system settings data from DataView (little-endian int32)
   * Note: Only reads first 3 values (light/deep sleep, BLE timeout)
   * idleConfirmTimeout is kept internal to firmware
   */
  private parseSystemData(data: DataView): SystemSettings {
    return {
      lightSleepTimeout: data.getInt32(0, true),
      deepSleepTimeout: data.getInt32(4, true),
      bleTimeout: data.getInt32(8, true),
    };
  }

  /**
   * Encode system settings to binary format for writing to device
   * Note: Only writes first 3 values, preserving firmware's idleConfirmTimeout
   * Firmware expects 16 bytes (4 int32), so we pad with existing value
   */
  private async encodeSystemData(settings: SystemSettings): Promise<ArrayBuffer> {
    // Read current settings from device to preserve idleConfirmTimeout
    let existingIdleConfirm = 2; // default fallback
    if (this.systemCharacteristic) {
      try {
        const currentData = await this.systemCharacteristic.readValue();
        if (currentData.byteLength >= 16) {
          existingIdleConfirm = currentData.getInt32(12, true);
        }
      } catch (e) {
        console.warn('Could not read existing idleConfirmTimeout, using default');
      }
    }

    const buffer = new ArrayBuffer(16); // 4 int32 values = 16 bytes
    const view = new DataView(buffer);
    view.setInt32(0, settings.lightSleepTimeout, true);
    view.setInt32(4, settings.deepSleepTimeout, true);
    view.setInt32(8, settings.bleTimeout, true);
    view.setInt32(12, existingIdleConfirm, true); // preserve firmware value
    return buffer;
  }

  /**
   * Write system settings to device
   */
  async writeSystemSettings(settings: SystemSettings): Promise<void> {
    if (!this.systemCharacteristic) {
      throw new Error('System settings characteristic not available');
    }

    try {
      const data = await this.encodeSystemData(settings);
      await this.systemCharacteristic.writeValue(data);
      console.log('System settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write system settings:', error);
      throw error;
    }
  }

  /**
   * Encode lever settings to binary format for writing to device
   */
  private encodeLeverData(settings: LeverSettings): ArrayBuffer {
    const buffer = new ArrayBuffer(40); // 10 int32 values = 40 bytes
    const view = new DataView(buffer);
    view.setInt32(0, settings.ccNumber, true);
    view.setInt32(4, settings.minCCValue, true);
    view.setInt32(8, settings.maxCCValue, true);
    view.setInt32(12, settings.stepSize, true);
    view.setInt32(16, settings.functionMode, true);
    view.setInt32(20, settings.valueMode, true);
    view.setInt32(24, settings.onsetTime, true);
    view.setInt32(28, settings.offsetTime, true);
    view.setInt32(32, settings.onsetType, true);
    view.setInt32(36, settings.offsetType, true);
    return buffer;
  }

  /**
   * Encode lever push settings to binary format for writing to device
   */
  private encodeLeverPushData(settings: LeverPushSettings): ArrayBuffer {
    const buffer = new ArrayBuffer(32); // 8 int32 values = 32 bytes
    const view = new DataView(buffer);
    view.setInt32(0, settings.ccNumber, true);
    view.setInt32(4, settings.minCCValue, true);
    view.setInt32(8, settings.maxCCValue, true);
    view.setInt32(12, settings.functionMode, true);
    view.setInt32(16, settings.onsetTime, true);
    view.setInt32(20, settings.offsetTime, true);
    view.setInt32(24, settings.onsetType, true);
    view.setInt32(28, settings.offsetType, true);
    return buffer;
  }

  /**
   * Encode touch settings to binary format for writing to device
   */
  private encodeTouchData(settings: TouchSettings): ArrayBuffer {
    const buffer = new ArrayBuffer(20); // 5 int32 values = 20 bytes
    const view = new DataView(buffer);
    view.setInt32(0, settings.ccNumber, true);
    view.setInt32(4, settings.minCCValue, true);
    view.setInt32(8, settings.maxCCValue, true);
    view.setInt32(12, settings.functionMode, true);
    view.setInt32(16, settings.threshold || 24000, true); // Default threshold if not set
    return buffer;
  }

  /**
   * Encode scale settings to binary format for writing to device
   */
  private encodeScaleData(settings: ScaleSettings): ArrayBuffer {
    const buffer = new ArrayBuffer(12); // 3 int32 values = 12 bytes
    const view = new DataView(buffer);
    view.setInt32(0, settings.scaleType, true);
    view.setInt32(4, settings.rootNote, true);
    view.setInt32(8, settings.keyMapping, true);
    return buffer;
  }

  /**
   * Write lever 1 settings to device
   */
  async writeLever1Settings(settings: LeverSettings): Promise<void> {
    if (!this.lever1Characteristic) {
      throw new Error('Lever 1 settings characteristic not available');
    }

    try {
      const data = this.encodeLeverData(settings);
      await this.lever1Characteristic.writeValue(data);
      console.log('Lever 1 settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write lever 1 settings:', error);
      throw error;
    }
  }

  /**
   * Write lever push 1 settings to device
   */
  async writeLeverPush1Settings(settings: LeverPushSettings): Promise<void> {
    if (!this.leverPush1Characteristic) {
      throw new Error('Lever Push 1 settings characteristic not available');
    }

    try {
      const data = this.encodeLeverPushData(settings);
      await this.leverPush1Characteristic.writeValue(data);
      console.log('Lever Push 1 settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write lever push 1 settings:', error);
      throw error;
    }
  }

  /**
   * Write lever 2 settings to device
   */
  async writeLever2Settings(settings: LeverSettings): Promise<void> {
    if (!this.lever2Characteristic) {
      throw new Error('Lever 2 settings characteristic not available');
    }

    try {
      const data = this.encodeLeverData(settings);
      await this.lever2Characteristic.writeValue(data);
      console.log('Lever 2 settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write lever 2 settings:', error);
      throw error;
    }
  }

  /**
   * Write lever push 2 settings to device
   */
  async writeLeverPush2Settings(settings: LeverPushSettings): Promise<void> {
    if (!this.leverPush2Characteristic) {
      throw new Error('Lever Push 2 settings characteristic not available');
    }

    try {
      const data = this.encodeLeverPushData(settings);
      await this.leverPush2Characteristic.writeValue(data);
      console.log('Lever Push 2 settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write lever push 2 settings:', error);
      throw error;
    }
  }

  /**
   * Write touch settings to device
   */
  async writeTouchSettings(settings: TouchSettings): Promise<void> {
    if (!this.touchCharacteristic) {
      throw new Error('Touch settings characteristic not available');
    }

    try {
      const data = this.encodeTouchData(settings);
      await this.touchCharacteristic.writeValue(data);
      console.log('Touch settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write touch settings:', error);
      throw error;
    }
  }

  /**
   * Write scale settings to device
   */
  async writeScaleSettings(settings: ScaleSettings): Promise<void> {
    if (!this.scaleCharacteristic) {
      throw new Error('Scale settings characteristic not available');
    }

    try {
      const data = this.encodeScaleData(settings);
      await this.scaleCharacteristic.writeValue(data);
      console.log('Scale settings written to device:', settings);
    } catch (error) {
      console.error('Failed to write scale settings:', error);
      throw error;
    }
  }

  /**
   * Write all settings to device
   */
  async writeAllSettings(settings: DeviceSettings): Promise<void> {
    if (!this.server?.connected) {
      throw new Error('Not connected to device');
    }

    try {
      // Write all settings to their respective characteristics
      await this.writeLever1Settings(settings.lever1);
      await this.writeLeverPush1Settings(settings.leverPush1);
      await this.writeLever2Settings(settings.lever2);
      await this.writeLeverPush2Settings(settings.leverPush2);
      await this.writeTouchSettings(settings.touch);
      await this.writeScaleSettings(settings.scale);
      await this.writeSystemSettings(settings.system);
      console.log('✅ All settings written to device');
    } catch (error) {
      console.error('Failed to write all settings:', error);
      throw error;
    }
  }

  /**
   * Check if device supports preset management
   */
  hasDevicePresetSupport(): boolean {
    return this.presetSaveCharacteristic !== null &&
           this.presetLoadCharacteristic !== null &&
           this.presetListCharacteristic !== null &&
           this.presetDeleteCharacteristic !== null;
  }

  /**
   * List all device preset slots
   */
  async listDevicePresets(): Promise<DevicePresetMetadata[]> {
    if (!this.presetListCharacteristic) {
      throw new Error('Device presets not supported');
    }

    try {
      const dataView = await this.presetListCharacteristic.readValue();
      const presets = decodePresetList(dataView);
      console.log('📋 Device presets:', presets);
      return presets;
    } catch (error) {
      console.error('Failed to list device presets:', error);
      throw error;
    }
  }

  /**
   * Save current settings to device preset slot
   */
  async saveDevicePreset(slot: number, name: string): Promise<void> {
    if (!this.presetSaveCharacteristic) {
      throw new Error('Device presets not supported');
    }

    try {
      const data = encodePresetSave(slot, name);
      console.log(`📤 Sending save command - Slot: ${slot}, Name: "${name}", Data bytes:`, Array.from(data));
      await this.presetSaveCharacteristic.writeValue(data as BufferSource);
      console.log(`✅ Write completed for slot ${slot}: ${name}`);
    } catch (error) {
      console.error('Failed to save device preset:', error);
      throw error;
    }
  }

  /**
   * Load settings from device preset slot
   */
  async loadDevicePreset(slot: number): Promise<void> {
    if (!this.presetLoadCharacteristic) {
      throw new Error('Device presets not supported');
    }

    try {
      const data = encodePresetLoad(slot);
      await this.presetLoadCharacteristic.writeValue(data as BufferSource);
      console.log(`📥 Loaded from device preset slot ${slot}`);
      
      // After loading, settings will be automatically updated via notifications
      // or the app should refresh settings from device
    } catch (error) {
      console.error('Failed to load device preset:', error);
      throw error;
    }
  }

  /**
   * Delete device preset slot
   */
  async deleteDevicePreset(slot: number): Promise<void> {
    if (!this.presetDeleteCharacteristic) {
      throw new Error('Device presets not supported');
    }

    try {
      const data = encodePresetDelete(slot);
      await this.presetDeleteCharacteristic.writeValue(data as BufferSource);
      console.log(`🗑️ Deleted device preset slot ${slot}`);
    } catch (error) {
      console.error('Failed to delete device preset:', error);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): BLEConnectionStatus {
    return {
      connected: this.device?.gatt?.connected ?? false,
      device: this.device,
      error: null
    };
  }

  /**
   * Check if device is connected
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  /**
   * Handle characteristic value changes (notifications)
   */
  private onCharacteristicValueChanged(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (value && this.onDataReceived) {
      this.onDataReceived(value);
    }
  }

  /**
   * Handle device disconnection
   */
  private onDisconnected(): void {
    this.stopKeepAlive();
    this.cleanup();
    this.notifyStatusChange(false);
  }

  /**
   * Start keep-alive timer to maintain BLE connection
   * Writes to the dedicated KEEPALIVE characteristic every 60 seconds
   * (firmware has a 10 minute grace period)
   */
  private startKeepAlive(): void {
    if (!this.keepAliveEnabled) {
      return;
    }

    // Stop any existing timer
    this.stopKeepAlive();

    this.keepAliveTimer = setInterval(() => {
      if (this.isConnected() && this.keepAliveCharacteristic) {
        try {
          // Write a single byte to the keep-alive characteristic
          // The firmware doesn't care about the content, just that a write occurred
          const pingData = new Uint8Array([1]);
          this.keepAliveCharacteristic.writeValueWithoutResponse(pingData).then(() => {
            console.log('💓 Keep-alive ping sent');
          }).catch((error) => {
            console.warn('Keep-alive ping failed:', error);
          });
        } catch (error) {
          console.warn('Failed to send keep-alive ping:', error);
        }
      } else {
        // If not connected or characteristic not available, stop the timer
        this.stopKeepAlive();
      }
    }, this.keepAliveIntervalMs);
  }

  /**
   * Stop keep-alive timer
   */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Configure keep-alive settings
   * @param enabled Whether to enable keep-alive
   * @param intervalMs Keep-alive interval in milliseconds (default: 60000)
   */
  setKeepAlive(enabled: boolean, intervalMs: number = 60000): void {
    this.keepAliveEnabled = enabled;
    this.keepAliveIntervalMs = intervalMs;

    // Restart timer if currently connected
    if (this.isConnected() && enabled) {
      this.startKeepAlive();
    } else if (!enabled) {
      this.stopKeepAlive();
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopKeepAlive();
    if (this.characteristic) {
      this.characteristic.removeEventListener('characteristicvaluechanged', 
        this.onCharacteristicValueChanged.bind(this));
    }
    this.characteristic = null;
    this.lever1Characteristic = null;
    this.leverPush1Characteristic = null;
    this.lever2Characteristic = null;
    this.leverPush2Characteristic = null;
    this.touchCharacteristic = null;
    this.scaleCharacteristic = null;
    this.systemCharacteristic = null;
    this.keepAliveCharacteristic = null;
    this.presetSaveCharacteristic = null;
    this.presetLoadCharacteristic = null;
    this.presetListCharacteristic = null;
    this.presetDeleteCharacteristic = null;
    this.server = null;
    // Note: We don't set device to null to preserve device info
  }

  /**
   * Notify status change callback
   */
  private notifyStatusChange(connected: boolean, error: string | null = null): void {
    if (this.onStatusChange) {
      this.onStatusChange({
        connected,
        device: this.device,
        error
      });
    }
  }
}

// Export singleton instance
export const bleClient = new BLEClient();
