<?php

namespace App\Services;

use App\Models\QuestDefinition;
use App\Models\QuestSession;
use App\Models\QuestEvent;
use App\Models\QuestBattleSession;
use App\Models\Database;
use App\Services\QuestConfigService;

class QuestService
{
    public static function startQuestSession(int $userId, array $character, string $questId): array
    {
        $definition = QuestDefinition::findById($questId);
        if (!$definition) {
            throw new \RuntimeException('Quest não encontrada.');
        }

        $existing = QuestSession::findActiveByUser($userId);
        if ($existing) {
            return [
                'session_uid' => $existing['session_uid'],
                'session_id' => (int)$existing['id'],
                'quest_id' => $existing['quest_id']
            ];
        }

        // Load config from static JSON file
        $config = QuestConfigService::loadConfig($questId);
        if (!$config) {
            throw new \RuntimeException("Config file not found for quest: {$questId}");
        }

        $sessionUid = UuidService::generate();
        $snapshot = self::buildSnapshot($character);
        $state = self::buildInitialState($character, $config);

        $sessionId = QuestSession::create([
            'session_uid' => $sessionUid,
            'user_id' => $userId,
            'character_id' => (int)$character['id'],
            'quest_id' => $definition['id'],
            'status' => 'active',
            'snapshot_json' => json_encode($snapshot, JSON_UNESCAPED_SLASHES),
            'state_json' => json_encode($state, JSON_UNESCAPED_SLASHES)
        ]);

        return [
            'session_uid' => $sessionUid,
            'session_id' => $sessionId,
            'quest_id' => $definition['id']
        ];
    }

    public static function getSessionState(string $sessionUid, int $userId): ?array
    {
        $session = QuestSession::findBySessionUid($sessionUid);
        if (!$session || (int)$session['user_id'] !== $userId) {
            return null;
        }

        $definition = QuestDefinition::findById($session['quest_id']);
        if (!$definition) {
            return null;
        }

        // Load config from static JSON file
        $config = QuestConfigService::loadConfig($session['quest_id']);
        if (!$config) {
            // Fallback to empty config if file not found (backward compatibility during migration)
            $config = [];
        }
        
        $state = json_decode($session['state_json'] ?? '{}', true) ?: [];
        $snapshot = json_decode($session['snapshot_json'] ?? '{}', true) ?: [];

        // Mesclar config de animação do JSON da quest sobre o state carregado,
        // para que alterações em animationFPS, animationScale, etc. se apliquem
        // a sessões já existentes (sem precisar reiniciar a quest).
        $configEnemies = $config['enemies'] ?? [];
        $stateEnemies = &$state['enemies'];
        if (is_array($stateEnemies)) {
            foreach ($configEnemies as $ce) {
                $eid = $ce['id'] ?? null;
                if ($eid === null) continue;
                foreach ($stateEnemies as $i => $se) {
                    if (($se['id'] ?? '') === $eid) {
                        // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
                        if (isset($ce['animations']) && is_array($ce['animations'])) {
                            $stateEnemies[$i]['animations'] = $ce['animations'];
                        } else {
                            // Retrocompatibilidade: propriedades globais
                            if (array_key_exists('animationFPS', $ce)) $stateEnemies[$i]['animationFPS'] = (float)$ce['animationFPS'];
                            if (array_key_exists('animationScale', $ce)) $stateEnemies[$i]['animationScale'] = (float)$ce['animationScale'];
                            if (array_key_exists('animationOffsetX', $ce)) $stateEnemies[$i]['animationOffsetX'] = (int)$ce['animationOffsetX'];
                            if (array_key_exists('animationOffsetY', $ce)) $stateEnemies[$i]['animationOffsetY'] = (int)$ce['animationOffsetY'];
                        }
                        if (array_key_exists('forceAnimation', $ce)) $stateEnemies[$i]['forceAnimation'] = (string)$ce['forceAnimation'];
                        break;
                    }
                }
            }
        }
        $playerDefaults = $config['player_defaults'] ?? [];
        if (isset($state['player']) && is_array($state['player'])) {
            // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
            if (isset($playerDefaults['animations']) && is_array($playerDefaults['animations'])) {
                $state['player']['animations'] = $playerDefaults['animations'];
            } else {
                // Retrocompatibilidade: propriedades globais
                if (array_key_exists('animationFPS', $playerDefaults)) $state['player']['animationFPS'] = (float)$playerDefaults['animationFPS'];
                if (array_key_exists('animationScale', $playerDefaults)) $state['player']['animationScale'] = (float)$playerDefaults['animationScale'];
                if (array_key_exists('animationOffsetX', $playerDefaults)) $state['player']['animationOffsetX'] = (int)$playerDefaults['animationOffsetX'];
                if (array_key_exists('animationOffsetY', $playerDefaults)) $state['player']['animationOffsetY'] = (int)$playerDefaults['animationOffsetY'];
            }
            if (array_key_exists('forceAnimation', $playerDefaults)) $state['player']['forceAnimation'] = (string)$playerDefaults['forceAnimation'];
        }

        return [
            'session' => $session,
            'config' => $config,
            'state' => $state,
            'snapshot' => $snapshot
        ];
    }

