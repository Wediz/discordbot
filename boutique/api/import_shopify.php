<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// GET : liste des articles uniques importés (pour mapping prix d'achat)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $ventes = readTable('ventes');
    $shopify = array_filter($ventes, fn($v) => ($v['source'] ?? '') === 'shopify');

    $arts = [];
    foreach ($shopify as $v) {
        $a = $v['article'];
        if (!isset($arts[$a])) {
            $arts[$a] = ['article' => $a, 'prix_vente_moyen' => 0, 'nb' => 0, 'prix_achat' => $v['prix_achat']];
        }
        $arts[$a]['nb']++;
        $arts[$a]['prix_vente_moyen'] += $v['prix_vente'] * (1 - $v['promo_pourcent'] / 100);
    }
    foreach ($arts as &$a) {
        $a['prix_vente_moyen'] = round($a['prix_vente_moyen'] / $a['nb'], 2);
    }

    $result = array_values($arts);
    usort($result, fn($a,$b) => strcmp($a['article'], $b['article']));
    json_response($result);
}

// POST : import CSV Shopify
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Mode 1 : mise à jour des prix d'achat par article
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($ct, 'application/json')) {
        $d = input();
        if (!empty($d['prix_achat_map'])) {
            $ventes = readTable('ventes');
            $updated = 0;
            foreach ($ventes as &$v) {
                if (($v['source'] ?? '') !== 'shopify') continue;
                $art = $v['article'];
                if (isset($d['prix_achat_map'][$art])) {
                    $v['prix_achat'] = (float)$d['prix_achat_map'][$art];
                    $updated++;
                }
            }
            writeTable('ventes', $ventes);
            json_response(['updated' => $updated]);
        }
    }

    // Mode 2 : upload CSV
    if (empty($_FILES['csv'])) {
        json_response(['error' => 'Aucun fichier reçu'], 400);
    }

    $file = $_FILES['csv']['tmp_name'];
    if (!$file || !is_readable($file)) {
        json_response(['error' => 'Fichier illisible'], 400);
    }

    $handle = fopen($file, 'r');
    $headers = fgetcsv($handle, 0, ',', '"', '\\');
    if (!$headers) {
        json_response(['error' => 'CSV vide ou invalide'], 400);
    }

    // Index des colonnes
    $col = array_flip(array_map('trim', $headers));
    $required = ['Name','Financial Status','Paid at','Lineitem quantity','Lineitem name','Lineitem price'];
    foreach ($required as $r) {
        if (!isset($col[$r])) json_response(['error' => "Colonne manquante: $r"], 400);
    }

    // Charger IDs Shopify déjà importés pour éviter doublons
    $existingVentes = readTable('ventes');
    $existingIds = array_flip(array_filter(array_column($existingVentes, 'shopify_order_id')));

    $existingRetours = readTable('retours');
    $existingRetourIds = array_flip(array_filter(array_column($existingRetours, 'shopify_order_id')));

    // Lire toutes les lignes et grouper par commande
    $orders = [];
    while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
        if (count($row) < count($headers)) {
            $row = array_pad($row, count($headers), '');
        }
        $r = [];
        foreach ($col as $name => $i) {
            $r[$name] = $row[$i] ?? '';
        }

        $orderNum = $r['Name'];
        if (!$orderNum) continue;

        if (!isset($orders[$orderNum])) {
            $orders[$orderNum] = ['meta' => null, 'items' => []];
        }

        // La première ligne d'une commande contient les infos générales
        if ($r['Financial Status'] !== '') {
            $orders[$orderNum]['meta'] = $r;
        }

        // Toutes les lignes ont un article
        if ($r['Lineitem name'] !== '') {
            $orders[$orderNum]['items'][] = [
                'qty'      => max(1, (int)$r['Lineitem quantity']),
                'name'     => trim($r['Lineitem name']),
                'price'    => (float)$r['Lineitem price'],
                'discount' => (float)($r['Lineitem discount'] ?? 0),
            ];
        }
    }
    fclose($handle);

    $newVentes  = $existingVentes;
    $newRetours = $existingRetours;

    $stats = [
        'imported'  => 0,
        'skipped'   => 0,
        'retours'   => 0,
        'errors'    => [],
    ];

    foreach ($orders as $orderNum => $order) {
        $meta = $order['meta'];
        if (!$meta) { $stats['skipped']++; continue; }

        $status = strtolower(trim($meta['Financial Status']));

        // Ignorer commandes annulées ou non payées
        if (in_array($status, ['voided', 'pending', ''])) {
            $stats['skipped']++;
            continue;
        }

        $shopifyId = trim($meta['Id'] ?? $orderNum);

        // Éviter les doublons
        if (isset($existingIds[$shopifyId])) {
            $stats['skipped']++;
            continue;
        }

        // Date
        $paidAt = trim($meta['Paid at']);
        $date   = $paidAt ? substr($paidAt, 0, 10) : substr(trim($meta['Created at']), 0, 10);
        if (!$date) { $stats['errors'][] = "Commande $orderNum : date introuvable"; continue; }

        // Canal
        $source = trim($meta['Source'] ?? 'web');
        $canal  = match($source) {
            'web'                  => 'site',
            'shopify_draft_order'  => 'presentiel',
            default                => 'site',
        };

        // Discount global à répartir proportionnellement
        $discountGlobal = (float)$meta['Discount Amount'];
        $subtotal       = (float)$meta['Subtotal'];

        // Commandes payées ou partiellement remboursées → importer les articles
        if (in_array($status, ['paid', 'partially_refunded', 'refunded'])) {
            foreach ($order['items'] as $item) {
                $pvBase = $item['price'];
                if ($pvBase <= 0 && $item['qty'] > 0) {
                    // Prix 0 = cadeau / article offert, on skippe
                    continue;
                }

                // Remise proportionnelle sur cet article
                $promoEur = $item['discount'];
                if ($promoEur <= 0 && $discountGlobal > 0 && $subtotal > 0) {
                    $promoEur = $discountGlobal * ($pvBase * $item['qty'] / $subtotal);
                }
                $promoPct = ($pvBase * $item['qty']) > 0
                    ? round($promoEur / ($pvBase * $item['qty']) * 100, 2)
                    : 0;

                $newVentes[] = [
                    'id'               => nextId($newVentes),
                    'date'             => $date,
                    'article'          => $item['name'],
                    'categorie'        => devinerCategorie($item['name']),
                    'prix_achat'       => 0,
                    'prix_vente'       => $pvBase,
                    'quantite'         => $item['qty'],
                    'promo_pourcent'   => $promoPct,
                    'canal_vente'      => $canal,
                    'notes'            => "Commande Shopify #$orderNum",
                    'source'           => 'shopify',
                    'shopify_order_id' => $shopifyId,
                    'shopify_order_num'=> $orderNum,
                    'created_at'       => now_local(),
                ];
                $existingIds[$shopifyId] = 1;
                $stats['imported']++;
            }
        }

        // Retours : refunded ou partially_refunded
        $refunded = (float)$meta['Refunded Amount'];
        if ($refunded > 0 && !isset($existingRetourIds[$shopifyId])) {
            $newRetours[] = [
                'id'               => nextId($newRetours),
                'vente_id'         => null,
                'date'             => $date,
                'article'          => "Remboursement commande #$orderNum",
                'prix_vente'       => (float)$meta['Total'],
                'motif'            => $status === 'refunded' ? 'Remboursement total' : 'Remboursement partiel',
                'remboursement'    => $refunded,
                'shopify_order_id' => $shopifyId,
                'created_at'       => now_local(),
            ];
            $existingRetourIds[$shopifyId] = 1;
            $stats['retours']++;
        }
    }

    writeTable('ventes', $newVentes);
    writeTable('retours', $newRetours);

    // Articles uniques importés pour mapping prix d'achat
    $newShopify = array_filter($newVentes, fn($v) => ($v['source'] ?? '') === 'shopify');
    $arts = [];
    foreach ($newShopify as $v) {
        $a = $v['article'];
        if (!isset($arts[$a])) $arts[$a] = ['article' => $a, 'prix_vente_moyen' => 0, 'nb' => 0, 'prix_achat' => 0];
        $arts[$a]['nb']++;
        $arts[$a]['prix_vente_moyen'] += $v['prix_vente'] * (1 - $v['promo_pourcent'] / 100);
    }
    foreach ($arts as &$a) $a['prix_vente_moyen'] = round($a['prix_vente_moyen'] / $a['nb'], 2);
    $articlesUniques = array_values($arts);
    usort($articlesUniques, fn($a,$b) => strcmp($a['article'], $b['article']));

    json_response(array_merge($stats, ['articles_uniques' => $articlesUniques]));
}

// Deviner la catégorie à partir du nom de l'article
function devinerCategorie(string $name): string {
    $n = strtolower($name);
    if (preg_match('/robe|dress/', $n))                    return 'robe';
    if (preg_match('/veste|manteau|blouson|jacket|coat/', $n)) return 'veste';
    if (preg_match('/ensemble|set|combi/', $n))            return 'ensemble';
    if (preg_match('/pantalon|jean|short|jupe|legging|bas/', $n)) return 'bas';
    if (preg_match('/top|chemise|blouse|t-shirt|pull|sweat|haut|brassière|crop/', $n)) return 'haut';
    if (preg_match('/sac|pochette|bijou|bracelet|collier|bague|accessoire|sandal|chaussure|chapeau|ceinture|lunette/', $n)) return 'accessoire';
    return 'autre';
}
