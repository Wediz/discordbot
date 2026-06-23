<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $embs = readTable('emballages');
    $fevs = readTable('frais_emballage_vente');

    // Calculer stats d'utilisation
    $utilise = [];
    foreach ($fevs as $f) {
        $eid = $f['emballage_id'];
        $utilise[$eid]['qty']  = ($utilise[$eid]['qty']  ?? 0) + $f['quantite_utilisee'];
        $utilise[$eid]['cout'] = ($utilise[$eid]['cout'] ?? 0) + $f['cout'];
    }

    $result = array_map(fn($e) => array_merge($e, [
        'total_utilise'       => $utilise[$e['id']]['qty']  ?? 0,
        'cout_total_utilise'  => $utilise[$e['id']]['cout'] ?? 0,
    ]), $embs);

    usort($result, fn($a,$b) => strcmp($b['created_at'], $a['created_at']));
    json_response(array_values($result));
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','type','quantite_achetee','prix_total'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $qty = (int)$d['quantite_achetee'];
    $pt  = (float)$d['prix_total'];
    $pu  = round($pt / $qty, 6);

    $embs = readTable('emballages');
    $id   = nextId($embs);
    $embs[] = [
        'id'               => $id,
        'date'             => $d['date'],
        'type'             => $d['type'],
        'quantite_achetee' => $qty,
        'prix_total'       => $pt,
        'prix_unitaire'    => $pu,
        'stock_restant'    => $qty,
        'created_at'       => now_local(),
    ];
    writeTable('emballages', $embs);
    json_response(['id' => $id, 'prix_unitaire' => $pu], 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    writeTable('frais_emballage_vente', array_values(array_filter(readTable('frais_emballage_vente'), fn($f) => $f['emballage_id'] != $id)));
    writeTable('emballages', array_values(array_filter(readTable('emballages'), fn($e) => $e['id'] != $id)));
    json_response(['ok' => true]);
}
