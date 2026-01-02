<?php

namespace App\Services;

use App\Models\Character;
use App\Services\AuthService;

class CharacterService
{
    /**
     * Get the active character for the current user
     * Returns the character from session if set, otherwise finds by user
     */
    public static function getActiveCharacter(): ?array
    {
        if (!AuthService::isLoggedIn()) {
            return null;
        }

        $userId = AuthService::getCurrentUserId();

        // If active character is set in session, use it
        if (isset($_SESSION['active_character_uuid'])) {
            $character = Character::findByUuid($_SESSION['active_character_uuid']);
            
            // Validate that character belongs to user
            if ($character && $character['user_id'] == $userId) {
                return $character;
            } else {
                // Invalid session data, clear it
                unset($_SESSION['active_character_uuid']);
                unset($_SESSION['active_character_id']);
            }
        }

        // Fallback: get the most recent character for the user
        return Character::findByUser($userId);
    }

    /**
     * Validate that a character belongs to the current user
     */
    public static function validateCharacterAccess(string $characterUuid): bool
    {
        if (!AuthService::isLoggedIn()) {
            return false;
        }

        $userId = AuthService::getCurrentUserId();
        $character = Character::findByUuid($characterUuid);

        return $character && $character['user_id'] == $userId;
    }

    /**
     * Set the active character in session
     */
    public static function setActiveCharacter(string $characterUuid): bool
    {
        if (!self::validateCharacterAccess($characterUuid)) {
            return false;
        }

        $character = Character::findByUuid($characterUuid);
        if ($character) {
            $_SESSION['active_character_uuid'] = $characterUuid;
            $_SESSION['active_character_id'] = $character['id'];
            return true;
        }

        return false;
    }
}

