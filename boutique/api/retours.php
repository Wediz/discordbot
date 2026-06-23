<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = readTable('retours');
    usort($rows, fn($a,$b) => strcmp($b['date'].$b['created_at'], $a['date'].$a['created_at']));
    json_response(array_values($rows));
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','article','prix_vente','remboursement'] as $r)
        if (!isset($d[$r]) || $d[$r] === '') json_response(['error' => "Champ manquant: $r"], 400);

    $rows = readTable('retours');
    $rows[] = [
        'id'            => nextId($rows),
        'vente_id'      => $d['vente_id'] ? (int)$d['vente_id'] : null,
        'date'          => $d['date'],
        'article'       => $d['article'],
        'prix_vente'    => (float)$d['prix_vente'],
        'motif'         => $d['motif'] ?? 'Non précisé',
        'remboursement' => (float)$d['remboursement'],
        'created_at'    => now_local(),
    ];
    writeTable('retours', $rows);
    json_response(['id' => end($rows)['id']], 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    writeTable('retours', array_values(array_filter(readTable('retours'), fn($r) => $r['id'] != $id)));
    json_response(['ok' => true]);
}
