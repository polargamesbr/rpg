/**
 * Tactical Skill Engine - Handles all buff/debuff/status effect logic
 * Adapted from ui/assets/js/skill-engine.js for the tactical system
 */

class TacticalSkillEngine {

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

        // Check if buff already exists - refresh duration if it does
        const existingIndex = entity.activeBuffs.findIndex(b => {
            const buffId = (b.data && b.data.id) ? b.data.id : b.id;
            return buffId === stableId;
        });

        if (existingIndex >= 0) {
            // Refresh duration (use max of current and new)
            const existing = entity.activeBuffs[existingIndex];
            existing.duration = Math.max(existing.duration, buffData.duration || 1);
            existing.appliedTurn = window.gameState?.turn || 1;
            console.log(`[TACTICAL SKILL ENGINE] Refreshed buff on ${entity.name}:`, existing.data);
        } else {
            const buff = {
                id: stableId,
                source: source?.name || 'Unknown',
                duration: buffData.duration || 1,
                appliedTurn: window.gameState?.turn || 1, // Track when it was applied
                data: {
                    ...buffData,
                    id: stableId  // Ensure data.id is set for renderStatusIcons
                }
            };

            entity.activeBuffs.push(buff);
            console.log(`[TACTICAL SKILL ENGINE] Applied buff to ${entity.name}:`, buff.data);
            console.log(`[TACTICAL SKILL ENGINE] Buff details:`, {
                id: buff.id,
                duration: buff.duration,
                data: buff.data,
                allBuffs: entity.activeBuffs.map(b => b.id)
            });
        }

        // Recalculate entity stats with new buff
        this.recalculateStats(entity);

        // Update UI if timeline exists (check for function in window)
        if (typeof window.updateTurnTimeline === 'function') {
            setTimeout(() => window.updateTurnTimeline(), 50);
        }
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

        // Check if debuff already exists - refresh duration if it does
        const existingIndex = entity.activeDebuffs.findIndex(d => {
            const debuffId = (d.data && d.data.id) ? d.data.id : d.id;
            return debuffId === stableId;
        });

        if (existingIndex >= 0) {
            // Refresh duration (use max of current and new)
            const existing = entity.activeDebuffs[existingIndex];
            existing.duration = Math.max(existing.duration, debuffData.duration || 1);
            existing.appliedTurn = window.gameState?.turn || 1;
            console.log(`[TACTICAL SKILL ENGINE] Refreshed debuff on ${entity.name}:`, existing.data);
        } else {
            const debuff = {
                id: stableId,
                source: source?.name || 'Unknown',
                duration: debuffData.duration || 1,
                appliedTurn: window.gameState?.turn || 1, // Track when it was applied
                data: {
                    ...debuffData,
                    id: stableId  // Ensure data.id is set for renderStatusIcons
                }
            };

            entity.activeDebuffs.push(debuff);
            console.log(`[TACTICAL SKILL ENGINE] Applied debuff to ${entity.name}:`, debuff.data);
        }

