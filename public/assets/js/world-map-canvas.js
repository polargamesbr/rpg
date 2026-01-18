/**
 * World Map Canvas - Navigable Map with Pan & Zoom
 * Vanilla JS implementation inspired by ffui MapCanvas
 */
class WorldMapCanvas {
    constructor(container, options = {}) {
        console.log('WorldMapCanvas: Initializing with options', options);
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        if (!this.container) {
            console.error('WorldMapCanvas: Container not found');
            return;
        }

        // Options
        this.options = {
            mapSrc: options.mapSrc || '/public/assets/img/map.png',
            minZoom: options.minZoom || 0.1,
            maxZoom: options.maxZoom || 4.0,
            initialZoom: options.initialZoom || 0.7,
            panMargin: options.panMargin || 100,
            smoothing: options.smoothing || 0.1, // Elasticity
            onPoiClick: options.onPoiClick || null,
            onLoaded: options.onLoaded || null,
            gridSize: 100,
            ...options
        };

        // State
        this.view = { x: 0, y: 0, scale: 0.1 }; // Start small, will fit after load
        this.targetView = { x: 0, y: 0, scale: 0.1 };
        this.dimensions = { width: 0, height: 0 };
        this.mapImage = null;
        this.mapLoaded = false;
        this.mapLoading = false;
        this.mapWidth = 0;
        this.mapHeight = 0;

        // Interaction state
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.lastTouchDistance = null;
        this.lastTouchCenter = null;

        // Animation
        this.animationId = null;
        this.needsRender = true;

        // POIs (Points of Interest)
        this.pois = options.pois || [];
        this.hoveredPoi = null;
        this.selectedPoi = null;

        // Initialize
        this.init();
    }

    init() {
        // Clear container
        this.container.innerHTML = '';

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'world-map-canvas';
        this.canvas.style.cssText = 'width: 100%; height: 100%; display: block; cursor: grab; background: #050505;';
        this.container.appendChild(this.canvas);
        console.log('WorldMapCanvas: Canvas appended to', this.container);

        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // Initial size check
        this.updateDimensions();

        // Load map image
        this.loadMapImage();

        // Setup resize observer
        this.setupResizeObserver();

        // Setup event listeners
        this.setupEventListeners();

        // Start render loop
        this.startRenderLoop();
    }

    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            this.dimensions = { width: rect.width, height: rect.height };
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;

            // If first time or needed, fit to view
            if (!this.mapLoaded) {
                this.view.x = rect.width / 2;
                this.view.y = rect.height / 2;
            }

