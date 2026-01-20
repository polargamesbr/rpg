<?php
$title = 'Create Your Legend - RPG Game';
$showSidebar = false;

$additionalStyles = <<<CSS
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    font-family: 'Inter', sans-serif;
    color: white;
    position: fixed;
}

/* --- STEP CONTAINER --- */
.step-container {
    position: absolute;
    inset: 0;
    transition: opacity 0.8s ease, transform 0.8s ease;
    will-change: opacity, transform;
    display: flex;
    align-items: center;
    justify-content: center;
}

.step-hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(1.02);
    z-index: 0;
}

.step-active {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    z-index: 10;
}

/* --- STEP 1: NAME INPUT --- */
#step-name {
    background: #000;
}

.input-group {
    position: relative;
    width: 100%;
    max-width: 500px;
    text-align: center;
    z-index: 20;
    padding: 2rem;
}

.char-name-input {
    background: transparent;
    border: none;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    font-family: 'Cinzel', serif;
    font-size: clamp(1.5rem, 5vw, 3rem);
    text-align: center;
    width: 100%;
    padding: 1rem 0;
    outline: none;
    transition: all 0.3s ease;
}

.char-name-input:focus {
    border-bottom-color: #d4af37;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
}

.input-label {
    margin-top: 1rem;
    color: #78716c;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    opacity: 0.8;
}

.next-btn {
    margin-top: 3rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d4af37;
    padding: 1rem 3.5rem;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(20px);
}

.char-name-input:not(:placeholder-shown) ~ .next-btn {
    opacity: 1;
    transform: translateY(0);
}

.next-btn:hover {
    background: #d4af37;
    color: #000;
    box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
    transform: scale(1.05);
}

.error-message {
    margin-top: 1rem;
    color: #ef4444;
    font-size: 0.875rem;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.error-message.show {
    opacity: 1;
    transform: translateY(0);
}

/* --- STEP 2: CLASS SELECTION --- */
#step-class {
    width: 100vw;
    height: 100vh;
    background: #000;
}

.hero-gallery {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: row;
}

@media (max-width: 1024px) {
    .hero-gallery {
        flex-direction: column;
    }
}

.hero-panel {
    position: relative;
    flex: 1;
    transition: all 0.7s cubic-bezier(0.25, 1, 0.5, 1);
    overflow: hidden;
    cursor: pointer;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    filter: grayscale(0.9) brightness(0.4);
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 1024px) {
    .hero-panel {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
}

.hero-panel:last-child { border: none; }

.hero-panel:hover {
    flex: 6;
    filter: grayscale(0) brightness(1.1);
    z-index: 10;
    box-shadow: 0 0 100px rgba(0,0,0,1);
}

@media (max-width: 1024px) {
    .hero-panel:hover {
        flex: 10;
    }
}

.hero-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, var(--class-color) 0%, transparent 40%);
    opacity: 0.3;
    transition: opacity 0.5s ease;
    pointer-events: none;
    z-index: 2;
}

.hero-panel:hover::after {
    opacity: 0.5;
}

.hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    transition: transform 10s linear;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.hero-panel:hover .hero-bg {
    transform: scale(1.1);
}

.overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.95) 100%);
    z-index: 3;
    transition: opacity 0.4s;
}

.panel-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: clamp(1rem, 5vw, 4rem);
    z-index: 10;
    transition: all 0.5s ease;
}

.class-title {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    text-transform: uppercase;
    margin: 0;
    line-height: 1;
    color: #fff;
    text-shadow: 0 4px 15px rgba(0,0,0,0.8);
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    white-space: nowrap;
    pointer-events: none;
}

@media (min-width: 1025px) {
    .hero-panel:not(:hover) .class-title { 
        transform: rotate(-90deg);
        font-size: 1.5rem;
        opacity: 0.6;
        letter-spacing: 0.2em;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-90deg);
    }

    .hero-panel:hover .class-title {
        font-size: clamp(2.5rem, 8vw, 5.5rem);
    }
}

