<?php
/**
 * Cropa os frames de animação removendo excesso de "espaço em branco" (transparente
 * ou cor de fundo). O crop é POR ANIMAÇÃO: idle, walk, atack (cada subpasta) tem sua
 * própria caixa, assim cada uma pode ter ponto de origem e tamanho diferentes.
 *
 * 1) Agrupa arquivos por subpasta (idle, walk, atack, ...)
 * 2) Por grupo: união das bboxes e centro médio do personagem (por frame)
 * 3) A região de crop é centrada no centro do personagem, assim o ponto de origem
 *    fica sempre no meio (evita diferença entre idle/walk/atack ao trocar de animação)
 * 4) Redimensiona para altura fixa (padrão 512px); a largura fica proporcional.
 *    Use --height=0 para só cropar, sem redimensionar.
 * 5) Com --output=webp grava .webp em vez do formato de entrada e remove o .png de origem.
 *
 * Uso: php crop_animation_frames.php <pasta> [--height=512] [--output=webp] [--ext=png,webp] [--background=#RRGGBB] [--tolerance=20] [--dry-run]
 *
 * Ex.: php crop_animation_frames.php public/assets/entities/acolyte/animations --output=webp --ext=png
 *      php crop_animation_frames.php public/assets/img/animations/acolyte --height=512 --dry-run
 */

if (!function_exists('imagecreatefrompng') || !function_exists('imagecreatetruecolor')) {
    die("❌ Erro: GD não disponível.\n");
}

$usage = "Uso: php crop_animation_frames.php <pasta> [--height=512] [--output=webp] [--ext=png,webp] [--background=#RRGGBB] [--tolerance=20] [--dry-run]\n";

$args = array_slice($argv, 1);
$path = null;
$targetHeight = 512; // altura final; 0 = só crop, sem redimensionar
$outputWebp = false; // --output=webp: grava .webp e remove .png de origem
$extensions = ['png', 'webp'];
$bgHex = null;
$tolerance = 20;
$dryRun = false;

foreach ($args as $a) {
    if (strpos($a, '--height=') === 0) {
        $targetHeight = (int) substr($a, 9);
    } elseif (strpos($a, '--output=') === 0 && strtolower(substr($a, 9)) === 'webp') {
        $outputWebp = true;
    } elseif (strpos($a, '--ext=') === 0) {
        $extensions = array_map('trim', explode(',', substr($a, 6)));
    } elseif (strpos($a, '--background=') === 0) {
        $bgHex = substr($a, 13);
    } elseif (strpos($a, '--tolerance=') === 0) {
        $tolerance = (int) substr($a, 12);
    } elseif ($a === '--dry-run') {
        $dryRun = true;
    } elseif (strpos($a, '--') !== 0) {
        $path = $a;
    }
}

if (!$path || !is_dir($path)) {
    echo $usage;
    exit(1);
}

$path = rtrim(str_replace('\\', '/', realpath($path)), '/');

// Coletar arquivos e agrupar por animação (primeira subpasta: idle, walk, atack, ...)
$groups = []; // [ 'idle' => [paths], 'walk' => [...], 'atack' => [...] ]
$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS | RecursiveDirectoryIterator::FOLLOW_SYMLINKS),
    RecursiveIteratorIterator::CHILD_FIRST
);
foreach ($it as $f) {
    if (!$f->isFile()) continue;
    $ext = strtolower($f->getExtension());
    if (!in_array($ext, $extensions)) continue;
    $full = str_replace('\\', '/', $f->getPathname());
    $rel = trim(substr($full, strlen($path) + 1), '/');
    $parts = explode('/', $rel);
    $group = (count($parts) > 1) ? $parts[0] : '.';
    if (!isset($groups[$group])) $groups[$group] = [];
    $groups[$group][] = $full;
}

if (empty($groups)) {
    echo "Nenhum arquivo .png ou .webp em: $path\n";
    exit(0);
}

// Cor de fundo opcional (RRGGBB)
$bgR = $bgG = $bgB = null;
if ($bgHex && preg_match('/^#?([0-9A-Fa-f]{6})$/', $bgHex, $m)) {
    $bgR = hexdec(substr($m[1], 0, 2));
    $bgG = hexdec(substr($m[1], 2, 2));
    $bgB = hexdec(substr($m[1], 4, 2));
}

