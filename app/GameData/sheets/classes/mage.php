<?php

return [
    'id' => 'mage',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Mage',
    'display_name' => 'Mage',
    'role' => 'Mage',
    'desc' => 'An arcane spellcaster who wields powerful magical forces. Through years of study and dedication, they command the elements and bend reality to their will.',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/mage-male.webp',
        'female' => 'assets/img/mage-female.webp',
    ],
    'growth' => [
        'hp_base_per_level' => 60,
        'hp_vit_mult'       => 10,
        'sp_base_per_level' => 50,
        'sp_int_mult'       => 25,
        'atk_base'          => 15,
        'atk_str_mult'      => 0.5,
        'atk_lvl_mult'      => 0.5,
        'matk_base'         => 60,
        'matk_int_mult'     => 3.5,
        'matk_lvl_mult'     => 2.5,
    ],
    'attributes' => [
        'str' => 5,
        'agi' => 7,
        'vit' => 6,
        'int' => 15,
        'dex' => 10,
        'luk' => 5,
    ],
    'skills' => [
        [
            'id' => 'fireball',
            'name' => 'Fireball',
            'mana' => 30,
            'dmg_mult' => 1.8,
            'icon' => 'flame',
            'type' => 'single',
            'description' => 'A powerful fire spell with a chance to burn.',
            'effect' => ['id' => 'burn', 'chance' => 0.45, 'duration' => 3],
        ],
        [
            'id' => 'frost_bolt',
            'name' => 'Frost Bolt',
            'mana' => 35,
            'dmg_mult' => 1.6,
            'icon' => 'snowflake',
            'type' => 'single',
            'description' => 'A chilling bolt with a chance to freeze.',
            'effect' => ['id' => 'freeze', 'chance' => 0.2, 'duration' => 1],
        ],
    ],
];



