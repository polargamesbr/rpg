<?php

namespace App\Models;

class Character
{
    public static function create(array $data): int
    {
        return Database::insert('characters', $data);
    }

    public static function findById(int $id): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM characters WHERE id = :id",
            ['id' => $id]
        );
    }

    public static function findByUuid(string $uuid): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM characters WHERE uuid = :uuid",
            ['uuid' => $uuid]
        );
    }

    public static function findByUser(int $userId): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM characters WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1",
            ['user_id' => $userId]
        );
    }

    public static function findAllByUser(int $userId): array
    {
        return Database::fetchAll(
            "SELECT * FROM characters WHERE user_id = :user_id ORDER BY created_at DESC",
            ['user_id' => $userId]
        );
    }

    public static function update(int $id, array $data): int
    {
        return Database::update('characters', $data, 'id = :id', ['id' => $id]);
    }

    public static function delete(int $id): int
    {
        return Database::delete('characters', 'id = :id', ['id' => $id]);
    }

    public static function nameExists(string $name, ?int $excludeId = null): bool
    {
        $sql = "SELECT COUNT(*) as count FROM characters WHERE name = :name";
        $params = ['name' => $name];
        
        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $result = Database::fetchOne($sql, $params);
        return ($result['count'] ?? 0) > 0;
    }
}

