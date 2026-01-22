<?php
/**
 * Script de testes de balanceamento — ataques normais e skills
 * Replica as fórmulas de tactical-skill-engine.js e map-engine.js
 *
 * Uso (CLI):  php scripts/balance_test.php
 * Uso (web):  http://localhost/rpg/scripts/balance_test.php
 *
 * Para variância 0.9–1.1 ou crítico: altere \$variance e \$crit no script.
 */

// --- FÓRMULAS (espelho de tactical-skill-engine.js) ---

function calcStats(int $lvl, array $a): array {
    $a = array_merge(['str' => 1, 'agi' => 1, 'vit' => 1, 'int' => 1, 'dex' => 1, 'luk' => 1], $a);

    $maxHp    = (int)(($lvl * 100) + ($a['vit'] * 25));
    $maxMana  = (int)(($lvl * 15) + ($a['int'] * 8));

    $statusAtk = (int)(($a['str'] * 5.5) + ($lvl * 6.5) + ($a['dex'] * 0.5) + ($a['luk'] * 0.3));
    $atk       = $statusAtk + 10;

    $statusMatk = (int)(($a['int'] * 5.5) + ($lvl * 6.5) + ($a['dex'] * 0.4) + ($a['luk'] * 0.3));
    $matk       = $statusMatk + 10;

    $atkRanged = (int)(($a['dex'] * 5.5) + ($a['str'] * 0.2) + ($a['luk'] * 0.2) + ($lvl * 6.5)) + 10;

    $softDef = (int)(($a['vit'] * 3.5) + ($lvl * 4.5) + ($a['agi'] * 0.5) + 5);
    $hardDef = (int)(10 + ($lvl * 1.5) + ($a['vit'] * 0.2));

    $mdef = (int)(($a['int'] * 3) + ($a['vit'] * 1.2) + ($lvl * 3.5) + 5);

    return [
        'atk' => $atk, 'matk' => $matk, 'atkRanged' => $atkRanged,
        'defense' => $softDef, 'mdef' => $mdef, 'maxHp' => $maxHp, 'maxMana' => $maxMana,
    ];
}

// --- DANO ATAQUE NORMAL (espelho de executeAttack) ---
// Fórmula: (baseDamage - defense*0.5) * variance; se crit *1.5
function dmgNormal(int $baseDmg, int $targetDef, float $variance = 1.0, bool $crit = false): int {
    $d = (int)floor(($baseDmg - $targetDef * 0.5) * $variance);
    $d = max(1, $d);
    if ($crit) $d = (int)floor($d * 1.5);
    return $d;
}

// --- DANO SKILL (espelho de executeSkill) ---
// baseDamage * (dmgMult/hits) * variance * (1.5 se crit); depois - def*0.3 ou - mdef*0.25
function dmgSkill(int $baseDmg, float $dmgMult, int $hits, bool $isMagic, int $targetDef, int $targetMdef, float $variance = 1.0, bool $crit = false): int {
    $hitMult = $dmgMult / max(1, $hits);
    $d = (int)floor($baseDmg * $hitMult * $variance * ($crit ? 1.5 : 1.0));
    $d = max(1, $d);
    if ($isMagic) {
        $d = max(1, $d - (int)floor($targetMdef * 0.25));
    } else {
        $d = max(1, $d - (int)floor($targetDef * 0.3));
    }
    return $d;
}

