<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { bleClient } from '../ble/bleClient';
import { SliderPresetStore, type SliderPreset } from '../state/sliderPresets';
import ValueControl from './ValueControl.vue';

// Slider configuration
interface SliderConfig {
  cc: number;
  color: string;
  bipolar: boolean;
  momentary: boolean;
  gangId: number; // Each slider belongs to a gang (solo = unique ID, linked = shared ID)
  value: number;
}

// Preset structure
interface Preset {
  sliders: SliderConfig[];
  links: boolean[]; // 11 booleans for links between adjacent sliders
}

// 12 rainbow colors for grouping
const RAINBOW_COLORS = [
  { id: 1, color: '#FF0000', name: 'Red' },
  { id: 2, color: '#FF7F00', name: 'Orange' },
  { id: 3, color: '#FFFF00', name: 'Yellow' },
  { id: 4, color: '#7FFF00', name: 'Chartreuse' },
  { id: 5, color: '#00FF00', name: 'Green' },
  { id: 6, color: '#00FF7F', name: 'Spring Green' },
  { id: 7, color: '#00FFFF', name: 'Cyan' },
  { id: 8, color: '#007FFF', name: 'Azure' },
  { id: 9, color: '#0000FF', name: 'Blue' },
  { id: 10, color: '#7F00FF', name: 'Violet' },
  { id: 11, color: '#FF00FF', name: 'Magenta' },
  { id: 12, color: '#FF007F', name: 'Rose' },
];

// Default colors: 4 sets of 3 (Red, Chartreuse, Cyan, Violet)
const DEFAULT_COLORS = [
  '#FF0000', // Red 1
  '#FF0000', // Red 2
  '#FF0000', // Red 3
  '#7FFF00', // Chartreuse 1
  '#7FFF00', // Chartreuse 2
  '#7FFF00', // Chartreuse 3
  '#00FFFF', // Cyan 1
  '#00FFFF', // Cyan 2
  '#00FFFF', // Cyan 3
  '#7F00FF', // Violet 1
  '#7F00FF', // Violet 2
  '#7F00FF', // Violet 3
];

// View mode
type ViewMode = 'setup' | 'live';
const viewMode = ref<ViewMode>('setup');

// Control mode (Performance FX vs Mixer)
type ControlMode = 'fx' | 'mix';
const controlMode = ref<ControlMode>('fx');

// Mode configuration
const MODE_CONFIG = {
  fx: {
    ccs: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62],
    labels: ['CC51', 'CC52', 'CC53', 'CC54', 'CC55', 'CC56', 'CC57', 'CC58', 'CC59', 'CC60', 'CC61', 'CC62'],
    colors: DEFAULT_COLORS, // 4 groups of 3
    description: 'Performance FX'
  },
  mix: {
    ccs: [79, 80, 81, 82, 71, 72, 73, 74, 75, 76, 77, 78],
    labels: ['Delay', 'Reverb', 'Dry Mix', 'Line In', 'Trk 1', 'Trk 2', 'Trk 3', 'Trk 4', 'Trk 5', 'Trk 6', 'Trk 7', 'Trk 8'],
    liveLabels: ['Del', 'Rev', 'Dry', 'LnIn', '1', '2', '3', '4', '5', '6', '7', '8'],
    colors: ['#FF7F00', '#FF7F00', '#FF7F00', '#FF7F00', '#FF0000', '#FF0000', '#00FF00', '#00FF00', '#00FFFF', '#00FFFF', '#7F00FF', '#7F00FF'], // Orange for global (4), then red (2), green (2), cyan (2), violet (2)
    description: 'Master Mixer'
  }
};

// Mobile detection and fullscreen state
const isMobile = ref(false);
const isIOS = ref(false);
const isPortrait = ref(false);
const showExitButton = ref(false); // Control X button visibility
const showRotateBackPrompt = ref(false); // Show "rotate back" prompt on exit

// Animation frame state
const toLandFrame = ref(0);
const toPortFrame = ref(0);
let toLandInterval: number | null = null;
let toPortInterval: number | null = null;
const TOTAL_FRAMES = 73; // 00000 to 00072
const FRAME_RATE = 24; // 24fps

// Touch tracking for slider dragging
const activeTouchSlider = ref<number | null>(null);
const activeTouchTrack = ref<HTMLElement | null>(null);
const swipeStartX = ref<number | null>(null);
const swipeStartY = ref<number | null>(null);

// Initialize sliders
const sliders = ref<SliderConfig[]>([]);
const dragging = ref<number | null>(null);
const isDragging = ref(false);

// Color swatch dragging
const colorDragStartY = ref<number>(0);
const colorDragIndex = ref<number | null>(null);
const currentColorIndex = ref<number>(0);

// Color picker state
const showColorPicker = ref<number | null>(null); // Index of slider showing picker

// Explainer text for toggle changes
const explainerText = ref('');
const explainerFading = ref(false);
let explainerTimeout: number | null = null;

// Link state - 11 links between 12 sliders
const links = ref<boolean[]>(new Array(11).fill(false));

// Link drag selection state
const isDraggingLinks = ref(false);
const linkDragState = ref<boolean | null>(null); // The state to apply when dragging (true for link, false for unlink)

// Touch offset compensation (for Bluefy and other browsers with touch offset issues)
const TOUCH_OFFSET_KEY = 'kb1-slider-touch-offset';
const TOUCH_OFFSET_INITIALIZED_KEY = 'kb1-touch-offset-initialized';
const touchOffsetX = ref<number>(0);
const isCalibrationExpanded = ref<boolean>(false);

// Detect if running in Bluefy browser
function isBluefy(): boolean {
  return /bluefy/i.test(navigator.userAgent);
}

// Load touch offset from localStorage
function loadTouchOffset() {
  try {
    const saved = localStorage.getItem(TOUCH_OFFSET_KEY);
    const initialized = localStorage.getItem(TOUCH_OFFSET_INITIALIZED_KEY);
    
    if (saved !== null) {
      const value = parseInt(saved, 10);
      if (!isNaN(value) && value >= -100 && value <= 100) {
        touchOffsetX.value = value;
      }
    } else if (!initialized && isBluefy()) {
      // First time on Bluefy, set default offset
      touchOffsetX.value = -65;
      saveTouchOffset();
      localStorage.setItem(TOUCH_OFFSET_INITIALIZED_KEY, 'true');
    }
  } catch {
    // Ignore errors
  }
}

// Toggle calibration panel
function toggleCalibration() {
  isCalibrationExpanded.value = !isCalibrationExpanded.value;
}

// Toggle control mode between FX and MIX
function toggleControlMode() {
  const newMode = controlMode.value === 'fx' ? 'mix' : 'fx';
  controlMode.value = newMode;
  
  const config = MODE_CONFIG[newMode];
  
  // Update all slider CCs and colors based on mode
  sliders.value.forEach((slider, i) => {
    slider.cc = config.ccs[i] ?? 51;
    slider.color = config.colors[i] ?? '#FF0000';
    
    // Force unipolar in mixer mode (all Polyend mixer CCs are 0-127)
    if (newMode === 'mix') {
      slider.bipolar = false;
      // Reset value to 0 to avoid confusion
      slider.value = 0;
      
      // Ungang first 4 sliders (global mixer controls) - each gets unique gangId
      if (i < 4) {
        slider.gangId = i;
        // Clear links between first 4 sliders
        if (i < 3) {
          links.value[i] = false;
        }
      }
    }
  });
  
  // Save mode preference and preset
  localStorage.setItem('kb1-control-mode', newMode);
  savePreset();
  showExplainerText(config.description);
}

// Save touch offset to localStorage
function saveTouchOffset() {
  try {
    localStorage.setItem(TOUCH_OFFSET_KEY, touchOffsetX.value.toString());
  } catch {
    // Ignore errors
  }
}

