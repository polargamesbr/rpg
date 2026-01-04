// combat-system.js - Core Logic
const combatSystem = {
    state: {
        isActive: false,
        turnCount: 0,
        activeEntityId: null,
        phase: 'idle',
        selectedActionType: null,
        selectedSkill: null,
        skillPreviewId: null,
        actionTargets: [],
        targetMode: 'enemy', // 'enemy' | 'ally'
        entities: [],
        enemyVisualOrder: [],
        parry: { active: false, attacker: null, damage: 0, attacksRemaining: 0, timeout: null },
        selection: { heroes: [], enemies: [], heroLevels: {}, enemyLevels: {} }, // Multi-Hero Selection State + Levels
        statsOverlay: { open: false, entityId: null },
        usedSummonTypes: [], // Track which summon entity types have been used (e.g., ['wolf', 'ifrit'])
        autoGameEnabled: false, // AutoGame debug mode - AI controls both heroes and enemies
        quickCombatEnabled: false, // Quick Combat mode - No animations, straight calculations
        history: [] // Combat history for simulation reports
    },
    audio: {},
    data: null, // Will be set to combatData

    config: {
        debugMode: true,
    },

    debug(category, msg, data = null) {
        if (!this.config?.debugMode && !this.state.quickCombatEnabled) return;
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        const prefix = `[${time}] [${category}]`;

        // Always store in history if quick combat or debug
        if (this.state.history) {
            this.state.history.push({
                turn: this.state.turnCount,
                category: category,
                message: msg,
                time: time
            });
        }

        if (!this.config?.debugMode) return;

        if (data) {
            console.groupCollapsed(prefix, msg);
            console.dir(data);
            console.groupEnd();
        } else {
            console.log(prefix, msg);
        }
    },

    skipUI() {
        return this.state.quickCombatEnabled;
    },

    init() {
        this.data = window.combatData || (typeof combatData !== 'undefined' ? combatData : null);
        if (!this.data) console.error("Combat System: combatData missing!");

        // Audio Manager Init
        if (window.AudioManager && window.audioRegistry) {
            this.audioManager = new AudioManager(window.audioRegistry);
        } else {
            console.warn('[CombatSystem] AudioManager or audioRegistry not found. Audio disabled.');
            this.audioManager = null;
        }

        // Legacy audio elements (mantidos para compatibilidade temporária)
        this.audio = {
            bass: document.getElementById('audio-bass'),
            battleBegin: document.getElementById('audio-battle-begin'),
            battle: document.getElementById('audio-battle')
        };
        // Tilt disabled
        // Particles will be initialized when combat starts (in openSetup)

        // Keybinds
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && combatSystem.state.parry.active) { e.preventDefault(); combatSystem.attemptParry(); }

            // Stats overlay
            if (e.code === 'Escape' && combatSystem.state.statsOverlay?.open) {
                e.preventDefault();
                combatSystem.closeStatsOverlay();
                return;
            }
            if (e.code === 'KeyC' && combatSystem.state.isActive) {
                // Toggle stats for active hero (or player)
                e.preventDefault();
                const activeHero = combatSystem.getActiveHero() || combatSystem.data?.player;
                if (activeHero) combatSystem.toggleStatsOverlay(activeHero.id);
            }
        });

        // Cinema Scaling
        window.addEventListener('resize', () => this.updateScale());
        this.updateScale();

        // Load audio preferences from localStorage
        setTimeout(() => this.loadAudioPreferences(), 500);
    },

    updateScale() {
        const battlefield = document.getElementById('battlefield-container');
        const inner = document.getElementById('battlefield-inner');
        const heroes = document.getElementById('heroes-container');
        const enemies = document.getElementById('enemy-container');
        if (!battlefield || !inner || !heroes || !enemies) return;

        const isMobileWidth = window.innerWidth < 1640;
        const isMobileHeight = window.innerHeight < 800;
        const isMobile = isMobileWidth || isMobileHeight;

        if (isMobile) {
            // Vertical Stack Layout (Mobile/Small Screens)
            inner.classList.add('flex-col', 'gap-20');  // 80px gap (was 48px)
            inner.classList.remove('flex-row', 'gap-32');

            // Enemies on top, heroes on bottom
            enemies.classList.add('order-1');
            heroes.classList.add('order-2');

            // No scaling needed
            battlefield.style.transform = '';
        } else {
            // Horizontal Centered Layout (Desktop)
            inner.classList.add('flex-row', 'gap-32'); // 128px gap
            inner.classList.remove('flex-col', 'gap-20');

            // Reset order
            enemies.classList.remove('order-1');
            heroes.classList.remove('order-2');

            // Optional scale for very large screens (>2560px)
            const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
            if (scale > 1.3) {
                battlefield.style.transform = `scale(${Math.min(scale * 0.9, 1.4)})`;
            } else {
                battlefield.style.transform = '';
            }
        }
    },

    playEffect(id) {
        if (!id || this.skipUI()) return;
        try {
            if (id === 'sword') {
                if (this.audio.swords && this.audio.swords.length > 0) {
                    const s = this.audio.swords[Math.floor(Math.random() * this.audio.swords.length)];
                    if (s) { s.currentTime = 0; s.play().catch(() => { }); }
                }
            } else if (id === 'crit') {
                if (this.audio.critHit) { this.audio.critHit.currentTime = 0; this.audio.critHit.play().catch(() => { }); }
            } else if (this.audio[id]) {
                this.audio[id].currentTime = 0;
                this.audio[id].play().catch(() => { });
            }
        } catch (e) { console.warn("Audio play failed", e); }
    },

    // --- SETUP PHASE ---
    openSetup() {
        const m = document.getElementById('combat-modal');
        m.classList.remove('hidden');
        m.setAttribute('aria-hidden', 'false');
        setTimeout(() => m.classList.remove('opacity-0'), 10);

        // Initialize particles when modal opens
        if (!this._particleSystem) {
            this.initBackgroundParticles();
        }

        // Show Setup, Hide Combat
        document.getElementById('combat-setup').classList.remove('hidden');
        setTimeout(() => document.getElementById('combat-setup').classList.remove('opacity-0'), 50);
        document.getElementById('battlefield-container').classList.add('hidden');
        document.getElementById('action-bar').classList.add('hidden');
        document.getElementById('turn-indicator').parentElement.classList.add('hidden'); // Hide Turn HUD

        this.renderSetupLists();
        this.updateSetupUI();
    },

    renderSetupLists() {
        const hList = document.getElementById('setup-hero-list');
        const eList = document.getElementById('setup-enemy-list');
        if (!hList || !eList) return;

        hList.innerHTML = ''; eList.innerHTML = '';

        // Flatten entities
        Object.entries(this.data.entities).forEach(([key, entity]) => {
            // Render Hero Card
            const hCard = this.createSetupCard(key, entity, 'hero');
            hList.appendChild(hCard);

            // Render Enemy Card
            const eCard = this.createSetupCard(key, entity, 'enemy');
            eList.appendChild(eCard);
        });
    },

    createSetupCard(key, entity, type) {
        const el = document.createElement('div');
        const isSelected = type === 'hero' ? this.state.selection.heroes.includes(key) : this.state.selection.enemies.includes(key);
        const currentLevel = type === 'hero' ? (this.state.selection.heroLevels[key] || entity.baseLevel || 1) : (this.state.selection.enemyLevels[key] || entity.baseLevel || 1);

        el.className = `setup-card relative p-4 bg-zinc-900 rounded-xl border-2 cursor-pointer transition-all group min-h-[360px] flex flex-col ${type}-card-${key} ${isSelected ? (type === 'hero' ? 'border-blue-500/50 bg-blue-500/10' : 'border-red-500/50 bg-red-500/10') : 'border-transparent hover:border-white/20'}`;

        el.innerHTML = `
            <!-- Portrait (Larger, No Cutting) -->
            <div class="relative w-full aspect-[4/5] rounded-lg overflow-hidden mb-3">
                <img src="${entity.img}" class="w-full h-full object-cover object-top">
                <!-- Selected Overlay -->
                ${isSelected ? `<div class="absolute inset-0 bg-${type === 'hero' ? 'blue' : 'red'}-500/20 flex items-start justify-end p-2">
                    <div class="bg-${type === 'hero' ? 'blue' : 'red'}-500 rounded-full p-1 text-white text-xs">✓</div>
                </div>` : ''}
            </div>
            
            <!-- Name -->
            <div class="text-sm font-bold text-white text-center mb-3 truncate">${entity.name}</div>
            
            <!-- Level Slider -->
            <div class="level-control mb-2">
                <label class="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 flex justify-between">
                    <span>Level:</span>
                    <span class="text-white font-bold level-display">${currentLevel}</span>
                </label>
                <input type="range" min="1" max="100" value="${currentLevel}" 
                       class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer 
                              [&::-webkit-slider-thumb]:appearance-none 
                              [&::-webkit-slider-thumb]:w-3 
                              [&::-webkit-slider-thumb]:h-3 
                              [&::-webkit-slider-thumb]:rounded-full 
                              [&::-webkit-slider-thumb]:bg-${type === 'hero' ? 'blue' : 'red'}-500
                              level-slider"
                       data-key="${key}" data-type="${type}">
            </div>
            
            <!-- Quick Level Buttons -->
            <div class="flex gap-1">
                <button class="quick-level text-[9px] px-2 py-0.5 bg-zinc-800 rounded hover:bg-${type === 'hero' ? 'blue' : 'red'}-500 transition-colors" data-level="1">1</button>
                <button class="quick-level text-[9px] px-2 py-0.5 bg-zinc-800 rounded hover:bg-${type === 'hero' ? 'blue' : 'red'}-500 transition-colors" data-level="10">10</button>
                <button class="quick-level text-[9px] px-2 py-0.5 bg-zinc-800 rounded hover:bg-${type === 'hero' ? 'blue' : 'red'}-500 transition-colors" data-level="50">50</button>
                <button class="quick-level text-[9px] px-2 py-0.5 bg-zinc-800 rounded hover:bg-${type === 'hero' ? 'blue' : 'red'}-500 transition-colors" data-level="100">100</button>
            </div>
        `;

        // Card click - toggle selection
        el.onclick = (e) => {
            if (e.target.classList.contains('level-slider') || e.target.classList.contains('quick-level')) return;
            type === 'hero' ? this.toggleHero(key) : this.toggleEnemy(key);
        };

        // Level slider change
        const slider = el.querySelector('.level-slider');
        slider.oninput = (e) => {
            e.stopPropagation();
            const newLevel = parseInt(e.target.value);
            el.querySelector('.level-display').textContent = newLevel;
            if (type === 'hero') {
                this.state.selection.heroLevels[key] = newLevel;
            } else {
                this.state.selection.enemyLevels[key] = newLevel;
            }
        };

        // Quick level buttons
        el.querySelectorAll('.quick-level').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const level = parseInt(btn.dataset.level);
                slider.value = level;
                el.querySelector('.level-display').textContent = level;
                if (type === 'hero') {
                    this.state.selection.heroLevels[key] = level;
                } else {
                    this.state.selection.enemyLevels[key] = level;
                }
            };
        });

        return el;
    },

    toggleHero(key) {
        const idx = this.state.selection.heroes.indexOf(key);
        if (idx >= 0) {
            this.state.selection.heroes.splice(idx, 1);
        } else {
            if (this.state.selection.heroes.length < 3) this.state.selection.heroes.push(key);
        }
        this.updateSetupUI();
    },
    toggleEnemy(key) {
        const idx = this.state.selection.enemies.indexOf(key);
        if (idx >= 0) {
            this.state.selection.enemies.splice(idx, 1);
        } else {
            if (this.state.selection.enemies.length < 3) this.state.selection.enemies.push(key);
        }
        this.updateSetupUI();
    },

    checkSetupValidity() {
        const btn = document.getElementById('btn-start-combat');
        if (!btn) return;
        const valid = this.state.selection.heroes.length > 0 && this.state.selection.enemies.length > 0;
        btn.disabled = !valid;
        document.getElementById('setup-error-msg').style.opacity = valid ? '0' : '1';
    },

    updateSetupUI() {
        // Optimized: Update existing cards without re-rendering (prevents image reloads)
        Object.entries(this.data.entities).forEach(([key, entity]) => {
            // Update hero card
            const heroCard = document.querySelector(`.hero-card-${key}`);
            if (heroCard) {
                const isSelected = this.state.selection.heroes.includes(key);
                if (isSelected) {
                    heroCard.classList.add('border-blue-500/50', 'bg-blue-500/10');
                    heroCard.classList.remove('border-transparent', 'border-red-500/50', 'bg-red-500/10');
                    // Add checkmark overlay if not exists
                    if (!heroCard.querySelector('.selected-overlay')) {
                        const overlay = document.createElement('div');
                        overlay.className = 'selected-overlay absolute inset-0 bg-blue-500/20 flex items-start justify-end p-2 pointer-events-none';
                        overlay.innerHTML = '<div class="bg-blue-500 rounded-full p-1 text-white text-xs">✓</div>';
                        heroCard.querySelector('.aspect-\\[4\\/5\\]').appendChild(overlay);
                    }
                } else {
                    heroCard.classList.remove('border-blue-500/50', 'bg-blue-500/10', 'border-red-500/50', 'bg-red-500/10');
                    heroCard.classList.add('border-transparent');
                    // Remove checkmark overlay
                    const overlay = heroCard.querySelector('.selected-overlay');
                    if (overlay) overlay.remove();
                }
            }

            // Update enemy card
            const enemyCard = document.querySelector(`.enemy-card-${key}`);
            if (enemyCard) {
                const isSelected = this.state.selection.enemies.includes(key);
                if (isSelected) {
                    enemyCard.classList.add('border-red-500/50', 'bg-red-500/10');
                    enemyCard.classList.remove('border-transparent', 'border-blue-500/50', 'bg-blue-500/10');
                    // Add checkmark overlay if not exists
                    if (!enemyCard.querySelector('.selected-overlay')) {
                        const overlay = document.createElement('div');
                        overlay.className = 'selected-overlay absolute inset-0 bg-red-500/20 flex items-start justify-end p-2 pointer-events-none';
                        overlay.innerHTML = '<div class="bg-red-500 rounded-full p-1 text-white text-xs">✓</div>';
                        enemyCard.querySelector('.aspect-\\[4\\/5\\]').appendChild(overlay);
                    }
                } else {
                    enemyCard.classList.remove('border-red-500/50', 'bg-red-500/10', 'border-blue-500/50', 'bg-blue-500/10');
                    enemyCard.classList.add('border-transparent');
                    // Remove checkmark overlay
                    const overlay = enemyCard.querySelector('.selected-overlay');
                    if (overlay) overlay.remove();
                }
            }
        });

        // Start Button Validity
        const btn = document.getElementById('btn-start-combat');
        if (btn) {
            const valid = this.state.selection.heroes.length > 0 && this.state.selection.enemies.length > 0;
            btn.disabled = !valid;
            const errorMsg = document.getElementById('setup-error-msg');
            if (errorMsg) errorMsg.style.opacity = valid ? '0' : '1';
        }
    },

    startBattle() {
        if (this.state.selection.heroes.length === 0 || this.state.selection.enemies.length === 0) return;

        // Reset history
        this.state.history = [];
        this.data.heroes = [];
        this.state.selection.heroes.forEach((hKey, index) => {
            const hDef = this.data.entities[hKey];
            const hSkills = (hDef.skills || []).map(sid => {
                const s = this.data.skills[sid];
                return s ? { ...s, id: sid } : null;
            }).filter(s => s);

            const hero = {
                ...(JSON.parse(JSON.stringify(hDef))),
                id: `hero_${index + 1}`,
                isPlayer: true,
                xp: 0, level: hDef.baseLevel || 10, gold: 0,
                hp: hDef.maxHp, maxHp: hDef.maxHp,
                mana: hDef.maxMana, maxMana: hDef.maxMana,
                statusEffects: [],
                skills: hSkills
            };

            // Apply selected level (if any)
            const selectedLevel = this.state.selection.heroLevels[hKey] || hero.level;
            if (selectedLevel !== hero.level) {
                this.scaleStatsForLevel(hero, selectedLevel);
            }

            this.data.heroes.push(hero);
        });

        // 2. Hydrate Enemies
        this.data.enemies = this.state.selection.enemies.map((key, idx) => {
            const def = this.data.entities[key];
            const maxHp = def.maxHp || 100;
            const maxMana = def.maxMana || 50;
            const eSkills = (def.skills || []).map(sid => {
                const s = this.data.skills[sid];
                if (!s) console.warn(`Skill ${sid} not found for ${def.name}`);
                return s ? { ...s, id: sid } : null;
            }).filter(s => s);

            this.debug('INFO', `Hydrated ${def.name} with ${eSkills.length} skills.`);

            const enemy = {
                ...JSON.parse(JSON.stringify(def)), // Clone
                id: `enemy_${idx}_${key}`, // Unique Instance ID
                statusEffects: [], stats: {}, attacks: 1,
                level: def.baseLevel || 1, // Ensure level exists
                hp: maxHp, maxHp: maxHp, mana: maxMana, maxMana: maxMana,
                skills: eSkills
            };

            // Apply selected level (if any)
            const selectedLevel = this.state.selection.enemyLevels[key] || enemy.level;
            if (selectedLevel !== enemy.level) {
                this.scaleStatsForLevel(enemy, selectedLevel);
            }

            return enemy;
        });

        // Reset summon tracking
        this.state.usedSummonTypes = [];

        // Reset Time Skip uses for all heroes
        this.data.heroes.forEach(h => {
            h.timeSkipUses = 0;
            h.lastTimeSkipTurn = null;
        });

        // 3. Prepare Stats & Ensure Full Vitality at Start
        this.data.heroes.forEach(h => {
            this.calculateStats(h);
            h.hp = h.maxHp;
            h.mana = h.maxMana;
        });
        this.data.enemies.forEach(e => {
            this.calculateStats(e);
            e.hp = e.maxHp;
            e.mana = e.maxMana;
        });

        // 4. Set primary hero for compatibility with reward logic
        this.data.player = this.data.heroes[0];
        // 4. UI Transition
        document.getElementById('combat-setup').classList.add('opacity-0');
        setTimeout(() => document.getElementById('combat-setup').classList.add('hidden'), 500);

        document.getElementById('battlefield-container').classList.remove('hidden');
        document.getElementById('action-bar').classList.remove('hidden');
        document.getElementById('turn-indicator').parentElement.classList.remove('hidden');

        // 5. Render
        this.state.isActive = true;
        this.state.turnCount = 0; // Start at 0 so first turn picks entities[0]

        // Fix: Use determineTurnOrder logic here to ensure IDs are used, NOT Objects
        // Pre-sort for initial render if needed, but important is state.entities = IDs
        this.determineTurnOrder();

        this.renderHeroes();
        this.renderEnemies();
        this.renderGraveyard();

        // Initialize debug panel
        this.initDebugPanel();

        // Ensure valid initial ID
        if (this.state.entities.length > 0) {
            this.state.activeEntityId = this.state.entities[0];
        } else {
            console.error("CRITICAL: No entities found in startBattle");
            return;
        }

        // Audio: Battle Start
        if (this.audio && this.audio.battleBegin) this.audio.battleBegin.play().catch(() => { });
        if (this.audio && this.audio.bass) { this.audio.bass.currentTime = 0; this.audio.bass.play().catch(() => { }); }

        // Intro Text
        const intro = document.getElementById('battle-intro-overlay');
        const finalizeStart = () => {
            if (intro) intro.classList.add('hidden');
            if (!this.skipUI() && this.audio && this.audio.battle) {
                this.audio.battle.currentTime = 0;
                this.audio.battle.volume = 0.5;
                this.audio.battle.play().catch(() => { });
            }
            this.log("Battle Started!");
            this.stepTurn();
        };

        if (this.skipUI()) {
            finalizeStart();
        } else if (intro) {
            intro.classList.remove('hidden');
            setTimeout(finalizeStart, 3000);
        } else {
            setTimeout(finalizeStart, 1000);
        }
    },

    renderHeroes() {
        if (this.skipUI()) return;
        const c = document.getElementById('heroes-container');
        if (!c) return;
        c.innerHTML = '';

        // Filter only alive heroes
        const aliveHeroes = this.data.heroes.filter(h => h.hp > 0);

        const isMobile = window.innerWidth < 1640 || window.innerHeight < 800;
        const isXL = window.innerWidth > 2300;
        const isDuel = aliveHeroes.length === 1 && this.data.enemies.filter(e => e.hp > 0).length === 1;

        // Responsive card sizing
        let cardSizeClass;
        if (isDuel) {
            if (isXL) cardSizeClass = "w-[400px] h-[600px]"; // XL duel
            else if (isMobile) cardSizeClass = "w-[300px] h-[450px]"; // Mobile duel
            else cardSizeClass = "w-[360px] h-[540px]"; // Normal duel
        } else {
            if (isXL) cardSizeClass = "w-[280px] h-[420px]"; // XL party
            else if (isMobile) cardSizeClass = "w-[220px] h-[330px]"; // Mobile party
            else cardSizeClass = "w-[240px] h-[360px]"; // Normal party
        }

        aliveHeroes.forEach(h => {
            const el = document.createElement('div');
            el.className = `combat-card group relative ${cardSizeClass} transition-all duration-500 hero-card-instance`;
            el.dataset.id = h.id;
            // Make entire card clickable for ally targeting
            el.style.cursor = 'pointer';
            el.onclick = (evt) => {
                // Allow clicking anywhere on the card for ally targeting
                if (this.state.targetMode === 'ally' &&
                    (this.state.phase === 'selecting_target' || this.state.phase === 'confirming')) {
                    evt.stopPropagation();
                    this.selectAllyTarget(h.id);
                }
            };

            const hpPct = (h.hp / h.maxHp) * 100;
            const mpPct = (h.mana / (h.maxMana || 1)) * 100;

            const mediaHtml = h.video ?
                `<video src="${h.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover rounded-2xl transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>` :
                `<div class="absolute inset-0 bg-cover bg-center rounded-2xl transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none" style="background-image: url('${h.img}');"></div>`;

            // Summon visual indicator
            const isSummon = h.isSummon === true;
            const summonBorderClass = isSummon ? 'border-yellow-500/60 ring-yellow-500/40' : '';
            const summonBadge = isSummon ? `<div class="absolute -top-2 -right-2 z-50 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-yellow-300 shadow-lg flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i>
                <span>SUMMON</span>
            </div>` : '';

            el.innerHTML = `
                ${summonBadge}
                <div class="absolute inset-0 rounded-2xl border-[3.5px] ${isSummon ? 'border-yellow-500/60' : 'border-[#151515]'} bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-visible ring-1 ${isSummon ? 'ring-yellow-500/40' : 'ring-white/10'} transition-all duration-500 group-hover:ring-blue-500/30 hero-card-border" id="${h.id}-border">
                    <!-- Media wrapper with overflow:hidden to prevent scale from escaping -->
                    <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                        ${mediaHtml}
                    </div>
                    <div class="floater-root absolute inset-0 z-50 pointer-events-none"></div>
                    <div class="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
                    
                    <!-- Click overlay for ally targeting (only active when in ally mode) -->
                    <div class="ally-target-overlay absolute inset-0 z-[100] pointer-events-none"></div>
                    
                    <div class="absolute inset-0 p-5 flex flex-col justify-end z-20 pointer-events-none">
                        <div class="text-center mb-2 pointer-events-auto relative">
                            <div class="active-indicator absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] opacity-0 transition-all duration-500 scale-75">Current</div>
                            
                            <!-- Element Badge (above name, centered) -->
                            ${h.element && h.element !== 'neutral' && window.elementalData ? `
                                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-sm border border-white/25 shadow-lg mb-2">
                                    ${window.elementalData.elements[h.element]?.img
                        ? `<img src="${window.elementalData.elements[h.element].img}" class="w-4 h-4 object-cover rounded" />`
                        : `<i data-lucide="${window.elementalData.elements[h.element]?.icon || 'circle'}" class="w-4 h-4" style="color: ${window.elementalData.elements[h.element]?.color || '#fff'}"></i>`
                    }
                                    <span class="text-[10px] font-bold uppercase tracking-wider" style="color: ${window.elementalData.elements[h.element]?.color || '#fff'}">${window.elementalData.elements[h.element]?.name || h.element}</span>
                                </div>
                            ` : ''}
                            
                            <h3 class="text-xl md:text-2xl font-black text-white font-serif tracking-tight drop-shadow-lg leading-tight w-full truncate">${h.name}</h3>
                            <div class="text-[0.65rem] font-black text-yellow-400 uppercase tracking-[0.2em] mt-1">Level ${h.level}</div>
                        </div>

                        <!-- Ally target marker (green) -->
                        <div class="target-marker target-marker-ally">
                            <div class="mira-ring-outer"></div>
                            <div class="mira-ring"></div>
                            <div class="mira-corners">
                                <div class="mira-corner mira-corner-tl"></div>
                                <div class="mira-corner mira-corner-tr"></div>
                                <div class="mira-corner mira-corner-bl"></div>
                                <div class="mira-corner mira-corner-br"></div>
                            </div>
                            <i data-lucide="target" class="w-10 h-10 text-emerald-400/80 animate-pulse"></i>
                        </div>

                        <!-- Status containers (top) -->
                        <div class="status-container-left absolute top-2 left-2 flex flex-col gap-1 pointer-events-auto z-50"></div>
                        <div class="status-container-right absolute top-2 right-2 flex flex-col gap-1 pointer-events-auto z-50"></div>

                        <div class="space-y-2 pointer-events-auto">
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px] font-black text-stone-200 uppercase tracking-widest"><span>HP</span><span class="hero-hp-text font-bold text-rose-400">${Math.floor(h.hp)}</span></div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner flex-1 border border-white/5 relative">
                                    <div class="blood-bar absolute inset-y-0 left-0 bg-white/40 transition-all duration-[1200ms]" style="width: ${hpPct}%"></div>
                                    <div class="hero-hp-bar absolute inset-y-0 left-0 bg-gradient-to-r from-rose-700 to-rose-500 hp-bar-primary" style="width: ${hpPct}%"></div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px] font-black text-stone-200 uppercase tracking-widest"><span>MP</span><span class="hero-mana-text font-bold text-blue-400">${Math.floor(h.mana)}</span></div>
                                <div class="h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner flex-1 border border-white/5">
                                    <div class="hero-mana-bar h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500" style="width: ${mpPct}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Stats button (bottom-center, small, half in/half out) - outside overflow-hidden -->
                <button class="stats-dock-btn absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-6 rounded-t-xl bg-black/80 backdrop-blur border border-white/10 border-b-0 flex items-center justify-center pointer-events-auto hover:bg-white/10 transition z-[60]"
                    data-stats-btn="1" title="Stats (C)">
                    <span class="text-[9px] font-black text-stone-200 uppercase tracking-widest">STATS</span>
                </button>
                <div class="slash-effect absolute inset-0 pointer-events-none z-40 hidden"></div>
            `;
            c.appendChild(el);

            // Bind ally targeting overlay click
            const overlay = el.querySelector('.ally-target-overlay');
            if (overlay) {
                overlay.addEventListener('click', (evt) => {
                    evt.stopPropagation();
                    // Block clicks for self skills
                    if (this.state.selectedSkill?.type === 'self') {
                        const hero = this.getActiveHero();
                        if (hero && h.id !== hero.id) {
                            this.showToastNotification("This skill can only be used on yourself!");
                            return;
                        }
                    }
                    if (this.state.targetMode === 'ally' &&
                        (this.state.phase === 'selecting_target' || this.state.phase === 'confirming')) {
                        this.selectAllyTarget(h.id);
                    }
                });
            }

            // Bind stats button click (use global reference to avoid `this` binding surprises)
            const btn = el.querySelector('button[data-stats-btn="1"]');
            if (btn) {
                btn.onclick = (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    combatSystem.openStatsOverlay(h.id);
                };
            }
            this.updateHeroUI(h.id);
        });

        // Re-apply enemy target markers after re-rendering heroes
        // This ensures markers persist if heroes are re-rendered mid-round due to death/summon
        setTimeout(() => this.renderEnemyTargetMarkers(), 50);

        // Tilt disabled
    },

    renderStatusIcons(entity, leftContainer, rightContainer) {
        // Backward compatible: allow a single container (legacy call sites)
        const legacySingle = !!leftContainer && !rightContainer;
        if (!leftContainer) return;
        if (!legacySingle && !rightContainer) return;

        leftContainer.innerHTML = '';
        if (!legacySingle) rightContainer.innerHTML = '';

        // IMPORTANT: SkillEngine stores "id" on the instance, but the stable effect id is in data.id (when provided).
        // Prefer data.id so icons/names stay consistent across renders.
        const buffs = Array.isArray(entity.activeBuffs)
            ? entity.activeBuffs.map(b => ({
                ...b,
                id: (b.data && b.data.id) ? b.data.id : b.id,
                duration: b.duration,
                __kind: 'buff'
            }))
            : [];
        const debuffs = Array.isArray(entity.activeDebuffs)
            ? entity.activeDebuffs.map(d => ({
                ...d,
                id: (d.data && d.data.id) ? d.data.id : d.id,
                duration: d.duration,
                __kind: 'debuff'
            }))
            : [];
        const statuses = Array.isArray(entity.statusEffects) ? entity.statusEffects.map(s => ({ ...s, __kind: 'status' })) : [];

        const all = [...debuffs, ...statuses, ...buffs];
        if (all.length === 0) return;

        const pngFor = (id) => {
            // Prefer registry PNG (effects-data.js), fallback to known existing assets.
            const regPng = (window.effectsData && window.effectsData[id] && window.effectsData[id].png) ? window.effectsData[id].png : null;
            if (regPng) return regPng;

            const map = {
                poison: 'assets/icons/skills/poison_arrow.png',
                bleed: 'assets/icons/skills/crushing_blow.png',
                burn: 'assets/icons/skills/2.png',
                freeze: 'assets/icons/skills/2.png',
                stun: 'assets/icons/skills/shield_bash.png',
                paralyze: 'assets/icons/skills/3.png',
                hunters_focus: 'assets/icons/skills/hunters_focus.png',
                battle_focus: 'assets/icons/skills/battle_focus.png',
                defensive_wall: 'assets/icons/skills/defensive_wall.png',
                parry_stance: 'assets/icons/skills/parry_stance.png',
            };
            return map[id] || null;
        };

        all.forEach(e => {
            const iconWrap = document.createElement('div');
            // Use specific styling for new square icons
            iconWrap.className = 'status-icon-square relative group/status transition-transform hover:scale-110 pointer-events-auto shrink-0';

            const reg = (window.effectsData && window.effectsData[e.id]) ? window.effectsData[e.id] : null;
            const inferredType = (e.__kind === 'buff') ? 'buff' : 'debuff';
            const finalType = (reg && reg.type) ? reg.type : inferredType;
            const isBuff = finalType === 'buff';

            let styleClass = isBuff ? 'status-buff' : 'status-debuff';
            let name = (reg && reg.name) ? reg.name.toUpperCase() : e.id.replace(/_/g, ' ').toUpperCase();

            // Generate description: prefer formatted effect description, then registry desc, then generic
            let desc = null;
            if (e.data) {
                desc = this.formatEffectDescription(e.data);
            }
            if (!desc && reg && reg.desc) {
                desc = reg.desc;
            }
            if (!desc) {
                desc = isBuff ? 'Beneficial effect.' : 'Negative status.';
            }

            let iconName = (reg && reg.lucide) ? reg.lucide : (isBuff ? 'arrow-up-circle' : 'alert-triangle');

            // Apply style class
            iconWrap.classList.add(styleClass);

            const png = pngFor(e.id);
            iconWrap.innerHTML = `
                ${png ? `<img src="${png}" class="w-7 h-7 rounded-md object-cover relative z-10 drop-shadow-md">` : `<i data-lucide="${iconName}" class="w-5 h-5 relative z-10 drop-shadow-md"></i>`}
                <div class="status-duration">${e.duration}</div>
            `;

            // Global Tooltip Events
            iconWrap.onmouseenter = (evt) => this.showGlobalTooltip(evt, name, desc, e.duration, isBuff ? 'buff' : 'debuff');
            iconWrap.onmouseleave = () => this.hideGlobalTooltip();

            // Append to correct container
            if (legacySingle) {
                leftContainer.appendChild(iconWrap);
            } else if (isBuff) {
                rightContainer.appendChild(iconWrap);
            } else {
                leftContainer.appendChild(iconWrap);
            }
        });
        this.refreshIcons();
    },

    formatEffectDescription(effectData) {
        // Generate a human-readable description from effect data
        const parts = [];

        if (effectData.stats) {
            const statParts = [];
            Object.keys(effectData.stats).forEach(stat => {
                const val = effectData.stats[stat];
                if (val !== 0) {
                    statParts.push(`${stat.toUpperCase()} ${val > 0 ? '+' : ''}${val}`);
                }
            });
            if (statParts.length > 0) {
                parts.push(statParts.join(', '));
            }
        }

        if (effectData.damageDealt && effectData.damageDealt !== 1) {
            const pct = Math.round((effectData.damageDealt - 1) * 100);
            parts.push(`Damage Dealt ${pct > 0 ? '+' : ''}${pct}%`);
        }

        if (effectData.damageTaken && effectData.damageTaken !== 1) {
            const pct = Math.round((effectData.damageTaken - 1) * 100);
            parts.push(`Damage Taken ${pct > 0 ? '+' : ''}${pct}%`);
        }

        if (effectData.critBonus) {
            parts.push(`Crit Bonus +${effectData.critBonus}%`);
        }

        if (effectData.parryChance) {
            parts.push(`Parry Chance +${Math.round(effectData.parryChance * 100)}%`);
        }

        if (effectData.flee) {
            parts.push(`Flee +${effectData.flee}`);
        }

        if (effectData.aspd) {
            parts.push(`ASPD ${effectData.aspd > 0 ? '+' : ''}${effectData.aspd}`);
        }

        if (effectData.atk) {
            parts.push(`ATK +${effectData.atk}`);
        }

        if (effectData.matk) {
            parts.push(`MATK +${effectData.matk}`);
        }

        return parts.length > 0 ? parts.join(' • ') : null;
    },

    showGlobalTooltip(evt, name, desc, duration, type) {
        let tooltip = document.getElementById('combat-global-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'combat-global-tooltip';
            tooltip.className = 'fixed p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-none z-[9999] transition-all duration-200 border w-48 backdrop-blur-xl opacity-0';
            document.body.appendChild(tooltip);
        }

        const borderColor = type === 'buff' ? 'border-green-500/30' : 'border-red-500/30';
        const bgColor = type === 'buff' ? 'bg-green-950/90' : 'bg-red-950/90';
        const titleColor = type === 'buff' ? 'text-green-400' : 'text-red-400';

        tooltip.className = `fixed p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-none z-[9999] transition-all duration-200 border w-48 backdrop-blur-xl ${bgColor} ${borderColor}`;

        tooltip.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="text-[11px] font-black ${titleColor} uppercase tracking-wider mb-1 border-b border-white/10 pb-1">${name}</div>
                <div class="text-[10px] text-stone-200 font-medium leading-relaxed">${desc}</div>
                <div class="flex justify-between items-center mt-2 pt-1 border-t border-white/5 text-[9px] font-black text-stone-400 uppercase tracking-widest">
                    <span>Duration</span>
                    <span class="text-white">${duration} Turns</span>
                </div>
            </div>
        `;

        // Calculate Position
        const rect = evt.currentTarget.getBoundingClientRect();
        const tooltipX = rect.left + (rect.width / 2) - 96; // Center horizontally (96 = w-48 / 2)
        const tooltipY = rect.top - 100; // Above the icon

        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';

        // Ensure it doesn't go off-screen
        if (tooltipX < 10) tooltip.style.left = '10px';
    },

    hideGlobalTooltip() {
        const tooltip = document.getElementById('combat-global-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(10px)';
        }
    },

    ensureStatsOverlay() {
        let overlay = document.getElementById('combat-stats-overlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'combat-stats-overlay';
        overlay.className = 'fixed inset-0 z-[9998] hidden';
        overlay.innerHTML = `
            <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <div class="absolute inset-0 flex items-center justify-center p-4 z-10">
                <div id="stats-overlay-modal" class="w-full max-w-3xl bg-[#0b0b0b]/95 border border-white/10 rounded-2xl shadow-[0_30px_120px_rgba(0,0,0,0.85)] overflow-hidden relative">
                    <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div class="min-w-0">
                            <div id="stats-overlay-title" class="text-lg md:text-xl font-black text-white truncate">Stats</div>
                            <div id="stats-overlay-subtitle" class="text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">Current values (including buffs)</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="stats-overlay-prev" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
                                <i data-lucide="chevron-left" class="w-5 h-5 text-stone-200"></i>
                            </button>
                            <button id="stats-overlay-next" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center">
                                <i data-lucide="chevron-right" class="w-5 h-5 text-stone-200"></i>
                            </button>
                            <button id="stats-overlay-close" class="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center">
                                <i data-lucide="x" class="w-5 h-5 text-red-300"></i>
                            </button>
                        </div>
                    </div>
                    <div id="stats-overlay-content" class="p-5 max-h-[75vh] overflow-y-auto custom-scrollbar"></div>
                    <div class="px-5 py-3 border-t border-white/10 text-[11px] text-stone-400 flex items-center justify-between">
                        <span><span class="font-black text-stone-200">Tip:</span> Press <span class="font-black text-stone-200">C</span> to toggle this panel.</span>
                        <span>Press <span class="font-black text-stone-200">ESC</span> to close</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close interactions
        overlay.querySelector('#stats-overlay-close')?.addEventListener('click', () => combatSystem.closeStatsOverlay());
        overlay.querySelector('.absolute.inset-0.bg-black\\/70')?.addEventListener('click', () => combatSystem.closeStatsOverlay());

        overlay.querySelector('#stats-overlay-prev')?.addEventListener('click', () => combatSystem.cycleStatsOverlay(-1));
        overlay.querySelector('#stats-overlay-next')?.addEventListener('click', () => combatSystem.cycleStatsOverlay(1));

        return overlay;
    },

    toggleStatsOverlay(entityId) {
        if (this.state.statsOverlay?.open) this.closeStatsOverlay();
        else this.openStatsOverlay(entityId);
    },

    cycleStatsOverlay(dir) {
        // Include both heroes and enemies for cycling
        const allIds = [
            ...(this.data?.heroes || []).map(h => h.id),
            ...(this.data?.enemies || []).map(e => e.id)
        ];
        if (allIds.length === 0) return;
        const cur = this.state.statsOverlay?.entityId || this.state.statsOverlayEntityId;
        const idx = Math.max(0, allIds.indexOf(cur));
        const next = allIds[(idx + dir + allIds.length) % allIds.length];
        if (next) this.openStatsOverlay(next);
    },

    openStatsOverlay(entityId) {
        const overlay = this.ensureStatsOverlay();
        const entity = this.data?.heroes?.find(h => h.id === entityId) || this.data?.enemies?.find(e => e.id === entityId) || null;
        if (!entity) return;

        this.state.statsOverlay = { open: true, entityId };
        this.state.statsOverlayOpen = true;
        this.state.statsOverlayEntityId = entityId;
        overlay.classList.remove('hidden');

        const title = overlay.querySelector('#stats-overlay-title');
        const subtitle = overlay.querySelector('#stats-overlay-subtitle');
        if (title) title.textContent = `${entity.name} — Current Stats`;
        if (subtitle) subtitle.textContent = `Includes buffs, debuffs, statuses, and future equipment/potions.`;

        const content = overlay.querySelector('#stats-overlay-content');
        if (!content) return;

        // Set background image/video with blur INSIDE the modal
        const modalEl = overlay.querySelector('#stats-overlay-modal');
        if (modalEl) {
            // Remove previous background
            const oldBg = modalEl.querySelector('.stats-overlay-bg-img');
            if (oldBg) oldBg.remove();

            const bgEl = document.createElement('div');
            bgEl.className = 'stats-overlay-bg-img absolute inset-0 pointer-events-none z-0';
            bgEl.style.opacity = '0.15';
            bgEl.style.filter = 'blur(8px)';
            bgEl.style.backgroundSize = 'cover';
            bgEl.style.backgroundPosition = 'center';

            if (entity.video) {
                bgEl.innerHTML = `<video src="${entity.video}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>`;
            } else if (entity.img) {
                bgEl.style.backgroundImage = `url('${entity.img}')`;
            }

            modalEl.appendChild(bgEl);
        }

        const a = entity.currentAttributes || entity.attributes || {};
        const baseA = entity.baseAttributes || entity.attributes || {};
        const s = entity.stats || {};

        const fmt = (v) => (v === undefined || v === null || Number.isNaN(v)) ? '-' : (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : String(v));
        const pct = (v) => (v === undefined || v === null) ? '-' : `${Math.round(v * 100)}%`;

        // Calculate delta for attributes
        const getAttrDelta = (key) => {
            const current = a[key] || 0;
            const base = baseA[key] || 0;
            const delta = current - base;
            if (delta === 0) return '';
            return delta > 0 ? ` <span class="text-green-400 text-sm">(+${delta})</span>` : ` <span class="text-red-400 text-sm">(${delta})</span>`;
        };

        const listEffects = (arr, kind) => {
            if (!Array.isArray(arr) || arr.length === 0) return `<div class="text-sm text-stone-500">None</div>`;
            return `<div class="space-y-2">` + arr.map(x => {
                const id = (x.data && x.data.id) ? x.data.id : x.id;
                const reg = (window.effectsData && window.effectsData[id]) ? window.effectsData[id] : null;
                const name = reg?.name || id;
                const dur = x.duration ?? x?.data?.duration ?? '-';
                const src = x.source ? `<span class="text-stone-500">• by ${x.source}</span>` : '';

                // Generate description: prefer formatted effect description, then registry desc
                let desc = null;
                if (x.data) {
                    desc = this.formatEffectDescription(x.data);
                }
                if (!desc && reg && reg.desc) {
                    desc = reg.desc;
                }
                if (!desc) {
                    desc = kind === 'buff' ? 'Beneficial effect.' : 'Negative status.';
                }

                return `
                    <div class="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <div class="text-sm font-black text-white truncate">${name} <span class="text-[11px] text-stone-400 font-bold uppercase tracking-widest ml-2">${kind}</span></div>
                                ${desc ? `<div class="text-[12px] text-stone-400 mt-1">${desc}</div>` : ''}
                            </div>
                            <div class="text-right shrink-0">
                                <div class="text-[11px] text-stone-400 uppercase tracking-widest font-bold">Duration</div>
                                <div class="text-lg font-black text-white">${fmt(dur)}</div>
                                <div class="text-[11px] mt-1">${src}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') + `</div>`;
        };

        const buffs = Array.isArray(entity.activeBuffs) ? entity.activeBuffs : [];
        const debuffs = Array.isArray(entity.activeDebuffs) ? entity.activeDebuffs : [];
        const statuses = Array.isArray(entity.statusEffects) ? entity.statusEffects : [];

        content.innerHTML = `
            <div class="relative z-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <div class="text-[11px] font-black uppercase tracking-[0.35em] text-stone-400 mb-3">Attributes</div>
                        <div class="grid grid-cols-3 gap-2">
                            ${['str', 'agi', 'vit', 'int', 'dex', 'luk'].map(k => `
                                <div class="rounded-xl bg-black/30 border border-white/10 p-3">
                                    <div class="text-[10px] text-stone-400 font-black uppercase tracking-widest">${k.toUpperCase()}</div>
                                    <div class="text-xl font-black text-white">${fmt(a[k])}${getAttrDelta(k)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <div class="text-[11px] font-black uppercase tracking-[0.35em] text-stone-400 mb-3">Combat Stats</div>
                        <div class="grid grid-cols-2 gap-2">
                            ${[
                ['ATK', 'atk'], ['MATK', 'matk'], ['HIT', 'hit'], ['FLEE', 'flee'],
                ['ASPD', 'aspd'], ['CRIT', 'crit'], ['MDEF', 'mdef'], ['SOFT DEF', 'softDef'], ['HARD DEF', 'hardDef']
            ].map(([label, key]) => `
                                <div class="rounded-xl bg-black/30 border border-white/10 p-3">
                                    <div class="text-[10px] text-stone-400 font-black uppercase tracking-widest">${label}</div>
                                    <div class="text-lg font-black text-white">${fmt(s[key])}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <div class="text-[11px] font-black uppercase tracking-[0.35em] text-stone-400 mb-3">HP / MP</div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Health</div>
                            <div class="text-2xl font-black text-white">${fmt(entity.hp)} / ${fmt(entity.maxHp)}</div>
                        </div>
                        <div>
                            <div class="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Mana</div>
                            <div class="text-2xl font-black text-white">${fmt(entity.mana)} / ${fmt(entity.maxMana)}</div>
                        </div>
                    </div>
                </div>

                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <div class="text-[11px] font-black uppercase tracking-[0.35em] text-green-400 mb-3">Buffs</div>
                        ${listEffects(buffs, 'buff')}
                    </div>
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <div class="text-[11px] font-black uppercase tracking-[0.35em] text-red-400 mb-3">Debuffs</div>
                        ${listEffects(debuffs, 'debuff')}
                    </div>
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                        <div class="text-[11px] font-black uppercase tracking-[0.35em] text-amber-300 mb-3">Statuses</div>
                        ${listEffects(statuses, 'status')}
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) lucide.createIcons();
    },

    closeStatsOverlay() {
        const overlay = document.getElementById('combat-stats-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.state.statsOverlay = { open: false, entityId: null };
        this.state.statsOverlayOpen = false;
        this.state.statsOverlayEntityId = null;
    },

    getStatusInfo(statusId) {
        // Prefer registry (effects-data.js) so UI never shows raw ids like "focus_hunter".
        const reg = (window.effectsData && window.effectsData[statusId]) ? window.effectsData[statusId] : null;

        const statusMap = {
            poison: { name: 'POISON', icon: 'droplet', bgClass: 'bg-green-500/30', borderClass: 'border-green-400/50', iconClass: 'text-green-300' },
            bleed: { name: 'BLEED', icon: 'droplets', bgClass: 'bg-red-500/30', borderClass: 'border-red-400/50', iconClass: 'text-red-300' },
            burn: { name: 'BURN', icon: 'flame', bgClass: 'bg-orange-500/30', borderClass: 'border-orange-400/50', iconClass: 'text-orange-300' },
            stun: { name: 'STUN', icon: 'zap-off', bgClass: 'bg-yellow-500/30', borderClass: 'border-yellow-400/50', iconClass: 'text-yellow-300' },
            freeze: { name: 'FREEZE', icon: 'snowflake', bgClass: 'bg-cyan-500/30', borderClass: 'border-cyan-400/50', iconClass: 'text-cyan-300' },
            paralyze: { name: 'PARALYZE', icon: 'zap', bgClass: 'bg-purple-500/30', borderClass: 'border-purple-400/50', iconClass: 'text-purple-300' },
            slow: { name: 'SLOW', icon: 'snail', bgClass: 'bg-blue-500/30', borderClass: 'border-blue-400/50', iconClass: 'text-blue-300' }
        };

        const base = statusMap[statusId] || { name: statusId.toUpperCase(), icon: 'circle-dot', bgClass: 'bg-gray-500/30', borderClass: 'border-gray-400/50', iconClass: 'text-gray-300' };
        if (!reg) return base;

        // Keep color palette from base, but override label/icon from registry.
        return {
            ...base,
            name: (reg.name ? reg.name.toUpperCase() : base.name),
            icon: (reg.lucide ? reg.lucide : base.icon),
        };
    },

    showStatChange(entity, statChanges) {
        if (this.skipUI()) return;
        // Show floating notification with stat changes
        const card = document.querySelector(`[data-id="${entity.id}"]`);
        if (!card) return;

        const notification = document.createElement('div');
        notification.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none';

        let changesHTML = '';
        Object.keys(statChanges).forEach(stat => {
            const change = statChanges[stat];
            const isPositive = change > 0;
            const color = isPositive ? 'green' : 'red';
            const arrow = isPositive ? '↑' : '↓';
            changesHTML += `
                <div class="flex items-center gap-2 text-${color}-300 font-black text-sm animate-bounce">
                    <span class="uppercase">${stat}</span>
                    <span>${arrow} ${Math.abs(change)}</span>
                </div>
            `;
        });

        notification.innerHTML = `
            <div class="bg-black/90 border-2 border-green-400/60 rounded-lg p-3 shadow-2xl animate-fade-in-scale">
                <div class="space-y-1">
                    ${changesHTML}
                </div>
            </div>
        `;

        card.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    },

    showSkillBanner(skillName, skillIcon = 'zap') {
        if (this.skipUI()) return;
        const container = document.getElementById('battlefield-container');
        if (!container) return;

        const banner = document.createElement('div');
        banner.className = 'fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-[600] pointer-events-none w-full flex flex-col items-center gap-4';

        banner.innerHTML = `
            <div class="banner-bg absolute inset-x-0 h-32 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent blur-3xl animate-pulse"></div>
            
            <div class="relative overflow-hidden px-12 py-6 flex flex-col items-center">
                <!-- Decorative lines -->
                <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                
                <div class="flex items-center gap-4 animate-bounce-slow">
                    <div class="w-12 h-12 rounded-xl bg-blue-500 border-2 border-white/20 shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center">
                         <i data-lucide="${skillIcon}" class="w-7 h-7 text-white"></i>
                    </div>
                    <h2 class="text-4xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(59,130,246,0.8)] uppercase">
                        ${skillName}
                    </h2>
                </div>
                
                <div class="text-[0.6rem] font-black text-blue-300 uppercase tracking-[1em] mt-2 translate-x-[0.5em] opacity-80 animate-pulse">
                    ACTIVATE
                </div>
            </div>
        `;

        container.appendChild(banner);
        this.refreshIcons();

        // Animate out
        setTimeout(() => {
            banner.style.transition = 'all 1s ease-in-out';
            banner.style.opacity = '0';
            banner.style.transform = 'translate(-50%, -100%) scale(1.1)';
            setTimeout(() => banner.remove(), 1000);
        }, 1500);
    },

    updateHeroUI(id) {
        const h = this.data.heroes.find(x => x.id === id);
        if (!h) return;
        const card = document.querySelector(`.hero-card-instance[data-id="${id}"]`);
        if (!card) return;

        const pImg = card.querySelector(`[id$="-img-bg"]`);
        if (pImg) {
            pImg.innerHTML = ''; pImg.style.backgroundImage = '';
            if (h.video) {
                pImg.innerHTML = `<video src="${h.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>`;
            } else {
                pImg.style.backgroundImage = `url('${h.img}')`;
            }
        }

        const hpBar = card.querySelector('.hero-hp-bar');
        const bloodBar = card.querySelector('.blood-bar');
        const manaBar = card.querySelector('.hero-mana-bar');
        const hpText = card.querySelector('.hero-hp-text');
        const mpText = card.querySelector('.hero-mana-text');

        const hpPct = (h.hp / h.maxHp) * 100;
        const mpPct = (h.mana / (h.maxMana || 1)) * 100;

        if (hpBar) hpBar.style.width = `${hpPct}%`;
        if (bloodBar) bloodBar.style.width = `${hpPct}%`;
        if (manaBar) manaBar.style.width = `${mpPct}%`;
        if (hpText) hpText.innerText = Math.floor(h.hp);
        if (mpText) mpText.innerText = Math.floor(h.mana);

        this.renderStatusIcons(h, card.querySelector('.status-container-left'), card.querySelector('.status-container-right'));

        // Visual cues for incapacitation (Status icons only, visual filter restricted to DEATH)
        // const isDisabled = h.statusEffects && h.statusEffects.some(s => ['stun', 'freeze', 'sleep', 'paralyze'].includes(s.id));
    },

    // Asset Preloading System - Loads only battle-relevant media
    async preloadBattleAssets() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        const loadingBar = document.getElementById('loading-bar-fill');

        if (loadingOverlay) loadingOverlay.classList.remove('hidden');

        const assetsToLoad = [];
        const totalAssets = [];

        // Collect all assets from heroes
        this.data.heroes.forEach(h => {
            if (h.video) totalAssets.push({ type: 'video', src: h.video, entity: h.name });
            if (h.img) totalAssets.push({ type: 'image', src: h.img, entity: h.name });
        });

        // Collect all assets from enemies
        this.data.enemies.forEach(e => {
            if (e.video) totalAssets.push({ type: 'video', src: e.video, entity: e.name });
            if (e.img) totalAssets.push({ type: 'image', src: e.img, entity: e.name });
        });

        // Collect skill icons
        const allSkills = [...new Set([
            ...this.data.heroes.flatMap(h => h.skills || []),
            ...this.data.enemies.flatMap(e => e.skills || [])
        ])];

        allSkills.forEach(skillId => {
            const skill = this.data.skills[skillId];
            if (skill?.img) totalAssets.push({ type: 'image', src: skill.img, entity: `Skill: ${skill.name}` });
        });

        const total = totalAssets.length;
        let loaded = 0;

        const updateProgress = () => {
            loaded++;
            const pct = Math.floor((loaded / total) * 100);
            if (loadingText) loadingText.textContent = `Loading Assets... ${pct}%`;
            if (loadingBar) loadingBar.style.width = `${pct}%`;
        };

        // Preload function
        const preloadAsset = (asset) => {
            return new Promise((resolve) => {
                if (asset.type === 'video') {
                    const vid = document.createElement('video');
                    vid.preload = 'auto';
                    vid.src = asset.src;
                    vid.onloadeddata = () => { updateProgress(); resolve(); };
                    vid.onerror = () => { console.warn(`Failed to load video: ${asset.src}`); updateProgress(); resolve(); };
                } else if (asset.type === 'image') {
                    const img = new Image();
                    img.src = asset.src;
                    img.onload = () => { updateProgress(); resolve(); };
                    img.onerror = () => { console.warn(`Failed to load image: ${asset.src}`); updateProgress(); resolve(); };
                }
            });
        };

        // Load all assets in parallel
        await Promise.all(totalAssets.map(asset => preloadAsset(asset)));

        this.log('All battle assets preloaded successfully!');

        // Hide loading overlay
        if (loadingOverlay) {
            setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
        }
    },

    // Renamed from startCombat
    async beginCombatSequence() {
        /* Original startCombat logic goes here */
        if (!this.data) return;
        if (this.state.isActive) return;
        const m = document.getElementById('combat-modal');
        // (UI Reveal logic is already handled by OpenSetup, we just need to init game loop)

        this.state.isActive = true; this.state.turnCount = 0;

        // PRELOAD ALL ASSETS FIRST
        await this.preloadBattleAssets();

        // Audio
        if (this.audio.battleBegin) this.audio.battleBegin.play().catch(() => { });
        this.audio.bass.currentTime = 0; this.audio.bass.play().catch(() => { });

        // Intro Text
        const i = document.getElementById('battle-intro-overlay'); i.classList.remove('hidden');
        setTimeout(() => {
            i.classList.add('hidden');
            if (this.audio.battle) { this.audio.battle.currentTime = 0; this.audio.battle.volume = 0.5; this.audio.battle.play().catch(() => { }); }
            this.log("Battle Started!");
            this.determineTurnOrder();
            this.determineIntents(); // Calculate initial enemy intents
            this.stepTurn();
        }, 3000);

        // Render Active Combat UI
        // this.resetData(); // Removed, we just set data
        this.renderEnemies();
        this.state.enemyVisualOrder = this.data.enemies.map(e => e.id);
        // this.updateEnemyPositions(); // Disabled
        this.updatePlayerUI(); this.renderSkillList(); this.refreshIcons();
    },

    // Entry point for external calls (e.g. from UI button)
    startCombat() {
        this.init();
        this.openSetup();
    },

    calculateStats(entity) {
        // Delegate to SkillEngine for buff-aware stat calculation
        if (window.SkillEngine) {
            SkillEngine.recalculateStats(entity);
        } else {
            console.error('[COMBAT] SkillEngine not loaded!');
        }
    },

    scaleStatsForLevel(entity, targetLevel) {
        const baseLevel = entity.baseLevel || entity.level || 1;
        const levelDiff = targetLevel - baseLevel;

        // Stat scaling formula: +2% per level
        const statScale = 1 + (levelDiff * 0.02);

        // Scale primary stats
        if (entity.stats) {
            ['str', 'dex', 'int', 'vit', 'agi', 'luk'].forEach(stat => {
                if (entity.stats[stat]) {
                    entity.stats[stat] = Math.floor(entity.stats[stat] * statScale);
                }
            });

            // Scale combat stats (derived from primary stats)
            if (entity.stats.atk) entity.stats.atk = Math.floor(entity.stats.atk * statScale);
            if (entity.stats.def) entity.stats.def = Math.floor(entity.stats.def * statScale);
            if (entity.stats.matk) entity.stats.matk = Math.floor(entity.stats.matk * statScale);
            if (entity.stats.mdef) entity.stats.mdef = Math.floor(entity.stats.mdef * statScale);
        }

        // Scale HP/MP (5% per level for HP/MP pool)
        const hpMpScale = 1 + (levelDiff * 0.05);
        entity.maxHp = Math.floor((entity.maxHp || 500) * hpMpScale);
        entity.hp = entity.maxHp;
        entity.maxMana = Math.floor((entity.maxMana || 100) * hpMpScale);
        entity.mana = entity.maxMana;

        // Update entity level
        entity.level = targetLevel;

        console.log(`[LEVEL SCALING] ${entity.name} scaled to Lv${targetLevel} (base: ${baseLevel}, diff: ${levelDiff}, scale: ${statScale.toFixed(2)}x)`, entity);
        return entity;
    },




    determineTurnOrder() {
        let f = [...this.data.heroes.filter(h => h.hp > 0), ...this.data.enemies.filter(e => e.hp > 0)];
        if (f.length === 0) {
            this.state.entities = [];
            return;
        }

        f.sort((a, b) => {
            const spdA = (a.stats && a.stats.aspd !== undefined) ? a.stats.aspd : 0;
            const spdB = (b.stats && b.stats.aspd !== undefined) ? b.stats.aspd : 0;
            // Removed verbose log
            return spdB - spdA; // Higher ASPD goes first
        });

        this.state.entities = f.map(x => x.id);
        this.debug('TURN_ORDER', 'Final order determined', { order: f.map(x => `${x.name} (${x.stats?.aspd || 0})`) });
    },

    endCombat(victory) {
        console.log('[VICTORY/DEFEAT DEBUG] endCombat called with victory =', victory);
        this.state.isActive = false;

        // Remove UI clutter
        document.getElementById('action-bar')?.classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('turn-banner')?.classList.add('hidden');

        // Hide existing victory/defeat overlays first
        const existingVictory = document.getElementById('victory-overlay');
        const existingDefeat = document.getElementById('defeat-overlay');

        if (victory) {
            console.log('[VICTORY/DEFEAT DEBUG] Showing VICTORY overlay');
            this.log('VICTORY! All enemies defeated.');

            if (existingDefeat) existingDefeat.classList.add('hidden', 'opacity-0');
            if (existingVictory) {
                existingVictory.classList.remove('hidden');
                setTimeout(() => existingVictory.classList.remove('opacity-0'), 100);
            }
            if (this.audioManager) this.audioManager.play('victory');
        } else {
            console.log('[VICTORY/DEFEAT DEBUG] Showing DEFEAT overlay');
            this.log('DEFEAT! The party has fallen.');

            if (existingVictory) existingVictory.classList.add('hidden', 'opacity-0');
            if (existingDefeat) {
                existingDefeat.classList.remove('hidden');
                setTimeout(() => existingDefeat.classList.remove('opacity-0'), 100);
            }
            if (this.audioManager) this.audioManager.play('death');
        }
    },

    stepTurn() {
        if (!this.state.isActive) return;

        console.log('[VICTORY/DEFEAT DEBUG] ========== stepTurn CALLED ==========');

        // Check victory/defeat BEFORE advancing turn
        const aliveHeroes = this.data.heroes.filter(h => h.hp > 0);
        const aliveEnemies = this.data.enemies.filter(e => e.hp > 0);

        console.log('[VICTORY/DEFEAT DEBUG] Alive heroes:', aliveHeroes.length, '/', this.data.heroes.length);
        console.log('[VICTORY/DEFEAT DEBUG] Alive enemies:', aliveEnemies.length, '/', this.data.enemies.length);

        if (aliveEnemies.length === 0) {
            console.log('[VICTORY/DEFEAT DEBUG] ✅ ALL ENEMIES DEAD - VICTORY!');
            this.endCombat(true);
            return;
        }

        if (aliveHeroes.length === 0) {
            console.log('[VICTORY/DEFEAT DEBUG] ❌ ALL HEROES DEAD - DEFEAT!');
            this.endCombat(false);
            return;
        }

        console.log('[VICTORY/DEFEAT DEBUG] Battle continues...');

        // Reset UI for next turn
        this.state.phase = 'idle';
        this.state.selectedActionType = null;
        this.state.selectedSkill = null;
        this.state.actionTargets = [];
        this.updateTargetUI();

        let id = null;
        let entity = null;
        let found = false;
        let attempts = 0;
        const maxLoops = Math.max(10, this.state.entities.length * 2);

        // Iterative search for next living unit
        while (!found && attempts < maxLoops) {
            id = this.state.entities[this.state.turnCount % this.state.entities.length];
            entity = this.data.heroes.find(h => h.id === id) || this.data.enemies.find(e => e.id === id);
            if (entity && entity.hp > 0) {
                found = true;
            } else {
                this.state.turnCount++;
            }
            attempts++;
        }

        if (!found || !entity) {
            console.error("CRITICAL: No valid entity found to act. Stopping turn.", this.state.entities);
            return;
        }

        console.log(`[TURN] Turn ${this.state.turnCount}: ${entity.name} (${entity.stats?.aspd || 0} ASPD) acting`);

        this.state.activeEntityId = id;
        this.state.turnCount++; // Increment AFTER using

        if (!entity.isPlayer) {
            // Removed duplicate toast notification - turn banner is enough
            this.bringEnemyToFront(id);
        } else {
            // Removed duplicate toast notification - turn banner is enough
        }

        // Process status effects at turn start (for stun/freeze/etc, but NOT duration ticks)
        const skipTurn = this.processStatusEffects(entity, 'turn_start');
        if (skipTurn) {
            this.log(`${entity.name} is incapacitated and skips their turn!`);
            if (!this.skipUI()) {
                this.showToastNotification(`${entity.name} SKIPPED TURN`);
                setTimeout(() => this.stepTurn(), 1500);
            } else {
                this.stepTurn();
            }
            return;
        }

        // Process buff/debuff durations at turn start (moved from turn_end to ensure they're active during the turn)
        // Actually, we need to process them at turn_end to ensure full turn duration
        // But we still need to recalculate stats at turn_start if buffs changed
        // Don't recalculate stats for dead entities (prevents them from reviving)
        if ((entity.activeBuffs || entity.activeDebuffs) && entity.hp > 0) {
            SkillEngine.recalculateStats(entity);
        }

        if (!this.skipUI()) {
            // Update enemy intents at turn start
            this.determineIntents();
            this.renderEnemyIntents();

            // Only show enemy target markers when it's an enemy's turn
            if (!entity.isPlayer) {
                this.renderEnemyTargetMarkers();
            } else {
                // Clear enemy target markers when it's player's turn
                document.querySelectorAll('.enemy-target-marker').forEach(el => el.remove());
            }

            if (entity.isPlayer) {
                this.updateHeroUI(entity.id);
                this.renderSkillList();
            }

            this.updateTimelineUI();
            this.updateTurnIndicator(entity);
        } else {
            // In Quick Combat, we only need to determine intents for logic, but not render
            this.determineIntents();
        }
        entity.isPlayer ? this.startPlayerTurn() : this.startEnemyTurn(entity);
    },

    updateTurnIndicator(e, promptOverride = null) {
        const el = document.getElementById('turn-indicator');
        const ab = document.getElementById('action-bar');

        if (promptOverride) {
            this.showTurnBanner(promptOverride, e.isPlayer);
        } else if (this.state.phase === 'idle') {
            this.showTurnBanner(e.isPlayer ? `YOUR TURN` : `TURN: ${e.name.toUpperCase()}`, e.isPlayer);
        }

        // Display "CURRENT" label on active card
        document.querySelectorAll('.active-indicator').forEach(el => el.classList.add('opacity-0', 'scale-75'));
        const activeCard = document.querySelector(`[data-id="${e.id}"]`);
        if (activeCard) {
            const ind = activeCard.querySelector('.active-indicator');
            if (ind) ind.classList.remove('opacity-0', 'scale-75');
        }

        // Reset all entity rings and lift
        document.querySelectorAll('.hero-card-instance, .enemy-card-instance').forEach(c => {
            const b = c.querySelector('.hero-card-border, .enemy-card-border');
            if (b) {
                b.classList.remove('ring-4', 'ring-blue-500/60', 'ring-blue-400/50', 'ring-amber-500/50', 'shadow-[0_0_40px_rgba(59,130,246,0.4)]');
                b.classList.remove('ring-2');
            }
            c.style.setProperty('--ty', '0px');
            c.style.setProperty('--s', '1');
            c.classList.remove('z-50');
        });

        if (e.isPlayer) {
            if (this.state.phase === 'confirming' || this.state.phase === 'selecting_target') {
                el.innerHTML = '<i data-lucide="crosshair" class="w-4 h-4 text-amber-500"></i> <span class="group-[.player-turn]:text-blue-400">Select Target...</span>';
            } else {
                el.innerHTML = '<i data-lucide="sword" class="w-4 h-4 text-amber-500"></i> <span class="group-[.player-turn]:text-blue-400">YOUR TURN</span>';
            }
            el.classList.add('player-turn');
            if (this.state.phase === 'idle') {
                ab.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                ab.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
            if (this.state.phase !== 'confirming') {
                const cb = document.getElementById('confirm-bar');
                if (cb) {
                    cb.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                    cb.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
                }
            }

            // Highlight active hero with premium ring and lift
            const activeCard = document.querySelector(`.hero-card-instance[data-id="${e.id}"]`);
            if (activeCard) {
                const b = activeCard.querySelector('.hero-card-border');
                if (b) {
                    b.classList.add('ring-4', 'ring-blue-500/60', 'shadow-[0_0_40px_rgba(59,130,246,0.4)]');
                }
                activeCard.style.setProperty('--ty', '-40px');
                activeCard.style.setProperty('--s', '1.05');
                activeCard.classList.add('z-50');
            }

        } else {
            el.innerHTML = '<i data-lucide="skull" class="w-4 h-4 text-stone-400"></i> Enemy Turn';
            el.classList.remove('player-turn');
            ab.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            ab.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            const sm = document.getElementById('skills-menu');
            if (sm) sm.classList.add('hidden', 'opacity-0');
        }

        // Enemy Intent Logic: Update the existing slot on each card
        this.renderEnemyIntents();

        // Dynamic Header Theme
        const header = document.getElementById('combat-header');
        if (header) {
            if (e.isPlayer) {
                header.classList.remove('bg-red-900/20', 'border-red-500/20');
                header.classList.add('bg-blue-900/20', 'border-blue-500/20');
            } else {
                header.classList.remove('bg-blue-900/20', 'border-blue-500/20');
                header.classList.add('bg-red-900/20', 'border-red-500/20');
            }
        }

        this.refreshIcons();
    },

    showTurnBanner(text, isPlayer) {
        const b = document.getElementById('turn-banner');
        const t = document.getElementById('turn-banner-text');
        if (!t || !b) return;

        t.innerText = text;
        t.className = isPlayer ?
            "text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 font-serif tracking-widest uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" :
            "text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-800 via-red-500 to-red-800 font-serif tracking-widest uppercase drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]";

        // SPECIAL: Black banner for prompts
        if (text.startsWith("SELECT ")) {
            t.className = "text-4xl md:text-6xl font-black text-white font-serif tracking-widest uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,1)]";
        }

        b.classList.remove('opacity-0', 'scale-150');
        b.classList.add('opacity-100', 'scale-100');

        if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
            b.classList.remove('opacity-100', 'scale-100');
            b.classList.add('opacity-0', 'scale-150');
        }, 1200);
    },

    startPlayerTurn() {
        if (!this.skipUI()) {
            // Ensure enemy target markers are cleared when player's turn starts
            document.querySelectorAll('.enemy-target-marker').forEach(el => el.remove());
        }

        // AutoGame: Let AI control hero
        if (this.state.autoGameEnabled) {
            const hero = this.getActiveHero();
            if (hero) {
                if (this.skipUI()) {
                    this.performAutoHeroTurn(hero);
                } else {
                    setTimeout(() => this.performAutoHeroTurn(hero), 1000);
                }
            }
        }
    },

    getActiveHero() {
        return this.data.heroes.find(h => h.id === this.state.activeEntityId);
    },

    selectActionType(type) {
        // Block manual control during AutoGame
        if (this.state.autoGameEnabled) {
            this.showToastNotification('⚠️ AutoGame is ON - disable it to play manually!');
            return;
        }
        console.log('[DEFEND DEBUG] selectActionType called with type:', type);
        console.log('[DEFEND DEBUG] Current phase:', this.state.phase);

        if (this.state.phase !== 'idle' && this.state.phase !== 'confirming') {
            console.log('[DEFEND DEBUG] BLOCKED: Phase is not idle or confirming');
            return;
        }

        this.state.selectedActionType = type;
        this.state.targetMode = 'enemy';
        console.log('[DEFEND DEBUG] Set selectedActionType to:', type);

        const el = document.getElementById('turn-indicator');
        const hero = this.getActiveHero();
        console.log('[DEFEND DEBUG] Hero:', hero);
        if (!hero) return;

        if (type === 'attack') {
            el.innerHTML = '<i data-lucide="crosshair" class="w-4 h-4 text-amber-500"></i> Select Target...';
            this.updateTurnIndicator(hero, "SELECT TARGET");
            const sm = document.getElementById('skills-menu');
            if (sm) sm.classList.add('hidden', 'opacity-0');
        } else if (type === 'defend') {
            // Defend doesn't need target selection, go straight to confirming
            el.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4 text-blue-500"></i> Defensive Stance...';
            this.updateTurnIndicator(hero, "DEFENSIVE STANCE");
            const sm = document.getElementById('skills-menu');
            if (sm) sm.classList.add('hidden', 'opacity-0');
        }

        this.refreshIcons();

        const ab = document.getElementById('action-bar');
        const cb = document.getElementById('confirm-bar');

        // Customize confirm button based on action type
        const confirmBtn = cb?.querySelector('button[onclick*="confirmAction"]');
        const confirmIcon = document.getElementById('confirm-btn-icon');
        const confirmText = document.getElementById('confirm-btn-text');

        if (type === 'defend' && confirmBtn) {
            // Blue theme for defend 🔵
            confirmBtn.className = 'flex items-center gap-4 px-12 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-t border-white/20 shadow-[0_0_40px_rgba(59,130,246,0.4)] group transition-all transform active:scale-95';
            if (confirmIcon) confirmIcon.setAttribute('data-lucide', 'shield-check');
            if (confirmText) confirmText.textContent = 'DEFEND';
        } else if (type === 'attack' && confirmBtn) {
            // Red theme for attack 🔴
            confirmBtn.className = 'flex items-center gap-4 px-12 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border-t border-white/20 shadow-[0_0_40px_rgba(220,38,38,0.4)] group transition-all transform active:scale-95';
            if (confirmIcon) confirmIcon.setAttribute('data-lucide', 'check-circle');
            if (confirmText) confirmText.textContent = 'CONFIRM';
        } else if (type === 'skill' && confirmBtn) {
            // Purple theme for skills 🟣
            confirmBtn.className = 'flex items-center gap-4 px-12 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border-t border-white/20 shadow-[0_0_40px_rgba(168,85,247,0.4)] group transition-all transform active:scale-95';
            if (confirmIcon) confirmIcon.setAttribute('data-lucide', 'sparkles');
            if (confirmText) confirmText.textContent = 'CAST';
        }

        if (ab) {
            ab.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            ab.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }
        if (cb) {
            cb.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            cb.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }

        this.state.phase = type === 'attack' ? 'selecting_target' : (type === 'defend' ? 'confirming' : 'idle');
        if (type === 'attack') {
            const t = this.data.enemies.find(e => e.hp > 0);
            if (t) this.selectEnemyTarget(t.id);
        }

        // Refresh icons after changing data-lucide attributes
        this.refreshIcons();
    },

    toggleSkillMenu() {
        this.removeAttention();
        const hero = this.getActiveHero();
        if (!hero) return;

        // Close item menu if open
        const im = document.getElementById('items-menu');
        if (im && !im.classList.contains('hidden')) {
            im.classList.add('hidden', 'opacity-0');
            this.bindItemMenuHotkeys(false);
        }

        const m = document.getElementById('skills-menu');
        if (m) {
            const wasOpen = !m.classList.contains('hidden');
            m.classList.toggle('hidden'); m.classList.toggle('opacity-0');
            const mpDisp = document.getElementById('skill-menu-mp');
            if (mpDisp) mpDisp.innerText = hero.mana;

            // If closing menu and was in revive mode, restore enemy opacity
            if (wasOpen && this.state.selectedSkill?.type === 'revive') {
                this.closeReviveSelectionModal();
                this.restoreEnemyCardsOpacity();
            }

            // Auto-preview first skill when opening
            const isOpening = !m.classList.contains('hidden');
            if (isOpening) {
                this.state.skillPreviewId = this.state.skillPreviewId || (hero.skills[0]?.id ?? null);
                if (this.state.skillPreviewId) this.previewSkill(this.state.skillPreviewId);
                this.bindSkillMenuHotkeys(true);
            } else {
                this.bindSkillMenuHotkeys(false);
            }
        }
    },

    toggleItemMenu() {
        this.removeAttention();
        const hero = this.getActiveHero();
        if (!hero) return;

        // Close skill menu if open
        const sm = document.getElementById('skills-menu');
        if (sm && !sm.classList.contains('hidden')) {
            sm.classList.add('hidden', 'opacity-0');
            this.bindSkillMenuHotkeys(false);
        }

        const m = document.getElementById('items-menu');
        if (m) {
            const isOpening = m.classList.contains('hidden');
            m.classList.toggle('hidden'); m.classList.toggle('opacity-0');

            if (isOpening) {
                this.renderItemList();
                this.bindItemMenuHotkeys(true);
            } else {
                this.bindItemMenuHotkeys(false);
            }
        }
    },

    renderItemList() {
        const hero = this.getActiveHero();
        const container = document.getElementById('item-list-container');
        const countDisp = document.getElementById('item-menu-count');
        if (!hero || !container) return;

        const inventory = this.data.partyInventory || {};
        const itemKeys = Object.keys(inventory).filter(k => inventory[k] > 0);

        countDisp.innerText = `${itemKeys.length} Items`;

        if (itemKeys.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-stone-600 italic text-sm">Bag is empty</div>`;
            document.getElementById('item-detail-empty').classList.remove('hidden');
            document.getElementById('item-detail-content').classList.add('hidden');
            document.getElementById('btn-use-item').disabled = true;
            return;
        }

        // Cards render directly - parent .combat-skill-list-inner handles 4-column grid
        container.innerHTML = itemKeys.map(key => {
            const data = this.data.items[key];
            if (!data) return '';
            const isActive = this.state.itemPreviewId === key;

            // Use PNG if available, otherwise lucide icon
            const iconHtml = data.png
                ? `<img src="${data.png}" class="item-card-png" alt="${data.name}">`
                : `<i data-lucide="${data.icon || 'package'}" class="w-6 h-6 text-emerald-400"></i>`;

            return `
                <div class="item-card ${isActive ? 'item-card-active' : ''}" 
                     data-ikey="${key}" 
                     onclick="combatSystem.previewItem('${key}')">
                    <!-- Icon Box (PNG or Lucide) -->
                    <div class="item-card-icon-box">
                        ${iconHtml}
                        <div class="item-card-qty-badge">×${inventory[key]}</div>
                    </div>
                    <div class="item-card-name">${data.name}</div>
                    <div class="item-card-type">${data.type}</div>
                </div>
            `;
        }).join('');

        // Auto-preview first item if none selected
        if (!this.state.itemPreviewId || !inventory[this.state.itemPreviewId]) {
            this.previewItem(itemKeys[0]);
        } else {
            this.previewItem(this.state.itemPreviewId);
        }

        this.refreshIcons();
    },

    previewItem(ikey) {
        const hero = this.getActiveHero();
        if (!hero) return;
        const inventory = this.data.partyInventory || {};
        const item = this.data.items[ikey];
        if (!item || !inventory[ikey]) return;

        this.state.itemPreviewId = ikey;

        // highlight in list - remove active from all, add to selected
        document.querySelectorAll('#item-list-container .item-card').forEach(el => el.classList.remove('item-card-active'));
        document.querySelector(`#item-list-container .item-card[data-ikey="${ikey}"]`)?.classList.add('item-card-active');

        // enable/disable use button
        const btn = document.getElementById('btn-use-item');
        if (btn) btn.disabled = false;

        this.renderItemDetails(item, inventory[ikey]);
    },

    renderItemDetails(item, qty) {
        const empty = document.getElementById('item-detail-empty');
        const content = document.getElementById('item-detail-content');
        if (!content) return;
        if (empty) empty.classList.add('hidden');
        content.classList.remove('hidden');

        const iconHtml = `<div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner"><i data-lucide="${item.icon || 'package'}" class="w-8 h-8 text-emerald-400"></i></div>`;

        const effects = [];
        if (item.healHp) effects.push({ icon: 'heart', title: 'HP Recovery', desc: `Restores ${item.healHp} HP points to the target.` });
        if (item.restoreMana) effects.push({ icon: 'zap', title: 'Mana Recovery', desc: `Restores ${item.restoreMana} Mana points to the target.` });
        if (item.cureStatus) effects.push({ icon: 'shield-check', title: 'Cure Status', desc: `Removes ${item.cureStatus.join(', ')} from the target.` });
        if (item.cureAllStatuses) effects.push({ icon: 'sparkles', title: 'Full Recovery', desc: `Removes all negative status effects from the target.` });
        if (item.applyStatus) effects.push({ icon: 'skull', title: 'Apply Status', desc: `Has a ${Math.floor(item.applyStatus.chance * 100)}% chance to apply ${item.applyStatus.id} for ${item.applyStatus.duration} turns.` });

        content.innerHTML = `
            <div class="flex items-start gap-4">
                ${iconHtml}
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="text-2xl font-black text-white leading-tight truncate">${item.name}</div>
                            <div class="text-sm text-stone-400 mt-1 leading-snug">${item.desc || 'No description available.'}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-emerald-400 font-black text-lg font-mono">x${qty}</div>
                            <div class="text-[0.6rem] text-stone-500 font-bold uppercase tracking-widest">In Stock</div>
                        </div>
                    </div>
                    <div class="mt-4 space-y-2">
                        ${effects.map(x => `
                            <div class="flex items-start gap-3 bg-white/5 border border-white/5 rounded-xl p-3">
                                <i data-lucide="${x.icon}" class="w-4 h-4 text-emerald-400 mt-0.5"></i>
                                <div class="flex-1">
                                    <div class="text-[0.7rem] font-black text-white">${x.title}</div>
                                    <div class="text-[0.7rem] text-stone-400 leading-snug">${x.desc}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.refreshIcons();
    },

    bindItemMenuHotkeys(enable) {
        const handler = (e) => {
            const m = document.getElementById('items-menu');
            if (!m || m.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleItemMenu();
                return;
            }

            const hero = this.getActiveHero();
            if (!hero) return;
            const inventory = this.data.partyInventory || {};
            const itemKeys = Object.keys(inventory).filter(k => inventory[k] > 0);
            const idx = itemKeys.indexOf(this.state.itemPreviewId);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = itemKeys[Math.min(itemKeys.length - 1, idx + 1)];
                if (next) this.previewItem(next);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = itemKeys[Math.max(0, idx - 1)];
                if (prev) this.previewItem(prev);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.castPreviewItem();
            }
        };

        if (enable) {
            this._itemMenuKeyHandler = handler;
            document.addEventListener('keydown', this._itemMenuKeyHandler);
        } else if (this._itemMenuKeyHandler) {
            document.removeEventListener('keydown', this._itemMenuKeyHandler);
            this._itemMenuKeyHandler = null;
        }
    },

    castPreviewItem() {
        const hero = this.getActiveHero();
        if (!hero) return;
        if (!this.state.itemPreviewId) return;
        const item = this.data.items[this.state.itemPreviewId];
        if (!item || !this.data.partyInventory[this.state.itemPreviewId]) return;

        // items default to ally target if healing/restoring, or enemy if applying status
        this.state.selectedActionType = 'item';
        this.state.selectedItem = { ...item, id: this.state.itemPreviewId };
        this.state.targetMode = item.target === 'enemy' ? 'enemy' : 'ally';

        // Single target for now
        this.state.phase = 'selecting_target';

        // Auto-select first target
        const targets = this.state.targetMode === 'ally'
            ? this.data.heroes.filter(h => h.hp > 0)
            : this.data.enemies.filter(e => e.hp > 0);

        if (targets.length > 0) {
            if (this.state.targetMode === 'ally') this.selectAllyTarget(targets[0].id);
            else this.selectEnemyTarget(targets[0].id);
        }

        this.updateTargetUI();
        this.updateTurnIndicator(hero);

        // Close menu
        const m = document.getElementById('items-menu');
        if (m && !m.classList.contains('hidden')) {
            m.classList.add('hidden', 'opacity-0');
            this.bindItemMenuHotkeys(false);
        }
    },

    async useItem(item, target, caster = null) {
        // Resolve caster if not provided
        if (!caster) {
            const activeId = this.state.activeEntityId;
            caster = this.data.heroes.find(h => h.id === activeId);
            if (!caster) {
                caster = this.data.enemies.find(e => e.id === activeId);
            }
        }

        if (!caster || !target) return;

        const itemId = item.id || this.state.itemPreviewId;

        // Consume item logic
        if (caster.isPlayer) {
            // Player uses Global Party Inventory
            if (this.data.partyInventory && this.data.partyInventory[itemId] > 0) {
                this.data.partyInventory[itemId]--;
            }
        } else {
            // Enemy uses their own inventory
            if (caster.inventory && caster.inventory[itemId] > 0) {
                caster.inventory[itemId]--;
            }
        }

        this.log(`${caster.name} used ${item.name} on ${target.name}.`);
        this.showToastNotification(`<i data-lucide="${item.icon || 'flask-conical'}" class="w-4 h-4 inline-block mr-1"></i> Using ${item.name}!`, true);

        // Play item sound/effect
        if (this.audioManager) {
            this.audioManager.play('skill_start', { skill: { icon: item.icon || 'flask-conical' }, hero: caster });
        }

        // Apply effects
        if (item.healHp) {
            this.healEntity(target, item.healHp);
        }
        if (item.restoreMana) {
            this.restoreMana(target, item.restoreMana);
        }
        if (item.cureStatus) {
            item.cureStatus.forEach(statusId => {
                this.removeStatusEffect(target, statusId);
            });
        }
        if (item.cureAllStatuses) {
            this.removeAllNegativeStatuses(target);
        }
        if (item.applyStatus) {
            if (Math.random() < item.applyStatus.chance) {
                SkillEngine.applyDebuff(target, { id: item.applyStatus.id, duration: item.applyStatus.duration }, caster, 'item_effect');
            }
        }

        // Finalize turn
        this.processStatusEffects(caster, 'turn_end');
        this.determineIntents();

        if (this.skipUI()) {
            this.stepTurn();
        } else {
            setTimeout(() => this.stepTurn(), 1000);
        }
    },

    restoreMana(entity, amount) {
        if (!entity || entity.hp <= 0) return;
        const oldMana = entity.mana;
        entity.mana = Math.min(entity.maxMana, entity.mana + amount);
        const actualGain = entity.mana - oldMana;

        if (entity.isPlayer) {
            this.updateHeroUI(entity.id);
        } else {
            this.updateEnemyBars(entity);
        }

        // Visual Floater
        const cardSelector = entity.isPlayer
            ? `.hero-card-instance[data-id="${entity.id}"]`
            : `.enemy-card-instance[data-id="${entity.id}"]`;
        const card = document.querySelector(cardSelector);
        if (card && actualGain > 0) {
            const root = card.querySelector('.floater-root') || card;
            this.spawnFloater(`+${actualGain} MP`, false, null, true, root, 'mana');
        }
    },

    removeStatusEffect(entity, statusId) {
        if (!entity || !entity.activeDebuffs) return;
        const index = entity.activeDebuffs.findIndex(d => d.id === statusId);
        if (index !== -1) {
            entity.activeDebuffs.splice(index, 1);
            SkillEngine.recalculateStats(entity);
            if (entity.isPlayer) this.updateHeroUI(entity.id);
            else this.updateEnemyBars(entity);
            this.log(`${entity.name} is no longer ${statusId}.`);
        }
    },

    removeAllNegativeStatuses(entity) {
        if (!entity || !entity.activeDebuffs) return;
        if (entity.activeDebuffs.length > 0) {
            entity.activeDebuffs = [];
            SkillEngine.recalculateStats(entity);
            if (entity.isPlayer) this.updateHeroUI(entity.id);
            else this.updateEnemyBars(entity);
            this.log(`${entity.name} recovered from all negative statuses.`);
        }
    },

    bindSkillMenuHotkeys(enable) {
        const handler = (e) => {
            const m = document.getElementById('skills-menu');
            if (!m || m.classList.contains('hidden')) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleSkillMenu();
                return;
            }

            const hero = this.getActiveHero();
            if (!hero) return;
            const ids = hero.skills.map(s => s.id);
            const idx = Math.max(0, ids.indexOf(this.state.skillPreviewId));

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = ids[Math.min(ids.length - 1, idx + 1)];
                if (next) this.previewSkill(next);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = ids[Math.max(0, idx - 1)];
                if (prev) this.previewSkill(prev);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.castPreviewSkill();
            }
        };

        if (enable) {
            this._skillMenuKeyHandler = handler;
            document.addEventListener('keydown', this._skillMenuKeyHandler);
        } else if (this._skillMenuKeyHandler) {
            document.removeEventListener('keydown', this._skillMenuKeyHandler);
            this._skillMenuKeyHandler = null;
        }
    },

    castPreviewSkill() {
        const hero = this.getActiveHero();
        if (!hero) return;
        if (!this.state.skillPreviewId) return;
        const s = hero.skills.find(x => x.id === this.state.skillPreviewId);
        if (!s) return;
        if (hero.mana < s.mana) { this.showToastNotification("NOT ENOUGH MANA"); return; }

        // For summon skills, check limits and go directly to confirm
        if (s.type === 'summon' && s.summonEntity) {
            // Check if this summon type was already used
            if (this.state.usedSummonTypes.includes(s.summonEntity)) {
                this.showToastNotification(`${s.name} can only be used once per battle!`);
                return;
            }

            // Check ally limit (max 3 total)
            const aliveAllies = this.data.heroes.filter(h => h.hp > 0);
            if (aliveAllies.length >= 3) {
                this.showToastNotification("Maximum 3 allies reached! Cannot summon more.");
                return;
            }

            // Auto-confirm summon (no target selection needed)
            this.state.selectedActionType = 'skill';
            this.state.selectedSkill = s;
            this.state.actionTargets = []; // Empty targets for summon
            this.state.phase = 'confirming';
            this.updateTargetUI();
            this.updateTurnIndicator(hero);

            // Close menu
            const m = document.getElementById('skills-menu');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden', 'opacity-0');
                this.bindSkillMenuHotkeys(false);
            }
            return;
        }

        // For revive skills, check limits and show graveyard selection
        if (s.type === 'revive') {
            // Check ally limit (max 3 total)
            const aliveAllies = this.data.heroes.filter(h => h.hp > 0);
            if (aliveAllies.length >= 3) {
                this.showToastNotification("Maximum 3 allies reached! Cannot revive more.");
                return;
            }

            // Check if there are dead allies to revive
            const deadAllies = this.data.heroes.filter(h => h.hp <= 0);
            if (deadAllies.length === 0) {
                this.showToastNotification("No fallen allies to revive!");
                return;
            }

            // Open revive selection modal
            this.state.selectedActionType = 'skill';
            this.state.selectedSkill = s;
            this.openReviveSelectionModal();

            // Close menu
            const m = document.getElementById('skills-menu');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden', 'opacity-0');
                this.bindSkillMenuHotkeys(false);
            }
            return;
        }

        // For AOE skills, automatically select all enemies and go to confirm
        if (s.type === 'aoe') {
            this.state.selectedActionType = 'skill';
            this.state.selectedSkill = s;
            this.state.targetMode = 'enemy';
            this.state.actionTargets = this.data.enemies.filter(e => e.hp > 0).map(e => e.id);
            this.state.phase = 'confirming';
            this.updateTargetUI();
            this.updateTurnIndicator(hero);

            // Close menu
            const m = document.getElementById('skills-menu');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden', 'opacity-0');
                this.bindSkillMenuHotkeys(false);
            }
            return;
        }

        // For SELF skills, automatically select self and go to confirm (FIX FOR BUG)
        if (s.type === 'self' || s.type === 'aoe_heal') {
            this.state.selectedActionType = 'skill';
            this.state.selectedSkill = s;
            this.state.targetMode = 'ally';
            this.state.actionTargets = s.type === 'aoe_heal'
                ? this.data.heroes.filter(h => h.hp > 0).map(h => h.id)
                : [hero.id]; // Self-buff targets only self
            this.state.phase = 'confirming';
            this.updateTargetUI();
            this.updateTurnIndicator(hero);

            // Close menu
            const m = document.getElementById('skills-menu');
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden', 'opacity-0');
                this.bindSkillMenuHotkeys(false);
            }
            return;
        }

        // Use the existing selection flow (targeting + confirm bar) for non-AOE/non-Self
        this.selectSkill(s.id);

        // Close menu after selecting to focus on targeting/confirm
        const m = document.getElementById('skills-menu');
        if (m && !m.classList.contains('hidden')) {
            m.classList.add('hidden', 'opacity-0');
            this.bindSkillMenuHotkeys(false);
        }
    },

    previewSkill(sid) {
        const hero = this.getActiveHero();
        if (!hero) return;
        const s = hero.skills.find(x => x.id === sid);
        if (!s) return;

        this.state.skillPreviewId = sid;

        // highlight in list
        document.querySelectorAll('#skill-list-container .skill-row').forEach(el => el.classList.remove('active'));
        document.querySelector(`#skill-list-container .skill-row[data-sid="${sid}"]`)?.classList.add('active');

        // enable/disable cast button
        const btn = document.getElementById('btn-cast-skill');
        if (btn) btn.disabled = hero.mana < s.mana;

        this.renderSkillDetails(s, hero);
    },

    renderSkillDetails(skill, hero) {
        const empty = document.getElementById('skill-detail-empty');
        const content = document.getElementById('skill-detail-content');
        if (!content) return;
        if (empty) empty.classList.add('hidden');
        content.classList.remove('hidden');

        const iconHtml = skill.img
            ? `<img src="${skill.img}" class="w-16 h-16 rounded-2xl object-cover border border-white/10">`
            : `<div class="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center"><i data-lucide="${skill.icon || 'sparkles'}" class="w-8 h-8 text-blue-300"></i></div>`;

        const tags = [];
        if (skill.type === 'aoe') tags.push('<span class="skill-chip aoe">AOE</span>');
        if (skill.type === 'aoe_heal') tags.push('<span class="skill-chip heal">AOE HEAL</span>');
        if (skill.type === 'self') tags.push('<span class="skill-chip self">SELF</span>');
        if (skill.type === 'pierce') tags.push('<span class="skill-chip pierce">PIERCE</span>');
        if (skill.type === 'summon') tags.push('<span class="skill-chip" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; font-weight: bold;">SUMMON</span>');
        if (skill.damageType === 'magic') tags.push('<span class="skill-chip magic">MAGIC</span>');
        if (skill.heal || skill.healPct) tags.push('<span class="skill-chip heal">HEAL</span>');

        const est = this.getSkillEstimates(skill, hero);
        const estHtml = est.length ? `<div class="mt-4 space-y-2">${est.map(x => `<div class="flex items-center justify-between text-[0.75rem]"><span class="text-stone-400 font-bold uppercase tracking-widest">${x.label}</span><span class="text-white font-black">${x.value}</span></div>`).join('')}</div>` : '';

        const fx = this.describeSkillEffects(skill);
        const fxHtml = fx.length
            ? `<div class="mt-5">
                   <div class="text-[0.6rem] font-black uppercase tracking-[0.35em] text-stone-500 mb-2">Effects</div>
                   <div class="space-y-2">${fx.map(x => `<div class="flex items-start gap-3 bg-white/5 border border-white/5 rounded-xl p-3"><i data-lucide="${x.icon}" class="w-4 h-4 text-stone-200 mt-0.5"></i><div class="flex-1"><div class="text-[0.7rem] font-black text-white">${x.title}</div><div class="text-[0.7rem] text-stone-400 leading-snug">${x.desc}</div></div></div>`).join('')}</div>
               </div>`
            : '';

        content.innerHTML = `
            <div class="flex items-start gap-4">
                ${iconHtml}
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="text-2xl font-black text-white leading-tight truncate">${skill.name}</div>
                            <div class="text-sm text-stone-400 mt-1 leading-snug">${skill.desc || 'No description available.'}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-blue-300 font-black text-lg font-mono">${skill.mana} MP</div>
                            <div class="text-[0.6rem] text-stone-500 font-bold uppercase tracking-widest">${hero.mana} available</div>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2 flex-wrap">${tags.join('')}</div>
                    ${estHtml}
                </div>
            </div>
            ${fxHtml}
        `;

        this.refreshIcons();
    },

    // Correctly cleaned up
    getSkillEstimates(skill, hero) {
        const out = [];

        // Healing estimates
        if (skill.healPct) {
            out.push({ label: 'Heal', value: `~${Math.floor(hero.maxHp * Number(skill.healPct))} HP` });
        } else if (skill.heal !== undefined) {
            out.push({ label: 'Heal', value: `~${Math.floor(Number(skill.heal))} HP` });
        }

        if (skill.manaRestorePct) {
            out.push({ label: 'Mana Restore', value: `~${Math.floor(hero.maxMana * Number(skill.manaRestorePct))} MP` });
        } else if (skill.manaRestore !== undefined) {
            out.push({ label: 'Mana Restore', value: `~${Math.floor(Number(skill.manaRestore))} MP` });
        }

        // Damage estimates
        const hasDamage = (skill.dmgMult || 0) > 0 && (skill.type === 'single' || skill.type === 'aoe' || skill.type === 'pierce');
        if (hasDamage) {
            const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
            const baseStat = (dmgType === 'magic') ? (hero.stats.matk || hero.stats.atk) : hero.stats.atk;
            const hits = skill.hits || 1;
            const mult = Number(skill.dmgMult || 1);
            const min = Math.floor(baseStat * mult * 0.9);
            const max = Math.floor(baseStat * mult * 1.1);
            const totalMin = min * hits;
            const totalMax = max * hits;

            if (hits > 1) {
                out.push({ label: 'Damage (per hit)', value: `${min}–${max}` });
                out.push({ label: 'Damage (total)', value: `${totalMin}–${totalMax}` });
            } else {
                out.push({ label: 'Damage', value: `${min}–${max}` });
            }
        }

        if (skill.critBonus) out.push({ label: 'Crit Bonus', value: `+${Math.floor(Number(skill.critBonus) * 100)}%` });
        if (skill.defenseIgnore) out.push({ label: 'Defense Ignore', value: `+${Math.floor(Number(skill.defenseIgnore) * 100)}%` });

        return out;
    },

    describeSkillEffects(skill) {
        const fx = [];

        const pushStatus = (eff) => {
            if (!eff || !eff.id) return;
            const map = {
                burn: { icon: 'flame', name: 'Burn' },
                poison: { icon: 'skull', name: 'Poison' },
                bleed: { icon: 'droplet', name: 'Bleed' },
                stun: { icon: 'lock', name: 'Stun' },
                freeze: { icon: 'snowflake', name: 'Freeze' },
                paralyze: { icon: 'zap', name: 'Paralyze' },
                slow: { icon: 'footprints', name: 'Slow' },
                taunt: { icon: 'speaker', name: 'Taunt' },
                parry: { icon: 'shield', name: 'Parry' },
                defend: { icon: 'shield-check', name: 'Defend' },
            };
            const meta = map[eff.id] || { icon: 'alert-triangle', name: eff.id };
            const chanceTxt = eff.chance !== undefined ? `${Math.floor(Number(eff.chance) * 100)}%` : '100%';
            const durTxt = eff.duration !== undefined ? `${eff.duration} turn(s)` : '—';
            fx.push({
                icon: meta.icon,
                title: `${meta.name}`,
                desc: `Chance: ${chanceTxt} • Duration: ${durTxt}`
            });
        };

        if (skill.effect) pushStatus(skill.effect);
        if (Array.isArray(skill.effects)) skill.effects.forEach(pushStatus);

        const pushBuffLike = (kind, data) => {
            if (!data) return;
            const parts = [];
            if (data.duration !== undefined) parts.push(`Duration: ${data.duration} turn(s)`);
            if (data.damageDealt) parts.push(`Damage dealt: x${Number(data.damageDealt).toFixed(2)}`);
            if (data.damageTaken) parts.push(`Damage taken: x${Number(data.damageTaken).toFixed(2)}`);
            if (data.parryChance) parts.push(`Parry chance: ${Math.floor(Number(data.parryChance) * 100)}%`);
            if (data.tauntChance) parts.push(`Taunt chance: ${Math.floor(Number(data.tauntChance) * 100)}%`);
            if (data.critBonus) parts.push(`Crit bonus: +${data.critBonus}`);
            if (data.aspd) parts.push(`ASPD: ${data.aspd > 0 ? '+' : ''}${data.aspd}`);
            if (data.hit) parts.push(`HIT: ${data.hit > 0 ? '+' : ''}${data.hit}`);
            if (data.flee) parts.push(`FLEE: ${data.flee > 0 ? '+' : ''}${data.flee}`);
            if (data.stats && typeof data.stats === 'object') {
                Object.entries(data.stats).forEach(([k, v]) => parts.push(`${k.toUpperCase()}: ${Number(v) > 0 ? '+' : ''}${v}`));
            }

            fx.push({
                icon: kind === 'buff' ? 'arrow-up-circle' : 'arrow-down-circle',
                title: kind === 'buff' ? 'Buff' : 'Debuff',
                desc: parts.length ? parts.join(' • ') : (kind === 'buff' ? 'Beneficial effect.' : 'Negative effect.')
            });
        };

        if (skill.buff) pushBuffLike('buff', skill.buff);
        if (skill.debuff) pushBuffLike('debuff', skill.debuff);

        return fx;
    },

    selectSkill(sid) {
        const hero = this.getActiveHero();
        if (!hero) return;
        const s = hero.skills.find(x => x.id === sid);
        if (hero.mana < s.mana) {
            this.showToastNotification(`<i data-lucide="alert-circle" class="w-4 h-4 inline-block mr-1"></i> NOT ENOUGH MANA (Need ${s.mana}, have ${hero.mana})`, false);
            // Pulse the MP bar
            const heroCard = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
            if (heroCard) {
                const mpBar = heroCard.querySelector('.hero-mana-bar');
                if (mpBar) {
                    mpBar.style.animation = 'pulse 0.5s ease-in-out 3';
                    setTimeout(() => mpBar.style.animation = '', 1500);
                }
            }
            return;
        }

        // Clear HP preview when changing skill
        document.querySelectorAll('.hp-preview-bar').forEach(el => el.remove());

        // If switching away from revive, restore enemy opacity
        if (this.state.selectedSkill?.type === 'revive' && s.id !== this.state.selectedSkill?.id) {
            this.closeReviveSelectionModal();
            this.restoreEnemyCardsOpacity();
        }

        this.state.selectedActionType = 'skill'; this.state.selectedSkill = s;
        this.state.targetMode = 'enemy';
        const sm = document.getElementById('skills-menu');
        if (sm) sm.classList.add('hidden', 'opacity-0');

        if (s.type === 'aoe') {
            this.state.actionTargets = this.data.enemies.filter(e => e.hp > 0).map(e => e.id);
            this.state.phase = 'confirming';
            this.updateTurnIndicator(hero);
        } else if (s.type === 'aoe_heal') {
            // Heal all living heroes
            this.state.actionTargets = this.data.heroes.filter(h => h.hp > 0).map(h => h.id);
            this.state.phase = 'confirming';
            this.updateTurnIndicator(hero);
            this.state.targetMode = 'ally';
        } else if (s.type === 'pierce') {
            // Pierce: Target first enemy, potentially hit second
            this.state.phase = 'selecting_target';
            this.updateTurnIndicator(hero, "SELECT TARGET");
            const t = this.data.enemies.find(e => e.hp > 0);
            if (t) this.selectEnemyTarget(t.id);
        } else if (s.type === 'single') {
            this.state.phase = 'selecting_target';
            this.updateTurnIndicator(hero, "SELECT TARGET");
            const t = this.data.enemies.find(e => e.hp > 0);
            if (t) this.selectEnemyTarget(t.id);
        } else if (s.type === 'self') {
            // Skills self são aplicadas automaticamente no próprio conjurador
            this.state.actionTargets = [hero.id];
            this.state.phase = 'confirming';
            this.state.targetMode = 'ally'; // Para UI, mas não permite mudança
            this.updateTurnIndicator(hero);
            this.updateTargetUI();
            this.updateHpPreview();
        } else {
            // Support skills (heal/buff) should be able to target allies in party.
            // Check if skill name is "Heal" or has support properties
            const isHeal = s.name && s.name.toLowerCase() === 'heal';
            const hasHeal = !!(s.heal || s.healPct);
            const isSupport = isHeal || hasHeal || !!(s.buff || s.manaRestore || s.manaRestorePct);

            // If it's a support skill (heal/buff), allow targeting allies
            if (isSupport) {
                this.state.targetMode = 'ally';
                this.state.phase = 'selecting_target';
                this.updateTurnIndicator(hero, "SELECT ALLY");
                // Auto-select self as default, but allow changing target
                this.state.actionTargets = [hero.id];
                this.updateTargetUI(); // Show green marker immediately
                this.updateHpPreview();
            } else {
                this.state.actionTargets = [hero.id];
                this.state.phase = 'confirming';
                this.updateTurnIndicator(hero);
                this.updateTargetUI();
                this.updateHpPreview();
            }
        }
    },

    selectAllyTarget(id) {
        if (!this.getActiveHero()) return;
        if (!this.state.selectedActionType) { this.highlightActionButtons(); this.showToastNotification("SELECT ACTION FIRST!"); return; }

        // Block ally selection for self skills - they must target the caster
        if (this.state.selectedSkill?.type === 'self') {
            const hero = this.getActiveHero();
            if (hero && id !== hero.id) {
                this.showToastNotification("This skill can only be used on yourself!");
                return;
            }
        }

        if (this.state.phase !== 'selecting_target' && this.state.phase !== 'confirming') return;
        this.state.targetMode = 'ally';
        this.state.actionTargets = [id];
        this.state.phase = 'confirming';
        this.updateTargetUI();
        this.updateHpPreview();
    },

    selectEnemyTarget(id) {
        // Block enemy selection if revive is active
        if (this.state.selectedSkill?.type === 'revive' &&
            (this.state.phase === 'confirming' || this.state.phase === 'selecting_target')) {
            this.showToastNotification("Cannot select enemies while revive is active!");
            return;
        }

        // Block enemy selection for self skills - they must target the caster
        if (this.state.selectedSkill?.type === 'self') {
            this.showToastNotification("This skill can only be used on yourself!");
            return;
        }

        if (!this.getActiveHero()) return;
        if (!this.state.selectedActionType) { this.highlightActionButtons(); this.showToastNotification("SELECT ACTION FIRST!"); return; }
        if (this.state.phase !== 'selecting_target' && this.state.phase !== 'confirming') return;
        if (this.state.selectedActionType === 'attack' || (this.state.selectedSkill && this.state.selectedSkill.type !== 'aoe')) {
            this.state.actionTargets = [id]; this.state.phase = 'confirming'; this.updateTargetUI();
        }
        // Do NOT call updateTurnIndicator here, as it re-triggers the banner. 
        // Just update the prompt text if needed.
        this.updateTargetUI();
        this.updateHpPreview();
    },

    highlightActionButtons() {
        const ba = document.getElementById('btn-attack');
        const bs = document.getElementById('btn-skill');
        if (ba) ba.querySelector('div').classList.add('attention-pulse');
        if (bs) bs.querySelector('div').classList.add('attention-pulse');
    },

    removeAttention() {
        const ba = document.getElementById('btn-attack');
        const bs = document.getElementById('btn-skill');
        if (ba) ba.querySelector('div').classList.remove('attention-pulse');
        if (bs) bs.querySelector('div').classList.remove('attention-pulse');
    },

    updateTargetUI() {
        const actionBar = document.getElementById('action-bar');
        const confirmBar = document.getElementById('confirm-bar');
        const confirmText = document.getElementById('confirm-btn-text');
        const chip = document.getElementById('active-target-chip');
        const targetNameDisp = document.getElementById('target-name-display');

        // Clear selections
        document.querySelectorAll('.enemy-card-instance').forEach(el => el.classList.remove('selected', 'ring-2', 'ring-red-500'));
        document.querySelectorAll('.hero-card-instance').forEach(el => el.classList.remove('selected', 'ring-2', 'ring-green-500'));

        // Update ally target overlays (enable/disable based on targetMode)
        // Disable for self skills - they can't target other allies
        const isSelfSkill = this.state.selectedSkill?.type === 'self';
        const isAllyMode = !isSelfSkill && this.state.targetMode === 'ally' &&
            (this.state.phase === 'selecting_target' || this.state.phase === 'confirming');
        document.querySelectorAll('.ally-target-overlay').forEach(overlay => {
            overlay.style.pointerEvents = isAllyMode ? 'auto' : 'none';
            overlay.style.cursor = isAllyMode ? 'pointer' : 'default';
        });

        // Show prompt overlay for revive mode
        const po = document.getElementById('prompt-overlay');
        if (this.state.selectedSkill?.type === 'revive' && this.state.phase === 'selecting_target') {
            if (po) {
                po.classList.add('active');
                po.innerHTML = `
                    <div class="text-center">
                        <i data-lucide="heart" class="w-8 h-8 text-green-400 mx-auto mb-2"></i>
                        <p class="text-stone-200 text-sm font-medium">Click on a fallen ally in the graveyard to revive</p>
                        <p class="text-stone-400 text-xs mt-1">Or press ESC to cancel</p>
                    </div>
                `;
                this.refreshIcons();
            }
        } else if (po) {
            po.classList.remove('active');
        }

        if (this.state.phase === 'confirming' || this.state.phase === 'selecting_target') {
            if (actionBar) {
                actionBar.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                actionBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
            // Show confirm bar only if target is selected (for revive) or for other skills
            if (confirmBar) {
                const isReviveWithTarget = this.state.selectedSkill?.type === 'revive' && this.state.actionTargets.length > 0;
                const isNotRevive = this.state.selectedSkill?.type !== 'revive';

                if (isReviveWithTarget || isNotRevive) {
                    // Show confirm bar if target is selected for revive OR if it's not a revive skill
                    confirmBar.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                    confirmBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
                } else {
                    // Hide confirm bar if revive but no target selected
                    confirmBar.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                    confirmBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
                }
            }
            if (chip) chip.classList.remove('hidden', 'opacity-0', 'translate-y-[-10px]');

            this.state.actionTargets.forEach(tid => {
                if (this.state.targetMode === 'ally') {
                    const heroCard = document.querySelector(`.hero-card-instance[data-id="${tid}"]`);
                    if (heroCard) {
                        heroCard.classList.add('selected', 'ring-2', 'ring-green-500');
                    }
                } else {
                    if (tid !== 'player') {
                        const enemyCard = document.querySelector(`.enemy-card-instance[data-id="${tid}"]`);
                        if (enemyCard) {
                            enemyCard.classList.add('selected', 'ring-2', 'ring-red-500');
                        }
                    }
                }
            });

            const actionName = this.state.selectedActionType === 'skill'
                ? (this.state.selectedSkill ? this.state.selectedSkill.name : 'Skill')
                : (this.state.selectedActionType === 'item' ? (this.state.selectedItem ? this.state.selectedItem.name : 'Item') : 'Attack');

            if (confirmText) confirmText.innerHTML = `CONFIRM ${actionName}`;

            // Update confirm button icon - use exact same as skill (image if available, else icon)
            const confirmIconContainer = document.getElementById('confirm-btn-icon');
            if (confirmIconContainer) {
                if (this.state.selectedActionType === 'skill' && this.state.selectedSkill) {
                    if (this.state.selectedSkill.img) {
                        // Use image - replace element
                        const parent = confirmIconContainer.parentElement;
                        const newIcon = document.createElement('img');
                        newIcon.id = 'confirm-btn-icon';
                        newIcon.src = this.state.selectedSkill.img;
                        newIcon.className = 'w-8 h-8 rounded-lg object-cover border border-white/20 shadow-lg';
                        parent.replaceChild(newIcon, confirmIconContainer);
                    } else {
                        // Use icon - ensure it's an <i> element
                        if (confirmIconContainer.tagName !== 'I') {
                            const parent = confirmIconContainer.parentElement;
                            const newIcon = document.createElement('i');
                            newIcon.id = 'confirm-btn-icon';
                            newIcon.className = 'w-8 h-8 text-white group-hover:scale-110 transition-transform';
                            parent.replaceChild(newIcon, confirmIconContainer);
                        }
                        const skillIcon = this.state.selectedSkill.icon || 'zap';
                        confirmIconContainer.setAttribute('data-lucide', skillIcon);
                        this.refreshIcons();
                    }
                } else if (this.state.selectedActionType === 'attack') {
                    if (confirmIconContainer.tagName !== 'I') {
                        const parent = confirmIconContainer.parentElement;
                        const newIcon = document.createElement('i');
                        newIcon.id = 'confirm-btn-icon';
                        newIcon.className = 'w-8 h-8 text-white group-hover:scale-110 transition-transform';
                        parent.replaceChild(newIcon, confirmIconContainer);
                    }
                    confirmIconContainer.setAttribute('data-lucide', 'sword');
                    this.refreshIcons();
                } else if (this.state.selectedActionType === 'item' && this.state.selectedItem) {
                    if (confirmIconContainer.tagName !== 'I') {
                        const parent = confirmIconContainer.parentElement;
                        const newIcon = document.createElement('i');
                        newIcon.id = 'confirm-btn-icon';
                        newIcon.className = 'w-8 h-8 text-white group-hover:scale-110 transition-transform';
                        parent.replaceChild(newIcon, confirmIconContainer);
                    }
                    confirmIconContainer.setAttribute('data-lucide', this.state.selectedItem.icon || 'flask-conical');
                    this.refreshIcons();
                } else {
                    if (confirmIconContainer.tagName !== 'I') {
                        const parent = confirmIconContainer.parentElement;
                        const newIcon = document.createElement('i');
                        newIcon.id = 'confirm-btn-icon';
                        newIcon.className = 'w-8 h-8 text-white group-hover:scale-110 transition-transform';
                        parent.replaceChild(newIcon, confirmIconContainer);
                    }
                    confirmIconContainer.setAttribute('data-lucide', 'check-circle');
                    this.refreshIcons();
                }
            }

            let targetStr = "Enemy";
            if (this.state.selectedSkill?.type === 'revive') {
                if (this.state.actionTargets.length > 0) {
                    const deadHero = this.data.heroes.find(h => h.id === this.state.actionTargets[0] && h.hp <= 0);
                    targetStr = deadHero ? `${deadHero.name} (Selected)` : "SELECT FROM GRAVEYARD";
                    // Re-render graveyard to ensure selected ally is marked
                    this.renderGraveyard();
                } else {
                    targetStr = "SELECT FROM GRAVEYARD";
                }
            } else if (this.state.selectedSkill?.type === 'aoe') targetStr = "ALL ENEMIES";
            else if (this.state.selectedSkill?.type === 'aoe_heal') targetStr = "ALL HEROES";
            else if (this.state.targetMode === 'ally') {
                const t = this.data.heroes.find(h => h.id === this.state.actionTargets[0]);
                targetStr = t ? t.name : "ALLY";
            } else if (this.state.selectedSkill?.type === 'self') targetStr = "SELF";
            else {
                const t = this.data.enemies.find(e => e.id === this.state.actionTargets[0]);
                if (t) targetStr = t.name;
            }
            if (targetNameDisp) targetNameDisp.innerText = targetStr;

            // Trigger visual targeting update - apply to ALL targets (AOE support)
            document.querySelectorAll('.target-reticle').forEach(el => el.remove());
            document.querySelectorAll('.target-locked, .target-locked-ally').forEach(el => {
                el.classList.remove('target-locked', 'target-locked-ally');
            });

            // Apply reticle and locked effect to all actionTargets
            // For revive, target is dead ally (not on battlefield), so skip visual reticle
            const isReviveSkill = this.state.selectedSkill?.type === 'revive';

            if (!isReviveSkill) {
                this.state.actionTargets.forEach(targetId => {
                    const targetCard = (this.state.targetMode === 'ally')
                        ? document.querySelector(`.hero-card-instance[data-id="${targetId}"]`)
                        : document.querySelector(`.enemy-card-instance[data-id="${targetId}"]`);

                    if (targetCard) {
                        // Ensure the reticle is appended to the card container
                        const reticle = document.createElement('div');
                        reticle.className = this.state.targetMode === 'ally' ? 'target-reticle ally' : 'target-reticle';
                        // Adjust reticle position: move up slightly to avoid HP bar
                        reticle.style.top = '40%';
                        reticle.style.height = '85%';
                        targetCard.appendChild(reticle);

                        // Add locked effect
                        targetCard.classList.add(this.state.targetMode === 'ally' ? 'target-locked-ally' : 'target-locked');
                    }
                });
            }

            // Highlight Source
            const activeHero = this.getActiveHero();
            if (activeHero) {
                const sourceCard = document.querySelector(`.hero-card-instance[data-id="${activeHero.id}"]`);
                if (sourceCard) sourceCard.classList.add('active-source');
            }

        } else {
            document.querySelectorAll('.target-reticle').forEach(el => el.remove());
            document.querySelectorAll('.target-locked').forEach(el => el.classList.remove('target-locked'));
            document.querySelectorAll('.target-locked-ally').forEach(el => el.classList.remove('target-locked-ally'));
            document.querySelectorAll('.active-source').forEach(el => el.classList.remove('active-source'));
            if (confirmBar) {
                confirmBar.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                confirmBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
            if (this.state.isActive && this.state.activeEntityId && this.data.heroes.some(h => h.id === this.state.activeEntityId) && this.state.phase === 'idle') {
                if (actionBar) {
                    actionBar.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                    actionBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
                }
            }
            if (chip) chip.classList.add('hidden', 'opacity-0', 'translate-y-[-10px]');
        }

        // Update HP preview when targeting
        this.updateHpPreview();
    },

    estimateSkillOutcome(attacker, target, action) {
        // Estimate HP delta without RNG (use average multiplier = 1.0)
        if (!attacker || !target || !action) return { deltaHpEstimate: 0 };

        // Healing (Skill or Item)
        if (action.healHp !== undefined || action.heal !== undefined || action.healPct !== undefined) {
            const healAmt = action.healHp !== undefined
                ? Number(action.healHp)
                : (action.heal !== undefined
                    ? Number(action.heal)
                    : Math.floor(target.maxHp * Number(action.healPct || 0)));
            return { deltaHpEstimate: healAmt };
        }

        const skill = action; // Support legacy naming in logic below
        // Damage (only if action/skill has dmgMult or is attack)
        if (skill.dmgMult !== undefined || this.state.selectedActionType === 'attack') {
            const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
            const baseStat = (dmgType === 'magic')
                ? (attacker.stats.matk || attacker.stats.atk)
                : attacker.stats.atk;

            // Use average multiplier (1.0 instead of 0.9-1.1), no crit for estimate
            const baseDmg = Math.floor(baseStat * (skill.dmgMult || 1.0) * 1.0);

            // Apply damage buffs
            let damage = baseDmg;
            if (attacker.buffedDamageDealt) {
                damage = Math.floor(damage * attacker.buffedDamageDealt);
            }

            // Level gap multiplier
            if (attacker.level && target.level) {
                const levelGap = attacker.level - target.level;
                if (levelGap > 0) {
                    const multiplier = Math.min(2.0, 1 + (levelGap * 0.02));
                    damage = Math.floor(damage * multiplier);
                }
            }

            // Defense mitigation (no crit, so always apply)
            const ignoreDef = skill.defenseIgnore || 0;
            if (dmgType === 'magic') {
                damage = Math.max(1, damage - (target.stats.mdef || 0) * (1 - ignoreDef));
            } else {
                const effectiveSoftDef = target.stats.softDef * (1 - ignoreDef);
                const effectiveHardDef = target.stats.hardDef * (1 - ignoreDef);
                damage = Math.max(1, Math.floor((damage - effectiveSoftDef) * (4000 / (4000 + effectiveHardDef))));
            }

            // Apply target damage taken modifier
            if (target.buffedDamageTaken) {
                damage = Math.floor(damage * target.buffedDamageTaken);
            }

            // For multi-hit skills, multiply by hits
            const hits = skill.hits || 1;
            return { deltaHpEstimate: -damage * hits };
        }

        return { deltaHpEstimate: 0 };
    },

    updateHpPreview() {
        // Clear all existing previews
        document.querySelectorAll('.hp-preview-bar').forEach(el => el.remove());

        // Only show preview when targeting/confirming with a skill or attack selected
        if (this.state.phase !== 'selecting_target' && this.state.phase !== 'confirming') return;
        if (!this.state.selectedActionType) return;

        const hero = this.getActiveHero();
        if (!hero) return;

        // Get action object (skill, attack, or item)
        const actionObj = this.state.selectedSkill ||
            (this.state.selectedActionType === 'attack' ? { dmgMult: 1.0 } :
                (this.state.selectedActionType === 'item' ? this.state.selectedItem : null));

        if (!actionObj) return;

        // Calculate preview for each target
        this.state.actionTargets.forEach(targetId => {
            const target = (this.state.targetMode === 'ally')
                ? this.data.heroes.find(h => h.id === targetId)
                : this.data.enemies.find(e => e.id === targetId);

            if (!target) return;

            const outcome = this.estimateSkillOutcome(hero, target, actionObj);
            if (outcome.deltaHpEstimate === 0) return;

            this.renderHpPreview(target, outcome.deltaHpEstimate);
        });
    },

    renderHpPreview(targetEntity, deltaHpEstimate) {
        const card = targetEntity.isPlayer
            ? document.querySelector(`.hero-card-instance[data-id="${targetEntity.id}"]`)
            : document.querySelector(`.enemy-card-instance[data-id="${targetEntity.id}"]`);

        if (!card) return;

        const hpBar = targetEntity.isPlayer
            ? card.querySelector('.hero-hp-bar')
            : card.querySelector('.enemy-hp-bar');

        if (!hpBar) return;

        // Calculate new HP after action
        const currentHp = targetEntity.hp;
        const newHp = Math.max(0, Math.min(targetEntity.maxHp, currentHp + deltaHpEstimate));
        const newHpPct = (newHp / targetEntity.maxHp) * 100;
        const currentHpPct = (currentHp / targetEntity.maxHp) * 100;

        // Create preview bar overlay
        const previewBar = document.createElement('div');
        previewBar.className = 'hp-preview-bar absolute inset-y-0 left-0 pointer-events-none z-20';
        previewBar.style.transition = 'width 0.3s ease';

        if (deltaHpEstimate > 0) {
            // Healing - green preview
            previewBar.style.background = 'linear-gradient(to right, rgba(34, 197, 94, 0.4), rgba(34, 197, 94, 0.2))';
            previewBar.style.width = `${newHpPct}%`;
            previewBar.style.left = `${currentHpPct}%`;
            previewBar.style.width = `${Math.max(0, newHpPct - currentHpPct)}%`;
        } else {
            // Damage - red preview
            previewBar.style.background = 'linear-gradient(to right, rgba(239, 68, 68, 0.5), rgba(239, 68, 68, 0.3))';
            previewBar.style.width = `${Math.max(0, currentHpPct - newHpPct)}%`;
            previewBar.style.left = `${newHpPct}%`;
        }

        // Insert after the HP bar
        const hpBarContainer = hpBar.parentElement;
        if (hpBarContainer) {
            hpBarContainer.style.position = 'relative';
            hpBarContainer.appendChild(previewBar);
        }
    },

    cancelAction() {
        const po = document.getElementById('prompt-overlay');
        if (po) po.classList.remove('active');

        // Reset revive mode
        if (this.state.selectedSkill?.type === 'revive') {
            this.closeReviveSelectionModal();
            this.state.selectedSkill = null;
            this.state.selectedActionType = null;
            this.state.actionTargets = [];
            this.state.targetMode = 'enemy';
            // Restore enemy opacity when cancelling revive
            this.restoreEnemyCardsOpacity();
        }

        this.state.phase = 'idle';
        this.state.selectedActionType = null;
        this.state.actionTargets = [];
        // Clear HP preview
        document.querySelectorAll('.hp-preview-bar').forEach(el => el.remove());
        this.updateTargetUI();
        const h = this.getActiveHero();
        if (h) this.updateTurnIndicator(h);
    },

    async confirmAction() {
        console.log('[DEFEND DEBUG] confirmAction called');
        console.log('[DEFEND DEBUG] Current phase:', this.state.phase);
        console.log('[DEFEND DEBUG] selectedActionType:', this.state.selectedActionType);

        if (this.state.phase !== 'confirming') {
            console.log('[DEFEND DEBUG] BLOCKED: Phase is not confirming');
            return;
        }

        // Actions that don't require targets: summon, revive, defend, self
        const isSummonSkill = this.state.selectedSkill && this.state.selectedSkill.type === 'summon';
        const isReviveSkill = this.state.selectedSkill && this.state.selectedSkill.type === 'revive';
        const isSelfSkill = this.state.selectedSkill && this.state.selectedSkill.type === 'self';
        const isDefendAction = this.state.selectedActionType === 'defend';

        console.log('[DEFEND DEBUG] isDefendAction:', isDefendAction);
        console.log('[DEFEND DEBUG] actionTargets:', this.state.actionTargets);

        // Validação para skills self - sempre usar o próprio herói como target
        if (isSelfSkill) {
            const hero = this.getActiveHero();
            if (!hero) {
                this.showToastNotification('Error: No active hero!', false);
                return;
            }
            // Forçar target para o próprio herói
            this.state.actionTargets = [hero.id];
            this.state.targetMode = 'ally';
        }

        // Skip target validation for summon, revive, defend, and self
        if (!isSummonSkill && !isReviveSkill && !isDefendAction && !isSelfSkill && this.state.actionTargets.length === 0) {
            console.log('[DEFEND DEBUG] BLOCKED: No targets and not a special action');
            return;
        }

        // Extra validation for revive: MUST be a hero (ally), never an enemy
        if (isReviveSkill && this.state.actionTargets.length > 0) {
            const targetId = this.state.actionTargets[0];
            const targetHero = this.data.heroes.find(h => h.id === targetId && h.hp <= 0);
            const targetEnemy = this.data.enemies.find(e => e.id === targetId);

            if (targetEnemy) {
                this.debug('REVIVE', `BLOCKED: Attempted to revive enemy ${targetEnemy.name}!`);
                this.showToastNotification("Cannot revive enemies! Select a fallen ally.");
                this.state.actionTargets = [];
                this.state.phase = 'idle';
                this.updateTargetUI();
                return;
            }

            if (!targetHero) {
                this.debug('REVIVE', `BLOCKED: Target ${targetId} not found or not dead!`);
                this.showToastNotification("Invalid target! Select a fallen ally.");
                this.state.actionTargets = [];
                this.state.phase = 'idle';
                this.updateTargetUI();
                return;
            }
        }

        // Check MP before confirming skill
        if (this.state.selectedActionType === 'skill' && this.state.selectedSkill) {
            const hero = this.getActiveHero();
            if (hero && hero.mana < this.state.selectedSkill.mana) {
                this.showToastNotification(`<i data-lucide="alert-circle" class="w-4 h-4 inline-block mr-1"></i> NOT ENOUGH MANA (Need ${this.state.selectedSkill.mana}, have ${hero.mana})`, false);
                // Pulse the MP bar
                const heroCard = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
                if (heroCard) {
                    const mpBar = heroCard.querySelector('.hero-mana-bar');
                    if (mpBar) {
                        mpBar.style.animation = 'pulse 0.5s ease-in-out 3';
                        setTimeout(() => mpBar.style.animation = '', 1500);
                    }
                }
                return;
            }

            // Validate that support skills (buffs/heals) can only target allies
            // BUT: Revive is special - it targets DEAD allies, so skip this validation for revive
            if (!isReviveSkill) {
                const isHeal = this.state.selectedSkill.name && this.state.selectedSkill.name.toLowerCase() === 'heal';
                const hasHeal = !!(this.state.selectedSkill.heal || this.state.selectedSkill.healPct);
                const isSupport = isHeal || hasHeal || !!(this.state.selectedSkill.buff || this.state.selectedSkill.manaRestore || this.state.selectedSkill.manaRestorePct);

                if (isSupport && this.state.targetMode === 'ally') {
                    // Verify all targets are actually heroes (allies)
                    const invalidTargets = this.state.actionTargets.filter(tid => {
                        const target = this.data.heroes.find(h => h.id === tid);
                        return !target || target.hp <= 0;
                    });

                    if (invalidTargets.length > 0) {
                        this.showToastNotification(`<i data-lucide="alert-circle" class="w-4 h-4 inline-block mr-1"></i> BUFFS CAN ONLY TARGET ALLIES!`, false);
                        return;
                    }
                }
            }
        }

        // Clear HP preview
        document.querySelectorAll('.hp-preview-bar').forEach(el => el.remove());

        const po = document.getElementById('prompt-overlay');
        if (po) po.classList.remove('active');
        const cb = document.getElementById('confirm-bar');
        if (cb) {
            cb.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            cb.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }
        this.state.phase = 'executing';
        console.log('[DEFEND DEBUG] Executing action:', this.state.selectedActionType);

        if (this.state.selectedActionType === 'attack') {
            console.log('[DEFEND DEBUG] Calling playerAttack');
            this.playerAttack();
        }
        else if (this.state.selectedActionType === 'defend') {
            console.log('[DEFEND DEBUG] Calling useDefend');
            this.useDefend(this.getActiveHero());
        }
        else if (this.state.selectedActionType === 'item' && this.state.selectedItem) {
            console.log('[DEFEND DEBUG] Calling useItem');
            const target = this.state.targetMode === 'ally'
                ? this.data.heroes.find(h => h.id === this.state.actionTargets[0])
                : this.data.enemies.find(e => e.id === this.state.actionTargets[0]);
            await this.useItem(this.state.selectedItem, target);
        }
        else if (this.state.selectedSkill) {
            console.log('[DEFEND DEBUG] Calling usePlayerSkill');
            await this.usePlayerSkill(this.state.selectedSkill);
        }
    },

    playerAttack() {
        const hero = this.getActiveHero();
        if (!hero) return;

        // Clear activeSkill to ensure normal attacks are neutral (no element)
        hero.activeSkill = null;

        const tid = this.state.actionTargets[0];
        const target = this.data.enemies.find(e => e.id === tid);
        if (!target || target.hp <= 0) { this.stepTurn(); return; }

        // Audio: Attack prepare
        if (this.audioManager) {
            this.audioManager.play('attack_prepare', { attacker: hero });
        }

        if (this.playEffect) this.playEffect('sword');
        let isCrit = Math.random() * 100 < hero.stats.crit;
        let dmg = Math.floor(hero.stats.atk * (0.9 + Math.random() * 0.2));
        this.damageEntity(target, dmg, isCrit, 'physical', hero);
        this.log(`${hero.name} attacked ${target.name}.`);
        this.showToastNotification(`<i data-lucide="sword" class="w-4 h-4 inline-block mr-1"></i> ${hero.name} attack!`, true);

        // --- End of turn status processing ---
        this.processStatusEffects(hero, 'turn_end');

        // Determine enemy intents for next round
        this.determineIntents();

        if (this.skipUI()) {
            this.stepTurn();
        } else {
            setTimeout(() => this.stepTurn(), 1000);
        }
    },

    async usePlayerSkill(skill) {
        const hero = this.getActiveHero();
        if (!hero) return;

        // Validação adicional para skills self - garantir que sempre usa o próprio herói
        if (skill.type === 'self') {
            const targetId = this.state.actionTargets[0];
            const isEnemy = this.data.enemies.find(e => e.id === targetId);
            if (isEnemy || targetId !== hero.id) {
                this.debug('SELF_SKILL', `Blocked: Attempted to use self skill on ${isEnemy ? 'enemy' : 'wrong target'}!`);
                this.showToastNotification("This skill can only be used on yourself!");
                // Forçar target correto
                this.state.actionTargets = [hero.id];
                this.state.targetMode = 'ally';
                return;
            }
        }

        // Track active skill for elemental calculations
        hero.activeSkill = skill;

        // Audio: Skill start
        if (this.audioManager) {
            this.audioManager.play('skill_start', { skill, hero });
        }

        // Audio: Skill voice (toca no início, quando o modal aparece)
        if (this.audioManager) {
            this.audioManager.play('skill_voice', { skill, hero });
        }

        // React particles to skill
        this.reactParticlesToSkill(skill);

        // Show Ultimate cut-in if applicable
        if (skill.ultimate === true) {
            await this.showUltimateCutIn(hero, skill);
        }

        hero.mana -= skill.mana;
        this.updateHeroUI(hero.id);
        this.log(`${hero.name} used ${skill.name} (Cost: ${skill.mana} MP).`);

        let iconHtml = '';
        if (skill.img) iconHtml = `<img src="${skill.img}" class="w-4 h-4 rounded-sm inline-block mr-1 object-cover">`;
        else if (skill.icon) iconHtml = `<i data-lucide="${skill.icon}" class="w-4 h-4 inline-block mr-1"></i>`;

        // Enhanced casting notification with larger icon
        const castingIconHtml = skill.img
            ? `<img src="${skill.img}" class="w-8 h-8 rounded-lg inline-block mr-2 object-cover border border-white/20 shadow-lg">`
            : `<i data-lucide="${skill.icon || 'sparkles'}" class="w-8 h-8 inline-block mr-2"></i>`;
        if (this.showToastNotification) this.showToastNotification(`${castingIconHtml} Casting ${skill.name}!`, true);

        // Handle summon skills (before normal skill processing)
        if (skill.type === 'summon' && skill.summonEntity) {
            this.handleSummonSkill(skill, hero);
            // End turn after summoning
            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                this.determineIntents();
                this.stepTurn();
            }, 1500);
            return;
        }

        // Handle Revive skill (before consuming mana, as it needs target selection)
        if (skill.type === 'revive') {
            // Target should already be selected from graveyard
            if (this.state.actionTargets.length === 0) {
                this.showToastNotification("No target selected for revive!");
                this.state.phase = 'idle';
                this.updateTargetUI();
                return;
            }

            // Validate target is a dead hero (ally), not an enemy
            const targetId = this.state.actionTargets[0];
            this.debug('REVIVE', `Validating revive target: ${targetId}`);
            this.debug('REVIVE', `Available heroes:`, this.data.heroes.map(h => ({ id: h.id, name: h.name, hp: h.hp })));
            this.debug('REVIVE', `Available enemies:`, this.data.enemies.map(e => ({ id: e.id, name: e.name, hp: e.hp })));

            // First check if it's in heroes array
            const targetHero = this.data.heroes.find(h => h.id === targetId && h.hp <= 0);
            if (!targetHero) {
                // Check if it's an enemy (wrong selection)
                const targetEnemy = this.data.enemies.find(e => e.id === targetId);
                if (targetEnemy) {
                    this.debug('REVIVE', `ERROR: Selected enemy ${targetEnemy.name} (ID: ${targetId}) instead of ally!`);
                    this.showToastNotification(`Cannot revive enemies! Select a fallen ally from the graveyard.`);
                } else {
                    this.debug('REVIVE', `ERROR: Target ${targetId} not found in heroes or enemies!`);
                    this.showToastNotification("Target not found or already alive!");
                }
                this.state.actionTargets = [];
                this.state.phase = 'idle';
                this.updateTargetUI();
                return;
            }

            this.debug('REVIVE', `Valid target found: ${targetHero.name} (ID: ${targetHero.id}, HP: ${targetHero.hp})`);

            hero.mana -= skill.mana;
            this.updateHeroUI(hero.id);
            this.log(`${hero.name} used ${skill.name} (Cost: ${skill.mana} MP).`);
            this.handleReviveSkill(skill, hero);
            // Restore enemy opacity after reviving
            this.restoreEnemyCardsOpacity();
            // End turn after reviving
            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                this.determineIntents();
                this.stepTurn();
            }, 1500);
            return;
        }

        // Handle Mana Drain skill
        if (skill.id === 'mana_drain' && skill.drainPercent !== undefined) {
            const target = this.data.enemies.find(e => e.id === this.state.actionTargets[0]);
            if (!target || target.hp <= 0) {
                this.stepTurn();
                return;
            }

            // Calculate MP to drain
            const currentMana = target.mana || 0;
            const drainAmount = Math.max(
                skill.minDrain || 20,
                Math.floor(currentMana * skill.drainPercent)
            );

            if (drainAmount > 0 && currentMana > 0) {
                // Drain from target
                target.mana = Math.max(0, target.mana - drainAmount);
                this.updateEnemyBars(target);

                // Transfer to hero (cannot exceed maxMana)
                const oldHeroMana = hero.mana;
                hero.mana = Math.min(hero.maxMana, hero.mana + drainAmount);
                const actualGain = hero.mana - oldHeroMana;
                this.updateHeroUI(hero.id);

                // Visual feedback
                const targetCard = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                if (targetCard) {
                    const root = targetCard.querySelector('.floater-root') || targetCard;
                    this.spawnFloater(`-${drainAmount} MP`, false, null, false, root, 'mana-drain');
                }

                const heroCard = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
                if (heroCard) {
                    const root = heroCard.querySelector('.floater-root');
                    this.spawnFloater(`+${actualGain} MP`, false, null, false, root, 'heal');
                }

                this.log(`${hero.name} drained ${drainAmount} MP from ${target.name}!`);
            } else {
                this.log(`${target.name} has no MP to drain!`);
            }

            // End turn
            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                this.determineIntents();
                this.stepTurn();
            }, 1500);
            return;
        }

        // Handle Life Steal skill
        if (skill.id === 'life_steal' && skill.stealPercent !== undefined) {
            const target = this.data.enemies.find(e => e.id === this.state.actionTargets[0]);
            if (!target || target.hp <= 0) {
                this.stepTurn();
                return;
            }

            // Calculate damage using the same method as other skills
            const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
            const baseStat = (dmgType === 'magic') ? (hero.stats.matk || hero.stats.atk) : hero.stats.atk;
            let dmg = Math.floor(baseStat * (skill.dmgMult || 1.0) * (0.9 + Math.random() * 0.2));

            // Critical Hit Calculation
            let isCrit = false;
            let critChance = (hero.stats.crit || 5);
            if (skill.critBonus) {
                critChance += (skill.critBonus * 100);
            }
            if (hero.stats.critBonus) {
                critChance += (hero.stats.critBonus * 100);
            }
            if (Math.random() * 100 < critChance) {
                isCrit = true;
                dmg = Math.floor(dmg * 1.5);
            }

            // Apply damage and get actual damage dealt
            const ignoreDef = skill.defenseIgnore || 0;
            const actualDmg = this.damageEntity(target, dmg, isCrit, dmgType, hero, ignoreDef);

            // Calculate HP to steal (40% of damage dealt)
            if (actualDmg > 0) {
                const stealAmount = Math.floor(actualDmg * skill.stealPercent);
                const oldHeroHp = hero.hp;
                hero.hp = Math.min(hero.maxHp, hero.hp + stealAmount);
                const actualHeal = hero.hp - oldHeroHp;
                this.updateHeroUI(hero.id);

                // Visual feedback for heal
                const heroCard = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
                if (heroCard && actualHeal > 0) {
                    const root = heroCard.querySelector('.floater-root') || heroCard;
                    this.spawnFloater(root, `+${actualHeal}`, { type: 'heal', isMana: false });
                }

                this.log(`${hero.name} stole ${actualHeal} HP from ${target.name}!`);
            }

            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                this.determineIntents();
                this.stepTurn();
            }, 1500);
            return;
        }

        // Handle Time Skip skill
        if (skill.id === 'time_skip') {
            // Check if already used this battle
            if (!hero.timeSkipUses) hero.timeSkipUses = 0;
            if (skill.maxUses && hero.timeSkipUses >= skill.maxUses) {
                this.showToastNotification(`${skill.name} can only be used ${skill.maxUses} time(s) per battle!`);
                this.stepTurn();
                return;
            }

            // Check cooldown
            if (skill.cooldown && hero.lastTimeSkipTurn) {
                const turnsSince = this.state.turnCount - hero.lastTimeSkipTurn;
                if (turnsSince < skill.cooldown) {
                    this.showToastNotification(`${skill.name} is on cooldown! (${skill.cooldown - turnsSince} turns remaining)`);
                    this.stepTurn();
                    return;
                }
            }

            hero.timeSkipUses = (hero.timeSkipUses || 0) + 1;
            hero.lastTimeSkipTurn = this.state.turnCount;

            this.log(`${hero.name} used ${skill.name}! Extra turn granted.`);
            this.showToastNotification(`${hero.name} gains an extra turn!`, true);

            // Grant extra turn by NOT calling stepTurn, but instead re-adding to turn order
            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                // Re-add hero to turn order immediately
                this.determineTurnOrder();

                // Verificação de segurança - determineTurnOrder seta state.entities, não turnOrder
                if (!this.state.entities || !Array.isArray(this.state.entities)) {
                    console.error('[Time Skip] entities is not initialized!');
                    this.determineTurnOrder(); // Tentar novamente
                }
                // Verificar novamente após tentativa
                if (!this.state.entities || !Array.isArray(this.state.entities)) {
                    this.showToastNotification('Error: Could not grant extra turn!', false);
                    this.stepTurn();
                    return;
                }

                // Make this hero active again
                const currentIndex = this.state.entities.findIndex(id => id === hero.id);
                if (currentIndex !== -1) {
                    // Move to front of queue
                    this.state.entities.splice(currentIndex, 1);
                    this.state.entities.unshift(hero.id);
                    this.state.currentTurnIndex = 0;
                    this.updateTimelineUI();
                    this.startPlayerTurn();
                } else {
                    // Fallback: just add to front
                    this.state.entities.unshift(hero.id);
                    this.state.currentTurnIndex = 0;
                    this.updateTimelineUI();
                    this.startPlayerTurn();
                }
            }, 1000);
            return;
        }

        // Handle Berserk Mode skill (self-buff)
        if (skill.id === 'berserk_mode' && skill.buff) {
            // Apply buff through SkillEngine
            SkillEngine.applyBuff(hero, skill.buff, hero, skill.id);
            this.log(`${hero.name} enters ${skill.name}!`);
            this.showToastNotification(`${hero.name} enters Berserk Mode!`, true);

            // Update UI to show the buff icon
            this.updateHeroUI(hero.id);

            setTimeout(() => {
                this.processStatusEffects(hero, 'turn_end');
                this.determineIntents();
                this.stepTurn();
            }, 1500);
            return;
        }

        const targets = this.state.actionTargets;
        targets.forEach((tid, index) => {
            const processTarget = () => {
                // Healing branch (self or party)
                const isAoeHeal = skill.type === 'aoe_heal';
                if (isAoeHeal) {
                    const ally = this.data.heroes.find(h => h.id === tid);
                    if (!ally || ally.hp <= 0) return;
                    const healAmt = (skill.heal !== undefined) ? Number(skill.heal) :
                        (skill.healPct ? Math.floor(ally.maxHp * Number(skill.healPct)) : 0);
                    if (healAmt > 0) this.healHero(ally, healAmt);

                    const manaAmt = (skill.manaRestore !== undefined) ? Number(skill.manaRestore) :
                        (skill.manaRestorePct ? Math.floor(ally.maxMana * Number(skill.manaRestorePct)) : 0);
                    if (manaAmt > 0) this.restoreMana(ally, manaAmt);

                    this.log(`${hero.name} casted ${skill.name} (AoE Heal) on ${ally.name}.`);

                    // Apply buffs on each healed ally if configured
                    if (skill.buff && window.SkillEngine) {
                        SkillEngine.applyBuff(ally, skill.buff, hero, skill.id);
                        this.updateHeroUI(ally.id);
                        // Refresh Stats Overlay if open for this ally
                        if (this.state.statsOverlayOpen && this.state.statsOverlayEntityId === ally.id) {
                            this.openStatsOverlay(ally.id);
                        }
                    }
                    return;
                }

                // Single-target ally support (heal/buff/mana restore)
                const allyTarget = this.data.heroes.find(h => h.id === tid);
                if (allyTarget) {
                    const healAmt = (skill.name === 'Heal') ? 100 :
                        (skill.heal !== undefined) ? Number(skill.heal) :
                            (skill.healPct ? Math.floor(allyTarget.maxHp * Number(skill.healPct)) : 0);
                    if (healAmt > 0) this.healHero(allyTarget, healAmt);

                    const manaAmt = (skill.manaRestore !== undefined) ? Number(skill.manaRestore) :
                        (skill.manaRestorePct ? Math.floor(allyTarget.maxMana * Number(skill.manaRestorePct)) : 0);
                    if (manaAmt > 0) this.restoreMana(allyTarget, manaAmt);

                    if (skill.buff && window.SkillEngine) {
                        SkillEngine.applyBuff(allyTarget, skill.buff, hero, skill.id);
                        this.updateHeroUI(allyTarget.id);
                        // Refresh Stats Overlay if open for this ally
                        if (this.state.statsOverlayOpen && this.state.statsOverlayEntityId === allyTarget.id) {
                            this.openStatsOverlay(allyTarget.id);
                        }
                    }

                    // Apply status effects to ally (rare but supported)
                    if (skill.effect) this.applyStatus(allyTarget, skill.effect, hero);
                    if (skill.effects) skill.effects.forEach(eff => this.applyStatus(allyTarget, eff, hero));

                    this.log(`${hero.name} casted ${skill.name} on ${allyTarget.name}.`);
                    this.showSkillBanner(skill.name, skill.icon || 'zap');
                    return;
                }

                if (tid === hero.id) {
                    // Heal support (keeps legacy "Heal" behavior too)
                    const healAmt = (skill.name === 'Heal') ? 100 :
                        (skill.heal !== undefined) ? Number(skill.heal) :
                            (skill.healPct ? Math.floor(hero.maxHp * Number(skill.healPct)) : 0);
                    if (healAmt > 0) this.healHero(hero, healAmt);

                    const manaAmt = (skill.manaRestore !== undefined) ? Number(skill.manaRestore) :
                        (skill.manaRestorePct ? Math.floor(hero.maxMana * Number(skill.manaRestorePct)) : 0);
                    if (manaAmt > 0) this.restoreMana(hero, manaAmt);

                    this.log(`${hero.name} casted ${skill.name} on self.`);

                    // Show visual banner for self buffs/skills
                    this.showSkillBanner(skill.name, skill.icon || 'zap');

                    // Apply buffs (new system)
                    if (skill.buff && window.SkillEngine) {
                        const oldAtk = hero.stats?.atk || 0;
                        SkillEngine.applyBuff(hero, skill.buff, hero, skill.id);
                        const newAtk = hero.stats?.atk || 0;

                        // Update UI immediately
                        this.updateHeroUI(hero.id);
                        // Refresh Stats Overlay if open for this hero
                        if (this.state.statsOverlayOpen && this.state.statsOverlayEntityId === hero.id) {
                            this.openStatsOverlay(hero.id);
                        }

                        // Show stat changes
                        const statChanges = {};
                        if (skill.buff.stats) {
                            Object.keys(skill.buff.stats).forEach(stat => {
                                statChanges[stat.toUpperCase()] = skill.buff.stats[stat];
                            });
                        }
                        if (newAtk !== oldAtk) {
                            statChanges['ATK'] = newAtk - oldAtk;
                        }

                        if (Object.keys(statChanges).length > 0) {
                            this.showStatChange(hero, statChanges);
                        }
                    }

                    // Apply effects to self (status effects)
                    if (skill.effect) this.applyStatus(hero, skill.effect, hero);
                    if (skill.effects) skill.effects.forEach(eff => this.applyStatus(hero, eff, hero));
                }
                else {
                    const target = this.data.enemies.find(e => e.id === tid);
                    if (target && target.hp > 0) {
                        const hits = skill.hits || 1;
                        for (let i = 0; i < hits; i++) {
                            const processHit = () => {
                                this.playEffect('sword');

                                // Damage type support (Mage/Acolyte use MATK)
                                const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
                                const baseStat = (dmgType === 'magic') ? (hero.stats.matk || hero.stats.atk) : hero.stats.atk;
                                let dmg = Math.floor(baseStat * (skill.dmgMult || 1.0) * (0.9 + Math.random() * 0.2));

                                // Critical Hit Calculation
                                let isCrit = false;
                                let critChance = (hero.stats.crit || 5); // Base crit

                                // Add skill bonus crit
                                if (skill.critBonus) {
                                    critChance += (skill.critBonus * 100);
                                }

                                // Add hero buffed crit bonus
                                if (hero.buffedCritBonus) {
                                    critChance += hero.buffedCritBonus;
                                }

                                if (Math.random() * 100 < critChance) isCrit = true;

                                // Defense Ignore
                                const ignoreDef = skill.defenseIgnore || 0;

                                this.damageEntity(target, dmg, isCrit, dmgType, hero, ignoreDef);

                                // Apply effects only on first hit
                                if (i === 0) {
                                    // Apply debuffs (new system)
                                    if (skill.debuff && window.SkillEngine) {
                                        SkillEngine.applyDebuff(target, skill.debuff, hero, skill.id);
                                        this.updateEnemyBars(target);
                                        // Refresh Stats Overlay if open for this enemy
                                        if (this.state.statsOverlayOpen && this.state.statsOverlayEntityId === target.id) {
                                            this.openStatsOverlay(target.id);
                                        }
                                    }

                                    // Apply status effects
                                    if (skill.effect) this.applyStatus(target, skill.effect, hero);
                                    if (skill.effects) skill.effects.forEach(eff => this.applyStatus(target, eff, hero));
                                }
                            };

                            if (this.skipUI()) {
                                processHit();
                            } else {
                                setTimeout(processHit, i * 150);
                            }
                        }

                        // Pierce: Hit second target if skill type is 'pierce'
                        if (skill.type === 'pierce') {
                            setTimeout(() => {
                                const aliveEnemies = this.data.enemies.filter(e => e.hp > 0 && e.id !== target.id);
                                if (aliveEnemies.length > 0) {
                                    const secondTarget = aliveEnemies[0];
                                    const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
                                    const baseStat = (dmgType === 'magic') ? (hero.stats.matk || hero.stats.atk) : hero.stats.atk;
                                    const pierceDmg = Math.floor(baseStat * skill.dmgMult * 0.5); // 50% damage
                                    this.log(`${skill.name} pierces through to ${secondTarget.name}!`);
                                    this.damageEntity(secondTarget, pierceDmg, false, dmgType, hero);
                                }
                            }, 300);
                        }
                    }
                }
            };

            if (this.skipUI()) processTarget();
            else setTimeout(processTarget, index * 200);
        });

        // For AOE skills with healPct, also heal all allies
        if (skill.type === 'aoe' && skill.healPct) {
            const processHeals = () => {
                this.data.heroes.forEach(ally => {
                    if (ally.hp > 0) {
                        const healAmt = Math.floor(ally.maxHp * Number(skill.healPct));
                        if (healAmt > 0) {
                            this.healHero(ally, healAmt);
                            this.log(`${hero.name}'s ${skill.name} heals ${ally.name} for ${healAmt} HP.`);
                        }
                    }
                });
            };

            if (this.skipUI()) {
                processHeals();
            } else {
                setTimeout(processHeals, (targets.length * 200) + 300);
            }
        }

        // --- End of turn status processing ---
        const finalizeSkill = () => {
            this.processStatusEffects(hero, 'turn_end');
            this.determineIntents();
            this.stepTurn();
        };

        if (this.skipUI()) {
            finalizeSkill();
        } else {
            setTimeout(finalizeSkill, 1000 + (targets.length * 200));
        }
    },

    async useDefend(hero) {
        console.log('[DEFEND DEBUG] ========== useDefend CALLED ==========');
        console.log('[DEFEND DEBUG] Hero:', hero);

        // Validate hero can act
        if (!hero || hero.hp <= 0) {
            console.log('[DEFEND DEBUG] BLOCKED: Hero invalid or dead');
            this.showToastNotification("Cannot defend - hero is incapacitated!");
            return;
        }

        console.log('[DEFEND DEBUG] Hero is valid, proceeding with defend');
        this.debug('DEFEND', `${hero.name} takes a defensive stance`);

        // Apply defensive buff
        const defendBuff = {
            __kind: 'buff',
            id: 'defensive_stance',
            duration: 1,
            data: {
                damageTaken: 0.7,      // 30% reduction
                parryChance: 0.15,     // +15% parry
                name: 'Defensive Stance'
            }
        };

        // Apply buff via SkillEngine
        if (window.SkillEngine) {
            SkillEngine.applyBuff(hero, defendBuff, hero, 'defend_action');
        }

        // MP Regeneration (20% of max MP)
        const manaGain = Math.floor(hero.maxMana * 0.2);
        hero.mana = Math.min(hero.maxMana, hero.mana + manaGain);

        // Visual Feedback
        this.log(`${hero.name} takes a defensive stance! (+${manaGain} MP)`);

        const heroCard = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
        if (heroCard) {
            // Shield visual effect
            if (!this.skipUI()) {
                heroCard.classList.add('shield-active');
                setTimeout(() => heroCard.classList.remove('shield-active'), 1000);
            }

            // Floater for DEFEND
            const floaterRoot = heroCard.querySelector('.floater-root') || heroCard;
            this.spawnFloater('DEFEND', false, null, false, floaterRoot, 'defend');

            // MP floater
            if (manaGain > 0 && !this.skipUI()) {
                setTimeout(() => {
                    this.spawnFloater(`+${manaGain} MP`, false, null, false, floaterRoot, 'mana-gain');
                }, 300);
            }
        }

        // Audio
        if (this.audioManager) {
            this.audioManager.play('buff', { target: hero });
        }

        // Update UI
        this.updateHeroUI(hero.id);

        // Process turn end and advance
        const finalizeDefend = () => {
            this.processStatusEffects(hero, 'turn_end');
            this.determineIntents();
            this.stepTurn();
        };

        if (this.skipUI()) {
            finalizeDefend();
        } else {
            setTimeout(finalizeDefend, 1000);
        }
    },

    healHero(hero, a) {
        this.healEntity(hero, a);
    },

    healEntity(entity, amount) {
        if (!entity || entity.hp <= 0) return;
        const oldHp = entity.hp;
        entity.hp = Math.min(entity.maxHp, entity.hp + amount);
        const actualHeal = entity.hp - oldHp;

        if (entity.isPlayer) {
            this.updateHeroUI(entity.id);
        } else {
            this.updateEnemyBars(entity);
        }

        // Visual Floater
        const cardSelector = entity.isPlayer
            ? `.hero-card-instance[data-id="${entity.id}"]`
            : `.enemy-card-instance[data-id="${entity.id}"]`;
        const card = document.querySelector(cardSelector);
        if (card) {
            const root = card.querySelector('.floater-root');
            // Green text for heal
            this.spawnFloater(`+${actualHeal}`, false, null, false, root, 'heal');
        }
    },

    restoreMana(entity, a) {
        if (!entity || !entity.maxMana) return;
        const amt = Math.max(0, Math.floor(a || 0));
        if (amt <= 0) return;
        entity.mana = Math.min(entity.maxMana, (entity.mana || 0) + amt);

        if (entity.isPlayer) {
            this.updateHeroUI(entity.id);
        } else {
            this.updateEnemyBars(entity);
        }

        const card = entity.isPlayer
            ? document.querySelector(`.hero-card-instance[data-id="${entity.id}"]`)
            : document.querySelector(`.enemy-card-instance[data-id="${entity.id}"]`);
        const root = card ? (card.querySelector('.floater-root') || card) : null;
        if (root) this.spawnFloater(`+${amt} MP`, false, null, true, root, 'mana');
    },

    // --- Advanced AI System ---

    ai_findBestTarget(enemy, skillType = 'single', damageType = 'physical') {
        const aliveHeroes = this.data.heroes.filter(h => h.hp > 0);
        if (aliveHeroes.length === 0) return null;

        // 1. Check for Taunt
        const taunters = aliveHeroes.filter(h => h.statusEffects && h.statusEffects.some(s => s.id === 'taunt'));
        if (taunters.length > 0) {
            return taunters[Math.floor(Math.random() * taunters.length)];
        }

        // 2. Heuristic Scoring for Targets
        // Default: Focus weakest HP%
        return aliveHeroes.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    },

    ai_calculateActionScore(enemy, action) {
        let score = 0;
        let targetId = null;
        let debugReason = [];
        const turn = this.state.turnCount || 0;
        const hpPct = enemy.hp / enemy.maxHp;

        if (action.type === 'attack') {
            const target = this.ai_findBestTarget(enemy, 'single', 'physical');
            if (!target) return { score: -1 };

            targetId = target.id;
            score = 10; // Base baseline

            // Execution Bonus / Focus Fire
            const dmg = Math.max(enemy.stats.atk || 0, enemy.stats.str || 0);
            if (target.hp <= dmg) {
                score += 500; // HUGE priority to finish off targets
                debugReason.push('KILL_CONFIRM');
            } else {
                score += (1 - (target.hp / target.maxHp)) * 20; // Soft priority on weak targets
            }
        }
        else if (action.type === 'skill') {
            const skill = action.skill;
            if (enemy.mana < skill.mana) return { score: -999 };

            // Support Logic
            const isSupport = skill.category === 'heal' || skill.category === 'buff' || skill.type === 'aoe_heal' || skill.healPct || (skill.buff && !skill.buff.damageTaken);

            if (isSupport) {
                if (skill.type === 'aoe_heal') {
                    // Score based on total missing HP
                    let totalMissing = 0;
                    this.data.enemies.forEach(e => { if (e.hp > 0) totalMissing += (1 - e.hp / e.maxHp); });
                    if (totalMissing > 0.5) score = 40 + (totalMissing * 50);
                } else if (skill.category === 'heal' || skill.healPct) {
                    // Single target heal
                    if (skill.healPct && skill.type === 'self') { // Self heal
                        if (hpPct < 0.4) score = 150; // Self-preservation
                    } else {
                        // Heal ally
                        const worstAlly = this.data.enemies.filter(e => e.hp > 0).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                        if (worstAlly && (worstAlly.hp / worstAlly.maxHp) < 0.6) {
                            targetId = worstAlly.id;
                            score = 60 + ((1 - (worstAlly.hp / worstAlly.maxHp)) * 120);
                        }
                    }
                } else {
                    // Buffs
                    if (Math.random() < 0.4) score = 20;
                }
            }
            // Offensive Skills
            else {
                // Base value based on damage multiplier
                score = 25 + ((skill.dmgMult || 1) * 10);

                if (skill.ultimate) {
                    if (turn < 4) score = -100; // Too early
                    else {
                        if (hpPct < 0.3) score += 200; // Desperate
                        else if (turn > 8) score += 100; // Late game
                    }
                }

                if (skill.type === 'aoe') {
                    const heroCount = this.data.heroes.filter(h => h.hp > 0).length;
                    if (heroCount > 1) {
                        score += heroCount * 15;
                    } else {
                        score -= 50; // Heavy penalty for using AoE on single target
                    }
                } else {
                    const target = this.ai_findBestTarget(enemy, 'single');
                    if (target) {
                        targetId = target.id;
                        const estimatedDmg = (enemy.stats.atk || 10) * (skill.dmgMult || 1);
                        if (target.hp <= estimatedDmg) {
                            score += 250; // Skill Kill
                            debugReason.push('SKILL_KILL');
                        }
                    }
                }
            }
        }
        else if (action.type === 'item') {
            const item = action.item;
            const hpPct = enemy.hp / enemy.maxHp;
            const mpPct = enemy.mana / (enemy.maxMana || 1);

            if (item.healHp) {
                if (hpPct < 0.3) score = 200; // Emergency heal
                else if (hpPct < 0.6) score = 80; // Preventive heal
            }
            if (item.restoreMana) {
                if (mpPct < 0.2) score = 150; // Critical mana
                else if (mpPct < 0.5) score = 60;
            }
            if (item.cureStatus || item.cureAllStatuses) {
                const hasDebuff = enemy.activeDebuffs && enemy.activeDebuffs.length > 0;
                if (hasDebuff) score = 180; // High priority to clear debuffs
            }
            if (item.applyStatus && item.target === 'enemy') {
                const target = this.ai_findBestTarget(enemy, 'single');
                if (target) {
                    targetId = target.id;
                    score = 40;
                }
            }
        }

        // Randomness
        score += (Math.random() * 20) - 10;

        return { score, targetId, debugReason };
    },

    determineIntents() {
        this.data.enemies.forEach(e => {
            if (e.hp <= 0) { e.nextIntent = null; return; }

            // Check for incapacitating status effects
            const incapacitated = e.statusEffects && e.statusEffects.some(s => ['stun', 'freeze', 'sleep'].includes(s.id));
            if (incapacitated) { e.nextIntent = null; return; }

            // Generate candidates
            let candidates = [{ type: 'attack', skill: null, name: 'Attack' }];
            if (e.skills && e.skills.length > 0) {
                e.skills.forEach(s => candidates.push({ type: 'skill', skill: s, name: s.name }));
            }

            // Item candidates
            if (e.inventory) {
                Object.keys(e.inventory).forEach(ikey => {
                    if (e.inventory[ikey] > 0) {
                        const item = this.data.items[ikey];
                        if (item) candidates.push({ type: 'item', item: { ...item, id: ikey }, name: item.name });
                    }
                });
            }

            // Score candidates
            candidates = candidates.map(c => {
                const res = this.ai_calculateActionScore(e, c);
                return { ...c, ...res };
            });

            // Sort logic: Higher score first
            candidates.sort((a, b) => b.score - a.score);
            const best = candidates[0];

            // Debug Log Top 3
            if (Math.random() < 0.2 || best.debugReason && best.debugReason.length > 0) {
                const top3 = candidates.slice(0, 3).map(x => `${x.name}(${Math.round(x.score)})`);
                this.debug('AI_THINK', `${e.name} considered: ${top3.join(', ')}`);
            }

            if (best && best.score > 0) {
                e.nextIntent = {
                    type: best.type,
                    skill: best.skill,
                    item: best.item,
                    targetId: best.targetId
                };

                // Optional: Log intent to persistent log if it's special
                if (best.type === 'skill' && best.skill.ultimate) {
                    this.log(`⚠️ ${e.name} is preparing ULTIMATE: ${best.skill.name}!`);
                }
            } else {
                const t = this.ai_findBestTarget(e);
                e.nextIntent = { type: 'attack', targetId: t ? t.id : null };
            }
        });

        this.renderEnemyIntents();
        this.renderEnemyTargetMarkers();
    },

    async startEnemyTurn(e) {
        if (!this.skipUI()) {
            const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
            if (c) {
                c.style.setProperty('--s', '1.1');
                c.style.setProperty('--ty', '-40px');
                c.classList.add('z-50');
            }
        }

        // Execute the forecasted intent or default to attack (fallback)
        const intent = e.nextIntent || { type: 'attack' };

        // Clear the intent UI
        this.clearEnemyIntentUI(e.id);

        if (intent.type === 'skill') {
            await this.performEnemySkill(e, intent.skill);
        } else if (intent.type === 'item') {
            const item = intent.item;
            const target = this.data.heroes.find(h => h.id === intent.targetId) || e;
            this.state.itemPreviewId = item.id;
            await this.useItem(item, target);
        } else {
            this.state.parry.attacksRemaining = e.attacks || 1;
            if (this.skipUI()) {
                this.executeNextEnemyAttack(e);
            } else {
                setTimeout(() => { this.executeNextEnemyAttack(e); }, 1500);
                this.showTelegraph(e, 'sword'); // Quick telegraph before attack
            }
        }
    },

    // Placeholder for intent UI
    // Placeholder for intent UI (Visuals disabled by request)
    renderEnemyIntents() {
        this.data.enemies.forEach(e => {
            const card = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
            if (!card) return;
            const slot = card.querySelector('.enemy-intent-slot');
            if (!slot) return;

            // Always hide intent visuals
            slot.classList.add('opacity-0');
            slot.innerHTML = '';
        });
    },

    renderEnemyTargetMarkers() {
        // Markers disabled to prevent confusion; using real-time highlights instead.
        document.querySelectorAll('.enemy-target-marker').forEach(el => el.remove());
    },

    addEnemyTargetMarker(heroId) {
        const heroCard = document.querySelector(`.hero-card-instance[data-id="${heroId}"]`);
        if (!heroCard) return;

        // Check if marker already exists
        if (heroCard.querySelector('.enemy-target-marker')) return;

        const marker = document.createElement('div');
        marker.className = 'enemy-target-marker absolute inset-0 pointer-events-none z-[45]';
        marker.innerHTML = `
            <div class="mira-ring-outer"></div>
            <div class="mira-ring"></div>
            <div class="mira-corners">
                <div class="mira-corner mira-corner-tl"></div>
                <div class="mira-corner mira-corner-tr"></div>
                <div class="mira-corner mira-corner-bl"></div>
                <div class="mira-corner mira-corner-br"></div>
            </div>
            <i data-lucide="target" class="w-10 h-10 text-red-500/80 animate-pulse"></i>
        `;
        heroCard.appendChild(marker);
        this.refreshIcons();
    },

    clearEnemyIntentUI(id) {
        const el = document.getElementById(`intent-${id}`);
        if (el) el.remove();
        // Clear target markers when enemy dies or turn ends
        document.querySelectorAll('.enemy-target-marker').forEach(el => el.remove());
    },


    showTelegraph(e, icon) {
        const card = document.querySelector(`.enemy-card-instance[data-id="${e.id}"] .floater-root`);
        if (!card) return;
        const el = document.createElement('div');
        const colorClass = icon === 'sword' ? 'text-red-500' : 'text-blue-400';
        el.className = `absolute top-[-60px] left-1/2 -translate-x-1/2 ${colorClass} font-bold intent-icon z-[200] flex flex-col items-center gap-1`;
        el.innerHTML = `<div class="px-2 py-1 bg-black/80 border border-white/10 rounded-lg shadow-xl backdrop-blur-sm scale-125"><i data-lucide="${icon}" class="w-5 h-5"></i></div><div class="w-1 h-3 bg-gradient-to-b from-white/20 to-transparent"></div>`;
        card.appendChild(el);
        this.refreshIcons();
        setTimeout(() => el.remove(), 1200);
    },

    getRandomAliveHero() {
        const alive = this.data.heroes.filter(h => h.hp > 0);
        if (alive.length === 0) return null;

        // Taunt logic: if any hero has 'taunt', they have a much higher chance to be picked
        const taunters = alive.filter(h => h.statusEffects.some(s => s.id === 'taunt'));
        if (taunters.length > 0 && Math.random() < 0.8) {
            return taunters[Math.floor(Math.random() * taunters.length)];
        }

        return alive[Math.floor(Math.random() * alive.length)];
    },

    highlightCombatants(attackerId, targetIds, type = 'hostile') {
        this.clearHighlights();
        const attCard = document.querySelector(`.enemy-card-instance[data-id="${attackerId}"]`);
        if (attCard) attCard.classList.add('ring-4', 'ring-blue-500', 'scale-110', 'z-50', 'transition-all', 'duration-300');

        targetIds.forEach(tid => {
            const tCard = document.querySelector(`.hero-card-instance[data-id="${tid}"], .enemy-card-instance[data-id="${tid}"]`);
            if (tCard) {
                const color = type === 'hostile' ? 'ring-red-600' : 'ring-emerald-400';
                tCard.classList.add('ring-4', color, 'scale-105', 'z-50', 'transition-all', 'duration-300');
                if (type === 'hostile') tCard.classList.add('animate-pulse');
            }
        });
    },

    clearHighlights() {
        document.querySelectorAll('.ring-4').forEach(el => {
            el.classList.remove('ring-4', 'ring-blue-500', 'ring-red-600', 'ring-emerald-400', 'scale-110', 'scale-105', 'z-50', 'animate-pulse');
        });
    },

    async performEnemySkill(e, skillOverride = null) {
        const skill = skillOverride || (e.nextIntent && e.nextIntent.skill) || e.skills[0];

        e.activeSkill = skill;

        if (this.audioManager) {
            this.audioManager.play('skill_start', { skill, hero: e });
            this.audioManager.play('skill_voice', { skill, hero: e });
        }

        if (skill.ultimate === true) {
            await this.showUltimateCutIn(e, skill);
        }

        if (skill.type === 'summon' && skill.summonEntity) {
            this.handleSummonSkill(skill, e);
            return;
        }

        // Handle Revive skill for enemies
        if (skill.type === 'revive') {
            // For enemies, select random dead ally
            const deadAllies = this.data.enemies.filter(ally => ally.hp <= 0);
            if (deadAllies.length === 0) {
                this.log(`${e.name} has no fallen allies to revive!`);
                const finalizeReviveSkip = () => {
                    this.clearHighlights();
                    this.processStatusEffects(e, 'turn_end');
                    this.stepTurn();
                };
                if (this.skipUI()) finalizeReviveSkip();
                else setTimeout(finalizeReviveSkip, 1000);
                return;
            }

            // Check limit
            const aliveEnemies = this.data.enemies.filter(x => x.hp > 0);
            if (aliveEnemies.length >= 3) {
                this.log(`${e.name} cannot revive: Maximum 3 enemies reached!`);
                const finalizeReviveMax = () => {
                    this.clearHighlights();
                    this.processStatusEffects(e, 'turn_end');
                    this.stepTurn();
                };
                if (this.skipUI()) finalizeReviveMax();
                else setTimeout(finalizeReviveMax, 1000);
                return;
            }

            // Select random dead ally to revive
            const target = deadAllies[Math.floor(Math.random() * deadAllies.length)];
            this.state.actionTargets = [target.id];
            e.mana -= skill.mana;
            this.updateEnemyBars(e);
            this.handleReviveSkill(skill, e);

            // End turn
            const finalizeRevive = () => {
                this.clearHighlights();
                this.processStatusEffects(e, 'turn_end');
                this.stepTurn();
            };
            if (this.skipUI()) finalizeRevive();
            else setTimeout(finalizeRevive, 1500);
            return;
        }

        // Handle Life Steal skill for enemies
        if (skill.id === 'life_steal' && skill.stealPercent !== undefined) {
            const target = this.getRandomAliveHero();
            if (!target || target.hp <= 0) {
                this.stepTurn();
                return;
            }

            // Calculate damage using the same method as other skills
            const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
            const baseStat = (dmgType === 'magic') ? (e.stats.matk || e.stats.atk) : e.stats.atk;
            let dmg = Math.floor(baseStat * (skill.dmgMult || 1.0) * (0.9 + Math.random() * 0.2));

            // Critical Hit Calculation
            let isCrit = false;
            let critChance = (e.stats.crit || 5);
            if (skill.critBonus) {
                critChance += (skill.critBonus * 100);
            }
            if (e.stats.critBonus) {
                critChance += (e.stats.critBonus * 100);
            }
            if (Math.random() * 100 < critChance) {
                isCrit = true;
                dmg = Math.floor(dmg * 1.5);
            }

            // Apply damage and get actual damage dealt
            const ignoreDef = skill.defenseIgnore || 0;
            const actualDmg = this.damageEntity(target, dmg, isCrit, dmgType, e, ignoreDef);

            // Calculate HP to steal (40% of damage dealt)
            if (actualDmg > 0) {
                const stealAmount = Math.floor(actualDmg * skill.stealPercent);
                const oldEnemyHp = e.hp;
                e.hp = Math.min(e.maxHp, e.hp + stealAmount);
                const actualHeal = e.hp - oldEnemyHp;
                this.updateEnemyBars(e);

                // Visual feedback for heal
                const enemyCard = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
                if (enemyCard && actualHeal > 0 && !this.skipUI()) {
                    const root = enemyCard.querySelector('.floater-root') || enemyCard;
                    this.spawnFloater(root, `+${actualHeal}`, { type: 'heal', isMana: false });
                }

                this.log(`${e.name} stole ${actualHeal} HP from ${target.name}!`);
            }

            const finalizeLifeSteal = () => {
                this.clearHighlights();
                this.processStatusEffects(e, 'turn_end');
                this.stepTurn();
            };
            if (this.skipUI()) finalizeLifeSteal();
            else setTimeout(finalizeLifeSteal, 1500);
            return;
        }

        // Handle Berserk Mode skill for enemies
        if (skill.id === 'berserk_mode' && skill.buff) {
            SkillEngine.applyBuff(e, skill.buff, e, skill.id);
            this.log(`${e.name} enters ${skill.name}!`);

            const finalizeBerserk = () => {
                this.clearHighlights();
                this.processStatusEffects(e, 'turn_end');
                this.stepTurn();
            };
            if (this.skipUI()) finalizeBerserk();
            else setTimeout(finalizeBerserk, 1500);
            return;
        }

        // Handle Mana Drain skill for enemies
        if (skill.id === 'mana_drain' && skill.drainPercent !== undefined) {
            const target = this.getRandomAliveHero();
            if (!target || target.hp <= 0) {
                this.stepTurn();
                return;
            }

            // Calculate MP to drain
            const currentMana = target.mana || 0;
            const drainAmount = Math.max(
                skill.minDrain || 20,
                Math.floor(currentMana * skill.drainPercent)
            );

            if (drainAmount > 0 && currentMana > 0) {
                // Drain from target
                target.mana = Math.max(0, target.mana - drainAmount);
                if (!this.skipUI()) this.updateHeroUI(target.id);

                // Transfer to enemy (cannot exceed maxMana)
                const oldEnemyMana = e.mana;
                e.mana = Math.min(e.maxMana, e.mana + drainAmount);
                const actualGain = e.mana - oldEnemyMana;
                if (!this.skipUI()) this.updateEnemyBars(e);

                // Visual feedback
                if (!this.skipUI()) {
                    const targetCard = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                    if (targetCard) {
                        const root = targetCard.querySelector('.floater-root');
                        this.spawnFloater(`-${drainAmount} MP`, false, null, false, root, 'mana-drain');
                    }

                    const enemyCard = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
                    if (enemyCard) {
                        const root = enemyCard.querySelector('.floater-root') || enemyCard;
                        this.spawnFloater(`+${actualGain} MP`, false, null, false, root, 'heal');
                    }
                }

                this.log(`${e.name} drained ${drainAmount} MP from ${target.name}!`);
            } else {
                this.log(`${target.name} has no MP to drain!`);
            }

            // End turn
            const finalizeManaDrain = () => {
                this.clearHighlights();
                this.processStatusEffects(e, 'turn_end');
                this.stepTurn();
            };
            if (this.skipUI()) finalizeManaDrain();
            else setTimeout(finalizeManaDrain, 1500);
            return;
        }

        this.showToastNotification(`${e.name} casts ${skill.name}!`);

        let targets = [];
        // Support skills include heals, buffs, and self-target skills (like Field Repair)
        const isSupportSkill = skill.category === 'heal' || skill.category === 'buff' ||
            skill.type === 'aoe_heal' || skill.healPct ||
            skill.type === 'self' || !!skill.buff;

        if (skill.type === 'aoe' || skill.type === 'aoe_heal') {
            targets = isSupportSkill
                ? this.data.enemies.filter(x => x.hp > 0)
                : this.data.heroes.filter(x => x.hp > 0);

            this.log(`${e.name} casts ${skill.name} on ${isSupportSkill ? 'ALL ALLIES' : 'ALL HEROES'} (Cost: ${skill.mana} MP).`);
        } else {
            let targetId = (e.nextIntent && e.nextIntent.skill === skill && e.nextIntent.targetId) ? e.nextIntent.targetId : null;
            let target = null;

            if (targetId) {
                target = isSupportSkill
                    ? this.data.enemies.find(x => x.id === targetId)
                    : this.data.heroes.find(x => x.id === targetId);
            }

            if (!target || target.hp <= 0) {
                if (isSupportSkill) {
                    // For self skills, ALWAYS target self
                    if (skill.type === 'self') {
                        target = e;
                    } else {
                        const allies = this.data.enemies.filter(a => a.hp > 0);
                        if (skill.category === 'heal') target = allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
                        else target = allies[Math.floor(Math.random() * allies.length)];
                    }
                } else {
                    target = this.getRandomAliveHero();
                }
            }

            if (!target) return;
            targets = [target];
            this.log(`${e.name} casts ${skill.name} on ${target.name} (Cost: ${skill.mana} MP).`);
        }

        e.mana -= skill.mana;
        this.updateEnemyBars(e);
        this.showTelegraph(e, 'zap');

        // Highlight Visuals
        this.highlightCombatants(e.id, targets.map(t => t.id), isSupportSkill ? 'support' : 'hostile');

        const runSkillProcessing = () => {
            targets.forEach((target, index) => {
                const runTargetProcessing = () => {
                    const hits = skill.hits || 1;
                    const dmgType = (skill.damageType === 'magic') ? 'magic' : 'physical';
                    const baseStat = (dmgType === 'magic') ? (e.stats.matk || e.stats.atk) : e.stats.atk;

                    for (let i = 0; i < hits; i++) {
                        const runHitProcessing = () => {
                            // Re-evaluate support status for hit processing
                            const isSupport = skill.category === 'heal' || skill.category === 'buff' ||
                                skill.type === 'aoe_heal' || skill.type === 'self' || !!skill.buff;

                            if (isSupport) {
                                if (skill.category === 'heal' || skill.type === 'aoe_heal') {
                                    let healAmt = 0;
                                    if (skill.heal) healAmt = Number(skill.heal);
                                    else if (skill.healPct) healAmt = Math.floor(target.maxHp * Number(skill.healPct));
                                    else {
                                        const scalingStat = (e.stats.matk > e.stats.atk) ? e.stats.matk : e.stats.atk;
                                        healAmt = Math.floor(scalingStat * (skill.dmgMult || 1.5) * (0.9 + Math.random() * 0.2));
                                    }
                                    if (healAmt > 0) this.healEntity(target, healAmt);
                                }
                                if (i === 0) {
                                    if (skill.effect) this.applyStatus(target, skill.effect, e);
                                    if (skill.effects) skill.effects.forEach(eff => this.applyStatus(target, eff, e));
                                    if (skill.buff && window.SkillEngine) {
                                        SkillEngine.applyBuff(target, skill.buff, e, skill.id);
                                        if (!target.isPlayer && !this.skipUI()) this.updateEnemyBars(target);
                                    }
                                }
                            } else {
                                // Allow 0 damage multiplier (explicit check)
                                const mult = (skill.dmgMult !== undefined) ? skill.dmgMult : 1.0;
                                let dmg = Math.floor(baseStat * mult * (0.9 + Math.random() * 0.2));
                                let isCrit = false;
                                let critChance = (e.stats.crit || 5);
                                if (skill.critBonus) critChance += (skill.critBonus * 100);
                                if (e.buffedCritBonus) critChance += e.buffedCritBonus;
                                if (Math.random() * 100 < critChance) isCrit = true;

                                this.damageEntity(target, dmg, isCrit, dmgType, e);

                                if (i === 0) {
                                    if (skill.effect) this.applyStatus(target, skill.effect, e);
                                    if (skill.effects) skill.effects.forEach(eff => this.applyStatus(target, eff, e));
                                    if (skill.debuff && window.SkillEngine) {
                                        SkillEngine.applyDebuff(target, skill.debuff, e, skill.id);
                                        if (!this.skipUI()) this.updateHeroUI(target.id);
                                    }
                                }
                            }
                        };
                        if (this.skipUI()) runHitProcessing();
                        else setTimeout(runHitProcessing, i * 150);
                    }
                };
                if (this.skipUI()) runTargetProcessing();
                else setTimeout(runTargetProcessing, index * 200);
            });

            const maxHits = Math.max(...targets.map(() => skill.hits || 1));
            const hitDelay = maxHits * 150;

            const finalizeSkill = () => {
                if (!this.skipUI()) {
                    const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
                    if (c) { c.style.setProperty('--s', '1'); c.style.setProperty('--ty', '0px'); c.classList.remove('z-50'); }
                }
                this.sendEnemyToBack(e.id);
                this.clearHighlights();
                this.processStatusEffects(e, 'turn_end');
                this.stepTurn();
            };

            if (this.skipUI()) finalizeSkill();
            else setTimeout(finalizeSkill, Math.max(600, hitDelay + 200));
        };

        if (this.skipUI()) runSkillProcessing();
        else setTimeout(runSkillProcessing, 1000);
    },

    executeNextEnemyAttack(e) {
        if (this.state.parry.attacksRemaining <= 0) {
            const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
            if (c) { c.style.setProperty('--s', '1'); c.style.setProperty('--ty', '0px'); c.classList.remove('z-50'); }
            this.sendEnemyToBack(e.id);

            this.clearHighlights();

            this.processStatusEffects(e, 'turn_end');

            if (this.skipUI()) {
                this.stepTurn();
            } else {
                setTimeout(() => this.stepTurn(), 1200);
            }
            return;
        }

        // Use Intent Target if Attack, or Random fallback
        let targetId = (e.nextIntent && e.nextIntent.type === 'attack' && e.nextIntent.targetId) ? e.nextIntent.targetId : null;
        let target = targetId ? (this.data.heroes.find(h => h.id === targetId) || this.getRandomAliveHero()) : this.getRandomAliveHero();

        if (target) {
            // Highlight for Parry Phase
            this.highlightCombatants(e.id, [target.id], 'hostile');
            this.triggerParryPhase(e, Math.floor(e.stats.atk + Math.random() * (e.stats.atk * 0.2)), target);
        } else {
            this.stepTurn();
        }
    },

    triggerParryPhase(attacker, damage, target) {
        // AutoGame: Skip parry UI, calculate automatically
        if (this.state.autoGameEnabled || this.skipUI()) {
            // Set parry state variables that resolveParry needs
            this.state.parry.active = true;
            this.state.parry.attacker = attacker;
            this.state.parry.target = target;
            this.state.parry.damage = damage;

            const parryChance = target.stats?.parry || 0;
            const didParry = Math.random() * 100 < parryChance;
            if (!this.skipUI()) {
                console.log(`[AUTOGAME] Auto-parry: ${didParry ? 'SUCCESS' : 'FAIL'} (${parryChance}% chance)`);
            }
            this.resolveParry(didParry ? 'success' : 'fail');
            return;
        }

        const container = document.getElementById('parry-ui-container');
        const clickLayer = document.getElementById('parry-click-layer');
        const label = document.getElementById('parry-label');
        if (!container) return;
        container.classList.remove('opacity-0', 'translate-y-4');
        if (clickLayer) clickLayer.classList.remove('hidden');
        if (label) { label.innerHTML = `DEFEND ${target.name.toUpperCase()}!`; label.classList.value = "text-sm font-black italic text-stone-300 tracking-widest mb-2 shadow-black drop-shadow-md bg-black/60 px-4 py-1 rounded-full backdrop-blur"; }
        this.state.parry.active = true;
        this.state.parry.attacker = attacker;
        this.state.parry.target = target;
        this.state.parry.damage = damage;
        const cursor = document.getElementById('parry-cursor');
        if (cursor) { cursor.style.animation = 'none'; void cursor.offsetWidth; cursor.classList.remove('opacity-0'); }
        const widthPct = Math.max(10, 8 + (target.attributes.agi * 0.3));
        const duration = Math.max(0.8, (1.8 - (attacker.stats.aspd - 150) * 0.02) * (0.95 + Math.random() * 0.1));
        container.style.setProperty('--dur', `${duration}s`);
        const zone = document.getElementById('parry-success-zone');
        const leftRed = document.getElementById('parry-risk-left');
        const rightRed = document.getElementById('parry-risk-right');
        const randomLeft = 30 + Math.random() * (65 - widthPct);
        if (zone) { zone.style.left = `${randomLeft}%`; zone.style.width = `${widthPct}%`; }
        if (leftRed) leftRed.style.width = `${randomLeft}%`;
        if (rightRed) rightRed.style.width = `${100 - (randomLeft + widthPct)}%`;
        container.classList.add('parry-active');
        if (cursor) cursor.style.animation = `parryMove ${duration}s linear forwards`;
        this.state.parry.timeout = setTimeout(() => { if (this.state.parry.active) this.resolveParry('timeout'); }, duration * 1000);
    },

    attemptParry() {
        if (!this.state.parry.active) return;
        const cursor = document.getElementById('parry-cursor');
        const zone = document.getElementById('parry-success-zone');
        const computedStyle = window.getComputedStyle(cursor);
        const left = computedStyle.left;
        cursor.style.animation = 'none';
        cursor.style.left = left;
        const cRect = cursor.getBoundingClientRect();
        const zRect = zone.getBoundingClientRect();
        const success = (cRect.left + cRect.width / 2) >= zRect.left && (cRect.left + cRect.width / 2) <= zRect.right;
        this.resolveParry(success ? 'success' : 'click_fail');
    },

    resolveParry(result) {
        clearTimeout(this.state.parry.timeout);
        this.state.parry.active = false;
        const container = document.getElementById('parry-ui-container');
        const label = document.getElementById('parry-label');
        const clickLayer = document.getElementById('parry-click-layer');
        if (clickLayer) clickLayer.classList.add('hidden');
        let finalDmg = this.state.parry.damage;
        if (result === 'success') {
            finalDmg = Math.floor(finalDmg * 0.3);
            if (label) { label.innerHTML = "PARRY SUCCESS!"; label.classList.add('text-emerald-400'); }
            if (this.playEffect) this.playEffect('parry');
            // Audio: Parry success
            if (this.audioManager && this.state.parry.attacker && this.state.parry.target) {
                this.audioManager.play('parry', { attacker: this.state.parry.attacker, target: this.state.parry.target });
            }
            this.log(`Parry Success! Reduced damage.`);
        } else {
            if (label) {
                if (result === 'timeout') { label.innerHTML = "TOO SLOW!"; label.classList.add('text-red-500'); }
                else { label.innerHTML = "BAD TIMING!"; label.classList.add('text-orange-500'); }
            }
            if (this.playEffect) this.playEffect('crit');
            this.log(`Defense Failed.`);
        }
        const processResolve = () => {
            if (!this.skipUI()) {
                container.classList.add('opacity-0', 'translate-y-4');
                container.classList.remove('parry-active');
                document.getElementById('parry-cursor').classList.add('opacity-0');
            }
            this.damageEntity(this.state.parry.target, finalDmg, result !== 'success', 'physical', this.state.parry.attacker);
            this.state.parry.attacksRemaining--;

            if (this.skipUI()) {
                this.executeNextEnemyAttack(this.state.parry.attacker);
            } else {
                setTimeout(() => { this.executeNextEnemyAttack(this.state.parry.attacker); }, 800);
            }
        };

        if (this.skipUI()) {
            processResolve();
        } else {
            setTimeout(processResolve, 500);
        }
    },

    damageEntity(target, amt, isCrit, type = 'physical', attacker = null, ignoreDef = 0, isReflected = false) {
        let damage = amt;
        // Miss Calculation
        if (attacker && type === 'physical' && !isCrit) {
            const hitChance = 100 + (attacker.stats.hit - target.stats.flee);
            if (Math.random() * 100 > hitChance) {
                if (!this.skipUI()) {
                    // Determine root for Floater
                    let missRoot = null;
                    if (target.isPlayer) {
                        // Check if hero card exists
                        const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                        if (card) missRoot = card.querySelector('.floater-root');
                    } else {
                        const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                        if (card) missRoot = card.querySelector('.floater-root') || card;
                    }
                    this.spawnFloater("MISS", false, null, false, missRoot, 'miss');
                    // Audio: Miss
                    if (this.audioManager) {
                        this.audioManager.play('miss', { attacker, target });
                    }
                }
                this.log(`${attacker.name} missed ${target.name}!`); return;
            }
        }

        // --- Level Gap Multiplier: Dominate lower-level enemies ---
        if (attacker && attacker.level && target.level && type !== 'status') {
            const levelGap = attacker.level - target.level;
            if (levelGap > 0) {
                // +2% damage per level advantage, capped at +200%
                const multiplier = Math.min(2.0, 1 + (levelGap * 0.02));
                damage = Math.floor(damage * multiplier);

                // Log extreme dominance (gap >= 50)
                if (levelGap >= 50) {
                    this.log(`Level Dominance: ${attacker.name} (Lv${attacker.level}) overwhelms ${target.name} (Lv${target.level})!`);
                }
            }
        }

        // --- Elemental Effectiveness System ---
        let elementalMultiplier = 1.0;
        let elementalCategory = 'normal';
        if (attacker && window.elementalData && type !== 'status') {
            // Get attack element - ONLY from activeSkill, NOT from character element
            // Character element affects DEFENSE only, not basic attacks
            const attackElement = attacker.activeSkill?.element || 'neutral';
            const defenseElement = target.element || 'neutral';

            // Calculate multiplier
            elementalMultiplier = window.elementalData.getMultiplier(attackElement, defenseElement);
            elementalCategory = window.elementalData.getEffectivenessCategory(elementalMultiplier);

            // Handle special cases
            if (elementalMultiplier === 0) {
                // IMMUNE
                if (!this.skipUI()) {
                    let immuneRoot = null;
                    if (target.isPlayer) {
                        const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                        if (card) immuneRoot = card.querySelector('.floater-root');
                    } else {
                        const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                        if (card) immuneRoot = card.querySelector('.floater-root') || card;
                    }
                    this.spawnFloater('IMMUNE!', false, null, false, immuneRoot, 'immune');
                }
                this.log(`${target.name} is IMMUNE to ${attackElement} attacks!`);
                return;
            } else if (elementalMultiplier < 0) {
                // ABSORB (heal instead of damage)
                target.hp = Math.min(target.maxHp, target.hp + healAmount);

                if (!this.skipUI()) {
                    let absorbRoot = null;
                    if (target.isPlayer) {
                        const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                        if (card) absorbRoot = card.querySelector('.floater-root');
                        this.updateHeroUI(target.id);
                    } else {
                        const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                        if (card) absorbRoot = card.querySelector('.floater-root') || card;
                        this.updateEnemyBars(target);
                    }

                    this.spawnFloater(`+${healAmount}`, false, null, true, absorbRoot, 'heal');
                }
                this.log(`${target.name} ABSORBED ${attackElement} energy and healed ${healAmount} HP!`);
                return;
            }

            // Apply elemental multiplier to damage
            damage = Math.floor(damage * elementalMultiplier);
        }

        // 1. Apply attacker damage buff (from SkillEngine)
        if (attacker?.buffedDamageDealt && type !== 'status') {
            damage = Math.floor(damage * attacker.buffedDamageDealt);
        }

        // 2. Damage Mitigation (Defense)
        if (!isCrit && target.stats && type !== 'status') {
            if (type === 'magic') {
                damage = Math.max(1, damage - (target.stats.mdef || 0) * (1 - ignoreDef));
            } else {
                const effectiveSoftDef = target.stats.softDef * (1 - ignoreDef);
                const effectiveHardDef = target.stats.hardDef * (1 - ignoreDef);
                // Standard RO formula: (ATK - SoftDef) * (4000 / (4000 + HardDef))
                damage = Math.max(1, Math.floor((damage - effectiveSoftDef) * (4000 / (4000 + effectiveHardDef))));
            }
        }

        // 3. Apply target damage taken modifier (e.g., 0.5 for 50% reduction)
        if (target?.buffedDamageTaken && type !== 'status') {
            damage = Math.floor(damage * target.buffedDamageTaken);
        }

        // 4. Parry Stance: Check parry chance from buffs
        if (target?.buffedParryChance && Math.random() < target.buffedParryChance) {
            this.log(`${target.name} parried the attack!`);
            if (!this.skipUI()) {
                this.spawnFloater("PARRY", false, null, false, null, 'miss');
                // Audio: Parry
                if (this.audioManager) {
                    this.audioManager.play('parry', { attacker, target });
                }
            }
            return;
        }

        // Legacy status effect parry (for backward compatibility)
        if (target.statusEffects?.some(s => s.id === 'parry')) {
            if (Math.random() < 0.3) {
                this.log(`${target.name} parried the attack!`);
                if (!this.skipUI()) {
                    this.spawnFloater("PARRY", false, null, false, null, 'miss');
                    // Audio: Parry
                    if (this.audioManager) {
                        this.audioManager.play('parry', { attacker, target });
                    }
                }
                return;
            }
        }

        if (!this.skipUI()) {
            // Audio: Hit (antes de aplicar dano)
            if (this.audioManager && attacker) {
                const skill = attacker.activeSkill || null;
                this.audioManager.play('hit', { attacker, target, skill });
            }

            // Audio: Crit (se crítico)
            if (this.audioManager && isCrit && attacker) {
                this.audioManager.play('crit', { attacker, target });
            }
        }

        // Check for Reflect Shield before applying damage (only if not already reflected to prevent infinite loops)
        let reflectedDamage = 0;
        if (attacker && !isReflected && target.activeBuffs) {
            const reflectBuff = target.activeBuffs.find(b =>
                (b.data && b.data.id === 'reflect_shield') ||
                (b.id === 'reflect_shield')
            );

            if (reflectBuff) {
                const reflectPercent = reflectBuff.data?.reflectPercent || reflectBuff.reflectPercent || 0.35;
                reflectedDamage = Math.floor(damage * reflectPercent);

                if (reflectedDamage > 0) {
                    // Apply reflected damage to attacker (mark as reflected to prevent infinite loops)
                    this.damageEntity(attacker, reflectedDamage, false, type, target, 0, true);

                    if (!this.skipUI()) {
                        // Visual feedback on attacker
                        const attackerCard = attacker.isPlayer
                            ? document.querySelector(`.hero-card-instance[data-id="${attacker.id}"]`)
                            : document.querySelector(`.enemy-card-instance[data-id="${attacker.id}"]`);
                        if (attackerCard) {
                            const root = attackerCard.querySelector('.floater-root') || attackerCard;
                            this.spawnFloater(`REFLECT ${reflectedDamage}`, false, null, false, root, 'reflect');
                        }
                    }

                    this.log(`${target.name}'s Reflect Shield reflects ${reflectedDamage} damage back to ${attacker.name}!`);
                }
            }
        }

        target.hp = Math.max(0, target.hp - damage);

        // Detailed Debug Log
        this.debug('DAMAGE', `${attacker ? attacker.name : 'Environment'} deals ${damage} (${type}) to ${target.name}`, {
            attacker: attacker ? attacker.name : 'Environment',
            target: target.name,
            baseDamage: amt,
            finalDamage: damage,
            isCrit: isCrit,
            type: type,
            mitigation: amt - damage,
            reflected: reflectedDamage
        });

        if (!this.skipUI()) {
            // Audio: Damage taken (após aplicar dano)
            if (this.audioManager) {
                this.audioManager.play('damage_taken', { target, damageType: type });
            }

            // Play hit juice (flash + shake)
            this.playHitJuice(attacker, target, { isCrit, damageType: type });

            // Determine floater root
            let floaterRoot = null;
            if (target.isPlayer) {
                const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                floaterRoot = card?.querySelector('.floater-root');
            } else {
                const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                floaterRoot = card?.querySelector('.floater-root') || card;
            }

            // Show elemental effectiveness text
            if (elementalCategory === 'super') {
                this.spawnFloater('SUPER EFFECTIVE!', false, null, false, floaterRoot, 'super-effective');
                // Audio: Super effective
                if (this.audioManager && attacker) {
                    this.audioManager.play('super_effective', { attacker, target });
                }
            } else if (elementalCategory === 'weak') {
                this.spawnFloater('INEFFECTIVE', false, null, false, floaterRoot, 'not-effective');
            }
        }

        if (target.isPlayer) {
            if (!this.skipUI()) {
                this.updateHeroUI(target.id);
                const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                if (card) {
                    const root = card.querySelector('.floater-root');
                    this.spawnFloater(Math.floor(damage), isCrit, null, false, root, isCrit ? 'crit' : '');
                }
            }
            if (target.hp <= 0) {
                if (!this.skipUI()) {
                    const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
                    if (card) {
                        card.classList.add('dead');
                        card.style.transition = 'all 0.5s ease-out'; card.style.opacity = '0'; card.style.transform = 'scale(0.8) translateY(20px)'; card.style.pointerEvents = 'none';
                    }
                    // Audio: Death
                    if (this.audioManager) {
                        this.audioManager.play('death', { target });
                    }
                }
                this.log(`${target.name} collapsed!`);
                // Move to graveyard and re-render
                if (this.skipUI()) {
                    this.renderHeroes();
                    this.renderGraveyard();
                    this.updateLayout();
                } else {
                    setTimeout(() => {
                        this.renderHeroes();
                        this.renderGraveyard();
                        this.updateLayout();
                    }, 500);
                }
            }
        } else {
            if (!this.skipUI()) {
                const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                if (card) {
                    this.updateEnemyBars(target);
                    const floaterRoot = card.querySelector('.floater-root') || card;
                    this.spawnFloater(Math.floor(damage), isCrit, null, false, floaterRoot, isCrit ? 'crit' : '');
                }
            }
            if (target.hp <= 0) {
                if (!this.skipUI()) {
                    const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
                    if (card) {
                        card.classList.add('dead');
                        card.style.transition = 'all 0.5s ease-out'; card.style.opacity = '0'; card.style.transform = 'scale(0.8) translateY(20px)'; card.style.pointerEvents = 'none';
                    }
                    // Audio: Death
                    if (this.audioManager) {
                        this.audioManager.play('death', { target });
                    }
                }
                this.log(`${target.name} defeated.`);
                // Move to graveyard and re-render
                if (this.skipUI()) {
                    this.renderEnemies();
                    this.renderGraveyard();
                    this.updateLayout();
                } else {
                    setTimeout(() => {
                        this.renderEnemies();
                        this.renderGraveyard();
                        this.updateLayout();
                    }, 500);
                }
            }
        }
    },

    playHitJuice(attacker, target, { isCrit = false, damageType = 'physical' }) {
        if (this.skipUI()) return;
        const targetCard = target.isPlayer
            ? document.querySelector(`.hero-card-instance[data-id="${target.id}"]`)
            : document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);

        if (!targetCard) return;

        // Flash effect (white for physical, blue tint for magic)
        targetCard.classList.add('hit-flash');
        if (damageType === 'magic') {
            targetCard.classList.add('hit-flash-magic');
        }
        setTimeout(() => {
            targetCard.classList.remove('hit-flash', 'hit-flash-magic');
        }, isCrit ? 80 : 50);

        // Shake directional based on attacker position
        const attackerCard = attacker
            ? (attacker.isPlayer
                ? document.querySelector(`.hero-card-instance[data-id="${attacker.id}"]`)
                : document.querySelector(`.enemy-card-instance[data-id="${attacker.id}"]`))
            : null;

        if (attackerCard) {
            const attackerRect = attackerCard.getBoundingClientRect();
            const targetRect = targetCard.getBoundingClientRect();
            const dx = targetRect.left - attackerRect.left; // Positive = attacker is left, target shakes right
            const shakeIntensity = isCrit ? 8 : 4;
            const shakeX = dx > 0 ? shakeIntensity : -shakeIntensity;

            targetCard.style.setProperty('--shake-x', `${shakeX}px`);
            targetCard.classList.add('hit-shake');
            setTimeout(() => {
                targetCard.classList.remove('hit-shake');
                targetCard.style.removeProperty('--shake-x');
            }, isCrit ? 200 : 150);
        } else {
            // Fallback: simple shake
            targetCard.classList.add('hit-shake');
            targetCard.style.setProperty('--shake-x', `${isCrit ? 6 : 3}px`);
            setTimeout(() => {
                targetCard.classList.remove('hit-shake');
                targetCard.style.removeProperty('--shake-x');
            }, isCrit ? 200 : 150);
        }
    },

    showUltimateCutIn(hero, skill) {
        if (this.skipUI()) return Promise.resolve();
        return new Promise((resolve) => {
            const container = document.getElementById('battlefield-container') || document.body;

            // Speed lines covering entire screen (behind cards, above background)
            const speedLines = document.createElement('div');
            speedLines.className = 'ultimate-speedlines ultimate-speedlines-anim';
            // Adicionar sweep diagonal para mais impacto
            const sweep = document.createElement('div');
            sweep.className = 'ultimate-speedlines-sweep';
            speedLines.appendChild(sweep);
            container.appendChild(speedLines);

            const banner = document.createElement('div');
            banner.className = 'fixed left-0 top-1/2 -translate-y-1/2 z-[10000] pointer-events-none w-full';

            const skillImg = skill.img || '';
            const skillIcon = skill.icon || 'zap';
            const skillName = skill.name || 'ULTIMATE';

            // Anime-style passing stripe (keeps battlefield visible; no solid modal/backdrop)
            banner.innerHTML = `
                <div class="ultimate-pass-row relative w-full flex items-center justify-center">
                    <!-- soft glow behind the stripe -->
                    <div class="absolute inset-x-0 h-36 bg-gradient-to-r from-transparent via-red-500/20 to-transparent blur-3xl opacity-90"></div>

                    <div class="ultimate-pass-strip ultimate-pass-anim relative">
                        <div class="ultimate-pass-inner ultimate-pass-inner-anim relative flex items-center gap-5 px-10 py-5 rounded-2xl border border-red-300/35 shadow-[0_0_90px_rgba(239,68,68,0.45)] backdrop-blur-md bg-gradient-to-r from-black/35 via-red-600/25 to-black/35">
                            <!-- diagonal accent -->
                            <div class="absolute inset-0 rounded-2xl overflow-hidden">
                                <div class="absolute -left-24 top-0 h-full w-56 bg-gradient-to-r from-transparent via-red-400/25 to-transparent rotate-12"></div>
                                <div class="absolute -right-24 top-0 h-full w-56 bg-gradient-to-r from-transparent via-red-300/15 to-transparent -rotate-12"></div>
                                <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent"></div>
                                <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent"></div>
                            </div>

                            <!-- icon -->
                            <div class="relative z-10 w-14 h-14 rounded-2xl bg-red-500/25 border-2 border-red-200/40 shadow-[0_0_40px_rgba(239,68,68,0.65)] flex items-center justify-center">
                                ${skillImg
                    ? `<img src="${skillImg}" class="w-10 h-10 object-cover rounded-xl" />`
                    : `<i data-lucide="${skillIcon}" class="w-9 h-9 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"></i>`
                }
                            </div>

                            <!-- text -->
                            <div class="relative z-10 flex flex-col leading-none">
                                <div class="text-[10px] font-black text-red-200 uppercase tracking-[0.75em] opacity-95 drop-shadow-[0_0_10px_rgba(239,68,68,0.55)]">
                                    ULTIMATE
                                </div>
                                <div class="text-4xl md:text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_45px_rgba(239,68,68,0.75)] uppercase whitespace-nowrap">
                                    ${skillName}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(banner);
            this.refreshIcons();

            // Remove + resolve after animation finishes
            setTimeout(() => {
                banner.remove();
                speedLines.remove();
                resolve();
            }, 2600);
        });
    },

    initBackgroundParticles() {
        const container = document.getElementById('battlefield-container');
        if (!container) {
            console.warn('[PARTICLES] battlefield-container not found');
            return;
        }

        // Create Canvas if not exists
        let canvas = document.getElementById('combat-particles-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'combat-particles-canvas';
            canvas.className = 'absolute inset-0 z-0 pointer-events-none';
            canvas.style.opacity = '0.8'; // More visible
            container.insertBefore(canvas, container.firstChild);
        }

        const ctx = canvas.getContext('2d');
        let particles = [];
        let activeColor = '#d4af37'; // Default gold
        let particleSpeed = 1.0; // Normal speed multiplier

        const resize = () => {
            canvas.width = container.offsetWidth || window.innerWidth;
            canvas.height = container.offsetHeight || window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1.5; // Larger particles (1.5-4.5)
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5 - 0.5; // Drift up
                this.color = activeColor;
                this.life = Math.random() * 200 + 100;
                this.maxLife = this.life;
                this.alpha = 0; // Start invisible
                this.fadeIn = true;
                this.fadeSpeed = 0.02; // Smooth fade in/out
            }
            update() {
                this.x += this.speedX * particleSpeed;
                this.y += this.speedY * particleSpeed;
                this.life--;

                // Smooth fade in/out
                const lifeRatio = this.life / this.maxLife;
                if (lifeRatio > 0.8) {
                    // Fade in (first 20% of life)
                    this.alpha = Math.min(0.8, this.alpha + this.fadeSpeed);
                } else if (lifeRatio < 0.2) {
                    // Fade out (last 20% of life)
                    this.alpha = Math.max(0, this.alpha - this.fadeSpeed);
                } else {
                    // Full visibility (middle 60% of life)
                    this.alpha = 0.8;
                }

                if (this.life <= 0 || this.y < -20) {
                    this.reset();
                }
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * (canvas.height + 50);
                this.life = Math.random() * 200 + 100;
                this.maxLife = this.life;
                this.color = activeColor;
                this.alpha = 0; // Start invisible for smooth fade in
                this.fadeIn = true;
                this.speedY = (Math.random() - 0.5) * 0.5 - 0.2;
            }
            draw() {
                // Extra smoothness: fade near the top edge so "reset" doesn't look abrupt
                const topFadeBand = canvas.height * 0.18;
                const edgeFade = this.y < topFadeBand ? Math.max(0, this.y / topFadeBand) : 1;
                ctx.globalAlpha = Math.min(1, this.alpha * edgeFade);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }

        // Initialize particles (reduced for smoother appearance)
        for (let i = 0; i < 45; i++) {
            particles.push(new Particle());
        }

        const self = this;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        };
        animate();

        // Store particle controls for skill reactions
        this._particleSystem = {
            setColor: (color) => {
                activeColor = color;
                particles.forEach(p => p.color = color);
            },
            setSpeed: (speed) => { particleSpeed = speed; },
            reset: () => {
                activeColor = '#d4af37';
                particleSpeed = 1.0;
                particles.forEach(p => p.color = activeColor);
            }
        };
    },

    // React particles to skill effects
    reactParticlesToSkill(skill) {
        if (!this._particleSystem) return;

        const skillName = skill.name ? skill.name.toLowerCase() : '';

        // Fireball - orange particles
        if (skillName.includes('fireball') || skillName.includes('fire') || skillName.includes('meteor')) {
            this._particleSystem.setColor('#ff6b35'); // Orange
            setTimeout(() => {
                if (this._particleSystem) this._particleSystem.reset();
            }, 2000);
        }
        // Ice Prison - freeze particles
        else if (skillName.includes('ice') || skillName.includes('frost') || skillName.includes('freeze') || skillName.includes('prison')) {
            this._particleSystem.setSpeed(0); // Freeze
            setTimeout(() => {
                if (this._particleSystem) {
                    this._particleSystem.setSpeed(1.0);
                    this._particleSystem.setColor('#87ceeb'); // Light blue
                }
            }, 1000);
            setTimeout(() => {
                if (this._particleSystem) this._particleSystem.reset();
            }, 2000);
        }
    },


    updateEnemyBars(e) {
        const card = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
        if (!card) return;
        const hpBar = card.querySelector('.enemy-hp-bar');
        const bloodBar = card.querySelector('.blood-bar');
        const mpBar = card.querySelector('.enemy-mana-bar');
        const hpText = card.querySelector('.enemy-hp-text');
        const mpText = card.querySelector('.enemy-mana-text');

        const hpPct = (e.hp / e.maxHp) * 100;
        if (hpBar) hpBar.style.width = `${hpPct}%`;
        if (bloodBar) bloodBar.style.width = `${hpPct}%`;
        if (mpBar) mpBar.style.width = `${(e.mana / (e.maxMana || 1)) * 100}%`;
        if (hpText) hpText.innerText = Math.floor(e.hp);
        if (mpText) mpText.innerText = Math.floor(e.mana || 0);

        this.renderStatusIcons(e, card.querySelector('.status-container-left'), card.querySelector('.status-container-right'));

        // Visual cues for incapacitation
        // Visual cues for incapacitation (Icons only)

        this.refreshIcons();
    },

    applyStatus(target, effectData, attacker) {
        // Roll for skill application chance (0.1 to 1.0 scale)
        const roll = Math.random();
        if (roll > (effectData.chance || 1)) return; // Failed to apply

        // Resist chance calculation
        let resist = 0;
        if (effectData.id === 'stun' || effectData.id === 'poison' || effectData.id === 'freeze') resist = (target.attributes.vit * 0.4);
        if (effectData.id === 'burn' || effectData.id === 'paralyze') resist = (target.attributes.int * 0.3);
        if (effectData.id === 'bleed') resist = (target.attributes.agi * 0.2 + target.attributes.vit * 0.2);

        if (Math.random() * 100 < resist) {
            this.log(`${target.name} resisted ${effectData.id}!`);
            const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
            const resistRoot = target.id === 'player' ? null : (card ? (card.querySelector('.floater-root') || card) : null);
            this.spawnFloater("RESIST", false, target.id === 'player' ? 'player-floater-root' : null, false, resistRoot, 'miss');
            return;
        }

        // Check if already has status to refresh duration
        const existing = target.statusEffects.find(e => e.id === effectData.id);
        if (existing) {
            existing.duration = Math.max(existing.duration, effectData.duration);
        } else {
            // All effects now tick at turn_start for better clarity
            target.statusEffects.push({
                id: effectData.id,
                duration: effectData.duration,
                tick: 'turn_start'
            });
            const info = this.getStatusInfo(effectData.id);
            this.debug('STATUS', `${target.name} affected by ${info.name}`, { effect: effectData, targetId: target.id, currentEffects: target.statusEffects });
            this.log(`${target.name} is now affected by ${info.name}!`);

            // Show local floater on the affected card instead of broadcast
            const cardSelector = target.isPlayer
                ? `.hero-card-instance[data-id="${target.id}"]`
                : `.enemy-card-instance[data-id="${target.id}"]`;
            const card = document.querySelector(cardSelector);
            if (card) {
                const floaterRoot = card.querySelector('.floater-root');
                const floaterClass = (effectData.id === 'burn' || effectData.id === 'bleed' || effectData.id === 'poison')
                    ? `floater-${effectData.id}-damage` : '';
                this.spawnFloater(info.name, false, null, false, floaterRoot, floaterClass);
            }
        }

        // If enemy is incapacitated, clear intent and update UI immediately
        if (!target.isPlayer && ['stun', 'freeze', 'sleep'].includes(effectData.id)) {
            target.nextIntent = null;
            this.clearEnemyIntentUI(target.id);
            this.renderEnemyTargetMarkers();
        }

        if (target.id === 'player') this.updatePlayerUI();
        else this.updateEnemyBars(target);
    },

    processStatusEffects(entity, timing) {
        let skipTurn = false;
        if (!entity.statusEffects || entity.hp <= 0) return false;

        entity.statusEffects.forEach((effect) => {
            // Default to turn_start so legacy effects still behave consistently
            const tickTiming = effect.tick || 'turn_start';
            if (tickTiming !== timing) return;

            // --- Consolidated logic at Turn Start for clarity ---
            if (timing === 'turn_start') {
                let dmg = 0;
                let logMsg = '';

                if (effect.id === 'burn') {
                    dmg = Math.floor(entity.maxHp * 0.05);
                    logMsg = `${entity.name} takes BURN damage: -${dmg} HP`;
                } else if (effect.id === 'bleed') {
                    dmg = Math.floor(entity.hp * 0.1);
                    logMsg = `${entity.name} takes BLEED damage: -${dmg} HP`;
                } else if (effect.id === 'poison') {
                    dmg = 35; // Balanced
                    logMsg = `${entity.name} takes POISON damage: -${dmg} HP`;
                }

                if (dmg > 0) {
                    this.log(logMsg);
                    this.damageEntity(entity, dmg, false, 'status');
                }

                // Check for turn-skipping effects BEFORE reducing duration
                if (effect.id === 'stun' || effect.id === 'freeze' || effect.id === 'paralyze') {
                    let failAction = false;
                    if (effect.id === 'paralyze') {
                        if (Math.random() < 0.5) failAction = true;
                    } else {
                        failAction = true;
                    }

                    if (failAction) {
                        skipTurn = true;
                        this.log(`${entity.name} is ${effect.id.toUpperCase()} and cannot act!`);
                        this.showToastNotification(`${effect.id.toUpperCase()}ED!`, false);
                    }
                }
            }

            // IMPORTANT: decrement duration ONLY on the effect's tick timing.
            // Previously we decremented on both turn_start and turn_end calls,
            // making effects expire twice as fast and causing icons to "disappear" early.
            effect.duration--;
        });

        // Filter out expired effects
        const expired = entity.statusEffects.some(e => e.duration <= 0);
        entity.statusEffects = entity.statusEffects.filter(e => e.duration > 0);

        if (expired) {
            if (entity.id === 'player') this.updatePlayerUI();
            else this.renderEnemies(); // Full re-render to ensure UI consistency
        }

        // Process buffs/debuffs (new system)
        if (window.SkillEngine) {
            SkillEngine.processBuffs(entity, timing);
        }

        return skipTurn;
    },

    refreshIcons() {
        if (this.skipUI()) return;
        if (window.lucide) lucide.createIcons();
    },

    generateSimulationReport() {
        if (!this.state.history || this.state.history.length === 0) return "No history recorded.";

        let report = `\n========== COMBAT SIMULATION REPORT ==========\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `Turns Total: ${this.state.turnCount}\n`;
        report += `----------------------------------------------\n`;

        this.state.history.forEach(entry => {
            const turnStr = entry.turn !== undefined ? `[Turn ${entry.turn.toString().padStart(2, '0')}]` : `[System ]`;
            report += `${turnStr} [${entry.category.padEnd(8)}] ${entry.message}\n`;
        });

        report += `==============================================\n`;
        return report;
    },

    // Audio Control Functions
    toggleMusic() {
        const isMuted = localStorage.getItem('combat_music_muted') === 'true';
        const newState = !isMuted;
        localStorage.setItem('combat_music_muted', newState);

        // Toggle battle music
        if (this.audio.battle) {
            this.audio.battle.muted = newState;
            if (newState) {
                this.audio.battle.pause();
            } else if (this.state.isActive) {
                this.audio.battle.play().catch(() => { });
            }
        }

        // Update button visual state
        const btn = document.getElementById('btn-toggle-music');
        if (btn) {
            const icon = btn.querySelector('i');
            const stateText = btn.querySelector('.music-state');

            if (newState) {
                // MUTED STATE
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-x');
                    icon.classList.remove('text-amber-400');
                    icon.classList.add('text-red-400');
                }
                btn.classList.remove('bg-amber-500/10', 'border-amber-500/30', 'hover:bg-amber-500/20');
                btn.classList.add('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                if (stateText) {
                    stateText.textContent = 'OFF';
                    stateText.classList.remove('text-amber-300');
                    stateText.classList.add('text-red-300');
                }
            } else {
                // UNMUTED STATE
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-2');
                    icon.classList.remove('text-red-400');
                    icon.classList.add('text-amber-400');
                }
                btn.classList.remove('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                btn.classList.add('bg-amber-500/10', 'border-amber-500/30', 'hover:bg-amber-500/20');
                if (stateText) {
                    stateText.textContent = 'ON';
                    stateText.classList.remove('text-red-300');
                    stateText.classList.add('text-amber-300');
                }
            }
            this.refreshIcons();
        }
    },

    toggleSFX() {
        const isMuted = localStorage.getItem('combat_sfx_muted') === 'true';
        const newState = !isMuted;
        localStorage.setItem('combat_sfx_muted', newState);

        // Update AudioManager if available
        if (this.audioManager) {
            this.audioManager.setMuted(newState);
        }

        // Update button visual state
        const btn = document.getElementById('btn-toggle-sfx');
        if (btn) {
            const icon = btn.querySelector('i');
            const stateText = btn.querySelector('.sfx-state');

            if (newState) {
                // MUTED STATE
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-x');
                    icon.classList.remove('text-blue-400');
                    icon.classList.add('text-red-400');
                }
                btn.classList.remove('bg-blue-500/10', 'border-blue-500/30', 'hover:bg-blue-500/20');
                btn.classList.add('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                if (stateText) {
                    stateText.textContent = 'OFF';
                    stateText.classList.remove('text-blue-300');
                    stateText.classList.add('text-red-300');
                }
            } else {
                // UNMUTED STATE
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-1');
                    icon.classList.remove('text-red-400');
                    icon.classList.add('text-blue-400');
                }
                btn.classList.remove('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                btn.classList.add('bg-blue-500/10', 'border-blue-500/30', 'hover:bg-blue-500/20');
                if (stateText) {
                    stateText.textContent = 'ON';
                    stateText.classList.remove('text-red-300');
                    stateText.classList.add('text-blue-300');
                }
            }
            this.refreshIcons();
        }
    },

    // Load audio preferences on init
    loadAudioPreferences() {
        const musicMuted = localStorage.getItem('combat_music_muted') === 'true';
        const sfxMuted = localStorage.getItem('combat_sfx_muted') === 'true';

        if (musicMuted && this.audio.battle) {
            this.audio.battle.muted = true;
        }

        if (sfxMuted && this.audioManager) {
            this.audioManager.setMuted(true);
        }

        // Update Music button visuals
        const musicBtn = document.getElementById('btn-toggle-music');
        if (musicBtn) {
            const icon = musicBtn.querySelector('i');
            const stateText = musicBtn.querySelector('.music-state');

            if (musicMuted) {
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-x');
                    icon.classList.remove('text-amber-400');
                    icon.classList.add('text-red-400');
                }
                musicBtn.classList.remove('bg-amber-500/10', 'border-amber-500/30', 'hover:bg-amber-500/20');
                musicBtn.classList.add('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                if (stateText) {
                    stateText.textContent = 'OFF';
                    stateText.classList.remove('text-amber-300');
                    stateText.classList.add('text-red-300');
                }
            }
        }

        // Update SFX button visuals
        const sfxBtn = document.getElementById('btn-toggle-sfx');
        if (sfxBtn) {
            const icon = sfxBtn.querySelector('i');
            const stateText = sfxBtn.querySelector('.sfx-state');

            if (sfxMuted) {
                if (icon) {
                    icon.setAttribute('data-lucide', 'volume-x');
                    icon.classList.remove('text-blue-400');
                    icon.classList.add('text-red-400');
                }
                sfxBtn.classList.remove('bg-blue-500/10', 'border-blue-500/30', 'hover:bg-blue-500/20');
                sfxBtn.classList.add('bg-red-500/10', 'border-red-500/30', 'hover:bg-red-500/20', 'opacity-60');
                if (stateText) {
                    stateText.textContent = 'OFF';
                    stateText.classList.remove('text-blue-300');
                    stateText.classList.add('text-red-300');
                }
            }
        }

        this.refreshIcons();
    },

    handleSummonSkill(skill, summoner) {
        const entityKey = skill.summonEntity;
        if (!entityKey) {
            this.log(`[ERROR] Summon skill ${skill.name} missing summonEntity`);
            return;
        }

        // Determine if summoner is ally (hero) or enemy
        const isAllySummon = summoner.isPlayer === true;
        const targetArray = isAllySummon ? this.data.heroes : this.data.enemies;
        const aliveTargets = targetArray.filter(e => e.hp > 0);

        // Check ally/enemy limit (max 3 total)
        if (aliveTargets.length >= 3) {
            const side = isAllySummon ? 'allies' : 'enemies';
            this.log(`Cannot summon: Maximum 3 ${side} reached!`);
            if (isAllySummon) {
                this.showToastNotification("Maximum 3 allies reached! Cannot summon more.");
            }
            return;
        }

        // Check if this summon type was already used by this side
        // Track separately for allies and enemies
        const summonKey = `${isAllySummon ? 'ally' : 'enemy'}_${entityKey}`;
        if (this.state.usedSummonTypes.includes(summonKey)) {
            this.log(`${summoner.name} cannot summon ${entityKey}: already used by ${isAllySummon ? 'allies' : 'enemies'}!`);
            return;
        }

        // Get entity definition
        const entityDef = this.data.entities[entityKey];
        if (!entityDef) {
            this.log(`[ERROR] Entity ${entityKey} not found in combatData`);
            this.showToastNotification(`Summon entity not found: ${entityKey}`);
            return;
        }

        // Create summon instance (similar to how enemies are hydrated)
        const summonSkills = (entityDef.skills || []).map(sid => {
            const s = this.data.skills[sid];
            return s ? { ...s, id: sid } : null;
        }).filter(s => s);

        // Create unique ID for the summon
        const summonIndex = targetArray.filter(h => h.isSummon).length;
        const summonId = `summon_${isAllySummon ? 'ally' : 'enemy'}_${summonIndex}_${entityKey}`;

        const summon = {
            ...JSON.parse(JSON.stringify(entityDef)), // Clone entity definition
            id: summonId,
            isPlayer: isAllySummon, // Controllable by player if ally, AI if enemy
            isSummon: true, // Flag to identify as summon
            summonerId: summoner.id, // Who summoned it
            summonerName: summoner.name,
            statusEffects: [],
            stats: {},
            attacks: 1,
            level: entityDef.baseLevel || 1,
            hp: 1, // Temporary - will be calculated
            maxHp: 1, // Temporary - will be calculated
            mana: 1, // Temporary - will be calculated
            maxMana: 1, // Temporary - will be calculated
            skills: summonSkills,
            xp: 0,
            gold: 0
        };

        // Calculate stats using SkillEngine (same as startBattle does for enemies)
        this.calculateStats(summon);

        // Set HP and Mana to max after calculation
        summon.hp = summon.maxHp;
        summon.mana = summon.maxMana;

        // Add to appropriate array (heroes or enemies)
        targetArray.push(summon);

        // Mark this summon type as used for this side
        if (!this.state.usedSummonTypes.includes(summonKey)) {
            this.state.usedSummonTypes.push(summonKey);
        }

        // Log
        this.log(`${summoner.name} summoned ${summon.name}!`);

        // Show summon animation
        this.showSummonAnimation(summon, summoner);

        // Re-render and update turn order
        setTimeout(() => {
            if (isAllySummon) {
                this.renderHeroes();
            } else {
                this.renderEnemies();
            }
            this.determineTurnOrder();
            this.updateTimelineUI();
            const sideText = isAllySummon ? 'joined' : 'appeared';
            this.showToastNotification(`${summon.name} ${sideText} the battle!`, true);
        }, 1000);
    },

    showSummonAnimation(summon, summoner) {
        // Create portal/summon effect
        const battlefield = document.getElementById('battlefield-container');
        if (!battlefield) return;

        const effect = document.createElement('div');
        effect.className = 'summon-effect fixed inset-0 z-[400] pointer-events-none';
        effect.innerHTML = `
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div class="summon-portal w-64 h-64 rounded-full border-4 border-blue-500/50 bg-blue-500/10 backdrop-blur-sm animate-pulse"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <i data-lucide="sparkles" class="w-16 h-16 text-blue-400 animate-spin"></i>
                </div>
            </div>
        `;
        battlefield.appendChild(effect);

        // Remove after animation
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => effect.remove(), 500);
        }, 1500);

        this.refreshIcons();
    },

    handleReviveSkill(skill, reviver) {
        // Determine if reviver is ally (hero) or enemy
        const isAllyRevive = reviver.isPlayer === true;
        const targetArray = isAllyRevive ? this.data.heroes : this.data.enemies;
        const aliveTargets = targetArray.filter(e => e.hp > 0);

        // Check ally/enemy limit (max 3 total)
        if (aliveTargets.length >= 3) {
            const side = isAllyRevive ? 'allies' : 'enemies';
            this.log(`Cannot revive: Maximum 3 ${side} reached!`);
            if (isAllyRevive) {
                this.showToastNotification("Maximum 3 allies reached! Cannot revive more.");
            }
            return;
        }

        // Get target ID from actionTargets
        const targetId = this.state.actionTargets[0];
        if (!targetId) {
            this.log(`[ERROR] No target selected for revive`);
            return;
        }

        // Find dead entity - must be in the correct array (allies revive allies, enemies revive enemies)
        const deadEntity = targetArray.find(e => e.id === targetId && e.hp <= 0);
        if (!deadEntity) {
            this.log(`[ERROR] Dead entity ${targetId} not found in ${isAllyRevive ? 'heroes' : 'enemies'} array`);
            this.showToastNotification(`Can only revive fallen ${isAllyRevive ? 'allies' : 'enemies'}!`);
            // Reset action targets to prevent turn loss
            this.state.actionTargets = [];
            this.state.phase = 'idle';
            this.updateTargetUI();
            return;
        }

        // Additional validation: if reviving as ally, target must be a hero (ally)
        if (isAllyRevive && !this.data.heroes.includes(deadEntity)) {
            this.log(`[ERROR] Cannot revive enemy as ally!`);
            this.showToastNotification(`Can only revive fallen allies!`);
            this.state.actionTargets = [];
            this.state.phase = 'idle';
            this.updateTargetUI();
            return;
        }

        // Restore HP (50%) and Mana (100%)
        deadEntity.hp = Math.floor(deadEntity.maxHp * 0.5);
        deadEntity.mana = deadEntity.maxMana;

        // Clear death-related status effects
        if (deadEntity.statusEffects) {
            deadEntity.statusEffects = deadEntity.statusEffects.filter(s =>
                !['death', 'dead'].includes(s.id)
            );
        }

        // Recalculate stats
        this.calculateStats(deadEntity);

        // Log
        this.log(`${reviver.name} revived ${deadEntity.name}!`);

        // Show revive animation
        this.showReviveAnimation(deadEntity, reviver);

        // Re-render and update turn order
        setTimeout(() => {
            if (isAllyRevive) {
                this.renderHeroes();
            } else {
                this.renderEnemies();
            }
            this.renderGraveyard();
            this.determineTurnOrder();
            this.updateTimelineUI();
            this.showToastNotification(`${deadEntity.name} has been revived!`, true);
        }, 1000);
    },

    showReviveAnimation(entity, reviver) {
        // Create revive effect
        const battlefield = document.getElementById('battlefield-container');
        if (!battlefield) return;

        const effect = document.createElement('div');
        effect.className = 'revive-effect fixed inset-0 z-[400] pointer-events-none';
        effect.innerHTML = `
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div class="revive-portal w-64 h-64 rounded-full border-4 border-green-500/50 bg-green-500/10 backdrop-blur-sm animate-pulse"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                    <i data-lucide="heart" class="w-16 h-16 text-green-400 animate-pulse"></i>
                </div>
            </div>
        `;
        battlefield.appendChild(effect);

        // Remove after animation
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease-out';
            setTimeout(() => effect.remove(), 500);
        }, 1500);

        this.refreshIcons();
    },

    openReviveSelectionModal() {
        const modal = document.getElementById('revive-selection-modal');
        if (!modal) return;

        // Get dead allies
        const deadAllies = this.data.heroes.filter(h => h.hp <= 0);

        // Update count
        const countEl = document.getElementById('revive-modal-count');
        if (countEl) {
            countEl.textContent = deadAllies.length === 1
                ? '1 fallen ally'
                : `${deadAllies.length} fallen allies`;
        }

        // Render ally cards
        const listEl = document.getElementById('revive-ally-list');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (deadAllies.length === 0) {
            listEl.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-lucide="heart-off" class="w-16 h-16 text-stone-600 mx-auto mb-4"></i>
                    <p class="text-stone-400 text-lg">No fallen allies to revive</p>
                </div>
            `;
            this.refreshIcons();
            return;
        }

        deadAllies.forEach(ally => {
            const card = document.createElement('div');
            card.className = 'revive-ally-card';
            card.setAttribute('data-ally-id', ally.id);

            const elementIcon = window.elementalData?.elements[ally.element];
            const elementHtml = elementIcon?.img
                ? `<img src="${elementIcon.img}" class="w-6 h-6 rounded object-cover" />`
                : `<i data-lucide="${elementIcon?.icon || 'circle'}" class="w-6 h-6" style="color: ${elementIcon?.color || '#fff'}"></i>`;

            card.innerHTML = `
                <div class="flex items-start gap-4">
                    ${ally.img ? `<img src="${ally.img}" class="w-20 h-20 rounded-lg object-cover border-2 border-stone-600" />` : ''}
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="text-xl font-black text-white">${ally.name}</h3>
                            ${elementHtml}
                        </div>
                        <p class="text-sm text-stone-400 mb-3">Level ${ally.level || ally.baseLevel || '?'} • ${ally.type || 'Hero'}</p>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2">
                                <i data-lucide="heart" class="w-4 h-4 text-red-400"></i>
                                <span class="text-xs text-stone-300">Will revive with ${Math.floor(ally.maxHp * 0.5)} HP (50%)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i data-lucide="zap" class="w-4 h-4 text-blue-400"></i>
                                <span class="text-xs text-stone-300">Will restore ${ally.maxMana} MP (100%)</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <i data-lucide="arrow-right" class="w-6 h-6 text-green-400"></i>
                    </div>
                </div>
            `;

            card.onclick = () => {
                // Remove previous selection
                listEl.querySelectorAll('.revive-ally-card').forEach(c => c.classList.remove('selected'));
                // Select this card
                card.classList.add('selected');

                // Set target - use ally.id directly, ensure targetMode is 'ally' for revive
                this.debug('REVIVE', `Setting actionTargets to ally: ${ally.name} (ID: ${ally.id})`);
                this.state.actionTargets = [ally.id];
                this.state.targetMode = 'ally'; // Important: set to 'ally' so it searches in heroes array
                this.state.phase = 'confirming';

                // Close modal first
                this.closeReviveSelectionModal();

                // Re-render graveyard immediately to show selected ally marked
                this.renderGraveyard();

                // Small delay to ensure modal is closed before updating UI
                setTimeout(() => {
                    // Verify target is still correct
                    if (this.state.actionTargets[0] === ally.id) {
                        this.debug('REVIVE', `Target verified: ${ally.id}`);
                        this.updateTargetUI();
                        // Re-render graveyard again to ensure visual state is correct
                        this.renderGraveyard();
                    } else {
                        this.debug('REVIVE', `ERROR: Target was changed! Expected ${ally.id}, got ${this.state.actionTargets[0]}`);
                        // Restore correct target
                        this.state.actionTargets = [ally.id];
                        this.state.targetMode = 'ally';
                        this.updateTargetUI();
                        this.renderGraveyard();
                    }
                }, 50);
            };

            listEl.appendChild(card);
        });

        this.refreshIcons();

        // Disable enemy card clicks while modal is open
        document.querySelectorAll('.enemy-card-instance').forEach(enemyCard => {
            enemyCard.style.pointerEvents = 'none';
            enemyCard.style.opacity = '0.5';
        });

        // Show modal
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
        }, 10);

        // Bind ESC key
        this._reviveModalEscHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeReviveSelectionModal();
            }
        };
        document.addEventListener('keydown', this._reviveModalEscHandler);
    },

    restoreEnemyCardsOpacity() {
        // Helper function to restore enemy cards opacity and pointer events
        document.querySelectorAll('.enemy-card-instance').forEach(enemyCard => {
            enemyCard.style.pointerEvents = '';
            enemyCard.style.opacity = '';
        });
    },

    closeReviveSelectionModal() {
        const modal = document.getElementById('revive-selection-modal');
        if (!modal) return;

        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);

        // Remove ESC handler
        if (this._reviveModalEscHandler) {
            document.removeEventListener('keydown', this._reviveModalEscHandler);
            this._reviveModalEscHandler = null;
        }

        // Reset state if no target selected
        if (this.state.actionTargets.length === 0 && this.state.selectedSkill?.type === 'revive') {
            this.state.selectedSkill = null;
            this.state.selectedActionType = null;
            this.state.phase = 'idle';
            this.updateTargetUI();
            // Restore enemy opacity when revive is fully cancelled
            this.restoreEnemyCardsOpacity();
        }
    },

    renderGraveyard() {
        const deadHeroes = this.data.heroes.filter(h => h.hp <= 0);
        const deadEnemies = this.data.enemies.filter(e => e.hp <= 0);

        // Helper function to create a chip
        const createChip = (entity, isHero) => {
            const chip = document.createElement('div');
            const activeHero = this.getActiveHero();
            // Revive mode only for player heroes reviving dead allies (heroes)
            const isReviveMode = this.state.phase === 'selecting_target' &&
                this.state.selectedSkill &&
                this.state.selectedSkill.type === 'revive' &&
                activeHero &&
                activeHero.isPlayer &&
                isHero; // Only allow reviving heroes (allies), not enemies

            // Check if this entity is selected for revive
            const isSelectedForRevive = isHero &&
                this.state.selectedSkill?.type === 'revive' &&
                this.state.actionTargets.includes(entity.id) &&
                this.state.phase === 'confirming';

            // Style chip based on selection state
            const borderClass = isSelectedForRevive
                ? 'border-green-500/80 ring-2 ring-green-500/50 bg-green-900/20'
                : 'border-red-500/30 hover:border-red-500/50';

            chip.className = `graveyard-chip bg-black/60 border ${borderClass} rounded-lg p-2 backdrop-blur-sm transition-all hover:bg-black/80 cursor-pointer`;
            chip.title = isSelectedForRevive
                ? `${entity.name} - Selected for revive`
                : `${entity.name} - Click to view stats`;
            chip.onclick = () => this.openStatsOverlay(entity.id);

            const elementIcon = window.elementalData?.elements[entity.element];
            const elementHtml = elementIcon?.img
                ? `<img src="${elementIcon.img}" class="w-4 h-4 rounded object-cover" />`
                : `<i data-lucide="${elementIcon?.icon || 'circle'}" class="w-4 h-4" style="color: ${elementIcon?.color || '#fff'}"></i>`;

            chip.innerHTML = `
                <div class="flex items-center gap-2">
                    ${entity.img ? `<img src="${entity.img}" class="w-8 h-8 rounded object-cover border border-white/10" />` : ''}
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-black text-white truncate">${entity.name}</div>
                        <div class="text-[10px] text-stone-400">Lv.${entity.level || entity.baseLevel || '?'}</div>
                    </div>
                    <div class="flex items-center gap-1">
                        ${elementHtml}
                        <i data-lucide="skull" class="w-3 h-3 text-red-400"></i>
                    </div>
                </div>
            `;
            return chip;
        };

        // Render dead allies (Desktop: left side, Mobile: bottom)
        const alliesGraveyard = document.getElementById('graveyard-allies');
        const alliesGraveyardMobile = document.getElementById('graveyard-allies-mobile');

        if (alliesGraveyard) {
            alliesGraveyard.innerHTML = '';
            deadHeroes.forEach(hero => {
                alliesGraveyard.appendChild(createChip(hero, true));
            });
        }

        if (alliesGraveyardMobile) {
            alliesGraveyardMobile.innerHTML = '';
            deadHeroes.forEach(hero => {
                alliesGraveyardMobile.appendChild(createChip(hero, true));
            });
        }

        // Render dead enemies (Desktop: right side, Mobile: top)
        const enemiesGraveyard = document.getElementById('graveyard-enemies');
        const enemiesGraveyardMobile = document.getElementById('graveyard-enemies-mobile');

        if (enemiesGraveyard) {
            enemiesGraveyard.innerHTML = '';
            deadEnemies.forEach(enemy => {
                enemiesGraveyard.appendChild(createChip(enemy, false));
            });
        }

        if (enemiesGraveyardMobile) {
            enemiesGraveyardMobile.innerHTML = '';
            deadEnemies.forEach(enemy => {
                enemiesGraveyardMobile.appendChild(createChip(enemy, false));
            });
        }

        this.refreshIcons();
    },

    // Consistently render enemies only once
    renderEnemies() {
        if (this.skipUI()) return;
        const c = document.getElementById('enemy-container'); if (!c) return; c.innerHTML = '';

        // Filter only alive enemies
        const aliveEnemies = this.data.enemies.filter(e => e.hp > 0);

        const isMobile = window.innerWidth < 1640 || window.innerHeight < 800;
        const isXL = window.innerWidth > 2300;
        const isDuel = this.data.heroes.filter(h => h.hp > 0).length === 1 && aliveEnemies.length === 1;

        // Responsive card sizing (same as heroes)
        let cardSizeClass;
        if (isDuel) {
            if (isXL) cardSizeClass = "w-[400px] h-[600px]"; // XL duel
            else if (isMobile) cardSizeClass = "w-[300px] h-[450px]"; // Mobile duel
            else cardSizeClass = "w-[360px] h-[540px]"; // Normal duel
        } else {
            if (isXL) cardSizeClass = "w-[280px] h-[420px]"; // XL party
            else if (isMobile) cardSizeClass = "w-[220px] h-[330px]"; // Mobile party
            else cardSizeClass = "w-[240px] h-[360px]"; // Normal party
        }

        aliveEnemies.forEach(e => {
            const el = document.createElement('div');
            el.className = `combat-card group relative ${cardSizeClass} cursor-pointer transition-all duration-500 enemy-card-instance pointer-events-auto`;
            el.setAttribute('data-id', e.id);
            el.onclick = () => {
                // Block enemy selection if revive is active (modal open OR in confirming phase)
                const reviveModal = document.getElementById('revive-selection-modal');
                const isReviveActive = (reviveModal && !reviveModal.classList.contains('hidden')) ||
                    (this.state.selectedSkill?.type === 'revive' &&
                        (this.state.phase === 'confirming' || this.state.phase === 'selecting_target'));

                if (isReviveActive) {
                    this.showToastNotification("Cannot select enemies while revive is active!");
                    return;
                }
                this.selectEnemyTarget(e.id);
            };

            const hpPct = (e.hp / e.maxHp) * 100;
            const mpPct = (e.mana / (e.maxMana || 1)) * 100;

            const mediaHtml = e.video ?
                `<video src="${e.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover rounded-2xl transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>` :
                `<div class="absolute inset-0 bg-cover bg-center rounded-2xl transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none" style="background-image: url('${e.img}');"></div>`;

            // Summon visual indicator for enemies
            const isSummon = e.isSummon === true;
            const summonBadge = isSummon ? `<div class="absolute -top-2 -right-2 z-50 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-yellow-300 shadow-lg flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i>
                <span>SUMMON</span>
            </div>` : '';

            el.innerHTML = `
            ${summonBadge}
            <div class="absolute inset-0 rounded-2xl border-[3.5px] ${isSummon ? 'border-yellow-500/60' : 'border-[#151515]'} bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-visible ring-1 ${isSummon ? 'ring-yellow-500/40' : 'ring-white/10'} transition-all duration-500 group-hover:ring-red-500/30 enemy-card-border" id="${e.id}-border">
                <!-- Media wrapper with overflow:hidden to prevent scale from escaping -->
                <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    ${mediaHtml}
                </div>
                <div class="floater-root absolute inset-0 z-50 pointer-events-none"></div>
                <div class="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
                <div class="target-marker"><div class="mira-ring-outer"></div><div class="mira-ring"></div><div class="mira-corners"><div class="mira-corner mira-corner-tl"></div><div class="mira-corner mira-corner-tr"></div><div class="mira-corner mira-corner-bl"></div><div class="mira-corner mira-corner-br"></div></div><i data-lucide="target" class="w-10 h-10 text-red-500/80 animate-pulse"></i></div>
                <!-- Status containers (top corners) -->
                <div class="status-container-left absolute top-2 left-2 flex flex-col gap-1 pointer-events-auto z-50"></div>
                <div class="status-container-right absolute top-2 right-2 flex flex-col gap-1 pointer-events-auto z-50"></div>

                <div class="absolute bottom-0 inset-x-0 p-4 z-20 pointer-events-none">
                    <div class="text-center mb-2 pointer-events-auto relative">
                        <div class="active-indicator absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-500 uppercase tracking-[0.4em] opacity-0 transition-all duration-500 scale-75">Current</div>
                        
                        <!-- Element Badge (above name, centered) -->
                        ${e.element && e.element !== 'neutral' && window.elementalData ? `
                            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-sm border border-white/25 shadow-lg mb-2">
                                ${window.elementalData.elements[e.element]?.img
                        ? `<img src="${window.elementalData.elements[e.element].img}" class="w-4 h-4 object-cover rounded" />`
                        : `<i data-lucide="${window.elementalData.elements[e.element]?.icon || 'circle'}" class="w-4 h-4" style="color: ${window.elementalData.elements[e.element]?.color || '#fff'}"></i>`
                    }
                                <span class="text-[10px] font-bold uppercase tracking-wider" style="color: ${window.elementalData.elements[e.element]?.color || '#fff'}">${window.elementalData.elements[e.element]?.name || e.element}</span>
                            </div>
                        ` : ''}
                        
                        <h3 class="text-xl md:text-2xl font-black text-white font-serif tracking-tight drop-shadow-lg leading-tight w-full truncate">${e.name}</h3>
                        <div class="text-[0.65rem] font-black text-yellow-400 uppercase tracking-[0.2em] mt-1">Level ${e.level || e.baseLevel || 1}</div>
                    </div>
                    <div class="space-y-2 pointer-events-auto">
                        <div class="space-y-1">
                            <div class="flex justify-between text-[10px] font-black text-stone-200 uppercase tracking-widest"><span>HP</span><span class="enemy-hp-text font-bold text-rose-400">${Math.floor(e.hp)}</span></div>
                            <div class="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner flex-1 border border-white/5">
                                <div class="enemy-hp-bar h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-500" style="width: ${hpPct}%"></div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between text-[10px] font-black text-stone-200 uppercase tracking-widest"><span>MP</span><span class="enemy-mana-text font-bold text-blue-400">${Math.floor(e.mana)}</span></div>
                            <div class="h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner flex-1 border border-white/5">
                                <div class="enemy-mana-bar h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500" style="width: ${mpPct}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hit-overlay absolute inset-0 bg-red-600/0 pointer-events-none transition-all duration-100 z-30"></div>
                <!-- Enemy Intent Slot (above card, outside) -->
                <div class="enemy-intent-slot absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 bg-black/90 backdrop-blur rounded-xl border-2 border-red-500/50 flex items-center justify-center opacity-0 transition-opacity duration-300 z-[60] shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    <i data-lucide="sword" class="w-7 h-7 text-red-500"></i>
                </div>
            </div>`;
            c.appendChild(el);
            this.renderStatusIcons(e, el.querySelector('.status-container-left'), el.querySelector('.status-container-right'));
        });
        this.refreshIcons();
        // Tilt disabled
    },

    updatePlayerUI() {
        const p = this.data.player;
        const hb = document.getElementById('player-hp-bar'); if (hb) hb.style.width = `${(p.hp / p.maxHp) * 100}%`;
        const ht = document.getElementById('player-hp-text'); if (ht) ht.innerText = Math.floor(p.hp);
        const mb = document.getElementById('player-mana-bar'); if (mb) mb.style.width = `${(p.mana / p.maxMana) * 100}%`;
        const mt = document.getElementById('player-mana-text'); if (mt) mt.innerText = Math.floor(p.mana);

        const pn = document.getElementById('player-name-display'); if (pn) pn.innerText = p.name;
        const pl = document.getElementById('player-level-display'); if (pl) pl.innerText = `Level ${p.level}`;
        const pc = document.getElementById('player-class-display'); if (pc) pc.innerText = p.class;
        const pImg = document.getElementById('player-img-bg');
        if (pImg) {
            pImg.innerHTML = ''; // Clear previous content
            pImg.style.backgroundImage = '';

            if (p.video) {
                // Video Support for Player
                pImg.innerHTML = `<video src="${p.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>`;
            } else {
                // Image Fallback
                pImg.style.backgroundImage = `url('${p.img}')`;
            }
        }

        // Update player status icons
        this.renderStatusIcons(p, document.getElementById('player-status-icons'));
    },

    renderSkillList() {
        const c = document.getElementById('skill-list-container'); if (!c) return; c.innerHTML = '';
        const hero = this.getActiveHero();
        if (!hero) return;

        // Clear skill detail panel when opening menu
        const empty = document.getElementById('skill-detail-empty');
        const content = document.getElementById('skill-detail-content');
        if (empty) empty.classList.remove('hidden');
        if (content) {
            content.classList.add('hidden');
            content.innerHTML = '';
        }
        this.state.skillPreviewId = null;

        hero.skills.forEach(s => {
            const row = document.createElement('div');
            row.className = 'skill-row';
            row.dataset.sid = s.id;

            // Tags
            const tags = [];
            if (s.type === 'aoe') tags.push('<span class="skill-chip aoe">AOE</span>');
            if (s.type === 'aoe_heal') tags.push('<span class="skill-chip heal">AOE HEAL</span>');
            if (s.type === 'self') tags.push('<span class="skill-chip self">SELF</span>');
            if (s.type === 'pierce') tags.push('<span class="skill-chip pierce">PIERCE</span>');
            if (s.damageType === 'magic') tags.push('<span class="skill-chip magic">MAGIC</span>');
            if (s.heal || s.healPct) tags.push('<span class="skill-chip heal">HEAL</span>');

            const canCast = hero.mana >= s.mana;
            if (!canCast) row.classList.add('disabled');

            row.innerHTML = `
                <div class="skill-tile-top relative z-10">
                    <div class="skill-icon">
                        ${s.img ? `<img src="${s.img}" alt="">` : `<i data-lucide="${s.icon || 'sparkles'}" class="w-6 h-6 text-blue-300"></i>`}
                    </div>
                    <div class="skill-mp-badge">${s.mana} MP</div>
                </div>
                <div class="skill-name relative z-10">${s.name}</div>
                <div class="skill-tile-chips relative z-10">${tags.join('')}</div>
            `;

            // IMPORTANT UX: only change preview on click (not hover),
            // so moving the mouse to "Cast" doesn't accidentally switch skills.
            row.onclick = (e) => { e.stopPropagation(); this.previewSkill(s.id); };

            c.appendChild(row);
        });

        // Don't auto-select first skill - wait for user to click

        this.refreshIcons();
    },

    getAliveEnemies() { return this.state.enemyVisualOrder.filter(id => { const e = this.data.enemies.find(x => x.id === id); return e && e.hp > 0; }); },
    bringEnemyToFront(id) { if (this.getAliveEnemies().length <= 1) return; const idx = this.state.enemyVisualOrder.indexOf(id); if (idx > 0) { this.state.enemyVisualOrder.splice(idx, 1); this.state.enemyVisualOrder.unshift(id); this.updateEnemyPositions(); } },
    sendEnemyToBack(id) { if (this.getAliveEnemies().length <= 1) return; const idx = this.state.enemyVisualOrder.indexOf(id); if (idx !== -1) { this.state.enemyVisualOrder.splice(idx, 1); this.state.enemyVisualOrder.push(id); this.updateEnemyPositions(); } },

    updateEnemyPositions() {
        // Disabled to prevent layout conflicts with natural flex/grid flow.
        // Dead enemies are now 'hidden', so gaps close naturally.
        return;
    },

    updateTimelineUI() {
        const c = document.getElementById('timeline-dot-path'); if (!c) return; c.innerHTML = '';
        const count = Math.min(6, this.state.entities.length * 2);

        for (let i = 0; i < count; i++) {
            const gIdx = (this.state.turnCount - 1 + i);
            const eid = this.state.entities[gIdx % this.state.entities.length];
            const ent = this.data.heroes.find(h => h.id === eid) || this.data.enemies.find(e => e.id === eid);
            if (!ent || ent.hp <= 0) continue;

            const active = i === 0;
            const isHero = ent.isPlayer;

            // Dot
            const dot = document.createElement('div');
            dot.className = `w-10 h-10 rounded-full border-2 transition-all duration-500 shadow-lg relative flex items-center justify-center shrink-0 
                ${active ? 'scale-125 z-20 border-amber-400 bg-amber-400/20 shadow-amber-500/40 ring-4 ring-amber-400/10' : 'scale-90 z-10 border-white/20 bg-black/60 opacity-60'}`;

            // Fade effect for tail dots
            if (i > 3) dot.style.opacity = (1 - (i - 3) * 0.3).toString();

            dot.innerHTML = `
                <img src="${ent.img}" class="w-full h-full object-cover rounded-full">
                ${active ? '<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">Current</div>' : ''}
                ${i === 1 ? '<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Next</div>' : ''}
                ${active ? '<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></div>' : ''}
            `;

            // Line (between dots)
            if (i < count - 1) {
                const line = document.createElement('div');
                line.className = `w-8 h-[2px] bg-gradient-to-r from-white/20 to-white/10 shrink-0 transition-opacity duration-500`;
                if (i > 2) line.style.opacity = (1 - (i - 2) * 0.3).toString();
                c.appendChild(dot);
                c.appendChild(line);
            } else {
                c.appendChild(dot);
            }
        }
    },

    spawnFloater(value, isCrit, color = null, isMana = false, targetNode = null, type = 'normal') {
        if (this.skipUI()) return;
        const overlay = document.getElementById('damage-floaters-overlay');
        if (!overlay) return;

        const floater = document.createElement('div');
        floater.className = `absolute pointer-events-none font-black italic tracking-tighter transition-all duration-1000 z-[300] select-none`;

        // Base Styling
        let baseClass = "text-4xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]";
        if (type === 'crit') baseClass = "text-6xl text-yellow-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce";
        if (type === 'miss') baseClass = "text-3xl text-stone-400 drop-shadow-lg";
        if (type === 'heal') baseClass = "text-4xl text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]";
        if (type === 'defend') baseClass = "text-5xl text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.7)] font-black";
        if (type === 'mana-gain' || type === 'mana') baseClass = "text-3xl text-cyan-300 drop-shadow-[0_0_15px_rgba(103,232,249,0.5)]";

        floater.className += ` ${baseClass}`;
        floater.innerHTML = value;

        // Position calculation
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if (targetNode) {
            const rect = targetNode.getBoundingClientRect();
            // Target the center-top of the card for floaters to "pop" out
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;

            // Add random offset for damage numbers (more cinematic)
            if (type === 'normal' || type === 'crit') {
                const randomX = (Math.random() - 0.5) * 80; // ±40px horizontal
                const randomY = (Math.random() - 0.5) * 60; // ±30px vertical
                x += randomX;
                y += randomY;
            }
        }

        // Apply initial position
        floater.style.left = `${x}px`;
        floater.style.top = `${y}px`;
        floater.style.transform = 'translate(-50%, -50%) scale(0.5)';
        floater.style.opacity = '0';

        overlay.appendChild(floater);

        // Determine float distance based on type
        let floatDistance = -150; // default
        if (type === 'super-effective') floatDistance = -220; // Much higher for SUPER EFFECTIVE
        else if (type === 'not-effective') floatDistance = -120; // Lower for ineffective
        else if (type === 'immune') floatDistance = -200; // High for immune

        // Animation
        requestAnimationFrame(() => {
            floater.style.transform = `translate(-50%, ${floatDistance}px) scale(${isCrit ? 1.5 : 1})`;
            floater.style.opacity = '1';
        });

        setTimeout(() => {
            floater.style.opacity = '0';
            floater.style.transform = `translate(-50%, ${floatDistance - 90}px) scale(0.8)`;
            setTimeout(() => floater.remove(), 1000);
        }, 1200);
    },

    log(m) {
        this.debug('COMBAT', m);
        if (this.skipUI()) return;
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
        const logRoot = document.getElementById('combat-log-floating');
        if (!logRoot) return;

        let borderClass = 'border-amber-500';
        let textClass = 'text-stone-200';
        const lower = m.toLowerCase();

        if (lower.includes('heals') || lower.includes('healed') || lower.includes('recovery')) {
            borderClass = 'border-green-500';
            textClass = 'text-green-300 font-bold';
        } else if (lower.includes('deals') || lower.includes('damage')) {
            borderClass = 'border-red-500';
        } else if (lower.includes('defeated') || lower.includes('collapsed')) {
            borderClass = 'border-red-700';
            textClass = 'text-red-400 font-bold';
        }

        const entry = document.createElement('div');
        entry.className = `px-4 py-2 bg-black/60 backdrop-blur-md border-l-2 ${borderClass} ${textClass} text-[11px] font-medium tracking-wide shadow-xl rounded-r-md transition-all duration-300 transform opacity-0 -translate-x-4 mb-2`;
        entry.innerHTML = `<span class="opacity-50 mr-2">[${time}]</span> ${m}`;
        logRoot.appendChild(entry);

        // Animate in
        requestAnimationFrame(() => {
            entry.classList.remove('opacity-0', '-translate-x-4');
            entry.classList.add('opacity-100', 'translate-x-0');
        });

        // Limit to 5 entries (remove oldest)
        while (logRoot.children.length > 5) {
            logRoot.removeChild(logRoot.firstChild);
        }
    },

    updateTargetingLine() {
        // Disabled SVG Line Logic - Using CSS Card Effects Instead
        // This function is kept as a loop for animation frame updates if needed,
        // but currently just clears any residual SVG elements.
        const path = document.getElementById('targeting-path');
        const startDot = document.getElementById('targeting-start-dot');
        const endDot = document.getElementById('targeting-end-dot');

        if (path) path.style.opacity = '0';
        if (startDot) startDot.style.opacity = '0';
        if (endDot) endDot.style.opacity = '0';

        // Additional real-time updates for card effects could go here if CSS isn't enough
        requestAnimationFrame(() => this.updateTargetingLine());
    },

    showToastNotification(text, isPlayer = false) {
        if (this.skipUI()) return;
        const toast = document.getElementById('combat-toast');
        const toastText = document.getElementById('combat-toast-text');
        if (!toast || !toastText) return;

        toastText.innerHTML = text; // Allow HTML for icons

        // Reset and Apply Theme
        const inner = toast.querySelector('div');
        if (inner) {
            inner.className = isPlayer ?
                "px-8 py-3 bg-blue-600/20 backdrop-blur-xl border border-blue-500/50 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.3)]" :
                "px-8 py-3 bg-red-600/20 backdrop-blur-xl border border-red-500/50 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.3)]";
        }

        // Reset animation
        toast.style.transition = 'none';
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20%) scale(0.9)';

        requestAnimationFrame(() => {
            toast.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, 0) scale(1)';
        });

        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -20%) scale(0.9)';
        }, 2500);
    },

    endCombat(win) {
        if (this.audio.bass) this.audio.bass.pause(); if (this.audio.battle) this.audio.battle.pause();
        this.state.isActive = false;

        if (this.skipUI()) {
            console.log(this.generateSimulationReport());
        }

        if (!win) {
            const overlay = document.getElementById('defeat-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            } else {
                const t = document.getElementById('combat-toast-text');
                if (t) {
                    t.innerText = "DEFEAT";
                    t.parentElement.classList.remove('opacity-0');
                }
                setTimeout(() => { closeCombatModal(); if (t) t.parentElement.classList.add('opacity-0'); }, 3000);
            }
            return;
        }

        const overlay = document.getElementById('victory-overlay'); if (overlay) { overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.remove('opacity-0'), 10); }

        const ec = document.getElementById('victory-enemies-list');
        if (ec) {
            ec.innerHTML = '';
            this.data.enemies.forEach((e, i) => {
                if (e.hp > 0) return;
                const el = document.createElement('div');
                // Added relative and z-index to prevent weird stacking, ensuring distinct items
                el.className = 'enemy-summary-reveal relative flex flex-col items-center gap-3 group shrink-0 w-20';
                el.style.animationDelay = `${i * 100}ms`;
                el.innerHTML = `
                    <div class="w-16 h-16 rounded-full border-2 border-stone-800 bg-stone-900 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500 shadow-lg z-10">
                        <img src="${e.img}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                            <i data-lucide="skull" class="w-6 h-6 text-white/40"></i>
                        </div>
                    </div>
                    <span class="text-[0.55rem] font-bold text-stone-500 uppercase tracking-wider group-hover:text-stone-300 transition-colors text-center leading-tight z-20">${e.name}</span>
                `;
                ec.appendChild(el);
            });
            this.refreshIcons();
        }
        let totalGold = 0, totalXP = 0, items = [];
        this.data.enemies.forEach(e => {
            if (e.hp <= 0) {
                // Add exp and gold from entity properties
                totalXP += e.exp || 0;
                totalGold += e.gold || 0;

                // Also check lootTable for items (backward compatibility)
                if (e.lootTable) {
                    totalGold += Math.floor(Math.random() * (e.lootTable.goldMax - e.lootTable.goldMin) + e.lootTable.goldMin);
                    totalXP += e.lootTable.xp || 0;

                    let roll = Math.random(), acc = 0;
                    for (let it of e.lootTable.items) {
                        acc += it.chance;
                        if (roll <= acc) {
                            items.push({ ...this.data.items[it.id], rarity: it.rarity });
                            break;
                        }
                    }
                }
            }
        });
        const primaryHero = this.data.heroes[0];
        const dg = document.getElementById('victory-gold'), dx = document.getElementById('victory-xp-gained'), dl = document.getElementById('victory-level');
        if (dg) dg.innerText = totalGold;
        if (dx) dx.innerText = `+ ${totalXP} XP`;
        if (dl && primaryHero) dl.innerText = primaryHero.level;

        const xpC = document.getElementById('victory-lvl-circle'), xpT = document.getElementById('victory-xp-total');
        const setC = (xp, max) => { if (xpC) xpC.style.strokeDashoffset = 283 - (283 * Math.min(1, xp / max)); };

        if (primaryHero) {
            const currentXP = primaryHero.xp || 0;
            const nextLevelXP = primaryHero.nextLevelXp || 1000;
            setC(currentXP, nextLevelXP);
            if (xpT) xpT.innerText = `${currentXP} / ${nextLevelXP}`;
            primaryHero.xp += totalXP;
            // Assuming primaryHero tracks global gold or just battle gold
            primaryHero.gold += totalGold;

            let lvlUp = false;
            while (primaryHero.xp >= primaryHero.nextLevelXp) {
                lvlUp = true;
                primaryHero.xp -= primaryHero.nextLevelXp;
                primaryHero.level++;
                primaryHero.nextLevelXp = Math.floor(primaryHero.nextLevelXp * 1.5);
                document.getElementById('level-up-badge')?.classList.remove('hidden');
            }

            setTimeout(() => {
                setC(primaryHero.xp, primaryHero.nextLevelXp);
                if (xpT) xpT.innerText = `${primaryHero.xp} / ${primaryHero.nextLevelXp}`;
                if (lvlUp && dl) dl.innerText = primaryHero.level;
            }, 500);
        }
        const lCont = document.getElementById('victory-loot-container'), noL = document.getElementById('victory-no-loot'), lCount = document.getElementById('loot-count'); if (lCont) { lCont.innerHTML = ''; if (items.length === 0) noL.classList.remove('hidden'); else noL.classList.add('hidden'); if (lCount) lCount.innerText = `${items.length} ITEMS`; items.forEach((it, i) => { const el = document.createElement('div'); el.className = `loot-item-reveal flex items-center gap-3 p-2.5 rounded-xl border rarity-${it.rarity} hover:bg-white/5 transition-colors cursor-default group`; el.style.animationDelay = `${i * 150 + 1000}ms`; el.innerHTML = `<div class="w-10 h-10 rounded-lg bg-[#050505] flex items-center justify-center shrink-0 border border-white/5 shadow-inner group-hover:scale-110 transition-transform"><i data-lucide="${it.icon}" class="w-5 h-5 text-stone-400 group-hover:text-white transition-colors"></i></div><div class="overflow-hidden"><div class="flex justify-between items-baseline"><div class="text-[0.5rem] font-bold text-stone-500 uppercase tracking-widest">${it.type}</div></div><div class="text-[0.7rem] font-bold text-stone-200 truncate group-hover:text-white">${it.name}</div></div>`; lCont.appendChild(el); }); }
        this.refreshIcons();
    },

    debugHealSelf() {
        this.data.heroes.forEach(h => {
            h.hp = h.maxHp;
            h.mana = h.maxMana;
            this.updateHeroUI(h.id);
        });
        this.showToastNotification("Party Fully Restored");
    },
    debugRecoverMana() {
        this.data.heroes.forEach(h => {
            h.mana = h.maxMana;
            this.updateHeroUI(h.id);
        });
        this.showToastNotification("Mana Restored");
    },
    debugPowerUp() {
        this.data.heroes.forEach(h => {
            h.attributes = { str: 99, agi: 99, vit: 99, int: 99, dex: 99, luk: 99 };
            this.calculateStats(h);
            h.hp = h.maxHp;
            h.mana = h.maxMana;
            this.updateHeroUI(h.id);
        });
        this.log("DEBUG: Attributes set to 99! Stats recalculated.");
        this.showToastNotification("God Mode ON");
    },
    debugKillAll() {
        console.log('[VICTORY/DEFEAT DEBUG] debugKillAll called - killing all enemies');
        this.data.enemies.forEach(e => {
            if (e.hp > 0) this.damageEntity(e, 99999, true, 'physical', null);
        });
        setTimeout(() => {
            console.log('[VICTORY/DEFEAT DEBUG] debugKillAll timeout - calling stepTurn');
            this.stepTurn();
        }, 500);
    },
    debugDie() {
        console.log('[VICTORY/DEFEAT DEBUG] debugDie called - killing all heroes');
        this.data.heroes.forEach(h => {
            if (h.hp > 0) this.damageEntity(h, 99999, true, 'physical', null);
        });
        setTimeout(() => {
            console.log('[VICTORY/DEFEAT DEBUG] debugDie timeout - calling stepTurn');
            this.stepTurn();
        }, 500);
    },
    debugInspect() { console.group("--- COMBAT STATS INSPECTOR ---"); console.log("PLAYER:"); console.table(this.data.player.stats); console.log("ATTRIBUTES:"); console.table(this.data.player.attributes); console.groupEnd(); this.data.enemies.forEach(e => { if (e.hp > 0) { console.group(`ENEMY: ${e.name} (Level ${e.level || e.baseLevel || '?'})`); console.table(e.stats); console.table(e.attributes); console.groupEnd(); } }); this.showToastNotification("Stats Logged to Console"); },

    // --- Enhanced Visual Method Overrides ---

    spawnFloater(text, isCrit, containerId, isHeal, rootElement, customClass = '') {
        if (this.skipUI()) return;
        const targetEl = rootElement || (containerId ? document.getElementById(containerId) : null);

        const el = document.createElement('div');
        document.body.appendChild(el);

        let x, y, dirX = 0;

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            // Target the IMAGE area (Top 15-20% of card for better visibility)
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + (rect.height * 0.2);

            // Minimal Jitter to keep it "On Target"
            const range = 15;
            const jx = (Math.random() - 0.5) * range;
            const jy = (Math.random() - 0.5) * range;

            x = cx + jx;
            y = cy + jy;

            // Smart Direction: Float AWAY from screen center to avoid overlap
            const screenCenter = window.innerWidth / 2;
            // -1 (Left) to 1 (Right) relative to screen width
            const relativePos = (cx - screenCenter) / (window.innerWidth * 0.4);
            dirX = relativePos * 120; // Throw outwards

            // Add slight randomness 
            dirX += (Math.random() - 0.5) * 40;

        } else {
            x = window.innerWidth / 2;
            y = window.innerHeight / 2;
            dirX = (Math.random() - 0.5) * 200;
        }

        // Safety clamp to keep within screen
        x = Math.max(50, Math.min(window.innerWidth - 50, x));
        y = Math.max(50, Math.min(window.innerHeight - 50, y));

        el.style.position = 'fixed';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.zIndex = '10000000';

        el.className = `combat-floater ${isCrit ? 'crit' : ''} ${isHeal ? 'heal' : ''} ${customClass} font-black pointer-events-none select-none`;
        el.innerText = text;
        el.style.textShadow = '0 0 5px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)';

        // Color & Size Overrides
        const upper = text.toString().toUpperCase();
        if (isHeal) {
            el.style.color = '#4ade80';
            el.style.textShadow = '0 0 15px rgba(74, 222, 128, 0.6)';
        } else if (upper.includes('MISS') || upper.includes('RESIST') || upper.includes('BLOCK')) {
            el.style.color = '#a8a29e';
            el.style.fontSize = '2.0rem'; // Smaller 
        } else if (upper.includes('IMMUNE') || upper.includes('INEFFECTIVE')) {
            el.style.color = '#78716c';
            el.style.fontSize = '1.8rem'; // Reduced to declutter
            el.style.opacity = '0.9';
        }

        if (!isNaN(parseInt(text))) {
            const val = parseInt(text);
            el.style.fontSize = isCrit ? '5rem' : '3.5rem';
            if (val > 999) el.style.color = '#facc15';
        } else if (!el.style.fontSize) {
            el.style.fontSize = '2.5rem';
        }

        const rot = (dirX / 10) + (Math.random() - 0.5) * 20;
        el.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0.5)`;

        requestAnimationFrame(() => {
            el.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            el.style.transform = `translate(-50%, -150%) rotate(${rot}deg) scale(1.0)`;
            el.style.opacity = '1';

            setTimeout(() => {
                el.style.transition = 'all 0.6s ease-in';
                const destY = -250 - Math.random() * 100;
                el.style.opacity = '0';
                el.style.transform = `translate(calc(-50% + ${dirX}px), ${destY}%) rotate(${rot * 1.5}deg) scale(0.6)`;
            }, 500);
        });

        setTimeout(() => el.remove(), 1200);
    },

    highlightCombatants(attackerId, targetIds, type) {
        this.clearHighlights();

        const getCard = (id) => document.querySelector(`.enemy-card-instance[data-id="${id}"]`) || document.querySelector(`.hero-card-instance[data-id="${id}"]`);

        // Attacker: Blue shine, clear visual
        const att = getCard(attackerId);
        if (att) {
            att.style.zIndex = 50;
            // Clean blue glow, no opacity bg
            att.classList.add('ring-4', 'ring-blue-500', 'shadow-[0_0_60px_rgba(59,130,246,0.8)]');
            att.style.transform = 'scale(1.05)';
        }

        // Targets
        targetIds.forEach(tid => {
            const t = getCard(tid);
            if (t) {
                t.style.zIndex = 49;
                if (type === 'hostile') {
                    // Red shine, pulse, shake
                    t.classList.add('ring-4', 'ring-red-600', 'shadow-[0_0_60px_rgba(220,38,38,1)]', 'animate-pulse');
                    t.style.animation = 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both';
                } else if (type === 'support') {
                    t.classList.add('ring-4', 'ring-green-500', 'shadow-[0_0_60px_rgba(34,197,94,0.8)]');
                }
            }
        });
    },

    updateLayout() {
        const aliveHeroes = this.data.heroes.filter(h => h.hp > 0);
        const aliveEnemies = this.data.enemies.filter(e => e.hp > 0);

        const isMobile = window.innerWidth < 1640 || window.innerHeight < 800;
        const isXL = window.innerWidth > 2300;

        // 1v1 mode?
        const isDuel = aliveHeroes.length <= 1 && aliveEnemies.length <= 1;

        // --- Calculate Sizes ---
        let enemySize, heroSize;

        if (isDuel) {
            if (isXL) enemySize = "w-[400px] h-[600px]";
            else if (isMobile) enemySize = "w-[300px] h-[450px]";
            else enemySize = "w-[360px] h-[540px]";
            heroSize = enemySize;
        } else {
            // Standard Party Sizes (Compact)
            if (isXL) enemySize = "w-[280px] h-[420px]";
            else if (isMobile) enemySize = "w-[220px] h-[330px]";
            else enemySize = "w-[240px] h-[360px]";
            heroSize = enemySize;
        }

        // --- Apply Classes ---
        const resize = (selector, sizeClass) => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                // Remove known size classes
                el.classList.remove(
                    "w-[400px]", "h-[600px]",
                    "w-[300px]", "h-[450px]",
                    "w-[360px]", "h-[540px]",
                    "w-[280px]", "h-[420px]",
                    "w-[220px]", "h-[330px]",
                    "w-[240px]", "h-[360px]"
                );

                // Add new
                sizeClass.split(' ').forEach(c => el.classList.add(c));
            });
        };

        resize('.hero-card-instance', heroSize);
        resize('.enemy-card-instance', enemySize);
    },

    clearHighlights() {
        document.querySelectorAll('.enemy-card-instance, .hero-card-instance').forEach(el => {
            el.classList.remove('ring-4', 'ring-blue-500', 'ring-red-600', 'ring-green-500',
                'shadow-[0_0_60px_rgba(59,130,246,0.8)]', 'shadow-[0_0_60px_rgba(220,38,38,1)]', 'shadow-[0_0_60px_rgba(34,197,94,0.8)]',
                'animate-pulse');
            el.style.zIndex = '';
            el.style.transform = '';
            el.style.animation = '';
        });
    },

    // ========================================
    // DEBUG FUNCTIONS
    // ========================================
    initDebugPanel() {
        if (!this.config?.debugMode) return;

        const panel = document.getElementById('debug-panel');
        if (!panel) return;

        // Show panel
        panel.classList.remove('hidden');

        // Toggle panel
        const toggle = document.getElementById('debug-panel-toggle');
        if (toggle) {
            toggle.onclick = () => panel.classList.toggle('hidden');
        }

        // Update target select
        this.updateDebugTargetSelect();

        // Debug actions
        document.getElementById('debug-kill')?.addEventListener('click', () => this.debugKill());
        document.getElementById('debug-heal-full')?.addEventListener('click', () => this.debugHealFull());
        document.getElementById('debug-restore-mana')?.addEventListener('click', () => this.debugRestoreMana());
        document.getElementById('debug-revive')?.addEventListener('click', () => this.debugRevive());
        document.getElementById('debug-next-turn')?.addEventListener('click', () => this.debugSkipTurn());
        document.getElementById('debug-end-battle')?.addEventListener('click', () => this.debugEndBattle());

        // Refresh icons
        this.refreshIcons();
    },

    updateDebugTargetSelect() {
        const select = document.getElementById('debug-target-select');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Entity --</option>';

        // Add heroes
        this.data.heroes.forEach(hero => {
            const option = document.createElement('option');
            option.value = hero.id;
            option.textContent = `[ALLY] ${hero.name} (HP: ${hero.hp}/${hero.maxHp})`;
            select.appendChild(option);
        });

        // Add enemies
        this.data.enemies.forEach(enemy => {
            const option = document.createElement('option');
            option.value = enemy.id;
            option.textContent = `[ENEMY] ${enemy.name} (HP: ${enemy.hp}/${enemy.maxHp})`;
            select.appendChild(option);
        });
    },

    getDebugTarget() {
        const select = document.getElementById('debug-target-select');
        if (!select || !select.value) return null;

        const targetId = select.value;
        const target = this.data.heroes.find(h => h.id === targetId) ||
            this.data.enemies.find(e => e.id === targetId);
        return target;
    },

    debugKill() {
        const target = this.getDebugTarget();
        if (!target) {
            this.showToastNotification("Select a target first!");
            return;
        }

        if (target.hp <= 0) {
            this.showToastNotification(`${target.name} is already dead!`);
            return;
        }

        this.debug('DEBUG', `Killing ${target.name}`);
        // Store old HP for damageEntity, then set HP to 0 to kill instantly
        const oldHp = target.hp;
        target.hp = 0;

        // Use damageEntity to properly handle death animations and graveyard
        this.damageEntity(target, oldHp, false, 'physical', null, 0, false);

        // Update UI
        setTimeout(() => {
            if (target.isPlayer) {
                this.renderHeroes();
            } else {
                this.renderEnemies();
            }
            this.renderGraveyard();
            this.updateDebugTargetSelect();
        }, 600);
    },

    debugHealFull() {
        const target = this.getDebugTarget();
        if (!target) {
            this.showToastNotification("Select a target first!");
            return;
        }

        this.debug('DEBUG', `Full healing ${target.name}`);
        target.hp = target.maxHp;

        if (target.isPlayer) {
            this.updateHeroUI(target.id);
        } else {
            this.updateEnemyBars(target);
        }

        this.updateDebugTargetSelect();
        this.showToastNotification(`${target.name} fully healed!`, true);
    },

    debugRestoreMana() {
        const target = this.getDebugTarget();
        if (!target) {
            this.showToastNotification("Select a target first!");
            return;
        }

        this.debug('DEBUG', `Restoring mana for ${target.name}`);
        target.mana = target.maxMana;

        if (target.isPlayer) {
            this.updateHeroUI(target.id);
        } else {
            this.updateEnemyBars(target);
        }

        this.updateDebugTargetSelect();
        this.showToastNotification(`${target.name} mana restored!`, true);
    },

    debugRevive() {
        const target = this.getDebugTarget();
        if (!target) {
            this.showToastNotification("Select a target first!");
            return;
        }

        if (target.hp > 0) {
            this.showToastNotification(`${target.name} is already alive!`);
            return;
        }

        this.debug('DEBUG', `Reviving ${target.name}`);
        target.hp = Math.floor(target.maxHp * 0.5);
        target.mana = target.maxMana;

        // Clear death-related status effects
        if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(s =>
                !['death', 'dead'].includes(s.id)
            );
        }

        // Recalculate stats
        this.calculateStats(target);

        // Re-render
        if (target.isPlayer) {
            this.renderHeroes();
        } else {
            this.renderEnemies();
        }
        this.renderGraveyard();
        this.determineTurnOrder();
        this.updateTimelineUI();
        this.updateDebugTargetSelect();
        this.showToastNotification(`${target.name} has been revived!`, true);
    },

    debugSkipTurn() {
        this.debug('DEBUG', 'Skipping turn');
        this.processStatusEffects(this.getActiveHero(), 'turn_end');
        this.determineIntents();
        this.stepTurn();
    },

    debugVictory() {
        if (confirm('Force Victory? (Debug)')) {
            console.log('[VICTORY/DEFEAT DEBUG] Force Victory triggered');
            this.debug('DEBUG', 'Force Victory (debug)');
            this.endCombat(true);
        }
    },
    debugDefeat() {
        if (confirm('Force Defeat? (Debug)')) {
            console.log('[VICTORY/DEFEAT DEBUG] Force Defeat triggered');
            this.debug('DEBUG', 'Force Defeat (debug)');
            this.endCombat(false);
        }
    },
    debugResetBattle() {
        if (confirm('Reset Battle? This will restart combat from scratch.')) {
            console.log('[DEBUG] Resetting battle');
            this.debug('DEBUG', 'Reset Battle (debug)');
            location.reload();
        }
    },

    generateSimulationReport() {
        if (!this.state.history || this.state.history.length === 0) return "No simulation data recorded.";
        let report = "\n" + "=".repeat(60) + "\n";
        report += "   COMBAT SIMULATION REPORT\n";
        report += "=".repeat(60) + "\n";

        const win = this.data.enemies.every(e => (e.hp || 0) <= 0);
        report += `RESULT: ${win ? 'VICTORY' : 'DEFEAT'}\n`;
        report += `TURNS:  ${this.state.turnCount || 0}\n`;
        report += "=".repeat(60) + "\n\n";

        let currentTurn = -1;
        this.state.history.forEach(entry => {
            if (entry.turn !== currentTurn) {
                currentTurn = entry.turn;
                report += `\n[ TURN ${currentTurn || 0} ]\n`;
                report += "-".repeat(20) + "\n";
            }
            const cat = String(entry.category || 'INFO').padEnd(12);
            report += `${entry.time || '--:--'} | ${cat} | ${entry.message}\n`;
        });

        report += "\n" + "=".repeat(60) + "\n";
        report += "   END OF REPORT\n";
        report += "=".repeat(60) + "\n";
        return report;
    },

    toggleAutoGame() {
        this.state.autoGameEnabled = !this.state.autoGameEnabled;

        const status = this.state.autoGameEnabled ? 'ON' : 'OFF';

        // Update setup button text
        const setupText = document.getElementById('autogame-status-text');
        if (setupText) setupText.textContent = `AutoGame: ${status}`;

        // Update debug menu text
        const debugText = document.getElementById('debug-autogame-text');
        if (debugText) debugText.textContent = `AutoGame: ${status}`;

        this.showToastNotification(`🤖 AutoGame: ${status}`, true);
        console.log(`[AUTOGAME] Mode ${status}`);
    },

    toggleQuickCombat() {
        this.state.quickCombatEnabled = !this.state.quickCombatEnabled;
        const status = this.state.quickCombatEnabled ? 'ON' : 'OFF';

        // Update setup button text
        const setupText = document.getElementById('quickcombat-status-text');
        if (setupText) setupText.textContent = `Quick: ${status}`;

        // Update debug menu text
        const debugText = document.getElementById('debug-quickcombat-text');
        if (debugText) debugText.textContent = `Quick: ${status}`;

        this.showToastNotification(`⚡ Quick Combat: ${status}`, true);
        console.log(`[QUICK COMBAT] Mode ${status}`);

        // If enabling Quick Combat, automatically enable AutoGame for simulation
        if (this.state.quickCombatEnabled && !this.state.autoGameEnabled) {
            this.toggleAutoGame();
        }
    },

    performAutoHeroTurn(hero) {
        console.log(`[AUTOGAME] AI controlling hero: ${hero.name}`);

        // Decide action using IMPROVED AI scores
        const decisions = [];
        const aliveEnemies = this.data.enemies.filter(e => e.hp > 0);
        const aliveAllies = this.data.heroes.filter(h => h.hp > 0);

        // Attack option - baseline
        if (aliveEnemies.length > 0) {
            const avgEnemyHp = aliveEnemies.reduce((sum, e) => sum + e.hp, 0) / aliveEnemies.length;
            const attackScore = 50 + (avgEnemyHp < 200 ? 20 : 0); // Finish low HP enemies
            decisions.push({ type: 'attack', score: attackScore, target: aliveEnemies[0].id });
        }

        // Skill options
        if (hero.skills && hero.skills.length > 0) {
            hero.skills.forEach(skill => {
                if (hero.mana >= skill.mana) {
                    let score = 40;

                    // Healing skills - SMART scoring
                    if (skill.heal || skill.healPct) {
                        const myHpPercent = hero.hp / hero.maxHp;
                        const healAmount = skill.heal || (hero.maxHp * (skill.healPct || 0));

                        // Only heal if:
                        // 1. HP is below 30% (critical)
                        // 2. Heal amount is significant (> 20% max HP)
                        if (myHpPercent < 0.3) {
                            score = 85; // High priority when critical
                        } else if (myHpPercent < 0.6 && healAmount > hero.maxHp * 0.2) {
                            score = 60; // Medium priority if heal is meaningful
                        } else {
                            score = 20; // Low priority - don't waste mana
                        }
                    }

                    // Revive - still high priority
                    if (skill.type === 'revive') {
                        const deadAllies = this.data.heroes.filter(h => h.hp <= 0);
                        if (deadAllies.length > 0) score = 95;
                    }

                    // Offensive skills - BETTER scoring
                    if (skill.damage || skill.dmgMult) {
                        const estimatedDmg = (hero.stats.atk || 100) * (skill.dmgMult || 1.0);
                        const canKillEnemy = aliveEnemies.some(e => e.hp < estimatedDmg * 1.5);

                        if (canKillEnemy) {
                            score = 80; // Prioritize killing
                        } else if (hero.mana > hero.maxMana * 0.6) {
                            score = 70; // Use skills if plenty of mana
                        } else {
                            score = 45; // Save mana
                        }

                        // Penalty for AoE in 1v1
                        if ((skill.type === 'aoe' || skill.type === 'aoe_heal') && aliveEnemies.length === 1) {
                            score -= 80; // Massive penalty for using AoE on single target
                        }

                        // Bonus for high damage multiplier
                        if (skill.dmgMult > 1.5) {
                            score += 10;
                        }
                    }

                    decisions.push({ type: 'skill', skill, score, target: aliveEnemies[0]?.id });
                }
            });
        }

        // Item options
        const inventory = hero.inventory || {};
        Object.keys(inventory).forEach(ikey => {
            if (inventory[ikey] > 0) {
                const item = this.data.items[ikey];
                if (item) {
                    let score = 0;
                    const hpPct = hero.hp / hero.maxHp;
                    const mpPct = hero.mana / (hero.maxMana || 1);

                    if (item.healHp && hpPct < 0.4) score = 100;
                    if (item.restoreMana && mpPct < 0.2) score = 90;
                    if (item.cureAllStatuses && hero.activeDebuffs && hero.activeDebuffs.length > 0) score = 110;

                    if (score > 0) {
                        decisions.push({
                            type: 'item',
                            item: { ...item, id: ikey },
                            score,
                            target: (item.target === 'enemy' ? aliveEnemies[0]?.id : hero.id)
                        });
                    }
                }
            }
        });

        // Add randomization to avoid deterministic loops
        decisions.forEach(d => d.score += Math.random() * 10 - 5); // ±5 random variance

        // Sort by score and pick best
        decisions.sort((a, b) => b.score - a.score);
        const bestDecision = decisions[0];

        if (!bestDecision) {
            if (this.skipUI()) {
                this.stepTurn();
            } else {
                setTimeout(() => this.stepTurn(), 500);
            }
            return;
        }

        console.log(`[AUTOGAME] Decision:`, bestDecision);

        // Execute decision
        if (bestDecision.type === 'attack') {
            this.state.selectedActionType = 'attack';
            this.state.actionTargets = [bestDecision.target];
            this.state.phase = 'confirming';
            if (this.skipUI()) {
                this.confirmAction();
            } else {
                setTimeout(() => this.confirmAction(), 800);
            }
        } else if (bestDecision.type === 'skill') {
            this.state.selectedActionType = 'skill';
            this.state.selectedSkill = bestDecision.skill;
            this.state.phase = 'confirming';

            // Auto-select target based on skill type
            if (bestDecision.skill.type === 'revive') {
                const deadAlly = this.data.heroes.find(h => h.hp <= 0);
                if (deadAlly) {
                    this.state.actionTargets = [deadAlly.id];
                    this.state.targetMode = 'ally';
                }
            } else if (bestDecision.skill.type === 'aoe_heal') {
                this.state.actionTargets = this.data.heroes.filter(h => h.hp > 0).map(h => h.id);
                this.state.targetMode = 'ally';
            } else if (bestDecision.skill.heal || bestDecision.skill.healPct) {
                const lowHpAlly = this.data.heroes.filter(h => h.hp > 0).sort((a, b) => a.hp - b.hp)[0];
                if (lowHpAlly) {
                    this.state.actionTargets = [lowHpAlly.id];
                    this.state.targetMode = 'ally';
                }
            } else if (bestDecision.skill.type === 'aoe') {
                this.state.actionTargets = aliveEnemies.map(e => e.id);
                this.state.targetMode = 'enemy';
            } else if (aliveEnemies.length > 0) {
                this.state.actionTargets = [aliveEnemies[0].id];
                this.state.targetMode = 'enemy';
            }

            if (this.skipUI()) {
                this.confirmAction();
            } else {
                setTimeout(() => this.confirmAction(), 800);
            }
        } else if (bestDecision.type === 'item') {
            this.state.selectedActionType = 'item';
            this.state.selectedItem = bestDecision.item;
            this.state.itemPreviewId = bestDecision.item.id;
            this.state.actionTargets = [bestDecision.target];
            this.state.phase = 'confirming';

            if (this.skipUI()) {
                this.confirmAction();
            } else {
                setTimeout(() => this.confirmAction(), 800);
            }
        }
    }
};

window.openCombatModal = function () { combatSystem.startCombat(); };
window.closeCombatModal = function () {
    const m = document.getElementById('combat-modal');
    if (m) {
        m.classList.add('opacity-0');
        m.setAttribute('aria-hidden', 'true');
        // Blur active element to avoid focus warnings
        if (document.activeElement && m.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        setTimeout(() => m.classList.add('hidden'), 500);
    }
    if (combatSystem.audio.bass) combatSystem.audio.bass.pause();
    if (combatSystem.audio.battle) combatSystem.audio.battle.pause();
};
// Expose combatSystem globally for SkillEngine access
window.combatSystem = combatSystem;

document.addEventListener('DOMContentLoaded', () => { combatSystem.init(); });
