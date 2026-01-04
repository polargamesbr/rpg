
<!-- WORLD MAP MODAL (Final Polish) -->
<div id="world-map-modal" class="fixed inset-0 z-[100] hidden opacity-0 transition-opacity duration-300" aria-hidden="true" style="pointer-events: none;">
    
    <!-- Backdrop (Dark Overlay for Modal Context) -->
    <div class="absolute inset-0 bg-black/90 pointer-events-auto transition-opacity" onclick="closeWorldMapModal()"></div>

    <!-- Main Modal Container -->
    <div class="absolute inset-0 z-10 pointer-events-none flex flex-col">
        
        <!-- === UI OVERLAYS === -->
        
        <!-- HEADER -->
        <div class="absolute top-0 left-0 right-0 z-50 flex justify-center pt-8 pointer-events-auto">
            <div class="bg-black/80 backdrop-blur-xl border border-amber-500/20 px-10 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center group cursor-default">
                 <div class="flex items-center gap-3 mb-1">
                    <div class="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                    <i data-lucide="map-pin" class="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"></i>
                    <div class="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50"></div>
                 </div>
                 <h2 class="text-2xl font-serif text-white tracking-[0.15em] drop-shadow-md" style="font-family: 'Cinzel', serif;">STORMHAVEN</h2>
                 <p class="text-[0.6rem] font-bold text-stone-500 uppercase tracking-[0.3em] group-hover:text-amber-500/80 transition-colors">Kingdom of Aethelgard</p>
            </div>
        </div>

        <!-- CLOSE BUTTON -->
        <div class="absolute top-8 right-8 z-50 pointer-events-auto">
             <button onclick="closeWorldMapModal()" class="w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-red-900/80 text-white/70 hover:text-white rounded-full border border-white/10 hover:border-white/30 backdrop-blur transition-all shadow-xl group">
                <i data-lucide="x" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
            </button>
        </div>

        <!-- HINT -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
             <div class="bg-black/60 backdrop-blur px-5 py-2 rounded-full border border-white/10 text-xs text-stone-400 font-mono flex items-center gap-3">
                <div class="flex gap-1"><i data-lucide="arrow-left-right" class="w-4 h-4 text-white"></i> <span>Scan Region</span></div>
                <div class="w-px h-3 bg-white/20"></div>
                <div class="flex gap-1"><i data-lucide="mouse-pointer-2" class="w-4 h-4 text-cyan-400"></i> <span>Explore</span></div>
            </div>
        </div>

        <!-- === SCROLLABLE MAP VIEWPORT === -->
        <!-- 
             Removed bg-[#050505] to let the backdrop image show through.
             Added overflow-hidden to clip the blurred image.
        -->
        <div id="map-container" class="absolute inset-0 flex flex-col justify-center pointer-events-auto transition-all overflow-hidden bg-[#080808]">
            
            <!-- 1. IMMERSIVE VISIBLE BACKDROP -->
            <div class="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
                <!-- Direct Image: Increased opacity to 0.5 -->
                <img src="<?= asset('img/map.png') ?>" class="absolute inset-0 w-full h-full object-cover blur-md grayscale opacity-50 scale-105">
                <!-- Weaker Vignette to allow visibility -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80"></div>
            </div>

            <!-- Horizontal Scroll Zone -->
            <div class="w-full relative z-10 overflow-x-auto overflow-y-hidden text-center [scrollbar-width:none] cursor-grab active:cursor-grabbing p-4 md:p-8" id="map-scroll-zone">
                
                <!-- CONTENT WRAPPER -->
                <div id="map-content-wrapper" class="relative inline-block align-middle mx-auto py-10">
                    
                    <!-- Map Image -->
                    <img src="<?= asset('img/map.png') ?>" 
                         class="h-[70vh] md:h-[75vh] max-h-[850px] w-auto max-w-[2500px] block
                                object-contain 
                                rounded
                                border-[4px] border-[#1a1614] 
                                outline outline-[1px] outline-amber-700/50
                                shadow-[0_20px_70px_-10px_rgba(0,0,0,0.8)]" 
                         draggable="false" 
                         style="image-rendering: auto;">
                    
                    <!-- Inner Border Overlay -->
                    <div class="absolute inset-[4px] border border-amber-500/10 pointer-events-none rounded z-20"></div>

                    <!-- === PINS === -->

                    <!-- 1. MAIN SQUARE (Amber/Standard) -->
                    <div class="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-1'); event.stopPropagation()">
                        <div class="relative w-12 h-12 flex items-center justify-center transition-transform group-hover/pin:scale-125 duration-300">
                            <!-- Amber Ping -->
                            <div class="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-40 animate-ping"></div>
                            <div class="w-4 h-4 bg-[#0a0a0a] rotate-45 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10"></div>
                        </div>
                    </div>

                    <!-- 2. GUILD HALL (Stone/Locked) -->
                    <div class="absolute top-[40%] left-[58%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-2'); event.stopPropagation()">
                         <div class="relative w-8 h-8 flex items-center justify-center transition-transform group-hover/pin:scale-110 duration-300">
                            <div class="w-3 h-3 bg-stone-700 rotate-45 border-2 border-stone-500 shadow-lg z-10"></div>
                        </div>
                    </div>

                    <!-- 3. CITY GATES (Red/Danger) -->
                    <div class="absolute top-[75%] left-[50%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-3'); event.stopPropagation()">
                         <div class="relative w-14 h-14 flex items-center justify-center transition-transform group-hover/pin:scale-110 duration-300">
                            <!-- Red Pulse -->
                            <div class="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-30 group-hover/pin:opacity-60 animate-pulse"></div>
                            <i data-lucide="shield-alert" class="w-6 h-6 text-red-500 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] z-10"></i>
                        </div>
                    </div>

                    <!-- 4. CRYSTAL CAVES (Blue/Magic - NEW) -->
                    <div class="absolute top-[35%] left-[85%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-4'); event.stopPropagation()">
                         <div class="relative w-16 h-16 flex items-center justify-center transition-transform group-hover/pin:scale-110 duration-300">
                            <!-- Blue Glow -->
                            <div class="absolute inset-0 bg-cyan-500 rounded-full blur-md opacity-20 group-hover/pin:opacity-50 animate-pulse duration-700"></div>
                             <!-- Extra Blink -->
                            <div class="absolute inset-0 bg-cyan-400 rounded-full blur-sm opacity-0 animate-[ping_3s_ease-in-out_infinite]"></div>
                            <i data-lucide="gem" class="w-6 h-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10"></i>
                        </div>
                    </div>

                    <!-- 5. BANDIT CAMP (Red/Skull - NEW) -->
                    <div class="absolute top-[65%] left-[15%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-5'); event.stopPropagation()">
                         <div class="relative w-10 h-10 flex items-center justify-center transition-transform group-hover/pin:scale-110 duration-300">
                             <div class="absolute inset-0 bg-orange-600 rounded-full blur-md opacity-20 animate-pulse"></div>
                             <i data-lucide="skull" class="w-5 h-5 text-orange-500 drop-shadow-md z-10"></i>
                         </div>
                    </div>

                     <!-- 6. ANCIENT RUINS (Purple/Mystery - NEW) -->
                    <div class="absolute top-[25%] left-[30%] -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                         onmousedown="event.stopPropagation()" 
                         onclick="showQuestTooltip(this, 'quest-6'); event.stopPropagation()">
                         <div class="relative w-8 h-8 flex items-center justify-center transition-transform group-hover/pin:scale-110 duration-300">
                            <div class="w-3 h-3 bg-purple-900 rotate-45 border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10 animate-spin-slow"></div>
                         </div>
                    </div>

                </div>
            </div>
        </div>

    </div>

    <!-- QUEST TOOLTIP -->
    <div id="quest-tooltip" class="absolute z-[200] hidden opacity-0 transition-opacity duration-200 pointer-events-none">
        <div class="w-[300px] md:w-[320px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-amber-500/20 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto">
            <!-- Header -->
            <div class="h-20 bg-gradient-to-r from-amber-900/40 to-black relative">
                 <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                 <div class="absolute top-3 right-3">
                     <button onclick="hideQuestTooltip()" class="text-white/50 hover:text-white transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                 </div>
            </div>
            <!-- Content -->
            <div class="p-5 -mt-10 relative">
                <div class="w-12 h-12 bg-[#0a0a0a] rounded border border-amber-500/30 flex items-center justify-center shadow-lg mb-3">
                    <i id="qt-icon" data-lucide="scroll" class="text-amber-500 w-6 h-6"></i>
                </div>
                <div class="flex justify-between items-start mb-2">
                    <h3 id="qt-title" class="text-lg font-serif text-white tracking-wide">Quest Title</h3>
                    <span id="qt-badge" class="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-stone-300 border border-white/5">Type</span>
                </div>
                <p id="qt-desc" class="text-xs text-stone-400 leading-relaxed mb-4 line-clamp-3">
                    Quest description goes here...
                </p>
                <div class="space-y-2 mb-4">
                    <div class="flex items-center justify-between text-xs border-b border-white/5 pb-1">
                        <span class="text-stone-600 uppercase font-bold">Rewards</span>
                    </div>
                    <div id="qt-rewards" class="flex flex-wrap gap-2"></div>
                </div>
                <button id="qt-action" class="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-serif text-xs uppercase tracking-[0.2em] border border-amber-500/20 transition-all rounded shadow-lg">
                    Accept Quest
                </button>
            </div>
        </div>
    </div>

</div>

<!-- DATA STORE & LOGIC -->
<script>
    const questsData = {
        'quest-1': {
            title: "First Steps",
            icon: "footprints",
            desc: "Master the basics of combat and navigation in Stormhaven.",
            type: "Available",
            badgeColor: "text-emerald-400 bg-emerald-900/20 border-emerald-500/20",
            rewards: [ { type: "xp", val: "+50 XP", color: "text-emerald-400" }, { type: "gold", val: "10g", color: "text-amber-400" } ],
            action: { text: "Accept Quest", enabled: true }
        },
        'quest-2': {
            title: "Join the Guild",
            icon: "lock",
            desc: "Access exclusive contracts by proving your worth.",
            type: "Locked",
            badgeColor: "text-red-400 bg-red-900/20 border-red-500/20",
            rewards: [ { type: "item", val: "Guild Badge", color: "text-purple-400" } ],
            action: { text: "Details Locked", enabled: false }
        },
        'quest-3': {
            title: "Bandit Raid",
            icon: "shield-alert",
            desc: "Defend the city gates from an impending bandit raid.",
            type: "Danger",
            badgeColor: "text-red-400 bg-red-900/20 border-red-500/20",
            rewards: [ { type: "xp", val: "+150 XP", color: "text-emerald-400" }, { type: "gold", val: "75g", color: "text-amber-400" } ],
            action: { text: "Accept Challenge", enabled: true }
        },
        'quest-4': {
            title: "Crystal Whispers",
            icon: "gem",
            desc: "Investigate the pulsing blue energies in the Crystal Caves.",
            type: "Magic",
            badgeColor: "text-cyan-400 bg-cyan-900/20 border-cyan-500/20",
            rewards: [ { type: "item", val: "Mana Core", color: "text-cyan-400" } ],
            action: { text: "Enter Caves", enabled: true }
        },
        'quest-5': {
            title: "Smuggler's Den",
            icon: "skull",
            desc: "A notorious smuggler gang is hiding in the forest.",
            type: "Threat",
            badgeColor: "text-orange-400 bg-orange-900/20 border-orange-500/20",
            rewards: [ { type: "gold", val: "200g", color: "text-amber-400" } ],
            action: { text: "Hunt", enabled: true }
        },
        'quest-6': {
            title: "Forgotten Ruins",
            icon: "scroll",
            desc: "Decipher the ancient texts found in the ruins.",
            type: "Mystery",
            badgeColor: "text-purple-400 bg-purple-900/20 border-purple-500/20",
            rewards: [ { type: "xp", val: "+100 XP", color: "text-emerald-400" } ],
            action: { text: "Investigate", enabled: true }
        }
    };

    // openWorldMapModal() is now in worldmap-modal-loader.js for lazy loading support
    
    function closeWorldMapModal() {
        const modal = document.getElementById('world-map-modal');
        hideQuestTooltip();
        if(modal) {
             modal.classList.add('opacity-0');
             setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.pointerEvents = "none";
            }, 300);
        }
    }

    // Drag Logic (initialize after DOM is ready)
    function initMapDragLogic() {
        const mapScrollZone = document.getElementById('map-scroll-zone');
        if(!mapScrollZone) return;
        
        let isDown = false;
        let startX, scrollLeft;
        let dragThreshold = 5;
        let initialX;

        mapScrollZone.addEventListener('mousedown', (e) => {
            if(e.target.closest('button')) return;
            isDown = true;
            mapScrollZone.classList.add('active');
            mapScrollZone.style.cursor = 'grabbing';
            startX = e.pageX - mapScrollZone.offsetLeft;
            initialX = e.pageX;
            scrollLeft = mapScrollZone.scrollLeft;
        });

        // Use global mouseup to catch drags leaving the container
        document.addEventListener('mouseup', () => { 
            if(isDown) { isDown = false; mapScrollZone.style.cursor = 'grab'; }
        });

        document.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const diffX = Math.abs(e.pageX - initialX);
            if (diffX > dragThreshold) {
                if(typeof hideQuestTooltip === 'function') hideQuestTooltip();
                const x = e.pageX - mapScrollZone.offsetLeft; // Recalc based on container offset
                const walkX = (x - startX) * 1; 
                mapScrollZone.scrollLeft = scrollLeft - walkX;
            }
        });
    }
    
    // Initialize drag logic when modal is ready
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapDragLogic);
    } else {
        // DOM already loaded, wait a bit for modal to be inserted
        setTimeout(initMapDragLogic, 100);
    }

    function showQuestTooltip(pinElement, questId) {
        const tooltip = document.getElementById('quest-tooltip');
        const data = questsData[questId];
        if(!tooltip || !data) return;

        document.getElementById('qt-title').innerText = data.title;
        document.getElementById('qt-desc').innerText = data.desc;
        document.getElementById('qt-icon').setAttribute('data-lucide', data.icon);
        const badge = document.getElementById('qt-badge');
        badge.innerText = data.type;
        badge.className = `text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded border ${data.badgeColor}`;
        const rc = document.getElementById('qt-rewards');
        rc.innerHTML = '';
        data.rewards.forEach(r => {
            const s = document.createElement('span');
            s.className = `text-xs font-mono font-bold ${r.color} bg-black/40 px-2 py-1 rounded border border-white/5`;
            s.innerText = r.val;
            rc.appendChild(s);
        });
        const btn = document.getElementById('qt-action');
        btn.innerText = data.action.text;
        btn.disabled = !data.action.enabled;
        btn.classList.toggle('opacity-50', !data.action.enabled);

        tooltip.classList.remove('hidden');
        if(typeof lucide !== 'undefined') lucide.createIcons();

        const rect = pinElement.getBoundingClientRect();
        let top = rect.top - tooltip.offsetHeight - 10; 
        let left = rect.left + (rect.width/2) - (tooltip.offsetWidth / 2);

        if(top < 50) top = rect.bottom + 10;
        if(left < 10) left = 10;
        if(left + 320 > window.innerWidth) left = window.innerWidth - 330;

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        
        requestAnimationFrame(() => tooltip.classList.remove('opacity-0'));
    }

    function hideQuestTooltip() {
        const tooltip = document.getElementById('quest-tooltip');
        if(tooltip) {
            tooltip.classList.add('opacity-0');
            setTimeout(() => tooltip.classList.add('hidden'), 200);
        }
    }
</script>

