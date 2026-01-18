# Melhorias de UX e Efeitos Visuais - Combate Tático

## Objetivo
Implementar melhorias de UX, efeitos visuais aprimorados e sistema de áudio completo para o combate tático no mapa.

## Análise do Código Atual

### Arquivos Principais
- `public/assets/js/map-engine.js` (6293 linhas) - Lógica principal do mapa e combate
- `views/game/explore.php` - HTML/CSS da interface
- `public/assets/mp3/` - Biblioteca de sons (sword1-4.mp3, hit1-3.mp3, impact.mp3, critical.mp3, battle.mp3, wolf_claw_hit1-4.mp3, slime.mp3, etc.)

### Pontos de Modificação Identificados
1. **Seleção de Unidades** (linha ~2240): `deselectUnit()` permite desselecionar mesmo com único personagem
2. **Mensagem Irritante** (linha ~4011): `showNotification('Área vermelha = alcance. Clique no inimigo.', 'info')`
3. **Área de Ataque** (linha ~3705): `drawAttackRange()` usa estilo simples preto/cinza
4. **Área de Movimento** (linha ~5140): `drawReachableCells()` tem estilo azul/preto e branco elegante
5. **Checked Badge** (linha ~5844): Posicionado em `radius * 0.7, -radius * 0.7` (canto superior direito)
6. **Sons de Ataque** (linha ~2736): Apenas swordman e wolf têm sons, falta slime
7. **UI de Dano** (linha ~2600): `showDamageNumber()` usa fonte Cinzel 900, mas pode melhorar
8. **Música de Batalha** (linha ~2657): Não toca `battle.mp3` na primeira ação hostil
9. **HUD de Áudio**: Não existe
10. **Efeito de Dano em Inimigos** (linha ~2694): `animateLean()` só funciona para atacante, não para alvo

## Implementação

### 1. Prevenir Desseleção de Único Personagem
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `deselectUnit(force = false)` (linha ~2240)
**Mudança**: Adicionar verificação se há apenas 1 personagem vivo e não permitir desseleção (exceto com `force = true`)

```javascript
function deselectUnit(force = false) {
    // Se há apenas 1 personagem vivo, não permitir desseleção (exceto force)
    if (!force && playerUnits.filter(u => u.hp > 0).length === 1 && gameState.selectedUnit) {
        return; // Não desselecionar
    }
    // ... resto do código
}
```

**Também em**: `handleCellClick()` (linha ~4599) - remover chamada de `deselectUnit()` quando há apenas 1 personagem

### 2. Remover Mensagem Irritante
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: Event listener `tactical-attack` (linha ~4008)
**Mudança**: Remover linha `showNotification('Área vermelha = alcance. Clique no inimigo.', 'info');`

### 3. Melhorar Área de Ataque (Estilo Azul/Preto e Branco)
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `drawAttackRange()` (linha ~3705)
**Mudança**: Replicar estilo de `drawReachableCells()` mas com cores vermelhas, e aplicar desaturação (preto e branco) no mapa fora da área

**Estratégia**:
- Criar overlay de desaturação para células fora de `attackRangeCells`
- Estilo vermelho similar ao azul de movimento (gradiente, scanline, neon frame, dots)
- Células com inimigos destacadas com borda mais grossa e ícone ⚔

### 4. Mensagem "Fora de Alcance" Discreta no Topo
**Arquivo**: `public/assets/js/map-engine.js` e `views/game/explore.php`
**Função**: `handleCellClick()` (linha ~4504)
**Mudança**: 
- Remover `showNotification()` genérica
- Criar HUD discreta no topo (`#range-warning-banner`)
- Mostrar apenas quando clicar em inimigo fora da área de ataque

**HTML** (adicionar em `explore.php`):
```html
<div id="range-warning-banner" class="range-warning-banner">
    <span>⚠️ Inimigo fora de alcance</span>
</div>
```

**CSS** (adicionar em `explore.php`):
```css
.range-warning-banner {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 150;
}
.range-warning-banner.visible {
    opacity: 1;
    visibility: visible;
}
```

**JS** (adicionar função em `map-engine.js`):
```javascript
function showRangeWarning() {
    const banner = document.getElementById('range-warning-banner');
    if (!banner) return;
    banner.classList.add('visible');
    setTimeout(() => banner.classList.remove('visible'), 2000);
}
```

