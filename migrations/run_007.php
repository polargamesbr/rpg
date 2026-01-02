<?php

require_once __DIR__ . '/../vendor/autoload.php';

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
    
    echo "Connected to database\n";
    
    // Add column if it doesn't exist
    try {
        $pdo->exec("ALTER TABLE classes ADD COLUMN image_prefix VARCHAR(50) NOT NULL DEFAULT 'archer' AFTER color_glow");
        echo "Column image_prefix added\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "Column image_prefix already exists\n";
        } else {
            throw $e;
        }
    }
    
    // Update existing classes
    $updates = [
        'Espadachim' => 'swordman',
        'Arqueiro' => 'archer',
        'Mago' => 'mage',
        'Ladrão' => 'thief',
        'Acolito' => 'sacer',
        'Ferreiro' => 'blacksmith'
    ];
    
    foreach ($updates as $name => $prefix) {
        $stmt = $pdo->prepare("UPDATE classes SET image_prefix = ? WHERE name = ?");
        $stmt->execute([$prefix, $name]);
        echo "Updated {$name} with image_prefix: {$prefix}\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

