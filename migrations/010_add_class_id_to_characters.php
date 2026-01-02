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
    
    echo "Adding class_id foreign key to characters table...\n";

    // Step 1: Add class_id column (nullable first for migration)
    $pdo->exec("ALTER TABLE characters ADD COLUMN class_id BIGINT UNSIGNED NULL AFTER user_id");
    echo "Added class_id column\n";

    // Step 2: Map existing class names to class IDs and update
    $classMap = [
        'Swordsman' => 'Swordsman',
        'Archer' => 'Archer',
        'Mage' => 'Mage',
        'Thief' => 'Thief',
        'Acolyte' => 'Acolyte',
        'Blacksmith' => 'Blacksmith'
    ];
    
    foreach ($classMap as $className => $classNameCheck) {
        // Get class ID from classes table
        $stmt = $pdo->prepare("SELECT id FROM classes WHERE name = :name LIMIT 1");
        $stmt->execute(['name' => $classNameCheck]);
        $classRow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($classRow) {
            $classId = $classRow['id'];
            // Update all characters with this class name
            $updateStmt = $pdo->prepare("UPDATE characters SET class_id = :class_id WHERE class = :class_name");
            $updateStmt->execute([
                'class_id' => $classId,
                'class_name' => $className
            ]);
            $affected = $updateStmt->rowCount();
            echo "Updated {$affected} characters with class '{$className}' to class_id {$classId}\n";
        } else {
            echo "Warning: Class '{$className}' not found in classes table\n";
        }
    }
    
    // Step 3: Make class_id NOT NULL
    $pdo->exec("ALTER TABLE characters MODIFY COLUMN class_id BIGINT UNSIGNED NOT NULL");
    echo "Made class_id NOT NULL\n";
    
    // Step 4: Add foreign key constraint
    $pdo->exec("ALTER TABLE characters ADD CONSTRAINT fk_characters_class_id FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT ON UPDATE CASCADE");
    echo "Added foreign key constraint\n";
    
    // Step 5: Add index for performance
    $pdo->exec("ALTER TABLE characters ADD INDEX idx_class_id (class_id)");
    echo "Added index on class_id\n";
    
    // Step 6: Remove old class column
    $pdo->exec("ALTER TABLE characters DROP COLUMN class");
    echo "Removed old class column\n";

    echo "\n✓ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

