# Sistema de Parry — Análise do Antigo e Ideias para o Tático

## 1. O que já existe

### No **combate antigo** (modal / `combat-system.js`)

- **Parry por chance (ex.: Parry Stance)**  
  Em `damageEntity`, **antes** de aplicar o dano:
  - Se `target.buffedParryChance && Math.random() < target.buffedParryChance` → **ataque negado** (0 dano), floater `"PARRY"`, efeito `parry`, áudio e `return`.
  - O `buffedParryChance` vem do **TacticalSkillEngine** (buff com `parryChance`, ex. 0.3 do Parry Stance).

- **Parry Phase (QTE)**  
  Quando o inimigo ataca:
  - UI com cursor a mover-se e zona verde; o jogador usa Space ou clique para “parry” no momento certo.
  - Se **sucesso**: dano reduzido para **30%** do original (`finalDmg = Math.floor(damage * 0.3)`), i.e. 70% de redução.
  - Se falha: dano total.

- **Legacy:** `statusEffects` com `id === 'parry'` e 30% de chance, mesmo efeito de negação.

### No **TacticalSkillEngine** (`tactical-skill-engine.js`)

- Em `recalculateStats`, ao processar `activeBuffs`:
  - `if (data.parryChance !== undefined) parryChance = Math.max(parryChance, data.parryChance);`
  - No fim: `entity.buffedParryChance = parryChance`.
- Ou seja, **Parry Stance** e outros buffs com `parryChance` já preenchem `buffedParryChance` nas unidades.

### No **map-engine** (combate tático)

- Chama `TacticalSkillEngine.recalculateStats(unit)`, portanto `buffedParryChance` **já está** nas unidades com Parry Stance (ou buffs equivalentes).
- O HUD mostra “Parry +30%” nos modifiers dos buffs.
- **Não há** nenhuma lógica de parry em `executeAttack` nem em `executeSkill`: o dano é sempre aplicado.

### Assets disponíveis

- **MapSFX:** `spawnParrySpark(x, y, intensity)` — faíscas metálicas + anel de defesa.
- **Debug:** botão “Parry” que chama `spawnParrySpark`.
- **Áudio (modal antigo):** `sword2.mp3` para parry.

---

## 2. O que falta no tático

- **Checagem de parry** antes de aplicar dano em:
  - `executeAttack`
  - no loop de alvos de `executeSkill` (ataques físicos e, se quiser, magia).
- **Feedback** em caso de parry:
  - Floater / número “PARRY” ou “BLOCK”
  - `spawnParrySpark` na posição do alvo
  - Som de parry (ex. `sword2.mp3` ou equivalente)
  - Log / mensagem de combate

---

## 3. Opções de design

### A) Parry = **negação total** (como no antigo por buff)

- `Math.random() < (target.buffedParryChance || 0)` → 0 dano, “PARRY”, efeito, som.
- Simples e alinhado ao `damageEntity` do combat-system.
- Parry Stance a 30% fica forte e perceptível.

### B) Parry = **redução de dano** (como no QTE do antigo)

- Ex.: 70% de redução: `damage = Math.floor(damage * 0.3)`.
- Pode configurar no buff, e.g. `parryDamageReduction: 0.7`.
- Menos “tudo ou nada”, mas exige definir redutor por buff/skill.

### C) **Só ataques físicos** (recomendado)

- Parry apenas quando `executeAttack` (ataque normal) ou skills com `damageType === 'physical'` (e eventualmente `element` não-mágico).
- Magia não é parryável, como é comum em jogos.

### D) **Parry Phase (QTE) no tático**

- Pausar a animação antes do impacto e mostrar mini-UI de parry (cursor + zona).
- Maior imersão, mas:
  - Quebra o fluxo contínuo do tático.
  - Exige UI, teclado/rato, e um `stats.parry` ou `buffedParryChance` para modo auto.
- Melhor como **fase 2**; para a primeira versão, parry por chance é mais fácil.

### E) **Chance base de parry**

- Algumas classes/equipamentos poderiam ter `stats.parry` ou `parryChance` base.
- Fórmula: `chance = (target.buffedParryChance || 0) + (target.stats?.parry ?? 0) / 100` (ou em decimal), limitada ao máximo desejado (ex. 50%).
- Pode ser adicionado depois sem mudar a lógica de buffs.

---

## 4. Proposta de implementação mínima (map-engine)

Implementar **parry por chance**, **negação total**, **apenas ataques físicos**, usando o que já existe.

### 4.1. `executeAttack`

Antes de `target.hp = Math.max(0, target.hp - damage)`:

1. **Só se for ataque físico**  
   - Em `executeAttack` todos os ataques são físicos (ataque normal, `attack`/`attackRanged`), então basta checar que não é skill de magia (não se aplica; em `executeAttack` não há skill).

