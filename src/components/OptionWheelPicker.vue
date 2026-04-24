<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="isOpen" class="sheet-backdrop" @click="handleBackdropClick">
        <!-- ==================== NEW: BOTTOM SHEET CONTAINER ==================== -->
        <div class="sheet-container" @click.stop :style="{ height: sheetHeight }">
          
          <!-- Header: Title (clickable to close) -->
          <div class="sheet-header" @click="close">
            <span class="sheet-title">{{ title }}</span>
          </div>

          <!-- Content Area: Arrows + Scrollable List -->
          <div class="sheet-content" :style="{ height: contentHeight }">
            
            <!-- ==================== NEW: NAVIGATION ARROWS ==================== -->
            <div class="arrow-controls">
              <button 
                class="arrow-btn arrow-up" 
                :disabled="!canScrollUp"
                @click="scrollUp"
              >
                ↑
              </button>
              <button 
                class="arrow-btn arrow-down" 
                :disabled="!canScrollDown"
                @click="scrollDown"
              >
                ↓
              </button>
            </div>

            <!-- ==================== NEW: CENTER INDICATOR BAR ==================== -->
            <div class="center-indicator"></div>

            <!-- Scrollable List -->
            <div 
              ref="scrollContainer"
              class="sheet-scroll"
              @scroll="handleScroll"
            >
              <div class="scroll-spacer"></div>
              <div
                v-for="(option, index) in selectableOptions"
                :key="option.value"
                class="sheet-item"
                :class="{ 
                  'selected': option.value === modelValue,
                  'divider-item': option.isDivider 
                }"
                :data-index="index"
                :style="getItemStyle(index)"
                @click="!option.isDivider && selectItem(index)"
              >
                <span v-if="option.isDivider" class="divider-line">{{ option.label }}</span>
                <template v-else>
                  <span class="item-main">{{ parseLabel(option.label).main }}</span>
                  <span v-if="parseLabel(option.label).secondary" class="item-secondary">{{ parseLabel(option.label).secondary }}</span>
                </template>
              </div>
              <div class="scroll-spacer"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue';
import { useHaptics } from '../composables/useHaptics';

interface WheelOption {
  label: string;
  value: string | number;
  isDivider?: boolean;
}

const props = withDefaults(defineProps<{
  modelValue: string | number;
  options: WheelOption[];
  isOpen: boolean;
  title?: string;
  triggerEl?: HTMLElement | null; // Kept for compatibility, not used in bottom sheet
}>(), {
  title: 'SELECT OPTION', // ADJUST: Default header title (uppercase for consistency)
  triggerEl: undefined
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'update:isOpen', value: boolean): void;
}>();

// ==================== VISUAL PARAMETERS (ADJUST THESE) ====================
const ITEM_HEIGHT = 44;           // Height of each list item in pixels
const MIN_VISIBLE_ITEMS = 3;      // Minimum items to show (for short lists)
const MAX_VISIBLE_ITEMS = 5;      // Maximum items to show (before scrolling)
const HEADER_HEIGHT = 52;         // Header height in pixels
const OPACITY_CENTER = 1.0;       // Opacity of centered/selected item
const OPACITY_ADJACENT = 0.55;    // Opacity of items ±1 from center (increased from 0.35)
const OPACITY_FAR = 0.25;         // Opacity of items ±2+ from center (increased from 0.15)
// ==========================================================================

const scrollContainer = ref<HTMLElement | null>(null);
const currentCenterIndex = ref(0);
const lastHapticIndex = ref(-1);
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

const { detent, isSupported } = useHaptics();

// ==================== NEW: FILTER OUT DIVIDERS FOR NAVIGATION ====================
// Only selectable items (no dividers) for arrow navigation
const selectableOptions = computed(() => props.options.filter(opt => !opt.isDivider));

// ==================== NEW: DYNAMIC HEIGHT CALCULATION ====================
// Adjust sheet height based on number of items
const visibleItemCount = computed(() => {
  const itemCount = selectableOptions.value.length;
  return Math.min(Math.max(itemCount, MIN_VISIBLE_ITEMS), MAX_VISIBLE_ITEMS);
});

const sheetHeight = computed(() => {
  const contentHeight = visibleItemCount.value * ITEM_HEIGHT;
  const totalHeight = HEADER_HEIGHT + contentHeight;
  return `${totalHeight}px`;
});

// Content area height (for center indicator positioning)
const contentHeight = computed(() => {
  return `${visibleItemCount.value * ITEM_HEIGHT}px`;
});

