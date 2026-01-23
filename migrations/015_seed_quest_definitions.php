<?php

/**
 * Seed quest definitions with metadata only.
 * Quest configurations are now stored in static JSON files:
 * app/GameData/quests/{quest_id}.json
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

if ($hasConfigColumn) {
    $sql = "INSERT INTO quest_definitions (id, title, description, difficulty, image, config_json, is_active)
    VALUES (
        'first-steps',
        'First Steps',
        'Learn the basics of combat and exploration. Master your first sword techniques.',
        'Easy',
        '/public/assets/quests/first-steps.png',
        '{}',
        1
    )
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        difficulty = VALUES(difficulty),
        image = VALUES(image),
        config_json = VALUES(config_json),
        is_active = VALUES(is_active);";
} else {
    $sql = "INSERT INTO quest_definitions (id, title, description, difficulty, image, is_active)
    VALUES (
        'first-steps',
        'First Steps',
        'Learn the basics of combat and exploration. Master your first sword techniques.',
        'Easy',
        '/public/assets/quests/first-steps.png',
        1
    )
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        difficulty = VALUES(difficulty),
        image = VALUES(image),
        is_active = VALUES(is_active);";
}

try {
    \App\Models\Database::query($sql);
    echo "Quest definitions seeded successfully.\n";
} catch (\Exception $e) {
    echo "Error seeding quest definitions: " . $e->getMessage() . "\n";
    exit(1);
}

