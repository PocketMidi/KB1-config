<template>
  <div class="animated-ble-icon">
    <Vue3Lottie
      v-if="bleAnimation"
      :animationData="bleAnimation"
      :height="size"
      :width="size"
      :loop="true"
      :autoPlay="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Vue3Lottie } from 'vue3-lottie';

interface Props {
  size?: number;
  alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 90,
  alt: 'Bluetooth icon'
});

const bleAnimation = ref<any>(null);

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}ble_connect.json`);
    if (response.ok) {
      bleAnimation.value = await response.json();
    } else {
      console.error('Failed to load ble_connect.json:', response.status);
    }
  } catch (error) {
    console.error('Failed to load BLE animation:', error);
  }
});
</script>

<style scoped>
.animated-ble-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
