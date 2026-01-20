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
        $character = Database::fetchOne(
            "SELECT c.*, cl.name as class_name, cl.display_name as class_display_name, cl.uuid as class_uuid,
                    cl.starting_city, cl.icon_name, cl.color_hex, cl.color_glow, cl.image_prefix, cl.entity_id as class_entity_id
             FROM characters c
             INNER JOIN classes cl ON c.class_id = cl.id
             WHERE c.id = :id",
            ['id' => $id]
        );
        
        if ($character) {
            // Add class data to character array for backward compatibility
            $character['class'] = $character['class_name'];
        }
        
        return $character;
    }

    public static function findByUuid(string $uuid): ?array
    {
        $character = Database::fetchOne(
            "SELECT c.*, cl.name as class_name, cl.display_name as class_display_name, cl.uuid as class_uuid,
                    cl.starting_city, cl.icon_name, cl.color_hex, cl.color_glow, cl.image_prefix, cl.entity_id as class_entity_id
             FROM characters c
             INNER JOIN classes cl ON c.class_id = cl.id
             WHERE c.uuid = :uuid",
            ['uuid' => $uuid]
        );
        
        if ($character) {
            // Add class data to character array for backward compatibility
            $character['class'] = $character['class_name'];
        }
        
        return $character;
    }

    public static function findByUser(int $userId): ?array
    {
        $character = Database::fetchOne(
            "SELECT c.*, cl.name as class_name, cl.display_name as class_display_name, cl.uuid as class_uuid,
                    cl.starting_city, cl.icon_name, cl.color_hex, cl.color_glow, cl.image_prefix, cl.entity_id as class_entity_id
             FROM characters c
             INNER JOIN classes cl ON c.class_id = cl.id
             WHERE c.user_id = :user_id ORDER BY c.created_at DESC LIMIT 1",
            ['user_id' => $userId]
        );
        
        if ($character) {
            // Add class data to character array for backward compatibility
            $character['class'] = $character['class_name'];
        }
        
        return $character;
    }

    public static function findAllByUser(int $userId): array
    {
        $characters = Database::fetchAll(
            "SELECT c.*, cl.name as class_name, cl.display_name as class_display_name, cl.uuid as class_uuid,
                    cl.starting_city, cl.icon_name, cl.color_hex, cl.color_glow, cl.image_prefix, cl.entity_id as class_entity_id
             FROM characters c
             INNER JOIN classes cl ON c.class_id = cl.id
             WHERE c.user_id = :user_id ORDER BY c.created_at DESC",
            ['user_id' => $userId]
        );
        
        // Add class data to each character for backward compatibility
        foreach ($characters as &$character) {
            $character['class'] = $character['class_name'];
        }
        unset($character);
        
        return $characters;
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

