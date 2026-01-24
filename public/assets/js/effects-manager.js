/**
 * Effects Manager - Data-driven visual effects system
 * 
 * Uses entity data from PHP entity sheets to play appropriate visual effects
 * instead of hardcoded entity-specific checks (isWarrior, isArcher, etc.)
 * 
 * Entity structure used:
 * {
 *   class: 'warrior' | 'archer' | 'mage' | 'support' | etc.,
 *   role: 'Warrior' | 'Ranged' | 'Mage' | 'Support' | 'Monster',
 *   element: 'neutral' | 'fire' | 'ice' | 'holy' | 'dark' | etc.,
 *   sounds: { weapon: 'sword' | 'bow' | 'staff' | 'claw' | etc. }
 * }
 */

class EffectsManager {

    /**
     * Determine entity effect type based on its properties
     * Uses entity.role, entity.class, entity.sounds.weapon to infer type
     * @param {Object} entity - Entity object
     * @returns {string} Effect type: 'melee', 'ranged', 'magic', 'holy', 'monster'
     */
    static getEntityEffectType(entity) {
        if (!entity) return 'melee';

        // Try to get full entity data from cache
        const entityData = this.getFullEntityData(entity);

        // Check role first (most reliable)
        const role = (entityData.role || entity.role || '').toLowerCase();
        if (role === 'warrior' || role === 'tank') return 'melee';
        if (role === 'ranged' || role === 'archer') return 'ranged';
        if (role === 'mage' || role === 'caster') return 'magic';
        if (role === 'support' || role === 'healer') return 'holy';
        if (role === 'monster') return 'monster';
        if (role === 'summoner') return 'magic';

        // Check class
        const cls = (entityData.class || entity.class || '').toLowerCase();
        if (cls === 'warrior' || cls === 'swordsman' || cls === 'swordman' || cls === 'knight' || cls === 'tank') return 'melee';
        if (cls === 'archer' || cls === 'ranged' || cls === 'ranger' || cls === 'hunter') return 'ranged';
        if (cls === 'mage' || cls === 'wizard' || cls === 'caster' || cls === 'sorcerer') return 'magic';
        if (cls === 'acolyte' || cls === 'priest' || cls === 'cleric' || cls === 'support') return 'holy';
        if (cls === 'summoner' || cls === 'tamer') return 'magic';

        // Check weapon type from sounds
        const weapon = (entityData.sounds?.weapon || entity.sounds?.weapon || '').toLowerCase();
        if (weapon === 'sword' || weapon === 'axe' || weapon === 'claw' || weapon === 'whip') return 'melee';
        if (weapon === 'bow' || weapon === 'crossbow' || weapon === 'gun') return 'ranged';
        if (weapon === 'staff' || weapon === 'wand' || weapon === 'tome') return 'magic';

        // Check element
        const element = (entityData.element || entity.element || '').toLowerCase();
        if (element === 'holy' || element === 'light' || element === 'divine') return 'holy';
        if (element === 'fire' || element === 'ice' || element === 'lightning' || element === 'dark') return 'magic';

        // Check entity type
        const type = (entity.type || '').toLowerCase();
        if (type === 'enemy' || type === 'monster') return 'monster';

        // Default to melee (safe for most cases)
        return 'melee';
    }

    /**
     * Get full entity data from TacticalDataLoader.entityCache
     * @param {Object} entity - Entity object
     * @returns {Object} Full entity data or empty object
     */
    static getFullEntityData(entity) {
        if (!entity) return {};

        const combatKey = entity.combatKey || entity.combat_key;
        if (combatKey && window.TacticalDataLoader?.entityCache) {
            const cached = window.TacticalDataLoader.entityCache[combatKey];
            if (cached) return cached;
        }

        return entity;
    }

    /**
     * Get element color for magic effects
     * @param {Object} entity - Entity object
     * @returns {string} CSS color
     */
    static getElementColor(entity) {
        const entityData = this.getFullEntityData(entity);
        const element = (entityData.element || entity.element || 'neutral').toLowerCase();

        const colors = {
            'fire': '#ef4444',
            'ice': '#60a5fa',
            'water': '#3b82f6',
            'lightning': '#fbbf24',
            'thunder': '#f59e0b',
            'holy': '#fef3c7',
            'light': '#fef3c7',
            'divine': '#fcd34d',
            'dark': '#6b21a8',
            'shadow': '#581c87',
            'poison': '#22c55e',
            'nature': '#4ade80',
            'earth': '#a3e635',
            'wind': '#a5b4fc',
            'neutral': '#a855f7'
        };

        return colors[element] || '#a855f7';
    }

