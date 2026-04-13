<template>
  <div class="strum-builder">
    <!-- Template Info (Read-Only) -->
    <div class="template-info">
      <div class="build-mode-desc" v-if="selectedMode && selectedMode !== 'custom'">
        {{ getModeDescription(selectedMode) }}
      </div>
    </div>

    <!-- Chart/Graph -->
    <svg class="svg" viewBox="0 20 400 75" @click="handleCanvasClick">
        <!-- Root line (0 semitones) -->
        <line x1="0" y1="87.5" x2="400" y2="87.5" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1" />
        
        <!-- Octave reference lines -->
        <line x1="0" y1="56" x2="400" y2="56" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="2,4" />
        <line x1="0" y1="24.5" x2="400" y2="24.5" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" stroke-dasharray="2,4" />

        <!-- Connection line between notes -->
        <polyline
          v-if="intervals.length > 1"
          :points="getPathPoints()"
          fill="none"
          :stroke="activeDotColor"
          stroke-width="1.5"
          opacity="0.6"
          class="connection-line"
        />

        <!-- Note dots (clickable) -->
        <g v-for="(interval, idx) in intervals" :key="`dot-${idx}`">
          <template v-if="shouldSplitDot(idx)">
            <!-- Swing split dots -->
            <line
              :x1="getXPosition(idx) - getSwingOffset()"
              :y1="87.5 - (interval * 3.8)"
              :x2="getXPosition(idx) + getSwingOffset()"
              :y2="87.5 - (interval * 3.8)"
              :stroke="activeDotColor"
              stroke-width="1.5"
              opacity="1.0"
            />
            <circle
              :cx="getXPosition(idx) - getSwingOffset()"
              :cy="87.5 - (interval * 3.8)"
              :r="3"
              :fill="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              :stroke="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              stroke-width="0.5"
              class="note-dot"
              @click.stop="removeNote(idx)"
            />
            <circle
              :cx="getXPosition(idx) + getSwingOffset()"
              :cy="87.5 - (interval * 3.8)"
              :r="3"
              :fill="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              :stroke="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              stroke-width="0.5"
              class="note-dot"
              @click.stop="removeNote(idx)"
            />
          </template>
          <template v-else>
            <!-- Normal single dot -->
            <circle
              :cx="getXPosition(idx)"
              :cy="87.5 - (interval * 3.8)"
              :r="interval === 0 ? 4 : 3"
              :fill="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              :stroke="interval === 0 ? 'var(--strum-reverse)' : activeDotColor"
              stroke-width="0.5"
              class="note-dot"
              :class="{ 
                'root-dot': interval === 0
              }"
              @click.stop="removeNote(idx)"
              @mouseenter="hoverNote(idx)"
              @mouseleave="unhoverNote()"
            />
          </template>
        </g>

        <!-- Hover indicator for adding notes -->
        <circle
          v-if="hoverPosition"
          :cx="hoverPosition.x"
          :cy="hoverPosition.y"
          r="4"
          :fill="activeDotColor"
          opacity="0.5"
          class="hover-indicator"
        />
      </svg>

    <!-- Build Mode Buttons -->
    <div class="build-modes-row">
      <button
        v-for="mode in buildModes"
        :key="mode.id"
        class="mode-btn"
        :class="{ active: selectedMode === mode.id }"
        @click.stop="selectBuildMode(mode.id)"
        :title="mode.description"
      >
        <svg :viewBox="mode.viewBox" fill="none" xmlns="http://www.w3.org/2000/svg" v-html="mode.svg"></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface BuildMode {
  id: string
  description: string
  viewBox: string
  svg: string
}

interface Template {
  id: number
  name: string
  mood: string
  intervals: number[]
  description?: string
}

const props = defineProps<{
  modelValue: number[]
  mode: string
  chordType?: number  // Chord type from parent to sync template
  swingValue?: number  // Swing amount 50-100% (50 = straight, 100 = max swing)
  reverse?: boolean    // Whether strum is in reverse (for color indication)
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
  (e: 'update:mode', value: string): void
}>()

