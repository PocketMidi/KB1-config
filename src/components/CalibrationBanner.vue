<template>
  <Transition name="slide-down">
    <div v-if="isVisible" class="calibration-banner">
      <div class="banner-content">
        <div class="banner-text">
          <div class="banner-title">⚠️ Battery needs ONE continuous 5.5+ hour charge for calibration.</div>
          <div class="banner-description">
            Do not unplug during charge! If interrupted, timer resets. Partial charges do NOT accumulate.
          </div>
        </div>
        <button 
          class="banner-dismiss" 
          @click="dismiss"
          aria-label="Dismiss calibration notice"
        >
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'dismiss'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isVisible = ref(props.show);

function dismiss() {
  isVisible.value = false;
  emit('dismiss');
}

// Watch for prop changes
watch(() => props.show, (newValue) => {
  isVisible.value = newValue;
});
</script>

<script lang="ts">
import { watch } from 'vue';
export default {
  name: 'CalibrationBanner'
};
</script>

<style scoped>
.calibration-banner {
  position: fixed;
  top: 72px; /* Below header */
  left: 0;
  right: 0;
  z-index: 999;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(245, 158, 11, 0.95) 100%);
  border-bottom: 2px solid rgba(251, 191, 36, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-icon {
  font-size: 32px;
  line-height: 1;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.banner-description {
  font-size: 14px;
  color: #2d2d2d;
  line-height: 1.4;
}

.banner-dismiss {
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: #1a1a1a;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-dismiss:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.banner-dismiss:active {
  transform: scale(0.95);
}

/* Slide down animation */
.slide-down-enter-active {
  transition: all 0.3s ease-out;
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .calibration-banner {
    top: 64px; /* Adjust for mobile header height */
  }
  
  .banner-content {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .banner-icon {
    font-size: 28px;
  }
  
  .banner-title {
    font-size: 14px;
  }
  
  .banner-description {
    font-size: 13px;
  }
  
  .banner-dismiss {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .banner-icon {
    display: none; /* Hide icon on very small screens to save space */
  }
  
  .banner-description {
    font-size: 12px;
  }
}
</style>
