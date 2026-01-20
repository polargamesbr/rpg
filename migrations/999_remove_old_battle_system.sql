-- Migration: Remove Old Battle System (Card Battle System)
-- Date: 2024
-- Description: Remove tables and constraints related to the old card battle system
--              The new tactical system doesn't use these tables anymore

-- Drop foreign key constraints first
ALTER TABLE `quest_battle_events` DROP FOREIGN KEY `quest_battle_events_ibfk_1`;
ALTER TABLE `quest_battle_sessions` DROP FOREIGN KEY `quest_battle_sessions_ibfk_1`;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS `quest_battle_events`;
DROP TABLE IF EXISTS `quest_battle_sessions`;

-- Note: quest_sessions and quest_events tables are kept as they are used by the tactical system
-- Note: quest_definitions table is kept as it contains quest configurations

