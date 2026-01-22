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
        const d = document.getElementById('debug-stats-diff'); if (d) d.textContent = '';
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
                    <button id="debug-anim-normal" class="debug-anim-btn" data-anim="" style="flex: 1; padding: 6px; background: #3b82f6; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Normal</button>
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
                <button id="debug-inspect-status" style="width: 100%; margin-top: 8px; padding: 8px; background: #fbbf24; border: 1px solid #eab308; border-radius: 4px; color: #000; cursor: pointer; font-size: 11px; font-weight: bold; opacity: 0.5; pointer-events: none;" disabled>
                    🔍 Inspect Status
                </button>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Mostra status completo no console</div>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px; font-weight: bold;">Atributos (Ficha):</div>
                <div style="font-size: 9px; color: #666; margin-bottom: 4px;">STR AGI VIT INT DEX LUK</div>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 6px;">
                    <input type="number" id="debug-attr-str" min="1" max="999" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="STR">
                    <input type="number" id="debug-attr-agi" min="1" max="999" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="AGI">
                    <input type="number" id="debug-attr-vit" min="1" max="999" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="VIT">
                    <input type="number" id="debug-attr-int" min="1" max="99" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="INT">
                    <input type="number" id="debug-attr-dex" min="1" max="999" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="DEX">
                    <input type="number" id="debug-attr-luk" min="1" max="999" value="1" style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px; text-align: center;" title="LUK">
                </div>
                <button id="debug-apply-attributes" style="width: 100%; padding: 6px; background: #7c3aed; border: 1px solid #a78bfa; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Aplicar atributos</button>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Recalcula ATK/DEF/HP/MP</div>
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
                    <button id="debug-fx-ice" style="padding: 6px; background: #0ea5e9; border: 1px solid #38bdf8; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Ice Shatter</button>
                    <button id="debug-fx-soul" style="padding: 6px; background: #059669; border: 1px solid #10b981; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Soul Absorb</button>
                    <button id="debug-fx-vortex" style="padding: 6px; background: #4c1d95; border: 1px solid #7c3aed; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Dark Vortex</button>
                    <button id="debug-fx-phoenix" style="padding: 6px; background: #ea580c; border: 1px solid #f97316; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Phoenix Rise</button>
                    <button id="debug-fx-quake" style="padding: 6px; background: #78350f; border: 1px solid #a16207; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Earth Quake</button>
                    <button id="debug-fx-spirit" style="padding: 6px; background: #0284c7; border: 1px solid #38bdf8; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Spirit Blast</button>
                    <button id="debug-fx-poison" style="padding: 6px; background: #15803d; border: 1px solid #22c55e; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Poison Cloud</button>
                    <button id="debug-fx-shadow" style="padding: 6px; background: #18181b; border: 1px solid #3f3f46; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Shadow Strike</button>
                    <button id="debug-fx-celestial" style="padding: 6px; background: #a16207; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Celestial Rain</button>
                    <button id="debug-fx-nova" style="padding: 6px; background: #f97316; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Nova</button>
                    <button id="debug-fx-circle" style="padding: 6px; background: #7c3aed; border: 1px solid #a855f7; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Magic ⭕</button>
                    <button id="debug-fx-chain" style="padding: 6px; background: #0284c7; border: 1px solid #38bdf8; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Chain ⚡</button>
                    <button id="debug-fx-shock" style="padding: 6px; background: #d97706; border: 1px solid #f59e0b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Shockwave</button>
                    <button id="debug-fx-meteor" style="padding: 6px; background: #b91c1c; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Meteor ☄️</button>
                    <button id="debug-fx-mirror" style="padding: 6px; background: #2563eb; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Mirror 👻</button>
                    <button id="debug-fx-penta" style="padding: 6px; background: #991b1b; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Penta ⭐</button>
                    <button id="debug-fx-timewarp" style="padding: 6px; background: #6d28d9; border: 1px solid #8b5cf6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Time 🌀</button>
                    <button id="debug-fx-laser" style="padding: 6px; background: #dc2626; border: 1px solid #f87171; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Laser 💥</button>
                    <button id="debug-fx-tornado" style="padding: 6px; background: #64748b; border: 1px solid #94a3b8; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Tornado 🌪️</button>
                    <button id="debug-fx-blackhole" style="padding: 6px; background: #1e1b4b; border: 1px solid #4c1d95; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Black Hole 🕳️</button>
                    <button id="debug-fx-dragon" style="padding: 6px; background: #b91c1c; border: 1px solid #f97316; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Dragon 🔥</button>
                    <button id="debug-fx-healrain" style="padding: 6px; background: #059669; border: 1px solid #4ade80; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Heal Rain 💧</button>
                    <button id="debug-fx-fissure" style="padding: 6px; background: #78350f; border: 1px solid #a16207; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Fissure 🌋</button>
                    <button id="debug-fx-swordstorm" style="padding: 6px; background: #71717a; border: 1px solid #a1a1aa; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Sword ⚔️</button>
                    <button id="debug-fx-holy" style="padding: 6px; background: #ca8a04; border: 1px solid #fcd34d; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Holy ✨</button>
                    <button id="debug-fx-poisonnova" style="padding: 6px; background: #166534; border: 1px solid #4ade80; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">P.Nova ☠️</button>
                    <button id="debug-fx-frostnova" style="padding: 6px; background: #0369a1; border: 1px solid #7dd3fc; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">F.Nova ❄️</button>
                    <button id="debug-fx-warcry" style="padding: 6px; background: #d97706; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Warcry 📢</button>
                    <button id="debug-fx-galaxy" style="padding: 6px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Galaxy 🌌</button>
                    <button id="debug-fx-samurai" style="padding: 6px; background: #1c1917; border: 1px solid #44403c; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Samurai ⚔️</button>
                    <button id="debug-fx-supernova" style="padding: 6px; background: #fbbf24; border: 1px solid #fcd34d; border-radius: 4px; color: #1c1917; cursor: pointer; font-size: 10px;">Supernova ✨</button>
                    <button id="debug-fx-vampire" style="padding: 6px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Vampire 🧛</button>
                    <button id="debug-fx-storm" style="padding: 6px; background: #1e3a5f; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Storm ⛈️</button>
                    <button id="debug-fx-rift" style="padding: 6px; background: #581c87; border: 1px solid #7c3aed; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Rift 🌀</button>
                    <button id="debug-fx-atomic" style="padding: 6px; background: #f97316; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Atomic ☢️</button>
                    <button id="debug-fx-angel" style="padding: 6px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; color: #1c1917; cursor: pointer; font-size: 10px;">Angel 👼</button>
                    <button id="debug-fx-demon" style="padding: 6px; background: #450a0a; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Demon 😈</button>
                    <button id="debug-fx-gravity" style="padding: 6px; background: #3b0764; border: 1px solid #7c3aed; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Gravity 🕳️</button>
                    <button id="debug-fx-crystal" style="padding: 6px; background: #0891b2; border: 1px solid #22d3ee; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Crystal 💎</button>
                    <button id="debug-fx-reaper" style="padding: 6px; background: #18181b; border: 1px solid #581c87; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Reaper 💀</button>
                    <button id="debug-fx-elemental" style="padding: 6px; background: linear-gradient(90deg, #dc2626, #3b82f6, #fbbf24); border: 1px solid #fff; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Elem 🔥</button>
                    <button id="debug-fx-spiritbomb" style="padding: 6px; background: #1d4ed8; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Spirit 💫</button>
                    <button id="debug-fx-bloodmoon" style="padding: 6px; background: #7f1d1d; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Moon 🌙</button>
                    <button id="debug-fx-thundergod" style="padding: 6px; background: #ca8a04; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">T.God ⚡</button>
                    <button id="debug-fx-voidcollapse" style="padding: 6px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Void 🌑</button>
                    <button id="debug-fx-infernotornado" style="padding: 6px; background: #dc2626; border: 1px solid #f97316; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">F.Torn 🔥</button>
                    <button id="debug-fx-divinejudgment" style="padding: 6px; background: #fbbf24; border: 1px solid #fcd34d; border-radius: 4px; color: #1c1917; cursor: pointer; font-size: 10px;">Divine ⚔️</button>
                    <button id="debug-fx-deathmark" style="padding: 6px; background: #18181b; border: 1px solid #3f3f46; border-radius: 4px; color: white; cursor: pointer; font-size: 10px;">Death 💀</button>
                </div>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Aplica na unidade selecionada</div>
            </div>

            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #22c55e; margin-bottom: 8px; font-weight: bold;">🏹 Archer Skills (Cast/Impact):</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <button id="debug-archer-quickshot-cast" style="padding: 5px; background: #854d0e; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 QuickShot Cast</button>
                    <button id="debug-archer-quickshot-impact" style="padding: 5px; background: #ca8a04; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">💥 QuickShot Hit</button>
                    <button id="debug-archer-poison-cast" style="padding: 5px; background: #166534; border: 1px solid #22c55e; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Poison Cast</button>
                    <button id="debug-archer-poison-impact" style="padding: 5px; background: #15803d; border: 1px solid #4ade80; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">☠️ Poison Hit</button>
                    <button id="debug-archer-focused-cast" style="padding: 5px; background: #1e40af; border: 1px solid #60a5fa; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Focused Cast</button>
                    <button id="debug-archer-focused-impact" style="padding: 5px; background: #2563eb; border: 1px solid #93c5fd; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🎯 Focused Hit</button>
                    <button id="debug-archer-piercing-cast" style="padding: 5px; background: #9a3412; border: 1px solid #f97316; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Pierce Cast</button>
                    <button id="debug-archer-piercing-impact" style="padding: 5px; background: #ea580c; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">➡️ Pierce Hit</button>
                    <button id="debug-archer-multishot-cast" style="padding: 5px; background: #581c87; border: 1px solid #a855f7; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Multi Cast</button>
                    <button id="debug-archer-multishot-impact" style="padding: 5px; background: #7c3aed; border: 1px solid #c084fc; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🎯 Multi Hit</button>
                    <button id="debug-archer-huntersfocus" style="padding: 5px; background: #b45309; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" colspan="2">👁️ Hunter's Focus (Buff)</button>
                    <button id="debug-archer-tactical-cast" style="padding: 5px; background: #374151; border: 1px solid #9ca3af; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Tactical Cast</button>
                    <button id="debug-archer-tactical-impact" style="padding: 5px; background: #6b7280; border: 1px solid #d1d5db; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">💨 Tactical Hit</button>
                    <button id="debug-archer-rain-cast" style="padding: 5px; background: #854d0e; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Rain Cast</button>
                    <button id="debug-archer-rain-impact" style="padding: 5px; background: #d97706; border: 1px solid #fcd34d; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🌧️ Rain Impact</button>
                    <button id="debug-archer-cripple-cast" style="padding: 5px; background: #0369a1; border: 1px solid #0ea5e9; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">🏹 Cripple Cast</button>
                    <button id="debug-archer-cripple-impact" style="padding: 5px; background: #0891b2; border: 1px solid #7dd3fc; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">❄️ Cripple Hit</button>
                    <button id="debug-archer-deadly-cast" style="padding: 5px; background: #7f1d1d; border: 1px solid #dc2626; border-radius: 4px; color: white; cursor: pointer; font-size: 9px; font-weight: bold;">⚡ DEADLY Cast</button>
                    <button id="debug-archer-deadly-impact" style="padding: 5px; background: #dc2626; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px; font-weight: bold;">💀 DEADLY Hit</button>
                </div>
                <div style="font-size: 9px; color: #666; margin-top: 4px; text-align: center;">Cast = origem | Impact = alvo</div>
            </div>
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #22c55e; margin-bottom: 8px; font-weight: bold;">🛡️ Buffs & Status:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    <button id="debug-buff-berserker" style="padding: 6px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="ATK+25%, DEF-15%, 3 turns">Berserker</button>
                    <button id="debug-buff-defense" style="padding: 6px; background: #1e3a8a; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="Reduce damage 50%, 2 turns">Defensive</button>
                    <button id="debug-buff-focus" style="padding: 6px; background: #854d0e; border: 1px solid #ca8a04; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="ATK+50%, CRIT+20%, 3 turns">Focus</button>
                    <button id="debug-buff-evasion" style="padding: 6px; background: #166534; border: 1px solid #22c55e; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="FLEE+50, AGI+20, 2 turns">Evasion</button>
                    <button id="debug-buff-stone" style="padding: 6px; background: #374151; border: 1px solid #6b7280; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="VIT+5, DMG-20%, 3 turns">Stone Skin</button>
                    <button id="debug-buff-regen" style="padding: 6px; background: #059669; border: 1px solid #10b981; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="Regen 10% HP/turn, 3 turns">Regen</button>
                    <button id="debug-buff-haste" style="padding: 6px; background: #0891b2; border: 1px solid #22d3ee; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="Speed+30%, 2 turns">Haste</button>
                    <button id="debug-buff-crit" style="padding: 6px; background: #9a3412; border: 1px solid #ea580c; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;" title="CRIT+30%, 3 turns">Crit Up</button>
                </div>
                <div style="font-size: 9px; color: #f87171; margin-top: 8px; margin-bottom: 4px;">Status Effects:</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button id="debug-status-poison" style="padding: 5px; background: #4c1d95; border: 1px solid #7c3aed; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Poison</button>
                    <button id="debug-status-bleed" style="padding: 5px; background: #7f1d1d; border: 1px solid #ef4444; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Bleed</button>
                    <button id="debug-status-stun" style="padding: 5px; background: #78350f; border: 1px solid #fbbf24; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Stun</button>
                    <button id="debug-status-burn" style="padding: 5px; background: #9a3412; border: 1px solid #f97316; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Burn</button>
                    <button id="debug-status-slow" style="padding: 5px; background: #1e40af; border: 1px solid #3b82f6; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Slow</button>
                    <button id="debug-status-clear" style="padding: 5px; background: #15803d; border: 1px solid #22c55e; border-radius: 4px; color: white; cursor: pointer; font-size: 9px;">Clear All</button>
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
                        <span>ATK Rng: <span id="debug-stat-atkRanged">--</span></span>
                        <span>MATK: <span id="debug-stat-matk">--</span></span>
                        <span>DEF: <span id="debug-stat-def">--</span></span>
                        <span>MDEF: <span id="debug-stat-mdef">--</span></span>
                        <span>HP: <span id="debug-stat-hp">--</span></span>
                        <span>MP: <span id="debug-stat-mp">--</span></span>
                    </div>
                </div>
                <div id="debug-stats-diff" style="font-size: 9px; color: #4ade80; margin-top: 6px; min-height: 14px;"></div>
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
            
            <div style="margin-bottom: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <div style="font-size: 10px; color: #a78bfa; margin-bottom: 6px; font-weight: bold;">Free Control (Testing):</div>
                <div style="font-size: 9px; color: #666; margin-bottom: 4px;">Escolha a unidade aqui para controle total: mover, atacar, skills — o turno <strong>não</strong> avança. Use &quot;Sair CL&quot; na HUD ou Off para sair.</div>
                <select id="debug-free-control" style="width: 100%; padding: 6px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; font-size: 11px;">
                    <option value="off">-- Off --</option>
                </select>
            </div>
            
            <div style="font-size: 9px; color: #4b5563; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
                Pressione D para fechar
            </div>
        `;

        document.body.appendChild(debugPanel);

        // Setup event listeners
        setupEventListeners();
    }

    function updateFreeControlDropdown() {
        const sel = document.getElementById('debug-free-control');
        if (!sel || !mapEngineRef) return;
        sel.innerHTML = '';
        const offOpt = document.createElement('option');
        offOpt.value = 'off';
        offOpt.textContent = '-- Off --';
        sel.appendChild(offOpt);
        const players = (mapEngineRef.playerUnits && mapEngineRef.playerUnits()) || [];
        const enemies = (mapEngineRef.enemyUnits && mapEngineRef.enemyUnits()) || [];
        players.filter(u => u.hp > 0).forEach((u, i) => {
            const o = document.createElement('option');
            o.value = 'player:' + u.id;
            o.textContent = u.name || u.combatKey || u.combat_key || ('Ally ' + (i + 1));
            sel.appendChild(o);
        });
        enemies.filter(u => u.hp > 0).forEach((u, i) => {
            const o = document.createElement('option');
            o.value = 'enemy:' + u.id;
            o.textContent = u.name || u.combatKey || u.combat_key || ('Enemy ' + (i + 1));
            sel.appendChild(o);
        });
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

                    // Resetar animationStartTimeMs para que animações não-loop (atack) reiniciem do início
                    delete debugSelectedUnit.animationStartTimeMs;
                    delete debugSelectedUnit.animationStartFrame; // legado
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

        // Botões de Buffs/Status
        setupBuffButtons();

        // Aplicar level
        document.getElementById('debug-apply-level')?.addEventListener('click', applyLevel);

        // Aplicar atributos (ficha)
        document.getElementById('debug-apply-attributes')?.addEventListener('click', applyAttributes);

        // Botão Inspect Status
        document.getElementById('debug-inspect-status')?.addEventListener('click', () => {
            if (!debugSelectedUnit) {
                console.warn('[MAP-DEBUG] No unit selected for inspection');
                return;
            }
            inspectStatus(debugSelectedUnit);
        });

        // Botão Copiar JSON da Unidade
        document.getElementById('debug-copy-config')?.addEventListener('click', () => {
            if (!debugSelectedUnit) return;
            const json = JSON.stringify(debugSelectedUnit, null, 2);
            const done = () => {
                const btn = document.getElementById('debug-copy-config');
                if (btn) {
                    const original = btn.textContent;
                    btn.textContent = '✓ Copiado!';
                    btn.style.background = '#16a34a';
                    setTimeout(() => {
                        btn.textContent = original;
                        btn.style.background = '#22c55e';
                    }, 2000);
                }
            };
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(json).then(done).catch(() => fallbackCopy(json, done));
            } else {
                fallbackCopy(json, done);
            }
        });

        function fallbackCopy(text, onDone) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.setAttribute('readonly', '');
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                onDone();
            } catch (e) {
                console.warn('[MAP-DEBUG] Falha ao copiar:', e);
                if (typeof onDone === 'function') onDone();
            }
            document.body.removeChild(ta);
        }
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

        // Novos efeitos criativos (10 efeitos)
        document.getElementById('debug-fx-ice')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnIceShatter) {
                window.MapSFX.spawnIceShatter(x, y, 1);
            }
        });

        document.getElementById('debug-fx-soul')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSoulAbsorb) {
                window.MapSFX.spawnSoulAbsorb(x, y, 1);
            }
        });

        document.getElementById('debug-fx-vortex')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDarkVortex) {
                window.MapSFX.spawnDarkVortex(x, y, 1);
            }
        });

        document.getElementById('debug-fx-phoenix')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnPhoenixRise) {
                window.MapSFX.spawnPhoenixRise(x, y, 1);
            }
        });

        document.getElementById('debug-fx-quake')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnEarthQuake) {
                window.MapSFX.spawnEarthQuake(x, y, 1);
            }
        });

        document.getElementById('debug-fx-spirit')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSpiritBlast) {
                window.MapSFX.spawnSpiritBlast(x, y, 1);
            }
        });

        document.getElementById('debug-fx-poison')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnPoisonCloud) {
                window.MapSFX.spawnPoisonCloud(x, y, 1);
            }
        });

        document.getElementById('debug-fx-shadow')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnShadowStrike) {
                window.MapSFX.spawnShadowStrike(x, y, 1);
            }
        });

        document.getElementById('debug-fx-celestial')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnCelestialRain) {
                window.MapSFX.spawnCelestialRain(x, y, 1);
            }
        });

        document.getElementById('debug-fx-nova')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnNovaExplosion) {
                window.MapSFX.spawnNovaExplosion(x, y, 1);
            }
        });

        // Efeitos únicos e criativos (8 efeitos)
        document.getElementById('debug-fx-circle')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnMagicCircle) {
                window.MapSFX.spawnMagicCircle(x, y, 1);
            }
        });

        document.getElementById('debug-fx-chain')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnChainLightning) {
                window.MapSFX.spawnChainLightning(x, y, 1);
            }
        });

        document.getElementById('debug-fx-shock')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnShockwavePulse) {
                window.MapSFX.spawnShockwavePulse(x, y, 1);
            }
        });

        document.getElementById('debug-fx-meteor')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnMeteorStrike) {
                window.MapSFX.spawnMeteorStrike(x, y, 1);
            }
        });

        document.getElementById('debug-fx-mirror')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnMirrorImages) {
                window.MapSFX.spawnMirrorImages(x, y, 1);
            }
        });

        document.getElementById('debug-fx-penta')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnPentagramSummon) {
                window.MapSFX.spawnPentagramSummon(x, y, 1);
            }
        });

        document.getElementById('debug-fx-timewarp')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnTimeWarp) {
                window.MapSFX.spawnTimeWarp(x, y, 1);
            }
        });

        document.getElementById('debug-fx-laser')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnLaserBeam) {
                window.MapSFX.spawnLaserBeam(x, y, 1);
            }
        });

        // Efeitos épicos batch 3 (10 efeitos)
        document.getElementById('debug-fx-tornado')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnTornadoVortex) {
                window.MapSFX.spawnTornadoVortex(x, y, 1);
            }
        });

        document.getElementById('debug-fx-blackhole')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnBlackHole) {
                window.MapSFX.spawnBlackHole(x, y, 1);
            }
        });

        document.getElementById('debug-fx-dragon')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDragonBreath) {
                window.MapSFX.spawnDragonBreath(x, y, 1);
            }
        });

        document.getElementById('debug-fx-healrain')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnHealingRain) {
                window.MapSFX.spawnHealingRain(x, y, 1);
            }
        });

        document.getElementById('debug-fx-fissure')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnEarthquakeFissure) {
                window.MapSFX.spawnEarthquakeFissure(x, y, 1);
            }
        });

        document.getElementById('debug-fx-swordstorm')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSwordStorm) {
                window.MapSFX.spawnSwordStorm(x, y, 1);
            }
        });

        document.getElementById('debug-fx-holy')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnHolyExplosion) {
                window.MapSFX.spawnHolyExplosion(x, y, 1);
            }
        });

        document.getElementById('debug-fx-poisonnova')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnPoisonNova) {
                window.MapSFX.spawnPoisonNova(x, y, 1);
            }
        });

        document.getElementById('debug-fx-frostnova')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnFrostNova) {
                window.MapSFX.spawnFrostNova(x, y, 1);
            }
        });

        document.getElementById('debug-fx-warcry')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnWarcryRoar) {
                window.MapSFX.spawnWarcryRoar(x, y, 1);
            }
        });

        // Efeitos de cair o queixo batch 1 (10 efeitos)
        document.getElementById('debug-fx-galaxy')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnGalaxySpiral) {
                window.MapSFX.spawnGalaxySpiral(x, y, 1);
            }
        });

        document.getElementById('debug-fx-samurai')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSamuraiSlash) {
                window.MapSFX.spawnSamuraiSlash(x, y, 1);
            }
        });

        document.getElementById('debug-fx-supernova')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSupernova) {
                window.MapSFX.spawnSupernova(x, y, 1);
            }
        });

        document.getElementById('debug-fx-vampire')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnVampireBite) {
                window.MapSFX.spawnVampireBite(x, y, 1);
            }
        });

        document.getElementById('debug-fx-storm')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnLightningStorm) {
                window.MapSFX.spawnLightningStorm(x, y, 1);
            }
        });

        document.getElementById('debug-fx-rift')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDimensionRift) {
                window.MapSFX.spawnDimensionRift(x, y, 1);
            }
        });

        document.getElementById('debug-fx-atomic')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnAtomicBlast) {
                window.MapSFX.spawnAtomicBlast(x, y, 1);
            }
        });

        document.getElementById('debug-fx-angel')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnAngelWings) {
                window.MapSFX.spawnAngelWings(x, y, 1);
            }
        });

        document.getElementById('debug-fx-demon')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDemonSummon) {
                window.MapSFX.spawnDemonSummon(x, y, 1);
            }
        });

        document.getElementById('debug-fx-gravity')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnGravityCrush) {
                window.MapSFX.spawnGravityCrush(x, y, 1);
            }
        });

        // Efeitos de cair o queixo batch 2 (10 efeitos)
        document.getElementById('debug-fx-crystal')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnCrystalPrison) {
                window.MapSFX.spawnCrystalPrison(x, y, 1);
            }
        });

        document.getElementById('debug-fx-reaper')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSoulReaper) {
                window.MapSFX.spawnSoulReaper(x, y, 1);
            }
        });

        document.getElementById('debug-fx-elemental')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnElementalFury) {
                window.MapSFX.spawnElementalFury(x, y, 1);
            }
        });

        document.getElementById('debug-fx-spiritbomb')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnSpiritBomb) {
                window.MapSFX.spawnSpiritBomb(x, y, 1);
            }
        });

        document.getElementById('debug-fx-bloodmoon')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnBloodMoon) {
                window.MapSFX.spawnBloodMoon(x, y, 1);
            }
        });

        document.getElementById('debug-fx-thundergod')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnThunderGod) {
                window.MapSFX.spawnThunderGod(x, y, 1);
            }
        });

        document.getElementById('debug-fx-voidcollapse')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnVoidCollapse) {
                window.MapSFX.spawnVoidCollapse(x, y, 1);
            }
        });

        document.getElementById('debug-fx-infernotornado')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnInfernoTornado) {
                window.MapSFX.spawnInfernoTornado(x, y, 1);
            }
        });

        document.getElementById('debug-fx-divinejudgment')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDivineJudgment) {
                window.MapSFX.spawnDivineJudgment(x, y, 1);
            }
        });

        document.getElementById('debug-fx-deathmark')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX && window.MapSFX.spawnDeathMark) {
                window.MapSFX.spawnDeathMark(x, y, 1);
            }
        });

        // === ARCHER SKILL EFFECT HANDLERS ===
        document.getElementById('debug-archer-quickshot-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerQuickShotCast) window.MapSFX.archerQuickShotCast(x, y);
        });
        document.getElementById('debug-archer-quickshot-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerQuickShotImpact) window.MapSFX.archerQuickShotImpact(x, y);
        });
        document.getElementById('debug-archer-poison-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerPoisonArrowCast) window.MapSFX.archerPoisonArrowCast(x, y);
        });
        document.getElementById('debug-archer-poison-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerPoisonArrowImpact) window.MapSFX.archerPoisonArrowImpact(x, y);
        });
        document.getElementById('debug-archer-focused-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerFocusedShotCast) window.MapSFX.archerFocusedShotCast(x, y);
        });
        document.getElementById('debug-archer-focused-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerFocusedShotImpact) window.MapSFX.archerFocusedShotImpact(x, y);
        });
        document.getElementById('debug-archer-piercing-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerPiercingArrowCast) window.MapSFX.archerPiercingArrowCast(x, y);
        });
        document.getElementById('debug-archer-piercing-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerPiercingArrowImpact) window.MapSFX.archerPiercingArrowImpact(x, y, 0);
        });
        document.getElementById('debug-archer-multishot-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerMultishotCast) window.MapSFX.archerMultishotCast(x, y);
        });
        document.getElementById('debug-archer-multishot-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerMultishotImpact) window.MapSFX.archerMultishotImpact(x, y);
        });
        document.getElementById('debug-archer-huntersfocus')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerHuntersFocusCast) window.MapSFX.archerHuntersFocusCast(x, y);
        });
        document.getElementById('debug-archer-tactical-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerTacticalRetreatCast) window.MapSFX.archerTacticalRetreatCast(x, y);
        });
        document.getElementById('debug-archer-tactical-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerTacticalRetreatImpact) window.MapSFX.archerTacticalRetreatImpact(x, y);
        });
        document.getElementById('debug-archer-rain-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerRainOfArrowsCast) window.MapSFX.archerRainOfArrowsCast(x, y);
        });
        document.getElementById('debug-archer-rain-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerRainOfArrowsImpact) window.MapSFX.archerRainOfArrowsImpact(x, y);
        });
        document.getElementById('debug-archer-cripple-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerCripplingShotCast) window.MapSFX.archerCripplingShotCast(x, y);
        });
        document.getElementById('debug-archer-cripple-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerCripplingShotImpact) window.MapSFX.archerCripplingShotImpact(x, y);
        });
        document.getElementById('debug-archer-deadly-cast')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerDeadlyAimCast) window.MapSFX.archerDeadlyAimCast(x, y);
        });
        document.getElementById('debug-archer-deadly-impact')?.addEventListener('click', () => {
            if (!debugSelectedUnit || !mapEngineRef) return;
            const x = (debugSelectedUnit.x - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            const y = (debugSelectedUnit.y - 0.5) * mapEngineRef.CONFIG.CELL_SIZE;
            if (window.MapSFX?.archerDeadlyAimImpact) window.MapSFX.archerDeadlyAimImpact(x, y);
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

        // === FREE CONTROL (TESTING) ===
        updateFreeControlDropdown();
        document.getElementById('debug-free-control')?.addEventListener('change', (e) => {
            const v = e.target.value;
            if (!mapEngineRef) return;
            if (v === 'off') {
                if (mapEngineRef.deactivateFreeControl) mapEngineRef.deactivateFreeControl();
                else if (mapEngineRef.gameState) {
                    mapEngineRef.gameState.debugFreeControl = false;
                    mapEngineRef.gameState.debugControlEnemy = false;
                    if (mapEngineRef.deselectUnit) mapEngineRef.deselectUnit(true);
                }
                if (mapEngineRef.triggerRender) mapEngineRef.triggerRender();
                return;
            }
            const parts = v.split(':');
            const kind = parts[0];
            const id = parts[1];
            if (!id) return;
            if (kind === 'player') {
                const unit = (mapEngineRef.playerUnits && mapEngineRef.playerUnits()).find(u => String(u.id) === String(id));
                if (!unit || unit.hp <= 0) return;
                if (mapEngineRef.activateFreeControl) mapEngineRef.activateFreeControl(unit);
                else {
                    if (mapEngineRef.gameState) {
                        mapEngineRef.gameState.debugFreeControl = true;
                        mapEngineRef.gameState.debugControlEnemy = false;
                        if (mapEngineRef.gameState.unitsActedThisTurn) mapEngineRef.gameState.unitsActedThisTurn.delete(unit.id);
                    }
                    if (mapEngineRef.selectUnit) mapEngineRef.selectUnit(unit);
                }
            } else if (kind === 'enemy') {
                if (mapEngineRef.gameState && mapEngineRef.gameState.phase !== 'player') {
                    console.warn('[MAP-DEBUG] Controle de inimigo só na fase do jogador.');
                    return;
                }
                const unit = (mapEngineRef.enemyUnits && mapEngineRef.enemyUnits()).find(u => String(u.id) === String(id));
                if (!unit || unit.hp <= 0) return;
                if (mapEngineRef.activateFreeControl) mapEngineRef.activateFreeControl(unit);
                else {
                    if (mapEngineRef.gameState) {
                        mapEngineRef.gameState.debugControlEnemy = true;
                        mapEngineRef.gameState.debugFreeControl = false;
                    }
                    if (mapEngineRef.selectUnit) mapEngineRef.selectUnit(unit);
                }
            }
            if (mapEngineRef.triggerRender) mapEngineRef.triggerRender();
        });

        // Atualizar contador de paredes inicialmente
        setTimeout(updateWallsCount, 500);
    }

    /**
     * Setup dos botões de Buffs e Status Effects
     */
    function setupBuffButtons() {
        // Definições de buffs disponíveis
        const buffDefinitions = {
            'berserker': {
                id: 'berserker_mode',
                name: 'Berserker Mode',
                icon: 'flame',
                damageDealt: 2.0, // +100% Damage
                damageTaken: 1.5, // +50% Damage Taken
                duration: 3
            },
            'defense': {
                id: 'defensive_wall',
                name: 'Defensive Wall',
                icon: 'shield',
                damageTaken: 0.5, // -50% Damage Taken
                duration: 2
            },
            'focus': {
                id: 'battle_focus',
                name: 'Battle Focus',
                icon: 'crosshair',
                stats: { str: 20, dex: 15 },
                damageDealt: 1.5,
                duration: 3
            },
            'evasion': {
                id: 'evasive_step',
                name: 'Evasive Step',
                icon: 'wind',
                stats: { agi: 20 },
                flee: 50,
                duration: 2
            },
            'stone': {
                id: 'stone_skin',
                name: 'Stone Skin',
                icon: 'shield-check',
                stats: { vit: 5 },
                damageTaken: 0.8,
                duration: 3
            },
            'regen': {
                id: 'regeneration',
                name: 'Regeneration',
                icon: 'heart-pulse',
                hpRegen: 0.10,  // 10% HP per turn
                duration: 3
            },
            'haste': {
                id: 'haste',
                name: 'Haste',
                icon: 'zap',
                stats: { agi: 15 },
                aspd: 30,
                duration: 2
            },
            'crit': {
                id: 'critical_boost',
                name: 'Critical Boost',
                icon: 'star',
                critBonus: 30,
                duration: 3
            }
        };

        // Status Effects (debuffs/DoT)
        const statusDefinitions = {
            'poison': {
                id: 'poison',
                name: 'Poison',
                icon: 'skull',
                dotDamage: 0.05,  // 5% HP per turn
                duration: 3
            },
            'bleed': {
                id: 'bleed',
                name: 'Bleeding',
                icon: 'droplet',
                dotDamage: 0.08,  // 8% HP per turn
                duration: 2
            },
            'stun': {
                id: 'stun',
                name: 'Stunned',
                icon: 'circle-off',
                skipTurn: true,
                duration: 1
            },
            'burn': {
                id: 'burn',
                name: 'Burning',
                icon: 'flame',
                dotDamage: 0.06,  // 6% HP per turn
                duration: 2
            },
            'slow': {
                id: 'slow',
                name: 'Slowed',
                icon: 'hourglass',
                stats: { agi: -10 },
                aspd: -30,
                duration: 2
            }
        };

        // Handler genérico para aplicar buff
        function applyBuffToUnit(buffData) {
            if (!debugSelectedUnit) {
                console.warn('[MAP-DEBUG] Nenhuma unidade selecionada');
                return;
            }

            if (!window.TacticalSkillEngine) {
                console.warn('[MAP-DEBUG] TacticalSkillEngine não disponível');
                console.warn('[MAP-DEBUG] No unit selected');
                return;
            }

            if (!window.TacticalSkillEngine) {
                console.warn('[MAP-DEBUG] TacticalSkillEngine not available');
                return;
            }

            // Aplicar buff usando TacticalSkillEngine
            window.TacticalSkillEngine.applyBuff(debugSelectedUnit, buffData, { name: 'Debug' }, buffData.id);
            console.log(`[MAP-DEBUG] Buff '${buffData.name}' applied to ${debugSelectedUnit.name}`);

            // Atualizar UI
            updateTacticalHUDIfNeeded();
            triggerRender();
        }

        // Handler para aplicar status effect (debuff)
        function applyStatusToUnit(statusData) {
            if (!debugSelectedUnit) {
                console.warn('[MAP-DEBUG] No unit selected');
                return;
            }

            if (!window.TacticalSkillEngine) {
                console.warn('[MAP-DEBUG] TacticalSkillEngine not available');
                return;
            }

            // Aplicar debuff usando TacticalSkillEngine
            window.TacticalSkillEngine.applyDebuff(debugSelectedUnit, statusData, { name: 'Debug' }, statusData.id);
            console.log(`[MAP-DEBUG] Status '${statusData.name}' applied to ${debugSelectedUnit.name}`);

            // Atualizar UI
            updateTacticalHUDIfNeeded();
            triggerRender();
        }

        // Conectar botões de buffs
        Object.entries(buffDefinitions).forEach(([key, buffData]) => {
            document.getElementById(`debug-buff-${key}`)?.addEventListener('click', () => {
                applyBuffToUnit(buffData);
            });
        });

        // Conectar botões de status effects
        Object.entries(statusDefinitions).forEach(([key, statusData]) => {
            document.getElementById(`debug-status-${key}`)?.addEventListener('click', () => {
                applyStatusToUnit(statusData);
            });
        });

        // Botão limpar todos
        document.getElementById('debug-status-clear')?.addEventListener('click', () => {
            if (!debugSelectedUnit) {
                console.warn('[MAP-DEBUG] No unit selected');
                return;
            }

            debugSelectedUnit.activeBuffs = [];
            debugSelectedUnit.activeDebuffs = [];
            debugSelectedUnit.statusEffects = [];

            // Recalcular stats
            if (window.TacticalSkillEngine?.recalculateStats) {
                window.TacticalSkillEngine.recalculateStats(debugSelectedUnit);
            }

            console.log(`[MAP-DEBUG] All buffs/debuffs cleared from ${debugSelectedUnit.name}`);
            updateTacticalHUDIfNeeded();
            triggerRender();
        });
    }

    function applyLevel() {
        if (!debugSelectedUnit) return;

        const before = snapshotStats(debugSelectedUnit);
        const level = parseInt(document.getElementById('debug-level-slider')?.value || '1');
        debugSelectedUnit.level = level;

        if (mapEngineRef && typeof mapEngineRef.applySkillEngineStats === 'function') {
            mapEngineRef.applySkillEngineStats([debugSelectedUnit]);
        } else if (debugSelectedUnit.attributes && window.TacticalSkillEngine?.calculateStatsFromAttributes) {
            const stats = window.TacticalSkillEngine.calculateStatsFromAttributes(level, debugSelectedUnit.attributes);
            debugSelectedUnit.attack = stats.atk;
            debugSelectedUnit.matk = stats.matk;
            debugSelectedUnit.attackRanged = stats.atkRanged;
            debugSelectedUnit.defense = stats.softDef;
            debugSelectedUnit.mdef = stats.mdef;
            debugSelectedUnit.maxHp = stats.maxHp;
            debugSelectedUnit.hp = Math.min(debugSelectedUnit.hp || stats.maxHp, stats.maxHp);
            debugSelectedUnit.maxSp = stats.maxMana;
            debugSelectedUnit.maxMana = stats.maxMana;
            debugSelectedUnit.sp = Math.min(debugSelectedUnit.sp ?? stats.maxMana, stats.maxMana);
        }

        updateStatsDisplay();
        showStatsDiff(before, debugSelectedUnit);
        updateTacticalHUDIfNeeded();
        triggerRender();
    }

    function applyAttributes() {
        if (!debugSelectedUnit) return;

        const get = (id) => Math.max(1, Math.min(999, parseInt(document.getElementById(id)?.value, 10) || 1));
        debugSelectedUnit.attributes = {
            str: get('debug-attr-str'),
            agi: get('debug-attr-agi'),
            vit: get('debug-attr-vit'),
            int: get('debug-attr-int'),
            dex: get('debug-attr-dex'),
            luk: get('debug-attr-luk')
        };
        // recalculateStats usa baseAttributes; ao editar a ficha no debug, sincronizar para o novo cálculo (maxHp, flee, aspd, etc.) refletir VIT/INT/AGI/etc.
        debugSelectedUnit.baseAttributes = { ...debugSelectedUnit.attributes };

        const before = snapshotStats(debugSelectedUnit);

        if (mapEngineRef && typeof mapEngineRef.applySkillEngineStats === 'function') {
            mapEngineRef.applySkillEngineStats([debugSelectedUnit]);
        } else if (window.TacticalSkillEngine && window.TacticalSkillEngine.calculateStatsFromAttributes) {
            const level = debugSelectedUnit.level || 1;
            const stats = window.TacticalSkillEngine.calculateStatsFromAttributes(level, debugSelectedUnit.attributes);
            debugSelectedUnit.attack = stats.atk;
            debugSelectedUnit.matk = stats.matk;
            debugSelectedUnit.attackRanged = stats.atkRanged;
            debugSelectedUnit.defense = stats.softDef;
            debugSelectedUnit.mdef = stats.mdef;
            debugSelectedUnit.maxHp = stats.maxHp;
            debugSelectedUnit.hp = Math.min(debugSelectedUnit.hp || stats.maxHp, stats.maxHp);
            debugSelectedUnit.maxSp = stats.maxMana;
            debugSelectedUnit.maxMana = stats.maxMana;
            debugSelectedUnit.sp = Math.min(debugSelectedUnit.sp ?? stats.maxMana, stats.maxMana);
        }

        updateStatsDisplay();
        showStatsDiff(before, debugSelectedUnit);
        updateTacticalHUDIfNeeded();
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

        // Atualizar botão Inspect Status
        const inspectBtn = document.getElementById('debug-inspect-status');
        if (inspectBtn) {
            if (debugSelectedUnit) {
                inspectBtn.disabled = false;
                inspectBtn.style.opacity = '1';
                inspectBtn.style.pointerEvents = 'auto';
            } else {
                inspectBtn.disabled = true;
                inspectBtn.style.opacity = '0.5';
                inspectBtn.style.pointerEvents = 'none';
            }
        }

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

            // Atributos (ficha)
            const attrs = unit.attributes || unit.baseAttributes || {};
            ['str', 'agi', 'vit', 'int', 'dex', 'luk'].forEach(key => {
                const el = document.getElementById('debug-attr-' + key);
                if (el) el.value = Math.max(1, Math.min(999, parseInt(attrs[key], 10) || 1));
            });

            updateStatsDisplay();
        } else {
            unitDiv.textContent = 'Clique em uma unidade';
            unitDiv.style.color = '#888';
            ['debug-stat-atk','debug-stat-atkRanged','debug-stat-matk','debug-stat-def','debug-stat-mdef','debug-stat-hp','debug-stat-mp'].forEach(id => {
                const e = document.getElementById(id); if (e) e.textContent = '--';
            });
            const d = document.getElementById('debug-stats-diff'); if (d) d.textContent = '';

            // Desabilitar botão Inspect Status quando não há unidade
            const inspectBtn = document.getElementById('debug-inspect-status');
            if (inspectBtn) {
                inspectBtn.disabled = true;
                inspectBtn.style.opacity = '0.5';
                inspectBtn.style.pointerEvents = 'none';
            }
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
                forceAnimation: debugAnimationState !== null && debugAnimationState !== ''
                    ? debugAnimationState
                    : (unit.forceAnimation !== undefined ? unit.forceAnimation : 'idle')
            };
            configTextarea.value = JSON.stringify(config, null, 2);
        } else {
            // Retrocompatibilidade: mostrar propriedades globais
            const config = {
                animationFPS: unit.debugFPS !== undefined ? unit.debugFPS : (unit.animationFPS !== undefined ? unit.animationFPS : debugFPS),
                animationScale: unit.debugScale !== undefined ? unit.debugScale : (unit.animationScale !== undefined ? unit.animationScale : debugScale),
                animationOffsetX: unit.debugOffsetX !== undefined ? unit.debugOffsetX : (unit.animationOffsetX !== undefined ? unit.animationOffsetX : debugOffsetX),
                animationOffsetY: unit.debugOffsetY !== undefined ? unit.debugOffsetY : (unit.animationOffsetY !== undefined ? unit.animationOffsetY : debugOffsetY),
                forceAnimation: debugAnimationState !== null && debugAnimationState !== ''
                    ? debugAnimationState
                    : (unit.forceAnimation !== undefined ? unit.forceAnimation : 'idle')
            };
            configTextarea.value = JSON.stringify(config, null, 2);
        }
    }

    function updateStatsDisplay() {
        if (!debugSelectedUnit) return;
        const u = debugSelectedUnit;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = (v != null && v !== '') ? v : '--'; };
        set('debug-stat-atk', u.attack);
        set('debug-stat-atkRanged', u.attackRanged);
        set('debug-stat-matk', u.matk);
        set('debug-stat-def', u.defense);
        set('debug-stat-mdef', u.mdef);
        set('debug-stat-hp', u.maxHp);
        set('debug-stat-mp', u.maxSp ?? u.maxMana);
    }

    function snapshotStats(unit) {
        if (!unit) return null;
        return {
            atk: unit.attack,
            atkRanged: unit.attackRanged,
            matk: unit.matk,
            def: unit.defense,
            mdef: unit.mdef,
            maxHp: unit.maxHp,
            maxSp: unit.maxSp ?? unit.maxMana
        };
    }

    function showStatsDiff(before, unit) {
        const el = document.getElementById('debug-stats-diff');
        if (!el || !before || !unit) return;
        const a = (name, b, a2) => (a2 != null && b != null && a2 !== b) ? (a2 > b ? `↑${name} +${a2 - b}` : `↓${name} ${a2 - b}`) : null;
        const parts = [
            a('ATK', before.atk, unit.attack),
            a('ATKRng', before.atkRanged, unit.attackRanged),
            a('MATK', before.matk, unit.matk),
            a('DEF', before.def, unit.defense),
            a('MDEF', before.mdef, unit.mdef),
            a('HP', before.maxHp, unit.maxHp),
            a('MP', before.maxSp, unit.maxSp ?? unit.maxMana)
        ].filter(Boolean);
        el.textContent = parts.length ? parts.join('  ') : '';
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

    /**
     * Inspect status completo de uma unidade (similar ao combat-system.js)
     * @param {Object} unit - Unidade para inspecionar
     */
    function inspectStatus(unit) {
        if (!unit) {
            console.warn('[MAP-DEBUG] No unit selected for inspection');
            return;
        }

        console.group("%c 🛡️ COMBAT STATS INSPECTOR ", "background: #111; color: #fbbf24; font-size: 14px; font-weight: bold; padding: 4px; border-radius: 4px;");

        const label = unit.type === 'player' ? 'PLAYER' : 'ENEMY';
        const name = unit.name || 'Unknown';
        const level = unit.level || unit.baseLevel || 1;
        const element = unit.element || 'neutral';

        console.group(`%c ${label}: ${name} (Lv${level}) [${element}] `, "background: #222; color: #fff; font-weight: bold;");

        // 1. Equipment Breakdown (se houver)
        console.group("📦 Equipment");
        if (unit.equipment) {
            const equipTable = {};
            Object.entries(unit.equipment).forEach(([slot, itemId]) => {
                if (itemId) {
                    const item = window.itemsData?.[itemId];
                    equipTable[slot.toUpperCase()] = {
                        Item: item?.name || itemId,
                        Element: item?.elementOverride || 'Neutral',
                        Stats: item?.stats ? JSON.stringify(item.stats) : 'None'
                    };
                } else {
                    equipTable[slot.toUpperCase()] = { Item: 'Empty', Element: '-', Stats: '-' };
                }
            });
            console.table(equipTable);
        } else {
            console.log("No equipment system active for this entity.");
        }
        console.groupEnd();

        // 2. Attributes Breakdown (Base + Buffs)
        console.group("📊 Attributes (Base + Buffs)");
        const attrTable = {};
        // Debug: Log para verificar o que está disponível
        console.log(`[MAP-DEBUG] inspectStatus para ${unit.name}:`, {
            hasAttributes: !!unit.attributes,
            hasBaseAttributes: !!unit.baseAttributes,
            hasCurrentAttributes: !!unit.currentAttributes,
            attributes: unit.attributes,
            baseAttributes: unit.baseAttributes,
            currentAttributes: unit.currentAttributes,
            combatKey: unit.combatKey || unit.combat_key
        });

        const baseAttr = unit.baseAttributes || unit.attributes || {};
        const curAttr = unit.currentAttributes || unit.attributes || {};

        // Calcular modificadores de buffs para cada atributo
        const buffModifiers = {};
        ['str', 'agi', 'vit', 'int', 'dex', 'luk'].forEach(attr => {
            buffModifiers[attr] = 0;
        });

        if (unit.activeBuffs && Array.isArray(unit.activeBuffs)) {
            unit.activeBuffs.forEach(buff => {
                const data = buff.data || {};
                if (data.stats) {
                    Object.keys(data.stats).forEach(stat => {
                        const statLower = stat.toLowerCase();
                        if (['str', 'agi', 'vit', 'int', 'dex', 'luk'].includes(statLower)) {
                            buffModifiers[statLower] = (buffModifiers[statLower] || 0) + (data.stats[stat] || 0);
                        }
                    });
                }
            });
        }

        if (unit.activeDebuffs && Array.isArray(unit.activeDebuffs)) {
            unit.activeDebuffs.forEach(debuff => {
                const data = debuff.data || {};
                if (data.stats) {
                    Object.keys(data.stats).forEach(stat => {
                        const statLower = stat.toLowerCase();
                        if (['str', 'agi', 'vit', 'int', 'dex', 'luk'].includes(statLower)) {
                            buffModifiers[statLower] = (buffModifiers[statLower] || 0) + (data.stats[stat] || 0);
                        }
                    });
                }
            });
        }

        ['str', 'agi', 'vit', 'int', 'dex', 'luk'].forEach(k => {
            const base = baseAttr[k] || 0;
            const total = curAttr[k] || 0;
            const buff = buffModifiers[k] || 0;

            attrTable[k.toUpperCase()] = {
                Base: base,
                Buff: (buff >= 0 ? '+' : '') + buff,
                TOTAL: total
            };
        });
        console.table(attrTable);
        console.groupEnd();

        // 3. Combat Derived Stats
        console.group("⚔️ Combat Stats");
        const combatStats = {
            atk: unit.stats?.atk || 0,
            matk: unit.stats?.matk || 0,
            def: unit.stats?.def || 0,
            mdef: unit.stats?.mdef || 0,
            hit: unit.stats?.hit || 0,
            flee: unit.stats?.flee || 0,
            crit: unit.stats?.crit || 0,
            aspd: unit.stats?.aspd || 0,
            maxHp: unit.maxHp || 0,
            maxMana: unit.maxMana || unit.maxSp || 0,
            hp: unit.hp || 0,
            mana: unit.mana || unit.sp || 0
        };
        console.table(combatStats);
        console.groupEnd();

        // 4. Active Effects (Buffs/Debuffs/Status)
        if (window.TacticalSkillEngine) {
            const effects = window.TacticalSkillEngine.getActiveBuffsForDisplay(unit);
            if (effects.length > 0) {
                console.group("🔮 Active Effects");
                effects.forEach(effect => {
                    const effectData = window.effectsData?.[effect.data?.id];
                    if (effectData) {
                        const color = effect.type === 'buff' ? '#22c55e' : effect.type === 'debuff' ? '#ef4444' : '#fbbf24';
                        console.log(`%c ${effectData.name} (${effect.duration} turn${effect.duration !== 1 ? 's' : ''})`,
                            `color: ${color}; font-weight: bold;`);
                        console.log(`   ${effectData.desc || 'No description'}`);

                        // Mostrar modificadores específicos se houver
                        const data = effect.data || {};
                        const modifiers = [];
                        if (data.atkBonus !== undefined) {
                            modifiers.push(`ATK ${data.atkBonus >= 0 ? '+' : ''}${Math.round(data.atkBonus * 100)}%`);
                        }
                        if (data.defPenalty !== undefined) {
                            modifiers.push(`DEF ${data.defPenalty >= 0 ? '+' : ''}${Math.round(data.defPenalty * 100)}%`);
                        }
                        if (data.damageDealt !== undefined && data.damageDealt !== 1) {
                            modifiers.push(`Dano Causado ${data.damageDealt >= 1 ? '+' : ''}${Math.round((data.damageDealt - 1) * 100)}%`);
                        }
                        if (data.damageTaken !== undefined && data.damageTaken !== 1) {
                            modifiers.push(`Dano Recebido ${data.damageTaken >= 1 ? '+' : ''}${Math.round((data.damageTaken - 1) * 100)}%`);
                        }
                        if (modifiers.length > 0) {
                            console.log(`   Modificadores: ${modifiers.join(', ')}`);
                        }
                    } else {
                        // Fallback se não encontrar em effectsData
                        console.log(`%c ${effect.data?.id || 'Unknown'} (${effect.duration} turn${effect.duration !== 1 ? 's' : ''})`,
                            `color: #888; font-weight: bold;`);
                    }
                });
                console.groupEnd();
            } else {
                console.log("No active effects.");
            }
        } else {
            console.log("TacticalSkillEngine not available.");
        }

        console.groupEnd(); // Label
        console.groupEnd(); // Título principal
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
        isEnabled: isDebugEnabled,
        inspectStatus
    };

    console.log('[MAP-DEBUG] Módulo carregado');
})();