            this.needsRender = true;
            return true;
        }
        return false;
    }

    loadMapImage() {
        if (this.mapLoading) return;
        this.mapLoading = true;

        console.log('WorldMapCanvas: Attempting to load map from:', this.options.mapSrc);

        this.mapImage = new Image();
        this.mapImage.onload = () => {
            console.log('WorldMapCanvas: Map Image loaded!', this.mapImage.width, 'x', this.mapImage.height);
            this.mapLoaded = true;
            this.mapLoading = false;
            this.mapWidth = this.mapImage.naturalWidth;
            this.mapHeight = this.mapImage.naturalHeight;

            this.fitToView(true); // Instant positioning on first load
            this.needsRender = true;

            // Notify loading complete
            if (this.options.onLoaded) {
                this.options.onLoaded();
            }
        };

        this.mapImage.onerror = (err) => {
            console.warn('WorldMapCanvas: Failed to load map image at:', this.options.mapSrc);

            // Try different path variations
            const tries = [
                '/rpg/public/assets/img/map.png',
                '/public/assets/img/map.png',
                'public/assets/img/map.png',
                '../public/assets/img/map.png'
            ];

            const nextTryIdx = tries.indexOf(this.options.mapSrc) + 1;
            if (nextTryIdx < tries.length) {
                console.log('WorldMapCanvas: Retrying with path:', tries[nextTryIdx]);
                this.options.mapSrc = tries[nextTryIdx];
                this.mapLoading = false;
                this.loadMapImage();
            } else {
                console.error('WorldMapCanvas: Map Image load failed after all attempts.');
                this.mapLoading = false;
                this.needsRender = true;
            }
        };

        this.mapImage.src = this.options.mapSrc;
    }

    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
            if (this.updateDimensions()) {
                // If we're already centered, re-center
                if (this.mapLoaded) {
                    // Slight delay to handle animation end
                    setTimeout(() => this.fitToView(), 50);
                }
            }
        });
        resizeObserver.observe(this.container);
        this.resizeObserver = resizeObserver;
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Double click to zoom
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    }

    // === COORDINATE CONVERSION ===
    screenToWorld(sx, sy) {
        return {
            x: (sx - this.view.x) / this.view.scale,
            y: (sy - this.view.y) / this.view.scale
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.view.scale + this.view.x,
            y: wy * this.view.scale + this.view.y
        };
    }

    // === FIT TO VIEW ===
    fitToView(instant = false) {
        if (!this.mapLoaded || this.dimensions.width === 0) return;

        const fitScale = Math.min(
            this.dimensions.width / this.mapWidth,
            this.dimensions.height / this.mapHeight
        ) * 0.9;

        const fitX = (this.dimensions.width - this.mapWidth * fitScale) / 2;
        const fitY = (this.dimensions.height - this.mapHeight * fitScale) / 2;

        if (instant) {
            // Apply immediately without animation
            this.view.x = fitX;
            this.view.y = fitY;
            this.view.scale = fitScale;
            this.targetView = null;
        } else {
            // Smooth animation
            this.targetView = { x: fitX, y: fitY, scale: fitScale };
        }

        this.needsRender = true;
    }

    // === MOUSE HANDLERS ===
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = this.screenToWorld(mx, my);

        // Check POI click
        const clickedPoi = this.findPoiAt(world.x, world.y);
        if (clickedPoi) {
            this.selectedPoi = clickedPoi;
            if (this.options.onPoiClick) {
                this.options.onPoiClick(clickedPoi, e);
            }
            // Center on POI
            this.centerOn(clickedPoi.x, clickedPoi.y);
            this.needsRender = true;
            return;
        }

        // Start dragging
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.targetView = null; // Cancel smooth animation on manual drag
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = this.screenToWorld(mx, my);

        // Check POI hover
        const hoveredPoi = this.findPoiAt(world.x, world.y);
        if (hoveredPoi !== this.hoveredPoi) {
            this.hoveredPoi = hoveredPoi;
            this.canvas.style.cursor = hoveredPoi ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
            this.needsRender = true;
        }

        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;

            this.view.x += dx;
            this.view.y += dy;
            this.constrainPan();

            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.needsRender = true;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = this.hoveredPoi ? 'pointer' : 'grab';
    }

    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        this.zoomAt(mx, my, zoomFactor);
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        this.zoomAt(mx, my, 1.5);
    }

    // === TOUCH HANDLERS ===
    handleTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const mx = touch.clientX - rect.left;
            const my = touch.clientY - rect.top;
            const world = this.screenToWorld(mx, my);

            // Check POI click
            const clickedPoi = this.findPoiAt(world.x, world.y);
            if (clickedPoi) {
                this.selectedPoi = clickedPoi;
                if (this.options.onPoiClick) {
                    this.options.onPoiClick(clickedPoi, e);
                }
                this.centerOn(clickedPoi.x, clickedPoi.y);
                this.needsRender = true;
                return;
            }

            this.isDragging = true;
            this.lastMousePos = { x: touch.clientX, y: touch.clientY };
            this.targetView = null;
        } else if (e.touches.length === 2) {
            // Start pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.lastTouchDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            this.lastTouchCenter = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
            this.isDragging = false;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.lastMousePos.x;
            const dy = touch.clientY - this.lastMousePos.y;

            this.view.x += dx;
            this.view.y += dy;
            this.constrainPan();

            this.lastMousePos = { x: touch.clientX, y: touch.clientY };
            this.needsRender = true;
        } else if (e.touches.length === 2 && this.lastTouchDistance !== null) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            const rect = this.canvas.getBoundingClientRect();
            const cx = center.x - rect.left;
            const cy = center.y - rect.top;

            const factor = dist / this.lastTouchDistance;
            this.zoomAt(cx, cy, factor);

            this.lastTouchDistance = dist;
            this.lastTouchCenter = center;
        }
    }

    handleTouchEnd(e) {
        if (e.touches.length < 2) {
            this.lastTouchDistance = null;
            this.lastTouchCenter = null;
        }
        if (e.touches.length === 0) {
            this.isDragging = false;
        }
    }

    // === ZOOM ===
    zoomAt(screenX, screenY, factor) {
        const oldScale = this.view.scale;
        let newScale = oldScale * factor;
        newScale = Math.min(Math.max(newScale, this.options.minZoom), this.options.maxZoom);

        const actualFactor = newScale / oldScale;

        this.view.x = screenX - (screenX - this.view.x) * actualFactor;
        this.view.y = screenY - (screenY - this.view.y) * actualFactor;
        this.view.scale = newScale;

        this.constrainPan();
        this.needsRender = true;
    }

    // === PAN CONSTRAINTS ===
    constrainPan() {
        const mapW = this.mapWidth * this.view.scale;
        const mapH = this.mapHeight * this.view.scale;
        const margin = this.options.panMargin;

        this.view.x = Math.min(this.dimensions.width - margin, Math.max(margin - mapW, this.view.x));
        this.view.y = Math.min(this.dimensions.height - margin, Math.max(margin - mapH, this.view.y));
    }

    // === CENTER ON POSITION ===
    centerOn(worldX, worldY) {
        const targetX = this.dimensions.width / 2 - worldX * this.view.scale;
        const targetY = this.dimensions.height / 2 - worldY * this.view.scale;

        this.targetView = { x: targetX, y: targetY };
        this.needsRender = true;
    }

    // === POI MANAGEMENT ===
    setPois(pois) {
        this.pois = pois;
        this.needsRender = true;
    }

    findPoiAt(worldX, worldY) {
        const hitRadius = 30;
        return this.pois.find(poi => {
            const dx = worldX - poi.x;
            const dy = worldY - poi.y;
            return dx * dx + dy * dy < hitRadius * hitRadius;
        });
    }

    // === RENDER LOOP ===
    startRenderLoop() {
        const render = () => {
            if (this.animationId === null) return;

            this.animationId = requestAnimationFrame(render);

            // Interpolate view towards target
            let hasChanged = false;
            if (this.targetView) {
                const lerp = (start, end) => start + (end - start) * this.options.smoothing;

                const oldX = this.view.x;
                const oldY = this.view.y;
                const oldScale = this.view.scale;

                this.view.x = lerp(this.view.x, this.targetView.x);
                this.view.y = lerp(this.view.y, this.targetView.y);
                if (this.targetView.scale) {
                    this.view.scale = lerp(this.view.scale, this.targetView.scale);
                }

                if (Math.abs(this.view.x - this.targetView.x) < 0.1 &&
                    Math.abs(this.view.y - this.targetView.y) < 0.1 &&
                    (!this.targetView.scale || Math.abs(this.view.scale - this.targetView.scale) < 0.001)) {
                    this.view.x = this.targetView.x;
                    this.view.y = this.targetView.y;
                    if (this.targetView.scale) this.view.scale = this.targetView.scale;
                    this.targetView = null;
                }

                if (oldX !== this.view.x || oldY !== this.view.y || oldScale !== this.view.scale) {
                    hasChanged = true;
                }
            }

            if (hasChanged || this.needsRender) {
                this.needsRender = false;
                this.renderFrame();
            }
        };
        this.animationId = requestAnimationFrame(render);
    }

    renderFrame() {
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio;
        const { width, height } = this.dimensions;

        if (width === 0 || height === 0) return;

        // Clear canvas using DPR scale
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        if (!this.mapLoaded) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'italic 12px "Cinzel", serif';
            ctx.textAlign = 'center';
            const msg = this.mapLoading ? 'CARREGANDO MAPA...' : 'ERRO AO CARREGAR MAPA';
            ctx.fillText(msg, width / 2, height / 2);
            return;
        }

        // Clip to container
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();

        // Layer 1: The Map
        ctx.translate(this.view.x, this.view.y);
        ctx.scale(this.view.scale, this.view.scale);

        // Draw shadow/glow around map
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 50;
        ctx.drawImage(this.mapImage, 0, 0, this.mapWidth, this.mapHeight);
        ctx.shadowBlur = 0;

        // Draw POIs
        this.renderPois(ctx);

        ctx.restore();

        // Layer 2: HUD
        this.renderHUD(ctx);
    }

    renderPois(ctx) {
        const time = performance.now() / 1000;

        this.pois.forEach(poi => {
            ctx.save();
            ctx.translate(poi.x, poi.y);

            const isHovered = this.hoveredPoi === poi;
            const isSelected = this.selectedPoi === poi;
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;

            // Glow effect
            const glowColor = poi.color || '#f59e0b';

            if (isHovered || isSelected) {
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 20 * pulse;
            }

            // Outer ring (animated)
            ctx.beginPath();
            ctx.arc(0, 0, (isHovered ? 25 : 20) + pulse * 2, 0, Math.PI * 2);
            ctx.strokeStyle = glowColor + '40';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Main marker
            ctx.beginPath();
            ctx.arc(0, 0, isHovered ? 12 : 10, 0, Math.PI * 2);
            ctx.fillStyle = glowColor;
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label (Dynamic scaling)
            ctx.shadowBlur = 0;
            if (poi.name && (this.view.scale > 0.4 || isHovered)) {
                ctx.font = `bold ${isHovered ? 16 : 13}px "Outfit", sans-serif`;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(poi.name, 0, isHovered ? 35 : 30);
            }

            ctx.restore();
        });
    }

    renderHUD(ctx) {
        const { width, height } = this.dimensions;

        // Zoom Indicator
        ctx.save();
        ctx.translate(width - 100, height - 50);

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(0, 0, 80, 30, 8);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(this.view.scale * 100)}%`, 40, 20);
        ctx.restore();
    }

    // === UTILS ===
    findPoiAt(worldX, worldY) {
        const hitRadius = 30 / this.view.scale; // Larger hit area on low zoom
        return this.pois.find(poi => {
            const dx = worldX - poi.x;
            const dy = worldY - poi.y;
            return Math.sqrt(dx * dx + dy * dy) < hitRadius;
        });
    }

    // === HANDLERS ===
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = this.screenToWorld(mx, my);

        const poi = this.findPoiAt(world.x, world.y);
        if (poi) {
            this.selectedPoi = poi;
            if (this.options.onPoiClick) this.options.onPoiClick(poi, e);
            this.centerOn(poi.x, poi.y);
            return;
        }

        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = this.screenToWorld(mx, my);

        const poi = this.findPoiAt(world.x, world.y);
        if (poi !== this.hoveredPoi) {
            this.hoveredPoi = poi;
            this.canvas.style.cursor = poi ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
            this.needsRender = true;
        }

        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;

            this.view.x += dx;
            this.view.y += dy;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.needsRender = true;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = this.hoveredPoi ? 'pointer' : 'grab';
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const zoomSpeed = 0.001;
        const factor = Math.pow(1.1, -e.deltaY / 100);
        this.zoomAt(mx, my, factor);
    }

    zoomAt(sx, sy, factor) {
        const oldScale = this.view.scale;
        let newScale = oldScale * factor;
        newScale = Math.min(Math.max(newScale, this.options.minZoom), this.options.maxZoom);

        const worldPos = this.screenToWorld(sx, sy);

        this.view.scale = newScale;
        this.view.x = sx - worldPos.x * newScale;
        this.view.y = sy - worldPos.y * newScale;

        this.needsRender = true;
    }

    centerOn(worldX, worldY) {
        const targetX = this.dimensions.width / 2 - worldX * this.view.scale;
        const targetY = this.dimensions.height / 2 - worldY * this.view.scale;
        this.targetView = { x: targetX, y: targetY };
        this.needsRender = true;
    }

    // === PUBLIC API ===
    zoomIn() {
        this.zoomAt(this.dimensions.width / 2, this.dimensions.height / 2, 1.25);
    }

    zoomOut() {
        this.zoomAt(this.dimensions.width / 2, this.dimensions.height / 2, 0.8);
    }

    resetView() {
        this.fitToView();
    }

    destroy() {
        this.animationId = null;
        if (this.resizeObserver) this.resizeObserver.disconnect();
    }
}

window.WorldMapCanvas = WorldMapCanvas;
