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
        ANIMATION_SPEED: 250, // Duração em ms (fallback)
        RULER_SIZE: 28,  // Size of the ruler guides
        MAP_PATH: '/public/assets/img/maps/castle-map.webp'
    };

    // Movimento por tipo (snappy para player, pesado para inimigos)
    const MOVE_CONFIG = {
        player: { duration: 150, easing: 'snappy', bounce: 1.5, cameraEase: 0.18 },
        enemy: { duration: 220, easing: 'heavy', bounce: 0.8, cameraEase: 0.10 }
    };

    // Map dimensions (set after image loads)
    let MAP_WIDTH = 0;
    let MAP_HEIGHT = 0;
    let mapLoaded = false;
    let needsRender = true; // Flag para controlar renderização sob demanda

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
        freeExplore: false,
        battleStarted: false, // Flag para banner de batalha na primeira ação hostil
        debugFreeControl: false,
        debugControlEnemy: false
    };

    // Expose gameState globally for TacticalSkillEngine to access turn count
    window.gameState = gameState;

    let sessionUid = null;
    let sessionData = null;

    // =====================================================
    // ENTITIES
    // =====================================================
    let playerUnits = [];
    let enemyUnits = [];
    let chests = [];
    let portal = null;
    let loadedImages = {};
    let lastTimelineSignature = '';
    let lastTimelineBuffSignature = '';

    // =====================================================
    // SPRITE SHEET SYSTEM
    // =====================================================
    const spriteCache = new Map(); // Cache de spritesheets carregados

    /**
     * Determina o alcance (range) de uma skill automaticamente
     * baseado em suas propriedades e tipo
     */
    function getSkillRange(skill) {
        // Se skill já tem range definido, usar ele
        if (typeof skill.range === 'number') return skill.range;

        const name = (skill.name || '').toLowerCase();
        const id = (skill.id || '').toLowerCase();
        const text = name + ' ' + id;

        // Skills de suporte/buff
        if (skill.type === 'self') return 0;
        if (skill.type === 'ally') return 3;
        if (skill.type === 'aoe_heal') return 0; // AoE global
        if (skill.type === 'aoe') return 0; // AoE global
        if (skill.type === 'revive' || skill.type === 'summon') return 0;

        // Ranged físico (archer)
        if (text.match(/shot|arrow|bow|volley|multishot|aim/)) return 5;

        // Magic ranged
        if (skill.damageType === 'magic') return 6;
        if (text.match(/bolt|fire|frost|lightning|spark|meteor|lance|beam|orb|magic/)) return 6;

        // Melee padrão
        return 1;
    }

    /**
     * Determina o tipo de alcance (rangeType) de uma skill
     */
    function getSkillRangeType(skill) {
        if (skill.rangeType) return skill.rangeType;
        if (skill.type === 'aoe' || skill.type === 'aoe_heal') return 'aoe';
        if (skill.type === 'self') return 'self';
        if (skill.type === 'ally') return 'ally';
        if (skill.type === 'heal') return 'heal';
        if (skill.type === 'revive') return 'revive';
        if (skill.type === 'summon') return 'summon';
        if (skill.type === 'pierce') return 'line';
        if (skill.type === 'aoe') return 'circle';
        if (skill.type === 'line') return 'line';
        if (skill.type === 'cross') return 'cross';
        return 'diamond';
    }

    // Funções isWall e toggleWall movidas para seção de PATHFINDING para evitar duplicidade

    /**
     * Obtém as skills de uma unidade do mapa
     * @param {Object} unit - Unidade do mapa
     * @returns {Array} Array de objetos de skill com range calculado
     */
    async function getUnitSkillsAsync(unit) {
        if (!unit) return [];

        // Obter definição da entidade
        const combatKey = unit.combatKey || unit.combat_key || unit.class;
        if (!combatKey) return [];

        // Try to load entity from API first, fallback to combatData
        let entityDef = null;
        if (window.TacticalDataLoader) {
            try {
                entityDef = await window.TacticalDataLoader.getEntity(combatKey);
            } catch (error) {
                console.warn('[MAP-ENGINE] Failed to load entity from API:', error);
            }
        }

        // Legacy fallback removed - combatData no longer exists
        // If entity not found, return empty array

        if (!entityDef) return [];

        // Extract skill IDs from entity
        let skillIds = [];
        if (Array.isArray(entityDef.skills) && entityDef.skills.length > 0) {
            if (typeof entityDef.skills[0] === 'object') {
                // If skills is array of skill objects (new PHP format)
                skillIds = entityDef.skills.map(s => {
                    // Handle both 'id' field and direct object with id property
                    if (s && typeof s === 'object') {
                        return s.id || s;
                    }
                    return s;
                }).filter(id => id && typeof id === 'string'); // Ensure we only get string IDs
            } else {
                // If skills is array of IDs (legacy format)
                skillIds = entityDef.skills.filter(id => typeof id === 'string');
            }
        }

        if (skillIds.length === 0) return [];

        // Load skills from API or fallback to skillsData
        const skills = [];
        if (window.TacticalDataLoader) {
            try {
                const loadedSkills = await window.TacticalDataLoader.loadSkills(skillIds);
                for (const skillId of skillIds) {
                    const skillDef = loadedSkills[skillId];
                    if (skillDef) {
                        skills.push({
                            ...skillDef,
                            id: skillId,
                            range: getSkillRange(skillDef),
                            rangeType: getSkillRangeType(skillDef),
                            aoe: skillDef.aoe || 0
                        });
                    }
                }
            } catch (error) {
                console.warn('[MAP-ENGINE] Failed to load skills from API:', error);
            }
        }

        // Fallback to skillsData if API failed or skills not fully loaded
        if (skills.length < skillIds.length) {
            for (const skillId of skillIds) {
                if (!skills.find(s => s.id === skillId)) {
                    const skillDef = window.skillsData?.[skillId];
                    if (skillDef) {
                        skills.push({
                            ...skillDef,
                            id: skillId,
                            range: getSkillRange(skillDef),
                            rangeType: getSkillRangeType(skillDef),
                            aoe: skillDef.aoe || 0
                        });
                    }
                }
            }
        }

        return skills;
    }

    /**
     * Skills da unidade (síncrono; usa entityCache do TacticalDataLoader).
     * entityCache é preenchido no init com collectCombatKeysFromSession() + loadEntities().
     * Se combatKey da unidade não estiver nessa coleta, entityDef fica null e retorna [].
     */
    function getUnitSkills(unit) {
        if (!unit) return [];

        const combatKey = unit.combatKey || unit.combat_key || unit.class;
        if (!combatKey) return [];

        let entityDef = null;
        if (window.TacticalDataLoader && window.TacticalDataLoader.entityCache) {
            entityDef = window.TacticalDataLoader.entityCache[combatKey];
        }

        if (!entityDef) return [];

        // Extract skill IDs
        let skillIds = [];
        if (Array.isArray(entityDef.skills) && entityDef.skills.length > 0) {
            if (typeof entityDef.skills[0] === 'object') {
                // If skills is array of skill objects (PHP format)
                skillIds = entityDef.skills.map(s => {
                    if (s && typeof s === 'object') {
                        return s.id || s;
                    }
                    return s;
                }).filter(id => id && typeof id === 'string'); // Ensure we only get string IDs
            } else {
                // If skills is array of IDs (legacy format)
                skillIds = entityDef.skills.filter(id => typeof id === 'string');
            }
        }

        if (skillIds.length === 0) return [];

        // Use cached skills if available
        const skills = [];
        if (window.TacticalDataLoader && window.TacticalDataLoader.skillCache) {
            for (const skillId of skillIds) {
                const skillDef = window.TacticalDataLoader.skillCache[skillId];
                if (skillDef) {
                    skills.push({
                        ...skillDef,
                        id: skillId,
                        range: getSkillRange(skillDef),
                        rangeType: getSkillRangeType(skillDef),
                        aoe: skillDef.aoe || 0
                    });
                }
            }
        }

        // Fallback to skillsData
        if (skills.length < skillIds.length) {
            for (const skillId of skillIds) {
                if (!skills.find(s => s.id === skillId)) {
                    const skillDef = window.skillsData?.[skillId];
                    if (skillDef) {
                        skills.push({
                            ...skillDef,
                            id: skillId,
                            range: getSkillRange(skillDef),
                            rangeType: getSkillRangeType(skillDef),
                            aoe: skillDef.aoe || 0
                        });
                    }
                }
            }
        }

        return skills;
    }

    /**
     * Calcula células dentro do alcance de uma skill
     * @param {Object} unit - Unidade origem
     * @param {Object} skill - Skill com range/rangeType
     * @returns {Array} Array de {x, y, dist} das células válidas
     */
    function calculateSkillRange(unit, skill) {
        if (!unit || !skill) return [];

        const baseRange = getSkillRange(skill);
        const range = baseRange + (unit.buffedSkillRangeBonus || 0);
        const rangeType = getSkillRangeType(skill);
        const reachable = [];

        // Skills self ou AoE global (range 0)
        if (range === 0) {
            if (rangeType === 'self') {
                return [{ x: unit.x, y: unit.y, dist: 0 }];
            }
            if (rangeType === 'aoe' || rangeType === 'aoe_heal') {
                // AoE global atinge todos
                return []; // Retorna vazio, pois atinge todos (será tratado separadamente)
            }
        }

        // Para skills self/ally/heal: incluir própria célula
        if (rangeType === 'self' || rangeType === 'ally' || rangeType === 'heal') {
            reachable.push({ x: unit.x, y: unit.y, dist: 0 });
        }
        // Para skills ally/heal: incluir células com aliados no alcance
        if (rangeType === 'ally' || rangeType === 'heal') {
            const allyUnits = playerUnits.filter(u => u.hp > 0 && u.id !== unit.id);
            allyUnits.forEach(ally => {
                const dist = Math.max(Math.abs(unit.x - ally.x), Math.abs(unit.y - ally.y)); // Chebyshev
                if (dist <= range) {
                    const existing = reachable.find(c => c.x === ally.x && c.y === ally.y);
                    if (!existing) {
                        reachable.push({ x: ally.x, y: ally.y, dist });
                    }
                }
            });
        }

        // Calcular células no alcance (Manhattan) - para skills que não são self/ally/heal
        if (rangeType !== 'self' && rangeType !== 'ally' && rangeType !== 'heal') {
            for (let dx = -range; dx <= range; dx++) {
                for (let dy = -range; dy <= range; dy++) {
                    const dist = Math.abs(dx) + Math.abs(dy); // Manhattan
                    if (dist <= range && dist > 0) { // > 0 para excluir própria célula
                        const x = unit.x + dx;
                        const y = unit.y + dy;
                        if (isValidCell(x, y)) {
                            reachable.push({ x, y, dist });
                        }
                    }
                }
            }
        }

        return reachable;
    }

    /**
     * Calcula área de efeito da skill a partir de um alvo
     */
    function calculateSkillArea(skill, targetX, targetY, casterX, casterY) {
        const area = [];
        if (!skill) return area;

        const rangeType = getSkillRangeType(skill);

        if (rangeType === 'single' || rangeType === 'ally' || rangeType === 'heal') {
            area.push({ x: targetX, y: targetY });
            return area;
        }

        if ((rangeType === 'aoe' || rangeType === 'area') && (skill.aoe || 0) > 0) {
            const aoeRange = skill.aoe || 1;
            const useSquare = skill.aoeShape === 'square';
            for (let dx = -aoeRange; dx <= aoeRange; dx++) {
                for (let dy = -aoeRange; dy <= aoeRange; dy++) {
                    const inArea = useSquare
                        ? (Math.max(Math.abs(dx), Math.abs(dy)) <= aoeRange)
                        : (Math.abs(dx) + Math.abs(dy) <= aoeRange);
                    if (inArea) {
                        const x = targetX + dx;
                        const y = targetY + dy;
                        if (isValidCell(x, y)) {
                            area.push({ x, y });
                        }
                    }
                }
            }
            return area;
        }

        if (rangeType === 'line') {
            const dx = Math.sign(targetX - casterX);
            const dy = Math.sign(targetY - casterY);
            const max = getSkillRange(skill);
            for (let i = 1; i <= max; i++) {
                const x = casterX + dx * i;
                const y = casterY + dy * i;
                if (isValidCell(x, y)) {
                    area.push({ x, y });
                }
            }
            return area;
        }

        return area;
    }

    /**
     * Verifica se uma célula é válida (dentro dos limites do mapa)
     */
    function isValidCell(x, y) {
        const cols = CONFIG.MAP_COLS || CONFIG.GRID_COLS;
        const rows = CONFIG.MAP_ROWS || CONFIG.GRID_ROWS;
        return x >= 1 && x <= cols && y >= 1 && y <= rows;
    }

    /**
     * Distância tática (Chebyshev)
     */
    function getDistance(a, b) {
        if (!a || !b) return 9999;
        return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    }

    /**
     * Obtém entity_id da unidade para paths de assets (convenção: public/assets/entities/<entity_id>/).
     * Usa unit.entity_id quando disponível; senão faz fallback de combatKey/class para entity_id.
     */
    function getEntityIdForUnit(unit) {
        if (!unit) return null;
        if (unit.entity_id) return unit.entity_id;
        const combatKey = (unit.combatKey || unit.combat_key || '').toLowerCase();
        const combatMap = {
            'hero_swordman': 'swordsman', 'swordman': 'swordsman',
            'hero_archer': 'archer', 'archer': 'archer',
            'hero_acolyte': 'acolyte', 'acolyte': 'acolyte',
            'toxic_slime': 'toxic_slime', 'slime': 'toxic_slime',
            'wolf': 'wolf'
        };
        if (combatMap[combatKey]) return combatMap[combatKey];
        const className = (unit.class || '').toLowerCase();
        const classMap = {
            'swordsman': 'swordsman', 'swordman': 'swordsman', 'warrior': 'swordsman',
            'archer': 'archer', 'ranged': 'archer', 'hero': 'swordsman',
            'acolyte': 'acolyte',
            'slime': 'toxic_slime', 'toxic_slime': 'toxic_slime', 'wolf': 'wolf'
        };
        return classMap[className] || combatKey || null;
    }

    /**
     * Carrega uma animação específica (idle, walk, atack) de uma entidade.
     * Formato: public/assets/entities/<entityId>/animations/<animationType>/1.webp, 2.webp, ...
     */
    async function loadSpriteAnimation(entityId, animationType) {
        const frames = [];
        const maxFrames = 200; // Limite máximo para evitar loop infinito

        if (!entityId) return null;
        const basePath = `/public/assets/entities/${entityId}/animations/${animationType}/`;
        if (animationType !== 'idle' && animationType !== 'walk' && animationType !== 'atack') {
            console.warn(`[SpriteAnimation] Tipo de animação inválido: ${animationType}`);
            return null;
        }

        // Criar objeto de estado da animação
        const animation = {
            name: animationType,
            frames: [],
            frameCount: 0,
            fps: animationType === 'atack' ? 12 : 7, // FPS padrão (atack costuma ser mais rápido)
            loop: animationType !== 'atack', // atack não repete por padrão
            width: 0,
            height: 0,
            baseWidth: 0, // Largura base para cálculo de escala
            anchor: { x: 0.5, y: 1.0 }, // Centro horizontal, base vertical
            loaded: false,
            state: 'loading'
        };

        // Carregar frames sequencialmente usando numeração simples (1.webp, 2.webp, 3.webp, ...)
        // Estratégia: tentar carregar até encontrar o primeiro frame que não existe
        // Para evitar 404 desnecessário, verificamos se o frame N+1 existe antes de continuar
        let frameIndex = 1;
        let lastSuccessfulFrame = 0;

        while (frameIndex <= maxFrames) {
            const framePath = `${basePath}${frameIndex}.webp`;

            const loaded = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    if (animation.width === 0) {
                        animation.width = img.width;
                        animation.height = img.height;
                        animation.baseWidth = img.width; // Usar largura original como base
                    }
                    frames.push(img);
                    resolve(true);
                };
                img.onerror = () => {
                    // Frame não encontrado - fim da sequência
                    resolve(false);
                };
                img.src = framePath;
            });

            if (!loaded) {
                // Frame não encontrado, parar aqui
                break;
            }

            lastSuccessfulFrame = frameIndex;
            frameIndex++;
        }

        const actualFrameCount = frames.length;

        if (actualFrameCount === 0) {
            console.warn(`[SpriteAnimation] Nenhum frame encontrado para ${entityId}/${animationType}`);
            animation.state = 'error';
            return null;
        }

        animation.frames = frames.slice(0, actualFrameCount);
        animation.frameCount = actualFrameCount;
        animation.loaded = true;
        animation.state = 'loaded';

        console.log(`[SpriteAnimation] Carregado ${entityId}/${animationType}: ${actualFrameCount} frames (${animation.width}x${animation.height})`);

        return animation;
    }

    /**
     * Carrega todas as animações (idle, walk, atack) de uma entidade.
     * Retorna objeto com todas as animações carregadas. Cache keyado por entityId.
     */
    async function loadSpriteAnimations(entityId) {
        if (!entityId) return null;
        if (spriteCache.has(entityId)) {
            return spriteCache.get(entityId);
        }

        const spriteAnimations = {
            name: entityId,
            idle: null,
            walk: null,
            atack: null,
            loaded: false
        };

        spriteCache.set(entityId, spriteAnimations);

        const [idleAnimation, walkAnimation, atackAnimation] = await Promise.all([
            loadSpriteAnimation(entityId, 'idle'),
            loadSpriteAnimation(entityId, 'walk'),
            loadSpriteAnimation(entityId, 'atack')
        ]);

        spriteAnimations.idle = idleAnimation;
        spriteAnimations.walk = walkAnimation;
        spriteAnimations.atack = atackAnimation;
        spriteAnimations.loaded = (idleAnimation !== null || walkAnimation !== null || atackAnimation !== null);

        if (!spriteAnimations.loaded) {
            console.warn(`[SpriteAnimations] Nenhuma animação carregada para ${entityId}`);
        } else {
            console.log(`[SpriteAnimations] Carregado ${entityId}: idle=${idleAnimation !== null}, walk=${walkAnimation !== null}, atack=${atackAnimation !== null}`);
        }

        return spriteAnimations;
    }

    /**
     * Obtém o índice do frame atual baseado na animação e estado
     * @param {Object} spriteAnimations - Objeto com animações (idle, walk)
     * @param {string} animationState - Estado da animação ('idle' ou 'walk')
     */
    function getCurrentSpriteFrameIndex(spriteAnimations, animationState, unit = null, useDebugOverrides = true) {
        if (!spriteAnimations) return 0;

        // Selecionar animação baseada no estado (padrão: 'idle')
        const state = animationState || 'idle';
        const animation = spriteAnimations[state];

        if (!animation || !animation.loaded || animation.frameCount === 0) {
            // Fallback para outra animação se disponível
            const fallback = spriteAnimations.idle || spriteAnimations.walk;
            if (!fallback || !fallback.loaded || fallback.frameCount === 0) return 0;
            let fps;
            // Buscar FPS específico da animação de fallback ou usar global (retrocompatibilidade)
            let animConfig = null;
            const fallbackState = spriteAnimations.idle ? 'idle' : 'walk';
            if (unit && unit.animations && unit.animations[fallbackState]) {
                animConfig = unit.animations[fallbackState];
            }
            const defaultFPS = fallbackState === 'walk' ? 8 : 7;
            const baseFPS = animConfig?.animationFPS !== undefined
                ? animConfig.animationFPS
                : (unit && unit.animationFPS !== undefined ? unit.animationFPS : (fallback.fps || defaultFPS));
            if (useDebugOverrides && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                if (debugSelectedUnit === unit && unit && unit.debugFPS !== undefined) {
                    fps = unit.debugFPS;
                } else {
                    fps = baseFPS;
                }
            } else {
                fps = baseFPS;
            }
            if (typeof fps !== 'number' || fps <= 0 || !isFinite(fps)) fps = 12;
            const frameIntervalMs = 1000 / fps;
            return Math.floor((animationTimeMs / frameIntervalMs)) % fallback.frameCount;
        }

        // Usar animationTimeMs (tempo real) para animação independente do FPS do game loop
        let fps;
        let animConfig = null;
        if (unit && unit.animations && unit.animations[state]) {
            animConfig = unit.animations[state];
        }
        const defaultFPS = state === 'atack' ? 12 : (state === 'walk' ? 8 : 7);
        const baseFPS = animConfig?.animationFPS !== undefined
            ? animConfig.animationFPS
            : (unit && unit.animationFPS !== undefined ? unit.animationFPS : (animation.fps || defaultFPS));

        if (useDebugOverrides && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
            const debugSelectedUnit = window.MapDebug.getSelectedUnit();
            if (debugSelectedUnit === unit && unit && unit.debugFPS !== undefined) {
                fps = unit.debugFPS;
            } else {
                fps = baseFPS;
            }
        } else {
            fps = baseFPS;
        }

        if (typeof fps !== 'number' || fps <= 0 || !isFinite(fps)) fps = 12;
        const frameIntervalMs = 1000 / fps; // ms por frame de sprite

        // Se a animação não for em loop (ex: atack), calcular baseada no início (tempo real)
        if (animation.loop === false && unit) {
            if (unit.animationStartTimeMs === undefined) {
                unit.animationStartTimeMs = animationTimeMs;
            }
            const elapsedMs = animationTimeMs - unit.animationStartTimeMs;
            let frameIndex = Math.floor(elapsedMs / frameIntervalMs);

            if (frameIndex >= animation.frameCount) {
                frameIndex = animation.frameCount - 1;

                // Retornar para idle automaticamente após o fim
                if (unit.animationState === state && !unit._animReverting) {
                    unit._animReverting = true;
                    setTimeout(() => {
                        if (unit.animationState === state) {
                            unit.animationState = 'idle';
                        }
                        unit._animReverting = false;
                    }, 50);
                }
            }
            return Math.max(0, Math.min(frameIndex, animation.frameCount - 1));
        }

        // Loop padrão (idle, walk) – baseado em tempo real
        return Math.floor((animationTimeMs / frameIntervalMs)) % animation.frameCount;
    }

    /**
     * Carrega todos os sprites necessários para as unidades atuais
     * Carrega todas as animações (idle + walk) para cada sprite
     */
    async function loadRequiredSprites() {
        const entityIds = new Set();

        [...playerUnits, ...enemyUnits].forEach(unit => {
            const entityId = getEntityIdForUnit(unit);
            if (entityId) {
                entityIds.add(entityId);
            }
        });

        const loadPromises = Array.from(entityIds).map(id => loadSpriteAnimations(id));
        await Promise.all(loadPromises);

        needsRender = true;
    }

    // =====================================================
    // CANVAS STATE
    // =====================================================
    let canvas, ctx, minimapCanvas, minimapCtx;
    let viewState = { x: 0, y: 0, scale: 1 };
    let cameraTarget = null;
    let cameraFollowEase = null; // ease dinâmico durante movimento
    let screenShake = { intensity: 0, decay: 0.88 };
    let hitFlash = 0; // Flash global ao acertar
    let audioCtx = null;
    let currentBattleMusic = null;

    // =====================================================
    // MAP CACHE - OTIMIZAÇÃO DE PERFORMANCE
    // =====================================================
    let mapCacheCanvas = null;      // OffscreenCanvas ou canvas normal com mapa cacheado
    let mapCacheDirty = true;       // Indica se o cache precisa ser regenerado
    let mapCacheHasFocus = false;   // Estado anterior do filtro de foco

    // =====================================================
    // FPS THROTTLE - Limita renderização a 80 FPS
    // =====================================================
    const TARGET_FPS = 80;
    const FRAME_DURATION_MS = 1000 / TARGET_FPS;
    let lastGameLoopTime = 0;

    // =====================================================
    // MINIMAP CACHE - OffscreenCanvas com atualização reduzida
    // =====================================================
    let minimapCacheCanvas = null;   // OffscreenCanvas para minimap cacheado
    let minimapCacheCtx = null;      // Contexto do cache
    let minimapFrameCounter = 0;     // Contador de frames para atualização
    const MINIMAP_UPDATE_INTERVAL = 5; // Atualizar minimap a cada N frames

    // =====================================================
    // HITFLASH CANVAS - REUTILIZÁVEL (evita criar novo canvas a cada frame)
    // =====================================================
    let hitFlashCanvas = null;      // Canvas reutilizável para efeito hitFlash vermelho
    let hitFlashCtx = null;         // Contexto do canvas de hitFlash

    // =====================================================
    // SHADOW CACHE - Sombra oval pré-renderizada (evita criar gradients por unidade)
    // =====================================================
    let unitShadowCache = null;     // Canvas com sombra pré-renderizada
    let unitShadowCacheSize = 0;    // Tamanho atual do cache

    // Estado de áudio
    let audioSettings = {
        musicEnabled: true,
        sfxEnabled: true
    };

    // Carregar do localStorage
    if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem('rpg_audio_music') !== null) {
            audioSettings.musicEnabled = localStorage.getItem('rpg_audio_music') === 'true';
        }
        if (localStorage.getItem('rpg_audio_sfx') !== null) {
            audioSettings.sfxEnabled = localStorage.getItem('rpg_audio_sfx') === 'true';
        }
    }

    // =====================================================
    // SFX (MP3) - Combate
    // =====================================================
    const sfxCache = {};
    function playSfx(fileName, volume = 0.45, rate = 1.0) {
        console.log('[AUDIO DEBUG] playSfx called:', fileName, 'sfxEnabled:', audioSettings.sfxEnabled);
        if (!fileName) {
            console.log('[AUDIO DEBUG] playSfx: no fileName');
            return null;
        }
        if (!audioSettings.sfxEnabled) {
            console.log('[AUDIO DEBUG] playSfx: SFX DISABLED - enabling now');
            audioSettings.sfxEnabled = true; // Auto-enable if disabled
        }
        const src = `/public/assets/mp3/${fileName}`;
        if (!sfxCache[src]) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            sfxCache[src] = audio;
        }
        const audio = sfxCache[src].cloneNode();
        audio.volume = volume;
        audio.playbackRate = rate;
        audio.play().catch(err => {
            console.log('[AUDIO DEBUG] playSfx FAILED:', fileName, err.message);
        });
        console.log('[AUDIO DEBUG] playSfx playing:', fileName);
        return audio;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /** Toca SFX da entidade (entities/ID/sounds/) ou fallback em mp3/ */
    function playSfxEntity(entityId, fileName, volume = 0.45, rate = 1.0) {
        const base = (fileName || '').endsWith('.mp3') ? fileName : fileName + '.mp3';
        if (!entityId) { playSfx(base, volume, rate); return; }
        const entityPath = `/public/assets/entities/${entityId}/sounds/${base}`;
        const audio = new Audio(entityPath);
        audio.volume = volume;
        audio.playbackRate = rate;
        audio.onerror = () => { playSfx(base, volume, rate); };
        audio.play().catch(() => { });
    }

    /** Hit/impacto GERAL (mp3): toda vez que atacar ou receber ataque */
    function playHitImpactSfx(isCrit = false) {
        const hit = pickRandom(['hit1.mp3', 'hit2.mp3', 'hit3.mp3', 'impact.mp3']);
        playSfx(hit, 0.55, 1.0);
        if (isCrit) setTimeout(() => playSfx('critical.mp3', 0.6, 1.0), 50);
    }

    /** Buff aplicado – GERAL (mp3) */
    function playBuffApplySfx() {
        const s = pickRandom(['buff_apply1.mp3', 'buff_apply2.mp3', 'buff_apply3.mp3']);
        playSfx(s, 0.5, 1.0);
    }

    /** Debuff aplicado – GERAL (mp3) */
    function playDebuffApplySfx() {
        playSfx('debuff_apply.mp3', 0.5, 1.0);
    }

    function playSwordSfx(entityId, isCrit = false) {
        const swing = pickRandom(['sword1.mp3', 'sword2.mp3', 'sword3.mp3', 'sword4.mp3']);
        playSfxEntity(entityId, swing, 0.5, 1.0);
        setTimeout(() => playHitImpactSfx(isCrit), 80);
    }

    function playClawSfx(entityId) {
        const claw = pickRandom(['wolf_claw_hit1.mp3', 'wolf_claw_hit2.mp3', 'wolf_claw_hit3.mp3', 'wolf_claw_hit4.mp3']);
        playSfxEntity(entityId, claw, 0.55, 1.0);
        setTimeout(() => playHitImpactSfx(false), 40);
    }

    function playBowSfx(entityId, isCrit = false) {
        const bow = pickRandom(['bow1.mp3', 'bow2.mp3', 'bow3.mp3']);
        playSfxEntity(entityId, bow, 0.5, 1.0);
        setTimeout(() => playHitImpactSfx(isCrit), 100);
    }

    function playSlimeSfx(entityId) {
        playSfxEntity(entityId, 'slime.mp3', 0.5, 1.0);
        setTimeout(() => playHitImpactSfx(false), 60);
    }

    function playStaffSfx(entityId, isCrit = false) {
        const staff = pickRandom(['staff_hit.mp3', 'staff_hit2.mp3', 'staff_hit3.mp3']);
        playSfxEntity(entityId, staff, 0.5, 1.0);
        setTimeout(() => playHitImpactSfx(isCrit), 80);
    }

    function playMagicSfx(isCrit = false) {
        const start = pickRandom(['skill_start1.mp3', 'skill_start2.mp3', 'skill_start3.mp3']);
        playSfx(start, 0.45, 1.0);
        if (isCrit) setTimeout(() => playSfx('critical.mp3', 0.6, 1.0), 150);
    }

    function playSkillVoice(skillId, entityId = null) {
        // Som de voz específico para certas skills (ultimate etc)
        // Usa paths de entidades quando disponível
        console.log('[AUDIO DEBUG] playSkillVoice called:', skillId);
        if (skillId === 'deadly_aim') {
            // Archer ultimate
            const src = '/public/assets/entities/archer/sounds/deadly_aim.mp3';
            console.log('[AUDIO DEBUG] Playing deadly_aim from:', src);
            const audio = new Audio(src);
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.log('[AUDIO DEBUG] deadly_aim FAILED:', err.message);
            });
        } else if (skillId === 'champions_slash') {
            // Swordsman ultimate
            const src = '/public/assets/entities/swordsman/sounds/champions_slash.mp3';
            console.log('[AUDIO DEBUG] Playing champions_slash from:', src);
            const audio = new Audio(src);
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.log('[AUDIO DEBUG] champions_slash FAILED:', err.message);
            });
        } else if (skillId === 'berserk_mode') {
            playSfx('swordman_skill_start1.mp3', 0.6, 1.0);
        }
    }

    function getAudioContext() {
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => { });
        }
        return audioCtx;
    }

    function playStepSound(entity) {
        const ctx = getAudioContext();
        if (!ctx) return;
        const isPlayer = entity?.type === 'player' || entity?.id === 'player';
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = isPlayer ? 200 : 140;
        gain.gain.value = isPlayer ? 0.03 : 0.02;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // =====================================================
    // CAMERA STORAGE (localStorage por sessão)
    // =====================================================
    function getCameraStorageKey() {
        if (!sessionUid) return null;
        return `rpg:camera:${sessionUid}`;
    }

    function saveCameraState() {
        const key = getCameraStorageKey();
        if (!key) return;
        const payload = {
            x: viewState.x,
            y: viewState.y,
            scale: viewState.scale
        };
        try {
            localStorage.setItem(key, JSON.stringify(payload));
        } catch (err) {
            console.warn('[CameraStorage] Falha ao salvar câmera:', err);
        }
    }

    function restoreCameraState() {
        const key = getCameraStorageKey();
        if (!key) return false;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (typeof data?.x !== 'number' || typeof data?.y !== 'number' || typeof data?.scale !== 'number') {
                return false;
            }
            viewState.x = data.x;
            viewState.y = data.y;
            viewState.scale = data.scale;
            cameraTarget = null;
            needsRender = true;
            return true;
        } catch (err) {
            console.warn('[CameraStorage] Falha ao restaurar câmera:', err);
            return false;
        }
    }

    let isDragging = false;
    let dragStartPos = null;
    let lastMousePos = { x: 0, y: 0 }; // Coordenadas de janela (para drag)
    let hoveredCell = null;
    let hoveredUnit = null; // Unidade sob o mouse (para z-index dinâmico)
    let reachableCells = [];
    let attackableCells = [];
    let attackPreviewCells = []; // Cells showing 3x3 attack radius (allies who will join)
    let pendingAttack = null;    // { hero, enemy, allies, enemies} - pending attack confirmation
    let pathPreview = [];

    // Estado da skill selecionada para preview de alcance tático
    let selectedSkillForPreview = null;
    let skillRangeCells = [];
    let skillAreaCells = []; // Área de efeito da skill selecionada (hover)
    let attackRangeCells = []; // Células no alcance de ataque

    let animationFrame = 0;
    let animationTimeMs = 0;   // tempo acumulado para animações (ms) – base para sprites
    let lastFrameTime;         // performance.now() do frame anterior
    let floatingTexts = [];
    let particles = []; // Sistema de partículas (movido para cima para inicialização do MapSFX)
    let portalPromptShown = false;

    // =====================================================
    // OBJECT POOLING - Reutilização de objetos (evita GC spikes)
    // =====================================================
    const particlePool = [];      // Pool de partículas reutilizáveis
    const floatingTextPool = [];  // Pool de floating texts reutilizáveis
    const MAX_POOL_SIZE = 100;    // Limite do pool para evitar memory leak

    /**
     * Obtém uma partícula do pool ou cria nova
     * @param {Object} props - Propriedades da partícula
     * @returns {Object} Partícula configurada
     */
    function getParticle(props) {
        let p = particlePool.pop();
        if (p) {
            // Limpar propriedades antigas e aplicar novas
            Object.keys(p).forEach(k => delete p[k]);
            Object.assign(p, props);
        } else {
            p = { ...props };
        }
        return p;
    }

    /**
     * Devolve partícula ao pool para reutilização
     * @param {Object} p - Partícula a devolver
     */
    function releaseParticle(p) {
        if (particlePool.length < MAX_POOL_SIZE) {
            particlePool.push(p);
        }
    }

    /**
     * Obtém um floating text do pool ou cria novo
     * @param {Object} props - Propriedades do floating text
     * @returns {Object} Floating text configurado
     */
    function getFloatingText(props) {
        let ft = floatingTextPool.pop();
        if (ft) {
            Object.keys(ft).forEach(k => delete ft[k]);
            Object.assign(ft, props);
        } else {
            ft = { ...props };
        }
        return ft;
    }

    /**
     * Devolve floating text ao pool para reutilização
     * @param {Object} ft - Floating text a devolver
     */
    function releaseFloatingText(ft) {
        if (floatingTextPool.length < MAX_POOL_SIZE) {
            floatingTextPool.push(ft);
        }
    }

    // =====================================================
    // DEBUG MODE
    // =====================================================
    let debugMode = false;
    let debugDraggingUnit = null;
    let debugFPS = 7; // FPS padrão da animação (controlável via UI)
    let debugSelectedUnit = null; // Unidade selecionada para debug
    let debugScale = 2.0; // Escala padrão do personagem (controlável via UI)
    let debugOffsetX = 1; // Offset X padrão (controlável via UI)
    let debugOffsetY = 44; // Offset Y padrão (controlável via UI)

    // Valores padrão de offset para sprites (usados quando não está em modo debug)
    // Walk: Offset X: -3px, Offset Y: 44px
    const DEFAULT_SPRITE_OFFSET_X = -3;
    const DEFAULT_SPRITE_OFFSET_Y = 44;
    let debugAnimationState = null; // Estado de animação forçado no debug (null = usar estado real da unidade, 'idle' ou 'walk' = forçar)
    let debugCompareAnimations = false; // Mostrar idle e walk juntos (debug)
    let debugCompareOffset = 60; // Distância da cópia no modo comparação

    // Debug: Edição de paredes
    let debugEditWalls = false; // Modo de edição de paredes
    let debugWallsAdded = []; // Novas paredes adicionadas no debug (formato: [{x, y}, ...])
    let debugWallsRemoved = []; // Paredes de WALLS removidas no debug (formato: [{x, y}, ...])

    // =====================================================
    // DEBUG - Código removido: agora usa map-debug.js
    // O sistema de debug foi movido para map-debug.js
    // =====================================================
    // WALLS - Carregado do config do mapa (config_json.walls)
    // Fallback padrão se não houver no config
    // =====================================================
    // WALLS - Carregado do config do mapa (config_json.walls)
    // Fallback padro se no houver no config
    // =====================================================
    let WALLS = [
        { "x": 8, "y": 12 }, { "x": 9, "y": 13 }, { "x": 10, "y": 13 }, { "x": 8, "y": 11 }, { "x": 8, "y": 13 },
        { "x": 11, "y": 13 }, { "x": 11, "y": 14 }, { "x": 12, "y": 14 }, { "x": 12, "y": 15 }, { "x": 13, "y": 15 },
        { "x": 13, "y": 16 }, { "x": 14, "y": 16 }, { "x": 15, "y": 16 }, { "x": 16, "y": 16 }, { "x": 17, "y": 16 },
        { "x": 18, "y": 16 }, { "x": 19, "y": 16 }, { "x": 20, "y": 16 }, { "x": 21, "y": 16 }, { "x": 22, "y": 16 },
        { "x": 23, "y": 16 }, { "x": 24, "y": 16 }, { "x": 25, "y": 16 }, { "x": 26, "y": 16 }, { "x": 26, "y": 15 },
        { "x": 27, "y": 15 }, { "x": 27, "y": 14 }, { "x": 28, "y": 14 }, { "x": 28, "y": 13 }, { "x": 28, "y": 12 },
        { "x": 28, "y": 11 }, { "x": 29, "y": 11 }, { "x": 30, "y": 11 }, { "x": 32, "y": 11 }, { "x": 31, "y": 11 },
        { "x": 34, "y": 11 }, { "x": 33, "y": 11 }, { "x": 36, "y": 11 }, { "x": 35, "y": 11 }, { "x": 33, "y": 10 },
        { "x": 34, "y": 10 }, { "x": 35, "y": 10 }, { "x": 36, "y": 10 }, { "x": 37, "y": 10 }, { "x": 37, "y": 11 },
        { "x": 38, "y": 11 }, { "x": 38, "y": 10 }, { "x": 39, "y": 10 }, { "x": 39, "y": 11 }, { "x": 40, "y": 11 },
        { "x": 40, "y": 10 }, { "x": 41, "y": 10 }, { "x": 41, "y": 11 }, { "x": 42, "y": 11 }, { "x": 42, "y": 10 },
        { "x": 43, "y": 11 }, { "x": 43, "y": 10 }, { "x": 43, "y": 12 }, { "x": 44, "y": 12 }, { "x": 44, "y": 13 },
        { "x": 45, "y": 13 }, { "x": 45, "y": 14 }, { "x": 46, "y": 14 }, { "x": 47, "y": 14 }, { "x": 50, "y": 14 },
        { "x": 48, "y": 14 }, { "x": 49, "y": 14 }, { "x": 51, "y": 14 }, { "x": 53, "y": 14 }, { "x": 52, "y": 14 },
        { "x": 54, "y": 14 }, { "x": 55, "y": 14 }, { "x": 54, "y": 13 }, { "x": 54, "y": 12 }, { "x": 54, "y": 11 },
        { "x": 54, "y": 10 }, { "x": 54, "y": 9 }, { "x": 53, "y": 13 }, { "x": 52, "y": 13 }, { "x": 51, "y": 13 },
        { "x": 50, "y": 13 }, { "x": 52, "y": 11 }, { "x": 52, "y": 10 }, { "x": 51, "y": 11 }, { "x": 51, "y": 10 },
        { "x": 51, "y": 12 }, { "x": 52, "y": 12 }, { "x": 53, "y": 12 }, { "x": 53, "y": 11 }, { "x": 53, "y": 10 },
        { "x": 54, "y": 8 }, { "x": 54, "y": 7 }, { "x": 54, "y": 6 }, { "x": 54, "y": 5 }, { "x": 54, "y": 4 },
        { "x": 54, "y": 3 }, { "x": 53, "y": 3 }, { "x": 52, "y": 3 }, { "x": 51, "y": 3 }, { "x": 51, "y": 4 },
        { "x": 51, "y": 5 }, { "x": 51, "y": 6 }, { "x": 50, "y": 6 }, { "x": 49, "y": 6 }, { "x": 48, "y": 6 },
        { "x": 47, "y": 5 }, { "x": 48, "y": 5 }, { "x": 43, "y": 5 }, { "x": 42, "y": 5 }, { "x": 40, "y": 5 },
        { "x": 41, "y": 5 }, { "x": 40, "y": 6 }, { "x": 41, "y": 6 }, { "x": 42, "y": 6 }, { "x": 38, "y": 6 },
        { "x": 39, "y": 6 }, { "x": 42, "y": 7 }, { "x": 41, "y": 7 }, { "x": 39, "y": 7 }, { "x": 40, "y": 7 },
        { "x": 38, "y": 7 }, { "x": 37, "y": 7 }, { "x": 37, "y": 6 }, { "x": 35, "y": 6 }, { "x": 36, "y": 7 },
        { "x": 36, "y": 6 }, { "x": 35, "y": 7 }, { "x": 34, "y": 6 }, { "x": 34, "y": 7 }, { "x": 33, "y": 7 },
        { "x": 33, "y": 6 }, { "x": 44, "y": 4 }, { "x": 45, "y": 4 }, { "x": 46, "y": 4 }, { "x": 43, "y": 4 },
        { "x": 48, "y": 4 }, { "x": 47, "y": 4 }, { "x": 38, "y": 3 }, { "x": 32, "y": 6 }, { "x": 32, "y": 7 },
        { "x": 31, "y": 7 }, { "x": 31, "y": 6 }, { "x": 30, "y": 7 }, { "x": 30, "y": 6 }, { "x": 29, "y": 6 },
        { "x": 29, "y": 7 }, { "x": 29, "y": 5 }, { "x": 29, "y": 4 }, { "x": 29, "y": 3 }, { "x": 29, "y": 2 },
        { "x": 29, "y": 1 }, { "x": 27, "y": 3 }, { "x": 28, "y": 5 }, { "x": 28, "y": 4 }, { "x": 28, "y": 3 },
        { "x": 28, "y": 2 }, { "x": 27, "y": 2 }, { "x": 27, "y": 1 }, { "x": 28, "y": 1 }, { "x": 26, "y": 1 },
        { "x": 25, "y": 1 }, { "x": 24, "y": 1 }, { "x": 23, "y": 3 }, { "x": 23, "y": 4 }, { "x": 24, "y": 4 },
        { "x": 24, "y": 3 }, { "x": 24, "y": 2 }, { "x": 23, "y": 2 }, { "x": 23, "y": 1 }, { "x": 22, "y": 1 },
        { "x": 22, "y": 3 }, { "x": 22, "y": 2 }, { "x": 26, "y": 4 }, { "x": 25, "y": 2 }, { "x": 27, "y": 5 },
        { "x": 27, "y": 4 }, { "x": 26, "y": 3 }, { "x": 26, "y": 2 }, { "x": 25, "y": 3 }, { "x": 25, "y": 4 },
        { "x": 22, "y": 4 }, { "x": 21, "y": 1 }, { "x": 20, "y": 1 }, { "x": 19, "y": 1 }, { "x": 19, "y": 2 },
        { "x": 19, "y": 3 }, { "x": 18, "y": 3 }, { "x": 18, "y": 4 }, { "x": 17, "y": 4 }, { "x": 16, "y": 4 },
        { "x": 16, "y": 5 }, { "x": 15, "y": 5 }, { "x": 14, "y": 5 }, { "x": 15, "y": 4 }, { "x": 14, "y": 4 },
        { "x": 13, "y": 4 }, { "x": 13, "y": 3 }, { "x": 13, "y": 2 }, { "x": 13, "y": 1 }, { "x": 13, "y": 5 },
        { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 12, "y": 7 }, { "x": 11, "y": 7 }, { "x": 8, "y": 7 },
        { "x": 9, "y": 7 }, { "x": 10, "y": 7 }, { "x": 8, "y": 8 }, { "x": 8, "y": 9 }, { "x": 8, "y": 10 },
        { "x": 7, "y": 4 }, { "x": 12, "y": 8 }, { "x": 26, "y": 8 }, { "x": 27, "y": 8 }, { "x": 26, "y": 11 },
        { "x": 23, "y": 12 }, { "x": 26, "y": 12 }, { "x": 27, "y": 12 }, { "x": 23, "y": 8 }, { "x": 20, "y": 6 },
        { "x": 23, "y": 7 }, { "x": 25, "y": 5 }, { "x": 26, "y": 5 }
    ];

    // =====================================================
    // INITIALIZATION - With Map Auto-Detection
    // =====================================================
    async function init() {
        console.log('[MAP-ENGINE] init() iniciado');

        // Dependências já foram verificadas em waitForDependencies()
        console.log('[MAP-ENGINE] Dependências verificadas. combatData disponível.');

        try {
            canvas = document.getElementById('map-canvas');
            minimapCanvas = document.getElementById('minimap-canvas');

            if (!canvas) {
                console.error('[MAP-ENGINE] Canvas not found');
                hideLoadingState();
                return;
            }
            console.log('[MAP-ENGINE] Canvas encontrado');

            ctx = canvas.getContext('2d', { alpha: false });
            if (minimapCanvas) minimapCtx = minimapCanvas.getContext('2d');
            console.log('[MAP-ENGINE] Contextos criados');
        } catch (err) {
            console.error('[MAP-ENGINE] Erro na inicialização inicial:', err);
            hideLoadingState();
            return;
        }

        // Inicializar sistema de SFX externo (se disponível)
        if (window.MapSFX) {
            window.MapSFX.init({
                particles: particles,
                floatingTexts: floatingTexts,
                needsRender: () => { needsRender = true; },
                CONFIG: CONFIG
            });
        }

        // Inicializar sistema de debug externo (se disponível)
        if (window.MapDebug) {
            window.MapDebug.init({
                particles: particles,
                floatingTexts: floatingTexts,
                CONFIG: CONFIG,
                needsRender: () => { needsRender = true; },
                gameState: gameState,
                showTacticalHUD: showTacticalHUD,
                updateTurnTimeline: updateTurnTimeline,
                playerUnits: () => playerUnits,
                enemyUnits: () => enemyUnits,
                selectUnit: selectUnit,
                deselectUnit: deselectUnit,
                activateFreeControl: activateFreeControl,
                deactivateFreeControl: deactivateFreeControl,
                getWalls: () => {
                    const effectiveWalls = WALLS.filter(w => !debugWallsRemoved.some(rw => rw.x === w.x && rw.y === w.y));
                    return [...effectiveWalls, ...debugWallsAdded];
                },
                toggleWall: toggleDebugWall,
                triggerRender: () => { needsRender = true; },
                showHealNumber: showHealNumber,
                showManaNumber: showManaNumber,
                showDamageNumber: showDamageNumber,
                spawnHealEffect: spawnHealEffect,
                spawnImpactBurst: spawnImpactBurst,
                applySkillEngineStats: applySkillEngineStats
            });
        }

        // Show loading state
        showLoadingState('Carregando mapa...');

        console.log('[MAP-ENGINE] Iniciando carregamento de sessão e mapa');
        try {
            sessionUid = getSessionUidFromUrl();
            if (sessionUid) {
                console.log('[MAP-ENGINE] Carregando sessão UID:', sessionUid);
                await loadSessionStateFromServer(sessionUid);
                console.log('[MAP-ENGINE] Sessão carregada');

                // Load entities from API if TacticalDataLoader is available (sem fallback: falha após retry cancela o jogo)
                if (window.TacticalDataLoader && sessionData) {
                    console.log('[MAP-ENGINE] Carregando entities via API...');
                    // player + allies + entities (inimigos); ver collectCombatKeysFromSession()
                    const combatKeys = collectCombatKeysFromSession(sessionData);

                    if (combatKeys.size > 0) {
                        const keysArray = Array.from(combatKeys);
                        console.log('[MAP-ENGINE] Carregando entities:', keysArray);
                        await window.TacticalDataLoader.loadEntities(keysArray);
                        console.log('[MAP-ENGINE] Entities carregadas com sucesso');

                        // Atualizar atributos das unidades com dados das entity sheets
                        updateUnitsAttributesFromEntitySheets();

                        // Now load ALL skills from all loaded entities BEFORE game starts
                        console.log('[MAP-ENGINE] Extraindo e carregando todas as skills...');
                        const allSkillIds = new Set();

                        // Extract skill IDs from all loaded entities
                        keysArray.forEach(combatKey => {
                            const entity = window.TacticalDataLoader.entityCache[combatKey];
                            if (entity && Array.isArray(entity.skills)) {
                                entity.skills.forEach(skill => {
                                    if (typeof skill === 'object' && skill !== null) {
                                        if (skill.id && typeof skill.id === 'string') {
                                            allSkillIds.add(skill.id);
                                        }
                                    } else if (typeof skill === 'string') {
                                        allSkillIds.add(skill);
                                    }
                                });
                            }
                        });

                        if (allSkillIds.size > 0) {
                            const skillIdsArray = Array.from(allSkillIds);
                            console.log('[MAP-ENGINE] Carregando', skillIdsArray.length, 'skills:', skillIdsArray);
                            await window.TacticalDataLoader.loadSkills(skillIdsArray);
                            console.log('[MAP-ENGINE] Todas as skills carregadas com sucesso');

                            // Preload all skill images to avoid reloading on every click
                            console.log('[MAP-ENGINE] Pré-carregando imagens de skills...');
                            preloadSkillImages(skillIdsArray);
                        } else {
                            console.warn('[MAP-ENGINE] Nenhuma skill encontrada nas entities');
                        }
                    }
                }
            } else {
                console.log('[MAP-ENGINE] Nenhuma sessão UID encontrada na URL');
            }
        } catch (err) {
            console.error('[MAP-ENGINE] Erro ao carregar sessão:', err);
            window.__mapEngineLoadError = err && err.message ? err.message : 'Não foi possível carregar. Tente novamente.';
            hideLoadingState();
            return;
        }

        // Load map image first to detect dimensions
        console.log('[MAP-ENGINE] Carregando imagem do mapa...');
        loadMapImage().then(() => {
            console.log('[MAP-ENGINE] Imagem do mapa carregada com sucesso');
            console.log('[DEBUG][init] Map loaded. MAP_WIDTH:', MAP_WIDTH, 'MAP_HEIGHT:', MAP_HEIGHT);

            // Fresh Start Case (no sessionStorage usage)
            let cameraRestored = false;
            console.log('[DEBUG][init] Initializing entities from server state');
            if (sessionData) {
                initializeEntitiesFromSession(sessionData);
                // Resetar alterações de debug ao recarregar (para evitar estado inconsistente)
                debugWallsAdded = [];
                debugWallsRemoved = [];
                console.log('[DEBUG][init] Alterações de debug resetadas ao recarregar');
            } else {
                initializeEntities();
            }

            // CRITICAL: Set up canvas and event listeners BEFORE handling battle result
            setupEventListeners();
            console.log('[DEBUG][init] Event listeners set up');

            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(canvas.parentElement);

            // CRITICAL: Manually trigger resize to set canvas dimensions BEFORE any animations
            if (canvas.parentElement) {
                const rect = canvas.parentElement.getBoundingClientRect();
                console.log('[DEBUG][init] Parent rect:', rect.width, 'x', rect.height);
                if (rect.width > 0 && rect.height > 0) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                    console.log('[DEBUG][init] Canvas dimensions set to:', canvas.width, 'x', canvas.height);
                }
            }

            // Restaurar câmera/zoom do localStorage (por sessão)
            cameraRestored = restoreCameraState();
            if (cameraRestored) {
                console.log('[DEBUG][init] Camera restored from localStorage:', viewState);
            }

            // Only initialize camera if not restored from saved state
            if (!cameraRestored) {
                console.log('[DEBUG][init] No camera restored, initializing camera...');
                setTimeout(initCamera, 50);
            } else {
                console.log('[DEBUG][init] Camera was restored from saved state, skipping initCamera');
            }

            updateUI();
            console.log('[DEBUG][init] Final state before gameLoop:', {
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                viewState,
                mapLoaded,
                isAnimating: gameState.isAnimating,
                phase: gameState.phase
            });
            requestAnimationFrame(gameLoop);

            // Hide loading
            hideLoadingState();

            // Mostrar banner inicial conforme fase restaurada
            const unitsReady = playerUnits.some(u => canUnitAct(u));
            console.log('[DEBUG][init] Fase após restore:', {
                phase: gameState.phase,
                turn: gameState.turn,
                unitsReady,
                isAnimating: gameState.isAnimating
            });
            if (gameState.phase === 'enemy') {
                resumeEnemyTurnFromRestore();
            } else if (gameState.phase === 'player' && unitsReady) {
                setTimeout(async () => {
                    await showTurnBanner('player');
                    // Primeiro personagem por ASPD/AGI (mais rápido age primeiro)
                    const firstAlive = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
                    // Se não há unidade selecionada OU a unidade selecionada já agiu, selecionar próxima disponível
                    if (firstAlive && (!gameState.selectedUnit || !canUnitAct(gameState.selectedUnit))) {
                        selectUnit(firstAlive);
                        animateCameraToUnit(firstAlive);
                    }
                }, 600);
            } else {
                updateUI();
            }

        }).catch(err => {
            console.error('[MAP-ENGINE] Falha ao carregar mapa:', err);
            console.error('[MAP-ENGINE] Stack trace:', err.stack);
            showLoadingState('Erro ao carregar mapa');
            hideLoadingState();
        });
    }

    function getSessionUidFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('session');
    }

    /**
     * Coleta combatKey de todas as unidades que precisam de ficha (skills, sprites, sons).
     * Usado antes de loadEntities() para que entityCache tenha entradas para player, aliados e
     * inimigos — caso contrário getUnitSkills() retorna [] e o botão Skills fica desabilitado.
     *
     * Contrato do /game/explore/state (ExploreController::getState):
     *   - player: objeto único { combatKey|combat_key, ... }
     *   - allies: array de aliados { combatKey|combat_key, ... }
     *   - entities: array de inimigos (chave "entities" no JSON, não "enemies")
     *
     * Ao adicionar um novo tipo de unidade à API (ex.: summons, NPCs), incluir aqui.
     *
     * @param {Object} data - Resposta de /game/explore/state (sessionData)
     * @returns {Set<string>} combatKeys para loadEntities(Array.from(set))
     */
    function collectCombatKeysFromSession(data) {
        const combatKeys = new Set();
        if (!data) return combatKeys;

        function add(u) {
            const k = u && (u.combatKey || u.combat_key || u.entity_id);
            if (k) combatKeys.add(k);
        }

        if (data.player) add(data.player);

        const allies = Array.isArray(data.allies) ? data.allies : [];
        allies.forEach(add);

        // Inimigos: chave no JSON é "entities" (ExploreController::getState)
        const entities = Array.isArray(data.entities) ? data.entities : [];
        entities.forEach(add);

        return combatKeys;
    }

    async function loadSessionStateFromServer(uid) {
        try {
            console.log('[DEBUG][loadSession] Carregando sessão UID:', uid);
            const response = await fetch(`/game/explore/state?session=${encodeURIComponent(uid)}`);
            const data = await response.json();
            console.log('[DEBUG][loadSession] Resposta do servidor:', data);

            if (!data?.success) {
                console.warn('[MapEngine] Sessão inválida, fallback para modo padrão.');
                sessionData = null;
                return;
            }

            console.log('[DEBUG][loadSession] Entities recebidos:', data.entities);
            console.log('[DEBUG][loadSession] Quantidade de entities:', Array.isArray(data.entities) ? data.entities.length : 0);
            console.log('[DEBUG][loadSession] Turno/fase recebidos:', {
                turn: data.turn,
                phase: data.phase,
                unitsActed: data.unitsActed
            });

            sessionData = data;
            applySessionConfig(data);
            console.log('[DEBUG][loadSession] sessionData final:', sessionData);
        } catch (error) {
            console.error('[MapEngine] Erro ao carregar sessão:', error);
            sessionData = null;
        }
    }

    function applySessionConfig(data) {
        const mapConfig = data.mapConfig || {};
        if (mapConfig.cellSize) CONFIG.CELL_SIZE = mapConfig.cellSize;
        if (mapConfig.gridCols) CONFIG.GRID_COLS = mapConfig.gridCols;
        if (mapConfig.gridRows) CONFIG.GRID_ROWS = mapConfig.gridRows;
        if (mapConfig.mapImage) CONFIG.MAP_PATH = mapConfig.mapImage;

        // Carregar paredes do config do mapa (config_json.walls ou config_json.map.walls)
        const configWalls = mapConfig.walls || data.config?.walls || [];
        if (Array.isArray(configWalls) && configWalls.length > 0) {
            WALLS = configWalls;
            console.log(`[DEBUG][applySessionConfig] Carregadas ${WALLS.length} paredes do config do mapa`);
        } else {
            // Fallback: manter paredes padrão se não houver no config
            console.log('[DEBUG][applySessionConfig] Nenhuma parede no config, usando padrão');
        }
    }

    function loadMapImage() {
        return new Promise((resolve, reject) => {
            console.log('[MAP-ENGINE] loadMapImage() iniciado. MAP_PATH:', CONFIG.MAP_PATH);
            const img = new Image();
            img.onload = () => {
                console.log('[MAP-ENGINE] Imagem do mapa carregada com sucesso');
                // Auto-detect dimensions
                MAP_WIDTH = img.width;
                MAP_HEIGHT = img.height;

                // Calculate grid size
                CONFIG.GRID_COLS = Math.ceil(MAP_WIDTH / CONFIG.CELL_SIZE);
                CONFIG.GRID_ROWS = Math.ceil(MAP_HEIGHT / CONFIG.CELL_SIZE);

                console.log(`[MAP-ENGINE] Map loaded: ${MAP_WIDTH}x${MAP_HEIGHT} (${CONFIG.GRID_COLS}x${CONFIG.GRID_ROWS} cells)`);

                loadedImages['map'] = img;
                mapLoaded = true;
                resolve();
            };
            img.onerror = (err) => {
                console.error('[MAP-ENGINE] Erro ao carregar imagem do mapa:', err);
                console.error('[MAP-ENGINE] MAP_PATH que falhou:', CONFIG.MAP_PATH);
                reject(new Error(`Map image failed to load: ${CONFIG.MAP_PATH}`));
            };
            console.log('[MAP-ENGINE] Tentando carregar imagem:', CONFIG.MAP_PATH);
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
        // Helper to get entity name (now loaded via API)
        const getEntityName = (key, fallback) => {
            // Try cache first, otherwise use fallback
            const entity = window.TacticalDataLoader?.entityCache?.[key];
            return entity?.name || fallback;
        };

        // Player Units (your team) - Using dynamic names from combatData
        // Agora com sistema de atributos integrado ao SkillEngine
        // REMOVIDO: hero2 (Mage) e hero3 (Archer) - eram apenas para debug
        // O sistema real usa initializeEntitiesFromSession() que carrega units da sessão
        playerUnits = [
            {
                id: 'hero1', name: getEntityName('hero_swordman', 'Swordman'), type: 'player',
                combatKey: 'hero_swordman',
                x: 16, y: 8,
                level: 10,
                attributes: { str: 15, agi: 8, vit: 12, int: 5, dex: 10, luk: 6 },
                hp: 100, maxHp: 100, sp: 1000, maxSp: 1000, attack: 18, defense: 12,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/characters/swordman.webp',
                class: 'warrior', scale: 1.0
            }
        ];

        // Enemy Units - Positioned closer for group combat testing
        // Agora com sistema de atributos integrado ao SkillEngine
        enemyUnits = [
            {
                id: 'orc1', name: getEntityName('orc', 'Orc Warrior'), type: 'enemy',
                x: 18, y: 8,
                level: 5,
                attributes: { str: 12, agi: 5, vit: 10, int: 3, dex: 6, luk: 3 },
                hp: 35, maxHp: 35, attack: 10, defense: 5,
                moveRange: 3, attackRange: 1, avatar: '/public/assets/img/orc.webp',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc2', name: getEntityName('orc_scout', 'Orc Scout'), type: 'enemy',
                x: 19, y: 7,
                level: 6,
                attributes: { str: 8, agi: 10, vit: 7, int: 4, dex: 12, luk: 4 },
                hp: 45, maxHp: 45, attack: 15, defense: 3,
                moveRange: 2, attackRange: 3, avatar: '/public/assets/img/orc_scout.webp',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'orc3', name: getEntityName('bandit_marauder', 'Bandit Marauder'), type: 'enemy',
                x: 19, y: 9,
                level: 12,
                attributes: { str: 18, agi: 8, vit: 15, int: 5, dex: 10, luk: 5 },
                hp: 120, maxHp: 120, attack: 22, defense: 10,
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/bandit_marauder.webp',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc4', name: getEntityName('goblin', 'Goblin Scout'), type: 'enemy',
                x: 30, y: 5,
                level: 4,
                attributes: { str: 6, agi: 14, vit: 5, int: 5, dex: 10, luk: 8 },
                hp: 40, maxHp: 40, attack: 18, defense: 3,
                moveRange: 2, attackRange: 2, avatar: '/public/assets/img/goblin.png',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'wolf1', name: getEntityName('wolf', 'Dire Wolf'), type: 'enemy',
                combatKey: 'wolf',
                x: 12, y: 11,
                level: 5,
                attributes: { str: 10, agi: 15, vit: 8, int: 2, dex: 8, luk: 4 },
                hp: 40, maxHp: 40, attack: 12, defense: 4,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/characters/wolf.webp',
                behavior: 'aggressive', scale: 1.0,
                animationState: 'idle'
            },
            {
                id: 'slime1', name: getEntityName('toxic_slime', 'Toxic Slime'), type: 'enemy',
                x: 11, y: 7,
                level: 3,
                attributes: { str: 5, agi: 4, vit: 12, int: 6, dex: 4, luk: 5 },
                hp: 30, maxHp: 30, attack: 8, defense: 8,
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/characters/slime.webp',
                behavior: 'aggressive', scale: 1.0
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

        // Recalcular stats baseados em level/atributos se SkillEngine disponível
        applySkillEngineStats(playerUnits);
        applySkillEngineStats(enemyUnits);

        loadImages();
        loadRequiredSprites(); // Carregar sprites necessários
        updateFreeExploreState();
    }

    /**
     * Aplica stats calculados pelo TacticalSkillEngine às unidades
     * Usa o sistema de atributos (str, agi, vit, int, dex, luk) + level
     * @param {Array} units - Array de unidades
     * @param {Boolean} isNewBattle - Se true, força HP/SP = maxHp/maxSp
     */
    function applySkillEngineStats(units, isNewBattle = false) {
        if (!window.TacticalSkillEngine) {
            console.warn('[MAP] TacticalSkillEngine não disponível. Stats fixos serão usados.');
            return;
        }

        units.forEach(unit => {
            // Garantir baseAttributes existe
            if (!unit.baseAttributes && unit.attributes) {
                unit.baseAttributes = { ...unit.attributes };
            }

            // Verificar se temos atributos e level
            const attributes = unit.attributes || unit.baseAttributes || {};
            const level = unit.level || 1;

            if (!attributes || Object.keys(attributes).length === 0) {
                console.warn(`[MAP] Unidade ${unit.name} não tem atributos definidos.`);
                return;
            }

            // Calcular stats base usando TacticalSkillEngine
            const stats = window.TacticalSkillEngine.calculateStatsFromAttributes(level, attributes);

            // Salvar em unit.stats (objeto completo)
            unit.stats = {
                atk: stats.atk,
                matk: stats.matk,
                atkRanged: stats.atkRanged,
                def: stats.softDef,
                hardDef: stats.hardDef,
                mdef: stats.mdef,
                hit: stats.hit,
                flee: stats.flee,
                crit: stats.crit,
                aspd: stats.aspd
            };

            // Manter compatibilidade com propriedades individuais
            unit.attack = stats.atk;
            unit.matk = stats.matk;
            unit.attackRanged = stats.atkRanged;
            unit.defense = stats.softDef;
            unit.mdef = stats.mdef;
            unit.hit = stats.hit;
            unit.flee = stats.flee;
            unit.crit = stats.crit;
            unit.aspd = stats.aspd;

            // HP e MP - usar calculado ou manter original se maior (para bosses etc)
            unit.maxHp = Math.max(unit.maxHp || 0, stats.maxHp);
            unit.maxSp = Math.max(unit.maxSp || 0, stats.maxMana);
            unit.maxMana = stats.maxMana;

            // Forçar HP/SP cheios se for nova batalha
            if (isNewBattle) {
                unit.hp = unit.maxHp;
                unit.sp = unit.maxSp;
                console.log(`[MAP] Nova batalha - ${unit.name}: HP forçado para ${unit.hp}/${unit.maxHp}`);
            } else if (unit.hp === undefined || unit.hp === null || isNaN(unit.hp)) {
                // Se hp é undefined/null/NaN, usar maxHp
                unit.hp = unit.maxHp;
            } else {
                // Se hp existe mas é maior que maxHp, limitar ao maxHp
                unit.hp = Math.min(unit.hp, unit.maxHp);
            }

            if (!isNewBattle && (unit.sp === undefined || unit.sp === null || isNaN(unit.sp))) {
                unit.sp = unit.maxSp;
            } else if (!isNewBattle) {
                // Se sp existe mas é maior que maxSp, limitar ao maxSp
                unit.sp = Math.min(unit.sp, unit.maxSp);
            }

            // Recalcular stats com buffs/debuffs (se houver)
            if (window.TacticalSkillEngine.recalculateStats) {
                window.TacticalSkillEngine.recalculateStats(unit);

                // Atualizar propriedades individuais após recalculateStats (para compatibilidade)
                if (unit.stats) {
                    unit.attack = unit.stats.atk || unit.attack;
                    unit.matk = unit.stats.matk || unit.matk;
                    unit.attackRanged = unit.stats.atkRanged ?? unit.attackRanged;
                    unit.defense = unit.stats.def || unit.defense;
                    unit.mdef = unit.stats.mdef || unit.mdef;
                    unit.hit = unit.stats.hit || unit.hit;
                    unit.flee = unit.stats.flee || unit.flee;
                    unit.crit = unit.stats.crit || unit.crit;
                    unit.aspd = unit.stats.aspd || unit.aspd;
                }
            }

            console.log(`[MAP] Stats calculados para ${unit.name} (Lv${level}):`, {
                atk: unit.stats?.atk || unit.attack,
                atkRanged: unit.stats?.atkRanged ?? unit.attackRanged,
                matk: unit.stats?.matk || unit.matk,
                def: unit.stats?.def || unit.defense,
                hp: unit.maxHp, mp: unit.maxSp
            });
        });
    }

    function initializeEntitiesFromSession(data) {
        console.log('[DEBUG][initEntities] Dados recebidos:', data);

        const player = data.player;
        const enemies = Array.isArray(data.entities) ? data.entities : [];

        console.log('[DEBUG][initEntities] Player:', player);
        console.log('[DEBUG][initEntities] Enemies recebidos:', enemies);
        console.log('[DEBUG][initEntities] Quantidade de inimigos:', enemies.length);

        playerUnits = [];
        enemyUnits = [];
        chests = Array.isArray(data.chests) ? data.chests : [];
        portal = data.portal || null;

        // Restaurar estado do turno (evita resetar para player no F5)
        if (typeof data.turn === 'number') {
            gameState.turn = data.turn;
        }
        if (typeof data.phase === 'string') {
            gameState.phase = data.phase;
        }
        if (Array.isArray(data.unitsActed)) {
            gameState.unitsActedThisTurn = new Set(data.unitsActed);
        }
        gameState.isAnimating = false;

        // Detectar se é uma nova batalha (para forçar HP/SP cheios)
        // Uma batalha é nova se: turn é 1, phase é player, e nenhuma unidade agiu ainda
        const isNewBattle = (gameState.turn === 1 && gameState.phase === 'player' && gameState.unitsActedThisTurn.size === 0);
        console.log('[DEBUG][initEntities] isNewBattle:', isNewBattle, { turn: gameState.turn, phase: gameState.phase, unitsActed: gameState.unitsActedThisTurn.size });

        console.log('[DEBUG][initEntities] Turno restaurado:', {
            turn: gameState.turn,
            phase: gameState.phase,
            unitsActed: Array.from(gameState.unitsActedThisTurn || [])
        });

        if (player && (player.hp == null || player.hp > 0)) {
            // Carregar atributos da entity sheet se disponível
            const combatKey = player.combatKey || player.combat_key || player.entity_id || null;
            let entityDef = null;
            if (combatKey && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[combatKey];
            }
            if (!entityDef && player.entity_id && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[player.entity_id];
            }

            const playerUnit = {
                id: player.id || 'player',
                name: player.name || entityDef?.name || 'Hero',
                type: 'player',
                element: player.element || entityDef?.element || 'neutral',
                x: player.x || 5,
                y: player.y || 5,
                level: player.level || entityDef?.level || entityDef?.base_level || 1,
                // Copiar atributos: primeiro de player (salvo), depois entity sheet, depois padrão
                attributes: player.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                baseAttributes: player.baseAttributes || player.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                // HP/SP: usar maxHp/maxSp se for nova batalha, senão usar valores salvos
                hp: isNewBattle ? (player.maxHp || 100) : (player.hp || player.maxHp || 100),
                maxHp: player.maxHp || 100,
                sp: isNewBattle ? (player.maxSp || 50) : (player.sp || player.maxSp || 50),
                maxSp: player.maxSp || 50,
                mana: isNewBattle ? (player.maxMana || player.maxSp || 50) : (player.mana || player.sp || 50),
                maxMana: player.maxMana || player.maxSp || 50,
                attack: player.attack || 10,
                defense: player.defense || 5,
                moveRange: player.moveRange || 4,
                attackRange: player.attackRange || 1,
                // Avatar é imutável e sempre vem do entity sheet/config, não do state salvo
                avatar: entityDef?.images ? '/public/' + (entityDef.images.default || entityDef.images.male || entityDef.images.female || Object.values(entityDef.images || {})[0] || 'assets/img/characters/swordman.webp') : (player.avatar || '/public/assets/img/characters/swordman.webp'),
                class: player.class || entityDef?.class || 'hero',
                scale: player.scale || 1.0,
                combatKey: combatKey,
                entity_id: player.entity_id || entityDef?.id,
                animationState: 'idle', // Estado inicial da animação
                hasMoved: !!player.hasMoved,
                facingRight: player.facingRight ?? false, // Usar valor salvo ou false como padrão
                // Inicializar arrays de buffs/debuffs se não existirem
                activeBuffs: player.activeBuffs || [],
                activeDebuffs: player.activeDebuffs || [],
                statusEffects: player.statusEffects || []
            };

            // Animação: apenas da ficha (entityDef); sem fallback
            if (!entityDef) throw new Error('Entity not found: ' + combatKey);
            playerUnit.animations = {};
            for (const k of ['idle', 'walk', 'atack']) {
                if (entityDef.animations && entityDef.animations[k]) playerUnit.animations[k] = { ...entityDef.animations[k] };
            }
            playerUnit.forceAnimation = entityDef.forceAnimation ?? 'idle';

            playerUnits.push(playerUnit);
        }

        // Process allies from session data
        const allies = Array.isArray(data.allies) ? data.allies : [];
        allies.forEach((ally, index) => {
            if (ally.hp != null && ally.hp <= 0) return;
            console.log(`[DEBUG][initEntities] Processando aliado ${index + 1}:`, ally);

            // Carregar atributos da entity sheet se disponível
            let combatKey = ally.combatKey || ally.combat_key || ally.entity_id || 'hero_archer';
            if (combatKey === 'archer') combatKey = 'hero_archer';
            let entityDef = null;
            if (combatKey && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[combatKey];
            }
            if (!entityDef && ally.entity_id && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[ally.entity_id];
            }

            const allyUnit = {
                id: ally.id || `ally_${index + 1}`,
                name: ally.name || entityDef?.name || 'Ally',
                type: 'player', // Allies are player units
                element: ally.element || entityDef?.element || 'neutral',
                x: ally.x || (playerUnits[0]?.x || 5) + 1,
                y: ally.y || playerUnits[0]?.y || 5,
                level: ally.level || entityDef?.level || entityDef?.base_level || 1,
                // Copiar atributos: primeiro de ally (salvo), depois entity sheet, depois padrão
                attributes: ally.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                baseAttributes: ally.baseAttributes || ally.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                // HP/SP: usar maxHp/maxSp se for nova batalha, senão usar valores salvos
                hp: isNewBattle ? (ally.maxHp || 100) : (ally.hp || ally.maxHp || 100),
                maxHp: ally.maxHp || 100,
                sp: isNewBattle ? (ally.maxSp || 50) : (ally.sp || ally.maxSp || 50),
                maxSp: ally.maxSp || 50,
                mana: isNewBattle ? (ally.maxMana || ally.maxSp || 50) : (ally.mana || ally.sp || 50),
                maxMana: ally.maxMana || ally.maxSp || 50,
                attack: ally.attack || 10,
                defense: ally.defense || 5,
                moveRange: ally.moveRange || 5,
                attackRange: ally.attackRange || 4, // Ranged units have longer range
                // Avatar é imutável e sempre vem do entity sheet/config, não do state salvo
                avatar: entityDef?.images ? '/public/' + (entityDef.images.default || entityDef.images.male || entityDef.images.female || Object.values(entityDef.images || {})[0] || 'assets/img/archer-male.webp') : (ally.avatar || '/public/assets/img/archer-male.webp'),
                class: ally.class || entityDef?.class || 'archer',
                scale: ally.scale || 1.0,
                combatKey: combatKey,
                entity_id: ally.entity_id || entityDef?.id,
                animationState: 'idle', // Estado inicial da animação
                hasMoved: !!ally.hasMoved,
                facingRight: ally.facingRight ?? false, // Usar valor salvo ou false como padrão
                // Inicializar arrays de buffs/debuffs se não existirem
                activeBuffs: ally.activeBuffs || [],
                activeDebuffs: ally.activeDebuffs || [],
                statusEffects: ally.statusEffects || []
            };

            // Animação: apenas da ficha (entityDef); sem fallback
            if (!entityDef) throw new Error('Entity not found: ' + combatKey);
            allyUnit.animations = {};
            for (const k of ['idle', 'walk', 'atack']) {
                if (entityDef.animations && entityDef.animations[k]) allyUnit.animations[k] = { ...entityDef.animations[k] };
            }
            allyUnit.forceAnimation = entityDef.forceAnimation ?? 'idle';

            playerUnits.push(allyUnit);
        });

        enemies.forEach((enemy, index) => {
            if (enemy.hp != null && enemy.hp <= 0) return;
            console.log(`[DEBUG][initEntities] Processando inimigo ${index + 1}:`, enemy);

            const combatKey = enemy.combatKey || enemy.combat_key || enemy.entity_id || null;
            const unitCombatKey = (combatKey || '').toLowerCase();
            const isSlime = unitCombatKey === 'toxic_slime' || unitCombatKey === 'slime' || (enemy.name && enemy.name.toLowerCase().includes('slime'));

            console.log(`[DEBUG][initEntities] Inimigo ${index + 1} - combatKey: ${unitCombatKey}, isSlime: ${isSlime}, x: ${enemy.x}, y: ${enemy.y}`);

            let entityDef = null;
            if (combatKey && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[combatKey];
            }
            if (!entityDef && enemy.entity_id && window.TacticalDataLoader?.entityCache) {
                entityDef = window.TacticalDataLoader.entityCache[enemy.entity_id];
            }

            const unit = {
                id: enemy.id || `enemy_${Math.random().toString(36).slice(2, 8)}`,
                name: enemy.name || entityDef?.name || 'Enemy',
                type: 'enemy',
                level: enemy.level || entityDef?.level || entityDef?.base_level || 1,
                // Copiar atributos: primeiro de enemy (salvo), depois entity sheet, depois padrão
                attributes: enemy.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                baseAttributes: enemy.baseAttributes || enemy.attributes || entityDef?.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                x: enemy.x || 1,
                y: enemy.y || 1,
                // HP/SP: usar maxHp/maxSp se for nova batalha, senão usar valores salvos
                hp: isNewBattle ? (enemy.maxHp || enemy.hp || 20) : (enemy.hp || enemy.maxHp || 20),
                maxHp: enemy.maxHp || enemy.hp || 20,
                sp: isNewBattle ? (enemy.maxSp || 50) : (enemy.sp || enemy.maxSp || 50),
                maxSp: enemy.maxSp || 50,
                mana: isNewBattle ? (enemy.maxMana || enemy.maxSp || 50) : (enemy.mana || enemy.sp || 50),
                maxMana: enemy.maxMana || enemy.maxSp || 50,
                attack: enemy.attack || 5,
                defense: enemy.defense || 2,
                moveRange: enemy.moveRange || 2,
                attackRange: enemy.attackRange || 1,
                // Avatar é imutável e sempre vem do entity sheet/config, não do state salvo
                avatar: entityDef?.images ? '/public/' + (entityDef.images.default || entityDef.images.male || entityDef.images.female || Object.values(entityDef.images || {})[0] || 'assets/img/enemy.png') : (enemy.avatar || '/public/assets/img/enemy.png'),
                behavior: enemy.behavior || 'aggressive',
                scale: enemy.scale || 1.0,
                combatKey: combatKey,
                entity_id: enemy.entity_id || entityDef?.id,
                animationState: 'idle', // Estado inicial da animação
                facingRight: false, // false = esquerda (<-), true = direita (->)
                // Inicializar arrays de buffs/debuffs se não existirem
                activeBuffs: enemy.activeBuffs || [],
                activeDebuffs: enemy.activeDebuffs || [],
                statusEffects: enemy.statusEffects || []
            };

            // Animação: apenas da ficha (entityDef); sem fallback
            if (!entityDef) throw new Error('Entity not found: ' + combatKey);
            unit.animations = {};
            for (const k of ['idle', 'walk', 'atack']) {
                if (entityDef.animations && entityDef.animations[k]) unit.animations[k] = { ...entityDef.animations[k] };
            }
            unit.forceAnimation = entityDef.forceAnimation ?? 'idle';
            unit.animationState = 'idle';

            enemyUnits.push(unit);
        });

        console.log('[DEBUG][initEntities] Total de enemyUnits após processamento:', enemyUnits.length);
        console.log('[DEBUG][initEntities] EnemyUnits final:', enemyUnits);

        // Atualizar atributos das unidades com dados das entity sheets (se já carregadas)
        updateUnitsAttributesFromEntitySheets();

        // Recalcular stats baseados em level/atributos se SkillEngine disponível
        // Passar isNewBattle para forçar HP/SP = maxHp/maxSp em novas batalhas
        applySkillEngineStats(playerUnits, isNewBattle);
        applySkillEngineStats(enemyUnits, isNewBattle);

        // Inicializar baseAttributes para TacticalSkillEngine se ainda não existir
        // E garantir HP/MP cheios após calcular stats (se não foram explicitamente salvos)
        [...playerUnits, ...enemyUnits].forEach(unit => {
            if (!unit.baseAttributes && unit.attributes) {
                unit.baseAttributes = { ...unit.attributes };
            }
            // Garantir arrays de buffs/debuffs
            if (!unit.activeBuffs) unit.activeBuffs = [];
            if (!unit.activeDebuffs) unit.activeDebuffs = [];
            if (!unit.statusEffects) unit.statusEffects = [];

            // Garantir HP/MP cheios após calcular stats (se não foram explicitamente salvos)
            // Se hp/sp são undefined/null ou 0 (mas maxHp/maxSp foram calculados), usar máximos
            // Isso garante que na primeira inicialização, unidades começam com HP/MP cheios
            if ((unit.hp === undefined || unit.hp === null || unit.hp === 0) && unit.maxHp > 0) {
                unit.hp = unit.maxHp;
            }
            if ((unit.sp === undefined || unit.sp === null || unit.sp === 0) && unit.maxSp > 0) {
                unit.sp = unit.maxSp;
            }
            // Garantir que não excedam máximos
            if (unit.hp > unit.maxHp) unit.hp = unit.maxHp;
            if (unit.sp > unit.maxSp) unit.sp = unit.maxSp;
        });

        loadImages();
        loadRequiredSprites(); // Carregar sprites necessários
        updateFreeExploreState();
    }

    /**
     * Atualiza atributos das unidades com dados das entity sheets (se disponíveis)
     */
    function updateUnitsAttributesFromEntitySheets() {
        if (!window.TacticalDataLoader?.entityCache) {
            console.log('[MAP-ENGINE] updateUnitsAttributesFromEntitySheets: entityCache não disponível ainda');
            return;
        }

        // Atualizar player units
        playerUnits.forEach(unit => {
            const combatKey = unit.combatKey || unit.combat_key;
            if (!combatKey) {
                console.log(`[MAP-ENGINE] Unidade ${unit.id} não tem combatKey`);
                return;
            }

            const entityDef = window.TacticalDataLoader.entityCache[combatKey];
            if (!entityDef) {
                console.log(`[MAP-ENGINE] Entity sheet não encontrada para combatKey: ${combatKey}`);
                return;
            }

            console.log(`[MAP-ENGINE] Atualizando atributos de ${unit.name} com dados de ${entityDef.name}:`, {
                entityAttributes: entityDef.attributes,
                currentAttributes: unit.attributes,
                entityLevel: entityDef.level,
                currentLevel: unit.level
            });

            // SEMPRE atualizar atributos das entity sheets se disponíveis (sobrescrever salvos)
            if (entityDef.attributes) {
                unit.attributes = { ...entityDef.attributes };
            }
            // Sempre atualizar baseAttributes
            unit.baseAttributes = entityDef.attributes ? { ...entityDef.attributes } : (unit.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 });
            // Atualizar level se entity sheet tiver
            if (entityDef.level) {
                unit.level = entityDef.level;
            }
            // Atualizar nome se entity sheet tiver nome
            if (entityDef.name) {
                unit.name = entityDef.name;
            }
            // Atualizar elemento se entity sheet tiver
            if (entityDef.element) {
                unit.element = entityDef.element;
            }
        });

        // Atualizar enemy units
        enemyUnits.forEach(unit => {
            const combatKey = unit.combatKey || unit.combat_key;
            if (!combatKey) {
                console.log(`[MAP-ENGINE] Unidade ${unit.id} não tem combatKey`);
                return;
            }

            const entityDef = window.TacticalDataLoader.entityCache[combatKey];
            if (!entityDef) {
                console.log(`[MAP-ENGINE] Entity sheet não encontrada para combatKey: ${combatKey}`);
                return;
            }

            console.log(`[MAP-ENGINE] Atualizando atributos de ${unit.name} com dados de ${entityDef.name}:`, {
                entityAttributes: entityDef.attributes,
                currentAttributes: unit.attributes,
                entityLevel: entityDef.level,
                currentLevel: unit.level
            });

            // SEMPRE atualizar atributos das entity sheets se disponíveis (sobrescrever salvos)
            if (entityDef.attributes) {
                unit.attributes = { ...entityDef.attributes };
            }
            // Sempre atualizar baseAttributes
            unit.baseAttributes = entityDef.attributes ? { ...entityDef.attributes } : (unit.attributes || { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 });
            // Atualizar level se entity sheet tiver
            if (entityDef.level) {
                unit.level = entityDef.level;
            }
            // Atualizar nome se entity sheet tiver nome
            if (entityDef.name) {
                unit.name = entityDef.name;
            }
            // Atualizar elemento se entity sheet tiver
            if (entityDef.element) {
                unit.element = entityDef.element;
            }
        });

        // Código duplicado removido - já atualizado acima

        console.log('[MAP-ENGINE] Atributos atualizados das entity sheets');
    }

    function loadImages() {
        // Map is already loaded in loadMapImage(), only load other assets
        const sources = {
            portal: '/public/assets/img/portal.png',
            chest: '/public/assets/img/chest.png'
        };

        // Carregar avatares para TODAS as unidades (como fallback se sprites não carregarem)
        [...playerUnits, ...enemyUnits].forEach(u => {
            if (u.avatar) {
                sources[u.id] = u.avatar;
            }
        });

        // Carregar TODAS as imagens imediatamente (não esperar onload)
        Object.entries(sources).forEach(([id, src]) => {
            // Evitar requisição duplicada: já carregada ou já em carregamento
            if (loadedImages[id]) return;

            const img = new Image();
            loadedImages[id] = img; // reservar antes de src para que outra loadImages() não dispare request duplicado
            img.onerror = () => { /* silencioso */ };
            img.onload = () => { needsRender = true; };
            img.src = src;

            if (img.complete && img.width > 0 && img.height > 0) needsRender = true;
        });
    }

    // =====================================================
    // TURN SYSTEM
    // =====================================================
    function getUnitSpeed(u) {
        return u.aspd ?? u.agi ?? (u.attributes && u.attributes.agi) ?? 0;
    }
    function getFirstPlayerUnitBySpeed(actedSet) {
        const list = playerUnits.filter(p => p.hp > 0 && !actedSet.has(p.id));
        if (list.length === 0) return null;
        list.sort((a, b) => (getUnitSpeed(b) - getUnitSpeed(a)) || (String(a.id || '').localeCompare(String(b.id || ''))));
        return list[0];
    }

    let isEndingTurn = false; // Flag para prevenir múltiplos cliques

    async function endPlayerTurn() {
        if (gameState.freeExplore) return;
        if (gameState.phase !== 'player' || gameState.isAnimating) return;
        if (isEndingTurn) return; // Prevenir múltiplos cliques

        isEndingTurn = true; // Bloquear novos cliques

        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.phase = 'enemy';
        console.log('[DEBUG][endPlayerTurn] Phase set to enemy:', {
            turn: gameState.turn,
            phase: gameState.phase,
            unitsActed: Array.from(gameState.unitsActedThisTurn || [])
        });

        // Persistir de forma assíncrona sem bloquear a UI
        persistSessionState().catch(() => { });

        // Close all menus/popups
        hideActionMenu();
        // REMOVIDO: hideAttackConfirmPopup() - função antiga deletada
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
        setTimeout(() => {
            processEnemyTurn();
            isEndingTurn = false; // Liberar após iniciar o turno inimigo
        }, 500);
    }

    async function resumeEnemyTurnFromRestore() {
        if (gameState.freeExplore) return;
        if (gameState.phase !== 'enemy' || gameState.isAnimating) return;

        // Fechar menus e garantir UI consistente
        hideActionMenu();
        // REMOVIDO: hideAttackConfirmPopup() - função antiga deletada
        attackPreviewCells = [];
        pendingAttack = null;
        clearHighlights();
        updateUI();

        // Esconder footer durante turno do inimigo
        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
        }

        needsRender = true;
        await showTurnBanner('enemy');
        setTimeout(() => processEnemyTurn(), 300);
    }

    async function processEnemyTurn() {
        for (const enemy of enemyUnits) {
            if (enemy.hp <= 0) continue;

            // Find closest player unit
            let closestPlayer = findClosestPlayer(enemy);
            if (!closestPlayer) continue;

            // Focar câmera no inimigo antes dele agir
            await animateCameraToUnit(enemy);

            // === DECISÃO INTELIGENTE ===
            // 1. AVALIAR SKILLS DISPONÍVEIS
            const skills = getUnitSkills(enemy);
            const viableSkills = skills.filter(skill => {
                const cost = skill.mana || skill.cost || 0;
                const dist = Math.max(Math.abs(enemy.x - closestPlayer.x), Math.abs(enemy.y - closestPlayer.y));
                const range = getSkillRange(skill);
                return enemy.sp >= cost && dist <= range && range > 0;
            });

            // 2. DECISÃO: Usar skill, atacar ou mover
            let actionTaken = false;

            if (viableSkills.length > 0) {
                // Escolher melhor skill
                const bestSkill = chooseBestSkill(enemy, closestPlayer, viableSkills);
                enemy.intent = 'skill';
                await executeSkill(enemy, closestPlayer, bestSkill);
                actionTaken = true;
            } else {
                // Verificar distância para ataque melee
                const dist = Math.max(Math.abs(enemy.x - closestPlayer.x), Math.abs(enemy.y - closestPlayer.y));

                if (dist <= (enemy.attackRange || 1)) {
                    // Está no alcance, atacar!
                    enemy.intent = 'attack';
                    await executeAttack(enemy, closestPlayer);
                    actionTaken = true;
                } else {
                    // Precisa se mover
                    enemy.intent = 'move';
                    const targetCell = findBestEnemyApproachCell(enemy, closestPlayer);
                    if (targetCell) {
                        const path = findPath(enemy, targetCell, enemy.moveRange);
                        if (path.length > 0) {
                            // Mover até entrar no alcance
                            let stopIndex = path.length - 1;
                            for (let i = 0; i < path.length; i++) {
                                const distToPlayer = Math.max(Math.abs(path[i].x - closestPlayer.x), Math.abs(path[i].y - closestPlayer.y));
                                if (distToPlayer <= (enemy.attackRange || 1)) {
                                    stopIndex = Math.max(0, i - 1);
                                    break;
                                }
                            }

                            const movePath = path.slice(0, Math.min(enemy.moveRange, stopIndex + 1));
                            for (const step of movePath) {
                                if (getUnitAt(step.x, step.y) && getUnitAt(step.x, step.y) !== enemy) break;
                                await animateMove(enemy, step.x, step.y, true);
                                enemy.x = step.x;
                                enemy.y = step.y;
                            }

                            // Após mover, verificar se ficou adjacente
                            const newDist = Math.max(Math.abs(enemy.x - closestPlayer.x), Math.abs(enemy.y - closestPlayer.y));
                            if (newDist <= (enemy.attackRange || 1)) {
                                enemy.intent = 'attack';
                                await executeAttack(enemy, closestPlayer);
                                actionTaken = true;
                            }
                        }
                    }

                    if (!actionTaken) {
                        enemy.intent = 'wait';
                        gameState.unitsActedThisTurn.add(enemy.id);
                    }
                }
            }

            // Voltar para idle após ação
            const prevState = enemy.animationState || 'walk';
            enemy.animationState = 'idle';
            if (prevState !== 'idle') {
                startAnimationBlend(enemy, prevState, 'idle', 160);
            }

            updateUI();
            needsRender = true;
            await sleep(200);
        }

        // ÚNICA PERSISTÊNCIA ao final do turno inimigo
        persistSessionState();

        if (playerUnits[0]) {
            await animateCameraToUnit(playerUnits[0]);
        }
        startPlayerTurn();
    }

    /**
     * Encontra o player mais próximo do inimigo
     */
    function findClosestPlayer(enemy) {
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
        return closestPlayer;
    }

    /**
     * Escolhe a melhor skill baseado na situação
     */
    function chooseBestSkill(caster, target, skills) {
        if (skills.length === 0) return null;

        let bestSkill = skills[0];
        let bestScore = -Infinity;

        for (const skill of skills) {
            let score = 0;

            // Priorizar dano se target HP alto
            if (skill.dmgMult && skill.dmgMult > 0) {
                score += skill.dmgMult * 10;
                if (target.hp > target.maxHp * 0.5) {
                    score += 5; // Bonus para skills de dano
                }
            }

            // Priorizar heal se caster HP baixo
            if (skill.healPct && caster.hp < caster.maxHp * 0.4) {
                score += 20;
            }

            // Priorizar AoE se múltiplos inimigos perto
            if (skill.type === 'aoe') {
                const nearbyEnemies = playerUnits.filter(p => {
                    const dist = Math.max(Math.abs(p.x - target.x), Math.abs(p.y - target.y));
                    return dist <= 2 && p.hp > 0;
                });
                score += nearbyEnemies.length * 3;
            }

            // Penalizar skills muito caras
            const cost = skill.mana || skill.cost || 0;
            if (cost > caster.sp * 0.5) {
                score -= 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestSkill = skill;
            }
        }

        return bestSkill;
    }

    async function startPlayerTurn() {
        if (gameState.freeExplore) return;
        gameState.turn++;
        gameState.phase = 'player';
        gameState.unitsActedThisTurn.clear();

        // Process buffs/debuffs/status effects for all units at turn start (after turn increment)
        // This ensures durations are decremented at the start of the new turn
        if (window.TacticalSkillEngine) {
            [...playerUnits, ...enemyUnits].forEach(unit => {
                if (unit && unit.hp > 0) {
                    // Process DOT damage at turn_start for immediate visual feedback
                    // This happens BEFORE decrementing duration, so damage happens when unit is about to act
                    if (unit.activeDebuffs && unit.activeDebuffs.length > 0) {
                        unit.activeDebuffs.forEach(d => {
                            const debuffData = d.data || {};
                            if (debuffData.dotDamage && debuffData.dotDamage > 0 && unit.hp > 0) {
                                // Skip DOT on the turn it was applied
                                const currentTurn = gameState.turn;
                                if (d.appliedTurn !== undefined && d.appliedTurn === currentTurn) {
                                    return; // Don't apply DOT on the same turn it was applied
                                }

                                const dmg = Math.max(1, Math.floor((unit.maxHp || 100) * debuffData.dotDamage));
                                const oldHp = unit.hp;
                                unit.hp = Math.max(0, unit.hp - dmg);
                                console.log(`[TACTICAL SKILL ENGINE] ${unit.name} takes ${debuffData.name || debuffData.id} DoT damage: -${dmg} HP (${oldHp} → ${unit.hp}/${unit.maxHp})`);

                                // Visual feedback (floating damage number)
                                if (window.MapEngine && typeof window.MapEngine.showDamageNumber === 'function') {
                                    const worldX = (unit.x - 0.5) * (window.CONFIG?.CELL_SIZE || 64);
                                    const worldY = (unit.y - 1.0) * (window.CONFIG?.CELL_SIZE || 64);
                                    // Use poison damage style for visual feedback
                                    window.MapEngine.showDamageNumber(worldX, worldY, dmg, false, 0, 0, unit);
                                }
                            }
                        });
                    }

                    // Process buff/debuff duration decrements at turn_end (after DOT damage)
                    window.TacticalSkillEngine.processBuffs(unit, 'turn_end');
                    window.TacticalSkillEngine.processStatusEffects(unit, 'turn_start');
                    window.TacticalSkillEngine.recalculateStats(unit);
                }
            });
            // Update timeline to reflect duration changes
            if (typeof updateTurnTimeline === 'function') {
                updateTurnTimeline();
            }
            // Update UI to reflect HP changes from DOT
            updateUI();
        }

        // Limpar intenções dos inimigos ao iniciar turno do player
        enemyUnits.forEach(e => { delete e.intent; });

        // Reset hasMoved flag for all player units
        playerUnits.forEach(u => u.hasMoved = false);

        updateUI();
        persistSessionState();

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

        // Auto-save progress at start of each player turn
        saveCameraState();

        // Primeiro por ASPD/AGI (mais rápido age primeiro)
        const firstAlive = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
        if (firstAlive) {
            // Focar câmera no herói
            await animateCameraToUnit(firstAlive);
            selectUnit(firstAlive);
        }
    }

    function canUnitAct(unit) {
        if (gameState.debugFreeControl || gameState.debugControlEnemy)
            return unit.hp > 0;
        return unit.hp > 0 && !gameState.unitsActedThisTurn.has(unit.id);
    }

    // =====================================================
    // SELECTION & ACTIONS
    // =====================================================
    function selectUnit(unit) {
        if (!unit) { deselectUnit(); return; }
        const allowed = (unit.type === 'player' || unit.type === 'ally') ||
            (gameState.debugControlEnemy && unit.type === 'enemy');
        if (!allowed) { deselectUnit(); return; }
        // Unidade que já agiu: manter selecionada (não desselecionar no turno do jogador)
        if (!canUnitAct(unit)) {
            gameState.selectedUnit = unit;
            gameState.currentAction = null;
            attackRangeCells = [];
            cancelSkillSelection();
            hideSkillMenu();
            clearHighlights();
            hideActionMenu();
            showTacticalHUD(unit);
            updateUI();
            if (typeof updateTurnTimeline === 'function') updateTurnTimeline();
            needsRender = true;
            return;
        }

        gameState.selectedUnit = unit;
        gameState.currentAction = null;

        attackRangeCells = [];
        cancelSkillSelection();
        hideSkillMenu();
        clearHighlights();
        showTacticalHUD(unit); // Nova HUD tática fixa
        updateUI();
        // Atualizar timeline para mostrar buffs/debuffs da unidade selecionada
        if (typeof updateTurnTimeline === 'function') {
            updateTurnTimeline();
        }
        needsRender = true;

        // Notificar debug panel se estiver ativo
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
            window.MapDebug.selectUnit(unit);
        }
    }

    /**
     * Volta à "seleção normal": sai de modo movimento/ataque/skill, mantém a unidade
     * selecionada e mostra a tactical-hud. Usado quando: ativa movimento/skill e cancela,
     * ou clica fora. Durante o turno do jogador não se desseleciona.
     */
    function returnToNormalSelection() {
        attackRangeCells = [];
        cancelSkillSelection();
        clearHighlights();
        hideActionMenu();
        if (gameState.selectedUnit) {
            showTacticalHUD(gameState.selectedUnit);
        }
        updateUI();
        needsRender = true;
    }

    /** Ativa Free Control para a unidade (chamado pelo painel de debug). Garante que as flags sejam setadas no gameState do engine. */
    function activateFreeControl(unit) {
        if (!unit) return;
        if (unit.type === 'enemy') {
            gameState.debugControlEnemy = true;
            gameState.debugFreeControl = false;
        } else {
            gameState.debugFreeControl = true;
            gameState.debugControlEnemy = false;
            if (gameState.unitsActedThisTurn) gameState.unitsActedThisTurn.delete(unit.id);
        }
        selectUnit(unit);
        needsRender = true;
    }

    /** Desativa Free Control (chamado pelo painel de debug ao escolher Off). */
    function deactivateFreeControl() {
        gameState.debugFreeControl = false;
        gameState.debugControlEnemy = false;
        deselectUnit(true);
        needsRender = true;
    }

    function deselectUnit(force = false) {
        // Durante turno do jogador: não desselecionar; apenas voltar ao modo normal (HUD)
        if (!force && gameState.phase === 'player' && !gameState.freeExplore) {
            returnToNormalSelection();
            return;
        }
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.selectedSkill = null;
        // Limpar TODOS os estados de ação
        attackRangeCells = [];
        skillRangeCells = [];
        skillAreaCells = [];
        selectedSkillForPreview = null;
        clearHighlights();
        hideActionMenu();
        hideTacticalHUD(); // Esconder HUD tática
        updateUI();
        needsRender = true;

        // Notificar debug panel se estiver ativo
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
            window.MapDebug.selectUnit(null);
        }
    }

    function setAction(action) {
        if (!gameState.selectedUnit) return;

        gameState.currentAction = action;
        clearHighlights();

        // Se não é ação de skill, limpar preview de skill
        if (action !== 'skill') {
            cancelSkillSelection();
        }

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
    function getMoveConfig(entity) {
        const key = (entity.type === 'player' || entity.id === 'player') ? 'player' : 'enemy';
        return MOVE_CONFIG[key] || MOVE_CONFIG.enemy;
    }

    function applyMoveEasing(t, type = 'heavy') {
        if (type === 'snappy') {
            // Ease-out quartic: início rápido, desaceleração suave
            return 1 - Math.pow(1 - t, 4);
        }
        // Default heavy: ease-in-out quintic - muito suave
        return t < 0.5
            ? 16 * t * t * t * t * t
            : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    function startAnimationBlend(unit, fromState, toState, duration = 140) {
        if (!unit || !fromState || !toState || fromState === toState) return;
        unit.animationBlend = {
            from: fromState,
            to: toState,
            start: performance.now(),
            duration
        };
    }
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

        const startPos = { x: unit.x, y: unit.y };

        gameState.isAnimating = true;
        hideActionMenu();
        hideTacticalHUD();

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

                // Check portal (only after clearing enemies)
                if (portal && step.x === portal.x && step.y === portal.y) {
                    if (areEnemiesCleared()) {
                        showPortalCompletionPrompt();
                        return;
                    }
                    showNotification('Derrote todos os inimigos antes de usar o portal.', 'warning');
                }
            }

            // Mark unit as having moved this turn
            unit.hasMoved = true;

            // Free Control: permitir mover de novo (turno não avança, ações ilimitadas)
            if (gameState.debugFreeControl || gameState.debugControlEnemy) {
                unit.hasMoved = false;
            }

            // Limpar ação atual para permitir ataque/skill
            gameState.currentAction = null;
            attackRangeCells = [];
            skillRangeCells = [];
            skillAreaCells = [];

            // Clear movement grid
            reachableCells = [];
            attackableCells = [];

            // Mostrar HUD tática após mover
            showTacticalHUD(unit);

        } finally {
            gameState.isAnimating = false;
            // Resetar estado de animação para 'idle' após movimento completo
            const prevState = unit.animationState || 'walk';
            unit.animationState = 'idle';
            if (prevState !== 'idle') {
                startAnimationBlend(unit, prevState, 'idle', 160);
            }
            updateUI();
            saveCameraState(); // Auto-save after movement
            // persistMoveSession só para player principal (id === 'player'), não allies
            // Allies são salvos via persistSessionState
            if (sessionUid && unit.id === 'player') {
                persistMoveSession(startPos, { x: unit.x, y: unit.y });
            }
            if (sessionUid) await persistSessionState(true); // Imediato após movimento
            needsRender = true;
        }
    }

    async function persistMoveSession(from, to) {
        if (!sessionUid) return;
        if (!to || typeof to.x !== 'number' || typeof to.y !== 'number') return;
        if (to.x < 1 || to.x > CONFIG.GRID_COLS || to.y < 1 || to.y > CONFIG.GRID_ROWS) return;
        try {
            await fetch(`/game/explore/move?session=${encodeURIComponent(sessionUid)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: to.x, y: to.y, from })
            });
        } catch (error) {
            console.warn('[MapEngine] Falha ao salvar movimento:', error);
        }
    }

    async function moveUnitToFree(unit, targetX, targetY) {
        if (gameState.isAnimating) return;
        if (!unit || unit.type !== 'player') return;
        if (targetX < 1 || targetX > CONFIG.GRID_COLS || targetY < 1 || targetY > CONFIG.GRID_ROWS) return;
        if (isWall(targetX, targetY)) return;
        if (getUnitAt(targetX, targetY) && getUnitAt(targetX, targetY) !== unit) return;

        const path = findPath(unit, { x: targetX, y: targetY }, 999);
        if (path.length === 0) return;

        const startPos = { x: unit.x, y: unit.y };
        gameState.isAnimating = true;

        try {
            for (const step of path) {
                await animateMove(unit, step.x, step.y);
                unit.x = step.x;
                unit.y = step.y;

                const chest = chests.find(c => c.x === step.x && c.y === step.y && !c.opened);
                if (chest) {
                    chest.opened = true;
                    showNotification(`+${chest.loot.gold} Gold, ${chest.loot.item}!`, 'success');
                }

                if (portal && step.x === portal.x && step.y === portal.y) {
                    if (areEnemiesCleared()) {
                        showPortalCompletionPrompt();
                        return;
                    }
                    showNotification('Derrote todos os inimigos antes de usar o portal.', 'warning');
                }
            }
        } finally {
            gameState.isAnimating = false;
            // Resetar estado de animação para 'idle' após movimento completo
            const prevState = unit.animationState || 'walk';
            unit.animationState = 'idle';
            if (prevState !== 'idle') {
                startAnimationBlend(unit, prevState, 'idle', 160);
            }
            updateUI();
            saveCameraState();
            // persistMoveSession só para player principal (id === 'player'), não allies
            // Allies são salvos via persistSessionState
            if (sessionUid && unit.id === 'player') {
                persistMoveSession(startPos, { x: unit.x, y: unit.y });
            }
            // REMOVIDO: persistSessionState() - será chamado ao final do turno
            needsRender = true;
        }
    }

    function animateMove(entity, toX, toY, followCamera = false) {
        return new Promise(resolve => {
            // Definir estado de animação para 'walk' durante movimento
            const previousState = entity.animationState || 'idle';
            const wasAlreadyWalking = previousState === 'walk' && !entity.animationBlend;

            entity.animationState = 'walk';

            // Só fazer blend se estava em idle (não reiniciar blend durante caminhada contínua)
            if (!wasAlreadyWalking && previousState !== 'walk') {
                startAnimationBlend(entity, previousState, 'walk', 100); // Blend mais rápido
            }
            playStepSound(entity);

            // Atualizar direção baseada no movimento
            entity.facingRight = calculateFacingFromMovement(entity, toX, toY);

            const startX = (entity.x - 0.5) * CONFIG.CELL_SIZE;
            const startY = (entity.y - 0.5) * CONFIG.CELL_SIZE;
            const endX = (toX - 0.5) * CONFIG.CELL_SIZE;
            const endY = (toY - 0.5) * CONFIG.CELL_SIZE;
            const startTime = performance.now();
            const moveConfig = getMoveConfig(entity);
            const duration = moveConfig.duration || CONFIG.ANIMATION_SPEED;

            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const t = Math.min(elapsed / duration, 1);

                const eased = applyMoveEasing(t, moveConfig.easing);
                let bounceOffset = 0;
                if (t > 0.85 && moveConfig.bounce > 0) {
                    const local = (t - 0.85) / 0.15;
                    bounceOffset = Math.sin(local * Math.PI) * moveConfig.bounce;
                }

                entity.renderX = startX + (endX - startX) * eased;
                entity.renderY = startY + (endY - startY) * eased - bounceOffset;
                if (followCamera) {
                    const targetX = -entity.renderX * viewState.scale + canvas.width / 2;
                    const targetY = -entity.renderY * viewState.scale + canvas.height / 2;
                    cameraTarget = { x: targetX, y: targetY, scale: viewState.scale };
                    cameraFollowEase = moveConfig.cameraEase || null;
                }
                needsRender = true;

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    entity.renderX = null;
                    entity.renderY = null;
                    cameraFollowEase = null;
                    // Resetar estado para 'idle' após movimento (será definido nas funções de movimento)
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
    function animateLean(attacker, target, maxOffset = 8, duration = 180) {
        return new Promise(resolve => {
            if (!attacker || !target) return resolve();
            const ax = (attacker.x - 0.5) * CONFIG.CELL_SIZE;
            const ay = (attacker.y - 0.5) * CONFIG.CELL_SIZE;
            const tx = (target.x - 0.5) * CONFIG.CELL_SIZE;
            const ty = (target.y - 0.5) * CONFIG.CELL_SIZE;
            const dx = tx - ax;
            const dy = ty - ay;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;

            const startTime = performance.now();
            function step(now) {
                const t = Math.min((now - startTime) / duration, 1);
                const offset = Math.sin(t * Math.PI) * maxOffset;
                attacker.renderX = ax + nx * offset;
                attacker.renderY = ay + ny * offset;
                needsRender = true;
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    attacker.renderX = null;
                    attacker.renderY = null;
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    /**
     * Animação de knockback - unidade inclina para trás ao levar dano
     */
    async function animateKnockback(unit, direction, maxOffset = 8, duration = 150) {
        return new Promise(resolve => {
            if (!unit) return resolve();
            const ux = (unit.x - 0.5) * CONFIG.CELL_SIZE;
            const uy = (unit.y - 0.5) * CONFIG.CELL_SIZE;

            // Direção oposta (para trás)
            const nx = -direction.x;
            const ny = -direction.y;

            const startTime = performance.now();
            function step(now) {
                const t = Math.min((now - startTime) / duration, 1);
                // Easing: rápido no início, suave no final
                const eased = 1 - Math.pow(1 - t, 3);
                const offset = Math.sin(eased * Math.PI) * maxOffset;
                unit.renderOffsetX = nx * offset;
                unit.renderOffsetY = ny * offset;
                needsRender = true;
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    unit.renderOffsetX = 0;
                    unit.renderOffsetY = 0;
                    resolve();
                }
            }
            requestAnimationFrame(step);
        });
    }

    /**
     * Flash vermelho na unidade atingida
     */
    async function flashUnitRed(unit, duration = 500) {
        const flashCount = 3;
        const flashInterval = duration / flashCount;

        for (let i = 0; i < flashCount; i++) {
            unit.flashRed = true;
            needsRender = true;
            await sleep(flashInterval / 2);
            unit.flashRed = false;
            needsRender = true;
            await sleep(flashInterval / 2);
        }
    }

    // Contador global para sistema de cascata de dano
    let damageNumberIndex = 0;
    let lastDamageTime = 0;
    let lastDamageTarget = null; // Para resetar quando muda de alvo

    /**
     * Calcula a posição do topo do sprite (onde fica a barra de HP)
     */
    function getUnitTopPosition(unit) {
        const cellSize = CONFIG.CELL_SIZE || 64;
        const cx = (unit.x - 0.5) * cellSize;
        const cy = (unit.y - 0.5) * cellSize;

        // Buscar altura do sprite para calcular topo
        const entityId = getEntityIdForUnit(unit);
        const spriteAnimations = entityId ? spriteCache.get(entityId) : null;
        const spriteSheet = spriteAnimations ? spriteAnimations['idle'] : null;

        let topY = cy - 60; // Fallback

        if (spriteSheet && spriteSheet.loaded && spriteSheet.frameCount > 0) {
            let animConfig = unit.animations?.idle;
            const baseScale = animConfig?.animationScale ?? unit.animationScale ?? 2.0;
            const targetBaseWidth = cellSize * baseScale;
            const scale = targetBaseWidth / spriteSheet.baseWidth;
            const scaledHeight = spriteSheet.height * scale;

            const baseOffsetY = animConfig?.animationOffsetY ?? unit.animationOffsetY ?? 50;
            const baseSizeSprite = cellSize * 0.7;
            const baseHalfSprite = baseSizeSprite / 2;

            topY = cy - baseHalfSprite - scaledHeight + baseOffsetY;
        }

        return { x: cx, y: topY };
    }

    /**
     * Aplica efeito de impacto na unidade (shake + flash vermelho)
     */
    function applyHitEffect(unit, intensity = 1) {
        // Shake
        const shakeAmount = 8 * intensity;
        unit.renderOffsetX = (Math.random() - 0.5) * shakeAmount * 2;
        unit.renderOffsetY = (Math.random() - 0.5) * shakeAmount;

        // Flash vermelho
        unit.hitFlash = 1.0;

        // Restaurar posição gradualmente
        const shakeDuration = 150;
        const startTime = performance.now();

        function animateShake() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / shakeDuration, 1);

            // Decay do shake
            const decay = 1 - progress;
            unit.renderOffsetX = (Math.random() - 0.5) * shakeAmount * decay;
            unit.renderOffsetY = (Math.random() - 0.5) * shakeAmount * 0.5 * decay;
            unit.hitFlash = decay;

            needsRender = true;

            if (progress < 1) {
                requestAnimationFrame(animateShake);
            } else {
                unit.renderOffsetX = 0;
                unit.renderOffsetY = 0;
                unit.hitFlash = 0;
            }
        }

        requestAnimationFrame(animateShake);
    }

    /**
     * Floating damage number - Sistema de cascata premium
     * @param {Object} unit - Unidade que recebeu dano (para posição correta)
     * @param {number} damage - Quantidade de dano
     * @param {boolean} isCrit - Se é crítico
     * @param {number} hitIndex - Índice do hit (para cascata)
     */
    function showDamageNumber(x, y, damage, isCrit = false, offsetX = 0, offsetY = 0, unit = null, hitIndex = 0) {
        const cellSize = CONFIG.CELL_SIZE || 64;
        const now = performance.now();

        // Reset do índice se mudou de alvo ou passou tempo
        if (now - lastDamageTime > 600 || lastDamageTarget !== unit) {
            damageNumberIndex = 0;
        }
        lastDamageTime = now;
        lastDamageTarget = unit;

        // Usar hitIndex se fornecido (multi-hit skill), senão usar contador global
        const cascadeIndex = hitIndex > 0 ? hitIndex : damageNumberIndex++;

        // Posição base - usar topo do sprite se unidade fornecida
        let baseX, baseY;
        if (unit) {
            const topPos = getUnitTopPosition(unit);
            baseX = topPos.x;
            baseY = topPos.y + 50; // Perto da barra de HP
        } else {
            baseX = (x - 0.5) * cellSize;
            baseY = (y - 0.5) * cellSize - 30;
        }

        // Sem delay - aparece IMEDIATAMENTE junto com o efeito de impacto
        // Velocidade inicial estilo Ragnarok Premium
        // Trajetória elegante em arco para a esquerda-cima (sobe MAIS antes de cair)
        const angleVariation = (Math.random() - 0.5) * 0.3; // Pequena variação de ângulo
        const baseAngle = -2.2 + angleVariation; // ~126 graus (mais vertical para subir mais)
        const speed = 4.2 + Math.random() * 1.2; // Velocidade AUMENTADA para subir ~50px a mais

        const baseVelX = Math.cos(baseAngle) * speed;
        const baseVelY = Math.sin(baseAngle) * speed; // vy negativo = sobe

        floatingTexts.push({
            text: `-${damage}`,
            x: baseX + offsetX + (Math.random() - 0.5) * 8,
            y: baseY + offsetY,
            // Física premium (parábola elegante - sobe MAIS e cai DEVAGAR)
            vx: baseVelX,
            vy: baseVelY,
            gravity: 0.12, // Gravidade SUAVE para queda lenta e elegante
            friction: 0.99, // Friction leve no X
            life: 1.0,
            color: isCrit ? '#fbbf24' : '#fff',
            size: isCrit ? 46 : 34,
            baseSize: isCrit ? 46 : 34,
            isCrit: isCrit,
            isDamage: true,
            usePhysics: true,
            startTime: performance.now(),
            duration: 0.75, // Sumir ANTES de chegar no chão (mais curto)
            stroke: true,
            strokeColor: isCrit ? '#7f1d1d' : '#1e1e1e',
            glow: isCrit ? '#fbbf24' : null
        });
        needsRender = true;
    }

    /**
     * Mostra número de cura (verde)
     */
    function showHealNumber(x, y, amount, offsetX = 0, offsetY = 0) {
        const cellSize = CONFIG.CELL_SIZE || 64;
        const worldX = (x - 0.5) * cellSize + offsetX + (Math.random() - 0.5) * 8;
        const worldY = (y - 0.5) * cellSize + offsetY - 30;

        // Trajetória suave para CIMA (cura sobe, não cai)
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // ~90° para cima
        const speed = 2.5 + Math.random() * 1;

        floatingTexts.push({
            text: `+${amount}`,
            x: worldX,
            y: worldY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: -0.02, // Gravidade NEGATIVA - continua subindo suavemente
            friction: 0.97,
            life: 1.0,
            color: '#22c55e',
            size: 38,
            baseSize: 38,
            isHeal: true,
            usePhysics: true,
            startTime: performance.now(),
            duration: 0.8,
            stroke: true,
            strokeColor: '#064e3b',
            glow: '#22c55e'
        });
        needsRender = true;
    }

    /**
     * Mostra texto "PARRY" (defesa bem-sucedida por buffedParryChance)
     */
    function showParryText(unit) {
        if (!unit) return;
        const cellSize = CONFIG.CELL_SIZE || 64;
        const top = getUnitTopPosition(unit);
        const baseX = top.x + (Math.random() - 0.5) * 8;
        const baseY = top.y + 50;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        const speed = 2.5 + Math.random() * 1;
        floatingTexts.push({
            text: 'PARRY',
            x: baseX, y: baseY,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            gravity: -0.02, friction: 0.97, life: 1.0,
            color: '#60a5fa', size: 32, baseSize: 32,
            usePhysics: true, startTime: performance.now(), duration: 0.8,
            stroke: true, strokeColor: '#1e3a8a'
        });
        needsRender = true;
    }

    /**
     * Mostra número de mana (azul)
     */
    function showManaNumber(x, y, amount, offsetX = 0, offsetY = 0) {
        const cellSize = CONFIG.CELL_SIZE || 64;
        const worldX = (x - 0.5) * cellSize + offsetX + (Math.random() - 0.5) * 8;
        const worldY = (y - 0.5) * cellSize + offsetY - 30;

        // Trajetória suave para cima-direita (diferente de heal)
        const angle = -Math.PI / 2 + 0.3 + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 1;

        floatingTexts.push({
            text: `+${amount}`,
            x: worldX,
            y: worldY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: -0.015, // Gravidade negativa suave
            friction: 0.975,
            life: 1.0,
            color: '#3b82f6',
            size: 34,
            baseSize: 34,
            isMana: true,
            usePhysics: true,
            startTime: performance.now(),
            duration: 0.75,
            stroke: true,
            strokeColor: '#1e3a5f',
            glow: '#3b82f6'
        });
        needsRender = true;
    }

    /**
     * Mostrar indicador de combo para multi-hit
     */
    function showHitCombo(hitNumber) {
        if (hitNumber <= 1) return;

        // Remover combo anterior
        const oldCombo = document.querySelector('.hit-combo');
        if (oldCombo) oldCombo.remove();

        const combo = document.createElement('div');
        combo.className = 'hit-combo';
        combo.innerHTML = `
            <div class="hit-combo-number">${hitNumber}</div>
            <div class="hit-combo-label">HIT COMBO</div>
        `;

        // Adicionar ao body para garantir visibilidade
        document.body.appendChild(combo);

        // Remover após delay
        setTimeout(() => combo.remove(), 1500);
    }

    /**
     * Mostra banner de turno (player, enemy, battle_start)
     */
    async function showTurnBanner(phase) {
        const banner = document.getElementById('turn-banner');
        const bannerText = document.getElementById('banner-text');
        if (!banner || !bannerText) return;

        const isPlayer = phase === 'player';
        const isBattle = phase === 'battle_start';

        banner.className = `turn-banner active ${phase}`;

        if (isBattle) {
            bannerText.textContent = 'BATALHA INICIADA!';
        } else {
            bannerText.textContent = isPlayer ? 'SEU TURNO' : 'TURNO INIMIGO';
        }

        // Update marquee text for flavor
        const marquee = banner.querySelector('.banner-marquee-text');
        if (marquee) {
            const phrase = isBattle ? 'BATTLE BEGIN ' : (isPlayer ? 'HEROES ASCEND ' : 'ENEMIES ADVANCE ');
            marquee.textContent = phrase.repeat(10);
        }

        return new Promise(resolve => {
            setTimeout(() => {
                banner.classList.remove('active');
                resolve();
            }, 1500); // 1.5s banner duration
        });
    }

    async function triggerBattleEncounter(hero, enemy) {
        // Sistema tático: apenas marca batalha iniciada na primeira ação hostil
        if (gameState.battleStarted) return;

        gameState.battleStarted = true;
        // Zoom 4x (como 4 scrolls pra cima) na primeira vez que a batalha começa
        zoom(4 * CONFIG.ZOOM_STEP, canvas.width / 2, canvas.height / 2);

        // REMOVIDO: Banner de início de batalha (vai direto para ação)

        // Tocar música de batalha
        if (audioSettings.musicEnabled && !currentBattleMusic) {
            currentBattleMusic = playSfx('battle.mp3', 0.4, 1.0);
            if (currentBattleMusic) {
                currentBattleMusic.loop = true;
            }
        }

        // Continua fluxo normal - player pode atacar ou usar skill
    }

    /**
     * Executa um ataque tático entre unidades (REFATORADO COM EFEITOS APRIMORADOS)
     * @param {Object} attacker - Unidade atacante
     * @param {Object} target - Unidade alvo
     * @returns {Promise<boolean>} - true se o ataque foi bem-sucedido
     */
    async function executeAttack(attacker, target) {
        if (!attacker || !target || target.hp <= 0) return false;

        const dist = Math.max(Math.abs(attacker.x - target.x), Math.abs(attacker.y - target.y));
        const range = attacker.attackRange || 1;

        if (dist > range) {
            showNotification('Alvo fora de alcance!', 'warning');
            return false;
        }

        // Virar para o alvo
        attacker.facingRight = (target.x > attacker.x) || (target.x === attacker.x && (attacker.facingRight ?? false));

        // Marcar batalha iniciada na primeira ação hostil
        if (!gameState.battleStarted) {
            gameState.battleStarted = true;
            // Zoom 4x (como 4 scrolls pra cima) na primeira vez que a batalha começa
            zoom(4 * CONFIG.ZOOM_STEP, canvas.width / 2, canvas.height / 2);
            // Tocar música de batalha
            if (audioSettings.musicEnabled && !currentBattleMusic) {
                currentBattleMusic = playSfx('battle.mp3', 0.4, 1.0);
                if (currentBattleMusic) {
                    currentBattleMusic.loop = true;
                }
            }
        }

        gameState.isAnimating = true;

        // 1. ANIMAÇÃO DE ATAQUE
        const attackerEntityId = getEntityIdForUnit(attacker);
        const spriteAnimations = attackerEntityId ? spriteCache.get(attackerEntityId) : null;

        // Trigger attack animation if available
        if (spriteAnimations && spriteAnimations.atack && spriteAnimations.atack.loaded) {
            attacker.animationState = 'atack';
            attacker.animationStartTimeMs = animationTimeMs;
            attacker._animReverting = false;

            // Buscar FPS (usar o mesmo cálculo do render)
            let animFPS = 12;
            if (attacker.animations && attacker.animations.atack && attacker.animations.atack.animationFPS) {
                animFPS = attacker.animations.atack.animationFPS;
            } else if (attacker.animationFPS) {
                animFPS = attacker.animationFPS;
            }

            // Esperar o frame de impacto (aproximadamente 50% da animação)
            const attackDuration = (spriteAnimations.atack.frameCount * (1000 / animFPS));
            await sleep(attackDuration * 0.5);
        } else {
            await animateLean(attacker, target);
            await sleep(150); // Pequeno delay para antecipação
        }

        // Calcular direção do ataque para knockback
        const dirX = target.x - attacker.x;
        const dirY = target.y - attacker.y;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        const direction = { x: dirX / dirLength, y: dirY / dirLength };

        // 2. CÁLCULO DE DANO COM CRÍTICO
        const baseDamage = (range > 1 && (attacker.attackRanged != null && attacker.attackRanged > 0))
            ? (attacker.attackRanged || attacker.attack || 10)
            : (attacker.attack || 10);
        const defense = target.defense || 0;
        const variance = 0.8 + Math.random() * 0.4;
        const critChance = Math.min(95, Math.max(1, (attacker.stats?.crit ?? attacker.crit ?? 5) + (attacker.buffedCritBonus || 0)));
        const isCrit = Math.random() * 100 < critChance;
        let damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * variance));
        if (isCrit) damage = Math.floor(damage * 1.5);

        // Aplicar multiplicadores de dano de buffs/debuffs
        if (attacker.buffedDamageDealt) damage = Math.floor(damage * attacker.buffedDamageDealt);
        if (target.buffedDamageTaken) damage = Math.floor(damage * target.buffedDamageTaken);

        // Aplicar multiplicador de elemento
        const attackerElement = attacker.element || (window.TacticalDataLoader?.entityCache?.[attacker.combatKey || attacker.combat_key]?.element) || 'neutral';
        const targetElement = target.element || (window.TacticalDataLoader?.entityCache?.[target.combatKey || target.combat_key]?.element) || 'neutral';
        if (window.elementalData) {
            const elementMult = window.elementalData.getMultiplier(attackerElement, targetElement);
            damage = Math.floor(damage * elementMult);
            // Log de efetividade para debug
            if (elementMult !== 1.0) {
                const category = window.elementalData.getEffectivenessCategory(elementMult);
                console.log(`[MAP-ENGINE] ${attacker.name} (${attackerElement}) vs ${target.name} (${targetElement}): ${category} (${elementMult}x)`);
            }
        }

        // PARRY: ataques físicos (executeAttack é sempre físico). buffedParryChance vem de Parry Stance etc.
        const parryChance = target.buffedParryChance ?? 0;
        if (parryChance > 0 && Math.random() < parryChance) {
            const targetPxX = (target.x - 0.5) * CONFIG.CELL_SIZE;
            const targetPxY = (target.y - 0.5) * CONFIG.CELL_SIZE;
            if (window.MapSFX?.spawnParrySpark) window.MapSFX.spawnParrySpark(targetPxX, targetPxY, 1);
            playSfx('parry1.mp3', 0.5, 1.0);
            showParryText(target);
            addLogEntry('attack', `<span class="target">${target.name}</span> defendeu o ataque!`);
            await sleep(400);
            gameState.isAnimating = false;
            await finishUnitTurn(attacker);
            needsRender = true;
            return true;
        }

        target.hp = Math.max(0, target.hp - damage);

        // Atualizar HUD se o alvo for a unidade selecionada
        if (gameState.selectedUnit && (gameState.selectedUnit.id === target.id || gameState.selectedUnit === target)) {
            showTacticalHUD(target);
        }

        // 3. EFEITOS VISUAIS SIMULTÂNEOS
        const effectPromises = [
            flashUnitRed(target, 500), // Flash vermelho na unidade
            animateKnockback(target, direction, isCrit ? 10 : 8), // Knockback (inclina para trás)
        ];

        // Mostrar número de dano GRANDE + efeito de impacto no personagem
        showDamageNumber(target.x, target.y, damage, isCrit, 0, 0, target, 0);
        applyHitEffect(target, isCrit ? 1.5 : 1);

        // Efeitos visuais premium de impacto
        const targetPxX = (target.x - 0.5) * CONFIG.CELL_SIZE;
        const targetPxY = (target.y - 0.5) * CONFIG.CELL_SIZE;

        // Deriva tipo de atacante (entity_id/combatKey/class) para efeitos e sons
        const _aid = (attackerEntityId || attacker.entity_id || attacker.combatKey || attacker.combat_key || attacker.class || '').toLowerCase();
        const attackerSprite = _aid.includes('slime') ? 'slime' : _aid.includes('wolf') ? 'wolf' : _aid.includes('sword') || _aid === 'hero_swordman' ? 'swordman' : _aid.includes('archer') || _aid === 'hero_archer' ? 'archer' : _aid.includes('acolyte') || _aid === 'hero_acolyte' ? 'acolyte' : _aid.includes('mage') || _aid === 'hero_mage' ? 'mage' : null;

        // Determinar tipo de unidade atacante para efeito apropriado
        const isWarrior = attacker.class === 'warrior' || attacker.class === 'swordman' || attacker.class === 'swordsman' || attackerSprite === 'swordman';
        const isArcher = attacker.class === 'archer' || attackerSprite === 'archer';
        const isMage = attacker.class === 'mage' || attackerSprite === 'mage';
        const isAcolyte = attacker.class === 'acolyte' || attackerSprite === 'acolyte';

        if (isWarrior || (!isArcher && !isMage && !isAcolyte)) {
            // Slash effect para warriors/melee
            spawnSwordSlashEffect(targetPxX, targetPxY);
        } else if (isArcher) {
            // Efeito de impacto de flecha para archer (QuickShot impact)
            if (window.MapSFX?.archerQuickShotImpact) {
                window.MapSFX.archerQuickShotImpact(targetPxX, targetPxY);
            }
        } else if (isMage) {
            // Efeito mágico para magos
            spawnMagicEffect(targetPxX, targetPxY, '#a855f7');
        } else if (isAcolyte) {
            // Efeito santo para acolyte (staff/holy)
            spawnMagicEffect(targetPxX, targetPxY, '#fef3c7');
        }

        // Efeito de impacto universal premium
        spawnImpactBurst(targetPxX, targetPxY, isCrit ? '#fbbf24' : '#ef4444', isCrit ? 1.5 : 1);

        // Shake da câmera
        triggerScreenShake(isCrit ? 10 : 6);
        hitFlash = Math.max(hitFlash, isCrit ? 0.4 : 0.25);

        // Som: arma (entity ou mp3) + impacto GERAL (hit/impact) – ataque ou recebe ataque
        if (attackerSprite === 'swordman') {
            playSwordSfx(attackerEntityId, isCrit);
        } else if (attackerSprite === 'archer') {
            playBowSfx(attackerEntityId, isCrit);
        } else if (attackerSprite === 'wolf') {
            playClawSfx(attackerEntityId);
        } else if (attackerSprite === 'slime') {
            playSlimeSfx(attackerEntityId);
        } else if (attackerSprite === 'acolyte') {
            playStaffSfx(attackerEntityId, isCrit);
        } else {
            playHitImpactSfx(isCrit);
        }

        await Promise.all(effectPromises);

        // 4. DELAY PARA VER O DANO (MUITO IMPORTANTE!)
        await sleep(600); // Delay para jogador ver o dano

        // 5. Combat Log - registrar ataque
        const attackLogMsg = isCrit
            ? `<span class="attacker">${attacker.name}</span> acertou <span class="damage">CRÍTICO</span> em <span class="target">${target.name}</span> causando <span class="damage">${damage}</span> de dano!`
            : `<span class="attacker">${attacker.name}</span> atacou <span class="target">${target.name}</span> causando <span class="damage">${damage}</span> de dano.`;
        addLogEntry('attack', attackLogMsg);

        // 6. MORTE
        if (target.hp <= 0) {
            spawnDeathEffect((target.x - 0.5) * CONFIG.CELL_SIZE, (target.y - 0.5) * CONFIG.CELL_SIZE);

            // Show kill banner
            showKillBanner(target.name || 'Inimigo');

            await sleep(900);

            if (target.type === 'enemy') {
                enemyUnits = enemyUnits.filter(u => u.id !== target.id);
            } else {
                playerUnits = playerUnits.filter(u => u.id !== target.id);
            }

            // Update timeline
            updateTurnTimeline();
        }

        gameState.isAnimating = false;
        await finishUnitTurn(attacker);
        needsRender = true;

        return true;
    }

    /**
     * Executa um hit de skill com dano DEFERIDO até o "ponto forte" da animação (ex.: Holy Bolt 850ms, Supernova 700ms).
     * Spawna o efeito no início, aguarda effectImpactMs, depois aplica dano, números, hit effect e morte.
     */
    async function runDeferredSkillImpact(o) {
        const { caster, targetsToHit, skill, hit, numHits, dmgMult, baseDamage, critChance, isMagic, isPhysical, casterEntityId, effectImpactMs } = o;
        if (hit === 0) {
            const archerSkills = ['quick_shot', 'poison_arrow', 'focused_shot', 'piercing_arrow', 'multishot', 'tactical_retreat', 'rain_of_arrows', 'crippling_shot', 'deadly_aim'];
            const swordsmanSkills = ['quick_slash', 'shield_bash', 'berserk_mode', 'power_thrust', 'provoke', 'double_attack', 'sword_mastery', 'war_cry', 'bash', 'heavy_slash', 'champions_slash', 'relentless_strike', 'life_steal', 'crushing_blow', 'guarded_strike', 'cleave'];
            if (casterEntityId === 'wolf') playClawSfx(casterEntityId);
            else if (casterEntityId === 'toxic_slime') playSlimeSfx(casterEntityId);
            else if (archerSkills.includes(skill.id)) playBowSfx(casterEntityId, false);
            else if (swordsmanSkills.includes(skill.id) || isPhysical) playSwordSfx(casterEntityId, false);
            else if (isMagic) playMagicSfx(false);
        }
        if (numHits > 1) showHitCombo(hit + 1);
        const deferred = [];
        for (const t of targetsToHit) {
            if (!t || t.hp <= 0) continue;
            const variance = 0.9 + Math.random() * 0.2;
            const isCrit = Math.random() * 100 < critChance;
            const hitDmgMult = dmgMult / numHits;
            let damage = Math.max(1, Math.floor(baseDamage * hitDmgMult * variance * (isCrit ? 1.5 : 1)));
            if (isMagic) damage = Math.max(1, damage - Math.floor((t.mdef || 0) * 0.25));
            else damage = Math.max(1, damage - Math.floor((t.defense || 0) * 0.3));
            if (caster.buffedDamageDealt) damage = Math.floor(damage * caster.buffedDamageDealt);
            if (t.buffedDamageTaken) damage = Math.floor(damage * t.buffedDamageTaken);
            const attEl = (skill.element || caster.element || (window.TacticalDataLoader?.entityCache?.[caster.combatKey || caster.combat_key]?.element)) || 'neutral';
            const tgtEl = t.element || (window.TacticalDataLoader?.entityCache?.[t.combatKey || t.combat_key]?.element) || 'neutral';
            if (window.elementalData) { const elMult = window.elementalData.getMultiplier(attEl, tgtEl); damage = Math.floor(damage * elMult); if (hit === 0 && elMult !== 1.0) console.log(`[MAP-ENGINE] ${skill.name} (${attEl}) vs ${t.name} (${tgtEl}): ${window.elementalData.getEffectivenessCategory(elMult)} (${elMult}x)`); }
            const targetX = (t.x - 0.5) * CONFIG.CELL_SIZE, targetY = (t.y - 0.5) * CONFIG.CELL_SIZE;
            // PARRY: só ataques físicos (skills com effectImpactMs como holy_bolt/supernova são magia, mas ficam cobertas se alguma física tiver)
            if (isPhysical && (t.buffedParryChance || 0) > 0 && Math.random() < t.buffedParryChance) {
                if (window.MapSFX?.spawnParrySpark) window.MapSFX.spawnParrySpark(targetX, targetY, 1);
                playSfx('parry1.mp3', 0.5, 1.0);
                showParryText(t);
                addLogEntry('attack', `<span class="target">${t.name}</span> defendeu o ataque!`);
                continue;
            }
            let skillEffectHandled = false;
            if (window.MapSFX) {
                const sId = skill.id, dx = t.x - caster.x, dy = t.y - caster.y, angle = Math.atan2(dy, dx);
                if (sId === 'holy_bolt' && window.MapSFX.spawnDivineJudgment) { window.MapSFX.spawnDivineJudgment(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'supernova' && window.MapSFX.spawnSupernova) { window.MapSFX.spawnSupernova(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'quick_shot' && window.MapSFX.spawnImpactBurst) { window.MapSFX.spawnImpactBurst(targetX, targetY, '#fbbf24'); skillEffectHandled = true; }
                else if (sId === 'poison_arrow' && window.MapSFX.spawnPoisonCloud) { window.MapSFX.spawnPoisonCloud(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'piercing_arrow' && window.MapSFX.spawnLaserBeam) { window.MapSFX.spawnLaserBeam(targetX, targetY, 1, angle); skillEffectHandled = true; }
                else if (sId === 'multishot' && window.MapSFX.spawnSwordCombo) { window.MapSFX.spawnSwordCombo(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'rain_of_arrows' && window.MapSFX.spawnBloodSplash) { window.MapSFX.spawnBloodSplash(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'crippling_shot' && window.MapSFX.spawnLifeDrain) { window.MapSFX.spawnLifeDrain(targetX, targetY, 1); skillEffectHandled = true; }
                else if (sId === 'deadly_aim' && window.MapSFX.spawnNovaExplosion) { window.MapSFX.spawnNovaExplosion(targetX, targetY, 1); triggerScreenShake(15); skillEffectHandled = true; }
            }
            if (!skillEffectHandled) {
                if (isPhysical || ['bash', 'sword_mastery', 'heavy_slash'].includes(skill.id)) spawnSwordSlashEffect(targetX, targetY);
                else if (isMagic) { const c = { fire: '#ef4444', ice: '#60a5fa', lightning: '#fbbf24', holy: '#fef3c7', dark: '#6b21a8' }[skill.element] || '#a855f7'; spawnMagicEffect(targetX, targetY, c); }
                else spawnImpactBurst(targetX, targetY, '#ef4444', isCrit ? 1.5 : 1);
            }
            deferred.push({ t, damage, isCrit });
        }
        await sleep(effectImpactMs);
        playHitImpactSfx(deferred.some(d => d.isCrit));
        for (const { t, damage, isCrit } of deferred) {
            t.hp = Math.max(0, t.hp - damage);
            if (gameState.selectedUnit && (gameState.selectedUnit.id === t.id || gameState.selectedUnit === t)) showTacticalHUD(t);
            showDamageNumber(t.x, t.y, damage, isCrit, 0, 0, t, hit);
            applyHitEffect(t, isCrit ? 1.3 : 0.8);
            const targetX = (t.x - 0.5) * CONFIG.CELL_SIZE, targetY = (t.y - 0.5) * CONFIG.CELL_SIZE;
            if (dmgMult > 1.2 || isCrit || numHits > 1) triggerScreenShake(isCrit ? 12 : (numHits > 1 ? 6 : 8));
            if (t.hp <= 0) { spawnDeathEffect(targetX, targetY); showKillBanner(t.name); if (t.type === 'enemy') enemyUnits = enemyUnits.filter(u => u.id !== t.id); else playerUnits = playerUnits.filter(u => u.id !== t.id); }
        }
        if (deferred.some(({ t }) => t.hp <= 0)) await sleep(900);
        if (typeof updateTurnTimeline === 'function') updateTurnTimeline();
    }

    /**
     * Executa uma skill tática
     * @param {Object} caster - Unidade que usa a skill
     * @param {Object} target - Unidade alvo (pode ser null para skills AoE)
     * @param {Object} skill - Objeto da skill
     * @returns {Promise<boolean>} - true se a skill foi usada com sucesso
     */
    async function executeSkill(caster, target, skill, targets = []) {
        if (!caster || !skill) return false;

        // Verificar MP
        const cost = skill.mana || skill.cost || 0;
        if (caster.sp < cost) {
            showNotification('MP insuficiente!', 'warning');
            return false;
        }

        // Marcar batalha iniciada na primeira ação hostil
        if (!gameState.battleStarted && skill.type !== 'heal') {
            gameState.battleStarted = true;
            // Zoom 4x (como 4 scrolls pra cima) na primeira vez que a batalha começa
            zoom(4 * CONFIG.ZOOM_STEP, canvas.width / 2, canvas.height / 2);
            // Tocar música de batalha
            if (audioSettings.musicEnabled && !currentBattleMusic) {
                currentBattleMusic = playSfx('battle.mp3', 0.4, 1.0);
                if (currentBattleMusic) {
                    currentBattleMusic.loop = true;
                }
            }
        }

        gameState.isAnimating = true;
        let skillAnyKill = false;

        // Virar para o alvo quando houver um (ataque, heal em aliado, etc.)
        if (target && target.x != null) {
            caster.facingRight = (target.x > caster.x) || (target.x === caster.x && (caster.facingRight ?? false));
        }

        // Consumir MP
        caster.sp = Math.max(0, caster.sp - cost);

        // Atualizar HUD se o caster for a unidade selecionada
        if (gameState.selectedUnit && (gameState.selectedUnit.id === caster.id || gameState.selectedUnit === caster)) {
            showTacticalHUD(caster);
        }

        const targetsToHit = (targets && targets.length > 0)
            ? targets
            : (target ? [target] : []);

        const casterEntityId = getEntityIdForUnit(caster);
        // Determinar tipo de efeito visual baseado na skill
        const isMagic = skill.damageType === 'magic' || (skill.element && ['fire', 'ice', 'lightning', 'holy', 'dark'].includes(skill.element));
        const isPhysical = skill.damageType === 'physical' || caster.class === 'warrior' || caster.class === 'swordman';
        const isArcher = caster.class === 'archer' || (casterEntityId || '').toLowerCase().includes('archer');
        const isHeal = skill.type === 'heal' || skill.type === 'aoe_heal';
        const isBuff = skill.type === 'self' || skill.type === 'ally' || skill.type === 'buff';

        // Determinar tipo de skill para cor do banner
        const skillType = isHeal ? 'heal' : isBuff ? 'buff' : isMagic ? 'magic' : 'physical';

        // BANNER + EFEITO DE SKILL (icone: skill.img ou /public/assets/icons/skills/{id}.webp, senao Lucide)
        // Ultimate: showUltimateCutIn (linhas vermelhas no fundo, vignette, flash, banner ULTIMATE)
        // Demais: showSkillBanner (banner simples)
        const skillImg = skill.img || (skill.id ? `/public/assets/icons/skills/${skill.id}.webp` : null);
        if (skill.ultimate) {
            await showUltimateCutIn(skill.name, skill.icon || 'zap', skillImg);
        } else {
            await showSkillBanner(skill.name, skill.icon || 'zap', skillType, skillImg);
        }

        // Trigger attack animation for caster (igual ao executeAttack)
        const casterSpriteAnims = casterEntityId ? spriteCache.get(casterEntityId) : null;

        // Lobos: uivo (howling_wolf) no início de toda skill (lunar_rampage, pack_howl, savage_bite, etc.)
        if (casterEntityId === 'wolf') {
            playSfxEntity('wolf', 'howling_wolf.mp3', 0.55, 1.0);
        }
        // Acolyte: som de preparo de skill (acolyte_skill_prepare)
        if (casterEntityId === 'acolyte') {
            const aco = pickRandom(['acolyte_skill_prepare.mp3', 'acolyte_skill_prepare2.mp3', 'acolyte_skill_prepare3.mp3', 'acolyte_skill_prepare4.mp3']);
            playSfxEntity('acolyte', aco, 0.5, 1.0);
        }

        // Posição do caster em pixels
        const casterPxX = (caster.x - 0.5) * CONFIG.CELL_SIZE;
        const casterPxY = (caster.y - 0.5) * CONFIG.CELL_SIZE;

        // Som de voz para skills especiais (ultimates)
        if (skill.ultimate) {
            playSkillVoice(skill.id);
        }

        // SKILL CAST EFFECTS - Dispara efeito de cast baseado no skill.id (independente da classe)
        if (window.MapSFX) {
            const sId = skill.id;
            if (sId === 'quick_shot' && window.MapSFX.archerQuickShotCast) {
                window.MapSFX.archerQuickShotCast(casterPxX, casterPxY);
            } else if (sId === 'poison_arrow' && window.MapSFX.archerPoisonArrowCast) {
                window.MapSFX.archerPoisonArrowCast(casterPxX, casterPxY);
            } else if (sId === 'focused_shot' && window.MapSFX.archerFocusedShotCast) {
                window.MapSFX.archerFocusedShotCast(casterPxX, casterPxY);
            } else if (sId === 'piercing_arrow' && window.MapSFX.archerPiercingArrowCast) {
                window.MapSFX.archerPiercingArrowCast(casterPxX, casterPxY);
            } else if (sId === 'multishot' && window.MapSFX.archerMultishotCast) {
                window.MapSFX.archerMultishotCast(casterPxX, casterPxY);
            } else if (sId === 'hunters_focus' && window.MapSFX.archerHuntersFocusCast) {
                window.MapSFX.archerHuntersFocusCast(casterPxX, casterPxY);
            } else if (sId === 'tactical_retreat' && window.MapSFX.archerTacticalRetreatCast) {
                window.MapSFX.archerTacticalRetreatCast(casterPxX, casterPxY);
            } else if (sId === 'rain_of_arrows' && window.MapSFX.archerRainOfArrowsCast) {
                window.MapSFX.archerRainOfArrowsCast(casterPxX, casterPxY);
            } else if (sId === 'crippling_shot' && window.MapSFX.archerCripplingShotCast) {
                window.MapSFX.archerCripplingShotCast(casterPxX, casterPxY);
            } else if (sId === 'deadly_aim' && window.MapSFX.archerDeadlyAimCast) {
                window.MapSFX.archerDeadlyAimCast(casterPxX, casterPxY);
            }
        }

        // Acolyte: efeito de magia no caster ao soltar skill (heal, bless, holy_bolt, etc.)
        if (casterEntityId === 'acolyte') {
            spawnMagicEffect(casterPxX, casterPxY, '#fef3c7');
        }

        if (casterSpriteAnims && casterSpriteAnims.atack && casterSpriteAnims.atack.loaded) {
            caster.animationState = 'atack';
            caster.animationStartTimeMs = animationTimeMs;
            caster._animReverting = false;

            // Buscar FPS
            let animFPS = 12;
            if (caster.animations && caster.animations.atack && caster.animations.atack.animationFPS) {
                animFPS = caster.animations.atack.animationFPS;
            } else if (caster.animationFPS) {
                animFPS = caster.animationFPS;
            }

            // Esperar frame de impacto (50% da animação)
            const attackDuration = (casterSpriteAnims.atack.frameCount * (1000 / animFPS));
            await sleep(attackDuration * 0.4);
        } else {
            // Fallback: animação de inclinação
            if (targetsToHit.length > 0) {
                await animateLean(caster, targetsToHit[0]);
            }
        }

        // Número de hits (algumas skills tem múltiplos hits)
        const numHits = skill.hits || 1;
        const hitDelay = 200; // ms entre cada hit

        // Atraso (ms) até o "ponto forte" da animação (explosão/impacto). Dano e números aplicados nesse momento.
        // skill.effectImpactMs na sheet sobrescreve. Ex.: Holy Bolt=850 (Divine Judgment explode), Supernova=700.
        const SKILL_EFFECT_IMPACT_MS = { holy_bolt: 850, supernova: 700 };

        // Aplicar efeito baseado no tipo
        if (['damage', 'attack', 'single', 'aoe', 'pierce', 'line', 'target'].includes(skill.type)) {
            // Intimidating Roar: aplicar debuff em todos os inimigos na área
            if (skill.id === 'intimidating_roar') {
                const area = calculateSkillArea(skill, caster.x, caster.y, caster.x, caster.y);
                const enemiesInArea = enemyUnits.filter(e =>
                    e.hp > 0 && area.some(cell => cell.x === e.x && cell.y === e.y)
                );

                for (const enemy of enemiesInArea) {
                    if (skill.debuff && window.TacticalSkillEngine) {
                        window.TacticalSkillEngine.applyDebuff(enemy, skill.debuff, caster, skill.id);
                        console.log(`[MAP-ENGINE] Debuff aplicado: ${skill.name} em ${enemy.name}`, skill.debuff);
                        playDebuffApplySfx();
                        const enemyX = (enemy.x - 0.5) * CONFIG.CELL_SIZE;
                        const enemyY = (enemy.y - 0.5) * CONFIG.CELL_SIZE;
                        showFloatingText('Intimidated!', enemyX, enemyY, '#ef4444');
                        spawnMagicEffect(enemyX, enemyY, '#ef4444');
                    }
                }
                gameState.isAnimating = false;
                await finishUnitTurn(caster);
                needsRender = true;
                return true;
            }
            // Tactical Retreat: troca de posição com o inimigo (sem dano)
            if (skill.id === 'tactical_retreat' && targetsToHit.length > 0) {
                const swapTarget = targetsToHit[0];
                if (swapTarget && swapTarget.type === 'enemy') {
                    const cx = caster.x, cy = caster.y;
                    caster.x = swapTarget.x;
                    caster.y = swapTarget.y;
                    swapTarget.x = cx;
                    swapTarget.y = cy;
                    const casterPxX = (caster.x - 0.5) * CONFIG.CELL_SIZE;
                    const casterPxY = (caster.y - 0.5) * CONFIG.CELL_SIZE;
                    const targetPxX = (swapTarget.x - 0.5) * CONFIG.CELL_SIZE;
                    const targetPxY = (swapTarget.y - 0.5) * CONFIG.CELL_SIZE;
                    if (window.MapSFX && window.MapSFX.spawnTimeWarp) {
                        window.MapSFX.spawnTimeWarp(casterPxX, casterPxY, 1);
                        window.MapSFX.spawnTimeWarp(targetPxX, targetPxY, 1);
                    }
                    gameState.isAnimating = false;
                    await finishUnitTurn(caster);
                    needsRender = true;
                    return true;
                }
            }
            if (targetsToHit.length === 0) {
                gameState.isAnimating = false;
                return false;
            }

            // baseDamage: magia -> MATK (INT); arqueiro físico -> attackRanged (DEX); melee -> attack (STR)
            let baseDamage;
            if (isMagic) {
                baseDamage = caster.matk || caster.attack || 10;
            } else if (isArcher) {
                baseDamage = (caster.attackRanged != null && caster.attackRanged > 0) ? caster.attackRanged : (caster.attack || 10);
            } else {
                baseDamage = caster.attack || 10;
            }
            const dmgMult = typeof skill.dmgMult === 'number' ? skill.dmgMult : (typeof skill.dmg_mult === 'number' ? skill.dmg_mult : 1.0);
            const critChance = Math.min(95, Math.max(1, (caster.stats?.crit ?? caster.crit ?? 5) + (caster.buffedCritBonus || 0)));

            // Loop de hits
            for (let hit = 0; hit < numHits; hit++) {
                if (hit > 0) await sleep(hitDelay);

                const effectImpactMs = SKILL_EFFECT_IMPACT_MS[skill.id] ?? skill.effectImpactMs ?? 0;

                if (effectImpactMs > 0) {
                    await runDeferredSkillImpact({ caster, targetsToHit, skill, hit, numHits, dmgMult, baseDamage, critChance, isMagic, isPhysical, casterEntityId, effectImpactMs });
                } else {
                    // Impacto GERAL em todo hit; no 1º hit também arma por entidade do caster
                    playHitImpactSfx(false);
                    if (hit === 0) {
                        const archerSkills = ['quick_shot', 'poison_arrow', 'focused_shot', 'piercing_arrow',
                            'multishot', 'tactical_retreat', 'rain_of_arrows', 'crippling_shot', 'deadly_aim'];
                        const swordsmanSkills = ['quick_slash', 'shield_bash', 'berserk_mode', 'power_thrust',
                            'provoke', 'double_attack', 'sword_mastery', 'war_cry', 'bash', 'heavy_slash',
                            'champions_slash', 'relentless_strike', 'life_steal', 'crushing_blow', 'guarded_strike', 'cleave'];

                        if (casterEntityId === 'wolf') {
                            playClawSfx(casterEntityId);
                        } else if (casterEntityId === 'toxic_slime') {
                            playSlimeSfx(casterEntityId);
                        } else if (archerSkills.includes(skill.id)) {
                            playBowSfx(casterEntityId, false);
                        } else if (swordsmanSkills.includes(skill.id) || isPhysical) {
                            playSwordSfx(casterEntityId, false);
                        } else if (isMagic) {
                            playMagicSfx(false);
                        }
                    }

                    // Mostrar combo indicator para multi-hit
                    if (numHits > 1) {
                        showHitCombo(hit + 1);
                    }

                    for (const t of targetsToHit) {
                        if (!t || t.hp <= 0) continue;

                        const variance = 0.9 + Math.random() * 0.2;
                        const isCrit = Math.random() * 100 < critChance;
                        // Dano dividido pelos hits para balanceamento
                        const hitDmgMult = dmgMult / numHits;
                        let damage = Math.max(1, Math.floor(baseDamage * hitDmgMult * variance * (isCrit ? 1.5 : 1)));

                        // Redução por DEF (físico) ou MDEF (magia) do alvo
                        if (isMagic) {
                            damage = Math.max(1, damage - Math.floor((t.mdef || 0) * 0.25));
                        } else {
                            damage = Math.max(1, damage - Math.floor((t.defense || 0) * 0.3));
                        }

                        // Aplicar multiplicadores de dano de buffs/debuffs
                        if (caster.buffedDamageDealt) damage = Math.floor(damage * caster.buffedDamageDealt);
                        if (t.buffedDamageTaken) damage = Math.floor(damage * t.buffedDamageTaken);

                        // Aplicar multiplicador de elemento (skill element ou caster element)
                        const skillElement = skill.element || null;
                        const attackerElement = skillElement || caster.element || (window.TacticalDataLoader?.entityCache?.[caster.combatKey || caster.combat_key]?.element) || 'neutral';
                        const targetElement = t.element || (window.TacticalDataLoader?.entityCache?.[t.combatKey || t.combat_key]?.element) || 'neutral';
                        if (window.elementalData) {
                            const elementMult = window.elementalData.getMultiplier(attackerElement, targetElement);
                            damage = Math.floor(damage * elementMult);
                            // Log de efetividade para debug (apenas primeiro hit para evitar spam)
                            if (hit === 0 && elementMult !== 1.0) {
                                const category = window.elementalData.getEffectivenessCategory(elementMult);
                                console.log(`[MAP-ENGINE] ${skill.name} (${attackerElement}) vs ${t.name} (${targetElement}): ${category} (${elementMult}x)`);
                            }
                        }

                        // PARRY: só ataques físicos; buffedParryChance (ex.: Parry Stance)
                        if (isPhysical && (t.buffedParryChance || 0) > 0 && Math.random() < t.buffedParryChance) {
                            const targetX = (t.x - 0.5) * CONFIG.CELL_SIZE, targetY = (t.y - 0.5) * CONFIG.CELL_SIZE;
                            if (window.MapSFX?.spawnParrySpark) window.MapSFX.spawnParrySpark(targetX, targetY, 1);
                            playSfx('parry1.mp3', 0.5, 1.0);
                            showParryText(t);
                            addLogEntry('attack', `<span class="target">${t.name}</span> defendeu o ataque!`);
                            continue;
                        }

                        t.hp = Math.max(0, t.hp - damage);

                        // Atualizar HUD se o alvo for a unidade selecionada
                        if (gameState.selectedUnit && (gameState.selectedUnit.id === t.id || gameState.selectedUnit === t)) {
                            showTacticalHUD(t);
                        }

                        // Número de dano com sistema de cascata
                        showDamageNumber(t.x, t.y, damage, isCrit, 0, 0, t, hit);

                        // Efeito de impacto no personagem (shake + flash)
                        applyHitEffect(t, isCrit ? 1.3 : 0.8);

                        const targetX = (t.x - 0.5) * CONFIG.CELL_SIZE;
                        const targetY = (t.y - 0.5) * CONFIG.CELL_SIZE;

                        // SKILL IMPACT EFFECTS - Efeitos específicos por skill.id com cálculo de ângulo
                        let skillEffectHandled = false;
                        if (window.MapSFX) {
                            const sId = skill.id;
                            // Calcular ângulo do caster para o target
                            const dx = t.x - caster.x;
                            const dy = t.y - caster.y;
                            const angle = Math.atan2(dy, dx); // Ângulo em radianos

                            if (sId === 'quick_shot' && window.MapSFX.spawnImpactBurst) {
                                window.MapSFX.spawnImpactBurst(targetX, targetY, '#fbbf24');
                                skillEffectHandled = true;
                            } else if (sId === 'poison_arrow' && window.MapSFX.spawnPoisonCloud) {
                                window.MapSFX.spawnPoisonCloud(targetX, targetY, 1);
                                skillEffectHandled = true;
                            } else if (sId === 'piercing_arrow' && window.MapSFX.spawnLaserBeam) {
                                window.MapSFX.spawnLaserBeam(targetX, targetY, 1, angle);
                                skillEffectHandled = true;
                            } else if (sId === 'multishot' && window.MapSFX.spawnSwordCombo) {
                                window.MapSFX.spawnSwordCombo(targetX, targetY, 1);
                                skillEffectHandled = true;
                            } else if (sId === 'rain_of_arrows' && window.MapSFX.spawnBloodSplash) {
                                window.MapSFX.spawnBloodSplash(targetX, targetY, 1);
                                skillEffectHandled = true;
                            } else if (sId === 'crippling_shot' && window.MapSFX.spawnLifeDrain) {
                                window.MapSFX.spawnLifeDrain(targetX, targetY, 1);
                                skillEffectHandled = true;
                            } else if (sId === 'deadly_aim' && window.MapSFX.spawnNovaExplosion) {
                                window.MapSFX.spawnNovaExplosion(targetX, targetY, 1);
                                triggerScreenShake(15);
                                skillEffectHandled = true;
                            } else if (sId === 'holy_bolt' && window.MapSFX.spawnDivineJudgment) {
                                window.MapSFX.spawnDivineJudgment(targetX, targetY, 1);
                                skillEffectHandled = true;
                            }
                        }

                        // Efeitos visuais fallback se skill não teve efeito específico
                        if (!skillEffectHandled) {
                            if (isPhysical || skill.id === 'bash' || skill.id === 'sword_mastery' || skill.id === 'heavy_slash') {
                                spawnSwordSlashEffect(targetX, targetY);
                            } else if (isMagic) {
                                const magicColor = skill.element === 'fire' ? '#ef4444' :
                                    skill.element === 'ice' ? '#60a5fa' :
                                        skill.element === 'lightning' ? '#fbbf24' :
                                            skill.element === 'holy' ? '#fef3c7' :
                                                skill.element === 'dark' ? '#6b21a8' : '#a855f7';
                                spawnMagicEffect(targetX, targetY, magicColor);
                            } else {
                                spawnImpactBurst(targetX, targetY, '#ef4444', isCrit ? 1.5 : 1);
                            }
                        }

                        // Efeito visual de tremor para skills fortes
                        if (dmgMult > 1.2 || isCrit || numHits > 1) {
                            triggerScreenShake(isCrit ? 12 : (numHits > 1 ? 6 : 8));
                        }

                        if (t.hp <= 0) {
                            spawnDeathEffect(targetX, targetY);
                            showKillBanner(t.name);
                            skillAnyKill = true;
                            if (t.type === 'enemy') {
                                enemyUnits = enemyUnits.filter(u => u.id !== t.id);
                            } else {
                                playerUnits = playerUnits.filter(u => u.id !== t.id);
                            }
                        }
                    }
                }
            }
        } else if (skill.type === 'heal' || skill.type === 'aoe_heal') {
            // Wild Instinct: aplicar buff em todos os aliados (não é heal)
            if (skill.id === 'wild_instinct' && skill.buff && window.TacticalSkillEngine) {
                const allAllies = playerUnits.filter(u => u.hp > 0);
                for (const ally of allAllies) {
                    window.TacticalSkillEngine.applyBuff(ally, skill.buff, caster, skill.id);
                    console.log(`[MAP-ENGINE] Buff aplicado: ${skill.name} em ${ally.name}`, skill.buff);
                    playBuffApplySfx();
                    const allyX = (ally.x - 0.5) * CONFIG.CELL_SIZE;
                    const allyY = (ally.y - 0.5) * CONFIG.CELL_SIZE;
                    showFloatingText(skill.name, allyX, allyY, '#a855f7');
                    spawnMagicEffect(allyX, allyY, '#fbbf24');
                }
                if (typeof updateTurnTimeline === 'function') {
                    updateTurnTimeline();
                }
            } else {
                // Cura normal
                for (const t of targetsToHit) {
                    if (!t || t.hp <= 0) continue;
                    let healing = 0;
                    if (skill.healPct != null) {
                        healing += Math.floor((t.maxHp || 0) * skill.healPct);
                    } else {
                        healing += Math.floor(skill.power || 30);
                    }
                    // Cura escala com MATK do curador (MATK vem de INT) — estilo Ragnarok
                    healing += Math.floor((caster.matk || 0) * (skill.healMatk ?? 0.5));
                    healing = Math.max(1, healing);
                    t.hp = Math.min(t.maxHp, t.hp + healing);
                    showHealNumber(t.x, t.y, healing);
                    spawnHealEffect((t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE);
                }
            }
        } else if (skill.type === 'self' || skill.type === 'ally' || skill.type === 'buff') {
            // Efeitos de Buff/Debuff com visual premium
            for (const t of targetsToHit) {
                if (!t || t.hp <= 0) continue;

                // Aplicar buff se a skill tiver propriedade buff
                if (skill.buff && window.TacticalSkillEngine) {
                    window.TacticalSkillEngine.applyBuff(t, skill.buff, caster, skill.id);
                    console.log(`[MAP-ENGINE] Buff aplicado: ${skill.name} em ${t.name}`, skill.buff);
                    playBuffApplySfx();

                    // Pack Leader: aplicar automaticamente em todos os summons quando o Beast Tamer usa
                    if (skill.id === 'pack_leader' && skill.buff) {
                        playerUnits.forEach(unit => {
                            if (unit.id !== t.id &&
                                unit.combatKey &&
                                (unit.combatKey === 'wolf' || unit.combatKey === 'hawk' || unit.id.startsWith('summon_'))) {
                                const hasPackLeader = unit.activeBuffs?.find(b => b.data?.id === 'pack_leader');
                                if (!hasPackLeader) {
                                    window.TacticalSkillEngine.applyBuff(unit, skill.buff, caster, skill.id);
                                }
                            }
                        });
                    }

                    // Efeito visual especial para berserk_mode
                    if (skill.id === 'berserk_mode' && window.MapSFX && window.MapSFX.spawnBerserkAura) {
                        const targetX = (t.x - 0.5) * CONFIG.CELL_SIZE;
                        const targetY = (t.y - 0.5) * CONFIG.CELL_SIZE;
                        window.MapSFX.spawnBerserkAura(targetX, targetY, 1);
                    }

                    if (skill.id === 'berserk_mode') playSfx('swordman_skill_start1.mp3', 0.6, 1.0);
                }

                if (skill.debuff && window.TacticalSkillEngine) {
                    window.TacticalSkillEngine.applyDebuff(t, skill.debuff, caster, skill.id);
                    console.log(`[MAP-ENGINE] Debuff aplicado: ${skill.name} em ${t.name}`, skill.debuff);
                    playDebuffApplySfx();
                }

                showFloatingText(skill.name, (t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#a855f7');
                const tx = (t.x - 0.5) * CONFIG.CELL_SIZE, ty = (t.y - 0.5) * CONFIG.CELL_SIZE;
                if (skill.id === 'focused_shot' && window.MapSFX && window.MapSFX.spawnPhoenixRise) {
                    window.MapSFX.spawnPhoenixRise(tx, ty, 1);
                } else {
                    spawnMagicEffect(tx, ty, '#fbbf24');
                }

                if (skill.effect && skill.effect.id === 'stun') {
                    if (Math.random() < (skill.effect.chance || 0)) {
                        t.isStunned = true;
                        t.stunDuration = skill.effect.duration || 1;
                        showFloatingText('STUN!', (t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#eab308');
                        playDebuffApplySfx();
                    }
                }

                // Atualizar HUD se o alvo for a unidade selecionada
                if (gameState.selectedUnit && (gameState.selectedUnit.id === t.id || gameState.selectedUnit === t)) {
                    showTacticalHUD(t);
                }
            }

            // Atualizar timeline para mostrar buffs/debuffs aplicados
            if (typeof updateTurnTimeline === 'function') {
                updateTurnTimeline();
            }
        } else if (skill.type === 'summon') {
            // Summon: criar unidade aliada
            const summonEntityId = skill.summonEntity || 'wolf';

            // Encontrar posição livre para spawnar o summon
            // Prioridade: abaixo (y+1), depois espiral ao redor do caster
            let spawnX = caster.x;
            let spawnY = caster.y;

            // Ordenar direções: priorizar abaixo (y+1), depois lados, depois diagonais
            const prioritizedDirections = [
                { x: 0, y: 1 },   // Abaixo (prioridade máxima)
                { x: 1, y: 1 },   // Diagonal inferior direita
                { x: -1, y: 1 },  // Diagonal inferior esquerda
                { x: 1, y: 0 },   // Direita
                { x: -1, y: 0 },  // Esquerda
                { x: 0, y: -1 },  // Acima
                { x: 1, y: -1 },  // Diagonal superior direita
                { x: -1, y: -1 }, // Diagonal superior esquerda
            ];

            // Busca em espiral: primeiro adjacente, depois raio 2, raio 3...
            let found = false;
            const maxRadius = 5; // Limite para não gastar muita memória

            for (let radius = 1; radius <= maxRadius && !found; radius++) {
                if (radius === 1) {
                    // Raio 1: usar direções priorizadas
                    for (const dir of prioritizedDirections) {
                        const testX = caster.x + dir.x;
                        const testY = caster.y + dir.y;
                        if (isValidCell(testX, testY) && !isWall(testX, testY) && !getUnitAt(testX, testY)) {
                            spawnX = testX;
                            spawnY = testY;
                            found = true;
                            break;
                        }
                    }
                } else {
                    // Raio 2+: buscar todas as células nesse raio, priorizando y maior (abaixo)
                    const candidates = [];
                    for (let dx = -radius; dx <= radius; dx++) {
                        for (let dy = -radius; dy <= radius; dy++) {
                            // Só células no perímetro do raio
                            if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                                candidates.push({ x: caster.x + dx, y: caster.y + dy, dy });
                            }
                        }
                    }
                    // Ordenar por dy decrescente (abaixo primeiro)
                    candidates.sort((a, b) => b.dy - a.dy);

                    for (const c of candidates) {
                        if (isValidCell(c.x, c.y) && !isWall(c.x, c.y) && !getUnitAt(c.x, c.y)) {
                            spawnX = c.x;
                            spawnY = c.y;
                            found = true;
                            break;
                        }
                    }
                }
            }

            if (!found) {
                showNotification('Não há espaço para invocar!', 'warning');
                gameState.isAnimating = false;
                return false;
            }

            // Carregar definição da entidade do summon
            let entityDef = null;
            if (window.TacticalDataLoader) {
                try {
                    entityDef = await window.TacticalDataLoader.getEntity(summonEntityId);
                } catch (error) {
                    console.warn('[MAP-ENGINE] Failed to load summon entity:', error);
                }
            }

            if (!entityDef) {
                showNotification('Entidade de summon não encontrada: ' + summonEntityId, 'error');
                gameState.isAnimating = false;
                return false;
            }

            // === EFEITOS NO CASTER (Beast Tamer) ===
            const casterPxX = (caster.x - 0.5) * CONFIG.CELL_SIZE;
            const casterPxY = (caster.y - 0.5) * CONFIG.CELL_SIZE;

            // Som de invocação - uivo de lobo temático para Beast Tamer
            playSfx('howling_wolf.mp3', 0.6, 1.0);

            // Efeito fx-penta no caster
            if (window.MapSFX && window.MapSFX.spawnPenta) {
                window.MapSFX.spawnPenta(casterPxX, casterPxY, 1);
            } else {
                spawnMagicEffect(casterPxX, casterPxY, '#fbbf24');
            }

            // Criar unidade do summon com stats da entity sheet
            const summonId = `summon_${summonEntityId}_${Date.now()}`;

            // Level do summon = level do invocador (Beast Tamer)
            const summonLevel = caster.level || 1;

            console.log(`[SUMMON] Creating ${entityDef.name} at level ${summonLevel}`);

            const summonUnit = {
                id: summonId,
                name: entityDef.name || entityDef.display_name || 'Summon',
                type: 'player', // Summons são aliados controláveis
                element: entityDef.element || 'neutral',
                x: spawnX,
                y: spawnY,
                level: summonLevel,
                baseLevel: entityDef.base_level || entityDef.baseLevel || 1,
                // Atributos base da entity sheet
                attributes: entityDef.attributes ? { ...entityDef.attributes } : { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                baseAttributes: entityDef.attributes ? { ...entityDef.attributes } : { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 },
                // Valores temporários - serão recalculados pelo TacticalSkillEngine
                hp: 1,
                maxHp: entityDef.maxHp || 50,
                sp: entityDef.maxSp || 30,
                maxSp: entityDef.maxSp || 30,
                mana: entityDef.maxSp || 30,
                maxMana: entityDef.maxSp || 30,
                attack: entityDef.attack || 8,
                defense: entityDef.defense || 3,
                // Stats de movimento da entity
                moveRange: entityDef.moveRange || 3,
                attackRange: entityDef.attackRange || 1,
                // Visual
                avatar: entityDef.images ? '/public/' + (entityDef.images.default || Object.values(entityDef.images || {})[0] || 'assets/img/characters/swordman.webp') : '/public/assets/img/characters/swordman.webp',
                class: entityDef.class || entityDef.id || summonEntityId,
                scale: entityDef.scale || 1.0,
                combatKey: summonEntityId,
                entity_id: entityDef.id || summonEntityId,
                animationState: 'idle',
                hasMoved: false,
                facingRight: caster.facingRight ?? false,
                activeBuffs: [],
                activeDebuffs: [],
                statusEffects: [],
                // Marcar como summon
                isSummon: true,
                summonedBy: caster.id,
            };

            // Usar o sistema automático de cálculo de stats por level
            if (window.TacticalSkillEngine && window.TacticalSkillEngine.recalculateStats) {
                window.TacticalSkillEngine.recalculateStats(summonUnit);
                console.log(`[SUMMON] Stats recalculated - HP: ${summonUnit.maxHp}, ATK: ${summonUnit.attack}, DEF: ${summonUnit.defense}`);
            }

            // Setar HP e SP ao máximo após recalcular
            summonUnit.hp = summonUnit.maxHp;
            summonUnit.sp = summonUnit.maxSp;
            summonUnit.mana = summonUnit.maxMana;

            // Carregar animações
            if (entityDef.animations) {
                summonUnit.animations = {};
                for (const k of ['idle', 'walk', 'atack']) {
                    if (entityDef.animations[k]) {
                        summonUnit.animations[k] = { ...entityDef.animations[k] };
                    }
                }
            }
            summonUnit.forceAnimation = entityDef.forceAnimation ?? 'idle';

            // Adicionar ao array de playerUnits
            playerUnits.push(summonUnit);

            // === EFEITOS NO SUMMON (monstro que nasce) ===
            const spawnPxX = (spawnX - 0.5) * CONFIG.CELL_SIZE;
            const spawnPxY = (spawnY - 0.5) * CONFIG.CELL_SIZE;

            // Efeito fx-impact no summon
            if (window.MapSFX && window.MapSFX.spawnImpact) {
                window.MapSFX.spawnImpact(spawnPxX, spawnPxY, 1);
            } else if (window.MapSFX && window.MapSFX.spawnImpactBurst) {
                window.MapSFX.spawnImpactBurst(spawnPxX, spawnPxY, '#10b981');
            } else {
                spawnMagicEffect(spawnPxX, spawnPxY, '#10b981');
            }

            showFloatingText(`${entityDef.name || 'Summon'} Invocado!`, spawnPxX, spawnPxY, '#10b981');
            showNotification(`${entityDef.name || 'Summon'} foi invocado!`, 'success');

            // Aplicar Pack Leader buff se o caster tiver (aplica em todos os summons)
            if (window.TacticalSkillEngine) {
                // Verificar se o caster tem Pack Leader ativo
                const packLeaderBuff = caster.activeBuffs?.find(b => b.data?.id === 'pack_leader');
                if (packLeaderBuff && packLeaderBuff.data) {
                    // Aplicar no novo summon
                    window.TacticalSkillEngine.applyBuff(summonUnit, packLeaderBuff.data, caster, 'pack_leader');

                    // Aplicar em todos os outros summons existentes que não têm o buff
                    playerUnits.forEach(unit => {
                        if (unit.id !== summonUnit.id &&
                            unit.id !== caster.id &&
                            unit.combatKey &&
                            (unit.combatKey === 'wolf' || unit.combatKey === 'hawk' || unit.id.startsWith('summon_'))) {
                            const hasPackLeader = unit.activeBuffs?.find(b => b.data?.id === 'pack_leader');
                            if (!hasPackLeader) {
                                window.TacticalSkillEngine.applyBuff(unit, packLeaderBuff.data, caster, 'pack_leader');
                            }
                        }
                    });
                }
            }

            // Carregar sprites do summon
            if (window.TacticalDataLoader && summonEntityId) {
                try {
                    await window.TacticalDataLoader.loadEntities([summonEntityId]);
                    await loadSpriteAnimations(summonEntityId);
                } catch (error) {
                    console.warn('[MAP-ENGINE] Failed to load summon sprites:', error);
                }
            }

            // Atualizar UI
            updateUI();
            needsRender = true;
        }

        if (skillAnyKill) await sleep(900);
        gameState.isAnimating = false;
        await finishUnitTurn(caster);
        needsRender = true;

        return true;
    }

    // Função buildCombatEntityFromMap mantida para possível uso futuro
    function buildCombatEntityFromMap(mapUnit, combatKey, isPlayer) {
        // Try to use cached entity from TacticalDataLoader first
        let def = null;
        if (window.TacticalDataLoader && window.TacticalDataLoader.entityCache) {
            def = window.TacticalDataLoader.entityCache[combatKey];
        }

        // Legacy fallback removed - combatData no longer exists

        if (!def) return null;
        const base = JSON.parse(JSON.stringify(def));

        // Extract skill IDs from entity
        let skillIds = [];
        if (Array.isArray(base.skills)) {
            if (base.skills.length > 0 && typeof base.skills[0] === 'object') {
                // If skills is array of skill objects (PHP format)
                skillIds = base.skills.map(s => s.id || s);
            } else {
                // If skills is array of IDs (legacy format)
                skillIds = base.skills;
            }
        }

        // Load skills from cache or fallback
        const skills = skillIds.map(sid => {
            // Try cached skills first
            let skillDef = null;
            if (window.TacticalDataLoader && window.TacticalDataLoader.skillCache) {
                skillDef = window.TacticalDataLoader.skillCache[sid];
            }

            // Fallback to combatData or skillsData
            if (!skillDef) {
                skillDef = window.skillsData?.[sid]; // combatData removed
            }

            return skillDef ? { ...skillDef, id: sid } : null;
        }).filter(Boolean);

        const entity = {
            ...base,
            id: mapUnit.id,
            mapId: mapUnit.id,
            isPlayer,
            name: mapUnit.name || base.name,
            level: base.baseLevel || 1,
            attributes: base.attributes || {},
            skills,
            activeBuffs: [],
            activeDebuffs: [],
            statusEffects: [],
            hp: typeof mapUnit.hp === 'number' ? mapUnit.hp : base.maxHp,
            mana: typeof mapUnit.sp === 'number' ? mapUnit.sp : (base.maxMana || base.maxMp || base.maxSp)
        };

        if (window.SkillEngine) {
            SkillEngine.recalculateStats(entity);
        }
        if (typeof mapUnit.hp === 'number') {
            entity.hp = Math.min(entity.maxHp, mapUnit.hp);
        }
        if (typeof mapUnit.sp === 'number') {
            entity.mana = Math.min(entity.maxMana || 0, mapUnit.sp);
        }
        return entity;
    }

    // Funções syncMapUnitsFromCombat e endMapCombat removidas (sistema mapCombat descontinuado)
    // Funções createBattleSession e showBattleConfirmation removidas (sistema antigo de cartas removido)

    /**
     * Reset game to initial state
     */
    function resetGame() {
        if (!confirm('Tem certeza que deseja reiniciar? Todo progresso será perdido!')) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const sessionUid = urlParams.get('session');

        if (!sessionUid) {
            location.reload();
            return;
        }

        // Limpar câmera salva desta sessão (reset manual)
        try {
            localStorage.removeItem(`rpg:camera:${sessionUid}`);
        } catch (err) {
            console.warn('[CameraStorage] Falha ao limpar câmera:', err);
        }

        fetch(`/game/explore/reset?session=${encodeURIComponent(sessionUid)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        window.location.reload();
                    }
                } else {
                    alert('Erro ao reiniciar: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(err => {
                console.error('Erro ao reiniciar sessão:', err);
                alert('Erro ao reiniciar sessão. Tente novamente.');
            });
    }



    /**
 * Handle battle result when returning from combat
 * SIMPLIFIED: No camera movement during death effects to prevent camera bugs
 */
    async function handleBattleResult(result) {
        console.log('[DEBUG][handleBattleResult] START - result:', {
            outcome: result.outcome,
            defeatedEnemyCount: result.defeatedEnemyMapIds?.length || 0,
            defeatedHeroCount: result.defeatedHeroMapIds?.length || 0,
            initiatorId: result.initiatorId
        });

        // CRITICAL: Lock camera position - DO NOT CHANGE during this function
        const lockedCamera = { x: viewState.x, y: viewState.y, scale: viewState.scale };
        console.log('[DEBUG][handleBattleResult] Locking camera at:', lockedCamera);

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

        // 2. Collect casualties (don't process yet)
        const casualties = [
            ...(result.defeatedEnemyMapIds || []).map(id => ({ id, type: 'enemy' })),
            ...(result.defeatedHeroMapIds || []).map(id => ({ id, type: 'hero' }))
        ];
        console.log('[DEBUG][handleBattleResult] Casualties to process:', casualties.length);

        // 3. If there are casualties, mark them and process after map stabilizes
        if (casualties.length > 0) {
            // Mark all casualties as "pending death" (0 HP visual)
            casualties.forEach(casualty => {
                const list = casualty.type === 'enemy' ? enemyUnits : playerUnits;
                const unit = list.find(u => u.id === casualty.id);
                if (unit) {
                    unit.pendingDeath = true; // Visual indicator
                    unit.hp = 0;
                }
            });
            needsRender = true;

            // Wait for map to fully stabilize (canvas, camera, render cycle)
            console.log('[DEBUG][handleBattleResult] Waiting for map to stabilize...');
            await new Promise(r => setTimeout(r, 500));

            // Ensure camera is still locked
            viewState.x = lockedCamera.x;
            viewState.y = lockedCamera.y;
            viewState.scale = lockedCamera.scale;
            cameraTarget = null;

            // 4. Run ALL death effects simultaneously (no camera movement)
            console.log('[DEBUG][handleBattleResult] Running death effects...');
            for (const casualty of casualties) {
                const list = casualty.type === 'enemy' ? enemyUnits : playerUnits;
                const idx = list.findIndex(u => u.id === casualty.id);
                if (idx !== -1) {
                    const unit = list[idx];

                    // Spawn death effect at unit position
                    spawnDeathEffect((unit.x - 0.5) * CONFIG.CELL_SIZE, (unit.y - 0.5) * CONFIG.CELL_SIZE);
                    showFloatingText('DERROTADO', (unit.x - 0.5) * CONFIG.CELL_SIZE, (unit.y - 0.5) * CONFIG.CELL_SIZE - 20, '#ef4444');

                    // Remove unit from list
                    list.splice(idx, 1);
                }
            }
            needsRender = true;

            // Wait for death effects to complete visually
            await new Promise(r => setTimeout(r, 600));

            // Final camera lock enforcement
            viewState.x = lockedCamera.x;
            viewState.y = lockedCamera.y;
            viewState.scale = lockedCamera.scale;
            cameraTarget = null;
        }

        // 5. Final feedback
        if (result.outcome === 'victory') {
            showNotification('Vitória! Área limpa.', 'success');
            updateFreeExploreState();
        } else if (result.outcome === 'defeat') {
            if (playerUnits.filter(u => u.hp > 0).length === 0) {
                setTimeout(() => triggerGameOver(), 500);
            } else {
                showNotification('Retirada estratégica...', 'error');
            }
        } else {
            // Flee/retreat/ongoing: back to player control
            gameState.phase = 'player';
            gameState.unitsActedThisTurn.clear();
            gameState.selectedUnit = null;
            gameState.currentAction = null;
            clearHighlights();
            updateUI();
            const footer = document.querySelector('.premium-footer');
            if (footer) {
                footer.style.opacity = '1';
                footer.style.pointerEvents = 'auto';
            }
            showTurnBanner('player');
        }

        // Mark ALL battle participants as having acted (not just initiator)
        if (result.heroMapIds && result.heroMapIds.length > 0) {
            result.heroMapIds.forEach(heroId => {
                gameState.unitsActedThisTurn.add(heroId);
            });
            console.log('[DEBUG][handleBattleResult] Marked as acted:', result.heroMapIds);
        } else if (result.initiatorId) {
            // Fallback to just initiator if no heroMapIds
            gameState.unitsActedThisTurn.add(result.initiatorId);
            console.log('[DEBUG][handleBattleResult] Marked initiator as acted:', result.initiatorId);
        }

        // CRITICAL: Ensure controls are enabled
        gameState.isAnimating = false;
        console.log('[DEBUG][handleBattleResult] END - isAnimating:', gameState.isAnimating);
        console.log('[DEBUG][handleBattleResult] END - unitsActedThisTurn:', Array.from(gameState.unitsActedThisTurn));

        // Auto-end turn if all units acted
        const allActed = playerUnits.every(u => u.hp <= 0 || gameState.unitsActedThisTurn.has(u.id));
        console.log('[DEBUG][handleBattleResult] All acted check:', allActed, 'playerUnits:', playerUnits.map(u => u.id));
        if (allActed && gameState.phase === 'player') {
            console.log('[DEBUG][handleBattleResult] Auto-ending turn...');
            endPlayerTurn();
        } else if (gameState.phase === 'player') {
            // UX: Próxima unidade por ASPD/AGI
            const nextUnit = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
            if (nextUnit && !gameState.selectedUnit) {
                await sleep(1000); // pausa para ver resultado antes da câmera ir pro próximo
                selectUnit(nextUnit);
                animateCameraToUnit(nextUnit);
            }
        }


        needsRender = true;
        updateUI();
        saveCameraState(); // Auto-save after movement
        persistSessionState();
    }

    function updateFreeExploreState() {
        const aliveEnemies = enemyUnits.filter(u => u.hp > 0);
        gameState.freeExplore = aliveEnemies.length === 0;
        if (gameState.freeExplore) {
            gameState.phase = 'free';
            gameState.selectedUnit = null;
            gameState.currentAction = null;
            clearHighlights();
            hideActionMenu();
        }

        const footer = document.querySelector('.premium-footer');
        if (footer) {
            if (gameState.freeExplore) {
                footer.style.opacity = '0';
                footer.style.pointerEvents = 'none';
            } else if (gameState.phase === 'player') {
                footer.style.opacity = '1';
                footer.style.pointerEvents = 'auto';
            }
        }
    }

    function hideExploreFooter() {
        const footer = document.querySelector('.premium-footer');
        if (footer) {
            footer.style.opacity = '0';
            footer.style.pointerEvents = 'none';
        }
    }

    // Debounce para persistSessionState - evita múltiplas chamadas
    let persistTimeout = null;
    let isPersisting = false;

    function persistSessionState(immediate = false) {
        if (!sessionUid) return Promise.resolve();

        // Se já está persistindo e não é imediato, agendar para depois
        if (isPersisting && !immediate) {
            if (persistTimeout) clearTimeout(persistTimeout);
            persistTimeout = setTimeout(() => persistSessionState(true), 100);
            return Promise.resolve();
        }

        // Limpar timeout anterior se existir
        if (persistTimeout) {
            clearTimeout(persistTimeout);
            persistTimeout = null;
        }

        isPersisting = true;

        const alive = playerUnits.filter(u => u.hp > 0);
        // Identificar player principal pelo id, não pela posição no array
        const p0 = alive.find(u => u.id === 'player') || alive[0];
        const allies = alive.filter(u => u.id !== 'player');
        const payload = {
            state: {
                player: p0 ? {
                    id: 'player',
                    entity_id: p0.entity_id,
                    x: p0.x,
                    y: p0.y,
                    hp: p0.hp,
                    sp: p0.sp,
                    hasMoved: !!p0.hasMoved,
                    facingRight: !!p0.facingRight
                } : null,
                allies: allies.map(a => ({
                    id: a.id,
                    entity_id: a.entity_id,
                    x: a.x,
                    y: a.y,
                    hp: a.hp,
                    sp: a.sp,
                    hasMoved: !!a.hasMoved,
                    facingRight: !!a.facingRight,
                    activeBuffs: a.activeBuffs || [],
                    activeDebuffs: a.activeDebuffs || [],
                    statusEffects: a.statusEffects || []
                })),
                enemies: enemyUnits.map(e => ({
                    id: e.id,
                    entity_id: e.entity_id,
                    x: e.x,
                    y: e.y,
                    hp: e.hp,
                    hasMoved: !!e.hasMoved,
                    facingRight: !!e.facingRight
                })),
                chests: chests.map(c => ({ id: c.id, x: c.x, y: c.y, opened: c.opened, loot: c.loot })),
                portal: portal ? { id: portal.id, x: portal.x, y: portal.y, name: portal.name } : null,
                turn: gameState.turn,
                phase: gameState.phase,
                unitsActed: Array.from(gameState.unitsActedThisTurn || [])
            }
        };
        console.log('[DEBUG][persistSessionState] Enviando state:', {
            turn: payload.state.turn,
            phase: payload.state.phase,
            unitsActed: payload.state.unitsActed
        });

        return fetch(`/game/explore/state?session=${encodeURIComponent(sessionUid)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(() => {
            isPersisting = false;
        }).catch(() => {
            isPersisting = false;
        });
    }

    function areEnemiesCleared() {
        return enemyUnits.filter(u => u.hp > 0).length === 0;
    }

    async function completeQuestAtPortal() {
        if (!sessionUid) {
            triggerVictory();
            return;
        }
        try {
            const player = playerUnits[0] || null;
            const response = await fetch(`/game/explore/complete?session=${encodeURIComponent(sessionUid)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player: player ? { x: player.x, y: player.y } : null,
                    portal: portal ? { x: portal.x, y: portal.y } : null
                })
            });
            const data = await response.json();
            if (data?.success && data.redirect) {
                window.location.href = data.redirect;
                return;
            }
        } catch (error) {
            console.warn('[MapEngine] Falha ao completar quest:', error);
        }
        triggerVictory();
    }

    function showPortalCompletionPrompt() {
        if (portalPromptShown) return;
        portalPromptShown = true;

        showModal({
            title: '✨ Missão concluída',
            content: 'Você alcançou o portal e eliminou todos os inimigos. Deseja concluir a missão agora?',
            buttons: [
                {
                    text: 'Ficar no mapa',
                    class: '',
                    action: () => {
                        portalPromptShown = false;
                    }
                },
                {
                    text: 'Concluir missão',
                    primary: true,
                    action: async () => {
                        portalPromptShown = false;
                        await completeQuestAtPortal();
                    }
                }
            ]
        });
    }



    /**
     * Simple camera animation – foco rápido no personagem
     */
    function animateCameraToUnit(unit) {
        return new Promise(resolve => {
            const targetX = -(unit.x - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.width / 2;
            const targetY = -(unit.y - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.height / 2;

            cameraTarget = { x: targetX, y: targetY, scale: viewState.scale };
            cameraFollowEase = 0.2; // transição mais suave (era 0.3)

            // Tempo para a câmera assentar (era 280ms; aumentado para transição menos abrupta)
            setTimeout(resolve, 420);
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
                return path.reverse();
            }

            openList.splice(lowInd, 1);
            closedList.push(current);

            const neighbors = getNeighbors(current.x, current.y);
            for (const n of neighbors) {
                if (isWall(n.x, n.y)) continue;
                if (isOccupied(n.x, n.y) && !(n.x === end.x && n.y === end.y)) continue;
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

    /**
     * Toggle parede de debug na posição especificada
     */
    function toggleDebugWall(x, y) {
        // Verificar se a parede existe no array original WALLS
        const isInOriginalWalls = WALLS.some(w => w.x === x && w.y === y);

        if (isInOriginalWalls) {
            // Se está em WALLS, toggle na lista de removidas
            const removedIndex = debugWallsRemoved.findIndex(w => w.x === x && w.y === y);
            if (removedIndex >= 0) {
                // Re-adicionar (remover da lista de removidas)
                debugWallsRemoved.splice(removedIndex, 1);
                console.log(`[DEBUG] Parede restaurada: x=${x}, y=${y}`);
            } else {
                // Remover (adicionar à lista de removidas)
                debugWallsRemoved.push({ x, y });
                console.log(`[DEBUG] Parede removida (era fixa): x=${x}, y=${y}`);
            }
        } else {
            // Se não está em WALLS, toggle na lista de adicionadas
            const addedIndex = debugWallsAdded.findIndex(w => w.x === x && w.y === y);
            if (addedIndex >= 0) {
                // Remover parede adicionada
                debugWallsAdded.splice(addedIndex, 1);
                console.log(`[DEBUG] Parede removida (era nova): x=${x}, y=${y}`);
            } else {
                // Adicionar nova parede
                debugWallsAdded.push({ x, y });
                console.log(`[DEBUG] Parede adicionada: x=${x}, y=${y}`);
            }
        }

        // Atualizar contador no painel
        const wallsCountDisplay = document.getElementById('debug-walls-total');
        if (wallsCountDisplay) {
            const totalWalls = (WALLS.length - debugWallsRemoved.length) + debugWallsAdded.length;
            wallsCountDisplay.textContent = `${totalWalls} (${debugWallsAdded.length} novas, ${debugWallsRemoved.length} removidas)`;
        }

        needsRender = true;
    }

    function isWall(x, y) {
        // Parede existe se:
        // 1. Está em WALLS E não está na lista de removidas, OU
        // 2. Está na lista de adicionadas
        const isOriginalWall = WALLS.some(w => w.x === x && w.y === y);
        const isRemoved = debugWallsRemoved.some(w => w.x === x && w.y === y);
        const isAdded = debugWallsAdded.some(w => w.x === x && w.y === y);

        return (isOriginalWall && !isRemoved) || isAdded;
    }

    function isOccupied(x, y) {
        return [...playerUnits, ...enemyUnits].some(u => u.hp > 0 && u.x === x && u.y === y);
    }

    function findBestEnemyApproachCell(enemy, target) {
        const range = enemy.attackRange || 1;
        const candidates = [];
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) > range) continue;
                const px = target.x + dx;
                const py = target.y + dy;
                if (px < 1 || px > CONFIG.GRID_COLS || py < 1 || py > CONFIG.GRID_ROWS) continue;
                if (isWall(px, py)) continue;
                if (getUnitAt(px, py) && getUnitAt(px, py) !== enemy) continue;
                candidates.push({ x: px, y: py });
            }
        }
        if (candidates.length === 0) return null;

        let best = null;
        let bestLen = Infinity;
        candidates.forEach(cell => {
            const path = findPath(enemy, cell, enemy.moveRange);
            const len = path.length || Infinity;
            if (len < bestLen) {
                bestLen = len;
                best = cell;
            }
        });
        return best;
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
                    const moveRange = unit.moveRange || 4;
                    const attackRange = unit.attackRange || 1;
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
                                <div class="status-ranges" style="display: flex; gap: 0.75rem; margin-top: 0.4rem; font-size: 0.65rem; color: #94a3b8;">
                                    <span title="Movimento">🚶 ${moveRange}</span>
                                    <span title="Alcance de Ataque">🎯 ${attackRange}</span>
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

        // Update turn order timeline
        updateTurnTimeline();

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
            if (miniAvatar) {
                const want = String(u.avatar || '');
                if (miniAvatar.dataset.avatarUrl !== want) {
                    miniAvatar.src = want || '';
                    miniAvatar.dataset.avatarUrl = want;
                }
            }

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
            if (miniAvatar && miniAvatar.dataset.avatarUrl !== '') {
                miniAvatar.src = '';
                miniAvatar.dataset.avatarUrl = '';
            }
        }
    }

    function showActionMenu(unit) {
        // Menu antigo desativado (HUD tática substitui)
        return;
    }

    function getUnitAtRange(unit, range, type) {
        return [...playerUnits, ...enemyUnits].find(u =>
            u.hp > 0 &&
            u.type === type &&
            Math.max(Math.abs(u.x - unit.x), Math.abs(u.y - unit.y)) <= range
        );
    }

    async function finishUnitTurn(unit) {
        if (!unit) return;
        if (gameState.debugFreeControl || gameState.debugControlEnemy) {
            unit.hasMoved = false;
            deselectUnit(true);
            selectUnit(unit);
            needsRender = true;
            return;
        }
        gameState.unitsActedThisTurn.add(unit.id);
        await persistSessionState(true); // Imediato após unidade agir

        const allActed = playerUnits.every(u => u.hp <= 0 || gameState.unitsActedThisTurn.has(u.id));
        const hasNext = !allActed && playerUnits.some(u => u.hp > 0 && !gameState.unitsActedThisTurn.has(u.id));

        // Pausa para o jogador ver dano/número e morte antes da câmera ir pro próximo
        if (hasNext) {
            await sleep(1100);
        } else if (allActed) {
            await sleep(700);
        }

        // Clear visuals and check for end of complete phase
        deselectUnit(true);

        if (allActed) {
            endPlayerTurn();
        } else {
            // UX: Próxima unidade por ASPD/AGI (mais rápido age primeiro)
            const nextUnit = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
            if (nextUnit) {
                selectUnit(nextUnit);
                animateCameraToUnit(nextUnit);
            }
        }

        needsRender = true;
    }

    /**
     * Função REMOVIDA: showAttackPreview (sistema antigo)
     * Agora usamos executeAttack diretamente
     */

    /**
     * Função REMOVIDA: showAttackConfirmDialog (sistema antigo)
     */

    /**
     * Função REMOVIDA: hideAttackConfirmPopup (sistema antigo)
     */

    function hideActionMenu() {
        document.getElementById('action-menu')?.classList.remove('visible');
        // Também fechar menu de skills se aberto
        hideSkillMenu();
    }

    // =====================================================
    // TACTICAL HUD (FFT Style)
    // =====================================================

    /**
     * Mostra a HUD tática ao selecionar unidade do jogador
     */
    function showTacticalHUD(unit) {
        const hud = document.getElementById('tactical-hud');
        if (!hud || !unit) return;

        // Habilitar/desabilitar bot�es baseado no estado
        const hasActed = (gameState.debugFreeControl || gameState.debugControlEnemy) ? false : gameState.unitsActedThisTurn.has(unit.id);
        const skills = getUnitSkills(unit);

        const moveBtn = document.getElementById('tactical-move');
        const attackBtn = document.getElementById('tactical-attack');
        const skillsBtn = document.getElementById('tactical-skills');
        const endTurnBtn = document.getElementById('tactical-endturn');

        if (moveBtn) {
            moveBtn.disabled = !!unit.hasMoved;
            moveBtn.classList.toggle('active', gameState.currentAction === 'move');
        }
        if (attackBtn) {
            attackBtn.disabled = hasActed;
            attackBtn.classList.toggle('active', gameState.currentAction === 'attack');
        }
        if (skillsBtn) {
            skillsBtn.disabled = hasActed || skills.length === 0;
            skillsBtn.classList.toggle('active', gameState.currentAction === 'skill');
        }
        if (endTurnBtn) {
            endTurnBtn.disabled = false;
            const labelSpan = endTurnBtn.querySelectorAll('span')[1];
            if (labelSpan) labelSpan.textContent = (gameState.debugFreeControl || gameState.debugControlEnemy) ? 'Sair CL' : 'Pass';
            // Restaurar ícone se estava com spinner
            const btnIcon = endTurnBtn.querySelector('.btn-icon');
            if (btnIcon && btnIcon.querySelector('.spinner')) {
                btnIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="forward" class="lucide lucide-forward"><path d="m15 17 5-5-5-5"></path><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>';
            }
        }

        // Mostrar nome do aliado no topo da HUD (se for aliado)
        const isAlly = unit.id !== 'player' && (unit.type === 'player' || unit.type === 'ally');
        const hudInner = document.querySelector('.tactical-hud-inner');
        let allyNameEl = document.getElementById('tactical-ally-name');
        if (isAlly && hudInner) {
            if (!allyNameEl) {
                allyNameEl = document.createElement('div');
                allyNameEl.id = 'tactical-ally-name';
                allyNameEl.style.cssText = 'position: absolute; top: -35px; left: 50%; transform: translateX(-50%); color: #fbbf24; font-size: 14px; font-weight: 600; text-shadow: 0 0 10px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0,0,0,0.5); cursor: pointer; pointer-events: auto; white-space: nowrap; letter-spacing: 0.5px; transition: all 0.2s;';
                allyNameEl.addEventListener('mouseenter', () => {
                    allyNameEl.style.color = '#fcd34d';
                    allyNameEl.style.textShadow = '0 0 15px rgba(252, 211, 77, 1), 0 2px 4px rgba(0,0,0,0.5)';
                });
                allyNameEl.addEventListener('mouseleave', () => {
                    allyNameEl.style.color = '#fbbf24';
                    allyNameEl.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0,0,0,0.5)';
                });
                allyNameEl.addEventListener('click', () => {
                    if (unit) {
                        animateCameraToUnit(unit);
                    }
                });
                hudInner.style.position = 'relative';
                hudInner.appendChild(allyNameEl);
            }
            allyNameEl.textContent = unit.name || 'Ally';
            allyNameEl.style.display = 'block';
        } else if (allyNameEl) {
            allyNameEl.style.display = 'none';
        }

        // Renderizar painel de buffs/debuffs
        renderBuffsPanel(unit);

        // IMPORTANTE: Remover 'hidden' e adicionar 'visible'
        hud.classList.remove('hidden');
        hud.classList.add('visible');
    }

    /**
     * Renderiza o painel de buffs/debuffs na HUD tática
     */
    function renderBuffsPanel(unit) {
        if (!unit || !window.TacticalSkillEngine) return;

        // Encontrar ou criar container de buffs
        let buffsPanel = document.getElementById('hud-buffs-panel');
        if (!buffsPanel) {
            // Tentar encontrar unit-info-compact primeiro
            let unitInfo = document.querySelector('.unit-info-compact');
            if (!unitInfo) {
                // Criar unit-info-compact se não existir
                const hudInner = document.querySelector('.tactical-hud-inner');
                if (!hudInner) return;

                unitInfo = document.createElement('div');
                unitInfo.className = 'unit-info-compact';
                hudInner.insertBefore(unitInfo, hudInner.firstChild);
            }

            buffsPanel = document.createElement('div');
            buffsPanel.id = 'hud-buffs-panel';
            buffsPanel.className = 'hud-buffs-panel';
            unitInfo.appendChild(buffsPanel);
        }

        const activeEffects = window.TacticalSkillEngine.getActiveBuffsForDisplay(unit);

        if (activeEffects.length === 0) {
            buffsPanel.style.display = 'none';
            return;
        }

        buffsPanel.style.display = 'block';

        // HUD Active Effects Panel Title
        let title = buffsPanel.querySelector('.hud-buffs-panel-title');
        if (!title) {
            title = document.createElement('div');
            title.className = 'hud-buffs-panel-title';
            title.textContent = 'Active Effects';
            buffsPanel.appendChild(title);
        }

        // Lista de buffs
        let buffsList = buffsPanel.querySelector('.hud-buffs-list');
        if (!buffsList) {
            buffsList = document.createElement('div');
            buffsList.className = 'hud-buffs-list';
            buffsPanel.appendChild(buffsList);
        }

        buffsList.innerHTML = '';

        activeEffects.forEach(effect => {
            // Use effectsData if available, otherwise fallback to buff's own data
            const effectData = window.effectsData?.[effect.data?.id];
            const buffData = effect.data || {};

            // Get display info from effectsData or fallback to buff's own data
            const displayName = effectData?.name || buffData.name || buffData.id || 'Unknown';
            const displayIcon = effectData?.lucide || buffData.icon || 'sparkles';
            const displayPng = effectData?.png || null;
            const displayDesc = effectData?.desc || buffData.desc || '';

            const item = document.createElement('div');
            item.className = `hud-buff-item ${effect.type}`;

            const icon = document.createElement('div');
            icon.className = 'hud-buff-icon';

            // Try PNG first, then skill-based path, then Lucide
            const tryLucide = () => {
                const i = document.createElement('i');
                i.setAttribute('data-lucide', displayIcon);
                icon.innerHTML = '';
                icon.appendChild(i);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            };

            if (displayPng) {
                const img = document.createElement('img');
                img.src = displayPng;
                img.alt = displayName;
                img.onerror = tryLucide;
                icon.appendChild(img);
            } else {
                const skillImg = `/public/assets/icons/skills/${effect.data?.id}.webp`;
                const img = document.createElement('img');
                img.src = skillImg;
                img.alt = displayName;
                img.onerror = tryLucide;
                icon.appendChild(img);
            }

            item.appendChild(icon);

            const info = document.createElement('div');
            info.className = 'hud-buff-info';

            const name = document.createElement('div');
            name.className = 'hud-buff-name';
            name.textContent = displayName;
            info.appendChild(name);

            const descText = document.createElement('div');
            descText.className = 'hud-buff-desc';
            descText.textContent = displayDesc;
            info.appendChild(descText);

            item.appendChild(info);

            const duration = document.createElement('div');
            duration.className = 'hud-buff-duration';
            duration.textContent = `${effect.duration}`;
            item.appendChild(duration);

            buffsList.appendChild(item);
        });

        // Inicializar ícones lucide se necessário
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }

        // Renderizar modificadores de stats
        renderStatsModifiers(unit, buffsPanel);
    }

    /**
     * Renderiza modificadores de stats na HUD
     */
    function renderStatsModifiers(unit, container) {
        if (!unit || !window.TacticalSkillEngine) return;

        let modifiersPanel = container.querySelector('.hud-stats-modifiers');
        if (!modifiersPanel) {
            modifiersPanel = document.createElement('div');
            modifiersPanel.className = 'hud-stats-modifiers';
            container.appendChild(modifiersPanel);
        }

        const modifiers = [];

        // Verificar buffs que modificam stats
        if (unit.activeBuffs) {
            unit.activeBuffs.forEach(buff => {
                const data = buff.data;
                if (data.atkBonus !== undefined && data.atkBonus > 0) {
                    modifiers.push({ label: 'ATK', value: `+${Math.round(data.atkBonus * 100)}%`, positive: true });
                }
                if (data.defPenalty !== undefined && data.defPenalty < 0) {
                    modifiers.push({ label: 'DEF', value: `${Math.round(data.defPenalty * 100)}%`, positive: false });
                }
                if (data.damageDealt !== undefined && data.damageDealt > 1) {
                    modifiers.push({ label: 'Dano Causado', value: `+${Math.round((data.damageDealt - 1) * 100)}%`, positive: true });
                }
                if (data.damageTaken !== undefined && data.damageTaken < 1) {
                    modifiers.push({ label: 'Dano Recebido', value: `${Math.round((data.damageTaken - 1) * 100)}%`, positive: false });
                }
                if (data.skillRangeBonus !== undefined && data.skillRangeBonus > 0) {
                    modifiers.push({ label: 'Range', value: `+${data.skillRangeBonus}`, positive: true });
                }
            });
        }

        if (modifiers.length === 0) {
            modifiersPanel.style.display = 'none';
            return;
        }

        modifiersPanel.style.display = 'block';

        let title = modifiersPanel.querySelector('.hud-stats-modifiers-title');
        if (!title) {
            title = document.createElement('div');
            title.className = 'hud-stats-modifiers-title';
            title.textContent = 'Modificadores';
            modifiersPanel.appendChild(title);
        }

        let list = modifiersPanel.querySelector('.hud-stats-modifiers-list');
        if (!list) {
            list = document.createElement('div');
            list.className = 'hud-stats-modifiers-list';
            modifiersPanel.appendChild(list);
        }

        list.innerHTML = '';

        modifiers.forEach(mod => {
            const modEl = document.createElement('div');
            modEl.className = 'hud-stat-modifier';

            const label = document.createElement('div');
            label.className = 'hud-stat-modifier-label';
            label.textContent = mod.label;
            modEl.appendChild(label);

            const value = document.createElement('div');
            value.className = `hud-stat-modifier-value ${mod.positive ? 'positive' : 'negative'}`;
            value.textContent = mod.value;
            modEl.appendChild(value);

            list.appendChild(modEl);
        });
    }

    /**
     * Esconde a HUD tática
     */
    function hideTacticalHUD() {
        const hud = document.getElementById('tactical-hud');
        if (hud) {
            hud.classList.remove('visible');
            hud.classList.add('hidden');
        }
    }

    /**
     * Atualiza a HUD tática se visível
     */
    function updateTacticalHUD() {
        const hud = document.getElementById('tactical-hud');
        if (hud && hud.classList.contains('visible') && gameState.selectedUnit) {
            showTacticalHUD(gameState.selectedUnit);
        }
    }

    // =====================================================
    // ATTACK RANGE SYSTEM (Área Vermelha)
    // =====================================================

    /**
     * Mostra área vermelha no grid quando o jogador clicar em "Atacar"
     */
    function showAttackRange(unit) {
        // Limpar estado de skill antes de mostrar attack range
        cancelSkillSelection();
        gameState.currentAction = 'attacking';
        attackRangeCells = [];
        skillRangeCells = [];
        skillAreaCells = [];
        const range = unit.attackRange || 1;
        let targets;
        if (unit.type === 'enemy') {
            // Debug: inimigo controlando pode atacar player/ally OU outros inimigos
            if (gameState.debugControlEnemy)
                targets = [...playerUnits, ...enemyUnits].filter(t => t.id !== unit.id && t.hp > 0);
            else
                targets = playerUnits;
        } else {
            targets = enemyUnits;
        }

        // Calcular células no alcance (Chebyshev - inclui diagonais)
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                if (dist > 0 && dist <= range) { // Excluir própria célula
                    const x = unit.x + dx;
                    const y = unit.y + dy;
                    if (isValidCell(x, y)) {
                        // Verificar se há alvo (inimigo do atacante) nesta célula
                        const enemyHere = targets.find(t => t.x === x && t.y === y && t.hp > 0);
                        attackRangeCells.push({
                            x, y,
                            hasEnemy: !!enemyHere,
                            enemy: enemyHere
                        });
                    }
                }
            }
        }

        gameState.currentAction = 'attacking';
        needsRender = true;
    }

    /**
     * Desenha o alcance de ataque (área vermelha) - Estilo Premium como movimento
     */
    function drawAttackRange() {
        if (window.__rpgPerf?.skip?.highlights) return;
        if (gameState.currentAction !== 'attacking' || attackRangeCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 15) + 1) / 2;
        const scan = (animationFrame % 80) / 80;

        attackRangeCells.forEach(cell => {
            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // 1. Crystal Surface Vermelho (High Contrast)
            const baseGrad = ctx.createLinearGradient(x, y, x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE);
            if (cell.hasEnemy) {
                baseGrad.addColorStop(0, `rgba(239, 68, 68, ${0.4 + pulse * 0.15})`);
                baseGrad.addColorStop(1, `rgba(220, 38, 38, 0.2)`);
            } else {
                baseGrad.addColorStop(0, `rgba(239, 68, 68, ${0.25 + pulse * 0.1})`);
                baseGrad.addColorStop(1, `rgba(185, 28, 28, 0.1)`);
            }
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

            // 3. Neon Frame Vermelho
            ctx.strokeStyle = cell.hasEnemy
                ? `rgba(248, 113, 113, ${0.7 + pulse * 0.3})`
                : `rgba(239, 68, 68, ${0.5 + pulse * 0.3})`;
            ctx.lineWidth = cell.hasEnemy ? 3 : 2;
            ctx.strokeRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

            // 4. Dot Accents (Pure White for visibility)
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 2, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + 2, 3, 3);
            ctx.fillRect(x + 2, y + CONFIG.CELL_SIZE - 5, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + CONFIG.CELL_SIZE - 5, 3, 3);

            // 5. Ícone de alvo para células com inimigos
            if (cell.hasEnemy) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 22px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
                ctx.fillText('⚔', (cell.x - 0.5) * CONFIG.CELL_SIZE, (cell.y - 0.5) * CONFIG.CELL_SIZE);
                ctx.shadowBlur = 0;
            }
        });

        needsRender = true;
    }

    // Cache de imagens pré-carregadas para evitar recarregamento
    const preloadedSkillImages = new Map();

    /**
     * Pré-carrega imagens de skills para evitar recarregamento
     * @param {string[]} skillIds - Array de IDs de skills
     */
    function preloadSkillImages(skillIds) {
        if (!skillIds || skillIds.length === 0) return;

        skillIds.forEach(skillId => {
            if (preloadedSkillImages.has(skillId)) {
                return; // Já pré-carregada
            }

            const skill = window.TacticalDataLoader?.skillCache?.[skillId];
            if (!skill) return;

            const skillImg = skill.img || `/public/assets/icons/skills/${skillId}.webp`;

            // Criar imagem e pré-carregar
            const img = new Image();
            img.src = skillImg;
            preloadedSkillImages.set(skillId, img);
        });

        console.log(`[MAP-ENGINE] ${preloadedSkillImages.size} imagens de skills pré-carregadas`);
    }

    /**
     * Mostra menu de skills tático (REDESENHADO - Lateral Esquerda)
     * @param {Object} unit - Unidade que vai usar a skill
     */
    async function showSkillMenu(unit) {
        if (!unit) return;

        // Try async loading first
        let skills = [];
        if (window.TacticalDataLoader) {
            try {
                skills = await getUnitSkillsAsync(unit);
            } catch (error) {
                console.warn('[MAP-ENGINE] Error loading skills asynchronously:', error);
            }
        }

        // Fallback to sync if async didn't work
        if (skills.length === 0) {
            skills = getUnitSkills(unit);
        }

        if (skills.length === 0) {
            showNotification('Esta unidade não possui skills!', 'warning');
            return;
        }

        hideActionMenu();

        // Obter ou criar barra de skills
        let skillBar = document.getElementById('skill-bar-container');
        if (!skillBar) {
            skillBar = document.createElement('div');
            skillBar.id = 'skill-bar-container';
            skillBar.className = 'skill-bar-container';
            document.body.appendChild(skillBar);
        }

        // Determinar tipo visual baseado na skill
        const getSkillTypeClass = (skill) => {
            if (skill.type === 'heal' || skill.type === 'ally' || skill.type === 'aoe_heal') return 'heal';
            if (skill.type === 'self' || skill.type === 'buff') return 'buff';
            if (skill.damageType === 'magic' || skill.type === 'aoe') return 'magic';
            return 'physical';
        };

        // Verificar se já temos HTML cached para esta unidade com estas skills
        const unitId = unit.id || unit.name || 'unknown';
        const skillsKey = skills.map(s => `${s.id}-${s.mana || 0}`).join(',');
        const cacheKey = `${unitId}-${skillsKey}`;

        // Verificar se podemos reutilizar elementos existentes (mesmas skills)
        const existingButtons = skillBar.querySelectorAll('.skill-icon-btn');
        const existingSkillIds = Array.from(existingButtons).map(btn => btn.dataset.skillId).sort();
        const newSkillIds = skills.map(s => s.id).sort();
        const skillsChanged = JSON.stringify(existingSkillIds) !== JSON.stringify(newSkillIds);

        // Se as skills mudaram ou é a primeira vez, recriar HTML
        // Caso contrário, apenas atualizar estados (disabled/enabled)
        if (skillsChanged || existingButtons.length === 0) {
            // Criar ícones de skills (sem tooltip inline - será global)
            skillBar.innerHTML = skills.map(skill => {
                const mpCost = skill.mana || skill.cost || 0;
                const canAfford = unit.sp >= mpCost;
                const typeClass = getSkillTypeClass(skill);
                const skillImg = skill.img || `/public/assets/icons/skills/${skill.id}.webp`;

                return `
                <div class="skill-icon-btn ${typeClass} ${!canAfford ? 'disabled' : ''}" 
                     data-skill-id="${skill.id}"
                     data-skill-name="${skill.name}"
                     data-skill-cost="${mpCost}"
                     data-skill-desc="${skill.desc || 'No description available.'}"
                     data-skill-type="${typeClass}"
                     data-skill-img="${skillImg}">
                    <img src="${skillImg}" alt="${skill.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <i data-lucide="${skill.icon || 'zap'}" style="display: none;"></i>
                </div>
            `;
            }).join('');

            // Atualizar ícones Lucide apenas se HTML foi recriado
            if (typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 10);
            }
        } else {
            // Reutilizar elementos existentes - apenas atualizar estados
            existingButtons.forEach(btn => {
                const skillId = btn.dataset.skillId;
                const skill = skills.find(s => s.id === skillId);
                if (!skill) return;

                const mpCost = skill.mana || skill.cost || 0;
                const canAfford = unit.sp >= mpCost;

                if (canAfford) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
                const costEl = btn.querySelector('.skill-tooltip-cost');
                if (costEl) {
                    costEl.textContent = `${mpCost} MP`;
                    if (canAfford) costEl.classList.remove('insufficient');
                    else costEl.classList.add('insufficient');
                }
                const useBtn = btn.querySelector('.skill-tooltip-btn');
                if (useBtn) useBtn.disabled = !canAfford;

                // Atualizar título
                btn.title = `${skill.name} (${mpCost} MP)`;
            });
        }

        skillBar.style.display = 'flex';

        // Aguardar DOM ser atualizado antes de anexar listeners
        setTimeout(() => {
            attachSkillBarListeners(unit, skills);
        }, 50);
    }

    // Estado do tooltip global
    let activeSkillTooltip = null;
    let activeSkillTooltipData = null;

    function attachSkillBarListeners(unit, skills) {
        console.log('[DEBUG] attachSkillBarListeners called with:', {
            unitId: unit?.id || unit?.name,
            skillsCount: skills?.length
        });

        const skillBar = document.getElementById('skill-bar-container');
        if (!skillBar) {
            console.warn('[DEBUG] skillBar not found!');
            return;
        }

        // Criar ou reutilizar tooltip global (único para todas as skills)
        let tooltipPanel = document.getElementById('skill-tooltip-panel');
        if (!tooltipPanel) {
            tooltipPanel = document.createElement('div');
            tooltipPanel.id = 'skill-tooltip-panel';
            tooltipPanel.className = 'skill-tooltip-panel';
            tooltipPanel.innerHTML = `
                <button class="skill-tooltip-close" aria-label="Fechar">×</button>
                <div class="skill-tooltip-header">
                    <div class="skill-tooltip-icon"></div>
                    <div class="skill-tooltip-info">
                        <div class="skill-tooltip-name"></div>
                        <div class="skill-tooltip-cost"></div>
                    </div>
                </div>
                <div class="skill-tooltip-desc"></div>
                <button class="skill-tooltip-btn">Usar Skill</button>
            `;
            document.body.appendChild(tooltipPanel);

            // Handler de fechar
            tooltipPanel.querySelector('.skill-tooltip-close').addEventListener('click', (e) => {
                e.stopPropagation();
                closeSkillTooltip();
            });

            // Handler de usar skill
            tooltipPanel.querySelector('.skill-tooltip-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!activeSkillTooltipData || !activeSkillTooltipData.skill) return;

                const { skill, unit } = activeSkillTooltipData;
                const mpCost = skill.mana || skill.cost || 0;
                if (unit && unit.sp >= mpCost) {
                    closeSkillTooltip();
                    await selectSkillForUse(unit, skill);
                }
            });
        }

        // Função para fechar tooltip
        function closeSkillTooltip() {
            tooltipPanel.classList.remove('visible');
            activeSkillTooltip = null;
            activeSkillTooltipData = null;
            // Remover seleção visual
            skillBar.querySelectorAll('.skill-icon-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
        }

        // Função para abrir tooltip
        function openSkillTooltip(btn, skill) {
            const mpCost = skill.mana || skill.cost || 0;
            const canAfford = unit.sp >= mpCost;
            const typeClass = btn.dataset.skillType || 'physical';
            const skillImg = btn.dataset.skillImg;

            const iconEl = tooltipPanel.querySelector('.skill-tooltip-icon');
            iconEl.className = `skill-tooltip-icon ${typeClass}`;
            iconEl.innerHTML = `<img src="${skillImg}" alt="${skill.name}" onerror="this.style.display='none'">`;

            tooltipPanel.querySelector('.skill-tooltip-name').textContent = skill.name;

            const costEl = tooltipPanel.querySelector('.skill-tooltip-cost');
            costEl.textContent = `${mpCost} MP`;
            costEl.className = `skill-tooltip-cost ${canAfford ? '' : 'insufficient'}`;

            tooltipPanel.querySelector('.skill-tooltip-desc').textContent = skill.desc || 'No description available.';

            const useBtn = tooltipPanel.querySelector('.skill-tooltip-btn');
            useBtn.disabled = !canAfford;

            // Posicionar acima do botão clicado
            const btnRect = btn.getBoundingClientRect();
            const panelWidth = 280;
            let left = btnRect.left + (btnRect.width / 2) - (panelWidth / 2);

            // Manter dentro da tela
            if (left < 10) left = 10;
            if (left + panelWidth > window.innerWidth - 10) {
                left = window.innerWidth - panelWidth - 10;
            }

            tooltipPanel.style.left = `${left}px`;
            tooltipPanel.style.bottom = `${window.innerHeight - btnRect.top + 12}px`;

            // Marcar botão como selecionado
            skillBar.querySelectorAll('.skill-icon-btn.selected').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Guardar dados
            activeSkillTooltip = btn.dataset.skillId;
            activeSkillTooltipData = { skill, unit };

            // Mostrar
            tooltipPanel.classList.add('visible');
        }

        // Event listeners para botões
        const buttons = skillBar.querySelectorAll('.skill-icon-btn');
        buttons.forEach(btn => {
            // Remover listeners antigos clonando
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();

                const skillId = newBtn.dataset.skillId;
                const skill = skills.find(s => s.id === skillId);

                if (!skill) return;
                if (newBtn.classList.contains('disabled')) return;

                // Toggle: se já está aberto para esta skill, fechar
                if (activeSkillTooltip === skillId && tooltipPanel.classList.contains('visible')) {
                    closeSkillTooltip();
                } else {
                    openSkillTooltip(newBtn, skill);
                }
            });
        });

        // Fechar ao clicar fora
        const closeOnOutsideClick = (e) => {
            const clickedPanel = e.target.closest('#skill-tooltip-panel');
            const clickedSkillBtn = e.target.closest('.skill-icon-btn');
            const clickedSkillBar = e.target.closest('#skill-bar-container');

            if (!clickedPanel && !clickedSkillBtn && !clickedSkillBar) {
                closeSkillTooltip();
            }
        };

        // Remover handler antigo e adicionar novo
        document.removeEventListener('click', closeOnOutsideClick, true);
        document.addEventListener('click', closeOnOutsideClick, true);
    }

    /**
     * Fecha o menu de skills
     */
    function hideSkillMenu() {
        const skillBar = document.getElementById('skill-bar-container');
        if (skillBar) {
            skillBar.style.display = 'none';
            skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => {
                t.classList.remove('visible');
            });
        }
        // Não limpar selectedSkillForPreview e skillRangeCells aqui,
        // pois isso é feito apenas quando realmente cancelamos a seleção
        needsRender = true;
    }

    /**
     * Cancela a seleção de skill e limpa o preview
     */
    function cancelSkillSelection() {
        selectedSkillForPreview = null;
        skillRangeCells = [];
        skillAreaCells = [];
        gameState.currentAction = null;
        gameState.selectedSkill = null;
        // Não limpar attackRangeCells aqui, pois pode estar em modo de ataque
        needsRender = true;
    }

    /**
     * Seleciona uma skill para usar
     * @param {Object} unit - Unidade que vai usar
     * @param {Object} skill - Skill selecionada
     */
    async function selectSkillForUse(unit, skill) {
        // Limpar estado de attack antes de mostrar skill range
        attackRangeCells = [];

        // Para skills self e aoe_heal, executar imediatamente
        const rangeType = getSkillRangeType(skill);
        if (rangeType === 'self') {
            // Ocultar menu
            const skillBar = document.getElementById('skill-bar-container');
            if (skillBar) {
                skillBar.style.display = 'none';
                skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => {
                    t.classList.remove('visible');
                });
            }

            // Limpar estados
            skillRangeCells = [];
            skillAreaCells = [];
            selectedSkillForPreview = null;
            gameState.currentAction = null;
            gameState.selectedSkill = null;

            // Executar skill imediatamente no próprio personagem
            await executeSkill(unit, unit, skill, [unit]);
            persistSessionState();
            return;
        }
        if (skill.type === 'aoe_heal') {
            const skillBar = document.getElementById('skill-bar-container');
            if (skillBar) {
                skillBar.style.display = 'none';
                skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => t.classList.remove('visible'));
            }
            skillRangeCells = [];
            skillAreaCells = [];
            selectedSkillForPreview = null;
            gameState.currentAction = null;
            gameState.selectedSkill = null;
            const allies = playerUnits.filter(u => u.hp > 0);
            await executeSkill(unit, unit, skill, allies.length ? allies : [unit]);
            persistSessionState();
            return;
        }

        // Apenas ocultar o menu UI, sem limpar o preview da skill
        const skillBar = document.getElementById('skill-bar-container');
        if (skillBar) {
            skillBar.style.display = 'none';
            skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => {
                t.classList.remove('visible');
            });
        }

        gameState.currentAction = 'skill';
        gameState.selectedSkill = skill;

        // Mostrar alcance da skill
        console.log('[DEBUG] selectSkillForUse - Setting variables:', {
            unitId: unit?.id || unit?.name,
            skillId: skill?.id,
            skillName: skill?.name
        });

        selectedSkillForPreview = skill;
        console.log('[DEBUG] selectSkillForUse - selectedSkillForPreview set to:', selectedSkillForPreview?.id);

        skillRangeCells = calculateSkillRange(unit, skill);
        skillAreaCells = [];

        console.log('[DEBUG] selectSkillForUse - After calculateSkillRange:', {
            skillRangeCellsLength: skillRangeCells.length,
            skillRangeCellsSample: skillRangeCells.slice(0, 3), // Primeiras 3 células
            selectedSkillForPreview: selectedSkillForPreview?.id,
            gameStateCurrentAction: gameState.currentAction,
            gameStateSelectedSkill: gameState.selectedSkill?.id
        });

        showNotification(`Selecione um alvo para ${skill.name}`, 'info');
        needsRender = true;

        console.log('[DEBUG] selectSkillForUse - needsRender set to:', needsRender);
    }

    function showTopBanner(message, type = 'info') {
        const banner = document.getElementById('top-banner');
        const bannerText = document.getElementById('top-banner-text');
        if (!banner || !bannerText) return;

        bannerText.textContent = message;
        banner.className = `top-banner visible ${type}`;

        setTimeout(() => {
            banner.classList.remove('visible');
        }, 2500);
    }

    function showRangeWarning() {
        showTopBanner('⚠️ Inimigo fora de alcance', 'warning');
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
        document.getElementById('action-attack')?.addEventListener('click', async () => {
            if (gameState.selectedUnit) {
                const range = gameState.selectedUnit.attackRange || 1;
                const enemy = getUnitAtRange(gameState.selectedUnit, range, 'enemy');
                if (enemy) {
                    hideActionMenu();
                    await executeAttack(gameState.selectedUnit, enemy);
                    // Persistir após ataque do player (se não for fim de turno, persistir aqui)
                    if (!gameState.phase || gameState.phase === 'player') {
                        persistSessionState();
                    }
                } else {
                    showNotification(`Inimigo fora de alcance! Aproxime-se para atacar.`, 'warning');
                }
            }
        });
        document.getElementById('action-skills')?.addEventListener('click', async () => {
            if (gameState.selectedUnit) {
                await showSkillMenu(gameState.selectedUnit);
            }
        });
        document.getElementById('action-finish')?.addEventListener('click', async () => {
            if (gameState.selectedUnit) await finishUnitTurn(gameState.selectedUnit);
        });
        document.getElementById('action-cancel')?.addEventListener('click', () => { if (gameState.selectedUnit) returnToNormalSelection(); });

        // =====================================================
        // TACTICAL HUD EVENT LISTENERS
        // =====================================================

        // Ripple effect helper
        function createRipple(event, button) {
            const circle = document.createElement('span');
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            const radius = diameter / 2;
            const rect = button.getBoundingClientRect();

            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - rect.left - radius}px`;
            circle.style.top = `${event.clientY - rect.top - radius}px`;
            circle.classList.add('ripple');

            const ripple = button.querySelector('.ripple');
            if (ripple) ripple.remove();

            button.appendChild(circle);
        }

        // Add ripple to all tactical buttons
        document.querySelectorAll('.tactical-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                createRipple(e, this);
            });
        });

        const canControlUnit = (u) => u && ((u.type === 'player' || u.type === 'ally') || (gameState.debugControlEnemy && u.type === 'enemy'));
        document.getElementById('tactical-move')?.addEventListener('click', () => {
            if (canControlUnit(gameState.selectedUnit)) {
                setAction('move');
                hideTacticalHUD();
            }
        });

        document.getElementById('tactical-attack')?.addEventListener('click', () => {
            if (canControlUnit(gameState.selectedUnit)) {
                showAttackRange(gameState.selectedUnit);
                showTacticalHUD(gameState.selectedUnit); // Atualizar estado ativo do botão
            }
        });

        document.getElementById('tactical-skills')?.addEventListener('click', async () => {
            if (canControlUnit(gameState.selectedUnit)) {
                await showSkillMenu(gameState.selectedUnit);
            }
        });

        document.getElementById('tactical-endturn')?.addEventListener('click', async () => {
            const endTurnBtn = document.getElementById('tactical-endturn');
            const moveBtn = document.getElementById('tactical-move');
            const attackBtn = document.getElementById('tactical-attack');
            const skillsBtn = document.getElementById('tactical-skills');

            // Mostrar spinner e bloquear botões
            if (endTurnBtn) {
                endTurnBtn.disabled = true;
                const btnIcon = endTurnBtn.querySelector('.btn-icon');
                if (btnIcon) {
                    btnIcon.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>';
                }
            }
            if (moveBtn) moveBtn.disabled = true;
            if (attackBtn) attackBtn.disabled = true;
            if (skillsBtn) skillsBtn.disabled = true;

            try {
                if (gameState.debugFreeControl || gameState.debugControlEnemy) {
                    const u = gameState.selectedUnit;
                    const wasPlayerOrAlly = u && (u.type === 'player' || u.type === 'ally');
                    gameState.debugFreeControl = false;
                    gameState.debugControlEnemy = false;
                    if (wasPlayerOrAlly && u) gameState.unitsActedThisTurn.add(u.id);
                    deselectUnit(true);
                    if (wasPlayerOrAlly) {
                        const next = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
                        if (next) selectUnit(next);
                    }
                    if (typeof updateTurnTimeline === 'function') updateTurnTimeline();
                    needsRender = true;
                    return;
                }
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                    await finishUnitTurn(gameState.selectedUnit);
                }
            } finally {
                // Restaurar botão após processamento (será atualizado por showTacticalHUD)
                if (gameState.selectedUnit) {
                    showTacticalHUD(gameState.selectedUnit);
                }
            }
        });

        // =====================================================
        // AUDIO CONTROLS EVENT LISTENERS
        // =====================================================
        document.getElementById('toggle-music')?.addEventListener('click', () => {
            audioSettings.musicEnabled = !audioSettings.musicEnabled;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('rpg_audio_music', audioSettings.musicEnabled);
            }
            updateAudioButtons();
            if (!audioSettings.musicEnabled && currentBattleMusic) {
                currentBattleMusic.pause();
                currentBattleMusic = null;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        document.getElementById('toggle-sfx')?.addEventListener('click', () => {
            audioSettings.sfxEnabled = !audioSettings.sfxEnabled;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('rpg_audio_sfx', audioSettings.sfxEnabled);
            }
            updateAudioButtons();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        function updateAudioButtons() {
            const musicBtn = document.getElementById('toggle-music');
            const sfxBtn = document.getElementById('toggle-sfx');
            if (musicBtn) {
                musicBtn.classList.toggle('muted', !audioSettings.musicEnabled);
                const musicIcon = musicBtn.querySelector('i');
                if (musicIcon) {
                    musicIcon.setAttribute('data-lucide', audioSettings.musicEnabled ? 'music' : 'music-2');
                }
            }
            if (sfxBtn) {
                sfxBtn.classList.toggle('muted', !audioSettings.sfxEnabled);
                const sfxIcon = sfxBtn.querySelector('i');
                if (sfxIcon) {
                    sfxIcon.setAttribute('data-lucide', audioSettings.sfxEnabled ? 'volume-2' : 'volume-x');
                }
            }
        }

        // Inicializar estado dos botões (após DOM estar pronto)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateAudioButtons);
        } else {
            // DOM já carregado, mas pode não ter os elementos ainda
            setTimeout(updateAudioButtons, 100);
        }
    }

    // =====================================================
    // SCREEN EFFECTS
    // =====================================================

    /**
     * Spawn cinematic death effects
     */
    function triggerScreenShake(intensity = 4, decay = 0.88) {
        screenShake.intensity = Math.max(screenShake.intensity, intensity);
        screenShake.decay = decay;
        needsRender = true;
    }

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

    function spawnImpactEffect(x, y, color = '#f59e0b') {
        // Micro burst (leve, rápido)
        for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 6,
                color,
                life: 0.7,
                decay: 0.04 + Math.random() * 0.04,
                friction: 0.9
            });
        }
        needsRender = true;
    }

    function spawnSwordSlashEffect(x, y) {
        // Usar MapSFX se disponível
        if (window.MapSFX) {
            window.MapSFX.spawnSlashEffect(x, y);
            return;
        }

        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = direction * (-Math.PI / 4);

        // Linha de slash principal
        for (let i = 0; i < 32; i++) {
            const offset = i * 5 - 80;
            const fade = 1 - Math.abs(i - 16) / 16;
            particles.push({
                type: 'slash',
                x: x + Math.cos(angle) * offset,
                y: y + Math.sin(angle) * offset,
                vx: Math.cos(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                vy: Math.sin(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                size: (8 + Math.random() * 10) * fade,
                color: '#ffffff',
                life: 0.5,
                decay: 0.08,
                rotation: angle,
                glow: true
            });
        }

        // Faíscas de impacto
        for (let i = 0; i < 20; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const speed = 4 + Math.random() * 6;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(sparkAngle) * speed * direction,
                vy: Math.sin(sparkAngle) * speed - 2,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#fef3c7' : '#fbbf24',
                life: 0.6,
                decay: 0.05,
                friction: 0.92
            });
        }

        // Glow central
        particles.push({
            type: 'explosion',
            x, y,
            vx: 0, vy: 0,
            size: 50,
            color: 'rgba(255, 255, 255, 0.8)',
            life: 0.3,
            decay: 0.15,
            friction: 1
        });

        needsRender = true;
    }

    // Alias para compatibilidade
    const spawnSlashEffect = spawnSwordSlashEffect;

    /**
     * Efeito de skill mágica (aura + partículas)
     */
    function spawnMagicEffect(x, y, color = '#a855f7') {
        // Aura central expandindo
        for (let ring = 0; ring < 3; ring++) {
            for (let i = 0; i < 24; i++) {
                const angle = (Math.PI * 2 * i) / 24;
                const baseRadius = 10 + ring * 20;
                const delay = ring * 0.1;

                setTimeout(() => {
                    particles.push({
                        type: 'explosion',
                        x: x + Math.cos(angle) * baseRadius,
                        y: y + Math.sin(angle) * baseRadius,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        size: 4 + Math.random() * 3,
                        color: color,
                        life: 0.8,
                        decay: 0.03,
                        friction: 0.95,
                        glow: true
                    });
                }, delay * 1000);
            }
        }

        // Partículas subindo
        for (let i = 0; i < 30; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            particles.push({
                type: 'explosion',
                x: x + offsetX,
                y: y + offsetY,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -3 - Math.random() * 3,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.6 ? '#fff' : color,
                life: 1.2,
                decay: 0.02,
                friction: 0.98,
                glow: true
            });
        }

        needsRender = true;
    }

    /**
     * Efeito de impacto premium (explosão com ondas)
     */
    function spawnImpactBurst(x, y, color = '#ef4444', intensity = 1) {
        const particleCount = Math.floor(35 * intensity);

        // Explosão principal
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8 * intensity;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                color: Math.random() > 0.4 ? color : '#fff',
                life: 0.9,
                decay: 0.025,
                friction: 0.92,
                glow: true
            });
        }

        // Anel de onda
        for (let i = 0; i < 32; i++) {
            const angle = (Math.PI * 2 * i) / 32;
            const radius = 20;
            particles.push({
                type: 'explosion',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                size: 5,
                color: color,
                life: 0.5,
                decay: 0.06,
                friction: 0.95,
                glow: true
            });
        }

        // Flash central
        particles.push({
            type: 'explosion',
            x, y,
            vx: 0, vy: 0,
            size: 80 * intensity,
            color: 'rgba(255, 255, 255, 0.9)',
            life: 0.25,
            decay: 0.2,
            friction: 1
        });

        needsRender = true;
    }

    /**
     * Efeito de cura premium (partículas verdes subindo)
     */
    function spawnHealEffect(x, y) {
        // Partículas de cura
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40;
            particles.push({
                type: 'explosion',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2 - Math.random() * 3,
                size: 4 + Math.random() * 4,
                color: ['#22c55e', '#4ade80', '#86efac'][Math.floor(Math.random() * 3)],
                life: 1.5,
                decay: 0.015,
                friction: 0.98,
                glow: true
            });
        }

        // Cruzes/Sparkles (símbolos de cura)
        for (let i = 0; i < 8; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            particles.push({
                type: 'explosion',
                x: x + offsetX,
                y: y + offsetY,
                vx: 0,
                vy: -1,
                size: 12,
                color: '#fbbf24',
                life: 1,
                decay: 0.02,
                friction: 0.99,
                glow: true
            });
        }

        needsRender = true;
    }

    function spawnHitBurstEffect(x, y) {
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const speed = 3 + Math.random() * 3;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: i % 2 === 0 ? '#ef4444' : '#fca5a5',
                life: 0.8,
                decay: 0.03,
                friction: 0.9,
                glow: true
            });
        }
        needsRender = true;
    }

    function spawnEnemyHitEffect(x, y, isCrit = false) {
        // Partículas de impacto mais intensas para inimigos
        const particleCount = isCrit ? 40 : 25;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: isCrit ? '#ff0000' : '#ef4444',
                life: 0.9,
                decay: 0.03,
                friction: 0.9,
                glow: true
            });
        }
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

    // =====================================================
    // KILL CONFIRMATION BANNER
    // =====================================================
    function showKillBanner(targetName) {
        const banner = document.getElementById('kill-banner');
        const targetEl = document.getElementById('kill-target-name');

        if (!banner) return;

        if (targetEl) targetEl.textContent = targetName;

        // Play kill sound
        playSfx('critical.mp3', 0.5);

        // Show banner
        banner.classList.add('active');

        // Screen shake
        screenShake = { intensity: 8, decay: 0.92 };

        // Hide after delay
        setTimeout(() => {
            banner.classList.remove('active');
        }, 1500);

        // Add to combat log
        addLogEntry('defeat', `<span class="target">${targetName}</span> foi derrotado!`);
    }

    // =====================================================
    // SKILL ACTIVATION BANNER (Premium UI)
    // =====================================================

    /**
     * Exibe banner animado ao ativar uma skill.
     * @param {string} skillImg - URL do PNG da skill (skill.img); se houver, usa em vez do ícone Lucide.
     */
    function showSkillBanner(skillName, skillIcon = 'zap', skillType = 'physical', skillImg = null) {
        return new Promise((resolve) => {
            const container = document.getElementById('map-container') || document.body;

            // Determinar cores baseado no tipo (incluindo ultimate)
            const colors = {
                physical: { color: 'rgba(239, 68, 68, 0.4)', border: 'rgba(239, 68, 68, 0.5)', icon: '#ef4444', icon2: '#dc2626', label: '#fca5a5' },
                magic: { color: 'rgba(168, 85, 247, 0.4)', border: 'rgba(168, 85, 247, 0.5)', icon: '#a855f7', icon2: '#7c3aed', label: '#c084fc' },
                heal: { color: 'rgba(34, 197, 94, 0.4)', border: 'rgba(34, 197, 94, 0.5)', icon: '#22c55e', icon2: '#16a34a', label: '#86efac' },
                buff: { color: 'rgba(251, 191, 36, 0.4)', border: 'rgba(251, 191, 36, 0.5)', icon: '#fbbf24', icon2: '#f59e0b', label: '#fde68a' },
                ultimate: { color: 'rgba(251, 191, 36, 0.6)', border: 'rgba(251, 191, 36, 0.8)', icon: '#fbbf24', icon2: '#f59e0b', label: '#fde68a' }
            };
            const c = colors[skillType] || colors.physical;

            const iconHtml = skillImg
                ? `<img src="${skillImg}" alt="" class="skill-banner-icon-img" onerror="this.style.display='none';var n=this.nextElementSibling;if(n)n.style.display='block'"><i data-lucide="${skillIcon}" style="display:none"></i>`
                : `<i data-lucide="${skillIcon}"></i>`;

            const banner = document.createElement('div');
            banner.className = 'skill-activation-banner';
            banner.style.setProperty('--banner-color', c.color);
            banner.style.setProperty('--banner-border', c.border);
            banner.style.setProperty('--icon-bg', c.icon);
            banner.style.setProperty('--icon-bg2', c.icon2);
            banner.style.setProperty('--label-color', c.label);

            banner.innerHTML = `
                <div class="skill-banner-glow"></div>
                <div class="skill-banner-content">
                    <div class="skill-banner-icon">${iconHtml}</div>
                    <div class="skill-banner-text">
                        <div class="skill-banner-label">${skillType === 'ultimate' ? 'ULTIMATE' : 'SKILL ACTIVATE'}</div>
                        <div class="skill-banner-name">${skillName}</div>
                    </div>
                </div>
            `;

            container.appendChild(banner);

            // Atualizar ícones Lucide
            if (typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 10);
            }

            // Screen flash + shake
            hitFlash = 0.3;
            triggerScreenShake(6);

            // Remover após animação
            setTimeout(() => {
                banner.style.transition = 'all 0.5s ease-out';
                banner.style.opacity = '0';
                banner.style.transform = 'translate(-50%, -50%) scale(1.2)';
                setTimeout(() => {
                    banner.remove();
                    resolve();
                }, 500);
            }, 1200);
        });
    }

    /**
     * Exibe cut-in estilo anime para ULTIMATE skills.
     * @param {string} skillImg - URL do PNG da skill (skill.img); se houver, usa em vez do ícone Lucide.
     */
    function showUltimateCutIn(skillName, skillIcon = 'zap', skillImg = null) {
        return new Promise((resolve) => {
            const container = document.body;

            const iconHtml = skillImg
                ? `<img src="${skillImg}" alt="" class="ultimate-icon-img" onerror="this.style.display='none';var n=this.nextElementSibling;if(n)n.style.display='block'"><i data-lucide="${skillIcon}" style="display:none"></i>`
                : `<i data-lucide="${skillIcon}"></i>`;

            // Speed lines com múltiplas camadas (estilo Hollywood)
            const speedLines = document.createElement('div');
            speedLines.className = 'ultimate-speed-lines';
            speedLines.innerHTML = `
                <div class="ultimate-speed-lines-sweep"></div>
                <div class="ultimate-vignette"></div>
                <div class="ultimate-flash"></div>
            `;
            container.appendChild(speedLines);

            // Ativar animação após append
            requestAnimationFrame(() => {
                speedLines.classList.add('active');
            });

            // Banner wrapper com visual premium
            const wrapper = document.createElement('div');
            wrapper.className = 'ultimate-banner-wrapper';
            wrapper.innerHTML = `
                <div class="ultimate-banner-strip">
                    <div class="ultimate-banner-content">
                        <div class="ultimate-icon">${iconHtml}</div>
                        <div class="ultimate-text">
                            <div class="ultimate-label">ULTIMATE</div>
                            <div class="ultimate-name">${skillName}</div>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(wrapper);

            // Atualizar ícones Lucide
            if (typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 10);
            }

            // Screen effects INTENSOS
            hitFlash = 0.6;
            triggerScreenShake(15);

            // Flash adicional no meio
            setTimeout(() => {
                hitFlash = 0.4;
                triggerScreenShake(10);
            }, 800);

            // Remover após animação
            setTimeout(() => {
                speedLines.remove();
                wrapper.remove();
                resolve();
            }, 2500);
        });
    }

    // =====================================================
    // COMBAT LOG SYSTEM
    // =====================================================
    const combatLogEntries = [];
    const MAX_LOG_ENTRIES = 20;

    function addLogEntry(type, html) {
        const body = document.getElementById('combat-log-body');
        if (!body) return;

        const icons = {
            attack: 'sword',
            skill: 'sparkles',
            move: 'footprints',
            defeat: 'skull',
            turn: 'clock'
        };

        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <i data-lucide="${icons[type] || 'info'}" class="log-icon ${type}"></i>
            <span class="log-text">${html}</span>
            <span class="log-time">${time}</span>
        `;

        // Add to top
        body.insertBefore(entry, body.firstChild);

        // Limit entries
        while (body.children.length > MAX_LOG_ENTRIES) {
            body.removeChild(body.lastChild);
        }

        // Refresh lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Global function for toggle
    window.toggleCombatLog = function () {
        const log = document.getElementById('combat-log');
        if (log) log.classList.toggle('minimized');
    };

    // =====================================================
    // TURN ORDER TIMELINE
    // =====================================================
    function updateTurnTimeline() {
        const timeline = document.getElementById('turn-timeline');
        if (!timeline) return;

        const label = timeline.querySelector('.timeline-label');
        if (label) label.textContent = `Turn: ${gameState.turn || 1}`;

        // Get all units in order (por ASPD/AGI: mais rápido primeiro)
        const allUnits = [];
        const currentUnits = gameState.phase === 'player' ? playerUnits : enemyUnits;
        const nextUnits = gameState.phase === 'player' ? enemyUnits : playerUnits;
        const bySpeed = (a, b) => (getUnitSpeed(b) - getUnitSpeed(a)) || (String(a.id || '').localeCompare(String(b.id || '')));
        const curr = currentUnits.filter(u => u.hp > 0).sort(bySpeed);
        const next = nextUnits.filter(u => u.hp > 0).sort(bySpeed);

        curr.forEach(u => allUnits.push({ ...u, isCurrent: true }));
        if (next.length > 0) {
            allUnits.push({ separator: true });
            next.forEach(u => allUnits.push({ ...u, isCurrent: false }));
        }

        const sig = allUnits.map(x => x.separator ? '|' : x.id).join(',');
        const buffSig = allUnits.filter(u => !u.separator).map(u => `${u.id}:b${(u.activeBuffs || []).length}d${(u.activeDebuffs || []).length}s${(u.statusEffects || []).length}`).join(';');
        if (sig === lastTimelineSignature && buffSig === lastTimelineBuffSignature) {
            // Light update: só barras, classes e filtro da img — não recria <img> nem altera .src
            const cards = timeline.querySelectorAll('.timeline-unit-card');
            cards.forEach(card => {
                const id = card.getAttribute('data-unit-id');
                const unit = allUnits.find(u => !u.separator && u.id === id);
                if (!unit) return;
                card.classList.toggle('acted', gameState.unitsActedThisTurn.has(unit.id));
                card.classList.toggle('active', !!(gameState.selectedUnit && gameState.selectedUnit.id === unit.id));
                const img = card.querySelector('.unit-portrait-frame img');
                if (img) img.style.filter = gameState.unitsActedThisTurn.has(unit.id) ? 'grayscale(0.85) brightness(0.7)' : '';
                const rows = card.querySelectorAll('.hud-bar-row');
                const hpFill = rows[0]?.querySelector('.hud-bar-fill.hp');
                const hpText = rows[0]?.querySelector('.hud-bar-text');
                const mpFill = rows[1]?.querySelector('.hud-bar-fill.mp');
                const mpText = rows[1]?.querySelector('.hud-bar-text');
                const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
                const mp = unit.sp ?? unit.mp ?? 0;
                const maxMp = unit.maxSp ?? unit.maxMp ?? 100;
                const mpPct = Math.max(0, (mp / maxMp) * 100);
                if (hpFill) hpFill.style.width = `${hpPct}%`;
                if (hpText) hpText.textContent = `${unit.hp}/${unit.maxHp}`;
                if (hpFill) hpFill.classList.toggle('low', hpPct < 30);
                if (mpFill) mpFill.style.width = `${mpPct}%`;
                if (mpText) mpText.textContent = `${mp}/${maxMp}`;
            });
            return;
        }
        lastTimelineSignature = sig;
        lastTimelineBuffSignature = buffSig;

        // Full rebuild: limpar e recriar cards (e seus <img>) só quando a lista de unidades ou buffs mudar
        timeline.innerHTML = '';
        if (label) timeline.appendChild(label);

        allUnits.forEach((unit) => {
            if (unit.separator) {
                const sep = document.createElement('div');
                sep.className = 'timeline-separator';
                timeline.appendChild(sep);
                return;
            }

            // Create card container
            const cardEl = document.createElement('div');
            cardEl.className = `timeline-unit-card ${unit.type}`;

            if (gameState.unitsActedThisTurn.has(unit.id)) {
                cardEl.classList.add('acted');
            }

            if (gameState.selectedUnit && gameState.selectedUnit.id === unit.id) {
                cardEl.classList.add('active');
            }
            cardEl.setAttribute('data-unit-id', unit.id);

            // Portrait frame
            const portraitFrame = document.createElement('div');
            portraitFrame.className = 'unit-portrait-frame';

            const img = document.createElement('img');
            img.src = unit.avatar || '/public/assets/img/characters/swordman.webp';
            img.alt = unit.name;
            // Aplicar grayscale apenas na imagem se a unidade já agiu
            if (gameState.unitsActedThisTurn.has(unit.id)) {
                img.style.filter = 'grayscale(0.85) brightness(0.7)';
            }
            portraitFrame.appendChild(img);

            // Level badge
            const levelBadge = document.createElement('div');
            levelBadge.className = 'unit-level-badge';
            levelBadge.textContent = unit.level || 1;
            portraitFrame.appendChild(levelBadge);

            cardEl.appendChild(portraitFrame);

            // Unit info details
            const details = document.createElement('div');
            details.className = 'unit-info-details';

            // Unit name
            const nameEl = document.createElement('div');
            nameEl.className = 'unit-name';
            nameEl.textContent = unit.name;
            details.appendChild(nameEl);

            // HP/MP bars container
            const barsContainer = document.createElement('div');
            barsContainer.className = 'hud-bars-container';

            // HP Bar
            const hpRow = document.createElement('div');
            hpRow.className = 'hud-bar-row';

            const hpIcon = document.createElement('div');
            hpIcon.className = 'hud-bar-icon hp';
            const hpIconElement = document.createElement('i');
            hpIconElement.setAttribute('data-lucide', 'heart');
            hpIcon.appendChild(hpIconElement);
            hpRow.appendChild(hpIcon);

            const hpBar = document.createElement('div');
            hpBar.className = 'hud-bar';

            const hpFill = document.createElement('div');
            hpFill.className = 'hud-bar-fill hp';
            const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
            hpFill.style.width = `${hpPct}%`;
            if (hpPct < 30) hpFill.classList.add('low');
            hpBar.appendChild(hpFill);

            const hpText = document.createElement('span');
            hpText.className = 'hud-bar-text';
            hpText.textContent = `${unit.hp}/${unit.maxHp}`;
            hpBar.appendChild(hpText);

            hpRow.appendChild(hpBar);
            barsContainer.appendChild(hpRow);

            // MP Bar
            const mpRow = document.createElement('div');
            mpRow.className = 'hud-bar-row';

            const mpIcon = document.createElement('div');
            mpIcon.className = 'hud-bar-icon mp';
            const mpIconElement = document.createElement('i');
            mpIconElement.setAttribute('data-lucide', 'flame');
            mpIcon.appendChild(mpIconElement);
            mpRow.appendChild(mpIcon);

            const mpBar = document.createElement('div');
            mpBar.className = 'hud-bar';

            const mpFill = document.createElement('div');
            mpFill.className = 'hud-bar-fill mp';
            const mp = unit.sp ?? unit.mp ?? 0;
            const maxMp = unit.maxSp ?? unit.maxMp ?? 100;
            const mpPct = Math.max(0, (mp / maxMp) * 100);
            mpFill.style.width = `${mpPct}%`;
            mpBar.appendChild(mpFill);

            const mpText = document.createElement('span');
            mpText.className = 'hud-bar-text';
            mpText.textContent = `${mp}/${maxMp}`;
            mpBar.appendChild(mpText);

            mpRow.appendChild(mpBar);
            barsContainer.appendChild(mpRow);

            details.appendChild(barsContainer);

            // Helper function to build detailed buff tooltip (English)
            function buildBuffTooltip(effect, effectData) {
                const parts = [];

                // Name and duration
                parts.push(`${effectData.name} (${effect.duration} turn${effect.duration !== 1 ? 's' : ''})`);

                // Description
                if (effectData.desc) {
                    parts.push(effectData.desc);
                }

                // Modifiers from effect.data
                const modifiers = [];
                const data = effect.data || {};

                if (data.atkBonus !== undefined) {
                    const percent = Math.round(data.atkBonus * 100);
                    modifiers.push(`ATK ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (data.defPenalty !== undefined) {
                    const percent = Math.round(data.defPenalty * 100);
                    modifiers.push(`DEF ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (data.damageDealt !== undefined && data.damageDealt !== 1) {
                    const percent = Math.round((data.damageDealt - 1) * 100);
                    modifiers.push(`Damage Dealt ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (data.damageTaken !== undefined && data.damageTaken !== 1) {
                    const percent = Math.round((data.damageTaken - 1) * 100);
                    modifiers.push(`Damage Taken ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (data.stats) {
                    Object.entries(data.stats).forEach(([stat, value]) => {
                        if (value !== 0) {
                            const statName = stat.toUpperCase();
                            modifiers.push(`${statName} ${value >= 0 ? '+' : ''}${value}`);
                        }
                    });
                }
                if (data.critBonus !== undefined && data.critBonus > 0) {
                    const percent = Math.round(data.critBonus * 100);
                    modifiers.push(`Crit +${percent}%`);
                }
                if (data.parryChance !== undefined && data.parryChance > 0) {
                    const percent = Math.round(data.parryChance * 100);
                    modifiers.push(`Parry +${percent}%`);
                }
                if (data.tauntChance !== undefined && data.tauntChance > 0) {
                    const percent = Math.round(data.tauntChance * 100);
                    modifiers.push(`Taunt +${percent}%`);
                }
                if (data.skillRangeBonus !== undefined && data.skillRangeBonus > 0) {
                    modifiers.push(`Skill Range +${data.skillRangeBonus}`);
                }

                if (modifiers.length > 0) {
                    parts.push(`Modifiers: ${modifiers.join(', ')}`);
                }

                return parts.join('\n');
            }

            // Helper for buffs not in effectsData (English)
            function buildBuffTooltipFromData(effect, buffData, displayName, displayDesc) {
                const parts = [];
                parts.push(`${displayName} (${effect.duration} turn${effect.duration !== 1 ? 's' : ''})`);
                if (displayDesc) parts.push(displayDesc);

                const modifiers = [];
                if (buffData.damageDealt !== undefined && buffData.damageDealt !== 1) {
                    const percent = Math.round((buffData.damageDealt - 1) * 100);
                    modifiers.push(`Damage Dealt ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (buffData.damageTaken !== undefined && buffData.damageTaken !== 1) {
                    const percent = Math.round((buffData.damageTaken - 1) * 100);
                    modifiers.push(`Damage Taken ${percent >= 0 ? '+' : ''}${percent}%`);
                }
                if (buffData.stats) {
                    Object.entries(buffData.stats).forEach(([stat, value]) => {
                        if (value !== 0) {
                            modifiers.push(`${stat.toUpperCase()} ${value >= 0 ? '+' : ''}${value}`);
                        }
                    });
                }
                if (buffData.critBonus !== undefined && buffData.critBonus > 0) {
                    modifiers.push(`Crit +${buffData.critBonus}%`);
                }
                if (buffData.flee !== undefined && buffData.flee > 0) {
                    modifiers.push(`Evasion +${buffData.flee}`);
                }
                if (buffData.hpRegen !== undefined && buffData.hpRegen > 0) {
                    modifiers.push(`HP Regen +${Math.round(buffData.hpRegen * 100)}%/turn`);
                }
                if (buffData.aspd !== undefined && buffData.aspd !== 0) {
                    modifiers.push(`ASPD ${buffData.aspd >= 0 ? '+' : ''}${buffData.aspd}`);
                }
                if (buffData.dotDamage !== undefined && buffData.dotDamage > 0) {
                    modifiers.push(`Damage/turn ${Math.round(buffData.dotDamage * 100)}%`);
                }
                if (buffData.skipTurn) {
                    modifiers.push(`Skip Turn`);
                }
                if (buffData.skillRangeBonus !== undefined && buffData.skillRangeBonus > 0) {
                    modifiers.push(`Skill Range +${buffData.skillRangeBonus}`);
                }

                if (modifiers.length > 0) {
                    parts.push(`Modifiers: ${modifiers.join(', ')}`);
                }

                return parts.join('\n');
            }

            // Status icons (buffs/debuffs)
            if (window.TacticalSkillEngine) {
                const statusIcons = document.createElement('div');
                statusIcons.className = 'timeline-status-icons';

                const activeEffects = window.TacticalSkillEngine.getActiveBuffsForDisplay(unit);
                activeEffects.forEach(effect => {
                    // Use effectsData if available, otherwise fallback to buff's own data
                    const effectData = window.effectsData?.[effect.data?.id];
                    const buffData = effect.data || {};

                    // Get display info from effectsData or fallback to buff's own data
                    const displayName = effectData?.name || buffData.name || buffData.id || 'Unknown';
                    const displayIcon = effectData?.lucide || buffData.icon || 'sparkles';
                    const displayPng = effectData?.png || null;
                    const displayDesc = effectData?.desc || buffData.desc || '';

                    const iconEl = document.createElement('div');
                    iconEl.className = `timeline-status-icon ${effect.type}`;

                    // Build detailed tooltip
                    const tooltip = effectData
                        ? buildBuffTooltip(effect, effectData)
                        : buildBuffTooltipFromData(effect, buffData, displayName, displayDesc);

                    // Try PNG first (from effectsData or skill path), then Lucide
                    if (displayPng) {
                        const img = document.createElement('img');
                        img.src = displayPng;
                        img.alt = displayName;
                        img.onerror = function () {
                            // Fallback to Lucide if image fails
                            this.style.display = 'none';
                            const lucideIcon = document.createElement('i');
                            lucideIcon.setAttribute('data-lucide', displayIcon);
                            this.parentNode.insertBefore(lucideIcon, this);
                            if (typeof lucide !== 'undefined') lucide.createIcons();
                        };
                        iconEl.appendChild(img);
                    } else {
                        // Try skill-based image path
                        const skillImg = `/public/assets/icons/skills/${effect.data?.id}.webp`;
                        const img = document.createElement('img');
                        img.src = skillImg;
                        img.alt = displayName;
                        img.onerror = function () {
                            // Fallback to Lucide if image fails
                            this.style.display = 'none';
                            const lucideIcon = document.createElement('i');
                            lucideIcon.setAttribute('data-lucide', displayIcon);
                            this.parentNode.insertBefore(lucideIcon, this);
                            if (typeof lucide !== 'undefined') lucide.createIcons();
                        };
                        iconEl.appendChild(img);
                    }

                    if (effect.duration > 0) {
                        const durationBadge = document.createElement('div');
                        durationBadge.className = 'status-duration-badge';
                        durationBadge.textContent = effect.duration;
                        iconEl.appendChild(durationBadge);
                    }

                    // Global Status Tooltip system (JS-based to avoid overflow clipping)
                    const tooltipContent = effectData ? buildBuffTooltip(effect, effectData) : buildBuffTooltipFromData(effect, buffData, displayName, displayDesc);

                    iconEl.onmouseenter = (e) => showStatusTooltip(e, tooltipContent);
                    iconEl.onmouseleave = () => hideStatusTooltip();

                    statusIcons.appendChild(iconEl);
                });

                if (activeEffects.length > 0) {
                    details.appendChild(statusIcons);
                    // Initialize lucide icons if needed
                    if (typeof lucide !== 'undefined') {
                        setTimeout(() => lucide.createIcons(), 10);
                    }
                }
            }

            cardEl.appendChild(details);

            // Click to select (if player unit)
            if (unit.type === 'player' && !gameState.unitsActedThisTurn.has(unit.id)) {
                cardEl.style.cursor = 'pointer';
                cardEl.onclick = () => {
                    const realUnit = playerUnits.find(u => u.id === unit.id);
                    if (realUnit && realUnit.hp > 0 && canUnitAct(realUnit)) {
                        selectUnit(realUnit);
                    }
                };
            }

            timeline.appendChild(cardEl);
        });
    }

    function showFloatingText(text, x, y, color = '#fff') {
        floatingTexts.push({
            text, x, y,
            life: 1.0, // 0 to 1
            color
        });
    }

    /**
     * Desenha o alcance de uma skill selecionada (PREMIUM STYLE - igual ao movimento)
     */
    function drawSkillRangeCells() {
        if (window.__rpgPerf?.skip?.highlights) return;
        if (skillRangeCells.length === 0 || !selectedSkillForPreview) {
            // Debug temporário para verificar por que não desenha
            if (gameState.currentAction === 'skill' && gameState.selectedSkill) {
                console.log('[DEBUG] drawSkillRangeCells skipped:', {
                    skillRangeCellsLength: skillRangeCells.length,
                    selectedSkillForPreview: selectedSkillForPreview?.id,
                    currentAction: gameState.currentAction,
                    selectedSkill: gameState.selectedSkill?.id
                });
            }
            return;
        }

        const pulse = (Math.sin(animationFrame / 15) + 1) / 2;
        const scan = (animationFrame % 80) / 80;

        skillRangeCells.forEach(cell => {
            // OTIMIZAÇÃO: Viewport culling
            if (!isCellVisible(cell.x, cell.y)) return;

            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // 1. Crystal Surface (Gradient roxo/magenta)
            const baseGrad = ctx.createLinearGradient(x, y, x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE);
            baseGrad.addColorStop(0, `rgba(168, 85, 247, ${0.3 + pulse * 0.1})`);
            baseGrad.addColorStop(1, `rgba(126, 34, 206, 0.1)`);
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

            // 3. Neon Frame (roxo)
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.5 + pulse * 0.5})`;
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

    /**
     * Desenha área de efeito da skill (PREMIUM STYLE - laranja/dourado)
     */
    function drawSkillAreaCells() {
        if (window.__rpgPerf?.skip?.highlights || skillAreaCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 10) + 1) / 2;
        const scan = (animationFrame % 60) / 60;

        skillAreaCells.forEach(cell => {
            // OTIMIZAÇÃO: Viewport culling
            if (!isCellVisible(cell.x, cell.y)) return;

            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // 1. Crystal Surface (Gradient laranja/dourado)
            const baseGrad = ctx.createLinearGradient(x, y, x + CONFIG.CELL_SIZE, y + CONFIG.CELL_SIZE);
            baseGrad.addColorStop(0, `rgba(251, 191, 36, ${0.35 + pulse * 0.15})`);
            baseGrad.addColorStop(1, `rgba(245, 158, 11, 0.15)`);
            ctx.fillStyle = baseGrad;
            ctx.fillRect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);

            // 2. Scanline Animation
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 1, y + 1, CONFIG.CELL_SIZE - 2, CONFIG.CELL_SIZE - 2);
            ctx.clip();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x, y + (CONFIG.CELL_SIZE * scan), CONFIG.CELL_SIZE, 3);
            ctx.restore();

            // 3. Neon Frame (dourado)
            ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = `rgba(253, 224, 71, ${0.6 + pulse * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
            ctx.shadowBlur = 0;

            // 4. Dot Accents
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(x + 2, y + 2, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + 2, 3, 3);
            ctx.fillRect(x + 2, y + CONFIG.CELL_SIZE - 5, 3, 3);
            ctx.fillRect(x + CONFIG.CELL_SIZE - 5, y + CONFIG.CELL_SIZE - 5, 3, 3);
        });
    }

    /**
     * Update and draw floating texts (MELHORADO 1000% - animação suave SEM GANGORRA)
     */
    function drawFloatingTexts() {
        if (window.__rpgPerf?.skip?.floatingTexts || floatingTexts.length === 0) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const now = performance.now();

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];

            // OTIMIZAÇÃO: Viewport culling para floating texts
            // Verificar antes de desenhar (após calcular posição)
            const screenX = ft.x * viewState.scale + viewState.x;
            const screenY = ft.y * viewState.scale + viewState.y;
            const isVisible = screenX > -100 && screenX < canvas.width + 100 &&
                screenY > -100 && screenY < canvas.height + 100;

            // Sistema de física PREMIUM estilo Ragnarok (parábola elegante)
            if (ft.usePhysics && ft.vx !== undefined && ft.vy !== undefined) {
                const elapsed = (now - ft.startTime) / 1000;
                const duration = ft.duration || 1.0;
                const progress = Math.min(elapsed / duration, 1);

                // Gravidade constante para arco elegante (Ragnarok style)
                // Para DANO: gravidade POSITIVA puxa para baixo após subir
                // Para HEAL/MANA: gravidade NEGATIVA mantém subindo
                let currentGravity;
                if (ft.isDamage) {
                    // DANO: gravidade positiva SUAVE para queda lenta e elegante
                    currentGravity = Math.abs(ft.gravity || 0.12);
                } else if (ft.isHeal || ft.isMana) {
                    // HEAL/MANA: gravidade negativa suave
                    currentGravity = -(Math.abs(ft.gravity || 0.15) * 0.2);
                } else {
                    currentGravity = ft.gravity || 0.12;
                }

                // Aplicar gravidade (constante e suave)
                ft.vy += currentGravity;

                // Aplicar velocidade com friction suave
                const friction = ft.friction || 0.99;
                ft.x += ft.vx;
                ft.y += ft.vy;
                ft.vx *= friction;

                // Life com fade out RÁPIDO - sumir antes de chegar no chão
                // Mantém opacidade alta até 50%, depois fade rápido
                if (progress < 0.5) {
                    ft.life = 1; // Mantém 100% opacidade na subida e início da queda
                } else if (progress < 0.7) {
                    ft.life = 1 - ((progress - 0.5) / 0.2) * 0.4; // 1 → 0.6 (fade médio)
                } else {
                    ft.life = 0.6 * Math.pow(1 - ((progress - 0.7) / 0.3), 3); // 0.6 → 0 (fade rápido cúbico)
                }

                // Escala que diminui elegantemente durante a queda
                if (progress < 0.2) {
                    // Pop-in inicial suave
                    ft.currentScale = 0.6 + (progress / 0.2) * 0.6; // 0.6 → 1.2
                } else if (progress < 0.5) {
                    ft.currentScale = 1.2; // Mantém escala máxima durante subida e início da queda
                } else {
                    // Diminui suavemente na queda (mas ainda visível)
                    const fallProgress = (progress - 0.5) / 0.5; // 0 → 1 durante queda
                    ft.currentScale = 1.2 * (1 - fallProgress * 0.3); // 1.2 → 0.84 (diminui pouco)
                }
            }
            // Animação suave de subida (sistema antigo para heal/mana/etc)
            else if (ft.startTime && ft.startY !== undefined) {
                const elapsed = (now - ft.startTime) / 1000;
                const duration = ft.duration || 2.2;
                const progress = Math.min(elapsed / duration, 1);

                // Easing suave
                const eased = 1 - Math.pow(1 - progress, 3);

                // Movimento vertical suave
                const totalRise = ft.riseDistance || (ft.size ? 80 : 50);
                ft.y = ft.startY - (totalRise * eased);

                ft.life = 1 - progress;
            } else {
                // Fallback: movimento simples
                ft.y -= ft.size ? 1.8 : 0.7;
                ft.life -= ft.size ? 0.016 : 0.014;
            }

            if (ft.life <= 0) {
                // OTIMIZAÇÃO: Devolver floating text ao pool ao invés de destruir
                releaseFloatingText(floatingTexts.splice(i, 1)[0]);
                continue;
            }

            // OTIMIZAÇÃO: Pular desenho se fora da tela (física já foi calculada acima)
            if (!isVisible) continue;

            // Escala: usa currentScale calculada para física, ou calcula para outros
            let scale;
            if (ft.usePhysics && ft.currentScale !== undefined) {
                // Usa escala calculada no sistema de física
                scale = ft.currentScale;
            } else if (ft.life > 0.9) {
                // Fase inicial: escala cresce de 0.8 para 1.2
                scale = 0.8 + (1 - ft.life) * 4;
            } else if (ft.life > 0.3) {
                // Fase média: mantém escala máxima
                scale = 1.2;
            } else {
                // Fase final: diminui suavemente
                scale = 1.2 * (ft.life / 0.3);
            }

            const baseSize = ft.baseSize || ft.size || 16;
            const fontSize = baseSize * scale;

            ctx.font = `900 ${fontSize}px "Cinzel", serif`;
            ctx.globalAlpha = Math.min(ft.life * 1.2, 1); // Alpha suave

            // Aplicar rotação leve (especialmente para críticos)
            if (ft.rotation) {
                ctx.save();
                ctx.translate(ft.x, ft.y);
                const rotationAmount = ft.rotation * (1 - ft.life * 0.5); // Rotação diminui gradualmente
                ctx.rotate(rotationAmount);
                ctx.translate(-ft.x, -ft.y);
            }

            // Gradiente de cor baseado no tipo
            let gradient;
            let shadowColor = 'rgba(0, 0, 0, 0.95)';
            let glowColor = null;

            if (ft.isHeal) {
                // CURA - Verde
                gradient = ctx.createLinearGradient(ft.x - fontSize, ft.y - fontSize, ft.x + fontSize, ft.y + fontSize);
                gradient.addColorStop(0, '#16a34a');
                gradient.addColorStop(0.5, '#22c55e');
                gradient.addColorStop(1, '#86efac');
                shadowColor = 'rgba(22, 163, 74, 0.8)';
                glowColor = '#22c55e';
            } else if (ft.isMana) {
                // MANA - Azul
                gradient = ctx.createLinearGradient(ft.x - fontSize, ft.y - fontSize, ft.x + fontSize, ft.y + fontSize);
                gradient.addColorStop(0, '#1d4ed8');
                gradient.addColorStop(0.5, '#3b82f6');
                gradient.addColorStop(1, '#93c5fd');
                shadowColor = 'rgba(59, 130, 246, 0.8)';
                glowColor = '#3b82f6';
            } else if (ft.isCrit) {
                // CRÍTICO - Dourado/Vermelho
                gradient = ctx.createLinearGradient(ft.x - fontSize, ft.y - fontSize, ft.x + fontSize, ft.y + fontSize);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#ff4444');
                gradient.addColorStop(1, '#ffffff');
                shadowColor = 'rgba(255, 0, 0, 0.9)';
                glowColor = '#ff0000';
            } else {
                // DANO NORMAL - Vermelho
                gradient = ctx.createLinearGradient(ft.x - fontSize, ft.y - fontSize, ft.x + fontSize, ft.y + fontSize);
                gradient.addColorStop(0, '#dc2626');
                gradient.addColorStop(0.5, '#ef4444');
                gradient.addColorStop(1, '#fca5a5');
            }

            // Sombra DRAMÁTICA
            ctx.shadowBlur = ft.isCrit ? 35 : (ft.isHeal || ft.isMana ? 20 : (ft.size ? 25 : 15));
            ctx.shadowColor = shadowColor;
            ctx.strokeStyle = ft.strokeColor || '#000';
            ctx.lineWidth = ft.isCrit ? 8 : (ft.size ? 7 : 4);
            ctx.strokeText(ft.text, ft.x, ft.y);

            // Texto principal com gradiente
            ctx.fillStyle = gradient;
            ctx.fillText(ft.text, ft.x, ft.y);

            // Efeito de brilho EXTRA para tipos especiais
            if (glowColor) {
                ctx.shadowBlur = 40;
                ctx.shadowColor = glowColor;
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = Math.min(ft.life * 0.6, 0.5);
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.globalAlpha = Math.min(ft.life * 1.2, 1);
            }

            if (ft.rotation) {
                ctx.restore();
            }
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

            // Atualizar hoveredUnit para z-index dinâmico
            if (hoveredUnit !== unitAtCell) {
                hoveredUnit = unitAtCell;
                needsRender = true;
            }

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

            // Preview de área de skill (hover)
            if (gameState.currentAction === 'skill' && gameState.selectedUnit && gameState.selectedSkill) {
                const inRange = skillRangeCells.some(c => c.x === col && c.y === row);
                if (inRange) {
                    skillAreaCells = calculateSkillArea(
                        gameState.selectedSkill,
                        col,
                        row,
                        gameState.selectedUnit.x,
                        gameState.selectedUnit.y
                    );
                } else {
                    skillAreaCells = [];
                }
                needsRender = true;
            }
        } else {
            hoveredCell = null;
            if (hoveredUnit !== null) {
                hoveredUnit = null;
                needsRender = true;
            }
            pathPreview = [];
            if (coordOverlay) coordOverlay.classList.remove('visible');
            canvas.style.cursor = 'default';
            if (gameState.currentAction === 'skill') {
                skillAreaCells = [];
                needsRender = true;
            }
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
        const wasDragging = isDragging;
        dragStartPos = null;
        if (!isDragging) {
            // It was a click, not a drag
        }
        isDragging = false;
        if (wasDragging) {
            saveCameraState();
        }
    }

    function handleClick(e) {
        if (isDragging || gameState.isAnimating) return;
        if (!gameState.freeExplore && gameState.phase !== 'player') return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = screenToWorld(mouseX, mouseY);
        const col = Math.floor(world.x / CONFIG.CELL_SIZE) + 1;
        const row = Math.floor(world.y / CONFIG.CELL_SIZE) + 1;

        // Modo debug: edição de paredes (prioridade sobre outras ações)
        // Permitir cliques mesmo que estejam um pouco fora dos limites (para cantos)
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive() && window.MapDebug.isEditingWalls && window.MapDebug.isEditingWalls()) {
            // Arredondar para a célula mais próxima se estiver próximo dos limites
            const clampedCol = Math.max(1, Math.min(CONFIG.GRID_COLS, Math.round(col)));
            const clampedRow = Math.max(1, Math.min(CONFIG.GRID_ROWS, Math.round(row)));
            // Verificar se o clique está dentro de uma margem razoável (até 0.5 células fora)
            const colInRange = col >= 0.5 && col <= CONFIG.GRID_COLS + 0.5;
            const rowInRange = row >= 0.5 && row <= CONFIG.GRID_ROWS + 0.5;
            if (colInRange && rowInRange) {
                toggleDebugWall(clampedCol, clampedRow);
                return; // Não processar clique normal quando editando paredes
            }
        }

        // Modo debug: permitir seleção de unidade para debug
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
            const clickedUnit = findUnitAtScreenPosition(mouseX, mouseY);
            if (clickedUnit && window.MapDebug.selectUnit) {
                window.MapDebug.selectUnit(clickedUnit);
                console.log('[DEBUG] Unidade selecionada no debug:', clickedUnit.name);
            }

            // Se debug está bloqueando cliques do jogo, não executar lógica normal
            if (window.MapDebug.isBlockingGameClicks && window.MapDebug.isBlockingGameClicks()) {
                return; // Bloquear handleCellClick
            }
        }

        handleCellClick(col, row);
    }

    // Encontra unidade baseada na posição visual do sprite ou quadrado azul (para debug)
    function findUnitAtScreenPosition(screenX, screenY) {
        const world = screenToWorld(screenX, screenY);

        // Verificar todas as unidades
        const allUnits = [...playerUnits, ...enemyUnits].filter(u => u.hp > 0);

        let closestUnit = null;
        let closestDistance = Infinity;

        for (const unit of allUnits) {
            // Converter posição da unidade para tela
            const unitScreen = worldToScreen(unit.x, unit.y);

            // Calcular distância do clique ao centro da unidade
            const distance = Math.sqrt(
                Math.pow(screenX - unitScreen.x, 2) +
                Math.pow(screenY - unitScreen.y, 2)
            );

            // 1. Verificar se clicou no quadrado azul (base) - prioridade máxima
            const baseSize = CONFIG.CELL_SIZE * 0.7;
            const baseHalf = baseSize / 2;
            const baseHalfScaled = baseHalf * viewState.scale;

            const dx = screenX - unitScreen.x;
            const dy = screenY - unitScreen.y;

            if (Math.abs(dx) <= baseHalfScaled && Math.abs(dy) <= baseHalfScaled) {
                // Clique no quadrado azul - prioriza se mais próximo
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestUnit = unit;
                }
            }

            // 2. Verificar se clicou no sprite (raio reduzido)
            const hitRadius = CONFIG.CELL_SIZE * 1.2 * viewState.scale;
            if (distance <= hitRadius && distance < closestDistance) {
                closestDistance = distance;
                closestUnit = unit;
            }
        }

        return closestUnit;
    }

    function handleCellClick(x, y) {
        const unitAtCell = getUnitAt(x, y);

        // Modo debug: selecionar unidade ao clicar para debug (não bloqueia ação normal)
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive() && unitAtCell && window.MapDebug.selectUnit) {
            window.MapDebug.selectUnit(unitAtCell);
            // Continua com a lógica normal (debug não bloqueia seleção/movimento/ataque)
        }

        if (gameState.freeExplore) {
            const hero = playerUnits[0];
            if (hero && (!unitAtCell || unitAtCell === hero)) {
                moveUnitToFree(hero, x, y);
            }
            return;
        }

        // ====================================
        // MODO DE ATAQUE (nova HUD tática)
        // ====================================
        if (gameState.currentAction === 'attacking' && attackRangeCells.length > 0) {
            const targetCell = attackRangeCells.find(c => c.x === x && c.y === y && c.hasEnemy);
            if (targetCell && targetCell.enemy) {
                attackRangeCells = [];
                gameState.currentAction = null;
                executeAttack(gameState.selectedUnit, targetCell.enemy).then(() => persistSessionState());
            } else {
                const enemyAtCell = unitAtCell && unitAtCell.type === 'enemy' ? unitAtCell : null;
                if (enemyAtCell) showRangeWarning();
                returnToNormalSelection();
            }
            return;
        }

        if (gameState.currentAction === 'skill' && gameState.selectedSkill && gameState.selectedUnit) {
            const caster = gameState.selectedUnit;
            const skill = gameState.selectedSkill;
            const rangeType = getSkillRangeType(skill);

            // Para skills self, não verificar range (já deveria ter sido executada imediatamente, mas por segurança)
            if (rangeType === 'self') {
                skillRangeCells = [];
                skillAreaCells = [];
                gameState.currentAction = null;
                gameState.selectedSkill = null;
                executeSkill(caster, caster, skill, [caster]).then(() => persistSessionState());
                return;
            }

            // Para outras skills, verificar range
            const inRange = skillRangeCells.some(c => c.x === x && c.y === y);
            if (!inRange) {
                returnToNormalSelection();
                return;
            }

            let targets = [];
            if (rangeType === 'ally' || rangeType === 'heal') {
                // Para skills ally/heal: alvo deve ser aliado (ou a própria célula para auto)
                const clickedUnit = unitAtCell;
                const isAlly = clickedUnit && clickedUnit.hp > 0 && (
                    (caster.type === 'enemy' && clickedUnit.type === 'enemy') ||
                    ((caster.type === 'player' || caster.type === 'ally') && (clickedUnit.type === 'player' || clickedUnit.type === 'ally'))
                );
                if (isAlly) {
                    targets = [clickedUnit];
                } else if (x === caster.x && y === caster.y) {
                    targets = [caster];
                } else {
                    returnToNormalSelection();
                    return;
                }
            } else {
                const area = calculateSkillArea(skill, x, y, caster.x, caster.y);
                let targetType;
                if (skill.type === 'ally' || skill.type === 'aoe_heal' || skill.type === 'heal')
                    targetType = (caster.type === 'enemy') ? 'enemy' : 'player';
                else
                    targetType = (caster.type === 'enemy') ? 'player' : 'enemy';
                // Debug: inimigo controlando pode usar skill de dano em player/ally OU em outros inimigos
                const isDamageTarget = (u) =>
                    u.type === targetType || (targetType === 'player' && u.type === 'ally') ||
                    (gameState.debugControlEnemy && caster.type === 'enemy' && u.type === 'enemy' && u.id !== caster.id);
                targets = [...playerUnits, ...enemyUnits].filter(u =>
                    u.hp > 0 && isDamageTarget(u) && area.some(cell => cell.x === u.x && cell.y === u.y)
                );
            }

            if (targets.length === 0) {
                returnToNormalSelection();
                return;
            }

            // Limpar estado de skill e executar
            skillRangeCells = [];
            skillAreaCells = [];
            gameState.currentAction = null;
            gameState.selectedSkill = null;

            executeSkill(caster, targets[0] || null, skill, targets).then(() => persistSessionState());
            return;
        }

        // 1. If we have a selected unit...
        if (gameState.selectedUnit && canUnitAct(gameState.selectedUnit)) {
            const unit = gameState.selectedUnit;

            // Click the current selected unit again -> Toggle menu
            if (unitAtCell === unit) {
                showTacticalHUD(unit);
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
            if (unitAtCell && ((unitAtCell.type === 'player' || unitAtCell.type === 'ally') || (gameState.debugControlEnemy && unitAtCell.type === 'enemy')) && canUnitAct(unitAtCell)) {
                if (!unit.hasMoved) {
                    selectUnit(unitAtCell);
                    return;
                } else {
                    showGlobalNotification('Finalize a ação atual primeiro!', 'warning', 'alert-circle');
                    return;
                }
            }

            // Click on attack target: player/ally vs enemy; enemy vs player/ally; ou (debug) inimigo vs outro inimigo
            const isAttackTarget = unitAtCell && (
                ((unit.type === 'player' || unit.type === 'ally') && unitAtCell.type === 'enemy') ||
                (unit.type === 'enemy' && (unitAtCell.type === 'player' || unitAtCell.type === 'ally')) ||
                (gameState.debugControlEnemy && unit.type === 'enemy' && unitAtCell.type === 'enemy' && unitAtCell.id !== unit.id)
            );
            if (isAttackTarget) {
                const dist = Math.max(Math.abs(unit.x - unitAtCell.x), Math.abs(unit.y - unitAtCell.y));
                if (dist <= (unit.attackRange || 1)) {
                    showAttackRange(unit);
                    showTacticalHUD(unit);
                    return;
                }
                showTopBanner('Use o botão Atacar ou Skills para atacar', 'info');
                return;
            }


            // Clicou em chão vazio ou célula irrelevante: voltar à seleção normal (sai de movimento/ataque/skill, mostra HUD)
            returnToNormalSelection();
        } else {
            // 2. Nada selecionado ou seleção que não pode agir: tentar selecionar aliado com ação
            if (unitAtCell && (unitAtCell.type === 'player' || unitAtCell.type === 'ally')) {
                // Só permitir selecionar se a unidade pode agir
                if (canUnitAct(unitAtCell)) {
                    selectUnit(unitAtCell);
                } else {
                    // Unidade já agiu: mostrar notificação e selecionar próxima disponível
                    showGlobalNotification('Esta unidade já agiu neste turno!', 'warning', 'alert-circle');
                    const nextAvailable = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
                    if (nextAvailable) {
                        selectUnit(nextAvailable);
                        animateCameraToUnit(nextAvailable);
                    }
                }
            } else if (gameState.selectedUnit) {
                returnToNormalSelection();
            } else {
                // Nenhuma unidade selecionada: selecionar automaticamente a próxima disponível
                const first = getFirstPlayerUnitBySpeed(gameState.unitsActedThisTurn);
                if (first) {
                    selectUnit(first);
                    animateCameraToUnit(first);
                }
            }
        }
    }

    /**
     * Find the best cell to stand on to attack a target
     */
    function findBestAttackPosition(unit, target) {
        const range = unit.attackRange || 1;

        // CRITICAL: If unit can already hit target from current position, DON'T MOVE
        const currentDist = Math.max(Math.abs(unit.x - target.x), Math.abs(unit.y - target.y));
        if (currentDist <= range) {
            return { x: unit.x, y: unit.y };
        }

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
                // NEW: Prioritize getting close to target AND staying straight
                const distToTarget = Math.max(Math.abs(target.x - cell.x), Math.abs(target.y - cell.y));

                if (distToTarget < minCost) {
                    minCost = distToTarget;
                    bestCell = cell;
                } else if (distToTarget === minCost) {
                    // Tie-breaker: prefer same row/column as unit (straighter path)
                    const currentManhattan = bestCell ? (Math.abs(unit.x - bestCell.x) + Math.abs(unit.y - bestCell.y)) : Infinity;
                    const thisManhattan = Math.abs(unit.x - cell.x) + Math.abs(unit.y - cell.y);
                    if (thisManhattan < currentManhattan) {
                        bestCell = cell;
                    }
                }
            }
        });

        return bestCell;
    }


    function handleWheel(e) {
        e.preventDefault();
        zoom(e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP, e.clientX, e.clientY);
    }

    async function handleKeyDown(e) {
        if (gameState.isAnimating) return;

        switch (e.key.toLowerCase()) {
            case 'escape':
                // Cancelar modo movimento/ataque/skill e voltar à seleção normal (nunca desselecionar no turno do jogador)
                returnToNormalSelection();
                break;
            case 'm':
                // Atalho para Mover
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player' && !gameState.selectedUnit.hasMoved) {
                    setAction('move');
                    hideTacticalHUD();
                }
                break;
            case 'a':
                // Atalho para Atacar
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player' && !gameState.unitsActedThisTurn.has(gameState.selectedUnit.id)) {
                    showAttackRange(gameState.selectedUnit);
                    showTacticalHUD(gameState.selectedUnit);
                }
                break;
            case 's':
                // Atalho para Skills
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player' && !gameState.unitsActedThisTurn.has(gameState.selectedUnit.id)) {
                    await showSkillMenu(gameState.selectedUnit);
                }
                break;
            case 'f':
                // Atalho para Flee/Pass (Finalizar Turno da Unidade)
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                    await finishUnitTurn(gameState.selectedUnit);
                }
                break;
            case 'e':
            case 'enter':
                // No contexto tático, E/Enter pode ser usado para encerrar turno global se nada selecionado
                // ou apenas mantido por retrocompatibilidade se desejado
                if (gameState.phase === 'player') {
                    // Se não houver unidade selecionada, encerra o turno global
                    if (!gameState.selectedUnit) {
                        endPlayerTurn();
                    }
                }
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

    // =====================================================
    // VIEWPORT CULLING - OTIMIZAÇÃO DE PERFORMANCE
    // =====================================================

    /**
     * Verifica se uma célula do grid está visível na tela
     * @param {number} cellX - Coordenada X da célula (1-indexed)
     * @param {number} cellY - Coordenada Y da célula (1-indexed)
     * @param {number} margin - Margem extra em pixels (para evitar pop-in)
     * @returns {boolean} true se a célula está visível
     */
    function isCellVisible(cellX, cellY, margin = 64) {
        const worldX = (cellX - 1) * CONFIG.CELL_SIZE;
        const worldY = (cellY - 1) * CONFIG.CELL_SIZE;
        const screenX = worldX * viewState.scale + viewState.x;
        const screenY = worldY * viewState.scale + viewState.y;
        const cellScreenSize = CONFIG.CELL_SIZE * viewState.scale;

        return screenX + cellScreenSize + margin > 0 &&
            screenX - margin < canvas.width &&
            screenY + cellScreenSize + margin > 0 &&
            screenY - margin < canvas.height;
    }

    /**
     * Verifica se uma unidade está visível na tela
     * @param {Object} unit - Unidade a verificar
     * @param {number} margin - Margem extra em pixels
     * @returns {boolean} true se a unidade está visível
     */
    function isUnitVisible(unit, margin = 128) {
        const worldX = (unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE);
        const worldY = (unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE);
        const screenX = worldX * viewState.scale + viewState.x;
        const screenY = worldY * viewState.scale + viewState.y;

        // Margem maior para unidades porque sprites podem ser maiores que a célula
        return screenX + margin > 0 &&
            screenX - margin < canvas.width &&
            screenY + margin > 0 &&
            screenY - margin < canvas.height;
    }

    /**
     * Retorna os limites de células visíveis no viewport atual
     * Útil para otimizar loops sobre células
     * @returns {Object} {startCol, endCol, startRow, endRow}
     */
    function getVisibleCellBounds() {
        const cellSize = CONFIG.CELL_SIZE * viewState.scale;
        const startCol = Math.max(1, Math.floor(-viewState.x / cellSize));
        const endCol = Math.min(CONFIG.GRID_COLS, Math.ceil((canvas.width - viewState.x) / cellSize) + 1);
        const startRow = Math.max(1, Math.floor(-viewState.y / cellSize));
        const endRow = Math.min(CONFIG.GRID_ROWS, Math.ceil((canvas.height - viewState.y) / cellSize) + 1);
        return { startCol, endCol, startRow, endRow };
    }

    // =====================================================
    // SPRITE FACING DIRECTION
    // =====================================================

    /**
     * Calcula se a unidade deve estar virada para direita baseado na direção do movimento
     * @param {Object} unit - Unidade a verificar
     * @param {number} targetX - Coordenada X de destino
     * @param {number} targetY - Coordenada Y de destino
     * @returns {boolean} true se deve estar virado para direita, false para esquerda
     */
    function calculateFacingFromMovement(unit, targetX, targetY) {
        // Durante movimento, usar direção do movimento
        if (targetX > unit.x) return true; // Movendo para direita
        if (targetX < unit.x) return false; // Movendo para esquerda
        // Se movimento vertical, manter direção atual
        return unit.facingRight || false;
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
            saveCameraState();
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
    function gameLoop(timestamp) {
        // FPS CAP: Pular frame se ainda não passou tempo suficiente
        const elapsed = timestamp - lastGameLoopTime;
        if (elapsed < FRAME_DURATION_MS) {
            requestAnimationFrame(gameLoop);
            return;
        }
        lastGameLoopTime = timestamp - (elapsed % FRAME_DURATION_MS);

        const _perfT0 = performance.now();
        const now = _perfT0;
        if (lastFrameTime !== undefined) {
            const deltaMs = Math.min(now - lastFrameTime, 200);
            animationTimeMs += deltaMs;
        }
        lastFrameTime = now;

        animationFrame++;
        minimapFrameCounter++;

        // Smooth camera
        if (cameraTarget) {
            const ease = cameraFollowEase ?? 0.1;
            viewState.x += (cameraTarget.x - viewState.x) * ease;
            viewState.y += (cameraTarget.y - viewState.y) * ease;
            viewState.scale += (cameraTarget.scale - viewState.scale) * ease;
            if (Math.abs(cameraTarget.x - viewState.x) < 1 &&
                Math.abs(cameraTarget.y - viewState.y) < 1) {
                cameraTarget = null;
                cameraFollowEase = null;
            }
            needsRender = true;
        }

        // OTIMIZAÇÃO: Só renderizar quando há atividade visual real
        // Detectar se há animações de sprite rodando (idle sempre roda, então considerar sempre ativo se há unidades)
        const hasActiveAnimations = playerUnits.some(u => u.hp > 0) || enemyUnits.some(u => u.hp > 0);
        const hasParticles = particles.length > 0;
        const hasFloatingTexts = floatingTexts.length > 0;
        const hasScreenShake = screenShake.intensity > 0;
        const hasHitFlash = hitFlash > 0;

        // Renderizar se: flag needsRender, animações do jogo, ou elementos visuais ativos
        const shouldRender = needsRender ||
            gameState.isAnimating ||
            hasActiveAnimations ||  // Sprites animados precisam atualizar
            hasParticles ||
            hasFloatingTexts ||
            hasScreenShake ||
            hasHitFlash;

        if (shouldRender) {
            if (!window.__rpgPerf?.skip?.particles) updateParticles();
            render();
            // OTIMIZAÇÃO: Minimap atualiza a cada N frames (não precisa ser em tempo real)
            if (!window.__rpgPerf?.skip?.minimap && minimapFrameCounter >= MINIMAP_UPDATE_INTERVAL) {
                renderMinimap();
                minimapFrameCounter = 0;
            }
            needsRender = false;
        }

        // Performance monitor (menu de otimização) – baixo custo
        if (window.__rpgPerf) {
            window.__rpgPerf.frameTimeMs = performance.now() - _perfT0;
            window.__rpgPerf.frameCount = (window.__rpgPerf.frameCount || 0) + 1;
            window.__rpgPerf.loadedImagesCount = Object.keys(loadedImages).length;
            window.__rpgPerf.spriteCacheSize = spriteCache.size;
            let sf = 0;
            for (const v of spriteCache.values()) {
                for (const a of [v && v.idle, v && v.walk, v && v.atack]) {
                    if (a && typeof a.frameCount === 'number') sf += a.frameCount;
                }
            }
            window.__rpgPerf.spriteCacheFrames = sf;
            window.__rpgPerf.floatingTexts = floatingTexts.length;
            window.__rpgPerf.particles = particles.length;
            window.__rpgPerf.units = playerUnits.filter(u => u.hp > 0).length + enemyUnits.filter(u => u.hp > 0).length;
            window.__rpgPerf.highlightCells = reachableCells.length + attackableCells.length + (skillRangeCells || []).length + (skillAreaCells || []).length + (attackRangeCells || []).length;
            window.__rpgPerf.animationFrame = animationFrame;
            // OTIMIZAÇÃO: Novas métricas de cache
            window.__rpgPerf.mapCacheActive = !mapCacheDirty && mapCacheCanvas !== null;
            window.__rpgPerf.renderSkipped = !shouldRender;
            if (animationFrame % 120 === 0) {
                let b = 0;
                for (const k of Object.keys(loadedImages)) {
                    const i = loadedImages[k];
                    if (i && i.naturalWidth) b += i.naturalWidth * i.naturalHeight * 4;
                }
                window.__rpgPerf.loadedImagesApproxBytes = b;
            }
        }

        requestAnimationFrame(gameLoop);
    }

    function render() {
        if (!ctx || !mapLoaded) return;

        // Clear with blueprint background
        drawBlueprintBackground();

        ctx.save();
        let shakeX = 0;
        let shakeY = 0;
        if (screenShake.intensity > 0) {
            shakeX = (Math.random() * 2 - 1) * screenShake.intensity;
            shakeY = (Math.random() * 2 - 1) * screenShake.intensity;
            screenShake.intensity *= screenShake.decay;
            if (screenShake.intensity < 0.1) {
                screenShake.intensity = 0;
            }
            needsRender = true;
        }
        ctx.translate(viewState.x + shakeX, viewState.y + shakeY);
        ctx.scale(viewState.scale, viewState.scale);

        // Map background with Tactical Focus (desaturação quando mostrar área de ataque ou movimento)
        // OTIMIZAÇÃO: Sistema de cache do mapa
        if (loadedImages.map && !window.__rpgPerf?.skip?.map) {
            const hasFocus = reachableCells.length > 0 || attackableCells.length > 0 || attackPreviewCells.length > 0 || attackRangeCells.length > 0;

            // Se o estado de foco mudou, marcar cache como dirty
            if (hasFocus !== mapCacheHasFocus) {
                mapCacheDirty = true;
                mapCacheHasFocus = hasFocus;
            }

            // Criar/regenerar cache se necessário
            if (mapCacheDirty || !mapCacheCanvas) {
                // Criar OffscreenCanvas se suportado, senão usar canvas normal
                if (!mapCacheCanvas) {
                    if (typeof OffscreenCanvas !== 'undefined') {
                        mapCacheCanvas = new OffscreenCanvas(MAP_WIDTH, MAP_HEIGHT);
                    } else {
                        mapCacheCanvas = document.createElement('canvas');
                        mapCacheCanvas.width = MAP_WIDTH;
                        mapCacheCanvas.height = MAP_HEIGHT;
                    }
                }

                const cacheCtx = mapCacheCanvas.getContext('2d');

                // Aplicar filtro se necessário
                if (hasFocus && !window.__rpgPerf?.skip?.mapFilter) {
                    cacheCtx.filter = 'grayscale(0.85) brightness(0.35)';
                } else {
                    cacheCtx.filter = 'none';
                }

                cacheCtx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
                cacheCtx.filter = 'none'; // Reset filter
                mapCacheDirty = false;
            }

            // Desenhar mapa do cache (muito mais rápido que redesenhar toda vez)
            ctx.drawImage(mapCacheCanvas, 0, 0);
        }

        // Highlights (These must pop, so drawn AFTER map but potentially before entities)
        drawReachableCells();
        drawAttackableCells();
        // drawAttackPreviewCells(); // Sistema antigo desativado
        drawSkillRangeCells(); // Purple skill range preview (tactical FFT-style)
        drawSkillAreaCells(); // Orange AoE preview
        drawAttackRange(); // Red attack range preview (tactical HUD)
        drawPathPreview();
        drawWallsOverlay(); // Desenhar paredes se o debug de paredes estiver ativo

        // Entities
        drawChests();
        drawPortal();

        // Desenhar unidades ordenadas por Y (de cima para baixo)
        // Unidade com Y maior (mais abaixo) é desenhada por último = na frente (evita "pisando")

        // Deslocamento horizontal quando 2+ unidades estão na mesma coluna em linhas adjacentes
        applyStackOffsetX();

        const allUnits = [
            ...enemyUnits.filter(u => u.hp > 0).map(u => ({ unit: u, type: 'enemy' })),
            ...playerUnits.filter(u => u.hp > 0).map(u => ({ unit: u, type: 'player' }))
        ]
            // OTIMIZAÇÃO: Viewport culling - filtrar unidades fora da tela
            .filter(({ unit }) => isUnitVisible(unit))
            .sort((a, b) => {
                // Ordenação por Y: maior Y (mais abaixo) é desenhado por último = na frente (evita "pisando")
                // Desempate por X para ordem determinística
                return a.unit.y - b.unit.y || a.unit.x - b.unit.x;
            });

        // Primeira passada: desenhar sprites (sem barras de HP)
        allUnits.forEach(({ unit, type }) => {
            drawUnitSprite(unit, type);
        });

        // Segunda passada: desenhar barras de HP (sempre por cima)
        allUnits.forEach(({ unit, type }) => {
            drawUnitBars(unit, type);
        });

        // Atmospheric Particles
        drawParticles();

        // Floating Texts
        drawFloatingTexts();

        // Hovered cell indicator
        drawHoveredCell();

        // Flash global de hit
        if (hitFlash > 0) {
            ctx.save();
            ctx.globalAlpha = hitFlash;
            ctx.fillStyle = 'rgba(255, 220, 150, 0.35)';
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.restore();
            hitFlash *= 0.85;
            if (hitFlash < 0.02) hitFlash = 0;
        }

        ctx.restore();

        // Draw rulers on top (after restore, so they're fixed on screen)
        drawRulers();
    }

    /** Fundo preto + blueprint (linhas em coords de tela apenas no fundo; o mapa é desenhado depois e cobre o centro). */
    function drawBlueprintBackground() {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Blueprint no fundo preto (margens) — em pixels de tela; o mapa desenhado depois cobre e esconde onde tem mapa
        const grid = 32;
        const major = 128;
        ctx.strokeStyle = 'rgba(30, 70, 120, 0.18)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(40, 90, 150, 0.22)';
        for (let x = 0; x <= canvas.width; x += major) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += major) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * Desenha um overlay vermelho sobre as paredes do mapa (Modo Debug)
     */
    function drawWallsOverlay() {
        if (!window.MapDebug || !window.MapDebug.isActive || !window.MapDebug.isActive()) return;

        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Vermelho semitransparente (red-500)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 1.5;

        // Desenhar paredes originais (fixas)
        WALLS.forEach(w => {
            // Só desenhar se não estiver na lista de removidas
            const isRemoved = debugWallsRemoved.some(rw => rw.x === w.x && rw.y === w.y);
            if (!isRemoved) {
                const screenX = (w.x - 1) * CONFIG.CELL_SIZE;
                const screenY = (w.y - 1) * CONFIG.CELL_SIZE;
                ctx.fillRect(screenX, screenY, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
                ctx.strokeRect(screenX, screenY, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
            }
        });

        // Desenhar paredes novas (adicionadas)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Vermelho semitransparente (red-500)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        debugWallsAdded.forEach(w => {
            const screenX = (w.x - 1) * CONFIG.CELL_SIZE;
            const screenY = (w.y - 1) * CONFIG.CELL_SIZE;
            ctx.fillRect(screenX, screenY, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
            ctx.strokeRect(screenX, screenY, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        });

        ctx.restore();
    }

    function drawRulers() {
        if (window.__rpgPerf?.skip?.rulers) return;
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

    function drawReachableCells() {
        if (window.__rpgPerf?.skip?.highlights || reachableCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 15) + 1) / 2;
        const scan = (animationFrame % 80) / 80;

        // OTIMIZAÇÃO: Pré-calcular cores fora do loop (evita criar gradients por célula)
        const fillAlpha = 0.25 + pulse * 0.1;
        const strokeAlpha = 0.5 + pulse * 0.5;

        reachableCells.forEach(cell => {
            // OTIMIZAÇÃO: Viewport culling - pular células fora da tela
            if (!isCellVisible(cell.x, cell.y)) return;

            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // 1. Crystal Surface - cor sólida em vez de gradient (muito mais rápido)
            ctx.fillStyle = `rgba(59, 130, 246, ${fillAlpha})`;
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
            ctx.strokeStyle = `rgba(96, 165, 250, ${strokeAlpha})`;
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
        if (window.__rpgPerf?.skip?.highlights || attackableCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 8) + 1) / 2;

        // OTIMIZAÇÃO: Pré-calcular cores e valores fora do loop
        const fillAlpha = 0.18 + pulse * 0.12;
        const strokeAlpha = 0.6 + pulse * 0.4;
        const reticleAlpha = 0.3 + pulse * 0.3;
        const padding = 2;

        attackableCells.forEach(cell => {
            // OTIMIZAÇÃO: Viewport culling
            if (!isCellVisible(cell.x, cell.y)) return;

            const x = (cell.x - 1) * CONFIG.CELL_SIZE;
            const y = (cell.y - 1) * CONFIG.CELL_SIZE;

            // Fill - cor sólida em vez de gradient radial (muito mais rápido)
            ctx.fillStyle = `rgba(239, 68, 68, ${fillAlpha})`;
            ctx.fillRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);

            // Border - SEM shadowBlur (muito caro)
            ctx.strokeStyle = `rgba(248, 113, 113, ${strokeAlpha})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + padding, y + padding, CONFIG.CELL_SIZE - padding * 2, CONFIG.CELL_SIZE - padding * 2);

            // Target reticle
            const cx = x + CONFIG.CELL_SIZE / 2;
            const cy = y + CONFIG.CELL_SIZE / 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${reticleAlpha})`;
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
        if (window.__rpgPerf?.skip?.highlights || pathPreview.length === 0) return;

        const pulse = (Math.sin(animationFrame / 8) + 1) / 2;
        const steps = pathPreview.length;

        pathPreview.forEach((p, index) => {
            const x = (p.x - 1) * CONFIG.CELL_SIZE;
            const y = (p.y - 1) * CONFIG.CELL_SIZE;

            // Ghost path com fade progressivo
            const ratio = (index + 1) / steps;
            const op = 0.2 + ratio * 0.6 + pulse * 0.1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * op})`;
            ctx.fillRect(x + 8, y + 8, CONFIG.CELL_SIZE - 16, CONFIG.CELL_SIZE - 16);

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * op})`;
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

        // Destino com pulse e custo do caminho
        const last = pathPreview[pathPreview.length - 1];
        const lx = (last.x - 0.5) * CONFIG.CELL_SIZE;
        const ly = (last.y - 0.5) * CONFIG.CELL_SIZE;
        const pulseRadius = 14 + pulse * 6;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Sem número de passos (já existe coordenada da célula)
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

        // Cantos em L alinhados ao tamanho da célula (s = metade do CELL_SIZE)
        const s = CONFIG.CELL_SIZE / 2;
        const l = Math.max(6, CONFIG.CELL_SIZE * 0.125);
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

        // Coordenadas removidas - já são mostradas no topo da tela
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

    // Funções wrapper para o novo sistema de renderização em camadas
    function drawUnitSprite(unit, type) {
        if (window.__rpgPerf?.skip?.sprites) return;
        unit._skipBars = true;
        drawUnit(unit, type);
        unit._skipBars = false;
    }

    function drawUnitBars(unit, type) {
        if (window.__rpgPerf?.skip?.unitBars) return;
        if (unit.hp === undefined) return;

        const cx = (unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE) + (unit._stackOffsetX || 0);
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;
        const radius = CONFIG.CELL_SIZE * 0.45;

        // Calcular posição das barras baseada SEMPRE na animação IDLE para manter fixa
        const entityId = getEntityIdForUnit(unit);
        const spriteAnimations = entityId ? spriteCache.get(entityId) : null;

        // Sempre usar 'idle' para calcular a altura da barra, a menos que não exista
        const barAnimState = (spriteAnimations && spriteAnimations.idle) ? 'idle' : (unit.animationState || 'idle');
        const spriteSheet = spriteAnimations ? spriteAnimations[barAnimState] : null;
        const hasSprite = spriteSheet && spriteSheet.loaded && spriteSheet.frameCount > 0;

        let barY;
        if (hasSprite) {
            // Calcular spriteTopY baseado na configuração da animação IDLE
            let animConfig = null;
            if (unit.animations && unit.animations[barAnimState]) {
                animConfig = unit.animations[barAnimState];
            }

            const baseScale = animConfig?.animationScale ?? unit.animationScale ?? 2.0;
            // No debug, se estivermos mexendo na escala do IDLE, refletir aqui
            let scaleMultiplier = baseScale;
            if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                const debugAnimationState = window.MapDebug.getAnimationState ? window.MapDebug.getAnimationState() : null;
                if (debugSelectedUnit === unit && debugAnimationState === 'idle' && unit.debugScale !== undefined) {
                    scaleMultiplier = unit.debugScale;
                }
            }

            const targetBaseWidth = CONFIG.CELL_SIZE * scaleMultiplier;
            const scale = targetBaseWidth / spriteSheet.baseWidth;
            const scaledHeight = spriteSheet.height * scale;
            const baseSizeSprite = CONFIG.CELL_SIZE * 0.7;
            const baseHalfSprite = baseSizeSprite / 2;

            const baseOffsetY = animConfig?.animationOffsetY !== undefined
                ? animConfig.animationOffsetY
                : (unit.animationOffsetY !== undefined ? unit.animationOffsetY : DEFAULT_SPRITE_OFFSET_Y);

            let drawY = -baseHalfSprite - scaledHeight + baseOffsetY;

            // Aplicar offset de renderização global (knockback etc)
            if (unit.renderOffsetY !== undefined) drawY += unit.renderOffsetY;

            // Posicionar barra acima do sprite (subir 20px a mais)
            barY = drawY - 18;
        } else {
            barY = -radius - 36;
        }

        ctx.save();
        ctx.translate(cx, cy);

        const barW = radius * 1.8;
        const barH = 6;
        const barRadius = 3;
        const bx = -barW / 2;
        const hpPct = Math.max(0, unit.hp / unit.maxHp);

        // HP Bar Background
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(bx - 1, barY - 1, barW + 2, barH + 2, barRadius + 1);
        ctx.fill();
        ctx.shadowBlur = 0;

        // HP Bar Fill
        if (hpPct > 0) {
            let hpGrad;
            if (hpPct > 0.5) {
                hpGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
                hpGrad.addColorStop(0, '#4ade80');
                hpGrad.addColorStop(0.5, '#22c55e');
                hpGrad.addColorStop(1, '#16a34a');
            } else if (hpPct > 0.25) {
                hpGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
                hpGrad.addColorStop(0, '#fbbf24');
                hpGrad.addColorStop(0.5, '#f59e0b');
                hpGrad.addColorStop(1, '#d97706');
            } else {
                const critPulse = (Math.sin(animationFrame / 5) + 1) / 2;
                hpGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
                hpGrad.addColorStop(0, `rgba(248,113,113,${0.8 + critPulse * 0.2})`);
                hpGrad.addColorStop(0.5, '#ef4444');
                hpGrad.addColorStop(1, '#dc2626');
            }

            ctx.fillStyle = hpGrad;
            ctx.beginPath();
            ctx.roundRect(bx, barY, barW * hpPct, barH, barRadius);
            ctx.fill();

            // Glass shine
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath();
            ctx.roundRect(bx, barY, barW * hpPct, barH / 2, [barRadius, barRadius, 0, 0]);
            ctx.fill();
        }

        // Border glow for selected
        if (gameState.selectedUnit === unit) {
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#60a5fa';
            ctx.beginPath();
            ctx.roundRect(bx - 1, barY - 1, barW + 2, barH + 2, barRadius + 1);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    function drawUnit(unit, type) {
        const cx = (unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE) + (unit._stackOffsetX || 0);
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;

        const isSelected = gameState.selectedUnit === unit;
        const hasActed = gameState.unitsActedThisTurn.has(unit.id);
        const isCurrentPhase = gameState.phase === type;
        const canStillAct = unit.hp > 0 && !hasActed;

        const img = loadedImages[unit.id];
        const entityId = getEntityIdForUnit(unit);
        const spriteAnimations = entityId ? spriteCache.get(entityId) : null;

        // DEBUG: Verificar se imagens desaparecem quando debug é ativado
        if (window.DEBUG_MODE && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive() && unit.id && !unit._debugCheckLogged) {
            unit._debugCheckLogged = true;
            console.log(`[drawUnit DEBUG-CHECK] ${unit.id}: loadedImages[${unit.id}]=${loadedImages[unit.id] ? `Image(${loadedImages[unit.id].width}x${loadedImages[unit.id].height})` : 'undefined'}, img=${img ? 'exists' : 'null'}, avatar=${unit.avatar}`);
        }

        // Obter estado de animação da unidade
        // Todos começam e voltam para idle; debug pode forçar idle/walk/atack.
        let animationState;
        const isDebugActive = window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive();
        const debugSelectedUnit = isDebugActive && window.MapDebug.getSelectedUnit ? window.MapDebug.getSelectedUnit() : null;
        const shouldApplyDebugAnimation = isDebugActive && debugSelectedUnit === unit;

        if (shouldApplyDebugAnimation) {
            const debugAnimationState = window.MapDebug.getAnimationState ? window.MapDebug.getAnimationState() : null;
            animationState = (debugAnimationState !== null && debugAnimationState !== '') ? debugAnimationState : (unit.animationState || 'idle');
        } else {
            animationState = unit.animationState || 'idle';
        }

        // Se a animação solicitada não existir, usar idle como fallback
        if (spriteAnimations) {
            if (animationState === 'walk' && (!spriteAnimations.walk || !spriteAnimations.walk.loaded)) {
                animationState = 'idle';
            } else if (animationState === 'atack' && (!spriteAnimations.atack || !spriteAnimations.atack.loaded)) {
                animationState = 'idle';
            }
        }

        const spriteSheet = spriteAnimations ? spriteAnimations[animationState] : null;

        // Verificar se há sprite disponível ou avatar
        const hasSprite = spriteSheet && spriteSheet.loaded && spriteSheet.frameCount > 0;
        // Avatar está disponível se: existe no loadedImages E (está completo OU tem width/height > 0)
        // IMPORTANTE: Verificar se existe no loadedImages, não apenas se img é truthy
        const hasAvatar = loadedImages[unit.id] !== undefined &&
            loadedImages[unit.id] !== null &&
            loadedImages[unit.id] instanceof Image &&
            (loadedImages[unit.id].complete || (loadedImages[unit.id].width > 0 && loadedImages[unit.id].height > 0));

        // DEBUG: Verificar por que não renderiza quando debug está ativo
        if (window.DEBUG_MODE && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive() && unit.id && !hasSprite && !hasAvatar && !unit._debugSkipLogged) {
            unit._debugSkipLogged = true;
            console.warn(`[drawUnit DEBUG-SKIP] ${unit.id} NÃO SERÁ RENDERIZADO: hasSprite=${hasSprite}, hasAvatar=${hasAvatar}, loadedImages[${unit.id}]=${loadedImages[unit.id] ? `Image(${loadedImages[unit.id].width}x${loadedImages[unit.id].height}, complete=${loadedImages[unit.id].complete})` : 'undefined'}, avatar=${unit.avatar}`);
        }

        // Se não tiver sprite nem avatar, não renderizar
        if (!hasSprite && !hasAvatar) {
            return;
        }

        ctx.save();
        ctx.translate(cx, cy);

        // Aplicar opacidade reduzida se marcado (inimigo acima está em hover)
        if (unit._tempFadeOpacity !== undefined) {
            ctx.globalAlpha = unit._tempFadeOpacity;
        }

        const radius = CONFIG.CELL_SIZE * 0.45;
        const baseSize = CONFIG.CELL_SIZE * 0.7; // Tamanho base para cálculos
        const baseHalf = baseSize / 2;

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

            // Tactical Sonar Pulse Ring — só borda branca, fina e discreta; perto do fim some devagar
            const cycle = 180;
            const ping = (animationFrame % cycle) / cycle;
            const range = unit.attackRange ?? 1;
            const maxRadius = (range + 0.5) * CONFIG.CELL_SIZE;
            const pulseRadius = ping * maxRadius;
            // Fade só na reta final: até ~70% mantém; depois desce suave até 0 (não abrupto)
            const alpha = ping < 0.7 ? 0.48 : 0.48 * (1 - (ping - 0.7) / 0.3);

            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Sistema de mira removido (mapCombat descontinuado)

        // 2. Base Square REMOVIDO (usuário solicitou remover o quadrado azul)

        // OTIMIZAÇÃO: Sombra oval pré-renderizada em cache (evita criar gradients por unidade)
        // Usamos baseHalf para determinar tamanho da sombra
        const shadowSize = Math.ceil(baseHalf * 2.5); // Tamanho do canvas de sombra

        // Criar/atualizar cache se necessário
        if (!unitShadowCache || unitShadowCacheSize < shadowSize) {
            unitShadowCacheSize = shadowSize;
            unitShadowCache = document.createElement('canvas');
            unitShadowCache.width = shadowSize * 2;
            unitShadowCache.height = shadowSize;
            const sctx = unitShadowCache.getContext('2d');

            // Centro do canvas de sombra
            const cx = shadowSize;
            const cy = shadowSize * 0.5;
            const radiusX = shadowSize * 0.92;
            const radiusY = shadowSize * 0.304;

            // Sombra principal
            const shadowGrad = sctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX);
            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
            shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
            shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sctx.fillStyle = shadowGrad;
            sctx.beginPath();
            sctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
            sctx.fill();

            // Sombra interna
            const innerGrad = sctx.createRadialGradient(cx, cy, 0, cx, cy, radiusX * 0.35);
            innerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
            innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sctx.fillStyle = innerGrad;
            sctx.beginPath();
            sctx.ellipse(cx, cy, radiusX * 0.45, radiusY * 0.55, 0, 0, Math.PI * 2);
            sctx.fill();
        }

        // Desenhar sombra do cache (muito mais rápido que criar gradients)
        const shadowDrawWidth = baseHalf * 2.3;
        const shadowDrawHeight = baseHalf * 0.76;
        const shadowOffsetY = baseHalf * 0.30;
        ctx.drawImage(
            unitShadowCache,
            -shadowDrawWidth / 2,
            shadowOffsetY - shadowDrawHeight / 2,
            shadowDrawWidth,
            shadowDrawHeight
        );

        // 3. Unit Sprite or Avatar Circle (desenhar DEPOIS do quadrado para ficar em cima)
        // Variável para armazenar topo do sprite (usado para posicionar barras)
        let spriteTopY = null;

        ctx.save();

        // Se tiver sprite disponível, usar sprite animado (REMOVE avatar circular)
        if (hasSprite) {
            const drawSpriteFrame = (sheet, frame, extraOffsetX = 0, extraOffsetY = 0, alpha = 1, isGhost = false, useDebugOverrides = true, animState = null) => {
                if (!frame || !sheet) return;

                // Buscar configurações específicas da animação (passada ou estado atual)
                // animState permite que a comparação use suas próprias configurações
                const stateForConfig = animState || animationState;
                let animConfig = null;
                if (unit.animations && unit.animations[stateForConfig]) {
                    animConfig = unit.animations[stateForConfig];
                }

                const baseScale = animConfig?.animationScale !== undefined
                    ? animConfig.animationScale
                    : (unit.animationScale !== undefined ? unit.animationScale : 2.0);
                let scaleMultiplier = baseScale;
                if (useDebugOverrides && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                    const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                    if (debugSelectedUnit === unit && unit.debugScale !== undefined) {
                        scaleMultiplier = unit.debugScale;
                    } else {
                        scaleMultiplier = baseScale;
                    }
                } else {
                    scaleMultiplier = baseScale;
                }
                const targetBaseWidth = CONFIG.CELL_SIZE * scaleMultiplier;
                const scale = targetBaseWidth / sheet.baseWidth;
                const scaledWidth = sheet.width * scale;
                const scaledHeight = sheet.height * scale;
                const baseSizeSprite = CONFIG.CELL_SIZE * 0.7;
                const baseHalfSprite = baseSizeSprite / 2;
                const anchorX = sheet.anchor.x || 0.5;
                const anchorY = sheet.anchor.y || 1.0;
                let drawX = -(scaledWidth * anchorX);
                let drawY = -baseHalfSprite - scaledHeight;

                const baseOffsetX = animConfig?.animationOffsetX !== undefined
                    ? animConfig.animationOffsetX
                    : (unit.animationOffsetX !== undefined ? unit.animationOffsetX : DEFAULT_SPRITE_OFFSET_X);
                const baseOffsetY = animConfig?.animationOffsetY !== undefined
                    ? animConfig.animationOffsetY
                    : (unit.animationOffsetY !== undefined ? unit.animationOffsetY : DEFAULT_SPRITE_OFFSET_Y);
                // Quando facingRight: usar animationOffsetXWhenFacingRight da ficha se existir; senão espelhar -baseOffsetX.
                // Os offsets na ficha devem compensar o flip: offsetX = esquerda, offsetXWhenFacingRight = direita.
                const effOffsetX = unit.facingRight
                    ? (animConfig?.animationOffsetXWhenFacingRight !== undefined ? animConfig.animationOffsetXWhenFacingRight : -baseOffsetX)
                    : baseOffsetX;
                if (useDebugOverrides && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                    const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                    if (debugSelectedUnit === unit) {
                        const dx = (unit.debugOffsetX !== undefined) ? unit.debugOffsetX : baseOffsetX;
                        const offsetX = unit.facingRight ? -dx : dx;
                        const offsetY = (unit.debugOffsetY !== undefined) ? unit.debugOffsetY : baseOffsetY;
                        drawX += offsetX;
                        drawY += offsetY;
                    } else {
                        drawX += effOffsetX;
                        drawY += baseOffsetY;
                    }
                } else {
                    drawX += effOffsetX;
                    drawY += baseOffsetY;
                }
                drawX += extraOffsetX;
                drawY += extraOffsetY;

                // Aplicar offset de knockback/render
                if (unit.renderOffsetX !== undefined) drawX += unit.renderOffsetX;
                if (unit.renderOffsetY !== undefined) drawY += unit.renderOffsetY;

                if (!isGhost) {
                    spriteTopY = drawY;
                }

                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = alpha;

                // Efeito de flash vermelho - desenhar sprite com tint vermelho
                // OTIMIZAÇÃO: Reutilizar canvas em vez de criar novo a cada frame
                if (unit.hitFlash && unit.hitFlash > 0 && !isGhost) {
                    // Garantir que o canvas reutilizável existe e tem tamanho suficiente
                    const neededWidth = frame.width;
                    const neededHeight = frame.height;

                    if (!hitFlashCanvas || hitFlashCanvas.width < neededWidth || hitFlashCanvas.height < neededHeight) {
                        // Criar ou redimensionar canvas (raro, só quando frame é maior que anterior)
                        hitFlashCanvas = document.createElement('canvas');
                        hitFlashCanvas.width = Math.max(neededWidth, hitFlashCanvas?.width || 0, 256);
                        hitFlashCanvas.height = Math.max(neededHeight, hitFlashCanvas?.height || 0, 256);
                        hitFlashCtx = hitFlashCanvas.getContext('2d');
                    }

                    // Limpar área usada e desenhar sprite original
                    hitFlashCtx.globalCompositeOperation = 'source-over';
                    hitFlashCtx.clearRect(0, 0, neededWidth, neededHeight);
                    hitFlashCtx.drawImage(frame, 0, 0);

                    // Aplicar overlay vermelho apenas nos pixels não-transparentes
                    hitFlashCtx.globalCompositeOperation = 'source-atop';
                    hitFlashCtx.fillStyle = `rgba(255, 0, 0, ${unit.hitFlash * 0.5})`;
                    hitFlashCtx.fillRect(0, 0, neededWidth, neededHeight);

                    // Desenhar o sprite com tint
                    if (unit.facingRight) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        // Flip horizontal: flippedDrawX preserva o centro do sprite (anchor 0.5) na mesma posição
                        const flippedDrawX = -drawX - scaledWidth;
                        ctx.drawImage(hitFlashCanvas, 0, 0, neededWidth, neededHeight, flippedDrawX, drawY, scaledWidth, scaledHeight);
                        ctx.restore();
                    } else {
                        ctx.drawImage(hitFlashCanvas, 0, 0, neededWidth, neededHeight, drawX, drawY, scaledWidth, scaledHeight);
                    }
                } else {
                    // Desenhar sprite normal
                    if (unit.facingRight) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        // Flip horizontal: flippedDrawX preserva o centro do sprite (anchor 0.5 = ponto de origem no meio)
                        const flippedDrawX = -drawX - scaledWidth;
                        ctx.drawImage(frame, flippedDrawX, drawY, scaledWidth, scaledHeight);
                        ctx.restore();
                    } else {
                        ctx.drawImage(frame, drawX, drawY, scaledWidth, scaledHeight);
                    }
                }

                ctx.globalAlpha = prevAlpha;
            };

            // Calcular direção: player/aliados mantêm facing do movimento; inimigos viram para o player
            if (!gameState.isAnimating) {
                const isEnemy = unit.type === 'enemy';
                if (isEnemy && playerUnits.length > 0) {
                    const player = playerUnits[0];
                    if (player && player.hp > 0) {
                        const playerWorldX = (player.x - 0.5) * CONFIG.CELL_SIZE;
                        const unitWorldX = (unit.x - 0.5) * CONFIG.CELL_SIZE;
                        unit.facingRight = playerWorldX > unitWorldX;
                    }
                }
            }

            let blendHandled = false;
            if (unit.animationBlend && spriteAnimations) {
                const { from, to, start, duration } = unit.animationBlend;
                const fromSheet = spriteAnimations[from];
                const toSheet = spriteAnimations[to];
                if (fromSheet?.loaded && toSheet?.loaded) {
                    const t = Math.min((performance.now() - start) / duration, 1);
                    const fromIndex = getCurrentSpriteFrameIndex(spriteAnimations, from, unit);
                    const toIndex = getCurrentSpriteFrameIndex(spriteAnimations, to, unit);
                    const fromFrame = fromSheet.frames[fromIndex];
                    const toFrame = toSheet.frames[toIndex];
                    if (fromFrame && toFrame) {
                        drawSpriteFrame(fromSheet, fromFrame, 0, 0, 1 - t, false, true, from);
                        drawSpriteFrame(toSheet, toFrame, 0, 0, t, false, true, to);
                        blendHandled = true;
                    }
                    if (t >= 1) {
                        unit.animationBlend = null;
                    }
                }
            }

            if (!blendHandled) {
                const frameIndex = getCurrentSpriteFrameIndex(spriteAnimations, animationState, unit);
                const frameImg = spriteSheet.frames[frameIndex];

                if (frameImg) {
                    drawSpriteFrame(spriteSheet, frameImg, 0, 0, 1, false, true, animationState);

                    // Comparação de animações (debug)
                    if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                        const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                        if (debugSelectedUnit === unit && window.MapDebug.shouldCompareAnimations && window.MapDebug.shouldCompareAnimations() && spriteAnimations) {
                            const altState = animationState === 'idle' ? 'walk' : 'idle';
                            const altSheet = spriteAnimations[altState];
                            if (altSheet && altSheet.loaded && altSheet.frameCount > 0) {
                                const altIndex = getCurrentSpriteFrameIndex(spriteAnimations, altState, unit, false);
                                const altFrame = altSheet.frames[altIndex];
                                if (altFrame) {
                                    const compareOffset = window.MapDebug.getCompareOffset ? window.MapDebug.getCompareOffset() : 60;
                                    drawSpriteFrame(altSheet, altFrame, compareOffset, 0, 0.6, true, false, altState);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Fallback: Avatar circular (apenas se não tiver sprite)
            if (img) {
                ctx.save();

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
            }
        }

        ctx.restore();

        // 3.5. Overlay Vermelho de Dano (Flash Red)
        if (unit.flashRed) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = 'red';

            // Desenhar retângulo vermelho sobre a célula
            const cellX = (unit.x - 1) * CONFIG.CELL_SIZE - cx;
            const cellY = (unit.y - 1) * CONFIG.CELL_SIZE - cy;
            ctx.fillRect(cellX, cellY, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

            ctx.restore();
        }

        // 4. Action Completed Badge REMOVIDO (usuário solicitou apenas o chip WAIT)

        // 4. Intent/Status badge (WAIT para quem já agiu)
        if (hasActed || (unit.type === 'enemy' && unit.intent)) {
            const label = hasActed ? 'WAIT' : (unit.intent === 'attack' ? 'ATK' : (unit.intent === 'move' ? 'MOV' : 'WAIT'));
            const badgeY = (spriteTopY !== null && spriteTopY < 0) ? spriteTopY - 26 : -radius - 24;
            ctx.save();
            ctx.font = 'bold 10px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textW = ctx.measureText(label).width;
            const bw = Math.max(28, textW + 10);
            const bx = -bw / 2;
            const by = badgeY - 7;

            // Cor do badge: cinza para WAIT, azul para MOV, vermelho para ATK
            let color = 'rgba(148, 163, 184, 0.9)'; // Default WAIT (zinc-400)
            if (!hasActed) {
                if (unit.intent === 'attack') color = 'rgba(239, 68, 68, 0.9)';
                else if (unit.intent === 'move') color = 'rgba(59, 130, 246, 0.9)';
            }

            ctx.fillStyle = color;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, 14, 6);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(label, 0, by + 7);
            ctx.restore();
        }

        // 5. Premium Tactical Status Bars (HP/SP) - Movido antes da seta para calcular posição
        // Pular se estiver no modo de renderização em camadas (barras são desenhadas separadamente)
        if (unit.hp !== undefined && !unit._skipBars) {
            const barW = radius * 1.8;
            const barH = 6;
            const barRadius = 3;
            const bx = -barW / 2;
            // Se tiver sprite, posicionar barras acima do sprite, senão usar posição padrão (subir 20px a mais)
            let by;
            if (spriteTopY !== null && spriteTopY < 0) {
                // Posicionar acima do sprite (spriteTopY é negativo, então subtrair mais para ficar acima)
                by = spriteTopY - 40;
            } else {
                // Posição padrão acima do círculo
                by = -radius - 36;
            }
            const hpPct = Math.max(0, unit.hp / unit.maxHp);

            ctx.save();

            // HP Bar Background with inner shadow effect
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, barRadius + 1);
            ctx.fill();

            // Inset shadow (dark gradient at top)
            const insetShadow = ctx.createLinearGradient(0, by, 0, by + barH);
            insetShadow.addColorStop(0, 'rgba(0,0,0,0.5)');
            insetShadow.addColorStop(0.3, 'rgba(0,0,0,0.1)');
            insetShadow.addColorStop(1, 'rgba(255,255,255,0.05)');
            ctx.fillStyle = insetShadow;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, barH, barRadius);
            ctx.fill();

            // HP Bar Fill with gradient
            if (hpPct > 0) {
                let hpGrad;
                if (hpPct > 0.5) {
                    // Green gradient (healthy)
                    hpGrad = ctx.createLinearGradient(0, by, 0, by + barH);
                    hpGrad.addColorStop(0, '#4ade80');
                    hpGrad.addColorStop(0.5, '#22c55e');
                    hpGrad.addColorStop(1, '#16a34a');
                } else if (hpPct > 0.25) {
                    // Orange gradient (warning)
                    hpGrad = ctx.createLinearGradient(0, by, 0, by + barH);
                    hpGrad.addColorStop(0, '#fbbf24');
                    hpGrad.addColorStop(0.5, '#f59e0b');
                    hpGrad.addColorStop(1, '#d97706');
                } else {
                    // Red gradient (critical) with pulse
                    const critPulse = (Math.sin(animationFrame / 5) + 1) / 2;
                    hpGrad = ctx.createLinearGradient(0, by, 0, by + barH);
                    hpGrad.addColorStop(0, `rgba(248,113,113,${0.8 + critPulse * 0.2})`);
                    hpGrad.addColorStop(0.5, '#ef4444');
                    hpGrad.addColorStop(1, '#dc2626');

                    // Critical glow
                    ctx.shadowBlur = 8 + critPulse * 6;
                    ctx.shadowColor = 'rgba(239,68,68,0.8)';
                }

                ctx.fillStyle = hpGrad;
                ctx.beginPath();
                ctx.roundRect(bx, by, barW * hpPct, barH, barRadius);
                ctx.fill();

                // Top highlight (gloss)
                ctx.shadowBlur = 0;
                const glossGrad = ctx.createLinearGradient(0, by, 0, by + barH / 2);
                glossGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
                glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = glossGrad;
                ctx.beginPath();
                ctx.roundRect(bx + 1, by + 1, barW * hpPct - 2, barH / 2 - 1, barRadius - 1);
                ctx.fill();
            }

            // Border frame
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, barH, barRadius);
            ctx.stroke();

            // SP Bar (only for heroes)
            if (type === 'player' && unit.sp !== undefined) {
                const spY = by + barH + 3;
                const spH = 4;
                const spPct = Math.max(0, unit.sp / (unit.maxSp || 100));

                // SP Background
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.beginPath();
                ctx.roundRect(bx - 1, spY - 1, barW + 2, spH + 2, 2);
                ctx.fill();

                // SP Fill with gradient
                if (spPct > 0) {
                    const spGrad = ctx.createLinearGradient(0, spY, 0, spY + spH);
                    spGrad.addColorStop(0, '#60a5fa');
                    spGrad.addColorStop(0.5, '#3b82f6');
                    spGrad.addColorStop(1, '#2563eb');

                    ctx.fillStyle = spGrad;
                    ctx.beginPath();
                    ctx.roundRect(bx, spY, barW * spPct, spH, 2);
                    ctx.fill();

                    // Gloss
                    const spGloss = ctx.createLinearGradient(0, spY, 0, spY + spH / 2);
                    spGloss.addColorStop(0, 'rgba(255,255,255,0.35)');
                    spGloss.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = spGloss;
                    ctx.beginPath();
                    ctx.roundRect(bx + 1, spY + 1, barW * spPct - 2, spH / 2 - 1, 1);
                    ctx.fill();
                }

                // SP Border
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(bx, spY, barW, spH, 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 6. Indicator Arrow (acima das barras HP/MP)
        if (isCurrentPhase && canStillAct && !isSelected) {
            const bounce = Math.sin(animationFrame / 10) * 4;
            ctx.save();

            // Calcular posição acima das barras HP (usando a mesma lógica das barras)
            let arrowY;
            if (spriteTopY !== null && spriteTopY < 0) {
                // Barras estão em spriteTopY - 40, então seta fica 15px acima das barras
                arrowY = spriteTopY - 55;
            } else {
                // Barras estão em -radius - 36, então seta fica acima
                arrowY = -radius - 55;
            }

            ctx.translate(0, arrowY + bounce);
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

        ctx.restore();
    }

    /**
     * Quando 2 ou 3 unidades (players + inimigos) estão na mesma coluna em linhas adjacentes,
     * aplica deslocamento horizontal (_stackOffsetX) para reduzir o efeito de "pisando".
     * Pilhas mistas (ex.: slime + archer + swordman) também recebem offset.
     */
    function applyStackOffsetX() {
        const OFFSET = 12; // Deslocamento visual apenas; ataque/alcance usam x,y lógicos
        const all = [...playerUnits, ...enemyUnits].filter(u => u.hp > 0);
        all.forEach(u => { delete u._stackOffsetX; });
        const byX = new Map();
        all.forEach(u => {
            const k = u.x;
            if (!byX.has(k)) byX.set(k, []);
            byX.get(k).push(u);
        });
        byX.forEach((units) => {
            if (units.length < 2) return;
            units.sort((a, b) => a.y - b.y);
            const stacks = [];
            let stack = [units[0]];
            for (let i = 1; i < units.length; i++) {
                if (units[i].y === stack[stack.length - 1].y + 1) {
                    stack.push(units[i]);
                } else {
                    if (stack.length >= 2) stacks.push(stack);
                    stack = [units[i]];
                }
            }
            if (stack.length >= 2) stacks.push(stack);
            stacks.forEach(s => {
                if (s.length === 2) {
                    s[0]._stackOffsetX = -OFFSET;
                    s[1]._stackOffsetX = OFFSET;
                } else if (s.length === 3) {
                    s[0]._stackOffsetX = -OFFSET;
                    s[1]._stackOffsetX = 0;
                    s[2]._stackOffsetX = OFFSET;
                }
            });
        });
    }

    function drawChests() {
        // Proporção original do ícone: 651×512 (não achatar)
        const CHEST_ASPECT = 651 / 512;

        chests.forEach(chest => {
            if (chest.opened) return;

            const cx = (chest.x - 0.5) * CONFIG.CELL_SIZE;
            const cy = (chest.y - 0.5) * CONFIG.CELL_SIZE;
            const pulse = (Math.sin(animationFrame / 20) + 1) / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 10 + pulse * 8;

            const img = loadedImages.chest;
            if (img) {
                // Desenhar com proporção correta: largura 85% da célula, altura proporcional
                const drawWidth = CONFIG.CELL_SIZE * 0.85;
                const drawHeight = drawWidth / CHEST_ASPECT;
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            } else {
                const size = CONFIG.CELL_SIZE * 0.5;
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

        // Camera Viewport Rectangle
        if (canvas && canvas.width > 0 && canvas.height > 0) {
            // Calculate viewport bounds in world coordinates
            const viewportLeft = -viewState.x / viewState.scale;
            const viewportTop = -viewState.y / viewState.scale;
            const viewportWidth = canvas.width / viewState.scale;
            const viewportHeight = canvas.height / viewState.scale;

            // Convert to minimap coordinates
            const rectX = viewportLeft * sx;
            const rectY = viewportTop * sy;
            const rectW = viewportWidth * sx;
            const rectH = viewportHeight * sy;

            // Draw viewport rectangle
            minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            minimapCtx.lineWidth = 2;
            minimapCtx.strokeRect(rectX, rectY, rectW, rectH);

            // Inner glow effect
            minimapCtx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
            minimapCtx.lineWidth = 1;
            minimapCtx.strokeRect(rectX + 1, rectY + 1, rectW - 2, rectH - 2);
        }
    }


    // =====================================================
    // UTILS
    // =====================================================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // =====================================================
    // ATMospheric particles (OTIMIZADO com Object Pooling)
    // =====================================================
    function updateParticles() {
        // Ember Spawning - usa Object Pooling
        if (particles.length < 30) {
            particles.push(getParticle({
                type: 'ember',
                x: Math.random() * MAP_WIDTH,
                y: Math.random() * MAP_HEIGHT,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.5 - 0.2,
                size: Math.random() * 2 + 1,
                life: 1,
                color: Math.random() > 0.5 ? '#f97316' : '#fbbf24'
            }));
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
                // OTIMIZAÇÃO: Devolver partícula ao pool ao invés de destruir
                releaseParticle(particles.splice(i, 1)[0]);
            }
        }
        if (particles.length > 0) needsRender = true;
    }

    function drawParticles() {
        if (window.__rpgPerf?.skip?.particles) return;
        ctx.save();
        particles.forEach(p => {
            // OTIMIZAÇÃO: Viewport culling para partículas
            const screenX = p.x * viewState.scale + viewState.x;
            const screenY = p.y * viewState.scale + viewState.y;
            if (screenX < -50 || screenX > canvas.width + 50 ||
                screenY < -50 || screenY > canvas.height + 50) {
                return; // Partícula fora da tela, pular
            }

            ctx.globalAlpha = p.life * 0.6;
            ctx.shadowBlur = p.glow ? 10 : 5;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;

            if (p.type === 'slash') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-p.size, 0);
                ctx.lineTo(p.size, 0);
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();
    }

    // =====================================================
    // INIT
    // =====================================================
    // Garantir que todas as dependências estejam carregadas antes de inicializar
    function waitForDependencies(callback, maxAttempts = 50, attempt = 0) {
        // Check for TacticalDataLoader (combatData removed)
        if (window.TacticalDataLoader) {
            callback();
        } else if (attempt < maxAttempts) {
            setTimeout(() => waitForDependencies(callback, maxAttempts, attempt + 1), 100);
        } else {
            console.warn('[MAP-ENGINE] Timeout aguardando dependências. Tentando continuar mesmo assim...');
            // Continue anyway - entities can be loaded later
            callback();
        }
    }

    // Aguardar DOM estar pronto E dependências carregadas
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            waitForDependencies(init);
        });
    } else {
        // DOM já está pronto
        waitForDependencies(init);
    }

    // =====================================================
    // GLOBAL STATUS TOOLTIP HELPERS
    // =====================================================
    function showStatusTooltip(e, content) {
        let panel = document.getElementById('status-tooltip-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'status-tooltip-panel';
            panel.className = 'status-tooltip-panel';
            document.body.appendChild(panel);
        }

        panel.innerHTML = content.replace(/\n/g, '<br>');
        panel.classList.add('visible');

        // Position panel near the icon, ensuring it doesn't go off-screen
        const rect = e.target.getBoundingClientRect();

        // Use a temporary measure to get panel dimensions if it was hidden
        panel.style.display = 'block';
        const panelRect = panel.getBoundingClientRect();

        let top = rect.top - panelRect.height - 12;
        let left = rect.left + (rect.width / 2) - (panelRect.width / 2);

        // Clamp to screen bounds
        if (top < 10) top = rect.bottom + 12;
        if (left < 10) left = 10;
        if (left + panelRect.width > window.innerWidth - 10) left = window.innerWidth - panelRect.width - 10;

        panel.style.top = `${top}px`;
        panel.style.left = `${left}px`;
    }

    function hideStatusTooltip() {
        const panel = document.getElementById('status-tooltip-panel');
        if (panel) {
            panel.classList.remove('visible');
            setTimeout(() => {
                if (!panel.classList.contains('visible')) {
                    panel.style.display = 'none';
                }
            }, 200);
        }
    }

    // Expose public API
    window.MapEngine = {
        resetGame: resetGame,
        saveMapState: persistSessionState, // Alias para persistSessionState
        showDamageNumber: showDamageNumber // Expor para o SkillEngine
    };

})();


