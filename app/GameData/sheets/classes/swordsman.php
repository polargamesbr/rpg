<?php

return [
    'id' => 'swordsman',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Swordsman',
    'display_name' => 'Swordsman',
    'role' => 'Warrior',
    'desc' => 'A disciplined warrior trained in one-handed combat and military tactics. Masters of sword and shield, they excel at both offense and defense, making them reliable front-line fighters.',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/swordman-male.png',
        'female' => 'assets/img/swordman-female.png',
    ],
    'attributes' => [
        'str' => 12,
        'agi' => 8,
        'vit' => 10,
        'int' => 5,
        'dex' => 8,
        'luk' => 5,
    ],
    'skills' => [
        [
            'id' => 'heavy_bash',
            'name' => 'Heavy Bash',
            'mana' => 20,
            'dmg_mult' => 1.2,
            'icon' => 'shield',
            'type' => 'single',
            'description' => 'A heavy strike with a chance to stun.',
            'effect' => ['id' => 'stun', 'chance' => 0.35, 'duration' => 1],
        ],
        [
            'id' => 'battle_shout',
            'name' => 'Battle Shout',
            'mana' => 15,
            'dmg_mult' => 0,
            'icon' => 'flag',
            'type' => 'self',
            'description' => 'Focus your mind and recover stamina.',
        ],
    ],
];



