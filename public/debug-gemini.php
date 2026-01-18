<?php
/**
 * Debug script for Gemini API Key configuration
 */

echo "<h1>Gemini API Key Debug</h1>";
echo "<pre>";

// 1. Check .env file path
$envPath = __DIR__ . '/.env';
echo "1. ENV Path: " . $envPath . "\n";
echo "   File exists: " . (file_exists($envPath) ? "YES" : "NO") . "\n";

if (file_exists($envPath)) {
    echo "   File is readable: " . (is_readable($envPath) ? "YES" : "NO") . "\n";
    echo "   File size: " . filesize($envPath) . " bytes\n\n";
    
    // 2. Read file contents
    echo "2. Reading .env file:\n";
    $contents = file_get_contents($envPath);
    $lines = explode("\n", $contents);
    
    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        if (strpos($line, 'GEMINI_API_KEY') !== false) {
            // Mask the key for security
            $parts = explode('=', $line, 2);
            $key = $parts[1] ?? '';
            $masked = substr($key, 0, 10) . '***' . substr($key, -4);
            echo "   Line $i: GEMINI_API_KEY=$masked\n";
            echo "   Key length: " . strlen($key) . " chars\n";
            echo "   Has quotes: " . (strpos($key, '"') !== false || strpos($key, "'") !== false ? "YES (PROBLEM!)" : "NO (good)") . "\n";
            echo "   Has spaces: " . (trim($key) !== $key ? "YES (PROBLEM!)" : "NO (good)") . "\n";
        }
    }
}

// 3. Check $_ENV
echo "\n3. \$_ENV['GEMINI_API_KEY']:\n";
if (isset($_ENV['GEMINI_API_KEY'])) {
    $key = $_ENV['GEMINI_API_KEY'];
    echo "   Value: " . substr($key, 0, 10) . '***' . substr($key, -4) . "\n";
    echo "   Length: " . strlen($key) . "\n";
} else {
    echo "   NOT SET\n";
}

// 4. Check getenv()
echo "\n4. getenv('GEMINI_API_KEY'):\n";
$envKey = getenv('GEMINI_API_KEY');
if ($envKey) {
    echo "   Value: " . substr($envKey, 0, 10) . '***' . substr($envKey, -4) . "\n";
} else {
    echo "   NOT SET\n";
}

// 5. Try to load manually
echo "\n5. Manual loading from .env:\n";
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, 'GEMINI_API_KEY=') === 0) {
            $apiKey = trim(substr($line, strlen('GEMINI_API_KEY=')));
            echo "   Extracted key: " . substr($apiKey, 0, 10) . '***' . substr($apiKey, -4) . "\n";
            echo "   Length: " . strlen($apiKey) . "\n";
            
            // Test API
            echo "\n6. Testing API connection...\n";
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
            
            $data = [
                'contents' => [
                    ['parts' => [['text' => 'Say hello in one word']]]
                ]
            ];
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            echo "   HTTP Code: $httpCode\n";
            if ($error) {
                echo "   CURL Error: $error\n";
            }
            if ($httpCode === 200) {
                echo "   ✅ API KEY IS VALID!\n";
                $json = json_decode($response, true);
                echo "   Response: " . ($json['candidates'][0]['content']['parts'][0]['text'] ?? 'N/A') . "\n";
            } else {
                echo "   ❌ API Error:\n";
                echo "   " . substr($response, 0, 500) . "\n";
            }
        }
    }
}

echo "</pre>";