// Handle touch offset slider change
function handleTouchOffsetChange(value: number) {
  touchOffsetX.value = value;
  saveTouchOffset();
}

// Double-tap/double-click detection for offset bar reset
let lastOffsetTapTime = 0;
const DOUBLE_TAP_DELAY = 300; // ms

function handleOffsetBarDoubleClick() {
  // Reset to 0
  handleTouchOffsetChange(0);
}

// Handle touch offset bar interaction
function handleOffsetBarClick(event: MouseEvent | TouchEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const clientX = 'touches' in event ? event.touches[0]?.clientX : event.clientX;
  if (clientX === undefined) return;
  
  const x = clientX - rect.left;
  const percentage = (x / rect.width) * 100;
  // Map 0-100% to -100 to +100
  const newValue = Math.round((percentage / 50) * 100 - 100);
  handleTouchOffsetChange(Math.max(-100, Math.min(100, newValue)));
}

function handleOffsetBarTouchStart(event: TouchEvent) {
  const now = Date.now();
  const timeSinceLastTap = now - lastOffsetTapTime;
  
  if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
    // Double-tap detected
    event.preventDefault();
    handleOffsetBarDoubleClick();
  } else {
    // Single tap - process normally
    handleOffsetBarClick(event);
  }
  
  lastOffsetTapTime = now;
}

// Computed: Touch offset fill width (from center)
const touchOffsetFillWidth = computed(() => {
  return Math.abs(touchOffsetX.value) / 2; // 0-50%
});

// Computed: Touch offset fill position (left or right of center)
const touchOffsetFillLeft = computed(() => {
  if (touchOffsetX.value >= 0) {
    return 50; // Start at center for positive
  } else {
    return 50 - touchOffsetFillWidth.value; // Start left of center for negative
  }
});

// Watch isPortrait for debugging
watch(isPortrait, (newVal) => {
  if (viewMode.value === 'live') {
    console.log('[LiveMode] isPortrait:', newVal);
  }
});

// Initialize sliders
function initializeSliders() {
  // Load saved mode preference
  const savedMode = localStorage.getItem('kb1-control-mode') as ControlMode | null;
  if (savedMode === 'fx' || savedMode === 'mix') {
    controlMode.value = savedMode;
  }
  
  const savedPreset = SliderPresetStore.loadCurrentState();
  if (savedPreset && savedPreset.sliders && savedPreset.links) {
    sliders.value = savedPreset.sliders;
    links.value = savedPreset.links;
    // Update CCs and colors based on current mode (in case mode changed)
    const config = MODE_CONFIG[controlMode.value];
    sliders.value.forEach((slider, i) => {
      slider.cc = config.ccs[i] ?? 51;
      slider.color = config.colors[i] ?? '#FF0000';
      
      // In mixer mode, ensure first 4 sliders are ungrouped
      if (controlMode.value === 'mix' && i < 4) {
        slider.gangId = i;
        // Clear links between first 4 sliders
        if (i < 3) {
          links.value[i] = false;
        }
      }
    });
    return;
  }
  
  // Default configuration based on current mode
  const config = MODE_CONFIG[controlMode.value];
  sliders.value = [];
  for (let i = 0; i < 12; i++) {
    sliders.value.push({
      cc: config.ccs[i] ?? 51 + i,
      color: config.colors[i] ?? '#FF0000',
      bipolar: false,
      momentary: false,
      gangId: i, // Each starts in its own gang
      value: 0,
    });
  }
  links.value = new Array(11).fill(false);
}

// === UTILITY FUNCTIONS (must be declared first) ===

// Save preset to localStorage
function savePreset() {
  const preset: Preset = {
    sliders: sliders.value,
    links: links.value,
  };
  SliderPresetStore.saveCurrentState(preset);
}

// Show explainer text with fade effect
function showExplainerText(text: string) {
  // Clear any existing timeout
  if (explainerTimeout) {
    clearTimeout(explainerTimeout);
  }
  
  // Reset fade state
  explainerFading.value = false;
  explainerText.value = text;
  
  // Start fade out after 2 seconds
  explainerTimeout = window.setTimeout(() => {
    explainerFading.value = true;
  }, 2000);
}

// Convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Calculate slider fill height for visual display
function getSliderFillHeight(slider: SliderConfig): number {
  const trackHeight = 490;
  const minFillHeight = 20;
  const minPercent = (minFillHeight / trackHeight) * 100;
  
  if (slider.bipolar) {
    const halfHeight = Math.abs(slider.value) / 2;
    if (halfHeight < minPercent / 2) {
      return minPercent;
    }
    return halfHeight;
  } else {
    return Math.max(slider.value, minPercent);
  }
}

// Calculate slider fill bottom position (only for bipolar)
function getSliderFillBottom(slider: SliderConfig): number {
  if (!slider.bipolar) return 0;
  
  const trackHeight = 490;
  const minFillHeight = 20;
  const minPercent = (minFillHeight / trackHeight) * 100;
  const halfHeight = Math.abs(slider.value) / 2;
  
  if (halfHeight < minPercent / 2) {
    return 50 - minPercent / 2;
  }
  
  if (slider.value >= 0) {
    return 50;
  } else {
    return 50 - halfHeight;
  }
}

// Check if a slider is unreachable due to touch offset compensation
function isSliderUnreachable(sliderIndex: number): boolean {
  // CC51 (index 0) is unreachable when offset > +50
  if (sliderIndex === 0 && touchOffsetX.value > 50) {
    return true;
  }
  // CC62 (index 11) is unreachable when offset < -50
  if (sliderIndex === 11 && touchOffsetX.value < -50) {
    return true;
  }
  return false;
}

// Check if a link should be visible based on mode
function isLinkVisible(linkIndex: number): boolean {
  // In mixer mode, only show links between track volumes (sliders 5-11, which are links 4-10)
  // This excludes the link between Line and Track 1
  if (controlMode.value === 'mix') {
    return linkIndex >= 4 && linkIndex <= 10;
  }
  // In FX mode, show all links
  return true;
}

// Get the effective color for a slider (gray if unreachable, normal color otherwise)
function getSliderColor(slider: SliderConfig, sliderIndex: number): string {
  return isSliderUnreachable(sliderIndex) ? '#2a2a2a' : slider.color;
}

// === END UTILITY FUNCTIONS ===

// Handle touch drag on slider track (for mobile)
function handleTrackTouchStart(event: TouchEvent, index: number) {
  if (!isMobile.value || viewMode.value !== 'live') return;
  event.preventDefault();
  
  const touch = event.touches[0];
  if (!touch) return;
  
  // Apply offset compensation to touch X position
  const compensatedX = touch.clientX + touchOffsetX.value;
  
  // Find which slider track was actually touched (with compensation)
  let actualIndex = index; // Default to the reported index
  
  // Get all slider tracks and check which one contains the compensated touch point
  const sliderTracks = document.querySelectorAll('.live-slider-track');
  for (let i = 0; i < sliderTracks.length; i++) {
    const track = sliderTracks[i] as HTMLElement;
    const rect = track.getBoundingClientRect();
    if (compensatedX >= rect.left && compensatedX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      actualIndex = i;
      break;
    }
  }
  
  // Store swipe start position (with offset compensation)
  swipeStartX.value = compensatedX;
  swipeStartY.value = touch.clientY;
  
  // Get the actual track that was touched
  const track = sliderTracks[actualIndex] as HTMLElement;
  if (!track) return;
  
  // Lock to this slider and track
  activeTouchSlider.value = actualIndex;
  activeTouchTrack.value = track;
  
  // Process the initial touch position
  handleTrackTouchMove(event, actualIndex);
}

