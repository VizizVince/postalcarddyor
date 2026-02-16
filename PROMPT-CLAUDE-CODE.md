# PROMPT CLAUDE CODE

Copier-coller ce texte intégralement dans Claude Code :

---

Tu es un développeur front-end senior spécialisé en animations web et expériences immersives. Tu vas construire un site one-page interactif pour l'artiste MANDRAGORA.

## Contexte

Le site accompagne la sortie du morceau "Jugo De Diamantes". C'est un hommage au Corrido mexicain — un genre de ballade qui servait de système de messagerie oral à travers le Mexique. Le concept du site : le scroll fait voyager une lettre à travers le Mexique vu du ciel (carte topographique stylisée), jusqu'à ce qu'elle arrive chez le fan et se transforme en formulaire de carte postale. Le fan remplit ses infos pour recevoir une vraie carte postale physique.

## Documents de référence

Tu as 2 fichiers essentiels à lire INTÉGRALEMENT avant d'écrire la moindre ligne de code :

1. **`MANDRAGORA-JugoDeDiamantes-site.md`** → La spec créative et technique complète (direction artistique, parcours utilisateur, 5 phases du scroll, formulaire, audio, bilingue, backend Google Sheets, responsive, stack technique, config.js complet)

2. **`PLAN-DE-DEVELOPPEMENT.md`** → Le plan d'exécution étape par étape avec checkpoints de validation, tableau de dépendances, et pièges à éviter

## Règles absolues

- **Lis les deux documents en entier AVANT de commencer**
- **Suis le plan de développement dans l'ordre exact** — Phase 0 d'abord, puis Phase 1, etc.
- **Ne saute aucune étape** — chaque étape a un checkpoint, valide-le avant de passer à la suivante
- **Tout ce qui est affiché ou configurable vient de `config.js`** — aucune valeur en dur dans le HTML, CSS ou JS
- **Commente le code en français**
- **Vanilla HTML/CSS/JS uniquement** — pas de framework, pas de bundler
- **GSAP + ScrollTrigger + Lenis via CDN**
- **Le site doit être modifiable par des non-développeurs** via le seul fichier `config.js`

## Commence maintenant

Lis les deux fichiers, puis exécute la Phase 0 (étapes 0.1 à 0.6) en validant chaque checkpoint. Montre-moi le résultat de chaque checkpoint avant de passer à l'étape suivante.
