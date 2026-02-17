// ============================================
// APP.JS — Script principal
// Initialise Lenis, GSAP ScrollTrigger, et orchestre toutes les phases
//
// Architecture : un seul viewport sticky avec des layers empilés.
// Le scroll progress (0→1) pilote TOUT. Pas de sections séparées —
// les éléments (canvas, lettre, textes, postcard) sont affichés/masqués
// par opacity/visibility en fonction du progress.
// ============================================

(function () {
  'use strict';

  // --- RÉFÉRENCES DOM ---
  var scrollContainer = null;
  var viewport = null;
  var phaseIntro = null;
  var topoCanvas = null;
  var topoCtx = null;
  var tableBg = null;
  var letterEl = null;
  var journeyTextsEl = null;
  var lightPointsContainer = null;
  var arrivalText = null;
  var postcardEl = null;
  var phaseConfirmation = null;
  var confirmationText = null;
  var trackingNumberEl = null;
  var confirmationButtons = null;
  var presaveBtn = null;
  var shareBtn = null;

  // --- ÉTAT ---
  var formSubmitted = false;
  var scrollLocked = false;
  var cardFlipped = false;
  // scrollLockApplied supprimé — scroll libre en permanence (sauf post-submit)

  // --- LENIS ---
  var lenis = null;

  // --- CANVAS OFFSCREEN (buffer topographique) ---
  var offscreenCanvas = null;
  var offscreenCtx = null;
  var BUFFER_MULTIPLIER = 5;
  var bufferHeight = 0;
  var bufferWidth = 0;

  // --- DIAMANTS LUMINEUX (étoiles filantes) ---
  var lightPoints = [
    { trigger: 0.09, fired: false },
    { trigger: 0.18, fired: false },
    { trigger: 0.27, fired: false },
    { trigger: 0.36, fired: false },
    { trigger: 0.45, fired: false },
    { trigger: 0.54, fired: false },
    { trigger: 0.62, fired: false },
  ];

  // --- TEXTES NARRATIFS ---
  var journeyTextTimings = [
    { appearAt: 0.10, disappearAt: 0.25 },
    { appearAt: 0.28, disappearAt: 0.43 },
    { appearAt: 0.46, disappearAt: 0.60 },
  ];

  // --- TAILLE INITIALE DE LA LETTRE (récupérée du CSS) ---
  var LETTER_BASE_W = 80;
  var LETTER_BASE_H = 50;

  // ============================================
  // INITIALISATION
  // ============================================

  function init() {
    if (typeof CONFIG === 'undefined') {
      console.error('[app] CONFIG non disponible.');
      return;
    }
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.error('[app] GSAP ou ScrollTrigger non disponible.');
      return;
    }
    if (typeof Lenis === 'undefined') {
      console.error('[app] Lenis non disponible.');
      return;
    }

    // Récupérer les références DOM
    scrollContainer = document.getElementById('scroll-container');
    viewport = document.getElementById('viewport');
    phaseIntro = document.getElementById('phase-intro');
    topoCanvas = document.getElementById('topo-canvas');
    tableBg = document.getElementById('table-bg');
    letterEl = document.getElementById('letter');
    journeyTextsEl = document.getElementById('journey-texts');
    lightPointsContainer = document.getElementById('light-points-container');
    arrivalText = document.getElementById('arrival-text');
    postcardEl = document.getElementById('postcard');
    phaseConfirmation = document.getElementById('phase-confirmation');
    confirmationText = document.getElementById('confirmation-text');
    trackingNumberEl = document.getElementById('tracking-number');
    confirmationButtons = document.getElementById('confirmation-buttons');
    presaveBtn = document.getElementById('presave-btn');
    shareBtn = document.getElementById('share-btn');

    // Canvas
    if (topoCanvas) {
      topoCtx = topoCanvas.getContext('2d');
    }

    // Taille initiale de la lettre selon la taille de l'écran
    if (window.innerWidth < 768) {
      LETTER_BASE_W = 60;
      LETTER_BASE_H = 40;
    }

    // Remonter en haut au chargement (corrige le bug de scroll bloqué après refresh)
    window.scrollTo(0, 0);

    // Initialiser Lenis
    initLenis();

    // Enregistrer ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Construire les éléments Phase 2
    buildJourneyTexts();
    buildLightPoints();

    // Dessiner la carte topographique dans le buffer
    initTopoBuffer();

    // Construire le formulaire (Phase 4)
    if (typeof window.buildPostcardForm === 'function') {
      window.buildPostcardForm();
    }

    // Configurer les boutons Phase 5
    initConfirmationButtons();

    // Typewriter Phase 1 — après 1.5s
    setTimeout(function () {
      initPhase1Typewriter();
    }, 1500);

    // Configurer le scroll piloté
    initScrollAnimations();

    // Resize
    window.addEventListener('resize', debounce(handleResize, 300));
  }

  // ============================================
  // LENIS
  // ============================================

  function initLenis() {
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function handleResize() {
    if (window.innerWidth < 768) {
      LETTER_BASE_W = 60;
      LETTER_BASE_H = 40;
    } else {
      LETTER_BASE_W = 80;
      LETTER_BASE_H = 50;
    }
    initTopoBuffer();
  }

  /** Fonction utilitaire pour afficher/masquer un élément */
  function showEl(el, opacity) {
    if (!el) return;
    el.style.opacity = String(opacity);
    el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
  }

  // ============================================
  // PHASE 1 — TYPEWRITER
  // ============================================

  function initPhase1Typewriter() {
    if (!phaseIntro) return;

    var text = t('introLine');
    var textContainer = document.createElement('div');
    textContainer.id = 'intro-text';

    text.split('').forEach(function (char) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      textContainer.appendChild(span);
    });

    var cursor = document.createElement('span');
    cursor.id = 'intro-cursor';
    textContainer.appendChild(cursor);

    phaseIntro.innerHTML = '';
    phaseIntro.appendChild(textContainer);

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
  // CARTE TOPOGRAPHIQUE — Buffer offscreen
  // ============================================

  function initTopoBuffer() {
    if (!topoCanvas) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    topoCanvas.width = vw;
    topoCanvas.height = vh;

    bufferWidth = vw;
    bufferHeight = vh * BUFFER_MULTIPLIER;

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = bufferWidth;
    offscreenCanvas.height = bufferHeight;
    offscreenCtx = offscreenCanvas.getContext('2d');

    offscreenCtx.fillStyle = CONFIG.colors.background;
    offscreenCtx.fillRect(0, 0, bufferWidth, bufferHeight);

    drawAllZones();
  }

  // --- Dessin des 5 zones ---

  function drawAllZones() {
    if (!offscreenCtx) return;
    var w = bufferWidth;
    var h = bufferHeight;

    drawDesertZone(0, h * 0.25, w);
    drawSierraZone(h * 0.20, h * 0.45, w);
    drawCityZone(h * 0.40, h * 0.65, w);
    drawBorderZone(h * 0.60, h * 0.70, w);
    drawOceanZone(h * 0.65, h, w);
  }

  // Bruit pseudo-aléatoire simple (combinaison de sinus)
  function noise(x, seed) {
    var s = seed || 0;
    return (
      Math.sin(x * 0.01 + s) * 0.5 +
      Math.sin(x * 0.023 + s * 1.3) * 0.3 +
      Math.sin(x * 0.047 + s * 2.1) * 0.15 +
      Math.sin(x * 0.099 + s * 3.7) * 0.05
    );
  }

  function drawTopoLine(yBase, amplitude, seed, width, color, lineWidth) {
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = color;
    offscreenCtx.lineWidth = lineWidth || 0.5;
    for (var x = 0; x <= width; x += 2) {
      var y = yBase + noise(x, seed) * amplitude;
      if (x === 0) offscreenCtx.moveTo(x, y);
      else offscreenCtx.lineTo(x, y);
    }
    offscreenCtx.stroke();
  }

  function drawConcentricCurves(cx, cy, count, baseRadius, spacing, color) {
    for (var ring = 0; ring < count; ring++) {
      var radius = baseRadius + ring * spacing;
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = color;
      offscreenCtx.lineWidth = 0.5;
      var points = 120;
      for (var i = 0; i <= points; i++) {
        var angle = (i / points) * Math.PI * 2;
        var deform = noise(angle * 100, ring * 5 + cx * 0.01) * radius * 0.3;
        var r = radius + deform;
        var x = cx + Math.cos(angle) * r;
        var y = cy + Math.sin(angle) * r;
        if (i === 0) offscreenCtx.moveTo(x, y);
        else offscreenCtx.lineTo(x, y);
      }
      offscreenCtx.closePath();
      offscreenCtx.stroke();
    }
  }

  function drawDesertZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var spacing = 40;
    var numLines = Math.floor((yEnd - yStart) / spacing);
    for (var i = 0; i < numLines; i++) {
      var y = yStart + i * spacing + spacing * 0.5;
      var amplitude = 15 + Math.sin(i * 0.7) * 10;
      drawTopoLine(y, amplitude, i * 3.14, width, lineColor, 0.5);
    }
    drawConcentricCurves(width * 0.3, yStart + (yEnd - yStart) * 0.4, 3, 50, 20, lineColor);
    drawConcentricCurves(width * 0.7, yStart + (yEnd - yStart) * 0.7, 2, 40, 25, lineColor);
  }

  function drawSierraZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var lightColor = CONFIG.colors.topoLinesLight;
    var spacing = 10;
    var numLines = Math.floor((yEnd - yStart) / spacing);
    for (var i = 0; i < numLines; i++) {
      var y = yStart + i * spacing;
      var amplitude = 25 + Math.sin(i * 0.4) * 15;
      var color = (i % 3 === 0) ? lightColor : lineColor;
      drawTopoLine(y, amplitude, i * 2.71 + 100, width, color, 0.5);
    }
    for (var p = 0; p < 5; p++) {
      var cx = width * (0.15 + p * 0.17);
      var cy = yStart + (yEnd - yStart) * (0.3 + Math.sin(p * 1.5) * 0.2);
      drawConcentricCurves(cx, cy, 6, 20, 12, lineColor);
    }
  }

  function drawCityZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var lightColor = CONFIG.colors.topoLinesLight;
    var hSpacing = 20;
    for (var y = yStart; y < yEnd; y += hSpacing) {
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;
      offscreenCtx.moveTo(0, y);
      offscreenCtx.lineTo(width, y);
      offscreenCtx.stroke();
    }
    var vSpacing = 25;
    for (var x = 0; x < width; x += vSpacing) {
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;
      offscreenCtx.moveTo(x, yStart);
      offscreenCtx.lineTo(x, yEnd);
      offscreenCtx.stroke();
    }
    for (var bx = 0; bx < width; bx += vSpacing * 3) {
      for (var by = yStart; by < yEnd; by += hSpacing * 3) {
        if (noise(bx * 0.1, by * 0.1) > 0) {
          offscreenCtx.beginPath();
          offscreenCtx.strokeStyle = lightColor;
          offscreenCtx.lineWidth = 0.3;
          offscreenCtx.rect(bx + 4, by + 4, vSpacing * 2 - 8, hSpacing * 2 - 8);
          offscreenCtx.stroke();
        }
      }
    }
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = lightColor;
    offscreenCtx.lineWidth = 1;
    offscreenCtx.moveTo(0, yStart + (yEnd - yStart) * 0.3);
    offscreenCtx.lineTo(width, yEnd - (yEnd - yStart) * 0.2);
    offscreenCtx.stroke();
  }

  function drawBorderZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var centerY = yStart + (yEnd - yStart) * 0.5;
    for (var i = -3; i <= 3; i++) {
      if (i === 0) continue;
      drawTopoLine(centerY + i * 30, 8, i * 4.2 + 200, width, lineColor, 0.3);
    }
    offscreenCtx.beginPath();
    offscreenCtx.strokeStyle = CONFIG.colors.accent;
    offscreenCtx.lineWidth = 2;
    offscreenCtx.moveTo(0, centerY);
    offscreenCtx.lineTo(width, centerY);
    offscreenCtx.stroke();
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

  function drawOceanZone(yStart, yEnd, width) {
    var lineColor = CONFIG.colors.topoLines;
    var zoneHeight = yEnd - yStart;
    var y = yStart;
    var spacing = 12;
    var lineIndex = 0;
    while (y < yEnd) {
      var progress = (y - yStart) / zoneHeight;
      var alpha = Math.max(0, 1 - progress * 1.2);
      if (alpha <= 0) break;
      offscreenCtx.globalAlpha = alpha;
      offscreenCtx.beginPath();
      offscreenCtx.strokeStyle = lineColor;
      offscreenCtx.lineWidth = 0.5;
      for (var x = 0; x <= width; x += 3) {
        var wave = Math.sin(x * 0.015 + lineIndex * 0.8) * 8 +
                   Math.sin(x * 0.008 + lineIndex * 1.2) * 5;
        var py = y + wave;
        if (x === 0) offscreenCtx.moveTo(x, py);
        else offscreenCtx.lineTo(x, py);
      }
      offscreenCtx.stroke();
      spacing += 2;
      y += spacing;
      lineIndex++;
    }
    offscreenCtx.globalAlpha = 1;
  }

  // --- Blit du canvas visible ---

  function blitTopoCanvas(journeyProgress) {
    if (!topoCtx || !offscreenCanvas) return;
    var vw = topoCanvas.width;
    var vh = topoCanvas.height;
    var maxOffset = bufferHeight - vh;
    var offsetY = Math.floor(journeyProgress * maxOffset);
    topoCtx.clearRect(0, 0, vw, vh);
    topoCtx.drawImage(offscreenCanvas, 0, offsetY, vw, vh, 0, 0, vw, vh);
  }

  // ============================================
  // TEXTES NARRATIFS
  // ============================================

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

  function updateJourneyText(index, progress) {
    if (!journeyTextsEl) return;
    var textEl = journeyTextsEl.children[index];
    if (!textEl) return;

    var timing = journeyTextTimings[index];
    var revealDuration = 0.03;
    var fadeDuration = 0.02;

    if (progress < timing.appearAt) {
      textEl.style.opacity = '0';
      textEl.style.clipPath = 'inset(0 100% 0 0)';
    } else if (progress < timing.appearAt + revealDuration) {
      var revealProgress = (progress - timing.appearAt) / revealDuration;
      textEl.style.opacity = '0.6';
      textEl.style.clipPath = 'inset(0 ' + ((1 - revealProgress) * 100) + '% 0 0)';
    } else if (progress < timing.disappearAt - fadeDuration) {
      textEl.style.opacity = '0.6';
      textEl.style.clipPath = 'inset(0 0% 0 0)';
    } else if (progress < timing.disappearAt) {
      var fadeProgress = (progress - (timing.disappearAt - fadeDuration)) / fadeDuration;
      textEl.style.opacity = String(0.6 * (1 - fadeProgress));
      textEl.style.clipPath = 'inset(0 0% 0 0)';
    } else {
      textEl.style.opacity = '0';
    }
  }

  // ============================================
  // POINTS LUMINEUX
  // ============================================

  function buildLightPoints() {
    // Les diamants sont créés dynamiquement à chaque trigger — pas besoin de pré-construire
    if (!lightPointsContainer) return;
    lightPointsContainer.innerHTML = '';
  }

  function checkLightPoints(progress) {
    if (!lightPointsContainer) return;

    lightPoints.forEach(function (point) {
      if (progress >= point.trigger && !point.fired) {
        point.fired = true;
        spawnShootingStar();
      }
      // Réinitialiser si on remonte avant le trigger (permet re-trigger au re-scroll)
      if (progress < point.trigger - 0.02 && point.fired) {
        point.fired = false;
      }
    });
  }

  /**
   * Crée un diamant étoile filante qui traverse l'écran en ~2s.
   * Apparition douce en fade, trajectoire diagonale DESCENDANTE variée,
   * disparition progressive en fin de course.
   * Positions de départ variées sur tout le viewport.
   * Trajectoires : toujours vers le bas, jamais horizontales ni vers le haut.
   */
  function spawnShootingStar() {
    if (!lightPointsContainer) return;

    var diamond = document.createElement('div');
    diamond.className = 'light-point';

    // Position de départ variée sur tout l'écran
    var startX = 5 + Math.random() * 90;  // 5%–95% de la largeur
    var startY = 5 + Math.random() * 50;  // 5%–55% de la hauteur

    diamond.style.left = startX + '%';
    diamond.style.top = startY + '%';

    lightPointsContainer.appendChild(diamond);

    // Direction horizontale aléatoire : gauche OU droite
    var dirX = Math.random() > 0.5 ? 1 : -1;

    // travelX : composante horizontale (peut aller à gauche ou à droite)
    var travelX = dirX * (100 + Math.random() * 250);

    // travelY : TOUJOURS positif (vers le bas), minimum significatif
    // pour éviter les trajectoires horizontales
    var travelY = 150 + Math.random() * 300;

    // Angle de la traînée — suit la direction du mouvement
    var moveAngle = Math.atan2(travelY, travelX) * (180 / Math.PI);
    // La traînée du ::after est à droite du diamant, on doit la faire pointer
    // dans la direction opposée au mouvement (elle traîne derrière)
    var trailRotation = moveAngle + 180 + 45; // +45 car le diamant est rotate(45deg) de base

    // Orienter la traînée CSS selon la trajectoire
    diamond.style.setProperty('--trail-angle', (moveAngle + 180) + 'deg');

    gsap.timeline({
      onComplete: function () {
        if (diamond.parentNode) diamond.parentNode.removeChild(diamond);
      }
    })
    // Phase 1 : apparition douce (0.4s)
    .to(diamond, {
      opacity: 0.7,
      scale: 1.2,
      duration: 0.4,
      ease: 'power2.out',
    })
    // Phase 2 : course d'étoile filante (1.2s)
    .to(diamond, {
      x: travelX,
      y: travelY,
      rotation: trailRotation,
      scale: 0.6,
      opacity: 0.5,
      duration: 1.2,
      ease: 'power1.in',
    })
    // Phase 3 : disparition (0.4s)
    .to(diamond, {
      opacity: 0,
      scale: 0.2,
      x: '+=' + (travelX * 0.2),
      y: '+=' + (travelY * 0.2),
      duration: 0.4,
      ease: 'power2.in',
    });
  }

  // ============================================
  // ÉVOLUTION DE LA LETTRE
  // ============================================

  /**
   * Calcule la position et rotation de la lettre pendant Phase 2.
   * La lettre suit un chemin sinusoïdal (zig-zag arrondi) pour
   * mimer un vrai cheminement postal à travers le paysage.
   */
  function updateLetterEvolution(progress) {
    if (!letterEl) return;

    // Normaliser le progrès dans Phase 2 (0.05→0.65) en t (0→1)
    var t = (progress - 0.05) / 0.60;
    t = Math.max(0, Math.min(1, t));

    // Zig-zag sinusoïdal — amplitude décroissante vers la fin (arrivée)
    // 3 oscillations complètes sur le trajet
    // Amplitude réduite car la carte grossit progressivement
    var amplitude = 100 * (1 - t * 0.6); // 100px → 40px
    var frequency = 3; // 3 courbes
    var xOffset = Math.sin(t * frequency * Math.PI * 2) * amplitude;

    // Légère dérive verticale (la lettre "descend" un peu)
    var yOffset = Math.sin(t * Math.PI) * -20; // légère remontée au milieu

    // Rotation qui suit la tangente de la courbe
    var tangent = Math.cos(t * frequency * Math.PI * 2) * frequency * Math.PI * 2;
    var rotation = tangent * 0.8; // atténuer pour garder subtil
    rotation = Math.max(-8, Math.min(8, rotation)); // clamp à ±8°

    letterEl.style.transform = 'translate(calc(-50% + ' + xOffset + 'px), calc(-50% + ' + yOffset + 'px)) rotate(' + rotation.toFixed(2) + 'deg)';

    // Tampon à ~30%
    if (progress >= 0.30) {
      letterEl.classList.add('has-stamp');
    } else {
      letterEl.classList.remove('has-stamp');
    }

    // Coin corné à ~50%
    if (progress >= 0.50) {
      letterEl.classList.add('has-fold');
    } else {
      letterEl.classList.remove('has-fold');
    }
  }

  // ============================================
  // SCROLL ANIMATIONS — LE CŒUR DU SYSTÈME
  //
  // Répartition du scroll progress (0 → 1) :
  //   Phase 1 : 0.00 → 0.05  (Intro typewriter)
  //   Phase 2 : 0.05 → 0.65  (Voyage carte topo)
  //   Phase 3 : 0.65 → 0.80  (Arrivée — zoom lettre, table apparaît)
  //   Phase 4 : 0.80 → 0.95  (Formulaire carte postale)
  //   Phase 5 : après soumission (hors scroll)
  // ============================================

  function initScrollAnimations() {
    if (!scrollContainer) return;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: function (self) {
        if (formSubmitted) return;

        var progress = self.progress; // 0 → 1
        updateAllPhases(progress);
      }
    });
  }

  /**
   * Fonction maîtresse — met à jour TOUS les éléments visuels
   * selon le scroll progress global.
   * Chaque élément gère son propre affichage (opacity, visibility, transform)
   * de manière continue. Pas de sections discrètes.
   */
  function updateAllPhases(progress) {

    // ================================================
    // PHASE 1 : INTRO (0.00 → 0.05)
    // ================================================

    if (phaseIntro) {
      if (progress < 0.04) {
        // Intro visible
        phaseIntro.style.opacity = '1';
        phaseIntro.style.visibility = 'visible';
      } else if (progress < 0.05) {
        // Fade out intro
        var introFade = (progress - 0.04) / 0.01;
        phaseIntro.style.opacity = String(1 - introFade);
        phaseIntro.style.visibility = 'visible';
      } else {
        phaseIntro.style.opacity = '0';
        phaseIntro.style.visibility = 'hidden';
      }

      // Fade du texte typewriter avant la disparition de l'intro
      var introText = document.getElementById('intro-text');
      if (introText) {
        if (progress < 0.03) {
          introText.style.opacity = '1';
        } else if (progress < 0.04) {
          introText.style.opacity = String(1 - (progress - 0.03) / 0.01);
        } else {
          introText.style.opacity = '0';
        }
      }
    }

    // ================================================
    // CANVAS TOPOGRAPHIQUE (visible de 0.04 → 0.78)
    // ================================================

    if (topoCanvas) {
      if (progress >= 0.04 && progress <= 0.78) {
        // Canvas apparaît
        var canvasIn = Math.min(1, (progress - 0.04) / 0.02); // fade in 0.04→0.06
        // Canvas disparaît (blur + fade) pendant phase 3
        var canvasOut = progress > 0.65 ? Math.min(1, (progress - 0.65) / 0.10) : 0;
        var canvasOpacity = canvasIn * (1 - canvasOut);

        topoCanvas.style.opacity = String(canvasOpacity);
        topoCanvas.style.visibility = canvasOpacity > 0.01 ? 'visible' : 'hidden';

        // Blur progressif en phase 3 (0.65 → 0.75)
        var blurAmount = canvasOut * 10;
        topoCanvas.style.filter = blurAmount > 0 ? 'blur(' + blurAmount + 'px)' : 'none';

        // Blit de la carte — le scroll pilote l'offset Y
        if (progress >= 0.05 && progress <= 0.65) {
          var journeyProgress = (progress - 0.05) / 0.60;
          blitTopoCanvas(journeyProgress);
        } else if (progress > 0.65) {
          // Rester sur le bas de la carte pendant la transition
          blitTopoCanvas(1);
        }
      } else {
        topoCanvas.style.opacity = '0';
        topoCanvas.style.visibility = 'hidden';
      }
    }

    // ================================================
    // FOND TABLE (apparaît en phase 3: 0.65 → 0.75, persiste en phases 4-5)
    // ================================================

    if (tableBg) {
      if (progress >= 0.65) {
        var tableIn = Math.min(1, (progress - 0.65) / 0.10);
        tableBg.style.opacity = String(tableIn);
        tableBg.style.visibility = 'visible';
      } else {
        tableBg.style.opacity = '0';
        tableBg.style.visibility = 'hidden';
      }
    }

    // ================================================
    // LA LETTRE (visible de 0.04 → 0.82)
    // Grandit en phase 3 (0.65→0.80), disparaît quand le postcard apparaît
    // ================================================

    if (letterEl) {
      if (progress >= 0.04 && progress <= 0.82) {
        var letterIn = Math.min(1, (progress - 0.04) / 0.02);
        var letterOut = progress > 0.80 ? Math.min(1, (progress - 0.80) / 0.02) : 0;
        var letterOpacity = letterIn * (1 - letterOut);

        letterEl.style.opacity = String(letterOpacity);
        letterEl.style.visibility = letterOpacity > 0.01 ? 'visible' : 'hidden';

        // Taille finale = dimensions du postcard (face avant)
        var postcardW = Math.min(window.innerWidth * 0.9, 600);
        var postcardH = Math.min(window.innerWidth * 0.65, 380);
        if (window.innerWidth < 768) {
          postcardW = window.innerWidth * 0.92;
          postcardH = postcardW * 0.63;
        }

        // Seuil de la ligne rouge (border zone) en scroll progress
        // Border = 60-70% du buffer, milieu ≈ 65%. Journey: 0.05→0.65
        var borderScrollProgress = 0.44;

        // Phase 2 : taille grossit de base → 30% du chemin vers postcardW/H
        if (progress >= 0.05 && progress <= 0.65) {
          var journeyT = (progress - 0.05) / 0.60;
          journeyT = Math.max(0, Math.min(1, journeyT));

          // Avant la ligne rouge : 0% → 30% de la taille finale
          // Après la ligne rouge (mais encore en phase 2) : 30% → ~45%
          var sizeProgress;
          if (progress <= borderScrollProgress) {
            var beforeBorderT = (progress - 0.05) / (borderScrollProgress - 0.05);
            sizeProgress = beforeBorderT * 0.30; // 0 → 30%
          } else {
            var afterBorderT = (progress - borderScrollProgress) / (0.65 - borderScrollProgress);
            sizeProgress = 0.30 + afterBorderT * 0.15; // 30% → 45%
          }

          var w = LETTER_BASE_W + (postcardW - LETTER_BASE_W) * sizeProgress;
          var h = LETTER_BASE_H + (postcardH - LETTER_BASE_H) * sizeProgress;
          letterEl.style.width = w + 'px';
          letterEl.style.height = h + 'px';

          updateLetterEvolution(progress);
        }
        // Phase 3 : la carte grossit de 45% → 100% de la taille postcard
        else if (progress > 0.65 && progress <= 0.80) {
          var arrivalProgress = (progress - 0.65) / 0.15;
          var startSizeProgress = 0.45;
          var sizeProgress3 = startSizeProgress + (1 - startSizeProgress) * arrivalProgress;

          var w = LETTER_BASE_W + (postcardW - LETTER_BASE_W) * sizeProgress3;
          var h = LETTER_BASE_H + (postcardH - LETTER_BASE_H) * sizeProgress3;

          letterEl.style.width = w + 'px';
          letterEl.style.height = h + 'px';
          letterEl.style.transform = 'translate(-50%, -50%)';

          // Ombre portée croissante (pas de glow blanc pour éviter les artefacts)
          var shadow = 12 + arrivalProgress * 30;
          letterEl.style.boxShadow = '0 4px ' + shadow + 'px rgba(0,0,0,' + (0.3 + arrivalProgress * 0.3) + ')';

          // Nettoyer les classes de la phase 2
          letterEl.classList.remove('has-stamp', 'has-fold');
        }
      } else {
        letterEl.style.opacity = '0';
        letterEl.style.visibility = 'hidden';
      }
    }

    // ================================================
    // TEXTES NARRATIFS (phase 2 : 0.05 → 0.65)
    // ================================================

    if (journeyTextsEl) {
      if (progress >= 0.05 && progress <= 0.65) {
        journeyTextsEl.style.opacity = '1';
        journeyTextsEl.style.visibility = 'visible';
        for (var i = 0; i < journeyTextTimings.length; i++) {
          updateJourneyText(i, progress);
        }
      } else {
        journeyTextsEl.style.opacity = '0';
        journeyTextsEl.style.visibility = 'hidden';
      }
    }

    // ================================================
    // POINTS LUMINEUX (phase 2 : 0.05 → 0.65)
    // ================================================

    if (lightPointsContainer) {
      if (progress >= 0.05 && progress <= 0.65) {
        lightPointsContainer.style.opacity = '1';
        lightPointsContainer.style.visibility = 'visible';
        checkLightPoints(progress);
      } else {
        lightPointsContainer.style.opacity = '0';
        lightPointsContainer.style.visibility = 'hidden';
      }
    }

    // ================================================
    // TEXTE D'ARRIVÉE (phase 3 : apparaît vers 0.75, disparaît vers 0.82)
    // ================================================

    if (arrivalText) {
      if (progress >= 0.73 && progress <= 0.84) {
        var arrTextIn = Math.min(1, (progress - 0.73) / 0.04); // fade in 0.73→0.77
        var arrTextOut = progress > 0.80 ? Math.min(1, (progress - 0.80) / 0.04) : 0;
        arrivalText.style.opacity = String(arrTextIn * (1 - arrTextOut) * 0.9);
      } else {
        arrivalText.style.opacity = '0';
      }
    }

    // ================================================
    // CARTE POSTALE / FORMULAIRE (phase 4 : 0.80 → 0.95)
    // ================================================

    if (postcardEl) {
      if (progress >= 0.78 && !formSubmitted) {
        var postcardIn = Math.min(1, (progress - 0.78) / 0.04); // fade in 0.78→0.82
        postcardEl.style.opacity = String(postcardIn);
        postcardEl.style.visibility = postcardIn > 0.01 ? 'visible' : 'hidden';

        // Scale d'entrée : 0.8 → 1
        var formProgress = Math.min(1, (progress - 0.80) / 0.15);
        var scale = 0.8 + Math.min(formProgress * 2, 1) * 0.2;
        postcardEl.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';

        // Flip à ~85% du scroll — réversible quand on remonte
        if (progress >= 0.85) {
          if (!cardFlipped) {
            cardFlipped = true;
            postcardEl.classList.add('flipped');
          }
        } else {
          if (cardFlipped) {
            cardFlipped = false;
            postcardEl.classList.remove('flipped');
          }
        }

        // Pas de scroll lock — l'utilisateur peut naviguer librement
      } else if (!formSubmitted) {
        postcardEl.style.opacity = '0';
        postcardEl.style.visibility = 'hidden';
        // Réinitialiser le flip si on remonte avant la zone postcard
        if (cardFlipped) {
          cardFlipped = false;
          postcardEl.classList.remove('flipped');
        }
      }
    }

    // ================================================
    // AUDIO — modulation par zone (bonus)
    // ================================================

    if (typeof window.setAudioIntensity === 'function') {
      var audioIntensity = 0.7;
      if (progress > 0.20 && progress < 0.50) {
        audioIntensity = 1.0;
      } else if (progress > 0.55) {
        audioIntensity = 0.5;
      }
      window.setAudioIntensity(audioIntensity);
    }
  }

  // ============================================
  // SCROLL LOCK / UNLOCK
  // ============================================

  function lockScroll() {
    scrollLocked = true;
    if (lenis) lenis.stop();
  }

  function unlockScroll() {
    scrollLocked = false;
    if (lenis) lenis.start();
  }

  // ============================================
  // PHASE 5 — CONFIRMATION (après soumission)
  // ============================================

  function showConfirmation(data) {
    formSubmitted = true;

    // Masquer le postcard avec animation
    gsap.to(postcardEl, {
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: function () {
        postcardEl.style.visibility = 'hidden';

        // Afficher le fond noir (masquer la table progressivement)
        gsap.to(tableBg, { opacity: 0, duration: 1, ease: 'power2.inOut' });

        // Masquer le texte d'arrivée
        if (arrivalText) arrivalText.style.opacity = '0';

        // Afficher la Phase 5
        phaseConfirmation.style.visibility = 'visible';
        phaseConfirmation.style.opacity = '1';

        animateConfirmation(data);
      }
    });
  }

  function animateConfirmation(data) {
    var tl = gsap.timeline();

    // 1. Texte principal
    tl.fromTo(confirmationText,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // 2. Numéro de tracking
    var trackingPrefix = t('trackingPrefix');
    var trackingCode = (typeof window.generateTrackingNumber === 'function')
      ? window.generateTrackingNumber()
      : 'MX-000000-0000';
    var fullTracking = trackingPrefix + trackingCode;

    tl.add(function () {
      typewriterEffect(trackingNumberEl, fullTracking, 40);
    }, '+=0.3');

    // 3. Boutons
    tl.to(confirmationButtons,
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
      '+=0.8'
    );

    // Déverrouiller le scroll
    tl.add(function () {
      unlockScroll();
    }, '+=0.2');
  }

  function typewriterEffect(el, text, speed) {
    if (!el) return;
    el.textContent = '';
    el.style.opacity = '1';
    var i = 0;
    function addChar() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(addChar, speed);
      }
    }
    addChar();
  }

  function initConfirmationButtons() {
    if (presaveBtn) {
      presaveBtn.href = CONFIG.presaveLink || '#';
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        if (typeof window.handleShare === 'function') {
          window.handleShare();
        }
      });
    }
  }

  // Callback formulaire (exposée pour form.js)
  window.onFormSubmit = showConfirmation;

  // ============================================
  // CHANGEMENT DE LANGUE
  // ============================================

  function onLanguageChange() {
    rebuildTypewriter();
    buildJourneyTexts();
    if (typeof window.updateFormLabels === 'function') {
      window.updateFormLabels();
    }
  }

  window.onLangChange = onLanguageChange;

  // ============================================
  // DÉMARRAGE
  // ============================================

  document.addEventListener('DOMContentLoaded', init);

})();
