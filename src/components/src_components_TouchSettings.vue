<template>
  <div class="settings-touch">
    <div class="title">
      <h2>{{ title }}</h2>
      <div v-if="isValidCC">
        <span>MIDI CC</span>
        <span>{{ model.ccNumber }}</span>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="touch-ccNumber">Parameter</label>
        <select id="touch-ccNumber" v-model.number="model.ccNumber">
          <option v-for="opt in ccOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="touch-functionMode">Function Mode</label>
        <select id="touch-functionMode" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="touch-maxCCValue">CC Max</label>
        <input type="number" id="touch-maxCCValue" v-model.number="model.maxCCValue" />
      </div>

      <div class="group">
        <label for="touch-minCCValue">CC Min</label>
        <input type="number" id="touch-minCCValue" v-model.number="model.minCCValue" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: { value: number, label: string }[]
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 127)
</script>