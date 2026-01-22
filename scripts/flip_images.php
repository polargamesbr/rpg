<?php
/**
 * Espelha (flip horizontal / mirror) todas as imagens de uma pasta.
 * Útil quando o sprite está virado para um lado e precisa do outro (ex.: arqueira
 * virada para direita → virada para esquerda).
 *
 * Suporta PNG e WebP. Sobrescreve os arquivos no lugar.
 *
 * Uso: php flip_images.php <pasta> [--ext=png,webp] [--dry-run]
 *
 * Ex.: php flip_images.php public/assets/entities/archer/animations/atack
 *      php flip_images.php public/assets/entities/archer/animations/atack --dry-run
 */

if (!function_exists('imagecreatefrompng') || !function_exists('imagecreatetruecolor') || !function_exists('imageflip')) {
    die("❌ Erro: GD não disponível ou imageflip() inexistente (requer GD 2.0.1+).\n");
}

$usage = "Uso: php flip_images.php <pasta> [--ext=png,webp] [--dry-run]\n";

$args = array_slice($argv, 1);
$path = null;
$extensions = ['png', 'webp'];
$dryRun = false;

foreach ($args as $a) {
    if (strpos($a, '--ext=') === 0) {
        $extensions = array_map('trim', explode(',', substr($a, 6)));
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

function loadImage($file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $im = null;
    if ($ext === 'png') {
        $im = @imagecreatefrompng($file);
    } elseif ($ext === 'webp' && function_exists('imagecreatefromwebp')) {
        $im = @imagecreatefromwebp($file);
    }
    if (!$im) return null;
    if (!imageistruecolor($im)) {
        $w = imagesx($im);
        $h = imagesy($im);
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

$ok = 0;
$err = 0;

$it = new DirectoryIterator($path);
foreach ($it as $f) {
    if (!$f->isFile()) continue;
    $ext = strtolower($f->getExtension());
    if (!in_array($ext, $extensions)) continue;
    $full = str_replace('\\', '/', $f->getPathname());

    $im = loadImage($full);
    if (!$im) {
        echo "⚠ Não foi possível carregar: $full\n";
        $err++;
        continue;
    }

    if (!imageflip($im, IMG_FLIP_HORIZONTAL)) {
        echo "⚠ imageflip falhou: $full\n";
        imagedestroy($im);
        $err++;
        continue;
    }

    if ($dryRun) {
        imagedestroy($im);
        echo "[dry-run] Flip: " . $f->getFilename() . "\n";
        $ok++;
        continue;
    }

    imagealphablending($im, false);
    imagesavealpha($im, true);
    $res = ($ext === 'png') ? imagepng($im, $full, 9) : (function_exists('imagewebp') ? imagewebp($im, $full, 90) : false);
    imagedestroy($im);
    if ($res) $ok++; else $err++;
}

if ($dryRun) {
    echo "[--dry-run] Nenhuma alteração feita. Total: $ok\n";
} else {
    echo "✅ Espelhados: $ok\n";
    if ($err) echo "❌ Erros: $err\n";
}
echo "Concluído.\n";
