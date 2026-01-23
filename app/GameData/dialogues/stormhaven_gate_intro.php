<?php

return [
    'id' => 'stormhaven_gate_intro',
    'assets' => [
        '/public/assets/npc/npc_garrick.png',
        '/public/assets/npc/npc_meryl_dunn.png',
        '/public/assets/npc/npc_swordman.png'
    ],
    'steps' => [
        [
            'name' => 'NARRAÇÃO',
            'text' => 'A estrada termina diante dos portões colossais de Stormhaven. As muralhas se erguem altas, marcadas por tempo e batalha. Guardas observam cada viajante que se aproxima.',
            'side' => 'center'
        ],
        [
            'name' => 'NARRAÇÃO',
            'text' => 'Quando você pisa sob a sombra das torres, um guarda veterano se destaca e bloqueia seu caminho. Armadura usada. Cicatriz no maxilar. Olhar firme. Ele observa sua espada antes de encarar você.',
            'side' => 'center'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Você andou muito para chegar até aqui.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Stormhaven não abre os portões por curiosidade. Então me diga… você está fugindo de algo… ou veio atrás de algo?',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'type' => 'choice',
            'name' => 'ESCOLHA',
            'text' => 'Escolha sua resposta:',
            'side' => 'center',
            'options' => [
                ['text' => 'Vim atrás de trabalho.', 'next' => 5],
                ['text' => 'Não estou fugindo de nada.', 'next' => 7],
                ['text' => 'Isso importa?', 'next' => 9]
            ]
        ],
        [
            'name' => '{playerName}',
            'text' => 'Vim atrás de trabalho.',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 6
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Trabalho exige mais do que uma lâmina presa ao cinto.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 11
        ],
        [
            'name' => '{playerName}',
            'text' => 'Não estou fugindo de nada.',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 8
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Bom. Porque a cidade não precisa de mais fantasmas.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 11
        ],
        [
            'name' => '{playerName}',
            'text' => 'Isso importa?',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 10
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Aqui dentro, tudo importa.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 11
        ],
        [
            'name' => 'NARRAÇÃO',
            'text' => 'Antes que o silêncio pese mais, um grito ecoa da lateral dos portões. Uma comerciante corre em direção aos guardas.',
            'side' => 'center'
        ],
        [
            'name' => 'Meryl Dunn',
            'text' => 'Capitão! Slimes nos portões leste! Estão corroendo as carroças!',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_meryl_dunn.png'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Você quer mostrar que não é só mais um viajante?',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Dois slimes. Nada glorioso. Se conseguir lidar com isso… talvez eu acredite que pertence aqui.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png'
        ],
        [
            'type' => 'choice',
            'name' => 'ESCOLHA',
            'text' => 'Escolha sua resposta:',
            'side' => 'center',
            'options' => [
                ['text' => 'Eu resolvo.', 'next' => 16],
                ['text' => 'Isso não é trabalho da guarda?', 'next' => 18],
                ['text' => 'E depois disso?', 'next' => 20]
            ]
        ],
        [
            'name' => '{playerName}',
            'text' => 'Eu resolvo.',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 17
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Depois disso… veremos.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 22
        ],
        [
            'name' => '{playerName}',
            'text' => 'Isso não é trabalho da guarda?',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 19
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Depois disso… veremos.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 22
        ],
        [
            'name' => '{playerName}',
            'text' => 'E depois disso?',
            'side' => 'right',
            'image' => '/public/assets/npc/npc_swordman.png',
            'next' => 21
        ],
        [
            'name' => 'Capitão Garrick',
            'text' => 'Depois disso… veremos.',
            'side' => 'left',
            'image' => '/public/assets/npc/npc_garrick.png',
            'next' => 22
        ],
        [
            'name' => 'NARRAÇÃO',
            'text' => 'A multidão se afasta. Você aperta o cabo da espada. Sua jornada em Stormhaven começa com o aço em mãos.',
            'side' => 'center'
        ]
    ]
];
