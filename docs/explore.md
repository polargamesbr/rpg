# Sistema de Exploração e Combate Tático (Map Engine)

> **Propósito**: Documentação completa do sistema de exploração e combate tático no mapa. Destinado a fornecer contexto para LLMs e desenvolvedores futuros.

---

## 📁 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `public/assets/js/map-engine.js` | Motor principal do mapa tático (renderização, lógica de combate, animações) |
| `views/game/explore.php` | View PHP com HTML/CSS do mapa e HUDs |
| `public/assets/js/skills-data.js` | Definições de skills com propriedades táticas |
| `app/GameData/quests/first-steps.json` | Configuração da quest "First Steps" (posições, inimigos, paredes) |
| `app/Controllers/ExploreController.php` | Controller PHP para persistência de estado |
| `app/Services/QuestService.php` | Serviço para construir estado inicial da quest |

---

## 🎮 Visão Geral do Sistema

O sistema implementa um **combate tático baseado em turnos** diretamente no mapa de exploração, inspirado em jogos como **Final Fantasy Tactics** e **XCOM**. Não há tela de batalha separada - todo combate ocorre no próprio mapa.

### Fases do Jogo
```
gameState.phase = 'player' | 'enemy' | 'victory' | 'defeat' | 'freeExplore'
```

- **player**: Turno do jogador - pode mover e atacar/usar skills
- **enemy**: Turno dos inimigos (IA automática)
- **victory**: Todos inimigos derrotados
- **defeat**: Todos aliados derrotados
- **freeExplore**: Mapa livre sem inimigos (pós-vitória)

---

## 🗺️ Sistema de Grid e Coordenadas

### Configuração Base
```javascript
const CONFIG = {
    CELL_SIZE: 48,        // Tamanho de cada célula em pixels
    GRID_COLS: 60,        // Colunas do grid
    GRID_ROWS: 34,        // Linhas do grid
    MOVE_SPEED: 200       // Velocidade de movimento (ms por célula)
};
```

### Cálculo de Distância (Chebyshev)
Usamos distância de Chebyshev para alcance (diagonais contam como 1):
```javascript
const distance = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
```

### Paredes e Colisões
```javascript
const WALLS = [{ x: 8, y: 12 }, { x: 9, y: 13 }, ...];

function isWall(x, y) {
    return WALLS.some(w => w.x === x && w.y === y);
}

function getUnitAt(x, y) {
    // Retorna unidade na posição ou null
}
```

---

## 👤 Estrutura de Unidades

### Propriedades de uma Unidade
```javascript
const unit = {
    id: 'player',
    name: 'Hero',
    type: 'player',           // 'player' ou 'enemy'
    x: 10, y: 8,              // Posição no grid
    renderX: null,            // Posição de renderização (para animação suave)
    renderY: null,
    hp: 300, maxHp: 300,
    mp: 35, maxMp: 35,
    atk: 50, def: 20,
    moveRange: 4,
    attackRange: 1,
    
    // Animações
    animationState: 'idle',   // 'idle', 'walk', 'atack'
    facingRight: false,       // Direção que o sprite está virado
    animations: {
        idle: { animationFPS: 7, animationScale: 2, animationOffsetX: 1, animationOffsetY: 44 },
        walk: { animationFPS: 7, animationScale: 2, animationOffsetX: -3, animationOffsetY: 44 },
        atack: { animationFPS: 12, animationScale: 2, animationOffsetX: 0, animationOffsetY: 44 }
    },
    
    // Estado temporário
    flashRed: false,          // Flash vermelho ao tomar dano
    renderOffsetX: 0,         // Offset para efeitos (knockback)
    renderOffsetY: 0
};
```

### Arrays de Unidades
```javascript
let playerUnits = [];  // Aliados
let enemyUnits = [];   // Inimigos
```

---

## 🎬 Sistema de Animação de Sprites

### Estrutura de Pastas
```
public/assets/img/animations/
├── swordman/
│   ├── idle/     → 1.png, 2.png, ..., 18.png
│   ├── walk/     → 1.png, 2.png, ..., 40.png
│   └── atack/    → 1.png, 2.png, ..., 24.png
├── slime/
│   └── idle/     → 1.png, 2.png, ...
└── wolf/
    ├── idle/     → 1.png, 2.png, ...
    └── walk/     → 1.png, 2.png, ...
```

### Carregamento de Sprites
```javascript
const spriteCache = new Map(); // Cache global de sprites

async function loadSpriteAnimation(spriteName, animationType) {
    // Carrega frames sequencialmente até 404
    // Detecta automaticamente quantidade de frames
    // Armazena em spriteCache
}
```

