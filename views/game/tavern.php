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
$questStartUrl = url('game/quest/start');
$assetImgBase = asset('img/');

// Escape for JavaScript
$roomNameJs = htmlspecialchars($roomName, ENT_QUOTES, 'UTF-8');
$sendUrlJs = htmlspecialchars($sendUrl, ENT_QUOTES, 'UTF-8');
$messagesUrlJs = htmlspecialchars($messagesUrl, ENT_QUOTES, 'UTF-8');
$pollUrlJs = htmlspecialchars($pollUrl, ENT_QUOTES, 'UTF-8');
$questStartUrlJs = htmlspecialchars($questStartUrl, ENT_QUOTES, 'UTF-8');
$assetImgBaseJs = htmlspecialchars($assetImgBase, ENT_QUOTES, 'UTF-8');

// Prepare CSS with image path
$tavernFooterImg = asset('img/tavern-footer.webp');
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

.video-hero-container {
    background: #000;
    overflow: hidden;
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
}
.video-hero-wrapper {
    position: relative;
    width: 100%;
    max-width: 1500px;
    aspect-ratio: 1500 / 630; /* Proportional to the video dimensions provided */
    margin: 0 auto;
}
.video-side-gradient {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 30%; /* Even more coverage for ultra-wide screens */
    z-index: 11;
    pointer-events: none;
}
.gradient-left {
    left: -2px;
    background: linear-gradient(to right, #000 0%, #000 15%, transparent 100%);
}
.gradient-right {
    right: -2px;
    background: linear-gradient(to left, #000 0%, #000 15%, transparent 100%);
}
.video-bottom-gradient {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 25%; /* Reduced height to stop "capping" the lighting */
    background: linear-gradient(to top, #000 0%, transparent 100%);
    z-index: 10;
    pointer-events: none;
}

/* Wide screen specific framing */
@media (min-width: 1401px) {
    .video-hero-wrapper video {
        object-fit: contain !important;
        transform: scale(1.2);
    }
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
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.chat-input:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}
.chat-input.input-error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) !important;
}
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.chat-input.shake-animation {
    animation: shake 0.5s ease-in-out;
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
#chat-send-btn {
    white-space: nowrap !important;
    overflow: hidden !important;
    width: 140px !important;
    min-width: 140px !important;
    max-width: 140px !important;
}
#chat-send-btn span {
    white-space: nowrap !important;
    display: inline-block !important;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
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

/* ===== QUEST BOARD PREMIUM STYLES ===== */
.quest-board-header {
    background: linear-gradient(180deg, rgba(20, 15, 10, 0.6) 0%, transparent 100%);
}

/* Quest Tabs */
.quest-tab {
    color: rgba(255, 255, 255, 0.4);
    background: transparent;
    border: none;
    cursor: pointer;
}
.quest-tab:hover {
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.05);
}
.quest-tab.active {
    color: #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.1);
}

/* Quest Card */
.quest-card {
    position: relative;
    background: rgba(15, 12, 8, 0.8);
    border: 1px solid rgba(138, 109, 59, 0.2);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.quest-card:hover {
    border-color: rgba(251, 191, 36, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(251, 191, 36, 0.1);
}
.quest-card-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 0% 0%, rgba(251, 191, 36, 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
}
.quest-card:hover .quest-card-glow {
    opacity: 1;
}
.quest-card-inner {
    display: flex;
    gap: 0;
}
.quest-card-image {
    position: relative;
    width: 180px; /* Increased for widescreen feel */
    aspect-ratio: 3 / 2; /* Matches 1536x1024 */
    flex-shrink: 0;
    overflow: hidden;
}
.quest-card-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 50%, rgba(15, 12, 8, 1) 100%);
}
.quest-card-content {
    flex: 1;
    padding: 1rem 1.25rem;
    min-width: 0;
}
.quest-card-title {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    font-weight: 700;
    color: #f7e8c3;
    line-height: 1.2;
}
.quest-card-desc {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Quest Rewards */
.quest-reward {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.7rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
}
.quest-reward-xp {
    background: rgba(52, 211, 153, 0.1);
    border-color: rgba(52, 211, 153, 0.2);
    color: #34d399;
}
.quest-reward-gold {
    background: rgba(251, 191, 36, 0.1);
    border-color: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
}
.quest-reward-special {
    background: rgba(168, 85, 247, 0.1);
    border-color: rgba(168, 85, 247, 0.2);
    color: #a855f7;
}

/* Accept Button */
.quest-accept-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
    border: none;
    border-radius: 0.5rem;
    color: #000;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}
.quest-accept-btn:hover {
    background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
}

/* Quest List Scrollbar */
.quest-list {
    scrollbar-width: thin;
    scrollbar-color: rgba(212, 175, 55, 0.4) rgba(20, 15, 10, 0.3);
}
.quest-list::-webkit-scrollbar {
    width: 6px;
}
.quest-list::-webkit-scrollbar-track {
    background: rgba(20, 15, 10, 0.3);
    border-radius: 3px;
}
.quest-list::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.4);
    border-radius: 3px;
}
.quest-list::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.6);
}

