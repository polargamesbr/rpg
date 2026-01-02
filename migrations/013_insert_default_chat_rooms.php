<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load .env
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$dbConfig = require __DIR__ . '/../config/database.php';

try {
    $dsn = sprintf(
        "mysql:host=%s;port=%d;charset=%s",
        $dbConfig['host'],
        $dbConfig['port'],
        $dbConfig['charset']
    );

    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    $pdo->exec("USE `{$dbConfig['database']}`");
    
    echo "Inserting default chat rooms...\n";

    // Check if tavern room already exists
    $stmt = $pdo->prepare("SELECT id FROM chat_rooms WHERE name = 'tavern' LIMIT 1");
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existing) {
        $uuid = '550e8400-e29b-41d4-a716-446655440100';
        $stmt = $pdo->prepare("INSERT INTO chat_rooms (uuid, name, display_name, description) VALUES (:uuid, 'tavern', 'Tavern', 'Global tavern chat where all adventurers gather to share stories and find companions.')");
        $stmt->execute(['uuid' => $uuid]);
        echo "Inserted default 'tavern' chat room\n";
    } else {
        echo "Chat room 'tavern' already exists\n";
    }

    echo "\n✓ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

