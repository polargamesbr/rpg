<?php $activePage = 'create_character'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Create Your Legend - RPG</title>
    <?php include 'head.php'; ?>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
            font-family: 'Inter', sans-serif;
            color: white;
            position: fixed; /* Lock viewport */
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
            flex-direction: row; /* Horizontal for wide screens */
        }

        @media (max-width: 1024px) {
            .hero-gallery {
                flex-direction: column; /* Vertical for mobile/narrow */
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
            flex: 6; /* Expansion factor */
            filter: grayscale(0) brightness(1.1);
            z-index: 10;
            box-shadow: 0 0 100px rgba(0,0,0,1);
        }

        @media (max-width: 1024px) {
            .hero-panel:hover {
                flex: 10;
            }
        }

        /* Dynamic Class Gradient */
        .hero-panel::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, var(--class-color) 0%, transparent 40%);
            opacity: 0.3; /* Increased visibility as requested */
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

        /* Combined Panel Content */
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

        /* Collapsed Title Alignment */
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

        /* Horizontal Layout (Default) */
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

        /* Vertical Layout (Mobile) */
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

        /* Gender Reveal Box */
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

        /* Liquid squash effect */
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

        /* Lore & Details (Only visible on hover) */
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

        /* Starting City Block */
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

        /* Stats & Type */
        .type-theme {
            font-size: 0.8rem;
            color: #a8a29e;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Select Action */
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
            border-radius: 8px; /* Slightly softer */
            text-align: center;
            box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5);
            max-width: 500px;
            width: 90%;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        }
        /* Dynamic Theme Border for Modal */
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
        
        /* Dashed Ring Effect */
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
            font-size: 3rem; /* Small default */
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

    </style>
