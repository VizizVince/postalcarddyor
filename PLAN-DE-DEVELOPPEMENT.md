# PLAN DE DÉVELOPPEMENT — MANDRAGORA "Jugo De Diamantes"

> **Ce document est le plan d'exécution pour Claude Code.**
> Suivre les étapes dans l'ordre. Ne jamais sauter une étape. Chaque étape a un **checkpoint de validation** — ne passer à la suivante que si le checkpoint est OK.
> En cas de doute, se référer au fichier `MANDRAGORA-JugoDeDiamantes-site.md` qui contient la spec complète.

---

## Règles générales

1. **Lire la spec complète** (`MANDRAGORA-JugoDeDiamantes-site.md`) AVANT de commencer à coder
2. **Un fichier à la fois** — ne jamais travailler sur plusieurs fichiers en parallèle
3. **Tester dans le navigateur** après chaque étape avant de passer à la suivante
4. **Commenter le code** en français, de manière claire et utile
5. **Respecter l'architecture de fichiers** définie dans la spec — ne pas inventer de nouveaux fichiers
6. **Utiliser les CDN** pour GSAP, ScrollTrigger, Lenis et Google Fonts — pas d'installation npm
7. **Vanilla JS uniquement** — pas de framework, pas de bundler, pas de TypeScript
8. **Le `config.js` est la source de vérité** — aucune valeur en dur dans le HTML ou les autres fichiers JS/CSS. Toute valeur affichée ou utilisée doit venir de `CONFIG`
9. **Mobile-first** — écrire le CSS en mobile-first, puis ajouter les media queries pour tablette et desktop

---

## Phase 0 — Fondations (faire en premier, ne rien coder d'autre avant)

### Étape 0.1 — Structure des fichiers

Créer l'arborescence complète :

```
/
├── index.html
├── config.js
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── form.js
│   ├── audio.js
│   └── i18n.js
├── assets/
│   ├── audio/
│   │   └── (vide pour l'instant)
│   ├── images/
│   │   └── (vide pour l'instant)
│   └── fonts/
│       └── (vide pour l'instant)
└── README.md (vide pour l'instant)
```

**Checkpoint** : L'arborescence existe avec tous les fichiers vides.

### Étape 0.2 — `config.js` complet

Copier intégralement le contenu de `CONFIG` défini dans la spec. Ce fichier doit être **terminé et complet** avant de coder quoi que ce soit d'autre. Tous les commentaires en français doivent être présents.

**Checkpoint** : Ouvrir `config.js` dans un navigateur console → `CONFIG` est accessible, `CONFIG.artistName` retourne `"MANDRAGORA"`, `CONFIG.textES.introLine` retourne le bon texte, `CONFIG.colors.background` retourne `"#0A0A0A"`.

### Étape 0.3 — `index.html` squelette

Créer le HTML avec :
- `<!DOCTYPE html>`, lang `es`
- `<meta charset>`, `<meta viewport>`
- `<title>` : `MANDRAGORA — Jugo De Diamantes`
- Liens CDN : Google Fonts (Playfair Display, Space Mono, Caveat), GSAP, ScrollTrigger, Lenis
- Lien vers `config.js` (AVANT les autres scripts)
- Liens vers `css/style.css` et les 4 fichiers JS (`i18n.js`, `audio.js`, `form.js`, `app.js` — dans cet ordre)
- Structure HTML minimale :
  ```html
  <body>
    <!-- Toggle langue (fixe, haut gauche) -->
    <button id="lang-toggle"></button>

    <!-- Toggle audio (fixe, haut droite) -->
    <button id="audio-toggle"></button>

    <!-- Conteneur scroll (très haut pour piloter le scroll) -->
    <div id="scroll-container">

      <!-- Viewport sticky (tout le contenu visible) -->
      <div id="viewport">

        <!-- Phase 1 : Intro -->
        <section id="phase-intro"></section>

        <!-- Phase 2 : Voyage carte topo -->
        <section id="phase-journey">
          <canvas id="topo-canvas"></canvas>
          <div id="letter"></div>
          <div id="journey-texts"></div>
        </section>

        <!-- Phase 3 : Arrivée -->
        <section id="phase-arrival"></section>

        <!-- Phase 4 : Formulaire carte postale -->
        <section id="phase-form">
          <div id="postcard"></div>
        </section>

        <!-- Phase 5 : Confirmation -->
        <section id="phase-confirmation"></section>

      </div>
    </div>
  </body>
  ```

**Ne pas styler encore.** Juste la structure.

