/**
 * Map Debug - Painel de Debug para o Sistema de Combate Tático
 * Desacoplado do map-engine.js
 * 
 * IMPORTANTE: Este módulo só será ativado se DEBUG_MODE === true
 * Configurar no .env: DEBUG_MODE=true
 */
(function () {
    'use strict';

    // Verificar se debug está habilitado (setado pelo PHP via variável global)
    const isDebugEnabled = () => {
        const result = window.DEBUG_MODE === true ||
            window.MAP_DEBUG_ENABLED === true ||
            localStorage.getItem('map_debug_force') === 'true';
        // DEBUG: Log para verificar por que isDebugEnabled retorna false
        if (!result && window.DEBUG_MODE !== undefined) {
            console.log('[MAP-DEBUG] isDebugEnabled() retornou false. DEBUG_MODE=', window.DEBUG_MODE, 'tipo=', typeof window.DEBUG_MODE);
        }
        return result;
    };

    // Referências para o map-engine
    let mapEngineRef = null;
    let debugSelectedUnit = null;
    let debugMode = false;
    let debugInitialized = false; // Flag para rastrear se já foi inicializado
    let debugAnimationState = null;
    let debugCompareAnimations = false;
    let debugCompareOffset = 60;
    let debugEditWalls = false;
    let debugWallsAdded = [];
    let debugWallsRemoved = [];

    // Variáveis de controle
    let debugFPS = 7;
    let debugScale = 2.0;
    let debugOffsetX = 0;
    let debugOffsetY = 50;
    let debugBlockGameClicks = false;

    /**
     * Inicializa o sistema de debug (chamado automaticamente pelo map-engine.js)
     */
    function init(options) {
        // Sempre armazenar as referências, mesmo se debug não estiver ativo
        mapEngineRef = options;

        // Se debug já estiver habilitado via console, inicializar imediatamente
        if (isDebugEnabled()) {
            enable();
        } else {
            console.log('[MAP-DEBUG] Debug mode desabilitado. Para habilitar, digite "debug = true" no console do navegador');
        }

        return true;
    }

    /**
     * Ativa o modo debug (chamado quando DEBUG_MODE muda para true via console)
     */
    function enable() {
        console.log('[MAP-DEBUG] enable() chamado. DEBUG_MODE=', window.DEBUG_MODE, 'tipo=', typeof window.DEBUG_MODE, 'isDebugEnabled()=', isDebugEnabled());

        if (!isDebugEnabled()) {
            console.warn('[MAP-DEBUG] Tentativa de ativar debug, mas DEBUG_MODE não está true. Defina DEBUG_MODE=true primeiro.');
            return false;
        }

        console.log('[MAP-DEBUG] enable() chamado. debugInitialized=', debugInitialized, 'mapEngineRef=', !!mapEngineRef);

        // Se já foi inicializado antes (mapEngineRef existe), apenas ativar
        if (debugInitialized && mapEngineRef) {
            if (!debugMode) {
                debugMode = true;
                createDebugUI();
                console.log('[MAP-DEBUG] Debug mode ativado via console. debugMode=', debugMode, 'isActive()=', isActive());
            }
            return true;
        }

        // Se ainda não tem mapEngineRef, não pode inicializar
        if (!mapEngineRef) {
            console.warn('[MAP-DEBUG] MapDebug ainda não foi inicializado pelo map-engine.js. Aguarde o carregamento completo.');
            return false;
        }

        // Primeira inicialização
        debugInitialized = true;
        debugMode = true;
        createDebugUI();

        // Expor função para toggle via tecla
        window.mapDebugToggle = toggle;
        window.mapDebugSelectUnit = selectUnit;

        console.log('[MAP-DEBUG] Sistema de debug inicializado e ativado. debugMode=', debugMode, 'isActive()=', isActive());
        return true;
    }

    /**
     * Desativa o modo debug
     */
    function disable() {
        debugMode = false;
        const debugPanel = document.getElementById('map-debug-panel');
        if (debugPanel) {
            debugPanel.style.display = 'none';
        }
        console.log('[MAP-DEBUG] Debug mode desativado');
    }

    /**
     * Verifica se o debug foi inicializado
     */
    function isInitialized() {
        return debugInitialized;
    }

    /**
     * Verifica se o modo debug está ativo
     */
    function isActive() {
        const result = debugMode && isDebugEnabled();
        // DEBUG: Log para verificar por que isActive retorna false
        if (!result && debugMode) {
            console.log('[MAP-DEBUG] isActive() retornou false. debugMode=', debugMode, 'isDebugEnabled()=', isDebugEnabled());
        }
        return result;
    }

    /**
     * Toggle do modo debug
     */
    function toggle() {
        if (!isDebugEnabled()) {
            console.warn('[MAP-DEBUG] Debug mode não está habilitado. Defina DEBUG_MODE=true no console primeiro.');
            return;
        }

        if (!debugInitialized) {
            enable();
            return;
        }

        debugMode = !debugMode;

        if (debugMode) {
            createDebugUI();
        } else {
            removeDebugUI();
        }

        if (mapEngineRef?.onDebugToggle) {
            mapEngineRef.onDebugToggle(debugMode);
        }

        console.log(`[MAP-DEBUG] Debug mode: ${debugMode ? 'ON' : 'OFF'}`);
    }

    /**
     * Seleciona uma unidade para debug
     */
    function selectUnit(unit) {
        debugSelectedUnit = unit;
        updateDebugPanelFromUnit();
        updateDebugConfigJson();
        console.log(`[MAP-DEBUG] Unidade selecionada: ${unit?.name || 'nenhuma'}`);
    }

    /**
     * Retorna se está bloqueando cliques do jogo
     */
    function isBlockingGameClicks() {
        return debugBlockGameClicks;
    }

    /**
     * Retorna a unidade selecionada
     */
    function getSelectedUnit() {
        return debugSelectedUnit;
    }

    /**
     * Retorna o estado de animação forçado
     */
    function getAnimationState() {
        return debugAnimationState;
    }

    /**
     * Retorna se deve comparar animações
     */
    function shouldCompareAnimations() {
        return debugCompareAnimations;
    }

    /**
     * Retorna offset de comparação
     */
    function getCompareOffset() {
        return debugCompareOffset;
    }

    /**
     * Retorna se está editando paredes
     */
    function isEditingWalls() {
        return debugEditWalls;
    }

    /**
     * Retorna paredes adicionadas/removidas
     */
    function getWallChanges() {
        return { added: debugWallsAdded, removed: debugWallsRemoved };
    }

    /**
     * Remove a UI de debug
     */
    function removeDebugUI() {
        const panel = document.getElementById('map-debug-panel');
        if (panel) panel.remove();
    }

    /**
     * Cria a UI de debug
     */
    function createDebugUI() {
        // Remover painel existente
        removeDebugUI();

        const debugPanel = document.createElement('div');
        debugPanel.id = 'map-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #60a5fa;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            color: white;
            font-family: monospace;
            font-size: 12px;
            min-width: 220px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
        `;

        debugPanel.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <span>🐛 DEBUG MODE</span>
                <button id="debug-close" style="background: #ef4444; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">X</button>
            </div>
            
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="debug-block-game-clicks" style="cursor: pointer;">
                    <span style="font-size: 11px; color: #fbbf24;">Bloquear cliques do jogo</span>
                </label>
                <div style="font-size: 9px; color: #666; margin-top: 4px;">Quando ativo, cliques apenas selecionam unidades no debug</div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Animação FPS: <span id="debug-fps-value">${debugFPS}</span></label>
                <input type="range" id="debug-fps-slider" min="1" max="30" step="0.5" value="${debugFPS}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Escala: <span id="debug-scale-value">${debugScale}</span>x</label>
                <input type="range" id="debug-scale-slider" min="0.5" max="5" step="0.1" value="${debugScale}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Offset X: <span id="debug-offset-x-value">${debugOffsetX}</span>px</label>
                <input type="range" id="debug-offset-x-slider" min="-100" max="100" step="1" value="${debugOffsetX}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Offset Y: <span id="debug-offset-y-value">${debugOffsetY}</span>px</label>
                <input type="range" id="debug-offset-y-slider" min="-100" max="100" step="1" value="${debugOffsetY}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 8px;">Forçar Animação:</div>
                <div style="display: flex; gap: 4px;">
                    <button id="debug-anim-idle" class="debug-anim-btn" data-anim="idle" style="flex: 1; padding: 6px; background: #1e40af; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Idle</button>
                    <button id="debug-anim-walk" class="debug-anim-btn" data-anim="walk" style="flex: 1; padding: 6px; background: #1e40af; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Walk</button>
                    <button id="debug-anim-atack" class="debug-anim-btn" data-anim="atack" style="flex: 1; padding: 6px; background: #1e40af; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Atack</button>
                    <button id="debug-anim-auto" class="debug-anim-btn" data-anim="" style="flex: 1; padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Auto</button>
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
                <div id="debug-selected-unit" style="font-size: 11px; color: #888; min-height: 16px;">
                    Clique em uma unidade
                </div>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 6px;">Config JSON (unidade selecionada):</div>
                <textarea id="debug-unit-config" readonly style="width: 100%; height: 90px; resize: none; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 6px; font-size: 10px; border-radius: 4px;"></textarea>
                <button id="debug-copy-config" style="width: 100%; margin-top: 6px; padding: 6px; background: #22c55e; border: 1px solid #16a34a; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">📋 Copiar JSON da Unidade</button>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #888; margin-bottom: 6px;">Mover Unidade:</div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; max-width: 120px;">
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
                <div style="font-size: 10px; color: #22c55e; margin-bottom: 8px; font-weight: bold;">HP / MP / Dano:</div>
                <div style="margin-bottom: 8px;">
                    <label style="display: block; font-size: 10px; color: #888; margin-bottom: 4px;">Valor:</label>
                    <input type="number" id="debug-hp-value" value="50" min="1" max="9999" 
                           style="width: 100%; padding: 6px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button id="debug-heal-hp" style="padding: 6px; background: #16a34a; border: 1px solid #22c55e; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">+HP</button>
                    <button id="debug-heal-mp" style="padding: 6px; background: #2563eb; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">+MP</button>
                    <button id="debug-deal-damage" style="padding: 6px; background: #dc2626; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Dano</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px;">
                    <button id="debug-full-heal" style="padding: 6px; background: #059669; border: 1px solid #10b981; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Full HP</button>
                    <button id="debug-full-mp" style="padding: 6px; background: #1d4ed8; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Full MP</button>
                </div>
                <button id="debug-kill-unit" style="width: 100%; margin-top: 4px; padding: 6px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Matar Unidade</button>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #a855f7; margin-bottom: 8px; font-weight: bold;">Efeitos Visuais (SFX):</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <button id="debug-fx-slash" style="padding: 6px; background: #b91c1c; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Slash</button>
                    <button id="debug-fx-magic" style="padding: 6px; background: #7c3aed; border: 1px solid #a855f7; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Magic</button>
                    <button id="debug-fx-heal" style="padding: 6px; background: #059669; border: 1px solid #10b981; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Heal</button>
                    <button id="debug-fx-impact" style="padding: 6px; background: #d97706; border: 1px solid #f59e0b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Impact</button>
                    <button id="debug-fx-thunder" style="padding: 6px; background: #1e40af; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Thunder</button>
                    <button id="debug-fx-blood" style="padding: 6px; background: #991b1b; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Blood</button>
                    <button id="debug-fx-arcane" style="padding: 6px; background: #6b21a8; border: 1px solid #9333ea; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Arcane</button>
                    <button id="debug-fx-divine" style="padding: 6px; background: #78350f; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Divine</button>
                    <button id="debug-fx-sword-wind" style="padding: 6px; background: #475569; border: 1px solid #64748b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Sword Wind</button>
                    <button id="debug-fx-shield-bash" style="padding: 6px; background: #a16207; border: 1px solid #ca8a04; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Shield Bash</button>
                    <button id="debug-fx-berserk" style="padding: 6px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Berserk</button>
                    <button id="debug-fx-parry" style="padding: 6px; background: #1e3a8a; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Parry</button>
                    <button id="debug-fx-cleave" style="padding: 6px; background: #991b1b; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Cleave</button>
                    <button id="debug-fx-life-drain" style="padding: 6px; background: #831843; border: 1px solid #be185d; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Life Drain</button>
                    <button id="debug-fx-stun" style="padding: 6px; background: #78350f; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Stun</button>
                    <button id="debug-fx-bleed" style="padding: 6px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Bleed</button>
                    <button id="debug-fx-champion" style="padding: 6px; background: #854d0e; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Champion</button>
                    <button id="debug-fx-combo" style="padding: 6px; background: #b91c1c; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Combo</button>
                </div>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Aplica na unidade selecionada</div>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #fbbf24; margin-bottom: 8px; font-weight: bold;">Level & Stats:</div>
                <div style="margin-bottom: 8px;">
                    <label style="display: block; font-size: 10px; color: #888; margin-bottom: 4px;">Level: <span id="debug-level-display">1</span></label>
                    <input type="range" id="debug-level-slider" min="1" max="99" value="1" style="width: 100%;">
                </div>
                <div id="debug-stats-display" style="font-size: 10px; color: #94a3b8; line-height: 1.6;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px;">
                        <span>ATK: <span id="debug-stat-atk">--</span></span>
                        <span>MATK: <span id="debug-stat-matk">--</span></span>
                        <span>DEF: <span id="debug-stat-def">--</span></span>
                        <span>MDEF: <span id="debug-stat-mdef">--</span></span>
                    </div>
                </div>
                <button id="debug-apply-level" style="width: 100%; margin-top: 8px; padding: 6px; background: #ca8a04; border: 1px solid #eab308; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Aplicar Level</button>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #ef4444; margin-bottom: 8px; font-weight: bold;">🧱 Editor de Paredes:</div>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                    <input type="checkbox" id="debug-edit-walls" style="cursor: pointer;">
                    <span style="font-size: 11px; color: #f87171;">Modo editar paredes</span>
                </label>
                <div style="font-size: 9px; color: #666; margin-bottom: 8px;">Clique no mapa para adicionar/remover paredes</div>
                <div id="debug-walls-count" style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">Paredes: <span id="debug-walls-total">0</span></div>
                <button id="debug-export-walls" style="width: 100%; padding: 6px; background: #dc2626; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">📋 Copiar JSON das Paredes</button>
                <div id="debug-walls-copied" style="font-size: 9px; color: #22c55e; margin-top: 4px; text-align: center; display: none;">✓ JSON copiado para a área de transferência!</div>
            </div>
            
            <div style="font-size: 9px; color: #4b5563; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
                Pressione D para fechar
            </div>
        `;

        document.body.appendChild(debugPanel);

        // Setup event listeners
        setupEventListeners();
    }

    /**
     * Setup dos event listeners do painel
     */
    function setupEventListeners() {
        // Fechar painel
        document.getElementById('debug-close')?.addEventListener('click', toggle);

        // Checkbox bloquear cliques do jogo
        document.getElementById('debug-block-game-clicks')?.addEventListener('change', (e) => {
            debugBlockGameClicks = e.target.checked;
            console.log(`[MAP-DEBUG] Bloqueio de cliques do jogo: ${debugBlockGameClicks ? 'ATIVO' : 'DESATIVO'}`);
        });

        // Sliders - com salvamento por animação
        document.getElementById('debug-fps-slider')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugFPS = value;
            document.getElementById('debug-fps-value').textContent = value;

            if (debugSelectedUnit) {
                // Salvar temporário
                debugSelectedUnit.debugFPS = value;

                // Salvar permanente na animação atual
                const activeAnimationState = debugAnimationState !== null
                    ? debugAnimationState
                    : (debugSelectedUnit.animationState || 'idle');

                if (!debugSelectedUnit.animations) {
                    debugSelectedUnit.animations = {};
                }
                if (!debugSelectedUnit.animations[activeAnimationState]) {
                    debugSelectedUnit.animations[activeAnimationState] = {};
                }
                debugSelectedUnit.animations[activeAnimationState].animationFPS = value;

                updateDebugConfigJson();
            }
            triggerRender();
        });

        document.getElementById('debug-scale-slider')?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            debugScale = value;
            document.getElementById('debug-scale-value').textContent = value + 'x';

            if (debugSelectedUnit) {
                // Salvar temporário
                debugSelectedUnit.debugScale = value;

                // Salvar permanente na animação atual
                const activeAnimationState = debugAnimationState !== null
                    ? debugAnimationState
                    : (debugSelectedUnit.animationState || 'idle');

                if (!debugSelectedUnit.animations) {
                    debugSelectedUnit.animations = {};
                }
                if (!debugSelectedUnit.animations[activeAnimationState]) {
                    debugSelectedUnit.animations[activeAnimationState] = {};
                }
                debugSelectedUnit.animations[activeAnimationState].animationScale = value;

                updateDebugConfigJson();
            }
            triggerRender();
        });

        document.getElementById('debug-offset-x-slider')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            debugOffsetX = value;
            document.getElementById('debug-offset-x-value').textContent = value + 'px';

            if (debugSelectedUnit) {
                // Salvar temporário
                debugSelectedUnit.debugOffsetX = value;

                // Salvar permanente na animação atual
                const activeAnimationState = debugAnimationState !== null
                    ? debugAnimationState
                    : (debugSelectedUnit.animationState || 'idle');

                if (!debugSelectedUnit.animations) {
                    debugSelectedUnit.animations = {};
                }
                if (!debugSelectedUnit.animations[activeAnimationState]) {
                    debugSelectedUnit.animations[activeAnimationState] = {};
                }
                debugSelectedUnit.animations[activeAnimationState].animationOffsetX = value;

                updateDebugConfigJson();
            }
            triggerRender();
        });

        document.getElementById('debug-offset-y-slider')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            debugOffsetY = value;
            document.getElementById('debug-offset-y-value').textContent = value + 'px';

            if (debugSelectedUnit) {
                // Salvar temporário
                debugSelectedUnit.debugOffsetY = value;

                // Salvar permanente na animação atual
                const activeAnimationState = debugAnimationState !== null
                    ? debugAnimationState
                    : (debugSelectedUnit.animationState || 'idle');

                if (!debugSelectedUnit.animations) {
                    debugSelectedUnit.animations = {};
                }
                if (!debugSelectedUnit.animations[activeAnimationState]) {
                    debugSelectedUnit.animations[activeAnimationState] = {};
                }
                debugSelectedUnit.animations[activeAnimationState].animationOffsetY = value;

                updateDebugConfigJson();
            }
            triggerRender();
        });

        // Botões de animação - com limpeza de valores temporários
        document.querySelectorAll('.debug-anim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const anim = btn.dataset.anim;
                debugAnimationState = anim || null;

                // Limpar valores temporários ao mudar de animação
                if (debugSelectedUnit) {
                    delete debugSelectedUnit.debugFPS;
                    delete debugSelectedUnit.debugScale;
                    delete debugSelectedUnit.debugOffsetX;
                    delete debugSelectedUnit.debugOffsetY;

                    // Resetar animationStartFrame para que animações não-loop (atack) reiniciem do início
                    delete debugSelectedUnit.animationStartFrame;
                    delete debugSelectedUnit._animReverting;
                }

                updateAnimationButtons();
                updateDebugPanelFromUnit(); // Carregar valores originais da nova animação
                updateDebugConfigJson();
                triggerRender();
            });
        });

        // Botão comparar animações
        document.getElementById('debug-compare-anim')?.addEventListener('click', () => {
            debugCompareAnimations = !debugCompareAnimations;
            updateCompareButton();
            triggerRender();
        });

        // Slider de offset da comparação
        const compareOffsetSlider = document.getElementById('debug-compare-offset');
        const compareOffsetValue = document.getElementById('debug-compare-offset-value');
        compareOffsetSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            debugCompareOffset = Number.isNaN(value) ? debugCompareOffset : value;
            if (compareOffsetValue) compareOffsetValue.textContent = debugCompareOffset;
            triggerRender();
        });

        // Botões de movimento
        const moveUp = document.getElementById('debug-move-up');
        const moveDown = document.getElementById('debug-move-down');
        const moveLeft = document.getElementById('debug-move-left');
        const moveRight = document.getElementById('debug-move-right');
        const moveCenter = document.getElementById('debug-move-center');

        function moveDebugUnit(dx, dy) {
            if (!debugSelectedUnit) {
                console.warn('[MAP-DEBUG] Nenhuma unidade selecionada. Clique em uma unidade primeiro.');
                return;
            }

            if (!mapEngineRef || !mapEngineRef.CONFIG) {
                console.warn('[MAP-DEBUG] mapEngineRef não disponível');
                return;
            }

            const newX = debugSelectedUnit.x + dx;
            const newY = debugSelectedUnit.y + dy;

            debugSelectedUnit.x = newX;
            debugSelectedUnit.y = newY;

            // Log das coordenadas
            const CONFIG = mapEngineRef.CONFIG;
            const worldX = (newX - 0.5) * CONFIG.CELL_SIZE;
            const worldY = (newY - 0.5) * CONFIG.CELL_SIZE;
            console.log(`[MAP-DEBUG] ${debugSelectedUnit.name || debugSelectedUnit.id} movido: x=${newX}, y=${newY}, worldX=${worldX.toFixed(2)}, worldY=${worldY.toFixed(2)}`);

            updateDebugPanelFromUnit();
            triggerRender();
        }

        moveUp?.addEventListener('click', () => moveDebugUnit(0, -1));
        moveDown?.addEventListener('click', () => moveDebugUnit(0, 1));
        moveLeft?.addEventListener('click', () => moveDebugUnit(-1, 0));
        moveRight?.addEventListener('click', () => moveDebugUnit(1, 0));
        moveCenter?.addEventListener('click', () => {
            if (debugSelectedUnit && mapEngineRef && mapEngineRef.CONFIG) {
                const CONFIG = mapEngineRef.CONFIG;
                const worldX = (debugSelectedUnit.x - 0.5) * CONFIG.CELL_SIZE;
                const worldY = (debugSelectedUnit.y - 0.5) * CONFIG.CELL_SIZE;
                console.log(`[MAP-DEBUG] ${debugSelectedUnit.name || debugSelectedUnit.id} - Posição atual: x=${debugSelectedUnit.x}, y=${debugSelectedUnit.y}, worldX=${worldX.toFixed(2)}, worldY=${worldY.toFixed(2)}`);
            } else {
                console.warn('[MAP-DEBUG] Nenhuma unidade selecionada');
            }
        });

        // Level slider
        document.getElementById('debug-level-slider')?.addEventListener('input', (e) => {
            document.getElementById('debug-level-display').textContent = e.target.value;
            updateStatsDisplay();
        });

        // Botões de HP/MP/Dano
        setupHpMpButtons();

        // Botões de SFX
        setupSfxButtons();

        // Aplicar level
        document.getElementById('debug-apply-level')?.addEventListener('click', applyLevel);
    }

    /**
     * Atualiza a HUD tática se a unidade do debug for a mesma selecionada no jogo
     */
    function updateTacticalHUDIfNeeded() {
        if (!debugSelectedUnit) return;

        const unit = debugSelectedUnit;

        // Atualizar turn timeline (que agora mostra as informações do personagem)
        if (mapEngineRef && mapEngineRef.updateTurnTimeline && typeof mapEngineRef.updateTurnTimeline === 'function') {
            try {
                mapEngineRef.updateTurnTimeline();
            } catch (e) {
                console.warn('[MAP-DEBUG] Erro ao chamar updateTurnTimeline:', e);
            }
        } else if (window.updateTurnTimeline && typeof window.updateTurnTimeline === 'function') {
            try {
                window.updateTurnTimeline();
            } catch (e) {
                console.warn('[MAP-DEBUG] Erro ao chamar updateTurnTimeline (global):', e);
            }
        }

        // Também tentar usar função do mapEngineRef se disponível (para atualizar botões)
        if (mapEngineRef && mapEngineRef.showTacticalHUD && typeof mapEngineRef.showTacticalHUD === 'function') {
            try {
                mapEngineRef.showTacticalHUD(unit);
            } catch (e) {
                console.warn('[MAP-DEBUG] Erro ao chamar showTacticalHUD:', e);
            }
        }

        // Verificar se gameState.selectedUnit é a mesma unidade e atualizar também
        if (mapEngineRef && mapEngineRef.gameState && mapEngineRef.gameState.selectedUnit) {
            const selectedUnit = mapEngineRef.gameState.selectedUnit;
            // Se for a mesma unidade (mesmo ID ou mesma referência), garantir sincronização
            if (selectedUnit.id === unit.id || selectedUnit === unit) {
                // Atualizar valores no gameState também
                selectedUnit.hp = unit.hp;
                selectedUnit.maxHp = unit.maxHp;
                selectedUnit.sp = unit.sp;
                selectedUnit.maxSp = unit.maxSp;
            }
        }
    }

    function setupHpMpButtons() {
        const hpValueInput = document.getElementById('debug-hp-value');

        document.getElementById('debug-heal-hp')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const value = parseInt(hpValueInput?.value || '50');
            const oldHp = debugSelectedUnit.hp;
            debugSelectedUnit.hp = Math.min(debugSelectedUnit.maxHp, debugSelectedUnit.hp + value);
            const healed = debugSelectedUnit.hp - oldHp;
            if (healed > 0 && mapEngineRef.showHealNumber) {
                mapEngineRef.showHealNumber(debugSelectedUnit.x, debugSelectedUnit.y, healed);
                if (mapEngineRef.spawnHealEffect) {
                    const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
                    const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
                    mapEngineRef.spawnHealEffect(x, y);
                }
            }
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });

        document.getElementById('debug-heal-mp')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const value = parseInt(hpValueInput?.value || '50');
            const oldMp = debugSelectedUnit.sp || 0;
            debugSelectedUnit.sp = Math.min(debugSelectedUnit.maxSp || 100, oldMp + value);
            const restored = debugSelectedUnit.sp - oldMp;
            if (restored > 0 && mapEngineRef.showManaNumber) {
                mapEngineRef.showManaNumber(debugSelectedUnit.x, debugSelectedUnit.y, restored);
            }
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });

        document.getElementById('debug-deal-damage')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const value = parseInt(hpValueInput?.value || '50');
            debugSelectedUnit.hp = Math.max(0, debugSelectedUnit.hp - value);
            if (mapEngineRef.showDamageNumber) {
                mapEngineRef.showDamageNumber(debugSelectedUnit.x, debugSelectedUnit.y, value);
            }
            if (mapEngineRef.spawnImpactBurst) {
                const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
                const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
                mapEngineRef.spawnImpactBurst(x, y);
            }
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });

        document.getElementById('debug-full-heal')?.addEventListener('click', () => {
            if (!debugSelectedUnit) return;
            debugSelectedUnit.hp = debugSelectedUnit.maxHp;
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });

        document.getElementById('debug-full-mp')?.addEventListener('click', () => {
            if (!debugSelectedUnit) return;
            debugSelectedUnit.sp = debugSelectedUnit.maxSp || 100;
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });

        document.getElementById('debug-kill-unit')?.addEventListener('click', () => {
            if (!debugSelectedUnit) return;
            const damage = debugSelectedUnit.hp;
            debugSelectedUnit.hp = 0;
            if (mapEngineRef?.showDamageNumber) {
                mapEngineRef.showDamageNumber(debugSelectedUnit.x, debugSelectedUnit.y, damage, true);
            }
            updateTacticalHUDIfNeeded(); // Atualizar HUD
            triggerRender();
        });
    }

    function setupSfxButtons() {
        document.getElementById('debug-fx-slash')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX) window.MapSFX.spawnSlashEffect(x, y);
            else if (mapEngineRef.spawnSlashEffect) mapEngineRef.spawnSlashEffect(x, y);
        });

        document.getElementById('debug-fx-magic')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX) window.MapSFX.spawnMagicEffect(x, y, '#a855f7');
            else if (mapEngineRef.spawnMagicEffect) mapEngineRef.spawnMagicEffect(x, y, '#a855f7');
        });

        document.getElementById('debug-fx-heal')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX) window.MapSFX.spawnHealEffect(x, y);
            else if (mapEngineRef.spawnHealEffect) mapEngineRef.spawnHealEffect(x, y);
        });

        document.getElementById('debug-fx-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX) window.MapSFX.spawnImpactBurst(x, y, '#fbbf24');
            else if (mapEngineRef.spawnImpactBurst) mapEngineRef.spawnImpactBurst(x, y, '#fbbf24');
        });

        // Novos efeitos premium
        document.getElementById('debug-fx-thunder')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnThunderStrike) {
                window.MapSFX.spawnThunderStrike(x, y, 1.5);
            }
        });

        document.getElementById('debug-fx-blood')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnBloodSplash) {
                window.MapSFX.spawnBloodSplash(x, y, 1);
            }
        });

        document.getElementById('debug-fx-arcane')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnArcaneExplosion) {
                window.MapSFX.spawnArcaneExplosion(x, y, '#a855f7', 1);
            }
        });

        document.getElementById('debug-fx-divine')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDivineBeam) {
                window.MapSFX.spawnDivineBeam(x, y, 1);
            }
        });

        // Novos efeitos para espadachim (10 efeitos)
        document.getElementById('debug-fx-sword-wind')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSwordWind) {
                window.MapSFX.spawnSwordWind(x, y, 1);
            }
        });

        document.getElementById('debug-fx-shield-bash')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnShieldBashImpact) {
                window.MapSFX.spawnShieldBashImpact(x, y, 1);
            }
        });

        document.getElementById('debug-fx-berserk')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnBerserkAura) {
                window.MapSFX.spawnBerserkAura(x, y, 1);
            }
        });

        document.getElementById('debug-fx-parry')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnParrySpark) {
                window.MapSFX.spawnParrySpark(x, y, 1);
            }
        });

        document.getElementById('debug-fx-cleave')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnCleaveWave) {
                window.MapSFX.spawnCleaveWave(x, y, 1);
            }
        });

        document.getElementById('debug-fx-life-drain')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnLifeDrain) {
                window.MapSFX.spawnLifeDrain(x, y, 1);
            }
        });

        document.getElementById('debug-fx-stun')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnStunFlash) {
                window.MapSFX.spawnStunFlash(x, y, 1);
            }
        });

        document.getElementById('debug-fx-bleed')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnBleedDrops) {
                window.MapSFX.spawnBleedDrops(x, y, 1);
            }
        });

        document.getElementById('debug-fx-champion')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnChampionsAura) {
                window.MapSFX.spawnChampionsAura(x, y, 1);
            }
        });

        document.getElementById('debug-fx-combo')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSwordCombo) {
                window.MapSFX.spawnSwordCombo(x, y, 1);
            }
        });

        // === WALL EDITOR HANDLERS ===
        document.getElementById('debug-edit-walls')?.addEventListener('change', (e) => {
            debugEditWalls = e.target.checked;
            updateWallsCount();
            triggerRender();
        });

        document.getElementById('debug-export-walls')?.addEventListener('click', () => {
            if (!mapEngineRef || !mapEngineRef.getWalls) {
                alert('Erro: mapEngineRef.getWalls não disponível');
                return;
            }
            const walls = mapEngineRef.getWalls();
            const json = JSON.stringify(walls, null, 4);

            // Copiar para clipboard com fallback para contextos não seguros (HTTP)
            const copyToClipboard = (text) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(text);
                } else {
                    // Fallback para navegadores antigos ou conexões HTTP inseguras
                    return new Promise((resolve, reject) => {
                        try {
                            const textArea = document.createElement("textarea");
                            textArea.value = text;
                            textArea.style.position = "fixed";
                            textArea.style.left = "-9999px";
                            textArea.style.top = "0";
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            if (successful) resolve();
                            else reject(new Error('Falha no execCommand copy'));
                        } catch (err) {
                            reject(err);
                        }
                    });
                }
            };

            copyToClipboard(json).then(() => {
                const msg = document.getElementById('debug-walls-copied');
                if (msg) {
                    msg.style.display = 'block';
                    setTimeout(() => { msg.style.display = 'none'; }, 2000);
                }
                console.log('[MAP-DEBUG] JSON das paredes copiado:', json);
            }).catch(err => {
                console.error('[MAP-DEBUG] Erro ao copiar:', err);
                // Último recurso: mostrar em prompt
                prompt('Copie o JSON abaixo:', json);
            });
        });

        // Atualizar contador de paredes inicialmente
        setTimeout(updateWallsCount, 500);
    }

    function applyLevel() {
        if (!debugSelectedUnit) return;

        const level = parseInt(document.getElementById('debug-level-slider')?.value || '1');
        debugSelectedUnit.level = level;

        if (debugSelectedUnit.attributes && window.SkillEngine) {
            const stats = window.SkillEngine.calculateStatsFromAttributes(level, debugSelectedUnit.attributes);
            debugSelectedUnit.attack = stats.atk;
            debugSelectedUnit.matk = stats.matk;
            debugSelectedUnit.defense = stats.softDef;
            debugSelectedUnit.mdef = stats.mdef;
            debugSelectedUnit.maxHp = stats.maxHp;
            debugSelectedUnit.hp = Math.min(debugSelectedUnit.hp, stats.maxHp);
            debugSelectedUnit.maxSp = stats.maxMana;
        }

        updateStatsDisplay();
        triggerRender();
    }

    function updateCompareButton() {
        const compareBtn = document.getElementById('debug-compare-anim');
        if (!compareBtn) return;
        compareBtn.style.background = debugCompareAnimations ? '#22c55e' : '#1e40af';
        compareBtn.textContent = debugCompareAnimations ? 'Comparação ligada' : 'Comparação desligada';
    }

    function updateAnimationButtons() {
        document.querySelectorAll('.debug-anim-btn').forEach(btn => {
            const anim = btn.dataset.anim;
            const isActive = (anim === '' && debugAnimationState === null) || (anim === debugAnimationState);
            btn.style.background = isActive ? '#3b82f6' : '#1e40af';
        });
    }

    function updateDebugPanelFromUnit() {
        const unitDiv = document.getElementById('debug-selected-unit');
        if (!unitDiv) return;

        if (debugSelectedUnit) {
            const unit = debugSelectedUnit;
            const type = unit.type === 'player' ? 'Player' : 'Enemy';
            unitDiv.textContent = `${type}: ${unit.name} (${unit.x}, ${unit.y})`;
            unitDiv.style.color = unit.type === 'player' ? '#60a5fa' : '#ef4444';

            // Determinar qual animação está ativa (debug forçado ou animação real)
            const activeAnimationState = debugAnimationState !== null
                ? debugAnimationState
                : (unit.animationState || 'idle');

            // Buscar configurações específicas da animação atual ou usar globais (retrocompatibilidade)
            let animConfig = null;
            if (unit.animations && unit.animations[activeAnimationState]) {
                animConfig = unit.animations[activeAnimationState];
                console.log(`[MAP-DEBUG] Lendo valores originais da animação ${activeAnimationState}:`, animConfig);
            }

            // Carregar valores: primeiro de debug temporário, depois de animConfig, depois global, depois padrão
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

            // Atualizar sliders com os valores corretos
            const fpsSlider = document.getElementById('debug-fps-slider');
            const fpsValue = document.getElementById('debug-fps-value');
            const scaleSlider = document.getElementById('debug-scale-slider');
            const scaleValue = document.getElementById('debug-scale-value');
            const offsetXSlider = document.getElementById('debug-offset-x-slider');
            const offsetXValue = document.getElementById('debug-offset-x-value');
            const offsetYSlider = document.getElementById('debug-offset-y-slider');
            const offsetYValue = document.getElementById('debug-offset-y-value');

            if (fpsSlider) {
                fpsSlider.value = currentFPS;
                if (fpsValue) fpsValue.textContent = currentFPS;
            }
            if (scaleSlider) {
                scaleSlider.value = currentScale;
                if (scaleValue) scaleValue.textContent = currentScale + 'x';
            }
            if (offsetXSlider) {
                offsetXSlider.value = currentOffsetX;
                if (offsetXValue) offsetXValue.textContent = currentOffsetX + 'px';
            }
            if (offsetYSlider) {
                offsetYSlider.value = currentOffsetY;
                if (offsetYValue) offsetYValue.textContent = currentOffsetY + 'px';
            }

            // Update level slider
            const levelSlider = document.getElementById('debug-level-slider');
            const levelDisplay = document.getElementById('debug-level-display');
            if (levelSlider && unit.level) {
                levelSlider.value = unit.level;
                if (levelDisplay) levelDisplay.textContent = unit.level;
            }

            updateStatsDisplay();
        } else {
            unitDiv.textContent = 'Clique em uma unidade';
            unitDiv.style.color = '#888';
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
                    },
                    atack: {
                        animationFPS: unit.animations.atack?.animationFPS ?? (unit.animationFPS ?? debugFPS),
                        animationScale: unit.animations.atack?.animationScale ?? (unit.animationScale ?? debugScale),
                        animationOffsetX: unit.animations.atack?.animationOffsetX ?? (unit.animationOffsetX ?? debugOffsetX),
                        animationOffsetY: unit.animations.atack?.animationOffsetY ?? (unit.animationOffsetY ?? debugOffsetY)
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

    function updateStatsDisplay() {
        if (!debugSelectedUnit) return;

        document.getElementById('debug-stat-atk').textContent = debugSelectedUnit.attack || '--';
        document.getElementById('debug-stat-matk').textContent = debugSelectedUnit.matk || '--';
        document.getElementById('debug-stat-def').textContent = debugSelectedUnit.defense || '--';
        document.getElementById('debug-stat-mdef').textContent = debugSelectedUnit.mdef || '--';
    }

    function triggerRender() {
        if (mapEngineRef?.triggerRender) {
            mapEngineRef.triggerRender();
        }
    }

    // === FUNÇÕES DE EDIÇÃO DE PAREDES ===

    function isEditingWalls() {
        return debugEditWalls && debugMode;
    }

    function getWallChanges() {
        return {
            added: [...debugWallsAdded],
            removed: [...debugWallsRemoved]
        };
    }

    function updateWallsCount() {
        const countEl = document.getElementById('debug-walls-total');
        if (!countEl || !mapEngineRef) return;

        if (mapEngineRef.getWalls) {
            const walls = mapEngineRef.getWalls();
            countEl.textContent = Array.isArray(walls) ? walls.length : 0;
        } else {
            countEl.textContent = '?';
        }
    }

    // ==========================================
    // EXPORTAR API GLOBAL
    // ==========================================

    window.MapDebug = {
        init,
        enable,
        disable,
        toggle,
        isActive,
        isInitialized,
        selectUnit,
        getSelectedUnit,
        getAnimationState,
        shouldCompareAnimations,
        getCompareOffset,
        isEditingWalls,
        getWallChanges,
        isBlockingGameClicks,
        isEnabled: isDebugEnabled
    };

    console.log('[MAP-DEBUG] Módulo carregado');
})();

