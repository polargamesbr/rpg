/**
 * Skills Data - Pure Declarative Skill Definitions
 * NO LOGIC HERE - Only configuration data
 *
 * IMPORTANT:
 * - This file is the SINGLE source of truth for skill definitions.
 * - It is global (no bundler needed): window.skillsData
 */

window.skillsData = {

    // ========================================
    // SWORDMAN SKILLS (Lv 1-12)
    // ========================================

    quick_slash: {
        id: 'quick_slash',
        name: 'Quick Slash',
        icon: 'sword',
        img: '/public/assets/icons/skills/quick_slash.png',
        mana: 5,
        dmgMult: 1.0,
        type: 'single',
        desc: 'Basic physical attack against a single target.'
    },

    guarded_strike: {
        id: 'guarded_strike',
        name: 'Guarded Strike',
        icon: 'shield',
        img: '/public/assets/icons/skills/guarded_strike.png',
        mana: 15,
        dmgMult: 1.2,
        type: 'single',
        effect: { id: 'stun', chance: 0.15, duration: 1 },
        desc: 'Moderate physical attack. 15% Stun chance.'
    },

    parry_stance: {
        id: 'parry_stance',
        name: 'Parry Stance',
        icon: 'shield',
        img: '/public/assets/icons/skills/parry_stance.png',
        mana: 15,
        dmgMult: 0,
        type: 'ally',
        buff: {
            parryChance: 0.3,
            duration: 1
        },
        desc: 'Increases parry chance to 30% for 1 turn.'
    },

    heavy_slash: {
        id: 'heavy_slash',
        name: 'Heavy Slash',
        icon: 'sword',
        img: '/public/assets/icons/skills/heavy_slash.png',
        mana: 20,
        dmgMult: 1.5,
        type: 'single',
        desc: 'Strong physical attack against a single target.'
    },

    shield_bash: {
        id: 'shield_bash',
        name: 'Shield Bash',
        icon: 'shield',
        img: '/public/assets/icons/skills/shield_bash.png',
        mana: 25,
        dmgMult: 1.3,
        type: 'single',
        effect: { id: 'stun', chance: 0.5, duration: 1 },
        desc: 'Moderate attack. 50% Stun chance.'
    },

    taunting_shout: {
        id: 'taunting_shout',
        name: 'Taunting Shout',
        icon: 'speaker',
        img: '/public/assets/icons/skills/taunting_shout.png',
        mana: 10,
        dmgMult: 0,
        type: 'self',
        buff: {
            tauntChance: 0.8,
            duration: 1
        },
        desc: 'Provokes enemies to target you (80% chance).'
    },

    cleave: {
        id: 'cleave',
        name: 'Cleave',
        icon: 'target',
        img: '/public/assets/icons/skills/cleave.png',
        mana: 30,
        dmgMult: 0.8,
        type: 'aoe',
        desc: 'Physical attack that hits all enemies.'
    },

    defensive_wall: {
        id: 'defensive_wall',
        name: 'Defensive Wall',
        icon: 'shield-check',
        img: '/public/assets/icons/skills/defensive_wall.png',
        mana: 30,
        dmgMult: 0,
        type: 'ally',
        buff: {
            damageTaken: 0.5,  // 50% damage reduction
            duration: 2
        },
        desc: 'Reduces damage taken by 50% for 2 turns.'
    },

    crushing_blow: {
        id: 'crushing_blow',
        name: 'Crushing Blow',
        icon: 'hammer',
        img: '/public/assets/icons/skills/crushing_blow.png',
        mana: 25,
        dmgMult: 1.6,
        type: 'single',
        effect: { id: 'bleed', chance: 0.3, duration: 2 },
        desc: 'Heavy attack. 30% Bleed chance.'
    },

    battle_focus: {
        id: 'battle_focus',
        name: 'Battle Focus',
        icon: 'zap',
        img: '/public/assets/icons/skills/battle_focus.png',
        mana: 40,
        dmgMult: 0,
        type: 'ally',
        buff: {
            stats: { str: 20, dex: 15 },
            damageDealt: 1.5,  // +50% damage
            duration: 3
        },
        desc: 'Increases target STR, DEX and damage dealt by 50% for 3 turns.'
    },

    relentless_strike: {
        id: 'relentless_strike',
        name: 'Relentless Strike',
        icon: 'sword',
        img: '/public/assets/icons/skills/relentless_strike.png',
        mana: 35,
        dmgMult: 0.7,
        hits: 2,
        type: 'single',
        desc: 'Powerful attack that hits the target twice.'
    },

    champions_slash: {
        id: 'champions_slash',
        name: 'Champion\'s Slash',
        icon: 'crown',
        img: '/public/assets/icons/skills/champions_slash.png',
        mana: 60,
        dmgMult: 2.2,
        type: 'single',
        effects: [
            { id: 'stun', chance: 0.4, duration: 1 },
            { id: 'bleed', chance: 0.4, duration: 2 }
        ],
        desc: 'Signature finisher. High damage + Stun/Bleed chance.'
    },

    // ========================================
    // ARCHER SKILLS (Lv 1-12)
    // ========================================

    quick_shot: {
        id: 'quick_shot',
        name: 'Quick Shot',
        icon: 'target',
        img: '/public/assets/icons/skills/quick_shot.png',
        mana: 5,
        dmgMult: 0.9,
        type: 'single',
        desc: 'Basic ranged attack. Low damage, very low cost, high accuracy.'
    },

    aimed_shot: {
        id: 'aimed_shot',
        name: 'Aimed Shot',
        icon: 'crosshair',
        img: '/public/assets/icons/skills/aimed_shot.png',
        mana: 15,
        dmgMult: 1.3,
        type: 'single',
        critBonus: 0.3,  // +30% crit chance
        desc: 'Focused ranged attack. +30% critical hit chance.'
    },

    evasive_step: {
        id: 'evasive_step',
        name: 'Evasive Step',
        icon: 'move-diagonal',
        img: '/public/assets/icons/skills/evasive_step.png',
        mana: 15,
        dmgMult: 0,
        type: 'ally',
        buff: {
            stats: { agi: 20 },
            flee: 50,
            duration: 1
        },
        desc: 'Increases AGI by 20 and dodge chance by 50 for 1 turn.'
    },

    power_shot: {
        id: 'power_shot',
        name: 'Power Shot',
        icon: 'zap',
        img: '/public/assets/icons/skills/power_shot.png',
        mana: 20,
        dmgMult: 1.5,
        type: 'single',
        defenseIgnore: 0.3,  // Ignores 30% of defense
        desc: 'Strong attack that ignores 30% of enemy defense.'
    },

    poison_arrow: {
        id: 'poison_arrow',
        name: 'Poison Arrow',
        icon: 'skull',
        img: '/public/assets/icons/skills/poison_arrow.png',
        mana: 25,
        dmgMult: 1.2,
        type: 'single',
        effect: { id: 'poison', chance: 0.7, duration: 4 },
        desc: 'Medium ranged attack with 70% poison chance.'
    },

    rapid_fire: {
        id: 'rapid_fire',
        name: 'Rapid Fire',
        icon: 'arrow-right',
        img: '/public/assets/icons/skills/rapid_fire.png',
        mana: 30,
        dmgMult: 0.6,
        hits: 2,
        type: 'single',
        desc: 'Fast attack that hits the same target twice.'
    },

    multishot: {
        id: 'multishot',
        name: 'Multishot',
        icon: 'target',
        img: '/public/assets/icons/skills/multishot.png',
        mana: 40,
        dmgMult: 0.8,
        type: 'aoe',
        desc: 'Fires arrows at all enemies.'
    },

    crippling_shot: {
        id: 'crippling_shot',
        name: 'Crippling Shot',
        icon: 'footprints',
        img: '/public/assets/icons/skills/crippling_shot.png',
        mana: 30,
        dmgMult: 1.4,
        type: 'single',
        debuff: {
            stats: { agi: -15 },
            aspd: -30,
            duration: 2
        },
        desc: 'Precise attack. Reduces target AGI and ASPD for 2 turns.'
    },

    shadow_volley: {
        id: 'shadow_volley',
        name: 'Shadow Volley',
        icon: 'cloud',
        img: '/public/assets/icons/skills/shadow_volley.png',
        mana: 45,
        dmgMult: 1.0,
        type: 'aoe',
        effect: { id: 'poison', chance: 0.4, duration: 3 },
        desc: 'Area attack with 40% chance to poison multiple targets.'
    },

    hunters_focus: {
        id: 'hunters_focus',
        name: 'Hunter\'s Focus',
        icon: 'eye',
        img: '/public/assets/icons/skills/hunters_focus.png',
        mana: 35,
        dmgMult: 0,
        type: 'ally',
        buff: {
            stats: { dex: 25 },
            damageDealt: 1.3,  // +30% damage
            critBonus: 15,     // +15% crit
            hit: 30,           // +30 accuracy
            duration: 2
        },
        desc: 'Increases target DEX, damage, crit chance and accuracy for 2 turns.'
    },

    piercing_arrow: {
        id: 'piercing_arrow',
        name: 'Piercing Arrow',
        icon: 'arrow-right',
        img: '/public/assets/icons/skills/piercing_arrow.png',
        mana: 40,
        dmgMult: 1.6,
        type: 'pierce',
        desc: 'Powerful attack that can hit up to 2 enemies.'
    },

    rain_of_arrows: {
        id: 'rain_of_arrows',
        name: 'Rain of Arrows',
        icon: 'cloud-rain',
        img: '/public/assets/icons/skills/rain_of_arrows.png',
        mana: 60,
        dmgMult: 1.4,
        type: 'aoe',
        effects: [
            { id: 'poison', chance: 0.3, duration: 3 },
            { id: 'bleed', chance: 0.3, duration: 2 }
        ],
        desc: 'Ultimate area attack. High damage with poison/bleed chance.'
    },

    // Slot 13 - Ultimate (intentionally overpowered)
    volcanic_arrowstorm: {
        id: 'volcanic_arrowstorm',
        name: 'Volcanic Arrowstorm',
        icon: 'flame',
        img: '/public/assets/icons/skills/rain_of_arrows.png',
        mana: 95,
        dmgMult: 0.50,
        hits: 10,
        type: 'aoe',
        critBonus: 0.15,
        ultimate: true,
        effects: [
            { id: 'bleed', chance: 0.9, duration: 3 },
            { id: 'poison', chance: 0.85, duration: 4 },
            { id: 'slow', chance: 0.8, duration: 2 }
        ],
        desc: 'Ultimate. Unleash a volcanic barrage of 10 hits on ALL enemies, applying Bleed/Poison/Slow.'
    },

    summon_wolf: {
        id: 'summon_wolf',
        name: 'Summon Dire Wolf',
        icon: 'sparkles',
        img: '/public/assets/icons/skills/summon_wolf.png',
        mana: 50,
        type: 'summon',
        summonEntity: 'wolf', // Entity key from combatData.entities
        desc: 'Invokes a Dire Wolf to fight alongside you. Can only be used once per battle. (Max 3 allies)'
    },

    // ========================================
    // SHARED / GENERIC
    // ========================================
    bash: { name: 'Heavy Bash', mana: 20, dmgMult: 1.2, icon: 'shield', img: '/public/assets/icons/skills/shield_bash.png', desc: '40% Stun chance.', type: 'single', effect: { id: 'stun', chance: 0.4, duration: 1 } },
    // ========================================
    // ORC WARRIOR SKILLS (Lv 6)
    // ========================================
    smash: {
        id: 'smash',
        name: 'Smash',
        icon: 'hammer',
        mana: 25,
        dmgMult: 1.4,
        type: 'single',
        desc: 'A powerful overhead strike.'
    },
    orc_charge: {
        id: 'orc_charge',
        name: 'Orc Charge',
        icon: 'move',
        mana: 20,
        dmgMult: 1.2,
        type: 'single',
        effect: { id: 'stun', chance: 0.3, duration: 1 },
        desc: 'Charges forward with a devastating blow. 30% chance to Stun.'
    },
    war_cry: {
        id: 'war_cry',
        name: 'War Cry',
        icon: 'volume-2',
        mana: 15,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'war_cry',
            stats: { str: 6 },
            damageDealt: 1.15,
            duration: 2
        },
        desc: 'Rallying cry that increases target strength and damage for 2 turns.'
    },
    brutal_swing: {
        id: 'brutal_swing',
        name: 'Brutal Swing',
        icon: 'swords',
        mana: 30,
        dmgMult: 0.9,
        type: 'aoe',
        desc: 'A wide swing that hits all enemies.'
    },
    berserker_rage: {
        id: 'berserker_rage',
        name: 'Berserker Rage',
        icon: 'frown',
        mana: 35,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'berserker_rage',
            stats: { str: 10 },
            damageDealt: 1.25,
            damageTaken: 1.15,
            duration: 3
        },
        desc: 'Target enters a berserker state: +STR, +damage dealt, but takes more damage for 3 turns.'
    },

    // ========================================
    // GOBLIN SCOUT SKILLS (Lv 3)
    // ========================================
    stab: {
        id: 'stab',
        name: 'Stab',
        icon: 'sword',
        mana: 10,
        dmgMult: 1.1,
        type: 'single',
        desc: 'A quick stab with a dagger.'
    },
    loot: {
        id: 'loot',
        name: 'Pickpocket',
        icon: 'coins',
        mana: 5,
        dmgMult: 0.2,
        type: 'single',
        desc: 'Steals gold while attacking.'
    },
    goblin_dash: {
        id: 'goblin_dash',
        name: 'Goblin Dash',
        icon: 'move-diagonal',
        mana: 12,
        dmgMult: 1.0,
        type: 'single',
        effect: { id: 'bleed', chance: 0.25, duration: 2 },
        desc: 'A quick dash attack. 25% chance to cause Bleed.'
    },
    dirty_trick: {
        id: 'dirty_trick',
        name: 'Dirty Trick',
        icon: 'eye-off',
        mana: 15,
        dmgMult: 0.8,
        type: 'single',
        effect: { id: 'stun', chance: 0.4, duration: 1 },
        desc: 'A sneaky attack. 40% chance to Stun.'
    },
    retreat: {
        id: 'retreat',
        name: 'Retreat',
        icon: 'move',
        mana: 8,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'retreat',
            stats: { agi: 6 },
            flee: 50,
            duration: 2
        },
        desc: 'Quickly retreats, increasing agility and dodge for 2 turns.'
    },

    // ========================================
    // HOBGOBLIN BRUTE SKILLS (Lv 8)
    // ========================================
    heavy_slam: {
        id: 'heavy_slam',
        name: 'Heavy Slam',
        icon: 'hammer',
        mana: 15,
        dmgMult: 1.3,
        type: 'single',
        effect: { id: 'stun', chance: 0.25, duration: 1 },
        desc: 'A devastating slam. 25% chance to Stun.'
    },
    ground_slam: {
        id: 'ground_slam',
        name: 'Ground Slam',
        icon: 'waves',
        mana: 25,
        dmgMult: 0.85,
        type: 'aoe',
        effect: { id: 'stun', chance: 0.2, duration: 1 },
        desc: 'Smashes the ground, hitting all enemies. 20% chance to Stun each.'
    },
    intimidating_roar: {
        id: 'intimidating_roar',
        name: 'Intimidating Roar',
        icon: 'volume-2',
        mana: 20,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'intimidating_roar',
            stats: { str: 8, vit: 4 },
            damageTaken: 0.9,
            duration: 2
        },
        desc: 'A fearsome roar that increases target strength, vitality, and reduces damage taken for 2 turns.'
    },
    hobgoblin_crush: {
        id: 'hobgoblin_crush',
        name: 'Crushing Blow',
        icon: 'hammer',
        mana: 30,
        dmgMult: 1.6,
        type: 'single',
        debuff: {
            id: 'hobgoblin_crush',
            stats: { vit: -5 },
            duration: 2
        },
        desc: 'A powerful strike that reduces target\'s defense for 2 turns.'
    },
    rampage: {
        id: 'rampage',
        name: 'Rampage',
        icon: 'swords',
        mana: 40,
        dmgMult: 0.7,
        hits: 3,
        type: 'single',
        desc: 'A brutal 3-hit combo attack.'
    },

    // ========================================
    // BANDIT ARCHER SKILLS (Lv 7)
    // ========================================
    poison_tip: {
        id: 'poison_tip',
        name: 'Poison Tip',
        icon: 'skull',
        mana: 25,
        dmgMult: 1.2,
        type: 'single',
        effect: { id: 'poison', chance: 0.6, duration: 3 },
        desc: 'A toxic arrow. 60% chance to Poison.'
    },
    bandit_aim: {
        id: 'bandit_aim',
        name: 'Aimed Shot',
        icon: 'crosshair',
        mana: 20,
        dmgMult: 1.4,
        type: 'single',
        critBonus: 0.2,
        desc: 'A precise shot with increased crit chance.'
    },
    bandit_retreat: {
        id: 'bandit_retreat',
        name: 'Tactical Retreat',
        icon: 'move',
        mana: 15,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'bandit_retreat',
            stats: { agi: 8 },
            flee: 60,
            damageTaken: 0.85,
            duration: 2
        },
        desc: 'Quickly retreats, increasing agility, dodge, and reducing damage taken for 2 turns.'
    },
    bandit_volley: {
        id: 'bandit_volley',
        name: 'Arrow Volley',
        icon: 'target',
        mana: 35,
        dmgMult: 0.75,
        type: 'aoe',
        effect: { id: 'poison', chance: 0.3, duration: 2 },
        desc: 'Fires arrows at all enemies. 30% chance to Poison each.'
    },

    // ========================================
    // TOXIC SLIME SKILLS (Lv 2)
    // ========================================
    bounce: {
        id: 'bounce',
        name: 'Bounce',
        icon: 'circle',
        mana: 10,
        dmgMult: 1.0,
        type: 'single',
        desc: 'Squishy attack.'
    },
    dissolve: {
        id: 'dissolve',
        name: 'Acid Dissolve',
        icon: 'droplet',
        mana: 20,
        dmgMult: 1.3,
        type: 'single',
        effect: { id: 'burn', chance: 0.5, duration: 2 },
        desc: 'Corrosive acid attack. 50% chance to Burn.'
    },
    slime_split: {
        id: 'slime_split',
        name: 'Slime Split',
        icon: 'circle',
        mana: 15,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'slime_split',
            stats: { vit: 5 },
            damageTaken: 0.9,
            duration: 2
        },
        desc: 'Splits into smaller parts, increasing vitality and reducing damage taken for 2 turns.'
    },
    toxic_spit: {
        id: 'toxic_spit',
        name: 'Toxic Spit',
        icon: 'droplet',
        mana: 18,
        dmgMult: 1.1,
        type: 'single',
        effect: { id: 'poison', chance: 0.7, duration: 3 },
        desc: 'Spits toxic goo. 70% chance to Poison.'
    },

    // ========================================
    // STORMHAVEN MONSTERS SKILLS
    // ========================================
    goblin_raid: {
        id: 'goblin_raid',
        name: 'Goblin Raid',
        icon: 'sword',
        mana: 8,
        dmgMult: 1.0,
        type: 'single',
        desc: 'A quick attack with stolen equipment.'
    },
    crab_pinch: {
        id: 'crab_pinch',
        name: 'Crab Pinch',
        icon: 'hand',
        mana: 10,
        dmgMult: 1.1,
        type: 'single',
        effect: { id: 'bleed', chance: 0.3, duration: 2 },
        desc: 'A powerful pinch. 30% chance to cause Bleed.'
    },
    shell_defense: {
        id: 'shell_defense',
        name: 'Shell Defense',
        icon: 'shield',
        mana: 12,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'shell_defense',
            damageTaken: 0.75,
            duration: 3
        },
        desc: 'Retracts into shell, reducing damage taken by 25% for 3 turns.'
    },
    bubble_burst: {
        id: 'bubble_burst',
        name: 'Bubble Burst',
        icon: 'droplets',
        mana: 15,
        dmgMult: 0.8,
        type: 'aoe',
        element: 'water',
        desc: 'Releases bubbles that hit all enemies.'
    },
    poison_bite: {
        id: 'poison_bite',
        name: 'Poison Bite',
        icon: 'frown',
        mana: 8,
        dmgMult: 0.9,
        type: 'single',
        element: 'poison',
        effect: { id: 'poison', chance: 0.5, duration: 3 },
        desc: 'A venomous bite. 50% chance to Poison.'
    },
    quick_escape: {
        id: 'quick_escape',
        name: 'Quick Escape',
        icon: 'move',
        mana: 10,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'quick_escape',
            stats: { agi: 6 },
            flee: 50,
            duration: 2
        },
        desc: 'Quickly retreats, increasing agility and dodge for 2 turns.'
    },
    disease_scratch: {
        id: 'disease_scratch',
        name: 'Disease Scratch',
        icon: 'skull',
        mana: 12,
        dmgMult: 0.85,
        type: 'single',
        element: 'poison',
        effect: { id: 'disease', chance: 0.4, duration: 3 },
        desc: 'A filthy scratch. 40% chance to cause Disease.'
    },
    marauder_strike: {
        id: 'marauder_strike',
        name: 'Marauder Strike',
        icon: 'sword',
        mana: 12,
        dmgMult: 1.2,
        type: 'single',
        desc: 'A ruthless attack from a coastal bandit.'
    },
    dirty_blow: {
        id: 'dirty_blow',
        name: 'Dirty Blow',
        icon: 'sword',
        mana: 15,
        dmgMult: 1.0,
        type: 'single',
        effect: { id: 'stun', chance: 0.35, duration: 1 },
        desc: 'A sneaky attack. 35% chance to Stun.'
    },
    rock_slam: {
        id: 'rock_slam',
        name: 'Rock Slam',
        icon: 'hammer',
        mana: 18,
        dmgMult: 1.3,
        type: 'single',
        element: 'earth',
        effect: { id: 'stun', chance: 0.25, duration: 1 },
        desc: 'Smashes the ground. 25% chance to Stun.'
    },
    stone_skin: {
        id: 'stone_skin',
        name: 'Stone Skin',
        icon: 'shield',
        mana: 20,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'stone_skin',
            stats: { vit: 5 },
            damageTaken: 0.8,
            duration: 3
        },
        desc: 'Hardens skin like stone, increasing defense and reducing damage taken for 3 turns.'
    },
    earthquake: {
        id: 'earthquake',
        name: 'Earthquake',
        icon: 'waves',
        mana: 25,
        dmgMult: 0.9,
        type: 'aoe',
        element: 'earth',
        effect: { id: 'stun', chance: 0.2, duration: 1 },
        desc: 'Shakes the ground, hitting all enemies. 20% chance to Stun each.'
    },
    bone_strike: {
        id: 'bone_strike',
        name: 'Bone Strike',
        icon: 'skull',
        mana: 14,
        dmgMult: 1.15,
        type: 'single',
        element: 'undead',
        desc: 'A strike with hardened bones.'
    },
    undead_resilience: {
        id: 'undead_resilience',
        name: 'Undead Resilience',
        icon: 'shield',
        mana: 16,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'undead_resilience',
            stats: { vit: 4 },
            damageTaken: 0.85,
            duration: 2
        },
        desc: 'Draws upon undead endurance, increasing target defense for 2 turns.'
    },
    scout_charge: {
        id: 'scout_charge',
        name: 'Scout Charge',
        icon: 'move',
        mana: 16,
        dmgMult: 1.25,
        type: 'single',
        effect: { id: 'stun', chance: 0.3, duration: 1 },
        desc: 'Charges forward with a powerful strike. 30% chance to Stun.'
    },
    harpy_screech: {
        id: 'harpy_screech',
        name: 'Harpy Screech',
        icon: 'volume-2',
        mana: 18,
        dmgMult: 0,
        type: 'aoe',
        element: 'wind',
        effect: { id: 'stun', chance: 0.4, duration: 1 },
        desc: 'A piercing screech that stuns all enemies. 40% chance to Stun each.'
    },
    talon_strike: {
        id: 'talon_strike',
        name: 'Talon Strike',
        icon: 'sword',
        mana: 14,
        dmgMult: 1.2,
        type: 'single',
        element: 'wind',
        desc: 'A swift strike with sharp talons.'
    },
    wind_gust: {
        id: 'wind_gust',
        name: 'Wind Gust',
        icon: 'wind',
        mana: 20,
        dmgMult: 0.85,
        type: 'aoe',
        element: 'wind',
        desc: 'A powerful gust of wind that hits all enemies.'
    },
    troll_regeneration: {
        id: 'troll_regeneration',
        name: 'Troll Regeneration',
        icon: 'heart',
        mana: 22,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'troll_regeneration',
            stats: { vit: 6 },
            damageTaken: 0.9,
            duration: 3
        },
        desc: 'Activates natural regeneration, increasing target vitality and defense for 3 turns.'
    },
    heavy_club: {
        id: 'heavy_club',
        name: 'Heavy Club',
        icon: 'hammer',
        mana: 20,
        dmgMult: 1.5,
        type: 'single',
        desc: 'A devastating club strike.'
    },
    ghostly_strike: {
        id: 'ghostly_strike',
        name: 'Ghostly Strike',
        icon: 'ghost',
        mana: 16,
        dmgMult: 1.1,
        type: 'single',
        damageType: 'magic',
        element: 'shadow',
        desc: 'An ethereal strike that pierces physical defenses.'
    },
    cursed_sword: {
        id: 'cursed_sword',
        name: 'Cursed Sword',
        icon: 'sword',
        mana: 22,
        dmgMult: 1.3,
        type: 'single',
        element: 'shadow',
        debuff: {
            id: 'cursed_sword',
            stats: { str: -3, agi: -2 },
            duration: 3
        },
        desc: 'A cursed blade that weakens the target for 3 turns.'
    },
    captain_taunt: {
        id: 'captain_taunt',
        name: 'Captain Taunt',
        icon: 'speaker',
        mana: 15,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'captain_taunt',
            tauntChance: 0.9,
            damageTaken: 0.9,
            duration: 2
        },
        desc: 'Target provokes all enemies to target them (90% chance) and reduces damage taken for 2 turns.'
    },
    dark_aura: {
        id: 'dark_aura',
        name: 'Dark Aura',
        icon: 'moon',
        mana: 25,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'dark_aura',
            stats: { str: 8, int: 6 },
            damageDealt: 1.2,
            duration: 3
        },
        desc: 'Surrounds target with dark energy, increasing strength, magic, and damage dealt for 3 turns.'
    },
    pirate_rage: {
        id: 'pirate_rage',
        name: 'Pirate Rage',
        icon: 'swords',
        mana: 35,
        dmgMult: 0.9,
        type: 'aoe',
        damageType: 'magic',
        element: 'shadow',
        effect: { id: 'stun', chance: 0.3, duration: 1 },
        desc: 'Unleashes dark energy in all directions. 30% chance to Stun each enemy.'
    },

    // ========================================
    // ELDERVALE MONSTERS SKILLS
    // ========================================
    gelatinous_absorb: {
        id: 'gelatinous_absorb',
        name: 'Absorb',
        icon: 'circle',
        mana: 8,
        dmgMult: 0.9,
        type: 'single',
        desc: 'Attempts to absorb the target.'
    },
    gelatinous_split: {
        id: 'gelatinous_split',
        name: 'Split',
        icon: 'circle',
        mana: 10,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'gelatinous_split',
            stats: { vit: 3 },
            damageTaken: 0.9,
            duration: 2
        },
        desc: 'Splits into smaller parts, increasing vitality for 2 turns.'
    },
    feral_bite: {
        id: 'feral_bite',
        name: 'Feral Bite',
        icon: 'frown',
        mana: 8,
        dmgMult: 1.0,
        type: 'single',
        effect: { id: 'bleed', chance: 0.35, duration: 2 },
        desc: 'A wild bite. 35% chance to cause Bleed.'
    },
    spider_bite: {
        id: 'spider_bite',
        name: 'Spider Bite',
        icon: 'frown',
        mana: 10,
        dmgMult: 1.0,
        type: 'single',
        element: 'poison',
        effect: { id: 'poison', chance: 0.5, duration: 3 },
        desc: 'A venomous bite. 50% chance to Poison.'
    },
    web_trap: {
        id: 'web_trap',
        name: 'Web Trap',
        icon: 'circle',
        mana: 12,
        dmgMult: 0.8,
        type: 'single',
        element: 'poison',
        effect: { id: 'slow', chance: 0.6, duration: 2 },
        desc: 'Entangles the target in webs. 60% chance to Slow.'
    },
    poison_spit: {
        id: 'poison_spit',
        name: 'Poison Spit',
        icon: 'droplet',
        mana: 14,
        dmgMult: 0.9,
        type: 'single',
        element: 'poison',
        effect: { id: 'poison', chance: 0.7, duration: 3 },
        desc: 'Spits venom. 70% chance to Poison.'
    },
    bat_swarm_attack: {
        id: 'bat_swarm_attack',
        name: 'Swarm Attack',
        icon: 'wind',
        mana: 10,
        dmgMult: 0.85,
        type: 'aoe',
        effect: { id: 'bleed', chance: 0.3, duration: 2 },
        desc: 'Swarm of bats attack all enemies. 30% chance to cause Bleed each.'
    },
    bat_screech: {
        id: 'bat_screech',
        name: 'Screech',
        icon: 'volume-2',
        mana: 12,
        dmgMult: 0,
        type: 'aoe',
        effect: { id: 'slow', chance: 0.4, duration: 1 },
        desc: 'A piercing screech. 40% chance to Slow all enemies.'
    },
    drain_blood: {
        id: 'drain_blood',
        name: 'Drain Blood',
        icon: 'droplet',
        mana: 15,
        dmgMult: 1.0,
        type: 'single',
        effect: { id: 'bleed', chance: 0.5, duration: 3 },
        desc: 'Drains blood from the target. 50% chance to cause Bleed.'
    },
    root_strike: {
        id: 'root_strike',
        name: 'Root Strike',
        icon: 'sword',
        mana: 14,
        dmgMult: 1.1,
        type: 'single',
        element: 'earth',
        desc: 'Strikes with hardened roots.'
    },
    bark_skin: {
        id: 'bark_skin',
        name: 'Bark Skin',
        icon: 'shield',
        mana: 16,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'bark_skin',
            stats: { vit: 5 },
            damageTaken: 0.85,
            duration: 3
        },
        desc: 'Hardens bark, increasing defense for 3 turns.'
    },
    nature_heal: {
        id: 'nature_heal',
        name: 'Nature Heal',
        icon: 'heart',
        mana: 18,
        dmgMult: 0,
        type: 'ally',
        healPct: 0.25,
        desc: 'Draws upon nature to restore 25% of max HP.'
    },
    giant_rat_bite: {
        id: 'giant_rat_bite',
        name: 'Giant Rat Bite',
        icon: 'frown',
        mana: 12,
        dmgMult: 1.05,
        type: 'single',
        element: 'poison',
        effect: { id: 'poison', chance: 0.4, duration: 2 },
        desc: 'A large bite. 40% chance to Poison.'
    },
    poison_claw: {
        id: 'poison_claw',
        name: 'Poison Claw',
        icon: 'wind',
        mana: 14,
        dmgMult: 0.95,
        type: 'single',
        element: 'poison',
        effect: { id: 'poison', chance: 0.6, duration: 3 },
        desc: 'Claws with poison. 60% chance to Poison.'
    },
    quick_scurry: {
        id: 'quick_scurry',
        name: 'Quick Scurry',
        icon: 'move',
        mana: 10,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'quick_scurry',
            stats: { agi: 7 },
            flee: 55,
            duration: 2
        },
        desc: 'Quickly scurries away, increasing agility and dodge for 2 turns.'
    },
    stinger_strike: {
        id: 'stinger_strike',
        name: 'Stinger Strike',
        icon: 'wind',
        mana: 16,
        dmgMult: 1.2,
        type: 'single',
        element: 'poison',
        critBonus: 0.2,
        effect: { id: 'poison', chance: 0.7, duration: 3 },
        desc: 'A precise stinger strike with high crit chance. 70% chance to Poison.'
    },
    venom_cloud: {
        id: 'venom_cloud',
        name: 'Venom Cloud',
        icon: 'cloud',
        mana: 22,
        dmgMult: 0.9,
        type: 'aoe',
        element: 'poison',
        effect: { id: 'poison', chance: 0.5, duration: 3 },
        desc: 'Releases a cloud of venom. 50% chance to Poison all enemies.'
    },
    hive_command: {
        id: 'hive_command',
        name: 'Hive Command',
        icon: 'volume-2',
        mana: 20,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'hive_command',
            stats: { agi: 8, dex: 6 },
            critBonus: 0.15,
            duration: 2
        },
        desc: 'Commands target, increasing agility, dexterity, and crit for 2 turns.'
    },
    boar_charge: {
        id: 'boar_charge',
        name: 'Boar Charge',
        icon: 'move',
        mana: 18,
        dmgMult: 1.3,
        type: 'single',
        effect: { id: 'stun', chance: 0.4, duration: 1 },
        desc: 'Charges with full force. 40% chance to Stun.'
    },
    tusk_strike: {
        id: 'tusk_strike',
        name: 'Tusk Strike',
        icon: 'sword',
        mana: 16,
        dmgMult: 1.25,
        type: 'single',
        effect: { id: 'bleed', chance: 0.4, duration: 2 },
        desc: 'Strikes with sharp tusks. 40% chance to cause Bleed.'
    },
    thick_hide: {
        id: 'thick_hide',
        name: 'Thick Hide',
        icon: 'shield',
        mana: 20,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'thick_hide',
            stats: { vit: 6 },
            damageTaken: 0.8,
            duration: 3
        },
        desc: 'Toughens target hide, increasing defense significantly for 3 turns.'
    },
    nature_bolt: {
        id: 'nature_bolt',
        name: 'Nature Bolt',
        icon: 'sparkles',
        mana: 14,
        dmgMult: 1.0,
        type: 'single',
        damageType: 'magic',
        element: 'wind',
        desc: 'A bolt of nature energy.'
    },
    healing_breeze: {
        id: 'healing_breeze',
        name: 'Healing Breeze',
        icon: 'heart',
        mana: 20,
        dmgMult: 0,
        type: 'ally',
        healPct: 0.3,
        desc: 'A gentle breeze that restores 30% of max HP.'
    },
    thorn_vine: {
        id: 'thorn_vine',
        name: 'Thorn Vine',
        icon: 'sword',
        mana: 18,
        dmgMult: 1.1,
        type: 'single',
        damageType: 'magic',
        element: 'wind',
        effect: { id: 'bleed', chance: 0.5, duration: 2 },
        desc: 'Wraps target in thorns. 50% chance to cause Bleed.'
    },
    ancient_stomp: {
        id: 'ancient_stomp',
        name: 'Ancient Stomp',
        icon: 'waves',
        mana: 25,
        dmgMult: 1.2,
        type: 'aoe',
        element: 'earth',
        effect: { id: 'stun', chance: 0.3, duration: 1 },
        desc: 'Stomps the ground with ancient force. 30% chance to Stun all enemies.'
    },
    bark_armor: {
        id: 'bark_armor',
        name: 'Bark Armor',
        icon: 'shield',
        mana: 28,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'bark_armor',
            stats: { vit: 8 },
            damageTaken: 0.75,
            duration: 4
        },
        desc: 'Covers self or ally in ancient bark, greatly increasing defense for 4 turns.'
    },
    nature_wrath: {
        id: 'nature_wrath',
        name: 'Nature Wrath',
        icon: 'sparkles',
        mana: 32,
        dmgMult: 1.0,
        type: 'aoe',
        damageType: 'magic',
        element: 'wind',
        effect: { id: 'slow', chance: 0.4, duration: 2 },
        desc: 'Unleashes nature\'s fury. 40% chance to Slow all enemies.'
    },
    root_grasp: {
        id: 'root_grasp',
        name: 'Root Grasp',
        icon: 'circle',
        mana: 20,
        dmgMult: 1.1,
        type: 'single',
        element: 'earth',
        effect: { id: 'slow', chance: 0.6, duration: 2 },
        desc: 'Grasps target with ancient roots. 60% chance to Slow.'
    },
    ancient_rage: {
        id: 'ancient_rage',
        name: 'Ancient Rage',
        icon: 'swords',
        mana: 40,
        dmgMult: 1.1,
        type: 'aoe',
        damageType: 'magic',
        element: 'wind',
        effect: { id: 'stun', chance: 0.35, duration: 1 },
        desc: 'Unleashes ancient rage in all directions. 35% chance to Stun each enemy.'
    },

    // Legacy skills (mantidas para compatibilidade)
    bite: { name: 'Feral Bite', mana: 15, dmgMult: 1.2, icon: 'frown', type: 'single', effect: { id: 'bleed', chance: 0.4, duration: 2 } },
    toxin: { name: 'Envenom', mana: 25, dmgMult: 1.1, icon: 'skull', img: '/public/assets/icons/skills/3.png', desc: '80% Poison chance.', type: 'single', effect: { id: 'poison', chance: 0.8, duration: 4 } },

    // Basic supports used by some enemies / legacy data
    rally: { name: 'Recover', mana: 50, dmgMult: 0, icon: 'flag', img: '/public/assets/icons/skills/2.png', desc: 'Heal target.', type: 'ally' },
    fortify: { name: 'Fortify', mana: 40, dmgMult: 0, icon: 'shield', desc: 'Boost Defense.', type: 'ally' },
    howl: { name: 'Pack Howl', mana: 20, dmgMult: 0, icon: 'speaker', desc: 'Buffs attack.', type: 'ally' },
    rage: { name: 'Battle Rage', mana: 0, dmgMult: 0, icon: 'frown', desc: 'Increases damage taken and dealt.', type: 'ally' },
    repair: { name: 'Field Repair', mana: 20, dmgMult: 0, icon: 'hammer', desc: 'Heals armor.', type: 'ally' },

    // ========================================
    // MAGE (Lv 1â€“12) + Legacy keys
    // ========================================
    arcane_bolt: { name: 'Arcane Bolt', mana: 8, dmgMult: 0.95, icon: 'sparkles', type: 'single', damageType: 'magic', element: 'neutral', desc: 'A basic arcane projectile.' },
    ember_spear: { name: 'Ember Spear', mana: 12, dmgMult: 1.05, icon: 'flame', type: 'single', damageType: 'magic', element: 'fire', effect: { id: 'burn', chance: 0.2, duration: 2 }, desc: 'A focused flame with a small burn chance.' },
    frost: { name: 'Frost Bolt', mana: 22, dmgMult: 1.1, icon: 'snowflake', img: '/public/assets/icons/skills/2.png', type: 'single', damageType: 'magic', element: 'water', effect: { id: 'freeze', chance: 0.2, duration: 1 }, desc: 'A chilling bolt with a small freeze chance.' },
    mana_shield: { name: 'Mana Shield', mana: 18, dmgMult: 0, icon: 'shield', type: 'ally', buff: { id: 'mana_shield', damageTaken: 0.85, duration: 2 }, desc: 'A protective barrier that reduces incoming damage.' },
    fireball: { name: 'Fireball', mana: 30, dmgMult: 1.55, icon: 'flame', img: '/public/assets/icons/skills/2.png', type: 'single', damageType: 'magic', element: 'fire', effect: { id: 'burn', chance: 0.5, duration: 3 }, desc: 'A fire burst with a chance to burn.' },
    chain_spark: { name: 'Chain Spark', mana: 26, dmgMult: 1.1, icon: 'zap', type: 'single', damageType: 'magic', element: 'wind', effect: { id: 'paralyze', chance: 0.25, duration: 1 }, desc: 'Lightning jumps through nerves (small paralyze chance).' },
    arcane_focus: { name: 'Arcane Focus', mana: 30, dmgMult: 0, icon: 'eye', type: 'ally', buff: { id: 'arcane_focus', damageDealt: 1.25, critBonus: 8, duration: 2 }, desc: 'Focus target mind: higher damage and crit for 2 turns.' },
    ice_prison: { name: 'Ice Prison', mana: 34, dmgMult: 1.35, icon: 'snowflake', type: 'single', damageType: 'magic', element: 'water', effect: { id: 'freeze', chance: 0.35, duration: 1 }, desc: 'A freezing burst with higher freeze chance.' },
    lightning_storm: { name: 'Lightning Storm', mana: 45, dmgMult: 1.05, icon: 'cloud-lightning', type: 'aoe', damageType: 'magic', element: 'wind', effect: { id: 'paralyze', chance: 0.2, duration: 1 }, desc: 'Area lightning damage with a small paralyze chance.' },
    shock: { name: 'Thunder Clap', mana: 35, dmgMult: 1.35, icon: 'zap', img: '/public/assets/icons/skills/3.png', type: 'single', damageType: 'magic', element: 'wind', effect: { id: 'paralyze', chance: 0.5, duration: 2 }, desc: 'A shock of lightning with a paralyze chance.' },
    void_lance: { name: 'Void Lance', mana: 55, dmgMult: 1.8, icon: 'wand-2', type: 'single', damageType: 'magic', element: 'shadow', defenseIgnore: 0.35, desc: 'A piercing arcane lance that ignores magic defense.' },
    meteor: {
        name: 'Meteor Storm',
        mana: 85,
        dmgMult: 0.55,
        hits: 7,
        icon: 'flame',
        img: '/public/assets/icons/skills/1.png',
        type: 'aoe',
        damageType: 'magic',
        element: 'fire',
        ultimate: true,
        critBonus: 0.12,
        effects: [
            { id: 'burn', chance: 0.55, duration: 4 },
            { id: 'stun', chance: 0.25, duration: 1 }
        ],
        desc: 'Ultimate. Rain down 7 devastating meteors on all enemies, applying Burn/Stun.'
    },

    // ========================================
    // THIEF (Lv 1â€“12)
    // ========================================
    quick_stab: { name: 'Quick Stab', mana: 5, dmgMult: 0.9, icon: 'sword', type: 'single', desc: 'A fast, low-cost strike.' },
    poisoned_blade: { name: 'Poisoned Blade', mana: 12, dmgMult: 1.05, icon: 'skull', type: 'single', element: 'poison', effect: { id: 'poison', chance: 0.5, duration: 3 }, desc: 'A coated blade with a solid poison chance.' },
    evasive_roll: { name: 'Evasive Roll', mana: 14, dmgMult: 0, icon: 'move-diagonal', type: 'self', buff: { id: 'evasive_roll', stats: { agi: 8 }, flee: 60, duration: 1 }, desc: 'Quick repositioning: higher dodge for 1 turn.' },
    backstab: { name: 'Backstab', mana: 22, dmgMult: 1.45, icon: 'dagger', img: '/public/assets/icons/skills/3.png', type: 'single', critBonus: 0.25, defenseIgnore: 0.15, desc: 'A precise strike from the shadows (+crit).' },
    bleeding_cut: { name: 'Bleeding Cut', mana: 18, dmgMult: 1.15, icon: 'scissors', type: 'single', effect: { id: 'bleed', chance: 0.45, duration: 2 }, desc: 'A cut that may cause bleeding.' },
    smoke_bomb: { name: 'Smoke Bomb', mana: 22, dmgMult: 0, icon: 'cloud', type: 'ally', buff: { id: 'smoke_bomb', damageTaken: 0.85, flee: 40, duration: 2 }, desc: 'Conceal target: reduced damage and better evasion.' },
    shadow_strike: { name: 'Shadow Strike', mana: 28, dmgMult: 0.75, hits: 2, icon: 'swords', type: 'single', desc: 'Two rapid strikes from the shadows.' },
    crippling_poison: { name: 'Crippling Poison', mana: 32, dmgMult: 1.2, icon: 'footprints', type: 'single', debuff: { id: 'crippling_poison', aspd: -20, stats: { agi: -4 }, duration: 2 }, effect: { id: 'poison', chance: 0.35, duration: 3 }, desc: 'Poisons and slows the target.' },
    execution: { name: 'Execution', mana: 40, dmgMult: 1.65, icon: 'crosshair', type: 'single', critBonus: 0.25, desc: 'A decisive strike with higher crit chance.' },
    fan_of_knives: { name: 'Fan of Knives', mana: 45, dmgMult: 0.85, icon: 'target', type: 'aoe', effect: { id: 'bleed', chance: 0.2, duration: 2 }, desc: 'Hits all enemies with a chance to bleed.' },
    nightmare_combo: { name: 'Nightmare Combo', mana: 55, dmgMult: 0.55, hits: 3, icon: 'swords', type: 'single', desc: 'A brutal 3-hit combo.' },
    assassinate: { name: 'Assassinate', mana: 70, dmgMult: 2.1, icon: 'skull', type: 'single', defenseIgnore: 0.35, critBonus: 0.15, ultimate: true, effect: { id: 'stun', chance: 0.2, duration: 1 }, desc: 'Ultimate finisher: high damage, pierces defenses, may stun.' },

    // ========================================
    // ACOLYTE (Lv 1â€“12)
    // ========================================
    heal: { name: 'Heal', mana: 22, dmgMult: 0, icon: 'heart', img: '/public/assets/icons/skills/2.png', type: 'ally', healPct: 0.40, desc: 'Restore 40% target Max HP.' },
    minor_smite: { name: 'Minor Smite', mana: 6, dmgMult: 0.9, icon: 'sun', type: 'single', damageType: 'magic', element: 'holy', desc: 'A basic holy bolt.' },
    bless: { name: 'Blessing', mana: 28, dmgMult: 0, icon: 'sun', type: 'ally', buff: { id: 'bless', stats: { int: 2, vit: 1 }, duration: 3 }, desc: 'Blessing that improves core stats.' },
    holy_shield: { name: 'Holy Shield', mana: 18, dmgMult: 0, icon: 'shield-check', type: 'ally', buff: { id: 'holy_shield', damageTaken: 0.85, duration: 2 }, desc: 'A blessing that reduces incoming damage.' },
    smite: { name: 'Holy Smite', mana: 28, dmgMult: 1.25, icon: 'sun', type: 'single', damageType: 'magic', element: 'holy', desc: 'Holy damage.' },
    purifying_light: { name: 'Purifying Light', mana: 24, dmgMult: 1.15, icon: 'sparkles', type: 'single', damageType: 'magic', element: 'holy', effect: { id: 'paralyze', chance: 0.2, duration: 1 }, desc: 'Holy light that may paralyze.' },
    renewal: { name: 'Renewal', mana: 30, dmgMult: 0, icon: 'heart', type: 'ally', healPct: 0.2, manaRestorePct: 0.12, buff: { id: 'renewal', damageTaken: 0.9, duration: 2 }, desc: 'Restore part of HP and steady the target.' },
    radiant_wave: { name: 'Radiant Wave', mana: 36, dmgMult: 1.0, icon: 'sun', type: 'aoe', damageType: 'magic', element: 'holy', desc: 'Holy area damage.' },
    divine_favor: { name: 'Divine Favor', mana: 45, dmgMult: 0, icon: 'zap', type: 'ally', buff: { id: 'divine_favor', stats: { int: 4, vit: 2 }, damageDealt: 1.2, duration: 2 }, desc: 'Empowers spirit (more INT/VIT and damage).' },
    sanctuary: { name: 'Sanctuary', mana: 50, dmgMult: 0, icon: 'heart', type: 'aoe_heal', healPct: 0.22, desc: 'Heals all heroes.' },
    judgement: { name: 'Judgement', mana: 55, dmgMult: 1.65, icon: 'scale', type: 'single', damageType: 'magic', element: 'holy', defenseIgnore: 0.25, desc: 'A powerful holy strike that pierces magic defense.' },
    celestial_wrath: {
        name: 'Celestial Wrath',
        mana: 85,
        dmgMult: 0.5,
        hits: 6,
        icon: 'sparkles',
        type: 'aoe',
        damageType: 'magic',
        element: 'holy',
        ultimate: true,
        critBonus: 0.10,
        healPct: 0.18,
        effects: [
            { id: 'stun', chance: 0.35, duration: 1 },
            { id: 'slow', chance: 0.4, duration: 2 }
        ],
        desc: 'Ultimate. Divine judgment strikes all enemies 6 times while healing all allies for 18% max HP.'
    },

    // ========================================
    // BLACKSMITH (Lv 1â€“12)
    // ========================================
    anvil_tap: { name: 'Anvil Tap', mana: 5, dmgMult: 0.95, icon: 'hammer', type: 'single', desc: 'A basic hammer strike. Cheap and reliable.' },
    spark_blow: { name: 'Spark Blow', mana: 10, dmgMult: 1.05, icon: 'flame', type: 'single', effect: { id: 'burn', chance: 0.2, duration: 2 }, desc: 'A hot strike with a small chance to burn.' },
    field_repair: { name: 'Field Repair', mana: 15, dmgMult: 0, icon: 'wrench', type: 'ally', buff: { id: 'field_repair', stats: { vit: 3 }, damageTaken: 0.9, duration: 2 }, desc: 'Quick repairs to stay standing (+VIT, reduced damage).' },
    tempered_strike: { name: 'Tempered Strike', mana: 18, dmgMult: 1.2, icon: 'shield', type: 'single', effect: { id: 'stun', chance: 0.15, duration: 1 }, desc: 'A solid hit with a small stun chance.' },
    fortify_armor: { name: 'Fortify Armor', mana: 25, dmgMult: 0, icon: 'shield-check', type: 'ally', buff: { id: 'fortify_armor', damageTaken: 0.8, duration: 2 }, desc: 'Reinforce target armor.' },
    seismic_slam: { name: 'Seismic Slam', mana: 30, dmgMult: 0.85, icon: 'waves', type: 'aoe', effect: { id: 'stun', chance: 0.1, duration: 1 }, desc: 'A ground slam that hits all enemies with a small stun chance.' },
    molten_edge: { name: 'Molten Edge', mana: 35, dmgMult: 1.4, icon: 'flame', type: 'single', effect: { id: 'burn', chance: 0.35, duration: 3 }, desc: 'A molten strike with a higher burn chance.' },
    riveting_combo: { name: 'Riveting Combo', mana: 35, dmgMult: 0.7, hits: 2, icon: 'swords', type: 'single', desc: 'Two fast hits in succession.' },
    shatter_armor: { name: 'Shatter Armor', mana: 40, dmgMult: 1.5, icon: 'shield-off', type: 'single', debuff: { id: 'shatter_armor', stats: { vit: -3, agi: -2 }, duration: 2 }, desc: 'Cracks defenses (reduces VIT/AGI for 2 turns).' },
    forge_overdrive: { name: 'Forge Overdrive', mana: 45, dmgMult: 0, icon: 'zap', type: 'self', buff: { id: 'forge_overdrive', damageDealt: 1.25, aspd: 25, duration: 2 }, desc: 'Overdrive: faster attacks and more damage for 2 turns.' },
    masterwork_precision: { name: 'Masterwork Precision', mana: 55, dmgMult: 1.8, icon: 'crosshair', type: 'single', critBonus: 0.2, defenseIgnore: 0.3, desc: 'A perfectly aimed blow that pierces defenses and crits more often.' },
    worldbreaker: { name: 'Worldbreaker', mana: 70, dmgMult: 2.0, icon: 'swords', type: 'aoe', ultimate: true, cooldown: 5, effects: [{ id: 'burn', chance: 0.25, duration: 3 }, { id: 'stun', chance: 0.15, duration: 1 }], desc: 'Ultimate slam: devastating damage to all enemies with burn/stun chance.' },

    // ========================================
    // DIRE WOLF SKILLS (Lv 1-6)
    // ========================================

    savage_bite: {
        id: 'savage_bite',
        name: 'Savage Bite',
        icon: 'activity',
        img: null,
        mana: 8,
        dmgMult: 1.1,
        type: 'single',
        damageType: 'physical',
        effect: { id: 'bleed', chance: 0.2, duration: 2 },
        audioId: 'bite',
        desc: 'Vicious bite. 20% chance to cause Bleed.'
    },

    pack_howl: {
        id: 'pack_howl',
        name: 'Pack Howl',
        icon: 'volume-2',
        img: null,
        mana: 12,
        dmgMult: 0,
        type: 'ally',
        buff: {
            id: 'pack_howl',
            stats: { str: 5 },
            aspd: 20,
            duration: 2
        },
        audioId: 'howl',
        desc: 'Rallying howl. Increases target STR and ASPD for 2 turns.'
    },

    lunge: {
        id: 'lunge',
        name: 'Lunge',
        icon: 'move',
        img: null,
        mana: 15,
        dmgMult: 1.3,
        type: 'single',
        damageType: 'physical',
        effect: { id: 'stun', chance: 0.3, duration: 1 },
        audioId: 'dash',
        desc: 'Swift pounce. 30% chance to Stun.'
    },

    feral_claws: {
        id: 'feral_claws',
        name: 'Feral Claws',
        icon: 'wind',
        img: null,
        mana: 18,
        dmgMult: 0.75,
        hits: 2,
        type: 'single',
        damageType: 'physical',
        audioId: 'claw_swipe',
        desc: 'Rapid claw slashes. Hits twice.'
    },

    blood_frenzy: {
        id: 'blood_frenzy',
        name: 'Blood Frenzy',
        icon: 'droplet',
        img: null,
        mana: 25,
        dmgMult: 1.5,
        type: 'single',
        damageType: 'physical',
        effect: { id: 'bleed', chance: 0.5, duration: 3 },
        buff: {
            id: 'blood_frenzy',
            stats: { str: 8 },
            damageDealt: 1.15,
            duration: 2
        },
        audioId: 'growl',
        desc: 'Frenzied attack. Causes Bleed and grants temporary power boost.'
    },

    lunar_rampage: {
        id: 'lunar_rampage',
        name: 'Lunar Rampage',
        icon: 'moon',
        img: null,
        mana: 40,
        dmgMult: 0.6,
        hits: 6,
        type: 'single',
        damageType: 'physical',
        ultimate: true,
        effects: [
            { id: 'bleed', chance: 0.7, duration: 3 },
            { id: 'stun', chance: 0.4, duration: 1 }
        ],
        buff: {
            id: 'lunar_rage',
            stats: { str: 12, agi: 8 },
            damageDealt: 1.3,
            aspd: 30,
            duration: 3
        },
        audioId: 'ultimate_howl',
        hasVoice: true,
        desc: 'ULTIMATE: Howls at the moon, then strikes with 6 devastating claw hits. Massive damage + self-buff.'
    },

    // ========================================
    // SPECIAL SKILLS
    // ========================================

    mana_drain: {
        id: 'mana_drain',
        name: 'Mana Drain',
        icon: 'zap',
        img: '/public/assets/icons/skills/mana_drain.png',
        mana: 40,
        type: 'single',
        drainPercent: 0.4, // 40% do MP atual
        minDrain: 20, // MÃ­nimo de MP roubado
        desc: 'Drains 40% of target\'s current MP and transfers it to you. Minimum 20 MP drained.'
    },

    reflect_shield: {
        id: 'reflect_shield',
        name: 'Reflect Shield',
        icon: 'shield',
        img: '/public/assets/icons/skills/reflect_shield.png',
        mana: 45,
        type: 'self',
        buff: {
            id: 'reflect_shield',
            reflectPercent: 0.35, // 35% do dano refletido
            duration: 2
        },
        desc: 'Reflects 35% of incoming damage back to attackers for 2 turns.'
    },

    revive: {
        id: 'revive',
        name: 'Revive',
        icon: 'heart',
        img: '/public/assets/icons/skills/revive.png',
        mana: 70,
        type: 'revive',
        desc: 'Revives a fallen ally from the graveyard with 50% HP and full mana. (Max 3 allies on field)'
    },

    life_steal: {
        id: 'life_steal',
        name: 'Life Steal',
        icon: 'heart',
        mana: 55,
        type: 'single',
        dmgMult: 1.1,
        stealPercent: 0.4,
        desc: 'Deals damage and steals 40% of damage dealt as HP. Great for sustain.'
    },

    time_skip: {
        id: 'time_skip',
        name: 'Time Skip',
        icon: 'clock',
        mana: 90,
        type: 'self',
        cooldown: 5,
        maxUses: 1,
        desc: 'Grants an immediate extra turn. Can only be used once per battle. (5 turn cooldown)'
    },

    berserk_mode: {
        id: 'berserk_mode',
        name: 'Berserk Mode',
        img: '/public/assets/icons/skills/berserk_mode.png',
        mana: 65,
        type: 'self',
        buff: {
            id: 'berserk_mode',
            atkBonus: 1.0,
            defPenalty: -0.5,
            duration: 3
        },
        desc: 'Increases ATK by 100% but reduces DEF by 50% for 3 turns. High risk, high reward.'
    },

    // ========================================
    // AETHERY sayS MONSTER SKILLS
    // ========================================
    arcane_fragment_blast: {
        id: 'arcane_fragment_blast',
        name: 'Arcane Fragment',
        icon: 'sparkles',
        mana: 6,
        dmgMult: 0.9,
        type: 'single',
        damageType: 'magic',
        element: 'neutral',
        desc: 'A basic magical fragment attack.'
    },
    cursed_book_curse: {
        id: 'cursed_book_curse',
        name: 'Cursed Page',
        icon: 'book',
        mana: 12,
        dmgMult: 0.95,
        type: 'single',
        damageType: 'magic',
        element: 'shadow',
        debuff: { id: 'cursed_book', stats: { int: -2, dex: -1 }, duration: 2 },
        desc: 'Dark magic that weakens the target\'s mind and reflexes.'
    },
    floating_orb_blast: {
        id: 'floating_orb_blast',
        name: 'Orb Blast',
        icon: 'circle',
        mana: 10,
        dmgMult: 1.0,
        type: 'single',
        damageType: 'magic',
        element: 'neutral',
        buff: { id: 'floating_orb', flee: 30, duration: 1 },
        desc: 'A magical orb attack that increases evasion.'
    },
    possessed_armor_strike: {
        id: 'possessed_armor_strike',
        name: 'Armor Strike',
        icon: 'shield',
        mana: 14,
        dmgMult: 1.1,
        type: 'single',
        desc: 'A physical strike from animated armor.'
    },
    shadow_wisp_drain: {
        id: 'shadow_wisp_drain',
        name: 'Shadow Drain',
        icon: 'moon',
        mana: 16,
        dmgMult: 0.85,
        type: 'single',
        damageType: 'magic',
        element: 'shadow',
        drainPercent: 0.3,
        desc: 'Drains life force with dark magic.'
    },
    golem_arcane_blast: {
        id: 'golem_arcane_blast',
        name: 'Arcane Blast',
        icon: 'sparkles',
        mana: 20,
        dmgMult: 1.2,
        type: 'single',
        damageType: 'magic',
        element: 'neutral',
        desc: 'A powerful arcane attack from a magical golem.'
    },
    skeleton_mage_bolt: {
        id: 'skeleton_mage_bolt',
        name: 'Dark Bolt',
        icon: 'skull',
        mana: 18,
        dmgMult: 1.15,
        type: 'single',
        damageType: 'magic',
        element: 'shadow',
        desc: 'A dark magic bolt from an undead mage.'
    },
    gargoyle_stone_strike: {
        id: 'gargoyle_stone_strike',
        name: 'Stone Strike',
        icon: 'mountain',
        mana: 22,
        dmgMult: 1.3,
        type: 'single',
        desc: 'A powerful physical strike from a stone gargoyle.'
    },
    wraith_soul_drain: {
        id: 'wraith_soul_drain',
        name: 'Soul Drain',
        icon: 'ghost',
        mana: 25,
        dmgMult: 0.9,
        type: 'single',
        damageType: 'magic',
        element: 'shadow',
        drainPercent: 0.35,
        minDrain: 15,
        desc: 'Drains mana from the target\'s soul.'
    },
    arcane_construct_beam: {
        id: 'arcane_construct_beam',
        name: 'Arcane Beam',
        icon: 'zap',
        mana: 30,
        dmgMult: 1.4,
        type: 'single',
        damageType: 'magic',
        element: 'neutral',
        desc: 'A concentrated beam of arcane energy.'
    },
    archmage_specter_orb: {
        id: 'archmage_specter_orb',
        name: 'Arcane Orb',
        icon: 'sparkles',
        mana: 35,
        dmgMult: 1.2,
        type: 'single',
        damageType: 'magic',
        element: 'neutral',
        desc: 'A powerful arcane orb attack.'
    },
    archmage_specter_storm: {
        id: 'archmage_specter_storm',
        name: 'Elemental Storm',
        icon: 'cloud-lightning',
        mana: 50,
        dmgMult: 0.9,
        type: 'aoe',
        damageType: 'magic',
        element: 'neutral',
        effects: [
            { id: 'burn', chance: 0.3, duration: 2 },
            { id: 'freeze', chance: 0.2, duration: 1 }
        ],
        desc: 'A devastating storm of multiple elements affecting all enemies.'
    },
    archmage_specter_focus: {
        id: 'archmage_specter_focus',
        name: 'Arcane Focus',
        icon: 'eye',
        mana: 30,
        dmgMult: 0,
        type: 'self',
        buff: {
            id: 'archmage_focus',
            damageDealt: 1.3,
            critBonus: 10,
            duration: 3
        },
        desc: 'Focuses arcane power, increasing damage and critical chance.'
    }
};

