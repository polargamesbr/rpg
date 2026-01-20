<?php
/**
 * Script PHP para converter imagens JPG/JPEG/PNG para WebP
 * e atualizar referências no código automaticamente
 * Uso: php convert_to_webp.php [arquivos ou diretórios...] [--quality=85] [--update-refs]
 */

// Verificar se GD está disponível
if (!function_exists('imagecreatefromjpeg') || !function_exists('imagewebp')) {
    die("❌ Erro: Extensão GD não está disponível. Instale php-gd.\n");
}

function convertToWebP($inputPath, $outputPath = null, $quality = 85) {
    /**
     * Converte uma imagem JPG/JPEG/PNG para WebP
     */
    try {
        $pathInfo = pathinfo($inputPath);
        $ext = strtolower($pathInfo['extension'] ?? '');
        
        // Ler imagem baseado na extensão
        $image = null;
        if (in_array($ext, ['jpg', 'jpeg'])) {
            $image = imagecreatefromjpeg($inputPath);
        } elseif ($ext === 'png') {
            $image = @imagecreatefrompng($inputPath);
            if (!$image) {
                return ['success' => false, 'input' => $inputPath, 'error' => 'Não foi possível ler o PNG (corrompido ou formato inválido)'];
            }
            // Converter imagens indexadas (palette) para RGB/RGBA
            if (imageistruecolor($image) === false) {
                // Criar nova imagem truecolor
                $width = imagesx($image);
                $height = imagesy($image);
                $newImage = imagecreatetruecolor($width, $height);
                
                // Preservar transparência
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
                $transparent = imagecolorallocatealpha($newImage, 0, 0, 0, 127);
                imagefill($newImage, 0, 0, $transparent);
                
                // Copiar pixels
                imagecopy($newImage, $image, 0, 0, 0, 0, $width, $height);
                imagedestroy($image);
                $image = $newImage;
            } else {
                // Preservar transparência em imagens truecolor
                imagealphablending($image, false);
                imagesavealpha($image, true);
            }
        } else {
            return [
                'success' => false,
                'input' => $inputPath,
                'error' => 'Formato não suportado (apenas JPG/PNG)'
            ];
        }
        
        if (!$image) {
            return [
                'success' => false,
                'input' => $inputPath,
                'error' => 'Não foi possível ler a imagem'
            ];
        }
        
        // Definir caminho de saída
        if ($outputPath === null) {
            $outputPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.webp';
        }
        
        // Salvar como WebP
        // Qualidade 85 é o padrão recomendado (boa qualidade, boa compressão)
        // Qualidade 80-90 é o sweet spot (quase imperceptível a diferença)
        $result = imagewebp($image, $outputPath, $quality);
        imagedestroy($image);
        
        if (!$result) {
            return [
                'success' => false,
                'input' => $inputPath,
                'error' => 'Não foi possível salvar WebP'
            ];
        }
        
        // Tamanhos
        $originalSize = filesize($inputPath);
        $webpSize = filesize($outputPath);
        $reduction = (($originalSize - $webpSize) / $originalSize) * 100;
        
        return [
            'success' => true,
            'input' => $inputPath,
            'output' => $outputPath,
            'original_size' => $originalSize,
            'webp_size' => $webpSize,
            'reduction' => $reduction
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'input' => $inputPath,
            'error' => $e->getMessage()
        ];
    }
}

function formatSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, 2) . ' ' . $units[$pow];
}

function processFile($filePath, $quality = 85) {
    $pathInfo = pathinfo($filePath);
    
    // Verificar se é JPG/JPEG/PNG
    if (!in_array(strtolower($pathInfo['extension'] ?? ''), ['jpg', 'jpeg', 'png'])) {
        return null;
    }
    
    // Se já existe .webp, pular
    $webpPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '.webp';
    if (file_exists($webpPath)) {
        return ['skipped' => true, 'file' => $filePath];
    }
    
    return convertToWebP($filePath, null, $quality);
}

function processDirectory($directory, $quality = 85, $recursive = true) {
    $results = [];
    $iterator = $recursive 
        ? new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory))
        : new DirectoryIterator($directory);
    
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $ext = strtolower($file->getExtension());
            if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                $result = processFile($file->getPathname(), $quality);
                if ($result) {
                    $results[] = $result;
                }
            }
        }
    }
    
    return $results;
}

function findAndReplaceImageReferences($filePath, $oldImage, $newImage) {
    /**
     * Busca e substitui referências à imagem antiga por WebP no arquivo
     */
    if (!file_exists($filePath)) {
        return false;
    }
    
    $content = file_get_contents($filePath);
    $originalContent = $content;
    
    // Padrões comuns de referência a imagens
    $patterns = [
        // CSS: url('path.jpg') ou url("path.jpg") ou url(path.jpg)
        '/url\([\'"]?' . preg_quote($oldImage, '/') . '[\'"]?\)/i',
        // HTML: src="path.jpg" ou src='path.jpg'
        '/(src=["\'])' . preg_quote($oldImage, '/') . '(["\'])/i',
        // PHP: 'path.jpg' ou "path.jpg"
        '/(["\'])' . preg_quote($oldImage, '/') . '(["\'])/i',
    ];
    
    $replaced = false;
    foreach ($patterns as $pattern) {
        $newContent = preg_replace($pattern, function($matches) use ($oldImage, $newImage) {
            return str_replace($oldImage, $newImage, $matches[0]);
        }, $content);
        
        if ($newContent !== $content) {
            $content = $newContent;
            $replaced = true;
        }
    }
    
    // Se houve mudança, salvar
    if ($replaced && $content !== $originalContent) {
        file_put_contents($filePath, $content);
        return true;
    }
    
    return false;
}

