<template>
  <div class="animated-ble-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <Vue3Lottie
      :animationData="animationData"
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
  size: 150,
  alt: 'Bluetooth',
});

const animationData = ref<any>(null);

// Load Lottie animation data
onMounted(async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}ble_2/data.json`);
  animationData.value = await response.json();
});
</script>

<style scoped>
.animated-ble-icon {
  display: inline-block;
  position: relative;
}
</style>
