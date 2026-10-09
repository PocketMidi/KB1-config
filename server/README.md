# KB1 Community Preset Upload Server

Deployment reference for [upload-preset.php](upload-preset.php). For the user-facing **Cloud** workflow, see the [Configurator User Guide](../docs/USER_GUIDE.md#presets).

## Installation

1. Deploy `upload-preset.php` to the server's public web directory.
2. Create a writable `presets/` directory beside it.
3. Deploy [presets/.htaccess](presets/.htaccess) for preset-read CORS headers.
4. Initialize `presets/index.json` as `{"presets":[]}` if no catalog exists. Do not overwrite an existing catalog.
5. Configure the upload API key and frontend endpoint as described below.

Typical layout:

```text
public_html/
├── upload-preset.php
└── presets/
    ├── .htaccess
    ├── index.json
    └── preset_*.json
```

Use permissions appropriate to the hosting account (commonly 755 for the directory and 644 for files); the PHP process needs write access.

## Current Configuration

The checked-in endpoint uses:

| Setting | Value |
|---|---|
| Upload method | POST with JSON |
| Maximum request size | 100 KB |
| Maximum stored presets | 1000 |
| Rate limit | 100 uploads per IP per hour |
| Authentication | `X-API-Key` header |
| Allowed browser origins | `pocketmidi.com`, `www.pocketmidi.com`, `pocketmidi.github.io` (HTTPS), and `http://localhost:5173` |

The upload origin list is in `$allowedOrigins`; it is not a wildcard. Download CORS is configured separately in `presets/.htaccess`.

### API Key and Frontend

Generate a key with `openssl rand -hex 16`. Configure the server's **KB1_PRESET_API_KEY** environment variable and use the same value for the Configurator's **VITE_PRESET_API_KEY** build environment. For local development, use `.env.local`; for deployment, use the build workflow's secret configuration.

Do not commit a real key or leave the endpoint's placeholder key configured. Authentication is already implemented; no uncommenting or hardcoded frontend header changes are required.

The frontend reads [src/constants.ts](../src/constants.ts):

- `PRESET_UPLOAD_ENDPOINT`: Upload URL, currently `https://pocketmidi.com/upload-preset.php`.
- `PRESET_BASE_URL`: Catalog and preset download base, currently `https://pocketmidi.com/presets/`.
- `PRESET_API_KEY`: Reads `VITE_PRESET_API_KEY`.

Setting the upload endpoint to `null` selects the app's file-download fallback. Vite embeds frontend environment values in the built client; this key is not a private server credential or per-user authentication.

## Payload and Replacement

Uploads require `id`, `metadata`, and `settings`. IDs must match `preset_<digits>_<lowercase-name>_<lowercase-alphanumeric-suffix>`, for example `preset_1234567890_test_abc123`. Use a real preset exported by the app for testing, not a partial settings object.

If the catalog contains an exact matching `metadata.name`, the endpoint replaces the first matching entry and removes its old file. A successful upload returns HTTP 201 with `success`, `id`, `filename`, and `url`.

## Testing

On a configured development or staging server:

1. Open the [Configurator](https://pocketmidi.github.io/KB1-config/).
2. Connect KB1 or use Evaluation Mode.
3. Save a non-starter preset in a browser slot.
4. Tap **Cloud**, complete the sharing form, and submit.
5. Confirm the app reports success and the preset appears in the community catalog.

For command-line testing, submit a complete app-exported preset with the `X-API-Key` header. Do not paste credentials into documentation or commit test payloads containing private data.

## Troubleshooting and Maintenance

- **401**: Missing or mismatched API key.
- **403**: Browser origin not in the upload allowlist.
- **413**: Request exceeds 100 KB.
- **429**: Per-IP upload limit reached; wait before retrying.
- **507**: Stored preset limit reached.
- **Write failures**: Check PHP logs, directory ownership, and write permissions.
- **Catalog download CORS failures**: Check `presets/.htaccess`, not just the upload endpoint.

There is no user-facing delete action for shared presets. For administrative removal, delete the specific preset file and remove its corresponding catalog entry together. Do not delete files by age without updating the catalog.
