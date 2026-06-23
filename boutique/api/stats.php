<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$db = getDB();

$debut = $_GET['debut'] ?? null;
$fin   = $_GET['fin']   ?? null;

$wV = $debut && $fin ? "WHERE date BETWEEN :debut AND :fin" : "";
$wT = $debut && $fin ? "WHERE t.date BETWEEN :debut AND :fin" : "";
$p  = $debut && $fin ? [':debut' => $debut, ':fin' => $fin] : [];

function q(PDO $db, string $sql, array $p = []) {
    $s = $db->prepare($sql);
    $s->execute($p);
    return $s->fetch() ?: [];
}
function qa(PDO $db, string $sql, array $p = []) {
    $s = $db->prepare($sql);
    $s->execute($p);
    return $s->fetchAll();
}

$ventes = q($db, "
    SELECT
        COALESCE(SUM(prix_vente * quantite * (1 - promo_pourcent/100)),0) as ca_brut,
        COALESCE(SUM(prix_achat * quantite),0)                            as total_achats,
        COALESCE(SUM(quantite),0)                                         as nb_articles,
        COALESCE(COUNT(*),0)                                              as nb_ventes,
        COALESCE(AVG(prix_vente * (1 - promo_pourcent/100)),0)            as panier_moyen,
        COALESCE(AVG((prix_vente*(1-promo_pourcent/100) - prix_achat) / NULLIF(prix_vente*(1-promo_pourcent/100),0) * 100),0) as marge_moyenne
    FROM ventes $wV
", $p);

$retours = q($db, "
    SELECT COALESCE(COUNT(*),0) as nb_retours,
           COALESCE(SUM(remboursement),0) as total_remboursements
    FROM retours $wV
", $p);

// emballages liés aux ventes de la période
$wEmb = $debut && $fin
    ? "JOIN ventes v ON v.id = fev.vente_id WHERE v.date BETWEEN :debut AND :fin"
    : "";
$emb = q($db, "SELECT COALESCE(SUM(fev.cout),0) as total FROM frais_emballage_vente fev $wEmb", $p);

$trajets = q($db, "
    SELECT COALESCE(SUM(cout_total),0) as total,
           COALESCE(SUM(distance_km*2),0) as km_total,
           COALESCE(SUM(nb_colis),0) as colis_total
    FROM trajets $wV
", $p);

$frais = q($db, "SELECT COALESCE(SUM(montant),0) as total FROM frais_divers $wV", $p);

// Par mois (année courante ou dans la période)
$annee = $debut ? substr($debut, 0, 4) : date('Y');
$parMois = qa($db, "
    SELECT strftime('%m', date) as mois,
           ROUND(SUM(prix_vente * quantite * (1 - promo_pourcent/100)), 2) as ca,
           ROUND(SUM((prix_vente*(1-promo_pourcent/100) - prix_achat) * quantite), 2) as benefice_brut,
           COUNT(*) as nb_ventes
    FROM ventes WHERE strftime('%Y', date) = ?
    GROUP BY mois ORDER BY mois
", [$annee]);

// Top articles
$topW = $debut && $fin ? "WHERE date BETWEEN :debut AND :fin" : "";
$top = qa($db, "
    SELECT article, categorie,
           SUM(quantite) as qte,
           ROUND(AVG(prix_vente*(1-promo_pourcent/100)),2) as prix_moyen,
           ROUND(SUM((prix_vente*(1-promo_pourcent/100) - prix_achat)*quantite),2) as benefice,
           ROUND(AVG((prix_vente*(1-promo_pourcent/100)-prix_achat)/NULLIF(prix_vente*(1-promo_pourcent/100),0)*100),1) as marge_pct
    FROM ventes $topW
    GROUP BY article ORDER BY benefice DESC LIMIT 10
", $p);

// Stats par catégorie
$topCat = qa($db, "
    SELECT categorie,
           COUNT(*) as nb_ventes,
           ROUND(SUM((prix_vente*(1-promo_pourcent/100))*quantite),2) as ca,
           ROUND(SUM((prix_vente*(1-promo_pourcent/100)-prix_achat)*quantite),2) as benefice
    FROM ventes $topW
    GROUP BY categorie ORDER BY ca DESC
", $p);

// Stats par canal
$topCanal = qa($db, "
    SELECT canal_vente,
           COUNT(*) as nb_ventes,
           ROUND(SUM(prix_vente*quantite*(1-promo_pourcent/100)),2) as ca
    FROM ventes $topW
    GROUP BY canal_vente ORDER BY ca DESC
", $p);

// URSSAF
define('TAUX_URSSAF', 0.128);
define('TAUX_CFP', 0.001);
define('ABATTEMENT', 0.71);

$ca        = (float)$ventes['ca_brut']   - (float)$retours['total_remboursements'];
$charges   = (float)$ventes['total_achats'] + (float)$emb['total'] + (float)$trajets['total'] + (float)$frais['total'];
$urssaf    = round($ca * TAUX_URSSAF, 2);
$cfp       = round($ca * TAUX_CFP, 2);
$cotis     = $urssaf + $cfp;
$benet_net = round($ca - $charges - $cotis, 2);
$imposable = round($ca * (1 - ABATTEMENT), 2);

echo json_encode([
    'ca_brut'               => round((float)$ventes['ca_brut'], 2),
    'ca_net'                => round($ca, 2),
    'nb_ventes'             => (int)$ventes['nb_ventes'],
    'nb_articles'           => (int)$ventes['nb_articles'],
    'panier_moyen'          => round((float)$ventes['panier_moyen'], 2),
    'marge_moyenne'         => round((float)$ventes['marge_moyenne'], 1),
    'nb_retours'            => (int)$retours['nb_retours'],
    'total_remboursements'  => round((float)$retours['total_remboursements'], 2),
    'taux_retour'           => $ventes['nb_ventes'] > 0
                                ? round($retours['nb_retours'] / $ventes['nb_ventes'] * 100, 1)
                                : 0,
    'total_achats'          => round((float)$ventes['total_achats'], 2),
    'total_emballages'      => round((float)$emb['total'], 2),
    'total_trajets'         => round((float)$trajets['total'], 2),
    'km_total'              => round((float)$trajets['km_total'], 1),
    'colis_total'           => (int)$trajets['colis_total'],
    'total_frais_divers'    => round((float)$frais['total'], 2),
    'total_charges'         => round($charges, 2),
    'urssaf'                => $urssaf,
    'cfp'                   => $cfp,
    'total_cotisations'     => $cotis,
    'benefice_net'          => $benet_net,
    'revenu_imposable'      => $imposable,
    'par_mois'              => $parMois,
    'top_articles'          => $top,
    'par_categorie'         => $topCat,
    'par_canal'             => $topCanal,
], JSON_UNESCAPED_UNICODE);
