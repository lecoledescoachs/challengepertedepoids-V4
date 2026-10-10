// Inscription depuis le test détox, la présentation ou le pop-up : ajoute la contact dans Brevo
// avec sa source et son profil. Sa séquence d'emails démarre automatiquement (voir sequences.js).
const { upsertContact } = require('../lib/brevo');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!process.env.BREVO_API_KEY) { console.error('BREVO_API_KEY manquante.'); return { statusCode: 500, body: '{}' }; }
  let d; try { d = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '{}' }; }
  const email = (d.email || '').toString().trim().slice(0, 200);
  const name = (d.name || '').toString().trim().slice(0, 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { statusCode: 400, body: JSON.stringify({ error: 'Email invalide.' }) };
  const source = ['test', 'popup', 'presentation', 'attente', 'liste', 'guide'].includes(d.source) ? d.source : 'test';
  const attrs = { PRENOM: name, SOURCE: source };
  const score = parseInt(d.score, 10);
  if (!isNaN(score)) { attrs.SCORE = score; attrs.PROFIL = score <= 6 ? '1' : (score <= 15 ? '2' : '3'); }
  const tel = (d.telephone || d.phone || '').toString().replace(/[^\d+ ]/g, '').trim().slice(0, 20);
  if (tel) attrs.TELEPHONE = tel;
  try {
    const ok = await upsertContact(email, attrs);
    return { statusCode: ok ? 200 : 502, body: JSON.stringify({ success: ok }) };
  } catch (e) { console.error('brevo-contact :', e); return { statusCode: 500, body: '{}' }; }
};
