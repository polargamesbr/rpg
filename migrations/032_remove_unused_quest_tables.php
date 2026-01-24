<?php

// Migration: Remove unused quest tables
// Remove quest_definitions, quest_battle_sessions, quest_battle_events
// These tables are not used by the current tactical system

$sql = <<<SQL
-- Remove foreign key from quest_sessions to quest_definitions (if exists)
SET @fk_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'quest_sessions' 
      AND REFERENCED_TABLE_NAME = 'quest_definitions'
    LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE quest_sessions DROP FOREIGN KEY ', @fk_name), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove foreign keys from quest_battle tables (if exist)
SET @fk_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'quest_battle_events' 
      AND REFERENCED_TABLE_NAME = 'quest_battle_sessions'
    LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE quest_battle_events DROP FOREIGN KEY ', @fk_name), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'quest_battle_sessions' 
      AND REFERENCED_TABLE_NAME = 'quest_sessions'
    LIMIT 1
);

SET @sql = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE quest_battle_sessions DROP FOREIGN KEY ', @fk_name), 
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop tables
DROP TABLE IF EXISTS quest_battle_events;
DROP TABLE IF EXISTS quest_battle_sessions;
DROP TABLE IF EXISTS quest_definitions;
SQL;
