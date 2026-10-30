# Urbex France — Présentation Matériel EP.01 · Salomon Speed Assault 2

Présentation verticale d'environ 60 s (1080 × 1920, 30 images/s, MP4 H.264 + son AAC) faite avec Remotion :
voix off, sous-titres, musique et bruitages originaux, 6 caractéristiques utiles en urbex.

- **Vidéo finale** : `out/urbex-presentation-materiel-ep01.mp4`
- **Captures de contrôle** : `stills/` (une ou plusieurs par séquence)

## Déroulé

| Séquence | Contenu | Fichier |
|---|---|---|
| Intro | Logo, PRÉSENTATION MATÉRIEL, ÉPISODE 01 | `src/scenes/Intro.tsx` |
| Révélation | Profil sorti de l'ombre, puis 3/4 avec le titre | `src/scenes/ProductReveal.tsx` |
| Caractéristiques | Accroche, amorti, anti-débris, laçage, discrétion, légèreté | `src/scenes/Details.tsx` |
| Hero shot | SPEED ASSAULT 2 | `src/scenes/Hero.tsx` |
| Outro | Logo, EP. 01, urbex-france.com | `src/scenes/Outro.tsx` |

Les durées ne sont pas fixées à la main : chaque séquence dure le temps de sa phrase
de voix off, arrondi au temps de la musique (100 BPM), pour que les coupes tombent en rythme.

## Caractéristiques citées (fiche officielle Salomon)

- Semelle **Mud Contagrip** : crampons profonds à arêtes vives, pour sols meubles et boueux.
- Semelle intermédiaire **EnergyCell** (mousse EVA qui amortit les chocs), **drop 4 mm** (26/22 mm).
- **Languette à soufflet** et **mesh anti-débris**.
- Laçage **Quicklace** avec poche de rangement du lacet.
- Matériaux **non réfléchissants**.
- Environ **320 g** la chaussure (version standard), **tige mi-montante**.

Si une info change (autre version, Gore-Tex…), corrige le texte de la voix
(`voiceover/script.json`) et les étiquettes (`src/content.ts` → `FEATURES`).

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

## Son : voix off, musique, bruitages

Il faut Python 3 avec `numpy` et `scipy` (`pip install numpy scipy piper-tts`).

1. **Voix off** : `npm run voice`. Elle est générée avec Piper, une synthèse vocale gratuite qui
   fonctionne sans connexion ; voix française d'homme `fr_FR-tom-medium`. Le modèle se télécharge
   une fois depuis huggingface.co. Les pistes arrivent dans `public/audio/vo/`.
   Pour mettre **ta propre voix**, enregistre une piste par séquence et nomme-la comme son `id`
   (`intro.wav`, `reveal.wav`, `grip.wav`…) dans `public/audio/vo/`.
2. **Montage + musique + bruitages** : `npm run audio`. Recalcule les durées d'après la voix, puis
   recompose la musique et les bruitages pour qu'ils tombent pile sur les coupes.
   Tant qu'il n'y a pas de voix, la durée est estimée d'après la longueur du texte.
3. Volumes : `src/content.ts` → `VOLUME` (voix, musique, bruitages).

La musique et les bruitages sont fabriqués par le script (synthèse) : aucun son externe, aucun droit à payer.

## Exporter le MP4

```bash
npm run render
```

Le fichier sort dans `out/urbex-presentation-materiel-ep01.mp4`, avec un son normalisé à −14 LUFS,
le niveau standard des réseaux sociaux.
Si Remotion ne parvient pas à télécharger son navigateur, indique un Chrome local :
`REMOTION_BROWSER=/chemin/vers/chrome npm run render`.

Captures de contrôle : `npm run stills` (ou `node scripts/stills.mjs 120 300` pour des images précises).

## Modifier les textes, les images et la durée

- **Voix off et sous-titres** : `voiceover/script.json` (`say` = ce qui est prononcé,
  `caption` = sous-titre affiché). Ensuite : `npm run voice` puis `npm run audio`.
- **Textes à l'écran** : `src/content.ts` → `TEXTS`.
- **Caractéristiques** : `src/content.ts` → `FEATURES` (titre, données, étiquette, photo,
  cadrage de la caméra `camFrom` → `camTo` en pixels de l'image + zoom, point annoté `target`).
- **Durées** : automatiques. Pour allonger une séquence sans changer le texte, augmente son
  `min` (en images, 30 = 1 s) dans `voiceover/script.json`, puis `npm run audio`.
- **Images** : `src/content.ts` → `IMAGES`. Pour changer de photo, la mettre dans `public/assets/`
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

Aucune vidéo, musique ou image externe, aucune API payante.

---

# Intro Urbex-France.com (22 s, YouTube 16:9 — 1920×1080)

Composition **IntroUrbexFrance** (même projet). Vidéo : `out/intro-urbex-france.mp4`.

| Temps | Contenu |
|---|---|
| 0 → 3,6 s | Avertissement : lumière qui grésille, ruban de signalisation, « L'URBEX EST UNE PRATIQUE DANGEREUSE » |
| 3,6 → 8,4 s | 4 risques en coupes rapides : bâtiments instables, sols qui cèdent, propriétés privées, obscurité |
| 8,4 → 12 s | Le code de l'explorateur : jamais seul, jamais d'effraction, ne prends que des photos |
| 12 → 15,6 s | Noir total, une lampe torche cherche… et révèle le logo |
| 15,6 → 21,6 s | URBEX-FRANCE.COM, la communauté, ce qu'on trouve sur le site, « REJOINS LA COMMUNAUTÉ » |

- **Textes, images, rythme** : `src/intro-urbex/content.ts`.
- **Logo officiel** : déposer le fichier dans `public/assets/brand/source/logo-urbex-fr.png`, puis
  `npm run assets:intro` (retire le fond blanc autour du badge rond).
- **Son** (musique + bruitages synthétisés) : `npm run audio:intro` → `public/audio/intro-urbex.wav`.
  Si tu changes le nombre de risques ou de règles, mets les mêmes nombres en haut de `scripts/intro_audio.py`.
- **Export** : `npm run render:intro`.
- **Fond** : un seul décor « lieu abandonné » (mur de béton sali, fissures, coulures), généré par
  `python3 scripts/make_wall.py` → `public/assets/urbex/wall.jpg`. Aucune photo externe.
  Le mur est éclairé par une lampe torche animée, avec de la poussière en suspension.

---

# Outro / écran de fin YouTube (15 s, 1920×1080)

Composition **OutroUrbexFrance**. Vidéo : `out/outro-urbex-france.mp4`.

- « MERCI D'AVOIR REGARDÉ », **ABONNE-TOI**, ton logo entouré d'un cercle orange qui tourne.
- Un curseur clique sur **S'ABONNER**, qui devient **ABONNÉ ✓**, la cloche sonne, puis
  « ACTIVE LA CLOCHE POUR NE RIEN RATER ».
- À droite, deux cadres **VIDÉO SUIVANTE** / **À VOIR AUSSI**, et en bas URBEX-FRANCE.COM.

**Dans YouTube Studio** (Éditer la vidéo → Écran de fin) : pose l'élément *S'abonner* sur le logo
et deux éléments *Vidéo* sur les cadres de droite, sur les 15 dernières secondes.

- **Textes** : en haut de `src/outro-urbex/OutroUrbex.tsx` (`OUTRO`).
- **Son** : `npm run audio:outro` · **Export** : `npm run render:outro`.
