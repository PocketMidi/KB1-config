# KB1-Config Web App Development Guidelines

## Project Overview

Vue 3 + TypeScript web application for configuring KB1 MIDI controller via Web Bluetooth API.

## Critical Design Principles

### UI Philosophy
- **Muted & professional** - Subdued colors, no bright/flashy elements
- **Single task focus** - Only ONE primary (blue) button visible at a time
- **Never use emojis** - Arrow icons (↻) or simple text acceptable
- **Compact layouts** - Save vertical space wherever possible
- **Consistency** - Reference `.github/skills/kb1-design/` for complete standards

### Typography Standard (CRITICAL)

**ALL labels must use this exact style:**
```css
font-family: 'Roboto Mono';
font-size: 0.8125rem;        /* 13px - EXACT SIZE */
font-weight: 400;            /* Regular, NOT 600 */
text-transform: uppercase;
letter-spacing: 0.05em;
```

**User has emphasized this MANY times** - applies to:
- Setting labels (Sleep Timeout, BLE Timeout, etc.)
- Slot labels (Slot 1, Slot 2, etc.)
- Section headers within components

### Color System

**All colors use CSS variables** in `/src/styles/themes/kb1.css`:
- UI highlight (bronze): `--ui-highlight: #b9aa5f`
- Key active (green): `--key-active: #4b736a`
- System tan (secondary): `rgba(106, 104, 83, 0.35)`
- Muted green (interactive): `#5dad6b`

**To change colors globally:** Edit `/src/styles/themes/kb1.css` only.  
**Never hardcode colors** in component files (use CSS variables).

### Button Hierarchy

**RULE: Only ONE blue (primary) button per view**
- Primary action = Blue gradient
- Secondary actions = System tan
- Destructive actions = Amber gradient
- Success actions = Muted green (#5dad6b)

### Info Icons

**Use text "i", NOT SVG icons:**
```html
<span class="info-icon" @click.stop="showHelp('topic')">i</span>
```

User corrected this mistake April 2026 - **don't repeat!**

## BLE Protocol

### Device Settings Structure

All settings sent as **single 256-byte buffer** via BLE:
- Firmware expects atomic updates
- Invalid field = entire buffer rejected
- Always validate BEFORE sending

### Device Presets (8-Slot System)

**BLE Characteristics:**
- SAVE: `d3a7b321-0001-4000-8000-000000000009`
- LOAD: `d3a7b321-0001-4000-8000-00000000000a`
- LIST: `d3a7b321-0001-4000-8000-00000000000b`
- DELETE: `d3a7b321-0001-4000-8000-00000000000c`

**Format:**
- Slot number: 0-7
- Preset name: Max 32 chars
- Timestamp: Unix timestamp
- Empty slot name: `[Empty]`

### Connect Sequence (Order is CRITICAL)

In `useDeviceState.connect()`:
1. BLE connect + characteristic discovery
2. `refreshDevicePresets()` - preset list read
3. `handleLoad()` - read all 8 settings characteristics
4. `useBatteryStatus().initBatteryStatus()` - battery read LAST

**Why order matters:**
- DELETE char failure doesn't block SAVE/LOAD/LIST
- Battery read after BLE stack is free
- `lastDeviceLoadTime` prevents upload button activating on auto-load

## Vue Patterns

### Component Communication

**Use v-model for two-way binding:**
```vue
<!-- Parent -->
<LeverSettings v-model="localSettings.lever1" />

<!-- Child -->
const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
```

### State Management

**Global state:** `src/composables/useDeviceState.ts`
- Device connection status
- Current settings
- Preset management
- BLE operations

**Battery state:** `src/composables/useBatteryStatus.ts`
- Separate composable for battery monitoring
- `isAvailable` flag controls icon visibility

### TypeScript Interfaces

**Typed models for all settings:**
```typescript
interface LeverModel {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  stepSize: number;
  functionMode: number;
  // ... etc
}

interface DeviceSettings {
  lever1: LeverModel;
  lever2: LeverModel;
  // ... etc
}
```

## File Structure

```
src/
├── styles/
│   └── themes/
│       └── kb1.css               # Theme variables (designer editable)
│
├── components/
│   ├── LeverSettings.vue         # Reference component for patterns
│   ├── TouchSettings.vue
│   ├── ScaleSettings.vue
│   └── PresetManager.vue
│
├── composables/
│   ├── useDeviceState.ts         # Global state
│   └── useBatteryStatus.ts       # Battery monitoring
│
├── ble/
│   └── kb1Protocol.ts            # Protocol encoding/decoding
│
└── pages/
    └── DeviceSettings.vue        # Main settings page
```

## Code Review Checklist

Before submitting changes:

1. ✅ Used standard label style (0.8125rem, weight 400, Roboto Mono)
2. ✅ Only ONE blue button per view (others are tan/amber/green)
3. ✅ No emojis in UI (text "i" for info icons)
4. ✅ Used CSS variables for colors (not hardcoded hex values)
5. ✅ Validated settings BEFORE BLE write
6. ✅ Followed compact layout principles
7. ✅ Referenced `LeverSettings.vue` for consistency

## When In Doubt

- Check `.github/skills/kb1-design/` for complete design system
- Reference `LeverSettings.vue` for component patterns
- Ask before violating documented design standards

## Last Updated

April 22, 2026 - Migrated from scattered docs to .github/
