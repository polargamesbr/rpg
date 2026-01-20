# Migração para WebGL (Pixi.js) – Guia

O jogo usa **Canvas 2D** (`getContext('2d')`), que desenha na **CPU**. Em telas grandes (4K, 57") isso causa lag. **WebGL** desenha na **GPU** e escala muito melhor. O **Pixi.js** é um renderer 2D em cima de WebGL, com API simples (sprites, graphics, filtros, etc.).

---

## 1. Por que Pixi.js (e não WebGL puro)?

| Opção        | Prós                         | Contras                          |
|-------------|------------------------------|----------------------------------|
| **WebGL puro** | Controle total, mínimo de lib | Shaders, buffers, batching à mão |
| **Pixi.js** | Sprites, textures, Graphics, filtros, bem documentado | Mais um dependency               |
| **Phaser**  | Engine de jogo completa      | Pesado se só precisar de render  |

Para um tactical RPG 2D, **Pixi.js** costuma ser o melhor custo/benefício.

---

## 2. Adicionar o Pixi

Em `views/game/explore.php`, **antes** do `map-engine.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js"></script>
<script src="<?= asset('js/map-engine.js') ?>"></script>
```

Ou via npm (se tiver build):

```bash
npm install pixi.js
```

```js
import * as PIXI from 'pixi.js';
```

---

## 3. Conceitos: de Canvas 2D para Pixi

### 3.1 Aplicação e stage

**Hoje (2D):**
```js
canvas = document.getElementById('map-canvas');
ctx = canvas.getContext('2d');
// no game loop: ctx.fillRect, ctx.drawImage, etc.
```

**Com Pixi:**
```js
const app = new PIXI.Application();
await app.init({
  background: 0x0d1117,
  resizeTo: document.getElementById('map-container'),
  // ou: view: document.getElementById('map-canvas') para reusar o <canvas>
});
document.getElementById('map-container').appendChild(app.canvas);
// stage = app.stage é a raiz. Tudo é filho do stage ou de containers.
```

### 3.2 Câmera (pan + zoom)

**Hoje:** `ctx.translate(viewState.x, viewState.y); ctx.scale(viewState.scale, viewState.scale);`

**Pixi:** um container “world” que engloba mapa, grid, unidades. Você move e escala o container:

```js
const world = new PIXI.Container();
app.stage.addChild(world);

// cada frame (no game loop):
world.position.set(viewState.x, viewState.y);
world.scale.set(viewState.scale, viewState.scale);
```

`viewState` pode ser o mesmo objeto que você já usa no `map-engine`. Só troca quem aplica: em vez de `ctx.translate/scale`, você ajusta `world.position` e `world.scale`.

### 3.3 Imagem do mapa

**Hoje:** `ctx.drawImage(loadedImages.map, 0, 0, MAP_WIDTH, MAP_HEIGHT);`

**Pixi:**
```js
const mapTexture = PIXI.Texture.from('/public/assets/img/maps/first-steps.png');
const mapSprite = new PIXI.Sprite(mapTexture);
mapSprite.anchor.set(0, 0);
world.addChild(mapSprite);
// não precisa redesenhar todo frame: o sprite fica na cena
```

### 3.4 Filtro “tactical focus” (grayscale no mapa)

**Hoje:** `ctx.filter = 'grayscale(0.85) brightness(0.35)';` antes de `drawImage(map)`.

**Pixi:** `ColorMatrixFilter`:

```js
import { ColorMatrixFilter } from 'pixi.js';
const desaturate = new ColorMatrixFilter();
desaturate.desaturate(0.85);  // ou matriz manual para brightness

mapSprite.filters = hasFocus ? [desaturate] : [];
```

### 3.5 Grid, células (reachable, attackable, etc.)

**Hoje:** muitos `ctx.fillRect`, `ctx.strokeRect`, `ctx.beginPath` + `moveTo`/`lineTo`.

**Pixi:** `PIXI.Graphics`:

```js
const gridGraphics = new PIXI.Graphics();
world.addChild(gridGraphics);

// cada frame (ou quando mudar reachable/attackable):
gridGraphics.clear();
gridGraphics.rect(x, y, cellSize, cellSize);
gridGraphics.fill({ color: 0x3b82f6, alpha: 0.3 });
// ou: gridGraphics.stroke({ color: 0xef4444, width: 2 });
```

Você pode ter um `Graphics` por tipo (grid, reachable, attackable, skill area) ou um só que limpa e redesenha tudo.

### 3.6 Unidades (sprites animados)

**Hoje:** `drawImage` com recorte no spritesheet (`frame.x, frame.y, w, h`).

**Pixi:** texture com `frame` (retângulo no spritesheet):

```js
// uma vez por entidade/tipo:
const base = PIXI.Texture.from('/public/assets/entities/swordsman/animations/idle/1.png');
// para spritesheet (vários frames):
const sheet = PIXI.Spritesheet.from(data);
// ou manual:
const tex = new PIXI.Texture({
  source: baseTexture,
  frame: new PIXI.Rectangle(frameX, frameY, w, h)
});

const sprite = new PIXI.Sprite(tex);
sprite.anchor.set(0.5, 1);
sprite.scale.set(unit.scale);
sprite.x = (unit.x - 0.5) * CELL_SIZE;
sprite.y = (unit.y - 0.5) * CELL_SIZE;
sprite.scale.x = unit.facingRight ? 1 : -1;
world.addChild(sprite);
```

A cada frame você só atualiza `sprite.texture` (próximo frame da animação), `sprite.x/y`, `sprite.scale`, `sprite.scale.x` (flip). Não redesenha o mapa inteiro.

### 3.7 Partículas

**Hoje:** `particles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(...); ctx.fill(); });`

**Pixi:** `PIXI.Graphics` que limpa e redesenha círculos/retângulos, ou `ParticleContainer` se tiver muitas. Para poucas dezenas, `Graphics` é suficiente:

```js
particlesGraphics.clear();
particles.forEach(p => {
  particlesGraphics.circle(p.x, p.y, p.size);
  particlesGraphics.fill({ color: p.color, alpha: p.life });
});
```

### 3.8 Textos flutuantes (dano, cura)

**Hoje:** `ctx.font`, `ctx.fillText`, `ctx.strokeText`.

**Pixi:** `PIXI.Text` ou `PIXI.BitmapText`:

```js
const t = new PIXI.Text({
  text: '-42',
  style: { fontFamily: 'Cinzel', fontSize: 28, fill: 0xef4444 }
});
t.anchor.set(0.5);
t.x = wx; t.y = wy;
world.addChild(t);
// depois de N ms: t.destroy() ou esconder
```

### 3.9 Game loop

**Hoje:** `requestAnimationFrame(gameLoop)` → `render()` que faz dezenas de `ctx.*`.

**Pixi:** você continua com `requestAnimationFrame` (ou usa `app.ticker`). A diferença é que `render()` vira “atualizar estado dos objetos Pixi + render”:

```js
function gameLoop() {
  // 1) Lógica (câmera, partículas, animações) – igual
  animationFrame++;
  if (cameraTarget) { ... }
  updateParticles();

  // 2) Atualizar objetos Pixi (posição, texture, filtros, etc.)
  world.position.set(viewState.x + shakeX, viewState.y + shakeY);
  world.scale.set(viewState.scale, viewState.scale);
  mapSprite.filters = hasFocus ? [desaturate] : [];
  allUnits.forEach(({ unit, type }) => {
    const s = getOrCreateUnitSprite(unit);
    s.x = (unit.x - 0.5) * CELL_SIZE;
    s.y = (unit.y - 0.5) * CELL_SIZE;
    s.texture = getFrameTexture(unit);
    // ...
  });
  redrawGridGraphics();
  redrawParticlesGraphics();
  // ...

  // 3) Um único draw na GPU
  app.renderer.render(app.stage);

  requestAnimationFrame(gameLoop);
}
```

O “peso” de desenhar o mapa, dezenas de sprites e muitas formas passa a ser quase todo na GPU. O JS só muda propriedades (x, y, texture, etc.) e chama `render()`.

---

## 4. Onde está cada coisa no `map-engine.js`

| Função / responsabilidade  | Onde está (aprox.) | Em Pixi seria |
|----------------------------|--------------------|---------------|
| Canvas e contexto          | `canvas`, `ctx`    | `PIXI.Application`, `app.stage` |
| Resize                     | `handleResize`     | `app.renderer.resize(w, h)` ou `resizeTo` |
| Câmera                     | `viewState`, `ctx.translate/scale` | `world.position`, `world.scale` |
| `drawBlueprintBackground`  | ~linha 7490        | `Graphics` ou sprite com texture de fundo |
| `loadedImages.map`         | `ctx.drawImage` em `render()` | `PIXI.Sprite` com `Texture.from(url)` |
| Filtro grayscale (hasFocus)| `ctx.filter`       | `mapSprite.filters = [ColorMatrixFilter]` |
| `drawGrid`                 | ~7638              | `PIXI.Graphics` |
| `drawReachableCells`, etc. | ~7693 e seguintes  | `PIXI.Graphics` (clear + rects) |
| `drawUnits` / `drawUnitSprite` | ~8058 / 8066   | um `PIXI.Sprite` por unidade, `texture` = frame do sheet |
| `drawUnitBars`             | ~8073              | `Graphics` (retângulos) ou `Sprite` de barra |
| `drawParticles`            | ~9032              | `PIXI.Graphics` ou `ParticleContainer` |
| `drawFloatingTexts`        | ~6521              | `PIXI.Text` |
| `drawRulers`               | ~7565              | `PIXI.Graphics` em container em `app.stage` (não em `world`) |
| Screen shake               | `shakeX/Y` no `ctx.translate` | `world.position.x += shakeX` (idem) |
| Hit flash                  | `ctx.fillRect` com alpha | `Graphics` ou sprite fullscreen com alpha |

---

## 5. Ordem sugerida de migração (incremental)

1. **Fase 1 – Só mapa + câmera**
   - Criar `PIXI.Application` (reutilizando `#map-canvas` como `view` ou substituindo por `app.canvas`).
   - Carregar a texture do mapa, criar `Sprite`, colocar em `world`.
   - Aplicar `viewState` em `world.position` e `world.scale`.
   - No loop: apenas `app.renderer.render(app.stage)`. O resto (grid, unidades, etc.) pode continuar em 2D num canvas por cima, **ou** você já desliga o 2D e deixa o resto em branco para testar só mapa + pan/zoom.

2. **Fase 2 – Grid + células**
   - Um ou mais `PIXI.Graphics` para grid, reachable, attackable, skill area, path.
   - A cada frame: `clear()` e redesenhar com `rect`, `fill`, `stroke` conforme as mesmas regras que você já tem.

3. **Fase 3 – Unidades**
   - Para cada unidade: criar `PIXI.Sprite` (ou reusar) com texture do frame atual (spritesheet via `Texture`+`Rectangle` ou `Spritesheet`).
   - Atualizar `x`, `y`, `scale`, `scale.x` (flip), `texture` no loop. Barras de HP/SP: `Graphics` ou sprites.

4. **Fase 4 – Partículas e textos**
   - Partículas: `Graphics` ou `ParticleContainer`.
   - Textos: `PIXI.Text` / `BitmapText`, criar/destruir ou pool.

5. **Fase 5 – Efeitos e “pós”**
   - Filtro no mapa (tactical focus).
   - Rulers, hit flash, etc. em `Graphics` ou sprites no `stage` (fora do `world`) para ficarem em coordenadas de tela.

Quando tudo estiver em Pixi, você remove o `getContext('2d')`, as funções `draw*` em 2D e o `render()` antigo, e deixa apenas a versão que atualiza os objetos e chama `app.renderer.render(app.stage)`.

---

## 6. Demo mínima (mapa + câmera)

Há um `public/pixi-demo.html` e `public/assets/js/pixi-renderer-poc.js` que fazem:

- `PIXI.Application` com `resizeTo` no container.
- Carregar a imagem do mapa, criar `Sprite` em um `world`.
- Pan com arrastar o mouse e zoom com a roda.

Abra `http://rpg.local/public/pixi-demo.html` (ou o caminho equivalente no seu ambiente) para ver o mapa em WebGL e sentir a fluidez. O código da demo é o ponto de partida para a Fase 1.

---

## 7. Reusar o `<canvas>` atual ou trocar?

- **Reusar:**  
  `new PIXI.Application({ view: document.getElementById('map-canvas') })`.  
  O Pixi usa esse canvas para o contexto WebGL. Você **não** chama mais `getContext('2d')` nele.

- **Substituir:**  
  Deixar o Pixi criar o canvas (`app.canvas`), colocá-lo no `#map-container` e remover o `#map-canvas` do HTML. Aí precisa garantir que eventos (clique, wheel, move) usem `app.canvas` (ou o container) em vez do antigo `#map-canvas`.

Ambos funcionam; reusar o `#map-canvas` costuma exigir menos mudanças no HTML e nos listeners.

---

## 8. Referências

- [Pixi.js v7 – Getting started](https://pixijs.com/8.x/guides)
- [Pixi Graphics](https://pixijs.com/8.x/guides/graphics)
- [Pixi Sprites](https://pixijs.com/8.x/guides/sprites)
- [Pixi Filters (ColorMatrix, etc.)](https://pixijs.com/8.x/guides/filters)

Se quiser, o próximo passo é implementar a Fase 1 (mapa + câmera) dentro do `map-engine.js` com um flag `?pixi=1` ou variável de ambiente para ativar o renderer Pixi em vez do 2D.
