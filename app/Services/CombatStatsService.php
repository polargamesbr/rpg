<?php

namespace App\Services;

/**
 * Centralized Combat Stats Service
 * The "Single Source of Truth" for all character and monster formulas.
 */
class CombatStatsService
{
    /**
     * Calculate all combat stats from attributes and level
     * 
     * @param int $level
     * @param array $attributes [str, agi, vit, int, dex, luk]
     * @return array Calculated stats
     */
    public static function calculateAll(int $level, array $attributes, array $growth = []): array
    {
        $level = max(1, $level);
        $a = array_merge([
            'str' => 1, 'agi' => 1, 'vit' => 1, 
            'int' => 1, 'dex' => 1, 'luk' => 1
        ], $attributes);

        // Fallback multipliers if not provided (Hero Defaults)
        $g = array_merge([
            'hp_base_per_level' => 100,
            'hp_vit_mult'       => 20,
            'sp_base_per_level' => 10,
            'sp_int_mult'       => 5,
            'atk_base'          => 50,
            'atk_str_mult'      => 2,
            'atk_dex_mult'      => 0.5,
            'atk_lvl_mult'      => 1.5,
            'matk_base'         => 30,
            'matk_int_mult'     => 2,
            'matk_str_mult'     => 0, // Rare
            'matk_lvl_mult'     => 1.2,
        ], $growth);

        return [
            'maxHp'      => (int)floor(($level * $g['hp_base_per_level']) + ($a['vit'] * $g['hp_vit_mult'])),
            'maxSp'      => (int)floor(($level * $g['sp_base_per_level']) + ($a['int'] * $g['sp_int_mult'])),
            'atk'        => (int)floor(($a['str'] * $g['atk_str_mult']) + ($a['dex'] * $g['atk_dex_mult']) + ($level * $g['atk_lvl_mult']) + ($a['luk'] * 0.3) + $g['atk_base']),
            'matk'       => (int)floor(($a['int'] * $g['matk_int_mult']) + ($a['str'] * $g['matk_str_mult']) + ($level * $g['matk_lvl_mult']) + ($a['dex'] * 0.4) + ($a['luk'] * 0.3) + $g['matk_base']),
            'def'        => self::calculateDef($level, $a),
            'mdef'       => self::calculateMdef($level, $a),
            'hit'        => self::calculateHit($level, $a),
            'flee'       => self::calculateFlee($level, $a),
            'crit'       => self::calculateCrit($level, $a),
            'aspd'       => self::calculateAspd($level, $a),
        ];
    }

    public static function calculateMaxHp(int $level, int $vit): int
    {
        // Formula: (lvl * 100) + (vit * 20)
        return (int)floor(($level * 100) + ($vit * 20));
    }

    public static function calculateMaxSp(int $level, int $int): int
    {
        // Formula: (lvl * 10) + (int * 5)
        return (int)floor(($level * 10) + ($int * 5));
    }

    public static function calculateAtk(int $level, array $a): int
    {
        // (str * 2) + (lvl * 1.5) + (dex * 0.5) + (luk * 0.3) + 50
        $statusAtk = ($a['str'] * 2) + ($level * 1.5) + ($a['dex'] * 0.5) + ($a['luk'] * 0.3);
        return (int)floor($statusAtk + 50);
    }

    public static function calculateMatk(int $level, array $a): int
    {
        // (int * 2) + (lvl * 1.2) + (dex * 0.4) + (luk * 0.3) + 30
        $statusMatk = ($a['int'] * 2) + ($level * 1.2) + ($a['dex'] * 0.4) + ($a['luk'] * 0.3);
        return (int)floor($statusMatk + 30);
    }

    public static function calculateDef(int $level, array $a): array
    {
        // softDef = (vit * 0.8) + (agi * 0.3) + (lvl * 0.5)
        // hardDef = 20 + (lvl * 0.3)
        return [
            'soft' => (int)floor(($a['vit'] * 0.8) + ($a['agi'] * 0.3) + ($level * 0.5)),
            'hard' => (int)floor(20 + ($level * 0.3))
        ];
    }

    public static function calculateMdef(int $level, array $a): int
    {
        // (int * 1.2) + (vit * 0.6) + (lvl * 0.8)
        return (int)floor(($a['int'] * 1.2) + ($a['vit'] * 0.6) + ($level * 0.8));
    }

    public static function calculateHit(int $level, array $a): int
    {
        // 175 + (lvl * 2) + (dex * 1.5) + (luk * 0.5)
        return (int)floor(175 + ($level * 2) + ($a['dex'] * 1.5) + ($a['luk'] * 0.5));
    }

    public static function calculateFlee(int $level, array $a): int
    {
        // 100 + (lvl * 2) + (agi * 1.5) + (luk * 0.5)
        return (int)floor(100 + ($level * 2) + ($a['agi'] * 1.5) + ($a['luk'] * 0.5));
    }

    public static function calculateCrit(int $level, array $a): int
    {
        // 1 + (luk * 0.4) + (lvl * 0.1)
        return (int)floor(1 + ($a['luk'] * 0.4) + ($level * 0.1));
    }

    public static function calculateAspd(int $level, array $a): int
    {
        // 150 + (agi * 0.5) + (dex * 0.3) + (lvl * 0.2)
        return (int)floor(150 + ($a['agi'] * 0.5) + ($a['dex'] * 0.3) + ($level * 0.2));
    }
}
