<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\Character;
use App\Services\EntitySheetService;
use App\Services\UuidService;

class CharacterController
{
    public function showCreate(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        redirect('/game/intro');
    }

    public function validateName(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['valid' => false, 'error' => 'Not authenticated']);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            header('Content-Type: application/json');
            echo json_encode(['valid' => false, 'error' => 'Method not allowed']);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');

        header('Content-Type: application/json');

        // Validations
        if (empty($name)) {
            echo json_encode(['valid' => false, 'error' => 'Character name is required']);
            return;
        }

        if (strlen($name) < 2) {
            echo json_encode(['valid' => false, 'error' => 'Character name must be at least 2 characters']);
            return;
        }

        if (strlen($name) > 50) {
            echo json_encode(['valid' => false, 'error' => 'Character name must be no more than 50 characters']);
            return;
        }

        if (!preg_match('/^[a-zA-Z0-9\s]{2,50}$/', $name)) {
            echo json_encode(['valid' => false, 'error' => 'Character name can only contain letters, numbers, and spaces']);
            return;
        }

        if (Character::nameExists($name)) {
            echo json_encode(['valid' => false, 'error' => 'This character name is already taken']);
            return;
        }

        // Name is valid
        echo json_encode(['valid' => true]);
    }

    public function showSelectClass(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        redirect('/game/intro');
    }

    public function store(): void
    {
        // Check authentication
        if (!AuthService::isLoggedIn()) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Not authenticated']);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            return;
        }

        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim($input['name'] ?? '');
        $gender = $input['gender'] ?? 'male';

        header('Content-Type: application/json');

        // Validations
        if (empty($name) || strlen($name) < 2 || strlen($name) > 50) {
            echo json_encode(['success' => false, 'error' => 'Invalid character name (2-50 characters)']);
            return;
        }

        if (!preg_match('/^[a-zA-Z0-9\s]{2,50}$/', $name)) {
            echo json_encode(['success' => false, 'error' => 'Character name contains invalid characters']);
            return;
        }

        $validGenders = ['male', 'female'];
        if (!in_array($gender, $validGenders)) {
            echo json_encode(['success' => false, 'error' => 'Invalid gender']);
            return;
        }

        // Final check if name exists (someone might have taken it between steps)
        if (Character::nameExists($name)) {
            echo json_encode(['success' => false, 'error' => 'This character name is already taken']);
            return;
        }

        $entityId = 'swordsman';
        $sheet = EntitySheetService::find($entityId);
        if (!$sheet) {
            echo json_encode(['success' => false, 'error' => 'Invalid entity']);
            return;
        }
        $baseAttributes = $sheet['attributes'] ?? ['str' => 10, 'agi' => 10, 'vit' => 10, 'int' => 10, 'dex' => 10, 'luk' => 10];

        // Calculate initial stats
        $level = 1;
        $maxHp = ($level * 100) + ($baseAttributes['vit'] * 20);
        $maxMana = ($level * 10) + ($baseAttributes['int'] * 5);

        $characterData = [
            'uuid' => UuidService::generate(),
            'user_id' => AuthService::getCurrentUserId(),
            'name' => $name,
            'entity_id' => $entityId,
            'party_active' => 1,
            'party_slot' => 1,
            'gender' => $gender,
            'level' => $level,
            'str' => (int)$baseAttributes['str'],
            'agi' => (int)$baseAttributes['agi'],
            'vit' => (int)$baseAttributes['vit'],
            '`int`' => (int)$baseAttributes['int'], // Use backticked key for MySQL reserved word
            'dex' => (int)$baseAttributes['dex'],
            'luk' => (int)$baseAttributes['luk'],
            'hp' => $maxHp,
            'max_hp' => $maxHp,
            'mana' => $maxMana,
            'max_mana' => $maxMana,
            'xp' => 0,
            'attribute_points' => 0,
            'gold' => 150,
            'party_active' => 1,
            'party_slot' => 1
        ];

        try {
            Character::create($characterData);

            // Get base URL from config
            $appConfig = require __DIR__ . '/../../config/app.php';
            $baseUrl = rtrim($appConfig['url'], '/');
            echo json_encode(['success' => true, 'redirect' => $baseUrl . '/panel']);
        } catch (\Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Error creating character: ' . $e->getMessage()]);
        }
    }

}
