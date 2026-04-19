<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MobileScales from './pages/MobileScales.vue';
import MobileSliders from './pages/MobileSliders.vue';
import FirstTimeOverlay from './components/FirstTimeOverlay.vue';
import ContextualConnectionModal from './components/ContextualConnectionModal.vue';
import BatteryMeter from './components/BatteryMeter.vue';
import BatteryModal from './components/BatteryModal.vue';
import ToastNotification from './components/ToastNotification.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import { useDeviceState } from './composables/useDeviceState';
import { useToast } from './composables/useToast';
import { useConfirm } from './composables/useConfirm';
import { useBatteryModal } from './composables/useBatteryModal';
import { useUIPreferences } from './composables/useUIPreferences';
import { FIRST_TIME_BLE_INTRO_KEY } from './constants';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  connect,
  disconnect,
  devMode,
  setDevMode,
} = useDeviceState();
const { dialogs, remove: removeDialog } = useConfirm();
const { batteryMonitoringEnabled } = useUIPreferences();
const { showBatteryModal, openBatteryModal, closeBatteryModal } = useBatteryModal();

const { toasts, remove, success } = useToast();

// Single unified tab state
type Tab = 'settings' | 'sliders';
const activeTab = ref<Tab>('settings');

const tabs = [
  { id: 'settings' as Tab, label: 'SETTINGS' },
  { id: 'sliders' as Tab, label: 'SLIDERS' }
];

// Hover state for bluetooth connection section (text and icon)
const isHoveringStatus = ref(false);

// Modal states
const showFirstTimeOverlay = ref(false);
const showContextualModal = ref(false);

// Sync button state
const isUploading = ref(false);
const syncHasChanges = computed(() => mobileScalesRef.value?.hasChanges ?? false);

// Secret evaluation mode toggle (tap logo 5 times)
const logoClickCount = ref(0);
const logoClickTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showDevModeModal = ref(false);
const modalJustOpened = ref(false);

// Show counter after 2nd tap
const showTapCounter = computed(() => logoClickCount.value >= 2 && logoClickCount.value < 5);

function handleLogoClick(event?: Event) {
  // Prevent default behavior and stop propagation
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  logoClickCount.value++;
  
  // Reset timer
  if (logoClickTimer.value) clearTimeout(logoClickTimer.value);
  
  // If 5 clicks reached, toggle evaluation mode and show modal
  if (logoClickCount.value >= 5) {
    showDevModeModal.value = true;
    logoClickCount.value = 0;
    // Prevent modal from closing immediately
    modalJustOpened.value = true;
    setTimeout(() => {
      modalJustOpened.value = false;
    }, 300);
    return;
  }
  
  // Reset count after 2 seconds of no clicks
  logoClickTimer.value = setTimeout(() => {
    logoClickCount.value = 0;
    logoClickTimer.value = null;
  }, 2000);
}

function toggleDevMode() {
  setDevMode(!devMode.value);
}

function closeDevModeModal() {
  // Prevent closing if modal just opened
  if (modalJustOpened.value) return;
  showDevModeModal.value = false;
}

// Computed property for bluetooth status text
const bluetoothStatusText = computed(() => {
  if (isConnected.value) {
    return isHoveringStatus.value ? 'DISCONNECT' : 'CONNECTED';
  }
  return isHoveringStatus.value ? 'CONNECT' : 'DISCONNECTED';
});

// Computed property to check if in live mode
const isInLiveMode = computed(() => {
  return activeTab.value === 'sliders' && mobileSlidersRef.value?.isInLiveMode();
});

// Detect if mobile device
const isMobile = computed(() => {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  return hasTouch && isSmallScreen;
});

// Detect platform for appropriate warning message
const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
});

const isAndroid = computed(() => {
  return /Android/i.test(navigator.userAgent);
});

const isFirefox = computed(() => {
  return /Firefox/i.test(navigator.userAgent);
});

const isBrave = computed(() => {
  return /Brave/i.test(navigator.userAgent) || (navigator as any).brave !== undefined;
});

// Dynamic warning message based on platform
const bluetoothWarningMessage = computed(() => {
  if (isIOS.value) {
    return '⚠️ Web Bluetooth not supported on iOS Safari. Download V Browser from the App Store.';
  } else if (isFirefox.value) {
    return isAndroid.value 
      ? '⚠️ Web Bluetooth untested in Firefox. Chrome, Edge, or Samsung Internet are recommended.'
      : '⚠️ Web Bluetooth untested in Firefox. Chrome or Edge are recommended.';
  } else if (isBrave.value) {
    return isAndroid.value
      ? '⚠️ Web Bluetooth untested in Brave. Chrome, Edge, or Samsung Internet are recommended.'
      : '⚠️ Web Bluetooth untested in Brave. Chrome or Edge are recommended.';
  } else if (isAndroid.value) {
    return '⚠️ Web Bluetooth untested in this browser. Chrome, Edge, or Samsung Internet are recommended.';
  } else {
    return '⚠️ Web Bluetooth untested in this browser. Chrome or Edge are recommended.';
  }
});

// Only hide header/footer on mobile live mode
const hideUI = computed(() => {
  return isMobile.value && isInLiveMode.value;
});

// Wake Lock - prevents screen auto-dimming during use
let wakeLock: WakeLockSentinel | null = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake Lock active - screen will not auto-dim');
    }
  } catch (err) {
    // Silently fail if Wake Lock is not supported or permission denied
    console.warn('Wake Lock not available:', err);
  }
}

