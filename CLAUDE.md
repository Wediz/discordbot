# Mémoire — projets d'Alexis

Résumé de ce qui a déjà été fait avec Claude (mis à jour le 01/10/2026).
Les anciennes sessions ont été archivées : ce fichier les remplace.
Réponds en français, simplement : l'utilisateur n'est pas développeur et suit pas à pas.

## Ce dépôt (wediz/discordbot)
- Bot Discord de comptabilité pour une **boutique en ligne de vêtements femme**
  (`/vente`, `/emballage`, etc.). Boutique sur **Shopify** (emplacement « INNA SHOP »).
- `boutique/api/import_inventaire.php` : import CSV d'inventaire Shopify, détecte
  l'export complet (`On hand (current)`) et l'export simplifié (colonne « INNA SHOP »).
- `video-baignoire/` : vidéo promo verticale 17 s (baignoire Twistshake),
  -60 % sur le site + code **CLOOE** (-20 % en plus), « lien en description ».
- Autres dossiers de rendus vidéo/visuels : `brag-output`, `intro-output`,
  `teaser-output`, `urbexfrance-output`, `pub-urbex`.

## Urbex-France (www.urbex-france.com) — projet principal
Le code du site n'est PAS dans ce dépôt : il est sur le PC (sessions Claude Code PC).
- Stack : PHP + MySQL (phpMyAdmin), hébergé chez **LWS**, mise en ligne par **FTP**,
  tâches **cron** LWS. Paiements **Mollie**. Carte interactive sous `/carte/`.
- Leçon apprise : un dépôt FTP partiel est NORMAL. Toujours lister les fichiers
  à renvoyer, et protéger les appels entre fichiers (`function_exists`, try/catch).

### Offres et rayon de la carte
- **Gratuit** : rayon de départ 15 km (constante `RADIUS_FREE`). Plafond réglable dans
  `/carte/admin_plans.php` (« Rayon max compte gratuit ») : recommandé **50 km**
  (40 km si on veut creuser l'écart). Paliers payés en **points** :
  15→25 : 100 pts, 25→35 : 200, 35→45 : 400, 45→50 : 800 (1 500 pts au total).
- **Bonus réseaux sociaux** : jusqu'à +30 km par-dessus le plafond (`SOCIAL_BONUS_MAX`).
- **Premium** : 6,99 €, 100 km. **Premium+** : rayon illimité.
- Bouton « Agrandir » : affiche le vrai gain ; au plafond il propose Premium, puis Premium+.
- Fichiers : `carte/access.php`, `get_radius.php`, `expand_radius.php` (copies aussi à la racine).
  Diagnostic : `carte/diag_rayon.php` (protégé par une clé).

### Abonnement, résiliation, paiements
- Résiliation : perte immédiate des avantages Premium (en place). ⚠️ Risque juridique
  signalé (clause abusive R212-1, abonnés déjà en préavis, reconduction annuelle L215-1).
  Alternative légale proposée : **engagement minimum** (ex. 3 mois).
- Page de rétractation 14 jours (art. L221-18) dans le parcours de résiliation
  (`carte/resiliation_lib.php`).
- Questions ouvertes : prélèvements refusés / frais de rejet, paiements en double.

### Conversion / boutique du site
- `boutique.php` → `login.php?next=/checkout.php?type=premium` : le visiteur non connecté
  revient au paiement après connexion (liste blanche de chemins, pas de redirection ouverte).
- Suivi de l'entonnoir : `shop_view`, `checkout_start` (journalisé à l'envoi du formulaire).
- Boutique de cosmétiques (titres, ornements) : un cadeau doit être « Porté » à la main
  (idée en attente : l'équiper automatiquement si l'emplacement est vide).

### SEO et acquisition
- 48 pages départements (`/urbex/departement/...`), 11 pages villes, pages régions.
- Meta descriptions corrigées (124–154 caractères) ; `seo_lib.php` coupe à 155.
- Trafic venant de **ChatGPT** (`utm_source=chatgpt.com`) suivi dans
  `carte/croissance_lib.php` et `admin_croissance.php`. Site inscrit sur **Bing Webmaster**.
- Textes de notification pour demander un avis **Trustpilot** (4 variantes rédigées).
- Argumentaire « urbex vs tourisme » prêt pour le Discord (la carte = du repérage).

### Application (PWA) et notifications
- `manifest.json` et `sw.js` à la **racine** (portée `/`), service worker minimal
  (icônes + manifest, aucune page PHP en cache). `carte/sw.js` se désenregistre.
- Correctif de la barre du bas sur iPhone ; outil de calibrage `carte/diag.html`.
- Notifications push : `carte/push_lib.php`, `carte/push_events.php`, `chat/api.php`,
  `carte/dm_api.php` (spots proches 1×/h par cron, salons, messages privés, proximité).
- À faire : **supprimer `carte/push_test.php`**, envisager de changer `MIGRATION_KEY`
  (`carte/geo_lib.php`) en mettant à jour la ligne cron LWS.

### Chat / communauté
- XP : +1 par message (≥ 2 caractères), +2 avec image. Niveau = 1 + √(xp/12).
  Titres : Curieux 300 · Explorateur 972 · Éclaireur 2 352 · Vétéran 5 292 ·
  Maître 10 092 · Légende 18 252 XP. Admin = « Fondateur », modo = « Modération ».

### Livraison (boutique Shopify)
- France : Colissimo 12,50 € ; Mondial Relay 4,90 €, gratuit dès 100 €.
- Grille Europe/Martinique mise à jour (12 zones). Le vrai saut de prix Colissimo est à
  **500 g** : piste recommandée = tarif **au poids** (0–500 g / 500 g–2 kg).

## Outils Claude installés (01/10/2026)
- 29 skills auditées (marketing, CRO, SEO, analytics, Stripe, dev) + plugin **Superpowers** :
  sur le PC (`%USERPROFILE%\.claude\skills`), dans l'app Claude (29 importées),
  et dans ce dépôt (`.claude/skills/`, donc dans toutes les sessions cloud).
- Prochaine étape conseillée : skill `marketing-context` pour créer la fiche
  d'identité d'Urbex-France (cible, ton, offres Free / Premium / Premium+).
- Manque : une skill maison « panier moyen / ventes croisées » et un garde-fou
  légal-éthique urbex (ne pas divulguer de lieux sensibles).

## Dossier personnel
- Signalement à l'inspection du travail (DDETS) et dossier de plainte (PDF de 34 pages,
  bordereau de 33 pièces) concernant un ancien employeur de livraison. Documents sur le PC.
