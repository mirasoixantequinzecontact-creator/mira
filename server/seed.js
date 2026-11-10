// ============================================================
//  SEED — crée les comptes et projets de départ.
//  Lancer une seule fois :  npm run seed
//  Relancer remet à zéro les données (utiles en développement).
// ============================================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

// --- Réinitialisation (ordre inverse des dépendances) ---
// (publications, statistiques et pub suivent les projets en cascade)
db.exec('UPDATE requests SET client_id = NULL; UPDATE appointments SET client_id = NULL;');
db.exec('DELETE FROM activity; DELETE FROM steps; DELETE FROM projects; DELETE FROM users;');

const hash = (pwd) => bcrypt.hashSync(pwd, 12);
// Mot de passe aléatoire si aucun n'est fourni dans .env (jamais de mot de passe connu d'avance)
const randomPwd = () => crypto.randomBytes(12).toString('base64url');

// ------------------------------------------------------------
//  COMPTES
//  ⚠ Changez ces mots de passe après la première connexion.
// ------------------------------------------------------------
const insertUser = db.prepare(
  'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)'
);

// Fondateur / équipe — accès au tableau de bord interne
const founderEmail = 'mehdipelardy@gmail.com';
const founderPwd   = process.env.SEED_ADMIN_PASSWORD || randomPwd();
const founderId = insertUser.run(founderEmail, hash(founderPwd), 'equipe', 'Fondateur').lastInsertRowid;

// Un client de démonstration — accès au suivi de SON projet uniquement
const clientEmail = 'client@atelier-voltz.com';
const clientPwd   = process.env.SEED_CLIENT_PASSWORD || randomPwd();
const clientId = insertUser.run(clientEmail, hash(clientPwd), 'client', 'Atelier Voltz').lastInsertRowid;
db.prepare('UPDATE users SET contact = ?, telephone = ? WHERE id = ?').run('Camille Voltz (démo)', '06 00 00 00 00', clientId);

// ------------------------------------------------------------
//  PROJETS
// ------------------------------------------------------------
const insertProject = db.prepare(`
  INSERT INTO projects (ref, client_user_id, client_name, name, type, status, status_label, progress, start_date, eta, pm)
  VALUES (@ref, @client_user_id, @client_name, @name, @type, @status, @status_label, @progress, @start_date, @eta, @pm)
`);
const insertStep = db.prepare(
  'INSERT INTO steps (project_id, position, title, descr, state, when_label) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertActivity = db.prepare(
  'INSERT INTO activity (project_id, time_label, text) VALUES (?, ?, ?)'
);

// Pipeline standard : génère 6 étapes cohérentes avec le % d'avancement
const PIPELINE = [
  ['Brief & cadrage',         'Réunion de lancement et collecte des besoins.'],
  ['Stratégie de marque',     'Positionnement et territoire de marque.'],
  ['Création & design',       'Conception des identités et maquettes.'],
  ['Production & intégration','Développement et mise en forme des livrables.'],
  ['Révisions',               'Allers-retours et ajustements finaux.'],
  ['Livraison',               'Remise des fichiers et mise en ligne.']
];
function seedSteps(projectId, progress) {
  const per = 100 / PIPELINE.length;
  const currentIndex = progress >= 100 ? PIPELINE.length : Math.floor(progress / per);
  PIPELINE.forEach(([title, descr], i) => {
    let state = 'todo', when = 'À venir';
    if (i < currentIndex) { state = 'done'; when = 'Terminé'; }
    else if (i === currentIndex) { state = 'current'; when = 'En cours'; }
    insertStep.run(projectId, i, title, descr, state, when);
  });
}

