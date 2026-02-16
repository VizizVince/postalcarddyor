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

  // --- LENIS (smooth scroll) ---
  var lenis = null;

  // --- GSAP timeline principale liée au scroll ---
  var masterTimeline = null;

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

    // Cacher toutes les sections sauf l'intro au démarrage
    hideAllSectionsExcept(phaseIntro);

    // Initialiser Lenis pour le smooth scroll
    initLenis();

    // Enregistrer le plugin ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Lancer les animations après un court délai (laisser le DOM se stabiliser)
    // 1.5s = temps avant que le typewriter commence, comme demandé dans la spec
    setTimeout(function () {
      initPhase1Typewriter();
    }, 1500);

    // Configurer le scroll piloté par ScrollTrigger
    initScrollAnimations();
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
  // UTILITAIRE — Cacher toutes les sections sauf une
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

  // ============================================
  // PHASE 1 — TYPEWRITER (texte lettre par lettre)
  // ============================================

  /**
   * Crée les spans pour chaque caractère et anime leur apparition
   * avec un stagger de 60ms via GSAP
   */
  function initPhase1Typewriter() {
    if (!phaseIntro) return;

    // Récupérer le texte traduit
    var text = t('introLine');

    // Créer le conteneur de texte
    var textContainer = document.createElement('div');
    textContainer.id = 'intro-text';

    // Créer un span par caractère
    text.split('').forEach(function (char) {
      var span = document.createElement('span');
      span.className = 'char';
      // Préserver les espaces
      span.textContent = char === ' ' ? '\u00A0' : char;
      textContainer.appendChild(span);
    });

    // Ajouter le curseur clignotant
    var cursor = document.createElement('span');
    cursor.id = 'intro-cursor';
    textContainer.appendChild(cursor);

    // Insérer dans la section intro
    phaseIntro.innerHTML = '';
    phaseIntro.appendChild(textContainer);

    // Animer les caractères un par un (stagger 60ms)
    var chars = textContainer.querySelectorAll('.char');
    gsap.to(chars, {
      opacity: 1,
      duration: 0.05,
      stagger: 0.06, // 60ms entre chaque caractère
      ease: 'none',
    });
  }

  /**
   * Reconstruit le typewriter quand la langue change
   * Appelée par updateAllTexts() via un hook global
   */
  function rebuildTypewriter() {
    if (!phaseIntro) return;
    // Ne reconstruire que si l'intro est visible
    if (phaseIntro.style.visibility === 'hidden') return;

    var text = t('introLine');
    var textContainer = document.getElementById('intro-text');
    if (!textContainer) return;

    // Supprimer les anciens spans
    textContainer.innerHTML = '';

    // Recréer les spans
    text.split('').forEach(function (char) {
      var span = document.createElement('span');
      span.className = 'char';
      span.style.opacity = '1'; // Déjà visible après reconstruction
      span.textContent = char === ' ' ? '\u00A0' : char;
      textContainer.appendChild(span);
    });

    // Remettre le curseur
    var cursor = document.createElement('span');
    cursor.id = 'intro-cursor';
    textContainer.appendChild(cursor);
  }

  // ============================================
  // SCROLL ANIMATIONS — Pilotage par le scroll
  // ============================================

  function initScrollAnimations() {
    if (!scrollContainer) return;

    // Créer un ScrollTrigger global qui surveille le scroll du container
    ScrollTrigger.create({
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,    // Lissage fluide (0.5s de retard)
      onUpdate: function (self) {
        var progress = self.progress; // 0 → 1

        // --- PHASE 1 : Intro (0% → 5%) ---
        handlePhaseIntro(progress);

        // --- PHASE 1→2 : Transition (4% → 5%) ---
        handleTransitionIntroToJourney(progress);
      }
    });
  }

  // ============================================
  // PHASE 1 — Gestion intro au scroll
  // ============================================

  /**
   * Gère le fade out du texte d'intro quand le scroll avance
   * Le texte disparaît entre progress 0.03 et 0.04
   */
  function handlePhaseIntro(progress) {
    var introText = document.getElementById('intro-text');
    if (!introText) return;

    if (progress < 0.03) {
      // Texte visible
      introText.style.opacity = '1';
    } else if (progress >= 0.03 && progress < 0.04) {
      // Fade out progressif entre 3% et 4%
      var fadeProgress = (progress - 0.03) / 0.01;
      introText.style.opacity = String(1 - fadeProgress);
    } else {
      // Complètement invisible après 4%
      introText.style.opacity = '0';
    }
  }

  // ============================================
  // TRANSITION PHASE 1 → PHASE 2
  // ============================================

  /**
   * Crossfade entre l'intro et le voyage entre 4% et 5% du scroll
   * L'intro fade out, le voyage fade in — transition fluide sans flash
   */
  function handleTransitionIntroToJourney(progress) {
    if (!phaseIntro || !phaseJourney) return;

    if (progress < 0.04) {
      // Intro pleinement visible, voyage caché
      phaseIntro.style.opacity = '1';
      phaseIntro.style.visibility = 'visible';
      phaseJourney.style.opacity = '0';
      phaseJourney.style.visibility = 'hidden';
    } else if (progress >= 0.04 && progress < 0.05) {
      // Crossfade sur 1% de scroll
      var crossfade = (progress - 0.04) / 0.01;
      phaseIntro.style.opacity = String(1 - crossfade);
      phaseIntro.style.visibility = 'visible';
      phaseJourney.style.opacity = String(crossfade);
      phaseJourney.style.visibility = 'visible';
    } else {
      // Voyage visible, intro cachée
      phaseIntro.style.opacity = '0';
      phaseIntro.style.visibility = 'hidden';
      phaseJourney.style.opacity = '1';
      phaseJourney.style.visibility = 'visible';
    }
  }

  // ============================================
  // HOOK GLOBAL — Changement de langue
  // ============================================

  // Exposer la fonction de reconstruction du typewriter
  // pour que i18n.js puisse l'appeler lors d'un changement de langue
  window.onLangChange = rebuildTypewriter;

  // ============================================
  // DÉMARRAGE
  // ============================================

  document.addEventListener('DOMContentLoaded', init);

})();
