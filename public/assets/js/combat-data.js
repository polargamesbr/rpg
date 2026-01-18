window.combatData = {
    // Definitions of all playable entities (Classes & Monsters)
    entities: {
        // --- CLASSES ---
        hero_blacksmith: {
            name: 'Blacksmith', type: 'class', element: 'fire', img: '/public/assets/img/blacksmith-male.png', video: '/public/assets/video/blacksmith-female.mp4',
            desc: 'A warrior blacksmith who combines combat prowess with masterful crafting. They forge weapons in battle and use their hammer as both tool and weapon, creating and destroying with equal skill.',
            // Balanced attributes (aligned with the "attribute-scale" used by SkillEngine formulas)
            attributes: { str: 14, agi: 6, vit: 11, int: 8, dex: 7, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Blacksmith Skills (Lv 1â€“12, weakest â†’ strongest)
            skills: [
                'anvil_tap', 'spark_blow', 'field_repair', 'tempered_strike',
                'fortify_armor', 'seismic_slam', 'molten_edge', 'riveting_combo',
                'shatter_armor', 'forge_overdrive', 'masterwork_precision', 'worldbreaker'
            ],
            inventory: { potion_hp: 2, potion_mana: 1, potion_panacea: 1 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },
        hero_mage: {
            name: 'Mage', type: 'class', element: 'fire', img: '/public/assets/img/mage-male.png',
            desc: 'An arcane spellcaster who wields powerful magical forces. Through years of study and dedication, they command the elements and bend reality to their will.',
            attributes: { str: 5, agi: 7, vit: 6, int: 15, dex: 10, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Mage Skills (Lv 1â€“12, weakest â†’ strongest)
            skills: [
                'arcane_bolt', 'ember_spear', 'frost', 'mana_shield',
                'fireball', 'chain_spark', 'arcane_focus', 'ice_prison',
                'lightning_storm', 'shock', 'void_lance', 'meteor',
                'mana_drain', 'time_skip'
            ],
            inventory: { potion_hp: 1, potion_mana: 3, potion_antidote: 1 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },
        hero_swordman: {
            name: 'Swordman', type: 'class', element: 'neutral', img: '/public/assets/img/swordman-male.png',
            desc: 'A disciplined warrior trained in one-handed combat and military tactics. Masters of sword and shield, they excel at both offense and defense, making them reliable front-line fighters.',
            attributes: { str: 12, agi: 8, vit: 10, int: 5, dex: 8, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            skills: [
                'quick_slash', 'guarded_strike', 'parry_stance', 'heavy_slash',
                'shield_bash', 'taunting_shout', 'cleave', 'defensive_wall',
                'crushing_blow', 'battle_focus', 'relentless_strike', 'champions_slash',
                'life_steal', 'berserk_mode'
            ],
            inventory: { potion_hp: 3, potion_mana: 1, potion_antidote: 1 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },
        hero_archer: {
            name: 'Archer', type: 'class', element: 'wind', img: '/public/assets/img/archer-female.png', video: '/public/assets/video/archer-female.mp4',
            desc: 'A precision archer with deep connection to nature and keen eyesight. They strike from a distance with deadly accuracy, using the environment to their advantage.',
            attributes: { str: 8, agi: 15, vit: 8, int: 7, dex: 14, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            skills: [
                'quick_shot', 'aimed_shot', 'evasive_step', 'power_shot',
                'poison_arrow', 'rapid_fire', 'multishot', 'crippling_shot',
                'shadow_volley', 'hunters_focus', 'piercing_arrow', 'rain_of_arrows',
                'volcanic_arrowstorm', 'summon_wolf'
            ],
            inventory: { potion_hp: 2, potion_mana: 1, poison_vial: 2 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },
        // NOTE: Renamed to match your actual class set/assets (Thief/Acolyte)
        hero_thief: {
            name: 'Thief', type: 'class', element: 'shadow', img: '/public/assets/img/thief-male.png',
            desc: 'An agile rogue who moves through shadows and strikes from the darkness. Masters of stealth and precision, they excel at quick, deadly attacks and evading danger.',
            attributes: { str: 8, agi: 14, vit: 7, int: 6, dex: 15, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Thief Skills (Lv 1â€“12, weakest â†’ strongest)
            skills: [
                'quick_stab', 'poisoned_blade', 'evasive_roll', 'backstab',
                'bleeding_cut', 'smoke_bomb', 'shadow_strike', 'crippling_poison',
                'execution', 'fan_of_knives', 'nightmare_combo', 'assassinate',
                'life_steal', 'time_skip'
            ],
            inventory: { potion_hp: 1, poison_vial: 3, potion_antidote: 1 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },
        hero_acolyte: {
            name: 'Acolyte', type: 'class', element: 'holy', img: '/public/assets/img/sacer-female.png', video: '/public/assets/video/acolyte-female.mp4',
            desc: 'A sacred cleric devoted to divine powers of healing and protection. They channel holy energy to mend wounds, shield allies, and smite the unholy.',
            // Battle Healer: high INT/mana + solid VIT sustain, modest damage, safe solo progression
            attributes: { str: 6, agi: 6, vit: 9, int: 13, dex: 8, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            // Acolyte Skills (Lv 1â€“12, weakest â†’ strongest)
            skills: [
                'heal', 'minor_smite', 'bless', 'holy_shield',
                'smite', 'purifying_light', 'renewal', 'radiant_wave',
                'divine_favor', 'sanctuary', 'judgement', 'celestial_wrath',
                'reflect_shield', 'revive'
            ],
            inventory: { potion_hp: 1, potion_mana: 3, potion_panacea: 1 },
            canEquip: true,
            equipment: {
                head: null, body: null, left_hand: null, right_hand: null,
                boots: null, accessory_1: null, accessory_2: null
            }
        },

        // --- MONSTERS ---
        wolf: {
            name: 'Dire Wolf', type: 'monster', element: 'neutral', img: '/public/assets/img/wolf.png', video: '/public/assets/video/wolf.mp4',
            desc: 'A fierce and intelligent wolf that hunts in packs. Known for their savage bites and coordinated attacks, they are dangerous predators of the wilderness.',
            attributes: { str: 10, agi: 12, vit: 8, int: 2, dex: 10, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 100,
            exp: 15, gold: 12,
            skills: ['savage_bite', 'pack_howl', 'lunge', 'feral_claws', 'blood_frenzy', 'lunar_rampage'],
            inventory: { potion_hp: 1 }
        },
        orc: {
            name: 'Orc Warrior', type: 'monster', element: 'earth', img: '/public/assets/img/orc.png', video: '/public/assets/video/orc.mp4',
            desc: 'A brutal orc warrior who relies on raw strength and brute force. They charge into battle with overwhelming power, crushing enemies with their massive weapons.',
            attributes: { str: 14, agi: 5, vit: 14, int: 2, dex: 6, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 25, gold: 20,
            skills: ['smash', 'orc_charge', 'war_cry', 'brutal_swing', 'berserker_rage'],
            inventory: { potion_hp: 1 }
        },
        toxic_slime: {
            name: 'Toxic Slime', type: 'monster', element: 'poison', img: '/public/assets/img/slime.png', video: '/public/assets/video/slime.mp4',
            desc: 'A poisonous slime creature that oozes through dark places. Their toxic touch can dissolve flesh and spread disease to those unfortunate enough to encounter them.',
            attributes: { str: 8, agi: 3, vit: 12, int: 6, dex: 3, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 100,
            exp: 8, gold: 5,
            skills: ['dissolve', 'bounce', 'slime_split', 'toxic_spit']
        },
        goblin: {
            name: 'Goblin Scout', type: 'monster', element: 'earth', img: '/public/assets/img/goblin.png',
            desc: 'A small goblin explorer that roams the wilderness, using basic magic to survive. Known for their quick attacks and tendency to flee when outnumbered.',
            attributes: { str: 10, agi: 13, vit: 9, int: 8, dex: 12, luk: 10 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 25, gold: 18,
            skills: ['stab', 'loot', 'goblin_dash', 'dirty_trick', 'retreat'],
            city: 'Eldervale',
            lootTable: { goldMin: 10, goldMax: 25, xp: 45, items: [{ id: 'goblin_ear', chance: 0.8, rarity: 'common' }] }
        },
        hobgoblin: {
            name: 'Hobgoblin Brute', type: 'monster', element: 'earth', img: '/public/assets/img/swordman-female.png',
            desc: 'A massive hobgoblin warrior known for brute strength and heavy armor. They charge into battle without fear, crushing enemies with overwhelming force.',
            attributes: { str: 16, agi: 4, vit: 18, int: 2, dex: 8, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 40, gold: 30,
            skills: ['heavy_slam', 'ground_slam', 'intimidating_roar', 'hobgoblin_crush', 'rampage'],
            lootTable: { goldMin: 30, goldMax: 60, xp: 80, items: [{ id: 'iron_shard', chance: 0.7, rarity: 'common' }] }
        },
        bandit: {
            name: 'Bandit Archer', type: 'monster', element: 'neutral', img: '/public/assets/img/archer-female.png', video: '/public/assets/video/archer-female.mp4',
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
            name: 'Goblin Raider', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A coastal goblin that survives by raiding ships and travelers. They use stolen equipment and are known for their quick and dirty attacks.',
            attributes: { str: 9, agi: 10, vit: 7, int: 4, dex: 9, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['goblin_raid', 'loot', 'stab'],
            city: 'Stormhaven'
        },
        coastal_crab: {
            name: 'Coastal Crab', type: 'monster', element: 'water', img: '/public/assets/img/placeholder.png',
            desc: 'A giant crab that dwells along the coastlines. With their hard shells and powerful pincers, they guard their territory fiercely.',
            attributes: { str: 8, agi: 4, vit: 12, int: 2, dex: 6, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['crab_pinch', 'shell_defense', 'bubble_burst'],
            city: 'Stormhaven'
        },
        sea_rat: {
            name: 'Sea Rat', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A large rat that infests port areas, carrying disease and poison. They are quick and vicious, attacking in swarms when threatened.',
            attributes: { str: 6, agi: 11, vit: 8, int: 3, dex: 10, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['poison_bite', 'quick_escape', 'disease_scratch'],
            city: 'Stormhaven'
        },
        bandit_marauder: {
            name: 'Bandit Marauder', type: 'monster', element: 'neutral', img: '/public/assets/img/bandit_marauder.png',
            desc: 'A coastal bandit who plunders ships and coastal settlements. They are ruthless raiders known for their brutal tactics and love of loot.',
            attributes: { str: 10, agi: 9, vit: 9, int: 4, dex: 11, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['marauder_strike', 'loot', 'dirty_blow'],
            city: 'Stormhaven'
        },
        rock_golem_small: {
            name: 'Rock Golem (Small)', type: 'monster', element: 'earth', img: '/public/assets/img/rock_golem_small.png',
            desc: 'A small stone guardian created to protect coastal areas. Though slow, their stone bodies make them incredibly resilient defenders.',
            attributes: { str: 12, agi: 2, vit: 16, int: 1, dex: 4, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['rock_slam', 'stone_skin', 'earthquake'],
            city: 'Stormhaven'
        },
        skeleton_soldier: {
            name: 'Skeleton Soldier', type: 'monster', element: 'undead', img: '/public/assets/img/skeleton_soldier.png',
            desc: 'An undead soldier from the coastal wars, risen to serve dark forces. They retain their military discipline and fight with rusted weapons.',
            attributes: { str: 11, agi: 6, vit: 10, int: 2, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 25, gold: 18,
            skills: ['bone_strike', 'undead_resilience', 'shield_bash'],
            city: 'Stormhaven'
        },
        orc_scout: {
            name: 'Orc Scout', type: 'monster', element: 'earth', img: '/public/assets/img/orc_scout.png',
            desc: 'An orc explorer who patrols coastal regions. More agile than their warrior kin, they scout ahead and report back to their war bands.',
            attributes: { str: 13, agi: 8, vit: 11, int: 2, dex: 9, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['scout_charge', 'war_cry', 'brutal_swing'],
            city: 'Stormhaven'
        },
        harpy: {
            name: 'Harpy', type: 'monster', element: 'wind', img: '/public/assets/img/harpy.png',
            desc: 'A flying creature that nests in coastal cliffs. Their piercing screeches can stun enemies, and their talons strike from above.',
            attributes: { str: 8, agi: 14, vit: 7, int: 5, dex: 13, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['harpy_screech', 'talon_strike', 'wind_gust'],
            city: 'Stormhaven'
        },
        troll_warrior: {
            name: 'Troll Warrior', type: 'monster', element: 'earth', img: '/public/assets/img/troll_warrior.png',
            desc: 'A coastal troll warrior known for their incredible regeneration. They fight with massive clubs and rarely retreat from battle.',
            attributes: { str: 15, agi: 4, vit: 14, int: 2, dex: 7, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['troll_regeneration', 'heavy_club', 'berserker_rage'],
            city: 'Stormhaven'
        },
        pirate_ghost: {
            name: 'Pirate Ghost', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'The restless spirit of a fallen pirate, cursed to haunt the coast. They wield ethereal weapons and drain the life force of the living.',
            attributes: { str: 9, agi: 10, vit: 8, int: 8, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['ghostly_strike', 'mana_drain', 'cursed_sword'],
            city: 'Stormhaven'
        },
        captain_grimbeard: {
            name: 'Captain Grimbeard', type: 'monster', element: 'shadow', img: '/public/assets/img/captain_grimbeard.png',
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
            name: 'Gelatinous Cube', type: 'monster', element: 'poison', img: '/public/assets/img/gelatinous_cube.png',
            desc: 'A gelatinous cube that absorbs and dissolves its prey. They slowly move through dungeons and forests, consuming anything in their path.',
            attributes: { str: 7, agi: 3, vit: 11, int: 4, dex: 5, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['gelatinous_absorb', 'bounce', 'gelatinous_split'],
            city: 'Eldervale'
        },
        feral_wolf: {
            name: 'Feral Wolf', type: 'monster', element: 'neutral', img: '/public/assets/img/feral_wolf.png',
            desc: 'A wild wolf from the deep forests. More aggressive than their dire cousins, they hunt alone and attack with savage ferocity.',
            attributes: { str: 9, agi: 11, vit: 7, int: 2, dex: 9, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['feral_bite', 'pack_howl', 'lunge'],
            city: 'Eldervale'
        },
        giant_spider: {
            name: 'Giant Spider', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A massive spider that weaves deadly webs in the forest. Their venomous bite and web traps make them dangerous predators.',
            attributes: { str: 8, agi: 10, vit: 9, int: 4, dex: 11, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['spider_bite', 'web_trap', 'poison_spit'],
            city: 'Eldervale'
        },
        bat_swarm: {
            name: 'Bat Swarm', type: 'monster', element: 'wind', img: '/public/assets/img/placeholder.png',
            desc: 'A swarm of bats that attacks in numbers. Their screeches disorient enemies while they drain blood with their sharp fangs.',
            attributes: { str: 6, agi: 13, vit: 6, int: 3, dex: 12, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['bat_swarm_attack', 'bat_screech', 'drain_blood'],
            city: 'Eldervale'
        },
        treant_sapling: {
            name: 'Treant Sapling', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A young animated tree that guards the forest. Though smaller than ancient treants, they are still formidable protectors of nature.',
            attributes: { str: 10, agi: 3, vit: 13, int: 5, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['root_strike', 'bark_skin', 'nature_heal'],
            city: 'Eldervale'
        },
        giant_rat: {
            name: 'Giant Rat', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A massive rat that dwells in forest undergrowth. Their quick scurrying and poisonous claws make them dangerous vermin.',
            attributes: { str: 7, agi: 12, vit: 8, int: 3, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['giant_rat_bite', 'poison_claw', 'quick_scurry'],
            city: 'Eldervale'
        },
        hornet_queen: {
            name: 'Hornet Queen', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A giant hornet queen that commands swarms of smaller hornets. Her venomous stinger and ability to command her hive make her a deadly foe.',
            attributes: { str: 9, agi: 13, vit: 8, int: 5, dex: 14, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['stinger_strike', 'venom_cloud', 'hive_command'],
            city: 'Eldervale'
        },
        wild_boar: {
            name: 'Wild Boar', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A fierce wild boar that charges through the forest. Their thick hide and powerful tusks make them dangerous when cornered.',
            attributes: { str: 14, agi: 5, vit: 13, int: 2, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['boar_charge', 'tusk_strike', 'thick_hide'],
            city: 'Eldervale'
        },
        dryad: {
            name: 'Dryad', type: 'monster', element: 'wind', img: '/public/assets/img/placeholder.png',
            desc: 'A nature spirit bound to the forest. They wield nature magic and protect their domain with healing breezes and thorny vines.',
            attributes: { str: 7, agi: 10, vit: 9, int: 10, dex: 11, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['nature_bolt', 'healing_breeze', 'thorn_vine'],
            city: 'Eldervale'
        },
        ancient_treant: {
            name: 'Ancient Treant', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
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
            name: 'Arcane Fragment', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A fragment of pure arcane energy that drifts through magical towers. These unstable remnants of powerful spells attack with basic magic.',
            attributes: { str: 3, agi: 5, vit: 6, int: 8, dex: 7, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 6,
            skills: ['arcane_fragment_blast'],
            city: 'Aetherys'
        },
        cursed_book: {
            name: 'Cursed Book', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A tome corrupted by dark magic, its pages writhe with malevolent energy. It curses those who read it, weakening their minds.',
            attributes: { str: 2, agi: 4, vit: 7, int: 10, dex: 6, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['cursed_book_curse'],
            city: 'Aetherys'
        },
        floating_orb: {
            name: 'Floating Orb', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A magical orb that hovers through arcane ruins. Its ethereal nature makes it hard to hit, and it strikes with precise magic.',
            attributes: { str: 2, agi: 8, vit: 5, int: 9, dex: 10, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 10,
            skills: ['floating_orb_blast'],
            city: 'Aetherys'
        },
        possessed_armor: {
            name: 'Possessed Armor', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'An empty suit of armor animated by dark magic. It retains its defensive capabilities while striking with physical force.',
            attributes: { str: 10, agi: 3, vit: 13, int: 4, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 18, gold: 12,
            skills: ['possessed_armor_strike'],
            city: 'Aetherys'
        },
        shadow_wisp: {
            name: 'Shadow Wisp', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A wisp of pure shadow that drifts through magical spaces. Immune to physical attacks, it drains the life force of the living.',
            attributes: { str: 1, agi: 11, vit: 6, int: 11, dex: 9, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 22, gold: 15,
            skills: ['shadow_wisp_drain'],
            city: 'Aetherys'
        },
        golem_arcane: {
            name: 'Golem (Arcane)', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A golem constructed from arcane materials and infused with magic. It wields powerful arcane attacks and resists magical damage.',
            attributes: { str: 11, agi: 2, vit: 14, int: 12, dex: 4, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 25, gold: 18,
            skills: ['golem_arcane_blast'],
            city: 'Aetherys'
        },
        skeleton_mage: {
            name: 'Skeleton Mage', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'An undead mage that retains its magical knowledge in death. It casts dark spells and is vulnerable to holy magic.',
            attributes: { str: 4, agi: 6, vit: 8, int: 13, dex: 8, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 30, gold: 22,
            skills: ['skeleton_mage_bolt'],
            city: 'Aetherys'
        },
        gargoyle: {
            name: 'Gargoyle', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A stone guardian that perches on magical towers. It can fly and strikes with both physical and magical attacks.',
            attributes: { str: 12, agi: 7, vit: 12, int: 7, dex: 9, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 35, gold: 25,
            skills: ['gargoyle_stone_strike'],
            city: 'Aetherys'
        },
        wraith: {
            name: 'Wraith', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A powerful ghost that haunts arcane ruins. It drains mana from its victims, leaving them powerless.',
            attributes: { str: 5, agi: 9, vit: 9, int: 12, dex: 10, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 40, gold: 30,
            skills: ['wraith_soul_drain'],
            city: 'Aetherys'
        },
        arcane_construct: {
            name: 'Arcane Construct', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A powerful magical construct created by archmages. It channels pure arcane energy into devastating beams of magic.',
            attributes: { str: 8, agi: 4, vit: 13, int: 15, dex: 7, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 45, gold: 35,
            skills: ['arcane_construct_beam'],
            city: 'Aetherys'
        },
        archmage_specter: {
            name: 'Archmage Specter', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'The ghostly remains of a powerful archmage, still wielding immense arcane power. It commands multiple elements and can summon arcane orbs to aid in battle.',
            attributes: { str: 6, agi: 8, vit: 12, int: 18, dex: 11, luk: 7 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 60, gold: 50,
            skills: ['archmage_specter_orb', 'archmage_specter_storm', 'archmage_specter_focus'],
            isBoss: true,
            city: 'Aetherys'
        },

        // ========================================
        // DUNRATH MONSTERS (Rogue starting city)
        // ========================================
        thief_rat: {
            name: 'Thief Rat', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A small but incredibly agile rat that infests the docks of Dunrath. It has a habit of stealing small valuables and escaping before being noticed.',
            attributes: { str: 4, agi: 12, vit: 6, int: 3, dex: 10, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 8, gold: 15,
            skills: ['loot', 'quick_stab', 'dirty_trick'],
            city: 'Dunrath'
        },
        sewer_slime: {
            name: 'Sewer Slime', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A foul-smelling slime that lives in the dark sewers of Dunrath. Its touch is poisonous and its body is highly resistant to physical blows.',
            attributes: { str: 6, agi: 4, vit: 14, int: 5, dex: 4, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 12, gold: 8,
            skills: ['dissolve', 'toxic_spit', 'slime_split'],
            city: 'Dunrath'
        },
        gang_member: {
            name: 'Gang Member', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A low-level thug from one of Dunrath\'s many street gangs. They rely on numbers and underhanded tactics to overcome their victims.',
            attributes: { str: 10, agi: 9, vit: 10, int: 4, dex: 9, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 15, gold: 12,
            skills: ['stab', 'loot', 'dirty_blow'],
            city: 'Dunrath'
        },
        cursed_coin: {
            name: 'Cursed Coin', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A floating gold coin possessed by a greedy spirit. It lures victims with its shine before blasting them with dark energy.',
            attributes: { str: 3, agi: 10, vit: 5, int: 10, dex: 12, luk: 15 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 20, gold: 40,
            skills: ['shadow_bolt', 'mana_drain', 'magic_focus'],
            city: 'Dunrath'
        },
        ghoul_dunrath: {
            name: 'Ghoul', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'A flesh-eating undead that haunts the dark alleys of Dunrath. Its claws can paralyze victims, allowing it to feed at its leisure.',
            attributes: { str: 12, agi: 11, vit: 12, int: 2, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 25, gold: 15,
            skills: ['paralyzing_claw', 'savage_bite', 'undead_resilience'],
            city: 'Dunrath'
        },
        shadow_stalker: {
            name: 'Shadow Stalker', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A professional assassin who has embraced the shadows. They move silently and strike with lethal precision from the darkness.',
            attributes: { str: 11, agi: 16, vit: 8, int: 6, dex: 15, luk: 10 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 30, gold: 30,
            skills: ['backstab', 'shadow_strike', 'smoke_bomb'],
            city: 'Dunrath'
        },
        zombie_dunrath: {
            name: 'Zombie', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'A reanimated corpse that wanders the city at night. Though slow and mindless, its persistence and disease-carrying touch are deadly.',
            attributes: { str: 13, agi: 4, vit: 18, int: 1, dex: 5, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 35, gold: 10,
            skills: ['disease_scratch', 'savage_bite', 'undead_resilience'],
            city: 'Dunrath'
        },
        assassin_ghost: {
            name: 'Assassin Ghost', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'The spectral remnant of an elite assassin. It retains its deadly skills in death, striking from the ethereal plane with shadow blades.',
            attributes: { str: 10, agi: 18, vit: 10, int: 10, dex: 18, luk: 12 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 45, gold: 20,
            skills: ['assassinate', 'void_lance', 'shadow_volley'],
            city: 'Dunrath'
        },
        wight_dunrath: {
            name: 'Wight', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'A powerful undead warrior that drains the vitality of the living. It commands lesser undead and guards its territory with unyielding malice.',
            attributes: { str: 15, agi: 10, vit: 16, int: 8, dex: 12, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 55, gold: 40,
            skills: ['mana_drain', 'heavy_slash', 'dark_aura'],
            city: 'Dunrath'
        },
        thug_boss: {
            name: 'Thug Boss', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'The leader of one of the most powerful gangs in Dunrath. He is as smart as he is strong, using tactical superiority to crush his rivals.',
            attributes: { str: 18, agi: 12, vit: 18, int: 10, dex: 14, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 70, gold: 80,
            skills: ['taunt', 'brutal_swing', 'relentless_strike'],
            city: 'Dunrath'
        },
        shadowlord_vex: {
            name: 'Shadowlord Vex', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'The absolute ruler of Dunrath\'s underworld. A master of shadow magic and lethal daggers, Vex is a nightmare that haunts the waking world.',
            attributes: { str: 15, agi: 22, vit: 15, int: 15, dex: 22, luk: 15 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 100, gold: 150,
            skills: ['assassinate', 'void_lance', 'shadow_volley', 'nightmare_combo', 'death_mark'],
            isBoss: true,
            city: 'Dunrath'
        },

        // ========================================
        // LUMENFALL MONSTERS (Cleric starting city)
        // ========================================
        corrupted_spirit: {
            name: 'Corrupted Spirit', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A once-pure spirit that has been twisted by dark magic. It haunts the sacred grounds of Lumenfall, attacking with echoes of its former power.',
            attributes: { str: 4, agi: 6, vit: 8, int: 10, dex: 7, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 10, gold: 8,
            skills: ['shadow_bolt', 'mana_drain', 'magic_focus'],
            city: 'Lumenfall'
        },
        skeleton_warrior_lumenfall: {
            name: 'Skeleton Warrior', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'An animated skeleton that guards the ancient tombs of Lumenfall. It fights with relentless military precision and cold determination.',
            attributes: { str: 10, agi: 7, vit: 12, int: 3, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 15, gold: 10,
            skills: ['bone_strike', 'shield_bash', 'undead_resilience'],
            city: 'Lumenfall'
        },
        wandering_soul: {
            name: 'Wandering Soul', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A restless soul that cannot find peace. It drifts through the temples of Lumenfall, draining the life from anyone it touches.',
            attributes: { str: 3, agi: 9, vit: 7, int: 12, dex: 9, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 18, gold: 12,
            skills: ['shadow_wisp_drain', 'mana_drain', 'magic_focus'],
            city: 'Lumenfall'
        },
        cursed_grave: {
            name: 'Cursed Grave', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'A desecrated grave that has become a localized source of dark energy. It summoing spectral hands to drag victims into the earth.',
            attributes: { str: 12, agi: 2, vit: 18, int: 8, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 22, gold: 15,
            skills: ['root_grasp', 'dark_aura', 'rock_slam'],
            city: 'Lumenfall'
        },
        zombie_lumenfall: {
            name: 'Zombie', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'A slow but incredibly durable reanimated corpse. Its presence is cursed, spreading disease and rot to everything nearby.',
            attributes: { str: 12, agi: 3, vit: 20, int: 2, dex: 6, luk: 2 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 28, gold: 18,
            skills: ['disease_scratch', 'savage_bite', 'undead_resilience'],
            city: 'Lumenfall'
        },
        fallen_acolyte: {
            name: 'Fallen Acolyte', type: 'monster', element: 'holy', img: '/public/assets/img/placeholder.png',
            desc: 'A former trainee of the Lumenfall order who turned to dark arts. They wield a twisted version of holy magic, using it to heal themselves while harming others.',
            attributes: { str: 8, agi: 7, vit: 12, int: 15, dex: 10, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 35, gold: 25,
            skills: ['healing_breeze', 'void_lance', 'magic_focus'],
            city: 'Lumenfall'
        },
        mummy_lumenfall: {
            name: 'Mummy', type: 'monster', element: 'undead', img: '/public/assets/img/placeholder.png',
            desc: 'An ancient guardian preserved through forgotten rituals. Its wrappings are cursed, and its touch can drain the strength of even the mightiest warriors.',
            attributes: { str: 15, agi: 5, vit: 18, int: 6, dex: 8, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 42, gold: 30,
            skills: ['curse', 'disease_scratch', 'undead_resilience'],
            city: 'Lumenfall'
        },
        banshee_lumenfall: {
            name: 'Banshee', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'The spectral manifestation of a soul that died in great agony. Her piercing wail can paralyze the heart and shatter the mind.',
            attributes: { str: 5, agi: 12, vit: 10, int: 16, dex: 12, luk: 9 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 50, gold: 40,
            skills: ['harpy_screech', 'shadow_volley', 'mana_drain'],
            city: 'Lumenfall'
        },
        wraith_lumenfall: {
            name: 'Wraith', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A high-tier spectral entity that commands the shadows. It is nearly immune to physical attacks and drains the mental energy of its prey.',
            attributes: { str: 6, agi: 10, vit: 12, int: 18, dex: 14, luk: 10 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 60, gold: 50,
            skills: ['wraith_soul_drain', 'void_lance', 'dark_aura'],
            city: 'Lumenfall'
        },
        death_priest: {
            name: 'Death Priest', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'A master of necromancy who has sacrificed their humanity for eternal life. They lead the cults that haunt Lumenfall\'s forgotten catacombs.',
            attributes: { str: 10, agi: 8, vit: 15, int: 22, dex: 14, luk: 12 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 75, gold: 100,
            skills: ['archmage_specter_storm', 'curse', 'void_lance'],
            city: 'Lumenfall'
        },
        necromancer_valdis: {
            name: 'Necromancer Valdis', type: 'monster', element: 'shadow', img: '/public/assets/img/placeholder.png',
            desc: 'The dark sorcerer who holds Lumenfall in a grip of terror. Valdis commands the dead and wields the most forbidden of shadow arts.',
            attributes: { str: 12, agi: 10, vit: 20, int: 28, dex: 18, luk: 15 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 120, gold: 200,
            skills: ['archmage_specter_storm', 'death_mark', 'void_lance', 'shadow_volley', 'curse'],
            isBoss: true,
            city: 'Lumenfall'
        },

        // ========================================
        // BRUMAFÉRREA MONSTERS (Blacksmith starting city)
        // ========================================
        cave_bat: {
            name: 'Cave Bat', type: 'monster', element: 'neutral', img: '/public/assets/img/placeholder.png',
            desc: 'A large, aggressive bat that nests in the dark tunnels of the Brumaférrea mines. Its bites can cause persistent bleeding.',
            attributes: { str: 4, agi: 12, vit: 6, int: 2, dex: 10, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 2,
            exp: 10, gold: 8,
            skills: ['feral_bite', 'bat_screech', 'quick_escape'],
            city: 'Brumaférrea'
        },
        rock_mole: {
            name: 'Rock Mole', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A burrowing creature with stone-like claws. It can disappear into the ground and resurface to stun unsuspecting travelers.',
            attributes: { str: 8, agi: 5, vit: 13, int: 3, dex: 6, luk: 4 },
            maxHp: 1, maxMana: 1, baseLevel: 3,
            exp: 15, gold: 10,
            skills: ['root_grasp', 'rock_slam', 'stone_skin'],
            city: 'Brumaférrea'
        },
        coal_golem: {
            name: 'Coal Golem', type: 'monster', element: 'fire', img: '/public/assets/img/placeholder.png',
            desc: 'An animated mass of coal and heat. It burns anything it touches and can release clouds of soot to disorient its enemies.',
            attributes: { str: 12, agi: 3, vit: 15, int: 4, dex: 5, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 4,
            exp: 20, gold: 12,
            skills: ['ember_spear', 'fireball', 'stone_skin'],
            city: 'Brumaférrea'
        },
        giant_spider_brumaferrea: {
            name: 'Giant Spider', type: 'monster', element: 'poison', img: '/public/assets/img/placeholder.png',
            desc: 'A massive arachnid that has adapted to the heat of the lower mines. Its webs are strong as steel and its venom is concentrated.',
            attributes: { str: 10, agi: 10, vit: 12, int: 5, dex: 12, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 5,
            exp: 25, gold: 15,
            skills: ['spider_bite', 'web_trap', 'venom_cloud'],
            city: 'Brumaférrea'
        },
        kobold_miner: {
            name: 'Kobold Miner', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A small, industrious reptilian that mines for precious ores. They are protective of their claims and will attack with their heavy picks.',
            attributes: { str: 12, agi: 9, vit: 11, int: 4, dex: 11, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 6,
            exp: 30, gold: 25,
            skills: ['heavy_slam', 'loot', 'dirty_blow'],
            city: 'Brumaférrea'
        },
        fire_sprite: {
            name: 'Fire Sprite', type: 'monster', element: 'fire', img: '/public/assets/img/placeholder.png',
            desc: 'A mischievous elemental spirit born from the city\'s massive furnaces. They take joy in setting things on fire and dancing in the flames.',
            attributes: { str: 5, agi: 14, vit: 8, int: 15, dex: 12, luk: 10 },
            maxHp: 1, maxMana: 1, baseLevel: 7,
            exp: 38, gold: 20,
            skills: ['fireball', 'chain_spark', 'magic_focus'],
            city: 'Brumaférrea'
        },
        crystal_golem: {
            name: 'Crystal Golem', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A golem composed of beautiful but razor-sharp crystals. It reflects magical attacks and strikes with incredible force.',
            attributes: { str: 15, agi: 4, vit: 18, int: 10, dex: 7, luk: 5 },
            maxHp: 1, maxMana: 1, baseLevel: 8,
            exp: 48, gold: 40,
            skills: ['rock_slam', 'stone_skin', 'mana_shield'],
            city: 'Brumaférrea'
        },
        earth_elemental: {
            name: 'Earth Elemental', type: 'monster', element: 'earth', img: '/public/assets/img/placeholder.png',
            desc: 'A massive being made of rock and soil. It is the very embodiment of the mountain, slow but nearly impossible to move or damage.',
            attributes: { str: 18, agi: 2, vit: 22, int: 6, dex: 6, luk: 3 },
            maxHp: 1, maxMana: 1, baseLevel: 9,
            exp: 58, gold: 35,
            skills: ['earthquake', 'stone_skin', 'heavy_slam'],
            city: 'Brumaférrea'
        },
        lava_slime: {
            name: 'Lava Slime', type: 'monster', element: 'fire', img: '/public/assets/img/placeholder.png',
            desc: 'A slime creature composed of molten rock. Its body is so hot that it melts through armor and flesh alike on contact.',
            attributes: { str: 14, agi: 5, vit: 20, int: 12, dex: 8, luk: 6 },
            maxHp: 1, maxMana: 1, baseLevel: 10,
            exp: 70, gold: 30,
            skills: ['dissolve', 'fireball', 'molten_edge'],
            city: 'Brumaférrea'
        },
        forge_guardian: {
            name: 'Forge Guardian', type: 'monster', element: 'fire', img: '/public/assets/img/placeholder.png',
            desc: 'A mechanical sentinel that guards the great forges of Brumaférrea. It is armed with specialized tools designed to repel intruders.',
            attributes: { str: 20, agi: 8, vit: 22, int: 10, dex: 15, luk: 8 },
            maxHp: 1, maxMana: 1, baseLevel: 11,
            exp: 85, gold: 120,
            skills: ['heavy_slam', 'tempered_strike', 'molten_edge'],
            city: 'Brumaférrea'
        },
        forge_master_krag: {
            name: 'Forge Master Krag', type: 'monster', element: 'fire', img: '/public/assets/img/placeholder.png',
            desc: 'The greatest blacksmith in the city who has merged his body with his legendary forge. Krag fights with the fury of a volcano and the precision of a master crafter.',
            attributes: { str: 25, agi: 10, vit: 25, int: 15, dex: 20, luk: 15 },
            maxHp: 1, maxMana: 1, baseLevel: 12,
            exp: 150, gold: 300,
            skills: ['worldbreaker', 'molten_edge', 'forge_overdrive', 'seismic_slam', 'tempered_strike'],
            isBoss: true,
            city: 'Brumaférrea'
        }
    },

    // Skill Definitions (single source of truth)
    // Loaded from ui/assets/js/skills-data.js
    skills: (window.skillsData || {}),

    items: (window.itemsData || {}),

    // Global Party Inventory (Shared by all heroes)
    partyInventory: {
        potion_hp: 5,
        potion_mana: 3,
        potion_antidote: 2,
        potion_panacea: 1,
        poison_vial: 2,
        iron_sword: 1,
        hunters_bow: 1,
        iron_plate: 1,
        steel_shield: 1
    }
};


