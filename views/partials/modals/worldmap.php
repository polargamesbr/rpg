
<!-- WORLD MAP MODAL - Canvas Version with Pan & Zoom -->
<div id="world-map-modal" class="fixed inset-0 z-[100] hidden opacity-0 transition-opacity duration-300" aria-hidden="true" style="pointer-events: none;">
    
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/90 pointer-events-auto transition-opacity" onclick="closeWorldMapModal()"></div>

    <!-- Main Modal Container -->
    <div class="absolute inset-0 z-10 pointer-events-none flex flex-col">
        
        <!-- === CANVAS CONTAINER === -->
        <div id="map-canvas-container" class="absolute inset-0 z-0 pointer-events-auto"></div>
        
        <!-- === UI OVERLAYS === -->
        
        <!-- HEADER -->
        <div class="absolute top-0 left-0 right-0 z-50 flex justify-center pt-6 pointer-events-auto">
            <div class="bg-black/80 backdrop-blur-xl border border-amber-500/20 px-8 py-2.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col items-center group cursor-default">
                 <div class="flex items-center gap-3 mb-0.5">
                    <div class="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                    <i data-lucide="map-pin" class="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"></i>
                    <div class="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/50"></div>
                 </div>
                 <h2 class="text-xl font-serif text-white tracking-[0.15em] drop-shadow-md" style="font-family: 'Cinzel', serif;">STORMHAVEN</h2>
                 <p class="text-[0.55rem] font-bold text-stone-500 uppercase tracking-[0.3em] group-hover:text-amber-500/80 transition-colors">Kingdom of Aethelgard</p>
            </div>
        </div>

        <!-- CONTROLS (Right Side) -->
        <div class="absolute top-1/2 right-6 -translate-y-1/2 z-50 pointer-events-auto flex flex-col gap-2">
            <!-- Zoom In -->
            <button onclick="worldMapCanvas?.zoomIn()" class="w-11 h-11 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white/70 hover:text-white rounded-xl border border-white/10 hover:border-amber-500/30 backdrop-blur transition-all shadow-xl group" title="Zoom In">
                <i data-lucide="plus" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            </button>
            <!-- Zoom Out -->
            <button onclick="worldMapCanvas?.zoomOut()" class="w-11 h-11 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white/70 hover:text-white rounded-xl border border-white/10 hover:border-amber-500/30 backdrop-blur transition-all shadow-xl group" title="Zoom Out">
                <i data-lucide="minus" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            </button>
            <div class="h-px bg-white/10 my-1"></div>
            <!-- Reset View -->
            <button onclick="worldMapCanvas?.resetView()" class="w-11 h-11 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white/70 hover:text-white rounded-xl border border-white/10 hover:border-amber-500/30 backdrop-blur transition-all shadow-xl group" title="Reset View">
                <i data-lucide="maximize-2" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            </button>
        </div>

        <!-- CLOSE BUTTON -->
        <div class="absolute top-6 right-6 z-50 pointer-events-auto">
             <button onclick="closeWorldMapModal()" class="w-11 h-11 flex items-center justify-center bg-black/60 hover:bg-red-900/80 text-white/70 hover:text-white rounded-full border border-white/10 hover:border-white/30 backdrop-blur transition-all shadow-xl group">
                <i data-lucide="x" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            </button>
        </div>

        <!-- HINT (Bottom) -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
             <div class="bg-black/70 backdrop-blur px-5 py-2 rounded-full border border-white/10 text-xs text-stone-400 font-mono flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                    <i data-lucide="move" class="w-4 h-4 text-amber-400"></i>
                    <span>Drag to Pan</span>
                </div>
                <div class="w-px h-3 bg-white/20"></div>
                <div class="flex items-center gap-1.5">
                    <i data-lucide="zoom-in" class="w-4 h-4 text-cyan-400"></i>
                    <span>Scroll to Zoom</span>
                </div>
                <div class="w-px h-3 bg-white/20"></div>
                <div class="flex items-center gap-1.5">
                    <i data-lucide="mouse-pointer-click" class="w-4 h-4 text-emerald-400"></i>
                    <span>Click Markers</span>
                </div>
            </div>
        </div>

    </div>

    <!-- QUEST TOOLTIP (Moved outside canvas for proper layering) -->
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

