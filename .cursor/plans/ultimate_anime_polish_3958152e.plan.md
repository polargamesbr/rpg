# Ultimate: faixa mais lenta + speed lines vermelho/preto

## Objetivo

- **Faixa da ultimate mais visível** (2.6s total) e com mais “impacto”.
- **Anime speed lines vermelho/preto** claramente perceptíveis por trás do banner, sem depender do fundo do cenário.

## Mudanças de código

- **Ajustar duração/tempo de saída** em [`ui/assets/js/combat-system.js`](ui/assets/js/combat-system.js) dentro de `showUltimateCutIn()`:
- Trocar o `setTimeout(..., 1550)` para **2600ms**.
- (Opcional) Pequeno “hold” no centro via keyframes (em CSS), sem travar o jogo.
- **Reforçar speed lines (vermelho/preto) e sincronizar animações** em [`ui/assets/css/combat.css`](ui/assets/css/combat.css):
- Atualizar `@keyframes ultimate-pass` e `.ultimate-pass-anim` para **2.6s**.
- Substituir `.ultimate-speedlines` por um desenho mais forte:
    - Camadas com `repeating-linear-gradient` (linhas horizontais) + camada de “sweep” diagonal vermelho.
    - **Remover/afrouxar `mask-image`** e reduzir dependência de `mix-blend-mode` (ou manter, mas com opacidade maior).
    - Garantir visibilidade com `z-index` (speedlines atrás do banner, mas acima do fundo) e `opacity` mais alta.
- Ajustar `@keyframes ultimate-speedlines` para mover `background-position` mais agressivo e manter opacidade alta durante o “meio” da animação.

## Teste manual (rápido)

- Disparar uma ultimate e validar:
- Faixa fica **2.6s** e dá tempo de ler.