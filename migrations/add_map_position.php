<?php
/**
 * Migration: Add map_x and map_y columns to characters table
 * Run this once to add the exploration position columns
 */

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
    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "Connected to database.\n";

    // Check if columns exist
    $stmt = $pdo->query("DESCRIBE characters");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('map_x', $columns)) {
        $pdo->exec("ALTER TABLE characters ADD COLUMN map_x INT DEFAULT 5");
        echo "Added column: map_x\n";
    } else {
        echo "Column map_x already exists.\n";
    }

    if (!in_array('map_y', $columns)) {
        $pdo->exec("ALTER TABLE characters ADD COLUMN map_y INT DEFAULT 5");
        echo "Added column: map_y\n";
    } else {
        echo "Column map_y already exists.\n";
    }

    echo "Migration completed successfully!\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}