### Renderização de Frame
```javascript
function getCurrentSpriteFrameIndex(sheet, unit) {
    // Para animações em loop (idle, walk):
    const frameIndex = Math.floor(animationFrame / (60 / sheet.fps)) % sheet.frameCount;
    
    // Para animações não-loop (atack):
    // Toca uma vez e reverte para 'idle'
}
```

### Espelhamento (Facing)
```javascript
// Jogador: espelha baseado na posição do mouse
if (mouseWorldX > unitCenterX) unit.facingRight = true;

// Inimigo: espelha baseado na posição do player mais próximo
if (nearestPlayer.x > unit.x) unit.facingRight = true;
```

---

## ⚔️ Sistema de Combate

### Fluxo de Turno do Jogador
```
1. startPlayerTurn()
   ├── Camera foca no herói
   ├── Auto-seleciona primeira unidade viva
   └── Mostra Tactical HUD

2. Jogador clica em célula
   ├── Se célula alcançável → moveUnitTo()
   ├── Se inimigo em range de ataque → executeAttack()
   └── Se fora de range → showGlobalNotification("Fora de alcance")

3. Após ação → unitsActedThisTurn.add(unit.id)

4. Jogador clica "Encerrar Turno" → endPlayerTurn()
```

### Fluxo de Turno do Inimigo
```javascript
async function startEnemyTurn() {
    for (const enemy of enemyUnits) {
        if (enemy.hp <= 0) continue;
        
        // IA simples:
        // 1. Se player em range de ataque → atacar
        // 2. Senão → mover em direção ao player mais próximo
        // 3. Se agora em range → atacar
        
        await delay(500); // Pausa entre ações
    }
    endEnemyTurn();
}
```

### Execução de Ataque
```javascript
async function executeAttack(attacker, target) {
    // 1. Verificar range (Chebyshev distance)
    const dist = Math.max(Math.abs(attacker.x - target.x), Math.abs(attacker.y - target.y));
    if (dist > attacker.attackRange) return false;
    
    // 2. Tocar animação de ataque (se existir)
    if (hasAtackAnimation) {
        attacker.animationState = 'atack';
        attacker.animationStartFrame = animationFrame;
        await delay(attackDuration * 0.5); // Aplica dano no meio da animação
    }
    
    // 3. Calcular dano
    const baseDmg = attacker.atk - target.def / 2;
    const variance = baseDmg * 0.2;
    const damage = Math.floor(baseDmg + (Math.random() * variance * 2 - variance));
    const isCrit = Math.random() < 0.1; // 10% chance
    const finalDamage = isCrit ? damage * 2 : damage;
    
    // 4. Aplicar dano
    target.hp = Math.max(0, target.hp - finalDamage);
    
    // 5. Efeitos visuais e sonoros
    showDamageNumber(targetX, targetY, finalDamage, isCrit);
    playSfx(isCrit ? 'critical' : 'hit');
    spawnHitBurstEffect(targetX, targetY);
    target.flashRed = true;
    
    // 6. Verificar morte
    if (target.hp <= 0) {
        showKillBanner(target.name);
        checkBattleEnd();
    }
    
    // 7. Reverter para idle
    attacker.animationState = 'idle';
}
```

---

## 🎨 Sistema de Renderização

### Loop Principal
```javascript
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    drawGrid();                    // Grid base
    drawReachableCells();          // Células alcançáveis (movimento)
    drawAttackRange();             // Range de ataque (vermelho)
    drawPathPreview();             // Preview do caminho
    
    // Desenhar unidades ordenadas por Y (painter's algorithm)
    const allUnits = [...playerUnits, ...enemyUnits].sort((a, b) => a.y - b.y);
    
    // Primeiro: sprites de todas unidades
    allUnits.forEach(u => drawUnitSprite(u));
    
    // Depois: barras HP/MP (sempre no topo)
    allUnits.forEach(u => drawUnitBars(u));
    
    drawFloatingTexts();           // Números de dano
    drawParticles();               // Partículas
    drawHoveredCell();             // Célula sob o mouse
    
    ctx.restore();
    
    animationFrame++;
    requestAnimationFrame(render);
}
```

### Camadas de Renderização (Z-Order)
1. Grid e tiles
2. Células destacadas (movimento/ataque)
3. Sombras ovais dos personagens
4. Sprites dos personagens (ordenados por Y)
5. Barras de HP/MP (sempre no topo)
6. Partículas e efeitos
7. Textos flutuantes (dano)
8. HUD overlay

