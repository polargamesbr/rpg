<?php

/**
 * Migration: Create quest_combat_logs table
 * Stores combat log entries for quest sessions
 */

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS quest_combat_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_uid CHAR(36) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    turn INT NOT NULL,
    phase ENUM('player','enemy') NOT NULL,
    log_key VARCHAR(50) NOT NULL,
    log_params JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_uid (session_uid),
    INDEX idx_user_id (user_id),
    INDEX idx_turn_phase (turn, phase),
    FOREIGN KEY (session_uid) REFERENCES quest_sessions(session_uid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;
