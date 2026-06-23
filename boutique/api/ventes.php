<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows   = readTable('ventes');
    $search = strtolower($_GET['search'] ?? '');
    $debut  = $_GET['debut'] ?? '';
    $fin    = $_GET['fin']   ?? '';

    if ($search) $rows = array_filter($rows, fn($v) =>
        str_contains(strtolower($v['article']), $search) ||
        str_contains(strtolower($v['categorie'] ?? ''), $search) ||
        str_contains(strtolower($v['canal_vente'] ?? ''), $search)
    );
    if ($debut) $rows = array_filter($rows, fn($v) => $v['date'] >= $debut);
    if ($fin)   $rows = array_filter($rows, fn($v) => $v['date'] <= $fin);

    // Tri décroissant par date
    $rows = array_values($rows);
    usort($rows, fn($a,$b) => strcmp($b['date'].$b['created_at'], $a['date'].$a['created_at']));

    $limit  = (int)($_GET['limit']  ?? 100);
    $offset = (int)($_GET['offset'] ?? 0);
    $total  = count($rows);
    $rows   = array_slice($rows, $offset, $limit);

    json_response(['data' => $rows, 'total' => $total]);
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','article','prix_achat','prix_vente'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $ventes = readTable('ventes');
    $id = nextId($ventes);

    $vente = [
        'id'            => $id,
        'date'          => $d['date'],
        'article'       => $d['article'],
        'categorie'     => $d['categorie']     ?? 'autre',
        'prix_achat'    => (float)$d['prix_achat'],
        'prix_vente'    => (float)$d['prix_vente'],
        'quantite'      => (int)($d['quantite']       ?? 1),
        'promo_pourcent'=> (float)($d['promo_pourcent'] ?? 0),
        'canal_vente'   => $d['canal_vente']   ?? 'instagram',
        'notes'         => $d['notes']         ?? null,
        'created_at'    => now_local(),
    ];
    $ventes[] = $vente;
    writeTable('ventes', $ventes);

    // Associer emballages
    $emballagesUtilises = [];
    if (!empty($d['emballages'])) {
        $embs = readTable('emballages');
        $fevs = readTable('frais_emballage_vente');

        foreach ($d['emballages'] as $emb) {
            $idx = null;
            foreach ($embs as $i => $e) {
                if ($e['id'] == $emb['id'] && $e['stock_restant'] > 0) { $idx = $i; break; }
            }
            if ($idx === null) continue;

            $qty  = (int)($emb['quantite'] ?? 1);
            $cout = round($embs[$idx]['prix_unitaire'] * $qty, 6);

            $fevs[] = [
                'id'               => nextId($fevs),
                'vente_id'         => $id,
                'emballage_id'     => $embs[$idx]['id'],
                'quantite_utilisee'=> $qty,
                'cout'             => $cout,
            ];
            $embs[$idx]['stock_restant'] -= $qty;
            $emballagesUtilises[] = ['type' => $embs[$idx]['type'], 'cout' => $cout];
        }
        writeTable('emballages', $embs);
        writeTable('frais_emballage_vente', $fevs);
    }

    json_response(['id' => $id, 'emballages' => $emballagesUtilises], 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);

    // Restituer stock emballages
    $fevs = readTable('frais_emballage_vente');
    $embs = readTable('emballages');
    foreach ($fevs as $fe) {
        if ($fe['vente_id'] == $id) {
            foreach ($embs as &$e) {
                if ($e['id'] == $fe['emballage_id']) {
                    $e['stock_restant'] += $fe['quantite_utilisee'];
                    break;
                }
            }
        }
    }
    writeTable('emballages', $embs);
    writeTable('frais_emballage_vente', array_values(array_filter($fevs, fn($f) => $f['vente_id'] != $id)));
    writeTable('ventes', array_values(array_filter(readTable('ventes'), fn($v) => $v['id'] != $id)));

    json_response(['ok' => true]);
}
