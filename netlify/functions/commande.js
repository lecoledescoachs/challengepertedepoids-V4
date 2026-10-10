// Après paiement : Stripe redirige vers merci.html?session_id={CHECKOUT_SESSION_ID}.
// Cette fonction vérifie le paiement auprès de Stripe, puis :
//  1. renvoie à la page merci le lien du Guide Détox (uniquement si le paiement est confirmé) ;
//     le Guide Rééquilibrage est envoyé le jour 6 de l'édition par sequences.js ;
//  2. met à jour la contact dans Brevo (ACHAT = solo ou duo, EDITION) : ses séquences de vente s'arrêtent ;
//  3. envoie l'email de bienvenue avec le Guide Détox, une seule fois.
// Variables Netlify : STRIPE_SECRET_KEY (clé restreinte, lecture des Checkout Sessions), BREVO_API_KEY, BREVO_SENDER_EMAIL.
const { api, upsertContact, nextEdition, nextEditionDate, frDate, esc, B, layout, sendEmail, SITE } = require('../lib/brevo');

const DOSSIER = '/espace/c21-699e66c2d89935049078/';
exports.GUIDES = null;
const GUIDES = {
  detox: SITE + DOSSIER + 'Guide-Detox-Challenge21.pdf',
  reequilibrage: SITE + DOSSIER + 'Guide-Reequilibrage-Challenge21.pdf'
};
const GROUPE = 'https://chat.whatsapp.com/IvhwPbZibgD8xzHLZxwmyN';

function welcome(prenom, formule, edition, jour6, email) {
  const P = esc(prenom);
  const body =
    B.p(P ? `Coucou ${P},` : 'Coucou,') +
    B.p(`Bienvenue dans le Challenge 21 ! Ton inscription${formule === 'duo' ? ' en Duo' : ''} est confirmée, et ton édition démarre <b>${edition}</b>. Voici ton Guide Détox, pour ta première semaine.`) +
    '<p style="text-align:center;margin:26px 0 10px"><a href="' + GUIDES.detox + '" style="background:#3e8a5a;color:#fff;text-decoration:none;font-weight:bold;padding:16px 28px;border-radius:100px;display:inline-block;font-size:16px">Télécharger mon Guide Détox</a></p>' +
    B.p('<b>Et ton Guide Rééquilibrage ?</b> Il arrive par email le <b>' + jour6 + '</b>, le jour 6 de ton Challenge : tu auras le week-end pour faire tes courses avant le jour 8.') +
    B.tip('Tes 4 étapes avant le premier jour', '<b>1.</b> Rejoins la communauté WhatsApp de ton édition.<br><b>2.</b> Lis les pages « Bien démarrer » du Guide Détox.<br><b>3.</b> Fais tes courses avec la liste à cocher, la veille ou l\'avant-veille.<br><b>4.</b> La veille au matin : pesée, mesures et photos de départ.') +
    B.btn('Rejoindre la communauté WhatsApp', GROUPE) +
    (formule === 'duo' ? B.p('<b>Ton binôme</b> : transfère-lui simplement cet email. Elle y trouvera son Guide Détox et le lien de la communauté.') : '') +
    B.p('Astuce : le guide se remplit directement sur ton téléphone. Enregistre-le dans tes fichiers pour l\'avoir toujours avec toi.') +
    '<p style="margin:0">À très vite dans le groupe,<br><b>Garry</b><br><span style="color:#8a7788;font-size:14px">Coach sportif diplômé STAPS</span></p>';
  return layout({ kicker: 'Inscription confirmée', title: 'Bienvenue dans le Challenge 21 !', body, email });
}

exports.handler = async function (event) {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  const sid = ((event.queryStringParameters || {}).session_id || '').trim();
  if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return { statusCode: 400, headers, body: JSON.stringify({ ok: false }) };
  if (!process.env.STRIPE_SECRET_KEY) { console.error('STRIPE_SECRET_KEY manquante.'); return { statusCode: 500, headers, body: JSON.stringify({ ok: false }) }; }

  let s;
  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sid), { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } });
    s = await r.json();
    if (!r.ok) { console.error('Stripe :', JSON.stringify(s)); return { statusCode: 404, headers, body: JSON.stringify({ ok: false }) }; }
  } catch (e) { console.error('Stripe :', e); return { statusCode: 502, headers, body: JSON.stringify({ ok: false }) }; }

  if (s.payment_status !== 'paid') return { statusCode: 402, headers, body: JSON.stringify({ ok: false, statut: s.payment_status }) };

  const cd = s.customer_details || {};
  const email = (cd.email || '').trim();
  const prenom = (cd.name || '').trim().split(/\s+/)[0] || '';
  const formule = (s.amount_total || 0) >= 6000 ? 'duo' : 'solo';
  const ed = nextEditionDate(); const edition = frDate(ed);
  const j6 = new Date(ed.getTime() + 5 * 86400000); const jour6 = frDate(j6);

  if (email && process.env.BREVO_API_KEY) {
    try {
      // Email de bienvenue une seule fois : on regarde si l'achat est déjà enregistré
      const c = await api('/contacts/' + encodeURIComponent(email));
      const deja = c.ok && c.data && c.data.attributes && c.data.attributes.ACHAT;
      await upsertContact(email, { PRENOM: prenom, ACHAT: formule, EDITION: edition, EDITION_DATE: ed.toISOString().slice(0, 10) });
      if (!deja) {
        const r = await sendEmail(email, prenom, (prenom ? prenom + ', t' : 'T') + 'on Guide Détox est prêt', welcome(prenom, formule, edition, jour6, email), 'achat');
        if (!r.ok) console.error('Email de bienvenue :', JSON.stringify(r.data));
      }
    } catch (e) { console.error('Brevo :', e); }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, prenom, formule, edition, jour6, guides: { detox: GUIDES.detox } }) };
};

exports.GUIDES = GUIDES;
