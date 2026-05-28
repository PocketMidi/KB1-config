<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="isOpen" class="manual-backdrop" @click="close">
        <div
          class="manual-sheet"
          @click.stop
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- Drag handle -->
          <div class="drag-handle-bar"></div>

          <!-- Header -->
          <div class="manual-header" @click="close">
            <span class="manual-title">REFERENCE GUIDE</span>
            <button class="close-btn" @click.stop="close">×</button>
          </div>

          <!-- Section toggle (tab style) -->
          <div class="section-tabs">
            <button
              class="section-tab"
              :class="{ active: activeSection === 'settings' }"
              @click="setSection('settings')"
            >SETTINGS</button>
            <button
              class="section-tab"
              :class="{ active: activeSection === 'sliders' }"
              @click="setSection('sliders')"
            >SLIDERS</button>
          </div>

          <!-- Step content (title with flanking arrow-count indicators) -->
          <div class="content-area">
            <Transition :name="slideTransition" mode="out-in">
              <div :key="stepKey" class="step-card">
                <div class="step-nav-row">
                  <div class="nav-arrows-left">
                    <button
                      v-for="n in currentStepIndex"
                      :key="n"
                      class="nav-arrow-indicator"
                      @click="goToStep(n - 1)"
                      :aria-label="`Go to page ${n}`"
                    >
                      <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.83333 0H10L5 9L10 18H5.83333L0 9L5.83333 0Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                  <h2 class="step-title">{{ currentStep.title }}</h2>
                  <div class="nav-arrows-right">
                    <button
                      v-for="n in (currentSteps.length - 1 - currentStepIndex)"
                      :key="n"
                      class="nav-arrow-indicator"
                      @click="goToStep(currentStepIndex + n)"
                      :aria-label="`Go to page ${currentStepIndex + n + 1}`"
                    >
                      <svg width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.16667 0H0L5 9L0 18H4.16667L10 9L4.16667 0Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="step-body">
                  <p v-for="(para, i) in currentStep.paragraphs" :key="i">{{ para }}</p>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Dots footer -->
          <div class="step-dots-footer">
            <span
              v-for="(_, i) in currentSteps"
              :key="i"
              class="dot"
              :class="{ active: i === currentStepIndex }"
              @click="goToStep(i)"
            ></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

// ── Content ──────────────────────────────────────────────────────────────────

type Section = 'settings' | 'sliders'

const steps: Record<Section, { title: string; paragraphs: string[] }[]> = {
  settings: [
    {
      title: 'Bluetooth',
      paragraphs: [
        'To enable Bluetooth, squeeze both levers together and hold for 3 seconds.',
        'LEDs will pulse with increasing speed. When pulsing stops, Bluetooth is active. Release.',
        'Repeat the same gesture to disable Bluetooth.',
      ],
    },
    {
      title: 'Connect',
      paragraphs: [
        'Tap Bluetooth status icon upper left. Select KB1 from the browser pairing dialog.',
        'Once connected, SETTINGS load automatically from the device and populated KEYBOARD, LEVER, PRESS and TOUCH values.',
        'When disconnected, controls are visible but grayed out. Tap any control to see a prompt to connect.',
      ],
    },
    {
      title: 'Send',
      paragraphs: [
        'Change any SETTINGS: KEYBOARD, LEVER, PRESS or TOUCH values.',
        ' When ready, tap bouncing amber arrow at upper-right to send all changes to KB1.',
        'Changes are applied to device RAM immediately.',
      ],
    },
    {
      title: 'Presets',
      paragraphs: [
        'The first 4 of 8 slots are filled with STARTER presets that can be overwritten.',
        '"Apply" button loads preset into the app and arms the bouncing amber send arrow.',
        'Tap any slot to save a current snapshot and give it a name.', 
        '"NVS" button syncs the slot to the matching slot on KB1 — these persist on the hardware independently of the app.',
        '"Cloud" button links to a community space to browse and load presets uploaded by other KB1 users.',
         '"Load Defaults" restores factory default settings.',
    ],
    },
  ],
  sliders: [
    {
      title: 'Modes',
      paragraphs: [
        'FX mode controls 12 performance effects (CC 51–62).',
        ' MIX mode controls master mix levels (4 global mixer controls & volume for 8 tracks).',
        ' COMBO mode allows assignment of any CC to any slider.',
        'Mode selection persists in browser cache.',
      ],
    },
    {
      title: 'Setup',
      paragraphs: [
        'Color swatches are editable.',
        'link icons gang controls (tap, drag for multiple).',
        'Toggle UNI/BI for unipolar or bipolar range. ',
        'Toggle MOM/LAT for spring-back or hold behavior.',

      ],
    },
    {
      title: 'Live',
      paragraphs: [
        'Press "GO LIVE" button and rotate mobile screen to enter fullscreen mode for performance use.',
        'To exit: swipe horizontally across the screen (more than ~100px), then rotate back to portrait.',
        'On desktop, "GO LIVE" does not enter full screen mode.',
      ],
    },
  ],
}