    /**
     * Play attack visual effect based on entity type
     * Maintains all existing functionality but data-driven
     * @param {Object} attacker - Attacking entity
     * @param {number} targetX - Target pixel X coordinate
     * @param {number} targetY - Target pixel Y coordinate
     * @param {boolean} isCrit - Is critical hit
     */
    static playAttackEffect(attacker, targetX, targetY, isCrit = false) {
        const effectType = this.getEntityEffectType(attacker);

        switch (effectType) {
            case 'melee':
            case 'monster':
                // Slash effect for melee/monsters
                if (typeof spawnSwordSlashEffect === 'function') {
                    spawnSwordSlashEffect(targetX, targetY);
                } else if (window.MapSFX?.spawnSlashEffect) {
                    window.MapSFX.spawnSlashEffect(targetX, targetY);
                }
                break;

            case 'ranged':
                // Arrow impact for archers
                if (window.MapSFX?.archerQuickShotImpact) {
                    window.MapSFX.archerQuickShotImpact(targetX, targetY);
                } else if (window.MapSFX?.spawnImpactBurst) {
                    window.MapSFX.spawnImpactBurst(targetX, targetY, '#fbbf24', 1);
                }
                break;

            case 'magic':
                // Magic aura effect
                if (typeof spawnMagicEffect === 'function') {
                    const color = this.getElementColor(attacker);
                    spawnMagicEffect(targetX, targetY, color);
                } else if (window.MapSFX?.spawnMagicEffect) {
                    const color = this.getElementColor(attacker);
                    window.MapSFX.spawnMagicEffect(targetX, targetY, color);
                }
                break;

            case 'holy':
                // Holy/support effect (golden/white)
                if (typeof spawnMagicEffect === 'function') {
                    spawnMagicEffect(targetX, targetY, '#fef3c7');
                } else if (window.MapSFX?.spawnMagicEffect) {
                    window.MapSFX.spawnMagicEffect(targetX, targetY, '#fef3c7');
                }
                break;

            default:
                // Fallback: generic impact
                if (typeof spawnImpactBurst === 'function') {
                    spawnImpactBurst(targetX, targetY, isCrit ? '#fbbf24' : '#ef4444', isCrit ? 1.5 : 1);
                } else if (window.MapSFX?.spawnImpactBurst) {
                    window.MapSFX.spawnImpactBurst(targetX, targetY, isCrit ? '#fbbf24' : '#ef4444', isCrit ? 1.5 : 1);
                }
        }
    }

