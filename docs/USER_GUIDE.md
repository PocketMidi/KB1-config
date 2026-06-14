# KB1 Config — User Guide

Complete reference for the KB1 Configurator web app. For setup, see the [README](../README.md).

---

## Getting Started

### Enable Bluetooth on KB1

**Before connecting**, Bluetooth must be enabled on the hardware:

1. Push both levers toward each other (left lever → right, right lever → left) and **hold for 3 seconds**
2. Watch for LED feedback:
   - Octave arrow LEDs turn on immediately (gesture detected)
   - Pink + blue LEDs pulse with increasing speed as you hold
   - **All LEDs turn off** = activation complete, release levers
3. Repeat the same gesture anytime to toggle Bluetooth on/off

The gesture is automatically cancelled if any keyboard key is pressed during the hold.

### Connecting the App

1. Ensure Bluetooth is enabled on your KB1 (see above)
2. Click **CONNECTED / DISCONNECTED** in the top-right navigation bar
3. Select your KB1 device from the browser's Bluetooth pairing dialog
4. Once connected, status turns blue and displays "CONNECTED"
5. Click **Load from Device** to fetch current settings from hardware

**First time users:** A helpful overlay will explain the connection process on your first visit.

### Saving Changes

After editing any setting, a bouncing amber arrow appears in the upper right. Click it to send all changes to the device. Settings are saved to device flash memory automatically.

### Evaluation Mode

No hardware? Click the KB1 logo **5 times rapidly** to enable Evaluation Mode. The app auto-connects with simulated device data — all settings, controls, and preset features work normally. Nothing is sent to hardware.

### Battery Calibration

**Uncalibrated Devices** show a gray `?` icon until calibrated. Once calibrated, flashing firmware preserves your calibration (NVS partition is backed up/restored).

**Why calibrate?** Firmware estimates battery life by tracking usage time — it has no direct voltage measurement. A fresh device doesn't know if the battery is at 100% or 20%.

