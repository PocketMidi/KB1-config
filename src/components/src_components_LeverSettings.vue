<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <div class="title">
      <h2>{{ title }} {{ lever }}</h2>
      <div v-if="isValidCC">
        <span>MIDI CC</span>
        <span>{{ model.ccNumber }}</span>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label :for="`lever-ccNumber-${lever}`">Parameter</label>
        <select :id="`lever-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in ccOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-functionMode-${lever}`">Function Mode</label>
        <select :id="`lever-functionMode-${lever}`" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-valueMode-${lever}`">Value Mode</label>
        <select :id="`lever-valueMode-${lever}`" v-model.number="model.valueMode">
          <option v-for="opt in valueModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-stepSize-${lever}`">Steps</label>
        <input type="number" :id="`lever-stepSize-${lever}`" v-model.number="model.stepSize" />
      </div>

      <div class="group">
        <label :for="`lever-maxCCValue-${lever}`">CC Max</label>
        <input type="number" :id="`lever-maxCCValue-${lever}`" v-model.number="model.maxCCValue" />
      </div>

      <div class="group">
        <label :for="`lever-minCCValue-${lever}`">CC Min</label>
        <input type="number" :id="`lever-minCCValue-${lever}`" v-model.number="model.minCCValue" />
      </div>

      <div class="group">
        <label :for="`lever-onsetType-${lever}`">Attack Type</label>
        <select :id="`lever-onsetType-${lever}`" v-model.number="model.onsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-onsetTime-${lever}`">Attack Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`lever-onsetTime-${lever}`" v-model.number="model.onsetTime" />
          <span>ms</span>
        </div>
      </div>

      <div class="group">
        <label :for="`lever-offsetType-${lever}`">Decay Type</label>
        <select :id="`lever-offsetType-${lever}`" v-model.number="model.offsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-offsetTime-${lever}`">Decay Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`lever-offsetTime-${lever}`" v-model.number="model.offsetTime" />
          <span>ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type LeverModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  stepSize: number
  functionMode: number
  valueMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverModel
  ccOptions: { value: number, label: string }[]
  functionModes: { value: number, label: string }[]
  valueModes: { value: number, label: string }[]
  interpolations: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 127)
</script>