// Intervals (semitones from root)
const intervals = computed({
  get: () => {
    return props.modelValue
  },
  set: (v) => {
    emit('update:modelValue', v)
  }
})

const selectedMode = computed({
  get: () => {
    return props.mode
  },
  set: (v) => {
    emit('update:mode', v)
  }
})

// Active dot color - purple when reversed, yellow when forward
const activeDotColor = computed(() => {
  return props.reverse ? 'var(--strum-reverse)' : 'var(--ui-highlight)'
})

// Build modes with embedded SVG content
const buildModes = ref<BuildMode[]>([
  {
    id: 'up',
    description: 'Up (Ascending)',
    viewBox: '0 0 45 50',
    svg: '<path d="M17.213 0.404627L9.19825 11.2246C8.70939 11.8846 9.1805 12.8198 10.0018 12.8198H13.0166C13.5689 12.8198 14.0166 13.2675 14.0166 13.8198V30.3198C14.0166 30.8721 14.4643 31.3198 15.0166 31.3198H21.0166C21.5689 31.3198 22.0166 30.8721 22.0166 30.3198V13.8198C22.0166 13.2675 22.4643 12.8198 23.0166 12.8198H26.0314C26.8527 12.8198 27.3238 11.8846 26.835 11.2246L18.8202 0.404626C18.4204 -0.13507 17.6128 -0.13507 17.213 0.404627Z" fill="#b9aa5f" transform="translate(12, 9)"/>'  },
  {
    id: 'down',
    description: 'Down (Descending)',
    viewBox: '0 0 45 50',
    svg: '<path d="M18.8202 30.9152L26.835 20.0952C27.3238 19.4353 26.8527 18.5 26.0314 18.5L23.0166 18.5C22.4643 18.5 22.0166 18.0523 22.0166 17.5L22.0166 0.999999C22.0166 0.447715 21.5689 -5.63677e-07 21.0166 -6.11959e-07L15.0166 -1.1365e-06C14.4643 -1.18478e-06 14.0166 0.447715 14.0166 0.999999L14.0166 17.5C14.0166 18.0523 13.5689 18.5 13.0166 18.5L10.0018 18.5C9.18051 18.5 8.70939 19.4353 9.19826 20.0952L17.2131 30.9152C17.6128 31.4549 18.4204 31.4549 18.8202 30.9152Z" fill="#b9aa5f" transform="translate(12, 10)"/>'
  },
  {
    id: 'updown',
    description: 'Bounce (Back and Forth)',
    viewBox: '0 0 45 50',
    svg: '<path d="M9.19644 1.0848L1.18165 11.9048C0.692786 12.5647 1.1639 13.5 1.98521 13.5H5C5.55228 13.5 6 13.9477 6 14.5V31C6 31.5523 6.44772 32 7 32H13C13.5523 32 14 31.5523 14 31V14.5C14 13.9477 14.4477 13.5 15 13.5H18.0148C18.8361 13.5 19.3072 12.5647 18.8183 11.9048L10.8036 1.0848C10.4038 0.545106 9.59622 0.545106 9.19644 1.0848Z" fill="#b9aa5f" transform="translate(3.5, 9)"/><path d="M28.8036 31.9152L36.8183 21.0952C37.3072 20.4353 36.8361 19.5 36.0148 19.5L33 19.5C32.4477 19.5 32 19.0523 32 18.5L32 2C32 1.44772 31.5523 0.999999 31 0.999999L25 0.999999C24.4477 0.999999 24 1.44771 24 2L24 18.5C24 19.0523 23.5523 19.5 23 19.5L19.9852 19.5C19.1639 19.5 18.6928 20.4353 19.1817 21.0952L27.1964 31.9152C27.5962 32.4549 28.4038 32.4549 28.8036 31.9152Z" fill="#b9aa5f" transform="translate(3.5, 9)"/>'
  },
  {
    id: 'inclusive',
    description: 'Inclusive (Center Outward)',
    viewBox: '0 0 45 50',
    svg: '<path d="M9.19644 1.0848L1.18165 11.9048C0.692786 12.5647 1.1639 13.5 1.98521 13.5H5C5.55228 13.5 6 13.9477 6 14.5V21C6 21.5523 6.44772 22 7 22H13C13.5523 22 14 21.5523 14 21V14.5C14 13.9477 14.4477 13.5 15 13.5H18.0148C18.8361 13.5 19.3072 12.5647 18.8183 11.9048L10.8036 1.0848C10.4038 0.545106 9.59622 0.545106 9.19644 1.0848Z" fill="#b9aa5f" transform="translate(12.5, 1.5)"/><path d="M10.8036 45.9152L18.8184 35.0952C19.3072 34.4353 18.8361 33.5 18.0148 33.5L15 33.5C14.4477 33.5 14 33.0523 14 32.5L14 26C14 25.4477 13.5523 25 13 25L7 25C6.44772 25 6 25.4477 6 26L6 32.5C6 33.0523 5.55229 33.5 5 33.5L1.98521 33.5C1.16391 33.5 0.69279 34.4353 1.18166 35.0952L9.19644 45.9152C9.59622 46.4549 10.4038 46.4549 10.8036 45.9152Z" fill="#b9aa5f" transform="translate(12.5, 1.5)"/>'
  },
  {
    id: 'exclusive',
    description: 'Exclusive (Outward to Center)',
    viewBox: '0 0 45 50',
    svg: '<path d="M9.19644 24.0848L1.18165 34.9048C0.692786 35.5647 1.1639 36.5 1.98521 36.5H5C5.55228 36.5 6 36.9477 6 37.5V44C6 44.5523 6.44772 45 7 45H13C13.5523 45 14 44.5523 14 44V37.5C14 36.9477 14.4477 36.5 15 36.5H18.0148C18.8361 36.5 19.3072 35.5647 18.8183 34.9048L10.8036 24.0848C10.4038 23.5451 9.59622 23.5451 9.19644 24.0848Z" fill="#b9aa5f" transform="translate(12.5, 2.5)"/><path d="M10.8036 20.9152L18.8184 10.0952C19.3072 9.43526 18.8361 8.5 18.0148 8.5L15 8.5C14.4477 8.5 14 8.05228 14 7.5L14 0.999999C14 0.447715 13.5523 -5.63677e-07 13 -6.11959e-07L7 -1.1365e-06C6.44772 -1.18478e-06 6 0.447715 6 0.999999L6 7.5C6 8.05228 5.55229 8.5 5 8.5L1.98521 8.5C1.16391 8.5 0.69279 9.43526 1.18166 10.0952L9.19644 20.9152C9.59622 21.4549 10.4038 21.4549 10.8036 20.9152Z" fill="#b9aa5f" transform="translate(12.5, 2.5)"/>'
  },
  {
    id: 'random',
    description: 'Random Order',
    viewBox: '0 0 45 50',
    svg: '<g transform="translate(-0.5, 5.5) scale(0.98)"><path d="M43.7641 8.71431L34.5522 1.89064C33.7298 1.2815 33.3187 0.976937 32.9748 0.985518C32.6756 0.992987 32.3955 1.13411 32.2113 1.37011C31.9998 1.64128 31.9998 2.15297 31.9998 3.17633V4.4C31.9998 4.96005 31.9998 5.24008 31.8908 5.45399C31.7949 5.64215 31.6419 5.79513 31.4538 5.89101C31.2399 6 30.9598 6 30.3998 6L24.9139 6C23.6707 6.00004 22.4756 6.46343 21.5584 7.29395L21.4709 7.37716C21.4363 7.41002 21.4191 7.42645 21.4026 7.44366C21.388 7.45896 21.3739 7.47472 21.3602 7.49092C21.3449 7.50914 21.3304 7.52809 21.3015 7.566L8.48027 24.3705C8.3041 24.6014 8.21601 24.7169 8.10501 24.8001C8.00669 24.8738 7.89562 24.9288 7.77738 24.9622C7.64388 25 7.49866 25 7.20823 25H1.75625C1.1962 25 0.916171 25 0.70226 25.109C0.514098 25.2049 0.361117 25.3578 0.265244 25.546C0.15625 25.7599 0.15625 26.0399 0.15625 26.6V31.4C0.15625 31.9601 0.15625 32.2401 0.265244 32.454C0.361117 32.6422 0.514098 32.7951 0.70226 32.891C0.916171 33 1.1962 33 1.75625 33H9.24219C10.5682 33 11.8397 32.4728 12.7773 31.5352L25.6758 14.6295L25.6758 14.6295C25.8519 14.3986 25.94 14.2831 26.051 14.1999C26.1494 14.1262 26.2604 14.0712 26.3787 14.0378C26.5122 14 26.6574 14 26.9478 14H30.3998C30.9598 14 31.2399 14 31.4538 14.109C31.6419 14.2049 31.7949 14.3578 31.8908 14.546C31.9998 14.7599 31.9998 15.0399 31.9998 15.6V16.8237C31.9998 17.847 31.9998 18.3587 32.2113 18.6299C32.3955 18.8659 32.6756 19.007 32.9748 19.0145C33.3187 19.0231 33.7298 18.7185 34.5522 18.1094L43.7641 11.2857C44.3521 10.8502 44.646 10.6324 44.7509 10.3647C44.8427 10.1302 44.8427 9.86977 44.7509 9.63531C44.646 9.36759 44.3521 9.14983 43.7641 8.71431Z" fill="#b9aa5f"/><path d="M43.5644 30.2857L34.3524 37.1094C33.5301 37.7185 33.1189 38.0231 32.7751 38.0145C32.4759 38.007 32.1957 37.8659 32.0116 37.6299C31.8001 37.3587 31.8001 36.847 31.8001 35.8237V34.6C31.8001 34.0399 31.8001 33.7599 31.6911 33.546C31.5952 33.3578 31.4422 33.2049 31.254 33.109C31.0401 33 30.7601 33 30.2001 33L26.7141 33C25.4709 33 24.2758 32.5366 23.3586 31.7061L23.179 31.5352L20.044 28.8928C19.6303 28.5441 19.4235 28.3698 19.33 28.1552C19.2478 27.9664 19.2259 27.7568 19.2673 27.555C19.3143 27.3258 19.4806 27.1124 19.8132 26.6857L22.7778 22.8826C23.1293 22.4316 23.305 22.2062 23.5265 22.1045C23.7213 22.015 23.9396 21.9905 24.1493 22.0345C24.3879 22.0846 24.6092 22.2655 25.052 22.6272L27.5145 24.639C27.6782 24.7728 27.76 24.8396 27.8515 24.8872C27.9327 24.9294 28.0193 24.9603 28.1088 24.979C28.2098 25 28.3154 25 28.5268 25H30.2001C30.7601 25 31.0401 25 31.254 24.891C31.4422 24.7951 31.5952 24.6422 31.6911 24.454C31.8001 24.2401 31.8001 23.9601 31.8001 23.4V22.1763C31.8001 21.153 31.8001 20.6413 32.0116 20.3701C32.1957 20.1341 32.4759 19.993 32.7751 19.9855C33.1189 19.9769 33.5301 20.2815 34.3524 20.8906L34.3524 20.8906L43.5644 27.7143C44.1523 28.1498 44.4463 28.3676 44.5512 28.6353C44.643 28.8698 44.643 29.1302 44.5512 29.3647C44.4463 29.6324 44.1523 29.8502 43.5644 30.2857Z" fill="#b9aa5f"/><path d="M9.08594 6.00031C10.412 6.00035 11.6834 6.5275 12.6211 7.46515L14.857 9.47337C15.2586 9.83411 15.4594 10.0145 15.5461 10.2315C15.6224 10.4225 15.6379 10.6323 15.5906 10.8324C15.5368 11.0598 15.3647 11.2678 15.0206 11.6837L11.9467 15.3986C11.5815 15.8401 11.3988 16.0608 11.174 16.156C10.9764 16.2397 10.7571 16.2577 10.5485 16.2071C10.3112 16.1496 10.0952 15.9614 9.66311 15.5851L8.29553 14.3938C8.12834 14.2482 8.04474 14.1754 7.95013 14.1235C7.86621 14.0775 7.77612 14.0437 7.68262 14.0233C7.5772 14.0003 7.46634 14.0003 7.24462 14.0003H1.6C1.03995 14.0003 0.759921 14.0003 0.546009 13.8913C0.357847 13.7954 0.204867 13.6425 0.108993 13.4543C0 13.2404 0 12.9604 0 12.4003V7.60031C0 7.04025 0 6.76023 0.108993 6.54632C0.204867 6.35815 0.357847 6.20517 0.546009 6.1093C0.759921 6.00031 1.03995 6.00031 1.6 6.00031H9.08594Z" fill="#b9aa5f"/></g>'
  }
])