// Check if first-time overlay should be shown
onMounted(() => {
  const hasSeenIntro = localStorage.getItem(FIRST_TIME_BLE_INTRO_KEY);
  if (!hasSeenIntro && !isConnected.value) {
    showFirstTimeOverlay.value = true;
  }

  // Show/hide the sticky-nav top mask only after the logo header scrolls away
  if (appHeaderRef.value) {
    const observer = new IntersectionObserver(
      ([entry]) => { isScrolledPastHeader.value = !(entry?.isIntersecting ?? true); },
      { threshold: 0 }
    );
    observer.observe(appHeaderRef.value);
  }

  // Apply dark theme permanently
  document.documentElement.classList.add('theme-kb1-dark');

  // Request Wake Lock to prevent screen auto-dimming
  requestWakeLock();

  // Re-acquire Wake Lock when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wakeLock === null) {
      requestWakeLock();
    }
  });
});

async function handleConnect() {
  try {
    await connect();
    
    // Close any open modals on successful connection
    showFirstTimeOverlay.value = false;
    showContextualModal.value = false;
    
    // Show success toast with animated BLE icon
    success('Connected via Bluetooth');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

async function handleDisconnect() {
  try {
    await disconnect();
  } catch (error) {
    console.error('Disconnection failed:', error);
  }
}

function handleFirstTimeDismiss() {
  showFirstTimeOverlay.value = false;
  localStorage.setItem(FIRST_TIME_BLE_INTRO_KEY, 'true');
}

function handleContextualDismiss() {
  showContextualModal.value = false;
}

/**
 * Check if a click event was on a disabled control that should trigger the contextual modal.
 * 
 * Detects clicks on:
 * - Input elements (text, number, etc.)
 * - Select dropdowns
 * - Buttons (excluding accordion headers)
 * - Elements with .value-control class (custom value controls)
 * - Elements with .slider-control class (sliders)
 * - Elements with .form-control class (general form controls)
 * 
 * @param target - The HTML element that was clicked
 * @returns true if the click should trigger the contextual modal
 */
function isDisabledControlClick(target: HTMLElement): boolean {
  // Check for basic form elements
  const isBasicControl = target.tagName === 'INPUT' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'BUTTON';
  
  // Check for custom control components
  const isCustomControl = target.closest('.value-control') ||
                          target.closest('.slider-control') ||
                          target.closest('.form-control');
  
  // Don't trigger for accordion headers (they should still work when disconnected)
  const isAccordionHeader = target.closest('.accordion-header');
  
  // Don't trigger for System Settings (always accessible)
  const isSystemSettings = target.closest('.system-settings-wrapper') || target.closest('.settings-system');
  
  // Don't trigger for Preset Manager (always accessible for local presets)
  const isPresetManager = target.closest('.preset-manager');
  
  return (isBasicControl || Boolean(isCustomControl)) && !isAccordionHeader && !isSystemSettings && !isPresetManager;
}

function handleMainClick(event: MouseEvent) {
  if (!isConnected.value) {
    const target = event.target as HTMLElement;
    
    if (isDisabledControlClick(target)) {
      event.preventDefault();
      event.stopPropagation();
      showContextualModal.value = true;
    }
  }
}

// Refs for page components
const mobileScalesRef = ref<InstanceType<typeof MobileScales> | null>(null);
const mobileSlidersRef = ref<InstanceType<typeof MobileSliders> | null>(null);
const appHeaderRef = ref<HTMLElement | null>(null);
const isScrolledPastHeader = ref(false);

async function handleSyncSave() {
  if (isUploading.value || !isConnected.value || activeTab.value !== 'settings') return;
  if (!syncHasChanges.value) return;
  isUploading.value = true;
  try {
    await mobileScalesRef.value?.triggerSave();
  } finally {
    isUploading.value = false;
  }
}

function handleTabClick(tabId: Tab) {
  // If clicking on sliders tab while in live mode, exit live mode
  if (tabId === 'sliders' && activeTab.value === 'sliders') {
    if (mobileSlidersRef.value?.isInLiveMode()) {
      mobileSlidersRef.value?.exitLiveMode();
      return;
    }
  }
  
  // If clicking on already active tab, close all accordions
  if (activeTab.value === tabId) {
    if (tabId === 'settings') {
      mobileScalesRef.value?.closeAllAccordions();
    }
  } else {
    // Switch to the new tab
    activeTab.value = tabId;
  }
}

</script>

<template>
  <div class="app theme-kb1-dark">
    <!-- First-Time Overlay -->
    <FirstTimeOverlay
      :show="showFirstTimeOverlay"
      @connect="handleConnect"
      @dismiss="handleFirstTimeDismiss"
    />
    
    <!-- Contextual Connection Modal -->
    <ContextualConnectionModal
      :show="showContextualModal"
      @connect="handleConnect"
      @dismiss="handleContextualDismiss"
    />
    
    <!-- Battery Modal -->
    <BatteryModal 
      :is-open="showBatteryModal"
      :is-connected="isConnected"
      @close="closeBatteryModal"
      @needs-connect="closeBatteryModal(); showContextualModal = true;"
    />
    
    <!-- Unified Responsive Layout -->
    <header v-if="!hideUI" class="app-header" ref="appHeaderRef">
      <div class="header-content">
        <!-- KB1 logo - centered, no buttons -->
        <div class="logo-section logo-tap-zone" @click="handleLogoClick" @touchend.prevent="handleLogoClick">
          <svg class="header-logo" viewBox="0 0 257 36" xmlns="http://www.w3.org/2000/svg">
            <path d="M116.991 4L31.5948 4C31.2268 4 30.8751 4.16309 30.6379 4.44849L22.7462 13.826C22.599 13.9973 22.3536 14.0544 22.1492 13.9565C21.9447 13.8587 21.8302 13.6385 21.8711 13.4183L23.2614 5.46779C23.3268 5.109 23.2287 4.73389 22.9915 4.44849C22.7543 4.16309 22.4027 4 22.0347 4H13.1288C12.5236 4 12.0002 4.43218 11.9021 5.02745L7.01983 32.5241C6.9544 32.8828 7.05254 33.2579 7.2897 33.5434C7.52687 33.8288 7.87852 33.9918 8.24653 33.9918H17.1606C17.7657 33.9918 18.2891 33.5597 18.3873 32.9644L19.8021 24.9649C19.8348 24.7692 19.9902 24.6061 20.1864 24.5654C20.3827 24.5246 20.5872 24.598 20.7098 24.7692L26.8188 33.47C27.056 33.8043 27.4322 34 27.8411 34L116.5 34" stroke="#757254" stroke-width="1" stroke-miterlimit="10" fill="none"/>
            <path d="M31.1205 20.2517H38.7587" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M81.7179 7.58789H74.7911" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M81.2844 10.1157H71.7488" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M80.8019 12.6843H66.4413" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M80.3685 15.1877H65.9834" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M70.653 17.7239H79.9105" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M70.195 20.2517H79.4526" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M69.7616 22.8367H79.0191" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M69.2791 25.3726H78.5366" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M68.8702 27.8516H78.1277" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M68.3631 30.3877H77.6288" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M40.5824 10.1157H39.6092" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M40.1081 12.6843H37.4911" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M39.6747 15.1877H35.4057" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M33.1731 17.7239H39.2167" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M32.3472 22.8367H38.3253" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M34.0891 25.3726H37.8428" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M35.8392 27.8516H37.4339" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M36.9105 30.3877H36.9278" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M51.3038 12.6843H56.1615" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M49.5046 22.8367H55.9162" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M49.063 25.3726H55.4746" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M50.9031 15.1877H55.262" stroke="#757254" stroke-width="1" stroke-miterlimit="10" stroke-linecap="round" fill="none"/>
            <path d="M113 3.5H243C246.59 3.5 249.5 6.41015 249.5 10H248.5C248.5 6.96243 246.038 4.5 243 4.5H113V3.5ZM249.5 28C249.5 31.5899 246.59 34.5 243 34.5H113V33.5H243C246.038 33.5 248.5 31.0376 248.5 28H249.5ZM113 34V4V34ZM243 3.5C246.59 3.5 249.5 6.41015 249.5 10V28C249.5 31.5899 246.59 34.5 243 34.5V33.5C246.038 33.5 248.5 31.0376 248.5 28V10C248.5 6.96243 246.038 4.5 243 4.5V3.5Z" fill="#757254"/>
            <path d="M106.687 21.0059C106.627 21.4661 106.509 21.89 106.331 22.2773C106.153 22.6602 105.923 22.9883 105.641 23.2617C105.354 23.5397 105.014 23.7562 104.622 23.9111C104.235 24.0615 103.802 24.1367 103.323 24.1367C102.913 24.1367 102.539 24.0798 102.202 23.9658C101.869 23.8473 101.573 23.6855 101.313 23.4805C101.049 23.2754 100.821 23.0339 100.63 22.7559C100.443 22.4779 100.288 22.1748 100.165 21.8467C100.037 21.5186 99.9417 21.1745 99.8779 20.8145C99.8187 20.4544 99.7868 20.0898 99.7822 19.7207V18.333C99.7868 17.9639 99.8187 17.5993 99.8779 17.2393C99.9417 16.8792 100.037 16.5352 100.165 16.207C100.288 15.8789 100.443 15.5758 100.63 15.2979C100.821 15.0153 101.049 14.7715 101.313 14.5664C101.573 14.3613 101.869 14.2018 102.202 14.0879C102.535 13.9694 102.909 13.9102 103.323 13.9102C103.82 13.9102 104.264 13.9876 104.656 14.1426C105.048 14.293 105.385 14.5072 105.668 14.7852C105.951 15.0677 106.176 15.4049 106.345 15.7969C106.518 16.1888 106.632 16.6217 106.687 17.0957H105.422C105.381 16.7949 105.31 16.5146 105.21 16.2549C105.11 15.9951 104.975 15.7673 104.807 15.5713C104.638 15.3753 104.431 15.2227 104.185 15.1133C103.943 14.9993 103.656 14.9424 103.323 14.9424C103.022 14.9424 102.756 14.9925 102.523 15.0928C102.296 15.1885 102.1 15.3206 101.936 15.4893C101.767 15.6579 101.626 15.8538 101.512 16.0771C101.402 16.3005 101.313 16.5374 101.245 16.7881C101.177 17.0387 101.127 17.2962 101.095 17.5605C101.067 17.8203 101.054 18.0732 101.054 18.3193V19.7207C101.054 19.9668 101.067 20.222 101.095 20.4863C101.127 20.7461 101.177 21.0013 101.245 21.252C101.313 21.5072 101.402 21.7464 101.512 21.9697C101.621 22.193 101.76 22.389 101.929 22.5576C102.097 22.7308 102.296 22.8675 102.523 22.9678C102.751 23.0635 103.018 23.1113 103.323 23.1113C103.656 23.1113 103.943 23.0589 104.185 22.9541C104.431 22.8493 104.638 22.7012 104.807 22.5098C104.975 22.3229 105.11 22.1019 105.21 21.8467C105.31 21.5869 105.381 21.3066 105.422 21.0059H106.687ZM118.122 19.5977C118.118 19.9531 118.086 20.3132 118.026 20.6777C117.972 21.0378 117.885 21.3864 117.767 21.7236C117.648 22.0609 117.495 22.3753 117.309 22.667C117.126 22.9587 116.908 23.2139 116.652 23.4326C116.397 23.6514 116.103 23.8245 115.771 23.9521C115.442 24.0752 115.073 24.1367 114.663 24.1367C114.253 24.1367 113.882 24.0752 113.549 23.9521C113.221 23.8245 112.929 23.6514 112.674 23.4326C112.419 23.2139 112.198 22.9587 112.011 22.667C111.824 22.3708 111.671 22.054 111.553 21.7168C111.43 21.3796 111.339 21.0309 111.279 20.6709C111.22 20.3109 111.188 19.9531 111.184 19.5977V18.4629C111.188 18.1074 111.218 17.7497 111.272 17.3896C111.332 17.0251 111.423 16.6742 111.546 16.3369C111.664 15.9997 111.815 15.6852 111.997 15.3936C112.184 15.0973 112.405 14.8376 112.66 14.6143C112.915 14.3955 113.207 14.2246 113.535 14.1016C113.868 13.974 114.239 13.9102 114.649 13.9102C115.06 13.9102 115.431 13.974 115.764 14.1016C116.096 14.2246 116.39 14.3955 116.646 14.6143C116.901 14.833 117.119 15.0905 117.302 15.3867C117.489 15.6784 117.644 15.9928 117.767 16.3301C117.885 16.6673 117.972 17.0182 118.026 17.3828C118.086 17.7474 118.118 18.1074 118.122 18.4629V19.5977ZM116.871 18.4492C116.867 18.2122 116.851 17.9661 116.823 17.7109C116.796 17.4512 116.75 17.1937 116.687 16.9385C116.618 16.6878 116.529 16.4486 116.42 16.2207C116.311 15.9883 116.174 15.7832 116.01 15.6055C115.846 15.4323 115.652 15.2956 115.429 15.1953C115.205 15.0905 114.946 15.0381 114.649 15.0381C114.358 15.0381 114.1 15.0905 113.877 15.1953C113.654 15.3001 113.46 15.4391 113.296 15.6123C113.132 15.79 112.995 15.9951 112.886 16.2275C112.776 16.4554 112.69 16.6947 112.626 16.9453C112.558 17.2005 112.507 17.458 112.476 17.7178C112.448 17.973 112.432 18.2168 112.428 18.4492V19.5977C112.432 19.8301 112.448 20.0762 112.476 20.3359C112.507 20.5957 112.558 20.8509 112.626 21.1016C112.694 21.3568 112.783 21.6006 112.893 21.833C113.002 22.0654 113.139 22.2682 113.303 22.4414C113.467 22.6191 113.66 22.7604 113.884 22.8652C114.107 22.9701 114.367 23.0225 114.663 23.0225C114.959 23.0225 115.219 22.9701 115.442 22.8652C115.67 22.7604 115.866 22.6191 116.03 22.4414C116.19 22.2682 116.322 22.0677 116.427 21.8398C116.536 21.6074 116.625 21.3636 116.693 21.1084C116.757 20.8577 116.8 20.6025 116.823 20.3428C116.851 20.083 116.867 19.8346 116.871 19.5977V18.4492ZM129.291 24H128.006L124.144 16.5625L124.123 24H122.845V14.0469H124.13L127.992 21.4707L128.013 14.0469H129.291V24ZM140.002 19.6045H135.859V24H134.581V14.0469H140.692V15.127H135.859V18.5312H140.002V19.6045ZM145.873 14.0469H151.889V15.1475H149.503V22.9062H151.889V24H145.873V22.9062H148.204V15.1475H145.873V14.0469ZM163.721 22.6943C163.566 22.8766 163.402 23.043 163.229 23.1934C163.055 23.3392 162.875 23.4668 162.688 23.5762C162.369 23.7676 162.025 23.9089 161.656 24C161.287 24.0957 160.9 24.1413 160.494 24.1367C160.084 24.1322 159.706 24.0706 159.359 23.9521C159.018 23.8291 158.71 23.6605 158.437 23.4463C158.163 23.2367 157.924 22.9883 157.719 22.7012C157.514 22.4141 157.343 22.1019 157.206 21.7646C157.065 21.432 156.958 21.0833 156.885 20.7188C156.816 20.3496 156.78 19.9782 156.775 19.6045V18.4492C156.78 18.0801 156.812 17.7132 156.871 17.3486C156.935 16.9795 157.031 16.6263 157.158 16.2891C157.286 15.9518 157.445 15.6396 157.637 15.3525C157.828 15.0609 158.058 14.8079 158.327 14.5938C158.591 14.3841 158.892 14.2178 159.229 14.0947C159.567 13.9717 159.945 13.9102 160.364 13.9102C160.829 13.9102 161.257 13.9831 161.649 14.1289C162.041 14.2702 162.383 14.473 162.675 14.7373C162.966 15.0062 163.201 15.3298 163.379 15.708C163.557 16.0817 163.666 16.501 163.707 16.9658H162.456C162.406 16.6787 162.328 16.4144 162.224 16.1729C162.119 15.9268 161.982 15.7171 161.813 15.5439C161.64 15.3708 161.435 15.2363 161.198 15.1406C160.961 15.0404 160.686 14.9902 160.371 14.9902C160.07 14.9902 159.804 15.0426 159.571 15.1475C159.339 15.2477 159.136 15.3844 158.963 15.5576C158.79 15.7308 158.646 15.9336 158.532 16.166C158.418 16.3939 158.325 16.6354 158.252 16.8906C158.179 17.1458 158.127 17.4056 158.095 17.6699C158.063 17.9342 158.047 18.1895 158.047 18.4355V19.6045C158.051 19.8551 158.072 20.1149 158.108 20.3838C158.149 20.6481 158.211 20.9079 158.293 21.1631C158.375 21.4183 158.48 21.6598 158.607 21.8877C158.735 22.1156 158.89 22.3161 159.072 22.4893C159.25 22.6624 159.457 22.8014 159.694 22.9062C159.931 23.0065 160.2 23.0589 160.501 23.0635C160.674 23.068 160.854 23.0612 161.041 23.043C161.232 23.0247 161.417 22.9883 161.595 22.9336C161.772 22.8789 161.939 22.806 162.094 22.7148C162.249 22.6191 162.379 22.4961 162.483 22.3457L162.497 20.1104H160.474V19.0439H163.7L163.721 22.6943ZM174.938 14.0469L174.951 20.7871C174.951 21.252 174.869 21.6872 174.705 22.0928C174.541 22.4984 174.315 22.8516 174.028 23.1523C173.741 23.4577 173.399 23.6992 173.003 23.877C172.606 24.0501 172.171 24.1367 171.697 24.1367C171.214 24.1367 170.774 24.0501 170.378 23.877C169.981 23.7038 169.642 23.4645 169.359 23.1592C169.077 22.8584 168.856 22.5052 168.696 22.0996C168.537 21.6895 168.455 21.252 168.45 20.7871L168.464 14.0469H169.667L169.694 20.7871C169.699 21.0833 169.744 21.3682 169.831 21.6416C169.922 21.915 170.052 22.1566 170.221 22.3662C170.385 22.5758 170.59 22.7445 170.836 22.8721C171.087 22.9997 171.374 23.0635 171.697 23.0635C172.021 23.0635 172.306 23.002 172.552 22.8789C172.798 22.7513 173.005 22.5804 173.174 22.3662C173.338 22.2156 173.463 21.915 173.55 21.6416C173.636 21.3682 173.684 21.0833 173.693 20.7871L173.714 14.0469H174.938ZM183.393 19.9395H181.403V24H180.146V14.0469H183.064C183.529 14.056 183.967 14.1221 184.377 14.2451C184.787 14.3682 185.147 14.5527 185.457 14.7988C185.762 15.0449 186.002 15.3548 186.175 15.7285C186.353 16.0977 186.441 16.5329 186.441 17.0342C186.441 17.3577 186.394 17.654 186.298 17.9229C186.207 18.1917 186.079 18.4355 185.915 18.6543C185.751 18.873 185.555 19.0667 185.327 19.2354C185.099 19.404 184.849 19.5475 184.575 19.666L186.688 23.918L186.681 24H185.348L183.393 19.9395ZM181.403 18.9004H183.099C183.381 18.8958 183.648 18.8525 183.898 18.7705C184.149 18.6839 184.37 18.5609 184.562 18.4014C184.748 18.2419 184.896 18.0482 185.006 17.8203C185.115 17.5879 185.17 17.3213 185.17 17.0205C185.17 16.7015 185.118 16.4235 185.013 16.1865C184.908 15.945 184.762 15.7422 184.575 15.5781C184.388 15.4186 184.165 15.2979 183.905 15.2158C183.65 15.1338 183.37 15.0905 183.064 15.0859H181.403V18.9004ZM196.257 21.4229H192.935L192.135 24H190.87L194.083 14.0469H195.143L198.301 24H197.043L196.257 21.4229ZM193.276 20.3223H195.922L194.609 16.002L193.276 20.3223ZM209.627 15.127H206.551V24H205.32V15.127H202.244V14.0469H209.627V15.127ZM220.796 19.5977C220.791 19.9531 220.759 20.3132 220.7 20.6777C220.646 21.0378 220.559 21.3864 220.44 21.7236C220.322 22.0609 220.169 22.3753 219.982 22.667C219.8 22.9587 219.581 23.2139 219.326 23.4326C219.071 23.6514 218.777 23.8245 218.444 23.9521C218.116 24.0752 217.747 24.1367 217.337 24.1367C216.927 24.1367 216.555 24.0752 216.223 23.9521C215.895 23.8245 215.603 23.6514 215.348 23.4326C215.092 23.2139 214.871 22.9587 214.685 22.667C214.498 22.3708 214.345 22.054 214.227 21.7168C214.104 21.3796 214.012 21.0309 213.953 20.6709C213.894 20.3109 213.862 19.9531 213.857 19.5977V18.4629C213.862 18.1074 213.892 17.7497 213.946 17.3896C214.006 17.0251 214.097 16.6742 214.22 16.3369C214.338 15.9997 214.489 15.6852 214.671 15.3936C214.858 15.0973 215.079 14.8376 215.334 14.6143C215.589 14.3955 215.881 14.2246 216.209 14.1016C216.542 13.974 216.913 13.9102 217.323 13.9102C217.733 13.9102 218.105 13.974 218.438 14.1016C218.77 14.2246 219.064 14.3955 219.319 14.6143C219.575 14.833 219.793 15.0905 219.976 15.3867C220.162 15.6784 220.317 15.9928 220.44 16.3301C220.559 16.6673 220.646 17.0182 220.7 17.3828C220.759 17.7474 220.791 18.1074 220.796 18.4629V19.5977ZM219.545 18.4492C219.54 18.2122 219.524 17.9661 219.497 17.7109C219.47 17.4512 219.424 17.1937 219.36 16.9385C219.292 16.6878 219.203 16.4486 219.094 16.2207C218.984 15.9883 218.848 15.7832 218.684 15.6055C218.52 15.4323 218.326 15.2956 218.103 15.1953C217.879 15.0905 217.619 15.0381 217.323 15.0381C217.032 15.0381 216.774 15.0905 216.551 15.1953C216.327 15.3001 216.134 15.4391 215.97 15.6123C215.806 15.79 215.669 15.9951 215.56 16.2275C215.45 16.4554 215.364 16.6947 215.3 16.9453C215.231 17.2005 215.181 17.458 215.149 17.7178C215.122 17.973 215.106 18.2168 215.102 18.4492V19.5977C215.106 19.8301 215.122 20.0762 215.149 20.3359C215.181 20.5957 215.231 20.8509 215.3 21.1016C215.368 21.3568 215.457 21.6006 215.566 21.833C215.676 22.0654 215.812 22.2682 215.977 22.4414C216.141 22.6191 216.334 22.7604 216.558 22.8652C216.781 22.9701 217.041 23.0225 217.337 23.0225C217.633 23.0225 217.893 22.9701 218.116 22.8652C218.344 22.7604 218.54 22.6191 218.704 22.4414C218.864 22.2682 218.996 22.0677 219.101 21.8398C219.21 21.6074 219.299 21.3636 219.367 21.1084C219.431 20.8577 219.474 20.6025 219.497 20.3428C219.524 20.083 219.54 19.8346 219.545 19.5977V18.4492ZM229.025 19.9395H227.036V24H225.778V14.0469H228.697C229.162 14.056 229.6 14.1221 230.01 14.2451C230.42 14.3682 230.78 14.5527 231.09 14.7988C231.395 15.0449 231.634 15.3548 231.808 15.7285C231.985 16.0977 232.074 16.5329 232.074 17.0342C232.074 17.3577 232.026 17.654 231.931 17.9229C231.84 18.1917 231.712 18.4355 231.548 18.6543C231.384 18.873 231.188 19.0667 230.96 19.2354C230.732 19.404 230.481 19.5475 230.208 19.666L232.32 23.918L232.313 24H230.98L229.025 19.9395ZM227.036 18.9004H228.731C229.014 18.8958 229.281 18.8525 229.531 18.7705C229.782 18.6839 230.003 18.5609 230.194 18.4014C230.381 18.2419 230.529 18.0482 230.639 17.8203C230.748 17.5879 230.803 17.3213 230.803 17.0205C230.803 16.7015 230.75 16.4235 230.646 16.1865C230.541 15.945 230.395 15.7422 230.208 15.5781C230.021 15.4186 229.798 15.2979 229.538 15.2158C229.283 15.1338 229.003 15.0905 228.697 15.0859H227.036V18.9004Z" fill="#757254"/>
          </svg>
          <!-- Tap counter (shows after 2nd tap) -->
          <div v-if="showTapCounter" class="tap-counter">{{ logoClickCount }}</div>
        </div>
      </div>
      
      <div v-if="!isBluetoothAvailable" class="warning-banner">
        {{ bluetoothWarningMessage }}
      </div>
    </header>
    
    <!-- Unified Tab Navigation with Bluetooth Controls -->
    <div v-if="!hideUI" class="tab-nav-wrapper" :class="{ 'past-header': isScrolledPastHeader }">
      <nav class="app-nav">
        <!-- Left group: Battery + Bluetooth -->
        <div class="nav-left">
          <!-- Battery Meter (conditionally visible based on preference) -->
          <BatteryMeter 
            v-if="batteryMonitoringEnabled"
            class="battery-meter-nav"
            @click="isConnected ? openBatteryModal() : (showContextualModal = true)"
          />

          <!-- Bluetooth status section (icon only) -->
          <div 
            class="bluetooth-status" 
            :class="{ connected: isConnected, hoverable: true }"
            @click="isConnected ? handleDisconnect() : handleConnect()"
            @touchstart="isHoveringStatus = true"
            @touchend="isHoveringStatus = false"
            @mouseenter="isHoveringStatus = true"
            @mouseleave="isHoveringStatus = false"
            :title="bluetoothStatusText"
          >
            <svg class="bluetooth-icon" viewBox="0 0 23 26" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.63159 4.90753L17.1295 19.1835L11.2655 25V1L17.0505 6.73819L3.63159 20.9374" stroke="#47708E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <path d="M1.65541 14.1527C2.56966 14.1527 3.31081 13.4116 3.31081 12.4974C3.31081 11.5832 2.56966 10.842 1.65541 10.842C0.741151 10.842 0 11.5832 0 12.4974C0 13.4116 0.741151 14.1527 1.65541 14.1527Z" fill="#47708E"/>
              <path d="M20.7212 14.1527C21.6355 14.1527 22.3766 13.4116 22.3766 12.4974C22.3766 11.5832 21.6355 10.842 20.7212 10.842C19.8069 10.842 19.0658 11.5832 19.0658 12.4974C19.0658 13.4116 19.8069 14.1527 20.7212 14.1527Z" fill="#47708E"/>
            </svg>
          </div>
        </div>

        <!-- Vertical divider -->
        <div class="separator"></div>

        <!-- Center: tabs -->
        <div class="nav-tabs">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="handleTabClick(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Vertical divider -->
        <div class="separator"></div>

        <!-- Right: Sync/Upload button -->
        <button
          class="save-upload-btn"
          :class="{ 'has-changes': syncHasChanges && isConnected && activeTab === 'settings', 'uploading': isUploading, 'dimmed': !syncHasChanges || !isConnected || activeTab !== 'settings' }"
          @click="handleSyncSave"
          title="Upload settings to device"
        >
          <svg class="save-upload-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12.5" stroke="currentColor" stroke-width="1.75"/>
            <line x1="14" y1="20" x2="14" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="14" y1="9.5" x2="9.5" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="14" y1="9.5" x2="18.5" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </nav>
      
      <!-- Horizontal divider under navigation -->
      <div class="nav-divider"></div>
    </div>
    
    <main class="app-main" :class="{ 'live-fullscreen': hideUI }" @click="handleMainClick">
      <MobileScales v-show="activeTab === 'settings'" ref="mobileScalesRef" />
      <MobileSliders v-show="activeTab === 'sliders'" ref="mobileSlidersRef" />
    </main>
    
    <!-- Pulsing Red Dot - Evaluation Mode Indicator -->
    <div v-if="devMode" class="dev-mode-indicator" title="Evaluation Mode Active">
      <div class="pulse-dot"></div>
    </div>
    
    <!-- Secret Evaluation Mode Modal -->
    <div v-if="showDevModeModal" class="dev-mode-modal-overlay" @click.self.stop="closeDevModeModal">
      <div class="dev-mode-modal">
        <h2>Evaluation Mode</h2>
        <div class="modal-content">
          <div class="dev-mode-warning">
            <p>Explore the interface without KB1 hardware using simulated device data.</p>
            <p><strong>What Works:</strong> All settings, presets, and community browsing with mock data.</p>
            <p><strong>What Doesn't:</strong> No Bluetooth hardware communication.</p>
            <p class="status-line"><strong>Current Status:</strong> <span :class="{ 'status-enabled': devMode, 'status-disabled': !devMode }">{{ devMode ? 'ENABLED' : 'DISABLED' }}</span></p>
          </div>
          
          <div class="dev-mode-toggle">
            <label class="toggle-switch">
              <input type="checkbox" :checked="devMode" @change="toggleDevMode" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ devMode ? 'Disable' : 'Enable' }} Evaluation Mode</span>
          </div>
        </div>
        
        <div class="dev-mode-actions">
          <button class="btn-modal-close" @click="closeDevModeModal">Close</button>
        </div>
      </div>
    </div>
    
    <!-- Toast Notifications Container -->
    <div class="toast-container">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="remove(toast.id)"
      />
    </div>
    
    <!-- Confirm Dialogs -->
    <ConfirmDialog
      v-for="dialog in dialogs"
      :key="dialog.id"
      :message="dialog.message"
      :position="dialog.position"
      @confirm="removeDialog(dialog.id, true)"
      @cancel="removeDialog(dialog.id, false)"
    />
  </div>
