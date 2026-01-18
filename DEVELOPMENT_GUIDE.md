# Development Guide (RPG)

## Quest Sessions (novo fluxo)
- `/game/explore` exige `?session=UID`. Sem `session`, redireciona para `/game/tavern`.
- `quest_sessions` guarda snapshot completo do personagem e o estado atual da quest.
- `quest_definitions` guarda o JSON fixo da quest (mapa, spawns, objetivos).

## Battle Persistence (antifraude + F5)
- Cada batalha tem `battle_uid` em `quest_battle_sessions`.
- Estado da batalha (turno, hp/sp, entidades) fica em `state_json`.
- `/game/battle-from-map?session=...&battle=...` sempre preserva contexto.
- Autosave de batalha a cada 3s via `/game/battle/state`.
- `combatSystem.getBattleState()` e `combatSystem.restoreBattleState()` fazem o snapshot.

## Fluxos
1) Tavern -> Accept quest -> `POST /game/quest/start` -> redirect `/game/explore?session=UID`
2) Explore -> encounter -> `POST /game/battle/start?session=UID` -> redirect `/game/battle-from-map?session=UID&battle=UID`
3) Fim da batalha -> `/game/explore?session=UID` com resultado

## Regras importantes
- Explore nao deve funcionar sem `session`.
- Combate deve usar `combat_key` dinamico vindo da quest/session.
- Map state usa **sessionStorage** (nao usar localStorage).

## Migrations (atenção)
- `migrations/run_migrations.php` nao é idempotente.
- Quando adicionar novas migrations, **rodar somente as novas** via PHP direto.
- Sempre registrar a migration no `run_migrations.php`, mas execute separadamente em ambientes ja migrados.

## Mapas
- Mapa atual padrao: `/public/assets/img/maps/castle-map.png`