@media (max-width: 1024px) {
    .hero-panel:not(:hover) .class-title { 
        font-size: 1.2rem;
        opacity: 0.7;
        letter-spacing: 0.3em;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .hero-panel:hover .class-title {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .panel-content {
        padding: 1.5rem;
        align-items: center;
        text-align: center;
    }
}

.gender-reveal-box {
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease 0.4s;
    display: flex;
    align-items: center;
    gap: 1rem;
    pointer-events: none;
}

.hero-panel:hover .gender-reveal-box {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.premium-toggle {
    display: flex;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px;
    border-radius: 50px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    position: relative;
    backdrop-filter: blur(5px);
}

.g-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.3);
    border: none;
    background: transparent;
}

.g-button.active { color: #f2d16b; }

.g-slider {
    position: absolute;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.45) 100%);
    border: 1px solid rgba(242, 209, 107, 0.5);
    border-radius: 50%;
    transition: all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6);
    z-index: 1;
    left: 4px;
    box-shadow: 
        0 0 25px rgba(212, 175, 55, 0.2),
        inset 0 1px 3px rgba(255,255,255,0.4);
}

.premium-toggle:active .g-slider {
    transform: scaleX(1.3) scaleY(0.8);
}

.g-button[data-gender="female"].active ~ .g-slider {
    left: 48px; 
}

.gender-label {
    font-family: 'Cinzel', serif;
    font-size: 0.75rem;
    color: #a8a29e;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    opacity: 0.8;
}

.lore-container {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.5s ease 0.1s;
}

.hero-panel:hover .lore-container {
    max-height: 600px;
    opacity: 1;
    margin-top: 1rem;
}

.city-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--class-color);
    margin-bottom: 1rem;
    border: 1px solid rgba(255,255,255,0.1);
}

.lore-text {
    font-size: 0.95rem;
    color: #d6d3d1;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    max-width: 600px;
    border-left: 3px solid var(--class-color);
    padding-left: 1rem;
}

.lore-highlight {
    color: #fff;
    font-weight: 600;
}

.type-theme {
    font-size: 0.8rem;
    color: #a8a29e;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.select-btn {
    background: var(--class-color);
    color: #000;
    border: none;
    padding: 1rem 2rem;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    margin-top: 1rem;
    align-self: flex-start;
    transition: transform 0.2s;
}

.select-btn:hover { transform: scale(1.05); box-shadow: 0 0 20px var(--class-glow); }

.back-btn {
    position: absolute;
    top: 2rem;
    left: 2rem;
    z-index: 50;
    color: #fff;
    opacity: 0.5;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
}
.back-btn:hover { opacity: 1; }

/* --- MODAL CONFIRMATION --- */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}
.modal-overlay.active {
    opacity: 1;
    pointer-events: auto;
}
.modal-glass {
    background: linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98));
    border: 1px solid rgba(255,255,255,0.1);
    padding: 3rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
    max-width: 500px;
    width: 90%;
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
}
.modal-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid var(--modal-color, #d4af37);
    opacity: 0.3;
    pointer-events: none;
    border-radius: 8px;
}

.modal-icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--modal-color, #d4af37);
}

