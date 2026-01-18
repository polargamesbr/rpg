<?php
use App\Services\AuthService;
use App\Services\CharacterService;
use App\Models\ClassModel;

$character = CharacterService::getActiveCharacter();

// Get avatar image based on class and gender
$avatarImage = 'avatar.png';
$characterName = 'Unknown';
$characterClass = 'Adventurer';
$characterLevel = 1;

if ($character) {
    // Character already has class data from JOIN
    $gender = $character['gender'] ?? 'male';
    $imagePrefix = $character['image_prefix'] ?? 'archer';
    $avatarImage = $imagePrefix . '-' . $gender . '.png';
    
    $characterName = $character['name'] ?? 'Unknown';
    $characterClass = $character['class_display_name'] ?? $character['class_name'] ?? 'Adventurer';
    $characterLevel = $character['level'] ?? 1;
}
$hp = $character['hp'] ?? 100;
$maxHp = $character['max_hp'] ?? 100;
$mana = $character['mana'] ?? 50;
$maxMana = $character['max_mana'] ?? 50;
$xp = $character['xp'] ?? 0;
$nextLevelXp = ($characterLevel * 1000) ?? 1000;

$hpPercent = $maxHp > 0 ? ($hp / $maxHp) * 100 : 0;
$manaPercent = $maxMana > 0 ? ($mana / $maxMana) * 100 : 0;
$xpPercent = $nextLevelXp > 0 ? ($xp / $nextLevelXp) * 100 : 0;

$activePage = $activePage ?? '';
?>

