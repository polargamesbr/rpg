<?php

namespace App\Services;

/**
 * Loads data-only "entity sheets" from disk.
 * Characters and monsters share the same schema. The field `is_player` is used only for
 * schema defaults (e.g. combat_key, attacks); battle side (ally/enemy) is defined by the
 * mission (allies[] vs enemies[]), not by this flag.
 */
class EntitySheetService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return array_values(array_merge(self::allClasses(), self::allMonsters()));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function allClasses(): array
    {
        return self::loadDir(self::basePath('classes'));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function allMonsters(): array
    {
        return self::loadDir(self::basePath('monsters'));
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $id): ?array
    {
        $id = trim(strtolower($id));
        foreach (self::all() as $sheet) {
            if (isset($sheet['id']) && strtolower((string)$sheet['id']) === $id) {
                return $sheet;
            }
        }
        return null;
    }

    /**
     * Find multiple entities by IDs or combat_keys (batch)
     * 
     * @param array<string> $ids - Can be entity IDs or combat_keys
     * @return array<string, array<string, mixed>>
     */
    public static function findBatch(array $ids): array
    {
        $result = [];
        $normalizedIds = array_map(fn($id) => trim(strtolower($id)), $ids);
        
        foreach (self::all() as $sheet) {
            if (isset($sheet['id'])) {
                $sheetId = strtolower(trim((string)$sheet['id']));
                $combatKey = isset($sheet['combat_key']) ? strtolower(trim((string)$sheet['combat_key'])) : null;
                
                // Match by ID or combat_key
                if (in_array($sheetId, $normalizedIds, true)) {
                    $result[$sheetId] = $sheet;
                } elseif ($combatKey && in_array($combatKey, $normalizedIds, true)) {
                    // If matched by combat_key, use combat_key as key for result
                    $result[$combatKey] = $sheet;
                }
            }
        }

        return $result;
    }

    /**
     * Find entity by combat_key (legacy compatibility)
     * Also searches by id if combat_key doesn't match
     * 
     * @param string $combatKey
     * @return array<string, mixed>|null
     */
    public static function findByCombatKey(string $combatKey): ?array
    {
        $combatKey = trim(strtolower($combatKey));
        
        foreach (self::all() as $sheet) {
            $sheetCombatKey = isset($sheet['combat_key']) ? strtolower(trim((string)$sheet['combat_key'])) : null;
            if ($sheetCombatKey === $combatKey) {
                return $sheet;
            }
            // Fallback: also check by id
            if (isset($sheet['id'])) {
                $sheetId = strtolower(trim((string)$sheet['id']));
                if ($sheetId === $combatKey) {
                    return $sheet;
                }
            }
        }
        
        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function loadDir(string $dir): array
    {
        if (!is_dir($dir)) {
            return [];
        }

        $files = glob($dir . DIRECTORY_SEPARATOR . '*.php') ?: [];
        sort($files);

        $sheets = [];
        foreach ($files as $file) {
            $data = require $file;
            if (!is_array($data)) {
                continue;
            }

            $normalized = self::normalize($data);
            self::validateBasic($normalized, $file);
            $sheets[] = $normalized;
        }

        return $sheets;
    }

    private static function basePath(string $subdir): string
    {
        // app/Services -> app/GameData/sheets/...
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'sheets' . DIRECTORY_SEPARATOR . $subdir;
    }

    /**
     * Ensure consistent keys and safe defaults.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function normalize(array $data): array
    {
        $data['id'] = isset($data['id']) ? (string)$data['id'] : '';
        $data['type'] = isset($data['type']) ? (string)$data['type'] : 'unknown';
        $data['is_player'] = (bool)($data['is_player'] ?? false);
        $data['name'] = isset($data['name']) ? (string)$data['name'] : $data['id'];
        $data['display_name'] = isset($data['display_name']) ? (string)$data['display_name'] : $data['name'];
        $data['role'] = isset($data['role']) ? (string)$data['role'] : '';
        $data['base_level'] = (int)($data['base_level'] ?? 1);

        $data['attributes'] = is_array($data['attributes'] ?? null) ? $data['attributes'] : [];
        $data['skills'] = is_array($data['skills'] ?? null) ? $data['skills'] : [];
        $data['images'] = is_array($data['images'] ?? null) ? $data['images'] : [];
        $data['animations'] = is_array($data['animations'] ?? null) ? $data['animations'] : [];
        $data['sounds'] = is_array($data['sounds'] ?? null) ? $data['sounds'] : [];

        // Global Growth Multipliers for Scaling
        $defaultGrowth = [
            'hp_base_per_level' => 100, // Hero default
            'hp_vit_mult'       => 20,
            'sp_base_per_level' => 10,
            'sp_int_mult'       => 5,
            'atk_base'          => 50,
            'atk_str_mult'      => 2,
            'atk_dex_mult'      => 0.5,
            'atk_lvl_mult'      => 1.5,
            'matk_base'         => 30,
            'matk_int_mult'     => 2,
            'matk_str_mult'     => 0,
            'matk_lvl_mult'     => 1.2,
        ];
        $data['growth'] = array_merge($defaultGrowth, $data['growth'] ?? []);

        // Element field (defaults to 'neutral' if not specified)
        if (!isset($data['element'])) {
            $data['element'] = 'neutral';
        } else {
            $data['element'] = (string)$data['element'];
        }

        // Optional fields
        if (!isset($data['attacks'])) {
            $data['attacks'] = $data['is_player'] ? 1 : (int)($data['attacks'] ?? 1);
        }
        if (!isset($data['loot_table'])) {
            $data['loot_table'] = null;
        }

        // Generate combat_key if not set (for legacy compatibility)
        if (!isset($data['combat_key'])) {
            if ($data['is_player']) {
                // Player classes: map class names to legacy combat_keys
                $classCombatKeyMap = [
                    'swordsman' => 'hero_swordman',  // Note: 'swordsman' -> 'hero_swordman' (without 's')
                    'archer' => 'hero_archer',
                    'mage' => 'hero_mage',
                    'thief' => 'hero_thief',
                    'acolyte' => 'hero_acolyte',
                    'blacksmith' => 'hero_blacksmith',
                    'beast_tamer' => 'beast_tamer',
                ];
                $classId = strtolower($data['id']);
                $data['combat_key'] = $classCombatKeyMap[$classId] ?? ('hero_' . $data['id']);
            } else {
                // Monsters: use id as combat_key
                $data['combat_key'] = $data['id'];
            }
        }

        // Combat stats (repassar quando existirem no sheet; getCombatStats() trata ausentes)
        if (array_key_exists('maxHp', $data)) $data['maxHp'] = (int)$data['maxHp'];
        if (array_key_exists('maxSp', $data)) $data['maxSp'] = (int)$data['maxSp'];
        if (array_key_exists('attack', $data)) $data['attack'] = (int)$data['attack'];
        if (array_key_exists('defense', $data)) $data['defense'] = (int)$data['defense'];
        if (array_key_exists('moveRange', $data)) $data['moveRange'] = (int)$data['moveRange'];
        if (array_key_exists('attackRange', $data)) $data['attackRange'] = (int)$data['attackRange'];
        if (array_key_exists('behavior', $data)) $data['behavior'] = (string)$data['behavior'];
        if (array_key_exists('scale', $data)) $data['scale'] = (float)$data['scale'];

        return $data;
    }

    /**
     * Extrai stats de combate do sheet (maxHp, maxSp, attack, defense, moveRange, attackRange, behavior, scale).
     * Usa valores do sheet quando existem; senão deriva attack/defense de attributes; defaults para o resto.
     *
     * @param array<string, mixed> $sheet Sheet normalizado
     * @return array{maxHp: int, maxSp: int, attack: int, defense: int, moveRange: int, attackRange: int, behavior: string, scale: float}
     */
    public static function getCombatStats(array $sheet): array
    {
        $attrs = $sheet['attributes'] ?? [];
        $attack = array_key_exists('attack', $sheet)
            ? (int)$sheet['attack']
            : (int)round((($attrs['str'] ?? 10) + ($attrs['dex'] ?? 10)) / 2);
        $defense = array_key_exists('defense', $sheet)
            ? (int)$sheet['defense']
            : (int)round((($attrs['vit'] ?? 10) + ($attrs['agi'] ?? 10)) / 2);

        $isMonster = ($sheet['type'] ?? '') === 'monster';

        return [
            'maxHp' => (int)($sheet['maxHp'] ?? 100),
            'maxSp' => (int)($sheet['maxSp'] ?? 50),
            'attack' => $attack,
            'defense' => $defense,
            'moveRange' => (int)($sheet['moveRange'] ?? 4),
            'attackRange' => (int)($sheet['attackRange'] ?? 1),
            'behavior' => $isMonster ? (string)($sheet['behavior'] ?? 'aggressive') : 'aggressive',
            'scale' => (float)($sheet['scale'] ?? 1.0),
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function validateBasic(array $data, string $file): void
    {
        if ($data['id'] === '') {
            throw new \RuntimeException("Entity sheet missing 'id' in: {$file}");
        }
        if (!in_array($data['type'], ['class', 'monster'], true)) {
            throw new \RuntimeException("Entity sheet has invalid 'type' in: {$file}");
        }

        // Required attributes keys (combat-data.js style)
        $requiredAttr = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];
        foreach ($requiredAttr as $k) {
            if (!array_key_exists($k, $data['attributes'])) {
                throw new \RuntimeException("Entity sheet '{$data['id']}' missing attribute '{$k}' in: {$file}");
            }
        }
    }
}