// Interval templates with musical descriptors
const templates = ref<Template[]>([
  {
    id: 1,
    name: 'Major Triad',
    mood: 'bright // clean pop // uplifting vibes',
    intervals: [0, 4, 7, 12]
  },
  {
    id: 2,
    name: 'Minor Triad',
    mood: 'dark // emotional // trap feels',
    intervals: [0, 3, 7, 12]
  },
  {
    id: 3,
    name: 'Major 7th',
    mood: 'neo-soul // smooth jazz // lush pads',
    intervals: [0, 4, 7, 11, 12]
  },
  {
    id: 4,
    name: 'Minor 7th',
    mood: 'R&B grooves // chill beats // moody',
    intervals: [0, 3, 7, 10, 12]
  },
  {
    id: 5,
    name: 'Pentatonic',
    mood: 'melodic trap // simple hooks // catchy',
    intervals: [0, 2, 4, 7, 9, 12]
  },
  {
    id: 6,
    name: 'Blues Scale',
    mood: 'soulful // dirty beats // classic grit',
    intervals: [0, 3, 5, 6, 7, 10, 12]
  },
  {
    id: 7,
    name: 'Diminished',
    mood: 'tension // horror vibes // glitchy',
    intervals: [0, 3, 6, 9, 12]
  },
  {
    id: 8,
    name: 'Whole Tone',
    mood: 'dreamy // ambient pads // spacey',
    intervals: [0, 2, 4, 6, 8, 10, 12]
  },
  {
    id: 9,
    name: 'Power Chord',
    mood: '808 bass // heavy // EDM drop',
    intervals: [0, 7, 12]
  },
  {
    id: 10,
    name: 'Octave Jump',
    mood: 'dynamic leads // bouncy // energy',
    intervals: [0, 12, 7, 12, 0]
  },
  {
    id: 11,
    name: 'Augmented',
    mood: 'weird // wonky // experimental',
    intervals: [0, 4, 8, 12]
  },
  {
    id: 12,
    name: 'Sus2',
    mood: 'airy // modern pop // bright shimmer',
    intervals: [0, 2, 7, 12]
  },
  {
    id: 13,
    name: 'Sus4',
    mood: 'build-up // tension // anticipation',
    intervals: [0, 5, 7, 12]
  },
  {
    id: 14,
    name: 'Dominant 7th',
    mood: 'bluesy // tension // resolving',
    intervals: [0, 4, 7, 10, 12]
  },
  {
    id: 15,
    name: 'Major add9',
    mood: 'shimmer // modern pop // bright color',
    intervals: [0, 4, 7, 14]
  },
  {
    id: 16,
    name: 'Minor add9',
    mood: 'emotional depth // trap soul // moody',
    intervals: [0, 3, 7, 14]
  },
  {
    id: 17,
    name: 'Major 6th',
    mood: 'lo-fi gold // retro // nostalgia',
    intervals: [0, 4, 7, 9, 12]
  },
  {
    id: 18,
    name: 'Minor 6th',
    mood: 'boom-bap // vintage // melancholic',
    intervals: [0, 3, 7, 9, 12]
  },
  {
    id: 19,
    name: 'Major 9th',
    mood: 'lush pads // neo-soul // rich texture',
    intervals: [0, 4, 7, 11, 14]
  }
])

