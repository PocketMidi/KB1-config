# KB1 Preset Upload Server Setup

This directory contains the server-side PHP script for handling community preset uploads.

## Installation

1. **Upload the PHP script to your server:**
   ```
   Upload: server/upload-preset.php
   To: public_html/upload-preset.php
   ```

2. **Create the presets directory:**
   ```
   Create: public_html/presets/
   ```

3. **Set directory permissions:**
   ```bash
   chmod 755 public_html/presets
   ```

4. **Create initial index.json:**
   ```bash
   echo '{"presets":[]}' > public_html/presets/index.json
   chmod 644 public_html/presets/index.json
   ```

## Configuration

### Basic Setup
The script works out of the box with:
- Rate limiting: 5 uploads per IP per hour
- Max file size: 100KB per preset
- Max presets: 1000 total
- CORS: Allows all origins (adjust in production)

### Optional: API Key Authentication
To add API key security:

1. Generate a secure key:
   ```bash
   openssl rand -hex 16
   # Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

2. Edit `upload-preset.php`, uncomment these lines:
   ```php
   define('API_KEY', 'your-generated-key-here');
   if (!isset($_SERVER['HTTP_X_API_KEY']) || $_SERVER['HTTP_X_API_KEY'] !== API_KEY) {
       http_response_code(401);
       echo json_encode(['error' => 'Unauthorized']);
       exit;
   }
   ```

3. Update frontend code in `src/components/PresetManager.vue`:
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'X-API-Key': 'your-generated-key-here'
   }
   ```

### Security Settings

**Rate Limiting** (default: 5 requests/hour/IP):
```php
define('RATE_LIMIT_REQUESTS', 5);
```

**File Size** (default: 100KB):
```php
define('MAX_FILE_SIZE', 100 * 1024);
```

**Max Presets** (default: 1000):
```php
define('MAX_PRESETS', 1000);
```

**CORS** (production: restrict to your domain):
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

## Preset Updates & Overwrites

**Automatic Overwrite by Name:**
When a preset is uploaded with the same name as an existing preset, the old version is automatically replaced:

1. Old preset file is deleted
2. Old entry removed from index.json
3. New version saved with new ID
4. Index updated with new entry

**Example:**
- Upload "Wild Eagle" → Creates preset_1234_abc.json
- Update "Wild Eagle" → Deletes preset_1234_abc.json, creates preset_5678_def.json
- Only one "Wild Eagle" appears in community list

**Manual Cleanup (if needed):**
If duplicate names exist from before this feature:
```bash
# SSH into your server
cd public_html/presets
# List all presets
ls -1 preset_*.json | xargs -I {} sh -c 'echo "{}:" && cat {} | grep "name"'
# Delete specific preset
rm preset_1234567890_abc.json
# Manually edit index.json to remove entry
```

## File Structure

After setup, your server will have:

```
public_html/
├── upload-preset.php          # Upload endpoint
└── presets/
    ├── index.json             # Preset catalog
    ├── preset_1234567890_abc.json
    ├── preset_1234567891_def.json
    └── ...
```

## Testing

### Test with curl:
```bash
curl -X POST https://pocketmidi.com/upload-preset.php \
  -H "Content-Type: application/json" \
  -d '{
    "id": "preset_1234567890_test123",
    "metadata": {
      "name": "Test Preset",
      "author": "Test User",
      "date": "2026-04-12"
    },
    "settings": {
      "lever1": {"ccNumber": 74, "min": 0, "max": 127}
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "id": "preset_1234567890_test123",
  "filename": "preset_1234567890_test123.json",
  "url": "https://pocketmidi.com/presets/preset_1234567890_test123.json"
}
```

### Test in browser:
1. Open KB1 Configurator (https://pocketmidi.com/KB1-config/)
2. Connect to your KB1 device
3. Go to Presets section  
4. Click "Cloud" button on any preset
5. Click "Export Current Preset to Cloud"
6. Fill in metadata and click "Export"
7. Should see success toast: "Preset uploaded to community library!"

## Frontend Configuration

The upload endpoint is configured in `src/constants.ts`:

```typescript
export const PRESET_UPLOAD_ENDPOINT = 'https://pocketmidi.com/upload-preset.php';
```

To disable server upload during development:
```typescript
export const PRESET_UPLOAD_ENDPOINT = null; // Falls back to file download
```

## Troubleshooting

### 413 Payload Too Large
- Preset exceeds 100KB
- Solution: Reduce settings or increase `MAX_FILE_SIZE`

### 429 Rate Limit Exceeded
- Too many uploads from same IP
- Solution: Wait 1 hour or increase `RATE_LIMIT_REQUESTS`

### 507 Insufficient Storage
- Reached max preset limit
- Solution: Increase `MAX_PRESETS` or clean old presets

### CORS Errors
- Check browser console for origin mismatch
- Solution: Update `Access-Control-Allow-Origin` header

### File Permissions
```bash
# Fix directory permissions
chmod 755 public_html/presets
chmod 644 public_html/presets/*.json

# Check ownership
ls -la public_html/presets
```

## Maintenance

### Manually Delete a Preset (Admin Only):

**Via cPanel File Manager:**
1. Navigate to `public_html/presets/`
2. Find the preset file (e.g., `preset_1234567890_abc.json`)
3. Delete the file
4. Edit `index.json`:
   - Open for editing
   - Find and remove the matching entry from the `"presets"` array
   - Save

**Via Terminal/SSH:**
```bash
cd public_html/presets

# List all presets with names
for f in preset_*.json; do 
  echo "$f: $(cat "$f" | grep -oP '(?<="name":")[^"]*')"; 
done

# Delete a specific preset
rm preset_1234567890_abc.json

# Remove from index.json (manual edit or use jq)
jq '.presets |= map(select(.filename != "preset_1234567890_abc.json"))' index.json > index.tmp.json
mv index.tmp.json index.json
```

**Note:** No automated deletion from the web interface. Users should contact you to report inappropriate presets. This prevents abuse while keeping the system simple.

### View uploaded presets:
```bash
ssh your-server
cd public_html/presets
cat index.json | jq .
```

### Clean old presets:
```bash
# Delete presets older than 6 months
find public_html/presets -name "preset_*.json" -mtime +180 -delete

# Rebuild index.json manually if needed
php rebuild-index.php  # (you'll need to create this script)
```

### Monitor uploads:
Check server access logs for POST requests to `/upload-preset.php`.

## Migration from GitHub

Previously, community presets were stored in:
```
KB1-config/public/community-presets/
```

To migrate existing presets:
```bash
# Copy files to server
scp -r public/community-presets/presets/*.json user@server:public_html/presets/

# Copy index
scp public/community-presets/index.json user@server:public_html/presets/
```

## Support

For issues or questions:
- Check server error logs
- Verify PHP version (requires PHP 7.0+)
- Test with curl before using the web interface
- Contact: [your-support-email]
