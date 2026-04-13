<?php
/**
 * KB1 Preset Upload Endpoint
 * Upload this to: public_html/upload-preset.php on pocketmidi.com
 * 
 * Security: Rate limiting, validation, file size limits
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow all origins (restrict in production)
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Configuration
define('PRESETS_DIR', __DIR__ . '/presets');
define('INDEX_FILE', PRESETS_DIR . '/index.json');
define('MAX_FILE_SIZE', 100 * 1024); // 100KB
define('MAX_PRESETS', 1000); // Prevent spam
define('RATE_LIMIT_FILE', sys_get_temp_dir() . '/kb1_rate_limit.json');
define('RATE_LIMIT_REQUESTS', 100); // Max 100 uploads per IP per hour (increase for testing)

// Simple API key (optional - comment out if not using)
// define('API_KEY', 'your-secret-key-here'); // Generate with: openssl rand -hex 16
// if (!isset($_SERVER['HTTP_X_API_KEY']) || $_SERVER['HTTP_X_API_KEY'] !== API_KEY) {
//     http_response_code(401);
//     echo json_encode(['error' => 'Unauthorized']);
//     exit;
// }

// Rate limiting
function checkRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $now = time();
    $hourAgo = $now - 3600;
    
    $limits = [];
    if (file_exists(RATE_LIMIT_FILE)) {
        $limits = json_decode(file_get_contents(RATE_LIMIT_FILE), true) ?: [];
    }
    
    // Clean old entries
    $limits = array_filter($limits, function($timestamp) use ($hourAgo) {
        return $timestamp > $hourAgo;
    });
    
    // Check current IP
    $ipLimits = array_filter($limits, function($timestamp, $key) use ($ip) {
        return strpos($key, $ip . '_') === 0;
    }, ARRAY_FILTER_USE_BOTH);
    
    if (count($ipLimits) >= RATE_LIMIT_REQUESTS) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded. Try again later.']);
        exit;
    }
    
    // Add current request
    $limits[$ip . '_' . $now] = $now;
    file_put_contents(RATE_LIMIT_FILE, json_encode($limits));
}

checkRateLimit();

// Get JSON from POST body
$json = file_get_contents('php://input');
if (empty($json)) {
    http_response_code(400);
    echo json_encode(['error' => 'No data received']);
    exit;
}

// Check size
if (strlen($json) > MAX_FILE_SIZE) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large']);
    exit;
}

// Validate JSON
$data = json_decode($json, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Validate structure
if (!isset($data['id']) || !isset($data['metadata']) || !isset($data['settings'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: id, metadata, settings']);
    exit;
}

// Validate ID format (preset_timestamp_random)
if (!preg_match('/^preset_\d+_[a-z0-9]+$/', $data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid preset ID format']);
    exit;
}

// Create presets directory if it doesn't exist
if (!file_exists(PRESETS_DIR)) {
    mkdir(PRESETS_DIR, 0755, true);
}

// Check total preset count
$files = glob(PRESETS_DIR . '/preset_*.json');
if (count($files) >= MAX_PRESETS) {
    http_response_code(507);
    echo json_encode(['error' => 'Preset storage full']);
    exit;
}

// Sanitize filename
$filename = preg_replace('/[^a-z0-9_]/', '', $data['id']) . '.json';
$filepath = PRESETS_DIR . '/' . $filename;

// Load existing index to check for duplicate names
$index = ['presets' => []];
if (file_exists(INDEX_FILE)) {
    $indexContent = file_get_contents(INDEX_FILE);
    $index = json_decode($indexContent, true) ?: $index;
}

// Check if preset with same name already exists (allow overwrite)
$presetName = isset($data['metadata']['name']) ? $data['metadata']['name'] : null;
if ($presetName) {
    foreach ($index['presets'] as $key => $existingPreset) {
        if (isset($existingPreset['metadata']['name']) && 
            $existingPreset['metadata']['name'] === $presetName) {
            // Delete old file
            $oldFilepath = PRESETS_DIR . '/' . $existingPreset['filename'];
            if (file_exists($oldFilepath)) {
                unlink($oldFilepath);
            }
            // Remove from index
            unset($index['presets'][$key]);
            break; // Only remove first match
        }
    }
    // Reindex array after unset
    $index['presets'] = array_values($index['presets']);
}

// Save preset file
if (file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save preset']);
    exit;
}

// Add new preset to index
$indexEntry = [
    'id' => $data['id'],
    'filename' => $filename,
    'metadata' => $data['metadata']
];

$index['presets'][] = $indexEntry;

// Save updated index
if (file_put_contents(INDEX_FILE, json_encode($index, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update index']);
    exit;
}

// Success
http_response_code(201);
echo json_encode([
    'success' => true,
    'id' => $data['id'],
    'filename' => $filename,
    'url' => 'https://pocketmidi.com/presets/' . $filename
]);