const hoverPosition = ref<{ x: number, y: number } | null>(null)

// Base intervals from template (before build mode applied)
const baseIntervals = ref<number[]>([0, 4, 7, 12])

// Current template ID (internal state, not exposed to user)
const selectedTemplateId = ref(1)

// Watch for template selection changes
watch(selectedTemplateId, (newId) => {
  const template = templates.value.find(t => t.id === newId)
  if (template) {
    loadTemplate(template)
  }
}, { immediate: true }) // Load initial template on mount

// Watch for chord type changes from parent
watch(() => props.chordType, (newChordType) => {
  if (newChordType !== undefined) {
    const templateId = getTemplateForChordType(newChordType)
    if (templateId !== selectedTemplateId.value) {
      selectedTemplateId.value = templateId
    }
  }
})

// Get mode description for header display
function getModeDescription(mode: string): string {
  const modeObj = buildModes.value.find(m => m.id === mode)
  return modeObj?.description || ''
}

// Calculate X position for note based on index
function getXPosition(index: number): number {
  const padding = 40
  const width = 400 - (padding * 2)
  const maxIndex = Math.max(intervals.value.length - 1, 1)
  return padding + (index / maxIndex) * width
}

// Get path points for connecting line
function getPathPoints(): string {
  return intervals.value
    .map((interval, idx) => `${getXPosition(idx)},${87.5 - (interval * 3.8)}`)
    .join(' ')
}

