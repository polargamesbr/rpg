<?php

return [
    'id' => 'archer',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Archer',
    'display_name' => 'Archer',
    'role' => 'Ranged',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/archer-male.png',
        'female' => 'assets/img/archer-female.png',
    ],
    'attributes' => [
        'str' => 8,
        'agi' => 15,
        'vit' => 8,
        'int' => 7,
        'dex' => 14,
        'luk' => 6,
    ],
    'skills' => [
        [
            'id' => 'poison_tip',
            'name' => 'Poison Tip',
            'mana' => 25,
            'dmg_mult' => 1.2,
            'icon' => 'skull',
            'type' => 'single',
            'description' => 'A poisoned arrow with a chance to poison.',
            'effect' => ['id' => 'poison', 'chance' => 0.6, 'duration' => 3],
        ],
        [
            'id' => 'focused_shot',
            'name' => 'Focused Shot',
            'mana' => 20,
            'dmg_mult' => 1.4,
            'icon' => 'crosshair',
            'type' => 'single',
            'description' => 'A precise shot with increased damage.',
        ],
    ],
];


