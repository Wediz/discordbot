# 👗 Bot Discord — Comptabilité Boutique

Bot Discord complet pour gérer la comptabilité d'une boutique en ligne vêtements femme.

## Installation

```bash
npm install
cp .env.example .env
# Remplir DISCORD_TOKEN, CLIENT_ID, GUILD_ID dans .env
npm run deploy   # déploie les slash commands
npm start        # lance le bot
```

## Commandes disponibles

| Commande | Description |
|---|---|
| `/vente` | Enregistrer une vente avec prix achat, vente, promo, emballage |
| `/emballage` | Acheter des emballages (pochettes, scotch, cadeaux...) — prix unitaire calculé automatiquement |
| `/retour` | Enregistrer un retour client |
| `/trajet` | Calculer le coût d'un trajet essence pour déposer des colis |
| `/frais` | Frais divers (abonnement, pub, matériel...) |
| `/stats` | Dashboard complet avec graphique (CA, bénéfice, charges, URSSAF) |
| `/fiscal` | Bilan fiscal annuel, cotisations URSSAF, IR estimé, seuils micro |
| `/top` | Classement des meilleures ventes avec graphique |
| `/stock` | Stock d'emballages restants et coûts |
| `/historique` | Dernières ventes / retours / trajets / frais |

## Fonctionnalités

- **Emballages au centime près** : achetez 100 pochettes à 15€ → 0,15€/unité déduit automatiquement à chaque vente
- **Trajets essence** : calcul exact (distance × consommation × prix litre × aller-retour / nb colis)
- **URSSAF** : 12,8% sur CA + 0,1% CFP, déclaration trimestrielle estimée
- **Impôts** : abattement 71%, revenu imposable, IR estimé par tranche
- **Seuils** : alerte si approche du seuil TVA (91 900€) ou micro-entreprise (188 700€)
- **Graphiques** : CA mensuel, bénéfice, top articles
