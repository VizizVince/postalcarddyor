// ============================================
// APP.JS — Script principal
// Initialise Lenis, GSAP ScrollTrigger, et orchestre toutes les phases
// ============================================

(function () {
  'use strict';

  // --- RÉFÉRENCES DOM ---
  var scrollContainer = null;
  var viewport = null;
  var phaseIntro = null;
  var phaseJourney = null;
  var phaseArrival = null;
  var phaseForm = null;
  var phaseConfirmation = null;
  var topoCanvas = null;
  var topoCtx = null;
  var letterEl = null;
  var journeyTextsEl = null;

  // --- LENIS (smooth scroll) ---
  var lenis = null;

  // --- CANVAS OFFSCREEN (buffer topographique) ---
  // On dessine la carte UNE SEULE FOIS dans ce buffer,
  // puis on blit avec un offset Y à chaque frame de scroll
  var offscreenCanvas = null;
  var offscreenCtx = null;
  // Hauteur totale du buffer = 5x la hauteur du viewport
  var BUFFER_MULTIPLIER = 5;
  var bufferHeight = 0;
  var bufferWidth = 0;

  // --- POINTS LUMINEUX ---
  // Positions en % du scroll (entre 0.08 et 0.62), flash unique
  var lightPoints = [
    { trigger: 0.09, fired: false },
    { trigger: 0.17, fired: false },
    { trigger: 0.26, fired: false },
    { trigger: 0.35, fired: false },
    { trigger: 0.44, fired: false },
    { trigger: 0.53, fired: false },
    { trigger: 0.61, fired: false },
  ];

  // --- TEXTES NARRATIFS ---
  // Chaque texte a une plage d'apparition et de disparition en % du scroll
  var journeyTextTimings = [
    { appearAt: 0.10, disappearAt: 0.25 },  // Texte 1
    { appearAt: 0.28, disappearAt: 0.43 },  // Texte 2
    { appearAt: 0.46, disappearAt: 0.60 },  // Texte 3
  ];

  // ============================================
  // INITIALISATION GÉNÉRALE
  // ============================================

  function init() {
    // Récupérer les références DOM
    scrollContainer = document.getElementById('scroll-container');
    viewport = document.getElementById('viewport');
    phaseIntro = document.getElementById('phase-intro');
    phaseJourney = document.getElementById('phase-journey');
    phaseArrival = document.getElementById('phase-arrival');
    phaseForm = document.getElementById('phase-form');
    phaseConfirmation = document.getElementById('phase-confirmation');
    topoCanvas = document.getElementById('topo-canvas');
    letterEl = document.getElementById('letter');
    journeyTextsEl = document.getElementById('journey-texts');

    // Contexte du canvas visible
    if (topoCanvas) {
      topoCtx = topoCanvas.getContext('2d');
    }

    // Cacher toutes les sections sauf l'intro au démarrage
    hideAllSectionsExcept(phaseIntro);

    // Initialiser Lenis pour le smooth scroll
    initLenis();

    // Enregistrer le plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Construire les éléments DOM de la Phase 2
    buildJourneyTexts();
    buildLightPoints();

    // Dessiner la carte topographique dans le buffer offscreen
    initTopoBuffer();

    // Lancer les animations après un court délai (laisser le DOM se stabiliser)
    // 1.5s = temps avant que le typewriter commence, comme demandé dans la spec
    setTimeout(function () {
      initPhase1Typewriter();
    }, 1500);

    // Configurer le scroll piloté par ScrollTrigger
    initScrollAnimations();

    // Redimensionnement : recalculer le buffer et le canvas
    window.addEventListener('resize', debounce(handleResize, 300));
  }

  // ============================================
  // LENIS — Smooth scroll
  // ============================================

  function initLenis() {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Synchroniser Lenis avec GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Boucle d'animation Lenis via GSAP ticker
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  function hideAllSectionsExcept(activeSection) {
    var sections = [phaseIntro, phaseJourney, phaseArrival, phaseForm, phaseConfirmation];
    sections.forEach(function (section) {
      if (!section) return;
      if (section === activeSection) {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      } else {
        section.style.opacity = '0';
        section.style.visibility = 'hidden';
      }
    });
  }

  /** Anti-rebond simple pour le resize */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  /** Gère le redimensionnement de la fenêtre */
  function handleResize() {
    initTopoBuffer();
  }

  // ============================================
  // PHASE 1 — TYPEWRITER (texte lettre par lettre)
  // ============================================

  function initPhase1Typewriter() {
    if (!phaseIntro) return;

    var text = t('introLine');
    var textContainer = document.createElement('div');
    textContainer.id = 'intro-text';

    // Créer un span par caractère
    text.split('').forEach(function (char) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      textContainer.appendChild(span);
    });

    // Curseur clignotant
    var cursor = document.createElement('span');
    cursor.id = 'intro-cursor';
    textContainer.appendChild(cursor);

    phaseIntro.innerHTML = '';
    phaseIntro.appendChild(textContainer);

    // Animer les caractères un par un (stagger 60ms)
    var chars = textContainer.querySelectorAll('.char');
    gsap.to(chars, {
      opacity: 1,
      duration: 0.05,
      stagger: 0.06,
      ease: 'none',
    });
  }

  function rebuildTypewriter() {
    if (!phaseIntro) return;
    if (phaseIntro.style.visibility === 'hidden') return;

    var text = t('introLine');
    var textContainer = document.getElementById('intro-text');
    if (!textContainer) return;

    textContainer.innerHTML = '';

    text.split('').forEach(function (char) {
      var span = document.createElement('span');
      span.className = 'char';
      span.style.opacity = '1';
      span.textContent = char === ' ' ? '\u00A0' : char;
      textContainer.appendChild(span);
    });

    var cursor = document.createElement('span');
    cursor.id = 'intro-cursor';
    textContainer.appendChild(cursor);
  }

  // ============================================
  // PHASE 2 — CARTE TOPOGRAPHIQUE (Canvas offscreen)
  // ============================================

  /**
   * Initialise le buffer offscreen et y dessine la carte topographique complète.
   * Cette fonction est appelée une seule fois (et au resize).
   * Le buffer fait 5x la hauteur du viewport pour permettre le défilement.
   */
  function initTopoBuffer() {
    if (!topoCanvas) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // Dimensions du canvas visible (= viewport)
    topoCanvas.width = vw;
    topoCanvas.height = vh;

    // Dimensions du buffer offscreen
    bufferWidth = vw;
    bufferHeight = vh * BUFFER_MULTIPLIER;

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = bufferWidth;
    offscreenCanvas.height = bufferHeight;
    offscreenCtx = offscreenCanvas.getContext('2d');

    // Remplir le fond
    offscreenCtx.fillStyle = CONFIG.colors.background;
    offscreenCtx.fillRect(0, 0, bufferWidth, bufferHeight);

    // Dessiner les 5 zones sur le buffer
    drawAllZones();
  }

  /**
   * Dessine les 5 zones topographiques sur le buffer offscreen.
   * Les zones sont distribuées sur toute la hauteur du buffer.
   *
   * Distribution (en % de bufferHeight) :
   *   Zone 1 — Désert    :  0% → 25%   (lignes espacées, vide)
   *   Zone 2 — Sierra    : 20% → 45%   (lignes serrées, montagnes)
   *   Zone 3 — Ville     : 40% → 65%   (grille géométrique)
   *   Zone 4 — Frontière : 60% → 70%   (ligne rouge pulsante)
   *   Zone 5 — Océan     : 65% → 100%  (ondulations, vide)
   *
   * Les zones se chevauchent légèrement pour des transitions progressives.
   */
  function drawAllZones() {
    if (!offscreenCtx) return;

    var w = bufferWidth;
    var h = bufferHeight;

    // --- ZONE 1 : DÉSERT (0% → 25%) ---
    // Lignes très espacées (~40px), peu de courbes, beaucoup de vide noir
    drawDesertZone(0, h * 0.25, w);

    // --- ZONE 2 : SIERRA (20% → 45%) ---
    // Lignes serrées (~8-12px), denses, courbes concentriques (montagnes)
    drawSierraZone(h * 0.20, h * 0.45, w);

    // --- ZONE 3 : VILLE (40% → 65%) ---
    // Grille géométrique : lignes droites, blocs urbains
    drawCityZone(h * 0.40, h * 0.65, w);

    // --- ZONE 4 : FRONTIÈRE (60% → 70%) ---
    // Ligne horizontale rouge qui pulse (la seule couleur)
    drawBorderZone(h * 0.60, h * 0.70, w);

    // --- ZONE 5 : OCÉAN (65% → 100%) ---
    // Lignes ondulantes horizontales, espacement progressif → vide
    drawOceanZone(h * 0.65, h, w);
  }

  // ------------------------------------------
  // Utilitaire : bruit pseudo-aléatoire simple
  // Pas de dépendance externe — combinaison de sin pour des courbes organiques
  // ------------------------------------------

  /**
   * Retourne une valeur de bruit entre -1 et 1 basée sur x et seed.
   * Utilise une combinaison de sinus à fréquences variées pour simuler
   * un bruit organique sans librairie externe (simplex noise simplifié).
   */
  function noise(x, seed) {
    var s = seed || 0;
    return (
      Math.sin(x * 0.01 + s) * 0.5 +
      Math.sin(x * 0.023 + s * 1.3) * 0.3 +
      Math.sin(x * 0.047 + s * 2.1) * 0.15 +
      Math.sin(x * 0.099 + s * 3.7) * 0.05
    );
  }

  /**
   * Dessine une courbe topographique organique entre deux points.
   * @param {number} yBase — position Y de base de la ligne
   * @param {number} amplitude — amplitude verticale de la déformation
   * @param {number} seed — graine pour varier la forme
   * @param {number} width — largeur du canvas
   * @param {string} color — couleur de la ligne
   * @param {number} lineWidth — épaisseur de la ligne
   */
  function drawTopoLine(yBase, amplitude, seed, width, color, lineWidth) {
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = color;
    offscreenCtx.lineWidth = lineWidth || 0.5;

    for (var x = 0; x <= width; x += 2) {
      var y = yBase + noise(x, seed) * amplitude;
      if (x === 0) {
        offscreenCtx.moveTo(x, y);
      } else {
        offscreenCtx.lineTo(x, y);
      }
    }

    offscreenCtx.stroke();
  }

  // ------------------------------------------
  // ZONE 1 — DÉSERT
  // ------------------------------------------

  function drawDesertZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var spacing = 40; // Lignes très espacées
    var numLines = Math.floor((yEnd - yStart) / spacing);

    for (var i = 0; i < numLines; i++) {
      var y = yStart + i * spacing + spacing * 0.5;
      var amplitude = 15 + Math.sin(i * 0.7) * 10;
      var seed = i * 3.14;
      drawTopoLine(y, amplitude, seed, width, lineColor, 0.5);
    }

    // Quelques courbes concentriques isolées (mesas/buttes)
    drawConcentricCurves(width * 0.3, yStart + (yEnd - yStart) * 0.4, 3, 50, 20, lineColor, width);
    drawConcentricCurves(width * 0.7, yStart + (yEnd - yStart) * 0.7, 2, 40, 25, lineColor, width);
  }

  /**
   * Dessine des courbes concentriques (relief topographique) autour d'un centre.
   * @param {number} cx — centre X
   * @param {number} cy — centre Y
   * @param {number} count — nombre de courbes
   * @param {number} baseRadius — rayon de la courbe la plus intérieure
   * @param {number} spacing — espacement entre courbes
   * @param {string} color — couleur
   * @param {number} width — largeur du canvas (pour les limites)
   */
  function drawConcentricCurves(cx, cy, count, baseRadius, spacing, color, width) {
    for (var ring = 0; ring < count; ring++) {
      var radius = baseRadius + ring * spacing;
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = color;
      offscreenCtx.lineWidth = 0.5;

      var points = 120;
      for (var i = 0; i <= points; i++) {
        var angle = (i / points) * Math.PI * 2;
        // Déformer le cercle avec du bruit pour un rendu organique
        var deform = noise(angle * 100, ring * 5 + cx * 0.01) * radius * 0.3;
        var r = radius + deform;
        var x = cx + Math.cos(angle) * r;
        var y = cy + Math.sin(angle) * r;
        if (i === 0) {
          offscreenCtx.moveTo(x, y);
        } else {
          offscreenCtx.lineTo(x, y);
        }
      }

      offscreenCtx.closePath();
      offscreenCtx.stroke();
    }
  }

  // ------------------------------------------
  // ZONE 2 — SIERRA
  // ------------------------------------------

  function drawSierraZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var lightColor = CONFIG.colors.topoLinesLight;
    var spacing = 10; // Lignes serrées
    var numLines = Math.floor((yEnd - yStart) / spacing);

    // Lignes denses avec forte amplitude (montagnes)
    for (var i = 0; i < numLines; i++) {
      var y = yStart + i * spacing;
      var amplitude = 25 + Math.sin(i * 0.4) * 15;
      var seed = i * 2.71 + 100;
      var color = (i % 3 === 0) ? lightColor : lineColor;
      drawTopoLine(y, amplitude, seed, width, color, 0.5);
    }

    // Multiples reliefs concentriques denses (sommets montagneux)
    var peakCount = 5;
    for (var p = 0; p < peakCount; p++) {
      var cx = width * (0.15 + p * 0.17);
      var cy = yStart + (yEnd - yStart) * (0.3 + Math.sin(p * 1.5) * 0.2);
      drawConcentricCurves(cx, cy, 6, 20, 12, lineColor, width);
    }
  }

  // ------------------------------------------
  // ZONE 3 — VILLE (grille géométrique)
  // ------------------------------------------

  function drawCityZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var lightColor = CONFIG.colors.topoLinesLight;
    var zoneHeight = yEnd - yStart;

    // Grille principale — lignes horizontales
    var hSpacing = 20;
    for (var y = yStart; y < yEnd; y += hSpacing) {
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;
      offscreenCtx.moveTo(0, y);
      offscreenCtx.lineTo(width, y);
      offscreenCtx.stroke();
    }

    // Grille principale — lignes verticales
    var vSpacing = 25;
    for (var x = 0; x < width; x += vSpacing) {
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;
      offscreenCtx.moveTo(x, yStart);
      offscreenCtx.lineTo(x, yEnd);
      offscreenCtx.stroke();
    }

    // Blocs urbains — certaines cellules ont des lignes plus claires (bâtiments)
    var blockW = vSpacing;
    var blockH = hSpacing;
    for (var bx = 0; bx < width; bx += blockW * 3) {
      for (var by = yStart; by < yEnd; by += blockH * 3) {
        // Dessiner un "bâtiment" (rectangle intérieur) dans certains blocs
        if (noise(bx * 0.1, by * 0.1) > 0) {
          var inset = 4;
          offscreenCtx.beginPath();
          offscreenCtx.strokeStyle = lightColor;
          offscreenCtx.lineWidth = 0.3;
          offscreenCtx.rect(bx + inset, by + inset, blockW * 2 - inset * 2, blockH * 2 - inset * 2);
          offscreenCtx.stroke();
        }
      }
    }

    // Diagonale principale (avenue)
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = lightColor;
    offscreenCtx.lineWidth = 1;
    offscreenCtx.moveTo(0, yStart + zoneHeight * 0.3);
    offscreenCtx.lineTo(width, yEnd - zoneHeight * 0.2);
    offscreenCtx.stroke();
  }

  // ------------------------------------------
  // ZONE 4 — FRONTIÈRE (ligne rouge pulsante)
  // ------------------------------------------

  function drawBorderZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var zoneHeight = yEnd - yStart;
    var centerY = yStart + zoneHeight * 0.5;

    // Quelques lignes topo espacées autour de la frontière
    for (var i = -3; i <= 3; i++) {
      if (i === 0) continue; // La ligne centrale sera rouge
      var y = centerY + i * 30;
      var seed = i * 4.2 + 200;
      drawTopoLine(y, 8, seed, width, lineColor, 0.3);
    }

    // La ligne rouge de la frontière — dessinée directement (pas pulsante ici,
    // la pulsation sera gérée par l'animation dans le draw loop du canvas visible)
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = CONFIG.colors.accent;
    offscreenCtx.lineWidth = 2;
    offscreenCtx.moveTo(0, centerY);
    offscreenCtx.lineTo(width, centerY);
    offscreenCtx.stroke();

    // Marques de hachures perpendiculaires le long de la frontière (style bordure)
    for (var x = 0; x < width; x += 30) {
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = CONFIG.colors.accent;
      offscreenCtx.lineWidth = 0.5;
      offscreenCtx.globalAlpha = 0.4;
      offscreenCtx.moveTo(x, centerY - 6);
      offscreenCtx.lineTo(x, centerY + 6);
      offscreenCtx.stroke();
    }
    offscreenCtx.globalAlpha = 1;
  }

  // ------------------------------------------
  // ZONE 5 — OCÉAN (ondulations horizontales)
  // ------------------------------------------

  function drawOceanZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var zoneHeight = yEnd - yStart;

    // Les lignes sont sinusoïdales, l'espacement augmente progressivement
    var y = yStart;
    var spacing = 12;
    var lineIndex = 0;

    while (y < yEnd) {
      // Opacité décroissante : les lignes s'effacent vers le bas (vide total)
      var progress = (y - yStart) / zoneHeight; // 0 → 1
      var alpha = Math.max(0, 1 - progress * 1.2); // Disparaît avant la fin
      if (alpha <= 0) break;

      offscreenCtx.globalAlpha = alpha;
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;

      for (var x = 0; x <= width; x += 3) {
        // Sinusoïdes horizontales (ondulations marines)
        var wave = Math.sin(x * 0.015 + lineIndex * 0.8) * 8 +
                   Math.sin(x * 0.008 + lineIndex * 1.2) * 5;
        var py = y + wave;
        if (x === 0) {
          offscreenCtx.moveTo(x, py);
        } else {
          offscreenCtx.lineTo(x, py);
        }
      }

      offscreenCtx.stroke();

      // Espacement progressif : de plus en plus espacé
      spacing += 2;
      y += spacing;
      lineIndex++;
    }

    offscreenCtx.globalAlpha = 1;
  }

  // ============================================
  // PHASE 2 — BLITTING DU CANVAS (scroll → offset Y)
  // ============================================

  /**
   * Dessine la portion visible de la carte topographique sur le canvas visible.
   * Appelée à chaque mise à jour du scroll pendant la Phase 2.
   * @param {number} journeyProgress — progress normalisé de la Phase 2 (0 → 1)
   *   où 0 = début du voyage (scroll 5%), 1 = fin (scroll 65%)
   */
  function blitTopoCanvas(journeyProgress) {
    if (!topoCtx || !offscreenCanvas) return;

    var vw = topoCanvas.width;
    var vh = topoCanvas.height;

    // Calculer l'offset Y dans le buffer
    // journeyProgress 0 → montre le haut du buffer
    // journeyProgress 1 → montre le bas (bufferHeight - vh)
    var maxOffset = bufferHeight - vh;
    var offsetY = Math.floor(journeyProgress * maxOffset);

    // Effacer le canvas visible
    topoCtx.clearRect(0, 0, vw, vh);

    // Blitter la portion visible du buffer
    topoCtx.drawImage(
      offscreenCanvas,
      0, offsetY,        // Source : (x, y) dans le buffer
      vw, vh,            // Source : largeur, hauteur
      0, 0,              // Destination : (x, y) sur le canvas visible
      vw, vh             // Destination : largeur, hauteur
    );
  }

  // ============================================
  // PHASE 2 — TEXTES NARRATIFS (construction DOM)
  // ============================================

  /**
   * Crée les 3 divs de texte narratif dans #journey-texts.
   * Chaque div a les attributs data-i18n pour la traduction.
   */
  function buildJourneyTexts() {
    if (!journeyTextsEl) return;

    journeyTextsEl.innerHTML = '';

    var texts = t('journeyTexts');
    if (!Array.isArray(texts)) return;

    texts.forEach(function (text, index) {
      var div = document.createElement('div');
      div.className = 'journey-text';
      div.setAttribute('data-i18n-array', 'journeyTexts');
      div.setAttribute('data-i18n-index', String(index));
      div.textContent = text;
      journeyTextsEl.appendChild(div);
    });
  }

  /**
   * Met à jour l'apparence d'un texte narratif selon le scroll progress.
   * Gère l'apparition (clip-path reveal) et la disparition (opacity fade).
   * @param {number} index — index du texte (0, 1, 2)
   * @param {number} progress — scroll progress global (0 → 1)
   */
  function updateJourneyText(index, progress) {
    if (!journeyTextsEl) return;
    var textEl = journeyTextsEl.children[index];
    if (!textEl) return;

    var timing = journeyTextTimings[index];
    var appearAt = timing.appearAt;
    var disappearAt = timing.disappearAt;

    // Durée de la révélation clip-path : 3% du scroll
    var revealDuration = 0.03;
    // Durée du fade out : 2% du scroll
    var fadeDuration = 0.02;

    if (progress < appearAt) {
      // Pas encore visible
      textEl.style.opacity = '0';
      textEl.style.clipPath = 'inset(0 100% 0 0)';
    } else if (progress >= appearAt && progress < appearAt + revealDuration) {
      // Révélation progressive (clip-path de droite s'ouvre)
      var revealProgress = (progress - appearAt) / revealDuration;
      var clipRight = (1 - revealProgress) * 100;
      textEl.style.opacity = '0.6'; // Opacité max = 0.6 comme dans la spec
      textEl.style.clipPath = 'inset(0 ' + clipRight + '% 0 0)';
    } else if (progress >= appearAt + revealDuration && progress < disappearAt - fadeDuration) {
      // Pleinement visible
      textEl.style.opacity = '0.6';
      textEl.style.clipPath = 'inset(0 0% 0 0)';
    } else if (progress >= disappearAt - fadeDuration && progress < disappearAt) {
      // Fade out progressif
      var fadeProgress = (progress - (disappearAt - fadeDuration)) / fadeDuration;
      textEl.style.opacity = String(0.6 * (1 - fadeProgress));
      textEl.style.clipPath = 'inset(0 0% 0 0)';
    } else {
      // Complètement disparu
      textEl.style.opacity = '0';
    }
  }

  // ============================================
  // PHASE 2 — POINTS LUMINEUX (construction DOM + flash)
  // ============================================

  /**
   * Crée les 7 divs de points lumineux, positionnés le long du parcours.
   * Chaque point est un cercle 2px, blanc, opacité 0.3.
   */
  function buildLightPoints() {
    if (!phaseJourney) return;

    // Supprimer les anciens points lumineux s'ils existent
    var existing = phaseJourney.querySelectorAll('.light-point');
    existing.forEach(function (el) { el.remove(); });

    lightPoints.forEach(function (point, index) {
      var div = document.createElement('div');
      div.className = 'light-point';
      // Positionner à des endroits variés sur l'écran
      // Alternance gauche/droite/centre pour un effet naturel
      var positions = [
        { left: '25%', top: '40%' },
        { left: '70%', top: '55%' },
        { left: '45%', top: '35%' },
        { left: '15%', top: '60%' },
        { left: '80%', top: '45%' },
        { left: '55%', top: '30%' },
        { left: '35%', top: '65%' },
      ];
      var pos = positions[index];
      div.style.left = pos.left;
      div.style.top = pos.top;

      phaseJourney.appendChild(div);
    });
  }

  /**
   * Vérifie si un point lumineux doit flasher au scroll progress actuel.
   * Chaque point ne flashe qu'UNE SEULE FOIS.
   * @param {number} progress — scroll progress global (0 → 1)
   */
  function checkLightPoints(progress) {
    if (!phaseJourney) return;

    var pointEls = phaseJourney.querySelectorAll('.light-point');

    lightPoints.forEach(function (point, index) {
      if (point.fired) return; // Déjà flashé
      if (progress >= point.trigger) {
        point.fired = true;
        flashLightPoint(pointEls[index]);
      }
    });
  }

  /**
   * Anime le flash d'un point lumineux : scale 1 → 10, opacity 0.3 → 1 → 0 en 300ms.
   * @param {HTMLElement} el — l'élément DOM du point
   */
  function flashLightPoint(el) {
    if (!el) return;

    // Utiliser GSAP pour l'animation du flash
    gsap.timeline()
      .to(el, {
        scale: 10,
        opacity: 1,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(el, {
        scale: 15,
        opacity: 0,
        duration: 0.15,
        ease: 'power2.in',
      });
  }

  // ============================================
  // PHASE 2 — ÉVOLUTION DE LA LETTRE AU SCROLL
  // ============================================

  /**
   * Met à jour l'apparence de la lettre selon le scroll progress.
   * - Rotation subtile (0° → 1° → -0.5° → 0.3°)
   * - Tampon ::before apparaît à ~30%
   * - Coin corné à ~50%
   * @param {number} progress — scroll progress global (0 → 1)
   */
  function updateLetterEvolution(progress) {
    if (!letterEl) return;

    // --- Rotation subtile ---
    // Interpolation entre les keyframes de rotation
    var rotation = 0;
    if (progress < 0.05) {
      rotation = 0;
    } else if (progress < 0.20) {
      // 0.05 → 0.20 : rotation 0° → 1°
      rotation = ((progress - 0.05) / 0.15) * 1;
    } else if (progress < 0.35) {
      // 0.20 → 0.35 : rotation 1° → -0.5°
      rotation = 1 - ((progress - 0.20) / 0.15) * 1.5;
    } else if (progress < 0.50) {
      // 0.35 → 0.50 : rotation -0.5° → 0.3°
      rotation = -0.5 + ((progress - 0.35) / 0.15) * 0.8;
    } else if (progress < 0.65) {
      // 0.50 → 0.65 : rotation 0.3° → 0°
      rotation = 0.3 - ((progress - 0.50) / 0.15) * 0.3;
    }

    letterEl.style.transform = 'translate(-50%, -50%) rotate(' + rotation + 'deg)';

    // --- Tampon supplémentaire (::before) apparaît à ~30% ---
    // On contrôle via une classe CSS qui gère le ::before
    if (progress >= 0.30) {
      letterEl.classList.add('has-stamp');
    } else {
      letterEl.classList.remove('has-stamp');
    }

    // --- Coin corné à ~50% ---
    if (progress >= 0.50) {
      letterEl.classList.add('has-fold');
    } else {
      letterEl.classList.remove('has-fold');
    }
  }

  // ============================================
  // SCROLL ANIMATIONS — Pilotage par le scroll
  // ============================================

  function initScrollAnimations() {
    if (!scrollContainer) return;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: function (self) {
        var progress = self.progress; // 0 → 1

        // --- PHASE 1 : Intro (0% → 5%) ---
        handlePhaseIntro(progress);

        // --- PHASE 1→2 : Transition (4% → 5%) ---
        handleTransitionIntroToJourney(progress);

        // --- PHASE 2 : Voyage (5% → 65%) ---
        handlePhaseJourney(progress);
      }
    });
  }

  // ============================================
  // PHASE 1 — Gestion intro au scroll
  // ============================================

  function handlePhaseIntro(progress) {
    var introText = document.getElementById('intro-text');
    if (!introText) return;

    if (progress < 0.03) {
      introText.style.opacity = '1';
    } else if (progress >= 0.03 && progress < 0.04) {
      var fadeProgress = (progress - 0.03) / 0.01;
      introText.style.opacity = String(1 - fadeProgress);
    } else {
      introText.style.opacity = '0';
    }
  }

  // ============================================
  // TRANSITION PHASE 1 → PHASE 2
  // ============================================

  function handleTransitionIntroToJourney(progress) {
    if (!phaseIntro || !phaseJourney) return;

    if (progress < 0.04) {
      phaseIntro.style.opacity = '1';
      phaseIntro.style.visibility = 'visible';
      phaseJourney.style.opacity = '0';
      phaseJourney.style.visibility = 'hidden';
    } else if (progress >= 0.04 && progress < 0.05) {
      var crossfade = (progress - 0.04) / 0.01;
      phaseIntro.style.opacity = String(1 - crossfade);
      phaseIntro.style.visibility = 'visible';
      phaseJourney.style.opacity = String(crossfade);
      phaseJourney.style.visibility = 'visible';
    } else {
      phaseIntro.style.opacity = '0';
      phaseIntro.style.visibility = 'hidden';
      phaseJourney.style.opacity = '1';
      phaseJourney.style.visibility = 'visible';
    }
  }

  // ============================================
  // PHASE 2 — Le Voyage (scroll 5% → 65%)
  // ============================================

  /**
   * Orchestre toutes les animations de la Phase 2 :
   * - Défilement de la carte topographique (blit canvas)
   * - Évolution de la lettre (rotation, tampon, pli)
   * - Textes narratifs (apparition/disparition)
   * - Points lumineux (flash unique)
   * @param {number} progress — scroll progress global (0 → 1)
   */
  function handlePhaseJourney(progress) {
    // La Phase 2 vit entre progress 0.05 et 0.65
    if (progress < 0.05 || progress > 0.65) return;

    // Progress normalisé du voyage : 0 (scroll 5%) → 1 (scroll 65%)
    var journeyProgress = (progress - 0.05) / 0.60;

    // 1. Défilement de la carte topographique
    blitTopoCanvas(journeyProgress);

    // 2. Évolution de la lettre
    updateLetterEvolution(progress);

    // 3. Textes narratifs
    for (var i = 0; i < journeyTextTimings.length; i++) {
      updateJourneyText(i, progress);
    }

    // 4. Points lumineux
    checkLightPoints(progress);

    // 5. Modulation audio (bonus) — légère variation selon la zone
    if (typeof setAudioIntensity === 'function') {
      // Volume plus fort dans la sierra et la ville (0.20 → 0.50)
      var audioIntensity = 0.7;
      if (progress > 0.20 && progress < 0.50) {
        audioIntensity = 1.0; // Plus fort dans les zones denses
      } else if (progress > 0.55) {
        audioIntensity = 0.5; // Plus calme dans l'océan
      }
      setAudioIntensity(audioIntensity);
    }
  }

  // ============================================
  // HOOK GLOBAL — Changement de langue
  // ============================================

  /**
   * Reconstruit les textes dynamiques quand la langue change.
   * Appelée par i18n.js → updateAllTexts() → window.onLangChange()
   */
  function onLanguageChange() {
    // Reconstruire le typewriter si visible
    rebuildTypewriter();
    // Reconstruire les textes du voyage (les divs avec data-i18n-array
    // sont aussi mis à jour par updateAllTexts, mais on reconstruit pour sûreté)
    buildJourneyTexts();
  }

  window.onLangChange = onLanguageChange;

  // ============================================
  // DÉMARRAGE
  // ============================================

  document.addEventListener('DOMContentLoaded', init);

})();