function handleTrackTouchMove(event: TouchEvent, _index: number) {
  if (!isMobile.value || viewMode.value !== 'live') return;
  
  // Always use the active slider, not the index from the event
  // (the event's target may be wrong due to touch offset issues)
  const activeIndex = activeTouchSlider.value;
  if (activeIndex === null || !activeTouchTrack.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const touch = event.touches[0];
  if (!touch) return;
  
  // Use the stored track element for accurate bounds
  const track = activeTouchTrack.value;
  const trackRect = track.getBoundingClientRect();
  
  // Calculate position from bottom (0 = bottom, 1 = top)
  const y = touch.clientY - trackRect.top;
  const height = trackRect.height;
  const positionFromTop = Math.max(0, Math.min(1, y / height));
  const positionFromBottom = 1 - positionFromTop;
  
  const slider = sliders.value[activeIndex];
  if (!slider) return;
  
  let newValue;
  if (slider.bipolar) {
    // Bipolar: -100 to +100
    newValue = Math.round((positionFromBottom * 200) - 100);
  } else {
    // Unipolar: 0 to 100
    newValue = Math.round(positionFromBottom * 100);
  }
  
  handleSliderChange(activeIndex, newValue, false);
}

function handleTrackTouchEnd(event: TouchEvent) {
  // Store the active slider before checking swipe
  const wasActiveSlider = activeTouchSlider.value;
  
  // Check for horizontal swipe to exit
  if (swipeStartX.value !== null && swipeStartY.value !== null) {
    const touch = event.changedTouches[0];
    if (touch) {
      // Apply same offset logic as touch start
      const deltaX = Math.abs((touch.clientX + touchOffsetX.value) - swipeStartX.value);
      const deltaY = Math.abs(touch.clientY - swipeStartY.value);
      
      // If horizontal swipe > 100px and more horizontal than vertical, exit
      if (deltaX > 100 && deltaX > deltaY * 2) {
        exitLiveMode();
        return;
      }
    }
  }
  
  // Handle momentary bounce-back before resetting
  if (wasActiveSlider !== null) {
    const slider = sliders.value[wasActiveSlider];
    if (slider && slider.momentary) {
      // Spring back to default with smooth animation
      const defaultValue = getDefaultValue(slider);
      
      // Animate the spring-back over 300ms
      const startValue = slider.value;
      const startTime = performance.now();
      const duration = 300; // ms
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function (ease-out cubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (defaultValue - startValue) * easeProgress;
        handleSliderChange(wasActiveSlider, Math.round(currentValue), false);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }
  
  activeTouchSlider.value = null;
  activeTouchTrack.value = null;
  swipeStartX.value = null;
  swipeStartY.value = null;
}

// Reset to defaults (full reset - colors, settings, values)
function resetToDefaults() {
  sliders.value = [];
  for (let i = 0; i < 12; i++) {
    sliders.value.push({
      cc: 51 + i,
      color: DEFAULT_COLORS[i] || '#FF0000',
      bipolar: false,
      momentary: false,
      gangId: i,
      value: 0,
    });
  }
  links.value = new Array(11).fill(false);
  savePreset();
  showExplainerText('Reset to Defaults');
}

// Reset values to zero (only values, keep colors/settings)
function resetValuesToZero() {
  for (const slider of sliders.value) {
    slider.value = 0;
  }
  savePreset();
  showExplainerText('Values Reset to Zero');
}

onMounted(() => {
  initializeSliders();
  loadTouchOffset();
  
  // Preload rotation animation frames
  preloadRotationFrames();
  
  // Add global listeners for color swatch dragging
  document.addEventListener('mousemove', handleColorSwatchMove);
  document.addEventListener('mouseup', handleColorSwatchEnd);
  document.addEventListener('touchmove', handleColorSwatchMove);
  document.addEventListener('touchend', handleColorSwatchEnd);
  
  // Listen for fullscreen changes (handle ESC key, etc.)
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  // Remove global listeners
  document.removeEventListener('mousemove', handleColorSwatchMove);
  document.removeEventListener('mouseup', handleColorSwatchEnd);
  document.removeEventListener('touchmove', handleColorSwatchMove);
  document.removeEventListener('touchend', handleColorSwatchEnd);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// Handle fullscreen exit via ESC or other means
function handleFullscreenChange() {
  if (!document.fullscreenElement && viewMode.value === 'live' && isMobile.value) {
    // User exited fullscreen, so exit live mode
    exitLiveMode();
  }
}

// Map slider value to CC value (0-127)
function valueToCC(slider: SliderConfig): number {
  if (slider.bipolar) {
    // Bipolar: -100 to +100 maps to 0-127
    return Math.round(((slider.value + 100) / 200) * 127);
  } else {
    // Unipolar: 0 to +100 maps to 0-127
    return Math.round((slider.value / 100) * 127);
  }
}

// Get default value based on mode (always 0 for both bipolar center and unipolar bottom)
function getDefaultValue(_slider: SliderConfig): number {
  return 0;
}

// Handle slider change with optional flag to skip save
async function handleSliderChange(index: number, newValue: number, skipSave = false) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.value = newValue;
  
  // Send MIDI CC
  try {
    const ccValue = valueToCC(slider);
    await bleClient.sendControlChange(slider.cc, ccValue);
  } catch (e) {
    console.error('Failed to send CC', e);
  }
  
  // Update all sliders in the same gang
  const linkedSliders = sliders.value.filter(
    (s, i) => i !== index && s.gangId === slider.gangId
  );
  
  for (const linkedSlider of linkedSliders) {
    linkedSlider.value = newValue;
    try {
      const ccValue = valueToCC(linkedSlider);
      await bleClient.sendControlChange(linkedSlider.cc, ccValue);
    } catch (e) {
      console.error('Failed to send linked CC', e);
    }
  }
  
  // Only save preset when explicitly requested (not during animations)
  if (!skipSave) {
    savePreset();
  }
}

// Handle slider mouse down
function handleMouseDown(index: number) {
  dragging.value = index;
  isDragging.value = true;
}

// Handle slider mouse up (for momentary behavior)
function handleMouseUp(index: number) {
  isDragging.value = false;
  const slider = sliders.value[index];
  if (!slider) return;
  
  if (slider.momentary && dragging.value === index) {
    // Spring back to default with smooth animation
    const defaultValue = getDefaultValue(slider);
    
    // Animate the spring-back over 300ms
    const startValue = slider.value;
    const startTime = performance.now();
    const duration = 300; // ms
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic curve for natural spring feel
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (defaultValue - startValue) * easeOut;
      
      // Skip save during animation frames, only MIDI updates
      handleSliderChange(index, Math.round(currentValue), true);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Save preset only at the end of animation
        savePreset();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  dragging.value = null;
}

// Handle double-click reset (LAT mode only)
function handleDoubleClick(index: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  if (!slider.momentary) {
    const defaultValue = getDefaultValue(slider);
    handleSliderChange(index, defaultValue);
  }
}

// Toggle bipolar/unipolar
function toggleBipolar(index: number) {
  // Disable bipolar toggle in mixer mode (all mixer CCs are unipolar)
  if (controlMode.value === 'mix') return;
  
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.bipolar = !slider.bipolar;
  
  // Show explainer text
  showExplainerText(slider.bipolar ? 'Bipolar' : 'Unipolar');
  
  // Reset to appropriate default when switching modes
  slider.value = getDefaultValue(slider);
  
  // Send MIDI update
  handleSliderChange(index, slider.value);
}

// Toggle momentary/latching
function toggleMomentary(index: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.momentary = !slider.momentary;
  
  // Show explainer text
  showExplainerText(slider.momentary ? 'Momentary' : 'Latched');
  
  savePreset();
}

// Link drag selection handlers
function handleLinkMouseDown(event: MouseEvent, linkIndex: number) {
  event.preventDefault();
  event.stopPropagation();
  
  isDraggingLinks.value = true;
  // Set the drag state to the opposite of the current link state (toggle on first click)
  linkDragState.value = !links.value[linkIndex];
  
  // Apply to the clicked link
  applyLinkDragState(linkIndex);
  
  // Add global listeners
  document.addEventListener('mousemove', handleLinkMouseMove);
  document.addEventListener('mouseup', handleLinkMouseUp);
}

function handleLinkMouseMove(event: MouseEvent) {
  if (!isDraggingLinks.value || linkDragState.value === null) return;
  
  // Find which link icon we're over
  const target = document.elementFromPoint(event.clientX, event.clientY);
  if (target) {
    const linkIcon = target.closest('.link-icon-container');
    if (linkIcon) {
      const linkIndex = parseInt(linkIcon.getAttribute('data-link-index') || '-1');
      if (linkIndex >= 0 && linkIndex < links.value.length) {
        applyLinkDragState(linkIndex);
      }
    }
  }
}

function handleLinkMouseUp() {
  if (linkDragState.value !== null) {
    showExplainerText(linkDragState.value ? 'Linked' : 'Unlinked');
  }
  isDraggingLinks.value = false;
  linkDragState.value = null;
  document.removeEventListener('mousemove', handleLinkMouseMove);
  document.removeEventListener('mouseup', handleLinkMouseUp);
}

function handleLinkTouchStart(event: TouchEvent, linkIndex: number) {
  event.preventDefault();
  event.stopPropagation();
  
  isDraggingLinks.value = true;
  // Set the drag state to the opposite of the current link state (toggle on first touch)
  linkDragState.value = !links.value[linkIndex];
  
  // Apply to the touched link
  applyLinkDragState(linkIndex);
}

function handleLinkTouchMove(event: TouchEvent) {
  if (!isDraggingLinks.value || linkDragState.value === null) return;
  
  const touch = event.touches[0];
  if (!touch) return;
  
  // Find which link icon we're over
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (target) {
    const linkIcon = target.closest('.link-icon-container');
    if (linkIcon) {
      const linkIndex = parseInt(linkIcon.getAttribute('data-link-index') || '-1');
      if (linkIndex >= 0 && linkIndex < links.value.length) {
        applyLinkDragState(linkIndex);
      }
    }
  }
}

function handleLinkTouchEnd() {
  if (linkDragState.value !== null) {
    showExplainerText(linkDragState.value ? 'Linked' : 'Unlinked');
  }
  isDraggingLinks.value = false;
  linkDragState.value = null;
}

function applyLinkDragState(linkIndex: number) {
  if (linkDragState.value === null) return;
  
  const currentState = links.value[linkIndex];
  
  // Only apply if different from current state
  if (currentState !== linkDragState.value) {
    if (linkDragState.value) {
      // Linking
      linkSliders(linkIndex);
    } else {
      // Unlinking
      unlinkSliders(linkIndex);
    }
    savePreset();
  }
}

// Link two adjacent sliders
function linkSliders(linkIndex: number) {
  const upperIndex = linkIndex;
  const lowerIndex = linkIndex + 1;
  
  const upper = sliders.value[upperIndex];
  const lower = sliders.value[lowerIndex];
  
  if (!upper || !lower) return;
  
  // Lower slider adopts upper slider's settings
  lower.color = upper.color;
  lower.bipolar = upper.bipolar;
  lower.momentary = upper.momentary;
  
  // Merge gangs - all sliders with lower's gangId now get upper's gangId
  const lowerGangId = lower.gangId;
  const upperGangId = upper.gangId;
  
  sliders.value.forEach(slider => {
    if (slider.gangId === lowerGangId) {
      slider.gangId = upperGangId;
    }
  });
  
  // Set link
  links.value[linkIndex] = true;
}

// Unlink two adjacent sliders
function unlinkSliders(linkIndex: number) {
  const upperIndex = linkIndex;
  const lowerIndex = linkIndex + 1;
  
  const upper = sliders.value[upperIndex];
  const lower = sliders.value[lowerIndex];
  
  if (!upper || !lower) return;
  
  // Clear the link
  links.value[linkIndex] = false;
  
  // Find all sliders connected through links starting from upper
  const connectedIndices = new Set<number>();
  
  // Find all sliders connected through links starting from upper
  function findConnected(startIndex: number, visited: Set<number>) {
    if (visited.has(startIndex)) return;
    visited.add(startIndex);
    
    // Check link to previous slider
    if (startIndex > 0 && links.value[startIndex - 1]) {
      findConnected(startIndex - 1, visited);
    }
    
    // Check link to next slider
    if (startIndex < 11 && links.value[startIndex]) {
      findConnected(startIndex + 1, visited);
    }
  }
  
  findConnected(upperIndex, connectedIndices);
  
  // If lower is not in the connected set, give it a new gang ID
  if (!connectedIndices.has(lowerIndex)) {
    const newGangId = Math.max(...sliders.value.map(s => s.gangId)) + 1;
    
    // Find all sliders connected to lower
    const lowerConnectedIndices = new Set<number>();
    findConnected(lowerIndex, lowerConnectedIndices);
    
    // Assign new gang ID to lower and its connected sliders
    lowerConnectedIndices.forEach(idx => {
      if (sliders.value[idx]) {
        sliders.value[idx].gangId = newGangId;
      }
    });
  }
}

// Change slider color
function changeSliderColor(index: number, colorId: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  const color = RAINBOW_COLORS.find(c => c.id === colorId);
  if (color) {
    slider.color = color.color;
    savePreset();
  }
}

// Color swatch drag handlers
function handleColorSwatchClick(index: number, event: MouseEvent | TouchEvent) {
  event.stopPropagation();
  const wasOpen = showColorPicker.value === index;
  
  // Toggle picker for this slider
  showColorPicker.value = wasOpen ? null : index;
  
  // If opening the picker, scroll to selected color
  if (!wasOpen) {
    nextTick(() => {
      const slider = sliders.value[index];
      if (!slider) return;
      
      const colorIndex = RAINBOW_COLORS.findIndex(c => c.color === slider.color);
      const scrollContainer = document.querySelector(`[data-picker-index="${index}"] .color-picker-scroll`) as HTMLElement;
      
      if (scrollContainer && colorIndex >= 0) {
        // Scroll to center the selected item (32px item height + 4px margin)
        scrollContainer.scrollTop = colorIndex * 34;
        
        // Trigger initial opacity/blur calculation
        const scrollEvent = new Event('scroll');
        Object.defineProperty(scrollEvent, 'target', { value: scrollContainer, writable: false });
        handlePickerScroll(scrollEvent);
      }
    });
  }
}

function selectColorFromPicker(index: number, colorId: number) {
  changeSliderColor(index, colorId);
  showColorPicker.value = null;
}

function closeColorPicker() {
  showColorPicker.value = null;
}

function handlePickerScroll(event: Event) {
  const scrollContainer = event.target as HTMLElement | null;
  if (!scrollContainer) return;
  const items = scrollContainer.querySelectorAll('.color-picker-item');
  const containerCenter = scrollContainer.offsetHeight / 2;
  
  items.forEach((item: Element) => {
    const htmlItem = item as HTMLElement;
    const itemRect = htmlItem.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemCenter = itemRect.top - containerRect.top + itemRect.height / 2;
    const distance = Math.abs(itemCenter - containerCenter);
    
    // Calculate opacity and blur based on distance from center
    const maxDistance = 60; // Max distance for full fade
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const opacity = 1 - (normalizedDistance * 0.7); // 1 at center, 0.3 at max distance
    const blur = normalizedDistance * 2; // 0px at center, 2px at max distance
    
    htmlItem.style.opacity = opacity.toString();
    htmlItem.style.filter = `blur(${blur}px)`;
  });
}

function handleColorSwatchMove(event: MouseEvent | TouchEvent) {
  if (colorDragIndex.value === null) return;
  
  const slider = sliders.value[colorDragIndex.value];
  if (!slider) return;
  
  // Get current Y position
  let currentY = 0;
  if (event instanceof MouseEvent) {
    currentY = event.clientY;
  } else if (event.touches.length > 0) {
    const touch = event.touches[0];
    if (touch) {
      currentY = touch.clientY;
    }
  }
  
  // Calculate delta and determine color index change
  const deltaY = colorDragStartY.value - currentY; // Inverted: drag up = next color
  const colorSteps = Math.floor(deltaY / 30); // 30px per color change
  
  if (colorSteps !== 0) {
    let newColorIndex = currentColorIndex.value + colorSteps;
    
    // Wrap around
    if (newColorIndex < 0) {
      newColorIndex = RAINBOW_COLORS.length + (newColorIndex % RAINBOW_COLORS.length);
    } else if (newColorIndex >= RAINBOW_COLORS.length) {
      newColorIndex = newColorIndex % RAINBOW_COLORS.length;
    }
    
    // Update color
    const newColor = RAINBOW_COLORS[newColorIndex];
    if (newColor) {
      slider.color = newColor.color;
    }
    
    // Reset drag start for next increment
    colorDragStartY.value = currentY;
    currentColorIndex.value = newColorIndex;
    
    savePreset();
  }
}

function handleColorSwatchEnd() {
  colorDragIndex.value = null;
}

// Mode switching
// Detect if device is mobile (touch + small screen)
function detectMobile() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  isMobile.value = hasTouch && isSmallScreen;
  
  // Detect iOS
  const userAgent = navigator.userAgent.toLowerCase();
  isIOS.value = /iphone|ipad|ipod/.test(userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check orientation
  checkOrientation();
}

async function checkOrientation() {
  const wasPortrait = isPortrait.value;
  const newIsPortrait = window.innerHeight > window.innerWidth;
  
  isPortrait.value = newIsPortrait;
  
  // Start/stop animations based on orientation
  if (isPortrait.value && !wasPortrait) {
    startToLandAnimation();
    stopToPortAnimation();
  } else if (!isPortrait.value && wasPortrait) {
    stopToLandAnimation();
    
    // Android: Request fullscreen when rotated to landscape
    if (!isIOS.value && viewMode.value === 'live') {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen && !document.fullscreenElement) {
          await elem.requestFullscreen();
          
          // Force recheck orientation after fullscreen (browser needs time to update)
          setTimeout(() => {
            // Force landscape if in fullscreen (Android fullscreen should be landscape)
            if (document.fullscreenElement) {
              isPortrait.value = false;
            }
          }, 300);
        }
        
        // Lock orientation to landscape
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch {
            // Orientation lock not supported
          }
        }
      } catch (e) {
        console.error('Fullscreen error:', e);
      }
    }
    
    // Force re-render
    await nextTick();
  }
  
  // If waiting to exit and user rotated to portrait, complete the exit
  if (showRotateBackPrompt.value && isPortrait.value) {
    completeExit();
  }
}

function startToLandAnimation() {
  if (toLandInterval) return;
  toLandFrame.value = 0;
  toLandInterval = window.setInterval(() => {
    toLandFrame.value = (toLandFrame.value + 1) % TOTAL_FRAMES;
  }, 1000 / FRAME_RATE);
}

function stopToLandAnimation() {
  if (toLandInterval) {
    clearInterval(toLandInterval);
    toLandInterval = null;
  }
}

function startToPortAnimation() {
  if (toPortInterval) return;
  toPortFrame.value = 0;
  toPortInterval = window.setInterval(() => {
    toPortFrame.value = (toPortFrame.value + 1) % TOTAL_FRAMES;
  }, 1000 / FRAME_RATE);
}

function stopToPortAnimation() {
  if (toPortInterval) {
    clearInterval(toPortInterval);
    toPortInterval = null;
  }
}

// Computed properties for reactive image paths
const toLandImageSrc = computed(() => {
  const frameStr = toLandFrame.value.toString().padStart(5, '0');
  return `${import.meta.env.BASE_URL}to_land/to_land_${frameStr}.png`;
});

const toPortImageSrc = computed(() => {
  const frameStr = toPortFrame.value.toString().padStart(5, '0');
  return `${import.meta.env.BASE_URL}to_port/to_port_${frameStr}.png`;
});

// Preload animation frames for smooth playback
function preloadRotationFrames() {
  const baseUrl = import.meta.env.BASE_URL;
  
  // Preload to_land frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = i.toString().padStart(5, '0');
    img.src = `${baseUrl}to_land/to_land_${frameNum}.png`;
  }
  
  // Preload to_port frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = i.toString().padStart(5, '0');
    img.src = `${baseUrl}to_port/to_port_${frameNum}.png`;
  }
}

