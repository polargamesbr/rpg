<?php

namespace App\Services;

/**
 * Loads data-only "entity sheets" from disk.
 * Characters and monsters share the same schema; the main difference is `is_player`.
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

        // Optional fields
        if (!isset($data['attacks'])) {
            $data['attacks'] = $data['is_player'] ? 1 : (int)($data['attacks'] ?? 1);
        }
        if (!isset($data['loot_table'])) {
            $data['loot_table'] = null;
        }

        return $data;
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



