<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $limit  = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);
    $search = $_GET['search'] ?? '';
    $debut  = $_GET['debut'] ?? '';
    $fin    = $_GET['fin'] ?? '';

    $where = [];
    $params = [];

    if ($search) {
        $where[] = "(article LIKE :s OR categorie LIKE :s OR canal_vente LIKE :s)";
        $params[':s'] = "%$search%";
    }
    if ($debut) { $where[] = "date >= :debut"; $params[':debut'] = $debut; }
    if ($fin)   { $where[] = "date <= :fin";   $params[':fin']   = $fin; }

    $sql = "SELECT * FROM ventes" . ($where ? " WHERE " . implode(" AND ", $where) : "") .
           " ORDER BY date DESC, created_at DESC LIMIT :lim OFFSET :off";

    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $total = $db->prepare("SELECT COUNT(*) FROM ventes" . ($where ? " WHERE " . implode(" AND ", $where) : ""));
    foreach ($params as $k => $v) $total->bindValue($k, $v);
    $total->execute();

    json_response(['data' => $rows, 'total' => (int)$total->fetchColumn()]);
}

if ($method === 'POST') {
    $d = input();
    $required = ['date','article','prix_achat','prix_vente'];
    foreach ($required as $r) {
        if (empty($d[$r])) json_response(['error' => "Champ manquant: $r"], 400);
    }

    $prixVenteReel = $d['prix_vente'] * (1 - ($d['promo_pourcent'] ?? 0) / 100);

    $stmt = $db->prepare("
        INSERT INTO ventes (date, article, categorie, prix_achat, prix_vente, quantite, promo_pourcent, canal_vente, notes)
        VALUES (:date, :article, :cat, :pa, :pv, :qty, :promo, :canal, :notes)
    ");
    $stmt->execute([
        ':date'    => $d['date'],
        ':article' => $d['article'],
        ':cat'     => $d['categorie'] ?? 'autre',
        ':pa'      => $d['prix_achat'],
        ':pv'      => $d['prix_vente'],
        ':qty'     => $d['quantite'] ?? 1,
        ':promo'   => $d['promo_pourcent'] ?? 0,
        ':canal'   => $d['canal_vente'] ?? 'instagram',
        ':notes'   => $d['notes'] ?? null,
    ]);
    $venteId = $db->lastInsertId();

    // Associer emballages
    $emballagesUtilises = [];
    if (!empty($d['emballages'])) {
        foreach ($d['emballages'] as $emb) {
            $row = $db->prepare("SELECT * FROM emballages WHERE id = ? AND stock_restant > 0");
            $row->execute([$emb['id']]);
            $e = $row->fetch();
            if (!$e) continue;

            $qty = (int)($emb['quantite'] ?? 1);
            $cout = $e['prix_unitaire'] * $qty;
            $db->prepare("INSERT INTO frais_emballage_vente (vente_id, emballage_id, quantite_utilisee, cout) VALUES (?,?,?,?)")
               ->execute([$venteId, $e['id'], $qty, $cout]);
            $db->prepare("UPDATE emballages SET stock_restant = stock_restant - ? WHERE id = ?")
               ->execute([$qty, $e['id']]);

            $emballagesUtilises[] = ['type' => $e['type'], 'cout' => $cout];
        }
    }

    json_response(['id' => $venteId, 'emballages' => $emballagesUtilises], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) json_response(['error' => 'ID manquant'], 400);

    // Restituer stock emballages
    $embs = $db->prepare("SELECT * FROM frais_emballage_vente WHERE vente_id = ?");
    $embs->execute([$id]);
    foreach ($embs->fetchAll() as $fe) {
        $db->prepare("UPDATE emballages SET stock_restant = stock_restant + ? WHERE id = ?")
           ->execute([$fe['quantite_utilisee'], $fe['emballage_id']]);
    }
    $db->prepare("DELETE FROM frais_emballage_vente WHERE vente_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM ventes WHERE id = ?")->execute([$id]);

    json_response(['ok' => true]);
}
