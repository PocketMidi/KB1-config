# Presets Folder

This folder gets uploaded to `public_html/presets/` on pocketmidi.com and contains all community-shared KB1 presets.

## Files

- **`.htaccess`** - Enables CORS headers so GitHub Pages can fetch JSON files cross-origin
- **`index.json`** - Catalog of all available presets (auto-updated by upload-preset.php)
- **`preset_*.json`** - Individual preset files (uploaded by users via the Cloud dialog)

## Deployment

1. Create `presets/` folder in `public_html/`
2. Upload `.htaccess` to enable CORS
3. Create empty `index.json`: `{"presets":[]}`
4. Upload-preset.php will populate it automatically

## CORS Note

The `.htaccess` file is critical - without it, browsers will block cross-origin requests from GitHub Pages to pocketmidi.com. It adds these headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Content-Type: application/json`

## Structure

After users upload presets, this folder will contain:

```
presets/
├── .htaccess
├── index.json
├── preset_1776052180876_l9dlftxzk.json
├── preset_1776052194512_xyz789.json
└── ... (more user-uploaded presets)
```
