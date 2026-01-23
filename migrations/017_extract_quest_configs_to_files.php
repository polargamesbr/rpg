<?php

/**
 * Migration: Extract quest configurations from database to static JSON files.
 * This migration reads config_json from the database and creates JSON files
 * in app/GameData/quests/ for each quest.
 * 
 * Note: This is a one-time data migration. After this, configs will be
 * loaded from files instead of the database.
 */

require_once __DIR__ . '/../app/Models/Database.php';
require_once __DIR__ . '/../config/database.php';

\App\Models\Database::init(require __DIR__ . '/../config/database.php');

$hasConfigColumn = \App\Models\Database::fetchOne(
    "SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'quest_definitions' 
     AND COLUMN_NAME = 'config_json'"
);

if (!$hasConfigColumn) {
    echo "Column 'config_json' does not exist in quest_definitions. Nothing to extract.\n";
    return;
}

$quests = \App\Models\Database::fetchAll("SELECT id, config_json FROM quest_definitions WHERE config_json IS NOT NULL");

$questsDir = __DIR__ . '/../app/GameData/quests';
if (!is_dir($questsDir)) {
    @mkdir($questsDir, 0755, true);
}

$extracted = 0;
foreach ($quests as $quest) {
    $questId = $quest['id'];
    $configJson = $quest['config_json'];
    
    // Parse JSON from database
    $config = json_decode($configJson, true);
    if (!$config || !is_array($config)) {
        echo "Warning: Invalid JSON config for quest '{$questId}', skipping...\n";
        continue;
    }
    
    // Remove mapImage from config (will be inferred automatically by QuestConfigService)
    if (isset($config['map']['mapImage'])) {
        unset($config['map']['mapImage']);
    }
    
    // Create JSON file
    $jsonFile = $questsDir . '/' . $questId . '.json';
    $jsonContent = json_encode($config, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    
    if (file_put_contents($jsonFile, $jsonContent) === false) {
        echo "Error: Failed to write config file for quest '{$questId}'\n";
        continue;
    }
    
    echo "Extracted config for quest '{$questId}' -> {$jsonFile}\n";
    $extracted++;
}

if ($extracted === 0) {
    echo "No quest configs to extract.\n";
} else {
    echo "Successfully extracted {$extracted} quest configuration(s) to JSON files.\n";
}

