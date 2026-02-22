# KB1 Config

KB1 Config is the official browser-based configuration and control application for the PocketMidi KB1 MIDI controller. This first release delivers a complete, wireless configuration environment with real-time performance control—configure keyboard modes, lever behavior, touch sensitivity, scales, power management, and control 12 performance sliders directly from your browser over Bluetooth Low Energy. No drivers, no apps to install.

## Getting Started

### Connecting to Your KB1 Device

1. Click the **CONNECTED / DISCONNECTED** status in the top-right navigation bar
2. Select your KB1 device from the browser's Bluetooth pairing dialog
3. Once connected, the status will turn blue and display "CONNECTED"
4. Click **Load from Device** to fetch current settings from your hardware

**First Time Users**: A helpful overlay will explain the connection process on your first visit.

**Disconnected State**: When disconnected, all controls are shown but grayed out. Click any control to see a prompt to connect.

### Using Performance Sliders (SLIDERS Tab)

- **Desktop/Portrait**: Tap color swatches, adjust settings, drag sliders vertically
- **Live Mode (Mobile)**: 
  - Rotate device to landscape → Sliders go fullscreen automatically
  - Control sliders with touch, swipe horizontally >100px to exit
- **Linking Sliders**: Press and drag across the "link" icons between sliders to gang them (shared color, settings, and values move together)

### Keyboard Modes (SETTINGS → KEYBOARD)

- **Scale Mode**: Keys play quantized notes from selected scale
- **Chord Mode**: Each key plays a full chord
  - Toggle Chord/Strum button to switch between simultaneous or cascaded notes
  - Adjust "Smart Slider" for velocity spread (Chord) or strum speed (Strum)

### Saving Changes

- Modify any setting → Orange dot appears in footer showing unsaved changes
- Click **Save to Device** → Changes applied to RAM and automatically saved to flash memory
- Footer actions stick to bottom for quick access: **Load**, **Reset**, **Save**

### Preset System

- **Community Tab**: Save working presets to browser (unlimited), browse and load shared presets from others
- **Archive Tab**: Store up to 8 presets on device flash memory (survives browser resets)

### SETTINGS Tab

The SETTINGS tab manages your device's global configuration:

**Keyboard Settings:**
- **Scale Mode**: Play quantized notes based on selected scale type
  - Choose from multiple scale types (Chromatic, Major, Minor, Pentatonic, Blues, etc.)
  - Set root note (C, C#, D, etc.)
  - Toggle between Natural (spaced) and Compact (dense) key mapping
- **Chord Mode**: Play full chords with each key press
  - Choose chord type: Major, Minor, Diminished, Augmented, Sus2, Sus4, Power, Major7, Minor7, Dominant7
  - Toggle between Chord (all notes together) and Strum (cascaded notes)
  - Adjust velocity spread (0-100%) for dynamic chord voicing
  - Set strum speed (5-100ms) for cascading notes

**System Settings (Power Management):**
- **Light Sleep**: Timeout before entering light sleep (30-300 seconds, default: 90s)
- **Deep Sleep**: Timeout before entering deep sleep (120-1800s, must be >lightSleep+30s, default: 330s)
- **BLE Timeout**: Bluetooth keep-alive timeout (30-600s, must be >=deepSleep+30s, default: 600s)

**Actions:**
- **Load from Device**: Fetch current settings from KB1 hardware
- **Reset to Defaults**: Restore factory default settings
- **Save to Device**: Apply changes to RAM and automatically save to flash memory

**Preset Manager:**

The Preset Manager offers two storage systems for different use cases:

**Community Tab (Work + Share):**
- **Your Working Presets**: Save unlimited presets to browser localStorage
  - Perfect for experimenting and iterating on configurations
  - Persists between sessions (until browser cache cleared)
  - Create, rename, export, import, and delete presets
  - Quick actions: + New, Import, Export
- **Browse Shared**: Load community presets shared by other users
  - Discover configurations from the community
  - Load to try instantly, save to your working presets to keep

**Archive Tab (Cold Storage):**
- **Stored on Device**: 8 preset slots in device flash memory
  - Survive browser resets and cache clears
  - Permanently stored on device hardware
  - Perfect for your final, go-to configurations
  - Load, Save, and Delete for each slot

**Workflow:** Experiment in Working Presets → Refine → Archive your favorites to device → Share exceptional ones with the community

### CONTROLS Tab

The CONTROLS tab configures your KB1's physical controls:

**Lever 1:**
- **CC Number**: Choose MIDI CC from Polyend map with descriptions
- **CC Range**: Set min/max values (0-127)
- **Step Size**: Quantize movement to steps
- **Function Mode**: Uni/Bi-directional, Momentary, Toggle
- **Value Mode**: Jump, Hook, Pickup, Latch
- **Interpolation**: Onset/offset timing (0-5000ms) and curve type (Linear, S-Curve, Logarithmic)

**Press 1:**
- **CC Number**: Choose MIDI CC with descriptions  
- **CC Range**: Set min/max values
- **Function Mode**: Trigger, Momentary, Toggle
- **Interpolation**: Onset/offset timing and curves

**Lever 2:**
- **CC Number**: Choose MIDI CC from Polyend map with descriptions
- **CC Range**: Set min/max values (0-127)
- **Step Size**: Quantize movement to steps
- **Function Mode**: Uni/Bi-directional, Momentary, Toggle
- **Value Mode**: Jump, Hook, Pickup, Latch
- **Interpolation**: Onset/offset timing (0-5000ms) and curve type (Linear, S-Curve, Logarithmic)

**Press 2:**
- **CC Number**: Choose MIDI CC with descriptions  
- **CC Range**: Set min/max values
- **Function Mode**: Trigger, Momentary, Toggle
- **Interpolation**: Onset/offset timing and curves

**Touch Sensor:**
- **CC Number**: Choose MIDI CC
- **CC Range**: Set output range
- **Function Mode**: Trigger, Momentary
- **Threshold**: Adjust touch sensitivity (0-65535, default: 24000, lower = more sensitive)

**Actions:**
- **Load from Device**: Read current control settings
- **Reset to Defaults**: Restore factory control settings
- **Save to Device**: Apply and persist all control settings

### SLIDERS Tab

The SLIDERS tab provides 12 customizable performance sliders for real-time MIDI CC control:

**Setup Mode** (Portrait or Desktop):
- **Color Selection**: Tap color swatch or drag vertical picker to choose from 12 colors
- **Bipolar/Unipolar Toggle**: Tap "BI" or "UNI" button to switch modes
- **Momentary/Latched Toggle**: Tap "M" or "L" button for spring-back or hold behavior
- **Link Sliders**: Drag across "link" icons between sliders to gang them (shared color, settings, values)
- **CC Assignment**: Each slider has its own CC number (51-62 by default)

**Live Mode** (Mobile - Landscape Fullscreen):
- **Enter**: Rotate device to landscape (iOS shows rotation animation)
- **Fullscreen**: Sliders fill the entire screen for performance
- **Control**: Drag sliders vertically to send MIDI CC in real-time
- **Exit**: Swipe horizontally >100px, then rotate back to portrait (iOS prompts with rotation animation)
- **Momentary**: Release touch on momentary sliders springs back to 0 with smooth animation

**Slider Features:**
- **Color Coded**: 12 rainbow colors for visual organization
- **Gang Control**: Linked sliders move together and share settings
- **Visual Feedback**: Colored fill shows current value with minimum visible height
- **Bipolar Mode**: Center line divider, both positive/negative fill from center
- **Unipolar Mode**: Bottom-up fill, 0-100% range

**Desktop Use:**
- All features work with mouse on desktop
- Setup and live modes available simultaneously
- Click and drag sliders for control

## Configuration Flexibility

The KB1 system offers **~10²⁷ total unique configurations** (approximately 1 octillion possible combinations). When focusing on the most commonly adjusted parameters—CC numbers, min/max values, function modes, and interpolation curves—there are still **~10¹⁰ to 10¹² practical combinations** (10-100 billion distinct configurations).

**Storage & Sharing:**
- Unlimited working presets in browser for experimentation
- 8 archive slots on device for permanent storage
- Community sharing for discovering and contributing configurations

The system is extraordinarily flexible for any performance or production workflow.

## Features

### SETTINGS Tab
- **Keyboard Settings** - Switch between Scale and Chord modes
- **Scale Mode** - Configure scale type, root note, and key mapping (Natural/Compact)
- **Chord Mode** - Choose chord type (Major, Minor, Diminished, etc.), toggle Chord/Strum, adjust velocity spread and strum speed
- **Power Management** - Customize light sleep, deep sleep, and Bluetooth timeout intervals
- **Preset Manager** - Two-tier system: Community tab (working presets + shared browsing) and Archive tab (device storage)
  - Working presets: unlimited browser storage for experimentation
  - Device archive: 8 slots in flash for permanent configurations
  - Browse community shared presets
- **Load from Device** - Read current settings from hardware
- **Reset to Defaults** - Restore factory settings
- **Save to Device** - Apply changes to RAM and persist to flash memory

### CONTROLS Tab
- **Lever 1** - Configure CC, range, step size, function mode, value mode, and interpolation curves
- **Press 1** - Set up push button behavior with CC mapping and timing settings
- **Lever 2** - Configure CC, range, step size, function mode, value mode, and interpolation curves
- **Press 2** - Set up push button behavior with CC mapping and timing settings
- **Touch Sensor** - Adjust sensitivity threshold and configure CC output
- **Real-time Preview** - See parameter descriptions from Polyend CC map
- **Accordion Interface** - Expandable sections with smooth animations

### SLIDERS Tab
- **12 Performance Sliders** - Real-time MIDI CC control with visual feedback
- **Color Coding** - Drag vertical color picker or tap to select from 12 rainbow colors
- **Bipolar/Unipolar** - Toggle between centered (-100 to +100) or bottom-up (0 to 100) modes
- **Momentary/Latched** - Spring-back or hold-value behavior
- **Link Sliders** - Drag across link icons to group sliders (same color, settings, and gang control)
- **Mobile Live Mode** - Fullscreen landscape mode with rotation animations
- **Desktop & Mobile** - Optimized for both touch and mouse input

### Connectivity
- **Web Bluetooth API** - Wireless BLE connection, no drivers needed
- **Connection Modals** - First-time intro and contextual prompts for disconnected state
- **Keep-Alive** - Automatic connection maintenance (60s ping interval)
- **Dev Mode** - Test UI without hardware (toggle in code)

### Design
- **KB1 Theme** - Custom color scheme matching device aesthetics
- **Roboto Mono Font** - Clean, technical typography
- **Sticky Navigation** - Tab bar stays visible while scrolling
- **Responsive Layout** - Mobile-first design that scales to desktop
- **Dark UI** - Easy on the eyes with subtle dividers and hover effects

## Technology Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **Web Bluetooth API** for device communication
- **GitHub Actions** for automated deployment

## Project Structure

```
src/
├── App.vue                   # Main app with tab navigation & connection management
├── main.ts                   # Application entry point
├── constants.ts              # App-wide constants
├── ble/
│   ├── bleClient.ts          # Web Bluetooth transport layer
│   └── kb1Protocol.ts        # KB1 device protocol encoding/decoding
├── pages/
│   ├── MobileScales.vue      # SETTINGS tab (scales, system, presets)
│   ├── MobileControls.vue    # CONTROLS tab (levers, touch sensor)
│   └── MobileSliders.vue     # SLIDERS tab (12 performance sliders)
├── components/
│   ├── AccordionSection.vue          # Expandable accordion container
│   ├── AnimatedBLEIcon.vue           # Bluetooth icon with breathing animation
│   ├── CCMappingCard.vue             # CC configuration card
│   ├── ConnectionStatus.vue          # Connection status indicator
│   ├── ContextualConnectionModal.vue # "Connect to use" modal
│   ├── FirstTimeOverlay.vue          # First-time user intro
│   ├── LeverSettings.vue             # Lever configuration component
│   ├── LeverPushSettings.vue         # Lever push configuration
│   ├── TouchSettings.vue             # Touch sensor settings
│   ├── ScaleSettings.vue             # Scale configuration
│   ├── SystemSettings.vue            # Power/timeout settings
│   ├── PresetManager.vue             # Preset save/load/manage
│   ├── PerformanceSliders.vue        # 12-slider performance interface
│   ├── NotePickerControl.vue         # Note selection dropdown
│   └── ValueControl.vue              # Numeric value input
├── composables/
│   └── useDeviceState.ts     # Central device state management
├── services/
│   └── midiBle.ts            # BLE MIDI real-time control
├── state/
│   ├── presets.ts            # Complete device preset storage
│   └── sliderPresets.ts      # Slider configuration storage
├── data/
│   └── ccMap.ts              # Polyend CC map with descriptions
└── styles/
    ├── slider.css            # Slider component styles
    └── themes/
        └── kb1.css           # KB1 theme variables & global styles
```

## Configuration Flexibility (Expanded)

The KB1 system offers **~10²⁷ total unique configurations** (approximately 1 octillion possible combinations). When focusing on the most commonly adjusted parameters—CC numbers, min/max values, function modes, and interpolation curves—there are still **~10¹⁰ to 10¹² practical combinations** (10-100 billion distinct configurations).

**Storage & Sharing:**
- Unlimited working presets in browser for experimentation and refinement
- 8 archive slots on device flash for permanent, reliable storage
- Community preset sharing via GitHub for discovering and contributing configurations

The system is extraordinarily flexible for any performance or production workflow, from live electronic music to studio production.

- Node.js 18+ and npm
- A browser with Web Bluetooth support (Chrome, Edge, Opera)
- HTTPS connection (required for Web Bluetooth API)
- KB1 hardware device (or enable Dev Mode for UI testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PocketMidi/KB1-config.git
cd KB1-config
```

2. Install dependencies:
```bash
npm install
```

3. **Configure Dev Mode** (optional - for testing without hardware):

   Edit `src/composables/useDeviceState.ts` line 17:
   ```typescript
   const DEV_MODE = true;   // Dev mode ON - simulates connection with mock data
   const DEV_MODE = false;  // Production mode - requires KB1 hardware
   ```

4. Run development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173` (or the URL shown in terminal)

**Note:** For Web Bluetooth to work in development, you may need to:
- Use `localhost` (works over HTTP)
- Or set up HTTPS for your dev server
- Or use Chrome flags for testing: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Development Notes

### Development Mode (Testing Without Hardware)

The app includes a **DEV_MODE** flag for testing the UI without a physical KB1 device:

**To toggle:**
- Edit `src/composables/useDeviceState.ts` line 17:
  ```typescript
  const DEV_MODE = true;   // Dev mode ON - simulates connection with mock data
  const DEV_MODE = false;  // Production mode - requires KB1 hardware
  ```

**When DEV_MODE is enabled:**
- App auto-connects on load with simulated device "KB1 (Dev Mode)"
- All settings and controls are populated with default mock data
- Changes are logged to console but not sent to hardware
- Useful for UI development, layout testing, and demos

**Before production deployment:**
- Set `DEV_MODE = false` to require real hardware connection
- Test with actual KB1 device to verify BLE communication

### KB1 Protocol Implementation

The BLE communication layer is fully implemented with the KB1 firmware protocol:

**BLE Configuration** (`src/ble/bleClient.ts`):
- Service UUID: `f22b99e8-81ab-4e46-abff-79a74a1f2ff3`
- Direct characteristic access for all settings (Lever, LeverPush, Touch, Scale, System)
- MIDI characteristic: `eb58b31b-d963-4c7d-9a11-e8aabec2fe32`
- Keep-alive characteristic maintains connection (60s interval, 10min firmware grace period)

**Protocol Encoding** (`src/ble/kb1Protocol.ts`):
- Binary encoding/decoding for all settings (little-endian int32)
- Settings read/written directly to BLE characteristics
- Validation and default value creation
- Type-safe interfaces for all device settings

### Browser Compatibility

Web Bluetooth API is supported in:
- ✅ Chrome/Chromium 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (requires flag)
- ❌ Safari (not supported)

For the best experience, use Chrome, Edge, or Opera.

### HTTPS Requirement

The Web Bluetooth API requires a secure context (HTTPS) except for `localhost`. When deploying:

- GitHub Pages provides HTTPS automatically
- Use a service with HTTPS support
- Or set up SSL certificates for your domain

## Deployment

### GitHub Pages (Automated)

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

**To enable:**

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to the `main` branch
4. The site will be available at `https://pocketmidi.github.io/KB1-config/`

### Manual Deployment

Build the project and deploy the `dist/` folder to any static hosting service that supports HTTPS.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with Vue 3, Vite, and the Web Bluetooth API to provide a seamless wireless configuration experience for the PocketMidi KB1 device.
