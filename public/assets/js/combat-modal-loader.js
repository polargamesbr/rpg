/**
 * Combat Modal Loader
 * Lazy loads the combat modal with loading screen and initializes the combat system
 */

(function() {
    'use strict';

    let combatModalLoaded = false;

    /**
     * Open Combat Modal (with lazy loading)
     */
    window.openCombatModal = async function() {
        try {
            // Check if modal element exists
            const existingModal = document.getElementById('combat-modal');
            
            if (!existingModal && typeof loadModal === 'function') {
                // Modal not loaded yet, load it with loading screen
                await loadModal('combat', {
                    modalId: 'combat-modal',
                    loadingTitle: 'Loading Combat',
                    loadingSubtitle: 'Preparing battle...',
                    onLoaded: function(modalElement) {
                        combatModalLoaded = true;
                        // Don't close loading screen yet - wait for modal to be visible
                        // Small delay to ensure modal is in DOM and scripts are loaded
                        setTimeout(() => {
                            initializeCombatSystem();
                        }, 300);
                    },
                    onError: function(error) {
                        console.error('Failed to load combat modal:', error);
                        alert('Failed to load combat modal. Please try again.');
                    }
                });
            } else {
                // Modal already loaded, just open it
                openCombatModalInternal();
            }
        } catch (error) {
            console.error('Error opening combat modal:', error);
        }
    };

    /**
     * Initialize combat system after modal is loaded
     */
    function initializeCombatSystem() {
        // Check if combatSystem is available
        if (typeof combatSystem === 'undefined') {
            console.error('Combat system not loaded. Waiting...');
            // Retry after a short delay
            setTimeout(() => {
                if (typeof combatSystem !== 'undefined') {
                    initializeCombatSystem();
                } else {
                    console.error('Combat system failed to load after retry');
                    // Hide loading screen on error
                    if (typeof hideModalLoading === 'function') {
                        hideModalLoading();
                    }
                }
            }, 500);
            return;
        }

        // Initialize and open setup
        if (combatSystem.startCombat) {
            combatSystem.startCombat();
            
            // Wait a bit for the setup screen to be visible, then hide loading screen
            setTimeout(() => {
                const setupScreen = document.getElementById('combat-setup');
                const modal = document.getElementById('combat-modal');
                // Only hide loading screen if setup is visible or modal is visible
                if ((setupScreen && !setupScreen.classList.contains('hidden')) || 
                    (modal && !modal.classList.contains('hidden'))) {
                    if (typeof hideModalLoading === 'function') {
                        hideModalLoading();
                    }
                }
            }, 500);
        } else {
            console.error('combatSystem.startCombat is not available');
            // Hide loading screen on error
            if (typeof hideModalLoading === 'function') {
                hideModalLoading();
            }
        }
    }

    /**
     * Internal function to open the modal (called after loading)
     */
    function openCombatModalInternal() {
        const modal = document.getElementById('combat-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        modal.style.pointerEvents = "auto";
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
        }, 10);

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Close Combat Modal
     */
    window.closeCombatModal = function() {
        const modal = document.getElementById('combat-modal');
        if (!modal) return;

        modal.classList.add('opacity-0');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.pointerEvents = "none";
            modal.setAttribute('aria-hidden', 'true');
        }, 500);
    };

})();
