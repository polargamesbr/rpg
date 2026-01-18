/**
 * Map Entity Bridge
 * Maps tactical map units to combat-data.js entity definitions
 */
const MapEntityBridge = {
    // Map unit IDs → combatData.entities keys
    heroMap: {
        'hero1': 'hero_swordman',   // Guerreiro
        'hero2': 'hero_mage',       // Mago
        'hero3': 'hero_archer'      // Arqueira
    },

    enemyMap: {
        'orc1': 'orc',
        'orc2': 'orc_scout',
        'orc3': 'bandit_marauder',
        'orc4': 'goblin',
        'wolf1': 'wolf',
        'slime1': 'toxic_slime'
    },

    /**
     * Get combat entity key from map unit
     */
    getCombatEntityKey(mapUnit) {
        if (mapUnit.combatKey) {
            return mapUnit.combatKey;
        }
        if (mapUnit.combat_key) {
            return mapUnit.combat_key;
        }
        if (mapUnit.type === 'player') {
            return this.heroMap[mapUnit.id] || 'hero_swordman';
        }
        return this.enemyMap[mapUnit.id] || 'orc';
    },

    /**
     * Find allies within attack range of a unit at a given position
     */
    findAlliesInRange(unit, allUnits, position) {
        const pos = position || { x: unit.x, y: unit.y };
        const range = unit.attackRange || 1;

        return allUnits.filter(ally => {
            if (ally.id === unit.id || ally.hp <= 0) return false;
            const dist = Math.abs(ally.x - pos.x) + Math.abs(ally.y - pos.y);
            return dist <= range;
        });
    },

    /**
     * Find enemies within attack range of a unit at a given position
     */
    findEnemiesInRange(unit, allEnemies, position) {
        const pos = position || { x: unit.x, y: unit.y };
        const range = unit.attackRange || 1;

        return allEnemies.filter(enemy => {
            if (enemy.hp <= 0) return false;
            const dist = Math.abs(enemy.x - pos.x) + Math.abs(enemy.y - pos.y);
            return dist <= range;
        });
    },

    /**
     * Check if a unit is adjacent to (or on same cell as) an enemy
     */
    isAdjacentToEnemy(unit, enemies) {
        return enemies.some(enemy => {
            if (enemy.hp <= 0) return false;
            const dist = Math.abs(enemy.x - unit.x) + Math.abs(enemy.y - unit.y);
            return dist <= 1;
        });
    },

    /**
     * Get the enemy at or adjacent to a position
     */
    getEncounterEnemy(position, enemies) {
        // First check same cell
        let enemy = enemies.find(e => e.hp > 0 && e.x === position.x && e.y === position.y);
        if (enemy) return enemy;

        // Check adjacent cells
        const adjacent = [
            { x: position.x - 1, y: position.y },
            { x: position.x + 1, y: position.y },
            { x: position.x, y: position.y - 1 },
            { x: position.x, y: position.y + 1 }
        ];

        for (const adj of adjacent) {
            enemy = enemies.find(e => e.hp > 0 && e.x === adj.x && e.y === adj.y);
            if (enemy) return enemy;
        }

        return null;
    },

    /**
     * Prepare battle participants data for session storage
     */
    prepareBattleData(heroes, enemies, initiatorId) {
        return {
            heroKeys: heroes.map(h => this.getCombatEntityKey(h)),
            enemyKeys: enemies.map(e => this.getCombatEntityKey(e)),
            heroMapIds: heroes.map(h => h.id),
            enemyMapIds: enemies.map(e => e.id),
            heroStates: heroes.map(h => ({
                mapId: h.id,
                hp: h.hp,
                maxHp: h.maxHp,
                mana: h.mana ?? h.mp ?? h.sp ?? null,
                maxMana: h.maxMana ?? h.maxMp ?? h.maxSp ?? null
            })),
            enemyStates: enemies.map(e => ({
                mapId: e.id,
                hp: e.hp,
                maxHp: e.maxHp,
                mana: e.mana ?? e.mp ?? e.sp ?? null,
                maxMana: e.maxMana ?? e.maxMp ?? e.maxSp ?? null
            })),
            initiatorId: initiatorId || null
        };
    }
};

// Export for use in map-engine.js
window.MapEntityBridge = MapEntityBridge;