    /**
     * Play skill visual effect based on skill type
     * Uses skill properties (gridVisual, type, element) to determine effect
     * @param {Object} caster - Entity casting the skill
     * @param {Object} skill - Skill being used
     * @param {number} targetX - Target pixel X
     * @param {number} targetY - Target pixel Y
     * @param {boolean} isPhysical - Is physical skill
     * @param {boolean} isMagic - Is magic skill
     */
    static playSkillEffect(caster, skill, targetX, targetY, isPhysical = false, isMagic = false) {
        const skillId = skill?.id || '';

        // First check for skill-specific effects in MapSFX
        if (window.MapSFX) {
            // Skill-specific effects (preserved from original code)
            if (skillId === 'holy_bolt' && window.MapSFX.spawnDivineJudgment) {
                window.MapSFX.spawnDivineJudgment(targetX, targetY, 1);
                return true;
            }
            if (skillId === 'supernova' && window.MapSFX.spawnSupernova) {
                window.MapSFX.spawnSupernova(targetX, targetY, 1);
                return true;
            }
            if (skillId === 'quick_shot' && window.MapSFX.spawnImpactBurst) {
                window.MapSFX.spawnImpactBurst(targetX, targetY, '#fbbf24');
                return true;
            }
            if (skillId === 'poison_arrow' && window.MapSFX.spawnPoisonCloud) {
                window.MapSFX.spawnPoisonCloud(targetX, targetY, 1);
                return true;
            }
            if (skillId === 'deadly_aim' && window.MapSFX.spawnNovaExplosion) {
                window.MapSFX.spawnNovaExplosion(targetX, targetY, 1);
                return true;
            }
        }

        // Generic effect based on skill type
        const skillType = (skill?.type || '').toLowerCase();
        const skillElement = skill?.element || caster?.element || 'neutral';

        if (skillType === 'heal' || skillType === 'aoe_heal') {
            if (typeof spawnHealEffect === 'function') {
                spawnHealEffect(targetX, targetY);
            } else if (window.MapSFX?.spawnHealEffect) {
                window.MapSFX.spawnHealEffect(targetX, targetY);
            }
            return true;
        }

        if (isMagic || skillType === 'aoe' || skillType === 'line') {
            const color = this.getSkillElementColor(skill) || this.getElementColor(caster);
            if (typeof spawnMagicEffect === 'function') {
                spawnMagicEffect(targetX, targetY, color);
            } else if (window.MapSFX?.spawnMagicEffect) {
                window.MapSFX.spawnMagicEffect(targetX, targetY, color);
            }
            return true;
        }

        if (isPhysical) {
            if (typeof spawnSwordSlashEffect === 'function') {
                spawnSwordSlashEffect(targetX, targetY);
            } else if (window.MapSFX?.spawnSlashEffect) {
                window.MapSFX.spawnSlashEffect(targetX, targetY);
            }
            return true;
        }

        // Fallback: generic impact
        if (typeof spawnImpactBurst === 'function') {
            spawnImpactBurst(targetX, targetY, '#ef4444', 1);
        } else if (window.MapSFX?.spawnImpactBurst) {
            window.MapSFX.spawnImpactBurst(targetX, targetY, '#ef4444', 1);
        }

        return false;
    }

    /**
     * Play skill cast/startup effect
     * @param {Object} caster - Entity casting the skill
     * @param {Object} skill - Skill being cast
     * @param {number} x - Caster pixel X
     * @param {number} y - Caster pixel Y
     */
    static playCastEffect(caster, skill, x, y) {
        const skillId = skill?.id || '';
        const entityId = caster?.entity_id || caster?.combatKey || '';

        // 1. Archer-specific cast effects (from original map-engine code)
        if (window.MapSFX) {
            const castEffects = {
                'quick_shot': 'archerQuickShotCast',
                'poison_arrow': 'archerPoisonArrowCast',
                'focused_shot': 'archerFocusedShotCast',
                'piercing_arrow': 'archerPiercingArrowCast',
                'multishot': 'archerMultishotCast',
                'hunters_focus': 'archerHuntersFocusCast',
                'tactical_retreat': 'archerTacticalRetreatCast',
                'rain_of_arrows': 'archerRainOfArrowsCast',
                'crippling_shot': 'archerCripplingShotCast',
                'deadly_aim': 'archerDeadlyAimCast'
            };

            const effectName = castEffects[skillId];
            if (effectName && window.MapSFX[effectName]) {
                window.MapSFX[effectName](x, y);
                return;
            }
        }

        // 2. Class/Role specific generic cast effects
        const effectType = this.getEntityEffectType(caster);
        if (effectType === 'holy' || entityId === 'acolyte') {
            if (typeof spawnMagicEffect === 'function') {
                spawnMagicEffect(x, y, '#fef3c7');
            } else if (window.MapSFX?.spawnMagicEffect) {
                window.MapSFX.spawnMagicEffect(x, y, '#fef3c7');
            }
        } else if (effectType === 'magic') {
            const color = this.getElementColor(caster);
            if (typeof spawnMagicEffect === 'function') {
                spawnMagicEffect(x, y, color);
            } else if (window.MapSFX?.spawnMagicEffect) {
                window.MapSFX.spawnMagicEffect(x, y, color);
            }
        }
    }

    /**
     * Get color for skill element
     * @param {Object} skill - Skill object
     * @returns {string|null} CSS color or null
     */
    static getSkillElementColor(skill) {
        if (!skill?.element) return null;

        const colors = {
            'fire': '#ef4444',
            'ice': '#60a5fa',
            'lightning': '#fbbf24',
            'holy': '#fef3c7',
            'dark': '#6b21a8',
            'poison': '#22c55e',
            'wind': '#a5b4fc'
        };

        return colors[skill.element.toLowerCase()] || null;
    }
}

// Export for use in map-engine.js
window.EffectsManager = EffectsManager;