**Checkpoint** : Ouvrir `index.html` dans le navigateur → pas d'erreur console, `CONFIG` est accessible, les CDN se chargent (vérifier dans l'onglet Network), GSAP / ScrollTrigger / Lenis sont disponibles dans la console (`gsap`, `ScrollTrigger`, `Lenis`).

### Étape 0.4 — `css/style.css` base

Mettre en place **uniquement** :
- Reset CSS minimal (`*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }`)
- Variables CSS extraites de `CONFIG` (les dupliquer en `:root` car CSS ne peut pas lire JS — les maintenir synchronisées) :
  ```css
  :root {
    --bg: #0A0A0A;
    --text: #E8E4DE;
    --accent: #8B1A1A;
    --letter: #FFFFFF;
    --topo: #2A2A2A;
    --topo-light: #3A3A3A;
    --font-display: 'Playfair Display', serif;
    --font-mono: 'Space Mono', monospace;
    --font-hand: 'Caveat', cursive;
  }
  ```
- `html, body` : fond `var(--bg)`, couleur `var(--text)`, overflow-x hidden, font-family `var(--font-mono)`
- `#scroll-container` : `height: 500vh` (le "rail" de scroll)
- `#viewport` : `position: sticky; top: 0; height: 100vh; width: 100vw; overflow: hidden;`
- Toutes les `section` à l'intérieur : `position: absolute; inset: 0;` (empilées, visibilité contrôlée par JS)
- Grain filmique overlay : `#viewport::after` avec un pseudo-élément couvrant tout, `pointer-events: none`, `z-index: 9999`, bruit animé (utiliser un SVG `<filter>` en inline dans le HTML ou une image de grain en boucle)
- Curseur custom sur `body` (desktop only, media query `hover: hover`)
- Style des toggles langue et audio : `position: fixed`, `z-index: 10000`, typo mono, petit, opacité faible

