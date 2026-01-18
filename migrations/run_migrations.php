<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Carregar .env
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$dbConfig = require __DIR__ . '/../config/database.php';

try {
    $dsn = sprintf(
        "mysql:host=%s;port=%d;charset=%s",
        $dbConfig['host'],
        $dbConfig['port'],
        $dbConfig['charset']
    );

    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
    
    // Criar database se não existir
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbConfig['database']}`");
    $pdo->exec("USE `{$dbConfig['database']}`");
    
    echo "Conectado ao banco de dados\n";
    
    // Executar migrations
    $migrations = [
        '001_create_users_table.php',
        '002_create_characters_table.php',
        '003_update_users_table.php',
        '004_create_classes_table.php',
        '005_insert_classes_data.php',
        '006_add_image_prefix_column.php',
        '007_add_image_prefix_and_update.php',
        '008_update_classes_to_english.php',
        '014_create_quest_tables.php',
        '015_seed_quest_definitions.php',
        '016_create_quest_battle_tables.php'
    ];
    
    foreach ($migrations as $migration) {
        echo "Running: {$migration}\n";
        if ($migration === '005_insert_classes_data.php') {
            require __DIR__ . '/' . $migration;
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
        } elseif ($migration === '007_add_image_prefix_and_update.php' || $migration === '008_update_classes_to_english.php') {
            // These migrations handle their own DB operations
            require __DIR__ . '/' . $migration;
        } else {
            require __DIR__ . '/' . $migration;
            $pdo->exec($sql);
        }
        echo "✓ {$migration} executed successfully\n";
    }
    
    echo "\n✓ All migrations executed successfully!\n";
    
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
    exit(1);
}

