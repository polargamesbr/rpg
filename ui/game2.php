<?php $activePage = 'game'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Game - The Dark Temple</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --primary: #a855f7;
            --primary-dark: #7c3aed;
            --accent: #f97316;
            --bg-dark: #050508;
            --bg-card: rgba(10, 10, 15, 0.95);
        }
        * { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Crimson Text', serif; }
        .font-display { font-family: 'Cinzel', serif; }
        
        body {
            background: var(--bg-dark);
            overflow: hidden;
        }
        
        /* Ambient Effects */
        .ambient-glow {
            position: fixed;
            border-radius: 50%;
            filter: blur(150px);
            pointer-events: none;
            z-index: 0;
        }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: linear-gradient(180deg, var(--primary), transparent);
            border-radius: 3px;
        }
        
        /* Narrative Text Animation */
        .narrative-text {
            background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(200,200,220,0.8) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Choice Cards */
        .choice-card {
            position: relative;
            background: rgba(15, 10, 25, 0.8);
            border: 1px solid rgba(168, 85, 247, 0.15);
            backdrop-filter: blur(20px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .choice-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(168,85,247,0.1) 0%, transparent 50%);
            opacity: 0;
            transition: opacity 0.4s ease;
            border-radius: inherit;
        }
        .choice-card:hover::before { opacity: 1; }
        .choice-card:hover {
            border-color: rgba(168, 85, 247, 0.5);
            transform: translateY(-4px) scale(1.01);
            box-shadow: 
                0 20px 40px rgba(0,0,0,0.4),
                0 0 60px rgba(168, 85, 247, 0.15),
                inset 0 1px 0 rgba(255,255,255,0.05);
        }
        
        /* Attribute Badge Colors */
        .attr-strength { --attr-color: #ef4444; }
        .attr-dexterity { --attr-color: #22c55e; }
        .attr-intelligence { --attr-color: #3b82f6; }
        .attr-wisdom { --attr-color: #a855f7; }
        .attr-charisma { --attr-color: #f59e0b; }
        .attr-constitution { --attr-color: #06b6d4; }
        
        /* Dice Modal */
        .dice-container {
            animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        /* Scene Image Overlay */
        .scene-overlay {
            background: linear-gradient(
                135deg,
                rgba(5,5,8,0.9) 0%,
                rgba(5,5,8,0.4) 40%,
                rgba(5,5,8,0.2) 60%,
                transparent 100%
            );
        }
        
        /* Glowing Border */
        .glow-border {
            position: relative;
        }
        .glow-border::after {
            content: '';
            position: absolute;
            inset: -1px;
            background: linear-gradient(135deg, var(--primary), var(--accent), var(--primary));
            border-radius: inherit;
            z-index: -1;
            opacity: 0;
            transition: opacity 0.3s ease;
            filter: blur(8px);
        }
        .glow-border:hover::after { opacity: 0.5; }
        
        /* Particle Effect */
        .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: var(--primary);
            border-radius: 50%;
            opacity: 0;
            animation: particleRise 8s linear infinite;
        }
        @keyframes particleRise {
            0% { opacity: 0; transform: translateY(100vh) scale(0); }
            10% { opacity: 0.8; }
            90% { opacity: 0.3; }
            100% { opacity: 0; transform: translateY(-20vh) scale(1.5); }
        }
    </style>
</head>
<body class="text-white h-screen overflow-hidden">
    
    <!-- Ambient Background Effects -->
    <div class="ambient-glow w-[600px] h-[600px] bg-purple-600/10 top-[-20%] left-[-10%]"></div>
    <div class="ambient-glow w-[500px] h-[500px] bg-orange-500/5 bottom-[-10%] right-[-5%]"></div>
    <div class="ambient-glow w-[400px] h-[400px] bg-blue-600/5 top-[50%] left-[30%]"></div>
    
    <!-- Floating Particles -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
        <div class="particle" style="left: 25%; animation-delay: 2s;"></div>
        <div class="particle" style="left: 40%; animation-delay: 4s;"></div>
        <div class="particle" style="left: 60%; animation-delay: 1s;"></div>
        <div class="particle" style="left: 75%; animation-delay: 3s;"></div>
        <div class="particle" style="left: 90%; animation-delay: 5s;"></div>
    </div>
    
    <!-- Main Layout -->
    <div class="relative z-10 flex h-screen">
        
        <!-- Left Column: Scene Image -->
        <div class="w-[50%] relative">
            <img src="assets/img/guild.webp" alt="Scene" class="absolute inset-0 w-full h-full object-cover">
            <div class="scene-overlay absolute inset-0"></div>
            
            <!-- Floating Quest Info -->
            <div class="absolute top-8 left-8 z-20">
                <div class="bg-black/60 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5 shadow-2xl max-w-sm">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                            <i data-lucide="scroll" class="w-5 h-5 text-purple-200"></i>
                        </div>
                        <div>
                            <div class="text-[9px] text-purple-400 uppercase tracking-[0.2em] font-bold">Active Quest</div>
                            <h3 class="text-sm font-bold text-white font-display">The Dark Temple</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
                        <div class="flex items-center gap-1.5 text-amber-400">
                            <i data-lucide="map-pin" class="w-3 h-3"></i>
                            <span>Chapter 2</span>
                        </div>
                        <div class="w-px h-3 bg-white/10"></div>
                        <div class="flex items-center gap-1.5 text-purple-400">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            <span>Turn 5</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Player Stats (Bottom Left) -->
            <div class="absolute bottom-8 left-8 z-20">
                <div class="flex items-center gap-4">
                    <!-- Avatar -->
                    <div class="relative">
                        <div class="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-purple-500/40 ring-offset-2 ring-offset-black">
                            <img src="assets/img/swordman-male.webp" alt="Player" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-black">
                            7
                        </div>
                    </div>
                    
                    <!-- Stats Bars -->
                    <div class="space-y-2">
                        <div class="flex items-center gap-2">
                            <i data-lucide="heart" class="w-4 h-4 text-red-400"></i>
                            <div class="w-32 h-2 bg-black/60 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style="width: 75%"></div>
                            </div>
                            <span class="text-[10px] font-mono text-red-400">750/1000</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i data-lucide="droplet" class="w-4 h-4 text-blue-400"></i>
                            <div class="w-32 h-2 bg-black/60 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style="width: 60%"></div>
                            </div>
                            <span class="text-[10px] font-mono text-blue-400">180/300</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Right Column: Narrative + Choices -->
        <div class="w-[50%] flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0d0a15] to-[#0a0a0f]">
            
            <!-- Top Bar -->
            <div class="flex items-center justify-between px-8 py-4 border-b border-white/5">
                <div class="flex items-center gap-4">
                    <button class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                        <i data-lucide="volume-2" class="w-4 h-4 text-emerald-400 group-hover:text-emerald-300"></i>
                    </button>
                    <button class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                        <i data-lucide="settings" class="w-4 h-4 text-white/40 group-hover:text-white/80"></i>
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <button class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                        <i data-lucide="book-open" class="w-4 h-4 text-white/40 group-hover:text-purple-400"></i>
                    </button>
                    <button class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                        <i data-lucide="backpack" class="w-4 h-4 text-white/40 group-hover:text-amber-400"></i>
                    </button>
                    <div class="w-px h-6 bg-white/10 mx-1"></div>
                    <button class="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-2 group">
                        <i data-lucide="log-out" class="w-4 h-4 text-red-400"></i>
                        <span class="text-xs font-bold text-red-400 uppercase tracking-wider">Quit</span>
                    </button>
                </div>
            </div>
            
            <!-- Narrative Section -->
            <div class="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
                <div class="max-w-2xl">
                    
                    <!-- Chapter Title -->
                    <div class="mb-8">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-px bg-gradient-to-r from-purple-500 to-transparent"></div>
                            <span class="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em]">Chapter II</span>
                        </div>
                        <h1 class="text-3xl font-display font-bold text-white mb-2">The Descending Shadows</h1>
                    </div>
                    
                    <!-- Narrative Text -->
                    <div class="space-y-6 font-serif text-xl leading-relaxed">
                        <p class="narrative-text">
                            The ancient stone doors groan as they slowly part before you, revealing a vast chamber bathed in an otherworldly purple glow. Crystalline formations jut from the walls, pulsating with arcane energy that makes your skin tingle.
                        </p>
                        
                        <p class="narrative-text">
                            In the center of the chamber, a massive obsidian altar rises from the floor, covered in glowing runes that seem to writhe and shift when you're not looking directly at them. The air is thick with the scent of ozone and something... older. Something that has been sleeping for millennia.
                        </p>
                        
                        <p class="narrative-text">
                            A hooded figure stands before the altar, their back to you. You can see wisps of shadow curling around their form like living things. They haven't noticed your arrival—yet.
                        </p>
                        
                        <!-- Dramatic Pause -->
                        <div class="py-4 flex items-center justify-center gap-4">
                            <div class="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse"></div>
                            <div class="w-2 h-2 rounded-full bg-purple-500/30 animate-pulse" style="animation-delay: 0.2s"></div>
                            <div class="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse" style="animation-delay: 0.4s"></div>
                        </div>
                        
                        <p class="text-white/50 italic text-lg">
                            What will you do?
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Choices Section -->
            <div class="border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <div class="px-8 py-6">
                    
                    <!-- Turn Indicator -->
                    <div class="flex justify-center mb-5">
                        <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i>
                            <span class="text-[10px] font-black text-purple-300 uppercase tracking-[0.3em]">Your Turn — Choose Wisely</span>
                        </div>
                    </div>
                    
                    <!-- Choice Cards Grid -->
                    <div class="grid grid-cols-2 gap-4">
                        
                        <!-- Choice 1: Stealth -->
                        <button onclick="showDiceModal('DEXTERITY', 8, 12)" class="choice-card attr-dexterity rounded-2xl p-5 text-left group">
                            <div class="relative z-10">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <i data-lucide="footprints" class="w-4 h-4 text-emerald-400"></i>
                                        </div>
                                        <div>
                                            <div class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Dexterity 8</div>
                                            <div class="text-[8px] text-white/30 uppercase tracking-wider">DC 12 • Moderate</div>
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
                                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white"></i>
                                    </div>
                                </div>
                                <p class="text-sm text-white/70 group-hover:text-white/90 leading-relaxed transition-colors">
                                    Silently approach from the shadows, positioning yourself for a surprise attack or quick escape.
                                </p>
                            </div>
                        </button>
                        
                        <!-- Choice 2: Magic -->
                        <button onclick="showDiceModal('INTELLIGENCE', 7, 14)" class="choice-card attr-intelligence rounded-2xl p-5 text-left group">
                            <div class="relative z-10">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <i data-lucide="wand-sparkles" class="w-4 h-4 text-blue-400"></i>
                                        </div>
                                        <div>
                                            <div class="text-[9px] font-black text-blue-400 uppercase tracking-widest">Intelligence 7</div>
                                            <div class="text-[8px] text-white/30 uppercase tracking-wider">DC 14 • Hard</div>
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
                                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white"></i>
                                    </div>
                                </div>
                                <p class="text-sm text-white/70 group-hover:text-white/90 leading-relaxed transition-colors">
                                    Study the runes on the altar to understand and potentially disrupt the ritual in progress.
                                </p>
                            </div>
                        </button>
                        
                        <!-- Choice 3: Intimidation -->
                        <button onclick="showDiceModal('CHARISMA', 6, 10)" class="choice-card attr-charisma rounded-2xl p-5 text-left group">
                            <div class="relative z-10">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <i data-lucide="megaphone" class="w-4 h-4 text-amber-400"></i>
                                        </div>
                                        <div>
                                            <div class="text-[9px] font-black text-amber-400 uppercase tracking-widest">Charisma 6</div>
                                            <div class="text-[8px] text-white/30 uppercase tracking-wider">DC 10 • Easy</div>
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
                                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white"></i>
                                    </div>
                                </div>
                                <p class="text-sm text-white/70 group-hover:text-white/90 leading-relaxed transition-colors">
                                    Announce your presence with authority, demanding the figure halt their dark ritual.
                                </p>
                            </div>
                        </button>
                        
                        <!-- Choice 4: Direct Attack -->
                        <button onclick="showDiceModal('STRENGTH', 9, 15)" class="choice-card attr-strength rounded-2xl p-5 text-left group">
                            <div class="relative z-10">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <i data-lucide="sword" class="w-4 h-4 text-red-400"></i>
                                        </div>
                                        <div>
                                            <div class="text-[9px] font-black text-red-400 uppercase tracking-widest">Strength 9</div>
                                            <div class="text-[8px] text-white/30 uppercase tracking-wider">DC 15 • Dangerous</div>
                                        </div>
                                    </div>
                                    <div class="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:border-purple-400 transition-all">
                                        <i data-lucide="chevron-right" class="w-4 h-4 text-white/40 group-hover:text-white"></i>
                                    </div>
                                </div>
                                <p class="text-sm text-white/70 group-hover:text-white/90 leading-relaxed transition-colors">
                                    Charge directly at the figure with weapon drawn, ending the threat before they can react.
                                </p>
                            </div>
                        </button>
                        
                    </div>
                </div>
            </div>
            
        </div>
    </div>
    
    <!-- Dice Roll Modal -->
    <div id="diceModal" class="hidden fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
        <div class="relative w-full max-w-lg bg-gradient-to-br from-[#15101f] to-[#0a0510] rounded-3xl border border-purple-500/30 shadow-[0_0_100px_rgba(168,85,247,0.2)] overflow-hidden">
            
            <!-- Modal Header -->
            <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            
            <div class="p-8">
                <!-- Dice Container -->
                <div class="flex justify-center mb-8">
                    <div class="dice-container relative w-40 h-40">
                        <!-- Glow -->
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <!-- Die -->
                        <div class="relative w-full h-full">
                            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="dieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#1a1025"></stop>
                                        <stop offset="100%" stop-color="#0a0510"></stop>
                                    </linearGradient>
                                    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stop-color="#a855f7"></stop>
                                        <stop offset="100%" stop-color="#6b21a8"></stop>
                                    </linearGradient>
                                </defs>
                                <path d="M50 5 L93 28 L93 72 L50 95 L7 72 L7 28 Z" fill="url(#dieGrad)" stroke="url(#borderGrad)" stroke-width="2"></path>
                                <path d="M50 5 L50 50 L93 28" fill="none" stroke="rgba(168,85,247,0.2)" stroke-width="1"></path>
                                <path d="M50 5 L7 28 L50 50" fill="none" stroke="rgba(168,85,247,0.2)" stroke-width="1"></path>
                                <path d="M7 72 L50 95 L50 50" fill="none" stroke="rgba(168,85,247,0.2)" stroke-width="1"></path>
                                <path d="M93 72 L50 50 L50 95" fill="none" stroke="rgba(168,85,247,0.2)" stroke-width="1"></path>
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span id="diceValue" class="text-6xl font-display font-black text-purple-300 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">?</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Roll Info -->
                <div class="text-center mb-6">
                    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-4">
                        <span id="attrLabel" class="text-sm font-bold text-purple-400 uppercase tracking-widest">Dexterity</span>
                        <span class="text-white/30">+</span>
                        <span id="attrValue" class="text-lg font-bold text-white font-mono">8</span>
                    </div>
                    <div class="text-white/40 text-sm">
                        Difficulty Check: <span id="dcValue" class="text-purple-400 font-bold">12</span>
                    </div>
                </div>
                
                <!-- Roll Button -->
                <button onclick="rollDice()" class="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3">
                    <i data-lucide="dice-6" class="w-5 h-5"></i>
                    <span>Roll the Dice</span>
                </button>
                
                <!-- Cancel -->
                <button onclick="closeDiceModal()" class="w-full mt-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm font-bold uppercase tracking-widest transition-all">
                    Cancel
                </button>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        let currentAttr = '';
        let currentBonus = 0;
        let currentDC = 0;
        
        function showDiceModal(attr, bonus, dc) {
            currentAttr = attr;
            currentBonus = bonus;
            currentDC = dc;
            
            document.getElementById('attrLabel').textContent = attr;
            document.getElementById('attrValue').textContent = bonus;
            document.getElementById('dcValue').textContent = dc;
            document.getElementById('diceValue').textContent = '?';
            
            document.getElementById('diceModal').classList.remove('hidden');
        }
        
        function closeDiceModal() {
            document.getElementById('diceModal').classList.add('hidden');
        }
        
        function rollDice() {
            const diceEl = document.getElementById('diceValue');
            let rolls = 0;
            const maxRolls = 15;
            
            const interval = setInterval(() => {
                diceEl.textContent = Math.floor(Math.random() * 20) + 1;
                rolls++;
                
                if (rolls >= maxRolls) {
                    clearInterval(interval);
                    const finalRoll = Math.floor(Math.random() * 20) + 1;
                    const total = finalRoll + currentBonus;
                    diceEl.textContent = finalRoll;
                    
                    setTimeout(() => {
                        if (total >= currentDC) {
                            diceEl.classList.add('text-emerald-400');
                            diceEl.classList.remove('text-purple-300');
                        } else {
                            diceEl.classList.add('text-red-400');
                            diceEl.classList.remove('text-purple-300');
                        }
                    }, 300);
                }
            }, 80);
        }
        
        // Close modal on backdrop click
        document.getElementById('diceModal').addEventListener('click', function(e) {
            if (e.target === this) closeDiceModal();
        });
    </script>
    
</body>
</html>
