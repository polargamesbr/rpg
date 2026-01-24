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
    'GET /game/intro' => 'IntroController@index',
    'POST /game/intro/complete' => 'IntroController@complete',
    'GET /game/dialogues/{id}' => 'DialogController@show',
    'POST /game/events/complete' => 'EventController@complete',
    
    // Chat Routes
    'POST /game/chat/send' => 'ChatController@send',
    'GET /game/chat/messages' => 'ChatController@messages',
    'GET /game/chat/poll' => 'ChatController@poll',
    
    // Quest Routes
    'POST /game/quest/start' => 'QuestController@start',
    
    // Explore Routes (Canvas Map System)
    'GET /game/explore' => 'ExploreController@index',
    'GET /game/explore/state' => 'ExploreController@getState',
    'POST /game/explore/get-key' => 'ExploreController@getEncryptionKey',
    'POST /game/api/get-key' => 'EntityController@getApiKey',
    'POST /game/explore/get-expected-hmac' => 'ExploreController@getExpectedHmac',
    'POST /game/explore/state' => 'ExploreController@setState',
    'POST /game/explore/complete' => 'ExploreController@complete',
    'POST /game/explore/award-exp' => 'ExploreController@awardExp',
    'POST /game/explore/reset' => 'ExploreController@reset',
    
    // Action-based Routes (Secure)
    'POST /game/explore/action/move' => 'ExploreController@moveAction',
    'POST /game/explore/action/end-turn' => 'ExploreController@endTurnAction',
    'POST /game/explore/action/attack' => 'ExploreController@attackAction',
    'POST /game/explore/action/skill' => 'ExploreController@skillAction',
    
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
