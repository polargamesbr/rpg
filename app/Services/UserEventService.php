<?php

namespace App\Services;

use App\Models\UserEvent;

class UserEventService
{
    public static function hasEvent(int $userId, string $key): bool
    {
        return UserEvent::get($userId, $key) !== null;
    }

    public static function setEvent(int $userId, string $key, ?string $value = null): void
    {
        UserEvent::set($userId, $key, $value);
    }
}

