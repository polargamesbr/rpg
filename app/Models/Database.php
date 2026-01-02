<?php

namespace App\Models;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $connection = null;
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            try {
                $dsn = sprintf(
                    "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                    self::$config['host'],
                    self::$config['port'],
                    self::$config['database'],
                    self::$config['charset']
                );

                self::$connection = new PDO(
                    $dsn,
                    self::$config['username'],
                    self::$config['password'],
                    self::$config['options'] ?? []
                );
            } catch (PDOException $e) {
                throw new \RuntimeException("Database connection failed: " . $e->getMessage());
            }
        }

        return self::$connection;
    }

    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }

    public static function insert(string $table, array $data): int
    {
        $columns = [];
        $placeholders = [];
        $params = [];
        
        foreach ($data as $key => $value) {
            // Handle backticked column names (for reserved words like 'int')
            // Remove backticks from key for placeholder, but keep in column name
            $cleanKey = str_replace('`', '', $key);
            $colName = strpos($key, '`') === 0 ? $key : "`{$key}`";
            $columns[] = $colName;
            $placeholders[] = ":{$cleanKey}";
            $params[$cleanKey] = $value;
        }
        
        $columnsStr = implode(', ', $columns);
        $placeholdersStr = implode(', ', $placeholders);
        
        $sql = "INSERT INTO `{$table}` ({$columnsStr}) VALUES ({$placeholdersStr})";
        self::query($sql, $params);
        
        return (int)self::getConnection()->lastInsertId();
    }

    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $set = [];
        $params = [];
        
        foreach ($data as $key => $value) {
            // Handle backticked column names (for reserved words like 'int')
            $cleanKey = str_replace('`', '', $key);
            $colName = strpos($key, '`') === 0 ? $key : "`{$key}`";
            $set[] = "{$colName} = :{$cleanKey}";
            $params[$cleanKey] = $value;
        }
        
        $setClause = implode(', ', $set);
        
        $sql = "UPDATE `{$table}` SET {$setClause} WHERE {$where}";
        $params = array_merge($params, $whereParams);
        
        $stmt = self::query($sql, $params);
        return $stmt->rowCount();
    }

    public static function delete(string $table, string $where, array $params = []): int
    {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = self::query($sql, $params);
        return $stmt->rowCount();
    }

    public static function beginTransaction(): bool
    {
        return self::getConnection()->beginTransaction();
    }

    public static function commit(): bool
    {
        return self::getConnection()->commit();
    }

    public static function rollback(): bool
    {
        return self::getConnection()->rollBack();
    }
}

