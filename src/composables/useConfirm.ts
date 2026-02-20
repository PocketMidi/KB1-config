import { ref } from 'vue';

export interface ConfirmDialog {
  id: number;
  message: string;
  position?: { x: number; y: number };
  resolve: (value: boolean) => void;
}

const dialogs = ref<ConfirmDialog[]>([]);
let nextId = 0;

// Track last mouse/touch position globally
let lastPointerPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Update position on any mouse/touch event
if (typeof window !== 'undefined') {
  window.addEventListener('mousedown', (e) => {
    lastPointerPosition = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      lastPointerPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });
}

export function useConfirm() {
  function confirm(message: string, position?: { x: number; y: number }): Promise<boolean> {
    return new Promise((resolve) => {
      const id = nextId++;
      const dialog: ConfirmDialog = {
        id,
        message,
        position: position || lastPointerPosition,
        resolve
      };
      dialogs.value.push(dialog);
    });
  }

  function remove(id: number, result: boolean) {
    const index = dialogs.value.findIndex(d => d.id === id);
    if (index !== -1) {
      const dialog = dialogs.value[index];
      dialog.resolve(result);
      dialogs.value.splice(index, 1);
    }
  }

  return {
    dialogs,
    confirm,
    remove
  };
}