</template>

<style>
/* Import Roboto Mono font */
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

/* ===== NOTE: Theme-specific color variables are defined in /src/styles/themes/kb1.css ===== */
/* The .theme-kb1-dark class contains all color definitions */

:root {
  /* Default to dark mode colors for fallback */
  --color-background: #0F0F0F;
  --color-background-soft: #0F0F0F;
  --color-background-mute: #0F0F0F;
  --color-border: transparent;
  --color-border-hover: transparent;
  --color-divider: rgba(234, 234, 234, 0.2);
  --color-text: #EAEAEA;
  --color-text-muted: rgba(234, 234, 234, 0.32);
}

* {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
  /* Controls overscroll/bounce area color on non-Safari iOS browsers and Android Chrome */
  background: var(--color-background);
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto Mono';
  font-size: 13px;
  background: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
  touch-action: manipulation; /* Disable double-tap zoom */
  -webkit-text-size-adjust: 100%; /* Prevent font scaling in Safari/iOS */
  -moz-text-size-adjust: 100%; /* Prevent font scaling in Firefox */
  -ms-text-size-adjust: 100%; /* Prevent font scaling in IE/Edge */
  text-size-adjust: 100%; /* Standard property */
}

#app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* Main disconnected state styling */
.disconnected-state {
  filter: grayscale(100%);
  position: relative;
  opacity: 0.8;
}

