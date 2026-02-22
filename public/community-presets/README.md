# KB1 Community Presets

Welcome to the KB1 community presets repository! This is a collection of user-contributed device configurations that you can browse and load directly into your KB1.

## How to Use Community Presets

1. Visit https://pocketmidi.github.io/KB1-config
2. Navigate to Settings → Presets
3. Click the "Community" tab
4. Browse available presets and click "Load" to try them

## How to Share Your Preset

1. Configure your KB1 settings to your liking
2. Go to Settings → Presets
3. Click "Export" button
4. Choose "Community (Share)" option
5. Fill in metadata (name, description, tags - all optional)
6. Download the JSON file
7. Submit via:
   - **GitHub PR**: Fork this repo, add your preset to `presets/`, update `index.json`, submit PR
   - **Email**: Send the JSON file to [maintainer email]
   - **Issue**: Create a GitHub issue with the JSON attached

## Preset File Format

**Minimal (no metadata required):**
```json
{
  "settings": {
    // Full KB1 device settings
  }
}
```

**With metadata (optional):**
```json
{
  "metadata": {
    "name": "My Awesome Preset",
    "author": "username",
    "description": "Great for ambient pads",
    "tags": ["ambient", "pad", "atmospheric"],
    "date": "2026-02-22"
  },
  "settings": {
    // Full KB1 device settings
  }
}
```

## Guidelines

- Test your preset before sharing
- Use descriptive names
- Add tags to help others find your preset
- Be respectful and constructive
- No copyrighted content without permission

## File Naming

Use lowercase with hyphens: `preset-001-ambient-lead.json`

The index.json will be auto-generated when presets are added.

## Questions?

Open an issue on GitHub or reach out to the community!
