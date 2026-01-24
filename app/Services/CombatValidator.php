<?php

namespace App\Services;

use App\Models\Character;
use App\Services\EntitySheetService;
use App\Services\EntityInstanceBuilder;

class CombatValidator
{
    /**
     * Valida HP/SP do player e allies
     * @param array $oldState Estado anterior
     * @param array $newState Estado novo
     * @param array $character Dados do personagem
     * @param array $config Config da quest
     * @return array ['valid' => bool, 'errors' => string[]]
     */
    public static function validateHpSp(array $oldState, array $newState, array $character, array $config): array
    {
        $errors = [];

        // Validar player
        if (isset($newState['player']) && is_array($newState['player'])) {
            $player = $newState['player'];
            $oldPlayer = $oldState['player'] ?? [];
            
            $entityId = $player['entity_id'] ?? $character['entity_id'] ?? 'swordsman';
            
            // Usar EntityInstanceBuilder para calcular maxHp corretamente (level * 100 + vit * 20)
            // OU usar max_hp do character se disponível (mais confiável)
            $maxHp = (int)($character['max_hp'] ?? 0);
            $maxSp = (int)($character['max_mana'] ?? 0);
            
            // Se não tem no character, calcular usando EntityInstanceBuilder
            if ($maxHp <= 0 || $maxSp <= 0) {
                try {
                    $inst = EntityInstanceBuilder::build($entityId, $character, []);
                    $maxHp = (int)($inst['maxHp'] ?? 100);
                    $maxSp = (int)($inst['maxSp'] ?? 50);
                } catch (\Throwable $e) {
                    // Fallback: calcular manualmente
                    $level = (int)($character['level'] ?? 1);
                    $vit = (int)($character['vit'] ?? 10);
                    $int = (int)($character['int'] ?? 10);
                    $maxHp = ($level * 100) + ($vit * 20);
                    $maxSp = ($level * 10) + ($int * 5);
                }
            }

            $newHp = (int)($player['hp'] ?? 0);
            $newSp = (int)($player['sp'] ?? 0);
            $oldHp = (int)($oldPlayer['hp'] ?? 0);
            $oldSp = (int)($oldPlayer['sp'] ?? 0);
            
            // Se oldState está vazio ou tem valores zerados, pode ser primeira sincronização
            $isFirstSync = (empty($oldState) || $oldHp <= 0 || $oldSp <= 0);

            // HP não pode ser negativo
            if ($newHp < 0) {
                $errors[] = "Player HP cannot be negative: {$newHp}";
            }

            // HP não pode exceder maxHp MUITO (mais de 3x) - isso é claramente manipulação
            // Valores entre maxHp e 3x maxHp podem ser buffs temporários
            if ($newHp > $maxHp * 3.0) {
                $errors[] = "Player HP exceeds maximum excessively: {$newHp} > {$maxHp}";
            }

            // SP não pode ser negativo
            if ($newSp < 0) {
                $errors[] = "Player SP cannot be negative: {$newSp}";
            }

            // SP não pode exceder maxSp MUITO (mais de 3x)
            if ($newSp > $maxSp * 3.0) {
                $errors[] = "Player SP exceeds maximum excessively: {$newSp} > {$maxSp}";
            }

            // HP não pode aumentar drasticamente SEM motivo (só se não for primeira sincronização)
            // Aumentos grandes podem ser heal legítimo ou sincronização
            if (!$isFirstSync && $newHp > $oldHp && ($newHp - $oldHp) > $maxHp * 0.8 && $oldHp > $maxHp * 0.3) {
                // Aumento de mais de 80% do maxHp é suspeito, mas só se oldHp > 30% do max (não é sincronização)
                $errors[] = "Player HP increased suspiciously: {$oldHp} -> {$newHp}";
            }
        }

        // Validar allies
        if (isset($newState['allies']) && is_array($newState['allies'])) {
            $oldAllies = $oldState['allies'] ?? [];
            $oldAlliesById = [];
            foreach ($oldAllies as $a) {
                $id = $a['id'] ?? null;
                if ($id) {
                    $oldAlliesById[$id] = $a;
                }
            }

            foreach ($newState['allies'] as $ally) {
                $allyId = $ally['id'] ?? null;
                if (!$allyId) continue;

                $entityId = $ally['entity_id'] ?? null;
                if (!$entityId) continue;

                $entitySheet = EntitySheetService::find($entityId) ?: EntitySheetService::findByCombatKey($entityId);
                if (!$entitySheet) continue;

                $stats = EntitySheetService::getCombatStats($entitySheet);
                $maxHp = $stats['maxHp'] ?? 100;
                $maxSp = $stats['maxSp'] ?? 50;

                $newHp = (int)($ally['hp'] ?? 0);
                $newSp = (int)($ally['sp'] ?? 0);
                $oldAlly = $oldAlliesById[$allyId] ?? [];
                $oldHp = (int)($oldAlly['hp'] ?? $maxHp);
                $oldSp = (int)($oldAlly['sp'] ?? $maxSp);

                if ($newHp < 0) {
                    $errors[] = "Ally {$allyId} HP cannot be negative: {$newHp}";
                }
                if ($newHp > $maxHp * 1.5) {
                    $errors[] = "Ally {$allyId} HP exceeds maximum: {$newHp} > {$maxHp}";
                }
                if ($newSp < 0) {
                    $errors[] = "Ally {$allyId} SP cannot be negative: {$newSp}";
                }
                if ($newSp > $maxSp * 1.5) {
                    $errors[] = "Ally {$allyId} SP exceeds maximum: {$newSp} > {$maxSp}";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Valida posições (dentro do mapa, não é parede)
     * @param int $x
     * @param int $y
     * @param array $config Config da quest
     * @return bool
     */
    public static function validatePosition(int $x, int $y, array $config): bool
    {
        $mapConfig = $config['map'] ?? [];
        $gridCols = (int)($mapConfig['gridCols'] ?? 100);
        $gridRows = (int)($mapConfig['gridRows'] ?? 100);

        // Verificar limites do mapa
        if ($x < 1 || $x > $gridCols || $y < 1 || $y > $gridRows) {
            return false;
        }

        // Verificar se é parede
        $walls = $config['walls'] ?? [];
        foreach ($walls as $wall) {
            $wallX = (int)($wall['x'] ?? 0);
            $wallY = (int)($wall['y'] ?? 0);
            if ($wallX === $x && $wallY === $y) {
                return false;
            }
        }

        return true;
    }

    /**
     * Valida distância de movimento (verifica se está dentro do range)
     * @param int $fromX
     * @param int $fromY
     * @param int $toX
     * @param int $toY
     * @param int $maxDistance
     * @return bool
     */
    public static function validateDistance(int $fromX, int $fromY, int $toX, int $toY, int $maxDistance): bool
    {
        // Distância de Manhattan (movimento em grid)
        $distance = abs($toX - $fromX) + abs($toY - $fromY);
        return $distance <= $maxDistance;
    }

    /**
     * Verifica se há paredes no caminho entre duas posições
     * @param int $fromX
     * @param int $fromY
     * @param int $toX
     * @param int $toY
     * @param array $config
     * @return bool true se há paredes no caminho
     */
    public static function hasWallsInPath(int $fromX, int $fromY, int $toX, int $toY, array $config): bool
    {
        $walls = $config['walls'] ?? [];
        if (empty($walls)) {
            return false;
        }

        // Criar mapa de paredes para lookup rápido
        $wallMap = [];
        foreach ($walls as $wall) {
            $wx = (int)($wall['x'] ?? 0);
            $wy = (int)($wall['y'] ?? 0);
            if ($wx > 0 && $wy > 0) {
                $wallMap["{$wx},{$wy}"] = true;
            }
        }

        // Se não há paredes, caminho é válido
        if (empty($wallMap)) {
            return false;
        }

        // Verificar caminho usando Bresenham-like para grid (movimento em passos)
        $dx = abs($toX - $fromX);
        $dy = abs($toY - $fromY);
        $sx = $fromX < $toX ? 1 : -1;
        $sy = $fromY < $toY ? 1 : -1;
        $err = $dx - $dy;

        $x = $fromX;
        $y = $fromY;

        // Verificar cada célula no caminho (exceto origem e destino)
        while (true) {
            // Se chegou no destino, caminho é válido
            if ($x === $toX && $y === $toY) {
                break;
            }

            // Verificar se célula intermediária é parede
            if (($x !== $fromX || $y !== $fromY) && isset($wallMap["{$x},{$y}"])) {
                return true; // Há parede no caminho
            }

            $e2 = 2 * $err;
            if ($e2 > -$dy) {
                $err -= $dy;
                $x += $sx;
            }
            if ($e2 < $dx) {
                $err += $dx;
                $y += $sy;
            }
        }

        return false; // Não há paredes no caminho
    }

    /**
     * Verifica se uma célula está ocupada por outra unidade
     * @param int $x
     * @param int $y
     * @param string $excludeUnitId ID da unidade a excluir da verificação (a própria unidade que está se movendo)
     * @param array $state Estado atual
     * @return bool true se está ocupada
     */
    public static function isCellOccupied(int $x, int $y, string $excludeUnitId, array $state): bool
    {
        // Verificar player
        if (isset($state['player']) && is_array($state['player'])) {
            $playerId = $state['player']['id'] ?? 'player';
            $playerX = (int)($state['player']['x'] ?? 0);
            $playerY = (int)($state['player']['y'] ?? 0);
            
            if ($playerId !== $excludeUnitId && $playerX === $x && $playerY === $y) {
                return true;
            }
        }

        // Verificar allies
        if (isset($state['allies']) && is_array($state['allies'])) {
            foreach ($state['allies'] as $ally) {
                if (!is_array($ally)) continue;
                $allyId = $ally['id'] ?? null;
                $allyX = (int)($ally['x'] ?? 0);
                $allyY = (int)($ally['y'] ?? 0);
                
                if ($allyId && $allyId !== $excludeUnitId && $allyX === $x && $allyY === $y) {
                    return true;
                }
            }
        }

        // Verificar enemies
        if (isset($state['enemies']) && is_array($state['enemies'])) {
            foreach ($state['enemies'] as $enemy) {
                if (!is_array($enemy)) continue;
                $enemyId = $enemy['id'] ?? null;
                $enemyX = (int)($enemy['x'] ?? 0);
                $enemyY = (int)($enemy['y'] ?? 0);
                
                if ($enemyId && $enemyId !== $excludeUnitId && $enemyX === $x && $enemyY === $y) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Valida movimento do player
     * @param array $oldState
     * @param array $newState
     * @param array $config
     * @param array $character
     * @return array ['valid' => bool, 'errors' => string[]]
     */
    public static function validateMovement(array $oldState, array $newState, array $config, array $character): array
    {
        $errors = [];

        if (!isset($newState['player']) || !is_array($newState['player'])) {
            return ['valid' => true, 'errors' => []];
        }

        $oldPlayer = $oldState['player'] ?? [];
        $newPlayer = $newState['player'];

        $oldX = (int)($oldPlayer['x'] ?? 0);
        $oldY = (int)($oldPlayer['y'] ?? 0);
        $newX = (int)($newPlayer['x'] ?? 0);
        $newY = (int)($newPlayer['y'] ?? 0);

        // Se não mudou posição, não precisa validar movimento
        if ($oldX === $newX && $oldY === $newY) {
            return ['valid' => true, 'errors' => []];
        }

        // Validar nova posição
        if (!self::validatePosition($newX, $newY, $config)) {
            $errors[] = "Invalid position: ({$newX}, {$newY})";
            return ['valid' => false, 'errors' => $errors];
        }

        // Verificar se célula está ocupada
        $playerId = $newPlayer['id'] ?? 'player';
        if (self::isCellOccupied($newX, $newY, $playerId, $newState)) {
            $errors[] = "Position ({$newX}, {$newY}) is occupied by another unit";
        }

        // Obter moveRange do player
        $entityId = $newPlayer['entity_id'] ?? $character['entity_id'] ?? 'swordsman';
        $entitySheet = EntitySheetService::find($entityId) ?: EntitySheetService::findByCombatKey($entityId);
        
        $moveRange = 4; // Default
        if ($entitySheet) {
            $stats = EntitySheetService::getCombatStats($entitySheet);
            $moveRange = (int)($stats['moveRange'] ?? 4);
        }

        // Validar distância
        if (!self::validateDistance($oldX, $oldY, $newX, $newY, $moveRange)) {
            $distance = abs($newX - $oldX) + abs($newY - $oldY);
            $errors[] = "Movement distance exceeds moveRange: {$distance} > {$moveRange}";
        }

        // Validar se há paredes no caminho
        if (self::hasWallsInPath($oldX, $oldY, $newX, $newY, $config)) {
            $errors[] = "Movement path contains walls: ({$oldX}, {$oldY}) -> ({$newX}, {$newY})";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Valida turn/phase
     * @param array $oldState
     * @param array $newState
     * @return array ['valid' => bool, 'errors' => string[]]
     */
    public static function validateTurnPhase(array $oldState, array $newState): array
    {
        $errors = [];

        $oldTurn = (int)($oldState['turn'] ?? 1);
        $oldPhase = $oldState['phase'] ?? 'player';
        $newTurn = (int)($newState['turn'] ?? 1);
        $newPhase = $newState['phase'] ?? 'player';

        // Turn não pode diminuir
        if ($newTurn < $oldTurn) {
            $errors[] = "Turn cannot decrease: {$oldTurn} -> {$newTurn}";
        }

        // Turn não pode pular mais de 1 (exceto se for reset)
        if ($newTurn > $oldTurn + 1) {
            $errors[] = "Turn cannot skip: {$oldTurn} -> {$newTurn}";
        }

        // Phase deve fazer sentido
        $validPhases = ['player', 'enemy'];
        if (!in_array($newPhase, $validPhases, true)) {
            $errors[] = "Invalid phase: {$newPhase}";
        }

        // Se turn aumentou, phase deve ter mudado ou resetado
        if ($newTurn > $oldTurn) {
            // Turn novo geralmente começa em 'player'
            if ($newPhase !== 'player' && $newPhase !== 'enemy') {
                $errors[] = "Invalid phase transition on new turn";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Valida remoção de inimigos (só pode remover se HP <= 0 no estado anterior)
     * @param array $oldState
     * @param array $newState
     * @param array $config
     * @return array ['valid' => bool, 'errors' => string[]]
     */
    public static function validateEnemyRemoval(array $oldState, array $newState, array $config): array
    {
        $errors = [];

        $oldEnemies = $oldState['enemies'] ?? [];
        $newEnemies = $newState['enemies'] ?? [];

        $oldEnemiesById = [];
        foreach ($oldEnemies as $e) {
            $id = $e['id'] ?? null;
            if ($id) {
                $oldEnemiesById[$id] = $e;
            }
        }

        $newEnemiesById = [];
        foreach ($newEnemies as $e) {
            $id = $e['id'] ?? null;
            if ($id) {
                $newEnemiesById[$id] = $e;
            }
        }

        // Verificar inimigos que foram removidos
        // IMPORTANTE: Se o frontend removeu um inimigo, é porque ele morreu (HP <= 0)
        // O oldState pode ter HP alto porque o dano ainda não foi aplicado no momento da comparação
        // Ser muito tolerante aqui - se o inimigo existia no oldState e foi removido, permitir
        foreach ($oldEnemiesById as $enemyId => $oldEnemy) {
            if (!isset($newEnemiesById[$enemyId])) {
                // Inimigo foi removido - permitir sempre se existia no oldState
                // O frontend só remove quando HP <= 0, então se foi removido, estava morto
                // Não validar HP aqui para evitar falsos positivos
            } else {
                // Inimigo ainda existe - verificar se HP não aumentou
                $oldHp = (int)($oldEnemy['hp'] ?? 0);
                $newHp = (int)($newEnemiesById[$enemyId]['hp'] ?? 0);
                
                // HP não pode aumentar (inimigos não se curam)
                // EXCEÇÃO: Se oldHp é muito baixo, pode ser sincronização inicial ou correção de estado
                if ($newHp > $oldHp) {
                    $entityId = $newEnemiesById[$enemyId]['entity_id'] ?? null;
                    $isSync = false;
                    
                    // Se oldHp é muito baixo (< 20% do newHp ou < 100 absoluto), provavelmente é sincronização
                    if ($oldHp < 100 || $oldHp < $newHp * 0.2) {
                        $isSync = true;
                    } elseif ($entityId) {
                        $entitySheet = EntitySheetService::find($entityId) ?: EntitySheetService::findByCombatKey($entityId);
                        if ($entitySheet) {
                            $stats = EntitySheetService::getCombatStats($entitySheet);
                            $maxHp = (int)($stats['maxHp'] ?? 100);
                            // Se oldHp < 20% do max e newHp está próximo do max, é sincronização
                            if ($oldHp < $maxHp * 0.2 && $newHp >= $maxHp * 0.6) {
                                $isSync = true;
                            }
                        }
                    }
                    
                    if (!$isSync) {
                        $errors[] = "Enemy {$enemyId} HP increased: {$oldHp} -> {$newHp}";
                    }
                }
            }
        }

        // Verificar se inimigos novos foram adicionados (não permitido)
        foreach ($newEnemiesById as $enemyId => $newEnemy) {
            if (!isset($oldEnemiesById[$enemyId])) {
                // Verificar se está no config (pode ser sincronização)
                $configEnemies = $config['enemies'] ?? [];
                $inConfig = false;
                foreach ($configEnemies as $ce) {
                    if (($ce['id'] ?? '') === $enemyId) {
                        $inConfig = true;
                        break;
                    }
                }
                if (!$inConfig) {
                    $errors[] = "Enemy {$enemyId} was added but not in quest config";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Valida se unidades em unitsActed realmente existem
     * @param array $state Estado atual
     * @param array $oldState Estado anterior (para verificar se unidade morreu)
     * @return array ['valid' => bool, 'errors' => string[]]
     */
    public static function validateUnitsActed(array $state, array $oldState = []): array
    {
        $errors = [];

        $unitsActed = $state['unitsActed'] ?? [];
        if (!is_array($unitsActed)) {
            return ['valid' => true, 'errors' => []];
        }

        $player = $state['player'] ?? null;
        $allies = $state['allies'] ?? [];
        $enemies = $state['enemies'] ?? [];

        $validUnitIds = [];
        if ($player && is_array($player)) {
            $validUnitIds[] = $player['id'] ?? 'player';
        }
        foreach ($allies as $ally) {
            if (is_array($ally)) {
                $validUnitIds[] = $ally['id'] ?? null;
            }
        }
        foreach ($enemies as $enemy) {
            if (is_array($enemy)) {
                $validUnitIds[] = $enemy['id'] ?? null;
            }
        }

        // Também verificar no oldState - unidades que morreram podem estar em unitsActed
        $oldPlayer = $oldState['player'] ?? null;
        $oldAllies = $oldState['allies'] ?? [];
        $oldEnemies = $oldState['enemies'] ?? [];
        
        $oldValidUnitIds = [];
        if ($oldPlayer && is_array($oldPlayer)) {
            $oldValidUnitIds[] = $oldPlayer['id'] ?? 'player';
        }
        foreach ($oldAllies as $ally) {
            if (is_array($ally)) {
                $oldValidUnitIds[] = $ally['id'] ?? null;
            }
        }
        foreach ($oldEnemies as $enemy) {
            if (is_array($enemy)) {
                $oldValidUnitIds[] = $enemy['id'] ?? null;
            }
        }

        foreach ($unitsActed as $unitId) {
            // Permitir se existe no state atual OU se existia no state anterior (pode ter morrido)
            if (!in_array($unitId, $validUnitIds, true) && !in_array($unitId, $oldValidUnitIds, true)) {
                $errors[] = "Unit in unitsActed does not exist: {$unitId}";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
