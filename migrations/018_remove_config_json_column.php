<?php

/**
 * Migration: Remove config_json column from quest_definitions table.
 * Quest configurations are now stored in static JSON files:
 * app/GameData/quests/{quest_id}.json
 * 
 * This migration safely removes the column after ensuring configs
 * have been extracted to files (migration 017).
 */

require_once __DIR__ . '/../app/Models/Database.php';
require_once __DIR__ . '/../config/database.php';

\App\Models\Database::init(require __DIR__ . '/../config/database.php');

try {
    // Check if column exists before attempting to remove
    $checkColumn = \App\Models\Database::fetchOne(
        "SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'quest_definitions' 
         AND COLUMN_NAME = 'config_json'"
    );
    
    if (!$checkColumn) {
        echo "Column 'config_json' does not exist in quest_definitions. Nothing to remove.\n";
        return;
    }
    
    // Remove the column
    $sql = "ALTER TABLE quest_definitions DROP COLUMN config_json";
    \App\Models\Database::query($sql);
    
    echo "Successfully removed 'config_json' column from quest_definitions table.\n";
    echo "Quest configurations are now stored in app/GameData/quests/ JSON files.\n";
    
} catch (\Exception $e) {
    echo "Error removing config_json column: " . $e->getMessage() . "\n";
    exit(1);
}

