# Urbex France — Présentation Matériel EP.01 · Salomon Speed Assault 2

Pub verticale de 25 s (1080 × 1920, 30 images/s, 750 images, MP4 H.264) faite avec Remotion.

- **Vidéo finale** : `out/urbex-presentation-materiel-ep01.mp4`
- **Captures de contrôle** : `stills/` (une ou plusieurs par séquence)

## Les 5 séquences

| Temps | Séquence | Fichier |
|---|---|---|
| 0 → 4 s | Intro : logo, PRÉSENTATION MATÉRIEL, ÉPISODE 01 | `src/scenes/Intro.tsx` |
| 4 → 10 s | Révélation : profil sorti de l'ombre, puis 3/4 avec le titre | `src/scenes/ProductReveal.tsx` |
| 10 → 18 s | Détails : DESIGN TACTIQUE, MOBILITÉ, TERRAIN | `src/scenes/Details.tsx` |
| 18 → 22 s | Hero shot : SPEED ASSAULT 2 | `src/scenes/Hero.tsx` |
| 22 → 25 s | Outro : logo + PRÉSENTATION MATÉRIEL — EP. 01 | `src/scenes/Outro.tsx` |

## Installation (une seule fois)

Il faut [Node.js](https://nodejs.org) (version 18 ou plus). Dans ce dossier :

```bash
npm install
```

## Voir et retoucher la vidéo

```bash
npm run studio
```

Le navigateur s'ouvre sur Remotion Studio. La composition **SpeedAssault2** est la pub complète ;
le dossier **Sequences** permet de voir chaque séquence séparément.

## Exporter le MP4

```bash
npm run render
```

Le fichier sort dans `out/urbex-presentation-materiel-ep01.mp4`.
Si Remotion ne parvient pas à télécharger son navigateur, indiquer un Chrome local :
`REMOTION_BROWSER=/chemin/vers/chrome npm run render`.

Captures de contrôle : `npm run stills` (ou `node scripts/stills.mjs 120 300` pour des images précises).

## Modifier les textes, les images et la durée

**Tout se règle dans `src/content.ts`** :

- **Textes** : bloc `TEXTS` (série, épisode, marque, modèle, ligne de fin, repère du haut).
- **Détails** : bloc `DETAILS`. Pour chaque détail : le mot (`word`), la phrase (`note`),
  l'étiquette (`label`), la photo utilisée, le cadrage de la caméra (`camFrom` → `camTo` :
  point visé en pixels de l'image et zoom) et le point annoté (`target`).
  Les phrases décrivent ce qui se voit sur les photos, sans promesse de performance.
- **Durées** : bloc `TIMING`, en images (30 = 1 seconde). La durée totale se recalcule seule.
  Les animations internes sont calées pour les durées actuelles : si tu rallonges beaucoup
  une séquence, vérifie-la dans le Studio.
- **Images** : bloc `IMAGES`. Pour changer de photo, la mettre dans `public/assets/`
  et mettre à jour `src`, `w` et `h` (largeur et hauteur en pixels).

**Couleurs et polices** : `src/theme.ts` (noir, anthracite, blanc cassé, orange signalisation ;
Anton, Barlow Condensed, JetBrains Mono, chargées depuis `public/fonts/`, sans connexion).

## Images utilisées

Uniquement les fichiers fournis, rangés dans `public/assets/source/`.
`npm run assets` (Python 3 + Pillow + NumPy) les prépare, sans rien inventer :

- `logo-urbex-france.png` : logo extrait du visuel fourni (fond rendu transparent) ;
- `shoe-side-cut.png`, `shoe-34-cut.png` : photos produit avec le fond blanc retiré ;
- `hero-scene.jpg` : scène du visuel fourni, recadrée sans ses textes ;
- `ambience-blur.jpg` : la même scène floutée, pour les fonds.

Aucune musique, aucune vidéo externe, aucune API payante.
