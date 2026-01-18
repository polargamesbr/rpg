<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title><?= htmlspecialchars($data['pageTitle'] ?? 'Batalha') ?> | RPG</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white overflow-hidden" style="font-family: 'Inter', sans-serif;">
    
    <?php include __DIR__ . '/../partials/modals/combat.php'; ?>

    <script>
        let sessionUid = null;
        let battleUid = null;
        // Initialize battle system
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            const isFromMap = <?= json_encode($data['isFromMap'] ?? false) ?>;
            sessionUid = <?= json_encode($data['sessionUid'] ?? null) ?>;
            const urlParams = new URLSearchParams(window.location.search);
            battleUid = urlParams.get('battle');
            
            // Show the combat modal
            const modal = document.getElementById('combat-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('opacity-100');
            }
            
            // Initialize combat system
            if (typeof combatSystem !== 'undefined') {
                combatSystem.init();
                
                if (isFromMap) {
                    // Try to restore battle state if exists
                    if (sessionUid && battleUid) {
                        fetch(`/game/battle/state?session=${encodeURIComponent(sessionUid)}&battle=${encodeURIComponent(battleUid)}`)
                            .then(r => r.json())
                            .then(data => {
                                if (data?.success && data.battle?.status === 'active' && data.state?.battle_state) {
                                    combatSystem.restoreBattleState(data.state.battle_state);
                                    startBattleAutosave(sessionUid, battleUid);
                                    return;
                                }
                                if (data?.success && data.battle?.status === 'active' && data.state?.battle) {
                                    combatSystem.startBattleFromMap(data.state.battle, sessionUid, battleUid);
                                    startBattleAutosave(sessionUid, battleUid);
                                    return;
                                }
                                abandonBattleAndExit();
                            })
                            .catch(() => {
                                abandonBattleAndExit();
                            });
                    } else if (sessionUid) {
                        fetch(`/game/battle/active?session=${encodeURIComponent(sessionUid)}`)
                            .then(r => r.json())
                            .then(data => {
                                if (data?.success && data.battle_uid) {
                                    const target = `/game/battle-from-map?session=${encodeURIComponent(sessionUid)}&battle=${encodeURIComponent(data.battle_uid)}`;
                                    window.location.href = target;
                                    return;
                                }
                                abandonBattleAndExit();
                            })
                            .catch(() => {
                                abandonBattleAndExit();
                            });
                    } else {
                        abandonBattleAndExit();
                    }
                } else {
                    // Normal setup mode for battle-test
                    combatSystem.openSetup();
                }
            }
        });

        function abandonBattleAndExit() {
            if (sessionUid && battleUid) {
                fetch(`/game/battle/complete?session=${encodeURIComponent(sessionUid)}&battle=${encodeURIComponent(battleUid)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ result: { outcome: 'abandoned' } })
                }).catch(() => {});
            }
            const redirectUrl = sessionUid ? `/game/explore?session=${encodeURIComponent(sessionUid)}` : '/game/tavern';
            window.location.href = redirectUrl;
        }

        function startBattleAutosave(sessionUid, battleUid) {
            if (!sessionUid || !battleUid) return;

            setInterval(() => {
                if (!combatSystem?.getBattleState) return;
                const state = combatSystem.getBattleState();
                fetch(`/game/battle/state?session=${encodeURIComponent(sessionUid)}&battle=${encodeURIComponent(battleUid)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state: { battle_state: state } })
                }).catch(() => {});
            }, 3000);
        }
        
        // Override closeCombatModal to return to map if from map
        function closeCombatModal() {
            const isFromMap = <?= json_encode($data['isFromMap'] ?? false) ?>;
            
            if (isFromMap) {
                // Save battle result and return to map
                const result = combatSystem.getBattleResult?.() || { outcome: 'victory' };
                if (sessionUid && battleUid) {
                    fetch(`/game/battle/complete?session=${encodeURIComponent(sessionUid)}&battle=${encodeURIComponent(battleUid)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ result })
                    }).catch(() => {});
                }

                const redirectUrl = sessionUid ? `/game/explore?session=${encodeURIComponent(sessionUid)}` : '/game/tavern';
                window.location.href = redirectUrl;
            } else {
                // Just hide the modal
                const modal = document.getElementById('combat-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('opacity-100');
                }
            }
        }
    </script>
</body>
</html>
