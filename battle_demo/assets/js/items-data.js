window.setItemData = {
    'valkyrie': {
        name: 'Fallen Valkyrie',
        desc: 'Armor of the chosen warriors of Odin.',
        bonuses: [
            { count: 2, stats: { vit: 50, defense: 100 }, desc: 'Valkyrie\'s Protection' },
            { count: 3, stats: { all_stats: 30, resist_all: 15 }, desc: 'Valkyrie\'s Blessing' },
            { count: 4, stats: { map: 50, p_pierce: 10 }, desc: 'Valkyrie\'s Might' },
            { count: 5, stats: { all_stats: 100, dmg_final: 20 }, desc: 'Valkyrie\'s Awakening' }
        ]
    },
    'wind_stalker': {
        name: 'Wind Stalker',
        desc: 'Gear designed for the ultimate evasion.',
        bonuses: [
            { count: 2, stats: { agi: 40, flee: 100 }, desc: 'Wind Walk' },
            { count: 3, stats: { dex: 50, crit: 25 }, desc: 'Storm Eye' },
            { count: 4, stats: { aspd: 20, movement_speed: 15 }, desc: 'Zephyr' },
            { count: 5, stats: { agi: 120, flee: 500, crit_dmg: 40 }, desc: 'God of Gale' }
        ]
    },
    'arcane_master': {
        name: 'Arcane Master',
        desc: 'Resonance between ancient magical artifacts.',
        bonuses: [
            { count: 2, stats: { int: 60, mana: 500 }, desc: 'Mana Flow' },
            { count: 3, stats: { matk: 200, all_stats: 20 }, desc: 'Arcane Singularity' },
            { count: 4, stats: { m_pierce: 15, cooldown_reduction: 10 }, desc: 'Spellweave' },
            { count: 5, stats: { int: 150, matk: 500, matk_percent: 25 }, desc: 'Omniscience' }
        ]
    }
};

