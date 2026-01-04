<?php

return [
    'id' => 'thief',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Thief',
    'display_name' => 'Thief',
    'role' => 'Assassin',
    'desc' => 'An agile rogue who moves through shadows and strikes from the darkness. Masters of stealth and precision, they excel at quick, deadly attacks and evading danger.',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/thief-male.png',
        'female' => 'assets/img/thief-female.png',
    ],
    'attributes' => [
        'str' => 8,
        'agi' => 14,
        'vit' => 7,
        'int' => 6,
        'dex' => 15,
        'luk' => 8,
    ],
    'skills' => [
        [
            'id' => 'shadow_blade',
            'name' => 'Shadow Blade',
            'mana' => 30,
            'dmg_mult' => 1.3,
            'icon' => 'swords',
            'type' => 'single',
            'description' => 'A quick strike with a chance to bleed.',
            'effect' => ['id' => 'bleed', 'chance' => 0.55, 'duration' => 3],
        ],
        [
            'id' => 'envenom',
            'name' => 'Envenom',
            'mana' => 25,
            'dmg_mult' => 1.1,
            'icon' => 'skull',
            'type' => 'single',
            'description' => 'A dirty hit with a high chance to poison.',
            'effect' => ['id' => 'poison', 'chance' => 0.75, 'duration' => 4],
        ],
    ],
];



