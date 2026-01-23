<?php

namespace App\Services;

use App\Models\Character;

class ExperienceService
{
    private const MAX_LEVEL = 99;
    private const BASE_EXP = 100;
    private const EXP_GROWTH = 1.5;
    private const ATTR_POINTS_PER_LEVEL = 5;

    public static function getExpForNextLevel(int $level): int
    {
        $level = max(1, $level);
        return (int)max(1, round(self::BASE_EXP * pow($level, self::EXP_GROWTH)));
    }

    public static function calculateExpGain(int $enemyLevel, int $playerLevel, int $baseExp = 0): int
    {
        if ($baseExp <= 0) {
            $baseExp = (int)round(10 * pow(max(1, $enemyLevel), 1.2));
        }

        $levelDiff = $enemyLevel - $playerLevel;

        if ($levelDiff <= -5) {
            $multiplier = 0.1;
        } elseif ($levelDiff <= -3) {
            $multiplier = 0.3;
        } elseif ($levelDiff <= -1) {
            $multiplier = 0.6;
        } elseif ($levelDiff <= 1) {
            $multiplier = 1.0;
        } elseif ($levelDiff <= 3) {
            $multiplier = 1.5;
        } elseif ($levelDiff <= 5) {
            $multiplier = 2.0;
        } else {
            $multiplier = 2.5;
        }

        return (int)max(1, round($baseExp * $multiplier));
    }

    public static function addExperience(int $characterId, int $expGain): array
    {
        $character = Character::findById($characterId);
        if (!$character) {
            throw new \RuntimeException('Character not found.');
        }

        $currentLevel = (int)($character['level'] ?? 1);
        $currentXp = (int)($character['xp'] ?? 0);
        $attributePoints = (int)($character['attribute_points'] ?? 0);

        $newXp = $currentXp + $expGain;
        $newLevel = $currentLevel;
        $levelsGained = [];

        while ($newLevel < self::MAX_LEVEL) {
            $expForNext = self::getExpForNextLevel($newLevel);
            if ($newXp < $expForNext) {
                break;
            }

            $newXp -= $expForNext;
            $newLevel++;
            $attributePoints += self::ATTR_POINTS_PER_LEVEL;
            $levelsGained[] = $newLevel;
        }

        $updates = [
            'xp' => $newXp,
            'level' => $newLevel,
            'attribute_points' => $attributePoints
        ];

        if ($newLevel !== $currentLevel) {
            $updates = array_merge($updates, self::recalculateVitals($character, $newLevel));
        }

        Character::update($characterId, $updates);

        return [
            'exp_gained' => $expGain,
            'exp_before' => $currentXp,
            'exp_after' => $newXp,
            'level_before' => $currentLevel,
            'level_after' => $newLevel,
            'levels_gained' => $levelsGained,
            'attribute_points' => $attributePoints,
            'exp_for_next_level' => self::getExpForNextLevel($newLevel)
        ];
    }

    private static function recalculateVitals(array $character, int $newLevel): array
    {
        $vit = (int)($character['vit'] ?? 10);
        $int = (int)($character['int'] ?? 10);

        $maxHp = ($newLevel * 100) + ($vit * 20);
        $maxMana = ($newLevel * 10) + ($int * 5);

        $currentHp = (int)($character['hp'] ?? $maxHp);
        $currentMana = (int)($character['mana'] ?? $maxMana);
        $currentMaxHp = (int)($character['max_hp'] ?? $maxHp);
        $currentMaxMana = (int)($character['max_mana'] ?? $maxMana);

        $hpPercent = $currentMaxHp > 0 ? ($currentHp / $currentMaxHp) : 1.0;
        $manaPercent = $currentMaxMana > 0 ? ($currentMana / $currentMaxMana) : 1.0;

        $hp = (int)round($maxHp * $hpPercent);
        $mana = (int)round($maxMana * $manaPercent);

        if ($hpPercent >= 0.99) {
            $hp = $maxHp;
        }
        if ($manaPercent >= 0.99) {
            $mana = $maxMana;
        }

        return [
            'max_hp' => $maxHp,
            'hp' => $hp,
            'max_mana' => $maxMana,
            'mana' => $mana
        ];
    }
}

