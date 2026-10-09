# KB1 Config - User Guide

Reference for the current Configurator interface. For installation and development, see the [README](../README.md).

The app's **USER GUIDE** covers SETUP, SETTINGS, and SLIDERS. The **i** buttons explain individual settings. For hardware setup, charging, and Tracker MIDI settings, use [KB1 Studio's User Guide](https://pocketmidi.github.io/KB1-studio/).

## Connect and Send

1. On KB1, squeeze both levers toward each other and hold for 3 seconds. LEDs pulse with increasing speed; release when all LEDs turn off. Repeat to disable Bluetooth. A held keyboard key cancels the gesture.
2. Tap the **Bluetooth status icon in the upper left**, then select KB1 in the browser pairing dialog.
3. Settings load automatically into KEYBOARD, LEVER, PRESS, and TOUCH. Disconnected controls remain visible but grayed out.
4. Edit settings, then tap the **bouncing amber Send arrow in the upper right** to send them to KB1.

Sending applies settings immediately and persists them to device flash. Applying a browser preset alone does not send it to hardware.

To reload the hardware's current settings, open SYSTEM and tap **REFRESH FROM DEVICE**. This replaces editable app settings and discards unsent edits.

### Evaluation Mode

Tap the top Configurator logo **5 times**, then enable **Evaluation Mode**. Repeat to disable it. This uses simulated device data; nothing is sent to KB1.

### Browser Requirements

Use Chrome, Edge, or Opera on desktop or Android. Web Bluetooth requires HTTPS, except on localhost. Safari and Firefox do not support this connection.

For iOS, [V Browser](https://vbrowser.co) is recommended. Enable its Bluetooth permission in iOS Settings before connecting.

## SETTINGS

KEYBOARD, LEVER 1/2, PRESS 1/2, TOUCH, PRESETS, and SYSTEM are sections within SETTINGS.

### KEYBOARD

- **Scale**: Select **SCALE TYPE** and **ROOT NOTE**. **Natural** preserves the keyboard layout; **Compact** packs scale notes together. Chromatic uses all 12 notes, so root-note and mapping controls are disabled.
- **Chord**: **CHORD TYPE** and **OCTAVE RANGE** (1, 2, or 3) define the notes. **Block** plays them together; **Strum** adds direction, rate, and swing.
- **Arp (Arpeggiator)**: Plays the selected notes one at a time. **Chord** mode uses chord type and octave range. **User** mode builds custom intervals instead. Pattern shape, rate, and swing control playback.

Use the keyboard section's **i** buttons for parameter-specific behavior and ranges.

### LEVER 1 / LEVER 2

- **CATEGORY** filters the available assignments; **PARAMETER** selects the MIDI **CC (Control Change)** or KB1 function.
- **UNI (Unipolar) / BI (Bipolar)** selects a one-way range or a range around a center value.
- The profile buttons are **Lin**, **Exp**, **Log**, **P&D**, and **Inc**:
  - **Lin (Linear)** changes evenly.
  - **Exp (Exponential)** emphasizes the upper range.
  - **Log (Logarithmic)** emphasizes the lower range.
  - **P&D (Peak & Decay)** rises then returns.
  - **Inc (Incremental)** advances in fixed steps.
- **MIN (Minimum) / MAX (Maximum)** sets the output range in the selected parameter's displayed units. Do not assume every assignment uses raw MIDI values 0-127.
- **DURATION** appears for timed profiles (100-2000 ms). **STEPS** appears for incremental profiles.
- **Pitch Bend** uses its own duration control (0-100 ms) instead of the normal range controls.

Available profiles, ranges, and toggles depend on the selected parameter. Disabled choices are intentional.

### PRESS 1 / PRESS 2

Press controls use the same **CATEGORY**, **PARAMETER**, and profile workflow as levers.

- **MOM (Momentary) / LAT (Latched)** selects return-on-release or hold behavior.
- Cycling parameters use **REV (Reverse) / FWD (Forward)** instead.
- **MIN / MAX**, **DURATION**, and the incremental step control adapt to the parameter and profile.
- Reset and Sustain assignments have dedicated behavior and lock unavailable controls.

### TOUCH

Touch uses **CATEGORY**, **PARAMETER**, **MIN**, and **MAX**, with three mode buttons:

- **Cont (Continuous)**: Sends a changing value across the selected range. **FWD** returns to Min on release; **REV** returns to Max.
- **Togg (Toggle)**: Alternates between Min and Max with each touch.
- **Gate (Momentary)**: Sends Max while touched and returns to Min on release.

Cycling parameters use **REV / FWD** and may lock the mode.

**THRESHOLD** is displayed from **0 to 100**: 0 is most sensitive, 100 is least sensitive. Raw firmware threshold values are not the app's user-facing scale. Touch does not expose the lever/press interpolation profile selector.

### PRESETS

The app displays **8 browser slots**, saved in this browser rather than on KB1. The first 4 contain overwritable STARTER presets.

- Tap a slot to save a snapshot of current keyboard, lever, press, touch, and system settings with a name and optional metadata. Slider configurations are captured separately in SLIDERS.
- **Apply** loads a preset into the app only and arms the Send arrow. Tap the bouncing amber Send arrow to send its settings to KB1.
- **NVS (Non-Volatile Storage)** is memory on KB1 that retains saved settings when powered off. This action uses the matching numbered slot on KB1. Device slots persist independently of browser storage.
- To save a browser preset to KB1, use **Apply → Send arrow → NVS**. The device save command snapshots KB1's current settings, not unsent browser edits.
- **Cloud** opens sharing for a populated slot, or community browsing for an empty slot.
- **Load Defaults** resets the editable configuration to defaults and arms the send arrow. It does not replace saved browser preset slots or send settings automatically.

Browser slots and device slots are distinct. Browser presets are local to this browser and device; clearing site data removes them, but does not erase presets already synced to KB1. Cloud sharing is a separate action, not an automatic backup.

If the browser slot is empty and the device slot is populated, **NVS** recalls that device preset on KB1 and imports it into the browser slot. If both slots have the same name, the current app reports them as synced without comparing their settings; a matching name is not verification that edited values were saved again.

### SYSTEM

- **SLEEP TIMEOUT**: 180-600 seconds (3-10 minutes), default 300 seconds. After idle timeout, LEDs warn for 90 seconds before deep sleep. Deep-sleep timing is automatic, not independently editable.
- **BLE TIMEOUT**: 300-1200 seconds (5-20 minutes), default 600 seconds. App keepalive traffic prevents sleep while configuring.
- **BATTERY MONITORING**: Shows or hides the battery icon; tracking continues in the background.
- **PARAMETER RESOLUTION**: Choose 1 or 5 for fine or faster adjustments. Some controls use their own fixed steps.
- **HAPTIC FEEDBACK**: Enable or disable supported vibration feedback; this setting is hidden on iOS.
- **HINTS & MESSAGES - RESTORE**: Re-enables dismissed hints.
- **CONFIG SETTINGS - REFRESH FROM DEVICE**: Replaces editable app settings with settings from the connected KB1, discarding unsent edits.

BLE is disabled when the device enters sleep. The touchpad is the wake source from deep sleep; wake KB1 before reconnecting.

### Battery Calibration

Enable **BATTERY MONITORING** to see the battery icon. An uncalibrated device displays `?`.

For tracked charging, start KB1 on battery **before** connecting USB to a computer. The current firmware accumulates about **5 hours total** across charging sessions, saving progress between sessions. USB connected at boot enters bypass/power mode instead; disconnect USB, power-cycle on battery, then reconnect to start a tracked session.

The meter is a time-based estimate, not a direct voltage measurement. Normal Studio firmware updates preserve calibration through NVS backup/restore; **Clear device data on update** intentionally erases it.

See [Studio's charging guide](https://pocketmidi.github.io/KB1-studio/) for LED signals and troubleshooting.

## SLIDERS

Twelve real-time performance sliders have three modes:

- **FX (Effects)**: Polyend Tracker effect slots, MIDI **CC (Control Change)** messages 51-62, with assignable effect parameters.
- **MIX**: Four master controls plus volume for eight tracks.
- **COMBO**: Custom assignments from the available FX, mix, and track CCs.

Each mode remembers its configuration in this browser, not in KB1 device preset slots.

Slider movements send MIDI values immediately while connected. Unlike settings edits, they do not require the Send arrow.

### Configure and Capture

- Tap a color swatch to identify or group sliders.
- Tap adjacent link icons to group sliders, or drag across links to change several.
- **UNI / BI** controls range where supported; **MOM / LAT** selects return-on-release or hold behavior.
- Tap the camera to capture the slider configuration as a named snapshot, separate from keyboard and control presets. Select saved snapshots from the menu; they are saved in this browser, not on KB1.
- Clearing site data removes these browser snapshots.
- **Clear** restores the current mode's default configuration.

### Live

Tap **GO LIVE**. Mobile devices prompt for landscape orientation; rotating alone is not the entry action. On desktop, Go Live does not enter fullscreen.

- Drag vertically to send values in real time. Linked sliders move together.
- Double-tap a latched slider to reset it.
- Triple-tap between sliders to reset all values.
- Swipe horizontally to exit Live mode.

## Maintaining This Guide

Keep labels and explanations aligned with [AppManual.vue](../src/components/AppManual.vue) and the current settings components. Verify behavior against the firmware when the app guide and implementation disagree. Keep hardware instructions in Studio's User Guide, developer setup in the repository READMEs, and protocol details in [kb1Protocol.ts](../src/ble/kb1Protocol.ts) and [bleClient.ts](../src/ble/bleClient.ts), rather than duplicating UUIDs or binary layouts here.
