import { ref } from 'vue'

// Shared state for user manual visibility
const showManual = ref(false)

export function useManual() {
  function openManual() {
    showManual.value = true
  }

  function closeManual() {
    showManual.value = false
  }

  return {
    showManual,
    openManual,
    closeManual,
  }
}
