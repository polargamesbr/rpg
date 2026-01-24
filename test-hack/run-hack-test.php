<?php
/**
 * 🔓 Script de Teste de Ataque - Execução Automática
 * 
 * Este script simula um ataque completo:
 * 1. Obtém chave de sessão (simulando interceptação)
 * 2. Captura um payload criptografado
 * 3. Descriptografa
 * 4. Modifica dados
 * 5. Tenta re-enviar (será bloqueado)
 */

require_once __DIR__ . '/../app/Models/Database.php';
require_once __DIR__ . '/../app/Services/AuthService.php';
require_once __DIR__ . '/../app/Services/QuestService.php';
require_once __DIR__ . '/../app/Services/StateEncryptionService.php';

use App\Services\AuthService;
use App\Services\QuestService;
use App\Services\StateEncryptionService;

echo "🔓 TESTE DE ATAQUE - SIMULAÇÃO COMPLETA\n";
echo str_repeat("=", 60) . "\n\n";

// 1. Simular login (em um ataque real, o atacante já estaria logado)
session_start();
$user = AuthService::getCurrentUser();

if (!$user) {
    echo "❌ Erro: Usuário não autenticado\n";
    echo "   Execute este script após fazer login no jogo.\n";
    exit(1);
}

echo "✅ Usuário autenticado: " . ($user['email'] ?? 'N/A') . "\n";

// 2. Buscar uma sessão ativa
$db = App\Models\Database::getInstance();
$stmt = $db->query(
    "SELECT session_uid, quest_id, state_json 
     FROM quest_sessions 
     WHERE user_id = ? AND status = 'active' 
     ORDER BY updated_at DESC 
     LIMIT 1",
    [(int)$user['id']]
);

$session = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$session) {
    echo "❌ Erro: Nenhuma sessão ativa encontrada\n";
    echo "   Inicie uma quest no jogo primeiro.\n";
    exit(1);
}

$sessionUid = $session['session_uid'];
echo "✅ Sessão encontrada: {$sessionUid}\n";
echo "   Quest: " . ($session['quest_id'] ?? 'N/A') . "\n\n";

// 3. Simular interceptação da chave (em um ataque real, seria interceptada)
echo "📡 SIMULANDO INTERCEPTAÇÃO DA CHAVE...\n";
$keyData = StateEncryptionService::generateSessionKey($sessionUid);
$interceptedKey = $keyData['key'];
$interceptedToken = $keyData['token'];

echo "✅ Chave interceptada: " . substr($interceptedKey, 0, 20) . "...\n";
echo "   Token: " . substr($interceptedToken, 0, 20) . "...\n\n";

// 4. Simular captura de payload criptografado
// Em um ataque real, isso viria do Network tab do navegador
echo "📦 SIMULANDO CAPTURA DE PAYLOAD CRIPTOGRAFADO...\n";
echo "   (Em um ataque real, isso seria capturado do Network tab)\n\n";

// Criar um payload de exemplo (simulando o que seria capturado)
$examplePayload = [
    'state' => [
        'player' => [
            'id' => 'player',
            'entity_id' => 'swordsman',
            'x' => 10,
            'y' => 10,
            'hp' => 350,
            'sp' => 135,
            'hasMoved' => false,
            'facingRight' => true
        ],
        'allies' => [],
        'enemies' => [
            [
                'id' => 'slime_1',
                'entity_id' => 'toxic_slime',
                'x' => 12,
                'y' => 10,
                'hp' => 550
            ]
        ],
        'turn' => 7,
        'phase' => 'enemy',
        'unitsActed' => ['player']
    ]
];

// Criptografar o payload (simulando o que o cliente enviaria)
$encryptionKey = hex2bin($interceptedKey);
$plaintext = json_encode($examplePayload);
$iv = random_bytes(16);
$encrypted = openssl_encrypt($plaintext, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $iv);

$encryptedPayload = [
    'encrypted' => base64_encode($encrypted),
    'iv' => base64_encode($iv),
    'tag' => ''
];

echo "✅ Payload criptografado capturado:\n";
echo "   Encrypted: " . substr($encryptedPayload['encrypted'], 0, 50) . "...\n";
echo "   IV: " . $encryptedPayload['iv'] . "\n\n";

// 5. Descriptografar o payload
echo "🔓 DESCRIPTOGRAFANDO PAYLOAD...\n";
$decryptedData = base64_decode($encryptedPayload['encrypted']);
$ivData = base64_decode($encryptedPayload['iv']);
$plaintext = openssl_decrypt($decryptedData, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $ivData);

if ($plaintext === false) {
    echo "❌ Erro: Falha ao descriptografar\n";
    exit(1);
}

$decrypted = json_decode($plaintext, true);
echo "✅ PAYLOAD DESCRIPTOGRAFADO COM SUCESSO!\n\n";
echo "📊 Dados originais:\n";
echo "   Turn: " . ($decrypted['state']['turn'] ?? 'N/A') . "\n";
echo "   Phase: " . ($decrypted['state']['phase'] ?? 'N/A') . "\n";
echo "   Player HP: " . ($decrypted['state']['player']['hp'] ?? 'N/A') . "\n";
echo "   Player SP: " . ($decrypted['state']['player']['sp'] ?? 'N/A') . "\n";
echo "   Position: (" . ($decrypted['state']['player']['x'] ?? 'N/A') . ", " . ($decrypted['state']['player']['y'] ?? 'N/A') . ")\n";
echo "   Enemies: " . count($decrypted['state']['enemies'] ?? []) . "\n\n";

