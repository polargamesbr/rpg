<?php
// Early exit for static asset requests
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
if (strpos($requestUri, '/public/assets/') === 0 || strpos($requestUri, '/public/') === 0) {
    // Check if file exists
    $filePath = __DIR__ . $requestUri;
    if (file_exists($filePath) && is_file($filePath)) {
        // Determine MIME type
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'mp3' => 'audio/mpeg',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
        ];
        $mimeType = $mimeTypes[strtolower($ext)] ?? 'application/octet-stream';
        header('Content-Type: ' . $mimeType);
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo "404 - Asset Not Found";
        exit;
    }
}

// For vhost (rpg.local), script name should be /index.php
// For subdirectory (/rpg/), it will be /rpg/index.php
// Let PHP determine it automatically based on the actual request

// Include the public index.php
require __DIR__ . '/public/index.php';

