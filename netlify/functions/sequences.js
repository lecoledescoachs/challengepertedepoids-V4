// Fonction planifiée (chaque matin) : envoie à chaque inscrite l'email de sa séquence selon sa façon de s'inscrire.
//   SOURCE = guide (guide offert, pop-up)          → séquence G : J+2, J+4, J+6, J+8, J+11
//   SOURCE = test ou presentation (test détox, VSL) → séquence A : J+1, J+2, J+3, J+5, J+7
// La contact sort de la séquence dès que l'attribut ACHAT est rempli, ou si elle se désinscrit.
const { api, setup, parisDate, nextEdition, frDate, esc, B, layout, SIGN, sendEmail, SITE } = require('../lib/brevo');
const { GUIDES } = require('./commande');
const GROUPE = 'https://chat.whatsapp.com/IvhwPbZibgD8xzHLZxwmyN';

// Guide Rééquilibrage : envoyé le jour 6 de l'édition (5 jours après le lundi de départ), au plus tard jusqu'au jour 12
function reeqEmail(prenom, jour8, email) {
  const P = esc(prenom);
  const body = B.p(P ? `Coucou ${P},` : 'Coucou,') +
    B.p(`Bravo, tu es au jour 6 de ta détox ! Voici ton <b>Guide Rééquilibrage</b>, pour les jours 8 à 21. Tu as le week-end pour faire tes courses : le rééquilibrage commence <b>${jour8}</b>.`) +
    '<p style="text-align:center;margin:26px 0"><a href="' + GUIDES.reequilibrage + '" style="background:#F0619A;color:#221720;text-decoration:none;font-weight:bold;padding:16px 28px;border-radius:100px;display:inline-block;font-size:16px">Télécharger mon Guide Rééquilibrage</a></p>' +
    B.tip('Ton week-end en 3 étapes', '<b>1.</b> Ouvre la liste de courses de la semaine 2, page « Tes listes de courses ».<br><b>2.</b> Fais ton batch du dimanche : pancakes, muffins et boules d\'énergie.<br><b>3.</b> Lundi matin, au réveil et à jeun : tes résultats de la détox, avant ton premier petit-déjeuner complet.') +
    B.btn('Partager mes victoires dans la communauté', GROUPE) + SIGN;
  return layout({ kicker: 'Jour 6 de ton Challenge', title: 'Ton Guide Rééquilibrage est arrivé', body, email });
}

const u = (c, a) => `${SITE}/?utm_source=sequence&utm_campaign=${c}${a || ''}`;

