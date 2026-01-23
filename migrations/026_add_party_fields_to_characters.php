<?php

$sql = <<<SQL
ALTER TABLE characters
ADD COLUMN party_active TINYINT(1) NOT NULL DEFAULT 1 AFTER user_id,
ADD COLUMN party_slot INT UNSIGNED NULL AFTER party_active;

UPDATE characters SET party_active = 1 WHERE party_active IS NULL;
SQL;

if (isset($pdo) && $pdo instanceof PDO) {
    $stmtActive = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'party_active'");
    $hasActive = $stmtActive->fetch();
    $stmtActive->closeCursor();
    $stmtSlot = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'party_slot'");
    $hasSlot = $stmtSlot->fetch();
    $stmtSlot->closeCursor();
    if ($hasActive && $hasSlot) {
        $sql = 'SELECT 1';
    }
}

