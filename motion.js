/* Motion design du site Challenge 21.
   Titres révélés mot par mot, icônes qui se dessinent, photos qui se dévoilent, boutons attirés par la souris,
   et des effets dédiés aux sections clés (communauté, comparatif, tarifs, garantie, assiette, frise).
   Tout est coupé si la visiteuse a demandé moins d'animations. Rien n'est masqué sans JavaScript :
   les états de départ ne s'appliquent qu'aux éléments encore sous l'écran au chargement. */
(function () {
  if (!('IntersectionObserver' in window) || !window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var d = document, root = d.documentElement;
  if (root.classList.contains('sm-on')) return;

  var CSS = [
    /* titres */
    '.sm-kw .sm-w{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .06em .16em;margin:0 -.06em -.16em}',
    '.sm-kw .sm-wi{display:inline-block;transform:translateY(115%) rotate(4deg);transform-origin:0 100%;transition:transform .8s cubic-bezier(.16,1,.3,1) calc(var(--w,0) * 55ms)}',
    '.sm-kw.sm-in .sm-wi{transform:none}',
    '.sm-kw::after{content:"";display:block;height:5px;width:0;margin-top:16px;border-radius:6px;background:linear-gradient(90deg,var(--accent,#C62368),#E8674A);transition:width .9s cubic-bezier(.16,1,.3,1) .35s}',
    '.sm-kw.sm-center::after{margin-left:auto;margin-right:auto}',
    '.sm-kw.sm-in::after{width:72px}',
    '.sm-kw.sm-now .sm-wi,.sm-kw.sm-now::after{transition:none}',
    /* icônes */
    '.sm-ico .sm-dr{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.1s cubic-bezier(.65,0,.35,1) .15s}',
    '.sm-ico.sm-in .sm-dr{stroke-dashoffset:0}',
    /* photos */
    '.sm-ph:not(.sm-done) img{clip-path:inset(100% 0 0 0);transform:scale(1.14);transition:clip-path 1.1s cubic-bezier(.77,0,.18,1) calc(var(--i,0) * 90ms),transform 1.6s cubic-bezier(.16,1,.3,1) calc(var(--i,0) * 90ms)}',
    '.sm-ph.sm-in:not(.sm-done) img{clip-path:inset(0 0 0 0);transform:scale(1)}',
    '@media print{.sm-kw .sm-wi,.sm-ph img,.sm-bub,.cmp .sm-row,.cmp .cmp-y,.sm-pd,.sm-seal,.sm-plate,.sm-up,.sm-ico .sm-dr{opacity:1!important;transform:none!important;clip-path:none!important;stroke-dashoffset:0!important}}',
    /* communauté : messages qui arrivent un par un */
    '.sm-bub{opacity:0;transform:translateY(16px) scale(.86);transition:opacity .3s ease,transform .55s cubic-bezier(.34,1.56,.64,1)}',
    '.sm-bub.sm-typing,.sm-bub.sm-said{opacity:1;transform:none}',
    '.sm-bub.sm-typing{color:transparent!important}',
    '.sm-bub.sm-typing::after{content:"";position:absolute;left:22px;top:50%;width:14px;height:10px;margin-top:-5px;background:radial-gradient(circle at 5px 5px,var(--accent,#C62368) 4px,transparent 4.6px) 0 0/15px 10px repeat-x;animation:smType .9s steps(3) infinite}',
    '@keyframes smType{to{width:44px}}',
    /* comparatif */
    '.cmp .sm-row{opacity:0;transform:translateY(14px);transition:opacity .45s ease calc(var(--i,0) * 110ms),transform .6s cubic-bezier(.16,1,.3,1) calc(var(--i,0) * 110ms)}',
    '.cmp.sm-in .sm-row{opacity:1;transform:none}',
    '.cmp .sm-row .cmp-hl .cmp-y{display:inline-block;transform:scale(0);transition:transform .5s cubic-bezier(.34,1.56,.64,1) calc(var(--i,0) * 110ms + 260ms)}',
    '.cmp.sm-in .sm-row .cmp-hl .cmp-y{transform:scale(1)}',
    '.cmp.sm-in .cmp-head span{animation:smGlow 1.4s ease .2s 1}',
    '@keyframes smGlow{0%,100%{box-shadow:0 0 0 0 rgba(240,97,154,0)}40%{box-shadow:0 0 0 10px rgba(240,97,154,.28)}}',
    /* prix en rouleaux */
    '.sm-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.price-amount .sm-pv,.price-amount .sm-pv span{font-family:inherit;font-size:inherit;font-weight:inherit;color:inherit;letter-spacing:inherit}',
    '.sm-reel{display:inline-block;height:1.1em;line-height:1.1em;overflow:hidden;vertical-align:top}',
    '.sm-col{display:block;transition:transform 1.3s cubic-bezier(.2,1.1,.3,1) calc(var(--k,0) * 140ms)}',
    '.sm-col>span{display:block;height:1.1em}',
    '.price-amount.sm-in .sm-col{transform:translateY(calc(var(--to,0) * -1.1em))}',
    '.sm-pd{opacity:0;transform:scale(.7);transition:opacity .3s ease .9s,transform .55s cubic-bezier(.34,1.56,.64,1) .9s}',
    '.price-card.sm-in .sm-pd{opacity:1;transform:none}',
    /* sceau de garantie */
    '.sm-seal{opacity:0;transform:scale(1.9) rotate(-35deg)}',
    '.sm-seal.sm-in{opacity:1;transform:none;transition:opacity .2s ease,transform .6s cubic-bezier(.34,1.56,.64,1)}',
    '.sm-seal.sm-in svg circle:first-child{transform-box:fill-box;transform-origin:center;animation:smSpin 24s linear infinite}',
    '@keyframes smSpin{to{transform:rotate(360deg)}}',
    '.sm-shake{animation:smShake .45s ease 1}',
    '@keyframes smShake{20%{transform:translateX(-5px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}',
    /* assiette */
    '.sm-plate{opacity:0;transform:rotate(-110deg) scale(.6);transition:opacity .4s ease,transform 1.2s cubic-bezier(.16,1,.3,1)}',
    '.sm-plate.sm-in{opacity:1;transform:none}',
    /* cascades */
    '.sm-up{opacity:0;transform:translateY(26px);transition:opacity .6s ease calc(var(--i,0) * 70ms),transform .85s cubic-bezier(.16,1,.3,1) calc(var(--i,0) * 70ms)}',
    '.sm-up.sm-in{opacity:1;transform:none}',
    /* frise : tête lumineuse au bout de la ligne de progression */
    '.sm-tl-head{list-style:none;position:absolute;left:50%;top:0;transform:translateY(calc(var(--p,0) * var(--tlh,0px)));will-change:transform;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px var(--accent,#C62368),0 0 22px 6px rgba(240,97,154,.55);z-index:3;pointer-events:none}'
  ].join('\n');
  var st = d.createElement('style'); st.id = 'sm-style'; st.textContent = CSS; d.head.appendChild(st);
  root.classList.add('sm-on');

  var VH = window.innerHeight;
  function below(el) { return el.getBoundingClientRect().top > VH * 0.9; }
  function skip(el) { return el.closest('.stage, .hero, [data-no-motion], .quiz-modal-overlay, #cookie-banner, .site-header, .desk-join, .mobile-join, .dt-panel:not(.is-active)'); }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      fire(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  var pending = [];
  function fire(el) { var k = pending.indexOf(el); if (k === -1) return; pending.splice(k, 1); io.unobserve(el); if (el.__smGo) el.__smGo(); else el.classList.add('sm-in'); }
  function watch(el, go) { if (go) el.__smGo = go; pending.push(el); io.observe(el); }
  /* Filet de sécurité : tout élément visible encore en attente est déclenché, pour qu'aucun contenu ne reste masqué */
  var chk = 0;
  function sweep() { chk = 0; var vh = window.innerHeight; pending.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh * 0.97 && r.bottom > 0) fire(el); }); }
  window.addEventListener('scroll', function () { if (!chk) chk = setTimeout(sweep, 250); }, { passive: true });
  window.addEventListener('resize', function () { if (!chk) chk = setTimeout(sweep, 250); });
  window.addEventListener('beforeprint', function () { pending.slice().forEach(fire); });

  /* 1. Titres de section : mot par mot + trait d'accent */
  d.querySelectorAll('section h2, .final h2').forEach(function (h) {
    if (skip(h) || h.getAttribute('data-sm') || !below(h)) return;
    h.setAttribute('data-sm', '1');
    var idx = 0;
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.nodeValue.trim()) return;
          var f = d.createDocumentFragment();
          c.nodeValue.split(/([ \t\n]+)/).forEach(function (p) {
            if (!p) return;
            if (/^[ \t\n]+$/.test(p)) { f.appendChild(d.createTextNode(p)); return; }
            var o = d.createElement('span'); o.className = 'sm-w';
            var i = d.createElement('span'); i.className = 'sm-wi'; i.textContent = p; i.style.setProperty('--w', idx++);
            o.appendChild(i); f.appendChild(o);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && !/^(svg|br|img)$/i.test(c.tagName)) walk(c);
      });
    })(h);
    h.classList.add('sm-kw');
    if (getComputedStyle(h).textAlign === 'center') h.classList.add('sm-center');
    watch(h);
  });

  /* 2. Icônes au trait : elles se dessinent */
  var SH = 'path,circle,rect,line,polyline,polygon,ellipse';
  d.querySelectorAll('section svg, .final svg').forEach(function (svg) {
    if (skip(svg) || svg.closest('.sm-ico') || svg.closest('.gb-seal')) return;
    var r = svg.getBoundingClientRect();
    if (!r.width || r.width > 72 || r.height > 72 || !below(svg)) return;
    var drawn = 0;
    svg.querySelectorAll(SH).forEach(function (s) {
      var cs = getComputedStyle(s);
      if (cs.stroke && cs.stroke !== 'none' && parseFloat(cs.strokeWidth) > 0 && cs.strokeDasharray === 'none' && !s.getAttribute('stroke-dasharray')) {
        s.setAttribute('pathLength', '1'); s.classList.add('sm-dr'); drawn++;
      }
    });
    if (!drawn) return;
    svg.classList.add('sm-ico'); watch(svg);
  });

  /* 3. Photos : dévoilées comme un rideau, avec un léger zoom */
  var phCount = new Map();
  d.querySelectorAll('section .c21-photo').forEach(function (f) {
    if (skip(f) || f.closest('.marquee, .gallery-pair, .testi')) return;
    var r = f.getBoundingClientRect();
    if (r.height < 140 || r.width < 140 || !below(f)) return;
    var k = phCount.get(f.parentNode) || 0; phCount.set(f.parentNode, k + 1); f.style.setProperty('--i', k);
    f.classList.add('sm-ph');
    watch(f, function () { f.classList.add('sm-in'); setTimeout(function () { f.classList.add('sm-done'); }, 1700 + k * 90); });
  });

  /* 4. Boutons attirés par la souris (ordinateur) */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    d.querySelectorAll('.btn-primary').forEach(function (b) {
      if (b.closest('.hero, .stage, .quiz-modal-overlay')) return;
      var base = getComputedStyle(b).transition; b.style.transition = (base && base !== 'all 0s ease 0s' ? base + ', ' : '') + 'translate .2s ease';
      b.addEventListener('pointermove', function (e) {
        var rr = b.getBoundingClientRect();
        b.style.translate = (((e.clientX - rr.left) / rr.width - .5) * 12).toFixed(1) + 'px ' + (((e.clientY - rr.top) / rr.height - .5) * 9).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* 5. Communauté : messages qui arrivent un par un, précédés de « … » */
  var cv = d.querySelector('.community-visual');
  if (cv && below(cv)) {
    var bs = cv.querySelectorAll('.community-bubble');
    bs.forEach(function (b) { b.classList.add('sm-bub'); if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; });
    watch(cv, function () {
      bs.forEach(function (b, i) {
        setTimeout(function () {
          b.classList.add('sm-typing');
          setTimeout(function () { b.classList.remove('sm-typing'); b.classList.add('sm-said'); }, 850);
        }, 350 + i * 1250);
      });
    });
  }

  /* 6. Comparatif : lignes une par une, coches du Challenge 21 validées */
  var cmp = d.querySelector('.cmp');
  if (cmp && below(cmp)) {
    cmp.querySelectorAll('tbody tr').forEach(function (r, i) { r.classList.add('sm-row'); r.style.setProperty('--i', i); });
    watch(cmp);
  }

  /* 7. Tarifs : prix en rouleaux, prix par jour qui apparaît, sceau de garantie posé comme un tampon */
  d.querySelectorAll('.price-amount').forEach(function (pa) {
    if (!below(pa)) return;
    var tn = null, w = d.createTreeWalker(pa, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { if (/\d/.test(n.nodeValue)) { tn = n; break; } }
    if (!tn) return;
    var txt = tn.nodeValue, frag = d.createDocumentFragment();
    var sr = d.createElement('span'); sr.className = 'sm-sr'; sr.textContent = txt; frag.appendChild(sr);
    var vis = d.createElement('span'); vis.className = 'sm-pv'; vis.setAttribute('aria-hidden', 'true');
    var k = 0;
    txt.split('').forEach(function (ch) {
      if (/\d/.test(ch)) {
        var reel = d.createElement('span'); reel.className = 'sm-reel';
        var col = d.createElement('span'); col.className = 'sm-col';
        for (var rr = 0; rr < 3; rr++) for (var x = 0; x < 10; x++) { var sp = d.createElement('span'); sp.textContent = x; col.appendChild(sp); }
        col.style.setProperty('--to', 20 + parseInt(ch, 10)); col.style.setProperty('--k', k++);
        reel.appendChild(col); vis.appendChild(reel);
      } else vis.appendChild(d.createTextNode(ch));
    });
    frag.appendChild(vis); tn.parentNode.replaceChild(frag, tn);
    var card = pa.closest('.price-card'), pd = card && card.querySelector('.per-day');
    if (pd) pd.classList.add('sm-pd');
    watch(pa, function () { pa.classList.add('sm-in'); if (card) card.classList.add('sm-in'); });
  });
  var seal = d.querySelector('.gb-seal');
  if (seal && below(seal)) {
    seal.classList.add('sm-seal');
    watch(seal, function () {
      seal.classList.add('sm-in');
      var gb = seal.closest('.guarantee-big');
      if (gb) setTimeout(function () { gb.classList.add('sm-shake'); setTimeout(function () { gb.classList.remove('sm-shake'); }, 500); }, 380);
    });
  }

  /* 8. Assiette équilibrée : elle entre en tournant */
  var plate = d.querySelector('.plate-visual svg');
  if (plate && below(plate)) { plate.classList.add('sm-plate'); watch(plate); }

  /* 10. Cascades : questions, articles, chapitres, cartes (hors éléments déjà animés par le site) */
  var upCount = new Map();
  d.querySelectorAll('.faq-group details, .blog-card, .objection-item, .mini-testi-card, .chap-btn, .why-card, .duo-card').forEach(function (el) {
    if (skip(el) || el.classList.contains('fx') || el.closest('.fx') || !below(el)) return;
    var k = upCount.get(el.parentNode) || 0; upCount.set(el.parentNode, k + 1);
    var i = k % 6; el.style.setProperty('--i', i); el.classList.add('sm-up');
    watch(el, function () {
      el.classList.add('sm-in');
      setTimeout(function () { el.classList.remove('sm-up', 'sm-in'); el.style.removeProperty('--i'); }, 1000 + i * 70);
    });
  });

  /* 9. Frise : tête lumineuse qui suit la ligne de progression existante */
  var tl = d.getElementById('timeline');
  if (tl && !tl.querySelector('.sm-tl-head')) {
    var head = d.createElement('li'); head.className = 'sm-tl-head'; head.setAttribute('aria-hidden', 'true'); head.setAttribute('role', 'presentation');
    tl.appendChild(head);
    function placeHead() { var lb = getComputedStyle(tl, '::before'); var l = parseFloat(lb.left), w = parseFloat(lb.width) || 3; if (!isNaN(l)) head.style.left = (l + (lb.transform && lb.transform !== 'none' ? 0 : w / 2)) + 'px'; }
    function setH() { tl.style.setProperty('--tlh', tl.offsetHeight + 'px'); }
    placeHead(); setH(); window.addEventListener('resize', function () { placeHead(); setH(); });
    if ('ResizeObserver' in window) new ResizeObserver(setH).observe(tl);
  }
})();
