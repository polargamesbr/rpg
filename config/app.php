<?php

// Load .env if not already loaded
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $_ENV[$key] = $value;
        }
    }
}

return [
    'name' => 'RPG Game',
    'env' => $_ENV['APP_ENV'] ?? 'development',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'debug_mode' => filter_var($_ENV['DEBUG_MODE'] ?? false, FILTER_VALIDATE_BOOLEAN),
    'url' => $_ENV['APP_URL'] ?? 'http://rpg.local',
    'timezone' => 'America/Sao_Paulo',
    'session' => [
        'lifetime' => (int)($_ENV['SESSION_LIFETIME'] ?? 7200),
        'name' => 'rpg_session',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ],
    'auth' => [
        'redirect_unauthenticated' => '/login',
        'redirect_authenticated' => '/game',
    ],
    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? 'change-this-secret-key',
        'algorithm' => 'HS256',
        'expiration' => 3600,
        'iss' => 'rpg-game',
        'aud' => 'rpg-game'
    ],
    'gemini' => [
        'api_key' => $_ENV['GEMINI_API_KEY'] ?? '',
        'model' => 'gemini-2.5-flash-lite',
        'temperature' => 0.8,
        'api_url' => 'https://generativelanguage.googleapis.com/v1beta/models/'
    ]
];

