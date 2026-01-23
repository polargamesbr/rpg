<?php

require_once __DIR__ . '/../app/Models/Database.php';
require_once __DIR__ . '/../config/database.php';

\App\Models\Database::init(require __DIR__ . '/../config/database.php');

try {
    \App\Models\Database::query('SET FOREIGN_KEY_CHECKS = 0');

    $tables = [
        'quest_battle_events',
        'quest_battle_sessions',
        'quest_events',
        'quest_sessions',
        'chat_messages',
        'characters',
        'user_events',
        'users'
    ];

    foreach ($tables as $table) {
        $exists = \App\Models\Database::fetchOne(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table",
            ['table' => $table]
        );
        if (!$exists) {
            echo "Skipped {$table} (not found)\n";
            continue;
        }
        \App\Models\Database::query("TRUNCATE TABLE {$table}");
        echo "Truncated {$table}\n";
    }

    \App\Models\Database::query('SET FOREIGN_KEY_CHECKS = 1');
    echo "Reset complete.\n";
} catch (\Exception $e) {
    echo "Error resetting data: " . $e->getMessage() . "\n";
    exit(1);
}