    public static function recordMove(int $sessionId, array $payload): void
    {
        QuestEvent::create([
            'quest_session_id' => $sessionId,
            'type' => 'move',
            'payload_json' => json_encode($payload, JSON_UNESCAPED_SLASHES)
        ]);
    }

    public static function updateSessionState(int $sessionId, array $state): void
    {
        QuestSession::updateState($sessionId, $state);
    }

    public static function completeSession(int $sessionId, array $payload = []): void
    {
        QuestSession::updateStatus($sessionId, 'completed');
        QuestEvent::create([
            'quest_session_id' => $sessionId,
            'type' => 'completed',
            'payload_json' => json_encode($payload, JSON_UNESCAPED_SLASHES)
        ]);
    }

    public static function resetSession(string $sessionUid, int $userId): void
    {
        $session = QuestSession::findBySessionUid($sessionUid);
        if (!$session || (int)$session['user_id'] !== $userId) {
            throw new \RuntimeException('Session not found or access denied.');
        }

        $sessionId = (int)$session['id'];

        // Deletar battle sessions relacionadas
        Database::delete('quest_battle_sessions', 'quest_session_id = :session_id', ['session_id' => $sessionId]);

        // Deletar events relacionadas
        Database::delete('quest_events', 'quest_session_id = :session_id', ['session_id' => $sessionId]);

        // Deletar a sessão em si
        Database::delete('quest_sessions', 'id = :id', ['id' => $sessionId]);
    }

    private static function buildSnapshot(array $character): array
    {
        return $character;
    }

