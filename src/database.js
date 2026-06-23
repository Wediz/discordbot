import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';

mkdirSync('./data', { recursive: true });

const db = new Database('./data/boutique.db');

db.exec(`
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
    prix_unitaire REAL GENERATED ALWAYS AS (ROUND(prix_total / quantite_achetee, 4)) STORED,
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
    cout_total REAL GENERATED ALWAYS AS (ROUND((distance_km * 2 * consommation_100km / 100) * prix_essence_litre, 4)) STORED,
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
`);

export default db;
