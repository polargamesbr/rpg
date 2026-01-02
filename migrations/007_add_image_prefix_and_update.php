<?php

$sql = <<<SQL
-- Add image_prefix column if it doesn't exist
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS image_prefix VARCHAR(50) NOT NULL DEFAULT 'archer' AFTER color_glow;

-- Update existing classes with their image prefixes
UPDATE classes SET image_prefix = 'swordman' WHERE name = 'Espadachim';
UPDATE classes SET image_prefix = 'archer' WHERE name = 'Arqueiro';
UPDATE classes SET image_prefix = 'mage' WHERE name = 'Mago';
UPDATE classes SET image_prefix = 'thief' WHERE name = 'Ladrão';
UPDATE classes SET image_prefix = 'sacer' WHERE name = 'Acolito';
UPDATE classes SET image_prefix = 'blacksmith' WHERE name = 'Ferreiro';
SQL;

