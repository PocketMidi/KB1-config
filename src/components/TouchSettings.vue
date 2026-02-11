<template>
  <div class="settings-touch">
    <div class="title">
      <h2>{{ title }}</h2>
      <div v-if="isValidCC" class="parameter-header">
        <div class="parameter-name">{{ parameterDisplayName }}</div>
        <div v-if="parameterRange" class="parameter-range">{{ parameterRange }}</div>
        <div class="cc-reference">MIDI CC {{ model.ccNumber }}</div>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="touch-ccNumber">Parameter</label>
        <select id="touch-ccNumber" v-model.number="model.ccNumber">
          <optgroup v-for="group in groupedOptions" :key="group.category" :label="group.category">
            <option v-for="opt in group.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </optgroup>
          <option v-if="ungroupedOptions.length > 0" v-for="opt in ungroupedOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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
        <input type="number" id="touch-maxCCValue" v-model.number="model.maxCCValue" min="0" max="127" />
      </div>

      <div class="group">
        <label for="touch-minCCValue">CC Min</label>
        <input type="number" id="touch-minCCValue" v-model.number="model.minCCValue" min="0" max="127" />
      </div>

      <div class="group">
        <label for="touch-relativeMin">Relative Min</label>
        <input type="text" id="touch-relativeMin" :value="relativeMin" readonly class="readonly-field" />
      </div>

      <div class="group">
        <label for="touch-relativeMax">Relative Max</label>
        <input type="text" id="touch-relativeMax" :value="relativeMax" readonly class="readonly-field" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { midiToRelative, type CCEntry } from '../data/ccMap'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 128)

// Group options by category
const groupedOptions = computed(() => {
  const groups = new Map<string, Array<{ value: number; label: string }>>()
  
  for (const opt of props.ccOptions) {
    if (opt.group) {
      if (!groups.has(opt.group)) {
        groups.set(opt.group, [])
      }
      groups.get(opt.group)!.push({ value: opt.value, label: opt.label })
    }
  }
  
  return Array.from(groups.entries()).map(([category, options]) => ({
    category,
    options
  }))
})

const ungroupedOptions = computed(() => {
  return props.ccOptions.filter(opt => !opt.group)
})

// Get current parameter entry from ccMapByNumber
const currentEntry = computed(() => {
  return props.ccMapByNumber.get(model.value.ccNumber)
})

// Display parameter name or fallback to CC number
const parameterDisplayName = computed(() => {
  const entry = currentEntry.value
  if (entry) {
    return entry.parameter
  }
  return `CC ${model.value.ccNumber}`
})

// Display Polyend range if available
const parameterRange = computed(() => {
  const entry = currentEntry.value
  if (entry?.range) {
    return entry.range.text
  }
  return undefined
})

// Compute relative min value
const relativeMin = computed(() => {
  const entry = currentEntry.value
  if (!entry?.range) {
    return '—'
  }
  const value = midiToRelative(
    model.value.minCCValue,
    entry.range.min,
    entry.range.max
  )
  return String(value)
})

// Compute relative max value
const relativeMax = computed(() => {
  const entry = currentEntry.value
  if (!entry?.range) {
    return '—'
  }
  const value = midiToRelative(
    model.value.maxCCValue,
    entry.range.min,
    entry.range.max
  )
  return String(value)
})
</script>

<style scoped>
.settings-touch {
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.parameter-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.parameter-name {
  font-weight: 600;
  color: var(--color-text);
}

.parameter-range {
  color: var(--color-text-muted);
  font-style: italic;
}

.cc-reference {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
}

.group input,
.group select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.group input:focus,
.group select:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>