function G(step, c) {
  const P = esc(c.prenom), ed = nextEdition(), hi = P ? `${P},` : 'Coucou,', hello = P ? `Coucou ${P},` : 'Coucou,';
  const map = {
    1: { day: 2, subject: P ? `${P}, tu as fait ta première séance ?` : 'Tu as fait ta première séance ?', kicker: 'Ton guide, jour 2', title: 'Ta première victoire t\'attend', body:
      B.p(hello) + B.p(`Il y a deux jours, tu as téléchargé ton guide. Alors, cette première séance ?`) +
      B.p(`<b>Si elle est faite</b> : bravo ! Coche-la dans ton planning page 11, c'est ta première victoire. <b>Si elle t'attend encore</b> : commence petit, dès ce soir, dans ton salon.`) +
      B.tip('Le conseil de Garry : la séance de 10 minutes', `Fais l'échauffement de la page 8, puis 2 exercices du circuit maison page 9 : le squat et le pont fessier, 2 tours de 30 secondes. Dix minutes, et tu as lancé la machine. Le plus dur, c'est de commencer, et tu viens de le faire.`) +
      B.p(`Dis-moi en réponse à cet email comment ça s'est passé : je lis tous les messages.`) +
      B.btn('Revoir mon guide', `${SITE}/telechargements/guide-ce-qui-marche-vraiment.pdf`) + SIGN },
    2: { day: 4, subject: 'Ma recette express pour les soirs pressés', kicker: 'Recette', title: 'Les pancakes minceur des Challengeuses', body:
      B.p(hi) + B.p(`Voici une des recettes préférées des Challengeuses, parfaite pour un petit-déjeuner qui tient jusqu'à midi.`) +
      B.tip('Pancakes minceur · 9 pancakes · 15 minutes', `<b>Ingrédients</b> : 3 œufs, 300 ml de lait d'amande non sucré, 90 g de flocons d'avoine mixés, 45 g de protéine vanille, 1,5 cuillère à café de poudre à lever, vanille ou cannelle.<br><br><b>Préparation</b> : monte les blancs en neige, mélange le reste, incorpore les blancs délicatement, puis fais dorer 3 minutes de chaque côté. Avec des fruits rouges, c'est un régal.`) +
      B.p(`Dans le Challenge 21, tu en as <b>plus de 40</b> comme celle-ci : smoothies, bowls, brochettes, muffins, avec les listes de courses à cocher, rayon par rayon.`) +
      B.btn('Découvrir le menu du Challenge', u('g2', '#menu')) + SIGN },
    3: { day: 6, subject: 'Elle a tout essayé, puis elle a changé une seule chose', kicker: 'Histoire vraie', title: 'L\'histoire de Laëtitia', body:
      B.p(hi) + B.p(`Je veux te présenter Laëtitia. Dukan, Weight Watchers, les diététiciennes : elle avait tout tenté. Au plus haut, elle pesait 136 kg.`) +
      B.p(`Pendant son Challenge 21, elle a perdu <b>6,5 kg et 12 cm de tour de taille</b>. Avec la suite de l'accompagnement, <b>44,9 kg au total</b>.`) +
      B.quote('Je me sens libre de me dire : tu vas y arriver, parce que tu es forte.', 'Laëtitia, 42 ans') +
      B.p(`Ce qui a tout changé pour elle : avancer entourée, avec un cadre clair. C'est exactement ce que tu retrouves dans le Challenge 21 : un groupe qui partage ses résultats, ses photos, ses victoires, et deux lives avec moi.`) +
      B.btn('Voir son histoire', u('g3', '#temoignages')) + SIGN },
    4: { day: 8, subject: P ? `${P}, on se lance ensemble ${ed} ?` : `On se lance ensemble ${ed} ?`, kicker: 'Invitation', title: 'Et si on passait à la vitesse supérieure ?', body:
      B.p(hi) + B.p(`Tu as les bases avec le guide. Le Challenge 21, c'est le cadre pour les appliquer 21 jours d'affilée, bien entourée :`) +
      B.list(['Le Guide Détox et le Guide Rééquilibrage, avec plus de 40 recettes', 'Les listes de courses à cocher, rayon par rayon', 'Le groupe WhatsApp de ton édition', 'Deux lives avec moi, le vendredi de la 1re et de la 3e semaine', 'La garantie Satisfaite ou Remboursée']) +
      B.p(`C'est <b>47 €</b> pour les 21 jours, soit 2,24 € par jour, ou <b>70 € pour deux</b> avec une amie. La prochaine édition démarre <b>${ed}</b>, avec 50 places.`) +
      B.btn('Je rejoins le Challenge 21', u('g4', '#tarifs')) + SIGN +
      B.ps(`Tu préfères un suivi individuel ? C'est possible aussi, en ligne ou en présentiel, avec moi ou un coach de mon équipe : réponds simplement à cet email.`) },
    5: { day: 11, subject: 'Et si tu le faisais avec une amie ?', kicker: 'L\'offre Duo', title: 'À deux, on va deux fois plus loin', body:
      B.p(hi) + B.p(`Tu as sûrement une amie, une sœur ou une collègue qui a le même objectif que toi.`) +
      B.tip('Le conseil de Garry : la méthode du binôme', `Fixez-vous un rendez-vous chaque semaine (une marche, un appel, une séance) et envoyez-vous chaque soir une victoire du jour. On tient pour soi, et aussi pour l'autre.`) +
      B.p(`Avec l'offre Duo, vous payez <b>35 € chacune</b> au lieu de 47 €, et vous rejoignez le même groupe. Transfère-lui cet email, et partage-lui aussi le guide : il est fait pour ça.`) +
      B.btn('On le fait à deux', u('g5', '#tarifs')) + SIGN }
  };
  return map[step];
}

