window.combatData = {
    // Definitions of all playable entities (Classes & Monsters)
    entities: {
        // --- CLASSES ---
        hero_blacksmith: {
            name: 'Blacksmith', type: 'class', img: 'assets/img/blacksmith-male.png',
            attributes: { str: 30, agi: 20, vit: 25, int: 10, dex: 20, luk: 15 },
            maxHp: 200, maxMana: 100, baseLevel: 10,
            skills: ['bash', 'repair', 'fortify']
        },
        hero_mage: {
            name: 'Mage', type: 'class', img: 'assets/img/mage-male.png',
            attributes: { str: 5, agi: 15, vit: 10, int: 35, dex: 25, luk: 10 },
            maxHp: 120, maxMana: 300, baseLevel: 10,
            skills: ['fireball', 'frost', 'meteor', 'shock']
        },
        hero_brawler: {
            name: 'Swordman', type: 'class', img: 'assets/img/swordman-male.png',
            attributes: { str: 35, agi: 15, vit: 30, int: 5, dex: 15, luk: 10 },
            maxHp: 250, maxMana: 80, baseLevel: 10,
            skills: ['heavy_slash', 'parry_stance']
        },
        hero_archer: {
            name: 'Archer', type: 'class', img: 'assets/img/archer-female.png', video: 'assets/video/archer-female.mp4',
            attributes: { str: 10, agi: 35, vit: 15, int: 10, dex: 40, luk: 15 },
            maxHp: 150, maxMana: 120, baseLevel: 10,
            skills: ['poison_tip', 'multishot']
        },
        hero_rogue: {
            name: 'Rogue', type: 'class', img: 'assets/img/rogue-male.png',
            attributes: { str: 15, agi: 40, vit: 10, int: 10, dex: 30, luk: 35 },
            maxHp: 140, maxMana: 100, baseLevel: 10,
            skills: ['backstab', 'toxin']
        },
        hero_cleric: {
            name: 'Cleric', type: 'class', img: 'assets/img/cleric-female.png',
            attributes: { str: 10, agi: 10, vit: 20, int: 30, dex: 15, luk: 20 },
            maxHp: 160, maxMana: 250, baseLevel: 10,
            skills: ['heal', 'smite', 'bless']
        },

        // --- MONSTERS ---
        wolf: {
            name: 'Dire Wolf', type: 'monster', img: 'assets/img/wolf.png', video: 'assets/video/wolf.mp4',
            attributes: { str: 20, agi: 30, vit: 15, int: 5, dex: 25, luk: 10 },
            maxHp: 180, maxMana: 50, baseLevel: 3,
            skills: ['bite', 'howl']
        },
        orc: {
            name: 'Orc Warrior', type: 'monster', img: 'assets/img/orc.png', video: 'assets/video/orc.mp4',
            attributes: { str: 40, agi: 10, vit: 35, int: 5, dex: 10, luk: 5 },
            maxHp: 300, maxMana: 40, baseLevel: 5,
            skills: ['smash', 'rage']
        },
        slime: {
            name: 'Green Slime', type: 'monster', img: 'assets/img/slime.png', video: 'assets/video/slime.mp4',
            attributes: { str: 10, agi: 5, vit: 40, int: 10, dex: 5, luk: 20 },
            maxHp: 220, maxMana: 20, baseLevel: 1,
            skills: ['dissolve', 'bounce']
        },
        goblin: {
            name: 'Goblin Scout', type: 'monster', img: 'assets/img/goblin.png',
            attributes: { str: 10, agi: 25, vit: 10, int: 15, dex: 20, luk: 30 },
            maxHp: 100, maxMana: 60, baseLevel: 2,
            skills: ['stab', 'loot'],
            lootTable: { goldMin: 10, goldMax: 25, xp: 45, items: [{ id: 'goblin_ear', chance: 0.8, rarity: 'common' }] }
        },
        hobgoblin: {
            name: 'Hobgoblin Brute', type: 'monster', img: 'assets/img/swordman-female.png',
            attributes: { str: 35, agi: 5, vit: 40, int: 5, dex: 15, luk: 5 },
            maxHp: 350, maxMana: 50, baseLevel: 8,
            skills: ['heavy_slam'],
            lootTable: { goldMin: 30, goldMax: 60, xp: 80, items: [{ id: 'iron_shard', chance: 0.7, rarity: 'common' }] }
        },
        bandit: {
            name: 'Bandit Archer', type: 'monster', img: 'assets/img/archer-female.png', video: 'assets/video/archer-female.mp4',
            attributes: { str: 15, agi: 35, vit: 15, int: 5, dex: 40, luk: 10 },
            maxHp: 160, maxMana: 80, baseLevel: 4,
            skills: ['poison_tip'],
            lootTable: { goldMin: 15, goldMax: 35, xp: 55, items: [{ id: 'broken_arrow', chance: 0.8, rarity: 'common' }] }
        }
    },

    // Skill Definitions
    skills: {
        // Physical
        bash: { name: 'Heavy Bash', mana: 20, dmgMult: 1.2, icon: 'shield', img: 'assets/icons/skills/1.png', desc: '40% Stun chance.', mobile: true, type: 'single', effect: { id: 'stun', chance: 0.4, duration: 1 } },
        heavy_slash: { name: 'Heavy Slash', mana: 20, dmgMult: 1.3, icon: 'sword', img: 'assets/icons/skills/1.png', type: 'single' },
        backstab: { name: 'Backstab', mana: 30, dmgMult: 1.8, icon: 'dagger', img: 'assets/icons/skills/3.png', desc: 'High crit chance.', type: 'single' },
        smash: { name: 'Smash', mana: 25, dmgMult: 1.4, icon: 'hammer', type: 'single' },
        stab: { name: 'Stab', mana: 10, dmgMult: 1.1, icon: 'sword', type: 'single' },
        bite: { name: 'Feral Bite', mana: 15, dmgMult: 1.2, icon: 'frown', type: 'single', effect: { id: 'bleed', chance: 0.4, duration: 2 } },

        // Magic
        fireball: { name: 'Fireball', mana: 30, dmgMult: 1.8, icon: 'flame', img: 'assets/icons/skills/2.png', desc: '50% Burn chance.', type: 'single', effect: { id: 'burn', chance: 0.5, duration: 3 } },
        frost: { name: 'Frost Bolt', mana: 40, dmgMult: 1.6, icon: 'snowflake', img: 'assets/icons/skills/2.png', desc: '20% Freeze chance.', type: 'single', effect: { id: 'freeze', chance: 0.2, duration: 1 } },
        shock: { name: 'Thunder Clap', mana: 30, dmgMult: 1.4, icon: 'zap', img: 'assets/icons/skills/3.png', desc: '50% Paralyze chance.', type: 'single', effect: { id: 'paralyze', chance: 0.5, duration: 2 } },
        meteor: { name: 'Meteor Storm', mana: 60, dmgMult: 2.0, icon: 'flame', img: 'assets/icons/skills/1.png', desc: 'Massive area fire damage.', type: 'aoe', effect: { id: 'burn', chance: 0.3, duration: 3 } },
        toxin: { name: 'Envenom', mana: 25, dmgMult: 1.1, icon: 'skull', img: 'assets/icons/skills/3.png', desc: '80% Poison chance.', type: 'single', effect: { id: 'poison', chance: 0.8, duration: 4 } },
        poison_tip: { name: 'Poison Tip', mana: 25, dmgMult: 1.2, icon: 'skull', effect: { id: 'poison', chance: 0.6, duration: 3 } },
        dissolve: { name: 'Acid Dissolve', mana: 20, dmgMult: 1.3, icon: 'droplet', effect: { id: 'burn', chance: 0.5, duration: 2 } },

        // Support/Buffs
        heal: { name: 'Heal', mana: 30, dmgMult: 0, icon: 'heart', img: 'assets/icons/skills/2.png', desc: 'Restores HP.', type: 'self' },
        rally: { name: 'Recover', mana: 50, dmgMult: 0, icon: 'flag', img: 'assets/icons/skills/2.png', desc: 'Heal self.', type: 'self' },
        fortify: { name: 'Fortify', mana: 40, dmgMult: 0, icon: 'shield', desc: 'Boost Defense.', type: 'self' },
        howl: { name: 'Pack Howl', mana: 20, dmgMult: 0, icon: 'speaker', desc: 'Buffs attack.', type: 'self' },
        bless: { name: 'Blessing', mana: 40, dmgMult: 0, icon: 'sun', desc: 'Buffs stats.', type: 'self' },
        rage: { name: 'Battle Rage', mana: 0, dmgMult: 0, icon: 'frown', desc: 'Increases damage taken and dealt.', type: 'self' },
        loot: { name: 'Pickpocket', mana: 5, dmgMult: 0.2, icon: 'coins', desc: 'Steals gold.', type: 'single' },
        repair: { name: 'Field Repair', mana: 20, dmgMult: 0, icon: 'hammer', desc: 'Heals armor.', type: 'self' },
        parry_stance: { name: 'Parry Stance', mana: 15, dmgMult: 0, icon: 'shield', desc: 'Chance to blocks.', type: 'self' },
        multishot: { name: 'Multishot', mana: 40, dmgMult: 0.8, icon: 'target', desc: 'Hits all enemies.', type: 'aoe' },
        bounce: { name: 'Bounce', mana: 10, dmgMult: 1.0, icon: 'circle', desc: 'Squishy attack.', type: 'single' },
        heavy_slam: { name: 'Heavy Slam', mana: 15, dmgMult: 1.3, icon: 'hammer', effect: { id: 'stun', chance: 0.25, duration: 1 } },
        smite: { name: 'Holy Smite', mana: 35, dmgMult: 1.5, icon: 'sun', desc: 'Holy damage.', type: 'single' }
    },

    items: {
        goblin_ear: { name: 'Goblin Ear', type: 'Materials', desc: 'A disgusting trophy.', icon: 'origami', rarity: 'common' },
        mystic_scroll: { name: 'Mystic Scroll', type: 'Consumable', desc: 'Faint energy glows.', icon: 'scroll', rarity: 'uncommon' },
        goblin_staff: { name: 'Goblin Staff', type: 'Weapon', desc: 'Smells of charcoal.', icon: 'wand-2', rarity: 'rare' },
        iron_shard: { name: 'Iron Shard', type: 'Materials', desc: 'Rusty but useful.', icon: 'hammer', rarity: 'common' },
        heavy_plated_belt: { name: 'Plated Belt', type: 'Equipment', desc: 'High defense.', icon: 'shield-check', rarity: 'uncommon' },
        hobgoblin_hammer: { name: 'Hobgoblin Mauler', type: 'Weapon', desc: 'Pure brute force.', icon: 'swords', rarity: 'epic' },
        broken_arrow: { name: 'Broken Arrow', type: 'Materials', desc: 'Good for wood.', icon: 'target', rarity: 'common' },
        leather_quiver: { name: 'Sturdy Quiver', type: 'Equipment', desc: 'Increases speed.', icon: 'briefcase', rarity: 'uncommon' },
        hunters_bow: { name: 'Hunters Longbow', type: 'Weapon', desc: 'Piercing power.', icon: 'target', rarity: 'rare' }
    }
};
