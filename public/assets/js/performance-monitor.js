/**
 * Menu de Otimização / Performance Monitor
 * Mostra FPS, tempo de frame, memória, e o que mais consome recursos em tempo real.
 * Útil para identificar gargalos antes de otimizar.
 */
(function () {
    'use strict';

    // Objeto global que o map-engine preenche a cada frame (baixo custo quando fechado)
    window.__rpgPerf = window.__rpgPerf || {};
    // Flags para desligar partes do render e isolar gargalo (marque = desliga)
    if (!window.__rpgPerf.skip) {
        window.__rpgPerf.skip = {
            particles: false, minimap: false, floatingTexts: false,
            unitBars: false, mapFilter: false, highlights: false, rulers: false,
            sprites: false, map: false
        };
    }

    let panel = null;
    let isOpen = false;
    let updateInterval = null;
    let frameTimeHistory = [];
    const HISTORY_LEN = 60;

    function formatBytes(n) {
        if (n == null || isNaN(n)) return '—';
        if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MB';
        if (n >= 1e3) return (n / 1e3).toFixed(2) + ' KB';
        return n + ' B';
    }

    function getMemoryInfo() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    function buildPanelHTML() {
        return `
            <div id="perf-panel" class="perf-panel" style="display:none;">
                <div class="perf-panel-header">
                    <span class="perf-panel-title">Otimização</span>
                    <button id="perf-panel-close" class="perf-panel-close" aria-label="Fechar">×</button>
                </div>
                <div class="perf-panel-body">
                    <section class="perf-section">
                        <h4>Rendering</h4>
                        <div class="perf-row">
                            <span>FPS</span>
                            <strong id="perf-fps" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Frame (ms)</span>
                            <strong id="perf-framems" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row perf-spark" title="Histórico do tempo de frame (últimos ~1s)">
                            <span>Frame time</span>
                            <canvas id="perf-sparkline" width="120" height="28"></canvas>
                        </div>
                    </section>
                    <section class="perf-section">
                        <h4>Memória (JS Heap)</h4>
                        <div class="perf-row">
                            <span>Usada</span>
                            <strong id="perf-mem-used" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Total</span>
                            <strong id="perf-mem-total" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Imagens (est.)</span>
                            <strong id="perf-img-mem" class="perf-value">—</strong>
                        </div>
                    </section>
                    <section class="perf-section">
                        <h4>O que mais pesa</h4>
                        <div class="perf-row">
                            <span>Imagens (loadedImages)</span>
                            <strong id="perf-imgs" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Sprites em cache (entidades)</span>
                            <strong id="perf-sprite-ents" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Frames de animação (sprite)</span>
                            <strong id="perf-sprite-frames" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Partículas</span>
                            <strong id="perf-particles" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Floating texts</span>
                            <strong id="perf-float" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Unidades (vivas)</span>
                            <strong id="perf-units" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row">
                            <span>Células highlight</span>
                            <strong id="perf-cells" class="perf-value">—</strong>
                        </div>
                        <div class="perf-row" title="Contador do game loop: +1 a cada frame. Sobe sempre (comportamento esperado). Útil para debug.">
                            <span>Frames (total)</span>
                            <strong id="perf-animframe" class="perf-value">—</strong>
                        </div>
                    </section>
                    <section class="perf-section perf-debug">
                        <h4>Debug de gargalo</h4>
                        <p class="perf-debug-hint">Marque para desligar e ver impacto no FPS. Teste em tela cheia.</p>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-particles" data-skip="particles"><span>Partículas</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-minimap" data-skip="minimap"><span>Minimapa</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-floatingTexts" data-skip="floatingTexts"><span>Floating texts</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-unitBars" data-skip="unitBars"><span>Barras HP/MP</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-mapFilter" data-skip="mapFilter"><span>Filtro mapa (foco)</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-highlights" data-skip="highlights"><span>Highlights (alcance/ataque/skill)</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-rulers" data-skip="rulers"><span>Réguas</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-sprites" data-skip="sprites"><span>Sprites (unidades)</span></label>
                        <label class="perf-check"><input type="checkbox" id="perf-skip-map" data-skip="map"><span>Mapa (imagem)</span></label>
                    </section>
                    <section class="perf-section perf-tips">
                        <h4>Dicas</h4>
                        <p>• FPS &lt; 30 ou frame &gt; 33 ms → gargalo em CPU/GPU ou desenho.</p>
                        <p>• Muitos frames de sprite ou imagens → reduzir resolução/quantidade.</p>
                        <p>• Partículas e floating texts em excesso → limitar ou pool.</p>
                        <p>• Células highlight (alcance/ataque) → desenho pesado se grade grande.</p>
                        <p>• <strong>Frames (total)</strong>: contador do game loop (+1 por frame). Sobe sempre — é normal.</p>
                    </section>
                </div>
            </div>
        `;
    }

    function drawSparkline(canvasId, values, color) {
        const el = document.getElementById(canvasId);
        if (!el || !values.length) return;
        const ctx = el.getContext('2d');
        const w = el.width;
        const h = el.height;
        ctx.clearRect(0, 0, w, h);
        const max = Math.max(1, ...values);
        const step = w / Math.max(1, values.length - 1);
        ctx.strokeStyle = color || 'rgba(34, 197, 94, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        values.forEach((v, i) => {
            const x = i * step;
            const y = h - (v / max) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    function updatePanel() {
        if (!panel || !isOpen) return;
        const p = window.__rpgPerf || {};

        const fpsEl = document.getElementById('perf-fps');
        const framemsEl = document.getElementById('perf-framems');
        if (fpsEl) fpsEl.textContent = p.fps != null ? String(Math.round(p.fps)) : '—';
        if (framemsEl) framemsEl.textContent = p.frameTimeMs != null ? p.frameTimeMs.toFixed(2) + ' ms' : '—';

        // Sparkline: manter histórico e desenhar
        if (p.frameTimeMs != null && !isNaN(p.frameTimeMs)) {
            frameTimeHistory.push(p.frameTimeMs);
            if (frameTimeHistory.length > HISTORY_LEN) frameTimeHistory.shift();
        }
        drawSparkline('perf-sparkline', frameTimeHistory, frameTimeHistory.length && frameTimeHistory[frameTimeHistory.length - 1] > 33 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)');

        const mem = getMemoryInfo();
        const usedEl = document.getElementById('perf-mem-used');
        const totalEl = document.getElementById('perf-mem-total');
        if (usedEl) usedEl.textContent = mem ? formatBytes(mem.used) : 'N/D (só Chrome)';
        if (totalEl) totalEl.textContent = mem ? formatBytes(mem.total) : '—';

        const imgMemEl = document.getElementById('perf-img-mem');
        if (imgMemEl) imgMemEl.textContent = p.loadedImagesApproxBytes != null ? formatBytes(p.loadedImagesApproxBytes) : '—';

        const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val != null ? String(val) : '—'; };
        set('perf-imgs', p.loadedImagesCount);
        set('perf-sprite-ents', p.spriteCacheSize);
        set('perf-sprite-frames', p.spriteCacheFrames);
        set('perf-particles', p.particles);
        set('perf-float', p.floatingTexts);
        set('perf-units', p.units);
        set('perf-cells', p.highlightCells);
        set('perf-animframe', p.animationFrame);
    }

    function tickFps() {
        const p = window.__rpgPerf || {};
        const count = p.frameCount != null ? p.frameCount : 0;
        if (typeof p.frameCount === 'number') p.frameCount = 0;
        p.fps = count;
    }

    function openPanel() {
        if (!panel) return;
        panel.style.display = 'block';
        isOpen = true;
        if (!updateInterval) {
            updateInterval = setInterval(updatePanel, 150);
        }
        updatePanel();
    }

    function closePanel() {
        if (!panel) return;
        panel.style.display = 'none';
        isOpen = false;
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function togglePanel() {
        isOpen ? closePanel() : openPanel();
    }

    function injectButton() {
        const ac = document.querySelector('.audio-controls');
        if (!ac) return;
        const btn = document.createElement('button');
        btn.id = 'btn-perf';
        btn.className = 'audio-btn perf-btn';
        btn.title = 'Menu de Otimização (FPS, memória, gargalos)';
        btn.setAttribute('aria-label', 'Abrir menu de otimização');
        btn.innerHTML = '<i data-lucide="gauge"></i>';
        btn.addEventListener('click', togglePanel);
        ac.appendChild(btn);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function init() {
        const style = document.createElement('style');
        style.textContent = `
            .perf-btn { }
            .perf-panel {
                position: fixed;
                top: 80px;
                right: 16px;
                width: 320px;
                max-height: 85vh;
                overflow: auto;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 30, 0.99));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                z-index: 2000;
                font-family: 'Outfit','Inter',sans-serif;
                font-size: 13px;
                color: #e2e8f0;
            }
            .perf-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 18px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            .perf-panel-title { font-weight: 800; font-size: 14px; letter-spacing: 0.04em; color: #f8fafc; }
            .perf-panel-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 22px;
                line-height: 1;
                cursor: pointer;
                padding: 0 4px;
                border-radius: 6px;
            }
            .perf-panel-close:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
            .perf-panel-body { padding: 12px 18px 18px; }
            .perf-section { margin-bottom: 16px; }
            .perf-section h4 {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: #94a3b8;
                margin-bottom: 10px;
                padding-bottom: 6px;
                border-bottom: 1px solid rgba(255,255,255,0.06);
            }
            .perf-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                gap: 12px;
            }
            .perf-row span { color: #cbd5e1; }
            .perf-value { color: #f8fafc; font-variant-numeric: tabular-nums; }
            .perf-spark canvas { display: block; }
            .perf-tips p { font-size: 11px; color: #64748b; margin: 6px 0 0; line-height: 1.45; }
            .perf-debug-hint { font-size: 11px; color: #94a3b8; margin: 0 0 10px; line-height: 1.4; }
            .perf-check { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; font-size: 12px; color: #cbd5e1; }
            .perf-check input { width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; }
        `;
        document.head.appendChild(style);

        const wrap = document.createElement('div');
        wrap.innerHTML = buildPanelHTML();
        panel = wrap.firstElementChild;
        document.body.appendChild(panel);

        document.getElementById('perf-panel-close')?.addEventListener('click', closePanel);

        // Debug de gargalo: sync checkboxes com __rpgPerf.skip e handlers
        (function bindSkipToggles() {
            const s = window.__rpgPerf.skip;
            if (!s) return;
            Object.keys(s).forEach(function (k) {
                const el = document.getElementById('perf-skip-' + k);
                if (!el) return;
                el.checked = !!s[k];
                el.addEventListener('change', function () {
                    s[k] = el.checked;
                });
            });
        })();

        injectButton();

        // Reset FPS counter a cada 1s (para o map-engine poder acumular frameCount)
        setInterval(tickFps, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
