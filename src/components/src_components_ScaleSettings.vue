<template>
  <div class="settings-scale">
    <div class="title">
      <h2>{{ title }}</h2>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="scale-scaletype">Scale</label>
        <select id="scale-scaletype" v-model.number="model.scaleType">
          <option v-for="opt in scales" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="scale-rootnote">Root Note</label>
        <select id="scale-rootnote" v-model.number="model.rootNote">
          <option v-for="opt in rootNotes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ScaleModel = {
  scaleType: number
  rootNote: number
}

const props = defineProps<{
  title?: string
  modelValue: ScaleModel
  scales: { value: number, label: string }[]
  rootNotes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ScaleModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
</script>