# KB1 Config Lab - Implementation Notes

## Project Overview

This is a complete browser-based MIDI editor for the PocketMidi KB1 device, built with Vue 3, Vite, and TypeScript, using the Web Bluetooth API for wireless communication.

## What's Been Implemented

### 1. Project Setup ✅
- Vue 3 with Composition API
- Vite build system
- TypeScript with strict type checking
- Web Bluetooth API types (@types/web-bluetooth)
- GitHub Actions deployment workflow

### 2. Architecture ✅

**BLE Transport Layer** (`src/ble/bleClient.ts`)
- Web Bluetooth API integration
- Connection/disconnection management
- Device discovery with filters
- GATT server communication
- Characteristic read/write/notify
- Error handling and status callbacks
- Clean singleton pattern

**KB1 Protocol Layer** (`src/ble/kb1Protocol.ts`)
- Message type definitions
- CC mapping data structures
- Device settings structures
- Encode/decode methods (stubbed, ready for implementation)
- Validation functions
- Default configuration generators

**State Management** (`src/composables/useDeviceState.ts`)
- Vue 3 Composition API composable
- Reactive state for connection, CC mappings, settings
- Centralized device operations
- BLE client integration
- Protocol integration

**UI Components**
- `ConnectionStatus.vue` - Visual connection indicator
- `CCMappingCard.vue` - Individual fader configuration card
- `MidiEditor.vue` - Main MIDI editor page with grid of faders
- `DeviceSettings.vue` - Device configuration page
- `App.vue` - Main app with header, navigation, and routing

### 3. Features ✅

**Connection Management**
- User gesture requirement (security)
- Device selection dialog
- Connection status indicator
- Disconnect functionality
- Browser compatibility detection
- Error handling and display

**MIDI Editor**
- 8 fader CC mapping cards (expandable)
- Per-fader configuration:
  - CC number (0-127)
  - MIDI channel (1-16)
  - Min/Max values (0-127)
- Actions:
  - Load from Device
  - Apply to Device
  - Save to Flash
- Disabled state when disconnected
- Change tracking

**Device Settings**
- Device name input
- MIDI channel selector
- Brightness slider (0-100%)
- Actions:
  - Load from Device
  - Apply to Device
  - Reset changes
  - Save to Flash
- Form validation
- Change tracking

### 4. Deployment Configuration ✅
- Vite config with relative paths for GitHub Pages
- GitHub Actions workflow for automatic deployment
- HTTPS-ready (required for Web Bluetooth)
- Production build optimization

## What Needs KB1-Specific Implementation

### 1. BLE UUIDs (Priority: HIGH)

**File:** `src/ble/bleClient.ts`

Replace these placeholders:
```typescript
const KB1_SERVICE_UUID = '00000000-0000-0000-0000-000000000000'; // TODO
const KB1_CHARACTERISTIC_UUID = '00000000-0000-0000-0000-000000000000'; // TODO
```

With actual KB1 UUIDs. Also update the device filter:
```typescript
filters: [
  { namePrefix: 'KB1' }, // Update with actual device name
  // { services: [KB1_SERVICE_UUID] }
],
```

### 2. Protocol Implementation (Priority: HIGH)

**File:** `src/ble/kb1Protocol.ts`

Implement the actual KB1 binary protocol:

**Encoding Methods:**
- `encodeGetCCMappings()` - Request CC mappings from device
- `encodeSetCCMapping(mapping)` - Send CC mapping to device
- `encodeGetSettings()` - Request device settings
- `encodeSetSettings(settings)` - Send device settings
- `encodeSaveToFlash()` - Command to save to persistent storage

**Decoding Methods:**
- `decodeMessage(data)` - Parse incoming messages
- `decodeCCMapping(data)` - Parse CC mapping response
- `decodeSettings(data)` - Parse settings response

**Message Types:**
Update `KB1MessageType` enum with actual message IDs from KB1 spec.

### 3. Additional Settings (Priority: MEDIUM)

**File:** `src/ble/kb1Protocol.ts`

Add KB1-specific settings to `DeviceSettings` interface:
```typescript
export interface DeviceSettings {
  deviceName: string;
  midiChannel: number;
  brightness: number;
  // TODO: Add KB1-specific settings:
  // - LED color modes
  // - Velocity curves
  // - Aftertouch sensitivity
  // - etc.
}
```

Update `src/pages/DeviceSettings.vue` to add UI controls for new settings.

### 4. Fader Count (Priority: LOW)

