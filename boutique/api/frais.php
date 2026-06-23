<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query("SELECT * FROM frais_divers ORDER BY date DESC, created_at DESC LIMIT 100")->fetchAll();
    json_response($rows);
}

if ($method === 'POST') {
    $d = input();
    foreach (['date','categorie','description','montant'] as $r)
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);

    $stmt = $db->prepare("INSERT INTO frais_divers (date, categorie, description, montant) VALUES (?,?,?,?)");
    $stmt->execute([$d['date'], $d['categorie'], $d['description'], $d['montant']]);
    json_response(['id' => $db->lastInsertId()], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID manquant'], 400);
    $db->prepare("DELETE FROM frais_divers WHERE id = ?")->execute([$id]);
    json_response(['ok' => true]);
}