function loadImage($file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $im = null;
    if ($ext === 'png') {
        $im = @imagecreatefrompng($file);
    } elseif ($ext === 'webp' && function_exists('imagecreatefromwebp')) {
        $im = @imagecreatefromwebp($file);
    }
    if (!$im) return null;
    $w = imagesx($im);
    $h = imagesy($im);
    // Converter palette para truecolor para ler alpha/cores de forma uniforme
    if (!imageistruecolor($im)) {
        $t = imagecreatetruecolor($w, $h);
        imagealphablending($t, false);
        imagesavealpha($t, true);
        $trans = imagecolorallocatealpha($t, 0, 0, 0, 127);
        imagefill($t, 0, 0, $trans);
        imagecopy($t, $im, 0, 0, 0, 0, $w, $h);
        imagedestroy($im);
        $im = $t;
    } else {
        imagealphablending($im, false);
        imagesavealpha($im, true);
    }
    return $im;
}

/**
 * Retorna [minX, minY, maxX, maxY] da caixa de conteúdo, ou null se vazia.
 * - Por padrão: pixel "vazio" = alpha >= 108 (GD: 0=opaco, 127=transparente).
 * - Se --background: vazio = RGB dentro da tolerância da cor dada.
 * - Se a bbox cobre >95% da imagem, tenta "cor do canto" como fundo (sprites com fundo sólido).
 */
function getContentBoundingBox($im, $bgR, $bgG, $bgB, $tolerance) {
    $w = imagesx($im);
    $h = imagesy($im);
    $minX = $w; $minY = $h; $maxX = -1; $maxY = -1;
    $useAlpha = ($bgR === null);

    // Amostrar a cada 2 pixels para ser mais rápido em sprites grandes
    $step = ($w > 200 || $h > 200) ? 2 : 1;

    for ($y = 0; $y < $h; $y += $step) {
        for ($x = 0; $x < $w; $x += $step) {
            $c = imagecolorat($im, $x, $y);
            $r = ($c >> 16) & 0xFF;
            $g = ($c >> 8)  & 0xFF;
            $b = $c & 0xFF;
            $a = ($c >> 24) & 0x7F; // GD: 0=opaco, 127=transparente

            $empty = false;
            if ($useAlpha) {
                $empty = ($a >= 108); // bem transparente
            } else {
                $empty = (abs($r - $bgR) <= $tolerance && abs($g - $bgG) <= $tolerance && abs($b - $bgB) <= $tolerance);
            }

            if (!$empty) {
                if ($x < $minX) $minX = $x;
                if ($y < $minY) $minY = $y;
                if ($x > $maxX) $maxX = $x;
                if ($y > $maxY) $maxY = $y;
            }
        }
    }

    if ($maxX < 0) return null;

    // Se a bbox cobre quase a imagem inteira e usamos alpha, tentar cor do canto (fundo sólido)
    $area = ($maxX - $minX + 1) * ($maxY - $minY + 1);
    $total = $w * $h;
    if ($useAlpha && $total > 0 && ($area / $total) > 0.95) {
        $corners = [[0,0], [$w-1,0], [0,$h-1], [$w-1,$h-1]];
        $cr = $cg = $cb = 0;
        foreach ($corners as $pt) {
            $c = imagecolorat($im, $pt[0], $pt[1]);
            $cr += ($c>>16)&0xFF; $cg += ($c>>8)&0xFF; $cb += $c&0xFF;
        }
        $cr = (int)($cr/4); $cg = (int)($cg/4); $cb = (int)($cb/4);
        $minX = $w; $minY = $h; $maxX = -1; $maxY = -1;
        for ($y = 0; $y < $h; $y += $step) {
            for ($x = 0; $x < $w; $x += $step) {
                $c = imagecolorat($im, $x, $y);
                $r = ($c>>16)&0xFF; $g = ($c>>8)&0xFF; $b = $c&0xFF;
                $empty = (abs($r-$cr)<=$tolerance && abs($g-$cg)<=$tolerance && abs($b-$cb)<=$tolerance);
                if (!$empty) {
                    if ($x < $minX) $minX = $x;
                    if ($y < $minY) $minY = $y;
                    if ($x > $maxX) $maxX = $x;
                    if ($y > $maxY) $maxY = $y;
                }
            }
        }
        if ($maxX < 0) return null;
    }

    return [$minX, $minY, $maxX, $maxY];
}

$okTotal = 0;
$errTotal = 0;

