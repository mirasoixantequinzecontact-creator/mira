// ============================================================
//  SERVEUR — Express + authentification email/mot de passe.
//  - Mots de passe hachés (bcrypt), jamais stockés en clair.
//  - Sessions côté serveur (cookie httpOnly), régénérées à la connexion.
//  - Rôles 'equipe' / 'client' vérifiés CÔTÉ SERVEUR.
//  - Limitation des tentatives de connexion et des envois de formulaire.
//  - En-têtes de sécurité (CSP, anti-iframe, nosniff…).
//  - Ne sert QUE les pages publiques listées (jamais le dossier server/).
// ============================================================
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const bcrypt = require('bcryptjs');
const { db } = require('./db');

const app = express();
const ROOT = path.join(__dirname, '..');           // dossier contenant les .html
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ------------------------------------------------------------
//  Secret de session — obligatoire et solide en production
// ------------------------------------------------------------
const SECRET = process.env.SESSION_SECRET || '';
const weakSecret = SECRET.length < 32 || /remplacez|changez/i.test(SECRET);
if (weakSecret) {
  if (IS_PROD) {
    console.error('\n  ✗ SESSION_SECRET absent ou trop faible. Générez-en un :');
    console.error('    node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
  }
  console.warn('\n  ⚠ SESSION_SECRET faible — acceptable en local uniquement.\n');
}

// Données de démonstration : jamais créées automatiquement en production
const hasUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
if (hasUsers === 0 && !IS_PROD) {
  console.log('Aucun compte utilisateur trouvé. Initialisation des données de démonstration…');
  require('./seed');
}

app.disable('x-powered-by');
if (IS_PROD) app.set('trust proxy', 1);            // derrière un proxy HTTPS (Render, Nginx…)

// ------------------------------------------------------------
//  En-têtes de sécurité
// ------------------------------------------------------------
// Prise de RDV : par défaut, l'agenda du site lui-même (aucun domaine tiers).
// Cal.com ou Calendly restent possibles : leurs domaines ne sont autorisés que si
// BOOKING_PROVIDER le demande (doit correspondre à SITE.booking.provider dans assets/js/config.js).
const BOOKING_DOMAINS = {
  cal:      { script: ['https://app.cal.com'], frame: ['https://app.cal.com', 'https://cal.com'], connect: ['https://app.cal.com'], style: [] },
  calendly: { script: ['https://assets.calendly.com'], frame: ['https://calendly.com'], connect: [], style: ['https://assets.calendly.com'] }
}[process.env.BOOKING_PROVIDER || 'interne'] || { script: [], frame: [], connect: [], style: [] };

const CSP = [
  "default-src 'self'",
  ["script-src 'self' 'unsafe-inline'", ...BOOKING_DOMAINS.script].join(' '),
  // RGPD : aucune ressource tierce au chargement (polices hébergées dans /fonts) —
  // le navigateur du visiteur ne contacte que notre serveur, sauf s'il ouvre l'agenda.
  ["style-src 'self' 'unsafe-inline'", ...BOOKING_DOMAINS.style].join(' '),
  "font-src 'self'",
  "img-src 'self' data:",
  ["connect-src 'self'", ...BOOKING_DOMAINS.connect].join(' '),
  BOOKING_DOMAINS.frame.length ? ['frame-src', ...BOOKING_DOMAINS.frame].join(' ') : "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'"
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '20kb' }));

// ------------------------------------------------------------
//  Anti-CSRF : les appels POST de l'API doivent être en JSON et
//  provenir du site lui-même (en-tête Origin vérifié s'il est présent).
// ------------------------------------------------------------
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') return next();
  // req.is() renvoie null sans corps (ex. DELETE), false si le corps n'est pas du JSON
  if (req.is('application/json') === false) return res.status(415).json({ error: 'Format non pris en charge.' });
  const origin = req.get('origin');
  if (origin) {
    let host;
    try { host = new URL(origin).host; } catch (_) { host = null; }
    if (host !== req.get('host')) return res.status(403).json({ error: 'Origine refusée.' });
  }
  next();
});

// ------------------------------------------------------------
//  Limiteur de débit en mémoire (par IP)
// ------------------------------------------------------------
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
const formLimiter  = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: 'Trop de demandes envoyées. Réessayez plus tard.' });
const bookLimiter  = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: 'Trop de réservations envoyées. Réessayez plus tard.' });

// --- Sessions persistées dans la même base SQLite ---
app.use(session({
  name: 'mira.sid',
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 }
  }),
  secret: SECRET || 'dev-only-secret-ne-pas-utiliser-en-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,                // 7 jours
    secure: IS_PROD                                 // HTTPS en production
  }
}));