async function enterLiveMode() {
  detectMobile();
  viewMode.value = 'live';
  showExitButton.value = false; // Start with X hidden
  
  // Platform-specific mobile handling
  if (isMobile.value) {
    if (isIOS.value) {
      // iOS: No fullscreen API support, just use viewport optimization
      // Portrait prompt will show if needed
      window.addEventListener('resize', checkOrientation);
      window.addEventListener('orientationchange', checkOrientation);
      // Start animation if in portrait
      if (isPortrait.value) {
        startToLandAnimation();
      }
    } else {
      // Android: Add orientation listeners and show prompt if in portrait
      window.addEventListener('resize', checkOrientation);
      window.addEventListener('orientationchange', checkOrientation);
      
      if (isPortrait.value) {
        // Show rotation prompt, will request fullscreen after rotation
        startToLandAnimation();
        
        // Add safety timeout - if still showing prompt after 5 seconds, force hide it
        setTimeout(() => {
          if (isPortrait.value && viewMode.value === 'live') {
            isPortrait.value = false;
          }
        }, 5000);
      } else {
        // Already in landscape, request fullscreen immediately
        try {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
            
            // Recheck orientation after entering fullscreen
            setTimeout(() => {
              checkOrientation();
            }, 300);
          }
          
          // Lock orientation to landscape
          if (screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape');
            } catch {
              // Orientation lock not supported
            }
          }
        } catch (e) {
          console.error('Fullscreen error:', e);
        }
      }
    }
  }
  
  await nextTick();
}

