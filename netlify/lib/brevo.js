// Outils partagés : API Brevo, préparation automatique du compte (attributs + liste), modèle d'email.
const API = 'https://api.brevo.com/v3';
const SITE = 'https://challengepertedepoids.fr';
const LIST_NAME = 'Prospects Challenge 21';
const ATTRS = { SOURCE: 'text', PROFIL: 'text', SCORE: 'float', TELEPHONE: 'text', ACHAT: 'text', EDITION: 'text', EDITION_DATE: 'date', REEQ_ENVOYE: 'text', INSCRIT_LE: 'date', SEQ_ETAPE: 'float' };

function key() { return process.env.BREVO_API_KEY; }
function sender() { return process.env.BREVO_SENDER_EMAIL || 'ga.coachs@gmail.com'; }

async function api(path, method, body) {
  const r = await fetch(API + path, {
    method: method || 'GET',
    headers: { 'accept': 'application/json', 'api-key': key(), 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const txt = await r.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
  return { ok: r.ok, status: r.status, data };
}

// Crée les attributs manquants et retrouve (ou crée) la liste « Prospects Challenge 21 ».
let cachedList = null;
async function setup() {
  if (cachedList) return cachedList;
  try {
    const a = await api('/contacts/attributes');
    const have = new Set(((a.data && a.data.attributes) || []).map(x => x.name));
    for (const [name, type] of Object.entries(ATTRS)) {
      if (!have.has(name)) await api('/contacts/attributes/normal/' + name, 'POST', { type });
    }
  } catch (e) { console.error('Attributs Brevo :', e); }
  const envId = parseInt(process.env.BREVO_LIST_ID || '', 10);
  if (envId) { cachedList = envId; return envId; }
  let offset = 0;
  while (offset < 500) {
    const l = await api('/contacts/lists?limit=50&offset=' + offset);
    const lists = (l.data && l.data.lists) || [];
    const found = lists.find(x => x.name === LIST_NAME);
    if (found) { cachedList = found.id; return found.id; }
    if (lists.length < 50) break;
    offset += 50;
  }
  const f = await api('/contacts/folders?limit=10&offset=0');
  const folderId = ((f.data && f.data.folders) || [])[0]?.id || 1;
  const c = await api('/contacts/lists', 'POST', { name: LIST_NAME, folderId });
  cachedList = c.data && c.data.id;
  return cachedList;
}

function parisDate(d) { return (d || new Date()).toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); }

// Enregistre ou met à jour une contact au moment de l'inscription (démarre sa séquence).
async function upsertContact(email, attrs) {
  const listId = await setup();
  const attributes = Object.assign({ INSCRIT_LE: parisDate(), SEQ_ETAPE: 0 }, attrs);
  const body = { email, attributes, updateEnabled: true };
  if (listId) body.listIds = [listId];
  let r = await api('/contacts', 'POST', body);
  if (!r.ok) {
    console.error('Brevo contact :', r.status, JSON.stringify(r.data));
    body.attributes = { PRENOM: attrs.PRENOM || '' };
    r = await api('/contacts', 'POST', body);
  }
  return r.ok;
}

// Prochaine édition : lancement exceptionnel le 19 octobre 2026, pas d'édition en novembre,
// reprise du rythme normal (premier lundi du mois) à partir du 7 décembre 2026.
function fm(y, m) { const d = new Date(Date.UTC(y, m, 1)); const w = d.getUTCDay(); return new Date(Date.UTC(y, m, 1 + (w === 0 ? 1 : (w === 1 ? 0 : 8 - w)))); }
function nextEditionDate() {
  const now = new Date();
  const specialFirst = new Date(Date.UTC(2026, 9, 19));
  if (now < specialFirst) return specialFirst;
  const resumeMonthly = fm(2026, 11);
  if (now < resumeMonthly) return resumeMonthly;
  let t = fm(now.getUTCFullYear(), now.getUTCMonth());
  if (now >= t) t = fm(now.getUTCFullYear(), now.getUTCMonth() + 1);
  return t;
}
function frDate(d) { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }); }
function nextEdition() { return frDate(nextEditionDate()); }