// ==================== NEW: ARROW BUTTON STATE ====================
// Only show arrows if there are more items than visible (scrolling is possible)
const needsScrolling = computed(() => selectableOptions.value.length > visibleItemCount.value);
const canScrollUp = computed(() => needsScrolling.value && currentCenterIndex.value > 0);
const canScrollDown = computed(() => needsScrolling.value && currentCenterIndex.value < selectableOptions.value.length - 1);

// ==================== NEW: OPACITY CALCULATION FOR ITEMS ====================
// Returns inline style with opacity based on distance from center
function getItemStyle(index: number) {
  const distance = Math.abs(index - currentCenterIndex.value);
  let opacity = OPACITY_CENTER;
  
  if (distance === 1) {
    opacity = OPACITY_ADJACENT;
  } else if (distance >= 2) {
    opacity = OPACITY_FAR;
  }
  
  return { opacity: opacity.toString() };
}

// Initialize scroll position when opened
watch(() => props.isOpen, async (open) => {
  if (open) {
    await nextTick();
    let initialIndex = selectableOptions.value.findIndex(opt => opt.value === props.modelValue);
    if (initialIndex === -1) initialIndex = 0;
    
    currentCenterIndex.value = initialIndex;
    
    // Small delay to ensure DOM is fully rendered before scrolling
    setTimeout(() => {
      scrollToIndex(initialIndex, false);
    }, 50);
  }
});

// ==================== NEW: ARROW NAVIGATION ====================
function scrollUp() {
  if (canScrollUp.value) {
    const newIndex = currentCenterIndex.value - 1;
    scrollToIndex(newIndex, true);
    if (isSupported.value) detent(); // Haptic feedback
  }
}

function scrollDown() {
  if (canScrollDown.value) {
    const newIndex = currentCenterIndex.value + 1;
    scrollToIndex(newIndex, true);
    if (isSupported.value) detent(); // Haptic feedback
  }
}

function scrollToIndex(index: number, smooth = true) {
  if (!scrollContainer.value) return;
  
  const targetScroll = index * ITEM_HEIGHT;
  scrollContainer.value.scrollTo({
    top: targetScroll,
    behavior: smooth ? 'smooth' : 'auto'
  });
  
  currentCenterIndex.value = index;
}

function selectItem(index: number) {
  const selectedOption = selectableOptions.value[index];
  if (selectedOption) {
    scrollToIndex(index, true);
    
    // Emit immediately and close
    setTimeout(() => {
      emit('update:modelValue', selectedOption.value);
      close();
    }, 100);
  }
}

function handleScroll() {
  if (!scrollContainer.value) return;
  
  const scrollTop = scrollContainer.value.scrollTop;
  const newCenterIndex = Math.round(scrollTop / ITEM_HEIGHT);
  
  // Update center index and trigger haptic if changed
  if (newCenterIndex !== currentCenterIndex.value) {
    currentCenterIndex.value = newCenterIndex;
    
    if (isSupported.value && newCenterIndex !== lastHapticIndex.value) {
      detent();
      lastHapticIndex.value = newCenterIndex;
    }
  }
  
  // Clear existing timeout
  if (scrollTimeout) clearTimeout(scrollTimeout);
  
  // Set new timeout to snap and commit selection
  scrollTimeout = setTimeout(() => {
    snapToNearest();
  }, 150);
}

function snapToNearest() {
  if (!scrollContainer.value) return;
  
  const scrollTop = scrollContainer.value.scrollTop;
  const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
  const clampedIndex = Math.max(0, Math.min(nearestIndex, selectableOptions.value.length - 1));
  
  scrollToIndex(clampedIndex, true);
  
  // Emit selection after snap
  setTimeout(() => {
    const selectedOption = selectableOptions.value[clampedIndex];
    if (selectedOption) {
      emit('update:modelValue', selectedOption.value);
    }
  }, 100);
}

function handleBackdropClick() {
  close();
}

function close() {
  emit('update:isOpen', false);
}

function parseLabel(label: string): { main: string; secondary: string } {
  const parts = label.split('—').map(p => p.trim());
  if (parts.length > 1) {
    return { main: parts[0] || '', secondary: parts.slice(1).join(' — ') };
  }
  return { main: label, secondary: '' };
}

onBeforeUnmount(() => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
});
</script>

<style scoped>
/* ==================== BACKDROP ==================== */
.sheet-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 15, 15, 0.8); /* ADJUST: Backdrop darkness */
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

/* ==================== BOTTOM SHEET CONTAINER ==================== */
.sheet-container {
  width: 100%;
  background: rgb(19, 19, 18); /* ADJUST: Backdrop tint */
  /* ADJUST: Sheet background color */
  border-radius: 10px 10px 0 0; /* Rounded top corners only */
  overflow: hidden;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

/* ==================== HEADER ==================== */
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1.25rem;
  border-bottom: 1px solid rgba(159, 156, 128, 0.2); /* ADJUST: Border color/opacity */
  background: rgba(33, 33, 29, 0.4); /* ADJUST: Header background tint */
  cursor: pointer; /* Clickable to close sheet */
  transition: background 0.15s ease;
}