// Skills que têm múltiplos hits: o jogo aplica o mesmo valor por hit; aqui retornamos o total (soma dos hits)
// Para 2 hits: cada hit = dmgSkill(...); total = 2 * hit. Ou: dmg_mult já é o total, e hitDmgMult = dmg_mult/hits.
// No engine: damage = base * (dmgMult/hits) * variance; isso é por hit. Total = hits * por_hit = base * dmgMult * variance.
// Então para total da skill: base * dmgMult * variance * (crit?) - def. Ou seja, dmgSkill com hits=1 e dmgMult original
// não é por hit. No código: hitDmgMult = dmgMult/numHits, então cada hit = base * (dmgMult/hits) * var * crit - def.
// Total = hits * (base * (dmgMult/hits) * var * crit - def) = base * dmgMult * var * crit - hits * def_reduc.
// A redução é aplicada POR HIT: damage - def*0.3 é por hit. Então total = hits * (base*(dmgMult/hits)*var*crit - def*0.3).
// Nossa dmgSkill com hits>1: hitDmgMult = dmgMult/hits, um único "hit" de valor (base * hitDmgMult * var * crit) - def*0.3.
// Isso é o dano de 1 hit. Total = hits * dmgSkill(..., dmgMult/hits, 1, ...)? Não. dmgSkill recebe dmgMult e hits.
// Fazemos: porHit = base * (dmgMult/hits) * var * (1.5 se crit); porHit = max(1, porHit - def*0.3 ou mdef*0.25); total = porHit * hits.
// Então dmgSkill para multi-hit: retornar porHit * hits. Para isso, a redução def é aplicada uma vez por hit.
// Simplificação: nossa dmgSkill já divide dmgMult por hits e aplica def uma vez. Isso é o dano de UM hit.
// Para total: totalDmg = dmgSkill(base, dmgMult, hits, magic, def, mdef, var, crit) * hits? Não.
// dmgSkill(base, dmgMult, 2, ...): hitMult = dmgMult/2; d = base * hitMult * var * crit = base * (dmgMult/2) * var * crit. Depois -def*0.3.
// Isso é o dano de 1 de 2 hits. Total = 2 * dmgSkill(..., hits=2). Mas dmgSkill retorna um único valor. Se chamamos com hits=2,
// o valor retornado é o de um hit. Então total = dmgSkill(...) * hits. Correto.
// Resumo: dmgSkill com hits=2 retorna dano de 1 hit. Total skill = dmgSkill(...) * hits.

/** Retorna dano total da skill (soma de todos os hits). */
function dmgSkillTotal(int $baseDmg, float $dmgMult, int $hits, bool $isMagic, int $targetDef, int $targetMdef, float $variance = 1.0, bool $crit = false): int {
    $one = dmgSkill($baseDmg, $dmgMult, $hits, $isMagic, $targetDef, $targetMdef, $variance, $crit);
    return $one * max(1, $hits);
}

function isMagicSkill(array $s): bool {
    if (!empty($s['damageType']) && $s['damageType'] === 'magic') return true;
    $magicElements = ['fire', 'ice', 'lightning', 'holy', 'dark'];
    return !empty($s['element']) && in_array($s['element'], $magicElements, true);
}

// --- PERFIS DE TESTE ---

$SWORDSMAN_BASE = ['str' => 12, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5];
$ARCHER_BASE   = ['str' => 8, 'agi' => 16, 'vit' => 8, 'int' => 7, 'dex' => 18, 'luk' => 7];
$ACOLYTE_BASE  = ['str' => 5, 'agi' => 6, 'vit' => 7, 'int' => 14, 'dex' => 7, 'luk' => 6];
$WOLF_BASE     = ['str' => 10, 'agi' => 12, 'vit' => 8, 'int' => 2, 'dex' => 10, 'luk' => 3];
$SLIME_BASE    = ['str' => 8, 'agi' => 3, 'vit' => 12, 'int' => 6, 'dex' => 3, 'luk' => 5];
$HOBGOBLIN_BASE = ['str' => 35, 'agi' => 5, 'vit' => 40, 'int' => 1, 'dex' => 15, 'luk' => 5];

