# Challenge 21 : prêt à déployer

## Structure
- `index.html` — page de vente principale
- `vsl.html` — présentation vidéo + offres (accès protégé : redirige vers l'accueil si le quiz n'a pas été fait, via sessionStorage côté client)
- `merci.html` — page post-achat
- `mentions-legales.html`, `cgv.html`, `cgu.html`, `confidentialite.html` — pages juridiques
- `blog/` — 221 articles SEO, chacun avec sa propre URL, balisage Article + BreadcrumbList
- `photos/` — photos de Laëtitia (avant/après + évolution). Manquent encore : photo de Garry, photos des autres challengeuses
- `robots.txt`, `sitemap.xml` — SEO technique
- `netlify.toml` — config Netlify (déclare le dossier de fonctions)
- `netlify/functions/quiz-result-email.js` — fonction serverless qui envoie l'email de résultat du quiz via Brevo

## À faire avant/pendant le déploiement

1. **Déployer tel quel** sur Netlify (drag & drop du dossier, ou push Git si le repo est connecté)
2. **Variable d'environnement à ajouter** dans Netlify (Site settings → Environment variables) :
   `BREVO_API_KEY` = clé API Brevo (Brevo → Paramètres → Clés API → créer une clé API v3)
   Sans cette variable, le quiz fonctionne normalement mais l'email de résultat ne partira pas (échec silencieux, sans impact pour la visiteuse).
3. **Formulaire Netlify** : le site utilise Netlify Forms (formulaire caché `lead-quiz` dans `index.html`) pour capter les leads du quiz. Netlify doit détecter ce formulaire automatiquement au build — vérifier dans Site settings → Forms après le premier déploiement.
4. **Microsoft Clarity** : dans `index.html`, chercher `XXXXXXXXXX` (Project ID placeholder) et le remplacer par le vrai ID une fois le compte Clarity créé sur clarity.microsoft.com.
5. **Domaine** : pointer challengepertedepoids.fr vers ce site Netlify (actuellement le domaine semble parqué chez le registrar, à vérifier/reconfigurer).
6. **SIRET / mentions légales** : déjà renseigné (832 643 092 00014). Le médiateur CM2C est mentionné dans les mentions légales — l'inscription réelle sur cm2c.net reste à faire côté Garry si ce n'est pas déjà fait.
7. **Stripe** : offre à 47 €, ou Duo à 70 € pour deux (50 places par édition). Aucun lien Stripe intégré pour l'instant : le bouton redirige vers WhatsApp. À connecter si le paiement en ligne autonome est souhaité.

## Photos manquantes (site fonctionne sans, mais les emplacements sont prêts)
- Photo de Garry (section "légitimité")
- Photos avant/après d'autres challengeuses
- Vidéo VSL (actuellement un placeholder dans `vsl.html`)

## Photos
Voir `PHOTOS-A-AJOUTER.md` : liste complète des fichiers attendus, avec format conseillé.
Pour repérer les emplacements directement sur le site, ajouter `?photos` à l'adresse (`?photos=off` pour désactiver). Tant qu'une photo manque, son bloc est masqué pour les visiteuses.

## Pages de remerciement (après paiement Stripe)
- Offre 47 € : `https://challengepertedepoids.fr/merci.html`
- Offre Duo 70 € : `https://challengepertedepoids.fr/merci-duo.html`
Dans chaque lien de paiement Stripe : onglet « Après le paiement » > « Rediriger vers votre site web » > coller l'URL correspondante.
Dans `merci-duo.html`, remplacer `LIEN_DU_GROUPE` par le lien d'invitation du groupe WhatsApp (et le lien du bouton vert dans les deux pages).

## Séquences email (Brevo)
Chaque lead (test, pop-up) est envoyée dans Brevo par `netlify/functions/brevo-contact.js`, avec PRENOM, PROFIL (1 à 3), SCORE et SOURCE.
Variables Netlify à ajouter : `BREVO_LIST_ID` (liste Prospects Challenge 21) et `BREVO_SENDER_EMAIL` (adresse du domaine authentifié dans Brevo), en plus de `BREVO_API_KEY`.

