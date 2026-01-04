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
    
    echo "Updating characters.class ENUM to English values...\n";

    // First, change ENUM to VARCHAR temporarily to allow any value
    $pdo->exec("ALTER TABLE characters MODIFY COLUMN class VARCHAR(50) NOT NULL");
    echo "Changed class column to VARCHAR\n";
    
    // Update all class values to English
    $classUpdates = [
        'Espadachim' => 'Swordsman',
        'Arqueiro' => 'Archer',
        'Mago' => 'Mage',
        'Ladrão' => 'Thief',
        'Acolito' => 'Acolyte',
        'Ferreiro' => 'Blacksmith'
    ];
    
    foreach ($classUpdates as $oldName => $newName) {
        $stmt = $pdo->prepare("UPDATE characters SET class = :new_name WHERE class = :old_name");
        $stmt->execute([
            'new_name' => $newName,
            'old_name' => $oldName
        ]);
        echo "Updated characters: {$oldName} -> {$newName}\n";
    }
    
    // Now change back to ENUM with English values
    $pdo->exec("ALTER TABLE characters MODIFY COLUMN class ENUM('Swordsman', 'Archer', 'Mage', 'Thief', 'Acolyte', 'Blacksmith') NOT NULL");
    echo "Changed class column back to ENUM with English values\n";

    echo "\n✓ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}


