# MANDRAGORA — "Jugo De Diamantes" — Site Interactif Carte Postale

## Résumé du projet

Site one-page immersif pour la sortie du morceau **"Jugo De Diamantes"** de **MANDRAGORA** (artiste mexicain, musique électronique / trance / techno). Le titre est un hommage au **Corrido**, genre musical mexicain né au XIXe siècle — des ballades épiques qui servaient de système de messagerie oral à travers le Mexique, portant les nouvelles de village en village avant l'existence des journaux. Le corrido est aujourd'hui associé à la narcoculture et au trafic.

**Objectif unique du site** : les fans remplissent un formulaire pour recevoir une vraie carte postale physique de l'artiste. Le site ne contient PAS d'infos sur la release, PAS de bio, PAS de player — uniquement le module interactif d'envoi de carte postale, avec un scroll narratif immersif.

---

## Architecture du projet

```
/
├── index.html              ← HTML unique, structure layers empilés dans un viewport sticky
├── config.js               ← FICHIER DE CONFIGURATION (textes, couleurs, liens, formulaire)
├── css/
│   └── style.css           ← Styles, variables CSS, responsive, carte postale
├── js/
│   ├── app.js              ← Logique principale, scroll, animations (updateAllPhases)
│   ├── form.js             ← Gestion formulaire + envoi Google Sheets
│   ├── audio.js            ← Gestion audio ambient (fade in/out, toggle)
│   └── i18n.js             ← Système de traduction ES/EN
├── assets/
│   ├── audio/
│   │   └── ambient.mp3     ← Fourni par le client
│   └── images/
│       └── (photos/artwork fournies par le client)
└── docs .md                ← Ce fichier + PLAN-DE-DEVELOPPEMENT.md + PROMPT-CLAUDE-CODE.md
```

---

## ÉTAT ACTUEL DE L'IMPLÉMENTATION (mis à jour)

### Ce qui est fonctionnel (testé et validé)
- **Phase 1** (0%→5%) : Typewriter "Un mensaje fue enviado." avec curseur clignotant, fade out
- **Phase 2** (5%→65%) : Canvas topographique avec 5 zones (désert, sierra, ville, frontière, océan), lettre zig-zag sinusoïdale, 3 textes narratifs, diamants étoiles filantes
- **Phase 3** (65%→80%) : Transition canvas→table, lettre grossit, blur/fade canvas, texte d'arrivée
- **Phase 4** (80%→95%) : Carte postale apparaît, flip 3D à 85%, formulaire fonctionnel, scroll lock à 93%
- **Phase 5** (post-submit) : Confirmation avec tracking, boutons pre-save et partager
- **Audio** : Toggle ON/OFF avec fade in/out 2s, audio intensity modulable par scroll
- **i18n** : Bilingue ES/EN complet, localStorage, toggle en haut à gauche
- **Formulaire** : Champs dynamiques depuis config.js, envoi Google Sheets, fallback console

### Ce qui reste à faire
- [ ] Grain filmique (overlay `::after` sur viewport — désactivé pour perf, à réactiver)
- [ ] Curseur custom réticule rouge (desktop only)
- [ ] Responsive mobile complet (testable mais non optimisé)
- [ ] README.md pour non-développeurs
- [ ] Tests cross-browser (Firefox, Safari)
- [ ] Icônes réseaux sociaux en Phase 5

---

## ARCHITECTURE TECHNIQUE CRITIQUE

### Pattern "Viewport Sticky + Layers"

**C'est le cœur de l'architecture. NE PAS changer cette approche.**

```
#scroll-container (500vh — rail de scroll virtuel)
  └── #viewport (position: sticky, top: 0, height: 100vh, overflow: hidden)
      ├── #phase-intro          (z-index: 15, position: absolute)
      ├── #topo-canvas          (z-index: 10, position: absolute)
      ├── #table-bg             (z-index: 9, position: absolute)
      ├── #journey-texts        (z-index: 12, position: absolute)
      ├── #light-points-container (z-index: 11, position: absolute)
      ├── #letter               (z-index: 13, position: absolute)
      ├── #arrival-text         (z-index: 16, position: absolute)
      ├── #postcard             (z-index: 17, position: absolute)
      └── #phase-confirmation   (z-index: 20, position: absolute)
```

