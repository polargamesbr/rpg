/**
 * POC: renderizar o mapa do jogo com Pixi.js (WebGL/GPU).
 * Demonstra: Application, Sprite do mapa, câmera (pan + zoom).
 *
 * Uso: carregue Pixi antes (CDN ou bundle) e este script. Chame:
 *   PixiMapDemo.run('pixi-container', '/public/assets/img/maps/first-steps.webp');
 *
 * Ou deixe os padrões: container 'pixi-container', mapa first-steps.webp.
 */
(function (global) {
    'use strict';

    if (typeof PIXI === 'undefined') {
        console.error('[PixiMapDemo] Pixi.js não encontrado. Inclua: <script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js"></script>');
        return;
    }

    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 2.5;
    const ZOOM_STEP = 0.08;

    const viewState = { x: 0, y: 0, scale: 1 };
    let app = null;
    let world = null;
    let mapSprite = null;
    let dragStart = null;
    let viewStart = { x: 0, y: 0 };

    function screenToWorld(sx, sy) {
        return {
            x: (sx - viewState.x) / viewState.scale,
            y: (sy - viewState.y) / viewState.scale
        };
    }

    function applyCamera() {
        if (!world) return;
        world.position.set(viewState.x, viewState.y);
        world.scale.set(viewState.scale, viewState.scale);
    }

    function onPointerDown(e) {
        dragStart = { x: e.global.x, y: e.global.y };
        viewStart = { x: viewState.x, y: viewState.y };
    }

    function onPointerMove(e) {
        if (!dragStart) return;
        viewState.x = viewStart.x + (e.global.x - dragStart.x);
        viewState.y = viewStart.y + (e.global.y - dragStart.y);
        applyCamera();
    }

    function onPointerUp() {
        dragStart = null;
    }

    function onWheel(e) {
        e.preventDefault();
        const rect = app.view.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const worldPos = screenToWorld(cx, cy);
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.scale + delta));
        viewState.scale = newScale;
        viewState.x = cx - worldPos.x * newScale;
        viewState.y = cy - worldPos.y * newScale;
        applyCamera();
    }

    function initInteraction() {
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        app.stage.on('pointerdown', onPointerDown);
        app.stage.on('pointermove', onPointerMove);
        app.stage.on('pointerup', onPointerUp);
        app.stage.on('pointerupoutside', onPointerUp);
        app.view.addEventListener('wheel', onWheel, { passive: false });
    }

    /**
     * @param {string} containerId - id do elemento (ex: 'pixi-container')
     * @param {string} mapImageUrl - URL da imagem do mapa (ex: '/public/assets/img/maps/first-steps.webp')
     */
    async function run(containerId, mapImageUrl) {
        containerId = containerId || 'pixi-container';
        mapImageUrl = mapImageUrl || '/public/assets/img/maps/first-steps.webp';

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[PixiMapDemo] Container não encontrado:', containerId);
            return null;
        }

        const w = container.clientWidth || 1280;
        const h = container.clientHeight || 720;

        // Pixi v7: new PIXI.Application(opts). v8: app.init(opts).
        app = new PIXI.Application({
            width: w,
            height: h,
            backgroundColor: 0x0d1117,
            antialias: true
        });
        container.appendChild(app.view);

        world = new PIXI.Container();
        app.stage.addChild(world);

        // Carregar mapa (Pixi v7: Texture.from + baseTexture.loaded)
        const texture = await new Promise((resolve, reject) => {
            const t = PIXI.Texture.from(mapImageUrl);
            if (t.baseTexture && t.baseTexture.hasLoaded) return resolve(t);
            if (t.baseTexture) {
                t.baseTexture.once('loaded', () => resolve(t));
                t.baseTexture.once('error', reject);
            } else {
                resolve(t);
            }
        });

        mapSprite = new PIXI.Sprite(texture);
        mapSprite.anchor.set(0, 0);
        world.addChild(mapSprite);

        // Centralizar no mapa no início
        viewState.x = (app.screen?.width || w) / 2 - (mapSprite.width / 2);
        viewState.y = (app.screen?.height || h) / 2 - (mapSprite.height / 2);
        viewState.scale = 1;
        applyCamera();

        initInteraction();

        // Resize
        const ro = new ResizeObserver(entries => {
            for (const e of entries) {
                const { width, height } = e.contentRect;
                if (width > 0 && height > 0 && app.renderer) {
                    app.renderer.resize(width, height);
                }
            }
        });
        ro.observe(container);

        console.log('[PixiMapDemo] WebGL ativo. Arraste para pan, scroll para zoom.');
        return app;
    }

    // API pública
    global.PixiMapDemo = { run };
})(typeof window !== 'undefined' ? window : this);
