# MANDRAGORA — "Jugo De Diamantes" — Site Interactif Carte Postale

## 🎯 Résumé du projet

Site one-page immersif pour la sortie du morceau **"Jugo De Diamantes"** de **MANDRAGORA** (artiste mexicain, musique électronique / trance / techno). Le titre est un hommage au **Corrido**, genre musical mexicain né au XIXe siècle — des ballades épiques qui servaient de système de messagerie oral à travers le Mexique, portant les nouvelles de village en village avant l'existence des journaux. Le corrido est aujourd'hui associé à la narcoculture et au trafic.

**Objectif unique du site** : les fans remplissent un formulaire pour recevoir une vraie carte postale physique de l'artiste. Le site ne contient PAS d'infos sur la release, PAS de bio, PAS de player — uniquement le module interactif d'envoi de carte postale, avec un scroll narratif immersif.

---

## 🏗️ Architecture du projet

```
/
├── index.html
├── config.js              ← FICHIER DE CONFIGURATION (voir section "Modifiable")
├── css/
│   └── style.css
├── js/
│   ├── app.js             ← Logique principale, scroll, animations
│   ├── form.js            ← Gestion formulaire + envoi Google Sheets
│   ├── audio.js           ← Gestion audio ambient
│   └── i18n.js            ← Système de traduction ES/EN
├── assets/
│   ├── audio/
│   │   └── ambient.mp3    ← Fourni par le client (placeholder vide à créer)
│   ├── images/
│   │   └── (photos/artwork fournies par le client — placeholders à créer)
│   └── fonts/
│       └── (Google Fonts ou fichiers locaux)
└── README.md              ← Instructions pour modifier le site sans coder
```

---

## ⚙️ PRIORITÉ ABSOLUE : Facilité de modification

Le site doit être **modifiable par des personnes qui ne codent pas**. Toute donnée variable doit être centralisée dans un **unique fichier `config.js`** en haut du projet. Ce fichier doit être **abondamment commenté en français**.

### Contenu du fichier `config.js` :

