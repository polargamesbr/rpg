<?php

if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO not available for migration 027.');
}

$stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'class_id'");
$hasClassId = $stmt->fetch();
$stmt->closeCursor();
if (!$hasClassId) {
    $sql = 'SELECT 1';
    return;
}

$stmtFk = $pdo->query("SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'class_id' AND REFERENCED_TABLE_NAME IS NOT NULL");
$fk = $stmtFk->fetch();
$stmtFk->closeCursor();
if ($fk && !empty($fk['CONSTRAINT_NAME'])) {
    $pdo->exec("ALTER TABLE characters DROP FOREIGN KEY {$fk['CONSTRAINT_NAME']}");
}

$stmtIdx = $pdo->query("SHOW INDEX FROM characters WHERE Key_name = 'idx_class_id'");
$idx = $stmtIdx->fetch();
$stmtIdx->closeCursor();
if ($idx) {
    $pdo->exec("ALTER TABLE characters DROP INDEX idx_class_id");
}

$pdo->exec("ALTER TABLE characters DROP COLUMN class_id");
$sql = 'SELECT 1';