async function exitLiveMode() {
  // Show rotate-back prompt for mobile users (both iOS and Android)
  // Layout is designed for portrait, so guide users to rotate back
  if (isMobile.value && !isPortrait.value) {
    // Android: Exit fullscreen immediately so device can detect orientation changes
    if (!isIOS.value) {
      try {
        // Exit fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        
        // Unlock orientation
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } catch (e) {
        console.error('Exit fullscreen error:', e);
      }
    }
    
    showRotateBackPrompt.value = true;
    startToPortAnimation();
    // Orientation listeners remain active to detect rotation to portrait
    // When portrait is detected, checkOrientation() will call completeExit()
  } else {
    completeExit();
  }
}

async function completeExit() {
  showRotateBackPrompt.value = false;
  viewMode.value = 'setup';
  showExitButton.value = false; // Reset button visibility
  activeTouchSlider.value = null; // Reset active slider
  
  // Stop all animations
  stopToLandAnimation();
  stopToPortAnimation();
  
  // Platform-specific cleanup
  if (isMobile.value) {
    // Remove orientation listeners (both iOS and Android)
    window.removeEventListener('resize', checkOrientation);
    window.removeEventListener('orientationchange', checkOrientation);
    
    if (!isIOS.value) {
      // Android: Exit fullscreen and unlock orientation
      try {
        // Exit fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        
        // Unlock orientation
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } catch (e) {
        console.error('Exit fullscreen error:', e);
      }
    }
  }
}