/**
 * Gera variantes de caminho usadas no código a partir do caminho absoluto da imagem.
 * Ex.: public/assets/img/maps/castle-map.png → /public/assets/..., assets/..., img/maps/..., etc.
 */
function getReferenceVariants($absolutePath) {
    $norm = str_replace('\\', '/', $absolutePath);
    $variants = [basename($absolutePath)];
    if (preg_match('#public/assets/(.+)$#', $norm, $m)) {
        $after = $m[1];
        $variants[] = '/public/assets/' . $after;
        $variants[] = 'public/assets/' . $after;
        $variants[] = 'assets/' . $after;
        $variants[] = $after; // para asset('img/...'), asset('icons/...')
    }
    return array_unique($variants);
}

function updateReferencesInCodebase($oldImagePath, $newImagePath, $rootDir = '.') {
    /**
     * Atualiza referências à imagem em todos os arquivos do projeto
     */
    $extensions = ['php', 'css', 'js', 'html', 'json', 'scss', 'less'];
    $updatedFiles = [];
    $relativePaths = getReferenceVariants($oldImagePath);

    $rootReal = $rootDir === '.' ? getcwd() : realpath($rootDir);
    if ($rootReal === false) {
        $rootReal = $rootDir;
    }
    $rootReal = rtrim(str_replace('\\', '/', $rootReal), '/');

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($rootReal, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;

        $ext = strtolower($file->getExtension());
        if (!in_array($ext, $extensions)) continue;

        $filePath = $file->getPathname();
        $filePathNorm = str_replace('\\', '/', $filePath);
        if (strpos($filePathNorm, '/vendor/') !== false ||
            strpos($filePathNorm, '/node_modules/') !== false ||
            strpos($filePathNorm, '/.git/') !== false ||
            basename($filePath) === 'convert_to_webp.php') {
            continue;
        }

        $content = file_get_contents($filePath);
        $originalContent = $content;

        foreach ($relativePaths as $oldPath) {
            $oldPathWebp = preg_replace('/\.(jpg|jpeg|png)(\?v=\d+)?$/i', '.webp$2', $oldPath);
            $quoted = preg_quote($oldPath, '/');
            $replacements = [
                '/url\s*\(\s*[\'"]?' . $quoted . '[\'"]?\s*\)/i' => 'url(\'' . $oldPathWebp . '\')',
                '/(src\s*=\s*["\'])(' . $quoted . ')(["\'])/i' => '${1}' . $oldPathWebp . '${3}',
                '/(["\'])(' . $quoted . ')(["\'])/i' => '${1}' . $oldPathWebp . '${3}',
            ];
            foreach ($replacements as $pattern => $replacement) {
                $content = preg_replace($pattern, $replacement, $content);
            }
        }

        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            $updatedFiles[] = $filePath;
        }
    }

    return $updatedFiles;
}

// Processar argumentos
$args = array_slice($argv, 1);
$quality = 85;
$paths = [];
$updateRefs = false;

// Parse argumentos
for ($i = 0; $i < count($args); $i++) {
    $arg = $args[$i];
    if (strpos($arg, '--quality=') === 0 || strpos($arg, '-q=') === 0) {
        $quality = (int)substr($arg, strpos($arg, '=') + 1);
    } elseif ($arg === '--quality' || $arg === '-q') {
        if (isset($args[$i + 1])) {
            $quality = (int)$args[++$i];
        }
    } elseif ($arg === '--update-refs' || $arg === '-u') {
        $updateRefs = true;
    } elseif (strpos($arg, '--') !== 0 && strpos($arg, '-') !== 0) {
        $paths[] = $arg;
    }
}

if (empty($paths)) {
    echo "Uso: php convert_to_webp.php [arquivos ou diretórios...] [--quality=85] [--update-refs]\n";
    echo "\nOpções:\n";
    echo "  --quality=85    Qualidade WebP (1-100, padrão: 85)\n";
    echo "                  85 = excelente qualidade, boa compressão (recomendado)\n";
    echo "                  80 = muito boa qualidade, melhor compressão\n";
    echo "                  90 = qualidade máxima, compressão menor\n";
    echo "  --update-refs   Atualiza automaticamente referências no código\n";
    echo "\nExemplos:\n";
    echo "  php convert_to_webp.php admin/img/login.jpg --update-refs\n";
    echo "  php convert_to_webp.php img/ --quality=80 --update-refs\n";
    exit(1);
}

// Validar qualidade
if ($quality < 1 || $quality > 100) {
    echo "❌ Erro: Qualidade deve estar entre 1 e 100\n";
    exit(1);
}