<aside class="w-[280px] sidebar-hud-premium flex flex-col h-screen fixed left-0 top-0 z-50">
    
    <!-- === HERO SHOWCASE === -->
    <div class="relative h-[340px] shrink-0 overflow-hidden group">
        <!-- Background Image -->
        <img src="<?= asset('img/' . $avatarImage) ?>" alt="<?= htmlspecialchars($characterName) ?>" 
             class="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105">
        
        <!-- Subtle Vignette (less aggressive) -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/30 via-transparent to-transparent"></div>
        
        <!-- Level Badge (Premium Gold) -->
        <div class="absolute top-4 right-4 z-20">
            <div class="relative">
                <!-- Outer Glow -->
                <div class="absolute -inset-1 bg-gradient-to-br from-yellow-400/40 to-amber-600/40 rounded-2xl blur-md"></div>
                <!-- Badge Container -->
                <div class="relative px-4 py-2 bg-gradient-to-br from-[#1a1510] to-[#0d0a08] rounded-xl border border-yellow-600/40 shadow-[inset_0_1px_0_rgba(255,215,0,0.2)]">
                    <!-- Decorative Corner -->
                    <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-500/60 rounded-tl-lg"></div>
                    <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-500/60 rounded-br-lg"></div>
                    
                    <div class="flex flex-col items-center">
                        <span class="text-[8px] font-black text-yellow-600/80 uppercase tracking-[0.25em] leading-none">Level</span>
                        <span class="text-2xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-500 italic leading-none mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"><?= $characterLevel ?></span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Character Info (Bottom with local overlay) -->
        <div class="absolute bottom-0 left-0 right-0 z-10">
            <!-- Local overlay just for text contrast -->
            <div class="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
            
            <div class="relative p-5">
                <!-- Name -->
                <h2 class="text-2xl font-serif font-black text-white tracking-wide mb-2" style="font-family: 'Cinzel', serif; text-shadow: 0 2px 12px rgba(0,0,0,0.8);">
                    <?= htmlspecialchars($characterName) ?>
                </h2>
                <!-- Class Badge -->
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-900/30 to-transparent backdrop-blur-sm rounded-full border border-yellow-500/20">
                    <i data-lucide="sword" class="w-3 h-3 text-yellow-500"></i>
                    <span class="text-[10px] font-bold text-yellow-400/90 uppercase tracking-[0.15em]"><?= htmlspecialchars($characterClass) ?></span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- === VITAL STATS (Compact) === -->
    <div class="px-5 py-4 bg-[#0a0a0a] border-y border-white/5">
        <div class="space-y-3">
            <!-- HP -->
            <div class="group">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <i data-lucide="heart" class="w-3.5 h-3.5 text-red-400"></i>
                        </div>
                        <span class="text-[10px] font-black text-red-400 uppercase tracking-widest">HP</span>
                    </div>
                    <span class="text-xs font-mono font-bold text-white/80"><?= $hp ?><span class="text-white/40">/<?= $maxHp ?></span></span>
                </div>
                <div class="h-1.5 bg-red-950/30 rounded-full overflow-hidden border border-red-900/20">
                    <div class="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500" style="width: <?= $hpPercent ?>%"></div>
                </div>
            </div>
            
            <!-- Mana -->
            <div class="group">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                            <i data-lucide="droplet" class="w-3.5 h-3.5 text-blue-400"></i>
                        </div>
                        <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mana</span>
                    </div>
                    <span class="text-xs font-mono font-bold text-white/80"><?= $mana ?><span class="text-white/40">/<?= $maxMana ?></span></span>
                </div>
                <div class="h-1.5 bg-blue-950/30 rounded-full overflow-hidden border border-blue-900/20">
                    <div class="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500" style="width: <?= $manaPercent ?>%"></div>
                </div>
            </div>
            
            <!-- XP -->
            <div class="group">
                <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <i data-lucide="star" class="w-3.5 h-3.5 text-emerald-400"></i>
                        </div>
                        <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">XP</span>
                    </div>
                    <span class="text-xs font-mono font-bold text-white/80"><?= $xp ?><span class="text-white/40">/<?= $nextLevelXp ?></span></span>
                </div>
                <div class="h-1.5 bg-emerald-950/30 rounded-full overflow-hidden border border-emerald-900/20">
                    <div class="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" style="width: <?= $xpPercent ?>%"></div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- === NAVIGATION === -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar bg-[#080808]">
        
        <!-- World Section -->
        <div class="mb-4">
            <div class="px-3 mb-2 flex items-center gap-2">
                <div class="w-1 h-1 bg-amber-500 rounded-full"></div>
                <span class="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.3em]">World</span>
                <div class="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent"></div>
            </div>
            <ul class="space-y-1">
                <li>
                    <a href="<?= url('game/city-hub') ?>" class="sidebar-nav-item <?= ($activePage == 'city-hub') ? 'active' : '' ?>">
                        <i data-lucide="castle" class="sidebar-nav-icon"></i>
                        <span>City Gates</span>
                    </a>
                </li>
                <li>
                    <a href="<?= url('game/tavern') ?>" class="sidebar-nav-item <?= ($activePage == 'tavern') ? 'active' : '' ?>">
                        <i data-lucide="beer" class="sidebar-nav-icon"></i>
                        <span>Tavern</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="sidebar-nav-item" onclick="event.preventDefault(); if(typeof openWorldMapModal === 'function') openWorldMapModal();">
                        <i data-lucide="map" class="sidebar-nav-icon"></i>
                        <span>World Map</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="sidebar-nav-item disabled">
                        <i data-lucide="compass" class="sidebar-nav-icon"></i>
                        <span>Expeditions</span>
                        <span class="ml-auto text-[8px] font-bold text-amber-500/50 uppercase tracking-wider">Soon</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- Hero Section -->
        <div class="mb-4">
            <div class="px-3 mb-2 flex items-center gap-2">
                <div class="w-1 h-1 bg-cyan-500 rounded-full"></div>
                <span class="text-[9px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">Hero</span>
                <div class="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
            </div>
            <ul class="space-y-1">
                <li>
                    <a href="#" class="sidebar-nav-item" onclick="event.preventDefault(); if(typeof openCharacterModal === 'function') openCharacterModal();">
                        <i data-lucide="user" class="sidebar-nav-icon"></i>
                        <span>Character</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="sidebar-nav-item" onclick="event.preventDefault(); if(typeof openCharacterModal === 'function') openCharacterModal('inventory');">
                        <i data-lucide="backpack" class="sidebar-nav-icon"></i>
                        <span>Inventory</span>
                    </a>
                </li>
                <li>
                    <a href="#" class="sidebar-nav-item disabled">
                        <i data-lucide="scroll" class="sidebar-nav-icon"></i>
                        <span>Quests</span>
                        <span class="ml-auto text-[8px] font-bold text-amber-500/50 uppercase tracking-wider">Soon</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- Test Section -->
        <div class="mb-4">
            <div class="px-3 mb-2 flex items-center gap-2">
                <div class="w-1 h-1 bg-rose-500 rounded-full"></div>
                <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.3em]">Combat</span>
                <div class="flex-1 h-px bg-gradient-to-r from-rose-500/20 to-transparent"></div>
            </div>
            <ul class="space-y-1">
                <li>
                    <a href="#" class="sidebar-nav-item" onclick="event.preventDefault(); if(typeof openCombatModal === 'function') openCombatModal();">
                        <i data-lucide="swords" class="sidebar-nav-icon"></i>
                        <span>Battle Test</span>
                        <span class="ml-auto flex items-center gap-1">
                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        </span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- System Section -->
        <div>
            <div class="px-3 mb-2 flex items-center gap-2">
                <div class="w-1 h-1 bg-white/30 rounded-full"></div>
                <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">System</span>
                <div class="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
            <ul class="space-y-1">
                <li>
                    <a href="<?= url('panel') ?>" class="sidebar-nav-item">
                        <i data-lucide="arrow-left" class="sidebar-nav-icon"></i>
                        <span>Back to Panel</span>
                    </a>
                </li>
                <li>
                    <a href="<?= url('logout') ?>" class="sidebar-nav-item text-red-400/70 hover:text-red-400">
                        <i data-lucide="log-out" class="sidebar-nav-icon"></i>
                        <span>Logout</span>
                    </a>
                </li>
            </ul>
        </div>
    </nav>
    
    <!-- === FOOTER === -->
    <div class="px-4 py-3 bg-[#050505] border-t border-white/5">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span class="text-[10px] font-bold text-white/40 uppercase tracking-wider">Online</span>
            </div>
            <span class="text-[9px] font-mono text-white/20">v0.1.0</span>
        </div>
    </div>