**Usar em**: `handleCellClick()` quando clicar em inimigo fora de alcance

### 5. Som para Slimes e Lobos ao Atacar
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `executeAttack()` (linha ~2736)
**Mudança**: Adicionar lógica para slime

```javascript
// Som de espada/claw/slime
const attackerSprite = getSpriteNameForUnit(attacker);
if (attackerSprite === 'swordman') {
    playSwordSfx(isCrit);
} else if (attackerSprite === 'wolf') {
    playClawSfx();
} else if (attackerSprite === 'slime') {
    playSfx('slime.mp3', 0.5, 1.0); // Som de slime
}
```

**Também adicionar função**:
```javascript
function playSlimeSfx() {
    playSfx('slime.mp3', 0.5, 1.0);
}
```

### 6. Melhorar UI do Dano (1000%)
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `showDamageNumber()` (linha ~2599) e `drawFloatingTexts()` (linha ~4241)
**Mudanças**:
- Aumentar tamanho da fonte (40/50 para crítico, 32/40 para normal)
- Adicionar animação de "pulo" (bounce) no início
- Adicionar gradiente de cor (vermelho escuro → claro)
- Adicionar sombra mais dramática
- Adicionar efeito de "scale" mais pronunciado
- Adicionar rotação leve para críticos

### 7. Mover Checked para Centro Inferior do Quadrado Azul
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `drawUnit()` - seção "Action Completed Badge" (linha ~5844)
**Mudança**: Alterar posição de `ctx.translate(radius * 0.7, -radius * 0.7)` para `ctx.translate(0, baseHalf + 8)` (centro inferior do quadrado azul)

### 8. Tocar battle.mp3 na Primeira Ação Hostil
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `triggerBattleEncounter()` (linha ~2648) e `executeAttack()` (linha ~2683)
**Mudança**: Adicionar `playSfx('battle.mp3', 0.4, 1.0)` quando `gameState.battleStarted` é definido como `true`

**Nota**: Verificar se já existe música tocando e não sobrepor

### 9. Criar HUD de Música no Topo Esquerdo
**Arquivo**: `views/game/explore.php` e `public/assets/js/map-engine.js`
**HTML** (adicionar em `explore.php`, dentro de `.top-hud`):
```html
<div class="audio-controls">
    <button id="toggle-music" class="audio-btn" title="Mutar/Desmutar Música">
        <i data-lucide="music"></i>
    </button>
    <button id="toggle-sfx" class="audio-btn" title="Mutar/Desmutar Efeitos">
        <i data-lucide="volume-2"></i>
    </button>
</div>
```

**CSS** (adicionar em `explore.php`):
```css
.audio-controls {
    display: flex;
    gap: 0.5rem;
}
.audio-btn {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e2e8f0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}
.audio-btn:hover {
    background: rgba(255,255,255,0.1);
}
.audio-btn.muted {
    opacity: 0.5;
}
```

**JS** (adicionar em `map-engine.js`):
```javascript
// Estado de áudio
let audioSettings = {
    musicEnabled: true,
    sfxEnabled: true
};

// Carregar do localStorage
if (localStorage.getItem('rpg_audio_music') !== null) {
    audioSettings.musicEnabled = localStorage.getItem('rpg_audio_music') === 'true';
}
if (localStorage.getItem('rpg_audio_sfx') !== null) {
    audioSettings.sfxEnabled = localStorage.getItem('rpg_audio_sfx') === 'true';
}

// Modificar playSfx para respeitar mute
function playSfx(fileName, volume = 0.5, playbackRate = 1.0) {
    if (!audioSettings.sfxEnabled) return null;
    // ... resto do código existente
}

// Event listeners
document.getElementById('toggle-music')?.addEventListener('click', () => {
    audioSettings.musicEnabled = !audioSettings.musicEnabled;
    localStorage.setItem('rpg_audio_music', audioSettings.musicEnabled);
    updateAudioButtons();
    if (!audioSettings.musicEnabled && currentBattleMusic) {
        currentBattleMusic.pause();
    }
});

document.getElementById('toggle-sfx')?.addEventListener('click', () => {
    audioSettings.sfxEnabled = !audioSettings.sfxEnabled;
    localStorage.setItem('rpg_audio_sfx', audioSettings.sfxEnabled);
    updateAudioButtons();
});

function updateAudioButtons() {
    const musicBtn = document.getElementById('toggle-music');
    const sfxBtn = document.getElementById('toggle-sfx');
    if (musicBtn) musicBtn.classList.toggle('muted', !audioSettings.musicEnabled);
    if (sfxBtn) sfxBtn.classList.toggle('muted', !audioSettings.sfxEnabled);
}
```

