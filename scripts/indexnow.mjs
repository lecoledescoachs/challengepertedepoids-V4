// Prévient Bing, Yandex et les autres moteurs IndexNow des URL du site à chaque déploiement de production.
import { readFileSync, readdirSync } from 'node:fs';
const HOST = 'challengepertedepoids.fr';
try {
  if ((process.env.CONTEXT || 'production') !== 'production') process.exit(0);
  const key = readFileSync('.indexnow-key', 'utf8').trim();
  const urls = readdirSync('.').filter(f => /^sitemap-.*\.xml$/.test(f))
    .flatMap(f => [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls.slice(0, 10000) })
  });
  console.log('IndexNow', urls.length, 'URL, statut', r.status);
} catch (e) { console.log('IndexNow ignoré:', e.message); }
