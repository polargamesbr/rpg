<?php

namespace App\Services;

use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\InvalidUuidStringException;

class UuidService
{
    public static function generate(): string
    {
        return Uuid::uuid4()->toString();
    }

    public static function isValid(string $uuid): bool
    {
        try {
            Uuid::fromString($uuid);
            return true;
        } catch (InvalidUuidStringException $e) {
            return false;
        }
    }

    public static function validate(string $uuid): string
    {
        if (!self::isValid($uuid)) {
            throw new \InvalidArgumentException("Invalid UUID format: {$uuid}");
        }
        return $uuid;
    }
}