```js
// ============================================
// CONFIGURATION DU SITE — MANDRAGORA
// Modifier les valeurs ci-dessous sans toucher au reste du code
// ============================================

const CONFIG = {

  // --- INFORMATIONS ARTISTE ---
  artistName: "MANDRAGORA",
  releaseTitle: "Jugo De Diamantes",

  // --- LIENS RÉSEAUX SOCIAUX ---
  // Remplacer les URLs. Mettre "" (vide) pour masquer un réseau.
  social: {
    instagram: "https://www.instagram.com/holasoyneto/?hl=fr",
    tiktok: "",       // Exemple : "https://www.tiktok.com/@mandragora"
    x: "",            // Exemple : "https://x.com/mandragora"
    youtube: "",      // Exemple : "https://youtube.com/@mandragora"
    spotify: "",      // Exemple : "https://open.spotify.com/artist/..."
    appleMusic: "",   // Exemple : "https://music.apple.com/artist/..."
    soundcloud: "",   // Exemple : "https://soundcloud.com/mandragora"
  },

  // --- LIEN PRE-SAVE ---
  // URL vers la page de pre-save / pre-order du morceau
  presaveLink: "https://REMPLACER-PAR-LE-LIEN-PRESAVE.com",

  // --- FORMULAIRE ---
  // URL du Google Apps Script pour recevoir les soumissions
  googleSheetsEndpoint: "https://script.google.com/macros/s/REMPLACER-PAR-VOTRE-ID/exec",

  // Champs du formulaire (ne pas modifier les "id", seulement les labels si besoin)
  formFields: [
    { id: "nombre",    labelES: "Nombre",          labelEN: "Name",           required: true },
    { id: "direccion", labelES: "Dirección",        labelEN: "Address",        required: true },
    { id: "ciudad",    labelES: "Ciudad, País",     labelEN: "City, Country",  required: true },
    { id: "email",     labelES: "Email",            labelEN: "Email",          required: true },
  ],

  // --- TEXTES DU SITE (ESPAGNOL) ---
  // Tous les textes affichés, facilement modifiables
  textES: {
    // Phase 1 — Écran d'amorce
    introLine: "Un mensaje fue enviado.",

    // Phase 2 — Textes qui apparaissent pendant le voyage sur la carte
    journeyTexts: [
      "Donde no llegaba el periódico, llegaba el corrido.",
      "Cada canción, una carta al pueblo.",
      "El mensaje no muere. Corre.",
    ],

    // Phase 3 — Arrivée de la lettre
    arrivalLine: "El mensaje llegó. Falta tu nombre.",

    // Phase 4 — Formulaire
    submitButton: "ENVIAR",

    // Phase 5 — Confirmation après envoi
    confirmationLine: "Tu carta corre.",
    trackingPrefix: "Tracking: ",

    // Post-soumission
    presaveButtonText: "PRE-SAVE",
    shareButtonText: "COMPARTIR",

    // Toggle audio
    audioOn: "AUDIO ON",
    audioOff: "AUDIO OFF",

    // Toggle langue
    langToggle: "EN",
  },

  // --- TEXTES DU SITE (ANGLAIS) ---
  textEN: {
    introLine: "A message was sent.",
    journeyTexts: [
      "Where the newspaper couldn't reach, the corrido arrived.",
      "Each song, a letter to the people.",
      "The message doesn't die. It runs.",
    ],
    arrivalLine: "The message arrived. It needs your name.",
    submitButton: "SEND",
    confirmationLine: "Your letter runs.",
    trackingPrefix: "Tracking: ",
    presaveButtonText: "PRE-SAVE",
    shareButtonText: "SHARE",
    audioOn: "AUDIO ON",
    audioOff: "AUDIO OFF",
    langToggle: "ES",
  },

  // --- COULEURS ---
  // Palette du site — modifier ici pour changer les couleurs globales
  colors: {
    background: "#0A0A0A",       // Noir profond
    textPrimary: "#E8E4DE",      // Blanc cassé
    accent: "#8B1A1A",           // Rouge sang (curseur, hover, accents)
    letterColor: "#FFFFFF",      // Couleur de la lettre sur la carte
    topoLines: "#2A2A2A",       // Lignes topographiques
    topoLinesLight: "#3A3A3A",  // Lignes topographiques zones claires
  },

  // --- TYPOGRAPHIES ---
  // Google Fonts utilisées (modifier les noms + mettre à jour le <link> dans index.html)
  fonts: {
    display: "'Playfair Display', serif",   // Titres, gros textes
    mono: "'Space Mono', monospace",         // Textes narratifs, formulaire
    handwriting: "'Caveat', cursive",        // Texte saisi par l'utilisateur dans le formulaire
  },

  // --- PARTAGE RÉSEAUX SOCIAUX (après soumission) ---
  share: {
    // Texte pré-rempli pour le partage
    messageES: "Mi carta corre 🏜️ Jugo De Diamantes — MANDRAGORA",
    messageEN: "My letter runs 🏜️ Jugo De Diamantes — MANDRAGORA",
    // URL du site à partager
    siteUrl: "https://REMPLACER-PAR-URL-DU-SITE.com",
  },
};
```

---

## 🎨 Direction artistique

### Mood
Sombre, cinématique, clandestin, élégant. Inspiré par l'esthétique narco-cinématographique : noir et blanc granuleux, fort contraste, vêtements sombres, voitures noires, fumée, capuches. Le mood board montre un artiste en Bulls #23 sortant d'une voiture, des portraits N&B avec lunettes noires, cuir, capuches — une esthétique street/sombre/mexicaine moderne.

### Palette
- **Fond** : Noir profond `#0A0A0A`
- **Texte** : Blanc cassé `#E8E4DE`
- **Accent** : Rouge sang `#8B1A1A` — utilisé UNIQUEMENT sur les interactions (hover, curseur custom, bouton envoi, points lumineux sur la carte). Le rouge n'existe qu'au toucher.

### Typographie
- **Display** : Playfair Display (serif condensée, autoritaire, style "wanted poster" modernisé) — pour le titre du morceau et textes héroïques
- **Mono** : Space Mono — pour les textes narratifs, le formulaire, les labels, le tracking number
- **Handwriting** : Caveat — pour le texte tapé par l'utilisateur dans les champs du formulaire (simule l'écriture manuscrite sur la carte postale)

