---
name: kb1-vue-patterns
description: KB1-Config Vue 3 architecture patterns and lessons learned. Use when implementing cross-component state updates, adding watchers, wiring up new interactions between components, or debugging reactive state that isn't updating. Contains proven patterns for computed setters, local snapshot architecture, and cross-component side effects.
---

# KB1-Config Vue 3 Patterns

Architectural patterns and lessons learned from the KB1-Config web app.

---

## Local Snapshot Architecture

Each page (`MobileScales.vue`, `DeviceSettings.vue`) maintains a `localSettings` ref — a deep copy of `deviceSettings` from `useDeviceState`. This snapshot pattern means:

- Changes are staged locally before BLE send
- `hasChanges` flag tracks unsaved state
- `localSettings` only syncs from `deviceSettings` when `!hasChanges`

**Consequence:** Watchers on `deviceSettings` in a page only fire after a BLE load/connect. They do NOT fire when the user toggles UI controls (those only update `localSettings`).

---

## Cross-Component Side Effects — Do It At The Source

### The Problem
When a user action in component A (e.g. `KeyboardSettings`) needs to update data in component B (e.g. lever CC numbers), you might reach for a global signal ref. **Don't.** It introduces initialization bugs (default value = no watcher fire on first toggle) and puts logic in the wrong place.

### The Solution
Find the component that **owns both the trigger and the target data in the same `localSettings`**, and put the side-effect logic directly in the setter/handler where the state changes.

### KB1 Example: BLOCK|STRUM Auto-Switches Lever Parameter

The BLOCK|STRUM toggle fires in `KeyboardSettings.vue` → emits `update:modelValue` → handled by the `keyboardModel` computed setter in `MobileScales.vue`. Both `chord.strumEnabled` (trigger) and `lever1/lever2.ccNumber` (target) live in `MobileScales`'s `localSettings`. So the logic goes in the setter:

```typescript
// In keyboardModel computed setter (MobileScales.vue):
const strumChanged = localSettings.value.chord.strumEnabled !== v.chord.strumEnabled;
localSettings.value.chord.strumEnabled = v.chord.strumEnabled;

if (strumChanged) {
  const targetCC = v.chord.strumEnabled ? 200 : 203; // Strum=Rate, Block=Velocity Spread
  const isKB1Expr = (cc: number) => ccMapByNumber.value.get(cc)?.category === 'KB1 Expression';
  if (isKB1Expr(localSettings.value.lever1.ccNumber)) {
    localSettings.value.lever1 = { ...localSettings.value.lever1, ccNumber: targetCC };
  }
  if (isKB1Expr(localSettings.value.lever2.ccNumber)) {
    localSettings.value.lever2 = { ...localSettings.value.lever2, ccNumber: targetCC };
  }
}
```

**Guard:** Only switch lever if it's already on a "KB1 Expression" category CC — don't override user's custom MIDI assignments.

### Anti-Pattern: Global Signal Ref

```typescript
// ❌ This was tried and failed:
// useDeviceState.ts
const liveStrumEnabled = ref(false); // Wrong: initializes to false, not actual device state

// DeviceSettings.vue
watch(liveStrumEnabled, (strumEnabled) => { ... }); // Wrong: DeviceSettings doesn't own lever data
```

Problems:
1. `ref(false)` — if device loads with strum enabled, first toggle fires no change
2. Logic placed in `DeviceSettings.vue` — but levers are owned by `MobileScales.vue`
3. Adds cross-composable coupling for no benefit

---

## Computed v-model Pattern

For two-way binding with side effects in child components:

```vue
<!-- Parent passes v-model -->
<KeyboardSettings v-model="keyboardModel" />

<!-- In parent script -->
const keyboardModel = computed({
  get: () => ({ ... }),
  set: (v) => {
    // ALL side effects go here — this is the single point of truth
    localSettings.value.chord.strumEnabled = v.chord.strumEnabled;
    // ... auto-switch levers, etc.
    markChanged();
  }
});
```

Child emits `update:modelValue` → parent computed setter fires → single place for all reactions.

---

## Component Ownership Map

| Data | Owned By | Notes |
|------|----------|-------|
| `localSettings.lever1/lever2` | `MobileScales.vue` | Lever CC, function mode, etc. |
| `localSettings.chord.*` | `MobileScales.vue` | strum, play mode, chord type, etc. |
| `localSettings.touch*` | `MobileScales.vue` | Touch pad settings |
| `localSettings.lever1/lever2` (system settings) | `DeviceSettings.vue` | Separate instance — sleep, BLE timeout, etc. |
| `deviceSettings` | `useDeviceState.ts` | Source of truth after BLE load |

**Note:** `MobileScales.vue` and `DeviceSettings.vue` each have their own `localSettings` snapshot. They do not share it.

---

## isUpdatingInternally Guard — CRITICAL RULES

