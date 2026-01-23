<?php
/**
 * Lista vozes do ElevenLabs (CLI)
 *
 * Uso:
 *   php scripts/elevenlabs_list_voices.php
 */

function fail(string $message, int $code = 1): void {
    fwrite(STDERR, $message . PHP_EOL);
    exit($code);
}

$apiKey = getenv('ELEVENLABS_API_KEY');
if (!$apiKey) {
    fail("Variável ELEVENLABS_API_KEY não encontrada. Defina com: setx ELEVENLABS_API_KEY \"SUA_CHAVE\"");
}

$url = "https://api.elevenlabs.io/v1/voices";
$ch = curl_init($url);
if ($ch === false) {
    fail("Falha ao iniciar cURL.");
}

curl_setopt_array($ch, [
    CURLOPT_HTTPGET => true,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'xi-api-key: ' . $apiKey
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false
]);

$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($resp === false || $httpCode < 200 || $httpCode >= 300) {
    $details = $curlError ? "cURL: $curlError" : "HTTP: $httpCode";
    $body = is_string($resp) ? $resp : '';
    fail("Erro ao listar vozes ($details). Resposta: $body");
}

$data = json_decode($resp, true);
if (!is_array($data) || !isset($data['voices'])) {
    fail("Resposta inesperada da API.");
}

echo "=== TODAS AS VOZES ===" . PHP_EOL . PHP_EOL;

foreach ($data['voices'] as $voice) {
    $id = $voice['voice_id'] ?? '';
    $name = $voice['name'] ?? '';
    $category = $voice['category'] ?? '';
    $labels = $voice['labels'] ?? [];
    $description = $voice['description'] ?? '';
    
    $languages = [];
    if (isset($labels['accent'])) {
        $languages[] = "Accent: " . $labels['accent'];
    }
    if (isset($labels['age'])) {
        $languages[] = "Age: " . $labels['age'];
    }
    if (isset($labels['gender'])) {
        $languages[] = "Gender: " . $labels['gender'];
    }
    if (isset($labels['use case'])) {
        $languages[] = "Use: " . $labels['use case'];
    }
    
    $langStr = !empty($languages) ? ' | ' . implode(', ', $languages) : '';
    
    echo "{$name} | {$id} | {$category}{$langStr}" . PHP_EOL;
    if ($description) {
        echo "  └─ {$description}" . PHP_EOL;
    }
}

echo PHP_EOL . "=== BUSCANDO VOZES COM PT-BR ===" . PHP_EOL;
$found = false;
foreach ($data['voices'] as $voice) {
    $name = $voice['name'] ?? '';
    $id = $voice['voice_id'] ?? '';
    $labels = $voice['labels'] ?? [];
    $description = strtolower($voice['description'] ?? '');
    
    $hasBR = false;
    if (isset($labels['accent']) && (stripos($labels['accent'], 'brazil') !== false || stripos($labels['accent'], 'brasil') !== false || stripos($labels['accent'], 'pt-br') !== false)) {
        $hasBR = true;
    }
    if (stripos($description, 'brazil') !== false || stripos($description, 'brasil') !== false || stripos($description, 'português') !== false || stripos($description, 'portuguese') !== false) {
        $hasBR = true;
    }
    
    if ($hasBR) {
        $found = true;
        echo "✓ {$name} | {$id}" . PHP_EOL;
    }
}

if (!$found) {
    echo "Nenhuma voz específica PT-BR encontrada. As vozes multilíngues podem falar português." . PHP_EOL;
}
