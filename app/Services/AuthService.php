<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private static array $config = [];

    public static function init(array $config): void
    {
        self::$config = $config;
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public static function login(string $email, string $password): ?array
    {
        $user = User::findByEmail($email);
        
        if (!$user || !self::verifyPassword($password, $user['password_hash'])) {
            return null;
        }

        // Create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_uuid'] = $user['uuid'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['logged_in'] = true;

        return [
            'user' => $user,
            'token' => self::generateJWT($user)
        ];
    }

    public static function register(string $firstName, string $lastName, string $email, string $password): array
    {
        $userData = [
            'uuid' => UuidService::generate(),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'password_hash' => self::hashPassword($password)
        ];

        $userId = User::create($userData);
        $user = User::findById($userId);

        // Don't auto login - user must login manually
        // Return user data without creating session

        return [
            'user' => $user,
            'token' => self::generateJWT($user)
        ];
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }

    public static function isLoggedIn(): bool
    {
        if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            return false;
        }

        if (empty($_SESSION['user_id'])) {
            self::logout();
            return false;
        }

        $user = User::findById((int)$_SESSION['user_id']);
        if (!$user) {
            self::logout();
            return false;
        }

        return true;
    }

    public static function getCurrentUser(): ?array
    {
        if (!self::isLoggedIn()) {
            return null;
        }

        return User::findById($_SESSION['user_id']);
    }

    public static function getCurrentUserId(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }

    public static function getCurrentUserUuid(): ?string
    {
        return $_SESSION['user_uuid'] ?? null;
    }

    public static function generateJWT(array $user): string
    {
        $payload = [
            'iss' => self::$config['jwt']['iss'] ?? 'rpg-game',
            'aud' => self::$config['jwt']['aud'] ?? 'rpg-game',
            'iat' => time(),
            'exp' => time() + (self::$config['jwt']['expiration'] ?? 3600),
            'data' => [
                'user_id' => $user['id'],
                'user_uuid' => $user['uuid'],
                'email' => $user['email']
            ]
        ];

        return JWT::encode($payload, self::$config['jwt']['secret'], self::$config['jwt']['algorithm']);
    }

    public static function verifyJWT(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::$config['jwt']['secret'], self::$config['jwt']['algorithm']));
            return (array)$decoded->data;
        } catch (\Exception $e) {
            return null;
        }
    }
}

