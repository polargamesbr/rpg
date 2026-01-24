<?php

return [
    'id' => 'blacksmith',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Blacksmith',
    'display_name' => 'Blacksmith',
    'role' => 'Bruiser',
    'desc' => 'A warrior blacksmith who combines combat prowess with masterful crafting. They forge weapons in battle and use their hammer as both tool and weapon, creating and destroying with equal skill.',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/blacksmith-male.webp',
        'female' => 'assets/img/blacksmith-female.webp',
    ],
    'growth' => [
        'hp_base_per_level' => 110,
        'hp_vit_mult'       => 25,
        'sp_base_per_level' => 8,
        'sp_int_mult'       => 4,
        'atk_base'          => 45,
        'atk_str_mult'      => 3.0,
        'atk_lvl_mult'      => 2.0,
        'matk_base'         => 15,
        'matk_int_mult'     => 1.0,
        'matk_lvl_mult'     => 0.8,
    ],
    'attributes' => [
        'str' => 14,
        'agi' => 6,
        'vit' => 11,
        'int' => 8,
        'dex' => 7,
        'luk' => 4,
    ],
    'skills' => [
        [
            'id' => 'hammer_slam',
            'name' => 'Hammer Slam',
            'mana' => 20,
            'dmg_mult' => 1.35,
            'icon' => 'hammer',
            'type' => 'single',
            'description' => 'A crushing blow with a chance to stun.',
            'effect' => ['id' => 'stun', 'chance' => 0.25, 'duration' => 1],
        ],
        [
            'id' => 'forge_heat',
            'name' => 'Forge Heat',
            'mana' => 30,
            'dmg_mult' => 1.2,
            'icon' => 'flame',
            'type' => 'single',
            'description' => 'A scorching strike with a chance to burn.',
            'effect' => ['id' => 'burn', 'chance' => 0.3, 'duration' => 2],
        ],
    ],
];



