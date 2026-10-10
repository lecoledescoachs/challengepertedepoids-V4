// Fonction serverless Netlify : envoie l'email de résultat du quiz via Brevo.
// La clé API Brevo reste secrète ici (variable d'environnement), jamais exposée au navigateur.
//
// Configuration requise sur Netlify (Site settings > Environment variables) :
//   BREVO_API_KEY = ta clé API Brevo (Brevo > Paramètres > Clés API > créer une clé API v3)
//   BREVO_SENDER_EMAIL = adresse d'envoi du site, domaine authentifié dans Brevo (ex. contact@challengepertedepoids.fr)
//
// URL appelée par le site : /.netlify/functions/quiz-result-email

const { htmlToText } = require('../lib/brevo');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY manquante dans les variables d\'environnement Netlify.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Configuration serveur incomplète.' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Requête invalide.' }) };
  }

  const name = (data.name || '').toString().trim().slice(0, 100);
  const email = (data.email || '').toString().trim().slice(0, 200);
  const resultTitle = (data.resultTitle || '').toString().trim().slice(0, 200);
  const resultText = (data.resultText || '').toString().trim().slice(0, 1000);
  const formulaText = (data.formulaText || '').toString().trim().slice(0, 500);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prénom ou email invalide.' }) };
  }

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #3D3438;">
      <h1 style="font-family: Georgia, serif; color: #A8134F;">Ton résultat, ${name} 🌸</h1>
      <p><strong>${resultTitle}</strong></p>
      <p>${resultText}</p>
      <p style="background: #F3D3E1; padding: 16px 20px; border-radius: 12px;">${formulaText}</p>
      <p>
        <a href="https://challengepertedepoids.fr/vsl.html" style="display:inline-block; background:#A8134F; color:#fff; text-decoration:none; padding:12px 24px; border-radius:100px; font-weight:bold;">
          Voir la présentation complète et les tarifs
        </a>
      </p>
      <p style="color:#6B5E63; font-size:14px;">À très vite,<br>Garry, Challenge 21</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Garry, Challenge 21', email: process.env.BREVO_SENDER_EMAIL || 'ga.coachs@gmail.com' },
        replyTo: { email: process.env.BREVO_SENDER_EMAIL || 'ga.coachs@gmail.com', name: 'Garry' },
        to: [{ email: email, name: name }],
        subject: `${name}, voici ton résultat du test Challenge 21 🌸`,
        htmlContent: htmlContent,
        textContent: htmlToText(htmlContent)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur Brevo:', errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Envoi impossible.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Erreur fonction:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur.' }) };
  }
};
