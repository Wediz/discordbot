<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query("SELECT * FROM retours ORDER BY date DESC, created_at DESC LIMIT 100")->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','article','prix_vente','remboursement'] as $r)
        if (empty($d[$r]) && $d[$r] !== 0) json_response(['error' => "Champ manquant: $r"], 400);

    $stmt = $db->prepare("
        INSERT INTO retours (vente_id, date, article, prix_vente, motif, remboursement)
        VALUES (:vid, :date, :art, :pv, :motif, :remb)
    ");
    $stmt->execute([
        ':vid'   => $d['vente_id'] ?? null,
        ':date'  => $d['date'],
        ':art'   => $d['article'],
        ':pv'    => $d['prix_vente'],
        ':motif' => $d['motif'] ?? 'Non précisé',
        ':remb'  => $d['remboursement'],
    ]);
    json_response(['id' => $db->lastInsertId()], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    $db->prepare("DELETE FROM retours WHERE id = ?")->execute([$id]);
    json_response(['ok' => true]);
}
