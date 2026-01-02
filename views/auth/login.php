<?php
$title = 'Login - RPG Game';
$showSidebar = false;
$additionalStyles = <<<CSS
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%);
    position: relative;
    overflow: hidden;
    padding: 2rem;
}
.login-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('<?= asset('img/tavern-background.jpg') ?>');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    filter: blur(2px);
}
.login-form {
    position: relative;
    z-index: 10;
    background: rgba(10, 10, 10, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    padding: 3rem;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}
.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-family: 'Inter', sans-serif;
    transition: all 0.3s ease;
}
.form-input:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}
.alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}
.alert-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
}
CSS;
?>

<div class="login-container">
    <div class="login-form">
        <h2 class="text-3xl font-bold text-center mb-8" style="font-family: 'Cinzel', serif;">
            <span class="text-amber-400">Login</span>
        </h2>

        <?php if (isset($_SESSION['error'])): ?>
            <div class="alert alert-error">
                <?= htmlspecialchars($_SESSION['error']) ?>
                <?php unset($_SESSION['error']); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="<?= url('login') ?>" class="space-y-5">
            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Email</label>
                <input type="email" name="email" required class="form-input" placeholder="your@email.com">
            </div>

            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Password</label>
                <input type="password" name="password" required class="form-input" placeholder="••••••••">
            </div>

            <button type="submit" class="w-full premium-btn py-3">
                Login
            </button>
        </form>

        <div class="mt-6 text-center text-stone-500 text-sm">
            Don't have an account? <a href="<?= url('register') ?>" class="text-amber-400 hover:text-amber-300 transition-colors">Register</a>
        </div>
    </div>
</div>
