<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\QuestBattleService;
use App\Services\QuestService;
use App\Models\QuestSession;

class BattleController
{
    /**
     * Start battle session for a quest session
     * POST /game/battle/start?session=uid
     */
    public function start(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $questSession = QuestSession::findBySessionUid($sessionUid);
        if (!$questSession || (int)$questSession['user_id'] !== (int)$user['id']) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $battleData = $input['battle'] ?? [];

        $result = QuestBattleService::startBattle((int)$questSession['id'], [
            'battle' => $battleData,
            'status' => 'active'
        ]);

        jsonResponse([
            'success' => true,
            'battle_uid' => $result['battle_uid']
        ]);
    }

    /**
     * Get battle state
     * GET /game/battle/state?session=uid&battle=uid
     */
    public function state(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        $battleUid = $_GET['battle'] ?? null;
        if (!$sessionUid || !$battleUid) {
            jsonResponse(['success' => false, 'error' => 'Missing params'], 400);
            return;
        }

        $questSession = QuestSession::findBySessionUid($sessionUid);
        if (!$questSession || (int)$questSession['user_id'] !== (int)$user['id']) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $battle = QuestBattleService::getBattle($battleUid, (int)$questSession['id']);
        if (!$battle) {
            jsonResponse(['success' => false, 'error' => 'Battle not found'], 404);
            return;
        }

        $state = json_decode($battle['state_json'] ?? '{}', true) ?: [];

        jsonResponse([
            'success' => true,
            'battle' => [
                'uid' => $battle['battle_uid'],
                'status' => $battle['status']
            ],
            'state' => $state
        ]);
    }

    /**
     * Get active battle for a quest session
     * GET /game/battle/active?session=uid
     */
    public function active(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
            return;
        }

        $questSession = QuestSession::findBySessionUid($sessionUid);
        if (!$questSession || (int)$questSession['user_id'] !== (int)$user['id']) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $battleUid = QuestBattleService::getActiveBattleUid((int)$questSession['id']);
        if (!$battleUid) {
            jsonResponse(['success' => false, 'error' => 'No active battle'], 404);
            return;
        }

        jsonResponse([
            'success' => true,
            'battle_uid' => $battleUid
        ]);
    }

    /**
     * Save battle state
     * POST /game/battle/state?session=uid&battle=uid
     */
    public function save(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        $battleUid = $_GET['battle'] ?? null;
        if (!$sessionUid || !$battleUid) {
            jsonResponse(['success' => false, 'error' => 'Missing params'], 400);
            return;
        }

        $questSession = QuestSession::findBySessionUid($sessionUid);
        if (!$questSession || (int)$questSession['user_id'] !== (int)$user['id']) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $battle = QuestBattleService::getBattle($battleUid, (int)$questSession['id']);
        if (!$battle) {
            jsonResponse(['success' => false, 'error' => 'Battle not found'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $state = $input['battle_state'] ?? [];
        QuestBattleService::saveBattleState((int)$battle['id'], $state);

        jsonResponse(['success' => true]);
    }

    /**
     * Complete battle
     * POST /game/battle/complete?session=uid&battle=uid
     */
    public function complete(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        $battleUid = $_GET['battle'] ?? null;
        if (!$sessionUid || !$battleUid) {
            jsonResponse(['success' => false, 'error' => 'Missing params'], 400);
            return;
        }

        $questSession = QuestSession::findBySessionUid($sessionUid);
        if (!$questSession || (int)$questSession['user_id'] !== (int)$user['id']) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $battle = QuestBattleService::getBattle($battleUid, (int)$questSession['id']);
        if (!$battle) {
            jsonResponse(['success' => false, 'error' => 'Battle not found'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $result = $input['result'] ?? [];
        QuestBattleService::completeBattle((int)$battle['id'], $result);

        // Sync battle result back to quest session state
        $sessionState = json_decode($questSession['state_json'] ?? '{}', true) ?: [];
        if (!empty($result['units'])) {
            $player = $sessionState['player'] ?? [];
            $enemies = $sessionState['enemies'] ?? [];
            $enemyMap = [];
            foreach ($enemies as $idx => $enemy) {
                if (!empty($enemy['id'])) {
                    $enemyMap[$enemy['id']] = $idx;
                }
            }

            foreach ($result['units'] as $unit) {
                $mapId = $unit['mapId'] ?? null;
                if (!$mapId) {
                    continue;
                }
                if (($player['id'] ?? null) === $mapId) {
                    $sessionState['player']['hp'] = $unit['hp'] ?? ($player['hp'] ?? 0);
                    $sessionState['player']['maxHp'] = $unit['maxHp'] ?? ($player['maxHp'] ?? 0);
                    if (array_key_exists('sp', $unit)) {
                        $sessionState['player']['sp'] = $unit['sp'];
                    }
                    if (array_key_exists('maxSp', $unit)) {
                        $sessionState['player']['maxSp'] = $unit['maxSp'];
                    }
                } elseif (isset($enemyMap[$mapId])) {
                    $eIdx = $enemyMap[$mapId];
                    $enemies[$eIdx]['hp'] = $unit['hp'] ?? ($enemies[$eIdx]['hp'] ?? 0);
                    $enemies[$eIdx]['maxHp'] = $unit['maxHp'] ?? ($enemies[$eIdx]['maxHp'] ?? 0);
                }
            }

            // Remove defeated enemies
            $sessionState['enemies'] = array_values(array_filter($enemies, fn($e) => ($e['hp'] ?? 0) > 0));
            $sessionState['phase'] = 'player';
        }

        QuestService::updateSessionState((int)$questSession['id'], $sessionState);

        jsonResponse(['success' => true]);
    }
}

