<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\UserEventService;

class DialogController
{
    public function show(string $id): void
    {
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['error' => 'Not authenticated'], 401);
            return;
        }

        $userId = AuthService::getCurrentUserId();
        if (!$userId) {
            jsonResponse(['error' => 'Not authenticated'], 401);
            return;
        }

        $id = preg_replace('/[^a-zA-Z0-9_\-]/', '', $id);
        if ($id === '') {
            jsonResponse(['error' => 'Invalid dialogue id'], 400);
            return;
        }

        if (!$this->canAccess($id, (int)$userId)) {
            jsonResponse(['error' => 'Dialogue locked'], 403);
            return;
        }

        $path = __DIR__ . '/../GameData/dialogues/' . $id . '.php';
        if (!file_exists($path)) {
            jsonResponse(['error' => 'Dialogue not found'], 404);
            return;
        }

        $payload = require $path;
        if (!is_array($payload)) {
            jsonResponse(['error' => 'Invalid dialogue format'], 500);
            return;
        }

        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($payload);
    }

    private function canAccess(string $id, int $userId): bool
    {
        $rules = [
            'stormhaven_gate_intro' => ['intro_done']
        ];

        if (!isset($rules[$id])) {
            return true;
        }

        foreach ($rules[$id] as $eventKey) {
            if (!UserEventService::hasEvent($userId, $eventKey)) {
                return false;
            }
        }

        return true;
    }
}