/* Ambient Firelight Effect */
.quest-board-container {
    position: relative;
}
.quest-board-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 150px;
    background: radial-gradient(ellipse at 50% -50%, rgba(251, 191, 36, 0.08) 0%, transparent 70%);
    pointer-events: none;
    animation: fireflicker 4s ease-in-out infinite;
}
@keyframes fireflicker {
    0%, 100% { opacity: 0.6; }
    25% { opacity: 0.8; }
    50% { opacity: 0.5; }
    75% { opacity: 0.9; }
}
CSS;

ob_start();
?>

<!-- Footer Background Fixo -->
<div class="tavern-footer-bg"></div>

<div class="flex h-screen main-content-wrapper relative z-10 overflow-hidden">
    
    <?php include __DIR__ . '/../partials/sidebar.php'; ?>

    <!-- Área Principal -->
    <main class="flex-1 ml-[280px] flex flex-col h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        <!-- Hero Section com Vídeo Proporcional -->
        <div class="video-hero-container">
            <div class="video-hero-wrapper">
                <!-- Side Gradients -->
                <div class="video-side-gradient gradient-left"></div>
                <div class="video-side-gradient gradient-right"></div>
                <div class="video-bottom-gradient"></div>

                <video 
                    autoplay 
                    muted 
                    loop 
                    playsinline 
                    class="w-full h-full object-cover"
                >
                    <source src="<?= asset('video/tavern.webm') ?>" type="video/webm">
                </video>
            </div>
            
            <!-- Header Superior (Absolute) -->
            <header class="absolute top-0 left-0 right-0 h-24 z-20 pt-6 px-8">
                <div class="max-w-7xl mx-auto flex items-center justify-between">

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
                </div>
            </header>
        </div>

        <!-- Área Principal -->
        <div class="flex-1 p-8 relative z-20" style="display: flex; flex-direction: column;">
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
                                    <button id="chat-send-btn" class="tavern-button text-sm px-4" style="width: 140px; min-width: 140px; max-width: 140px; text-align: center; display: inline-flex; justify-content: center; align-items: center; box-sizing: border-box; white-space: nowrap; overflow: hidden;">
                                        <span style="white-space: nowrap; display: inline-block;">SEND</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Coluna Direita: Quest Board -->
                    <div class="col-span-7">
                        <div class="tavern-panel p-0 flex flex-col quest-board-container" style="height: 60vh; min-height: 500px; max-height: 60vh; overflow: hidden;">
                            
                            <!-- Quest Board Header with Tabs -->
                            <div class="quest-board-header px-5 py-4 border-b border-amber-900/30">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/30">
                                            <i data-lucide="scroll-text" class="w-5 h-5 text-amber-200"></i>
                                        </div>
                                        <div>
                                            <h2 class="text-lg font-bold text-amber-100 font-serif">Quest Board</h2>
                                            <p class="text-[10px] text-amber-600/80 uppercase tracking-widest">Stormhaven Chapter</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                            3 Available
                                        </span>
                                    </div>
                                </div>
                                
                                <!-- Tabs -->
                                <div class="flex gap-1 bg-black/20 p-1 rounded-xl">
                                    <button class="quest-tab active flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                                        <i data-lucide="sword" class="w-3.5 h-3.5 inline mr-1.5"></i>Quests
                                    </button>
                                    <button class="quest-tab flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                                        <i data-lucide="message-circle" class="w-3.5 h-3.5 inline mr-1.5"></i>Rumors
                                    </button>
                                    <button class="quest-tab flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                                        <i data-lucide="skull" class="w-3.5 h-3.5 inline mr-1.5"></i>Bounties
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Quests List -->
                            <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar quest-list">
                                
                                <!-- Quest 1: First Steps (Tutorial) -->
                                <div class="quest-card quest-card-tutorial group">
                                    <div class="quest-card-glow"></div>
                                    <div class="quest-card-inner">
                                        <!-- Quest Image -->
                                        <div class="quest-card-image">
                                            <img src="<?= asset('quests/first-steps.png') ?>" alt="First Steps" class="absolute inset-0 w-full h-full object-cover">
                                            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-blue-500/80 text-[9px] font-black text-white uppercase tracking-wider">
                                                Tutorial
                                            </div>
                                        </div>
                                        
                                        <!-- Quest Content -->
                                        <div class="quest-card-content">
                                            <div class="flex items-start justify-between gap-2 mb-2">
                                                <h3 class="quest-card-title">First Steps</h3>
                                                <div class="flex items-center gap-1 shrink-0">
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <span class="text-[10px] font-bold text-amber-400/80">Easy</span>
                                                </div>
                                            </div>
                                            
                                            <p class="quest-card-desc">Learn the basics of combat and exploration. Master your first sword techniques.</p>
                                            
                                            <!-- Rewards -->
                                            <div class="flex items-center gap-3 mt-3">
                                                <div class="quest-reward quest-reward-xp">
                                                    <i data-lucide="sparkles" class="w-3 h-3"></i>
                                                    <span>50 XP</span>
                                                </div>
                                                <div class="quest-reward">
                                                    <i data-lucide="clock" class="w-3 h-3"></i>
                                                    <span>~15 min</span>
                                                </div>
                                            </div>
                                            
                                            <!-- Action -->
                                            <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <span class="text-[10px] text-white/30">Story</span>
                                                <button class="quest-accept-btn" data-quest-id="first-steps">
                                                    <span>Accept</span>
                                                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Quest 2: Join the Guild -->
                                <div class="quest-card quest-card-main group">
                                    <div class="quest-card-glow"></div>
                                    <div class="quest-card-inner">
                                        <div class="quest-card-image">
                                            <div class="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-rose-900"></div>
                                            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-500/80 text-[9px] font-black text-black uppercase tracking-wider">
                                                Main Quest
                                            </div>
                                        </div>
                                        
                                        <div class="quest-card-content">
                                            <div class="flex items-start justify-between gap-2 mb-2">
                                                <h3 class="quest-card-title">Join the Guild</h3>
                                                <div class="flex items-center gap-1 shrink-0">
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <span class="text-[10px] font-bold text-amber-400/80">Medium</span>
                                                </div>
                                            </div>
                                            
                                            <p class="quest-card-desc">Enlist as an official adventurer. Prove your worth to the Guild Master.</p>
                                            
                                            <div class="flex items-center gap-3 mt-3">
                                                <div class="quest-reward quest-reward-gold">
                                                    <i data-lucide="coins" class="w-3 h-3"></i>
                                                    <span>100 Gold</span>
                                                </div>
                                                <div class="quest-reward quest-reward-special">
                                                    <i data-lucide="key" class="w-3 h-3"></i>
                                                    <span>Guild Access</span>
                                                </div>
                                            </div>
                                            
                                            <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <span class="text-[10px] text-amber-500/60">Requires: First Steps</span>
                                                <button class="quest-accept-btn" data-quest-id="join-the-guild">
                                                    <span>Accept</span>
                                                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Quest 3: A Knight's Duty -->
                                <div class="quest-card quest-card-combat group">
                                    <div class="quest-card-glow"></div>
                                    <div class="quest-card-inner">
                                        <div class="quest-card-image">
                                            <div class="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-900"></div>
                                            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-red-500/80 text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                                                <i data-lucide="swords" class="w-2.5 h-2.5"></i>Combat
                                            </div>
                                        </div>
                                        
                                        <div class="quest-card-content">
                                            <div class="flex items-start justify-between gap-2 mb-2">
                                                <h3 class="quest-card-title">A Knight's Duty</h3>
                                                <div class="flex items-center gap-1 shrink-0">
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                                    <span class="text-[10px] font-bold text-red-400/80">Hard</span>
                                                </div>
                                            </div>
                                            
                                            <p class="quest-card-desc">Patrol the city gates and protect citizens from bandit raids.</p>
                                            
                                            <div class="flex flex-wrap items-center gap-2 mt-3">
                                                <div class="quest-reward quest-reward-xp">
                                                    <i data-lucide="sparkles" class="w-3 h-3"></i>
                                                    <span>120 XP</span>
                                                </div>
                                                <div class="quest-reward quest-reward-gold">
                                                    <i data-lucide="coins" class="w-3 h-3"></i>
                                                    <span>75 Gold</span>
                                                </div>
                                                <div class="quest-reward quest-reward-special">
                                                    <i data-lucide="medal" class="w-3 h-3"></i>
                                                    <span>Favor</span>
                                                </div>
                                            </div>
                                            
                                            <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <span class="text-[10px] text-white/30">Warriors, Paladins</span>
                                                <button class="quest-accept-btn" data-quest-id="knights-duty">
                                                    <span>Accept</span>
                                                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                                </button>
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

        <div class="flex justify-end px-8 pb-6">
            <button id="dev-quest-link" class="text-[10px] text-white/20 hover:text-white/50 uppercase tracking-widest">
                test-dev
            </button>
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
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.chat-input:focus {
    outline: none;
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
}
.chat-input.input-error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) !important;
}
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
.chat-input.shake-animation {
    animation: shake 0.5s ease-in-out;
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
#chat-send-btn {
    white-space: nowrap !important;
    overflow: hidden !important;
    width: 140px !important;
    min-width: 140px !important;
    max-width: 140px !important;
}
#chat-send-btn span {
    white-space: nowrap !important;
    display: inline-block !important;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
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

