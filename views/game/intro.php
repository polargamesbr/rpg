<?php
$title = 'Prologue - Stormhaven';
$showSidebar = false;
$completeUrl = url('game/intro/complete');
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
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --gold: #d4af37;
            --gold-soft: #f2d16b;
            --bg: #050508;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            color: #f8fafc;
            min-height: 100vh;
            overflow: hidden;
        }
        .bg-layer {
            position: fixed;
            inset: 0;
            background-image: url('<?= asset('img/tavern-background.webp') ?>');
            background-size: cover;
            background-position: center;
            filter: grayscale(100%) blur(4px) brightness(0.35);
            opacity: 0.9;
            z-index: 0;
        }
        .bg-overlay {
            position: fixed;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(5,5,8,0.7) 45%, rgba(5,5,8,0.95) 100%);
            z-index: 1;
        }
        .container {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .panel {
            width: min(900px, 92vw);
            background: rgba(6, 6, 10, 0.65);
            border: 1px solid rgba(212,175,55,0.15);
            border-radius: 18px;
            padding: 3rem;
            box-shadow: 0 40px 120px rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .panel.hidden {
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
        }
        .title {
            font-family: 'Cinzel', serif;
            font-size: clamp(2rem, 3vw, 2.8rem);
            color: var(--gold);
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
        }
        .subtitle {
            font-size: 0.95rem;
            color: rgba(248,250,252,0.7);
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 2rem;
        }
        .story {
            font-size: 1.05rem;
            line-height: 1.9;
            color: rgba(248,250,252,0.9);
        }
        .story strong { color: var(--gold-soft); }
        .cta {
            margin-top: 2.5rem;
            display: flex;
            justify-content: flex-end;
        }
        .cta button {
            background: linear-gradient(145deg, #d4af37 0%, #b8941f 50%, #8a6d3b 100%);
            color: #1a0f00;
            border: 2px solid rgba(255, 215, 0, 0.6);
            border-radius: 12px;
            padding: 0.9rem 2.2rem;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 12px 30px rgba(212, 175, 55, 0.35);
        }
        .cta button:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 40px rgba(212,175,55,0.5);
        }
        .name-input {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .name-input input {
            background: transparent;
            border: none;
            border-bottom: 2px solid rgba(212,175,55,0.3);
            color: #fff;
            font-size: 1.6rem;
            font-family: 'Cinzel', serif;
            padding: 0.5rem 0;
            outline: none;
        }
        .name-input input:focus {
            border-bottom-color: var(--gold);
        }
        .helper {
            font-size: 0.85rem;
            color: rgba(248,250,252,0.6);
            letter-spacing: 0.15em;
            text-transform: uppercase;
        }
        .error {
            color: #f87171;
            font-size: 0.9rem;
            display: none;
        }
    </style>
</head>
<body>
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <div class="container">
        <div id="step-1" class="panel">
            <div class="title">Prologue</div>
            <div class="subtitle">The Young Swordsman</div>
            <div class="story">
                Você assume o papel de <strong>Aldric Valehart</strong>, um jovem espadachim vindo das fronteiras do reino.<br><br>
                Filho de um guarda que morreu defendendo as muralhas contra criaturas do norte, Aldric cresceu ouvindo histórias sobre Stormhaven, a Capital City onde heróis constroem seus nomes.<br><br>
                Sem título, sem fortuna e sem brasão, ele carrega apenas uma espada simples e uma promessa silenciosa: provar que seu nome pode significar algo.<br><br>
                Agora, essa promessa o trouxe até aqui.
            </div>
            <div class="cta">
                <button type="button" onclick="nextStep(2)">Continue</button>
            </div>
        </div>

        <div id="step-2" class="panel hidden">
            <div class="title">Stormhaven</div>
            <div class="subtitle">The Capital City</div>
            <div class="story">
                Sua aventura começa diante dos imensos portões de Stormhaven, The Capital City.<br><br>
                As muralhas se erguem imponentes contra o céu, e o som da cidade ecoa além dos portões — mercadores negociam, soldados vigiam, aventureiros cruzam as ruas movimentadas.<br><br>
                Você aperta o cabo da espada.<br><br>
                Atrás, apenas estrada.<br>
                À frente, oportunidade.<br><br>
                Stormhaven não conhece seu nome ainda.<br><br>
                <strong>Mas tudo começa hoje.</strong>
            </div>
            <div class="cta">
                <button type="button" onclick="nextStep(3)">Continue</button>
            </div>
        </div>

        <div id="step-3" class="panel hidden">
            <div class="title">Choose Your Name</div>
            <div class="subtitle">Your Legend Begins</div>
            <div class="story">
                Antes de cruzar os portões, escolha o nome pelo qual Stormhaven irá se lembrar de você.
            </div>
            <div class="name-input">
                <input id="name-input" type="text" value="Aldric Valehart" maxlength="50" />
                <div class="helper">Press Enter to continue</div>
                <div id="name-error" class="error">Nome inválido. Use 2-50 caracteres (letras, números, espaço, - ou ').</div>
            </div>
            <div class="cta">
                <button type="button" onclick="submitName()">Begin Journey</button>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();
        function nextStep(step) {
            document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
            const target = document.getElementById(`step-${step}`);
            if (target) target.classList.remove('hidden');
        }

        async function submitName() {
            const input = document.getElementById('name-input');
            const error = document.getElementById('name-error');
            const name = input.value.trim();

            if (!/^[\p{L}0-9\s'-]{2,50}$/u.test(name)) {
                error.style.display = 'block';
                return;
            }
            error.style.display = 'none';

            try {
                const res = await fetch('<?= $completeUrl ?>', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const data = await res.json();
                if (data.success && data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }
                error.textContent = data.error || 'Erro ao salvar nome.';
                error.style.display = 'block';
            } catch (e) {
                error.textContent = 'Erro ao salvar nome.';
                error.style.display = 'block';
            }
        }

        document.getElementById('name-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitName();
            }
        });
    </script>
</body>
</html>