// Lien de désinscription signé.
function unsubUrl(email) {
  const crypto = require('crypto');
  const t = crypto.createHmac('sha256', key() || 'c21').update(email.toLowerCase()).digest('hex').slice(0, 24);
  return SITE + '/.netlify/functions/desinscription?e=' + encodeURIComponent(email) + '&t=' + t;
}
function checkToken(email, t) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', key() || 'c21').update(String(email).toLowerCase()).digest('hex').slice(0, 24) === t;
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// Blocs du modèle d'email
const B = {
  p: t => `<p style="margin:0 0 16px">${t}</p>`,
  tip: (title, t) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#FDF0F5;border-left:4px solid #F0619A;border-radius:12px"><tr><td style="padding:18px 20px;font-size:15px;line-height:1.65"><div style="font-size:12px;font-weight:bold;letter-spacing:1px;color:#C2296B;text-transform:uppercase;margin-bottom:6px">${title}</div>${t}</td></tr></table>`,
  quote: (t, who) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#221720;border-radius:12px"><tr><td style="padding:18px 22px;color:#FBF3EA;font-family:Georgia,serif;font-style:italic;font-size:17px;line-height:1.5">« ${t} »<div style="font-family:Arial,Helvetica,sans-serif;font-style:normal;font-size:13px;color:#F7A8C9;margin-top:8px">${who}</div></td></tr></table>`,
  list: items => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px">${items.map(i => `<tr><td style="padding:6px 0;font-size:15px"><span style="color:#C2296B;font-weight:bold">✓</span>&nbsp; ${i}</td></tr>`).join('')}</table>`,
  btn: (label, url) => `<p style="text-align:center;margin:30px 0 26px"><a href="${url}" style="background:#F0619A;color:#221720;text-decoration:none;font-weight:bold;padding:16px 30px;border-radius:100px;display:inline-block;font-size:16px">${label}</a></p>`,
  ps: t => `<p style="margin:22px 0 0;font-size:14px;color:#5d4c5b"><b>P.S.</b> ${t}</p>`
};

function layout({ kicker, title, body, email }) {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#F6EEF2;font-family:Arial,Helvetica,sans-serif;color:#221720">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EEF2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:#221720;padding:28px 34px;color:#FBF3EA"><div style="font-family:Georgia,serif;font-size:18px">Challenge <span style="color:#F0619A">21</span></div>
<div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#F7A8C9;margin-top:18px">${kicker}</div>
<div style="font-family:Georgia,serif;font-size:27px;line-height:1.25;margin-top:6px">${title}</div></td></tr>
<tr><td style="padding:30px 34px;font-size:16px;line-height:1.7">${body}</td></tr>
<tr><td style="background:#FBF3EA;padding:16px 34px;font-size:12px;color:#8a7788;text-align:center">Tu reçois cet email parce que tu t'es inscrite sur challengepertedepoids.fr.<br>Une question ? Réponds simplement à cet email. · <a href="${unsubUrl(email)}" style="color:#8a7788">Se désinscrire</a></td></tr>
</table></td></tr></table></body></html>`;
}
const SIGN = `<p style="margin:0">À très vite,<br><b>Garry</b><br><span style="color:#8a7788;font-size:14px">Coach sportif diplômé STAPS</span></p>`;

// Version texte brut dérivée du HTML : améliore la délivrabilité (les filtres anti-spam
// pénalisent les emails qui n'ont que du HTML, sans alternative texte).
function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function sendEmail(email, name, subject, html, tag) {
  return api('/smtp/email', 'POST', {
    sender: { name: 'Garry, Challenge 21', email: sender() },
    replyTo: { email: sender(), name: 'Garry' },
    to: [{ email, name: name || email }],
    subject, htmlContent: html, textContent: htmlToText(html), tags: [tag || 'sequence']
  });
}

module.exports = { api, setup, upsertContact, parisDate, nextEdition, nextEditionDate, frDate, unsubUrl, checkToken, esc, B, layout, SIGN, sendEmail, htmlToText, SITE };
