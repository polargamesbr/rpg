# Plano: Sistema de Sprites Animados no Mapa

## Objetivo
Substituir os avatares circulares por sprites animados (spritesheets) para personagens e monstros no mapa tático, permitindo animações fluidas e visuais mais ricos.

## Estrutura de Arquivos de Animação

### Formato Esperado
- Pasta: `/public/assets/img/animations/{entity_type}/`
- Padrão: `animation_0001.png` até `animation_0032.png` (32 frames)
- Exemplo atual: `/public/assets/img/animations/swordman/animation_0001.png` ... `animation_0032.png`

### Metadados da Sprite
Cada sprite pode ter dimensões diferentes:
- Exemplo swordman: 834x1112 pixels
- Base deve alinhar com a célula (CONFIG.CELL_SIZE)
- Altura pode ultrapassar 1 célula (permitir 2+ células se necessário)

## Arquitetura da Implementação

### 1. Sistema de Carregamento de Spritesheets

**Classe/Função: `SpriteSheetLoader`**
```javascript
- Carregar todas as frames de uma spritesheet de forma assíncrona
- Cachear spritesheets carregadas
- Gerenciar diferentes animações (idle, walk, attack, death, etc.)
- Suportar diferentes padrões de numeração (0001-0032, 1-32, etc.)
```

**Estrutura de Dados:**
```javascript
spriteCache = {
    'swordman': {
        frames: [Image, Image, ...], // 32 imagens
        frameCount: 32,
        fps: 20,              // Frames por segundo (padrão)
        width: 834,
        height: 1112,
        loaded: true,
        baseWidth: 834,       // Para cálculo de escala
        anchor: { x: 0.5, y: 1.0 } // Ponto de ancoragem (centro horizontal, base vertical)
    }
}
```

### 2. Configuração de Sprites por Entidade

**Mapeamento:**
- Cada unidade (`playerUnits`, `enemyUnits`) precisa de um identificador de sprite
- Mapear `unit.class` ou `unit.combatKey` para o nome da pasta de animação
- Exemplo: `swordsman` → `/animations/swordman/`
- Inimigos: `slime` → `/animations/slime/`, `wolf` → `/animations/wolf/`

**Configuração no Estado da Unidade:**
```javascript
unit = {
    id: 'player',
    class: 'swordsman',
    sprite: 'swordman',  // Nome da pasta de animação
    spriteFrame: 0,      // Frame atual (atualizado pela animação)
    // ... outras propriedades
}
```

### 3. Sistema de Animação

**Gerente de Animação:**
```javascript
- Loop de animação baseado em `animationFrame` (já existe no código)
- Calcular frame atual baseado em FPS e tempo
- Suportar diferentes estados de animação (idle, walking, attacking)
- Loop infinito para idle (0001 → 0032 → 0001)
```

**Cálculo de Frame:**
```javascript
const fps = spriteSheet.fps || 20;
const frameDuration = 1000 / fps; // ms por frame
const totalFrames = spriteSheet.frameCount;
const currentFrameIndex = Math.floor((elapsedTime / frameDuration) % totalFrames);
```

### 4. Renderização no Canvas

**Substituir `drawUnit()` atual:**

**Alterações:**
1. Verificar se a unidade tem sprite configurado
2. Se tiver, usar `drawUnitSprite()` em vez de `drawUnitAvatar()`
3. Se não tiver sprite, fallback para avatar circular (retrocompatibilidade)

**Função `drawUnitSprite()`:**
```javascript
function drawUnitSprite(unit, spriteSheet) {
    // 1. Calcular frame atual
    const frameIndex = getCurrentFrameIndex(unit, spriteSheet);
    const frameImg = spriteSheet.frames[frameIndex];
    
    // 2. Calcular escala para encaixar na célula (largura base)
    const targetBaseWidth = CONFIG.CELL_SIZE * 0.9; // 90% da célula
    const scale = targetBaseWidth / spriteSheet.baseWidth;
    const scaledWidth = spriteSheet.width * scale;
    const scaledHeight = spriteSheet.height * scale;
    
    // 3. Calcular posição de desenho
    // Anchor point: centro horizontal, base vertical
    const anchorX = spriteSheet.anchor.x || 0.5;
    const anchorY = spriteSheet.anchor.y || 1.0;
    const drawX = -(scaledWidth * anchorX);
    const drawY = -(scaledHeight * anchorY); // Base alinhada com a célula
    
    // 4. Aplicar efeitos visuais (hasActed, selected, etc.)
    // 5. Desenhar frame no canvas
    ctx.drawImage(frameImg, drawX, drawY, scaledWidth, scaledHeight);
}
```

### 5. Carregamento Assíncrono e Estados

**Sequência de Carregamento:**
1. Ao inicializar entidades, detectar quais sprites são necessários
2. Carregar spritesheets em paralelo (Promise.all)
3. Renderizar sprites apenas quando carregados (fallback para avatar circular durante carregamento)

