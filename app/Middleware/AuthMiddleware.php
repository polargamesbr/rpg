<?php

namespace App\Middleware;

use App\Services\AuthService;

class AuthMiddleware
{
    public static function handle(): bool
    {
        if (!AuthService::isLoggedIn()) {
            header('Location: /login');
            exit;
        }
        return true;
    }
}

