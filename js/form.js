// ============================================
// FORM.JS — Génération et gestion du formulaire carte postale
// Crée les champs depuis CONFIG.formFields, valide et envoie vers Google Sheets
// ============================================

(function () {
  'use strict';

  var formEl = null;
  var submitBtn = null;
  var isSubmitting = false;

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

      // Retirer l'erreur quand l'utilisateur tape
      input.addEventListener('input', function () {
        wrapper.classList.remove('field-error');
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

      var value = input.value.trim();
      var wrapper = input.parentElement;

      if (!value) {
        wrapper.classList.add('field-error');
        valid = false;
        return;
      }

      // Validation email basique
      if (field.id === 'email') {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          wrapper.classList.add('field-error');
          valid = false;
        }
      }
    });

    return valid;
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

    // Valider
    if (!validateForm()) return;

    isSubmitting = true;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Collecter les données
    var formData = {};
    CONFIG.formFields.forEach(function (field) {
      var input = document.getElementById('field-' + field.id);
      if (input) {
        formData[field.id] = input.value.trim();
      }
    });

    // Envoyer vers Google Sheets
    sendToGoogleSheets(formData)
      .then(function () {
        onSubmitSuccess(formData);
      })
      .catch(function (err) {
        console.warn('[form] Erreur envoi :', err.message);
        // En cas d'erreur réseau, on passe quand même à la confirmation
        // pour ne pas bloquer l'expérience utilisateur
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
      // Endpoint pas encore configuré — simuler un succès
      return Promise.resolve();
    }

    return fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
   * Format : MX-XXXXXX-XXXX
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
   */
  function handleShare() {
    var shareText = (currentLang === 'es')
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
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText);
      }
    }
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
