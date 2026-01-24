<?php

return [
    'id' => 'goblin_scout',
    'type' => 'monster',
    'is_player' => false,
    'name' => 'Goblin Scout',
    'role' => 'Mage',
    'desc' => 'A small goblin explorer that roams the wilderness, using basic magic to survive. Known for their quick attacks and tendency to flee when outnumbered.',
    'base_level' => 8,
    'images' => [
        'default' => 'assets/img/mage-male.webp',
    ],
    'growth' => [
        'hp_base_per_level' => 12,
        'hp_vit_mult'       => 2,
        'sp_base_per_level' => 25,
        'sp_int_mult'       => 6,
        'atk_base'          => 15,
        'atk_str_mult'      => 0.5,
        'matk_base'         => 30,
        'matk_int_mult'     => 1.8,
        'matk_lvl_mult'     => 1.5,
    ],
    'attributes' => [
        'str' => 5,
        'agi' => 15,
        'vit' => 10,
        'int' => 35,
        'dex' => 25,
        'luk' => 10,
    ],
    'attacks' => 1,
    'skills' => [
        [
            'id' => 'fire_bolt',
            'name' => 'Fire Bolt',
            'mana' => 20,
            'dmg_mult' => 1.5,
            'icon' => 'flame',
            'type' => 'single',
            'description' => 'A quick fire spell with a chance to burn.',
            'effect' => ['id' => 'burn', 'chance' => 0.3, 'duration' => 2],
        ],
    ],
    'loot_table' => [
        'gold_min' => 10,
        'gold_max' => 25,
        'xp' => 45,
        'items' => [
            ['id' => 'goblin_ear', 'chance' => 0.8, 'rarity' => 'common'],
            ['id' => 'mystic_scroll', 'chance' => 0.15, 'rarity' => 'uncommon'],
            ['id' => 'goblin_staff', 'chance' => 0.05, 'rarity' => 'rare'],
        ],
    ],
];



