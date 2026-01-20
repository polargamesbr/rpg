<?php

return [
    // Home
    'GET /' => 'HomeController@index',
    
    // Auth (Player Account)
    'GET /login' => 'AuthController@showLogin',
    'POST /login' => 'AuthController@login',
    'GET /register' => 'AuthController@showRegister',
    'POST /register' => 'AuthController@register',
    'GET /logout' => 'AuthController@logout',
    
    // Panel (User Character Management)
    'GET /panel' => 'PanelController@index',
    'GET /panel/character/select/{uuid}' => 'PanelController@selectCharacter',
    'GET /panel/character/delete/{uuid}' => 'PanelController@deleteCharacter',
    
    // Game Routes (with /game prefix)
    'GET /game' => 'HomeController@game',
    'GET /game/city-hub' => 'GameController@cityHub',
    'GET /game/tavern' => 'GameController@tavern',
    'GET /game/character/create' => 'CharacterController@showCreate',
    'POST /game/character/validate-name' => 'CharacterController@validateName',
    'POST /game/character/store' => 'CharacterController@store',
    
    // Chat Routes
    'POST /game/chat/send' => 'ChatController@send',
    'GET /game/chat/messages' => 'ChatController@messages',
    'GET /game/chat/poll' => 'ChatController@poll',
    
    // Quest Routes
    'POST /game/quest/start' => 'QuestController@start',
    
    // Explore Routes (Canvas Map System)
    'GET /game/explore' => 'ExploreController@index',
    'GET /game/explore/state' => 'ExploreController@getState',
    'POST /game/explore/state' => 'ExploreController@setState',
    'POST /game/explore/move' => 'ExploreController@move',
    'POST /game/explore/complete' => 'ExploreController@complete',
    'POST /game/explore/reset' => 'ExploreController@reset',
    
    // Modal Routes (Lazy Loading)
    'GET /game/modal/{modalName}' => 'GameController@loadModal',
    
    // API Routes (Tactical System)
    'GET /game/api/entities' => 'EntityController@batch',
    'GET /game/api/entities/{id}' => 'EntityController@show',
    'GET /game/api/skills' => 'SkillController@batch',
    'GET /game/api/skills/{id}' => 'SkillController@show',
    
    // Debug Route (temporary)
    'GET /debug/gemini' => 'DebugController@gemini',
];
