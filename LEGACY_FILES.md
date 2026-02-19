# Legacy Files

This document tracks files that are not currently used in the active application but are preserved for reference or potential future use.

## Legacy Pages (Not Currently Used)

The following pages in `src/pages/` are **not actively used** in the current application:

### DeviceSettings.vue
- **Status**: Legacy / Reference Only
- **Purpose**: Original desktop-oriented settings page
- **Replaced by**: `MobileScales.vue` (mobile-first redesign)
- **Notes**: Contains accordion-based settings UI that was refactored for mobile

### MidiEditor.vue
- **Status**: Legacy / Reference Only  
- **Purpose**: Grid-based MIDI CC mapping editor
- **Replaced by**: Functionality distributed across mobile pages
- **Notes**: Desktop-focused CC mapping interface

### LandingPage.vue
- **Status**: Legacy / Reference Only
- **Purpose**: Original landing page with settings panel + sliders panel
- **Replaced by**: `App.vue` with mobile-first tab navigation
- **Dependencies**: Uses `SlidersPanel.vue` which is also legacy

## Legacy Components (Not Currently Used)

### SlidersPanel.vue
- **Status**: Legacy / Reference Only
- **Purpose**: Desktop slider panel component
- **Used by**: `LandingPage.vue` (also legacy)
- **Replaced by**: `PerformanceSliders.vue` in `MobileSliders.vue`
- **Notes**: Original desktop slider interface before mobile redesign

## Current Active Architecture

The application currently uses:
- **App.vue** - Main app with tab navigation
- **Pages:**
  - `MobileControls.vue` - CONTROLS tab
  - `MobileScales.vue` - SETTINGS tab  
  - `MobileSliders.vue` - SLIDERS tab
- **Components:** All components in `src/components/` (except those noted as legacy)

## Recommendation

These legacy files can be:
1. **Kept as reference** - Useful for understanding design evolution
2. **Moved to archive** - If you want to clean up the src tree
3. **Deleted** - If confident the code won't be needed

Current recommendation: **Keep as reference** for now, as they contain working implementations that could be useful if desktop layouts are revisited.
