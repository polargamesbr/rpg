<?php

error_reporting(E_ALL);
ini_set('display_errors', 1); // Habilitar para debug
ini_set('log_errors', 1);

try {
    // Carregar autoloader do Composer
    if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
        throw new \RuntimeException("Composer autoload not found. Run 'composer install'.");
    }
    require_once __DIR__ . '/../vendor/autoload.php';

    // Carregar variáveis de ambiente
    if (file_exists(__DIR__ . '/../.env')) {
        $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }

    // Inicializar sessão
    $appConfig = require __DIR__ . '/../config/app.php';
    session_name($appConfig['session']['name']);
    session_start();

    // Configurar timezone
    date_default_timezone_set($appConfig['timezone']);

    // Inicializar Database
    $dbConfig = require __DIR__ . '/../config/database.php';
    \App\Models\Database::init($dbConfig);

    // Inicializar AuthService
    \App\Services\AuthService::init($appConfig);

    // Router simples
    $routes = require __DIR__ . '/../config/routes.php';

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    
    // Extract path from URI (without query string)
    $uri = parse_url($requestUri, PHP_URL_PATH) ?? '/';
    
    // Calculate base path
    $basePath = str_replace('\\', '/', dirname($scriptName));
    
    // For vhost (rpg.local), scriptName is usually /index.php, so basePath is /
    // For subdirectory (/rpg/), scriptName is /rpg/index.php, so basePath is /rpg
    
    // Remove base path from URI if it exists and is not root
    if ($basePath !== '/' && $basePath !== '\\' && $basePath !== '.') {
        if (strpos($uri, $basePath) === 0) {
            $uri = substr($uri, strlen($basePath));
        }
    }
    
    // Remove /public/ from URI if present (shouldn't happen with vhost, but just in case)
    if (strpos($uri, '/public') === 0) {
        $uri = substr($uri, 7); // Remove '/public'
    }

    // Normalize URI
    $uri = trim($uri, '/');
    $uri = $uri === '' ? '/' : '/' . $uri;

    $routeKey = "{$method} {$uri}";
    
    // Debug: log route info
    if (($appConfig['debug'] ?? false)) {
        error_log("Route Debug: Method={$method}, RequestURI={$requestUri}, URI={$uri}, RouteKey={$routeKey}, ScriptName={$scriptName}, BasePath={$basePath}");
    }

    // Check exact route first
    if (isset($routes[$routeKey])) {
        handleRoute($routes[$routeKey]);
        exit;
    }
    
    // Check for parameterized routes (e.g., /panel/character/select/:uuid or /panel/character/select/{uuid})
    foreach ($routes as $pattern => $handler) {
        // Check if pattern has parameters (either :param or {param} format)
        if (strpos($pattern, ':') !== false || strpos($pattern, '{') !== false) {
            // Convert {param} to :param for processing
            $normalizedPattern = str_replace(['{', '}'], [':', ''], $pattern);
            
            // Convert pattern to regex (support UUIDs with hyphens)
            $regexPattern = preg_replace('/:[a-zA-Z0-9_]+/', '([a-zA-Z0-9\-]+)', $normalizedPattern);
            $regexPattern = str_replace('/', '\/', $regexPattern);
            $regexPattern = '/^' . $regexPattern . '$/';
            
            if (preg_match($regexPattern, $routeKey, $matches)) {
                // Extract parameter names from pattern (support both formats)
                preg_match_all('/:([a-zA-Z0-9_]+)/', $normalizedPattern, $paramNames);
                $paramNames = $paramNames[1];
                
                // Build parameters array to pass to controller
                $routeParams = [];
                for ($i = 1; $i < count($matches); $i++) {
                    if (isset($paramNames[$i - 1])) {
                        $routeParams[] = $matches[$i];
                    }
                }
                
                handleRoute($handler, $routeParams);
                exit;
            }
        }
    }
    
    // Debug: show available routes in debug mode (only for development)
    if (($appConfig['debug'] ?? false)) {
        http_response_code(404);
        echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>404 - Page Not Found</title><style>body{font-family:sans-serif;padding:2rem;background:#1a1a1a;color:#fff;}code{background:#333;padding:2px 6px;border-radius:3px;}</style></head><body>";
        echo "<h1>404 - Page Not Found</h1>";
        echo "<p><strong>Route Key:</strong> <code>{$routeKey}</code></p>";
        echo "<p><strong>Request URI:</strong> <code>{$requestUri}</code></p>";
        echo "<p><strong>Available routes:</strong></p><ul>";
        foreach ($routes as $key => $handler) {
            echo "<li><code>{$key}</code> => {$handler}</li>";
        }
        echo "</ul></body></html>";
        exit;
    }

           // If route not found, check if it's a static file request
           // This should not happen if .htaccess is working, but as fallback:
           if (strpos($uri, '/assets/') === 0 || strpos($uri, '/public/assets/') === 0) {
               http_response_code(404);
               echo "404 - Asset Not Found";
               exit;
           }
           
           // If route not found, return 404
           http_response_code(404);
           echo "404 - Page Not Found";
           
       } catch (\Throwable $e) {
    http_response_code(500);
    $debug = ($_ENV['APP_DEBUG'] ?? 'true') === 'true';
    if ($debug) {
        echo "<h1>Error</h1>";
        echo "<pre>" . htmlspecialchars($e->getMessage()) . "\n\n";
        echo htmlspecialchars($e->getTraceAsString()) . "</pre>";
    } else {
        echo "Internal server error. Please try again later.";
    }
    error_log("RPG Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
}

function handleRoute(string $route, array $params = []): void
{
    [$controllerName, $method] = explode('@', $route);
    $controllerClass = "App\\Controllers\\{$controllerName}";
    
    if (!class_exists($controllerClass)) {
        throw new \RuntimeException("Controller not found: {$controllerClass}");
    }
    
    $controller = new $controllerClass();
    
    if (!method_exists($controller, $method)) {
        throw new \RuntimeException("Method not found: {$controllerClass}::{$method}");
    }
    
    // Pass route parameters to the controller method
    call_user_func_array([$controller, $method], $params);
}

function jsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function view(string $path, array $data = []): void
{
    extract($data);
    $viewPath = __DIR__ . '/../views/' . str_replace('.', '/', $path) . '.php';
    $viewPath = str_replace('\\', '/', $viewPath); // Normalize path separators for Windows
    
    if (!file_exists($viewPath)) {
        throw new \RuntimeException("View not found: {$viewPath}");
    }
    
    // Capturar o conteúdo da view
    ob_start();
    require $viewPath;
    $content = ob_get_clean();
    
    // Determinar qual layout usar
    $isGameView = strpos($path, 'game.') === 0 || strpos($path, 'character.') === 0;
    $layoutPath = __DIR__ . '/../views/layouts/' . ($isGameView ? 'game.php' : 'main.php');
    
    if (file_exists($layoutPath)) {
        require $layoutPath;
    } else {
        echo $content;
    }
}

function redirect(string $url): void
{
    // Se a URL não começar com /, adicionar o caminho base
    if (strpos($url, '/') !== 0) {
        $url = url($url);
    }
    header("Location: {$url}");
    exit;
}

function url(string $path = ''): string
{
    // For vhost (rpg.local), base path should be empty
    // For subdirectory (/rpg/), calculate base path
    
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
    $basePath = str_replace('\\', '/', dirname($scriptName));
    
    // If scriptName contains /public/, remove /public from basePath
    if (strpos($scriptName, '/public/') !== false || strpos($scriptName, '\\public\\') !== false) {
        $basePath = str_replace('/public', '', $basePath);
        $basePath = str_replace('\\public', '', $basePath);
    }
    
    // If basePath is root or empty, use empty (for vhost)
    if ($basePath === '/' || $basePath === '\\' || $basePath === '.') {
        $basePath = '';
    }
    
    if (empty($path)) {
        return rtrim($basePath, '/') ?: '/';
    }
    
    $path = ltrim($path, '/');
    return rtrim($basePath, '/') . '/' . $path;
}

function asset(string $path): string
{
    // For vhost (rpg.local), assets are at /public/assets/
    // The .htaccess should handle direct access to /public/assets/ files
    
    // Remove leading slash if present
    $path = ltrim($path, '/');
    
    // If path already includes 'assets/', use it as is
    if (strpos($path, 'assets/') === 0) {
        return '/public/' . $path;
    }
    
    // Otherwise, prepend 'assets/'
    return '/public/assets/' . $path;
}