**File:** `src/composables/useDeviceState.ts`

Update the number of faders to match KB1 hardware:
```typescript
ccMappings.value = Array.from({ length: 8 }, (_, i) => 
  kb1Protocol.createDefaultCCMapping(i)
);
```

Change `8` to the actual number of faders on the KB1 device.

## Testing Checklist

Before integration with real KB1 hardware:

- [ ] Update all KB1_*_UUID constants with real values
- [ ] Implement all encode* methods with correct binary format
- [ ] Implement all decode* methods with correct binary parsing
- [ ] Test connection with actual KB1 device
- [ ] Verify CC mappings are correctly sent/received
- [ ] Verify device settings are correctly sent/received
- [ ] Test save to flash functionality
- [ ] Test disconnect/reconnect scenarios
- [ ] Test error handling (device out of range, etc.)
- [ ] Verify all MIDI channels work (1-16)
- [ ] Verify all CC numbers work (0-127)
- [ ] Test on different browsers (Chrome, Edge, Opera)
- [ ] Test on mobile devices (Android Chrome)
- [ ] Deploy to GitHub Pages and test over HTTPS

## Browser Compatibility

**Supported:**
- Chrome/Chromium 56+
- Edge 79+
- Opera 43+

**Not Supported:**
- Firefox (requires flag, experimental)
- Safari (not supported)

**Platform Support:**
- Windows ✅
- macOS ✅
- Linux ✅
- Android ✅ (Chrome)
- iOS ❌ (no Web Bluetooth support)

## Development Workflow

1. **Local Development:**
   ```bash
   npm install
   npm run dev
   ```
   Access at `http://localhost:5173`

2. **Production Build:**
   ```bash
   npm run build
   ```
   Output in `dist/` directory

3. **Preview Production:**
   ```bash
   npm run preview
   ```

4. **Deploy to GitHub Pages:**
   - Push to `main` branch
   - GitHub Actions automatically builds and deploys
   - Access at `https://pocketmidi.github.io/KB1-config/`

## Security Considerations

1. **User Gesture Requirement:**
   - Web Bluetooth API requires user interaction
   - "Connect Device" button satisfies this requirement

2. **HTTPS Requirement:**
   - Web Bluetooth only works over HTTPS (except localhost)
   - GitHub Pages provides HTTPS automatically

3. **Permissions:**
   - Browser requests Bluetooth permission from user
   - User must explicitly select device in pairing dialog

4. **Data Privacy:**
   - All communication is direct between browser and device
   - No data is sent to any server
   - All processing happens client-side

## Future Enhancements

Potential features to add after basic integration:

1. **Preset Management:**
   - Save/load multiple CC mapping presets
   - Export/import presets to JSON files
   - Preset library

2. **Advanced MIDI Features:**
   - Velocity curves
   - Aftertouch configuration
   - Program change mapping
   - SysEx support

3. **Visual Feedback:**
   - Live MIDI value display
   - Real-time fader position visualization
   - MIDI activity indicator

4. **Firmware Updates:**
   - OTA firmware update support
   - Version checking
   - Update progress indicator

5. **Analytics:**
   - Usage statistics (local only)
   - Error reporting
   - Device diagnostics

## Polyend Tracker Mini MIDI Integration

### MIDI Architecture Overview

The KB1 is designed to control the **Polyend Tracker Mini** via MIDI CC messages. Understanding the Tracker Mini's MIDI architecture is essential for proper implementation and user documentation.

#### MIDI Instruments (M01-M16)
- **Instruments 51-66** represent MIDI channels 1-16
- Tagged with 'M' in step configuration (e.g., M01 = MIDI Channel 1, M02 = MIDI Channel 2)
- Each MIDI instrument has dedicated parameters accessible in the Tracker's instrument menu

#### CC Output Slots (A-F)
Each MIDI instrument on the Tracker Mini has **6 configurable CC output slots** (A-F):
- CC slots are assigned in the instrument parameter page
- Each slot can be mapped to any standard MIDI CC number (0-127)
- Slots are triggered from step FX1 or FX2 using lowercase letters (a-f)
- Example: CC A assigned to CC#74 (filter cutoff), triggered with FX "a 50" sends value 50

**Common CC Assignments for Synthesis:**
- CC 1: Cutoff
- CC 3: Finetune  
- CC 5: Tune
- CC 7: Volume
- CC 9: Filter Type
- CC 11: Resonance
- CC 12: Overdrive
- CC 13: Bit Depth
- CC 14: Reverb Send
- CC 15: Delay Send