// Get current preset state
function getCurrentPreset(): SliderPreset {
  return {
    sliders: sliders.value,
    links: links.value,
  };
}

// Load preset from external source
function loadPreset(preset: SliderPreset) {
  sliders.value = JSON.parse(JSON.stringify(preset.sliders)); // Deep clone
  links.value = [...preset.links];
  savePreset();
  showExplainerText('Preset Loaded');
}

// Expose functions for parent component
defineExpose({
  resetToDefaults,
  resetValuesToZero,
  getCurrentPreset,
  loadPreset,
  viewMode,
  exitLiveMode,
});
</script>

<template>
  <div 
    class="performance-sliders"
    :class="{ 'live-mode': viewMode === 'live' }"
  >
    <!-- SETUP MODE -->
    <div v-if="viewMode === 'setup'" class="setup-mode" @click="closeColorPicker">
      <!-- Header -->
      <div class="setup-header">
        <div class="header-buttons-row">
          <button class="btn-live" @click="enterLiveMode">+ Enter Live</button>
          <button class="btn-mode-toggle" @click="toggleControlMode">
            <span :class="{ active: controlMode === 'fx' }">FX</span>
            <span class="mode-divider">|</span>
            <span :class="{ active: controlMode === 'mix' }">MIX</span>
          </button>
          <button 
            class="btn-calibration"
            :class="{ expanded: isCalibrationExpanded }"
            @click="toggleCalibration"
          >
            Cal
          </button>
        </div>
        <div class="explainer-text" :class="{ fading: explainerFading }">
          {{ explainerText }}
        </div>
      </div>
      
      <!-- Touch Offset Compensation (Collapsible) -->
      <Transition name="calibration-slide">
        <div v-if="isCalibrationExpanded" class="touch-offset-section">
          <!-- Bar -->
          <div class="offset-meter">
            <div 
              class="offset-bar-container"
              @click="handleOffsetBarClick"
              @dblclick="handleOffsetBarDoubleClick"
              @touchstart.prevent="handleOffsetBarTouchStart"
            >
              <div class="offset-divider" :style="{ left: '50%' }"></div>
              <div class="offset-bar-wrapper">
                <div class="offset-bar gray-bar-base"></div>
                <div 
                  class="offset-bar yellow-bar-active"
                  :style="{ 
                    left: `${touchOffsetFillLeft}%`, 
                    width: `${touchOffsetFillWidth}%` 
                  }"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- Label and Controls -->
          <div class="offset-group">
            <label class="offset-label">SLIDER CALIBRATION</label>
            <div class="offset-controls-wrapper">
              <ValueControl
                v-model="touchOffsetX"
                :min="-100"
                :max="100"
                :step="1"
                :small-step="1"
                :large-step="10"
                @update:modelValue="handleTouchOffsetChange"
              />
              <span class="offset-unit">px</span>
            </div>
          </div>
          
          <!-- Helper text -->
          <div class="calibration-help">
            Adjusts touch position in Live Mode
          </div>
        </div>
      </Transition>
      
      <!-- Sliders list -->
      <div class="sliders-list">
        <template v-for="(slider, index) in sliders" :key="slider.cc">
          <div class="slider-row">
            <!-- Color swatch (clickable) -->
            <div class="color-section" :class="{ 'compact': controlMode === 'mix' && index < 4 }">
              <div 
                class="color-swatch-wrapper"
              >
                <div 
                  class="color-swatch"
                  :style="{ backgroundColor: getSliderColor(slider, index) }"
                  @click="handleColorSwatchClick(index, $event)"
                ></div>
                
                <!-- Color picker overlay -->
                <Transition name="picker-fade">
                  <div 
                    v-if="showColorPicker === index"
                    class="color-picker-overlay"
                    :data-picker-index="index"
                    @click.stop
                  >
                    <div class="color-picker-container">
                      <div class="color-picker-center-indicator"></div>
                      <div class="color-picker-scroll" @scroll="handlePickerScroll">
                        <div class="color-picker-spacer"></div>
                        <div
                          v-for="color in RAINBOW_COLORS"
                          :key="color.id"
                          class="color-picker-item"
                          :class="{ selected: slider.color === color.color }"
                          :style="{ backgroundColor: color.color }"
                          :data-color-id="color.id"
                          @click="selectColorFromPicker(index, color.id)"
                        ></div>
                        <div class="color-picker-spacer"></div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            
            <!-- CC Number -->
            <div class="cc-section" :class="{ 'expanded': controlMode === 'mix' && index < 4 }">
              <template v-if="controlMode === 'mix'">
                <template v-if="index < 4">
                  <span class="cc-label-text">{{ MODE_CONFIG.mix.labels[index] }}</span>
                </template>
                <template v-else>
                  <span class="cc-label-text">Trk </span><span class="cc-label">{{ index - 3 }}</span>
                </template>
              </template>
              <template v-else>
                <span class="cc-label-text">CC </span><span class="cc-label">{{ slider.cc }}</span>
              </template>
            </div>
            
            <!-- Inline toggles -->
            <div class="slider-toggle-inline">
              <!-- Mom/Lat toggle -->
              <button class="slider-toggle-btn" @click="toggleMomentary(index)">
                <span :class="{ active: slider.momentary }">MOM</span>
                <span class="toggle-divider">|</span>
                <span :class="{ active: !slider.momentary }">LAT</span>
              </button>
              
              <!-- Polarity toggle (disabled in mixer mode) -->
              <button 
                class="slider-toggle-btn"
                :class="{ disabled: controlMode === 'mix' }"
                @click="toggleBipolar(index)"
              >
                <span :class="{ active: !slider.bipolar }">UNI</span>
                <span class="toggle-divider">|</span>
                <span :class="{ active: slider.bipolar }">BI</span>
              </button>
            </div>
          </div>
          
          <!-- Link icon between sliders (not after last slider, conditional in mixer mode) -->
          <div 
            v-if="index < sliders.length - 1 && isLinkVisible(index)" 
            class="link-icon-container"
            :data-link-index="index"
          >
            <img 
              :src="`/KB1-config/${links[index] ? 'link' : 'unlink'}.svg`"
              :alt="links[index] ? 'Linked' : 'Unlinked'"
              class="link-icon"
              :class="{ linked: links[index] }"
              @mousedown="handleLinkMouseDown($event, index)"
              @touchstart="handleLinkTouchStart($event, index)"
              @touchmove="handleLinkTouchMove"
              @touchend="handleLinkTouchEnd"
            />
          </div>
        </template>
      </div>
    </div>
    
    <!-- LIVE MODE -->
    <div 
      v-if="viewMode === 'live'" 
      class="live-mode" 
      :class="{ 'mobile-landscape': isMobile }"
    >
      <!-- Mobile Portrait Prompt (iOS & Android) -->
      <div v-if="isMobile && isPortrait" class="portrait-prompt" @click="!isIOS && (isPortrait = false)">
        <div class="prompt-content">
          <img :src="toLandImageSrc" alt="Rotate to landscape" class="rotate-icon-img" />
          <div class="prompt-subtext" style="margin-top: 1rem; font-size: 0.7rem; opacity: 0.6;">
            {{ isIOS ? 'Swipe left or right to exit' : 'Rotate device or tap anywhere to skip' }}
          </div>
        </div>
      </div>
      
      <!-- Rotate Back Prompt (on exit) -->
      <div v-if="showRotateBackPrompt" class="portrait-prompt">
        <div class="prompt-content">
          <img :src="toPortImageSrc" alt="Rotate to portrait" class="rotate-icon-img" />
        </div>
      </div>
      
      <!-- Sliders container -->
      <div class="live-sliders-container">
        <div 
          v-for="(slider, index) in sliders"
          :key="slider.cc"
          class="live-slider-wrapper"
        >
          <!-- Center markers for bipolar mode (outside track) -->
          <template v-if="slider.bipolar">
            <div 
              class="center-marker-left"
              :style="{ backgroundColor: getSliderColor(slider, index) }"
            ></div>
            <div 
              class="center-marker-right"
              :style="{ backgroundColor: getSliderColor(slider, index) }"
            ></div>
          </template>
          
          <!-- Slider track -->
          <div 
            class="live-slider-track"
            @dblclick="handleDoubleClick(index)"
            @touchstart="handleTrackTouchStart($event, index)"
            @touchmove="handleTrackTouchMove($event, index)"
            @touchend="handleTrackTouchEnd($event)"
            @touchcancel="handleTrackTouchEnd($event)"
            :style="{
              backgroundColor: hexToRgba(getSliderColor(slider, index), 0.3)
            }"
          >
            <!-- CC number inside track (top) -->
            <div class="live-slider-cc-inside">
              <template v-if="controlMode === 'mix'">{{ MODE_CONFIG.mix.liveLabels[index] }}</template>
              <template v-else>{{ slider.cc }}</template>
            </div>
            
            <!-- Slider fill -->
            <div 
              class="live-slider-fill"
              :class="{ 'bipolar': slider.bipolar }"
              :style="{
                height: `${getSliderFillHeight(slider)}%`,
                bottom: slider.bipolar ? `${getSliderFillBottom(slider)}%` : '0',
                backgroundColor: getSliderColor(slider, index),
              }"
            ></div>
            
            <!-- Slider input -->
            <input
              type="range"
              class="live-slider-input"
              :min="slider.bipolar ? -100 : 0"
              :max="100"
              :value="slider.value"
              @input="handleSliderChange(index, Number(($event.target as HTMLInputElement).value))"
              @mousedown="handleMouseDown(index)"
              @mouseup="handleMouseUp(index)"
              @touchstart="handleMouseDown(index)"
              @touchend="handleMouseUp(index)"
            />
          </div>
          
          <!-- CC label -->
          <div class="live-cc-label">
            <template v-if="controlMode === 'mix'">{{ MODE_CONFIG.mix.liveLabels[index] }}</template>
            <template v-else>{{ slider.cc }}</template>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-sliders {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background, #0F0F0F);
  color: var(--color-text, #EAEAEA);
  overflow: hidden;
}

/* === SETUP MODE === */
.setup-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  overflow: auto;
}

