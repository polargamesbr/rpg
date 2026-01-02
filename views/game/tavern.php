<?php
$title = 'Tavern - RPG Game';
$showSidebar = true;
$activePage = 'tavern';
$character = $character ?? null;

// Prepare chat URLs and variables for JavaScript
$roomName = $roomName ?? 'tavern';
$sendUrl = url('game/chat/send');
$messagesUrl = url('game/chat/messages');
$pollUrl = url('game/chat/poll');
$assetImgBase = asset('img/');

// Escape for JavaScript
$roomNameJs = htmlspecialchars($roomName, ENT_QUOTES, 'UTF-8');
$sendUrlJs = htmlspecialchars($sendUrl, ENT_QUOTES, 'UTF-8');
$messagesUrlJs = htmlspecialchars($messagesUrl, ENT_QUOTES, 'UTF-8');
$pollUrlJs = htmlspecialchars($pollUrl, ENT_QUOTES, 'UTF-8');
$assetImgBaseJs = htmlspecialchars($assetImgBase, ENT_QUOTES, 'UTF-8');

// Prepare CSS with image path
$tavernFooterImg = asset('img/tavern-footer.jpg');
$additionalStyles = <<<CSS
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
    height: 60vh;
    min-height: 500px;
    max-height: 60vh;
    overflow: hidden;
}
.chat-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(138, 109, 59, 0.3);
    flex-shrink: 0;
}
.chat-messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
    max-height: 100%;
    /* Custom Scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(212, 175, 55, 0.5) rgba(20, 15, 10, 0.3);
}
.chat-messages::-webkit-scrollbar {
    width: 8px;
}
.chat-messages::-webkit-scrollbar-track {
    background: rgba(20, 15, 10, 0.3);
    border-radius: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.5);
    border-radius: 4px;
    border: 1px solid rgba(212, 175, 55, 0.2);
}
.chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.7);
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
    font-family: 'Cinzel', serif;
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
    font-family: 'Cinzel', serif;
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
    background-image: url('{$tavernFooterImg}');
    background-repeat: repeat-x;
    background-position: bottom center;
    background-size: contain;
}
.main-content-wrapper {
    position: relative;
    z-index: 10;
}

/* Skeleton Loading */
.skeleton-message {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.5rem;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(138, 109, 59, 0.2);
    flex-shrink: 0;
}

.skeleton-text {
    height: 1rem;
    background: rgba(138, 109, 59, 0.2);
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.skeleton-name {
    width: 80px;
}

.skeleton-level {
    width: 50px;
    margin-left: 0.5rem;
}

.skeleton-message.skeleton-text {
    width: 70%;
    margin-top: 0.25rem;
}

@keyframes skeleton-pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* Chat message time */
.chat-message-time {
    font-size: 0.7rem;
    color: #78716c;
    margin-left: auto;
    font-style: italic;
}

/* Character counter */
#chat-char-count {
    font-size: 0.7rem;
    color: #a8a29e;
    transition: color 0.3s ease;
}

#chat-char-count.text-red-400 {
    color: #ef4444;
}

/* Input disabled state */
.chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Smooth message appearance */
.chat-message {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

/* Quest container scrollbar */
.quests-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(212, 175, 55, 0.5) rgba(20, 15, 10, 0.3);
}
.quests-container::-webkit-scrollbar {
    width: 8px;
}
.quests-container::-webkit-scrollbar-track {
    background: rgba(20, 15, 10, 0.3);
    border-radius: 4px;
}
.quests-container::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.5);
    border-radius: 4px;
    border: 1px solid rgba(212, 175, 55, 0.2);
}
.quests-container::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.7);
}
CSS;

ob_start();
?>

<!-- Footer Background Fixo -->
<div class="tavern-footer-bg"></div>

