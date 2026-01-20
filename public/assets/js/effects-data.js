/**
 * Effects Data - declarative registry for buffs / debuffs / statuses.
 * Used for UI labels, icons (png/lucide) and friendly descriptions.
 *
 * NOTE: This is intentionally global (no bundler needed).
 */

window.effectsData = {
  // ---- STATUS / DEBUFFS ----
  poison: { type: 'debuff', name: 'Poison', lucide: 'skull', png: '/public/assets/icons/debuff/poison.webp', desc: 'Taking damage every turn.' },
  bleed: { type: 'debuff', name: 'Bleed', lucide: 'droplet', png: '/public/assets/icons/debuff/bleed.webp', desc: 'Losing health over time.' },
  burn: { type: 'debuff', name: 'Burn', lucide: 'flame', png: '/public/assets/icons/debuff/burn.webp', desc: 'Taking fire damage.' },
  freeze: { type: 'debuff', name: 'Freeze', lucide: 'snowflake', png: '/public/assets/icons/debuff/freeze.webp', desc: 'Cannot act while frozen.' },
  stun: { type: 'debuff', name: 'Stun', lucide: 'lock', png: '/public/assets/icons/debuff/stun.webp', desc: 'Cannot act.' },
  paralyze: { type: 'debuff', name: 'Paralyze', lucide: 'zap', png: '/public/assets/icons/debuff/paralyze.webp', desc: '50% chance to fail actions.' },
  slow: { type: 'debuff', name: 'Slow', lucide: 'snail', png: '/public/assets/icons/debuff/slow.webp', desc: 'Reduced speed.' },
  disease: { type: 'debuff', name: 'Disease', lucide: 'bug', png: '/public/assets/icons/debuff/diase.webp', desc: 'Reduces stats and causes damage over time.' },

  // ---- BUFFS ----
  hunters_focus: { type: 'buff', name: "Hunter's Focus", lucide: 'eye', png: '/public/assets/icons/skills/hunters_focus.webp', desc: 'Increases DEX, accuracy, crit and damage.' },
  battle_focus: { type: 'buff', name: 'Battle Focus', lucide: 'zap', png: '/public/assets/icons/skills/battle_focus.webp', desc: 'Increases damage and core stats.' },
  defensive_wall: { type: 'buff', name: 'Defensive Wall', lucide: 'shield-check', png: '/public/assets/icons/skills/defensive_wall.webp', desc: 'Reduces damage taken.' },
  parry_stance: { type: 'buff', name: 'Parry Stance', lucide: 'shield', png: '/public/assets/icons/skills/parry_stance.webp', desc: 'Chance to block attacks.' },
  mana_shield: { type: 'buff', name: 'Mana Shield', lucide: 'shield', png: null, desc: 'Reduces damage taken.' },
  arcane_focus: { type: 'buff', name: 'Arcane Focus', lucide: 'sparkles', png: null, desc: 'Increases magic damage and crit.' },
  bless: { type: 'buff', name: 'Blessing', lucide: 'sun', png: null, desc: 'Improves core stats.' },
  holy_shield: { type: 'buff', name: 'Holy Shield', lucide: 'shield-check', png: null, desc: 'Reduces damage taken.' },
  renewal: { type: 'buff', name: 'Renewal', lucide: 'heart', png: null, desc: 'Stabilizes and reduces damage taken.' },
  divine_favor: { type: 'buff', name: 'Divine Favor', lucide: 'zap', png: null, desc: 'Empowers your spirit.' },
  reflect_shield: { type: 'buff', name: 'Reflect Shield', lucide: 'shield', png: null, desc: 'Reflects 35% of incoming damage back to attackers.' },
  defensive_stance: { type: 'buff', name: 'Defensive Stance', lucide: 'shield-check', png: null, desc: 'Reduces damage taken by 30%, +15% parry chance.' },
  berserk_mode: { type: 'buff', name: 'Berserk Mode', lucide: 'sword', png: '/public/assets/icons/skills/berserk_mode.webp', desc: 'Increases ATK by 100% but reduces DEF by 50% for 3 turns. High risk, high reward.' },
  shell_defense: { type: 'buff', name: 'Shell Defense', lucide: 'shield', png: null, desc: 'Reduces damage taken by 25% for 3 turns.' },
  undead_resilience: { type: 'buff', name: 'Undead Resilience', lucide: 'shield', png: null, desc: 'Increases defense and reduces damage taken.' },
  troll_regeneration: { type: 'buff', name: 'Troll Regeneration', lucide: 'heart', png: null, desc: 'Increases vitality and defense for 3 turns.' },
  stone_skin: { type: 'buff', name: 'Stone Skin', lucide: 'shield', png: null, desc: 'Hardens skin like stone, increasing defense.' },
  dark_aura: { type: 'buff', name: 'Dark Aura', lucide: 'moon', png: null, desc: 'Increases strength, magic, and damage dealt.' },
  captain_taunt: { type: 'buff', name: 'Captain Taunt', lucide: 'speaker', png: null, desc: 'Provokes enemies and reduces damage taken.' },
  war_cry: { type: 'buff', name: 'War Cry', lucide: 'volume-2', png: null, desc: 'Increases strength and damage dealt.' },
  berserker_rage: { type: 'buff', name: 'Berserker Rage', lucide: 'frown', png: null, desc: 'Increases STR and damage, but takes more damage.' },
  quick_escape: { type: 'buff', name: 'Quick Escape', lucide: 'move', png: null, desc: 'Increases agility and dodge.' },
  gelatinous_split: { type: 'buff', name: 'Split', lucide: 'circle', png: null, desc: 'Splits into smaller parts, increasing vitality.' },
  bark_skin: { type: 'buff', name: 'Bark Skin', lucide: 'shield', png: null, desc: 'Hardens bark, increasing defense.' },
  bark_armor: { type: 'buff', name: 'Bark Armor', lucide: 'shield', png: null, desc: 'Ancient bark greatly increases defense.' },
  quick_scurry: { type: 'buff', name: 'Quick Scurry', lucide: 'move', png: null, desc: 'Increases agility and dodge.' },
  hive_command: { type: 'buff', name: 'Hive Command', lucide: 'volume-2', png: null, desc: 'Increases agility, dexterity, and crit.' },
  thick_hide: { type: 'buff', name: 'Thick Hide', lucide: 'shield', png: null, desc: 'Toughens hide, increasing defense significantly.' }
};