---

## 📊 HUDs e Interface

### Tactical HUD (Inferior Central)
```html
<div id="tactical-hud" class="tactical-hud">
    <!-- Info da unidade selecionada -->
    <div class="hud-unit-name">Hero</div>
    <div class="hud-bar-row">
        <div class="hud-bar hp">
            <div class="hud-bar-fill" style="width: 80%"></div>
            <span class="hud-bar-text">240/300</span>
        </div>
    </div>
    
    <!-- Botões de ação -->
    <button id="btn-attack">Atacar [A]</button>
    <button id="btn-skills">Skills [S]</button>
    <button id="btn-defend">Defender [D]</button>
    <button id="btn-end-turn">Encerrar [E]</button>
</div>
```

### Turn Timeline (Superior Central)
```html
<div id="turn-timeline" class="turn-timeline">
    <span class="timeline-label">Ordem</span>
    <div class="timeline-unit player active">
        <img src="hero.png" alt="Hero">
    </div>
    <div class="timeline-separator"></div>
    <div class="timeline-unit enemy">
        <img src="slime.png" alt="Slime">
    </div>
</div>
```

### Combat Log (Lateral)
```javascript
const combatLog = [];
const MAX_LOG_ENTRIES = 20;

function addLogEntry(type, message) {
    combatLog.unshift({ type, message, timestamp: Date.now() });
    if (combatLog.length > MAX_LOG_ENTRIES) combatLog.pop();
    updateCombatLog();
}
```

### Notificações Globais
```javascript
function showGlobalNotification(message, type = 'info', iconName = 'info') {
    // Banner discreto no topo da tela
    // Tipos: 'info', 'warning', 'error', 'success'
    // Auto-hide após 3 segundos
}
```

---

## 🔊 Sistema de Áudio

### Configuração
```javascript
const audioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.3,
    sfxVolume: 0.5
};

const audioCache = new Map(); // Cache de áudios carregados
```

### Sons Disponíveis
```
public/assets/mp3/
├── battle.mp3          # Música de batalha
├── sword1.mp3-sword4.mp3  # Ataques de espada
├── hit1.mp3-hit3.mp3      # Impactos
├── critical.mp3           # Crítico/Kill
├── wolf_claw_hit1-4.mp3   # Ataques de lobo
└── slime.mp3              # Ataques de slime
```

### Funções de Áudio
```javascript
function playSfx(name) {
    if (!audioSettings.sfxEnabled) return;
    const audio = new Audio(`/public/assets/mp3/${name}.mp3`);
    audio.volume = audioSettings.sfxVolume;
    audio.play();
}

function playMusic(name) {
    if (!audioSettings.musicEnabled) return;
    currentMusic = new Audio(`/public/assets/mp3/${name}.mp3`);
    currentMusic.loop = true;
    currentMusic.volume = audioSettings.musicVolume;
    currentMusic.play();
}
```

---

## 💾 Persistência de Estado

### Backend (PHP)
```php
// ExploreController::getState()
// Retorna estado atual da sessão

// ExploreController::move()
// Persiste nova posição do jogador

// ExploreController::setState()
// Salva estado completo (posições, HP, fase, etc)
```

### Frontend → Backend
```javascript
async function persistSessionState() {
    if (!sessionUid) return;
    
    await fetch(`/game/explore/state?session=${sessionUid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            playerUnits,
            enemyUnits,
            phase: gameState.phase,
            unitsActedThisTurn: [...gameState.unitsActedThisTurn]
        })
    });
}
```

### Restauração no Load
```javascript
async function loadStateFromBackend() {
    const res = await fetch(`/game/explore/state?session=${sessionUid}`);
    const data = await res.json();
    
    playerUnits = data.playerUnits || [];
    enemyUnits = data.enemyUnits || [];
    gameState.phase = data.phase || 'player';
    gameState.unitsActedThisTurn = new Set(data.unitsActedThisTurn || []);
}
```

---

## 🔧 Modo Debug

### Ativação
```
URL: /game/explore?session=xxx&debug=true
```

### Funcionalidades
- **Painel de Debug**: Controles de FPS, escala, offset X/Y
- **Setas de Movimento**: Move personagem pixel a pixel
- **Seleção de Animação**: Alternar entre idle/walk/atack
- **JSON de Configuração**: Copiar config atual para clipboard
- **Edição de Paredes**: Clicar para adicionar/remover paredes

### Variáveis de Debug
```javascript
let debugMode = false;
let debugSelectedUnit = null;
let debugAnimationState = null; // 'idle', 'walk', 'atack'
let debugWallsAdded = [];
let debugWallsRemoved = [];
```

---

## 🎯 Pathfinding (A*)

```javascript
function findPath(startX, startY, endX, endY, maxRange = Infinity) {
    // Implementação A* padrão
    // Considera paredes e outras unidades como obstáculos
    // Retorna array de {x, y} ou null se impossível
}

