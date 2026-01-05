/**
 * Combat Effects Library
 * Contains all visual effect functions for combat
 * @requires combat-effects-core.js
 * @author Antigravity AI
 * @version 1.0.0
 */

(function () {
    'use strict';

    if (!window.CombatEffects) {
        console.error('[Combat Effects Library] combat-effects-core.js must be loaded first!');
        return;
    }

    const manager = window.CombatEffects;

    // Helper function to add particles to the manager
    function addParticle(x, y, config) {
        manager.addParticle(x, y, config);
    }

    // ===== BASE EFFECTS (20 functions) =====

    function createHitEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 3 + Math.random() * 3;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: i % 2 === 0 ? '#ef4444' : '#fca5a5',
                life: 1,
                gravity: 0.1,
                decay: 0.02,
                glow: true
            });
        }
    }

    function createExplosion(x, y) {
        const colorPalettes = [
            ['#ef4444', '#f97316', '#fbbf24', '#fff'],
            ['#dc2626', '#ea580c', '#f59e0b', '#fef3c7'],
            ['#991b1b', '#c2410c', '#d97706', '#fde68a']
        ];
        const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            const size = 3 + Math.random() * 10;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: palette[Math.floor(Math.random() * palette.length)],
                life: 0.8 + Math.random() * 0.7,
                gravity: 0.1 + Math.random() * 0.1,
                decay: 0.012 + Math.random() * 0.008,
                shape: ['circle', 'square'][Math.floor(Math.random() * 2)],
                glow: true
            });
        }
    }

    function createSlashEffect(x, y) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = direction * (-Math.PI / 4);
        for (let i = 0; i < 40; i++) {
            const offset = i * 8 - 160;
            addParticle(
                x + Math.cos(angle) * offset,
                y + Math.sin(angle) * offset,
                {
                    vx: Math.cos(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                    size: 4 + Math.random() * 6,
                    color: '#fff',
                    life: 0.8,
                    decay: 0.03,
                    glow: true
                }
            );
        }
    }

    function createFireballEffect(x, y) {
        const spreadMultiplier = 0.5 + Math.random() * 1;
        const riseSpeed = 1 + Math.random() * 2;

        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 * spreadMultiplier;
            const useIcon = Math.random() > 0.6;

            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - riseSpeed,
                size: useIcon ? 16 + Math.random() * 8 : 3 + Math.random() * 5,
                color: ['#ef4444', '#f97316', '#fbbf24'][Math.floor(Math.random() * 3)],
                life: 1 + Math.random() * 0.5,
                gravity: -0.05,
                decay: 0.015 + Math.random() * 0.01,
                shape: useIcon ? 'icon' : 'circle',
                icon: useIcon ? 'flame' : null,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                glow: true
            });
        }
    }

    function createLightningEffect(x, y) {
        const branches = 5;
        for (let b = 0; b < branches; b++) {
            const startXOffset = (Math.random() - 0.5) * 60;
            let currentX = x + startXOffset;
            let currentY = y - 100;
            for (let i = 0; i < 20; i++) {
                addParticle(currentX, currentY, {
                    vx: 0,
                    vy: 0,
                    size: 4 + Math.random() * 3,
                    color: '#60a5fa',
                    life: 0.5,
                    decay: 0.05,
                    glow: true
                });
                currentX += (Math.random() - 0.5) * 15;
                currentY += 10;
            }
        }
    }

    function createIceEffect(x, y) {
        const pattern = Math.random() > 0.5 ? 'explosion' : 'directional';
        const baseAngle = Math.random() * Math.PI * 2;

        for (let i = 0; i < 30; i++) {
            let angle;
            if (pattern === 'explosion') {
                angle = Math.random() * Math.PI * 2;
            } else {
                angle = baseAngle + (Math.random() - 0.5) * Math.PI / 2;
            }

            const speed = 2 + Math.random() * 5;
            const useIcon = Math.random() > 0.4;

            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: useIcon ? 12 + Math.random() * 8 : 4 + Math.random() * 6,
                color: ['#60a5fa', '#93c5fd', '#dbeafe'][Math.floor(Math.random() * 3)],
                life: 1.5,
                gravity: 0.2,
                decay: 0.015,
                shape: useIcon ? 'icon' : 'triangle',
                icon: useIcon ? 'snowflake' : null,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                glow: true
            });
        }
    }

    function createPoisonEffect(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2;
            const useIcon = Math.random() > 0.6;
            const iconType = Math.random() > 0.7 ? 'skull' : 'droplet';

            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: useIcon ? 12 + Math.random() * 6 : 3 + Math.random() * 4,
                color: iconType === 'skull' ? '#6b7280' : ['#22c55e', '#4ade80', '#86efac'][Math.floor(Math.random() * 3)],
                life: 2,
                gravity: -0.1,
                decay: 0.01,
                shape: useIcon ? 'icon' : 'circle',
                icon: useIcon ? iconType : null,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.06,
                glow: true
            });
        }
    }

    function createHealEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            const useIcon = Math.random() > 0.5;
            const iconType = Math.random() > 0.5 ? 'heart' : 'sparkles';

            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: useIcon ? 14 + Math.random() * 6 : 2 + Math.random() * 4,
                color: ['#22c55e', '#4ade80', '#fbbf24'][Math.floor(Math.random() * 3)],
                life: 1.5,
                gravity: -0.15,
                decay: 0.015,
                shape: useIcon ? 'icon' : ['circle', 'square'][Math.floor(Math.random() * 2)],
                icon: useIcon ? iconType : null,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.08,
                glow: true
            });
        }
    }

    function createShieldEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const radius = 80;
            addParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: 0,
                    vy: 0,
                    size: 3,
                    color: '#60a5fa',
                    life: 1,
                    decay: 0.02,
                    glow: true
                }
            );
        }
    }

    function createBuffEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 20;
            addParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle) * 0.5,
                    vy: -3 - Math.random() * 2,
                    size: 3 + Math.random() * 3,
                    color: '#fbbf24',
                    life: 2,
                    gravity: -0.05,
                    decay: 0.01,
                    glow: true
                }
            );
        }
    }

    function createStunEffect(x, y) {
        const stars = 8;
        for (let i = 0; i < stars; i++) {
            const angle = (Math.PI * 2 * i) / stars;
            const radius = 60;
            addParticle(
                x + Math.cos(angle) * radius,
                y - 80 + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle + Math.PI / 2) * 2,
                    vy: Math.sin(angle + Math.PI / 2) * 2,
                    size: 6,
                    color: '#fbbf24',
                    life: 2,
                    gravity: 0,
                    decay: 0.01,
                    rotation: angle,
                    rotationSpeed: 0.05,
                    shape: 'triangle',
                    glow: true
                }
            );
        }
    }

    function createRainOfArrowsEffect(x, y) {
        for (let i = 0; i < 45; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 120;
                addParticle(x + offsetX, y - 150, {
                    vx: 0,
                    vy: 8 + Math.random() * 4,
                    size: 8,
                    color: ['#78716c', '#a8a29e'][Math.floor(Math.random() * 2)],
                    life: 2,
                    gravity: 0.3,
                    decay: 0.02,
                    shape: 'triangle',
                    rotation: Math.PI / 2,
                    glow: false
                });
            }, i * 30);
        }
    }

    function createEarthquakeEffect(x, y) {
        for (let i = 0; i < 35; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 100;
                addParticle(x + offsetX, y + 50, {
                    vx: (Math.random() - 0.5) * 2,
                    vy: -8 - Math.random() * 4,
                    size: 6 + Math.random() * 8,
                    color: ['#78716c', '#57534e', '#44403c'][Math.floor(Math.random() * 3)],
                    life: 1.5,
                    gravity: 0.5,
                    decay: 0.02,
                    shape: 'square',
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.15,
                    glow: false
                });
            }, i * 20);
        }
    }

    function createAcidEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            addParticle(x + offsetX, y - 80, {
                vx: 0,
                vy: 3 + Math.random() * 2,
                size: 4 + Math.random() * 4,
                color: ['#22c55e', '#16a34a', '#15803d'][Math.floor(Math.random() * 3)],
                life: 2,
                gravity: 0.1,
                decay: 0.015,
                shape: 'circle',
                glow: true
            });
        }

        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2 - 2,
                size: 3 + Math.random() * 3,
                color: '#86efac',
                life: 1.5,
                gravity: -0.1,
                decay: 0.02,
                shape: 'circle',
                glow: true
            });
        }
    }

    function createShadowEffect(x, y) {
        const tendrils = 6;
        for (let t = 0; t < tendrils; t++) {
            const baseAngle = (Math.PI * 2 * t) / tendrils;
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const radius = i * 8;
                    const wobble = Math.sin(i * 0.5) * 10;
                    addParticle(
                        x + Math.cos(baseAngle) * radius + wobble,
                        y + Math.sin(baseAngle) * radius,
                        {
                            vx: 0,
                            vy: 0,
                            size: 6 + Math.random() * 4,
                            color: ['#1e1b4b', '#312e81', '#4c1d95'][Math.floor(Math.random() * 3)],
                            life: 1,
                            decay: 0.025,
                            shape: 'circle',
                            glow: true
                        }
                    );
                }, i * 40);
            }
        }
    }

    function createBleedEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: ['#7f1d1d', '#991b1b', '#b91c1c'][Math.floor(Math.random() * 3)],
                life: 1.5,
                gravity: 0.3,
                decay: 0.02,
                shape: 'circle',
                glow: false
            });
        }

        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 30;
                addParticle(x + offsetX, y - 20, {
                    vx: 0,
                    vy: 3 + Math.random(),
                    size: 4,
                    color: '#7f1d1d',
                    life: 2,
                    gravity: 0.1,
                    decay: 0.015,
                    shape: 'circle',
                    glow: false
                });
            }, i * 100);
        }
    }

    function createFreezeEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const radius = 60 + Math.random() * 20;
            addParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle) * -2,
                    vy: Math.sin(angle) * -2,
                    size: 8,
                    color: ['#dbeafe', '#bfdbfe', '#93c5fd'][Math.floor(Math.random() * 3)],
                    life: 1.5,
                    gravity: 0,
                    decay: 0.02,
                    shape: 'icon',
                    icon: 'snowflake',
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    glow: true
                }
            );
        }
    }

    function createWindEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const startX = x - 120 + Math.random() * 20;
            const offsetY = (Math.random() - 0.5) * 80;
            addParticle(startX, y + offsetY, {
                vx: 12 + Math.random() * 4,
                vy: (Math.random() - 0.5) * 2,
                size: 3 + Math.random() * 3,
                color: ['#e0f2fe', '#bae6fd'][Math.floor(Math.random() * 2)],
                life: 0.8,
                gravity: 0,
                decay: 0.025,
                shape: 'square',
                glow: true
            });
        }
    }

    function createArrowEffect(x, y) {
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const progress = i * 8;
                addParticle(x - 100 + progress, y, {
                    vx: 0,
                    vy: 0,
                    size: i === 24 ? 12 : 4,
                    color: i === 24 ? '#78716c' : '#a8a29e',
                    life: 0.3,
                    decay: 0.05,
                    shape: i === 24 ? 'triangle' : 'square',
                    rotation: 0,
                    glow: false
                });
            }, i * 15);
        }
    }

    function createParryEffect(x, y) {
        // Central shield flash
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const radius = 40 + Math.random() * 10;
            addParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    size: 5 + Math.random() * 3,
                    color: ['#fbbf24', '#f59e0b', '#fff'][Math.floor(Math.random() * 3)],
                    life: 0.8,
                    decay: 0.03,
                    shape: 'square',
                    rotation: Math.random() * Math.PI * 2,
                    glow: true
                }
            );
        }

        // Deflection sparks
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 3;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 2,
                color: '#fff',
                life: 0.6,
                gravity: 0.2,
                decay: 0.04,
                shape: 'circle',
                glow: true
            });
        }
    }


    // Continuing with remaining base effects on next update...
    // (Total 50 functions will be added across multiple files or sections)

    // Export effects to manager
    manager.effects = {
        // Base effects
        hit: createHitEffect,
        explosion: createExplosion,
        slash: createSlashEffect,
        fireball: createFireballEffect,
        lightning: createLightningEffect,
        ice: createIceEffect,
        poison: createPoisonEffect,
        heal: createHealEffect,
        shield: createShieldEffect,
        buff: createBuffEffect,
        stun: createStunEffect,
        rain_of_arrows: createRainOfArrowsEffect,
        earthquake: createEarthquakeEffect,
        acid: createAcidEffect,
        shadow: createShadowEffect,
        bleed: createBleedEffect,
        freeze: createFreezeEffect,
        wind: createWindEffect,
        arrow: createArrowEffect,
        parry: createParryEffect,
        // More will be added incrementally
    };

    console.log('[Combat Effects Library] Base effects loaded (20/50)');

})();
