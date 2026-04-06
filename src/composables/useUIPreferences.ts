import { ref, watch, computed } from 'vue'

export type UnipolarStepSize = 1 | 5
export type ThemeMode = 'auto' | 'dark' | 'light'

interface UIPreferences {
  unipolarStepSize: UnipolarStepSize
  batteryMonitoringEnabled: boolean
  themeMode: ThemeMode
}

const STORAGE_KEY = 'kb1-ui-preferences'
const LEGACY_THEME_KEY = 'kb1-theme-preference'

// Default preferences
const defaultPreferences: UIPreferences = {
  unipolarStepSize: 5,
  batteryMonitoringEnabled: false,
  themeMode: 'dark'
}

// Load from localStorage or use defaults
function loadPreferences(): UIPreferences {
  // Migrate legacy theme key for existing users
  let migratedTheme: ThemeMode = 'dark'
  try {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy === 'light') migratedTheme = 'light'
  } catch {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultPreferences,
        themeMode: migratedTheme, // migrate if not already saved
        ...parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load UI preferences:', error)
  }
  return { ...defaultPreferences, themeMode: migratedTheme }
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

  const batteryMonitoringEnabled = computed({
    get: () => preferences.value.batteryMonitoringEnabled,
    set: (value: boolean) => {
      preferences.value.batteryMonitoringEnabled = value
    }
  })

  const themeMode = computed({
    get: () => preferences.value.themeMode,
    set: (value: ThemeMode) => {
      preferences.value.themeMode = value
    }
  })

  return {
    preferences,
    unipolarStepSize,
    batteryMonitoringEnabled,
    themeMode,

    // Setters
    setUnipolarStepSize(size: UnipolarStepSize) {
      preferences.value.unipolarStepSize = size
    },

    setBatteryMonitoringEnabled(enabled: boolean) {
      preferences.value.batteryMonitoringEnabled = enabled
    },

    setThemeMode(mode: ThemeMode) {
      preferences.value.themeMode = mode
    },

    // Reset to defaults
    resetToDefaults() {
      preferences.value = { ...defaultPreferences }
    }
  }
}
