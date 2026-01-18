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
        MAP_PATH: '/public/assets/img/maps/castle-map.png'
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
        battleStarted: false // Flag para banner de batalha na primeira ação hostil
    };

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
    function getUnitSkills(unit) {
        if (!unit || !window.combatData) return [];

        // Obter definição da entidade
        const combatKey = unit.combatKey || unit.combat_key || unit.class;
        const entityDef = window.combatData.entities?.[combatKey];
        if (!entityDef || !entityDef.skills) return [];

        // Mapear skills IDs para objetos completos
        const skills = entityDef.skills.map(skillId => {
            const skillDef = window.combatData.skills?.[skillId] || window.skillsData?.[skillId];
            if (!skillDef) return null;

            return {
                ...skillDef,
                id: skillId,
                range: getSkillRange(skillDef),
                rangeType: getSkillRangeType(skillDef),
                aoe: skillDef.aoe || 0
            };
        }).filter(Boolean);

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

        const range = getSkillRange(skill);
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

        // Calcular células no alcance (Manhattan distance)
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

        return reachable;
    }

    /**
     * Calcula área de efeito da skill a partir de um alvo
     */
    function calculateSkillArea(skill, targetX, targetY, casterX, casterY) {
        const area = [];
        if (!skill) return area;

        const rangeType = getSkillRangeType(skill);

        if (rangeType === 'single') {
            area.push({ x: targetX, y: targetY });
            return area;
        }

        if (rangeType === 'aoe' && (skill.aoe || 0) > 0) {
            const aoeRange = skill.aoe || 1;
            for (let dx = -aoeRange; dx <= aoeRange; dx++) {
                for (let dy = -aoeRange; dy <= aoeRange; dy++) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist <= aoeRange) {
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
     * Mapeia unit.class ou combatKey para nome da pasta de sprite
     */
    function getSpriteNameForUnit(unit) {
        if (!unit) return null;

        // Primeiro tentar combatKey (mais específico)
        const combatKey = (unit.combatKey || unit.combat_key || '').toLowerCase();
        if (combatKey === 'hero_swordman' || combatKey === 'swordman') {
            return 'swordman';
        }
        if (combatKey === 'toxic_slime' || combatKey === 'slime') {
            return 'slime';
        }
        if (combatKey === 'wolf') {
            return 'wolf';
        }

        // Depois tentar class
        const className = (unit.class || '').toLowerCase();
        const classMap = {
            'swordsman': 'swordman',
            'swordman': 'swordman',
            'warrior': 'swordman',
            'hero': 'swordman', // Fallback genérico para hero
            'slime': 'slime',
            'toxic_slime': 'slime',
            'wolf': 'wolf'
        };

        return classMap[className] || null;
    }

    /**
     * Carrega uma animação específica (idle ou walk) de um sprite
     * Formato esperado: {spriteName}/{animationType}/{num}.png (1.png, 2.png, 3.png, ...)
     * - Idle: {spriteName}/idle/1.png, 2.png, 3.png, ... 60.png
     * - Walk: {spriteName}/walk/1.png, 2.png, 3.png, ... 40.png
     */
    async function loadSpriteAnimation(spriteName, animationType) {
        const frames = [];
        const maxFrames = 200; // Limite máximo para evitar loop infinito

        // Determinar caminho base baseado no tipo de animação (formato simples: 1.png, 2.png, etc.)
        let basePath;
        if (animationType === 'idle') {
            basePath = `/public/assets/img/animations/${spriteName}/idle/`;
        } else if (animationType === 'walk') {
            basePath = `/public/assets/img/animations/${spriteName}/walk/`;
        } else if (animationType === 'atack') {
            basePath = `/public/assets/img/animations/${spriteName}/atack/`;
        } else {
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

        // Carregar frames sequencialmente usando numeração simples (1.png, 2.png, 3.png, ...)
        // Estratégia: tentar carregar até encontrar o primeiro frame que não existe
        // Para evitar 404 desnecessário, verificamos se o frame N+1 existe antes de continuar
        let frameIndex = 1;
        let lastSuccessfulFrame = 0;

        while (frameIndex <= maxFrames) {
            const framePath = `${basePath}${frameIndex}.png`;

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
            console.warn(`[SpriteAnimation] Nenhum frame encontrado para ${spriteName}/${animationType}`);
            animation.state = 'error';
            return null;
        }

        animation.frames = frames.slice(0, actualFrameCount);
        animation.frameCount = actualFrameCount;
        animation.loaded = true;
        animation.state = 'loaded';

        console.log(`[SpriteAnimation] Carregado ${spriteName}/${animationType}: ${actualFrameCount} frames (${animation.width}x${animation.height})`);

        return animation;
    }

    /**
     * Carrega todas as animações (idle e walk) de um sprite
     * Retorna objeto com todas as animações carregadas
     */
    async function loadSpriteAnimations(spriteName) {
        // Verificar se já está no cache
        if (spriteCache.has(spriteName)) {
            return spriteCache.get(spriteName);
        }

        // Criar objeto para armazenar todas as animações deste sprite
        const spriteAnimations = {
            name: spriteName,
            idle: null,
            walk: null,
            atack: null,
            loaded: false
        };

        // Armazenar no cache imediatamente para evitar carregamentos duplicados
        spriteCache.set(spriteName, spriteAnimations);

        // Carregar animações em paralelo
        const [idleAnimation, walkAnimation, atackAnimation] = await Promise.all([
            loadSpriteAnimation(spriteName, 'idle'),
            loadSpriteAnimation(spriteName, 'walk'),
            loadSpriteAnimation(spriteName, 'atack')
        ]);

        spriteAnimations.idle = idleAnimation;
        spriteAnimations.walk = walkAnimation;
        spriteAnimations.atack = atackAnimation;

        // Considerar carregado se pelo menos uma animação foi carregada
        spriteAnimations.loaded = (idleAnimation !== null || walkAnimation !== null || atackAnimation !== null);

        if (!spriteAnimations.loaded) {
            console.warn(`[SpriteAnimations] Nenhuma animação carregada para ${spriteName}`);
        } else {
            console.log(`[SpriteAnimations] Carregado ${spriteName}: idle=${idleAnimation !== null}, walk=${walkAnimation !== null}, atack=${atackAnimation !== null}`);
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
            const frameDuration = 60 / fps;
            return Math.floor((animationFrame / frameDuration) % fallback.frameCount);
        }

        // Usar animationFrame global para sincronizar animação ou local se não for loop
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

        const frameDuration = 60 / fps; // Frames do game loop por frame de animação

        // Se a animação não for em loop (ex: atack), calcular baseada no início
        if (animation.loop === false && unit) {
            if (unit.animationStartFrame === undefined) {
                unit.animationStartFrame = animationFrame;
            }
            const elapsed = animationFrame - unit.animationStartFrame;
            let frameIndex = Math.floor(elapsed / frameDuration);

            if (frameIndex >= animation.frameCount) {
                frameIndex = animation.frameCount - 1;

                // Retornar para idle automaticamente após o fim (sem side-effect direto no render)
                if (unit.animationState === state && !unit._animReverting) {
                    unit._animReverting = true;
                    setTimeout(() => {
                        if (unit.animationState === state) {
                            unit.animationState = 'idle';
                            unit.animationStartFrame = animationFrame;
                        }
                        unit._animReverting = false;
                    }, 50);
                }
            }
            return frameIndex;
        }

        // Loop padrão sincronizado
        return Math.floor((animationFrame / frameDuration) % animation.frameCount);
    }

    /**
     * Carrega todos os sprites necessários para as unidades atuais
     * Carrega todas as animações (idle + walk) para cada sprite
     */
    async function loadRequiredSprites() {
        const spriteNames = new Set();

        // Detectar quais sprites são necessários
        [...playerUnits, ...enemyUnits].forEach(unit => {
            const spriteName = getSpriteNameForUnit(unit);
            if (spriteName) {
                spriteNames.add(spriteName);
            }
        });

        // Carregar todas as animações (idle + walk) para cada sprite em paralelo
        const loadPromises = Array.from(spriteNames).map(name => loadSpriteAnimations(name));
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
        if (!fileName || !audioSettings.sfxEnabled) return null;
        const src = `/public/assets/mp3/${fileName}`;
        if (!sfxCache[src]) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            sfxCache[src] = audio;
        }
        const audio = sfxCache[src].cloneNode();
        audio.volume = volume;
        audio.playbackRate = rate;
        audio.play().catch(() => { });
        return audio;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function playSwordSfx(isCrit = false) {
        const swing = pickRandom(['sword1.mp3', 'sword2.mp3', 'sword3.mp3', 'sword4.mp3']);
        const hit = pickRandom(['hit1.mp3', 'hit2.mp3', 'hit3.mp3', 'impact.mp3']);
        playSfx(swing, 0.5, 1.0);
        setTimeout(() => playSfx(hit, 0.55, 1.0), 80);
        if (isCrit) setTimeout(() => playSfx('critical.mp3', 0.6, 1.0), 60);
    }

    function playClawSfx() {
        const hit = pickRandom(['wolf_claw_hit1.mp3', 'wolf_claw_hit2.mp3', 'wolf_claw_hit3.mp3', 'wolf_claw_hit4.mp3']);
        playSfx(hit, 0.55, 1.0);
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
    let lastMouseCanvasPos = { x: 0, y: 0 }; // Coordenadas relativas ao canvas (para facing)
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
    let floatingTexts = [];
    let particles = []; // Sistema de partículas (movido para cima para inicialização do MapSFX)
    let portalPromptShown = false;

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
    // Fallback padr�o se n�o houver no config
    // =====================================================
    let WALLS = [
        { x: 8, y: 12 },
        { x: 9, y: 13 },
        { x: 10, y: 13 },
        { x: 8, y: 11 },
        { x: 8, y: 13 },
        { x: 11, y: 13 },
        { x: 11, y: 14 },
        { x: 12, y: 14 },
        { x: 12, y: 15 },
        { x: 13, y: 15 },
        { x: 13, y: 16 },
        { x: 14, y: 16 },
        { x: 15, y: 16 },
        { x: 16, y: 16 },
        { x: 17, y: 16 },
        { x: 18, y: 16 },
        { x: 19, y: 16 },
        { x: 20, y: 16 },
        { x: 21, y: 16 },
        { x: 22, y: 16 },
        { x: 23, y: 16 },
        { x: 24, y: 16 },
        { x: 25, y: 16 },
        { x: 26, y: 16 },
        { x: 26, y: 15 },
        { x: 27, y: 15 },
        { x: 27, y: 14 },
        { x: 28, y: 14 },
        { x: 28, y: 13 },
        { x: 28, y: 12 },
        { x: 28, y: 11 },
        { x: 29, y: 11 },
        { x: 30, y: 11 },
        { x: 32, y: 11 },
        { x: 31, y: 11 },
        { x: 34, y: 11 },
        { x: 33, y: 11 },
        { x: 36, y: 11 },
        { x: 35, y: 11 },
        { x: 33, y: 10 },
        { x: 34, y: 10 },
        { x: 35, y: 10 },
        { x: 36, y: 10 },
        { x: 37, y: 10 },
        { x: 37, y: 11 },
        { x: 38, y: 11 },
        { x: 38, y: 10 },
        { x: 39, y: 10 },
        { x: 39, y: 11 },
        { x: 40, y: 11 },
        { x: 40, y: 10 },
        { x: 41, y: 10 },
        { x: 41, y: 11 },
        { x: 42, y: 11 },
        { x: 42, y: 10 },
        { x: 43, y: 11 },
        { x: 43, y: 10 },
        { x: 43, y: 12 },
        { x: 44, y: 12 },
        { x: 44, y: 13 },
        { x: 45, y: 13 },
        { x: 45, y: 14 },
        { x: 46, y: 14 },
        { x: 47, y: 14 },
        { x: 50, y: 14 },
        { x: 48, y: 14 },
        { x: 49, y: 14 },
        { x: 51, y: 14 },
        { x: 53, y: 14 },
        { x: 52, y: 14 },
        { x: 54, y: 14 },
        { x: 55, y: 14 },
        { x: 54, y: 13 },
        { x: 54, y: 12 },
        { x: 54, y: 11 },
        { x: 54, y: 10 },
        { x: 54, y: 9 },
        { x: 53, y: 13 },
        { x: 52, y: 13 },
        { x: 51, y: 13 },
        { x: 50, y: 13 },
        { x: 52, y: 11 },
        { x: 52, y: 10 },
        { x: 51, y: 11 },
        { x: 51, y: 10 },
        { x: 51, y: 12 },
        { x: 52, y: 12 },
        { x: 53, y: 12 },
        { x: 53, y: 11 },
        { x: 53, y: 10 },
        { x: 54, y: 8 },
        { x: 54, y: 7 },
        { x: 54, y: 6 },
        { x: 54, y: 5 },
        { x: 54, y: 4 },
        { x: 54, y: 3 },
        { x: 53, y: 3 },
        { x: 52, y: 3 },
        { x: 51, y: 3 },
        { x: 51, y: 4 },
        { x: 51, y: 5 },
        { x: 51, y: 6 },
        { x: 50, y: 6 },
        { x: 49, y: 6 },
        { x: 48, y: 6 },
        { x: 47, y: 5 },
        { x: 48, y: 5 },
        { x: 43, y: 5 },
        { x: 42, y: 5 },
        { x: 40, y: 5 },
        { x: 41, y: 5 },
        { x: 40, y: 6 },
        { x: 41, y: 6 },
        { x: 42, y: 6 },
        { x: 38, y: 6 },
        { x: 39, y: 6 },
        { x: 42, y: 7 },
        { x: 41, y: 7 },
        { x: 39, y: 7 },
        { x: 40, y: 7 },
        { x: 38, y: 7 },
        { x: 37, y: 7 },
        { x: 37, y: 6 },
        { x: 35, y: 6 },
        { x: 36, y: 7 },
        { x: 36, y: 6 },
        { x: 35, y: 7 },
        { x: 34, y: 6 },
        { x: 34, y: 7 },
        { x: 33, y: 7 },
        { x: 33, y: 6 },
        { x: 44, y: 4 },
        { x: 45, y: 4 },
        { x: 46, y: 4 },
        { x: 43, y: 4 },
        { x: 48, y: 4 },
        { x: 47, y: 4 },
        { x: 38, y: 3 },
        { x: 32, y: 6 },
        { x: 32, y: 7 },
        { x: 31, y: 7 },
        { x: 31, y: 6 },
        { x: 30, y: 7 },
        { x: 30, y: 6 },
        { x: 29, y: 6 },
        { x: 29, y: 7 },
        { x: 29, y: 5 },
        { x: 29, y: 4 },
        { x: 29, y: 3 },
        { x: 29, y: 2 },
        { x: 29, y: 1 },
        { x: 27, y: 3 },
        { x: 28, y: 5 },
        { x: 28, y: 4 },
        { x: 28, y: 3 },
        { x: 28, y: 2 },
        { x: 27, y: 2 },
        { x: 27, y: 1 },
        { x: 28, y: 1 },
        { x: 26, y: 1 },
        { x: 25, y: 1 },
        { x: 24, y: 1 },
        { x: 23, y: 3 },
        { x: 23, y: 4 },
        { x: 24, y: 4 },
        { x: 24, y: 3 },
        { x: 24, y: 2 },
        { x: 23, y: 2 },
        { x: 23, y: 1 },
        { x: 22, y: 1 },
        { x: 22, y: 3 },
        { x: 22, y: 2 },
        { x: 26, y: 4 },
        { x: 25, y: 2 },
        { x: 27, y: 5 },
        { x: 27, y: 4 },
        { x: 26, y: 3 },
        { x: 26, y: 2 },
        { x: 25, y: 3 },
        { x: 25, y: 4 },
        { x: 22, y: 4 },
        { x: 21, y: 1 },
        { x: 20, y: 1 },
        { x: 19, y: 1 },
        { x: 19, y: 2 },
        { x: 19, y: 3 },
        { x: 18, y: 3 },
        { x: 18, y: 4 },
        { x: 17, y: 4 },
        { x: 16, y: 4 },
        { x: 16, y: 5 },
        { x: 15, y: 5 },
        { x: 14, y: 5 },
        { x: 15, y: 4 },
        { x: 14, y: 4 },
        { x: 13, y: 4 },
        { x: 13, y: 3 },
        { x: 13, y: 2 },
        { x: 13, y: 1 },
        { x: 13, y: 5 },
        { x: 12, y: 5 },
        { x: 12, y: 6 },
        { x: 12, y: 7 },
        { x: 11, y: 7 },
        { x: 8, y: 7 },
        { x: 9, y: 7 },
        { x: 10, y: 7 },
        { x: 8, y: 8 },
        { x: 8, y: 9 },
        { x: 8, y: 10 },
        { x: 7, y: 4 }
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
                getWalls: () => {
                    const effectiveWalls = WALLS.filter(w => !debugWallsRemoved.some(rw => rw.x === w.x && rw.y === w.y));
                    return [...effectiveWalls, ...debugWallsAdded];
                },
                toggleWall: toggleDebugWall,
                triggerRender: () => { needsRender = true; }
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
            } else {
                console.log('[MAP-ENGINE] Nenhuma sessão UID encontrada na URL');
            }
        } catch (err) {
            console.error('[MAP-ENGINE] Erro ao carregar sessão:', err);
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
                    // Sempre selecionar o primeiro personagem vivo no início do turno
                    const firstAlive = playerUnits.find(p => p.hp > 0 && !gameState.unitsActedThisTurn.has(p.id));
                    if (firstAlive && !gameState.selectedUnit) {
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
        // Get entity data from combatData if available
        const entities = window.combatData?.entities || {};

        // Helper to get entity name from combatData
        const getEntityName = (key, fallback) => {
            return entities[key]?.name || fallback;
        };

        // Player Units (your team) - Using dynamic names from combatData
        // Agora com sistema de atributos integrado ao SkillEngine
        playerUnits = [
            {
                id: 'hero1', name: getEntityName('hero_swordman', 'Swordman'), type: 'player',
                combatKey: 'hero_swordman',
                x: 16, y: 8,
                level: 10,
                attributes: { str: 15, agi: 8, vit: 12, int: 5, dex: 10, luk: 6 },
                hp: 100, maxHp: 100, sp: 1000, maxSp: 1000, attack: 18, defense: 12,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/characters/swordman.png',
                class: 'warrior', scale: 1.0
            },
            {
                id: 'hero2', name: getEntityName('hero_mage', 'Mage'), type: 'player',
                combatKey: 'hero_mage',
                x: 15, y: 10,
                level: 8,
                attributes: { str: 4, agi: 6, vit: 6, int: 18, dex: 12, luk: 5 },
                hp: 60, maxHp: 60, sp: 100, maxSp: 100, attack: 25, defense: 5,
                moveRange: 3, attackRange: 3, avatar: '/public/assets/img/mage-male.png',
                class: 'mage', scale: 1.0
            },
            {
                id: 'hero3', name: getEntityName('hero_archer', 'Archer'), type: 'player',
                combatKey: 'hero_archer',
                x: 14, y: 9,
                level: 9,
                attributes: { str: 8, agi: 16, vit: 7, int: 6, dex: 18, luk: 8 },
                hp: 70, maxHp: 70, sp: 60, maxSp: 60, attack: 20, defense: 8,
                moveRange: 5, attackRange: 3, avatar: '/public/assets/img/archer-female.png',
                class: 'archer', scale: 1.0
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
                moveRange: 3, attackRange: 1, avatar: '/public/assets/img/orc.png',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc2', name: getEntityName('orc_scout', 'Orc Scout'), type: 'enemy',
                x: 19, y: 7,
                level: 6,
                attributes: { str: 8, agi: 10, vit: 7, int: 4, dex: 12, luk: 4 },
                hp: 45, maxHp: 45, attack: 15, defense: 3,
                moveRange: 2, attackRange: 3, avatar: '/public/assets/img/orc_scout.png',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'orc3', name: getEntityName('bandit_marauder', 'Bandit Marauder'), type: 'enemy',
                x: 19, y: 9,
                level: 12,
                attributes: { str: 18, agi: 8, vit: 15, int: 5, dex: 10, luk: 5 },
                hp: 120, maxHp: 120, attack: 22, defense: 10,
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/bandit_marauder.png',
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
                x: 12, y: 11,
                level: 5,
                attributes: { str: 10, agi: 15, vit: 8, int: 2, dex: 8, luk: 4 },
                hp: 40, maxHp: 40, attack: 12, defense: 4,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/characters/wolf.png',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'slime1', name: getEntityName('toxic_slime', 'Toxic Slime'), type: 'enemy',
                x: 11, y: 7,
                level: 3,
                attributes: { str: 5, agi: 4, vit: 12, int: 6, dex: 4, luk: 5 },
                hp: 30, maxHp: 30, attack: 8, defense: 8,
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/characters/slime.png',
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
     * Aplica stats calculados pelo SkillEngine às unidades
     * Usa o sistema de atributos (str, agi, vit, int, dex, luk) + level
     */
    function applySkillEngineStats(units) {
        if (!window.SkillEngine) {
            console.warn('[MAP] SkillEngine não disponível. Stats fixos serão usados.');
            return;
        }

        units.forEach(unit => {
            if (!unit.attributes || !unit.level) return;

            const stats = window.SkillEngine.calculateStatsFromAttributes(unit.level, unit.attributes);

            // Aplicar stats calculados
            unit.attack = stats.atk;
            unit.matk = stats.matk;
            unit.defense = stats.softDef;
            unit.mdef = stats.mdef;
            unit.hit = stats.hit;
            unit.flee = stats.flee;
            unit.crit = stats.crit;
            unit.aspd = stats.aspd;

            // HP e MP - usar calculado ou manter original se maior (para bosses etc)
            unit.maxHp = Math.max(unit.maxHp || 0, stats.maxHp);
            unit.hp = Math.min(unit.hp || unit.maxHp, unit.maxHp);
            unit.maxSp = Math.max(unit.maxSp || 0, stats.maxMana);
            unit.sp = Math.min(unit.sp || unit.maxSp, unit.maxSp);

            console.log(`[MAP] Stats calculados para ${unit.name} (Lv${unit.level}):`, {
                atk: unit.attack, matk: unit.matk, def: unit.defense,
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
        console.log('[DEBUG][initEntities] Turno restaurado:', {
            turn: gameState.turn,
            phase: gameState.phase,
            unitsActed: Array.from(gameState.unitsActedThisTurn || [])
        });

        if (player) {
            const playerUnit = {
                id: player.id || 'player',
                name: player.name || 'Hero',
                type: 'player',
                x: player.x || 5,
                y: player.y || 5,
                hp: player.hp || 100,
                maxHp: player.maxHp || 100,
                sp: player.sp || 50,
                maxSp: player.maxSp || 50,
                attack: player.attack || 10,
                defense: player.defense || 5,
                moveRange: player.moveRange || 4,
                attackRange: player.attackRange || 1,
                avatar: player.avatar || '/public/assets/img/characters/swordman.png',
                class: player.class || 'hero',
                scale: player.scale || 1.0,
                combatKey: player.combatKey || player.combat_key || null,
                animationState: 'idle', // Estado inicial da animação
                hasMoved: !!player.hasMoved,
                facingRight: player.facingRight ?? false // Usar valor salvo ou false como padrão
            };

            // Carregar configurações de animação do JSON (se presentes)
            // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
            if (player.animations && typeof player.animations === 'object') {
                // Copiar objeto animations completo
                playerUnit.animations = JSON.parse(JSON.stringify(player.animations)); // Deep copy
                console.log('[DEBUG][initEntities] Player - Animations carregado:', playerUnit.animations);
            } else {
                // Retrocompatibilidade: propriedades globais
                if (player.animationFPS !== undefined) {
                    playerUnit.animationFPS = player.animationFPS;
                }
                if (player.animationScale !== undefined) {
                    playerUnit.animationScale = player.animationScale;
                }
                if (player.animationOffsetX !== undefined) {
                    playerUnit.animationOffsetX = player.animationOffsetX;
                }
                if (player.animationOffsetY !== undefined) {
                    playerUnit.animationOffsetY = player.animationOffsetY;
                }
            }
            if (player.forceAnimation !== undefined) {
                playerUnit.forceAnimation = player.forceAnimation;
            }

            playerUnits.push(playerUnit);
        }

        enemies.forEach((enemy, index) => {
            console.log(`[DEBUG][initEntities] Processando inimigo ${index + 1}:`, enemy);

            const unitCombatKey = (enemy.combatKey || enemy.combat_key || '').toLowerCase();
            const isSlime = unitCombatKey === 'toxic_slime' || unitCombatKey === 'slime' || (enemy.name && enemy.name.toLowerCase().includes('slime'));

            console.log(`[DEBUG][initEntities] Inimigo ${index + 1} - combatKey: ${unitCombatKey}, isSlime: ${isSlime}, x: ${enemy.x}, y: ${enemy.y}`);

            const unit = {
                id: enemy.id || `enemy_${Math.random().toString(36).slice(2, 8)}`,
                name: enemy.name || 'Enemy',
                type: 'enemy',
                x: enemy.x || 1,
                y: enemy.y || 1,
                hp: enemy.hp || 20,
                maxHp: enemy.maxHp || enemy.hp || 20,
                attack: enemy.attack || 5,
                defense: enemy.defense || 2,
                moveRange: enemy.moveRange || 2,
                attackRange: enemy.attackRange || 1,
                avatar: enemy.avatar || '/public/assets/img/enemy.png',
                behavior: enemy.behavior || 'aggressive',
                scale: enemy.scale || 1.0,
                combatKey: enemy.combatKey || enemy.combat_key || null,
                animationState: 'idle', // Estado inicial da animação
                facingRight: false // false = esquerda (<-), true = direita (->)
            };

            // Carregar configurações de animação do JSON (se presentes)
            // Suporte para objeto 'animations' (idle/walk) ou propriedades globais (retrocompatibilidade)
            console.log(`[DEBUG][initEntities] Inimigo ${index + 1} - enemy.animations:`, enemy.animations);
            if (enemy.animations && typeof enemy.animations === 'object') {
                // Copiar objeto animations completo
                unit.animations = JSON.parse(JSON.stringify(enemy.animations)); // Deep copy
                console.log(`[DEBUG][initEntities] Unidade ${index + 1} - Animations carregado:`, unit.animations);
            } else {
                // Retrocompatibilidade: propriedades globais
                if (enemy.animationFPS !== undefined) {
                    unit.animationFPS = enemy.animationFPS;
                }
                if (enemy.animationScale !== undefined) {
                    unit.animationScale = enemy.animationScale;
                }
                if (enemy.animationOffsetX !== undefined) {
                    unit.animationOffsetX = enemy.animationOffsetX;
                }
                if (enemy.animationOffsetY !== undefined) {
                    unit.animationOffsetY = enemy.animationOffsetY;
                }
            }
            if (enemy.forceAnimation !== undefined) {
                unit.forceAnimation = enemy.forceAnimation;
            }

            // Definir estado inicial da animação
            if (!enemy.forceAnimation || enemy.forceAnimation === 'auto') {
                unit.animationState = 'idle';
            } else {
                unit.animationState = enemy.forceAnimation;
            }

            console.log(`[DEBUG][initEntities] Unidade criada:`, unit);
            enemyUnits.push(unit);
        });

        console.log('[DEBUG][initEntities] Total de enemyUnits após processamento:', enemyUnits.length);
        console.log('[DEBUG][initEntities] EnemyUnits final:', enemyUnits);

        // Recalcular stats baseados em level/atributos se SkillEngine disponível
        applySkillEngineStats(playerUnits);
        applySkillEngineStats(enemyUnits);

        loadImages();
        loadRequiredSprites(); // Carregar sprites necessários
        updateFreeExploreState();
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
            // Verificar se já existe no loadedImages (pode ter sido carregado anteriormente)
            if (loadedImages[id] && loadedImages[id].complete) {
                return;
            }

            const img = new Image();
            img.onerror = () => {
                // Silenciosamente ignorar erros (sprites podem não existir)
            };
            img.onload = () => {
                loadedImages[id] = img;
                needsRender = true;
            };
            // IMPORTANTE: Definir src DEPOIS de configurar os event handlers
            img.src = src;

            // Se a imagem já estiver em cache, onload pode não disparar - verificar complete IMEDIATAMENTE
            if (img.complete && img.width > 0 && img.height > 0) {
                loadedImages[id] = img;
                needsRender = true;
            }
        });
    }

    // =====================================================
    // TURN SYSTEM
    // =====================================================
    async function endPlayerTurn() {
        if (gameState.freeExplore) return;
        if (gameState.phase !== 'player' || gameState.isAnimating) return;

        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.phase = 'enemy';
        console.log('[DEBUG][endPlayerTurn] Phase set to enemy:', {
            turn: gameState.turn,
            phase: gameState.phase,
            unitsActed: Array.from(gameState.unitsActedThisTurn || [])
        });
        persistSessionState();

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
        setTimeout(() => processEnemyTurn(), 500);
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
            if (!enemy.forceAnimation || enemy.forceAnimation === 'auto') {
                const prevState = enemy.animationState || 'walk';
                enemy.animationState = 'idle';
                if (prevState !== 'idle') {
                    startAnimationBlend(enemy, prevState, 'idle', 160);
                }
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

        // Sempre manter unidade do player selecionada e HUD ativa
        const firstAlive = playerUnits.find(p => p.hp > 0);
        if (firstAlive) {
            // Focar câmera no herói
            await animateCameraToUnit(firstAlive);
            selectUnit(firstAlive);
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

        // Undo desativado

        clearHighlights();
        // showActionMenu(unit); // DEPRECATED: usar HUD tática
        showTacticalHUD(unit); // Nova HUD tática fixa
        updateUI();
        needsRender = true;

        // Notificar debug panel se estiver ativo
        if (window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
            window.MapDebug.selectUnit(unit);
        }
    }

    function deselectUnit(force = false) {
        // Se há apenas 1 personagem vivo, não permitir desseleção (exceto force)
        const alivePlayers = playerUnits.filter(u => u.hp > 0);
        if (!force && alivePlayers.length === 1 && gameState.selectedUnit) {
            return; // Não desselecionar único personagem
        }

        if (!force && gameState.selectedUnit && gameState.selectedUnit.hasMoved) {
            // Não permitir desselecionar unidade que já se moveu
            showTacticalHUD(gameState.selectedUnit);
            return;
        }
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        attackRangeCells = []; // Limpar área de ataque
        cancelSkillSelection(); // Limpar preview de skill
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

            // Limpar ação atual para permitir ataque/skill
            gameState.currentAction = null;
            attackRangeCells = [];
            skillRangeCells = [];
            skillAreaCells = [];

            // Clear movement grid
            reachableCells = [];
            attackableCells = [];

            // Mostrar HUD tática após mover (com Mover desabilitado)
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
            if (sessionUid && unit.type === 'player') {
                persistMoveSession(startPos, { x: unit.x, y: unit.y });
            }
            // REMOVIDO: persistSessionState() - será chamado ao final do turno
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
            if (sessionUid && unit.type === 'player') {
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
        const spriteName = getSpriteNameForUnit(unit);
        const spriteAnimations = spriteName ? spriteCache.get(spriteName) : null;
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

        // Marcar batalha iniciada na primeira ação hostil
        if (!gameState.battleStarted) {
            gameState.battleStarted = true;

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
        const attackerSprite = getSpriteNameForUnit(attacker);
        const spriteAnimations = attackerSprite ? spriteCache.get(attackerSprite) : null;

        // Trigger attack animation if available
        if (spriteAnimations && spriteAnimations.atack && spriteAnimations.atack.loaded) {
            attacker.animationState = 'atack';
            attacker.animationStartFrame = animationFrame;
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
        const baseDamage = attacker.attack || 10;
        const defense = target.defense || 0;
        const variance = 0.8 + Math.random() * 0.4;
        const isCrit = Math.random() < 0.15; // 15% chance de crítico
        let damage = Math.max(1, Math.floor((baseDamage - defense * 0.5) * variance));
        if (isCrit) damage = Math.floor(damage * 1.5);

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

        // Determinar tipo de unidade atacante para efeito apropriado
        const isWarrior = attacker.class === 'warrior' || attacker.class === 'swordman' || attackerSprite === 'swordman';
        const isArcher = attacker.class === 'archer' || attackerSprite === 'archer';
        const isMage = attacker.class === 'mage' || attackerSprite === 'mage';

        if (isWarrior || (!isArcher && !isMage)) {
            // Slash effect para warriors/melee
            spawnSwordSlashEffect(targetPxX, targetPxY);
        } else if (isMage) {
            // Efeito mágico para magos
            spawnMagicEffect(targetPxX, targetPxY, '#a855f7');
        }

        // Efeito de impacto universal premium
        spawnImpactBurst(targetPxX, targetPxY, isCrit ? '#fbbf24' : '#ef4444', isCrit ? 1.5 : 1);

        // Shake da câmera
        triggerScreenShake(isCrit ? 10 : 6);
        hitFlash = Math.max(hitFlash, isCrit ? 0.4 : 0.25);

        // Som de impacto
        if (typeof playStepSound === 'function') {
            playStepSound({ type: isCrit ? 'crit' : 'hit' });
        }
        // Som de espada/claw/slime
        if (attackerSprite === 'swordman') {
            playSwordSfx(isCrit);
        } else if (attackerSprite === 'wolf') {
            playClawSfx();
        } else if (attackerSprite === 'slime') {
            playSfx('slime.mp3', 0.5, 1.0);
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

            await sleep(600);

            if (target.type === 'enemy') {
                enemyUnits = enemyUnits.filter(u => u.id !== target.id);
            } else {
                playerUnits = playerUnits.filter(u => u.id !== target.id);
            }

            // Update timeline
            updateTurnTimeline();
        }

        gameState.isAnimating = false;
        finishUnitTurn(attacker);
        needsRender = true;

        return true;
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

            // Tocar música de batalha
            if (audioSettings.musicEnabled && !currentBattleMusic) {
                currentBattleMusic = playSfx('battle.mp3', 0.4, 1.0);
                if (currentBattleMusic) {
                    currentBattleMusic.loop = true;
                }
            }
        }

        gameState.isAnimating = true;

        // Consumir MP
        caster.sp = Math.max(0, caster.sp - cost);

        // Atualizar HUD se o caster for a unidade selecionada
        if (gameState.selectedUnit && (gameState.selectedUnit.id === caster.id || gameState.selectedUnit === caster)) {
            showTacticalHUD(caster);
        }

        const targetsToHit = (targets && targets.length > 0)
            ? targets
            : (target ? [target] : []);

        // Determinar tipo de efeito visual baseado na skill
        const isMagic = skill.damageType === 'magic' || skill.element || ['fire', 'ice', 'lightning', 'holy', 'dark'].includes(skill.element);
        const isPhysical = skill.damageType === 'physical' || caster.class === 'warrior' || caster.class === 'swordman';
        const isHeal = skill.type === 'heal' || skill.type === 'aoe_heal';
        const isBuff = skill.type === 'self' || skill.type === 'ally' || skill.type === 'buff';

        // Determinar tipo de skill para cor do banner
        const skillType = isHeal ? 'heal' : isBuff ? 'buff' : isMagic ? 'magic' : 'physical';

        // BANNER DE SKILL ANIMADO
        // Usar o mesmo banner para skills normais e ultimates (padronizado)
        const bannerSkillType = skill.ultimate ? 'ultimate' : skillType;
        await showSkillBanner(skill.name, skill.icon || 'zap', bannerSkillType);

        // Trigger attack animation for caster (igual ao executeAttack)
        const casterSprite = getSpriteNameForUnit(caster);
        const casterSpriteAnims = casterSprite ? spriteCache.get(casterSprite) : null;

        if (casterSpriteAnims && casterSpriteAnims.atack && casterSpriteAnims.atack.loaded) {
            caster.animationState = 'atack';
            caster.animationStartFrame = animationFrame;
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

        // Aplicar efeito baseado no tipo
        if (['damage', 'attack', 'single', 'aoe', 'pierce', 'line', 'target'].includes(skill.type)) {
            if (targetsToHit.length === 0) {
                gameState.isAnimating = false;
                return false;
            }

            const baseDamage = caster.attack || 10;
            const dmgMult = typeof skill.dmgMult === 'number' ? skill.dmgMult : 1.0;

            // Loop de hits
            for (let hit = 0; hit < numHits; hit++) {
                if (hit > 0) await sleep(hitDelay);

                // Som de espada para cada hit (randomizado)
                if (isPhysical) {
                    playSwordSfx(false);
                }

                // Mostrar combo indicator para multi-hit
                if (numHits > 1) {
                    showHitCombo(hit + 1);
                }

                for (const t of targetsToHit) {
                    if (!t || t.hp <= 0) continue;

                    const variance = 0.9 + Math.random() * 0.2;
                    const isCrit = Math.random() < 0.1;
                    // Dano dividido pelos hits para balanceamento
                    const hitDmgMult = dmgMult / numHits;
                    const damage = Math.max(1, Math.floor(baseDamage * hitDmgMult * variance * (isCrit ? 1.5 : 1)));

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

                    // Efeitos visuais premium baseados no tipo de skill
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

                    // Efeito visual de tremor para skills fortes
                    if (dmgMult > 1.2 || isCrit || numHits > 1) {
                        triggerScreenShake(isCrit ? 12 : (numHits > 1 ? 6 : 8));
                    }

                    if (t.hp <= 0) {
                        spawnDeathEffect(targetX, targetY);
                        showKillBanner(t.name);
                        if (t.type === 'enemy') {
                            enemyUnits = enemyUnits.filter(u => u.id !== t.id);
                        } else {
                            playerUnits = playerUnits.filter(u => u.id !== t.id);
                        }
                    }
                }
            }
        } else if (skill.type === 'heal' || skill.type === 'aoe_heal') {
            for (const t of targetsToHit) {
                if (!t || t.hp <= 0) continue;
                const healing = Math.floor(skill.power || 30);
                t.hp = Math.min(t.maxHp, t.hp + healing);
                showFloatingText(`+${healing}`, (t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#22c55e');
                // Efeito visual de cura PREMIUM
                spawnHealEffect((t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE);
            }
        } else if (skill.type === 'self' || skill.type === 'ally' || skill.type === 'buff') {
            // Efeitos de Buff/Debuff com visual premium
            for (const t of targetsToHit) {
                if (!t || t.hp <= 0) continue;
                showFloatingText(skill.name, (t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#a855f7');
                spawnMagicEffect((t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#fbbf24');

                // Aplicar efeito de stun se a skill tiver chance
                if (skill.effect && skill.effect.id === 'stun') {
                    if (Math.random() < (skill.effect.chance || 0)) {
                        t.isStunned = true;
                        t.stunDuration = skill.effect.duration || 1;
                        showFloatingText('STUN!', (t.x - 0.5) * CONFIG.CELL_SIZE, (t.y - 0.5) * CONFIG.CELL_SIZE, '#eab308');
                    }
                }
            }
        }

        gameState.isAnimating = false;
        finishUnitTurn(caster);
        needsRender = true;

        return true;
    }

    // Função buildCombatEntityFromMap mantida para possível uso futuro
    function buildCombatEntityFromMap(mapUnit, combatKey, isPlayer) {
        const def = window.combatData?.entities?.[combatKey];
        if (!def) return null;
        const base = JSON.parse(JSON.stringify(def));
        const skills = (base.skills || []).map(sid => {
            const skillDef = window.combatData?.skills?.[sid];
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

    async function createBattleSession(battleData) {
        if (!sessionUid) {
            return null;
        }

        try {
            const response = await fetch(`/game/battle/start?session=${encodeURIComponent(sessionUid)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ battle: battleData })
            });
            const data = await response.json();
            if (data && data.success && data.battle_uid) {
                return data.battle_uid;
            }
        } catch (error) {
            console.warn('[MapEngine] Falha ao iniciar battle session:', error);
        }

        return null;
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
            // UX: Se ainda houver unidades que não agiram, selecionar a próxima
            const nextUnit = playerUnits.find(u => u.hp > 0 && !gameState.unitsActedThisTurn.has(u.id));
            if (nextUnit && !gameState.selectedUnit) {
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

    function persistSessionState() {
        if (!sessionUid) return;

        const payload = {
            state: {
                player: playerUnits[0] ? {
                    id: playerUnits[0].id,
                    name: playerUnits[0].name,
                    type: playerUnits[0].type,
                    x: playerUnits[0].x,
                    y: playerUnits[0].y,
                    hp: playerUnits[0].hp,
                    maxHp: playerUnits[0].maxHp,
                    sp: playerUnits[0].sp,
                    maxSp: playerUnits[0].maxSp,
                    attack: playerUnits[0].attack,
                    defense: playerUnits[0].defense,
                    moveRange: playerUnits[0].moveRange,
                    attackRange: playerUnits[0].attackRange,
                    hasMoved: playerUnits[0].hasMoved,
                    facingRight: playerUnits[0].facingRight,
                    avatar: playerUnits[0].avatar,
                    class: playerUnits[0].class,
                    combatKey: playerUnits[0].combatKey,
                    animations: playerUnits[0].animations
                } : null,
                enemies: enemyUnits.map(e => ({
                    id: e.id, name: e.name, type: e.type,
                    x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
                    attack: e.attack, defense: e.defense,
                    moveRange: e.moveRange, attackRange: e.attackRange,
                    facingRight: e.facingRight, avatar: e.avatar,
                    behavior: e.behavior, combatKey: e.combatKey,
                    animations: e.animations
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

        fetch(`/game/explore/state?session=${encodeURIComponent(sessionUid)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => { });
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
     * Simple camera animation
     */
    function animateCameraToUnit(unit) {
        return new Promise(resolve => {
            const targetX = -(unit.x - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.width / 2;
            const targetY = -(unit.y - 0.5) * CONFIG.CELL_SIZE * viewState.scale + canvas.height / 2;

            cameraTarget = { x: targetX, y: targetY, scale: viewState.scale };

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

    function finishUnitTurn(unit) {
        if (!unit) return;
        gameState.unitsActedThisTurn.add(unit.id);

        // Clear visuals and check for end of complete phase
        deselectUnit(true);
        const allActed = playerUnits.every(u => u.hp <= 0 || gameState.unitsActedThisTurn.has(u.id));

        if (allActed) {
            endPlayerTurn();
        } else {
            // UX: Se ainda houver unidades que não agiram, selecionar a próxima automaticamente
            const nextUnit = playerUnits.find(u => u.hp > 0 && !gameState.unitsActedThisTurn.has(u.id));
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
        const hasActed = gameState.unitsActedThisTurn.has(unit.id);
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
        }

        // IMPORTANTE: Remover 'hidden' e adicionar 'visible'
        hud.classList.remove('hidden');
        hud.classList.add('visible');
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
        attackRangeCells = [];
        skillRangeCells = [];
        skillAreaCells = [];
        const range = unit.attackRange || 1;

        // Calcular células no alcance (Chebyshev - inclui diagonais)
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                if (dist > 0 && dist <= range) { // Excluir própria célula
                    const x = unit.x + dx;
                    const y = unit.y + dy;
                    if (isValidCell(x, y)) {
                        // Verificar se há inimigo nesta célula
                        const enemyHere = enemyUnits.find(e => e.x === x && e.y === y && e.hp > 0);
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

    /**
     * Mostra menu de skills tático (REDESENHADO - Lateral Esquerda)
     * @param {Object} unit - Unidade que vai usar a skill
     */
    function showSkillMenu(unit) {
        if (!unit) return;

        const skills = getUnitSkills(unit);
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

        // Criar ícones de skills
        skillBar.innerHTML = skills.map(skill => {
            const mpCost = skill.mana || skill.cost || 0;
            const canAfford = unit.sp >= mpCost;
            const typeClass = getSkillTypeClass(skill);
            const skillImg = skill.img || `/public/assets/icons/skills/${skill.id}.png`;

            return `
                <div class="skill-icon-btn ${typeClass} ${!canAfford ? 'disabled' : ''}" 
                     data-skill-id="${skill.id}"
                     data-skill-name="${skill.name}"
                     data-skill-cost="${mpCost}"
                     data-skill-desc="${skill.desc || 'No description available.'}"
                     title="${skill.name} (${mpCost} MP)">
                    <img src="${skillImg}" alt="${skill.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <i data-lucide="${skill.icon || 'zap'}" style="display: none;"></i>
                    <div class="skill-tooltip">
                        <div class="skill-tooltip-header">
                            <div class="skill-tooltip-icon ${typeClass}">
                                <img src="${skillImg}" alt="${skill.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <i data-lucide="${skill.icon || 'zap'}" style="display: none;"></i>
                            </div>
                            <div>
                                <div class="skill-tooltip-name">${skill.name}</div>
                                <div class="skill-tooltip-cost ${!canAfford ? 'insufficient' : ''}">${mpCost} MP</div>
                            </div>
                        </div>
                        <div class="skill-tooltip-desc">${skill.desc || 'No description available.'}</div>
                        <button class="skill-tooltip-btn" ${!canAfford ? 'disabled' : ''}>
                            Usar Skill
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        skillBar.style.display = 'flex';

        // Atualizar ícones Lucide
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 10);
        }

        // Aguardar DOM ser atualizado antes de anexar listeners
        setTimeout(() => {
            attachSkillBarListeners(unit, skills);
        }, 50);
    }

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

        // Event listeners
        const buttons = skillBar.querySelectorAll('.skill-icon-btn');
        console.log('[DEBUG] Found', buttons.length, 'skill buttons');

        buttons.forEach(btn => {
            const tooltip = btn.querySelector('.skill-tooltip');
            if (!tooltip) {
                console.warn('[DEBUG] Tooltip not found for skill button:', btn.dataset.skillId);
                return;
            }

            // Click para abrir/fechar tooltip
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();

                const isVisible = tooltip.classList.contains('visible');

                // Fechar todos os tooltips primeiro
                skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => {
                    t.classList.remove('visible');
                });

                // Se não estava visível, abrir este
                if (!isVisible && !btn.classList.contains('disabled')) {
                    tooltip.classList.add('visible');
                }
            });

            // Botão "Usar" no tooltip
            const useBtn = tooltip.querySelector('.skill-tooltip-btn');
            if (useBtn) {
                console.log('[DEBUG] Attaching click listener to useBtn for skill:', btn.dataset.skillId);

                // Remover listener anterior se existir (para evitar duplicatas)
                const newUseBtn = useBtn.cloneNode(true);
                useBtn.parentNode.replaceChild(newUseBtn, useBtn);

                newUseBtn.addEventListener('click', (e) => {
                    console.log('[DEBUG] Use Skill button clicked!', {
                        skillId: btn.dataset.skillId,
                        unit: unit?.id || unit?.name,
                        hasUnit: !!unit,
                        hasSkills: !!skills
                    });
                    e.stopPropagation();
                    e.preventDefault();
                    const skillId = btn.dataset.skillId;
                    const skill = skills.find(s => s.id === skillId);
                    console.log('[DEBUG] Skill lookup result:', {
                        skillId,
                        skillFound: !!skill,
                        skillName: skill?.name,
                        unitMP: unit?.sp,
                        skillMana: skill?.mana || skill?.cost,
                        canAfford: skill && unit.sp >= (skill.mana || skill.cost || 0)
                    });
                    if (skill && unit && unit.sp >= (skill.mana || skill.cost || 0)) {
                        console.log('[DEBUG] Calling selectSkillForUse with:', { unitId: unit.id, skillId: skill.id });
                        selectSkillForUse(unit, skill);
                        console.log('[DEBUG] selectSkillForUse called successfully');
                        // Não precisa chamar hideSkillMenu() aqui pois selectSkillForUse já faz isso
                    } else {
                        console.warn('[DEBUG] Cannot use skill - insufficient MP or skill not found');
                    }
                });
            } else {
                console.warn('[DEBUG] useBtn not found in tooltip!');
            }
        });

        // Fechar tooltips ao clicar fora (com delay para não interferir com clique inicial)
        let closeTooltipsHandlerTimeout = null;
        const closeTooltipsHandler = function (e) {
            const clickedTooltip = e.target.closest('.skill-tooltip');
            const clickedBtn = e.target.closest('.skill-icon-btn');

            // Se clicou dentro de um tooltip ou botão, não fechar
            if (clickedTooltip || clickedBtn) {
                return;
            }

            // Fechar todos os tooltips
            skillBar.querySelectorAll('.skill-tooltip.visible').forEach(t => {
                t.classList.remove('visible');
            });
        };

        // Adicionar listener com delay para não interferir com cliques nos botões
        setTimeout(() => {
            document.addEventListener('click', closeTooltipsHandler);
        }, 250);
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
        needsRender = true;
    }

    /**
     * Seleciona uma skill para usar
     * @param {Object} unit - Unidade que vai usar
     * @param {Object} skill - Skill selecionada
     */
    function selectSkillForUse(unit, skill) {
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
        document.getElementById('action-skills')?.addEventListener('click', () => {
            if (gameState.selectedUnit) {
                showSkillMenu(gameState.selectedUnit);
            }
        });
        document.getElementById('action-finish')?.addEventListener('click', () => {
            if (gameState.selectedUnit) finishUnitTurn(gameState.selectedUnit);
        });
        document.getElementById('action-cancel')?.addEventListener('click', () => deselectUnit());

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

        document.getElementById('tactical-move')?.addEventListener('click', () => {
            if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                setAction('move');
                hideTacticalHUD();
            }
        });

        document.getElementById('tactical-attack')?.addEventListener('click', () => {
            if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                showAttackRange(gameState.selectedUnit);
                showTacticalHUD(gameState.selectedUnit); // Atualizar estado ativo do botão
            }
        });

        document.getElementById('tactical-skills')?.addEventListener('click', () => {
            if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                showSkillMenu(gameState.selectedUnit);
            }
        });

        document.getElementById('tactical-endturn')?.addEventListener('click', () => {
            if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                finishUnitTurn(gameState.selectedUnit);
                hideTacticalHUD();
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
     * Exibe banner animado ao ativar uma skill
     */
    function showSkillBanner(skillName, skillIcon = 'zap', skillType = 'physical') {
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
                    <div class="skill-banner-icon">
                        <i data-lucide="${skillIcon}"></i>
                    </div>
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
     * Exibe cut-in estilo anime para ULTIMATE skills
     */
    function showUltimateCutIn(skillName, skillIcon = 'zap') {
        return new Promise((resolve) => {
            const container = document.body;

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
                        <div class="ultimate-icon">
                            <i data-lucide="${skillIcon}"></i>
                        </div>
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

        // Clear existing (except label)
        const label = timeline.querySelector('.timeline-label');
        timeline.innerHTML = '';
        if (label) timeline.appendChild(label);

        // Get all units in order
        const allUnits = [];

        // Current phase units first
        const currentUnits = gameState.phase === 'player' ? playerUnits : enemyUnits;
        const nextUnits = gameState.phase === 'player' ? enemyUnits : playerUnits;

        currentUnits.filter(u => u.hp > 0).forEach(u => allUnits.push({ ...u, isCurrent: true }));

        // Add separator
        if (nextUnits.filter(u => u.hp > 0).length > 0) {
            allUnits.push({ separator: true });
            nextUnits.filter(u => u.hp > 0).forEach(u => allUnits.push({ ...u, isCurrent: false }));
        }

        // Render units as cards
        allUnits.forEach((unit, index) => {
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

            // Portrait frame
            const portraitFrame = document.createElement('div');
            portraitFrame.className = 'unit-portrait-frame';

            const img = document.createElement('img');
            img.src = unit.avatar || '/public/assets/img/characters/swordman.png';
            img.alt = unit.name;
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
            hpIcon.textContent = '?';
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
            mpIcon.textContent = '?';
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
     * Desenha o alcance de uma skill selecionada (PREMIUM STYLE - igual ao movimento)
     */
    function drawSkillRangeCells() {
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
        if (skillAreaCells.length === 0) return;

        const pulse = (Math.sin(animationFrame / 10) + 1) / 2;
        const scan = (animationFrame % 60) / 60;

        skillAreaCells.forEach(cell => {
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
        if (floatingTexts.length === 0) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const now = performance.now();

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];

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
                floatingTexts.splice(i, 1);
                continue;
            }

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
        // Salvar posição do mouse em coordenadas de canvas para uso em facing
        lastMouseCanvasPos = { x: mouseX, y: mouseY };
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
                executeAttack(gameState.selectedUnit, targetCell.enemy).then(() => {
                    persistSessionState();
                    hideTacticalHUD();
                });
            } else {
                // Verificar se clicou em inimigo fora de alcance
                const enemyAtCell = unitAtCell && unitAtCell.type === 'enemy' ? unitAtCell : null;
                if (enemyAtCell) {
                    showRangeWarning(); // Mensagem discreta no topo
                }
            }
            return;
        }

        if (gameState.currentAction === 'skill' && gameState.selectedSkill && gameState.selectedUnit) {
            const inRange = skillRangeCells.some(c => c.x === x && c.y === y);
            if (!inRange) {
                showNotification('Alvo fora do alcance da skill!', 'warning');
                return;
            }

            const caster = gameState.selectedUnit;
            const skill = gameState.selectedSkill;
            const rangeType = getSkillRangeType(skill);

            let targets = [];
            if (rangeType === 'self') {
                targets = [caster];
            } else {
                const area = calculateSkillArea(skill, x, y, caster.x, caster.y);
                const targetType = skill.type === 'ally' || skill.type === 'aoe_heal' ? 'player' : 'enemy';
                targets = [...playerUnits, ...enemyUnits].filter(u =>
                    u.hp > 0 &&
                    u.type === targetType &&
                    area.some(cell => cell.x === u.x && cell.y === u.y)
                );
            }

            if (targets.length === 0 && rangeType !== 'self') {
                showNotification('Nenhum alvo válido na área.', 'warning');
                return;
            }

            // Limpar estado de skill e executar
            skillRangeCells = [];
            skillAreaCells = [];
            gameState.currentAction = null;
            gameState.selectedSkill = null;

            executeSkill(caster, targets[0] || null, skill, targets).then(() => {
                persistSessionState();
                hideTacticalHUD();
            });
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
            if (unitAtCell && unitAtCell.type === 'player' && canUnitAct(unitAtCell)) {
                if (!unit.hasMoved) {
                    selectUnit(unitAtCell);
                    return;
                } else {
                    showGlobalNotification('Finalize a ação atual primeiro!', 'warning', 'alert-circle');
                    return;
                }
            }

            // Click an enemy -> orientar uso do botão Atacar/Skills (mensagem no topo)
            // NOVO: Se estiver em range, habilitar modo de ataque automaticamente
            if (unitAtCell && unitAtCell.type === 'enemy') {
                const dist = Math.max(Math.abs(unit.x - unitAtCell.x), Math.abs(unit.y - unitAtCell.y));
                if (dist <= (unit.attackRange || 1)) {
                    showAttackRange(unit);
                    showTacticalHUD(unit);
                    return;
                }
                showTopBanner('Use o botão Atacar ou Skills para atacar', 'info');
                return;
            }


            // Clicked empty ground or irrelevant cell
            const alivePlayers = playerUnits.filter(u => u.hp > 0);
            if (alivePlayers.length === 1) {
                // Se há apenas 1 personagem, manter selecionado
                showTacticalHUD(unit);
            } else if (!unit.hasMoved) {
                deselectUnit();
            } else {
                // Se já moveu, manter HUD tática
                showTacticalHUD(unit);
            }
        } else {
            // 2. Select unit if nothing selected
            if (unitAtCell && unitAtCell.type === 'player' && canUnitAct(unitAtCell)) {
                selectUnit(unitAtCell);
            } else {
                const alivePlayers = playerUnits.filter(u => u.hp > 0);
                if (alivePlayers.length === 1) {
                    // Se há apenas 1 personagem, manter selecionado
                    if (gameState.selectedUnit) {
                        showTacticalHUD(gameState.selectedUnit);
                    }
                } else {
                    deselectUnit();
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

    function handleKeyDown(e) {
        if (gameState.isAnimating) return;

        switch (e.key.toLowerCase()) {
            case 'escape':
                // Se estiver em modo de ação (move/attack/skill), cancelar ação, senão desselecionar unidade
                if (gameState.currentAction || attackRangeCells.length > 0 || skillRangeCells.length > 0) {
                    gameState.currentAction = null;
                    attackRangeCells = [];
                    skillRangeCells = [];
                    skillAreaCells = [];
                    clearHighlights();
                    if (gameState.selectedUnit) showTacticalHUD(gameState.selectedUnit);
                    needsRender = true;
                } else {
                    deselectUnit();
                }
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
                    showSkillMenu(gameState.selectedUnit);
                }
                break;
            case 'f':
                // Atalho para Flee/Pass (Finalizar Turno da Unidade)
                if (gameState.selectedUnit && gameState.selectedUnit.type === 'player') {
                    finishUnitTurn(gameState.selectedUnit);
                    hideTacticalHUD();
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
    // SPRITE FACING DIRECTION
    // =====================================================

    /**
     * Calcula se a unidade deve estar virada para direita baseado na posição do mouse
     * Se o mouse estiver na mesma célula do personagem, mantém a pose atual
     * @param {Object} unit - Unidade a verificar
     * @param {number} mouseWorldX - Posição X do mouse em coordenadas de mundo
     * @param {number} mouseWorldY - Posição Y do mouse em coordenadas de mundo
     * @returns {boolean|null} true se deve estar virado para direita, false para esquerda, null para manter atual
     */
    function calculateFacingFromMouse(unit, mouseWorldX, mouseWorldY) {
        // Calcular célula do mouse
        const mouseCellX = Math.floor(mouseWorldX / CONFIG.CELL_SIZE) + 1;
        const mouseCellY = Math.floor(mouseWorldY / CONFIG.CELL_SIZE) + 1;

        // Se o mouse está na mesma célula do personagem, manter pose atual
        if (mouseCellX === unit.x && mouseCellY === unit.y) {
            return null; // null = manter direção atual
        }

        // Se mouse está em célula diferente, calcular direção baseada na posição
        const unitWorldX = (unit.x - 0.5) * CONFIG.CELL_SIZE;
        // Se mouse está à direita do personagem, virar para direita
        return mouseWorldX > unitWorldX;
    }

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
        // Se movimento vertical, manter direção atual ou usar mouse
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
    function gameLoop() {
        animationFrame++;

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
        if (loadedImages.map) {
            ctx.save();
            const hasFocus = reachableCells.length > 0 || attackableCells.length > 0 || attackPreviewCells.length > 0 || attackRangeCells.length > 0;

            if (hasFocus) {
                // Aplicar desaturação (preto e branco) no mapa
                ctx.filter = 'grayscale(0.85) brightness(0.35)';
            }
            ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.restore();
        }

        // Grid (Subtle lines)
        drawGrid();

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
        // Isso garante que unidades mais abaixo fiquem por cima visualmente
        // Se o mouse está sobre uma unidade, ela é desenhada por último (z-index dinâmico)
        // EXCEÇÃO: Se inimigo está ACIMA de um player, não muda z-index (evita "montar" no herói)

        // Verificar se hovered unit é inimigo acima de algum player
        let shouldBoostHoveredZIndex = true;
        let playerToFade = null; // Player que deve ter opacidade reduzida

        if (hoveredUnit && hoveredUnit.type === 'enemy') {
            // Verificar se há um player adjacente ABAIXO do inimigo hovered
            for (const player of playerUnits) {
                if (player.hp <= 0) continue;
                const dx = Math.abs(player.x - hoveredUnit.x);
                const dy = player.y - hoveredUnit.y; // Positivo = player abaixo, negativo = player acima
                const isAdjacent = dx <= 1 && Math.abs(dy) <= 1 && !(dx === 0 && dy === 0);

                if (isAdjacent && dy > 0) {
                    // Inimigo está ACIMA do player - não boostar z-index
                    // Em vez disso, reduzir opacidade do player para destacar o inimigo
                    shouldBoostHoveredZIndex = false;
                    playerToFade = player;
                    break;
                }
            }
        }

        const allUnits = [
            ...enemyUnits.filter(u => u.hp > 0).map(u => ({ unit: u, type: 'enemy' })),
            ...playerUnits.filter(u => u.hp > 0).map(u => ({ unit: u, type: 'player' }))
        ].sort((a, b) => {
            // Unidade sob o mouse por último (por cima) - apenas se permitido
            if (shouldBoostHoveredZIndex && hoveredUnit === a.unit) return 1;
            if (shouldBoostHoveredZIndex && hoveredUnit === b.unit) return -1;
            // Ordenação padrão por Y
            return a.unit.y - b.unit.y;
        });

        // Primeira passada: desenhar sprites (sem barras de HP)
        allUnits.forEach(({ unit, type }) => {
            // Aplicar opacidade reduzida no player quando inimigo acima está em hover
            const shouldFade = playerToFade === unit;
            if (shouldFade) {
                unit._tempFadeOpacity = 0.5; // Opacidade temporária
            }
            drawUnitSprite(unit, type);
            if (shouldFade) {
                delete unit._tempFadeOpacity;
            }
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

        // Draw walls - APENAS EM DEBUG MODE (não renderizar durante jogo normal)
        if (debugMode) {
            // Draw todas as paredes em vermelho (fixas do config + novas adicionadas)
            // Paredes fixas do config (em vermelho)
            WALLS.forEach(wall => {
                // Não desenhar se estiver na lista de removidas
                const isRemoved = debugWallsRemoved.some(r => r.x === wall.x && r.y === wall.y);
                if (isRemoved) return;

                const x = (wall.x - 1) * CONFIG.CELL_SIZE;
                const y = (wall.y - 1) * CONFIG.CELL_SIZE;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Vermelho semi-transparente
                ctx.fillRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

                // Borda vermelha para destacar
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
            });

            // Draw debug walls (paredes novas adicionadas - também em vermelho)
            if (debugWallsAdded.length > 0) {
                debugWallsAdded.forEach(wall => {
                    const x = (wall.x - 1) * CONFIG.CELL_SIZE;
                    const y = (wall.y - 1) * CONFIG.CELL_SIZE;
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Vermelho semi-transparente
                    ctx.fillRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);

                    // Borda vermelha para destacar
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 2, y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
                });
            }
        }
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
        // Usa a função drawUnit mas marca para pular as barras
        unit._skipBars = true;
        drawUnit(unit, type);
        unit._skipBars = false;
    }

    function drawUnitBars(unit, type) {
        // Desenha apenas as barras de HP/MP
        if (unit.hp === undefined) return;

        const cx = unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE;
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;
        const radius = CONFIG.CELL_SIZE * 0.45;

        // Calcular posição das barras baseada SEMPRE na animação IDLE para manter fixa
        const spriteName = getSpriteNameForUnit(unit);
        const spriteAnimations = spriteName ? spriteCache.get(spriteName) : null;

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

            // Posicionar barra acima do sprite + margem negativa solicitada (-20px para baixo da borda)
            barY = drawY + 2; // +2px em vez de -18px para aproximar do personagem conforme solicitado
        } else {
            barY = -radius - 16;
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
        const cx = unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE;
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;

        const isSelected = gameState.selectedUnit === unit;
        const hasActed = gameState.unitsActedThisTurn.has(unit.id);
        const isCurrentPhase = gameState.phase === type;
        const canStillAct = unit.hp > 0 && !hasActed;

        const img = loadedImages[unit.id];
        const spriteName = getSpriteNameForUnit(unit);
        const spriteAnimations = spriteName ? spriteCache.get(spriteName) : null;

        // DEBUG: Verificar se imagens desaparecem quando debug é ativado
        if (window.DEBUG_MODE && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive() && unit.id && !unit._debugCheckLogged) {
            unit._debugCheckLogged = true;
            console.log(`[drawUnit DEBUG-CHECK] ${unit.id}: loadedImages[${unit.id}]=${loadedImages[unit.id] ? `Image(${loadedImages[unit.id].width}x${loadedImages[unit.id].height})` : 'undefined'}, img=${img ? 'exists' : 'null'}, avatar=${unit.avatar}`);
        }

        // Obter estado de animação da unidade
        // Se debug mode estiver ativo e tiver animação forçada, usar ela; senão usar forceAnimation da unidade
        let animationState;
        // Verificar se debug está ativo E se é para aplicar override apenas para a unidade selecionada
        const isDebugActive = window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive();
        const debugSelectedUnit = isDebugActive && window.MapDebug.getSelectedUnit ? window.MapDebug.getSelectedUnit() : null;
        const shouldApplyDebugAnimation = isDebugActive && debugSelectedUnit === unit;

        if (shouldApplyDebugAnimation) {
            const debugAnimationState = window.MapDebug.getAnimationState ? window.MapDebug.getAnimationState() : null;
            if (debugAnimationState !== null && debugAnimationState !== 'auto') {
                animationState = debugAnimationState; // Forçar estado no debug apenas para unidade selecionada
            } else if (unit.forceAnimation && unit.forceAnimation !== 'auto') {
                animationState = unit.forceAnimation;
            } else {
                animationState = unit.animationState || 'idle'; // Estado real da unidade
            }
        } else if (unit.forceAnimation && unit.forceAnimation !== 'auto') {
            animationState = unit.forceAnimation;
        } else {
            animationState = unit.animationState || 'idle'; // Estado real da unidade
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

        // Sistema de mira removido (mapCombat descontinuado)

        // 2. Base Square REMOVIDO (usuário solicitou remover o quadrado azul)

        // Desenhar sombra oval premium sob o personagem
        ctx.save();

        // Sombra principal - elipse grande e suave
        // Y recuado para cima para parecer mais "no chão"
        const shadowCenterY = baseHalf * 0.30; // Recuado ainda mais para cima
        const shadowRadiusX = baseHalf * 1.15;  // Expandido nas laterais
        const shadowRadiusY = baseHalf * 0.38;  // Proporção

        // Gradiente radial para sombra suave - MAIS INTENSO
        const shadowGrad = ctx.createRadialGradient(0, shadowCenterY, 0, 0, shadowCenterY, shadowRadiusX);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
        shadowGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.35)');
        shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, shadowCenterY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sombra interna mais escura (núcleo) - MAIS FORTE
        const innerShadowGrad = ctx.createRadialGradient(0, shadowCenterY, 0, 0, shadowCenterY, shadowRadiusX * 0.35);
        innerShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        innerShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = innerShadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, shadowCenterY, shadowRadiusX * 0.45, shadowRadiusY * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

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
                if (useDebugOverrides && window.MapDebug && window.MapDebug.isActive && window.MapDebug.isActive()) {
                    const debugSelectedUnit = window.MapDebug.getSelectedUnit();
                    if (debugSelectedUnit === unit) {
                        const offsetX = (unit.debugOffsetX !== undefined) ? unit.debugOffsetX : baseOffsetX;
                        const offsetY = (unit.debugOffsetY !== undefined) ? unit.debugOffsetY : baseOffsetY;
                        drawX += offsetX;
                        drawY += offsetY;
                    } else {
                        drawX += baseOffsetX;
                        drawY += baseOffsetY;
                    }
                } else {
                    drawX += baseOffsetX;
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
                if (unit.hitFlash && unit.hitFlash > 0 && !isGhost) {
                    // Criar canvas temporário para aplicar tint apenas nos pixels do sprite
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = frame.width;
                    tempCanvas.height = frame.height;
                    const tempCtx = tempCanvas.getContext('2d');

                    // Desenhar sprite original
                    tempCtx.drawImage(frame, 0, 0);

                    // Aplicar overlay vermelho apenas nos pixels não-transparentes
                    tempCtx.globalCompositeOperation = 'source-atop';
                    tempCtx.fillStyle = `rgba(255, 0, 0, ${unit.hitFlash * 0.5})`;
                    tempCtx.fillRect(0, 0, frame.width, frame.height);

                    // Desenhar o sprite com tint
                    if (unit.facingRight) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        const flippedDrawX = -drawX - scaledWidth;
                        ctx.drawImage(tempCanvas, flippedDrawX, drawY, scaledWidth, scaledHeight);
                        ctx.restore();
                    } else {
                        ctx.drawImage(tempCanvas, drawX, drawY, scaledWidth, scaledHeight);
                    }
                } else {
                    // Desenhar sprite normal
                    if (unit.facingRight) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        const flippedDrawX = -drawX - scaledWidth;
                        ctx.drawImage(frame, flippedDrawX, drawY, scaledWidth, scaledHeight);
                        ctx.restore();
                    } else {
                        ctx.drawImage(frame, drawX, drawY, scaledWidth, scaledHeight);
                    }
                }

                ctx.globalAlpha = prevAlpha;
            };

            // Calcular direção baseada no mouse (player) ou posição do player (inimigos)
            if (!gameState.isAnimating) {
                const isPlayer = unit.type === 'player' || unit.id === 'player';

                if (isPlayer && lastMouseCanvasPos) {
                    // Player: vira para onde o mouse está
                    const mouseWorld = screenToWorld(lastMouseCanvasPos.x, lastMouseCanvasPos.y);
                    const facingFromMouse = calculateFacingFromMouse(unit, mouseWorld.x, mouseWorld.y);
                    // Só atualizar se não for null (null = manter pose atual)
                    if (facingFromMouse !== null) {
                        unit.facingRight = facingFromMouse;
                    }
                } else if (!isPlayer && playerUnits.length > 0) {
                    // Inimigos: sempre viram para onde o player está
                    const player = playerUnits[0];
                    if (player && player.hp > 0) {
                        const playerWorldX = (player.x - 0.5) * CONFIG.CELL_SIZE;
                        const unitWorldX = (unit.x - 0.5) * CONFIG.CELL_SIZE;
                        // Se player está à direita do inimigo, inimigo vira para direita
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
            // Se tiver sprite, posicionar barras acima do sprite, senão usar posição padrão
            let by;
            if (spriteTopY !== null && spriteTopY < 0) {
                // Posicionar acima do sprite (spriteTopY é negativo, então subtrair mais para ficar acima)
                by = spriteTopY - 20;
            } else {
                // Posição padrão acima do círculo
                by = -radius - 16;
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
                // Barras estão em spriteTopY - 20, então seta fica 15px acima das barras
                arrowY = spriteTopY - 35;
            } else {
                // Barras estão em -radius - 16, então seta fica acima
                arrowY = -radius - 35;
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
    // ATMospheric particles
    // =====================================================
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
        if (window.combatData) {
            callback();
        } else if (attempt < maxAttempts) {
            setTimeout(() => waitForDependencies(callback, maxAttempts, attempt + 1), 100);
        } else {
            console.error('[MAP-ENGINE] Timeout aguardando dependências. combatData não disponível.');
            hideLoadingState();
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

    // Expose public API
    window.MapEngine = {
        resetGame: resetGame,
        saveMapState: saveMapState
    };

})();


