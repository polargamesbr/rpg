<?php

namespace App\Models;

class QuestSession
{
    public static function create(array $data): int
    {
        return Database::insert('quest_sessions', $data);
    }

    public static function findBySessionUid(string $sessionUid): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_sessions WHERE session_uid = :session_uid",
            ['session_uid' => $sessionUid]
        );
    }

    public static function findActiveByUser(int $userId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_sessions WHERE user_id = :user_id AND status = 'active' ORDER BY started_at DESC LIMIT 1",
            ['user_id' => $userId]
        );
    }

    public static function findActiveByUserAndQuest(int $userId, string $questId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM quest_sessions WHERE user_id = :user_id AND quest_id = :quest_id AND status = 'active' ORDER BY started_at DESC LIMIT 1",
            ['user_id' => $userId, 'quest_id' => $questId]
        );
    }

    public static function updateState(int $id, array $state): bool
    {
        return Database::update(
            'quest_sessions',
            ['state_json' => json_encode($state, JSON_UNESCAPED_SLASHES)],
            'id = :id',
            ['id' => $id]
        ) > 0;
    }

    public static function updateStatus(int $id, string $status): bool
    {
        $data = ['status' => $status];
        if ($status === 'completed') {
            $data['completed_at'] = date('Y-m-d H:i:s');
        }

        return Database::update(
            'quest_sessions',
            $data,
            'id = :id',
            ['id' => $id]
        ) > 0;
    }

    public static function updateStateByUid(string $sessionUid, array $state): bool
    {
        return Database::update(
            'quest_sessions',
            ['state_json' => json_encode($state, JSON_UNESCAPED_SLASHES)],
            'session_uid = :session_uid',
            ['session_uid' => $sessionUid]
        ) > 0;
    }
}

