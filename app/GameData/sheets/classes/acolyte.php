<?php

return [
    'id' => 'acolyte',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Acolyte',
    'display_name' => 'Acolyte',
    'role' => 'Support',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/sacer-male.png',
        'female' => 'assets/img/sacer-female.png',
    ],
    'attributes' => [
        'str' => 7,
        'agi' => 6,
        'vit' => 9,
        'int' => 12,
        'dex' => 8,
        'luk' => 6,
    ],
    'skills' => [
        [
            'id' => 'recover',
            'name' => 'Recover',
            'mana' => 35,
            'dmg_mult' => 0,
            'icon' => 'heart',
            'type' => 'self',
            'description' => 'A short prayer that restores health.',
        ],
        [
            'id' => 'radiant_burst',
            'name' => 'Radiant Burst',
            'mana' => 40,
            'dmg_mult' => 1.4,
            'icon' => 'sun',
            'type' => 'aoe',
            'description' => 'A burst of light that can burn enemies.',
            'effect' => ['id' => 'burn', 'chance' => 0.25, 'duration' => 2],
        ],
    ],
];


