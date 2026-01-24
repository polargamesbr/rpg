# GameData Structure

This directory contains all game data configurations.

## Directory Structure

```
app/GameData/
├── sheets/           # Entity definitions (PHP)
│   ├── classes/      # Player classes (swordsman, archer, beast_tamer, etc.)
│   └── monsters/     # Enemy definitions (slime, wolf, etc.)
├── quests/           # Quest configurations (PHP preferred)
│   └── first-steps.php
├── quests.php        # Quest registry/catalog
└── README.md         # This file
```

## Quest Files

Each quest is a single PHP file containing ALL quest data:
- Map configuration (gridCols, gridRows, cellSize, mapImage)
- Walls (collision tiles)
- Allies (referenced by `combat_key` matching sheet IDs)
- Enemies
- Chests
- Portal
- Objectives
- Rules

### Example: quests/first-steps.php

```php
<?php
return [
    'id' => 'first-steps',
    'name' => 'First Steps',
    
    'map' => [
        'gridCols' => 60,
        'gridRows' => 20,
        'cellSize' => 64,
        'mapImage' => '/public/assets/img/maps/first-steps.webp',
    ],
    
    'allies' => [
        ['id' => 'ally_archer_1', 'combat_key' => 'archer', 'x' => 11, 'y' => 9],
        ['id' => 'ally_beast_tamer_1', 'combat_key' => 'beast_tamer', 'x' => 11, 'y' => 11],
    ],
    
    'enemies' => [
        ['id' => 'slime_1', 'combat_key' => 'slime', 'x' => 24, 'y' => 10],
    ],
    
    'walls' => [
        ['x'=>8,'y'=>12], ['x'=>9,'y'=>13], // ... more walls
    ],
    
    // ... portal, chests, objectives, rules
];
```

## Loading Priority

`QuestConfigService::loadConfig()` tries:
1. `quests/{id}.php` (preferred)
2. `quests/{id}.json` (fallback)

## Entity References

Allies and enemies reference entities by `combat_key` which should match:
- Entity sheet `id` (e.g., `beast_tamer`, `archer`, `slime`)
- Or entity sheet `combat_key` field

The system uses `EntitySheetService::findByCombatKey()` which:
1. Searches by `combat_key` field
2. Falls back to `id` field

## Adding New Quests

1. Create `quests/new-quest.php` following the structure above
2. Add the quest to `quests.php` registry if needed
3. Create map image at `public/assets/img/maps/new-quest.webp`

## Adding New Entities

1. Player classes: `sheets/classes/new_class.php`
2. Monsters: `sheets/monsters/new_monster.php`

Each entity must have an `id` field matching the filename.
