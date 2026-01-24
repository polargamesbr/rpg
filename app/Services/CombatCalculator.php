<?php

namespace App\Services;

class CombatCalculator
{
    /**
     * Calcula dano de ataque físico
     * @param array $attacker Dados do atacante
     * @param array $target Dados do alvo
     * @param int $range Alcance do ataque
     * @return array ['damage' => int, 'is_crit' => bool, 'parried' => bool]
     */
    public static function calculateAttackDamage(array $attacker, array $target, int $range = 1): array
    {
        // Base damage: usar attackRanged se range > 1, senão attack
        $baseDamage = ($range > 1 && isset($attacker['attackRanged']) && $attacker['attackRanged'] > 0)
            ? (int)($attacker['attackRanged'] ?? $attacker['attack'] ?? 10)
            : (int)($attacker['attack'] ?? 10);

        $defense = (int)($target['defense'] ?? 0);
        
        // Variance: 0.8 a 1.2
        $variance = 0.8 + (mt_rand(0, 400) / 1000); // 0.8 a 1.2
        
        // Crit chance
        $critChance = min(95, max(1, (int)($attacker['crit'] ?? 5)));
        $isCrit = (mt_rand(1, 100) <= $critChance);
        
        // Calcular dano base
        $damage = max(1, floor(($baseDamage - $defense * 0.5) * $variance));
        
        // Aplicar crítico
        if ($isCrit) {
            $damage = floor($damage * 1.5);
        }
        
        // Aplicar multiplicadores de buffs/debuffs (se existirem no state)
        if (isset($attacker['buffedDamageDealt']) && $attacker['buffedDamageDealt'] > 0) {
            $damage = floor($damage * $attacker['buffedDamageDealt']);
        }
        if (isset($target['buffedDamageTaken']) && $target['buffedDamageTaken'] > 0) {
            $damage = floor($damage * $target['buffedDamageTaken']);
        }
        
        // Verificar parry
        $parryChance = (float)($target['buffedParryChance'] ?? 0);
        $parried = ($parryChance > 0 && (mt_rand(1, 10000) / 100) < $parryChance);
        
        if ($parried) {
            $damage = 0;
        }
        
        return [
            'damage' => $damage,
            'is_crit' => $isCrit,
            'parried' => $parried,
            'base_damage' => $baseDamage,
            'defense' => $defense,
            'variance' => $variance
        ];
    }

    /**
     * Calcula dano de skill
     * @param array $caster Dados do conjurador
     * @param array $target Dados do alvo
     * @param array $skill Dados da skill
     * @return array ['damage' => int, 'is_crit' => bool, 'heal' => int]
     */
    public static function calculateSkillDamage(array $caster, array $target, array $skill): array
    {
        $skillType = $skill['type'] ?? 'attack';
        $damageType = $skill['damageType'] ?? 'physical';
        $isHeal = ($skillType === 'heal' || $skillType === 'aoe_heal');
        
        if ($isHeal) {
            // Calcular heal
            $baseHeal = (int)($skill['heal'] ?? 0);
            if ($baseHeal <= 0) {
                // Calcular baseado em MATK se não especificado
                $baseHeal = (int)($caster['matk'] ?? 50);
            }
            
            $variance = 0.9 + (mt_rand(0, 200) / 1000); // 0.9 a 1.1
            $heal = max(1, floor($baseHeal * $variance));
            
            return [
                'damage' => 0,
                'heal' => $heal,
                'is_crit' => false
            ];
        }
        
        // Calcular dano
        $baseDamage = (int)($skill['damage'] ?? 0);
        if ($baseDamage <= 0) {
            // Calcular baseado no tipo
            if ($damageType === 'magic') {
                $baseDamage = (int)($caster['matk'] ?? 50);
            } else {
                $baseDamage = (int)($caster['attack'] ?? 50);
            }
        }
        
        // Aplicar multiplicador de dano da skill
        $dmgMult = (float)($skill['damageMultiplier'] ?? 1.0);
        $baseDamage = floor($baseDamage * $dmgMult);
        
        // Defense/MDef
        $defense = 0;
        if ($damageType === 'magic') {
            $defense = (int)($target['mdef'] ?? 0);
            $defenseReduction = 0.25; // Magia reduz menos defesa
        } else {
            $defense = (int)($target['defense'] ?? 0);
            $defenseReduction = 0.3; // Físico reduz mais
        }
        
        // Variance
        $variance = 0.9 + (mt_rand(0, 200) / 1000); // 0.9 a 1.1
        
        // Crit
        $critChance = min(95, max(1, (int)($caster['crit'] ?? 5)));
        $isCrit = (mt_rand(1, 100) <= $critChance);
        
        $damage = max(1, floor(($baseDamage - $defense * $defenseReduction) * $variance));
        
        if ($isCrit) {
            $damage = floor($damage * 1.5);
        }
        
        // Aplicar multiplicadores
        if (isset($caster['buffedDamageDealt']) && $caster['buffedDamageDealt'] > 0) {
            $damage = floor($damage * $caster['buffedDamageDealt']);
        }
        if (isset($target['buffedDamageTaken']) && $target['buffedDamageTaken'] > 0) {
            $damage = floor($damage * $target['buffedDamageTaken']);
        }
        
        return [
            'damage' => $damage,
            'heal' => 0,
            'is_crit' => $isCrit,
            'base_damage' => $baseDamage,
            'defense' => $defense
        ];
    }
}
