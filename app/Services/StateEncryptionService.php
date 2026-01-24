<?php

namespace App\Services;

class StateEncryptionService
{
    /**
     * Gera uma chave de sessão para criptografia
     * IMPORTANTE: A chave é enviada ao cliente UMA VEZ, em texto plano
     * O cliente usa essa chave para criptografar payloads
     * A segurança vem da validação do estado esperado no servidor, não da ocultação da chave
     * @param string $sessionUid
     * @return array ['token' => string, 'key' => string]
     */
    public static function generateSessionKey(string $sessionUid): array
    {
        // Gerar chave aleatória de 32 bytes para esta sessão
        $sessionKey = "state_key_{$sessionUid}";
        if (!isset($_SESSION[$sessionKey])) {
            $_SESSION[$sessionKey] = bin2hex(random_bytes(32));
        }
        $key = $_SESSION[$sessionKey];
        
        // Gerar token identificador
        $token = bin2hex(random_bytes(16));
        $_SESSION["state_token_{$sessionUid}"] = $token;
        
        // Enviar chave diretamente (sem criptografia adicional)
        // A segurança vem da validação do estado no servidor, não da ocultação da chave
        return [
            'token' => $token,
            'key' => $key
        ];
    }

    /**
     * Valida token e retorna se a sessão tem chave válida
     * @param string $sessionUid
     * @param string $token
     * @return bool
     */
    public static function validateToken(string $sessionUid, string $token): bool
    {
        $storedToken = $_SESSION["state_token_{$sessionUid}"] ?? null;
        return $storedToken === $token && self::getSessionKey($sessionUid) !== null;
    }

    /**
     * Obtém a chave da sessão
     * @param string $sessionUid
     * @return string|null
     */
    private static function getSessionKey(string $sessionUid): ?string
    {
        $sessionKey = "state_key_{$sessionUid}";
        return $_SESSION[$sessionKey] ?? null;
    }

    /**
     * Verifica se criptografia está habilitada (baseado em DEBUG_MODE)
     * @return bool True se deve criptografar (DEBUG_MODE=false), False se não deve (DEBUG_MODE=true)
     */
    public static function shouldEncrypt(): bool
    {
        $appConfig = require __DIR__ . '/../../config/app.php';
        $debugMode = $appConfig['debug_mode'] ?? false;
        return !$debugMode; // Criptografar quando DEBUG_MODE=false
    }

    /**
     * Gera ou obtém chave de criptografia baseada em user_id
     * Usado para APIs que não têm sessionUid (entities, skills)
     * @param int $userId
     * @return string
     */
    public static function getUserEncryptionKey(int $userId): string
    {
        $sessionKey = "api_key_{$userId}";
        if (!isset($_SESSION[$sessionKey])) {
            $_SESSION[$sessionKey] = bin2hex(random_bytes(32));
        }
        return $_SESSION[$sessionKey];
    }

    /**
     * Criptografa dados para resposta de API
     * @param array $data
     * @param string $key Chave hex (64 caracteres)
     * @return array ['encrypted' => true, 'data' => string, 'iv' => string]
     */
    public static function encryptApiResponse(array $data, string $key): array
    {
        $plaintext = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $encryptionKey = hex2bin($key);
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($plaintext, 'aes-256-cbc', $encryptionKey, OPENSSL_RAW_DATA, $iv);
        
        if ($encrypted === false) {
            return $data; // Fallback: retornar sem criptografia
        }
        
        return [
            'encrypted' => true,
            'data' => base64_encode($encrypted),
            'iv' => base64_encode($iv)
        ];
    }

    /**
     * Gera HMAC do payload
     * @param array $payload
     * @param string $sessionUid
     * @return string
     */
    public static function generateHmac(array $payload, string $sessionUid): string
    {
        $key = self::getSessionKey($sessionUid);
        if (!$key) {
            throw new \RuntimeException('Session key not found');
        }
        
        $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return hash_hmac('sha256', $payloadJson, $key);
    }

    /**
     * Valida HMAC do payload
     * @param array $payload
     * @param string $hmac
     * @param string $sessionUid
     * @return bool
     */
    public static function validateHmac(array $payload, string $hmac, string $sessionUid): bool
    {
        $key = self::getSessionKey($sessionUid);
        if (!$key) {
            return false;
        }
        
        $expectedHmac = self::generateHmac($payload, $sessionUid);
        return hash_equals($expectedHmac, $hmac);
    }

    /**
     * Criptografa payload usando AES-256-GCM
     * @param array $payload
     * @param string $sessionUid
     * @return array ['encrypted' => string, 'iv' => string, 'tag' => string]
     */
    public static function encryptPayload(array $payload, string $sessionUid): array
    {
        $key = self::getSessionKey($sessionUid);
        if (!$key) {
            throw new \RuntimeException('Session key not found');
        }
        
        // Usar apenas 32 bytes da chave (AES-256 precisa de 32 bytes)
        $encryptionKey = substr(hash('sha256', $key), 0, 32);
        
        $plaintext = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $iv = random_bytes(16); // IV de 16 bytes para AES
        $tag = '';
        
        $encrypted = openssl_encrypt($plaintext, 'aes-256-gcm', $encryptionKey, OPENSSL_RAW_DATA, $iv, $tag);
        
        if ($encrypted === false) {
            throw new \RuntimeException('Encryption failed');
        }
        
        return [
            'encrypted' => base64_encode($encrypted),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag)
        ];
    }

    /**
     * Descriptografa payload
     * @param string $encrypted
     * @param string $iv
     * @param string $tag
     * @param string $sessionUid
     * @return array|null
     */
    public static function decryptPayload(string $encrypted, string $iv, string $tag, string $sessionUid): ?array
    {
        $key = self::getSessionKey($sessionUid);
        if (!$key) {
            return null;
        }
        
        $encryptionKey = substr(hash('sha256', $key), 0, 32);
        $encryptedData = base64_decode($encrypted);
        $ivData = base64_decode($iv);
        $tagData = base64_decode($tag);
        
        $plaintext = openssl_decrypt($encryptedData, 'aes-256-gcm', $encryptionKey, OPENSSL_RAW_DATA, $ivData, $tagData);
        
        if ($plaintext === false) {
            return null;
        }
        
        $decoded = json_decode($plaintext, true);
        return is_array($decoded) ? $decoded : null;
    }
}
