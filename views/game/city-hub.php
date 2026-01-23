<?php
$title = 'City Hub - RPG Game';
$showSidebar = true;
$activePage = 'city-hub';
$character = $character ?? null;
$originCity = $originCity ?? 'Stormhaven';
$showGateDialog = $showGateDialog ?? false;
$forceGateDialog = $forceGateDialog ?? false;
$playerName = $character['name'] ?? 'Aldric';
$tavernUrl = url('game/tavern');

ob_start();
?>

<!-- Footer/Background Wrapper -->
<div class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-stone-900"></div>
</div>

<div class="flex h-screen relative z-10 overflow-hidden">
    
    <?php include __DIR__ . '/../partials/sidebar.php'; ?>

    <!-- Área Principal -->
    <main class="flex-1 ml-[280px] flex flex-col h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        <!-- Hero Section com Background -->
        <div class="relative w-full shrink-0" style="height: 50vh; min-height: 400px;">
            <?php
            // Map city names to image files
            $cityImages = [
                'Stormhaven' => 'stormhaven.webp',
                'Eldervale' => 'eldervale.png',
                'Aetherys' => 'aetherys.png',
                'Dunrath' => 'dunrath.png',
                'Lumenfall' => 'lumenfall.png',
                'Brumaférrea' => 'brumaferrea.png'
            ];
            $cityImage = $cityImages[$originCity] ?? 'stormhaven.webp';
            ?>
            <img src="<?= asset('img/' . $cityImage) ?>" alt="<?= htmlspecialchars($originCity) ?>" class="w-full h-full object-cover object-center">
            <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-900 to-transparent"></div>
            
            <!-- Atmospheric Fog -->
            <div class="fog-layer fog-layer-1" style="height: 100%;"></div>
            
            <!-- Header Superior (Absolute) -->
            <header class="absolute top-0 left-0 right-0 h-24 z-20 pt-6 px-8">
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 class="city-title text-5xl font-bold text-stone-100 drop-shadow-lg"><?= htmlspecialchars($originCity) ?></h1>
                        <p class="text-xs text-amber-500/80 font-medium tracking-widest uppercase mt-2">The Capital City</p>
                    </div>
                    <div class="time-weather-panel px-4 py-2 rounded-lg backdrop-blur-md bg-stone-900/60 border border-stone-700/50">
                        <div class="flex items-center gap-4">
                            <div>
                                <div class="text-[10px] text-stone-400 tracking-wider">LOCAL TIME</div>
                                <div class="text-lg font-mono font-bold text-amber-50 leading-none"><?= date('H:i') ?></div>
                            </div>
                            <div class="h-8 w-px bg-stone-700/50"></div>
                            <div class="flex flex-col items-end">
                                <span class="text-[10px] text-stone-300 font-semibold tracking-wider">CLEAR</span>
                                <div class="text-blue-300">
                                    <i data-lucide="sun" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>

        <!-- Área Principal de Ações (Negative Margin for overlap) -->
        <div class="flex-1 px-8 pb-12 -mt-24 relative z-20">
            <div class="max-w-7xl mx-auto">
                
                <!-- Cards de Ações -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Tavern -->
                    <div class="rpg-card tavern group" data-tilt>
                        <div class="card-content-wrapper">
                            <div class="card-border">
                                <div class="border-corner top-left"></div>
                                <div class="border-corner top-right"></div>
                                <div class="border-corner bottom-left"></div>
                                <div class="border-corner bottom-right"></div>
                            </div>
                            <div class="bg-overlay"></div>
                            <div class="rpg-card-content">
                                <h3 class="rpg-card-title">Tavern</h3>
                                <p class="rpg-card-subtitle">Rumors & Rest</p>
                                <div class="card-action-hint">Enter</div>
                            </div>
                        </div>
                    </div>

                    <!-- Market -->
                    <div class="rpg-card market group" data-tilt>
                        <div class="card-content-wrapper">
                            <div class="card-border">
                                <div class="border-corner top-left"></div>
                                <div class="border-corner top-right"></div>
                                <div class="border-corner bottom-left"></div>
                                <div class="border-corner bottom-right"></div>
                            </div>
                            <div class="bg-overlay"></div>
                            <div class="rpg-card-content">
                                <h3 class="rpg-card-title">Market</h3>
                                <p class="rpg-card-subtitle">Trade & Gear</p>
                                <div class="card-action-hint">Trade</div>
                            </div>
                        </div>
                    </div>

                    <!-- Forge -->
                    <div class="rpg-card forge group" data-tilt>
                        <div class="card-content-wrapper">
                            <div class="card-border">
                                <div class="border-corner top-left"></div>
                                <div class="border-corner top-right"></div>
                                <div class="border-corner bottom-left"></div>
                                <div class="border-corner bottom-right"></div>
                            </div>
                            <div class="bg-overlay"></div>
                            <div class="rpg-card-content">
                                <h3 class="rpg-card-title">Forge</h3>
                                <p class="rpg-card-subtitle">Craft & Upgrade</p>
                                <div class="card-action-hint">Smith</div>
                            </div>
                        </div>
                    </div>

                    <!-- Guild Hall -->
                    <div class="rpg-card guild group" data-tilt>
                        <div class="card-content-wrapper">
                            <div class="card-border">
                                <div class="border-corner top-left"></div>
                                <div class="border-corner top-right"></div>
                                <div class="border-corner bottom-left"></div>
                                <div class="border-corner bottom-right"></div>
                            </div>
                            <div class="bg-overlay"></div>
                            <div class="rpg-card-content">
                                <h3 class="rpg-card-title">Guild Hall</h3>
                                <p class="rpg-card-subtitle">Quests & Glory</p>
                                <div class="card-action-hint">Join</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>

