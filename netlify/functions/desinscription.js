// Désinscription en un clic depuis les emails des séquences.
const { api, checkToken } = require('../lib/brevo');
const page = (t, m) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t}</title></head><body style="margin:0;background:#221720;color:#FBF3EA;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;text-align:center"><div style="max-width:440px"><div style="font-family:Georgia,serif;font-size:20px;margin-bottom:18px">Challenge <span style="color:#F0619A">21</span></div><h1 style="font-family:Georgia,serif;font-weight:normal">${t}</h1><p style="color:#C6B7C6;line-height:1.6">${m}</p><p><a href="https://challengepertedepoids.fr" style="color:#F0619A">Retour au site</a></p></div></body></html>`;
exports.handler = async function (event) {
  const q = event.queryStringParameters || {};
  const email = q.e || '', t = q.t || '';
  const headers = { 'content-type': 'text/html; charset=utf-8' };
  if (!email || !checkToken(email, t)) return { statusCode: 400, headers, body: page('Lien invalide', 'Ce lien de désinscription semble incomplet. Réponds simplement à l\'un de nos emails, et on s\'en occupe.') };
  const r = await api('/contacts/' + encodeURIComponent(email), 'PUT', { emailBlacklisted: true });
  if (!r.ok) console.error('Désinscription :', r.status, JSON.stringify(r.data));
  return { statusCode: 200, headers, body: page('C\'est fait', 'Ta désinscription est bien enregistrée. Merci pour ta confiance, et belle route à toi.') };
};
