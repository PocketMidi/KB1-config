import { ref, watch, computed } from 'vue'

export type UnipolarStepSize = 1 | 5

interface UIPreferences {
  unipolarStepSize: UnipolarStepSize
}

const STORAGE_KEY = 'kb1-ui-preferences'

// Default preferences
const defaultPreferences: UIPreferences = {
  unipolarStepSize: 5
}

// Load from localStorage or use defaults
function loadPreferences(): UIPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultPreferences,
        ...parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load UI preferences:', error)
  }
  return { ...defaultPreferences }
}

// Save to localStorage
function savePreferences(prefs: UIPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.warn('Failed to save UI preferences:', error)
  }
}

// Reactive state
const preferences = ref<UIPreferences>(loadPreferences())

// Auto-save on changes
watch(preferences, (newPrefs) => {
  savePreferences(newPrefs)
}, { deep: true })

export function useUIPreferences() {
  const unipolarStepSize = computed({
    get: () => preferences.value.unipolarStepSize,
    set: (value: UnipolarStepSize) => {
      preferences.value.unipolarStepSize = value
    }
  })

  return {
    preferences,
    unipolarStepSize,
    
    // Setters
    setUnipolarStepSize(size: UnipolarStepSize) {
      preferences.value.unipolarStepSize = size
    },
    
    // Reset to defaults
    resetToDefaults() {
      preferences.value = { ...defaultPreferences }
    }
  }
}
