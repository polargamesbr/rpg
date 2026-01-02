<?php

$sql = <<<SQL
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS image_prefix VARCHAR(50) NOT NULL DEFAULT 'archer' AFTER color_glow;
SQL;