.disconnected-state::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(128, 128, 128, 0.05);
  z-index: 1;
  pointer-events: none;
}

/* Subtle connection status bar */
.connection-status-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-dot.disconnected {
  background: #ef4444;
  animation: pulse-subtle 2s infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Allow accordion header interaction when disconnected */
.disconnected-state .accordion-header,
.disconnected-state .accordion-header * {
  pointer-events: auto !important;
  cursor: pointer !important;
}

/* Enhanced disabled state for form controls when disconnected */
.disconnected-state .form-control,
.disconnected-state input,
.disconnected-state select,
.disconnected-state button:not(.accordion-header),
.disconnected-state .group input,
.disconnected-state .group select {
  opacity: 0.4;
  cursor: not-allowed;
  position: relative;
}
</style>

<style scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  touch-action: manipulation; /* Disable double-tap zoom */
}

/* Header - Unified for all screen sizes */
.app-header {
  background-color: var(--color-background);
  border-bottom: none;
  position: relative;
  z-index: 100; /* Lower than sticky tabs */
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-tap-zone {
  cursor: pointer;
  position: relative;
  touch-action: manipulation; /* Disable double-tap zoom */
  user-select: none; /* Prevent text selection */
  -webkit-user-select: none;
  -webkit-touch-callout: none; /* Disable iOS callout */
}

/* Logo - consistent size across all screens (mobile size from original) */
.header-logo {
  width: 100%;
  height: 40px;
}

.warning-banner {
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.1);
  border-top: 1px solid #ef4444;
  color: #fca5a5;
  text-align: center;
  font-size: 0.8125rem; /* 13px */
}

