// ============================================
// AUDIO.JS — Gestion de l'audio ambiant
// Lecture en boucle avec fade in/out, toggle on/off
// ============================================

(function () {
  'use strict';

  // État de l'audio (exposé globalement pour i18n.js)
  var audioActive = false;

  // Volume cible quand l'audio est actif
  var audioTargetVolume = 0.5;

  // Référence au timer de fade en cours (pour pouvoir l'annuler)
  var audioFadeTimer = null;

  // Création de l'élément audio
  var ambientAudio = null;
  try {
    ambientAudio = new Audio('assets/audio/ambient.mp3');
    ambientAudio.loop = true;
    ambientAudio.volume = 0;
    ambientAudio.preload = 'auto';
  } catch (e) {
    console.warn('[audio] Impossible de créer l\'element audio :', e.message);
  }

  /**
   * Fade progressif du volume audio via requestAnimationFrame.
   * @param {number} from — Volume de départ (0 à 1)
   * @param {number} to — Volume cible (0 à 1)
   * @param {number} duration — Durée du fade en ms
   * @param {Function} [callback] — Fonction appelée à la fin du fade
   */
  function fadeAudioVolume(from, to, duration, callback) {
    if (!ambientAudio) {
      if (callback) callback();
      return;
    }

    // Annuler un fade en cours
    if (audioFadeTimer) {
      cancelAnimationFrame(audioFadeTimer);
      audioFadeTimer = null;
    }

    var startTime = performance.now();
    var clampedFrom = Math.max(0, Math.min(1, from));
    ambientAudio.volume = clampedFrom;

    function step(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // Interpolation linéaire entre from et to, clamped entre 0 et 1
      var vol = clampedFrom + (to - clampedFrom) * progress;
      ambientAudio.volume = Math.max(0, Math.min(1, vol));

      if (progress < 1) {
        audioFadeTimer = requestAnimationFrame(step);
      } else {
        audioFadeTimer = null;
        if (callback) callback();
      }
    }

    audioFadeTimer = requestAnimationFrame(step);
  }

  /**
   * Active ou désactive l'audio ambiant avec un fade.
   * Gère correctement le cas où play() est une promesse rejetée.
   */
  function toggleAudio() {
    if (!ambientAudio) return;

    var audioToggle = document.getElementById('audio-toggle');

    if (!audioActive) {
      // Activer — play + fade in sur 2 secondes
      var playPromise = ambientAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(function () {
          // Le play a réussi — mettre à jour l'état APRÈS la confirmation
          audioActive = true;
          fadeAudioVolume(0, audioTargetVolume, 2000);
          if (audioToggle) {
            audioToggle.textContent = t('audioOn');
          }
        }).catch(function (err) {
          // Erreur de lecture (fichier manquant, autoplay bloqué, etc.)
          console.warn('[audio] Lecture impossible :', err.message);
          audioActive = false;
          if (audioToggle) {
            audioToggle.textContent = t('audioOff');
          }
        });
      }
    } else {
      // Désactiver — fade out sur 2 secondes puis pause
      audioActive = false;
      fadeAudioVolume(ambientAudio.volume, 0, 2000, function () {
        ambientAudio.pause();
      });
      if (audioToggle) {
        audioToggle.textContent = t('audioOff');
      }
    }
  }

  /**
   * Permet à app.js de moduler le volume selon le scroll.
   * @param {number} value — Intensité entre 0 et 1
   */
  function setAudioIntensity(value) {
    if (!ambientAudio || !audioActive) return;
    var clampedValue = Math.max(0, Math.min(1, value));
    var newVolume = clampedValue * audioTargetVolume;
    ambientAudio.volume = Math.max(0, Math.min(1, newVolume));
  }

  // --- EXPOSITION GLOBALE ---
  // audioActive doit être lisible par i18n.js pour le texte du toggle
  Object.defineProperty(window, 'audioActive', {
    get: function () { return audioActive; },
    enumerable: true,
    configurable: true
  });

  // setAudioIntensity doit être accessible par app.js
  window.setAudioIntensity = setAudioIntensity;

  // --- INITIALISATION ---
  document.addEventListener('DOMContentLoaded', function () {
    var audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', toggleAudio);
      // Texte initial
      audioToggle.textContent = t('audioOff');
    }
  });

})();
