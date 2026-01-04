/**
 * Skill Engine - Handles all buff/debuff logic
 * Separated from combat-system.js for clean architecture
 */

class SkillEngine {

    /**
     * Apply a buff to an entity
     * @param {Object} entity - The entity receiving the buff
     * @param {Object} buffData - The buff configuration
     * @param {Object} source - The entity that applied the buff
     * @param {String} skillId - The skill ID that applied this buff (for stable IDs)
     */
    static applyBuff(entity, buffData, source, skillId = null) {
        // Don't apply buffs to dead entities
        if (!entity || entity.hp <= 0) return;

        if (!entity.activeBuffs) entity.activeBuffs = [];

        // Generate stable ID: prefer buffData.id, then skillId-based, then fallback
        let stableId = buffData.id;
        if (!stableId && skillId) {
            stableId = `${skillId}_buff`;
        }
        if (!stableId) {
            // Last resort: use a descriptive name based on buff properties
            const props = [];
            if (buffData.stats) props.push('stats');
            if (buffData.damageDealt) props.push('dmg');
            if (buffData.damageTaken) props.push('def');
            if (buffData.critBonus) props.push('crit');
            stableId = `buff_${props.join('_') || 'generic'}`;
        }

        const buff = {
            id: stableId,
            source: source?.name || 'Unknown',
            duration: buffData.duration,
            appliedTurn: window.combatSystem?.state?.turnCount, // Track when it was applied
            data: {
                ...buffData,
                id: stableId  // Ensure data.id is set for renderStatusIcons
            }
        };

        entity.activeBuffs.push(buff);

        console.log(`[SKILL ENGINE] Applied buff to ${entity.name}:`, buff.data);

        // Audio: Buff apply
        if (window.combatSystem?.audioManager) {
            window.combatSystem.audioManager.play('buff_apply', { target: entity, buff: buffData, source });
        }

        // Recalculate entity stats with new buff
        this.recalculateStats(entity);
    }

    /**
     * Apply a debuff to an entity
     * @param {Object} entity - The entity receiving the debuff
     * @param {Object} debuffData - The debuff configuration
     * @param {Object} source - The entity that applied the debuff
     * @param {String} skillId - The skill ID that applied this debuff (for stable IDs)
     */
    static applyDebuff(entity, debuffData, source, skillId = null) {
        // Don't apply debuffs to dead entities
        if (!entity || entity.hp <= 0) return;

        if (!entity.activeDebuffs) entity.activeDebuffs = [];

        // Generate stable ID: prefer debuffData.id, then skillId-based, then fallback
        let stableId = debuffData.id;
        if (!stableId && skillId) {
            stableId = `${skillId}_debuff`;
        }
        if (!stableId) {
            // Last resort: use a descriptive name based on debuff properties
            const props = [];
            if (debuffData.stats) props.push('stats');
            if (debuffData.aspd) props.push('slow');
            if (debuffData.flee) props.push('flee');
            stableId = `debuff_${props.join('_') || 'generic'}`;
        }

        const debuff = {
            id: stableId,
            source: source?.name || 'Unknown',
            duration: debuffData.duration,
            appliedTurn: window.combatSystem?.state?.turnCount, // Track when it was applied
            data: {
                ...debuffData,
                id: stableId  // Ensure data.id is set for renderStatusIcons
            }
        };

        entity.activeDebuffs.push(debuff);

        console.log(`[SKILL ENGINE] Applied debuff to ${entity.name}:`, debuff.data);

        // Audio: Debuff apply
        if (window.combatSystem?.audioManager) {
            window.combatSystem.audioManager.play('debuff_apply', { target: entity, debuff: debuffData, source });
        }

        // Recalculate entity stats with new debuff
        this.recalculateStats(entity);
    }

