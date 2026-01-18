<?php

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS quest_definitions (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Easy',
    image VARCHAR(255) DEFAULT NULL,
    config_json JSON NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_uid CHAR(36) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    character_id BIGINT UNSIGNED NOT NULL,
    quest_id VARCHAR(100) NOT NULL,
    status ENUM('active', 'completed', 'abandoned') NOT NULL DEFAULT 'active',
    snapshot_json JSON NOT NULL,
    state_json JSON NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quest_definitions(id) ON DELETE CASCADE,
    INDEX idx_session_uid (session_uid),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quest_session_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    payload_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quest_session_id) REFERENCES quest_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_type (quest_session_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL;

