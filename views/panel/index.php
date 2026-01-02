<?php
$title = 'Character Panel - RPG Game';
$showSidebar = false;

ob_start();
?>

<div class="fixed inset-0 z-0 overflow-hidden">
    <!-- Cinematic Background -->
    <div class="absolute inset-0 bg-[url('<?= asset('img/tavern-background.jpg') ?>')] bg-cover bg-center"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"></div>
    
    <!-- Animated Fog Layers -->
    <div class="fog-layer fog-layer-1 absolute inset-0 opacity-20"></div>
    <div class="fog-layer fog-layer-2 absolute inset-0 opacity-10"></div>
    
    <!-- Particle Effect Overlay -->
    <canvas id="panel-particles" class="absolute inset-0 opacity-30"></canvas>
</div>

<!-- Main Content -->
<div class="relative z-10 min-h-screen">
    <!-- Header with Logout -->
    <header class="relative z-20 px-8 pt-8 pb-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div>
                <h1 class="text-6xl font-serif text-amber-500 mb-2 drop-shadow-2xl" style="font-family: 'Cinzel', serif; text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);">
                    CHARACTER PANEL
                </h1>
                <p class="text-stone-300 text-lg tracking-wider">Manage your legends and begin your adventure</p>
            </div>
            <a href="<?= url('logout') ?>" class="group relative px-6 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 hover:border-red-600 rounded-lg font-medium transition-all backdrop-blur-sm">
                <span class="relative z-10 flex items-center gap-2 text-red-400">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                    <span>Logout</span>
                </span>
                <div class="absolute inset-0 bg-red-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            </a>
        </div>
    </header>

    <!-- Content Area -->
    <div class="relative z-10 px-8 pb-12">
        <div class="max-w-7xl mx-auto">
            <?php if (empty($characters)): ?>
                <!-- Empty State - Cinematic -->
                <div class="flex items-center justify-center min-h-[60vh]">
                    <div class="text-center relative">
                        <!-- Glow Effect -->
                        <div class="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full"></div>
                        
                        <!-- Icon Container -->
                        <div class="relative mb-8">
                            <div class="w-32 h-32 mx-auto rounded-full border-4 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-black/40 backdrop-blur-md flex items-center justify-center shadow-2xl">
                                <i data-lucide="user-plus" class="w-16 h-16 text-amber-400"></i>
                            </div>
                            <div class="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
                        </div>
                        
                        <h2 class="text-4xl font-serif text-amber-400 mb-4" style="font-family: 'Cinzel', serif;">
                            No Characters Yet
                        </h2>
                        <p class="text-stone-400 text-lg mb-8 max-w-md mx-auto">
                            Forge your first legend and embark on an epic journey through the realms
                        </p>
                        
                        <!-- Create Button - Premium -->
                        <a href="<?= url('game/character/create') ?>" class="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 shadow-2xl hover:shadow-amber-500/50 overflow-hidden">
                            <span class="relative z-10 flex items-center gap-3">
                                <i data-lucide="sparkles" class="w-6 h-6"></i>
                                <span>Create Your Legend</span>
                            </span>
                            <div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        </a>
                    </div>
                </div>
            <?php else: ?>
                <!-- Characters Grid - Premium Cards -->
                <div class="mb-8 flex justify-end">
                    <a href="<?= url('game/character/create') ?>" class="group relative inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 border border-amber-500/50 rounded-lg font-bold text-white transition-all transform hover:scale-105 shadow-lg hover:shadow-amber-500/30 backdrop-blur-sm">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i>
                        <span>New Character</span>
                        <div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                    </a>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <?php foreach ($characters as $item): 
                        $char = $item['character'];
                        $class = $item['class'];
                        $classColor = $class['color_hex'] ?? '#d4af37';
                        $cityName = $class['starting_city'] ?? 'Unknown';
                        $imagePrefix = $class['image_prefix'] ?? 'archer';
                        $gender = $char['gender'] ?? 'male';
                        $charImage = $imagePrefix . '-' . $gender . '.png';
                    ?>
                        <div class="group relative rpg-card-character" data-tilt style="--class-color: <?= htmlspecialchars($classColor) ?>;">
                            <!-- Card Background with Character Image -->
                            <div class="absolute inset-0 bg-cover bg-center rounded-xl" style="background-image: url('<?= asset('img/' . $charImage) ?>'); filter: brightness(0.4) saturate(0.8);"></div>
                            
                            <!-- Gradient Overlay -->
                            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90 rounded-xl"></div>
                            
                            <!-- Glow Effect -->
                            <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style="box-shadow: 0 0 40px <?= htmlspecialchars($classColor) ?>40;"></div>
                            
                            <!-- Border -->
                            <div class="absolute inset-0 rounded-xl border-2 border-stone-700/50 group-hover:border-amber-500/50 transition-colors"></div>
                            
                            <!-- Delete Button - Small, Top Right Corner -->
                            <a href="<?= url('panel/character/delete/' . $char['uuid']) ?>" 
                               onclick="return confirm('Are you sure you want to delete <?= htmlspecialchars($char['name']) ?>? This action cannot be undone.');"
                               class="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 hover:border-red-600/50 text-red-400 rounded-lg transition-all backdrop-blur-sm opacity-60 hover:opacity-100 group/delete">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </a>
                            
                            <!-- Level Badge - Top Left Corner -->
                            <div class="absolute top-3 left-3 z-20 px-4 py-2 bg-black/90 border-2 rounded-lg backdrop-blur-md shadow-2xl" style="border-color: <?= htmlspecialchars($classColor) ?>; box-shadow: 0 0 20px <?= htmlspecialchars($classColor) ?>60;">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">LVL</span>
                                    <span class="text-2xl font-bold" style="color: <?= htmlspecialchars($classColor) ?>; text-shadow: 0 0 15px <?= htmlspecialchars($classColor) ?>;">
                                        <?= htmlspecialchars($char['level'] ?? 1) ?>
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Content -->
                            <div class="relative z-10 h-full flex flex-col justify-end p-6 min-h-[420px]">
                                <!-- Character Name -->
                                <h3 class="text-3xl font-serif text-center mb-3" style="font-family: 'Cinzel', serif; color: <?= htmlspecialchars($classColor) ?>; text-shadow: 0 0 20px <?= htmlspecialchars($classColor) ?>80;">
                                    <?= htmlspecialchars($char['name']) ?>
                                </h3>
                                
                                <!-- Class Badge -->
                                <div class="flex items-center justify-center gap-2 mb-3">
                                    <i data-lucide="<?= htmlspecialchars($class['icon_name'] ?? 'sword') ?>" class="w-5 h-5" style="color: <?= htmlspecialchars($classColor) ?>;"></i>
                                    <span class="text-stone-300 font-semibold text-sm tracking-wide"><?= htmlspecialchars($class['display_name'] ?? $char['class']) ?></span>
                                </div>
                                
                                <!-- City Badge -->
                                <div class="flex items-center justify-center gap-2 px-4 py-2 bg-black/40 border border-stone-700/50 rounded-lg mb-4 backdrop-blur-sm">
                                    <i data-lucide="map-pin" class="w-4 h-4 text-amber-400"></i>
                                    <span class="text-stone-300 text-sm font-medium"><?= htmlspecialchars($cityName) ?></span>
                                </div>
                                
                                <!-- Stats Row -->
                                <div class="grid grid-cols-2 gap-3 text-xs mb-4">
                                    <div class="px-3 py-2 bg-black/40 border border-stone-700/30 rounded-lg backdrop-blur-sm">
                                        <div class="text-stone-500 mb-1">Created</div>
                                        <div class="text-stone-200 font-bold"><?= date('M Y', strtotime($char['created_at'])) ?></div>
                                    </div>
                                    <div class="px-3 py-2 bg-black/40 border border-stone-700/30 rounded-lg backdrop-blur-sm">
                                        <div class="text-stone-500 mb-1">Status</div>
                                        <div class="text-green-400 font-bold">Active</div>
                                    </div>
                                </div>
                                
                                <!-- Play Button -->
                                <a href="<?= url('panel/character/select/' . $char['uuid']) ?>" class="w-full group/play relative px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-center rounded-lg font-bold transition-all transform hover:scale-105 overflow-hidden">
                                    <span class="relative z-10 flex items-center justify-center gap-2">
                                        <i data-lucide="play" class="w-4 h-4"></i>
                                        <span>Play</span>
                                    </span>
                                    <div class="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover/play:opacity-100 transition-opacity blur-xl"></div>
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php
$additionalStyles = <<<CSS
<style>
    .rpg-card-character {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
    }
    
    .rpg-card-character:hover {
        transform: translateY(-8px) scale(1.02);
    }
    
    @keyframes fogMove {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    
    .fog-layer {
        background: linear-gradient(to right, transparent 0%, rgba(200, 200, 200, 0.05) 50%, transparent 100%);
        width: 200%;
        height: 100%;
    }
    
    .fog-layer-1 {
        animation: fogMove 60s linear infinite;
    }
    
    .fog-layer-2 {
        animation: fogMove 40s linear infinite reverse;
    }
</style>
CSS;

$additionalScripts = <<<JS
(function() {
    'use strict';
    
    lucide.createIcons();

    // Particle System for Background
    const canvas = document.getElementById('panel-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.alpha = Math.random() * 0.3 + 0.1;
                this.color = '#d4af37';
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
        
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // Vanilla Tilt Logic for character cards
    const cards = document.querySelectorAll('.rpg-card-character');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });
    });
})();
JS;
?>

<?php
$content = ob_get_clean();
include __DIR__ . '/../layouts/main.php';
?>
