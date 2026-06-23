<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = readTable('frais_divers');
    usort($rows, fn($a,$b) => strcmp($b['date'].$b['created_at'], $a['date'].$a['created_at']));
    json_response(array_values($rows));
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','categorie','description','montant'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $rows = readTable('frais_divers');
    $rows[] = [
        'id'          => nextId($rows),
        'date'        => $d['date'],
        'categorie'   => $d['categorie'],
        'description' => $d['description'],
        'montant'     => (float)$d['montant'],
        'created_at'  => now_local(),
    ];
    writeTable('frais_divers', $rows);
    json_response(['id' => end($rows)['id']], 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    writeTable('frais_divers', array_values(array_filter(readTable('frais_divers'), fn($f) => $f['id'] != $id)));
    json_response(['ok' => true]);
}
