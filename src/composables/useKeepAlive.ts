/**
 * Use Keep-Alive Composable - Vue integration for keep-alive service
 * 
 * Provides a Vue composable for managing BLE keep-alive pings with
 * automatic lifecycle management and connection status integration.
 */

import { onMounted, onBeforeUnmount, ref } from 'vue';
import { KeepAliveService } from '../services/KeepAliveService';
import type { BLEClient } from '../ble/bleClient';

/**
 * Delay before starting keep-alive after BLE connection (in milliseconds)
 * This prevents immediate keep-alive pings that can cause disconnection
 */
const KEEP_ALIVE_START_DELAY_MS = 3000;

/**
 * Vue composable for managing keep-alive pings
 */
export function useKeepAlive(bleClient: BLEClient) {
  const keepAliveService = new KeepAliveService();
  const isKeepAliveActive = ref(false);
  let startDelayTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize keep-alive service with ping callback
   */
  const initKeepAlive = () => {
    keepAliveService.setPingCallback(async () => {
      await bleClient.sendKeepAlivePing();
    });
  };

  /**
   * Start keep-alive if connected
   */
  const startIfConnected = () => {
    if (bleClient.isConnected()) {
      // Clear any pending start timeout
      if (startDelayTimeout) {
        clearTimeout(startDelayTimeout);
      }
      
      startDelayTimeout = setTimeout(() => {
        // Verify connection still active before starting
        if (bleClient.isConnected()) {
          keepAliveService.startKeepAlive();
          isKeepAliveActive.value = true;
        }
        startDelayTimeout = null;
      }, KEEP_ALIVE_START_DELAY_MS);
    }
  };

  /**
   * Stop keep-alive
   */
  const stop = () => {
    // Clear any pending start timeout
    if (startDelayTimeout) {
      clearTimeout(startDelayTimeout);
      startDelayTimeout = null;
    }
    
    keepAliveService.stopKeepAlive();
    isKeepAliveActive.value = false;
  };

  /**
   * Handle visibility change (app going to background/foreground)
   */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      stop();
      console.log('App backgrounded - keep-alive stopped');
    } else {
      keepAliveService.updateActivity();
      startIfConnected();
      console.log('App foregrounded - keep-alive resumed');
    }
  };

  /**
   * Setup lifecycle hooks
   */
  onMounted(() => {
    // Initialize keep-alive service
    initKeepAlive();

    // Start keep-alive if already connected
    startIfConnected();

    // Listen for connection status changes
    bleClient.setStatusChangeCallback((status) => {
      if (status.connected) {
        // Clear any pending start timeout
        if (startDelayTimeout) {
          clearTimeout(startDelayTimeout);
        }
        
        startDelayTimeout = setTimeout(() => {
          // Verify connection still active before starting
          if (bleClient.isConnected()) {
            keepAliveService.startKeepAlive();
            isKeepAliveActive.value = true;
          }
          startDelayTimeout = null;
        }, KEEP_ALIVE_START_DELAY_MS);
      } else {
        stop();
      }
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    // Clean up
    stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isKeepAliveActive,
    keepAliveService,
  };
}