**IMPORTANT** : Tous les éléments visuels sont des layers empilés dans LE MÊME viewport. Il n'y a PAS de `<section>` séparées pour chaque phase. Chaque élément contrôle indépendamment son `opacity` et `visibility` en fonction du scroll progress.

### Fonction centrale : `updateAllPhases(progress)`

Une seule fonction dans `app.js` reçoit le `progress` (0→1) de ScrollTrigger et contrôle TOUT :
- Phase 1 (0.00→0.05) : typewriter intro
- Phase 2 (0.05→0.65) : canvas scroll, lettre zig-zag, textes narratifs, étoiles filantes
- Phase 3 (0.65→0.80) : blur canvas, table bg, lettre grossit, texte arrivée
- Phase 4 (0.80→0.95) : postcard apparaît, flip 3D à 0.85, scroll lock à 0.93
- Phase 5 : hors scroll, déclenchée par soumission du formulaire

### Pièges résolus — NE PAS réintroduire

1. **`overflow-x: hidden` sur `html, body` CASSE `position: sticky`** — Utiliser `overflow-x: clip` sur `#scroll-container` uniquement
2. **PAS de `<section>` séparées** — L'ancienne architecture avec des sections par phase causait des bugs de transition (éléments cachés quand section invisible). Utiliser des layers absolus dans un viewport unique
3. **Canvas offscreen buffer** — Le canvas topographique est pré-rendu dans un buffer (5x hauteur viewport) et blité avec un offset Y. NE PAS redessiner les courbes à chaque frame
4. **Scroll lock** — `lenis.stop()` empêche le scroll molette. `scrollLockApplied` flag empêche le re-lock après unlock post-soumission. `window.scrollTo(0, 0)` à l'init corrige le bug de refresh
5. **Lettre unique** — UN SEUL élément `#letter` qui traverse toutes les phases (voyage → arrivée → postcard). Pas de duplication

---

## PRIORITÉ ABSOLUE : Facilité de modification

Le site est **modifiable par des personnes qui ne codent pas**. Toute donnée variable est centralisée dans `config.js`. Ce fichier est **abondamment commenté en français**.

### Contenu du fichier `config.js` :

```js
const CONFIG = {
  artistName: "MANDRAGORA",
  releaseTitle: "Jugo De Diamantes",
  social: { instagram, tiktok, x, youtube, spotify, appleMusic, soundcloud },
  presaveLink: "https://...",
  googleSheetsEndpoint: "https://script.google.com/macros/s/.../exec",
  formFields: [ { id, labelES, labelEN, required }, ... ],
  textES: { introLine, journeyTexts[], arrivalLine, submitButton, confirmationLine, ... },
  textEN: { ... },
  colors: { background, textPrimary, accent, letterColor, topoLines, topoLinesLight },
  fonts: { display, mono, handwriting },
  share: { messageES, messageEN, siteUrl },
};
```

Les variables CSS dans `:root` de `style.css` DOIVENT rester synchronisées avec `config.js`. Commenter `/* Synchroniser avec config.js */` au-dessus.

---

## Direction artistique

### Mood
Sombre, cinématique, clandestin, élégant. Esthétique narco-cinématographique : noir et blanc granuleux, fort contraste.

### Palette
- **Fond** : Noir profond `#0A0A0A`
- **Texte** : Blanc cassé `#E8E4DE`
- **Accent** : Rouge sang `#8B1A1A` — interactions uniquement (hover, bouton, sceau lettre, frontière carte)
- **Carte postale** : Fond crème `#f5f0e8`, bordure `#d4cfc5`, texte `#2a2a2a`