// Capture the quest preview modal content
ob_start();
include __DIR__ . '/../partials/modals/quest_preview.php';
$htmlContent .= ob_get_clean();

// Define JavaScript with escaped variables using heredoc (normal, not nowdoc)
$additionalScripts = <<<JSSCRIPT
(function() {
    'use strict';
    
    const roomName = '{$roomNameJs}';
    const sendUrl = '{$sendUrlJs}';
    const messagesUrl = '{$messagesUrlJs}';
    const pollUrl = '{$pollUrlJs}';
    const questStartUrl = '{$questStartUrlJs}';
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
    
    // Fix button width to prevent flicker and text breaking
    if (sendBtn) {
        sendBtn.style.width = '140px';
        sendBtn.style.minWidth = '140px';
        sendBtn.style.maxWidth = '140px';
        sendBtn.style.textAlign = 'center';
        sendBtn.style.display = 'inline-flex';
        sendBtn.style.justifyContent = 'center';
        sendBtn.style.alignItems = 'center';
        sendBtn.style.boxSizing = 'border-box';
        sendBtn.style.flexShrink = '0';
        sendBtn.style.whiteSpace = 'nowrap';
        sendBtn.style.overflow = 'hidden';
        
        // Fix span inside button
        const span = sendBtn.querySelector('span');
        if (span) {
            span.style.whiteSpace = 'nowrap';
            span.style.display = 'inline-block';
        }
    }
    
    // Quest Data (fixed)
    const QUEST_DB = {
        'first-steps': {
            id: 'first-steps',
            title: 'First Steps',
            description: 'Learn the basics of combat and exploration. Master your first sword techniques.',
            type: 'Tutorial',
            difficulty: 'Easy',
            image: '/public/assets/quests/first-steps.png',
            time: '~15 min',
            rewards: [
                { icon: 'sparkles', text: '50 XP' },
                { icon: 'clock', text: '~15 min' }
            ]
        },
        'test-dev': {
            id: 'test-dev',
            title: 'Test Dev',
            description: 'Hidden dev quest for combat testing.',
            type: 'Dev',
            difficulty: 'Easy',
            image: '/public/assets/quests/first-steps.png',
            time: '~5 min',
            rewards: [
                { icon: 'sparkles', text: '0 XP' },
                { icon: 'clock', text: '~5 min' }
            ]
        }
    };

    function openQuestModal(questData) {
        const modal = document.getElementById('quest-preview-modal');
        const backdrop = document.getElementById('quest-preview-backdrop');
        const panel = document.getElementById('quest-preview-panel');
        if (!modal || !panel) return;

        document.getElementById('quest-preview-title').textContent = questData.title;
        document.getElementById('quest-preview-desc').textContent = questData.description;
        document.getElementById('quest-preview-type').textContent = questData.type || 'Quest';
        document.getElementById('quest-preview-image').src = questData.image;
        document.getElementById('quest-preview-difficulty').textContent = questData.difficulty + ' Difficulty';
        document.getElementById('quest-preview-time').textContent = questData.time || '~20 min';

        const starsContainer = document.getElementById('quest-preview-stars');
        starsContainer.innerHTML = '';
        const starCount = questData.difficulty === 'Easy' ? 1 : (questData.difficulty === 'Medium' ? 2 : 3);
        const starColor = questData.difficulty === 'Easy' ? 'text-amber-400' : (questData.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400');
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('i');
            star.setAttribute('data-lucide', 'star');
            star.className = `w-4 h-4 \${starColor} fill-current`;
            starsContainer.appendChild(star);
        }

        const rewardsContainer = document.getElementById('quest-preview-rewards');
        rewardsContainer.innerHTML = '';
        questData.rewards.forEach(reward => {
            const div = document.createElement('div');
            div.className = 'flex items-center gap-3 text-sm';
            div.innerHTML = `
                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-amber-400">
                    <i data-lucide="\${reward.icon}" class="w-4 h-4"></i>
                </div>
                <span class="text-white font-medium">\${reward.text}</span>
            `;
            rewardsContainer.appendChild(div);
        });

        const startBtn = document.getElementById('quest-preview-start-btn');
        startBtn.onclick = () => startQuest(questData.id);

        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            backdrop?.classList.remove('opacity-0');
            panel.classList.remove('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
            panel.classList.add('translate-y-0', 'scale-100');
        });

        lucide.createIcons();
    }

    function closeQuestModal() {
        const modal = document.getElementById('quest-preview-modal');
        const backdrop = document.getElementById('quest-preview-backdrop');
        const panel = document.getElementById('quest-preview-panel');
        if (!modal || !panel) return;

        backdrop?.classList.add('opacity-0');
        panel.classList.add('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
        panel.classList.remove('translate-y-0', 'scale-100');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    async function startQuest(questId) {
        const modalBtn = document.getElementById('quest-preview-start-btn');
        const originalText = modalBtn ? modalBtn.innerHTML : '';

        if (modalBtn) {
            modalBtn.disabled = true;
            modalBtn.innerHTML = '<span>Loading...</span>';
        }

        try {
            const response = await fetch(questStartUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quest_id: questId })
            });

            const data = await response.json();
            if (data.success && data.redirect) {
                window.location.href = data.redirect;
                return;
            }

            alert(data.error || 'Erro ao iniciar quest');
        } catch (error) {
            console.error('Error starting quest:', error);
            alert('Erro ao iniciar quest. Tente novamente.');
        } finally {
            if (modalBtn) {
                modalBtn.disabled = false;
                modalBtn.innerHTML = originalText;
            }
        }
    }

    function setupQuestButtons() {
        const buttons = document.querySelectorAll('.quest-accept-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const questId = btn.dataset.questId;
                const questData = QUEST_DB[questId];
                if (questData) {
                    openQuestModal(questData);
                } else {
                    alert('Quest indisponível.');
                }
            });
        });
    }

    function setupDevQuestLink() {
        const devLink = document.getElementById('dev-quest-link');
        if (!devLink) return;

        devLink.addEventListener('click', (e) => {
            e.preventDefault();
            const questData = QUEST_DB['test-dev'];
            if (questData) {
                openQuestModal(questData);
            }
        });
    }

    window.closeQuestModal = closeQuestModal;
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        setupEventListeners();
        loadMessages();
        setupQuestButtons();
        setupDevQuestLink();
        
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
        
        // Empty check (only check length, don't use !trimmed as it's falsy for "0")
        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        // Length check
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message is too long (max 1000 characters)' };
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
            
            // Clear validation errors when user types
            clearInputValidationError();
            
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
        
        const classMap = {
            swordsman: 'Swordsman',
            archer: 'Archer',
            mage: 'Mage',
            thief: 'Thief',
            acolyte: 'Acolyte',
            blacksmith: 'Blacksmith',
            beast_tamer: 'Beast Tamer'
        };
        const classLabel = classMap[msg.class_name] || msg.class_name || 'Adventurer';
        messageDiv.innerHTML = '<div class="chat-avatar"><div class="chat-avatar-inner"><img src="' + avatarImg + '" alt="' + escapeHtml(msg.character_name) + '" onerror="this.src=\'' + assetImgBase + 'avatar.png\'"></div></div><div class="chat-message-content"><div class="chat-message-header"><span class="chat-message-name">' + escapeHtml(msg.character_name) + '</span><span class="chat-message-level">Lvl ' + (msg.character_level || 1) + '</span><span class="chat-message-class">[' + escapeHtml(classLabel) + ']</span><span class="chat-message-time">' + timestamp + '</span></div><div class="chat-message-text">' + escapeHtml(msg.message) + '</div></div>';
        
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
        let span = sendBtn.querySelector('span');
        
        // Ensure span exists with proper styling
        if (!span) {
            span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';
            span.style.display = 'inline-block';
            sendBtn.appendChild(span);
        }
        
        if (now < cooldownUntil) {
            const remaining = Math.ceil((cooldownUntil - now) / 1000);
            sendBtn.disabled = true;
            // Keep everything in one line - no padding needed with fixed width
            span.textContent = 'WAIT ' + remaining + 's';
            span.style.whiteSpace = 'nowrap';
            span.style.display = 'inline-block';
            sendBtn.style.opacity = '0.6';
            sendBtn.style.cursor = 'not-allowed';
        } else {
            sendBtn.disabled = false;
            span.textContent = 'SEND';
            span.style.whiteSpace = 'nowrap';
            span.style.display = 'inline-block';
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
        
        // Empty check (only check length, don't use !trimmed as it's falsy for "0")
        if (trimmed.length === 0) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        // Length check
        if (trimmed.length > 1000) {
            return { valid: false, error: 'Message is too long (max 1000 characters)' };
        }
        
        // Removed: repeated characters check (allows "kkkkk", "hahaha", etc.)
        // Removed: duplicate message check
        
        return { valid: true, error: '' };
    }
    
    async function handleSend() {
        const message = messageInput.value.trim();
        
        // Client-side validation (visual feedback, no chat message)
        const validation = validateMessageClient(message);
        if (!validation.valid) {
            showInputValidationError(validation.error);
            messageInput.focus();
            return;
        }
        
        // Clear any validation errors
        clearInputValidationError();
        
        // Check cooldown (silent - button already shows countdown)
        if (Date.now() < cooldownUntil) {
            return;
        }
        
        // Disable input during send
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        // Use textContent on span for better performance and no flicker
        let span = sendBtn.querySelector('span');
        if (!span) {
            span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';
            span.style.display = 'inline-block';
            sendBtn.appendChild(span);
        }
        span.textContent = 'SENDING...';
        span.style.whiteSpace = 'nowrap';
        span.style.display = 'inline-block';
        
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
                // Handle rate limiting with wait time (silent - button already shows countdown)
                if (data.wait_seconds) {
                    startCooldown(data.wait_seconds);
                    // Don't show error message - button countdown is enough
                } else {
                    // Only show error for actual failures (not rate limiting)
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
    
    function showInputValidationError(errorType) {
        // Visual feedback on input - no chat message
        messageInput.classList.add('input-error');
        messageInput.classList.add('shake-animation');
        
        // Remove shake animation after it completes
        setTimeout(() => {
            messageInput.classList.remove('shake-animation');
        }, 500);
        
        // Auto-remove error state after 2 seconds
        setTimeout(() => {
            clearInputValidationError();
        }, 2000);
    }
    
    function clearInputValidationError() {
        messageInput.classList.remove('input-error');
        messageInput.classList.remove('shake-animation');
    }
    
    function showError(message) {
        // Only show errors for actual failures (not validation)
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

