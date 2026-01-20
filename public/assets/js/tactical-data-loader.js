/**
 * Tactical Data Loader
 * Loads entities and skills from PHP API with local caching
 * Replaces dependency on combat-data.js for the tactical system
 */

window.TacticalDataLoader = (function() {
    'use strict';

    // Cache stores
    const entityCache = {};
    const skillCache = {};
    
    // Pending requests to avoid duplicate API calls
    const pendingEntityRequests = {};
    const pendingSkillRequests = {};

    /**
     * Load entities by IDs in batch
     * @param {string[]} ids - Array of entity IDs
     * @returns {Promise<Object>} Promise resolving to object with entities keyed by ID
     */
    async function loadEntities(ids) {
        if (!ids || ids.length === 0) {
            return {};
        }

        // Filter out already cached entities
        const uncachedIds = ids.filter(id => !entityCache[id]);
        
        if (uncachedIds.length === 0) {
            // All entities already in cache
            const result = {};
            ids.forEach(id => {
                if (entityCache[id]) {
                    result[id] = entityCache[id];
                }
            });
            return result;
        }

        // Check if there's already a pending request for these IDs
        const cacheKey = uncachedIds.sort().join(',');
        if (pendingEntityRequests[cacheKey]) {
            // Wait for existing request
            return pendingEntityRequests[cacheKey];
        }

        // Create new request
        const requestPromise = fetch(`/game/api/entities?ids=${encodeURIComponent(uncachedIds.join(','))}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load entities: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const entities = data.entities || {};
                
                // Store in cache (by request key and by sheet.id for entity_id lookup)
                Object.keys(entities).forEach(key => {
                    const sheet = entities[key];
                    entityCache[key] = sheet;
                    if (sheet && sheet.id) {
                        entityCache[sheet.id] = sheet;
                    }
                });
                
                // Remove from pending requests
                delete pendingEntityRequests[cacheKey];
                
                // Return all requested entities (cached + newly loaded)
                const result = {};
                ids.forEach(id => {
                    if (entityCache[id]) {
                        result[id] = entityCache[id];
                    }
                });
                
                return result;
            })
            .catch(error => {
                console.error('[TacticalDataLoader] Error loading entities:', error);
                delete pendingEntityRequests[cacheKey];
                throw error;
            });

        // Store pending request
        pendingEntityRequests[cacheKey] = requestPromise;
        
        return requestPromise;
    }

    /**
     * Get a single entity by ID (with caching)
     * @param {string} id - Entity ID
     * @returns {Promise<Object|null>} Promise resolving to entity object or null
     */
    async function getEntity(id) {
        if (!id) return null;

        // Check cache first
        if (entityCache[id]) {
            return entityCache[id];
        }

        // Load entity
        const entities = await loadEntities([id]);
        return entities[id] || null;
    }

    /**
     * Load skills by IDs in batch
     * @param {string[]} ids - Array of skill IDs
     * @returns {Promise<Object>} Promise resolving to object with skills keyed by ID
     */
    async function loadSkills(ids) {
        if (!ids || ids.length === 0) {
            return {};
        }

        // Ensure all IDs are strings (handle case where objects are passed)
        const stringIds = ids.map(id => {
            if (typeof id === 'string') {
                return id;
            } else if (typeof id === 'object' && id !== null && id.id) {
                // If object passed, extract id property
                return String(id.id);
            } else {
                // Try to convert to string
                return String(id);
            }
        }).filter(id => id && id !== 'undefined' && id !== 'null');

        if (stringIds.length === 0) {
            console.warn('[TacticalDataLoader] No valid skill IDs provided:', ids);
            return {};
        }

        // Filter out already cached skills
        const uncachedIds = stringIds.filter(id => !skillCache[id]);
        
        if (uncachedIds.length === 0) {
            // All skills already in cache
            const result = {};
            stringIds.forEach(id => {
                if (skillCache[id]) {
                    result[id] = skillCache[id];
                }
            });
            return result;
        }

        // Check if there's already a pending request for these IDs
        const cacheKey = uncachedIds.sort().join(',');
        if (pendingSkillRequests[cacheKey]) {
            // Wait for existing request
            return pendingSkillRequests[cacheKey];
        }

        // Create new request
        const requestPromise = fetch(`/game/api/skills?ids=${encodeURIComponent(uncachedIds.join(','))}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load skills: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const skills = data.skills || {};
                
                // Store in cache
                Object.keys(skills).forEach(id => {
                    skillCache[id] = skills[id];
                });
                
                // Remove from pending requests
                delete pendingSkillRequests[cacheKey];
                
                // Return all requested skills (cached + newly loaded)
                const result = {};
                stringIds.forEach(id => {
                    if (skillCache[id]) {
                        result[id] = skillCache[id];
                    }
                });
                
                return result;
            })
            .catch(error => {
                console.error('[TacticalDataLoader] Error loading skills:', error);
                delete pendingSkillRequests[cacheKey];
                throw error;
            });

        // Store pending request
        pendingSkillRequests[cacheKey] = requestPromise;
        
        return requestPromise;
    }

    /**
     * Get a single skill by ID (with caching)
     * @param {string} id - Skill ID
     * @returns {Promise<Object|null>} Promise resolving to skill object or null
     */
    async function getSkill(id) {
        if (!id) return null;

        // Check cache first
        if (skillCache[id]) {
            return skillCache[id];
        }

        // Load skill
        const skills = await loadSkills([id]);
        return skills[id] || null;
    }

    /**
     * Clear entity cache (useful for testing or forced refresh)
     */
    function clearEntityCache() {
        Object.keys(entityCache).forEach(key => delete entityCache[key]);
    }

    /**
     * Clear skill cache (useful for testing or forced refresh)
     */
    function clearSkillCache() {
        Object.keys(skillCache).forEach(key => delete skillCache[key]);
    }

    /**
     * Clear all caches
     */
    function clearAllCaches() {
        clearEntityCache();
        clearSkillCache();
    }

    // Public API
    return {
        loadEntities,
        getEntity,
        loadSkills,
        getSkill,
        clearEntityCache,
        clearSkillCache,
        clearAllCaches,
        // Expose caches for direct access (used in map-engine.js for synchronous access)
        get entityCache() {
            return entityCache;
        },
        get skillCache() {
            return skillCache;
        }
    };
})();
