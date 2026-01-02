<?php

return [
    'name' => 'RPG Game',
    'env' => $_ENV['APP_ENV'] ?? 'development',
    'debug' => filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN),
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
    ]
];

