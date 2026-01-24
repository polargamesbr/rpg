<?php

namespace App\Services;

use App\Models\Character;
use App\Services\EntitySheetService;
use App\Services\SkillService;
use App\Services\CombatValidator;
use App\Services\CombatCalculator;
use App\Services\QuestService;

class ActionService
{
    /**
     * Processa movimento de uma unidade
     * @param int $sessionId
     * @param string $unitId ID da unidade (player, ally_X, etc)
     * @param int $targetX
     * @param int $targetY
     * @param array $sessionData Dados da sessão
     * @param int $userId
     * @return array ['success' => bool, 'error' => string|null, 'new_state' => array|null]
     */
    public static function processMove(int $sessionId, string $unitId, int $targetX, int $targetY, array $sessionData, int $userId): array
    {
        $state = $sessionData['state'] ?? [];
        $config = $sessionData['config'] ?? [];
        $character = Character::findByUser($userId);
        
        if (!$character) {
            return ['success' => false, 'error' => 'Character not found'];
        }

        // Encontrar unidade
        $unit = null;
        $unitType = null;
        
        if ($unitId === 'player') {
            $unit = $state['player'] ?? null;
            $unitType = 'player';
        } else {
            // Procurar em allies
            $allies = $state['allies'] ?? [];
            foreach ($allies as $ally) {
                if (($ally['id'] ?? '') === $unitId) {
                    $unit = $ally;
                    $unitType = 'ally';
                    break;
                }
            }
        }

        if (!$unit || !is_array($unit)) {
            return ['success' => false, 'error' => 'Unit not found'];
        }

        $oldX = (int)($unit['x'] ?? 0);
        $oldY = (int)($unit['y'] ?? 0);

        // Se não mudou posição, retornar sucesso
        if ($oldX === $targetX && $oldY === $targetY) {
            return ['success' => true, 'new_state' => $state];
        }

        // Validar posição
        if (!CombatValidator::validatePosition($targetX, $targetY, $config)) {
            return ['success' => false, 'error' => 'Invalid position'];
        }

        // Verificar ocupação
        if (CombatValidator::isCellOccupied($targetX, $targetY, $unitId, $state)) {
            return ['success' => false, 'error' => 'Position is occupied'];
        }

        // Obter moveRange
        $entityId = $unit['entity_id'] ?? null;
        if (!$entityId && $unitType === 'player') {
            $entityId = $character['entity_id'] ?? 'swordsman';
        }

        $entitySheet = $entityId ? (EntitySheetService::find($entityId) ?: EntitySheetService::findByCombatKey($entityId)) : null;
        $moveRange = 4; // Default
        if ($entitySheet) {
            $stats = EntitySheetService::getCombatStats($entitySheet);
            $moveRange = (int)($stats['moveRange'] ?? 4);
        }

        // Validar distância
        if (!CombatValidator::validateDistance($oldX, $oldY, $targetX, $targetY, $moveRange)) {
            $distance = abs($targetX - $oldX) + abs($targetY - $oldY);
            return ['success' => false, 'error' => "Movement distance exceeds moveRange: {$distance} > {$moveRange}"];
        }

        // Aplicar movimento
        if ($unitType === 'player') {
            $state['player']['x'] = $targetX;
            $state['player']['y'] = $targetY;
            $state['player']['hasMoved'] = true;
        } else {
            // Atualizar ally
            $allies = $state['allies'] ?? [];
            foreach ($allies as $i => $ally) {
                if (($ally['id'] ?? '') === $unitId) {
                    $state['allies'][$i]['x'] = $targetX;
                    $state['allies'][$i]['y'] = $targetY;
                    $state['allies'][$i]['hasMoved'] = true;
                    break;
                }
            }
        }

        return ['success' => true, 'new_state' => $state];
    }

