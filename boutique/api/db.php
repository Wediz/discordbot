<?php
function getDB(): PDO {
    static $db = null;
    if ($db) return $db;

    $path = __DIR__ . '/../data/boutique.db';
    $db = new PDO('sqlite:' . $path);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $db->exec("PRAGMA journal_mode=WAL;");

    $db->exec("
        CREATE TABLE IF NOT EXISTS ventes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            article TEXT NOT NULL,
            categorie TEXT DEFAULT 'autre',
            prix_achat REAL NOT NULL,
            prix_vente REAL NOT NULL,
            quantite INTEGER DEFAULT 1,
            promo_pourcent REAL DEFAULT 0,
            canal_vente TEXT DEFAULT 'instagram',
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS retours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vente_id INTEGER,
            date TEXT NOT NULL,
            article TEXT NOT NULL,
            prix_vente REAL NOT NULL,
            motif TEXT,
            remboursement REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS emballages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            quantite_achetee INTEGER NOT NULL,
            prix_total REAL NOT NULL,
            prix_unitaire REAL NOT NULL,
            stock_restant INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS frais_emballage_vente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vente_id INTEGER,
            emballage_id INTEGER,
            quantite_utilisee INTEGER DEFAULT 1,
            cout REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trajets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            destination TEXT DEFAULT 'La Poste',
            distance_km REAL NOT NULL,
            prix_essence_litre REAL NOT NULL,
            consommation_100km REAL NOT NULL,
            nb_colis INTEGER DEFAULT 1,
            cout_total REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS frais_divers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            categorie TEXT NOT NULL,
            description TEXT NOT NULL,
            montant REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
    ");

    return $db;
}

function json_response(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function input(): array {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}
