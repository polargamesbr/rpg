<?php

namespace App\Models;

class QuestBattleEvent
{
    public static function create(array $data): int
    {
        return Database::insert('quest_battle_events', $data);
    }
}

