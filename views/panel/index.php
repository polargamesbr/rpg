<?php
$title = 'Character Panel - RPG Game';
$showSidebar = false;
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
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --gold-primary: #d4af37;
            --gold-secondary: #f2d16b;
            --gold-dark: #8a6d3b;
            --cyan-primary: #06b6d4;
            --bg-dark: #050508;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            min-height: 100vh;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ===== BACKGROUND SYSTEM ===== */
        .panel-bg {
            position: fixed;
            inset: 0;
            z-index: 0;
        }

        .panel-bg-image {
            position: absolute;
            inset: 0;
            background-image: url('<?= asset('img/tavern-background.webp') ?>');
            background-size: cover;
            background-position: center;
            opacity: 0.15;
            filter: blur(2px) saturate(0.9);
        }

        .panel-bg-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, 
                rgba(5, 5, 8, 0.7) 0%,
                rgba(5, 5, 8, 0.5) 40%,
                rgba(5, 5, 8, 0.85) 100%
            );
        }

        /* Ambient Glows */
        .glow-1 {
            position: absolute;
            top: -15%;
            left: 10%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 60%);
            border-radius: 50%;
            animation: glowPulse 10s ease-in-out infinite;
        }

        .glow-2 {
            position: absolute;
            bottom: -20%;
            right: 5%;
            width: 700px;
            height: 700px;
            background: radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 55%);
            border-radius: 50%;
            animation: glowPulse 12s ease-in-out infinite reverse;
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
        }

        .panel-texture {
            position: absolute;
            inset: 0;
            background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
            opacity: 0.3;
        }

        /* Particles */
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
            box-shadow: 0 0 8px var(--gold-primary);
        }

        .particle-cyan {
            background: radial-gradient(circle, #67e8f9, var(--cyan-primary));
            box-shadow: 0 0 8px var(--cyan-primary);
        }

        .particle-white {
            background: radial-gradient(circle, #fff, #cbd5e1);
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
        }

        @keyframes particleFloat {
            0% {
                transform: translateY(100vh) translateX(0) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 0.8;
                transform: translateY(85vh) translateX(5px) scale(1);
            }
            90% { opacity: 0.6; }
            100% {
                transform: translateY(-10vh) translateX(-15px) scale(0.3);
                opacity: 0;
            }
        }

        /* ===== MAIN CONTENT ===== */
        .panel-container {
            position: relative;
            z-index: 10;
            min-height: 100vh;
            padding: 2rem;
        }

        .panel-content {
            max-width: 1400px;
            margin: 0 auto;
        }

        /* ===== HEADER ===== */
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5rem;
            animation: fadeSlideDown 0.6s ease-out forwards;
            opacity: 0;
        }

        @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .header-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
            animation: iconFloat 4s ease-in-out infinite;
        }

        @keyframes iconFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }

        .header-icon svg {
            width: 28px;
            height: 28px;
            color: #000;
        }

        .header-text h1 {
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: 0.04em;
            text-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
            margin-bottom: 0.25rem;
        }

        .header-text h1 span {
            background: linear-gradient(135deg, var(--gold-secondary), var(--gold-primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header-text p {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
            letter-spacing: 0.05em;
        }

        /* Logout Button */
        .btn-logout {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 0.75rem;
            color: #f87171;
            font-size: 0.8rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-logout:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
        }

        .btn-logout svg {
            width: 16px;
            height: 16px;
        }

        /* ===== ACTION BAR ===== */
        .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding: 1.25rem 1.5rem;
            background: rgba(8, 8, 12, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 1.25rem;
            animation: fadeSlideUp 0.6s ease-out 0.2s forwards;
            opacity: 0;
        }

        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .character-count {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .count-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border-radius: 0.5rem;
            color: #000;
            font-weight: 800;
            font-size: 1rem;
        }

        .count-text {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .count-text strong {
            color: rgba(255, 255, 255, 0.8);
        }

        /* New Character Button */
        .btn-new-character {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border: none;
            border-radius: 0.875rem;
            color: #000;
            font-family: 'Cinzel', serif;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-decoration: none;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .btn-new-character:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(212, 175, 55, 0.4);
        }

        .btn-new-character::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            animation: shimmerBtn 3s infinite;
        }

        @keyframes shimmerBtn {
            0% { left: -100%; }
            50%, 100% { left: 150%; }
        }

        .btn-new-character svg {
            width: 18px;
            height: 18px;
        }

        /* ===== CHARACTER GRID ===== */
        .characters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 2rem;
        }

        /* ===== PREMIUM CHARACTER CARD ===== */
        .character-card {
            position: relative;
            border-radius: 1.5rem;
            overflow: hidden;
            background: rgba(8, 8, 12, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.06);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
            opacity: 0;
            animation: cardEntrance 0.6s ease-out forwards;
        }

        .character-card:nth-child(1) { animation-delay: 0.1s; }
        .character-card:nth-child(2) { animation-delay: 0.2s; }
        .character-card:nth-child(3) { animation-delay: 0.3s; }
        .character-card:nth-child(4) { animation-delay: 0.4s; }
        .character-card:nth-child(5) { animation-delay: 0.5s; }
        .character-card:nth-child(6) { animation-delay: 0.6s; }

        @keyframes cardEntrance {
            from {
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .character-card:hover {
            transform: translateY(-12px) scale(1.02);
            border-color: rgba(212, 175, 55, 0.3);
            box-shadow: 
                0 30px 80px rgba(0, 0, 0, 0.6),
                0 0 60px color-mix(in srgb, var(--class-color, var(--gold-primary)) 15%, transparent);
        }

        /* Card Portrait Section */
        .card-portrait {
            position: relative;
            height: 320px;
            overflow: hidden;
            background: linear-gradient(135deg, #0a0a0f 0%, #15151f 100%);
        }

        .card-portrait-image {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center 20%;
            transition: transform 0.6s ease;
        }

        .character-card:hover .card-portrait-image {
            transform: scale(1.08);
        }

        /* Portrait Gradient Overlays - Only at bottom for text contrast */
        .card-portrait::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg,
                rgba(5, 5, 8, 0) 0%,
                rgba(5, 5, 8, 0) 50%,
                rgba(5, 5, 8, 0.7) 80%,
                rgba(8, 8, 12, 1) 100%
            );
            pointer-events: none;
        }

        /* Class Accent Glow */
        .card-portrait::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 150px;
            background: linear-gradient(to top, 
                color-mix(in srgb, var(--class-color, var(--gold-primary)) 10%, transparent),
                transparent
            );
            z-index: 1;
            opacity: 0;
            transition: opacity 0.5s ease;
        }

        .character-card:hover .card-portrait::before {
            opacity: 1;
        }

        /* ===== INLINE LEVEL INDICATOR ===== */
        .level-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 48px;
            height: 48px;
            background: linear-gradient(135deg, var(--class-color, var(--gold-primary)), color-mix(in srgb, var(--class-color, var(--gold-primary)) 50%, #000));
            border-radius: 0.75rem;
            position: relative;
            box-shadow: 
                0 4px 20px color-mix(in srgb, var(--class-color, var(--gold-primary)) 40%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
        }

        .level-indicator::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 0.75rem;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
        }

        .level-indicator .lvl-num {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            font-weight: 900;
            color: #000;
            text-shadow: 0 1px 2px rgba(255,255,255,0.2);
            position: relative;
            z-index: 1;
        }

        .level-indicator .lvl-text {
            position: absolute;
            bottom: -0.5rem;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.5rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255, 255, 255, 0.5);
            background: rgba(0, 0, 0, 0.8);
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            white-space: nowrap;
        }

        /* Delete Button - Premium */
        .btn-delete {
            position: absolute;
            top: 1rem;
            right: 1rem;
            z-index: 10;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 10, 10, 0.9));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 0.75rem;
            color: #f87171;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: scale(0.9);
        }

        .character-card:hover .btn-delete {
            opacity: 1;
            transform: scale(1);
        }

        .btn-delete:hover {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
            border-color: rgba(239, 68, 68, 0.6);
            color: #fca5a5;
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }

        .btn-delete svg {
            width: 18px;
            height: 18px;
        }

        /* ===== CUSTOM MODAL ===== */
        .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .modal-content {
            position: relative;
            width: 90%;
            max-width: 420px;
            background: linear-gradient(135deg, rgba(15, 15, 20, 0.98), rgba(8, 8, 12, 0.98));
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 1.5rem;
            padding: 2rem;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 
                0 25px 80px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.02);
        }

        .modal-overlay.active .modal-content {
            transform: scale(1) translateY(0);
        }

        .modal-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
            border: 2px solid rgba(239, 68, 68, 0.3);
            border-radius: 1rem;
            animation: modalIconPulse 2s ease-in-out infinite;
        }

        @keyframes modalIconPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
            50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }

        .modal-icon svg {
            width: 28px;
            height: 28px;
            color: #f87171;
        }

        .modal-title {
            font-family: 'Cinzel', serif;
            font-size: 1.25rem;
            font-weight: 700;
            color: #fff;
            text-align: center;
            margin-bottom: 0.75rem;
        }

        .modal-text {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
            line-height: 1.6;
            margin-bottom: 2rem;
        }

        .modal-char-name {
            color: var(--gold-primary);
            font-weight: 600;
        }

        .modal-actions {
            display: flex;
            gap: 1rem;
        }

        .modal-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem 1.25rem;
            border-radius: 0.75rem;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }

        .modal-btn-cancel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
        }

        .modal-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            color: #fff;
        }

        .modal-btn-danger {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: #fff;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
        }

        .modal-btn-danger:hover {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
        }

        .modal-btn svg {
            width: 16px;
            height: 16px;
        }

        /* ===== TOAST NOTIFICATIONS ===== */
        .toast-container {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            z-index: 2000;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
        }

        .toast {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: linear-gradient(135deg, rgba(15, 15, 20, 0.98), rgba(8, 8, 12, 0.98));
            backdrop-filter: blur(20px);
            border-radius: 0.875rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            min-width: 300px;
        }

        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }

        .toast-icon {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.625rem;
            flex-shrink: 0;
        }

        .toast-icon svg {
            width: 18px;
            height: 18px;
        }

        .toast-success .toast-icon {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .toast-success .toast-icon svg {
            color: #4ade80;
        }

        .toast-error .toast-icon {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .toast-error .toast-icon svg {
            color: #f87171;
        }

        .toast-info .toast-icon {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
            border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .toast-info .toast-icon svg {
            color: #60a5fa;
        }

        .toast-content {
            flex: 1;
        }

        .toast-title {
            font-size: 0.85rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 0.125rem;
        }

        .toast-message {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .toast-close {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            border-radius: 0.5rem;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .toast-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        .toast-close svg {
            width: 14px;
            height: 14px;
        }

        .toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            border-radius: 0 0 0.875rem 0.875rem;
            animation: toastProgress 4s linear forwards;
        }

        .toast-success .toast-progress {
            background: linear-gradient(90deg, #22c55e, #4ade80);
        }

        .toast-error .toast-progress {
            background: linear-gradient(90deg, #dc2626, #f87171);
        }

        .toast-info .toast-progress {
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }

        @keyframes toastProgress {
            from { width: 100%; }
            to { width: 0%; }
        }

        /* ===== CARD CONTENT SECTION ===== */
        .card-content {
            position: relative;
            padding: 1.5rem;
            z-index: 5;
        }

        /* Character Title & Class */
        .char-title-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .char-info {
            flex: 1;
            min-width: 0;
        }

        .name-level-row {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            margin-bottom: 0.375rem;
        }

        .character-name {
            font-family: 'Cinzel', serif;
            font-size: 1.375rem;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 0 30px color-mix(in srgb, var(--class-color, var(--gold-primary)) 40%, transparent);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .class-line {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .class-line svg {
            width: 14px;
            height: 14px;
            color: var(--class-color, var(--gold-primary));
        }

        .class-line span {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        /* City Badge */
        .city-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 0.625rem;
            margin-bottom: 1rem;
        }

        .city-badge svg {
            width: 12px;
            height: 12px;
            color: var(--gold-primary);
        }

        .city-badge span {
            font-size: 0.7rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.5);
        }

        /* ===== VITALITY BAR - FFUI STYLE ===== */
        .vitality-section {
            margin-bottom: 1.25rem;
        }

        .vitality-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .vitality-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .vitality-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 0.375rem;
        }

        .vitality-icon svg {
            width: 12px;
            height: 12px;
            color: #f87171;
            fill: #f87171;
        }

        .vitality-label span {
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #f87171;
        }

        .vitality-values {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
        }

        .vitality-current {
            font-size: 1.25rem;
            font-weight: 800;
            color: #fff;
            font-family: 'Inter', sans-serif;
        }

        .vitality-max {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.4);
        }

        /* HP Bar */
        .hp-bar-container {
            height: 10px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 2px;
            overflow: hidden;
        }

        .hp-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc2626, #f87171, #fca5a5);
            border-radius: 0.375rem;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            position: relative;
            transition: width 0.5s ease;
        }

        .hp-bar-fill::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: barShimmer 2s infinite;
        }

        @keyframes barShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* Stats Row */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .stat-item {
            padding: 0.5rem 0.75rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 0.5rem;
        }

        .stat-label {
            font-size: 0.6rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255, 255, 255, 0.35);
            margin-bottom: 0.125rem;
        }

        .stat-value {
            font-size: 0.8rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.85);
        }

        .stat-value.active {
            color: #4ade80;
        }

        /* Play Button */
        .btn-play {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, var(--class-color, var(--gold-primary)), color-mix(in srgb, var(--class-color, var(--gold-primary)) 60%, #000));
            border: none;
            border-radius: 0.875rem;
            color: #000;
            font-family: 'Cinzel', serif;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-decoration: none;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .btn-play:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px color-mix(in srgb, var(--class-color, var(--gold-primary)) 40%, transparent);
        }

        .btn-play::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            animation: shimmerBtn 2.5s infinite;
        }

        .btn-play svg {
            width: 16px;
            height: 16px;
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            animation: fadeSlideUp 0.6s ease-out forwards;
        }

        .empty-content {
            text-align: center;
            position: relative;
        }

        .empty-glow {
            position: absolute;
            inset: -100px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 60%);
            border-radius: 50%;
            animation: glowPulse 6s ease-in-out infinite;
        }

        .empty-icon {
            position: relative;
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
            border: 2px solid rgba(212, 175, 55, 0.3);
            border-radius: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: iconFloat 4s ease-in-out infinite;
        }

        .empty-icon svg {
            width: 48px;
            height: 48px;
            color: var(--gold-primary);
        }

        .empty-title {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            font-weight: 700;
            color: var(--gold-primary);
            margin-bottom: 0.75rem;
        }

        .empty-text {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.4);
            max-width: 400px;
            margin: 0 auto 2rem;
            line-height: 1.6;
        }

        .btn-create-legend {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.25rem 2.5rem;
            background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
            border: none;
            border-radius: 1rem;
            color: #000;
            font-family: 'Cinzel', serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-decoration: none;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .btn-create-legend:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 50px rgba(212, 175, 55, 0.4);
        }

        .btn-create-legend::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            animation: shimmerBtn 3s infinite;
        }

        .btn-create-legend svg {
            width: 20px;
            height: 20px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .panel-container {
                padding: 1rem;
            }

            .panel-header {
                flex-direction: column;
                gap: 1.5rem;
                align-items: flex-start;
            }

            .header-left {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }

            .header-text h1 {
                font-size: 1.75rem;
            }

            .header-actions {
                width: 100%;
                justify-content: flex-end;
            }

            .action-bar {
                flex-direction: column;
                gap: 1rem;
            }

            .btn-new-character {
                width: 100%;
                justify-content: center;
            }

            .characters-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Background System -->
    <div class="panel-bg">
        <div class="panel-bg-image"></div>
        <div class="panel-bg-gradient"></div>
        <div class="glow-1"></div>
        <div class="glow-2"></div>
        <div class="panel-texture"></div>
        <div class="particles-container" id="particles"></div>
    </div>

    <!-- Main Content -->
    <div class="panel-container">
        <div class="panel-content">
            <!-- Header -->
            <header class="panel-header">
                <div class="header-left">
                    <div class="header-icon">
                        <i data-lucide="users"></i>
                    </div>
                    <div class="header-text">
                        <h1><span>Character</span> Panel</h1>
                        <p>Manage your legends and begin your adventure</p>
                    </div>
                </div>
                <div class="header-actions">
                    <a href="<?= url('logout') ?>" class="btn-logout">
                        <i data-lucide="log-out"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </header>

            <?php if (empty($characters)): ?>
                <!-- Empty State -->
                <div class="empty-state">
                    <div class="empty-content">
                        <div class="empty-glow"></div>
                        <div class="empty-icon">
                            <i data-lucide="user-plus"></i>
                        </div>
                        <h2 class="empty-title">No Characters Yet</h2>
                        <p class="empty-text">
                            Forge your first legend and embark on an epic journey through the realms
                        </p>
                        <a href="<?= url('game/character/create') ?>" class="btn-create-legend">
                            <i data-lucide="sparkles"></i>
                            <span>Create Your Legend</span>
                        </a>
                    </div>
                </div>
            <?php else: ?>
                <!-- Action Bar -->
                <div class="action-bar">
                    <div class="character-count">
                        <div class="count-badge"><?= count($characters) ?></div>
                        <div class="count-text">
                            <strong>Characters</strong> in your roster
                        </div>
                    </div>
                    <a href="<?= url('game/character/create') ?>" class="btn-new-character">
                        <i data-lucide="plus"></i>
                        <span>New Character</span>
                    </a>
                </div>

                <!-- Characters Grid -->
                <div class="characters-grid">
                    <?php foreach ($characters as $item): 
                        $char = $item['character'];
                        $class = $item['class'];
                        $classColor = $class['color_hex'] ?? '#d4af37';
                        $cityName = $class['starting_city'] ?? 'Unknown';
                        $imagePrefix = $class['image_prefix'] ?? 'archer';
                        $gender = $char['gender'] ?? 'male';
                        $charImage = $imagePrefix . '-' . $gender . '.png';
                        
                        // Mock HP for demo (normally from character data)
                        $currentHp = $char['current_hp'] ?? 20;
                        $maxHp = $char['max_hp'] ?? 20;
                        $hpPercent = ($currentHp / $maxHp) * 100;
                    ?>
                        <div class="character-card" style="--class-color: <?= htmlspecialchars($classColor) ?>;">
                            <!-- Portrait Section -->
                            <div class="card-portrait">
                                <div class="card-portrait-image" style="background-image: url('<?= asset('img/' . $charImage) ?>');"></div>
                                
                                <!-- Delete Button -->
                                <button type="button" 
                                   class="btn-delete"
                                   data-delete-url="<?= url('panel/character/delete/' . $char['uuid']) ?>"
                                   data-char-name="<?= htmlspecialchars($char['name']) ?>">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                            
                            <!-- Content Section -->
                            <div class="card-content">
                                <!-- Name + Level Row -->
                                <div class="char-title-row">
                                    <div class="char-info">
                                        <div class="name-level-row">
                                            <h3 class="character-name"><?= htmlspecialchars($char['name']) ?></h3>
                                            <div class="level-indicator">
                                                <span class="lvl-num"><?= htmlspecialchars($char['level'] ?? 1) ?></span>
                                                <span class="lvl-text">LVL</span>
                                            </div>
                                        </div>
                                        <div class="class-line">
                                            <i data-lucide="<?= htmlspecialchars($class['icon_name'] ?? 'sword') ?>"></i>
                                            <span><?= htmlspecialchars($class['display_name'] ?? $char['class']) ?></span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- City Badge -->
                                <div class="city-badge">
                                    <i data-lucide="map-pin"></i>
                                    <span><?= htmlspecialchars($cityName) ?></span>
                                </div>
                                
                                <!-- Vitality Bar - FFUI Style -->
                                <div class="vitality-section">
                                    <div class="vitality-header">
                                        <div class="vitality-label">
                                            <div class="vitality-icon">
                                                <i data-lucide="heart"></i>
                                            </div>
                                            <span>Vitality</span>
                                        </div>
                                        <div class="vitality-values">
                                            <span class="vitality-current"><?= $currentHp ?></span>
                                            <span class="vitality-max">/ <?= $maxHp ?></span>
                                        </div>
                                    </div>
                                    <div class="hp-bar-container">
                                        <div class="hp-bar-fill" style="width: <?= $hpPercent ?>%;"></div>
                                    </div>
                                </div>
                                
                                <!-- Stats -->
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-label">Created</div>
                                        <div class="stat-value"><?= date('M Y', strtotime($char['created_at'])) ?></div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-label">Status</div>
                                        <div class="stat-value active">Active</div>
                                    </div>
                                </div>
                                
                                <!-- Play Button -->
                                <a href="<?= url('panel/character/select/' . $char['uuid']) ?>" class="btn-play">
                                    <i data-lucide="play"></i>
                                    <span>Play</span>
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal-content">
            <div class="modal-icon">
                <i data-lucide="alert-triangle"></i>
            </div>
            <h3 class="modal-title">Delete Character?</h3>
            <p class="modal-text">
                Are you sure you want to delete <span class="modal-char-name" id="modalCharName"></span>? 
                This action cannot be undone.
            </p>
            <div class="modal-actions">
                <button type="button" class="modal-btn modal-btn-cancel" id="modalCancel">
                    <i data-lucide="x"></i>
                    Cancel
                </button>
                <button type="button" class="modal-btn modal-btn-danger" id="modalConfirm">
                    <i data-lucide="trash-2"></i>
                    Delete
                </button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <script>
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // ===== TOAST SYSTEM =====
        const ToastManager = {
            container: null,
            
            init() {
                this.container = document.getElementById('toastContainer');
            },
            
            show(type, title, message, duration = 4000) {
                const icons = {
                    success: 'check-circle',
                    error: 'x-circle',
                    info: 'info'
                };
                
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <div class="toast-icon">
                        <i data-lucide="${icons[type]}"></i>
                    </div>
                    <div class="toast-content">
                        <div class="toast-title">${title}</div>
                        <div class="toast-message">${message}</div>
                    </div>
                    <button class="toast-close">
                        <i data-lucide="x"></i>
                    </button>
                    <div class="toast-progress"></div>
                `;
                
                this.container.appendChild(toast);
                lucide.createIcons();
                
                // Trigger animation
                setTimeout(() => toast.classList.add('show'), 10);
                
                // Close button
                toast.querySelector('.toast-close').addEventListener('click', () => {
                    this.hide(toast);
                });
                
                // Auto remove
                setTimeout(() => this.hide(toast), duration);
            },
            
            hide(toast) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            },
            
            success(title, message) {
                this.show('success', title, message);
            },
            
            error(title, message) {
                this.show('error', title, message);
            },
            
            info(title, message) {
                this.show('info', title, message);
            }
        };

        // ===== MODAL SYSTEM =====
        const DeleteModal = {
            overlay: null,
            charNameEl: null,
            confirmBtn: null,
            cancelBtn: null,
            deleteUrl: null,
            
            init() {
                this.overlay = document.getElementById('deleteModal');
                this.charNameEl = document.getElementById('modalCharName');
                this.confirmBtn = document.getElementById('modalConfirm');
                this.cancelBtn = document.getElementById('modalCancel');
                
                // Bind events
                this.cancelBtn?.addEventListener('click', () => this.close());
                this.confirmBtn?.addEventListener('click', () => this.confirm());
                this.overlay?.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
                
                // ESC key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                        this.close();
                    }
                });
                
                // Bind delete buttons
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const url = btn.dataset.deleteUrl;
                        const name = btn.dataset.charName;
                        this.open(name, url);
                    });
                });
            },
            
            open(charName, deleteUrl) {
                this.deleteUrl = deleteUrl;
                this.charNameEl.textContent = charName;
                this.overlay.classList.add('active');
                lucide.createIcons();
            },
            
            close() {
                this.overlay.classList.remove('active');
                this.deleteUrl = null;
            },
            
            confirm() {
                if (this.deleteUrl) {
                    window.location.href = this.deleteUrl;
                }
            }
        };

        // ===== PARTICLE SYSTEM =====
        function createParticles() {
            const container = document.getElementById('particles');
            if (!container) return;
            
            const particleCount = 25;
            const colors = ['particle-gold', 'particle-cyan', 'particle-white'];

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`;
                
                const size = Math.random() * 4 + 2;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDuration = (Math.random() * 18 + 12) + 's';
                particle.style.animationDelay = (Math.random() * 12) + 's';
                
                container.appendChild(particle);
            }
        }

        // ===== CARD TILT EFFECT =====
        function initCardTilt() {
            const cards = document.querySelectorAll('.character-card');
            
            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = ((y - centerY) / centerY) * -5;
                    const rotateY = ((x - centerX) / centerX) * 5;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px) scale(1.02)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
                });
            });
        }

        // ===== INITIALIZE =====
        document.addEventListener('DOMContentLoaded', () => {
            createParticles();
            initCardTilt();
            ToastManager.init();
            DeleteModal.init();
            
            // Check for flash messages
            <?php if (isset($_SESSION['success'])): ?>
            ToastManager.success('Success', '<?= addslashes($_SESSION['success']) ?>');
            <?php unset($_SESSION['success']); endif; ?>
            
            <?php if (isset($_SESSION['error'])): ?>
            ToastManager.error('Error', '<?= addslashes($_SESSION['error']) ?>');
            <?php unset($_SESSION['error']); endif; ?>
        });
    </script>
</body>
</html>
