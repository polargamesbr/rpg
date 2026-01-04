<?php

// Migration to update users table: remove username, add first_name and last_name
$sql = <<<SQL
ALTER TABLE users 
DROP INDEX IF EXISTS idx_username,
DROP COLUMN IF EXISTS username,
ADD COLUMN first_name VARCHAR(100) NOT NULL AFTER uuid,
ADD COLUMN last_name VARCHAR(100) NOT NULL AFTER first_name;
SQL;


