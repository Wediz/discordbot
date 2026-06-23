<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'Méthode non autorisée'], 405);

// Mode mise à jour prix d'achat
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (str_contains($ct, 'application/json')) {
    $d = input();
    if (!empty($d['prix_achat_map'])) {
        $stock = readTable('stock');
        $updated = 0;
        foreach ($stock as &$a) {
            if (($a['source'] ?? '') !== 'inventaire_shopify') continue;
            if (isset($d['prix_achat_map'][$a['article']])) {
                $a['prix_achat'] = (float)$d['prix_achat_map'][$a['article']];
                $updated++;
            }
        }
        writeTable('stock', $stock);
        json_response(['updated' => $updated]);
    }
    json_response(['error' => 'Données invalides'], 400);
}

// Upload CSV
if (empty($_FILES['csv'])) json_response(['error' => 'Aucun fichier reçu'], 400);
$file = $_FILES['csv']['tmp_name'];
if (!$file || !is_readable($file)) json_response(['error' => 'Fichier illisible'], 400);

$handle = fopen($file, 'r');
$headers = fgetcsv($handle, 0, ',', '"', '\\');
if (!$headers) json_response(['error' => 'CSV vide ou invalide'], 400);

$col = array_flip(array_map('trim', $headers));

// Colonne de quantité : "On hand (current)" (export complet) ou nom de boutique (export simplifié)
$knownCols = ['Handle','Title','Option1 Name','Option1 Value','Option2 Name','Option2 Value',
              'Option3 Name','Option3 Value','SKU','HS Code','COO','Location','Bin name',
              'Incoming (not editable)','Unavailable (not editable)','Committed (not editable)',
              'Available (not editable)','On hand (new)'];
if (!isset($col['Title'])) json_response(['error' => 'Colonne Title manquante'], 400);

$qtyCol = null;
if (isset($col['On hand (current)'])) {
    $qtyCol = 'On hand (current)';
} else {
    // Format simplifié : chercher la première colonne inconnue après COO
    foreach (array_map('trim', $headers) as $h) {
        if (!in_array($h, $knownCols, true)) { $qtyCol = $h; break; }
    }
}
if (!$qtyCol) json_response(['error' => 'Colonne de quantité introuvable (On hand ou nom de boutique)'], 400);

$date = $_POST['date_achat'] ?? date('Y-m-d');

$stock   = readTable('stock');
$existingArticles = [];
foreach ($stock as $a) {
    if (($a['source'] ?? '') === 'inventaire_shopify')
        $existingArticles[$a['article']] = true;
}

$imported = 0;
$skipped  = 0;
$articlesUniques = [];

while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
    if (count($row) < count($headers)) $row = array_pad($row, count($headers), '');
    $r = [];
    foreach ($col as $name => $i) $r[$name] = trim($row[$i] ?? '');

    $titre    = $r['Title'];
    $onHand   = (int)($r[$qtyCol] ?? 0);

    if (!$titre || $onHand <= 0) { $skipped++; continue; }

    // Construire le nom complet avec les variantes
    $opt1name = $r['Option1 Name'] ?? '';
    $opt1val  = $r['Option1 Value'] ?? '';
    $opt2val  = $r['Option2 Value'] ?? '';
    $opt3val  = $r['Option3 Value'] ?? '';

    // Ignorer les variantes génériques "Default Title"
    $varParts = [];
    if ($opt1val && $opt1val !== 'Default Title') $varParts[] = $opt1val;
    if ($opt2val && $opt2val !== 'Default Title') $varParts[] = $opt2val;
    if ($opt3val && $opt3val !== 'Default Title') $varParts[] = $opt3val;

    $nomComplet = $varParts ? $titre . ' — ' . implode(' / ', $varParts) : $titre;

    // Éviter les doublons exacts
    if (isset($existingArticles[$nomComplet])) { $skipped++; continue; }

    // Nettoyer le titre des mentions (PRÉCOMMANDE), (REASSORT) etc.
    $titrePropre = preg_replace('/\s*[\(\[]?(PRÉCOMMANDE|PRECOMMANDE|REASSORT|RÉASSORT|réassort|reassort)[^\)]*[\)\]]?\s*/i', '', $nomComplet);
    $titrePropre = preg_replace('/\s+expédition.*$/i', '', $titrePropre);
    $titrePropre = trim($titrePropre);

    for ($i = 0; $i < $onHand; $i++) {
        $stock[] = [
            'id'           => nextId($stock),
            'date_achat'   => $date,
            'article'      => $titrePropre,
            'categorie'    => devinerCategorie($titre),
            'prix_achat'   => 0,
            'quantite'     => 1,
            'statut'       => 'disponible',
            'prix_vente'   => null,
            'promo_pourcent'=> 0,
            'canal_vente'  => null,
            'date_vente'   => null,
            'notes_achat'  => null,
            'source'       => 'inventaire_shopify',
            'updated_at'   => null,
            'created_at'   => now_local(),
        ];
        $existingArticles[$nomComplet] = true;
        $imported++;
    }

    // Pour le mapping prix d'achat
    if (!isset($articlesUniques[$titrePropre])) {
        $articlesUniques[$titrePropre] = ['article' => $titrePropre, 'nb' => 0, 'categorie' => devinerCategorie($titre)];
    }
    $articlesUniques[$titrePropre]['nb'] += $onHand;
}
fclose($handle);

writeTable('stock', $stock);

$arts = array_values($articlesUniques);
usort($arts, fn($a,$b) => strcmp($a['article'], $b['article']));

json_response([
    'imported' => $imported,
    'skipped'  => $skipped,
    'articles_uniques' => $arts,
]);

function devinerCategorie(string $name): string {
    $n = strtolower($name);
    if (preg_match('/robe/', $n))                                          return 'robe';
    if (preg_match('/blazer|veste|manteau|blouson/', $n))                  return 'veste';
    if (preg_match('/ensemble|combi/', $n))                                return 'ensemble';
    if (preg_match('/pantalon|jean|short|jupe|legging/', $n))             return 'bas';
    if (preg_match('/top|chemise|blouse|pull|sweat|haut|brassière|crop/', $n)) return 'haut';
    if (preg_match('/sac|pochette|bague|bracelet|collier|baume|bijou|accessoire|sandal|chaussure|chapeau|ceinture|lunette/', $n)) return 'accessoire';
    return 'autre';
}