**How to calibrate:**
1. **Power device ON first** (ensure it's running on battery, not plugged in)
2. **Then connect USB cable** to KB1 — pink/blue LEDs should pulse
3. Charge for **5+ hours total** — partial sessions accumulate automatically
4. **Computer sleep is OK** — after 3 minutes, charging continues even if computer sleeps
5. Battery meter will automatically mark as calibrated and show accurate percentage

**Why power on first?** The charge controller has two modes set at boot: If USB is connected when device boots, it enters bypass/power mode (device powered, battery NOT charging). If device boots on battery THEN computer USB is plugged in, it enters charging mode (device powered AND battery charging). **If LEDs don't pulse after connecting USB,** disconnect USB, wait 5 seconds, and reconnect.

**Partial charges will accumulate** — 3 hours today + 2.5 hours tomorrow = calibrated! The firmware tracks total charge time across sessions as long as it is connected to a computer. Only needs to happen **once**.

**LED Pulse Duration:** Charging LEDs pulse for the estimated time needed to reach 100% (minimum 30 minutes). Fresh battery = ~5 hours. Battery at 80% = ~1 hour. LEDs stop when estimated charge complete OR battery reaches 100%.

**Edge case:** If computer goes to sleep then you unplug USB, LEDs may pulse briefly until timer expires (they stop naturally when device loses power if actually unplugged).

**After calibration:** Battery estimates are accurate to ±10% based on measured consumption:
- Active mode: ~95mA drain
- Light sleep: ~2mA drain
- Deep sleep: ~0.014mA drain

**Manual Battery Adjustment:**
If battery % seems incorrect after calibration, you can manually override it:
1. Open Battery Status modal (battery icon in top-right)
2. Click "ADVANCED" section to expand
3. Use value control to set correct percentage
4. Click "Set Level" — this resets charge tracking and recalculates timing

⚠️ **Only use manual override if calibration is incorrect.** Proper calibration (5-hour charge) is more accurate.

---

## SETTINGS Tab

### KEYBOARD

**Scale Mode** — Play notes quantized to a musical scale:
- **Scale Type**: Chromatic, Major, Minor, Pentatonic, Blues, and more
- **Root Note**: C, C#, D, etc.
- **Key Layout**:
  - *Mapped Mode* — spaced keys, repeats at octave boundaries
  - *Efficient Mode* — dense layout, all 19 keys used

**Chord Mode** — Play full chords with each key press:
- **Chord Type**: Major, Minor, Diminished, Augmented, Sus2, Sus4, Power, Major7, Minor7, Dominant7
- **Chord/Strum Toggle**: All notes simultaneously, or cascaded strum
- **Velocity Spread** (Chord mode): 0–100% dynamic chord voicing
- **Strum Speed** (Strum mode): 5–100ms between cascaded notes

### PRESETS

Two storage systems for different use cases:

**Community Tab:**
- **Working Presets** — Unlimited presets saved to browser localStorage. Persist between sessions until browser cache is cleared. Create, rename, export, import, delete.
- **Browse Shared** — Load community presets from other users. Save any to your working presets to keep.

**Archive Tab:**
- **Device Slots** — 8 preset slots stored in device flash. Survive browser resets and cache clears. Load, Save, and Delete per slot.

**Recommended workflow:** Experiment in Working Presets → refine → archive favorites to device → share exceptional ones with the community.

### SYSTEM

**Power Management — Sleep Behavior:**

*Without web app connected:*
- After Light Sleep timeout (default: 5 min idle) → pulsing LEDs begin
- 90 seconds of LED pulsing (fixed warning period)
- Then device enters deep sleep
- Only touch sensor can wake from deep sleep

*With web app connected:*
- Keepalive pings from the app continuously reset sleep timers
- BLE Timeout setting controls how long after the last ping before sleep can proceed
- Once sleep is entered, BLE radio turns off — touch the sensor to wake before reconnecting

**Settings:**
- **Light Sleep**: Time until pulsing LEDs begin (3–10 minutes, default: 5 min)
- **BLE Timeout**: Keepalive grace period while app is connected (5–20 minutes, default: 10 min)
- Deep sleep occurs automatically 90 seconds after light sleep begins (fixed)

**Actions:**
- **Load from Device** — Fetch current settings from KB1 hardware
- **Reset to Defaults** — Restore factory default settings
- **Save to Device** — Apply and save all changes to flash

---

## CONTROLS Tab

All four controls (Lever 1, Lever 2, Press 1, Press 2) and the Touch sensor share a common set of parameters. Lever controls have the full set; push buttons and touch have a subset.

### CC Mapping (all controls)

- **CC Number**: Choose from the Polyend CC map with descriptions
- **CC Range**: Set min and max output values (0–127)

### Lever Settings

- **Step Size**: Quantize lever movement to discrete steps (0 = continuous)
- **Function Mode**:
  - *Unidirectional* — 0 to max, lever travels one way
  - *Bidirectional* — centered at rest, ± range
  - *Momentary* — returns to 0 on release
  - *Toggle* — alternates between min and max on press
- **Value Mode** — Controls how the output tracks the lever position:
  - *Jump* — output jumps immediately to lever position
  - *Hook* — output waits until lever catches the current value, then tracks
  - *Pickup* — output engages when lever reaches last-sent value
  - *Latch* — holds last value until lever moves significantly
- **Interpolation**: Smooth transitions on onset and offset
  - Onset time: 0–5000ms ramp-up
  - Offset time: 0–5000ms ramp-down
  - Curve: Linear, S-Curve, or Logarithmic

### Push Button Settings (Press 1 / Press 2)

- **Function Mode**: Trigger, Momentary, Toggle
- **Interpolation**: Onset/offset timing and curve type

### Touch Sensor Settings

- **Function Mode**: Trigger, Momentary
- **Threshold**: Touch sensitivity (0–65535, default: 24000 — lower = more sensitive)
- **Interpolation**: Onset/offset timing and curve type

---

## SLIDERS Tab

12 real-time MIDI CC performance sliders with dual mode support.

### FX / MIX Mode Toggle

Tap the **FX|MIX** button in the header to switch modes.

**FX Mode** (Performance Effects):
- CC 51–62
- Full bipolar/unipolar support
- 4 groups of 3 sliders, color coded

**MIX Mode** (Master Mixer for Polyend Tracker):
- *Global Mixer* (Sliders 1–4):
  - Delay Send (CC 79), Reverb Send (CC 80), Dry Level (CC 81), Line Level (CC 82)
  - Independent — no ganging
- *Track Mixer* (Sliders 5–12):
  - Track 1–8 volumes (CC 71–78)
  - Color coded: Red (1–2), Green (3–4), Cyan (5–6), Violet (7–8)
- Unipolar mode enforced (matches Polyend Tracker 0–127 specs)
- Mode persists across sessions

### Setup Mode (Portrait / Desktop)

- **Color Selection**: Tap color swatch or drag vertical picker (FX mode only — MIX uses fixed colors)
- **Momentary/Latched**: Tap **M** or **L** button — momentary springs back to 0 on release
- **Bipolar/Unipolar**: Tap **BI** or **UNI** (disabled in MIX mode)
- **Link Sliders**: Drag across link icons between sliders to gang them together

### Live Mode (Mobile — Landscape Fullscreen)

- **Enter**: Rotate device to landscape
- **Exit**: Swipe horizontally >100px, then rotate back to portrait
- All 12 sliders fill the screen for performance use
- Linked sliders move together
- Momentary sliders spring back on release with smooth animation

### iOS Note

Safari does not support Web Bluetooth. Use **[vBrowser](https://vbrowser.co)** for the best experience on iOS (reliable Bluetooth + accurate touch for all 12 sliders).

To set up vBrowser:
1. Download from the App Store
2. Go to iOS Settings → V Browser → Bluetooth → toggle ON
3. Open vBrowser and navigate to the KB1 Configurator URL

---

## Development Reference

### Protocol

BLE communication uses the KB1 firmware protocol:
- **Service UUID**: `f22b99e8-81ab-4e46-abff-79a74a1f2ff3`
- **MIDI characteristic**: `eb58b31b-d963-4c7d-9a11-e8aabec2fe32`
- **Keep-alive**: 60s interval, 10-minute firmware grace period
- Settings encoded as binary (little-endian int32) via `src/ble/kb1Protocol.ts`

**Preset BLE Characteristics:**
- SAVE: `d3a7b321-0001-4000-8000-000000000009`
- LOAD: `d3a7b321-0001-4000-8000-00000000000a`
- LIST: `d3a7b321-0001-4000-8000-00000000000b`
- DELETE: `d3a7b321-0001-4000-8000-00000000000c`

### Project Structure

```
src/
├── App.vue                   # Main app with tab navigation & connection management
├── main.ts                   # Application entry point
├── constants.ts              # App-wide constants
├── ble/
│   ├── bleClient.ts          # Web Bluetooth transport layer
│   └── kb1Protocol.ts        # KB1 device protocol encoding/decoding
├── pages/
│   ├── MobileScales.vue      # SETTINGS tab
│   ├── MobileControls.vue    # CONTROLS tab
│   └── MobileSliders.vue     # SLIDERS tab
├── components/               # Reusable UI components
├── composables/
│   └── useDeviceState.ts     # Central device state management
├── services/
│   └── midiBle.ts            # BLE MIDI real-time control
├── state/
│   ├── presets.ts            # Device preset storage
│   └── sliderPresets.ts      # Slider configuration storage
├── data/
│   └── ccMap.ts              # Polyend CC map with descriptions
└── styles/
    ├── slider.css            # Slider component styles
    └── themes/
        └── kb1.css           # KB1 theme variables & global styles
```

### Browser Compatibility

| Browser | Support |
|---|---|
| Chrome / Chromium 56+ | ✅ |
| Edge 79+ | ✅ |
| Opera 43+ | ✅ |
| vBrowser (iOS) | ✅ Recommended for iOS |
| Firefox | ❌ |
| Safari | ❌ |

Web Bluetooth requires HTTPS (except `localhost`). GitHub Pages provides HTTPS automatically.
