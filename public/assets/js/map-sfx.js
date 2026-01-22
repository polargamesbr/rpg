/**
 * Map SFX - Efeitos Visuais para o Sistema de Combate Tático
 * Desacoplado do map-engine.js para melhor organização
 */
(function () {
    'use strict';

    // Referências para o sistema de partículas do map-engine
    let particles = null;
    let floatingTexts = null;
    let needsRenderCallback = null;
    let CONFIG = null;

    /**
     * Inicializa o sistema de SFX com referências do map-engine
     */
    function init(options) {
        particles = options.particles;
        floatingTexts = options.floatingTexts;
        needsRenderCallback = options.needsRender;
        CONFIG = options.CONFIG;
        console.log('[MAP-SFX] Sistema de efeitos inicializado');
    }

    function triggerRender() {
        if (needsRenderCallback) needsRenderCallback();
    }

    // ==========================================
    // EFEITOS DE PARTÍCULAS
    // ==========================================

    /**
     * Efeito de morte (explosão dramática)
     */
    function spawnDeathEffect(x, y) {
        if (!particles) return;

        // Core Explosion
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

        // Smoke Cloud
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

        triggerRender();
    }

    /**
     * Efeito de impacto leve
     */
    function spawnImpactEffect(x, y, color = '#f59e0b') {
        if (!particles) return;

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
        triggerRender();
    }

    /**
     * Efeito de corte de espada (slash)
     */
    function spawnSlashEffect(x, y) {
        if (!particles) return;

        const direction = Math.random() > 0.5 ? 1 : -1;
        const angle = direction * (-Math.PI / 4);

        // Linha de slash principal
        for (let i = 0; i < 32; i++) {
            const offset = i * 5 - 80;
            const fade = 1 - Math.abs(i - 16) / 16;
            particles.push({
                type: 'slash',
                x: x + Math.cos(angle) * offset,
                y: y + Math.sin(angle) * offset,
                vx: Math.cos(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                vy: Math.sin(angle + Math.PI / 2) * (Math.random() - 0.5) * 2,
                size: (8 + Math.random() * 10) * fade,
                color: '#ffffff',
                life: 0.5,
                decay: 0.08,
                rotation: angle,
                glow: true
            });
        }

        // Faíscas de impacto
        for (let i = 0; i < 20; i++) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const speed = 4 + Math.random() * 6;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(sparkAngle) * speed * direction,
                vy: Math.sin(sparkAngle) * speed - 2,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#fef3c7' : '#fbbf24',
                life: 0.6,
                decay: 0.05,
                friction: 0.92
            });
        }

        // Glow central
        particles.push({
            type: 'explosion',
            x, y,
            vx: 0, vy: 0,
            size: 50,
            color: 'rgba(255, 255, 255, 0.8)',
            life: 0.3,
            decay: 0.15,
            friction: 1
        });

        triggerRender();
    }

    // Alias para compatibilidade
    const spawnSwordSlashEffect = spawnSlashEffect;

    /**
     * Efeito de skill mágica
     */
    function spawnMagicEffect(x, y, color = '#a855f7') {
        if (!particles) return;

        // Aura central expandindo
        for (let ring = 0; ring < 3; ring++) {
            for (let i = 0; i < 24; i++) {
                const angle = (Math.PI * 2 * i) / 24;
                const baseRadius = 10 + ring * 20;
                const delay = ring * 0.1;

                setTimeout(() => {
                    particles.push({
                        type: 'explosion',
                        x: x + Math.cos(angle) * baseRadius,
                        y: y + Math.sin(angle) * baseRadius,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        size: 4 + Math.random() * 3,
                        color: color,
                        life: 0.8,
                        decay: 0.03,
                        friction: 0.95,
                        glow: true
                    });
                    triggerRender();
                }, delay * 1000);
            }
        }

        // Partículas subindo
        for (let i = 0; i < 30; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            particles.push({
                type: 'explosion',
                x: x + offsetX,
                y: y + offsetY,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -3 - Math.random() * 3,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.6 ? '#fff' : color,
                life: 1.2,
                decay: 0.02,
                friction: 0.98,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * Efeito de impacto premium (explosão com ondas)
     */
    function spawnImpactBurst(x, y, color = '#ef4444', intensity = 1) {
        if (!particles) return;

        const particleCount = Math.floor(35 * intensity);

        // Explosão principal
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8 * intensity;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                color: Math.random() > 0.4 ? color : '#fff',
                life: 0.9,
                decay: 0.025,
                friction: 0.92,
                glow: true
            });
        }

        // Anel de onda
        for (let i = 0; i < 32; i++) {
            const angle = (Math.PI * 2 * i) / 32;
            const radius = 20;
            particles.push({
                type: 'explosion',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                size: 5,
                color: color,
                life: 0.5,
                decay: 0.06,
                friction: 0.95,
                glow: true
            });
        }

        // Flash central
        particles.push({
            type: 'explosion',
            x, y,
            vx: 0, vy: 0,
            size: 80 * intensity,
            color: 'rgba(255, 255, 255, 0.9)',
            life: 0.25,
            decay: 0.2,
            friction: 1
        });

        triggerRender();
    }

    /**
     * Efeito de cura premium
     */
    function spawnHealEffect(x, y) {
        if (!particles) return;

        // Partículas de cura
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40;
            particles.push({
                type: 'explosion',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -2 - Math.random() * 3,
                size: 4 + Math.random() * 4,
                color: ['#22c55e', '#4ade80', '#86efac'][Math.floor(Math.random() * 3)],
                life: 1.5,
                decay: 0.015,
                friction: 0.98,
                glow: true
            });
        }

        // Sparkles dourados
        for (let i = 0; i < 8; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            particles.push({
                type: 'explosion',
                x: x + offsetX,
                y: y + offsetY,
                vx: 0,
                vy: -1,
                size: 12,
                color: '#fbbf24',
                life: 1,
                decay: 0.02,
                friction: 0.99,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * Efeito de burst ao acertar
     */
    function spawnHitBurstEffect(x, y) {
        if (!particles) return;

        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const speed = 3 + Math.random() * 3;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: i % 2 === 0 ? '#ef4444' : '#fca5a5',
                life: 0.8,
                decay: 0.03,
                friction: 0.9,
                glow: true
            });
        }
        triggerRender();
    }

    /**
     * Efeito de hit em inimigo
     */
    function spawnEnemyHitEffect(x, y, isCrit = false) {
        if (!particles) return;

        const particleCount = isCrit ? 40 : 25;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            particles.push({
                type: 'explosion',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 5,
                color: isCrit ? '#ff0000' : '#ef4444',
                life: 0.9,
                decay: 0.03,
                friction: 0.9,
                glow: true
            });
        }
        triggerRender();
    }

    // ==========================================
    // NÚMEROS FLUTUANTES
    // ==========================================

    /**
     * Mostra número de dano (vermelho)
     */
    function showDamageNumber(x, y, damage, isCrit = false, offsetX = 0, offsetY = 0) {
        if (!floatingTexts || !CONFIG) return;

        const cellSize = CONFIG.CELL_SIZE || 64;
        const worldX = (x - 0.5) * cellSize + offsetX + (Math.random() - 0.5) * 20;
        const worldY = (y - 0.5) * cellSize + offsetY - 30;

        const delay = Math.abs(offsetY) * 3;

        setTimeout(() => {
            floatingTexts.push({
                text: `-${damage}`,
                x: worldX,
                y: worldY,
                life: 1.0,
                color: isCrit ? '#fbbf24' : '#fff',
                size: isCrit ? 52 : 40,
                isCrit: isCrit,
                isDamage: true,
                startY: worldY,
                startTime: performance.now(),
                stroke: true,
                strokeColor: isCrit ? '#7f1d1d' : '#1e1e1e'
            });
            triggerRender();
        }, delay);
    }

    /**
     * Mostra número de cura (verde)
     */
    function showHealNumber(x, y, amount, offsetX = 0, offsetY = 0) {
        if (!floatingTexts || !CONFIG) return;

        const cellSize = CONFIG.CELL_SIZE || 64;
        const worldX = (x - 0.5) * cellSize + offsetX + (Math.random() - 0.5) * 20;
        const worldY = (y - 0.5) * cellSize + offsetY - 30;

        floatingTexts.push({
            text: `+${amount}`,
            x: worldX,
            y: worldY,
            life: 1.0,
            color: '#22c55e',
            size: 40,
            isHeal: true,
            startY: worldY,
            startTime: performance.now(),
            stroke: true,
            strokeColor: '#064e3b',
            glow: '#22c55e'
        });
        triggerRender();
    }

    /**
     * Mostra número de mana (azul)
     */
    function showManaNumber(x, y, amount, offsetX = 0, offsetY = 0) {
        if (!floatingTexts || !CONFIG) return;

        const cellSize = CONFIG.CELL_SIZE || 64;
        const worldX = (x - 0.5) * cellSize + offsetX + (Math.random() - 0.5) * 20;
        const worldY = (y - 0.5) * cellSize + offsetY - 30;

        floatingTexts.push({
            text: `+${amount}`,
            x: worldX,
            y: worldY,
            life: 1.0,
            color: '#3b82f6',
            size: 36,
            isMana: true,
            startY: worldY,
            startTime: performance.now(),
            stroke: true,
            strokeColor: '#1e3a5f',
            glow: '#3b82f6'
        });
        triggerRender();
    }

    /**
     * Mostra texto flutuante genérico
     */
    function showFloatingText(text, x, y, color = '#fff', size = 24) {
        if (!floatingTexts) return;

        floatingTexts.push({
            text,
            x, y,
            life: 1.0,
            color,
            size,
            startY: y,
            startTime: performance.now()
        });
        triggerRender();
    }

    // ==========================================
    // NOVOS EFEITOS PREMIUM
    // ==========================================

    /**
     * EFEITO 1: Thunder Strike - Raio poderoso que cai do céu
     * Efeito de impacto elétrico dramático com múltiplas ondas
     */
    function spawnThunderStrike(x, y, intensity = 1) {
        if (!particles) return;

        const baseY = y - 200; // Começa 200px acima
        const strikes = Math.floor(2 + intensity * 2);

        // Criar múltiplos raios descendentes
        for (let s = 0; s < strikes; s++) {
            const offsetX = (Math.random() - 0.5) * 40;
            const delay = s * 30; // Delay para cada raio

            setTimeout(() => {
                // Raio principal (zigue-zague)
                for (let i = 0; i < 15; i++) {
                    const progress = i / 15;
                    const currentY = baseY + (y - baseY) * progress;
                    const currentX = x + offsetX + Math.sin(progress * Math.PI * 4) * 15;

                    particles.push({
                        type: 'thunder',
                        x: currentX,
                        y: currentY,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        size: 4 + Math.random() * 8,
                        color: Math.random() > 0.3 ? '#60a5fa' : '#fff',
                        life: 0.3 + Math.random() * 0.3,
                        decay: 0.08 + Math.random() * 0.05,
                        friction: 0.85,
                        glow: true
                    });
                }

                // Explosão elétrica no impacto
                for (let i = 0; i < 40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3 + Math.random() * 12;
                    particles.push({
                        type: 'thunder',
                        x: x + offsetX,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2 + Math.random() * 10,
                        color: Math.random() > 0.5 ? '#60a5fa' : (Math.random() > 0.3 ? '#3b82f6' : '#fff'),
                        life: 0.6 + Math.random() * 0.4,
                        decay: 0.02 + Math.random() * 0.03,
                        friction: 0.92,
                        glow: true
                    });
                }

                // Ondas concêntricas elétricas
                for (let wave = 0; wave < 3; wave++) {
                    setTimeout(() => {
                        for (let i = 0; i < 30; i++) {
                            const angle = (Math.PI * 2 * i) / 30;
                            const radius = wave * 25 + 10;
                            particles.push({
                                type: 'thunder',
                                x: x + offsetX + Math.cos(angle) * radius,
                                y: y + Math.sin(angle) * radius,
                                vx: Math.cos(angle) * (2 + wave),
                                vy: Math.sin(angle) * (2 + wave),
                                size: 3 + Math.random() * 5,
                                color: '#93c5fd',
                                life: 0.8,
                                decay: 0.015,
                                friction: 0.95,
                                glow: true
                            });
                        }
                    }, wave * 100);
                }

                triggerRender();
            }, delay);
        }
    }

    /**
     * EFEITO 2: Blood Splash - Explosão visceral de sangue
     * Efeito dramático para críticos ou golpes fatais
     */
    function spawnBloodSplash(x, y, intensity = 1) {
        if (!particles) return;

        // Gota principal (splash central)
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25 + (Math.random() - 0.5) * 0.3;
            const speed = 4 + Math.random() * 8;
            particles.push({
                type: 'blood',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Leve impulso para cima
                size: 4 + Math.random() * 12,
                color: Math.random() > 0.3 ? '#dc2626' : (Math.random() > 0.5 ? '#991b1b' : '#ef4444'),
                life: 1.0,
                decay: 0.008 + Math.random() * 0.012,
                gravity: 0.25, // Sangue cai
                friction: 0.96,
                shape: 'circle'
            });
        }

        // Partículas finas de sangue (spray)
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 6;
            particles.push({
                type: 'blood',
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: '#ef4444',
                life: 0.8 + Math.random() * 0.4,
                decay: 0.01 + Math.random() * 0.02,
                gravity: 0.3,
                friction: 0.94
            });
        }

        // Sangue gotejando para baixo
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const dropX = x + (Math.random() - 0.5) * 30;
                particles.push({
                    type: 'blood',
                    x: dropX,
                    y: y,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 2 + Math.random() * 4,
                    size: 3 + Math.random() * 6,
                    color: '#dc2626',
                    life: 1.2,
                    decay: 0.006,
                    gravity: 0.4, // Gota cai mais rápido
                    friction: 0.9,
                    trail: true // Deixa rastro
                });
            }, i * 50);
        }

        triggerRender();
    }

    /**
     * EFEITO 3: Arcane Explosion - Explosão mágica com ondas concêntricas
     * Efeito premium para skills mágicas poderosas
     */
    function spawnArcaneExplosion(x, y, color = '#a855f7', intensity = 1) {
        if (!particles) return;

        const colors = color === '#a855f7'
            ? ['#a855f7', '#9333ea', '#c084fc', '#e9d5ff', '#f3e8ff']
            : [color, lightenColor(color, 0.2), lightenColor(color, 0.4)];

        // Core explosion (explosão central)
        for (let i = 0; i < 50 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 14;
            particles.push({
                type: 'arcane',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                friction: 0.93,
                glow: true,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }

        // Ondas concêntricas mágicas (3 ondas)
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                const radius = wave * 35 + 15;
                const particlesPerWave = 40;

                for (let i = 0; i < particlesPerWave; i++) {
                    const angle = (Math.PI * 2 * i) / particlesPerWave;
                    const waveX = x + Math.cos(angle) * radius;
                    const waveY = y + Math.sin(angle) * radius;

                    particles.push({
                        type: 'arcane',
                        x: waveX,
                        y: waveY,
                        vx: Math.cos(angle) * (3 + wave * 1.5),
                        vy: Math.sin(angle) * (3 + wave * 1.5),
                        size: 4 + Math.random() * 6,
                        color: colors[wave % colors.length],
                        life: 1.0 - wave * 0.15,
                        decay: 0.012,
                        friction: 0.97,
                        glow: true
                    });
                }
            }, wave * 120);
        }

        // Partículas brilhantes (sparkles)
        for (let i = 0; i < 80 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 8;
            particles.push({
                type: 'arcane',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: '#fff',
                life: 0.6 + Math.random() * 0.4,
                decay: 0.02 + Math.random() * 0.03,
                friction: 0.95,
                glow: true,
                twinkle: true // Pisca
            });
        }

        triggerRender();
    }

    // Helper para clarear cor (se necessário)
    function lightenColor(color, percent) {
        // Implementação simples - retorna cor clara
        return color;
    }

    // ==========================================
    // NOVOS EFEITOS PARA ESPADACHIM (10 EFEITOS PREMIUM)
    // ==========================================

    /**
     * EFEITO 5: Sword Wind - Vento cortante de espada
     * Efeito de corte em arco com partículas de vento
     */
    function spawnSwordWind(x, y, intensity = 1) {
        if (!particles) return;

        const direction = Math.random() > 0.5 ? 1 : -1;
        const arcAngle = Math.PI / 3; // 60 graus

        // Arco de corte principal
        for (let i = 0; i < 20 * intensity; i++) {
            const angle = direction * (-Math.PI / 4) + (Math.random() - 0.5) * arcAngle;
            const speed = 4 + Math.random() * 8;
            const distance = 20 + Math.random() * 40;

            particles.push({
                type: 'sword_wind',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 8,
                color: Math.random() > 0.4 ? '#cbd5e1' : (Math.random() > 0.5 ? '#94a3b8' : '#fff'),
                life: 0.8 + Math.random() * 0.4,
                decay: 0.02 + Math.random() * 0.03,
                friction: 0.93,
                trail: true
            });
        }

        // Partículas de vento (linhas rápidas)
        for (let i = 0; i < 30 * intensity; i++) {
            const angle = direction * (-Math.PI / 4) + (Math.random() - 0.5) * arcAngle;
            const speed = 8 + Math.random() * 12;

            particles.push({
                type: 'sword_wind',
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 3,
                color: '#e2e8f0',
                life: 0.5 + Math.random() * 0.3,
                decay: 0.04,
                friction: 0.9,
                line: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 6: Shield Bash Impact - Impacto poderoso de escudo
     * Efeito de impacto concêntrico com ondas de choque
     */
    function spawnShieldBashImpact(x, y, intensity = 1) {
        if (!particles) return;

        // Impacto central (explosão circular)
        for (let i = 0; i < 40 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            particles.push({
                type: 'shield_bash',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 10,
                color: Math.random() > 0.5 ? '#fbbf24' : (Math.random() > 0.3 ? '#fcd34d' : '#fff'),
                life: 0.9,
                decay: 0.02 + Math.random() * 0.02,
                friction: 0.92,
                glow: true
            });
        }

        // Ondas de choque concêntricas
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                const radius = wave * 25 + 15;
                for (let i = 0; i < 24; i++) {
                    const angle = (Math.PI * 2 * i) / 24;
                    particles.push({
                        type: 'shield_bash',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (1.5 + wave * 0.5),
                        vy: Math.sin(angle) * (1.5 + wave * 0.5),
                        size: 6 + Math.random() * 4,
                        color: '#fbbf24',
                        life: 0.8 - wave * 0.15,
                        decay: 0.015,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 80);
        }
    }

    /**
     * EFEITO 7: Berserk Aura - Aura vermelha de fúria
     * Efeito de aura pulsante com partículas de energia vermelha
     */
    function spawnBerserkAura(x, y, intensity = 1) {
        if (!particles) return;

        // Aura pulsante (múltiplas camadas)
        for (let pulse = 0; pulse < 3; pulse++) {
            setTimeout(() => {
                const radius = 30 + pulse * 20;
                for (let i = 0; i < 40 * intensity; i++) {
                    const angle = (Math.PI * 2 * i) / 40;
                    const offset = (Math.random() - 0.5) * 10;
                    particles.push({
                        type: 'berserk',
                        x: x + Math.cos(angle) * (radius + offset),
                        y: y + Math.sin(angle) * (radius + offset),
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2 - 1, // Leve subida
                        size: 3 + Math.random() * 6,
                        color: Math.random() > 0.4 ? '#dc2626' : (Math.random() > 0.5 ? '#ef4444' : '#fca5a5'),
                        life: 1.0,
                        decay: 0.01 + Math.random() * 0.02,
                        friction: 0.97,
                        glow: true
                    });
                }
                triggerRender();
            }, pulse * 150);
        }

        // Partículas ascendentes de energia
        for (let i = 0; i < 30 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 40;
            particles.push({
                type: 'berserk',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 3,
                vy: -2 - Math.random() * 4, // Sobe
                size: 2 + Math.random() * 5,
                color: '#dc2626',
                life: 0.8 + Math.random() * 0.4,
                decay: 0.015,
                friction: 0.95,
                glow: true
            });
        }
    }

    /**
     * EFEITO 8: Parry Spark - Faíscas de defesa
     * Efeito de defesa bem-sucedida com faíscas metálicas
     */
    function spawnParrySpark(x, y, intensity = 1) {
        if (!particles) return;

        // Faíscas metálicas (explosão radial)
        for (let i = 0; i < 50 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 10;
            particles.push({
                type: 'parry',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#cbd5e1' : (Math.random() > 0.3 ? '#94a3b8' : '#fff'),
                life: 0.4 + Math.random() * 0.3,
                decay: 0.05 + Math.random() * 0.05,
                friction: 0.88,
                spark: true
            });
        }

        // Anel de defesa (onda circular)
        for (let ring = 0; ring < 2; ring++) {
            setTimeout(() => {
                const radius = ring * 30 + 20;
                for (let i = 0; i < 32; i++) {
                    const angle = (Math.PI * 2 * i) / 32;
                    particles.push({
                        type: 'parry',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        size: 4 + Math.random() * 3,
                        color: '#60a5fa',
                        life: 0.6,
                        decay: 0.02,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 100);
        }

        triggerRender();
    }

    /**
     * EFEITO 9: Cleave Wave - Onda de corte em área
     * Efeito de corte horizontal que se expande
     */
    function spawnCleaveWave(x, y, intensity = 1) {
        if (!particles) return;

        const direction = Math.random() > 0.5 ? 1 : -1;
        const waveWidth = 80 + intensity * 40;

        // Onda principal (linha horizontal)
        for (let i = 0; i < 30 * intensity; i++) {
            const offsetX = (Math.random() - 0.5) * waveWidth;
            const speed = direction * (4 + Math.random() * 6);

            particles.push({
                type: 'cleave',
                x: x + offsetX,
                y: y + (Math.random() - 0.5) * 20,
                vx: speed,
                vy: (Math.random() - 0.5) * 2,
                size: 4 + Math.random() * 8,
                color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#dc2626' : '#fca5a5'),
                life: 0.7 + Math.random() * 0.3,
                decay: 0.02 + Math.random() * 0.02,
                friction: 0.91,
                trail: true
            });
        }

        // Partículas de impacto (vertical)
        for (let i = 0; i < 25 * intensity; i++) {
            const offsetX = (Math.random() - 0.5) * waveWidth;
            particles.push({
                type: 'cleave',
                x: x + offsetX,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: -3 - Math.random() * 5, // Sobe
                size: 3 + Math.random() * 6,
                color: '#ef4444',
                life: 0.6,
                decay: 0.03,
                friction: 0.9
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 10: Life Drain - Drenagem de vida vampírica
     * Efeito de energia vermelha sendo sugada
     */
    function spawnLifeDrain(x, y, intensity = 1) {
        if (!particles) return;

        // Partículas sendo sugadas (movimento em espiral)
        for (let i = 0; i < 60 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const startX = x + Math.cos(angle) * distance;
            const startY = y + Math.sin(angle) * distance;

            particles.push({
                type: 'life_drain',
                x: startX,
                y: startY,
                vx: (x - startX) * 0.1 + (Math.random() - 0.5) * 2,
                vy: (y - startY) * 0.1 + (Math.random() - 0.5) * 2,
                size: 2 + Math.random() * 5,
                color: Math.random() > 0.5 ? '#dc2626' : (Math.random() > 0.3 ? '#ef4444' : '#fca5a5'),
                life: 1.0,
                decay: 0.01 + Math.random() * 0.015,
                friction: 0.98,
                spiral: true,
                targetX: x,
                targetY: y,
                glow: true
            });
        }

        // Core pulsante no centro
        for (let pulse = 0; pulse < 3; pulse++) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        type: 'life_drain',
                        x, y,
                        vx: Math.cos(angle) * (2 + pulse),
                        vy: Math.sin(angle) * (2 + pulse),
                        size: 4 + Math.random() * 6,
                        color: '#dc2626',
                        life: 0.5,
                        decay: 0.03,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, pulse * 200);
        }

        triggerRender();
    }

    /**
     * EFEITO 11: Stun Flash - Flash de atordoamento
     * Efeito de flash branco com estrelas
     */
    function spawnStunFlash(x, y, intensity = 1) {
        if (!particles) return;

        // Flash central (explosão branca)
        for (let i = 0; i < 40 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            particles.push({
                type: 'stun',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 10,
                color: Math.random() > 0.3 ? '#fff' : (Math.random() > 0.5 ? '#fbbf24' : '#fcd34d'),
                life: 0.5 + Math.random() * 0.3,
                decay: 0.04 + Math.random() * 0.04,
                friction: 0.9,
                glow: true,
                flash: true
            });
        }

        // Estrelas girando
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const radius = 25 + Math.random() * 15;
            particles.push({
                type: 'stun',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle + Math.PI / 2) * 2,
                vy: Math.sin(angle + Math.PI / 2) * 2,
                size: 4 + Math.random() * 4,
                color: '#fbbf24',
                life: 1.0,
                decay: 0.01,
                friction: 0.98,
                rotate: true,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 12: Bleed Drops - Gotejamento de sangramento
     * Efeito de sangue caindo continuamente
     */
    function spawnBleedDrops(x, y, intensity = 1) {
        if (!particles) return;

        // Gotejamento contínuo (múltiplas ondas)
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                // Gotas grandes caindo
                for (let i = 0; i < 15 * intensity; i++) {
                    const offsetX = (Math.random() - 0.5) * 30;
                    particles.push({
                        type: 'bleed',
                        x: x + offsetX,
                        y: y - 20,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 2 + Math.random() * 4,
                        size: 4 + Math.random() * 8,
                        color: Math.random() > 0.3 ? '#dc2626' : (Math.random() > 0.5 ? '#991b1b' : '#ef4444'),
                        life: 1.0,
                        decay: 0.005 + Math.random() * 0.01,
                        gravity: 0.3,
                        friction: 0.95,
                        shape: 'drop'
                    });
                }

                // Spray fino de sangue
                for (let i = 0; i < 20 * intensity; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 4;
                    particles.push({
                        type: 'bleed',
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed + 1,
                        size: 1 + Math.random() * 3,
                        color: '#dc2626',
                        life: 0.8,
                        decay: 0.01,
                        gravity: 0.2,
                        friction: 0.97
                    });
                }

                triggerRender();
            }, wave * 300);
        }
    }

    /**
     * EFEITO 13: Champion's Aura - Aura dourada de campeão
     * Efeito majestoso para ultimate skills
     */
    function spawnChampionsAura(x, y, intensity = 1) {
        if (!particles) return;

        // Aura dourada pulsante
        for (let pulse = 0; pulse < 4; pulse++) {
            setTimeout(() => {
                const radius = 25 + pulse * 15;
                for (let i = 0; i < 50 * intensity; i++) {
                    const angle = (Math.PI * 2 * i) / 50;
                    const offset = (Math.random() - 0.5) * 8;
                    particles.push({
                        type: 'champion',
                        x: x + Math.cos(angle) * (radius + offset),
                        y: y + Math.sin(angle) * (radius + offset),
                        vx: Math.cos(angle) * 1.5,
                        vy: Math.sin(angle) * 1.5 - 0.5,
                        size: 4 + Math.random() * 6,
                        color: Math.random() > 0.4 ? '#fbbf24' : (Math.random() > 0.5 ? '#fcd34d' : '#fde68a'),
                        life: 1.0,
                        decay: 0.008 + Math.random() * 0.012,
                        friction: 0.98,
                        glow: true
                    });
                }
                triggerRender();
            }, pulse * 200);
        }

        // Partículas ascendentes douradas
        for (let i = 0; i < 40 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50;
            particles.push({
                type: 'champion',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: -3 - Math.random() * 5,
                size: 3 + Math.random() * 5,
                color: '#fbbf24',
                life: 1.0,
                decay: 0.01,
                friction: 0.96,
                glow: true
            });
        }

        // Estrelas douradas
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 40;
            particles.push({
                type: 'champion',
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 1,
                vy: Math.sin(angle) * 1,
                size: 2 + Math.random() * 3,
                color: '#fff',
                life: 1.5,
                decay: 0.005,
                friction: 0.99,
                twinkle: true,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 14: Sword Combo - Combo de múltiplos cortes
     * Efeito de múltiplos slashes rápidos em sequência
     */
    function spawnSwordCombo(x, y, intensity = 1) {
        if (!particles) return;

        const hits = Math.floor(2 + intensity * 2);

        for (let hit = 0; hit < hits; hit++) {
            setTimeout(() => {
                const direction = hit % 2 === 0 ? 1 : -1;
                const angle = direction * (-Math.PI / 4) + (Math.random() - 0.5) * 0.3;
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;

                // Slash principal
                for (let i = 0; i < 15; i++) {
                    const slashAngle = angle + (Math.random() - 0.5) * 0.4;
                    const speed = 5 + Math.random() * 8;
                    const distance = 15 + Math.random() * 25;

                    particles.push({
                        type: 'combo',
                        x: x + offsetX + Math.cos(slashAngle) * distance,
                        y: y + offsetY + Math.sin(slashAngle) * distance,
                        vx: Math.cos(slashAngle) * speed,
                        vy: Math.sin(slashAngle) * speed,
                        size: 4 + Math.random() * 8,
                        color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#dc2626' : '#fca5a5'),
                        life: 0.6 + Math.random() * 0.3,
                        decay: 0.03 + Math.random() * 0.03,
                        friction: 0.9,
                        trail: true
                    });
                }

                // Impacto no centro
                for (let i = 0; i < 10; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 5;
                    particles.push({
                        type: 'combo',
                        x: x + offsetX,
                        y: y + offsetY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 6,
                        color: '#fff',
                        life: 0.4,
                        decay: 0.05,
                        friction: 0.88
                    });
                }

                triggerRender();
            }, hit * 100);
        }
    }

    /**
     * EFEITO 4: Divine Beam - Feixe divino que desce do céu
     * Efeito celestial para habilidades sagradas/ultimate
     */
    function spawnDivineBeam(x, y, intensity = 1) {
        if (!particles) return;

        const beamStartY = y - 300; // Começa 300px acima
        const beamWidth = 40 + intensity * 20;
        const beamDuration = 400; // ms

        // Feixe principal descendente (animado)
        for (let frame = 0; frame < 20; frame++) {
            setTimeout(() => {
                const progress = frame / 20;
                const currentY = beamStartY + (y - beamStartY) * progress;

                // Partículas do feixe (luz intensa)
                for (let i = 0; i < 8; i++) {
                    const offsetX = (Math.random() - 0.5) * beamWidth;
                    particles.push({
                        type: 'divine',
                        x: x + offsetX,
                        y: currentY,
                        vx: (Math.random() - 0.5) * 3,
                        vy: 5 + Math.random() * 5,
                        size: 6 + Math.random() * 12,
                        color: Math.random() > 0.4 ? '#fbbf24' : (Math.random() > 0.5 ? '#fcd34d' : '#fff'),
                        life: 0.4,
                        decay: 0.05,
                        friction: 0.9,
                        glow: true
                    });
                }

                triggerRender();
            }, frame * 20);
        }

        // Explosão divina no impacto
        setTimeout(() => {
            // Core dourado
            for (let i = 0; i < 60 * intensity; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 10;
                particles.push({
                    type: 'divine',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 10,
                    color: Math.random() > 0.5 ? '#fbbf24' : (Math.random() > 0.3 ? '#fcd34d' : '#fff'),
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.02,
                    friction: 0.92,
                    glow: true
                });
            }

            // Anéis de luz concêntricos
            for (let ring = 0; ring < 4; ring++) {
                setTimeout(() => {
                    const radius = ring * 30 + 20;
                    for (let i = 0; i < 36; i++) {
                        const angle = (Math.PI * 2 * i) / 36;
                        particles.push({
                            type: 'divine',
                            x: x + Math.cos(angle) * radius,
                            y: y + Math.sin(angle) * radius,
                            vx: Math.cos(angle) * (2 + ring),
                            vy: Math.sin(angle) * (2 + ring),
                            size: 5 + Math.random() * 5,
                            color: '#fbbf24',
                            life: 1.0 - ring * 0.15,
                            decay: 0.01,
                            friction: 0.98,
                            glow: true
                        });
                    }
                }, ring * 80);
            }

            // Partículas flutuantes (ascensão)
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 80;
                particles.push({
                    type: 'divine',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2 - Math.random() * 4, // Sobe
                    size: 2 + Math.random() * 6,
                    color: '#fcd34d',
                    life: 1.2,
                    decay: 0.008,
                    gravity: -0.1, // Gravidade negativa (flutua)
                    friction: 0.97,
                    glow: true
                });
            }

            triggerRender();
        }, beamDuration);
    }

    // ==========================================
    // NOVOS EFEITOS CRIATIVOS (10 EFEITOS)
    // ==========================================

    /**
     * EFEITO 15: Ice Shatter - Estilhaçamento de gelo
     * Explosão de cristais de gelo em todas as direções
     */
    function spawnIceShatter(x, y, intensity = 1) {
        if (!particles) return;

        // Cristais de gelo explodindo
        for (let i = 0; i < 40 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 10;
            particles.push({
                type: 'ice',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 12,
                color: Math.random() > 0.4 ? '#93c5fd' : (Math.random() > 0.5 ? '#bfdbfe' : '#fff'),
                life: 0.9 + Math.random() * 0.3,
                decay: 0.015 + Math.random() * 0.02,
                friction: 0.92,
                glow: true,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.4
            });
        }

        // Névoa gelada se expandindo
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 24; i++) {
                    const angle = (Math.PI * 2 * i) / 24;
                    const radius = 15 + ring * 25;
                    particles.push({
                        type: 'ice',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (2 + ring),
                        vy: Math.sin(angle) * (2 + ring),
                        size: 6 + Math.random() * 8,
                        color: 'rgba(147, 197, 253, 0.6)',
                        life: 0.7,
                        decay: 0.02,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 100);
        }

        // Flocos de neve caindo lentamente
        for (let i = 0; i < 25; i++) {
            const offsetX = (Math.random() - 0.5) * 80;
            const offsetY = (Math.random() - 0.5) * 40;
            particles.push({
                type: 'ice',
                x: x + offsetX,
                y: y + offsetY - 30,
                vx: (Math.random() - 0.5) * 2,
                vy: 1 + Math.random() * 2,
                size: 2 + Math.random() * 4,
                color: '#fff',
                life: 1.5,
                decay: 0.008,
                friction: 0.98,
                twinkle: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 16: Soul Absorb - Absorção de alma
     * Efeito de partículas esverdeadas sendo sugadas para o centro
     */
    function spawnSoulAbsorb(x, y, intensity = 1) {
        if (!particles) return;

        // Almas sendo puxadas de fora para o centro
        for (let i = 0; i < 70 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 80;
            const startX = x + Math.cos(angle) * distance;
            const startY = y + Math.sin(angle) * distance;

            setTimeout(() => {
                particles.push({
                    type: 'soul',
                    x: startX,
                    y: startY,
                    vx: (x - startX) * 0.08,
                    vy: (y - startY) * 0.08,
                    size: 3 + Math.random() * 7,
                    color: Math.random() > 0.4 ? '#4ade80' : (Math.random() > 0.5 ? '#22c55e' : '#86efac'),
                    life: 1.2,
                    decay: 0.01,
                    friction: 0.97,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, i * 15);
        }

        // Core pulsante no centro
        for (let pulse = 0; pulse < 4; pulse++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        type: 'soul',
                        x, y,
                        vx: Math.cos(angle) * (1 + pulse * 0.5),
                        vy: Math.sin(angle) * (1 + pulse * 0.5),
                        size: 5 + Math.random() * 8,
                        color: '#4ade80',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.92,
                        glow: true
                    });
                }
                triggerRender();
            }, pulse * 250);
        }
    }

    /**
     * EFEITO 17: Dark Vortex - Vórtice das trevas
     * Buraco negro sugando partículas em espiral
     */
    function spawnDarkVortex(x, y, intensity = 1) {
        if (!particles) return;

        // Partículas em espiral descendente
        for (let layer = 0; layer < 4; layer++) {
            setTimeout(() => {
                for (let i = 0; i < 30 * intensity; i++) {
                    const angle = (Math.PI * 2 * i) / 30 + layer * 0.5;
                    const radius = 40 + layer * 20;
                    particles.push({
                        type: 'dark_vortex',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.5, // Perspectiva
                        vx: Math.cos(angle + Math.PI / 2) * 4,
                        vy: Math.sin(angle + Math.PI / 2) * 2,
                        size: 3 + Math.random() * 6,
                        color: Math.random() > 0.5 ? '#581c87' : (Math.random() > 0.3 ? '#7c3aed' : '#a855f7'),
                        life: 1.0,
                        decay: 0.012,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, layer * 150);
        }

        // Centro escuro pulsante (sombras)
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 25;
            particles.push({
                type: 'dark_vortex',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 8 + Math.random() * 16,
                color: 'rgba(0, 0, 0, 0.7)',
                life: 1.5,
                decay: 0.01,
                friction: 0.99
            });
        }

        // Raios de energia escura
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            for (let j = 0; j < 8; j++) {
                const distance = 10 + j * 10;
                particles.push({
                    type: 'dark_vortex',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    size: 3 + Math.random() * 4,
                    color: '#a855f7',
                    life: 0.8,
                    decay: 0.015,
                    friction: 0.95,
                    glow: true
                });
            }
        }

        triggerRender();
    }

    /**
     * EFEITO 18: Phoenix Rise - Renascimento da Fênix
     * Explosão de fogo ascendente com partículas douradas
     */
    function spawnPhoenixRise(x, y, intensity = 1) {
        if (!particles) return;

        // Chamas ascendentes
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 20 * intensity; i++) {
                    const offsetX = (Math.random() - 0.5) * 60;
                    particles.push({
                        type: 'phoenix',
                        x: x + offsetX,
                        y: y + 10,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -5 - Math.random() * 10,
                        size: 6 + Math.random() * 14,
                        color: Math.random() > 0.4 ? '#f97316' : (Math.random() > 0.5 ? '#fbbf24' : '#ef4444'),
                        life: 1.0 + Math.random() * 0.5,
                        decay: 0.012,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 100);
        }

        // Penas douradas flutuando
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 40;
            setTimeout(() => {
                particles.push({
                    type: 'phoenix',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -2 - Math.random() * 3,
                    size: 4 + Math.random() * 6,
                    color: '#fcd34d',
                    life: 1.5,
                    decay: 0.008,
                    friction: 0.97,
                    twinkle: true,
                    glow: true
                });
                triggerRender();
            }, Math.random() * 300);
        }

        // Anéis de fogo
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 24; i++) {
                    const angle = (Math.PI * 2 * i) / 24;
                    const radius = 25 + ring * 20;
                    particles.push({
                        type: 'phoenix',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3 - 2,
                        size: 5 + Math.random() * 5,
                        color: '#f97316',
                        life: 0.7,
                        decay: 0.02,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 120);
        }
    }

    /**
     * EFEITO 19: Earth Quake - Terremoto
     * Ondas de choque no solo com pedras voando
     */
    function spawnEarthQuake(x, y, intensity = 1) {
        if (!particles) return;

        // Ondas de choque horizontais
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                const radius = 30 + wave * 35;
                for (let i = 0; i < 40; i++) {
                    const angle = (Math.PI * 2 * i) / 40;
                    particles.push({
                        type: 'earth',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.3, // Perspectiva horizontal
                        vx: Math.cos(angle) * (3 + wave),
                        vy: Math.sin(angle) * (1 + wave * 0.3),
                        size: 4 + Math.random() * 8,
                        color: Math.random() > 0.4 ? '#78350f' : (Math.random() > 0.5 ? '#a16207' : '#ca8a04'),
                        life: 0.8,
                        decay: 0.02,
                        friction: 0.93,
                        glow: false
                    });
                }
                triggerRender();
            }, wave * 100);
        }

        // Pedras voando para cima
        for (let i = 0; i < 35 * intensity; i++) {
            const offsetX = (Math.random() - 0.5) * 80;
            particles.push({
                type: 'earth',
                x: x + offsetX,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: -4 - Math.random() * 8,
                size: 6 + Math.random() * 14,
                color: Math.random() > 0.5 ? '#57534e' : '#78716c',
                life: 1.2,
                decay: 0.01,
                gravity: 0.3,
                friction: 0.95
            });
        }

        // Poeira/partículas de terra
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                type: 'earth',
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5,
                size: 2 + Math.random() * 5,
                color: 'rgba(161, 98, 7, 0.6)',
                life: 1.0,
                decay: 0.01,
                friction: 0.96
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 20: Spirit Blast - Explosão espiritual
     * Energia azul/branca irradiando do centro
     */
    function spawnSpiritBlast(x, y, intensity = 1) {
        if (!particles) return;

        // Core explosion branca intensa
        for (let i = 0; i < 50 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 12;
            particles.push({
                type: 'spirit',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 10,
                color: Math.random() > 0.3 ? '#e0f2fe' : (Math.random() > 0.5 ? '#bae6fd' : '#fff'),
                life: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                friction: 0.93,
                glow: true
            });
        }

        // Anéis de energia
        for (let ring = 0; ring < 5; ring++) {
            setTimeout(() => {
                const radius = ring * 30 + 20;
                for (let i = 0; i < 32; i++) {
                    const angle = (Math.PI * 2 * i) / 32;
                    particles.push({
                        type: 'spirit',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (2 + ring * 0.8),
                        vy: Math.sin(angle) * (2 + ring * 0.8),
                        size: 4 + Math.random() * 6,
                        color: '#7dd3fc',
                        life: 1.0 - ring * 0.12,
                        decay: 0.01,
                        friction: 0.97,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 80);
        }

        // Partículas ascendentes (almas)
        for (let i = 0; i < 30; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            particles.push({
                type: 'spirit',
                x: x + offsetX,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -3 - Math.random() * 5,
                size: 3 + Math.random() * 5,
                color: '#fff',
                life: 1.5,
                decay: 0.008,
                friction: 0.97,
                twinkle: true,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 21: Poison Cloud - Nuvem de veneno
     * Névoa verde tóxica que se expande lentamente
     */
    function spawnPoisonCloud(x, y, intensity = 1) {
        if (!particles) return;

        // Nuvem principal (partículas grandes e lentas)
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 25 * intensity; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 3;
                    const distance = Math.random() * 20;
                    particles.push({
                        type: 'poison',
                        x: x + Math.cos(angle) * distance,
                        y: y + Math.sin(angle) * distance,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 0.5,
                        size: 15 + Math.random() * 25,
                        color: `rgba(74, 222, 128, ${0.3 + Math.random() * 0.3})`,
                        life: 1.5 + Math.random() * 0.5,
                        decay: 0.006,
                        friction: 0.98
                    });
                }
                triggerRender();
            }, wave * 200);
        }

        // Bolhas tóxicas
        for (let i = 0; i < 20; i++) {
            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 30;
            setTimeout(() => {
                particles.push({
                    type: 'poison',
                    x: x + offsetX,
                    y: y + offsetY,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -1 - Math.random() * 2,
                    size: 4 + Math.random() * 8,
                    color: '#22c55e',
                    life: 1.0,
                    decay: 0.015,
                    friction: 0.98,
                    glow: true
                });
                triggerRender();
            }, Math.random() * 500);
        }

        // Salpicos de veneno
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                type: 'poison',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 5,
                color: '#4ade80',
                life: 0.8,
                decay: 0.02,
                friction: 0.92,
                gravity: 0.15
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 22: Shadow Strike - Ataque das sombras
     * Cortes negros rápidos com rastros escuros
     */
    function spawnShadowStrike(x, y, intensity = 1) {
        if (!particles) return;

        const slashes = Math.floor(3 + intensity * 2);

        for (let slash = 0; slash < slashes; slash++) {
            setTimeout(() => {
                const direction = slash % 2 === 0 ? 1 : -1;
                const angle = direction * (-Math.PI / 4) + (slash * 0.3);
                const offsetX = (Math.random() - 0.5) * 30;
                const offsetY = (Math.random() - 0.5) * 30;

                // Rastro do corte
                for (let i = 0; i < 20; i++) {
                    const distance = i * 6 - 60;
                    const fade = 1 - Math.abs(i - 10) / 10;
                    particles.push({
                        type: 'shadow',
                        x: x + offsetX + Math.cos(angle) * distance,
                        y: y + offsetY + Math.sin(angle) * distance,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: (8 + Math.random() * 12) * fade,
                        color: Math.random() > 0.3 ? '#1e1e1e' : '#3f3f46',
                        life: 0.4 + Math.random() * 0.2,
                        decay: 0.06,
                        friction: 0.88
                    });
                }

                // Sombras dispersas
                for (let i = 0; i < 15; i++) {
                    const sAngle = angle + (Math.random() - 0.5) * 0.8;
                    const speed = 4 + Math.random() * 8;
                    particles.push({
                        type: 'shadow',
                        x: x + offsetX,
                        y: y + offsetY,
                        vx: Math.cos(sAngle) * speed * direction,
                        vy: Math.sin(sAngle) * speed,
                        size: 3 + Math.random() * 6,
                        color: '#18181b',
                        life: 0.5,
                        decay: 0.04,
                        friction: 0.9
                    });
                }

                triggerRender();
            }, slash * 80);
        }
    }

    /**
     * EFEITO 23: Celestial Rain - Chuva celestial
     * Partículas douradas/prateadas descendo do céu
     */
    function spawnCelestialRain(x, y, intensity = 1) {
        if (!particles) return;

        const rainDuration = 600;
        const dropCount = Math.floor(80 * intensity);

        // Gotas celestiais caindo
        for (let i = 0; i < dropCount; i++) {
            const delay = Math.random() * rainDuration;
            const offsetX = (Math.random() - 0.5) * 120;

            setTimeout(() => {
                particles.push({
                    type: 'celestial',
                    x: x + offsetX,
                    y: y - 150,
                    vx: (Math.random() - 0.5) * 1,
                    vy: 6 + Math.random() * 6,
                    size: 3 + Math.random() * 6,
                    color: Math.random() > 0.5 ? '#fbbf24' : (Math.random() > 0.5 ? '#fcd34d' : '#fff'),
                    life: 0.8,
                    decay: 0.02,
                    friction: 0.98,
                    trail: true,
                    glow: true
                });
                triggerRender();
            }, delay);
        }

        // Brilhos no ponto de impacto
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 4;
                    particles.push({
                        type: 'celestial',
                        x: x + (Math.random() - 0.5) * 60,
                        y: y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 2,
                        size: 4 + Math.random() * 6,
                        color: '#fcd34d',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.92,
                        glow: true
                    });
                }
                triggerRender();
            }, 200 + wave * 200);
        }

        // Aura dourada no chão
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 50;
                particles.push({
                    type: 'celestial',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance * 0.3,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -1 - Math.random() * 2,
                    size: 5 + Math.random() * 8,
                    color: 'rgba(251, 191, 36, 0.5)',
                    life: 1.0,
                    decay: 0.01,
                    friction: 0.98,
                    glow: true
                });
            }
            triggerRender();
        }, rainDuration);
    }

    /**
     * EFEITO 24: Nova Explosion - Explosão Nova
     * Super explosão com ondas de choque múltiplas
     */
    function spawnNovaExplosion(x, y, intensity = 1) {
        if (!particles) return;

        // Flash central INTENSO
        particles.push({
            type: 'nova',
            x, y,
            vx: 0, vy: 0,
            size: 120 * intensity,
            color: 'rgba(255, 255, 255, 0.95)',
            life: 0.2,
            decay: 0.25,
            friction: 1
        });

        // Explosão principal (múltiplas camadas)
        for (let layer = 0; layer < 3; layer++) {
            const particleCount = Math.floor((60 - layer * 10) * intensity);
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (8 + Math.random() * 12) * (1 - layer * 0.2);
                particles.push({
                    type: 'nova',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * (12 - layer * 3),
                    color: Math.random() > 0.3 ? '#fff' : (Math.random() > 0.5 ? '#fbbf24' : '#f97316'),
                    life: 1.0 + layer * 0.2,
                    decay: 0.012 + layer * 0.005,
                    friction: 0.91 + layer * 0.02,
                    glow: true
                });
            }
        }

        // Ondas de choque concêntricas (múltiplas)
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                const radius = wave * 35 + 20;
                const particlesPerRing = Math.floor(40 - wave * 4);
                for (let i = 0; i < particlesPerRing; i++) {
                    const angle = (Math.PI * 2 * i) / particlesPerRing;
                    particles.push({
                        type: 'nova',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (4 + wave),
                        vy: Math.sin(angle) * (4 + wave),
                        size: 6 + Math.random() * 6,
                        color: wave < 3 ? '#fff' : '#fbbf24',
                        life: 0.8 - wave * 0.08,
                        decay: 0.015,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 60);
        }

        // Faíscas extras
        for (let i = 0; i < 80 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 15;
            setTimeout(() => {
                particles.push({
                    type: 'nova',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 1 + Math.random() * 3,
                    color: Math.random() > 0.5 ? '#fef3c7' : '#fff',
                    life: 0.5 + Math.random() * 0.5,
                    decay: 0.03,
                    friction: 0.88,
                    spark: true
                });
                triggerRender();
            }, Math.random() * 200);
        }

        triggerRender();
    }

    // ==========================================
    // EFEITOS ÚNICOS E CRIATIVOS (8 EFEITOS)
    // Usando técnicas visuais diferentes de partículas simples
    // ==========================================

    /**
     * EFEITO 25: Magic Circle - Círculo mágico rotativo
     * Desenha um círculo rúnico que gira e pulsa
     */
    function spawnMagicCircle(x, y, intensity = 1) {
        if (!particles) return;

        const duration = 1500; // ms
        const segments = 12;
        const rings = 3;
        const baseRadius = 50;

        // Criar múltiplos anéis do círculo mágico
        for (let ring = 0; ring < rings; ring++) {
            const radius = baseRadius + ring * 25;
            const rotationOffset = ring * (Math.PI / 6);

            // Segmentos do círculo (linhas conectadas)
            for (let seg = 0; seg < segments; seg++) {
                const startAngle = (Math.PI * 2 * seg) / segments + rotationOffset;
                const endAngle = (Math.PI * 2 * (seg + 1)) / segments + rotationOffset;

                // Criar linha de partículas formando o segmento
                for (let j = 0; j < 8; j++) {
                    const t = j / 8;
                    const angle = startAngle + (endAngle - startAngle) * t;

                    setTimeout(() => {
                        particles.push({
                            type: 'magic_circle',
                            x: x + Math.cos(angle) * radius,
                            y: y + Math.sin(angle) * radius,
                            vx: Math.cos(angle + Math.PI / 2) * 0.5 * (ring % 2 === 0 ? 1 : -1),
                            vy: Math.sin(angle + Math.PI / 2) * 0.5 * (ring % 2 === 0 ? 1 : -1),
                            size: 4 + ring * 2,
                            color: ring === 0 ? '#a855f7' : (ring === 1 ? '#c084fc' : '#e9d5ff'),
                            life: 1.2,
                            decay: 0.008,
                            friction: 0.995,
                            glow: true
                        });
                        triggerRender();
                    }, seg * 30 + ring * 100);
                }
            }
        }

        // Runas nos pontos cardinais
        const runePositions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        runePositions.forEach((angle, i) => {
            const radius = baseRadius + 10;
            setTimeout(() => {
                // Runa central
                for (let r = 0; r < 3; r++) {
                    const runeAngle = angle + (r - 1) * 0.2;
                    particles.push({
                        type: 'magic_circle',
                        x: x + Math.cos(runeAngle) * radius,
                        y: y + Math.sin(runeAngle) * radius,
                        vx: 0,
                        vy: -1,
                        size: 10 + Math.random() * 8,
                        color: '#fff',
                        life: 1.5,
                        decay: 0.01,
                        friction: 0.98,
                        glow: true,
                        twinkle: true
                    });
                }
                triggerRender();
            }, 400 + i * 150);
        });

        // Centro pulsante
        for (let pulse = 0; pulse < 5; pulse++) {
            setTimeout(() => {
                const pulseRadius = 10 + pulse * 8;
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20;
                    particles.push({
                        type: 'magic_circle',
                        x: x + Math.cos(angle) * pulseRadius,
                        y: y + Math.sin(angle) * pulseRadius,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        size: 3,
                        color: '#a855f7',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, pulse * 200);
        }
    }

    /**
     * EFEITO 26: Chain Lightning - Relâmpagos em cadeia
     * Arcos elétricos que saltam entre pontos aleatórios
     */
    function spawnChainLightning(x, y, intensity = 1) {
        if (!particles) return;

        const chainCount = 4 + Math.floor(intensity * 2);
        const points = [{ x, y }];

        // Gerar pontos de destino para os arcos
        for (let i = 0; i < chainCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 60;
            points.push({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance
            });
        }

        // Desenhar arcos entre pontos consecutivos
        for (let chain = 0; chain < points.length - 1; chain++) {
            const start = points[chain];
            const end = points[chain + 1];

            setTimeout(() => {
                // Criar raio com zigue-zague
                const segments = 8;
                const dx = (end.x - start.x) / segments;
                const dy = (end.y - start.y) / segments;

                for (let seg = 0; seg <= segments; seg++) {
                    const offsetX = seg === 0 || seg === segments ? 0 : (Math.random() - 0.5) * 30;
                    const offsetY = seg === 0 || seg === segments ? 0 : (Math.random() - 0.5) * 30;

                    particles.push({
                        type: 'chain_lightning',
                        x: start.x + dx * seg + offsetX,
                        y: start.y + dy * seg + offsetY,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        size: 6 + Math.random() * 8,
                        color: Math.random() > 0.3 ? '#60a5fa' : '#fff',
                        life: 0.25,
                        decay: 0.12,
                        friction: 0.8,
                        glow: true
                    });

                    // Faíscas secundárias
                    if (Math.random() > 0.5) {
                        for (let s = 0; s < 3; s++) {
                            const sparkAngle = Math.random() * Math.PI * 2;
                            particles.push({
                                type: 'chain_lightning',
                                x: start.x + dx * seg + offsetX,
                                y: start.y + dy * seg + offsetY,
                                vx: Math.cos(sparkAngle) * (4 + Math.random() * 4),
                                vy: Math.sin(sparkAngle) * (4 + Math.random() * 4),
                                size: 2 + Math.random() * 3,
                                color: '#93c5fd',
                                life: 0.2,
                                decay: 0.15,
                                friction: 0.85
                            });
                        }
                    }
                }

                // Flash no ponto de impacto
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        type: 'chain_lightning',
                        x: end.x,
                        y: end.y,
                        vx: Math.cos(angle) * (3 + Math.random() * 5),
                        vy: Math.sin(angle) * (3 + Math.random() * 5),
                        size: 4 + Math.random() * 5,
                        color: '#60a5fa',
                        life: 0.4,
                        decay: 0.06,
                        friction: 0.9,
                        glow: true
                    });
                }

                triggerRender();
            }, chain * 80);
        }
    }

    /**
     * EFEITO 27: Shockwave Pulse - Pulso de onda de choque
     * Anéis concêntricos que se expandem rapidamente
     */
    function spawnShockwavePulse(x, y, intensity = 1) {
        if (!particles) return;

        const waveCount = 5;

        for (let wave = 0; wave < waveCount; wave++) {
            setTimeout(() => {
                const particlesPerRing = 60 - wave * 8;
                const maxRadius = 100 + wave * 30;
                const speed = 8 + wave * 2;

                // Criar anel de partículas que se expande
                for (let i = 0; i < particlesPerRing; i++) {
                    const angle = (Math.PI * 2 * i) / particlesPerRing;
                    const startRadius = 5;

                    particles.push({
                        type: 'shockwave',
                        x: x + Math.cos(angle) * startRadius,
                        y: y + Math.sin(angle) * startRadius,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: wave === 0 ? 8 : (6 - wave),
                        color: wave === 0 ? '#fff' : (wave < 3 ? '#fbbf24' : '#f97316'),
                        life: 0.6,
                        decay: 0.03,
                        friction: 0.96,
                        glow: wave < 2
                    });
                }

                // Flash central para cada onda
                if (wave < 3) {
                    particles.push({
                        type: 'shockwave',
                        x, y,
                        vx: 0, vy: 0,
                        size: 40 - wave * 10,
                        color: `rgba(255, 255, 255, ${0.8 - wave * 0.2})`,
                        life: 0.15,
                        decay: 0.3,
                        friction: 1
                    });
                }

                triggerRender();
            }, wave * 70);
        }

        // Partículas de debris subindo após o impacto
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 40;
                particles.push({
                    type: 'shockwave',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -4 - Math.random() * 6,
                    size: 3 + Math.random() * 5,
                    color: '#fcd34d',
                    life: 1.0,
                    decay: 0.015,
                    gravity: 0.2,
                    friction: 0.96
                });
            }
            triggerRender();
        }, 150);
    }

    /**
     * EFEITO 28: Meteor Strike - Impacto de meteoro
     * Projétil descendente com rastro de fogo
     */
    function spawnMeteorStrike(x, y, intensity = 1) {
        if (!particles) return;

        const startX = x - 80;
        const startY = y - 150;
        const frames = 20;
        const meteorSize = 20 + intensity * 10;

        // Trajeto do meteoro descendo
        for (let frame = 0; frame < frames; frame++) {
            const progress = frame / frames;
            const currentX = startX + (x - startX) * progress;
            const currentY = startY + (y - startY) * progress;

            setTimeout(() => {
                // Corpo do meteoro
                particles.push({
                    type: 'meteor',
                    x: currentX,
                    y: currentY,
                    vx: 2,
                    vy: 4,
                    size: meteorSize * (1 - progress * 0.3),
                    color: '#f97316',
                    life: 0.4,
                    decay: 0.08,
                    friction: 0.9,
                    glow: true
                });

                // Rastro de fogo
                for (let trail = 0; trail < 8; trail++) {
                    const trailX = currentX - trail * 4 + (Math.random() - 0.5) * 10;
                    const trailY = currentY - trail * 8 + (Math.random() - 0.5) * 10;
                    particles.push({
                        type: 'meteor',
                        x: trailX,
                        y: trailY,
                        vx: -1 + (Math.random() - 0.5) * 2,
                        vy: -2 + (Math.random() - 0.5) * 2,
                        size: 4 + Math.random() * 8,
                        color: Math.random() > 0.5 ? '#fbbf24' : '#ef4444',
                        life: 0.3 + Math.random() * 0.2,
                        decay: 0.06,
                        friction: 0.92,
                        glow: true
                    });
                }

                // Fagulhas
                for (let spark = 0; spark < 4; spark++) {
                    const sparkAngle = Math.PI + (Math.random() - 0.5) * 0.8;
                    particles.push({
                        type: 'meteor',
                        x: currentX,
                        y: currentY,
                        vx: Math.cos(sparkAngle) * (3 + Math.random() * 4),
                        vy: Math.sin(sparkAngle) * (3 + Math.random() * 4),
                        size: 2 + Math.random() * 3,
                        color: '#fef3c7',
                        life: 0.2,
                        decay: 0.1,
                        friction: 0.88
                    });
                }

                triggerRender();
            }, frame * 20);
        }

        // Explosão de impacto
        setTimeout(() => {
            // Explosão central
            for (let i = 0; i < 60; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 12;
                particles.push({
                    type: 'meteor',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 10,
                    color: Math.random() > 0.4 ? '#f97316' : (Math.random() > 0.5 ? '#fbbf24' : '#dc2626'),
                    life: 0.8,
                    decay: 0.02,
                    friction: 0.92,
                    glow: true
                });
            }

            // Onda de choque
            for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 * i) / 40;
                particles.push({
                    type: 'meteor',
                    x: x + Math.cos(angle) * 20,
                    y: y + Math.sin(angle) * 20,
                    vx: Math.cos(angle) * 10,
                    vy: Math.sin(angle) * 10,
                    size: 6,
                    color: '#fbbf24',
                    life: 0.5,
                    decay: 0.04,
                    friction: 0.94,
                    glow: true
                });
            }

            // Flash
            particles.push({
                type: 'meteor',
                x, y,
                vx: 0, vy: 0,
                size: 100,
                color: 'rgba(255, 255, 255, 0.9)',
                life: 0.2,
                decay: 0.25,
                friction: 1
            });

            triggerRender();
        }, frames * 20);
    }

    /**
     * EFEITO 29: Mirror Images - Imagens espelhadas
     * Cópias fantasmagóricas se separando do ponto central
     */
    function spawnMirrorImages(x, y, intensity = 1) {
        if (!particles) return;

        const imageCount = 4 + Math.floor(intensity * 2);
        const directions = [];

        // Calcular direções uniformemente distribuídas
        for (let i = 0; i < imageCount; i++) {
            directions.push((Math.PI * 2 * i) / imageCount);
        }

        // Flash central inicial
        for (let i = 0; i < 20; i++) {
            particles.push({
                type: 'mirror',
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 8 + Math.random() * 8,
                color: 'rgba(147, 197, 253, 0.8)',
                life: 0.5,
                decay: 0.04,
                friction: 0.95,
                glow: true
            });
        }

        // Criar cada imagem espelhada
        directions.forEach((angle, i) => {
            const distance = 80;
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance;

            // Trail da imagem se movendo
            for (let frame = 0; frame < 15; frame++) {
                const progress = frame / 15;
                const currentX = x + (endX - x) * progress;
                const currentY = y + (endY - y) * progress;

                setTimeout(() => {
                    // Corpo da imagem fantasma
                    const ghostSize = 25 * (1 - progress * 0.4);
                    particles.push({
                        type: 'mirror',
                        x: currentX,
                        y: currentY,
                        vx: Math.cos(angle) * 0.5,
                        vy: Math.sin(angle) * 0.5,
                        size: ghostSize,
                        color: `rgba(96, 165, 250, ${0.6 - progress * 0.3})`,
                        life: 0.6,
                        decay: 0.02,
                        friction: 0.98,
                        glow: true
                    });

                    // Partículas de energia ao redor
                    for (let p = 0; p < 3; p++) {
                        const pAngle = Math.random() * Math.PI * 2;
                        particles.push({
                            type: 'mirror',
                            x: currentX + Math.cos(pAngle) * 10,
                            y: currentY + Math.sin(pAngle) * 10,
                            vx: Math.cos(pAngle) * 2,
                            vy: Math.sin(pAngle) * 2,
                            size: 3 + Math.random() * 4,
                            color: '#93c5fd',
                            life: 0.4,
                            decay: 0.05,
                            friction: 0.9,
                            glow: true
                        });
                    }

                    triggerRender();
                }, i * 50 + frame * 20);
            }

            // Explosão de desaparecimento no destino
            setTimeout(() => {
                for (let p = 0; p < 15; p++) {
                    const pAngle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 4;
                    particles.push({
                        type: 'mirror',
                        x: endX,
                        y: endY,
                        vx: Math.cos(pAngle) * speed,
                        vy: Math.sin(pAngle) * speed,
                        size: 4 + Math.random() * 6,
                        color: '#60a5fa',
                        life: 0.5,
                        decay: 0.04,
                        friction: 0.92,
                        glow: true
                    });
                }
                triggerRender();
            }, i * 50 + 350);
        });
    }

    /**
     * EFEITO 30: Pentagram Summon - Invocação de pentagrama
     * Estrela de 5 pontas aparecendo progressivamente
     */
    function spawnPentagramSummon(x, y, intensity = 1) {
        if (!particles) return;

        const radius = 60 + intensity * 20;
        const points = 5;
        const vertices = [];

        // Calcular vértices do pentagrama
        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 * i) / points - Math.PI / 2;
            vertices.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius
            });
        }

        // Desenhar linhas do pentagrama (pulando um vértice)
        const drawOrder = [0, 2, 4, 1, 3, 0];

        for (let line = 0; line < drawOrder.length - 1; line++) {
            const start = vertices[drawOrder[line]];
            const end = vertices[drawOrder[line + 1]];

            setTimeout(() => {
                // Linha de partículas
                const segments = 15;
                for (let seg = 0; seg <= segments; seg++) {
                    const progress = seg / segments;
                    const px = start.x + (end.x - start.x) * progress;
                    const py = start.y + (end.y - start.y) * progress;

                    particles.push({
                        type: 'pentagram',
                        x: px,
                        y: py,
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1,
                        size: 5 + Math.random() * 4,
                        color: Math.random() > 0.3 ? '#dc2626' : '#fca5a5',
                        life: 1.2,
                        decay: 0.008,
                        friction: 0.99,
                        glow: true
                    });
                }

                // Vértices brilhantes
                particles.push({
                    type: 'pentagram',
                    x: end.x,
                    y: end.y,
                    vx: 0,
                    vy: 0,
                    size: 15,
                    color: '#fff',
                    life: 1.0,
                    decay: 0.01,
                    friction: 1,
                    glow: true,
                    twinkle: true
                });

                triggerRender();
            }, line * 150);
        }

        // Círculo externo
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                const angle = (Math.PI * 2 * i) / 50;
                particles.push({
                    type: 'pentagram',
                    x: x + Math.cos(angle) * (radius + 10),
                    y: y + Math.sin(angle) * (radius + 10),
                    vx: Math.cos(angle) * 0.3,
                    vy: Math.sin(angle) * 0.3,
                    size: 4,
                    color: '#ef4444',
                    life: 1.5,
                    decay: 0.006,
                    friction: 0.99,
                    glow: true
                });
            }
            triggerRender();
        }, 800);

        // Energia central pulsante
        for (let pulse = 0; pulse < 4; pulse++) {
            setTimeout(() => {
                for (let i = 0; i < 25; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 30;
                    particles.push({
                        type: 'pentagram',
                        x: x + Math.cos(angle) * dist,
                        y: y + Math.sin(angle) * dist,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random() * 3,
                        size: 4 + Math.random() * 6,
                        color: '#dc2626',
                        life: 0.8,
                        decay: 0.02,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, 1000 + pulse * 200);
        }
    }

    /**
     * EFEITO 31: Time Warp - Distorção temporal
     * Espiral que converge ao centro como um buraco no tempo
     */
    function spawnTimeWarp(x, y, intensity = 1) {
        if (!particles) return;

        const spiralArms = 4;
        const particlesPerArm = 20;
        const maxRadius = 100;

        // Criar braços espirais
        for (let arm = 0; arm < spiralArms; arm++) {
            const armOffset = (Math.PI * 2 * arm) / spiralArms;

            for (let i = 0; i < particlesPerArm; i++) {
                const progress = i / particlesPerArm;
                const radius = maxRadius * (1 - progress);
                const angle = armOffset + progress * Math.PI * 3; // 1.5 voltas

                setTimeout(() => {
                    particles.push({
                        type: 'time_warp',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: (x - (x + Math.cos(angle) * radius)) * 0.03,
                        vy: (y - (y + Math.sin(angle) * radius)) * 0.03,
                        size: 4 + (1 - progress) * 10,
                        color: Math.random() > 0.5 ? '#60a5fa' : (Math.random() > 0.5 ? '#a855f7' : '#fff'),
                        life: 1.5 - progress,
                        decay: 0.01,
                        friction: 0.97,
                        spiral: true,
                        targetX: x,
                        targetY: y,
                        glow: true
                    });
                    triggerRender();
                }, arm * 100 + i * 30);
            }
        }

        // Centro com distorção
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                // Anel contraindo
                const waveRadius = 30 - wave * 4;
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20 + wave * 0.3;
                    particles.push({
                        type: 'time_warp',
                        x: x + Math.cos(angle) * waveRadius,
                        y: y + Math.sin(angle) * waveRadius,
                        vx: -Math.cos(angle) * 2,
                        vy: -Math.sin(angle) * 2,
                        size: 5,
                        color: wave % 2 === 0 ? '#60a5fa' : '#c084fc',
                        life: 0.6,
                        decay: 0.03,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, 600 + wave * 100);
        }

        // Flash final de colapso
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 6 + Math.random() * 8;
                particles.push({
                    type: 'time_warp',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 6,
                    color: '#fff',
                    life: 0.5,
                    decay: 0.04,
                    friction: 0.9,
                    glow: true
                });
            }
            triggerRender();
        }, 1300);
    }

    /**
     * EFEITO 32: Laser Beam - Feixe de laser concentrado
     * Linha de energia intensa com brilho pulsante
     */
    function spawnLaserBeam(x, y, intensity = 1, angle) {
        if (!particles) return;

        const beamAngle = (angle !== undefined && !isNaN(angle)) ? angle : (Math.random() * Math.PI * 2);
        const beamLength = 120 + intensity * 40;
        const endX = x + Math.cos(beamAngle) * beamLength;
        const endY = y + Math.sin(beamAngle) * beamLength;

        const beamDuration = 400;
        const pulseCount = 3;

        // Criar o feixe principal
        for (let pulse = 0; pulse < pulseCount; pulse++) {
            setTimeout(() => {
                // Núcleo do laser (linha central brilhante)
                const segments = 25;
                for (let seg = 0; seg <= segments; seg++) {
                    const progress = seg / segments;
                    const px = x + (endX - x) * progress;
                    const py = y + (endY - y) * progress;

                    // Centro branco intenso
                    particles.push({
                        type: 'laser',
                        x: px,
                        y: py,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: 6 + Math.sin(progress * Math.PI) * 3,
                        color: '#fff',
                        life: 0.2,
                        decay: 0.15,
                        friction: 0.98,
                        glow: true
                    });

                    // Aura colorida ao redor
                    particles.push({
                        type: 'laser',
                        x: px + (Math.random() - 0.5) * 8,
                        y: py + (Math.random() - 0.5) * 8,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: 8 + Math.random() * 6,
                        color: Math.random() > 0.5 ? '#ef4444' : '#f97316',
                        life: 0.25,
                        decay: 0.1,
                        friction: 0.9,
                        glow: true
                    });
                }

                triggerRender();
            }, pulse * 100);
        }

        // Faíscas ao longo do feixe
        for (let i = 0; i < 30; i++) {
            const progress = Math.random();
            const sparkX = x + (endX - x) * progress;
            const sparkY = y + (endY - y) * progress;

            setTimeout(() => {
                const perpAngle = beamAngle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
                particles.push({
                    type: 'laser',
                    x: sparkX,
                    y: sparkY,
                    vx: Math.cos(perpAngle) * (3 + Math.random() * 4),
                    vy: Math.sin(perpAngle) * (3 + Math.random() * 4),
                    size: 2 + Math.random() * 4,
                    color: '#fef3c7',
                    life: 0.3,
                    decay: 0.06,
                    friction: 0.88
                });
                triggerRender();
            }, Math.random() * beamDuration);
        }

        // Impacto no final do feixe
        setTimeout(() => {
            for (let i = 0; i < 25; i++) {
                const impactAngle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 6;
                particles.push({
                    type: 'laser',
                    x: endX,
                    y: endY,
                    vx: Math.cos(impactAngle) * speed,
                    vy: Math.sin(impactAngle) * speed,
                    size: 4 + Math.random() * 6,
                    color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24',
                    life: 0.5,
                    decay: 0.04,
                    friction: 0.92,
                    glow: true
                });
            }

            // Flash no ponto de impacto
            particles.push({
                type: 'laser',
                x: endX,
                y: endY,
                vx: 0, vy: 0,
                size: 50,
                color: 'rgba(255, 255, 255, 0.9)',
                life: 0.15,
                decay: 0.3,
                friction: 1
            });

            triggerRender();
        }, beamDuration * 0.8);

        // Origem do laser (ponto de disparo)
        for (let i = 0; i < 15; i++) {
            const originAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
            particles.push({
                type: 'laser',
                x: x,
                y: y,
                vx: Math.cos(originAngle) * (2 + Math.random() * 3),
                vy: Math.sin(originAngle) * (2 + Math.random() * 3),
                size: 3 + Math.random() * 4,
                color: '#fcd34d',
                life: 0.4,
                decay: 0.05,
                friction: 0.9,
                glow: true
            });
        }

        triggerRender();
    }

    // ==========================================
    // EFEITOS ÉPICOS BATCH 3 (10 EFEITOS)
    // ==========================================

    /**
     * EFEITO 33: Tornado Vortex - Funil de vento giratório
     * Tornado ascendente que suga partículas
     */
    function spawnTornadoVortex(x, y, intensity = 1) {
        if (!particles) return;

        const height = 150;
        const duration = 1200;
        const layers = 20;

        // Criar o funil do tornado de baixo para cima
        for (let layer = 0; layer < layers; layer++) {
            const progress = layer / layers;
            const layerY = y - progress * height;
            const radius = 15 + (1 - progress) * 40; // Mais largo na base

            setTimeout(() => {
                // Partículas girando nesse nível
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 * i) / 12 + layer * 0.3;
                    particles.push({
                        type: 'tornado',
                        x: x + Math.cos(angle) * radius,
                        y: layerY,
                        vx: Math.cos(angle + Math.PI / 2) * (4 + progress * 3),
                        vy: -2 - Math.random() * 3,
                        size: 4 + (1 - progress) * 8,
                        color: Math.random() > 0.5 ? '#94a3b8' : (Math.random() > 0.5 ? '#cbd5e1' : '#64748b'),
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.96,
                        glow: false
                    });
                }
                triggerRender();
            }, layer * 40);
        }

        // Debris sendo sugados
        for (let i = 0; i < 40; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const startDist = 80 + Math.random() * 60;

            setTimeout(() => {
                particles.push({
                    type: 'tornado',
                    x: x + Math.cos(startAngle) * startDist,
                    y: y + Math.sin(startAngle) * 20,
                    vx: (x - (x + Math.cos(startAngle) * startDist)) * 0.05,
                    vy: -3 - Math.random() * 5,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.5 ? '#78716c' : '#a8a29e',
                    life: 1.5,
                    decay: 0.01,
                    friction: 0.98,
                    spiral: true,
                    targetX: x,
                    targetY: y - height
                });
                triggerRender();
            }, Math.random() * duration);
        }

        // Poeira na base
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        type: 'tornado',
                        x: x + Math.cos(angle) * (30 + Math.random() * 30),
                        y: y,
                        vx: Math.cos(angle) * (1 + Math.random() * 2),
                        vy: -1 - Math.random() * 2,
                        size: 6 + Math.random() * 10,
                        color: 'rgba(148, 163, 184, 0.5)',
                        life: 0.6,
                        decay: 0.02,
                        friction: 0.95
                    });
                }
                triggerRender();
            }, wave * 250);
        }
    }

    /**
     * EFEITO 34: Black Hole - Buraco negro gravitacional
     * Singularidade que puxa tudo ao centro e colapsa
     */
    function spawnBlackHole(x, y, intensity = 1) {
        if (!particles) return;

        // Criar evento horizon (borda do buraco negro)
        for (let ring = 0; ring < 8; ring++) {
            setTimeout(() => {
                const radius = 50 - ring * 5;
                const particlesInRing = 30 - ring * 2;

                for (let i = 0; i < particlesInRing; i++) {
                    const angle = (Math.PI * 2 * i) / particlesInRing + ring * 0.2;
                    particles.push({
                        type: 'blackhole',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle + Math.PI / 2) * (3 - ring * 0.3),
                        vy: Math.sin(angle + Math.PI / 2) * (3 - ring * 0.3),
                        size: 4 + ring,
                        color: ring < 3 ? '#7c3aed' : (ring < 5 ? '#581c87' : '#1e1b4b'),
                        life: 1.5,
                        decay: 0.008,
                        friction: 0.99,
                        glow: ring < 4
                    });
                }
                triggerRender();
            }, ring * 80);
        }

        // Centro escuro absoluto
        particles.push({
            type: 'blackhole',
            x, y,
            vx: 0, vy: 0,
            size: 40,
            color: '#000',
            life: 2.0,
            decay: 0.005,
            friction: 1
        });

        // Partículas sendo sugadas de todas as direções
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 80;

            setTimeout(() => {
                particles.push({
                    type: 'blackhole',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.06,
                    vy: (y - (y + Math.sin(angle) * distance)) * 0.06,
                    size: 2 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#a855f7' : (Math.random() > 0.5 ? '#c084fc' : '#fff'),
                    life: 1.0,
                    decay: 0.015,
                    friction: 0.97,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, i * 15);
        }

        // Colapso final e explosão
        setTimeout(() => {
            for (let i = 0; i < 60; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 8 + Math.random() * 12;
                particles.push({
                    type: 'blackhole',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.3 ? '#a855f7' : '#fff',
                    life: 0.6,
                    decay: 0.03,
                    friction: 0.92,
                    glow: true
                });
            }
            triggerRender();
        }, 1500);
    }

    /**
     * EFEITO 35: Dragon Breath - Baforada de dragão
     * Cone de fogo emanando em uma direção
     */
    function spawnDragonBreath(x, y, intensity = 1) {
        if (!particles) return;

        const direction = Math.random() * Math.PI * 2;
        const coneAngle = Math.PI / 3; // 60 graus
        const range = 120;
        const waves = 15;

        for (let wave = 0; wave < waves; wave++) {
            setTimeout(() => {
                const progress = wave / waves;
                const currentRange = range * progress;
                const spread = coneAngle * progress;

                // Chamas no cone
                for (let i = 0; i < 15; i++) {
                    const angle = direction + (Math.random() - 0.5) * spread;
                    const dist = currentRange * (0.5 + Math.random() * 0.5);

                    particles.push({
                        type: 'dragonbreath',
                        x: x + Math.cos(angle) * dist,
                        y: y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * (5 + Math.random() * 5),
                        vy: Math.sin(angle) * (5 + Math.random() * 5),
                        size: 8 + Math.random() * 16 * (1 - progress * 0.5),
                        color: Math.random() > 0.3 ? '#f97316' : (Math.random() > 0.5 ? '#fbbf24' : '#ef4444'),
                        life: 0.5 + Math.random() * 0.3,
                        decay: 0.03,
                        friction: 0.94,
                        glow: true
                    });
                }

                // Fumaça escura
                for (let i = 0; i < 5; i++) {
                    const angle = direction + (Math.random() - 0.5) * spread * 0.8;
                    const dist = currentRange;
                    particles.push({
                        type: 'dragonbreath',
                        x: x + Math.cos(angle) * dist,
                        y: y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * 2 + (Math.random() - 0.5) * 2,
                        vy: Math.sin(angle) * 2 - 1,
                        size: 15 + Math.random() * 20,
                        color: `rgba(55, 48, 39, ${0.4 + Math.random() * 0.3})`,
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.97
                    });
                }

                triggerRender();
            }, wave * 40);
        }

        // Origem com fogo intenso
        for (let i = 0; i < 20; i++) {
            const originAngle = direction + (Math.random() - 0.5) * 0.5;
            particles.push({
                type: 'dragonbreath',
                x, y,
                vx: Math.cos(originAngle) * (3 + Math.random() * 3),
                vy: Math.sin(originAngle) * (3 + Math.random() * 3),
                size: 10 + Math.random() * 12,
                color: '#fcd34d',
                life: 0.4,
                decay: 0.05,
                friction: 0.9,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 36: Healing Rain - Chuva de cura
     * Gotas de água mágica descendo com brilho
     */
    function spawnHealingRain(x, y, intensity = 1) {
        if (!particles) return;

        const rainDuration = 1000;
        const dropCount = 100;
        const areaWidth = 100;

        // Gotas caindo
        for (let i = 0; i < dropCount; i++) {
            const delay = Math.random() * rainDuration;
            const offsetX = (Math.random() - 0.5) * areaWidth;

            setTimeout(() => {
                // Gota principal
                particles.push({
                    type: 'healrain',
                    x: x + offsetX,
                    y: y - 120,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: 4 + Math.random() * 4,
                    size: 3 + Math.random() * 4,
                    color: Math.random() > 0.3 ? '#4ade80' : (Math.random() > 0.5 ? '#86efac' : '#fff'),
                    life: 0.8,
                    decay: 0.02,
                    friction: 0.99,
                    trail: true,
                    glow: true
                });
                triggerRender();
            }, delay);
        }

        // Splash no chão
        for (let splash = 0; splash < 8; splash++) {
            setTimeout(() => {
                const splashX = x + (Math.random() - 0.5) * areaWidth;
                for (let i = 0; i < 8; i++) {
                    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
                    particles.push({
                        type: 'healrain',
                        x: splashX,
                        y: y,
                        vx: Math.cos(angle) * (2 + Math.random() * 3),
                        vy: Math.sin(angle) * (2 + Math.random() * 3),
                        size: 2 + Math.random() * 4,
                        color: '#4ade80',
                        life: 0.4,
                        decay: 0.05,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, 200 + splash * 100);
        }

        // Aura de cura no chão
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 50;
                particles.push({
                    type: 'healrain',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist * 0.3,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -1 - Math.random() * 2,
                    size: 5 + Math.random() * 8,
                    color: 'rgba(74, 222, 128, 0.6)',
                    life: 1.0,
                    decay: 0.01,
                    friction: 0.98,
                    glow: true,
                    twinkle: true
                });
            }
            triggerRender();
        }, rainDuration);
    }

    /**
     * EFEITO 37: Earthquake Fissure - Fissura no solo
     * Rachadura abrindo no chão com debris
     */
    function spawnEarthquakeFissure(x, y, intensity = 1) {
        if (!particles) return;

        const fissureLength = 120;
        const segments = 12;
        const direction = Math.random() > 0.5 ? 0 : Math.PI / 2; // Horizontal ou vertical

        // Criar a rachadura progressivamente
        for (let seg = 0; seg < segments; seg++) {
            const progress = (seg - segments / 2) / segments;
            const segX = x + Math.cos(direction) * progress * fissureLength;
            const segY = y + Math.sin(direction) * progress * fissureLength;
            const offset = (Math.random() - 0.5) * 15;

            setTimeout(() => {
                // Linha da fissura
                for (let i = 0; i < 6; i++) {
                    particles.push({
                        type: 'fissure',
                        x: segX + Math.cos(direction + Math.PI / 2) * offset,
                        y: segY + Math.sin(direction + Math.PI / 2) * offset,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        size: 6 + Math.random() * 8,
                        color: Math.random() > 0.5 ? '#292524' : '#44403c',
                        life: 1.5,
                        decay: 0.006,
                        friction: 0.99
                    });
                }

                // Pedras voando
                for (let i = 0; i < 4; i++) {
                    const rockAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
                    particles.push({
                        type: 'fissure',
                        x: segX,
                        y: segY,
                        vx: Math.cos(rockAngle) * (2 + Math.random() * 4),
                        vy: -4 - Math.random() * 6,
                        size: 5 + Math.random() * 10,
                        color: Math.random() > 0.5 ? '#78716c' : '#57534e',
                        life: 1.0,
                        decay: 0.01,
                        gravity: 0.25,
                        friction: 0.95
                    });
                }

                // Poeira subindo
                for (let i = 0; i < 6; i++) {
                    particles.push({
                        type: 'fissure',
                        x: segX + (Math.random() - 0.5) * 20,
                        y: segY,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -2 - Math.random() * 3,
                        size: 8 + Math.random() * 12,
                        color: 'rgba(120, 113, 108, 0.5)',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.96
                    });
                }

                triggerRender();
            }, Math.abs(progress) * 300);
        }

        // Ondas de choque sísmicas
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30;
                    const radius = 20 + wave * 30;
                    particles.push({
                        type: 'fissure',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.4,
                        vx: Math.cos(angle) * (3 + wave),
                        vy: Math.sin(angle) * (1 + wave * 0.3),
                        size: 4 + Math.random() * 4,
                        color: '#a16207',
                        life: 0.5,
                        decay: 0.03,
                        friction: 0.94
                    });
                }
                triggerRender();
            }, wave * 150);
        }
    }

    /**
     * EFEITO 38: Sword Storm - Tempestade de espadas
     * Múltiplas lâminas girando ao redor
     */
    function spawnSwordStorm(x, y, intensity = 1) {
        if (!particles) return;

        const bladeCount = 6 + Math.floor(intensity * 2);
        const duration = 1200;
        const maxRadius = 70;

        // Cada lâmina girando
        for (let blade = 0; blade < bladeCount; blade++) {
            const startAngle = (Math.PI * 2 * blade) / bladeCount;
            const rotationSpeed = 0.15 + Math.random() * 0.1;
            const rotationDir = blade % 2 === 0 ? 1 : -1;

            // Animação de cada lâmina
            for (let frame = 0; frame < 30; frame++) {
                setTimeout(() => {
                    const progress = frame / 30;
                    const currentAngle = startAngle + progress * Math.PI * 2 * rotationDir;
                    const radius = maxRadius * Math.sin(progress * Math.PI); // Expande e contrai

                    // Trail da lâmina (linha de partículas)
                    for (let t = 0; t < 5; t++) {
                        const trailAngle = currentAngle - t * 0.2 * rotationDir;
                        const trailRadius = radius * (1 - t * 0.1);

                        particles.push({
                            type: 'swordstorm',
                            x: x + Math.cos(trailAngle) * trailRadius,
                            y: y + Math.sin(trailAngle) * trailRadius,
                            vx: Math.cos(trailAngle + Math.PI / 2) * 2 * rotationDir,
                            vy: Math.sin(trailAngle + Math.PI / 2) * 2 * rotationDir,
                            size: (6 - t) + Math.random() * 3,
                            color: t === 0 ? '#fff' : (t < 2 ? '#e5e7eb' : '#9ca3af'),
                            life: 0.3,
                            decay: 0.08,
                            friction: 0.9,
                            glow: t === 0
                        });
                    }

                    triggerRender();
                }, blade * 30 + frame * 40);
            }
        }

        // Faíscas centrais
        for (let spark = 0; spark < 4; spark++) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3 + Math.random() * 5;
                    particles.push({
                        type: 'swordstorm',
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2 + Math.random() * 4,
                        color: '#fef3c7',
                        life: 0.3,
                        decay: 0.06,
                        friction: 0.88
                    });
                }
                triggerRender();
            }, 200 + spark * 300);
        }
    }

    /**
     * EFEITO 39: Holy Explosion - Explosão divina radiante
     * Luz sagrada explodindo em raios
     */
    function spawnHolyExplosion(x, y, intensity = 1) {
        if (!particles) return;

        // Flash central massivo
        particles.push({
            type: 'holy',
            x, y,
            vx: 0, vy: 0,
            size: 150,
            color: 'rgba(255, 255, 255, 0.95)',
            life: 0.15,
            decay: 0.35,
            friction: 1
        });

        // Raios de luz saindo em todas as direções
        const rayCount = 12;
        for (let ray = 0; ray < rayCount; ray++) {
            const angle = (Math.PI * 2 * ray) / rayCount;
            const rayLength = 100 + Math.random() * 40;

            setTimeout(() => {
                // Cada raio é uma linha de partículas
                for (let seg = 0; seg < 15; seg++) {
                    const progress = seg / 15;
                    const dist = rayLength * progress;

                    particles.push({
                        type: 'holy',
                        x: x + Math.cos(angle) * dist,
                        y: y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * (3 + progress * 4),
                        vy: Math.sin(angle) * (3 + progress * 4),
                        size: 8 - progress * 4,
                        color: Math.random() > 0.3 ? '#fcd34d' : '#fff',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, ray * 30);
        }

        // Símbolos sagrados flutuando (cruzes/estrelas)
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;

            setTimeout(() => {
                particles.push({
                    type: 'holy',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2 - Math.random() * 3,
                    size: 10 + Math.random() * 10,
                    color: '#fbbf24',
                    life: 1.2,
                    decay: 0.008,
                    friction: 0.97,
                    glow: true,
                    twinkle: true
                });
                triggerRender();
            }, 200 + i * 50);
        }

        // Ondas concêntricas de luz
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                const radius = 30 + wave * 25;
                for (let i = 0; i < 36; i++) {
                    const angle = (Math.PI * 2 * i) / 36;
                    particles.push({
                        type: 'holy',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (3 + wave),
                        vy: Math.sin(angle) * (3 + wave),
                        size: 5,
                        color: wave < 2 ? '#fff' : '#fcd34d',
                        life: 0.5,
                        decay: 0.03,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, 100 + wave * 80);
        }

        triggerRender();
    }

    /**
     * EFEITO 40: Poison Nova - Nova de veneno
     * Onda tóxica expandindo com bolhas
     */
    function spawnPoisonNova(x, y, intensity = 1) {
        if (!particles) return;

        // Onda tóxica principal
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                const radius = 20 + wave * 25;
                const particlesInWave = 40 - wave * 4;

                for (let i = 0; i < particlesInWave; i++) {
                    const angle = (Math.PI * 2 * i) / particlesInWave + wave * 0.1;
                    particles.push({
                        type: 'poisonnova',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (4 + wave * 0.5),
                        vy: Math.sin(angle) * (4 + wave * 0.5),
                        size: 8 + Math.random() * 8,
                        color: Math.random() > 0.3 ? '#22c55e' : (Math.random() > 0.5 ? '#4ade80' : '#86efac'),
                        life: 0.8 - wave * 0.08,
                        decay: 0.02,
                        friction: 0.95,
                        glow: wave < 3
                    });
                }
                triggerRender();
            }, wave * 70);
        }

        // Bolhas tóxicas subindo
        for (let bubble = 0; bubble < 25; bubble++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 60;

            setTimeout(() => {
                particles.push({
                    type: 'poisonnova',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2 - Math.random() * 3,
                    size: 6 + Math.random() * 12,
                    color: '#4ade80',
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.98,
                    glow: true
                });
                triggerRender();
            }, Math.random() * 600);
        }

        // Nuvem residual
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 80;
                particles.push({
                    type: 'poisonnova',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 1,
                    vy: (Math.random() - 0.5) * 1 - 0.5,
                    size: 15 + Math.random() * 20,
                    color: `rgba(74, 222, 128, ${0.2 + Math.random() * 0.2})`,
                    life: 1.5,
                    decay: 0.006,
                    friction: 0.99
                });
            }
            triggerRender();
        }, 500);
    }

    /**
     * EFEITO 41: Frost Nova - Nova de gelo
     * Expansão cristalina de gelo
     */
    function spawnFrostNova(x, y, intensity = 1) {
        if (!particles) return;

        // Flash central gelado
        particles.push({
            type: 'frostnova',
            x, y,
            vx: 0, vy: 0,
            size: 80,
            color: 'rgba(147, 197, 253, 0.8)',
            life: 0.2,
            decay: 0.2,
            friction: 1,
            glow: true
        });

        // Cristais de gelo irradiando
        const crystalCount = 8;
        for (let crystal = 0; crystal < crystalCount; crystal++) {
            const angle = (Math.PI * 2 * crystal) / crystalCount;
            const length = 80 + Math.random() * 30;

            setTimeout(() => {
                // Cada cristal é uma linha pontiaguda
                for (let seg = 0; seg < 12; seg++) {
                    const progress = seg / 12;
                    const width = (1 - progress) * 10;

                    particles.push({
                        type: 'frostnova',
                        x: x + Math.cos(angle) * (length * progress),
                        y: y + Math.sin(angle) * (length * progress),
                        vx: Math.cos(angle) * (5 + progress * 3),
                        vy: Math.sin(angle) * (5 + progress * 3),
                        size: 4 + width,
                        color: Math.random() > 0.3 ? '#93c5fd' : '#fff',
                        life: 0.7,
                        decay: 0.02,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, crystal * 40);
        }

        // Flocos de neve
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;

            particles.push({
                type: 'frostnova',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 5,
                color: '#fff',
                life: 1.0,
                decay: 0.012,
                friction: 0.96,
                twinkle: true,
                glow: true
            });
        }

        // Chão congelando (onda horizontal)
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                const radius = 30 + wave * 25;
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30;
                    particles.push({
                        type: 'frostnova',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.3,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 1,
                        size: 5 + Math.random() * 5,
                        color: '#bfdbfe',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 100);
        }

        triggerRender();
    }

    /**
     * EFEITO 42: Warcry Roar - Grito de guerra
     * Onda sonora circular com impacto visual
     */
    function spawnWarcryRoar(x, y, intensity = 1) {
        if (!particles) return;

        // Ondas sonoras expandindo
        for (let wave = 0; wave < 8; wave++) {
            setTimeout(() => {
                const radius = 20 + wave * 20;
                const particlesInWave = 50 - wave * 4;

                for (let i = 0; i < particlesInWave; i++) {
                    const angle = (Math.PI * 2 * i) / particlesInWave;
                    const wobble = Math.sin(i * 0.5 + wave) * 5;

                    particles.push({
                        type: 'warcry',
                        x: x + Math.cos(angle) * (radius + wobble),
                        y: y + Math.sin(angle) * (radius + wobble),
                        vx: Math.cos(angle) * (6 + wave * 0.5),
                        vy: Math.sin(angle) * (6 + wave * 0.5),
                        size: 4 + (8 - wave),
                        color: wave < 3 ? '#fbbf24' : (wave < 5 ? '#f97316' : '#ef4444'),
                        life: 0.4,
                        decay: 0.05,
                        friction: 0.94,
                        glow: wave < 4
                    });
                }
                triggerRender();
            }, wave * 50);
        }

        // Centro do grito (explosão de energia)
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 4 + Math.random() * 6;
                    particles.push({
                        type: 'warcry',
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 5 + Math.random() * 8,
                        color: '#fcd34d',
                        life: 0.5,
                        decay: 0.04,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, burst * 100);
        }

        // Linhas de impacto radiantes
        const lineCount = 6;
        for (let line = 0; line < lineCount; line++) {
            const angle = (Math.PI * 2 * line) / lineCount + Math.PI / lineCount;

            for (let seg = 0; seg < 10; seg++) {
                setTimeout(() => {
                    const dist = 30 + seg * 12;
                    particles.push({
                        type: 'warcry',
                        x: x + Math.cos(angle) * dist,
                        y: y + Math.sin(angle) * dist,
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4,
                        size: 8 - seg * 0.5,
                        color: '#fbbf24',
                        life: 0.4,
                        decay: 0.06,
                        friction: 0.92,
                        glow: true
                    });
                    triggerRender();
                }, line * 30 + seg * 20);
            }
        }
        triggerRender();
    }

    // ==========================================
    // EFEITOS DE CAIR O QUEIXO - BATCH 1 (10)
    // ==========================================

    /**
     * EFEITO 43: Galaxy Spiral - Galáxia em espiral
     * Formação galáctica com estrelas orbitando
     */
    function spawnGalaxySpiral(x, y, intensity = 1) {
        if (!particles) return;

        const arms = 3;
        const starsPerArm = 40;
        const maxRadius = 100;

        // Criar braços espirais da galáxia
        for (let arm = 0; arm < arms; arm++) {
            const armOffset = (Math.PI * 2 * arm) / arms;

            for (let star = 0; star < starsPerArm; star++) {
                const progress = star / starsPerArm;
                const radius = maxRadius * progress;
                const angle = armOffset + progress * Math.PI * 2.5;

                setTimeout(() => {
                    // Estrelas principais
                    particles.push({
                        type: 'galaxy',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.4, // Perspectiva inclinada
                        vx: Math.cos(angle + Math.PI / 2) * (1 + progress),
                        vy: Math.sin(angle + Math.PI / 2) * 0.3,
                        size: 2 + Math.random() * 5 * (1 - progress * 0.5),
                        color: Math.random() > 0.7 ? '#fff' : (Math.random() > 0.5 ? '#93c5fd' : (Math.random() > 0.3 ? '#fcd34d' : '#c084fc')),
                        life: 2.0,
                        decay: 0.006,
                        friction: 0.995,
                        twinkle: true,
                        glow: true
                    });
                    triggerRender();
                }, arm * 50 + star * 20);
            }
        }

        // Núcleo brilhante
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 20;
            particles.push({
                type: 'galaxy',
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist * 0.4,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.3,
                size: 3 + Math.random() * 8,
                color: Math.random() > 0.5 ? '#fef3c7' : '#fff',
                life: 2.5,
                decay: 0.004,
                friction: 0.99,
                glow: true
            });
        }

        // Poeira cósmica
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 80;
            particles.push({
                type: 'galaxy',
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist * 0.4,
                vx: Math.cos(angle + Math.PI / 2) * 0.3,
                vy: Math.sin(angle + Math.PI / 2) * 0.15,
                size: 1 + Math.random() * 2,
                color: `rgba(168, 85, 247, ${0.3 + Math.random() * 0.4})`,
                life: 2.0,
                decay: 0.005,
                friction: 0.99
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 44: Samurai Slash - Cortes de samurai
     * Múltiplos cortes em X com efeito de tinta
     */
    function spawnSamuraiSlash(x, y, intensity = 1) {
        if (!particles) return;

        const slashPatterns = [
            { start: -Math.PI / 4, end: Math.PI * 3 / 4 },      // Diagonal \
            { start: Math.PI / 4, end: -Math.PI * 3 / 4 },     // Diagonal /
            { start: 0, end: Math.PI },                          // Horizontal
        ];

        slashPatterns.forEach((pattern, index) => {
            setTimeout(() => {
                const length = 100;
                const segments = 20;

                // Linha principal do corte (estilo tinta)
                for (let seg = 0; seg < segments; seg++) {
                    const progress = seg / segments;
                    const angle = pattern.start + (pattern.end - pattern.start) * progress;
                    const dist = (progress - 0.5) * length;
                    const thickness = Math.sin(progress * Math.PI) * 12 + 2;

                    particles.push({
                        type: 'samurai',
                        x: x + Math.cos(pattern.start) * dist,
                        y: y + Math.sin(pattern.start) * dist,
                        vx: Math.cos(pattern.start + Math.PI / 2) * (Math.random() - 0.5) * 3,
                        vy: Math.sin(pattern.start + Math.PI / 2) * (Math.random() - 0.5) * 3,
                        size: thickness,
                        color: '#1a1a1a',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.92
                    });

                    // Brilho branco na borda
                    if (seg % 3 === 0) {
                        particles.push({
                            type: 'samurai',
                            x: x + Math.cos(pattern.start) * dist,
                            y: y + Math.sin(pattern.start) * dist,
                            vx: Math.cos(pattern.start) * 8,
                            vy: Math.sin(pattern.start) * 8,
                            size: 3 + Math.random() * 3,
                            color: '#fff',
                            life: 0.3,
                            decay: 0.1,
                            friction: 0.85,
                            glow: true
                        });
                    }
                }

                // Respingos de "tinta"
                for (let i = 0; i < 15; i++) {
                    const splashAngle = pattern.start + (Math.random() - 0.5) * 0.5;
                    const splashDist = (Math.random() - 0.5) * length * 0.8;
                    particles.push({
                        type: 'samurai',
                        x: x + Math.cos(pattern.start) * splashDist,
                        y: y + Math.sin(pattern.start) * splashDist,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6 + 2,
                        size: 3 + Math.random() * 6,
                        color: '#0a0a0a',
                        life: 0.8,
                        decay: 0.015,
                        gravity: 0.15,
                        friction: 0.94
                    });
                }

                triggerRender();
            }, index * 120);
        });

        // Flash de impacto final
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 8;
                particles.push({
                    type: 'samurai',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    color: '#dc2626',
                    life: 0.4,
                    decay: 0.06,
                    friction: 0.9,
                    glow: true
                });
            }
            triggerRender();
        }, 400);
    }

    /**
     * EFEITO 45: Supernova - Explosão estelar massiva
     * Colapso seguido de explosão cósmica
     */
    function spawnSupernova(x, y, intensity = 1) {
        if (!particles) return;

        // Fase 1: Colapso (partículas sendo sugadas)
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 50;

            setTimeout(() => {
                particles.push({
                    type: 'supernova',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.1,
                    vy: (y - (y + Math.sin(angle) * distance)) * 0.1,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#60a5fa' : '#fff',
                    life: 0.6,
                    decay: 0.02,
                    friction: 0.96,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, i * 10);
        }

        // Fase 2: Flash e explosão
        setTimeout(() => {
            // Flash massivo
            particles.push({
                type: 'supernova',
                x, y,
                vx: 0, vy: 0,
                size: 200,
                color: 'rgba(255, 255, 255, 1)',
                life: 0.15,
                decay: 0.4,
                friction: 1
            });

            // Explosão principal
            for (let i = 0; i < 150; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 8 + Math.random() * 20;
                const colorChoice = Math.random();
                particles.push({
                    type: 'supernova',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 12,
                    color: colorChoice > 0.6 ? '#fff' : (colorChoice > 0.3 ? '#fbbf24' : (colorChoice > 0.15 ? '#f97316' : '#60a5fa')),
                    life: 1.2,
                    decay: 0.01,
                    friction: 0.95,
                    glow: true
                });
            }

            triggerRender();
        }, 700);

        // Fase 3: Ondas de choque múltiplas
        for (let wave = 0; wave < 8; wave++) {
            setTimeout(() => {
                const radius = wave * 30;
                for (let i = 0; i < 50; i++) {
                    const angle = (Math.PI * 2 * i) / 50;
                    particles.push({
                        type: 'supernova',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (8 + wave * 2),
                        vy: Math.sin(angle) * (8 + wave * 2),
                        size: 6 - wave * 0.5,
                        color: wave < 3 ? '#fff' : (wave < 5 ? '#fbbf24' : '#f97316'),
                        life: 0.5,
                        decay: 0.04,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, 750 + wave * 50);
        }
    }

    /**
     * EFEITO 46: Vampire Bite - Mordida vampírica
     * Presas e drenagem de sangue
     */
    function spawnVampireBite(x, y, intensity = 1) {
        if (!particles) return;

        // Presas descendo
        const fangPositions = [-15, 15];
        fangPositions.forEach((offset, i) => {
            for (let f = 0; f < 8; f++) {
                setTimeout(() => {
                    particles.push({
                        type: 'vampire',
                        x: x + offset,
                        y: y - 30 + f * 5,
                        vx: 0,
                        vy: 3,
                        size: 8 - f * 0.5,
                        color: '#fff',
                        life: 0.4,
                        decay: 0.08,
                        friction: 0.9,
                        glow: true
                    });
                    triggerRender();
                }, i * 50 + f * 20);
            }
        });

        // Sangue espirrando no impacto
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
                const speed = 3 + Math.random() * 8;
                particles.push({
                    type: 'vampire',
                    x: x + (Math.random() - 0.5) * 30,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.3 ? '#dc2626' : '#991b1b',
                    life: 0.8,
                    decay: 0.015,
                    gravity: 0.2,
                    friction: 0.95
                });
            }
            triggerRender();
        }, 250);

        // Energia sendo drenada (espiral vermelha)
        setTimeout(() => {
            for (let spiral = 0; spiral < 30; spiral++) {
                const angle = spiral * 0.4;
                const radius = 40 + spiral * 2;

                setTimeout(() => {
                    particles.push({
                        type: 'vampire',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: (x - (x + Math.cos(angle) * radius)) * 0.08,
                        vy: (y - (y + Math.sin(angle) * radius)) * 0.08,
                        size: 4 + Math.random() * 5,
                        color: '#dc2626',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.97,
                        spiral: true,
                        targetX: x,
                        targetY: y,
                        glow: true
                    });
                    triggerRender();
                }, spiral * 25);
            }
        }, 400);

        // Aura sombria
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 30;
            particles.push({
                type: 'vampire',
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 2,
                size: 10 + Math.random() * 15,
                color: 'rgba(88, 28, 135, 0.4)',
                life: 1.2,
                decay: 0.008,
                friction: 0.98
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 47: Lightning Storm - Tempestade de relâmpagos
     * Múltiplos raios caindo simultaneamente
     */
    function spawnLightningStorm(x, y, intensity = 1) {
        if (!particles) return;

        const boltCount = 5 + Math.floor(intensity * 3);
        const area = 120;

        for (let bolt = 0; bolt < boltCount; bolt++) {
            const boltX = x + (Math.random() - 0.5) * area;
            const boltY = y + (Math.random() - 0.5) * area * 0.3;

            setTimeout(() => {
                // Cada raio individual
                const startY = boltY - 180;
                const segments = 12;

                for (let seg = 0; seg <= segments; seg++) {
                    const progress = seg / segments;
                    const currentY = startY + (boltY - startY) * progress;
                    const zigzag = seg > 0 && seg < segments ? (Math.random() - 0.5) * 25 : 0;

                    particles.push({
                        type: 'storm',
                        x: boltX + zigzag,
                        y: currentY,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        size: 8 + Math.random() * 6,
                        color: Math.random() > 0.3 ? '#fff' : '#60a5fa',
                        life: 0.2,
                        decay: 0.15,
                        friction: 0.8,
                        glow: true
                    });
                }

                // Impacto no chão
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3 + Math.random() * 8;
                    particles.push({
                        type: 'storm',
                        x: boltX,
                        y: boltY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 5,
                        color: '#93c5fd',
                        life: 0.4,
                        decay: 0.06,
                        friction: 0.9,
                        glow: true
                    });
                }

                // Flash
                particles.push({
                    type: 'storm',
                    x: boltX, y: boltY,
                    vx: 0, vy: 0,
                    size: 60,
                    color: 'rgba(255, 255, 255, 0.8)',
                    life: 0.1,
                    decay: 0.5,
                    friction: 1
                });

                triggerRender();
            }, bolt * 80 + Math.random() * 100);
        }
    }

    /**
     * EFEITO 48: Dimension Rift - Fenda dimensional
     * Portal rasgando a realidade
     */
    function spawnDimensionRift(x, y, intensity = 1) {
        if (!particles) return;

        // Fenda central se abrindo
        for (let frame = 0; frame < 20; frame++) {
            setTimeout(() => {
                const height = 80 + frame * 4;
                const width = 2 + frame * 2;

                // Bordas da fenda
                for (let edge = 0; edge < 2; edge++) {
                    const edgeX = x + (edge === 0 ? -width : width);
                    for (let i = 0; i < 8; i++) {
                        const offsetY = (i - 4) * (height / 8);
                        particles.push({
                            type: 'rift',
                            x: edgeX + (Math.random() - 0.5) * 5,
                            y: y + offsetY,
                            vx: (edge === 0 ? -1 : 1) * (1 + Math.random()),
                            vy: (Math.random() - 0.5) * 2,
                            size: 4 + Math.random() * 6,
                            color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
                            life: 0.5,
                            decay: 0.04,
                            friction: 0.92,
                            glow: true
                        });
                    }
                }

                // Interior escuro com estrelas
                if (frame > 10) {
                    for (let i = 0; i < 5; i++) {
                        particles.push({
                            type: 'rift',
                            x: x + (Math.random() - 0.5) * width * 1.5,
                            y: y + (Math.random() - 0.5) * height * 0.8,
                            vx: (Math.random() - 0.5) * 1,
                            vy: (Math.random() - 0.5) * 1,
                            size: 2 + Math.random() * 4,
                            color: '#fff',
                            life: 0.8,
                            decay: 0.02,
                            friction: 0.98,
                            twinkle: true
                        });
                    }
                }

                triggerRender();
            }, frame * 30);
        }

        // Energia sendo sugada
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 60;

            setTimeout(() => {
                particles.push({
                    type: 'rift',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.06,
                    vy: (y - (y + Math.sin(angle) * distance)) * 0.06,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#7c3aed' : '#a855f7',
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.97,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, 300 + i * 20);
        }

        // Relâmpagos ao redor
        for (let bolt = 0; bolt < 6; bolt++) {
            setTimeout(() => {
                const boltAngle = (Math.PI * 2 * bolt) / 6;
                const boltDist = 50;
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        type: 'rift',
                        x: x + Math.cos(boltAngle) * (boltDist + i * 10),
                        y: y + Math.sin(boltAngle) * (boltDist + i * 10) * 0.5,
                        vx: Math.cos(boltAngle) * 3,
                        vy: Math.sin(boltAngle) * 1.5,
                        size: 4 + Math.random() * 4,
                        color: '#e9d5ff',
                        life: 0.3,
                        decay: 0.08,
                        friction: 0.88,
                        glow: true
                    });
                }
                triggerRender();
            }, 200 + bolt * 100);
        }
    }

    /**
     * EFEITO 49: Atomic Blast - Explosão atômica
     * Cogumelo nuclear
     */
    function spawnAtomicBlast(x, y, intensity = 1) {
        if (!particles) return;

        // Flash inicial
        particles.push({
            type: 'atomic',
            x, y,
            vx: 0, vy: 0,
            size: 180,
            color: 'rgba(255, 255, 255, 1)',
            life: 0.2,
            decay: 0.3,
            friction: 1
        });

        // Coluna de fogo ascendente (haste do cogumelo)
        for (let frame = 0; frame < 25; frame++) {
            setTimeout(() => {
                const columnY = y - frame * 8;
                const columnWidth = 20 + Math.sin(frame * 0.3) * 10;

                for (let i = 0; i < 8; i++) {
                    particles.push({
                        type: 'atomic',
                        x: x + (Math.random() - 0.5) * columnWidth,
                        y: columnY,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -4 - Math.random() * 4,
                        size: 8 + Math.random() * 12,
                        color: Math.random() > 0.4 ? '#f97316' : (Math.random() > 0.5 ? '#fbbf24' : '#ef4444'),
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, frame * 25);
        }

        // Topo do cogumelo (expansão lateral)
        setTimeout(() => {
            const topY = y - 180;
            for (let side = 0; side < 2; side++) {
                const dir = side === 0 ? -1 : 1;
                for (let i = 0; i < 40; i++) {
                    const angle = (side === 0 ? Math.PI : 0) + (Math.random() - 0.5) * Math.PI * 0.6;
                    const speed = 3 + Math.random() * 6;

                    setTimeout(() => {
                        particles.push({
                            type: 'atomic',
                            x: x,
                            y: topY + (Math.random() - 0.5) * 40,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed * 0.5 - 1,
                            size: 10 + Math.random() * 15,
                            color: Math.random() > 0.5 ? '#fdba74' : '#fcd34d',
                            life: 1.0,
                            decay: 0.01,
                            friction: 0.97,
                            glow: true
                        });
                        triggerRender();
                    }, i * 15);
                }
            }
        }, 500);

        // Onda de choque no solo
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                const radius = 30 + wave * 35;
                for (let i = 0; i < 50; i++) {
                    const angle = (Math.PI * 2 * i) / 50;
                    particles.push({
                        type: 'atomic',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.2,
                        vx: Math.cos(angle) * (6 + wave * 2),
                        vy: Math.sin(angle) * (2 + wave * 0.5),
                        size: 5 + Math.random() * 5,
                        color: wave < 2 ? '#fff' : '#fbbf24',
                        life: 0.5,
                        decay: 0.03,
                        friction: 0.94
                    });
                }
                triggerRender();
            }, 100 + wave * 80);
        }

        // Detritos voando
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 15;

            setTimeout(() => {
                particles.push({
                    type: 'atomic',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 5,
                    size: 4 + Math.random() * 8,
                    color: Math.random() > 0.5 ? '#78716c' : '#57534e',
                    life: 1.2,
                    decay: 0.008,
                    gravity: 0.15,
                    friction: 0.96
                });
                triggerRender();
            }, Math.random() * 300);
        }
    }

    /**
     * EFEITO 50: Angel Wings - Asas de anjo
     * Asas de penas brilhantes se abrindo
     */
    function spawnAngelWings(x, y, intensity = 1) {
        if (!particles) return;

        const wingSpan = 100;
        const feathers = 25;

        // Asa esquerda e direita
        for (let side = 0; side < 2; side++) {
            const dir = side === 0 ? -1 : 1;

            for (let feather = 0; feather < feathers; feather++) {
                const progress = feather / feathers;
                const angle = dir * (Math.PI / 6 + progress * Math.PI / 3);
                const length = wingSpan * (1 - progress * 0.4);

                setTimeout(() => {
                    // Cada pena é uma linha de partículas
                    for (let f = 0; f < 8; f++) {
                        const fProgress = f / 8;
                        const fDist = length * fProgress;
                        const fWidth = (1 - fProgress) * 8;

                        particles.push({
                            type: 'angel',
                            x: x + Math.cos(angle) * fDist,
                            y: y - 20 - Math.sin(Math.abs(angle)) * fDist * 0.3,
                            vx: Math.cos(angle) * 1 + (Math.random() - 0.5),
                            vy: -1 - Math.random() * 0.5,
                            size: 4 + fWidth,
                            color: Math.random() > 0.3 ? '#fff' : '#fef3c7',
                            life: 1.2,
                            decay: 0.008,
                            friction: 0.98,
                            glow: true
                        });
                    }
                    triggerRender();
                }, side * 100 + feather * 30);
            }
        }

        // Brilho divino central
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 30;
                particles.push({
                    type: 'angel',
                    x: x + Math.cos(angle) * dist,
                    y: y - 20 + Math.sin(angle) * dist * 0.3,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2 - Math.random() * 2,
                    size: 5 + Math.random() * 8,
                    color: '#fbbf24',
                    life: 1.0,
                    decay: 0.01,
                    friction: 0.97,
                    glow: true,
                    twinkle: true
                });
                triggerRender();
            }, 400 + i * 30);
        }

        // Penas caindo suavemente
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const startX = x + (Math.random() - 0.5) * wingSpan * 2;
                particles.push({
                    type: 'angel',
                    x: startX,
                    y: y - 40 - Math.random() * 60,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 1 + Math.random() * 1.5,
                    size: 4 + Math.random() * 6,
                    color: '#fff',
                    life: 2.0,
                    decay: 0.005,
                    friction: 0.99
                });
                triggerRender();
            }, 800 + Math.random() * 500);
        }
    }

    /**
     * EFEITO 51: Demon Summon - Invocação demoníaca
     * Portal do inferno com chamas
     */
    function spawnDemonSummon(x, y, intensity = 1) {
        if (!particles) return;

        // Portal no chão (elipse vermelha)
        for (let frame = 0; frame < 30; frame++) {
            setTimeout(() => {
                const radius = 20 + frame * 2;
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20 + frame * 0.1;
                    particles.push({
                        type: 'demon',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius * 0.3,
                        vx: Math.cos(angle + Math.PI / 2) * 1,
                        vy: Math.sin(angle + Math.PI / 2) * 0.3,
                        size: 5 + Math.random() * 5,
                        color: Math.random() > 0.5 ? '#dc2626' : '#991b1b',
                        life: 0.6,
                        decay: 0.02,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, frame * 30);
        }

        // Chamas infernais subindo
        for (let flame = 0; flame < 50; flame++) {
            setTimeout(() => {
                const flameX = x + (Math.random() - 0.5) * 60;
                particles.push({
                    type: 'demon',
                    x: flameX,
                    y: y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -5 - Math.random() * 8,
                    size: 8 + Math.random() * 15,
                    color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#f97316' : '#fbbf24'),
                    life: 0.8 + Math.random() * 0.4,
                    decay: 0.015,
                    friction: 0.96,
                    glow: true
                });
                triggerRender();
            }, 300 + flame * 25);
        }

        // Símbolos demoníacos (pontos em pentagrama)
        const pentaRadius = 50;
        for (let point = 0; point < 5; point++) {
            const angle = (Math.PI * 2 * point) / 5 - Math.PI / 2;
            setTimeout(() => {
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        type: 'demon',
                        x: x + Math.cos(angle) * pentaRadius,
                        y: y + Math.sin(angle) * pentaRadius * 0.3,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -2 - Math.random() * 3,
                        size: 6 + Math.random() * 8,
                        color: '#dc2626',
                        life: 1.0,
                        decay: 0.01,
                        friction: 0.97,
                        glow: true
                    });
                }
                triggerRender();
            }, 500 + point * 150);
        }

        // Fumaça negra
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const smokeX = x + (Math.random() - 0.5) * 80;
                particles.push({
                    type: 'demon',
                    x: smokeX,
                    y: y + Math.random() * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -2 - Math.random() * 3,
                    size: 15 + Math.random() * 25,
                    color: `rgba(15, 15, 15, ${0.4 + Math.random() * 0.3})`,
                    life: 1.5,
                    decay: 0.006,
                    friction: 0.98
                });
                triggerRender();
            }, 200 + Math.random() * 800);
        }
    }

    /**
     * EFEITO 52: Gravity Crush - Esmagamento gravitacional
     * Implosão seguida de explosão
     */
    function spawnGravityCrush(x, y, intensity = 1) {
        if (!particles) return;

        // Fase 1: Tudo sendo esmagado (partículas comprimindo)
        for (let ring = 0; ring < 5; ring++) {
            const ringRadius = 100 - ring * 15;
            setTimeout(() => {
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30;
                    particles.push({
                        type: 'gravity',
                        x: x + Math.cos(angle) * ringRadius,
                        y: y + Math.sin(angle) * ringRadius,
                        vx: -Math.cos(angle) * (4 + ring),
                        vy: -Math.sin(angle) * (4 + ring),
                        size: 4 + Math.random() * 6,
                        color: Math.random() > 0.5 ? '#581c87' : '#7c3aed',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 100);
        }

        // Detritos sendo puxados
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 60;

            setTimeout(() => {
                particles.push({
                    type: 'gravity',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.08,
                    vy: (y - (y + Math.sin(angle) * distance)) * 0.08,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
                    life: 0.8,
                    decay: 0.015,
                    friction: 0.96,
                    glow: true
                });
                triggerRender();
            }, i * 12);
        }

        // Fase 2: Ponto de singularidade
        setTimeout(() => {
            particles.push({
                type: 'gravity',
                x, y,
                vx: 0, vy: 0,
                size: 30,
                color: '#1e1b4b',
                life: 0.4,
                decay: 0.05,
                friction: 1
            });
            triggerRender();
        }, 700);

        // Fase 3: Explosão violenta
        setTimeout(() => {
            // Flash
            particles.push({
                type: 'gravity',
                x, y,
                vx: 0, vy: 0,
                size: 120,
                color: 'rgba(168, 85, 247, 0.9)',
                life: 0.15,
                decay: 0.35,
                friction: 1,
                glow: true
            });

            // Explosão
            for (let i = 0; i < 100; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 8 + Math.random() * 15;
                particles.push({
                    type: 'gravity',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 10,
                    color: Math.random() > 0.4 ? '#a855f7' : (Math.random() > 0.5 ? '#c084fc' : '#fff'),
                    life: 0.8,
                    decay: 0.015,
                    friction: 0.93,
                    glow: true
                });
            }

            triggerRender();
        }, 900);
    }

    // ==========================================
    // EFEITOS DE CAIR O QUEIXO - BATCH 2 (10)
    // ==========================================

    /**
     * EFEITO 53: Crystal Prison - Prisão de cristal
     * Cristais emergindo e formando uma gaiola
     */
    function spawnCrystalPrison(x, y, intensity = 1) {
        if (!particles) return;

        const crystalCount = 8;
        const height = 120;

        // Cristais emergindo do chão
        for (let crystal = 0; crystal < crystalCount; crystal++) {
            const angle = (Math.PI * 2 * crystal) / crystalCount;
            const radius = 50;
            const crystalX = x + Math.cos(angle) * radius;
            const crystalY = y + Math.sin(angle) * radius * 0.3;

            setTimeout(() => {
                // Cada cristal crescendo
                for (let h = 0; h < 15; h++) {
                    setTimeout(() => {
                        const crystalHeight = h * (height / 15);
                        const width = 8 + (1 - h / 15) * 12;

                        particles.push({
                            type: 'crystal',
                            x: crystalX + (Math.random() - 0.5) * 5,
                            y: crystalY - crystalHeight,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -0.5,
                            size: width,
                            color: Math.random() > 0.4 ? '#67e8f9' : (Math.random() > 0.5 ? '#a5f3fc' : '#fff'),
                            life: 1.5,
                            decay: 0.006,
                            friction: 0.99,
                            glow: true
                        });
                        triggerRender();
                    }, h * 25);
                }
            }, crystal * 80);
        }

        // Faíscas ao redor
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 40 + Math.random() * 30;
                particles.push({
                    type: 'crystal',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist * 0.3 - Math.random() * height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    size: 2 + Math.random() * 4,
                    color: '#22d3ee',
                    life: 0.5,
                    decay: 0.035,
                    friction: 0.9,
                    twinkle: true,
                    glow: true
                });
                triggerRender();
            }, 200 + Math.random() * 800);
        }

        // Topo conectando
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 40;
                particles.push({
                    type: 'crystal',
                    x: x + Math.cos(angle) * dist,
                    y: y - height - 20 + Math.random() * 20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -1 - Math.random(),
                    size: 4 + Math.random() * 8,
                    color: '#67e8f9',
                    life: 1.0,
                    decay: 0.01,
                    friction: 0.97,
                    glow: true
                });
            }
            triggerRender();
        }, 1000);
    }

    /**
     * EFEITO 54: Soul Reaper - Ceifador de almas
     * Corte de foice com almas escapando
     */
    function spawnSoulReaper(x, y, intensity = 1) {
        if (!particles) return;

        // Arco da foice
        const arcStart = -Math.PI * 0.7;
        const arcEnd = Math.PI * 0.3;
        const radius = 80;

        for (let frame = 0; frame < 20; frame++) {
            setTimeout(() => {
                const progress = frame / 20;
                const angle = arcStart + (arcEnd - arcStart) * progress;

                // Lâmina da foice
                for (let i = 0; i < 5; i++) {
                    const bladeRadius = radius - i * 10;
                    particles.push({
                        type: 'reaper',
                        x: x + Math.cos(angle) * bladeRadius,
                        y: y + Math.sin(angle) * bladeRadius,
                        vx: Math.cos(angle + Math.PI / 2) * 5,
                        vy: Math.sin(angle + Math.PI / 2) * 5,
                        size: 8 - i * 1.5,
                        color: i === 0 ? '#fff' : (i < 2 ? '#a855f7' : '#581c87'),
                        life: 0.3,
                        decay: 0.08,
                        friction: 0.85,
                        glow: i < 2
                    });
                }
                triggerRender();
            }, frame * 20);
        }

        // Almas escapando
        setTimeout(() => {
            for (let soul = 0; soul < 8; soul++) {
                const soulAngle = Math.random() * Math.PI * 2;
                const soulDist = 30 + Math.random() * 40;

                setTimeout(() => {
                    // Cada alma subindo
                    for (let f = 0; f < 15; f++) {
                        setTimeout(() => {
                            particles.push({
                                type: 'reaper',
                                x: x + Math.cos(soulAngle) * soulDist + (Math.random() - 0.5) * 10,
                                y: y + Math.sin(soulAngle) * soulDist * 0.3 - f * 8,
                                vx: (Math.random() - 0.5) * 2,
                                vy: -2 - Math.random() * 2,
                                size: 6 + Math.random() * 8,
                                color: `rgba(168, 85, 247, ${0.7 - f * 0.04})`,
                                life: 0.6,
                                decay: 0.025,
                                friction: 0.96,
                                glow: true
                            });
                            triggerRender();
                        }, f * 30);
                    }
                }, soul * 100);
            }
        }, 400);

        // Aura escura
        for (let i = 0; i < 40; i++) {
            const auraAngle = Math.random() * Math.PI * 2;
            const auraDist = 30 + Math.random() * 50;
            particles.push({
                type: 'reaper',
                x: x + Math.cos(auraAngle) * auraDist,
                y: y + Math.sin(auraAngle) * auraDist,
                vx: (Math.random() - 0.5) * 1,
                vy: -1 - Math.random() * 2,
                size: 12 + Math.random() * 18,
                color: `rgba(30, 27, 75, ${0.3 + Math.random() * 0.3})`,
                life: 1.2,
                decay: 0.008,
                friction: 0.98
            });
        }

        triggerRender();
    }

    /**
     * EFEITO 55: Elemental Fury - Fúria elemental
     * Combinação de fogo, gelo e raio
     */
    function spawnElementalFury(x, y, intensity = 1) {
        if (!particles) return;

        const elements = [
            { color: '#ef4444', altColor: '#fbbf24', name: 'fire' },
            { color: '#60a5fa', altColor: '#93c5fd', name: 'ice' },
            { color: '#a855f7', altColor: '#c084fc', name: 'lightning' }
        ];

        // Cada elemento em uma direção diferente
        elements.forEach((element, index) => {
            const baseAngle = (Math.PI * 2 * index) / 3;

            setTimeout(() => {
                // Explosão do elemento
                for (let i = 0; i < 40; i++) {
                    const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.6;
                    const speed = 5 + Math.random() * 10;

                    particles.push({
                        type: 'elemental',
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 4 + Math.random() * 10,
                        color: Math.random() > 0.5 ? element.color : element.altColor,
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.93,
                        glow: true
                    });
                }

                // Trail específico do elemento
                if (element.name === 'fire') {
                    for (let f = 0; f < 15; f++) {
                        particles.push({
                            type: 'elemental',
                            x: x + Math.cos(baseAngle) * f * 6,
                            y: y + Math.sin(baseAngle) * f * 6,
                            vx: (Math.random() - 0.5) * 2,
                            vy: -2 - Math.random() * 3,
                            size: 6 + Math.random() * 10,
                            color: '#f97316',
                            life: 0.5,
                            decay: 0.03,
                            friction: 0.95,
                            glow: true
                        });
                    }
                } else if (element.name === 'ice') {
                    for (let f = 0; f < 12; f++) {
                        particles.push({
                            type: 'elemental',
                            x: x + Math.cos(baseAngle) * f * 7,
                            y: y + Math.sin(baseAngle) * f * 7,
                            vx: Math.cos(baseAngle) * 2,
                            vy: Math.sin(baseAngle) * 2,
                            size: 5 + Math.random() * 8,
                            color: '#fff',
                            life: 0.7,
                            decay: 0.02,
                            friction: 0.96,
                            twinkle: true,
                            glow: true
                        });
                    }
                } else {
                    // Lightning zigzag
                    for (let f = 0; f < 10; f++) {
                        const zigzag = (f % 2 === 0 ? 1 : -1) * 15;
                        particles.push({
                            type: 'elemental',
                            x: x + Math.cos(baseAngle) * f * 8 + Math.cos(baseAngle + Math.PI / 2) * zigzag,
                            y: y + Math.sin(baseAngle) * f * 8 + Math.sin(baseAngle + Math.PI / 2) * zigzag,
                            vx: Math.cos(baseAngle) * 8,
                            vy: Math.sin(baseAngle) * 8,
                            size: 6 + Math.random() * 6,
                            color: '#fff',
                            life: 0.2,
                            decay: 0.12,
                            friction: 0.8,
                            glow: true
                        });
                    }
                }

                triggerRender();
            }, index * 200);
        });

        // Centro com todas as cores
        setTimeout(() => {
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 6;
                const elementIndex = Math.floor(Math.random() * 3);
                particles.push({
                    type: 'elemental',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 6,
                    color: elements[elementIndex].color,
                    life: 0.6,
                    decay: 0.025,
                    friction: 0.92,
                    glow: true
                });
            }
            triggerRender();
        }, 700);
    }

    /**
     * EFEITO 56: Spirit Bomb - Bomba espiritual
     * Esfera de energia carregando e explodindo
     */
    function spawnSpiritBomb(x, y, intensity = 1) {
        if (!particles) return;

        const chargeY = y - 100;

        // Fase 1: Energia sendo coletada
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 80;

            setTimeout(() => {
                particles.push({
                    type: 'spirit',
                    x: x + Math.cos(angle) * distance,
                    y: chargeY + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.05,
                    vy: (chargeY - (chargeY + Math.sin(angle) * distance)) * 0.05,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#60a5fa' : '#93c5fd',
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.97,
                    spiral: true,
                    targetX: x,
                    targetY: chargeY,
                    glow: true
                });
                triggerRender();
            }, i * 15);
        }

        // Fase 2: Esfera crescendo
        for (let size = 0; size < 15; size++) {
            setTimeout(() => {
                const sphereSize = 10 + size * 5;
                for (let i = 0; i < 15; i++) {
                    const angle = (Math.PI * 2 * i) / 15 + size * 0.2;
                    particles.push({
                        type: 'spirit',
                        x: x + Math.cos(angle) * sphereSize * 0.5,
                        y: chargeY + Math.sin(angle) * sphereSize * 0.5,
                        vx: Math.cos(angle) * 0.5,
                        vy: Math.sin(angle) * 0.5,
                        size: 6 + Math.random() * 6,
                        color: '#60a5fa',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, 1200 + size * 50);
        }

        // Fase 3: Bomba descendo e explodindo
        setTimeout(() => {
            // Trajetória da bomba
            for (let frame = 0; frame < 20; frame++) {
                setTimeout(() => {
                    const bomby = chargeY + (y - chargeY) * (frame / 20);
                    particles.push({
                        type: 'spirit',
                        x: x + (Math.random() - 0.5) * 20,
                        y: bomby,
                        vx: (Math.random() - 0.5) * 3,
                        vy: 2,
                        size: 15 + Math.random() * 15,
                        color: '#3b82f6',
                        life: 0.3,
                        decay: 0.08,
                        friction: 0.9,
                        glow: true
                    });
                    triggerRender();
                }, frame * 15);
            }
        }, 2000);

        // Fase 4: Explosão massiva
        setTimeout(() => {
            // Flash
            particles.push({
                type: 'spirit',
                x, y,
                vx: 0, vy: 0,
                size: 200,
                color: 'rgba(96, 165, 250, 0.9)',
                life: 0.2,
                decay: 0.3,
                friction: 1,
                glow: true
            });

            // Explosão
            for (let i = 0; i < 150; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 8 + Math.random() * 20;
                particles.push({
                    type: 'spirit',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 12,
                    color: Math.random() > 0.4 ? '#60a5fa' : (Math.random() > 0.5 ? '#93c5fd' : '#fff'),
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.94,
                    glow: true
                });
            }

            triggerRender();
        }, 2350);
    }

    /**
     * EFEITO 57: Blood Moon - Lua de sangue
     * Lua vermelha surgindo com chuva de sangue
     */
    function spawnBloodMoon(x, y, intensity = 1) {
        if (!particles) return;

        const moonY = y - 100;
        const moonRadius = 40;

        // Lua surgindo
        for (let ring = 0; ring < 8; ring++) {
            setTimeout(() => {
                const radius = moonRadius - ring * 4;
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30;
                    particles.push({
                        type: 'bloodmoon',
                        x: x + Math.cos(angle) * radius,
                        y: moonY + Math.sin(angle) * radius,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: 6 + ring,
                        color: ring < 3 ? '#dc2626' : (ring < 5 ? '#991b1b' : '#7f1d1d'),
                        life: 2.0,
                        decay: 0.004,
                        friction: 0.99,
                        glow: ring < 4
                    });
                }
                triggerRender();
            }, ring * 80);
        }

        // Aura sinistra ao redor da lua
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = moonRadius + 10 + Math.random() * 30;

            setTimeout(() => {
                particles.push({
                    type: 'bloodmoon',
                    x: x + Math.cos(angle) * dist,
                    y: moonY + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    size: 8 + Math.random() * 12,
                    color: 'rgba(220, 38, 38, 0.4)',
                    life: 1.5,
                    decay: 0.006,
                    friction: 0.99,
                    glow: true
                });
                triggerRender();
            }, 500 + i * 20);
        }

        // Chuva de sangue
        for (let drop = 0; drop < 100; drop++) {
            setTimeout(() => {
                const dropX = x + (Math.random() - 0.5) * 200;
                particles.push({
                    type: 'bloodmoon',
                    x: dropX,
                    y: moonY + 50,
                    vx: (Math.random() - 0.5) * 1,
                    vy: 5 + Math.random() * 5,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.3 ? '#dc2626' : '#991b1b',
                    life: 0.8,
                    decay: 0.015,
                    friction: 0.99,
                    trail: true
                });
                triggerRender();
            }, 800 + drop * 15);
        }
    }

    /**
     * EFEITO 58: Thunder God - Deus do trovão
     * Chegada divina com relâmpagos
     */
    function spawnThunderGod(x, y, intensity = 1) {
        if (!particles) return;

        // Coluna de luz descendo
        for (let frame = 0; frame < 30; frame++) {
            setTimeout(() => {
                const columnY = y - 200 + frame * 7;
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        type: 'thundergod',
                        x: x + (Math.random() - 0.5) * 30,
                        y: columnY,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 5,
                        size: 8 + Math.random() * 10,
                        color: Math.random() > 0.3 ? '#fbbf24' : '#fff',
                        life: 0.4,
                        decay: 0.05,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, frame * 20);
        }

        // Relâmpagos radiais no impacto
        setTimeout(() => {
            const boltCount = 8;
            for (let bolt = 0; bolt < boltCount; bolt++) {
                const angle = (Math.PI * 2 * bolt) / boltCount;
                for (let seg = 0; seg < 12; seg++) {
                    const dist = 20 + seg * 10;
                    const zigzag = (seg % 2 === 0 ? 1 : -1) * 10;

                    particles.push({
                        type: 'thundergod',
                        x: x + Math.cos(angle) * dist + Math.cos(angle + Math.PI / 2) * zigzag,
                        y: y + Math.sin(angle) * dist + Math.sin(angle + Math.PI / 2) * zigzag,
                        vx: Math.cos(angle) * 6,
                        vy: Math.sin(angle) * 6,
                        size: 6 + Math.random() * 6,
                        color: Math.random() > 0.4 ? '#fbbf24' : '#fff',
                        life: 0.25,
                        decay: 0.12,
                        friction: 0.85,
                        glow: true
                    });
                }
            }

            // Flash de impacto
            particles.push({
                type: 'thundergod',
                x, y,
                vx: 0, vy: 0,
                size: 150,
                color: 'rgba(251, 191, 36, 0.9)',
                life: 0.15,
                decay: 0.4,
                friction: 1,
                glow: true
            });

            triggerRender();
        }, 600);

        // Ondas de energia elétrica
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                const radius = 30 + wave * 25;
                for (let i = 0; i < 40; i++) {
                    const angle = (Math.PI * 2 * i) / 40;
                    particles.push({
                        type: 'thundergod',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (4 + wave * 2),
                        vy: Math.sin(angle) * (4 + wave * 2),
                        size: 5 + Math.random() * 4,
                        color: wave < 2 ? '#fff' : '#fcd34d',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, 650 + wave * 60);
        }
    }

    /**
     * EFEITO 59: Void Collapse - Colapso do vazio
     * Realidade se despedaçando
     */
    function spawnVoidCollapse(x, y, intensity = 1) {
        if (!particles) return;

        // Fragmentos da realidade quebrando
        for (let frag = 0; frag < 30; frag++) {
            const fragAngle = Math.random() * Math.PI * 2;
            const fragDist = 30 + Math.random() * 60;

            setTimeout(() => {
                // Cada fragmento "quebrando"
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        type: 'void',
                        x: x + Math.cos(fragAngle) * fragDist + (Math.random() - 0.5) * 15,
                        y: y + Math.sin(fragAngle) * fragDist + (Math.random() - 0.5) * 15,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        size: 5 + Math.random() * 10,
                        color: Math.random() > 0.5 ? '#1e1b4b' : '#3730a3',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.94
                    });
                }
                triggerRender();
            }, frag * 30);
        }

        // Buraco negro central se formando
        setTimeout(() => {
            for (let ring = 0; ring < 6; ring++) {
                setTimeout(() => {
                    const radius = 30 - ring * 4;
                    for (let i = 0; i < 25; i++) {
                        const angle = (Math.PI * 2 * i) / 25 + ring * 0.3;
                        particles.push({
                            type: 'void',
                            x: x + Math.cos(angle) * radius,
                            y: y + Math.sin(angle) * radius,
                            vx: -Math.cos(angle) * 2,
                            vy: -Math.sin(angle) * 2,
                            size: 5 + ring,
                            color: ring < 2 ? '#4338ca' : (ring < 4 ? '#3730a3' : '#1e1b4b'),
                            life: 1.0,
                            decay: 0.01,
                            friction: 0.97,
                            glow: ring < 3
                        });
                    }
                    triggerRender();
                }, ring * 60);
            }
        }, 500);

        // Partículas sendo sugadas para o vazio
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 60;

            setTimeout(() => {
                particles.push({
                    type: 'void',
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (x - (x + Math.cos(angle) * distance)) * 0.07,
                    vy: (y - (y + Math.sin(angle) * distance)) * 0.07,
                    size: 2 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#6366f1' : '#818cf8',
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.96,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, 600 + i * 15);
        }

        // Distorção visual
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 40;
                particles.push({
                    type: 'void',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    size: 3 + Math.random() * 6,
                    color: '#fff',
                    life: 0.3,
                    decay: 0.08,
                    friction: 0.88,
                    glow: true
                });
            }
            triggerRender();
        }, 1200);
    }

    /**
     * EFEITO 60: Inferno Tornado - Tornado de fogo
     * Funil de fogo giratório
     */
    function spawnInfernoTornado(x, y, intensity = 1) {
        if (!particles) return;

        const height = 180;
        const duration = 1500;

        // Criar o funil de fogo
        for (let layer = 0; layer < 25; layer++) {
            const progress = layer / 25;
            const layerY = y - progress * height;
            const radius = 20 + (1 - progress) * 50;

            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = (Math.PI * 2 * i) / 15 + layer * 0.4;
                    particles.push({
                        type: 'inferno',
                        x: x + Math.cos(angle) * radius,
                        y: layerY,
                        vx: Math.cos(angle + Math.PI / 2) * (5 + progress * 3),
                        vy: -3 - Math.random() * 4,
                        size: 6 + (1 - progress) * 12,
                        color: Math.random() > 0.4 ? '#f97316' : (Math.random() > 0.5 ? '#fbbf24' : '#ef4444'),
                        life: 0.6,
                        decay: 0.02,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, layer * 40);
        }

        // Chamas extras subindo no centro
        for (let flame = 0; flame < 60; flame++) {
            setTimeout(() => {
                const flameX = x + (Math.random() - 0.5) * 40;
                particles.push({
                    type: 'inferno',
                    x: flameX,
                    y: y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -8 - Math.random() * 8,
                    size: 8 + Math.random() * 15,
                    color: Math.random() > 0.3 ? '#f97316' : '#fcd34d',
                    life: 1.0,
                    decay: 0.012,
                    friction: 0.96,
                    glow: true
                });
                triggerRender();
            }, 200 + flame * 20);
        }

        // Debris e brasas
        for (let i = 0; i < 50; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const startDist = 60 + Math.random() * 50;

            setTimeout(() => {
                particles.push({
                    type: 'inferno',
                    x: x + Math.cos(startAngle) * startDist,
                    y: y,
                    vx: (x - (x + Math.cos(startAngle) * startDist)) * 0.04,
                    vy: -4 - Math.random() * 6,
                    size: 3 + Math.random() * 6,
                    color: Math.random() > 0.5 ? '#fcd34d' : '#fef3c7',
                    life: 1.2,
                    decay: 0.008,
                    friction: 0.97
                });
                triggerRender();
            }, Math.random() * duration);
        }
    }

    /**
     * EFEITO 61: Divine Judgment - Julgamento divino
     * Espada sagrada descendo do céu
     */
    function spawnDivineJudgment(x, y, intensity = 1) {
        if (!particles) return;

        const swordLength = 120;

        // Luz divina anunciando
        for (let ray = 0; ray < 8; ray++) {
            const angle = (Math.PI * 2 * ray) / 8;

            setTimeout(() => {
                for (let seg = 0; seg < 15; seg++) {
                    const dist = seg * 8;
                    particles.push({
                        type: 'divine',
                        x: x + Math.cos(angle) * dist,
                        y: y - 150 + Math.sin(angle) * dist * 0.3,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 0.5,
                        size: 5 + Math.random() * 5,
                        color: '#fbbf24',
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, ray * 50);
        }

        // Espada descendo
        setTimeout(() => {
            for (let frame = 0; frame < 20; frame++) {
                setTimeout(() => {
                    const progress = frame / 20;
                    const swordY = (y - 200) + progress * 200;

                    // Lâmina
                    for (let i = 0; i < 8; i++) {
                        particles.push({
                            type: 'divine',
                            x: x + (Math.random() - 0.5) * 10,
                            y: swordY - i * 10,
                            vx: (Math.random() - 0.5) * 1,
                            vy: 4,
                            size: 10 - i,
                            color: i < 3 ? '#fff' : '#fcd34d',
                            life: 0.3,
                            decay: 0.08,
                            friction: 0.9,
                            glow: true
                        });
                    }

                    triggerRender();
                }, frame * 15);
            }
        }, 500);

        // Impacto explosivo
        setTimeout(() => {
            // Flash massivo
            particles.push({
                type: 'divine',
                x, y,
                vx: 0, vy: 0,
                size: 180,
                color: 'rgba(251, 191, 36, 0.95)',
                life: 0.2,
                decay: 0.3,
                friction: 1,
                glow: true
            });

            // Cruz de luz
            const crossDirections = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
            crossDirections.forEach(dir => {
                for (let seg = 0; seg < 20; seg++) {
                    const dist = seg * 8;
                    particles.push({
                        type: 'divine',
                        x: x + Math.cos(dir) * dist,
                        y: y + Math.sin(dir) * dist,
                        vx: Math.cos(dir) * 10,
                        vy: Math.sin(dir) * 10,
                        size: 8 - seg * 0.3,
                        color: seg < 5 ? '#fff' : '#fbbf24',
                        life: 0.6,
                        decay: 0.025,
                        friction: 0.93,
                        glow: true
                    });
                }
            });

            // Partículas douradas
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 12;
                particles.push({
                    type: 'divine',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.4 ? '#fcd34d' : '#fff',
                    life: 0.8,
                    decay: 0.015,
                    friction: 0.94,
                    glow: true,
                    twinkle: true
                });
            }

            triggerRender();
        }, 850);
    }

    /**
     * EFEITO 62: Death Mark - Marca da morte
     * Caveira aparecendo com aura sombria
     */
    function spawnDeathMark(x, y, intensity = 1) {
        if (!particles) return;

        // Aura sombria se expandindo
        for (let wave = 0; wave < 6; wave++) {
            setTimeout(() => {
                const radius = 20 + wave * 20;
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30;
                    particles.push({
                        type: 'death',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (2 + wave * 0.5),
                        vy: Math.sin(angle) * (2 + wave * 0.5),
                        size: 8 + Math.random() * 8,
                        color: wave < 2 ? '#581c87' : (wave < 4 ? '#3b0764' : '#1e1b4b'),
                        life: 0.8,
                        decay: 0.015,
                        friction: 0.95,
                        glow: wave < 3
                    });
                }
                triggerRender();
            }, wave * 80);
        }

        // Caveira central formando
        setTimeout(() => {
            // Olhos brilhantes
            const eyeOffsets = [-15, 15];
            eyeOffsets.forEach(offset => {
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        type: 'death',
                        x: x + offset + (Math.random() - 0.5) * 5,
                        y: y - 10 + (Math.random() - 0.5) * 5,
                        vx: (Math.random() - 0.5) * 1,
                        vy: -1 - Math.random(),
                        size: 5 + Math.random() * 6,
                        color: Math.random() > 0.3 ? '#dc2626' : '#fff',
                        life: 1.2,
                        decay: 0.008,
                        friction: 0.98,
                        glow: true
                    });
                }
            });

            // Contorno da caveira
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 15 + Math.random() * 20;
                particles.push({
                    type: 'death',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist * 0.8,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: 6 + Math.random() * 8,
                    color: Math.random() > 0.5 ? '#e5e7eb' : '#d1d5db',
                    life: 1.5,
                    decay: 0.005,
                    friction: 0.99
                });
            }

            triggerRender();
        }, 400);

        // Almas sendo atraídas
        for (let soul = 0; soul < 20; soul++) {
            const soulAngle = Math.random() * Math.PI * 2;
            const soulDist = 60 + Math.random() * 40;

            setTimeout(() => {
                particles.push({
                    type: 'death',
                    x: x + Math.cos(soulAngle) * soulDist,
                    y: y + Math.sin(soulAngle) * soulDist,
                    vx: (x - (x + Math.cos(soulAngle) * soulDist)) * 0.04,
                    vy: (y - (y + Math.sin(soulAngle) * soulDist)) * 0.04,
                    size: 4 + Math.random() * 6,
                    color: 'rgba(168, 85, 247, 0.6)',
                    life: 1.0,
                    decay: 0.01,
                    friction: 0.97,
                    spiral: true,
                    targetX: x,
                    targetY: y,
                    glow: true
                });
                triggerRender();
            }, 600 + soul * 50);
        }
    }

    // ==========================================
    // ARCHER SKILL EFFECTS - CAST & IMPACT
    // ==========================================

    /**
     * ARCHER SKILL 1: Quick Shot
     * Cast: Arco tensionando rapidamente
     * Impact: Pequena explosão de velocidade
     */
    function archerQuickShotCast(x, y) {
        if (!particles) return;

        // Arco tensionando - energia amarela
        for (let i = 0; i < 15; i++) {
            const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
            particles.push({
                type: 'archer',
                x: x + (Math.random() - 0.5) * 15,
                y: y - 10 + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                size: 3 + Math.random() * 5,
                color: Math.random() > 0.5 ? '#fbbf24' : '#fcd34d',
                life: 0.4,
                decay: 0.05,
                friction: 0.9,
                glow: true
            });
        }
        triggerRender();
    }

    function archerQuickShotImpact(x, y) {
        if (!particles) return;

        // Impacto rápido
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            particles.push({
                type: 'archer',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#fbbf24' : '#fff',
                life: 0.3,
                decay: 0.07,
                friction: 0.88,
                glow: true
            });
        }
        triggerRender();
    }

    /**
     * ARCHER SKILL 2: Poison Arrow
     * Cast: Flecha sendo envenenada (aura verde)
     * Impact: Nuvem tóxica + respingos
     */
    function archerPoisonArrowCast(x, y) {
        if (!particles) return;

        // Veneno envolvendo a flecha
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 15;
            particles.push({
                type: 'poison',
                x: x + Math.cos(angle) * dist,
                y: y - 15 + Math.sin(angle) * dist * 0.5,
                vx: Math.cos(angle) * 1,
                vy: -1 - Math.random() * 2,
                size: 4 + Math.random() * 6,
                color: Math.random() > 0.4 ? '#22c55e' : (Math.random() > 0.5 ? '#4ade80' : '#166534'),
                life: 0.6,
                decay: 0.025,
                friction: 0.96,
                glow: true
            });
        }

        // Bolhas de veneno
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                particles.push({
                    type: 'poison',
                    x: x + (Math.random() - 0.5) * 20,
                    y: y - 10,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -2 - Math.random() * 2,
                    size: 3 + Math.random() * 5,
                    color: '#4ade80',
                    life: 0.5,
                    decay: 0.03,
                    friction: 0.97
                });
                triggerRender();
            }, i * 40);
        }

        triggerRender();
    }

    function archerPoisonArrowImpact(x, y) {
        if (!particles) return;

        // Nuvem tóxica expandindo
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                const radius = 10 + wave * 15;
                for (let i = 0; i < 25; i++) {
                    const angle = (Math.PI * 2 * i) / 25;
                    particles.push({
                        type: 'poison',
                        x: x + Math.cos(angle) * radius * 0.3,
                        y: y + Math.sin(angle) * radius * 0.3,
                        vx: Math.cos(angle) * (2 + wave),
                        vy: Math.sin(angle) * (2 + wave) - 1,
                        size: 6 + Math.random() * 8,
                        color: Math.random() > 0.5 ? '#22c55e' : '#4ade80',
                        life: 0.8,
                        decay: 0.012,
                        friction: 0.95,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 60);
        }

        // Respingos de veneno
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            particles.push({
                type: 'poison',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 3 + Math.random() * 5,
                color: '#166534',
                life: 0.6,
                decay: 0.02,
                gravity: 0.1,
                friction: 0.95
            });
        }

        triggerRender();
    }

    /**
     * ARCHER SKILL 3: Focused Shot
     * Cast: Olho focando / concentração
     * Impact: Perfuração profunda
     */
    function archerFocusedShotCast(x, y) {
        if (!particles) return;

        // Círculo de foco convergindo
        for (let ring = 0; ring < 4; ring++) {
            setTimeout(() => {
                const radius = 40 - ring * 8;
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 * i) / 20 + ring * 0.2;
                    particles.push({
                        type: 'focus',
                        x: x + Math.cos(angle) * radius,
                        y: y - 15 + Math.sin(angle) * radius * 0.4,
                        vx: (x - (x + Math.cos(angle) * radius)) * 0.08,
                        vy: ((y - 15) - (y - 15 + Math.sin(angle) * radius * 0.4)) * 0.08,
                        size: 3 + Math.random() * 4,
                        color: Math.random() > 0.5 ? '#60a5fa' : '#93c5fd',
                        life: 0.5,
                        decay: 0.035,
                        friction: 0.96,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 80);
        }

        // Flash de concentração
        setTimeout(() => {
            particles.push({
                type: 'focus',
                x, y: y - 15,
                vx: 0, vy: 0,
                size: 30,
                color: 'rgba(96, 165, 250, 0.8)',
                life: 0.15,
                decay: 0.35,
                friction: 1,
                glow: true
            });
            triggerRender();
        }, 350);
    }

    function archerFocusedShotImpact(x, y) {
        if (!particles) return;

        // Perfuração central
        for (let i = 0; i < 30; i++) {
            const angle = (Math.random() - 0.5) * Math.PI * 0.4 - Math.PI / 2;
            const speed = 5 + Math.random() * 10;
            particles.push({
                type: 'focus',
                x, y,
                vx: Math.cos(angle) * speed * 0.3,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                color: Math.random() > 0.4 ? '#60a5fa' : '#fff',
                life: 0.5,
                decay: 0.03,
                friction: 0.92,
                glow: true
            });
        }

        // Anel de impacto
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            particles.push({
                type: 'focus',
                x: x + Math.cos(angle) * 20,
                y: y + Math.sin(angle) * 20,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                size: 4 + Math.random() * 4,
                color: '#93c5fd',
                life: 0.4,
                decay: 0.04,
                friction: 0.9,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * ARCHER SKILL 4: Piercing Arrow
     * Cast: Carga de energia na flecha
     * Impact: Linha de perfuração atravessando
     */
    function archerPiercingArrowCast(x, y) {
        if (!particles) return;

        // Energia carregando na ponta da flecha
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 20;

            setTimeout(() => {
                particles.push({
                    type: 'pierce',
                    x: x + Math.cos(angle) * dist,
                    y: y - 15 + Math.sin(angle) * dist * 0.4,
                    vx: (x - (x + Math.cos(angle) * dist)) * 0.1,
                    vy: ((y - 15) - (y - 15 + Math.sin(angle) * dist * 0.4)) * 0.1,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#f97316' : '#fbbf24',
                    life: 0.6,
                    decay: 0.025,
                    friction: 0.96,
                    glow: true
                });
                triggerRender();
            }, i * 15);
        }

        // Brilho intenso no centro
        setTimeout(() => {
            for (let i = 0; i < 15; i++) {
                particles.push({
                    type: 'pierce',
                    x: x + (Math.random() - 0.5) * 10,
                    y: y - 15 + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 5 + Math.random() * 8,
                    color: '#fff',
                    life: 0.3,
                    decay: 0.08,
                    friction: 0.9,
                    glow: true
                });
            }
            triggerRender();
        }, 300);
    }

    function archerPiercingArrowImpact(x, y, direction = 0) {
        if (!particles) return;

        // Linha de perfuração
        const lineLength = 80;
        for (let seg = 0; seg < 15; seg++) {
            const progress = seg / 15;
            const segX = x + Math.cos(direction) * lineLength * progress;
            const segY = y + Math.sin(direction) * lineLength * progress;

            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        type: 'pierce',
                        x: segX + (Math.random() - 0.5) * 10,
                        y: segY + (Math.random() - 0.5) * 10,
                        vx: Math.cos(direction) * (8 + Math.random() * 4),
                        vy: Math.sin(direction) * (8 + Math.random() * 4),
                        size: 4 + Math.random() * 6,
                        color: Math.random() > 0.4 ? '#f97316' : '#fff',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, seg * 20);
        }

        // Faíscas laterais
        for (let i = 0; i < 25; i++) {
            const perpAngle = direction + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
            particles.push({
                type: 'pierce',
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(perpAngle) * (3 + Math.random() * 4),
                vy: Math.sin(perpAngle) * (3 + Math.random() * 4),
                size: 2 + Math.random() * 4,
                color: '#fbbf24',
                life: 0.3,
                decay: 0.06,
                friction: 0.88
            });
        }

        triggerRender();
    }

    /**
     * ARCHER SKILL 5: Multishot
     * Cast: Múltiplas flechas se formando
     * Impact: Chuva de impactos
     */
    function archerMultishotCast(x, y) {
        if (!particles) return;

        // 3 flechas se formando
        const arrowAngles = [-Math.PI / 6, 0, Math.PI / 6];
        arrowAngles.forEach((baseAngle, idx) => {
            setTimeout(() => {
                for (let i = 0; i < 12; i++) {
                    const dist = 10 + i * 3;
                    particles.push({
                        type: 'multi',
                        x: x + Math.cos(baseAngle - Math.PI / 4) * dist,
                        y: y - 10 + Math.sin(baseAngle - Math.PI / 4) * dist,
                        vx: Math.cos(baseAngle) * 4,
                        vy: Math.sin(baseAngle) * 4 - 1,
                        size: 4 + Math.random() * 4,
                        color: Math.random() > 0.5 ? '#a855f7' : '#c084fc',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.92,
                        glow: true
                    });
                }
                triggerRender();
            }, idx * 100);
        });
    }

    function archerMultishotImpact(x, y) {
        if (!particles) return;

        // Múltiplos impactos em área
        for (let hit = 0; hit < 5; hit++) {
            const hitX = x + (Math.random() - 0.5) * 60;
            const hitY = y + (Math.random() - 0.5) * 40;

            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3 + Math.random() * 5;
                    particles.push({
                        type: 'multi',
                        x: hitX, y: hitY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 5,
                        color: Math.random() > 0.5 ? '#a855f7' : '#e9d5ff',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.9,
                        glow: true
                    });
                }
                triggerRender();
            }, hit * 60);
        }
    }

    /**
     * ARCHER SKILL 6: Hunter's Focus (BUFF - só cast)
     * Cast: Aura de concentração ao redor do arqueiro
     */
    function archerHuntersFocusCast(x, y) {
        if (!particles) return;

        // Olho místico aparecendo
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const radius = 30 + ring * 10;
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 * i) / 30 + ring * 0.3;
                    particles.push({
                        type: 'focus',
                        x: x + Math.cos(angle) * radius,
                        y: y - 20 + Math.sin(angle) * radius * 0.3,
                        vx: Math.cos(angle + Math.PI / 2) * 1.5,
                        vy: Math.sin(angle + Math.PI / 2) * 0.5,
                        size: 4 + Math.random() * 5,
                        color: Math.random() > 0.5 ? '#fbbf24' : '#f59e0b',
                        life: 1.0,
                        decay: 0.01,
                        friction: 0.98,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 150);
        }

        // Partículas subindo (aura)
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 20 + Math.random() * 20;
                particles.push({
                    type: 'focus',
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist * 0.3,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -2 - Math.random() * 3,
                    size: 3 + Math.random() * 5,
                    color: '#fcd34d',
                    life: 0.8,
                    decay: 0.012,
                    friction: 0.98,
                    twinkle: true,
                    glow: true
                });
                triggerRender();
            }, i * 20);
        }
    }

    /**
     * ARCHER SKILL 7: Tactical Retreat
     * Cast: Movimento rápido + preparação
     * Impact: Flecha veloz
     */
    function archerTacticalRetreatCast(x, y) {
        if (!particles) return;

        // Linhas de movimento (speed lines)
        for (let i = 0; i < 20; i++) {
            const offsetY = (Math.random() - 0.5) * 40;
            particles.push({
                type: 'speed',
                x: x + 40 + Math.random() * 30,
                y: y + offsetY,
                vx: -8 - Math.random() * 5,
                vy: 0,
                size: 2 + Math.random() * 3,
                color: '#fff',
                life: 0.3,
                decay: 0.1,
                friction: 0.85,
                trail: true
            });
        }

        // Poeira do movimento
        for (let i = 0; i < 15; i++) {
            particles.push({
                type: 'dust',
                x: x + 20 + Math.random() * 20,
                y: y + 15 + Math.random() * 10,
                vx: 2 + Math.random() * 3,
                vy: -1 - Math.random() * 2,
                size: 6 + Math.random() * 10,
                color: 'rgba(120, 113, 108, 0.4)',
                life: 0.6,
                decay: 0.02,
                friction: 0.96
            });
        }

        triggerRender();
    }

    function archerTacticalRetreatImpact(x, y) {
        if (!particles) return;

        // Impacto rápido e limpo
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 6;
            particles.push({
                type: 'speed',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#e5e7eb' : '#fff',
                life: 0.3,
                decay: 0.07,
                friction: 0.88,
                glow: true
            });
        }
        triggerRender();
    }

    /**
     * ARCHER SKILL 8: Rain of Arrows (AOE)
     * Cast: Mirando para o céu
     * Impact: Chuva massiva de flechas
     */
    function archerRainOfArrowsCast(x, y) {
        if (!particles) return;

        // Flechas subindo para o céu
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 30;
                particles.push({
                    type: 'rain',
                    x: x + offsetX,
                    y: y - 20,
                    vx: offsetX * 0.05,
                    vy: -10 - Math.random() * 5,
                    size: 3 + Math.random() * 4,
                    color: Math.random() > 0.5 ? '#fbbf24' : '#fcd34d',
                    life: 0.6,
                    decay: 0.02,
                    friction: 0.97,
                    glow: true
                });
                triggerRender();
            }, i * 20);
        }

        // Aura de poder
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 15;
            particles.push({
                type: 'rain',
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist * 0.3,
                vx: Math.cos(angle) * 0.5,
                vy: -1 - Math.random(),
                size: 4 + Math.random() * 6,
                color: '#f59e0b',
                life: 0.5,
                decay: 0.025,
                friction: 0.97,
                glow: true
            });
        }

        triggerRender();
    }

    function archerRainOfArrowsImpact(x, y) {
        if (!particles) return;

        // Chuva massiva de flechas caindo
        const radius = 60;
        for (let wave = 0; wave < 5; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 20; i++) {
                    const dropX = x + (Math.random() - 0.5) * radius * 2;
                    const dropY = y - 80 - Math.random() * 40;

                    particles.push({
                        type: 'rain',
                        x: dropX,
                        y: dropY,
                        vx: (Math.random() - 0.5) * 2,
                        vy: 12 + Math.random() * 6,
                        size: 4 + Math.random() * 4,
                        color: '#fbbf24',
                        life: 0.5,
                        decay: 0.025,
                        friction: 0.99,
                        glow: true
                    });
                }

                // Impactos no chão
                for (let i = 0; i < 15; i++) {
                    const impactX = x + (Math.random() - 0.5) * radius * 2;
                    const impactY = y + (Math.random() - 0.5) * radius * 0.6;
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 4;

                    particles.push({
                        type: 'rain',
                        x: impactX, y: impactY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 2 + Math.random() * 3,
                        color: '#fcd34d',
                        life: 0.3,
                        decay: 0.06,
                        friction: 0.9
                    });
                }

                triggerRender();
            }, wave * 80);
        }
    }

    /**
     * ARCHER SKILL 9: Crippling Shot
     * Cast: Mirando nas pernas
     * Impact: Correntes/gelo limitando movimento
     */
    function archerCripplingShotCast(x, y) {
        if (!particles) return;

        // Aura gelada/pesada
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 20;
            particles.push({
                type: 'cripple',
                x: x + Math.cos(angle) * dist,
                y: y - 10 + Math.sin(angle) * dist * 0.4,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.3,
                size: 4 + Math.random() * 6,
                color: Math.random() > 0.5 ? '#0ea5e9' : '#7dd3fc',
                life: 0.6,
                decay: 0.02,
                friction: 0.97,
                glow: true
            });
        }

        // Energia concentrada
        for (let ring = 0; ring < 2; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = (Math.PI * 2 * i) / 15;
                    const radius = 25 - ring * 10;
                    particles.push({
                        type: 'cripple',
                        x: x + Math.cos(angle) * radius,
                        y: y - 10 + Math.sin(angle) * radius * 0.4,
                        vx: -Math.cos(angle) * 2,
                        vy: -Math.sin(angle) * 1,
                        size: 3 + Math.random() * 4,
                        color: '#38bdf8',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.94,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 100);
        }

        triggerRender();
    }

    function archerCripplingShotImpact(x, y) {
        if (!particles) return;

        // Correntes/gelo no chão
        for (let chain = 0; chain < 6; chain++) {
            const angle = (Math.PI * 2 * chain) / 6;
            for (let seg = 0; seg < 8; seg++) {
                const dist = 10 + seg * 8;
                setTimeout(() => {
                    particles.push({
                        type: 'cripple',
                        x: x + Math.cos(angle) * dist,
                        y: y + 10 + Math.sin(angle) * dist * 0.2,
                        vx: Math.cos(angle) * 1,
                        vy: 0.5,
                        size: 5 + Math.random() * 5,
                        color: Math.random() > 0.5 ? '#0ea5e9' : '#bae6fd',
                        life: 1.0,
                        decay: 0.01,
                        friction: 0.99,
                        glow: true
                    });
                    triggerRender();
                }, chain * 30 + seg * 20);
            }
        }

        // Cristais de gelo
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            particles.push({
                type: 'cripple',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: 4 + Math.random() * 6,
                color: Math.random() > 0.5 ? '#7dd3fc' : '#fff',
                life: 0.6,
                decay: 0.02,
                friction: 0.93,
                twinkle: true,
                glow: true
            });
        }

        triggerRender();
    }

    /**
     * ARCHER SKILL 10: Deadly Aim (ULTIMATE)
     * Cast: Concentração extrema - tempo parecendo parar
     * Impact: Explosão crítica devastadora
     */
    function archerDeadlyAimCast(x, y) {
        if (!particles) return;

        // Múltiplos círculos de concentração
        for (let ring = 0; ring < 5; ring++) {
            setTimeout(() => {
                const radius = 60 - ring * 10;
                for (let i = 0; i < 35; i++) {
                    const angle = (Math.PI * 2 * i) / 35 + ring * 0.2;
                    particles.push({
                        type: 'deadly',
                        x: x + Math.cos(angle) * radius,
                        y: y - 20 + Math.sin(angle) * radius * 0.35,
                        vx: (x - (x + Math.cos(angle) * radius)) * 0.06,
                        vy: ((y - 20) - (y - 20 + Math.sin(angle) * radius * 0.35)) * 0.06,
                        size: 4 + Math.random() * 5,
                        color: ring < 2 ? '#dc2626' : (ring < 4 ? '#f97316' : '#fbbf24'),
                        life: 0.7,
                        decay: 0.018,
                        friction: 0.97,
                        glow: true
                    });
                }
                triggerRender();
            }, ring * 100);
        }

        // Centro pulsando
        for (let pulse = 0; pulse < 3; pulse++) {
            setTimeout(() => {
                particles.push({
                    type: 'deadly',
                    x, y: y - 20,
                    vx: 0, vy: 0,
                    size: 40 + pulse * 10,
                    color: `rgba(220, 38, 38, ${0.6 - pulse * 0.15})`,
                    life: 0.15,
                    decay: 0.35,
                    friction: 1,
                    glow: true
                });
                triggerRender();
            }, 500 + pulse * 150);
        }

        // Partículas de poder extremo
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 40 + Math.random() * 30;
                particles.push({
                    type: 'deadly',
                    x: x + Math.cos(angle) * dist,
                    y: y - 20 + Math.sin(angle) * dist * 0.35,
                    vx: (x - (x + Math.cos(angle) * dist)) * 0.05,
                    vy: ((y - 20) - (y - 20 + Math.sin(angle) * dist * 0.35)) * 0.05,
                    size: 3 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#dc2626' : '#fff',
                    life: 0.6,
                    decay: 0.02,
                    friction: 0.97,
                    glow: true
                });
                triggerRender();
            }, i * 15);
        }
    }

    function archerDeadlyAimImpact(x, y) {
        if (!particles) return;

        // Flash massivo
        particles.push({
            type: 'deadly',
            x, y,
            vx: 0, vy: 0,
            size: 150,
            color: 'rgba(220, 38, 38, 1)',
            life: 0.2,
            decay: 0.3,
            friction: 1,
            glow: true
        });

        // Explosão devastadora
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 15;
            particles.push({
                type: 'deadly',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 10,
                color: Math.random() > 0.5 ? '#dc2626' : (Math.random() > 0.3 ? '#f97316' : '#fff'),
                life: 0.8,
                decay: 0.015,
                friction: 0.94,
                glow: true
            });
        }

        // Ondas de choque
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                const radius = wave * 25;
                for (let i = 0; i < 40; i++) {
                    const angle = (Math.PI * 2 * i) / 40;
                    particles.push({
                        type: 'deadly',
                        x: x + Math.cos(angle) * radius,
                        y: y + Math.sin(angle) * radius,
                        vx: Math.cos(angle) * (8 + wave * 2),
                        vy: Math.sin(angle) * (8 + wave * 2),
                        size: 5 - wave * 0.5,
                        color: wave < 2 ? '#fff' : '#dc2626',
                        life: 0.4,
                        decay: 0.04,
                        friction: 0.93,
                        glow: true
                    });
                }
                triggerRender();
            }, wave * 50);
        }

        // Faíscas e brasas
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;

            setTimeout(() => {
                particles.push({
                    type: 'deadly',
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 3,
                    size: 2 + Math.random() * 4,
                    color: '#fbbf24',
                    life: 1.0,
                    decay: 0.01,
                    gravity: 0.1,
                    friction: 0.96,
                    twinkle: true
                });
                triggerRender();
            }, Math.random() * 200);
        }

        triggerRender();
    }

    // ==========================================
    // EXPORTAR API GLOBAL
    // ==========================================

    window.MapSFX = {
        init,
        // Efeitos de partículas
        spawnDeathEffect,
        spawnImpactEffect,
        spawnSlashEffect,
        spawnSwordSlashEffect,
        spawnMagicEffect,
        spawnImpactBurst,
        spawnHealEffect,
        spawnHitBurstEffect,
        spawnEnemyHitEffect,
        // Novos efeitos premium
        spawnThunderStrike,
        spawnBloodSplash,
        spawnArcaneExplosion,
        spawnDivineBeam,
        // Novos efeitos para espadachim (10 efeitos)
        spawnSwordWind,
        spawnShieldBashImpact,
        spawnBerserkAura,
        spawnParrySpark,
        spawnCleaveWave,
        spawnLifeDrain,
        spawnStunFlash,
        spawnBleedDrops,
        spawnChampionsAura,
        spawnSwordCombo,
        // Novos efeitos criativos (10 efeitos)
        spawnIceShatter,
        spawnSoulAbsorb,
        spawnDarkVortex,
        spawnPhoenixRise,
        spawnEarthQuake,
        spawnSpiritBlast,
        spawnPoisonCloud,
        spawnShadowStrike,
        spawnCelestialRain,
        spawnNovaExplosion,
        // Efeitos únicos e criativos (8 efeitos)
        spawnMagicCircle,
        spawnChainLightning,
        spawnShockwavePulse,
        spawnMeteorStrike,
        spawnMirrorImages,
        spawnPentagramSummon,
        spawnTimeWarp,
        spawnLaserBeam,
        // Efeitos épicos batch 3 (10 efeitos)
        spawnTornadoVortex,
        spawnBlackHole,
        spawnDragonBreath,
        spawnHealingRain,
        spawnEarthquakeFissure,
        spawnSwordStorm,
        spawnHolyExplosion,
        spawnPoisonNova,
        spawnFrostNova,
        spawnWarcryRoar,
        // Efeitos de cair o queixo batch 1 (10 efeitos)
        spawnGalaxySpiral,
        spawnSamuraiSlash,
        spawnSupernova,
        spawnVampireBite,
        spawnLightningStorm,
        spawnDimensionRift,
        spawnAtomicBlast,
        spawnAngelWings,
        spawnDemonSummon,
        spawnGravityCrush,
        // Efeitos de cair o queixo batch 2 (10 efeitos)
        spawnCrystalPrison,
        spawnSoulReaper,
        spawnElementalFury,
        spawnSpiritBomb,
        spawnBloodMoon,
        spawnThunderGod,
        spawnVoidCollapse,
        spawnInfernoTornado,
        spawnDivineJudgment,
        spawnDeathMark,
        // Archer Skill Effects (Cast & Impact)
        archerQuickShotCast,
        archerQuickShotImpact,
        archerPoisonArrowCast,
        archerPoisonArrowImpact,
        archerFocusedShotCast,
        archerFocusedShotImpact,
        archerPiercingArrowCast,
        archerPiercingArrowImpact,
        archerMultishotCast,
        archerMultishotImpact,
        archerHuntersFocusCast,
        archerTacticalRetreatCast,
        archerTacticalRetreatImpact,
        archerRainOfArrowsCast,
        archerRainOfArrowsImpact,
        archerCripplingShotCast,
        archerCripplingShotImpact,
        archerDeadlyAimCast,
        archerDeadlyAimImpact,
        // Números flutuantes
        showDamageNumber,
        showHealNumber,
        showManaNumber,
        showFloatingText
    };

    console.log('[MAP-SFX] Módulo carregado');
})();