/* Tab Navigation Wrapper - sticky with background */
.tab-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 200; /* High z-index to stay above header */
  background-color: var(--color-background);
}

/* Solid color block above sticky nav - only activates after the logo header
   has scrolled out of view; hidden while header is still visible */
.tab-nav-wrapper.past-header::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  height: 500px; /* Tall enough to cover logo header + safe area + overscroll */
  background: var(--color-background);
  pointer-events: none;
}

/* Tab Navigation - Unified responsive layout */
.app-nav {
  background-color: var(--color-background);
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  /* Hide scrollbar while keeping scroll functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* Hide scrollbar for Chrome, Safari and Opera */
.app-nav::-webkit-scrollbar {
  display: none;
}

.nav-tabs {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}

.nav-tab {
  padding: 1rem 1rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--color-text);
  font-family: var(--kb1-font-family-mono);
  font-weight: 400;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.32;
  transition: opacity 0.2s, font-weight 0.2s;
  position: relative;
  white-space: nowrap;
  font-size: 0.8125rem;
}

.nav-tab:hover {
  opacity: 0.6;
  background: transparent;
}

.nav-tab.active {
  color: var(--color-text);
  opacity: 1;
  font-weight: 700;
}

/* Active tab underline */
.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
}

/* Inactive tab underline */
.nav-tab:not(.active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-text);
  opacity: 0.32;
  border-radius: 1px;
}

