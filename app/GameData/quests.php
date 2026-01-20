<?php

return [
    'first-steps' => [
        'id' => 'first-steps',
        'title' => 'First Steps',
        'description' => 'Learn the basics of combat and exploration in Stormhaven. Master your first sword techniques, learn to navigate the city, and discover the fundamentals of adventuring.',
        'prompt_ia' => 'You are a narrator for an RPG game. The player is starting their first quest: "First Steps". This is a tutorial quest where the character learns the basics of adventuring in Stormhaven. The character is a newcomer to the city and needs to learn about combat, exploration, and the world around them. Create an engaging narrative that introduces the player to the game mechanics while telling an interesting story. The story should be set in Stormhaven, a dark fantasy medieval city.',
        'image' => 'torvin.webp',
        'rewards' => [
            'xp' => 50,
            'gold' => 10
        ],
        'difficulty' => 'easy',
        'estimated_time' => '15 minutes'
    ],
    'join-the-guild' => [
        'id' => 'join-the-guild',
        'title' => 'Join the Guild',
        'description' => 'Visit the Guild Hall and enlist as an official adventurer. Prove your worth to the Guild Master and gain access to exclusive quests, rewards, and adventuring parties.',
        'prompt_ia' => 'You are a narrator for an RPG game. The player is on the quest "Join the Guild". The character must visit the Guild Hall in Stormhaven and prove their worth to the Guild Master. This quest involves social interaction, demonstrating skills, and potentially some light challenges. The Guild Hall is a prestigious building where adventurers gather. Create a narrative that involves meeting the Guild Master, showing capabilities, and earning the right to join the official adventurer\'s guild.',
        'image' => 'guild-hall.jpg',
        'rewards' => [
            'xp' => 100,
            'gold' => 50,
            'item' => 'Guild Badge'
        ],
        'difficulty' => 'medium',
        'estimated_time' => '20 minutes',
        'prerequisite' => 'first-steps'
    ],
    'knights-duty' => [
        'id' => 'knights-duty',
        'title' => 'A Knight\'s Duty',
        'description' => 'Patrol the city gates and protect the citizens of Stormhaven from bandit raids. Engage in combat with enemy forces and prove your valor as a guardian of the realm.',
        'prompt_ia' => 'You are a narrator for an RPG game. The player is on the quest "A Knight\'s Duty". The character must patrol the city gates of Stormhaven and protect citizens from bandit raids. This quest involves combat, tactical decisions, and protecting innocents. The city gates are under threat from bandits who are planning a raid. Create a narrative that involves preparation, patrol, and defending against the attack. There will be combat encounters mixed with narrative choices.',
        'image' => 'city-gates.jpg',
        'rewards' => [
            'xp' => 120,
            'gold' => 75,
            'item' => 'Knight\'s Favor'
        ],
        'difficulty' => 'hard',
        'estimated_time' => '30 minutes',
        'prerequisite' => 'join-the-guild'
    ]
];

