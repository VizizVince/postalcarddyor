// ============================================
// AUDIO.JS — Gestion de l'audio ambiant
// Lecture en boucle avec fade in/out, toggle on/off
// ============================================

// État de l'audio (utilisé aussi par i18n.js pour le texte du toggle)
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
  // Pré-charger sans bloquer — ignorer l'erreur si le fichier n'existe pas
  ambientAudio.preload = 'auto';
} catch (e) {
  console.warn('[audio] Impossible de créer l\'élément audio :', e.message);
}

/**
 * Fade progressif du volume audio
 * @param {number} from — Volume de départ (0 à 1)
 * @param {number} to — Volume cible (0 à 1)
 * @param {number} duration — Durée du fade en ms
 * @param {Function} [callback] — Fonction appelée à la fin du fade
 */
function fadeAudioVolume(from, to, duration, callback) {
  if (!ambientAudio) return;

  // Annuler un fade en cours
  if (audioFadeTimer) {
    cancelAnimationFrame(audioFadeTimer);
    audioFadeTimer = null;
  }

  var startTime = performance.now();
  ambientAudio.volume = Math.max(0, Math.min(1, from));

  function step(now) {
    var elapsed = now - startTime;
    var progress = Math.min(elapsed / duration, 1);
    // Interpolation linéaire entre from et to
    ambientAudio.volume = Math.max(0, Math.min(1, from + (to - from) * progress));

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
 * Active ou désactive l'audio ambiant avec un fade
 */
function toggleAudio() {
  if (!ambientAudio) return;

  if (!audioActive) {
    // Activer — play + fade in sur 2 secondes
    var playPromise = ambientAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(function() {
        fadeAudioVolume(0, audioTargetVolume, 2000);
      }).catch(function(err) {
        // Erreur de lecture (fichier manquant, autoplay bloqué, etc.)
        console.warn('[audio] Lecture impossible :', err.message);
      });
    }
    audioActive = true;
  } else {
    // Désactiver — fade out sur 2 secondes puis pause
    fadeAudioVolume(ambientAudio.volume, 0, 2000, function() {
      ambientAudio.pause();
    });
    audioActive = false;
  }

  // Mettre à jour le texte du toggle
  var audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    audioToggle.textContent = audioActive ? t('audioOn') : t('audioOff');
  }
}

/**
 * Permet à app.js de moduler le volume selon le scroll (bonus)
 * @param {number} value — Intensité entre 0 et 1
 */
function setAudioIntensity(value) {
  if (!ambientAudio || !audioActive) return;
  // Moduler le volume cible (ne pas dépasser audioTargetVolume)
  var newVolume = Math.max(0, Math.min(audioTargetVolume, value * audioTargetVolume));
  ambientAudio.volume = newVolume;
}

// --- INITIALISATION ---
// Brancher le clic du toggle audio
document.addEventListener('DOMContentLoaded', function() {
  var audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    audioToggle.addEventListener('click', toggleAudio);
    // Texte initial
    audioToggle.textContent = t('audioOff');
  }
});