### Effets visuels
- **Film grain** : Overlay permanent de bruit (noise) animé en CSS (`background-image` avec un petit SVG/PNG de grain, animé en boucle avec `@keyframes`). Subtil, pas envahissant — opacité ~0.03-0.05
- **Curseur custom** : Réticule fin rouge (petit SVG crosshair), remplace le curseur par défaut sur desktop
- **Pas d'emojis, pas de couleurs vives, pas de gradients flashy**

---

## 📜 Parcours utilisateur — 5 phases liées au scroll

Le scroll est le moteur narratif. Utiliser **GSAP ScrollTrigger** pour piloter toutes les animations en fonction du `scrollProgress` (0 → 1). Utiliser **Lenis** pour le smooth scroll.

Le viewport est verrouillé : le contenu réel est très long (ex: `height: 500vh`) mais l'écran visible reste fixe (`position: sticky`) — le scroll ne fait que piloter les animations, pas défiler du contenu classique.

### Phase 1 — "Intercepción" (scroll 0% → 5%)

**Écran noir total.**

- Overlay grain filmique animé
- Après 1.5s (ou dès que le scroll commence), un texte apparaît **lettre par lettre** en typo mono blanche :
  > *"Un mensaje fue enviado."* (ou équivalent EN selon la langue)
- Tempo : ~60ms par lettre, curseur clignotant à la fin
- Puis le texte s'efface (fade out 1s)
- Transition vers la Phase 2

### Phase 2 — "El Viaje" (scroll 5% → 65%)

**C'est le cœur du concept. Le scroll fait voyager une lettre à travers le Mexique vu du ciel, de nuit.**

#### La carte topographique
- Vue plongeante (top-down) d'un territoire stylisé
- PAS une carte réaliste — une **carte topographique abstraite** : des lignes de contour (courbes de niveau) blanches/grises très fines sur fond noir, comme un relevé GPS militaire
- Réalisée en **SVG** ou **Canvas 2D** : des courbes de Bézier concentriques qui représentent le relief
- La carte occupe tout le viewport et **défile verticalement** sous la lettre (parallaxe : la carte bouge, la lettre reste centrée)
- Le défilement de la carte est piloté par le scroll progress (5% → 65%)

#### Zones traversées (le paysage change progressivement)
Le territoire évolue visuellement selon le scroll progress :
1. **Désert** (scroll 5%-20%) : lignes topographiques espacées, très aérées, beaucoup de noir
2. **Sierra** (scroll 20%-35%) : lignes serrées, denses, altitude — le relief s'intensifie
3. **Zone urbaine** (scroll 35%-50%) : les courbes organiques laissent place à une grille géométrique (rues, blocs), lignes droites et angles
4. **Frontière** (scroll 50%-55%) : une ligne horizontale rouge épaisse qui pulse lentement (la seule couleur sur la carte)
5. **Océan/espace ouvert** (scroll 55%-65%) : lignes ondulantes, fluides, qui respirent — espacement progressif jusqu'au vide

#### La lettre
- Petit rectangle blanc lumineux centré à l'écran (~80x50px)
- Légère ombre portée (glow blanc très doux)
- Un cachet/sceau rouge discret dans un coin (petit cercle `#8B1A1A`)
- Elle pulse doucement (scale 1.0 → 1.02, boucle 2s)
- Au fil du scroll, elle **évolue subtilement** :
  - Un tampon supplémentaire apparaît (~scroll 30%)
  - Un léger pli/froissement (rotation de 0° → 1° → -0.5°)
  - Un coin légèrement corné (~scroll 50%)
- Elle reste TOUJOURS au centre de l'écran

#### Les textes narratifs
- 3 phrases (configurables dans `config.js`) apparaissent sur le territoire pendant le voyage
- Positionnées sur la carte comme des inscriptions au sol, en typo mono, petite taille, opacité 0.6
- Chaque phrase apparaît avec un `clip-path: inset()` animé (se "révèle" horizontalement, comme tapée à la machine)
- Chaque phrase reste visible ~15% du scroll puis s'efface (fade out)
- Espacement régulier : les 3 phrases se répartissent entre scroll 10% et 60%

