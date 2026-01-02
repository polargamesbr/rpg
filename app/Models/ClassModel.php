<?php

namespace App\Models;

class ClassModel
{
    public static function findAll(): array
    {
        // Order: Swordsman, Archer, Mage, Thief, Acolyte, Blacksmith
        $classes = Database::fetchAll("SELECT * FROM classes");
        
        // Define the order
        $order = [
            'Swordsman' => 1,
            'Archer' => 2,
            'Mage' => 3,
            'Thief' => 4,
            'Acolyte' => 5,
            'Blacksmith' => 6
        ];
        
        // Sort classes according to the defined order
        usort($classes, function($a, $b) use ($order) {
            $orderA = $order[$a['name']] ?? 999;
            $orderB = $order[$b['name']] ?? 999;
            return $orderA <=> $orderB;
        });
        
        return $classes;
    }

    public static function findById(int $id): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM classes WHERE id = :id",
            ['id' => $id]
        );
    }

    public static function findByUuid(string $uuid): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM classes WHERE uuid = :uuid",
            ['uuid' => $uuid]
        );
    }

    public static function findByName(string $name): ?array
    {
        return Database::fetchOne(
            "SELECT * FROM classes WHERE name = :name",
            ['name' => $name]
        );
    }

    public static function getBaseAttributes(string $className): ?array
    {
        $class = self::findByName($className);
        
        if (!$class) {
            return null;
        }

        return [
            'str' => (int)$class['str_base'],
            'agi' => (int)$class['agi_base'],
            'vit' => (int)$class['vit_base'],
            'int' => (int)$class['int_base'],
            'dex' => (int)$class['dex_base'],
            'luk' => (int)$class['luk_base']
        ];
    }
}