// Check if dot should split for swing visualization
function shouldSplitDot(index: number): boolean {
  const swing = props.swingValue || 50
  // Split alternating dots (odd indices) when swing > 50% (straight timing)
  return swing > 50 && index % 2 === 1
}

// Get horizontal swing offset based on swing value (50-100%)
function getSwingOffset(): number {
  const swing = props.swingValue || 50
  // Map 50-100% to 0-25 pixels offset (50% = straight, 100% = max swing)
  return ((swing - 50) / 50) * 25
}

// Handle canvas click to add notes
function handleCanvasClick(event: MouseEvent) {
  if (selectedMode.value !== 'custom') return
  
  const svg = event.currentTarget as SVGElement
  const rect = svg.getBoundingClientRect()
  const y = event.clientY - rect.top
  
  // Convert Y to interval (semitones) - adjusted for new scale
  const svgY = (y / rect.height) * 75  // Map to viewBox coordinates
  const interval = Math.round((87.5 - svgY) / 3.8)
  if (interval < 0 || interval > 24) return
  
  // Add note at this interval
  intervals.value = [...intervals.value, interval].sort((a, b) => a - b)
}

// Remove note at index
function removeNote(index: number) {
  if (selectedMode.value !== 'custom') return
  intervals.value = intervals.value.filter((_, i) => i !== index)
}

