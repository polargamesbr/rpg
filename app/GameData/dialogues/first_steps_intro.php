<?php

return [
    'id' => 'first_steps_intro',
    'assets' => [
        '/public/assets/npc/npc_garrick.png',
        '/public/assets/npc/npc_swordman.png'
    ],
    'steps' => [
        [
            'name' => 'Narrador',
            'text' => 'Do outro lado do portão, pequenas criaturas gelatinosas se arrastam pela estrada. Soldados mantêm distância. Comerciantes observam de longe, tensos.',
            'side' => 'center'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Então é agora, garoto. Esses são os tais slimes. Não parecem muita coisa… até começarem a corroer armaduras.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'name' => '{playerName}',
            'text' => 'Já enfrentei coisa pior no caminho até aqui.',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Veremos. Não precisa provar nada pra mim. Só mantenha-se vivo… e não deixe que cheguem perto das carroças.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'name' => 'Narrador',
            'text' => 'Prepare-se, o combate vai iniciar!',
            'side' => 'center'
        ]
    ]
];
