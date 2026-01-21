/**
 * RPG Pixi Adapter
 * Camada de abstração para renderizar o jogo via WebGL (Pixi.js)
 * mantendo a lógica no map-engine.js e UI em HTML.
 */
class RpgPixiRenderer {
    constructor() {
        this.app = null;
        this.world = null; // Container principal com câmera (pan/zoom)
        this.layers = {
            map: null,
            grid: null, // Reachable/Attackable cells
            shadows: null,
            units: null, // Sprites
            effects: null, // Particles
            ui: null // Barras de HP/Float text (se migrado)
        };
        this.mapSprite = null;
        this.textures = new Map(); // Cache de texturas
        this.initialized = false;

        // Configurações
        this.config = {
            minZoom: 0.5,
            maxZoom: 2.5
        };
    }

    /**
     * Inicializa o Pixi Application
     * @param {HTMLElement} container - Elemento pai
     * @param {HTMLCanvasElement} [existingCanvas] - Canvas opcional para reusar (evita criar outro)
     */
    async init(container, existingCanvas = null) {
        if (this.initialized) return;

        console.log('[RpgPixiRenderer] Inicializando WebGL...');

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        // Opções do Pixi Application
        const options = {
            width,
            height,
            backgroundColor: 0x0a0a10, // Cor de fundo (blueprint background)
            antialias: false, // Pixel art style preference
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            backgroundAlpha: 1
        };

        // Reusar canvas se fornecido
        if (existingCanvas) {
            options.view = existingCanvas;
        }

        this.app = new PIXI.Application(options);
        // Parar o ticker automático para usar nosso próprio gameLoop
        this.app.ticker.stop();

        // Se não reusou canvas, adicionar ao container
        if (!existingCanvas) {
            container.appendChild(this.app.view);
            this.app.view.id = 'pixi-canvas';
            this.app.view.style.position = 'absolute';
            this.app.view.style.top = '0';
            this.app.view.style.left = '0';
            this.app.view.style.zIndex = '0'; // Atrás da UI
        }

        // Criar Containers (Layers)
        this.world = new PIXI.Container();
        // Ordenação manual para consistência
        this.world.sortableChildren = true;

        this.app.stage.addChild(this.world);

        // Inicializar camadas
        this.createLayers();

        // Setup Resize Observer
        this.setupResize(container);

        this.initialized = true;
        console.log('[RpgPixiRenderer] WebGL inicializado com sucesso. Canvas:', width, 'x', height);
    }

    createLayers() {
        // 0. Mapa
        this.layers.map = new PIXI.Container();
        this.layers.map.zIndex = 0;
        this.world.addChild(this.layers.map);

        // 1. Grid (Highlights)
        this.layers.grid = new PIXI.Graphics();
        this.layers.grid.zIndex = 10;
        this.world.addChild(this.layers.grid);

        // 2. Sombras
        this.layers.shadows = new PIXI.Container();
        this.layers.shadows.zIndex = 20;
        this.world.addChild(this.layers.shadows);

        // 3. Unidades (Sprites)
        this.layers.units = new PIXI.Container();
        this.layers.units.zIndex = 30;
        this.layers.units.sortableChildren = true; // Necessário para Y-sorting (profundidade)
        this.world.addChild(this.layers.units);

        // 4. Efeitos (Partículas)
        this.layers.effects = new PIXI.Container();
        this.layers.effects.zIndex = 40;
        this.world.addChild(this.layers.effects);

        // 5. UI no World (Barras HP)
        this.layers.ui = new PIXI.Container();
        this.layers.ui.zIndex = 50;
        this.world.addChild(this.layers.ui);
    }

    // ... setupResize mantido igual ...

