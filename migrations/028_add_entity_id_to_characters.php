<?php

if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO not available for migration 028.');
}

$stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'entity_id'");
$hasEntity = $stmt->fetch();
$stmt->closeCursor();
if ($hasEntity) {
    $sql = 'SELECT 1';
    return;
}

$pdo->exec("ALTER TABLE characters ADD COLUMN entity_id VARCHAR(50) NOT NULL DEFAULT 'swordsman' AFTER name");
$pdo->exec("UPDATE characters SET entity_id = 'swordsman' WHERE entity_id IS NULL OR entity_id = ''");
$sql = 'SELECT 1';

