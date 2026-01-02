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
    
    echo "Updating class names to English...\n";

    // Map Portuguese names to English names
    $classUpdates = [
        'Espadachim' => [
            'name' => 'Swordsman',
            'display_name' => 'Swordsman'
        ],
        'Arqueiro' => [
            'name' => 'Archer',
            'display_name' => 'Archer'
        ],
        'Mago' => [
            'name' => 'Mage',
            'display_name' => 'Mage'
        ],
        'Ladrão' => [
            'name' => 'Thief',
            'display_name' => 'Thief'
        ],
        'Acolito' => [
            'name' => 'Acolyte',
            'display_name' => 'Acolyte'
        ],
        'Ferreiro' => [
            'name' => 'Blacksmith',
            'display_name' => 'Blacksmith'
        ]
    ];

    foreach ($classUpdates as $oldName => $newData) {
        // Update classes table
        $updateClassSql = "UPDATE classes SET name = :new_name, display_name = :new_display_name WHERE name = :old_name";
        $stmt = $pdo->prepare($updateClassSql);
        $stmt->execute([
            'new_name' => $newData['name'],
            'new_display_name' => $newData['display_name'],
            'old_name' => $oldName
        ]);
        echo "Updated class: {$oldName} -> {$newData['name']}\n";
        
        // Update characters table
        $updateCharacterSql = "UPDATE characters SET class = :new_name WHERE class = :old_name";
        $stmt = $pdo->prepare($updateCharacterSql);
        $stmt->execute([
            'new_name' => $newData['name'],
            'old_name' => $oldName
        ]);
        echo "Updated characters with class: {$oldName} -> {$newData['name']}\n";
    }

    echo "\n✓ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
