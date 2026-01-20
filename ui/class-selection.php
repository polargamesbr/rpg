<?php $activePage = 'class_selection'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Select Your Path - RPG</title>
    <?php include 'head.php'; ?>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            font-family: 'Inter', sans-serif;
        }

        /* Container for the accordion */
        .hero-gallery {
            display: flex;
            width: 100vw;
            height: 100vh;
            background: #000;
        }

        /* Individual Class Panel */
        .hero-panel {
            position: relative;
            flex: 1;
            height: 100%;
            transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
            overflow: hidden;
            cursor: pointer;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            filter: grayscale(0.6) brightness(0.7);
        }

        .hero-panel:last-child {
            border-right: none;
        }

        /* Interaction: Expand on Hover */
        .hero-panel:hover {
            flex: 3; /* Expands significantly */
            filter: grayscale(0) brightness(1.1);
            z-index: 10;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
        }

        /* Background Image (Character) */
        .hero-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center top;
            transition: transform 0.5s ease;
            width: 100%;
            height: 100%;
        }
        
        .hero-panel:hover .hero-bg {
            transform: scale(1.05); /* Subtle zoom */
        }

        /* Gradient Overlay for Text Readability */
        .overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
                to bottom, 
                rgba(0,0,0,0.3) 0%, 
                rgba(0,0,0,0.2) 50%, 
                rgba(0,0,0,0.9) 100%
            );
            transition: opacity 0.3s ease;
        }
        
        .hero-panel:hover .overlay {
            background: linear-gradient(
                to bottom, 
                rgba(0,0,0,0) 0%, 
                rgba(0,0,0,0.3) 60%, 
                rgba(0,0,0,0.95) 100%
            );
        }

        /* Content Container */
        .panel-content {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 3rem 2rem;
            color: white;
            transform: translateY(20px);
            transition: transform 0.4s ease, opacity 0.4s ease;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        
        .hero-panel:hover .panel-content {
            transform: translateY(0);
        }

        /* Class Title */
        .class-title {
            font-family: 'Cinzel', serif;
            font-size: 2rem; /* Compact when collapsed */
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
            text-shadow: 0 4px 8px rgba(0,0,0,0.8);
            white-space: nowrap;
            letter-spacing: 0.1em;
            transition: all 0.3s ease;
            position: relative;
        }

        .class-title::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -5px;
            width: 0%;
            height: 3px;
            background: var(--class-color);
            transition: width 0.4s ease 0.1s;
        }

        .hero-panel:hover .class-title {
            font-size: 3.5rem; /* Large when expanded */
        }
        
        .hero-panel:hover .class-title::after {
            width: 60px;
        }

        /* Hidden Description (Reveals on Hover) */
        .class-details {
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: all 0.5s ease;
            width: 100%;
        }

        .hero-panel:hover .class-details {
            max-height: 300px;
            opacity: 1;
            margin-top: 1rem;
        }

        .class-role {
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--class-color);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .class-desc {
            font-size: 1rem;
            color: #d6d3d1;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            max-width: 500px;
            text-shadow: 0 2px 4px rgba(0,0,0,1);
        }

        /* Stats Bars */
        .stat-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 0.5rem;
            width: 100%;
            max-width: 300px;
        }
        .stat-name {
            font-size: 0.75rem;
            color: #a8a29e;
            width: 40px;
            font-weight: 600;
        }
        .stat-track {
            flex: 1;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
            overflow: hidden;
        }
        .stat-fill {
            height: 100%;
            background: var(--class-color);
            box-shadow: 0 0 10px var(--class-color);
        }

        /* Select Button */
        .select-btn {
            margin-top: 2rem;
            background: transparent;
            border: 2px solid var(--class-color);
            color: var(--class-color);
            padding: 1rem 2.5rem;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 1.1rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .select-btn:hover {
            background: var(--class-color);
            color: #000;
            box-shadow: 0 0 30px var(--class-glow);
        }

        /* Class Icons (Lucide) */
        .class-icon-watermark {
            position: absolute;
            top: 2rem;
            right: 2rem;
            color: rgba(255,255,255,0.1);
            transform: scale(0.8) rotate(-10deg);
            transition: all 0.5s ease;
            z-index: 2;
        }
        
        .hero-panel:hover .class-icon-watermark {
            color: var(--class-color);
            opacity: 0.2;
            transform: scale(1.2) rotate(0deg);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .hero-gallery {
                flex-direction: column;
            }
            .hero-panel {
                border-right: none;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .class-title { font-size: 1.5rem; }
            .hero-panel:hover .class-title { font-size: 2rem; }
        }

    </style>
</head>
<body>

<div class="hero-gallery">

    <!-- Espadachim (Swordsman) -->
    <div class="hero-panel" style="--class-color: #ef4444; --class-glow: rgba(239, 68, 68, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>
        
        <i data-lucide="sword" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Swordsman</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="shield" class="w-4 h-4"></i> Tank • Melee • DPS</div>
                <p class="class-desc">The Vanguard. A master of steel who breaks enemy lines with overwhelming force and unyielding resilience.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 95%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 50%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 20%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

    <!-- Arqueiro (Archer) -->
    <div class="hero-panel" style="--class-color: #22c55e; --class-glow: rgba(34, 197, 94, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>

        <i data-lucide="crosshair" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Archer</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="target" class="w-4 h-4"></i> Ranged • Precision</div>
                <p class="class-desc">The Sharp Eye. Strikes from the shadows with deadly accuracy, never letting a target escape.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 40%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 100%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 50%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

    <!-- Mago (Mage) -->
    <div class="hero-panel" style="--class-color: #3b82f6; --class-glow: rgba(59, 130, 246, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>

        <i data-lucide="zap" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Mage</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="sparkles" class="w-4 h-4"></i> Magic • Control</div>
                <p class="class-desc">The Arcane Weaver. Bends the elements to their will, unleashing devastating spells upon entire armies.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 20%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 40%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 100%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

    <!-- Ladrão (Thief) -->
    <div class="hero-panel" style="--class-color: #a8a29e; --class-glow: rgba(168, 162, 158, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>

        <i data-lucide="ghost" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Thief</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="eye-off" class="w-4 h-4"></i> Stealth • Critical</div>
                <p class="class-desc">The Phantom. Moves unseen through the darkness, striking vital points before vanishing.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 40%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 90%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 60%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

    <!-- Acolito (Acolyte) -->
    <div class="hero-panel" style="--class-color: #facc15; --class-glow: rgba(250, 204, 21, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>

        <i data-lucide="sun" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Acolyte</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="heart" class="w-4 h-4"></i> Support • Healer</div>
                <p class="class-desc">The Lightbringer. Channels divine energy to heal allies and smite the wicked with holy fire.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 50%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 30%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 90%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

    <!-- Ferreiro (Blacksmith) -->
    <div class="hero-panel" style="--class-color: #f97316; --class-glow: rgba(249, 115, 22, 0.6);">
        <div class="hero-bg" style="background-image: url('assets/img/avatar.webp');"></div>
        <div class="overlay"></div>

        <i data-lucide="hammer" class="class-icon-watermark w-24 h-24"></i>

        <div class="panel-content">
            <h2 class="class-title">Blacksmith</h2>
            <div class="class-details">
                <div class="class-role"><i data-lucide="anvil" class="w-4 h-4"></i> Crafting • Utility</div>
                <p class="class-desc">The Iron Heart. Forges legendary weapons and armor, mastering the secrets of steel and fire.</p>
                
                <div class="stat-bar">
                    <span class="stat-name">STR</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 90%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">AGI</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 40%;"></div></div>
                </div>
                <div class="stat-bar">
                    <span class="stat-name">INT</span>
                    <div class="stat-track"><div class="stat-fill" style="width: 60%;"></div></div>
                </div>

                <button class="select-btn">Select Class</button>
            </div>
        </div>
    </div>

</div>

<script>
    // Initialize Icons
    lucide.createIcons();
    
    // Add click handling logic (optional foundation)
    document.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const heroName = e.target.closest('.hero-panel').querySelector('.class-title').innerText;
            alert('You have chosen the path of the ' + heroName + '!');
            // Here you would redirect or submit the form
        });
    });
</script>

</body>
</html>
