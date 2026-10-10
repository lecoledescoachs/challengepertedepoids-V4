/* =====================================================================
   RÉGLAGES DES OFFRES DU CHALLENGE 21
   C'est le seul endroit à modifier pour :
   - brancher les liens de paiement Stripe (lienSolo et lienDuo) ;
   - passer le site en mode « complet » (complet: true) quand les 50 places
     sont vendues : tous les boutons d'inscription mènent alors vers la
     liste d'attente, et un bandeau « Édition complète » s'affiche.
   Pense à remettre complet: false à l'ouverture de l'édition suivante.
   COMPTEUR AUTOMATIQUE : le site compte les ventes Stripe de l'édition en cours
   (fonction « places »). Les mentions « 50 places » deviennent « plus que X places »
   dès la première vente, et le mode complet s'active tout seul à 0 place.
   ===================================================================== */
var C21_CONFIG = {
  complet: false,
  lienSolo: "https://buy.stripe.com/bJe28q7X7fl60l4cizeME0q",   // offre à 47 €
  lienDuo: "https://book.stripe.com/aFaeVc5OZ0qc4BkeqHeME0r"     // offre Duo à 70 €
};

(function () {
  var cfg = window.C21_CONFIG || {};
  var ATTENTE = 'liste-attente.html';
  function apply() {
    if (cfg.complet) document.documentElement.classList.add('c21-complet');
    document.querySelectorAll('[data-offer]').forEach(function (a) {
      var kind = a.getAttribute('data-offer');
      if (cfg.complet) {
        a.setAttribute('href', ATTENTE);
        a.removeAttribute('target');
        var label = a.querySelector('[data-label]') || a;
        label.textContent = kind === 'bar' ? "Édition complète · liste d'attente" : "Rejoindre la liste d'attente";
        var price = a.querySelector('strong'); if (kind === 'bar' && price) price.textContent = '→';
        a.classList.remove('js-scroll-tarifs-link');
      } else if (kind === 'solo' && cfg.lienSolo) {
        a.setAttribute('href', cfg.lienSolo); a.removeAttribute('target');
      } else if (kind === 'duo' && cfg.lienDuo) {
        a.setAttribute('href', cfg.lienDuo); a.removeAttribute('target');
      }
    });
  }
  function places() {
    if (!window.fetch || location.protocol === 'file:') return;
    fetch('/.netlify/functions/places').then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) return;
      if (d.restantes <= 0 && !cfg.complet) { cfg.complet = true; apply(); return; }
      if (d.vendues > 0) document.querySelectorAll('.js-places').forEach(function (el) {
        var f = el.getAttribute('data-fmt') || 'plus que {n} places'; var n = d.restantes;
        el.textContent = f.replace('{n}', n).replace('places', n > 1 ? 'places' : 'place');
        el.classList.add('places-live');
      });
    }).catch(function () {});
  }
  function go() { apply(); places(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