function A(step, c) {
  const P = esc(c.prenom), ed = nextEdition(), prof = String(c.profil || '2'), hi = P ? `${P},` : 'Coucou,', hello = P ? `Coucou ${P},` : 'Coucou,';
  const open = {
    '1': `Hier, ton test montrait peu de signes de fatigue. Ce qui t'aidera le plus, c'est un cadre simple. Laisse-moi te présenter Laëtitia.`,
    '2': `Hier, ton test montrait un corps un peu fatigué par le rythme de vie. Tu es loin d'être seule : Laëtitia était exactement là.`,
    '3': `Hier, ton test montrait un organisme vraiment sursollicité. On peut repartir de loin, et Laëtitia en est la preuve.`
  }[prof] || '';
  const map = {
    1: { day: 1, subject: 'Elle pesait 136 kg, et elle a tout essayé', kicker: 'Suite à ton test', title: 'Ce qui a enfin marché pour Laëtitia', body:
      B.p(hello) + B.p(open) +
      B.p(`Laëtitia avait 2 ans quand le mot « obésité » a été écrit dans son carnet de santé. Elle a tout tenté : Dukan, Weight Watchers, les diététiciennes. Au plus haut, elle pesait 136 kg.`) +
      B.p(`Pendant son Challenge 21, elle a perdu <b>6,5 kg et 12 cm de tour de taille</b>. Avec la suite de l'accompagnement, <b>44,9 kg au total</b>.`) +
      B.quote('Je me sens libre de me dire : tu vas y arriver, parce que tu es forte.', 'Laëtitia, 42 ans') +
      B.p(`Ce qui a changé pour elle : un cadre clair, et avancer entourée.`) +
      B.btn('Découvrir la méthode', u('a1', '#methode')) + SIGN },
    2: { day: 2, subject: 'Pourquoi tu vas manger à ta faim', kicker: 'La méthode', title: '7 jours de détox, puis 14 jours de rééquilibrage', body:
      B.p(hi) + B.p(`La plupart des régimes s'arrêtent pour une raison simple : on a faim, on craque, on culpabilise. Le Challenge 21 fonctionne autrement.`) +
      B.list(['<b>Jours 1 à 7, la détox</b> : fruits, légumes, soupes et smoothies à volonté, pour calmer les fringales et dégonfler.', '<b>Jours 8 à 21, le rééquilibrage</b> : des repas complets, à ta faim, pancakes et bowls compris.', 'Les guides et les listes de courses : tout est prévu, tu suis simplement le plan.']) +
      (prof === '3' ? B.p(`Vu ton résultat au test, c'est la phase détox qui fera la plus grande différence pour toi.`) : '') +
      B.tip('Le conseil de Garry', `Commence ton déjeuner et ton dîner par une entrée de crudités ou un bol de soupe. Tu arrives au plat principal déjà à moitié rassasiée, et tu manges naturellement la juste quantité.`) +
      B.btn('Voir ce que je mange, phase par phase', u('a2', '#detail')) + SIGN },
    3: { day: 3, subject: 'Le vrai secret des femmes qui vont au bout', kicker: 'La communauté', title: 'Le groupe, ce qui fait toute la différence', body:
      B.p(hi) + B.p(`Sur les 10 éditions du Challenge depuis 2020, ce que les participantes citent le plus souvent pour expliquer leur réussite, c'est le groupe.`) +
      B.p(`Chaque semaine, dans le groupe WhatsApp de ton édition, tu partages tes résultats, tes photos, tes petites victoires. Les jours de doute, les autres sont là. Et je te retrouve en live deux vendredis.`) +
      B.quote('On devrait tous avoir un Garry dans sa vie ! Son challenge 21 jours est génial, simple, et très efficace.', 'Céline, 44 ans') +
      B.btn('Rejoindre la prochaine édition', u('a3', '#tarifs')) + SIGN },
    4: { day: 5, subject: 'Et si tu le faisais avec une amie ?', kicker: 'L\'offre Duo', title: '35 € chacune, et une partenaire pour 21 jours', body:
      B.p(hi) + B.p(`Tu as sûrement une amie, une sœur ou une collègue qui se pose les mêmes questions que toi. À deux, on tient beaucoup plus facilement : on se motive, on se partage les recettes, on célèbre ensemble.`) +
      B.p(`C'est pour ça que j'ai créé l'offre Duo : <b>70 € pour deux</b>, soit 35 € chacune au lieu de 47 €. Transfère-lui cet email : c'est peut-être le petit coup de pouce qu'elle attendait aussi.`) +
      B.btn('On le fait à deux', u('a4', '#tarifs')) + SIGN },
    5: { day: 7, subject: 'Les 3 questions qu\'on me pose le plus', kicker: 'Tes questions', title: 'Avant de te lancer', body:
      B.p(hi) + B.p(`Avant de te lancer, tu te poses peut-être ces questions :`) +
      B.list(['<b>« Combien de temps ça me prend ? »</b> Le temps de préparer tes repas avec les guides, la plupart en 5 à 15 minutes. Tout se fait depuis chez toi.', '<b>« Vais-je avoir faim ? »</b> Tu manges à ta faim : fruits et légumes à volonté pendant la détox, repas complets ensuite.', '<b>« Et si les résultats tardent ? »</b> Tu suis le plan à 100 % et tu perds moins de 2 kg en 21 jours ? Je te rembourse intégralement.']) +
      B.p(`Une autre question ? Réponds simplement à cet email, je te réponds personnellement. La prochaine édition démarre <b>${ed}</b>.`) +
      B.btn('Je rejoins le Challenge 21', u('a5', '#tarifs')) + SIGN +
      B.ps(`Envie d'un suivi individuel ? C'est possible en ligne ou en présentiel, avec moi ou un coach de mon équipe.`) }
  };
  return map[step];
}

