<?php
$title = 'Select Class - RPG Game';
$showSidebar = false;
$name = $name ?? '';
$classes = $classes ?? [];

if (empty($name)) {
    redirect('/character/create');
    return;
}

// Map class names to image prefixes
$classImageMap = [
    'Espadachim' => 'swordman',
    'Arqueiro' => 'archer',
    'Mago' => 'mage',
    'Ladrão' => 'thief',
    'Acolito' => 'sacer',
    'Ferreiro' => 'blacksmith'
];

$additionalStyles = <<<CSS
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
    font-family: 'Inter', sans-serif;
    color: white;
    position: fixed;
}

.hero-gallery {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: row;
}

@media (max-width: 1024px) {
    .hero-gallery {
        flex-direction: column;
    }
}

.hero-panel {
    position: relative;
    flex: 1;
    transition: all 0.7s cubic-bezier(0.25, 1, 0.5, 1);
    overflow: hidden;
    cursor: pointer;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    filter: grayscale(0.9) brightness(0.4);
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (max-width: 1024px) {
    .hero-panel {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
}

.hero-panel:last-child { border: none; }

.hero-panel:hover {
    flex: 6;
    filter: grayscale(0) brightness(1.1);
    z-index: 10;
    box-shadow: 0 0 100px rgba(0,0,0,1);
}

@media (max-width: 1024px) {
    .hero-panel:hover {
        flex: 10;
    }
}

.hero-panel::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, var(--class-color) 0%, transparent 40%);
    opacity: 0.3;
    transition: opacity 0.5s ease;
    pointer-events: none;
    z-index: 2;
}

.hero-panel:hover::after {
    opacity: 0.5;
}

.hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center top;
    transition: transform 10s linear;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.hero-panel:hover .hero-bg {
    transform: scale(1.1);
}

.overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.95) 100%);
    z-index: 3;
    transition: opacity 0.4s;
}

.panel-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: clamp(1rem, 5vw, 4rem);
    z-index: 10;
    transition: all 0.5s ease;
}

.class-title {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    text-transform: uppercase;
    margin: 0;
    line-height: 1;
    color: #fff;
    text-shadow: 0 4px 15px rgba(0,0,0,0.8);
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    white-space: nowrap;
    pointer-events: none;
}

@media (min-width: 1025px) {
    .hero-panel:not(:hover) .class-title { 
        transform: translate(-50%, -50%) rotate(-90deg);
        font-size: 1.5rem;
        opacity: 0.6;
        letter-spacing: 0.2em;
        position: absolute;
        top: 50%;
        left: 50%;
    }

    .hero-panel:hover .class-title {
        font-size: clamp(2.5rem, 8vw, 5.5rem);
    }
}

@media (max-width: 1024px) {
    .hero-panel:not(:hover) .class-title { 
        font-size: 1.2rem;
        opacity: 0.7;
        letter-spacing: 0.3em;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .hero-panel:hover .class-title {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .panel-content {
        padding: 1.5rem;
        align-items: center;
        text-align: center;
    }
}

.gender-reveal-box {
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease 0.4s;
    display: flex;
    align-items: center;
    gap: 1rem;
    pointer-events: none;
}

.hero-panel:hover .gender-reveal-box {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
}

.premium-toggle {
    display: flex;
    background: rgba(0, 0, 0, 0.5);
    padding: 4px;
    border-radius: 50px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    position: relative;
    backdrop-filter: blur(5px);
}

.g-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.3);
    border: none;
    background: transparent;
}

.g-button.active { color: #f2d16b; }

.g-slider {
    position: absolute;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.45) 100%);
    border: 1px solid rgba(242, 209, 107, 0.5);
    border-radius: 50%;
    transition: all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6);
    z-index: 1;
    left: 4px;
    box-shadow: 
        0 0 25px rgba(212, 175, 55, 0.2),
        inset 0 1px 3px rgba(255,255,255,0.4);
}

.premium-toggle:active .g-slider {
    transform: scaleX(1.3) scaleY(0.8);
}

.g-button[data-gender="female"].active ~ .g-slider {
    left: 48px; 
}

.gender-label {
    font-family: 'Cinzel', serif;
    font-size: 0.75rem;
    color: #a8a29e;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    opacity: 0.8;
}

.lore-container {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.5s ease 0.1s;
}

.hero-panel:hover .lore-container {
    max-height: 600px;
    opacity: 1;
    margin-top: 1rem;
}

.city-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--class-color);
    margin-bottom: 1rem;
    border: 1px solid rgba(255,255,255,0.1);
}

.lore-text {
    font-size: 0.95rem;
    color: #d6d3d1;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    max-width: 600px;
    border-left: 3px solid var(--class-color);
    padding-left: 1rem;
}

.lore-highlight {
    color: #fff;
    font-weight: 600;
}

.type-theme {
    font-size: 0.8rem;
    color: #a8a29e;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.select-btn {
    background: var(--class-color);
    color: #000;
    border: none;
    padding: 1rem 2rem;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    margin-top: 1rem;
    align-self: flex-start;
    transition: transform 0.2s;
}

.select-btn:hover { 
    transform: scale(1.05); 
    box-shadow: 0 0 20px var(--class-glow); 
}

