<?php

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\User;

class AuthController
{
    public function showLogin(): void
    {
        if (AuthService::isLoggedIn()) {
            $userId = AuthService::getCurrentUserId();
            $characters = \App\Models\Character::findAllByUser($userId);
            
            if (empty($characters)) {
                // No characters, go to creation
                redirect('/game/character/create');
            } else {
                // Has characters, go to panel
                redirect('/panel');
            }
            return;
        }

        view('auth.auth', ['activeTab' => 'login']);
    }

    public function login(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('/login');
            return;
        }

        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            $_SESSION['error'] = 'Email and password are required';
            redirect('/login');
            return;
        }

        $result = AuthService::login($email, $password);

        if ($result === null) {
            $_SESSION['error'] = 'Invalid credentials';
            redirect('/login');
            return;
        }

        // Check if user has characters
        $characters = \App\Models\Character::findAllByUser($result['user']['id']);
        
        if (empty($characters)) {
            // No characters, go to creation
            redirect('/game/character/create');
        } else {
            // Has characters, go to panel
            redirect('/panel');
        }
    }

    public function showRegister(): void
    {
        if (AuthService::isLoggedIn()) {
            $userId = AuthService::getCurrentUserId();
            $characters = \App\Models\Character::findAllByUser($userId);
            
            if (empty($characters)) {
                // No characters, go to creation
                redirect('/game/character/create');
            } else {
                // Has characters, go to panel
                redirect('/panel');
            }
            return;
        }

        view('auth.auth', ['activeTab' => 'register']);
    }

    public function register(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            redirect('/register');
            return;
        }

        $firstName = trim($_POST['first_name'] ?? '');
        $lastName = trim($_POST['last_name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $passwordConfirm = $_POST['password_confirm'] ?? '';

        // Validations
        $errors = [];

        if (empty($firstName) || strlen($firstName) < 2) {
            $errors[] = 'First name must be at least 2 characters';
        }

        if (empty($lastName) || strlen($lastName) < 2) {
            $errors[] = 'Last name must be at least 2 characters';
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email address';
        }

        if (empty($password) || strlen($password) < 6) {
            $errors[] = 'Password must be at least 6 characters';
        }

        if ($password !== $passwordConfirm) {
            $errors[] = 'Passwords do not match';
        }

        if (User::emailExists($email)) {
            $errors[] = 'Email already registered';
        }

        if (!empty($errors)) {
            $_SESSION['errors'] = $errors;
            redirect('/register');
            return;
        }

        try {
            $result = AuthService::register($firstName, $lastName, $email, $password);
            $_SESSION['success'] = 'Account created successfully! Please login to continue.';
            redirect('/login');
        } catch (\Exception $e) {
            $_SESSION['error'] = 'Error creating account: ' . $e->getMessage();
            redirect('/register');
        }
    }

    public function logout(): void
    {
        AuthService::logout();
        // Always redirect to login after logout
        redirect('/login');
    }
}