<div class="flex h-screen main-content-wrapper relative z-10 overflow-hidden">
    
    <?php include __DIR__ . '/../partials/sidebar.php'; ?>

    <!-- Área Principal -->
    <main class="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        <!-- Hero Section com Background -->
        <div class="relative w-full" style="height: 38vh; min-height: 300px;">
            <img src="<?= asset('img/tavern-background.jpg') ?>" alt="Tavern" class="w-full h-full object-cover object-center">
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
                            <div class="text-lg font-mono font-bold text-amber-50 leading-none"><?= date('H:i') ?></div>
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
        <div class="flex-1 p-8 -mt-24 relative z-20" style="display: flex; flex-direction: column;">
            <div class="max-w-7xl mx-auto flex-1" style="display: flex; flex-direction: column;">
                
                <div class="grid grid-cols-12 gap-6 flex-1" style="align-items: stretch; min-height: 0;">
                    
                    <!-- Coluna Esquerda: Chat Global -->
                    <div class="col-span-5">
                        <div class="tavern-panel chat-container">
                            <!-- Header -->
                            <div class="chat-header">
                                <h2 class="text-xl font-bold text-amber-400">Global Chat</h2>
                            </div>
                            
                            <!-- Messages Area -->
                            <div id="chat-messages-container" class="chat-messages">
                                <!-- Skeleton loading will be inserted here -->
                            </div>
                            
                            <!-- Input Area -->
                            <div class="chat-input-container">
                                <div class="flex gap-2 items-center">
                                    <div class="flex-1 relative">
                                        <input 
                                            type="text" 
                                            id="chat-message-input" 
                                            placeholder="Type a message..." 
                                            class="chat-input w-full"
                                            maxlength="1000"
                                            autocomplete="off"
                                        >
                                        <div class="absolute bottom-1 right-2 text-xs text-stone-500">
                                            <span id="chat-char-count">0</span>/1000
                                        </div>
                                    </div>
                                    <button id="chat-send-btn" class="tavern-button text-sm px-4">
                                        <span>SEND</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Direita: Quests -->
                    <div class="col-span-7">
                        <div class="tavern-panel p-4 flex flex-col quests-container" style="height: 60vh; min-height: 500px; max-height: 60vh; overflow-y: auto;">
                            <h2 class="text-xl font-bold text-amber-400 mb-6" style="flex-shrink: 0;">Stormhaven Quests</h2>
                            <div class="space-y-4 flex-1" style="min-height: 0;">
                                
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
    height: 60vh;
    min-height: 500px;
    max-height: 60vh;
    overflow: hidden;
}
.chat-header {
    padding: 1rem;
    border-bottom: 1px solid rgba(138, 109, 59, 0.3);
    flex-shrink: 0;
}
.chat-messages {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
    max-height: 100%;
    /* Custom Scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(212, 175, 55, 0.5) rgba(20, 15, 10, 0.3);
}
.chat-messages::-webkit-scrollbar {
    width: 8px;
}
.chat-messages::-webkit-scrollbar-track {
    background: rgba(20, 15, 10, 0.3);
    border-radius: 4px;
}
.chat-messages::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.5);
    border-radius: 4px;
    border: 1px solid rgba(212, 175, 55, 0.2);
}
.chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.7);
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
    font-family: 'Cinzel', serif;
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
    font-family: 'Cinzel', serif;
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
    background-image: url('{$tavernFooterImg}');
    background-repeat: repeat-x;
    background-position: bottom center;
    background-size: contain;
}
.main-content-wrapper {
    position: relative;
    z-index: 10;
}

/* Skeleton Loading */
.skeleton-message {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    padding: 0.5rem;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(138, 109, 59, 0.2);
    flex-shrink: 0;
}

.skeleton-text {
    height: 1rem;
    background: rgba(138, 109, 59, 0.2);
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.skeleton-name {
    width: 80px;
}

.skeleton-level {
    width: 50px;
    margin-left: 0.5rem;
}

.skeleton-message.skeleton-text {
    width: 70%;
    margin-top: 0.25rem;
}

@keyframes skeleton-pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

/* Chat message time */
.chat-message-time {
    font-size: 0.7rem;
    color: #78716c;
    margin-left: auto;
    font-style: italic;
}

/* Character counter */
#chat-char-count {
    font-size: 0.7rem;
    color: #a8a29e;
    transition: color 0.3s ease;
}

#chat-char-count.text-red-400 {
    color: #ef4444;
}

