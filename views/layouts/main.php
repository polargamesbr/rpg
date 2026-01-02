<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?? 'RPG Game' ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="<?= asset('css/styles.css') ?>">
    <?php if (isset($additionalStyles)): ?>
        <style><?= $additionalStyles ?></style>
    <?php endif; ?>
</head>
<body class="bg-black text-white">
    <?php if (isset($_SESSION['errors']) && is_array($_SESSION['errors'])): ?>
        <div class="fixed top-4 right-4 bg-red-500 text-white p-3 rounded z-[100] shadow-lg" id="error-message">
            <?php foreach ($_SESSION['errors'] as $error): ?>
                <p><?= htmlspecialchars($error) ?></p>
            <?php endforeach; ?>
            <?php unset($_SESSION['errors']); ?>
        </div>
    <?php endif; ?>
    <?php if (isset($_SESSION['error'])): ?>
        <div class="fixed top-4 right-4 bg-red-500 text-white p-3 rounded z-[100] shadow-lg" id="error-message">
            <p><?= htmlspecialchars($_SESSION['error']) ?></p>
            <?php unset($_SESSION['error']); ?>
        </div>
    <?php endif; ?>
    <?php if (isset($_SESSION['success'])): ?>
        <div class="fixed top-4 right-4 bg-green-500 text-white p-3 rounded z-[100] shadow-lg" id="success-message">
            <p><?= htmlspecialchars($_SESSION['success']) ?></p>
            <?php unset($_SESSION['success']); ?>
        </div>
    <?php endif; ?>
    
    <?php if (isset($showSidebar) && $showSidebar && isset($_SESSION['logged_in']) && $_SESSION['logged_in']): ?>
        <?php 
        $sidebarPath = __DIR__ . '/../partials/sidebar.php';
        if (file_exists($sidebarPath)) {
            include $sidebarPath;
        }
        ?>
    <?php endif; ?>
    
    <main class="<?= isset($showSidebar) && $showSidebar && isset($_SESSION['logged_in']) && $_SESSION['logged_in'] ? 'ml-[260px]' : '' ?>">
        <?= $content ?? '' ?>
    </main>
    
    <?php if (isset($additionalScripts)): ?>
        <script><?= $additionalScripts ?></script>
    <?php endif; ?>
    <script>
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Auto-hide success/error messages after 5 seconds
        setTimeout(function() {
            const errorMsg = document.getElementById('error-message');
            const successMsg = document.getElementById('success-message');
            if (errorMsg) {
                errorMsg.style.transition = 'opacity 0.5s ease';
                errorMsg.style.opacity = '0';
                setTimeout(() => errorMsg.remove(), 500);
            }
            if (successMsg) {
                successMsg.style.transition = 'opacity 0.5s ease';
                successMsg.style.opacity = '0';
                setTimeout(() => successMsg.remove(), 500);
            }
        }, 5000);
    </script>
</body>
</html>

