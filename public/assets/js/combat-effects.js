/**
 * Combat Visual Effects System
 * Provides particle effects for skills, damage, and status effects in combat
 * @author Antigravity AI
 * @version 1.0.0
 */

(function () {
    'use strict';

    // ===== LUCIDE ICON SVG PATHS =====
    const LUCIDE_ICONS = {
        'snowflake': 'M2 12h20M12 2v20m-8-8 8-8 8 8m-16 0 8 8 8-8',
        'flame': 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
        'zap': 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
        'droplet': 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
        'heart': 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
        'sword': 'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2',
        'skull': 'M9 12h.01M15 12h.01M8 17c.5.5 1.5 1 4 1s3.5-.5 4-1',
        'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        'sparkles': 'M12 3v4m0 10v4m-7-7h4m10 0h4M6.34 6.34l2.83 2.83m5.66 5.66 2.83 2.83M17.66 6.34l-2.83 2.83M9.17 14.83l-2.83 2.83',
        'moon': 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'
    };

    // ===== PARTICLE CLASS =====
    class Particle {
        constructor(x, y, config) {
            this.x = x;
            this.y = y;
            this.vx = config.vx || 0;
            this.vy = config.vy || 0;
            this.size = config.size || 5;
            this.color = config.color || '#ef4444';
            this.life = config.life || 1;
            this.maxLife = config.life || 1;
            this.gravity = config.gravity || 0;
            this.alpha = 1;
            this.decay = config.decay || 0.02;
            this.shape = config.shape || 'circle'; // circle, square, triangle, icon
            this.glow = config.glow || false;
            this.icon = config.icon || null;
            this.rotation = config.rotation || 0;
            this.rotationSpeed = config.rotationSpeed || 0;
        }

        update() {
            this.vx *= 0.98;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            this.alpha = this.life / this.maxLife;
            this.rotation += this.rotationSpeed;
            return this.life > 0;
        }

        draw(ctx) {
            ctx.globalAlpha = this.alpha;

            if (this.glow) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
            }

            if (this.shape === 'icon' && this.icon) {
                this.drawIcon(ctx);
            } else if (this.shape === 'circle') {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'square') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            } else if (this.shape === 'triangle') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }

        drawIcon(ctx) {
            const pathData = LUCIDE_ICONS[this.icon];
            if (!pathData) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            const scale = this.size / 12;
            ctx.scale(scale, scale);
            ctx.translate(-12, -12);

            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
            ctx.lineWidth = 2 / scale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const path = new Path2D(pathData);
            ctx.stroke(path);

            ctx.restore();
        }
    }

    // ===== EFFECT MANAGER =====
    class EffectManager {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
            this.animationId = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;

            const container = document.getElementById('battlefield-container');
            if (!container) {
                console.warn('[Combat Effects] battlefield-container not found');
                return;
            }

            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'combat-effects-canvas';
            this.canvas.className = 'absolute inset-0 z-50 pointer-events-none';
            this.canvas.style.opacity = '1';
            container.appendChild(this.canvas);

            this.ctx = this.canvas.getContext('2d');
            this.resize();

            window.addEventListener('resize', () => this.resize());

            this.animate();
            this.initialized = true;

            console.log('[Combat Effects] Initialized successfully');
        }

        resize() {
            if (!this.canvas) return;
            const container = document.getElementById('battlefield-container');
            if (container) {
                this.canvas.width = container.offsetWidth || window.innerWidth;
                this.canvas.height = container.offsetHeight || window.innerHeight;
            }
        }

        animate() {
            if (!this.ctx || !this.canvas) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw all particles
            this.particles = this.particles.filter(p => {
                const alive = p.update();
                if (alive) p.draw(this.ctx);
                return alive;
            });

            this.animationId = requestAnimationFrame(() => this.animate());
        }

        addParticle(x, y, config) {
            this.particles.push(new Particle(x, y, config));
        }

        triggerEffect(effectName, x, y) {
            const effectFunc = this.effects[effectName];
            if (effectFunc) {
                effectFunc.call(this, x, y);
            } else {
                console.warn(`[Combat Effects] Effect "${effectName}" not found`);
            }
        }

        // Will be populated with effect functions
        effects = {};
    }

    // Create global instance
    window.CombatEffects = new EffectManager();

    console.log('[Combat Effects] Module loaded');

})();
