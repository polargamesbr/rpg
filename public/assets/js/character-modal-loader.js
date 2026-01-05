/**
 * Character Modal Loader
 * Lazy loads the character modal with loading screen
 */

(function() {
    'use strict';

    let characterModalLoaded = false;

    /**
     * Open Character Modal (with lazy loading)
     */
    window.openCharacterModal = async function(tabName = null) {
        try {
            // Check if modal element exists
            const existingModal = document.getElementById('character-modal');
            
            if (!existingModal && typeof loadModal === 'function') {
                // Modal not loaded yet, load it with loading screen
                await loadModal('character', {
                    modalId: 'character-modal', // Custom ID mapping
                    loadingTitle: 'Loading Character',
                    loadingSubtitle: 'Preparing your profile',
                    onLoaded: function(modalElement) {
                        characterModalLoaded = true;
                        // Hide loading screen before opening modal
                        if (typeof hideModalLoading === 'function') {
                            hideModalLoading();
                        }
                        // Small delay to ensure modal is in DOM
                        setTimeout(() => {
                            openCharacterModalInternal(tabName);
                            // Initialize character stats
                            if (typeof window.initCharacterModalStats === 'function') {
                                window.initCharacterModalStats();
                            }
                        }, 100);
                    },
                    onError: function(error) {
                        console.error('Failed to load character modal:', error);
                        alert('Failed to load character modal. Please try again.');
                    }
                });
            } else {
                // Modal already loaded, just open it
                openCharacterModalInternal(tabName);
                // Initialize character stats
                if (typeof window.initCharacterModalStats === 'function') {
                    window.initCharacterModalStats();
                }
            }
        } catch (error) {
            console.error('Error opening character modal:', error);
        }
    };

    /**
     * Internal function to open the modal (called after loading)
     */
    function openCharacterModalInternal(tabName = null) {
        const modal = document.getElementById('character-modal');
        const content = document.getElementById('char-modal-content');
        if(!modal || !content) return;
        
        modal.classList.remove('hidden');
        modal.style.pointerEvents = "auto";
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }, 10);
        
        // Switch to specified tab if provided
        if(tabName && typeof switchModalTab === 'function') {
            setTimeout(() => {
                switchModalTab(tabName);
            }, 50);
        }

        if(typeof lucide !== 'undefined') lucide.createIcons();
    }

    // closeCharacterModal() is defined in the modal's own script for onclick handlers

})();

