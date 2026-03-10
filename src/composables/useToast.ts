import { ref } from 'vue';
import { useHaptics } from './useHaptics';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  const haptics = useHaptics();

  function show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 3000
  ) {
    const id = nextId++;
    const toast: Toast = { id, message, type, duration };
    toasts.value.push(toast);
  }

  function success(message: string, duration = 3000) {
    haptics.success();
    show(message, 'success', duration);
  }

  function error(message: string, duration = 4000) {
    haptics.error();
    show(message, 'error', duration);
  }

  function warning(message: string, duration = 3500) {
    show(message, 'warning', duration);
  }

  function info(message: string, duration = 3000) {
    show(message, 'info', duration);
  }

  function remove(id: number) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove
  };
}