const PLAN = { G: [2, 4, 6, 8, 11], A: [1, 2, 3, 5, 7] };

exports.handler = async function () {
  if (!process.env.BREVO_API_KEY) { console.error('BREVO_API_KEY manquante.'); return { statusCode: 500 }; }
  const listId = await setup();
  if (!listId) { console.error('Liste introuvable.'); return { statusCode: 500 }; }
  const today = new Date(parisDate() + 'T00:00:00Z');
  let offset = 0, sent = 0, seen = 0;
  while (true) {
    const r = await api(`/contacts/lists/${listId}/contacts?limit=500&offset=${offset}`);
    const contacts = (r.data && r.data.contacts) || [];
    for (const ct of contacts) {
      seen++;
      const at = ct.attributes || {};
      if (ct.emailBlacklisted) continue;
      if (at.ACHAT) {
        if (at.REEQ_ENVOYE || !at.EDITION_DATE) continue;
        const d0 = new Date(String(at.EDITION_DATE).slice(0, 10) + 'T00:00:00Z');
        const dd = Math.floor((today - d0) / 86400000);
        if (dd < 5 || dd > 11) continue;
        const jour8 = frDate(new Date(d0.getTime() + 7 * 86400000));
        const s2 = await sendEmail(ct.email, at.PRENOM || '', (at.PRENOM ? at.PRENOM + ', t' : 'T') + 'on Guide Rééquilibrage est arrivé', reeqEmail(at.PRENOM || '', jour8, ct.email), 'guide-reequilibrage');
        if (s2.ok) { sent++; await api('/contacts/' + encodeURIComponent(ct.email), 'PUT', { attributes: { REEQ_ENVOYE: parisDate() } }); }
        else console.error('Guide rééquilibrage', ct.email, JSON.stringify(s2.data));
        continue;
      }
      if (!at.INSCRIT_LE) continue;
      const src = String(at.SOURCE || '').toLowerCase();
      const seq = src === 'guide' ? 'G' : (src === 'test' || src === 'presentation' ? 'A' : null);
      if (!seq) continue;
      const days = Math.floor((today - new Date(String(at.INSCRIT_LE).slice(0, 10) + 'T00:00:00Z')) / 86400000);
      const done = parseInt(at.SEQ_ETAPE || 0, 10) || 0;
      let due = 0;
      PLAN[seq].forEach((d, i) => { if (days >= d) due = i + 1; });
      if (due <= done) continue;
      if (days - PLAN[seq][due - 1] > 2) { await api('/contacts/' + encodeURIComponent(ct.email), 'PUT', { attributes: { SEQ_ETAPE: due } }); continue; }
      const c = { prenom: at.PRENOM || '', profil: at.PROFIL };
      const m = seq === 'G' ? G(due, c) : A(due, c);
      const html = layout({ kicker: m.kicker, title: m.title, body: m.body, email: ct.email });
      const s = await sendEmail(ct.email, c.prenom, m.subject, html, 'sequence-' + seq + due);
      if (s.ok) { sent++; await api('/contacts/' + encodeURIComponent(ct.email), 'PUT', { attributes: { SEQ_ETAPE: due } }); }
      else console.error('Envoi', ct.email, seq + due, JSON.stringify(s.data));
    }
    if (contacts.length < 500) break;
    offset += 500;
  }
  console.log(`Séquences : ${seen} contacts vus, ${sent} emails envoyés.`);
  return { statusCode: 200, body: JSON.stringify({ seen, sent }) };
};

// Pour l'aperçu local
exports._preview = { G, A };
