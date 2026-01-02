<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\Character;
use App\Models\ClassModel;

class PanelController
{
    public function index(): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }

        $userId = AuthService::getCurrentUserId();
        $characters = Character::findAllByUser($userId);
        $activeCharacterUuid = $_SESSION['active_character_uuid'] ?? null;

        // Characters already have class data from JOIN in findAllByUser
        // Format data for view
        $formattedCharacters = [];
        foreach ($characters as $char) {
            $formattedCharacters[] = [
                'character' => $char,
                'class' => [
                    'display_name' => $char['class_display_name'] ?? $char['class_name'] ?? 'Unknown',
                    'icon_name' => $char['icon_name'] ?? 'sword',
                    'starting_city' => $char['starting_city'] ?? 'Unknown',
                    'image_prefix' => $char['image_prefix'] ?? 'default',
                    'color_hex' => $char['color_hex'] ?? '#d4af37'
                ]
            ];
        }

        view('panel.index', [
            'characters' => $formattedCharacters,
            'activeCharacterUuid' => $activeCharacterUuid
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

