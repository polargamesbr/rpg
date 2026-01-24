<?php
$title = 'Account Panel - RPG';
$showSidebar = false;
$introUrl = url('game/intro');
$cityUrl = url('game/city-hub');
$userName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
$characterName = $character['name'] ?? null;
$buttonUrl = $introDone ? $cityUrl : $introUrl;
$buttonText = $introDone ? 'Continue Story' : 'Start Story';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            background: #050508;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .panel {
            width: min(900px, 92vw);
            background: rgba(6, 6, 10, 0.7);
            border: 1px solid rgba(212,175,55,0.2);
            border-radius: 18px;
            padding: 3rem;
            box-shadow: 0 30px 90px rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
        }
        .panel-layout {
            display: grid;
            grid-template-columns: minmax(180px, 220px) 1fr;
            gap: 2.5rem;
        }
        .panel-sidebar {
            border-right: 1px solid rgba(255,255,255,0.08);
            padding-right: 2rem;
        }
        .panel-menu {
            margin-top: 1.5rem;
            display: grid;
            gap: 0.75rem;
        }
        .panel-menu a {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.7rem 0.9rem;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 0.7rem;
            font-weight: 700;
            color: rgba(248,250,252,0.6);
            text-decoration: none;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.04);
            transition: all 0.2s ease;
        }
        .panel-menu a:hover {
            color: #f8fafc;
            border-color: rgba(212,175,55,0.4);
            box-shadow: 0 0 20px rgba(212,175,55,0.15);
        }
        .panel-content {
            display: grid;
            gap: 2rem;
        }
        .title {
            font-family: 'Cinzel', serif;
            font-size: clamp(2rem, 3vw, 2.8rem);
            color: #d4af37;
            text-transform: uppercase;
            letter-spacing: 0.15em;
        }
        .subtitle {
            margin-top: 0.5rem;
            color: rgba(248,250,252,0.6);
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-size: 0.85rem;
        }
        .info {
            margin-top: 2rem;
            display: grid;
            gap: 1rem;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 0.8rem;
        }
        .label { color: rgba(248,250,252,0.5); }
        .value { font-weight: 600; }
        .cta {
            margin-top: 2.5rem;
            display: flex;
            justify-content: flex-end;
        }
        .cta button {
            background: linear-gradient(145deg, #d4af37 0%, #b8941f 50%, #8a6d3b 100%);
            color: #1a0f00;
            border: 2px solid rgba(255,215,0,0.6);
            border-radius: 12px;
            padding: 1rem 2.4rem;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            box-shadow: 0 12px 30px rgba(212,175,55,0.35);
            transition: all 0.3s ease;
        }
        .cta button:hover { transform: translateY(-2px); }
        .history {
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 1.5rem;
        }
        .history-title {
            font-family: 'Cinzel', serif;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            font-size: 0.8rem;
            color: rgba(248,250,252,0.7);
        }
        .history-list {
            margin-top: 1rem;
            display: grid;
            gap: 0.75rem;
            max-height: 280px;
            overflow-y: auto;
            padding-right: 0.5rem;
        }
        .history-item {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.8rem;
            padding: 0.7rem 0.9rem;
            border-radius: 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
        }
        .history-item .enemy {
            font-weight: 700;
        }
        .history-item .meta {
            font-size: 0.75rem;
            color: rgba(248,250,252,0.6);
        }
        .history-item .xp {
            font-weight: 700;
            color: #34d399;
            text-align: right;
        }
        .history-empty {
            font-size: 0.85rem;
            color: rgba(248,250,252,0.5);
            border: 1px dashed rgba(255,255,255,0.12);
            padding: 1rem;
            border-radius: 12px;
        }
        @media (max-width: 820px) {
            .panel {
                padding: 2rem;
            }
            .panel-layout {
                grid-template-columns: 1fr;
            }
            .panel-sidebar {
                border-right: none;
                padding-right: 0;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                padding-bottom: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="panel">
        <div class="panel-layout">
            <aside class="panel-sidebar">
                <div class="title">Account Panel</div>
                <div class="subtitle">Story Progress</div>
                <nav class="panel-menu">
                    <a href="#account">Conta</a>
                    <a href="#history">Histórico</a>
                </nav>
            </aside>
            <div class="panel-content">
                <section id="account">
                    <div class="info">
                        <div class="info-row">
                            <span class="label">Account</span>
                            <span class="value"><?= htmlspecialchars($userName ?: 'User') ?></span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email</span>
                            <span class="value"><?= htmlspecialchars($user['email'] ?? '-') ?></span>
                        </div>
                        <div class="info-row">
                            <span class="label">Main Character</span>
                            <span class="value">
                                <?= htmlspecialchars($characterName ?: 'Not created yet') ?>
                            </span>
                        </div>
                    </div>
                    <div class="cta">
                        <button type="button" onclick="window.location.href='<?= $buttonUrl ?>'"><?= $buttonText ?></button>
                    </div>
                </section>
                <section class="history" id="history">
                    <div class="history-title">Histórico de Monstros</div>
                    <?php if (!empty($expHistory ?? [])): ?>
                        <div class="history-list">
                            <?php foreach ($expHistory as $row): ?>
                                <div class="history-item">
                                    <div>
                                        <div class="enemy"><?= htmlspecialchars($row['enemy_name']) ?></div>
                                        <div class="meta">
                                            Quest: <?= htmlspecialchars($row['quest_id'] ?: '-') ?> · Lv <?= (int)$row['enemy_level'] ?>
                                        </div>
                                    </div>
                                    <div class="xp">+<?= (int)$row['exp_gained'] ?> XP</div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="history-empty">Nenhum monstro derrotado ainda.</div>
                    <?php endif; ?>
                </section>
            </div>
        </div>
    </div>
</body>
</html>

