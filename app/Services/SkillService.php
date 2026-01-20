<?php

namespace App\Services;

use App\Services\EntitySheetService;

/**
 * Service for extracting and normalizing skills from entity sheets.
 * Skills are stored inline within entity PHP files.
 */
class SkillService
{
    /**
     * Cache of loaded skills to avoid re-scanning entities
     * @var array<string, array<string, mixed>>
     */
    private static array $skillCache = [];

    /**
     * Get a single skill by ID
     * 
     * @param string $id
     * @return array<string, mixed>|null
     */
    public static function getSkill(string $id): ?array
    {
        $id = trim(strtolower($id));
        
        // Check cache first
        if (isset(self::$skillCache[$id])) {
            return self::$skillCache[$id];
        }

        // Load all entities and extract skills
        self::loadAllSkills();

        return self::$skillCache[$id] ?? null;
    }

    /**
     * Get multiple skills by IDs (batch)
     * 
     * @param array<string> $ids
     * @return array<string, array<string, mixed>>
     */
    public static function getSkills(array $ids): array
    {
        // Load all skills if not already loaded
        self::loadAllSkills();

        $result = [];
        foreach ($ids as $id) {
            $id = trim(strtolower($id));
            if (isset(self::$skillCache[$id])) {
                $result[$id] = self::$skillCache[$id];
            }
        }

        return $result;
    }

    /**
     * Load all skills from all entities into cache
     */
    private static function loadAllSkills(): void
    {
        // If cache is not empty, already loaded
        if (!empty(self::$skillCache)) {
            return;
        }

        // Get all entities
        $entities = EntitySheetService::all();

        foreach ($entities as $entity) {
            if (isset($entity['skills']) && is_array($entity['skills'])) {
                foreach ($entity['skills'] as $skill) {
                    if (is_array($skill) && isset($skill['id'])) {
                        $skillId = strtolower(trim((string)$skill['id']));
                        // Normalize skill structure to match skills-data.js format
                        self::$skillCache[$skillId] = self::normalizeSkill($skill);
                    }
                }
            }
        }
    }

    /**
     * Normalize skill structure from PHP entity format to JavaScript skills-data.js format
     * 
     * @param array<string, mixed> $skill
     * @return array<string, mixed>
     */
    private static function normalizeSkill(array $skill): array
    {
        $normalized = [
            'id' => $skill['id'] ?? '',
            'name' => $skill['name'] ?? $skill['id'] ?? '',
            'desc' => $skill['description'] ?? $skill['desc'] ?? '',
            'mana' => (int)($skill['mana'] ?? 0),
            'dmgMult' => (float)($skill['dmg_mult'] ?? $skill['dmgMult'] ?? 0.0),
            'type' => $skill['type'] ?? 'single',
        ];

        // Map icon to img if needed
        if (isset($skill['icon'])) {
            $normalized['icon'] = $skill['icon'];
            // Try to construct img path from icon name
            $iconName = $skill['icon'];
            $skillId = $normalized['id'];
            $normalized['img'] = "/public/assets/icons/skills/{$skillId}.webp";
        }

        // Copy optional fields if present
        $optionalFields = [
            'img', 'range', 'rangeType', 'aoe', 'gridVisual', 
            'hits', 'effect', 'buff', 'ultimate'
        ];

        foreach ($optionalFields as $field) {
            if (isset($skill[$field])) {
                $normalized[$field] = $skill[$field];
            }
        }

        // Handle range and rangeType defaults
        if (!isset($normalized['range'])) {
            if ($normalized['type'] === 'single') {
                $normalized['range'] = 1;
                $normalized['rangeType'] = 'single';
            } elseif ($normalized['type'] === 'self') {
                $normalized['range'] = 0;
                $normalized['rangeType'] = 'self';
            } else {
                $normalized['range'] = 1;
                $normalized['rangeType'] = $normalized['type'];
            }
        }

        // Handle aoe default
        if (!isset($normalized['aoe'])) {
            $normalized['aoe'] = 0;
        }

        // Handle gridVisual default
        if (!isset($normalized['gridVisual'])) {
            if ($normalized['range'] <= 1) {
                $normalized['gridVisual'] = 'melee';
            } else {
                $normalized['gridVisual'] = 'ranged';
            }
        }

        return $normalized;
    }

    /**
     * Get all available skill IDs
     * 
     * @return array<string>
     */
    public static function getAllSkillIds(): array
    {
        self::loadAllSkills();
        return array_keys(self::$skillCache);
    }
}