#### Les points lumineux (relais)
- 5-7 petits cercles (`2px`) disposés le long du parcours
- Quand la lettre passe dessus (quand le scroll atteint leur position), un **flash blanc** se produit : le cercle s'expand de 2px → 20px en 300ms puis disparaît, comme un signal morse
- Accompagné d'un très léger changement dans l'audio (si activé)

### Phase 3 — "La Llegada" (scroll 65% → 80%)

**La lettre arrive. Transition de la vue satellite à la vue table.**

- La carte topographique **zoome progressivement** : les lignes s'espacent, grossissent, se flouttent
- Parallèlement, un fond sombre apparaît dessous — une texture de surface (bois sombre, béton, ou surface mate noire avec un très léger grain)
- La perspective **bascule** : de top-down (2D plat) vers une vue en légère perspective (CSS `perspective: 1000px` + `rotateX(15deg)`)
- La lettre grossit et se pose sur cette surface
- Les lignes topographiques disparaissent complètement à scroll ~78%

#### Texte d'arrivée
- À scroll ~78%, le texte apparaît au-dessus de la lettre, en typo display, taille moyenne :
  > *"El mensaje llegó. Falta tu nombre."*
- Apparition avec un fade-in lent (1.5s)

### Phase 4 — "Tu Carta" (scroll 80% → 95%)

**La lettre se déplie et devient le formulaire interactif.**

#### Animation de dépliage
- La lettre (qui est maintenant un élément DOM plus grand, ~400x260px) se **retourne** avec une animation CSS 3D :
  - `transform: rotateY(180deg)` sur 1.2s, easing `cubic-bezier(0.4, 0, 0.2, 1)`
  - Le recto (visible avant) montre l'enveloppe scellée
  - Le verso (révélé après le flip) montre la carte postale intérieure
- Alternativement, si le flip 3D est trop complexe : l'enveloppe s'ouvre par le haut (le rabat se déplie vers le haut avec `rotateX`), et la carte glisse vers le haut hors de l'enveloppe

#### La carte postale — formulaire
- Design de carte postale classique, fond légèrement plus clair que le noir (`#111111` ou `#141414`)
- **Côté gauche** (~40%) : espace pour un visuel (placeholder pour l'artwork ou une photo de l'artiste). En attendant les assets : un rectangle avec une bordure fine et le texte "JUGO DE DIAMANTES" en vertical + "MANDRAGORA" en petit
- **Côté droit** (~60%) : le formulaire
  - Séparé du côté gauche par une ligne verticale fine
  - En haut à droite : un petit "timbre" (carré avec bordure dentelée en CSS, contenant le logo ou les initiales "M")
  - Les champs sont des `<input>` stylisés comme des lignes de carte postale :
    - Pas de bordure classique, juste une **ligne horizontale en pointillés** en bas de chaque champ
    - Label au-dessus en typo mono, petite taille, opacité 0.5
    - Le texte tapé par l'utilisateur apparaît en **typo handwriting** (Caveat)
    - Quand un champ est focus : la ligne passe de pointillés à continue, et devient légèrement blanche
  - Les champs sont définis dans `config.js` — le formulaire se génère dynamiquement
- Le bouton "ENVIAR" est en bas à droite :
  - Bordure fine blanche, fond transparent, typo mono uppercase
  - Au hover : la bordure et le texte deviennent rouge `#8B1A1A`, léger scale(1.02)
  - Au clic : animation de pression (scale 0.98 → 1.0)
  - Pendant l'envoi : le texte est remplacé par "..." animé

#### Responsive (mobile)
- Sur mobile (< 768px), la carte postale passe en **plein écran portrait**
- Le côté gauche (visuel) passe au-dessus, le formulaire en dessous
- Les champs prennent toute la largeur
- Le scroll est libéré dans cette phase pour permettre le scroll classique du formulaire si nécessaire

### Phase 5 — "Tu carta corre" (après soumission)

**Confirmation + post-actions.**

