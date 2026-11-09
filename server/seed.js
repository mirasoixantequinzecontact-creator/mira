// ============================================================
//  SEED — crée les comptes et projets de départ.
//  Lancer une seule fois :  npm run seed
//  Relancer remet à zéro les données (utiles en développement).
// ============================================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');

// --- Réinitialisation (ordre inverse des dépendances) ---
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
  name:'Refonte de marque — Atelier Voltz', type:'Marque + Web',
  status:'encours', status_label:'En cours', progress:60,
  start_date:'12 mai 2026', eta:'10 juillet 2026', pm:'Équipe Mira'
}).lastInsertRowid;
// Étapes sur mesure pour ce projet
[
  ['Brief & cadrage',          'Réunion de lancement et collecte des besoins.', 'done',    '12 mai 2026'],
  ['Stratégie de marque',      'Positionnement et territoire validés.',          'done',    '26 mai 2026'],
  ['Création & design',        'Conception des identités et maquettes.',         'current', 'En cours'],
  ['Production & intégration', 'Développement et mise en forme des livrables.',  'todo',    'À venir'],
  ['Révisions',                'Allers-retours et ajustements finaux.',          'todo',    'À venir'],
  ['Livraison',                'Remise des fichiers et mise en ligne.',          'todo',    'À venir']
].forEach((s, i) => insertStep.run(voltz, i, s[0], s[1], s[2], s[3]));
[
  ['Auj.', 'Maquettes de la page d’accueil partagées pour relecture.'],
  ['2 j',  'Validation de la direction artistique B.'],
  ['5 j',  'Atelier de cadrage stratégique terminé.']
].forEach(a => insertActivity.run(voltz, a[0], a[1]));

// Autres projets — visibles dans le tableau de bord équipe
const others = [
  { ref:'MIRA-2026-013', client_name:'Maison Lieu',     name:'Série vidéo de marque',     type:'Production vidéo',  status:'attente', status_label:'En attente client', progress:35, start_date:'02 juin 2026', eta:'28 juin 2026', pm:'Équipe Mira' },
  { ref:'MIRA-2026-012', client_name:'Studio Norr',     name:'Pilotage réseaux sociaux',  type:'Réseaux sociaux',   status:'encours', status_label:'En cours',          progress:75, start_date:'20 mai 2026',  eta:'04 juillet 2026', pm:'Équipe Mira' },
  { ref:'MIRA-2026-011', client_name:'Café des Halles', name:'Plateforme de marque',      type:'Stratégie',         status:'livre',   status_label:'Livré',             progress:100, start_date:'02 avril 2026', eta:'02 juin 2026', pm:'Équipe Mira' },
  { ref:'MIRA-2026-010', client_name:'Brut & Fils',     name:'Site vitrine',              type:'Site web',          status:'encours', status_label:'En cours',          progress:48, start_date:'28 mai 2026',  eta:'18 juillet 2026', pm:'Équipe Mira' },
  { ref:'MIRA-2026-009', client_name:'Onde Studio',     name:'Campagne d’acquisition',    type:'Publicité payante', status:'attente', status_label:'En attente client', progress:20, start_date:'10 juin 2026', eta:'12 juillet 2026', pm:'Équipe Mira' },
  { ref:'MIRA-2026-008', client_name:'Verso Paris',     name:'Campagne d’influence',      type:'Influence',         status:'livre',   status_label:'Livré',             progress:100, start_date:'01 mai 2026', eta:'21 mai 2026', pm:'Équipe Mira' }
];
others.forEach(p => {
  const id = insertProject.run({ client_user_id:null, ...p }).lastInsertRowid;
  seedSteps(id, p.progress);
  insertActivity.run(id, 'Récent', 'Projet créé et planifié.');
});

console.log('\n✓ Base initialisée.\n');
console.log('  Équipe  →  ' + founderEmail + '  /  ' + founderPwd);
console.log('  Client  →  ' + clientEmail + '  /  ' + clientPwd + '   (projet MIRA-2026-014)');
console.log('\n  ⚠ Changez ces mots de passe après la première connexion.\n');