    /**
     * Process buffs/debuffs at turn start/end
     * @param {Object} entity - The entity to process
     * @param {String} timing - 'turn_start' or 'turn_end'
     */
    static processBuffs(entity, timing) {
        let changed = false;

        // IMPORTANT:
        // We tick durations on TURN END, not turn_start.
        // This ensures that a buff with duration: 1 will last for the full next turn.
        // Example: If applied on turn 1, it will be active during turn 2 and expire at turn 2's end.
        if (timing !== 'turn_end') {
            return;
        }

        // Get current turn count for comparison
        const currentTurn = window.combatSystem?.state?.turnCount;

        // Process buffs
        if (entity.activeBuffs && entity.activeBuffs.length > 0) {
            entity.activeBuffs.forEach(b => {
                // Prevent duration decrement if applied on the same turn (fixes self-buff instant expiration)
                if (b.appliedTurn !== undefined && currentTurn !== undefined && b.appliedTurn === currentTurn) {
                    return;
                }
                b.duration--;
            });

            const expired = entity.activeBuffs.filter(b => b.duration <= 0);
            entity.activeBuffs = entity.activeBuffs.filter(b => b.duration > 0);

            if (expired.length > 0) {
                expired.forEach(b => console.log(`[SKILL ENGINE] Buff expired on ${entity.name}:`, b.data));
                changed = true;
            }
        }

        // Process debuffs
        if (entity.activeDebuffs && entity.activeDebuffs.length > 0) {
            entity.activeDebuffs.forEach(d => {
                // Prevent duration decrement if applied on the same turn
                if (d.appliedTurn !== undefined && currentTurn !== undefined && d.appliedTurn === currentTurn) {
                    return;
                }
                d.duration--;
            });

            const expired = entity.activeDebuffs.filter(d => d.duration <= 0);
            entity.activeDebuffs = entity.activeDebuffs.filter(d => d.duration > 0);

            if (expired.length > 0) {
                expired.forEach(d => console.log(`[SKILL ENGINE] Debuff expired on ${entity.name}:`, d.data));
                changed = true;
            }
        }

        // Recalculate stats if any buff/debuff expired
        if (changed) {
            this.recalculateStats(entity);
        }
    }

    /**
     * Recalculate entity stats with all active buffs/debuffs
     * @param {Object} entity - The entity to recalculate
     */
    static recalculateStats(entity) {
        // Persist base attributes if not already set (snapshot on first call)
        if (!entity.baseAttributes) {
            entity.baseAttributes = { ...entity.attributes };
        }

        // Calculate base stats (without buffs)
        const baseStats = this.calculateBaseStats(entity);

        // Clone base stats for modification
        let stats = { ...baseStats };
        // IMPORTANT: Always start from baseAttributes, not entity.attributes (which may have been modified)
        let attributes = { ...(entity.baseAttributes || entity.attributes) };

        // Multipliers (start at 1.0 = no change)
        let damageDealtMult = 1.0;
        let damageTakenMult = 1.0;
        let critBonus = 0;
        let parryChance = 0;
        let tauntChance = 0;

        // Apply all active buffs
        if (entity.activeBuffs) {
            entity.activeBuffs.forEach(buff => {
                const data = buff.data;

                // Attribute buffs
                if (data.stats) {
                    Object.keys(data.stats).forEach(stat => {
                        if (attributes[stat] !== undefined) {
                            attributes[stat] += data.stats[stat];
                        }
                    });
                }

                // Combat stat buffs (flat additions)
                if (data.atk) stats.atk += data.atk;
                if (data.matk) stats.matk += data.matk;
                if (data.hit) stats.hit += data.hit;

                // Percentage-based bonuses/penalties (Berserk Mode)
                if (data.atkBonus !== undefined) {
                    stats.atk = Math.floor(stats.atk * (1 + data.atkBonus));
                }
                if (data.defPenalty !== undefined) {
                    // defPenalty is negative, so we add it (e.g., -0.5 means 50% reduction)
                    damageTakenMult *= (1 + data.defPenalty);
                }
                if (data.flee) stats.flee += data.flee;
                if (data.aspd) stats.aspd += data.aspd;

                // Multipliers
                if (data.damageDealt) damageDealtMult *= data.damageDealt;
                if (data.damageTaken) damageTakenMult *= data.damageTaken;
                if (data.critBonus) critBonus += data.critBonus;
                if (data.parryChance) parryChance = Math.max(parryChance, data.parryChance);
                if (data.tauntChance) tauntChance = Math.max(tauntChance, data.tauntChance);
            });
        }

        // Apply all active debuffs (negative effects)
        if (entity.activeDebuffs) {
            entity.activeDebuffs.forEach(debuff => {
                const data = debuff.data;

                // Attribute debuffs
                if (data.stats) {
                    Object.keys(data.stats).forEach(stat => {
                        if (attributes[stat] !== undefined) {
                            attributes[stat] += data.stats[stat]; // Already negative
                        }
                    });
                }

                // Combat stat debuffs
                if (data.aspd) stats.aspd += data.aspd; // Already negative
                if (data.flee) stats.flee += data.flee; // Already negative
            });
        }

        // Recalculate derived stats from modified attributes
        const recalculated = this.calculateStatsFromAttributes(entity.level || entity.baseLevel || 1, attributes);

        // Merge recalculated stats with direct buffs
        stats.atk = recalculated.atk + (stats.atk - baseStats.atk);
        stats.matk = recalculated.matk + (stats.matk - baseStats.matk);
        stats.hit = recalculated.hit + (stats.hit - baseStats.hit);
        stats.flee = recalculated.flee + (stats.flee - baseStats.flee);
        stats.aspd = recalculated.aspd + (stats.aspd - baseStats.aspd);

        // Store buffed stats
        entity.stats = stats;
        entity.maxHp = recalculated.maxHp;
        entity.maxMana = recalculated.maxMana;
        entity.buffedDamageDealt = damageDealtMult;
        entity.buffedDamageTaken = damageTakenMult;
        entity.buffedCritBonus = critBonus;
        entity.buffedParryChance = parryChance;
        entity.buffedTauntChance = tauntChance;

        // Store current attributes (after buffs/debuffs) for overlay display
        entity.currentAttributes = { ...attributes };

        // Safety fallbacks for HP/MP (only for invalid values, NOT for dead entities)
        // Don't restore HP if entity is dead (hp <= 0 is valid for dead entities)
        if (entity.hp === undefined || entity.hp === null || isNaN(entity.hp)) {
            entity.hp = entity.maxHp;
        }
        // Only restore mana if it's invalid, not if it's 0 (0 mana is valid)
        if (entity.mana === undefined || entity.mana === null || isNaN(entity.mana)) {
            entity.mana = entity.maxMana;
        }

        // Ensure HP/MP don't exceed max
        if (entity.hp > entity.maxHp) entity.hp = entity.maxHp;
        if (entity.mana > entity.maxMana) entity.mana = entity.maxMana;
    }