.sheet-header:hover {
  background: rgba(33, 33, 29, 0.85); /* ADJUST: Header hover state */
}

.sheet-title {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px - standard label size */
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #909090; /* ADJUST: Title color */
}

/* ==================== CONTENT AREA ==================== */
.sheet-content {
  position: relative;
  overflow: hidden;
}

/* ==================== NAVIGATION ARROWS ==================== */
.arrow-controls {
  position: absolute;
  left: 0.75rem; /* ADJUST: Arrow distance from left edge */
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
  z-index: 10;
  pointer-events: none;
}

.arrow-btn {
  width: 32px; /* ADJUST: Arrow button size */
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(52, 52, 52, 0); /* ADJUST: Arrow background */
  border: 1px solid rgba(255, 255, 255, 0.0);
  border-radius: 6px;
  color: rgba(240, 240, 240, 0.5); /* ADJUST: Arrow color */
  font-size: 1.25rem;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.15s ease;
  user-select: none;
}

.arrow-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8); /* ADJUST: Arrow hover color */
  border-color: rgba(184, 184, 184, 0.1);
}

.arrow-btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

.arrow-btn:disabled {
  opacity: 0.3; /* ADJUST: Disabled arrow opacity */
  cursor: not-allowed;
}

/* ==================== CENTER INDICATOR ==================== */
.center-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 44px;
  transform: translateY(-50%);
  background: rgba(33, 33, 29, 0.5); /* ADJUST: Center highlight background (increased from 0.08) */
  border-top: 1px solid rgba(33, 33, 29, 0.7); /* ADJUST: Center borders (increased from 0.25) */
  border-bottom: 1px solid rgba(33, 33, 29, 0.7);
  pointer-events: none;
  z-index: 0; /* ADJUST: Below text items so opacity is visible */
}

/* ==================== SCROLLABLE LIST ==================== */
.sheet-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* scroll-snap-type: y mandatory; */ /* DISABLED: Interferes with programmatic scrolling */
}

.sheet-scroll::-webkit-scrollbar {
  display: none;
}

.scroll-spacer {
  /* ADJUST: Spacer height to center first/last item */
  /* Formula: (visibleItemCount * ITEM_HEIGHT - ITEM_HEIGHT) / 2 */
  /* For 5 items @ 44px: (220px - 44px) / 2 = 88px */
  height: calc(50% - 22px); /* 50% of container minus half an item */
  flex-shrink: 0;
}

/* ==================== LIST ITEMS ==================== */
.sheet-item {
  position: relative; /* For z-index stacking */
  height: 44px; /* ADJUST: Item height (must match ITEM_HEIGHT constant) */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 2.3rem; /* ADJUST: Item right padding */
  font-family: 'Roboto Mono', monospace;
  font-size: 0.8125rem; /* ADJUST: Item font size */
  color: #EAEAEA; /* ADJUST: Item text color */
  cursor: pointer;
  transition: opacity 0.15s ease; /* Only opacity transitions - NO transforms */
  user-select: none;
  gap: 0.5rem;
  white-space: nowrap;
  z-index: 1; /* ADJUST: Above center indicator so opacity effect is visible */
  /* scroll-snap-align: center; */ /* DISABLED: Using manual scroll control */
}

.sheet-item:active {
  background: rgba(33, 33, 29, 0.1); /* ADJUST: Item tap feedback */
}

/* Divider items (non-selectable headers) */
.divider-item {
  cursor: default;
  pointer-events: none;
  opacity: 0.3 !important; /* ADJUST: Divider opacity */
}

.divider-line {
  font-weight: 300;
  letter-spacing: 0.2em;
  font-size: 0.75rem; /* ADJUST: Divider font size */
}

/* Main and secondary label parts (split by —) */
.item-main {
  font-weight: 500; /* ADJUST: Main label weight */
}

.item-secondary {
  opacity: 0.5; /* ADJUST: Secondary label opacity */
  font-size: 0.875rem; /* ADJUST: Secondary label font size */
}

/* ==================== ANIMATIONS ==================== */
.sheet-fade-enter-active {
  transition: opacity 0.25s ease;
}

.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

/* Sheet slides up from bottom */
.sheet-fade-enter-active .sheet-container {
  animation: sheet-slide-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.sheet-fade-leave-active .sheet-container {
  animation: sheet-slide-down 0.25s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

@keyframes sheet-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes sheet-slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
