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

## Removed Legacy Files (April 2026)

The following legacy files were removed during codebase cleanup as they had broken imports and were documented as not actively used:

### LandingPage.vue (Removed)
- **Status**: Removed - had broken imports to deleted SettingsPanel.vue
- **Purpose**: Original landing page with settings panel + sliders panel
- **Replaced by**: `App.vue` with mobile-first tab navigation

### SlidersPanel.vue (Removed)
- **Status**: Removed - had broken imports to deleted GroupMorph.vue and SettingsPanel.vue
- **Purpose**: Desktop slider panel component
- **Replaced by**: `PerformanceSliders.vue` in `MobileSliders.vue`

### SliderControl.vue (Removed)
- **Status**: Removed - only used by deleted SlidersPanel.vue
- **Purpose**: Individual slider control component for desktop interface
- **Replaced by**: Slider controls in `PerformanceSliders.vue`

### SnapshotBar.vue (Removed)
- **Status**: Removed - only used by deleted SlidersPanel.vue
- **Purpose**: Snapshot/preset bar for desktop sliders
- **Replaced by**: Preset functionality in mobile interface

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
