# Firmware Preset UUIDs Reference

This document lists the BLE characteristic UUIDs that need to be added to the KB1 firmware to support device preset management.

## Required BLE Characteristics

Add these UUIDs to your firmware's Constants.h file and implement the corresponding characteristics in your BLE service (`f22b99e8-81ab-4e46-abff-79a74a1f2ff3`):

### Preset Management Characteristics

```cpp
// Preset Save - Write current settings to a preset slot
// Format: [slot#(1 byte)][name(32 bytes)]
#define PRESET_SAVE_UUID "d3a7b321-0001-4000-8000-000000000009"

// Preset Load - Load settings from a preset slot  
// Format: [slot#(1 byte)]
#define PRESET_LOAD_UUID "d3a7b321-0001-4000-8000-00000000000a"

// Preset List - Read metadata for all 8 preset slots
// Format: 8 metadata entries × 40 bytes each = 320 bytes
// Each entry: [name(32)][timestamp(4)][isValid(1)][padding(3)]
#define PRESET_LIST_UUID "d3a7b321-0001-4000-8000-00000000000b"

// Preset Delete - Clear a preset slot
// Format: [slot#(1 byte)]
#define PRESET_DELETE_UUID "d3a7b321-0001-4000-8000-00000000000c"
```

## Data Formats

### Preset Save Command (Write)
```
Byte 0:      Slot number (0-7)
Bytes 1-32:  Preset name (UTF-8, null-terminated, max 32 bytes)
```

### Preset Load Command (Write)
```
Byte 0:      Slot number (0-7)
```

### Preset Delete Command (Write)
```
Byte 0:      Slot number (0-7)
```

### Preset List Response (Read)
```
For each of 8 slots (320 bytes total):
  Bytes 0-31:  Preset name (UTF-8, null-terminated, 32 bytes)
  Bytes 32-35: Unix timestamp (uint32_t, little-endian)
  Byte 36:     isValid flag (1 = slot has data, 0 = empty)
  Bytes 37-39: Padding (reserved for future use)
```

## Implementation Notes

1. **Slot Numbers**: Valid range is 0-7 (8 total slots)

2. **Preset Names**: 
   - Max 32 bytes (including null terminator)
   - UTF-8 encoded
   - Truncate if longer

3. **Timestamps**:
   - Unix timestamp (seconds since epoch)
   - Little-endian uint32_t
   - Updated when preset is saved

4. **Save Behavior**:
   - When PRESET_SAVE receives a write, save current device settings to the specified slot
   - Update metadata (name, timestamp, isValid=1)

5. **Load Behavior**:
   - When PRESET_LOAD receives a write, load settings from the specified slot to active memory
   - The web app will then read back all settings characteristics to update its UI

6. **Delete Behavior**:
   - Mark the slot as invalid (isValid=0)
   - Optionally clear the settings data

7. **List Behavior**:
   - Return metadata for all 8 slots
   - Empty slots should have isValid=0 and name="[Empty]" or empty string

## Testing

After implementing these characteristics, the web app will:

1. **On connection**: Automatically detect preset support and show the device preset UI
2. **Refresh button**: Read all preset metadata via PRESET_LIST characteristic
3. **Save**: Write to PRESET_SAVE with slot number + name
4. **Load**: Write slot number to PRESET_LOAD, then refresh settings
5. **Delete**: Write slot number to PRESET_DELETE

Check browser console for detailed logs during development.
