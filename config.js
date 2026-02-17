// ============================================
// CONFIGURATION DU SITE — MANDRAGORA
// Modifier les valeurs ci-dessous sans toucher au reste du code
// ============================================

const CONFIG = {

  // --- INFORMATIONS ARTISTE ---
  artistName: "MANDRAGORA",
  releaseTitle: "Jugo De Diamantes",

  // --- LIENS RÉSEAUX SOCIAUX ---
  // Remplacer les URLs. Mettre "" (vide) pour masquer un réseau.
  social: {
    instagram: "https://www.instagram.com/holasoyneto/?hl=fr",
    tiktok: "",       // Exemple : "https://www.tiktok.com/@mandragora"
    x: "",            // Exemple : "https://x.com/mandragora"
    youtube: "",      // Exemple : "https://youtube.com/@mandragora"
    spotify: "",      // Exemple : "https://open.spotify.com/artist/..."
    appleMusic: "",   // Exemple : "https://music.apple.com/artist/..."
    soundcloud: "",   // Exemple : "https://soundcloud.com/mandragora"
  },

  // --- LIEN PRE-SAVE ---
  // URL vers la page de pre-save / pre-order du morceau
  presaveLink: "https://REMPLACER-PAR-LE-LIEN-PRESAVE.com",

  // --- FORMULAIRE ---
  // URL du Google Apps Script pour recevoir les soumissions
  googleSheetsEndpoint: "https://script.google.com/macros/s/REMPLACER-PAR-VOTRE-ID/exec",

  // Champs du formulaire (ne pas modifier les "id", seulement les labels si besoin)
  formFields: [
    { id: "nombre",    labelES: "Nombre",          labelEN: "Name",           required: true },
    { id: "direccion", labelES: "Dirección",        labelEN: "Address",        required: true },
    { id: "ciudad",    labelES: "Ciudad, País",     labelEN: "City, Country",  required: true },
    { id: "email",     labelES: "Email",            labelEN: "Email",          required: true },
  ],

  // --- TEXTES DU SITE (ESPAGNOL) ---
  // Tous les textes affichés, facilement modifiables
  textES: {
    // Phase 1 — Écran d'amorce
    introLine: "Un mensaje fue enviado.",

    // Phase 2 — Textes qui apparaissent pendant le voyage sur la carte
    journeyTexts: [
      "Donde no llegaba el periódico, llegaba el corrido.",
      "Cada canción, una carta al pueblo.",
      "El mensaje no muere. Corre.",
    ],

    // Phase 3 — Arrivée de la lettre
    arrivalLine: "El mensaje llegó. Falta tu nombre.",

    // Phase 4 — Formulaire
    submitButton: "ENVIAR",

    // Phase 5 — Confirmation après envoi
    confirmationLine: "Tu carta corre.",
    trackingPrefix: "Tracking: ",

    // Post-soumission
    presaveButtonText: "PRE-SAVE",
    shareButtonText: "COMPARTIR",

    // Toggle audio
    audioOn: "AUDIO ON",
    audioOff: "AUDIO OFF",

    // Toggle langue
    langToggle: "EN",
  },

  // --- TEXTES DU SITE (ANGLAIS) ---
  textEN: {
    introLine: "A message was sent.",
    journeyTexts: [
      "Where the newspaper couldn't reach, the corrido arrived.",
      "Each song, a letter to the people.",
      "The message doesn't die. It runs.",
    ],
    arrivalLine: "The message arrived. It needs your name.",
    submitButton: "SEND",
    confirmationLine: "Your letter runs.",
    trackingPrefix: "Tracking: ",
    presaveButtonText: "PRE-SAVE",
    shareButtonText: "SHARE",
    audioOn: "AUDIO ON",
    audioOff: "AUDIO OFF",
    langToggle: "ES",
  },

  // --- COULEURS ---
  // Palette du site — modifier ici pour changer les couleurs globales
  colors: {
    background: "#0A0A0A",       // Noir profond
    textPrimary: "#E8E4DE",      // Blanc cassé
    accent: "#8B1A1A",           // Rouge sang (curseur, hover, accents)
    letterColor: "#FFFFFF",      // Couleur de la lettre sur la carte
    topoLines: "#373737",       // Lignes topographiques (+30% luminosité)
    topoLinesLight: "#4B4B4B",  // Lignes topographiques zones claires (+30% luminosité)
  },

  // --- TYPOGRAPHIES ---
  // Google Fonts utilisées (modifier les noms + mettre à jour le <link> dans index.html)
  fonts: {
    display: "'Playfair Display', serif",   // Titres, gros textes
    mono: "'Space Mono', monospace",         // Textes narratifs, formulaire
    handwriting: "'Caveat', cursive",        // Texte saisi par l'utilisateur dans le formulaire
  },

  // --- PARTAGE RÉSEAUX SOCIAUX (après soumission) ---
  share: {
    // Texte pré-rempli pour le partage
    messageES: "Mi carta corre 🏜️ Jugo De Diamantes — MANDRAGORA",
    messageEN: "My letter runs 🏜️ Jugo De Diamantes — MANDRAGORA",
    // URL du site à partager
    siteUrl: "https://REMPLACER-PAR-URL-DU-SITE.com",
  },
};