// ── State ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kb1-manual-state'

const activeSection = ref<Section>('settings')
const stepIndices = ref<Record<Section, number>>({ settings: 0, sliders: 0 })
const slideDirection = ref<'forward' | 'backward'>('forward')

const currentSteps = computed(() => steps[activeSection.value])
const currentStepIndex = computed(() => stepIndices.value[activeSection.value])
const currentStep = computed(() => currentSteps.value[currentStepIndex.value] ?? currentSteps.value[0])
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === currentSteps.value.length - 1)
const stepKey = computed(() => `${activeSection.value}-${currentStepIndex.value}`)
const slideTransition = computed(() => `slide-${slideDirection.value}`)

// ── Persistence ───────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const state = JSON.parse(raw)
    if (state.section === 'settings' || state.section === 'sliders') {
      activeSection.value = state.section
    }
    if (typeof state.settingsStep === 'number') {
      stepIndices.value.settings = Math.min(state.settingsStep, steps.settings.length - 1)
    }
    if (typeof state.slidersStep === 'number') {
      stepIndices.value.sliders = Math.min(state.slidersStep, steps.sliders.length - 1)
    }
  } catch { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      section: activeSection.value,
      settingsStep: stepIndices.value.settings,
      slidersStep: stepIndices.value.sliders,
    }))
  } catch { /* ignore */ }
}

onMounted(loadState)

// Reload state each time sheet opens (picks up any changes from another session)
watch(() => props.isOpen, (open) => {
  if (open) loadState()
})

// ── Navigation ────────────────────────────────────────────────────────────────

function setSection(section: Section) {
  if (section === activeSection.value) return
  slideDirection.value = section === 'sliders' ? 'forward' : 'backward'
  activeSection.value = section
  saveState()
}

function nextStep() {
  if (isLastStep.value) return
  slideDirection.value = 'forward'
  stepIndices.value[activeSection.value]++
  saveState()
}

function prevStep() {
  if (isFirstStep.value) return
  slideDirection.value = 'backward'
  stepIndices.value[activeSection.value]--
  saveState()
}

function goToStep(i: number) {
  if (i === currentStepIndex.value) return
  slideDirection.value = i > currentStepIndex.value ? 'forward' : 'backward'
  stepIndices.value[activeSection.value] = i
  saveState()
}

function close() {
  emit('close')
}

// ── Touch handling ────────────────────────────────────────────────────────────

const touchStartX = ref(0)
const touchStartY = ref(0)

function handleTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX.value = t.clientX
  touchStartY.value = t.clientY
}

function handleTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  const deltaX = Math.abs(t.clientX - touchStartX.value)
  const deltaY = t.clientY - touchStartY.value
  // If swiping more horizontally than vertically, prevent scroll
  if (deltaX > Math.abs(deltaY) && deltaX > 10) {
    e.preventDefault()
  }
}

function handleTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  const deltaX = t.clientX - touchStartX.value
  const deltaY = t.clientY - touchStartY.value

  // Swipe down to close
  if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
    close()
    return
  }

  // Horizontal swipe to navigate
  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) nextStep()
    else prevStep()
  }
}
</script>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────────────────────── */
.manual-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 15, 15, 0.8);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

