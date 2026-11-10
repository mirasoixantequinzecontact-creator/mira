// ============================================================
//  BASE DE DONNÉES — SQLite (fichier local mira.db, zéro config)
//  Crée les tables au premier lancement si elles n'existent pas.
// ============================================================
const path = require('path');
const Database = require('better-sqlite3');
// .env chargé ici aussi : seed.js et password.js utilisent la base sans passer par server.js
require('dotenv').config({ path: path.join(__dirname, '.env') });

// DB_PATH : chemin configurable (ex. disque persistant monté en production)
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'mira.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');                  // suppression en cascade (projet → étapes, publications…)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('equipe','client')),
    name          TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ref            TEXT UNIQUE NOT NULL,
    client_user_id INTEGER REFERENCES users(id),
    client_name    TEXT NOT NULL,
    name           TEXT NOT NULL,
    type           TEXT,
    status         TEXT NOT NULL DEFAULT 'encours',  -- code : encours | attente | livre
    status_label   TEXT NOT NULL DEFAULT 'En cours',
    progress       INTEGER NOT NULL DEFAULT 0,
    start_date     TEXT,
    eta            TEXT,
    pm             TEXT
  );

  CREATE TABLE IF NOT EXISTS steps (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    position   INTEGER NOT NULL,
    title      TEXT NOT NULL,
    descr      TEXT,
    state      TEXT NOT NULL DEFAULT 'todo',          -- done | current | todo
    when_label TEXT
  );

  CREATE TABLE IF NOT EXISTS activity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    time_label TEXT,
    text       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Demandes envoyées depuis le formulaire « Démarrer un projet »
  CREATE TABLE IF NOT EXISTS requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    prenom      TEXT NOT NULL,
    nom         TEXT NOT NULL,
    entreprise  TEXT NOT NULL,
    email       TEXT NOT NULL,
    telephone   TEXT NOT NULL,
    situation   TEXT,
    raison      TEXT NOT NULL,
    date_dispo  TEXT,
    heure_dispo TEXT,
    consent_at  TEXT,                                 -- preuve du consentement RGPD
    created_at  TEXT DEFAULT (datetime('now'))
  );

  -- Appels réservés depuis l'agenda du site (date et heure de Paris)
  CREATE TABLE IF NOT EXISTS appointments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    date          TEXT NOT NULL,                      -- AAAA-MM-JJ
    heure         TEXT NOT NULL,                      -- HH:MM
    prenom        TEXT NOT NULL,
    nom           TEXT NOT NULL,
    etablissement TEXT NOT NULL,
    email         TEXT NOT NULL,
    telephone     TEXT NOT NULL,
    pack          TEXT,
    message       TEXT,
    statut        TEXT NOT NULL DEFAULT 'confirme' CHECK (statut IN ('confirme','annule')),
    consent_at    TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );
  -- Un créneau ne peut être réservé qu'une fois (les annulés le libèrent)
  CREATE UNIQUE INDEX IF NOT EXISTS appointments_slot ON appointments(date, heure) WHERE statut = 'confirme';

  -- ---------- Tableau de bord client (saisi par l'équipe, visible par le client) ----------
  -- Publications et livrables : tout ce qui est produit, à valider, publié ou livré
  CREATE TABLE IF NOT EXISTS publications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date         TEXT NOT NULL,                       -- AAAA-MM-JJ (publication ou livraison)
    titre        TEXT NOT NULL,
    format       TEXT,                                -- Reel, Post, Story, TikTok, Vidéo, Photo…
    plateforme   TEXT,                                -- Instagram, TikTok, Facebook, YouTube, Fichier
    statut       TEXT NOT NULL DEFAULT 'prevu',       -- prevu | a_valider | valide | publie
    lien         TEXT,
    vues         INTEGER,
    likes        INTEGER,
    commentaires INTEGER,
    partages     INTEGER,
    note         TEXT
  );

  -- Statistiques mensuelles des comptes du client
  CREATE TABLE IF NOT EXISTS social_stats (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mois         TEXT NOT NULL,                       -- AAAA-MM
    plateforme   TEXT NOT NULL,
    abonnes      INTEGER,
    portee       INTEGER,                             -- comptes touchés
    vues         INTEGER,
    interactions INTEGER,
    UNIQUE (project_id, mois, plateforme)
  );

  -- Publicité payante : budget et résultats par campagne et par mois
  CREATE TABLE IF NOT EXISTS ads (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mois         TEXT NOT NULL,                       -- AAAA-MM
    plateforme   TEXT,                                -- Meta, TikTok, Google
    campagne     TEXT NOT NULL,
    objectif     TEXT,                                -- Notoriété, Trafic, Messages, Réservations…
    budget       REAL,                                -- € prévus
    depense      REAL,                                -- € dépensés
    impressions  INTEGER,
    clics        INTEGER,
    resultats    INTEGER                              -- selon l'objectif (messages, réservations…)
  );
`);

// Migration : ajoute consent_at aux bases créées avant cette colonne
const reqCols = db.prepare('PRAGMA table_info(requests)').all().map(c => c.name);
if (!reqCols.includes('consent_at')) db.exec('ALTER TABLE requests ADD COLUMN consent_at TEXT');

// Migrations : fiche client et suivi des conversions (prospect → client)
const addCol = (table, col, type) => {
  if (!db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
};
addCol('users', 'contact', 'TEXT');                 // personne à contacter
addCol('users', 'telephone', 'TEXT');
addCol('users', 'notes', 'TEXT');                   // interne, jamais montré au client
addCol('requests', 'client_id', 'INTEGER');         // client créé à partir de cette demande
addCol('appointments', 'client_id', 'INTEGER');

module.exports = { db };