// ------------------------------------------------------------
//  Middlewares d'accès
// ------------------------------------------------------------
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Non authentifié.' });
  next();
}
function requireTeam(req, res, next) {
  if (req.session.user?.role !== 'equipe') return res.status(403).json({ error: 'Accès réservé aux équipes.' });
  next();
}

// ------------------------------------------------------------
//  API — Authentification
// ------------------------------------------------------------
// Hash factice : la vérification prend le même temps que l'email existe ou non
const DUMMY_HASH = bcrypt.hashSync('mira-dummy-password', 10);

app.post('/api/login', loginLimiter, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 254);
  const password = String(req.body.password || '').slice(0, 200);
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
  // Même message si l'email n'existe pas ou si le mot de passe est faux
  if (!user || !ok) return res.status(401).json({ error: 'Identifiants incorrects.' });

  // Nouvel identifiant de session à chaque connexion (anti fixation de session)
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur.' });
    req.session.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    req.session.save(() => res.json({ user: req.session.user }));
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('mira.sid');
    res.json({ ok: true });
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// ------------------------------------------------------------
//  API — Projets
// ------------------------------------------------------------
// Liste (équipe : tous · client : les siens)
app.get('/api/my-projects', requireAuth, (req, res) => {
  const u = req.session.user;
  const rows = u.role === 'equipe'
    ? db.prepare('SELECT * FROM projects ORDER BY id DESC').all()
    : db.prepare('SELECT * FROM projects WHERE client_user_id = ? ORDER BY id DESC').all(u.id);
  res.json(rows.map(summary));
});

// Liste complète — équipe uniquement (tableau de bord)
app.get('/api/projects', requireAuth, requireTeam, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY id DESC').all();
  res.json(rows.map(summary));
});

// Détail d'un projet par référence
app.get('/api/projects/:ref', requireAuth, (req, res) => {
  const u = req.session.user;
  const p = db.prepare('SELECT * FROM projects WHERE ref = ?').get(String(req.params.ref).slice(0, 40).toUpperCase());
  // Un client ne peut consulter que SON projet — même réponse 404 pour ne pas
  // révéler l'existence des références des autres clients
  if (!p || (u.role !== 'equipe' && p.client_user_id !== u.id)) {
    return res.status(404).json({ error: 'Projet introuvable.' });
  }
  const steps = db.prepare('SELECT * FROM steps WHERE project_id = ? ORDER BY position').all(p.id);
  const activity = db.prepare('SELECT * FROM activity WHERE project_id = ? ORDER BY id DESC').all(p.id);
  res.json({
    name: p.name, ref: p.ref, start: p.start_date, status: p.status_label,
    pm: p.pm, type: p.type, eta: p.eta, progress: p.progress,
    steps: steps.map(s => ({ state: s.state, title: s.title, when: s.when_label, desc: s.descr })),
    activity: activity.map(a => ({ time: a.time_label, text: a.text }))
  });
});

function summary(p) {
  return {
    client: p.client_name, ref: p.ref, type: p.type,
    status: p.status, label: p.status_label, progress: p.progress, eta: p.eta
  };
}

// ------------------------------------------------------------
//  API — Demandes de rendez-vous (formulaire public)
// ------------------------------------------------------------
const RDV_FIELDS = {
  prenom: 80, nom: 80, entreprise: 120, email: 254, telephone: 30,
  situation: 60, raison: 3000, date_dispo: 10, heure_dispo: 5
};
const RDV_REQUIRED = ['prenom', 'nom', 'entreprise', 'email', 'telephone', 'situation', 'raison'];

