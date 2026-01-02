<?php

require_once __DIR__ . '/../vendor/autoload.php';
$dbConfig = require __DIR__ . '/../config/database.php';
\App\Models\Database::init($dbConfig);

// Check if username column exists
$checkSql = "SHOW COLUMNS FROM users LIKE 'username'";
$result = \App\Models\Database::fetchOne($checkSql);

if ($result) {
    echo "Updating users table...\n";
    
    // Drop username column and index, add first_name and last_name
    $sql = "ALTER TABLE users 
            DROP INDEX IF EXISTS idx_username,
            DROP COLUMN username,
            ADD COLUMN first_name VARCHAR(100) NOT NULL DEFAULT '' AFTER uuid,
            ADD COLUMN last_name VARCHAR(100) NOT NULL DEFAULT '' AFTER first_name";
    
    try {
        \App\Models\Database::query($sql);
        echo "✓ Migration 003 executed successfully\n";
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "Users table already updated (no username column found)\n";
}

