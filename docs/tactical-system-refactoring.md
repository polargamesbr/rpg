# Refatoração do Sistema Tático - Desvincular do Sistema de Cartas

## Visão Geral

Este documento descreve a refatoração realizada para desvincular o sistema tático do sistema antigo de cartas (`combat-data.js`), migrando entities e skills para arquivos PHP e implementando carregamento sob demanda via API.

**Data da Refatoração:** 2024  
**Objetivo:** Preparar o sistema para escalar para 1000+ entidades sem carregar tudo no JavaScript

## Arquitetura

### Diagrama de Fluxo

```
Frontend (JS)                    API (PHP)                    Backend (PHP)
┌──────────────────┐            ┌──────────────┐            ┌─────────────────┐
│ map-engine.js    │            │ EntityController│         │ EntitySheetService│
│                  │───────────>│ SkillController │────────>│ SkillService     │
│ TacticalDataLoader│            └──────────────┘         │                  │
│  - entityCache   │                                       │  PHP Files       │
│  - skillCache    │                                       │  app/GameData/   │
└──────────────────┘                                       │  sheets/         │
                                                          └─────────────────┘
```

### Componentes Principais

#### 1. Frontend - `tactical-data-loader.js`
- **Cache em memória** para entities e skills
- **Prevenção de requests duplicados** (pendings requests)
- **API pública:**
  - `loadEntities(ids[])` - Carrega batch de entities
  - `getEntity(id)` - Busca entity individual (com cache)
  - `loadSkills(ids[])` - Carrega batch de skills
  - `getSkill(id)` - Busca skill individual (com cache)
  - `clearEntityCache()` - Limpa cache de entities
  - `clearSkillCache()` - Limpa cache de skills
  - `entityCache` (getter) - Acesso ao cache de entities
  - `skillCache` (getter) - Acesso ao cache de skills

#### 2. Backend - Controllers

**EntityController.php**
- `GET /game/api/entities?ids=hero_swordman,toxic_slime` - Busca batch
- `GET /game/api/entities/{id}` - Busca individual
- Retorna JSON: `{ "entities": {...} }` ou `{ "entity": {...} }`

**SkillController.php**
- `GET /game/api/skills?ids=quick_slash,heavy_slash` - Busca batch
- `GET /game/api/skills/{id}` - Busca individual
- Retorna JSON: `{ "skills": {...} }` ou `{ "skill": {...} }`

#### 3. Backend - Services

**EntitySheetService.php**
- `all()` - Retorna todas as entities
- `find(id)` - Busca entity por ID
- `findBatch(ids[])` - Busca múltiplas entities (por ID ou combat_key)
- `findByCombatKey(combatKey)` - Busca por combat_key (legacy)
- Gera automaticamente `combat_key` se não existir nos arquivos PHP

**SkillService.php**
- `getSkill(id)` - Busca skill individual
- `getSkills(ids[])` - Busca batch de skills
- `getAllSkillIds()` - Retorna todos os IDs de skills disponíveis
- Extrai skills dos arquivos PHP das entities
- Normaliza estrutura para compatibilidade com `skills-data.js`

## Estrutura de Arquivos

### Arquivos Criados

```
app/
├── Controllers/
│   ├── EntityController.php       # API endpoints para entities
│   └── SkillController.php        # API endpoints para skills
├── Services/
│   ├── SkillService.php           # Extração e normalização de skills
│   └── EntitySheetService.php     # (Atualizado) Busca de entities
└── GameData/
    └── sheets/
        ├── classes/
        │   └── swordsman.php      # (Atualizado) Todas as 14 skills
        └── monsters/
            ├── toxic_slime.php    # (Novo) Monstro slime
            └── wolf.php            # (Novo) Monstro lobo

public/assets/js/
└── tactical-data-loader.js        # (Novo) Sistema de cache e API

docs/
└── tactical-system-refactoring.md # (Este arquivo)
```

### Arquivos Atualizados

- `config/routes.php` - Adicionadas rotas da API
- `public/assets/js/map-engine.js` - Refatorado para usar API
- `views/game/explore.php` - Adicionado `tactical-data-loader.js`
- `app/Services/QuestService.php` - Validação de combatKey

## Formato dos Arquivos PHP

### Entity Sheet (exemplo: `swordsman.php`)

```php
<?php

return [
    'id' => 'swordsman',
    'type' => 'class',
    'is_player' => true,
    'name' => 'Swordsman',
    'display_name' => 'Swordsman',
    'role' => 'Warrior',
    'desc' => '...',
    'base_level' => 1,
    'images' => [
        'male' => 'assets/img/swordman-male.png',
        'female' => 'assets/img/swordman-female.png',
    ],
    'attributes' => [
        'str' => 12,
        'agi' => 8,
        'vit' => 10,
        'int' => 5,
        'dex' => 8,
        'luk' => 5,
    ],
    'skills' => [
        [
            'id' => 'quick_slash',
            'name' => 'Quick Slash',
            'mana' => 5,
            'dmg_mult' => 1.0,
            'icon' => 'sword',
            'type' => 'single',
            'range' => 1,
            'rangeType' => 'single',
            'aoe' => 0,
            'gridVisual' => 'melee',
            'description' => 'Basic physical attack against a single target.',
        ],
        // ... mais skills
    ],
];
```

