window.combatData = {
    // Definitions of all playable entities (Classes & Monsters)
    entities: {
        // --- CLASSES ---
        hero_blacksmith: {
            name: 'Blacksmith', type: 'class', element: 'fire', img: 'assets/img/blacksmith-male.webp', video: 'assets/video/blacksmith-female.mp4',
            desc: 'A warrior blacksmith who combines combat prowess with masterful crafting. They forge weapons in battle and use their hammer as both tool and weapon, creating and destroying with equal skill.',
            // Balanced attributes (aligned with the "attribute-scale" used by SkillEngine formulas)
            attributes: { str: 14, agi: 6, vit: 11, int: 8, dex: 7, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Blacksmith Skills (Lv 1–12, weakest → strongest)
            skills: [
                'anvil_tap', 'spark_blow', 'field_repair', 'tempered_strike',
                'fortify_armor', 'seismic_slam', 'molten_edge', 'riveting_combo',
                'shatter_armor', 'forge_overdrive', 'masterwork_precision', 'worldbreaker'
            ],
            inventory: { potion_hp: 2, potion_mana: 1, potion_panacea: 1 }
        },
        hero_mage: {
            name: 'Mage', type: 'class', element: 'fire', img: 'assets/img/mage-male.webp',
            desc: 'An arcane spellcaster who wields powerful magical forces. Through years of study and dedication, they command the elements and bend reality to their will.',
            attributes: { str: 5, agi: 7, vit: 6, int: 15, dex: 10, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Mage Skills (Lv 1–12, weakest → strongest)
            skills: [
                'arcane_bolt', 'ember_spear', 'frost', 'mana_shield',
                'fireball', 'chain_spark', 'arcane_focus', 'ice_prison',
                'lightning_storm', 'shock', 'void_lance', 'meteor',
                'mana_drain', 'time_skip'
            ],
            inventory: { potion_hp: 1, potion_mana: 3, potion_antidote: 1 }
        },
        hero_swordman: {
            name: 'Swordman', type: 'class', element: 'neutral', img: 'assets/img/swordman-male.webp',
            desc: 'A disciplined warrior trained in one-handed combat and military tactics. Masters of sword and shield, they excel at both offense and defense, making them reliable front-line fighters.',
            attributes: { str: 12, agi: 8, vit: 10, int: 5, dex: 8, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            skills: [
                'quick_slash', 'guarded_strike', 'parry_stance', 'heavy_slash',
                'shield_bash', 'taunting_shout', 'cleave', 'defensive_wall',
                'crushing_blow', 'battle_focus', 'relentless_strike', 'champions_slash',
                'life_steal', 'berserk_mode'
            ],
            inventory: { potion_hp: 3, potion_mana: 1, potion_antidote: 1 }
        },
        hero_archer: {
            name: 'Archer', type: 'class', element: 'wind', img: 'assets/img/archer-female.webp', video: 'assets/video/archer-female.mp4',
            desc: 'A precision archer with deep connection to nature and keen eyesight. They strike from a distance with deadly accuracy, using the environment to their advantage.',
            attributes: { str: 8, agi: 15, vit: 8, int: 7, dex: 14, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            skills: [
                'quick_shot', 'aimed_shot', 'evasive_step', 'power_shot',
                'poison_arrow', 'rapid_fire', 'multishot', 'crippling_shot',
                'shadow_volley', 'hunters_focus', 'piercing_arrow', 'rain_of_arrows',
                'volcanic_arrowstorm', 'summon_wolf'
            ],
            inventory: { potion_hp: 2, potion_mana: 1, poison_vial: 2 }
        },
        // NOTE: Renamed to match your actual class set/assets (Thief/Acolyte)
        hero_thief: {
            name: 'Thief', type: 'class', element: 'shadow', img: 'assets/img/thief-male.webp',
            desc: 'An agile rogue who moves through shadows and strikes from the darkness. Masters of stealth and precision, they excel at quick, deadly attacks and evading danger.',
            attributes: { str: 8, agi: 14, vit: 7, int: 6, dex: 15, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Thief Skills (Lv 1–12, weakest → strongest)
            skills: [
                'quick_stab', 'poisoned_blade', 'evasive_roll', 'backstab',
                'bleeding_cut', 'smoke_bomb', 'shadow_strike', 'crippling_poison',
                'execution', 'fan_of_knives', 'nightmare_combo', 'assassinate',
                'life_steal', 'time_skip'
            ],
            inventory: { potion_hp: 1, poison_vial: 3, potion_antidote: 1 }
        },
        hero_acolyte: {
            name: 'Acolyte', type: 'class', element: 'holy', img: 'assets/img/sacer-female.webp', video: 'assets/video/acolyte-female.mp4',
            desc: 'A sacred cleric devoted to divine powers of healing and protection. They channel holy energy to mend wounds, shield allies, and smite the unholy.',
            // Battle Healer: high INT/mana + solid VIT sustain, modest damage, safe solo progression
            attributes: { str: 6, agi: 6, vit: 9, int: 13, dex: 8, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Acolyte Skills (Lv 1–12, weakest → strongest)
            skills: [
                'heal', 'minor_smite', 'bless', 'holy_shield',
                'smite', 'purifying_light', 'renewal', 'radiant_wave',
                'divine_favor', 'sanctuary', 'judgement', 'celestial_wrath',
                'reflect_shield', 'revive'
            ],
            inventory: { potion_hp: 1, potion_mana: 3, potion_panacea: 1 }
        },

        // --- MONSTERS ---
        wolf: {
            name: 'Dire Wolf', type: 'monster', element: 'neutral', img: 'assets/img/wolf.webp', video: 'assets/video/wolf.mp4',
            desc: 'A fierce and intelligent wolf that hunts in packs. Known for their savage bites and coordinated attacks, they are dangerous predators of the wilderness.',
            attributes: { str: 10, agi: 12, vit: 8, int: 2, dex: 10, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 12,
            skills: ['savage_bite', 'lunge'],
            inventory: { potion_hp: 1 }
        },
        orc: {
            name: 'Orc Warrior', type: 'monster', element: 'earth', img: 'assets/img/orc.webp', video: 'assets/video/orc.mp4',
            desc: 'A brutal orc warrior who relies on raw strength and brute force. They charge into battle with overwhelming power, crushing enemies with their massive weapons.',
            attributes: { str: 14, agi: 5, vit: 14, int: 2, dex: 6, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 25, gold: 20,
            skills: ['smash', 'orc_charge', 'war_cry', 'brutal_swing', 'berserker_rage'],
            inventory: { potion_hp: 1 }
        },
        toxic_slime: {
            name: 'Toxic Slime', type: 'monster', element: 'poison', img: 'assets/img/slime.png', video: 'assets/video/slime.mp4',
            desc: 'A poisonous slime creature that oozes through dark places. Their toxic touch can dissolve flesh and spread disease to those unfortunate enough to encounter them.',
            attributes: { str: 8, agi: 3, vit: 12, int: 6, dex: 3, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 5,
            skills: ['dissolve', 'bounce']
        },
        goblin: {
            name: 'Goblin Scout', type: 'monster', element: 'earth', img: 'assets/img/goblin.png',
            desc: 'A small goblin explorer that roams the wilderness, using basic magic to survive. Known for their quick attacks and tendency to flee when outnumbered.',
            attributes: { str: 9, agi: 11, vit: 7, int: 6, dex: 10, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 10, gold: 8,
            skills: ['stab', 'loot', 'goblin_dash', 'dirty_trick', 'retreat'],
            lootTable: { goldMin: 10, goldMax: 25, xp: 45, items: [{ id: 'goblin_ear', chance: 0.8, rarity: 'common' }] }
        },
        hobgoblin: {
            name: 'Hobgoblin Brute', type: 'monster', element: 'earth', img: 'assets/img/swordman-female.webp',
            desc: 'A massive hobgoblin warrior known for brute strength and heavy armor. They charge into battle without fear, crushing enemies with overwhelming force.',
            attributes: { str: 16, agi: 4, vit: 18, int: 2, dex: 8, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 40, gold: 30,
            skills: ['heavy_slam', 'ground_slam', 'intimidating_roar', 'hobgoblin_crush', 'rampage'],
            lootTable: { goldMin: 30, goldMax: 60, xp: 80, items: [{ id: 'iron_shard', chance: 0.7, rarity: 'common' }] }
        },
        bandit: {
            name: 'Bandit Archer', type: 'monster', element: 'neutral', img: 'assets/img/archer-female.webp', video: 'assets/video/archer-female.mp4',
            desc: 'A rogue archer who turned to banditry, using stolen bows and poisoned arrows to ambush travelers. They strike from hidden positions and rarely fight fair.',
            attributes: { str: 11, agi: 13, vit: 9, int: 4, dex: 14, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 30, gold: 25,
            skills: ['poison_tip', 'multishot', 'bandit_aim', 'bandit_retreat', 'bandit_volley'],
            lootTable: { goldMin: 15, goldMax: 35, xp: 55, items: [{ id: 'broken_arrow', chance: 0.8, rarity: 'common' }] }
        },

        // ========================================
        // STORMHAVEN MONSTERS (Swordsman starting city)
        // ========================================
        goblin_raider: {
            name: 'Goblin Raider', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A coastal goblin that survives by raiding ships and travelers. They use stolen equipment and are known for their quick and dirty attacks.',
            attributes: { str: 9, agi: 10, vit: 7, int: 4, dex: 9, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['goblin_raid', 'loot', 'stab'],
            city: 'Stormhaven'
        },
        coastal_crab: {
            name: 'Coastal Crab', type: 'monster', element: 'water', img: 'assets/img/placeholder.webp',
            desc: 'A giant crab that dwells along the coastlines. With their hard shells and powerful pincers, they guard their territory fiercely.',
            attributes: { str: 8, agi: 4, vit: 12, int: 2, dex: 6, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['crab_pinch', 'shell_defense', 'bubble_burst'],
            city: 'Stormhaven'
        },
        sea_rat: {
            name: 'Sea Rat', type: 'monster', element: 'poison', img: 'assets/img/placeholder.webp',
            desc: 'A large rat that infests port areas, carrying disease and poison. They are quick and vicious, attacking in swarms when threatened.',
            attributes: { str: 6, agi: 11, vit: 8, int: 3, dex: 10, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['poison_bite', 'quick_escape', 'disease_scratch'],
            city: 'Stormhaven'
        },
        bandit_marauder: {
            name: 'Bandit Marauder', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A coastal bandit who plunders ships and coastal settlements. They are ruthless raiders known for their brutal tactics and love of loot.',
            attributes: { str: 10, agi: 9, vit: 9, int: 4, dex: 11, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['marauder_strike', 'loot', 'dirty_blow'],
            city: 'Stormhaven'
        },
        rock_golem_small: {
            name: 'Rock Golem (Small)', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A small stone guardian created to protect coastal areas. Though slow, their stone bodies make them incredibly resilient defenders.',
            attributes: { str: 12, agi: 2, vit: 16, int: 1, dex: 4, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['rock_slam', 'stone_skin', 'earthquake'],
            city: 'Stormhaven'
        },
        skeleton_soldier: {
            name: 'Skeleton Soldier', type: 'monster', element: 'undead', img: 'assets/img/placeholder.webp',
            desc: 'An undead soldier from the coastal wars, risen to serve dark forces. They retain their military discipline and fight with rusted weapons.',
            attributes: { str: 11, agi: 6, vit: 10, int: 2, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 25, gold: 18,
            skills: ['bone_strike', 'undead_resilience', 'shield_bash'],
            city: 'Stormhaven'
        },
        orc_scout: {
            name: 'Orc Scout', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'An orc explorer who patrols coastal regions. More agile than their warrior kin, they scout ahead and report back to their war bands.',
            attributes: { str: 13, agi: 8, vit: 11, int: 2, dex: 9, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['scout_charge', 'war_cry', 'brutal_swing'],
            city: 'Stormhaven'
        },
        harpy: {
            name: 'Harpy', type: 'monster', element: 'wind', img: 'assets/img/placeholder.webp',
            desc: 'A flying creature that nests in coastal cliffs. Their piercing screeches can stun enemies, and their talons strike from above.',
            attributes: { str: 8, agi: 14, vit: 7, int: 5, dex: 13, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['harpy_screech', 'talon_strike', 'wind_gust'],
            city: 'Stormhaven'
        },
        troll_warrior: {
            name: 'Troll Warrior', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A coastal troll warrior known for their incredible regeneration. They fight with massive clubs and rarely retreat from battle.',
            attributes: { str: 15, agi: 4, vit: 14, int: 2, dex: 7, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['troll_regeneration', 'heavy_club', 'berserker_rage'],
            city: 'Stormhaven'
        },
        pirate_ghost: {
            name: 'Pirate Ghost', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'The restless spirit of a fallen pirate, cursed to haunt the coast. They wield ethereal weapons and drain the life force of the living.',
            attributes: { str: 9, agi: 10, vit: 8, int: 8, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['ghostly_strike', 'mana_drain', 'cursed_sword'],
            city: 'Stormhaven'
        },
        captain_grimbeard: {
            name: 'Captain Grimbeard', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'A legendary pirate captain who became a ghostly boss. His cursed blade and dark aura make him a fearsome opponent, commanding other undead pirates.',
            attributes: { str: 16, agi: 7, vit: 15, int: 6, dex: 10, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 60, gold: 50,
            skills: ['captain_taunt', 'ghostly_strike', 'cursed_sword', 'dark_aura', 'pirate_rage'],
            isBoss: true,
            city: 'Stormhaven'
        },

        // ========================================
        // ELDERVALE MONSTERS (Archer starting city)
        // ========================================
        gelatinous_cube: {
            name: 'Gelatinous Cube', type: 'monster', element: 'poison', img: 'assets/img/placeholder.webp',
            desc: 'A gelatinous cube that absorbs and dissolves its prey. They slowly move through dungeons and forests, consuming anything in their path.',
            attributes: { str: 7, agi: 3, vit: 11, int: 4, dex: 5, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['gelatinous_absorb', 'bounce', 'gelatinous_split'],
            city: 'Eldervale'
        },
        feral_wolf: {
            name: 'Feral Wolf', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A wild wolf from the deep forests. More aggressive than their dire cousins, they hunt alone and attack with savage ferocity.',
            attributes: { str: 9, agi: 11, vit: 7, int: 2, dex: 9, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['feral_bite', 'pack_howl', 'lunge'],
            city: 'Eldervale'
        },
        giant_spider: {
            name: 'Giant Spider', type: 'monster', element: 'poison', img: 'assets/img/placeholder.webp',
            desc: 'A massive spider that weaves deadly webs in the forest. Their venomous bite and web traps make them dangerous predators.',
            attributes: { str: 8, agi: 10, vit: 9, int: 4, dex: 11, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['spider_bite', 'web_trap', 'poison_spit'],
            city: 'Eldervale'
        },
        bat_swarm: {
            name: 'Bat Swarm', type: 'monster', element: 'wind', img: 'assets/img/placeholder.webp',
            desc: 'A swarm of bats that attacks in numbers. Their screeches disorient enemies while they drain blood with their sharp fangs.',
            attributes: { str: 6, agi: 13, vit: 6, int: 3, dex: 12, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['bat_swarm_attack', 'bat_screech', 'drain_blood'],
            city: 'Eldervale'
        },
        treant_sapling: {
            name: 'Treant Sapling', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A young animated tree that guards the forest. Though smaller than ancient treants, they are still formidable protectors of nature.',
            attributes: { str: 10, agi: 3, vit: 13, int: 5, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['root_strike', 'bark_skin', 'nature_heal'],
            city: 'Eldervale'
        },
        giant_rat: {
            name: 'Giant Rat', type: 'monster', element: 'poison', img: 'assets/img/placeholder.webp',
            desc: 'A massive rat that dwells in forest undergrowth. Their quick scurrying and poisonous claws make them dangerous vermin.',
            attributes: { str: 7, agi: 12, vit: 8, int: 3, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['giant_rat_bite', 'poison_claw', 'quick_scurry'],
            city: 'Eldervale'
        },
        hornet_queen: {
            name: 'Hornet Queen', type: 'monster', element: 'poison', img: 'assets/img/placeholder.webp',
            desc: 'A giant hornet queen that commands swarms of smaller hornets. Her venomous stinger and ability to command her hive make her a deadly foe.',
            attributes: { str: 9, agi: 13, vit: 8, int: 5, dex: 14, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['stinger_strike', 'venom_cloud', 'hive_command'],
            city: 'Eldervale'
        },
        wild_boar: {
            name: 'Wild Boar', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A fierce wild boar that charges through the forest. Their thick hide and powerful tusks make them dangerous when cornered.',
            attributes: { str: 14, agi: 5, vit: 13, int: 2, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['boar_charge', 'tusk_strike', 'thick_hide'],
            city: 'Eldervale'
        },
        dryad: {
            name: 'Dryad', type: 'monster', element: 'wind', img: 'assets/img/placeholder.webp',
            desc: 'A nature spirit bound to the forest. They wield nature magic and protect their domain with healing breezes and thorny vines.',
            attributes: { str: 7, agi: 10, vit: 9, int: 10, dex: 11, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['nature_bolt', 'healing_breeze', 'thorn_vine'],
            city: 'Eldervale'
        },
        ancient_treant: {
            name: 'Ancient Treant', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'An ancient tree guardian that has protected the forest for centuries. Their massive size and nature magic make them formidable bosses of the wild.',
            attributes: { str: 15, agi: 3, vit: 16, int: 8, dex: 7, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 60, gold: 50,
            skills: ['ancient_stomp', 'bark_armor', 'nature_wrath', 'root_grasp', 'ancient_rage'],
            isBoss: true,
            city: 'Eldervale'
        },

        // ========================================
        // AETHERY sayS MONSTERS (Mage starting city)
        // ========================================
        arcane_fragment: {
            name: 'Arcane Fragment', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A fragment of pure arcane energy that drifts through magical towers. These unstable remnants of powerful spells attack with basic magic.',
            attributes: { str: 3, agi: 5, vit: 6, int: 8, dex: 7, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['arcane_fragment_blast'],
            city: 'Aetherys'
        },
        cursed_book: {
            name: 'Cursed Book', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'A tome corrupted by dark magic, its pages writhe with malevolent energy. It curses those who read it, weakening their minds.',
            attributes: { str: 2, agi: 4, vit: 7, int: 10, dex: 6, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['cursed_book_curse'],
            city: 'Aetherys'
        },
        floating_orb: {
            name: 'Floating Orb', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A magical orb that hovers through arcane ruins. Its ethereal nature makes it hard to hit, and it strikes with precise magic.',
            attributes: { str: 2, agi: 8, vit: 5, int: 9, dex: 10, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['floating_orb_blast'],
            city: 'Aetherys'
        },
        possessed_armor: {
            name: 'Possessed Armor', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'An empty suit of armor animated by dark magic. It retains its defensive capabilities while striking with physical force.',
            attributes: { str: 10, agi: 3, vit: 13, int: 4, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['possessed_armor_strike'],
            city: 'Aetherys'
        },
        shadow_wisp: {
            name: 'Shadow Wisp', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'A wisp of pure shadow that drifts through magical spaces. Immune to physical attacks, it drains the life force of the living.',
            attributes: { str: 1, agi: 11, vit: 6, int: 11, dex: 9, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['shadow_wisp_drain'],
            city: 'Aetherys'
        },
        golem_arcane: {
            name: 'Golem (Arcane)', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A golem constructed from arcane materials and infused with magic. It wields powerful arcane attacks and resists magical damage.',
            attributes: { str: 11, agi: 2, vit: 14, int: 12, dex: 4, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 25, gold: 18,
            skills: ['golem_arcane_blast'],
            city: 'Aetherys'
        },
        skeleton_mage: {
            name: 'Skeleton Mage', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'An undead mage that retains its magical knowledge in death. It casts dark spells and is vulnerable to holy magic.',
            attributes: { str: 4, agi: 6, vit: 8, int: 13, dex: 8, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['skeleton_mage_bolt'],
            city: 'Aetherys'
        },
        gargoyle: {
            name: 'Gargoyle', type: 'monster', element: 'earth', img: 'assets/img/placeholder.webp',
            desc: 'A stone guardian that perches on magical towers. It can fly and strikes with both physical and magical attacks.',
            attributes: { str: 12, agi: 7, vit: 12, int: 7, dex: 9, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['gargoyle_stone_strike'],
            city: 'Aetherys'
        },
        wraith: {
            name: 'Wraith', type: 'monster', element: 'shadow', img: 'assets/img/placeholder.webp',
            desc: 'A powerful ghost that haunts arcane ruins. It drains mana from its victims, leaving them powerless.',
            attributes: { str: 5, agi: 9, vit: 9, int: 12, dex: 10, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['wraith_soul_drain'],
            city: 'Aetherys'
        },
        arcane_construct: {
            name: 'Arcane Construct', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'A powerful magical construct created by archmages. It channels pure arcane energy into devastating beams of magic.',
            attributes: { str: 8, agi: 4, vit: 13, int: 15, dex: 7, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['arcane_construct_beam'],
            city: 'Aetherys'
        },
        archmage_specter: {
            name: 'Archmage Specter', type: 'monster', element: 'neutral', img: 'assets/img/placeholder.webp',
            desc: 'The ghostly remains of a powerful archmage, still wielding immense arcane power. It commands multiple elements and can summon arcane orbs to aid in battle.',
            attributes: { str: 6, agi: 8, vit: 12, int: 18, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 60, gold: 50,
            skills: ['archmage_specter_orb', 'archmage_specter_storm', 'archmage_specter_focus'],
            isBoss: true,
            city: 'Aetherys'
        }
    },

    // Skill Definitions (single source of truth)
    // Loaded from ui/assets/js/skills-data.js
    skills: (window.skillsData || {}),

    items: {
        // --- CONSUMABLES ---
        potion_hp: { name: 'HP Potion', type: 'Consumable', desc: 'Restores 50 HP.', icon: 'heart', png: 'https://via.placeholder.com/64/10b981/ffffff?text=HP', healHp: 50, rarity: 'common' },
        potion_mana: { name: 'Mana Potion', type: 'Consumable', desc: 'Restores 30 Mana.', icon: 'zap', png: 'https://via.placeholder.com/64/3b82f6/ffffff?text=MP', restoreMana: 30, rarity: 'common' },
        potion_antidote: { name: 'Antidote', type: 'Consumable', desc: 'Cures Poison status.', icon: 'skull', png: 'https://via.placeholder.com/64/22c55e/ffffff?text=ANT', cureStatus: ['poison'], rarity: 'common' },
        potion_panacea: { name: 'Panacea', type: 'Consumable', desc: 'Cures all negative statuses.', icon: 'sparkles', png: 'https://via.placeholder.com/64/a855f7/ffffff?text=PAN', cureAllStatuses: true, rarity: 'rare' },
        poison_vial: { name: 'Poison Vial', type: 'Consumable', desc: 'Applies Poison to an enemy.', icon: 'skull', png: 'https://via.placeholder.com/64/8b5cf6/ffffff?text=PSN', applyStatus: { id: 'poison', chance: 1.0, duration: 3 }, rarity: 'uncommon', target: 'enemy' },

        // --- MATERIALS & LOOT ---
        goblin_ear: { name: 'Goblin Ear', type: 'Materials', desc: 'A disgusting trophy.', icon: 'origami', rarity: 'common' },
        mystic_scroll: { name: 'Mystic Scroll', type: 'Consumable', desc: 'Faint energy glows.', icon: 'scroll', rarity: 'uncommon' },
        goblin_staff: { name: 'Goblin Staff', type: 'Weapon', desc: 'Smells of charcoal.', icon: 'wand-2', rarity: 'rare' },
        iron_shard: { name: 'Iron Shard', type: 'Materials', desc: 'Rusty but useful.', icon: 'hammer', rarity: 'common' },
        heavy_plated_belt: { name: 'Plated Belt', type: 'Equipment', desc: 'High defense.', icon: 'shield-check', rarity: 'uncommon' },
        hobgoblin_hammer: { name: 'Hobgoblin Mauler', type: 'Weapon', desc: 'Pure brute force.', icon: 'swords', rarity: 'epic' },
        broken_arrow: { name: 'Broken Arrow', type: 'Materials', desc: 'Good for wood.', icon: 'target', rarity: 'common' },
        leather_quiver: { name: 'Sturdy Quiver', type: 'Equipment', desc: 'Increases speed.', icon: 'briefcase', rarity: 'uncommon' },
        hunters_bow: { name: 'Hunters Longbow', type: 'Weapon', desc: 'Piercing power.', icon: 'target', rarity: 'rare' }
    },

    // Global Party Inventory (Shared by all heroes)
    partyInventory: {
        potion_hp: 5,
        potion_mana: 3,
        potion_antidote: 2,
        potion_panacea: 1,
        poison_vial: 2
    }
};
