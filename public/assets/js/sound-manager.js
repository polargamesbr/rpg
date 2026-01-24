/**
 * Sound Manager - Data-driven audio system
 * 
 * Uses entity.sounds data from PHP entity sheets to play appropriate sounds
 * instead of hardcoded entity-specific functions.
 * 
 * Entity sounds structure (from PHP):
 * {
 *   weapon: 'sword' | 'bow' | 'staff' | 'claw' | 'whip',
 *   hit: ['sword1', 'sword2', ...],
 *   skill_start: ['skill_start1', ...],
 *   death: ['hero_death'],
 *   attack_prepare: ['sword1', ...],
 *   crit: ['critical'],
 *   buff_apply: ['buff_apply1', ...],
 *   debuff_apply: ['debuff_apply']
 * }
 */

class SoundManager {
    static sfxCache = {};
    static enabled = true;
    static volume = 0.5;

    /**
     * Initialize sound settings from localStorage
     */
    static init() {
        if (typeof localStorage !== 'undefined') {
            if (localStorage.getItem('rpg_audio_sfx') !== null) {
                this.enabled = localStorage.getItem('rpg_audio_sfx') === 'true';
            }
        }
    }

    /**
     * Pick random item from array
     */
    static pickRandom(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Get entity sounds - tries entity.sounds first, then TacticalDataLoader.entityCache
     * @param {Object} entity - Entity object
     * @returns {Object} Sounds configuration
     */
    static getEntitySounds(entity) {
        if (!entity) return {};

        // Direct sounds on entity
        if (entity.sounds && Object.keys(entity.sounds).length > 0) {
            return entity.sounds;
        }

        // Lookup from TacticalDataLoader.entityCache by combatKey
        const combatKey = entity.combatKey || entity.combat_key;
        if (combatKey && window.TacticalDataLoader?.entityCache) {
            const cached = window.TacticalDataLoader.entityCache[combatKey];
            if (cached?.sounds) {
                return cached.sounds;
            }
        }

        // Fallback: empty object (will use weapon-based fallbacks)
        return {};
    }

    /**
     * Normalize filename to have .mp3 extension
     */
    static normalizeFilename(fileName) {
        if (!fileName) return null;
        return fileName.endsWith('.mp3') ? fileName : fileName + '.mp3';
    }

    /**
     * Play a sound effect from global mp3 folder
     * @param {string} fileName - Sound file name
     * @param {number} volume - Volume (0-1)
     * @param {number} rate - Playback rate
     */
    static playSfx(fileName, volume = 0.45, rate = 1.0) {
        if (!fileName || !this.enabled) return null;

        const src = `/public/assets/mp3/${fileName}`;

        if (!this.sfxCache[src]) {
            const audio = new Audio(src);
            audio.preload = 'auto';
            this.sfxCache[src] = audio;
        }

        const audio = this.sfxCache[src].cloneNode();
        audio.volume = volume;
        audio.playbackRate = rate;
        audio.play().catch(() => { });
        return audio;
    }

    /**
     * Play a sound effect from entity's sounds folder with fallback to global mp3
     * @param {string} entityId - Entity ID for path resolution
     * @param {string} fileName - Sound file name
     * @param {number} volume - Volume (0-1)
     * @param {number} rate - Playback rate
     */
    static playSfxEntity(entityId, fileName, volume = 0.45, rate = 1.0) {
        const base = this.normalizeFilename(fileName);
        if (!base) return;

        if (!entityId) {
            this.playSfx(base, volume, rate);
            return;
        }

        const entityPath = `/public/assets/entities/${entityId}/sounds/${base}`;
        const audio = new Audio(entityPath);
        audio.volume = volume;
        audio.playbackRate = rate;
        audio.onerror = () => { this.playSfx(base, volume, rate); };
        audio.play().catch(() => { });
    }

    /**
     * Play weapon attack sound based on entity.sounds.weapon or entity.sounds.hit
     * @param {Object} entity - Entity with sounds data
     * @param {boolean} isCrit - Whether this is a critical hit
     */
    static playWeaponSound(entity, isCrit = false) {
        if (!entity) return;

        const entityId = entity.entity_id || entity.combatKey;
        const sounds = this.getEntitySounds(entity);

        // Try to get hit sounds from entity data
        let hitSounds = sounds.hit;

        // If no hit sounds defined, use weapon type to determine fallback
        if (!hitSounds || hitSounds.length === 0) {
            hitSounds = this.getWeaponHitSounds(sounds.weapon);
        }

        // Pick random hit sound
        const hit = this.pickRandom(hitSounds);
        if (hit) {
            this.playSfxEntity(entityId, hit, 0.5, 1.0);
        }

        // Play hit impact after delay
        setTimeout(() => this.playHitImpact(isCrit), this.getWeaponDelay(sounds.weapon));
    }

    /**
     * Get default hit sounds based on weapon type
     */
    static getWeaponHitSounds(weaponType) {
        const weaponSounds = {
            'sword': ['sword1', 'sword2', 'sword3', 'sword4'],
            'bow': ['bow1', 'bow2', 'bow3'],
            'staff': ['staff_hit', 'staff_hit2', 'staff_hit3'],
            'claw': ['wolf_claw_hit1', 'wolf_claw_hit2', 'wolf_claw_hit3', 'wolf_claw_hit4'],
            'whip': ['whip', 'staff_hit', 'staff_hit2'],
            'slime': ['slime']
        };
        return weaponSounds[weaponType] || ['hit1', 'hit2', 'hit3'];
    }

    /**
     * Get impact delay based on weapon type
     */
    static getWeaponDelay(weaponType) {
        const delays = {
            'sword': 80,
            'bow': 100,
            'staff': 80,
            'claw': 40,
            'slime': 60,
            'whip': 60
        };
        return delays[weaponType] || 80;
    }

    /**
     * Play generic hit impact sound
     * @param {boolean} isCrit - Whether this is a critical hit
     */
    static playHitImpact(isCrit = false) {
        const hit = this.pickRandom(['hit1.mp3', 'hit2.mp3', 'hit3.mp3', 'impact.mp3']);
        this.playSfx(hit, 0.55, 1.0);
        if (isCrit) {
            setTimeout(() => this.playSfx('critical.mp3', 0.6, 1.0), 50);
        }
    }

    /**
     * Play skill start/cast sound based on entity.sounds.skill_start
     * @param {Object} entity - Entity casting the skill
     * @param {Object} skill - Skill being cast (may have its own sound)
     */
    static playSkillSound(entity, skill = null) {
        const entityId = entity?.entity_id || entity?.combatKey;
        const sounds = this.getEntitySounds(entity);

        // Check if skill has its own sound defined
        if (skill?.sound) {
            this.playSfxEntity(entityId, skill.sound, 0.5, 1.0);
            return;
        }

        // Check for skill-specific sound file (entities/{id}/sounds/{skill_id}.mp3)
        if (skill?.id && entityId) {
            const skillSoundPath = `/public/assets/entities/${entityId}/sounds/${skill.id}.mp3`;
            const audio = new Audio(skillSoundPath);
            audio.volume = 0.7;
            let fallbackCalled = false;
            audio.onerror = () => {
                if (!fallbackCalled) {
                    fallbackCalled = true;
                    this.playSkillStartFallback(entity, skill);
                }
            };
            audio.play().catch(() => {
                if (!fallbackCalled) {
                    fallbackCalled = true;
                    this.playSkillStartFallback(entity, skill);
                }
            });
            return;
        }

        this.playSkillStartFallback(entity, skill);
    }

    /**
     * Fallback for skill start sounds when no skill-specific sound exists
     */
    static playSkillStartFallback(entity, skill) {
        const entityId = entity?.entity_id || entity?.combatKey;
        const sounds = this.getEntitySounds(entity);

        // Use entity's skill_start sounds
        if (sounds.skill_start && sounds.skill_start.length > 0) {
            const sfx = this.pickRandom(sounds.skill_start);
            this.playSfxEntity(entityId, sfx, 0.5, 1.0);
            return;
        }

        // Generic fallback
        const generic = this.pickRandom(['skill_start1.mp3', 'skill_start2.mp3', 'skill_start3.mp3']);
        this.playSfx(generic, 0.45, 1.0);
    }

    /**
     * Play buff application sound
     * @param {Object} entity - Entity receiving the buff (optional, for entity-specific sounds)
     */
    static playBuffApply(entity = null) {
        const sounds = this.getEntitySounds(entity);

        if (sounds.buff_apply && sounds.buff_apply.length > 0) {
            const sfx = this.pickRandom(sounds.buff_apply);
            const entityId = entity?.entity_id || entity?.combatKey;
            this.playSfxEntity(entityId, sfx, 0.5, 1.0);
            return;
        }

        // Generic fallback
        const sfx = this.pickRandom(['buff_apply1.mp3', 'buff_apply2.mp3', 'buff_apply3.mp3']);
        this.playSfx(sfx, 0.5, 1.0);
    }

    /**
     * Play debuff application sound
     * @param {Object} entity - Entity receiving the debuff (optional)
     */
    static playDebuffApply(entity = null) {
        const sounds = this.getEntitySounds(entity);

        if (sounds.debuff_apply && sounds.debuff_apply.length > 0) {
            const sfx = this.pickRandom(sounds.debuff_apply);
            const entityId = entity?.entity_id || entity?.combatKey;
            this.playSfxEntity(entityId, sfx, 0.5, 1.0);
            return;
        }

        this.playSfx('debuff_apply.mp3', 0.5, 1.0);
    }

    /**
     * Play death sound for entity
     * @param {Object} entity - Entity that died
     */
    static playDeath(entity) {
        const entityId = entity?.entity_id || entity?.combatKey;
        const sounds = this.getEntitySounds(entity);

        if (sounds.death && sounds.death.length > 0) {
            const sfx = this.pickRandom(sounds.death);
            this.playSfxEntity(entityId, sfx, 0.6, 1.0);
            return;
        }

        // Fallback based on entity type
        if (entity?.type === 'enemy') {
            const sfx = this.pickRandom(['monster_death1.mp3', 'monster_death2.mp3']);
            this.playSfx(sfx, 0.6, 1.0);
        } else {
            this.playSfx('hero_death.mp3', 0.6, 1.0);
        }
    }

    /**
     * Play damage taken sound
     * @param {Object} entity - Entity that took damage
     */
    static playDamageTaken(entity) {
        const entityId = entity?.entity_id || entity?.combatKey;
        const sounds = this.getEntitySounds(entity);

        if (sounds.damage_taken && sounds.damage_taken.length > 0) {
            const sfx = this.pickRandom(sounds.damage_taken);
            this.playSfxEntity(entityId, sfx, 0.5, 1.0);
            return;
        }

        // Generic fallback (many entities don't have this)
        // Just play hit impact
        this.playHitImpact(false);
    }

    /**
     * Enable or disable sound effects
     * @param {boolean} enabled
     */
    static setEnabled(enabled) {
        this.enabled = enabled;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('rpg_audio_sfx', enabled.toString());
        }
    }

    /**
     * Check if sound effects are enabled
     * @returns {boolean}
     */
    static isEnabled() {
        return this.enabled;
    }
}

// Initialize on load
SoundManager.init();

// Export for use in map-engine.js
window.SoundManager = SoundManager;
