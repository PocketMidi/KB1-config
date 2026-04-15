<template>
  <div class="custom-dropdown" ref="dropdownRef" :style="{ minWidth: minWidth }" :class="{ disabled: disabled }">
    <div class="dropdown-selected" @click="toggleOpen">
      <template v-if="selectedOption?.cc">
        <span class="cc-text">CC</span>
        <span class="cc-num">{{ selectedOption.cc }}</span>
      </template>
      <span class="cc-desc">{{ selectedOption?.description || '' }}</span>
      <span class="dropdown-arrow">▼</span>
    </div>
    <div v-if="isOpen" class="dropdown-options">
      <div 
        v-for="option in options" 
        :key="option.cc"
        class="dropdown-option"
        :class="{ selected: option.cc === modelValue }"
        @click="selectOption(option)"
      >
        <template v-if="option.label.startsWith('CC')">
          <span class="cc-text">CC</span>
          <span class="cc-num">{{ option.label.match(/CC(\d+)/)?.[1] }}</span>
          <span class="cc-desc">{{ option.label.replace(/CC\d+\s*/, '') }}</span>
        </template>
        <template v-else>
          <span class="cc-desc">{{ option.label }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface CCOption {
  cc: number;
  label: string;
}

interface Props {
  modelValue: number;
  options: CCOption[];
  minWidth?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: '130px',
  disabled: false
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => {
  const option = props.options.find(opt => opt.cc === props.modelValue);
  if (option) {
    // Check if it's a CC option (starts with "CC") or FX param (no CC prefix)
    const ccMatch = option.label.match(/CC(\d+)\s+(.*)/);
    if (ccMatch) {
      // CC option: "CC51 FX Slot 1"
      return {
        cc: parseInt(ccMatch[1]),
        description: ccMatch[2]
      };
    } else {
      // FX param: just the name (e.g., "Volume", "Panning")
      return {
        cc: null,
        description: option.label
      };
    }
  }
  return null;
});

const toggleOpen = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (option: CCOption) => {
  // For CC options, extract the number; for FX params, use the cc value directly
  const ccMatch = option.label.match(/CC(\d+)/);
  if (ccMatch) {
    emit('update:modelValue', parseInt(ccMatch[1]));
  } else {
    emit('update:modelValue', option.cc);
  }
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-dropdown {
  position: relative;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.7rem;
}

.custom-dropdown.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.custom-dropdown.disabled .dropdown-selected {
  cursor: not-allowed;
}

.dropdown-selected {
  padding: 0.15rem 0.3rem;
  background: rgba(106, 104, 83, 0.35);
  border: 1px solid rgba(106, 104, 83, 0.4);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  white-space: nowrap;
}

.dropdown-selected:hover {
  background: rgba(106, 104, 83, 0.5);
  border-color: rgba(106, 104, 83, 0.6);
}

.dropdown-arrow {
  color: #848484;
  font-size: 0.6rem;
  margin-left: 0.2rem;
}

.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  background: #1a1a1a;
  border: 1px solid rgba(106, 104, 83, 0.6);
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.dropdown-option {
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  gap: 0.2rem;
  white-space: nowrap;
}

.dropdown-option:hover {
  background: rgba(106, 104, 83, 0.3);
}

.dropdown-option.selected {
  background: rgba(106, 104, 83, 0.5);
}

.cc-text {
  color: #848484;
  font-weight: 400;
}

.cc-num {
  color: #b9aa5f;
  font-weight: 600;
  margin-left: 0px;
}

.cc-desc {
  color: #EAEAEA;
  font-weight: 400;
}
</style>