/* Save / Upload sync button */
.save-upload-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: opacity 0.2s;
}

.save-upload-btn.dimmed {
  opacity: 0.32;
  cursor: default;
}

.save-upload-btn.has-changes {
  opacity: 1;
  cursor: pointer;
}

.save-upload-btn.has-changes .save-upload-icon {
  color: var(--ui-highlight);
  animation: save-pulse 2s ease-in-out infinite;
}

.save-upload-btn.uploading .save-upload-icon {
  animation: save-spin 0.5s ease-in-out forwards;
}

.save-upload-icon {
  height: 28px;
  width: 28px;
  display: block;
  transition: color 0.3s;
  color: #EAEAEA; /* Default light gray */
}

@keyframes save-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.18); opacity: 0.75; }
}

@keyframes save-spin {
  0% { transform: scale(1) translateY(0); }
  40% { transform: scale(1.15) translateY(-3px); }
  100% { transform: scale(1) translateY(0); }
}

/* Vertical separator (divider) between theme and tabs */
.separator {
  width: 2px;
  height: 18px;
  background: var(--color-divider);
  align-self: center;
  flex-shrink: 0;
  margin: 0 0.25rem;
}

/* Bluetooth status section in nav */
.bluetooth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0.25rem;
  white-space: nowrap;
}

