<?php

namespace App\Models;

/**
 * Quest definitions are now loaded from PHP file instead of database.
 * File: app/GameData/quests.php
 */
class QuestDefinition
{
    private static ?array $definitions = null;

    /**
     * Load all quest definitions from PHP file.
     * @return array<string, array<string, mixed>>
     */
    private static function loadAll(): array
    {
        if (self::$definitions === null) {
            $path = dirname(__DIR__) . '/GameData/quests.php';
            self::$definitions = file_exists($path) ? (require $path) : [];
        }
        return self::$definitions;
    }

    /**
     * Find a quest definition by ID.
     * @param string $id Quest ID (e.g., 'first-steps')
     * @return array<string, mixed>|null Quest data or null if not found
     */
    public static function findById(string $id): ?array
    {
        $all = self::loadAll();
        return $all[$id] ?? null;
    }

    /**
     * Get all active quest definitions.
     * @return array<int, array<string, mixed>> Array of all quests
     */
    public static function findAllActive(): array
    {
        return array_values(self::loadAll());
    }
}