## Offres, liens Stripe et liste d'attente
Tout se règle dans `offres.js` (à la racine) :
- `lienSolo` et `lienDuo` : coller les liens Stripe (https://buy.stripe.com/...). Les boutons de l'accueil et de la présentation les utilisent automatiquement.
- `complet: true` quand les 50 places sont vendues : tous les boutons d'inscription mènent vers `liste-attente.html` et un bandeau « Édition complète » s'affiche. Remettre `complet: false` à l'ouverture de l'édition suivante, puis redéployer.
Les inscriptions à la liste d'attente arrivent dans Netlify Forms (formulaire `liste-attente`, avec la formule souhaitée : Seule ou Duo) et dans Brevo (SOURCE = attente).

## Guide offert (aimant à contacts), envoi automatique
Section « Ce qui marche vraiment pour perdre du poids » sur l'accueil : prénom, email, téléphone facultatif.
À l'envoi, `netlify/functions/envoi-guide.js` :
1. ajoute ou met à jour la contact dans Brevo (liste BREVO_LIST_ID, PRENOM, SOURCE = guide, TELEPHONE si fourni) ;
2. envoie automatiquement l'email « Ton guide est prêt » avec le lien de téléchargement.
La demande est aussi enregistrée dans Netlify Forms (`lead-guide`), et un bouton de téléchargement immédiat s'affiche sur la page.
Variables Netlify nécessaires : BREVO_API_KEY, BREVO_LIST_ID, BREVO_SENDER_EMAIL. Attribut Brevo à créer : TELEPHONE (texte).
Le PDF : `telechargements/guide-ce-qui-marche-vraiment.pdf`. La liste de courses détox reste disponible dans `telechargements/liste-courses-detox.pdf`.

## Séquences d'emails automatiques (sans automatisation Brevo à créer)
`netlify/functions/sequences.js` tourne chaque matin (réglé dans netlify.toml) et envoie à chaque inscrite l'email du jour de sa séquence :
- SOURCE = guide (guide offert, pop-up de sortie) → séquence G : J+2, J+4, J+6, J+8, J+11
- SOURCE = test ou presentation (test détox, présentation) → séquence A : J+1, J+2, J+3, J+5, J+7, avec l'ouverture adaptée au profil du test
Une contact sort de sa séquence si l'attribut ACHAT est rempli ou si elle se désinscrit (lien signé, `netlify/functions/desinscription.js`).
Au premier lancement, le site crée tout seul dans Brevo les attributs (SOURCE, PROFIL, SCORE, TELEPHONE, ACHAT, INSCRIT_LE, SEQ_ETAPE) et la liste « Prospects Challenge 21 ». BREVO_LIST_ID devient facultatif.
Variables Netlify nécessaires : BREVO_API_KEY et BREVO_SENDER_EMAIL.

## Remise des guides après paiement
1. Dans Stripe, pour chaque lien de paiement : « Après le paiement » > « Rediriger les clients vers votre site » :
   - Solo : https://challengepertedepoids.fr/merci.html?session_id={CHECKOUT_SESSION_ID}
   - Duo : https://challengepertedepoids.fr/merci-duo.html?session_id={CHECKOUT_SESSION_ID}
2. Dans Netlify, variable STRIPE_SECRET_KEY : une clé restreinte Stripe avec uniquement la lecture des « Checkout Sessions ».
3. La fonction `netlify/functions/commande.js` vérifie le paiement, affiche le bouton du Guide Détox sur la page merci (le Guide Rééquilibrage part automatiquement par email le jour 6 de l'édition, via sequences.js), marque la contact ACHAT = solo ou duo dans Brevo (ses relances de vente s'arrêtent) et envoie une fois l'email de bienvenue avec les guides.
Les guides sont dans `espace/c21-699e66c2d89935049078/` : un dossier au nom impossible à deviner, jamais indexé (robots.txt et en-tête noindex). Pour mettre un guide à jour, remplace simplement le PDF en gardant le même nom.

## Compteur de places en temps réel
`netlify/functions/places.js` compte les paiements Stripe de l'édition en cours (47 € = 1 place, 70 € = 2 places, les autres montants sont ignorés) et renvoie les places restantes sur 50. Résultat mis en cache 5 minutes.
Dès la première vente, les mentions « 50 places » de l'accueil et de la présentation deviennent « plus que X places ». À 0 place, le mode complet s'active tout seul (boutons vers la liste d'attente), sans toucher à offres.js.
Utilise la même variable STRIPE_SECRET_KEY que la remise des guides.

## Visuels des articles de blog
`blog/viz.css` regroupe les styles des visuels (chiffres clés, étapes, tableaux, comparaisons, cartes, frises, barres, alertes santé, jauges). Chaque visuel est entouré de `<!--viz-->` ... `<!--/viz-->` dans l'article, pour pouvoir être retiré ou régénéré facilement. Aucune image à fournir : tout est en HTML et CSS, aux couleurs du site, avec mode sombre.
Les anciens articles ont été enrichis de la même façon : leurs listes existantes sont transformées en cartes, étapes ou comparaisons (jamais dupliquées), et chaque guide de ville affiche des cartes pour ses lieux de marche et de marché.

## Google Analytics 4
`analytics.js` (chargé sur toutes les pages) installe Google Analytics 4 et Microsoft Clarity uniquement après consentement (bandeau cookies, lien « Gérer les cookies » en bas de page). Plausible, sans cookie, reste actif sans consentement.
Pour activer : ouvre `analytics.js` et remplace `G-XXXXXXXXXX` (ligne GA_ID) par ton identifiant de mesure GA4 ; de la même façon `CLARITY_ID` pour Clarity. Événements envoyés : `begin_checkout` (clic vers Stripe, 47 ou 70 €), `generate_lead` (formulaires du guide et du test), `purchase` (page merci, avec l'identifiant de la transaction Stripe).
