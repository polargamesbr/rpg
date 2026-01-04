/**
 * Action Bar Visibility Manager
 * Automatically hides/shows action bar based on whose turn it is
 */
(function () {
    // Store original stepTurn if it exists
    const originalInit = window.combatSystem?.init;

    // Helper to update body turn classes
    function updateTurnClasses(isPlayerTurn) {
        document.body.classList.remove('player-turn', 'enemy-turn', 'ai-turn');
        if (isPlayerTurn) {
            document.body.classList.add('player-turn');
        } else {
            document.body.classList.add('enemy-turn');
        }
    }

    // Hook into combat system when it's ready
    function hookCombatSystem() {
        if (!window.combatSystem) {
            setTimeout(hookCombatSystem, 100);
            return;
        }

        const cs = window.combatSystem;

        // Wrap getActiveHero to detect player turns
        const originalGetActiveHero = cs.getActiveHero;
        if (originalGetActiveHero) {
            cs.getActiveHero = function () {
                const result = originalGetActiveHero.call(this);
                if (result) {
                    updateTurnClasses(true);
                }
                return result;
            };
        }

        // Wrap startEnemyTurn to detect enemy turns
        const originalStartEnemyTurn = cs.startEnemyTurn;
        if (originalStartEnemyTurn) {
            cs.startEnemyTurn = function () {
                updateTurnClasses(false);
                return originalStartEnemyTurn.apply(this, arguments);
            };
        }

        // Wrap performAutoHeroTurn to detect AI hero turns
        const originalPerformAutoHeroTurn = cs.performAutoHeroTurn;
        if (originalPerformAutoHeroTurn) {
            cs.performAutoHeroTurn = function () {
                updateTurnClasses(false); // AI controlled hero = not player turn
                return originalPerformAutoHeroTurn.apply(this, arguments);
            };
        }

        console.log('[Action Bar Manager] Hooked into combat system');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hookCombatSystem);
    } else {
        hookCombatSystem();
    }
})();
