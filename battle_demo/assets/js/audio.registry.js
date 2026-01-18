/**
 * Audio Registry - Mapeamento de Eventos Sonoros para Arquivos de Ãudio
 * 
 * Estrutura de fallback:
 * 1. skill[skillId][event] - Som especÃ­fico da skill
 * 2. class[classId][event] - Som da classe
 * 3. weapon[weaponType][event] - Som da arma
 * 4. entity[entityType][event] - Som do tipo de entidade
 * 5. global[event] - Som global padrÃ£o
 */

window.audioRegistry = {
    // Sons globais padrÃ£o (fallback final)
    global: {
        skill_start: [
            'assets/mp3/skill_start1.mp3',
            'assets/mp3/skill_start2.mp3',
            'assets/mp3/skill_start3.mp3'
        ],
        hit: [
            'assets/mp3/hit1.mp3',
            'assets/mp3/hit2.mp3',
            'assets/mp3/hit3.mp3'
        ],
        miss: ['assets/mp3/miss.mp3'],
        crit: ['assets/mp3/critical.mp3'],
        damage_taken: [
            'assets/mp3/damage_taken1.mp3',
            'assets/mp3/damage_taken2.mp3',
            'assets/mp3/damage_taken3.mp3',
            'assets/mp3/damage_taken4.mp3'
        ],
        death: [
            'assets/mp3/death1.mp3',
            'assets/mp3/death2.mp3',
            'assets/mp3/death3.mp3',
            'assets/mp3/death4.mp3'
        ],
        buff_apply: [
            'assets/mp3/buff_apply1.mp3',
            'assets/mp3/buff_apply2.mp3',
            'assets/mp3/buff_apply3.mp3'
        ],
        debuff_apply: ['assets/mp3/debuff_apply.mp3'],
        attack_prepare: ['assets/mp3/impact.mp3'],
        parry: [
            'assets/mp3/parry1.mp3',
            'assets/mp3/parry2.mp3'
        ],
        super_effective: ['assets/mp3/super_effective.mp3'],
        skill_voice: [] // Opcional, nÃ£o tem fallback global
    },

    // Sons por tipo de arma
    weapon: {
        sword: {
            attack_prepare: ['assets/mp3/sword1.mp3'],
            hit: [
                'assets/mp3/sword1.mp3',
                'assets/mp3/sword2.mp3',
                'assets/mp3/sword3.mp3',
                'assets/mp3/sword4.mp3'
            ]
        },
        bow: {
            attack_prepare: [
                'assets/mp3/bow1.mp3',
                'assets/mp3/bow2.mp3',
                'assets/mp3/bow3.mp3'
            ],
            hit: [
                'assets/mp3/bow1.mp3',
                'assets/mp3/bow2.mp3',
                'assets/mp3/bow3.mp3'
            ]
        },
        staff: {
            attack_prepare: [
                'assets/mp3/staff_prepare1.mp3',
                'assets/mp3/staff_prepare2.mp3'
            ],
            hit: [
                'assets/mp3/staff_hit.mp3',
                'assets/mp3/staff_hit2.mp3',
                'assets/mp3/staff_hit3.mp3'
            ]
        },
        dagger: {
            attack_prepare: [
                'assets/mp3/dagger_attack_prepare1.mp3',
                'assets/mp3/dagger_attack_prepare2.mp3'
            ],
            hit: ['assets/mp3/dagger_hit.mp3']
        },
        hammer: {
            attack_prepare: [
                'assets/mp3/hammer_atack_prepare1.mp3',
                'assets/mp3/hammer_atack_prepare2.mp3',
                'assets/mp3/hammer_atack_prepare3.mp3'
            ],
            hit: [
                'assets/mp3/hammer_hit1.mp3',
                'assets/mp3/hammer_hit2.mp3',
                'assets/mp3/hammer_hit3.mp3'
            ]
        }
    },

    // Sons por classe
    class: {
        hero_swordman: {
            skill_start: [
                'assets/mp3/swordman_skill_start1.mp3',
                'assets/mp3/swordman_skill_start2.mp3',
                'assets/mp3/swordman_skill_start3.mp3'
            ],
            skill_voice: []
        },
        hero_archer: {
            skill_start: [
                'assets/mp3/archer_skill_start1.mp3',
                'assets/mp3/archer_skill_start2.mp3',
                'assets/mp3/archer_skill_start3.mp3'
            ],
            skill_voice: []
        },
        hero_mage: {
            skill_start: [
                'assets/mp3/mage_skill_start1.mp3',
                'assets/mp3/mage_skill_start2.mp3',
                'assets/mp3/mage_skill_start3.mp3',
                'assets/mp3/mage_skill_start4.mp3'
            ],
            skill_voice: []
        },
        hero_thief: {
            skill_start: [
                'assets/mp3/thief_skill_start1.mp3',
                'assets/mp3/thief_skill_start2.mp3',
                'assets/mp3/thief_skill_start3.mp3',
                'assets/mp3/thief_skill_start4.mp3'
            ],
            skill_voice: []
        },
        hero_acolyte: {
            skill_start: [
                'assets/mp3/acolyte_skill_prepare.mp3',
                'assets/mp3/acolyte_skill_prepare2.mp3',
                'assets/mp3/acolyte_skill_prepare3.mp3',
                'assets/mp3/acolyte_skill_prepare4.mp3'
            ],
            skill_voice: []
        },
        hero_blacksmith: {
            skill_start: [
                'assets/mp3/blacksmit_prepare1.mp3',
                'assets/mp3/blacksmit_prepare2.mp3',
                'assets/mp3/blacksmit_prepare3.mp3'
            ],
            skill_voice: []
        }
    },

    // Sons especÃ­ficos por skill (pode ser expandido)
    skill: {
        volcanic_arrowstorm: {
            skill_start: ['assets/mp3/volcanic_arrow_storm.mp3']
        },
        lunar_rampage: {
            skill_start: ['assets/mp3/howling_wolf.mp3'],
            hit: [
                'assets/mp3/wolf_claw_hit1.mp3',
                'assets/mp3/wolf_claw_hit2.mp3',
                'assets/mp3/wolf_claw_hit3.mp3',
                'assets/mp3/wolf_claw_hit4.mp3'
            ]
        },
        meteor: {
            skill_voice: ['assets/mp3/meteor_storm.mp3']
        },
        celestial_wrath: {
            skill_voice: ['assets/mp3/celestial_wrath.mp3']
        },
        // Exemplos - podem ser adicionados mais conforme necessÃ¡rio
        // quick_slash: {
        //     skill_start: ['assets/mp3/quick-slash.mp3']
        // },
        // fireball: {
        //     skill_start: ['assets/mp3/fireball-cast.mp3']
        // }
    },

    // Sons por tipo de entidade
    entity: {
        monster: {
            death: [
                'assets/mp3/monster_death1.mp3',
                'assets/mp3/monster_death2.mp3'
            ]
        },
        class: {
            death: [
                'assets/mp3/hero_death.mp3',
            ]
        }
    }
};