**Loading States:**
```javascript
spriteCache = {
    'swordman': {
        state: 'loading' | 'loaded' | 'error',
        frames: [],
        // ...
    }
}
```

### 6. Configuração Flexível de Sprites

**Estrutura de Configuração (futuro):**
```javascript
const SPRITE_CONFIGS = {
    swordman: {
        path: '/public/assets/img/animations/swordman/animation_%04d.png',
        frameCount: 32,
        fps: 20,
        baseWidth: 834,  // Largura base para cálculo de escala
        anchor: { x: 0.5, y: 1.0 },
        pad: 4  // Zeros à esquerda (0001)
    },
    slime: {
        path: '/public/assets/img/animations/slime/animation_%04d.png',
        frameCount: 24,
        fps: 15,
        baseWidth: 500,
        anchor: { x: 0.5, y: 1.0 },
        pad: 4
    }
};
```

### 7. Otimizações

**Performance:**
- Cachear spritesheets carregadas (evitar recarregar)
- Pré-carregar sprites conhecidos na inicialização
- Usar requestAnimationFrame para animação suave
- Renderizar apenas unidades visíveis (viewport culling - futuro)

**Memória:**
- Carregar apenas sprites necessários para a sessão atual
- Permitir descarregar sprites não utilizados (lazy loading)

## Implementação Passo a Passo

### Fase 1: Base de Carregamento
- [ ] Criar `SpriteSheetLoader` com função de carregamento assíncrona
- [ ] Implementar detecção automática de padrão de frames (0001-0032)
- [ ] Criar sistema de cache de spritesheets
- [ ] Adicionar fallback para avatar circular durante carregamento

### Fase 2: Sistema de Animação
- [ ] Implementar cálculo de frame atual baseado em FPS
- [ ] Integrar com `animationFrame` existente
- [ ] Testar loop de animação idle (infinito)

### Fase 3: Renderização
- [ ] Criar `drawUnitSprite()` com cálculo de escala e anchor
- [ ] Integrar com `drawUnit()` existente (substituir avatar circular)
- [ ] Manter efeitos visuais (selection aura, hasActed, etc.)
- [ ] Testar alinhamento base na célula

### Fase 4: Mapeamento e Configuração
- [ ] Mapear `unit.class` → nome da pasta de sprite
- [ ] Adicionar configuração de sprite no `unit` object
- [ ] Suportar configuração via quest config (futuro)
- [ ] Adicionar suporte para múltiplos estados de animação (idle/walk/attack)

### Fase 5: Testes e Refinamento
- [ ] Testar com swordman (32 frames, 834x1112)
- [ ] Verificar performance com múltiplas unidades
- [ ] Ajustar FPS e escala conforme necessário
- [ ] Documentar padrões de sprites para novos assets

## Estrutura de Código Proposta

### Localização no `map-engine.js`:

**Novas Funções:**
```javascript
// =====================================================
// SPRITE SYSTEM
// =====================================================
let spriteCache = new Map();

function loadSpriteSheet(entityType, config) { }
function getSpriteSheet(entityType) { }
function getCurrentFrameIndex(unit, spriteSheet) { }
function drawUnitSprite(unit, spriteSheet) { }
```

**Modificações:**
- `initializeEntitiesFromSession()`: Detectar e carregar sprites necessários
- `loadImages()`: Incluir carregamento de spritesheets
- `drawUnit()`: Usar sprite se disponível, senão avatar circular
- `gameLoop()`: Atualizar frames de animação (já usa `animationFrame`)

## Considerações de Design

### Escala e Alinhamento
- **Largura base**: Usar 90% de `CONFIG.CELL_SIZE` para largura base
- **Altura**: Permitir que ultrapasse a célula (2+ células se necessário)
- **Anchor**: Base vertical alinhada com a célula (y: 1.0)
- **Centro horizontal**: Alinhado ao centro da célula (x: 0.5)

### Estados de Animação (Futuro)
- `idle`: Loop infinito (0001 → 0032)
- `walk`: Animação de caminhada (pode usar mesmos frames ou conjunto diferente)
- `attack`: Animação de ataque (frames específicos)
- `death`: Animação de morte (uma vez, não loop)

### Retrocompatibilidade
- Se unidade não tiver sprite configurado, usar avatar circular
- Se sprite falhar ao carregar, fallback para avatar
- Manter sistema de avatar para casos especiais (chests, portal, etc.)

## Notas Técnicas

### Canvas Performance
- Desenhar sprites é eficiente no canvas
- 32 frames por sprite não é problema de memória
- FPS de 20 é suave para animação idle

### Padrão de Nomenclatura
- Usar `animation_%04d.png` para flexibilidade
- Suportar diferentes contagens de frame (16, 24, 32, etc.)
- Detectar automaticamente o número de frames disponíveis

### Expansibilidade
- Sistema preparado para múltiplos estados de animação
- Fácil adicionar novas entidades com sprites
- Configuração centralizada para facilitar manutenção

