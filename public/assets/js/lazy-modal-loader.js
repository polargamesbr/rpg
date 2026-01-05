/**
 * Generic Lazy Modal Loader
 * Reusable system for loading modals on demand with loading screen
 */

(function() {
    'use strict';

    // Cache to store loaded modals (prevent re-loading)
    const loadedModals = new Set();

    /**
     * Wait for all images in a container to load
     * @param {HTMLElement} container - Container element to check for images
     * @returns {Promise<void>}
     */
    function waitForImagesToLoad(container) {
        return new Promise((resolve) => {
            const images = container.querySelectorAll('img');
            
            if (images.length === 0) {
                resolve();
                return;
            }

            let loadedCount = 0;
            const totalImages = images.length;
            const imageStatus = new Map(); // Track which images have been counted

            const checkComplete = (img) => {
                // Prevent counting the same image multiple times
                if (imageStatus.has(img) && imageStatus.get(img)) {
                    return;
                }
                imageStatus.set(img, true);
                loadedCount++;
                
                // Update progress based on images loaded
                if (typeof updateModalLoadingProgress === 'function') {
                    const progress = 70 + Math.floor((loadedCount / totalImages) * 25); // 70-95%
                    updateModalLoadingProgress(progress);
                }
                
                if (loadedCount === totalImages) {
                    resolve();
                }
            };

            images.forEach((img) => {
                // If image is already loaded (cached), count it immediately
                if (img.complete && img.naturalHeight !== 0) {
                    checkComplete(img);
                } else {
                    let timeoutId = null;
                    const timeoutDuration = 10000; // 10 seconds
                    
                    const cleanup = () => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }
                    };
                    
                    // Wait for image to load
                    const onLoad = () => {
                        cleanup();
                        checkComplete(img);
                    };
                    
                    const onError = () => {
                        cleanup();
                        console.warn('Image failed to load:', img.src);
                        checkComplete(img);
                    };
                    
                    img.addEventListener('load', onLoad, { once: true });
                    img.addEventListener('error', onError, { once: true });
                    
                    // Fallback: if image doesn't load within timeout, continue anyway
                    timeoutId = setTimeout(() => {
                        if (!imageStatus.get(img)) {
                            console.warn('Image load timeout:', img.src);
                            cleanup();
                            checkComplete(img);
                        }
                    }, timeoutDuration);
                }
            });
        });
    }

    /**
     * Load a modal via AJAX and insert it into the DOM
     * @param {string} modalName - Name of the modal (e.g., 'worldmap')
     * @param {Object} options - Configuration options
     * @param {string} options.loadingTitle - Title for loading screen
     * @param {string} options.loadingSubtitle - Subtitle for loading screen
     * @param {Function} options.onLoaded - Callback after modal is loaded
     * @param {Function} options.onError - Callback on error
     * @returns {Promise<HTMLElement>} The modal element
     */
    window.loadModal = async function(modalName, options = {}) {
        const {
            loadingTitle = 'Loading...',
            loadingSubtitle = 'Please wait',
            onLoaded = null,
            onError = null,
            containerId = 'modal-container',
            forceReload = false,
            modalId = null // Custom modal ID (if different from modalName + '-modal')
        } = options;

        // Determine modal element ID
        const elementId = modalId || (modalName + '-modal');

        // Check if modal is already loaded
        const existingModal = document.getElementById(elementId);
        if (existingModal && !forceReload) {
            // Modal already exists, don't show loading screen
            if (onLoaded) onLoaded(existingModal);
            return existingModal;
        }

        // Show loading screen
        if (typeof showModalLoading === 'function') {
            showModalLoading(loadingTitle, loadingSubtitle);
        }

        try {
            // Get or create container
            let container = document.getElementById(containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                document.body.appendChild(container);
            }

            // Load modal HTML
            const response = await fetch(`/game/modal/${modalName}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load modal: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();
            
            // Update loading progress
            if (typeof updateModalLoadingProgress === 'function') {
                updateModalLoadingProgress(70);
            }

            // Create temporary container to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Move modal elements to main container
            const modalElements = tempDiv.children;
            while (modalElements.length > 0) {
                container.appendChild(modalElements[0]);
            }

            // Execute any scripts in the loaded HTML (sequentially for scripts with src)
            const scripts = container.querySelectorAll('script');
            
            for (const oldScript of scripts) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                
                if (oldScript.src) {
                    // For scripts with src, load sequentially (wait for each to finish)
                    await new Promise((resolve, reject) => {
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                } else {
                    // For inline scripts, execute immediately
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                }
            }

            // Mark as loaded
            loadedModals.add(modalName);

            // Find the modal element first
            const modalElement = document.getElementById(elementId);
            
            if (!modalElement) {
                // Try to find any element with id containing modalName
                const allModals = container.querySelectorAll('[id*="' + modalName + '"]');
                if (allModals.length > 0) {
                    console.warn(`Modal ID mismatch: expected "${elementId}", found "${allModals[0].id}"`);
                    throw new Error(`Modal element not found. Expected ID: "${elementId}". Found: "${allModals[0].id}"`);
                }
                throw new Error(`Modal element with ID "${elementId}" not found after loading`);
            }

            // Update loading progress
            if (typeof updateModalLoadingProgress === 'function') {
                updateModalLoadingProgress(70);
            }

            // Wait for all images to load
            await waitForImagesToLoad(modalElement);

            // Update loading progress
            if (typeof updateModalLoadingProgress === 'function') {
                updateModalLoadingProgress(100);
            }

            // Small delay for smooth transition
            await new Promise(resolve => setTimeout(resolve, 200));

            // Don't hide loading screen here - let the onLoaded callback handle it
            // The callback will hide the loading screen after the modal is properly initialized

            // Callback
            if (onLoaded) {
                onLoaded(modalElement);
            }

            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            return modalElement;

        } catch (error) {
            console.error('Error loading modal:', error);
            
            // Hide loading screen
            if (typeof hideModalLoading === 'function') {
                hideModalLoading();
            }

            // Callback
            if (onError) {
                onError(error);
            } else {
                alert('Failed to load modal. Please try again.');
            }

            throw error;
        }
    };

    /**
     * Check if a modal is already loaded
     * @param {string} modalName 
     * @param {string} modalId - Optional custom modal ID
     * @returns {boolean}
     */
    window.isModalLoaded = function(modalName, modalId = null) {
        const elementId = modalId || (modalName + '-modal');
        return loadedModals.has(modalName) || document.getElementById(elementId) !== null;
    };

    /**
     * Unload a modal (remove from DOM and cache)
     * @param {string} modalName 
     * @param {string} modalId - Optional custom modal ID
     */
    window.unloadModal = function(modalName, modalId = null) {
        const elementId = modalId || (modalName + '-modal');
        const modalElement = document.getElementById(elementId);
        if (modalElement) {
            modalElement.remove();
        }
        loadedModals.delete(modalName);
    };

})();

