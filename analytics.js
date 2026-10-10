/* Mesure d'audience du site : Google Analytics 4 + Microsoft Clarity, chargés UNIQUEMENT après consentement.
   Plausible (sans cookie) reste actif sans consentement.
   ► Pour activer : remplace GA_ID par ton identifiant de mesure GA4 (format G-XXXXXXXXXX), à copier dans
     Google Analytics > Admin > Flux de données > ton flux web. Tant qu'il n'est pas remplacé, rien ne se charge. */
(function () {
  var GA_ID = 'G-PCLRRFK0T6';
  var CLARITY_ID = 'XXXXXXXXXX';
  var KEY = 'challenge21-cookie-consent';
  var gaLoaded = false, pending = [];
  function ok(id) { return id && !/^G?-?X+$/i.test(id); }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* Événements personnalisés (achat, lead, clic vers le paiement) : ignorés sans consentement */
  window.c21Track = function (name, params) {
    if (get() !== 'accepted' || !ok(GA_ID)) return;
    if (gaLoaded && window.gtag) window.gtag('event', name, params || {});
    else pending.push([name, params || {}]);
  };

  function loadGA() {
    if (gaLoaded || !ok(GA_ID)) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    pending.forEach(function (p) { window.gtag('event', p[0], p[1]); }); pending = [];
  }
  function loadClarity() {
    if (!ok(CLARITY_ID) || window.clarity) return;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
  }
  function start() { loadGA(); loadClarity(); }

  /* Bandeau : réutilise celui de la page s'il existe, sinon le crée */
  function banner() {
    var b = document.getElementById('cookie-banner');
    if (!b) {
      var st = document.createElement('style');
      st.textContent = '#cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:460px;margin:0 auto;background:#2E1B33;color:#FBF3EA;border-radius:14px;padding:14px 16px;box-shadow:0 16px 40px -12px rgba(0,0,0,.4);display:none;font-family:system-ui,sans-serif}#cookie-banner.show{display:flex;align-items:center;gap:14px;flex-wrap:wrap}#cookie-banner p{font-size:.78rem;line-height:1.4;margin:0;color:#FBF3EA;opacity:.9;flex:1;min-width:180px}#cookie-banner .cookie-actions{display:flex;gap:8px;flex-shrink:0}#cookie-banner button{border:none;border-radius:100px;padding:7px 14px;font-size:.78rem;font-weight:600;cursor:pointer;white-space:nowrap}#cookie-accept{background:#A8134F;color:#fff}#cookie-decline{background:transparent;color:#FBF3EA;border:1px solid rgba(251,243,234,.4)!important}@media(max-width:480px){#cookie-banner{left:10px;right:10px;bottom:10px}#cookie-banner.show{flex-direction:column;align-items:stretch}#cookie-banner .cookie-actions{width:100%}#cookie-banner button{flex:1}}';
      document.head.appendChild(st);
      b = document.createElement('div'); b.id = 'cookie-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookies');
      b.innerHTML = '<p>On utilise des cookies pour mieux comprendre comment les visiteuses utilisent le site (Google Analytics et Microsoft Clarity) et améliorer ton expérience. Tu peux accepter ou refuser à tout moment.</p><div class="cookie-actions"><button id="cookie-decline" type="button">Refuser</button><button id="cookie-accept" type="button">Accepter</button></div>';
      document.body.appendChild(b);
    }
    var a = document.getElementById('cookie-accept'), d = document.getElementById('cookie-decline');
    if (a) a.addEventListener('click', function () { set('accepted'); b.classList.remove('show'); start(); syncOffset(); });
    if (d) d.addEventListener('click', function () { set('declined'); b.classList.remove('show'); syncOffset(); });
    return b;
  }
  /* Le bandeau cookies et les boutons flottants « Rejoindre » peuvent se superposer en bas d'écran,
     ce qui rend le bouton principal injoignable au clic/tap tant que le bandeau est affiché.
     On mesure la hauteur réelle du bandeau et on pousse les boutons flottants au-dessus via une variable CSS. */
  function syncOffset() {
    var b = document.getElementById('cookie-banner');
    var h = (b && b.classList.contains('show')) ? b.getBoundingClientRect().height + 10 : 0;
    document.documentElement.style.setProperty('--c21-cb-h', h + 'px');
  }
  window.addEventListener('resize', syncOffset);
  function init() {
    var b = banner(), c = get();
    if (c === 'accepted') start(); else if (c === null) b.classList.add('show');
    syncOffset();
    /* Lien « Gérer les cookies » dans le pied de page : permet de changer d'avis aussi facilement qu'on a accepté */
    var f = document.querySelector('footer');
    if (f && !f.querySelector('[data-c21-cookies]')) {
      var p = f.querySelector('p') || f, l = document.createElement('a');
      l.href = '#'; l.setAttribute('data-c21-cookies', ''); l.textContent = 'Gérer les cookies'; l.style.cssText = 'margin-left:10px;text-decoration:underline;color:inherit';
      l.addEventListener('click', function (e) { e.preventDefault(); try { localStorage.removeItem(KEY); } catch (x) {} b.classList.add('show'); syncOffset(); });
      p.appendChild(document.createTextNode(' · ')); p.appendChild(l);
    }
    /* Suivi des actions clés */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="stripe.com"]'); if (!a) return;
      var duo = /book\.stripe\.com/.test(a.href), v = duo ? 70 : 47;
      window.c21Track('begin_checkout', { currency: 'EUR', value: v, items: [{ item_id: duo ? 'duo' : 'solo', item_name: duo ? 'Challenge 21 Duo' : 'Challenge 21', price: v, quantity: 1 }] });
    }, true);
    document.addEventListener('submit', function (e) {
      var f2 = e.target; window.c21Track('generate_lead', { form_name: (f2.getAttribute && (f2.getAttribute('name') || f2.id)) || 'formulaire' });
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
