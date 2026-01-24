<?php
/**
 * Script de Simulação de Ataque - Descriptografar Payload
 * 
 * Este script simula como um atacante poderia descriptografar
 * um payload capturado do Network tab do navegador.
 */

// Configuração
$sessionKey = 'c98658f6172508ff299ab4664207d5ea3e63e0065fa46bd5ee13cb4f70c918a1'; // Chave interceptada
$encryptedPayload = 'iXW03xrRORhEoBwz/wFXG/eFqLrSGUjRT99o4hZAVC/Psxrp5lKqlI3YVWExpz4SxlaIU++okw/NU0e5LN9cgfhX2UZGjMDylC9vNZ17oGkfMANs8eNWTS8gOQrjY6edYGRA4+rD8VfcrSvexaQq5U+nHuq8cs1XDnXJJ54J92QU58IIbv4m/hw8VSO0zLB7JyFEIckoUmaSfweyanVNBCG5ZA0fdDdpZiEwBiLtsEhfmtkxMb6J7KiYkld31WQ/4V2r/Uo8pHKCeqTJelYFA2sJII5hqM+y785xYJmtJY6sM3OjM12v7Ts9K6gKtr/oAQhsYavNHQlIOt0fuTlHT/hF6k9HirE3pfwvtwtcS48=';
$iv = '5sLZnIf+sLnmwfO4VKCexw==';

echo "🔓 SIMULAÇÃO DE ATAQUE - DESCRIPTOGRAFAR PAYLOAD\n";
echo "================================================\n\n";

// Converter chave hex para binário
$encryptionKey = hex2bin($sessionKey);
if ($encryptionKey === false) {
    die("❌ Erro: Chave inválida\n");
}

echo "✅ Chave convertida: " . strlen($encryptionKey) . " bytes\n";

// Decodificar IV e payload
$ivData = base64_decode($iv);
$encryptedData = base64_decode($encryptedPayload);

if ($ivData === false || $encryptedData === false) {
    die("❌ Erro: IV ou payload inválido\n");
}

echo "✅ IV decodificado: " . strlen($ivData) . " bytes\n";
echo "✅ Payload decodificado: " . strlen($encryptedData) . " bytes\n\n";

// Descriptografar usando AES-256-CBC (mesmo método do servidor)
$plaintext = openssl_decrypt($encryptedData, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $ivData);

if ($plaintext === false) {
    die("❌ Erro: Falha ao descriptografar\n");
}

echo "✅ PAYLOAD DESCRIPTOGRAFADO COM SUCESSO!\n\n";
echo "📄 Conteúdo:\n";
echo str_repeat("-", 60) . "\n";
echo $plaintext . "\n";
echo str_repeat("-", 60) . "\n\n";

// Decodificar JSON
$decrypted = json_decode($plaintext, true);
if ($decrypted === null) {
    die("❌ Erro: JSON inválido\n");
}

echo "📊 Dados Estruturados:\n";
echo "Turn: " . ($decrypted['state']['turn'] ?? 'N/A') . "\n";
echo "Phase: " . ($decrypted['state']['phase'] ?? 'N/A') . "\n";
echo "Player HP: " . ($decrypted['state']['player']['hp'] ?? 'N/A') . "\n";
echo "Player SP: " . ($decrypted['state']['player']['sp'] ?? 'N/A') . "\n";
echo "Player Position: (" . ($decrypted['state']['player']['x'] ?? 'N/A') . ", " . ($decrypted['state']['player']['y'] ?? 'N/A') . ")\n";
echo "Enemies: " . count($decrypted['state']['enemies'] ?? []) . "\n\n";

echo "🎯 ATAQUE SIMULADO: Modificando HP para 99999...\n";
$decrypted['state']['player']['hp'] = 99999;
$decrypted['state']['player']['sp'] = 99999;

echo "✅ Payload modificado!\n";
echo "Novo HP: " . $decrypted['state']['player']['hp'] . "\n";
echo "Novo SP: " . $decrypted['state']['player']['sp'] . "\n\n";

echo "⚠️  ATENÇÃO: Para re-enviar este payload modificado, o atacante precisaria:\n";
echo "   1. Re-criptografar com a mesma chave\n";
echo "   2. Gerar novo IV\n";
echo "   3. Enviar para o servidor\n";
echo "   4. MAS o servidor vai REJEITAR porque valida o estado!\n\n";

echo "🛡️  PROTEÇÃO: O CombatValidator no servidor detecta HP/SP inválidos\n";
echo "   e rejeita o estado mesmo que descriptografado corretamente.\n";