<!-- WORLD MAP CANVAS SCRIPT -->
<?php 
// Try to detect the correct script path dynamically
$scriptBase = 'js/world-map-canvas.js';
if (function_exists('asset')) {
    $scriptPath = asset($scriptBase);
} else {
    // Fallback detection logic
    $isSubfolder = strpos($_SERVER['REQUEST_URI'], '/rpg/') !== false;
    $scriptPath = ($isSubfolder ? '/rpg' : '') . '/public/assets/' . $scriptBase;
}
?>
<script src="<?= $scriptPath ?>"></script>
<script>
    console.log('World Map Modal: Script loaded from <?= $scriptPath ?>');
    // World Map Canvas Instance
    let worldMapCanvas = null;

    // POI Data
    const mapPois = [
        {
            id: 'quest-1',
            name: 'Main Square',
            x: 960, y: 540,  // Center of 2000x1100 map
            type: 'quest',
            color: '#f59e0b',
            data: {
                title: "First Steps",
                icon: "footprints",
                desc: "Master the basics of combat and navigation in Stormhaven.",
                type: "Available",
                badgeColor: "text-emerald-400 bg-emerald-900/20 border-emerald-500/20",
                rewards: [ { type: "xp", val: "+50 XP", color: "text-emerald-400" }, { type: "gold", val: "10g", color: "text-amber-400" } ],
                action: { text: "Accept Quest", enabled: true }
            }
        },
        {
            id: 'quest-2',
            name: 'Guild Hall',
            x: 1160, y: 440,
            type: 'locked',
            color: '#78716c',
            data: {
                title: "Join the Guild",
                icon: "lock",
                desc: "Access exclusive contracts by proving your worth.",
                type: "Locked",
                badgeColor: "text-red-400 bg-red-900/20 border-red-500/20",
                rewards: [ { type: "item", val: "Guild Badge", color: "text-purple-400" } ],
                action: { text: "Details Locked", enabled: false }
            }
        },
        {
            id: 'quest-3',
            name: 'City Gates',
            x: 1000, y: 825,
            type: 'danger',
            color: '#ef4444',
            data: {
                title: "Bandit Raid",
                icon: "shield-alert",
                desc: "Defend the city gates from an impending bandit raid.",
                type: "Danger",
                badgeColor: "text-red-400 bg-red-900/20 border-red-500/20",
                rewards: [ { type: "xp", val: "+150 XP", color: "text-emerald-400" }, { type: "gold", val: "75g", color: "text-amber-400" } ],
                action: { text: "Accept Challenge", enabled: true }
            }
        },
        {
            id: 'quest-4',
            name: 'Crystal Caves',
            x: 1700, y: 385,
            type: 'magic',
            color: '#22d3ee',
            data: {
                title: "Crystal Whispers",
                icon: "gem",
                desc: "Investigate the pulsing blue energies in the Crystal Caves.",
                type: "Magic",
                badgeColor: "text-cyan-400 bg-cyan-900/20 border-cyan-500/20",
                rewards: [ { type: "item", val: "Mana Core", color: "text-cyan-400" } ],
                action: { text: "Enter Caves", enabled: true }
            }
        },
        {
            id: 'quest-5',
            name: "Bandit Camp",
            x: 300, y: 715,
            type: 'threat',
            color: '#f97316',
            data: {
                title: "Smuggler's Den",
                icon: "skull",
                desc: "A notorious smuggler gang is hiding in the forest.",
                type: "Threat",
                badgeColor: "text-orange-400 bg-orange-900/20 border-orange-500/20",
                rewards: [ { type: "gold", val: "200g", color: "text-amber-400" } ],
                action: { text: "Hunt", enabled: true }
            }
        },
        {
            id: 'quest-6',
            name: 'Ancient Ruins',
            x: 600, y: 275,
            type: 'mystery',
            color: '#a855f7',
            data: {
                title: "Forgotten Ruins",
                icon: "scroll",
                desc: "Decipher the ancient texts found in the ruins.",
                type: "Mystery",
                badgeColor: "text-purple-400 bg-purple-900/20 border-purple-500/20",
                rewards: [ { type: "xp", val: "+100 XP", color: "text-emerald-400" } ],
                action: { text: "Investigate", enabled: true }
            }
        }
    ];

    function openWorldMapModal() {
        console.log('World Map Modal: Opening...');
        const modal = document.getElementById('world-map-modal');
        if (!modal) return;
        
        // Initialize canvas if not already
        if (!worldMapCanvas) {
            const container = document.getElementById('map-canvas-container');
            
            // Resolve map source path with multiple fallbacks
            let mapSrc = '<?= function_exists("asset") ? asset("img/map.png") : "" ?>';
            if (!mapSrc || mapSrc.includes('undefined')) {
                const isSubfolder = window.location.pathname.includes('/rpg/');
                mapSrc = (isSubfolder ? '/rpg' : '') + '/public/assets/img/map.png';
            }
            
            console.log('World Map Modal: Initializing with mapSrc:', mapSrc);

            worldMapCanvas = new WorldMapCanvas(container, {
                mapSrc: mapSrc,
                pois: mapPois,
                minZoom: 0.15,
                maxZoom: 3.0,
                initialZoom: 0.7,
                smoothing: 0.15,
                onPoiClick: handlePoiClick,
                onLoaded: () => {
                    // Only show the modal after the map image is loaded
                    console.log('World Map Modal: Map loaded, showing modal...');
                    modal.classList.remove('hidden');
                    modal.offsetHeight; // Trigger reflow
                    modal.classList.replace('opacity-0', 'opacity-100');
                    modal.style.pointerEvents = "auto";
                    
                    // Reinitialize icons
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                    
                    // Hide global loading screen if exists
                    if (typeof hideModalLoading === 'function') {
                        hideModalLoading();
                    }
                }
            });
        } else {
            // Modal already exists and map is loaded
            modal.classList.remove('hidden');
            modal.offsetHeight;
            modal.classList.replace('opacity-0', 'opacity-100');
            modal.style.pointerEvents = "auto";
            
            // Re-fit if already initialized
            setTimeout(() => worldMapCanvas.fitToView(), 100);

            // Reinitialize icons (Lucide)
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    function closeWorldMapModal() {
        const modal = document.getElementById('world-map-modal');
        if (!modal) return;
        
        modal.classList.replace('opacity-100', 'opacity-0');
        modal.style.pointerEvents = "none";
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);

        if (typeof hideQuestTooltip === 'function') hideQuestTooltip();
    }

    function handlePoiClick(poi, event) {
        if (!poi || !poi.data) return;
        showQuestTooltipFromPoi(poi);
    }

    function showQuestTooltipFromPoi(poi) {
        const tooltip = document.getElementById('quest-tooltip');
        const data = poi.data;
        if (!tooltip || !data) return;

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
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Position tooltip at center-right of screen
        const containerRect = document.getElementById('map-canvas-container').getBoundingClientRect();
        const tooltipWidth = 320;
        
        tooltip.style.top = `${containerRect.height / 2 - 100}px`;
        tooltip.style.left = `${containerRect.width / 2 + 50}px`;

        requestAnimationFrame(() => tooltip.classList.remove('opacity-0'));
    }

    function hideQuestTooltip() {
        const tooltip = document.getElementById('quest-tooltip');
        if (tooltip) {
            tooltip.classList.add('opacity-0');
            setTimeout(() => tooltip.classList.add('hidden'), 200);
        }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('world-map-modal');
        if (modal && !modal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeWorldMapModal();
            } else if (e.key === '+' || e.key === '=') {
                worldMapCanvas?.zoomIn();
            } else if (e.key === '-') {
                worldMapCanvas?.zoomOut();
            } else if (e.key === '0') {
                worldMapCanvas?.resetView();
            }
        }
    });

    // === PRO-ACTIVE INITIALIZATION ===
    function checkAndInitMap() {
        const modal = document.getElementById('world-map-modal');
        if (!modal) return;

        const isVisible = !modal.classList.contains('hidden');
        if (isVisible) {
            if (!worldMapCanvas) {
                console.log('World Map: Modal is visible on load/change, initializing engine...');
                openWorldMapModal();
            } else {
                worldMapCanvas.updateDimensions();
                worldMapCanvas.needsRender = true;
            }
        }
    }

    // Monitor for visibility changes
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('world-map-modal');
        if (!modal) return;

        // 1. Check immediately
        checkAndInitMap();

        // 2. Observe future changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    checkAndInitMap();
                }
            });
        });

        observer.observe(modal, { attributes: true });
    });

    // Final fallback: also check every 1s if still black
    setInterval(() => {
        const modal = document.getElementById('world-map-modal');
        if (modal && !modal.classList.contains('hidden') && !worldMapCanvas) {
            checkAndInitMap();
        }
    }, 1000);
</script>
