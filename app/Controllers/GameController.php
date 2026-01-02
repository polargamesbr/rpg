<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\CharacterService;
use App\Models\Character;
use App\Models\ClassModel;

class GameController
{
    public function cityHub(): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        
        // Get active character using CharacterService
        $character = CharacterService::getActiveCharacter();

        if (!$character) {
            // No character found, redirect to panel to create or select one
            redirect('/panel');
            return;
        }
        
        // Get starting city from character data (already joined with class)
        $originCity = $character['starting_city'] ?? 'Stormhaven';
        
        view('game.city-hub', [
            'character' => $character,
            'originCity' => $originCity
        ]);
    }

    public function tavern(): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        
        // Get active character using CharacterService
        $character = CharacterService::getActiveCharacter();

        if (!$character) {
            // No character found, redirect to panel to create or select one
            redirect('/panel');
            return;
        }
        
        view('game.tavern', [
            'character' => $character,
            'roomName' => 'tavern'
        ]);
    }
}

