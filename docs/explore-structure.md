# Estrutura do Sistema de Exploração (Explore)

## 📋 Visão Geral

O sistema de exploração é um jogo tático por turnos estilo Fire Emblem/FFT, onde o jogador controla unidades em um grid isométrico. A estrutura é dividida entre **PHP (Backend)** e **JavaScript (Frontend)**.

---

## 🔴 PHP (Backend) - O que é setado no servidor

### 1. **QuestService.php** (`app/Services/QuestService.php`)
**Responsabilidade:** Criar e gerenciar sessões de quest, construir estado inicial do jogo.

#### Funções principais:
- **`startQuestSession()`**: Cria uma nova sessão de quest quando o jogador inicia uma quest
- **`getSessionState()`**: Retorna o estado atual da sessão (player, enemies, turn, phase, etc.)
- **`buildInitialState()`**: Constrói o estado inicial do jogo a partir do JSON da quest

#### O que é criado no PHP:
```php
// Player (personagem do jogador)
$player = [
    'id' => 'player',
    'name' => $character['name'],
    'type' => 'player',
    'x' => 10, 'y' => 10,  // Posição inicial
    'hp' => 300, 'maxHp' => 300,
    'sp' => 1000, 'maxSp' => 1000,  // MP/SP
    'attack' => 89, 'defense' => 23,
    'moveRange' => 4, 'attackRange' => 1,
    'avatar' => '/public/assets/img/characters/swordman.png',
    'combatKey' => 'hero_swordman',  // Chave para buscar no combat-data.js
    'animations' => [...],  // Config de animações
    // ... outros atributos
];

// Enemies (inimigos)
$enemies = [
    [
        'id' => 'slime_1',
        'name' => 'Slime',
        'type' => 'enemy',
        'x' => 24, 'y' => 10,
        'hp' => 30, 'maxHp' => 30,
        'combatKey' => 'toxic_slime',  // Chave para buscar no combat-data.js
        'avatar' => '/public/assets/img/characters/slime.png',
        // ... outros atributos
    ],
    // ... mais inimigos
];
```

### 2. **ExploreController.php** (`app/Controllers/ExploreController.php`)
**Responsabilidade:** Controlar rotas e endpoints da exploração.

#### Rotas principais:
- **`GET /game/explore?session=xxx`**: Renderiza a view `explore.php`
- **`GET /game/explore/state?session=xxx`**: Retorna estado atual (player, entities, turn, phase)
- **`POST /game/explore/state`**: Salva estado atualizado no servidor
- **`POST /game/explore/move`**: Move o player para nova posição

#### O que é retornado pelo endpoint `/game/explore/state`:
```json
{
    "success": true,
    "player": { "id": "player", "x": 10, "y": 10, "hp": 300, ... },
    "entities": [ /* array de enemies */ ],
    "chests": [ /* array de baús */ ],
    "portal": { "x": 45, "y": 5 },
    "walls": [ { "x": 8, "y": 12 }, ... ],
    "mapConfig": { "gridCols": 60, "gridRows": 20, "cellSize": 64 },
    "turn": 1,
    "phase": "player",
    "unitsActed": []
}
```

### 3. **Quest JSON** (`app/GameData/quests/first-steps.json`)
**Responsabilidade:** Configuração estática da quest (mapa, inimigos, posições, etc.)

#### Estrutura:
```json
{
    "map": {
        "gridCols": 60,
        "gridRows": 20,
        "cellSize": 64
    },
    "player_start": { "x": 10, "y": 10 },
    "player_defaults": {
        "moveRange": 4,
        "attackRange": 1,
        "animations": { "idle": {...}, "walk": {...}, "atack": {...} }
    },
    "enemies": [
        {
            "id": "slime_1",
            "name": "Slime",
            "x": 24, "y": 10,
            "hp": 30,
            "combat_key": "toxic_slime",
            "avatar": "/public/assets/img/characters/slime.png"
        }
    ],
    "walls": [ { "x": 8, "y": 12 }, ... ],
    "chests": [ ... ],
    "portal": { "x": 45, "y": 5 }
}
```

---

## 🔵 JavaScript (Frontend) - O que é processado no cliente

### 1. **combat-data.js** (`public/assets/js/combat-data.js`)
**Responsabilidade:** Definições de todas as entidades (classes e monstros) e suas skills.