</aside>

<style>
/* === PREMIUM SIDEBAR STYLES === */
.sidebar-hud-premium {
    background: linear-gradient(180deg, #0a0a0a 0%, #080808 50%, #050505 100%);
    border-right: 1px solid rgba(255,255,255,0.05);
    box-shadow: 10px 0 40px rgba(0,0,0,0.5);
}

/* Navigation Item */
.sidebar-nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 1rem;
    border-radius: 0.75rem;
    color: rgba(255,255,255,0.55);
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.sidebar-nav-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #fbbf24, #ca8a04);
    border-radius: 0 4px 4px 0;
    transition: height 0.3s ease;
}

.sidebar-nav-item:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.95);
}

.sidebar-nav-item:hover::before {
    height: 60%;
}

.sidebar-nav-item.active {
    background: linear-gradient(90deg, rgba(202,138,4,0.15) 0%, transparent 100%);
    color: #fbbf24;
}

.sidebar-nav-item.active::before {
    height: 80%;
    background: linear-gradient(180deg, #fde047, #ca8a04);
    box-shadow: 0 0 15px rgba(251,191,36,0.5);
}

.sidebar-nav-item.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.sidebar-nav-item.disabled:hover {
    background: transparent;
    color: rgba(255,255,255,0.5);
}

.sidebar-nav-item.disabled:hover::before {
    height: 0;
}

.sidebar-nav-icon {
    width: 1.15rem;
    height: 1.15rem;
    opacity: 0.7;
    transition: all 0.3s ease;
}

.sidebar-nav-item:hover .sidebar-nav-icon,
.sidebar-nav-item.active .sidebar-nav-icon {
    opacity: 1;
    transform: scale(1.1);
}
</style>

<?php
// Include loading component (reusable)
$loadingPath = __DIR__ . '/modals/loading.php';
if (file_exists($loadingPath)) {
    include $loadingPath;
}

// Note: Character and Worldmap modals are now loaded lazily via AJAX
?>