    /**
     * Processa finalização de turno
     * @param int $sessionId
     * @param array $sessionData
     * @return array ['success' => bool, 'error' => string|null, 'new_state' => array|null]
     */
    public static function processEndTurn(int $sessionId, array $sessionData): array
    {
        $state = $sessionData['state'] ?? [];
        $oldTurn = (int)($state['turn'] ?? 1);
        $oldPhase = $state['phase'] ?? 'player';

        // Validar fase atual
        if ($oldPhase !== 'player' && $oldPhase !== 'enemy') {
            return ['success' => false, 'error' => 'Invalid phase'];
        }

        // Se é turno do player, mudar para enemy
        if ($oldPhase === 'player') {
            $state['phase'] = 'enemy';
            $state['unitsActed'] = [];
        } else {
            // Se é turno do enemy, avançar turno e voltar para player
            $state['turn'] = $oldTurn + 1;
            $state['phase'] = 'player';
            $state['unitsActed'] = [];
            
            // Resetar hasMoved de todas unidades
            if (isset($state['player']) && is_array($state['player'])) {
                $state['player']['hasMoved'] = false;
            }
            if (isset($state['allies']) && is_array($state['allies'])) {
                foreach ($state['allies'] as $i => $ally) {
                    if (is_array($ally)) {
                        $state['allies'][$i]['hasMoved'] = false;
                    }
                }
            }
        }

        return ['success' => true, 'new_state' => $state];
    }

    /**
     * Processa ação de ataque
     * @param int $sessionId
     * @param string $attackerId ID do atacante
     * @param string $targetId ID do alvo
     * @param array $sessionData
     * @return array ['success' => bool, 'error' => string|null, 'new_state' => array|null, 'result' => array|null]
     */
    public static function processAttack(int $sessionId, string $attackerId, string $targetId, array $sessionData): array
    {
        $state = $sessionData['state'] ?? [];
        $config = $sessionData['config'] ?? [];

        // Encontrar atacante
        $attacker = null;
        if ($attackerId === 'player') {
            $attacker = $state['player'] ?? null;
        } else {
            $allies = $state['allies'] ?? [];
            foreach ($allies as $ally) {
                if (($ally['id'] ?? '') === $attackerId) {
                    $attacker = $ally;
                    break;
                }
            }
        }

        if (!$attacker || !is_array($attacker)) {
            return ['success' => false, 'error' => 'Attacker not found'];
        }

        // Encontrar alvo
        $target = null;
        $targetType = null;
        $enemies = $state['enemies'] ?? [];
        foreach ($enemies as $enemy) {
            if (($enemy['id'] ?? '') === $targetId) {
                $target = $enemy;
                $targetType = 'enemy';
                break;
            }
        }

        if (!$target || !is_array($target)) {
            return ['success' => false, 'error' => 'Target not found'];
        }

        // Verificar se alvo está vivo
        $targetHp = (int)($target['hp'] ?? 0);
        if ($targetHp <= 0) {
            return ['success' => false, 'error' => 'Target is already dead'];
        }

        // Verificar alcance
        $attackerX = (int)($attacker['x'] ?? 0);
        $attackerY = (int)($attacker['y'] ?? 0);
        $targetX = (int)($target['x'] ?? 0);
        $targetY = (int)($target['y'] ?? 0);
        
        $distance = max(abs($targetX - $attackerX), abs($targetY - $attackerY));
        $attackRange = (int)($attacker['attackRange'] ?? 1);
        
        if ($distance > $attackRange) {
            return ['success' => false, 'error' => 'Target out of range'];
        }

        // Enriquecer dados do atacante e alvo com stats
        $attackerEntityId = $attacker['entity_id'] ?? null;
        $targetEntityId = $target['entity_id'] ?? null;
        
        if ($attackerEntityId) {
            $attackerSheet = EntitySheetService::find($attackerEntityId) ?: EntitySheetService::findByCombatKey($attackerEntityId);
            if ($attackerSheet) {
                $attackerStats = EntitySheetService::getCombatStats($attackerSheet);
                $attacker['attack'] = $attackerStats['attack'] ?? $attacker['attack'] ?? 10;
                $attacker['attackRanged'] = $attackerStats['attackRanged'] ?? $attacker['attackRanged'] ?? null;
                $attacker['crit'] = $attackerStats['crit'] ?? $attacker['crit'] ?? 5;
            }
        }
        
        if ($targetEntityId) {
            $targetSheet = EntitySheetService::find($targetEntityId) ?: EntitySheetService::findByCombatKey($targetEntityId);
            if ($targetSheet) {
                $targetStats = EntitySheetService::getCombatStats($targetSheet);
                $target['defense'] = $targetStats['defense'] ?? $target['defense'] ?? 0;
            }
        }

        // Calcular dano
        $damageResult = CombatCalculator::calculateAttackDamage($attacker, $target, $attackRange);
        
        // Aplicar dano
        $newTargetHp = max(0, $targetHp - $damageResult['damage']);
        
        // Atualizar estado
        foreach ($state['enemies'] as $i => $enemy) {
            if (($enemy['id'] ?? '') === $targetId) {
                $state['enemies'][$i]['hp'] = $newTargetHp;
                break;
            }
        }

        // Marcar atacante como tendo agido
        if ($attackerId === 'player') {
            $state['player']['hasMoved'] = true;
        } else {
            foreach ($state['allies'] as $i => $ally) {
                if (($ally['id'] ?? '') === $attackerId) {
                    $state['allies'][$i]['hasMoved'] = true;
                    break;
                }
            }
        }

        // Adicionar a unitsActed
        if (!isset($state['unitsActed']) || !is_array($state['unitsActed'])) {
            $state['unitsActed'] = [];
        }
        if (!in_array($attackerId, $state['unitsActed'], true)) {
            $state['unitsActed'][] = $attackerId;
        }

        return [
            'success' => true,
            'new_state' => $state,
            'result' => [
                'damage' => $damageResult['damage'],
                'is_crit' => $damageResult['is_crit'],
                'parried' => $damageResult['parried'],
                'target_hp_before' => $targetHp,
                'target_hp_after' => $newTargetHp,
                'target_killed' => $newTargetHp <= 0
            ]
        ];
    }

