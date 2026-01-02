<?php
$title = 'RPG Game - Home';
$showSidebar = false;
$isLoggedIn = $isLoggedIn ?? false;
?>

<div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-purple-900/20 to-black">
    <div class="text-center mb-12">
        <h1 class="text-6xl md:text-8xl font-black mb-4" style="font-family: 'Cinzel', serif;">
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600">
                RPG GAME
            </span>
        </h1>
        <p class="text-xl text-stone-400 mb-8">Create your character and embark on an epic adventure</p>
    </div>

    <div class="flex gap-6">
        <?php if ($isLoggedIn): ?>
            <a href="<?= url('character/create') ?>" class="premium-btn text-lg px-8 py-4">
                Create Character
            </a>
            <a href="<?= url('game') ?>" class="premium-btn text-lg px-8 py-4">
                Enter Game
            </a>
        <?php else: ?>
            <a href="<?= url('login') ?>" class="premium-btn text-lg px-8 py-4">
                Login
            </a>
            <a href="<?= url('register') ?>" class="premium-btn text-lg px-8 py-4">
                Register
            </a>
        <?php endif; ?>
    </div>
</div>
