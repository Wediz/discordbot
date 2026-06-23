import db from '../database.js';

// Taux URSSAF 2024 micro-entreprise vente de marchandises
const TAUX_URSSAF = 0.128; // 12,8%
const TAUX_CFP = 0.001;    // 0,1% formation professionnelle
const ABATTEMENT_MICRO = 0.71; // abattement forfaitaire 71% pour vente

export function getStatsGlobales(debut, fin) {
  const whereDate = debut && fin
    ? `WHERE date BETWEEN '${debut}' AND '${fin}'`
    : '';

  const ventes = db.prepare(`
    SELECT
      SUM(prix_vente * quantite * (1 - promo_pourcent/100)) as ca_brut,
      SUM(prix_achat * quantite) as total_achats,
      SUM(quantite) as nb_articles,
      COUNT(*) as nb_ventes,
      AVG(prix_vente * (1 - promo_pourcent/100)) as panier_moyen,
      AVG((prix_vente * (1 - promo_pourcent/100) - prix_achat) / prix_vente * (1 - promo_pourcent/100) * 100) as marge_moyenne
    FROM ventes ${whereDate}
  `).get();

  const retours = db.prepare(`
    SELECT
      COUNT(*) as nb_retours,
      SUM(remboursement) as total_remboursements
    FROM retours ${whereDate}
  `).get();

  const emballages = db.prepare(`
    SELECT SUM(cout) as total_emballages
    FROM frais_emballage_vente fev
    JOIN ventes v ON v.id = fev.vente_id
    ${whereDate.replace('WHERE', 'WHERE v.')}
  `).get();

  const trajets = db.prepare(`
    SELECT
      SUM(cout_total) as total_trajets,
      SUM(distance_km * 2) as km_total,
      SUM(nb_colis) as colis_total
    FROM trajets ${whereDate}
  `).get();

  const frais = db.prepare(`
    SELECT SUM(montant) as total_frais
    FROM frais_divers ${whereDate}
  `).get();

  const ca = (ventes.ca_brut || 0) - (retours.total_remboursements || 0);
  const totalCharges = (ventes.total_achats || 0)
    + (emballages.total_emballages || 0)
    + (trajets.total_trajets || 0)
    + (frais.total_frais || 0);

  const urssaf = ca * TAUX_URSSAF;
  const cfp = ca * TAUX_CFP;
  const totalCotisations = urssaf + cfp;
  const benefice_net = ca - totalCharges - totalCotisations;
  const revenu_imposable = ca * (1 - ABATTEMENT_MICRO);

  return {
    ca_brut: ventes.ca_brut || 0,
    ca_net: ca,
    nb_ventes: ventes.nb_ventes || 0,
    nb_articles: ventes.nb_articles || 0,
    panier_moyen: ventes.panier_moyen || 0,
    marge_moyenne: ventes.marge_moyenne || 0,
    nb_retours: retours.nb_retours || 0,
    total_remboursements: retours.total_remboursements || 0,
    taux_retour: ventes.nb_ventes > 0 ? (retours.nb_retours / ventes.nb_ventes * 100) : 0,
    total_achats: ventes.total_achats || 0,
    total_emballages: emballages.total_emballages || 0,
    total_trajets: trajets.total_trajets || 0,
    km_total: trajets.km_total || 0,
    colis_total: trajets.colis_total || 0,
    total_frais_divers: frais.total_frais || 0,
    total_charges: totalCharges,
    urssaf,
    cfp,
    total_cotisations: totalCotisations,
    benefice_net,
    revenu_imposable,
  };
}

export function getMeilleuresVentes(limite = 10, debut, fin) {
  const whereDate = debut && fin ? `WHERE date BETWEEN '${debut}' AND '${fin}'` : '';
  return db.prepare(`
    SELECT
      article,
      categorie,
      SUM(quantite) as qte_vendue,
      AVG(prix_vente * (1 - promo_pourcent/100)) as prix_moyen,
      SUM((prix_vente * (1 - promo_pourcent/100) - prix_achat) * quantite) as benefice,
      ROUND(AVG((prix_vente*(1-promo_pourcent/100) - prix_achat) / prix_vente*(1-promo_pourcent/100) * 100), 1) as marge_pct
    FROM ventes ${whereDate}
    GROUP BY article
    ORDER BY benefice DESC
    LIMIT ?
  `).all(limite);
}

export function getStatsParMois(annee) {
  return db.prepare(`
    SELECT
      strftime('%m', date) as mois,
      SUM(prix_vente * quantite * (1 - promo_pourcent/100)) as ca,
      SUM((prix_vente * (1 - promo_pourcent/100) - prix_achat) * quantite) as benefice_brut,
      COUNT(*) as nb_ventes
    FROM ventes
    WHERE strftime('%Y', date) = ?
    GROUP BY mois
    ORDER BY mois
  `).all(annee);
}

export function getCoutEmballageParColis() {
  const result = db.prepare(`
    SELECT
      e.type,
      e.prix_unitaire,
      SUM(fev.quantite_utilisee) as total_utilise,
      SUM(fev.cout) as cout_total
    FROM frais_emballage_vente fev
    JOIN emballages e ON e.id = fev.emballage_id
    GROUP BY e.type
  `).all();
  return result;
}

export function getStockEmballages() {
  return db.prepare(`
    SELECT
      type,
      prix_unitaire,
      stock_restant,
      ROUND(prix_unitaire * stock_restant, 2) as valeur_stock
    FROM emballages
    WHERE stock_restant > 0
    ORDER BY type
  `).all();
}

export function formatEuro(n) {
  return `${(+n || 0).toFixed(2)} €`;
}

export function formatPct(n) {
  return `${(+n || 0).toFixed(1)}%`;
}

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
export function nomMois(n) {
  return MOIS[parseInt(n) - 1] || n;
}