#### Estrutura:
```javascript
window.combatData = {
    entities: {
        hero_swordman: {
            name: 'Swordman',
            attributes: { str: 12, agi: 8, vit: 10, int: 5, dex: 8, luk: 5 },
            skills: ['quick_slash', 'heavy_slash', 'champions_slash', ...],
            // ... outros atributos
        },
        toxic_slime: {
            name: 'Toxic Slime',
            attributes: { str: 5, agi: 3, vit: 4, int: 2, dex: 2, luk: 1 },
            skills: ['acid_spit', ...],
            // ... outros atributos
        },
        // ... mais entidades
    },
    skills: {
        quick_slash: {
            name: 'Quick Slash',
            cost: 5,
            damageMultiplier: 1.2,
            type: 'physical',
            range: 1,
            // ... outros atributos
        },
        // ... mais skills
    }
};
```

**Uso:** O `combatKey` do player/enemy (setado no PHP) é usado para buscar a definição completa da entidade no `combatData.entities[combatKey]`.

### 2. **skills-data.js** (`public/assets/js/skills-data.js`)
**Responsabilidade:** Propriedades detalhadas de todas as skills (custo, dano, range, AoE, etc.)

#### Estrutura:
```javascript
window.skillsData = {
    quick_slash: {
        name: 'Quick Slash',
        cost: 5,
        damageMultiplier: 1.2,
        type: 'physical',
        range: 1,
        aoe: false,
        hits: 1,
        // ... outros atributos
    },
    heavy_slash: {
        name: 'Heavy Slash',
        cost: 20,
        damageMultiplier: 1.8,
        type: 'physical',
        range: 1,
        hits: 2,  // Multi-hit
        // ... outros atributos
    },
    // ... mais skills
};
```

### 3. **map-engine.js** (`public/assets/js/map-engine.js`)
**Responsabilidade:** Motor principal do jogo - renderização, lógica de combate, turnos, etc.

#### Fluxo de inicialização:
1. **`init()`** é chamado quando o DOM está pronto
2. **`loadSessionStateFromServer()`**: Busca estado do servidor via `/game/explore/state?session=xxx`
3. **`loadMapImage()`**: Carrega imagem do mapa
4. **`initializeEntitiesFromSession()`**: Cria objetos de unidades (player e enemies) a partir do estado do servidor
5. **`loadRequiredSprites()`**: Carrega sprites de animação para cada unidade
6. **`gameLoop()`**: Inicia loop de renderização

#### Como as entidades são criadas:
```javascript
// Player
const player = {
    id: 'player',
    name: sessionData.player.name,
    x: sessionData.player.x,
    y: sessionData.player.y,
    hp: sessionData.player.hp,
    maxHp: sessionData.player.maxHp,
    sp: sessionData.player.sp,
    maxSp: sessionData.player.maxSp,
    combatKey: sessionData.player.combatKey,  // 'hero_swordman'
    // Busca skills do combatData
    skills: getUnitSkills(sessionData.player),
    // ... outros atributos
};

// Enemies
const enemies = sessionData.entities.map(enemyData => ({
    id: enemyData.id,
    name: enemyData.name,
    x: enemyData.x,
    y: enemyData.y,
    hp: enemyData.hp,
    maxHp: enemyData.maxHp,
    combatKey: enemyData.combatKey,  // 'toxic_slime', 'wolf', etc.
    skills: getUnitSkills(enemyData),
    // ... outros atributos
}));
```

#### Função `getUnitSkills()`:
```javascript
function getUnitSkills(unit) {
    // 1. Busca combatKey do unit
    const combatKey = unit.combatKey || unit.combat_key || unit.class;
    
    // 2. Busca definição da entidade no combatData
    const entityDef = window.combatData.entities[combatKey];
    
    // 3. Mapeia IDs de skills para objetos completos
    const skills = entityDef.skills.map(skillId => {
        // Busca skill no combatData.skills ou skillsData
        const skillDef = window.combatData.skills[skillId] || 
                        window.skillsData[skillId];
        return skillDef;
    });
    
    return skills;
}
```

### 4. **map-entity-bridge.js** (`public/assets/js/map-entity-bridge.js`)
**Responsabilidade:** Ponte entre unidades do mapa tático e definições do sistema de combate.

#### Funções:
- **`getCombatEntityKey()`**: Mapeia ID da unidade do mapa para chave do combatData
- **`findAlliesInRange()`**: Encontra aliados no alcance
- **`findEnemiesInRange()`**: Encontra inimigos no alcance
- **`prepareBattleData()`**: Prepara dados para iniciar batalha

### 5. **skill-engine.js** (`public/assets/js/skill-engine.js`)
**Responsabilidade:** Cálculo de atributos e stats baseados em level e atributos.

#### Uso:
- Calcula ATK, DEF, HP, MP baseado em atributos (STR, AGI, VIT, INT, DEX, LUK)
- Usado para calcular dano de skills e ataques

---

## 🔄 Fluxo Completo de Dados