    /**
     * Calculate base stats from attributes (no buffs)
     * @param {Object} entity - The entity
     * @returns {Object} Base stats
     */
    static calculateBaseStats(entity) {
        const a = entity.attributes || { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
        const lvl = entity.level || entity.baseLevel || 1;

        return this.calculateStatsFromAttributes(lvl, a);
    }

    /**
     * Calculate stats from attributes and level
     * @param {Number} lvl - Entity level
     * @param {Object} attributes - Entity attributes
     * @returns {Object} Calculated stats
     */
    static calculateStatsFromAttributes(lvl, a) {
        // HP/MP: Level has strong impact for survivability scaling
        const maxHp = Math.floor((lvl * 100) + (a.vit * 25));
        const maxMana = Math.floor((lvl * 15) + (a.int * 8));

        // ATK: STR is primary, level amplifies significantly
        const statusAtk = Math.floor(
            (a.str * 2) +           // Strength is doubled
            (lvl * 1.5) +           // Level has real weight
            (a.dex * 0.5) +         // DEX contributes
            (a.luk * 0.3)           // LUK contributes
        );
        const atk = statusAtk + 50;

        // MATK: INT is primary, level amplifies
        const statusMatk = Math.floor(
            (a.int * 2) +           // Intelligence doubled
            (lvl * 1.2) +           // Level scaling
            (a.dex * 0.4) +         // DEX for casting speed
            (a.luk * 0.3)           // LUK for crit magic
        );
        const matk = statusMatk + 30;

        // DEF: VIT is base, scales with level
        const softDef = Math.floor((a.vit * 0.8) + (a.agi * 0.3) + (lvl * 0.5));
        const hardDef = Math.floor(20 + (lvl * 0.3));

        // HIT/FLEE: Dexterity and level based
        const hit = Math.floor(175 + (lvl * 2) + (a.dex * 1.5) + (a.luk * 0.5));
        const flee = Math.floor(100 + (lvl * 2) + (a.agi * 1.5) + (a.luk * 0.5));

        // CRIT: Luck based, slightly affected by level
        const crit = Math.floor(1 + (a.luk * 0.4) + (lvl * 0.1));

        // ASPD: Agility and dexterity
        const aspd = Math.floor(150 + (a.agi * 0.5) + (a.dex * 0.3) + (lvl * 0.2));

        // MDEF: Intelligence and vitality, scales with level
        const mdef = Math.floor((a.int * 1.2) + (a.vit * 0.6) + (lvl * 0.8));

        return { atk, matk, softDef, hardDef, mdef, hit, flee, crit, aspd, maxHp, maxMana };
    }

    /**
     * Get all active buffs for UI display
     * @param {Object} entity
     * @returns {Array} List of active buffs with display info
     */
    static getActiveBuffsForDisplay(entity) {
        const buffs = [];

        if (entity.activeBuffs) {
            entity.activeBuffs.forEach(buff => {
                buffs.push({
                    type: 'buff',
                    source: buff.source,
                    duration: buff.duration,
                    data: buff.data
                });
            });
        }

        if (entity.activeDebuffs) {
            entity.activeDebuffs.forEach(debuff => {
                buffs.push({
                    type: 'debuff',
                    source: debuff.source,
                    duration: debuff.duration,
                    data: debuff.data
                });
            });
        }

        return buffs;
    }
}

// Export for use in combat-system.js
window.SkillEngine = SkillEngine;