.dashed-ring {
    position: absolute;
    inset: 0;
    border: 2px dashed var(--modal-color, #d4af37);
    border-radius: 50%;
    animation: spinRing 10s linear infinite;
    opacity: 0.5;
}
.dashed-ring-inner {
    position: absolute;
    inset: 10px;
    border: 1px dashed var(--modal-color, #d4af37);
    border-radius: 50%;
    animation: spinRing 6s linear infinite reverse;
    opacity: 0.3;
}

@keyframes spinRing { to { transform: rotate(360deg); } }

.modal-title {
    font-family: 'Cinzel', serif;
    font-size: 2rem;
    color: var(--modal-color, #d4af37);
    text-shadow: 0 0 15px rgba(0,0,0,0.5);
    margin-bottom: 1rem;
    text-transform: uppercase;
}
.modal-text {
    color: #a8a29e;
    margin-bottom: 2rem;
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem;
}
.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}
.modal-btn {
    padding: 0.8rem 2rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-family: 'Cinzel', serif;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}
.modal-btn.confirm {
    background: var(--modal-color, #d4af37);
    color: #000;
    border-color: var(--modal-color, #d4af37);
    font-weight: bold;
    box-shadow: 0 0 15px var(--modal-glow, rgba(212, 175, 55, 0.3));
}
.modal-btn.confirm:hover {
    background: #fff;
    box-shadow: 0 0 30px var(--modal-glow, rgba(212, 175, 55, 0.6));
}
.modal-btn.cancel:hover {
    background: rgba(255,255,255,0.1);
}

/* --- ASCENSION SCREEN --- */
.god-rays-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 10;
    opacity: 0.4;
    pointer-events: none;
}
.god-ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200vw;
    height: 200vw;
    background: radial-gradient(circle, var(--ascension-color) 0%, transparent 60%);
    transform: translate(-50%, -50%);
    mix-blend-mode: screen;
    animation: rotateRays 20s linear infinite;
}
.god-ray:nth-child(2) { animation-duration: 25s; opacity: 0.7; transform: translate(-50%, -50%) rotate(45deg); }
.god-ray:nth-child(3) { animation-duration: 30s; opacity: 0.5; transform: translate(-50%, -50%) rotate(90deg); }

@keyframes rotateRays {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}

.hero-ascension-image {
    width: 400px;
    height: 600px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center bottom;
    filter: drop-shadow(0 0 50px var(--ascension-color));
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(50px) scale(0.9);
    animation: heroRise 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards 0.5s;
}

@keyframes heroRise {
    to { opacity: 1; transform: translateY(0) scale(1.1); }
}

.ascension-title {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5rem;
    text-shadow: 0 0 20px rgba(0,0,0,0.8);
    opacity: 0;
    animation: fadeInText 1s ease forwards 1s;
    text-align: center;
}
@media(min-width: 768px) { .ascension-title { font-size: 5rem; } }

.ascension-subtitle {
    font-family: 'Inter', sans-serif;
    color: var(--ascension-color);
    font-size: 1.5rem;
    letter-spacing: 0.3rem;
    margin-bottom: 3rem;
    opacity: 0;
    animation: fadeInText 1s ease forwards 1.5s;
}

.ascension-btn {
    background: transparent;
    color: #fff;
    border: 1px solid var(--ascension-color);
    padding: 1rem 3rem;
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 20px var(--ascension-glow);
    opacity: 0;
    animation: fadeInText 1s ease forwards 2s;
}
.ascension-btn:hover {
    background: var(--ascension-color);
    color: #000;
    box-shadow: 0 0 40px var(--ascension-glow);
}

@keyframes fadeInText { to { opacity: 1; } }

.flash-anim {
    animation: flashScreen 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes flashScreen {
    0% { opacity: 1; }
    100% { opacity: 0; }
}

/* RPG Card Styles */
.rpg-card {
    background-color: #1a1a1a;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    border-radius: 12px;
    box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.8),
        0 0 0 1px rgba(138, 109, 59, 0.5);
    transition: all 0.1s ease-out;
    overflow: hidden;
    width: 380px;
    height: 550px;
    transform-style: preserve-3d;
}

.bg-overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    z-index: 1;
}

.card-content-wrapper {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.1) 0%,
        rgba(0,0,0,0.4) 50%,
        rgba(0,0,0,0.9) 100%
    );
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 2rem;
    transition: background 0.5s ease;
}

