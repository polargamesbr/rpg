<?php

namespace App\Services;

/**
 * Loads quest configuration from static JSON files.
 * Similar to EntitySheetService, but for quest configurations.
 */
class QuestConfigService
{
    /**
     * Load quest/mission configuration from JSON file.
     * Tries missions/ first, then quests/. If the config has map_id, loads the map
     * from maps/ and merges map + walls into the config.
     *
     * @param string $questId Quest identifier (e.g., 'first-steps')
     * @return array<string, mixed>|null Configuration array or null if not found
     */
    public static function loadConfig(string $questId): ?array
    {
        $questId = trim(strtolower($questId));
        $filePath = self::getMissionPath($questId) ?? self::getQuestPath($questId);

        if ($filePath === null || !file_exists($filePath)) {
            error_log("[QuestConfigService] Config file not found for: {$questId}");
            return null;
        }

        $jsonContent = file_get_contents($filePath);
        if ($jsonContent === false) {
            error_log("[QuestConfigService] Failed to read config file: {$filePath}");
            return null;
        }

        $config = json_decode($jsonContent, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("[QuestConfigService] Invalid JSON in config file: {$filePath} - " . json_last_error_msg());
            return null;
        }

        if (!is_array($config)) {
            error_log("[QuestConfigService] Config file does not contain an array: {$filePath}");
            return null;
        }

        $mapId = isset($config['map_id']) ? trim((string)$config['map_id']) : null;
        if ($mapId !== null && $mapId !== '') {
            $mapData = self::loadMap($mapId);
            if ($mapData !== null) {
                $config['map'] = [
                    'gridCols' => (int)($mapData['gridCols'] ?? 20),
                    'gridRows' => (int)($mapData['gridRows'] ?? 15),
                    'cellSize' => (int)($mapData['cellSize'] ?? 64),
                    'mapImage' => $mapData['mapImage'] ?? ('/public/assets/img/maps/' . $mapId . '.png'),
                ];
                $config['walls'] = is_array($mapData['walls'] ?? null) ? $mapData['walls'] : [];
            }
        }

        $config = self::normalize($config, $questId);

        return $config;
    }

    /**
     * Load a map definition from maps/.
     *
     * @param string $mapId Map identifier (e.g., 'castle-dungeon')
     * @return array<string, mixed>|null Map data or null if not found
     */
    public static function loadMap(string $mapId): ?array
    {
        $mapId = trim(strtolower($mapId));
        $basePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'maps';
        $filePath = $basePath . DIRECTORY_SEPARATOR . $mapId . '.json';

        if (!file_exists($filePath)) {
            error_log("[QuestConfigService] Map file not found: {$filePath}");
            return null;
        }

        $json = file_get_contents($filePath);
        if ($json === false) {
            return null;
        }

        $data = json_decode($json, true);
        return is_array($data) ? $data : null;
    }

    /**
     * Get the file path for a mission (missions/). Returns null if not found.
     */
    private static function getMissionPath(string $questId): ?string
    {
        $base = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'missions';
        $path = $base . DIRECTORY_SEPARATOR . $questId . '.json';
        return file_exists($path) ? $path : null;
    }

    /**
     * Get the file path for a quest (quests/). Does not check existence.
     */
    private static function getQuestPath(string $questId): string
    {
        $base = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'quests';
        if (!is_dir($base)) {
            @mkdir($base, 0755, true);
        }
        return $base . DIRECTORY_SEPARATOR . $questId . '.json';
    }
    
    /**
     * Normalize and validate configuration structure.
     * Injects mapImage based on quest ID.
     * 
     * @param array<string, mixed> $config Raw config from JSON
     * @param string $questId Quest identifier for mapImage inference
     * @return array<string, mixed> Normalized config
     */
    private static function normalize(array $config, string $questId): array
    {
        if (!isset($config['map']) || !is_array($config['map'])) {
            $config['map'] = [];
        }

        if (!isset($config['map']['mapImage']) || $config['map']['mapImage'] === '') {
            $config['map']['mapImage'] = '/public/assets/img/maps/' . $questId . '.png';
        }

        $config['map']['gridCols'] = (int)($config['map']['gridCols'] ?? 20);
        $config['map']['gridRows'] = (int)($config['map']['gridRows'] ?? 15);
        $config['map']['cellSize'] = (int)($config['map']['cellSize'] ?? 64);
        
        // Ensure player_start exists
        if (!isset($config['player_start']) || !is_array($config['player_start'])) {
            $config['player_start'] = ['x' => 5, 'y' => 5];
        }
        
        // Ensure player_defaults exists
        if (!isset($config['player_defaults']) || !is_array($config['player_defaults'])) {
            $config['player_defaults'] = [
                'moveRange' => 4,
                'attackRange' => 1,
                'scale' => 1.0
            ];
        }
        
        // Ensure arrays exist (empty if not provided)
        $config['enemies'] = is_array($config['enemies'] ?? null) ? $config['enemies'] : [];
        $config['chests'] = is_array($config['chests'] ?? null) ? $config['chests'] : [];
        $config['walls'] = is_array($config['walls'] ?? null) ? $config['walls'] : [];
        $config['objectives'] = is_array($config['objectives'] ?? null) ? $config['objectives'] : [];
        $config['rules'] = is_array($config['rules'] ?? null) ? $config['rules'] : [];
        
        // Portal is optional (can be null)
        if (!isset($config['portal'])) {
            $config['portal'] = null;
        }
        
        return $config;
    }
    
    /**
     * List all available quest/mission configurations.
     * Looks in missions/ first, then quests/; missions take precedence (no duplicates).
     *
     * @return array<string> Array of quest IDs
     */
    public static function listAvailable(): array
    {
        $ids = [];
        $missionsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'missions';
        if (is_dir($missionsPath)) {
            $files = glob($missionsPath . DIRECTORY_SEPARATOR . '*.json') ?: [];
            foreach ($files as $f) {
                $ids[basename($f, '.json')] = true;
            }
        }
        $questsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'quests';
        if (is_dir($questsPath)) {
            $files = glob($questsPath . DIRECTORY_SEPARATOR . '*.json') ?: [];
            foreach ($files as $f) {
                $ids[basename($f, '.json')] = true;
            }
        }
        $questIds = array_keys($ids);
        sort($questIds);
        return $questIds;
    }
}