window.itemsData = {
    // --- CONSUMABLES ---
    potion_hp: {
        id: 'potion_hp',
        name: 'HP Potion',
        type: 'Consumable',
        desc: 'Restores 50 HP.',
        icon: 'heart',
        healHp: 50,
        rarity: 'common'
    },
    potion_mana: {
        id: 'potion_mana',
        name: 'Mana Potion',
        type: 'Consumable',
        desc: 'Restores 30 Mana.',
        icon: 'zap',
        restoreMana: 30,
        rarity: 'common'
    },
    potion_antidote: {
        id: 'potion_antidote',
        name: 'Antidote',
        type: 'Consumable',
        desc: 'Cures Poison status.',
        icon: 'skull',
        cureStatus: ['poison'],
        rarity: 'common'
    },
    potion_panacea: {
        id: 'potion_panacea',
        name: 'Panacea',
        type: 'Consumable',
        desc: 'Cures all negative statuses.',
        icon: 'sparkles',
        cureAllStatuses: true,
        rarity: 'rare'
    },
    poison_vial: {
        id: 'poison_vial',
        name: 'Poison Vial',
        type: 'Consumable',
        desc: 'Applies Poison to an enemy.',
        icon: 'skull',
        applyStatus: { id: 'poison', chance: 1.0, duration: 3 },
        rarity: 'uncommon',
        target: 'enemy'
    },

    // --- WEAPONS (Right Hand / Both Hands) ---
    iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_swordman'],
        stats: { str: 4, dex: 2 },
        desc: 'A standard-issue iron sword for infantry.',
        rarity: 'common'
    },
    flame_sabre: {
        id: 'flame_sabre',
        name: 'Flame Sabre',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_swordman'],
        stats: { str: 6, int: 4 },
        elementOverride: 'fire',
        desc: 'A blade forged in volcanic heat. Strikes with fire.',
        rarity: 'rare'
    },
    apprentice_staff: {
        id: 'apprentice_staff',
        name: 'Apprentice Staff',
        type: 'Equipment',
        slot: 'right_hand', // Mage can use shield with 1H staff
        requiredClass: ['hero_mage'],
        stats: { int: 5, luk: 2 },
        desc: 'A simple oak staff for practicing magic.',
        rarity: 'common'
    },
    archmage_staff: {
        id: 'archmage_staff',
        name: 'Archmage Staff',
        type: 'Equipment',
        slot: 'right_hand',
        isTwoHanded: true, // Takes both hands
        requiredClass: ['hero_mage'],
        stats: { int: 15, luk: 10, matk: 20 },
        desc: 'A legendary staff that hums with immense power.',
        rarity: 'epic'
    },
    hunters_bow: {
        id: 'hunters_bow',
        name: 'Hunters Longbow',
        type: 'Equipment',
        slot: 'right_hand',
        isTwoHanded: true,
        requiredClass: ['hero_archer'],
        stats: { dex: 8, agi: 4, hit: 15 },
        elementOverride: 'wind',
        desc: 'A composite bow that favors precision and speed.',
        rarity: 'rare'
    },

    // --- ARMOR ---
    iron_plate: {
        id: 'iron_plate',
        name: 'Iron Plate',
        type: 'Equipment',
        slot: 'body',
        stats: { vit: 10, agi: -2 },
        desc: 'Heavy iron protection. Reduces agility.',
        rarity: 'uncommon'
    },
    traveler_boots: {
        id: 'traveler_boots',
        name: 'Traveler Boots',
        type: 'Equipment',
        slot: 'boots',
        stats: { agi: 5, flee: 10 },
        desc: 'Worn out but incredibly light boots.',
        rarity: 'common'
    },
    steel_shield: {
        id: 'steel_shield',
        name: 'Steel Shield',
        type: 'Equipment',
        slot: 'left_hand',
        stats: { vit: 5, defense: 10 },
        desc: 'A solid steel shield to block physical strikes.',
        rarity: 'uncommon'
    },

    // --- HEAD ---
    feathered_hat: {
        id: 'feathered_hat',
        name: 'Feathered Hat',
        type: 'Equipment',
        slot: 'head',
        stats: { dex: 3, luk: 5 },
        desc: 'A stylish hat that brings good luck.',
        rarity: 'common'
    },

    // --- ACCESSORIES ---
    ring_of_might: {
        id: 'ring_of_might',
        name: 'Ring of Might',
        type: 'Equipment',
        slot: 'accessory_1',
        stats: { str: 5 },
        desc: 'A gold ring that boosts physical power.',
        rarity: 'rare'
    },

    // --- NEW WEAPONS ---
    rusty_dagger: {
        id: 'rusty_dagger',
        name: 'Rusty Dagger',
        type: 'Equipment',
        slot: 'right_hand',
        stats: { str: 1, dex: 1 },
        desc: 'A small, pitted blade. Better than nothing.',
        rarity: 'common'
    },
    thief_stiletto: {
        id: 'thief_stiletto',
        name: 'Thief Stiletto',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_archer', 'hero_mage'],
        stats: { agi: 3, dex: 2 },
        desc: 'A slim blade designed for quick, precise strikes.',
        rarity: 'uncommon'
    },
    assassin_blade: {
        id: 'assassin_blade',
        name: 'Assassin Blade',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_archer'],
        stats: { agi: 5, dex: 5, crit: 10 },
        desc: 'A darkened blade that thirsts for vital points.',
        rarity: 'rare'
    },
    silver_rapier: {
        id: 'silver_rapier',
        name: 'Silver Rapier',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_swordman', 'hero_archer'],
        stats: { str: 3, agi: 3 },
        desc: 'An elegant silver sword that favors finesse.',
        rarity: 'uncommon'
    },
    heavy_mace: {
        id: 'heavy_mace',
        name: 'Heavy Mace',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_swordman'],
        stats: { str: 6, vit: 2 },
        desc: 'A blunt instrument of pure destruction.',
        rarity: 'uncommon'
    },
    battle_axe: {
        id: 'battle_axe',
        name: 'Battle Axe',
        type: 'Equipment',
        slot: 'right_hand',
        isTwoHanded: true,
        requiredClass: ['hero_swordman'],
        stats: { str: 12, vit: 4 },
        desc: 'A massive double-headed axe that requires two hands.',
        rarity: 'rare'
    },
    willow_wand: {
        id: 'willow_wand',
        name: 'Willow Wand',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_mage'],
        stats: { int: 2, mana: 10 },
        desc: 'A simple wand carved from a willow tree.',
        rarity: 'common'
    },
    crystal_staff: {
        id: 'crystal_staff',
        name: 'Crystal Staff',
        type: 'Equipment',
        slot: 'right_hand',
        isTwoHanded: true,
        requiredClass: ['hero_mage'],
        stats: { int: 8, matk: 10 },
        desc: 'A staff tipped with a pulsating crystal.',
        rarity: 'uncommon'
    },
    short_bow: {
        id: 'short_bow',
        name: 'Short Bow',
        type: 'Equipment',
        slot: 'right_hand',
        isTwoHanded: true,
        requiredClass: ['hero_archer'],
        stats: { dex: 3, hit: 5 },
        desc: 'A lightweight bow, easy to handle.',
        rarity: 'common'
    },
    valkyrie_spear: {
        id: 'valkyrie_spear',
        name: 'Valkyrie Spear',
        type: 'Equipment',
        slot: 'right_hand',
        requiredClass: ['hero_swordman'],
        stats: { str: 10, agi: 8, ignore_def: 15 },
        desc: 'A legendary spear that pierces through any defense.',
        rarity: 'epic'
    },

    // --- NEW ARMOR & BOOTS ---
    novice_tunic: {
        id: 'novice_tunic',
        name: 'Novice Tunic',
        type: 'Equipment',
        slot: 'body',
        stats: { vit: 2, defense: 5 },
        desc: 'Simple cloth protection for beginners.',
        rarity: 'common'
    },
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'Equipment',
        slot: 'body',
        stats: { vit: 5, agi: 2, defense: 15 },
        desc: 'Flexible leather protection offering good mobility.',
        rarity: 'uncommon'
    },
    wizard_robe: {
        id: 'wizard_robe',
        name: 'Wizard Robe',
        type: 'Equipment',
        slot: 'body',
        requiredClass: ['hero_mage'],
        stats: { int: 4, mana: 50, defense: 10 },
        desc: 'Silken robes infused with mana.',
        rarity: 'uncommon'
    },
    dragon_scale_mail: {
        id: 'dragon_scale_mail',
        name: 'Dragon Scale Mail',
        type: 'Equipment',
        slot: 'body',
        stats: { vit: 20, defense: 50, resist_fire: 25 },
        desc: 'Armor forged from the scales of a red dragon.',
        rarity: 'legendary'
    },
    leather_boots: {
        id: 'leather_boots',
        name: 'Leather Boots',
        type: 'Equipment',
        slot: 'boots',
        stats: { agi: 2 },
        desc: 'Standard leather footwear.',
        rarity: 'common'
    },
    heavy_greaves: {
        id: 'heavy_greaves',
        name: 'Heavy Greaves',
        type: 'Equipment',
        slot: 'boots',
        stats: { vit: 4, defense: 5 },
        desc: 'Reinforced leg protection.',
        rarity: 'uncommon'
    },
    hermes_sandals: {
        id: 'hermes_sandals',
        name: 'Hermes Sandals',
        type: 'Equipment',
        slot: 'boots',
        stats: { agi: 10, flee: 20 },
        desc: 'Magical sandals that grant extraordinary speed.',
        rarity: 'rare'
    },

    // --- NEW ACCESSORIES ---
    iron_ring: {
        id: 'iron_ring',
        name: 'Iron Ring',
        type: 'Equipment',
        slot: 'accessory_1',
        stats: { str: 2 },
        desc: 'A simple iron band.',
        rarity: 'common'
    },
    silver_pendant: {
        id: 'silver_pendant',
        name: 'Silver Pendant',
        type: 'Equipment',
        slot: 'accessory_1',
        stats: { int: 3, mana: 20 },
        desc: 'A decorative silver pendant that aids focus.',
        rarity: 'uncommon'
    },
    rabbit_foot: {
        id: 'rabbit_foot',
        name: 'Rabbit Foot',
        type: 'Equipment',
        slot: 'accessory_1',
        stats: { luk: 5 },
        desc: 'A lucky charm carried by many travelers.',
        rarity: 'uncommon'
    },
    dragon_eye_amulet: {
        id: 'dragon_eye_amulet',
        name: 'Dragon Eye Amulet',
        type: 'Equipment',
        slot: 'accessory_1',
        stats: { all_stats: 5, hit: 20 },
        desc: 'The preserved eye of a dragon, granting keen insight.',
        rarity: 'legendary'
    },

    // --- SWORDMAN WEAPONS (25 items) ---
    sm_training_sword: { id: 'sm_training_sword', name: 'Wooden Training Sword', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 1, rarity: 'common', stats: { str: 2 }, desc: 'A blunt wooden sword for recruits.' },
    sm_rusty_iron_sword: { id: 'sm_rusty_iron_sword', name: 'Rusty Iron Sword', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 5, rarity: 'common', stats: { str: 4, dex: -1 }, desc: 'A weathered blade that still cuts.' },
    sm_novice_gladius: { id: 'sm_novice_gladius', name: 'Novice Gladius', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 10, rarity: 'common', stats: { str: 6, agi: 1 }, desc: 'A short, reliable infantry sword.' },
    sm_soldiers_blade: { id: 'sm_soldiers_blade', name: 'Soldier\'s Blade', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 15, rarity: 'common', stats: { str: 8, vit: 2 }, desc: 'Standard issue for frontier guards.' },
    sm_heavy_cleaver: { id: 'sm_heavy_cleaver', name: 'Heavy Cleaver', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 20, rarity: 'uncommon', stats: { str: 12, agi: -2 }, desc: 'A broad blade designed for chopping.' },
    sm_sergeant_sabre: { id: 'sm_sergeant_sabre', name: 'Sergeant\'s Sabre', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 25, rarity: 'uncommon', stats: { str: 10, agi: 4 }, desc: 'A curved blade favored by squad leaders.' },
    sm_vanguard_sword: { id: 'sm_vanguard_sword', name: 'Vanguard Broadsword', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 30, rarity: 'uncommon', stats: { str: 15, vit: 5 }, desc: 'Forged for those who lead the charge.' },
    sm_polished_rapier: { id: 'sm_polished_rapier', name: 'Polished Rapier', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 35, rarity: 'uncommon', stats: { dex: 8, agi: 8 }, desc: 'A fast, elegant weapon for duelists.' },
    sm_obsidian_mace: { id: 'sm_obsidian_mace', name: 'Obsidian Mace', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 40, rarity: 'rare', stats: { str: 20, vit: 8 }, desc: 'Igneous rock crafted into a crushing tool.' },
    sm_silver_falchion: { id: 'sm_silver_falchion', name: 'Silver Falchion', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 45, rarity: 'rare', stats: { str: 18, luk: 10 }, desc: 'Beautifully crafted with holy silver.' },
    sm_mythril_edge: { id: 'sm_mythril_edge', name: 'Mythril Edge', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 50, rarity: 'rare', stats: { str: 25, dex: 10, agi: 5 }, desc: 'Incredibly light and sharp mythril blade.' },
    sm_titan_claymore: { id: 'sm_titan_claymore', name: 'Titan Claymore', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 55, rarity: 'rare', isTwoHanded: true, stats: { str: 45, vit: 15, agi: -10 }, desc: 'A massive blade that shakes the earth.' },
    sm_dragon_slayer: { id: 'sm_dragon_slayer', name: 'Dragon Slayer V1', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 60, rarity: 'epic', stats: { str: 35, vit: 20 }, desc: 'Old legends say it has tasted dragon blood.' },
    sm_soul_eater: { id: 'sm_soul_eater', name: 'Soul Eater Daito', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 65, rarity: 'epic', stats: { str: 40, dex: 15, luk: -5 }, desc: 'A cursed blade that hungers for souls.' },
    sm_paladins_pride: { id: 'sm_paladins_pride', name: 'Paladin\'s Pride', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 70, rarity: 'epic', stats: { str: 30, vit: 30, int: 10 }, desc: 'The holy sword of a fallen protector.', set: 'valkyrie' },
    sm_excalibur_shard: { id: 'sm_excalibur_shard', name: 'Excalibur Shard', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 75, rarity: 'epic', stats: { str: 50, luk: 20 }, desc: 'A broken piece of a mythical sword.' },
    sm_demon_king_axe: { id: 'sm_demon_king_axe', name: 'Demon King\'s Axe', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 80, rarity: 'epic', isTwoHanded: true, stats: { str: 80, vit: -20 }, desc: 'Brutal power at a terrible cost.' },
    sm_heavenly_spear: { id: 'sm_heavenly_spear', name: 'Heavenly Spear', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 85, rarity: 'legendary', stats: { str: 60, agi: 30, hit: 50 }, desc: 'A divine weapon that never misses its mark.' },
    sm_void_cutter: { id: 'sm_void_cutter', name: 'Void Cutter', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 90, rarity: 'legendary', stats: { str: 75, dex: 40 }, desc: 'A blade that tears through the fabric of reality.' },
    sm_ragnarok_blade: { id: 'sm_ragnarok_blade', name: 'Ragnarok Blade', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 95, rarity: 'legendary', isTwoHanded: true, stats: { str: 120, vit: 50, all_stats: 10 }, desc: 'The sword that signals the end of worlds.' },
    sm_omnislash_katana: { id: 'sm_omnislash_katana', name: 'Omnislash Katana', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_swordman'], requiredLevel: 100, rarity: 'legendary', stats: { str: 100, agi: 100, dex: 100 }, desc: 'The ultimate weapon of a legendary swordsman.' },
    sm_iron_shield_v2: { id: 'sm_iron_shield_v2', name: 'Reinforced Iron Shield', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_swordman'], requiredLevel: 10, rarity: 'common', stats: { vit: 10, defense: 20 }, desc: 'Better than a wooden board.' },
    sm_knight_shield: { id: 'sm_knight_shield', name: 'Knight\'s Greatshield', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_swordman'], requiredLevel: 40, rarity: 'rare', stats: { vit: 30, defense: 100, agi: -10 }, desc: 'Unbreakable wall of steel.' },
    sm_aegis_shield: { id: 'sm_aegis_shield', name: 'Aegis Shield', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_swordman'], requiredLevel: 80, rarity: 'legendary', stats: { vit: 100, defense: 500, resist_all: 20 }, desc: 'The shield of the gods.' },

    // --- ARCHER WEAPONS (25 items) ---
    ar_wooden_bow: { id: 'ar_wooden_bow', name: 'Wooden Shortbow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 1, rarity: 'common', stats: { dex: 3, hit: 5 }, desc: 'A child\'s first hunting tool.' },
    ar_recurve_bow: { id: 'ar_recurve_bow', name: 'Recurve Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 5, rarity: 'common', stats: { dex: 5, agi: 2 }, desc: 'Standard hunting bow.' },
    ar_iron_crossbow: { id: 'ar_iron_crossbow', name: 'Iron Crossbow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 10, rarity: 'common', stats: { dex: 8, hit: 10, agi: -2 }, desc: 'Heavy but packs a punch.' },
    ar_scenic_bow: { id: 'ar_scenic_bow', name: 'Scenic Longbow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 15, rarity: 'common', stats: { dex: 10, agi: 5 }, desc: 'Well-balanced for long range.' },
    ar_thief_dagger: { id: 'ar_thief_dagger', name: 'Thief\'s Main Gauche', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_archer', 'hero_swordman'], requiredLevel: 20, rarity: 'uncommon', stats: { dex: 5, agi: 5, flee: 10 }, desc: 'A defensive dagger.' },
    ar_poison_sting: { id: 'ar_poison_sting', name: 'Poison Sting', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_archer'], requiredLevel: 25, rarity: 'uncommon', stats: { dex: 12, luk: 5 }, desc: 'Coated in a mild toxin.' },
    ar_silver_strung: { id: 'ar_silver_strung', name: 'Silver-Strung Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 30, rarity: 'uncommon', stats: { dex: 15, int: 5 }, desc: 'Favored by elven archers.' },
    ar_double_shot: { id: 'ar_double_shot', name: 'Double-Shot Repeater', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 35, rarity: 'uncommon', stats: { dex: 18, agi: 10 }, desc: 'Mechanized firing speed.' },
    ar_eagle_eye: { id: 'ar_eagle_eye', name: 'Eagle Eye Longbow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 40, rarity: 'rare', stats: { dex: 25, hit: 30 }, desc: 'Sniper-grade accuracy.' },
    ar_assassin_stiletto: { id: 'ar_assassin_stiletto', name: 'Assassin\'s Stiletto', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_archer'], requiredLevel: 45, rarity: 'rare', stats: { agi: 15, dex: 10, crit: 15 }, desc: 'Ideal for quiet eliminations.' },
    ar_windrunner_bow: { id: 'ar_windrunner_bow', name: 'Windrunner Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 50, rarity: 'rare', stats: { dex: 30, agi: 20 }, desc: 'Arrows fly like the wind.' },
    ar_shadow_drake: { id: 'ar_shadow_drake', name: 'Shadow Drake Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 55, rarity: 'rare', stats: { dex: 35, int: 10 }, desc: 'Carved from dark dragon bone.' },
    ar_hunters_mastery: { id: 'ar_hunters_mastery', name: 'Hunter\'s Mastery', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 60, rarity: 'epic', stats: { dex: 45, agi: 25, hit: 40 }, desc: 'Total control over every shot.' },
    ar_crimson_viper: { id: 'ar_crimson_viper', name: 'Crimson Viper Dagger', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_archer'], requiredLevel: 65, rarity: 'epic', stats: { dex: 20, agi: 30, crit: 25 }, desc: 'Strikes involve deadly poison.' },
    ar_moonlight_stalker: { id: 'ar_moonlight_stalker', name: 'Moonlight Stalker', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 70, rarity: 'epic', stats: { dex: 50, agi: 35, flee: 40 }, desc: 'Visible only under the moon.', set: 'wind_stalker' },
    ar_gales_breath: { id: 'ar_gales_breath', name: 'Gale\'s Breath', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 75, rarity: 'epic', stats: { dex: 55, agi: 50 }, desc: 'Shoots vacuum blades.' },
    ar_dragonfire_bow: { id: 'ar_dragonfire_bow', name: 'Dragonfire Greatbow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 80, rarity: 'epic', stats: { dex: 70, str: 20, hit: 50 }, desc: 'A bow that requires giant strength.' },
    ar_valkyrie_bow: { id: 'ar_valkyrie_bow', name: 'Valkyrie Hunting Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 85, rarity: 'legendary', stats: { dex: 80, agi: 60, all_stats: 5 }, desc: 'Used by the choosers of the slain.' },
    ar_artemis_gaze: { id: 'ar_artemis_gaze', name: 'Artemis\' Gaze', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 90, rarity: 'legendary', stats: { dex: 100, luk: 50, hit: 100 }, desc: 'The goddess herself guided these arrows.' },
    ar_starfall_repeater: { id: 'ar_starfall_repeater', name: 'Starfall Repeater', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 95, rarity: 'legendary', stats: { dex: 120, agi: 80 }, desc: 'Arrows rain down like falling stars.' },
    ar_omega_bow: { id: 'ar_omega_bow', name: 'Omega Bow', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 100, rarity: 'legendary', stats: { dex: 150, all_stats: 20 }, desc: 'The final word in archery.' },
    ar_dual_daggers: { id: 'ar_dual_daggers', name: 'Dual Shadow Daggers', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_archer'], requiredLevel: 50, rarity: 'rare', stats: { agi: 30, dex: 20, flee: 50, crit: 20 }, desc: 'Two blades are better than one.' },
    ar_quiver_infinity: { id: 'ar_quiver_infinity', name: 'Quiver of Infinity', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_archer'], requiredLevel: 10, rarity: 'common', stats: { dex: 2, hit: 5 }, desc: 'Endless supply of arrows.' },
    ar_quiver_fire: { id: 'ar_quiver_fire', name: 'Volcanic Quiver', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_archer'], requiredLevel: 40, rarity: 'rare', stats: { dex: 10, matk: 20 }, elementOverride: 'fire', desc: 'Arrows catch fire when drawn.' },
    ar_legendary_quiver: { id: 'ar_legendary_quiver', name: 'Quiver of the Wind God', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_archer'], requiredLevel: 80, rarity: 'legendary', stats: { dex: 50, agi: 50, flee: 50 }, desc: 'Surrounded by perpetual zephyrs.' },

    // --- MAGE WEAPONS (25 items) ---
    mg_oak_wand: { id: 'mg_oak_wand', name: 'Oak Wand', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 1, rarity: 'common', stats: { int: 3, mana: 10 }, desc: 'A basic focus for magic.' },
    mg_willow_staff: { id: 'mg_willow_staff', name: 'Willow Staff', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 5, rarity: 'common', stats: { int: 5, matk: 10 }, desc: 'Taller than it is powerful.' },
    mg_apprentice_orb: { id: 'mg_apprentice_orb', name: 'Apprentice Orb', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 10, rarity: 'common', stats: { int: 8, luk: 2 }, desc: 'A swirling glass orb.' },
    mg_sorcerer_wand: { id: 'mg_sorcerer_wand', name: 'Sorcerer\'s Wand', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 15, rarity: 'common', stats: { int: 12, mana: 30 }, desc: 'Balanced for spellcasting.' },
    mg_ruby_scepter: { id: 'mg_ruby_scepter', name: 'Ruby Scepter', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 20, rarity: 'uncommon', stats: { int: 15, matk: 20 }, desc: 'A gem-encrusted tool of power.' },
    mg_crystal_focus: { id: 'mg_crystal_focus', name: 'Crystal Focus', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 25, rarity: 'uncommon', stats: { int: 18, luk: 5 }, desc: 'Amplifies magical resonance.' },
    mg_eldritch_staff: { id: 'mg_eldritch_staff', name: 'Eldritch Staff', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 30, rarity: 'uncommon', stats: { int: 25, matk: 40, mana: 50 }, desc: 'Hums with otherworldly energy.' },
    mg_arcane_book: { id: 'mg_arcane_book', name: 'Arcane Spellbook', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 35, rarity: 'uncommon', stats: { int: 22, luk: 10 }, desc: 'Contains fundamental spells.' },
    mg_phoenix_wand: { id: 'mg_phoenix_wand', name: 'Phoenix Wand', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 40, rarity: 'rare', stats: { int: 30, matk: 50 }, elementOverride: 'fire', desc: 'Warm to the touch.' },
    mg_glacial_staff: { id: 'mg_glacial_staff', name: 'Glacial Staff', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 45, rarity: 'rare', stats: { int: 35, matk: 60 }, elementOverride: 'water', desc: 'Radiates a freezing aura.' },
    mg_sage_scepter: { id: 'mg_sage_scepter', name: 'Sage\'s Scepter', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 50, rarity: 'rare', stats: { int: 45, luk: 15, mana: 100 }, desc: 'Used by masters of the academy.' },
    mg_void_orb: { id: 'mg_void_orb', name: 'Void Orb', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 55, rarity: 'rare', stats: { int: 50, matk: 80, agi: 10 }, desc: 'Absorbs the light around it.' },
    mg_archmage_staff_v2: { id: 'mg_archmage_staff_v2', name: 'Archmage Staff Elite', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 60, rarity: 'epic', stats: { int: 70, matk: 120, mana: 200 }, desc: 'A masterpiece of arcane engineering.' },
    mg_necromancer_tome: { id: 'mg_necromancer_tome', name: 'Necromancer\'s Tome', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 65, rarity: 'epic', stats: { int: 60, matk: 100, vit: 20, luk: -10 }, desc: 'Bound in questionable leather.' },
    mg_celestial_wand: { id: 'mg_celestial_wand', name: 'Celestial Wand', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 70, rarity: 'epic', stats: { int: 80, luk: 30, hit: 50 }, desc: 'Harnesses the power of the stars.' },
    mg_dragon_breath_staff: { id: 'mg_dragon_breath_staff', name: 'Dragon Breath Staff', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 75, rarity: 'epic', stats: { int: 90, matk: 150 }, elementOverride: 'fire', desc: 'Infused with a dragon\'s core.' },
    mg_forbidden_knowledge: { id: 'mg_forbidden_knowledge', name: 'Tome of Forbidden Knowledge', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 80, rarity: 'epic', stats: { int: 100, matk: 200, mana: -100 }, desc: 'Power that demands a price.' },
    mg_merlin_staff: { id: 'mg_merlin_staff', name: 'Staff of Merlin', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 85, rarity: 'legendary', stats: { int: 120, matk: 250, all_stats: 10 }, desc: 'The original staff of the first archmage.', set: 'arcane_master' },
    mg_eye_of_sauron: { id: 'mg_eye_of_sauron', name: 'All-Seeing Eye Orb', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 90, rarity: 'legendary', stats: { int: 140, hit: 200, dex: 30 }, desc: 'Nothing escapes its vision.' },
    mg_infinity_wand: { id: 'mg_infinity_wand', name: 'Infinity Wand', type: 'Equipment', slot: 'right_hand', requiredClass: ['hero_mage'], requiredLevel: 95, rarity: 'legendary', stats: { int: 160, mana: 500, matk: 300 }, desc: 'Source of limitless magical energy.' },
    mg_genesis_staff: { id: 'mg_genesis_staff', name: 'Genesis Staff', type: 'Equipment', slot: 'right_hand', isTwoHanded: true, requiredClass: ['hero_mage'], requiredLevel: 100, rarity: 'legendary', stats: { int: 200, all_stats: 50, matk: 500 }, desc: 'The tool that shaped the universe.' },
    mg_mana_shield: { id: 'mg_mana_shield', name: 'Mana Shield Orb', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_mage'], requiredLevel: 20, rarity: 'uncommon', stats: { int: 5, defense: 30, mana: 50 }, desc: 'Converts mana into protection.' },
    mg_grimoire_fire: { id: 'mg_grimoire_fire', name: 'Grimoire of Flames', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_mage'], requiredLevel: 50, rarity: 'rare', stats: { int: 20, matk: 50 }, elementOverride: 'fire', desc: 'Self-igniting pages.' },
    mg_divine_relic: { id: 'mg_divine_relic', name: 'Holy Relic of Light', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_mage'], requiredLevel: 80, rarity: 'legendary', stats: { int: 50, luk: 50, hit: 50, resist_all: 10 }, desc: 'A sacred artifact.' },

    // --- ARMOR (Body Slots - 20+ items) ---
    am_leather_vest: { id: 'am_leather_vest', name: 'Leather Vest', type: 'Equipment', slot: 'body', requiredLevel: 1, rarity: 'common', stats: { defense: 10, vit: 2 }, desc: 'Simple protective vest.' },
    am_iron_plate: { id: 'am_iron_plate', name: 'Iron Plate Mail', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 15, rarity: 'common', stats: { defense: 50, vit: 10, agi: -5 }, desc: 'Heavy protection for soldiers.' },
    am_silk_robe: { id: 'am_silk_robe', name: 'Silk Robe', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 10, rarity: 'common', stats: { defense: 5, int: 5, mana: 50 }, desc: 'Allows for easy movement.' },
    am_scout_garb: { id: 'am_scout_garb', name: 'Scout Garb', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 10, rarity: 'common', stats: { defense: 20, agi: 5, flee: 10 }, desc: 'Camouflaged for the forest.' },
    am_hardened_leather: { id: 'am_hardened_leather', name: 'Hardened Leather', type: 'Equipment', slot: 'body', requiredLevel: 20, rarity: 'uncommon', stats: { defense: 40, vit: 8, agi: 2 }, desc: 'Reinforced leather armor.' },
    am_chainmail: { id: 'am_chainmail', name: 'Steel Chainmail', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 25, rarity: 'uncommon', stats: { defense: 80, vit: 15, agi: -2 }, desc: 'Flexible but heavy chain links.' },
    am_mystic_tunic: { id: 'am_mystic_tunic', name: 'Mystic Tunic', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 25, rarity: 'uncommon', stats: { defense: 15, int: 15, mana: 100 }, desc: 'Woven with mana-conductive thread.' },
    am_wind_stalker: { id: 'am_wind_stalker', name: 'Wind Stalker Suit', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 25, rarity: 'uncommon', stats: { defense: 35, agi: 15, flee: 15 }, desc: 'Lightweight suit for silent movement.' },
    am_brigandine: { id: 'am_brigandine', name: 'Brigandine', type: 'Equipment', slot: 'body', requiredLevel: 35, rarity: 'uncommon', stats: { defense: 60, vit: 12 }, desc: 'Plates riveted between layers of cloth.' },
    am_knight_armor: { id: 'am_knight_armor', name: 'Knight\'s Plate', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 40, rarity: 'rare', stats: { defense: 150, vit: 30, resist_phys: 10 }, desc: 'Elite heavy armor.' },
    am_wizard_coat: { id: 'am_wizard_coat', name: 'Wizard\'s Overcoat', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 40, rarity: 'rare', stats: { defense: 40, int: 30, matk: 40 }, desc: 'Embroidered with defensive runes.' },
    am_shadow_cloak: { id: 'am_shadow_cloak', name: 'Shadow Cloak', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 40, rarity: 'rare', stats: { defense: 60, agi: 25, flee: 50 }, desc: 'Makes the wearer hard to hit.' },
    am_templar_plate: { id: 'am_templar_plate', name: 'Templar Plate', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 55, rarity: 'rare', stats: { defense: 250, vit: 40, resist_dark: 20 }, desc: 'Blessed armor of the holy order.', set: 'valkyrie' },
    am_valkyrie_helm: { id: 'am_valkyrie_helm', name: 'Valkyrie Helm', type: 'Equipment', slot: 'head', requiredClass: ['hero_swordman'], requiredLevel: 65, rarity: 'epic', stats: { defense: 100, vit: 30, hit: 20 }, desc: 'Worn by the chosen of Odin.', set: 'valkyrie' },
    am_valkyrie_ring: { id: 'am_valkyrie_ring', name: 'Valkyrie Ring', type: 'Equipment', slot: 'accessory_1', requiredClass: ['hero_swordman'], requiredLevel: 60, rarity: 'rare', stats: { vit: 20, all_stats: 10 }, desc: 'Divine protection in ring form.', set: 'valkyrie' },
    am_valkyrie_shield: { id: 'am_valkyrie_shield', name: 'Valkyrie Shield', type: 'Equipment', slot: 'left_hand', requiredClass: ['hero_swordman'], requiredLevel: 70, rarity: 'epic', stats: { defense: 150, vit: 40, resist_all: 10 }, desc: 'A shield that never breaks.', set: 'valkyrie' },
    am_arcane_robes: { id: 'am_arcane_robes', name: 'Arcane Robes', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 55, rarity: 'rare', stats: { defense: 60, int: 50, mana: 300 }, desc: 'Robes that hum with power.' },
    am_elven_chain: { id: 'am_elven_chain', name: 'Elven Chainmail', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 55, rarity: 'rare', stats: { defense: 80, agi: 40, dex: 10 }, desc: 'Incredibly light elven craftsmanship.' },
    am_dragon_scale: { id: 'am_dragon_scale', name: 'Dragon Scale Mail', type: 'Equipment', slot: 'body', requiredLevel: 70, rarity: 'epic', stats: { defense: 300, vit: 50, resist_fire: 50 }, desc: 'Crafted from ancient dragon scales.' },
    am_demon_plate: { id: 'am_demon_plate', name: 'Demon King Plate', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 80, rarity: 'epic', stats: { defense: 500, vit: 80, str: 20 }, desc: 'Armor that instills fear.' },
    am_phoenix_robes: { id: 'am_phoenix_robes', name: 'Phoenix Robes', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 80, rarity: 'epic', stats: { defense: 100, int: 80, fire_atk: 25 }, desc: 'Reborn from fire.' },
    am_void_stalker: { id: 'am_void_stalker', name: 'Void Stalker', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 80, rarity: 'epic', stats: { defense: 150, agi: 80, flee: 100 }, desc: 'One with the darkness.', set: 'wind_stalker' },
    am_wind_hood: { id: 'am_wind_hood', name: 'Wind Stalker Hood', type: 'Equipment', slot: 'head', requiredClass: ['hero_archer'], requiredLevel: 75, rarity: 'epic', stats: { agi: 50, dex: 30, flee: 60 }, desc: 'Silences your breath.', set: 'wind_stalker' },
    am_wind_talisman: { id: 'am_wind_talisman', name: 'Wind Stalker Talisman', type: 'Equipment', slot: 'accessory_1', requiredClass: ['hero_archer'], requiredLevel: 70, rarity: 'rare', stats: { agi: 30, dex: 20 }, desc: 'Vibrates with the breeze.', set: 'wind_stalker' },
    am_archangel_robe: { id: 'am_archangel_robe', name: 'Archangel Robe', type: 'Equipment', slot: 'body', requiredClass: ['hero_mage'], requiredLevel: 90, rarity: 'legendary', stats: { defense: 200, int: 100, mana: 500, resist_all: 20 }, desc: 'Woven from celestial threads.', set: 'arcane_master' },
    am_arcane_crown: { id: 'am_arcane_crown', name: 'Arcane Crown', type: 'Equipment', slot: 'head', requiredClass: ['hero_mage'], requiredLevel: 85, rarity: 'legendary', stats: { int: 80, matk: 150, mana: 300 }, desc: 'Focuses mental energy.', set: 'arcane_master' },
    am_arcane_pendant: { id: 'am_arcane_pendant', name: 'Arcane Pendant', type: 'Equipment', slot: 'accessory_2', requiredClass: ['hero_mage'], requiredLevel: 80, rarity: 'epic', stats: { int: 50, matk: 100 }, desc: 'Resonates with its wearer.', set: 'arcane_master' },
    am_godly_plate: { id: 'am_godly_plate', name: 'Plate of Valiance', type: 'Equipment', slot: 'body', requiredClass: ['hero_swordman'], requiredLevel: 90, rarity: 'legendary', stats: { defense: 1000, vit: 150, all_stats: 20 }, desc: 'The ultimate protection.' },
    am_heavenly_garb: { id: 'am_heavenly_garb', name: 'Heavenly Garb', type: 'Equipment', slot: 'body', requiredClass: ['hero_archer'], requiredLevel: 90, rarity: 'legendary', stats: { defense: 400, agi: 150, dex: 100 }, desc: 'Worn by the divine hunters.' },

    // --- BOOTS (20+ items) ---
    bt_traveler_boots: { id: 'bt_traveler_boots', name: 'Traveler Boots', type: 'Equipment', slot: 'boots', requiredLevel: 1, rarity: 'common', stats: { agi: 2, flee: 5 }, desc: 'Comfortable for long trips.' },
    bt_leather_boots: { id: 'bt_leather_boots', name: 'Leather Boots', type: 'Equipment', slot: 'boots', requiredLevel: 5, rarity: 'common', stats: { agi: 4 }, desc: 'Standard leather footwear.' },
    bt_iron_boots: { id: 'bt_iron_boots', name: 'Iron Boots', type: 'Equipment', slot: 'boots', requiredLevel: 10, rarity: 'common', stats: { defense: 5, vit: 2, agi: -1 }, desc: 'Clunky but protective.' },
    bt_novice_sandals: { id: 'bt_novice_sandals', name: 'Novice Sandals', type: 'Equipment', slot: 'boots', requiredLevel: 10, rarity: 'common', stats: { agi: 3, mana: 10 }, desc: 'Lightweight sandals.' },
    bt_reinforced_boots: { id: 'bt_reinforced_boots', name: 'Reinforced Boots', type: 'Equipment', slot: 'boots', requiredLevel: 20, rarity: 'uncommon', stats: { agi: 6, defense: 10 }, desc: 'Extra layer of protection.' },
    bt_heavy_greaves: { id: 'bt_heavy_greaves', name: 'Heavy Greaves', type: 'Equipment', slot: 'boots', requiredClass: ['hero_swordman'], requiredLevel: 25, rarity: 'uncommon', stats: { defense: 20, vit: 10, agi: -2 }, desc: 'Solid steel protection.' },
    bt_mystic_shoes: { id: 'bt_mystic_shoes', name: 'Mystic Shoes', type: 'Equipment', slot: 'boots', requiredClass: ['hero_mage'], requiredLevel: 25, rarity: 'uncommon', stats: { int: 5, agi: 5, mana: 50 }, desc: 'Soft shoes that aid focus.' },
    bt_scout_boots: { id: 'bt_scout_boots', name: 'Scout Boots', type: 'Equipment', slot: 'boots', requiredClass: ['hero_archer'], requiredLevel: 25, rarity: 'uncommon', stats: { agi: 12, flee: 15 }, desc: 'Designed for stealth.' },
    bt_combat_boots: { id: 'bt_combat_boots', name: 'Combat Boots', type: 'Equipment', slot: 'boots', requiredLevel: 35, rarity: 'uncommon', stats: { agi: 8, str: 5 }, desc: 'Rugged boots for battle.' },
    bt_swift_boots: { id: 'bt_swift_boots', name: 'Swift Boots', type: 'Equipment', slot: 'boots', requiredLevel: 45, rarity: 'rare', stats: { agi: 20, flee: 30 }, desc: 'Enhances movement speed.' },
    bt_mythril_boots: { id: 'bt_mythril_boots', name: 'Mythril Greaves', type: 'Equipment', slot: 'boots', requiredLevel: 55, rarity: 'rare', stats: { defense: 50, agi: 15, vit: 10 }, desc: 'Lightweight and durable.' },
    bt_arcane_slippers: { id: 'bt_arcane_slippers', name: 'Arcane Slippers', type: 'Equipment', slot: 'boots', requiredClass: ['hero_mage'], requiredLevel: 55, rarity: 'rare', stats: { int: 15, mana: 150 }, desc: 'Floating on magical essence.' },
    bt_stalker_boots: { id: 'bt_stalker_boots', name: 'Stalker Boots', type: 'Equipment', slot: 'boots', requiredClass: ['hero_archer'], requiredLevel: 55, rarity: 'rare', stats: { agi: 30, crit: 5 }, desc: 'Padded for silent stalking.' },
    bt_valkyrie_boots: { id: 'bt_valkyrie_boots', name: 'Valkyrie Boots', type: 'Equipment', slot: 'boots', requiredLevel: 70, rarity: 'epic', stats: { agi: 40, vit: 20, defense: 100 }, desc: 'Worn by the chosen.', set: 'valkyrie' },
    bt_demon_boots: { id: 'bt_demon_boots', name: 'Demon Boots', type: 'Equipment', slot: 'boots', requiredLevel: 70, rarity: 'epic', stats: { str: 20, agi: 30, resist_dark: 15 }, desc: 'Forged in the abyss.' },
    bt_celestial_sandals: { id: 'bt_celestial_sandals', name: 'Celestial Sandals', type: 'Equipment', slot: 'boots', requiredLevel: 70, rarity: 'epic', stats: { int: 30, agi: 30, mana: 300 }, desc: 'Walk among the stars.' },
    bt_hermes_sandals: { id: 'bt_hermes_sandals', name: 'Hermes Sandals', type: 'Equipment', slot: 'boots', requiredLevel: 80, rarity: 'legendary', stats: { agi: 100, flee: 200, luk: 50 }, desc: 'Boots of the messenger god.' },
    bt_titan_greaves: { id: 'bt_titan_greaves', name: 'Titan Greaves', type: 'Equipment', slot: 'boots', requiredClass: ['hero_swordman'], requiredLevel: 90, rarity: 'legendary', stats: { defense: 300, vit: 100, str: 50 }, desc: 'The weight of a mountain.' },
    bt_shadow_step: { id: 'bt_shadow_step', name: 'Shadow Step Boots', type: 'Equipment', slot: 'boots', requiredClass: ['hero_archer'], requiredLevel: 90, rarity: 'legendary', stats: { agi: 150, flee: 300, dex: 50 }, desc: 'Instantaneous relocation.', set: 'wind_stalker' },
    bt_void_walkers: { id: 'bt_void_walkers', name: 'Void Walkers', type: 'Equipment', slot: 'boots', requiredClass: ['hero_mage'], requiredLevel: 90, rarity: 'legendary', stats: { int: 100, agi: 100, mana: 1000 }, desc: 'Walking through dimensions.', set: 'arcane_master' },

    // --- ACCESSORIES (20+ items) ---
    ac_silver_ring: { id: 'ac_silver_ring', name: 'Silver Ring', type: 'Equipment', slot: 'accessory_1', requiredLevel: 1, rarity: 'common', stats: { all_stats: 1 }, desc: 'A simple token.' },
    ac_iron_bangle: { id: 'ac_iron_bangle', name: 'Iron Bangle', type: 'Equipment', slot: 'accessory_1', requiredLevel: 5, rarity: 'common', stats: { defense: 5, vit: 1 }, desc: 'Basic wrist protection.' },
    ac_luck_charm: { id: 'ac_luck_charm', name: 'Luck Charm', type: 'Equipment', slot: 'accessory_2', requiredLevel: 10, rarity: 'common', stats: { luk: 5 }, desc: 'A little help from fate.' },
    ac_mana_beads: { id: 'ac_mana_beads', name: 'Mana Beads', type: 'Equipment', slot: 'accessory_1', requiredLevel: 10, rarity: 'common', stats: { mana: 20 }, desc: 'Store a tiny bit of mana.' },
    ac_bronze_amulet: { id: 'ac_bronze_amulet', name: 'Bronze Amulet', type: 'Equipment', slot: 'accessory_2', requiredLevel: 15, rarity: 'common', stats: { vit: 3 }, desc: 'Modest vitality boost.' },
    ac_gold_necklace: { id: 'ac_gold_necklace', name: 'Gold Necklace', type: 'Equipment', slot: 'accessory_2', requiredLevel: 25, rarity: 'uncommon', stats: { all_stats: 3, luk: 5 }, desc: 'Increases fortune.' },
    ac_power_wrist: { id: 'ac_power_wrist', name: 'Power Wristband', type: 'Equipment', slot: 'accessory_1', requiredLevel: 25, rarity: 'uncommon', stats: { str: 8 }, desc: 'Tightens around the muscles.' },
    ac_intellect_ring: { id: 'ac_intellect_ring', name: 'Ring of Intellect', type: 'Equipment', slot: 'accessory_1', requiredLevel: 25, rarity: 'uncommon', stats: { int: 8 }, desc: 'Clearer thoughts.' },
    ac_agile_anklet: { id: 'ac_agile_anklet', name: 'Agile Anklet', type: 'Equipment', slot: 'accessory_2', requiredLevel: 25, rarity: 'uncommon', stats: { agi: 8 }, desc: 'Lighter steps.' },
    ac_ruby_pendant: { id: 'ac_ruby_pendant', name: 'Ruby Pendant', type: 'Equipment', slot: 'accessory_1', requiredLevel: 35, rarity: 'uncommon', stats: { hp: 100, vit: 5 }, desc: 'Glows with life energy.' },
    ac_strength_belt: { id: 'ac_strength_belt', name: 'Belt of Giant Strength', type: 'Equipment', slot: 'accessory_1', requiredLevel: 45, rarity: 'rare', stats: { str: 20, vit: 10 }, desc: 'Enhances physical power.' },
    ac_mana_stone: { id: 'ac_mana_stone', name: 'Great Mana Stone', type: 'Equipment', slot: 'accessory_2', requiredLevel: 45, rarity: 'rare', stats: { int: 20, mana: 100 }, desc: 'A battery for magical energy.' },
    ac_crit_clover: { id: 'ac_crit_clover', name: 'Four-Leaf Clover', type: 'Equipment', slot: 'accessory_1', requiredLevel: 55, rarity: 'rare', stats: { luk: 30, crit: 20 }, desc: 'Unbelievably lucky.' },
    ac_knight_sigil: { id: 'ac_knight_sigil', name: 'Knight Sigil', type: 'Equipment', slot: 'accessory_2', requiredLevel: 55, rarity: 'rare', stats: { defense: 50, vit: 15 }, desc: 'Badge of a sworn protector.' },
    ac_falcon_eye: { id: 'ac_falcon_eye', name: 'Falcon Eye', type: 'Equipment', slot: 'accessory_1', requiredLevel: 55, rarity: 'rare', stats: { hit: 50, dex: 15 }, desc: 'Nothing escapes your sight.' },
    ac_obsidian_earring: { id: 'ac_obsidian_earring', name: 'Obsidian Earring', type: 'Equipment', slot: 'accessory_2', requiredLevel: 70, rarity: 'epic', stats: { matk: 100, int: 40 }, desc: 'Dark energy swirls within.' },
    ac_dragon_heart: { id: 'ac_dragon_heart', name: 'Dragon Heart', type: 'Equipment', slot: 'accessory_1', requiredLevel: 70, rarity: 'epic', stats: { all_stats: 15, hp: 500 }, desc: 'Beating with primal power.' },
    ac_vortex_gem: { id: 'ac_vortex_gem', name: 'Vortex Gem', type: 'Equipment', slot: 'accessory_2', requiredLevel: 70, rarity: 'epic', stats: { mana: 300, matk: 150 }, desc: 'Sucks mana from the air.' },
    ac_hero_merit: { id: 'ac_hero_merit', name: 'Hero\'s Badge of Merit', type: 'Equipment', slot: 'accessory_1', requiredLevel: 85, rarity: 'legendary', stats: { all_stats: 20, hit: 50, flee: 50 }, desc: 'Only awarded to the greatest warriors.' },
    ac_god_tier_ring: { id: 'ac_god_tier_ring', name: 'The One Ring', type: 'Equipment', slot: 'accessory_2', requiredLevel: 95, rarity: 'legendary', stats: { all_stats: 50, hit: 100, flee: 100, defense: 100 }, desc: 'One ring to rule them all.' },
    ac_infinity_gauntlet: { id: 'ac_infinity_gauntlet', name: 'Infinity Gauntlet', type: 'Equipment', slot: 'accessory_1', requiredLevel: 100, rarity: 'legendary', stats: { all_stats: 100, matk: 200, str: 200 }, desc: 'Reality is whatever you want.' },
};