/* Left navigation group - Battery and Bluetooth */
.nav-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

/* Battery meter in nav - tight spacing */
.battery-meter-nav {
  margin-left: 0;
  margin-right: 0.5rem;
}

.battery-meter-nav :deep(.battery-meter) {
  padding: 4px 4px 4px 0;
}

.bluetooth-status.hoverable {
  cursor: pointer;
}

.status-text {
  font-family: var(--kb1-font-family-mono);
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  color: var(--bluetooth-status-inactive);
  opacity: 0.5;
  transition: color 0.5s ease-in-out, 
              opacity 0.5s ease-in-out, 
              font-weight 0.5s ease-in-out;
  transform-origin: center;
}

.bluetooth-status.hoverable:hover .status-text,
.bluetooth-status.hoverable:active .status-text {
  color: var(--bluetooth-status-active);
  opacity: 1;
  font-weight: 700;
  /* NO transform scale */
}

.bluetooth-status.connected .status-text {
  color: var(--bluetooth-status-active);
  opacity: 1;
  font-weight: 700;
  animation: breathe 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .status-text,
.bluetooth-status.connected.hoverable:active .status-text {
  animation: none; /* Disable breathing on hover/active */
}

.bluetooth-icon {
  height: 32px; /* Scaled up ~60% from typical 20px base for better visibility */
  width: auto;
  transition: filter 0.5s ease-in-out, 
              transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
  filter: var(--bluetooth-icon-filter-inactive);
}

/* Bluetooth icon hover effect - with bounce animation */
.bluetooth-status.hoverable:hover .bluetooth-icon,
.bluetooth-status.hoverable:active .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  transform: scale(1.15);
}