.setup-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.setup-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
}

.btn-live {
  width: 100%;
  padding: 0.125rem 0.25rem;
  background: rgba(249, 172, 32, 0.15);
  border: 1px solid rgba(249, 172, 32, 0.3);
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  box-shadow: 0 0 0 rgba(249, 172, 32, 0);
}

.btn-live:hover {
  background: rgba(249, 172, 32, 0.25);
  border-color: rgba(249, 172, 32, 0.5);
  box-shadow: 0 0 8px rgba(249, 172, 32, 0.3);
  color: #F9AC20;
}

.btn-live:active {
  background: rgba(249, 172, 32, 0.35);
  border-color: #F9AC20;
  box-shadow: 0 0 12px rgba(249, 172, 32, 0.4);
  transform: scale(0.98);
}

/* Header buttons row */
.header-buttons-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.header-buttons-row .btn-live {
  flex: 1;
  width: auto;
}

/* Mode toggle button */
.btn-mode-toggle {
  flex: 0 0 auto;
  padding: 0.25rem 0.5rem;
  background: rgba(106, 104, 83, 0.2);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: var(--kb1-text-primary);
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.btn-mode-toggle:hover {
  background: rgba(106, 104, 83, 0.3);
  border-color: rgba(106, 104, 83, 0.6);
}

.btn-mode-toggle span {
  opacity: 0.5;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.btn-mode-toggle span.active {
  opacity: 1;
  color: #EAEAEA;
  font-weight: 600;
}

.btn-mode-toggle .mode-divider {
  opacity: 0.3;
  font-weight: 300;
}

/* Calibration toggle button */
.btn-calibration {
  flex: 0 0 auto;
  padding: 0.25rem 0.5rem;
  background: rgba(106, 104, 83, 0.2);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: var(--kb1-text-primary);
  opacity: 0.5;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
}

.btn-calibration:hover {
  background: rgba(106, 104, 83, 0.3);
  border-color: rgba(106, 104, 83, 0.6);
  opacity: 1;
}

.btn-calibration.expanded {
  background: rgba(106, 104, 83, 0.35);
  border-color: rgba(106, 104, 83, 0.7);
  opacity: 1;
}

/* Calibration slide transition */
.calibration-slide-enter-active,
.calibration-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.calibration-slide-enter-from {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.calibration-slide-enter-to {
  max-height: 200px;
  opacity: 1;
  margin-bottom: 0.75rem;
}

.calibration-slide-leave-from {
  max-height: 200px;
  opacity: 1;
  margin-bottom: 0.75rem;
}

.calibration-slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.explainer-text {
  color: var(--accent-highlight);
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 500;
  opacity: 1;
  transition: opacity 2s ease-out;
  min-height: 0.5rem;
  flex: 1;
}

.explainer-text.fading {
  opacity: 0;
}

/* Touch Offset Compensation Section */
.touch-offset-section {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-divider);
  margin-bottom: 0.75rem;
}

.offset-meter {
  padding: 0.75rem 0;
}

.offset-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.offset-label {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: var(--label-gray);
  font-weight: 400;
  flex-shrink: 0;
}

.offset-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 17px;
  cursor: pointer;
  user-select: none;
}

.offset-bar-wrapper {
  position: relative;
  width: 100%;
  height: 9px;
  overflow: visible;
}

.offset-bar {
  height: 9px;
  position: absolute;
  top: 0;
  border-radius: 4.5px;
}

.gray-bar-base {
  width: 100%;
  background: var(--color-divider);
  left: 0;
}

.yellow-bar-active {
  background: var(--accent-highlight);
  z-index: 1;
}

.offset-divider {
  position: absolute;
  width: 5px;
  height: 17px;
  background: var(--accent-highlight);
  border-radius: 2.5px;
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
}

.offset-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.offset-unit {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: var(--kb1-text-primary);
  font-weight: 400;
  cursor: default;
  user-select: none;
}

.calibration-help {
  font-size: 0.7rem;
  color: var(--label-gray);
  opacity: 0.6;
  text-align: left;
  margin-top: 0.5rem;
  font-family: 'Roboto Mono';
}

.sliders-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.01rem;
  padding: 0.25rem 1rem;
  background: rgba(106, 104, 83, 0.2);
  border-radius: 6px;
  transition: background 0.2s;
}

.slider-row:hover {
  background: rgba(106, 104, 83, 0.3);
}

.color-section {
  display: flex;
  align-items: center;
  min-width: 60px;
}

.color-section.compact {
  min-width: 40px;
}

