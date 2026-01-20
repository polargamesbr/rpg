<!-- COMBAT MODAL (Refined v14 - Better Parry UI & Polished Icons) -->
<script src="https://unpkg.com/lucide@latest"></script>

<div id="combat-modal" class="fixed inset-0 z-[200] hidden opacity-0 transition-opacity duration-500" aria-hidden="true" style="font-family: 'Inter', sans-serif;">
    
    <!-- AUDIO -->
    <audio id="audio-bass" src="assets/mp3/bass.mp3" preload="auto"></audio>
    <audio id="audio-battle-begin" src="assets/mp3/battle-begin.mp3" preload="auto"></audio>
    <audio id="audio-battle" src="assets/mp3/battle.mp3" loop preload="auto"></audio>
    <audio id="audio-impact" src="assets/mp3/impact.mp3" preload="auto"></audio>
    <audio id="audio-parry" src="assets/mp3/sword2.mp3" preload="auto"></audio>
    <audio id="audio-crit-hit" src="assets/mp3/impact.mp3" preload="auto"></audio>
    
    <audio id="audio-sword1" src="assets/mp3/sword1.mp3" preload="auto"></audio>
    <audio id="audio-sword2" src="assets/mp3/sword2.mp3" preload="auto"></audio>
    <audio id="audio-sword3" src="assets/mp3/sword3.mp3" preload="auto"></audio>
    <audio id="audio-sword4" src="assets/mp3/sword4.mp3" preload="auto"></audio>

    <!-- Background (Bright Center, Dark Edges) -->
    <div class="absolute inset-0 bg-[#050505] transition-colors duration-1000" id="combat-bg-layer">
        <!-- Main BG Image -->
        <img id="combat-bg-img" src="assets/img/battle.webp" class="absolute inset-0 w-full h-full object-cover object-center opacity-100 blur-[0px] scale-105 transition-transform duration-[20s] ease-linear">
        
        <!-- Vignette (Darkens edges only) -->
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/90 via-transparent to-black/90"></div>
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/60 via-transparent to-black/60"></div>
        
        
        <!-- Flash/Shake Overlay -->
        <div id="damage-flash-overlay" class="absolute inset-0 bg-red-500/20 mix-blend-overlay opacity-0 pointer-events-none transition-opacity duration-100"></div>
    </div>

    <!-- Intro Overlay -->
    <div id="battle-intro-overlay" class="absolute inset-0 z-[250] flex items-center justify-center pointer-events-none hidden">
        <div class="w-full bg-red-900/40 backdrop-blur-md border-y border-red-500/50 py-12 overflow-hidden relative">
            <div class="animate-marquee whitespace-nowrap text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-transparent via-red-500 to-transparent italic" style="font-family: 'Cinzel', serif;">
                BATTLE BEGIN &nbsp;&bull;&nbsp; BATTLE BEGIN &nbsp;&bull;&nbsp; BATTLE BEGIN &nbsp;&bull;&nbsp;
            </div>
        </div>
    </div>

    <!-- Loading Overlay (Asset Preload) -->
    <div id="loading-overlay" class="absolute inset-0 z-[260] flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg hidden">
        <div class="text-center space-y-6">
            <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            <p id="loading-text" class="text-2xl font-bold text-white tracking-wide">Loading Assets...</p>
            <div class="w-80 h-2 bg-white/10 rounded-full overflow-hidden">
                <div id="loading-bar-fill" class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>
    </div>

    <!-- TURN BANNER OVERLAY -->
    <div id="turn-banner" class="absolute top-[12%] left-0 right-0 z-[150] flex items-center justify-center pointer-events-none opacity-0 transition-all duration-500 transform scale-150">
        <div class="bg-black/80 backdrop-blur-lg border-y border-white/10 py-4 w-full text-center relative overflow-hidden">
             <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shine"></div>
             <h2 id="turn-banner-text" class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-400 via-white to-stone-400 font-serif tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                 PLAYER TURN
             </h2>
        </div>
    </div>

    <!-- CLICK AREA FOR PARRY -->
    <div id="parry-click-layer" class="hidden absolute inset-0 z-[300] cursor-crosshair pointer-events-auto" onclick="combatSystem.attemptParry()"></div>

    <!-- HOLLYWOOD PROMPT OVERLAY -->
    <div id="prompt-overlay">
        <div id="prompt-content">SELECT TARGET</div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div id="combat-toast" class="absolute top-1/4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none opacity-0 transition-opacity duration-300">
        <div class="px-8 py-3 bg-red-600/20 backdrop-blur-xl border border-red-500/50 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.3)]">
            <span id="combat-toast-text" class="text-2xl font-black text-white font-serif tracking-widest uppercase italic shadow-black drop-shadow-lg">AÇÃO</span>
        </div>
    </div>

    <!-- SETUP SCREEN (New v15) -->
    <div id="combat-setup" class="absolute inset-0 z-[500] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white hidden opacity-0 transition-opacity duration-500">
        <!-- Header -->
        <div class="text-center mb-8">
            <h2 class="text-xs font-bold text-stone-500 tracking-[0.5em] uppercase mb-2">Prepare for Battle</h2>
            <h1 class="text-4xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-white to-stone-200 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">Combat Setup</h1>
        </div>
        
        <div class="flex flex-col md:flex-row gap-8 w-full max-w-[1800px] px-8 min-h-[75vh] max-h-[85vh]">
            <!-- Hero Selection -->
            <div class="flex-1 flex flex-col gap-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative group">
                 <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50"></div>
                 <h3 class="text-blue-400 font-black uppercase tracking-widest text-xs flex justify-between">
                    <span>Select Heroes (Max 3)</span>
                    <i data-lucide="users" class="w-4 h-4"></i>
                 </h3>
                 <div id="setup-hero-list" class="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar p-2 max-h-[calc(75vh-12rem)]">
                     <!-- JS Injected Cards -->
                 </div>
            </div>

            <!-- VS Divider -->
            <div class="flex flex-col items-center justify-center shrink-0">
                <div class="h-full w-px bg-gradient-to-b from-transparent via-stone-800 to-transparent"></div>
                <span class="text-2xl font-black italic text-stone-700 my-4">VS</span>
                <div class="h-full w-px bg-gradient-to-b from-transparent via-stone-800 to-transparent"></div>
            </div>

            <!-- Enemy Selection -->
            <div class="flex-1 flex flex-col gap-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative group">
                 <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-50"></div>
                 <h3 class="text-red-400 font-black uppercase tracking-widest text-xs flex justify-between">
                    <span>Select Opponents (Max 3)</span>
                    <i data-lucide="skull" class="w-4 h-4"></i>
                 </h3>
                 <div id="setup-enemy-list" class="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar p-2 max-h-[calc(75vh-12rem)]">
                     <!-- JS Injected Cards -->
                 </div>
            </div>
        </div>

        <!-- Start Button & AutoGame Toggle -->
        <div class="mt-8 flex flex-col items-center gap-4">
            <div class="flex items-center gap-4">
                <button id="btn-start-combat" onclick="combatSystem.startBattle()" class="px-16 py-4 bg-white text-black font-black uppercase tracking-[0.25em] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:bg-stone-200 transition-all transform hover:-translate-y-1 hover:scale-105 disabled:opacity-20 disabled:grayscale disabled:pointer-events-none group">
                    <span class="flex items-center gap-3">Start Battle <i data-lucide="sword" class="w-4 h-4 group-hover:rotate-45 transition-transform"></i></span>
                </button>
                
                <!-- AutoGame Toggle -->
                <button id="btn-toggle-autogame" onclick="combatSystem.toggleAutoGame()" class="px-8 py-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 border-2 border-purple-500/30 text-purple-300 font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:from-purple-600/30 hover:to-purple-500/30 transition-all transform hover:-translate-y-1 hover:scale-105 group text-sm">
                    <span class="flex items-center gap-3">
                        <i data-lucide="cpu" class="w-4 h-4 group-hover:animate-pulse"></i>
                        <span id="autogame-status-text">AutoGame: OFF</span>
                    </span>
                </button>

                <!-- Quick Combat Toggle -->
                <button id="btn-toggle-quickcombat" onclick="combatSystem.toggleQuickCombat()" class="px-8 py-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border-2 border-cyan-500/30 text-cyan-300 font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:from-cyan-600/30 hover:to-cyan-500/30 transition-all transform hover:-translate-y-1 hover:scale-105 group text-sm">
                    <span class="flex items-center gap-3">
                        <i data-lucide="zap" class="w-4 h-4 group-hover:animate-bounce"></i>
                        <span id="quickcombat-status-text">Quick: OFF</span>
                    </span>
                </button>
            </div>
            <span id="setup-error-msg" class="text-[0.6rem] font-bold text-red-500 uppercase tracking-wider opacity-0 transition-opacity">Select at least 1 Hero and 1 Enemy</span>
        </div>
    </div>

    <!-- Main UI (Wrapped for Cinema Scaling) -->
    <header id="combat-header" class="fixed top-0 left-0 right-0 z-[200] h-20 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center px-12 justify-between pointer-events-auto transition-colors duration-1000">
        <!-- Left: Turn & Target -->
        <div class="flex items-center gap-6">
            <div id="turn-indicator" class="flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 shadow-inner group transition-all duration-500">
                <i data-lucide="clock" class="w-4 h-4 text-stone-400 group-[.player-turn]:text-blue-400"></i>
                <span class="text-[0.65rem] font-black uppercase tracking-[0.3em] text-stone-300">Initializing...</span>
            </div>
            <div id="active-target-chip" class="hidden opacity-0 translate-y-[-10px] transition-all duration-300 flex items-center gap-3 px-5 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                <i data-lucide="crosshair" class="w-4 h-4 text-red-500 animate-pulse"></i>
                <span id="target-name-display" class="text-[0.65rem] font-black text-white uppercase tracking-widest">Target</span>
            </div>
        </div>

        <!-- Center: Audio Controls -->
        <div class="flex items-center gap-3">
            <button id="btn-toggle-music" onclick="combatSystem.toggleMusic()" class="px-4 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/30 transition-all flex items-center gap-2.5 group shadow-lg">
                <i data-lucide="volume-2" class="w-4 h-4 text-amber-400"></i>
                <div class="flex flex-col items-start leading-none">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-amber-400/70">Music</span>
                    <span class="text-[10px] font-black uppercase tracking-wider text-amber-300 music-state">ON</span>
                </div>
            </button>
            <button id="btn-toggle-sfx" onclick="combatSystem.toggleSFX()" class="px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/30 transition-all flex items-center gap-2.5 group shadow-lg">
                <i data-lucide="volume-1" class="w-4 h-4 text-blue-400"></i>
                <div class="flex flex-col items-start leading-none">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-blue-400/70">SFX</span>
                    <span class="text-[10px] font-black uppercase tracking-wider text-blue-300 sfx-state">ON</span>
                </div>
            </button>
        </div>

        <!-- Right: Horizontal Timeline -->
        <div class="flex items-center gap-6">
            <div class="text-[9px] font-black text-stone-500 uppercase tracking-widest mr-2 opacity-60">Sequence</div>
            <div id="timeline-dot-path" class="flex items-center gap-3 relative">
                <!-- Dot path rendered by JS -->
            </div>
        </div>
    </header>

    <!-- Global Damage/Floater Overlay -->
    <div id="damage-floaters-overlay" class="fixed inset-0 z-[300] pointer-events-none overflow-visible"></div>

    <!-- Battlefield (Flexbox Centered) -->
    <div id="combat-cinema-wrapper" class="absolute inset-0 z-10 flex flex-col pointer-events-none transform transition-transform duration-300 origin-center">
        <div class="flex-1 w-full h-full flex items-center justify-center relative pb-20" id="battlefield-container">
            <!-- Targeting SVG Overlay -->
            <svg id="targeting-svg" class="absolute inset-0 w-full h-full z-40 pointer-events-none overflow-visible">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <path id="targeting-path" d="" fill="none" stroke="red" stroke-width="3" stroke-dasharray="8,8" filter="url(#glow)" class="opacity-0 transition-opacity duration-300" />
                <circle id="targeting-start-dot" r="6" fill="red" class="opacity-0 transition-opacity duration-300" filter="url(#glow)" />
                <circle id="targeting-end-dot" r="6" fill="red" class="opacity-0 transition-opacity duration-300" filter="url(#glow)" />
            </svg>
            
            <!-- Centered Battlefield Wrapper -->
            <div id="battlefield-inner" class="flex items-center justify-center gap-32 max-w-[1600px] w-full px-12">
                <!-- Graveyard (Left - Dead Allies) - Desktop: Left Side, Mobile: Bottom -->
                <div class="graveyard-allies-container absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 md:flex hidden" id="graveyard-allies">
                    <!-- JS Injected Dead Ally Chips -->
                </div>

                <!-- Graveyard (Right - Dead Enemies) - Desktop: Right Side, Mobile: Top -->
                <div class="graveyard-enemies-container absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 md:flex hidden" id="graveyard-enemies">
                    <!-- JS Injected Dead Enemy Chips -->
                </div>

                <!-- Heroes -->
                <div class="flex items-center gap-8 perspective-1000 z-20" id="heroes-container">
                    <!-- JS Injected Hero Cards -->
                </div>

                <!-- Enemies -->
                <div class="flex items-center gap-8 perspective-1000 z-10" id="enemy-container"></div>
            </div>

            <!-- Mobile Graveyards (Outside battlefield-inner for better positioning) -->
            <!-- Graveyard (Top - Dead Enemies) - Mobile Only -->
            <div class="graveyard-enemies-mobile absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-row gap-2 md:hidden max-w-[90vw] overflow-x-auto px-2 pb-1" id="graveyard-enemies-mobile">
                <!-- JS Injected Dead Enemy Chips -->
            </div>

            <!-- Graveyard (Bottom - Dead Allies) - Mobile Only -->
            <div class="graveyard-allies-mobile absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-row gap-2 md:hidden max-w-[90vw] overflow-x-auto px-2 pt-1" id="graveyard-allies-mobile">
                <!-- JS Injected Dead Ally Chips -->
            </div>
        </div>
        
        <!-- PARRY BAR (Bottom UI) -->
        <div id="parry-ui-container" class="absolute bottom-[22%] left-0 right-0 z-[301] flex flex-col items-center justify-center pointer-events-none opacity-0 translate-y-4 transition-all duration-300">
             <div id="parry-label" class="text-sm font-black italic text-stone-300 tracking-widest mb-2 shadow-black drop-shadow-md bg-black/60 px-4 py-1 rounded-full backdrop-blur">DEFEND!</div>
             
             <div class="relative w-[500px] h-10 bg-[#0f0f0f] border-2 border-[#333] rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                  <div class="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]"></div>
                  
                  <!-- Red Zones -->
                  <div id="parry-risk-left" class="absolute top-0 bottom-0 bg-[#3f1010]/80 border-r border-[#602020] transition-all" style="left: 0; width: 0%;"></div>
                  <div id="parry-risk-right" class="absolute top-0 bottom-0 bg-[#3f1010]/80 border-l border-[#602020] transition-all" style="right: 0; width: 0%;"></div>
                  
                  <!-- Success Zone (Shield) -->
                  <div id="parry-success-zone" class="absolute top-0 bottom-0 bg-gradient-to-b from-emerald-700/80 to-emerald-900/80 border-x border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all" style="left: 40%; width: 20%;">
                      <i data-lucide="shield" class="w-5 h-5 text-white/90 drop-shadow-md animate-pulse"></i>
                  </div>
                  
                  <!-- Cursor (Diamond) -->
                  <div id="parry-cursor" class="absolute top-[-6px] bottom-[-6px] w-4 z-20 flex items-center justify-center transition-none opacity-0" style="left: 0%;">
                      <div class="w-0.5 h-full bg-white shadow-[0_0_15px_white,0_0_30px_white]"></div>
                      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rotate-45 border-2 border-slate-300 shadow-lg"></div>
                  </div>
             </div>
             
             <div class="w-[520px] h-px bg-white/5 mt-2"></div>
             <!-- Spacebar Hint -->
             <div class="text-[0.6rem] font-bold text-stone-500 uppercase tracking-[0.3em] mt-3 opacity-60 animate-pulse">Press [Space] to Parry</div>
        </div>

        <!-- Floating Combat Log -->
        <div id="combat-log-floating" class="absolute bottom-32 left-12 z-[200] flex flex-col gap-2 pointer-events-none max-w-[320px]"></div>

        <!-- LIQUID GLASS FOOTER (Actions Redesign) -->
        <footer class="fixed bottom-0 left-0 right-0 z-[200] h-32 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col items-center justify-center pointer-events-none pb-4">
            <div class="pointer-events-auto relative">
                <!-- Main Action Bar (Compact & Sharper) -->
                <div id="action-bar" class="flex items-center gap-6 px-10 py-4 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/5 transition-all duration-500 transform translate-y-0 opacity-100">
                    <button onclick="combatSystem.selectActionType('attack')" id="btn-attack" class="group relative flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/30">
                        <div class="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner group-hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                            <i data-lucide="sword" class="w-5 h-5 text-red-400"></i>
                        </div>
                        <span class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-white">Attack</span>
                    </button>

                    <div class="w-px h-6 bg-white/10"></div>

                    <div class="relative">
                        <button onclick="combatSystem.toggleSkillMenu()" id="btn-skill" class="group relative flex items-center gap-3 px-4 py-2 hover:bg-purple-500/10 rounded-xl transition-all border border-transparent hover:border-purple-500/30">
                            <div class="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <i data-lucide="sparkles" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <span class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-white">Skill</span>
                        </button>
                        <!-- Premium Skill Menu (V2: List + Details Panel) -->
                        <div id="skills-menu" class="combat-skill-menu absolute bottom-[140%] left-1/2 -translate-x-1/2 w-[920px] max-w-[92vw] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,1)] hidden opacity-0 transition-all duration-300 z-[120]">
                             <div class="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                                 <div class="flex flex-col">
                                     <span class="text-[0.6rem] font-black uppercase tracking-[0.35em] text-stone-500">Hero Abilities</span>
                                     <span class="text-sm font-black text-white tracking-wide">Skills</span>
                                 </div>
                                 <div class="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                     <i data-lucide="zap" class="w-3 h-3 text-blue-400"></i>
                                     <span class="text-[0.65rem] font-black text-blue-400"><span id="skill-menu-mp">0</span> MP</span>
                                 </div>
                             </div>

                             <div class="combat-skill-body grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-0">
                                 <!-- Left: Skill List -->
                                 <div class="combat-skill-list border-r border-white/5">
                                     <div class="px-5 py-3 flex items-center justify-between gap-3 border-b border-white/5">
                                         <div class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-stone-500">Choose a skill</div>
                                         <div class="text-[0.55rem] font-bold text-stone-600 uppercase tracking-widest">Click to preview • Enter to cast</div>
                                     </div>
                                     <div id="skill-list-container" class="combat-skill-list-inner custom-scrollbar"></div>
                                 </div>

                                 <!-- Right: Skill Details -->
                                 <div class="combat-skill-detail">
                                     <div class="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                         <div class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-stone-500">Skill Details</div>
                                         <div class="text-[0.55rem] font-bold text-stone-600 uppercase tracking-widest">Esc to close</div>
                                     </div>
                                     <div id="skill-detail-panel" class="combat-skill-detail-inner">
                                         <div id="skill-detail-empty" class="text-stone-500 text-sm italic p-6">Select a skill to see details.</div>
                                         <div id="skill-detail-content" class="hidden p-6"></div>
                                     </div>
                                    <div class="combat-skill-detail-footer border-t border-white/5 p-4 flex items-center justify-end gap-4 bg-black/40">
                                        <button id="btn-cast-skill" onclick="combatSystem.castPreviewSkill()" disabled class="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border-t border-white/20 shadow-[0_0_30px_rgba(168,85,247,0.35)] transition-all font-black uppercase tracking-[0.25em] text-[0.75rem] disabled:opacity-30 disabled:grayscale disabled:pointer-events-none flex items-center gap-3">
                                            <i data-lucide="zap" class="w-6 h-6"></i>
                                            <span>Cast</span>
                                        </button>
                                    </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <!-- Premium Item Menu (V2: List + Details Panel) -->
                    <div id="items-menu" class="combat-skill-menu absolute bottom-[140%] left-1/2 -translate-x-1/2 w-[920px] max-w-[92vw] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,1)] hidden opacity-0 transition-all duration-300 z-[120]">
                         <div class="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                             <div class="flex flex-col">
                                 <span class="text-[0.6rem] font-black uppercase tracking-[0.35em] text-stone-500">Party Supplies</span>
                                 <span class="text-sm font-black text-white tracking-wide">Item Bag</span>
                             </div>
                             <div class="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                 <i data-lucide="briefcase" class="w-3 h-3 text-emerald-400"></i>
                                 <span class="text-[0.65rem] font-black text-emerald-400" id="item-menu-count">0 Items</span>
                             </div>
                         </div>

                         <div class="combat-skill-body grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-0">
                             <!-- Left: Item List -->
                             <div class="combat-skill-list border-r border-white/5">
                                 <div class="px-5 py-3 flex items-center justify-between gap-3 border-b border-white/5">
                                     <div class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-stone-500">Select a consumable</div>
                                     <div class="text-[0.55rem] font-bold text-stone-600 uppercase tracking-widest">Click to preview • Enter to use</div>
                                 </div>
                                 <div id="item-list-container" class="combat-skill-list-inner custom-scrollbar"></div>
                             </div>

                             <!-- Right: Item Details -->
                             <div class="combat-skill-detail">
                                 <div class="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                     <div class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-stone-500">Item Properties</div>
                                     <div class="text-[0.55rem] font-bold text-stone-600 uppercase tracking-widest">Esc to close</div>
                                 </div>
                                 <div id="item-detail-panel" class="combat-skill-detail-inner">
                                     <div id="item-detail-empty" class="text-stone-500 text-sm italic p-6">Select an item to see properties.</div>
                                     <div id="item-detail-content" class="hidden p-6"></div>
                                 </div>
                                <div class="combat-skill-detail-footer border-t border-white/5 p-4 flex items-center justify-end gap-4 bg-black/40">
                                    <button id="btn-use-item" onclick="combatSystem.castPreviewItem()" disabled class="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border-t border-white/20 shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all font-black uppercase tracking-[0.25em] text-[0.75rem] disabled:opacity-30 disabled:grayscale disabled:pointer-events-none flex items-center gap-3">
                                        <i data-lucide="check" class="w-6 h-6"></i>
                                        <span>Use Item</span>
                                    </button>
                                </div>
                             </div>
                         </div>
                    </div>

                    <div class="w-px h-6 bg-white/10"></div>

                    <button onclick="combatSystem.selectActionType('defend')" id="btn-defend" class="group relative flex items-center gap-3 px-4 py-2 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/30">
                        <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <i data-lucide="shield-check" class="w-5 h-5 text-blue-400"></i>
                        </div>
                        <span class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-white">Defend</span>
                    </button>

                    <div class="w-px h-6 bg-white/10"></div>

                    <button onclick="combatSystem.toggleItemMenu()" id="btn-item" class="group relative flex items-center gap-3 px-4 py-2 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/30">
                        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <i data-lucide="flask-conical" class="w-5 h-5 text-emerald-400"></i>
                        </div>
                        <span class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-white">Item</span>
                    </button>

                    <div class="w-px h-6 bg-white/10"></div>

                    <button onclick="closeCombatModal()" class="group relative flex items-center gap-3 px-4 py-2 hover:bg-stone-500/10 rounded-xl transition-all border border-transparent hover:border-white/20">
                        <div class="w-10 h-10 rounded-lg bg-stone-900/40 border border-white/5 flex items-center justify-center transition-all">
                            <i data-lucide="log-out" class="w-5 h-5 text-stone-500 group-hover:text-white"></i>
                        </div>
                        <span class="text-[0.7rem] font-black uppercase tracking-[0.2em] text-stone-300 group-hover:text-white">Flee</span>
                    </button>
                </div>
                
                <!-- Premium Confirm Bar -->
                <div id="confirm-bar" class="pointer-events-auto absolute inset-0 flex items-center justify-center px-12 py-5 rounded-3xl bg-black border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,1)] ring-1 ring-white/5 transition-all duration-500 transform translate-y-[150%] opacity-0 z-20">
                    <button onclick="combatSystem.cancelAction()" class="absolute left-8 text-[0.6rem] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-colors">Cancel</button>
                    <button onclick="combatSystem.confirmAction()" class="flex items-center gap-4 px-12 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-t border-white/20 shadow-[0_0_40px_rgba(220,38,38,0.4)] group transition-all transform active:scale-95">
                        <i data-lucide="check-circle" class="w-8 h-8 text-white group-hover:scale-110 transition-transform" id="confirm-btn-icon"></i>
                        <span class="text-white font-black uppercase tracking-[0.3em] text-[0.85rem]" id="confirm-btn-text">CONFIRM</span>
                        <div class="w-px h-6 bg-white/20"></div>
                        <i data-lucide="arrow-right" class="w-6 h-6 text-white group-hover:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </div>
        </footer>

        <!-- VICTORY / REWARDS OVERLAY (PREMIUM V2) -->
        <div id="victory-overlay" class="absolute inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center hidden opacity-0 transition-opacity duration-1000 overflow-hidden">
            <!-- (Content remains same, injecting Debug UI below overlay) -->

            <div id="victory-particles" class="absolute inset-0 pointer-events-none"></div>
            
            <div class="relative z-10 w-full max-w-5xl px-8 flex flex-col items-center gap-8">
                <!-- Header -->
                <div class="text-center animate-bounce-slow">
                    <h2 class="text-[0.7rem] font-bold text-amber-500/80 tracking-[0.8em] uppercase mb-4">Battle Complete</h2>
                    <h1 class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 font-serif italic tracking-tighter drop-shadow-[0_0_80px_rgba(245,158,11,0.5)]">VICTORY</h1>
                </div>

                <!-- 1. The Conquered (Defeated Enemies) -->
                <div class="w-full flex flex-col items-center gap-6">
                    <div class="flex items-center gap-4 text-stone-600 w-full max-w-2xl px-12">
                        <div class="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                        <span class="text-[0.6rem] font-bold uppercase tracking-widest shrink-0">Targets Eliminated</span>
                        <div class="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                    </div>
                    <div id="victory-enemies-list" class="flex items-center justify-center gap-8 flex-wrap">
                        <!-- JS injects portraits here -->
                    </div>
                </div>

                <!-- 2. Rewards Split -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mt-6">
                    
                    <!-- Left: Progression -->
                    <div class="lg:col-span-5 bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50"></div>
                        <h3 class="relative text-stone-400 font-bold text-[0.65rem] uppercase tracking-widest mb-8 flex items-center gap-2">
                            <i data-lucide="bar-chart-2" class="w-3 h-3"></i> Progression
                        </h3>
                        
                        <div class="relative flex items-center justify-between gap-6 mb-8">
                            <!-- Circular Level Progress -->
                            <div class="relative w-24 h-24 flex items-center justify-center shrink-0">
                                <svg class="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" stroke-width="6"></circle>
                                    <circle id="victory-lvl-circle" cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" stroke-width="6" stroke-dasharray="283" stroke-dashoffset="283" stroke-linecap="round" class="transition-all duration-1000 ease-out"></circle>
                                </svg>
                                <div class="flex flex-col items-center z-10">
                                    <span class="text-[0.6rem] text-stone-500 uppercase font-bold">Level</span>
                                    <span id="victory-level" class="text-3xl font-black text-white leading-none">1</span>
                                </div>
                                <div id="level-up-badge" class="hidden absolute top-0 -right-2 bg-amber-500 text-[#0f0f0f] text-[0.5rem] font-black px-1.5 py-0.5 rounded uppercase animate-bounce">UP</div>
                            </div>
                            
                            <div class="flex-1">
                                 <div class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Experience</div>
                                 <div class="text-2xl font-black text-white" id="victory-xp-gained">+0 XP</div>
                                 <div class="text-[0.65rem] text-stone-600 font-mono mt-1" id="victory-xp-total">0 / 0</div>
                            </div>
                        </div>

                        <!-- Gold -->
                        <div class="relative flex items-center gap-5 bg-black/40 rounded-2xl p-4 border border-white/5">
                            <div class="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500"><i data-lucide="coins" class="w-5 h-5"></i></div>
                            <div>
                                <div class="text-[0.55rem] text-stone-500 uppercase tracking-widest font-bold">Gold Earned</div>
                                <div class="text-xl font-bold text-amber-400 font-mono tracking-tight">+<span id="victory-gold">0</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Loot -->
                    <div class="lg:col-span-7 bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                        <h3 class="relative text-stone-400 font-bold text-[0.65rem] uppercase tracking-widest mb-6 flex justify-between items-center z-10">
                            <span class="flex items-center gap-2"><i data-lucide="gem" class="w-3 h-3 text-purple-400"></i> Spoils of War</span>
                            <span class="text-[0.5rem] opacity-50" id="loot-count">0 ITEMS</span>
                        </h3>
                        
                        <div id="victory-loot-container" class="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                            <!-- Loot Items -->
                        </div>
                        <div id="victory-no-loot" class="hidden absolute inset-0 flex items-center justify-center text-stone-700 text-xs italic z-0 mt-8">Nothing found...</div>
                    </div>
                </div>

                <!-- Continue Button -->
                <div class="mt-8">
                     <button onclick="closeCombatModal()" class="pointer-events-auto group relative px-16 py-4 bg-white text-black font-black uppercase tracking-[0.25em] text-xs rounded-full hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] transform hover:-translate-y-1 overflow-hidden">
                        <span class="relative z-10 flex items-center gap-2">Continue <i data-lucide="arrow-right" class="w-3 h-3"></i></span>
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                     </button>
                </div>
            </div>
        <!-- DEFEAT OVERLAY -->
        <div id="defeat-overlay" class="absolute inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center hidden opacity-0 transition-opacity duration-1000">
            <div class="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
                <div class="text-center">
                    <h2 class="text-[0.7rem] font-bold text-red-500/80 tracking-[0.8em] uppercase mb-4">You have fallen</h2>
                    <h1 class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-stone-400 via-stone-700 to-black font-serif italic tracking-tighter drop-shadow-[0_0_50px_rgba(220,38,38,0.3)]">DEFEATED</h1>
                </div>
                
                <div class="w-24 h-px bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
                
                <p class="text-stone-500 text-sm font-medium tracking-wide italic max-w-sm text-center">"Death is but a momentary pause in the eternal cycle of battle."</p>

                <div class="mt-4">
                    <button onclick="closeCombatModal()" class="group relative px-16 py-4 bg-red-900/20 text-red-500 border border-red-500/30 font-black uppercase tracking-[0.25em] text-xs rounded-full hover:bg-red-600 hover:text-white transition-all shadow-[0_0_30px_rgba(220,38,38,0.1)] hover:shadow-[0_0_50px_rgba(220,38,38,0.4)] transform hover:-translate-y-1 overflow-hidden">
                        <span class="relative z-10 flex items-center gap-2">Return to World <i data-lucide="skull" class="w-3 h-3"></i></span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- REVIVE SELECTION MODAL -->
    <div id="revive-selection-modal" class="fixed inset-0 z-[350] hidden opacity-0 transition-opacity duration-300 pointer-events-none">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="combatSystem.closeReviveSelectionModal()"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4">
            <div class="bg-black/95 backdrop-blur-xl border-2 border-green-500/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="p-6 border-b border-green-500/30">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i data-lucide="heart" class="w-8 h-8 text-green-400"></i>
                            <div>
                                <h2 class="text-2xl font-black text-white">Select Ally to Revive</h2>
                                <p class="text-sm text-stone-400 mt-1" id="revive-modal-count">No fallen allies</p>
                            </div>
                        </div>
                        <button onclick="combatSystem.closeReviveSelectionModal()" class="text-stone-400 hover:text-white transition-colors">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div id="revive-ally-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Ally cards will be rendered here -->
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-6 border-t border-green-500/30 bg-black/50">
                    <div class="flex items-center justify-between">
                        <p class="text-xs text-stone-400">Press ESC to cancel</p>
                        <button onclick="combatSystem.closeReviveSelectionModal()" class="px-6 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg text-stone-300 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

    <!-- External Combat CSS -->
    <link rel="stylesheet" href="assets/css/combat.css">
    <link rel="stylesheet" href="assets/css/item-cards.css">
    <link rel="stylesheet" href="assets/css/action-bar-visibility.css">
    <!-- External Combat Scripts -->
    <script src="assets/js/effects-data.js"></script>
    <script src="assets/js/elemental-data.js"></script>
    <script src="assets/js/skills-data.js"></script>
    <script src="assets/js/combat-data.js"></script>
    <script src="assets/js/audio.registry.js"></script>
    <script src="assets/js/audio-manager.js"></script>
    <script src="assets/js/combat-system.js"></script>
    <script src="assets/js/action-bar-manager.js"></script>

