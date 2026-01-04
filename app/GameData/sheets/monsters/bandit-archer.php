 <?php

return [
    'id' => 'bandit_archer',
    'type' => 'monster',
    'is_player' => false,
    'name' => 'Bandit Archer',
    'role' => 'Ranged',
    'desc' => 'A rogue archer who turned to banditry, using stolen bows and poisoned arrows to ambush travelers. They strike from hidden positions and rarely fight fair.',
    'base_level' => 10,
    'images' => [
        'default' => 'assets/img/archer-female.png',
    ],
    'video' => 'assets/video/archer-female.mp4', // optional (only used if you add the asset)
    'attributes' => [
        'str' => 10,
        'agi' => 35,
        'vit' => 10,
        'int' => 5,
        'dex' => 40,
        'luk' => 15,
    ],
    'attacks' => 1,
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
    ],
    'loot_table' => [
        'gold_min' => 15,
        'gold_max' => 35,
        'xp' => 55,
        'items' => [
            ['id' => 'broken_arrow', 'chance' => 0.8, 'rarity' => 'common'],
            ['id' => 'leather_quiver', 'chance' => 0.15, 'rarity' => 'uncommon'],
            ['id' => 'hunters_bow', 'chance' => 0.05, 'rarity' => 'rare'],
        ],
    ],
];



