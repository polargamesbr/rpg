<?php $activePage = 'game'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Game - Cinematic Experience</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --gold: #d4a373;
            --gold-light: #e9c46a;
            --gold-dark: #bc6c25;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', sans-serif;
            background: #000;
            overflow: hidden;
        }
        
        .font-narrative { font-family: 'Cormorant Garamond', serif; }
        .font-display { font-family: 'Cinzel', serif; }
        
        /* Cinematic Bars */
        .cinematic-bar {
            position: fixed;
            left: 0;
            right: 0;
            height: 60px;
            background: #000;
            z-index: 100;
        }
        .cinematic-bar.top { top: 0; }
        .cinematic-bar.bottom { bottom: 0; }
        
        /* Scene Background */
        .scene-bg {
            position: fixed;
            inset: 0;
            z-index: 0;
        }
        .scene-bg img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            animation: slowZoom 30s ease-in-out infinite alternate;
        }
        @keyframes slowZoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
        }
        
        /* Vignette Effect */
        .vignette {
            position: fixed;
            inset: 0;
            background: radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.7) 100%);
            pointer-events: none;
            z-index: 1;
        }
        
        /* Film Grain */
        .film-grain {
            position: fixed;
            inset: 0;
            opacity: 0.03;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 2;
        }
        
        /* Narrative Panel */
        .narrative-panel {
            position: fixed;
            left: 60px;
            top: 50%;
            transform: translateY(-50%);
            width: 500px;
            max-height: 70vh;
            z-index: 50;
        }
        
        .narrative-glass {
            background: linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,15,10,0.9) 100%);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(212, 163, 115, 0.15);
            border-radius: 2px;
            box-shadow: 
                0 50px 100px rgba(0,0,0,0.8),
                inset 0 1px 0 rgba(255,255,255,0.05);
        }
        
        /* Decorative Corners */
        .corner-decor {
            position: absolute;
            width: 30px;
            height: 30px;
            border-color: var(--gold);
            opacity: 0.4;
        }
        .corner-decor.tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
        .corner-decor.tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
        .corner-decor.bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
        .corner-decor.br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }
        
        /* Scrollbar */
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { 
            background: linear-gradient(180deg, var(--gold), transparent);
            border-radius: 2px;
        }
        
        /* Choice Dock */
        .choice-dock {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 50;
            display: flex;
            gap: 16px;
        }
        
        .choice-orb {
            position: relative;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(0,0,0,0.8);
            border: 2px solid rgba(212, 163, 115, 0.3);
            backdrop-filter: blur(20px);
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .choice-orb::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1px solid transparent;
            background: linear-gradient(135deg, var(--gold), transparent 50%) border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .choice-orb:hover {
            transform: scale(1.15) translateY(-10px);
            border-color: var(--gold);
            box-shadow: 0 20px 50px rgba(212, 163, 115, 0.3), 0 0 80px rgba(212, 163, 115, 0.1);
        }
        .choice-orb:hover::before { opacity: 1; }
        
        .choice-orb .icon { 
            color: rgba(212, 163, 115, 0.6);
            transition: all 0.3s ease;
        }
        .choice-orb:hover .icon { 
            color: var(--gold-light);
            transform: scale(1.1);
        }
        
        .choice-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            padding: 16px 20px;
            background: rgba(0,0,0,0.95);
            border: 1px solid rgba(212, 163, 115, 0.2);
            border-radius: 4px;
            width: 280px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: none;
        }
        .choice-orb:hover .choice-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(-10px);
        }
        
        /* HUD Elements */
        .hud-element {
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.05);
        }
        
        /* Stat Ring */
        .stat-ring {
            position: relative;
            width: 50px;
            height: 50px;
        }
        .stat-ring svg {
            transform: rotate(-90deg);
        }
        .stat-ring-bg {
            fill: none;
            stroke: rgba(255,255,255,0.1);
            stroke-width: 3;
        }
        .stat-ring-fill {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
            transition: stroke-dashoffset 0.5s ease;
        }
        
        /* Typewriter Effect */
        @keyframes typewriter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .narrative-text p {
            animation: typewriter 0.8s ease-out forwards;
            opacity: 0;
        }
        .narrative-text p:nth-child(1) { animation-delay: 0.2s; }
        .narrative-text p:nth-child(2) { animation-delay: 0.6s; }
        .narrative-text p:nth-child(3) { animation-delay: 1.0s; }
        
        /* Dice Modal */
        .dice-modal {
            position: fixed;
            inset: 0;
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.95);
        }
        .dice-modal.active { display: flex; }
        
        .d20-visual {
            position: relative;
            width: 200px;
            height: 200px;
        }
        .d20-visual::before {
            content: '';
            position: absolute;
            inset: 0;
            background: conic-gradient(from 0deg, var(--gold), transparent, var(--gold));
            border-radius: 50%;
            animation: rotate 3s linear infinite;
            opacity: 0.3;
        }
        @keyframes rotate {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="text-white overflow-hidden">
    
    <!-- Cinematic Letterbox Bars -->
    <div class="cinematic-bar top"></div>
    <div class="cinematic-bar bottom"></div>
    
    <!-- Scene Background -->
    <div class="scene-bg">
        <img src="assets/img/tavern-background.jpg" alt="Scene">
    </div>
    
    <!-- Visual Effects -->
    <div class="vignette"></div>
    <div class="film-grain"></div>
    
    <!-- Top HUD -->
    <div class="fixed top-[70px] left-0 right-0 z-50 px-8">
        <div class="flex items-center justify-between">
            
            <!-- Quest Badge -->
            <div class="hud-element rounded-full px-6 py-3 flex items-center gap-4">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center">
                    <i data-lucide="compass" class="w-4 h-4 text-amber-200"></i>
                </div>
                <div>
                    <div class="text-[9px] text-amber-400/60 uppercase tracking-[0.3em] font-bold">Quest</div>
                    <div class="text-sm font-display font-bold text-white">The Forgotten Oath</div>
                </div>
                <div class="w-px h-8 bg-white/10 mx-2"></div>
                <div class="text-center">
                    <div class="text-[9px] text-white/40 uppercase tracking-widest">Chapter</div>
                    <div class="text-lg font-display font-bold text-amber-400">III</div>
                </div>
            </div>
            
            <!-- Player Stats -->
            <div class="hud-element rounded-full px-5 py-2 flex items-center gap-5">
                
                <!-- HP Ring -->
                <div class="flex items-center gap-3">
                    <div class="stat-ring">
                        <svg width="50" height="50" viewBox="0 0 50 50">
                            <circle class="stat-ring-bg" cx="25" cy="25" r="20"/>
                            <circle class="stat-ring-fill" cx="25" cy="25" r="20" 
                                    stroke="#ef4444" 
                                    stroke-dasharray="125.6" 
                                    stroke-dashoffset="31.4"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i data-lucide="heart" class="w-4 h-4 text-red-400"></i>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs font-mono font-bold text-red-400">850</div>
                        <div class="text-[9px] text-white/30 uppercase">HP</div>
                    </div>
                </div>
                
                <div class="w-px h-10 bg-white/10"></div>
                
                <!-- Mana Ring -->
                <div class="flex items-center gap-3">
                    <div class="stat-ring">
                        <svg width="50" height="50" viewBox="0 0 50 50">
                            <circle class="stat-ring-bg" cx="25" cy="25" r="20"/>
                            <circle class="stat-ring-fill" cx="25" cy="25" r="20" 
                                    stroke="#3b82f6" 
                                    stroke-dasharray="125.6" 
                                    stroke-dashoffset="50.24"/>
                        </svg>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i data-lucide="droplet" class="w-4 h-4 text-blue-400"></i>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs font-mono font-bold text-blue-400">240</div>
                        <div class="text-[9px] text-white/30 uppercase">Mana</div>
                    </div>
                </div>
                
                <div class="w-px h-10 bg-white/10"></div>
                
                <!-- Avatar -->
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-500/30">
                            <img src="assets/img/swordman-male.png" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 text-[10px] font-black flex items-center justify-center border-2 border-black">
                            7
                        </div>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-white">Aldric</div>
                        <div class="text-[9px] text-amber-400/60 uppercase tracking-wider">Swordsman</div>
                    </div>
                </div>
            </div>
            
            <!-- Menu Buttons -->
            <div class="hud-element rounded-full px-3 py-2 flex items-center gap-1">
                <button class="p-2.5 rounded-full hover:bg-white/10 transition-colors group">
                    <i data-lucide="book-open" class="w-4 h-4 text-white/40 group-hover:text-amber-400"></i>
                </button>
                <button class="p-2.5 rounded-full hover:bg-white/10 transition-colors group">
                    <i data-lucide="backpack" class="w-4 h-4 text-white/40 group-hover:text-amber-400"></i>
                </button>
                <button class="p-2.5 rounded-full hover:bg-white/10 transition-colors group">
                    <i data-lucide="map" class="w-4 h-4 text-white/40 group-hover:text-amber-400"></i>
                </button>
                <div class="w-px h-6 bg-white/10 mx-1"></div>
                <button class="p-2.5 rounded-full hover:bg-white/10 transition-colors group">
                    <i data-lucide="settings" class="w-4 h-4 text-white/40 group-hover:text-white"></i>
                </button>
                <button class="p-2.5 rounded-full hover:bg-red-500/20 transition-colors group">
                    <i data-lucide="log-out" class="w-4 h-4 text-white/40 group-hover:text-red-400"></i>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Narrative Panel (Left Side) -->
    <div class="narrative-panel">
        <div class="narrative-glass relative p-8">
            
            <!-- Decorative Corners -->
            <div class="corner-decor tl"></div>
            <div class="corner-decor tr"></div>
            <div class="corner-decor bl"></div>
            <div class="corner-decor br"></div>
            
            <!-- Turn Indicator -->
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div class="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <span class="text-sm font-display font-bold text-amber-400">5</span>
                </div>
                <div>
                    <div class="text-[9px] text-amber-400/60 uppercase tracking-[0.2em]">Current Turn</div>
                    <div class="text-xs text-white/60">Your decision shapes the story</div>
                </div>
            </div>
            
            <!-- Narrative Text -->
            <div class="narrative-text overflow-y-auto max-h-[45vh] custom-scroll pr-4 space-y-5">
                <p class="font-narrative text-2xl leading-relaxed text-stone-200 italic">
                    The flames from the great hearth cast dancing shadows across the tavern walls. The old knight's eyes meet yours—there's recognition there, and something else. Fear, perhaps.
                </p>
                
                <p class="font-narrative text-2xl leading-relaxed text-stone-200 italic">
                    "I know why you've come," he whispers, his gnarled fingers tightening around the hilt of a sword that hasn't seen battle in decades. "The Order sent you. But what they've told you... it's not the whole truth."
                </p>
                
                <p class="font-narrative text-2xl leading-relaxed text-stone-200 italic">
                    He slides a worn leather journal across the table toward you. The pages are yellowed with age, covered in cramped handwriting. "Read this. Then decide if I am truly the villain they claim."
                </p>
            </div>
            
            <!-- Decision Prompt -->
            <div class="mt-6 pt-4 border-t border-white/5">
                <div class="flex items-center gap-3">
                    <div class="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent"></div>
                    <span class="text-[10px] text-amber-400/80 uppercase tracking-[0.4em] font-bold">What will you do?</span>
                    <div class="flex-1 h-px bg-gradient-to-l from-amber-500/30 to-transparent"></div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Choice Dock (Bottom Center) -->
    <div class="choice-dock">
        
        <!-- Choice 1: Read -->
        <div class="choice-orb" onclick="showDice('WISDOM', 7, 10)">
            <i data-lucide="book-open" class="icon w-8 h-8"></i>
            <div class="choice-tooltip">
                <div class="flex items-center gap-2 mb-2">
                    <div class="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                        <span class="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Wisdom 7</span>
                    </div>
                    <span class="text-[9px] text-white/40">DC 10</span>
                </div>
                <p class="text-sm text-white/80 leading-relaxed">Read the journal carefully, seeking the truth hidden within its pages.</p>
            </div>
        </div>
        
        <!-- Choice 2: Interrogate -->
        <div class="choice-orb" onclick="showDice('CHARISMA', 6, 12)">
            <i data-lucide="message-circle" class="icon w-8 h-8"></i>
            <div class="choice-tooltip">
                <div class="flex items-center gap-2 mb-2">
                    <div class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        <span class="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Charisma 6</span>
                    </div>
                    <span class="text-[9px] text-white/40">DC 12</span>
                </div>
                <p class="text-sm text-white/80 leading-relaxed">Demand the knight tell you everything directly, using your persuasion.</p>
            </div>
        </div>
        
        <!-- Choice 3: Attack -->
        <div class="choice-orb" onclick="showDice('STRENGTH', 8, 14)">
            <i data-lucide="sword" class="icon w-8 h-8"></i>
            <div class="choice-tooltip">
                <div class="flex items-center gap-2 mb-2">
                    <div class="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                        <span class="text-[9px] font-bold text-red-400 uppercase tracking-wider">Strength 8</span>
                    </div>
                    <span class="text-[9px] text-white/40">DC 14</span>
                </div>
                <p class="text-sm text-white/80 leading-relaxed">Strike now while he's distracted. The Order's justice must be swift.</p>
            </div>
        </div>
        
        <!-- Choice 4: Leave -->
        <div class="choice-orb" onclick="showDice('DEXTERITY', 7, 8)">
            <i data-lucide="door-open" class="icon w-8 h-8"></i>
            <div class="choice-tooltip">
                <div class="flex items-center gap-2 mb-2">
                    <div class="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                        <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Dexterity 7</span>
                    </div>
                    <span class="text-[9px] text-white/40">DC 8</span>
                </div>
                <p class="text-sm text-white/80 leading-relaxed">Leave quietly and gather more information before confronting him.</p>
            </div>
        </div>
        
    </div>
    
    <!-- Turn Counter (Bottom Right) -->
    <div class="fixed bottom-[80px] right-8 z-50">
        <div class="hud-element rounded-2xl px-5 py-3 flex items-center gap-4">
            <div class="text-center">
                <div class="text-[9px] text-white/40 uppercase tracking-widest">Gold</div>
                <div class="text-lg font-mono font-bold text-amber-400">2,450</div>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
                <div class="text-[9px] text-white/40 uppercase tracking-widest">XP</div>
                <div class="text-lg font-mono font-bold text-emerald-400">1,280</div>
            </div>
        </div>
    </div>
    
    <!-- Dice Modal -->
    <div id="diceModal" class="dice-modal">
        <div class="text-center">
            
            <!-- D20 Visual -->
            <div class="d20-visual mx-auto mb-8">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-32 h-32 rounded-full bg-gradient-to-br from-stone-900 to-black border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(212,163,115,0.2)]">
                        <span id="diceResult" class="text-6xl font-display font-black text-amber-400">?</span>
                    </div>
                </div>
            </div>
            
            <!-- Roll Info -->
            <div class="mb-6">
                <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-4">
                    <span id="attrName" class="text-lg font-bold text-amber-400 uppercase tracking-widest font-display">Wisdom</span>
                    <span class="text-white/40">+</span>
                    <span id="attrBonus" class="text-2xl font-bold text-white font-mono">7</span>
                </div>
                <div class="text-white/40">
                    Difficulty: <span id="dcNum" class="text-amber-400 font-bold">10</span>
                </div>
            </div>
            
            <!-- Roll Button -->
            <button onclick="rollDice()" class="px-12 py-4 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(212,163,115,0.3)] mb-4">
                <span class="flex items-center gap-3">
                    <i data-lucide="sparkles" class="w-5 h-5"></i>
                    Roll the Dice
                </span>
            </button>
            
            <button onclick="closeDice()" class="block mx-auto text-sm text-white/40 hover:text-white transition-colors uppercase tracking-widest">
                Cancel
            </button>
        </div>
    </div>
    
    <script>
        lucide.createIcons();
        
        let currentBonus = 0;
        let currentDC = 0;
        
        function showDice(attr, bonus, dc) {
            currentBonus = bonus;
            currentDC = dc;
            
            document.getElementById('attrName').textContent = attr;
            document.getElementById('attrBonus').textContent = bonus;
            document.getElementById('dcNum').textContent = dc;
            document.getElementById('diceResult').textContent = '?';
            document.getElementById('diceResult').className = 'text-6xl font-display font-black text-amber-400';
            
            document.getElementById('diceModal').classList.add('active');
        }
        
        function closeDice() {
            document.getElementById('diceModal').classList.remove('active');
        }
        
        function rollDice() {
            const el = document.getElementById('diceResult');
            let count = 0;
            
            const roll = setInterval(() => {
                el.textContent = Math.floor(Math.random() * 20) + 1;
                count++;
                
                if (count > 15) {
                    clearInterval(roll);
                    const final = Math.floor(Math.random() * 20) + 1;
                    el.textContent = final;
                    
                    const total = final + currentBonus;
                    
                    setTimeout(() => {
                        if (total >= currentDC) {
                            el.className = 'text-6xl font-display font-black text-emerald-400';
                        } else {
                            el.className = 'text-6xl font-display font-black text-red-400';
                        }
                    }, 300);
                }
            }, 60);
        }
        
        document.getElementById('diceModal').addEventListener('click', function(e) {
            if (e.target === this) closeDice();
        });
    </script>
    
</body>
</html>
