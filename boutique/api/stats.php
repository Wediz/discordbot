<?php
require_once __DIR__ . '/db.php';
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$debut = $_GET['debut'] ?? null;
$fin   = $_GET['fin']   ?? null;

// Charger toutes les tables
$ventes = readTable('ventes');
$retours = readTable('retours');
$embs   = readTable('emballages');
$fevs   = readTable('frais_emballage_vente');
$trajets = readTable('trajets');
$frais  = readTable('frais_divers');

// Filtre par date
$filt = function(array $rows) use ($debut, $fin): array {
    if ($debut) $rows = array_filter($rows, fn($r) => $r['date'] >= $debut);
    if ($fin)   $rows = array_filter($rows, fn($r) => $r['date'] <= $fin);
    return array_values($rows);
};

$vF = $filt($ventes);
$rF = $filt($retours);
$tF = $filt($trajets);
$frF = $filt($frais);

// IDs ventes filtrées pour emballages
$ventesIds = array_flip(array_column($vF, 'id'));
$fevF = array_filter($fevs, fn($f) => isset($ventesIds[$f['vente_id']]));

// ── Calculs ventes
$ca_brut      = array_sum(array_map(fn($v) => $v['prix_vente'] * $v['quantite'] * (1 - $v['promo_pourcent']/100), $vF));
$total_achats = array_sum(array_map(fn($v) => $v['prix_achat'] * $v['quantite'], $vF));
$nb_articles  = array_sum(array_column($vF, 'quantite'));
$nb_ventes    = count($vF);

$paniers = array_map(fn($v) => $v['prix_vente'] * (1 - $v['promo_pourcent']/100), $vF);
$panier_moyen = $nb_ventes ? array_sum($paniers) / $nb_ventes : 0;

$marges = array_map(function($v) {
    $pvR = $v['prix_vente'] * (1 - $v['promo_pourcent']/100);
    return $pvR > 0 ? ($pvR - $v['prix_achat']) / $pvR * 100 : 0;
}, $vF);
$marge_moyenne = $nb_ventes ? array_sum($marges) / $nb_ventes : 0;

// ── Retours
$nb_retours            = count($rF);
$total_remboursements  = array_sum(array_column($rF, 'remboursement'));

// ── Emballages
$total_emballages = array_sum(array_column($fevF, 'cout'));

// ── Trajets
$total_trajets = array_sum(array_column($tF, 'cout_total'));
$km_total      = array_sum(array_map(fn($t) => $t['distance_km'] * 2, $tF));
$colis_total   = array_sum(array_column($tF, 'nb_colis'));

// ── Frais divers
$total_frais_divers = array_sum(array_column($frF, 'montant'));

// ── Calculs finaux
$ca_net       = $ca_brut - $total_remboursements;
$total_charges = $total_achats + $total_emballages + $total_trajets + $total_frais_divers;
$urssaf       = round($ca_net * 0.128, 2);
$cfp          = round($ca_net * 0.001, 2);
$total_cotisations = $urssaf + $cfp;
$benefice_net = round($ca_net - $total_charges - $total_cotisations, 2);
$revenu_imposable = round($ca_net * 0.29, 2); // abattement 71%

// ── Par mois (année courante ou de la période)
$annee = $debut ? substr($debut, 0, 4) : date('Y');
$byMois = [];
foreach ($ventes as $v) {
    if (substr($v['date'], 0, 4) !== $annee) continue;
    $m = substr($v['date'], 5, 2);
    $pvR = $v['prix_vente'] * (1 - $v['promo_pourcent']/100);
    $byMois[$m]['ca']            = ($byMois[$m]['ca'] ?? 0) + $pvR * $v['quantite'];
    $byMois[$m]['benefice_brut'] = ($byMois[$m]['benefice_brut'] ?? 0) + ($pvR - $v['prix_achat']) * $v['quantite'];
    $byMois[$m]['nb_ventes']     = ($byMois[$m]['nb_ventes'] ?? 0) + 1;
}
ksort($byMois);
$par_mois = array_map(fn($m, $d) => [
    'mois' => $m,
    'ca'   => round($d['ca'], 2),
    'benefice_brut' => round($d['benefice_brut'], 2),
    'nb_ventes' => $d['nb_ventes'],
], array_keys($byMois), $byMois);

