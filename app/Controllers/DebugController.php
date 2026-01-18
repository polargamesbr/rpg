<?php

namespace App\Controllers;

class DebugController
{
    public function gemini(): void
    {
        echo "<h1>Gemini API Key Debug</h1>";
        echo "<pre style='background:#1a1a1a;color:#fff;padding:20px;font-size:14px;'>";

        // 1. Check .env file path
        $envPath = __DIR__ . '/../../.env';
        echo "1. ENV Path: " . realpath($envPath) . "\n";
        echo "   File exists: " . (file_exists($envPath) ? "✅ YES" : "❌ NO") . "\n";

        if (file_exists($envPath)) {
            echo "   File is readable: " . (is_readable($envPath) ? "✅ YES" : "❌ NO") . "\n";
            echo "   File size: " . filesize($envPath) . " bytes\n\n";
            
            // 2. Read file contents
            echo "2. Reading .env file line by line:\n";
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $foundKey = null;
            
            foreach ($lines as $i => $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) continue;
                
                if (strpos($line, 'GEMINI_API_KEY') !== false) {
                    $parts = explode('=', $line, 2);
                    $key = $parts[1] ?? '';
                    $foundKey = $key;
                    $masked = substr($key, 0, 10) . '***' . substr($key, -4);
                    echo "   ✅ Found: GEMINI_API_KEY=$masked\n";
                    echo "   Key length: " . strlen($key) . " chars\n";
                    echo "   Has quotes: " . (strpos($key, '"') !== false || strpos($key, "'") !== false ? "⚠️ YES (may be a problem)" : "✅ NO") . "\n";
                    echo "   Has leading/trailing spaces: " . (trim($key) !== $key ? "⚠️ YES" : "✅ NO") . "\n";
                }
            }
            
            if (!$foundKey) {
                echo "   ❌ GEMINI_API_KEY not found in file!\n";
            }
        }

        // 3. Check $_ENV (after loading)
        echo "\n3. \$_ENV['GEMINI_API_KEY']:\n";
        if (isset($_ENV['GEMINI_API_KEY']) && !empty($_ENV['GEMINI_API_KEY'])) {
            $key = $_ENV['GEMINI_API_KEY'];
            echo "   ✅ SET: " . substr($key, 0, 10) . '***' . substr($key, -4) . "\n";
            echo "   Length: " . strlen($key) . "\n";
        } else {
            echo "   ❌ NOT SET or EMPTY\n";
        }

        // 4. Test API Connection if key exists
        $testKey = $_ENV['GEMINI_API_KEY'] ?? $foundKey ?? null;
        
        if ($testKey) {
            $testKey = trim($testKey);
            echo "\n4. Testing Gemini API connection...\n";
            
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" . $testKey;
            
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            echo "   HTTP Code: $httpCode\n";
            
            if ($error) {
                echo "   ❌ CURL Error: $error\n";
            } elseif ($httpCode === 200) {
                echo "   ✅ API KEY IS VALID!\n";
                $json = json_decode($response, true);
                $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? 'N/A';
                echo "   Response: " . trim($text) . "\n";
            } else {
                echo "   ❌ API Error (HTTP $httpCode):\n";
                $errorData = json_decode($response, true);
                if (isset($errorData['error']['message'])) {
                    echo "   Message: " . $errorData['error']['message'] . "\n";
                } else {
                    echo "   " . substr($response, 0, 300) . "\n";
                }
            }
        } else {
            echo "\n4. ❌ No API key available to test\n";
        }

        echo "\n</pre>";
        echo "<p><a href='/game/tavern'>← Back to Tavern</a></p>";
    }
}