#### CC Input Mapping (Tracker Mini → KB1)
The Tracker Mini has **pre-defined CC destinations** for incoming messages:

**Performance Effects:**
- CC 41-48: Pattern Select for Tracks 1-8
- CC 51-62: Effect Slot Values (Slots 1-12, top row)

**Mixer Controls:**
- CC 71-78: Track Mixer Volume Levels (Tracks 1-8)
- CC 79: Master Delay Mix
- CC 80: Master Reverb Mix
- CC 81: Master Dry Mix
- CC 82: Master Line Input

**Synthesizer Mode:**
- CC 20-31: Volume envelope/automation controls
- CC 26-31: Panning envelope/automation controls
- CC 83-88: Cutoff envelope/automation controls
- CC 102-107: Wavetable Position automation
- CC 108-113: Granular Position automation
- CC 114-118: Finetune automation

### KB1 → Tracker Mini Control Flow

1. **KB1 Lever Movement** → Reads hardware position (0-1023 ADC)
2. **Lever Processing** → Applies profile curve (linear/exp/log/peak-decay/incremental)
3. **Range Mapping** → Maps to MIN/MAX range set by user
4. **MIDI CC Message** → Sends CC# on selected channel
5. **Tracker Receives** → Processes based on CC slot assignment (A-F) or direct parameter control
6. **Parameter Change** → Modifies synthesis parameter in real-time

### CSV Data Structure (`polyend-cc.csv`)

The application uses a CSV file to map Tracker Mini parameters:

**Categories:**
- GLOBAL: Master-level controls
- VOLUME: Envelope and amplitude controls
- PANNING: Stereo positioning
- CUTOFF: Filter frequency controls
- WAVETABLE Position: Wavetable navigation
- GRANULAR Position: Granular synthesis controls
- FINETUNE: Pitch modulation

**Parameters include:**
- Name, CC number, min/max values, default value
- Range examples:
  - Velocity: 0-100
  - Cutoff: 0-100
  - Finetune: -100 to +100
  - Tune: -24 to +24 semitones
  - Filter Type: 1-4 (discrete values)
  - Reverb/Delay Send: -40 to 0 dB

**Usage:**
- Parsed via Papa.parse library (`src/data/ccMap.ts`)
- Exposed to UI components for category/parameter selection
- Used in LeverSettings to populate CATEGORY and PARAMETER dropdowns
- Provides context for help system documentation

## Help System Implementation

### Architecture

The help system provides contextual guidance using **(?)** icons with modal dialogs.

#### Implementation Pattern

**State Management:**
```typescript
const showHelpModal = ref(false);
const helpContent = ref<{ title: string; description: string[] }>({ 
  title: '', 
  description: [''] 
});
```

**Help Content Storage:**
```typescript
const helpTexts = {
  topicName: {
    title: 'Topic Title',
    description: [
      'First paragraph explaining the concept.',
      'Second paragraph with examples or details.',
      'Third paragraph with usage guidance.'
    ]
  }
}
```

**Functions:**
```typescript
function showHelp(topic: string) {
  helpContent.value = helpTexts[topic];
  showHelpModal.value = true;
  triggerHaptic('soft');
}

function dismissHelp() {
  showHelpModal.value = false;
  triggerHaptic('soft');
}
```

**Template Structure:**
```vue
<!-- In label/heading -->
<span class="info-icon" @click.stop="showHelp('topicName')">?</span>

<!-- Modal overlay -->
<div v-if="showHelpModal" class="help-modal-overlay" @click="dismissHelp">
  <div class="help-modal" @click.stop>
    <div class="help-modal-header">
      <h3>{{ helpContent.title }}</h3>
      <button class="close-btn" @click="dismissHelp">×</button>
    </div>
    <div class="help-modal-body">
      <p v-for="(para, idx) in helpContent.description" :key="idx">{{ para }}</p>
    </div>
    <div class="help-modal-footer">
      <button class="got-it-btn" @click="dismissHelp">Got it</button>
    </div>
  </div>
</div>
```

#### CSS Styling Standards

**Info Icon:**
```css
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  font-size: 11px;
  margin-left: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.info-icon:hover {
  border-color: #0DC988;
  color: #0DC988;
}
```

**Modal Components:**
```css
.help-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-modal {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.help-modal-body {
  padding: 1rem;
  line-height: 1.6;
}

.help-modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.got-it-btn {
  background: #0DC988;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
}
```

