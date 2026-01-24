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

    $options = $dbConfig['options'] ?? [];
    $options[PDO::MYSQL_ATTR_USE_BUFFERED_QUERY] = true;
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);
    
    // Criar database se não existir
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbConfig['database']}`");
    $pdo->exec("USE `{$dbConfig['database']}`");
    
    echo "Conectado ao banco de dados\n";
    
    // Executar migrations
    $migrations = [
        '001_create_users_table.php',
        '002_create_characters_table.php',
        '003_update_users_table.php',
        '014_create_quest_tables.php',
        '015_seed_quest_definitions.php',
        '016_create_quest_battle_tables.php',
        '017_extract_quest_configs_to_files.php',
        '018_remove_config_json_column.php',
        '024_add_attribute_points_to_characters.php',
        '025_drop_party_tables.php',
        '026_add_party_fields_to_characters.php',
        '027_drop_class_id_from_characters.php',
        '028_add_entity_id_to_characters.php',
        '029_drop_classes_table.php',
        '030_create_user_events_table.php',
        '031_add_quest_exp_history.php',
        '032_remove_unused_quest_tables.php'
    ];
    
    foreach ($migrations as $migration) {
        echo "Running: {$migration}\n";
        try {
            if ($migration === '005_insert_classes_data.php') {
                require __DIR__ . '/' . $migration;
                $stmt = $pdo->prepare($sql);
                $stmt->execute();
        } elseif ($migration === '017_extract_quest_configs_to_files.php' || $migration === '018_remove_config_json_column.php' || $migration === '025_drop_party_tables.php' || $migration === '027_drop_class_id_from_characters.php' || $migration === '028_add_entity_id_to_characters.php' || $migration === '029_drop_classes_table.php') {
                // These migrations handle their own DB operations
                require __DIR__ . '/' . $migration;
            } else {
                require __DIR__ . '/' . $migration;
                if (isset($sql) && trim($sql) === 'SELECT 1') {
                    $stmt = $pdo->query($sql);
                    $stmt->fetchAll();
                    $stmt->closeCursor();
                } else {
                    $pdo->exec($sql);
                }
            }
            echo "✓ {$migration} executed successfully\n";
        } catch (PDOException $e) {
            $errorCode = $e->getCode();
            $message = $e->getMessage();
            // Ignore duplicate column / table exists errors to allow re-run
            if (str_contains($message, 'Duplicate column name') || str_contains($message, 'already exists') || str_contains($message, 'Duplicate entry')) {
                echo "↷ {$migration} skipped (already applied)\n";
                continue;
            }
            throw $e;
        }
    }
    
    echo "\n✓ All migrations executed successfully!\n";
    
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
    exit(1);
}