// Projet détaillé du client connecté (Atelier Voltz)
const voltz = insertProject.run({
  ref:'MIRA-2026-014', client_user_id:clientId, client_name:'Atelier Voltz',
  name:'Vidéos & community management — Atelier Voltz', type:'mira Essentiel + Management',
  status:'encours', status_label:'En cours', progress:60,
  start_date:'12 mai 2026', eta:'Suivi mensuel', pm:'Équipe mira'
}).lastInsertRowid;
// Étapes sur mesure pour ce projet
[
  ['Appel découverte',       'Objectifs : remplir la salle en semaine, rajeunir le compte.', 'done',    '12 mai 2026'],
  ['Proposition & planning', 'Formats Fragments + Mirage, 8 publications par mois.',        'done',    '20 mai 2026'],
  ['Tournage',               'Captation en salle et en cuisine.',                           'done',    '3 juin 2026'],
  ['Montage',                'Montage, étalonnage, sous-titres.',                           'current', 'En cours'],
  ['Validation',             'Vous validez les contenus avant diffusion.',                  'todo',    'À venir'],
  ['Publication & suivi',    'Mise en ligne et suivi des résultats.',                       'todo',    'À venir']
].forEach((s, i) => insertStep.run(voltz, i, s[0], s[1], s[2], s[3]));
[
  ['Auj.', 'Nouveau contenu à valider : « Reel — le brunch du dimanche ».'],
  ['2 j',  'Campagne Meta « Brunch » lancée.'],
  ['5 j',  'Tournage de la carte d’automne terminé.']
].forEach(a => insertActivity.run(voltz, a[0], a[1]));

// Autres projets — visibles dans le tableau de bord équipe
const others = [
  { ref:'MIRA-2026-013', client_name:'Maison Lieu',     name:'Série vidéo de marque',     type:'Production vidéo',  status:'attente', status_label:'En attente client', progress:35, start_date:'02 juin 2026', eta:'28 juin 2026', pm:'Équipe mira' },
  { ref:'MIRA-2026-012', client_name:'Studio Norr',     name:'Pilotage réseaux sociaux',  type:'Réseaux sociaux',   status:'encours', status_label:'En cours',          progress:75, start_date:'20 mai 2026',  eta:'04 juillet 2026', pm:'Équipe mira' },
  { ref:'MIRA-2026-011', client_name:'Café des Halles', name:'Plateforme de marque',      type:'Stratégie',         status:'livre',   status_label:'Livré',             progress:100, start_date:'02 avril 2026', eta:'02 juin 2026', pm:'Équipe mira' },
  { ref:'MIRA-2026-010', client_name:'Brut & Fils',     name:'Site vitrine',              type:'Site web',          status:'encours', status_label:'En cours',          progress:48, start_date:'28 mai 2026',  eta:'18 juillet 2026', pm:'Équipe mira' },
  { ref:'MIRA-2026-009', client_name:'Onde Studio',     name:'Campagne d’acquisition',    type:'Publicité payante', status:'attente', status_label:'En attente client', progress:20, start_date:'10 juin 2026', eta:'12 juillet 2026', pm:'Équipe mira' },
  { ref:'MIRA-2026-008', client_name:'Verso Paris',     name:'Campagne d’influence',      type:'Influence',         status:'livre',   status_label:'Livré',             progress:100, start_date:'01 mai 2026', eta:'21 mai 2026', pm:'Équipe mira' }
];
others.forEach(p => {
  const id = insertProject.run({ client_user_id:null, ...p }).lastInsertRowid;
  seedSteps(id, p.progress);
  insertActivity.run(id, 'Récent', 'Projet créé et planifié.');
});

