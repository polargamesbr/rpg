<?php

namespace App\Services;

/**
 * Builds an entity instance from the base (sheet) + character (DB) + optional player_skills.
 * Base = static definition; Character = deltas (level, exp, stats); player_skills = skills unlocked.
 */
class EntityInstanceBuilder
{
    /**
     * Build an instance for use in a mission/battle.
     *
     * @param string $entityId Sheet id (e.g. 'swordsman', 'archer')
     * @param array<string, mixed> $character Character row (level, str, agi, vit, int, dex, luk, max_hp, max_mana, name, ...)
     * @param array<string> $playerSkillIds Optional. If non-empty, only these skill ids are included; else all base skills.
     * @return array<string, mixed> Instance with name, attributes, level, maxHp, maxSp, attack, defense, skills, images, animations, sounds, element, combat_key, entity_id
     */
    public static function build(string $entityId, array $character, array $playerSkillIds = []): array
    {
        $base = EntitySheetService::find($entityId);
        if (!$base) {
            throw new \RuntimeException("EntityInstanceBuilder: base not found for entity_id={$entityId}");
        }

        $attrs = [
            'str' => (int)($character['str'] ?? $base['attributes']['str'] ?? 10),
            'agi' => (int)($character['agi'] ?? $base['attributes']['agi'] ?? 10),
            'vit' => (int)($character['vit'] ?? $base['attributes']['vit'] ?? 10),
            'int' => (int)($character['int'] ?? $base['attributes']['int'] ?? 10),
            'dex' => (int)($character['dex'] ?? $base['attributes']['dex'] ?? 10),
            'luk' => (int)($character['luk'] ?? $base['attributes']['luk'] ?? 10),
        ];

        $level = (int)($character['level'] ?? $base['base_level'] ?? 1);
        // HP e SP derivados de nível e atributos (mesma fórmula do CharacterController)
        // HP: mais VIT e level -> mais HP.  SP: mais INT e level -> mais SP.
        $maxHp = ($level * 100) + ($attrs['vit'] * 20);
        $maxSp = ($level * 10) + ($attrs['int'] * 5);

        $stats = EntitySheetService::getCombatStats($base);
        $attack = (isset($character['attack']) && is_numeric($character['attack'])) ? (int)$character['attack'] : $stats['attack'];
        $defense = (isset($character['defense']) && is_numeric($character['defense'])) ? (int)$character['defense'] : $stats['defense'];

        $skills = $base['skills'] ?? [];
        $skills = array_values(array_filter($skills, function ($s) use ($level) {
            if (!is_array($s)) {
                return true;
            }
            $unlockLevel = (int)($s['unlock_level'] ?? $s['level'] ?? 1);
            return $unlockLevel <= $level;
        }));
        if ($playerSkillIds !== []) {
            $set = array_flip($playerSkillIds);
            $skills = array_values(array_filter($skills, function ($s) use ($set) {
                $id = is_array($s) ? ($s['id'] ?? $s) : $s;
                return isset($set[$id]);
            }));
        }

        return [
            'entity_id' => $entityId,
            'combat_key' => $base['combat_key'] ?? $entityId,
            'name' => $character['name'] ?? $base['name'] ?? $entityId,
            'attributes' => $attrs,
            'level' => $level,
            'maxHp' => $maxHp,
            'maxSp' => $maxSp,
            'attack' => $attack,
            'defense' => $defense,
            'moveRange' => $stats['moveRange'],
            'attackRange' => $stats['attackRange'],
            'scale' => $stats['scale'],
            'skills' => $skills,
            'images' => $base['images'] ?? [],
            'animations' => $base['animations'] ?? [],
            'sounds' => $base['sounds'] ?? [],
            'element' => $base['element'] ?? 'neutral',
        ];
    }
}
