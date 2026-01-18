<?php
$title = 'Welcome - RPG Game';
$showSidebar = false;
$activeTab = $activeTab ?? 'login';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --gold-primary: #d4af37;
            --gold-secondary: #f2d16b;
            --gold-dark: #8a6d3b;
            --cyan-primary: #06b6d4;
            --bg-dark: #050508;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            min-height: 100vh;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* ===== BACKGROUND LAYER ===== */
        .auth-container {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            overflow: hidden;
        }

        /* Background Image */
        .auth-bg-image {
            position: absolute;
            inset: 0;
            background-image: url('<?= asset('img/tavern-background.jpg') ?>');
            background-size: cover;
            background-position: center;
            opacity: 0.12;
            filter: blur(3px) saturate(0.8);
        }

        /* Ambient Glows */
        .auth-glow-cyan {
            position: absolute;
            top: -20%;
            right: -10%;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 60%);
            border-radius: 50%;
            animation: glowPulse 8s ease-in-out infinite;
            pointer-events: none;
        }

        .auth-glow-gold {
            position: absolute;
            bottom: -30%;
            left: -15%;
            width: 900px;
            height: 900px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
            border-radius: 50%;
            animation: glowPulse 10s ease-in-out infinite reverse;
            pointer-events: none;
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        /* Stardust Texture */
        .auth-texture {
            position: absolute;
            inset: 0;
            background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
            opacity: 0.4;
            pointer-events: none;
        }

        /* ===== FLOATING PARTICLES ===== */
        .particles-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
        }

        .particle {
            position: absolute;
            border-radius: 50%;
            animation: particleFloat linear infinite;
            opacity: 0;
        }

        .particle-gold {
            background: radial-gradient(circle, var(--gold-secondary), var(--gold-primary));
            box-shadow: 0 0 10px var(--gold-primary), 0 0 20px rgba(212, 175, 55, 0.5);
        }

        .particle-cyan {
            background: radial-gradient(circle, #67e8f9, var(--cyan-primary));
            box-shadow: 0 0 10px var(--cyan-primary), 0 0 20px rgba(6, 182, 212, 0.5);
        }

        .particle-white {
            background: radial-gradient(circle, #fff, #e2e8f0);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        }

        @keyframes particleFloat {
            0% {
                transform: translateY(100vh) translateX(0) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
                transform: translateY(90vh) translateX(5px) scale(1);
            }
            90% {
                opacity: 0.8;
            }
            100% {
                transform: translateY(-10vh) translateX(-10px) scale(0.5);
                opacity: 0;
            }
        }

        /* ===== MAIN CARD ===== */
        .auth-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 480px;
            background: rgba(8, 8, 12, 0.88);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 2rem;
            box-shadow: 
                0 40px 100px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.03) inset;
            overflow: hidden;
            animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
            transform: translateY(30px) scale(0.96);
        }

        @keyframes cardEntrance {
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Card Header */
        .auth-header {
            position: relative;
            padding: 2.5rem 2.5rem 1.5rem;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            overflow: hidden;
        }

        .auth-header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, transparent 50%, rgba(6, 182, 212, 0.05) 100%);
            pointer-events: none;
        }

        /* Logo/Icon */
        .auth-icon-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border-radius: 1.25rem;
            margin-bottom: 1.25rem;
            box-shadow: 
                0 10px 30px rgba(212, 175, 55, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            animation: iconFloat 4s ease-in-out infinite;
        }

        @keyframes iconFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .auth-icon-wrapper svg {
            width: 32px;
            height: 32px;
            color: #000;
        }

        .auth-title {
            font-family: 'Cinzel', serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.25rem;
            letter-spacing: 0.02em;
        }

        .auth-subtitle {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
            letter-spacing: 0.05em;
        }

        /* Ornamental Divider */
        .ornament-divider {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
        }

        .ornament-line {
            width: 60px;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold-dark), transparent);
        }

        .ornament-gem {
            width: 8px;
            height: 8px;
            background: var(--gold-primary);
            transform: rotate(45deg);
            box-shadow: 0 0 10px var(--gold-primary);
        }

        /* ===== TABS ===== */
        .auth-tabs {
            display: flex;
            padding: 1rem 1.5rem 0;
            gap: 0.5rem;
            position: relative;
        }

        .auth-tab {
            flex: 1;
            padding: 0.875rem 1rem;
            background: transparent;
            border: none;
            border-radius: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 2;
        }

        .auth-tab:hover {
            color: rgba(255, 255, 255, 0.7);
        }

        .auth-tab.active {
            color: #000;
        }

        .tab-indicator {
            position: absolute;
            bottom: 0;
            left: 1.5rem;
            width: calc(50% - 1.75rem);
            height: calc(100% - 1rem);
            background: linear-gradient(135deg, var(--gold-secondary), var(--gold-primary));
            border-radius: 0.75rem;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
            z-index: 1;
        }

        .tab-indicator.register {
            transform: translateX(calc(100% + 0.5rem));
        }

        /* ===== FORM CONTENT ===== */
        .auth-forms {
            position: relative;
            padding: 1.5rem 2rem 2rem;
            min-height: 320px;
        }

        .auth-form {
            position: absolute;
            inset: 1.5rem 2rem 2rem;
            opacity: 0;
            visibility: hidden;
            transform: translateX(20px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .auth-form.active {
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
            position: relative;
            inset: unset;
        }

        /* Alert Messages */
        .auth-alert {
            padding: 0.875rem 1rem;
            border-radius: 0.75rem;
            margin-bottom: 1.25rem;
            font-size: 0.8rem;
            font-weight: 500;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            animation: alertSlide 0.4s ease-out;
        }

        @keyframes alertSlide {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .auth-alert-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #fca5a5;
        }

        .auth-alert-error svg {
            color: #ef4444;
            flex-shrink: 0;
        }

        .auth-alert ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .auth-alert li {
            padding: 0.125rem 0;
        }

        /* Input Groups */
        .input-group {
            position: relative;
            margin-bottom: 1.25rem;
        }

        .input-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
            pointer-events: none;
            z-index: 2;
        }

        .auth-input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 0.875rem;
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            outline: none;
        }

        .auth-input::placeholder {
            color: rgba(255, 255, 255, 0.25);
            font-weight: 400;
        }

        .auth-input:hover {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.05);
        }

        .auth-input:focus {
            border-color: var(--gold-primary);
            background: rgba(212, 175, 55, 0.05);
            box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
        }

        .auth-input:focus + .input-icon,
        .input-group:focus-within .input-icon {
            color: var(--gold-primary);
        }

        /* Input Row (for name fields) */
        .input-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        /* Submit Button */
        .auth-submit {
            position: relative;
            width: 100%;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border: none;
            border-radius: 0.875rem;
            color: #000;
            font-family: 'Cinzel', serif;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.3s ease;
            margin-top: 0.5rem;
        }

        .auth-submit::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s ease;
        }

        .auth-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
        }

        .auth-submit:hover::before {
            left: 100%;
        }

        .auth-submit:active {
            transform: translateY(0);
        }

        /* Auto-shimmer */
        .auth-submit::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: shimmerBtn 3s infinite;
        }

        @keyframes shimmerBtn {
            0% { left: -100%; }
            50% { left: 150%; }
            100% { left: 150%; }
        }

        /* ===== FOOTER ===== */
        .auth-footer {
            padding: 1.25rem 2rem;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            text-align: center;
        }

        .auth-footer-text {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.35);
        }

        .auth-footer-link {
            color: var(--gold-primary);
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .auth-footer-link:hover {
            color: var(--gold-secondary);
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 520px) {
            .auth-card {
                border-radius: 1.5rem;
            }

            .auth-header {
                padding: 2rem 1.5rem 1.25rem;
            }

            .auth-forms {
                padding: 1.25rem 1.5rem 1.5rem;
            }

            .input-row {
                grid-template-columns: 1fr;
            }

            .auth-title {
                font-size: 1.5rem;
            }
        }

        /* Success message styling */
        .auth-alert-success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #86efac;
        }

        .auth-alert-success svg {
            color: #22c55e;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <!-- Background Layers -->
        <div class="auth-bg-image"></div>
        <div class="auth-glow-cyan"></div>
        <div class="auth-glow-gold"></div>
        <div class="auth-texture"></div>
        
        <!-- Floating Particles Container -->
        <div class="particles-container" id="particles"></div>

        <!-- Main Card -->
        <div class="auth-card">
            <!-- Header -->
            <div class="auth-header">
                <div class="auth-icon-wrapper">
                    <i data-lucide="shield"></i>
                </div>
                <h1 class="auth-title">Enter the Realm</h1>
                <p class="auth-subtitle">Your adventure awaits</p>
                <div class="ornament-divider">
                    <div class="ornament-line"></div>
                    <div class="ornament-gem"></div>
                    <div class="ornament-line"></div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="auth-tabs">
                <button class="auth-tab <?= $activeTab === 'login' ? 'active' : '' ?>" data-tab="login">
                    Login
                </button>
                <button class="auth-tab <?= $activeTab === 'register' ? 'active' : '' ?>" data-tab="register">
                    Create Account
                </button>
                <div class="tab-indicator <?= $activeTab === 'register' ? 'register' : '' ?>"></div>
            </div>

            <!-- Form Container -->
            <div class="auth-forms">
                <!-- Login Form -->
                <form class="auth-form <?= $activeTab === 'login' ? 'active' : '' ?>" id="login-form" method="POST" action="<?= url('login') ?>">
                    <?php if (isset($_SESSION['error']) && $activeTab === 'login'): ?>
                        <div class="auth-alert auth-alert-error">
                            <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
                            <span><?= htmlspecialchars($_SESSION['error']) ?></span>
                        </div>
                        <?php unset($_SESSION['error']); ?>
                    <?php endif; ?>

                    <?php if (isset($_SESSION['success'])): ?>
                        <div class="auth-alert auth-alert-success">
                            <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i>
                            <span><?= htmlspecialchars($_SESSION['success']) ?></span>
                        </div>
                        <?php unset($_SESSION['success']); ?>
                    <?php endif; ?>

                    <div class="input-group">
                        <input type="email" name="email" class="auth-input" placeholder="Email address" required>
                        <i data-lucide="mail" class="input-icon" style="width: 18px; height: 18px;"></i>
                    </div>

                    <div class="input-group">
                        <input type="password" name="password" class="auth-input" placeholder="Password" required>
                        <i data-lucide="lock" class="input-icon" style="width: 18px; height: 18px;"></i>
                    </div>

                    <button type="submit" class="auth-submit">
                        Enter the Realm
                    </button>
                </form>

                <!-- Register Form -->
                <form class="auth-form <?= $activeTab === 'register' ? 'active' : '' ?>" id="register-form" method="POST" action="<?= url('register') ?>">
                    <?php if (isset($_SESSION['errors']) && is_array($_SESSION['errors'])): ?>
                        <div class="auth-alert auth-alert-error">
                            <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
                            <ul>
                                <?php foreach ($_SESSION['errors'] as $error): ?>
                                    <li><?= htmlspecialchars($error) ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <?php unset($_SESSION['errors']); ?>
                    <?php endif; ?>

                    <?php if (isset($_SESSION['error']) && $activeTab === 'register'): ?>
                        <div class="auth-alert auth-alert-error">
                            <i data-lucide="alert-circle" style="width: 18px; height: 18px;"></i>
                            <span><?= htmlspecialchars($_SESSION['error']) ?></span>
                        </div>
                        <?php unset($_SESSION['error']); ?>
                    <?php endif; ?>

                    <div class="input-row">
                        <div class="input-group">
                            <input type="text" name="first_name" class="auth-input" placeholder="First name" required minlength="2">
                            <i data-lucide="user" class="input-icon" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div class="input-group">
                            <input type="text" name="last_name" class="auth-input" placeholder="Last name" required minlength="2">
                            <i data-lucide="user" class="input-icon" style="width: 18px; height: 18px;"></i>
                        </div>
                    </div>

                    <div class="input-group">
                        <input type="email" name="email" class="auth-input" placeholder="Email address" required>
                        <i data-lucide="mail" class="input-icon" style="width: 18px; height: 18px;"></i>
                    </div>

                    <div class="input-group">
                        <input type="password" name="password" class="auth-input" placeholder="Password" required minlength="6">
                        <i data-lucide="lock" class="input-icon" style="width: 18px; height: 18px;"></i>
                    </div>

                    <div class="input-group">
                        <input type="password" name="password_confirm" class="auth-input" placeholder="Confirm password" required minlength="6">
                            <i data-lucide="shield-check" class="input-icon" style="width: 18px; height: 18px;"></i>
                    </div>

                    <button type="submit" class="auth-submit">
                        Begin Your Journey
                    </button>
                </form>
            </div>

            <!-- Footer -->
            <div class="auth-footer">
                <p class="auth-footer-text" id="footer-text">
                    <?php if ($activeTab === 'login'): ?>
                        Don't have an account? <a href="javascript:void(0)" class="auth-footer-link" data-switch="register">Create one</a>
                    <?php else: ?>
                        Already have an account? <a href="javascript:void(0)" class="auth-footer-link" data-switch="login">Sign in</a>
                    <?php endif; ?>
                </p>
            </div>
        </div>
    </div>

    <script>
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Particle System
        function createParticles() {
            const container = document.getElementById('particles');
            const particleCount = 20;
            const colors = ['particle-gold', 'particle-cyan', 'particle-white'];

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`;
                
                const size = Math.random() * 4 + 2;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
                particle.style.animationDelay = (Math.random() * 10) + 's';
                
                container.appendChild(particle);
            }
        }

        // Tab Switching
        function initTabs() {
            const tabs = document.querySelectorAll('.auth-tab');
            const indicator = document.querySelector('.tab-indicator');
            const forms = document.querySelectorAll('.auth-form');
            const footerText = document.getElementById('footer-text');
            const footerLinks = document.querySelectorAll('.auth-footer-link');

            function switchTab(tabName) {
                // Update tabs
                tabs.forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.tab === tabName);
                });

                // Move indicator
                indicator.classList.toggle('register', tabName === 'register');

                // Switch forms
                forms.forEach(form => {
                    const isActive = form.id === tabName + '-form';
                    form.classList.toggle('active', isActive);
                });

                // Update footer text
                if (tabName === 'login') {
                    footerText.innerHTML = 'Don\'t have an account? <a href="javascript:void(0)" class="auth-footer-link" data-switch="register">Create one</a>';
                } else {
                    footerText.innerHTML = 'Already have an account? <a href="javascript:void(0)" class="auth-footer-link" data-switch="login">Sign in</a>';
                }

                // Re-attach footer link listeners
                document.querySelectorAll('.auth-footer-link').forEach(link => {
                    link.addEventListener('click', () => switchTab(link.dataset.switch));
                });

                // Update URL without reload
                const newUrl = tabName === 'login' ? '<?= url('login') ?>' : '<?= url('register') ?>';
                history.replaceState(null, '', newUrl);
            }

            // Tab click handlers
            tabs.forEach(tab => {
                tab.addEventListener('click', () => switchTab(tab.dataset.tab));
            });

            // Footer link handlers
            footerLinks.forEach(link => {
                link.addEventListener('click', () => switchTab(link.dataset.switch));
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            createParticles();
            initTabs();
        });
    </script>
</body>
</html>
