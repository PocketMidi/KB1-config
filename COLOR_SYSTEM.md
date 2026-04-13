# KB1 Color System

## Overview
All colors in the KB1 web app now use CSS custom properties (variables) defined in `/src/styles/themes/kb1.css`. This allows **single-point color changes** across the entire app.

## How to Change Colors

### Change UI Highlight Color Globally
Edit `/src/styles/themes/kb1.css`:
```css
--ui-highlight: #b9aa5f; /* Change this one value */
--ui-highlight-rgb: 185, 170, 95; /* Update RGB version to match */
--ui-highlight-hover: #c4b56d; /* Lighter variant for hovers */
--ui-highlight-active: #a89954; /* Darker variant for active states */
```

**Affects:**
- MIDI CC numbers (e.g., "MIDI CC 24")
- Velocity gradient bar in chord mode
- Voicing dots, octave meter bars
- Button active states
- Info icon hovers
- Battery warning color
- All accent highlights throughout the app

### Change Green/Key Colors Globally
Edit `/src/styles/themes/kb1.css`:
```css
--key-active: #4b736a; /* Active keyboard key background */
--key-active-rgb: 75, 115, 106; /* RGB version for rgba() */
--key-active-hover: #568073; /* Hover state */
--key-inactive: #222222; /* Inactive key background */
--key-inactive-rgb: 34, 34, 34; /* RGB version */
--key-text-active: #0F0F0F; /* Text on active keys */
--key-text-inactive: rgba(255, 255, 255, 0.4); /* Text on inactive keys */
```

**Affects:**
- Keyboard visualization keys
- Chromatic mode pulsing effect
- Primary action buttons
- Help modal buttons

## Color Variable Naming Convention

### Base Colors
Use the simplest name for the default/base color:
```css
--ui-highlight: #b9aa5f;
--key-active: #4b736a;
```

### State Variants
Add suffixes for interaction states:
```css
--ui-highlight-hover: /* Lighter - mouse hover */
--ui-highlight-active: /* Darker - button pressed */
```

### RGB Variants
For use with rgba():
```css
--ui-highlight-rgb: 160, 150, 105; /* No # prefix, comma-separated */
```
Usage: `rgba(var(--ui-highlight-rgb), 0.5)` for 50% opacity

## Using Variables in Components

### In CSS (Recommended)
```css
.my-element {
  color: var(--ui-highlight);
  background: rgba(var(--ui-highlight-rgb), 0.3);
}
```

### In JavaScript/TypeScript
For computed styles that need RGB values:
```typescript
const baseColor = 'var(--ui-highlight-rgb)' // Returns "160, 150, 105"
```

## Migration Status

✅ **Fully migrated to variables:**
- Accent/yellow colors (MIDI CC numbers, buttons, highlights)
- Keyboard key colors (green active keys, gray inactive keys)
- Battery status colors
- App-level accent highlights

⚠️ **Remaining hardcoded colors:**
- Individual slider colors in Performance mode (intentionally varied)
- LED color references (pink, blue - hardware-specific)
- Some component-specific grays and borders

## Adding New Colors

When adding a new color that might be reused:

1. Define it in `/src/styles/themes/kb1.css`:
```css
--my-new-color: #123456;
--my-new-color-rgb: 18, 52, 86;
--my-new-color-hover: #234567;
```

2. Add comment explaining usage:
```css
/* ===== New Feature Colors ===== */
--my-new-color: #123456; /* Used for XYZ feature */
```

3. Use in components:
```css
.my-component {
  color: var(--my-new-color);
}
```

## Benefits

✅ **Single source of truth** - Change one value, updates everywhere  
✅ **Consistent theming** - No more hunting for hardcoded colors  
✅ **Easy experimentation** - Test new colors instantly  
✅ **Maintainability** - Clear, documented color system  
✅ **Future-ready** - Easy to add light mode or alternate themes

## Quick Color Change Example

**Want to change accent color from bronze (#a09669) to purple (#8b5cf6)?**

1. Open `/src/styles/themes/kb1.css`
2. Change:
```css
--ui-highlight: #8b5cf6;
--ui-highlight-rgb: 139, 92, 246;
--ui-highlight-hover: #a78bfa;
--ui-highlight-active: #7c3aed;
```
3. Save file
4. Vite hot-reloads — entire app updates instantly!

---

**Last Updated:** April 13, 2026  
**Implemented by:** Color system refactor
