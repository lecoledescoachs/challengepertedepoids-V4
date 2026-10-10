/* Facilite le partage entre copines :
   - bouton natif (WhatsApp, Messages...) sur mobile, sinon WhatsApp Web
   - "copier le lien" en secours
   - retient qui a invité qui (paramètre ?ref=) pour un futur geste commercial
   - image prête à partager en story */
(function () {
  var REF_KEY = 'c21_ref';

  function getRef() { try { return localStorage.getItem(REF_KEY) || ''; } catch (e) { return ''; } }
  function setRef(name) { if (!name) return; try { localStorage.setItem(REF_KEY, name.slice(0, 40)); } catch (e) {} }
  window.c21GetRef = getRef;
  window.c21SetRef = setRef;

  // Capture ?ref=Prenom à l'arrivée sur n'importe quelle page
  (function captureRef() {
    var m = location.search.match(/[?&]ref=([^&]+)/);
    if (m) setRef(decodeURIComponent(m[1].replace(/\+/g, ' ')));
  })();

  function withRef(url) {
    url = url || location.href.split('#')[0];
    var name = getRef();
    if (!name) return url;
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    return url + sep + 'ref=' + encodeURIComponent(name);
  }
  window.c21WithRef = withRef;

  function waLink(text, url) { return 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url); }

  function shareIt(text, url, opts) {
    opts = opts || {};
    url = withRef(url);
    if (navigator.share) {
      navigator.share({ title: document.title, text: text, url: url }).catch(function () {});
    } else {
      window.open(waLink(text, url), '_blank', 'noopener');
    }
  }
  window.c21Share = shareIt;

  function copyLink(url, btn) {
    url = withRef(url);
    var done = function () {
      if (!btn) return;
      var old = btn.textContent; btn.textContent = 'Lien copié ✓';
      setTimeout(function () { btn.textContent = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () { prompt('Copie ce lien :', url); });
    } else {
      prompt('Copie ce lien :', url);
    }
  }
  window.c21CopyLink = copyLink;

  // Partage avec l'image de story (si le navigateur sait partager des fichiers), sinon téléchargement
  function shareStory(imgUrl, text) {
    fetch(imgUrl).then(function (r) { return r.blob(); }).then(function (blob) {
      var file = new File([blob], 'challenge-21.jpg', { type: blob.type || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: document.title, text: text }).catch(function () {});
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'challenge-21.jpg';
        document.body.appendChild(a); a.click(); a.remove();
      }
    }).catch(function () { window.open(imgUrl, '_blank'); });
  }
  window.c21ShareStory = shareStory;

  // Colle "(invitée par X)" dans les messages WhatsApp pré-remplis des boutons d'inscription
  function tagJoinButtons() {
    var name = getRef(); if (!name) return;
    document.querySelectorAll('a[data-offer]').forEach(function (a) {
      if (a.dataset.c21Tagged) return; a.dataset.c21Tagged = '1';
      try {
        var u = new URL(a.href); var t = u.searchParams.get('text') || '';
        if (t.indexOf('invitée par') === -1) { u.searchParams.set('text', t + ' (invitée par ' + name + ')'); a.href = u.toString(); }
      } catch (e) {}
    });
  }

  // Ajoute un champ caché "parrain" aux formulaires Netlify du site
  function tagForms() {
    var name = getRef(); if (!name) return;
    document.querySelectorAll('form').forEach(function (f) {
      if (f.querySelector('input[name="parrain"]')) return;
      var i = document.createElement('input'); i.type = 'hidden'; i.name = 'parrain'; i.value = name;
      f.appendChild(i);
    });
  }

  /* Boutons explicites : <button class="js-share" data-share-text data-share-url data-share-from> */
  function wireExplicitButtons() {
    document.querySelectorAll('.js-share').forEach(function (btn) {
      if (btn.dataset.c21Wired) return; btn.dataset.c21Wired = '1';
      btn.addEventListener('click', function () {
        shareIt(btn.getAttribute('data-share-text') || document.title, btn.getAttribute('data-share-url') || null);
        if (window.c21Track) window.c21Track('share', { method: navigator.share ? 'native' : 'whatsapp', from: btn.getAttribute('data-share-from') || 'inconnu' });
      });
    });
    document.querySelectorAll('.js-copy-link').forEach(function (btn) {
      if (btn.dataset.c21Wired) return; btn.dataset.c21Wired = '1';
      btn.addEventListener('click', function () {
        copyLink(btn.getAttribute('data-share-url') || null, btn);
        if (window.c21Track) window.c21Track('share', { method: 'copy_link', from: btn.getAttribute('data-share-from') || 'inconnu' });
      });
    });
    document.querySelectorAll('.js-share-story').forEach(function (btn) {
      if (btn.dataset.c21Wired) return; btn.dataset.c21Wired = '1';
      btn.addEventListener('click', function () {
        shareStory(btn.getAttribute('data-story-img') || '/photos/story-partage.jpg', btn.getAttribute('data-share-text') || document.title);
        if (window.c21Track) window.c21Track('share', { method: 'story_image', from: btn.getAttribute('data-share-from') || 'inconnu' });
      });
    });
  }

  /* Barre "Partage cet article" ajoutée automatiquement en bas de chaque article du blog */
  function injectArticleShare() {
    if (location.pathname.indexOf('/blog/') === -1) return;
    var foot = document.querySelector('footer');
    if (!foot || document.querySelector('.c21-share-bar')) return;
    var url = location.href.split('#')[0];
    var title = document.title.replace(/\s*[·|]\s*Challenge 21.*$/i, '');
    var bar = document.createElement('div');
    bar.className = 'c21-share-bar';
    bar.innerHTML = '<p>Cet article peut aider une copine.</p><div class="c21-share-row"><button type="button" class="c21-share-btn c21-share-main">Partager avec une copine</button><button type="button" class="c21-share-btn c21-share-ghost">Copier le lien</button></div>';
    var style = document.createElement('style');
    style.textContent = '.c21-share-bar{max-width:680px;margin:32px auto;padding:22px;border-radius:16px;background:rgba(168,19,79,.06);border:1px solid rgba(168,19,79,.18);text-align:center;font-family:inherit}.c21-share-bar p{margin:0 0 12px;font-weight:600;color:inherit}.c21-share-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.c21-share-btn{border:none;border-radius:100px;padding:13px 26px;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer}.c21-share-main{background:#A8134F;color:#fff}.c21-share-ghost{background:transparent;color:#A8134F;border:1.5px solid rgba(168,19,79,.35) !important}.c21-share-btn:hover{opacity:.92}';
    document.head.appendChild(style);
    foot.parentNode.insertBefore(bar, foot);
    var text = 'Un article qui peut t\u2019aider, du Challenge 21 : ' + title;
    bar.querySelector('.c21-share-main').addEventListener('click', function () {
      shareIt(text, url);
      if (window.c21Track) window.c21Track('share', { method: navigator.share ? 'native' : 'whatsapp', from: 'article' });
    });
    bar.querySelector('.c21-share-ghost').addEventListener('click', function (e) {
      copyLink(url, e.target);
      if (window.c21Track) window.c21Track('share', { method: 'copy_link', from: 'article' });
    });
  }

  function init() { tagJoinButtons(); tagForms(); wireExplicitButtons(); injectArticleShare(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Les boutons "Rejoindre" du quiz apparaissent après coup : on re-tague peu après
  setTimeout(function () { tagJoinButtons(); tagForms(); wireExplicitButtons(); }, 1200);
})();
