<?php
$activePage = 'character';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Profile | RPG</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <?php include 'styles.php'; ?>
    <style>
        /* --- PREMIUM CHARACTER UI 1000% --- */

        /* Layout Grid */
        .char-screen-layout {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 2rem;
            height: calc(100vh - 2rem);
            max-width: 1800px;
            margin: 0 auto;
            padding: 1rem;
        }

        /* Glass Panels */
        .glass-panel-dark {
            background: linear-gradient(180deg, rgba(15, 15, 15, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 40px rgba(0,0,0,0.5);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Headers */
        .panel-header-modern {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.02);
        }
        .header-title {
            font-family: 'Cinzel', serif;
            font-weight: 700;
            color: #e5e5e5;
            font-size: 1.1rem;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .header-icon { color: #d4af37; opacity: 0.8; }

        /* --- LEFT COLUMN: STATS --- */
        .stat-row-premium {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.85rem 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            transition: all 0.2s ease;
        }
        .stat-row-premium:hover { background: rgba(255,255,255,0.03); padding-left: 1.75rem; }
        
        .stat-name { 
            font-family: 'Cinzel', serif; 
            font-size: 0.85rem; 
            color: #a8a29e; 
            letter-spacing: 0.1em;
        }
        .stat-val-wrapper { display: flex; align-items: center; gap: 1rem; }
        .stat-value { 
            font-family: 'Inter', sans-serif; 
            font-weight: 700; 
            color: #fff; 
            font-size: 1rem;
            width: 1.5rem;
            text-align: right;
        }
        .btn-plus {
            width: 20px; height: 20px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid #d4af37;
            color: #d4af37;
            border-radius: 2px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0.6;
        }
        .btn-plus:hover { opacity: 1; background: rgba(212, 175, 55, 0.1); }

        /* --- RIGHT COLUMN: HERO STAGE --- */
        .hero-stage {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at center, rgba(30,30,30,0.5) 0%, rgba(0,0,0,0.8) 100%);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            overflow: hidden; /* Clips blurry edges */
        }

        /* The Container that holds Image + Slots together */
        /* Maintains aspect ratio and position relative for absolute children */
        .paper-doll-container {
            position: relative;
            width: 50vh; /* Responsive width based on viewport height */
            height: 80vh; /* Responsive height */
            max-width: 600px;
            max-height: 800px;
            transition: all 0.3s ease;
        }

        /* Hero Image Layer */
        .hero-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 50px rgba(0,0,0,0.9));
            z-index: 1;
            /* Subtle idle breathe */
            animation: heroIdle 6s ease-in-out infinite;
        }
        @keyframes heroIdle { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }

        /* Background Glow behind Hero */
        .hero-glow {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 80%; height: 60%;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
        }

        /* --- EQUIPMENT SLOTS --- */
        /* Absolute positioned relative to .paper-doll-container */
        .gear-slot {
            position: absolute;
            width: 4.5rem;
            height: 4.5rem;
            background: rgba(15, 15, 15, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px; /* Slightly rounded */
            display: flex;
            align-items: center;
            justify-content: center;
            color: #57534e;
            z-index: 10;
            backdrop-filter: blur(4px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            cursor: pointer;
        }
        
        .gear-slot:hover {
            border-color: #d4af37;
            color: #d4af37;
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
            background: rgba(20, 20, 20, 0.95);
        }

        .gear-slot i { width: 1.5rem; height: 1.5rem; transition: all 0.3s; }
        .gear-slot:hover i { transform: scale(1.1); stroke-width: 2.5px; }

        /* Connector Lines (Optional decorative) */
        .slot-connector {
            position: absolute;
            background: rgba(255,255,255,0.1);
            z-index: 5;
            pointer-events: none;
        }

        /* Specific Positions (Percentages for responsiveness) */
        /* Left Side */
        .pos-left { left: -2rem; } 
        /* Right Side */
        .pos-right { right: -2rem; }
        /* Center */
        .pos-center { left: 50%; transform: translateX(-50%); }

        /* Vertical Spread */
        .row-1 { top: 5%; } /* Head */
        .row-2 { top: 25%; } /* Shoulders/Neck/Chest area */
        .row-3 { top: 45%; } /* Hands/Weapons */
        .row-4 { bottom: 25%; } /* Legs/Acc */
        .row-5 { bottom: 5%; } /* Feet */

        /* Override transforms for center items on hover */
        .pos-center.gear-slot:hover { transform: translateX(-50%) scale(1.1); }

        /* --- SKILLS SECTION (Bottom Left) --- */
        .skill-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Responsive */
            gap: 0.75rem;
            padding: 1rem;
        }
        .skill-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 0.75rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.2s;
        }
        .skill-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); }
        
        .skill-icon-box {
            width: 42px; height: 42px;
            background: #202020;
            border: 1px solid #333;
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
        }

        /* Mobile Adjustments */
        @media (max-width: 1024px) {
            .char-screen-layout {
                grid-template-columns: 1fr;
                height: auto;
                overflow-y: auto;
            }
            .paper-doll-container {
                width: 100%;
                height: 60vh;
            }
        }

    </style>
