<?php

return [
    'id' => 'mage',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Mage',
    'display_name' => 'Mage',
    'role' => 'Mage',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/mage-male.png',
        'female' => 'assets/img/mage-female.png',
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