app.post('/api/rendez-vous', formLimiter, (req, res) => {
  const b = req.body || {};
  // Champ piège invisible : rempli uniquement par les robots
  if (b.site_web) return res.json({ ok: true });

  const data = {};
  for (const [k, max] of Object.entries(RDV_FIELDS)) data[k] = String(b[k] ?? '').trim().slice(0, max);
  if (!b.consent) return res.status(400).json({ error: 'Merci d’accepter l’utilisation de vos informations pour être recontacté.' });
  if (RDV_REQUIRED.some(k => !data[k])) return res.status(400).json({ error: 'Merci de remplir tous les champs obligatoires.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  if (!/^[+\d][\d\s().-]{5,}$/.test(data.telephone)) return res.status(400).json({ error: 'Numéro de téléphone invalide.' });

  // consent_at : preuve horodatée du consentement (RGPD, art. 7.1)
  db.prepare(`
    INSERT INTO requests (prenom, nom, entreprise, email, telephone, situation, raison, date_dispo, heure_dispo, consent_at)
    VALUES (@prenom, @nom, @entreprise, @email, @telephone, @situation, @raison, @date_dispo, @heure_dispo, datetime('now'))
  `).run(data);
  res.json({ ok: true });
});

// Liste des demandes — équipe uniquement
app.get('/api/requests', requireAuth, requireTeam, (req, res) => {
  res.json(db.prepare('SELECT * FROM requests ORDER BY id DESC LIMIT 200').all());
});

// Suppression d'une demande — droit à l'effacement (RGPD, art. 17)
app.delete('/api/requests/:id', requireAuth, requireTeam, (req, res) => {
  const r = db.prepare('DELETE FROM requests WHERE id = ?').run(Number(req.params.id) || 0);
  if (!r.changes) return res.status(404).json({ error: 'Demande introuvable.' });
  res.json({ ok: true });
});

// ------------------------------------------------------------
//  API — Agenda de réservation (appel de 20 min)
//  Horaires : server/disponibilites.js. Tout est calculé à l'heure de Paris,
//  quel que soit le fuseau du serveur.
// ------------------------------------------------------------
const DISPO = require('./disponibilites');

// Date et heure de Paris actuelles, au format « AAAA-MM-JJTHH:MM »
function parisNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Arithmétique sur des dates « locales » : on les traite comme de l'UTC
const toMs = (local) => Date.parse(local + 'Z');
const fromMs = (ms) => new Date(ms).toISOString().slice(0, 16);
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Créneaux libres : { 'AAAA-MM-JJ': ['10:00', '10:30', …] } (jours sans créneau omis)
function freeSlots() {
  const now = parisNow();
  const earliest = fromMs(toMs(now) + DISPO.delaiMinHeures * 3600e3).replace('T', ' ');
  const taken = new Set(db.prepare("SELECT date || ' ' || heure AS k FROM appointments WHERE statut = 'confirme' AND date >= ?")
    .all(now.slice(0, 10)).map(r => r.k));
  const fermes = new Set(DISPO.fermetures || []);
  const step = DISPO.dureeMin + (DISPO.pauseMin || 0);
  const days = {};
  for (let i = 0; i <= DISPO.horizonJours; i++) {
    const date = fromMs(toMs(now.slice(0, 10) + 'T00:00') + i * 864e5).slice(0, 10);
    if (fermes.has(date)) continue;
    const plages = (DISPO.plages || {})[new Date(date + 'T00:00Z').getUTCDay()] || [];
    const slots = [];
    for (const [debut, fin] of plages) {
      for (let t = toMin(debut); t + DISPO.dureeMin <= toMin(fin); t += step) {
        const k = `${date} ${toHHMM(t)}`;
        if (k >= earliest && !taken.has(k)) slots.push(toHHMM(t));
      }
    }
    if (slots.length) days[date] = slots;
  }
  return days;
}

app.get('/api/creneaux', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ dureeMin: DISPO.dureeMin, jours: freeSlots() });
});

const APPT_FIELDS = { prenom: 80, nom: 80, etablissement: 120, email: 254, telephone: 30, pack: 60, message: 1000, date: 10, heure: 5 };
const APPT_REQUIRED = ['prenom', 'nom', 'etablissement', 'email', 'telephone', 'date', 'heure'];

