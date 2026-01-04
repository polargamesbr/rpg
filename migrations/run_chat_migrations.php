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
    
    echo "Running chat migrations...\n\n";

    // Migration 1: Create chat_rooms table
    echo "1. Creating chat_rooms table...\n";
    require __DIR__ . '/011_create_chat_rooms_table.php';
    $pdo->exec($sql);
    echo "   ✓ chat_rooms table created\n\n";

    // Migration 2: Create chat_messages table
    echo "2. Creating chat_messages table...\n";
    require __DIR__ . '/012_create_chat_messages_table.php';
    $pdo->exec($sql);
    echo "   ✓ chat_messages table created\n\n";

    // Migration 3: Insert default chat rooms
    echo "3. Inserting default chat rooms...\n";
    require __DIR__ . '/013_insert_default_chat_rooms.php';
    // This migration handles its own execution
    echo "   ✓ Default chat rooms inserted\n\n";

    echo "✓ All chat migrations completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}


