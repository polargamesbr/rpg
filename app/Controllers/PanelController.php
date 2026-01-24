<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\UserEventService;
use App\Services\EntitySheetService;
use App\Models\Character;
use App\Models\Database;

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
        $historyRows = Database::fetchAll(
            "SELECT quest_id, enemy_id, enemy_entity_id, enemy_level, exp_gained, created_at
             FROM quest_exp_history
             WHERE user_id = :user_id
             ORDER BY created_at DESC
             LIMIT 50",
            ['user_id' => $userId]
        );
        $expHistory = [];
        foreach ($historyRows as $row) {
            $enemyEntityId = $row['enemy_entity_id'] ?? null;
            $enemyName = $row['enemy_id'] ?? 'unknown';
            if ($enemyEntityId) {
                $sheet = EntitySheetService::find($enemyEntityId);
                if ($sheet && !empty($sheet['name'])) {
                    $enemyName = $sheet['name'];
                } else {
                    $enemyName = $enemyEntityId;
                }
            }
            $expHistory[] = [
                'quest_id' => $row['quest_id'] ?? '',
                'enemy_name' => $enemyName,
                'enemy_entity_id' => $enemyEntityId,
                'enemy_level' => (int)($row['enemy_level'] ?? 1),
                'exp_gained' => (int)($row['exp_gained'] ?? 0),
                'created_at' => $row['created_at'] ?? null
            ];
        }

        view('panel.index', [
            'user' => $user,
            'character' => $character,
            'introDone' => $introDone,
            'expHistory' => $expHistory
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

