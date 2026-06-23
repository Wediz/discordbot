<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query("
        SELECT e.*,
               COALESCE((SELECT SUM(fev.quantite_utilisee) FROM frais_emballage_vente fev WHERE fev.emballage_id = e.id),0) as total_utilise,
               COALESCE((SELECT SUM(fev.cout) FROM frais_emballage_vente fev WHERE fev.emballage_id = e.id),0) as cout_total_utilise
        FROM emballages e ORDER BY created_at DESC
    ")->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','type','quantite_achetee','prix_total'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $pu = round($d['prix_total'] / $d['quantite_achetee'], 6);

    $stmt = $db->prepare("
        INSERT INTO emballages (date, type, quantite_achetee, prix_total, prix_unitaire, stock_restant)
        VALUES (:date, :type, :qty, :pt, :pu, :stock)
    ");
    $stmt->execute([
        ':date'  => $d['date'],
        ':type'  => $d['type'],
        ':qty'   => $d['quantite_achetee'],
        ':pt'    => $d['prix_total'],
        ':pu'    => $pu,
        ':stock' => $d['quantite_achetee'],
    ]);
    json_response(['id' => $db->lastInsertId(), 'prix_unitaire' => $pu], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    $db->prepare("DELETE FROM frais_emballage_vente WHERE emballage_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM emballages WHERE id = ?")->execute([$id]);
    json_response(['ok' => true]);
}