.bluetooth-status.connected .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  animation: breatheScale 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  transform: scale(1.15);
  animation: none; /* Disable breathing animation on hover */
}

/* Breathing animations for connected state */
@keyframes breathe {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes breatheScale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Horizontal divider under navigation */
.nav-divider {
  height: 2px;
  background: var(--color-divider);
  max-width: 1400px;
  margin: -2px auto 0;
  width: 100%;
}

.app-main {
  flex: 1;
  min-height: 100dvh; /* Ensures page is always tall enough to stay scrolled past the header when switching tabs */
  background: var(--color-background);
  padding-bottom: 2rem; /* Unified padding for all screens */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.app-main.live-fullscreen {
  padding-bottom: 0;
}

/* Responsive adjustments using CSS media queries only */
@media (max-width: 640px) {
  .app-nav {
    padding: 0 1rem;
  }
  
  .nav-tab {
    font-size: 0.8125rem;
    padding: 0.75rem 0.5rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .status-text {
    font-size: 0.8125rem;
  }
  
  .bluetooth-icon {
    height: 28px;
  }
  
  .separator {
    margin: 0 0.25rem;
  }
  
  .save-upload-btn {
    padding: 0.5rem 0.5rem;
  }

  .save-upload-icon {
    height: 24px;
    width: 24px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 1rem 1.5rem;
  }
  
  .header-logo {
    width: 100%;
    height: 40px;
  }
  
  .nav-tab {
    font-size: 0.8125rem; /* 13px */
    padding: 0.75rem 0.5rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 0.75rem;
    gap: 0.4rem;
  }
  
  .status-text {
    font-size: 0.8125rem; /* 13px */
  }
  
  .bluetooth-icon {
    height: 24px;
  }
}

/* ===== Evaluation Mode Components ===== */

/* Tap Counter */
.tap-counter {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--ui-highlight);
  color: #0F0F0F;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce-in 0.2s ease-out;
  box-shadow: 0 2px 8px rgba(var(--ui-highlight-rgb), 0.4);
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Pulsing Red Dot Indicator */
.dev-mode-indicator {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 10000;
  pointer-events: none;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}

/* Evaluation Mode Modal */
.dev-mode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  touch-action: manipulation; /* Prevent zoom on mobile */
  user-select: none;
  -webkit-user-select: none;
}

.dev-mode-modal {
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  animation: modal-slide-in 0.3s ease-out;
  touch-action: manipulation; /* Prevent zoom */
  user-select: none;
  -webkit-user-select: none;
  font-family: 'Roboto Mono', monospace;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dev-mode-modal h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
  text-align: left;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dev-mode-warning {
  background: rgba(234, 234, 234, 0.05);
  border: 1px solid rgba(234, 234, 234, 0.15);
  border-radius: 6px;
  padding: 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.dev-mode-warning p {
  margin: 0 0 0.5rem 0;
}

.dev-mode-warning p:last-child {
  margin-bottom: 0;
}

.status-line {
  font-size: 0.8125rem;
  margin-top: 0.75rem !important;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(234, 234, 234, 0.15);
}

.status-enabled {
  color: #10b981;
  font-weight: 700;
}

.status-disabled {
  color: #ef4444;
  font-weight: 700;
}

.dev-mode-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: 1px solid rgba(234, 234, 234, 0.15);
  border-radius: 6px;
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
  background-color: var(--battery-good);
  border-color: var(--battery-good);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.dev-mode-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
  gap: 0.5rem;
}

.btn-modal-close {
  padding: 0.25rem 1rem;
  background: #6A6853;
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
}

.btn-modal-close:hover {
  background: #7A7863;
}

.btn-modal-close:active {
  transform: scale(0.98);
}

/* Toast Notifications Container */
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  align-items: center;
}

@media (max-width: 640px) {
  .toast-container {
    width: 90vw;
  }
}
</style>
