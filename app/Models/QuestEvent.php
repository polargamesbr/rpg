<?php

namespace App\Models;

class QuestEvent
{
    public static function create(array $data): int
    {
        return Database::insert('quest_events', $data);
    }
}

