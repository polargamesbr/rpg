<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\UserEventService;

class EventController
{
    public function complete(): void
    {
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $userId = AuthService::getCurrentUserId();
        if (!$userId) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $key = trim((string)($input['key'] ?? ''));
        if ($key === '' || !preg_match('/^[a-zA-Z0-9_\-]{1,100}$/', $key)) {
            jsonResponse(['success' => false, 'error' => 'Invalid event key'], 400);
            return;
        }

        UserEventService::setEvent((int)$userId, $key, date('c'));

        jsonResponse(['success' => true]);
    }
}

