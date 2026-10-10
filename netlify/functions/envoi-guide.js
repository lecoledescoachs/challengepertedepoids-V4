// Fonction serverless Netlify : envoi automatique du guide « Ce qui marche vraiment pour perdre du poids »
// 1. ajoute ou met à jour la contact dans Brevo (liste Prospects, SOURCE = guide, téléphone si fourni)
// 2. envoie l'email avec le lien de téléchargement du guide
//
// Variables d'environnement Netlify :
//   BREVO_API_KEY       clé API Brevo (v3)
//   BREVO_LIST_ID       numéro de la liste « Prospects Challenge 21 »
//   BREVO_SENDER_EMAIL  adresse d'envoi du site (domaine authentifié dans Brevo)

const { upsertContact, unsubUrl, htmlToText } = require('../lib/brevo');
const SITE = 'https://challengepertedepoids.fr';
const GUIDE = SITE + '/telechargements/guide-ce-qui-marche-vraiment.pdf';

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function emailHtml(prenom, email) {
  const p = esc(prenom);
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#F6EEF2;font-family:Arial,Helvetica,sans-serif;color:#221720">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6EEF2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="background:#221720;padding:28px 32px;color:#FBF3EA">
<div style="font-family:Georgia,serif;font-size:18px">Challenge <span style="color:#F0619A">21</span></div>
<div style="font-family:Georgia,serif;font-size:26px;line-height:1.2;margin-top:14px">Ton guide est prêt, ${p} !</div>
</td></tr>
<tr><td style="padding:28px 32px;font-size:16px;line-height:1.6">
<p style="margin:0 0 16px">Merci pour ta confiance. Voici ton guide <b>« Ce qui marche vraiment pour perdre du poids »</b> : les 12 habitudes qui font la différence, l'assiette idéale, 4 recettes express et un programme sport de 3 semaines, à la maison ou en salle.</p>
<p style="text-align:center;margin:26px 0"><a href="${GUIDE}" style="background:#F0619A;color:#221720;text-decoration:none;font-weight:bold;padding:15px 28px;border-radius:100px;display:inline-block">Télécharger mon guide</a></p>
<p style="margin:0 0 10px"><b>Pour bien démarrer :</b></p>
<ol style="margin:0 0 18px;padding-left:20px">
<li>Note ton point de départ page 2 : poids, tour de taille, énergie.</li>
<li>Choisis 3 habitudes page 3, celles qui te semblent les plus faciles.</li>
<li>Fais ta première séance cette semaine : 25 minutes suffisent.</li>
</ol>
<p style="margin:0 0 18px">Astuce : le guide se remplit directement sur ton téléphone. Tu peux cocher tes habitudes chaque soir sans rien imprimer.</p>
<p style="margin:0 0 18px">Et si tu as envie d'aller plus loin, avec des recettes prêtes, un groupe qui avance avec toi et deux lives avec moi, la prochaine édition du Challenge 21 démarre le premier lundi du mois.</p>
<p style="text-align:center;margin:22px 0"><a href="${SITE}/?utm_source=email_guide#tarifs" style="color:#C2296B;font-weight:bold">Découvrir le Challenge 21 →</a></p>
<p style="margin:0">À très vite,<br><b>Garry</b><br><span style="color:#8a7788;font-size:14px">Coach sportif diplômé STAPS</span></p>
</td></tr>
<tr><td style="background:#FBF3EA;padding:16px 32px;font-size:12px;color:#8a7788;text-align:center">Tu reçois cet email parce que tu as demandé le guide sur challengepertedepoids.fr.<br>Une question ? Réponds simplement à cet email. · <a href="${unsubUrl(email)}" style="color:#8a7788">Se désinscrire</a></td></tr>
</table></td></tr></table></body></html>`;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const KEY = process.env.BREVO_API_KEY;
  const LIST = parseInt(process.env.BREVO_LIST_ID || '', 10);
  const SENDER = process.env.BREVO_SENDER_EMAIL || 'ga.coachs@gmail.com';
  if (!KEY) { console.error('BREVO_API_KEY manquante.'); return { statusCode: 500, body: JSON.stringify({ error: 'Configuration serveur incomplète.' }) }; }

  let d; try { d = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '{}' }; }
  const prenom = (d.prenom || '').toString().trim().slice(0, 60);
  const email = (d.email || '').toString().trim().slice(0, 200);
  const tel = (d.telephone || '').toString().replace(/[^\d+ ]/g, '').trim().slice(0, 20);
  if (!prenom) return { statusCode: 400, body: JSON.stringify({ error: 'Prénom manquant.' }) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { statusCode: 400, body: JSON.stringify({ error: 'Email invalide.' }) };
  if (d['bot-field']) return { statusCode: 200, body: JSON.stringify({ success: true }) };

  const headers = { 'accept': 'application/json', 'api-key': KEY, 'content-type': 'application/json' };

  // 1. Contact Brevo : démarre la séquence G (sans bloquer l'envoi du guide en cas d'échec)
  try {
    const attrs = { PRENOM: prenom, SOURCE: 'guide' };
    if (tel) attrs.TELEPHONE = tel;
    await upsertContact(email, attrs);
  } catch (e) { console.error('Erreur contact Brevo :', e); }

  // 2. Email avec le guide
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers,
      body: JSON.stringify({
        sender: { name: 'Garry, Challenge 21', email: SENDER },
        replyTo: { email: SENDER, name: 'Garry' },
        to: [{ email: email, name: prenom }],
        subject: prenom + ', ton guide « Ce qui marche vraiment » est prêt',
        htmlContent: emailHtml(prenom, email),
        textContent: htmlToText(emailHtml(prenom, email)),
        tags: ['guide']
      })
    });
    if (!r.ok) { console.error('Brevo email :', await r.text()); return { statusCode: 502, body: JSON.stringify({ error: 'Envoi de l\'email impossible.' }) }; }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    console.error('Erreur envoi guide :', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur.' }) };
  }
};
