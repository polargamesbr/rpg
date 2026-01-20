<?php

/**
 * Migration: Remove map_x e map_y de characters (não usados; posição de exploração
 * fica em quest_sessions.state_json).
 * Rodar: php migrations/021_drop_unused_character_columns.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$k, $v] = explode('=', $line, 2);
            $_ENV[trim($k)] = trim($v);
        }
    }
}

$db = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['database']};charset=" . ($db['charset'] ?? 'utf8mb4');
$pdo = new PDO($dsn, $db['username'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

foreach (['map_x', 'map_y'] as $col) {
    $row = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = '{$col}'")->fetch();
    if ($row) {
        $pdo->exec("ALTER TABLE characters DROP COLUMN {$col}");
        echo "Coluna {$col} removida de characters.\n";
    } else {
        echo "Coluna {$col} já não existe em characters.\n";
    }
}

echo "Migration 021 concluída.\n";
