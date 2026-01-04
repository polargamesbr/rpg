<!-- MODAL LOADING OVERLAY (Generic & Reusable) -->
<div id="modal-loading-overlay" class="fixed inset-0 z-[150] hidden opacity-0 transition-opacity duration-300" aria-hidden="true" style="pointer-events: none;">
    
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md pointer-events-auto transition-opacity"></div>

    <!-- Loading Content -->
    <div class="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
        
        <!-- Main Loading Container -->
        <div class="relative flex flex-col items-center justify-center space-y-8 pointer-events-auto">
            
            <!-- Animated Rings -->
            <div class="relative w-32 h-32 flex items-center justify-center">
                <!-- Outer Ring -->
                <div class="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                <div class="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" style="animation-duration: 1s;"></div>
                
                <!-- Middle Ring -->
                <div class="absolute inset-4 border-3 border-amber-600/30 rounded-full"></div>
                <div class="absolute inset-4 border-3 border-transparent border-b-amber-600 rounded-full animate-spin" style="animation-duration: 1.5s; animation-direction: reverse;"></div>
                
                <!-- Inner Ring -->
                <div class="absolute inset-8 border-2 border-amber-700/40 rounded-full"></div>
                <div class="absolute inset-8 border-2 border-transparent border-r-amber-700 rounded-full animate-spin" style="animation-duration: 0.8s;"></div>
                
                <!-- Center Glow -->
                <div class="absolute inset-12 bg-amber-500/20 rounded-full blur-md animate-pulse"></div>
                <div class="absolute inset-14 bg-amber-500/10 rounded-full"></div>
            </div>

            <!-- Loading Text -->
            <div class="text-center space-y-3">
                <h3 id="modal-loading-title" class="text-2xl font-serif text-amber-400 tracking-wider" style="font-family: 'Cinzel', serif;">
                    Loading...
                </h3>
                <p id="modal-loading-subtitle" class="text-sm text-stone-400 font-mono tracking-widest uppercase">
                    Please wait
                </p>
            </div>

            <!-- Progress Bar (Optional) -->
            <div class="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <div id="modal-loading-progress" class="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 transition-all duration-300" style="width: 0%; background-size: 200% 100%; animation: shimmer 2s infinite;"></div>
            </div>

        </div>

        <!-- Decorative Particles (Optional) -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-500/30 rounded-full animate-pulse" style="animation-delay: 0s; animation-duration: 2s;"></div>
            <div class="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-400/40 rounded-full animate-pulse" style="animation-delay: 0.5s; animation-duration: 2.5s;"></div>
            <div class="absolute bottom-1/4 left-1/3 w-2 h-2 bg-amber-600/20 rounded-full animate-pulse" style="animation-delay: 1s; animation-duration: 2s;"></div>
            <div class="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-amber-500/30 rounded-full animate-pulse" style="animation-delay: 1.5s; animation-duration: 2.5s;"></div>
        </div>

    </div>

</div>

<style>
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }
    100% {
        background-position: 200% 0;
    }
}
</style>

<script>
    // Generic Loading Functions (Reusable)
    function showModalLoading(title = 'Loading...', subtitle = 'Please wait') {
        const overlay = document.getElementById('modal-loading-overlay');
        const titleEl = document.getElementById('modal-loading-title');
        const subtitleEl = document.getElementById('modal-loading-subtitle');
        const progressEl = document.getElementById('modal-loading-progress');
        
        if (!overlay) return;
        
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
        if (progressEl) progressEl.style.width = '0%';
        
        overlay.classList.remove('hidden');
        overlay.style.pointerEvents = 'auto';
        
        // Animate progress bar
        if (progressEl) {
            setTimeout(() => {
                progressEl.style.width = '70%';
            }, 100);
        }
        
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
        }, 10);
    }

    function updateModalLoadingProgress(percent) {
        const progressEl = document.getElementById('modal-loading-progress');
        if (progressEl) {
            progressEl.style.width = Math.min(100, Math.max(0, percent)) + '%';
        }
    }

    function hideModalLoading() {
        const overlay = document.getElementById('modal-loading-overlay');
        if (!overlay) return;
        
        const progressEl = document.getElementById('modal-loading-progress');
        if (progressEl) progressEl.style.width = '100%';
        
        setTimeout(() => {
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.pointerEvents = 'none';
            }, 300);
        }, 200);
    }
</script>

