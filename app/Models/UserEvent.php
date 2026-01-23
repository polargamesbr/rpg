<?php

namespace App\Models;

class UserEvent
{
    public static function get(int $userId, string $key): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM user_events WHERE user_id = :user_id AND event_key = :event_key",
            ['user_id' => $userId, 'event_key' => $key]
        );
    }

    public static function set(int $userId, string $key, ?string $value = null): void
    {
        $existing = self::get($userId, $key);
        if ($existing) {
            Database::update(
                'user_events',
                ['event_value' => $value],
                'user_id = :user_id AND event_key = :event_key',
                ['user_id' => $userId, 'event_key' => $key]
            );
            return;
        }

        Database::insert('user_events', [
            'user_id' => $userId,
            'event_key' => $key,
            'event_value' => $value
        ]);
    }
}