// ── Top articles
$byArt = [];
foreach ($vF as $v) {
    $pvR = $v['prix_vente'] * (1 - $v['promo_pourcent']/100);
    $a   = $v['article'];
    $byArt[$a]['categorie'] = $v['categorie'];
    $byArt[$a]['qte']       = ($byArt[$a]['qte'] ?? 0) + $v['quantite'];
    $byArt[$a]['ca']        = ($byArt[$a]['ca'] ?? 0) + $pvR * $v['quantite'];
    $byArt[$a]['benefice']  = ($byArt[$a]['benefice'] ?? 0) + ($pvR - $v['prix_achat']) * $v['quantite'];
    $byArt[$a]['pvs'][]     = $pvR;
}
$top_articles = [];
foreach ($byArt as $art => $d) {
    $pm = array_sum($d['pvs']) / count($d['pvs']);
    $mp = $pm > 0 ? ($d['benefice'] / count($d['pvs'])) / $pm * 100 : 0;
    $top_articles[] = [
        'article'   => $art,
        'categorie' => $d['categorie'],
        'qte'       => $d['qte'],
        'prix_moyen'=> round($pm, 2),
        'benefice'  => round($d['benefice'], 2),
        'marge_pct' => round($d['benefice'] / max($d['ca'], 0.01) * 100, 1),
    ];
}
usort($top_articles, fn($a,$b) => $b['benefice'] <=> $a['benefice']);
$top_articles = array_slice($top_articles, 0, 10);

// ── Par catégorie
$byCat = [];
foreach ($vF as $v) {
    $pvR = $v['prix_vente'] * (1 - $v['promo_pourcent']/100);
    $c   = $v['categorie'];
    $byCat[$c]['nb_ventes'] = ($byCat[$c]['nb_ventes'] ?? 0) + 1;
    $byCat[$c]['ca']        = ($byCat[$c]['ca'] ?? 0) + $pvR * $v['quantite'];
    $byCat[$c]['benefice']  = ($byCat[$c]['benefice'] ?? 0) + ($pvR - $v['prix_achat']) * $v['quantite'];
}
$par_categorie = array_map(fn($cat, $d) => [
    'categorie' => $cat, 'nb_ventes' => $d['nb_ventes'],
    'ca' => round($d['ca'],2), 'benefice' => round($d['benefice'],2),
], array_keys($byCat), $byCat);
usort($par_categorie, fn($a,$b) => $b['ca'] <=> $a['ca']);

// ── Par canal
$byCanal = [];
foreach ($vF as $v) {
    $pvR = $v['prix_vente'] * (1 - $v['promo_pourcent']/100);
    $c   = $v['canal_vente'];
    $byCanal[$c]['nb_ventes'] = ($byCanal[$c]['nb_ventes'] ?? 0) + 1;
    $byCanal[$c]['ca']        = ($byCanal[$c]['ca'] ?? 0) + $pvR * $v['quantite'];
}
$par_canal = array_map(fn($canal, $d) => [
    'canal_vente' => $canal, 'nb_ventes' => $d['nb_ventes'], 'ca' => round($d['ca'],2),
], array_keys($byCanal), $byCanal);
usort($par_canal, fn($a,$b) => $b['ca'] <=> $a['ca']);

echo json_encode([
    'ca_brut'              => round($ca_brut, 2),
    'ca_net'               => round($ca_net, 2),
    'nb_ventes'            => $nb_ventes,
    'nb_articles'          => $nb_articles,
    'panier_moyen'         => round($panier_moyen, 2),
    'marge_moyenne'        => round($marge_moyenne, 1),
    'nb_retours'           => $nb_retours,
    'total_remboursements' => round($total_remboursements, 2),
    'taux_retour'          => $nb_ventes ? round($nb_retours / $nb_ventes * 100, 1) : 0,
    'total_achats'         => round($total_achats, 2),
    'total_emballages'     => round($total_emballages, 2),
    'total_trajets'        => round($total_trajets, 2),
    'km_total'             => round($km_total, 1),
    'colis_total'          => $colis_total,
    'total_frais_divers'   => round($total_frais_divers, 2),
    'total_charges'        => round($total_charges, 2),
    'urssaf'               => $urssaf,
    'cfp'                  => $cfp,
    'total_cotisations'    => $total_cotisations,
    'benefice_net'         => $benefice_net,
    'revenu_imposable'     => $revenu_imposable,
    'par_mois'             => $par_mois,
    'top_articles'         => $top_articles,
    'par_categorie'        => $par_categorie,
    'par_canal'            => $par_canal,
], JSON_UNESCAPED_UNICODE);