**Notas Importantes:**
- O `combat_key` é gerado automaticamente: `hero_{id}` para players, `{id}` para monsters
- Skills podem ser definidas inline como array de objetos
- Todos os campos são opcionais, exceto `id`, `type`, `attributes` (str, agi, vit, int, dex, luk)

### Skill Normalization

O `SkillService` normaliza as skills do formato PHP para o formato JavaScript:

**PHP → JS:**
- `dmg_mult` → `dmgMult`
- `description` → `desc`
- Adiciona valores padrão: `range`, `rangeType`, `aoe`, `gridVisual`

## Uso no Frontend

### Carregar Entities ao Inicializar

```javascript
// No init() do map-engine.js
if (window.TacticalDataLoader && sessionData) {
    const combatKeys = new Set();
    
    // Extrair combatKeys do player
    if (sessionData.player) {
        combatKeys.add(sessionData.player.combatKey);
    }
    
    // Extrair combatKeys dos enemies
    sessionData.enemies?.forEach(enemy => {
        combatKeys.add(enemy.combatKey);
    });
    
    // Carregar em batch
    await window.TacticalDataLoader.loadEntities(Array.from(combatKeys));
}
```

### Buscar Skills de uma Unit

```javascript
// Versão assíncrona (recomendada)
async function getUnitSkillsAsync(unit) {
    const combatKey = unit.combatKey || unit.combat_key;
    const entity = await window.TacticalDataLoader.getEntity(combatKey);
    
    if (!entity || !entity.skills) return [];
    
    // Extrair IDs das skills
    const skillIds = entity.skills.map(s => 
        typeof s === 'object' ? s.id : s
    );
    
    // Carregar skills em batch
    const skills = await window.TacticalDataLoader.loadSkills(skillIds);
    return Object.values(skills);
}

// Versão síncrona (usa cache se disponível)
function getUnitSkills(unit) {
    const combatKey = unit.combatKey || unit.combat_key;
    
    // Usar cache se disponível
    const entity = window.TacticalDataLoader?.entityCache?.[combatKey];
    if (!entity) return [];
    
    const skillIds = entity.skills.map(s => 
        typeof s === 'object' ? s.id : s
    );
    
    const skills = [];
    skillIds.forEach(id => {
        const skill = window.TacticalDataLoader?.skillCache?.[id] 
                   || window.skillsData?.[id];
        if (skill) skills.push(skill);
    });
    
    return skills;
}
```

## Migração de Entities

### Status Atual

✅ **Migrados para PHP:**
- `swordsman` (classes) - 14 skills completas
- `toxic_slime` (monsters)
- `wolf` (monsters)

⏳ **Pendentes:**
- `archer` (classes)
- `mage` (classes)
- `thief` (classes)
- `acolyte` (classes)
- `blacksmith` (classes)
- Outros monsters do `combat-data.js`

### Processo de Migração

1. **Criar arquivo PHP** em `app/GameData/sheets/classes/` ou `app/GameData/sheets/monsters/`
2. **Copiar estrutura** do `combat-data.js` para formato PHP
3. **Converter skills** de array de IDs para array de objetos com dados completos
4. **Adicionar `combat_key`** explicitamente se diferente do padrão gerado
5. **Testar** carregando via API

### Mapeamento combat_key

O sistema mantém compatibilidade com `combat_key` do sistema antigo:

- Classes: `swordsman` → `hero_swordman`
- Classes: `archer` → `hero_archer`
- Monsters: `toxic_slime` → `toxic_slime` (mantém o mesmo)

## Fallback e Compatibilidade

### Sistema de Fallback

O código foi projetado para funcionar com ambos os sistemas durante a migração:

1. **Tenta usar API** (`TacticalDataLoader`)
2. **Fallback para `combat-data.js`** se API falhar ou não estiver disponível
3. **Fallback para `skills-data.js`** se skills não estiverem no cache

### Remoção do Sistema Antigo

**Quando todas as entities estiverem migradas:**

1. Remover `<script src="<?= asset('js/combat-data.js') ?>"></script>` de `explore.php`
2. Remover referências a `window.combatData` do `map-engine.js`
3. Remover fallbacks para `combatData` nas funções

## Endpoints da API

### Entities

**Batch:**
```
GET /game/api/entities?ids=hero_swordman,toxic_slime,wolf
```

