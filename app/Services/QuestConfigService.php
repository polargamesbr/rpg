<?php

namespace App\Services;

/**
 * Loads quest configuration from PHP or JSON files.
 * 
 * Quest files contain all data: map config, walls, allies, enemies, objectives.
 * Files are located in: app/GameData/quests/
 * 
 * Supported formats (in order of priority):
 * 1. PHP: quests/{quest-id}.php (returns array)
 * 2. JSON: quests/{quest-id}.json
 * 
 * @see app/GameData/README.md for full documentation
 */
class QuestConfigService
{
    /**
     * Load quest configuration from file.
     * Tries PHP first, then JSON.
     *
     * @param string $questId Quest identifier (e.g., 'first-steps')
     * @return array<string, mixed>|null Configuration array or null if not found
     */
    public static function loadConfig(string $questId): ?array
    {
        $questId = trim(strtolower($questId));
        $basePath = self::getQuestsPath();
        
        // Try PHP first (preferred format)
        $phpPath = $basePath . DIRECTORY_SEPARATOR . $questId . '.php';
        if (file_exists($phpPath)) {
            $config = require $phpPath;
            if (is_array($config)) {
                return self::normalize($config, $questId);
            }
            error_log("[QuestConfigService] PHP file does not return array: {$phpPath}");
            return null;
        }
        
        // Fallback to JSON
        $jsonPath = $basePath . DIRECTORY_SEPARATOR . $questId . '.json';
        if (file_exists($jsonPath)) {
            $jsonContent = file_get_contents($jsonPath);
            if ($jsonContent === false) {
                error_log("[QuestConfigService] Failed to read JSON file: {$jsonPath}");
                return null;
            }
            
            $config = json_decode($jsonContent, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("[QuestConfigService] Invalid JSON: {$jsonPath} - " . json_last_error_msg());
                return null;
            }
            
            if (!is_array($config)) {
                error_log("[QuestConfigService] JSON does not contain array: {$jsonPath}");
                return null;
            }
            
            return self::normalize($config, $questId);
        }
        
        error_log("[QuestConfigService] Config file not found for: {$questId}");
        return null;
    }
    
    /**
     * Get the base path for quests directory.
     */
    private static function getQuestsPath(): string
    {
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'GameData' . DIRECTORY_SEPARATOR . 'quests';
    }
    
    /**
     * Normalize and validate configuration structure.
     * 
     * @param array<string, mixed> $config Raw config
     * @param string $questId Quest identifier for mapImage inference
     * @return array<string, mixed> Normalized config
     */
    private static function normalize(array $config, string $questId): array
    {
        // Map configuration
        if (!isset($config['map']) || !is_array($config['map'])) {
            $config['map'] = [];
        }
        
        $config['map']['gridCols'] = (int)($config['map']['gridCols'] ?? 60);
        $config['map']['gridRows'] = (int)($config['map']['gridRows'] ?? 20);
        $config['map']['cellSize'] = (int)($config['map']['cellSize'] ?? 64);
        
        if (empty($config['map']['mapImage'])) {
            $config['map']['mapImage'] = '/public/assets/img/maps/' . $questId . '.webp';
        }
        
        // Player configuration
        if (!isset($config['player_start']) || !is_array($config['player_start'])) {
            $config['player_start'] = ['x' => 5, 'y' => 5];
        }
        
        if (!isset($config['player_defaults']) || !is_array($config['player_defaults'])) {
            $config['player_defaults'] = [
                'moveRange' => 4,
                'attackRange' => 1,
                'scale' => 1.0
            ];
        }
        
        // Arrays (empty if not provided)
        $config['allies'] = is_array($config['allies'] ?? null) ? $config['allies'] : [];
        $config['enemies'] = is_array($config['enemies'] ?? null) ? $config['enemies'] : [];
        $config['chests'] = is_array($config['chests'] ?? null) ? $config['chests'] : [];
        $config['walls'] = is_array($config['walls'] ?? null) ? $config['walls'] : [];
        $config['objectives'] = is_array($config['objectives'] ?? null) ? $config['objectives'] : [];
        $config['rules'] = is_array($config['rules'] ?? null) ? $config['rules'] : [];
        
        // Introductory and outro dialogues
        $config['intro_dialogue'] = (string)($config['intro_dialogue'] ?? '');
        $config['outro_dialogue'] = (string)($config['outro_dialogue'] ?? '');
        
        // Portal is optional
        if (!array_key_exists('portal', $config)) {
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
        $ids = [];
        $basePath = self::getQuestsPath();
        
        if (!is_dir($basePath)) {
            return [];
        }
        
        // PHP files (preferred)
        $phpFiles = glob($basePath . DIRECTORY_SEPARATOR . '*.php') ?: [];
        foreach ($phpFiles as $f) {
            $ids[basename($f, '.php')] = true;
        }
        
        // JSON files (fallback)
        $jsonFiles = glob($basePath . DIRECTORY_SEPARATOR . '*.json') ?: [];
        foreach ($jsonFiles as $f) {
            $id = basename($f, '.json');
            if (!isset($ids[$id])) { // PHP takes precedence
                $ids[$id] = true;
            }
        }
        
        $questIds = array_keys($ids);
        sort($questIds);
        return $questIds;
    }
}
