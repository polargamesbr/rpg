<?php

if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('PDO not available for migration 025.');
}

$pdo->exec("DROP TABLE IF EXISTS party_members");
$pdo->exec("DROP TABLE IF EXISTS parties");
$sql = 'SELECT 1';