.back-btn {
    position: absolute;
    top: 2rem;
    left: 2rem;
    z-index: 50;
    color: #fff;
    opacity: 0.5;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-decoration: none;
}
.back-btn:hover { opacity: 1; }
CSS;

ob_start();
?>

<div style="width: 100vw; height: 100vh; background: #000; position: relative;">
    <a href="<?= url('character/create') ?>" class="back-btn">
        <i data-lucide="arrow-left" class="w-4 h-4"></i> Back
    </a>

    <form method="POST" action="<?= url('character/store') ?>" id="classForm" style="display: none;">
        <input type="hidden" name="name" value="<?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?>">
        <input type="hidden" name="class" id="selectedClass">
        <input type="hidden" name="gender" id="selectedGender" value="male">
    </form>

    <div class="hero-gallery" id="heroGallery">
        <?php foreach ($classes as $class): ?>
            <?php
            $classKey = strtolower($class['name']);
            $imagePrefix = $classImageMap[$class['name']] ?? 'archer';
            $bgId = 'bg-' . $classKey;
            $panelId = 'panel-' . $classKey;
            ?>
            <div class="hero-panel" id="<?= $panelId ?>" data-color="<?= htmlspecialchars($class['color_hex']) ?>" style="--class-color: <?= htmlspecialchars($class['color_hex']) ?>; --class-glow: <?= htmlspecialchars($class['color_glow']) ?>;">
                <div class="hero-bg class-hero-bg" id="<?= $bgId ?>" style="background-image: url('<?= asset('img/' . $imagePrefix . '-male.png') ?>');"></div>
                <div class="overlay"></div>
                <div class="panel-content">
                    <div class="flex items-center gap-8 mb-4">
                        <h2 class="class-title"><?= htmlspecialchars($class['display_name']) ?></h2>
                        <div class="gender-reveal-box">
                            <span class="gender-label">Gender</span>
                            <div class="premium-toggle">
                                <button type="button" class="g-button active" data-gender="male" onclick="setGender('male', '<?= htmlspecialchars($classKey) ?>', event)"><i data-lucide="mars" class="w-5 h-5"></i></button>
                                <button type="button" class="g-button" data-gender="female" onclick="setGender('female', '<?= htmlspecialchars($classKey) ?>', event)"><i data-lucide="venus" class="w-5 h-5"></i></button>
                                <div class="g-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="lore-container">
                        <div class="city-badge"><i data-lucide="<?= htmlspecialchars($class['icon_name']) ?>" class="w-3 h-3"></i> <?= htmlspecialchars($class['starting_city']) ?></div>
                        <div class="type-theme"><?= htmlspecialchars($class['type_theme']) ?></div>
                        <div class="lore-text">
                            <?= str_replace($class['starting_city'], '<span class="lore-highlight">' . htmlspecialchars($class['starting_city']) . '</span>', htmlspecialchars($class['lore_text'])) ?>
                        </div>
                        <button type="button" class="select-btn" onclick="selectClass('<?= htmlspecialchars($class['name']) ?>', '<?= htmlspecialchars($class['color_hex']) ?>', '<?= htmlspecialchars($class['icon_name']) ?>', '<?= htmlspecialchars($class['starting_city']) ?>')">Choose <?= htmlspecialchars($class['display_name']) ?></button>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<script>
    let selectedGender = 'male';
    const classGenders = {};
    const classImageMap = <?= json_encode($classImageMap) ?>;

    <?php foreach ($classes as $class): ?>
        <?php
        $classKey = strtolower($class['name']);
        $classKey = str_replace(['ã', 'õ'], ['a', 'o'], $classKey);
        ?>
        classGenders['<?= $classKey ?>'] = 'male';
    <?php endforeach; ?>

    function setGender(gender, classKey, event) {
        if(event) event.stopPropagation();
        selectedGender = gender;
        classGenders[classKey] = gender;
        
        const panel = event.target.closest('.hero-panel');
        const toggle = panel.querySelector('.premium-toggle');
        const buttons = toggle.querySelectorAll('.g-button');
        const slider = toggle.querySelector('.g-slider');
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.gender === gender) btn.classList.add('active');
        });
        
        if(gender === 'female') {
            slider.style.left = '48px';
        } else {
            slider.style.left = '4px';
        }

        const bgId = 'bg-' + classKey;
        const bg = document.getElementById(bgId);
        if(bg) {
            // Get image prefix from classKey
            const classKeyToImage = {
                'espadachim': 'swordman',
                'arqueiro': 'archer',
                'mago': 'mage',
                'ladrao': 'thief',
                'acolito': 'sacer',
                'ferreiro': 'blacksmith'
            };
            const imagePrefix = classKeyToImage[classKey] || 'archer';
            const assetBase = '<?= asset('img/') ?>';
            bg.style.backgroundImage = `url('${assetBase}${imagePrefix}-${gender}.png')`;
        }
    }

    function selectClass(className, color, icon, city) {
        document.getElementById('selectedClass').value = className;
        document.getElementById('selectedGender').value = selectedGender;
        document.getElementById('classForm').submit();
    }
</script>

<?php
$content = ob_get_clean();
include __DIR__ . '/../layouts/main.php';
?>
