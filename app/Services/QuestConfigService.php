<?php

namespace App\Services;

/**
 * Loads quest configuration from static JSON files.
 * Similar to EntitySheetService, but for quest configurations.
 */
class QuestConfigService
{
    /**
     * Load quest configuration from JSON file.
     * 
     * @param string $questId Quest identifier (e.g., 'first-steps')
     * @return array<string, mixed>|null Configuration array or null if not found
     */
    public static function loadConfig(string $questId): ?array
    {
        $questId = trim(strtolower($questId));
        $filePath = self::getConfigPath($questId);
        
        if (!file_exists($filePath)) {
            error_log("[QuestConfigService] Config file not found: {$filePath}");
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
        
        // Normalize and inject mapImage based on quest ID
        $config = self::normalize($config, $questId);
        
        return $config;
    }
    
    /**
     * Get the file path for a quest configuration.
     * 
     * @param string $questId Quest identifier
     * @return string Full file path
     */
    private static function getConfigPath(string $questId): string
    {
        // app/Services -> app/GameData/quests/
        $basePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'quests';
        
        // Ensure directory exists
        if (!is_dir($basePath)) {
            @mkdir($basePath, 0755, true);
        }
        
        return $basePath . DIRECTORY_SEPARATOR . $questId . '.json';
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
        // Ensure map config exists
        if (!isset($config['map']) || !is_array($config['map'])) {
            $config['map'] = [];
        }
        
        // Inject mapImage based on quest ID
        // Format: /public/assets/img/maps/{questId}.png
        $mapImagePath = '/public/assets/img/maps/' . $questId . '.png';
        $config['map']['mapImage'] = $mapImagePath;
        
        // Set defaults for map if missing
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
     * List all available quest configurations.
     * 
     * @return array<string> Array of quest IDs
     */
    public static function listAvailable(): array
    {
        $basePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'quests';
        
        if (!is_dir($basePath)) {
            return [];
        }
        
        $files = glob($basePath . DIRECTORY_SEPARATOR . '*.json') ?: [];
        $questIds = [];
        
        foreach ($files as $file) {
            $filename = basename($file, '.json');
            $questIds[] = $filename;
        }
        
        sort($questIds);
        return $questIds;
    }
}

