<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="`toast-${type}`">
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
});

const emit = defineEmits<{
  close: [];
}>();

const visible = ref(false);

onMounted(() => {
  visible.value = true;
  
  if (props.duration > 0) {
    setTimeout(() => {
      visible.value = false;
      setTimeout(() => emit('close'), 300);
    }, props.duration);
  }
});
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: var(--kb1-radius-lg);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-medium);
  font-family: var(--kb1-font-family);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  min-width: 240px;
  max-width: 400px;
  pointer-events: auto;
  color: #EAEAEA;
}

.toast-message {
  flex: 1;
  line-height: var(--kb1-line-height-compact);
}

.toast-success {
  background: var(--toast-success-bg);
  border: 1px solid var(--toast-success-border);
}

.toast-error {
  background: var(--toast-error-bg);
  border: 1px solid var(--toast-error-border);
}

.toast-warning {
  background: var(--toast-warning-bg);
  border: 1px solid var(--toast-warning-border);
}

.toast-info {
  background: var(--toast-info-bg);
  border: 1px solid var(--toast-info-border);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