// Explicar qualidade
echo "📊 Configuração de qualidade:\n";
echo "   Qualidade: $quality\n";
if ($quality >= 80 && $quality <= 90) {
    echo "   ✅ Excelente! Esta é a faixa ideal (80-90)\n";
    echo "      - Qualidade visual: quase idêntica ao original\n";
    echo "      - Compressão: 50-70% de redução típica\n";
} elseif ($quality < 80) {
    echo "   ⚠️  Qualidade menor, mas melhor compressão\n";
} else {
    echo "   ⚠️  Qualidade máxima, compressão menor\n";
}
echo "\n";

$allResults = [];
$convertedImages = [];

// Processar cada caminho
foreach ($paths as $pathStr) {
    if (!file_exists($pathStr)) {
        echo "⚠️  Aviso: $pathStr não existe, pulando...\n";
        continue;
    }
    
    if (is_file($pathStr)) {
        $result = processFile($pathStr, $quality);
        if ($result) {
            $allResults[] = $result;
            $in = $result['input'] ?? $result['file'] ?? $pathStr;
            if (isset($result['success']) && $result['success']) {
                $convertedImages[] = ['old' => $in, 'new' => $result['output']];
            } elseif (!empty($result['skipped'])) {
                $pi = pathinfo($in);
                $convertedImages[] = ['old' => $in, 'new' => ($pi['dirname'] ?? '') . '/' . ($pi['filename'] ?? '') . '.webp'];
            }
        }
    } elseif (is_dir($pathStr)) {
        $results = processDirectory($pathStr, $quality, true);
        $allResults = array_merge($allResults, $results);
        foreach ($results as $result) {
            $in = $result['input'] ?? $result['file'] ?? null;
            if (!$in) continue;
            if (isset($result['success']) && $result['success']) {
                $convertedImages[] = ['old' => $in, 'new' => $result['output']];
            } elseif (!empty($result['skipped'])) {
                $pi = pathinfo($in);
                $convertedImages[] = ['old' => $in, 'new' => ($pi['dirname'] ?? '') . '/' . ($pi['filename'] ?? '') . '.webp'];
            }
        }
    }
}

// Estatísticas
if (empty($allResults)) {
    echo "ℹ️  Nenhuma imagem processada.\n";
    exit(0);
}

$successful = array_filter($allResults, function($r) { return isset($r['success']) && $r['success']; });
$failed = array_filter($allResults, function($r) { return isset($r['success']) && !$r['success']; });
$skipped = array_filter($allResults, function($r) { return isset($r['skipped']); });

echo "\n" . str_repeat("=", 60) . "\n";
echo "📊 RESUMO DA CONVERSÃO\n";
echo str_repeat("=", 60) . "\n";
echo "✅ Sucesso: " . count($successful) . "\n";
echo "❌ Falhas: " . count($failed) . "\n";
echo "⏭️  Pulados: " . count($skipped) . "\n";

if (!empty($successful)) {
    $totalOriginal = array_sum(array_column($successful, 'original_size'));
    $totalWebp = array_sum(array_column($successful, 'webp_size'));
    $totalReduction = (($totalOriginal - $totalWebp) / $totalOriginal) * 100;
    
    echo "\n📦 Tamanhos:\n";
    echo "   Original: " . formatSize($totalOriginal) . "\n";
    echo "   WebP:     " . formatSize($totalWebp) . "\n";
    echo "   Redução:  " . number_format($totalReduction, 1) . "% (" . formatSize($totalOriginal - $totalWebp) . " economizados)\n";
}

if (!empty($failed)) {
    echo "\n❌ Erros:\n";
    $failedArray = array_values($failed);
    foreach (array_slice($failedArray, 0, 5) as $r) {
        echo "   " . $r['input'] . ": " . ($r['error'] ?? 'Erro desconhecido') . "\n";
    }
    if (count($failed) > 5) {
        echo "   ... e mais " . (count($failed) - 5) . " erros\n";
    }
}

// Atualizar referências no código
if ($updateRefs && !empty($convertedImages)) {
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "🔄 ATUALIZANDO REFERÊNCIAS NO CÓDIGO\n";
    echo str_repeat("=", 60) . "\n";
    
    $allUpdatedFiles = [];
    foreach ($convertedImages as $img) {
        $updated = updateReferencesInCodebase($img['old'], $img['new'], '.');
        $allUpdatedFiles = array_merge($allUpdatedFiles, $updated);
    }
    
    $uniqueFiles = array_unique($allUpdatedFiles);
    if (!empty($uniqueFiles)) {
        echo "✅ " . count($uniqueFiles) . " arquivo(s) atualizado(s):\n";
        foreach (array_slice($uniqueFiles, 0, 10) as $file) {
            echo "   - " . $file . "\n";
        }
        if (count($uniqueFiles) > 10) {
            echo "   ... e mais " . (count($uniqueFiles) - 10) . " arquivos\n";
        }
    } else {
        echo "ℹ️  Nenhuma referência encontrada para atualizar.\n";
    }
}

echo "\n✅ Processo concluído!\n";