<!-- DEBUG UI (Placed correctly outside script) -->
<div id="debug-layer" class="fixed bottom-4 right-4 z-[500] flex flex-col items-end gap-2 pointer-events-auto" style="font-family: 'Inter', sans-serif;">
<div id="debug-menu" class="hidden bg-black/90 border border-white/10 rounded-xl p-2 mb-2 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-48 transition-all origin-bottom-right">
        <div class="text-[0.6rem] font-bold text-stone-500 uppercase tracking-widest px-2 py-1 border-b border-white/5 mb-1">Developer Tools</div>
        <button onclick="combatSystem.debugHealSelf()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-green-400 flex items-center gap-2"><i data-lucide="heart" class="w-3 h-3"></i> Heal Self</button>
        <button onclick="combatSystem.debugRecoverMana()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-blue-400 flex items-center gap-2"><i data-lucide="zap" class="w-3 h-3"></i> Recover Mana</button>
        <button onclick="combatSystem.debugPowerUp()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-red-400 flex items-center gap-2"><i data-lucide="swords" class="w-3 h-3"></i> Power Up</button>
        
        <div class="h-px bg-white/5 my-1"></div>
        
        <button onclick="combatSystem.debugKillAll()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-purple-400 flex items-center gap-2"><i data-lucide="skull" class="w-3 h-3"></i> Kill All Enemies</button>
        <button onclick="combatSystem.debugDie()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-stone-400 flex items-center gap-2"><i data-lucide="frown" class="w-3 h-3"></i> Kill All Heroes</button>
        
        <div class="h-px bg-white/5 my-1"></div>
        
        <button onclick="combatSystem.debugVictory()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-amber-400 flex items-center gap-2"><i data-lucide="trophy" class="w-3 h-3"></i> Force Victory</button>
        <button onclick="combatSystem.debugDefeat()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-red-400 flex items-center gap-2"><i data-lucide="x-circle" class="w-3 h-3"></i> Force Defeat</button>
        
        <div class="h-px bg-white/5 my-1"></div>
        
        <button onclick="combatSystem.toggleAutoGame()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-purple-400 flex items-center gap-2"><i data-lucide="cpu" class="w-3 h-3"></i> <span id="debug-autogame-text">AutoGame: OFF</span></button>
        <button onclick="combatSystem.toggleQuickCombat()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-cyan-400 flex items-center gap-2"><i data-lucide="zap" class="w-3 h-3"></i> <span id="debug-quickcombat-text">Quick: OFF</span></button>
        <button onclick="combatSystem.debugResetBattle()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-orange-400 flex items-center gap-2"><i data-lucide="rotate-ccw" class="w-3 h-3"></i> Reset Battle</button>
        
        <button onclick="combatSystem.debugInspect()" class="px-3 py-1.5 rounded hover:bg-white/10 text-left text-xs font-mono text-stone-300 hover:text-cyan-400 flex items-center gap-2 border-t border-white/5 mt-1 pt-2"><i data-lucide="search" class="w-3 h-3"></i> Inspect Stats</button>
    </div>
    <button onclick="document.getElementById('debug-menu').classList.toggle('hidden')" class="w-10 h-10 rounded-full bg-stone-900/80 border border-white/10 text-stone-500 hover:text-white hover:bg-stone-800 flex items-center justify-center transition-all shadow-lg hover:rotate-90">
        <i data-lucide="bug" class="w-5 h-5"></i>
    </button>
</div>


<!-- Skill Engine System -->
<script src="assets/js/skill-engine.js"></script>
