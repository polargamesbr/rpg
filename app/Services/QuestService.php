<?php

namespace App\Services;

use App\Models\Character;
use App\Models\QuestDefinition;
use App\Models\QuestSession;
use App\Models\QuestEvent;
use App\Models\Database;
use App\Services\QuestConfigService;
use App\Services\EntityInstanceBuilder;
use App\Services\EntitySheetService;

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
        $state = self::buildInitialState($character, $config);

        $sessionId = QuestSession::create([
            'session_uid' => $sessionUid,
            'user_id' => $userId,
            'character_id' => (int)$character['id'],
            'quest_id' => $definition['id'],
            'status' => 'active',
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

        // Sincronizar inimigos com config: remove extras, repõe em falta, corrige hp zerado
        self::syncEnemiesToConfig($state, $config);

        // Enriquecer state com entity_id quando em falta (sessões antigas)
        self::enrichStateWithEntityIds($state);
        // Preencher name, avatar, combatKey, maxHp, etc. a partir de sheets + config
        self::enrichStateFromSheets($state, $session, $config);

        return [
            'session' => $session,
            'config' => $config,
            'state' => $state
        ];
    }

    /**
     * Sincroniza state['enemies'] com config: remove inimigos que não estão no config,
     * adiciona os em falta, e corrige hp zerado ou ausente.
     * @param array<string, mixed> $state
     * @param array<string, mixed> $config
     */
    private static function syncEnemiesToConfig(array &$state, array $config): void
    {
        $configEnemies = $config['enemies'] ?? [];
        $allowedIds = array_filter(array_map(fn($e) => $e['id'] ?? null, $configEnemies));
        $existingById = [];
        foreach (is_array($state['enemies'] ?? null) ? $state['enemies'] : [] as $e) {
            $id = $e['id'] ?? null;
            if ($id) $existingById[$id] = $e;
        }
        $newEnemies = [];
        foreach ($configEnemies as $index => $ce) {
            $id = $ce['id'] ?? ('enemy_' . ($index + 1));
            $ck = $ce['combat_key'] ?? $ce['combatKey'] ?? null;
            $entityDef = $ck ? EntitySheetService::findByCombatKey($ck) : null;
            $eid = $entityDef['id'] ?? $ck ?? null;
            $stats = $entityDef ? EntitySheetService::getCombatStats($entityDef) : ['maxHp' => 20, 'maxSp' => 50, 'attack' => 5, 'defense' => 2, 'moveRange' => 2, 'attackRange' => 1, 'behavior' => 'aggressive', 'scale' => 1.0];
            $sheetMaxHp = $stats['maxHp'];
            if (isset($existingById[$id])) {
                $e = $existingById[$id];
                if ((int)($e['hp'] ?? 0) <= 0) $e['hp'] = $sheetMaxHp;
                $e['entity_id'] = $eid ?? ($e['entity_id'] ?? null);
                $newEnemies[] = $e;
            } else {
                $newEnemies[] = [
                    'id' => $id,
                    'entity_id' => $eid,
                    'x' => (int)($ce['x'] ?? 1),
                    'y' => (int)($ce['y'] ?? 1),
                    'hp' => $sheetMaxHp,
                    'hasMoved' => false,
                    'facingRight' => false,
                ];
            }
        }
        $state['enemies'] = $newEnemies;
    }

    /**
     * Adiciona entity_id a player, allies e enemies quando em falta (retrocompatibilidade).
     * @param array<string, mixed> $state
     */
    private static function enrichStateWithEntityIds(array &$state): void
    {
        $player = &$state['player'];
        if (is_array($player) && empty($player['entity_id']) && !empty($player['combatKey'])) {
            $sheet = EntitySheetService::findByCombatKey($player['combatKey']);
            if ($sheet) {
                $player['entity_id'] = $sheet['id'];
            }
        }
        $allies = &$state['allies'];
        if (is_array($allies)) {
            foreach ($allies as $i => &$ally) {
                if (is_array($ally) && empty($ally['entity_id']) && !empty($ally['combatKey'])) {
                    $sheet = EntitySheetService::findByCombatKey($ally['combatKey']);
                    if ($sheet) {
                        $ally['entity_id'] = $sheet['id'];
                    }
                }
            }
            unset($ally);
        }
        $enemies = &$state['enemies'];
        if (is_array($enemies)) {
            foreach ($enemies as $i => &$enemy) {
                if (is_array($enemy) && empty($enemy['entity_id']) && !empty($enemy['combatKey'])) {
                    $sheet = EntitySheetService::findByCombatKey($enemy['combatKey']);
                    if ($sheet) {
                        $enemy['entity_id'] = $sheet['id'];
                    }
                }
            }
            unset($enemy);
        }
    }

    /**
     * Preenche name, avatar, combatKey, animations, moveRange, attackRange, attack, defense, maxHp, maxSp
     * a partir de sheets + config (evita redundância no state persistido).
     * @param array<string, mixed> $state
     * @param array<string, mixed> $session
     * @param array<string, mixed> $config
     */
    private static function enrichStateFromSheets(array &$state, array $session, array $config): void
    {
        $playerDefaults = $config['player_defaults'] ?? [];
        $configEnemies = $config['enemies'] ?? [];
        $configAllies = $config['allies'] ?? [];

        $player = &$state['player'];
        if (is_array($player)) {
            $character = Character::findById((int)($session['character_id'] ?? 0)) ?? [];
            // Prioridade: entity_id do state > class_entity_id do character > combatKey do state > mapClassToCombatKey
            $entityId = $player['entity_id'] ?? $player['combatKey'] ?? null;
            if (empty($entityId) && !empty($character['class_entity_id'])) {
                $entityId = $character['class_entity_id'];
            }
            if (empty($entityId) && !empty($character['class_name'])) {
                $ck = self::mapClassToCombatKey($character['class_name']);
                $entityDef = EntitySheetService::findByCombatKey($ck);
                $entityId = $entityDef['id'] ?? $ck ?? null;
            }
            
            if ($entityId) {
            try {
                $inst = EntityInstanceBuilder::build($entityId, $character, []);
            } catch (\Throwable $e) {
                $sheet = EntitySheetService::find($entityId) ?: EntitySheetService::findByCombatKey((string)$entityId);
                $stats = $sheet ? EntitySheetService::getCombatStats($sheet) : ['maxHp' => 100, 'maxSp' => 50, 'attack' => 10, 'defense' => 5, 'moveRange' => 4, 'attackRange' => 1, 'scale' => 1.0];
                $inst = [
                    'name' => $sheet ? ($sheet['name'] ?? $entityId) : $entityId,
                    'combat_key' => $sheet ? ($sheet['combat_key'] ?? $entityId) : $entityId,
                    'maxHp' => $stats['maxHp'],
                    'maxSp' => $stats['maxSp'],
                    'attack' => $stats['attack'],
                    'defense' => $stats['defense'],
                    'moveRange' => $stats['moveRange'],
                    'attackRange' => $stats['attackRange'],
                    'scale' => $stats['scale'],
                    'images' => $sheet ? ($sheet['images'] ?? []) : [],
                ];
            }
            // Atualizar entity_id no state se estava vazio
            if (empty($player['entity_id']) && $entityId) {
                $player['entity_id'] = $entityId;
            }
            $player['name'] = $inst['name'] ?? $character['name'] ?? 'Hero';
            $player['type'] = 'player';
            $player['combatKey'] = $inst['combat_key'] ?? $entityId;
            $player['maxHp'] = (int)($inst['maxHp'] ?? 100);
            $player['maxSp'] = (int)($inst['maxSp'] ?? 50);
            if (($player['hp'] ?? 0) <= 0) $player['hp'] = $player['maxHp'];
            if (($player['sp'] ?? 0) <= 0) $player['sp'] = $player['maxSp'];
            $player['attack'] = (int)($inst['attack'] ?? 10);
            $player['defense'] = (int)($inst['defense'] ?? 5);
            $player['moveRange'] = (int)($inst['moveRange'] ?? 4);
            $player['attackRange'] = (int)($inst['attackRange'] ?? 1);
            $player['scale'] = (float)($playerDefaults['scale'] ?? $inst['scale'] ?? 1.0);
            $player['class'] = strtolower((string)($character['class_name'] ?? $character['class'] ?? ''));
            $img = $inst['images']['default'] ?? '';
            $player['avatar'] = $img ? ((str_starts_with($img, '/') ? $img : '/public/' . ltrim($img, '/'))) : '';
            if (isset($playerDefaults['animations']) && is_array($playerDefaults['animations'])) {
                $player['animations'] = $playerDefaults['animations'];
            } elseif (!empty($inst['animations'])) {
                $player['animations'] = $inst['animations'];
            }
            if (array_key_exists('forceAnimation', $playerDefaults)) {
                $player['forceAnimation'] = (string)$playerDefaults['forceAnimation'];
            }
            }
        }

        $allies = &$state['allies'];
        if (is_array($allies)) {
            foreach ($allies as $i => &$a) {
                $eid = $a['entity_id'] ?? $a['combatKey'] ?? null;
                if (!$eid) continue;
                $sheet = EntitySheetService::find($eid) ?: EntitySheetService::findByCombatKey((string)$eid);
                if (!$sheet) continue;
                $cfg = null;
                foreach ($configAllies as $ca) {
                    if (($ca['id'] ?? '') === ($a['id'] ?? '')) { $cfg = $ca; break; }
                }
                $c = $cfg ?? [];
                $stats = EntitySheetService::getCombatStats($sheet);
                $a['name'] = $c['name'] ?? $sheet['name'] ?? 'Ally';
                $a['type'] = 'player';
                $a['combatKey'] = $sheet['combat_key'] ?? $eid;
                $a['attributes'] = $sheet['attributes'] ?? [];
                $a['level'] = (int)($c['level'] ?? $sheet['base_level'] ?? 1);
                $a['maxHp'] = $stats['maxHp'];
                $a['maxSp'] = $stats['maxSp'];
                if (($a['sp'] ?? 0) <= 0) $a['sp'] = $a['maxSp'];
                $a['attack'] = $stats['attack'];
                $a['defense'] = $stats['defense'];
                $a['moveRange'] = $stats['moveRange'];
                $a['attackRange'] = $stats['attackRange'];
                $a['scale'] = (float)($c['scale'] ?? $stats['scale']);
                $a['class'] = strtolower((string)($c['class'] ?? $sheet['role'] ?? ''));
                $img = $sheet['images']['default'] ?? '';
                $a['avatar'] = $img ? ((str_starts_with($img, '/') ? $img : '/public/' . ltrim($img, '/'))) : '';
                if (isset($c['animations']) && is_array($c['animations'])) {
                    $a['animations'] = $c['animations'];
                } elseif (!empty($sheet['animations'])) {
                    $a['animations'] = $sheet['animations'];
                }
                if (array_key_exists('forceAnimation', $c)) {
                    $a['forceAnimation'] = (string)$c['forceAnimation'];
                }
                if (!isset($a['activeBuffs'])) $a['activeBuffs'] = [];
                if (!isset($a['activeDebuffs'])) $a['activeDebuffs'] = [];
                if (!isset($a['statusEffects'])) $a['statusEffects'] = [];
            }
            unset($a);
        }

        $enemies = &$state['enemies'];
        if (is_array($enemies)) {
            foreach ($enemies as $i => &$e) {
                $eid = $e['entity_id'] ?? $e['combatKey'] ?? null;
                if (!$eid) continue;
                $sheet = EntitySheetService::find($eid) ?: EntitySheetService::findByCombatKey((string)$eid);
                if (!$sheet) continue;
                $ce = null;
                foreach ($configEnemies as $cand) {
                    if (($cand['id'] ?? '') === ($e['id'] ?? '')) { $ce = $cand; break; }
                }
                $c = $ce ?? [];
                $stats = EntitySheetService::getCombatStats($sheet);
                $e['name'] = $c['name'] ?? $sheet['name'] ?? 'Enemy';
                $e['type'] = 'enemy';
                $e['combatKey'] = $sheet['combat_key'] ?? $eid;
                $e['maxHp'] = $stats['maxHp'];
                $e['attack'] = $stats['attack'];
                $e['defense'] = $stats['defense'];
                $e['moveRange'] = $stats['moveRange'];
                $e['attackRange'] = $stats['attackRange'];
                $e['behavior'] = $c['behavior'] ?? $stats['behavior'];
                $e['scale'] = (float)($c['scale'] ?? $stats['scale']);
                $e['facingRight'] = (bool)($e['facingRight'] ?? false);
                $img = $sheet['images']['default'] ?? '';
                $e['avatar'] = $img ? ((str_starts_with($img, '/') ? $img : '/public/' . ltrim($img, '/'))) : '';
                // animations: ou por tipo (idle/walk/atack) ou globais no topo (animationFPS, animationScale, animationOffsetX, animationOffsetY)
                $hasPerType = isset($c['animations']) && is_array($c['animations'])
                    && (isset($c['animations']['idle']) || isset($c['animations']['walk']) || isset($c['animations']['atack']));
                if ($hasPerType) {
                    $e['animations'] = $c['animations'];
                } else {
                    if (array_key_exists('animationFPS', $c)) $e['animationFPS'] = (float)$c['animationFPS'];
                    if (array_key_exists('animationScale', $c)) $e['animationScale'] = (float)$c['animationScale'];
                    if (array_key_exists('animationOffsetX', $c)) $e['animationOffsetX'] = (int)$c['animationOffsetX'];
                    if (array_key_exists('animationOffsetY', $c)) $e['animationOffsetY'] = (int)$c['animationOffsetY'];
                }
                if (array_key_exists('forceAnimation', $c)) {
                    $e['forceAnimation'] = (string)$c['forceAnimation'];
                }
            }
            unset($e);
        }
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
        QuestSession::updateState($sessionId, self::slimState($state));
    }

    /**
     * Mescla apenas os campos permitidos do input no state (evita persistir dados deriváveis).
     * @param array<string, mixed> $state
     * @param array<string, mixed> $stateInput
     * @return array<string, mixed>
     */
    public static function mergeStateInput(array $state, array $stateInput): array
    {
        $allowPlayer = ['id', 'entity_id', 'x', 'y', 'hp', 'sp', 'hasMoved', 'facingRight'];
        if (array_key_exists('player', $stateInput)) {
            if ($stateInput['player'] === null) {
                $state['player'] = null;
            } elseif (is_array($stateInput['player'])) {
                if (!isset($state['player']) || !is_array($state['player'])) {
                    $state['player'] = [];
                }
                foreach ($allowPlayer as $k) {
                    if (array_key_exists($k, $stateInput['player'])) {
                        $state['player'][$k] = $stateInput['player'][$k];
                    }
                }
            }
        }
        if (array_key_exists('allies', $stateInput) && is_array($stateInput['allies'])) {
            $state['allies'] = $stateInput['allies'];
        }
        if (array_key_exists('enemies', $stateInput) && is_array($stateInput['enemies'])) {
            $state['enemies'] = $stateInput['enemies'];
        }
        if (array_key_exists('chests', $stateInput)) $state['chests'] = $stateInput['chests'];
        if (array_key_exists('portal', $stateInput)) $state['portal'] = $stateInput['portal'];
        if (array_key_exists('turn', $stateInput)) $state['turn'] = $stateInput['turn'];
        if (array_key_exists('phase', $stateInput)) $state['phase'] = $stateInput['phase'];
        if (array_key_exists('unitsActed', $stateInput)) $state['unitsActed'] = $stateInput['unitsActed'];
        return $state;
    }

    /**
     * Reduz o state ao mínimo persistido (remove campos deriváveis de sheets/config).
     * @param array<string, mixed> $state
     * @return array<string, mixed>
     */
    private static function slimState(array $state): array
    {
        $keepPlayer = ['id', 'entity_id', 'x', 'y', 'hp', 'sp', 'hasMoved', 'facingRight'];
        $keepAlly = ['id', 'entity_id', 'x', 'y', 'hp', 'sp', 'hasMoved', 'facingRight', 'activeBuffs', 'activeDebuffs', 'statusEffects'];
        $keepEnemy = ['id', 'entity_id', 'x', 'y', 'hp', 'hasMoved', 'facingRight'];

        if (isset($state['player']) && is_array($state['player'])) {
            $state['player'] = array_intersect_key($state['player'], array_flip($keepPlayer));
        }
        if (isset($state['allies']) && is_array($state['allies'])) {
            $state['allies'] = array_map(function ($a) use ($keepAlly) {
                return is_array($a) ? array_intersect_key($a, array_flip($keepAlly)) : $a;
            }, $state['allies']);
        }
        if (isset($state['enemies']) && is_array($state['enemies'])) {
            $state['enemies'] = array_map(function ($e) use ($keepEnemy) {
                return is_array($e) ? array_intersect_key($e, array_flip($keepEnemy)) : $e;
            }, $state['enemies']);
        }
        return $state;
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

        // Deletar events relacionadas
        Database::delete('quest_events', 'quest_session_id = :session_id', ['session_id' => $sessionId]);

        // Deletar a sessão em si
        Database::delete('quest_sessions', 'id = :id', ['id' => $sessionId]);
    }

    private static function buildInitialState(array $character, array $config): array
    {
        $playerStart = $config['player_start'] ?? ['x' => 5, 'y' => 5];

        $entityId = $character['class_entity_id'] ?? null;
        if ($entityId === null || $entityId === '') {
            $ck = self::mapClassToCombatKey($character['class_name'] ?? $character['class'] ?? '');
            $entityDef = EntitySheetService::findByCombatKey($ck);
            $entityId = $entityDef['id'] ?? $ck ?? 'swordsman';
        }
        $entityId = $entityId ?: 'swordsman';

        $inst = EntityInstanceBuilder::build($entityId, $character, []);
        
        // Beast Tamer: iniciar na posição 11,11
        $playerX = ($entityId === 'beast_tamer' || strtolower($entityId) === 'beast_tamer') 
            ? 11 
            : (int)($playerStart['x'] ?? 5);
        $playerY = ($entityId === 'beast_tamer' || strtolower($entityId) === 'beast_tamer') 
            ? 11 
            : (int)($playerStart['y'] ?? 5);
        
        $player = [
            'id' => 'player',
            'entity_id' => $entityId,
            'x' => $playerX,
            'y' => $playerY,
            'hp' => (int)($character['hp'] ?? $inst['maxHp']),
            'sp' => (int)$inst['maxSp'],
            'hasMoved' => false,
            'facingRight' => true,
        ];

        $enemies = [];
        foreach (($config['enemies'] ?? []) as $index => $enemy) {
            $ck = $enemy['combat_key'] ?? $enemy['combatKey'] ?? null;
            $entityDef = $ck ? EntitySheetService::findByCombatKey($ck) : null;
            $eid = $entityDef['id'] ?? $ck ?? null;
            $stats = $entityDef ? EntitySheetService::getCombatStats($entityDef) : ['maxHp' => 20, 'maxSp' => 50, 'attack' => 5, 'defense' => 2, 'moveRange' => 2, 'attackRange' => 1, 'behavior' => 'aggressive', 'scale' => 1.0];
            $enemies[] = [
                'id' => $enemy['id'] ?? ('enemy_' . ($index + 1)),
                'entity_id' => $eid,
                'x' => (int)($enemy['x'] ?? 1),
                'y' => (int)($enemy['y'] ?? 1),
                'hp' => $stats['maxHp'],
                'hasMoved' => false,
                'facingRight' => false,
            ];
        }

        $allies = [];
        // Beast Tamer não inicia com aliados - eles são invocados via skills
        if (isset($config['allies']) && is_array($config['allies'])) {
            foreach ($config['allies'] as $index => $ally) {
                $ck = $ally['combat_key'] ?? $ally['combatKey'] ?? 'hero_archer';
                $entityDef = EntitySheetService::findByCombatKey($ck);
                if (!$entityDef) {
                    $entityDef = EntitySheetService::find($ck);
                }
                if (!$entityDef) {
                    // Try using class field
                    $entityDef = EntitySheetService::find($ally['class'] ?? '');
                }
                if (!$entityDef) {
                    error_log("[QuestService] Ally not found: combat_key={$ck}, class=" . ($ally['class'] ?? 'N/A'));
                    continue;
                }
                $stats = EntitySheetService::getCombatStats($entityDef);
                $allies[] = [
                    'id' => $ally['id'] ?? ('ally_' . ($index + 1)),
                    'entity_id' => $entityDef['id'],
                    'x' => (int)($ally['x'] ?? $player['x'] + 1),
                    'y' => (int)($ally['y'] ?? $player['y']),
                    'hp' => $stats['maxHp'],
                    'sp' => $stats['maxSp'],
                    'hasMoved' => false,
                    'facingRight' => true,
                    'activeBuffs' => [],
                    'activeDebuffs' => [],
                    'statusEffects' => [],
                ];
            }
        } else {
            $archer = EntitySheetService::find('archer');
            if ($archer) {
                $stats = EntitySheetService::getCombatStats($archer);
                $allies[] = [
                    'id' => 'ally_archer',
                    'entity_id' => $archer['id'],
                    'x' => $player['x'] + 1,
                    'y' => $player['y'],
                    'hp' => $stats['maxHp'],
                    'sp' => $stats['maxSp'],
                    'hasMoved' => false,
                    'facingRight' => true,
                    'activeBuffs' => [],
                    'activeDebuffs' => [],
                    'statusEffects' => [],
                ];
            }
        }

        return [
            'player' => $player,
            'allies' => $allies,
            'enemies' => $enemies,
            'chests' => $config['chests'] ?? [],
            'portal' => $config['portal'] ?? null,
            // Walls são imutáveis e sempre vêm do config, não precisam estar no state
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
            'beast tamer' => 'beast_tamer',
            'beast_tamer' => 'beast_tamer',
            'thief' => 'hero_thief',
            'acolyte' => 'hero_acolyte',
            'blacksmith' => 'hero_blacksmith',
            default => 'hero_swordman'
        };
    }
}

