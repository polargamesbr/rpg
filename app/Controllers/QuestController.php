<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\CharacterService;
use App\Services\QuestService;

class QuestController
{
    /**
     * Start a quest session
     * POST /game/quest/start
     */
    public function start(): void
    {
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
            return;
        }

        $character = CharacterService::getActiveCharacter();
        if (!$character) {
            jsonResponse(['success' => false, 'error' => 'No active character'], 400);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $questId = $input['quest_id'] ?? '';
        if (empty($questId)) {
            jsonResponse(['success' => false, 'error' => 'Quest ID is required'], 400);
            return;
        }

        try {
            $result = QuestService::startQuestSession(
                AuthService::getCurrentUserId(),
                $character,
                $questId
            );

            $redirect = url('game/explore') . '?session=' . $result['session_uid'];

            jsonResponse([
                'success' => true,
                'session_uid' => $result['session_uid'],
                'redirect' => $redirect
            ]);
        } catch (\Throwable $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}