        // Recalculate entity stats with new debuff
        this.recalculateStats(entity);
    }

    /**
     * Apply a status effect (stun, poison, bleed, etc.) to an entity
     * @param {Object} entity - The entity receiving the status
     * @param {Object} effectData - The effect configuration {id, chance, duration}
     * @param {Object} source - The entity that applied the effect
     * @param {String} skillId - The skill ID that applied this effect
     */
    static applyStatusEffect(entity, effectData, source, skillId = null) {
        if (!entity || entity.hp <= 0) return;
        if (!effectData || !effectData.id) return;

        // Roll for skill application chance (0.0 to 1.0 scale)
        const roll = Math.random();
        if (roll > (effectData.chance || 1)) {
            // Failed to apply
            return;
        }

        // Initialize status effects array if needed
        if (!entity.statusEffects) entity.statusEffects = [];

        // Check if status already exists - refresh duration if it does
        const existingIndex = entity.statusEffects.findIndex(e => e.id === effectData.id);

        if (existingIndex >= 0) {
            // Refresh duration (use max of current and new)
            const existing = entity.statusEffects[existingIndex];
            existing.duration = Math.max(existing.duration, effectData.duration || 1);
            existing.appliedTurn = window.gameState?.turn || 1;
            console.log(`[TACTICAL SKILL ENGINE] Refreshed status effect on ${entity.name}:`, effectData.id);
        } else {
            // All effects tick at turn_start for better clarity
            entity.statusEffects.push({
                id: effectData.id,
                duration: effectData.duration || 1,
                tick: 'turn_start',
                appliedTurn: (window.gameState?.turn || window.gameState || {}).turn || 1 // Track when it was applied
            });
            console.log(`[TACTICAL SKILL ENGINE] Applied status effect ${effectData.id} to ${entity.name} for ${effectData.duration} turns`);
        }
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
        // gameState.turn is a number, not an object with .turn property
        const currentTurn = window.gameState?.turn || 1;

        // Process buffs
        if (entity.activeBuffs && entity.activeBuffs.length > 0) {
            entity.activeBuffs.forEach(b => {
                // Skip decrement in two cases:
                // 1. Buff was applied on the CURRENT turn (shouldn't happen since turn was incremented)
                // 2. This is the FIRST processing after the buff was applied (currentTurn === appliedTurn + 1)
                // This ensures a 3-turn buff applied on turn 1 lasts through turns 1, 2, 3 (expires at turn 4 start)
                if (b.appliedTurn !== undefined && currentTurn !== undefined) {
                    if (b.appliedTurn === currentTurn) {
                        return; // Só pula se foi aplicado EXATAMENTE neste turno (evita expirar no mesmo turno que foi ganho)
                    }
                }
                // Buff has been active for at least one full turn cycle, decrement duration
                const oldDuration = b.duration;
                b.duration = Math.max(0, b.duration - 1);
                if (oldDuration !== b.duration) {
                    console.log(`[TACTICAL SKILL ENGINE] Buff ${b.data?.id} on ${entity.name} duration: ${oldDuration} → ${b.duration} (applied turn: ${b.appliedTurn}, current turn: ${currentTurn})`);
                }
            });

            const expired = entity.activeBuffs.filter(b => b.duration <= 0);
            entity.activeBuffs = entity.activeBuffs.filter(b => b.duration > 0);

            if (expired.length > 0) {
                expired.forEach(b => console.log(`[TACTICAL SKILL ENGINE] Buff expired on ${entity.name}:`, b.data));
                changed = true;
            }
        }

        // Process debuffs
        if (entity.activeDebuffs && entity.activeDebuffs.length > 0) {
            entity.activeDebuffs.forEach(d => {
                // Same logic as buffs: skip first processing cycle after application
                if (d.appliedTurn !== undefined && currentTurn !== undefined) {
                    if (d.appliedTurn === currentTurn) {
                        return;
                    }
                }

                // Process DoT damage for debuffs with dotDamage property
                const debuffData = d.data || {};
                if (debuffData.dotDamage && debuffData.dotDamage > 0 && entity.hp > 0) {
                    const dmg = Math.max(1, Math.floor((entity.maxHp || 100) * debuffData.dotDamage));
                    entity.hp = Math.max(0, entity.hp - dmg);
                    console.log(`[TACTICAL SKILL ENGINE] ${entity.name} takes ${debuffData.name || debuffData.id} DoT damage: -${dmg} HP (${entity.hp}/${entity.maxHp})`);

                    // Visual feedback (using MapEngine helper)
                    if (window.MapEngine && typeof window.MapEngine.showDamageNumber === 'function') {
                        // Position above unit using current cell (Tactical Map uses 1-based x,y cells)
                        const worldX = (entity.x - 0.5) * (window.CONFIG?.CELL_SIZE || 64);
                        const worldY = (entity.y - 1.0) * (window.CONFIG?.CELL_SIZE || 64);
                        window.MapEngine.showDamageNumber(worldX, worldY, dmg, false, 0, 0, entity);
                    }
                }

                d.duration--;
            });

            const expired = entity.activeDebuffs.filter(d => d.duration <= 0);
            entity.activeDebuffs = entity.activeDebuffs.filter(d => d.duration > 0);

            if (expired.length > 0) {
                expired.forEach(d => console.log(`[TACTICAL SKILL ENGINE] Debuff expired on ${entity.name}:`, d.data));
                changed = true;
            }
        }

        // Recalculate stats if any buff/debuff expired
        if (changed) {
            this.recalculateStats(entity);
            // Update timeline UI after buff/debuff expiration
            if (typeof window.updateTurnTimeline === 'function') {
                setTimeout(() => window.updateTurnTimeline(), 50);
            }
        }
    }

    /**
     * Process status effects at turn start
     * @param {Object} entity - The entity to process
     * @param {String} timing - Should be 'turn_start'
     * @returns {Boolean} - true if entity should skip turn (stun/freeze)
     */
    static processStatusEffects(entity, timing) {
        let skipTurn = false;
        if (!entity.statusEffects || entity.statusEffects.length === 0 || entity.hp <= 0) return false;

        const currentTurn = gameState?.turn || 1;

        entity.statusEffects.forEach((effect) => {
            // Default to turn_start so legacy effects still behave consistently
            const tickTiming = effect.tick || 'turn_start';
            if (tickTiming !== timing) return;

            // --- Consolidated logic at Turn Start for clarity ---
            if (timing === 'turn_start') {
                let dmg = 0;
                let logMsg = '';

                // Damage over time effects
                if (effect.id === 'burn') {
                    dmg = Math.max(1, Math.floor((entity.maxHp || 100) * 0.05));
                    logMsg = `${entity.name} takes BURN damage: -${dmg} HP`;
                } else if (effect.id === 'bleed') {
                    dmg = Math.max(1, Math.floor((entity.maxHp || 100) * 0.08));
                    logMsg = `${entity.name} takes BLEED damage: -${dmg} HP`;
                } else if (effect.id === 'poison') {
                    dmg = Math.max(1, Math.floor((entity.maxHp || 100) * 0.10));
                    logMsg = `${entity.name} takes POISON damage: -${dmg} HP`;
                }

                if (dmg > 0) {
                    entity.hp = Math.max(0, entity.hp - dmg);
                    console.log(`[TACTICAL SKILL ENGINE] ${logMsg}`);
                    // Visual feedback could be added here (floating damage numbers)
                }

                // Check for turn-skipping effects BEFORE reducing duration
                if (effect.id === 'stun' || effect.id === 'freeze') {
                    skipTurn = true;
                    console.log(`[TACTICAL SKILL ENGINE] ${entity.name} is ${effect.id.toUpperCase()} and cannot act!`);
                } else if (effect.id === 'paralyze') {
                    // 50% chance to skip turn
                    if (Math.random() < 0.5) {
                        skipTurn = true;
                        console.log(`[TACTICAL SKILL ENGINE] ${entity.name} is PARALYZED and cannot act!`);
                    }
                }

                // IMPORTANT: decrement duration ONLY on the effect's tick timing.
                // Prevent duration decrement if applied on the same turn
                if (effect.appliedTurn !== undefined && currentTurn !== undefined && effect.appliedTurn === currentTurn) {
                    // Don't decrement on the turn it was applied
                    return;
                }
                effect.duration--;
            }
        });

        // Filter out expired effects
        const expired = entity.statusEffects.some(e => e.duration <= 0);
        entity.statusEffects = entity.statusEffects.filter(e => e.duration > 0);

        if (expired) {
            console.log(`[TACTICAL SKILL ENGINE] Status effects expired on ${entity.name}`);
        }

        return skipTurn;
    }

    /**
     * Recalculate entity stats with all active buffs/debuffs
     * @param {Object} entity - The entity to recalculate
     */
    static recalculateStats(entity) {
        // Persist base attributes if not already set (snapshot on first call)
        if (!entity.baseAttributes) {
            entity.baseAttributes = { ...(entity.attributes || {}) };
        }

        // FUTURE: Apply equipment stats here
        // Equipment stats should be added to attributes before calculating stats
        // if (entity.equipment && window.EquipmentManager) {
        //     const equipStats = window.EquipmentManager.calculateEquipmentStats(entity);
        //     // Add equipStats.stats to attributes before calculating stats
        //     // Equipment can also have elementOverride to change element
        //     // Example: if (equipStats.elementOverride) entity.element = equipStats.elementOverride;
        // }

        // Calculate base stats (without buffs) - simplified for tactical system
        const baseStats = this.calculateBaseStats(entity);

        // Clone base stats for modification
        let stats = { ...baseStats };
        // IMPORTANT: Always start from baseAttributes, not entity.attributes (which may have been modified)
        let attributes = { ...(entity.baseAttributes || entity.attributes || {}) };

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
                if (data.atk) stats.atk = (stats.atk || 0) + data.atk;
                if (data.matk) stats.matk = (stats.matk || 0) + data.matk;
                if (data.hit) stats.hit = (stats.hit || 0) + data.hit;

                // NOTE: atkBonus and defPenalty are applied AFTER recalculating stats from attributes
                // They are stored in multipliers for now
                if (data.atkBonus !== undefined) {
                    damageDealtMult *= (1 + data.atkBonus); // Store multiplier for later application
                }
                if (data.defPenalty !== undefined) {
                    // defPenalty is negative, so we add it (e.g., -0.5 means 50% reduction)
                    damageTakenMult *= (1 + data.defPenalty);
                }
                if (data.flee !== undefined) stats.flee = (stats.flee || 0) + data.flee;
                if (data.aspd !== undefined) stats.aspd = (stats.aspd || 0) + data.aspd;

                // Multipliers
                if (data.damageDealt) damageDealtMult *= data.damageDealt;
                if (data.damageTaken) damageTakenMult *= data.damageTaken;
                if (data.critBonus) critBonus += data.critBonus;
                if (data.parryChance !== undefined) parryChance = Math.max(parryChance, data.parryChance);
                if (data.tauntChance !== undefined) tauntChance = Math.max(tauntChance, data.tauntChance);
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
                if (data.aspd !== undefined) stats.aspd = (stats.aspd || 0) + data.aspd; // Already negative
                if (data.flee !== undefined) stats.flee = (stats.flee || 0) + data.flee; // Already negative
            });
        }

        // Recalculate derived stats from modified attributes (simplified)
        const recalculated = this.calculateStatsFromAttributes(entity.level || entity.baseLevel || 1, attributes);

        // Merge recalculated stats with direct buffs
        // ATK/MATK: preserve buff multipliers while updating base from attributes
        stats.atk = recalculated.atk + ((stats.atk || 0) - baseStats.atk);
        stats.matk = recalculated.matk + ((stats.matk || 0) - baseStats.matk);

        // DEF/MDEF: preserve base values, apply any buffs/debuffs (if they modify def directly)
        stats.def = recalculated.softDef; // Always use recalculated def from attributes
        stats.hardDef = recalculated.hardDef;
        stats.mdef = recalculated.mdef;

        // Other stats
        stats.hit = recalculated.hit + ((stats.hit || 0) - baseStats.hit);
        stats.flee = recalculated.flee + ((stats.flee || 0) - baseStats.flee);
        stats.aspd = recalculated.aspd + ((stats.aspd || 0) - baseStats.aspd);

        // Apply percentage-based bonuses AFTER recalculating stats (Berserk Mode atkBonus)
        // This ensures the multiplier is applied to the final calculated ATK
        if (entity.activeBuffs) {
            entity.activeBuffs.forEach(buff => {
                const data = buff.data;
                if (data.atkBonus !== undefined) {
                    // Apply atkBonus to the final ATK stat
                    stats.atk = Math.floor(stats.atk * (1 + data.atkBonus));
                }
            });
        }

        // Store buffed stats
        entity.stats = stats;
        entity.maxHp = recalculated.maxHp;
        entity.maxMana = recalculated.maxMana;
        entity.maxSp = entity.maxSp || entity.maxMana; // SP = Mana in tactical system
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
        if (entity.sp === undefined || entity.sp === null || isNaN(entity.sp)) {
            entity.sp = entity.maxSp || entity.maxMana || 0;
        }

        // Ensure HP/MP don't exceed max
        if (entity.hp > entity.maxHp) entity.hp = entity.maxHp;
        if (entity.sp > entity.maxSp) entity.sp = entity.maxSp;
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
     * Get all active buffs/debuffs for UI display
     * @param {Object} entity
     * @returns {Array} List of active buffs/debuffs with display info
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

        if (entity.statusEffects) {
            entity.statusEffects.forEach(status => {
                buffs.push({
                    type: 'status',
                    duration: status.duration,
                    data: { id: status.id }
                });
            });
        }

        return buffs;
    }
}

// Export for use in map-engine.js
window.TacticalSkillEngine = TacticalSkillEngine;

