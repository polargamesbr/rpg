// combat-system.js - Core Logic
const combatSystem = {
    state: {
        isActive: false,
        turnCount: 0,
        activeEntityId: null,
        phase: 'idle',
        selectedActionType: null,
        selectedSkill: null,
        actionTargets: [],
        entities: [],
        enemyVisualOrder: [],
        parry: { active: false, attacker: null, damage: 0, attacksRemaining: 0, timeout: null },
        selection: { heroes: [], enemies: [] } // Multi-Hero Selection State
    },
    audio: {},
    data: null, // Will be set to combatData

    init() {
        this.data = window.combatData || (typeof combatData !== 'undefined' ? combatData : null);
        if (!this.data) console.error("Combat System: combatData missing!");

        // Audio Init
        this.audio = {
            bass: document.getElementById('audio-bass'),
            battleBegin: document.getElementById('audio-battle-begin'),
            battle: document.getElementById('audio-battle'),
            impact: document.getElementById('audio-impact'),
            parry: document.getElementById('audio-parry'),
            critHit: document.getElementById('audio-crit-hit'),
            swords: [
                document.getElementById('audio-sword1'), document.getElementById('audio-sword2'),
                document.getElementById('audio-sword3'), document.getElementById('audio-sword4')
            ]
        };
        this.initTilt();
        this.initParticles();

        // Keybinds
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state.parry.active) { e.preventDefault(); this.attemptParry(); }
        });

        // Cinema Scaling
        window.addEventListener('resize', () => this.updateScale());
        this.updateScale();
    },

    updateScale() {
        const battlefield = document.getElementById('battlefield-container');
        const heroes = document.getElementById('heroes-container');
        const enemies = document.getElementById('enemy-container');
        if (!battlefield || !heroes || !enemies) return;

        const isMobileWidth = window.innerWidth < 1640;
        const isMobileHeight = window.innerHeight < 800;

        if (isMobileWidth || isMobileHeight) {
            // Stacked Layout (Responsive Grid)
            battlefield.classList.add('flex-col', 'gap-12');
            heroes.classList.remove('absolute', 'left-[5%]', 'xl:left-[8%]');
            enemies.classList.remove('absolute', 'right-[5%]', 'xl:right-[8%]');
            heroes.classList.add('relative', 'order-2');
            enemies.classList.add('relative', 'order-1');
            battlefield.style.transform = '';
        } else {
            // Ultra-Wide Layout
            battlefield.classList.remove('flex-col', 'gap-12');
            heroes.classList.add('absolute', 'left-[5%]', 'xl:left-[8%]');
            enemies.classList.add('absolute', 'right-[5%]', 'xl:right-[8%]');
            heroes.classList.remove('relative', 'order-2');
            enemies.classList.remove('relative', 'order-1');

            const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
            if (scale > 1.2) {
                battlefield.style.transform = `scale(${Math.min(scale, 1.5)})`;
            } else {
                battlefield.style.transform = '';
            }
        }
    },

    playEffect(id) {
        if (!id) return;
        try {
            if (id === 'sword') {
                const s = this.audio.swords[Math.floor(Math.random() * this.audio.swords.length)];
                if (s) { s.currentTime = 0; s.play().catch(() => { }); }
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
        el.className = `setup-card relative p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all group overflow-hidden ${type}-card-${key}`;
        if (type === 'hero' && this.state.selection.heroes.includes(key)) el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-500/10');
        if (type === 'enemy' && this.state.selection.enemies.includes(key)) el.classList.add('ring-2', 'ring-red-500', 'bg-red-500/10');

        el.innerHTML = `
            <div class="flex items-center gap-3 relative z-10">
                <img src="${entity.img}" class="w-10 h-10 rounded-lg object-cover bg-stone-800 border border-white/10">
                <div class="flex flex-col">
                    <span class="text-[0.6rem] font-bold text-stone-300 uppercase tracking-widest group-hover:text-white">${entity.name}</span>
                    <span class="text-[0.55rem] text-stone-600 font-mono">${entity.type === 'class' ? 'Hero Class' : 'Monster'}</span>
                </div>
            </div>
            <!-- Selection Ring -->
            <div class="absolute inset-0 border-2 border-transparent transition-colors rounded-xl selection-ring"></div>
        `;
        el.onclick = () => type === 'hero' ? this.toggleHero(key) : this.toggleEnemy(key);
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
        Object.keys(this.data.entities).forEach(key => {
            // Hero Visuals
            const hEl = document.querySelector(`.hero-card-${key}`);
            if (hEl) {
                const ring = hEl.querySelector('.selection-ring');
                if (this.state.selection.heroes.includes(key)) {
                    hEl.classList.add('bg-blue-900/20');
                    ring.classList.remove('border-transparent'); ring.classList.add('border-blue-500');
                    // Add badge?
                } else {
                    hEl.classList.remove('bg-blue-900/20');
                    ring.classList.add('border-transparent'); ring.classList.remove('border-blue-500');
                }
            }

            // Enemy Visuals
            const eEl = document.querySelector(`.enemy-card-${key}`);
            if (eEl) {
                const ring = eEl.querySelector('.selection-ring');
                const isSelected = this.state.selection.enemies.includes(key);
                if (isSelected) {
                    eEl.classList.add('bg-red-900/20');
                    ring.classList.remove('border-transparent'); ring.classList.add('border-red-500');
                } else {
                    eEl.classList.remove('bg-red-900/20');
                    ring.classList.add('border-transparent'); ring.classList.remove('border-red-500');
                }
            }
        });

        // Start Button Validity
        const btn = document.getElementById('btn-start-combat');
        if (btn) {
            const valid = this.state.selection.heroes.length > 0 && this.state.selection.enemies.length > 0;
            btn.disabled = !valid;
            document.getElementById('setup-error-msg').style.opacity = valid ? '0' : '1';
        }
    },

    startBattle() {
        if (this.state.selection.heroes.length === 0 || this.state.selection.enemies.length === 0) return;

        // 1. Hydrate Heroes
        this.data.heroes = [];
        this.state.selection.heroes.forEach((hKey, index) => {
            const hDef = this.data.entities[hKey];
            const hSkills = (hDef.skills || []).map(sid => {
                const s = this.data.skills[sid];
                return s ? { ...s, id: sid } : null;
            }).filter(s => s);

            this.data.heroes.push({
                ...JSON.parse(JSON.stringify(hDef)),
                id: `hero_${index + 1}`,
                isPlayer: true,
                xp: 0, level: hDef.baseLevel || 10, gold: 0,
                hp: hDef.maxHp, maxHp: hDef.maxHp,
                mana: hDef.maxMana, maxMana: hDef.maxMana,
                statusEffects: [],
                skills: hSkills
            });
        });

        // 2. Hydrate Enemies
        this.data.enemies = this.state.selection.enemies.map((key, idx) => {
            const def = this.data.entities[key];
            const maxHp = def.maxHp || 100;
            const maxMana = def.maxMana || 50;
            const eSkills = (def.skills || []).map(sid => {
                const s = this.data.skills[sid];
                return s ? { ...s, id: sid } : null;
            }).filter(s => s);

            return {
                ...JSON.parse(JSON.stringify(def)), // Clone
                id: `enemy_${idx}_${key}`, // Unique Instance ID
                statusEffects: [], stats: {}, attacks: 1,
                level: def.baseLevel || 1, // Ensure level exists
                hp: maxHp, maxHp: maxHp, mana: maxMana, maxMana: maxMana,
                skills: eSkills
            };
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
        this.state.turnCount = 1;

        // Fix: Use determineTurnOrder logic here to ensure IDs are used, NOT Objects
        // Pre-sort for initial render if needed, but important is state.entities = IDs
        this.determineTurnOrder();

        this.renderHeroes();
        this.renderEnemies();

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
        if (intro) {
            intro.classList.remove('hidden');
            setTimeout(() => {
                intro.classList.add('hidden');
                if (this.audio && this.audio.battle) {
                    this.audio.battle.currentTime = 0;
                    this.audio.battle.volume = 0.5;
                    this.audio.battle.play().catch(() => { });
                }
                this.log("Battle Started!");
                this.stepTurn();
            }, 3000);
        } else {
            setTimeout(() => this.stepTurn(), 1000);
        }
    },

    renderHeroes() {
        const c = document.getElementById('heroes-container');
        if (!c) return;
        c.innerHTML = '';

        const isDuel = this.data.heroes.length === 1 && this.data.enemies.length === 1;
        const cardSizeClass = isDuel
            ? "w-[280px] h-[420px] md:w-[320px] md:h-[500px]" // Standardized Large (Duel)
            : "w-[160px] h-[240px] md:w-[200px] md:h-[300px]"; // Standardized Compact (Party)

        this.data.heroes.forEach(h => {
            const el = document.createElement('div');
            el.className = `combat-card group relative ${cardSizeClass} transition-all duration-500 hero-card-instance`;
            el.dataset.id = h.id;

            const hpPct = (h.hp / h.maxHp) * 100;
            const mpPct = (h.mana / (h.maxMana || 1)) * 100;

            const mediaHtml = h.video ?
                `<video src="${h.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>` :
                `<div class="absolute inset-0 bg-cover bg-top transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none" style="background-image: url('${h.img}');"></div>`;

            el.innerHTML = `
                <div class="absolute inset-0 rounded-2xl border-[3.5px] border-[#151515] bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10 transition-all duration-500 group-hover:ring-blue-500/30 hero-card-border" id="${h.id}-border">
                    <div class="absolute inset-0">${mediaHtml}</div>
                    <div class="floater-root absolute inset-0 z-50 pointer-events-none"></div>
                    <div class="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
                    
                    <div class="absolute inset-0 p-5 flex flex-col justify-end z-20 pointer-events-none">
                        <div class="text-center mb-2 pointer-events-auto relative">
                            <div class="active-indicator absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] opacity-0 transition-all duration-500 scale-75">Current</div>
                            <h3 class="text-xl md:text-2xl font-black text-white font-serif tracking-tight drop-shadow-lg leading-tight w-full truncate">${h.name}</h3>
                            <div class="text-[0.65rem] font-black text-yellow-400 uppercase tracking-[0.2em] mt-1">Level ${h.level}</div>
                        </div>

                        <div class="hero-status-icons flex justify-center gap-2 mb-3 h-6 items-center pointer-events-auto"></div>

                        <div class="space-y-3 mt-1 backdrop-blur-sm bg-black/40 p-3 rounded-xl border border-white/10 pointer-events-auto">
                            <div class="space-y-1">
                                <div class="flex justify-between text-[10px] font-black text-stone-200 uppercase tracking-widest"><span>HP</span><span class="hero-hp-text font-bold text-rose-400">${Math.floor(h.hp)}</span></div>
                                <div class="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner flex-1 border border-white/5">
                                    <div class="hero-hp-bar h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-500" style="width: ${hpPct}%"></div>
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
                <div class="slash-effect absolute inset-0 pointer-events-none z-40 hidden"></div>
            `;
            c.appendChild(el);
            this.updateHeroUI(h.id);
        });
        this.initTilt();
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
        const mpBar = card.querySelector('.hero-mana-bar');
        const hpText = card.querySelector('.hero-hp-text');
        const mpText = card.querySelector('.hero-mana-text');

        if (hpBar) hpBar.style.width = `${(h.hp / h.maxHp) * 100}%`;
        if (mpBar) mpBar.style.width = `${(h.mana / h.maxMana) * 100}%`;
        if (hpText) hpText.innerText = Math.floor(h.hp);
        if (mpText) mpText.innerText = Math.floor(h.mana);

        this.renderStatusIcons(h, card.querySelector('.hero-status-icons'));
        this.refreshIcons();
    },

    // Renamed from startCombat
    beginCombatSequence() {
        /* Original startCombat logic goes here */
        if (!this.data) return;
        if (this.state.isActive) return;
        const m = document.getElementById('combat-modal');
        // (UI Reveal logic is already handled by OpenSetup, we just need to init game loop)

        this.state.isActive = true; this.state.turnCount = 0;

        // Audio
        if (this.audio.battleBegin) this.audio.battleBegin.play().catch(() => { });
        this.audio.bass.currentTime = 0; this.audio.bass.play().catch(() => { });

        // Intro Text
        const i = document.getElementById('battle-intro-overlay'); i.classList.remove('hidden');
        setTimeout(() => {
            i.classList.add('hidden');
            if (this.audio.battle) { this.audio.battle.currentTime = 0; this.audio.battle.volume = 0.5; this.audio.battle.play().catch(() => { }); }
            this.log("Battle Started!"); this.determineTurnOrder(); this.stepTurn();
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
        const a = entity.attributes || { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
        const lvl = entity.level || entity.baseLevel || 1;
        const maxHp = Math.floor((lvl * 100) + (a.vit * 20));
        const maxMana = Math.floor((lvl * 10) + (a.int * 5));
        const statusAtk = Math.floor(a.str + (a.str * 0.5) + (a.dex / 4) + (a.luk / 5) + (lvl / 4));
        const atk = statusAtk + 50;
        const statusMatk = Math.floor(a.int + (a.int / 2) + (a.dex / 5) + (a.luk / 3) + (lvl / 4));
        const matk = statusMatk + 30;
        const softDef = Math.floor((a.vit / 2) + (a.agi / 5));
        const hardDef = 20;
        const hit = Math.floor(175 + lvl + a.dex + (a.luk / 3));
        const flee = Math.floor(100 + lvl + a.agi + (a.luk / 5));
        const crit = Math.floor(1 + (a.luk * 0.3));
        const aspd = Math.floor(150 + (a.agi / 4) + (a.dex / 10));
        const mdef = Math.floor(a.int + (a.vit / 2) + (a.dex / 5) + (lvl / 4));

        entity.maxHp = maxHp;
        entity.maxMana = maxMana;
        entity.stats = { atk, matk, softDef, hardDef, mdef, hit, flee, crit, aspd };

        // Safety fallbacks for missing values or initialization
        if (entity.hp === undefined || entity.hp === null || isNaN(entity.hp) || entity.hp <= 0) entity.hp = maxHp;
        if (entity.mana === undefined || entity.mana === null || isNaN(entity.mana) || entity.mana <= 0) entity.mana = maxMana;

        // Ensure HP doesn't exceed newly calculated Max
        if (entity.hp > entity.maxHp) entity.hp = entity.maxHp;
        if (entity.mana > entity.maxMana) entity.mana = entity.maxMana;
    },



    determineTurnOrder() {
        let f = [...this.data.heroes.filter(h => h.hp > 0), ...this.data.enemies.filter(e => e.hp > 0)];
        if (f.length === 0) {
            this.state.entities = [];
            return;
        }

        f.sort((a, b) => {
            const spdA = (a.stats && (a.stats.aspd || a.stats.speed)) ? (a.stats.aspd || a.stats.speed) : 0;
            const spdB = (b.stats && (b.stats.aspd || b.stats.speed)) ? (b.stats.aspd || b.stats.speed) : 0;
            return spdB - spdA;
        });

        this.state.entities = f.map(x => x.id);
    },

    stepTurn() {
        if (!this.state.isActive) return;

        // Victory/Defeat Check
        const heroesAlive = this.data.heroes.filter(h => h.hp > 0);
        if (heroesAlive.length === 0) { this.endCombat(false); return; }
        if (this.data.enemies.every(e => e.hp <= 0)) { this.endCombat(true); return; }

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
            this.state.turnCount++;
            id = this.state.entities[(this.state.turnCount - 1) % this.state.entities.length];
            entity = this.data.heroes.find(h => h.id === id) || this.data.enemies.find(e => e.id === id);
            if (entity && entity.hp > 0) found = true;
            attempts++;
        }

        if (!found || !entity) {
            console.error("CRITICAL: No valid entity found to act. Stopping turn.", this.state.entities);
            return;
        }

        this.state.activeEntityId = id;

        if (!entity.isPlayer) {
            if (this.showToastNotification) this.showToastNotification(`<i data-lucide="skull" class="w-4 h-4 inline-block mr-1"></i> Enemy Turn`);
            this.bringEnemyToFront(id);
        } else {
            if (this.showToastNotification) this.showToastNotification(`<i data-lucide="sword" class="w-4 h-4 inline-block mr-1"></i> YOUR TURN`, true);
        }

        const skipTurn = this.processStatusEffects(entity, 'turn_start');
        if (skipTurn) {
            this.log(`${entity.name} is incapacitated and skips their turn!`);
            this.showToastNotification(`${entity.name} SKIPPED TURN`);
            setTimeout(() => this.stepTurn(), 1500);
            return;
        }

        if (entity.isPlayer) {
            this.updateHeroUI(entity.id);
            this.renderSkillList();
        }

        this.updateTimelineUI();
        this.updateTurnIndicator(entity);
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

        // Enemy Intent Logic
        document.querySelectorAll('.enemy-intent-slot').forEach(el => el.classList.add('opacity-0'));
        this.data.enemies.forEach(en => {
            if (en.hp > 0) {
                const card = document.querySelector(`.enemy-card-instance[data-id="${en.id}"]`);
                if (card) {
                    const slot = card.querySelector('.enemy-intent-slot');
                    if (slot) {
                        slot.classList.remove('opacity-0');
                        // For now, default to sword icon, but could be dynamic based on AI choice
                        slot.innerHTML = '<i data-lucide="sword" class="w-6 h-6 text-red-500"></i>';
                    }
                }
            }
        });

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

        // SPECIAL: Black banner for prompts if specific text
        if (text === "SELECT TARGET") {
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

    startPlayerTurn() { },

    getActiveHero() {
        return this.data.heroes.find(h => h.id === this.state.activeEntityId);
    },

    selectActionType(type) {
        if (this.state.phase !== 'idle' && this.state.phase !== 'confirming') return;
        this.state.selectedActionType = type;

        const el = document.getElementById('turn-indicator');
        const hero = this.getActiveHero();
        if (!hero) return;

        if (type === 'attack') {
            el.innerHTML = '<i data-lucide="crosshair" class="w-4 h-4 text-amber-500"></i> Select Target...';
            this.updateTurnIndicator(hero, "SELECT TARGET");
            const sm = document.getElementById('skills-menu');
            if (sm) sm.classList.add('hidden', 'opacity-0');
        }

        this.refreshIcons();

        const ab = document.getElementById('action-bar');
        const cb = document.getElementById('confirm-bar');
        if (ab) {
            ab.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            ab.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }
        if (cb) {
            cb.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            cb.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }

        this.state.phase = type === 'attack' ? 'selecting_target' : 'idle';
        if (type === 'attack') {
            const t = this.data.enemies.find(e => e.hp > 0);
            if (t) this.selectEnemyTarget(t.id);
        }
    },

    toggleSkillMenu() {
        this.removeAttention();
        const hero = this.getActiveHero();
        if (!hero) return;

        const m = document.getElementById('skills-menu');
        if (m) {
            m.classList.toggle('hidden'); m.classList.toggle('opacity-0');
            const mpDisp = document.getElementById('skill-menu-mp');
            if (mpDisp) mpDisp.innerText = hero.mana;
        }
    },

    selectSkill(sid) {
        const hero = this.getActiveHero();
        if (!hero) return;
        const s = hero.skills.find(x => x.id === sid);
        if (hero.mana < s.mana) { this.showToastNotification("NOT ENOUGH MANA"); return; }

        this.state.selectedActionType = 'skill'; this.state.selectedSkill = s;
        const sm = document.getElementById('skills-menu');
        if (sm) sm.classList.add('hidden', 'opacity-0');

        if (s.type === 'aoe') {
            this.state.actionTargets = this.data.enemies.filter(e => e.hp > 0).map(e => e.id);
            this.state.phase = 'confirming';
            this.updateTurnIndicator(hero);
        } else if (s.type === 'single') {
            this.state.phase = 'selecting_target';
            this.updateTurnIndicator(hero, "SELECT TARGET");
            const t = this.data.enemies.find(e => e.hp > 0);
            if (t) this.selectEnemyTarget(t.id);
        } else {
            this.state.actionTargets = [hero.id];
            this.state.phase = 'confirming';
            this.updateTurnIndicator(hero);
        }
        this.updateTargetUI();
    },

    selectEnemyTarget(id) {
        if (!this.getActiveHero()) return;
        if (!this.state.selectedActionType) { this.highlightActionButtons(); this.showToastNotification("SELECT ACTION FIRST!"); return; }
        if (this.state.phase !== 'selecting_target' && this.state.phase !== 'confirming') return;
        if (this.state.selectedActionType === 'attack' || (this.state.selectedSkill && this.state.selectedSkill.type !== 'aoe')) {
            this.state.actionTargets = [id]; this.state.phase = 'confirming'; this.updateTargetUI();
        }
        // Do NOT call updateTurnIndicator here, as it re-triggers the banner. 
        // Just update the prompt text if needed.
        this.updateTargetUI();
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

        document.querySelectorAll('.enemy-card-instance').forEach(el => el.classList.remove('selected', 'ring-2', 'ring-red-500'));

        if (this.state.phase === 'confirming' || this.state.phase === 'selecting_target') {
            if (actionBar) {
                actionBar.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                actionBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
            if (confirmBar) {
                confirmBar.classList.remove('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
                confirmBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
            }
            if (chip) chip.classList.remove('hidden', 'opacity-0', 'translate-y-[-10px]');

            this.state.actionTargets.forEach(tid => {
                if (tid !== 'player') document.querySelector(`.enemy-card-instance[data-id="${tid}"]`)?.classList.add('selected');
            });

            const actionName = this.state.selectedActionType === 'skill' ? (this.state.selectedSkill ? this.state.selectedSkill.name : 'Skill') : 'Attack';
            let iconHtml = '';
            if (this.state.selectedActionType === 'skill' && this.state.selectedSkill && this.state.selectedSkill.img) {
                iconHtml = `<img src="${this.state.selectedSkill.img}" class="w-6 h-6 rounded border border-white/20 object-cover mr-2 inline-block shadow-sm">`;
            } else if (this.state.selectedActionType === 'skill' && this.state.selectedSkill && this.state.selectedSkill.icon) {
                iconHtml = `<i data-lucide="${this.state.selectedSkill.icon}" class="w-4 h-4 mr-2 inline-block"></i>`;
            } else if (this.state.selectedActionType === 'attack') {
                iconHtml = `<i data-lucide="sword" class="w-4 h-4 mr-2 inline-block"></i>`;
            }

            if (confirmText) confirmText.innerHTML = `${iconHtml}CONFIRM ${actionName}`;
            this.refreshIcons();

            let targetStr = "Enemy";
            if (this.state.selectedSkill?.type === 'aoe') targetStr = "ALL ENEMIES";
            else if (this.state.selectedSkill?.type === 'self') targetStr = "SELF";
            else {
                const t = this.data.enemies.find(e => e.id === this.state.actionTargets[0]);
                if (t) targetStr = t.name;
            }
            if (targetNameDisp) targetNameDisp.innerText = targetStr;
        } else {
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
    },

    cancelAction() {
        const po = document.getElementById('prompt-overlay');
        if (po) po.classList.remove('active');
        this.state.phase = 'idle';
        this.state.selectedActionType = null;
        this.state.actionTargets = [];
        this.updateTargetUI();
        const h = this.getActiveHero();
        if (h) this.updateTurnIndicator(h);
    },

    confirmAction() {
        if (this.state.phase !== 'confirming' || this.state.actionTargets.length === 0) return;
        const po = document.getElementById('prompt-overlay');
        if (po) po.classList.remove('active');
        const cb = document.getElementById('confirm-bar');
        if (cb) {
            cb.classList.add('translate-y-[150%]', 'opacity-0', 'pointer-events-none');
            cb.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
        }
        this.state.phase = 'executing';
        if (this.state.selectedActionType === 'attack') this.playerAttack();
        else if (this.state.selectedSkill) this.usePlayerSkill(this.state.selectedSkill);
    },

    playerAttack() {
        const hero = this.getActiveHero();
        if (!hero) return;

        const tid = this.state.actionTargets[0];
        const target = this.data.enemies.find(e => e.id === tid);
        if (!target || target.hp <= 0) { this.stepTurn(); return; }

        if (this.playEffect) this.playEffect('sword');
        let isCrit = Math.random() * 100 < hero.stats.crit;
        let dmg = Math.floor(hero.stats.atk * (0.9 + Math.random() * 0.2));
        this.damageEntity(target, dmg, isCrit, 'physical', hero);
        this.log(`${hero.name} attacked ${target.name}.`);
        this.showToastNotification(`<i data-lucide="sword" class="w-4 h-4 inline-block mr-1"></i> ${hero.name} attack!`, true);

        // --- End of turn status processing ---
        this.processStatusEffects(hero, 'turn_end');

        setTimeout(() => this.stepTurn(), 1000);
    },

    usePlayerSkill(skill) {
        const hero = this.getActiveHero();
        if (!hero) return;

        hero.mana -= skill.mana;
        this.updateHeroUI(hero.id);
        this.log(`${hero.name} used ${skill.name} (Cost: ${skill.mana} MP).`);

        let iconHtml = '';
        if (skill.img) iconHtml = `<img src="${skill.img}" class="w-4 h-4 rounded-sm inline-block mr-1 object-cover">`;
        else if (skill.icon) iconHtml = `<i data-lucide="${skill.icon}" class="w-4 h-4 inline-block mr-1"></i>`;

        if (this.showToastNotification) this.showToastNotification(`${iconHtml} Casting ${skill.name}!`, true);

        const targets = this.state.actionTargets;
        targets.forEach((tid, index) => {
            setTimeout(() => {
                if (tid === hero.id) { this.healHero(hero, 100); this.log(`${hero.name} healed self.`); }
                else {
                    const target = this.data.enemies.find(e => e.id === tid);
                    if (target && target.hp > 0) {
                        this.playEffect('sword');
                        let dmg = Math.floor(hero.stats.atk * skill.dmgMult * (0.9 + Math.random() * 0.2));
                        this.damageEntity(target, dmg, false, 'physical', hero);

                        // Check for skill effects
                        if (skill.effect) {
                            this.applyStatus(target, skill.effect, hero);
                        }
                    }
                }
            }, index * 200);
        });

        // --- End of turn status processing ---
        setTimeout(() => {
            this.processStatusEffects(hero, 'turn_end');
            this.stepTurn();
        }, 1000 + (targets.length * 200));
    },

    healHero(hero, a) {
        hero.hp = Math.min(hero.maxHp, hero.hp + a);
        this.updateHeroUI(hero.id);
        // Find hero card for floater
        const card = document.querySelector(`.hero-card-instance[data-id="${hero.id}"]`);
        const root = card ? card.querySelector('.floater-root') : null;
        this.spawnFloater(`+${a}`, false, null, true, root);
    },

    determineIntents() {
        this.data.enemies.forEach(e => {
            if (e.hp <= 0) { e.nextIntent = null; return; }

            // Smarter AI: Higher chance to use skills if mana is high, or if they have powerful ones
            const skills = e.skills || [];
            const availableSkills = skills.filter(s => e.mana >= s.mana);

            // 40% chance to use a skill if any are available
            if (availableSkills.length > 0 && Math.random() < 0.4) {
                // Pick a random available skill
                const chosenSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                e.nextIntent = { type: 'skill', skill: chosenSkill };
            } else {
                e.nextIntent = { type: 'attack' };
            }
        });
        this.renderEnemyIntents();
    },

    startEnemyTurn(e) {
        const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
        if (c) {
            c.style.setProperty('--s', '1.1');
            c.style.setProperty('--ty', '-40px');
            c.classList.add('z-50');
        }

        // Execute the forecasted intent or default to attack (fallback)
        const intent = e.nextIntent || { type: 'attack' };

        // Clear the intent UI
        this.clearEnemyIntentUI(e.id);

        if (intent.type === 'skill') {
            this.performEnemySkill(e, intent.skill);
        } else {
            this.state.parry.attacksRemaining = e.attacks || 1;
            setTimeout(() => { this.executeNextEnemyAttack(e); }, 1500);
            this.showTelegraph(e, 'sword'); // Quick telegraph before attack
        }
    },

    // Placeholder for intent UI
    renderEnemyIntents() {
        this.data.enemies.forEach(e => {
            if (!e.nextIntent || e.hp <= 0) return;
            const card = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
            if (!card) return;

            // Remove existing intent if any
            this.clearEnemyIntentUI(e.id);

            const intentEl = document.createElement('div');
            intentEl.id = `intent-${e.id}`;
            intentEl.className = "absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-[200] animate-bounce duration-[2000ms]";

            let icon = 'sword';
            let color = 'text-red-500';
            let bg = 'bg-red-950/80 border-red-500/30';

            if (e.nextIntent.type === 'skill') {
                icon = 'zap'; // Default skill icon
                if (e.nextIntent.skill && e.nextIntent.skill.icon) icon = e.nextIntent.skill.icon;
                color = 'text-blue-400';
                bg = 'bg-blue-950/80 border-blue-500/30';
            }

            intentEl.innerHTML = `
                <div class="p-1.5 rounded-lg border ${bg} backdrop-blur-md shadow-lg shadow-black/50">
                    <i data-lucide="${icon}" class="w-5 h-5 ${color}"></i>
                </div>
                <!-- Tiny pointer -->
                <div class="w-2 h-2 rotate-45 ${bg} -mt-1 border-b border-r border-[inherit]"></div>
            `;

            card.appendChild(intentEl);
        });
        this.refreshIcons();
    },
    clearEnemyIntentUI(id) { const el = document.getElementById(`intent-${id}`); if (el) el.remove(); },


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
        return alive[Math.floor(Math.random() * alive.length)];
    },

    performEnemySkill(e, skillOverride = null) {
        const skill = skillOverride || e.skills[0];
        const target = this.getRandomAliveHero();
        if (!target) return;

        this.showToastNotification(`${e.name} casts ${skill.name}!`);
        this.log(`${e.name} casts ${skill.name} on ${target.name} (Cost: ${skill.mana} MP).`);
        e.mana -= skill.mana;
        this.updateEnemyBars(e);
        this.showTelegraph(e, 'zap');
        setTimeout(() => {
            setTimeout(() => {
                this.damageEntity(target, Math.floor(e.stats.matk * skill.dmgMult), false, 'magic', e);

                // Apply skill effects to player
                if (skill.effect) {
                    this.applyStatus(target, skill.effect, e);
                }

                setTimeout(() => {
                    const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
                    if (c) { c.style.setProperty('--s', '1'); c.style.setProperty('--ty', '0px'); c.classList.remove('z-50'); }
                    this.sendEnemyToBack(e.id);

                    // --- End of turn status processing for enemy ---
                    this.processStatusEffects(e, 'turn_end');

                    this.stepTurn();
                }, 600);
            }, 1000);
        }, 0);
    },

    executeNextEnemyAttack(e) {
        if (this.state.parry.attacksRemaining <= 0) {
            const c = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
            if (c) { c.style.setProperty('--s', '1'); c.style.setProperty('--ty', '0px'); c.classList.remove('z-50'); }
            this.sendEnemyToBack(e.id);

            // --- End of turn status processing for enemy ---
            this.processStatusEffects(e, 'turn_end');

            setTimeout(() => this.stepTurn(), 800);
            return;
        }
        const target = this.getRandomAliveHero();
        if (target) {
            this.triggerParryPhase(e, Math.floor(e.stats.atk + Math.random() * (e.stats.atk * 0.2)), target);
        } else {
            // All heroes dead? Victory check handles this, but safe fallback
            this.stepTurn();
        }
    },

    triggerParryPhase(attacker, damage, target) {
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
            this.log(`Parry Success! Reduced damage.`);
        } else {
            if (label) {
                if (result === 'timeout') { label.innerHTML = "TOO SLOW!"; label.classList.add('text-red-500'); }
                else { label.innerHTML = "BAD TIMING!"; label.classList.add('text-orange-500'); }
            }
            if (this.playEffect) this.playEffect('crit');
            this.log(`Defense Failed.`);
        }
        setTimeout(() => {
            container.classList.add('opacity-0', 'translate-y-4');
            container.classList.remove('parry-active');
            document.getElementById('parry-cursor').classList.add('opacity-0');
            this.damageEntity(this.state.parry.target, finalDmg, result !== 'success', 'physical', this.state.parry.attacker);
            this.state.parry.attacksRemaining--;
            setTimeout(() => { this.executeNextEnemyAttack(this.state.parry.attacker); }, 800);
        }, 500);
    },

    damageEntity(target, amt, isCrit, type = 'physical', attacker = null) {
        let damage = amt;
        // Miss Calculation
        if (attacker && type === 'physical' && !isCrit) {
            const hitChance = 100 + (attacker.stats.hit - target.stats.flee);
            if (Math.random() * 100 > hitChance) {
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
                this.log(`${attacker.name} missed ${target.name}!`); return;
            }
        }

        // Damage Mitigation
        if (!isCrit && target.stats) {
            if (type === 'magic') damage = Math.max(1, damage - (target.stats.mdef || 0));
            else damage = Math.max(1, Math.floor((damage - target.stats.softDef) * (4000 / (4000 + target.stats.hardDef))));
        }

        target.hp = Math.max(0, target.hp - damage);

        // Visual Feedback (Screen Shake / Flash)
        const flash = document.getElementById('damage-flash-overlay');
        if (flash) { flash.style.opacity = '1'; flash.classList.add(isCrit ? 'bg-flash-yellow' : 'bg-flash-red'); setTimeout(() => { flash.style.opacity = '0'; flash.classList.remove('bg-flash-yellow', 'bg-flash-red'); }, 400); }
        const battleRoot = document.getElementById('battlefield-container');
        if (battleRoot) { battleRoot.classList.add('shake-screen'); setTimeout(() => battleRoot.classList.remove('shake-screen'), 400); }

        if (target.isPlayer) {
            this.updateHeroUI(target.id);
            const card = document.querySelector(`.hero-card-instance[data-id="${target.id}"]`);
            if (card) {
                const root = card.querySelector('.floater-root');
                this.spawnFloater(Math.floor(damage), isCrit, null, false, root, isCrit ? 'crit' : '');
                card.classList.add('flash-hit'); setTimeout(() => card.classList.remove('flash-hit'), 500);
                if (target.hp <= 0) {
                    card.classList.add('grayscale', 'opacity-50'); // Visual death
                    this.log(`${target.name} collapsed!`);
                }
            }
        } else {
            const card = document.querySelector(`.enemy-card-instance[data-id="${target.id}"]`);
            if (card) {
                this.updateEnemyBars(target);
                const floaterRoot = card.querySelector('.floater-root') || card;
                this.spawnFloater(Math.floor(damage), isCrit, null, false, floaterRoot, isCrit ? 'crit' : '');
                card.classList.add('flash-hit', 'shake-anim', 'slashing'); setTimeout(() => card.classList.remove('flash-hit', 'shake-anim', 'slashing'), 500);
                if (target.hp <= 0) {
                    card.classList.add('dead');
                    card.style.transition = 'all 0.5s ease-out'; card.style.opacity = '0'; card.style.transform = 'scale(0.8) translateY(20px)'; card.style.pointerEvents = 'none';
                    this.log(`${target.name} defeated.`);
                    setTimeout(() => { card.classList.add('hidden'); this.renderEnemies(); }, 500);
                }
            }
        }
    },

    updateEnemyBars(e) {
        const card = document.querySelector(`.enemy-card-instance[data-id="${e.id}"]`);
        if (!card) return;
        const hpBar = card.querySelector('.enemy-hp-bar');
        const mpBar = card.querySelector('.enemy-mana-bar');
        const hpText = card.querySelector('.enemy-hp-text');
        const mpText = card.querySelector('.enemy-mana-text');

        if (hpBar) hpBar.style.width = `${(e.hp / e.maxHp) * 100}%`;
        if (mpBar) mpBar.style.width = `${(e.mana / (e.maxMana || 1)) * 100}%`;
        if (hpText) hpText.innerText = Math.floor(e.hp);
        if (mpText) mpText.innerText = Math.floor(e.mana || 0);

        this.renderStatusIcons(e, card.querySelector('.status-icons-container'));
        this.refreshIcons();
    },
    renderStatusIcons(entity, container) {
        if (!container) return;
        container.innerHTML = '';
        entity.statusEffects.forEach(effect => {
            const iconWrap = document.createElement('div');
            iconWrap.className = "relative group/status cursor-help transition-transform hover:scale-110 pointer-events-auto";

            let iconName = 'alert-circle';
            let color = 'text-amber-500';
            let desc = '';

            if (effect.id === 'stun') { iconName = 'zap'; color = 'text-yellow-400'; desc = 'Stunned: Cannot act.'; }
            else if (effect.id === 'burn') { iconName = 'flame'; color = 'text-orange-500'; desc = 'Burning: Taking fire damage.'; }
            else if (effect.id === 'poison') { iconName = 'skull'; color = 'text-emerald-500'; desc = 'Poisoned: Taking damage over time.'; }
            else if (effect.id === 'bleed') { iconName = 'droplet'; color = 'text-rose-600'; desc = 'Bleeding: Loosing health every turn.'; }
            else if (effect.id === 'freeze') { iconName = 'snowflake'; color = 'text-cyan-400'; desc = 'Frozen: Cannot act, high impact vulnerability.'; }
            else if (effect.id === 'paralyze') { iconName = 'zap-off'; color = 'text-amber-300'; desc = 'Paralyzed: High chance to skip turn.'; }

            iconWrap.innerHTML = `
                <i data-lucide="${iconName}" class="w-5 h-5 ${color} drop-shadow-md"></i>
                <div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-black/80 border border-white/20 rounded-full flex items-center justify-center text-[7px] font-black text-white pointer-events-none">${effect.duration}</div>
                <!-- Tooltip -->
                <div class="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 p-3 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] opacity-0 group-hover/status:opacity-100 translate-y-2 group-hover/status:translate-y-0 transition-all pointer-events-none z-[999]">
                    <div class="text-[10px] font-black ${color} uppercase tracking-tighter mb-1">${effect.id.toUpperCase()}</div>
                    <div class="text-[9px] text-stone-300 leading-relaxed font-medium">${desc}</div>
                    <div class="mt-2 pt-2 border-t border-white/5 text-[8px] text-stone-500 font-bold uppercase tracking-widest">${effect.duration} turns remaining</div>
                </div>
            `;
            container.appendChild(iconWrap);
        });
        if (window.lucide) window.lucide.createIcons();
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
            this.log(`${target.name} is now affected by ${effectData.id.toUpperCase()}!`);
            this.showToastNotification(`${target.name}: ${effectData.id.toUpperCase()}`);
        }

        if (target.id === 'player') this.updatePlayerUI();
        else this.updateEnemyBars(target);
    },

    processStatusEffects(entity, timing) {
        let skipTurn = false;
        if (!entity.statusEffects || entity.hp <= 0) return false;

        entity.statusEffects.forEach((effect) => {
            if (effect.tick !== timing) return;

            // --- Consolidated logic at Turn Start for clarity ---
            if (timing === 'turn_start') {
                let dmg = 0;
                let logMsg = '';

                if (effect.id === 'burn') {
                    dmg = Math.floor(entity.maxHp * 0.05);
                    logMsg = `${entity.name} takes BURN damage: -${dmg} HP`;
                    this.showToastNotification(`BURN DMG: ${dmg}`, false);
                } else if (effect.id === 'bleed') {
                    dmg = Math.floor(entity.hp * 0.1);
                    logMsg = `${entity.name} takes BLEED damage: -${dmg} HP`;
                    this.showToastNotification(`BLEED DMG: ${dmg}`, false);
                } else if (effect.id === 'poison') {
                    dmg = 35; // Balanced
                    logMsg = `${entity.name} takes POISON damage: -${dmg} HP`;
                    this.showToastNotification(`POISON DMG: ${dmg}`, false);
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
        });

        // Reduce duration for ALL effects AFTER processing them
        entity.statusEffects.forEach(e => e.duration--);

        // Filter out expired effects
        const expired = entity.statusEffects.some(e => e.duration <= 0);
        entity.statusEffects = entity.statusEffects.filter(e => e.duration > 0);

        if (expired) {
            if (entity.id === 'player') this.updatePlayerUI();
            else this.renderEnemies(); // Full re-render to ensure UI consistency
        }

        return skipTurn;
    },

    refreshIcons() { if (window.lucide) lucide.createIcons(); },

    // Consistently render enemies only once
    renderEnemies() {
        const c = document.getElementById('enemy-container'); if (!c) return; c.innerHTML = '';
        const isDuel = this.data.heroes.length === 1 && this.data.enemies.length === 1;
        const cardSizeClass = isDuel
            ? "w-[280px] h-[420px] md:w-[320px] md:h-[500px]" // Larger Duel Size
            : "w-[160px] h-[240px] md:w-[200px] md:h-[300px]"; // Larger Party Size

        this.data.enemies.forEach(e => {
            const el = document.createElement('div');
            el.className = `combat-card group relative ${cardSizeClass} cursor-pointer transition-all duration-500 ${e.hp <= 0 ? 'hidden' : ''} enemy-card-instance`;
            el.setAttribute('data-id', e.id);
            el.onclick = () => this.selectEnemyTarget(e.id);

            const hpPct = (e.hp / e.maxHp) * 100;
            const mpPct = (e.mana / (e.maxMana || 1)) * 100;

            const mediaHtml = e.video ?
                `<video src="${e.video}" autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none"></video>` :
                `<div class="absolute inset-0 bg-cover bg-top transition-transform duration-[2000ms] group-hover:scale-110 pointer-events-none" style="background-image: url('${e.img}');"></div>`;

            el.innerHTML = `
            <div class="absolute inset-0 rounded-2xl border-[3.5px] border-[#151515] bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10 transition-all duration-500 group-hover:ring-red-500/30 enemy-card-border" id="${e.id}-border">
                <div class="absolute inset-0">${mediaHtml}</div>
                <div class="floater-root absolute inset-0 z-50 pointer-events-none"></div>
                <div class="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>
                <div class="target-marker"><div class="mira-ring-outer"></div><div class="mira-ring"></div><div class="mira-corners"><div class="mira-corner mira-corner-tl"></div><div class="mira-corner mira-corner-tr"></div><div class="mira-corner mira-corner-bl"></div><div class="mira-corner mira-corner-br"></div></div><i data-lucide="target" class="w-10 h-10 text-red-500/80 animate-pulse"></i></div>

                <div class="absolute inset-0 p-5 flex flex-col justify-end z-20 pointer-events-none">
                    <div class="text-center mb-2 pointer-events-auto relative">
                        <div class="active-indicator absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-500 uppercase tracking-[0.4em] opacity-0 transition-all duration-500 scale-75">Current</div>
                        <h3 class="text-xl md:text-2xl font-black text-white font-serif tracking-tight drop-shadow-lg leading-tight w-full truncate">${e.name}</h3>
                        <div class="text-[0.65rem] font-black text-yellow-400 uppercase tracking-[0.2em] mt-1">Level ${e.level || e.baseLevel || 1}</div>
                    </div>
                    <div class="status-icons-container flex justify-center gap-2 mb-3 h-6 items-center pointer-events-auto"></div>
                    <div class="space-y-3 mt-1 backdrop-blur-sm bg-black/40 p-3 rounded-xl border border-white/10 pointer-events-auto">
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
                <!-- Enemy Intent Slot -->
                <div class="enemy-intent-slot absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur rounded-lg border border-white/10 flex items-center justify-center opacity-0 transition-opacity duration-300">
                    <i data-lucide="sword" class="w-6 h-6 text-red-500"></i>
                </div>
            </div>`;
            c.appendChild(el);
            this.renderStatusIcons(e, el.querySelector('.status-icons-container'));
        });
        this.refreshIcons();
        this.initTilt();
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

        hero.skills.forEach(s => {
            let tb = s.type === 'aoe' ? '<span class="text-[0.45rem] font-bold bg-red-900/40 text-red-200 px-1 rounded ml-1 tracking-wider border border-red-500/20">AOE</span>' : (s.type === 'self' ? '<span class="text-[0.45rem] font-bold bg-green-900/40 text-green-200 px-1 rounded ml-1 tracking-wider border border-green-500/20">SELF</span>' : '');
            const d = document.createElement('div');
            d.className = "flex flex-col gap-1 p-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg cursor-pointer transition-all group relative overflow-hidden";
            d.onclick = (e) => { e.stopPropagation(); this.selectSkill(s.id); };
            d.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex items-center justify-between relative z-10">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded bg-black/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                            ${s.img ? `<img src="${s.img}" class="w-full h-full object-cover">` : `<i data-lucide="${s.icon}" class="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300"></i>`}
                        </div>
                        <div class="flex flex-col"><span class="text-[0.65rem] font-bold text-stone-200 group-hover:text-white leading-tight">${s.name}</span>${tb}</div>
                    </div>
                    <span class="text-[0.6rem] font-bold text-blue-400 font-mono">${s.mana}</span>
                </div>
            `;
            c.appendChild(d);
        }); this.refreshIcons();
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
        const overlay = document.getElementById('damage-floaters-overlay');
        if (!overlay) return;

        const floater = document.createElement('div');
        floater.className = `absolute pointer-events-none font-black italic tracking-tighter transition-all duration-1000 z-[300] select-none`;

        // Base Styling
        let baseClass = "text-4xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]";
        if (type === 'crit') baseClass = "text-6xl text-yellow-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-bounce";
        if (type === 'miss') baseClass = "text-3xl text-stone-400 drop-shadow-lg";
        if (type === 'heal') baseClass = "text-4xl text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]";

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
        }

        // Apply initial position
        floater.style.left = `${x}px`;
        floater.style.top = `${y}px`;
        floater.style.transform = 'translate(-50%, -50%) scale(0.5)';
        floater.style.opacity = '0';

        overlay.appendChild(floater);

        // Animation
        requestAnimationFrame(() => {
            floater.style.transform = `translate(-50%, -150px) scale(${isCrit ? 1.5 : 1})`;
            floater.style.opacity = '1';
        });

        setTimeout(() => {
            floater.style.opacity = '0';
            floater.style.transform = `translate(-50%, -240px) scale(0.8)`;
            setTimeout(() => floater.remove(), 1000);
        }, 1200);
    },

    initTilt() {
        document.querySelectorAll('.combat-card').forEach(x => {
            // Set base transform to respect variables
            x.style.transform = `translateX(var(--tx, 0px)) translateY(var(--ty, 0px)) scale(var(--s, 1))`;

            x.addEventListener('mousemove', (e) => {
                const r = x.getBoundingClientRect();
                const rx = ((e.clientY - r.top - r.height / 2) / r.height / 2) * -8;
                const ry = ((e.clientX - r.left - r.width / 2) / r.width / 2) * 8;
                x.style.transform = `translateX(var(--tx, 0px)) translateY(var(--ty, 0px)) scale(var(--s, 1)) perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            x.addEventListener('mouseleave', () => {
                x.style.transform = `translateX(var(--tx, 0px)) translateY(var(--ty, 0px)) scale(var(--s, 1))`;
            });
        });
    },
    initParticles() { const c = document.getElementById('particles-container'); if (c) for (let i = 0; i < 30; i++) { const p = document.createElement('div'); p.className = 'particle'; p.style.width = p.style.height = Math.random() * 3 + 'px'; p.style.left = Math.random() * 100 + '%'; p.style.top = Math.random() * 100 + '%'; p.style.animationDuration = (Math.random() * 10 + 10) + 's'; p.style.animationDelay = Math.random() * 5 + 's'; c.appendChild(p); } },
    log(m) {
        console.log(`[COMBAT] ${m} `);
        const logRoot = document.getElementById('combat-log-floating');
        if (!logRoot) return;
        const entry = document.createElement('div');
        entry.className = "px-4 py-2 bg-black/60 backdrop-blur-md border-l-2 border-amber-500 text-stone-200 text-[11px] font-medium tracking-wide shadow-xl rounded-r-md transition-all duration-300 transform opacity-0 -translate-x-4";
        entry.innerHTML = m;
        logRoot.appendChild(entry);

        requestAnimationFrame(() => {
            entry.classList.remove('opacity-0', '-translate-x-4');
            entry.classList.add('opacity-100', 'translate-x-0');
        });

        setTimeout(() => {
            entry.classList.add('opacity-0', '-translate-x-8');
            setTimeout(() => entry.remove(), 300);
        }, 4500);

        while (logRoot.children.length > 5) {
            logRoot.removeChild(logRoot.firstChild);
        }
    },

    showToastNotification(text, isPlayer = false) {
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
        this.data.enemies.forEach(e => { if (e.hp <= 0 && e.lootTable) { totalGold += Math.floor(Math.random() * (e.lootTable.goldMax - e.lootTable.goldMin) + e.lootTable.goldMin); totalXP += e.lootTable.xp; let roll = Math.random(), acc = 0; for (let it of e.lootTable.items) { acc += it.chance; if (roll <= acc) { items.push({ ...this.data.items[it.id], rarity: it.rarity }); break; } } } });
        const primaryHero = this.data.heroes[0];
        const dg = document.getElementById('victory-gold'), dx = document.getElementById('victory-xp-gained'), dl = document.getElementById('victory-level');
        if (dg) dg.innerText = totalGold;
        if (dx) dx.innerText = `+ ${totalXP} XP`;
        if (dl && primaryHero) dl.innerText = primaryHero.level;

        const xpC = document.getElementById('victory-lvl-circle'), xpT = document.getElementById('victory-xp-total');
        const setC = (xp, max) => { if (xpC) xpC.style.strokeDashoffset = 283 - (283 * Math.min(1, xp / max)); };

        if (primaryHero) {
            setC(primaryHero.xp, primaryHero.nextLevelXp);
            if (xpT) xpT.innerText = `${primaryHero.xp} / ${primaryHero.nextLevelXp}`;
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
    debugKillAll() { this.data.enemies.forEach(e => { if (e.hp > 0) this.damageEntity(e, 99999, true, 'physical', null); }); setTimeout(() => this.stepTurn(), 100); },
    debugDie() { this.data.heroes.forEach(h => { if (h.hp > 0) this.damageEntity(h, 99999, true, 'physical', null); }); setTimeout(() => this.stepTurn(), 100); },
    debugInspect() { console.group("--- COMBAT STATS INSPECTOR ---"); console.log("PLAYER:"); console.table(this.data.player.stats); console.log("ATTRIBUTES:"); console.table(this.data.player.attributes); console.groupEnd(); this.data.enemies.forEach(e => { if (e.hp > 0) { console.group(`ENEMY: ${e.name} (${e.role})`); console.table(e.stats); console.table(e.attributes); console.groupEnd(); } }); this.showToastNotification("Stats Logged to Console"); }
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
document.addEventListener('DOMContentLoaded', () => { combatSystem.init(); });
