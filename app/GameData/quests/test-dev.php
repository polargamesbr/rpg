<?php
/**
 * Quest: Test Dev
 *
 * Minimal dev map for combat testing.
 */

return [
    'id' => 'test-dev',
    'name' => 'Test Dev',
    'description' => 'Dev-only combat test map.',

    // Map configuration
    'map' => [
        'gridCols' => 20,
        'gridRows' => 15,
        'cellSize' => 64,
        'mapImage' => '/public/assets/img/maps/castle-map.webp',
    ],

    // Player starting position
    'player_start' => [
        'x' => 5,
        'y' => 8,
    ],

    // Player defaults for this quest
    'player_defaults' => [
        'moveRange' => 4,
        'attackRange' => 1,
        'scale' => 1.7,
    ],

    // Enemy units (2 slimes)
    'enemies' => [
        [
            'id' => 'slime_1',
            'combat_key' => 'toxic_slime',
            'x' => 10,
            'y' => 8,
        ],
        [
            'id' => 'slime_2',
            'combat_key' => 'toxic_slime',
            'x' => 12,
            'y' => 9,
        ],
    ],

    // Exit portal
    'portal' => [
        'id' => 'portal',
        'x' => 16,
        'y' => 8,
        'name' => 'Exit',
    ],
];

