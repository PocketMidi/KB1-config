import { ref, computed } from 'vue'
import { useWebHaptics } from 'web-haptics/vue'

// Detect iOS
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Global state for haptics preference (default OFF for live app)
const hapticsEnabled = ref(false)
const isIOSDevice = isIOS()
let initialized = false

// Export iOS detection for components to skip haptic setup entirely
export { isIOSDevice }

// Auto-initialize from localStorage on first import
function autoInit() {
  if (initialized) return
  initialized = true
  
  try {
    const stored = localStorage.getItem('kb1-haptics-enabled')
    if (stored !== null) {
      hapticsEnabled.value = JSON.parse(stored)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function useHaptics() {
  autoInit() // Initialize on first use
  
  // Completely disable on iOS - no haptic calls at all
  if (isIOSDevice) {
    return {
      detent: () => {},
      light: () => {},
      selection: () => {},
      success: () => {},
      error: () => {},
      doubleTap: () => {},
      isSupported: computed(() => false),
      enabled: computed({
        get: () => false,
        set: (_value: boolean) => {} // No-op on iOS
      }),
      init: () => {}
    }
  }
  
  const { trigger, isSupported } = useWebHaptics({
    debug: false,
  })

  // Check if haptics should be triggered
  const shouldTrigger = computed(() => hapticsEnabled.value && isSupported)

  // Timestamp for throttling rapid scroll haptics
  let lastDetentTime = 0
  const DETENT_THROTTLE_MS = 35 // Minimum time between scroll haptics (allows slow scrolling)

  // Helper function to conditionally trigger haptics
  const conditionalTrigger = (pattern: any) => {
    if (!shouldTrigger.value) return
    
    try {
      trigger(pattern)
    } catch (error) {
      console.error('[Haptics] Error:', error)
    }
  }

  // Throttled detent for scroll - prevents haptics from firing too rapidly
  const throttledDetent = () => {
    const now = Date.now()
    if (now - lastDetentTime < DETENT_THROTTLE_MS) return
    lastDetentTime = now
    conditionalTrigger(50) // Strong 50ms pulse for scroll detents
  }

  return {
    // Detent bump for wheel scrolling (throttled to prevent rapid-fire)
    detent: throttledDetent,
    
    // Light tap for value increment/decrement
    light: () => conditionalTrigger(20), // Increased from 15ms to 20ms
    
    // Selection confirmation (currently unused - haptics only during scroll)
    selection: () => conditionalTrigger(20),
    
    // Success feedback
    success: () => conditionalTrigger('success'),
    
    // Error feedback
    error: () => conditionalTrigger('error'),
    
    // Double tap for root note selection (shorter for less intensity)
    doubleTap: () => conditionalTrigger([50, 40, 50]), // Pattern: on-off-on (shorter duration)
    
    // State management
    isSupported: computed(() => isSupported),
    enabled: computed({
      get: () => hapticsEnabled.value,
      set: (value: boolean) => {
        hapticsEnabled.value = value
        // Persist to localStorage
        try {
          localStorage.setItem('kb1-haptics-enabled', JSON.stringify(value))
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    }),
    
    // Initialize from localStorage
    init: () => {
      try {
        const stored = localStorage.getItem('kb1-haptics-enabled')
        if (stored !== null) {
          hapticsEnabled.value = JSON.parse(stored)
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }
}