/* ── Sheet ────────────────────────────────────────────────────────────────── */
.manual-sheet {
  width: 100%;
  height: 85vh;
  background: rgb(19, 19, 18);
  border-radius: 10px 10px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

/* ── Drag handle ──────────────────────────────────────────────────────────── */
.drag-handle-bar {
  width: 36px;
  height: 4px;
  background: rgba(159, 156, 128, 0.35);
  border-radius: 2px;
  margin: 10px auto 0;
  flex-shrink: 0;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.manual-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem 0.5rem;
  border-bottom: 1px solid rgba(159, 156, 128, 0.15);
  flex-shrink: 0;
  cursor: pointer;
}

.manual-title {
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-normal);
  text-transform: uppercase;
  letter-spacing: var(--kb1-letter-spacing-wide);
  color: #909090;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--kb1-font-title);
  color: #848484;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--kb1-radius-sm);
  transition: all 0.2s;
  touch-action: manipulation;
}

.close-btn:hover {
  background: var(--color-background-mute, #222222);
  color: #EAEAEA;
}

/* ── Section tabs (underline style matching app tab bar) ─────────────────── */
.section-tabs {
  display: flex;
  border-bottom: 1px solid rgba(159, 156, 128, 0.15);
  flex-shrink: 0;
  padding: 0 1.25rem;
}

.section-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.6rem 0.75rem;
  margin-bottom: -1px;
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-normal);
  text-transform: uppercase;
  letter-spacing: var(--kb1-letter-spacing-wide);
  color: #848484;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  touch-action: manipulation;
}

.section-tab.active {
  color: #EAEAEA;
  font-weight: var(--kb1-font-weight-semibold);
  border-bottom-color: #EAEAEA;
}

.section-tab:not(.active):hover {
  color: #b0b0b0;
}

/* ── Content area ─────────────────────────────────────────────────────────── */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.5rem 1rem;
  position: relative;
}

.step-card {
  width: 100%;
}

/* ── Step nav row: flanking arrows + centered title ──────────────────────── */
.step-nav-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.nav-arrows-left {
  display: flex;
  justify-content: flex-start;
  gap: 0.05rem;
}

.nav-arrows-right {
  display: flex;
  justify-content: flex-end;
  gap: 0.05rem;
}

.nav-arrow-indicator {
  background: none;
  border: none;
  color: var(--ui-highlight, #b9aa5f);
  cursor: pointer;
  padding: 0.1rem 0.2rem;
  line-height: 0;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
  touch-action: manipulation;
}

.nav-arrow-indicator svg {
  height: 16px;
  width: 10px;
  display: block;
}

.nav-arrow-indicator:hover {
  opacity: 0.6;
}

.step-title {
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-large, 1rem);
  font-weight: var(--kb1-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--kb1-letter-spacing-wide);
  color: var(--ui-highlight, #b9aa5f);
  text-align: center;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-body {
  font-family: var(--kb1-font-family);
}

.step-body p {
  font-size: var(--kb1-font-input);
  font-weight: var(--kb1-font-weight-normal);
  color: rgba(234, 234, 234, 0.75);
  line-height: 1.65;
  margin: 0 0 0.9rem 0;
}

.step-body p:last-child {
  margin-bottom: 0;
}

/* ── Dots footer ──────────────────────────────────────────────────────────── */
.step-dots-footer {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem 1.25rem 1.25rem;
  flex-shrink: 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(159, 156, 128, 0.3);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  touch-action: manipulation;
}

.dot.active {
  background: var(--ui-highlight, #b9aa5f);
  transform: scale(1.25);
}

.dot:hover:not(.active) {
  background: rgba(159, 156, 128, 0.6);
}

/* ── Sheet slide-up/down animation ───────────────────────────────────────── */
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
.sheet-fade-enter-active .manual-sheet {
  animation: sheet-slide-up 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.sheet-fade-leave-active .manual-sheet {
  animation: sheet-slide-down 0.25s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

@keyframes sheet-slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes sheet-slide-down {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}

/* ── Step slide transitions ───────────────────────────────────────────────── */
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-backward-enter-active,
.slide-backward-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.slide-forward-enter-from {
  opacity: 0;
  transform: translateX(28px);
}
.slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}
.slide-backward-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}
.slide-backward-leave-to {
  opacity: 0;
  transform: translateX(28px);
}
</style>