#### Animation de confirmation
1. Le bouton change : "ENVIAR" → "✓" (check animé en SVG line-draw)
2. La carte postale se **replie** (animation inversée du dépliage)
3. La lettre se rescelle et **décolle** de la table : elle rapetisse et s'éloigne vers le haut (`scale` 1 → 0.1, `opacity` 1 → 0, `translateY` 0 → -200px) en 2s
4. Le fond redevient noir total

#### Texte de confirmation
- Apparaît en typo display, centré :
  > *"Tu carta corre."*
- En dessous, en mono, plus petit :
  > *"Tracking: MX-2025-XXXX"* (numéro généré aléatoirement, 4 chiffres)

#### Boutons post-soumission
Apparaissent sous le texte de confirmation, avec un délai de 1s :

1. **Bouton PRE-SAVE** :
   - Style identique au bouton ENVIAR
   - Lien vers `CONFIG.presaveLink` (ouvre dans un nouvel onglet)
   
2. **Bouton PARTAGER** :
   - Au clic, ouvre un menu natif de partage (`navigator.share()` si disponible) avec le texte configuré dans `config.js`
   - Fallback : copie le lien du site dans le presse-papier + affiche "Enlace copiado" / "Link copied"

---

## 🔊 Audio ambient

### Système
- Un fichier `assets/audio/ambient.mp3` est fourni par le client
- L'audio ne se lance PAS automatiquement (respect des politiques navigateur)
- Un toggle discret est affiché en haut à droite du site en permanence :
  - Texte "AUDIO OFF" par défaut, en typo mono, très petit, opacité 0.4
  - Au clic : lance l'audio en boucle (`loop: true`), le texte passe à "AUDIO ON", opacité 0.7
  - L'audio doit fader in (volume 0 → cible sur 2s) et fader out (2s) à l'activation/désactivation