### Typographie (harmonisée)
- **Mono (principale)** : Space Mono — utilisée PARTOUT : intro typewriter, textes narratifs, formulaire labels, boutons, tracking, UI. C'est la police dominante du site
- **Display** : Playfair Display — réservée au titre du morceau sur la face avant de la carte postale
- **Handwriting** : Caveat — texte tapé par l'utilisateur dans les champs + message manuscrit sur la carte postale

### Effets visuels
- **Film grain** : Overlay `::after` sur `#viewport`, `pointer-events: none`, z-index 9999, opacité ~0.03-0.05 (à réactiver)
- **Curseur custom** : Réticule rouge SVG, desktop only (`@media (hover: hover)`) — à implémenter

---

## Parcours utilisateur — 5 phases liées au scroll

Le scroll est le moteur narratif. **GSAP ScrollTrigger** (`scrub: 0.5`) pilote les animations. **Lenis** assure le smooth scroll.

### Phase 1 — "Intercepción" (scroll 0% → 5%)

Écran noir total. Texte typewriter lettre par lettre en Space Mono : *"Un mensaje fue enviado."*
- 60ms par lettre, curseur clignotant
- Fade out au scroll

### Phase 2 — "El Viaje" (scroll 5% → 65%)

La lettre voyage à travers le Mexique sur une carte topographique.

#### La carte topographique (Canvas 2D)
- Buffer offscreen pré-rendu (5x hauteur viewport)
- 5 zones : désert (espacé) → sierra (dense) → ville (grille) → frontière (ligne rouge) → océan (ondulations)
- Blité sur le canvas visible avec offset Y piloté par le scroll

#### La lettre (zig-zag sinusoïdal)
- Rectangle blanc 80x50px (60x40 mobile) centré, cachet rouge
- **Chemin zig-zag** : `xOffset = sin(t * 3 * PI * 2) * amplitude`, amplitude décroissante (120px → 72px)
- Rotation suit la tangente (clamp ±8°)
- Tampon à 30%, coin corné à 50%

#### Textes narratifs
- 3 phrases configurables, Space Mono, positions variées (gauche, droite, centré)
- Révélation `clip-path`, timing piloté par scroll (10%→25%, 28%→43%, 46%→60%)

#### Diamants étoiles filantes (remplacent les anciens "points lumineux")
- Forme losange (carré rotated 45°) + traînée en gradient
- 7 triggers répartis entre 9% et 62%
- Animation GSAP 2s : fade in (0.4s) → course diagonale (1.2s) → fade out (0.4s)
- Chaque étoile ne se déclenche qu'une seule fois (flag `fired`)

### Phase 3 — "La Llegada" (scroll 65% → 80%)

Transition carte → table :
- Canvas blur progressif (`filter: blur()` 0→10px) + fade opacity
- `#table-bg` apparaît (fond sombre crème foncé)
- Lettre grossit (scale → ~4x)
- Texte d'arrivée : *"El mensaje llegó. Falta tu nombre."* en Space Mono, fade in à ~78%

### Phase 4 — "Tu Carta" (scroll 80% → 95%)

La carte postale apparaît et se retourne :
- `#postcard` : fade in + scale de 80%→95%
- Flip 3D (`rotateY(180deg)`) à 85% du scroll via classe `.flipped`
- `transform-style: preserve-3d` + `backface-visibility: hidden` sur les deux faces
- **Face avant** : artwork "JUGO DE DIAMANTES" + "MANDRAGORA" + timbre "M"
- **Face arrière** : formulaire carte postale (message manuscrit à gauche, champs à droite)
- **Scroll lock à 93%** : `lenis.stop()` bloque le scroll pour remplir le formulaire

#### Carte postale — design
- Fond crème `#f5f0e8`, bordure dorée subtile
- Colonne gauche : message en Caveat *"El mensaje llegó..."*
- Ligne verticale séparatrice
- Colonne droite : timbre "M" dentelé, champs input avec bordures pointillées, labels Space Mono uppercase, texte saisi en Caveat
- Bouton ENVIAR : bordure accent, Space Mono uppercase

### Phase 5 — "Tu carta corre" (après soumission)

