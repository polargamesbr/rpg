<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?? 'RPG Game' ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="<?= asset('css/styles.css') ?>">
    <script src="<?= asset('js/lazy-modal-loader.js') ?>"></script>
    <script src="<?= asset('js/worldmap-modal-loader.js') ?>"></script>
    <script src="<?= asset('js/character-modal-loader.js') ?>"></script>
    <script src="<?= asset('js/combat-modal-loader.js') ?>"></script>
    <?php if (isset($additionalStyles)): ?>
        <style><?= $additionalStyles ?></style>
    <?php endif; ?>
</head>
<body class="bg-black text-stone-100 overflow-hidden">
    <?php if (isset($_SESSION['errors']) && is_array($_SESSION['errors'])): ?>
        <div class="fixed top-4 right-4 bg-red-500 text-white p-3 rounded z-[100]">
            <?php foreach ($_SESSION['errors'] as $error): ?>
                <p><?= htmlspecialchars($error) ?></p>
            <?php endforeach; ?>
            <?php unset($_SESSION['errors']); ?>
        </div>
    <?php endif; ?>
    <?php if (isset($_SESSION['error'])): ?>
        <div class="fixed top-4 right-4 bg-red-500 text-white p-3 rounded z-[100]">
            <p><?= htmlspecialchars($_SESSION['error']) ?></p>
            <?php unset($_SESSION['error']); ?>
        </div>
    <?php endif; ?>
    <?php if (isset($_SESSION['success'])): ?>
        <div class="fixed top-4 right-4 bg-green-500 text-white p-3 rounded z-[100]">
            <p><?= htmlspecialchars($_SESSION['success']) ?></p>
            <?php unset($_SESSION['success']); ?>
        </div>
    <?php endif; ?>
    
    <?= $content ?? '' ?>

    <?php if (isset($additionalScripts)): ?>
        <script><?= $additionalScripts ?></script>
    <?php endif; ?>
    <script>
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    </script>
</body>
</html>
