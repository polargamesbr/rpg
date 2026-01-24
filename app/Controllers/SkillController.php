<?php

namespace App\Controllers;

use App\Services\SkillService;
use App\Services\AuthService;
use App\Services\StateEncryptionService;

class SkillController
{
    /**
     * GET /game/api/skills?ids=quick_slash,heavy_slash
     * Returns batch of skills as JSON
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

        $skills = SkillService::getSkills($ids);

        $responseData = [
            'skills' => $skills
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
     * GET /game/api/skills/{id}
     * Returns single skill as JSON
     */
    public function show(string $id): void
    {
        // Require authentication
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['error' => 'Unauthorized'], 401);
            return;
        }

        if (empty($id)) {
            jsonResponse(['error' => 'Missing skill id'], 400);
            return;
        }

        $skill = SkillService::getSkill($id);

        if (!$skill) {
            jsonResponse(['error' => 'Skill not found'], 404);
            return;
        }

        $responseData = [
            'skill' => $skill
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
}