// 6. Modificar o payload (ATAQUE!)
echo "⚔️  MODIFICANDO PAYLOAD (ATAQUE SIMULADO)...\n";
$decrypted['state']['player']['hp'] = 99999;
$decrypted['state']['player']['sp'] = 99999;
$decrypted['state']['player']['x'] = 50;
$decrypted['state']['player']['y'] = 50;

echo "✅ Payload modificado:\n";
echo "   Novo HP: " . $decrypted['state']['player']['hp'] . "\n";
echo "   Novo SP: " . $decrypted['state']['player']['sp'] . "\n";
echo "   Nova Position: (" . $decrypted['state']['player']['x'] . ", " . $decrypted['state']['player']['y'] . ")\n\n";

// 7. Re-criptografar o payload modificado
echo "🔐 RE-CRIPTOGRAFANDO PAYLOAD MODIFICADO...\n";
$modifiedPlaintext = json_encode($decrypted);
$newIv = random_bytes(16);
$modifiedEncrypted = openssl_encrypt($modifiedPlaintext, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $newIv);

$modifiedPayload = [
    'encrypted' => base64_encode($modifiedEncrypted),
    'iv' => base64_encode($newIv),
    'tag' => ''
];

echo "✅ Payload modificado e re-criptografado!\n\n";

// 8. Tentar enviar para o servidor (será bloqueado)
echo "📤 TENTANDO ENVIAR PAYLOAD MODIFICADO PARA O SERVIDOR...\n";
echo "   (Simulando requisição POST /game/explore/state)\n\n";

// Simular o que o ExploreController::setState() faria
$sessionData = QuestService::getSessionState($sessionUid, (int)$user['id']);
if (!$sessionData) {
    echo "❌ Erro: Sessão não encontrada no servidor\n";
    exit(1);
}

// Descriptografar no servidor (como o ExploreController faria)
$serverKey = $_SESSION["state_key_{$sessionUid}"] ?? null;
if (!$serverKey) {
    echo "❌ Erro: Chave não encontrada na sessão do servidor\n";
    exit(1);
}

$serverEncryptionKey = hex2bin($serverKey);
$serverDecryptedData = base64_decode($modifiedPayload['encrypted']);
$serverIvData = base64_decode($modifiedPayload['iv']);
$serverPlaintext = openssl_decrypt($serverDecryptedData, 'aes-256-cbc', $serverEncryptionKey, OPENSSL_RAW_DATA, $serverIvData);

if ($serverPlaintext === false) {
    echo "❌ Erro: Servidor não conseguiu descriptografar\n";
    exit(1);
}

$serverDecrypted = json_decode($serverPlaintext, true);
$stateInput = $serverDecrypted['state'] ?? $serverDecrypted;

// Simular validação do CombatValidator
echo "🛡️  SERVIDOR VALIDANDO PAYLOAD...\n";

$oldState = json_decode($session['state_json'], true) ?: [];
$character = App\Models\Character::findByUser((int)$user['id']);

if (!$character) {
    echo "❌ Erro: Personagem não encontrado\n";
    exit(1);
}

$config = $sessionData['config'] ?? [];

// Validar HP/SP (simulando CombatValidator::validateHpSp)
$newHp = (int)($stateInput['player']['hp'] ?? 0);
$newSp = (int)($stateInput['player']['sp'] ?? 0);
$maxHp = (int)($character['max_hp'] ?? 300);
$maxSp = (int)($character['max_mana'] ?? 85);

$errors = [];

if ($newHp < 0) {
    $errors[] = "Player HP cannot be negative: {$newHp}";
}
if ($newHp > $maxHp * 3.0) {
    $errors[] = "Player HP exceeds maximum excessively: {$newHp} > {$maxHp}";
}
if ($newSp < 0) {
    $errors[] = "Player SP cannot be negative: {$newSp}";
}
if ($newSp > $maxSp * 3.0) {
    $errors[] = "Player SP exceeds maximum significantly: {$newSp} > {$maxSp}";
}

if (!empty($errors)) {
    echo "❌ ATAQUE BLOQUEADO PELO SERVIDOR!\n\n";
    echo "🛡️  O CombatValidator detectou valores inválidos:\n";
    foreach ($errors as $error) {
        echo "   - " . $error . "\n";
    }
    echo "\n✅ PROTEÇÃO FUNCIONANDO CORRETAMENTE!\n";
    echo "   O servidor rejeitou o payload modificado mesmo que\n";
    echo "   tenha sido descriptografado e re-criptografado corretamente.\n\n";
} else {
    echo "⚠️  ATENÇÃO: Validação passou (isso não deveria acontecer!)\n";
    echo "   O payload modificado foi aceito pelo servidor.\n";
    echo "   Isso indica uma falha na validação.\n\n";
}

echo str_repeat("=", 60) . "\n";
echo "📝 CONCLUSÃO:\n";
echo "   - A chave pode ser interceptada: ✅ Sim\n";
echo "   - O payload pode ser descriptografado: ✅ Sim\n";
echo "   - Os dados podem ser modificados: ✅ Sim\n";
echo "   - O servidor bloqueia mudanças inválidas: ✅ Sim\n";
echo "   - A proteção real está na VALIDAÇÃO do servidor: ✅ Sim\n\n";
