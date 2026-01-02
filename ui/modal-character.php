
<!-- UNIFIED CHARACTER & INVENTORY MODAL -->
<div id="character-modal" class="fixed inset-0 z-[100] hidden opacity-0 transition-opacity duration-300 pointer-events-none" aria-hidden="true" style="pointer-events: none;"> <!-- pointer-events handled by open/close -->
    
    <!-- Backdrop -->
    <!-- Pointer events auto on backdrop to allow closing -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onclick="closeCharacterModal()"></div>

    <!-- Modal Content -->
    <div class="absolute inset-4 md:inset-10 lg:inset-x-20 lg:inset-y-12 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden transform scale-95 transition-transform duration-300 pointer-events-auto" id="char-modal-content">
        
        <!-- === LEFT COLUMN: HERO PROFILE (40%) === -->
        <div class="w-[400px] lg:w-[480px] relative shrink-0 border-r border-white/5 bg-[#050505] flex flex-col z-10 shadow-2xl">
            
            <!-- Hero Image & Slots Container -->
            <div class="relative flex-1 overflow-hidden group">
                <!-- Hero Image -->
                <img src="assets/img/archer-male.png" class="absolute inset-0 w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-700" alt="Hero">
                
                <!-- Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                <div class="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>

                <!-- CONTENT OVERLAY -->
                <div class="absolute inset-0 p-6 flex flex-col pointer-events-none">
                    
                    <!-- Header -->
                    <div class="text-center mt-2 pointer-events-auto relative z-20">
                        <h2 class="text-4xl font-serif text-white tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" style="font-family: 'Cinzel', serif;">Willian</h2>
                        <div class="text-amber-500 text-xs font-bold tracking-[0.4em] uppercase mt-1">Swordsman • Lvl 7</div>
                    </div>

                    <!-- Equipment Sockets Grid (Centralized HUD) -->
                    <div class="relative flex-1 pointer-events-auto flex items-center justify-center -mt-8">
                        
                        <div class="flex flex-col items-center gap-4 transform scale-90 md:scale-100">
                            
                            <!-- Row 1: Head -->
                            <div class="gear-socket" title="Head">
                                <span class="placeholder-text">HEAD</span>
                            </div>

                            <!-- Row 2: Acc - Body - Acc -->
                            <div class="flex items-center gap-6">
                                <div class="gear-socket small" title="Accessory 1">
                                    <span class="placeholder-text">ACC 1</span>
                                </div>
                                <div class="gear-socket large bg-amber-500/5 border-amber-500/20" title="Body">
                                    <span class="placeholder-text text-amber-500/50">BODY</span>
                                </div>
                                <div class="gear-socket small" title="Accessory 2">
                                    <span class="placeholder-text">ACC 2</span>
                                </div>
                            </div>

                            <!-- Row 3: Wep - Legs - Shield -->
                            <div class="flex items-center gap-4">
                                <div class="gear-socket" title="Main Hand">
                                    <span class="placeholder-text">MAIN</span>
                                </div>
                                 <div class="gear-socket" title="Legs">
                                    <span class="placeholder-text">LEGS</span>
                                </div>
                                <div class="gear-socket" title="Off Hand">
                                    <span class="placeholder-text">OFF</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

            <!-- STATS PANEL (Bottom) -->
            <div class="p-6 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 relative z-20">
                
                <!-- Bars -->
                <div class="grid grid-cols-1 gap-2 mb-6">
                    <!-- HP -->
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-red-500 w-6 text-right">HP</span>
                        <div class="flex-1 h-1.5 bg-red-900/20 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-red-700 to-red-500 w-[85%] shadow-[0_0_12px_rgba(239,68,68,0.6)]"></div>
                        </div>
                        <span class="text-[10px] text-stone-400 font-mono w-16 text-right">850</span>
                    </div>
                     <!-- MP -->
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-blue-500 w-6 text-right">MP</span>
                        <div class="flex-1 h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-blue-700 to-blue-500 w-[64%] shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
                        </div>
                        <span class="text-[10px] text-stone-400 font-mono w-16 text-right">320</span>
                    </div>
                     <!-- EXP -->
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold text-emerald-500 w-6 text-right">XP</span>
                        <div class="flex-1 h-1 bg-emerald-900/20 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 w-[82%] shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
                        </div>
                         <span class="text-[10px] text-stone-400 font-mono w-16 text-right">82%</span>
                    </div>
                </div>

                <!-- Attributes Grid -->
                <div class="grid grid-cols-3 gap-2">
                    <div class="stat-pill"><span class="label text-amber-500">STR</span><span class="val">12</span></div>
                    <div class="stat-pill"><span class="label text-green-500">AGI</span><span class="val">15</span></div>
                    <div class="stat-pill"><span class="label text-red-500">VIT</span><span class="val">10</span></div>
                    <div class="stat-pill"><span class="label text-blue-500">INT</span><span class="val">8</span></div>
                    <div class="stat-pill"><span class="label text-purple-500">DEX</span><span class="val">14</span></div>
                    <div class="stat-pill"><span class="label text-yellow-500">LUK</span><span class="val">5</span></div>
                </div>
            </div>
        </div>

        <!-- === RIGHT COLUMN: INVENTORY & SKILLS (60%) === -->
        <div class="flex-1 bg-[#0f0f0f] flex flex-col min-w-0 z-0">
            
            <!-- Header with Close Button -->
            <div class="flex items-center gap-6 px-8 py-5 border-b border-white/5 bg-[#121212] relative z-20">
                <button class="tab-btn active" onclick="switchModalTab('inventory')">Inventory</button>
                <button class="tab-btn" onclick="switchModalTab('skills')">Skills</button>
                
                <div class="ml-auto flex items-center gap-4">
                    <div class="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20">
                        <i data-lucide="coins" class="w-4 h-4"></i>
                        <span class="font-bold text-sm font-mono">1,250 G</span>
                    </div>
                    
                    <!-- CLOSE BUTTON LOCATION -->
                    <button onclick="closeCharacterModal()" class="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-all">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-hidden relative p-8 bg-gradient-to-br from-[#0f0f0f] to-[#050505]">
                <!-- INVENTORY TAB -->
                <div id="tab-inventory" class="tab-content h-full flex flex-col">
                    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                        <button class="filter-chip active">All</button>
                        <button class="filter-chip">Weapons</button>
                        <button class="filter-chip">Armor</button>
                        <button class="filter-chip">Potions</button>
                    </div>
                    <div class="grid grid-cols-5 2xl:grid-cols-7 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20">
                         <!-- Filled Slots Sample -->
                        <div class="inv-slot rare flex flex-col items-center justify-center group bg-slate-900">
                             <img src="https://via.placeholder.com/64/1e293b/bef264?text=BOW" class="opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="qty">1</div>
                        </div>
                         <div class="inv-slot epic flex flex-col items-center justify-center group bg-indigo-950">
                             <img src="https://via.placeholder.com/64/312e81/e9d5ff?text=SWORD" class="opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="qty">1</div>
                        </div>
                         <div class="inv-slot uncommon flex flex-col items-center justify-center group bg-emerald-950">
                             <img src="https://via.placeholder.com/64/064e3b/6ee7b7?text=POT" class="opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="qty">5</div>
                        </div>

                        <?php for($i=0; $i<27; $i++): ?>
                        <div class="inv-slot empty"></div>
                        <?php endfor; ?>
                    </div>
                </div>

                 <!-- SKILLS TAB -->
                <div id="tab-skills" class="tab-content hidden h-full">
                    <h3 class="text-xl font-serif text-white mb-4">Active Skills</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div class="flex items-center p-4 bg-white/5 rounded border border-white/10 hover:border-amber-500/50 transition-colors cursor-pointer group">
                            <div class="w-12 h-12 bg-amber-900/50 rounded mr-4 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><i data-lucide="sword"></i></div>
                            <div>
                                <div class="font-bold text-white group-hover:text-amber-400 transition-colors">Power Strike</div>
                                <div class="text-xs text-stone-400">Next Level: +15 DMG</div>
                            </div>
                        </div>
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
        bottom: -21px; /* aligns with container border */
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
        padding: 0.4rem 1.2rem;
        border-radius: 99px;
        font-family: 'Inter', sans-serif;
        font-size: 0.75rem;
        font-weight: 600;
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
        background: rgba(212,175,55,0.15);
        border-color: #d4af37;
        color: #d4af37;
        box-shadow: 0 0 10px rgba(212,175,55,0.1);
    }

    /* Socket Styles */
    .gear-socket {
        width: 76px; height: 76px; 
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .gear-socket.small { width: 64px; height: 64px; }
    .gear-socket.large { width: 90px; height: 90px; }

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
    .inv-slot { aspect-ratio: 1; background: rgba(15,15,15,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; position: relative; overflow: hidden; }
    .inv-slot.empty { opacity: 0.3; border: 1px dashed rgba(255,255,255,0.2); background: transparent; }
    .inv-slot:not(.empty):hover { border-color: rgba(255,255,255,0.4); box-shadow: 0 0 15px rgba(0,0,0,0.5); transform: scale(1.02); z-index: 10; }
</style>

<script>
    // Initialize tilt REMOVED


    function openCharacterModal() {
        // ... previous logic
        const modal = document.getElementById('character-modal');
        const content = document.getElementById('char-modal-content');
        modal.classList.remove('hidden');
        modal.style.pointerEvents = "auto"; 
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
    }

    function closeCharacterModal() {
        const modal = document.getElementById('character-modal');
        const content = document.getElementById('char-modal-content');
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
        document.getElementById('tab-' + tabName).classList.remove('hidden');
        
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        
        // Simple active state logic
        if(tabName === 'inventory') tabs[0].classList.add('active');
        if(tabName === 'skills') tabs[1].classList.add('active');
    }
</script>

