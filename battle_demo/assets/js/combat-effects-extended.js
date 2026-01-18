/**
 * Combat Effects Library - Extended Effects
 * Contains elemental, physical, and status effect functions
 * @requires combat-effects-core.js
 * @requires combat-effects-library.js
 * @author Antigravity AI
 */

(function () {
    'use strict';

    if (!window.CombatEffects) {
        console.error('[Combat Effects Extended] combat-effects-core.js must be loaded first!');
        return;
    }

    const manager = window.CombatEffects;
    const addParticle = (x, y, config) => manager.addParticle(x, y, config);

    // ===== MISSING BASE EFFECT =====
    function createCriticalEffect(x, y) {
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            for (let j = 0; j < 15; j++) {
                setTimeout(() => {
                    const dist = j * 15;
                    addParticle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, {
                        vx: 0, vy: 0, size: 8, color: '#fbbf24',
                        life: 0.5, decay: 0.05, shape: 'triangle', glow: true
                    });
                }, j * 20);
            }
        }
    }

    // ===== ELEMENTAL MAGIC EFFECTS (12 functions) =====
    function createMeteorStormEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 150;
                addParticle(x + offsetX, y - 180, {
                    vx: Math.random() - 0.5, vy: 10 + Math.random() * 5, size: 15 + Math.random() * 10,
                    color: ['#ef4444', '#f97316', '#7f1d1d'][Math.floor(Math.random() * 3)],
                    life: 2, gravity: 0.5, decay: 0.015, shape: 'circle', glow: true
                });
            }, i * 80);
        }
    }

    function createHolySmiteEffect(x, y) {
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y - 150, {
                vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4 + 8, size: 3 + Math.random() * 4,
                color: ['#fef3c7', '#fde047', '#fff'][Math.floor(Math.random() * 3)],
                life: 1.5, gravity: 0, decay: 0.02, shape: 'circle', glow: true
            });
        }
    }

    function createHolyRadianceEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const radius = 100;
            addParticle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, {
                vx: Math.cos(angle) * -3, vy: Math.sin(angle) * -3, size: 4,
                color: ['#fef3c7', '#fde047'][Math.floor(Math.random() * 2)],
                life: 1.5, gravity: 0, decay: 0.02, shape: 'circle', glow: true
            });
        }
    }

    function createThunderClapEffect(x, y) {
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 6;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 5 + Math.random() * 4,
                color: ['#60a5fa', '#93c5fd', '#fff'][Math.floor(Math.random() * 3)],
                life: 0.8, gravity: 0, decay: 0.03, shape: 'circle', glow: true
            });
        }
    }

    function createChainLightningEffect(x, y) {
        const targets = 3;
        for (let t = 0; t < targets; t++) {
            setTimeout(() => {
                const targetX = x + (Math.random() - 0.5) * 200;
                const targetY = y + (Math.random() - 0.5) * 100;
                for (let i = 0; i < 25; i++) {
                    const progress = i / 25;
                    setTimeout(() => {
                        addParticle(x + (targetX - x) * progress, y + (targetY - y) * progress, {
                            vx: 0, vy: 0, size: 5, color: '#60a5fa',
                            life: 0.4, decay: 0.06, glow: true
                        });
                    }, i * 15);
                }
            }, t * 300);
        }
    }

    function createIcePrisonEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const radius = 70;
            addParticle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, {
                vx: 0, vy: 0, size: 10, color: ['#60a5fa', '#93c5fd'][Math.floor(Math.random() * 2)],
                life: 2, decay: 0.01, shape: 'square', rotation: angle, glow: true
            });
        }
    }

    function createFrostNovaEffect(x, y) {
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 8 + Math.random() * 6,
                color: ['#dbeafe', '#bfdbfe', '#93c5fd'][Math.floor(Math.random() * 3)],
                life: 1.5, gravity: 0, decay: 0.02, shape: 'icon', icon: 'snowflake', glow: true
            });
        }
    }

    function createVoidLanceEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                addParticle(x - 150 + i * 8, y, {
                    vx: 0, vy: 0, size: i === 39 ? 20 : 6,
                    color: ['#1e1b4b', '#312e81', '#4c1d95'][Math.floor(Math.random() * 3)],
                    life: 0.5, decay: 0.04, shape: 'circle', glow: true
                });
            }, i * 10);
        }
    }

    function createArcaneMissilesEffect(x, y) {
        for (let m = 0; m < 5; m++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        addParticle(x - 100 + i * 10, y + (m - 2) * 15, {
                            vx: 0, vy: 0, size: 6, color: '#a855f7',
                            life: 0.4, decay: 0.05, shape: 'circle', glow: true
                        });
                    }, i * 10);
                }
            }, m * 200);
        }
    }

    function createVenomCloudEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, size: 12 + Math.random() * 8,
                color: ['#22c55e', '#4ade80', '#86efac'][Math.floor(Math.random() * 3)],
                life: 3, gravity: -0.05, decay: 0.008, shape: 'circle', glow: true
            });
        }
    }

    function createWaterSplashEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 6;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4, size: 4 + Math.random() * 6,
                color: ['#0ea5e9', '#38bdf8', '#7dd3fc'][Math.floor(Math.random() * 3)],
                life: 1.5, gravity: 0.3, decay: 0.02, shape: 'circle', glow: false
            });
        }
    }

    function createEarthSpikesEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const offsetX = (i - 5) * 20;
                for (let j = 0; j < 8; j++) {
                    addParticle(x + offsetX, y + 50 - j * 12, {
                        vx: 0, vy: 0, size: 8 - j, color: ['#78716c', '#57534e'][Math.floor(Math.random() * 2)],
                        life: 1.5, decay: 0.02, shape: 'triangle', rotation: Math.PI, glow: false
                    });
                }
            }, i * 50);
        }
    }

    // ===== PHYSICAL & WEAPON EFFECTS (8 functions) =====
    function createChargeImpactEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 6 + Math.random() * 8;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 6 + Math.random() * 6,
                color: '#a8a29e', life: 1, gravity: 0.2, decay: 0.025, shape: 'circle', glow: false
            });
        }
    }

    function createCleaveEffect(x, y) {
        const arc = Math.PI;
        const startAngle = -Math.PI / 4;
        for (let i = 0; i < 50; i++) {
            const angle = startAngle + (arc * i) / 50;
            for (let r = 0; r < 15; r++) {
                addParticle(x + Math.cos(angle) * r * 8, y + Math.sin(angle) * r * 8, {
                    vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, size: 4,
                    color: '#fff', life: 0.6, decay: 0.04, glow: true
                });
            }
        }
    }

    function createMultiHitEffect(x, y) {
        for (let h = 0; h < 5; h++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    addParticle(x, y, {
                        vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, size: 4,
                        color: ['#ef4444', '#fff'][Math.floor(Math.random() * 2)],
                        life: 0.5, gravity: 0, decay: 0.04, glow: true
                    });
                }
            }, h * 150);
        }
    }

    function createPiercingShotEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                addParticle(x - 150 + i * 6, y, {
                    vx: 0, vy: 0, size: i > 40 ? 12 : 5, color: '#78716c',
                    life: 0.3, decay: 0.06, shape: i > 40 ? 'triangle' : 'circle', glow: false
                });
            }, i * 8);
        }
    }

    function createShieldBlockEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            addParticle(x + Math.cos(angle) * 70, y + Math.sin(angle) * 70, {
                vx: 0, vy: 0, size: 6, color: '#60a5fa',
                life: 1, decay: 0.025, shape: 'square', glow: true
            });
        }
    }

    function createParryCounterEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6, size: 5,
                color: ['#fbbf24', '#fff'][Math.floor(Math.random() * 2)],
                life: 0.8, decay: 0.03, shape: 'triangle', glow: true
            });
        }
    }

    function createBackstabEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            addParticle(x, y, {
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 4 + Math.random() * 4,
                color: ['#7f1d1d', '#ef4444'][Math.floor(Math.random() * 2)],
                life: 1, gravity: 0.2, decay: 0.03, shape: 'circle', glow: true
            });
        }
    }

    function createRiposteEffect(x, y) {
        const slashAngle = Math.random() * Math.PI * 2;
        for (let i = 0; i < 35; i++) {
            const offset = i * 6 - 105;
            addParticle(x + Math.cos(slashAngle) * offset, y + Math.sin(slashAngle) * offset, {
                vx: 0, vy: 0, size: 5, color: '#fbbf24',
                life: 0.7, decay: 0.035, glow: true
            });
        }
    }

    // ===== STATUS & DOT EFFECTS (10 functions) =====
    function createBurnDotEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle), vy: Math.sin(angle) - 1.5, size: 8 + Math.random() * 4,
                color: ['#f97316', '#fbbf24'][Math.floor(Math.random() * 2)],
                life: 1.5, gravity: -0.05, decay: 0.02, shape: 'icon', icon: 'flame', glow: true
            });
        }
    }

    function createPoisonDotEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5 - 1, size: 10,
                color: '#22c55e', life: 2, gravity: -0.1, decay: 0.012, shape: 'icon', icon: 'droplet', glow: true
            });
        }
    }

    function createBleedDotEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 40;
                addParticle(x + offsetX, y - 10, {
                    vx: 0, vy: 2 + Math.random(), size: 5, color: '#7f1d1d',
                    life: 2, gravity: 0.1, decay: 0.015, shape: 'circle', glow: false
                });
            }, i * 120);
        }
    }

    function createParalyzeEffect(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, size: 6,
                color: ['#60a5fa', '#fff'][Math.floor(Math.random() * 2)],
                life: 1, gravity: 0, decay: 0.025, shape: 'icon', icon: 'zap', glow: true
            });
        }
    }

    function createSlowEffect(x, y) {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                addParticle(x + (Math.random() - 0.5) * 60, y + 50, {
                    vx: 0, vy: -1.5, size: 6, color: '#60a5fa',
                    life: 2, gravity: 0, decay: 0.01, shape: 'square', glow: true
                });
            }, i * 60);
        }
    }

    function createHasteEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const startX = x + (Math.random() - 0.5) * 60;
            addParticle(startX, y + (Math.random() - 0.5) * 60, {
                vx: 15, vy: (Math.random() - 0.5) * 2, size: 4,
                color: ['#fbbf24', '#fde047'][Math.floor(Math.random() * 2)],
                life: 0.5, gravity: 0, decay: 0.05, shape: 'square', glow: true
            });
        }
    }

    function createEnrageEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.2;
            const radius = 80 + (Math.random() - 0.5) * 20;
            addParticle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, {
                vx: Math.cos(angle) * -1, vy: Math.sin(angle) * -1, size: 8,
                color: ['#ef4444', '#f97316'][Math.floor(Math.random() * 2)],
                life: 1.5, gravity: 0, decay: 0.02, shape: 'icon', icon: 'flame', glow: true
            });
        }
    }

    function createTauntEffect(x, y) {
        const marks = 4;
        for (let m = 0; m < marks; m++) {
            const angle = (Math.PI * 2 * m) / marks;
            const radius = 60;
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const r = radius + i * 5;
                    addParticle(x + Math.cos(angle) * r, y + Math.sin(angle) * r, {
                        vx: Math.cos(angle) * 0.5, vy: Math.sin(angle) * 0.5, size: 8,
                        color: ['#ef4444', '#f97316'][Math.floor(Math.random() * 2)],
                        life: 1, gravity: 0, decay: 0.025, shape: 'circle', glow: true
                    });
                }, i * 50);
            }
        }
    }

    function createDiseaseEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            addParticle(x, y, {
                vx: Math.cos(angle), vy: Math.sin(angle), size: 6 + Math.random() * 4,
                color: ['#15803d', '#166534', '#14532d'][Math.floor(Math.random() * 3)],
                life: 2, gravity: -0.02, decay: 0.01, shape: 'circle', glow: true
            });
        }
    }

    function createCurseEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const radius = 50;
            ((currentAngle) => {
                setTimeout(() => {
                    addParticle(x + Math.cos(currentAngle) * radius, y + Math.sin(currentAngle) * radius, {
                        vx: Math.cos(currentAngle + Math.PI / 2) * 2, vy: Math.sin(currentAngle + Math.PI / 2) * 2,
                        size: 12, color: '#6b21a8', life: 2, gravity: 0, decay: 0.01,
                        shape: 'icon', icon: 'moon', rotation: currentAngle, rotationSpeed: 0.05, glow: true
                    });
                }, i * 100);
            })(angle);
        }
    }

    // ===== EXTEND EFFECTS OBJECT =====
    Object.assign(manager.effects, {
        critical: createCriticalEffect,
        // Elemental
        meteor_storm: createMeteorStormEffect,
        holy_smite: createHolySmiteEffect,
        holy_radiance: createHolyRadianceEffect,
        thunder_clap: createThunderClapEffect,
        chain_lightning: createChainLightningEffect,
        ice_prison: createIcePrisonEffect,
        frost_nova: createFrostNovaEffect,
        void_lance: createVoidLanceEffect,
        arcane_missiles: createArcaneMissilesEffect,
        venom_cloud: createVenomCloudEffect,
        water_splash: createWaterSplashEffect,
        earth_spikes: createEarthSpikesEffect,
        // Physical
        charge_impact: createChargeImpactEffect,
        cleave: createCleaveEffect,
        multi_hit: createMultiHitEffect,
        piercing_shot: createPiercingShotEffect,
        shield_block: createShieldBlockEffect,
        parry_counter: createParryCounterEffect,
        backstab: createBackstabEffect,
        riposte: createRiposteEffect,
        // Status
        burn_dot: createBurnDotEffect,
        poison_dot: createPoisonDotEffect,
        bleed_dot: createBleedDotEffect,
        paralyze: createParalyzeEffect,
        slow: createSlowEffect,
        haste: createHasteEffect,
        enrage: createEnrageEffect,
        taunt: createTauntEffect,
        disease: createDiseaseEffect,
        curse: createCurseEffect
    });

    console.log('[Combat Effects Extended] All 50 effects loaded successfully! ✅');

})();