### Implemented Help Topics

#### LeverSettings.vue

**CATEGORY:**
- Explains category grouping of Tracker Mini parameters
- Examples: Global, Volume, Cutoff, Wavetable Position
- Purpose: Filter available parameters

**PARAMETER:**
- Explains specific MIDI CC controls
- Describes how parameters send MIDI CC messages
- Notes about parameter ranges matching Tracker expectations

### Planned Help Topics

**LeverSettings.vue (Remaining):**
- UNI/BI Toggle: Unipolar vs. Bipolar range explanation
- Profile Curves: Linear, Exponential, Logarithmic, Peak & Decay, Incremental
- DURATION: Lever value change speed (100-2000ms)
- STEPS: Incremental mode step sizes (5%, 10%, 15%, 25%)
- MIN/MAX: Output range limiting

**LeverPushSettings.vue:**
- Apply same pattern to Press 1/Press 2 controls
- Explain momentary vs. toggle behavior
- CC mapping for button presses

**TouchSettings.vue:**
- Touch sensitivity and calibration
- Touch gesture types
- MIDI note vs. CC mode

**SystemSettings.vue:**
- Sleep timeout context
- BLE connection timeout
- Power management

**KeyboardSettings.vue:**
- Scale types and music theory
- Chord voicings
- Octave ranges

### User Preference Persistence

**localStorage Keys:**
- `kb1-reset-hint-disabled`: User permanently dismissed live mode reset hint
- `kb1-reset-hint-seen`: User has seen the reset hint at least once

**Restore Mechanism:**
Implemented in SystemSettings.vue:
```typescript
function resetHints() {
  const hintKeys = ['kb1-reset-hint-disabled', 'kb1-reset-hint-seen'];
  hintKeys.forEach(key => localStorage.removeItem(key));
  
  restoringHints.value = true;
  triggerHaptic('snap');
  
  setTimeout(() => {
    restoringHints.value = false;
  }, 600);
}
```

**UI Pattern:**
- RESTORE toggle button in SystemSettings
- Momentary green feedback (600ms)
- Clears all hint dismissal flags
- Allows users to see hints again after accidental dismissal

### Design Guidelines

**When to Add Help:**
1. Complex concepts (MIDI CC mapping, synthesis parameters)
2. Hardware integration details (Tracker Mini categories)
3. Non-obvious UI controls (UNI/BI toggle, profile curves)
4. Technical terms (bipolar, granular, portamento)
5. Settings with trade-offs (duration vs. responsiveness)

**Help Content Best Practices:**
1. Start with a clear definition
2. Provide concrete examples
3. Explain practical use cases
4. Reference hardware behavior (Tracker Mini specifics)
5. Keep descriptions to 2-3 paragraphs maximum
6. Use simple, conversational language
7. Avoid jargon unless explaining it

**Integration Checklist:**
- [ ] Add help icon next to confusing label/control
- [ ] Write 2-3 paragraph description array
- [ ] Test modal appears/dismisses correctly
- [ ] Verify haptic feedback triggers
- [ ] Ensure mobile-friendly (click.stop prevents overlay issues)
- [ ] Check text readability on dark theme
- [ ] Validate no TypeScript errors

## File Structure Reference

```
KB1-config/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── public/
│   └── vite.svg                # Vite logo
├── src/
│   ├── ble/
│   │   ├── bleClient.ts        # BLE transport layer
│   │   └── kb1Protocol.ts      # KB1 protocol
│   ├── components/
│   │   ├── CCMappingCard.vue   # Fader config card
│   │   └── ConnectionStatus.vue # Connection indicator
│   ├── composables/
│   │   └── useDeviceState.ts   # State management
│   ├── pages/
│   │   ├── MidiEditor.vue      # MIDI editor page
│   │   └── DeviceSettings.vue  # Settings page
│   ├── assets/
│   │   └── vue.svg             # Vue logo
│   ├── App.vue                 # Main app component
│   └── main.ts                 # Entry point
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tsconfig.app.json           # App TypeScript config
├── tsconfig.node.json          # Node TypeScript config
├── vite.config.ts              # Vite configuration
└── README.md                   # Documentation
```

## Support

For questions or issues:
1. Check the README.md for usage instructions
2. Review TODO comments in the code
3. Check browser console for errors
4. Verify Web Bluetooth API is supported
5. Ensure HTTPS is being used (except localhost)

## License

See LICENSE file for details.