.rpg-card:hover .card-content-wrapper {
    background: linear-gradient(
        to bottom,
        rgba(0,0,0,0) 0%,
        rgba(0,0,0,0.3) 40%,
        rgba(0,0,0,0.95) 100%
    );
}

.card-border {
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 5;
    pointer-events: none;
    transition: border-color 0.3s ease;
}
.rpg-card:hover .card-border {
    border-color: rgba(242, 209, 107, 0.3);
}

.border-corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #b7954d;
    transition: all 0.3s ease;
    opacity: 0.7;
}
.rpg-card:hover .border-corner {
    width: 30px;
    height: 30px;
    opacity: 1;
}

.top-left { top: 6px; left: 6px; border-right: none; border-bottom: none; }
.top-right { top: 6px; right: 6px; border-left: none; border-bottom: none; }
.bottom-left { bottom: 6px; left: 6px; border-right: none; border-top: none; }
.bottom-right { bottom: 6px; right: 6px; border-left: none; border-top: none; }

.rpg-card-content {
    position: relative;
    width: 100%;
    text-align: center;
    z-index: 10;
    padding: 0 1rem;
}

.rpg-card-title {
    font-family: 'Cinzel', serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: #f2d16b;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.9);
    transform: translateZ(20px);
    transition: transform 0.3s ease;
}
.rpg-card-subtitle {
    color: #d1d5db;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    opacity: 0.8;
    transform: translateZ(15px);
    transition: all 0.3s ease;
}
.rpg-card:hover .rpg-card-title {
    transform: translateZ(30px) scale(1.05);
    color: #fff;
    text-shadow: 0 0 20px rgba(242, 209, 107, 0.6);
}
.rpg-card:hover .rpg-card-subtitle {
    color: #f2d16b;
    opacity: 1;
    transform: translateZ(25px);
}
CSS;

ob_start();
?>

<!-- Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-stone-800/50">
    <div class="container mx-auto px-6 py-4 flex items-center justify-between">
        <a href="<?= url('panel') ?>" class="flex items-center gap-2 text-stone-300 hover:text-amber-500 transition-colors">
            <i data-lucide="arrow-left" class="w-5 h-5"></i>
            <span class="font-medium">Back</span>
        </a>
        <h1 class="text-xl font-serif text-amber-500" style="font-family: 'Cinzel', serif;">Create Your Legend</h1>
        <a href="<?= url('panel') ?>" class="flex items-center gap-2 text-stone-300 hover:text-red-400 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
            <span class="font-medium">Exit</span>
        </a>
    </div>
</header>

<div id="step-name" class="step-container step-active flex items-center justify-center min-h-screen">
    <audio id="audio-whats-your-name" preload="auto">
        <source src="<?= asset('mp3/whats-your-name.mp3') ?>" type="audio/mpeg">
    </audio>
    <div class="absolute inset-0 z-0 bg-cover bg-center" style="background-image: url('<?= asset('img/tavern-background.webp') ?>'); filter: grayscale(100%) blur(5px) brightness(0.4);"></div>
    <canvas id="particles-bg" class="absolute inset-0 z-10"></canvas>
    
    <div class="input-group relative z-20 flex flex-col items-center">
        <h1 class="text-4xl md:text-5xl font-serif text-amber-500 mb-12 text-center leading-tight drop-shadow-lg" style="font-family: 'Cinzel', serif;">What is your name, traveler?</h1>
        <input type="text" id="charName" class="char-name-input text-center" placeholder="Type your name..." autocomplete="off" autofocus>
        <div class="input-label mt-4 text-stone-400 tracking-[0.3em] uppercase text-sm">This will be your legend</div>
        <div class="error-message" id="nameError"></div>
        <button class="next-btn mt-12" onclick="validateAndGoToClassSelection()">Confirm Name</button>
    </div>
</div>

