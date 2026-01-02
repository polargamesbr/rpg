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

<aside class="w-[260px] sidebar-hud flex flex-col h-screen fixed left-0 top-0 z-50">
    <div class="px-6 pt-10 pb-6">
        <div class="flex flex-col items-center mb-6 relative z-10">
            <div class="cinematic-avatar-frame mb-3">
                <div class="w-full h-full rounded-full overflow-hidden border-2 border-black">
                    <img src="<?= asset('img/' . $avatarImage) ?>" alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div class="level-badge">LVL <?= $characterLevel ?></div>
            </div>
            <h2 class="text-2xl text-stone-100 font-bold font-serif tracking-wide drop-shadow-md" style="font-family: 'Cinzel', serif;"><?= htmlspecialchars($characterName) ?></h2>
            <p class="text-[0.65rem] text-amber-500/90 font-bold tracking-[0.3em] uppercase mt-1"><?= htmlspecialchars($characterClass) ?></p>
        </div>

        <div class="space-y-4 px-1">
            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-red-400">
                        <i data-lucide="heart" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">HP</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80"><?= $hp ?>/<?= $maxHp ?></span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill hp-fill" style="width: <?= $hpPercent ?>%"></div>
                </div>
            </div>

            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-blue-400">
                        <i data-lucide="droplet" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">MANA</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80"><?= $mana ?>/<?= $maxMana ?></span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill mana-fill" style="width: <?= $manaPercent ?>%"></div>
                </div>
            </div>

            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <div class="flex items-center gap-1.5 text-green-400">
                        <i data-lucide="star" class="w-3.5 h-3.5 stat-icon"></i>
                        <span class="font-bold tracking-wider">XP</span>
                    </div>
                    <span class="text-stone-300 font-mono font-bold text-xs opacity-80"><?= $xp ?>/<?= $nextLevelXp ?></span>
                </div>
                <div class="slim-stat-container">
                    <div class="slim-stat-fill xp-fill" style="width: <?= $xpPercent ?>%"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2 mx-6"></div>

    <nav class="flex-1 overflow-y-auto py-2">
        <div class="nav-section-header">World</div>
        <ul class="space-y-1 mb-2">
            <li>
                <a href="<?= url('game/city-hub') ?>" class="hud-nav-item <?= ($activePage == 'city-hub') ? 'active' : '' ?>">
                    <i data-lucide="castle" class="hud-nav-icon"></i>
                    <span>City Gates</span>
                </a>
            </li>
            <li>
                <a href="<?= url('game/tavern') ?>" class="hud-nav-item <?= ($activePage == 'tavern') ? 'active' : '' ?>">
                    <i data-lucide="beer" class="hud-nav-icon"></i>
                    <span>Tavern</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); if(typeof openWorldMapModal === 'function') openWorldMapModal();">
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

        <div class="nav-section-header">Hero</div>
        <ul class="space-y-1 mb-2">
            <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); if(typeof openCharacterModal === 'function') openCharacterModal();">
                    <i data-lucide="user" class="hud-nav-icon"></i>
                    <span>Character</span>
                </a>
            </li>
            <li>
                <a href="#" class="hud-nav-item" onclick="event.preventDefault(); if(typeof openCharacterModal === 'function') { openCharacterModal(); if(typeof switchModalTab === 'function') switchModalTab('inventory'); }">
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

        <div class="nav-section-header">System</div>
        <ul class="space-y-1">
            <li>
                <a href="<?= url('panel') ?>" class="hud-nav-item">
                    <i data-lucide="arrow-left" class="hud-nav-icon"></i>
                    <span>Back to Panel</span>
                </a>
            </li>
            <li>
                <a href="<?= url('logout') ?>" class="hud-nav-item">
                    <i data-lucide="log-out" class="hud-nav-icon"></i>
                    <span>Logout</span>
                </a>
            </li>
        </ul>
    </nav>
</aside>

<?php
// Include modals if they exist
$modalCharacterPath = __DIR__ . '/modals/character.php';
$modalWorldmapPath = __DIR__ . '/modals/worldmap.php';

if (file_exists($modalCharacterPath)) {
    include $modalCharacterPath;
}
if (file_exists($modalWorldmapPath)) {
    include $modalWorldmapPath;
}
?>

