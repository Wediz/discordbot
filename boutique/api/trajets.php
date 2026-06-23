<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query("SELECT * FROM trajets ORDER BY date DESC, created_at DESC LIMIT 100")->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','distance_km','prix_essence_litre','consommation_100km'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $distance_ar    = $d['distance_km'] * 2;
    $litres         = ($distance_ar * $d['consommation_100km']) / 100;
    $cout_total     = round($litres * $d['prix_essence_litre'], 4);

    $stmt = $db->prepare("
        INSERT INTO trajets (date, destination, distance_km, prix_essence_litre, consommation_100km, nb_colis, cout_total)
        VALUES (:date, :dest, :dist, :pe, :conso, :nb, :cout)
    ");
    $stmt->execute([
        ':date'  => $d['date'],
        ':dest'  => $d['destination'] ?? 'La Poste',
        ':dist'  => $d['distance_km'],
        ':pe'    => $d['prix_essence_litre'],
        ':conso' => $d['consommation_100km'],
        ':nb'    => $d['nb_colis'] ?? 1,
        ':cout'  => $cout_total,
    ]);
    json_response(['id' => $db->lastInsertId(), 'cout_total' => $cout_total, 'litres' => round($litres,2)], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    $db->prepare("DELETE FROM trajets WHERE id = ?")->execute([$id]);
    json_response(['ok' => true]);
}
