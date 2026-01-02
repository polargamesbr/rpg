<?php $activePage = 'tavern'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Tavern - RPG</title>
    <?php include 'head.php'; ?>
    <style>
        .tavern-panel {
            background: rgba(20, 15, 10, 0.4);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(138, 109, 59, 0.3);
            border-radius: 12px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .chat-header {
            padding: 1rem;
            border-bottom: 1px solid rgba(138, 109, 59, 0.3);
            flex-shrink: 0;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .chat-message {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
        }
        .chat-message.system {
            justify-content: center;
            padding: 0.5rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .chat-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid #d4af37;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f1f2e 100%);
            position: relative;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.5), inset 0 2px 6px rgba(255, 255, 255, 0.1);
            overflow: hidden;
            flex-shrink: 0;
            padding: 1px;
        }
        .chat-avatar-inner {
            width: 100%;
            height: 100%;
            position: relative;
            border-radius: 50%;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
        }
        .chat-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        .chat-message-content {
            flex: 1;
            min-width: 0;
        }
        .chat-message-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        .chat-message-name {
            font-weight: 600;
            color: #f2d16b;
            font-size: 0.875rem;
        }
        .chat-message-level {
            font-size: 0.75rem;
            color: #a8a29e;
        }
        .chat-message-class {
            font-size: 0.75rem;
            color: #78716c;
            font-style: italic;
        }
        .chat-message-text {
            color: #e7e5e4;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        .chat-input-container {
            padding: 1rem;
            border-top: 1px solid rgba(138, 109, 59, 0.3);
            flex-shrink: 0;
        }
        .chat-input {
            background: rgba(20, 15, 10, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(138, 109, 59, 0.4);
            border-radius: 6px;
            color: #fff;
            padding: 0.75rem;
        }
        .chat-input:focus {
            outline: none;
            border-color: rgba(212, 175, 55, 0.6);
            box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
        }
        .quest-item {
            background: linear-gradient(145deg, rgba(42, 42, 62, 0.8), rgba(30, 30, 50, 0.8));
            border-radius: 12px;
            border: 1px solid rgba(212, 175, 55, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            margin-bottom: 1.25rem;
            z-index: 1;
        }
        .quest-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, rgba(212, 175, 55, 0.05) 0%, transparent 30%);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
        }
        .quest-item:hover {
            transform: translateY(-5px);
            border-color: rgba(212, 175, 55, 0.5);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.2);
        }
        .quest-item:hover::before {
            opacity: 1;
        }
        .quest-content {
            display: flex;
            align-items: flex-start;
            gap: 1.25rem;
            position: relative;
            z-index: 2;
        }
        .quest-thumbnail {
            width: 120px;
            height: 120px;
            border-radius: 10px;
            overflow: hidden;
            flex-shrink: 0;
            position: relative;
            border: 2px solid rgba(212, 175, 55, 0.4);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }
        .quest-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }
        .quest-item:hover .quest-thumbnail img {
            transform: scale(1.05);
        }
        .quest-thumbnail::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent 50%, rgba(10, 10, 26, 0.7) 100%);
            pointer-events: none;
        }
        .quest-info {
            flex: 1;
            padding-right: 0.625rem;
        }
        .quest-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #f7e8c3;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.625rem;
            font-family: 'Playfair Display', serif;
        }
        .quest-title::before {
            content: '✦';
            color: #ff6b35;
            font-size: 1.2rem;
        }
        .quest-description {
            font-size: 0.95rem;
            color: #c9c0a5;
            line-height: 1.5;
            margin-bottom: 0.9375rem;
        }
        .quest-rewards {
            display: flex;
            gap: 1.25rem;
            margin-bottom: 0.9375rem;
        }
        .reward-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.9rem;
            padding: 0.3125rem 0.625rem;
            background: rgba(20, 20, 35, 0.7);
            border-radius: 20px;
            border: 1px solid rgba(212, 175, 55, 0.2);
        }
        .xp-reward {
            color: #4ecdc4;
        }
        .gold-reward {
            color: #ffd700;
        }
        .quest-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.9375rem;
        }
        .quest-meta {
            font-size: 0.875rem;
            color: #a8a29e;
        }
        .tavern-button {
            background: linear-gradient(145deg, #d4af37 0%, #b8941f 50%, #8a6d3b 100%);
            color: #1a0f00;
            border: 2px solid rgba(255, 215, 0, 0.6);
            border-radius: 8px;
            padding: 0.875rem 1.75rem;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            z-index: 1;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            box-shadow: 
                0 4px 15px rgba(212, 175, 55, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2),
                0 0 20px rgba(212, 175, 55, 0.2);
            font-family: 'Playfair Display', serif;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
        }
        .tavern-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s ease;
            z-index: 1;
        }
        .tavern-button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, rgba(255, 215, 0, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 0;
        }
        .tavern-button:hover {
            transform: translateY(-3px);
            border-color: rgba(255, 215, 0, 0.9);
            box-shadow: 
                0 8px 25px rgba(212, 175, 55, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3),
                0 0 30px rgba(255, 215, 0, 0.5),
                0 0 60px rgba(212, 175, 55, 0.3);
            color: #1a0f00;
            background: linear-gradient(145deg, #f4d03f 0%, #d4af37 50%, #b8941f 100%);
        }
        .tavern-button:hover::before {
            left: 100%;
        }
        .tavern-button:hover::after {
            opacity: 1;
        }
        .tavern-button:active {
            transform: translateY(-1px);
            box-shadow: 
                0 4px 15px rgba(212, 175, 55, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2),
                0 0 25px rgba(212, 175, 55, 0.4);
            background: linear-gradient(145deg, #d4af37 0%, #b8941f 50%, #8a6d3b 100%);
        }
        .tavern-button span {
            position: relative;
            z-index: 2;
        }
        .tavern-footer-bg {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            min-height: 700px;
            z-index: 1;
            pointer-events: none;
            background-image: url('assets/img/tavern-footer.jpg');
            background-repeat: repeat-x;
            background-position: bottom center;
            background-size: contain;
        }
        .main-content-wrapper {
            position: relative;
            z-index: 10;
        }
    </style>
</head>
<body class="bg-black text-stone-100">
    
    <!-- Footer Background Fixo -->
    <div class="tavern-footer-bg"></div>
    
    <div class="flex min-h-screen main-content-wrapper">
        
        <?php include 'sidebar.php'; ?>

        <!-- Área Principal -->
        <main class="flex-1 ml-[260px] flex flex-col">
            
            <!-- Hero Section com Background -->
            <div class="relative w-full" style="height: 38vh; min-height: 300px;">
                <img src="assets/img/tavern-background.jpg" alt="Tavern" class="w-full h-full object-cover object-center">
                <div class="absolute bottom-0 left-0 right-0" style="height: 20%; background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);"></div>
                
                <!-- Header Superior (Absolute) -->
                <header class="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 pt-6 z-20">
                    <div>
                        <h1 class="city-title text-5xl font-bold text-stone-100 drop-shadow-lg">Tavern</h1>
                        <p class="text-xs text-amber-500/80 font-medium tracking-widest uppercase mt-2">Rumors, contracts and stories</p>
                    </div>
                    <div class="time-weather-panel px-4 py-2 rounded-lg backdrop-blur-md bg-stone-900/60 border border-stone-700/50">
                        <div class="flex items-center gap-4">
                            <div>
                                <div class="text-[10px] text-stone-400 tracking-wider">LOCAL TIME</div>
                                <div class="text-lg font-mono font-bold text-amber-50 leading-none">14:27</div>
                            </div>
                            <div class="h-8 w-px bg-stone-700/50"></div>
                            <div class="flex flex-col items-end">
                                <span class="text-[10px] text-stone-300 font-semibold tracking-wider">CLEAR</span>
                                <div class="text-blue-300">
                                    <i data-lucide="sun" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <!-- Área Principal -->
            <div class="flex-1 p-8 -mt-24 relative z-20">
                <div class="max-w-7xl mx-auto">
                    
                    <div class="grid grid-cols-12 gap-6">
                        
                        <!-- Coluna Esquerda: Chat Global -->
                        <div class="col-span-5">
                            <div class="tavern-panel chat-container" style="min-height: 60vh;">
                                <!-- Header -->
                                <div class="chat-header">
                                    <h2 class="text-xl font-bold text-amber-400">Global Chat</h2>
                                </div>
                                
                                <!-- Messages Area -->
                                <div class="chat-messages">
                                    <div class="chat-message">
                                        <div class="chat-avatar">
                                            <div class="chat-avatar-inner">
                                                <img src="assets/img/avatar.png" alt="Hector">
                                            </div>
                                        </div>
                                        <div class="chat-message-content">
                                            <div class="chat-message-header">
                                                <span class="chat-message-name">Hector</span>
                                                <span class="chat-message-level">Lvl 10</span>
                                                <span class="chat-message-class">[Priest]</span>
                                            </div>
                                            <div class="chat-message-text">Any tank up for a dungeon run?</div>
                                        </div>
                                    </div>
                                    
                                    <div class="chat-message">
                                        <div class="chat-avatar">
                                            <div class="chat-avatar-inner">
                                                <img src="assets/img/avatar.png" alt="Amira">
                                            </div>
                                        </div>
                                        <div class="chat-message-content">
                                            <div class="chat-message-header">
                                                <span class="chat-message-name">Amira</span>
                                                <span class="chat-message-level">Lvl 10</span>
                                                <span class="chat-message-class">[Rogue]</span>
                                            </div>
                                            <div class="chat-message-text">Selling potions! DM for prices.</div>
                                        </div>
                                    </div>
                                    
                                    <div class="chat-message">
                                        <div class="chat-avatar">
                                            <div class="chat-avatar-inner">
                                                <img src="assets/img/avatar.png" alt="Arie">
                                            </div>
                                        </div>
                                        <div class="chat-message-content">
                                            <div class="chat-message-header">
                                                <span class="chat-message-name">Arie</span>
                                                <span class="chat-message-level">Lvl 11</span>
                                                <span class="chat-message-class">[Paladin]</span>
                                            </div>
                                            <div class="chat-message-text">Bandits on the west road! Need allies.</div>
                                        </div>
                                    </div>
                                    
                                    <div class="chat-message system">
                                        <div class="chat-message-text" style="color: #60a5fa; font-style: italic;">A mysterious hooded figure enters the tavern.</div>
                                    </div>
                                    
                                    <div class="chat-message">
                                        <div class="chat-avatar">
                                            <div class="chat-avatar-inner">
                                                <img src="assets/img/avatar.png" alt="Rhogar">
                                            </div>
                                        </div>
                                        <div class="chat-message-content">
                                            <div class="chat-message-header">
                                                <span class="chat-message-name">Rhogar</span>
                                                <span class="chat-message-level">Lvl 10</span>
                                                <span class="chat-message-class">[Warrior]</span>
                                            </div>
                                            <div class="chat-message-text">Need healer for an undead hunt.</div>
                                        </div>
                                    </div>
                                    
                                    <div class="chat-message">
                                        <div class="chat-avatar">
                                            <div class="chat-avatar-inner">
                                                <img src="assets/img/avatar.png" alt="Calder">
                                            </div>
                                        </div>
                                        <div class="chat-message-content">
                                            <div class="chat-message-header">
                                                <span class="chat-message-name">Calder</span>
                                                <span class="chat-message-level">Lvl 7</span>
                                                <span class="chat-message-class">[Wizard]</span>
                                            </div>
                                            <div class="chat-message-text">Got room for one more?</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Input Area -->
                                <div class="chat-input-container">
                                    <div class="flex gap-2">
                                        <input type="text" placeholder="Type a message..." class="chat-input flex-1">
                                        <button class="tavern-button text-sm px-4">SEND</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Coluna Direita: Quests de Stormhaven -->
                        <div class="col-span-7">
                            <div class="tavern-panel p-4 flex flex-col" style="min-height: 60vh;">
                                <h2 class="text-xl font-bold text-amber-400 mb-6">Stormhaven Quests</h2>
                                <div class="space-y-4">
                                    
                                    <!-- Quest 1: First Steps -->
                                    <div class="quest-item p-5">
                                        <div class="quest-content">
                                            <div class="quest-thumbnail">
                                                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%); display: flex; align-items: center; justify-content: center;">
                                                    <i data-lucide="sword" class="w-16 h-16 text-blue-300 opacity-60"></i>
                                                </div>
                                            </div>
                                            <div class="quest-info">
                                                <h3 class="quest-title">First Steps</h3>
                                                <p class="quest-description">Learn the basics of combat and exploration in Stormhaven. Master your first sword techniques, learn to navigate the city, and discover the fundamentals of adventuring.</p>
                                                <div class="quest-rewards">
                                                    <div class="reward-item xp-reward">
                                                        <i data-lucide="star" class="w-4 h-4"></i>
                                                        <span>+50 XP</span>
                                                    </div>
                                                    <div class="reward-item">
                                                        <i data-lucide="clock" class="w-4 h-4"></i>
                                                        <span>~15 minutes</span>
                                                    </div>
                                                </div>
                                                <div class="quest-footer">
                                                    <div class="quest-meta">Available for: All Classes</div>
                                                    <button class="tavern-button"><span>Accept Quest</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quest 2: Join the Guild -->
                                    <div class="quest-item p-5">
                                        <div class="quest-content">
                                            <div class="quest-thumbnail">
                                                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #7c2d12 0%, #dc2626 50%, #f87171 100%); display: flex; align-items: center; justify-content: center;">
                                                    <i data-lucide="scroll" class="w-16 h-16 text-red-300 opacity-60"></i>
                                                </div>
                                            </div>
                                            <div class="quest-info">
                                                <h3 class="quest-title">Join the Guild</h3>
                                                <p class="quest-description">Visit the Guild Hall and enlist as an official adventurer. Prove your worth to the Guild Master and gain access to exclusive quests, rewards, and adventuring parties.</p>
                                                <div class="quest-rewards">
                                                    <div class="reward-item gold-reward">
                                                        <i data-lucide="coins" class="w-4 h-4"></i>
                                                        <span>100 Gold</span>
                                                    </div>
                                                    <div class="reward-item">
                                                        <i data-lucide="key" class="w-4 h-4"></i>
                                                        <span>Guild Access</span>
                                                    </div>
                                                </div>
                                                <div class="quest-footer">
                                                    <div class="quest-meta">Prerequisite: Complete "First Steps"</div>
                                                    <button class="tavern-button"><span>Accept Quest</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Quest 3: A Knight's Duty -->
                                    <div class="quest-item p-5">
                                        <div class="quest-content">
                                            <div class="quest-thumbnail">
                                                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #78350f 0%, #f59e0b 50%, #fbbf24 100%); display: flex; align-items: center; justify-content: center;">
                                                    <i data-lucide="shield" class="w-16 h-16 text-amber-300 opacity-60"></i>
                                                </div>
                                            </div>
                                            <div class="quest-info">
                                                <h3 class="quest-title">A Knight's Duty</h3>
                                                <p class="quest-description">Patrol the city gates and protect the citizens of Stormhaven from bandit raids. Engage in combat with enemy forces and prove your valor as a guardian of the realm.</p>
                                                <div class="quest-rewards">
                                                    <div class="reward-item xp-reward">
                                                        <i data-lucide="star" class="w-4 h-4"></i>
                                                        <span>+120 XP</span>
                                                    </div>
                                                    <div class="reward-item gold-reward">
                                                        <i data-lucide="coins" class="w-4 h-4"></i>
                                                        <span>75 Gold</span>
                                                    </div>
                                                    <div class="reward-item">
                                                        <i data-lucide="medal" class="w-4 h-4"></i>
                                                        <span>Knight's Favor</span>
                                                    </div>
                                                </div>
                                                <div class="quest-footer">
                                                    <div class="quest-meta">Recommended for: Warriors, Paladins</div>
                                                    <button class="tavern-button"><span>Accept Quest</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </main>

    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
        });
    </script>
</body>
</html>
