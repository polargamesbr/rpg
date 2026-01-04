/**
 * Elemental System Data
 * Defines elements, their properties, and effectiveness chart
 * 
 * IMPORTANT:
 * - This file is the SINGLE source of truth for elemental interactions
 * - It is global (no bundler needed): window.elementalData
 */

window.elementalData = {
    // Element metadata for UI rendering
    elements: {
        neutral: {
            name: 'Neutral',
            icon: 'swords',
            img: null, // Can be set to custom image path
            color: '#94a3b8',
            emoji: '⚔️',
            desc: 'Physical attacks with no elemental affinity'
        },
        fire: {
            name: 'Fire',
            icon: 'flame',
            img: null,
            color: '#ef4444',
            emoji: '🔥',
            desc: 'Burns and destroys'
        },
        water: {
            name: 'Water',
            icon: 'droplets',
            img: null,
            color: '#3b82f6',
            emoji: '💧',
            desc: 'Floods and extinguishes'
        },
        earth: {
            name: 'Earth',
            icon: 'mountain',
            img: null,
            color: '#78716c',
            emoji: '🪨',
            desc: 'Solid and grounding'
        },
        wind: {
            name: 'Wind',
            icon: 'wind',
            img: null,
            color: '#06b6d4',
            emoji: '🌪️',
            desc: 'Swift and cutting'
        },
        poison: {
            name: 'Poison',
            icon: 'skull',
            img: null,
            color: '#a855f7',
            emoji: '☠️',
            desc: 'Corrupts and decays'
        },
        holy: {
            name: 'Holy',
            icon: 'sparkles',
            img: null,
            color: '#fbbf24',
            emoji: '✨',
            desc: 'Purifies and sanctifies'
        },
        shadow: {
            name: 'Shadow',
            icon: 'moon',
            img: null,
            color: '#6b21a8',
            emoji: '🌑',
            desc: 'Corrupts and conceals'
        },
        ghost: {
            name: 'Ghost',
            icon: 'ghost',
            img: null,
            color: '#cbd5e1',
            emoji: '👻',
            desc: 'Ethereal and intangible'
        },
        undead: {
            name: 'Undead',
            icon: 'skull',
            img: null,
            color: '#1e293b',
            emoji: '💀',
            desc: 'Unholy creatures'
        }
    },

    /**
     * Elemental Effectiveness Chart
     * 
     * Format: { [attackerElement]: { [defenderElement]: multiplier } }
     * 
     * Multipliers:
     * - 2.0 = Super effective (200% damage)
     * - 1.5 = Effective (150% damage)
     * - 1.0 = Neutral (100% damage)
     * - 0.5 = Not very effective (50% damage)
     * - 0.25 = Heavily resisted (25% damage)
     * - 0.0 = Immune (no damage)
     * - -1.0 = Absorbs (heals instead of damages)
     */
    chart: {
        // Neutral: Only special case is Ghost immunity
        neutral: {
            ghost: 0.0
        },

        // Fire: Strong vs Earth/Undead, Weak vs Water
        fire: {
            earth: 1.5,
            undead: 1.5,
            water: 0.5,
            fire: 0.5
        },

        // Water: Strong vs Fire, Weak vs Wind
        water: {
            fire: 1.5,
            wind: 0.5,
            water: 0.5
        },

        // Earth: Strong vs Wind, Weak vs Fire
        earth: {
            wind: 1.5,
            fire: 0.5,
            earth: 0.5
        },

        // Wind: Strong vs Water, Weak vs Earth
        wind: {
            water: 1.5,
            earth: 0.5,
            wind: 0.5
        },

        // Poison: Moderate vs Earth, Immune to Undead
        poison: {
            earth: 1.25,
            poison: 0.5,
            holy: 0.75,
            undead: 0.0
        },

        // Holy: Super effective vs Shadow/Undead, Cannot harm Holy
        holy: {
            shadow: 2.0,
            undead: 2.0,
            ghost: 1.25,
            holy: 0.0
        },

        // Shadow: Strong vs Holy/Ghost, Weak vs Shadow
        shadow: {
            holy: 1.5,
            ghost: 1.5,
            shadow: 0.5
        },

        // Ghost: Strong vs Ghost, Weak vs Holy
        ghost: {
            ghost: 1.5,
            holy: 0.5
        },

        // Undead: Weak vs Fire/Holy, Absorbs Shadow/Poison
        undead: {
            fire: 0.5,
            holy: 0.25,
            undead: 1.25,
            poison: -1.0,  // Absorbs
            shadow: -1.0   // Absorbs
        }
    },

    /**
     * Get elemental effectiveness multiplier
     * @param {string} attackerElement - Element of the attack
     * @param {string} defenderElement - Element of the defender
     * @returns {number} Damage multiplier
     */
    getMultiplier(attackerElement, defenderElement) {
        // Default to neutral if not specified
        if (!attackerElement) attackerElement = 'neutral';
        if (!defenderElement) defenderElement = 'neutral';

        // Same element = neutral (unless specified in chart)
        if (attackerElement === defenderElement && attackerElement === 'neutral') {
            return 1.0;
        }

        // Check chart for specific interaction
        const attackerChart = this.chart[attackerElement];
        if (!attackerChart) return 1.0;

        const multiplier = attackerChart[defenderElement];
        if (multiplier !== undefined) return multiplier;

        // No special interaction = neutral damage
        return 1.0;
    },

    /**
     * Get effectiveness category for UI feedback
     * @param {number} multiplier - Damage multiplier
     * @returns {string} Category: 'immune', 'absorb', 'super', 'effective', 'normal', 'weak'
     */
    getEffectivenessCategory(multiplier) {
        if (multiplier === 0) return 'immune';
        if (multiplier < 0) return 'absorb';
        if (multiplier >= 1.5) return 'super';
        if (multiplier > 1.0) return 'effective';
        if (multiplier < 0.75) return 'weak';
        return 'normal';
    }
};
