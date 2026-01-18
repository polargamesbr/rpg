<?php

namespace App\Models;

class QuestBattleSession
{
    public static function create(array $data): int
    {
        return Database::insert('quest_battle_sessions', $data);
    }

    public static function findByBattleUid(string $battleUid): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_battle_sessions WHERE battle_uid = :battle_uid",
            ['battle_uid' => $battleUid]
        );
    }

    public static function findActiveByQuestSession(int $questSessionId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_battle_sessions WHERE quest_session_id = :quest_session_id AND status = 'active' ORDER BY started_at DESC LIMIT 1",
            ['quest_session_id' => $questSessionId]
        );
    }

    public static function updateState(int $id, array $state): bool
    {
        return Database::update(
            'quest_battle_sessions',
            ['state_json' => json_encode($state, JSON_UNESCAPED_SLASHES)],
            'id = :id',
            ['id' => $id]
        ) > 0;
    }

    public static function updateStatus(int $id, string $status): bool
    {
        return Database::update(
            'quest_battle_sessions',
            ['status' => $status, 'ended_at' => date('Y-m-d H:i:s')],
            'id = :id',
            ['id' => $id]
        ) > 0;
    }
}

