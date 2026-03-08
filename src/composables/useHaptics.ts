import { ref, computed } from 'vue'
import { useWebHaptics } from 'web-haptics/vue'

// Global state for haptics preference (default OFF for live app)
const hapticsEnabled = ref(false)
let initialized = false

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
  
  const { trigger, isSupported } = useWebHaptics({
    debug: false, // Set to true for desktop audio feedback testing
  })

  // Check if haptics should be triggered
  const shouldTrigger = computed(() => hapticsEnabled.value && isSupported)

  // Helper function to conditionally trigger haptics (no time throttling for scroll detents)
  const conditionalTrigger = (pattern: any) => {
    if (!shouldTrigger.value) return
    
    try {
      trigger(pattern)
    } catch (error) {
      console.error('[Haptics] Error:', error)
    }
  }

  return {
    // Detent bump for wheel scrolling (fires on each item during scroll)
    detent: () => conditionalTrigger(10), // Simple 10ms vibration for iOS compatibility
    
    // Light tap for value increment/decrement
    light: () => conditionalTrigger(15),
    
    // Selection confirmation (currently unused - haptics only during scroll)
    selection: () => conditionalTrigger(20),
    
    // Success feedback
    success: () => conditionalTrigger('success'),
    
    // Error feedback
    error: () => conditionalTrigger('error'),
    
    // Double tap for root note selection
    doubleTap: () => conditionalTrigger([100, 50, 100]), // Pattern: on-off-on for iOS compatibility
    
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
