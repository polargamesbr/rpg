<?php

namespace App\Controllers;

use App\Services\AuthService;

class HomeController
{
    public function index(): void
    {
        // If logged in, check if has character
        if (AuthService::isLoggedIn()) {
            $userId = AuthService::getCurrentUserId();
            $character = \App\Models\Character::findByUser($userId);
            
            if ($character) {
                redirect('/city-hub');
            } else {
                redirect('/character/create');
            }
            return;
        }
        
        // Show homepage with login/register options
        view('home.index', [
            'isLoggedIn' => false
        ]);
    }

    public function game(): void
    {
        // Verificar autenticação
        if (!AuthService::isLoggedIn()) {
            redirect('/login');
            return;
        }
        
        $userId = AuthService::getCurrentUserId();
        $character = \App\Models\Character::findByUser($userId);
        
        if ($character) {
            redirect('/city-hub');
        } else {
            redirect('/character/create');
        }
    }
}

