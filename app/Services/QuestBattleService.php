<?php

namespace App\Services;

use App\Models\QuestBattleSession;
use App\Models\QuestBattleEvent;

class QuestBattleService
{
    public static function startBattle(int $questSessionId, array $initialState): array
    {
        $existing = QuestBattleSession::findActiveByQuestSession($questSessionId);
        if ($existing) {
            return [
                'battle_uid' => $existing['battle_uid'],
                'battle_id' => (int)$existing['id']
            ];
        }

        $battleUid = UuidService::generate();
        $battleId = QuestBattleSession::create([
            'quest_session_id' => $questSessionId,
            'battle_uid' => $battleUid,
            'status' => 'active',
            'state_json' => json_encode($initialState, JSON_UNESCAPED_SLASHES)
        ]);

        return [
            'battle_uid' => $battleUid,
            'battle_id' => $battleId
        ];
    }

    public static function getBattle(string $battleUid, int $questSessionId): ?array
    {
        $battle = QuestBattleSession::findByBattleUid($battleUid);
        if (!$battle || (int)$battle['quest_session_id'] !== $questSessionId) {
            return null;
        }

        return $battle;
    }

    public static function getActiveBattleUid(int $questSessionId): ?string
    {
        $battle = QuestBattleSession::findActiveByQuestSession($questSessionId);
        if (!$battle) {
            return null;
        }
        return $battle['battle_uid'] ?? null;
    }

    public static function saveBattleState(int $battleId, array $state): void
    {
        QuestBattleSession::updateState($battleId, $state);
    }

    public static function completeBattle(int $battleId, array $result): void
    {
        QuestBattleEvent::create([
            'quest_battle_session_id' => $battleId,
            'type' => 'battle_end',
            'payload_json' => json_encode($result, JSON_UNESCAPED_SLASHES)
        ]);

        QuestBattleSession::updateStatus($battleId, 'completed');
    }
}

