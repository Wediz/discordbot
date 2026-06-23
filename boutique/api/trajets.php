<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = readTable('trajets');
    usort($rows, fn($a,$b) => strcmp($b['date'].$b['created_at'], $a['date'].$a['created_at']));
    json_response(array_values($rows));
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','distance_km','prix_essence_litre','consommation_100km'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $dist  = (float)$d['distance_km'];
    $pe    = (float)$d['prix_essence_litre'];
    $conso = (float)$d['consommation_100km'];
    $nb    = (int)($d['nb_colis'] ?? 1);
    $litres    = round($dist * 2 * $conso / 100, 4);
    $cout_total = round($litres * $pe, 4);

    $rows = readTable('trajets');
    $rows[] = [
        'id'                  => nextId($rows),
        'date'                => $d['date'],
        'destination'         => $d['destination'] ?? 'La Poste',
        'distance_km'         => $dist,
        'prix_essence_litre'  => $pe,
        'consommation_100km'  => $conso,
        'nb_colis'            => $nb,
        'cout_total'          => $cout_total,
        'created_at'          => now_local(),
    ];
    writeTable('trajets', $rows);
    json_response(['id' => end($rows)['id'], 'cout_total' => $cout_total, 'litres' => $litres], 201);
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    writeTable('trajets', array_values(array_filter(readTable('trajets'), fn($t) => $t['id'] != $id)));
    json_response(['ok' => true]);
}
