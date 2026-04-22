---
name: kb1-design
description: KB1 web app design system and UI standards. Use when designing components, updating colors/themes, implementing layouts, or ensuring visual consistency. Contains muted color palette, typography standards (Roboto Mono labels), button hierarchy (single blue primary), layout principles (compact/efficient), designer workflow (CSS-only theme system), and component patterns. Essential for maintaining the professional, subdued aesthetic.
---

# KB1 Web App Design System

Complete design standards and theming system for the KB1 Config Lab web application.

---

## Design Philosophy

**Core Principles:**
- **Muted & professional** - Subdued color palette, no bright/flashy elements
- **Single task focus** - Only ONE primary action visible at a time
- **Never use emojis** - Use arrow icons (↻) or simple text, no decorative symbols
- **Compact layouts** - Save vertical space wherever possible
- **Consistency** - Match existing component patterns (reference `LeverSettings.vue`)

---

## Color System

**All colors use CSS custom properties in `/src/styles/themes/kb1.css`** for single-point updates.

### UI Highlight (Accent Color)

**Bronze/Tan Accent:**
```css
--ui-highlight: #b9aa5f;                /* Base accent */
--ui-highlight-rgb: 185, 170, 95;       /* RGB for rgba() */
--ui-highlight-hover: #c4b56d;          /* Lighter hover */
--ui-highlight-active: #a89954;         /* Darker active */
```

**Affects:**
- MIDI CC numbers (e.g., "MIDI CC 24")
- Velocity gradient bar in chord mode
- Voicing dots, octave meter bars
- Button active states
- Info icon hovers
- Battery warning color
- All accent highlights throughout app

### Key Colors (Green Active Keys)

**Muted Green:**
```css
--key-active: #4b736a;                  /* Active keyboard key */
--key-active-rgb: 75, 115, 106;         /* RGB version */
--key-active-hover: #568073;            /* Hover state */
--key-inactive: #222222;                /* Inactive key */
--key-inactive-rgb: 34, 34, 34;         /* RGB version */
--key-text-active: #0F0F0F;            /* Text on active keys */
--key-text-inactive: rgba(255, 255, 255, 0.4); /* Text on inactive */
```

**Affects:**
- Keyboard visualization keys
- Chromatic mode pulsing effect
- Primary action buttons
- Help modal buttons

### System Colors

**System Tan (Secondary Controls):**
```css
background: rgba(106, 104, 83, 0.35);
border: rgba(106, 104, 83, 0.4);
```
```css
/* Hover state */
background: rgba(106, 104, 83, 0.6);
```

**Used for:**
- UNI/BI toggles
- Secondary action buttons (e.g., Sync Now)
- Accordion borders
- Collapsible section backgrounds

**Gray Text (Headers & Labels):**
- Primary: `#848484` - Section headers, accordion titles
- Secondary: `#9ca3af` - Detail labels, descriptions

**Blue (Primary Action):**
- Gradient: `linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%)`
- **RULE: Only ONE blue button per view**
- Used sparingly for main action (e.g., Calibrate button when uncalibrated)

**Amber/Warning (Destructive Actions):**
- Gradient: `linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)`
- Used for: Recalibrate, Reset actions

