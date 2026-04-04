/**
 * Firmware Update Composable - KB1 Firmware Flashing
 * 
 * This composable provides firmware update functionality with NVS preservation.
 * Uses Web Serial API to flash firmware while preserving battery calibration and settings.
 */

import { ref, computed } from 'vue';
import { ESPLoader, Transport } from 'esptool-js';

// NVS partition configuration (from max_app_8MB.csv)
const NVS_OFFSET = 0x9000;
const NVS_SIZE = 0x5000; // 20KB

export type FirmwareUpdateStep = 
  | 'idle' 
  | 'checking-usb' 
  | 'backing-up-nvs' 
  | 'flashing-firmware' 
  | 'restoring-nvs' 
  | 'complete' 
  | 'error';

export interface FirmwareUpdateStatus {
  step: FirmwareUpdateStep;
  progress: number; // 0-100
  message: string;
  error?: string;
}

const updateStatus = ref<FirmwareUpdateStatus>({
  step: 'idle',
  progress: 0,
  message: '',
});

const isUpdating = computed(() => updateStatus.value.step !== 'idle' && updateStatus.value.step !== 'complete' && updateStatus.value.step !== 'error');

// Check for Web Serial API support (Chrome 89+, Edge 89+, Opera 76+)
// Requires secure context (HTTPS or localhost)
const hasUsbSupport = computed(() => {
  try {
    const supported = 'serial' in navigator && typeof navigator.serial !== 'undefined';
    console.log('🔌 Web Serial API support:', supported);
    if (!supported) {
      console.log('   - Requires HTTPS (or localhost)');
      console.log('   - Requires Chrome/Edge 89+ or Opera 76+');
      console.log('   - Current protocol:', window.location.protocol);
    }
    return supported;
  } catch (error) {
    console.error('❌ Error checking USB support:', error);
    return false;
  }
});

let port: SerialPort | null = null;
let transport: Transport | null = null;
let loader: ESPLoader | null = null;
let nvsBackup: Uint8Array | null = null;

/**
 * Check if USB device is connected
 */
async function checkUsbConnection(): Promise<boolean> {
  if (!hasUsbSupport.value) {
    return false;
  }

  try {
    const ports = await navigator.serial.getPorts();
    return ports.length > 0;
  } catch (error) {
    console.error('❌ Error checking USB:', error);
    return false;
  }
}

/**
 * Request USB permission and connect
 */
async function connectUsb(): Promise<void> {
  updateStatus.value = {
    step: 'checking-usb',
    progress: 0,
    message: 'Connecting to USB device...',
  };

  try {
    // Request port if not already granted
    const ports = await navigator.serial.getPorts();
    if (ports.length === 0) {
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x303a }] // Espressif vendor ID
      });
    } else {
      port = ports[0];
    }

    if (!port) {
      throw new Error('No USB device selected');
    }

    // Open port
    await port.open({ baudRate: 115200 });

    // Create transport and loader
    transport = new Transport(port, true);
    loader = new ESPLoader({
      transport,
      baudrate: 115200,
      romBaudrate: 115200,
    });

    // Connect to bootloader
    await loader.main();

    console.log('✅ USB connected successfully');
  } catch (error) {
    updateStatus.value = {
      step: 'error',
      progress: 0,
      message: 'Failed to connect USB',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    throw error;
  }
}

/**
 * Backup NVS partition
 */