</head>
<body class="bg-[#050505] text-stone-200 overflow-hidden">

    <?php include 'sidebar.php'; ?>

    <div class="background-city-container" style="left: 260px; width: calc(100% - 260px);">
        <!-- Darker cinematic background -->
        <div class="background-city-img" style="background-image: url('assets/img/tavern-background.webp'); filter: brightness(0.15) grayscale(40%) blur(4px);"></div>
    </div>

    <!-- Main Content -->
    <main class="ml-[260px] relative z-10 w-full h-full">
        
        <div class="char-screen-layout">
            
            <!-- LEFT PANEL: STATS & SKILLS -->
            <div class="flex flex-col gap-4 h-full">
                
                <!-- ATTRIBUTES -->
                <div class="glass-panel-dark flex-1">
                    <div class="panel-header-modern">
                        <div class="header-title"><i data-lucide="bar-chart" class="header-icon w-5 h-5"></i> Attributes</div>
                        <div class="text-xs text-stone-500 uppercase tracking-widest">Points: <span class="text-amber-500 font-bold text-sm">5</span></div>
                    </div>
                    
                    <div class="overflow-y-auto custom-scrollbar flex-1 py-2">
                         <!-- Stat Block -->
                        <div class="stat-row-premium">
                            <span class="stat-name">Strength</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">12</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>
                        <div class="stat-row-premium">
                            <span class="stat-name">Agility</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">15</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>
                        <div class="stat-row-premium">
                            <span class="stat-name">Vitality</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">10</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>
                        <div class="stat-row-premium">
                            <span class="stat-name">Intelligence</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">8</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>
                        <div class="stat-row-premium">
                            <span class="stat-name">Dexterity</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">14</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>
                        <div class="stat-row-premium">
                            <span class="stat-name">Luck</span>
                            <div class="stat-val-wrapper">
                                <span class="stat-value">5</span>
                                <div class="btn-plus"><i data-lucide="plus" style="width:12px;"></i></div>
                            </div>
                        </div>

                         <div class="mt-4 mx-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                            <div class="flex justify-between"><span class="text-stone-500">ATK</span> <span class="text-stone-200 font-bold">145</span></div>
                            <div class="flex justify-between"><span class="text-stone-500">DEF</span> <span class="text-stone-200 font-bold">88</span></div>
                            <div class="flex justify-between"><span class="text-stone-500">HIT</span> <span class="text-stone-200 font-bold">120</span></div>
                            <div class="flex justify-between"><span class="text-stone-500">CRIT</span> <span class="text-stone-200 font-bold">15%</span></div>
                        </div>
                    </div>
                </div>

                <!-- SKILLS (Bottom Left) -->
                <div class="glass-panel-dark h-[35%]">
                     <div class="panel-header-modern">
                        <div class="header-title"><i data-lucide="sparkles" class="header-icon w-5 h-5"></i> Skills</div>
                    </div>
                    <div class="overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <!-- Active Skill -->
                        <div class="skill-card">
                            <div class="skill-icon-box text-amber-500"><i data-lucide="crosshair"></i></div>
                            <div>
                                <div class="text-stone-200 font-bold text-sm">Double Strafe</div>
                                <div class="text-[0.65rem] text-stone-500 uppercase tracking-wide">Level 5 • Active</div>
                            </div>
                        </div>
                         <!-- Active Skill -->
                        <div class="skill-card">
                            <div class="skill-icon-box text-emerald-500"><i data-lucide="wind"></i></div>
                            <div>
                                <div class="text-stone-200 font-bold text-sm">Wind Walk</div>
                                <div class="text-[0.65rem] text-stone-500 uppercase tracking-wide">Level 1 • Buff</div>
                            </div>
                        </div>
                        <!-- Locked -->
                         <div class="skill-card opacity-50 border-dashed">
                            <div class="skill-icon-box text-stone-600"><i data-lucide="lock"></i></div>
                            <div class="text-stone-500 text-xs italic">Slot Locked</div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- RIGHT PANEL: HERO STAGE (The "1000%" Part) -->
            <div class="hero-stage glass-panel-dark relative">
                
                <div class="absolute top-4 left-6 z-20">
                    <h1 class="text-3xl font-serif text-white uppercase tracking-widest drop-shadow-lg" style="font-family: 'Cinzel', serif;">Willian</h1>
                    <div class="text-amber-500 text-xs font-bold tracking-[0.4em] mt-1 uppercase">Level 7 • Swordsman</div>
                </div>

                <!-- THE PAPER DOLL CONTAINER -->
                <!-- Pinned to responsive height/width, keeping slots relative -->
                <div class="paper-doll-container">
                    
                    <!-- Glow Behind -->
                    <div class="hero-glow"></div>
                    
                    <!-- The Hero Image -->
                    <img src="assets/img/archer-male.webp" class="hero-img" alt="Hero">

                    <!-- SLOTS: Positioned Relative to this container -->
                    
                    <!-- Row 1: Head -->
                    <div class="gear-slot pos-center row-1" title="Headgear">
                        <i data-lucide="crown"></i>
                    </div>

                    <!-- Row 2: Shoulders / Amulet -->
                    <div class="gear-slot pos-left row-2" style="left: 5%;" title="Shoulders">
                         <i data-lucide="shield-check"></i> <!-- Pauldrons? -->
                    </div>
                    <div class="gear-slot pos-right row-2" style="right: 5%;" title="Amulet">
                         <i data-lucide="gem"></i>
                    </div>

                    <!-- Row 3: Weapons / Hands -->
                    <div class="gear-slot pos-left row-3" style="left: -5%; top: 45%;" title="Main Hand">
                        <i data-lucide="sword"></i>
                    </div>
                     <div class="gear-slot pos-center row-2" style="top: 30%; width: 4rem; height: 4rem; z-index: 5;" title="Body Armor">
                        <i data-lucide="shirt"></i>
                    </div>
                    <div class="gear-slot pos-right row-3" style="right: -5%; top: 45%;" title="Off Hand">
                        <i data-lucide="shield"></i>
                    </div>

                    <!-- Row 4: Legs / Rings -->
                    <div class="gear-slot pos-left row-4" style="left: 10%;" title="Ring 1">
                         <i data-lucide="circle"></i>
                    </div>
                    <div class="gear-slot pos-right row-4" style="right: 10%;" title="Ring 2">
                         <i data-lucide="circle"></i>
                    </div>

                    <!-- Row 5: Boots -->
                    <div class="gear-slot pos-center row-5" title="Boots">
                        <i data-lucide="footprints"></i>
                    </div>

                </div>
            </div>

        </div>

    </main>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