2. **Checagem de parry**
   ```js
   const parryChance = target.buffedParryChance ?? 0;
   if (parryChance > 0 && Math.random() < parryChance) {
     // Parry: 0 dano
     const targetPxX = (target.x - 0.5) * CONFIG.CELL_SIZE;
     const targetPxY = (target.y - 0.5) * CONFIG.CELL_SIZE;
     if (window.MapSFX?.spawnParrySpark) window.MapSFX.spawnParrySpark(targetPxX, targetPxY, 1);
     playSfx('sword2.mp3', 0.5, 1.0); // ou parry.mp3
     showFloaterOuNumero("PARRY", target.x, target.y); // ou reusar showDamageNumber com texto "PARRY"
     addLogEntry('attack', `${target.name} defendeu o ataque!`);
     // não aplicar dano, não flash, não knockback, não morte
     // fazer finishUnitTurn(attacker), etc. e return
   }
   ```
   - Se entrasse nesse `if`, **não** se aplicaria: `target.hp -= damage`, flash, knockback, `showDamageNumber` de dano, morte, etc.  
   - Ajustar o fluxo para dar `return` depois do parry (após animação de ataque, efeito e log), chamando o que for necessário (ex. `finishUnitTurn(attacker)`, atrasos, etc.).

### 4.2. `executeSkill` (ataques físicos)

No loop onde se calcula `damage` e se faz `t.hp = Math.max(0, t.hp - damage)` (tanto no ramo “imediato” como no “deferred” de `runDeferredSkillImpact`):

1. **Só se for físico**
   - `isPhysical` já existe (ex. `skill.damageType === 'physical'` ou classe warrior/swordman).
   - Ou: `const isPhysical = skill.damageType === 'physical' || (!isMagic && ...)` consoante a tua definição.

2. **Checagem de parry**
   - `parryChance = t.buffedParryChance ?? 0`
   - `if (parryChance > 0 && Math.random() < parryChance)`:
     - Não aplicar `t.hp -= damage`.
     - Na posição do alvo: `spawnParrySpark`, som, “PARRY” (floater/número), log.
     - No deferred: não adicionar esse alvo a `deferred` para dano; em vez disso, adicionar a uma lista de “parried” e, no “ponto forte”, só para esses: efeito + “PARRY” (sem `showDamageNumber` de dano).

### 4.3. Floater / “PARRY”

- **Opção 1:** Reutilizar o sistema de `showDamageNumber` com um modo “PARRY” (ex. terceiro parâmetro ou flag `isParry`), cor diferente (ex. azul/branco) e texto `"PARRY"`.
- **Opção 2:** `showFloater` ou similar, se existir, para texto curto na posição da unidade.
- **Opção 3:** Só `spawnParrySpark` + log; sem número no ar. Menos visível, mas implementação mais rápida.

### 4.4. Áudio

- Usar `playSfx('sword2.mp3', 0.5, 1.0)` como no modal antigo, ou um `parry.mp3` se existir na pasta de SFX do projeto.
- Se o teu `playSfx` esperar path completo, ajustar para o teu `asset()` / base path.

### 4.5. Garantir `buffedParryChance` correto

- O TacticalSkillEngine já faz `recalculateStats` em `applyBuff` e em `processBuffs` (turn start/end).
- O map-engine já chama isso. Só é preciso garantir que, no momento do ataque, `recalculateStats` já foi chamado para o alvo (normalmente sim, no início do turno e ao aplicar Parry Stance).

---

## 5. Resumo das decisões

| Tópico                 | Proposta                                              |
|------------------------|--------------------------------------------------------|
| Efeito                 | Negação total (0 dano)                                |
| Onde                   | Só ataques físicos (ataque normal + skills físicas)   |
| Chance                 | `target.buffedParryChance` (já vindo dos buffs)       |
| Visual                 | `spawnParrySpark` + texto “PARRY” (floater/número)    |
| Som                    | `sword2.mp3` ou `parry.mp3`                           |
| QTE (Parry Phase)      | Não na 1.ª versão; possível depois                    |
| Redução parcial        | Não na 1.ª versão; possível com `parryDamageReduction`|

---

## 6. Próximos passos (se quiseres implementar)

1. Em `executeAttack`: antes de aplicar dano, inscrever o `if (parryChance > 0 && Math.random() < parryChance)` com efeito, som, “PARRY” e `return` (sem aplicar dano).
2. Em `executeSkill`, no loop de alvos (imediato e deferred): para alvos com `isPhysical`, fazer a mesma checagem; em caso de parry, não fazer `t.hp -= damage` nem `showDamageNumber` de dano; fazer `spawnParrySpark` + “PARRY” + log.
3. Definir como mostrar “PARRY” (floater vs. `showDamageNumber` em modo parry) e ajustar o path do áudio ao teu projeto.

Se quiseres, na próxima iteração posso propor os patches concretos (trechos de código) para `map-engine.js` com base nisto.
