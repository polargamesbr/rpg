# Plano: Descrições para Entidades (Monstros e Personagens)

## Objetivo
Adicionar descrições curtas mas informativas para todos os monstros e personagens do jogo, explicando:
- O que são (origem/conceito)
- Características principais
- Contexto dentro do mundo do jogo

## Formato das Descrições
- **Tamanho**: 1-3 frases (curto e direto)
- **Tom**: Narrativo, mas informativo
- **Conteúdo**: Origem + características + contexto
- **Propriedade**: `desc: "..."` no objeto da entidade em `combat-data.js` e nos arquivos PHP em `app/GameData/sheets/`

## Estrutura de Implementação

### 1. Classes/Personagens (Heroes)
- **Swordman** - Guerreiro de uma mão, disciplina militar
- **Archer** - Arqueiro de precisão, natureza
- **Mage** - Feiticeiro arcano, poder mágico
- **Thief/Rogue** - Ladrão ágil, sombras
- **Acolyte/Cleric** - Clérigo sagrado, cura e proteção
- **Blacksmith** - Ferreiro guerreiro, criação e combate

### 2. Monstros por Cidade

#### STORMHAVEN (Costeiro/Piratas)
- **Goblin Raider** - Goblin costeiro com equipamento roubado
- **Coastal Crab** - Caranguejo gigante da costa
- **Sea Rat** - Rato do porto, venenoso
- **Bandit Marauder** - Bandido costeiro, saqueador
- **Rock Golem (Small)** - Golem de pedra, guardião
- **Skeleton Soldier** - Soldado morto-vivo da costa
- **Orc Scout** - Orc explorador costeiro
- **Harpy** - Criatura voadora das falésias
- **Troll Warrior** - Troll guerreiro costeiro
- **Pirate Ghost** - Fantasma de pirata
- **Captain Grimbeard** - Capitão pirata fantasma (Boss)

#### ELDERVALE (Floresta/Natureza)
- **Gelatinous Cube** - Cubo de gelatina, absorve presas
- **Feral Wolf** - Lobo selvagem da floresta
- **Giant Spider** - Aranha gigante venenosa
- **Bat Swarm** - Enxame de morcegos
- **Treant Sapling** - Árvore jovem animada
- **Giant Rat** - Rato gigante da floresta
- **Hornet Queen** - Abelha rainha gigante
- **Wild Boar** - Javali selvagem
- **Dryad** - Espírito da natureza
- **Ancient Treant** - Árvore anciã (Boss)

#### MONSTROS GENÉRICOS (Sem cidade específica ainda)
- **Dire Wolf** - Lobo feroz e inteligente
- **Orc Warrior** - Guerreiro orc, força bruta
- **Toxic Slime** - Slime venenoso
- **Goblin Scout** - Goblin explorador
- **Hobgoblin Brute** - Hobgoblin bruto
- **Bandit Archer** - Arqueiro bandido

## Template de Descrição

```javascript
// Exemplo:
desc: "Um goblin costeiro que sobrevive roubando navios e viajantes. Usa equipamentos roubados e é conhecido por seus ataques rápidos e sujos."
```

## Critérios para Descrições

1. **Simplicidade**: Fácil de entender
2. **Contexto**: Relacionar com o mundo do jogo
3. **Características**: Mencionar habilidades/comportamentos únicos
4. **Origem**: Explicar de onde vêm (quando relevante)
5. **Tom Consistente**: Manter estilo narrativo uniforme

## Ordem de Implementação Sugerida

1. ✅ Criar plano (este documento)
2. ✅ Implementar descrições para Classes/Heroes
3. ✅ Implementar descrições para Monstros de Stormhaven
4. ✅ Implementar descrições para Monstros de Eldervale
5. ✅ Implementar descrições para Monstros Genéricos
6. ✅ Revisar e ajustar descrições para consistência

## Observações

- Descrições podem ser expandidas no futuro se necessário
- Manter compatibilidade com código existente (propriedade opcional)
- Considerar adicionar descrições mais detalhadas em um sistema de Bestiário futuro
- Descriptions podem ser usadas em tooltips, bestiário, ou diálogos com NPCs


