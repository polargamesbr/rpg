<?php

if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO not available for migration 029.');
}

$stmt = $pdo->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classes'");
$exists = $stmt->fetch();
$stmt->closeCursor();
if (!$exists) {
    $sql = 'SELECT 1';
    return;
}

$pdo->exec("DROP TABLE IF EXISTS classes");
$sql = 'SELECT 1';

