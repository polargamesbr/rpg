<?php

return [
    'id' => 'slime',
    'type' => 'monster',
    'is_player' => false,
    'name' => 'Slime',
    'display_name' => 'Slime',
    'role' => 'Monster',
    'element' => 'neutral',
    'desc' => 'Uma criatura gelatinosa comum encontrada em lugares escuros. Apesar de sua aparência simples, pode ser perigosa em grupos.',
    'base_level' => 1, // Slime é level 1 (monstro fraco)
    'images' => [
        'default' => 'assets/entities/slime/avatar.webp',
    ],
    'animations' => [
        'base' => 'entities',
        'types' => ['idle'],
        'idle'  => ['animationFPS' => 12, 'animationScale' => 0.7, 'animationOffsetX' => 1, 'animationOffsetXWhenFacingRight' => -1, 'animationOffsetY' => 39],
    ],
    'sounds' => [
        'death' => ['monster_death1', 'monster_death2'],
        'idle' => ['slime'],
    ],
    'attributes' => [
        'str' => 5,
        'agi' => 3,
        'vit' => 10,
        'int' => 4,
        'dex' => 3,
        'luk' => 5,
    ],
    'maxHp' => 30,
    'maxSp' => 50,
    'attack' => 5,
    'defense' => 2,
    'moveRange' => 2,
    'attackRange' => 1,
    'behavior' => 'aggressive',
    'scale' => 1.0,
    'attacks' => 1,
    'skills' => [
        [
            'id' => 'dissolve',
            'name' => 'Dissolve',
            'mana' => 10,
            'dmg_mult' => 0.7,
            'icon' => 'poison',
            'type' => 'single',
            'description' => 'A toxic attack that dissolves flesh.',
            'effect' => ['id' => 'poison', 'chance' => 0.3, 'duration' => 2],
        ],
        [
            'id' => 'bounce',
            'name' => 'Bounce',
            'mana' => 5,
            'dmg_mult' => 0.5,
            'icon' => 'bounce',
            'type' => 'single',
            'description' => 'A quick bouncing attack.',
        ],
    ],
    'loot_table' => [
        'gold_min' => 5,
        'gold_max' => 8,
        'xp' => 8,
        'items' => [
            ['id' => 'slime_gel', 'chance' => 0.7, 'rarity' => 'common'],
            ['id' => 'poison_sac', 'chance' => 0.2, 'rarity' => 'uncommon'],
        ],
    ],
];
