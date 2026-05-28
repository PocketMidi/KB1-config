# KB1 Config

[![Traffic](https://img.shields.io/badge/analytics-umami-blue)](https://cloud.umami.is/analytics/us/share/X00Oso9T1qydknsS)

Browser-based configuration and control app for the PocketMidi KB1 MIDI controller. Configure keyboard modes, lever & touch pad behavior, power management — plus 12 real-time performance sliders with FX/MIX modes for Polyend Tracker integration. All wirelessly over Bluetooth. No drivers, no install.

**Live app:** [pocketmidi.github.io/KB1-config](https://pocketmidi.github.io/KB1-config)

See the [firmware release notes](https://github.com/PocketMidi/KB1/tree/main/firmware) for the latest features and changelog.

## Requirements

- **Chrome, Edge, or Opera** on Android or desktop (Web Bluetooth required)
- **iOS:** Safari does not support Web Bluetooth — recommend [vBrowser](https://vbrowser.co)


## Quick Start

### 1. Enable Bluetooth on KB1

Squeeze both levers together and hold for 3 seconds. LEDs pulse with increasing speed — when pulsing stops, Bluetooth is active; release the levers. The gesture is cancelled if any key is pressed during the hold. Repeat the same gesture to disable Bluetooth.

### 2. Connect

Tap the **Bluetooth status icon** in the upper left. Select KB1 from the browser's pairing dialog. Once connected, settings load automatically from the device and populate all KEYBOARD, LEVER, PRESS, and TOUCH values. When disconnected, controls remain visible but grayed out — tap any control for a prompt to connect.

### 3. Edit & Send

Change any settings under KEYBOARD, LEVER, PRESS, or TOUCH. When ready, tap the bouncing amber arrow in the upper right to send all changes to KB1. Changes are applied to device RAM immediately.

### 4. Presets

The first 4 of 8 slots are pre-filled with STARTER presets that can be overwritten. Tap any slot to save a snapshot of current settings and give it a name, author, and optional description. **Apply** loads a preset into the app and arms the amber send arrow. **NVS** syncs the slot to the matching slot on KB1 — these persist on the hardware independently of the app. **Cloud** opens a community space to share your preset or browse and load presets uploaded by other KB1 users. **Load Defaults** restores all factory starter presets.

## Tabs

- **SETTINGS** — Keyboard mode (Scale/Chord), lever/press/touch CC mapping, presets, and system/power settings
- **SLIDERS** — 12 real-time performance sliders with FX/MIX/COMBO modes

## Sliders

### Modes

- **FX** — Controls 12 performance effects (CC 51–62)
- **MIX** — Controls master mix levels: 4 global mixer controls plus individual volume for 8 tracks
- **COMBO** — Assign any CC freely to each slider

Mode selection persists in browser cache.

### Setup

Tap a color swatch to change it. Link icons gang sliders together — tap one link icon, or drag across multiple to link a range. Linked sliders move together and share settings. Toggle **UNI/BI** for unipolar or bipolar range. Toggle **MOM/LAT** for spring-back or hold behavior.

### Live Mode

Press **GO LIVE** and rotate your device to landscape — all 12 sliders go fullscreen for performance use. Drag vertically to send MIDI CC in real time. To exit: swipe horizontally across the screen (more than ~100px), then rotate back to portrait. On desktop, GO LIVE does not enter fullscreen — setup and live mode are visible simultaneously.

→ [Full user guide with all settings documented](docs/USER_GUIDE.md)

## Battery Calibration

After flashing firmware, the battery meter shows a `?` until calibrated. Charge continuously for 5.5+ hours in one uninterrupted session — do not unplug early or the timer resets to zero. Only needs to happen once.

## Evaluation Mode

No hardware? Click the KB1 logo **5× rapidly** to enable Evaluation Mode — full UI exploration with simulated device data.

## Development

**Requirements:** Node.js 18+, Chrome/Edge/Opera

```bash
git clone https://github.com/PocketMidi/KB1-config.git
cd KB1-config
npm install
npm run dev       # http://localhost:5173
npm run build     # Output to dist/
```

Web Bluetooth works on `localhost` without HTTPS.

## Deployment

Includes a GitHub Actions workflow that auto-deploys to GitHub Pages on push to `main`. Go to Settings → Pages → set Source to "GitHub Actions".

## Technology

Vue 3 · TypeScript · Vite · Web Bluetooth API

## License

See [LICENSE](LICENSE).