### 10. Melhorar Efeito de Dano em Inimigos (Inclinar + Partículas)
**Arquivo**: `public/assets/js/map-engine.js`
**Função**: `executeAttack()` (linha ~2707)
**Mudança**: Adicionar animação de "knockback" (inclinar para trás) no alvo, similar a `animateLean()` mas invertido

**Criar função**:
```javascript
async function animateKnockback(unit, direction) {
    // Inclinar unidade para trás (oposto da direção do ataque)
    const originalOffsetX = unit.renderOffsetX || 0;
    const originalOffsetY = unit.renderOffsetY || 0;
    
    // Calcular direção oposta
    const knockbackX = -direction.x * 8; // 8px para trás
    const knockbackY = -direction.y * 8;
    
    unit.renderOffsetX = knockbackX;
    unit.renderOffsetY = knockbackY;
    needsRender = true;
    
    await sleep(100);
    
    // Voltar suavemente
    const steps = 5;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        unit.renderOffsetX = knockbackX * (1 - t);
        unit.renderOffsetY = knockbackY * (1 - t);
        needsRender = true;
        await sleep(20);
    }
    
    unit.renderOffsetX = originalOffsetX;
    unit.renderOffsetY = originalOffsetY;
    needsRender = true;
}
```

**Usar em `executeAttack()`**:
```javascript
// Calcular direção do ataque
const dirX = target.x - attacker.x;
const dirY = target.y - attacker.y;
const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
const direction = { x: dirX / dirLength, y: dirY / dirLength };

// Efeitos simultâneos
const effectPromises = [
    flashUnitRed(target, 500),
    animateKnockback(target, direction), // NOVO
];
```

**Também adicionar partículas extras** (inspirado em `sfx.html`):
```javascript
function spawnEnemyHitEffect(x, y, isCrit = false) {
    // Partículas de impacto mais intensas
    for (let i = 0; i < (isCrit ? 40 : 25); i++) {
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
}
```

**Chamar em `executeAttack()`**:
```javascript
spawnEnemyHitEffect(targetPxX, targetPxY, isCrit);
```

## Ordem de Implementação

1. **Prevenir desseleção** (rápido, impacto imediato)
2. **Remover mensagem irritante** (rápido)
3. **HUD de áudio** (base para outros sons)
4. **Melhorar área de ataque** (visual importante)
5. **Mensagem discreta de alcance** (UX)
6. **Sons para slimes** (completa áudio)
7. **Música de batalha** (usando HUD de áudio)
8. **UI de dano melhorada** (impacto visual)
9. **Checked no centro inferior** (polimento)
10. **Efeito de knockback em inimigos** (mais complexo, efeito final)

## Testes

Após cada implementação, testar:
- [ ] Único personagem não pode ser desselecionado
- [ ] Mensagem irritante não aparece
- [ ] Área de ataque tem estilo vermelho/preto e branco
- [ ] Mensagem "fora de alcance" aparece apenas quando necessário
- [ ] Slimes tocam som ao atacar
- [ ] UI de dano está mais impactante
- [ ] Checked está no centro inferior
- [ ] Música de batalha toca na primeira ação
- [ ] HUD de áudio funciona (mutar música e SFX)
- [ ] Inimigos inclinam para trás ao levar dano

## Notas Técnicas

- **Desaturação do mapa**: Usar `ctx.filter = 'grayscale(100%)'` e `ctx.globalCompositeOperation` para aplicar apenas nas células fora da área
- **Performance**: Partículas limitadas a 100 simultâneas
- **Compatibilidade**: Verificar se `localStorage` está disponível antes de usar
- **Áudio**: Usar `Audio` API nativa, não Web Audio API para música de fundo (mais simples)

