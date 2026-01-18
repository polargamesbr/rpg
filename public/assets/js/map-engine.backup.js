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
        player: { duration: 180, easing: 'snappy', bounce: 2.0, cameraEase: 0.16 },
        enemy: { duration: 260, easing: 'heavy', bounce: 1.2, cameraEase: 0.08 }
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
        freeExplore: false
    };

    // MODO COMBATE NO MAPA (sem cartas)
    const mapCombat = {
        active: false,
        heroes: [],
        enemies: [],
        turnOrder: [],
        activeEntityId: null,
        selectedAction: null, // 'attack' | 'skill' | 'defend' | 'flee'
        selectedSkill: null,
        targetMode: 'enemy', // 'enemy' | 'ally'
        actionTargets: [],
        uiReady: false,
        targetId: null,
        combatIds: new Set(),
        battleRect: null
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
        } else {
            console.warn(`[SpriteAnimation] Tipo de animação inválido: ${animationType}`);
            return null;
        }
        
        // Criar objeto de estado da animação
        const animation = {
            name: animationType,
            frames: [],
            frameCount: 0,
            fps: 7, // FPS padrão para animação
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
            loaded: false
        };
        
        // Armazenar no cache imediatamente para evitar carregamentos duplicados
        spriteCache.set(spriteName, spriteAnimations);
        
        // Carregar animações em paralelo
        const [idleAnimation, walkAnimation] = await Promise.all([
            loadSpriteAnimation(spriteName, 'idle'),
            loadSpriteAnimation(spriteName, 'walk')
        ]);
        
        spriteAnimations.idle = idleAnimation;
        spriteAnimations.walk = walkAnimation;
        
        // Considerar carregado se pelo menos uma animação foi carregada
        spriteAnimations.loaded = (idleAnimation !== null || walkAnimation !== null);
        
        if (!spriteAnimations.loaded) {
            console.warn(`[SpriteAnimations] Nenhuma animação carregada para ${spriteName}`);
        } else {
            console.log(`[SpriteAnimations] Carregado ${spriteName}: idle=${idleAnimation !== null}, walk=${walkAnimation !== null}`);
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
            if (useDebugOverrides && debugMode && debugSelectedUnit === unit && unit && unit.debugFPS !== undefined) {
                fps = unit.debugFPS;
            } else {
                fps = baseFPS;
            }
            const frameDuration = 60 / fps;
            return Math.floor((animationFrame / frameDuration) % fallback.frameCount);
        }
        
        // Usar animationFrame global para sincronizar animação
        // FPS controlável via debug UI (apenas para unidade selecionada) ou padrão 7
        let fps;
        // Buscar FPS específico da animação atual (idle/walk) ou usar global (retrocompatibilidade)
        let animConfig = null;
        if (unit && unit.animations && unit.animations[state]) {
            animConfig = unit.animations[state];
        }
        const defaultFPS = state === 'walk' ? 8 : 7;
        const baseFPS = animConfig?.animationFPS !== undefined
            ? animConfig.animationFPS
            : (unit && unit.animationFPS !== undefined ? unit.animationFPS : (animation.fps || defaultFPS));
        if (useDebugOverrides && debugMode && debugSelectedUnit === unit && unit && unit.debugFPS !== undefined) {
            fps = unit.debugFPS;
        } else {
            fps = baseFPS;
        }
        const frameDuration = 60 / fps; // Frames do game loop por frame de animação
        const frameIndex = Math.floor((animationFrame / frameDuration) % animation.frameCount);
        
        return frameIndex;
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
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
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
    let reachableCells = [];
    let attackableCells = [];
    let attackPreviewCells = []; // Cells showing 3x3 attack radius (allies who will join)
    let pendingAttack = null;    // { hero, enemy, allies, enemies } - pending attack confirmation
    let pathPreview = [];

    let animationFrame = 0;
    let needsRender = true;
    let floatingTexts = [];
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
    
    // Detectar debug mode da URL ou localStorage
    function initDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const debugParam = urlParams.get('debug');
        
        // Debug só ativa se explicitamente passado na URL como ?debug=true
        // Não usar localStorage sozinho para evitar debug acidental
        debugMode = debugParam === 'true';
        
        if (debugMode) {
            console.log('[DEBUG] Modo debug ativado!');
            createDebugUI();
        }
    }
    
    // Criar UI de debug
    function createDebugUI() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #60a5fa;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            color: white;
            font-family: monospace;
            font-size: 12px;
            min-width: 200px;
        `;
        
        debugPanel.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 10px;">🐛 DEBUG MODE</div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Animação FPS: <span id="debug-fps-value">${debugFPS}</span></label>
                <input type="range" id="debug-fps-slider" min="1" max="30" step="0.5" value="${debugFPS}" 
                       style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Escala: <span id="debug-scale-value">${debugScale}</span>x</label>
                <input type="range" id="debug-scale-slider" min="0.5" max="5" step="0.1" value="${debugScale}" 
                       style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Offset X: <span id="debug-offset-x-value">${debugOffsetX}</span>px</label>
                <input type="range" id="debug-offset-x-slider" min="-100" max="100" step="1" value="${debugOffsetX}" 
                       style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Offset Y: <span id="debug-offset-y-value">${debugOffsetY}</span>px</label>
                <input type="range" id="debug-offset-y-slider" min="-100" max="100" step="1" value="${debugOffsetY}" 
                       style="width: 100%;">
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 8px;">Forçar Animação:</div>
                <div style="display: flex; gap: 4px;">
                    <button id="debug-anim-idle" style="flex: 1; padding: 6px; background: ${debugAnimationState === 'idle' ? '#3b82f6' : '#1e40af'}; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Idle</button>
                    <button id="debug-anim-walk" style="flex: 1; padding: 6px; background: ${debugAnimationState === 'walk' ? '#3b82f6' : '#1e40af'}; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Walk</button>
                    <button id="debug-anim-auto" style="flex: 1; padding: 6px; background: ${debugAnimationState === null ? '#3b82f6' : '#1e40af'}; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Auto</button>
                </div>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">
                    <span id="debug-anim-state">${debugAnimationState || 'Automático'}</span>
                </div>
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 6px;">Comparar Idle/Walk:</div>
                <button id="debug-compare-anim" style="width: 100%; padding: 6px; background: ${debugCompareAnimations ? '#22c55e' : '#1e40af'}; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">
                    ${debugCompareAnimations ? 'Comparação ligada' : 'Comparação desligada'}
                </button>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Mostra as duas animações lado a lado</div>
                <div style="margin-top: 8px;">
                    <label style="display: block; margin-bottom: 4px; font-size: 10px; color: #888;">Distância da cópia: <span id="debug-compare-offset-value">${debugCompareOffset}</span>px</label>
                    <input type="range" id="debug-compare-offset" min="0" max="200" step="1" value="${debugCompareOffset}" style="width: 100%;">
                </div>
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 5px;">Unidade Selecionada:</div>
                <div id="debug-selected-unit" style="font-size: 11px; color: #60a5fa; margin-bottom: 8px; min-height: 16px;">
                    Clique em uma unidade
                </div>
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 6px;">Config JSON (unidade selecionada):</div>
                <textarea id="debug-unit-config" readonly style="width: 100%; height: 90px; resize: none; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 6px; font-size: 10px; border-radius: 4px;"></textarea>
                <button id="debug-copy-config" style="width: 100%; margin-top: 6px; padding: 6px; background: #22c55e; border: 1px solid #16a34a; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">📋 Copiar JSON da Unidade</button>
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 8px;">Mover Unidade:</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 120px; margin: 0 auto;">
                    <div></div>
                    <button id="debug-move-up" style="padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">↑</button>
                    <div></div>
                    <button id="debug-move-left" style="padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">←</button>
                    <button id="debug-move-center" style="padding: 6px; background: #1e40af; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;" title="Pos atual">·</button>
                    <button id="debug-move-right" style="padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">→</button>
                    <div></div>
                    <button id="debug-move-down" style="padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 14px;">↓</button>
                    <div></div>
                </div>
            </div>
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 8px;">Editar Paredes:</div>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="debug-edit-walls" style="cursor: pointer;">
                    <span style="font-size: 11px;">Ativar edição de paredes</span>
                </label>
                <button id="debug-copy-walls" style="width: 100%; margin-top: 8px; padding: 8px; background: #ef4444; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">📋 Copiar JSON das Paredes</button>
                <button id="debug-clear-walls" style="width: 100%; margin-top: 4px; padding: 6px; background: #6b7280; border: 1px solid #4b5563; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Limpar Paredes</button>
                <div id="debug-walls-count" style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">
                    Paredes: 0
                </div>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // Função para atualizar valores do painel baseado na unidade selecionada
        function updateDebugPanelFromUnit() {
            if (debugSelectedUnit) {
                // Carregar valores da unidade selecionada ou usar padrões
                const unit = debugSelectedUnit;
                
                // Determinar qual animação está ativa (debug forçado ou animação real)
                const activeAnimationState = debugAnimationState !== null 
                    ? debugAnimationState 
                    : (unit.animationState || 'idle');
                
                // Buscar configurações específicas da animação atual ou usar globais (retrocompatibilidade)
                let animConfig = null;
                if (unit.animations && unit.animations[activeAnimationState]) {
                    animConfig = unit.animations[activeAnimationState];
                    console.log(`[DEBUG] Lendo valores originais da animação ${activeAnimationState}:`, animConfig);
                }
                
                // Usar valores originais da configuração da animação atual
                // Valores de debug só são usados se não tivermos mudado de animação recentemente
                // (os valores de debug são limpos quando muda entre idle/walk)
                const currentFPS = unit.debugFPS !== undefined 
                    ? unit.debugFPS 
                    : (animConfig?.animationFPS !== undefined 
                        ? animConfig.animationFPS 
                        : (unit.animationFPS !== undefined ? unit.animationFPS : debugFPS));
                
                const currentScale = unit.debugScale !== undefined 
                    ? unit.debugScale 
                    : (animConfig?.animationScale !== undefined 
                        ? animConfig.animationScale 
                        : (unit.animationScale !== undefined ? unit.animationScale : debugScale));
                
                const currentOffsetX = unit.debugOffsetX !== undefined 
                    ? unit.debugOffsetX 
                    : (animConfig?.animationOffsetX !== undefined 
                        ? animConfig.animationOffsetX 
                        : (unit.animationOffsetX !== undefined ? unit.animationOffsetX : debugOffsetX));
                
                const currentOffsetY = unit.debugOffsetY !== undefined 
                    ? unit.debugOffsetY 
                    : (animConfig?.animationOffsetY !== undefined 
                        ? animConfig.animationOffsetY 
                        : (unit.animationOffsetY !== undefined ? unit.animationOffsetY : debugOffsetY));
                
                // Atualizar sliders
                const fpsSlider = document.getElementById('debug-fps-slider');
                const scaleSlider = document.getElementById('debug-scale-slider');
                const offsetXSlider = document.getElementById('debug-offset-x-slider');
                const offsetYSlider = document.getElementById('debug-offset-y-slider');
                
                if (fpsSlider) { fpsSlider.value = currentFPS; document.getElementById('debug-fps-value').textContent = currentFPS; }
                if (scaleSlider) { scaleSlider.value = currentScale; document.getElementById('debug-scale-value').textContent = currentScale + 'x'; }
                if (offsetXSlider) { offsetXSlider.value = currentOffsetX; document.getElementById('debug-offset-x-value').textContent = currentOffsetX + 'px'; }
                if (offsetYSlider) { offsetYSlider.value = currentOffsetY; document.getElementById('debug-offset-y-value').textContent = currentOffsetY + 'px'; }
            }
        }

        function updateDebugConfigJson() {
            const configTextarea = document.getElementById('debug-unit-config');
            if (!configTextarea) return;
            if (!debugSelectedUnit) {
                configTextarea.value = '';
                return;
            }
            const unit = debugSelectedUnit;
            
            // Determinar qual animação está ativa (debug forçado ou animação real)
            const activeAnimationState = debugAnimationState !== null 
                ? debugAnimationState 
                : (unit.animationState || 'idle');
            
            // Buscar configurações específicas da animação atual ou usar globais (retrocompatibilidade)
            let animConfig = null;
            if (unit.animations && unit.animations[activeAnimationState]) {
                animConfig = unit.animations[activeAnimationState];
            }
            
            // Se tiver configurações específicas por animação, mostrar o objeto animations completo
            if (unit.animations && typeof unit.animations === 'object') {
                const config = {
                    animations: {
                        idle: {
                            animationFPS: unit.animations.idle?.animationFPS ?? (unit.animationFPS ?? debugFPS),
                            animationScale: unit.animations.idle?.animationScale ?? (unit.animationScale ?? debugScale),
                            animationOffsetX: unit.animations.idle?.animationOffsetX ?? (unit.animationOffsetX ?? debugOffsetX),
                            animationOffsetY: unit.animations.idle?.animationOffsetY ?? (unit.animationOffsetY ?? debugOffsetY)
                        },
                        walk: {
                            animationFPS: unit.animations.walk?.animationFPS ?? (unit.animationFPS ?? debugFPS),
                            animationScale: unit.animations.walk?.animationScale ?? (unit.animationScale ?? debugScale),
                            animationOffsetX: unit.animations.walk?.animationOffsetX ?? (unit.animationOffsetX ?? debugOffsetX),
                            animationOffsetY: unit.animations.walk?.animationOffsetY ?? (unit.animationOffsetY ?? debugOffsetY)
                        }
                    },
                    forceAnimation: debugAnimationState !== null
                        ? debugAnimationState
                        : (unit.forceAnimation !== undefined ? unit.forceAnimation : 'auto')
                };
                configTextarea.value = JSON.stringify(config, null, 2);
            } else {
                // Retrocompatibilidade: mostrar propriedades globais
                const config = {
                    animationFPS: unit.debugFPS !== undefined ? unit.debugFPS : (unit.animationFPS !== undefined ? unit.animationFPS : debugFPS),
                    animationScale: unit.debugScale !== undefined ? unit.debugScale : (unit.animationScale !== undefined ? unit.animationScale : debugScale),
                    animationOffsetX: unit.debugOffsetX !== undefined ? unit.debugOffsetX : (unit.animationOffsetX !== undefined ? unit.animationOffsetX : debugOffsetX),
                    animationOffsetY: unit.debugOffsetY !== undefined ? unit.debugOffsetY : (unit.animationOffsetY !== undefined ? unit.animationOffsetY : debugOffsetY),
                    forceAnimation: debugAnimationState !== null
                        ? debugAnimationState
                        : (unit.forceAnimation !== undefined ? unit.forceAnimation : 'auto')
                };
                configTextarea.value = JSON.stringify(config, null, 2);
            }
        }
        
        // Controlar FPS (aplica apenas na unidade selecionada)
        const fpsSlider = document.getElementById('debug-fps-slider');
        const fpsValue = document.getElementById('debug-fps-value');
        fpsSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugFPS = value; // Manter valor global como fallback
            if (debugSelectedUnit) {
                debugSelectedUnit.debugFPS = value; // Aplicar na unidade selecionada
            }
            fpsValue.textContent = value;
            updateDebugConfigJson();
            needsRender = true;
        });
        
        // Controlar Escala (aplica apenas na unidade selecionada)
        const scaleSlider = document.getElementById('debug-scale-slider');
        const scaleValue = document.getElementById('debug-scale-value');
        scaleSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugScale = value; // Manter valor global como fallback
            if (debugSelectedUnit) {
                debugSelectedUnit.debugScale = value; // Aplicar na unidade selecionada
            }
            scaleValue.textContent = value;
            updateDebugConfigJson();
            needsRender = true;
        });
        
        // Controlar Offset X (aplica apenas na unidade selecionada)
        const offsetXSlider = document.getElementById('debug-offset-x-slider');
        const offsetXValue = document.getElementById('debug-offset-x-value');
        offsetXSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            debugOffsetX = value; // Manter valor global como fallback
            if (debugSelectedUnit) {
                debugSelectedUnit.debugOffsetX = value; // Aplicar na unidade selecionada
            }
            offsetXValue.textContent = value;
            updateDebugConfigJson();
            needsRender = true;
        });
        
        // Controlar Offset Y (aplica apenas na unidade selecionada)
        const offsetYSlider = document.getElementById('debug-offset-y-slider');
        const offsetYValue = document.getElementById('debug-offset-y-value');
        offsetYSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            debugOffsetY = value; // Manter valor global como fallback
            if (debugSelectedUnit) {
                debugSelectedUnit.debugOffsetY = value; // Aplicar na unidade selecionada
            }
            offsetYValue.textContent = value;
            updateDebugConfigJson();
            needsRender = true;
        });
        
        // Controlar Estado de Animação (Idle/Walk/Auto)
        const animIdleBtn = document.getElementById('debug-anim-idle');
        const animWalkBtn = document.getElementById('debug-anim-walk');
        const animAutoBtn = document.getElementById('debug-anim-auto');
        const animStateDisplay = document.getElementById('debug-anim-state');
        
        function updateAnimationButtons() {
            if (animIdleBtn) animIdleBtn.style.background = debugAnimationState === 'idle' ? '#3b82f6' : '#1e40af';
            if (animWalkBtn) animWalkBtn.style.background = debugAnimationState === 'walk' ? '#3b82f6' : '#1e40af';
            if (animAutoBtn) animAutoBtn.style.background = debugAnimationState === null ? '#3b82f6' : '#1e40af';
            if (animStateDisplay) {
                animStateDisplay.textContent = debugAnimationState || 'Automático';
            }
            needsRender = true;
        }

        function updateCompareButton() {
            const compareBtn = document.getElementById('debug-compare-anim');
            if (!compareBtn) return;
            compareBtn.style.background = debugCompareAnimations ? '#22c55e' : '#1e40af';
            compareBtn.textContent = debugCompareAnimations ? 'Comparação ligada' : 'Comparação desligada';
            needsRender = true;
        }
        
        animIdleBtn?.addEventListener('click', () => {
            debugAnimationState = 'idle';
            // Limpar valores de debug ao mudar de animação, para mostrar valores originais
            if (debugSelectedUnit) {
                delete debugSelectedUnit.debugFPS;
                delete debugSelectedUnit.debugScale;
                delete debugSelectedUnit.debugOffsetX;
                delete debugSelectedUnit.debugOffsetY;
            }
            updateAnimationButtons();
            updateDebugPanelFromUnit(); // Atualizar sliders com valores originais da animação idle
            updateDebugConfigJson();
            console.log('[DEBUG] Animação forçada: IDLE');
        });
        
        animWalkBtn?.addEventListener('click', () => {
            debugAnimationState = 'walk';
            // Limpar valores de debug ao mudar de animação, para mostrar valores originais
            if (debugSelectedUnit) {
                delete debugSelectedUnit.debugFPS;
                delete debugSelectedUnit.debugScale;
                delete debugSelectedUnit.debugOffsetX;
                delete debugSelectedUnit.debugOffsetY;
            }
            updateAnimationButtons();
            updateDebugPanelFromUnit(); // Atualizar sliders com valores originais da animação walk
            updateDebugConfigJson();
            console.log('[DEBUG] Animação forçada: WALK');
        });
        
        animAutoBtn?.addEventListener('click', () => {
            debugAnimationState = null;
            // Limpar valores de debug ao mudar de animação, para mostrar valores originais
            if (debugSelectedUnit) {
                delete debugSelectedUnit.debugFPS;
                delete debugSelectedUnit.debugScale;
                delete debugSelectedUnit.debugOffsetX;
                delete debugSelectedUnit.debugOffsetY;
            }
            updateAnimationButtons();
            updateDebugPanelFromUnit(); // Atualizar sliders com valores originais da animação atual
            updateDebugConfigJson();
            console.log('[DEBUG] Animação: Automática (usa estado real da unidade)');
        });

        document.getElementById('debug-compare-anim')?.addEventListener('click', () => {
            debugCompareAnimations = !debugCompareAnimations;
            updateCompareButton();
        });

        const compareOffsetSlider = document.getElementById('debug-compare-offset');
        const compareOffsetValue = document.getElementById('debug-compare-offset-value');
        compareOffsetSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            debugCompareOffset = Number.isNaN(value) ? debugCompareOffset : value;
            if (compareOffsetValue) compareOffsetValue.textContent = debugCompareOffset;
            needsRender = true;
        });
        
        // Atualizar display da unidade selecionada
        function updateDebugSelectedUnit() {
            const selectedUnitDiv = document.getElementById('debug-selected-unit');
            if (!selectedUnitDiv) return;
            
            if (debugSelectedUnit) {
                const type = debugSelectedUnit.type === 'player' ? 'Player' : 'Enemy';
                selectedUnitDiv.textContent = `${type}: ${debugSelectedUnit.name || debugSelectedUnit.id} (x=${debugSelectedUnit.x}, y=${debugSelectedUnit.y})`;
                selectedUnitDiv.style.color = debugSelectedUnit.type === 'player' ? '#60a5fa' : '#ef4444';
            } else {
                selectedUnitDiv.textContent = 'Clique em uma unidade';
                selectedUnitDiv.style.color = '#888';
            }
            updateDebugConfigJson();
        }
        
        // Botões de movimento
        const moveUp = document.getElementById('debug-move-up');
        const moveDown = document.getElementById('debug-move-down');
        const moveLeft = document.getElementById('debug-move-left');
        const moveRight = document.getElementById('debug-move-right');
        const moveCenter = document.getElementById('debug-move-center');
        
        function moveDebugUnit(dx, dy) {
            if (!debugSelectedUnit) {
                console.warn('[DEBUG] Nenhuma unidade selecionada. Clique em uma unidade primeiro.');
                return;
            }
            
            const newX = debugSelectedUnit.x + dx;
            const newY = debugSelectedUnit.y + dy;
            
            debugSelectedUnit.x = newX;
            debugSelectedUnit.y = newY;
            
            // Log das coordenadas
            const worldX = (newX - 0.5) * CONFIG.CELL_SIZE;
            const worldY = (newY - 0.5) * CONFIG.CELL_SIZE;
            console.log(`[DEBUG] ${debugSelectedUnit.name || debugSelectedUnit.id} movido: x=${newX}, y=${newY}, worldX=${worldX.toFixed(2)}, worldY=${worldY.toFixed(2)}`);
            
            updateDebugSelectedUnit();
            needsRender = true;
        }
        
        moveUp?.addEventListener('click', () => moveDebugUnit(0, -1));
        moveDown?.addEventListener('click', () => moveDebugUnit(0, 1));
        moveLeft?.addEventListener('click', () => moveDebugUnit(-1, 0));
        moveRight?.addEventListener('click', () => moveDebugUnit(1, 0));
        moveCenter?.addEventListener('click', () => {
            if (debugSelectedUnit) {
                const worldX = (debugSelectedUnit.x - 0.5) * CONFIG.CELL_SIZE;
                const worldY = (debugSelectedUnit.y - 0.5) * CONFIG.CELL_SIZE;
                console.log(`[DEBUG] ${debugSelectedUnit.name || debugSelectedUnit.id} - Posição atual: x=${debugSelectedUnit.x}, y=${debugSelectedUnit.y}, worldX=${worldX.toFixed(2)}, worldY=${worldY.toFixed(2)}`);
            } else {
                console.warn('[DEBUG] Nenhuma unidade selecionada');
            }
        });
        
        // Inicializar display
        updateDebugSelectedUnit();
        
        // Expor função para selecionar unidade
        window.debugSelectUnit = function(unit) {
            debugSelectedUnit = unit;
            updateDebugSelectedUnit();
            updateDebugPanelFromUnit(); // Atualizar painel com valores da unidade
            updateDebugConfigJson();
            console.log(`[DEBUG] Unidade selecionada: ${unit.name || unit.id} (${unit.type})`);
        };
        
        // Copiar JSON da unidade selecionada
        const copyConfigBtn = document.getElementById('debug-copy-config');
        if (copyConfigBtn) {
            copyConfigBtn.addEventListener('click', () => {
                const configTextarea = document.getElementById('debug-unit-config');
                const text = configTextarea?.value || '';
                if (!text) {
                    alert('Selecione uma unidade para gerar o JSON.');
                    return;
                }

                function fallbackCopy(value) {
                    const textarea = document.createElement('textarea');
                    textarea.value = value;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        copyConfigBtn.textContent = '✓ Copiado!';
                        setTimeout(() => {
                            copyConfigBtn.textContent = '📋 Copiar JSON da Unidade';
                        }, 2000);
                    } catch (err) {
                        console.error('[DEBUG] Erro ao copiar (fallback):', err);
                        alert('Não foi possível copiar automaticamente.');
                    }
                    document.body.removeChild(textarea);
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                        copyConfigBtn.textContent = '✓ Copiado!';
                        setTimeout(() => {
                            copyConfigBtn.textContent = '📋 Copiar JSON da Unidade';
                        }, 2000);
                    }).catch(() => fallbackCopy(text));
                } else {
                    fallbackCopy(text);
                }
            });
        }

        // Controle de Edição de Paredes
        const editWallsCheckbox = document.getElementById('debug-edit-walls');
        const copyWallsBtn = document.getElementById('debug-copy-walls');
        const clearWallsBtn = document.getElementById('debug-clear-walls');
        
        if (!clearWallsBtn) {
            console.error('[DEBUG] Botão clearWallsBtn não encontrado!');
        }
        
        function updateWallsCount() {
            const totalWalls = (WALLS.length - debugWallsRemoved.length) + debugWallsAdded.length;
            const wallsCountDisplay = document.getElementById('debug-walls-count');
            if (wallsCountDisplay) {
                wallsCountDisplay.textContent = `Paredes: ${totalWalls} (config: ${WALLS.length}, novas: ${debugWallsAdded.length}, removidas: ${debugWallsRemoved.length})`;
            }
        }
        
        editWallsCheckbox.addEventListener('change', (e) => {
            debugEditWalls = e.target.checked;
            console.log(`[DEBUG] Edição de paredes: ${debugEditWalls ? 'ATIVADA' : 'DESATIVADA'}`);
            needsRender = true;
        });
        
        copyWallsBtn.addEventListener('click', () => {
            // Combinar paredes: WALLS originais menos removidas, mais adicionadas
            const finalWalls = [
                ...WALLS.filter(w => !debugWallsRemoved.some(r => r.x === w.x && r.y === w.y)),
                ...debugWallsAdded
            ];
            
            const wallsJson = JSON.stringify(finalWalls, null, 2);
            console.log('[DEBUG] JSON das Paredes (estado final):');
            console.log(wallsJson);
            console.log(`[DEBUG] Total: ${finalWalls.length} paredes (${WALLS.length - debugWallsRemoved.length} originais, ${debugWallsAdded.length} novas)`);
            
            // Copiar para clipboard (com fallback)
            function copyToClipboard(text) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text).then(() => {
                        console.log('[DEBUG] JSON copiado para clipboard!');
                        copyWallsBtn.textContent = '✓ Copiado!';
                        setTimeout(() => {
                            copyWallsBtn.textContent = '📋 Copiar JSON das Paredes';
                        }, 2000);
                    }).catch(err => {
                        console.error('[DEBUG] Erro ao copiar:', err);
                        fallbackCopy(text);
                    });
                } else {
                    fallbackCopy(text);
                }
            }
            
            function fallbackCopy(text) {
                // Fallback: criar textarea temporário
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    console.log('[DEBUG] JSON copiado para clipboard (fallback)!');
                    copyWallsBtn.textContent = '✓ Copiado!';
                    setTimeout(() => {
                        copyWallsBtn.textContent = '📋 Copiar JSON das Paredes';
                    }, 2000);
                } catch (err) {
                    console.error('[DEBUG] Erro ao copiar (fallback):', err);
                    alert('Não foi possível copiar automaticamente. O JSON está no console.');
                }
                document.body.removeChild(textarea);
            }
            
            copyToClipboard(wallsJson);
        });
        
        if (clearWallsBtn) {
            clearWallsBtn.addEventListener('click', () => {
                if (confirm('Limpar TODAS as paredes? (Isso limpará todas as paredes visíveis, incluindo as do config)')) {
                    console.log('[DEBUG] Limpando TODAS as paredes...');
                    console.log('[DEBUG] Antes - WALLS.length:', WALLS.length, 'debugWallsAdded:', debugWallsAdded.length, 'debugWallsRemoved:', debugWallsRemoved.length);
                    
                    // Limpar TUDO: paredes do config + alterações de debug
                    WALLS = [];
                    debugWallsAdded = [];
                    debugWallsRemoved = [];
                    
                    console.log('[DEBUG] Depois - WALLS.length:', WALLS.length, 'debugWallsAdded:', debugWallsAdded.length, 'debugWallsRemoved:', debugWallsRemoved.length);
                    
                    updateWallsCount();
                    needsRender = true;
                    
                    // Forçar renderização no próximo frame
                    requestAnimationFrame(() => {
                        needsRender = true;
                    });
                }
            });
        } else {
            console.error('[DEBUG] Botão clearWallsBtn não encontrado - não foi possível anexar o listener');
        }
        
        updateWallsCount();
    }

    // =====================================================
    // WALLS - Carregado do config do mapa (config_json.walls)
    // Fallback padrão se não houver no config
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
        canvas = document.getElementById('map-canvas');
        minimapCanvas = document.getElementById('minimap-canvas');

        if (!canvas) return console.error('Canvas not found');

        ctx = canvas.getContext('2d', { alpha: false });
        if (minimapCanvas) minimapCtx = minimapCanvas.getContext('2d');
        
        // Inicializar modo debug
        initDebugMode();

        // Show loading state
        showLoadingState('Carregando mapa...');

        sessionUid = getSessionUidFromUrl();
        if (sessionUid) {
            await loadSessionStateFromServer(sessionUid);
        }

        // Load map image first to detect dimensions
        loadMapImage().then(() => {
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
                    setTimeout(() => showTurnBanner('player'), 600);
                } else {
                    updateUI();
            }

        }).catch(err => {
            console.error('Failed to load map:', err);
            showLoadingState('Erro ao carregar mapa');
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
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/swordman-male.png',
                class: 'warrior', scale: 1.0
            },
            {
                id: 'hero2', name: getEntityName('hero_mage', 'Mage'), type: 'player',
                x: 15, y: 10, hp: 60, maxHp: 60, sp: 100, maxSp: 100, attack: 25, defense: 5,
                moveRange: 3, attackRange: 3, avatar: '/public/assets/img/mage-male.png',
                class: 'mage', scale: 1.0
            },
            {
                id: 'hero3', name: getEntityName('hero_archer', 'Archer'), type: 'player',
                x: 14, y: 9, hp: 70, maxHp: 70, sp: 60, maxSp: 60, attack: 20, defense: 8,
                moveRange: 5, attackRange: 3, avatar: '/public/assets/img/archer-female.png',
                class: 'archer', scale: 1.0
            }
        ];

        // Enemy Units - Positioned closer for group combat testing
        enemyUnits = [
            {
                id: 'orc1', name: getEntityName('orc', 'Orc Warrior'), type: 'enemy',
                x: 18, y: 8, hp: 35, maxHp: 35, attack: 10, defense: 5,
                moveRange: 3, attackRange: 1, avatar: '/public/assets/img/orc.png',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc2', name: getEntityName('orc_scout', 'Orc Scout'), type: 'enemy',
                x: 19, y: 7, hp: 45, maxHp: 45, attack: 15, defense: 3,  // Adjacent to orc1
                moveRange: 2, attackRange: 3, avatar: '/public/assets/img/orc_scout.png',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'orc3', name: getEntityName('bandit_marauder', 'Bandit Marauder'), type: 'enemy',
                x: 19, y: 9, hp: 120, maxHp: 120, attack: 22, defense: 10,  // Adjacent to orc1
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/bandit_marauder.png',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'orc4', name: getEntityName('goblin', 'Goblin Scout'), type: 'enemy',
                x: 30, y: 5, hp: 40, maxHp: 40, attack: 18, defense: 3,
                moveRange: 2, attackRange: 2, avatar: '/public/assets/img/goblin.png',
                behavior: 'defensive', scale: 1.0
            },
            {
                id: 'wolf1', name: getEntityName('wolf', 'Dire Wolf'), type: 'enemy',
                x: 12, y: 11, hp: 40, maxHp: 40, attack: 12, defense: 4,
                moveRange: 4, attackRange: 1, avatar: '/public/assets/img/wolf.png',
                behavior: 'aggressive', scale: 1.0
            },
            {
                id: 'slime1', name: getEntityName('toxic_slime', 'Toxic Slime'), type: 'enemy',
                x: 11, y: 7, hp: 30, maxHp: 30, attack: 8, defense: 8,
                moveRange: 2, attackRange: 1, avatar: '/public/assets/img/slime.png',
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

        loadImages();
        loadRequiredSprites(); // Carregar sprites necessários
        updateFreeExploreState();
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
                avatar: player.avatar || '/public/assets/img/hero.png',
                class: player.class || 'hero',
                scale: player.scale || 1.0,
                combatKey: player.combatKey || player.combat_key || null,
                animationState: 'idle', // Estado inicial da animação
                hasMoved: !!player.hasMoved,
                facingRight: false // false = esquerda (<-), true = direita (->)
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

        // Carregar avatares apenas para unidades que não têm sprite
        [...playerUnits, ...enemyUnits].forEach(u => {
            const spriteName = getSpriteNameForUnit(u);
            if (!spriteName) {
                // Apenas carregar avatar se não tiver sprite
                sources[u.id] = u.avatar;
            }
        });

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

    async function resumeEnemyTurnFromRestore() {
        if (gameState.freeExplore) return;
        if (gameState.phase !== 'enemy' || gameState.isAnimating) return;

        // Fechar menus e garantir UI consistente
        hideActionMenu();
        hideAttackConfirmPopup();
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

            // Focar câmera no inimigo antes dele agir
            await animateCameraToUnit(enemy);

            // Move towards player (never occupy the same cell)
            const targetCell = findBestEnemyApproachCell(enemy, closestPlayer);
            if (!targetCell) continue;
            const path = findPath(enemy, targetCell, enemy.moveRange);
            const initialDistToPlayer = Math.max(Math.abs(enemy.x - closestPlayer.x), Math.abs(enemy.y - closestPlayer.y));
            enemy.intent = initialDistToPlayer <= enemy.attackRange ? 'attack' : 'move';
            if (path.length > 0) {
                // Move path should stop BEFORE the target if target is at attack range
                let stopIndex = path.length - 1;
                for (let i = 0; i < path.length; i++) {
                    const distToPlayer = Math.max(Math.abs(path[i].x - closestPlayer.x), Math.abs(path[i].y - closestPlayer.y));
                    if (distToPlayer <= enemy.attackRange) {
                        stopIndex = Math.max(0, i - 1);
                        break;
                    }
                }

                const movePath = path.slice(0, Math.min(enemy.moveRange, stopIndex + 1));
                enemy.intent = movePath.length > 0 ? 'move' : enemy.intent;
                for (const step of movePath) {
                    if (getUnitAt(step.x, step.y) && getUnitAt(step.x, step.y) !== enemy) break;
                    await animateMove(enemy, step.x, step.y, true);
                    enemy.x = step.x;
                    enemy.y = step.y;
                }
            } else {
                if (enemy.intent !== 'attack') {
                    enemy.intent = 'wait';
                }
            }

            // Após movimento, voltar para idle (padrão), exceto se estiver forçado
            if (!enemy.forceAnimation || enemy.forceAnimation === 'auto') {
                const prevState = enemy.animationState || 'walk';
                enemy.animationState = 'idle';
                if (prevState !== 'idle') {
                    startAnimationBlend(enemy, prevState, 'idle', 160);
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
        if (playerUnits[0]) {
            await animateCameraToUnit(playerUnits[0]);
        }
        startPlayerTurn();
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
        saveMapState();
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
        showActionMenu(unit);
        updateUI();
        needsRender = true;
    }

    function deselectUnit(force = false) {
        if (!force && gameState.selectedUnit && gameState.selectedUnit.hasMoved) {
            // Não permitir desselecionar unidade que já se moveu
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
    function getMoveConfig(entity) {
        const key = (entity.type === 'player' || entity.id === 'player') ? 'player' : 'enemy';
        return MOVE_CONFIG[key] || MOVE_CONFIG.enemy;
    }

    function applyMoveEasing(t, type = 'heavy') {
        if (type === 'snappy') {
            // Ease-out cubic: início rápido e parada curta
            return 1 - Math.pow(1 - t, 3);
        }
        // Default heavy: ease-in-out cubic
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
        if (mapCombat.active) return;
        if (gameState.isAnimating) return;
        if (unit.hasMoved) return; // Prevent moving again after first move

        const path = findPath(unit, { x: targetX, y: targetY }, unit.moveRange);
        if (path.length === 0) return;

        const startPos = { x: unit.x, y: unit.y };

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

            // Clear movement grid
            reachableCells = [];
            attackableCells = [];

            // Sempre mostrar menu de ação após mover
            showActionMenu(unit);

        } finally {
            gameState.isAnimating = false;
            // Resetar estado de animação para 'idle' após movimento completo
            const prevState = unit.animationState || 'walk';
            unit.animationState = 'idle';
            if (prevState !== 'idle') {
                startAnimationBlend(unit, prevState, 'idle', 160);
            }
            updateUI();
            saveMapState(); // Auto-save after movement
            if (sessionUid && unit.type === 'player') {
                persistMoveSession(startPos, { x: unit.x, y: unit.y });
            }
            persistSessionState();
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
        if (mapCombat.active) return;
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
            saveMapState();
            if (sessionUid && unit.type === 'player') {
                persistMoveSession(startPos, { x: unit.x, y: unit.y });
            }
            persistSessionState();
            needsRender = true;
        }
    }

    function animateMove(entity, toX, toY, followCamera = false) {
        return new Promise(resolve => {
            // Definir estado de animação para 'walk' durante movimento
            const previousState = entity.animationState || 'idle';
            entity.animationState = 'walk';
            if (previousState !== 'walk') {
                startAnimationBlend(entity, previousState, 'walk', 140);
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

    async function triggerBattleEncounter(hero, enemy) {
        if (mapCombat.active) {
            return;
        }
        if (!window.MapEntityBridge || !window.combatData || !window.SkillEngine || !window.combatSystem) {
            console.error('MapEntityBridge not loaded!');
            return;
        }

        gameState.isAnimating = true;

        // Não usar preview antigo no modo combate

        const battleHeroes = pendingAttack.allies;
        const battleEnemies = pendingAttack.enemies.length > 0 ? pendingAttack.enemies : [enemy];

        const battleData = MapEntityBridge.prepareBattleData(battleHeroes, battleEnemies, hero.id);
        startMapCombat(battleData);
    }

    function startMapCombat(battleData) {
        if (!battleData || !window.combatData || !window.SkillEngine || !window.combatSystem) {
            console.error('[MapCombat] Dependências não disponíveis');
            return;
        }

        mapCombat.active = true;
        mapCombat.selectedAction = null;
        mapCombat.selectedSkill = null;
        mapCombat.actionTargets = [];
        mapCombat.targetMode = 'enemy';
        mapCombat.targetId = null;
        mapCombat.combatIds = new Set([...(battleData.heroMapIds || []), ...(battleData.enemyMapIds || [])]);
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        clearHighlights();
        hideActionMenu();
        hideAttackConfirmPopup();
        attackPreviewCells = [];
        pendingAttack = null;

        // Preparar CombatSystem em modo mapa (sem UI de cartas)
        prepareCombatSystemForMap(battleData);

        // Construir entidades do combate a partir do mapa
        const heroes = (battleData.heroMapIds || []).map((mapId, idx) => {
            const mapUnit = playerUnits.find(u => u.id === mapId);
            const combatKey = battleData.heroKeys?.[idx];
            return mapUnit && combatKey ? buildCombatEntityFromMap(mapUnit, combatKey, true) : null;
        }).filter(Boolean);

        const enemies = (battleData.enemyMapIds || []).map((mapId, idx) => {
            const mapUnit = enemyUnits.find(u => u.id === mapId);
            const combatKey = battleData.enemyKeys?.[idx];
            return mapUnit && combatKey ? buildCombatEntityFromMap(mapUnit, combatKey, false) : null;
        }).filter(Boolean);

        if (heroes.length === 0 || enemies.length === 0) {
            console.warn('[MapCombat] Sem participantes válidos');
            mapCombat.active = false;
            gameState.isAnimating = false;
            return;
        }

        mapCombat.heroes = heroes;
        mapCombat.enemies = enemies;

        combatSystem.data = window.combatData;
        combatSystem.data.heroes = heroes;
        combatSystem.data.enemies = enemies;
        combatSystem.data.player = heroes[0] || null;
        combatSystem.mapBattleData = battleData;
        combatSystem.state.isActive = true;
        combatSystem.state.quickCombatEnabled = true;
        combatSystem.state.autoGameEnabled = false;
        combatSystem.state.turnCount = 0;
        combatSystem.state.phase = 'idle';
        combatSystem.state.selectedActionType = null;
        combatSystem.state.selectedSkill = null;
        combatSystem.state.actionTargets = [];

        combatSystem.determineTurnOrder();
        combatSystem.state.activeEntityId = combatSystem.state.entities[0] || null;
        mapCombat.turnOrder = [...combatSystem.state.entities];
        mapCombat.activeEntityId = combatSystem.state.activeEntityId;

        ensureMapCombatUI();
        updateMapCombatUI();
        gameState.isAnimating = false;
        hideExploreFooter();

        // Iniciar fluxo de turnos do combate
        combatSystem.stepTurn();
    }

    function prepareCombatSystemForMap(battleData) {
        if (!window.combatSystem) return;

        // Desativar UI de cartas e redirecionamentos
        combatSystem.config = combatSystem.config || {};
        combatSystem.config.debugMode = false;
        combatSystem.state = combatSystem.state || {};
        combatSystem.state.quickCombatEnabled = true;

        // No-ops/handlers para UI de cartas
        const noop = () => {};
        combatSystem.renderHeroes = noop;
        combatSystem.renderEnemies = noop;
        combatSystem.renderGraveyard = noop;
        combatSystem.updateTimelineUI = noop;
        combatSystem.updateTurnIndicator = noop;
        combatSystem.updateTargetUI = noop;
        combatSystem.renderEnemyIntents = noop;
        combatSystem.clearHighlights = noop;
        combatSystem.showSkillBanner = noop;
        combatSystem.showStatChange = noop;
        combatSystem.spawnFloater = noop;
        combatSystem.refreshIcons = noop;
        combatSystem.updateHeroUI = noop;
        combatSystem.updateEnemyBars = noop;
        combatSystem.updatePlayerUI = noop;

        combatSystem.showToastNotification = (text) => {
            const msg = (text || '').replace(/<[^>]*>/g, '');
            showNotification(msg || 'Ação executada', 'info');
        };

        if (!combatSystem._mapOriginalEndCombat) {
            combatSystem._mapOriginalEndCombat = combatSystem.endCombat.bind(combatSystem);
        }
        combatSystem.endCombat = (win) => {
            const outcome = win ? 'victory' : 'defeat';
            endMapCombat(outcome);
        };

        if (!combatSystem._mapOriginalDamageEntity) {
            combatSystem._mapOriginalDamageEntity = combatSystem.damageEntity.bind(combatSystem);
        }
        combatSystem.damageEntity = (...args) => {
            const result = combatSystem._mapOriginalDamageEntity(...args);
            syncMapUnitsFromCombat();
            return result;
        };

        if (!combatSystem._mapWrappedTurns) {
            combatSystem._mapWrappedTurns = true;
            const origStartPlayer = combatSystem.startPlayerTurn.bind(combatSystem);
            const origStartEnemy = combatSystem.startEnemyTurn.bind(combatSystem);
            combatSystem.startPlayerTurn = () => {
                origStartPlayer();
                mapCombat.activeEntityId = combatSystem.state.activeEntityId;
                selectDefaultTarget();
                updateMapCombatUI();
            };
            combatSystem.startEnemyTurn = (e) => {
                origStartEnemy(e);
                mapCombat.activeEntityId = combatSystem.state.activeEntityId;
                selectDefaultTarget();
                updateMapCombatUI();
            };
        }
    }

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

    function syncMapUnitsFromCombat() {
        const all = [...(combatSystem.data?.heroes || []), ...(combatSystem.data?.enemies || [])];
        all.forEach(entity => {
            const mapId = entity.mapId || entity.id;
            const mapUnit = [...playerUnits, ...enemyUnits].find(u => u.id === mapId);
            if (!mapUnit) return;
            mapUnit.hp = entity.hp;
            mapUnit.maxHp = entity.maxHp;
            if (entity.mana !== undefined) {
                mapUnit.sp = entity.mana;
                mapUnit.maxSp = entity.maxMana;
            }
        });
        needsRender = true;
    }

    function endMapCombat(outcome) {
        if (!mapCombat.active) return;

        const heroes = combatSystem.data?.heroes || [];
        const enemies = combatSystem.data?.enemies || [];

        const result = {
            outcome,
            heroMapIds: heroes.map(h => h.mapId || h.id),
            enemyMapIds: enemies.map(e => e.mapId || e.id),
            units: [...heroes, ...enemies].map(u => ({
                mapId: u.mapId || u.id,
                hp: u.hp,
                maxHp: u.maxHp,
                sp: u.mana,
                maxSp: u.maxMana
            })),
            defeatedEnemyMapIds: enemies.filter(e => e.hp <= 0).map(e => e.mapId || e.id),
            defeatedHeroMapIds: heroes.filter(h => h.hp <= 0).map(h => h.mapId || h.id),
            initiatorId: combatSystem.mapBattleData?.initiatorId || null
        };

        mapCombat.active = false;
        mapCombat.selectedAction = null;
        mapCombat.selectedSkill = null;
        mapCombat.actionTargets = [];
        mapCombat.targetId = null;
        gameState.isAnimating = false;
        hideMapCombatUI();
        handleBattleResult(result);
    }

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
     * Save map state (no local/session storage)
     */
    function saveMapState() {
        // Persistir apenas câmera/zoom localmente (não afeta backend)
        saveCameraState();
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
     * Restore map state from saved data
     */
    function restoreMapState(state) {
        console.log('[DEBUG][restoreMapState] START - Current canvas:', {
            width: canvas?.width,
            height: canvas?.height,
            mapLoaded,
            isAnimating: gameState.isAnimating
        });

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
            console.log('[DEBUG][restoreMapState] Restoring camera from saved state:', state.camera);
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
                console.log('[DEBUG][restoreMapState] Camera re-applied in RAF:', viewState);
            });
        }

        // Clean UI state after restoration - CRITICAL for control restoration
        gameState.selectedUnit = null;
        gameState.currentAction = null;
        gameState.isAnimating = false; // Explicitly reset to enable interactions
        console.log('[DEBUG][restoreMapState] isAnimating set to:', gameState.isAnimating);
        clearHighlights();
        updateSelectedUnitPanel();

        // IMPORTANT: Only center on units if NO camera was saved (fresh start scenario)
        if (!cameraRestored && playerUnits.length > 0) {
            console.log('[DEBUG][restoreMapState] No camera saved, centering on units');
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

        // Log final canvas state
        console.log('[DEBUG][restoreMapState] END - Final state:', {
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
            viewState,
            mapLoaded,
            cameraRestored,
            isAnimating: gameState.isAnimating
        });

        needsRender = true;
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
        }


        needsRender = true;
        updateUI();
        saveMapState(); // Auto-save after movement
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
                player: playerUnits[0] || null,
                enemies: enemyUnits,
                chests,
                portal,
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
        }).catch(() => {});
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
        const wallsCountDisplay = document.getElementById('debug-walls-count');
        if (wallsCountDisplay) {
            const totalWalls = (WALLS.length - debugWallsRemoved.length) + debugWallsAdded.length;
            wallsCountDisplay.textContent = `Paredes: ${totalWalls} (${debugWallsAdded.length} novas, ${debugWallsRemoved.length} removidas)`;
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
        if (mapCombat.active) return;
        const menu = document.getElementById('action-menu');
        if (!menu) return;

        const btnMove = document.getElementById('action-move');
        const btnAttack = document.getElementById('action-attack');
        const btnFinish = document.getElementById('action-finish');

        const btnCancel = document.getElementById('action-cancel');

        // Logic: Only show Move if unit hasn't moved yet
        if (btnMove) btnMove.style.display = unit.hasMoved ? 'none' : 'flex';

        // Logic: Hide Cancel if unit has moved (must Finish or Attack)
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
        if (mapCombat.active) return;
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
        document.getElementById('action-finish')?.addEventListener('click', () => {
            if (gameState.selectedUnit) finishUnitTurn(gameState.selectedUnit);
        });
        document.getElementById('action-cancel')?.addEventListener('click', () => deselectUnit());
    }

    // =====================================================
    // MAP COMBAT HUD (sem cartas)
    // =====================================================
    function ensureMapCombatUI() {
        if (mapCombat.uiReady) return;
        const hud = document.createElement('div');
        hud.id = 'map-combat-hud';
        hud.style.position = 'fixed';
        hud.style.left = '50%';
        hud.style.bottom = '18px';
        hud.style.transform = 'translateX(-50%)';
        hud.style.zIndex = '160';
        hud.style.display = 'none';
        hud.style.width = 'min(900px, 94vw)';
        hud.style.pointerEvents = 'auto';
        hud.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
                <div id="map-combat-turnorder" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
                <div id="map-combat-active" style="font-size:12px; color:#cbd5e1;"></div>
            </div>
            <div style="background:rgba(10,10,10,0.8); border:1px solid rgba(255,255,255,0.12); border-radius:14px; padding:10px;">
                <div id="map-combat-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button data-action="attack" style="flex:1; min-width:110px; padding:10px 12px; background:#b91c1c; color:#fff; border-radius:10px; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-weight:700;">Atacar</button>
                    <button data-action="skill" style="flex:1; min-width:110px; padding:10px 12px; background:#7c3aed; color:#fff; border-radius:10px; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-weight:700;">Skills</button>
                    <button data-action="defend" style="flex:1; min-width:110px; padding:10px 12px; background:#2563eb; color:#fff; border-radius:10px; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-weight:700;">Defender</button>
                    <button data-action="flee" style="flex:1; min-width:110px; padding:10px 12px; background:#0f172a; color:#fff; border-radius:10px; border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-weight:700;">Fugir</button>
                </div>
                <div id="map-combat-skills" style="display:none; margin-top:8px; max-height:220px; overflow:auto; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;"></div>
            </div>
        `;
        document.body.appendChild(hud);

        hud.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                handleMapCombatAction(action);
            });
        });

        mapCombat.uiReady = true;
    }

    function showMapCombatUI() {
        const hud = document.getElementById('map-combat-hud');
        if (hud) hud.style.display = 'block';
    }

    function hideMapCombatUI() {
        const hud = document.getElementById('map-combat-hud');
        if (hud) hud.style.display = 'none';
    }

    function updateMapCombatUI() {
        if (!mapCombat.active) {
            hideMapCombatUI();
            return;
        }
        ensureMapCombatUI();
        showMapCombatUI();

        if (combatSystem.state?.entities?.length) {
            mapCombat.turnOrder = [...combatSystem.state.entities];
        }

        mapCombat.activeEntityId = combatSystem.state?.activeEntityId || mapCombat.activeEntityId;
        const active = getCombatEntityById(mapCombat.activeEntityId);
        const turnEl = document.getElementById('map-combat-turnorder');
        const activeEl = document.getElementById('map-combat-active');
        const skillsEl = document.getElementById('map-combat-skills');

        if (turnEl) {
            turnEl.innerHTML = '';
            mapCombat.turnOrder.forEach(id => {
                const ent = getCombatEntityById(id);
                if (!ent || ent.hp <= 0) return;
                const chip = document.createElement('div');
                chip.textContent = ent.name;
                chip.style.padding = '4px 8px';
                chip.style.borderRadius = '8px';
                chip.style.fontSize = '11px';
                chip.style.background = id === mapCombat.activeEntityId ? '#22c55e' : 'rgba(255,255,255,0.1)';
                chip.style.color = id === mapCombat.activeEntityId ? '#0f172a' : '#e2e8f0';
                turnEl.appendChild(chip);
            });
        }

        if (activeEl) {
            const label = active ? `${active.name} • ${active.isPlayer ? 'Seu turno' : 'Turno inimigo'}` : '';
            activeEl.textContent = label;
        }

        if (skillsEl && active && active.isPlayer) {
            if (mapCombat.selectedAction === 'skill') {
                skillsEl.style.display = 'block';
                skillsEl.innerHTML = active.skills.map(s => `
                    <button data-skill="${s.id}" style="display:flex; justify-content:space-between; width:100%; padding:8px 10px; margin-bottom:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:#e2e8f0; cursor:pointer;">
                        <span>${s.name}</span>
                        <span style="color:#a5b4fc;">${s.mana || 0} MP</span>
                    </button>
                `).join('');
                skillsEl.querySelectorAll('button[data-skill]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const sid = btn.getAttribute('data-skill');
                        handleMapCombatSkillSelect(sid);
                    });
                });
            } else {
                skillsEl.style.display = 'none';
                skillsEl.innerHTML = '';
            }
        }

        // Desabilitar ações quando não é turno do player
        const isPlayerTurn = active && active.isPlayer;
        document.querySelectorAll('#map-combat-actions button').forEach(btn => {
            btn.disabled = !isPlayerTurn;
            btn.style.opacity = isPlayerTurn ? '1' : '0.4';
            btn.style.cursor = isPlayerTurn ? 'pointer' : 'not-allowed';
        });
    }

    function selectDefaultTarget() {
        if (!mapCombat.active) return;
        const active = getCombatEntityById(mapCombat.activeEntityId);
        if (!active) return;

        if (active.isPlayer) {
            const aliveEnemies = combatSystem.data?.enemies?.filter(e => e.hp > 0) || [];
            if (aliveEnemies.length === 0) return;
            // manter alvo se ainda vivo
            const existing = aliveEnemies.find(e => e.id === mapCombat.targetId);
            if (existing) return;

            const mapUnit = playerUnits.find(u => u.id === active.mapId || u.id === active.id);
            if (!mapUnit) return;
            let best = null;
            let bestDist = Infinity;
            aliveEnemies.forEach(e => {
                const mapEnemy = enemyUnits.find(u => u.id === e.mapId || u.id === e.id);
                if (!mapEnemy) return;
                const dist = Math.abs(mapEnemy.x - mapUnit.x) + Math.abs(mapEnemy.y - mapUnit.y);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = e;
                }
            });
            if (best) mapCombat.targetId = best.id;
        } else {
            const aliveHeroes = combatSystem.data?.heroes?.filter(h => h.hp > 0) || [];
            if (aliveHeroes.length === 0) return;
            const existing = aliveHeroes.find(h => h.id === mapCombat.targetId);
            if (existing) return;
            mapCombat.targetId = aliveHeroes[0].id;
        }
    }

    function getCombatEntityById(id) {
        return (combatSystem.data?.heroes || []).find(h => h.id === id)
            || (combatSystem.data?.enemies || []).find(e => e.id === id)
            || null;
    }

    function updateBattleRect() {
        if (!mapCombat.active) {
            mapCombat.battleRect = null;
            return;
        }
        const units = [...mapCombat.combatIds].map(id => [...playerUnits, ...enemyUnits].find(u => u.id === id)).filter(Boolean);
        if (units.length === 0) {
            mapCombat.battleRect = null;
            return;
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        units.forEach(u => {
            minX = Math.min(minX, u.x);
            minY = Math.min(minY, u.y);
            maxX = Math.max(maxX, u.x);
            maxY = Math.max(maxY, u.y);
        });
        const padding = 2; // células
        minX = Math.max(1, minX - padding);
        minY = Math.max(1, minY - padding);
        maxX = Math.min(CONFIG.GRID_COLS, maxX + padding);
        maxY = Math.min(CONFIG.GRID_ROWS, maxY + padding);

        const x = (minX - 1) * CONFIG.CELL_SIZE;
        const y = (minY - 1) * CONFIG.CELL_SIZE;
        const w = (maxX - minX + 1) * CONFIG.CELL_SIZE;
        const h = (maxY - minY + 1) * CONFIG.CELL_SIZE;
        mapCombat.battleRect = { x, y, w, h };
    }

    function isUnitInCombat(unit) {
        return mapCombat.active && mapCombat.combatIds.has(unit.id);
    }

    function handleMapCombatAction(action) {
        if (!mapCombat.active) return;
        const active = getCombatEntityById(mapCombat.activeEntityId);
        if (!active || !active.isPlayer) return;

        selectDefaultTarget();
        mapCombat.selectedAction = action;
        mapCombat.selectedSkill = null;
        mapCombat.actionTargets = [];
        mapCombat.targetMode = 'enemy';

        if (action === 'attack') {
            const mapUnit = playerUnits.find(u => u.id === active.mapId || u.id === active.id);
            if (mapUnit) calculateAttackableCells(mapUnit);
            showNotification('Alvo travado. Clique no inimigo para atacar.', 'info');
        } else if (action === 'skill') {
            showNotification('Selecione uma skill', 'info');
        } else if (action === 'defend') {
            combatSystem.useDefend(active);
            mapCombat.selectedAction = null;
            updateMapCombatUI();
        } else if (action === 'flee') {
            attemptMapCombatFlee();
        }
        updateMapCombatUI();
    }

    function handleMapCombatSkillSelect(skillId) {
        const active = getCombatEntityById(mapCombat.activeEntityId);
        if (!active || !active.isPlayer) return;
        const skill = active.skills.find(s => s.id === skillId);
        if (!skill) return;

        mapCombat.selectedAction = 'skill';
        mapCombat.selectedSkill = skill;
        mapCombat.actionTargets = [];
        mapCombat.targetMode = (skill.type === 'self' || skill.type === 'aoe_heal' || skill.type === 'revive') ? 'ally' : 'enemy';

        // Execução imediata para skills sem alvo
        if (skill.type === 'summon') {
            combatSystem.state.selectedActionType = 'skill';
            combatSystem.state.selectedSkill = skill;
            combatSystem.state.actionTargets = [];
            combatSystem.usePlayerSkill(skill);
            mapCombat.selectedAction = null;
            updateMapCombatUI();
            return;
        }

        // AoE direto
        if (skill.type === 'aoe') {
            const enemies = combatSystem.data.enemies.filter(e => e.hp > 0);
            combatSystem.state.selectedActionType = 'skill';
            combatSystem.state.selectedSkill = skill;
            combatSystem.state.actionTargets = enemies.map(e => e.id);
            combatSystem.usePlayerSkill(skill);
            mapCombat.selectedAction = null;
            updateMapCombatUI();
            return;
        }

        if (skill.type === 'aoe_heal') {
            const allies = combatSystem.data.heroes.filter(h => h.hp > 0);
            combatSystem.state.selectedActionType = 'skill';
            combatSystem.state.selectedSkill = skill;
            combatSystem.state.actionTargets = allies.map(h => h.id);
            combatSystem.usePlayerSkill(skill);
            mapCombat.selectedAction = null;
            updateMapCombatUI();
            return;
        }

        showNotification('Selecione um alvo', 'info');
        updateMapCombatUI();
    }

    function attemptMapCombatFlee() {
        const hero = getCombatEntityById(mapCombat.activeEntityId);
        if (!hero || !hero.isPlayer) return;
        const enemy = combatSystem.data.enemies.find(e => e.hp > 0);
        const fleeStat = hero.stats?.flee || 0;
        const hitStat = enemy?.stats?.hit || 0;
        const chance = Math.max(0.2, Math.min(0.8, 0.4 + (fleeStat - hitStat) / 200));
        if (Math.random() < chance) {
            showNotification('Você fugiu!', 'success');
            endMapCombat('flee');
        } else {
            showNotification('Falha ao fugir!', 'warning');
            combatSystem.stepTurn();
        }
    }

    function handleMapCombatCellClick(x, y, unitAtCell) {
        const active = getCombatEntityById(mapCombat.activeEntityId);
        if (!active || !active.isPlayer) return;
        if (!mapCombat.selectedAction) return;

        if (mapCombat.selectedAction === 'attack') {
            if (!unitAtCell || unitAtCell.type !== 'enemy') return;
            const target = combatSystem.data.enemies.find(e => e.id === unitAtCell.id);
            if (!target || target.hp <= 0) return;
            mapCombat.targetId = target.id;
            combatSystem.state.selectedActionType = 'attack';
            combatSystem.state.actionTargets = [target.id];
            combatSystem.playerAttack();
            mapCombat.selectedAction = null;
            updateMapCombatUI();
            clearHighlights();
            return;
        }

        if (mapCombat.selectedAction === 'skill' && mapCombat.selectedSkill) {
            const skill = mapCombat.selectedSkill;
            if (skill.type === 'self') {
                combatSystem.state.selectedActionType = 'skill';
                combatSystem.state.selectedSkill = skill;
                combatSystem.state.actionTargets = [active.id];
                combatSystem.usePlayerSkill(skill);
                mapCombat.selectedAction = null;
                updateMapCombatUI();
                return;
            }

            if (mapCombat.targetMode === 'ally') {
                if (!unitAtCell || unitAtCell.type !== 'player') return;
                const target = combatSystem.data.heroes.find(h => h.id === unitAtCell.id);
                if (!target) return;
                mapCombat.targetId = target.id;
                combatSystem.state.selectedActionType = 'skill';
                combatSystem.state.selectedSkill = skill;
                combatSystem.state.actionTargets = [target.id];
                combatSystem.usePlayerSkill(skill);
                mapCombat.selectedAction = null;
                updateMapCombatUI();
                return;
            }

            if (mapCombat.targetMode === 'enemy') {
                if (!unitAtCell || unitAtCell.type !== 'enemy') return;
                const target = combatSystem.data.enemies.find(e => e.id === unitAtCell.id);
                if (!target || target.hp <= 0) return;
                mapCombat.targetId = target.id;
                combatSystem.state.selectedActionType = 'skill';
                combatSystem.state.selectedSkill = skill;
                combatSystem.state.actionTargets = [target.id];
                combatSystem.usePlayerSkill(skill);
                mapCombat.selectedAction = null;
                updateMapCombatUI();
                return;
            }
        }
    }

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
        // (sem desenhos extras aqui)

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
        if (mapCombat.active) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const world = screenToWorld(mouseX, mouseY);
        const col = Math.floor(world.x / CONFIG.CELL_SIZE) + 1;
        const row = Math.floor(world.y / CONFIG.CELL_SIZE) + 1;

        // Modo debug: edição de paredes (prioridade sobre outras ações)
        // Permitir cliques mesmo que estejam um pouco fora dos limites (para cantos)
        if (debugMode && debugEditWalls) {
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

        // Modo debug: permitir seleção de unidade para debug, mas não bloquear ação normal
        if (debugMode) {
            const clickedUnit = findUnitAtScreenPosition(mouseX, mouseY);
            if (clickedUnit && window.debugSelectUnit) {
                window.debugSelectUnit(clickedUnit);
                // Continua com handleCellClick normal (debug não bloqueia seleção normal)
            }
        }

        handleCellClick(col, row);
    }
    
    // Encontra unidade baseada na posição visual do sprite ou quadrado azul (para debug)
    function findUnitAtScreenPosition(screenX, screenY) {
        const world = screenToWorld(screenX, screenY);
        
        // Verificar todas as unidades
        const allUnits = [...playerUnits, ...enemyUnits].filter(u => u.hp > 0);
        
        for (const unit of allUnits) {
            // Converter posição da unidade para tela
            const unitScreen = worldToScreen(unit.x, unit.y);
            
            // 1. Verificar se clicou no quadrado azul (base)
            const baseSize = CONFIG.CELL_SIZE * 0.7;
            const baseHalf = baseSize / 2;
            const baseScreen = {
                x: unitScreen.x,
                y: unitScreen.y
            };
            
            // Verificar se o clique está dentro do quadrado azul
            const dx = screenX - baseScreen.x;
            const dy = screenY - baseScreen.y;
            const baseHalfScaled = baseHalf * viewState.scale;
            
            if (Math.abs(dx) <= baseHalfScaled && Math.abs(dy) <= baseHalfScaled) {
                return unit; // Clique no quadrado azul
            }
            
            // 2. Verificar se clicou no sprite (raio maior para sprites grandes)
            const distance = Math.sqrt(
                Math.pow(screenX - unitScreen.x, 2) + 
                Math.pow(screenY - unitScreen.y, 2)
            );
            
            const hitRadius = CONFIG.CELL_SIZE * 2.0 * viewState.scale; // Raio maior para sprites grandes
            if (distance <= hitRadius) {
                return unit; // Clique no sprite
            }
        }
        
        return null;
    }

    function handleCellClick(x, y) {
        const unitAtCell = getUnitAt(x, y);
        
        // Modo debug: selecionar unidade ao clicar para debug (não bloqueia ação normal)
        if (debugMode && unitAtCell && window.debugSelectUnit) {
            window.debugSelectUnit(unitAtCell);
            // Continua com a lógica normal (debug não bloqueia seleção/movimento/ataque)
        }

        if (mapCombat.active) {
            handleMapCombatCellClick(x, y, unitAtCell);
            return;
        }
        
        if (gameState.freeExplore) {
            const hero = playerUnits[0];
            if (hero && (!unitAtCell || unitAtCell === hero)) {
                moveUnitToFree(hero, x, y);
            }
            return;
        }

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

        // Map background with Tactical Focus / Battle Zone
        if (loadedImages.map) {
            ctx.save();
            const hasFocus = reachableCells.length > 0 || attackableCells.length > 0 || attackPreviewCells.length > 0;
            updateBattleRect();
            if (mapCombat.active && mapCombat.battleRect) {
                // Desenhar mapa em grayscale primeiro
                ctx.filter = 'grayscale(1) brightness(0.6)';
                ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
                ctx.filter = 'none';

                // Desenhar mapa colorido apenas na área de batalha
                ctx.save();
                ctx.beginPath();
                ctx.rect(mapCombat.battleRect.x, mapCombat.battleRect.y, mapCombat.battleRect.w, mapCombat.battleRect.h);
                ctx.clip();
                ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
                ctx.restore();

                // Escurecer fora da área de batalha
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.rect(0, 0, MAP_WIDTH, MAP_HEIGHT);
                ctx.rect(mapCombat.battleRect.x, mapCombat.battleRect.y, mapCombat.battleRect.w, mapCombat.battleRect.h);
                ctx.fill('evenodd');
                ctx.restore();
            } else {
                if (hasFocus) {
                    ctx.filter = 'grayscale(0.8) brightness(0.4)';
                }
                ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);
            }
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
        if (!mapCombat.active) {
            drawChests();
            drawPortal();
        }
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
            if (mapCombat.active && !isUnitInCombat(unit)) return;
            drawUnit(unit, type);
        });
    }

    function drawUnit(unit, type) {
        if (mapCombat.active && !isUnitInCombat(unit)) return;
        const cx = unit.renderX ?? (unit.x - 0.5) * CONFIG.CELL_SIZE;
        const cy = unit.renderY ?? (unit.y - 0.5) * CONFIG.CELL_SIZE;

        const isSelected = gameState.selectedUnit === unit;
        const hasActed = gameState.unitsActedThisTurn.has(unit.id);
        const isCurrentPhase = gameState.phase === type;
        const canStillAct = unit.hp > 0 && !hasActed;

        const img = loadedImages[unit.id];
        const spriteName = getSpriteNameForUnit(unit);
        const spriteAnimations = spriteName ? spriteCache.get(spriteName) : null;
        
        // Obter estado de animação da unidade
        // Se debug mode estiver ativo e tiver animação forçada, usar ela; senão usar forceAnimation da unidade
        let animationState;
        if (debugMode && debugAnimationState !== null) {
            animationState = debugAnimationState; // Forçar estado no debug
        } else if (unit.forceAnimation && unit.forceAnimation !== 'auto') {
            animationState = unit.forceAnimation;
        } else {
            animationState = unit.animationState || 'idle'; // Estado real da unidade
        }
        
        // Se a animação solicitada não existir, usar idle como fallback
        if (spriteAnimations && animationState === 'walk' && (!spriteAnimations.walk || !spriteAnimations.walk.loaded)) {
            animationState = 'idle'; // Slime e outros que só têm idle
        }
        
        const spriteSheet = spriteAnimations ? spriteAnimations[animationState] : null;
        
        // Verificar se há sprite disponível ou avatar
        const hasSprite = spriteSheet && spriteSheet.loaded && spriteSheet.frameCount > 0;
        const hasAvatar = img !== undefined;
        
        // Se não tiver sprite nem avatar, não renderizar
        if (!hasSprite && !hasAvatar) return;

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

        // Mira estilo combate de cartas no alvo atual
        if (mapCombat.active && mapCombat.targetId === unit.id) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(0, -radius - 16);
            ctx.lineTo(-8, -radius - 2);
            ctx.lineTo(8, -radius - 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 2. Base Square (desenhar ANTES do sprite para ficar atrás)
        ctx.save();

        const baseSize = CONFIG.CELL_SIZE * 0.7; // Tamanho do quadrado base
        const baseHalf = baseSize / 2;
        
        // Desenhar sombra sob o quadrado para dar sensação de solo
        const shadowGrad = ctx.createRadialGradient(0, baseHalf * 0.8, 0, 0, baseHalf * 0.8, baseHalf * 0.6);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, baseHalf * 0.8, baseHalf * 0.7, baseHalf * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Quadrado base azul semi-transparente
        ctx.globalAlpha = 0.6; // Semi-transparente
        ctx.fillStyle = '#3b82f6'; // Azul (#3b82f6)
        ctx.beginPath();
        ctx.roundRect(-baseHalf, -baseHalf, baseSize, baseSize, 4); // Cantos levemente arredondados
        ctx.fill();
        
        // Borda do quadrado (mais visível quando selecionado)
        if (isSelected) {
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#60a5fa'; // Azul mais claro para selecionado
            ctx.lineWidth = 3;
        } else {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#2563eb'; // Azul mais escuro
            ctx.lineWidth = 2;
        }
        ctx.beginPath();
        ctx.roundRect(-baseHalf, -baseHalf, baseSize, baseSize, 4);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0; // Reset alpha
        ctx.restore();
        
        // 3. Unit Sprite or Avatar Circle (desenhar DEPOIS do quadrado para ficar em cima)
        // Variável para armazenar topo do sprite (usado para posicionar barras)
        let spriteTopY = null;
        
        ctx.save();

        // Se tiver sprite disponível, usar sprite animado (REMOVE avatar circular)
        if (hasSprite) {
            const drawSpriteFrame = (sheet, frame, extraOffsetX = 0, extraOffsetY = 0, alpha = 1, isGhost = false, useDebugOverrides = true) => {
                if (!frame || !sheet) return;
                
                // Buscar configurações específicas da animação atual (idle/walk) ou usar globais (retrocompatibilidade)
                let animConfig = null;
                if (unit.animations && unit.animations[animationState]) {
                    animConfig = unit.animations[animationState];
                }
                
                const baseScale = animConfig?.animationScale !== undefined 
                    ? animConfig.animationScale 
                    : (unit.animationScale !== undefined ? unit.animationScale : 2.0);
                const scaleMultiplier = (useDebugOverrides && debugMode && debugSelectedUnit === unit && unit.debugScale !== undefined)
                    ? unit.debugScale
                    : baseScale;
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
                if (useDebugOverrides && debugMode && debugSelectedUnit === unit) {
                    const offsetX = (unit.debugOffsetX !== undefined) ? unit.debugOffsetX : baseOffsetX;
                    const offsetY = (unit.debugOffsetY !== undefined) ? unit.debugOffsetY : baseOffsetY;
                    drawX += offsetX;
                    drawY += offsetY;
                } else {
                    drawX += baseOffsetX;
                    drawY += baseOffsetY;
                }
                drawX += extraOffsetX;
                drawY += extraOffsetY;

                if (!isGhost) {
                    spriteTopY = drawY;
                }

                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = alpha;
                if (unit.facingRight) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    const flippedDrawX = -drawX - scaledWidth;
                    ctx.drawImage(frame, flippedDrawX, drawY, scaledWidth, scaledHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(frame, drawX, drawY, scaledWidth, scaledHeight);
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
                        drawSpriteFrame(fromSheet, fromFrame, 0, 0, 1 - t, false, true);
                        drawSpriteFrame(toSheet, toFrame, 0, 0, t, false, true);
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
                    drawSpriteFrame(spriteSheet, frameImg, 0, 0, 1, false, true);

                    if (debugMode && debugSelectedUnit === unit && debugCompareAnimations && spriteAnimations) {
                        const altState = animationState === 'idle' ? 'walk' : 'idle';
                        const altSheet = spriteAnimations[altState];
                        if (altSheet && altSheet.loaded && altSheet.frameCount > 0) {
                            const altIndex = getCurrentSpriteFrameIndex(spriteAnimations, altState, unit, false);
                            const altFrame = altSheet.frames[altIndex];
                            if (altFrame) {
                                drawSpriteFrame(altSheet, altFrame, debugCompareOffset, 0, 0.6, true, false);
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

        // 4. Action Completed Badge (Green Check)
        if (hasActed) {
            ctx.save();
            ctx.translate(radius * 0.7, -radius * 0.7);

            // Badge Circle with gradient
            const badgeGrad = ctx.createRadialGradient(0, -2, 0, 0, 0, 12);
            badgeGrad.addColorStop(0, '#4ade80');
            badgeGrad.addColorStop(1, '#16a34a');
            ctx.fillStyle = badgeGrad;
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(34,197,94,0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            // White Checkmark
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(-1, 3);
            ctx.lineTo(4, -3);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Intent badge (inimigos)
        if (unit.type === 'enemy' && unit.intent) {
            const label = unit.intent === 'attack' ? 'ATK' : (unit.intent === 'move' ? 'MOV' : 'WAIT');
            const badgeY = (spriteTopY !== null && spriteTopY < 0) ? spriteTopY - 26 : -radius - 24;
            ctx.save();
            ctx.font = 'bold 10px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textW = ctx.measureText(label).width;
            const bw = Math.max(28, textW + 10);
            const bx = -bw / 2;
            const by = badgeY - 7;
            const color = unit.intent === 'attack' ? 'rgba(239, 68, 68, 0.9)'
                : (unit.intent === 'move' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(148, 163, 184, 0.9)');
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
        if (unit.hp !== undefined) {
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

    // Expose public API
    window.MapEngine = {
        resetGame: resetGame,
        saveMapState: saveMapState
    };

})();