    private static function buildInitialState(array $character, array $config): array
    {
        $playerStart = $config['player_start'] ?? ['x' => 5, 'y' => 5];
        $playerDefaults = $config['player_defaults'] ?? [];

        $combatKey = self::mapClassToCombatKey(
            $character['class_name'] ?? $character['class'] ?? ''
        );

        $player = [
            'id' => 'player',
            'name' => $character['name'] ?? 'Hero',
            'type' => 'player',
            'x' => (int)($playerStart['x'] ?? 5),
            'y' => (int)($playerStart['y'] ?? 5),
            'hp' => (int)($character['hp'] ?? 100),
            'maxHp' => (int)($character['max_hp'] ?? 100),
            'sp' => 1000, // DEBUG: Forçando 1000 para testes (original: $character['mana'] ?? 50)
            'maxSp' => 1000, // DEBUG: Forçando 1000 para testes (original: $character['max_mana'] ?? 50)
            'attack' => (int)round((($character['str'] ?? 10) + ($character['dex'] ?? 10)) / 2),
            'defense' => (int)round((($character['vit'] ?? 10) + ($character['agi'] ?? 10)) / 2),
            'moveRange' => (int)($playerDefaults['moveRange'] ?? 4),
            'attackRange' => (int)($playerDefaults['attackRange'] ?? 1),
            'avatar' => $playerDefaults['avatar'] ?? '/public/assets/img/characters/swordman.png',
            'class' => strtolower((string)($character['class_name'] ?? $character['class'] ?? 'hero')),
            'scale' => (float)($playerDefaults['scale'] ?? 1.0),
            'combatKey' => $combatKey
        ];
        
        // Adicionar propriedades de animação se presentes no JSON
        // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
        if (isset($playerDefaults['animations']) && is_array($playerDefaults['animations'])) {
            $player['animations'] = $playerDefaults['animations'];
        } else {
            // Retrocompatibilidade: propriedades globais
            if (isset($playerDefaults['animationFPS'])) {
                $player['animationFPS'] = (float)$playerDefaults['animationFPS'];
            }
            if (isset($playerDefaults['animationScale'])) {
                $player['animationScale'] = (float)$playerDefaults['animationScale'];
            }
            if (isset($playerDefaults['animationOffsetX'])) {
                $player['animationOffsetX'] = (int)$playerDefaults['animationOffsetX'];
            }
            if (isset($playerDefaults['animationOffsetY'])) {
                $player['animationOffsetY'] = (int)$playerDefaults['animationOffsetY'];
            }
        }
        if (isset($playerDefaults['forceAnimation'])) {
            $player['forceAnimation'] = (string)$playerDefaults['forceAnimation'];
        }

        $enemies = [];
        error_log('[QuestService] buildInitialState - Config enemies: ' . json_encode($config['enemies'] ?? []));
        foreach (($config['enemies'] ?? []) as $index => $enemy) {
            $combatKeyEnemy = $enemy['combat_key'] ?? $enemy['combatKey'] ?? null;
            $enemyData = [
                'id' => $enemy['id'] ?? uniqid('enemy_', true),
                'name' => $enemy['name'] ?? 'Enemy',
                'type' => 'enemy',
                'x' => (int)($enemy['x'] ?? 1),
                'y' => (int)($enemy['y'] ?? 1),
                'hp' => (int)($enemy['hp'] ?? 20),
                'maxHp' => (int)($enemy['maxHp'] ?? $enemy['hp'] ?? 20),
                'attack' => (int)($enemy['attack'] ?? 5),
                'defense' => (int)($enemy['defense'] ?? 2),
                'moveRange' => (int)($enemy['moveRange'] ?? 2),
                'attackRange' => (int)($enemy['attackRange'] ?? 1),
                'avatar' => $enemy['avatar'] ?? '/public/assets/img/enemy.png',
                'behavior' => $enemy['behavior'] ?? 'aggressive',
                'scale' => (float)($enemy['scale'] ?? 1.0),
                'combatKey' => $combatKeyEnemy
            ];
            
            // Adicionar propriedades de animação se presentes no JSON
            // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
            if (isset($enemy['animations']) && is_array($enemy['animations'])) {
                $enemyData['animations'] = $enemy['animations'];
            } else {
                // Retrocompatibilidade: propriedades globais
                if (isset($enemy['animationFPS'])) {
                    $enemyData['animationFPS'] = (float)$enemy['animationFPS'];
                }
                if (isset($enemy['animationScale'])) {
                    $enemyData['animationScale'] = (float)$enemy['animationScale'];
                }
                if (isset($enemy['animationOffsetX'])) {
                    $enemyData['animationOffsetX'] = (int)$enemy['animationOffsetX'];
                }
                if (isset($enemy['animationOffsetY'])) {
                    $enemyData['animationOffsetY'] = (int)$enemy['animationOffsetY'];
                }
            }
            if (isset($enemy['forceAnimation'])) {
                $enemyData['forceAnimation'] = (string)$enemy['forceAnimation'];
            }
            error_log("[QuestService] buildInitialState - Enemy $index criado: " . json_encode($enemyData));
            $enemies[] = $enemyData;
        }
        error_log('[QuestService] buildInitialState - Total de enemies criados: ' . count($enemies));

        return [
            'player' => $player,
            'enemies' => $enemies,
            'chests' => $config['chests'] ?? [],
            'portal' => $config['portal'] ?? null,
            'walls' => $config['walls'] ?? [],
            'turn' => 1,
            'phase' => 'player'
        ];
    }

    private static function mapClassToCombatKey(string $className): string
    {
        $normalized = strtolower(trim($className));
        return match ($normalized) {
            'swordsman' => 'hero_swordman',
            'archer' => 'hero_archer',
            'mage' => 'hero_mage',
            'thief' => 'hero_thief',
            'acolyte' => 'hero_acolyte',
            'blacksmith' => 'hero_blacksmith',
            default => 'hero_swordman'
        };
    }
}

