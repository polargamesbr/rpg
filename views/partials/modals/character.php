
<!-- UNIFIED CHARACTER & INVENTORY MODAL -->
<div id="character-modal" class="fixed inset-0 z-[100] hidden opacity-0 transition-opacity duration-300 pointer-events-none" aria-hidden="true" style="pointer-events: none;"> <!-- pointer-events handled by open/close -->
    
    <!-- Backdrop -->
    <!-- Pointer events auto on backdrop to allow closing -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onclick="closeCharacterModal()"></div>

    <!-- Modal Content -->
    <div class="absolute inset-4 md:inset-10 lg:inset-x-20 lg:inset-y-12 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden transform scale-95 transition-transform duration-300 pointer-events-auto" id="char-modal-content">
        
        <!-- === LEFT COLUMN: HERO PROFILE (40%) === -->
        <!-- === LEFT COLUMN: HERO PROFILE (40%) === -->
        <div class="w-[400px] lg:w-[480px] relative shrink-0 border-r border-white/5 bg-[#050505] flex flex-col z-10 shadow-2xl">
            
            <!-- Hero Image & Slots Container -->
            <div class="relative flex-1 overflow-hidden group">
                <!-- Hero Image: No Filters -->
                <img src="<?= asset('img/swordman-male.webp') ?>" class="absolute inset-0 w-full h-full object-cover object-top transition-all duration-700" alt="Swordman">
                
                <!-- Radiant Background Effect -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] to-transparent"></div>

                <!-- CONTENT OVERLAY -->
                <div class="absolute inset-0 p-6 flex flex-col pointer-events-none">
                    
                    <!-- Header -->
                    <div class="text-center mt-2 pointer-events-auto relative z-20 mb-4">
                        <h2 class="text-3xl font-serif text-white tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" style="font-family: 'Cinzel', serif;">Swordman</h2>
                        <div class="text-amber-500 text-[10px] font-bold tracking-[0.4em] uppercase mt-1">Swordman • Lvl 10</div>
                    </div>

                    <!-- Equipment Sockets Grid (Cross Pattern) -->
                    <div class="relative flex-1 pointer-events-auto flex flex-col items-center justify-center gap-2">
                        
                        <!-- Row 1: Head -->
                        <div class="gear-socket" title="Head">
                            <span class="placeholder-text">HEAD</span>
                        </div>

                        <!-- Row 2: Left - Body - Right -->
                        <div class="flex items-center gap-2">
                            <div class="gear-socket" title="Left Hand">
                                <span class="placeholder-text">LEFT</span>
                            </div>
                            <div class="gear-socket active-socket" title="Body"> <!-- Added active class for styling if needed -->
                                <span class="placeholder-text">BODY</span>
                            </div>
                            <div class="gear-socket" title="Right Hand">
                                <span class="placeholder-text">RIGHT</span>
                            </div>
                        </div>

                        <!-- Row 3: Boots -->
                        <div class="gear-socket" title="Boots">
                            <span class="placeholder-text">BOOTS</span>
                        </div>

                        <!-- Row 4: Accessories -->
                        <div class="flex items-center gap-2 mt-2">
                            <div class="gear-socket small" title="Accessory 1">
                                <span class="placeholder-text">ACC 1</span>
                            </div>
                            <div class="gear-socket small" title="Accessory 2">
                                <span class="placeholder-text">ACC 2</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- STATS PANEL (Bottom) -->
            <div class="p-6 bg-[#0a0a0a] border-t border-white/5 relative z-20">
                
                <!-- Bars (Sidebar Style) -->
                <div class="flex flex-col gap-4 mb-6">
                    
                    <!-- HP -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between items-end px-1">
                            <div class="flex items-center gap-2 text-red-500">
                                <i data-lucide="heart" class="w-4 h-4 fill-current"></i>
                                <span class="text-xs font-bold tracking-widest">HP</span>
                            </div>
                            <span class="text-xs font-mono text-stone-400"><span id="char-hp-current">1200</span><span class="text-stone-600">/<span id="char-hp-max">1200</span></span></span>
                        </div>
                        <div class="h-2 w-full bg-red-900/10 rounded-full border border-red-500/10 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" id="char-hp-bar" style="width: 100%"></div>
                        </div>
                    </div>

                    <!-- MANA -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between items-end px-1">
                            <div class="flex items-center gap-2 text-blue-500">
                                <i data-lucide="droplet" class="w-4 h-4 fill-current"></i>
                                <span class="text-xs font-bold tracking-widest">MANA</span>
                            </div>
                            <span class="text-xs font-mono text-stone-400"><span id="char-mana-current">350</span><span class="text-stone-600">/<span id="char-mana-max">350</span></span></span>
                        </div>
                        <div class="h-2 w-full bg-blue-900/10 rounded-full border border-blue-500/10 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-blue-900 to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]" id="char-mana-bar" style="width: 100%"></div>
                        </div>
                    </div>

                    <!-- XP -->
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between items-end px-1">
                            <div class="flex items-center gap-2 text-emerald-500">
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                <span class="text-xs font-bold tracking-widest">XP</span>
                            </div>
                            <span class="text-xs font-mono text-stone-400"><span id="char-xp-current">0</span><span class="text-stone-600">/<span id="char-xp-max">5000</span></span></span>
                        </div>
                        <div class="h-2 w-full bg-emerald-900/10 rounded-full border border-emerald-500/10 overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-emerald-900 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" id="char-xp-bar" style="width: 0%"></div>
                        </div>
                    </div>

                </div>

                <!-- Attributes Grid -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="stat-pill"><span class="label text-amber-500">STR</span><span class="val" id="char-attr-str">12</span></div>
                    <div class="stat-pill"><span class="label text-green-500">AGI</span><span class="val" id="char-attr-agi">8</span></div>
                    <div class="stat-pill"><span class="label text-red-500">VIT</span><span class="val" id="char-attr-vit">10</span></div>
                    <div class="stat-pill"><span class="label text-blue-500">INT</span><span class="val" id="char-attr-int">5</span></div>
                    <div class="stat-pill"><span class="label text-purple-500">DEX</span><span class="val" id="char-attr-dex">8</span></div>
                    <div class="stat-pill"><span class="label text-yellow-500">LUK</span><span class="val" id="char-attr-luk">5</span></div>
                </div>

                <!-- Derived Stats (Optional Display) -->
                <div class="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div class="flex justify-between">
                        <span class="text-stone-500">ATK:</span>
                        <span class="text-white font-bold" id="char-stat-atk">160</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-stone-500">DEF:</span>
                        <span class="text-white font-bold" id="char-stat-def">116</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-stone-500">ASPD:</span>
                        <span class="text-white font-bold" id="char-stat-aspd">120</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-stone-500">Element:</span>
                        <span class="text-stone-400 font-bold">Neutral</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- === RIGHT COLUMN: INVENTORY & SKILLS (60%) === -->
        <div class="flex-1 bg-[#101010] flex flex-col min-w-0 z-0 border-l border-white/5">
            
            <!-- Header with Close Button -->
            <div class="flex items-center gap-6 px-10 py-6 border-b border-white/5 bg-[#141414] relative z-20 shadow-lg">
                <button class="tab-btn active" onclick="switchModalTab('inventory')">Inventory</button>
                <button class="tab-btn" onclick="switchModalTab('skills')">Skills</button>
                
                <div class="ml-auto flex items-center gap-6">
                    <div class="flex items-center gap-3 text-amber-500 bg-black/40 px-4 py-2 rounded-lg border border-amber-500/20 shadow-inner">
                        <i data-lucide="coins" class="w-4 h-4"></i>
                        <span class="font-bold text-sm font-mono tracking-wider">1,250</span>
                    </div>
                    
                    <!-- Close Button -->
                    <button onclick="closeCharacterModal()" class="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/10 rounded transition-all">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-hidden relative p-8 bg-[#0f0f0f]">
                <!-- INVENTORY TAB -->
                <div id="tab-inventory" class="tab-content h-full flex flex-col">
                    
                    <!-- Filters -->
                    <div class="flex flex-wrap gap-2 mb-8 items-center">
                        <button class="filter-chip active">All</button>
                        <button class="filter-chip">Weapons</button>
                        <button class="filter-chip">Armor</button>
                        <button class="filter-chip">Potions</button>
                        <button class="filter-chip">Materials</button>
                    </div>

                    <!-- Grid -->
                    <div class="grid grid-cols-5 md:grid-cols-6 xl:grid-cols-8 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-20 content-start" id="char-inventory-grid">
                         <!-- HP Potions (3x) -->
                        <div class="inv-slot uncommon flex flex-col items-center justify-center group bg-[#0f2e22]" title="HP Potion">
                             <i data-lucide="flask-conical" class="w-8 h-8 text-red-400 opacity-70 group-hover:opacity-100 transition-opacity"></i>
                            <div class="qty">3</div>
                        </div>
                         <!-- Mana Potion (1x) -->
                        <div class="inv-slot uncommon flex flex-col items-center justify-center group bg-[#0f1b2e]" title="Mana Potion">
                             <i data-lucide="flask-conical" class="w-8 h-8 text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity"></i>
                            <div class="qty">1</div>
                        </div>
                         <!-- Antidote Potion (1x) -->
                        <div class="inv-slot uncommon flex flex-col items-center justify-center group bg-[#1e2e1b]" title="Antidote Potion">
                             <i data-lucide="flask-conical" class="w-8 h-8 text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity"></i>
                            <div class="qty">1</div>
                        </div>

                        <?php for($i=0; $i<29; $i++): ?>
                        <div class="inv-slot empty"></div>
                        <?php endfor; ?>
                    </div>
                </div>

                 <!-- SKILLS TAB -->
                <div id="tab-skills" class="tab-content hidden h-full flex flex-col">
                    <h3 class="text-xl font-serif text-white mb-4">Active Skills</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-20 content-start" id="char-skills-grid">
                        <!-- Skills will be rendered here by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Tab Buttons - Premium RPG Look */
    .tab-btn {
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.4);
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 0.5rem 0;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
    }
    .tab-btn::after {
        content: '';
        position: absolute;
        bottom: -25px; /* Aligned to border */
        left: 0; right: 0;
        height: 2px;
        background: #d4af37;
        opacity: 0;
        transform: scaleX(0);
        transition: all 0.3s ease;
        box-shadow: 0 -2px 10px rgba(212,175,55,0.5);
    }
    .tab-btn:hover { color: rgba(255,255,255,0.8); }
    .tab-btn.active { color: #d4af37; text-shadow: 0 0 8px rgba(212,175,55,0.3); }
    .tab-btn.active::after { opacity: 1; transform: scaleX(1); }

    /* Filter Chips - Interactive Pills */
    .filter-chip {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.5);
        padding: 0.5rem 1.4rem;
        border-radius: 99px;
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }
    .filter-chip:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.2);
        color: #fff;
    }
    .filter-chip.active {
        background: rgba(212,175,55,0.1);
        border-color: #d4af37;
        color: #d4af37;
        box-shadow: 0 0 15px rgba(212,175,55,0.1);
    }

    /* Socket Styles */
    .gear-socket {
        width: 76px; height: 76px; 
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }

    .gear-socket:hover {
        border-color: #d4af37;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.25);
        background: rgba(40,40,40,0.8);
        transform: translateY(-2px) scale(1.05);
        z-index: 50;
    }
    
    .placeholder-text {
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.3);
        letter-spacing: 0.1em;
        text-align: center;
        font-weight: 600;
        transition: color 0.3s;
    }
    .gear-socket:hover .placeholder-text { color: #d4af37; text-shadow: 0 0 5px rgba(212,175,55,0.5); }

    /* Stat Pill */
    .stat-pill {
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(0,0,0,0.3); 
        border: 1px solid rgba(255,255,255,0.05);
        padding: 0.6rem 0.8rem;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .stat-pill:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
    .stat-pill .label { font-size: 0.7rem; font-weight: 800; tracking-widest; }
    .stat-pill .val { color: #fff; font-size: 0.9rem; font-weight: 700; font-family: 'Inter', sans-serif; }

    /* Inv Slot Polish */
    .inv-slot { 
        aspect-ratio: 1; 
        background: rgba(20,20,20,0.6); 
        border: 1px solid rgba(255,255,255,0.08); 
        border-radius: 6px; 
        position: relative; 
        overflow: hidden; 
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    .inv-slot.empty { opacity: 0.3; border: 1px dashed rgba(255,255,255,0.1); background: transparent; }
    .inv-slot:not(.empty):hover { 
        border-color: rgba(212,175,55,0.5); 
        box-shadow: 0 0 20px rgba(212,175,55,0.2), inset 0 0 20px rgba(212,175,55,0.05); 
        transform: scale(1.02); 
        z-index: 10; 
    }

    /* Skill Card Styles (Premium Dark/Combat-like) */
    .skill-card {
        background: rgba(10,10,10,0.8);
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(4px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .skill-card:hover {
        border-color: rgba(212,175,55,0.6);
        background: rgba(20,20,20,0.9);
        box-shadow: 0 4px 20px rgba(212,175,55,0.15), inset 0 0 30px rgba(212,175,55,0.05);
        transform: translateY(-2px);
    }
    .skill-card .qty {
        position: absolute;
        bottom: 2px;
        right: 4px;
        background: rgba(0,0,0,0.8);
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Inter', sans-serif;
    }

    /* Enhanced Stat Pills */
    .stat-pill {
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.08);
        backdrop-filter: blur(4px);
    }
    .stat-pill:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(212,175,55,0.3);
        box-shadow: 0 0 10px rgba(212,175,55,0.1);
    }

    /* Enhanced Bars with Glow */
    #char-hp-bar {
        background: linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #ef4444 100%);
        box-shadow: 0 0 15px rgba(239,68,68,0.5), inset 0 0 10px rgba(239,68,68,0.3);
    }
    #char-mana-bar {
        background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
        box-shadow: 0 0 15px rgba(59,130,246,0.5), inset 0 0 10px rgba(59,130,246,0.3);
    }
    #char-xp-bar {
        background: linear-gradient(90deg, #065f46 0%, #10b981 50%, #34d399 100%);
        box-shadow: 0 0 15px rgba(16,185,129,0.5), inset 0 0 10px rgba(16,185,129,0.3);
    }
</style>

<script>
    // openCharacterModal() is now in character-modal-loader.js for lazy loading support
    // closeCharacterModal() is defined here as it's needed by the modal itself
    
    function closeCharacterModal() {
        const modal = document.getElementById('character-modal');
        const content = document.getElementById('char-modal-content');
        if(!modal || !content) return; // FIX: Handle null elements safely

        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.pointerEvents = "none";
        }, 300);
    }

    function switchModalTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById('tab-' + tabName);
        if(target) target.classList.remove('hidden');
        
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        
        // Simple active state logic
        if(tabName === 'inventory' && tabs[0]) tabs[0].classList.add('active');
        if(tabName === 'skills' && tabs[1]) {
            tabs[1].classList.add('active');
            // Load skills when switching to skills tab
            loadSwordmanSkills();
        }
    }

    // Swordman skills list (from combat-data.js)
    const SWORDMAN_SKILL_IDS = [
        'quick_slash', 'guarded_strike', 'parry_stance', 'heavy_slash',
        'shield_bash', 'taunting_shout', 'cleave', 'defensive_wall',
        'crushing_blow', 'battle_focus', 'relentless_strike', 'champions_slash',
        'life_steal', 'berserk_mode'
    ];

    // Mock skill data (fallback if skillsData not available)
    const SWORDMAN_SKILLS_MOCK = {
        quick_slash: { name: 'Quick Slash', icon: 'sword', mana: 5, desc: 'Basic physical attack against a single target.', type: 'single' },
        guarded_strike: { name: 'Guarded Strike', icon: 'shield', mana: 15, desc: 'Moderate physical attack. 15% Stun chance.', type: 'single' },
        parry_stance: { name: 'Parry Stance', icon: 'shield', mana: 15, desc: 'Increases parry chance to 30% for 1 turn.', type: 'ally' },
        heavy_slash: { name: 'Heavy Slash', icon: 'sword', mana: 20, desc: 'Strong physical attack against a single target.', type: 'single' },
        shield_bash: { name: 'Shield Bash', icon: 'shield', mana: 25, desc: 'Moderate attack. 50% Stun chance.', type: 'single' },
        taunting_shout: { name: 'Taunting Shout', icon: 'speaker', mana: 10, desc: 'Provokes enemies to target you (80% chance).', type: 'self' },
        cleave: { name: 'Cleave', icon: 'target', mana: 30, desc: 'Physical attack that hits all enemies.', type: 'aoe' },
        defensive_wall: { name: 'Defensive Wall', icon: 'shield-check', mana: 30, desc: 'Reduces damage taken by 50% for 2 turns.', type: 'ally' },
        crushing_blow: { name: 'Crushing Blow', icon: 'hammer', mana: 25, desc: 'Heavy attack. 30% Bleed chance.', type: 'single' },
        battle_focus: { name: 'Battle Focus', icon: 'zap', mana: 40, desc: 'Increases target STR, DEX and damage dealt by 50% for 3 turns.', type: 'ally' },
        relentless_strike: { name: 'Relentless Strike', icon: 'sword', mana: 35, desc: 'Powerful attack that hits the target twice.', type: 'single' },
        champions_slash: { name: 'Champion\'s Slash', icon: 'crown', mana: 60, desc: 'Signature finisher. High damage + Stun/Bleed chance.', type: 'single' },
        life_steal: { name: 'Life Steal', icon: 'heart', mana: 55, desc: 'Deals damage and steals 40% of damage dealt as HP. Great for sustain.', type: 'single' },
        berserk_mode: { name: 'Berserk Mode', icon: 'zap', mana: 65, desc: 'Increases ATK by 100% but reduces DEF by 50% for 3 turns. High risk, high reward.', type: 'self' }
    };

    function loadSwordmanSkills() {
        const skillsGrid = document.getElementById('char-skills-grid');
        if (!skillsGrid) return;

        // Check if skills were already loaded
        if (skillsGrid.dataset.loaded === 'true') return;

        const skillsData = window.skillsData || {};
        skillsGrid.innerHTML = '';

        SWORDMAN_SKILL_IDS.forEach(skillId => {
            // Try to get skill from skillsData, fallback to mock
            const skillData = skillsData[skillId] || SWORDMAN_SKILLS_MOCK[skillId];
            if (!skillData) return;

            const skillCard = document.createElement('div');
            skillCard.className = 'skill-card flex items-start p-4 bg-white/5 rounded-lg border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group hover:bg-white/10';
            
            // Icon
            const iconEl = document.createElement('div');
            iconEl.className = 'w-12 h-12 bg-amber-900/50 rounded-lg mr-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shrink-0';
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', skillData.icon || 'sword');
            iconEl.appendChild(icon);
            
            // Content
            const contentEl = document.createElement('div');
            contentEl.className = 'flex-1 min-w-0';
            
            // Name and Mana
            const headerEl = document.createElement('div');
            headerEl.className = 'flex items-center justify-between mb-1';
            
            const nameEl = document.createElement('div');
            nameEl.className = 'font-bold text-white group-hover:text-amber-400 transition-colors';
            nameEl.textContent = skillData.name || skillId;
            
            const manaEl = document.createElement('div');
            manaEl.className = 'text-xs text-blue-400 font-mono ml-2';
            manaEl.textContent = skillData.mana ? `${skillData.mana} MP` : '';
            
            headerEl.appendChild(nameEl);
            if (skillData.mana) headerEl.appendChild(manaEl);
            
            // Type badge
            const typeEl = document.createElement('div');
            typeEl.className = 'text-[10px] text-stone-500 uppercase tracking-wider mb-1';
            const typeText = skillData.type || 'single';
            typeEl.textContent = typeText === 'aoe' ? 'AOE' : typeText === 'ally' ? 'BUFF' : typeText === 'self' ? 'SELF' : 'SINGLE';
            
            // Description
            const descEl = document.createElement('div');
            descEl.className = 'text-xs text-stone-400 leading-relaxed';
            descEl.textContent = skillData.desc || '';
            
            contentEl.appendChild(headerEl);
            contentEl.appendChild(typeEl);
            contentEl.appendChild(descEl);
            
            skillCard.appendChild(iconEl);
            skillCard.appendChild(contentEl);
            
            skillsGrid.appendChild(skillCard);
        });

        // Mark as loaded
        skillsGrid.dataset.loaded = 'true';

        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Calculate derived stats from attributes
    function calculateSwordmanStats() {
        const str = 12, agi = 8, vit = 10, int = 5, dex = 8, luk = 5;
        
        // Formulas (approximate, based on common RPG patterns)
        const hp = Math.floor(vit * 100 + str * 10); // ~1200
        const mp = Math.floor(int * 50 + vit * 10); // ~350
        const atk = Math.floor(str * 10 + dex * 5); // ~160
        const def = Math.floor(vit * 8 + str * 3); // ~116
        const aspd = Math.floor(agi * 10 + dex * 5); // ~120
        
        // Update HTML elements
        const hpMaxEl = document.getElementById('char-hp-max');
        const hpCurrentEl = document.getElementById('char-hp-current');
        const hpBarEl = document.getElementById('char-hp-bar');
        if (hpMaxEl) hpMaxEl.textContent = hp;
        if (hpCurrentEl) hpCurrentEl.textContent = hp;
        if (hpBarEl) hpBarEl.style.width = '100%';
        
        const mpMaxEl = document.getElementById('char-mana-max');
        const mpCurrentEl = document.getElementById('char-mana-current');
        const mpBarEl = document.getElementById('char-mana-bar');
        if (mpMaxEl) mpMaxEl.textContent = mp;
        if (mpCurrentEl) mpCurrentEl.textContent = mp;
        if (mpBarEl) mpBarEl.style.width = '100%';
        
        const atkEl = document.getElementById('char-stat-atk');
        const defEl = document.getElementById('char-stat-def');
        const aspdEl = document.getElementById('char-stat-aspd');
        if (atkEl) atkEl.textContent = atk;
        if (defEl) defEl.textContent = def;
        if (aspdEl) aspdEl.textContent = aspd;
    }

    // Initialize stats when modal opens
    if (document.getElementById('character-modal')) {
        // Wait for modal to be in DOM, then calculate stats
        setTimeout(() => {
            calculateSwordmanStats();
        }, 100);
    }
</script>

