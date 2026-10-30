# HUD Urbex — modèle de titre Fusion pour DaVinci Resolve

Fichier : `HUD Urbex.setting`, régénéré par `python3 scripts/make_fusion_hud.py`.

Le HUD se pose comme un **titre** sur ta timeline. Tous ses réglages sont dans l'**Inspector**
et s'animent avec des **images clés** (le petit losange à droite de chaque réglage).

## 1. Installer (une seule fois)

1. Ferme DaVinci Resolve.
2. Copie `HUD Urbex.setting` dans ce dossier (crée les dossiers s'ils n'existent pas) :
   - **Windows** : `%APPDATA%\Blackmagic Design\DaVinci Resolve\Support\Fusion\Templates\Edit\Titles\`
     (colle ce chemin dans la barre d'adresse de l'Explorateur de fichiers) ;
   - **Mac** : `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Templates/Edit/Titles/`.
3. Rouvre DaVinci Resolve.

## 2. L'ajouter à ta vidéo

1. Page **Edit** → panneau **Effects** → **Toolbox** → **Titles** → section **Fusion Titles** → **HUD Urbex**.
2. Glisse-le sur une piste **au-dessus** de ta vidéo (V2).
3. Étire le clip sur toute la durée voulue.

## 3. Le régler

Sélectionne le clip HUD → **Inspector** → onglet **Title** :

| Réglage | Effet |
|---|---|
| Peur (0-100) | Barre de peur. Au-dessus de 70 : rouge + bords de l'écran rouges |
| Stress (BPM) | Cœur qui bat à ce rythme + barre. Au-dessus de 120 : rouge |
| Batterie lampe (%) | Batterie. Sous 20 % : rouge et clignote |
| Lieu / Sous-titre du lieu | Textes en haut à gauche |
| Texte de l'alerte + case « Afficher l'alerte » | Bandeau rouge au centre |
| Heure de départ (heures, minutes) | L'heure défile ensuite toute seule |
| Images/seconde du projet | **Mets la cadence de ta timeline** (25, 30, 60…) pour que l'heure et le REC soient justes |
| Cases « Afficher … » | Masquer REC, heure, lieu, peur, stress, batterie, bords rouges |
| Taille globale / Position globale | Agrandir, réduire ou décaler tout le HUD |

### Animer une jauge (ex. sursaut de peur)

1. Place la tête de lecture **juste avant** le moment fort → clique le **losange** à côté de « Peur » (image clé à 20).
2. Avance d'une demi-seconde → mets **Peur à 90** (une 2ᵉ image clé se crée toute seule).
3. Avance de quelques secondes → redescends à 40.

Pareil pour Stress et Batterie. Pour l'alerte : image clé sur la case « Afficher l'alerte » (cochée puis décochée).

## Si quelque chose cloche

Ce modèle a été généré et vérifié automatiquement, mais **pas encore testé dans DaVinci**.
Dis-moi ce que tu vois (une capture d'écran aide beaucoup) :

- **texte trop gros ou trop petit** → « Taille globale », ou je corrige les tailles une par une ;
- **un élément mal placé** ou **qui ne bouge pas** (barre, cœur, heure) ;
- **message d'erreur** dans la console Fusion (page Fusion → *Workspace* → *Console*).

Polices utilisées : Bahnschrift, Consolas et Segoe UI Symbol (déjà présentes sous Windows).
