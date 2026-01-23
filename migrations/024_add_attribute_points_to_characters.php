<?php

$sql = <<<SQL
ALTER TABLE characters
ADD COLUMN attribute_points INT UNSIGNED NOT NULL DEFAULT 0 AFTER xp;
SQL;

if (isset($pdo) && $pdo instanceof PDO) {
    $stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'characters' AND COLUMN_NAME = 'attribute_points'");
    $exists = $stmt->fetch();
    $stmt->closeCursor();
    if ($exists) {
        $sql = 'SELECT 1';
    }
}

