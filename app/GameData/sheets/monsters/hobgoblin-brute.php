<?php

return [
    'id' => 'hobgoblin_brute',
    'type' => 'monster',
    'is_player' => false,
    'name' => 'Hobgoblin Brute',
    'role' => 'Tank',
    'base_level' => 12,
    'images' => [
        'default' => 'assets/img/swordman-female.png',
    ],
    'attributes' => [
        'str' => 35,
        'agi' => 5,
        'vit' => 40,
        'int' => 1,
        'dex' => 15,
        'luk' => 5,
    ],
    'attacks' => 1,
    'skills' => [
        [
            'id' => 'heavy_slam',
            'name' => 'Heavy Slam',
            'mana' => 15,
            'dmg_mult' => 1.3,
            'icon' => 'hammer',
            'type' => 'single',
            'description' => 'A brutal slam with a chance to stun.',
            'effect' => ['id' => 'stun', 'chance' => 0.25, 'duration' => 1],
        ],
    ],
    'loot_table' => [
        'gold_min' => 30,
        'gold_max' => 60,
        'xp' => 80,
        'items' => [
            ['id' => 'iron_shard', 'chance' => 0.7, 'rarity' => 'common'],
            ['id' => 'heavy_plated_belt', 'chance' => 0.2, 'rarity' => 'uncommon'],
            ['id' => 'hobgoblin_hammer', 'chance' => 0.05, 'rarity' => 'epic'],
        ],
    ],
];


