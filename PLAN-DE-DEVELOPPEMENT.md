# PLAN DE DÉVELOPPEMENT — MANDRAGORA "Jugo De Diamantes"

> **Ce document est le plan d'exécution pour Claude Code.**
> Se référer à `MANDRAGORA-JugoDeDiamantes-site.md` pour la spec complète et l'état actuel.

---

## ÉTAT D'AVANCEMENT

| Phase | Étape | Status | Notes |
|-------|-------|--------|-------|
| 0 | Fondations (structure, config, HTML, CSS, i18n, audio) | ✅ Terminé | |
| 1 | Intro typewriter | ✅ Terminé | |
| 2 | Voyage carte topo + lettre + textes + étoiles | ✅ Terminé | Zig-zag sinusoïdal, diamants étoiles filantes |
| 3 | Arrivée (transition carte→table) | ✅ Terminé | |
| 4 | Formulaire carte postale + flip 3D | ✅ Terminé | Scroll lock/unlock fonctionnel |
| 5 | Confirmation post-soumission | ✅ Terminé | |
| 6.1 | Grain filmique | ❌ À faire | Overlay `::after`, opacité subtile |
| 6.2 | Curseur custom | ❌ À faire | SVG réticule rouge, desktop only |
| 6.3 | Responsive mobile | ⚠️ Partiel | Fonctionne mais non optimisé |
| 6.4 | Edge cases | ⚠️ Partiel | Scroll lock OK, refresh OK |
| 6.5 | Performance | ⚠️ Partiel | Canvas buffer OK, à profiler |
| 7.1 | README.md | ❌ À faire | Pour non-développeurs |
| 7.2 | Commentaires code | ✅ Terminé | Français, clair |

---

## PROCHAINES ÉTAPES (dans l'ordre de priorité)

### 1. Grain filmique (Étape 6.1)

Le `#viewport::after` existe dans le CSS mais le grain n'est pas encore actif. Implémenter :
- Pseudo-élément couvrant tout (`inset: -20%` pour déborder), `pointer-events: none`, `z-index: 9999`
- Bruit animé via SVG `<filter>` inline ou image de grain en boucle
- Opacité très subtile : 0.03-0.05
- Tester la performance sur mobile — désactiver si trop lourd

### 2. Curseur custom (Étape 6.2)

- SVG inline d'un réticule fin rouge (crosshair)
- `cursor: url(...) center center, crosshair` sur `body`
- `@media (hover: hover)` pour desktop uniquement
- Ne PAS appliquer sur les `<input>`, `<button>`, `<a>` (garder curseurs natifs)

### 3. Responsive mobile (Étape 6.3)

Points à tester et ajuster :
- **iPhone SE** (375x667) — plus petit viewport courant
- La carte postale doit passer en mode portrait / plein écran sur mobile
- Les champs du formulaire doivent être accessibles et le clavier virtuel ne doit pas casser le layout
- Les toggles langue/audio ne doivent pas chevaucher le contenu (zones de tap ≥ 44x44px)
- La lettre ne doit jamais sortir de l'écran sur petit écran

### 4. README.md (Étape 7.1)

Rédiger en français pour non-développeurs. Couvrir :
1. Comment modifier les textes (`config.js`)
2. Comment changer les couleurs
3. Comment ajouter les liens réseaux sociaux
4. Comment configurer Google Sheets (pas à pas)
5. Comment remplacer l'audio
6. Comment mettre en ligne (Netlify Drop)

### 5. Tests cross-browser

Vérifier Chrome, Firefox, Safari (desktop + mobile) :
- `position: sticky` fonctionne
- Canvas 2D rendu correct
- Flip 3D `backface-visibility` correct
- Lenis smooth scroll correct
- Audio toggle correct

---

## RÈGLES DE DÉVELOPPEMENT

1. **Lire `MANDRAGORA-JugoDeDiamantes-site.md`** AVANT de coder
2. **Un fichier à la fois** — tester dans le navigateur après chaque modification
3. **Commenter le code en français**
4. **Respecter l'architecture de fichiers** — ne pas inventer de nouveaux fichiers
5. **GSAP, ScrollTrigger, Lenis via CDN** — pas d'installation npm
6. **Vanilla JS** — pas de framework, pas de bundler
7. **`config.js` est la source de vérité** — aucune valeur en dur
8. **NE PAS toucher à l'architecture viewport sticky + layers** — c'est la fondation critique

---

## ARCHITECTURE CRITIQUE — À NE PAS MODIFIER

### Pattern Viewport Sticky + Layers

```
#scroll-container (500vh)
  └── #viewport (position: sticky, top: 0, height: 100vh, overflow: hidden)
      ├── #phase-intro
      ├── #topo-canvas
      ├── #table-bg
      ├── #journey-texts
      ├── #light-points-container
      ├── #letter
      ├── #arrival-text
      ├── #postcard
      └── #phase-confirmation
```

Tous les éléments sont en `position: absolute` dans le viewport. Leur visibilité est contrôlée par `opacity` + `visibility` dans `updateAllPhases(progress)`.

### Fonction centrale

```javascript
function updateAllPhases(progress) {
  // progress 0→1 from ScrollTrigger
  // Contrôle opacity, visibility, transform, filter de CHAQUE élément
  // Phase 1: 0.00→0.05 | Phase 2: 0.05→0.65 | Phase 3: 0.65→0.80 | Phase 4: 0.80→0.95
}
```

### Scroll Lock

```javascript
var scrollLocked = false;
var scrollLockApplied = false; // Empêche re-lock après unlock

function lockScroll() {
  scrollLocked = true;
  scrollLockApplied = true; // Une fois true, ne re-lock plus jamais
  if (lenis) lenis.stop();
}

function unlockScroll() {
  scrollLocked = false;
  if (lenis) lenis.start();
}
```

---

## PIÈGES À ÉVITER (leçons apprises)

1. **`overflow-x: hidden` sur `html, body` CASSE `position: sticky`** → Utiliser `overflow-x: clip` sur `#scroll-container` uniquement
2. **PAS de `<section>` séparées par phase** → Les layers empilés dans un viewport unique sont la seule approche qui fonctionne pour les transitions fluides
3. **NE PAS redessiner le canvas à chaque frame** → Buffer offscreen pré-rendu, blit avec offset Y
4. **NE PAS dupliquer la lettre** → Un seul `#letter` qui traverse toutes les phases
5. **NE PAS utiliser `position: fixed`** → Utiliser `position: sticky` dans le flow du document. `fixed` casse le scroll sur iOS
6. **Le `window.scrollTo(0, 0)` en init est essentiel** → Sans ça, le navigateur restaure la position scroll au refresh et le site est bloqué
7. **`scrollLockApplied` flag est essentiel** → Sans ça, après unlock (post-submit), le scroll re-lock immédiatement car progress ≥ 0.93
8. **Les étoiles filantes sont éphémères** → Elles sont créées dynamiquement, animées par GSAP, puis supprimées du DOM. C'est normal qu'il y en ait 0 dans le DOM à un instant donné
9. **`backface-visibility: hidden`** doit être sur les deux faces (front ET back) de la carte postale, pas sur le conteneur
10. **Les scripts doivent charger dans l'ordre** : config.js → i18n.js → audio.js → form.js → app.js (tous `defer`)
