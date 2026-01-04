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

    /**
     * Load modal content (lazy loading)
     * GET /game/modal/{modalName}
     */
    public function loadModal(string $modalName): void
    {
        if (!AuthService::isLoggedIn()) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Not authenticated']);
            return;
        }

        // Security: only allow specific modal names
        $allowedModals = ['worldmap', 'character', 'combat'];
        if (!in_array($modalName, $allowedModals)) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Modal not found']);
            return;
        }

        $modalPath = __DIR__ . '/../../views/partials/modals/' . $modalName . '.php';
        
        if (!file_exists($modalPath)) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Modal file not found']);
            return;
        }

        // Set content type to HTML
        header('Content-Type: text/html; charset=UTF-8');
        
        // Include the modal file (it will output HTML directly)
        include $modalPath;
    }
}