foreach ($groups as $anim => $files) {
    // Primeira passada (só esta animação): união das bboxes
    $gMinX = PHP_INT_MAX; $gMinY = PHP_INT_MAX; $gMaxX = -1; $gMaxY = -1;
    $perFile = [];

    foreach ($files as $f) {
        $im = loadImage($f);
        if (!$im) {
            echo "⚠ Não foi possível carregar: $f\n";
            continue;
        }
        $box = getContentBoundingBox($im, $bgR, $bgG, $bgB, $tolerance);
        imagedestroy($im);
        if (!$box) {
            echo "⚠ Sem conteúdo: $f\n";
            continue;
        }
        list($l, $t, $r, $b) = $box;
        $cx = ($l + $r) / 2;
        $cy = ($t + $b) / 2;
        $perFile[$f] = ['box' => $box, 'cx' => $cx, 'cy' => $cy];
        if ($l < $gMinX) $gMinX = $l;
        if ($t < $gMinY) $gMinY = $t;
        if ($r > $gMaxX) $gMaxX = $r;
        if ($b > $gMaxY) $gMaxY = $b;
    }

    if ($gMaxX < 0) {
        echo "[$anim] Nenhuma caixa, pulando.\n";
        continue;
    }

    // Centro do personagem (médio dos centros das bboxes) = ponto de origem no meio do frame
    $avgCx = 0;
    $avgCy = 0;
    foreach ($perFile as $info) {
        $avgCx += $info['cx'];
        $avgCy += $info['cy'];
    }
    $n = count($perFile);
    $avgCx = $n ? $avgCx / $n : ($gMinX + $gMaxX) / 2;
    $avgCy = $n ? $avgCy / $n : ($gMinY + $gMaxY) / 2;

    // Região de crop centrada no personagem, incluindo toda a união
    $halfW = max($avgCx - $gMinX, $gMaxX - $avgCx);
    $halfH = max($avgCy - $gMinY, $gMaxY - $avgCy);
    $cropW = max(1, (int) ceil(2 * $halfW));
    $cropH = max(1, (int) ceil(2 * $halfH));
    $cropX = (int) floor($avgCx - $cropW / 2);
    $cropY = (int) floor($avgCy - $cropH / 2);

    $finalW = $cropW;
    $finalH = $cropH;
    if ($targetHeight > 0 && $cropH > 0) {
        $finalW = (int) round($cropW * $targetHeight / $cropH);
        $finalH = $targetHeight;
    }
    echo "[$anim] crop {$cropW}×{$cropH} centrado no personagem → final {$finalW}×{$finalH} — " . count($perFile) . " arquivos\n";

    if ($dryRun) continue;

    // Segunda passada: crop centrado no personagem (com padding se a região sair da imagem)
    foreach ($files as $f) {
        if (!isset($perFile[$f])) continue;
        $im = loadImage($f);
        if (!$im) { $errTotal++; continue; }
        $w = imagesx($im);
        $h = imagesy($im);

        $srcX1 = max(0, $cropX);
        $srcY1 = max(0, $cropY);
        $srcX2 = min($w, $cropX + $cropW);
        $srcY2 = min($h, $cropY + $cropH);
        $cw = $srcX2 - $srcX1;
        $ch = $srcY2 - $srcY1;

        $dest = imagecreatetruecolor($cropW, $cropH);
        if (!$dest) {
            imagedestroy($im);
            $errTotal++;
            continue;
        }
        imagealphablending($dest, false);
        imagesavealpha($dest, true);
        $trans = imagecolorallocatealpha($dest, 0, 0, 0, 127);
        imagefill($dest, 0, 0, $trans);

        if ($cw > 0 && $ch > 0) {
            $dstX1 = $srcX1 - $cropX;
            $dstY1 = $srcY1 - $cropY;
            imagecopy($dest, $im, $dstX1, $dstY1, $srcX1, $srcY1, $cw, $ch);
        }
        imagedestroy($im);

        $out = $dest;
        if ($targetHeight > 0 && $cropH > 0) {
            $scaled = @imagescale($dest, -1, $targetHeight, IMG_BICUBIC);
            if ($scaled) {
                imagedestroy($dest);
                $out = $scaled;
            }
        }
        imagealphablending($out, false);
        imagesavealpha($out, true);
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if ($outputWebp) {
            $outPath = preg_replace('/\.(png|webp)$/i', '.webp', $f);
            $res = function_exists('imagewebp') ? imagewebp($out, $outPath, 90) : false;
            if ($res && $ext === 'png' && file_exists($f)) {
                @unlink($f);
            }
        } else {
            $res = ($ext === 'png') ? imagepng($out, $f, 9) : (function_exists('imagewebp') ? imagewebp($out, $f, 90) : false);
        }
        imagedestroy($out);
        if ($res) $okTotal++; else $errTotal++;
    }
}

if ($dryRun) {
    echo "[--dry-run] Nenhuma alteração feita.\n";
} else {
    echo "✅ Croppados: $okTotal\n";
    if ($errTotal) echo "❌ Erros: $errTotal\n";
}
echo "Concluído.\n";
