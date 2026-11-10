// ============================================================
//  GESTION — clients, projets et tableau de bord client.
//  - Équipe : crée / modifie / supprime clients et projets, convertit un appel
//    réservé ou une demande en client, saisit publications, statistiques et pub.
//  - Client : lit le tableau de bord de SES projets, valide les contenus.
//  Monté par server.js : require('./gestion')(app, { db, requireAuth, requireTeam }).
// ============================================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Étapes créées avec chaque nouveau projet (modifiables ensuite)
const ETAPES_DEFAUT = [
  ['Appel découverte', 'On fait connaissance avec votre lieu et vos objectifs.'],
  ['Proposition & planning', 'Choix des formats, dates de tournage et de publication.'],
  ['Tournage', 'Captation sur place.'],
  ['Montage', 'Montage, étalonnage, sous-titres.'],
  ['Validation', 'Vous validez les contenus avant diffusion.'],
  ['Publication & suivi', 'Mise en ligne et suivi des résultats.'],
];

const STATUTS_PROJET = { encours: 'En cours', attente: 'En attente client', livre: 'Livré' };

// Champs autorisés par type de donnée du tableau de bord.
// Types : text (≤ 300 car.), long (≤ 2000), int, num, date (AAAA-MM-JJ), month (AAAA-MM), url, ou liste de valeurs.
const RESSOURCES = {
  publications: {
    table: 'publications', requis: ['date', 'titre'], ordre: 'date DESC, id DESC',
    champs: {
      date: 'date', titre: 'text', format: 'text', plateforme: 'text',
      statut: ['prevu', 'a_valider', 'valide', 'publie'], lien: 'url',
      vues: 'int', likes: 'int', commentaires: 'int', partages: 'int', note: 'long',
    },
  },
  stats: {
    table: 'social_stats', requis: ['mois', 'plateforme'], ordre: 'mois, plateforme',
    unique: ['mois', 'plateforme'],                  // une ligne par mois et par réseau
    champs: { mois: 'month', plateforme: 'text', abonnes: 'int', portee: 'int', vues: 'int', interactions: 'int' },
  },
  pubs: {
    table: 'ads', requis: ['mois', 'campagne'], ordre: 'mois DESC, id DESC',
    champs: {
      mois: 'month', plateforme: 'text', campagne: 'text', objectif: 'text',
      budget: 'num', depense: 'num', impressions: 'int', clics: 'int', resultats: 'int',
    },
  },
};