.color-swatch-wrapper {
  position: relative;
  display: inline-block;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(234, 234, 234, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.color-swatch:hover {
  border-color: rgba(234, 234, 234, 0.5);
  transform: scale(1.05);
}

.color-swatch:active {
  transform: scale(0.95);
}

/* Color Picker Overlay */
.color-picker-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  padding: 0.5rem;
  background: rgba(15, 15, 15, 0.95);
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.color-picker-container {
  position: relative;
  width: 20px;
  height: 220px;
}

.color-picker-center-indicator {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 50%;
  height: 30px;
  transform: translateY(-50%);
  border-top: 2px solid rgba(116, 196, 255, 0.5);
  border-bottom: 2px solid rgba(116, 196, 255, 0.5);
  pointer-events: none;
  z-index: 2;
}

.color-picker-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.color-picker-scroll::-webkit-scrollbar {
  display: none;
}

.color-picker-spacer {
  height: 95px;
  flex-shrink: 0;
}

.color-picker-item {
  height: 18px;
  width: 18px;
  border-radius: 50%;
  cursor: pointer;
  scroll-snap-align: center;
  transition: opacity 0.1s, filter 0.1s;
  border: none;
  margin: 2px 0;
}

.color-picker-item:hover {
  opacity: 1 !important;
  filter: blur(0px) !important;
}

.color-picker-item.selected {
  box-shadow: 0 0 10px rgba(116, 196, 255, 0.5);
}

/* Picker fade transition */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}

.cc-section {
  min-width: 80px;
  display: flex;
  align-items: center;
  gap: 0;
}

.cc-section.expanded {
  min-width: 100px;
}

.cc-label-text {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: #848484;
  font-weight: 400;
}

.cc-label {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: var(--accent-highlight);
  font-weight: 600;
}

.slider-toggle-inline {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex: 1; /* Allow container to grow proportionally */
  justify-content: flex-start;
}

.slider-toggle-btn {
  flex: 0 0 auto;
  padding: 0.25rem 0.375rem;
  background: rgba(106, 104, 83, 0.2);
  border: 1px solid rgba(106, 104, 83, 0.4);
  color: var(--kb1-text-primary);
  font-size: 0.65rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
  display: flex;
  gap: 0.2rem;
  align-items: center;
  justify-content: center;
}

.slider-toggle-btn:hover:not(.disabled) {
  background: rgba(106, 104, 83, 0.3);
  border-color: rgba(106, 104, 83, 0.6);
}

.slider-toggle-btn span {
  opacity: 0.5;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.slider-toggle-btn span.active {
  opacity: 1;
  color: #EAEAEA;
  font-weight: 600;
}

.slider-toggle-btn .toggle-divider {
  opacity: 0.3;
  font-weight: 300;
}

.slider-toggle-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(106, 104, 83, 0.1);
  border-color: rgba(106, 104, 83, 0.2);
}

.slider-toggle-btn.disabled:hover {
  background: rgba(106, 104, 83, 0.1);
  border-color: rgba(106, 104, 83, 0.2);
}

.link-icon-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
  margin-left: 2.25rem;
  margin-top: -0.5rem;
  margin-bottom: -0.5rem;
  height: 16px;
  user-select: none;
  touch-action: none;
}

.link-icon {
  width: 28px;
  height: 28px;
  opacity: 0.4;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.link-icon:hover {
  opacity: 0.6;
  transform: scale(1.1);
}

.link-icon:active {
  opacity: 0.8;
  transform: scale(1.2);
}

.link-icon.linked {
  opacity: 1;
}

/* === LIVE MODE === */
.live-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #0F0F0F;
  position: relative;
}

/* Force full viewport height on mobile */
.live-mode.mobile-landscape {
  height: 100vh !important;
  height: 100dvh !important;
  min-height: 100vh;
}

.exit-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  text-align: center;
  background: rgba(116, 196, 255, 0.1);
  color: #74C4FF;
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.exit-hint:hover {
  opacity: 1;
}

/* Portrait Prompt (iOS) */
.portrait-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background, #0F0F0F);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prompt-content {
  text-align: center;
  padding: 2rem;
}

.rotate-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: rotate-hint 2s ease-in-out infinite;
}

.rotate-icon-img {
  width: auto;
  height: min(70vh, 500px);
  max-width: 90vw;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
  object-fit: contain;
}

@keyframes rotate-hint {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
}

.prompt-text {
  font-family: 'Roboto Mono';
  font-size: 1.5rem;
  color: #74C4FF;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.prompt-subtext {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  color: rgba(234, 234, 234, 0.6);
}

/* Long press indicator (mobile) */
.mobile-exit-button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 32px;
  height: 32px;
  background: rgba(15, 15, 15, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(234, 234, 234, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  touch-action: manipulation; /* Allow tap but prevent other gestures */
  -webkit-touch-callout: none; /* Prevent iOS context menu */
  -webkit-user-select: none;
  user-select: none;
}

.mobile-exit-button:active {
  background: rgba(15, 15, 15, 0.9);
  color: #74C4FF;
  transform: scale(1.1);
}

.mobile-exit-button svg {
  width: 16px;
  height: 16px;
}

/* Mobile Landscape Optimizations */
.live-mode.mobile-landscape {
  padding: 0;
  touch-action: none; /* Prevent iOS scrolling */
  -webkit-touch-callout: none; /* Prevent iOS context menu */
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
  overscroll-behavior: none; /* Prevent pull-to-refresh */
}

.live-mode.mobile-landscape .live-sliders-container {
  padding: 0.5rem;
  gap: 1.5rem; /* Increased spacing to fill screen */
  overflow: hidden;
  min-height: 0;
  height: 100dvh;
  height: 100vh;
  touch-action: pan-y; /* Allow vertical panning */
  border: none;
  outline: none;
}

.live-mode.mobile-landscape .live-slider-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 36px; /* Split difference - was 32px, now 36px */
  gap: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  touch-action: auto; /* Allow default touch behavior for slider */
  border: none;
  outline: none;
}

.live-mode.mobile-landscape .live-slider-track {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  border-radius: 8px;
  touch-action: none; /* Prevent default, we handle touch manually */
  -webkit-touch-callout: none;
  cursor: pointer;
  border: none;
  outline: none;
  box-shadow: none;
}

.live-mode.mobile-landscape .live-slider-input {
  pointer-events: none; /* Disable input interaction, use custom touch handlers */
  display: none; /* Hide completely in mobile mode */
}

.live-mode.mobile-landscape .center-marker-left,
.live-mode.mobile-landscape .center-marker-right {
  top: 50%; /* Use percentage for dynamic height */
}

.live-sliders-container {
  display: flex;
  flex: 1;
  gap: 1.75rem;
  padding: 3rem 1rem 1rem;
  justify-content: center;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 490px;
  border: none;
  outline: none;
}

.live-slider-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 42px;
  border: none;
  outline: none;
}

.live-slider-track {
  position: relative;
  width: 42px;
  height: 490px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: none;
}

/* Bipolar center markers - positioned outside track */
.center-marker-left,
.center-marker-right {
  position: absolute;
  top: 245px; /* Center of 490px track */
  transform: translateY(-50%);
  width: 3px;
  height: 25px;
  border-radius: 1.5px;
  z-index: 2;
  pointer-events: none;
  border: none;
  outline: none;
}

.center-marker-left {
  left: -6px;
}

.center-marker-right {
  right: -6px;
}

.live-slider-fill {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 1;
  border: none;
  outline: none;
}

.live-slider-cc-inside {
  position: absolute;
  top: 0.5rem;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(234, 234, 234, 0.8);
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  font-weight: 600;
  pointer-events: none;
  z-index: 2;
  border: none;
  outline: none;
}

.live-slider-input {
  touch-action: auto !important; /* Allow default range input behavior */
  -webkit-touch-callout: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 42px;
  height: 490px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 3;
  writing-mode: bt-lr;
  -webkit-writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  opacity: 0;
  border: none;
  outline: none;
}

.live-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 42px;
  height: 8px;
  background: transparent;
  cursor: pointer;
  border: none;
  opacity: 0;
}

.live-slider-input::-moz-range-thumb {
  width: 42px;
  height: 8px;
  background: transparent;
  cursor: pointer;
  border: none;
  opacity: 0;
}

.live-slider-input::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
  box-shadow: none;
}

.live-slider-input::-moz-range-track {
  background: transparent;
  border: none;
  box-shadow: none;
}

.live-cc-label {
  display: none; /* Hidden - CC numbers now shown inside sliders */
}

/* Landscape optimization for live mode */
@media (orientation: landscape) and (max-height: 600px) {
  .live-sliders-container {
    padding: 2rem 1rem 0.5rem;
  }
  
  .live-slider-track {
    min-height: 150px;
  }
}
</style>

