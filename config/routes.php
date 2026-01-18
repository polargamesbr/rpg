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

    // Battle Routes (Quest Sessions)
    'POST /game/battle/start' => 'BattleController@start',
    'GET /game/battle/active' => 'BattleController@active',
    'GET /game/battle/state' => 'BattleController@state',
    'POST /game/battle/state' => 'BattleController@save',
    'POST /game/battle/complete' => 'BattleController@complete',
    
    // Explore Routes (Canvas Map System)
    'GET /game/explore' => 'ExploreController@index',
    'GET /game/explore/state' => 'ExploreController@getState',
    'POST /game/explore/state' => 'ExploreController@setState',
    'POST /game/explore/move' => 'ExploreController@move',
    'POST /game/explore/complete' => 'ExploreController@complete',
    'POST /game/explore/reset' => 'ExploreController@reset',
    
    // Battle Routes (From Map Encounters)
    'GET /game/battle-from-map' => 'ExploreController@battleFromMap',
    'GET /game/battle-test' => 'ExploreController@battleTest',
    
    // Modal Routes (Lazy Loading)
    'GET /game/modal/{modalName}' => 'GameController@loadModal',
    
    // Debug Route (temporary)
    'GET /debug/gemini' => 'DebugController@gemini',
];
