<?php

/**
 * Migration: Remove snapshot_json from quest_sessions.
 * Dados do personagem vêm de character_id + characters/classes; nada estático.
 * Rodar: php migrations/020_drop_snapshot_json.php
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

$col = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quest_sessions' AND COLUMN_NAME = 'snapshot_json'")->fetch();
if ($col) {
    $pdo->exec('ALTER TABLE quest_sessions DROP COLUMN snapshot_json');
    echo "Coluna snapshot_json removida de quest_sessions.\n";
} else {
    echo "Coluna snapshot_json já não existe.\n";
}

echo "Migration 020 concluída.\n";