- **Comportement lié au scroll** (optionnel, bonus) : le volume peut varier subtilement selon les zones traversées (plus bas dans l'océan, légèrement plus fort dans la zone urbaine) via le `scrollProgress`

### Placeholder
- En attendant le fichier du client, créer un fichier `ambient.mp3` vide ou très court (1s de silence) pour que le code fonctionne sans erreur

---

## 🌐 Système bilingue (ES/EN)

### Toggle de langue
- Un bouton en haut à gauche : affiche "EN" quand le site est en espagnol (clique pour passer en anglais), et "ES" quand le site est en anglais
- Typo mono, très petit, opacité 0.4, même style que le toggle audio
- Position fixe, toujours visible

### Implémentation
- Tous les textes viennent de `CONFIG.textES` ou `CONFIG.textEN`
- Le fichier `js/i18n.js` gère :
  - Le stockage de la langue active (`localStorage`)
  - Une fonction `t(key)` qui retourne le texte dans la langue active
  - Le re-render des textes au changement de langue (sans recharger la page)
- La langue par défaut est **espagnol**
- Les labels du formulaire sont aussi bilingues (définis dans `CONFIG.formFields` avec `labelES` et `labelEN`)

---

## 📬 Backend — Google Sheets via Apps Script

### Côté Google
Fournir dans le `README.md` les instructions complètes pour :

1. Créer un Google Sheet avec les colonnes : `Timestamp | Nombre | Dirección | Ciudad | Email | Tracking`
2. Ouvrir l'éditeur Apps Script (`Extensions > Apps Script`)
3. Coller le code Apps Script suivant :

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      data.nombre,
      data.direccion,
      data.ciudad,
      data.email,
      data.tracking
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Déployer en tant que "Application web" (accès : "Tout le monde")
5. Copier l'URL et la coller dans `config.js` → `googleSheetsEndpoint`

### Côté site (js/form.js)
- Au submit du formulaire :
  - Valider les champs required
  - Générer un numéro de tracking : `"MX-2025-"` + 4 chiffres aléatoires
  - Envoyer un `fetch POST` vers `CONFIG.googleSheetsEndpoint` avec les données JSON
  - En cas de succès : lancer l'animation Phase 5
  - En cas d'erreur : afficher un message discret "Error. Intenta de nuevo." sous le bouton
  - Pas de rechargement de page

---

## 📱 Responsive

### Desktop (> 1024px)
- Expérience complète avec scroll narratif
- Curseur custom (réticule rouge)
- Carte postale en mode paysage

### Tablette (768px - 1024px)
- Même parcours, dimensions adaptées
- Carte postale légèrement plus petite
- Pas de curseur custom

### Mobile (< 768px)
- Même parcours scroll, mais :
  - Les textes narratifs sont plus grands (lisibilité)
  - La lettre est plus grande proportionnellement
  - La carte postale passe en **portrait / plein écran**
  - Le formulaire occupe toute la largeur
  - Le toggle audio et langue restent visibles (zones de tap assez grandes, min 44x44px)
- Le scroll fonctionne au **touch** (Lenis gère le touch nativement)

---

## 🛠️ Stack technique

### Librairies externes (CDN)
- **GSAP + ScrollTrigger** : `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` + `ScrollTrigger.min.js`
- **Lenis** (smooth scroll) : `https://unpkg.com/lenis@1.1.18/dist/lenis.min.js`
- **Google Fonts** : Playfair Display, Space Mono, Caveat

### Pas de framework
- Vanilla HTML, CSS, JS
- Pas de React, Vue, ou autre
- Pas de build step, pas de bundler
- Le site doit fonctionner en ouvrant `index.html` directement (ou via un serveur statique simple)

### Performance
- Pas de WebGL, pas de Three.js — tout en SVG/Canvas 2D + CSS transforms
- Les animations lourdes (grain, parallaxe) utilisent `will-change` et `transform` pour rester sur le GPU
- Lazy-load des images si il y en a
- Total du site < 2MB (hors audio)

---

## 📄 README.md à inclure

Rédiger un `README.md` clair, en français, destiné à des non-développeurs, qui explique :

1. **Comment modifier les textes** : ouvrir `config.js`, changer les valeurs entre guillemets
2. **Comment changer les couleurs** : section `colors` dans `config.js`
3. **Comment ajouter les liens réseaux sociaux** : section `social` dans `config.js`
4. **Comment configurer le Google Sheet** : instructions pas à pas avec captures d'écran (ou descriptions détaillées)
5. **Comment remplacer l'audio** : remplacer le fichier `assets/audio/ambient.mp3`
6. **Comment ajouter les images** : déposer les fichiers dans `assets/images/` et mettre à jour les noms dans `config.js`
7. **Comment mettre le site en ligne** : glisser le dossier sur Netlify Drop (https://app.netlify.com/drop) ou un hébergement statique

---

## ✅ Checklist de livraison

- [ ] Le site s'ouvre sans erreur dans Chrome, Firefox, Safari (desktop + mobile)
- [ ] Le scroll pilote toutes les animations de la Phase 1 à la Phase 4
- [ ] La carte topographique SVG/Canvas défile correctement avec les 5 zones
- [ ] La lettre reste centrée et évolue visuellement pendant le voyage
- [ ] Les 3 textes narratifs apparaissent et disparaissent au bon moment
- [ ] Les points lumineux flashent quand la lettre passe dessus
- [ ] La transition carte → table (Phase 3) fonctionne fluidement
- [ ] La lettre se déplie / la carte postale apparaît (Phase 4)
- [ ] Le formulaire est fonctionnel, les champs se génèrent depuis `config.js`
- [ ] Le texte saisi apparaît en typo handwriting
- [ ] Le bouton ENVIAR envoie les données au Google Sheet (ou log en console si endpoint non configuré)
- [ ] L'animation de confirmation (Phase 5) se joue correctement
- [ ] Les boutons PRE-SAVE et PARTAGER fonctionnent
- [ ] Le toggle audio ON/OFF fonctionne avec fade in/out
- [ ] Le toggle ES/EN change tous les textes sans recharger la page
- [ ] Le site est responsive (mobile, tablette, desktop)
- [ ] Le grain filmique est visible mais subtil
- [ ] Le curseur custom (réticule rouge) fonctionne sur desktop
- [ ] Modifier une valeur dans `config.js` se reflète immédiatement sur le site
- [ ] Le `README.md` est rédigé en français, clair, pour des non-développeurs
- [ ] Le code est propre, commenté, et organisé dans les fichiers décrits
