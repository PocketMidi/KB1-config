import { ref, computed } from 'vue'
import { useWebHaptics } from 'web-haptics/vue'

// Global state for haptics preference
const hapticsEnabled = ref(true)

export function useHaptics() {
  const { trigger, isSupported } = useWebHaptics({
    debug: false, // Set to true for desktop audio feedback testing
  })

  // Check if haptics should be triggered
  const shouldTrigger = computed(() => hapticsEnabled.value && isSupported)

  // Helper function to conditionally trigger haptics
  const conditionalTrigger = (pattern: any) => {
    if (shouldTrigger.value) {
      trigger(pattern)
    }
  }

  return {
    // Detent bump for wheel scrolling (very subtle, like physical detents)
    detent: () => conditionalTrigger({ duration: 8, intensity: 0.3 }),
    
    // Light tap for value increment/decrement
    light: () => conditionalTrigger({ duration: 15, intensity: 0.35 }),
    
    // Selection confirmation (slightly stronger)
    selection: () => conditionalTrigger({ duration: 20, intensity: 0.5 }),
    
    // Success feedback
    success: () => conditionalTrigger('success'),
    
    // Error feedback
    error: () => conditionalTrigger('error'),
    
    // Double tap for important selections (like root note)
    doubleTap: () => conditionalTrigger([
      { duration: 15, intensity: 0.4 },
      { delay: 30, duration: 15, intensity: 0.4 }
    ]),
    
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