</div>

<div id="tavern-unlock-modal" class="tavern-unlock-overlay">
    <div class="tavern-unlock-card">
        <div class="tavern-unlock-glow"></div>
        <div class="tavern-unlock-content">
            <div class="tavern-unlock-body">
                <div class="tavern-unlock-badge">
                    <i data-lucide="sparkles" class="w-4 h-4"></i>
                    Novo Local
                </div>
                <h2 class="tavern-unlock-title">A Taverna esta acessivel</h2>
                <p class="tavern-unlock-text">
                    Voce liberou a Taverna. La dentro voce pode encontrar missoes,
                    rumores e novas oportunidades para sua jornada.
                </p>
            </div>
            <div class="tavern-unlock-actions">
                <a class="tavern-unlock-primary" href="<?= $tavernUrl ?>">Ir a Taverna</a>
                <button type="button" class="tavern-unlock-secondary" data-close>Continuar na cidade</button>
            </div>
        </div>
    </div>
</div>

<?php
$showGateDialogJs = $showGateDialog ? 'true' : 'false';
$forceGateDialogJs = $forceGateDialog ? 'true' : 'false';
$playerNameJson = json_encode($playerName);
$eventUrl = url('game/events/complete');
$tavernUrl = url('game/tavern');

$additionalStyles = <<<CSS
.tavern-unlock-overlay {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at top, rgba(245, 158, 11, 0.15), rgba(0, 0, 0, 0.85));
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    z-index: 12000;
}

.tavern-unlock-overlay.is-visible {
    opacity: 1;
    pointer-events: auto;
}

.tavern-unlock-card {
    position: relative;
    width: min(92%, 560px);
    padding: 0;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(20, 16, 8, 0.98), rgba(10, 8, 5, 0.96));
    border: 1px solid rgba(245, 158, 11, 0.5);
    box-shadow:
        0 25px 80px rgba(0, 0, 0, 0.7),
        0 0 30px rgba(245, 158, 11, 0.2);
    text-align: center;
    animation: tavernUnlockPop 0.35s ease-out;
    max-height: min(82vh, 620px);
    display: flex;
    flex-direction: column;
}

.tavern-unlock-glow {
    position: absolute;
    inset: -2px;
    border-radius: 20px;
    background: linear-gradient(120deg, rgba(245, 158, 11, 0.6), transparent 50%, rgba(251, 191, 36, 0.6));
    filter: blur(10px);
    opacity: 0.5;
    z-index: 0;
}

.tavern-unlock-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: min(82vh, 620px);
}

.tavern-unlock-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: rgba(255, 222, 154, 0.95);
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 14px;
}

.tavern-unlock-title {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    letter-spacing: 0.08em;
    color: #fef3c7;
    text-shadow: 0 6px 22px rgba(245, 158, 11, 0.4);
    margin-bottom: 10px;
}

.tavern-unlock-text {
    color: rgba(255, 255, 255, 0.85);
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 22px;
}

.tavern-unlock-body {
    padding: 32px 28px 0;
    overflow: auto;
    max-height: calc(82vh - 140px);
}

.tavern-unlock-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    padding: 18px 24px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(8, 6, 4, 0.8);
    position: sticky;
    bottom: 0;
}

.tavern-unlock-primary {
    padding: 12px 22px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(251, 191, 36, 0.9));
    color: #1f1307;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.85rem;
    border: none;
    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tavern-unlock-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(245, 158, 11, 0.45);
}

.tavern-unlock-secondary {
    padding: 12px 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.tavern-unlock-secondary:hover {
    border-color: rgba(245, 158, 11, 0.5);
    color: #fef3c7;
}

@keyframes tavernUnlockPop {
    from {
        transform: translateY(12px) scale(0.96);
        opacity: 0;
    }
    to {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}

@media (max-width: 640px) {
    .tavern-unlock-title {
        font-size: 1.4rem;
    }
    .tavern-unlock-text {
        font-size: 0.95rem;
    }
    .tavern-unlock-body {
        padding: 14px 22px 0;
    }
}
CSS;

$additionalScripts = <<<JS
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Vanilla Tilt Logic
    const cards = document.querySelectorAll('.rpg-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -15; // Increased tilt for impact
            const rotateY = ((x - centerX) / centerX) * 15;

            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
            
            // Shiny glare effect
            const glareX = (x / rect.width) * 100;
            const glareY = (y / rect.height) * 100;
            card.style.setProperty('--glare-pos-x', glareX + '%');
            card.style.setProperty('--glare-pos-y', glareY + '%');
            card.classList.add('active-tilt');
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            card.classList.remove('active-tilt');
        });
    });

    const showGateDialog = {$showGateDialogJs};
    const forceGateDialog = {$forceGateDialogJs};
    if (showGateDialog && typeof window.initDialog === 'function') {
        window.dialogueContext = {
            playerName: {$playerNameJson}
        };
        window.onDialogueFinish = (scenarioId, completed) => {
            if (scenarioId !== 'stormhaven_gate_intro') return;
            if (!completed) return;
            if (forceGateDialog) return;
            fetch('{$eventUrl}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'stormhaven_gate_intro' })
            }).catch(() => {});
            showTavernUnlockModal();
        };
        initDialog('stormhaven_gate_intro');
    }
});

function showTavernUnlockModal() {
    const modal = document.getElementById('tavern-unlock-modal');
    if (!modal) return;
    modal.classList.add('is-visible');

    const closeButtons = modal.querySelectorAll('[data-close]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('is-visible');
        });
    });
}
JS;

$content = ob_get_clean();
include __DIR__ . '/../layouts/game.php';
?>