function clean(type, v) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim();
  if (Array.isArray(type)) return type.includes(s) ? s : undefined;
  switch (type) {
    case 'text': return s.slice(0, 300);
    case 'long': return s.slice(0, 2000);
    case 'int': { const n = parseInt(s.replace(/[\s ]/g, ''), 10); return Number.isFinite(n) && n >= 0 ? n : undefined; }
    case 'num': { const n = parseFloat(s.replace(/[\s €]/g, '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined; }
    case 'date': return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
    case 'month': return /^\d{4}-\d{2}$/.test(s) ? s : undefined;
    case 'url': return /^https?:\/\/\S+$/i.test(s) ? s.slice(0, 500) : undefined;
    default: return undefined;
  }
}
// Renvoie { data } ou { error } — undefined = valeur refusée
function parse(champs, body, requis = []) {
  const data = {};
  for (const [k, type] of Object.entries(champs)) {
    if (!(k in body)) continue;
    const v = clean(type, body[k]);
    if (v === undefined) return { error: `Valeur invalide : ${k}.` };
    data[k] = v;
  }
  for (const k of requis) if (data[k] == null) return { error: 'Merci de remplir les champs obligatoires.' };
  return { data };
}

const randomPassword = () => crypto.randomBytes(9).toString('base64url');   // 12 caractères
const dateLabel = () => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' }).format(new Date());

module.exports = function gestion(app, { db, requireAuth, requireTeam }) {

  // ---- Accès à un projet : équipe = tous, client = les siens (même 404 sinon) ----
  function projectFor(req, res) {
    const p = db.prepare('SELECT * FROM projects WHERE ref = ?').get(String(req.params.ref).slice(0, 40).toUpperCase());
    const u = req.session.user;
    if (!p || (u.role !== 'equipe' && p.client_user_id !== u.id)) { res.status(404).json({ error: 'Projet introuvable.' }); return null; }
    return p;
  }
  const log = (projectId, text) => db.prepare('INSERT INTO activity (project_id, time_label, text) VALUES (?, ?, ?)').run(projectId, dateLabel(), text);

  // Prochaine référence : MIRA-AAAA-NNN
  function nextRef() {
    const year = new Date().getFullYear();
    const last = db.prepare("SELECT ref FROM projects WHERE ref LIKE ? ORDER BY ref DESC LIMIT 1").get(`MIRA-${year}-%`);
    const n = last ? parseInt(last.ref.split('-')[2], 10) + 1 : 1;
    return `MIRA-${year}-${String(n).padStart(3, '0')}`;
  }

  const createProject = db.transaction((clientId, clientName, p) => {
    const ref = nextRef();
    const id = db.prepare(`
      INSERT INTO projects (ref, client_user_id, client_name, name, type, status, status_label, progress, start_date, eta, pm)
      VALUES (?, ?, ?, ?, ?, 'encours', 'En cours', 0, ?, ?, ?)
    `).run(ref, clientId, clientName, p.name, p.type || null, p.start_date || dateLabel(), p.eta || null, p.pm || 'Équipe mira').lastInsertRowid;
    const ins = db.prepare('INSERT INTO steps (project_id, position, title, descr, state, when_label) VALUES (?, ?, ?, ?, ?, ?)');
    ETAPES_DEFAUT.forEach(([t, d], i) => ins.run(id, i, t, d, i === 0 ? 'current' : 'todo', i === 0 ? 'En cours' : 'À venir'));
    log(id, 'Projet créé.');
    return ref;
  });

  // ============================================================
  //  CLIENTS (équipe)
  // ============================================================
  const CLIENT_CHAMPS = { name: 'text', email: 'text', contact: 'text', telephone: 'text', notes: 'long' };

  app.get('/api/clients', requireAuth, requireTeam, (req, res) => {
    const clients = db.prepare("SELECT id, name, email, contact, telephone, notes, created_at FROM users WHERE role = 'client' ORDER BY name COLLATE NOCASE").all();
    const projets = db.prepare('SELECT ref, name, status, status_label FROM projects WHERE client_user_id = ? ORDER BY id DESC');
    res.json(clients.map(c => ({ ...c, projets: projets.all(c.id) })));
  });

  // Création — éventuellement à partir d'un appel réservé ou d'une demande (conversion)
  app.post('/api/clients', requireAuth, requireTeam, (req, res) => {
    const b = req.body || {};
    const { data, error } = parse(CLIENT_CHAMPS, b, ['name', 'email']);
    if (error) return res.status(400).json({ error });
    data.email = data.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email)) return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });

    const source = b.source && { rdv: 'appointments', demande: 'requests' }[b.source.type];
    const password = randomPassword();
    let ref = null;
    const id = db.transaction(() => {
      const id = db.prepare(`INSERT INTO users (email, password_hash, role, name, contact, telephone, notes) VALUES (?, ?, 'client', ?, ?, ?, ?)`)
        .run(data.email, bcrypt.hashSync(password, 12), data.name, data.contact ?? null, data.telephone ?? null, data.notes ?? null).lastInsertRowid;
      const projet = b.projet && clean('text', b.projet.name);
      if (projet) ref = createProject(id, data.name, { name: projet, type: clean('text', b.projet.type), eta: clean('text', b.projet.eta) });
      if (source) db.prepare(`UPDATE ${source} SET client_id = ? WHERE id = ?`).run(id, Number(b.source.id) || 0);
      return id;
    })();
    res.json({ ok: true, id, email: data.email, password, ref });
  });

  app.put('/api/clients/:id', requireAuth, requireTeam, (req, res) => {
    const { data, error } = parse(CLIENT_CHAMPS, req.body || {});
    if (error) return res.status(400).json({ error });
    if (data.email) {
      data.email = data.email.toLowerCase();
      if (db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?').get(data.email, Number(req.params.id))) return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });
    }
    const keys = Object.keys(data);
    if (!keys.length) return res.json({ ok: true });
    const r = db.prepare(`UPDATE users SET ${keys.map(k => `${k} = @${k}`).join(', ')} WHERE id = @id AND role = 'client'`).run({ ...data, id: Number(req.params.id) || 0 });
    if (!r.changes) return res.status(404).json({ error: 'Client introuvable.' });
    if (data.name) db.prepare('UPDATE projects SET client_name = ? WHERE client_user_id = ?').run(data.name, Number(req.params.id));
    res.json({ ok: true });
  });

  // Nouveau mot de passe (à transmettre au client) — l'ancien cesse de fonctionner
  app.post('/api/clients/:id/mot-de-passe', requireAuth, requireTeam, (req, res) => {
    const password = randomPassword();
    const r = db.prepare("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'client'").run(bcrypt.hashSync(password, 12), Number(req.params.id) || 0);
    if (!r.changes) return res.status(404).json({ error: 'Client introuvable.' });
    res.json({ ok: true, password });
  });

  // Suppression : le compte, ses projets et tout leur contenu (étapes, publications, stats, pub)
  app.delete('/api/clients/:id', requireAuth, requireTeam, (req, res) => {
    const id = Number(req.params.id) || 0;
    const done = db.transaction(() => {
      if (!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'client'").get(id)) return false;
      db.prepare('DELETE FROM projects WHERE client_user_id = ?').run(id);
      db.prepare('UPDATE requests SET client_id = NULL WHERE client_id = ?').run(id);
      db.prepare('UPDATE appointments SET client_id = NULL WHERE client_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return true;
    })();
    if (!done) return res.status(404).json({ error: 'Client introuvable.' });
    res.json({ ok: true });
  });

  // ============================================================
  //  PROJETS (équipe)
  // ============================================================
  app.post('/api/projects', requireAuth, requireTeam, (req, res) => {
    const b = req.body || {};
    const name = clean('text', b.name);
    if (!name) return res.status(400).json({ error: 'Donnez un nom au projet.' });
    const client = b.client_id ? db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'client'").get(Number(b.client_id)) : null;
    const clientName = client ? client.name : clean('text', b.client_name);
    if (!clientName) return res.status(400).json({ error: 'Choisissez un client.' });
    const ref = createProject(client ? client.id : null, clientName, { name, type: clean('text', b.type), eta: clean('text', b.eta) });
    res.json({ ok: true, ref });
  });

  const PROJET_CHAMPS = { name: 'text', type: 'text', status: Object.keys(STATUTS_PROJET), progress: 'int', start_date: 'text', eta: 'text', pm: 'text' };
  app.put('/api/projects/:ref', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const { data, error } = parse(PROJET_CHAMPS, req.body || {});
    if (error) return res.status(400).json({ error });
    if (data.name === null) return res.status(400).json({ error: 'Le projet doit avoir un nom.' });
    if (data.progress != null) data.progress = Math.min(100, data.progress);
    if (data.status) data.status_label = STATUTS_PROJET[data.status];
    if ('client_id' in (req.body || {})) {
      const c = req.body.client_id ? db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'client'").get(Number(req.body.client_id)) : null;
      data.client_user_id = c ? c.id : null;
      if (c) data.client_name = c.name;
    }
    const keys = Object.keys(data);
    if (keys.length) db.prepare(`UPDATE projects SET ${keys.map(k => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...data, id: p.id });
    res.json({ ok: true });
  });

  app.delete('/api/projects/:ref', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    db.prepare('DELETE FROM projects WHERE id = ?').run(p.id);     // cascade : étapes, activité, publications, stats, pub
    res.json({ ok: true });
  });

  // Étapes : la liste complète est remplacée
  app.put('/api/projects/:ref/etapes', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const list = Array.isArray(req.body?.etapes) ? req.body.etapes.slice(0, 20) : null;
    if (!list) return res.status(400).json({ error: 'Liste d’étapes invalide.' });
    const steps = list.map(s => ({
      title: clean('text', s.title), descr: clean('long', s.desc) ?? null,
      state: ['done', 'current', 'todo'].includes(s.state) ? s.state : 'todo', when_label: clean('text', s.when) ?? null,
    })).filter(s => s.title);
    db.transaction(() => {
      db.prepare('DELETE FROM steps WHERE project_id = ?').run(p.id);
      const ins = db.prepare('INSERT INTO steps (project_id, position, title, descr, state, when_label) VALUES (?, ?, ?, ?, ?, ?)');
      steps.forEach((s, i) => ins.run(p.id, i, s.title, s.descr, s.state, s.when_label));
    })();
    res.json({ ok: true });
  });

  // Fil d'activité visible par le client
  app.post('/api/projects/:ref/activite', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const text = clean('long', req.body?.text);
    if (!text) return res.status(400).json({ error: 'Message vide.' });
    log(p.id, text);
    res.json({ ok: true });
  });
  app.delete('/api/projects/:ref/activite/:id', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    db.prepare('DELETE FROM activity WHERE id = ? AND project_id = ?').run(Number(req.params.id) || 0, p.id);
    res.json({ ok: true });
  });

  // ============================================================
  //  TABLEAU DE BORD — publications, statistiques réseaux, publicité
  // ============================================================
  app.get('/api/projects/:ref/tableau', requireAuth, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const out = {};
    for (const [key, r] of Object.entries(RESSOURCES)) out[key] = db.prepare(`SELECT * FROM ${r.table} WHERE project_id = ? ORDER BY ${r.ordre}`).all(p.id);
    res.json(out);
  });

  app.post('/api/projects/:ref/:res(publications|stats|pubs)', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const r = RESSOURCES[req.params.res];
    const { data, error } = parse(r.champs, req.body || {}, r.requis);
    if (error) return res.status(400).json({ error });
    const keys = Object.keys(data);
    const upsert = r.unique ? ` ON CONFLICT(project_id, ${r.unique.join(', ')}) DO UPDATE SET ${keys.filter(k => !r.unique.includes(k)).map(k => `${k} = excluded.${k}`).join(', ') || 'project_id = project_id'}` : '';
    const info = db.prepare(`INSERT INTO ${r.table} (project_id, ${keys.join(', ')}) VALUES (@project_id, ${keys.map(k => '@' + k).join(', ')})${upsert}`)
      .run({ ...data, project_id: p.id });
    if (r.table === 'publications' && data.statut === 'a_valider') log(p.id, `Nouveau contenu à valider : « ${data.titre} ».`);
    res.json({ ok: true, id: info.lastInsertRowid });
  });

  app.put('/api/projects/:ref/:res(publications|stats|pubs)/:id', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const r = RESSOURCES[req.params.res];
    const { data, error } = parse(r.champs, req.body || {});
    if (error) return res.status(400).json({ error });
    if (r.requis.some(k => k in data && data[k] == null)) return res.status(400).json({ error: 'Merci de remplir les champs obligatoires.' });
    const keys = Object.keys(data);
    if (!keys.length) return res.json({ ok: true });
    try {
      const info = db.prepare(`UPDATE ${r.table} SET ${keys.map(k => `${k} = @${k}`).join(', ')} WHERE id = @id AND project_id = @project_id`)
        .run({ ...data, id: Number(req.params.id) || 0, project_id: p.id });
      if (!info.changes) return res.status(404).json({ error: 'Élément introuvable.' });
    } catch (e) {
      if (/UNIQUE/.test(e.message)) return res.status(409).json({ error: 'Ce mois existe déjà pour ce réseau.' });
      throw e;
    }
    res.json({ ok: true });
  });

  app.delete('/api/projects/:ref/:res(publications|stats|pubs)/:id', requireAuth, requireTeam, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    db.prepare(`DELETE FROM ${RESSOURCES[req.params.res].table} WHERE id = ? AND project_id = ?`).run(Number(req.params.id) || 0, p.id);
    res.json({ ok: true });
  });

  // Le client valide un contenu avant diffusion (ou demande une modification)
  app.post('/api/projects/:ref/publications/:id/avis', requireAuth, (req, res) => {
    const p = projectFor(req, res); if (!p) return;
    const pub = db.prepare("SELECT * FROM publications WHERE id = ? AND project_id = ? AND statut = 'a_valider'").get(Number(req.params.id) || 0, p.id);
    if (!pub) return res.status(404).json({ error: 'Ce contenu n’est plus en attente de validation.' });
    const ok = req.body?.decision === 'valider';
    const remarque = clean('long', req.body?.remarque);
    if (!ok && !remarque) return res.status(400).json({ error: 'Dites-nous ce qu’il faut modifier.' });
    db.prepare('UPDATE publications SET statut = ?, note = ? WHERE id = ?')
      .run(ok ? 'valide' : 'prevu', ok ? pub.note : `Modification demandée : ${remarque}`, pub.id);
    log(p.id, ok ? `Contenu validé par le client : « ${pub.titre} ».` : `Modification demandée sur « ${pub.titre} » : ${remarque}`);
    res.json({ ok: true });
  });
};