**Muted Green (Interactive Elements - April 2026 Standard):**
- Primary: `#5dad6b` (replaces old bright #0DC988)
- rgba: `rgba(93, 173, 107, 0.x)` for transparency
- Hover: `opacity: 0.9` instead of color change
- Used for: All "Got it" buttons, info icon hover, active states, checkboxes

**Purple/Pink (Meters & Progress):**
- Gradient: `linear-gradient(135deg, #a855f7 0%, #ec4899 100%)`
- Used for: Progress bars, sliders (speaker compensation, duration)

### Color Variable Naming Convention

**Base Colors:**
```css
--ui-highlight: #b9aa5f;      /* Simplest name for default */
--key-active: #4b736a;
```

**State Variants:**
```css
--ui-highlight-hover: /* Lighter - mouse hover */
--ui-highlight-active: /* Darker - button pressed */
```

**RGB Variants (for rgba()):**
```css
--ui-highlight-rgb: 185, 170, 95; /* No # prefix, comma-separated */
```

**Usage:**
```css
.my-element {
  color: var(--ui-highlight);
  background: rgba(var(--ui-highlight-rgb), 0.5); /* 50% opacity */
}
```

### Quick Color Change Example

**Want to change accent from bronze to purple?**

1. Open `/src/styles/themes/kb1.css`
2. Update:
```css
--ui-highlight: #8b5cf6;
--ui-highlight-rgb: 139, 92, 246;
--ui-highlight-hover: #a78bfa;
--ui-highlight-active: #7c3aed;
```
3. Save → Vite hot-reloads → entire app updates instantly!

---

## Typography

### Standard Label Style (CRITICAL - Apply Everywhere)

**The Rule:** ALL setting labels, slot labels, and section headers use this exact style.

```css
font-family: 'Roboto Mono';
font-size: 0.8125rem;        /* 13px - EXACT SIZE */
font-weight: 400;            /* Regular, NOT bold */
text-transform: uppercase;
letter-spacing: 0.05em;
```

**Usage:**
- ALL setting labels (Sleep Timeout, BLE Timeout, etc.)
- ALL slot/item labels (Slot 1, Slot 2, etc.)
- ALL section headers within components
- Color varies by context: `#848484` for gray labels, `#EAEAEA` for white

**CRITICAL Rules:**
- User has emphasized consistency MANY times
- Never deviate from `0.8125rem` / `13px`
- Never use bold (`font-weight: 600`) for labels
- Always use Roboto Mono for these labels
- Never use emojis in production UI
- Exception: Icon fonts or SVG icons are acceptable

**Common Mistake (April 2026):**
Initially used `font-weight: 600` and `0.875rem` for preset slot labels. User corrected: **ALL labels must use standard style** (`0.8125rem`, weight `400`).

### Font Sizing Scale

```css
--kb1-font-size-xs: 0.75rem;    /* 12px */
--kb1-font-size-sm: 0.875rem;   /* 14px */
--kb1-font-size-base: 1rem;      /* 16px */
--kb1-font-size-lg: 1.125rem;    /* 18px */
--kb1-font-size-xl: 1.25rem;     /* 20px */
--kb1-font-size-2xl: 1.5rem;     /* 24px */
```

---

## Info Icons & Help Modals

### Info Icon Standard (Text "i", NOT SVG)

**CRITICAL:** Use simple text "i" character, never create SVG-based info icons.

```html
<span class="info-icon" @click.stop="showHelp('topic')">i</span>
```

```css
.info-icon {
  text-transform: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 0.625rem;
  font-family: 'Roboto Mono', monospace;
  color: #848484;
  border: 1px solid #848484;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  margin-left: 0.5rem;
}

.info-icon:hover {
  color: #5dad6b;        /* Muted green */
  border-color: #5dad6b;
}
```

**Standard across:** `TouchSettings`, `SystemSettings`, `LeverSettings`, `PresetManager`  
**User corrected this mistake (April 2026) — don't repeat!**

### Help/Info Toast Buttons

```css
.help-modal-footer .btn-primary,
.got-it-btn {
  padding: 0.5rem 1.5rem;
  background: #5dad6b;   /* Muted green */
  color: #1A1A1A;
  border: none;
  border-radius: 4px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.help-modal-footer .btn-primary:hover {
  opacity: 0.9;
}
```

**Standard Help Toast Structure:**
```html
<div v-if="showHelpModal" class="help-modal-overlay" @click.stop="dismissHelp">
  <div class="help-modal" @click.stop>
    <div class="help-modal-header">
      <h3>Title</h3>
      <button class="close-btn" @click="dismissHelp">×</button>
    </div>
    <div class="help-modal-body">
      <p>Content with Roboto Mono font</p>
    </div>
    <div class="help-modal-footer">
      <button class="btn-primary" @click="dismissHelp">Got it</button>
    </div>
  </div>
</div>
```

---

## Button Hierarchy

**RULE: Only ONE primary (blue) button at a time**

- **Primary action** = Blue gradient button
- **Secondary actions** = Tan system color
- **Destructive actions** = Amber gradient
- Never multiple blue buttons competing for attention

**Example (Battery Modal):**
- Sync Now = Tan (secondary utility)
- Calibrate = Blue (primary when uncalibrated)
- Recalibrate = Amber (destructive when calibrated)

**Button Styles:**

**Primary (Blue):**
```css
background: linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%);
color: #ffffff;
```

**Secondary (System Tan):**
```css
background: rgba(106, 104, 83, 0.35);
border: 1px solid rgba(106, 104, 83, 0.4);
```
```css
/* Hover */
background: rgba(106, 104, 83, 0.6);
```

**Destructive (Amber/Warning):**
```css
background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
color: #1A1A1A;
```

**Success (Muted Green - "Got it" buttons):**
```css
background: #5dad6b;
color: #1A1A1A;
```
```css
/* Hover */
opacity: 0.9;
```

---

## Layout Principles

### Compact & Efficient

- Move large elements to headers when possible (e.g., battery icon)
- Remove unnecessary vertical spacing
- Combine related info on same line
- Use collapsible sections for detailed instructions

### Header Pattern

```html
<div class="modal-header">
  <h3>Title</h3>
  <span class="visual-indicator"><!-- Icon or status --></span>
  <button class="close-btn">×</button>
</div>
```

- Title + visual indicator in same line
- Close button (×) right-aligned
- Border separator below header

### Spacing Scale

```css
--kb1-spacing-xs: 0.25rem;  /* 4px */
--kb1-spacing-sm: 0.5rem;   /* 8px */
--kb1-spacing-md: 1rem;     /* 16px */
--kb1-spacing-lg: 1.5rem;   /* 24px */
--kb1-spacing-xl: 2rem;     /* 32px */
```

### Accordion/Collapsible Sections

```css
/* Border */
border: 1px solid rgba(106, 104, 83, 0.3);

/* Background */
background: rgba(106, 104, 83, 0.08); /* Very subtle */

/* Hover */
background: rgba(106, 104, 83, 0.15);

/* Text */
color: #848484;

/* Content background */
background: rgba(0, 0, 0, 0.2); /* Dark neutral */
```

---

## CSS-Only Theme System

### Overview

**Designer-friendly:** All visuals controlled through CSS variables in a single file.

- All theme variables defined in `/src/styles/themes/kb1.css`
- Imported once in `App.vue`
- Applied via `.theme-kb1` class on root element
- No JavaScript theme switching logic

### Available Theme Variables

**Panel Backgrounds:**
```css
--lever-panel-bg: url('/src/assets/ui/lever-panel.svg');
--lever-push-panel-bg: url('/src/assets/ui/lever-push-panel.svg');
--touch-panel-bg: url('/src/assets/ui/touch-panel.svg');
--scale-panel-bg: url('/src/assets/ui/scale-panel.svg');
```

**Fader Elements** (if custom faders added):
```css
--fader-track-bg: url('/src/assets/ui/fader-track.svg');
--fader-thumb-bg: url('/src/assets/ui/fader-thumb.svg');
--fader-track-height: 200px;
--fader-thumb-size: 24px;
```

### Designer Workflow

**Updating Visuals:**

1. **Export assets from Figma** to `src/assets/ui/`
   - Use SVG format (preferred) or PNG/WebP
   - Name files according to the variables above

2. **Edit `src/styles/themes/kb1.css`**
   - Update the URL paths to reference new assets
   - No code changes needed anywhere else!

3. **Preview changes**
   - Run `npm run dev`
   - Changes appear automatically in browser

**Example - Updating Panel Backgrounds:**

**Step 1:** Export from Figma
- Select lever panel design in Figma
- Export as SVG: `lever-panel.svg`
- Save to: `src/assets/ui/lever-panel.svg`

**Step 2:** Update theme CSS
```css
/* Before */
--lever-panel-bg: url('/src/assets/ui/lever-panel.svg');

/* After (if renamed) */
--lever-panel-bg: url('/src/assets/ui/lever-panel-new.svg');
```

**Step 3:** See changes — app automatically picks up new image!

### Asset Guidelines

**Image Formats:**
- **SVG** (recommended): Scalable, small file size, crisp at any resolution
- **PNG**: Good for photos or complex gradients
- **WebP**: Modern format with excellent compression

**Naming Convention:**
- ✅ `lever-panel-dark-mode.svg`
- ✅ `button-primary-hover.svg`
- ❌ `Panel1.svg`
- ❌ `image_final_v3.svg`

**Asset Organization:**
```
src/assets/ui/
├── panels/
│   ├── lever.svg
│   ├── lever-push.svg
│   └── touch.svg
├── buttons/
│   ├── primary.svg
│   └── secondary.svg
└── faders/
    ├── track.svg
    └── thumb.svg
```

**Colors vs Images:**
- Use **CSS variables** for solid colors (faster, easier to adjust)
- Use **images** for gradients, textures, or complex designs

---

## Component Consistency

### When Creating New Components

1. Check `LeverSettings.vue` for color reference
2. Use system tan for secondary controls
3. Use `#848484` for headers/labels
4. Ensure only ONE blue button if multiple actions exist
5. Match padding, spacing, and border-radius to existing components
6. Keep background subtle: `rgba(0, 0, 0, 0.3)` for slight depth

### Component-Level CSS Pattern

```vue
<style scoped>
.my-component {
  background: var(--settings-panel-bg, #242424);
  padding: var(--settings-panel-padding, 1.5rem);
  color: var(--ui-text-primary, #EAEAEA);
}

.my-component-label {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #848484;
}
</style>
```

**Benefits:**
- Components are self-contained
- Visual updates happen in one place (`kb1.css`)
- Fallback values provide graceful degradation
- References theme without hardcoding values

---

## Recent Design Updates & Lessons Learned

### Battery Modal Redesign (v1.4.0)

**Changes:**
- Title shortened: "Estimated Battery Status" → "Battery Status"
- Battery icon moved to header (saves vertical space)
- Sync Now button changed from blue → tan (secondary action)
- Charging Instructions accordion changed from green → system tan
- Removed spinning arrow emoji from Sync button

**Lessons Learned:**
- User immediately noticed emoji was "hard to tell what it is" — **remove all emojis**
- Multiple blue buttons confuse priority — **use system tan for secondary**
- Green accordion stood out too much — **use system tan for consistency**
- Large battery display could be compacted to header — **saved space**

**Result:** Consistent with app-wide muted, professional aesthetic

### Preset Manager Design (v1.7.0)

**8-Slot System Layout:**
- Slot labels: "SLOT 1", "SLOT 2", etc. in **standard label style**
- Preset names below slot labels (secondary text, smaller)
- Clear (×) button next to name when preset exists
- Action buttons: Activate, NVS, Cloud (always visible, disabled when N/A)
- Indicators: Small dots in button corners (green=NVS saved, blue=cloud exported)
- Subtitle: "X of 8 slots" in accordion header

**Consistency Fix (April 2026):**
- Initially used `font-weight: 600` and `0.875rem` for slot labels
- User corrected: **ALL labels must use standard style** (`0.8125rem`, weight `400`)
- **Reminder:** Don't forget the system-wide label standard!

---

## Migration Status

**✅ Fully migrated to CSS variables:**
- Accent/bronze colors (MIDI CC numbers, buttons, highlights)
- Keyboard key colors (green active keys, gray inactive keys)
- Battery status colors
- App-level accent highlights

**⚠️ Remaining hardcoded colors (intentional):**
- Individual slider colors in Performance mode (intentionally varied)
- LED color references (pink, blue - hardware-specific)
- Some component-specific grays and borders

---

## File Structure

```
KB1-config/
├── src/
│   ├── styles/
│   │   └── themes/
│   │       └── kb1.css           # Single source of truth for theme
│   │
│   ├── assets/
│   │   └── ui/                   # Designer-managed assets
│   │       ├── .gitkeep
│   │       └── (SVG/PNG files from Figma)
│   │
│   ├── components/
│   │   ├── LeverSettings.vue     # Reference component for colors
│   │   ├── TouchSettings.vue
│   │   ├── ScaleSettings.vue
│   │   └── PresetManager.vue
│   │
│   └── App.vue                   # Root component (applies theme)
│
├── COLOR_SYSTEM.md               # Legacy doc (migrate to this skill)
├── DESIGNER_WORKFLOW.md          # Legacy doc (migrate to this skill)
└── THEME_IMPLEMENTATION.md       # Legacy doc (migrate to this skill)
```

---

## Troubleshooting

### My color change didn't work
- ✅ Check you're editing `/src/styles/themes/kb1.css`, not component files
- ✅ Verify RGB variant matches hex value (use online converter)
- ✅ Clear browser cache or hard refresh (Cmd+Shift+R)

### My image doesn't appear
- ✅ Check file path in CSS matches actual file location
- ✅ Make sure file extension is correct (`.svg` vs `.SVG`)
- ✅ Verify image file isn't corrupted

### Label font size looks wrong
- ✅ Double-check you're using `0.8125rem` (13px), not `0.875rem` (14px)
- ✅ Confirm `font-weight: 400`, not `600`
- ✅ Verify Roboto Mono is loaded

### Need new theme variables?
Ask a developer to:
1. Add the variable to `/src/styles/themes/kb1.css`
2. Update this documentation
3. Modify the relevant component to use the new variable

**Goal:** Keep all visual updates in CSS file, never in component code!

---

## Revision History

- **April 22, 2026:** Migrated from scattered docs to `.github/skills/kb1-design/`
- **April 2026:** Preset Manager consistency fix, info icon standardization, muted green standard
- **March 2026:** Battery Modal redesign, removed emojis, single-blue-button rule enforced
- **February 2026:** Typography standards documented, Roboto Mono label system established
- **January 2026:** CSS-only theme system implemented, color variables centralized
