# Remoção do Sistema Antigo de Cartas

## Resumo

Este documento detalha a remoção completa do sistema antigo de batalha por cartas, que foi substituído pelo novo sistema tático.

**Data da Remoção:** 2024  
**Motivo:** Sistema tático atual não utiliza mais o sistema de cartas

## Arquivos Removidos

### JavaScript
- ✅ `public/assets/js/combat-data.js` - Arquivo completo com todas as entities e skills do sistema antigo

### PHP - Controllers
- ✅ `app/Controllers/BattleController.php` - Controller completo de batalhas por cartas

### PHP - Services
- ✅ `app/Services/QuestBattleService.php` - Service que gerenciava batalhas por cartas

### PHP - Models
- ✅ `app/Models/QuestBattleSession.php` - Model de sessões de batalha
- ✅ `app/Models/QuestBattleEvent.php` - Model de eventos de batalha

## Código Removido

### Views
- ✅ `views/game/explore.php` - Removido `<script src="combat-data.js">`

### Routes
- ✅ `config/routes.php` - Removidas rotas:
  - `POST /game/battle/start`
  - `GET /game/battle/active`
  - `GET /game/battle/state`
  - `POST /game/battle/state`
  - `POST /game/battle/complete`
  - `GET /game/battle-from-map`
  - `GET /game/battle-test`

### Services
- ✅ `app/Services/QuestService.php` - Removida linha que deletava battle sessions:
  ```php
  Database::delete('quest_battle_sessions', 'quest_session_id = :session_id', ['session_id' => $sessionId]);
  ```

### Controllers
- ✅ `app/Controllers/ExploreController.php`:
  - Removido método `battleFromMap()` completo
  - Removido código que buscava `QuestBattleService::getActiveBattleUid()`
  - Simplificado método `battleTest()` para apenas redirecionar

### JavaScript
- ✅ `public/assets/js/map-engine.js`:
  - Removida função `createBattleSession()`
  - Removida função `showBattleConfirmation()`
  - Removidos fallbacks para `window.combatData` (mantendo apenas `window.skillsData`)

## Tabelas de Banco de Dados

### SQL para Executar

Execute o arquivo `migrations/999_remove_old_battle_system.sql`:

```sql
-- Drop foreign key constraints first
ALTER TABLE `quest_battle_events` DROP FOREIGN KEY `quest_battle_events_ibfk_1`;
ALTER TABLE `quest_battle_sessions` DROP FOREIGN KEY `quest_battle_sessions_ibfk_1`;

-- Drop tables
DROP TABLE IF EXISTS `quest_battle_events`;
DROP TABLE IF EXISTS `quest_battle_sessions`;
```

### Tabelas Removidas

1. **`quest_battle_events`**
   - Descrição: Armazenava eventos de batalhas por cartas
   - Uso: Sistema antigo registrava cada ação da batalha
   - Substituído por: Sistema tático salva estado completo em `quest_sessions.state_json`

2. **`quest_battle_sessions`**
   - Descrição: Armazenava sessões de batalha por cartas separadas
   - Uso: Cada batalha tinha sua própria sessão dentro da quest
   - Substituído por: Sistema tático faz tudo no mapa, sem batalhas separadas

### Tabelas Mantidas

As seguintes tabelas são **mantidas** pois são usadas pelo sistema tático:

- ✅ `quest_sessions` - Sessões de exploração/mapa tático
- ✅ `quest_events` - Eventos dentro da sessão (movimentos, ações)
- ✅ `quest_definitions` - Configurações de quests

## Impacto da Remoção

### O que não funciona mais

- ❌ Sistema de batalha por cartas separado do mapa
- ❌ Rotas `/game/battle/*`
- ❌ Rotas `/game/battle-from-map` e `/game/battle-test`
- ❌ Carregamento de entities do `combat-data.js`

### O que continua funcionando

- ✅ Sistema tático no mapa (exploração)
- ✅ Combate direto no mapa
- ✅ Skills carregadas via API PHP
- ✅ Entities carregadas via API PHP
- ✅ Fallback para `skills-data.js` (temporário, até migrar todas as skills)

## Verificações Pós-Remoção

Após a remoção, verificar:

1. ✅ O sistema tático carrega corretamente
2. ✅ Entities são carregadas via API (`/game/api/entities`)
3. ✅ Skills são carregadas via API (`/game/api/skills`)
4. ✅ Não há erros no console sobre `combat-data.js` não encontrado
5. ✅ Tabelas `quest_battle_*` foram removidas do banco

## Notas Importantes

- O sistema mantém fallback para `skills-data.js` temporariamente
- Todas as skills devem ser migradas para arquivos PHP inline nas entities
- Após migração completa de skills, `skills-data.js` também pode ser removido
- O sistema tático é completamente independente do sistema antigo agora

---

**Data da Remoção:** 2024  
**Status:** ✅ Completo
