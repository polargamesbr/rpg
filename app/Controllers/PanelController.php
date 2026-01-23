<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\UserEventService;
use App\Models\Character;

class PanelController
{
    public function index(): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        $userId = AuthService::getCurrentUserId();
        $user = AuthService::getCurrentUser();
        $character = Character::findByUser($userId);
        $introDone = UserEventService::hasEvent($userId, 'intro_done');

        view('panel.index', [
            'user' => $user,
            'character' => $character,
            'introDone' => $introDone
        ]);
    }

    public function selectCharacter(string $uuid): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }

        if (empty($uuid)) {
            $_SESSION['error'] = 'Character UUID is required.';
            redirect('/panel');
            return;
        }

        $userId = AuthService::getCurrentUserId();
        $character = Character::findByUuid($uuid);

        // Validate that character belongs to user
        if (!$character || $character['user_id'] != $userId) {
            $_SESSION['error'] = 'Character not found or access denied.';
            redirect('/panel');
            return;
        }

        // Store active character in session using CharacterService
        \App\Services\CharacterService::setActiveCharacter($uuid);

        redirect('/game/city-hub');
    }

    public function deleteCharacter(string $uuid): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }

        $userId = AuthService::getCurrentUserId();
        $character = Character::findByUuid($uuid);

        // Validate that character belongs to user
        if (!$character || $character['user_id'] != $userId) {
            $_SESSION['error'] = 'Character not found or access denied.';
            redirect('/panel');
            return;
        }

        // Delete the character
        Character::delete($character['id']);

        // If this was the active character, clear it from session
        if (isset($_SESSION['active_character_uuid']) && $_SESSION['active_character_uuid'] === $uuid) {
            unset($_SESSION['active_character_uuid']);
            unset($_SESSION['active_character_id']);
        }

        $_SESSION['success'] = 'Character deleted successfully.';
        redirect('/panel');
    }
}

