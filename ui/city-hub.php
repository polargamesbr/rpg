<?php $activePage = 'city-hub'; ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>City Hub - RPG</title>
    <?php include 'head.php'; ?>
</head>
<body class="bg-black text-stone-100 overflow-hidden">
    
    <!-- Footer/Background Wrapper -->
    <div class="fixed inset-0 z-0">
        <div class="absolute inset-0 bg-stone-900"></div>
    </div>
    
    <div class="flex h-screen relative z-10">
        
        <?php include 'sidebar.php'; ?>

        <!-- Área Principal -->
        <main class="flex-1 ml-[260px] flex flex-col h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
            
            <!-- Hero Section com Background -->
            <div class="relative w-full shrink-0" style="height: 50vh; min-height: 400px;">
                <img src="assets/img/stormhaven.png" alt="Stormhaven" class="w-full h-full object-cover object-center">
                <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-900 to-transparent"></div>
                
                <!-- Atmospheric Fog (Optional - reusing existing styles if possible) -->
                <div class="fog-layer fog-layer-1" style="height: 100%;"></div>
                
                <!-- Header Superior (Absolute) -->
                <header class="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 pt-6 z-20">
                    <div>
                        <h1 class="city-title text-5xl font-bold text-stone-100 drop-shadow-lg">Stormhaven</h1>
                        <p class="text-xs text-amber-500/80 font-medium tracking-widest uppercase mt-2">The Capital City</p>
                    </div>
                    <div class="time-weather-panel px-4 py-2 rounded-lg backdrop-blur-md bg-stone-900/60 border border-stone-700/50">
                        <div class="flex items-center gap-4">
                            <div>
                                <div class="text-[10px] text-stone-400 tracking-wider">LOCAL TIME</div>
                                <div class="text-lg font-mono font-bold text-amber-50 leading-none">14:27</div>
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

    <script>
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

                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                    
                    // Shiny glare effect
                    const glareX = (x / rect.width) * 100;
                    const glareY = (y / rect.height) * 100;
                    card.style.setProperty('--glare-pos-x', `${glareX}%`);
                    card.style.setProperty('--glare-pos-y', `${glareY}%`);
                    card.classList.add('active-tilt');
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                    card.classList.remove('active-tilt');
                });
            });
        });
    </script>
</body>
</html>

