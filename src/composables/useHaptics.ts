import { ref, computed } from 'vue'
import { useWebHaptics } from 'web-haptics/vue'

// Global state for haptics preference (default OFF for live app)
const hapticsEnabled = ref(false)
let initialized = false
let lastHapticTime = 0
const HAPTIC_THROTTLE_MS = 50 // Minimum time between haptics

// Auto-initialize from localStorage on first import
function autoInit() {
  if (initialized) return
  initialized = true
  
  try {
    const stored = localStorage.getItem('kb1-haptics-enabled')
    if (stored !== null) {
      hapticsEnabled.value = JSON.parse(stored)
      console.log('[Haptics] Loaded from localStorage:', hapticsEnabled.value)
    } else {
      console.log('[Haptics] No stored preference, defaulting to:', hapticsEnabled.value)
    }
  } catch (e) {
    console.warn('[Haptics] Failed to load from localStorage:', e)
  }
}

export function useHaptics() {
  autoInit() // Initialize on first use
  
  const { trigger, isSupported } = useWebHaptics({
    debug: false, // Set to true for desktop audio feedback testing
  })

  console.log('[Haptics] isSupported:', isSupported, 'enabled:', hapticsEnabled.value)

  // Check if haptics should be triggered
  const shouldTrigger = computed(() => hapticsEnabled.value && isSupported)

  // Helper function to conditionally trigger haptics with throttling
  const conditionalTrigger = (pattern: any, allowThrottle = true) => {
    if (!shouldTrigger.value) {
      console.log('[Haptics] Skipped - enabled:', hapticsEnabled.value, 'supported:', isSupported)
      return
    }
    
    // Throttle rapid-fire haptics
    const now = Date.now()
    if (allowThrottle && (now - lastHapticTime) < HAPTIC_THROTTLE_MS) {
      console.log('[Haptics] Throttled')
      return
    }
    
    lastHapticTime = now
    console.log('[Haptics] Triggering:', pattern)
    try {
      trigger(pattern)
    } catch (error) {
      console.error('[Haptics] Failed to trigger:', error)
    }
  }

  return {
    // Detent bump for wheel scrolling - throttled to prevent overload
    detent: () => conditionalTrigger('selection', true),
    
    // Light tap for value increment/decrement - throttled
    light: () => conditionalTrigger('selection', true),
    
    // Selection confirmation - not throttled for immediate response
    selection: () => conditionalTrigger('success', false),
    
    // Success feedback - not throttled
    success: () => conditionalTrigger('success', false),
    
    // Error feedback - not throttled
    error: () => conditionalTrigger('error', false),
    
    // Double tap for important selections - not throttled
    doubleTap: () => conditionalTrigger([
      { duration: 15, intensity: 0.4 },
      { delay: 30, duration: 15, intensity: 0.4 }
    ], false),
    
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