/* Input disabled state */
.chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Smooth message appearance */
.chat-message {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

<?php
// Close output buffer temporarily to define additionalScripts
$htmlContent = ob_get_clean();

// Define JavaScript with escaped variables using heredoc (normal, not nowdoc)
$additionalScripts = <<<JSSCRIPT
(function() {
    'use strict';
    
    const roomName = '{$roomNameJs}';
    const sendUrl = '{$sendUrlJs}';
    const messagesUrl = '{$messagesUrlJs}';
    const pollUrl = '{$pollUrlJs}';
    const assetImgBase = '{$assetImgBaseJs}';
    
    // State
    let lastMessageUuid = null;
    let isAtBottom = true;
    let isLoading = false;
    let pollIntervalId = null;
    const pollInterval = 5000; // 5 seconds (reduced server load)
    
    // DOM elements
    const messagesContainer = document.getElementById('chat-messages-container');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const charCount = document.getElementById('chat-char-count');
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        setupEventListeners();
        loadMessages();
        
        // Start polling after initial load (delay to reduce initial server load)
        setTimeout(() => {
            startPolling();
        }, 1000);
    });
    
    // Pause polling when page is hidden (reduce server load)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPolling();
        } else {
            startPolling();
        }
    });
    
    // Cooldown state
    let cooldownUntil = 0;
    
    function validateMessageClient(message) {
        const trimmed = message.trim();
        
        // Empty check
        if (!trimmed || trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        // Length check
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message is too long (max 1000 characters)' };
        }
        
        if (trimmed.length < 1) {
            return { valid: false, error: 'Message is too short' };
        }
        
        // Removed: repeated characters check (allows "kkkkk", "hahaha", etc.)
        // Removed: duplicate message check
        
        return { valid: true, error: '' };
    }
    
    function setupEventListeners() {
        // Send button
        sendBtn.addEventListener('click', handleSend);
        
        // Enter key to send
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
        
        // Character counter and real-time validation
        messageInput.addEventListener('input', () => {
            const message = messageInput.value;
            const length = message.length;
            charCount.textContent = length;
            
            // Update counter color
            if (length > 1000) {
                charCount.classList.add('text-red-400');
            } else if (length === 0) {
                charCount.classList.remove('text-red-400');
            } else {
                charCount.classList.remove('text-red-400');
            }
            
            // Real-time validation feedback
            const trimmed = message.trim();
            if (trimmed.length > 0 && trimmed.length < 1) {
                // Too short (only whitespace)
                messageInput.style.borderColor = '#ef4444';
            } else if (length > 1000) {
                messageInput.style.borderColor = '#ef4444';
            } else {
                messageInput.style.borderColor = '';
            }
        });
        
        // Validate on blur
        messageInput.addEventListener('blur', () => {
            const validation = validateMessageClient(messageInput.value);
            if (!validation.valid && messageInput.value.trim().length > 0) {
                messageInput.style.borderColor = '#ef4444';
            } else {
                messageInput.style.borderColor = '';
            }
        });
        
        // Check scroll position
        messagesContainer.addEventListener('scroll', checkScrollPosition);
    }
    
    function checkScrollPosition() {
        const threshold = 50;
        const scrollTop = messagesContainer.scrollTop;
        const scrollHeight = messagesContainer.scrollHeight;
        const clientHeight = messagesContainer.clientHeight;
        
        isAtBottom = (scrollHeight - scrollTop - clientHeight) <= threshold;
    }
    
    function scrollToBottom(smooth = true) {
        if (smooth) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    function renderSkeleton() {
        const skeletonCount = 5;
        messagesContainer.innerHTML = '';
        
        for (let i = 0; i < skeletonCount; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'chat-message skeleton-message';
            skeleton.innerHTML = '<div class="chat-avatar skeleton-avatar"></div><div class="chat-message-content flex-1"><div class="chat-message-header"><div class="skeleton-text skeleton-name"></div><div class="skeleton-text skeleton-level"></div></div><div class="skeleton-text skeleton-message"></div></div>';
            messagesContainer.appendChild(skeleton);
        }
    }
    
    function formatTimestamp(timestamp) {
        const now = new Date();
        const msgDate = new Date(timestamp);
        const diffMs = now - msgDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Today
        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return diffMins + ' minute' + (diffMins > 1 ? 's' : '') + ' ago';
        } else if (diffHours < 24 && msgDate.getDate() === now.getDate()) {
            const hours = msgDate.getHours();
            const mins = msgDate.getMinutes();
            return (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
        }
        
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (msgDate.getDate() === yesterday.getDate() && msgDate.getMonth() === yesterday.getMonth()) {
            const hours = msgDate.getHours();
            const mins = msgDate.getMinutes();
            return 'Yesterday ' + (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
        }
        
        // This week
        if (diffDays < 7) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const hours = msgDate.getHours();
            const mins = msgDate.getMinutes();
            return days[msgDate.getDay()] + ' ' + (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
        }
        
        // Older
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const hours = msgDate.getHours();
        const mins = msgDate.getMinutes();
        return months[msgDate.getMonth()] + ' ' + msgDate.getDate() + ', ' + (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
    }
    
    function getAvatarImage(imagePrefix, gender) {
        return assetImgBase + imagePrefix + '-' + (gender || 'male') + '.png';
    }
    
    function renderMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.dataset.uuid = msg.uuid;
        
        const avatarImg = getAvatarImage(msg.class_image_prefix || 'archer', msg.character_gender || 'male');
        const timestamp = formatTimestamp(msg.created_at);
        
        messageDiv.innerHTML = '<div class="chat-avatar"><div class="chat-avatar-inner"><img src="' + avatarImg + '" alt="' + escapeHtml(msg.character_name) + '" onerror="this.src=\'' + assetImgBase + 'avatar.png\'"></div></div><div class="chat-message-content"><div class="chat-message-header"><span class="chat-message-name">' + escapeHtml(msg.character_name) + '</span><span class="chat-message-level">Lvl ' + (msg.character_level || 1) + '</span><span class="chat-message-class">[' + escapeHtml(msg.class_display_name || msg.class_name || 'Adventurer') + ']</span><span class="chat-message-time">' + timestamp + '</span></div><div class="chat-message-text">' + escapeHtml(msg.message) + '</div></div>';
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        messagesContainer.appendChild(messageDiv);
        
        // Fade in animation
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
        
        return messageDiv;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async function loadMessages() {
        if (isLoading) return;
        
        isLoading = true;
        renderSkeleton();
        
        try {
            const response = await fetch(messagesUrl + '?room=' + encodeURIComponent(roomName) + '&limit=100');
            const data = await response.json();
            
            if (data.success && Array.isArray(data.messages)) {
                messagesContainer.innerHTML = '';
                
                if (data.messages.length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.className = 'chat-message system';
                    emptyMsg.innerHTML = '<div class="chat-message-text" style="color: #a8a29e; font-style: italic; text-align: center;">No messages yet. Be the first to say something!</div>';
                    messagesContainer.appendChild(emptyMsg);
                } else {
                    data.messages.forEach(msg => {
                        renderMessage(msg);
                        lastMessageUuid = msg.uuid;
                    });
                    
                    // Scroll to bottom after loading
                    setTimeout(() => {
                        scrollToBottom(false);
                        isAtBottom = true;
                    }, 100);
                }
            } else {
                showError('Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            showError('Error loading messages. Please refresh the page.');
        } finally {
            isLoading = false;
        }
    }
    
    async function pollNewMessages() {
        // Skip if loading initial messages or no last message UUID
        if (isLoading || !lastMessageUuid) return;
        
        // Skip if input is focused and user is typing (reduce unnecessary requests)
        if (document.activeElement === messageInput) {
            return;
        }
        
        try {
            // Use AbortController for timeout (5 seconds max)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(
                pollUrl + '?room=' + encodeURIComponent(roomName) + '&last_uuid=' + encodeURIComponent(lastMessageUuid),
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                // If 404 or other error, don't spam console
                if (response.status !== 404) {
                    console.warn('Polling error:', response.status);
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
                // Track if we need to scroll
                const wasAtBottom = isAtBottom;
                let hasNewMessages = false;
                
                data.messages.forEach(msg => {
                    // Check if message already exists (avoid duplicates)
                    const existing = messagesContainer.querySelector('[data-uuid="' + msg.uuid + '"]');
                    if (!existing) {
                        renderMessage(msg);
                        lastMessageUuid = msg.uuid;
                        hasNewMessages = true;
                    }
                });
                
                // Auto-scroll only if user was at bottom and we have new messages
                if (wasAtBottom && hasNewMessages) {
                    setTimeout(() => scrollToBottom(true), 100);
                }
            }
        } catch (error) {
            // Ignore abort errors (timeout) and network errors silently
            if (error.name !== 'AbortError' && error.name !== 'TypeError') {
                console.warn('Polling error:', error);
            }
        }
    }
    
    function startPolling() {
        if (pollIntervalId) {
            clearInterval(pollIntervalId);
        }
        pollIntervalId = setInterval(pollNewMessages, pollInterval);
    }
    
    function stopPolling() {
        if (pollIntervalId) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
    }
    
    function updateCooldownUI() {
        const now = Date.now();
        if (now < cooldownUntil) {
            const remaining = Math.ceil((cooldownUntil - now) / 1000);
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span>WAIT ' + remaining + 's</span>';
            sendBtn.style.opacity = '0.6';
            sendBtn.style.cursor = 'not-allowed';
        } else {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>SEND</span>';
            sendBtn.style.opacity = '1';
            sendBtn.style.cursor = 'pointer';
        }
    }
    
    function startCooldown(seconds) {
        cooldownUntil = Date.now() + (seconds * 1000);
        updateCooldownUI();
        const interval = setInterval(() => {
            if (Date.now() >= cooldownUntil) {
                clearInterval(interval);
                updateCooldownUI();
            } else {
                updateCooldownUI();
            }
        }, 100);
    }
    
    function validateMessageClient(message) {
        const trimmed = message.trim();
        
        // Empty check
        if (!trimmed || trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        // Length check
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message is too long (max 1000 characters)' };
        }
        
        if (trimmed.length < 1) {
            return { valid: false, error: 'Message is too short' };
        }
        
        // Removed: repeated characters check (allows "kkkkk", "hahaha", etc.)
        // Removed: duplicate message check
        
        return { valid: true, error: '' };
    }
    
    async function handleSend() {
        const message = messageInput.value.trim();
        
        // Client-side validation
        const validation = validateMessageClient(message);
        if (!validation.valid) {
            showError(validation.error);
            messageInput.focus();
            return;
        }
        
        // Check cooldown
        if (Date.now() < cooldownUntil) {
            const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
            showError('Please wait ' + remaining + ' second' + (remaining > 1 ? 's' : '') + ' before sending another message.');
            return;
        }
        
        // Disable input during send
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.innerHTML = '<span>SENDING...</span>';
        
        try {
            const response = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room: roomName,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.message) {
                // Store last sent message for duplicate check (with timestamp)
                
                // Clear input
                messageInput.value = '';
                charCount.textContent = '0';
                charCount.classList.remove('text-red-400');
                
                // Add message locally
                const msgDiv = renderMessage(data.message);
                lastMessageUuid = data.message.uuid;
                
                // Start cooldown (1 second minimum)
                startCooldown(1);
                
                // Scroll to bottom
                setTimeout(() => scrollToBottom(true), 100);
                isAtBottom = true;
            } else {
                // Handle rate limiting with wait time
                if (data.wait_seconds) {
                    startCooldown(data.wait_seconds);
                    showError(data.error || 'Please wait before sending another message.');
                } else {
                    showError(data.error || 'Failed to send message');
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError('Error sending message. Please try again.');
        } finally {
            messageInput.disabled = false;
            updateCooldownUI();
            messageInput.focus();
        }
    }
    
    function showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message system';
        errorDiv.innerHTML = '<div class="chat-message-text" style="color: #ef4444; font-style: italic;">' + escapeHtml(message) + '</div>';
        messagesContainer.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.transition = 'opacity 0.5s ease';
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 500);
        }, 3000);
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        stopPolling();
    });
})();
JSSCRIPT;

// Combine HTML content with scripts
$content = $htmlContent;
include __DIR__ . '/../layouts/game.php';
?>

