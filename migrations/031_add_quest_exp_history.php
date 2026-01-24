<?php

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS quest_exp_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quest_session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    character_id BIGINT UNSIGNED NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    enemy_id VARCHAR(100) NOT NULL,
    enemy_entity_id VARCHAR(100) DEFAULT NULL,
    enemy_level INT UNSIGNED NOT NULL DEFAULT 1,
    exp_gained INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quest_session_id) REFERENCES quest_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    INDEX idx_quest_session (quest_session_id),
    INDEX idx_character (character_id),
    INDEX idx_user (user_id),
    INDEX idx_quest (quest_id),
    UNIQUE KEY uniq_session_enemy (quest_session_id, enemy_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
