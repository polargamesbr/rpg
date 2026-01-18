<?php

namespace App\Services;

class GeminiService
{
    private static function getConfig(): array
    {
        // Load .env directly if not already in $_ENV
        if (empty($_ENV['GEMINI_API_KEY'])) {
            $envPath = __DIR__ . '/../../.env';
            if (file_exists($envPath)) {
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        [$key, $value] = explode('=', $line, 2);
                        $key = trim($key);
                        $value = trim($value);
                        if (!isset($_ENV[$key])) {
                            $_ENV[$key] = $value;
                        }
                    }
                }
            }
        }
        
        // Get config
        $config = require __DIR__ . '/../../config/app.php';
        $geminiConfig = $config['gemini'] ?? [];
        
        // If api_key is empty in config but exists in ENV, use it directly
        if (empty($geminiConfig['api_key']) && !empty($_ENV['GEMINI_API_KEY'])) {
            $geminiConfig['api_key'] = $_ENV['GEMINI_API_KEY'];
        }
        
        return $geminiConfig;
    }

    /**
     * Make API call to Google Gemini
     */
    private static function callApi(string $prompt, array $context = []): array
    {
        $config = self::getConfig();
        $apiKey = trim($config['api_key'] ?? '');
        
        // Fallback: try to get directly from ENV if config is empty
        if (empty($apiKey) && isset($_ENV['GEMINI_API_KEY'])) {
            $apiKey = trim($_ENV['GEMINI_API_KEY']);
        }
        
        // Last resort: read .env file directly
        if (empty($apiKey)) {
            $envPath = __DIR__ . '/../../.env';
            if (file_exists($envPath)) {
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (strpos($line, 'GEMINI_API_KEY=') === 0) {
                        $apiKey = trim(substr($line, strlen('GEMINI_API_KEY=')));
                        break;
                    }
                }
            }
        }
        
        $model = $config['model'] ?? 'gemini-2.5-flash-lite';
        $temperature = $config['temperature'] ?? 0.8;
        $apiUrl = $config['api_url'] ?? 'https://generativelanguage.googleapis.com/v1beta/models/';

        if (empty($apiKey)) {
            error_log('Gemini API Key is empty after all attempts');
            error_log('Config: ' . json_encode($config));
            error_log('ENV GEMINI_API_KEY: ' . ($_ENV['GEMINI_API_KEY'] ?? 'NOT SET'));
            throw new \Exception('GEMINI_API_KEY not configured. Please check your .env file.');
        }

        // Use API URL from config (supports both v1 and v1beta)
        $url = $apiUrl . $model . ':generateContent?key=' . $apiKey;

        $requestData = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $temperature,
                'topK' => 40,
                'topP' => 0.95,
                'maxOutputTokens' => 2048,
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('Gemini API error: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new \Exception('Gemini API returned HTTP ' . $httpCode . ': ' . $response);
        }

        $data = json_decode($response, true);
        
        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid response from Gemini API');
        }

        $text = $data['candidates'][0]['content']['parts'][0]['text'];
        
        // Try to parse as JSON, if fails return as plain text
        $json = json_decode($text, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $json;
        }

        return ['text' => $text];
    }
}

