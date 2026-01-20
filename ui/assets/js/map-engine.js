/**
 * Tactical Map Engine - Fire Emblem / FFT Style
 * Features: Multi-unit control, selection system, premium visuals
 */
(function () {
    'use strict';

    // =====================================================
    // CONFIGURATION (will be updated after map loads)
    // =====================================================
    const CONFIG = {
        CELL_SIZE: 64,
        GRID_COLS: 1,
        GRID_ROWS: 1,
        MIN_ZOOM: 0.5,
        MAX_ZOOM: 2.5,
        ZOOM_STEP: 0.15,
        ANIMATION_SPEED: 100,
        RULER_SIZE: 28,  // Size of the ruler guides
        MAP_PATH: '/public/assets/img/maps/castle-map.webp'
    };

    // Map dimensions (set after image loads)
    let MAP_WIDTH = 0;
    let MAP_HEIGHT = 0;
    let mapLoaded = false;

    // =====================================================
    // GAME STATE
    // =====================================================
    const gameState = {
        turn: 1,
        phase: 'player', // 'player', 'enemy'
        selectedUnit: null,
        currentAction: null, // 'move', 'attack', null
        unitsActedThisTurn: new Set(),
        isAnimating: false,
        gameOver: false,
        victory: false,
        unitUndoState: null // { unitId, x, y }
    };

    // =====================================================
    // ENTITIES
    // =====================================================
    let playerUnits = [];
    let enemyUnits = [];
    let chests = [];
    let portal = null;
    let loadedImages = {};

    // =====================================================
    // CANVAS STATE
    // =====================================================
    let canvas, ctx, minimapCanvas, minimapCtx;
    let viewState = { x: 0, y: 0, scale: 1 };
    let cameraTarget = null;

    let isDragging = false;
    let dragStartPos = null;
    let lastMousePos = { x: 0, y: 0 };
    let hoveredCell = null;
    let reachableCells = [];
    let attackableCells = [];
    let attackPreviewCells = []; // Cells showing 3x3 attack radius (allies who will join)
    let pendingAttack = null;    // { hero, enemy, allies, enemies } - pending attack confirmation
    let pathPreview = [];

    let animationFrame = 0;
    let needsRender = true;
    let floatingTexts = [];

    // =====================================================
    // WALLS - Castle layout (match visible walls in castle-map.png)
    // =====================================================
    const WALLS = [
        // Castle walls - adjust based on actual map layout
        // Water/moat on left side
        { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 1, y: 5 },
        { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
        // Castle towers
        { x: 20, y: 3 }, { x: 20, y: 4 }, { x: 21, y: 3 }, { x: 21, y: 4 },
        { x: 28, y: 3 }, { x: 28, y: 4 }, { x: 29, y: 3 }, { x: 29, y: 4 },
    ];

    // =====================================================
    // INITIALIZATION - With Map Auto-Detection
    // =====================================================
    function init() {
        canvas = document.getElementById('map-canvas');
        minimapCanvas = document.getElementById('minimap-canvas');

        if (!canvas) return console.error('Canvas not found');

        ctx = canvas.getContext('2d', { alpha: false });
        if (minimapCanvas) minimapCtx = minimapCanvas.getContext('2d');

        // Show loading state
        showLoadingState('Carregando mapa...');

        // Check if returning from battle
        const battleResultString = sessionStorage.getItem('battleResult');
        const battleResult = battleResultString ? JSON.parse(battleResultString) : null;

        // Load map image first to detect dimensions
        loadMapImage().then(() => {
            // Check for saved map state (returning from battle)
            const savedState = loadMapState();
            let cameraRestored = false;

            if (savedState) {
                restoreMapState(savedState);
                cameraRestored = true;

                // Handle battle result AFTER restoring state
                if (battleResult) {
                    handleBattleResult(battleResult);
                    sessionStorage.removeItem('battleResult');
                }
            } else {
                // Fresh Start Case
                initializeEntities();
                sessionStorage.removeItem('mapState'); // Ensure no stale state
                sessionStorage.removeItem('battleResult');
            }

            setupEventListeners();

            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(canvas.parentElement);

            // Only initialize camera if not restored from saved state
            if (!cameraRestored) {
                setTimeout(initCamera, 50);
            }

            updateUI();
            requestAnimationFrame(gameLoop);

            // Hide loading
            hideLoadingState();

            // Show starting banner only if NOT returning from battle
            if (!battleResult) {
                setTimeout(() => showTurnBanner('player'), 600);
            }
        }).catch(err => {
            console.error('Failed to load map:', err);
            showLoadingState('Erro ao carregar mapa');
        });
    }

    function loadMapImage() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Auto-detect dimensions
                MAP_WIDTH = img.width;
                MAP_HEIGHT = img.height;

                // Calculate grid size
                CONFIG.GRID_COLS = Math.ceil(MAP_WIDTH / CONFIG.CELL_SIZE);
                CONFIG.GRID_ROWS = Math.ceil(MAP_HEIGHT / CONFIG.CELL_SIZE);

                console.log(`Map loaded: ${MAP_WIDTH}x${MAP_HEIGHT} (${CONFIG.GRID_COLS}x${CONFIG.GRID_ROWS} cells)`);

                loadedImages['map'] = img;
                mapLoaded = true;
                resolve();
            };
            img.onerror = () => reject(new Error('Map image failed to load'));
            img.src = CONFIG.MAP_PATH;
        });
    }

    function showLoadingState(message) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            const text = overlay.querySelector('.loading-text');
            if (text) text.textContent = message;
        }
    }

    function hideLoadingState() {
        setTimeout(() => {
            document.getElementById('loading-overlay')?.classList.add('hidden');
        }, 300);
    }

    function initializeEntities() {
        // Get entity data from combatData if available
        const entities = window.combatData?.entities || {};

        // Helper to get entity name from combatData
        const getEntityName = (key, fallback) => {
            return entities[key]?.name || fallback;
        };

        // Player Units (your team) - Using dynamic names from combatData
        playerUnits = [
            {
                id: 'hero1', name: getEntityName('hero_swordman', 'Swordman'), type: 'player',
                x: 16, y: 8, hp: 100, maxHp: 100, sp: 50, maxSp: 50, attack: 18, defense: 12,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/swordman-male.webp',
                class: 'warrior', scale: 1.0
            },
            {
                id: 'hero2', name: getEntityName('hero_mage', 'Mage'), type: 'player',
                x: 15, y: 10, hp: 60, maxHp: 60, sp: 100, maxSp: 100, attack: 25, defense: 5,
                moveRange: 3, attackRange: 3, avatar: '/public/assets/img/mage-male.webp',
                class: 'mage', scale: 1.0
            },
            {
                id: 'hero3', name: getEntityName('hero_archer', 'Archer'), type: 'player',
                x: 14, y: 9, hp: 70, maxHp: 70, sp: 60, maxSp: 60, attack: 20, defense: 8,
                moveRange: 5, attackRange: 3, avatar: '/public/assets/img/archer-female.webp',
                class: 'archer', scale: 1.0
            }
        ];

        // Enemy Units - Positioned closer for group combat testing
        enemyUnits = [
            {
                id: 'orc1', name: getEntityName('orc', 'Orc Warrior'), type: 'enemy',
                x: 18, y: 8, hp: 35, maxHp: 35, attack: 10, defense: 5,
                moveRange: 3, attackRange: 1, avatar: '/public/assets/img/orc.webp',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc2', name: getEntityName('orc_scout', 'Orc Scout'), type: 'enemy',
                x: 19, y: 7, hp: 45, maxHp: 45, attack: 15, defense: 3,  // Adjacent to orc1
                moveRange: 2, attackRange: 3, avatar: '/public/assets/img/orc_scout.webp',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'orc3', name: getEntityName('bandit_marauder', 'Bandit Marauder'), type: 'enemy',
                x: 19, y: 9, hp: 120, maxHp: 120, attack: 22, defense: 10,  // Adjacent to orc1
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/bandit_marauder.webp',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc4', name: getEntityName('goblin', 'Goblin Scout'), type: 'enemy',
                x: 30, y: 5, hp: 40, maxHp: 40, attack: 18, defense: 3,
                moveRange: 2, attackRange: 2, avatar: '/public/assets/img/goblin.png',
                behavior: 'defensive', scale: 1.0
            }
        ];

        // Chests - scattered around map
        chests = [
            { id: 'chest1', x: 10, y: 8, opened: false, loot: { gold: 25, item: 'Poção de Vida' } },
            { id: 'chest2', x: 22, y: 12, opened: false, loot: { gold: 50, item: 'Elixir' } },
            { id: 'chest3', x: 35, y: 7, opened: false, loot: { gold: 35, item: 'Bomba' } }
        ];

        // Portal - at the far right of castle
        portal = { id: 'portal', x: 36, y: 8, name: 'Portão do Castelo' };

        loadImages();
    }

    function loadImages() {
        // Map is already loaded in loadMapImage(), only load other assets
        const sources = {
            portal: '/public/assets/img/portal.png',
            chest: '/public/assets/img/chest.png'
        };

        [...playerUnits, ...enemyUnits].forEach(u => sources[u.id] = u.avatar);

        Object.entries(sources).forEach(([id, src]) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { loadedImages[id] = img; needsRender = true; };
        });
    }

    // =====================================================
    // TURN SYSTEM
    // =====================================================
    async function endPlayerTurn() {
        if (gameState.phase !== 'player' || gameState.isAnimating) return;

        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.phase = 'enemy';

        // Close all menus/popups
        hideActionMenu();
        hideAttackConfirmPopup();
        attackPreviewCells = [];
        pendingAttack = null;

        // unitsActedThisTurn is NOT cleared here so player units keep their 'check' icon
        clearHighlights();
        updateUI();

        // Hide footer during enemy turn
        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
        }

        needsRender = true;

        await showTurnBanner('enemy');
        setTimeout(() => processEnemyTurn(), 500);
    }

    async function processEnemyTurn() {
        for (const enemy of enemyUnits) {
            if (enemy.hp <= 0) continue;

            // Find closest player unit
            let closestPlayer = null;
            let closestDist = Infinity;
            for (const player of playerUnits) {
                if (player.hp <= 0) continue;
                const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPlayer = player;
                }
            }

            if (!closestPlayer) continue;

            // Move towards player
            const path = findPath(enemy, closestPlayer, enemy.moveRange);
            if (path.length > 0) {
                // Move path should stop BEFORE the target if target is at attack range
                let stopIndex = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const distToPlayer = Math.max(Math.abs(path[i].x - closestPlayer.x), Math.abs(path[i].y - closestPlayer.y));
                    if (distToPlayer <= enemy.attackRange) {
                        stopIndex = i;
                        break;
                    }
                }

                const movePath = path.slice(0, Math.min(enemy.moveRange, stopIndex + 1));
                for (const step of movePath) {
                    await animateMove(enemy, step.x, step.y);
                    enemy.x = step.x;
                    enemy.y = step.y;
                }
            }

            // Check if enemy is now adjacent to a player - trigger battle!
            const adjacentHero = window.MapEntityBridge?.getEncounterEnemy(
                { x: enemy.x, y: enemy.y },
                playerUnits
            );

            if (adjacentHero) {
                // Enemy initiated encounter - battle with the hero they touched
                await triggerBattleEncounter(adjacentHero, enemy);
                return; // Battle will handle everything
            }

            gameState.unitsActedThisTurn.add(enemy.id);
            updateUI();
            needsRender = true;
            await sleep(200);
        }

        startPlayerTurn();
    }

    async function startPlayerTurn() {
        gameState.turn++;
        gameState.phase = 'player';
        gameState.unitsActedThisTurn.clear();

        // Reset hasMoved flag for all player units
        playerUnits.forEach(u => u.hasMoved = false);

        updateUI();

        // Show footer during player turn
        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '1';
            footer.style.pointerEvents = 'auto';
        }

        await showTurnBanner('player');

        // Check victory / defeat
        const aliveEnemies = enemyUnits.filter(e => e.hp > 0);
        const alivePlayers = playerUnits.filter(p => p.hp > 0);

        if (aliveEnemies.length === 0) {
            triggerVictory();
        } else if (alivePlayers.length === 0) {
            triggerGameOver();
        }
    }

    function canUnitAct(unit) {
        return unit.hp > 0 && !gameState.unitsActedThisTurn.has(unit.id);
    }

    // =====================================================
    // SELECTION & ACTIONS
    // =====================================================
    function selectUnit(unit) {
        if (!unit || unit.type !== 'player' || !canUnitAct(unit)) {
            deselectUnit();
            return;
        }

        gameState.selectedUnit = unit;
        gameState.currentAction = null;

        // Store pre-move position for Undo
        if (!unit.hasMoved) {
            gameState.unitUndoState = {
                unitId: unit.id,
                x: unit.x,
                y: unit.y
            };
        }

        clearHighlights();
        showActionMenu(unit);
        updateUI();
        needsRender = true;
    }

    function deselectUnit(force = false) {
        if (!force && gameState.selectedUnit && gameState.selectedUnit.hasMoved) {
            // Cannot deselect a unit that has moved but not acted/undone
            showActionMenu(gameState.selectedUnit);
            return;
        }
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        clearHighlights();
        hideActionMenu();
        updateUI();
        needsRender = true;
    }

    function setAction(action) {
        if (!gameState.selectedUnit) return;

        gameState.currentAction = action;
        clearHighlights();

        if (action === 'move') {
            calculateReachableCells(gameState.selectedUnit);
        } else if (action === 'attack') {
            calculateAttackableCells(gameState.selectedUnit);
        }

        hideActionMenu();
        updateUI();
        needsRender = true;
    }

    function clearHighlights() {
        reachableCells = [];
        attackableCells = [];
        pathPreview = [];
    }

    // =====================================================
    // MOVEMENT
    // =====================================================
    function calculateReachableCells(unit) {
        reachableCells = [];
        const visited = new Set();
        const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
        visited.add(`${unit.x},${unit.y}`);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.cost > 0 && !isOccupied(current.x, current.y)) {
                reachableCells.push({ x: current.x, y: current.y, cost: current.cost });
            }

            if (current.cost < unit.moveRange) {
                const neighbors = getNeighbors(current.x, current.y);
                for (const n of neighbors) {
                    const key = `${n.x},${n.y}`;
                    if (visited.has(key)) continue;
                    if (isWall(n.x, n.y)) continue;

                    visited.add(key);
                    queue.push({ x: n.x, y: n.y, cost: current.cost + 1 });
                }
            }
        }
        needsRender = true;
    }

    function calculateAttackableCells(unit) {
        attackableCells = [];
        for (const enemy of enemyUnits) {
            if (enemy.hp <= 0) continue;
            const dist = Math.max(Math.abs(unit.x - enemy.x), Math.abs(unit.y - enemy.y));
            if (dist <= unit.attackRange) {
                attackableCells.push({ x: enemy.x, y: enemy.y, target: enemy });
            }
        }
        needsRender = true;
    }

    async function moveUnitTo(unit, targetX, targetY) {
        if (gameState.isAnimating) return;
        if (unit.hasMoved) return; // Prevent moving again after first move

        const path = findPath(unit, { x: targetX, y: targetY }, unit.moveRange);
        if (path.length === 0) return;

        gameState.isAnimating = true;
        hideActionMenu();

        try {
            for (const step of path) {
                await animateMove(unit, step.x, step.y);
                unit.x = step.x;
                unit.y = step.y;

                // Check chest
                const chest = chests.find(c => c.x === step.x && c.y === step.y && !c.opened);
                if (chest) {
                    chest.opened = true;
                    showNotification(`+${chest.loot.gold} Gold, ${chest.loot.item}!`, 'success');
                }

                // Check portal
                if (portal && step.x === portal.x && step.y === portal.y) {
                    triggerVictory();
                    return;
                }
            }

            // Mark unit as having moved this turn
            unit.hasMoved = true;

            // Clear movement grid
            reachableCells = [];
            attackableCells = [];

            // ALWAYS show action menu after move (Allow Undo or Finish manually)
            showActionMenu(unit);

        } finally {
            gameState.isAnimating = false;
            updateUI();
            needsRender = true;
        }
    }

    function animateMove(entity, toX, toY) {
        return new Promise(resolve => {
            const startX = (entity.x - 0.5) * CONFIG.CELL_SIZE;
            const startY = (entity.y - 0.5) * CONFIG.CELL_SIZE;
            const endX = (toX - 0.5) * CONFIG.CELL_SIZE;
            const endY = (toY - 0.5) * CONFIG.CELL_SIZE;
            const startTime = performance.now();

            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const t = Math.min(elapsed / CONFIG.ANIMATION_SPEED, 1);
                const eased = 1 - Math.pow(1 - t, 3);

                entity.renderX = startX + (endX - startX) * eased;
                entity.renderY = startY + (endY - startY) * eased;
                needsRender = true;

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    entity.renderX = null;
                    entity.renderY = null;
                    resolve();
                }
            }
            requestAnimationFrame(animate);
        });
    }

    // =====================================================
    // BATTLE ENCOUNTER SYSTEM
    // =====================================================

    /**
     * Trigger a battle encounter when hero meets enemy
     */
    async function triggerBattleEncounter(hero, enemy) {
        if (!window.MapEntityBridge) {
            console.error('MapEntityBridge not loaded!');
            return;
        }

        gameState.isAnimating = true;

        // Show participation zones on the map for a moment
        showAttackPreview(hero, enemy);
        needsRender = true;

        // Short delay so user can see the zones on the map (especially if enemy initialized)
        await new Promise(resolve => setTimeout(resolve, 800));

        const battleHeroes = pendingAttack.allies;
        const battleEnemies = pendingAttack.enemies.length > 0 ? pendingAttack.enemies : [enemy];

        console.log(`[Combat] Battle triggered! Initiator: ${hero.name} vs ${enemy.name}`);
        console.log(`[Combat] Participating Allies: ${battleHeroes.map(h => h.name).join(', ')}`);

        // Mark all participating allies as having acted
        battleHeroes.forEach(ally => {
            gameState.unitsActedThisTurn.add(ally.id);
        });

        // Show battle confirmation overlay
        await showBattleConfirmation(battleHeroes, battleEnemies);

        // Smooth fade out before navigation
        const flashImpact = document.querySelector('.flash-impact');
        if (flashImpact) {
            flashImpact.style.opacity = '1';
            flashImpact.style.transition = 'opacity 0.2s ease-out';
        }

        saveMapState();

        const battleData = MapEntityBridge.prepareBattleData(battleHeroes, battleEnemies, hero.id);
        sessionStorage.setItem('pendingBattle', JSON.stringify(battleData));

        setTimeout(() => {
            window.location.href = '/game/battle-from-map';
        }, 300);
    }

    /**
     * Show cinematic battle confirmation overlay
     */
    function showBattleConfirmation(heroes, enemies) {
        return new Promise(resolve => {
            const overlay = document.getElementById('battle-overlay');
            if (!overlay) {
                console.warn('Battle overlay not found');
                setTimeout(resolve, 100);
                return;
            }

            // Populate hero portraits (using the new VS card format)
            const heroesContainer = overlay.querySelector('.battle-heroes');
            if (heroesContainer) {
                heroesContainer.innerHTML = heroes.map(h =>
                    `<div class="vs-card hero">
                        <img src="${h.avatar}" alt="${h.name}">
                        <div class="vs-card-name">${h.name}</div>
                    </div>`
                ).join('');
            }

            // Populate enemy portraits
            const enemiesContainer = overlay.querySelector('.battle-enemies');
            if (enemiesContainer) {
                enemiesContainer.innerHTML = enemies.map(e =>
                    `<div class="vs-card enemy">
                        <img src="${e.avatar}" alt="${e.name}">
                        <div class="vs-card-name">${e.name}</div>
                    </div>`
                ).join('');
            }

            // Show overlay
            overlay.classList.remove('hidden');
            overlay.classList.add('active');

            // Wait for dramatic effect
            setTimeout(resolve, 2500);
        });
    }

    /**
     * Save map state to session storage
     */
    function saveMapState() {
        const state = {
            playerUnits,
            enemyUnits,
            chests,
            gameState: {
                turn: gameState.turn,
                phase: gameState.phase,
                unitsActed: Array.from(gameState.unitsActedThisTurn)
            },
            camera: {
                x: viewState.x,
                y: viewState.y,
                scale: viewState.scale
            }
        };
        console.log('[MapEngine] Saving state with camera:', state.camera);
        sessionStorage.setItem('mapState', JSON.stringify(state));
    }

    /**
     * Load map state from session storage
     */
    function loadMapState() {
        const saved = sessionStorage.getItem('mapState');
        if (saved) {
            sessionStorage.removeItem('mapState');
            return JSON.parse(saved);
        }
        return null;
    }

    /**
     * Restore map state from saved data
     */
    function restoreMapState(state) {
        console.log('[MapEngine] Restoring state:', state);

        playerUnits = state.playerUnits || [];
        enemyUnits = state.enemyUnits || [];
        chests = state.chests || [];

        if (state.gameState) {
            gameState.turn = state.gameState.turn || 1;
            gameState.phase = state.gameState.phase || 'player';
            gameState.unitsActedThisTurn = new Set(state.gameState.unitsActed || []);
        }

        // Restore Camera - CRITICAL: Preserve the exact saved position
        let cameraRestored = false;
        if (state.camera) {
            console.log('[MapEngine] Restoring camera:', state.camera);
            viewState.x = state.camera.x;
            viewState.y = state.camera.y;
            viewState.scale = state.camera.scale;
            cameraTarget = null; // Don't snap on restore
            cameraRestored = true;

            // Extra safety: Re-apply after a frame to ensure it sticks
            requestAnimationFrame(() => {
                viewState.x = state.camera.x;
                viewState.y = state.camera.y;
                viewState.scale = state.camera.scale;
                needsRender = true;
                console.log('[MapEngine] Camera re-applied:', viewState);
            });
        }

        // Clean UI state after restoration - CRITICAL for control restoration
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.isAnimating = false; // Explicitly reset to enable interactions
        clearHighlights();
        updateSelectedUnitPanel();

        // IMPORTANT: Only center on units if NO camera was saved (fresh start scenario)
        if (!cameraRestored && playerUnits.length > 0) {
            setTimeout(() => centerOnUnits(playerUnits), 100);
        }

        // IMPORTANT: Reload images after restoring state
        loadImages();

        // Force canvas resize recalculation to restore rulers
        if (canvas && canvas.parentElement) {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        needsRender = true;
    }


    /**
 * Handle battle result when returning from combat
 */
    async function handleBattleResult(result) {
        // 1. Sync stats for all participants
        if (result.units) {
            result.units.forEach(syncUnit => {
                const unit = [...playerUnits, ...enemyUnits].find(u => u.id === syncUnit.mapId);
                if (unit) {
                    unit.hp = syncUnit.hp;
                    unit.maxHp = syncUnit.maxHp;
                    if (syncUnit.sp !== undefined) {
                        unit.sp = syncUnit.sp;
                        unit.maxSp = syncUnit.maxSp;
                    }
                }
            });
        }

        // 2. Handle defeats with cinematic focus
        const casualties = [
            ...(result.defeatedEnemyMapIds || []).map(id => ({ id, type: 'enemy' })),
            ...(result.defeatedHeroMapIds || []).map(id => ({ id, type: 'hero' }))
        ];

        for (const casualty of casualties) {
            const list = casualty.type === 'enemy' ? enemyUnits : playerUnits;
            const idx = list.findIndex(u => u.id === casualty.id);
            if (idx !== -1) {
                const unit = list[idx];

                // Focus camera on victim
                await animateCameraToUnit(unit);
                await new Promise(r => setTimeout(r, 300));

                // Spawn death effects
                spawnDeathEffect((unit.x - 0.5) * CONFIG.CELL_SIZE, (unit.y - 0.5) * CONFIG.CELL_SIZE);
                showFloatingText('DERROTADO', (unit.x - 0.5) * CONFIG.CELL_SIZE, (unit.y - 0.5) * CONFIG.CELL_SIZE - 20, '#ef4444');

                // Wait for impact
                await new Promise(r => setTimeout(r, 500));

                // Remove unit
                list.splice(idx, 1);
                needsRender = true;
            }
        }

        // 3. Final feedback
        if (result.outcome === 'victory') {
            showNotification('Vitória! Área limpa.', 'success');
        } else if (result.outcome === 'defeat') {
            if (playerUnits.filter(u => u.hp > 0).length === 0) {
                setTimeout(() => triggerGameOver(), 500);
            } else {
                showNotification('Retirada estratégica...', 'error');
            }
        }

        // Mark initiator as having acted
        if (result.initiatorId) {
            gameState.unitsActedThisTurn.add(result.initiatorId);
        }

        // Auto-end turn if all units acted
        const allActed = playerUnits.every(u => u.hp <= 0 || gameState.unitsActedThisTurn.has(u.id));
        if (allActed && gameState.phase === 'player') {
            endPlayerTurn();
        }

        // Final camera safety center
        setTimeout(() => {
            if (playerUnits.length > 0) centerOnUnits(playerUnits);
            needsRender = true;
        }, 800);

        needsRender = true;
        updateUI();
    }

    /**
     * Simple camera animation
     */
    function animateCameraToUnit(unit) {
        return new Promise(resolve => {
            const targetX = -(unit.x - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.width / 2;
            const targetY = -(unit.y - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.height / 2;

            cameraTarget = { x: targetX, y: targetY };

            // Wait for camera to settle (roughly)
            setTimeout(resolve, 600);
        });
    }


    // =====================================================
    // PATHFINDING
    // =====================================================
    function findPath(start, end, maxDist = 100) {
        const openList = [{ x: start.x, y: start.y, g: 0, h: 0, f: 0, parent: null }];
        const closedList = [];

        while (openList.length > 0) {
            let lowInd = 0;
            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < openList[lowInd].f) lowInd = i;
            }
            const current = openList[lowInd];

            if (current.x === end.x && current.y === end.y) {
                const path = [];
                let node = current;
                while (node.parent) {
                    path.push({ x: node.x, y: node.y });
                    node = node.parent;
                }
                return path.reverse().slice(0, maxDist);
            }

            openList.splice(lowInd, 1);
            closedList.push(current);

            const neighbors = getNeighbors(current.x, current.y);
            for (const n of neighbors) {
                if (isWall(n.x, n.y)) continue;
                if (closedList.find(c => c.x === n.x && c.y === n.y)) continue;

                const g = current.g + 1;
                let neighbor = openList.find(o => o.x === n.x && o.y === n.y);

                if (!neighbor) {
                    neighbor = {
                        x: n.x, y: n.y, g,
                        h: Math.abs(n.x - end.x) + Math.abs(n.y - end.y),
                        f: 0, parent: current
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    openList.push(neighbor);
                } else if (g < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = g;
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }
        return [];
    }

    function getNeighbors(x, y) {
        return [
            { x: x - 1, y }, { x: x + 1, y },
            { x, y: y - 1 }, { x, y: y + 1 }
        ].filter(n => n.x >= 1 && n.x <= CONFIG.GRID_COLS && n.y >= 1 && n.y <= CONFIG.GRID_ROWS);
    }

    function isWall(x, y) {
        return WALLS.some(w => w.x === x && w.y === y);
    }

    function isOccupied(x, y) {
        return [...playerUnits, ...enemyUnits].some(u => u.hp > 0 && u.x === x && u.y === y);
    }

    function getUnitAt(x, y) {
        return [...playerUnits, ...enemyUnits].find(u => u.hp > 0 && u.x === x && u.y === y);
    }

    // =====================================================
    // UI
    // =====================================================
    function updateUI() {
        const hud = document.getElementById('group-hud');
        if (hud) {
            playerUnits.forEach(unit => {
                const hpPct = Math.max(0, unit.hp / unit.maxHp) * 100;
                const spValue = unit.sp !== undefined ? unit.sp : (unit.mp !== undefined ? unit.mp : 0);
                const maxSpValue = unit.maxSp || unit.maxMp || 100;
                const spPct = (spValue / maxSpValue) * 100;
                const isActive = gameState.selectedUnit === unit;

                let card = document.getElementById(`status-${unit.id}`);
                if (!card) {
                    // Create if not exists
                    const cardHtml = `
                        <div class="unit-status-card" id="status-${unit.id}">
                            <div class="status-portrait">
                                <img src="${unit.avatar}" alt="${unit.name}">
                            </div>
                            <div class="status-info">
                                <div class="status-name">${unit.name}</div>
                                <div class="status-bars">
                                    <div class="bar-wrapper">
                                        <div class="bar-fill bar-hp" style="width: ${hpPct}%"></div>
                                        <span class="bar-text hp-text">${unit.hp}/${unit.maxHp}</span>
                                    </div>
                                    <div class="bar-wrapper">
                                        <div class="bar-fill bar-sp" style="width: ${spPct}%"></div>
                                        <span class="bar-text sp-text">${spValue}/${maxSpValue}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    hud.insertAdjacentHTML('beforeend', cardHtml);
                    card = document.getElementById(`status-${unit.id}`);
                }

                // Update existing card properties
                if (isActive) card.classList.add('active');
                else card.classList.remove('active');

                const hpFill = card.querySelector('.bar-hp');
                const hpText = card.querySelector('.hp-text');
                const spFill = card.querySelector('.bar-sp');
                const spText = card.querySelector('.sp-text');

                if (hpFill) hpFill.style.width = `${hpPct}%`;
                if (hpText) hpText.textContent = `${unit.hp}/${unit.maxHp}`;
                if (spFill) spFill.style.width = `${spPct}%`;
                if (spText) spText.textContent = `${spValue}/${maxSpValue}`;
            });

            // Remove cards for units no longer in playerUnits
            Array.from(hud.children).forEach(card => {
                const id = card.id.replace('status-', '');
                if (!playerUnits.find(u => u.id === id)) card.remove();
            });
        }

        const turnEl = document.getElementById('mini-name');
        if (turnEl && !gameState.selectedUnit) {
            turnEl.textContent = `Turno ${gameState.turn}`;
        }

        const remainingEl = document.getElementById('mini-status');
        if (remainingEl && !gameState.selectedUnit) {
            const remaining = playerUnits.filter(u => canUnitAct(u)).length;
            const total = playerUnits.filter(u => u.hp > 0).length;
            remainingEl.textContent = `${remaining}/${total} unidades prontas`;
        }

        // End turn button with highlight logic
        const endBtn = document.getElementById('btn-end-turn');
        if (endBtn) {
            const canEnd = gameState.phase === 'player' && !gameState.isAnimating;
            endBtn.disabled = !canEnd;
            const unacted = playerUnits.filter(u => canUnitAct(u)).length;
            if (unacted === 0 && canEnd) {
                endBtn.classList.add('pulse-highlight');
            } else {
                endBtn.classList.remove('pulse-highlight');
            }
        }

        // Selected unit premium mini-panel
        updateSelectedUnitPanel();

        needsRender = true;
    }

    function updateSelectedUnitPanel() {
        const miniName = document.getElementById('mini-name');
        const miniStatus = document.getElementById('mini-status');
        const miniAvatar = document.getElementById('mini-avatar');
        const miniStatsRow = document.getElementById('mini-stats-row');
        const miniMove = document.getElementById('mini-move');
        const miniAtk = document.getElementById('mini-atk');

        if (gameState.selectedUnit) {
            const u = gameState.selectedUnit;
            if (miniName) miniName.textContent = u.name;
            if (miniAvatar) miniAvatar.src = u.avatar;

            if (miniStatus) miniStatus.classList.add('hidden');
            if (miniStatsRow) {
                miniStatsRow.classList.remove('hidden');
                miniStatsRow.classList.add('flex');
            }
            if (miniMove) miniMove.textContent = u.moveRange;
            if (miniAtk) miniAtk.textContent = u.attackRange;
        } else {
            if (miniStatus) miniStatus.classList.remove('hidden');
            if (miniStatsRow) {
                miniStatsRow.classList.add('hidden');
                miniStatsRow.classList.remove('flex');
            }
            if (miniName) miniName.textContent = `Exploração (Turno ${gameState.turn})`;
            if (miniAvatar) miniAvatar.src = '';
        }
    }

    function showActionMenu(unit) {
        if (!unit) return;
        const menu = document.getElementById('action-menu');
        if (!menu) return;

        const btnMove = document.getElementById('action-move');
        const btnAttack = document.getElementById('action-attack');
        const btnUndo = document.getElementById('action-undo');
        const btnFinish = document.getElementById('action-finish');

        const btnCancel = document.getElementById('action-cancel');

        // Logic: Only show Move if unit hasn't moved yet
        if (btnMove) btnMove.style.display = unit.hasMoved ? 'none' : 'flex';

        // Logic: Only show Undo if unit HAS moved and is the selected unit
        if (btnUndo) btnUndo.style.display = (unit.hasMoved && !gameState.unitsActedThisTurn.has(unit.id)) ? 'flex' : 'none';

        // Logic: Hide Cancel if unit has moved (must Finish, Attack or Undo)
        if (btnCancel) btnCancel.style.display = unit.hasMoved ? 'none' : 'flex';

        // Attack and Finish are always visible when menu is shown
        if (btnAttack) btnAttack.style.display = 'flex';
        if (btnFinish) btnFinish.style.display = 'flex';

        // Re-create icons after showing menu
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }

        const screenPos = worldToScreen(unit.x, unit.y);
        menu.style.left = `${screenPos.x + 40}px`;
        menu.style.top = `${screenPos.y - 60}px`;
        menu.classList.add('visible');
    }

    function getUnitAtRange(unit, range, type) {
        return [...playerUnits, ...enemyUnits].find(u =>
            u.hp > 0 &&
            u.type === type &&
            Math.max(Math.abs(u.x - unit.x), Math.abs(u.y - unit.y)) <= range
        );
    }

    /**
     * Show attack preview - GROUP COMBAT SYSTEM
     * Allies in 3x3 around attacking hero participate
     * Enemies in 3x3 around target enemy participate
     */
    function undoMove() {
        if (!gameState.selectedUnit || !gameState.unitUndoState) return;
        const unit = gameState.selectedUnit;

        // Safety: Ensure undo state belongs to this unit
        if (gameState.unitUndoState.unitId !== unit.id) {
            console.warn('[MapEngine] Undo state mismatch');
            return;
        }

        // Move back to stored position
        unit.x = gameState.unitUndoState.x;
        unit.y = gameState.unitUndoState.y;
        unit.hasMoved = false;

        // Clear visuals and re-show menu
        clearHighlights();
        showActionMenu(unit);
        showNotification('Movimento desfeito', 'info');
        needsRender = true;
    }

    function finishUnitTurn(unit) {
        if (!unit) return;
        gameState.unitsActedThisTurn.add(unit.id);

        // Clear visuals and check for end of complete phase
        deselectUnit(true);
        const allActed = playerUnits.every(u => u.hp <= 0 || gameState.unitsActedThisTurn.has(u.id));
        if (allActed) endPlayerTurn();

        needsRender = true;
    }

    /**
     * Show attack preview - NEW TACTICAL PARTICIPATION RULES (Option 2: 3x3 Engagement)
     * Anyone adjacent to EITHER the initiator OR the target joins the fray.
     */
    function showAttackPreview(hero, enemy) {
        hideActionMenu();

        const range = hero.attackRange || 1;

        // ALLIES PARTICIPATION: Initiator + anyone in range around the Initiator (The Engagement Zone)
        const alliesInRange = playerUnits.filter(u =>
            u.hp > 0 && Math.max(Math.abs(u.x - hero.x), Math.abs(u.y - hero.y)) <= range
        );

        // ENEMIES PARTICIPATION: Anyone in range around the Initiator (The Engagement Zone)
        const enemiesInRange = enemyUnits.filter(u =>
            u.hp > 0 && Math.max(Math.abs(u.x - hero.x), Math.abs(u.y - hero.y)) <= range
        );

        // Ensure the primary target is ALWAYS included even if something weird happens
        if (enemy && !enemiesInRange.find(e => e.id === enemy.id)) {
            enemiesInRange.push(enemy);
        }

        // Build preview cells - EXTENDED based on unit attack range
        attackPreviewCells = [];

        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                // Chebyshev distance check for the grid
                if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue;

                const cx = hero.x + dx;
                const cy = hero.y + dy;

                // Ally/Enemy detection for participation (still uses 3x3 skirmish logic for participants)
                const allyHere = alliesInRange.find(a => a.x === cx && a.y === cy);
                const enemyHere = enemiesInRange.find(e => e.x === cx && e.y === cy);

                attackPreviewCells.push({
                    x: cx, y: cy,
                    hasAlly: !!allyHere,
                    hasEnemy: !!enemyHere,
                    type: (allyHere && enemyHere) ? 'clash' : (allyHere ? 'ally-zone' : (enemyHere ? 'enemy-zone' : 'neutral-zone'))
                });
            }
        }

        // Ensure the primary target is ALWAYS highlighted even if outside the hero's 3x3 (for ranged)
        if (enemy) {
            const targetInPreview = attackPreviewCells.find(c => c.x === enemy.x && c.y === enemy.y);
            if (!targetInPreview) {
                attackPreviewCells.push({
                    x: enemy.x, y: enemy.y,
                    hasAlly: false, hasEnemy: true,
                    type: 'enemy-zone'
                });
            }
        }

        // UI Adjustments
        const btnConfirm = document.getElementById('acp-confirm');
        if (btnConfirm) {
            // Disable confirm button if no enemies in range
            if (enemiesInRange.length === 0) {
                btnConfirm.disabled = true;
                btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
                btnConfirm.classList.remove('pulse');
            } else {
                btnConfirm.disabled = false;
                btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
                btnConfirm.classList.add('pulse');
            }
        }

        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
        }

        pendingAttack = { hero, enemy, allies: alliesInRange, enemies: enemiesInRange };
        showAttackConfirmDialog(hero, enemy, alliesInRange, enemiesInRange);
        needsRender = true;
    }



    /**
     * Show attack confirmation popup (inline glassmorphism style)
     */
    function showAttackConfirmDialog(hero, enemy, allies, enemies) {
        const popup = document.getElementById('attack-confirm-popup');
        if (!popup) {
            // Fallback to direct attack if popup not found
            triggerBattleEncounter(hero, enemy);
            return;
        }

        // Update counts
        document.getElementById('acp-hero-count').textContent = allies.length;
        document.getElementById('acp-enemy-count').textContent = enemies.length;

        // Show popup
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('visible'), 10);

        // Refresh lucide icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 20);
        }

        // Set up button handlers (remove old handlers first)
        const confirmBtn = document.getElementById('acp-confirm');
        const cancelBtn = document.getElementById('acp-cancel');

        const handleConfirm = () => {
            hideAttackConfirmPopup();
            attackPreviewCells = [];
            pendingAttack = null;
            triggerBattleEncounter(hero, enemy);
        };

        const handleCancel = () => {
            hideAttackConfirmPopup();
            attackPreviewCells = [];
            pendingAttack = null;
            showActionMenu(hero);
            needsRender = true;
        };

        // Clone and replace to remove old listeners
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newConfirm.addEventListener('click', handleConfirm);
        newCancel.addEventListener('click', handleCancel);

        // Refresh icons again after clone
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 30);
        }
    }

    function hideAttackConfirmPopup() {
        const popup = document.getElementById('attack-confirm-popup');
        if (popup) {
            popup.classList.remove('visible');
            setTimeout(() => popup.classList.add('hidden'), 300);
        }

        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '1';
            footer.style.pointerEvents = 'auto';
        }
        attackPreviewCells = [];
        pendingAttack = null;
        needsRender = true;
    }

    async function showTurnBanner(phase) {
        const banner = document.getElementById('turn-banner');
        const bannerText = document.getElementById('banner-text');
        if (!banner || !bannerText) return;

        const isPlayer = phase === 'player';
        banner.className = `turn-banner active ${phase}`;
        bannerText.textContent = isPlayer ? 'SEU TURNO' : 'TURNO INIMIGO';

        // Update marquee text for flavor
        const marquee = banner.querySelector('.banner-marquee-text');
        if (marquee) {
            const phrase = isPlayer ? 'HEROES ASCEND ' : 'ENEMIES ADVANCE ';
            marquee.textContent = phrase.repeat(10);
        }

        return new Promise(resolve => {
            setTimeout(() => {
                banner.classList.remove('active');
                resolve(); // No delay, resolve immediately when banner fades
            }, 1500); // Reduced from 2500ms to 1500ms
        });
    }

    function hideActionMenu() {
        document.getElementById('action-menu')?.classList.remove('visible');
    }

    function showNotification(message, type = 'info') {
        const notif = document.getElementById('notification');
        if (!notif) return;
        notif.textContent = message;
        notif.className = `notification visible ${type}`;
        setTimeout(() => notif.classList.remove('visible'), 2000);
    }

    function showDamagePopup(unit, damage) {
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = `-${damage}`;
        const pos = worldToScreen(unit.x, unit.y);
        popup.style.left = `${pos.x}px`;
        popup.style.top = `${pos.y - 30}px`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    function triggerVictory() {
        gameState.victory = true;
        showModal({
            title: '🎉 Vitória!',
            content: `Todos os inimigos foram derrotados!\n\nTurnos: ${gameState.turn}`,
            buttons: [{ text: 'Continuar', primary: true, action: () => location.reload() }]
        });
    }

    function triggerGameOver() {
        gameState.gameOver = true;
        showModal({
            title: '💀 Derrota',
            content: 'Todos os seus heróis foram derrotados...',
            buttons: [
                { text: 'Tentar Novamente', primary: true, action: () => location.reload() },
                { text: 'Sair', action: () => window.location.href = '/game/tavern' }
            ]
        });
    }

    function showModal(options) {
        const modal = document.getElementById('game-modal');
        if (!modal) return;

        modal.querySelector('#modal-title').innerHTML = options.title;
        modal.querySelector('#modal-content').innerHTML = options.content;

        const btns = modal.querySelector('#modal-buttons');
        btns.innerHTML = '';
        options.buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.innerHTML = b.text;
            btn.className = `modal-btn ${b.class || ''} ${b.primary ? 'primary' : ''}`.trim();
            btn.onclick = () => {
                modal.classList.remove('visible');
                if (b.action) b.action();
            };
            btns.appendChild(btn);
        });
        modal.classList.add('visible');
    }

    // =====================================================
    // EVENT HANDLERS
    // =====================================================
    function setupEventListeners() {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('click', handleClick);

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        document.addEventListener('keydown', handleKeyDown);

        document.getElementById('btn-end-turn')?.addEventListener('click', endPlayerTurn);
        document.getElementById('btn-center')?.addEventListener('click', () => centerOnUnits(playerUnits));
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoom(CONFIG.ZOOM_STEP));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoom(-CONFIG.ZOOM_STEP));

        // Action menu buttons
        document.getElementById('action-move')?.addEventListener('click', () => {
            setAction('move');
            hideActionMenu();
        });
        document.getElementById('action-attack')?.addEventListener('click', () => {
            if (gameState.selectedUnit) {
                const range = gameState.selectedUnit.attackRange || 1;
                const enemy = getUnitAtRange(gameState.selectedUnit, range, 'enemy');
                if (enemy) {
                    showAttackPreview(gameState.selectedUnit, enemy);
                } else {
                    showNotification(`Inimigo fora de alcance! Aproxime-se para atacar.`, 'warning');
                }
            }
        });
        document.getElementById('action-undo')?.addEventListener('click', () => undoMove());
        document.getElementById('action-finish')?.addEventListener('click', () => {
            if (gameState.selectedUnit) finishUnitTurn(gameState.selectedUnit);
        });
        document.getElementById('action-cancel')?.addEventListener('click', () => deselectUnit());
    }

    /**
     * Spawn cinematic death effects
     */
    function spawnDeathEffect(x, y) {
        // 1. Core Explosion (Hot bits)
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 10;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 12,
                color: Math.random() > 0.6 ? '#fff' : (Math.random() > 0.3 ? '#ef4444' : '#f59e0b'),
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                friction: 0.94
            });
        }

        // 2. Smoke Cloud (Faded pieces)
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 20 + Math.random() * 30,
                color: 'rgba(150, 150, 150, 0.4)',
                life: 0.8,
                decay: 0.005 + Math.random() * 0.01,
                friction: 0.98
            });
        }

        // Impact ring
        showFloatingText('💥', x, y, '#fff');
        needsRender = true;
    }

    function showGlobalNotification(message, type = 'info', iconName = 'info') {
        const banner = document.getElementById('global-banner');
        const text = document.getElementById('global-banner-text');
        const icon = document.getElementById('global-banner-icon');

        if (!banner || !text || !icon) return;

        text.textContent = message;
        icon.setAttribute('data-lucide', iconName);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Color based on type
        if (type === 'warning') banner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        else if (type === 'success') banner.style.borderColor = 'rgba(34, 197, 94, 0.4)';
        else banner.style.borderColor = 'rgba(96, 165, 250, 0.4)';

        banner.classList.add('visible');
        setTimeout(() => banner.classList.remove('visible'), 3500);
    }

    function cellPulseImpact(x, y) {
        // Find if an enemy is here to show a "target" highlight
        const unit = getUnitAt(x, y);
        if (unit && unit.type === 'enemy') {
            // Visual feedback: brief flash or floating icon
            showFloatingText('🎯', x + 0.1, y - 0.2, '#ef4444');
            needsRender = true;
        }
    }
    function showFloatingText(text, x, y, color = '#fff') {
        floatingTexts.push({
            text, x, y,
            life: 1.0, // 0 to 1
            color
        });
    }

    /**
     * Update and draw floating texts
     */
    function drawFloatingTexts() {
        if (floatingTexts.length === 0) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px "Cinzel", serif';

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];

            // Move up
            ft.y -= 0.5;
            ft.life -= 0.015;

            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
                continue;
            }

            ctx.globalAlpha = ft.life;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);

            // Subtle scale effect
            const scale = 1 + (1 - ft.life) * 0.5;
            // (Note: full transformation would require translate/scale per text)
        }
        ctx.restore();

        if (floatingTexts.length > 0) needsRender = true;
    }

    function handleMouseDown(e) {
        if (e.button === 0) {
            dragStartPos = { x: e.clientX, y: e.clientY };
            lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = screenToWorld(mouseX, mouseY);
        const col = Math.floor(world.x / CONFIG.CELL_SIZE) + 1;
        const row = Math.floor(world.y / CONFIG.CELL_SIZE) + 1;

        const coordOverlay = document.getElementById('coord-overlay');
        const coordValue = document.getElementById('coord-value');

        if (col >= 1 && col <= CONFIG.GRID_COLS && row >= 1 && row <= CONFIG.GRID_ROWS) {
            hoveredCell = { x: col, y: row };
            if (coordValue) coordValue.textContent = `${col}, ${row}`;
            if (coordOverlay) coordOverlay.classList.add('visible');

            // Find unit at hovered cell
            const unitAtCell = getUnitAt(col, row);

            // Cursor interaction
            if (unitAtCell && unitAtCell.type === 'enemy' && gameState.selectedUnit && canUnitAct(gameState.selectedUnit)) {
                canvas.style.cursor = 'crosshair';
                // Show attack preview or reticle?
            } else {
                canvas.style.cursor = 'default';
            }

            // Path preview
            if (gameState.selectedUnit && canUnitAct(gameState.selectedUnit)) {
                const reachable = reachableCells.find(c => c.x === col && c.y === row);
                if (reachable) {
                    pathPreview = findPath(gameState.selectedUnit, { x: col, y: row }, gameState.selectedUnit.moveRange);
                } else if (unitAtCell && unitAtCell.type === 'enemy') {
                    // Hovering an enemy: Find nearest adjacent cell
                    const bestCell = findBestAttackPosition(gameState.selectedUnit, unitAtCell);
                    if (bestCell) {
                        pathPreview = findPath(gameState.selectedUnit, bestCell, gameState.selectedUnit.moveRange);
                    } else {
                        pathPreview = [];
                    }
                } else {
                    pathPreview = [];
                }
            }
        } else {
            hoveredCell = null;
            pathPreview = [];
            if (coordOverlay) coordOverlay.classList.remove('visible');
            canvas.style.cursor = 'default';
        }

        // Drag to pan
        if (dragStartPos) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            if (Math.abs(e.clientX - dragStartPos.x) > 5 || Math.abs(e.clientY - dragStartPos.y) > 5) {
                isDragging = true;
            }
            if (isDragging) {
                viewState.x += dx;
                viewState.y += dy;
                cameraTarget = null;
            }
            lastMousePos = { x: e.clientX, y: e.clientY };
        }

        needsRender = true;
    }

    function handleMouseUp(e) {
        dragStartPos = null;
        if (!isDragging) {
            // It was a click, not a drag
        }
        isDragging = false;
    }

    function handleClick(e) {
        if (isDragging || gameState.isAnimating || gameState.phase !== 'player') return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = screenToWorld(mouseX, mouseY);
        const col = Math.floor(world.x / CONFIG.CELL_SIZE) + 1;
        const row = Math.floor(world.y / CONFIG.CELL_SIZE) + 1;

        handleCellClick(col, row);
    }

    function handleCellClick(x, y) {
        const unitAtCell = getUnitAt(x, y);

        // If attack preview is active, clicks are ignored except for UI buttons
        // Closing is handled only by the "X" button in the popup
        if (attackPreviewCells.length > 0) {
            return;
        }

        // 1. If we have a selected unit...
        if (gameState.selectedUnit && canUnitAct(gameState.selectedUnit)) {
            const unit = gameState.selectedUnit;

            // Click the current selected unit again -> Toggle menu
            if (unitAtCell === unit) {
                showActionMenu(unit);
                return;
            }

            // Movement Highlights Active?
            if (reachableCells.length > 0) {
                const reachable = reachableCells.find(c => c.x === x && c.y === y);
                if (reachable) {
                    moveUnitTo(unit, x, y);
                    return;
                }
            }

            // Click another ally -> Switch selection (only if haven't moved yet)
            if (unitAtCell && unitAtCell.type === 'player' && canUnitAct(unitAtCell)) {
                if (!unit.hasMoved) {
                    selectUnit(unitAtCell);
                    return;
                } else {
                    showGlobalNotification('Finalize a ação atual primeiro!', 'warning', 'alert-circle');
                    return;
                }
            }

            // Click an enemy -> Target for attack (if in range)
            if (unitAtCell && unitAtCell.type === 'enemy') {
                const range = unit.attackRange || 1;
                const dist = Math.max(Math.abs(unit.x - unitAtCell.x), Math.abs(unit.y - unitAtCell.y));
                if (dist <= range) {
                    showAttackPreview(unit, unitAtCell);
                } else {
                    // Try to move to attack if unit hasn't moved
                    if (!unit.hasMoved) {
                        const bestPos = findBestAttackPosition(unit, unitAtCell);
                        if (bestPos) {
                            moveUnitTo(unit, bestPos.x, bestPos.y);
                            return;
                        }
                    }
                    // Show attack preview anyway to display the attack range (0 enemies in zone)
                    showAttackPreview(unit, null);
                    showNotification('Nenhum inimigo no alcance!', 'warning');
                }
                return;
            }


            // Clicked empty ground or irrelevant cell
            if (!unit.hasMoved) {
                deselectUnit();
            } else {
                // If moved, just re-show common menu at unit position
                showActionMenu(unit);
            }
        } else {
            // 2. Select unit if nothing selected
            if (unitAtCell && unitAtCell.type === 'player' && canUnitAct(unitAtCell)) {
                selectUnit(unitAtCell);
            } else {
                deselectUnit();
            }
        }
    }

    /**
     * Find the best cell to stand on to attack a target
     */
    function findBestAttackPosition(unit, target) {
        const range = unit.attackRange || 1;

        // Find cells at exact attack range around the target
        const candidates = [];
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue; // Chebyshev distance
                const px = target.x + dx;
                const py = target.y + dy;

                // Filter valid cells (in bounds, not a wall, not occupied)
                if (px >= 1 && px <= CONFIG.GRID_COLS &&
                    py >= 1 && py <= CONFIG.GRID_ROWS &&
                    !isWall(px, py) &&
                    (!getUnitAt(px, py) || getUnitAt(px, py) === unit)) {
                    candidates.push({ x: px, y: py });
                }
            }
        }

        if (candidates.length === 0) return null;

        // Find which is reachable with minimum cost
        let bestCell = null;
        let minCost = Infinity;

        candidates.forEach(cell => {
            const reach = reachableCells.find(c => c.x === cell.x && c.y === cell.y);
            // Also allow the cell where the unit already IS
            const isOrigin = unit.x === cell.x && unit.y === cell.y;

            if (reach || isOrigin) {
                const dist = Math.max(Math.abs(unit.x - cell.x), Math.abs(unit.y - cell.y));
                if (dist < minCost) {
                    minCost = dist;
                    bestCell = cell;
                }
            }
        });

        return bestCell;
    }

    function handleWheel(e) {
        e.preventDefault();
        zoom(e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP, e.clientX, e.clientY);
    }

    function handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'escape':
                deselectUnit();
                break;
            case 'e':
            case 'enter':
                if (gameState.phase === 'player') endPlayerTurn();
                break;
            case 'c':
                centerOnUnits(playerUnits);
                break;
        }
    }

    function handleTouchStart(e) {
        if (e.touches.length === 1) {
            dragStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (e.touches.length === 1 && dragStartPos) {
            const dx = e.touches[0].clientX - lastMousePos.x;
            const dy = e.touches[0].clientY - lastMousePos.y;
            viewState.x += dx;
            viewState.y += dy;
            lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            cameraTarget = null;
            needsRender = true;
        }
        e.preventDefault();
    }

    function handleTouchEnd() {
        dragStartPos = null;
        isDragging = false;
    }

    function handleResize(entries) {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                if (minimapCanvas) {
                    minimapCanvas.width = 160;
                    minimapCanvas.height = 120;
                }
                needsRender = true;
            }
        }
    }

    // =====================================================
    // CAMERA
    // =====================================================
    function screenToWorld(sx, sy) {
        return {
            x: (sx - viewState.x) / viewState.scale,
            y: (sy - viewState.y) / viewState.scale
        };
    }

    function worldToScreen(wx, wy) {
        return {
            x: (wx - 0.5) * CONFIG.CELL_SIZE * viewState.scale + viewState.x,
            y: (wy - 0.5) * CONFIG.CELL_SIZE * viewState.scale + viewState.y
        };
    }

    function zoom(delta, cx = canvas.width / 2, cy = canvas.height / 2) {
        const oldScale = viewState.scale;
        const newScale = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, oldScale + delta));
        if (newScale !== oldScale) {
            const world = screenToWorld(cx, cy);
            viewState.scale = newScale;
            viewState.x = cx - world.x * newScale;
            viewState.y = cy - world.y * newScale;
            cameraTarget = null;
            needsRender = true;
        }
    }

    function centerOnUnits(units) {
        const alive = units.filter(u => u.hp > 0);
        if (alive.length === 0 || !mapLoaded || !canvas.width) return;

        const avgX = alive.reduce((sum, u) => sum + u.x, 0) / alive.length;
        const avgY = alive.reduce((sum, u) => sum + u.y, 0) / alive.length;

        const rulerSize = CONFIG.RULER_SIZE;
        const availableHeight = canvas.height - rulerSize * 2;

        // Safety check for fitScale
        let fitScale = viewState.scale || 1.0;
        if (MAP_HEIGHT > 0 && availableHeight > 0) {
            fitScale = Math.max(availableHeight / MAP_HEIGHT, CONFIG.MIN_ZOOM);
        }

        if (isNaN(fitScale) || !isFinite(fitScale)) fitScale = 1.0;

        console.log('[MapEngine] Centering camera on units:', { avgX, avgY, fitScale });

        cameraTarget = {
            x: canvas.width / 2 - (avgX - 0.5) * CONFIG.CELL_SIZE * fitScale,
            y: rulerSize + availableHeight / 2 - (avgY - 0.5) * CONFIG.CELL_SIZE * fitScale,
            scale: fitScale
        };
        needsRender = true;
    }

    function initCamera() {
        // Wait for canvas to have dimensions and map to be loaded
        if (!canvas.width || !canvas.height || !mapLoaded) {
            setTimeout(initCamera, 100);
            return;
        }

        const rulerSize = CONFIG.RULER_SIZE;
        const availableHeight = canvas.height - rulerSize * 2; // Account for top and bottom rulers
        const availableWidth = canvas.width - rulerSize; // Account for left ruler

        // Fit to viewport height (map should fill the height)
        const heightScale = availableHeight / MAP_HEIGHT;
        viewState.scale = Math.max(heightScale, 0.6);

        // Set min zoom to prevent zooming out too far (map should at least fill height)
        CONFIG.MIN_ZOOM = Math.max(0.5, heightScale * 0.95);

        // Position map aligned to left edge and centered vertically
        viewState.x = rulerSize; // Left-aligned, after ruler
        viewState.y = rulerSize + (availableHeight - MAP_HEIGHT * viewState.scale) / 2; // Centered vertically

        needsRender = true;
    }

    // =====================================================
    // RENDERING
    // =====================================================
    function gameLoop() {
        animationFrame++;

        // Smooth camera
        if (cameraTarget) {
            const ease = 0.1;
            viewState.x += (cameraTarget.x - viewState.x) * ease;
            viewState.y += (cameraTarget.y - viewState.y) * ease;
            viewState.scale += (cameraTarget.scale - viewState.scale) * ease;
            if (Math.abs(cameraTarget.x - viewState.x) < 1 &&
                Math.abs(cameraTarget.y - viewState.y) < 1) {
                cameraTarget = null;
            }
            needsRender = true;
        }

        if (needsRender || gameState.isAnimating || playerUnits.some(u => u.hp > 0)) {
            updateParticles();
            render();
            renderMinimap();
            needsRender = false;
        }

        requestAnimationFrame(gameLoop);
    }

    function render() {
        if (!ctx || !mapLoaded) return;

        // Clear with blueprint background
        drawBlueprintBackground();

        ctx.save();
        ctx.translate(viewState.x, viewState.y);
        ctx.scale(viewState.scale, viewState.scale);

        // Map background with Tactical Focus
        if (loadedImages.map) {
            ctx.save();
            const hasFocus = reachableCells.length > 0 || attackableCells.length > 0 || attackPreviewCells.length > 0;
            if (hasFocus) {
                ctx.filter = 'grayscale(0.8) brightness(0.4)';
            }
            ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.restore();
        }

        // Grid (Subtle lines)
        drawGrid();

        // Highlights (These must pop, so drawn AFTER map but potentially before entities)
        drawReachableCells();
        drawAttackableCells();
        drawAttackPreviewCells(); // Yellow 3x3 preview for attack confirmation
        drawPathPreview();

        // Entities - Also need contrast logic
        drawChests();
        drawPortal();
        drawUnits(enemyUnits, 'enemy');
        drawUnits(playerUnits, 'player');

        // Atmospheric Particles
        drawParticles();

        // Floating Texts
        drawFloatingTexts();

        // Hovered cell indicator
        drawHoveredCell();

        ctx.restore();

        // Draw rulers on top (after restore, so they're fixed on screen)
        drawRulers();
    }

    function drawBlueprintBackground() {
        // Dark blueprint base
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blueprint grid pattern (subtle)
        const gridSize = 32;
        ctx.strokeStyle = 'rgba(30, 70, 120, 0.15)';
        ctx.lineWidth = 1;

        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Larger grid lines
        ctx.strokeStyle = 'rgba(40, 90, 150, 0.2)';
        for (let x = 0; x < canvas.width; x += gridSize * 4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize * 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawRulers() {
        const rulerSize = CONFIG.RULER_SIZE;
        const cellSize = CONFIG.CELL_SIZE * viewState.scale;

        // Calculate visible range
        const startCol = Math.max(1, Math.floor(-viewState.x / cellSize) + 1);
        const endCol = Math.min(CONFIG.GRID_COLS, Math.ceil((canvas.width - viewState.x) / cellSize) + 1);
        const startRow = Math.max(1, Math.floor(-viewState.y / cellSize) + 1);
        const endRow = Math.min(CONFIG.GRID_ROWS, Math.ceil((canvas.height - viewState.y) / cellSize) + 1);

        // Top ruler background
        ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
        ctx.fillRect(0, 0, canvas.width, rulerSize);

        // Left ruler background
        ctx.fillRect(0, 0, rulerSize, canvas.height);

        // Bottom ruler background
        ctx.fillRect(0, canvas.height - rulerSize, canvas.width, rulerSize);

        // Ruler border
        ctx.strokeStyle = 'rgba(60, 120, 180, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, rulerSize);
        ctx.lineTo(canvas.width, rulerSize);
        ctx.moveTo(rulerSize, 0);
        ctx.lineTo(rulerSize, canvas.height);
        ctx.moveTo(0, canvas.height - rulerSize);
        ctx.lineTo(canvas.width, canvas.height - rulerSize);
        ctx.stroke();

        // Column numbers
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let col = startCol; col <= endCol; col++) {
            const x = viewState.x + (col - 0.5) * cellSize;
            if (x > rulerSize && x < canvas.width) {
                // Top
                ctx.fillStyle = hoveredCell && hoveredCell.x === col ? '#60a5fa' : 'rgba(100, 160, 220, 0.8)';
                ctx.fillText(col.toString(), x, rulerSize / 2);
                // Bottom
                ctx.fillText(col.toString(), x, canvas.height - rulerSize / 2);
            }
        }

        // Row numbers
        for (let row = startRow; row <= endRow; row++) {
            const y = viewState.y + (row - 0.5) * cellSize;
            if (y > rulerSize && y < canvas.height - rulerSize) {
                ctx.fillStyle = hoveredCell && hoveredCell.y === row ? '#60a5fa' : 'rgba(100, 160, 220, 0.8)';
                ctx.fillText(row.toString(), rulerSize / 2, y);
            }
        }

        // Corner box
        ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
        ctx.fillRect(0, 0, rulerSize, rulerSize);
        ctx.strokeStyle = 'rgba(60, 120, 180, 0.4)';
        ctx.strokeRect(0, 0, rulerSize, rulerSize);

        // Crosshair icon in corner
        ctx.strokeStyle = 'rgba(100, 160, 220, 0.6)';
        ctx.beginPath();
        ctx.moveTo(rulerSize / 2 - 6, rulerSize / 2);
        ctx.lineTo(rulerSize / 2 + 6, rulerSize / 2);
        ctx.moveTo(rulerSize / 2, rulerSize / 2 - 6);
        ctx.lineTo(rulerSize / 2, rulerSize / 2 + 6);
        ctx.stroke();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw minimalist corner markers instead of full boxes for a cleaner map
        const len = 4;
        for (let x = 0; x <= CONFIG.GRID_COLS; x++) {
            for (let y = 0; y <= CONFIG.GRID_ROWS; y++) {
                const px = x * CONFIG.CELL_SIZE;
                const py = y * CONFIG.CELL_SIZE;

                ctx.beginPath();
                ctx.moveTo(px - len, py); ctx.lineTo(px + len, py);
                ctx.moveTo(px, py - len); ctx.lineTo(px, py + len);
                ctx.stroke();
            }
        }

        // Draw walls with pattern
        WALLS.forEach(wall => {
            const x = (wall.x - 1) * CONFIG.CELL_SIZE;
            const y = (wall.y - 1) * CONFIG.CELL_SIZE;
            ctx.fillStyle = 'rgba(60, 60, 70, 0.4)';
            ctx.fillRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
        });
    }

    function drawReachableCells() {
        if (reachableCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 15) + 1) / 2;
        const scan = (animationFrame % 80) / 80;

        reachableCells.forEach(cell => {
            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // 1. Crystal Surface (High Contrast)
            const baseGrad = ctx.createLinearGradient(x, y, x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE);
            baseGrad.addColorStop(0, `rgba(59, 130, 246, ${0.3 + pulse * 0.1})`);
            baseGrad.addColorStop(1, `rgba(37, 99, 235, 0.1)`);
            ctx.fillStyle = baseGrad;
            ctx.fillRect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);

            // 2. Scanline Animation
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
            ctx.clip();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(x, y + (CONFIG.CELL_SIZE * scan), CONFIG.CELL_SIZE, 2);
            ctx.restore();

            // 3. Neon Frame
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

            // 4. Dot Accents (Pure White for visibility)
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 2, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + 2, 3, 3);
            ctx.fillRect(x + 2, y + CONFIG.CELL_SIZE - 5, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + CONFIG.CELL_SIZE - 5, 3, 3);
        });
    }

    function drawAttackableCells() {
        if (attackableCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 8) + 1) / 2;

        attackableCells.forEach(cell => {
            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;
            const padding = 2;

            // Fill
            const gradient = ctx.createRadialGradient(
                x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE / 2, 0,
                x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE / 2, CONFIG.CELL_SIZE / 1.5
            );
            gradient.addColorStop(0, `rgba(239, 68, 68, ${0.2 + pulse * 0.15})`);
            gradient.addColorStop(1, `rgba(239, 68, 68, ${0.05})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);

            // Border
            ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = `rgba(248, 113, 113, ${0.6 + pulse * 0.4})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);
            ctx.shadowBlur = 0;

            // Target reticle
            const cx = x + CONFIG.CELL_SIZE / 2;
            const cy = y + CONFIG.CELL_SIZE / 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 8, cy);
            ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 20, cy);
            ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy - 8);
            ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 20);
            ctx.stroke();
        });
    }

    /**
     * Draw attack preview cells for GROUP COMBAT
     * Blue zone = ally participation area (3x3 around hero)
     * Red zone = enemy participation area (3x3 around target)
     */
    function drawAttackPreviewCells() {
        if (attackPreviewCells.length === 0 || !pendingAttack) return;

        const pulse = (Math.sin(animationFrame / 6) + 1) / 2;
        const initiator = pendingAttack.hero;
        const target = pendingAttack.enemy;

        // Draw Unified Background for the whole Engagement Zone
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, 0.03)`;
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.lineWidth = 1;

        attackPreviewCells.forEach(cell => {
            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;
            ctx.fillRect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
            ctx.strokeRect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
        });
        ctx.restore();

        // Draw Tactical Targeting Lines (Dashed)
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;

        const initiatorX = (initiator.x - 0.5) * CONFIG.CELL_SIZE;
        const initiatorY = (initiator.y - 0.5) * CONFIG.CELL_SIZE;

        // 1. Supporting allies draw lines TO the initiator (support role)
        attackPreviewCells.forEach(cell => {
            if (!cell.hasAlly) return;
            if (cell.x === initiator.x && cell.y === initiator.y) return; // Skip initiator

            const startX = (cell.x - 0.5) * CONFIG.CELL_SIZE;
            const startY = (cell.y - 0.5) * CONFIG.CELL_SIZE;

            ctx.strokeStyle = `rgba(96, 165, 250, ${0.7 + pulse * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(initiatorX, initiatorY);
            ctx.stroke();

            // Draw arrowhead at initiator
            const angle = Math.atan2(initiatorY - startY, initiatorX - startX);
            const headlen = 10;
            ctx.beginPath();
            ctx.moveTo(initiatorX - headlen * Math.cos(angle - Math.PI / 6), initiatorY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(initiatorX, initiatorY);
            ctx.lineTo(initiatorX - headlen * Math.cos(angle + Math.PI / 6), initiatorY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        });

        // 2. Initiator draws lines to ALL enemies in the engagement zone
        const enemiesInZone = pendingAttack.enemies || [];
        enemiesInZone.forEach(enemy => {
            const endX = (enemy.x - 0.5) * CONFIG.CELL_SIZE;
            const endY = (enemy.y - 0.5) * CONFIG.CELL_SIZE;

            ctx.strokeStyle = `rgba(248, 113, 113, ${0.7 + pulse * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(initiatorX, initiatorY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw arrowhead at enemy
            const angle = Math.atan2(endY - initiatorY, endX - initiatorX);
            const headlen = 10;
            ctx.beginPath();
            ctx.moveTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endX, endY);
            ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        });


        ctx.restore();


        // Draw Active Participants
        attackPreviewCells.forEach(cell => {
            if (cell.type === 'neutral-zone') return;

            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;
            const padding = 2;

            let fillColor, borderColor, shadowColor;

            if (cell.type === 'clash') {
                fillColor = `rgba(168, 85, 247, ${0.4 + pulse * 0.2})`;
                borderColor = `rgba(168, 85, 247, 1)`;
                shadowColor = '#a855f7';
            } else if (cell.hasAlly) {
                fillColor = `rgba(59, 130, 246, ${0.4 + pulse * 0.2})`;
                borderColor = `rgba(96, 165, 250, 1)`;
                shadowColor = '#3b82f6';
            } else if (cell.hasEnemy) {
                fillColor = `rgba(239, 68, 68, ${0.4 + pulse * 0.2})`;
                borderColor = `rgba(248, 113, 113, 1)`;
                shadowColor = '#ef4444';
            }

            // Glow and Fill
            ctx.save();
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 15;
            ctx.fillStyle = fillColor;
            ctx.fillRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);

            // Neon Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);
            ctx.restore();

            // Combat Role Indicator
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px "Inter", sans-serif';
            ctx.textAlign = 'center';
            const icon = cell.hasAlly ? (cell.x === initiator.x && cell.y === initiator.y ? '⚔️' : '🛡️') : (cell.x === target.x && cell.y === target.y ? '🎯' : '⚠️');
            ctx.fillText(icon, x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE - 6);
        });
    }

    function drawPathPreview() {
        if (pathPreview.length === 0) return;

        const pulse = (Math.sin(animationFrame / 8) + 1) / 2;

        pathPreview.forEach((p, index) => {
            const x = (p.x - 1) * CONFIG.CELL_SIZE;
            const y = (p.y - 1) * CONFIG.CELL_SIZE;

            // Draw sequential glowing square (White/Silver for visibility)
            const op = 0.3 + (Math.sin((animationFrame / 8) - index * 0.5) + 1) / 4;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * op})`; // High contrast
            ctx.fillRect(x + 8, y + 8, CONFIG.CELL_SIZE - 16, CONFIG.CELL_SIZE - 16);

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * op})`;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 10, y + 10, CONFIG.CELL_SIZE - 20, CONFIG.CELL_SIZE - 20);
        });

        // Path Line (Crisp White Dash)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        const start = gameState.selectedUnit;
        const startX = (start.x - 0.5) * CONFIG.CELL_SIZE;
        const startY = (start.y - 0.5) * CONFIG.CELL_SIZE;
        ctx.moveTo(startX, startY);

        pathPreview.forEach(p => {
            const px = (p.x - 0.5) * CONFIG.CELL_SIZE;
            const py = (p.y - 0.5) * CONFIG.CELL_SIZE;
            ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Path joints (Dots)
        ctx.fillStyle = '#fff';
        pathPreview.forEach((p, idx) => {
            const px = (p.x - 0.5) * CONFIG.CELL_SIZE;
            const py = (p.y - 0.5) * CONFIG.CELL_SIZE;
            ctx.beginPath();
            ctx.arc(px, py, idx === pathPreview.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
            if (idx === pathPreview.length - 1) {
                ctx.strokeStyle = `rgba(255,255,255, ${0.5 + pulse * 0.5})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }

    function drawCornerAccents(x, y, size, color) {
        const len = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4 + len); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + 4 + len, y + 4);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + size - 4 - len, y + 4); ctx.lineTo(x + size - 4, y + 4); ctx.lineTo(x + size - 4, y + 4 + len);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x + 4, y + size - 4 - len); ctx.lineTo(x + 4, y + size - 4); ctx.lineTo(x + 4 + len, y + size - 4);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + size - 4 - len, y + size - 4); ctx.lineTo(x + size - 4, y + size - 4); ctx.lineTo(x + size - 4, y + size - 4 - len);
        ctx.stroke();
    }

    function drawHoveredCell() {
        if (!hoveredCell) return;

        const x = (hoveredCell.x - 1) * CONFIG.CELL_SIZE;
        const y = (hoveredCell.y - 1) * CONFIG.CELL_SIZE;
        const pulse = (Math.sin(animationFrame / 15) + 1) / 2;
        const rot = animationFrame / 40;

        const unitAtCell = getUnitAt(hoveredCell.x, hoveredCell.y);
        const isEnemyHover = unitAtCell && unitAtCell.type === 'enemy' && gameState.selectedUnit && canUnitAct(gameState.selectedUnit);

        const themeColor = isEnemyHover ? '#ef4444' : '#60a5fa'; // Red for attack, Blue for move/hover

        // 1. Hover Highlight (Simpler, cleaner)
        ctx.save();
        ctx.translate(x + CONFIG.CELL_SIZE / 2, y + CONFIG.CELL_SIZE / 2);

        ctx.shadowBlur = 10;
        ctx.shadowColor = themeColor;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 1.5;

        // Simple tactical corner markers
        const s = CONFIG.CELL_SIZE * 0.45;
        const l = 8;
        ctx.beginPath();
        // Top Left
        ctx.moveTo(-s, -s + l); ctx.lineTo(-s, -s); ctx.lineTo(-s + l, -s);
        // Top Right
        ctx.moveTo(s - l, -s); ctx.lineTo(s, -s); ctx.lineTo(s, -s + l);
        // Bottom Right
        ctx.moveTo(s, s - l); ctx.lineTo(s, s); ctx.lineTo(s - l, s);
        // Bottom Left
        ctx.moveTo(-s + l, s); ctx.lineTo(-s, s); ctx.lineTo(-s, s - l);
        ctx.stroke();

        ctx.restore();

        // 2. Discrete Square Coordinates (Crisp Top-Left Marker)
        ctx.save();
        const coordText = `${hoveredCell.x},${hoveredCell.y}`;
        ctx.font = 'bold 9px "Inter", sans-serif';
        const textWidth = ctx.measureText(coordText).width;

        const tx = x + 4;
        const ty = y + 4;

        // Background Box
        ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
        ctx.strokeStyle = isEnemyHover ? 'rgba(239, 68, 68, 0.4)' : 'rgba(96, 165, 250, 0.4)';
        ctx.lineWidth = 1;
        ctx.fillRect(tx, ty, textWidth + 6, 13);
        ctx.strokeRect(tx, ty, textWidth + 6, 13);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(coordText, tx + 3, ty + 7);
        ctx.restore();
    }

    function drawOctagonPath(ctx, x, y, radius) {
        const angle = Math.PI / 4;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const px = x + radius * Math.cos(i * angle + angle / 2);
            const py = y + radius * Math.sin(i * angle + angle / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    function drawUnits(units, type) {
        units.forEach(unit => {
            if (unit.hp <= 0) return;
            drawUnit(unit, type);
        });
    }

    function drawUnit(unit, type) {
        const cx = unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE;
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;

        const isSelected = gameState.selectedUnit === unit;
        const hasActed = gameState.unitsActedThisTurn.has(unit.id);
        const isCurrentPhase = gameState.phase === type;
        const canStillAct = unit.hp > 0 && !hasActed;

        const img = loadedImages[unit.id];

        if (!img) return;

        ctx.save();
        ctx.translate(cx, cy);

        const radius = CONFIG.CELL_SIZE * 0.45;

        // 1. Premium Selection Aura
        if (isSelected) {
            const pulse = (Math.sin(animationFrame / 10) + 1) / 2;

            // Dual-Gradient Metallic Ring
            const grad = ctx.createRadialGradient(0, 0, radius, 0, 0, radius + 10);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.5, '#60a5fa');
            grad.addColorStop(1, 'rgba(96, 165, 250, 0)');

            ctx.shadowBlur = 15 + pulse * 10;
            ctx.shadowColor = '#60a5fa';
            ctx.strokeStyle = grad;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
            ctx.stroke();

            // Tactical Sonar Pulse Ring
            const ping = (animationFrame % 100) / 100;
            const pulseRadius = ping * (unit.attackRange * CONFIG.CELL_SIZE);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - ping * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Check if Pulse hits enemies
            enemyUnits.forEach(enemy => {
                if (enemy.hp <= 0) return;
                const enemyWorldX = (enemy.x - 0.5) * CONFIG.CELL_SIZE;
                const enemyWorldY = (enemy.y - 0.5) * CONFIG.CELL_SIZE;
                const dist = Math.sqrt(Math.pow(enemyWorldX - cx, 2) + Math.pow(enemyWorldY - cy, 2));

                // If pulse is exactly passing over enemy (within a small margin)
                if (Math.abs(dist - pulseRadius) < 10) {
                    cellPulseImpact(enemy.x, enemy.y);
                }
            });
        }

        // 2. Unit Avatar Circle
        ctx.save();

        const idleBreath = Math.sin(animationFrame / 30) * 1.0;
        ctx.translate(0, idleBreath);

        if (hasActed) {
            ctx.globalAlpha = 0.8;
        }

        // Circular Clip
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.clip();

        // Draw Avatar (Aligned to top for 9:16 images)
        if (img.width < img.height) {
            // Vertical image: Crop square from top
            ctx.drawImage(img,
                0, 0, img.width, img.width, // Source square (top)
                -radius, -radius, radius * 2, radius * 2 // Dest square
            );
        } else {
            // Standard crop
            ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
        }

        // Glass Gloss 
        const glass = ctx.createLinearGradient(-radius, -radius, radius, radius);
        glass.addColorStop(0, 'rgba(255,255,255,0.3)');
        glass.addColorStop(0.5, 'rgba(255,255,255,0)');
        glass.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = glass;
        ctx.fill();

        ctx.restore();

        // 3. Metallic Border
        ctx.strokeStyle = isSelected ? '#fff' : (type === 'player' ? '#3b82f6' : '#ef4444');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, idleBreath, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Action Completed Badge (Green Check)
        if (hasActed) {
            ctx.save();
            ctx.translate(radius * 0.7, -radius * 0.7 + idleBreath);

            // Badge Circle
            ctx.fillStyle = '#22c55e'; // Emerald Green
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // White Checkmark
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(-1, 3);
            ctx.lineTo(4, -3);
            ctx.stroke();
            ctx.restore();
        }

        // 5. Indicator Arrow
        if (isCurrentPhase && canStillAct && !isSelected) {
            const bounce = Math.sin(animationFrame / 10) * 4;
            ctx.save();
            ctx.translate(0, -radius + bounce - 25); // Moved up to make room for bars
            ctx.beginPath();
            ctx.moveTo(-6, -8); ctx.lineTo(0, 0); ctx.lineTo(6, -8);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fff';
            ctx.stroke();

            ctx.shadowBlur = 8;
            ctx.shadowColor = type === 'player' ? '#60a5fa' : '#ef4444';
            ctx.strokeStyle = type === 'player' ? '#60a5fa' : '#ef4444';
            ctx.stroke();
            ctx.restore();
        }

        // 6. Tactical Status Bars (HP/SP)
        if (unit.hp !== undefined) {
            const barW = radius * 1.5;
            const barH = 4;
            const bx = -barW / 2;
            const by = -radius - 12 + idleBreath;

            // HP Bar Background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(bx, by, barW, barH);

            // HP Bar Fill
            const hpPct = Math.max(0, unit.hp / unit.maxHp);
            ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
            ctx.fillRect(bx, by, barW * hpPct, barH);

            // SP Bar (only for heroes)
            if (type === 'player' && unit.sp !== undefined) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx, by + 5, barW, barH - 1);

                const spPct = Math.max(0, unit.sp / (unit.maxSp || 100));
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(bx, by + 5, barW * spPct, barH - 1);
            }
        }

        ctx.restore();
    }

    function drawChests() {
        chests.forEach(chest => {
            if (chest.opened) return;

            const cx = (chest.x - 0.5) * CONFIG.CELL_SIZE;
            const cy = (chest.y - 0.5) * CONFIG.CELL_SIZE;
            const size = CONFIG.CELL_SIZE * 0.5;
            const pulse = (Math.sin(animationFrame / 20) + 1) / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 10 + pulse * 8;

            const img = loadedImages.chest;
            if (img) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = '#eab308';
                ctx.fillRect(-size / 2, -size / 2, size, size);
            }
            ctx.restore();
        });
    }

    function drawPortal() {
        if (!portal) return;

        const cx = (portal.x - 0.5) * CONFIG.CELL_SIZE;
        const cy = (portal.y - 0.5) * CONFIG.CELL_SIZE;
        const radius = CONFIG.CELL_SIZE * 0.4;
        const pulse = (Math.sin(animationFrame / 10) + 1) / 2;

        ctx.save();
        ctx.translate(cx, cy);

        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 20 + pulse * 15;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, '#e879f9');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#581c87');

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Swirl
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = animationFrame / 40 + (i * Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.5, angle, angle + 1);
            ctx.stroke();
        }

        ctx.restore();
    }

    function renderMinimap() {
        if (!minimapCtx || !minimapCanvas) return;

        const mw = minimapCanvas.width;
        const mh = minimapCanvas.height;

        // Scale factor between world and minimap
        // We use the actual map pixel dimensions
        const sx = mw / MAP_WIDTH;
        const sy = mh / MAP_HEIGHT;

        minimapCtx.clearRect(0, 0, mw, mh);
        minimapCtx.fillStyle = '#0d1117';
        minimapCtx.fillRect(0, 0, mw, mh);

        if (loadedImages.map) {
            minimapCtx.globalAlpha = 0.5;
            minimapCtx.drawImage(loadedImages.map, 0, 0, mw, mh);
            minimapCtx.globalAlpha = 1;
        }

        // Portal
        if (portal) {
            minimapCtx.fillStyle = '#a855f7';
            minimapCtx.beginPath();
            minimapCtx.arc((portal.x - 0.5) * CONFIG.CELL_SIZE * sx, (portal.y - 0.5) * CONFIG.CELL_SIZE * sy, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        // Enemies
        enemyUnits.forEach(u => {
            if (u.hp > 0) {
                minimapCtx.fillStyle = '#ef4444';
                minimapCtx.beginPath();
                minimapCtx.arc((u.x - 0.5) * CONFIG.CELL_SIZE * sx, (u.y - 0.5) * CONFIG.CELL_SIZE * sy, 3, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        });

        // Players
        playerUnits.forEach(u => {
            if (u.hp > 0) {
                minimapCtx.fillStyle = '#60a5fa';
                minimapCtx.beginPath();
                minimapCtx.arc((u.x - 0.5) * CONFIG.CELL_SIZE * sx, (u.y - 0.5) * CONFIG.CELL_SIZE * sy, 4, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        });
    }

    // =====================================================
    // UTILS
    // =====================================================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =====================================================
    // ATMospheric particles
    // =====================================================
    const particles = [];
    function updateParticles() {
        // Ember Spawning
        if (particles.length < 30) {
            particles.push({
                type: 'ember',
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.5 - 0.2,
                size: Math.random() * 2 + 1,
                life: 1,
                color: Math.random() > 0.5 ? '#f97316' : '#fbbf24'
            });
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            // Movement
            p.x += p.vx;
            p.y += p.vy;

            // Behavior based on type
            if (p.type === 'explosion') {
                const f = p.friction || 0.96;
                p.vx *= f;
                p.vy *= f;
                p.vy += 0.1; // Gravity
                p.life -= p.decay || 0.02;
            } else {
                p.life -= 0.005; // Embers last longer
            }

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        if (particles.length > 0) needsRender = true;
    }

    function drawParticles() {
        ctx.save();
        particles.forEach(p => {
            ctx.globalAlpha = p.life * 0.6;
            ctx.shadowBlur = 5;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // =====================================================
    // INIT
    // =====================================================
    document.addEventListener('DOMContentLoaded', init);

})();
