<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

// GET : liste du stock
if ($method === 'GET') {
    $stock = readTable('stock');
    $filtre = $_GET['filtre'] ?? 'tout'; // tout | dispo | vendu

    if ($filtre === 'dispo')  $stock = array_filter($stock, fn($a) => $a['statut'] === 'disponible');
    if ($filtre === 'vendu')  $stock = array_filter($stock, fn($a) => $a['statut'] === 'vendu');

    usort($stock, fn($a,$b) => strcmp($b['created_at'], $a['created_at']));
    json_response(array_values($stock));
}

// POST : ajouter un article au stock
if ($method === 'POST') {
    $d = input();
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';

    // Vendre un article (action = vendre)
    if (($d['action'] ?? '') === 'vendre') {
        $id = (int)($d['id'] ?? 0);
        if (!$id) json_response(['error' => 'ID manquant'], 400);
        if (empty($d['prix_vente'])) json_response(['error' => 'Prix de vente manquant'], 400);

        $stock = readTable('stock');
        $article = null;
        foreach ($stock as &$a) {
            if ($a['id'] !== $id) continue;
            if ($a['statut'] === 'vendu') json_response(['error' => 'Déjà vendu'], 400);

            $pvente     = (float)$d['prix_vente'];
            $promo      = (float)($d['promo_pourcent'] ?? 0);
            $canal      = $d['canal_vente'] ?? 'instagram';
            $dateVente  = $d['date'] ?? date('Y-m-d');
            $notes      = $d['notes'] ?? null;

            $a['statut']        = 'vendu';
            $a['prix_vente']    = $pvente;
            $a['promo_pourcent']= $promo;
            $a['canal_vente']   = $canal;
            $a['date_vente']    = $dateVente;
            $a['updated_at']    = now_local();
            $article = $a;
            break;
        }
        if (!$article) json_response(['error' => 'Article introuvable'], 404);
        writeTable('stock', $stock);

        // Créer la vente dans ventes.json automatiquement
        $ventes = readTable('ventes');
        $pvR    = $article['prix_vente'] * (1 - $article['promo_pourcent'] / 100);
        $ventes[] = [
            'id'             => nextId($ventes),
            'date'           => $article['date_vente'],
            'article'        => $article['article'],
            'categorie'      => $article['categorie'],
            'prix_achat'     => $article['prix_achat'],
            'prix_vente'     => $article['prix_vente'],
            'quantite'       => $article['quantite'],
            'promo_pourcent' => $article['promo_pourcent'],
            'canal_vente'    => $article['canal_vente'],
            'notes'          => $notes,
            'source'         => 'stock',
            'stock_id'       => $article['id'],
            'created_at'     => now_local(),
        ];
        writeTable('ventes', $ventes);

        $benefice = ($pvR - $article['prix_achat']) * $article['quantite'];
        json_response([
            'ok'       => true,
            'benefice' => round($benefice, 2),
            'marge'    => $pvR > 0 ? round(($pvR - $article['prix_achat']) / $pvR * 100, 1) : 0,
        ]);
    }

    // Ajouter au stock
    foreach (['article','prix_achat','date_achat'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $stock = readTable('stock');
    $qty = max(1, (int)($d['quantite'] ?? 1));

    // Si quantité > 1, créer N lignes séparées pour les vendre indépendamment
    $ids = [];
    for ($i = 0; $i < $qty; $i++) {
        $id = nextId($stock);
        $stock[] = [
            'id'           => $id,
            'date_achat'   => $d['date_achat'],
            'article'      => $d['article'],
            'categorie'    => $d['categorie'] ?? 'autre',
            'prix_achat'   => (float)$d['prix_achat'],
            'quantite'     => 1,
            'statut'       => 'disponible',
            'prix_vente'   => null,
            'promo_pourcent'=> 0,
            'canal_vente'  => null,
            'date_vente'   => null,
            'notes_achat'  => $d['notes_achat'] ?? null,
            'updated_at'   => null,
            'created_at'   => now_local(),
        ];
        $ids[] = $id;
    }
    writeTable('stock', $stock);
    json_response(['ids' => $ids, 'nb' => $qty], 201);
}

// PUT : modifier un article du stock (avant vente)
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);

    $d = input();
    $stock = readTable('stock');
    $found = false;
    foreach ($stock as &$a) {
        if ($a['id'] !== $id) continue;
        $found = true;
        if (isset($d['article']))     $a['article']     = $d['article'];
        if (isset($d['categorie']))   $a['categorie']   = $d['categorie'];
        if (isset($d['prix_achat']))  $a['prix_achat']  = (float)$d['prix_achat'];
        if (isset($d['date_achat']))  $a['date_achat']  = $d['date_achat'];
        if (isset($d['notes_achat'])) $a['notes_achat'] = $d['notes_achat'];
        if (isset($d['statut']) && $d['statut'] === 'disponible') {
            // Remettre en stock (annuler une vente)
            $a['statut']     = 'disponible';
            $a['prix_vente'] = null;
            $a['date_vente'] = null;
            // Supprimer la vente liée
            $ventes = array_values(array_filter(readTable('ventes'), fn($v) => ($v['stock_id'] ?? null) !== $id));
            writeTable('ventes', $ventes);
        }
        $a['updated_at'] = now_local();
        break;
    }
    if (!$found) json_response(['error' => 'Article introuvable'], 404);
    writeTable('stock', $stock);
    json_response(['ok' => true]);
}

// DELETE : supprimer un article du stock
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);

    // Supprimer aussi la vente liée si vendu
    $ventes = array_values(array_filter(readTable('ventes'), fn($v) => ($v['stock_id'] ?? null) !== $id));
    writeTable('ventes', $ventes);
    writeTable('stock', array_values(array_filter(readTable('stock'), fn($a) => $a['id'] !== $id)));
    json_response(['ok' => true]);
}