    /**
     * Processa ação de skill
     * @param int $sessionId
     * @param string $casterId ID do conjurador
     * @param string $skillId ID da skill
     * @param array $targetIds IDs dos alvos
     * @param array $sessionData
     * @return array ['success' => bool, 'error' => string|null, 'new_state' => array|null, 'result' => array|null]
     */
    public static function processSkill(int $sessionId, string $casterId, string $skillId, array $targetIds, array $sessionData): array
    {
        $state = $sessionData['state'] ?? [];
        $config = $sessionData['config'] ?? [];

        // Encontrar conjurador
        $caster = null;
        if ($casterId === 'player') {
            $caster = $state['player'] ?? null;
        } else {
            $allies = $state['allies'] ?? [];
            foreach ($allies as $ally) {
                if (($ally['id'] ?? '') === $casterId) {
                    $caster = $ally;
                    break;
                }
            }
        }

        if (!$caster || !is_array($caster)) {
            return ['success' => false, 'error' => 'Caster not found'];
        }

        // Carregar skill
        $skill = SkillService::getSkill($skillId);
        if (!$skill) {
            return ['success' => false, 'error' => 'Skill not found'];
        }

        // Verificar MP
        $cost = (int)($skill['mana'] ?? $skill['cost'] ?? 0);
        $casterSp = (int)($caster['sp'] ?? 0);
        if ($casterSp < $cost) {
            return ['success' => false, 'error' => 'Insufficient MP'];
        }

        // Encontrar alvos
        $targets = [];
        $enemies = $state['enemies'] ?? [];
        $allies = $state['allies'] ?? [];
        
        foreach ($targetIds as $targetId) {
            // Procurar em enemies
            foreach ($enemies as $enemy) {
                if (($enemy['id'] ?? '') === $targetId) {
                    $targets[] = ['unit' => $enemy, 'type' => 'enemy'];
                    break;
                }
            }
            // Procurar em allies
            foreach ($allies as $ally) {
                if (($ally['id'] ?? '') === $targetId) {
                    $targets[] = ['unit' => $ally, 'type' => 'ally'];
                    break;
                }
            }
            // Procurar player
            if ($targetId === 'player' && isset($state['player'])) {
                $targets[] = ['unit' => $state['player'], 'type' => 'player'];
            }
        }

        if (empty($targets)) {
            return ['success' => false, 'error' => 'No valid targets'];
        }

        // Enriquecer dados do conjurador
        $casterEntityId = $caster['entity_id'] ?? null;
        if ($casterEntityId) {
            $casterSheet = EntitySheetService::find($casterEntityId) ?: EntitySheetService::findByCombatKey($casterEntityId);
            if ($casterSheet) {
                $casterStats = EntitySheetService::getCombatStats($casterSheet);
                $caster['attack'] = $casterStats['attack'] ?? $caster['attack'] ?? 10;
                $caster['matk'] = $casterStats['matk'] ?? $caster['matk'] ?? 10;
                $caster['crit'] = $casterStats['crit'] ?? $caster['crit'] ?? 5;
            }
        }

        // Processar cada alvo
        $results = [];
        $skillType = $skill['type'] ?? 'attack';
        $isHeal = ($skillType === 'heal' || $skillType === 'aoe_heal');

        foreach ($targets as $targetData) {
            $target = $targetData['unit'];
            $targetType = $targetData['type'];
            
            // Enriquecer dados do alvo
            $targetEntityId = $target['entity_id'] ?? null;
            if ($targetEntityId) {
                $targetSheet = EntitySheetService::find($targetEntityId) ?: EntitySheetService::findByCombatKey($targetEntityId);
                if ($targetSheet) {
                    $targetStats = EntitySheetService::getCombatStats($targetSheet);
                    $target['defense'] = $targetStats['defense'] ?? $target['defense'] ?? 0;
                    $target['mdef'] = $targetStats['mdef'] ?? $target['mdef'] ?? 0;
                }
            }

            // Calcular dano/heal
            $damageResult = CombatCalculator::calculateSkillDamage($caster, $target, $skill);
            
            $targetId = $target['id'] ?? null;
            $targetHp = (int)($target['hp'] ?? 0);
            $targetMaxHp = (int)($target['maxHp'] ?? $target['max_hp'] ?? 100);
            
            if ($isHeal) {
                $heal = $damageResult['heal'];
                $newHp = min($targetMaxHp, $targetHp + $heal);
            } else {
                $damage = $damageResult['damage'];
                $newHp = max(0, $targetHp - $damage);
            }

            // Atualizar estado
            if ($targetType === 'enemy') {
                foreach ($state['enemies'] as $i => $enemy) {
                    if (($enemy['id'] ?? '') === $targetId) {
                        $state['enemies'][$i]['hp'] = $newHp;
                        break;
                    }
                }
            } elseif ($targetType === 'ally') {
                foreach ($state['allies'] as $i => $ally) {
                    if (($ally['id'] ?? '') === $targetId) {
                        $state['allies'][$i]['hp'] = $newHp;
                        if ($isHeal) {
                            $state['allies'][$i]['sp'] = max(0, (int)($state['allies'][$i]['sp'] ?? 0) - $cost);
                        }
                        break;
                    }
                }
            } else {
                // Player
                $state['player']['hp'] = $newHp;
                if ($isHeal) {
                    $state['player']['sp'] = max(0, (int)($state['player']['sp'] ?? 0) - $cost);
                }
            }

            $results[] = [
                'target_id' => $targetId,
                'damage' => $isHeal ? 0 : $damageResult['damage'],
                'heal' => $isHeal ? $damageResult['heal'] : 0,
                'is_crit' => $damageResult['is_crit'],
                'target_hp_before' => $targetHp,
                'target_hp_after' => $newHp,
                'target_killed' => !$isHeal && $newHp <= 0
            ];
        }

        // Consumir MP do conjurador
        $newCasterSp = max(0, $casterSp - $cost);
        if ($casterId === 'player') {
            $state['player']['sp'] = $newCasterSp;
            $state['player']['hasMoved'] = true;
        } else {
            foreach ($state['allies'] as $i => $ally) {
                if (($ally['id'] ?? '') === $casterId) {
                    $state['allies'][$i]['sp'] = $newCasterSp;
                    $state['allies'][$i]['hasMoved'] = true;
                    break;
                }
            }
        }

        // Adicionar a unitsActed
        if (!isset($state['unitsActed']) || !is_array($state['unitsActed'])) {
            $state['unitsActed'] = [];
        }
        if (!in_array($casterId, $state['unitsActed'], true)) {
            $state['unitsActed'][] = $casterId;
        }

        return [
            'success' => true,
            'new_state' => $state,
            'result' => [
                'skill_id' => $skillId,
                'mp_cost' => $cost,
                'mp_remaining' => $newCasterSp,
                'targets' => $results
            ]
        ];
    }
}
