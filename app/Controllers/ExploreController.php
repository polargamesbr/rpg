<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\QuestService;
use App\Models\Character;

class ExploreController
{
    /**
     * Main exploration view
     */
    public function index(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            redirect('/login');
            return;
        }

        $character = Character::findByUser($user['id']);
        if (!$character) {
            redirect('/game/character/create');
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if (!$sessionUid) {
            redirect('/game/tavern');
            return;
        }

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            redirect('/game/tavern');
            return;
        }
        if (($sessionData['session']['status'] ?? '') !== 'active') {
            redirect('/game/tavern');
            return;
        }

        $data = [
            'character' => $character,
            'pageTitle' => 'Explore'
        ];

        include __DIR__ . '/../../views/game/explore.php';
    }

    /**
     * Get current exploration state (player position, nearby entities, etc.)
     */
    public function getState(): void
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

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $config = $sessionData['config'];
        $state = $sessionData['state'];

        $chests = $state['chests'] ?? ($config['chests'] ?? []);
        $portal = $state['portal'] ?? ($config['portal'] ?? null);

        $mapConfig = $config['map'] ?? [
            'gridCols' => 20,
            'gridRows' => 15,
            'cellSize' => 64,
            'mapImage' => '/public/assets/img/maps/castle-map.webp'
        ];
        
        // Walls são imutáveis e sempre vêm do config, não do state
        $walls = $config['walls'] ?? [];
        
        // Contrato: player (objeto), allies (array), entities (array de inimigos).
        // Frontend usa collectCombatKeysFromSession(); não renomear sem ajustar lá.
        jsonResponse([
            'success' => true,
            'session' => [
                'uid' => $sessionUid,
                'quest_id' => $sessionData['session']['quest_id'],
                'status' => $sessionData['session']['status']
            ],
            'player' => $state['player'] ?? null,
            'allies' => $state['allies'] ?? [],
            'entities' => $state['enemies'] ?? [], // inimigos; chave "entities" no JSON
            'chests' => $chests,
            'portal' => $portal,
            'walls' => $walls,
            'mapConfig' => $mapConfig,
            'turn' => $state['turn'] ?? 1,
            'phase' => $state['phase'] ?? 'player',
            'unitsActed' => $state['unitsActed'] ?? []
        ]);
    }

    /**
     * Move player to a new position
     */
    public function move(): void
    {
        $user = AuthService::getCurrentUser();
        if (!$user) {
            jsonResponse(['success' => false, 'error' => 'Not authenticated'], 401);
            return;
        }

        $sessionUid = $_GET['session'] ?? null;
        if ($sessionUid) {
            $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
            if (!$sessionData) {
                jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $targetX = (int)($input['x'] ?? 0);
            $targetY = (int)($input['y'] ?? 0);

            $mapConfig = $sessionData['config']['map'] ?? [];
            $maxX = (int)($mapConfig['gridCols'] ?? 100); // Fallback grande para evitar erro 400
            $maxY = (int)($mapConfig['gridRows'] ?? 100);

            if ($targetX < 1 || $targetX > $maxX || $targetY < 1 || $targetY > $maxY) {
                jsonResponse(['success' => false, 'error' => 'Invalid position'], 400);
                return;
            }

            $state = $sessionData['state'] ?? [];
            $player = $state['player'] ?? [];
            $from = [
                'x' => (int)($player['x'] ?? 0),
                'y' => (int)($player['y'] ?? 0)
            ];

            $state['player']['x'] = $targetX;
            $state['player']['y'] = $targetY;

            QuestService::updateSessionState((int)$sessionData['session']['id'], $state);
            QuestService::recordMove((int)$sessionData['session']['id'], [
                'from' => $from,
                'to' => ['x' => $targetX, 'y' => $targetY]
            ]);

            jsonResponse([
                'success' => true,
                'position' => ['x' => $targetX, 'y' => $targetY]
            ]);
            return;
        }

        jsonResponse(['success' => false, 'error' => 'Missing session'], 400);
        return;
    }

    /**
     * Update exploration state (quest session)
     * POST /game/explore/state
     */
    public function setState(): void
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

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $stateInput = $input['state'] ?? $input;
        if (!is_array($stateInput)) {
            jsonResponse(['success' => false, 'error' => 'Invalid state'], 400);
            return;
        }

        $state = $sessionData['state'] ?? [];
        if (is_array($input['player'] ?? null)) {
            $stateInput['player'] = array_merge($stateInput['player'] ?? [], $input['player']);
        }
        if (is_array($input['portal'] ?? null)) {
            $stateInput['portal'] = array_merge($stateInput['portal'] ?? [], $input['portal']);
        }
        $state = QuestService::mergeStateInput($state, $stateInput);
        QuestService::updateSessionState((int)$sessionData['session']['id'], $state);
        jsonResponse(['success' => true]);
    }

    /**
     * Complete quest when player reaches portal
     * POST /game/explore/complete
     */
    public function complete(): void
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

        $sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
        if (!$sessionData) {
            jsonResponse(['success' => false, 'error' => 'Invalid session'], 404);
            return;
        }

        $state = $sessionData['state'] ?? [];
        $input = json_decode(file_get_contents('php://input'), true);
        $playerInput = $input['player'] ?? null;
        $portalInput = $input['portal'] ?? null;

        if (is_array($playerInput)) {
            $state['player']['x'] = (int)($playerInput['x'] ?? ($state['player']['x'] ?? 0));
            $state['player']['y'] = (int)($playerInput['y'] ?? ($state['player']['y'] ?? 0));
        }
        if (is_array($portalInput)) {
            $state['portal'] = [
                'x' => (int)($portalInput['x'] ?? 0),
                'y' => (int)($portalInput['y'] ?? 0)
            ] + ($state['portal'] ?? []);
        }
        $enemies = $state['enemies'] ?? [];
        $aliveEnemies = array_filter($enemies, fn($e) => ($e['hp'] ?? 0) > 0);
        if (count($aliveEnemies) > 0) {
            jsonResponse(['success' => false, 'error' => 'Enemies still alive'], 400);
            return;
        }

        $portal = $state['portal'] ?? ($sessionData['config']['portal'] ?? null);
        if (!$portal || !isset($portal['x'], $portal['y'])) {
            jsonResponse(['success' => false, 'error' => 'Portal not configured'], 400);
            return;
        }

        $player = $state['player'] ?? [];
        $px = (int)($player['x'] ?? 0);
        $py = (int)($player['y'] ?? 0);
        if (abs($px - (int)$portal['x']) > 0 || abs($py - (int)$portal['y']) > 0) {
            jsonResponse(['success' => false, 'error' => 'Not at portal'], 400);
            return;
        }

        QuestService::updateSessionState((int)$sessionData['session']['id'], $state);
        QuestService::completeSession((int)$sessionData['session']['id'], [
            'portal' => ['x' => (int)$portal['x'], 'y' => (int)$portal['y']]
        ]);

        jsonResponse([
            'success' => true,
            'redirect' => '/game/tavern'
        ]);
    }

    /**
     * Battle test page (debug) - REMOVED: Sistema antigo de cartas
     */
    public function battleTest(): void
    {
        // Sistema antigo removido - usar sistema tático atual
        redirect('/game/tavern');
        return;
    }

    /**
     * Reset quest session (delete and allow recreation)
     * POST /game/explore/reset
     */
    public function reset(): void
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

        try {
            QuestService::resetSession($sessionUid, (int)$user['id']);
            jsonResponse([
                'success' => true,
                'redirect' => '/game/tavern'
            ]);
        } catch (\Exception $e) {
            jsonResponse(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