// ------------------------------------------------------------
//  TABLEAU DE BORD DE DÉMONSTRATION (Atelier Voltz) — chiffres fictifs,
//  uniquement pour voir l'interface en local. Dates calculées à partir d'aujourd'hui.
// ------------------------------------------------------------
const now = new Date();
const mois = (k) => new Date(Date.UTC(now.getFullYear(), now.getMonth() - k, 1)).toISOString().slice(0, 7);
const jour = (k) => new Date(Date.now() + k * 864e5).toISOString().slice(0, 10);
const insStat = db.prepare('INSERT INTO social_stats (project_id, mois, plateforme, abonnes, portee, vues, interactions) VALUES (?, ?, ?, ?, ?, ?, ?)');
[[5, 1840, 2900], [4, 1985, 3600], [3, 2210, 5200], [2, 2490, 7400], [1, 2860, 9800], [0, 3120, 11900]].forEach(([k, ig, tt], i) => {
  insStat.run(voltz, mois(k), 'Instagram', ig, 4200 + i * 2100, 9000 + i * 5200, 610 + i * 190);
  insStat.run(voltz, mois(k), 'TikTok', tt, 6100 + i * 4300, 15000 + i * 9800, 900 + i * 420);
});
const insPub = db.prepare(`INSERT INTO publications (project_id, date, titre, format, plateforme, statut, lien, vues, likes, commentaires, partages, note)
  VALUES (@p, @date, @titre, @format, @plateforme, @statut, @lien, @vues, @likes, @commentaires, @partages, @note)`);
[
  { date: jour(6),   titre: 'Reel — la carte d’automne',           format: 'Reel',      plateforme: 'Instagram', statut: 'prevu' },
  { date: jour(3),   titre: 'Reel — le brunch du dimanche',         format: 'Reel',      plateforme: 'Instagram', statut: 'a_valider', note: 'Version courte (15 s) pour la publicité.' },
  { date: jour(2),   titre: 'TikTok — coulisses en cuisine',        format: 'TikTok',    plateforme: 'TikTok',    statut: 'valide' },
  { date: jour(-2),  titre: 'Mirage — visite de la salle',          format: 'Reel',      plateforme: 'Instagram', statut: 'publie', vues: 18400, likes: 1210, commentaires: 64, partages: 210 },
  { date: jour(-6),  titre: 'TikTok trend — le cocktail signature', format: 'TikTok',    plateforme: 'TikTok',    statut: 'publie', vues: 42100, likes: 3900, commentaires: 180, partages: 520 },
  { date: jour(-10), titre: 'Fragments — l’équipe',                 format: 'Reel',      plateforme: 'Instagram', statut: 'publie', vues: 9600, likes: 740, commentaires: 38, partages: 61 },
  { date: jour(-14), titre: 'Carrousel — menu du midi',             format: 'Carrousel', plateforme: 'Instagram', statut: 'publie', vues: 5200, likes: 410, commentaires: 22, partages: 30 },
  { date: jour(-20), titre: 'Fichiers vidéo HD — tournage de juin', format: 'Vidéo',     plateforme: 'Fichier',   statut: 'publie', note: 'Lien de téléchargement envoyé par e-mail.' },
].forEach(x => insPub.run({ p: voltz, lien: null, vues: null, likes: null, commentaires: null, partages: null, note: null, ...x }));
const insAd = db.prepare('INSERT INTO ads (project_id, mois, plateforme, campagne, objectif, budget, depense, impressions, clics, resultats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
insAd.run(voltz, mois(2), 'Meta', 'Afterwork du jeudi', 'Messages', 300, 296.4, 48200, 1320, 74);
insAd.run(voltz, mois(1), 'Meta', 'Afterwork du jeudi', 'Messages', 300, 300, 52900, 1510, 88);
insAd.run(voltz, mois(1), 'TikTok', 'Cocktail signature', 'Notoriété', 150, 148.2, 61000, 690, 0);
insAd.run(voltz, mois(0), 'Meta', 'Brunch du dimanche', 'Réservations', 400, 212.5, 30100, 940, 41);

console.log('\n✓ Base initialisée.\n');
console.log('  Équipe  →  ' + founderEmail + '  /  ' + founderPwd);
console.log('  Client  →  ' + clientEmail + '  /  ' + clientPwd + '   (projet MIRA-2026-014)');
console.log('\n  ⚠ Changez ces mots de passe après la première connexion.\n');