Components like `LeverSettings.vue` and `LeverPushSettings.vue` use an `isUpdatingInternally` flag to prevent watcher loops:

```typescript
const isUpdatingInternally = ref(false)

watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  // ... mutate model.value ...
  isUpdatingInternally.value = false  // ← MUST reset before returning
}, { immediate: true })
```

### Rule 1: ALWAYS reset the flag before the watcher exits

Every code path through the watcher must call `isUpdatingInternally.value = false`. If any path is missing the reset, the flag is permanently `true` after the first run and **all other watchers guarded by this flag will silently no-op forever** (category changes, filteredOptions auto-select, etc.).

**This is what locked Lever 1 and Press 1 in v2.0.0** — the `watch(ccNumber)` in `LeverSettings.vue` set `isUpdatingInternally = true` on mount (via `{ immediate: true }`) but never reset it. All subsequent category picker changes were silently ignored.

### Rule 2: Exit special modes when CC changes away

When adding a locked/special-mode CC (like CC 208 = Pitch Bend, CC 209 = Sustain), the same `watch(ccNumber)` watcher must also handle the exit path — i.e., what happens when the user picks a *different* CC while the locked mode is active. Without the exit path, `functionMode` stays at the special value and the UI remains locked.

```typescript
// ✅ Correct pattern:
if (cc === 208) {
  // enter pitch bend mode
  model.value = { ...model.value, functionMode: 3, ... }
} else if (model.value.functionMode === 3) {
  // EXIT pitch bend mode when leaving CC 208
  model.value = { ...model.value, functionMode: 0, valueMode: VALUE_MODE_UNIPOLAR }
}
isUpdatingInternally.value = false  // ← always at the end
```

### Where This Guard Is Used (track all instances)

| File | Guard Scope | Special modes requiring exit path |
|------|-------------|-----------------------------------|
| `LeverSettings.vue` | `watch(ccNumber)`, `watch(ccMapByNumber.size)`, `watch(selectedCategory)` | CC 208 → `functionMode 3` (Pitch Bend) |
| `LeverPushSettings.vue` | `watch(ccNumber)`, `watch(ccMapByNumber.size)`, `watch(selectedCategory)`, `watch(functionMode)` | CC 209 → `functionMode 4` (Sustain); Reset → `functionMode 5` |

**Whenever a new special locked mode is added to either component, update this table and add the exit path in `watch(ccNumber)`.**

---

## PatternBuilder Double-Emit Race — CRITICAL

### The Problem

`PatternBuilder.vue`'s `selectBuildMode(mode)` fires **two emits in the same synchronous tick**:

1. `selectedMode.value = mode` → `emit('update:mode', mode)` → parent's `arpBuildMode.set()` fires
2. `intervals.value = [...]` → `emit('update:modelValue', intervals)` → parent's `arpIntervals.set()` fires

Between these two calls, `model.value` in `KeyboardSettings.vue` has **not** updated — Vue's reactivity round-trip through `MobileScales` hasn't completed. So the second emit reads **stale** `model.value`.

### What Goes Wrong

If `arpBuildMode.set()` correctly writes `chord.strumPattern = 3` (updown/bounce), then `arpIntervals.set()` fires immediately after with stale `model.value` where `chord.strumPattern` is still the *old* value — and overwrites the correct pattern with the old one. Result: pattern appears to change in the UI but the old value is sent over BLE.

### The Fix

**Any setter that handles state touched by PatternBuilder must use `latestArp` (a local ref) instead of `model.value` for volatile fields.** `latestArp` is updated synchronously before each emit, so it always reflects the current in-flight state even when the parent hasn't round-tripped yet.

```typescript
// ❌ WRONG — reads stale model.value when second emit fires:
const arpIntervals = computed({
  set: (v: number[]) => {
    latestArp.value.intervals = v
    const updated = { ...model.value }
    updated.chord = { ...updated.chord, strumIntervals: v }  // strumPattern is stale!
    emit('update:modelValue', updated)
  }
})

// ✅ CORRECT — re-reads volatile fields from latestArp:
const arpIntervals = computed({
  set: (v: number[]) => {
    latestArp.value.intervals = v
    const updated = { ...model.value }
    updated.chord = {
      ...updated.chord,
      strumIntervals: v,
      strumPattern: buildModeToStrumPattern(latestArp.value.buildMode, latestArp.value.userMode),
      buildMode: latestArp.value.buildMode
    }
    emit('update:modelValue', updated)
  }
})
```

### General Rule

> **In any setter that can be called as the second of two rapid emits from the same user action, read all correlated state from the local ref (`latestArp`, `latestChord`), not from `model.value`.**

This applies to: `arpIntervals`, `arpBuildMode`, `arpSwingValue`, and any future arp setters in `KeyboardSettings.vue`.
