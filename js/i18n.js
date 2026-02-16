// ============================================
// I18N.JS — Système de traduction bilingue (ES/EN)
// Gère le changement de langue et la mise à jour des textes du DOM
// ============================================

// Langue courante — récupérée depuis localStorage ou espagnol par défaut
let currentLang = localStorage.getItem('lang') || 'es';

/**
 * Récupère un texte traduit depuis CONFIG selon la langue courante
 * @param {string} key — Clé du texte dans CONFIG.textES / CONFIG.textEN
 * @returns {string} Le texte dans la langue active
 */
function t(key) {
  const langKey = 'text' + currentLang.toUpperCase();
  const texts = CONFIG[langKey];
  if (!texts || texts[key] === undefined) {
    console.warn(`[i18n] Clé manquante : "${key}" pour la langue "${currentLang}"`);
    return key;
  }
  return texts[key];
}

/**
 * Récupère le label d'un champ de formulaire dans la langue courante
 * @param {string} fieldId — L'id du champ (ex: "nombre", "email")
 * @param {string} prop — La propriété de base (ex: "label")
 * @returns {string} Le label traduit
 */
function tField(fieldId, prop) {
  const field = CONFIG.formFields.find(function(f) { return f.id === fieldId; });
  if (!field) {
    console.warn(`[i18n] Champ de formulaire introuvable : "${fieldId}"`);
    return fieldId;
  }
  // Construire la clé selon la langue : "labelES" ou "labelEN"
  const langSuffix = currentLang.toUpperCase();
  const fullProp = prop + langSuffix;
  return field[fullProp] || fieldId;
}

/**
 * Bascule entre espagnol et anglais
 * Sauvegarde le choix dans localStorage et met à jour tous les textes
 */
function switchLang() {
  currentLang = (currentLang === 'es') ? 'en' : 'es';
  localStorage.setItem('lang', currentLang);
  updateAllTexts();
}

/**
 * Met à jour tous les éléments du DOM portant un attribut data-i18n
 * Gère aussi les tableaux (data-i18n-array + data-i18n-index)
 * et le texte du toggle langue
 */
function updateAllTexts() {
  // Mettre à jour les éléments simples : data-i18n="key"
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Mettre à jour les éléments de tableau : data-i18n-array="journeyTexts" data-i18n-index="0"
  document.querySelectorAll('[data-i18n-array]').forEach(function(el) {
    var arrayKey = el.getAttribute('data-i18n-array');
    var index = parseInt(el.getAttribute('data-i18n-index'), 10);
    var arr = t(arrayKey);
    if (Array.isArray(arr) && arr[index] !== undefined) {
      el.textContent = arr[index];
    }
  });

  // Mettre à jour le toggle langue lui-même
  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = t('langToggle');
  }

  // Mettre à jour le toggle audio (son texte dépend de la langue)
  var audioToggle = document.getElementById('audio-toggle');
  if (audioToggle) {
    // Conserver l'état actuel (on/off) — audioActive est défini dans audio.js
    var isOn = (typeof audioActive !== 'undefined') ? audioActive : false;
    audioToggle.textContent = isOn ? t('audioOn') : t('audioOff');
  }
}

// --- INITIALISATION ---
// Brancher le clic du toggle langue
document.addEventListener('DOMContentLoaded', function() {
  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', switchLang);
  }
  // Initialiser les textes au chargement
  updateAllTexts();
});
