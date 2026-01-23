<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\CharacterService;
use App\Services\EntitySheetService;
use App\Services\UserEventService;
use App\Services\UuidService;
use App\Models\Character;

class IntroController
{
    public function index(): void
    {
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }

        $userId = AuthService::getCurrentUserId();
        if (UserEventService::hasEvent($userId, 'intro_done')) {
            redirect('/game/city-hub');
            return;
        }

        view('game.intro');
    }

    public function complete(): void
    {
        if (!AuthService::isLoggedIn()) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $name = trim((string)($input['name'] ?? ''));
        if ($name === '') {
            $name = 'Aldric Valehart';
        }

        if (mb_strlen($name) < 2 || mb_strlen($name) > 50 || !preg_match("/^[\\p{L}0-9\\s'\\-]{2,50}$/u", $name)) {
            jsonResponse(['success' => false, 'error' => 'Invalid character name (2-50 chars, letters/numbers/spaces/-/\').'], 400);
            return;
        }

        $userId = AuthService::getCurrentUserId();
        if (!$userId) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }
        $character = Character::findByUser($userId);

        $entityId = 'swordsman';
        $sheet = EntitySheetService::find($entityId);
        $attrs = $sheet['attributes'] ?? ['str' => 10, 'agi' => 10, 'vit' => 10, 'int' => 10, 'dex' => 10, 'luk' => 10];
        $level = 1;
        $maxHp = ($level * 100) + ($attrs['vit'] * 20);
        $maxMana = ($level * 10) + ($attrs['int'] * 5);

        if ($character) {
            Character::update((int)$character['id'], [
                'name' => $name,
                'entity_id' => $character['entity_id'] ?? $entityId,
                'party_active' => 1,
                'party_slot' => $character['party_slot'] ?? 1
            ]);
            $character = Character::findById((int)$character['id']);
        } else {
            $characterId = Character::create([
                'uuid' => UuidService::generate(),
                'user_id' => $userId,
                'name' => $name,
                'entity_id' => $entityId,
                'party_active' => 1,
                'party_slot' => 1,
                'gender' => 'male',
                'level' => $level,
                'str' => (int)$attrs['str'],
                'agi' => (int)$attrs['agi'],
                'vit' => (int)$attrs['vit'],
                'int' => (int)$attrs['int'],
                'dex' => (int)$attrs['dex'],
                'luk' => (int)$attrs['luk'],
                'hp' => $maxHp,
                'max_hp' => $maxHp,
                'mana' => $maxMana,
                'max_mana' => $maxMana,
                'xp' => 0,
                'attribute_points' => 0,
                'gold' => 150
            ]);
            $character = Character::findById((int)$characterId);
        }

        if (!empty($character['uuid'])) {
            CharacterService::setActiveCharacter($character['uuid']);
        }

        UserEventService::setEvent($userId, 'intro_done', date('c'));

        jsonResponse(['success' => true, 'redirect' => '/game/city-hub']);
    }
}

