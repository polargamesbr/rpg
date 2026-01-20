# PixiJS Migration: Missing & Broken Features

Este documento lista tudo o que ainda falta implementar ou corrigir para que a versão PixiJS atinja a mesma qualidade visual e funcional do Canvas 2D original.

## 1. Interface e Guias (Rulers)
- [ ] **Régua Dinâmica**: A versão PixiJS atual só tem réguas no topo e na esquerda. Falta a régua inferior.
- [ ] **Destaque de Hover**: No Canvas 2D, as coordenadas brilham em azul quando o mouse está sobre a célula.
- [ ] **Visual Premium**: Fundo com 95% de opacidade, bordas sutis e ícone de "crosshair" no canto superior esquerdo.
- [ ] **Fonte**: Ajustar para 'Courier New', monospace 11px.

## 2. Unidades e Animações
- [ ] **Fluidez das Animações**: O sistema de frames do PixiJS precisa ser sincronizado perfeitamente com o `animationFrame` global para evitar "stuttering".
- [ ] **Z-Index (Deep Sorting)**: Garantir que unidades com Y maior sempre fiquem na frente (profundidade).
- [ ] **Sombras**: Adicionar sombras elípticas sob os pés das unidades.

## 3. Barras de Status (HP/SP)
- [ ] **Estilização Original**: As barras atuais estão simplificadas. Precisam de:
    - Bordas arredondadas.
    - Gradientes internos.
    - Sombra projetada.
    - Texto com `stroke` preto para legibilidade total.
- [ ] **Animação de Drain**: No Canvas 2D, a barra desce suavemente. No PixiJS está instantânea (ou "presa").

## 4. Sistema de Combate e Feedback
- [ ] **Números de Dano (Floating Text)**: Replicar o estilo original:
    - Fonte grande e branca.
    - Borda (outline) preta grossa.
    - Animação de "pulo" (arc) e fade out.
- [ ] **Hit Flash**: O flash branco/amarelo quando uma unidade recebe dano precisa cobrir a unidade corretamente no PixiJS.
- [ ] **Partículas**: O sistema de partículas PixiJS precisa replicar os comportamentos de gravidade e brilho do original.

## 5. Objetos do Mapa
- [ ] **Baús**: Renderizar sprites de baús (abertos/fechados).
- [ ] **Portal**: Renderizar o efeito de portal pulsante.

## 6. Bugs Técnicos "Data Stuck"
- [ ] **Sincronização de Estado**: Verificar por que o usuário sente que os "dados ficam presos". Provavelmente o `pixiApp.ticker` ou o loop de renderização não está processando mudanças de estado do `gameState` em tempo real.
- [ ] **Resize Tools**: Refinar o comportamento do canvas quando redimensionado via DevTools para não "esticar" os elementos.

---

## Próximo Passo Sugerido
Focar em **um item por vez** (ex: Réguas primeiro, depois HP Bars) para garantir que cada um fique idêntico ao original antes de avançar.
