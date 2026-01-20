<style>
    /* Premium Fonts Setup */
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

    :root {
        --card-border-color: #8a6d3b;
        --card-hover-border: #f2d16b;
        --gold-glow: rgba(242, 209, 107, 0.6);
    }

    body {
        font-family: 'Inter', sans-serif;
    }
    
    .city-title {
        font-family: 'Cinzel', serif;
        letter-spacing: 0.05em;
        text-shadow: 0 4px 10px rgba(0,0,0,0.8);
    }

    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #3f3f46;
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #52525b;
    }

    /* Background & Fog */
    .background-city-container {
        position: fixed;
        top: 0;
        left: 260px;
        right: 0;
        width: calc(100% - 260px);
        height: 100vh;
        z-index: -10;
        overflow: hidden;
    }
    .background-city-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        transform: scale(1.05); /* Slight zoom for parallax feel later if needed */
    }
    .background-city-gradient {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.2) 0%,
            transparent 40%,
            rgba(0,0,0,0.6) 80%,
            #000 100%
        );
        pointer-events: none;
    }

    /* Fog Animation */
    .fog-layer {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 200%;
        height: 100%;
        background: url('assets/img/fog-texture.png') repeat-x; /* Fallback or procedural */
        background-size: 50% 100%;
        opacity: 0.3;
        z-index: 1;
        pointer-events: none;
        /* Using a gradient if image missing works too */
        background: linear-gradient(to right, transparent 0%, rgba(200, 200, 200, 0.05) 50%, transparent 100%);
    }
    .fog-layer-1 {
        animation: fogMove 60s linear infinite;
    }
    .fog-layer-2 {
        animation: fogMove 40s linear infinite reverse;
        opacity: 0.2;
    }
    @keyframes fogMove {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }

    /* Premium Buttons */
    .premium-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center; /* Centering text */
        padding: 0.5rem 1rem;
        background: rgba(28, 25, 23, 0.8);
        border: 1px solid rgba(212, 175, 55, 0.3);
        border-radius: 8px;
        color: #d4af37;
        font-family: 'Cinzel', serif;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    .premium-btn:hover {
        background: rgba(40, 35, 30, 0.9);
        border-color: #f2d16b;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
        transform: translateY(-1px);
        text-shadow: 0 0 8px rgba(242, 209, 107, 0.6);
    }

    /* RPG Cards - "Living Card" System */
    .rpg-card {
        background-color: #1a1a1a; /* Fallback */
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        border-radius: 12px;
        box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(138, 109, 59, 0.5); /* Outer refined border */
        transition: all 0.1s ease-out; /* Fast manual tilt */
        overflow: hidden;
        width: 100%;
        height: 380px;
        transform-style: preserve-3d;
        cursor: pointer;
    }

    /* Specific Backgrounds */
    .rpg-card.tavern { background-image: url('assets/img/tavern.webp'); }
    .rpg-card.market { background-image: url('assets/img/market.webp'); }
    .rpg-card.forge { background-image: url('assets/img/forge.webp'); }
    .rpg-card.guild { background-image: url('assets/img/guild.webp'); }

    /* Inner Wrapper ensures content stays readable */
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
    
    /* Hover Glow Overlay */
    .rpg-card::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(
            circle at var(--glare-pos-x, 50%) var(--glare-pos-y, 50%), 
            rgba(255, 255, 255, 0.15), 
            transparent 40%
        );
        opacity: 0;
        z-index: 10;
        pointer-events: none;
        transition: opacity 0.3s ease;
        mix-blend-mode: overlay;
    }
    .rpg-card.active-tilt::after {
        opacity: 1;
    }

    .rpg-card:hover .card-content-wrapper {
        background: linear-gradient(
            to bottom,
            rgba(0,0,0,0) 0%,
            rgba(0,0,0,0.3) 40%,
            rgba(0,0,0,0.95) 100%
        );
    }

    /* Borders */
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
        width: 30px; /* Slight resize ok */
        height: 30px;
        opacity: 1;
        /* box-shadow: 0 0 10px var(--gold-glow); REMOVED AS PER REQUEST */
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

    /* Content Typography */
    .rpg-card-title {
        font-family: 'Cinzel', serif;
        font-size: 2.2rem;
        font-weight: 700;
        color: #f2d16b;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0,0,0,0.9);
        transform: translateZ(20px); /* 3D pop */
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

    /* Action Hint Button */
    .card-action-hint {
        margin: 1.5rem auto 0; /* Centered with top margin */
        width: 80%; /* Prevent full width */
        padding: 0.5rem 1rem;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(0,0,0,0.6);
        color: #fff;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        border-radius: 100px;
        opacity: 0;
        transform: translateY(10px) translateZ(10px);
        transition: all 0.3s ease;
        text-align: center;
    }
    .rpg-card:hover .card-action-hint {
        opacity: 1;
        transform: translateY(0) translateZ(30px);
        background: rgba(212, 175, 55, 0.2);
        border-color: #f2d16b;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    }

    /* --- SIDEBAR HUD STYLES --- */
    .sidebar-hud {
        /* Richer background with depth */
        background: 
            linear-gradient(to bottom, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%);
        box-shadow: 5px 0 30px rgba(0,0,0,0.5);
        position: relative; /* For pseudo-element absolute positioning */
        backdrop-filter: blur(12px); /* Glass effect */
    }
    
    /* Top "Bloom" light effect behind Avatar */
    .sidebar-hud::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 300px;
        background: radial-gradient(
            circle at 50% -20%, 
            rgba(212, 175, 55, 0.08) 0%, 
            transparent 70%
        );
        pointer-events: none;
        z-index: 0;
    }

    .sidebar-hud::after {
        content: '';
        position: absolute;
        top: 0; 
        bottom: 0; 
        right: 0;
        width: 1px;
        background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(212, 175, 55, 0.1) 10%, 
            rgba(212, 175, 55, 0.6) 50%, 
            rgba(212, 175, 55, 0.1) 90%, 
            transparent 100%
        );
        box-shadow: 0 0 4px rgba(212, 175, 55, 0.2);
        z-index: 50;
    }

    .cinematic-avatar-frame {
        width: 110px; /* Increased from 80px */
        height: 110px;
        border-radius: 50%;
        padding: 3px;
        background: linear-gradient(135deg, #d4af37 0%, #8a6d3b 100%);
        box-shadow: 0 0 25px rgba(212, 175, 55, 0.2); /* Soft glow around avatar */
        position: relative;
        z-index: 1; /* Above the background bloom */
    }
    /* --- AVATAR & PROFILE JUMP --- */
    /* .profile-glass-card removed by user request for cleaner look */

    .level-badge {
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #d4af37, #8a6d3b);
        color: #000;
        font-weight: 800;
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        border: 1px solid #ffebcd;
        font-family: 'Inter', sans-serif;
        z-index: 10;
        white-space: nowrap;
    }

    .stat-icon {
        filter: drop-shadow(0 0 5px currentColor);
    }
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8), transparent 70%);
        opacity: 0.4;
    }
    .cinematic-avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid #000;
        object-fit: cover;
    }

    /* --- NAVIGATION SECTIONS --- */
    .nav-section-header {
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        color: rgba(212, 175, 55, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        padding-left: 1.5rem;
        position: relative;
    }
    .nav-section-header::after {
        content: '';
        position: absolute;
        left: 0.5rem;
        top: 50%;
        width: 4px;
        height: 4px;
        background: #d4af37;
        transform: rotate(45deg);
        opacity: 0.4;
    }

    .hud-nav-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 1.5rem;
        color: #9ca3af;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        letter-spacing: 0.03em;
        position: relative;
        overflow: hidden; /* For pulse effect */
    }
    
    /* Hover State - Runic Glow */
    .hud-nav-item:hover {
        background: linear-gradient(to right, rgba(212, 175, 55, 0.08), transparent);
        color: #f2d16b;
        text-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
    }
    
    /* Active State - Gem Indicator */
    .hud-nav-item.active {
        background: linear-gradient(to right, rgba(212, 175, 55, 0.15), transparent);
        color: #d4af37;
        border-left-color: transparent; /* Replacing border with gem */
    }
    .hud-nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        background: #d4af37;
        box-shadow: 0 0 10px #d4af37;
        border-radius: 0 4px 4px 0;
    }
    /* Particle Sparkle on Active/Hover (Pseudo) */
    .hud-nav-item.active::after,
    .hud-nav-item:hover::after {
        content: '';
        position: absolute;
        right: 1.5rem;
        width: 6px;
        height: 6px;
        background: #f2d16b;
        border-radius: 50%;
        box-shadow: 0 0 10px #f2d16b;
        animation: pulseGem 2s infinite;
    }

    @keyframes pulseGem {
        0% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.8); opacity: 0.5; }
    }

    .hud-nav-icon {
        width: 1.15rem;
        height: 1.15rem;
        transition: all 0.3s ease;
    }
    .hud-nav-item:hover .hud-nav-icon,
    .hud-nav-item.active .hud-nav-icon {
        filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.6));
        transform: scale(1.1);
        color: #fff;
    }

    /* Slim Stat Bars */
    .slim-stat-container {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-top: 0.25rem;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
    }
    .slim-stat-fill {
        height: 100%;
        border-radius: 3px;
        position: relative;
    }
    .slim-stat-fill::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 50%;
        background: rgba(255,255,255,0.2);
    }
    .hp-fill { background: linear-gradient(to right, #7f1d1d, #ef4444); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
    .mana-fill { background: linear-gradient(to right, #1e3a8a, #3b82f6); box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
    .xp-fill { background: linear-gradient(to right, #14532d, #22c55e); box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }

    .card-icon {
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }

    /* Sidebar and other global styles restored */
    .sidebar-background {
        background-image: url('assets/img/sidebar.webp');
        background-repeat: repeat;
    }
    .stat-bar-container {
        position: relative;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
    }
    .stat-bar-fill {
        position: relative;
        height: 100%;
        border-radius: 3px;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        transition: width 0.5s ease;
    }
    .stat-bar-fill::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
        animation: shine 2s infinite;
    }
    @keyframes shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
    }

    .hp-bar { background: linear-gradient(90deg, #dc2626, #f87171); }
    .mana-bar { background: linear-gradient(90deg, #2563eb, #60a5fa); }
    .xp-bar { background: linear-gradient(90deg, #16a34a, #4ade80); }

    .nav-item {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateX(2px);
    }
    .nav-item.active {
        background: rgba(212, 175, 55, 0.15);
        border-color: rgba(212, 175, 55, 0.4);
        box-shadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(212,175,55,0.2);
    }
    .nav-item.active::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #d4af37 0%, #b8954d 100%);
        border-radius: 0 3px 3px 0;
        box-shadow: 0 0 12px rgba(212,175,55,0.6);
    }
    .nav-item.active .nav-icon, .nav-item.active span {
        color: #f2d16b;
        font-weight: 600;
    }
    .nav-icon { transition: all 0.3s ease; }
    .nav-item:hover .nav-icon { transform: translateX(2px); }

    .stat-label { font-weight: 700; text-shadow: 0 0 8px currentColor; letter-spacing: 0.5px; }
    .stat-value { font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.8); letter-spacing: 0.5px; }
    .character-name { font-weight: 700; text-shadow: 0 0 10px rgba(255,255,255,0.5); letter-spacing: 1px; }
    .character-class { font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.8); letter-spacing: 0.5px; }

    /* Avatar Restored */
    .character-avatar-frame {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        border: 3px solid #d4af37;
        background: linear-gradient(135deg, #1e3a5f 0%, #0f1f2e 100%);
        position: relative;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.1);
        overflow: hidden;
        flex-shrink: 0;
        transition: all 0.3s ease;
        padding: 2px;
    }
    .character-avatar-inner {
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    }
    .character-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
</style>

