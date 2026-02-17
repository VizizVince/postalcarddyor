// ============================================
// FORM.JS — Génération et gestion du formulaire carte postale
// Crée les champs depuis CONFIG.formFields, valide et envoie vers Google Sheets
// ============================================

(function () {
  'use strict';

  var formEl = null;
  var submitBtn = null;
  var isSubmitting = false;

  // Anti-spam : délai minimum entre deux soumissions (5 secondes)
  var lastSubmitTime = 0;
  var SUBMIT_COOLDOWN = 5000;

  // Numéro de tracking généré lors de l'envoi
  var currentTrackingNumber = '';

  // ============================================
  // SANITIZATION — Protection contre les injections
  // ============================================

  /**
   * Nettoie une chaîne de caractères pour éviter les injections XSS.
   * Échappe les caractères HTML spéciaux.
   * @param {string} str — chaîne à nettoyer
   * @returns {string} chaîne sécurisée
   */
  function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Nettoie une valeur brute de champ (trim + longueur max).
   * @param {string} value — valeur brute
   * @param {number} maxLen — longueur maximale autorisée
   * @returns {string} valeur nettoyée
   */
  function cleanFieldValue(value, maxLen) {
    if (typeof value !== 'string') return '';
    var trimmed = value.trim();
    if (maxLen && trimmed.length > maxLen) {
      trimmed = trimmed.substring(0, maxLen);
    }
    return trimmed;
  }

  // ============================================
  // CONSTRUCTION DU FORMULAIRE
  // ============================================

  /**
   * Génère les champs du formulaire depuis CONFIG.formFields.
   * Chaque champ est un div.form-field contenant un label et un input.
   */
  function buildForm() {
    formEl = document.getElementById('postcard-form');
    submitBtn = document.getElementById('submit-btn');
    if (!formEl) return;

    formEl.innerHTML = '';

    CONFIG.formFields.forEach(function (field) {
      var wrapper = document.createElement('div');
      wrapper.className = 'form-field';

      var label = document.createElement('label');
      label.setAttribute('for', 'field-' + field.id);
      label.textContent = tField(field.id, 'label');
      label.setAttribute('data-field-id', field.id);

      var input = document.createElement('input');
      input.type = (field.id === 'email') ? 'email' : 'text';
      input.id = 'field-' + field.id;
      input.name = field.id;
      input.required = field.required;
      input.autocomplete = 'off';

      // Limiter la longueur des entrées pour éviter les abus
      if (field.id === 'email') {
        input.maxLength = 254; // Longueur max RFC 5321
      } else if (field.id === 'nombre') {
        input.maxLength = 100;
      } else if (field.id === 'direccion') {
        input.maxLength = 200;
      } else if (field.id === 'ciudad') {
        input.maxLength = 100;
      } else {
        input.maxLength = 200; // Défaut raisonnable pour tout champ
      }

      // Retirer l'erreur quand l'utilisateur tape
      input.addEventListener('input', function () {
        wrapper.classList.remove('field-error');
        // Retirer le message d'erreur global s'il existe
        clearFormError();
      });

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      formEl.appendChild(wrapper);
    });

    // Brancher le bouton d'envoi
    if (submitBtn) {
      submitBtn.addEventListener('click', handleSubmit);
    }
  }

  /**
   * Met à jour les labels du formulaire lors d'un changement de langue.
   */
  function updateFormLabels() {
    if (!formEl) return;

    formEl.querySelectorAll('label[data-field-id]').forEach(function (label) {
      var fieldId = label.getAttribute('data-field-id');
      label.textContent = tField(fieldId, 'label');
    });

    if (submitBtn) {
      submitBtn.textContent = t('submitButton');
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Valide tous les champs requis.
   * @returns {boolean} true si tout est valide
   */
  function validateForm() {
    var valid = true;

    CONFIG.formFields.forEach(function (field) {
      if (!field.required) return;

      var input = document.getElementById('field-' + field.id);
      if (!input) return;

      var value = cleanFieldValue(input.value, input.maxLength);
      var wrapper = input.parentElement;

      if (!value) {
        wrapper.classList.add('field-error');
        valid = false;
        return;
      }

      // Validation email
      if (field.id === 'email') {
        // Regex RFC 5322 simplifiée mais robuste
        var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (!emailRegex.test(value)) {
          wrapper.classList.add('field-error');
          valid = false;
        }
      }
    });

    return valid;
  }

  // ============================================
  // MESSAGES D'ERREUR
  // ============================================

  /**
   * Affiche un message d'erreur sous le formulaire.
   * @param {string} message — le message à afficher
   */
  function showFormError(message) {
    clearFormError();
    if (!formEl) return;

    var errorEl = document.createElement('div');
    errorEl.id = 'form-error-message';
    errorEl.className = 'form-error-msg';
    errorEl.textContent = message;
    errorEl.setAttribute('role', 'alert');

    // Insérer après le formulaire, dans le même conteneur
    formEl.parentNode.insertBefore(errorEl, formEl.nextSibling);

    // Retirer automatiquement après 4 secondes
    setTimeout(clearFormError, 4000);
  }

  /**
   * Supprime le message d'erreur du formulaire.
   */
  function clearFormError() {
    var existing = document.getElementById('form-error-message');
    if (existing) {
      existing.remove();
    }
  }

  // ============================================
  // SOUMISSION
  // ============================================

  /**
   * Gère le clic sur le bouton ENVIAR/SEND.
   * Valide, envoie vers Google Sheets, puis déclenche la Phase 5.
   */
  function handleSubmit() {
    if (isSubmitting) return;

    // Anti-spam : vérifier le cooldown
    var now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      return;
    }

    // Valider
    if (!validateForm()) return;

    isSubmitting = true;
    lastSubmitTime = now;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Générer le numéro de tracking
    currentTrackingNumber = generateTrackingNumber();

    // Collecter et nettoyer les données
    var formData = {};
    CONFIG.formFields.forEach(function (field) {
      var input = document.getElementById('field-' + field.id);
      if (input) {
        formData[field.id] = cleanFieldValue(input.value, input.maxLength);
      }
    });

    // Ajouter le tracking et le timestamp
    formData.tracking = currentTrackingNumber;
    formData.timestamp = new Date().toISOString();

    // Envoyer vers Google Sheets
    sendToGoogleSheets(formData)
      .then(function () {
        onSubmitSuccess(formData);
      })
      .catch(function (err) {
        console.warn('[form] Erreur envoi :', err.message || err);
        // En cas d'erreur réseau, on passe quand même à la confirmation
        // pour ne pas bloquer l'expérience utilisateur.
        // Les données sont en console pour debugging.
        onSubmitSuccess(formData);
      });
  }

  /**
   * Envoie les données vers le Google Apps Script endpoint.
   * @param {Object} data — les données du formulaire
   * @returns {Promise}
   */
  function sendToGoogleSheets(data) {
    var endpoint = CONFIG.googleSheetsEndpoint;
    if (!endpoint || endpoint.indexOf('REMPLACER') !== -1) {
      // Endpoint pas encore configuré — log en console et simuler un succès
      console.info('[form] Endpoint non configuré. Données du formulaire :', data);
      return Promise.resolve();
    }

    // Valider que l'URL est bien un endpoint Google Apps Script
    if (endpoint.indexOf('script.google.com') === -1) {
      console.warn('[form] Endpoint suspect (ne pointe pas vers script.google.com)');
      return Promise.reject(new Error('Endpoint non valide'));
    }

    // Avec mode: 'no-cors', le navigateur limite les headers autorisés.
    // On envoie en application/x-www-form-urlencoded pour compatibilité.
    var formBody = Object.keys(data).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
    }).join('&');

    return fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
  }

  /**
   * Appelée après une soumission réussie.
   * Déclenche la transition vers la Phase 5 (confirmation).
   * @param {Object} data — les données envoyées
   */
  function onSubmitSuccess(data) {
    isSubmitting = false;
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    // Notifier app.js pour déclencher la Phase 5
    if (typeof window.onFormSubmit === 'function') {
      window.onFormSubmit(data);
    }
  }

  // ============================================
  // TRACKING NUMBER (numéro simulé)
  // ============================================

  /**
   * Génère un faux numéro de tracking postal pour l'ambiance.
   * Format : MX-XXXXXX-XXXX (lettres + chiffres)
   * @returns {string}
   */
  function generateTrackingNumber() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var part1 = '';
    var part2 = '';
    for (var i = 0; i < 6; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (var j = 0; j < 4; j++) {
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'MX-' + part1 + '-' + part2;
  }

  // ============================================
  // PARTAGE (share)
  // ============================================

  /**
   * Déclenche le partage via Web Share API ou copie dans le presse-papier.
   * Affiche un feedback visuel à l'utilisateur.
   */
  function handleShare() {
    var lang = (typeof currentLang !== 'undefined') ? currentLang : 'es';
    var shareText = (lang === 'es')
      ? CONFIG.share.messageES
      : CONFIG.share.messageEN;
    var shareUrl = CONFIG.share.siteUrl;

    if (navigator.share) {
      navigator.share({
        title: CONFIG.artistName + ' — ' + CONFIG.releaseTitle,
        text: shareText,
        url: shareUrl,
      }).catch(function () {
        // L'utilisateur a annulé le partage — pas grave
      });
    } else {
      // Fallback : copier dans le presse-papier
      var fullText = shareText + ' ' + shareUrl;
      copyToClipboard(fullText, lang);
    }
  }

  /**
   * Copie un texte dans le presse-papier et affiche un feedback visuel.
   * @param {string} text — texte à copier
   * @param {string} lang — langue pour le message de confirmation
   */
  function copyToClipboard(text, lang) {
    var shareBtn = document.getElementById('share-btn');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showCopyFeedback(shareBtn, lang);
      }).catch(function () {
        // Fallback si clipboard API échoue (certains navigateurs restreignent)
        fallbackCopy(text);
        showCopyFeedback(shareBtn, lang);
      });
    } else {
      fallbackCopy(text);
      showCopyFeedback(shareBtn, lang);
    }
  }

  /**
   * Fallback pour copier du texte sans navigator.clipboard.
   * Crée un textarea temporaire.
   * @param {string} text — texte à copier
   */
  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      // Silencieux — pas de crash
    }
    document.body.removeChild(textarea);
  }

  /**
   * Affiche un feedback visuel temporaire sur le bouton de partage.
   * @param {HTMLElement} btn — le bouton share
   * @param {string} lang — langue pour le message
   */
  function showCopyFeedback(btn, lang) {
    if (!btn) return;
    var originalText = btn.textContent;
    btn.textContent = (lang === 'es') ? 'Enlace copiado' : 'Link copied';
    btn.classList.add('copy-success');
    setTimeout(function () {
      btn.textContent = originalText;
      btn.classList.remove('copy-success');
    }, 2000);
  }

  // ============================================
  // API PUBLIQUE (exposée sur window)
  // ============================================

  // Accessible depuis app.js et i18n.js
  window.buildPostcardForm = buildForm;
  window.updateFormLabels = updateFormLabels;
  window.generateTrackingNumber = generateTrackingNumber;
  window.handleShare = handleShare;

})();
