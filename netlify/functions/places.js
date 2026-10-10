// Compteur de places en temps réel : compte les paiements Stripe de l'édition en cours.
// Solo à 47 € = 1 place, Duo à 70 € = 2 places. Seuls ces deux montants sont comptés,
// pour ignorer tes autres ventes sur le même compte Stripe.
// Variable Netlify : STRIPE_SECRET_KEY (clé restreinte : lecture des Checkout Sessions).
const { nextEditionDate, frDate } = require('../lib/brevo');
const TOTAL = 50, SOLO = 4700, DUO = 7000;

function premierLundi(y, m) { const d = new Date(Date.UTC(y, m, 1)); const w = d.getUTCDay(); return new Date(Date.UTC(y, m, 1 + (w === 0 ? 1 : (w === 1 ? 0 : 8 - w)))); }

exports.handler = async function () {
  const headers = { 'content-type': 'application/json', 'cache-control': 'public, max-age=60', 'netlify-cdn-cache-control': 'public, s-maxage=300, stale-while-revalidate=600' };
  const ed = nextEditionDate();
  // Les ventes d'une édition commencent au démarrage de l'édition précédente (au plus tôt le 1er septembre 2026)
  let debut = premierLundi(ed.getUTCFullYear(), ed.getUTCMonth() - 1);
  const plancher = new Date(Date.UTC(2026, 8, 1));
  if (debut < plancher) debut = plancher;
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, total: TOTAL }) };
  let vendues = 0, after = null, pages = 0;
  try {
    while (pages < 10) {
      const q = new URLSearchParams({ limit: '100', status: 'complete', 'created[gte]': String(Math.floor(debut.getTime() / 1000)) });
      if (after) q.set('starting_after', after);
      const r = await fetch('https://api.stripe.com/v1/checkout/sessions?' + q, { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } });
      const d = await r.json();
      if (!r.ok) { console.error('Stripe :', JSON.stringify(d)); return { statusCode: 200, headers, body: JSON.stringify({ ok: false, total: TOTAL }) }; }
      for (const s of d.data || []) {
        if (s.payment_status !== 'paid' || (s.currency || '').toLowerCase() !== 'eur') continue;
        if (s.amount_total === SOLO) vendues += 1;
        else if (s.amount_total === DUO) vendues += 2;
      }
      if (!d.has_more || !d.data.length) break;
      after = d.data[d.data.length - 1].id; pages++;
    }
  } catch (e) { console.error('Places :', e); return { statusCode: 200, headers, body: JSON.stringify({ ok: false, total: TOTAL }) }; }
  const restantes = Math.max(0, TOTAL - vendues);
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, total: TOTAL, vendues, restantes, edition: frDate(ed) }) };
};
