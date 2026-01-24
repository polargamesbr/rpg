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

        // Verifica se já existe uma sessão ativa para ESTA quest específica
        $existing = QuestSession::findActiveByUserAndQuest($userId, $questId);
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
     * sincroniza propriedades dos que existem, e corrige entity_id quando ausente.
     * NÃO cria novos inimigos - se um inimigo não está no state, ele foi morto e não deve ser recriado.
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
        
        error_log('[syncEnemiesToConfig] State enemies: ' . json_encode(array_keys($existingById)));
        error_log('[syncEnemiesToConfig] Config enemy IDs: ' . json_encode($allowedIds));
        
        $newEnemies = [];
        
        // Iterar apenas pelos inimigos que EXISTEM no state (não criar novos do config)
        foreach ($existingById as $id => $e) {
            // Se o inimigo não está no config, remover (não permitido nesta quest)
            if (!in_array($id, $allowedIds, true)) {
                error_log("[syncEnemiesToConfig] Removendo inimigo não permitido: {$id}");
                continue; // Remove este inimigo
            }
            
            // Encontrar config correspondente para sincronizar propriedades
            $ce = null;
            foreach ($configEnemies as $cand) {
                $candId = $cand['id'] ?? ('enemy_' . 1);
                if ($candId === $id) {
                    $ce = $cand;
                    break;
                }
            }
            
            // Garantir entity_id se ausente
            if (empty($e['entity_id']) && $ce) {
                $ck = $ce['combat_key'] ?? $ce['combatKey'] ?? null;
                $entityDef = $ck ? EntitySheetService::findByCombatKey($ck) : null;
                $e['entity_id'] = $entityDef['id'] ?? $ck ?? null;
            }
            
            // NÃO restaurar HP zerado - se HP <= 0, o inimigo foi morto e será filtrado antes de salvar
            // Mas se por algum motivo ainda está no state com HP <= 0, manter assim (será filtrado no próximo save)
            
            $newEnemies[] = $e;
        }
        
        error_log('[syncEnemiesToConfig] Enemies após sync: ' . json_encode(array_map(fn($e) => $e['id'] ?? '?', $newEnemies)));
        
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
            // Prioridade: entity_id do state > combatKey do state > entity_id do character
            $entityId = $player['entity_id'] ?? $player['combatKey'] ?? ($character['entity_id'] ?? null);
            
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
            $player['level'] = $inst['level'] ?? $character['level'] ?? 1;
            $player['attributes'] = $inst['attributes'] ?? $character['attributes'] ?? [];
            $player['name'] = $inst['name'] ?? $character['name'] ?? 'Hero';
            $player['type'] = 'player';
            $player['combatKey'] = $inst['combat_key'] ?? $entityId;
            $player['level'] = (int)($inst['level'] ?? $character['level'] ?? 1);
            $player['attributes'] = $inst['attributes'] ?? $character['attributes'] ?? [];
            $player['maxHp'] = (int)($inst['maxHp'] ?? 100);
            $player['maxSp'] = (int)($inst['maxSp'] ?? 50);
            if (($player['hp'] ?? 0) <= 0) $player['hp'] = $player['maxHp'];
            if (($player['sp'] ?? 0) <= 0) $player['sp'] = $player['maxSp'];
            $player['attack'] = (int)($inst['attack'] ?? 10);
            $player['defense'] = (int)($inst['defense'] ?? 5);
            $player['moveRange'] = (int)($inst['moveRange'] ?? 4);
            $player['attackRange'] = (int)($inst['attackRange'] ?? 1);
            $player['scale'] = (float)($playerDefaults['scale'] ?? $inst['scale'] ?? 1.0);
            $player['class'] = strtolower((string)($character['entity_id'] ?? ''));
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
                
                // Atributos: Priorizar o que já está no state (podem ser do DB), senão usar ficha
                $attrs = $a['attributes'] ?? $sheet['attributes'] ?? ['str' => 10, 'agi' => 10, 'vit' => 10, 'int' => 10, 'dex' => 10, 'luk' => 10];
                $level = (int)($a['level'] ?? $c['level'] ?? $sheet['base_level'] ?? 1);

                // Calcular stats reais via CombatStatsService (Fonte da Verdade)
                $computed = CombatStatsService::calculateAll($level, $attrs);
                
                $a['name'] = $c['name'] ?? $sheet['name'] ?? 'Ally';
                $a['type'] = 'player';
                $a['combatKey'] = $sheet['combat_key'] ?? $eid;
                $a['attributes'] = $attrs;
                $a['level'] = $level;
                $a['maxHp'] = $computed['maxHp'];
                $a['maxSp'] = $computed['maxSp'];
                if (($a['sp'] ?? 0) <= 0) $a['sp'] = $a['maxSp'];
                
                // Outros stats calculados (opcional, para UI)
                $a['attack'] = $computed['atk'];
                $a['defense'] = $computed['def']['soft'];
                
                // Stats fixos da ficha/config
                $stats = EntitySheetService::getCombatStats($sheet);
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
                
                // Garantir campos para persistência
                $a['level'] = $level;
                $a['attributes'] = $attrs;
                $a['type'] = 'player';
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
                $growth = $sheet['growth'] ?? [];
                $dynamicStats = CombatStatsService::calculateAll($e['level'] ?? 1, $e['attributes'] ?? $sheet['attributes'] ?? [], $growth);
                $staticStats = EntitySheetService::getCombatStats($sheet);

                $e['name'] = $c['name'] ?? $sheet['name'] ?? 'Enemy';
                $e['type'] = 'enemy';
                $e['combatKey'] = $sheet['combat_key'] ?? $eid;
                $e['maxHp'] = $dynamicStats['maxHp'];
                $e['maxSp'] = $dynamicStats['maxSp'];
                $e['growth_multipliers'] = $growth;
                $e['attack'] = $dynamicStats['atk'];
                $e['defense'] = $dynamicStats['def']['soft'];
                $e['moveRange'] = $staticStats['moveRange'];
                $e['attackRange'] = $staticStats['attackRange'];
                $e['behavior'] = $c['behavior'] ?? $staticStats['behavior'];
                $e['scale'] = (float)($c['scale'] ?? $staticStats['scale']);
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
        $allowPlayer = ['id', 'entity_id', 'combat_key', 'type', 'x', 'y', 'hp', 'sp', 'level', 'attributes', 'hasMoved', 'facingRight'];
        $allowAlly = ['id', 'entity_id', 'combat_key', 'type', 'x', 'y', 'hp', 'sp', 'level', 'attributes', 'hasMoved', 'facingRight', 'activeBuffs', 'activeDebuffs', 'statusEffects'];
        $allowEnemy = ['id', 'entity_id', 'combat_key', 'type', 'x', 'y', 'hp', 'level', 'attributes'];
        
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
            $state['allies'] = array_map(function ($a) use ($allowAlly) {
                if (!is_array($a)) return $a;
                return array_intersect_key($a, array_flip($allowAlly));
            }, $stateInput['allies']);
        }
        
        if (array_key_exists('enemies', $stateInput) && is_array($stateInput['enemies'])) {
            $state['enemies'] = array_map(function ($e) use ($allowEnemy) {
                if (!is_array($e)) return $e;
                return array_intersect_key($e, array_flip($allowEnemy));
            }, $stateInput['enemies']);
        }
        
        // Rejeitar dados imutáveis (chests e portal vêm do config, não do state)
        // if (array_key_exists('chests', $stateInput)) - REMOVIDO
        // if (array_key_exists('portal', $stateInput)) - REMOVIDO
        
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
        $keepPlayer = ['id', 'entity_id', 'combat_key', 'type', 'isScaled', 'growth_multipliers', 'x', 'y', 'hp', 'sp', 'level', 'attributes', 'hasMoved', 'facingRight'];
        $keepAlly = ['id', 'entity_id', 'combat_key', 'type', 'isScaled', 'growth_multipliers', 'x', 'y', 'hp', 'sp', 'level', 'attributes', 'hasMoved', 'facingRight', 'activeBuffs', 'activeDebuffs', 'statusEffects'];
        // Inimigos: remover hasMoved e facingRight (podem ser resetados/derivados)
        $keepEnemy = ['id', 'entity_id', 'combat_key', 'type', 'isScaled', 'growth_multipliers', 'x', 'y', 'hp', 'level', 'attributes'];

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
        
        // Remover dados imutáveis (vêm do config, não do state)
        unset($state['chests'], $state['portal']);
        
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

    /**
     * Constrói um inimigo a partir do config (evita duplicação de lógica)
     * @param array<string, mixed> $enemyConfig Config do inimigo do quest config
     * @param int $index Índice para fallback de ID
     * @return array<string, mixed> Estado mínimo do inimigo
     */
    private static function buildEnemyFromConfig(array $enemyConfig, int $index = 0): array
    {
        $ck = $enemyConfig['combat_key'] ?? $enemyConfig['combatKey'] ?? null;
        $entityDef = $ck ? EntitySheetService::findByCombatKey($ck) : null;
        $eid = $entityDef['id'] ?? $ck ?? null;
        $growth = $entityDef['growth'] ?? [];
        $level = (int)($enemyConfig['level'] ?? $entityDef['base_level'] ?? 1);
        $attrs = $enemyConfig['attributes'] ?? $entityDef['attributes'] ?? [];
        $stats = CombatStatsService::calculateAll($level, $attrs, $growth);

        return [
            'id' => $enemyConfig['id'] ?? ('enemy_' . ($index + 1)),
            'entity_id' => $eid,
            'combat_key' => $ck,
            'type' => 'enemy',
            'x' => (int)($enemyConfig['x'] ?? 1),
            'y' => (int)($enemyConfig['y'] ?? 1),
            'hp' => $stats['maxHp'],
            'sp' => $stats['maxSp'],
            'level' => $level,
            'attributes' => $attrs,
            'growth_multipliers' => $growth,
        ];
    }

    private static function buildInitialState(array $character, array $config): array
    {
        $playerStart = $config['player_start'] ?? ['x' => 5, 'y' => 5];

        $entityId = $character['entity_id'] ?? 'swordsman';

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
            'combat_key' => $inst['combat_key'] ?? $entityId,
            'type' => 'player',
            'x' => $playerX,
            'y' => $playerY,
            'hp' => (int)($character['hp'] ?? $inst['maxHp']),
            'sp' => (int)$inst['maxSp'],
            'level' => (int)($character['level'] ?? $inst['level'] ?? 1),
            'attributes' => $inst['attributes'] ?? [],
            'hasMoved' => false,
            'facingRight' => true,
        ];

        $enemies = [];
        foreach (($config['enemies'] ?? []) as $index => $enemyConfig) {
            $enemies[] = self::buildEnemyFromConfig($enemyConfig, $index);
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
            // chests e portal são imutáveis e sempre vêm do config, não precisam estar no state
            'turn' => 1,
            'phase' => 'player',
            'unitsActed' => [],
            'unitsActedThisTurn' => []
        ];
    }

    public static function updateSessionStateByUid(string $sessionUid, array $state): void
    {
        QuestSession::updateStateByUid($sessionUid, $state);
    }

    private static function mapClassToCombatKey(string $className): string
    {
        $normalized = strtolower(trim($className));
        return $normalized;
    }
}

