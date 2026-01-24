<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title><?= htmlspecialchars($data['pageTitle'] ?? 'Táticas') ?> | RPG</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="<?= asset('css/dialogue-system.css') ?>">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #0a0a0f;
            color: #e2e8f0;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
            touch-action: none;
        }
        .font-display { font-family: 'Cinzel', serif; }

        /* Canvas */
        #map-container { position: fixed; inset: 0; z-index: 0; }
        #map-canvas { display: block; width: 100%; height: 100%; cursor: grab; position: relative; z-index: 1; }
        #map-canvas:active { cursor: grabbing; }

        /* Top HUD */
        .top-hud {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 70px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.6), transparent);
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding: 12px 1rem;
            z-index: 100;
            pointer-events: none;
        }
        .top-hud > * { pointer-events: auto; }

        /* Audio Controls */
        .audio-controls {
            display: flex;
            gap: 0.5rem;
            padding: 12px 16px;
        }
        .audio-btn {
            background: rgba(15, 15, 25, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            color: #e2e8f0;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .audio-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        .audio-btn.muted {
            opacity: 0.5;
        }
        .audio-btn i {
            width: 18px;
            height: 18px;
        }

        /* Top Banner (Genérico para todas as mensagens) */
        .top-banner {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 150;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .top-banner.visible {
            opacity: 1;
            visibility: visible;
        }
        .top-banner.warning {
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }
        .top-banner.info {
            border-color: rgba(96, 165, 250, 0.4);
            color: #bfdbfe;
        }

        .hud-panel {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(15, 15, 25, 0.95);
            backdrop-filter: blur(12px);
            padding: 0.5rem 1rem;
            border-radius: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .turn-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            font-size: 11px;
            padding: 5px 12px;
            border-radius: 6px;
            letter-spacing: 0.05em;
            text-shadow: 0 1px 0 rgba(255,255,255,0.3);
        }

        .phase-indicator {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            padding: 5px 10px;
            border-radius: 6px;
        }
        .phase-player { background: rgba(96, 165, 250, 0.2); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); }
        .phase-enemy { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

        .units-count {
            font-family: 'Cinzel', serif;
            font-size: 12px;
            color: #94a3b8;
        }
        .units-count span { color: #60a5fa; font-weight: 700; }

        /* Unit Action Menu */
        .action-menu {
            position: fixed;
            background: rgba(15, 15, 25, 0.98);
            backdrop-filter: blur(16px);
            padding: 0.5rem;
            border-radius: 1rem;
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            z-index: 200;
            min-width: 140px;
            opacity: 0;
            transform: scale(0.9) translateY(10px);
            pointer-events: none;
            transition: all 0.2s ease;
        }
        .action-menu.visible {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: auto;
        }

        /* ===============================================
           TACTICAL HUD (FFT Style) - Centro Inferior
           =============================================== */
        /* ============================================== */
        /* TACTICAL HUD - ULTRA PREMIUM REDESIGN 2026   */
        /* ============================================== */
        
        .tactical-hud {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(120%);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .tactical-hud.hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            transform: translateX(-50%) translateY(120%) !important;
        }

        .tactical-hud.visible {
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
            transform: translateX(-50%) translateY(0) !important;
        }

        .tactical-hud-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            background: linear-gradient(180deg, 
                rgba(15, 23, 42, 0.97) 0%, 
                rgba(10, 15, 30, 0.99) 50%,
                rgba(5, 10, 20, 1) 100%
            );
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 25px 80px -20px rgba(0, 0, 0, 0.9),
                0 0 100px -20px rgba(59, 130, 246, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
            overflow: hidden;
            position: relative;
            padding: 0.75rem 1.5rem;
        }
        
        /* Animated border glow */
        .tactical-hud-inner::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 26px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(59, 130, 246, 0.3) 25%,
                rgba(168, 85, 247, 0.3) 50%,
                rgba(236, 72, 153, 0.3) 75%,
                transparent 100%
            );
            background-size: 200% 100%;
            animation: borderShimmer 4s linear infinite;
            z-index: -1;
            opacity: 0.6;
        }
        
        @keyframes borderShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Top highlight line */
        .tactical-hud-inner::after {
            content: '';
            position: absolute;
            top: 0;
            left: 20%;
            right: 20%;
            height: 1px;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(255, 255, 255, 0.4), 
                rgba(255, 220, 100, 0.6),
                rgba(255, 255, 255, 0.4), 
                transparent
            );
        }

        /* === UNIT INFO SECTION === */
        .unit-info-compact {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.03) 0%, transparent 100%);
            border-right: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
            min-width: 240px;
        }
        
        /* Character portrait frame */
        .unit-portrait-frame {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%);
            border: 2px solid;
            border-image: linear-gradient(135deg, #ffd700, #ff8c00, #ffd700) 1;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 
                0 4px 20px rgba(0, 0, 0, 0.5),
                inset 0 0 20px rgba(255, 215, 0, 0.05);
        }
        
        .unit-portrait-frame::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%);
            pointer-events: none;
            z-index: 2;
        }
        
        .unit-portrait-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
        }
        
        /* Level badge */
        .unit-level-badge {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 22px;
            height: 22px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cinzel', serif;
            font-size: 10px;
            font-weight: 900;
            color: #000;
            border: 2px solid #0a0a15;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
            z-index: 3;
        }

        .unit-info-details {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }

        .unit-info-compact .unit-name {
            font-family: 'Cinzel', serif;
            font-weight: 900;
            font-size: 1.15rem;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4a 50%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: none;
            filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
            letter-spacing: 0.5px;
            line-height: 1.2;
        }

        /* HP/MP Bars Container - HUD Tática */
        .hud-bars-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }

        .hud-bar-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .hud-bar-icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            flex-shrink: 0;
        }
        
        .hud-bar-icon.hp { color: #ef4444; }
        .hud-bar-icon.mp { color: #60a5fa; }

        .hud-bar {
            flex: 1;
            height: 18px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 30, 0.8) 100%);
            border-radius: 9px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
                inset 0 2px 8px rgba(0, 0, 0, 0.5),
                0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .hud-bar-fill {
            height: 100%;
            border-radius: 8px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .hud-bar-fill.hp {
            background: linear-gradient(180deg, #f87171 0%, #ef4444 40%, #dc2626 100%);
            box-shadow: 
                0 0 15px rgba(239, 68, 68, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        .hud-bar-fill.mp {
            background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%);
            box-shadow: 
                0 0 15px rgba(59, 130, 246, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }
        
        /* Glass shine effect */
        .hud-bar-fill::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 45%;
            background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 100%);
            border-radius: 8px 8px 50% 50%;
        }
        
        /* Animated shine */
        .hud-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: barShine 3s ease-in-out infinite;
        }
        
        @keyframes barShine {
            0%, 100% { left: -100%; }
            50% { left: 150%; }
        }

        .hud-bar-text {
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5);
            letter-spacing: 0.5px;
            z-index: 2;
        }
        
        /* Low HP Animation */
        .hud-bar-fill.hp.low {
            animation: hpCritical 0.6s ease-in-out infinite;
            background: linear-gradient(180deg, #fca5a5 0%, #ef4444 40%, #991b1b 100%);
        }
        
        @keyframes hpCritical {
            0%, 100% { opacity: 1; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
            50% { opacity: 0.7; box-shadow: 0 0 25px rgba(239, 68, 68, 0.8); }
        }

        /* === TACTICAL ACTIONS SECTION === */
        .tactical-actions {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .tactical-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 80px;
            height: 72px;
            background: linear-gradient(180deg, 
                rgba(255, 255, 255, 0.08) 0%, 
                rgba(255, 255, 255, 0.02) 100%
            );
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            color: rgba(255, 255, 255, 0.85);
            font-family: 'Inter', sans-serif;
            font-weight: 700;
            font-size: 0.7rem;
            letter-spacing: 0.02em;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: visible;
        }
        
        .tactical-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
            opacity: 0;
            transition: opacity 0.25s;
        }
        
        .tactical-btn .btn-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.08);
            transition: all 0.25s;
        }
        
        .tactical-btn .btn-icon i {
            width: 18px;
            height: 18px;
        }
        
        /* Hotkey indicator */
        .tactical-btn .hotkey {
            position: absolute;
            top: 4px;
            right: 6px;
            font-size: 8px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.3);
            font-family: 'Inter', sans-serif;
        }

        .tactical-btn:hover:not(:disabled) {
            transform: translateY(-4px) scale(1.02);
            border-color: rgba(255, 255, 255, 0.25);
            box-shadow: 
                0 12px 30px -8px rgba(0, 0, 0, 0.5),
                0 0 20px -5px var(--btn-glow, rgba(255,255,255,0.2));
        }
        
        .tactical-btn:hover:not(:disabled)::before {
            opacity: 1;
        }
        
        .tactical-btn:hover:not(:disabled) .btn-icon {
            transform: scale(1.15);
            background: rgba(255, 255, 255, 0.15);
        }

        .tactical-btn:active:not(:disabled) {
            transform: translateY(1px) scale(0.98);
        }

        .tactical-btn:disabled {
            background: rgba(30, 30, 40, 0.6);
            color: rgba(255, 255, 255, 0.25);
            cursor: not-allowed;
            border-color: rgba(255, 255, 255, 0.03);
        }
        
        .tactical-btn:disabled .btn-icon {
            opacity: 0.4;
        }

        /* Move Button - Emerald */
        .tactical-btn.move {
            --btn-glow: rgba(16, 185, 129, 0.5);
        }
        .tactical-btn.move .btn-icon {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
            color: #34d399;
        }
        .tactical-btn.move:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%);
            border-color: rgba(16, 185, 129, 0.4);
        }
        
        /* Attack Button - Ruby */
        .tactical-btn.attack {
            --btn-glow: rgba(239, 68, 68, 0.5);
        }
        .tactical-btn.attack .btn-icon {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.2));
            color: #f87171;
        }
        .tactical-btn.attack:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%);
            border-color: rgba(239, 68, 68, 0.4);
        }
        
        /* Skills Button - Amethyst */
        .tactical-btn.skills {
            --btn-glow: rgba(168, 85, 247, 0.5);
        }
        .tactical-btn.skills .btn-icon {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(126, 34, 206, 0.2));
            color: #c084fc;
        }
        .tactical-btn.skills:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(168, 85, 247, 0.2) 0%, rgba(126, 34, 206, 0.1) 100%);
            border-color: rgba(168, 85, 247, 0.4);
        }
        
        /* End Turn Button - Gold */
        .tactical-btn.endturn {
            --btn-glow: rgba(234, 179, 8, 0.5);
        }
        .tactical-btn.endturn .btn-icon {
            background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(202, 138, 4, 0.2));
            color: #fbbf24;
        }
        .tactical-btn.endturn:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.1) 100%);
            border-color: rgba(234, 179, 8, 0.4);
        }
        
        /* Active state for buttons */
        .tactical-btn.active {
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
            box-shadow: 
                0 0 20px -5px var(--btn-glow, rgba(255,255,255,0.3)),
                inset 0 0 20px rgba(255, 255, 255, 0.05);
        }
        
        .tactical-btn.active .btn-icon {
            transform: scale(1.1);
        }
        
        /* Separator decoration */
        .tactical-separator {
            width: 1px;
            height: 48px;
            background: linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent);
            margin: 0 6px;
        }
        
        /* === PULSE ANIMATIONS === */
        @keyframes iconPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px -5px var(--btn-glow, rgba(255,255,255,0.2)); }
            50% { box-shadow: 0 0 35px -5px var(--btn-glow, rgba(255,255,255,0.4)); }
        }
        
        .tactical-btn:not(:disabled):hover .btn-icon i {
            animation: iconPulse 0.6s ease-in-out infinite;
        }
        
        .tactical-btn.active {
            animation: glowPulse 2s ease-in-out infinite;
        }
        
        /* HP Bar Low Health Animation - Movido para .hud-bar-fill.hp.low */
        
        /* ============================================== */
        /* KILL CONFIRMATION BANNER                       */
        /* ============================================== */
        .kill-banner {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.5);
            z-index: 5000;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .kill-banner.active {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        
        .kill-banner-inner {
            background: linear-gradient(135deg, rgba(185, 28, 28, 0.95) 0%, rgba(127, 29, 29, 0.98) 100%);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(248, 113, 113, 0.5);
            border-radius: 16px;
            padding: 1rem 3rem;
            box-shadow: 
                0 0 60px rgba(239, 68, 68, 0.5),
                0 20px 60px rgba(0, 0, 0, 0.8),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .kill-banner-inner::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: killShine 0.6s ease-out forwards;
        }
        
        @keyframes killShine {
            0% { left: -100%; }
            100% { left: 200%; }
        }
        
        .kill-banner-text {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            color: #fff;
            text-shadow: 0 0 20px rgba(255, 100, 100, 0.8), 0 4px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .kill-banner-text i {
            width: 32px;
            height: 32px;
            color: #fca5a5;
        }
        
        .kill-banner-target {
            font-size: 0.9rem;
            color: #fca5a5;
            text-align: center;
            margin-top: 0.25rem;
            letter-spacing: 0.15em;
        }
        
        /* ============================================== */
        /* COMBAT LOG                                     */
        /* ============================================== */
        .combat-log {
            position: fixed;
            bottom: 140px;
            right: 1.5rem;
            width: 320px;
            z-index: 600;
            transition: all 0.3s ease;
        }
        
        .combat-log.minimized .combat-log-body {
            display: none;
        }
        
        .combat-log-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px 10px 0 0;
            cursor: pointer;
            user-select: none;
        }
        
        .combat-log.minimized .combat-log-header {
            border-radius: 10px;
        }
        
        .combat-log-title {
            font-family: 'Cinzel', serif;
            font-size: 0.7rem;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .combat-log-title i {
            width: 14px;
            height: 14px;
            color: #60a5fa;
        }
        
        .combat-log-toggle {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            transition: transform 0.3s;
        }
        
        .combat-log.minimized .combat-log-toggle {
            transform: rotate(180deg);
        }
        
        .combat-log-body {
            background: rgba(10, 15, 25, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top: none;
            border-radius: 0 0 10px 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .combat-log-body::-webkit-scrollbar {
            width: 4px;
        }
        
        .combat-log-body::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.3);
        }
        
        .combat-log-body::-webkit-scrollbar-thumb {
            background: rgba(100, 150, 200, 0.3);
            border-radius: 2px;
        }
        
        .log-entry {
            padding: 0.5rem 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            font-size: 0.75rem;
            color: #94a3b8;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            animation: logSlideIn 0.3s ease-out;
        }
        
        @keyframes logSlideIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .log-entry:last-child {
            border-bottom: none;
        }
        
        .log-icon {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        
        .log-icon.attack { color: #ef4444; }
        .log-icon.skill { color: #a855f7; }
        .log-icon.move { color: #22c55e; }
        .log-icon.defeat { color: #fbbf24; }
        
        .log-text {
            flex: 1;
            line-height: 1.4;
        }
        
        .log-text .attacker { color: #60a5fa; font-weight: 700; }
        .log-text .target { color: #f87171; font-weight: 700; }
        .log-text .damage { color: #fbbf24; font-weight: 900; }
        .log-text .skill-name { color: #c084fc; font-weight: 600; }
        
        .log-time {
            font-size: 0.6rem;
            color: #475569;
            flex-shrink: 0;
        }
        
        /* ============================================== */
        /* TURN ORDER TIMELINE                            */
        /* ============================================== */
        .turn-timeline {
            position: fixed;
            top: 80px;
            left: 1rem;
            z-index: 550;
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            overflow-x: visible;
            padding-right: 8px;
            /* Hide scrollbar completely */
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        
        .turn-timeline::-webkit-scrollbar {
            display: none;
        }
        
        /* Label "Ordem" no topo - Premium Style */
        .timeline-label {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
            color: #000;
            font-family: 'Cinzel', serif;
            font-size: 0.65rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            padding: 8px 16px;
            border-radius: 12px;
            box-shadow: 
                0 4px 12px rgba(251, 191, 36, 0.5),
                0 0 20px rgba(251, 191, 36, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2);
            white-space: nowrap;
            text-align: center;
            margin-bottom: 6px;
            border: 1px solid rgba(251, 191, 36, 0.4);
            position: relative;
            overflow: hidden;
        }
        
        .timeline-label::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: labelShine 3s ease-in-out infinite;
        }
        
        @keyframes labelShine {
            0% { left: -100%; }
            50%, 100% { left: 100%; }
        }
        
        /* Card de unidade no timeline - Premium Glass Effect */
        .timeline-unit-card {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            padding: 0.85rem 1.15rem;
            background: linear-gradient(180deg, 
                rgba(15, 23, 42, 0.97) 0%, 
                rgba(10, 15, 30, 0.99) 50%,
                rgba(5, 10, 20, 1) 100%
            );
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 12px 40px -10px rgba(0, 0, 0, 0.8),
                0 0 50px -15px rgba(59, 130, 246, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            cursor: pointer;
            min-width: 220px;
            position: relative;
            /* overflow: visible para permitir tooltips escaparem */
            overflow: visible;
        }
        
        /* Animated border glow */
        .timeline-unit-card::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 18px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(59, 130, 246, 0.25) 25%,
                rgba(168, 85, 247, 0.25) 50%,
                rgba(236, 72, 153, 0.25) 75%,
                transparent 100%
            );
            background-size: 200% 100%;
            animation: borderShimmer 4s linear infinite;
            z-index: -1;
            opacity: 0.5;
        }
        
        /* Top highlight line */
        .timeline-unit-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 15%;
            right: 15%;
            height: 1px;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(255, 255, 255, 0.3), 
                rgba(255, 220, 100, 0.5),
                rgba(255, 255, 255, 0.3), 
                transparent
            );
        }
        
        .timeline-unit-card:hover {
            transform: translateX(4px);
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 16px 50px -10px rgba(0, 0, 0, 0.9),
                0 0 60px -10px rgba(59, 130, 246, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.12),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }
        
        .timeline-unit-card.active {
            background: linear-gradient(180deg, 
                rgba(30, 25, 15, 0.97) 0%, 
                rgba(20, 15, 10, 0.99) 50%,
                rgba(15, 10, 5, 1) 100%
            );
            border-color: rgba(251, 191, 36, 0.3);
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 12px 40px -10px rgba(0, 0, 0, 0.8),
                0 0 80px -10px rgba(251, 191, 36, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.12),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }
        
        .timeline-unit-card.active::before {
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(251, 191, 36, 0.4) 25%,
                rgba(251, 215, 0, 0.4) 50%,
                rgba(251, 191, 36, 0.4) 75%,
                transparent 100%
            );
            opacity: 0.7;
        }
        
        .timeline-unit-card.player {
            border-left: 4px solid rgba(96, 165, 250, 0.6);
        }
        
        .timeline-unit-card.enemy {
            border-left: 4px solid rgba(239, 68, 68, 0.6);
        }
        
        .timeline-unit-card.acted {
            opacity: 0.85;
        }
        
        .timeline-unit-card.acted .unit-portrait-frame img {
            filter: grayscale(0.85) brightness(0.7);
        }
        
        /* Portrait no card */
        .timeline-unit-card .unit-portrait-frame {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            background: linear-gradient(135deg, #1a1a2e 0%, #0a0a15 100%);
            border: 2px solid;
            border-image: linear-gradient(135deg, #ffd700, #ff8c00, #ffd700) 1;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 
                0 4px 20px rgba(0, 0, 0, 0.5),
                inset 0 0 20px rgba(255, 215, 0, 0.05);
        }
        
        .timeline-unit-card .unit-portrait-frame::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%);
            pointer-events: none;
            z-index: 2;
        }
        
        .timeline-unit-card .unit-portrait-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
        }
        
        /* Level badge menor no card */
        .timeline-unit-card .unit-level-badge {
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, #ffd700, #ff8c00);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cinzel', serif;
            font-size: 9px;
            font-weight: 900;
            color: #000;
            border: 2px solid #0a0a15;
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
            z-index: 3;
        }
        
        /* Detalhes do card */
        .timeline-unit-card .unit-info-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;
            min-width: 0;
        }
        
        .timeline-unit-card .unit-name {
            font-family: 'Cinzel', serif;
            font-weight: 900;
            font-size: 0.95rem;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4a 50%, #ffd700 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: none;
            filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
            letter-spacing: 0.3px;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Barras HP/MP - melhor legibilidade */
        .timeline-unit-card .hud-bars-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .timeline-unit-card .hud-bar-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .timeline-unit-card .hud-bar-icon {
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
        }
        
        .timeline-unit-card .hud-bar {
            flex: 1;
            height: 16px;
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 30, 0.8) 100%);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        
        .timeline-unit-card .hud-bar-fill {
            height: 100%;
            border-radius: 6px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .timeline-unit-card .hud-bar-fill.hp {
            background: linear-gradient(180deg, #f87171 0%, #ef4444 40%, #dc2626 100%);
        }
        
        .timeline-unit-card .hud-bar-fill.mp {
            background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%);
        }
        
        .timeline-unit-card .hud-bar-text {
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            text-align: center;
            font-family: 'Inter', sans-serif;
            font-size: 9px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 1px 2px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.6);
            letter-spacing: 0.4px;
            z-index: 1; /* Reduzido de 2 para 1 para não sobrepor o tooltip */
        }
        
        /* Separador visual */
        .timeline-separator {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            margin: 4px 0;
        }
        
        /* Scrollbar customizada - Mais discreta */
        .turn-timeline::-webkit-scrollbar {
            width: 4px; /* Mais fina */
        }
        .turn-timeline::-webkit-scrollbar-track {
            background: transparent;
        }
        .turn-timeline::-webkit-scrollbar-thumb {
            background: rgba(251, 191, 36, 0.2);
            border-radius: 4px;
        }
        .turn-timeline::-webkit-scrollbar-thumb:hover {
            background: rgba(251, 191, 36, 0.5);
        }
        
        /* === TIMELINE STATUS ICONS (BUFFS/DEBUFFS) === */
        .timeline-status-icons {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            z-index: 10; /* Aumentado de 1 para 10 para criar contexto de camada sobre as barras */
        }
        
        .timeline-status-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            border: 2px solid;
            box-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(0, 0, 0, 0.3) inset,
                0 1px 0 rgba(255, 255, 255, 0.2) inset;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: help;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%);
        }
        
        .timeline-status-icon:hover {
            transform: scale(1.15);
            z-index: 10;
        }
        
        .timeline-status-icon.buff {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%);
            border-color: rgba(34, 197, 94, 0.5);
        }
        
        .timeline-status-icon.debuff {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%);
            border-color: rgba(239, 68, 68, 0.5);
        }
        
        .timeline-status-icon.status {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%);
            border-color: rgba(251, 191, 36, 0.5);
        }
        
        .timeline-status-icon img {
            width: 24px;
            height: 24px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }
        
        .timeline-status-icon i {
            width: 20px;
            height: 20px;
            color: rgba(255, 255, 255, 0.95);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .status-duration-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%);
            color: #fff;
            font-size: 11px;
            font-weight: 900;
            padding: 3px 6px;
            border-radius: 8px;
            line-height: 1.2;
            min-width: 18px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.5);
            box-shadow: 
                0 3px 8px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(0, 0, 0, 0.5) inset,
                0 1px 0 rgba(255, 255, 255, 0.3) inset;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
            z-index: 2;
        }
        
        .timeline-status-icon[data-tooltip] {
            position: relative;
        }
        
        /* O tooltip antigo via CSS foi removido em favor do sistema Global JS */
        
        /* Global Status Tooltip Panel */
        .status-tooltip-panel {
            position: fixed;
            z-index: 10000;
            background: linear-gradient(135deg, rgba(15, 15, 25, 0.98) 0%, rgba(5, 5, 15, 0.98) 100%);
            color: #fff;
            padding: 12px 16px;
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1);
            max-width: 300px;
            min-width: 200px;
            pointer-events: none;
            display: none;
            backdrop-filter: blur(10px);
            font-family: 'Inter', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            transition: opacity 0.2s ease;
            opacity: 0;
        }
        
        .status-tooltip-panel.visible {
            display: block;
            opacity: 1;
        }
        
        /* Arrow pointing down */
        .timeline-status-icon[data-tooltip]:hover::after {
            content: attr(data-tooltip);
        }
        
        .timeline-status-icon[data-tooltip]:hover::after::before {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(15, 15, 25, 0.98);
        }
        
        /* Posicionar tooltip dinamicamente via JavaScript */
        .timeline-status-icon[data-tooltip] {
            position: relative;
        }
        
        /* === HUD BUFFS PANEL === */
        .hud-buffs-panel {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .hud-buffs-panel-title {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .hud-buffs-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .hud-buff-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            border-left: 3px solid;
            font-size: 11px;
        }
        
        .hud-buff-item.buff {
            border-left-color: #22c55e;
            background: rgba(34, 197, 94, 0.1);
        }
        
        .hud-buff-item.debuff {
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        
        .hud-buff-item.status {
            border-left-color: #fbbf24;
            background: rgba(251, 191, 36, 0.1);
        }
        
        .hud-buff-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
        }
        
        .hud-buff-icon img {
            width: 16px;
            height: 16px;
            object-fit: contain;
        }
        
        .hud-buff-info {
            flex: 1;
            min-width: 0;
        }
        
        .hud-buff-name {
            font-weight: 700;
            color: #fff;
            margin-bottom: 2px;
        }
        
        .hud-buff-desc {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.3;
        }
        
        .hud-buff-duration {
            font-size: 10px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
            background: rgba(0, 0, 0, 0.4);
            padding: 2px 6px;
            border-radius: 3px;
            flex-shrink: 0;
        }
        
        .hud-stats-modifiers {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .hud-stats-modifiers-title {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .hud-stat-modifier {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            font-size: 11px;
        }
        
        .hud-stat-modifier-label {
            color: rgba(255, 255, 255, 0.8);
        }
        
        .hud-stat-modifier-value {
            font-weight: 700;
        }
        
        .hud-stat-modifier-value.positive {
            color: #22c55e;
        }
        
        .hud-stat-modifier-value.negative {
            color: #ef4444;
        }
        
        .hud-stats-modifiers-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        /* === RESPONSIVE ADJUSTMENTS === */
        @media (max-width: 768px) {
            .tactical-hud-inner {
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .unit-info-compact {
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                padding-bottom: 0.75rem;
                min-width: unset;
            }
            
            .tactical-actions {
                justify-content: center;
            }
            
            .tactical-btn {
                width: 70px;
                height: 64px;
            }
            
            .tactical-separator {
                display: none;
            }
        }
        
        /* === TOOLTIP ENHANCEMENT === */
        .tactical-btn::after {
            content: attr(title);
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 6px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s ease;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .tactical-btn:hover::after {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }
        
        /* === ENTRANCE ANIMATION === */
        @keyframes hudSlideIn {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(100%) scale(0.9);
            }
            60% {
                opacity: 1;
                transform: translateX(-50%) translateY(-10px) scale(1.02);
            }
            100% {
                opacity: 1;
                transform: translateX(-50%) translateY(0) scale(1);
            }
        }
        
        .tactical-hud.visible {
            animation: hudSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* === BUTTON RIPPLE EFFECT === */
        .tactical-btn .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        /* Ocultar HUDs antigas para usar apenas a HUD tática */
        .premium-footer {
            display: none !important;
        }
        #action-menu {
            display: none !important;
        }

        /* Tactical Global Banner */
        .global-notification-banner {
            position: fixed;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(13, 17, 23, 0.95), rgba(10, 10, 15, 0.98));
            border: 1px solid rgba(96, 165, 250, 0.2);
            border-radius: 12px;
            padding: 12px 32px;
            z-index: 3000;
            pointer-events: none;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            align-items: center;
            gap: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.9), 0 0 20px rgba(37, 99, 235, 0.2);
        }
        .global-notification-banner.visible {
            opacity: 1;
            top: 100px;
        }
        .global-banner-icon { color: #60a5fa; }
        .global-banner-text { 
            font-family: 'Cinzel', serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #fff;
        }

        /* Attack Pulse Animation */
        @keyframes acp-pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); transform: scale(1); }
            50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); transform: scale(1.05); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); transform: scale(1); }
        }
        .acp-btn.confirm.pulse {
            background: linear-gradient(180deg, #ef4444 0%, #b91c1c 100%) !important;
            color: #fff !important;
            animation: acp-pulse-red 2s infinite;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .action-btn {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.6rem 0.9rem;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-family: 'Cinzel', serif;
            font-size: 12px;
            font-weight: 600;
            text-align: left;
            border-radius: 0.6rem;
            cursor: pointer;
            transition: all 0.15s;
        }
        .action-btn:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
        }
        .action-btn.move:hover { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
        .action-btn.attack:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .action-btn.wait:hover { background: rgba(234, 179, 8, 0.15); color: #eab308; }

        .action-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Selected Unit Panel */
        .unit-panel {
            position: fixed;
            bottom: 1.5rem;
            left: 1.5rem;
            background: rgba(15, 15, 25, 0.98);
            backdrop-filter: blur(16px);
            padding: 1rem 1.25rem;
            border-radius: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            z-index: 100;
            min-width: 200px;
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
            transition: all 0.3s ease;
        }
        .unit-panel.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .unit-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        .unit-avatar-frame {
            position: relative;
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.4);
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            overflow: hidden;
        }
        .unit-avatar-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            z-index: 1;
        }
        .unit-name {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 14px;
            color: #fff;
        }
        .unit-class {
            font-size: 10px;
            color: #60a5fa;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .unit-hp-container {
            margin-bottom: 0.75rem;
        }
        .unit-hp-label {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
            margin-bottom: 4px;
        }
        .unit-hp-bar-bg {
            height: 8px;
            background: rgba(0,0,0,0.5);
            border-radius: 4px;
            overflow: hidden;
        }
        .unit-hp-bar {
            height: 100%;
            background: linear-gradient(90deg, #22c55e, #16a34a);
            border-radius: 4px;
            transition: width 0.3s;
        }

        .unit-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
        }
        .stat-item {
            text-align: center;
            padding: 0.4rem;
            background: rgba(0,0,0,0.3);
            border-radius: 0.5rem;
        }
        .stat-label {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .stat-value {
            font-family: 'Cinzel', serif;
            font-size: 14px;
            font-weight: 700;
            color: #e2e8f0;
        }

        /* Bottom Controls */
        .bottom-controls {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            display: flex;
            gap: 0.5rem;
            z-index: 100;
        }

        .ctrl-btn {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 15, 25, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 0.75rem;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
        }
        .ctrl-btn:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
            transform: translateY(-2px);
        }
        .ctrl-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }

        .btn-end-turn {
            width: auto;
            padding: 0 1rem;
            gap: 0.5rem;
            background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.2));
            border-color: rgba(234, 179, 8, 0.4);
            color: #eab308;
            font-family: 'Cinzel', serif;
            font-size: 11px;
            font-weight: 700;
        }
        .btn-end-turn:hover:not(:disabled) {
            background: linear-gradient(135deg, rgba(234, 179, 8, 0.3), rgba(202, 138, 4, 0.3));
            box-shadow: 0 0 20px rgba(234, 179, 8, 0.2);
        }

        /* Minimap */
        .minimap {
            position: fixed;
            top: 80px;
            right: 1rem;
            width: 160px;
            height: 120px;
            background: rgba(15, 15, 25, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 0.75rem;
            overflow: hidden;
            z-index: 100;
        }
        .minimap canvas { width: 100%; height: 100%; }

        /* Coordinates */
        .coord-display {
            position: fixed;
            top: 80px;
            left: 1rem;
            background: rgba(15, 15, 25, 0.9);
            padding: 0.4rem 0.8rem;
            border-radius: 0.5rem;
            border: 1px solid rgba(255,255,255,0.1);
            font-family: monospace;
            font-size: 11px;
            color: #64748b;
            z-index: 100;
        }

        /* Notification - Mesmo estilo do top-banner */
        .notification {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 150;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .notification.visible { 
            opacity: 1; 
            visibility: visible;
        }
        .notification.warning {
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }
        .notification.info { 
            border-color: rgba(96, 165, 250, 0.4); 
            color: #bfdbfe; 
        }
        .notification.success { 
            border-color: rgba(34, 197, 94, 0.4); 
            color: #86efac; 
        }
        .notification.error { 
            border-color: rgba(239, 68, 68, 0.4); 
            color: #fca5a5; 
        }

        /* Damage Popup */
        .damage-popup {
            position: fixed;
            font-family: 'Cinzel', serif;
            font-size: 24px;
            font-weight: 900;
            color: #ef4444;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            z-index: 400;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        }
        @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }

        /* Modal */
        .game-modal {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 500;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        .game-modal.visible { opacity: 1; pointer-events: auto; }

        .modal-content {
            background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 1.5rem;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s;
        }
        .game-modal.visible .modal-content { transform: scale(1); }

        #modal-title {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #f59e0b, #eab308);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        #modal-content {
            color: #94a3b8;
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            white-space: pre-line;
        }
        #modal-buttons { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }

        .modal-btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: #94a3b8;
        }
        .modal-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .modal-btn.primary {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-color: transparent;
            color: #000;
        }
        .modal-btn.primary:hover { box-shadow: 0 0 20px rgba(234, 179, 8, 0.4); }

        /* Loading */
        .loading-overlay {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: opacity 0.5s, transform 0.5s;
        }
        .loading-overlay.hidden { 
            opacity: 0; 
            pointer-events: none;
            transform: scale(1.05);
        }
        .loading-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .loading-icon {
            color: rgba(96, 165, 250, 0.3);
            animation: pulse-glow 2s ease-in-out infinite;
            margin-bottom: 1rem;
        }
        .loading-rays {
            animation: rotate-rays 8s linear infinite;
            transform-origin: center;
        }
        @keyframes rotate-rays {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.3)); }
            50% { opacity: 0.8; filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.6)); }
        }
        .loading-spinner {
            width: 56px;
            height: 56px;
            border: 3px solid rgba(96, 165, 250, 0.15);
            border-top-color: #60a5fa;
            border-right-color: rgba(96, 165, 250, 0.5);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text {
            color: #64748b;
        }
        .loading-bar-container {
            width: 200px;
            height: 4px;
            background: rgba(96, 165, 250, 0.1);
            border-radius: 2px;
            overflow: hidden;
        }
        .loading-bar {
            width: 30%;
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
            border-radius: 2px;
            animation: loading-progress 1.5s ease-in-out infinite;
        }
        @keyframes loading-progress {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 40%; margin-left: 30%; }
            100% { width: 0%; margin-left: 100%; }
        }

        /* ================= Premium UI Overhaul ================= */

        /* Turn Banner Style - Compacto e na parte inferior */
        .turn-banner {
            position: fixed;
            left: 50%;
            bottom: 15%;
            transform: translateX(-50%) translateY(30px);
            z-index: 1000;
            pointer-events: none;
            display: none;
            opacity: 0;
        }
        .turn-banner.active {
            display: block;
            animation: turnBannerSlide 1.5s ease-out forwards;
        }
        @keyframes turnBannerSlide {
            0% { opacity: 0; transform: translateX(-50%) translateY(30px); }
            15% { opacity: 1; transform: translateX(-50%) translateY(0); }
            85% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        
        .banner-marquee-container {
            padding: 0.75rem 2.5rem;
            background: rgba(127, 29, 29, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(239, 68, 68, 0.5);
            border-radius: 50px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.3);
            position: relative;
            overflow: hidden;
        }
        .turn-banner.player .banner-marquee-container {
            background: rgba(30, 58, 138, 0.85);
            border-color: rgba(96, 165, 250, 0.5);
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(96, 165, 250, 0.3);
        }
        .banner-marquee-text {
            display: none; /* Esconder texto de marquee */
        }
        .banner-central-text {
            position: relative;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.25em;
            color: #fff;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            white-space: nowrap;
            opacity: 1;
        }
        .turn-banner.active .banner-central-text {
            animation: none;
        }

        /* Não precisamos mais dessas animações antigas */
        @keyframes bannerIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        @keyframes textImpact {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) letter-spacing: 1em; filter: blur(10px); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1) letter-spacing: 0.4em; filter: blur(0); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) letter-spacing: 0.45em; filter: blur(0); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.1) letter-spacing: 0.5em; filter: blur(10px); }
        }

        /* Tactical Group HUD (Top Left) */
        .group-hud {
            position: fixed;
            top: 6rem;
            left: 1.5rem;
            z-index: 500;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
            max-height: calc(100vh - 12rem);
            overflow-y: auto;
        }

        .unit-status-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: linear-gradient(135deg, rgba(13, 17, 23, 0.85) 0%, rgba(20, 25, 35, 0.9) 100%);
            backdrop-filter: blur(16px) saturate(180%);
            -webkit-backdrop-filter: blur(16px) saturate(180%);
            border: 1px solid rgba(255, 215, 0, 0.15);
            border-radius: 14px;
            padding: 0.85rem 1.1rem;
            min-width: 280px;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            box-shadow: 
                0 10px 40px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        }
        /* Metallic shine effect */
        .unit-status-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.08), transparent);
            animation: shimmer 4s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { left: -100%; }
            50% { left: 150%; }
        }
        .group-hud > div:first-child {
        }
        .unit-status-card.active {
            border-color: rgba(96, 165, 250, 0.6);
            background: linear-gradient(135deg, rgba(30, 58, 138, 0.6) 0%, rgba(20, 40, 100, 0.7) 100%);
            box-shadow: 
                0 0 30px rgba(59, 130, 246, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.3);
        }
        .unit-status-card.active::before {
            background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent);
        }

        .status-portrait {
            width: 52px;
            height: 52px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid;
            border-image: linear-gradient(135deg, #ffd700, #cd7f32, #ffd700) 1;
            flex-shrink: 0;
            box-shadow: 
                0 4px 12px rgba(0, 0, 0, 0.4),
                inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            position: relative;
        }
        .status-portrait::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
            pointer-events: none;
        }
        .status-portrait img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
        }

        .status-info {
            flex-grow: 1;
        }

        .status-name {
            font-family: 'Cinzel', serif;
            font-size: 0.85rem;
            font-weight: 900;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .status-bars {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .bar-wrapper {
            position: relative;
            height: 10px;
            background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 
                inset 0 2px 4px rgba(0,0,0,0.5),
                0 1px 0 rgba(255,255,255,0.05);
        }
        .bar-fill {
            height: 100%;
            border-radius: 5px;
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }
        /* Gloss effect on bars */
        .bar-fill::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%);
            border-radius: 5px 5px 0 0;
        }
        .bar-hp { 
            background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
        }
        .bar-hp.warning {
            background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .bar-hp.critical {
            background: linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%);
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
            animation: criticalPulse 1s ease-in-out infinite;
        }
        @keyframes criticalPulse {
            0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.8); }
        }
        .bar-sp { 
            background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
        }

        .bar-text {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.95);
            font-family: 'Inter', sans-serif;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            letter-spacing: 0.5px;
        }

        @keyframes slideInHUD {
            to { transform: translateX(0); }
        }

        /* Premium Action Bar (Liquid Glass) */
        .premium-footer {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 0.75rem 2rem;
            background: rgba(10, 10, 10, 0.85);
            backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 2rem;
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.7),
                inset 0 1px 1px rgba(255,255,255,0.1);
            z-index: 500;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-btn.pulse-highlight {
            animation: btnPulse 2s infinite;
            background: #fff;
            color: #000;
            border-color: #fff;
        }

        @keyframes btnPulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        .unit-summary-mini {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding-right: 1.5rem;
            border-right: 1px solid rgba(255,255,255,0.1);
        }
        .mini-avatar-frame {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(255,255,255,0.05);
            padding: 4px;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            overflow: hidden;
        }
        .mini-avatar-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .action-btns {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .premium-btn {
            height: 44px;
            padding: 0 1.25rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            color: #94a3b8;
            font-family: 'Inter', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .premium-btn:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
            transform: translateY(-2px);
            border-color: rgba(255,255,255,0.2);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .premium-btn.active {
            background: #fff;
            color: #000;
            border-color: #fff;
        }
        .btn-highlight {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #fff;
            border: none;
            padding: 0 1.5rem;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .btn-highlight:hover {
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
            box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5);
        }

        /* Coordinate Tooltip */
        .coord-overlay {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            padding: 0.5rem 1rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 500;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .coord-overlay.visible { opacity: 1; }
        .coord-label { font-size: 0.65rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
        .coord-value { font-family: 'Inter', sans-serif; font-weight: 900; color: #fff; font-size: 0.9rem; }

        /* Minimap (Premium Glass) */
        .minimap-wrapper {
            position: fixed;
            top: 5.5rem;
            right: 2rem;
            width: 180px;
            aspect-ratio: 4/3;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 6px;
            z-index: 500;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #minimap-canvas {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            background: #0d1117;
            display: block;
        }

        /* Hide old UI elements that are redundant or being replaced */
        .bottom-controls, .unit-panel, .coord-display {
            display: none !important;
        }
    </style>
</head>
<body>
<body>
    <!-- Loading overlay -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="loading-inner">
            <div class="loading-icon"><i data-lucide="map" class="w-12 h-12 loading-rays"></i></div>
            <div class="loading-spinner"></div>
            <p class="loading-text mt-6">Explorando Território...</p>
            <div class="loading-bar-container mt-4"><div class="loading-bar"></div></div>
        </div>
    </div>

    <!-- Top HUD with Audio Controls -->
    <div class="top-hud">
        <div class="audio-controls">
            <button id="toggle-music" class="audio-btn" title="Mutar/Desmutar Música">
                <i data-lucide="music"></i>
            </button>
            <button id="toggle-sfx" class="audio-btn" title="Mutar/Desmutar Efeitos">
                <i data-lucide="volume-2"></i>
            </button>
        </div>
    </div>

    <!-- Top Banner (Genérico para todas as mensagens) -->
    <div id="top-banner" class="top-banner">
        <span id="top-banner-text"></span>
    </div>

    <!-- Main Canvas -->
    <div id="map-container">
        <canvas id="map-canvas"></canvas>
    </div>

    <!-- Coordinate Overlay (Premium) -->
    <div id="coord-overlay" class="coord-overlay">
        <i data-lucide="map-pin" class="w-4 h-4 text-blue-400"></i>
        <span class="coord-label">Posição</span>
        <span id="coord-value" class="coord-value">0, 0</span>
    </div>

    <!-- Premium Minimap -->
    <div class="minimap-wrapper">
        <canvas id="minimap-canvas" width="200" height="150"></canvas>
    </div>

    <!-- Notification -->
    <div id="notification" class="notification"></div>

    <!-- Kill Confirmation Banner -->
    <div id="kill-banner" class="kill-banner">
        <div class="kill-banner-inner">
            <div class="kill-banner-text">
                <i data-lucide="skull"></i>
                <span>ELIMINADO</span>
            </div>
            <div class="kill-banner-target" id="kill-target-name">Slime</div>
        </div>
    </div>

    <!-- Combat Log -->
    <div id="combat-log" class="combat-log">
        <div class="combat-log-header" onclick="toggleCombatLog()">
            <div class="combat-log-title">
                <i data-lucide="scroll-text"></i>
                <span>Combat Log</span>
            </div>
            <div class="combat-log-toggle">
                <i data-lucide="chevron-down"></i>
            </div>
        </div>
        <div class="combat-log-body" id="combat-log-body">
            <!-- Log entries will be added here -->
        </div>
    </div>

    <!-- Turn Order Timeline -->
    <div id="turn-timeline" class="turn-timeline">
        <div class="timeline-label">Turn: <span id="timeline-turn-number">1</span></div>
        <!-- Timeline units will be added dynamically -->
    </div>

    <!-- Turn Banner (Marquee System) -->
    <div id="turn-banner" class="turn-banner">
        <div class="banner-marquee-container">
            <div class="banner-marquee-text">
                PHASE BEGIN &nbsp;&bull;&nbsp; PHASE BEGIN &nbsp;&bull;&nbsp; PHASE BEGIN &nbsp;&bull;&nbsp; PHASE BEGIN &nbsp;&bull;&nbsp; PHASE BEGIN &nbsp;&bull;&nbsp; PHASE BEGIN &nbsp;&bull;&nbsp;
            </div>
            <div class="banner-central-text" id="banner-text">Seu Turno</div>
        </div>
    </div>

    <!-- Premium Action Bar -->
    <div class="premium-footer">
        <div class="unit-summary-mini" id="selected-unit-mini">
            <div class="mini-avatar-frame">
                <img id="mini-avatar" src="" alt="">
            </div>
            <div class="flex flex-col">
                <span id="mini-name" class="text-xs font-black text-white uppercase tracking-tighter">Exploração</span>
                <div class="flex items-center gap-2 mt-0.5">
                    <span id="mini-status" class="text-[0.6rem] font-bold text-zinc-500 uppercase tracking-widest">Selecione uma unidade</span>
                    <div id="mini-stats-row" class="hidden flex items-center gap-3">
                        <div class="flex items-center gap-1">
                            <i data-lucide="move" class="w-2.5 h-2.5 text-zinc-400"></i>
                            <span id="mini-move" class="text-[0.65rem] font-black text-white">0</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="swords" class="w-2.5 h-2.5 text-zinc-400"></i>
                            <span id="mini-atk" class="text-[0.65rem] font-black text-white">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="action-btns">
            <button id="btn-center" class="premium-btn" title="Centralizar Câmera (C)">
                <i data-lucide="crosshair" class="w-4 h-4"></i>
                <span>Câmera</span>
            </button>
            <div class="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <button id="btn-zoom-out" class="premium-btn" style="padding: 0 0.75rem; border: none; background: transparent;"><i data-lucide="minus" class="w-4 h-4"></i></button>
                <button id="btn-zoom-in" class="premium-btn" style="padding: 0 0.75rem; border: none; background: transparent;"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>
            <button id="btn-end-turn" class="premium-btn btn-highlight" title="Finalizar Turno (E)">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Finalizar Turno</span>
            </button>
            <button id="btn-reset" class="premium-btn" title="Reiniciar Mapa" onclick="if(window.MapEngine) window.MapEngine.resetGame();">
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            </button>
            <a href="<?= url('game/tavern') ?>" class="premium-btn" title="Sair do Mapa">
                <i data-lucide="log-out" class="w-4 h-4"></i>
            </a>

        </div>
    </div>

    <!-- Action Menu (Floating context menu) - DEPRECATED, mantido para compatibilidade -->
    <div id="action-menu" class="action-menu">
        <button id="action-move" class="action-btn move"><i data-lucide="move" class="w-4 h-4 mr-2"></i> Mover</button>
        <button id="action-attack" class="action-btn attack" style="display: none;"><i data-lucide="swords" class="w-4 h-4 mr-2"></i> Atacar</button>
        <button id="action-undo" class="action-btn undo" style="display: none;"><i data-lucide="rotate-ccw" class="w-4 h-4 mr-2"></i> Voltar</button>
        <button id="action-finish" class="action-btn finish"><i data-lucide="check-circle" class="w-4 h-4 mr-2"></i> Finalizar</button>
        <button id="action-cancel" class="action-btn"><i data-lucide="x-circle" class="w-4 h-4 mr-2"></i> Sair</button>
    </div>

    <!-- HUD Tática Premium - Centro Inferior -->
    <div id="tactical-hud" class="tactical-hud hidden">
        <div class="tactical-hud-inner">
            <!-- Unit Info (for buffs panel) -->
            <div class="unit-info-compact" style="display: none;"></div>
            <!-- Tactical Actions -->
            <div class="tactical-actions">
                <button id="tactical-move" class="tactical-btn move" title="Mover unidade (M)">
                    <span class="hotkey">M</span>
                    <div class="btn-icon">
                        <i data-lucide="move"></i>
                    </div>
                    <span>Mover</span>
                </button>
                
                <button id="tactical-attack" class="tactical-btn attack" title="Ataque básico (A)">
                    <span class="hotkey">A</span>
                    <div class="btn-icon">
                        <i data-lucide="sword"></i>
                    </div>
                    <span>Atacar</span>
                </button>
                
                <div class="tactical-separator"></div>
                
                <button id="tactical-skills" class="tactical-btn skills" title="Habilidades especiais (S)">
                    <span class="hotkey">S</span>
                    <div class="btn-icon">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <span>Skills</span>
                </button>
                
                <button id="tactical-endturn" class="tactical-btn endturn" title="Finalizar turno (F)">
                    <span class="hotkey">F</span>
                    <div class="btn-icon">
                        <i data-lucide="forward"></i>
                    </div>
                    <span>Pass</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Skill Bar - MMO Style -->
    <div id="skill-bar-container" class="skill-bar-container" style="display: none;">
        <!-- Skills will be added dynamically -->
    </div>

    <!-- REMOVED: Attack Confirmation Popup (Old System) -->

    <!-- Cinematic Battle Overlay - Classic VS Style -->
    <div id="battle-overlay" class="battle-overlay hidden">
        <!-- Flash Effect -->
        <div class="vs-flash"></div>
        
        <!-- Diagonal Split Background -->
        <div class="vs-bg-split"></div>
        
        <!-- Heroes Side (Left) -->
        <div class="vs-side vs-heroes">
            <div class="vs-side-label">HERÓIS</div>
            <div class="vs-portraits battle-heroes">
                <!-- Dynamic content -->
            </div>
        </div>
        
        <!-- VS Center Badge -->
        <div class="vs-badge">
            <div class="vs-text">VS</div>
            <div class="vs-sparks"></div>
        </div>
        
        <!-- Enemies Side (Right) -->
        <div class="vs-side vs-enemies">
            <div class="vs-side-label">INIMIGOS</div>
            <div class="vs-portraits battle-enemies">
                <!-- Dynamic content -->
            </div>
        </div>
        
        <!-- Bottom Text -->
        <div class="vs-bottom-text">PREPARE FOR BATTLE!</div>
    </div>

    <style>
        /* ===============================================
           CLASSIC FIGHTING GAME VS SCREEN
           =============================================== */
        .battle-overlay {
            position: fixed;
            inset: 0;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s;
            overflow: hidden;
        }

        .battle-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        /* Flash Effect */
        .vs-flash {
            position: absolute;
            inset: 0;
            background: #fff;
            opacity: 0;
            z-index: 100;
            pointer-events: none;
        }
        .battle-overlay.active .vs-flash {
            animation: vsFlashBang 0.5s ease-out;
        }
        @keyframes vsFlashBang {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }

        /* Diagonal Split Background */
        .vs-bg-split {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, 
                #1e3a5f 0%, #1e3a5f 49.5%, 
                #f59e0b 49.5%, #f59e0b 50.5%, 
                #7f1d1d 50.5%, #7f1d1d 100%);
            z-index: 0;
        }
        .battle-overlay.active .vs-bg-split {
            animation: splitSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes splitSlide {
            0% { transform: scaleX(0); }
            100% { transform: scaleX(1); }
        }

        /* VS Sides */
        .vs-side {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 45%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            z-index: 10;
        }

        .vs-heroes {
            left: 0;
            transform: translateX(-100%);
        }
        .vs-enemies {
            right: 0;
            transform: translateX(100%);
        }

        .battle-overlay.active .vs-heroes {
            animation: slideFromLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .battle-overlay.active .vs-enemies {
            animation: slideFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        @keyframes slideFromLeft {
            to { transform: translateX(0); }
        }
        @keyframes slideFromRight {
            to { transform: translateX(0); }
        }

        /* Side Labels */
        .vs-side-label {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            margin-bottom: 2rem;
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }
        .vs-heroes .vs-side-label { color: #60a5fa; }
        .vs-enemies .vs-side-label { color: #f87171; }

        /* Portraits Container */
        .vs-portraits {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }

        /* Character Cards */
        .vs-card {
            position: relative;
            width: 180px;
            height: 280px;
            border-radius: 12px;
            overflow: hidden;
            transform: scale(0.8);
            opacity: 0;
        }

        .vs-card.hero {
            border: 4px solid #3b82f6;
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 10px 40px rgba(0,0,0,0.5);
        }
        .vs-card.enemy {
            border: 4px solid #ef4444;
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), 0 10px 40px rgba(0,0,0,0.5);
        }

        .battle-overlay.active .vs-card {
            animation: cardPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .battle-overlay.active .vs-card:nth-child(1) { animation-delay: 0.5s; }
        .battle-overlay.active .vs-card:nth-child(2) { animation-delay: 0.6s; }
        .battle-overlay.active .vs-card:nth-child(3) { animation-delay: 0.7s; }

        @keyframes cardPop {
            0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
            60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .vs-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
        }

        .vs-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
            pointer-events: none;
        }

        .vs-card-name {
            position: absolute;
            bottom: 0.75rem;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Cinzel', serif;
            font-size: 0.9rem;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 2px 6px rgba(0,0,0,1);
            z-index: 5;
            letter-spacing: 0.05em;
        }

        /* VS Badge - The Main Event */
        .vs-badge {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .battle-overlay.active .vs-badge {
            animation: vsBadgeBurst 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }

        @keyframes vsBadgeBurst {
            0% { transform: translate(-50%, -50%) scale(0) rotate(-20deg); }
            50% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); }
            100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }

        .vs-text {
            font-family: 'Cinzel', serif;
            font-size: 10rem;
            font-weight: 900;
            color: #fff;
            text-shadow: 
                0 0 20px #f59e0b,
                0 0 40px #f59e0b,
                0 0 80px #f59e0b,
                4px 4px 0 #000,
                -4px -4px 0 #000,
                4px -4px 0 #000,
                -4px 4px 0 #000;
            letter-spacing: -0.05em;
            line-height: 1;
            animation: vsTextPulse 0.8s ease-in-out infinite alternate;
        }

        @keyframes vsTextPulse {
            0% { text-shadow: 
                0 0 20px #f59e0b,
                0 0 40px #f59e0b,
                0 0 80px #f59e0b,
                4px 4px 0 #000,
                -4px -4px 0 #000,
                4px -4px 0 #000,
                -4px 4px 0 #000; }
            100% { text-shadow: 
                0 0 40px #fbbf24,
                0 0 80px #fbbf24,
                0 0 120px #fbbf24,
                4px 4px 0 #000,
                -4px -4px 0 #000,
                4px -4px 0 #000,
                -4px 4px 0 #000; }
        }

        /* Sparks around VS */
        .vs-sparks {
            position: absolute;
            width: 200%;
            height: 200%;
            pointer-events: none;
        }
        .vs-sparks::before,
        .vs-sparks::after {
            content: '⚡';
            position: absolute;
            font-size: 3rem;
            animation: sparkRotate 1s linear infinite;
        }
        .vs-sparks::before {
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }
        .vs-sparks::after {
            bottom: 0;
            right: 0;
            animation-delay: 0.5s;
        }
        @keyframes sparkRotate {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }

        /* Bottom Text */
        .vs-bottom-text {
            position: absolute;
            bottom: 3rem;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: #f59e0b;
            letter-spacing: 0.4em;
            text-transform: uppercase;
            text-shadow: 0 2px 20px rgba(0,0,0,0.8);
            opacity: 0;
            z-index: 20;
        }
        .battle-overlay.active .vs-bottom-text {
            animation: bottomTextFade 0.5s ease-out 0.8s forwards;
        }
        @keyframes bottomTextFade {
            to { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .vs-card {
                width: 140px;
                height: 220px;
            }
            .vs-text {
                font-size: 7rem;
            }
            .vs-side-label {
                font-size: 1.2rem;
            }
        }

        @media (max-width: 768px) {
            .vs-side {
                width: 100%;
                position: relative;
                padding: 1rem;
            }
            .vs-heroes { 
                order: 1;
                transform: translateY(-50px);
            }
            .vs-enemies { 
                order: 3;
                transform: translateY(50px);
            }
            .battle-overlay.active .vs-heroes {
                animation: slideFromTop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
            }
            .battle-overlay.active .vs-enemies {
                animation: slideFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
            }
            @keyframes slideFromTop { to { transform: translateY(0); } }
            @keyframes slideFromBottom { to { transform: translateY(0); } }
            
            .vs-badge {
                position: relative;
                order: 2;
                top: auto;
                left: auto;
                transform: scale(0);
                margin: 1rem 0;
            }
            .battle-overlay.active .vs-badge {
                animation: vsBadgeBurstMobile 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
            }
            @keyframes vsBadgeBurstMobile {
                0% { transform: scale(0) rotate(-20deg); }
                50% { transform: scale(1.3) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
            
            .vs-text {
                font-size: 5rem;
            }
            .vs-card {
                width: 100px;
                height: 160px;
            }
            .vs-side-label {
                font-size: 1rem;
                margin-bottom: 1rem;
            }
            .vs-bg-split {
                background: linear-gradient(180deg, 
                    #1e3a5f 0%, #1e3a5f 30%, 
                    #f59e0b 30%, #f59e0b 35%, 
                    #7f1d1d 35%, #7f1d1d 100%);
            }
            .battle-overlay {
                flex-direction: column;
            }
        }
        
        /* ===============================================
           TACTICAL SKILL MENU - PREMIUM LEFT SIDEBAR
           =============================================== */
        /* SKILL BAR - Estilo MMO/Ragnarok */
        .skill-bar-container {
            position: fixed;
            bottom: 130px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1100;
            display: flex;
            gap: 6px;
            padding: 8px 12px;
            background: linear-gradient(180deg, 
                rgba(15, 23, 42, 0.95) 0%, 
                rgba(10, 15, 30, 0.98) 100%
            );
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 15px 50px -10px rgba(0, 0, 0, 0.8),
                0 0 60px -10px rgba(168, 85, 247, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
            overflow: visible;
        }
        
        /* Skill Icon Button */
        .skill-icon-btn {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.9));
            border: 2px solid rgba(168, 85, 247, 0.3);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: visible;
        }
        
        .skill-icon-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), transparent);
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .skill-icon-btn:hover:not(.disabled)::before {
            opacity: 1;
        }
        
        .skill-icon-btn:hover:not(.disabled) {
            transform: translateY(-2px) scale(1.05);
            border-color: rgba(168, 85, 247, 0.6);
            box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
        }
        
        .skill-icon-btn.active {
            border-color: #fbbf24;
            box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1));
        }
        
        .skill-icon-btn.disabled {
            opacity: 0.3;
            cursor: not-allowed;
            filter: grayscale(0.7);
        }
        
        .skill-icon-btn img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            image-rendering: crisp-edges;
        }
        
        .skill-icon-btn i {
            width: 24px;
            height: 24px;
            color: #fff;
        }
        
        /* Tipos de skill */
        .skill-icon-btn.physical { border-color: rgba(239, 68, 68, 0.3); }
        .skill-icon-btn.physical:hover:not(.disabled) { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); }
        .skill-icon-btn.magic { border-color: rgba(168, 85, 247, 0.3); }
        .skill-icon-btn.heal { border-color: rgba(34, 197, 94, 0.3); }
        .skill-icon-btn.heal:hover:not(.disabled) { border-color: rgba(34, 197, 94, 0.6); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4); }
        .skill-icon-btn.buff { border-color: rgba(245, 158, 11, 0.3); }
        .skill-icon-btn.buff:hover:not(.disabled) { border-color: rgba(245, 158, 11, 0.6); box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); }
        
        /* Skill Tooltip Panel - Global tooltip único */
        .skill-tooltip-panel {
            position: fixed;
            width: 280px;
            background: linear-gradient(180deg, 
                rgba(15, 23, 42, 0.98) 0%, 
                rgba(10, 15, 30, 1) 100%
            );
            backdrop-filter: blur(40px) saturate(200%);
            -webkit-backdrop-filter: blur(40px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            box-shadow: 
                0 0 0 1px rgba(0,0,0,0.5),
                0 20px 60px rgba(0, 0, 0, 0.9),
                0 0 80px -10px rgba(168, 85, 247, 0.3);
            padding: 16px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
            pointer-events: none;
            z-index: 4000;
            transform: translateY(10px);
        }
        
        .skill-tooltip-panel.visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
        }
        
        /* Botão fechar */
        .skill-tooltip-panel .skill-tooltip-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.2s ease;
            padding: 0;
            line-height: 1;
        }
        
        .skill-tooltip-panel .skill-tooltip-close:hover {
            background: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.5);
            color: #f87171;
        }
        
        /* Selected state for skill buttons */
        .skill-icon-btn.selected {
            border-color: rgba(59, 130, 246, 0.8) !important;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.2) !important;
        }
        
        .skill-tooltip-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .skill-tooltip-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #a855f7, #7c3aed);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            overflow: hidden;
        }
        
        .skill-tooltip-icon.physical { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .skill-tooltip-icon.heal { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .skill-tooltip-icon.buff { background: linear-gradient(135deg, #f59e0b, #d97706); }
        
        .skill-tooltip-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: crisp-edges;
        }
        
        .skill-tooltip-icon i {
            width: 28px;
            height: 28px;
            color: #fff;
        }
        
        .skill-tooltip-name {
            font-family: 'Cinzel', serif;
            font-size: 1.1rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 4px;
        }
        
        .skill-tooltip-cost {
            font-size: 0.85rem;
            color: #60a5fa;
            font-weight: 600;
        }
        
        .skill-tooltip-cost.insufficient {
            color: #f87171;
        }
        
        .skill-tooltip-desc {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
            margin-bottom: 16px;
        }
        
        .skill-tooltip-btn {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .skill-tooltip-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        
        .skill-tooltip-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: linear-gradient(135deg, #6b7280, #4b5563);
        }
        
        
        /* ===============================================
           SKILL ACTIVATION BANNER
           =============================================== */
        .skill-activation-banner {
            position: fixed;
            left: 50%;
            top: 12%;
            transform: translate(-50%, 0) scale(0.8);
            z-index: 2000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            opacity: 0;
            animation: skill-banner-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes skill-banner-in {
            0% {
                opacity: 0;
                transform: translate(-50%, 0) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, 0) scale(1.05);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, 0) scale(1);
            }
        }
        
        .skill-banner-glow {
            position: absolute;
            inset: -50px;
            background: radial-gradient(circle, var(--banner-color, rgba(168, 85, 247, 0.4)) 0%, transparent 70%);
            filter: blur(30px);
            animation: skill-glow-pulse 0.8s ease-in-out infinite alternate;
        }
        
        @keyframes skill-glow-pulse {
            from { opacity: 0.6; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1.1); }
        }
        
        .skill-banner-content {
            position: relative;
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem 3rem;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(30, 20, 50, 0.9) 100%);
            border: 2px solid var(--banner-border, rgba(168, 85, 247, 0.5));
            border-radius: 16px;
            box-shadow: 
                0 0 60px var(--banner-color, rgba(168, 85, 247, 0.4)),
                inset 0 0 30px rgba(255, 255, 255, 0.05);
        }
        
        .skill-banner-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: skill-icon-pulse 0.5s ease-out;
        }
        
        @keyframes skill-icon-pulse {
            0% { transform: scale(0) rotate(-180deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        
        .skill-banner-icon i {
            width: 36px;
            height: 36px;
            color: #fff;
        }
        .skill-banner-icon img.skill-banner-icon-img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            filter: drop-shadow(0 0 6px rgba(255,255,255,0.5));
        }
        
        .skill-banner-text {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .skill-banner-label {
            font-family: 'Cinzel', serif;
            font-size: 0.65rem;
            font-weight: 700;
            color: var(--label-color, #c084fc);
            text-transform: uppercase;
            letter-spacing: 0.3em;
        }
        
        .skill-banner-name {
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            font-weight: 900;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-shadow: 0 0 30px var(--banner-color, rgba(168, 85, 247, 0.8));
            animation: skill-name-slide 0.5s ease-out;
        }
        
        @keyframes skill-name-slide {
            0% { opacity: 0; transform: translateX(-30px); }
            100% { opacity: 1; transform: translateX(0); }
        }
        
        /* ===============================================
           ULTIMATE SPEED LINES - HOLLYWOOD STYLE
           =============================================== */
        .ultimate-speed-lines {
            position: fixed;
            inset: 0;
            z-index: 45;
            pointer-events: none;
            overflow: hidden;
            opacity: 0;
        }
        
        .ultimate-speed-lines.active {
            animation: ultimate-speedlines-fade 2.5s ease-in-out forwards;
        }
        
        @keyframes ultimate-speedlines-fade {
            0% { opacity: 0; }
            5% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        /* Camada 1: Linhas verticais rápidas */
        .ultimate-speed-lines::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 60px,
                    rgba(220, 38, 38, 0.3) 60px,
                    rgba(220, 38, 38, 0.3) 65px,
                    transparent 65px,
                    transparent 140px),
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 80px,
                    rgba(239, 68, 68, 0.25) 80px,
                    rgba(239, 68, 68, 0.25) 85px,
                    transparent 85px,
                    transparent 180px),
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 50px,
                    rgba(220, 38, 38, 0.28) 50px,
                    rgba(220, 38, 38, 0.28) 54px,
                    transparent 54px,
                    transparent 120px);
            background-size: 800px 100%, 1000px 100%, 600px 100%;
            animation: speedlines-layer1 0.06s linear infinite;
            filter: blur(1.5px);
        }
        
        /* Camada 2: Linhas médias */
        .ultimate-speed-lines::after {
            content: '';
            position: absolute;
            inset: 0;
            background:
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 100px,
                    rgba(185, 28, 28, 0.22) 100px,
                    rgba(185, 28, 28, 0.22) 108px,
                    transparent 108px,
                    transparent 220px),
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 90px,
                    rgba(220, 38, 38, 0.18) 90px,
                    rgba(220, 38, 38, 0.18) 96px,
                    transparent 96px,
                    transparent 200px);
            background-size: 1200px 100%, 1100px 100%;
            animation: speedlines-layer2 0.1s linear infinite;
            filter: blur(2px);
            mix-blend-mode: screen;
        }
        
        @keyframes speedlines-layer1 {
            0% { background-position: -200% 0, -180% 0, -220% 0; }
            100% { background-position: 200% 0, 180% 0, 220% 0; }
        }
        
        @keyframes speedlines-layer2 {
            0% { background-position: -250% 0, -230% 0; }
            100% { background-position: 250% 0, 230% 0; }
        }
        
        /* Sweep layer extra */
        .ultimate-speed-lines-sweep {
            position: absolute;
            inset: 0;
            background:
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 120px,
                    rgba(153, 27, 27, 0.15) 120px,
                    rgba(153, 27, 27, 0.15) 130px,
                    transparent 130px,
                    transparent 260px),
                repeating-linear-gradient(to right,
                    transparent 0px,
                    transparent 110px,
                    rgba(185, 28, 28, 0.12) 110px,
                    rgba(185, 28, 28, 0.12) 118px,
                    transparent 118px,
                    transparent 240px);
            background-size: 1500px 100%, 1400px 100%;
            animation: speedlines-layer3 0.15s linear infinite;
            filter: blur(2.5px);
            mix-blend-mode: screen;
        }
        
        @keyframes speedlines-layer3 {
            0% { background-position: -300% 0, -280% 0; }
            100% { background-position: 300% 0, 280% 0; }
        }
        
        /* Radial vignette overlay */
        .ultimate-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%);
            pointer-events: none;
        }
        
        /* Flash de impacto */
        .ultimate-flash {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255, 100, 100, 0.4) 0%, transparent 70%);
            animation: ultimate-flash-pulse 0.3s ease-out;
            pointer-events: none;
        }
        
        @keyframes ultimate-flash-pulse {
            0% { opacity: 0; transform: scale(0.8); }
            30% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* ===============================================
           FLOATING DAMAGE NUMBERS - DOM BASED
           =============================================== */
        .floating-damage {
            position: fixed;
            pointer-events: none;
            z-index: 3000;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            text-shadow: 
                0 0 10px rgba(0, 0, 0, 1),
                2px 2px 0px rgba(0, 0, 0, 0.9),
                -2px -2px 0px rgba(0, 0, 0, 0.9),
                0 4px 8px rgba(0, 0, 0, 0.8);
            animation: damage-float 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            transform-origin: center center;
        }
        
        .floating-damage.normal {
            font-size: 2.5rem;
            color: #fff;
        }
        
        .floating-damage.crit {
            font-size: 3.5rem;
            color: #fbbf24;
            text-shadow: 
                0 0 20px rgba(251, 191, 36, 0.8),
                0 0 40px rgba(251, 191, 36, 0.5),
                3px 3px 0px rgba(0, 0, 0, 0.9),
                -3px -3px 0px rgba(0, 0, 0, 0.9),
                0 6px 12px rgba(0, 0, 0, 0.8);
            animation: damage-float-crit 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        
        .floating-damage.heal {
            font-size: 2.5rem;
            color: #22c55e;
            text-shadow: 
                0 0 15px rgba(34, 197, 94, 0.6),
                2px 2px 0px rgba(0, 0, 0, 0.9),
                0 4px 8px rgba(0, 0, 0, 0.8);
        }
        
        @keyframes damage-float {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.5);
            }
            15% {
                opacity: 1;
                transform: translateY(-30px) scale(1.3);
            }
            30% {
                transform: translateY(-50px) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(-100px) scale(0.8);
            }
        }
        
        @keyframes damage-float-crit {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.3) rotate(-5deg);
            }
            10% {
                opacity: 1;
                transform: translateY(-20px) scale(1.5) rotate(3deg);
            }
            20% {
                transform: translateY(-40px) scale(1.2) rotate(-2deg);
            }
            40% {
                transform: translateY(-60px) scale(1.1) rotate(1deg);
            }
            100% {
                opacity: 0;
                transform: translateY(-120px) scale(0.9) rotate(0deg);
            }
        }
        
        /* Hit combo indicator */
        .hit-combo {
            position: fixed;
            right: 20%;
            top: 30%;
            pointer-events: none;
            z-index: 2500;
            text-align: center;
            animation: combo-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .hit-combo-number {
            font-family: 'Cinzel', serif;
            font-size: 4rem;
            font-weight: 900;
            color: #fbbf24;
            text-shadow: 
                0 0 30px rgba(251, 191, 36, 0.8),
                4px 4px 0px rgba(0, 0, 0, 0.9);
        }
        
        .hit-combo-label {
            font-family: 'Cinzel', serif;
            font-size: 1rem;
            font-weight: 700;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            opacity: 0.8;
        }
        
        @keyframes combo-pop {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .ultimate-banner-wrapper {
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 100%;
            z-index: 50;
            pointer-events: none;
            perspective: 1000px;
        }
        
        .ultimate-banner-strip {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2.5rem 0;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(0, 0, 0, 0.7) 15%, 
                rgba(20, 0, 0, 0.85) 50%, 
                rgba(0, 0, 0, 0.7) 85%, 
                transparent 100%
            );
            border-top: 3px solid rgba(239, 68, 68, 0.8);
            border-bottom: 3px solid rgba(239, 68, 68, 0.8);
            box-shadow: 
                0 0 60px rgba(239, 68, 68, 0.4),
                inset 0 0 100px rgba(239, 68, 68, 0.1);
            animation: ultimate-strip-slide 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            position: relative;
            overflow: hidden;
        }
        
        /* Animated glow line on top and bottom */
        .ultimate-banner-strip::before,
        .ultimate-banner-strip::after {
            content: '';
            position: absolute;
            left: 0;
            width: 200%;
            height: 3px;
            background: linear-gradient(90deg, 
                transparent 0%,
                #ef4444 20%,
                #fbbf24 50%,
                #ef4444 80%,
                transparent 100%
            );
            animation: ultimate-glow-sweep 1s ease-out forwards;
        }
        
        .ultimate-banner-strip::before { top: -2px; }
        .ultimate-banner-strip::after { bottom: -2px; }
        
        @keyframes ultimate-glow-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
        }
        
        @keyframes ultimate-strip-slide {
            0% { opacity: 0; transform: scaleX(0) rotateX(20deg); }
            15% { opacity: 1; transform: scaleX(1.05) rotateX(-5deg); }
            25% { transform: scaleX(1) rotateX(0deg); }
            75% { opacity: 1; transform: scaleX(1) rotateX(0deg); }
            100% { opacity: 0; transform: scaleX(0.9) rotateX(-10deg); }
        }
        
        .ultimate-banner-content {
            display: flex;
            align-items: center;
            gap: 2rem;
            padding: 1.5rem 4rem;
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.95) 0%, 
                rgba(60, 10, 10, 0.9) 50%,
                rgba(0, 0, 0, 0.95) 100%
            );
            border: 3px solid;
            border-image: linear-gradient(135deg, #ef4444, #fbbf24, #ef4444) 1;
            box-shadow: 
                0 0 100px rgba(239, 68, 68, 0.6),
                0 0 200px rgba(239, 68, 68, 0.3),
                inset 0 0 60px rgba(239, 68, 68, 0.2);
            animation: ultimate-content-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards;
            opacity: 0;
            transform: scale(0.5) rotateY(-20deg);
        }
        
        @keyframes ultimate-content-pop {
            0% { opacity: 0; transform: scale(0.5) rotateY(-20deg); }
            60% { opacity: 1; transform: scale(1.1) rotateY(5deg); }
            100% { opacity: 1; transform: scale(1) rotateY(0deg); }
        }
        
        .ultimate-icon {
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ultimate-icon-pulse 0.8s ease-out;
        }
        
        @keyframes ultimate-icon-pulse {
            0% { transform: scale(0) rotate(-180deg); }
            50% { transform: scale(1.3) rotate(10deg); }
            70% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        
        .ultimate-icon i {
            width: 48px;
            height: 48px;
            color: #fff;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.8));
        }
        .ultimate-icon img.ultimate-icon-img {
            width: 48px;
            height: 48px;
            object-fit: contain;
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.8));
        }
        
        .ultimate-text {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }
        
        .ultimate-label {
            font-family: 'Cinzel', serif;
            font-size: 0.85rem;
            font-weight: 800;
            color: #fbbf24;
            text-transform: uppercase;
            letter-spacing: 0.6em;
            animation: ultimate-label-flash 0.3s ease-out infinite alternate;
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
        }
        
        @keyframes ultimate-label-flash {
            from { opacity: 0.6; text-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
            to { opacity: 1; text-shadow: 0 0 40px rgba(251, 191, 36, 1); }
        }
        
        .ultimate-name {
            font-family: 'Cinzel', serif;
            font-size: 3.5rem;
            font-weight: 900;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            text-shadow: 
                0 0 30px rgba(239, 68, 68, 0.9),
                0 0 60px rgba(239, 68, 68, 0.6),
                4px 4px 0px rgba(0, 0, 0, 0.8);
            animation: ultimate-name-glow 1.5s ease-in-out infinite alternate;
        }
        
        @keyframes ultimate-name-glow {
            from { 
                text-shadow: 
                    0 0 30px rgba(239, 68, 68, 0.9),
                    0 0 60px rgba(239, 68, 68, 0.6),
                    4px 4px 0px rgba(0, 0, 0, 0.8);
            }
            to { 
                text-shadow: 
                    0 0 50px rgba(251, 191, 36, 1),
                    0 0 100px rgba(239, 68, 68, 0.8),
                    4px 4px 0px rgba(0, 0, 0, 0.8);
            }
        }
    </style>

    <!-- Modals -->
    <div id="game-modal" class="game-modal">
        <div class="modal-content">
            <div id="modal-title">Título</div>
            <div id="modal-content">Conteúdo</div>
            <div id="modal-buttons"></div>
        </div>
    </div>

    <!-- Crypto-JS for encryption (works in HTTP) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
    <!-- Tactical Data Loader (new system) -->
    <script src="<?= asset('js/tactical-data-loader.js') ?>"></script>
    <script src="<?= asset('js/effects-data.js') ?>"></script>
    <script src="<?= asset('js/elemental-data.js') ?>"></script>
    <script src="<?= asset('js/tactical-skill-engine.js') ?>"></script>
    <script src="<?= asset('js/skills-data.js') ?>"></script>
    <script src="<?= asset('js/skill-engine.js') ?>"></script>
    <script src="<?= asset('js/map-entity-bridge.js') ?>"></script>
    <script src="<?= asset('js/map-sfx.js') ?>"></script>
    <script>
        // Configuração de Debug - Controlado via console do navegador
        // Para ativar debug: digite 'debug = true' ou 'window.DEBUG_MODE = true' no console
        window._DEBUG_MODE = false;
        
        // Flag de DEBUG_MODE do PHP (controla criptografia)
        // Quando true: dados são enviados em texto plano (RAW)
        // Quando false: dados são criptografados
        window.ENCRYPTION_DEBUG_MODE = <?= json_encode($data['debug_mode'] ?? false) ?>;
        
        // Criar setter/observer para DEBUG_MODE que inicializa o debug automaticamente
        Object.defineProperty(window, 'DEBUG_MODE', {
            get() { 
                return this._DEBUG_MODE || false; 
            },
            set(value) {
                const oldValue = this._DEBUG_MODE || false;
                this._DEBUG_MODE = value === true;
                
                // Se foi ativado (mudou de false para true)
                if (this._DEBUG_MODE === true && oldValue !== true) {
                    console.log('[DEBUG] DEBUG_MODE foi ativado via console. Tentando inicializar debug...');
                    // Tentar ativar o debug - tentar até conseguir ou timeout
                    let attempts = 0;
                    const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)
                    const tryEnable = () => {
                        attempts++;
                        if (window.MapDebug && typeof window.MapDebug.enable === 'function') {
                            if (window.MapDebug.enable()) {
                                console.log('[DEBUG] Debug ativado com sucesso!');
                                return;
                            }
                        }
                        // Se MapDebug ainda não foi carregado ou enable retornou false, tentar novamente
                        if (attempts < maxAttempts) {
                            setTimeout(tryEnable, 100);
                        } else {
                            console.warn('[DEBUG] Não foi possível ativar o debug. Certifique-se de que o jogo foi carregado completamente.');
                        }
                    };
                    tryEnable();
                } else if (this._DEBUG_MODE === false && oldValue === true) {
                    // Foi desativado, desativar o debug
                    if (window.MapDebug && typeof window.MapDebug.disable === 'function') {
                        window.MapDebug.disable();
                    }
                }
            },
            configurable: true,
            enumerable: true
        });
        
        // Criar alias 'debug' para facilitar uso no console
        Object.defineProperty(window, 'debug', {
            get() { 
                return window.DEBUG_MODE; 
            },
            set(value) {
                window.DEBUG_MODE = value;
            },
            configurable: true,
            enumerable: true
        });
    </script>
    <script src="<?= asset('js/map-debug.js') ?>"></script>
    <script src="<?= asset('js/map-engine.js') ?>"></script>
    <script src="<?= asset('js/performance-monitor.js') ?>"></script>
    <script src="<?= asset('js/dialogue-system.js') ?>"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    </script>
</body>
</html>
