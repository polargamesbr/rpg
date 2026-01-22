<?php

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

$dbConfig = require __DIR__ . '/../config/database.php';

try {
    $dsn = sprintf("mysql:host=%s;port=%d;charset=%s", $dbConfig['host'], $dbConfig['port'], $dbConfig['charset']);
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    $pdo->exec("USE `{$dbConfig['database']}`");

    $row = $pdo->query("SHOW COLUMNS FROM classes LIKE 'entity_id'")->fetch();
    if (!$row) {
        $pdo->exec("ALTER TABLE classes ADD COLUMN entity_id VARCHAR(50) NULL AFTER image_prefix");
        echo "Added entity_id column to classes.\n";
    }

    $map = ['Swordsman' => 'swordsman', 'Archer' => 'archer', 'Mage' => 'mage', 'Thief' => 'thief', 'Acolyte' => 'acolyte', 'Blacksmith' => 'blacksmith', 'Beast Tamer' => 'beast_tamer'];
    foreach ($map as $name => $eid) {
        $pdo->prepare("UPDATE classes SET entity_id = ? WHERE name = ?")->execute([$eid, $name]);
        echo "Set entity_id='{$eid}' for class '{$name}'.\n";
    }

    $idx = $pdo->query("SHOW INDEX FROM classes WHERE Key_name = 'idx_entity_id'")->fetch();
    if (!$idx) {
        $pdo->exec("ALTER TABLE classes ADD INDEX idx_entity_id (entity_id)");
        echo "Added index idx_entity_id.\n";
    }

    echo "✓ Migration 019 done.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