Confirmation (hors scroll, déclenchée par submit) :
1. Postcard fade out + scale down
2. Table bg fade out
3. Texte *"Tu carta corre."* + tracking "MX-2025-XXXX"
4. Boutons PRE-SAVE et PARTAGER (fade in avec délai)
5. Scroll unlock (`lenis.start()`)

---

## Audio ambient

- Toggle discret haut droite : "AUDIO OFF" / "AUDIO ON" en Space Mono
- Fade in/out 2s via `requestAnimationFrame`
- `setAudioIntensity(value)` exposée globalement pour modulation par scroll
- Gestion erreur si fichier manquant (try/catch, pas bloquant)

---

## Système bilingue (ES/EN)

- Toggle haut gauche : "EN" (en mode ES) / "ES" (en mode EN)
- `localStorage` pour persistance
- `t(key)` retourne le texte dans la langue active
- `updateAllTexts()` met à jour tous les `[data-i18n]`
- Formulaire labels bilingues via `CONFIG.formFields[].labelES/labelEN`

---

## Backend — Google Sheets via Apps Script

Inchangé — voir section dans le code `form.js`. Endpoint dans `config.js`. Fallback console si non configuré.

---

## Stack technique

- **GSAP 3.12.5 + ScrollTrigger** (CDN cloudflare)
- **Lenis 1.1.18** (CDN unpkg)
- **Google Fonts** : Playfair Display, Space Mono, Caveat
- Vanilla HTML/CSS/JS, pas de framework, pas de bundler
- Canvas 2D pour la carte topographique (offscreen buffer)
- Serveur statique simple (`python3 -m http.server` ou Netlify)

---

## Variables CSS (style.css `:root`)

```css
:root {
  --bg: #0A0A0A;
  --text: #E8E4DE;
  --accent: #8B1A1A;
  --letter: #FFFFFF;
  --topo: #2A2A2A;
  --topo-light: #3A3A3A;
  --font-display: 'Playfair Display', serif;   /* Réservée aux titres artwork */
  --font-mono: 'Space Mono', monospace;         /* Police principale du site */
  --font-hand: 'Caveat', cursive;               /* Écriture manuscrite formulaire */
  --postcard-bg: #f5f0e8;
  --postcard-border: #d4cfc5;
  --postcard-divider: #c0b8a8;
  --postcard-text: #2a2a2a;
  --postcard-label: #888;
  --postcard-input: #1a1a1a;
}
```

---

## Checklist de livraison

- [x] Le scroll pilote toutes les animations de la Phase 1 à la Phase 4
- [x] La carte topographique Canvas défile correctement avec les 5 zones
- [x] La lettre suit un chemin zig-zag sinusoïdal et évolue visuellement
- [x] Les 3 textes narratifs apparaissent et disparaissent au bon moment
- [x] Les diamants étoiles filantes s'animent lors du passage
- [x] La transition carte → table (Phase 3) fonctionne fluidement
- [x] La carte postale apparaît avec flip 3D (Phase 4)
- [x] Le formulaire est fonctionnel, champs générés depuis `config.js`
- [x] Le texte saisi apparaît en typo handwriting (Caveat)
- [x] Le bouton ENVIAR envoie les données (ou log console si non configuré)
- [x] L'animation de confirmation (Phase 5) se joue correctement
- [x] Les boutons PRE-SAVE et PARTAGER fonctionnent
- [x] Le toggle audio ON/OFF fonctionne avec fade in/out
- [x] Le toggle ES/EN change tous les textes sans recharger la page
- [x] Le scroll up fonctionne après avoir atteint le bas / après refresh
- [x] Les polices sont harmonisées (Space Mono dominant)
- [ ] Le grain filmique est visible mais subtil
- [ ] Le curseur custom (réticule rouge) fonctionne sur desktop
- [ ] Le site est responsive (mobile optimisé)
- [ ] Le `README.md` est rédigé en français pour non-développeurs
- [ ] Tests cross-browser (Firefox, Safari)
