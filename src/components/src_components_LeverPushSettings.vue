<template>
  <div class="settings-leverpush" :class="`lever-${lever}`">
    <div class="title">
      <h2>{{ title }} {{ lever }}</h2>
      <div v-if="isValidCC">
        <span>MIDI CC</span>
        <span>{{ model.ccNumber }}</span>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label :for="`push-ccNumber-${lever}`">Parameter</label>
        <select :id="`push-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in ccOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`push-functionMode-${lever}`">Function Mode</label>
        <select :id="`push-functionMode-${lever}`" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`push-maxCCValue-${lever}`">CC Max</label>
        <input type="number" :id="`push-maxCCValue-${lever}`" v-model.number="model.maxCCValue" />
      </div>

      <div class="group">
        <label :for="`push-minCCValue-${lever}`">CC Min</label>
        <input type="number" :id="`push-minCCValue-${lever}`" v-model.number="model.minCCValue" />
      </div>

      <div class="group">
        <label :for="`push-onsetType-${lever}`">Attack Type</label>
        <select :id="`push-onsetType-${lever}`" v-model.number="model.onsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`push-onsetTime-${lever}`">Attack Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`push-onsetTime-${lever}`" v-model.number="model.onsetTime" />
          <span>ms</span>
        </div>
      </div>

      <div class="group">
        <label :for="`push-offsetType-${lever}`">Decay Type</label>
        <select :id="`push-offsetType-${lever}`" v-model.number="model.offsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`push-offsetTime-${lever}`">Decay Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`push-offsetTime-${lever}`" v-model.number="model.offsetTime" />
          <span>ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type LeverPushModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverPushModel
  ccOptions: { value: number, label: string }[]
  functionModes: { value: number, label: string }[]
  interpolations: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverPushModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 127)
</script>