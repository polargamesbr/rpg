<?php

namespace App\Models;

class User
{
    public static function create(array $data): int
    {
        return Database::insert('users', $data);
    }

    public static function findById(int $id): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM users WHERE id = :id",
            ['id' => $id]
        );
    }

    public static function findByUuid(string $uuid): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM users WHERE uuid = :uuid",
            ['uuid' => $uuid]
        );
    }

    public static function findByEmail(string $email): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM users WHERE email = :email",
            ['email' => $email]
        );
    }


    public static function update(int $id, array $data): int
    {
        return Database::update('users', $data, 'id = :id', ['id' => $id]);
    }

    public static function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) as count FROM users WHERE email = :email";
        $params = ['email' => $email];
        
        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $result = Database::fetchOne($sql, $params);
        return ($result['count'] ?? 0) > 0;
    }

}

