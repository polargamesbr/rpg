<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\CharacterService;
use App\Models\Character;
use App\Services\UserEventService;

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
        $userId = AuthService::getCurrentUserId();

        if (!$character) {
            if (!UserEventService::hasEvent($userId, 'intro_done')) {
                redirect('/game/intro');
            } else {
                redirect('/panel');
            }
            return;
        }
        
        $originCity = 'Stormhaven';
        $forceDialog = isset($_GET['debug_dialog']) && $_GET['debug_dialog'] === '1';
        $showGateDialog = $forceDialog || !UserEventService::hasEvent($userId, 'stormhaven_gate_intro');
        
        view('game.city-hub', [
            'character' => $character,
            'originCity' => $originCity,
            'showGateDialog' => $showGateDialog,
            'forceGateDialog' => $forceDialog
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
        $userId = AuthService::getCurrentUserId();

        if (!$character) {
            $userId = AuthService::getCurrentUserId();
            if (!UserEventService::hasEvent($userId, 'intro_done')) {
                redirect('/game/intro');
            } else {
                redirect('/panel');
            }
            return;
        }

        if (!$userId || !UserEventService::hasEvent($userId, 'stormhaven_gate_intro')) {
            redirect('/game/city-hub');
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

