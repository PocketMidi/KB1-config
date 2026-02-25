# KB1 Config

KB1 Config is the official browser-based configuration and control application for the PocketMidi KB1 MIDI controller. This first release delivers a complete, wireless configuration environment with real-time performance control—configure keyboard modes, lever behavior, touch sensitivity, scales, power management, and control 12 performance sliders directly from your browser over Bluetooth Low Energy. No drivers, no apps to install.

## Getting Started

### Enable Bluetooth on Your KB1 Hardware

**IMPORTANT**: Before connecting to the web app, you must enable Bluetooth on your KB1 device.

**How to Enable Bluetooth:**
1. **Hold both octave buttons** (up + down) simultaneously for **3 seconds**
2. **Watch for LED confirmation:**
   - Fast blinking (pink + blue LEDs) = **Bluetooth enabled** ✓
   - Slow blinking = Bluetooth disabled
3. Repeat the same process anytime to toggle Bluetooth on/off

**Note:** The web app cannot detect your device unless Bluetooth is enabled on the hardware.

### Evaluation Mode (Optional)

Want to explore the interface without hardware? Enable **Evaluation Mode** to interact with all settings using simulated device data—perfect for learning the interface, testing configurations, or exploring community presets before purchasing.

**To Enable**: Click the KB1 Configurator title (top-center) 5 times rapidly. A modal will appear to toggle the mode on/off.

**What Works**: All interface features, settings adjustments, preset management, and community preset browsing work normally with mock data.

**What Doesn't**: No Bluetooth hardware communication (requires real KB1 hardware).

### Connecting to Your KB1 Device

**Browser Connection:**
1. Ensure Bluetooth is enabled on your KB1 hardware (see above)
2. Click the **CONNECTED / DISCONNECTED** status in the top-right navigation bar
3. Select your KB1 device from the browser's Bluetooth pairing dialog
4. Once connected, the status will turn blue and display "CONNECTED"
5. Click **Load from Device** to fetch current settings from your hardware

**First Time Users**: A helpful overlay will explain the connection process on your first visit.

**Disconnected State**: When disconnected, all controls are shown but grayed out. Click any control to see a prompt to connect.

---

## SETTINGS Tab

### KEYBOARD

