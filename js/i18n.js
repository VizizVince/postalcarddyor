// ============================================
// I18N.JS — Système de traduction bilingue (ES/EN)
// Gère le changement de langue et la mise à jour des textes du DOM
// ============================================

(function () {
  'use strict';

  // Langue courante — récupérée depuis localStorage ou espagnol par défaut
  // Validation : on n'accepte que 'es' ou 'en'
  var storedLang = null;
  try {
    storedLang = localStorage.getItem('lang');
  } catch (e) {
    // localStorage peut être indisponible (navigation privée sur certains navigateurs)
  }
  var currentLang = (storedLang === 'en') ? 'en' : 'es';

  /**
   * Récupère un texte traduit depuis CONFIG selon la langue courante.
   * @param {string} key — Clé du texte dans CONFIG.textES / CONFIG.textEN
   * @returns {string|Array} Le texte dans la langue active, ou la clé si introuvable
   */
  function t(key) {
    if (typeof CONFIG === 'undefined') {
      console.warn('[i18n] CONFIG non disponible');
      return key;
    }
    var langKey = 'text' + currentLang.toUpperCase();
    var texts = CONFIG[langKey];
    if (!texts || texts[key] === undefined) {
      console.warn('[i18n] Cle manquante : "' + key + '" pour la langue "' + currentLang + '"');
      return key;
    }
    return texts[key];
  }

  /**
   * Récupère le label d'un champ de formulaire dans la langue courante.
   * @param {string} fieldId — L'id du champ (ex: "nombre", "email")
   * @param {string} prop — La propriété de base (ex: "label")
   * @returns {string} Le label traduit
   */
  function tField(fieldId, prop) {
    if (typeof CONFIG === 'undefined' || !Array.isArray(CONFIG.formFields)) {
      return fieldId;
    }
    var field = null;
    for (var i = 0; i < CONFIG.formFields.length; i++) {
      if (CONFIG.formFields[i].id === fieldId) {
        field = CONFIG.formFields[i];
        break;
      }
    }
    if (!field) {
      console.warn('[i18n] Champ de formulaire introuvable : "' + fieldId + '"');
      return fieldId;
    }
    // Construire la clé selon la langue : "labelES" ou "labelEN"
    var langSuffix = currentLang.toUpperCase();
    var fullProp = prop + langSuffix;
    return field[fullProp] || fieldId;
  }

  /**
   * Bascule entre espagnol et anglais.
   * Sauvegarde le choix dans localStorage et met à jour tous les textes.
   */
  function switchLang() {
    currentLang = (currentLang === 'es') ? 'en' : 'es';
    try {
      localStorage.setItem('lang', currentLang);
    } catch (e) {
      // localStorage indisponible — la préférence ne sera pas persistée
    }
    // Mettre à jour l'attribut lang du document pour l'accessibilité
    document.documentElement.lang = currentLang;
    updateAllTexts();
  }

  /**
   * Met à jour tous les éléments du DOM portant un attribut data-i18n.
   * Gère aussi les tableaux (data-i18n-array + data-i18n-index)
   * et le texte du toggle langue.
   */
  function updateAllTexts() {
    // Mettre à jour les éléments simples : data-i18n="key"
    var simpleEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < simpleEls.length; i++) {
      var el = simpleEls[i];
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    }

    // Mettre à jour les éléments de tableau : data-i18n-array + data-i18n-index
    var arrayEls = document.querySelectorAll('[data-i18n-array]');
    for (var j = 0; j < arrayEls.length; j++) {
      var arrEl = arrayEls[j];
      var arrayKey = arrEl.getAttribute('data-i18n-array');
      var index = parseInt(arrEl.getAttribute('data-i18n-index'), 10);
      var arr = t(arrayKey);
      if (Array.isArray(arr) && arr[index] !== undefined) {
        arrEl.textContent = arr[index];
      }
    }

    // Mettre à jour le toggle langue lui-même
    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.textContent = t('langToggle');
    }

    // Mettre à jour le toggle audio (son texte dépend de la langue)
    var audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
      var isOn = false;
      try {
        isOn = window.audioActive;
      } catch (e) {
        // audioActive pas encore défini
      }
      audioToggle.textContent = isOn ? t('audioOn') : t('audioOff');
    }

    // Notifier app.js du changement de langue (reconstruction typewriter, etc.)
    if (typeof window.onLangChange === 'function') {
      window.onLangChange();
    }
  }

  // --- EXPOSITION GLOBALE ---
  // Ces fonctions doivent être accessibles par les autres modules
  window.t = t;
  window.tField = tField;
  window.switchLang = switchLang;
  window.updateAllTexts = updateAllTexts;

  // currentLang doit être lisible par form.js pour le partage
  Object.defineProperty(window, 'currentLang', {
    get: function () { return currentLang; },
    enumerable: true,
    configurable: true
  });

  // --- INITIALISATION ---
  document.addEventListener('DOMContentLoaded', function () {
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = currentLang;

    // Brancher le clic du toggle langue
    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', switchLang);
    }
    // Initialiser les textes au chargement
    updateAllTexts();
  });

})();