### 1. **Início da Quest (PHP)**
```
Usuário clica em "Iniciar Quest" na taverna
    ↓
QuestController::start() chama QuestService::startQuestSession()
    ↓
QuestService lê JSON da quest (first-steps.json)
    ↓
QuestService::buildInitialState() cria:
    - Player (com dados do character do banco)
    - Enemies (do JSON da quest)
    - Estado inicial (turn: 1, phase: 'player')
    ↓
Salva no banco (quest_sessions.state_json)
    ↓
Redireciona para /game/explore?session=xxx
```

### 2. **Carregamento da Página (PHP → JS)**
```
ExploreController::index() renderiza explore.php
    ↓
explore.php carrega scripts na ordem:
    1. combat-data.js (window.combatData)
    2. skills-data.js (window.skillsData)
    3. skill-engine.js
    4. map-entity-bridge.js
    5. map-sfx.js
    6. map-debug.js
    7. map-engine.js
    ↓
map-engine.js::init() é chamado
    ↓
loadSessionStateFromServer() faz fetch para /game/explore/state?session=xxx
    ↓
Servidor retorna JSON com player, entities, turn, phase, etc.
    ↓
initializeEntitiesFromSession() cria objetos de unidades
    ↓
Para cada unidade, busca skills usando combatKey:
    - unit.combatKey → combatData.entities[combatKey].skills
    - skills IDs → combatData.skills[skillId] ou skillsData[skillId]
```

### 3. **Durante o Jogo (JS → PHP)**
```
Jogador move/ataca/usa skill
    ↓
map-engine.js atualiza estado local (gameState)
    ↓
saveMapState() faz POST para /game/explore/state
    ↓
ExploreController::setState() salva no banco
    ↓
Estado persistido para próxima vez que carregar
```

---

## 📍 Onde cada coisa está

### **Inimigos/Entities:**
- **Definição estática (atributos, skills)**: `combat-data.js` → `window.combatData.entities`
- **Posição no mapa, HP atual**: JSON da quest (`first-steps.json`) → PHP → Banco → JS
- **Configuração de animação**: JSON da quest → PHP → JS

### **Player:**
- **Dados do personagem (nome, atributos)**: Banco de dados (`characters` table) → PHP
- **Posição, HP/MP atual**: Estado da sessão (banco) → PHP → JS
- **Skills disponíveis**: `combatKey` → `combatData.entities[combatKey].skills` → JS

### **Skills:**
- **Propriedades (custo, dano, range)**: `skills-data.js` → `window.skillsData`
- **Lista de skills da entidade**: `combat-data.js` → `window.combatData.entities[combatKey].skills`

### **Mapa:**
- **Configuração (tamanho, células)**: JSON da quest → PHP → JS
- **Paredes**: JSON da quest → PHP → JS
- **Imagem do mapa**: `CONFIG.MAP_PATH` → JS carrega imagem

### **Estado do Jogo:**
- **Turno, fase, unidades que agiram**: Estado da sessão (banco) → PHP → JS
- **Salvamento**: JS → POST `/game/explore/state` → PHP → Banco

---

## 🎯 Resumo

| Item | Onde está | Quando é usado |
|------|-----------|----------------|
| **Definições de entidades** | `combat-data.js` | Sempre (para buscar skills, atributos) |
| **Propriedades de skills** | `skills-data.js` | Quando usa skill (custo, dano, range) |
| **Posições, HP atual** | Banco (via PHP) | Carregamento inicial e salvamento |
| **Configuração de animações** | JSON da quest → PHP | Carregamento inicial |
| **Lógica de combate** | `map-engine.js` | Durante o jogo |
| **Cálculo de stats** | `skill-engine.js` | Quando calcula dano/defesa |

---

## 🔗 Dependências entre arquivos

```
combat-data.js (window.combatData)
    ↑
    ├── map-engine.js usa para buscar skills das entidades
    └── skill-engine.js usa para calcular stats

skills-data.js (window.skillsData)
    ↑
    └── map-engine.js usa para propriedades detalhadas das skills

skill-engine.js
    ↑
    └── map-engine.js usa para calcular dano/defesa baseado em atributos

map-entity-bridge.js
    ↑
    └── map-engine.js usa para mapear unidades do mapa para combatData

map-sfx.js (window.MapSFX)
    ↑
    └── map-engine.js usa para efeitos visuais

map-debug.js (window.MapDebug)
    ↑
    └── map-engine.js usa para debug mode (opcional)
```

---

## 💾 Persistência

- **Estado do jogo** (posições, HP/MP, turno, fase): Salvo no banco (`quest_sessions.state_json`)
- **Sessão**: Identificada por `session_uid` na URL
- **Salvamento automático**: Após cada ação (movimento, ataque, skill)
- **Carregamento**: Ao abrir a página, busca estado do servidor via `/game/explore/state`