// Hover effects
function hoverNote(_index: number) {
  // Could preview this note
}

function unhoverNote() {
  hoverPosition.value = null
}

// Select build mode and reorder intervals
function selectBuildMode(mode: string) {
  selectedMode.value = mode
  
  // Always apply build mode to BASE intervals, not current displayed ones
  if (mode !== 'custom' && baseIntervals.value.length > 0) {
    const sorted = [...baseIntervals.value].sort((a, b) => a - b)
    
    switch (mode) {
      case 'up':
        intervals.value = sorted
        break
      case 'down':
        intervals.value = [...sorted].reverse()
        break
      case 'updown':
        // Bounce: up then down (back and forth)
        intervals.value = [...sorted, ...[...sorted].reverse().slice(1)]
        break
      case 'inclusive':
        // Center outward: start from middle notes and expand to edges
        {
          const result: number[] = []
          const mid = Math.floor(sorted.length / 2)
          let left = mid - 1
          let right = mid
          
          while (left >= 0 || right < sorted.length) {
            if (right < sorted.length) {
              const val = sorted[right++]
              if (val !== undefined) result.push(val)
            }
            if (left >= 0) {
              const val = sorted[left--]
              if (val !== undefined) result.push(val)
            }
          }
          intervals.value = result
        }
        break
      case 'exclusive':
        // Outward inward: start from edges and converge to center
        {
          const result: number[] = []
          let left = 0
          let right = sorted.length - 1
          
          while (left <= right) {
            const leftVal = sorted[left++]
            if (leftVal !== undefined) result.push(leftVal)
            if (left <= right) {
              const rightVal = sorted[right--]
              if (rightVal !== undefined) result.push(rightVal)
            }
          }
          intervals.value = result
        }
        break
      case 'random':
        intervals.value = sorted.sort(() => Math.random() - 0.5)
        break
    }
  }
}

