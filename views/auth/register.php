<?php
$title = 'Register - RPG Game';
$showSidebar = false;
$additionalStyles = <<<CSS
.register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%);
    position: relative;
    overflow: hidden;
    padding: 2rem;
}
.register-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('<?= asset('img/tavern-background.webp') ?>');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    filter: blur(2px);
}
.register-form {
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
.alert-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.alert-list li {
    padding: 0.25rem 0;
}
CSS;
?>

<div class="register-container">
    <div class="register-form">
        <h2 class="text-3xl font-bold text-center mb-8" style="font-family: 'Cinzel', serif;">
            <span class="text-amber-400">Create Account</span>
        </h2>

        <?php if (isset($_SESSION['errors']) && is_array($_SESSION['errors'])): ?>
            <div class="alert alert-error">
                <ul class="alert-list">
                    <?php foreach ($_SESSION['errors'] as $error): ?>
                        <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
                <?php unset($_SESSION['errors']); ?>
            </div>
        <?php endif; ?>

        <?php if (isset($_SESSION['error'])): ?>
            <div class="alert alert-error">
                <?= htmlspecialchars($_SESSION['error']) ?>
                <?php unset($_SESSION['error']); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="<?= url('register') ?>" class="space-y-5">
            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">First Name</label>
                <input type="text" name="first_name" required minlength="2" class="form-input" placeholder="John">
            </div>

            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Last Name</label>
                <input type="text" name="last_name" required minlength="2" class="form-input" placeholder="Doe">
            </div>

            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Email</label>
                <input type="email" name="email" required class="form-input" placeholder="your@email.com">
            </div>

            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Password</label>
                <input type="password" name="password" required minlength="6" class="form-input" placeholder="••••••••">
            </div>

            <div>
                <label class="block text-sm font-medium text-stone-400 mb-2">Confirm Password</label>
                <input type="password" name="password_confirm" required minlength="6" class="form-input" placeholder="••••••••">
            </div>

            <button type="submit" class="w-full premium-btn py-3">
                Register
            </button>
        </form>

        <div class="mt-6 text-center text-stone-500 text-sm">
            Already have an account? <a href="<?= url('login') ?>" class="text-amber-400 hover:text-amber-300 transition-colors">Login</a>
        </div>
    </div>
</div>
