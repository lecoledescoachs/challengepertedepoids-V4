/* Petit retour sonore + visuel sur les boutons d'action (CTA).
   Le son est généré directement en JavaScript (Web Audio API), sans fichier audio :
   léger, et ça ne joue jamais tout seul (uniquement sur un vrai clic de l'utilisateur,
   ce qui respecte les règles des navigateurs sur l'audio). */
(function () {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  function getCtx() {
    if (!ctx && AudioCtx) ctx = new AudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startTime, duration, gainPeak, type) {
    var c = getCtx(); if (!c) return;
    var osc = c.createOscillator(), gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(startTime); osc.stop(startTime + duration + 0.02);
  }

  /* Clic léger : un tout petit "tic" doux, pour les boutons courants. */
  function playClick() {
    var c = getCtx(); if (!c) return;
    tone(720, c.currentTime, 0.07, 0.05, 'sine');
  }

  /* Clic principal : un "pop" un peu plus riche, pour les CTA de conversion
     (rejoindre le challenge, réserver, etc.). */
  function playAction() {
    var c = getCtx(); if (!c) return;
    var t = c.currentTime;
    tone(520, t, 0.09, 0.07, 'sine');
    tone(780, t + 0.045, 0.1, 0.055, 'sine');
  }

  /* Petit succès (ex: étape franchie, formulaire envoyé) : deux notes montantes. */
  function playSuccess() {
    var c = getCtx(); if (!c) return;
    var t = c.currentTime;
    tone(523.25, t, 0.12, 0.06, 'sine');
    tone(659.25, t + 0.09, 0.16, 0.065, 'sine');
  }

  function ripple(el, evt) {
    var r = document.createElement('span');
    r.className = 'c21-ripple';
    var rect = el.getBoundingClientRect();
    var x = (evt && evt.clientX ? evt.clientX - rect.left : rect.width / 2);
    var y = (evt && evt.clientY ? evt.clientY - rect.top : rect.height / 2);
    var size = Math.max(rect.width, rect.height) * 1.5;
    r.style.cssText = 'left:' + (x - size / 2) + 'px;top:' + (y - size / 2) + 'px;width:' + size + 'px;height:' + size + 'px;';
    el.appendChild(r);
    r.addEventListener('animationend', function () { r.remove(); });
  }

  function bindSound(selector, handler) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.hasAttribute('data-sfx-bound')) return;
      el.setAttribute('data-sfx-bound', '1');
      el.classList.add('c21-sfx');
      el.addEventListener('click', function (e) {
        if (window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) ripple(el, e);
        try { handler(); } catch (err) {}
      });
    });
  }

  function init() {
    bindSound('.btn-primary, .mobile-join a, .desk-join a, .google-rating', playAction);
    bindSound('.blog-filter, .price-quiz a, .faq-group summary, .chap-btn, .quiz-opt, .cta-mini', playClick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  /* Les boutons peuvent apparaître après coup (quiz, contenu chargé en JS) : on réessaie un peu plus tard sans dégrader la page. */
  window.addEventListener('load', function () { setTimeout(init, 800); });

  window.c21PlaySuccess = playSuccess;
})();