function getReachableCells(unit) {
    // BFS para encontrar todas células alcançáveis
    // Limitado por unit.moveRange
    // Retorna Set de "x,y" strings
}
```

---

## ⚡ Efeitos Visuais

### Partículas
```javascript
const particles = [];

function spawnHitBurstEffect(x, y) {
    // Explosão vermelha no impacto
}

function spawnSwordSlashEffect(x, y, angle) {
    // Arco de espada
}
```

### Damage Numbers
```javascript
function showDamageNumber(x, y, damage, isCrit = false) {
    floatingTexts.push({
        x, y,
        text: isCrit ? `${damage}!` : String(damage),
        color: isCrit ? '#ff0' : '#fff',
        size: isCrit ? 52 : 42,
        bounce: true,
        rotation: isCrit ? (Math.random() - 0.5) * 0.3 : 0,
        life: 60
    });
}
```

### Screen Effects
```javascript
function shakeScreen(intensity = 10, duration = 200) {
    // Shake da câmera
}

function flashScreen(color = 'white', duration = 100) {
    // Flash global
}
```

---

## 📋 Fluxos Principais

### Início de Quest
```
1. Jogador aceita quest na taverna
2. QuestService::createSession() → cria session no banco
3. Redirect para /game/explore?session=xxx
4. map-engine.js::init()
   ├── Carrega sprites
   ├── Carrega estado do backend
   ├── Inicia render loop
   └── Inicia turno do jogador
```

### Vitória
```
1. Último inimigo morre
2. checkBattleEnd() detecta enemyUnits.filter(e => e.hp > 0).length === 0
3. gameState.phase = 'victory'
4. Mostra banner de vitória
5. Transição para 'freeExplore'
6. Jogador pode se mover livremente
7. Ao chegar no portal → modal de conclusão
8. Confirma → completeQuest() → redirect para taverna
```

### Derrota
```
1. Último aliado morre
2. checkBattleEnd() detecta playerUnits.filter(p => p.hp > 0).length === 0
3. gameState.phase = 'defeat'
4. Mostra tela de derrota
5. Opção de retry ou voltar à taverna
```

---

## 🔑 Constantes Importantes

```javascript
// Offsets padrão de sprite
const DEFAULT_SPRITE_OFFSET_X = 0;
const DEFAULT_SPRITE_OFFSET_Y = 44;

// Configurações de animação padrão
const DEFAULT_ANIMATION_FPS = 7;
const DEFAULT_ANIMATION_SCALE = 2.0;

// Tamanhos
const CELL_SIZE = 48;
const HP_BAR_WIDTH = radius * 1.8;
const HP_BAR_HEIGHT = 6;
```

---

## 🐛 Problemas Conhecidos e Soluções

| Problema | Solução |
|----------|---------|
| Sprite muito rápido | Reduzir `animationFPS` (padrão: 7) |
| HP bar no meio do personagem | Ajustar `animationOffsetY` |
| Personagem pequeno demais | Aumentar `animationScale` |
| Animação não encontrada | Verificar pasta e nomes dos arquivos (1.png, 2.png, ...) |
| Estado não persiste | Verificar chamadas a `persistSessionState()` |
| Debug ativo sem parâmetro | Verificar `window.location.search.includes('debug=true')` |

---

## 📝 Notas para LLMs Futuras

1. **Nunca use localStorage/sessionStorage** para estado do jogo - use apenas backend
2. **Animações são detectadas automaticamente** - arquivos devem ser nomeados 1.png, 2.png, etc.
3. **Chebyshev distance** para range de ataque (diagonais = 1)
4. **Barras HP são renderizadas em camada separada** para sempre ficarem no topo
5. **Sprites são espelhados com `ctx.scale(-1, 1)`** quando `unit.facingRight = true`
6. **Animação 'atack' não faz loop** - toca uma vez e reverte para 'idle'
7. **O quadrado azul foi removido** - apenas sombra oval sob personagens
8. **Tactical HUD substitui todos os menus antigos** (action-menu, group-hud, etc.)

---

*Última atualização: Janeiro 2026*