**Resposta:**
```json
{
  "entities": {
    "hero_swordman": {
      "id": "swordsman",
      "combat_key": "hero_swordman",
      "name": "Swordsman",
      "attributes": {...},
      "skills": [...]
    },
    "toxic_slime": {...},
    "wolf": {...}
  }
}
```

**Individual:**
```
GET /game/api/entities/hero_swordman
```

**Resposta:**
```json
{
  "entity": {
    "id": "swordsman",
    "combat_key": "hero_swordman",
    ...
  }
}
```

### Skills

**Batch:**
```
GET /game/api/skills?ids=quick_slash,heavy_slash,champions_slash
```

**Resposta:**
```json
{
  "skills": {
    "quick_slash": {
      "id": "quick_slash",
      "name": "Quick Slash",
      "mana": 5,
      "dmgMult": 1.0,
      ...
    },
    "heavy_slash": {...},
    "champions_slash": {...}
  }
}
```

**Individual:**
```
GET /game/api/skills/quick_slash
```

## Validação e Logs

### QuestService

O `QuestService` agora valida se entities existem:

```php
// Validação automática ao criar player
$entityDef = EntitySheetService::findByCombatKey($combatKey);
if (!$entityDef) {
    error_log("Warning: Entity '{$combatKey}' not found. Using fallback.");
    $combatKey = 'hero_swordman'; // Fallback
}
```

### Logs do Frontend

O sistema gera logs úteis para debug:

```javascript
console.log('[MAP-ENGINE] Carregando entities:', keysArray);
console.warn('[MAP-ENGINE] Failed to load entity from API:', error);
```

## Benefícios da Refatoração

1. **Escalabilidade:** Suporta 1000+ entidades sem carregar tudo no JS
2. **Performance:** Carrega apenas entities necessárias (da quest atual)
3. **Manutenibilidade:** Entities organizadas em arquivos PHP individuais
4. **Desacoplamento:** Sistema tático independente do sistema de cartas
5. **Reutilização:** API pode ser usada por outros sistemas futuramente
6. **Cache Inteligente:** Evita múltiplas chamadas à API para mesmos dados

## Troubleshooting

### Entities não carregam

1. Verificar se arquivo PHP existe em `app/GameData/sheets/`
2. Verificar se `combat_key` está correto no QuestService
3. Verificar logs do PHP (validação de estrutura)
4. Verificar console do navegador (erros de API)

### Skills não aparecem

1. Verificar se skills estão definidas inline no arquivo PHP da entity
2. Verificar se `SkillService` está extraindo skills corretamente
3. Verificar cache do navegador (usar `TacticalDataLoader.clearSkillCache()`)
4. Verificar formato das skills (array de objetos vs array de IDs)

### API retorna 404

1. Verificar rotas em `config/routes.php`
2. Verificar autenticação (API requer login)
3. Verificar se Controller existe e método está correto

## Próximos Passos

1. ✅ Migrar todas as classes para PHP
2. ✅ Migrar todos os monsters para PHP
3. ✅ Remover `combat-data.js` após validação completa




## Referências

- **Arquitetura Original:** `docs/explore-structure.md`
- **Entity Sheets:** `app/GameData/sheets/README.md`
- **Sistema Antigo:** `public/assets/js/combat-data.js` (legacy)

## Remoção do Sistema Antigo de Cartas

### Arquivos Removidos

- ✅ `public/assets/js/combat-data.js` - Sistema antigo de entities/skills
- ✅ `app/Controllers/BattleController.php` - Controller de batalhas por cartas
- ✅ `app/Services/QuestBattleService.php` - Service de batalhas por cartas
- ✅ `app/Models/QuestBattleSession.php` - Model de sessões de batalha
- ✅ `app/Models/QuestBattleEvent.php` - Model de eventos de batalha

### Rotas Removidas

- ✅ `/game/battle/start` - Iniciar batalha por cartas
- ✅ `/game/battle/active` - Buscar batalha ativa
- ✅ `/game/battle/state` - Estado da batalha
- ✅ `/game/battle/complete` - Completar batalha
- ✅ `/game/battle-from-map` - Batalha do mapa (sistema antigo)
- ✅ `/game/battle-test` - Teste de batalha (sistema antigo)

### Código Removido

- ✅ Funções `createBattleSession()` e `showBattleConfirmation()` do `map-engine.js`
- ✅ Referência ao `combat-data.js` em `explore.php`
- ✅ Método `battleFromMap()` completo do `ExploreController`
- ✅ Deletar battle sessions do `QuestService`

### Tabelas de Banco de Dados para Remover

Execute o SQL em `migrations/999_remove_old_battle_system.sql` para remover:
- ✅ `quest_battle_events` - Eventos de batalha por cartas
- ✅ `quest_battle_sessions` - Sessões de batalha por cartas

**Nota:** As tabelas `quest_sessions` e `quest_events` são mantidas pois são usadas pelo sistema tático atual.

---

**Última atualização:** 2024  
**Autor:** Refatoração do Sistema Tático
