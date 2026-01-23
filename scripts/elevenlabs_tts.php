<?php
/**
 * ElevenLabs TTS CLI
 *
 * Uso:
 *   php scripts/elevenlabs_tts.php --voice=VOICE_ID --text="Seu texto" --out="c:\\wamp64\\www\\rpg\\public\\assets\\dialogues\\stormhaven_gate_intro\\step_00.mp3"
 *
 * Opções:
 *   --voice=ID           Voice ID (obrigatório)
 *   --text=STRING        Texto para gerar (obrigatório)
 *   --out=PATH           Caminho do mp3 de saída (obrigatório)
 *   --model=MODEL_ID     Modelo (padrão: eleven_multilingual_v2)
 *   --stability=FLOAT    0.0 - 1.0 (padrão: 0.45)
 *   --similarity=FLOAT   0.0 - 1.0 (padrão: 0.75)
 *   --style=FLOAT        0.0 - 1.0 (padrão: 0.0)
 *   --boost=0|1          Speaker boost (padrão: 1)
 */

function fail(string $message, int $code = 1): void {
    fwrite(STDERR, $message . PHP_EOL);
    exit($code);
}

$opts = getopt('', [
    'voice:',
    'text:',
    'out:',
    'model::',
    'stability::',
    'similarity::',
    'style::',
    'boost::'
]);

$voiceId = $opts['voice'] ?? '';
$text = $opts['text'] ?? '';
$outPath = $opts['out'] ?? '';

if ($voiceId === '' || $text === '' || $outPath === '') {
    fail("Uso: php scripts/elevenlabs_tts.php --voice=VOICE_ID --text=\"Seu texto\" --out=\"C:\\\\caminho\\\\arquivo.mp3\"");
}

$apiKey = getenv('ELEVENLABS_API_KEY');
if (!$apiKey) {
    fail("Variável ELEVENLABS_API_KEY não encontrada. Defina com: setx ELEVENLABS_API_KEY \"SUA_CHAVE\"");
}

$modelId = $opts['model'] ?? 'eleven_multilingual_v2';
$stability = isset($opts['stability']) ? (float) $opts['stability'] : 0.45;
$similarity = isset($opts['similarity']) ? (float) $opts['similarity'] : 0.75;
$style = isset($opts['style']) ? (float) $opts['style'] : 0.0;
$boost = isset($opts['boost']) ? (int) $opts['boost'] : 1;

$payload = [
    'text' => $text,
    'model_id' => $modelId,
    'voice_settings' => [
        'stability' => $stability,
        'similarity_boost' => $similarity,
        'style' => $style,
        'use_speaker_boost' => $boost === 1
    ]
];

$url = "https://api.elevenlabs.io/v1/text-to-speech/" . rawurlencode($voiceId);

$ch = curl_init($url);
if ($ch === false) {
    fail("Falha ao iniciar cURL.");
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: audio/mpeg',
        'xi-api-key: ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false
]);

$audioData = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($audioData === false || $httpCode < 200 || $httpCode >= 300) {
    $details = $curlError ? "cURL: $curlError" : "HTTP: $httpCode";
    $body = is_string($audioData) ? $audioData : '';
    fail("Erro ao gerar áudio ($details). Resposta: $body");
}

$dir = dirname($outPath);
if (!is_dir($dir) && !mkdir($dir, 0777, true)) {
    fail("Não foi possível criar o diretório: $dir");
}

if (file_put_contents($outPath, $audioData) === false) {
    fail("Falha ao salvar o arquivo: $outPath");
}

echo "MP3 gerado com sucesso: $outPath" . PHP_EOL;
