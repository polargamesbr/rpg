<?php

/**
 * Script para executar migration de remoção do sistema antigo de cartas
 * Execute: php migrations/run_remove_old_battle_system.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load database config
$dbConfig = require __DIR__ . '/../config/database.php';

// Initialize Database
\App\Models\Database::init($dbConfig);

try {
    $pdo = \App\Models\Database::getConnection();
    
    echo "=== Removendo Sistema Antigo de Cartas ===\n\n";
    
    // Check if tables exist first
    $tablesToRemove = ['quest_battle_events', 'quest_battle_sessions'];
    $existingTables = [];
    
    foreach ($tablesToRemove as $table) {
        $result = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($result->rowCount() > 0) {
            $existingTables[] = $table;
        }
    }
    
    if (empty($existingTables)) {
        echo "✅ Nenhuma tabela encontrada. Sistema antigo já foi removido.\n";
        exit(0);
    }
    
    echo "📋 Tabelas encontradas para remover:\n";
    foreach ($existingTables as $table) {
        echo "   - {$table}\n";
    }
    echo "\n";
    
    // Get foreign key constraints
    echo "🔍 Verificando constraints de foreign keys...\n";
    $fkQueries = [];
    
    foreach ($existingTables as $table) {
        $result = $pdo->query("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '{$table}' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        
        while ($row = $result->fetch()) {
            $fkQueries[] = "ALTER TABLE `{$table}` DROP FOREIGN KEY `{$row['CONSTRAINT_NAME']}`";
            echo "   - Encontrada FK: {$row['CONSTRAINT_NAME']} em {$table}\n";
        }
    }
    
    echo "\n";
    
    // Drop foreign keys first
    if (!empty($fkQueries)) {
        echo "🗑️  Removendo foreign keys...\n";
        foreach ($fkQueries as $query) {
            echo "   Executando: {$query}\n";
            $pdo->exec($query);
        }
        echo "   ✅ Foreign keys removidas\n\n";
    }
    
    // Drop tables
    echo "🗑️  Removendo tabelas...\n";
    foreach ($existingTables as $table) {
        echo "   Executando: DROP TABLE IF EXISTS `{$table}`\n";
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
        echo "   ✅ Tabela `{$table}` removida\n";
    }
    
    echo "\n✅ Migration executada com sucesso!\n";
    echo "✅ Sistema antigo de cartas completamente removido.\n";
    
} catch (\Exception $e) {
    echo "\n❌ Erro ao executar migration:\n";
    echo "   {$e->getMessage()}\n";
    exit(1);
}