</head>
<body>

    <!-- STEP 1: NAME INPUT -->
    <div id="step-name" class="step-container step-active flex items-center justify-center min-h-screen">
        <!-- Background Layer -->
        <div class="absolute inset-0 z-0 bg-cover bg-center" style="background-image: url('assets/img/tavern-background.webp'); filter: grayscale(100%) blur(5px) brightness(0.4);"></div>
        <canvas id="particles-bg" class="absolute inset-0 z-10"></canvas>
        
        <div class="input-group relative z-20 flex flex-col items-center">
            <h1 class="text-4xl md:text-5xl font-serif text-amber-500 mb-12 text-center leading-tight drop-shadow-lg" style="font-family: 'Cinzel', serif;">What is your name, traveler?</h1>
            <input type="text" id="charName" class="char-name-input text-center" placeholder="Type your name..." autocomplete="off">
            <div class="input-label mt-4 text-stone-400 tracking-[0.3em] uppercase text-sm">This will be your legend</div>
            <button class="next-btn mt-12" onclick="goToClassSelection()">Confirm Name</button>
        </div>
    </div>

    <!-- STEP 2: CLASS SELECTION -->
    <div id="step-class" class="step-container step-hidden">
        <div class="back-btn" onclick="backToName()"><i data-lucide="arrow-left" class="w-4 h-4"></i> Change Name</div>
        


        <div class="hero-gallery" id="heroGallery">
            <!-- Items injected here logic stays same, adding ID for manipulation -->
            
            <!-- Espadachim -->
            <div class="hero-panel" id="panel-espadachim" data-color="#ef4444" style="--class-color: #ef4444; --class-glow: rgba(239, 68, 68, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-espadachim" style="background-image: url('assets/img/swordman-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Espadachim</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="map-pin" class="w-3 h-3"></i> Stormhaven</div>
                        <div class="type-theme">Cidade-fortaleza costeira • Disciplina & Aço</div>
                        <div class="lore-text">
                            <span class="lore-highlight">Stormhaven</span> é o bastião militar do continente. Muralhas altas e constantes treinamentos marcam a vida de quem nasce ali.
                        </div>
                        <button class="select-btn" onclick="selectClass('Espadachim', 'A Espada de Stormhaven', '#ef4444', 'sword', 'Stormhaven')">Escolher Espadachim</button>
                    </div>
                </div>
            </div>

            <!-- Arqueiro -->
            <div class="hero-panel" id="panel-arqueiro" data-color="#22c55e" style="--class-color: #22c55e; --class-glow: rgba(34, 197, 94, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-arqueiro" style="background-image: url('assets/img/archer-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Arqueiro</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="tree-pine" class="w-3 h-3"></i> Eldervale</div>
                        <div class="type-theme">Vila florestal fortificada • Natureza & Precisão</div>
                        <div class="lore-text">
                            As matas de <span class="lore-highlight">Eldervale</span> abrigam os melhores atiradores do mundo. Arqueiros aqui aprendem a ouvir o vento antes de disparar.
                        </div>
                        <button class="select-btn" onclick="selectClass('Arqueiro', 'O Arco de Eldervale', '#22c55e', 'crosshair', 'Eldervale')">Escolher Arqueiro</button>
                    </div>
                </div>
            </div>

            <!-- Mago -->
            <div class="hero-panel" data-color="#3b82f6" style="--class-color: #3b82f6; --class-glow: rgba(59, 130, 246, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-mago" style="background-image: url('assets/img/mage-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Mago</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="zap" class="w-3 h-3"></i> Aetherys</div>
                        <div class="type-theme">Cidade arcana elevada • Conhecimento & Risco</div>
                        <div class="lore-text">
                            Em <span class="lore-highlight">Aetherys</span>, a magia flui como água. Magos dedicam vidas a entender as leis do cosmos em torres que tocam as nuvens.
                        </div>
                        <button class="select-btn" onclick="selectClass('Mago', 'O Cajado de Aetherys', '#3b82f6', 'zap', 'Aetherys')">Escolher Mago</button>
                    </div>
                </div>
            </div>

            <!-- Ladrão -->
            <div class="hero-panel" data-color="#a8a29e" style="--class-color: #a8a29e; --class-glow: rgba(168, 162, 158, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-ladrao" style="background-image: url('assets/img/thief-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Ladrão</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="ghost" class="w-3 h-3"></i> Dunrath</div>
                        <div class="type-theme">Cidade portuária decadente • Oportunismo & Crime</div>
                        <div class="lore-text">
                            As vielas de <span class="lore-highlight">Dunrath</span> não são para amadores. Ladrões e espiões prosperam onde a lei é apenas uma sugestão.
                        </div>
                        <button class="select-btn" onclick="selectClass('Ladrão', 'As Sombras de Dunrath', '#a8a29e', 'ghost', 'Dunrath')">Escolher Ladrão</button>
                    </div>
                </div>
            </div>

            <!-- Acolito -->
            <div class="hero-panel" data-color="#facc15" style="--class-color: #facc15; --class-glow: rgba(250, 204, 21, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-acolito" style="background-image: url('assets/img/sacer-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Acolito</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="sun" class="w-3 h-3"></i> Lumenfall</div>
                        <div class="type-theme">Cidade sagrada • Fé & Sacrifício</div>
                        <div class="lore-text">
                            <span class="lore-highlight">Lumenfall</span> é o coração espiritual do reino. Acólitos curam feridas e protegem os fracos com a luz divina do sol celestial.
                        </div>
                        <button class="select-btn" onclick="selectClass('Acolito', 'A Luz de Lumenfall', '#facc15', 'sun', 'Lumenfall')">Escolher Acolito</button>
                    </div>
                </div>
            </div>

            <!-- Ferreiro -->
            <div class="hero-panel" data-color="#f97316" style="--class-color: #f97316; --class-glow: rgba(249, 115, 22, 0.5);">
                <div class="hero-bg class-hero-bg" id="bg-ferreiro" style="background-image: url('assets/img/blacksmith-male.webp');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title">Ferreiro</h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button class="g-button active" data-gender="male" onclick="setGender('male', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button class="g-button" data-gender="female" onclick="setGender('female', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="hammer" class="w-3 h-3"></i> Brumaférrea</div>
                        <div class="type-theme">Cidade mineradora • Trabalho & Progresso</div>
                        <div class="lore-text">
                            <span class="lore-highlight">Brumaférrea</span> é a forja do mundo. Ferreiros aqui aprendem que o destino é algo que se molda com fogo, martelo e vontade pura.
                        </div>
                        <button class="select-btn" onclick="selectClass('Ferreiro', 'O Martelo de Brumaférrea', '#f97316', 'hammer', 'Brumaférrea')">Escolher Ferreiro</button>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- CONFIRMATION MODAL -->
    <div id="modal-confirmation" class="modal-overlay">
        <div class="modal-glass" id="modal-glass-container">
            <!-- Icon Wrapper -->
            <div class="modal-icon-wrapper">
                <div class="dashed-ring"></div>
                <div class="dashed-ring-inner"></div>
                <i id="modal-icon-target" data-lucide="sword" class="w-10 h-10"></i>
            </div>
            
            <h3 class="modal-title">Confirm Destiny</h3>
            <p class="modal-text">Are you sure you want to walk the path of the <span id="modal-class-name" class="font-bold">CLASS</span>?</p>
            <div class="modal-visual" id="modal-visual-preview"></div>
            <div class="modal-actions">
                <button class="modal-btn cancel" onclick="closeModal()">Return</button>
                <button class="modal-btn confirm" onclick="finalizeSelection()">Accept Fate</button>
            </div>
        </div>
    </div>

    <!-- STEP 3: FINAL CONFIRMATION (RPG CARD THEME) -->
    <div id="step-final" class="step-container step-hidden" style="pointer-events: none;">
        <!-- Screen Flash Content -->
        <div id="ascension-flash" class="absolute inset-0 bg-white z-[60] pointer-events-none opacity-0"></div>

        <!-- Blurred Hero Background -->
        <div id="final-hero-bg" class="absolute inset-0 z-0 bg-cover bg-top transition-all duration-1000" style="filter: grayscale(100%) blur(10px) brightness(0.4); transform: scale(1.1);"></div>
        
        <!-- Reuse Particles -->
        <div id="final-particles-container" class="absolute inset-0 z-10"></div>

        <div class="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-auto p-4">
            
            <!-- RPG CARD -->
            <div class="rpg-card group" id="finalCard" data-tilt style="width: 380px; height: 550px; --glare-pos-x: 50%; --glare-pos-y: 50%;">
                <div class="card-content-wrapper">
                    <!-- Borders & Corners -->
                    <div class="card-border">
                        <div class="border-corner top-left"></div>
                        <div class="border-corner top-right"></div>
                        <div class="border-corner bottom-left"></div>
                        <div class="border-corner bottom-right"></div>
                    </div>
                    <div class="bg-overlay"></div>
                    
                    <!-- Content -->
                    <div class="rpg-card-content mb-8">
                        <h1 class="rpg-card-title text-5xl mb-2" id="finalHeroName">HERO</h1>
                        <p class="rpg-card-subtitle text-xl tracking-widest text-amber-200" id="finalHeroClass">THE CLASS</p>
                    </div>
                </div>
            </div>

            <p id="finalOriginText" class="text-amber-100/80 font-serif text-lg mt-8 tracking-widest uppercase opacity-0 animation-delay-2000" style="animation: fadeInText 1s ease forwards 2.5s; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
                Your adventure begins in...
            </p>

            <button class="ascension-btn mt-6" onclick="enterGame()">
                Begin Journey
            </button>
        </div>
    </div>

    <script>
        lucide.createIcons();
        
        const stepName = document.getElementById('step-name');
        const stepClass = document.getElementById('step-class');
        const stepFinal = document.getElementById('step-final');
        const nameInput = document.getElementById('charName');
        const particlesCanvas = document.getElementById('particles-bg');
        
        let selectedGender = 'male';
        let selectedClassData = null; // Added to store class data for modal/final screen

        // --- Gender Logic ---
        function setGender(gender, event) {
            if(event) event.stopPropagation(); // Prevent select class trigger
            selectedGender = gender;
            
            // Sync all toggles
            document.querySelectorAll('.g-button').forEach(btn => {
                btn.classList.remove('active');
                if(btn.dataset.gender === gender) btn.classList.add('active');
            });

            // Swap Archer Image
            const archerBg = document.getElementById('bg-arqueiro');
            if(archerBg) {
                archerBg.style.backgroundImage = `url('assets/img/archer-${gender}.png')`;
            }

            // Swap Swordsman Image
            const swordmanBg = document.getElementById('bg-espadachim');
            if(swordmanBg) {
                swordmanBg.style.backgroundImage = `url('assets/img/swordman-${gender}.png')`;
            }

            // Swap Mage Image
            const mageBg = document.getElementById('bg-mago');
            if(mageBg) {
                mageBg.style.backgroundImage = `url('assets/img/mage-${gender}.png')`;
            }

            // Swap Thief Image
            const thiefBg = document.getElementById('bg-ladrao');
            if(thiefBg) {
                thiefBg.style.backgroundImage = `url('assets/img/thief-${gender}.png')`;
            }

            // Swap Acolyte (Sacer) Image
            const acolyteBg = document.getElementById('bg-acolito');
            if(acolyteBg) {
                acolyteBg.style.backgroundImage = `url('assets/img/sacer-${gender}.png')`;
            }

            // Swap Blacksmith (Ferreiro) Image
            const blacksmithBg = document.getElementById('bg-ferreiro');
            if(blacksmithBg) {
                blacksmithBg.style.backgroundImage = `url('assets/img/blacksmith-${gender}.png')`;
            }
        }

        // --- Particle System ---
        const ctx = particlesCanvas.getContext('2d');
        let particles = [];
        let activeColor = '#d4af37'; // Default gold

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
                this.speedY = (Math.random() - 0.5) * 0.5 - 0.5; // Drift up
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
                // Respawn anywhere on screen for full coverage, or slightly below
                this.y = Math.random() * (particlesCanvas.height + 50); 
                this.life = Math.random() * 200 + 100; // Longer life
                this.color = activeColor;
                this.alpha = Math.random() * 0.5 + 0.1;
                this.speedY = (Math.random() - 0.5) * 0.5 - 0.2; // Gentle float
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

        // Update particle color on hover
        document.querySelectorAll('.hero-panel').forEach(panel => {
            panel.addEventListener('mouseenter', () => {
                activeColor = panel.getAttribute('data-color');
            });
            panel.addEventListener('mouseleave', () => {
                activeColor = '#57534e'; // Reset to stone/grey
            });
        });

        function goToClassSelection() {
            if(nameInput.value.trim() !== "") {
                stepName.classList.remove('step-active');
                stepName.classList.add('step-hidden');
                
                stepClass.classList.remove('step-hidden');
                stepClass.classList.add('step-active');
            }
        }

        function backToName() {
            stepClass.classList.remove('step-active');
            stepClass.classList.add('step-hidden');
            
            stepName.classList.remove('step-hidden');
            stepName.classList.add('step-active');
        }

        nameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                goToClassSelection();
            }
        });

        // Removed old confirmSelection function as it's replaced by the modal flow

        function selectClass(className, title, color, icon, city) {
            const heroName = nameInput.value;
            if (heroName.trim() === "") {
                alert("Please enter your name first!");
                return;
            }

            selectedClassData = { className, title, color, heroName, city };
            
            // Set Dynamic Modal Colors
            const glass = document.getElementById('modal-glass-container');
            glass.style.setProperty('--modal-color', color);
            glass.style.setProperty('--modal-glow', color); // Simplified glow

            // Update Icon
            const iconTarget = document.getElementById('modal-icon-target');
            iconTarget.setAttribute('data-lucide', icon);
            lucide.createIcons(); // Refresh icons

            // Populate Modal
            document.getElementById('modal-class-name').innerText = className;
            document.getElementById('modal-class-name').style.color = color;
            document.getElementById('modal-confirmation').classList.add('active');
        }

        function closeModal() {
            document.getElementById('modal-confirmation').classList.remove('active');
        }

        function finalizeSelection() {
            closeModal();
            const { className, title, color, heroName, city } = selectedClassData;
            
            // Hide class selection elements
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
                stepClass.style.display = 'none'; // Fully remove from layout

                stepFinal.classList.remove('step-hidden');
                stepFinal.classList.add('step-active');
                
                // Color Theme
                stepFinal.style.setProperty('--ascension-color', color);
                stepFinal.style.setProperty('--ascension-glow', color); // Simplified for glow

                // Hero Image & Background
                // Construct filename matches Logic in setGender
                let imgName = 'archer-male.webp'; // Default fallback
                if(className === 'Espadachim') imgName = `swordman-${selectedGender}.png`;
                else if(className === 'Arqueiro') imgName = `archer-${selectedGender}.png`;
                else if(className === 'Mago') imgName = `mage-${selectedGender}.png`;
                else if(className === 'Ladrão') imgName = `thief-${selectedGender}.png`;
                else if(className === 'Acolito') imgName = `sacer-${selectedGender}.png`;
                else if(className === 'Ferreiro') imgName = `blacksmith-${selectedGender}.png`;

                const fullImgPath = `assets/img/${imgName}`;

                // Set Blurred Background
                document.getElementById('final-hero-bg').style.backgroundImage = `url('${fullImgPath}')`;

                // Set Card Background
                const finalCard = document.getElementById('finalCard');
                finalCard.style.backgroundImage = `url('${fullImgPath}')`;
                
                // Trigger Flash
                const flash = document.getElementById('ascension-flash');
                flash.classList.remove('flash-anim');
                void flash.offsetWidth; // Trigger reflow
                flash.classList.add('flash-anim');

                document.getElementById('finalHeroName').innerText = heroName;
                document.getElementById('finalHeroClass').innerText = `THE ${className.toUpperCase()}`;
                document.getElementById('finalOriginText').innerHTML = `Your adventure begins in <span style="color:${color}">${city.toUpperCase()}</span>...`;

                // Move particles to final screen to ensure they are visible
                const pCanvas = document.getElementById('particles-bg');
                if(pCanvas) {
                    pCanvas.style.zIndex = '5'; // Ensure above bg but below card
                    document.getElementById('step-final').insertBefore(pCanvas, document.getElementById('final-particles-container'));
                }

            }, 500); // Allow time for panels to fade out
        }      
        
        function enterGame() {
            window.location.href = 'city-hub.php';
        }
    </script>
</body>
</html>
