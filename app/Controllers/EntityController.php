<?php

namespace App\Controllers;

use App\Services\EntitySheetService;
use App\Services\AuthService;
use App\Services\StateEncryptionService;

class EntityController
{
    /**
     * GET /game/api/entities?ids=hero_swordman,slime
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

        $responseData = [
            'entities' => $entities
        ];

        // Criptografar resposta se tiver usuário autenticado E se DEBUG_MODE=false
        $shouldEncrypt = StateEncryptionService::shouldEncrypt();
        $user = AuthService::getCurrentUser();
        if ($shouldEncrypt && $user) {
            $encryptionKey = StateEncryptionService::getUserEncryptionKey((int)$user['id']);
            $encrypted = StateEncryptionService::encryptApiResponse($responseData, $encryptionKey);
            jsonResponse($encrypted);
            return;
        }

        // Se DEBUG_MODE=true, retornar sem criptografia (RAW)
        jsonResponse($responseData);
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

        $responseData = [
            'entity' => $entity
        ];

        // Criptografar resposta se tiver usuário autenticado E se DEBUG_MODE=false
        $shouldEncrypt = StateEncryptionService::shouldEncrypt();
        $user = AuthService::getCurrentUser();
        if ($shouldEncrypt && $user) {
            $encryptionKey = StateEncryptionService::getUserEncryptionKey((int)$user['id']);
            $encrypted = StateEncryptionService::encryptApiResponse($responseData, $encryptionKey);
            jsonResponse($encrypted);
            return;
        }

        // Se DEBUG_MODE=true, retornar sem criptografia (RAW)
        jsonResponse($responseData);
    }

    /**
     * Get API encryption key for user
     * POST /game/api/get-key
     */
    public function getApiKey(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $encryptionKey = StateEncryptionService::getUserEncryptionKey((int)$user['id']);
        
        jsonResponse([
            'success' => true,
            'key' => $encryptionKey
        ]);
    }
}