**Scale Mode** — Play quantized notes based on selected scale type:
- Choose from multiple scale types (Chromatic, Major, Minor, Pentatonic, Blues, etc.)
- Set root note (C, C#, D, etc.)
- Toggle between Mapped Mode (spaced keys repeat) and Efficient Mode (dense, all keys used)

**Chord Mode** — Play full chords with each key press:
- Choose chord type: Major, Minor, Diminished, Augmented, Sus2, Sus4, Power, Major7, Minor7, Dominant7
- Toggle between Chord Mode (all notes together) and Strum Mode (cascaded notes)
- Adjust velocity spread (0-100%) for dynamic chord voicing
- Set strum speed (5-100ms) for cascading notes

### LEVER 1

Configure the first lever for continuous control:
- **CC Number**: Choose MIDI CC from Polyend map with descriptions
- **CC Range**: Set min/max values (0-127)
- **Step Size**: Quantize movement to steps
- **Function Mode**: Uni/Bi-directional, Momentary, Toggle
- **Value Mode**: Jump, Hook, Pickup, Latch
- **Interpolation**: Onset/offset timing (0-5000ms) and curve type (Linear, S-Curve, Logarithmic)

### PRESS 1

Configure the first push button:
- **CC Number**: Choose MIDI CC with descriptions
- **CC Range**: Set min/max values
- **Function Mode**: Trigger, Momentary, Toggle
- **Interpolation**: Onset/offset timing and curves

### LEVER 2

Configure the second lever for continuous control:
- **CC Number**: Choose MIDI CC from Polyend map with descriptions
- **CC Range**: Set min/max values (0-127)
- **Step Size**: Quantize movement to steps
- **Function Mode**: Uni/Bi-directional, Momentary, Toggle
- **Value Mode**: Jump, Hook, Pickup, Latch
- **Interpolation**: Onset/offset timing (0-5000ms) and curve type (Linear, S-Curve, Logarithmic)

### PRESS 2

Configure the second push button:
- **CC Number**: Choose MIDI CC with descriptions
- **CC Range**: Set min/max values
- **Function Mode**: Trigger, Momentary, Toggle
- **Interpolation**: Onset/offset timing and curves

### TOUCH

Configure the capacitive touch sensor:
- **CC Number**: Choose MIDI CC
- **CC Range**: Set output range
- **Function Mode**: Trigger, Momentary
- **Threshold**: Adjust touch sensitivity (0-65535, default: 24000, lower = more sensitive)

### PRESETS

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

### SYSTEM

**Power Management** — Customize sleep and timeout intervals:
- **Light Sleep**: Timeout before entering light sleep (30-300 seconds, default: 90s)
- **Deep Sleep**: Timeout before entering deep sleep (120-1800s, must be >lightSleep+30s, default: 330s)
- **BLE Timeout**: Bluetooth keep-alive timeout (30-600s, must be >=deepSleep+30s, default: 600s)

**Actions:**
- **Load from Device**: Fetch current settings from KB1 hardware
- **Reset to Defaults**: Restore factory default settings
- **Save to Device**: Apply changes to RAM and automatically save to flash memory

---

## SLIDERS Tab

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

**iOS Bluefy App Compatibility:**

When using the Bluefy app on iOS devices, touch offset calibration is automatically applied to ensure accurate slider control. Due to browser-specific touch handling differences, you may notice one slider appears grayed out in live mode—this is normal and expected behavior:

- **11 active sliders**: Depending on your calibration, either the first (CC51) or last (CC62) slider may be grayed out
- **Grayed slider is unreachable**: The grayed slider cannot be controlled but this ensures the remaining 11 sliders respond accurately
- **Automatic compensation**: The app detects Bluefy and adjusts touch input to match your finger position
- **Calibration available**: Expand the calibration section in live mode to fine-tune touch offset if needed

This limitation only affects Bluefy on iOS. Other browsers (Chrome, Edge on desktop/Android) display all 12 sliders as fully active.

## Configuration Flexibility

The KB1 system offers **~10²⁷ total unique configurations** (approximately 1 octillion possible combinations). When focusing on the most commonly adjusted parameters—CC numbers, min/max values, function modes, and interpolation curves—there are still **~10¹⁰ to 10¹² practical combinations** (10-100 billion distinct configurations).

**Storage & Sharing:**
- Unlimited working presets in browser for experimentation
- 8 archive slots on device for permanent storage
- Community sharing for discovering and contributing configurations

The system is extraordinarily flexible for any performance or production workflow.

## Features

### Core Capabilities
- **Wireless Configuration** - Full device setup via Web Bluetooth (no drivers, no apps)
- **Real-time Control** - 12 performance sliders with MIDI CC output
- **Flexible Presets** - Unlimited browser storage + 8 device archive slots
- **Community Sharing** - Browse and load presets from other users
- **Evaluation Mode** - Test interface without hardware (click logo 5x)

### Device Configuration
- **Keyboard Modes** - Scale and Chord modes with extensive customization
- **Physical Controls** - Configure 2 levers, 2 push buttons, and touch sensor
- **Power Management** - Customize sleep timeouts and Bluetooth keep-alive
- **MIDI Mapping** - Polyend CC map with descriptions for all controls

### Interface Features
- **KB1 Theme** - Custom dark UI with light/dark theme toggle
- **Responsive Design** - Mobile-first, scales to desktop
- **Live Mode** - Fullscreen landscape sliders for performance
- **Connection Modals** - First-time intro and contextual connection prompts
- **Visual Feedback** - Real-time parameter updates and unsaved change indicators

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
- KB1 hardware device (or enable Evaluation Mode for UI testing)

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

3. Run development server:
```bash
npm run dev
```

4. **Optional - Evaluation Mode**: To test the UI without hardware, open the app and click the KB1 logo (top-left) 5 times rapidly.

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
### Evaluation Mode

To test the interface without KB1 hardware:

1. Open the app in your browser
2. Click the KB1 logo (top-left corner) 5 times rapidly
3. A modal will appear - toggle Evaluation Mode on

**When Evaluation Mode is enabled:**
- App auto-connects with simulated device "KB1 (Evaluation Mode)"
- All settings and controls are populated with default mock data
- Changes are logged to console but not sent to hardware
- Perfect for exploring the UI, testing configurations, and browsing community presets

**Note**: Evaluation Mode state persists in browser localStorage and can be toggled on/off anytime via the logo clicks.

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
- ✅ Bluefy (iOS) - Web Bluetooth wrapper for iOS devices
- ❌ Firefox (requires flag)
- ❌ Safari (not supported)

**iOS Users:** Safari does not support Web Bluetooth. Use the [Bluefy app](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) (available on the App Store) for Web Bluetooth access on iOS devices.

**Note:** When using Bluefy on iOS, the live mode sliders include automatic touch offset compensation. You may see one slider grayed out (either CC51 or CC62) - this is normal behavior to ensure accurate touch control for the remaining 11 sliders. See the SLIDERS section above for details.

For the best experience, use Chrome, Edge, or Opera on desktop/Android.

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