    /**
     * Carrega/Define a imagem do mapa
     * @param {HTMLImageElement|string} source - URL ou Elemento de imagem
     */
    setMapImage(source) {
        let texture;
        console.log('[RpgPixiRenderer] setMapImage chamado. Source:', source);

        // Se for string URL
        if (typeof source === 'string') {
            texture = PIXI.Texture.from(source);
        }
        // Se for HTMLImageElement já carregado
        else if (source instanceof HTMLImageElement) {
            texture = PIXI.Texture.from(source);
        }

        console.log('[RpgPixiRenderer] Texture created. Valid:', texture.valid, 'Width:', texture.width, 'Height:', texture.height);

        if (this.mapSprite) {
            this.mapSprite.texture = texture;
        } else {
            this.mapSprite = new PIXI.Sprite(texture);
            this.layers.map.addChild(this.mapSprite);
            console.log('[RpgPixiRenderer] MapSprite created and added to layer.');
        }
    }

    /**
     * Sincroniza a câmera com o viewState do map-engine.js
     * @param {Object} viewState - { x, y, scale }
     * @param {Object} shake - { x, y } offset de screen shake
     */
    syncCamera(viewState, shake = { x: 0, y: 0 }) {
        if (!this.world) return;

        this.world.position.set(viewState.x + (shake.x || 0), viewState.y + (shake.y || 0));
        this.world.scale.set(viewState.scale, viewState.scale);
    }

    /**
     * Atualiza os highlights do grid (Cells)
     * @param {Object} highlights - Objeto com arrays de céluas { reachable, attackable, etc }
     * @param {number} cellSize - Tamanho da célula (default 64)
     */
    updateHighlights(highlights, cellSize = 64) {
        if (!this.layers.grid) return;

        const g = this.layers.grid;
        g.clear();

        // Estilos
        const styles = {
            move: { fill: 0x3b82f6, alpha: 0.25, line: 0x60a5fa, lineAlpha: 0.5 },
            attack: { fill: 0xef4444, alpha: 0.25, line: 0xfca5a5, lineAlpha: 0.5 },
            skillRange: { fill: 0xeab308, alpha: 0.2, line: 0xfde047, lineAlpha: 0.4 },
            skillArea: { fill: 0xa855f7, alpha: 0.3, line: 0xd8b4fe, lineAlpha: 0.6 },
            preview: { fill: 0xff0000, alpha: 0.4, line: 0xffaaaa, lineAlpha: 0.8 },
            attackRange: { fill: 0xffffff, alpha: 0.05, line: 0xffaaaa, lineAlpha: 0.3 } // Range indicator
        };

        const drawCells = (cells, type) => {
            if (!cells || cells.length === 0) return;
            const style = styles[type];
            if (!style) return;

            g.lineStyle(2, style.line, style.lineAlpha);
            g.beginFill(style.fill, style.alpha);

            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                // Coordenadas 1-based
                const x = (cell.x - 1) * cellSize;
                const y = (cell.y - 1) * cellSize;
                g.drawRect(x, y, cellSize, cellSize);
            }
            g.endFill();
        };

        // Ordem de desenho (camadas de highlight)
        if (highlights.attackRange) drawCells(highlights.attackRange, 'attackRange'); // Range primeiro (fundo)
        if (highlights.reachable) drawCells(highlights.reachable, 'move');
        if (highlights.attackable) drawCells(highlights.attackable, 'attack');
        if (highlights.skillRange) drawCells(highlights.skillRange, 'skillRange');
        if (highlights.skillArea) drawCells(highlights.skillArea, 'skillArea');
        if (highlights.attackPreview) drawCells(highlights.attackPreview, 'preview');
    }

    /**
     * Render loop principal - chamado pelo gameLoop do map-engine
     * @param {Object} gameState - Estado atual do jogo
     */
    render(gameState) {
        if (!this.initialized) return;

        // render() manual pode ser melhor para sincronizar estritamente com o gameloop do engine
        this.app.renderer.render(this.app.stage);
    }

    /**
     * Limpa recursos
     */
    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            this.app = null;
            this.initialized = false;
        }
    }
}

// Exportar instância global
window.RpgPixiRenderer = new RpgPixiRenderer();
