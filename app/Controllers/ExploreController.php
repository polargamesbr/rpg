<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\QuestService;
use App\Services\ExperienceService;
use App\Services\EntitySheetService;
use App\Models\Character;
use App\Models\Database;

class ExploreController
{
    /**
     * Main exploration view
     */
    public function index(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            redirect('/login');
            return;
        }

        $character = Character::findByUser($user['id']);
        if (!$character) {
            redirect('/game/character/create');
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            redirect('/game/tavern');
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            redirect('/game/tavern');
            return;
        }
        if (($sessionData['session']['status'] ?? '') !== 'active') {
            redirect('/game/tavern');
            return;
        }

        $data = [
            'character' => $character,
            'pageTitle' => 'Explore'
        ];

        include __DIR__ . '/../../views/game/explore.php';
    }

    /**
     * Get current exploration state (player position, nearby entities, etc.)
     */
    public function getState(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $config = $sessionData['config'];
        $state = $sessionData['state'];

        // chests e portal são imutáveis e sempre vêm do config, não do state
        $chests = $config['chests'] ?? [];
        $portal = $config['portal'] ?? null;

        $mapConfig = $config['map'] ?? [
            'gridCols' => 20,
            'gridRows' => 15,
            'cellSize' => 64,
            'mapImage' => '/public/assets/img/maps/castle-map.webp'
        ];
        
        // Walls são imutáveis e sempre vêm do config, não do state
        $walls = $config['walls'] ?? [];
        
        // Contrato: player (objeto), allies (array), entities (array de inimigos).
        // Frontend usa collectCombatKeysFromSession(); não renomear sem ajustar lá.
        // NOTA: walls e mapConfig vêm do config (imutáveis), não do state salvo
        jsonResponse([
            'success' => true,
            'session' => [
                'uid' => $sessionUid,
                'quest_id' => $sessionData['session']['quest_id'],
                'status' => $sessionData['session']['status']
            ],
            'player' => $state['player'] ?? null,
            'allies' => $state['allies'] ?? [],
            'entities' => $state['enemies'] ?? [], // inimigos; chave "entities" no JSON
            'chests' => $chests,
            'portal' => $portal,
            'walls' => $walls, // Vem do config (imutável), necessário para renderização
            'mapConfig' => $mapConfig, // Vem do config (imutável), necessário para renderização
            'turn' => $state['turn'] ?? 1,
            'phase' => $state['phase'] ?? 'player',
            'unitsActed' => $state['unitsActed'] ?? []
        ]);
    }

    /**
     * Update exploration state (quest session)
     * POST /game/explore/state
     */
    public function setState(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $stateInput = $input['state'] ?? $input;
        if (!is_array($stateInput)) {
            jsonResponse(['success' => false, 'error' => 'Invalid state'], 400);
            return;
        }

        $oldState = $sessionData['state'] ?? [];
        if (is_array($input['player'] ?? null)) {
            $stateInput['player'] = array_merge($stateInput['player'] ?? [], $input['player']);
        }
        if (is_array($input['portal'] ?? null)) {
            $stateInput['portal'] = array_merge($stateInput['portal'] ?? [], $input['portal']);
        }
        $newState = QuestService::mergeStateInput($oldState, $stateInput);
        
        // Detectar inimigos mortos comparando state anterior com novo
        $this->awardExpForDefeatedEnemies($oldState, $newState, $sessionData, (int)$user['id']);
        
        QuestService::updateSessionState((int)$sessionData['session']['id'], $newState);
        jsonResponse(['success' => true]);
    }

    /**
     * Complete quest when player reaches portal
     * POST /game/explore/complete
     */
    public function complete(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $state = $sessionData['state'] ?? [];
        $input = json_decode(file_get_contents('php://input'), true);
        $playerInput = $input['player'] ?? null;
        $portalInput = $input['portal'] ?? null;

        if (is_array($playerInput)) {
            $state['player']['x'] = (int)($playerInput['x'] ?? ($state['player']['x'] ?? 0));
            $state['player']['y'] = (int)($playerInput['y'] ?? ($state['player']['y'] ?? 0));
        }
        if (is_array($portalInput)) {
            $state['portal'] = [
                'x' => (int)($portalInput['x'] ?? 0),
                'y' => (int)($portalInput['y'] ?? 0)
            ] + ($state['portal'] ?? []);
        }
        $enemies = $state['enemies'] ?? [];
        $aliveEnemies = array_filter($enemies, fn($e) => ($e['hp'] ?? 0) > 0);
        if (count($aliveEnemies) > 0) {
            jsonResponse(['success' => false, 'error' => 'Enemies still alive'], 400);
            return;
        }

        $portal = $state['portal'] ?? ($sessionData['config']['portal'] ?? null);
        if (!$portal || !isset($portal['x'], $portal['y'])) {
            jsonResponse(['success' => false, 'error' => 'Portal not configured'], 400);
            return;
        }

        $player = $state['player'] ?? [];
        $px = (int)($player['x'] ?? 0);
        $py = (int)($player['y'] ?? 0);
        if (abs($px - (int)$portal['x']) > 0 || abs($py - (int)$portal['y']) > 0) {
            jsonResponse(['success' => false, 'error' => 'Not at portal'], 400);
            return;
        }

        QuestService::updateSessionState((int)$sessionData['session']['id'], $state);
        QuestService::completeSession((int)$sessionData['session']['id'], [
            'portal' => ['x' => (int)$portal['x'], 'y' => (int)$portal['y']]
        ]);

        jsonResponse([
            'success' => true,
            'redirect' => '/game/tavern'
        ]);
    }

    /**
     * Detect defeated enemies and award EXP (called from setState)
     * @param array $oldState Previous state
     * @param array $newState New state
     * @param array $sessionData Session data
     * @param int $userId User ID
     */
    private function awardExpForDefeatedEnemies(array $oldState, array $newState, array $sessionData, int $userId): void
    {
        $oldEnemies = $oldState['enemies'] ?? [];
        $newEnemies = $newState['enemies'] ?? [];
        
        // Criar mapas de inimigos por ID
        $oldEnemiesById = [];
        foreach ($oldEnemies as $e) {
            $id = $e['id'] ?? null;
            if ($id) {
                $oldEnemiesById[$id] = $e;
            }
        }
        
        $newEnemiesById = [];
        foreach ($newEnemies as $e) {
            $id = $e['id'] ?? null;
            if ($id) {
                $newEnemiesById[$id] = $e;
            }
        }
        
        // Detectar inimigos que morreram: estavam no oldState mas não estão no newState (ou estão com hp <= 0)
        $defeatedEnemies = [];
        foreach ($oldEnemiesById as $enemyId => $oldEnemy) {
            $oldHp = (int)($oldEnemy['hp'] ?? 0);
            $newEnemy = $newEnemiesById[$enemyId] ?? null;
            $newHp = $newEnemy ? (int)($newEnemy['hp'] ?? 0) : 0;
            
            // Inimigo morreu se: estava vivo antes e agora não está no newState OU está com hp <= 0
            if ($oldHp > 0 && ($newHp <= 0 || !$newEnemy)) {
                $defeatedEnemies[] = [
                    'id' => $enemyId,
                    'entity_id' => $oldEnemy['entity_id'] ?? null,
                    'level' => $oldEnemy['level'] ?? 1
                ];
            }
        }
        
        if (empty($defeatedEnemies)) {
            return;
        }
        
        error_log('[awardExpForDefeatedEnemies] Detected ' . count($defeatedEnemies) . ' defeated enemies');
        
        $character = Character::findByUser($userId);
        if (!$character) {
            error_log('[awardExpForDefeatedEnemies] Character not found for user: ' . $userId);
            return;
        }
        
        $sessionId = (int)$sessionData['session']['id'];
        $configEnemies = $sessionData['config']['enemies'] ?? [];
        
        foreach ($defeatedEnemies as $defeated) {
            $enemyId = $defeated['id'];
            $enemyEntityId = $defeated['entity_id'];
            $enemyLevel = (int)($defeated['level'] ?? 1);
            
            // Verificar se EXP já foi concedido (idempotência)
            $alreadyAwarded = Database::fetchOne(
                "SELECT 1 FROM quest_events 
                 WHERE quest_session_id = :session_id 
                   AND type = 'exp_award' 
                   AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.enemy_id')) = :enemy_id 
                 LIMIT 1",
                ['session_id' => $sessionId, 'enemy_id' => $enemyId]
            );
            
            if ($alreadyAwarded) {
                error_log("[awardExpForDefeatedEnemies] EXP already awarded for enemy: {$enemyId}");
                continue;
            }
            
            // Buscar enemy do config para validar
            $enemyFromConfig = null;
            foreach ($configEnemies as $cfgEnemy) {
                if (($cfgEnemy['id'] ?? '') === $enemyId) {
                    $enemyFromConfig = $cfgEnemy;
                    break;
                }
            }
            
            if (!$enemyFromConfig) {
                error_log("[awardExpForDefeatedEnemies] Enemy not found in config: {$enemyId}");
                continue;
            }
            
            // Buscar enemy sheet para calcular EXP
            $enemySheet = null;
            if ($enemyEntityId) {
                $enemySheet = EntitySheetService::find($enemyEntityId);
            }
            
            if (!$enemySheet) {
                $ck = $enemyFromConfig['combat_key'] ?? $enemyFromConfig['combatKey'] ?? null;
                if ($ck) {
                    $enemySheet = EntitySheetService::findByCombatKey($ck);
                }
            }
            
            $baseExp = 0;
            if ($enemySheet && isset($enemySheet['loot_table']['xp'])) {
                $baseExp = (int)$enemySheet['loot_table']['xp'];
            }
            
            if ($enemyLevel <= 0 && $enemySheet) {
                $enemyLevel = (int)($enemySheet['base_level'] ?? 1);
            }
            
            $playerLevel = (int)($character['level'] ?? 1);
            $expGain = ExperienceService::calculateExpGain($enemyLevel, $playerLevel, $baseExp);
            
            error_log("[awardExpForDefeatedEnemies] Awarding EXP for enemy: {$enemyId}, exp: {$expGain}");
            
            // Registrar evento de EXP (idempotência)
            $payload = json_encode([
                'enemy_id' => $enemyId,
                'enemy_entity_id' => $enemyEntityId,
                'enemy_level' => $enemyLevel,
                'exp' => $expGain
            ], JSON_UNESCAPED_SLASHES);
            
            $stmt = Database::query(
                "INSERT INTO quest_events (quest_session_id, type, payload_json)
                 SELECT :session_id_ins, :type_ins, :payload_json_ins
                 FROM DUAL
                 WHERE NOT EXISTS (
                    SELECT 1 FROM quest_events
                    WHERE quest_session_id = :session_id_check
                      AND type = :type_check
                      AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.enemy_id')) = :enemy_id
                 )
                 LIMIT 1",
                [
                    'session_id_ins' => $sessionId,
                    'type_ins' => 'exp_award',
                    'payload_json_ins' => $payload,
                    'session_id_check' => $sessionId,
                    'type_check' => 'exp_award',
                    'enemy_id' => $enemyId
                ]
            );
            
            if ($stmt->rowCount() === 0) {
                error_log("[awardExpForDefeatedEnemies] EXP already awarded (race condition): {$enemyId}");
                continue;
            }
            
            // Conceder EXP ao personagem
            $result = ExperienceService::addExperience((int)$character['id'], $expGain);
            error_log("[awardExpForDefeatedEnemies] EXP added: " . json_encode($result));
            
            // Salvar no histórico
            Database::insert('quest_exp_history', [
                'quest_session_id' => $sessionId,
                'user_id' => $userId,
                'character_id' => (int)$character['id'],
                'quest_id' => (string)($sessionData['session']['quest_id'] ?? ''),
                'enemy_id' => (string)$enemyId,
                'enemy_entity_id' => $enemyEntityId ? (string)$enemyEntityId : null,
                'enemy_level' => $enemyLevel,
                'exp_gained' => $expGain
            ]);
            
            error_log("[awardExpForDefeatedEnemies] Successfully awarded EXP for enemy: {$enemyId}");
        }
    }

    /**
     * Award experience when an enemy is defeated (DEPRECATED - use awardExpForDefeatedEnemies)
     * POST /game/explore/award-exp
     */
    public function awardExp(): void
    {
        error_log('[awardExp] Request received');
        
        $user = AuthService::getCurrentUser();
        if (!$user) {
            error_log('[awardExp] Not authenticated');
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            error_log('[awardExp] Missing session');
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            error_log('[awardExp] Invalid session: ' . $sessionUid);
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $enemyId = $input['enemy_id'] ?? null;
        $enemyEntityId = $input['enemy_entity_id'] ?? null;
        $enemyLevel = (int)($input['enemy_level'] ?? 1);

        error_log('[awardExp] Input: ' . json_encode([
            'enemy_id' => $enemyId,
            'enemy_entity_id' => $enemyEntityId,
            'enemy_level' => $enemyLevel,
            'session' => $sessionUid,
            'user_id' => $user['id']
        ]));

        if (!$enemyId) {
            error_log('[awardExp] Missing enemy id');
            jsonResponse(['success' => false, 'error' => 'Missing enemy id'], 400);
            return;
        }

        $character = Character::findByUser($user['id']);
        if (!$character) {
            error_log('[awardExp] Character not found for user: ' . $user['id']);
            jsonResponse(['success' => false, 'error' => 'Character not found'], 404);
            return;
        }

        $configEnemies = $sessionData['config']['enemies'] ?? [];
        error_log('[awardExp] Config enemies count: ' . count($configEnemies));
        
        $enemyFromConfig = null;
        foreach ($configEnemies as $cfgEnemy) {
            if (($cfgEnemy['id'] ?? '') === $enemyId) {
                $enemyFromConfig = $cfgEnemy;
                break;
            }
        }

        if (!$enemyFromConfig) {
            error_log('[awardExp] Enemy not found in config. Enemy ID: ' . $enemyId . ', Available IDs: ' . implode(', ', array_map(fn($e) => $e['id'] ?? 'unknown', $configEnemies)));
            jsonResponse(['success' => false, 'error' => 'Enemy not found in quest config'], 400);
            return;
        }

        error_log('[awardExp] Enemy found in config: ' . json_encode($enemyFromConfig));

        $enemySheet = null;
        if ($enemyEntityId) {
            $enemySheet = EntitySheetService::find($enemyEntityId);
        }

        if (!$enemySheet && $enemyId) {
            $state = $sessionData['state'] ?? [];
            $enemies = $state['enemies'] ?? [];
            foreach ($enemies as $enemy) {
                if (($enemy['id'] ?? '') === $enemyId) {
                    $eid = $enemy['entity_id'] ?? null;
                    if ($eid) {
                        $enemySheet = EntitySheetService::find($eid);
                    }
                    if ($enemyLevel <= 0 && isset($enemy['level'])) {
                        $enemyLevel = (int)$enemy['level'];
                    }
                    break;
                }
            }
        }

        $baseExp = 0;
        if ($enemySheet && isset($enemySheet['loot_table']['xp'])) {
            $baseExp = (int)$enemySheet['loot_table']['xp'];
        }

        if ($enemyLevel <= 0 && $enemySheet) {
            $enemyLevel = (int)($enemySheet['base_level'] ?? 1);
        }

        $playerLevel = (int)($character['level'] ?? 1);
        $expGain = ExperienceService::calculateExpGain($enemyLevel, $playerLevel, $baseExp);

        error_log('[awardExp] Calculated EXP: ' . json_encode([
            'base_exp' => $baseExp,
            'enemy_level' => $enemyLevel,
            'player_level' => $playerLevel,
            'exp_gain' => $expGain
        ]));

        try {
            $sessionId = (int)$sessionData['session']['id'];
            $payload = json_encode([
                'enemy_id' => $enemyId,
                'enemy_entity_id' => $enemyEntityId,
                'enemy_level' => $enemyLevel,
                'exp' => $expGain
            ], JSON_UNESCAPED_SLASHES);

            error_log('[awardExp] Checking if EXP already awarded for enemy: ' . $enemyId);
            // Use different placeholder names to avoid PDO parameter reuse issue
            $stmt = Database::query(
                "INSERT INTO quest_events (quest_session_id, type, payload_json)
                 SELECT :session_id_ins, :type_ins, :payload_json_ins
                 FROM DUAL
                 WHERE NOT EXISTS (
                    SELECT 1 FROM quest_events
                    WHERE quest_session_id = :session_id_check
                      AND type = :type_check
                      AND JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.enemy_id')) = :enemy_id
                 )
                 LIMIT 1",
                [
                    'session_id_ins' => $sessionId,
                    'type_ins' => 'exp_award',
                    'payload_json_ins' => $payload,
                    'session_id_check' => $sessionId,
                    'type_check' => 'exp_award',
                    'enemy_id' => $enemyId
                ]
            );

            if ($stmt->rowCount() === 0) {
                error_log('[awardExp] EXP already awarded for enemy: ' . $enemyId);
                jsonResponse([
                    'success' => true,
                    'exp_gained' => 0,
                    'already_awarded' => true
                ]);
                return;
            }

            error_log('[awardExp] Adding EXP to character: ' . $character['id']);
            $result = ExperienceService::addExperience((int)$character['id'], $expGain);
            error_log('[awardExp] EXP added result: ' . json_encode($result));

            error_log('[awardExp] Inserting into quest_exp_history');
            Database::insert('quest_exp_history', [
                'quest_session_id' => $sessionId,
                'user_id' => (int)$user['id'],
                'character_id' => (int)$character['id'],
                'quest_id' => (string)($sessionData['session']['quest_id'] ?? ''),
                'enemy_id' => (string)$enemyId,
                'enemy_entity_id' => $enemyEntityId ? (string)$enemyEntityId : null,
                'enemy_level' => (int)$enemyLevel,
                'exp_gained' => (int)$expGain
            ]);
            error_log('[awardExp] Successfully awarded EXP');
            
            jsonResponse([
                'success' => true,
                'exp_gained' => $expGain,
                'exp_result' => [
                    'exp_before' => $result['exp_before'],
                    'exp_after' => $result['exp_after'],
                    'level_before' => $result['level_before'],
                    'level_after' => $result['level_after'],
                    'leveled_up' => $result['level_before'] < $result['level_after'],
                    'new_level' => $result['level_after'],
                    'levels_gained' => $result['levels_gained'],
                    'attribute_points' => $result['attribute_points'],
                    'exp_for_next_level' => $result['exp_for_next_level']
                ]
            ]);
        } catch (\Exception $e) {
            error_log('[awardExp] Exception: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Battle test page (debug) - REMOVED: Sistema antigo de cartas
     */
    public function battleTest(): void
    {
        // Sistema antigo removido - usar sistema tático atual
        redirect('/game/tavern');
        return;
    }

    /**
     * Reset quest session (delete and allow recreation)
     * POST /game/explore/reset
     */
    public function reset(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        try {
            QuestService::resetSession($sessionUid, (int)$user['id']);
            jsonResponse([
                'success' => true,
                'redirect' => '/game/tavern'
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
