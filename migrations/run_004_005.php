<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Load .env variables
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
\App\Models\Database::init($dbConfig);

echo "Running migrations 004 and 005...\n";

// Migration 004
echo "  Applying 004_create_classes_table.php...\n";
require __DIR__ . '/004_create_classes_table.php';
try {
    \App\Models\Database::query($sql);
    echo "  ✓ Migration 004 executed successfully\n";
} catch (\PDOException $e) {
    if (strpos($e->getMessage(), 'already exists') !== false) {
        echo "  ⚠ Table already exists, skipping...\n";
    } else {
        echo "  ✗ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Migration 005
echo "  Applying 005_insert_classes_data.php...\n";
require __DIR__ . '/005_insert_classes_data.php';
try {
    \App\Models\Database::query($sql);
    echo "  ✓ Migration 005 executed successfully\n";
} catch (\PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        echo "  ⚠ Data already exists, skipping...\n";
    } else {
        echo "  ✗ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}

echo "\n✓ All migrations completed!\n";


