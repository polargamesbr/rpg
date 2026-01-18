/**
 * Map SFX - Efeitos Visuais para o Sistema de Combate Tático
 * Desacoplado do map-engine.js para melhor organização
 */
(function() {
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
        // Números flutuantes
        showDamageNumber,
        showHealNumber,
        showManaNumber,
        showFloatingText
    };

    console.log('[MAP-SFX] Módulo carregado');
})();

