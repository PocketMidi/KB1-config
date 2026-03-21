import { ref } from 'vue'

// Shared state for battery modal visibility
const showBatteryModal = ref(false)

export function useBatteryModal() {
  function openBatteryModal() {
    showBatteryModal.value = true
  }

  function closeBatteryModal() {
    showBatteryModal.value = false
  }

  return {
    showBatteryModal,
    openBatteryModal,
    closeBatteryModal
  }
}
