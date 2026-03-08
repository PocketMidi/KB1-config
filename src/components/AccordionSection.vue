<template>
  <div class="accordion-section" :class="{ 'is-open': isOpen }">
    <button 
      class="accordion-header" 
      @click="toggle"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${id}`"
    >
      <div class="accordion-content-wrapper">
        <div class="accordion-title-row">
          <h3 class="accordion-title-text">
            {{ title }}
            <span v-if="titleSuffix" class="title-suffix" :class="{ fading: titleSuffixFading }">{{ titleSuffix }}</span>
          </h3>
          <slot name="header-right">
            <div v-if="midiCc !== undefined" class="midi-cc-display">
              MIDI CC <span class="midi-cc-number">{{ midiCc }}</span>
            </div>
          </slot>
          <span class="accordion-icon">{{ isOpen ? '−' : '+' }}</span>
        </div>
        <div v-if="subtitle" class="accordion-subtitle">{{ subtitle }}</div>
      </div>
    </button>
    <div 
      :id="`accordion-content-${id}`"
      class="accordion-content"
      :class="{ 'is-open': isOpen }"
    >
      <div class="accordion-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
  midiCc?: number;
  id?: string;
  defaultOpen?: boolean;
  titleSuffix?: string;
  titleSuffixFading?: boolean;
}>();

const isOpen = ref(props.defaultOpen ?? false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

defineExpose({
  close,
  isOpen
});
</script>

<style scoped>
.accordion-section {
  background: var(--color-background-soft);
  border: none;
  border-radius: 8px;
  margin-bottom: 6px;
  overflow: visible;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.accordion-section:not(.is-open) {
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: block;
  padding: 0.25rem 1rem; /* 4px top/bottom, 16px left/right */
  background: rgba(106, 104, 83, 0.2); /* Warm brownish tone for dark mode */
  border: none;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  min-height: 44px; /* Mobile touch target */
  font-family: 'Roboto Mono';
  border-radius: 8px;
}

.accordion-section.is-open .accordion-header {
  background: rgba(106, 104, 83, 0.7); /* More visible when open */
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.accordion-header:hover {
  background: rgba(106, 104, 83, 0.6); /* More visible on hover */
}

.accordion-header:active {
  background: rgba(106, 104, 83, 0.8); /* Brightest when pressed */
}

.accordion-content-wrapper {
  width: 100%;
}

.accordion-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.accordion-title-text {
  margin: 0;
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  color: #848484;
  text-transform: uppercase;
  font-family: 'Roboto Mono';
  transition: color 0.2s;
  flex: 1;
  min-width: 0;
}

.accordion-header:hover .accordion-title-text {
  color: rgba(234, 234, 234, 0.8);
}

.title-suffix {
  color: var(--accent-highlight);
  margin-left: 0.5rem;
  font-weight: 500;
  text-transform: none;
  opacity: 1;
  transition: none;
}

.title-suffix.fading {
  opacity: 0;
  transition: opacity 2s ease-out;
}

.accordion-section.is-open .accordion-title-text {
  font-weight: 700;
  color: #EAEAEA;
}

.accordion-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
  line-height: 1.4;
  font-family: 'Roboto Mono';
  white-space: nowrap;
  overflow: visible;
  width: 100%;
}

.midi-cc-display {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  color: #848484;
  font-family: 'Roboto Mono';
  flex-shrink: 0;
  white-space: nowrap;
}

.midi-cc-number {
  color: var(--accent-highlight);
  font-weight: 600;
}

.accordion-icon {
  font-size: 0.8125rem; /* 13px */
  font-weight: 300;
  color: var(--color-text-muted);
  transition: transform 0.2s;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.accordion-section.is-open .accordion-icon {
  transform: rotate(0deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-content.is-open {
  max-height: 5000px;
  transition: max-height 0.3s ease-in;
  overflow: visible;
}

.accordion-body {
  padding: 0; /* Remove all padding to let child control its own */
}

@media (max-width: 768px) {
  .accordion-header {
    padding: 0.25rem 1rem;
  }
  
  .accordion-body {
    padding: 0; /* Remove all padding on mobile too */
  }
  
  .accordion-icon {
    margin-left: 0.5rem;
  }
}

/* ===== LIGHT MODE OVERRIDES ===== */
:global(html.theme-kb1-light .accordion-header) {
  background: rgba(180, 180, 188, 0.85) !important;
}

:global(html.theme-kb1-light .accordion-header:hover) {
  background: rgba(158, 159, 175, 0.95) !important;
}

:global(html.theme-kb1-light .accordion-header:active) {
  background: rgba(158, 159, 175, 1.0) !important;
}

:global(html.theme-kb1-light .accordion-section.is-open .accordion-header) {
  background: rgba(158, 159, 175, 1.0) !important;
}

:global(html.theme-kb1-light .accordion-title-text) {
  color: #2f2f2f !important;
}

:global(html.theme-kb1-light .accordion-header:hover .accordion-title-text) {
  color: #ffffff !important;
}

:global(html.theme-kb1-light .midi-cc-display) {
  color: #2f2f2f !important;
}
</style>
