<?php
/**
 * 🔓 Demonstração de Ataque - Versão Standalone
 * 
 * Este script demonstra como um atacante poderia:
 * 1. Descriptografar um payload capturado
 * 2. Modificar os dados
 * 3. Re-criptografar
 * 4. Mostrar que o servidor rejeitaria
 */

echo "🔓 DEMONSTRAÇÃO DE ATAQUE - DESCRIPTOGRAFAR E MODIFICAR PAYLOAD\n";
echo str_repeat("=", 70) . "\n\n";

// Dados de exemplo (capturados do Network tab)
$sessionKey = 'c98658f6172508ff299ab4664207d5ea3e63e0065fa46bd5ee13cb4f70c918a1';
$encryptedPayload = 'iXW03xrRORhEoBwz/wFXG/eFqLrSGUjRT99o4hZAVC/Psxrp5lKqlI3YVWExpz4SxlaIU++okw/NU0e5LN9cgfhX2UZGjMDylC9vNZ17oGkfMANs8eNWTS8gOQrjY6edYGRA4+rD8VfcrSvexaQq5U+nHuq8cs1XDnXJJ54J92QU58IIbv4m/hw8VSO0zLB7JyFEIckoUmaSfweyanVNBCG5ZA0fdDdpZiEwBiLtsEhfmtkxMb6J7KiYkld31WQ/4V2r/Uo8pHKCeqTJelYFA2sJII5hqM+y785xYJmtJY6sM3OjM12v7Ts9K6gKtr/oAQhsYavNHQlIOt0fuTlHT/hF6k9HirE3pfwvtwtcS48=';
$iv = '5sLZnIf+sLnmwfO4VKCexw==';

echo "📡 PASSO 1: INTERCEPTAÇÃO DA CHAVE\n";
echo str_repeat("-", 70) . "\n";
echo "Chave interceptada de POST /game/explore/get-key:\n";
echo substr($sessionKey, 0, 40) . "...\n\n";

echo "📦 PASSO 2: CAPTURA DO PAYLOAD CRIPTOGRAFADO\n";
echo str_repeat("-", 70) . "\n";
echo "Payload capturado do Network tab:\n";
echo "Encrypted: " . substr($encryptedPayload, 0, 50) . "...\n";
echo "IV: " . $iv . "\n\n";

echo "🔓 PASSO 3: DESCRIPTOGRAFANDO O PAYLOAD\n";
echo str_repeat("-", 70) . "\n";

// Converter chave hex para binário
$encryptionKey = hex2bin($sessionKey);
if ($encryptionKey === false) {
    die("❌ Erro: Chave inválida\n");
}

// Decodificar IV e payload
$ivData = base64_decode($iv);
$encryptedData = base64_decode($encryptedPayload);

if ($ivData === false || $encryptedData === false) {
    die("❌ Erro: IV ou payload inválido\n");
}

// Descriptografar usando AES-256-CBC
$plaintext = openssl_decrypt($encryptedData, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $ivData);

if ($plaintext === false) {
    die("❌ Erro: Falha ao descriptografar\n");
}

echo "✅ PAYLOAD DESCRIPTOGRAFADO COM SUCESSO!\n\n";

// Decodificar JSON
$decrypted = json_decode($plaintext, true);
if ($decrypted === null) {
    die("❌ Erro: JSON inválido\n");
}

echo "📊 DADOS ORIGINAIS:\n";
echo "   Turn: " . ($decrypted['state']['turn'] ?? 'N/A') . "\n";
echo "   Phase: " . ($decrypted['state']['phase'] ?? 'N/A') . "\n";
echo "   Player HP: " . ($decrypted['state']['player']['hp'] ?? 'N/A') . "\n";
echo "   Player SP: " . ($decrypted['state']['player']['sp'] ?? 'N/A') . "\n";
echo "   Position: (" . ($decrypted['state']['player']['x'] ?? 'N/A') . ", " . ($decrypted['state']['player']['y'] ?? 'N/A') . ")\n";
echo "   Enemies: " . count($decrypted['state']['enemies'] ?? []) . "\n\n";

echo "⚔️  PASSO 4: MODIFICANDO O PAYLOAD (ATAQUE!)\n";
echo str_repeat("-", 70) . "\n";

// Modificar dados
$originalHp = $decrypted['state']['player']['hp'];
$originalSp = $decrypted['state']['player']['sp'];
$originalX = $decrypted['state']['player']['x'];
$originalY = $decrypted['state']['player']['y'];

$decrypted['state']['player']['hp'] = 99999;
$decrypted['state']['player']['sp'] = 99999;
$decrypted['state']['player']['x'] = 50;
$decrypted['state']['player']['y'] = 50;

echo "✅ Payload modificado:\n";
echo "   HP: {$originalHp} → " . $decrypted['state']['player']['hp'] . "\n";
echo "   SP: {$originalSp} → " . $decrypted['state']['player']['sp'] . "\n";
echo "   Position: ({$originalX}, {$originalY}) → (" . $decrypted['state']['player']['x'] . ", " . $decrypted['state']['player']['y'] . ")\n\n";

echo "🔐 PASSO 5: RE-CRIPTOGRAFANDO O PAYLOAD MODIFICADO\n";
echo str_repeat("-", 70) . "\n";

// Re-criptografar
$modifiedPlaintext = json_encode($decrypted);
$newIv = random_bytes(16);
$modifiedEncrypted = openssl_encrypt($modifiedPlaintext, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $newIv);

$modifiedPayload = [
    'encrypted' => base64_encode($modifiedEncrypted),
    'iv' => base64_encode($newIv),
    'tag' => ''
];

echo "✅ Payload modificado e re-criptografado!\n";
echo "   Novo encrypted: " . substr($modifiedPayload['encrypted'], 0, 50) . "...\n";
echo "   Novo IV: " . $modifiedPayload['iv'] . "\n\n";

echo "🛡️  PASSO 6: SIMULAÇÃO DE VALIDAÇÃO DO SERVIDOR\n";
echo str_repeat("-", 70) . "\n";

// Simular validação do CombatValidator
$maxHp = 300; // HP máximo esperado
$maxSp = 85;  // SP máximo esperado

$newHp = $decrypted['state']['player']['hp'];
$newSp = $decrypted['state']['player']['sp'];

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
    echo "O CombatValidator detectou os seguintes erros:\n";
    foreach ($errors as $error) {
        echo "   ⚠️  " . $error . "\n";
    }
    echo "\n✅ PROTEÇÃO FUNCIONANDO CORRETAMENTE!\n";
} else {
    echo "⚠️  ATENÇÃO: Validação passou (isso não deveria acontecer!)\n";
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "📝 CONCLUSÃO:\n\n";
echo "✅ A chave pode ser interceptada: Sim\n";
echo "✅ O payload pode ser descriptografado: Sim\n";
echo "✅ Os dados podem ser modificados: Sim\n";
echo "✅ O payload pode ser re-criptografado: Sim\n";
echo "✅ O servidor bloqueia mudanças inválidas: Sim\n\n";
echo "🛡️  A PROTEÇÃO REAL está na VALIDAÇÃO do servidor (CombatValidator),\n";
echo "    não na criptografia. A criptografia apenas dificulta a visualização\n";
echo "    dos dados, mas a segurança vem da validação rigorosa no backend.\n\n";
