<?php

namespace App\Models;

class QuestDefinition
{
    public static function findById(string $id): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_definitions WHERE id = :id AND is_active = 1",
            ['id' => $id]
        );
    }

    public static function findAllActive(): array
    {
        return Database::fetchAll(
            "SELECT * FROM quest_definitions WHERE is_active = 1 ORDER BY id ASC"
        );
    }
}