$TESTS = [
    // --- Ataque normal: Lv1 base ---
    ['name' => 'Swordsman Lv1 (base) vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'swordsman', 'lvl' => 1,  'attrs' => $SWORDSMAN_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Archer Lv1 (base) vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'archer', 'lvl' => 1,  'attrs' => $ARCHER_BASE, 'ranged' => true], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],

    // --- Lv99 e Lv130 com atributo 99 ---
    ['name' => 'Swordsman Lv99 STR99 vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'swordsman', 'lvl' => 99, 'attrs' => ['str' => 99, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Swordsman Lv130 STR99 vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'swordsman', 'lvl' => 130, 'attrs' => ['str' => 99, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Archer Lv99 DEX99 vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'archer', 'lvl' => 99, 'attrs' => ['str' => 8, 'agi' => 16, 'vit' => 8, 'int' => 7, 'dex' => 99, 'luk' => 7], 'ranged' => true], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Archer Lv130 DEX99 vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'archer', 'lvl' => 130, 'attrs' => ['str' => 8, 'agi' => 16, 'vit' => 8, 'int' => 7, 'dex' => 99, 'luk' => 7], 'ranged' => true], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Swordsman Lv99 STR99 vs Tank Lv99 VIT99 — Ataque normal', 'att' => ['class' => 'swordsman', 'lvl' => 99, 'attrs' => ['str' => 99, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5], 'ranged' => false], 'tgt' => ['name' => 'Tank', 'lvl' => 99, 'attrs' => ['str' => 1, 'agi' => 1, 'vit' => 99, 'int' => 1, 'dex' => 1, 'luk' => 1]], 'skill' => null],

    // --- Skills Lv99/Lv130 atr 99 ---
    ['name' => 'Swordsman Lv1 — Heavy Slash (x2) vs Slime Lv5', 'att' => ['class' => 'swordsman', 'lvl' => 1,  'attrs' => $SWORDSMAN_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 2.0, 'hits' => 2, 'element' => null]],
    ['name' => 'Swordsman Lv99 STR99 — Heavy Slash (x2) vs Slime Lv5', 'att' => ['class' => 'swordsman', 'lvl' => 99, 'attrs' => ['str' => 99, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 2.0, 'hits' => 2, 'element' => null]],
    ['name' => 'Archer Lv1 — Focused Shot vs Slime Lv5', 'att' => ['class' => 'archer', 'lvl' => 1,  'attrs' => $ARCHER_BASE, 'ranged' => true], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 1.8, 'hits' => 1, 'element' => null]],
    ['name' => 'Archer Lv99 DEX99 — Focused Shot vs Slime Lv5', 'att' => ['class' => 'archer', 'lvl' => 99, 'attrs' => ['str' => 8, 'agi' => 16, 'vit' => 8, 'int' => 7, 'dex' => 99, 'luk' => 7], 'ranged' => true], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 1.8, 'hits' => 1, 'element' => null]],
    ['name' => 'Acolyte Lv1 — Holy Bolt (magia/holy) vs Slime Lv5', 'att' => ['class' => 'acolyte', 'lvl' => 1,  'attrs' => $ACOLYTE_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 1.05, 'hits' => 1, 'element' => 'holy']],
    ['name' => 'Acolyte Lv99 INT99 — Holy Bolt (magia) vs Slime Lv5', 'att' => ['class' => 'acolyte', 'lvl' => 99, 'attrs' => ['str' => 5, 'agi' => 6, 'vit' => 7, 'int' => 99, 'dex' => 7, 'luk' => 6], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 1.05, 'hits' => 1, 'element' => 'holy']],
    ['name' => 'Acolyte Lv130 INT99 — Holy Bolt (magia) vs Slime Lv5', 'att' => ['class' => 'acolyte', 'lvl' => 130, 'attrs' => ['str' => 5, 'agi' => 6, 'vit' => 7, 'int' => 99, 'dex' => 7, 'luk' => 6], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 1.05, 'hits' => 1, 'element' => 'holy']],
    ['name' => 'Wolf Lv8 (base) — Lunar Rampage (x3) vs Slime Lv5', 'att' => ['class' => 'wolf', 'lvl' => 8, 'attrs' => $WOLF_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 2.0, 'hits' => 3, 'element' => null]],
    ['name' => 'Wolf Lv99 STR99 — Lunar Rampage (x3) vs Slime Lv5', 'att' => ['class' => 'wolf', 'lvl' => 99, 'attrs' => ['str' => 99, 'agi' => 12, 'vit' => 8, 'int' => 2, 'dex' => 10, 'luk' => 3], 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => ['dmg_mult' => 2.0, 'hits' => 3, 'element' => null]],
    ['name' => 'Swordsman Lv99 STR99 — Heavy Slash (x2) vs Tank Lv99 VIT99', 'att' => ['class' => 'swordsman', 'lvl' => 99, 'attrs' => ['str' => 99, 'agi' => 8, 'vit' => 10, 'int' => 15, 'dex' => 8, 'luk' => 5], 'ranged' => false], 'tgt' => ['name' => 'Tank', 'lvl' => 99, 'attrs' => ['str' => 1, 'agi' => 1, 'vit' => 99, 'int' => 1, 'dex' => 1, 'luk' => 1]], 'skill' => ['dmg_mult' => 2.0, 'hits' => 2, 'element' => null]],

    // --- Monstros fortes vs jogadores fracos ---
    ['name' => 'Slime Lv99 vs Swordsman Lv1 — Ataque normal', 'att' => ['class' => 'slime', 'lvl' => 99, 'attrs' => $SLIME_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 1, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
    ['name' => 'Slime Lv99 vs Swordsman Lv10 — Ataque normal', 'att' => ['class' => 'slime', 'lvl' => 99, 'attrs' => $SLIME_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 10, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
    ['name' => 'Slime Lv99 vs Swordsman Lv20 — Ataque normal', 'att' => ['class' => 'slime', 'lvl' => 99, 'attrs' => $SLIME_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 20, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
    ['name' => 'Slime Lv99 vs Swordsman Lv30 — Ataque normal', 'att' => ['class' => 'slime', 'lvl' => 99, 'attrs' => $SLIME_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 30, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
    ['name' => 'Wolf Lv99 vs Slime Lv5 — Ataque normal', 'att' => ['class' => 'wolf', 'lvl' => 99, 'attrs' => $WOLF_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Wolf Lv99 vs Swordsman Lv1 — Ataque normal', 'att' => ['class' => 'wolf', 'lvl' => 99, 'attrs' => $WOLF_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 1, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
    ['name' => 'Wolf Lv8 vs Slime Lv5 — Ataque normal (lobo > slime)', 'att' => ['class' => 'wolf', 'lvl' => 8, 'attrs' => $WOLF_BASE, 'ranged' => false], 'tgt' => ['name' => 'Slime', 'lvl' => 5, 'attrs' => $SLIME_BASE], 'skill' => null],
    ['name' => 'Hobgoblin Lv12 vs Swordsman Lv10 — Ataque normal', 'att' => ['class' => 'hobgoblin', 'lvl' => 12, 'attrs' => $HOBGOBLIN_BASE, 'ranged' => false], 'tgt' => ['name' => 'Swordsman', 'lvl' => 10, 'attrs' => $SWORDSMAN_BASE], 'skill' => null],
];

$variance = 1.0;
$crit = false;

// --- SAÍDA ---
header('Content-Type: text/plain; charset=utf-8');
echo "=== TESTES DE BALANCEAMENTO (fórmulas atuais) ===\n";
echo "Variance: {$variance} | Crít: " . ($crit ? 'sim' : 'não') . "\n\n";

foreach ($TESTS as $t) {
    $att = $t['att'];
    $tgt = $t['tgt'];
    $skill = $t['skill'];

    $sAtt = calcStats($att['lvl'], $att['attrs']);
    $sTgt = calcStats($tgt['lvl'], $tgt['attrs']);

    $baseDmg = 10;
    if ($skill) {
        $magic = isMagicSkill($skill);
        if ($magic) {
            $baseDmg = $sAtt['matk'];
        } elseif ($att['class'] === 'archer') {
            $baseDmg = $sAtt['atkRanged'] ?: $sAtt['atk'];
        } else {
            $baseDmg = $sAtt['atk'];
        }
    } else {
        // ataque normal
        if ($att['ranged']) {
            $baseDmg = $sAtt['atkRanged'] ?: $sAtt['atk'];
        } else {
            $baseDmg = $sAtt['atk'];
        }
    }

    if ($skill) {
        $magic = isMagicSkill($skill);
        $dmg = dmgSkillTotal($baseDmg, (float)($skill['dmg_mult'] ?? 1), (int)($skill['hits'] ?? 1), $magic, $sTgt['defense'], $sTgt['mdef'], $variance, $crit);
    } else {
        $dmg = dmgNormal($baseDmg, $sTgt['defense'], $variance, $crit);
    }

    echo str_repeat('-', 72) . "\n";
    echo $t['name'] . "\n";
    echo "  Atacante: ATK=" . $sAtt['atk'] . " ATK Ranged=" . $sAtt['atkRanged'] . " MATK=" . $sAtt['matk'] . " (Lv" . $att['lvl'] . ")\n";
    echo "  Alvo:     DEF=" . $sTgt['defense'] . " MDEF=" . $sTgt['mdef'] . " HP=" . $sTgt['maxHp'] . " (" . $tgt['name'] . " Lv" . $tgt['lvl'] . ")\n";
    echo "  Base dmg: {$baseDmg} → Dano final: {$dmg}\n";
    if ($skill && ($skill['hits'] ?? 1) > 1) {
        $perHit = (int)($dmg / ($skill['hits'] ?? 1));
        echo "  (por hit: ~{$perHit})\n";
    }
    echo "\n";
}

echo str_repeat('=', 72) . "\n";
echo "Resumo: compare Lv1 (base) vs Lv99/Lv130 (atributo 99) para ver o escalonamento.\n";
echo "Monstros fortes (Slime Lv99, Wolf Lv99) vs jogadores fracos; Tank VIT99 reduz dano.\n";
echo "Para variância 0.9–1.1 e críticos, altere \$variance e \$crit no script.\n";
