/**
 * EquipmentManager
 * Handles logic for equipping items, validating restrictions, and calculating final combat stats.
 */
window.EquipmentManager = {
    /**
     * Checks if an entity can equip a specific item.
     * @param {Object} entity - The character/monster entity.
     * @param {Object} item - The item definition from itemsData.
     * @returns {Object} { can: boolean, reason: string }
     */
    canEquip(entity, item) {
        if (!entity || !item) return { can: false, reason: 'Invalid entity or item' };
        if (item.type !== 'Equipment') return { can: false, reason: 'Item is not equipment' };

        // Class restriction
        if (item.requiredClass && item.requiredClass.length > 0) {
            const entityClass = entity.id || entity.class;
            const matchesClass = item.requiredClass.some(c => c === entityClass || c === entity.role);
            if (!matchesClass) {
                return { can: false, reason: `Class restriction: requires ${item.requiredClass.join(', ')}` };
            }
        }

        // Level Requirement restriction
        if (item.requiredLevel) {
            const entityLevel = entity.level || 1;
            // Check for debug override (assuming combatSystem.state.debugMode exists)
            const isDebug = window.combatSystem && window.combatSystem.state && window.combatSystem.state.debugMode;

            if (entityLevel < item.requiredLevel && !isDebug) {
                return { can: false, reason: `Level too low: requires Level ${item.requiredLevel}` };
            }
        }

        // Entity type restriction (if any)
        if (item.entityType && item.entityType !== entity.type) {
            return { can: false, reason: `Type restriction: requires ${item.entityType}` };
        }

        return { can: true };
    },

    /**
     * Equips an item to an entity's slot.
     * @param {Object} entity - The entity object.
     * @param {string} itemId - The ID of the item in itemsData.
     * @param {string} slot - The target slot (head, body, etc.).
     */
    equipItem(entity, itemId, slot) {
        const item = window.itemsData[itemId];
        if (!item) return false;

        const validation = this.canEquip(entity, item);
        if (!validation.can) {
            console.warn(`Cannot equip ${itemId}: ${validation.reason}`);
            return false;
        }

        if (!entity.equipment) entity.equipment = {};

        // Handle 2-Handed logic
        if (item.isTwoHanded) {
            // Remove items from both hands
            entity.equipment.left_hand = null;
            entity.equipment.right_hand = null;
            // Place in right_hand (or dedicated slot, but user mentioned Left/Right)
            entity.equipment.right_hand = itemId;
        } else {
            // If equipping to a hand, check if currently holding a 2H weapon
            if (slot === 'left_hand' || slot === 'right_hand') {
                const currentRight = entity.equipment.right_hand ? window.itemsData[entity.equipment.right_hand] : null;
                if (currentRight && currentRight.isTwoHanded) {
                    entity.equipment.right_hand = null;
                }
            }
            entity.equipment[slot] = itemId;
        }

        // Re-calculate stats
        this.applyEquipmentStats(entity);
        return true;
    },

    /**
     * Calculates and applies final stats to an entity based on equipment and sets.
     * @param {Object} entity - The entity to update.
     */
    applyEquipmentStats(entity) {
        if (!entity.canEquip) return;

        // Ensure baseAttributes snapshot exists
        if (!entity.baseAttributes) {
            entity.baseAttributes = JSON.parse(JSON.stringify(entity.attributes || {}));
        }

        const equipAttributes = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
        const extraStats = { atk: 0, matk: 0, defense: 0, hit: 0, flee: 0, crit: 0 };

        // Track set counts
        const setCounts = {};
        entity.activeSetBonuses = []; // Reset active sets

        // Aggregate all equipment bonuses
        if (entity.equipment) {
            Object.values(entity.equipment).forEach(itemId => {
                if (!itemId) return;
                const item = window.itemsData[itemId];
                if (!item) return;

                // Stats
                if (item.stats) {
                    for (const [key, value] of Object.entries(item.stats)) {
                        if (equipAttributes[key] !== undefined) {
                            equipAttributes[key] += value;
                        } else if (extraStats[key] !== undefined) {
                            extraStats[key] += value;
                        }
                    }
                }

                // Sets
                if (item.set) {
                    setCounts[item.set] = (setCounts[item.set] || 0) + 1;
                }
            });
        }

        // Apply Set Bonuses
        Object.entries(setCounts).forEach(([setId, count]) => {
            const setData = window.setItemData[setId];
            if (!setData || !setData.bonuses) return;

            setData.bonuses.forEach(bonus => {
                if (count >= bonus.count) {
                    // Record active bonus for UI
                    entity.activeSetBonuses.push({
                        setName: setData.name,
                        bonusDesc: bonus.desc,
                        count: bonus.count,
                        stats: bonus.stats
                    });

                    // Apply stats
                    for (const [key, value] of Object.entries(bonus.stats)) {
                        if (key === 'all_stats') {
                            Object.keys(equipAttributes).forEach(attr => equipAttributes[attr] += value);
                        } else if (equipAttributes[key] !== undefined) {
                            equipAttributes[key] += value;
                        } else if (extraStats[key] !== undefined) {
                            extraStats[key] += value;
                        }
                    }
                }
            });
        });

        // Store equipment bonuses separately for SkillEngine to pick up
        entity.equipmentAttributes = equipAttributes;
        entity.equipmentStats = extraStats;

        // Force a recalculation via SkillEngine if available
        if (window.SkillEngine) {
            window.SkillEngine.recalculateStats(entity);
        } else {
            // Fallback: manually update if SkillEngine isn't loaded yet
            const base = entity.baseAttributes;
            const updated = { ...base };
            Object.keys(equipAttributes).forEach(k => updated[k] += equipAttributes[k]);
            entity.attributes = updated;
        }
    },

    /**
     * Gets the current attack element for an entity based on their equipment.
     * @param {Object} entity 
     * @returns {string} The element name (e.g., 'fire', 'neutral')
     */
    getAttackElement(entity) {
        if (!entity.equipment || !entity.equipment.right_hand) return entity.element || 'neutral';

        const weapon = window.itemsData[entity.equipment.right_hand];
        if (weapon && weapon.elementOverride) {
            return weapon.elementOverride;
        }

        return entity.element || 'neutral';
    }
};
