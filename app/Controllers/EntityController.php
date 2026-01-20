<?php

namespace App\Controllers;

use App\Services\EntitySheetService;
use App\Services\AuthService;

class EntityController
{
    /**
     * GET /game/api/entities?ids=hero_swordman,toxic_slime
     * Returns batch of entities as JSON
     */
    public function batch(): void
    {
        // Require authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['error' => 'Unauthorized'], 401);
            return;
        }

        $idsParam = $_GET['ids'] ?? '';
        if (empty($idsParam)) {
            jsonResponse(['error' => 'Missing ids parameter'], 400);
            return;
        }

        $ids = array_map('trim', explode(',', $idsParam));
        $ids = array_filter($ids, fn($id) => !empty($id));

        if (empty($ids)) {
            jsonResponse(['error' => 'No valid ids provided'], 400);
            return;
        }

        $entities = EntitySheetService::findBatch($ids);

        jsonResponse([
            'entities' => $entities
        ]);
    }

    /**
     * GET /game/api/entities/{id}
     * Returns single entity as JSON
     */
    public function show(string $id): void
    {
        // Require authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['error' => 'Unauthorized'], 401);
            return;
        }

        if (empty($id)) {
            jsonResponse(['error' => 'Missing entity id'], 400);
            return;
        }

        $entity = EntitySheetService::find($id);

        if (!$entity) {
            jsonResponse(['error' => 'Entity not found'], 404);
            return;
        }

        jsonResponse([
            'entity' => $entity
        ]);
    }
}
