<?php

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS quest_battle_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quest_session_id BIGINT UNSIGNED NOT NULL,
    battle_uid CHAR(36) NOT NULL UNIQUE,
    status ENUM('active', 'completed', 'abandoned') NOT NULL DEFAULT 'active',
    state_json JSON NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (quest_session_id) REFERENCES quest_sessions(id) ON DELETE CASCADE,
    INDEX idx_quest_battle_session (quest_session_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_battle_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quest_battle_session_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    payload_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quest_battle_session_id) REFERENCES quest_battle_sessions(id) ON DELETE CASCADE,
    INDEX idx_battle_event (quest_battle_session_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

