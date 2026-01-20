<?php

namespace App\Controllers;

use App\Services\SkillService;
use App\Services\AuthService;

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

        jsonResponse([
            'skills' => $skills
        ]);
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

        jsonResponse([
            'skill' => $skill
        ]);
    }
}