async function backupNvs(): Promise<void> {
  if (!loader) {
    throw new Error('USB not connected');
  }

  updateStatus.value = {
    step: 'backing-up-nvs',
    progress: 10,
    message: 'Backing up battery calibration & settings...',
  };

  try {
    nvsBackup = await loader.readFlash(NVS_OFFSET, NVS_SIZE, (bytesRead, totalBytes) => {
      const progress = 10 + Math.floor((bytesRead / totalBytes) * 20);
      updateStatus.value.progress = progress;
    });

    console.log(`✅ NVS backed up: ${nvsBackup.length} bytes`);
    updateStatus.value.progress = 30;
  } catch (error) {
    updateStatus.value = {
      step: 'error',
      progress: 0,
      message: 'Failed to backup settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    throw error;
  }
}

/**
 * Flash firmware binary
 */
async function flashFirmware(firmwareBinary: ArrayBuffer): Promise<void> {
  if (!loader) {
    throw new Error('USB not connected');
  }

  updateStatus.value = {
    step: 'flashing-firmware',
    progress: 30,
    message: 'Flashing firmware...',
  };

  try {
    const fileArray = [{
      data: new Uint8Array(firmwareBinary),
      address: 0x0,
    }];

    await loader.writeFlash({
      fileArray,
      flashSize: '8MB',
      flashMode: 'dio',
      flashFreq: '80m',
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex, written, total) => {
        const progress = 30 + Math.floor((written / total) * 50);
        updateStatus.value.progress = progress;
      },
    });

    console.log('✅ Firmware flashed successfully');
    updateStatus.value.progress = 80;
  } catch (error) {
    updateStatus.value = {
      step: 'error',
      progress: 0,
      message: 'Failed to flash firmware',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    throw error;
  }
}

/**
 * Restore NVS partition
 */
async function restoreNvs(): Promise<void> {
  if (!loader || !nvsBackup) {
    throw new Error('NVS backup not available');
  }

  updateStatus.value = {
    step: 'restoring-nvs',
    progress: 80,
    message: 'Restoring battery calibration & settings...',
  };

  try {
    await loader.writeFlash({
      fileArray: [{
        data: nvsBackup,
        address: NVS_OFFSET,
      }],
      flashSize: '8MB',
      flashMode: 'dio',
      flashFreq: '80m',
      eraseAll: false,
      compress: false,
      reportProgress: (fileIndex, written, total) => {
        const progress = 80 + Math.floor((written / total) * 15);
        updateStatus.value.progress = progress;
      },
    });

    console.log('✅ NVS restored successfully');
    updateStatus.value.progress = 95;
  } catch (error) {
    updateStatus.value = {
      step: 'error',
      progress: 0,
      message: 'Failed to restore settings',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    throw error;
  }
}

/**
 * Disconnect USB
 */
async function disconnectUsb(): Promise<void> {
  try {
    if (loader) {
      await loader.hardReset();
    }
    
    if (port) {
      await port.close();
    }
  } catch (error) {
    console.warn('⚠️ Error disconnecting USB:', error);
  } finally {
    port = null;
    transport = null;
    loader = null;
    nvsBackup = null;
  }
}

/**
 * Main firmware update flow
 */
async function updateFirmware(firmwareBinary: ArrayBuffer): Promise<void> {
  try {
    // Step 1: Connect USB
    await connectUsb();

    // Step 2: Backup NVS
    await backupNvs();

    // Step 3: Flash firmware
    await flashFirmware(firmwareBinary);

    // Step 4: Restore NVS
    await restoreNvs();

    // Complete
    updateStatus.value = {
      step: 'complete',
      progress: 100,
      message: 'Firmware update complete! Press RESET button on KB1.',
    };

    // Disconnect USB
    await disconnectUsb();
  } catch (error) {
    console.error('❌ Firmware update failed:', error);
    await disconnectUsb();
    
    if (updateStatus.value.step !== 'error') {
      updateStatus.value = {
        step: 'error',
        progress: 0,
        message: 'Firmware update failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    throw error;
  }
}

/**
 * Reset update status
 */
function resetStatus(): void {
  updateStatus.value = {
    step: 'idle',
    progress: 0,
    message: '',
  };
}

/**
 * Download firmware from URL
 */
async function downloadFirmware(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download firmware: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

export function useFirmwareUpdate() {
  return {
    updateStatus: computed(() => updateStatus.value),
    isUpdating,
    hasUsbSupport,
    checkUsbConnection,
    updateFirmware,
    downloadFirmware,
    resetStatus,
  };
}
