# Deployment Checklist: Cloud Preset Upload

## Step 1: Server Setup (pocketmidi.com)

### 1.1 Upload PHP Script
- [ ] Log into cPanel: https://sv31.byethost31.org:2083
- [ ] Navigate to File Manager
- [ ] Go to `public_html/`
- [ ] Upload `server/upload-preset.php` from this repo
- [ ] Verify file is accessible at: https://pocketmidi.com/upload-preset.php

### 1.2 Create Presets Directory
- [ ] In `public_html/`, create new folder: `presets`
- [ ] Set folder permissions to `755` (drwxr-xr-x)
- [ ] Upload `server/presets/.htaccess` to `public_html/presets/` (enables CORS)
- [ ] Create `index.json` inside `presets/` with content: `{"presets":[]}`
- [ ] Set `index.json` permissions to `644` (-rw-r--r--)

### 1.3 Verify Structure
```
public_html/
├── upload-preset.php   ← Upload endpoint
├── presets/
│   ├── .htaccess       ← CORS headers for JSON files
│   └── index.json      ← Preset catalog (starts empty)
└── KB1-config/         ← Your existing web app
```

## Step 2: Test Server Endpoint

### 2.1 Test with curl (from your terminal)
```bash
curl -X POST https://pocketmidi.com/upload-preset.php \
  -H "Content-Type: application/json" \
  -d '{
    "id": "preset_test_12345",
    "metadata": {
      "name": "Test Preset",
      "author": "Admin",
      "date": "2026-04-12",
      "description": "Testing upload endpoint"
    },
    "settings": {
      "lever1": {"ccNumber": 74, "min": 0, "max": 127}
    }
  }'
```

**Expected response:**
```json
{
  "success": true,
  "id": "preset_test_12345",
  "filename": "preset_test_12345.json",
  "url": "https://pocketmidi.com/presets/preset_test_12345.json"
}
```

### 2.2 Verify Files Created
- [ ] Check `public_html/presets/preset_test_12345.json` exists
- [ ] Check `public_html/presets/index.json` contains the test preset
- [ ] Test URL works: https://pocketmidi.com/presets/preset_test_12345.json

## Step 3: Frontend Configuration

### 3.1 Verify Constants
File: `src/constants.ts`
```typescript
export const PRESET_UPLOAD_ENDPOINT = 'https://pocketmidi.com/upload-preset.php';
```

- [ ] Constant is set correctly
- [ ] No trailing slash on URL

### 3.2 Build and Deploy
```bash
cd KB1-config
npm run build
# Upload dist/ contents to public_html/KB1-config/
```

## Step 4: Test End-to-End

### 4.1 Test from Web Interface
- [ ] Open https://pocketmidi.com/KB1-config/
- [ ] Connect to KB1 device via BLE
- [ ] Save a preset to a slot
- [ ] Click "Cloud" button on that slot
- [ ] Click "Export Current Preset to Cloud"
- [ ] Fill in metadata form:
  - Name: "My First Cloud Preset"
  - Author: Your name
  - Description: "Testing cloud upload"
  - Tags: "test, first"
- [ ] Click "Export"
- [ ] Should see success toast: "Preset uploaded to community library!"
- [ ] Blue cloud dot should appear on that slot

### 4.2 Verify Upload
- [ ] Check `presets/` folder has new file
- [ ] Check `index.json` contains new entry
- [ ] Test loading: Open Cloud dialog, should see your preset
- [ ] Test import: Load your uploaded preset into another slot

## Step 4.3: Clean Up Duplicate Names (If Needed)

**Note:** The upload script now automatically replaces presets with the same name. If you have duplicates from before this update:

1. **List all presets by name:**
   ```bash
   # In cPanel File Manager or Terminal
   cd public_html/presets
   for f in preset_*.json; do 
     echo "$f: $(cat "$f" | grep -o '"name":"[^"]*"')"; 
   done
   ```

2. **Delete old duplicate files:**
   ```bash
   rm preset_1712893200_abc123.json  # Old "Wild Eagle"
   rm preset_1776052180876_xyz.json  # Old "Fire Pulse"
   ```

3. **Update index.json:** Remove corresponding entries manually or re-upload the preset to let it auto-sync

## Step 5: Security (Optional but Recommended)

### 5.1 Add API Key
```bash
# Generate key
openssl rand -hex 16
```

- [ ] Copy generated key
- [ ] Edit `upload-preset.php`, uncomment API key section
- [ ] Paste key into `define('API_KEY', '...');`
- [ ] Update `PresetManager.vue` to include key in headers
- [ ] Rebuild and redeploy frontend

### 5.2 Restrict CORS
Edit `upload-preset.php`:
```php
header('Access-Control-Allow-Origin: https://pocketmidi.com');
```

## Step 6: Monitor & Maintain

### 6.1 Check Upload Activity
- [ ] View cPanel access logs for POST requests
- [ ] Check preset count: `ls -1 presets/*.json | wc -l`
- [ ] Review `index.json` periodically

### 6.2 Backup
- [ ] Set up automated backups of `presets/` folder
- [ ] Keep copy of `index.json`

### 6.3 Rate Limit Monitoring
- [ ] Check `/tmp/kb1_rate_limit.json` if rate limiting issues occur
- [ ] Adjust limits in PHP script if needed

## Troubleshooting

### Upload fails with CORS error
- Check `Access-Control-Allow-Origin` header in PHP
- Verify frontend is served from same domain
- Check browser console for exact error

### 413 Payload Too Large
- Increase `MAX_FILE_SIZE` in PHP script
- Check preset JSON isn't excessive

### 507 Storage Full
- Reached 1000 preset limit
- Increase `MAX_PRESETS` or clean old files

### Presets don't appear in Cloud dialog
- Check `index.json` is valid JSON
- Verify file URLs are accessible
- Clear browser cache

### Permission denied errors
```bash
chmod 755 public_html/presets
chmod 644 public_html/presets/*.json
```

## Success Criteria

- [x] PHP script uploaded and accessible
- [x] Presets directory created with correct permissions
- [x] curl test succeeds
- [x] Web interface can upload presets
- [x] Uploaded presets appear in Cloud dialog
- [x] Imported presets work correctly
- [x] Rate limiting prevents spam
- [x] (Optional) API key authentication working

## Cleanup Test Data

After successful deployment, remove test preset:
```bash
rm public_html/presets/preset_test_12345.json
# Edit index.json to remove test entry
```

## Development Mode

To test locally before deploying:
```typescript
// In src/constants.ts
export const PRESET_UPLOAD_ENDPOINT = null;
```
This will download presets as JSON files instead of uploading.

## Notes

- Users can now upload presets directly from the configurator
- No GitHub PR needed - instant sharing
- Rate limited to prevent abuse
- All presets are public and accessible via URL
- Consider moderation if spam becomes an issue