app.post('/api/rdv', bookLimiter, (req, res) => {
  const b = req.body || {};
  if (b.site_web) return res.json({ ok: true });     // champ piège : robots
  const data = {};
  for (const [k, max] of Object.entries(APPT_FIELDS)) data[k] = String(b[k] ?? '').trim().slice(0, max);
  if (!b.consent) return res.status(400).json({ error: 'Merci d’accepter l’utilisation de vos informations pour organiser l’appel.' });
  if (APPT_REQUIRED.some(k => !data[k])) return res.status(400).json({ error: 'Merci de remplir tous les champs obligatoires.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  if (!/^[+\d][\d\s().-]{5,}$/.test(data.telephone)) return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
  // Le créneau doit faire partie des créneaux encore libres (horaires, délai, déjà pris)
  if (!(freeSlots()[data.date] || []).includes(data.heure)) {
    return res.status(409).json({ error: 'Ce créneau n’est plus disponible. Choisissez-en un autre.' });
  }
  try {
    db.prepare(`
      INSERT INTO appointments (date, heure, prenom, nom, etablissement, email, telephone, pack, message, consent_at)
      VALUES (@date, @heure, @prenom, @nom, @etablissement, @email, @telephone, @pack, @message, datetime('now'))
    `).run(data);
  } catch (e) {
    // Index unique : deux personnes ont validé le même créneau au même moment
    if (/UNIQUE/.test(e.message)) return res.status(409).json({ error: 'Ce créneau vient d’être réservé. Choisissez-en un autre.' });
    throw e;
  }
  res.json({ ok: true, date: data.date, heure: data.heure, dureeMin: DISPO.dureeMin });
});

// Rendez-vous — équipe uniquement : à venir, puis les 50 derniers passés
app.get('/api/rdv', requireAuth, requireTeam, (req, res) => {
  const today = parisNow().slice(0, 10);
  res.json({
    aVenir: db.prepare('SELECT * FROM appointments WHERE date >= ? ORDER BY date, heure').all(today),
    passes: db.prepare('SELECT * FROM appointments WHERE date < ? ORDER BY date DESC, heure DESC LIMIT 50').all(today)
  });
});

// Annulation (libère le créneau) ou suppression définitive (droit à l'effacement)
app.post('/api/rdv/:id/annuler', requireAuth, requireTeam, (req, res) => {
  const r = db.prepare("UPDATE appointments SET statut = 'annule' WHERE id = ?").run(Number(req.params.id) || 0);
  if (!r.changes) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
  res.json({ ok: true });
});
app.delete('/api/rdv/:id', requireAuth, requireTeam, (req, res) => {
  const r = db.prepare('DELETE FROM appointments WHERE id = ?').run(Number(req.params.id) || 0);
  if (!r.changes) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
  res.json({ ok: true });
});

// Durée de conservation (RGPD, art. 5.1.e) : les demandes et rendez-vous de plus
// de 3 ans sont supprimés automatiquement, au démarrage puis chaque jour.
function purgeOldRequests() {
  const r = db.prepare("DELETE FROM requests WHERE created_at < datetime('now', '-3 years')").run();
  const a = db.prepare("DELETE FROM appointments WHERE created_at < datetime('now', '-3 years')").run();
  if (r.changes + a.changes) console.log(`  RGPD : ${r.changes + a.changes} demande(s) ou rendez-vous de plus de 3 ans supprimé(s).`);
}
purgeOldRequests();
setInterval(purgeOldRequests, 24 * 60 * 60 * 1000).unref();

app.use('/api', (req, res) => res.status(404).json({ error: 'Ressource introuvable.' }));

// ------------------------------------------------------------
//  Pages protégées (défense en profondeur) — redirige vers la
//  connexion si la session ne correspond pas, AVANT de servir le HTML.
// ------------------------------------------------------------
app.get(['/espace-equipe.html', '/espace-equipe'], (req, res, next) => {
  if (req.session.user?.role !== 'equipe') return res.redirect('/connexion.html');
  next();
});
app.get(['/suivi.html', '/suivi'], (req, res, next) => {
  if (!req.session.user) return res.redirect('/connexion.html');
  next();
});

// ------------------------------------------------------------
//  Pages publiques — liste blanche. Rien d'autre n'est servi :
//  ni server/ (base de données, code, .env), ni fichiers de configuration.
// ------------------------------------------------------------
const PUBLIC_PAGES = new Set([
  'index', 'connexion', 'rendez-vous', 'suivi', 'espace-equipe',
  'mentions-legales', 'confidentialite'
]);
app.use('/fonts', express.static(path.join(ROOT, 'fonts'), { maxAge: '30d', index: false }));
app.use('/assets', express.static(path.join(ROOT, 'assets'), { maxAge: '7d', index: false }));
// Vidéos : express.static gère les requêtes Range (lecture progressive, avance rapide)
app.use('/videos', express.static(path.join(ROOT, 'videos'), { maxAge: '7d', index: false }));
// SEO : fichiers racine (jamais connexion, suivi ni espace-equipe dans le sitemap)
app.get('/robots.txt', (req, res) => res.type('text/plain').sendFile(path.join(ROOT, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.type('application/xml').sendFile(path.join(ROOT, 'sitemap.xml')));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/:page', (req, res, next) => {
  const name = req.params.page.replace(/\.html$/, '');
  if (!PUBLIC_PAGES.has(name)) return next();
  res.sendFile(path.join(ROOT, name + '.html'));
});

// Page 404 à l'image de la marque (statut 404 conservé)
app.use((req, res) => res.status(404).sendFile(path.join(ROOT, '404.html')));

app.listen(PORT, () => {
  console.log(`\n  Mira — serveur démarré sur http://localhost:${PORT}\n`);
});
