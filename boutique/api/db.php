<?php
// Stockage JSON — un fichier par table dans data/
define('DATA_DIR', __DIR__ . '/../data/');

// Toute erreur renvoie du JSON, jamais du HTML
set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
});
set_error_handler(function (int $errno, string $errstr) {
    throw new ErrorException($errstr, $errno);
});

function dataFile(string $table): string {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
    return DATA_DIR . $table . '.json';
}

function readTable(string $table): array {
    $f = dataFile($table);
    if (!file_exists($f)) return [];
    $data = json_decode(file_get_contents($f), true);
    return is_array($data) ? $data : [];
}

function writeTable(string $table, array $rows): void {
    file_put_contents(dataFile($table), json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function nextId(array $rows): int {
    if (!$rows) return 1;
    return max(array_column($rows, 'id')) + 1;
}

function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function input(): array {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

function now_local(): string {
    return (new DateTime())->format('Y-m-d H:i:s');
}
