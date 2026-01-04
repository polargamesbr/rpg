/**
 * World Map Modal Loader
 * Lazy loads the worldmap modal with loading screen
 */

(function() {
    'use strict';

    let worldmapModalLoaded = false;

    /**
     * Open World Map Modal (with lazy loading)
     */
    window.openWorldMapModal = async function() {
        try {
            // Check if modal element exists
            const existingModal = document.getElementById('world-map-modal');
            
            if (!existingModal && typeof loadModal === 'function') {
                // Modal not loaded yet, load it with loading screen
                // Note: modalId is 'world-map-modal' (with hyphen) but modalName is 'worldmap'
                await loadModal('worldmap', {
                    modalId: 'world-map-modal', // Custom ID mapping
                    loadingTitle: 'Loading World Map',
                    loadingSubtitle: 'Preparing your adventure',
                    onLoaded: function(modalElement) {
                        worldmapModalLoaded = true;
                        // Small delay to ensure modal is in DOM
                        setTimeout(() => {
                            openWorldMapModalInternal();
                        }, 100);
                    },
                    onError: function(error) {
                        console.error('Failed to load world map modal:', error);
                        alert('Failed to load world map. Please try again.');
                    }
                });
            } else {
                // Modal already loaded, just open it
                openWorldMapModalInternal();
            }
        } catch (error) {
            console.error('Error opening world map modal:', error);
        }
    };

    /**
     * Internal function to open the modal (called after loading)
     */
    function openWorldMapModalInternal() {
        const modal = document.getElementById('world-map-modal');
        const scrollZone = document.getElementById('map-scroll-zone');
        if(!modal) return;
        
        modal.classList.remove('hidden');
        modal.style.pointerEvents = "auto";
        
        setTimeout(() => {
            modal.classList.remove('opacity-0');
        }, 10);
        
        if(scrollZone) {
            setTimeout(() => {
                // simple horizontal center
                if(scrollZone.scrollWidth > scrollZone.clientWidth) {
                    scrollZone.scrollLeft = (scrollZone.scrollWidth - scrollZone.clientWidth) / 2;
                }
            }, 50);
        }

        if(typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Close World Map Modal (unchanged)
     */
    window.closeWorldMapModal = function() {
        const modal = document.getElementById('world-map-modal');
        if (typeof hideQuestTooltip === 'function') {
            hideQuestTooltip();
        }
        if(modal) {
             modal.classList.add('opacity-0');
             setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.pointerEvents = "none";
            }, 300);
        }
    };

})();