**Checkpoint** : Ouvrir le site → fond noir, texte blanc cassé, grain filmique visible et subtil, curseur custom visible (desktop), les deux toggles visibles en haut (même s'ils ne font rien encore), le scroll est possible sur toute la hauteur (500vh) mais le viewport reste sticky.

### Étape 0.5 — `js/i18n.js`

Implémenter le système de traduction :
- Variable `currentLang` initialisée depuis `localStorage.getItem('lang') || 'es'`
- Fonction `t(key)` qui retourne `CONFIG['text' + currentLang.toUpperCase()][key]`
- Fonction `tField(fieldId, prop)` pour les labels de formulaire : cherche dans `CONFIG.formFields` le champ avec l'id correspondant et retourne `labelES` ou `labelEN` selon la langue
- Fonction `switchLang()` qui toggle entre 'es' et 'en', sauvegarde dans `localStorage`, et appelle `updateAllTexts()`
- Fonction `updateAllTexts()` qui met à jour tous les éléments du DOM ayant un attribut `data-i18n="key"` avec le texte correspondant
- Brancher le clic du `#lang-toggle` sur `switchLang()`
- Mettre à jour le texte du toggle lui-même (`CONFIG.textES.langToggle` quand on est en ES, etc.)

**Checkpoint** : Ouvrir le site → le toggle affiche "EN" (car on est en espagnol par défaut). Cliquer → il affiche "ES". Recharger la page → la langue est mémorisée. Vérifier dans la console : `t('introLine')` retourne le bon texte dans la bonne langue.

### Étape 0.6 — `js/audio.js`

Implémenter le système audio :
- Créer un `Audio()` object pointant vers `assets/audio/ambient.mp3`
- `loop = true`, `volume = 0` au départ
- Variable `audioActive = false`
- Fonction `toggleAudio()` :
  - Si off → play + fade in (volume 0 → 0.5 sur 2s via `requestAnimationFrame` ou `setInterval`)
  - Si on → fade out (volume → 0 sur 2s) puis `pause()`
  - Mettre à jour le texte du toggle via `t('audioOn')` / `t('audioOff')`
- Brancher le clic de `#audio-toggle`
- Gérer l'erreur si le fichier audio n'existe pas (try/catch, pas d'erreur bloquante)
- Exporter une fonction `setAudioIntensity(value)` (0 → 1) pour permettre à `app.js` de moduler le volume selon le scroll (bonus)

**Checkpoint** : Ouvrir le site → le toggle affiche "AUDIO OFF". Cliquer → pas d'erreur console (même si le fichier mp3 n'existe pas encore). Si on place un vrai mp3 dans le dossier, le son se lance avec fade in et se coupe avec fade out.

---

## Phase 1 — Écran d'intro (scroll 0% → 5%)

### Étape 1.1 — Animation texte lettre par lettre

Dans `app.js` :
- Initialiser Lenis pour le smooth scroll
- Initialiser GSAP ScrollTrigger avec le `#scroll-container` comme déclencheur
- Créer une timeline GSAP liée au scroll progress (0 → 1)
- **Phase intro** (progress 0 → 0.05) :
  - Au chargement : `#phase-intro` est visible, les autres sections sont `opacity: 0` / `visibility: hidden`
  - Le texte `CONFIG.textES.introLine` (ou EN selon la langue) s'affiche lettre par lettre
  - Implémenter le typewriter : créer les `<span>` pour chaque caractère, les rendre visibles un par un avec un `stagger` GSAP de 60ms
  - Curseur clignotant à la fin (pseudo-élément `|` qui pulse en opacité)
  - À scroll progress ~0.04 : le texte fade out (opacity → 0, durée 1s en scroll-distance)

**Checkpoint** : Ouvrir le site → écran noir, après 1.5s le texte apparaît lettre par lettre. Scroller lentement → le texte disparaît. La section intro est invisible après 5% de scroll. Changer la langue → le texte change.

### Étape 1.2 — Transition vers Phase 2

- À progress 0.04-0.05 : `#phase-intro` fade out, `#phase-journey` fade in
- La transition doit être fluide (crossfade de 1% de scroll)

**Checkpoint** : Scroller → on passe proprement de l'intro au canvas de la carte. Pas de flash blanc, pas de saut.

---

## Phase 2 — Le voyage (scroll 5% → 65%)

> **C'est l'étape la plus complexe. La découper en sous-étapes et tester chacune individuellement.**

### Étape 2.1 — Canvas de la carte topographique (statique d'abord)

Dans `app.js` (ou une fonction dédiée) :
- Le `<canvas id="topo-canvas">` occupe tout le viewport
- Dessiner la carte topographique en Canvas 2D :
  - Fond : `CONFIG.colors.background`
  - Lignes de contour : des courbes de Bézier concentriques, espacées de ~15-25px, en couleur `CONFIG.colors.topoLines`
  - L'épaisseur des lignes : 0.5px à 1px max
  - Générer **procéduralement** les courbes : utiliser du bruit (simplex noise simplifié ou des fonctions sin/cos combinées) pour créer des formes organiques qui ressemblent à du relief topographique
  - La carte doit être **plus haute que le viewport** (ex: 5x la hauteur du viewport) car elle va défiler

**Important** : dessiner la carte une seule fois dans un **offscreen canvas** (buffer), puis la blitter sur le canvas visible avec un offset Y qui change selon le scroll. Ne PAS redessiner les courbes à chaque frame.

**Checkpoint** : Ouvrir le site, scroller jusqu'à ~10% → on voit des lignes topographiques organiques sur fond noir. Ça ressemble à une carte de relief stylisée. Les lignes sont fines, subtiles, en gris foncé.

### Étape 2.2 — Défilement de la carte au scroll

- Le scroll progress (0.05 → 0.65) pilote l'offset Y du canvas
- La carte défile de haut en bas (on "survole" le territoire)
- Utiliser `ScrollTrigger` pour mapper le progress à l'offset Y de manière fluide

**Checkpoint** : Scroller entre 5% et 65% → la carte défile verticalement, de manière fluide. La vitesse est constante et confortable.

### Étape 2.3 — Les 5 zones visuelles

Modifier la génération de la carte pour que le rendu change selon la position verticale :
1. **Zone 1 — Désert** (haut de la carte) : lignes très espacées (~40px), peu de courbes, beaucoup de vide noir
2. **Zone 2 — Sierra** : lignes serrées (~8-12px), denses, beaucoup de courbes concentriques (montagnes)
3. **Zone 3 — Ville** : les courbes organiques sont remplacées par une **grille géométrique** : lignes droites horizontales et verticales, formant des blocs urbains. Toujours en gris foncé
4. **Zone 4 — Frontière** : une ligne horizontale rouge (`CONFIG.colors.accent`), épaisseur 2px, qui pulse en opacité (animation CSS ou dans le draw loop). Au-dessus et en dessous : peu de lignes
5. **Zone 5 — Océan** : lignes ondulantes horizontales (sinusoïdes), de plus en plus espacées vers le bas, jusqu'au vide total

Les transitions entre zones doivent être **progressives**, pas des coupures nettes.

**Checkpoint** : Scroller lentement de 5% à 65% → on traverse visuellement les 5 zones. Le changement est progressif et lisible. La ligne rouge de la frontière est le seul élément de couleur et elle pulse.

### Étape 2.4 — La lettre (élément DOM)

- `#letter` est un `<div>` positionné en `absolute`, **centré** dans le viewport (CSS `top: 50%; left: 50%; transform: translate(-50%, -50%)`)
- Dimensions : ~80x50px (desktop), ~60x40px (mobile)
- Style : fond blanc (`CONFIG.colors.letterColor`), bordure fine, léger `box-shadow` blanc (glow)
- Un petit cercle rouge (cachet) dans le coin bas-droit : `::after` pseudo-élément, 8px, `CONFIG.colors.accent`
- Animation de pulsation permanente : `@keyframes pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.02); } }` — durée 2s, boucle infinie
- `z-index` au-dessus du canvas

**Checkpoint** : La lettre est visible, centrée, blanche, avec un petit cachet rouge. Elle pulse doucement. Elle reste au centre quand on scrolle (la carte bouge dessous, pas elle).

### Étape 2.5 — Évolution de la lettre au scroll

Via GSAP ScrollTrigger, entre progress 0.05 et 0.65 :
- **À ~30% du scroll** : un petit rectangle gris apparaît sur la lettre (tampon supplémentaire) → ajouter un `::before` qui passe de `opacity: 0` à `opacity: 1`
- **De 5% à 65%** : légère rotation progressive (0deg → 1deg → -0.5deg → 0.3deg) pour simuler le mouvement
- **À ~50%** : un coin se corne → via `clip-path` ou un petit triangle sombre dans un coin

Ces évolutions doivent être subtiles — si on ne fait pas attention on ne les remarque pas, mais elles contribuent au réalisme.

**Checkpoint** : Scroller lentement → la lettre change subtilement. Le tampon apparaît, la rotation varie, le coin se corne. C'est subtil mais visible si on regarde.

### Étape 2.6 — Les textes narratifs

- 3 éléments `<div>` dans `#journey-texts`, positionnés en absolu
- Chaque texte est alimenté par `CONFIG.textES.journeyTexts[i]` (ou EN)
- Typo mono, petite taille (14px desktop, 12px mobile), couleur `var(--text)`, opacité max 0.6
- Attribut `data-i18n-array="journeyTexts"` + `data-i18n-index="0|1|2"` pour le système bilingue
- Positionnés à des endroits variés sur l'écran (pas tous centrés — un à gauche, un à droite, un centré)
- **Animation d'apparition** : `clip-path: inset(0 100% 0 0)` → `clip-path: inset(0 0% 0 0)` (révélation horizontale, comme tapé à la machine)
- **Timing** piloté par le scroll :
  - Texte 1 : apparaît à progress 0.10, disparaît à 0.25
  - Texte 2 : apparaît à progress 0.28, disparaît à 0.43
  - Texte 3 : apparaît à progress 0.46, disparaît à 0.60
- Disparition : simple `opacity` → 0

**Checkpoint** : Scroller → les 3 textes apparaissent et disparaissent aux bons moments. Ils se révèlent horizontalement. Changer de langue → les textes changent.

### Étape 2.7 — Les points lumineux (relais)

- 5 à 7 petits `<div>` (cercles 2px, blanc, opacité 0.3) positionnés le long du parcours vertical
- Quand le scroll progress atteint la position d'un point :
  - Le cercle s'expand : `scale` 1 → 10 en 300ms
  - Simultanément : `opacity` 0.3 → 1 → 0 en 300ms
  - L'animation ne se joue qu'**une seule fois** (pas à chaque passage)
- Répartis entre progress 0.08 et 0.62, à intervalles irréguliers

**Checkpoint** : Scroller → les points flashent un par un quand on passe dessus. L'effet est bref et net, comme un signal morse. Revenir en arrière ne les refait pas flasher.

---

## Phase 3 — L'arrivée (scroll 65% → 80%)

### Étape 3.1 — Transition carte → table

Entre progress 0.65 et 0.80 :
- La carte topographique **blur progressivement** (`filter: blur()` de 0 → 10px) et son opacité diminue (1 → 0)
- Simultanément, un fond de "table" apparaît sous le canvas :
  - Un `<div>` plein écran, fond `#111111`, avec un très léger bruit/grain de texture (CSS `background-image` avec un pattern subtil)
  - Ce div passe de `opacity: 0` à `opacity: 1` entre progress 0.65 et 0.75
- La lettre **grossit** progressivement : de ~80x50px à ~300x200px (desktop) via GSAP scale
- La perspective change : le viewport acquiert `perspective: 1000px` et la lettre reçoit `rotateX(15deg)` progressivement — elle passe de "vue du dessus" à "posée sur une table vue en angle"
- Les textes narratifs et les points lumineux doivent avoir disparu à ce stade

**Checkpoint** : Scroller de 65% à 80% → la carte se floute et disparaît, la table apparaît, la lettre grossit et se pose en perspective. La transition est fluide, pas de saut ni de flash.

### Étape 3.2 — Texte d'arrivée

- À progress ~0.78, un texte apparaît AU-DESSUS de la lettre :
  - Contenu : `t('arrivalLine')`
  - Typo display (Playfair Display), taille moyenne (~24px desktop, ~18px mobile)
  - Animation : fade in (1.5s en scroll-distance)
  - Positionné en haut du viewport, centré horizontalement

**Checkpoint** : À ~78% de scroll, le texte d'arrivée apparaît au-dessus de la lettre posée. Le texte change avec la langue.

---

## Phase 4 — Le formulaire carte postale (scroll 80% → 95%)

### Étape 4.1 — Animation de dépliage de la lettre

Entre progress 0.80 et 0.85 :
- La lettre effectue un **flip 3D** (`rotateY(180deg)`) sur 5% de scroll
- Utiliser un conteneur avec `transform-style: preserve-3d` et deux faces (`backface-visibility: hidden`) :
  - **Face avant** (recto de l'enveloppe) : le design de lettre actuel
  - **Face arrière** (verso = la carte postale) : le formulaire complet
- La face arrière est un `<div id="postcard">` contenant tout le formulaire
- Après le flip, le texte d'arrivée (Phase 3) disparaît
- La lettre/carte se stabilise en position finale (centrée, sans rotation parasite)

**Alternative si le flip 3D pose problème** : l'enveloppe s'ouvre par le haut (rabat qui se déplie avec `rotateX(-180deg)` depuis l'arête haute), puis la carte glisse vers le haut. Plus simple à implémenter, tout aussi élégant.

**Checkpoint** : Scroller à ~82% → la lettre se retourne (ou s'ouvre) et révèle la carte postale. L'animation est fluide, sans glitch de `backface-visibility` ou de z-fighting.

### Étape 4.2 — Design de la carte postale (CSS pur)

Le `#postcard` doit ressembler à une vraie carte postale :
- Dimensions : ~600x380px (desktop), plein écran (mobile)
- Fond : `#141414`
- Bordure fine : 1px `var(--text)` à opacité 0.2
- **Layout en 2 colonnes** (desktop) / 1 colonne (mobile) :

**Colonne gauche (~40%)** :
- Espace pour le visuel/artwork (un `<div>` placeholder avec bordure en pointillés)
- Texte en vertical : "JUGO DE DIAMANTES" en typo display, petit, opacité 0.3, `writing-mode: vertical-rl`
- "MANDRAGORA" en bas en mono, petit

**Colonne droite (~60%)** :
- Séparée par une ligne verticale fine (1px, opacité 0.15)
- En haut à droite : faux timbre (carré 50x50px avec bordure dentelée en CSS — utiliser un `background` avec `radial-gradient` répété pour simuler les dents — contenant "M" en typo display)
- Les champs de formulaire générés dynamiquement depuis `CONFIG.formFields`

**Checkpoint** : La carte postale est visible, ressemble à une vraie carte, avec les deux colonnes, le timbre, le placeholder visuel. Pas encore de fonctionnalité de formulaire.

### Étape 4.3 — Formulaire dynamique (`js/form.js`)

- Lire `CONFIG.formFields` et générer les `<input>` dynamiquement dans la colonne droite de la carte
- Pour chaque champ :
  - Un `<label>` avec le texte dans la bonne langue (`tField(field.id, 'label')`)
  - Un `<input>` avec :
    - `type="text"` (sauf email → `type="email"`)
    - `required` si `field.required === true`
    - `id` = `field.id`
    - `autocomplete` approprié (`name`, `street-address`, `address-level2`, `email`)
  - Style : pas de bordure, juste une `border-bottom` en pointillés (`1px dashed var(--text)` opacité 0.3)
  - Au focus : la bordure passe en `solid`, opacité 0.7
  - Le texte saisi : `font-family: var(--font-hand)`, taille 18px
  - Le label : `font-family: var(--font-mono)`, taille 11px, opacité 0.5, `text-transform: uppercase`
- Bouton submit :
  - Texte : `t('submitButton')`
  - Style : `border: 1px solid var(--text)`, fond transparent, padding 12px 32px, typo mono, uppercase, `letter-spacing: 2px`
  - Hover : bordure et texte → `var(--accent)`, `transform: scale(1.02)`, `transition: all 0.3s`
  - Active : `transform: scale(0.98)`
  - État loading : texte remplacé par `". . ."` animé (3 points qui clignotent en séquence)

**Checkpoint** : Les champs sont générés depuis le config, le style est correct (lignes pointillées, labels discrets, texte manuscrit), le bouton a les bons états hover/active. Changer de langue → les labels changent. Modifier `CONFIG.formFields` (ajouter/retirer un champ) → le formulaire se met à jour.

### Étape 4.4 — Envoi vers Google Sheets

Au submit du formulaire :
1. Empêcher le comportement par défaut (`preventDefault`)
2. Valider les champs required (ajouter une classe `.error` sur les champs vides — bordure rouge pendant 2s)
3. Passer le bouton en état loading
4. Générer le tracking : `"MX-2025-"` + `Math.floor(1000 + Math.random() * 9000)`
5. Construire l'objet de données depuis les champs
6. `fetch(CONFIG.googleSheetsEndpoint, { method: 'POST', body: JSON.stringify(data) })`
7. **Si l'endpoint n'est pas configuré** (contient "REMPLACER") : log les données en console, simuler un succès après 1s de délai
8. Si succès : déclencher la Phase 5
9. Si erreur : afficher un message d'erreur sous le bouton ("Error. Intenta de nuevo." / "Error. Try again."), remettre le bouton en état normal après 3s

**Checkpoint** : Remplir le formulaire → clic ENVIAR → les données apparaissent dans la console (endpoint pas encore configuré) → la Phase 5 se déclenche. Tester avec un champ vide → le champ passe en rouge, l'envoi est bloqué.

### Étape 4.5 — Libération du scroll pour le formulaire (mobile)

Sur mobile (< 768px), quand le scroll atteint la Phase 4 (progress >= 0.80) :
- **Désactiver le scroll-pilotage** des animations (le scroll ne pilote plus GSAP)
- Permettre le **scroll classique** pour naviguer dans le formulaire (qui peut dépasser la hauteur du viewport sur petit écran)
- Un indicateur visuel discret (petite flèche ↓ ou texte "scroll" qui pulse) peut signaler que le formulaire est scrollable

Quand le formulaire est soumis, le scroll reprend son comportement piloté pour la Phase 5.

**Checkpoint** : Sur mobile → scroller jusqu'au formulaire → le formulaire est scrollable normalement, tous les champs sont accessibles, le clavier virtuel ne casse pas le layout.

---

## Phase 5 — Confirmation (après soumission)

### Étape 5.1 — Animation de confirmation

Séquence d'animations après un envoi réussi :
1. Le bouton : texte → SVG check animé (`✓` dessiné en line-draw, 500ms)
2. Délai de 800ms
3. La carte postale se replie (animation inverse du dépliage — flip `rotateY(0deg)` ou fermeture de l'enveloppe)
4. La lettre rapetisse et s'envole : `scale` 1 → 0.1, `opacity` 1 → 0, `translateY` 0 → -300px, durée 1.5s, easing `power2.in`
5. La table (fond) fade out vers le noir pur
6. Écran noir total

**Checkpoint** : Soumettre le formulaire → la carte se replie, la lettre s'envole, l'écran redevient noir. L'animation est fluide, ~4s au total.

### Étape 5.2 — Textes et boutons post-soumission

Après l'animation (délai 500ms) :
1. Texte principal : `t('confirmationLine')` en typo display, grande taille, centré, fade in 1.5s
2. Sous le texte : `t('trackingPrefix')` + numéro de tracking généré, en mono, petit, opacité 0.5, fade in avec 500ms de délai
3. Après 1s supplémentaire, les boutons apparaissent (fade in + léger translateY de 20px → 0) :
   - **Bouton PRE-SAVE** : `<a>` vers `CONFIG.presaveLink`, `target="_blank"`, même style que le bouton ENVIAR
   - **Bouton PARTAGER** : au clic → `navigator.share({ title: CONFIG.artistName, text: shareMessage, url: CONFIG.share.siteUrl })` si disponible, sinon `navigator.clipboard.writeText(CONFIG.share.siteUrl)` + afficher "Enlace copiado ✓" / "Link copied ✓" pendant 2s
4. En bas : les icônes réseaux sociaux (uniquement ceux configurés avec une URL non-vide dans `CONFIG.social`), petites, opacité 0.4, hover opacité 1

**Checkpoint** : Après soumission → on voit le texte de confirmation, le tracking, les boutons PRE-SAVE et PARTAGER, et les icônes réseaux sociaux. PRE-SAVE ouvre un nouvel onglet. PARTAGER copie le lien (ou ouvre le menu natif sur mobile). Seuls les réseaux configurés sont affichés.

---

## Phase 6 — Polissage et finitions

### Étape 6.1 — Grain filmique

Vérifier que le grain :
- Est visible sur TOUTES les phases
- Est subtil (opacité 0.03-0.05)
- Ne bloque pas les interactions (`pointer-events: none`)
- Est animé (pas statique)
- Ne cause pas de problème de performance (utiliser `will-change: transform` ou un canvas dédié si nécessaire)

### Étape 6.2 — Curseur custom (desktop uniquement)

- SVG inline d'un réticule fin (crosshair) rouge
- Appliqué via `cursor: url(...) center center, crosshair` sur `body`
- Media query `@media (hover: hover)` pour ne l'appliquer que sur desktop
- Ne pas l'appliquer sur les inputs et boutons (garder le curseur text/pointer classique)

### Étape 6.3 — Responsive testing

Tester et ajuster pour :
- **iPhone SE** (375x667) — le plus petit viewport courant
- **iPhone 14 Pro** (393x852)
- **iPad** (768x1024)
- **Desktop** (1440x900)
- **Desktop large** (1920x1080)

Points d'attention :
- La lettre ne sort jamais de l'écran
- Les textes narratifs sont lisibles
- La carte postale est utilisable (tous les champs visibles et cliquables)
- Les toggles ne chevauchent pas le contenu
- Le grain ne mange pas la performance sur mobile

### Étape 6.4 — Gestion des erreurs et edge cases

- Que se passe-t-il si l'utilisateur scrolle très vite ? → Les animations doivent suivre le scroll, pas le temps (GSAP ScrollTrigger gère ça nativement)
- Que se passe-t-il si l'utilisateur remonte ? → Les phases précédentes réapparaissent normalement (sauf les points lumineux qui ne rejouent pas)
- Que se passe-t-il si le réseau est coupé lors du submit ? → Message d'erreur, bouton réactivé, données pas perdues (rester sur le formulaire)
- Que se passe-t-il si `config.js` a des valeurs manquantes ? → Fallbacks raisonnables, pas de crash

### Étape 6.5 — Performance

- Vérifier avec DevTools (Lighthouse / Performance) :
  - Pas de layout shift
  - Animations à 60fps (ou proche) sur desktop
  - Pas de memory leak (le canvas ne se redessine pas à chaque frame, juste un blit)
  - Le site charge en < 3s sur 3G simulé (hors audio)
- Utiliser `will-change` sur les éléments animés
- Utiliser `transform` et `opacity` uniquement pour les animations (pas `top`, `left`, `width`, `height`)
- `requestAnimationFrame` pour tout ce qui bouge

---

## Phase 7 — Documentation

### Étape 7.1 — `README.md`

Rédiger en français, pour des non-développeurs :

```markdown
# MANDRAGORA — Jugo De Diamantes — Site Carte Postale

## Comment modifier le site

### 1. Modifier les textes
Ouvrir le fichier `config.js` avec un éditeur de texte (TextEdit, Notepad, VS Code...).
Chercher la section `textES` (espagnol) et `textEN` (anglais).
Modifier les textes entre guillemets.
Sauvegarder. Rafraîchir le site.

### 2. Modifier les couleurs
Dans `config.js`, section `colors`.
Les couleurs sont au format hexadécimal (#RRGGBB).
⚠️ Penser à aussi mettre à jour les variables dans `css/style.css` (section `:root`).

### 3. Ajouter les liens réseaux sociaux
Dans `config.js`, section `social`.
Remplacer les "" par les URLs. Laisser "" pour masquer un réseau.

### 4. Configurer Google Sheets
[Instructions détaillées pas à pas]

### 5. Remplacer l'audio
Placer votre fichier .mp3 dans `assets/audio/` et le renommer `ambient.mp3`.

### 6. Ajouter vos images
Placer les fichiers dans `assets/images/`.
[Instructions pour référencer les images dans le code]

### 7. Mettre en ligne
Option la plus simple : aller sur https://app.netlify.com/drop
Glisser-déposer le dossier entier du site. C'est en ligne.
```

### Étape 7.2 — Commentaires dans le code

Vérifier que chaque fichier JS contient :
- Un commentaire d'en-tête expliquant le rôle du fichier
- Des commentaires en français sur chaque fonction/section importante
- Les valeurs magiques sont expliquées (ex: `// 0.65 = 65% du scroll = fin du voyage`)

---

## Résumé de l'ordre d'exécution

| # | Étape | Dépend de | Criticité |
|---|-------|-----------|-----------|
| 0.1 | Structure fichiers | — | 🔴 Bloquant |
| 0.2 | config.js | 0.1 | 🔴 Bloquant |
| 0.3 | HTML squelette | 0.2 | 🔴 Bloquant |
| 0.4 | CSS base + grain | 0.3 | 🔴 Bloquant |
| 0.5 | i18n.js | 0.3 | 🔴 Bloquant |
| 0.6 | audio.js | 0.3 | 🟡 Important |
| 1.1 | Intro typewriter | 0.4, 0.5 | 🔴 Bloquant |
| 1.2 | Transition intro→voyage | 1.1 | 🔴 Bloquant |
| 2.1 | Canvas topo (statique) | 1.2 | 🔴 Bloquant |
| 2.2 | Défilement carte | 2.1 | 🔴 Bloquant |
| 2.3 | 5 zones visuelles | 2.2 | 🟡 Important |
| 2.4 | Lettre DOM | 2.2 | 🔴 Bloquant |
| 2.5 | Évolution lettre | 2.4 | 🟢 Bonus |
| 2.6 | Textes narratifs | 2.2, 0.5 | 🟡 Important |
| 2.7 | Points lumineux | 2.2 | 🟢 Bonus |
| 3.1 | Transition carte→table | 2.2, 2.4 | 🔴 Bloquant |
| 3.2 | Texte arrivée | 3.1 | 🟡 Important |
| 4.1 | Flip lettre→carte | 3.1 | 🔴 Bloquant |
| 4.2 | Design carte postale | 4.1 | 🔴 Bloquant |
| 4.3 | Formulaire dynamique | 4.2, 0.5 | 🔴 Bloquant |
| 4.4 | Envoi Google Sheets | 4.3 | 🔴 Bloquant |
| 4.5 | Scroll mobile formulaire | 4.3 | 🟡 Important |
| 5.1 | Animation confirmation | 4.4 | 🔴 Bloquant |
| 5.2 | Textes + boutons post | 5.1 | 🔴 Bloquant |
| 6.1 | Grain filmique | 0.4 | 🟢 Bonus |
| 6.2 | Curseur custom | 0.4 | 🟢 Bonus |
| 6.3 | Responsive testing | tout | 🔴 Bloquant |
| 6.4 | Edge cases | tout | 🟡 Important |
| 6.5 | Performance | tout | 🟡 Important |
| 7.1 | README.md | tout | 🔴 Bloquant |
| 7.2 | Commentaires code | tout | 🟡 Important |

---

## ⚠️ Pièges à éviter

1. **Ne PAS redessiner le canvas topographique à chaque frame de scroll** — le pré-rendre dans un buffer et ne changer que l'offset. Sinon = 5fps sur mobile.
2. **Ne PAS utiliser `position: fixed` pour le viewport** — utiliser `position: sticky` dans le flow du document. `fixed` casse le scroll natif sur iOS.
3. **Ne PAS oublier `backface-visibility: hidden`** sur les deux faces du flip 3D. Sinon on voit le formulaire à l'envers pendant tout le voyage.
4. **Ne PAS hardcoder des textes** dans le HTML ou JS. Tout vient de `config.js`. Même "ENVIAR" vient du config.
5. **Ne PAS oublier le fallback audio** — si le fichier n'existe pas, `try/catch` + silence. Ne pas casser le site.
6. **Ne PAS utiliser `scroll` event directement** — tout passe par GSAP ScrollTrigger qui est optimisé. L'event `scroll` natif = problèmes de performance.
7. **Ne PAS mettre les variables CSS et les valeurs `config.js` en doublon sans commentaire** — dans `style.css`, mettre un commentaire `/* Synchroniser avec config.js → CONFIG.colors */` au-dessus de chaque variable.
8. **Ne PAS oublier `touch-action: manipulation`** sur les éléments interactifs pour éviter le délai 300ms sur mobile.
9. **Ne PAS oublier `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`** pour empêcher le zoom involontaire sur le formulaire mobile.
10. **Ne PAS rendre le site dépendant du réseau** pour fonctionner. Les Google Fonts doivent avoir des fallbacks, le CDN GSAP doit avoir un fallback ou au minimum ne pas casser le site si indisponible.
