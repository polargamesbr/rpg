<!-- Sidebar Esquerda Fixa (HUD Style) -->
<aside class="w-[260px] sidebar-hud flex flex-col h-screen fixed left-0 top-0 z-50">
    
    <!-- Perfil do Personagem (Clean Layout) -->
    <div class="px-6 pt-10 pb-6">
        <!-- Avatar & Level -->
        <div class="flex flex-col items-center mb-6 relative z-10">
            <div class="cinematic-avatar-frame mb-3">
                <div class="w-full h-full rounded-full overflow-hidden border-2 border-black">
                    <img src="assets/img/avatar.png" alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div class="level-badge">LVL 7</div>
            </div>
            <h2 class="text-2xl text-stone-100 font-bold font-serif tracking-wide drop-shadow-md" style="font-family: 'Cinzel', serif;">WC</h2>
            <p class="text-[0.65rem] text-amber-500/90 font-bold tracking-[0.3em] uppercase mt-1">Swordsman</p>
        </div>

        <!-- Barras de Status (Icon Enhanced) -->
        <div class="space-y-4 px-1">
            <!-- HP -->
            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-red-400">
                        <i data-lucide="heart" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">HP</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80">850/1000</span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill hp-fill" style="width: 85%"></div>
                </div>
            </div>

            <!-- Mana -->
            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-blue-400">
                        <i data-lucide="droplet" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">MANA</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80">320/500</span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill mana-fill" style="width: 64%"></div>
                </div>
            </div>

            <!-- XP -->
            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-green-400">
                        <i data-lucide="star" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">XP</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80">2450/3000</span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill xp-fill" style="width: 82%"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2 mx-6"></div>

    <!-- Navegação (Grouped Sections) -->
    <nav class="flex-1 overflow-y-auto py-2">
        
        <!-- SECTION: WORLD -->
        <div class="nav-section-header">World</div>
        <ul class="space-y-1 mb-2">
            <li>
                <a href="city-hub.php" class="hud-nav-item <?php echo (isset($activePage) && $activePage == 'city-hub') ? 'active' : ''; ?>">
                    <i data-lucide="castle" class="hud-nav-icon"></i>
                    <span>City Gates</span>
                </a>
            </li>
            <li>
                <a href="tavern.php" class="hud-nav-item <?php echo (isset($activePage) && $activePage == 'tavern') ? 'active' : ''; ?>">
                    <i data-lucide="beer" class="hud-nav-icon"></i>
                    <span>Tavern</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); openWorldMapModal();">
                    <i data-lucide="map" class="hud-nav-icon"></i>
                    <span>World Map</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item">
                    <i data-lucide="compass" class="hud-nav-icon"></i>
                    <span>Expeditions</span>
                </a>
            </li>
        </ul>

        <!-- SECTION: HERO -->
        <div class="nav-section-header">Hero</div>
        <ul class="space-y-1 mb-2">
             <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); openCharacterModal();">
                    <i data-lucide="user" class="hud-nav-icon"></i>
                    <span>Character</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); openCharacterModal(); switchModalTab('inventory')">
                    <i data-lucide="backpack" class="hud-nav-icon"></i>
                    <span>Inventory</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item">
                    <i data-lucide="scroll" class="hud-nav-icon"></i>
                    <span>Quests</span>
                </a>
            </li>
        </ul>

        <!-- SECTION: SYSTEM -->
        <div class="nav-section-header">System</div>
        <ul class="space-y-1">
            <li>
                <a href="#" class="hud-nav-item">
                    <i data-lucide="settings" class="hud-nav-icon"></i>
                    <span>Settings</span>
                </a>
            </li>
        </ul>
    </nav>
    </nav>
</aside>

<!-- Include Global Modals -->
<?php include 'modal-character.php'; ?>
<?php include 'modal-worldmap.php'; ?>