// Load a template as starting point
function loadTemplate(template: Template) {
  baseIntervals.value = [...template.intervals]
  intervals.value = [...template.intervals]
  selectedMode.value = 'up' // Default to up mode
}

// Map chord type to template ID
function getTemplateForChordType(chordType: number): number {
  const mapping: Record<number, number> = {
    0: 1,  // Major → Major Triad
    1: 2,  // Minor → Minor Triad
    2: 7,  // Diminished → Diminished
    3: 11, // Augmented → Augmented
    4: 12, // Sus2 → Sus2
    5: 13, // Sus4 → Sus4
    6: 9,  // Power Chord → Power Chord
    7: 3,  // Major 7th → Major 7th
    8: 4,  // Minor 7th → Minor 7th
    9: 14, // Dominant 7th → Dominant 7th
    10: 15, // Major add9 → Major add9
    11: 16, // Minor add9 → Minor add9
    12: 17, // Major 6th → Major 6th
    13: 18, // Minor 6th → Minor 6th
    14: 19  // Major 9th → Major 9th
  }
  return mapping[chordType] || 1
}
</script>

<style scoped>
.strum-builder {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
}

.svg {
  width: 100%;
  height: 90px;
  color: rgba(255, 255, 255, 0.8);
  cursor: crosshair;
  user-select: none;
}

.note-dot {
  fill: var(--ui-highlight);
  stroke: var(--ui-highlight);
  stroke-width: 0.5;
  transition: all 0.3s ease;
  cursor: pointer;
}

.note-dot:hover {
  filter: drop-shadow(0 0 8px var(--ui-highlight));
}

.root-dot {
  fill: var(--strum-reverse);
  filter: drop-shadow(0 0 4px var(--strum-reverse));
  animation: subtle-pulse 2s ease-in-out infinite;
}

@keyframes subtle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.build-modes-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  justify-content: space-evenly;
  align-items: center;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 32px;
  min-height: 32px;
  max-width: 48px;
  max-height: 48px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 1;
  opacity: 0.3;
}

.mode-btn:hover {
  opacity: 0.6;
  transform: scale(1.05);
}

.mode-btn.active {
  opacity: 1 !important;
  transform: scale(1.0);
}

.mode-btn svg {
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}

.mode-btn svg path {
  fill: var(--ui-highlight) !important;
}

.template-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0;
  width: 100%;
}

.template-value {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.template-name {
  font-size: 0.75rem;
  font-weight: 400;
  color: #EAEAEA;
  opacity: 0.4;
  font-family: 'Roboto Mono', monospace;
  text-align: left;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.build-mode-desc {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Roboto Mono', monospace;
  font-style: italic;
}
</style>