<div id="step-class" class="step-container step-hidden">
    <audio id="audio-select-class" preload="auto">
        <source src="<?= asset('mp3/choose-class.mp3') ?>" type="audio/mpeg">
    </audio>
    <a href="#" class="back-btn" onclick="backToName()"><i data-lucide="arrow-left" class="w-4 h-4"></i> Change Name</a>
    
    <div class="hero-gallery" id="heroGallery">
        <?php foreach ($classes as $class): ?>
            <?php
            $classKey = strtolower($class['name']);
            $classKey = str_replace(['ã', 'õ'], ['a', 'o'], $classKey);
            $imagePrefix = $class['image_prefix'] ?? 'archer';
            ?>
            <div class="hero-panel" id="panel-<?= htmlspecialchars($classKey) ?>" data-color="<?= htmlspecialchars($class['color_hex']) ?>" style="--class-color: <?= htmlspecialchars($class['color_hex']) ?>; --class-glow: <?= htmlspecialchars($class['color_glow']) ?>;">
                <div class="hero-bg class-hero-bg" id="bg-<?= htmlspecialchars($classKey) ?>" style="background-image: url('<?= asset('img/' . $imagePrefix . '-male.png') ?>');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title"><?= htmlspecialchars($class['display_name']) ?></h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button type="button" class="g-button active" data-gender="male" onclick="setGender('male', '<?= htmlspecialchars($classKey) ?>', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button type="button" class="g-button" data-gender="female" onclick="setGender('female', '<?= htmlspecialchars($classKey) ?>', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="<?= htmlspecialchars($class['icon_name']) ?>" class="w-3 h-3"></i> <?= htmlspecialchars($class['starting_city']) ?></div>
                        <div class="type-theme"><?= htmlspecialchars($class['type_theme']) ?></div>
                        <div class="lore-text">
                            <?= str_replace($class['starting_city'], '<span class="lore-highlight">' . htmlspecialchars($class['starting_city']) . '</span>', htmlspecialchars($class['lore_text'])) ?>
                        </div>
                        <button type="button" class="select-btn" onclick="selectClass('<?= htmlspecialchars($class['name']) ?>', '<?= htmlspecialchars($class['color_hex']) ?>', '<?= htmlspecialchars($class['icon_name']) ?>', '<?= htmlspecialchars($class['starting_city']) ?>')">Choose <?= htmlspecialchars($class['display_name']) ?></button>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<div id="modal-confirmation" class="modal-overlay">
    <div class="modal-glass" id="modal-glass-container">
        <div class="modal-icon-wrapper">
            <div class="dashed-ring"></div>
            <div class="dashed-ring-inner"></div>
            <i id="modal-icon-target" data-lucide="sword" class="w-10 h-10"></i>
        </div>
        <h3 class="modal-title">Confirm Destiny</h3>
        <p class="modal-text">Are you sure you want to walk the path of the <span id="modal-class-name" class="font-bold">CLASS</span>?</p>
        <div class="modal-actions">
            <button type="button" class="modal-btn cancel" onclick="closeModal()">Return</button>
            <button type="button" class="modal-btn confirm" onclick="finalizeSelection()">Accept Fate</button>
        </div>
    </div>
</div>

<div id="step-final" class="step-container step-hidden" style="pointer-events: none;">
    <audio id="audio-bass" preload="auto">
        <source src="<?= asset('mp3/bass.mp3') ?>" type="audio/mpeg">
    </audio>
    <div id="ascension-flash" class="absolute inset-0 bg-white z-[60] pointer-events-none opacity-0"></div>
    <div id="final-hero-bg" class="absolute inset-0 z-0 bg-cover bg-top transition-all duration-1000" style="filter: grayscale(100%) blur(10px) brightness(0.4); transform: scale(1.1);"></div>
    <div id="final-particles-container" class="absolute inset-0 z-10"></div>

    <div class="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-auto p-4">
        <div class="rpg-card group" id="finalCard" data-tilt style="width: 380px; height: 550px; --glare-pos-x: 50%; --glare-pos-y: 50%;">
            <div class="card-content-wrapper">
                <div class="card-border">
                    <div class="border-corner top-left"></div>
                    <div class="border-corner top-right"></div>
                    <div class="border-corner bottom-left"></div>
                    <div class="border-corner bottom-right"></div>
                </div>
                <div class="bg-overlay"></div>
                <div class="rpg-card-content mb-8">
                    <h1 class="rpg-card-title text-5xl mb-2" id="finalHeroName">HERO</h1>
                    <p class="rpg-card-subtitle text-xl tracking-widest text-amber-200" id="finalHeroClass">THE CLASS</p>
                </div>
            </div>
        </div>

        <p id="finalOriginText" class="text-amber-100/80 font-serif text-lg mt-8 tracking-widest uppercase opacity-0" style="animation: fadeInText 1s ease forwards 2.5s; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
            Your adventure begins in...
        </p>

        <div class="flex flex-col items-center gap-3 mt-6">
            <button type="button" class="text-stone-400 hover:text-stone-200 text-sm font-medium transition-colors underline decoration-stone-600 hover:decoration-stone-400" onclick="window.backToClassSelection()">
                Change Selection
            </button>
            <button type="button" class="ascension-btn" onclick="window.enterGame()">
                Begin Journey
            </button>
        </div>
    </div>
</div>

<?php
$classImageMapJson = json_encode($classImageMap ?? []);
$panelUrl = url('panel');
$assetImgBase = asset('img/');
$validateNameUrl = url('game/character/validate-name');
$storeUrl = url('game/character/store');

$additionalScripts = <<<JS
(function() {
    'use strict';
    
    lucide.createIcons();

    const stepName = document.getElementById('step-name');
    const stepClass = document.getElementById('step-class');
    const stepFinal = document.getElementById('step-final');
    const nameInput = document.getElementById('charName');
    const particlesCanvas = document.getElementById('particles-bg');
    const nameError = document.getElementById('nameError');
    const audioWhatsYourName = document.getElementById('audio-whats-your-name');
    const audioSelectClass = document.getElementById('audio-select-class');
    const audioBass = document.getElementById('audio-bass');
    
    // Focus on name input when page loads
    if (nameInput) {
        setTimeout(() => {
            nameInput.focus();
        }, 100);
    }
    
    // Play first audio when page loads (name screen)
    if (audioWhatsYourName) {
        audioWhatsYourName.play().catch(err => {
            console.log('Audio play prevented:', err);
        });
    }

    let selectedGender = 'male';
    let selectedClassData = null;
    let characterName = '';
    const classImageMap = {$classImageMapJson};
    
    function showError(message) {
        nameError.textContent = message;
        nameError.classList.add('show');
    }

    function hideError() {
        nameError.classList.remove('show');
    }
    
    function goToClassSelection() {
        stepName.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        stepName.classList.remove('step-active');
        stepName.classList.add('step-hidden');
        
        setTimeout(() => {
            stepClass.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            stepClass.classList.remove('step-hidden');
            stepClass.classList.add('step-active');
        }, 150);
    }
    
    // Expose functions globally for onclick handlers
    window.validateAndGoToClassSelection = async function() {
        const name = nameInput.value.trim();
        
        if (!name) {
            showError('Please enter a name');
            return;
        }
        
        try {
            const response = await fetch('{$validateNameUrl}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            });
            
            const data = await response.json();
            
            if (data.valid) {
                characterName = name;
                hideError();
                goToClassSelection();
            } else {
                showError(data.error || 'Invalid name');
            }
        } catch (error) {
            showError('Error validating name. Please try again.');
            console.error('Validation error:', error);
        }
    };


    const ctx = particlesCanvas.getContext('2d');
    let particles = [];
    let activeColor = '#d4af37';

    function resizeCanvas() {
        particlesCanvas.width = window.innerWidth;
        particlesCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
    constructor() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = Math.random() * particlesCanvas.height;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5 - 0.5;
        this.color = activeColor;
        this.life = Math.random() * 100;
        this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if(this.life <= 0 || this.y < 0) {
           this.reset(); 
        }
    }
    reset() {
        this.x = Math.random() * particlesCanvas.width;
        this.y = Math.random() * (particlesCanvas.height + 50);
        this.life = Math.random() * 200 + 100;
        this.color = activeColor;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.speedY = (Math.random() - 0.5) * 0.5 - 0.2;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    }

    function initParticles() {
        for(let i=0; i<100; i++) particles.push(new Particle());
        animateParticles();
    }

    function animateParticles() {
        ctx.clearRect(0,0,particlesCanvas.width, particlesCanvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    initParticles();

    document.querySelectorAll('.hero-panel').forEach(panel => {
        panel.addEventListener('mouseenter', () => {
            activeColor = panel.getAttribute('data-color');
        });
        panel.addEventListener('mouseleave', () => {
            activeColor = '#57534e';
        });
    });
    
    window.setGender = function(gender, classKey, event) {
        if(event) event.stopPropagation();
        selectedGender = gender;
        
        // Sync all toggles across all classes
        document.querySelectorAll('.g-button').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.gender === gender) btn.classList.add('active');
        });
        
        // Move all sliders
        document.querySelectorAll('.g-slider').forEach(slider => {
            if(gender === 'female') {
                slider.style.left = '48px';
            } else {
                slider.style.left = '4px';
            }
        });

        // Update background images for ALL classes
        const assetBase = '{$assetImgBase}';
        for (const classKey in classImageMap) {
            const imagePrefix = classImageMap[classKey] || 'archer';
            const bgId = 'bg-' + classKey;
            const bg = document.getElementById(bgId);
            if(bg) {
                bg.style.backgroundImage = 'url(\'' + assetBase + imagePrefix + '-' + gender + '.png\')';
            }
        }
    };
    
    function goToClassSelection() {
        stepName.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        stepName.classList.remove('step-active');
        stepName.classList.add('step-hidden');
        
        // Stop first audio and play second audio
        if (audioWhatsYourName) {
            audioWhatsYourName.pause();
            audioWhatsYourName.currentTime = 0;
        }
        if (audioSelectClass) {
            audioSelectClass.play().catch(err => {
                console.log('Audio play prevented:', err);
            });
        }
        
        setTimeout(() => {
            stepClass.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            stepClass.classList.remove('step-hidden');
            stepClass.classList.add('step-active');
        }, 150);
    }

    nameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.validateAndGoToClassSelection();
        }
    });

    window.selectClass = function(className, color, icon, city) {
        if (!characterName || characterName.trim() === "") {
            alert("Please enter your name first!");
            window.backToName();
            return;
        }

        selectedClassData = { className, color, heroName: characterName, city, icon };
        
        const glass = document.getElementById('modal-glass-container');
        glass.style.setProperty('--modal-color', color);
        glass.style.setProperty('--modal-glow', color);

        const iconTarget = document.getElementById('modal-icon-target');
        iconTarget.setAttribute('data-lucide', icon);
        lucide.createIcons();

        document.getElementById('modal-class-name').innerText = className;
        document.getElementById('modal-class-name').style.color = color;
        document.getElementById('modal-confirmation').classList.add('active');
    };
    
    window.backToName = function() {
        stepClass.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        stepClass.classList.remove('step-active');
        stepClass.classList.add('step-hidden');
        
        // Stop second audio and play first audio again
        if (audioSelectClass) {
            audioSelectClass.pause();
            audioSelectClass.currentTime = 0;
        }
        if (audioWhatsYourName) {
            audioWhatsYourName.play().catch(err => {
                console.log('Audio play prevented:', err);
            });
        }
        
        setTimeout(() => {
            stepName.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            stepName.classList.remove('step-hidden');
            stepName.classList.add('step-active');
        }, 150);
    };
    
    window.closeModal = function() {
        document.getElementById('modal-confirmation').classList.remove('active');
    };
    
    window.finalizeSelection = function() {
        window.closeModal();
        const { className, color, heroName, city, icon } = selectedClassData;
        
        document.querySelectorAll('.hero-panel').forEach(p => {
            p.style.transition = 'all 0.5s ease';
            p.style.opacity = '0';
            p.style.transform = 'scale(0.8)';
        });
        document.querySelector('.back-btn').style.opacity = '0';
        document.querySelector('.back-btn').style.pointerEvents = 'none';

        setTimeout(() => {
            stepClass.classList.remove('step-active');
            stepClass.classList.add('step-hidden');
            stepClass.style.display = 'none';

            stepFinal.classList.remove('step-hidden');
            stepFinal.classList.add('step-active');
            
            stepFinal.style.setProperty('--ascension-color', color);
            stepFinal.style.setProperty('--ascension-glow', color);
            
            // Play bass sound when final screen appears
            if (audioBass) {
                audioBass.currentTime = 0;
                audioBass.play().catch(err => {
                    console.log('Audio play prevented:', err);
                });
            }

            const classKey = className.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const imagePrefix = classImageMap[classKey] || 'archer';
            const assetBase = '{$assetImgBase}';
            const fullImgPath = assetBase + imagePrefix + '-' + selectedGender + '.png';

            document.getElementById('final-hero-bg').style.backgroundImage = 'url(\'' + fullImgPath + '\')';
            const finalCard = document.getElementById('finalCard');
            finalCard.style.backgroundImage = 'url(\'' + fullImgPath + '\')';
            
            const flash = document.getElementById('ascension-flash');
            flash.classList.remove('flash-anim');
            void flash.offsetWidth;
            flash.classList.add('flash-anim');

            document.getElementById('finalHeroName').innerText = heroName;
            document.getElementById('finalHeroClass').innerText = 'THE ' + className.toUpperCase();
            document.getElementById('finalOriginText').innerHTML = 'Your adventure begins in <span style="color:' + color + '">' + city.toUpperCase() + '</span>...';

            const pCanvas = document.getElementById('particles-bg');
            if(pCanvas) {
                pCanvas.style.zIndex = '5';
                document.getElementById('step-final').insertBefore(pCanvas, document.getElementById('final-particles-container'));
            }
        }, 500);
    };

    window.backToClassSelection = function() {
        // Stop bass audio
        if (audioBass) audioBass.pause();
        if (audioSelectClass) {
            audioSelectClass.currentTime = 0;
            audioSelectClass.play().catch(err => {
                console.log('Audio play prevented:', err);
            });
        }
        
        // Hide final step
        stepFinal.classList.remove('step-active');
        stepFinal.classList.add('step-hidden');
        
        // Show class selection again
        stepClass.style.display = '';
        stepClass.classList.remove('step-hidden');
        stepClass.classList.add('step-active');
        
        // Restore panels and back button
        document.querySelectorAll('.hero-panel').forEach(p => {
            p.style.transition = 'all 0.5s ease';
            p.style.opacity = '1';
            p.style.transform = 'scale(1)';
        });
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.style.opacity = '1';
            backBtn.style.pointerEvents = 'auto';
        }
    };
    
    window.enterGame = async function() {
        const { className, heroName } = selectedClassData;
        
        try {
            const response = await fetch('{$storeUrl}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: heroName,
                    class: className,
                    gender: selectedGender
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.redirect || '{$panelUrl}';
            } else {
                alert('Error creating character: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error creating character. Please try again.');
            console.error('Creation error:', error);
        }
    };
})();
JS;
?>

<?php
$content = ob_get_clean();
include __DIR__ . '/../layouts/main.php';
?>
