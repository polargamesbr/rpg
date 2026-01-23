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
    </style>
</head>
<body>
    <div class="panel">
        <div class="title">Account Panel</div>
        <div class="subtitle">Story Progress</div>
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
    </div>
</body>
</html>

